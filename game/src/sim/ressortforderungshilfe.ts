// Konkrete Antworten auf Ergebnisforderungen; vorhandene Regeln buchen alle Handlungen.
import type { World } from './types';
import type { RessortNachsorge } from './ressortnachsorge';
import type { RessortForderung } from './ressortrueckhalt';
import { HOCH_SCHLECHT, wertVon } from './personen';
import { ressortEntspannt } from './ressortanliegen';
import { schritteFuer } from './gespraeche';
import { bringeEin, pruefeVorhaben, stufeIn, gesetzPrognose, stimmenKaufen, gesetzeAbstimmen, REGELN, STIMMEN_PUFFER } from './handeln';
import { POSTEN, POSTEN_NACH_ID, stufeVon, inSpanne, postenVorschau, setzePosten } from './haushalt';
import { haushaltsStand, type HaushaltsStand } from './haushaltsbericht';
import { fraktionsUebersicht, verhandle } from './verhandeln';
import { neuanfangGrund, AUFMERKSAMKEIT_KOSTEN } from './aufmerksamkeit';
import { naechsteKoalitionspruefung } from './koalitionslage';
import { zusagenDruck } from './zusagendruck';
import { NET } from './modell';
import { addDays } from './dates';
import { Rng } from './rng';
import { t } from '../i18n';

export type RessortHilfeAktion={art:'gesetz';id:string;ziel:number}|{art:'laufend';id:string}|{art:'etat';id:string;ziel:number};
export type RessortKompromiss={art:'gespraech'|'zugestaendnis'|'duldung'|'koalition';partei:string}|{art:'absprache'};
export interface RessortHilfeRef { beobachtung:string;forderung:string }
export interface RessortHilfePlan {
 ref:RessortHilfeRef;aktion:RessortHilfeAktion;kompromiss?:RessortKompromiss;stand:string;moeglich:boolean;grund?:string;
 name:string;von:number;ziel:number;pk:number;aufmerksamkeit:number;kapitalDanach:number;aufmerksamkeitDanach:number;
 fach:{id:string;heute:number;ziel:number;frist:string;naechsteMeldung:string;richtung:1|-1;verzoegerung:number;monate:number;begrenzt:boolean};
 kostenBip:number;vorher:HaushaltsStand;sofort:HaushaltsStand;annahme?:HaushaltsStand;
 vertrauen:{vorher:number;sofort:number;annahme?:number};
 votum?:ReturnType<typeof gesetzPrognose>;ohneKompromiss?:number;
 zusagen:import('./spiel-typen').Zusage[];duldungBis?:string;
 risiken:{partei:string;name:string;loyalitaet:number;datum:string;sitze:number;phase:'sofort'|'annahme'}[];
 druck:ReturnType<typeof zusagenDruck>[];
}
export interface RessortHilfeBeleg {tag:number;datum:string;forderung:string;aktion:RessortHilfeAktion;kompromiss?:RessortKompromiss;name:string;pk:number;aufmerksamkeit:number;vorher:HaushaltsStand;nachher:HaushaltsStand;gesetz?:string;zusagen:import('./spiel-typen').Zusage[]}
const richtung=(id:string):1|-1=>HOCH_SCHLECHT.has(id)?-1:1;
export function heutigeRessortForderung(w:World,r:RessortHilfeRef){
 const n=w.spiel?.ministerfluss?.ressortNachsorge?.find(n=>n.id===r.beobachtung&&n.status!=='abgeloest');
 const f=n?.rueckhalt?.forderungen.find(f=>f.id===r.forderung);
 return n&&f?{n,f}:undefined;
}
export function ressortForderungsSperre(w:World,r:RessortHilfeRef):string|undefined {
 const x=heutigeRessortForderung(w,r);
 if(!x||x.f.status!=='offen'||w.spiel?.ende||(w.parliament?.seats[x.f.partei]??0)<=0||x.f.partei===w.player?.partei.kurz)return t('rh.veraltet');
 const v=wertVon(w,x.f.groesse);
 if(richtung(x.f.groesse)*(v-x.f.ziel)>=-1e-8||ressortEntspannt(x.f.groesse,v))return t('rh.messungOffen');
 return;
}
function wirkung(id:string,groesse:string){return NET.edges.filter(e=>e.from===id&&e.to===groesse).reduce((sum,e)=>sum+e.weight,0);}
function basisAktionen(w:World,n:RessortNachsorge,f:RessortForderung):RessortHilfeAktion[]{
 const minister=w.spiel!.figuren.find(p=>p.imAmt&&p.amt===n.amt),dir=richtung(f.groesse),out:RessortHilfeAktion[]=[];
 // Bereits laufende Gesetze erscheinen mit ihrer tatsächlichen Fassung, nicht als zweite Einbringung.
 for(const g of w.spiel!.gesetze)if(wirkung(g.massnahme,f.groesse)*(g.stufe-stufeIn(w,g.massnahme,null))*dir>0&&!g.provinzen?.length)out.push({art:'laufend',id:g.id});
 if(minister){
  const k=structuredClone(w),p=k.spiel!.figuren.find(p=>p.id===minister.id)!;
  for(const s of schritteFuer(k,p,f.groesse,dir,3)){
   if(w.spiel!.gesetze.some(g=>g.massnahme===s.id))continue;
   // Ein bereits hilfreiches Landesziel erst umsetzen lassen, statt es erneut zu bezahlen.
   const current=stufeIn(w,s.id,null),target=w.net.targets[s.id];
   if((s.nach-current)*wirkung(s.id,f.groesse)*dir<=0)continue;
   if(target!==undefined&&(target-current)*wirkung(s.id,f.groesse)*dir>1e-6)continue;
   out.push({art:'gesetz',id:s.id,ziel:s.nach});
   if(Math.abs(s.nach-current)>10)out.push({art:'gesetz',id:s.id,ziel:Math.round(current+Math.sign(s.nach-current)*10)});
  }
 }
 const etatWelt=structuredClone(w);
 for(const p of POSTEN){
  const d=[...p.sofort,...p.dauer].filter(e=>e.id===f.groesse).reduce((s,e)=>s+e.d,0);if(!d)continue;
  const heute=stufeVon(etatWelt,p.id),ziel=inSpanne(p,heute+Math.sign(d*dir));if(ziel!==heute)out.push({art:'etat',id:p.id,ziel});
 }
 return out;
}
const gleich=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
function ausfuehren(w:World,a:RessortHilfeAktion,k?:RessortKompromiss){
 const pause=neuanfangGrund(w);if(pause)return {ok:false,text:pause};
 if(k&&k.art!=='absprache'){
  const rng=new Rng(w.rngState),r=verhandle(w,k.partei,k.art,rng);if(!r.ok)return r;w.rngState=rng.state;
 }
 if(a.art==='gesetz'){const r=bringeEin(w,a.id,a.ziel,null,'gesetz');if(!r.ok)return r;}
 if(a.art==='etat'){if(k)return {ok:false,text:t('rh.veraltet')};return setzePosten(w,a.id,a.ziel);}
 const g=w.spiel!.gesetze.find(g=>a.art==='laufend'?g.id===a.id:g.massnahme===a.id);if(!g)return {ok:false,text:t('rh.veraltet')};
 if(k?.art==='absprache'){
  const n=Math.max(0,REGELN.mehrheit+STIMMEN_PUFFER-gesetzPrognose(w,g).ja);
  if(!n)return {ok:false,text:t('rh.keinPufferNoetig')};return stimmenKaufen(w,g.id,n);
 }
 return {ok:true,text:t(a.art==='laufend'?'rh.verhandelt':'rh.eingebracht')};
}
function risiken(w:World,s:HaushaltsStand,datum:string,phase:'sofort'|'annahme'):RessortHilfePlan['risiken'] {
 return s.parteien.filter(p=>p.rolle==='koalition').flatMap(p=>p.personen.filter(f=>f.loyalitaet<20).map(f=>({partei:p.partei,name:f.name,loyalitaet:f.loyalitaet,datum,sitze:p.sitze,phase})));
}

/** Rein lesende Vorschau: Paket und bedingte Annahme verwenden die echten Spielhandlungen auf getrennten Kopien. */
export function ressortForderungsPlan(w:World,ref:RessortHilfeRef,aktion:RessortHilfeAktion,kompromiss?:RessortKompromiss):RessortHilfePlan|undefined {
 const x=heutigeRessortForderung(w,ref);if(!x)return;
 return planeRessortHilfe(w,ref,aktion,basisAktionen(w,x.n,x.f),kompromiss);
}
function planeRessortHilfe(w:World,ref:RessortHilfeRef,aktion:RessortHilfeAktion,katalog:RessortHilfeAktion[],kompromiss?:RessortKompromiss,basis?:RessortHilfePlan):RessortHilfePlan|undefined {
 const x=heutigeRessortForderung(w,ref);if(!x||ressortForderungsSperre(w,ref))return;
 const {n,f}=x;if(!katalog.some(a=>gleich(a,aktion))||aktion.art==='etat'&&kompromiss)return;
 if(kompromiss&&!['gespraech','zugestaendnis','duldung','koalition','absprache'].includes(kompromiss.art))return;
 const id=aktion.art==='laufend'?w.spiel!.gesetze.find(g=>g.id===aktion.id)!.massnahme:aktion.id;
 const von=aktion.art==='etat'?stufeVon(structuredClone(w),id):stufeIn(w,id,null),ziel=aktion.art==='laufend'?w.spiel!.gesetze.find(g=>g.id===aktion.id)!.stufe:aktion.ziel;
 const etat=aktion.art==='etat'?POSTEN_NACH_ID[id]:undefined,pr=etat?undefined:pruefeVorhaben(structuredClone(w),id,ziel,null);
 const k=structuredClone(w),vorher=haushaltsStand(k),pk=k.spiel!.kapital,auf=k.spiel!.verfassung?.aufmerksamkeit??80,z=new Set(k.spiel!.zusagen.map(z=>z.id));
 const r=ausfuehren(k,aktion,kompromiss);
 // Gesperrte Pakete dürfen auch in der Anzeige keine Teilreaktionen suggerieren.
 const nach=r.ok?k:structuredClone(w),sofort=haushaltsStand(nach);
 let g=nach.spiel!.gesetze.find(g=>aktion.art==='laufend'?g.id===aktion.id:g.massnahme===id);
 if(!g&&!etat){
  const q=structuredClone(w);q.spiel!.kapital=10000;
  if(bringeEin(q,id,ziel,null,'gesetz').ok)g=q.spiel!.gesetze.find(g=>g.massnahme===id);
 }
 const votum=g?gesetzPrognose(nach,g):undefined;
 let annahme:HaushaltsStand|undefined,vertrauenAnnahme:number|undefined;
 if(g){
  const q=structuredClone(nach);q.day=Math.max(q.day,g.abstimmung);q.date=addDays(w.date,q.day-w.day);q.spiel!.gesetze=[structuredClone(g)];
  // Nur der Annahmezweig, ausdrücklich keine Prognose des Abstimmungsausgangs oder künftiger Monatswerte.
  const rng=new Rng(q.rngState);rng.normal=()=>600;gesetzeAbstimmen(q,rng);annahme=haushaltsStand(q);vertrauenAnnahme=wertVon(q,'vertrauen_regierung');
 }
 const fv=kompromiss&&kompromiss.art!=='absprache'?fraktionsUebersicht(structuredClone(w)).find(p=>p.partei===kompromiss.partei)?.aktionen.find(a=>a.id===kompromiss.art):undefined;
 const nominal=(aktion.art==='gesetz'?pr!.gesetz.pk:etat?postenVorschau(structuredClone(w),id,ziel).kapital:0)+(fv?.pk??0)+
  (kompromiss?.art==='absprache'&&votum?Math.ceil(Math.max(0,REGELN.mehrheit+STIMMEN_PUFFER-votum.ja)*REGELN.kaufKostenProStimme):0);
 const nominalAufmerksamkeit=(aktion.art==='gesetz'?AUFMERKSAMKEIT_KOSTEN.gesetz:0)+(kompromiss?AUFMERKSAMKEIT_KOSTEN[kompromiss.art==='absprache'?'stimmenkauf':kompromiss.art==='gespraech'?'verhandlungGespraech':kompromiss.art]:0);
 const kanten=NET.edges.filter(e=>e.from===id&&e.to===f.groesse);
 const base=kompromiss?(basis??planeRessortHilfe(w,ref,aktion,katalog)):undefined;
 const p:RessortHilfePlan={ref,aktion,kompromiss,stand:'',moeglich:r.ok&&!(aktion.art==='laufend'&&!kompromiss),grund:!r.ok?r.text:aktion.art==='laufend'&&!kompromiss?t('rh.laeuft'):undefined,
  name:etat?.name??NET.nodes[NET.index.get(id)!]!.name,von,ziel,pk:r.ok?pk-k.spiel!.kapital:nominal,
  aufmerksamkeit:r.ok?auf-(k.spiel!.verfassung?.aufmerksamkeit??80):nominalAufmerksamkeit,
  kapitalDanach:r.ok?k.spiel!.kapital:pk,aufmerksamkeitDanach:r.ok?k.spiel!.verfassung?.aufmerksamkeit??80:auf,
  fach:{id:f.groesse,heute:wertVon(w,f.groesse),ziel:f.ziel,frist:f.fristDatum,naechsteMeldung:addDays(w.date,Math.max(w.day,n.naechsteMeldung)-w.day),richtung:richtung(f.groesse),verzoegerung:etat?0:Math.max(0,...kanten.map(e=>e.lag)),monate:etat?.reifeMonate??pr!.monate,begrenzt:!etat&&Math.abs(ziel-von)<=10},
  kostenBip:etat?postenVorschau(structuredClone(w),id,ziel).impuls:pr!.kostenBip,vorher,sofort,annahme,votum,ohneKompromiss:base?.votum?.ja,
  vertrauen:{vorher:wertVon(w,'vertrauen_regierung'),sofort:wertVon(nach,'vertrauen_regierung'),annahme:vertrauenAnnahme},
  zusagen:structuredClone(nach.spiel!.zusagen.filter(v=>!z.has(v.id))),
  duldungBis:kompromiss?.art==='duldung'&&r.ok?addDays(w.date,(nach.spiel!.fraktionen?.[kompromiss.partei]?.duldungBis??w.day)-w.day):undefined,
  risiken:[...risiken(nach,sofort,naechsteKoalitionspruefung(w.date),'sofort'),...(annahme&&votum?risiken(nach,annahme,naechsteKoalitionspruefung(votum.datum,true),'annahme'):[])],
  druck:[...new Set(nach.spiel!.lager)].map(p=>zusagenDruck(nach,p)).filter(Boolean)};
 p.stand=JSON.stringify({tag:w.day,datum:w.date,rng:w.rngState,kapital:w.spiel!.kapital,verfassung:w.spiel!.verfassung,figuren:w.spiel!.figuren,fraktionen:w.spiel!.fraktionen,lager:w.spiel!.lager,sitze:w.parliament?.seats,zusagen:w.spiel!.zusagen,gesetze:w.spiel!.gesetze,forderung:f,nachsorge:n.id,anliegen:w.spiel!.ministerfluss?.ressortAnliegen,targets:w.net.targets,etats:w.spiel!.wirtschaft?.haushalt,p});
 return p;
}
export function ressortForderungsMassnahmen(w:World,ref:RessortHilfeRef):RessortHilfePlan[]{
 const x=heutigeRessortForderung(w,ref);if(!x||ressortForderungsSperre(w,ref))return [];
 const katalog=basisAktionen(w,x.n,x.f);
 return katalog.flatMap(a=>{const p=planeRessortHilfe(w,ref,a,katalog);return p?[p]:[];});
}
export function ressortForderungsKompromisse(w:World,ref:RessortHilfeRef,a:RessortHilfeAktion):RessortHilfePlan[]{
 if(a.art==='etat')return [];
 const x=heutigeRessortForderung(w,ref);if(!x||ressortForderungsSperre(w,ref))return [];
 const katalog=basisAktionen(w,x.n,x.f),basis=planeRessortHilfe(w,ref,a,katalog);if(!basis)return [];
 const specs:RessortKompromiss[]=[{art:'absprache'}];
 for(const f of fraktionsUebersicht(structuredClone(w)))for(const art of ['gespraech','zugestaendnis','duldung','koalition'] as const)
  if(f.aktionen.some(a=>a.id===art&&a.moeglich))specs.push({art,partei:f.partei});
 return specs.flatMap(k=>{const p=planeRessortHilfe(w,ref,a,katalog,k,basis);return p&&(!p.moeglich||(p.votum?.ja??0)>(p.ohneKompromiss??0)||p.sofort.personen.some(f=>f.loyalitaet>(p.vorher.personen.find(x=>x.id===f.id)?.loyalitaet??f.loyalitaet)))?[p]:[];})
 .sort((a,b)=>Number(b.moeglich)-Number(a.moeglich)||(a.votum?.luecke??0)-(b.votum?.luecke??0)||a.risiken.length-b.risiken.length||a.pk-b.pk).slice(0,4);
}
/** Atomar: eine veraltete Karte oder eine gesperrte Teilhandlung bucht keinerlei Kosten. */
export function fuehreRessortForderungsHilfeAus(w:World,angebot:RessortHilfePlan):{ok:boolean;text:string}{
 const p=ressortForderungsPlan(w,angebot.ref,angebot.aktion,angebot.kompromiss);
 if(!p?.moeglich||p.stand!==angebot.stand)return {ok:false,text:t('rh.veraltet')};
 const k=structuredClone(w),r=ausfuehren(k,p.aktion,p.kompromiss);if(!r.ok)return r;
 const n=heutigeRessortForderung(k,p.ref)!.n;
 const gesetz=k.spiel!.gesetze.find(g=>p.aktion.art==='laufend'?g.id===p.aktion.id:g.massnahme===p.aktion.id)?.id;
 (n.hilfen??=[]).push({tag:k.day,datum:k.date,forderung:p.ref.forderung,aktion:p.aktion,kompromiss:p.kompromiss,name:p.name,pk:p.pk,aufmerksamkeit:p.aufmerksamkeit,vorher:p.vorher,nachher:haushaltsStand(k),gesetz,zusagen:p.zusagen});
 if(n.hilfen.length>12)n.hilfen.splice(0,n.hilfen.length-12);
 Object.assign(w,k);
 return {ok:true,text:t('rh.ausgefuehrt')};
}
