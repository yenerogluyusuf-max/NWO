import { beginneRessortNachsorge } from './ressortnachsorge';
// Politische Verantwortung für konkrete Ressortvorfälle, mit derselben Rechnung vor und nach dem Klick.
import type { World } from './types';
import type { Figur } from './spiel-typen';
import type { RessortAnliegen, RessortFolge } from './ressortanliegen';
import { flussZustand } from './ministerfluss-kern';
import { eigenVon, loyalitaetVerschieben, grollVerschieben, wertVon, merke } from './personen';
import { entlasse } from './nachfolge';
import { aktiveParteivorsitzende, regierungsSitze, naechsteKoalitionspruefung } from './koalitionslage';
import { bereitschaftAendern, startBereitschaft } from './fraktionen';
import { oppositionVon, oppositionsFraktionen } from './opposition';
import { zusagenDruck } from './zusagendruck';
import { kannZahlen } from './kapital';
import { neuanfangGrund, verbrauche } from './aufmerksamkeit';
import { clamp } from './economy';
import { wirke } from './wirkung';
import { addLog } from './log';
import { t } from '../i18n';

export type RessortReaktion='stuetzen'|'zurueckpfeifen'|'entlassen';
type Phase=RessortReaktion|'vorfall';
type Rolle='koalition'|'duldung'|'opposition';
export interface RessortPolitikBeleg {
  tag:number;datum:string;art:Phase;pk:number;aufmerksamkeit:number;kapitalDanach:number;aufmerksamkeitDanach:number;
  vertrauen:number;legitimitaet:number;risikoaufschlag:number;glaubwuerdigkeit:number;
  parteien:{partei:string;rolle:Rolle;grund:string;vorher:number;nachher:number}[];
  personen:{id:string;name:string;nachfolger?:string;loyalitaetVor:number;loyalitaetNach:number;grollVor:number;grollNach:number}[];
  opposition?:{partei:string;vorher:number;nachher:number};
  kontrolleBis?:number;nachfolger?:{name:string;partei?:string;faehigkeit:number;loyalitaet:number;einarbeitungBis?:number;kommissarisch:boolean};
}
export interface RessortVorfall {
  id:string;figur:string;name:string;amt:Figur['amt'];amtsantritt:number;partei?:string;
  tag:number;datum:string;art:'eigeninitiative'|'stillstand'|'auftragVerfehlt';erfolg:boolean;folge:RessortFolge;
  reaktion:RessortPolitikBeleg;entscheidung?:RessortPolitikBeleg;nachsorgeBegonnen?:boolean;geschlossen?:'wechsel'|'ueberholt'|'verjaehrt';
  /** Tag der unbeantworteten Ressortanfrage, aus der der Vorfall wurde (fehlt in älteren Spielständen; dann aus der Kennung) */
  anfrage?:number;
}
export const RESSORT_REAKTION={stuetzen:{pk:1,aufmerksamkeit:4},zurueckpfeifen:{pk:1,aufmerksamkeit:4},entlassen:{pk:2,aufmerksamkeit:4}};
/**
 * Wie lange ein Vorfall auf eine politische Antwort wartet (Spielparameter). Vorher blieb jeder Vorfall offen, bis der Präsident reagierte
 * oder der Minister ging: Im Spielstand des Inhabers (Februar 2039) lagen sechs Vorfälle seit bis zu sieben Monaten als „Dringend“ auf dem
 * Tisch, ohne Frist und ohne Folge des Wartens. Nach 30 Tagen fragt niemand mehr nach der Verantwortung; der Sachschaden ist beim Vorfall
 * bereits gebucht, das Warten kostet nichts weiter.
 */
export const RESSORT_VORFALL_FRIST=30;
/** Spieltag, bis zu dem eine Reaktion möglich ist */
export const vorfallFrist=(v:Pick<RessortVorfall,'tag'>)=>v.tag+RESSORT_VORFALL_FRIST;
/** Tag der Anfrage, aus der der Vorfall wurde: gespeichert oder aus der Kennung `ressort-<amt>-<tag>` */
export function vorfallAnfrage(v:Pick<RessortVorfall,'id'|'tag'|'anfrage'>):number {
  if(v.anfrage!==undefined)return v.anfrage;
  const n=Number(/-(\d+)$/.exec(v.id)?.[1]);
  return Number.isFinite(n)&&n<=v.tag?n:v.tag;
}
const bereit=(w:World,p:string)=>w.spiel?.fraktionen?.[p]?.bereitschaft??startBereitschaft(w,p);
const rolle=(w:World,p:string):Rolle=>w.spiel!.lager.includes(p)?'koalition':(w.spiel!.fraktionen?.[p]?.duldungBis??0)>w.day?'duldung':'opposition';
const inhaber=(w:World,v:RessortVorfall)=>w.spiel?.figuren.find(f=>f.id===v.figur&&f.imAmt&&f.amt===v.amt&&f.name===v.name&&f.eigen?.seit===v.amtsantritt);
const offen=(w:World,v:RessortVorfall)=>!v.entscheidung&&!v.geschlossen&&w.day<vorfallFrist(v)&&!!inhaber(w,v);
export function offeneRessortVorfaelle(w:World):RessortVorfall[] {
  return (w.spiel?.ministerfluss?.ressortVorfaelle??[]).filter(v=>offen(w,v));
}
function vorher(w:World) {
  return {pk:w.spiel!.kapital,auf:w.spiel!.verfassung?.aufmerksamkeit??80,
    vertrauen:wertVon(w,'vertrauen_regierung'),leg:wertVon(w,'legitimitaet'),risiko:w.economy.riskPremium,glaub:w.economy.credibility,
    personen:w.spiel!.figuren.filter(f=>f.imAmt).map(f=>({id:f.id,name:f.name,loy:f.loyalitaet,groll:eigenVon(w,f).groll}))};
}
/** Rollenspezifische Reaktionen wirken auf die vorhandene Fraktionsbereitschaft und den aktiven Parteivorsitz. */
function politik(w:World,v:Pick<RessortVorfall,'name'|'amt'|'erfolg'|'art'|'partei'>,art:Phase,partei?:string) {
  const out:RessortPolitikBeleg['parteien']=[];
  for(const [p,sitze] of Object.entries(w.parliament?.seats??{})) {
    if(sitze<=0||p===w.player?.partei.kurz)continue;
    const r=rolle(w,p),traeger=r==='koalition'&&p===partei;
    let delta:number,loy=0,grund:string;
    if(r==='koalition') {
      if(art==='vorfall'){delta=v.erfolg?-1:traeger?-3:-1;loy=traeger?(v.erfolg?-1:-2):v.erfolg?0:-1;grund=v.erfolg?'kontrolle':'versagen';}
      else if(art==='stuetzen'){delta=traeger?4:v.erfolg?0:-1;loy=traeger?3:0;grund=traeger?'rueckhalt':'mitverantwortung';}
      else if(art==='zurueckpfeifen'){delta=traeger?-4:1;loy=traeger?-3:1;grund=traeger?'massregelung':'aufsicht';}
      else {delta=traeger?-8:2;loy=traeger?-8:1;grund=traeger?'entlassung':'neustart';}
      for(const f of aktiveParteivorsitzende(w,p))loyalitaetVerschieben(f,loy);
    }else{
      delta=art==='vorfall'?(v.erfolg?-1:-2):art==='stuetzen'?-2:art==='zurueckpfeifen'?1:2;
      grund=art==='vorfall'?'aufklaerung':art==='stuetzen'?'decken':'verantwortung';
    }
    const b=bereit(w,p);bereitschaftAendern(w,p,delta);out.push({partei:p,rolle:r,grund,vorher:b,nachher:bereit(w,p)});
  }
  const fr=oppositionsFraktionen(w),o=fr.length?oppositionVon(w):undefined;
  let opposition:RessortPolitikBeleg['opposition'];
  if(o){
    // Aktuelle parlamentarische Führung, auch unmittelbar nach einem Bündniswechsel.
    o.partei=fr[0]!.partei;
    const b=o.staerke,delta=art==='vorfall'?(v.erfolg?1:2):art==='stuetzen'?(v.erfolg?1:3):art==='zurueckpfeifen'?-1:-2;
    o.staerke=clamp(b+delta,0,100);opposition={partei:o.partei,vorher:b,nachher:o.staerke};
    const text=t(`rp.opp.${art}`,{partei:o.partei,name:v.name});
    o.zuege.push({tag:w.day,datum:w.date,art:'anfrage',text});if(o.zuege.length>40)o.zuege.splice(0,o.zuege.length-40);
    addLog(w,'ereignis',text);
  }
  return {parteien:out,opposition};
}
function beleg(w:World,b:ReturnType<typeof vorher>,art:Phase,p:ReturnType<typeof politik>):RessortPolitikBeleg {
  return {tag:w.day,datum:w.date,art,pk:b.pk-w.spiel!.kapital,aufmerksamkeit:b.auf-(w.spiel!.verfassung?.aufmerksamkeit??80),
    kapitalDanach:w.spiel!.kapital,aufmerksamkeitDanach:w.spiel!.verfassung?.aufmerksamkeit??80,
    vertrauen:wertVon(w,'vertrauen_regierung')-b.vertrauen,legitimitaet:wertVon(w,'legitimitaet')-b.leg,
    risikoaufschlag:w.economy.riskPremium-b.risiko,glaubwuerdigkeit:w.economy.credibility-b.glaub,...p,
    personen:b.personen.flatMap(x=>{const f=w.spiel!.figuren.find(f=>f.id===x.id);if(!f)return [];
      const g=eigenVon(w,f).groll;if(f.name===x.name&&f.loyalitaet===x.loy&&g===x.groll)return [];
      return [{id:x.id,name:x.name,nachfolger:f.name!==x.name?f.name:undefined,loyalitaetVor:x.loy,loyalitaetNach:f.loyalitaet,grollVor:x.groll,grollNach:g}];})};
}
/** Einmal direkt nach dem tatsächlichen Alleingang/Rückstand, keine rückwirkende Buchung für Altstände. */
export function erfasseRessortVorfall(w:World,a:RessortAnliegen,folge:RessortFolge,erfolg:boolean):void {
  if(!w.spiel||!['eigeninitiative','stillstand','auftragVerfehlt'].includes(folge.art))return;
  const z=flussZustand(w),alle=z.ressortVorfaelle??=[];
  if(alle.some(v=>v.id===a.id))return;
  const f=w.spiel.figuren.find(f=>f.id===a.figur&&f.imAmt&&f.name===a.name);if(!f)return;
  for(const v of alle)if(v.figur===f.id&&!v.entscheidung&&!v.geschlossen)v.geschlossen='ueberholt';
  const b=vorher(w),basis={id:a.id,figur:f.id,name:f.name,amt:f.amt,amtsantritt:eigenVon(w,f).seit,partei:f.partei,
    tag:w.day,datum:w.date,art:folge.art as RessortVorfall['art'],erfolg,folge:structuredClone(folge),anfrage:a.seit};
  const p=politik(w,basis,'vorfall',f.partei);
  alle.push({...basis,reaktion:beleg(w,b,'vorfall',p)});
  if(alle.length>30)alle.splice(0,alle.length-30);
}
export function ressortPolitikTag(w:World):void {
  for(const v of w.spiel?.ministerfluss?.ressortVorfaelle??[]){
    if(v.entscheidung||v.geschlossen)continue;
    if(!inhaber(w,v))v.geschlossen='wechsel';
    else if(w.day>=vorfallFrist(v))v.geschlossen='verjaehrt';
  }
}

// Auch eine Entlassung aus der vorhandenen Personenakte muss denselben Vorfall politisch beantworten.
export function ressortEntlassungStart(w:World,f:Figur) {
  const v=offeneRessortVorfaelle(w).find(v=>v.figur===f.id);
  return v?{id:v.id,partei:f.partei,vorher:vorher(w)}:undefined;
}
export function ressortEntlassungEnde(w:World,f:Figur,start:ReturnType<typeof ressortEntlassungStart>):void {
  if(!start)return;
  const v=w.spiel!.ministerfluss!.ressortVorfaelle!.find(v=>v.id===start.id);if(!v||v.entscheidung)return;
  verbrauche(w,RESSORT_REAKTION.entlassen.aufmerksamkeit,t('rp.art.entlassen'));
  const p=politik(w,v,'entlassen',start.partei),r=beleg(w,start.vorher,'entlassen',p);
  r.nachfolger={name:f.name,partei:f.partei,faehigkeit:eigenVon(w,f).faehigkeit,loyalitaet:f.loyalitaet,einarbeitungBis:f.eigen?.einarbeitungBis,kommissarisch:!!f.eigen?.kommissarisch};
  v.entscheidung=r;
  beginneRessortNachsorge(w,v);
}
export function ressortEntlassungsHinweise(w:World,f:Figur):string[] {
  const v=offeneRessortVorfaelle(w).find(v=>v.figur===f.id);if(!v)return [];
  const k=structuredClone(w),p=politik(k,v,'entlassen',f.partei);
  const text=[t('rp.entlassungZusatz',{n:RESSORT_REAKTION.entlassen.aufmerksamkeit}),...p.parteien.map(x=>`${x.partei}: ${t(`rp.grund.${x.grund}`)} ${t('rp.bereitschaft',{vor:x.vorher,nach:x.nachher})}`)];
  const risiken=[...new Set(k.spiel!.lager)].filter(p=>p!==k.player?.partei.kurz&&aktiveParteivorsitzende(k,p).some(f=>f.loyalitaet<20));
  for(const partei of w.spiel!.lager)for(const f of aktiveParteivorsitzende(w,partei)){
    const neu=k.spiel!.figuren.find(n=>n.id===f.id)!;
    text.push(t('rp.person',{name:f.name,vor:f.loyalitaet,nach:neu.loyalitaet,groll:0}));
  }
  if(risiken.length){const sitze=regierungsSitze(w),nach=sitze-risiken.reduce((s,p)=>s+(w.parliament?.seats[p]??0),0);text.push(t('rp.bruch',{datum:naechsteKoalitionspruefung(w.date),parteien:risiken.join(', '),vor:sitze,nach,fehlt:Math.max(0,301-nach)}));}
  if(p.opposition)text.push(t('rp.opposition',{partei:p.opposition.partei,vor:p.opposition.vorher,nach:p.opposition.nachher}));
  return text;
}

function reagiere(w:World,id:string,art:RessortReaktion):{ok:boolean;text:string} {
  const v=w.spiel?.ministerfluss?.ressortVorfaelle?.find(v=>v.id===id),f=v&&inhaber(w,v);
  if(!v||!f||!offen(w,v)||w.spiel?.ende||!Object.hasOwn(RESSORT_REAKTION,art))return {ok:false,text:t('rp.veraltet')};
  const d=RESSORT_REAKTION[art],pause=neuanfangGrund(w);
  if(pause)return {ok:false,text:pause};
  if(!kannZahlen(w.spiel!.kapital,d.pk))return {ok:false,text:t('rp.kapital',{n:d.pk})};
  const b=vorher(w),partei=f.partei;
  if(art==='entlassen'){
    const r=entlasse(w,v.amt,null);if(!r.ok)return r;
    // Die gemeinsame Nachfolgefunktion erfasst den Ausgang auch für andere Zugangswege.
    return {ok:true,text:t('rp.entschieden',{name:v.name,art:t('rp.art.entlassen')})};
  }else{
    w.spiel!.kapital-=d.pk;
    if(art==='stuetzen'){
      loyalitaetVerschieben(f,6);grollVerschieben(w,f,-6);
      wirke(w,'vertrauen_regierung',v.erfolg?-0.1:-0.5);if(v.art==='eigeninitiative')wirke(w,'legitimitaet',-0.3);
    }else{
      loyalitaetVerschieben(f,-5);grollVerschieben(w,f,8);
      const e=eigenVon(w,f);e.ressortKontrolleBis=w.day+60;e.druckBis=Math.max(e.druckBis??0,w.day+60);
      wirke(w,'legitimitaet',0.3);
    }
    merke(w,f,t(`rp.erinnerung.${art}`));
  }
  verbrauche(w,d.aufmerksamkeit,t(`rp.art.${art}`));
  const p=politik(w,v,art,partei),r=beleg(w,b,art,p);
  if(art==='zurueckpfeifen')r.kontrolleBis=w.day+60;
  v.entscheidung=r;
  beginneRessortNachsorge(w,v);
  // Eine Personalentscheidung erfüllt weder ein Sachgesetz noch eine Fraktionszusage.
  addLog(w,'entscheidung',t('rp.entschieden',{name:v.name,art:t(`rp.art.${art}`)}));
  return {ok:true,text:t('rp.entschieden',{name:v.name,art:t(`rp.art.${art}`)})};
}
export function ressortPolitikPlan(w:World,id:string,art:RessortReaktion) {
  if(!w.spiel)return;
  const v=w.spiel.ministerfluss?.ressortVorfaelle?.find(v=>v.id===id);if(!v)return;
  const k=structuredClone(w),r=reagiere(k,id,art),beleg=r.ok?k.spiel!.ministerfluss!.ressortVorfaelle!.find(v=>v.id===id)!.entscheidung:undefined;
  const risiken=[...new Set(k.spiel!.lager)].filter(p=>p!==k.player?.partei.kurz).flatMap(p=>{
    const fs=aktiveParteivorsitzende(k,p).filter(f=>f.loyalitaet<20);return fs.length?[{partei:p,sitze:k.parliament?.seats[p]??0,personen:fs.map(f=>({name:f.name,loyalitaet:f.loyalitaet}))}]:[];
  });
  const sitze=regierungsSitze(k),verlust=risiken.reduce((s,r)=>s+r.sitze,0);
  const plan={id,art,ok:r.ok,grund:r.ok?undefined:r.text,beleg,pk:RESSORT_REAKTION[art]?.pk??0,aufmerksamkeit:RESSORT_REAKTION[art]?.aufmerksamkeit??0,
    risiken,sitze,danach:sitze-verlust,pruefung:naechsteKoalitionspruefung(w.date),druck:[...new Set(k.spiel!.lager)].flatMap(p=>{const d=zusagenDruck(k,p);return d?[d]:[];}),stand:''};
  plan.stand=JSON.stringify({tag:w.day,datum:w.date,vorfall:v,personen:w.spiel.figuren,lager:w.spiel.lager,sitze:w.parliament?.seats,fraktionen:w.spiel.fraktionen,kapital:w.spiel.kapital,verfassung:w.spiel.verfassung,plan});
  return plan;
}
export function entscheideRessortVorfall(w:World,p:NonNullable<ReturnType<typeof ressortPolitikPlan>>) {
  const neu=ressortPolitikPlan(w,p.id,p.art);if(!neu?.ok||neu.stand!==p.stand)return {ok:false,text:t('rp.veraltet')};
  return reagiere(w,p.id,p.art);
}
