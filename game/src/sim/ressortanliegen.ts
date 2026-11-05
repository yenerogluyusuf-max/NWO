// Vernachlässigte Ressorts werden im Tageslauf aktiv, unabhängig davon, ob ihre Akte geöffnet wird.
import type { World } from './types';
import type { Figur } from './spiel-typen';
import { KABINETT_AMT, flussZustand } from './ministerfluss-kern';
import { AEMTER, eigenVon, schlechtesteGroesse, HOCH_SCHLECHT, wertVon, loyalitaetVerschieben, grollVerschieben, merke } from './personen';
import { schritteFuer, fuehreGespraech } from './gespraeche';
import { bringeEin, gesetzSicht } from './handeln';
import { POSTEN } from './haushalt';
import { haushaltsHilfen, haushaltsHilfePlan, fuehreHaushaltsHilfeAus, type HaushaltsHilfe } from './haushaltshilfe';
import { letzterHaushaltsBeschluss } from './haushaltsbericht';
import { defizitJetzt } from './wirtschaft';
import { wirke } from './wirkung';
import { kosten } from './ereignis-hilfen';
import { addLog } from './log';
import { addDays } from './dates';
import { NET } from './modell';
import { t } from '../i18n';
import { erfasseRessortVorfall, ressortPolitikTag } from './ressortpolitik';

const knotenName=(id:string)=>NET.nodes[NET.index.get(id)??-1]?.name??id;
export const RESSORT_ENTWARNUNG=62;
// Landesmittel können an ganzzahligen Grenzen um wenige Rechenbits abweichen.
export const ressortEntspannt=(id:string,wert:number)=>(HOCH_SCHLECHT.has(id)?wert:100-wert)<=RESSORT_ENTWARNUNG+1e-8;
// abstand: Tage zwischen zwei neuen Anliegen im ganzen Kabinett. Mit 17 Ministerien statt 7 Ämtern meldeten sich die Ressorts dreimal so oft
// (5,0 statt 1,6 Anliegen im Monat ohne Antwort des Präsidenten); nach F3 (ENTSCHEIDUNGEN W, Nachtrag) bleibt der Druck des Kabinetts in der
// Summe der von vorher. Spielparameter, am Zählwerkzeug gemessen; es spricht zuerst das Ressort mit der schlimmsten Lage.
export const RESSORT_ANLIEGEN={ruhe:30,frist:14,beratung:21,aufschub:7,maxOffen:3,abstand:18};
export type RessortAntwort='reden'|'umsetzen'|'spaeter'|'ablehnen';
export interface RessortAnliegen {
 id:string;figur:string;amt:Figur['amt'];name:string;groesse:string;vorher:number;seit:number;frist:number;
 status:'offen'|'besprochen'|'abgelehnt'|'beauftragt'|'erledigt'|'eskaliert'|'entfallen';verschoben?:boolean;
 vorschlag?:{art:'gesetz';id:string;ziel:number}|{art:'haushalt';beschluss:string;aktion:HaushaltsHilfe};
 ende?:number;
 amtsantritt?:number;
 nachsorge?:string;
}
export interface RessortFolge {
 id:string;tag:number;datum:string;name:string;amt:Figur['amt'];groesse:string;art:RessortAntwort|'eigeninitiative'|'stillstand'|'auftragVerfehlt'|'entschaerft'|'bearbeitet'|'wechsel';
 vorher:number;nachher:number;loyalitaet:number;groll:number;bip:number;legitimitaet:number;vertrauen?:number;pk?:number;aufmerksamkeit?:number;defizit?:number;
}
export interface RessortBeobachtung { figur:string;name?:string;amtsantritt?:number;seit:number;signal:string;gespraech:number }
export const ressortInhaber=(w:World,a:RessortAnliegen)=>w.spiel?.figuren.find(f=>f.id===a.figur&&f.imAmt&&f.amt===a.amt&&f.name===a.name&&(a.amtsantritt===undefined||f.eigen?.seit===a.amtsantritt));
const offen=(a:RessortAnliegen)=>['offen','besprochen','abgelehnt'].includes(a.status);
const schlecht=(w:World,id:string)=>HOCH_SCHLECHT.has(id)?wertVon(w,id):100-wertVon(w,id);
const signal=(w:World,f:Figur)=>JSON.stringify({ziele:AEMTER[f.amt].massnahmen.map(id=>[id,w.net.targets[id],w.net.ziele?.[id]]),
 etats:POSTEN.filter(p=>p.amt===f.amt).map(p=>[p.id,w.spiel?.wirtschaft?.haushalt.stufen[p.id]??0]),
 auftrag:f.eigen?.auftrag?.seit,programme:f.amt==='wirtschaft'?w.spiel?.gueter?.regierung?.programme:undefined});
export const ressortArbeitet=(w:World,f:Figur)=>w.spiel!.gesetze.some(g=>AEMTER[f.amt].massnahmen.includes(g.massnahme))
 ||Object.keys(w.spiel!.wirtschaft?.haushalt.gesetz?.schritte??{}).some(id=>POSTEN.some(p=>p.id===id&&p.amt===f.amt))
 ||(f.amt==='wirtschaft'&&Object.values(w.spiel!.gueter?.regierung?.vorlagen??{}).some(v=>v?.status==='offen'))
 ||f.eigen?.auftrag?.status==='laeuft'||w.spiel!.ministerfluss?.befehle.some(b=>b.figurId===f.id&&b.status==='laeuft');
function beleg(w:World,a:RessortAnliegen,art:RessortFolge['art'],vorher:number,loy:number,groll:number,bip=0,legitimitaet=0,vertrauen=0) {
 const f=w.spiel!.figuren.find(f=>f.id===a.figur),z=flussZustand(w);
 const r:RessortFolge={id:a.id,tag:w.day,datum:w.date,name:a.name,amt:a.amt,groesse:a.groesse,art,vorher,nachher:wertVon(w,a.groesse),loyalitaet:f&&art!=='wechsel'?f.loyalitaet-loy:0,groll:f&&art!=='wechsel'?(f.eigen?.groll??0)-groll:0,bip,legitimitaet,vertrauen};
 (z.ressortFolgen??=[]).push(r);if(z.ressortFolgen.length>40)z.ressortFolgen.splice(0,z.ressortFolgen.length-40);
 addLog(w,'ereignis',t('ra.protokoll',{name:a.name,art:t(`ra.art.${art}`),groesse:NET.nodes[NET.index.get(a.groesse)!]!.name,vor:vorher.toFixed(1),nach:r.nachher.toFixed(1)}));
 return r;
}
export function ressortEigenart(w:World,a:RessortAnliegen) {
 const f=ressortInhaber(w,a);if(!f)return;
 const e=eigenVon(w,f);return {eigen:(e.ressortKontrolleBis??0)<=w.day&&(e.ehrgeiz>=65||e.stil==='machtbewusst'||e.stil==='eitel'),faehig:e.faehigkeit>=60,kontrolleBis:e.ressortKontrolleBis};
}

export function ressortAnliegenTag(w:World):void {
 if(!w.spiel||w.spiel.ende)return;
 const z=flussZustand(w);if(z.ressortTag===w.day)return;z.ressortTag=w.day;
 ressortPolitikTag(w);
 const alle=(z.ressortAnliegen??=[]),beob=(z.ressortBeobachtung??={});
 for(const a of alle.filter(offen)) {
  const f=ressortInhaber(w,a);
  if(!f){a.status='entfallen';a.ende=w.day;beleg(w,a,'wechsel',wertVon(w,a.groesse),0,0);continue;}
  const e=eigenVon(w,f),b=beob[a.amt],neu=signal(w,f);
  // Fachliche Schritte an anderer Stelle und laufende Gesetzesarbeit zählen ebenfalls; bloßes Lesen nicht.
  if(ressortEntspannt(a.groesse,wertVon(w,a.groesse))||(b&&b.signal!==neu)||ressortArbeitet(w,f)){
   a.status='erledigt';a.ende=w.day;beleg(w,a,ressortEntspannt(a.groesse,wertVon(w,a.groesse))?'entschaerft':'bearbeitet',wertVon(w,a.groesse),f.loyalitaet,e.groll);if(b){b.seit=w.day;b.signal=neu;}continue;
  }
  // Ein Gespräch außerhalb der Karte verhindert die soziale Zurückweisung, löst die Sachfrage aber nicht.
  if(a.status==='offen'&&(f.gespraech??-1)>=a.seit){a.status='besprochen';a.frist=w.day+RESSORT_ANLIEGEN.beratung;}
  if(w.day<a.frist)continue;
  const vorher=wertVon(w,a.groesse),loy=f.loyalitaet,groll=e.groll,typ=ressortEigenart(w,a)!,richtung=HOCH_SCHLECHT.has(a.groesse)?-1:1;
  if(a.status!=='abgelehnt'){loyalitaetVerschieben(f,-2);grollVerschieben(w,f,3);}
  let bip=0,leg=0;const vertrauenVor=wertVon(w,'vertrauen_regierung'),legVor=wertVon(w,'legitimitaet');
  if(typ.eigen){
   // Begrenzte Verwaltungsinitiative: kein Gesetz, kein Kriegsbeginn und kein Umgehen parlamentarischer Sachziele.
   wirke(w,a.groesse,richtung*(typ.faehig?1.2:-0.8));bip=0.01;kosten(w,bip);wirke(w,'legitimitaet',-0.3);leg=wertVon(w,'legitimitaet')-legVor;grollVerschieben(w,f,1);
  }else{wirke(w,a.groesse,-richtung*1.5);wirke(w,'vertrauen_regierung',-0.3);}
  a.status='eskaliert';a.ende=w.day;if(b)b.seit=w.day;
  const folge=beleg(w,a,typ.eigen?'eigeninitiative':'stillstand',vorher,loy,groll,bip,leg,wertVon(w,'vertrauen_regierung')-vertrauenVor);
  erfasseRessortVorfall(w,a,folge,richtung*(folge.nachher-vorher)>1e-8);
  merke(w,f,t(typ.eigen?'ra.erinnerungEigen':'ra.erinnerungStill'));
 }
 const kandidaten=[];
 for(const amt of KABINETT_AMT){
  const f=w.spiel.figuren.find(f=>f.imAmt&&f.amt===amt);if(!f){delete beob[amt];continue;}
  eigenVon(w,f);const neu=signal(w,f),b=beob[amt];
  if(!b||b.figur!==f.id||(b.name!==undefined&&b.name!==f.name)||(b.amtsantritt!==undefined&&b.amtsantritt!==f.eigen?.seit)){beob[amt]={figur:f.id,name:f.name,amtsantritt:f.eigen?.seit,seit:w.day,signal:neu,gespraech:f.gespraech??-1};continue;}
  b.name=f.name;b.amtsantritt=f.eigen?.seit;
  const a=alle.find(a=>a.amt===amt&&offen(a));
  if(neu!==b.signal||(f.gespraech??-1)!==b.gespraech||ressortArbeitet(w,f)){b.signal=neu;b.gespraech=f.gespraech??-1;b.seit=w.day;}
  if(a)continue;
  const sg=schlechtesteGroesse(w,f);if(!sg||sg.ton!=='schlecht'){b.seit=w.day;continue;}
  if(w.day-b.seit<RESSORT_ANLIEGEN.ruhe)continue;
  kandidaten.push({f,sg});
 }
 kandidaten.sort((a,b)=>schlecht(w,b.sg.id)-schlecht(w,a.sg.id));
 for(const {f,sg} of kandidaten){
  if(alle.filter(offen).length>=RESSORT_ANLIEGEN.maxOffen)break;
  if(w.day-(z.ressortAnliegenTag??-1e9)<RESSORT_ANLIEGEN.abstand)break;
  if(legeRessortAnliegenAn(w,f,sg.id))z.ressortAnliegenTag=w.day;
 }
 const alt=alle.filter(a=>!offen(a)).slice(-20);z.ressortAnliegen=[...alt,...alle.filter(offen)];
}

/** Gemeinsamer Vorschlagsweg für Vernachlässigung und spätere Fortschrittsmeldungen. */
export function legeRessortAnliegenAn(w:World,f:Figur,groesse:string,nachsorge?:string):RessortAnliegen|undefined {
 const alle=flussZustand(w).ressortAnliegen??=[];
 const vorhanden=alle.find(a=>a.amt===f.amt&&offen(a));if(vorhanden)return vorhanden;
 if(alle.filter(offen).length>=RESSORT_ANLIEGEN.maxOffen)return;
 const a:RessortAnliegen={id:`ressort-${f.amt}-${w.day}`,figur:f.id,name:f.name,amt:f.amt,amtsantritt:f.eigen?.seit,groesse,vorher:wertVon(w,groesse),seit:w.day,frist:w.day+RESSORT_ANLIEGEN.frist,status:'offen',nachsorge};
 const hb=letzterHaushaltsBeschluss(w),hilfe=f.amt==='wirtschaft'&&hb?haushaltsHilfen(w,hb.id).find(p=>p.moeglich&&(p.aktion.art==='etat'||p.aktion.art==='programm')):undefined;
 if(hilfe)a.vorschlag={art:'haushalt',beschluss:hilfe.beschluss,aktion:hilfe.aktion};
 else{const schritt=schritteFuer(w,f,groesse,HOCH_SCHLECHT.has(groesse)?-1:1,1)[0];if(schritt)a.vorschlag={art:'gesetz',id:schritt.id,ziel:schritt.nach};}
 alle.push(a);addLog(w,'ereignis',t('ra.neu',{name:f.name,groesse:NET.nodes[NET.index.get(groesse)!]!.name,datum:addDays(w.date,RESSORT_ANLIEGEN.frist)}));
 return a;
}

function antwort(w:World,id:string,art:RessortAntwort):{ok:boolean;text:string;dialog?:{wer:string;text:string}[]} {
 const a=w.spiel?.ministerfluss?.ressortAnliegen?.find(a=>a.id===id),f=a&&ressortInhaber(w,a);
 if(!a||!f||!offen(a)||(a.status==='abgelehnt'&&art==='ablehnen')||w.day>=a.frist||w.spiel?.ende)return {ok:false,text:t('ra.veraltet')};
 const beobachtung=w.spiel!.ministerfluss?.ressortBeobachtung?.[a.amt];
 // Zwischen Tagesprüfung und Klick kann eine andere Akte das Anliegen bereits aufgegriffen haben.
 if(ressortEntspannt(a.groesse,wertVon(w,a.groesse))||(beobachtung&&beobachtung.signal!==signal(w,f))||ressortArbeitet(w,f))return {ok:false,text:t('ra.schonBearbeitet')};
 const e=eigenVon(w,f),vor=wertVon(w,a.groesse),loy=f.loyalitaet,groll=e.groll;
 let dialog:{wer:string;text:string}[]|undefined;
 const vorher={pk:w.spiel!.kapital,auf:w.spiel!.verfassung?.aufmerksamkeit??80,schulden:w.economy.debtRatio,leg:wertVon(w,'legitimitaet'),vertrauen:wertVon(w,'vertrauen_regierung'),defizit:defizitJetzt(w)};
 if(art==='reden'){
  if(a.status==='besprochen')return {ok:false,text:t('ra.bereitsGeredet')};
  const r=fuehreGespraech(w,f.id,'sorge','rat');if(!r.ok)return r;
  a.status='besprochen';a.frist=w.day+RESSORT_ANLIEGEN.beratung;dialog=r.szene;
 }else if(art==='umsetzen'){
  const v=a.vorschlag;if(!v)return {ok:false,text:t('ra.keinVorschlag')};
  const p=v.art==='haushalt'?haushaltsHilfePlan(w,v.beschluss,v.aktion):undefined;
  const r=v.art==='gesetz'?bringeEin(w,v.id,v.ziel,null,'gesetz'):p?fuehreHaushaltsHilfeAus(w,p):{ok:false,text:t('ra.veraltet')};
  if(!r.ok)return r;a.status='beauftragt';a.ende=w.day;
 }else if(art==='spaeter'){
  if(a.verschoben)return {ok:false,text:t('ra.nurEinmal')};a.verschoben=true;a.frist+=RESSORT_ANLIEGEN.aufschub;loyalitaetVerschieben(f,-1);grollVerschieben(w,f,1);
 }else if(art==='ablehnen'){
  a.status='abgelehnt';loyalitaetVerschieben(f,-3);grollVerschieben(w,f,5);
 }else return {ok:false,text:t('ra.veraltet')};
 // Suzerain: Wer gefragt hat, erinnert sich an die Antwort; die nächste Karte desselben Ministers nennt sie (ui/minister/RessortAnliegen.tsx)
 if(art!=='reden')merke(w,f,t(`ra.merke.${art}`,{groesse:knotenName(a.groesse)}));
 const b=flussZustand(w).ressortBeobachtung?.[a.amt];if(b){b.seit=w.day;b.signal=signal(w,f);b.gespraech=f.gespraech??-1;}
 const folge=beleg(w,a,art,vor,loy,groll,w.economy.debtRatio-vorher.schulden,wertVon(w,'legitimitaet')-vorher.leg,wertVon(w,'vertrauen_regierung')-vorher.vertrauen);
 folge.pk=vorher.pk-w.spiel!.kapital;folge.aufmerksamkeit=vorher.auf-(w.spiel!.verfassung?.aufmerksamkeit??80);folge.defizit=defizitJetzt(w)-vorher.defizit;
 return {ok:true,text:t(`ra.antwort.${art}`),dialog};
}
export function ressortAntwortPlan(w:World,id:string,art:RessortAntwort) {
 const a=w.spiel?.ministerfluss?.ressortAnliegen?.find(a=>a.id===id);if(!a)return;
 const k=structuredClone(w),pk=k.spiel!.kapital,auf=k.spiel!.verfassung?.aufmerksamkeit??80,befehle=new Set(k.spiel!.gesetze.map(g=>g.id));
 const r=antwort(k,id,art),neu=k.spiel!.ministerfluss!.ressortAnliegen!.find(x=>x.id===id)!;
 const g=k.spiel!.gesetze.find(g=>!befehle.has(g.id));
 const stimmen=g?gesetzSicht({...k,day:g.abstimmung,date:addDays(k.date,g.abstimmung-k.day)},g):undefined;
 const hilfe=art==='umsetzen'&&a.vorschlag?.art==='haushalt'?haushaltsHilfePlan(w,a.vorschlag.beschluss,a.vorschlag.aktion):undefined;
 const plan={id,art,ok:r.ok,grund:r.ok?undefined:r.text,pk:pk-k.spiel!.kapital,aufmerksamkeit:auf-(k.spiel!.verfassung?.aufmerksamkeit??80),
  frist:neu.frist,folge:r.ok?k.spiel!.ministerfluss!.ressortFolgen!.at(-1):undefined,
  gesetz:stimmen?{ja:stimmen.ja,tag:g!.abstimmung}:undefined,hilfe,stand:''};
 plan.stand=JSON.stringify({tag:w.day,datum:w.date,rng:w.rngState,kapital:w.spiel!.kapital,verfassung:w.spiel!.verfassung,anliegen:a,figuren:w.spiel!.figuren,gesetze:w.spiel!.gesetze,termine:w.spiel!.termine,plan});
 return plan;
}
export function beantworteRessortAnliegen(w:World,p:NonNullable<ReturnType<typeof ressortAntwortPlan>>) {
 const neu=ressortAntwortPlan(w,p.id,p.art);if(!neu?.ok||neu.stand!==p.stand)return {ok:false,text:t('ra.veraltet')};return antwort(w,p.id,p.art);
}
