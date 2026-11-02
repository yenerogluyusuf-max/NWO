import { beginneRessortRueckhalt, bewerteRessortErholung, type RessortRueckhaltStand, type RessortRueckhaltBeleg } from './ressortrueckhalt';
// Beobachtete Ressortentwicklung nach einer Personalentscheidung. Keine erfundene Kausalwirkung.
import type { World } from './types';
import type { Figur } from './spiel-typen';
import type { RessortVorfall, RessortReaktion } from './ressortpolitik';
import { offeneRessortVorfaelle } from './ressortpolitik';
import { flussZustand } from './ministerfluss-kern';
import { wertVon, HOCH_SCHLECHT, eigenVon, AEMTER } from './personen';
import { legeRessortAnliegenAn, ressortArbeitet, ressortInhaber, ressortEntspannt, RESSORT_ENTWARNUNG } from './ressortanliegen';
import { addLog } from './log';
import { t } from '../i18n';

export const RESSORT_NACHSORGE = { takt:14, stabilTakt:30, schritt:1, entwarnung:RESSORT_ENTWARNUNG };
export type RessortEntwicklung = 'fortschritt'|'rueckschlag'|'unveraendert'|'entspannt'|'stabilisiert'|'rueckfall'|'teilErholt';
export interface RessortMeldung {
  politik?:RessortRueckhaltBeleg;messwerte?:Record<string,number>;
  tag:number;datum:string;name:string;figur:string;amtsantritt:number;wechsel?:string;
  wert:number;vorher:number;entwicklung:RessortEntwicklung;kritisch:boolean;zielKritisch?:boolean;weitereProbleme?:{groesse:string;wert:number}[];
  schritt:'beobachten'|'anliegen'|'bearbeitung'|'verantwortung'|'warteschlange';
  anliegen?:string;frist?:number;vorschlag?:import('./ressortanliegen').RessortAnliegen['vorschlag'];
}
export interface RessortNachsorge {
  hilfen?:import("./ressortforderungshilfe").RessortHilfeBeleg[];
  rueckhalt?:RessortRueckhaltStand;
  id:string;amt:Figur['amt'];groesse:string;entscheidung:RessortReaktion;entscheidungTag:number;entscheidungDatum:string;
  seit:number;datum:string;ausgang:number;nachgetragen?:boolean;
  verantwortlich:{id:string;name:string;seit:number};
  naechsteMeldung:number;ruhigeMeldungen:number;status:'beobachtung'|'stabilisiert'|'abgeloest';
  meldungen:RessortMeldung[];
}
export const aktiveRessortNachsorge=(w:World)=>(w.spiel?.ministerfluss?.ressortNachsorge??[]).filter(n=>n.status!=='abgeloest');
const inhaber=(w:World,amt:Figur['amt'])=>w.spiel?.figuren.find(f=>f.imAmt&&f.amt===amt);
const kritisch=(groesse:string,wert:number)=>!ressortEntspannt(groesse,wert);

export function beginneRessortNachsorge(w:World,v:RessortVorfall,nachgetragen=false):void {
  if(!w.spiel||!v.entscheidung||v.entscheidung.art==='vorfall')return;
  const alle=flussZustand(w).ressortNachsorge??=[];
  if(v.nachsorgeBegonnen||alle.some(n=>n.id===v.id))return;
  const f=inhaber(w,v.amt);if(!f)return;
  const vorige=alle.find(n=>n.amt===v.amt&&n.status!=='abgeloest');
  for(const n of alle)if(n.amt===v.amt&&n.status!=='abgeloest')n.status='abgeloest';
  v.nachsorgeBegonnen=true;
  alle.push({id:v.id,amt:v.amt,groesse:v.folge.groesse,entscheidung:v.entscheidung.art,entscheidungTag:v.entscheidung.tag,entscheidungDatum:v.entscheidung.datum,
    seit:w.day,datum:w.date,ausgang:wertVon(w,v.folge.groesse),nachgetragen,
    verantwortlich:{id:f.id,name:f.name,seit:eigenVon(w,f).seit},naechsteMeldung:w.day+RESSORT_NACHSORGE.takt,
    hilfen:structuredClone(vorige?.hilfen??[]),ruhigeMeldungen:0,status:'beobachtung',meldungen:[]});
  beginneRessortRueckhalt(w,alle.at(-1)!,vorige);
  // Aktive Ressorts bleiben erhalten, nur alte abgeschlossene Beobachtungen werden begrenzt.
  const alte=alle.filter(n=>n.status==='abgeloest').slice(-8);
  w.spiel.ministerfluss!.ressortNachsorge=[...alte,...alle.filter(n=>n.status!=='abgeloest')];
}

export function ressortNachsorgeTag(w:World):void {
  if(!w.spiel||w.spiel.ende)return;
  const z=flussZustand(w);if(z.ressortNachsorgeTag===w.day)return;z.ressortNachsorgeTag=w.day;
  // Altstände beginnen mit einem ehrlichen heutigen Messwert, nicht mit rückdatierten Erfolgen.
  const letzte=new Map<Figur['amt'],RessortVorfall>();
  for(const v of z.ressortVorfaelle??[])if(v.entscheidung)letzte.set(v.amt,v);
  for(const v of letzte.values())if(!v.nachsorgeBegonnen)beginneRessortNachsorge(w,v,true);
  for(const n of aktiveRessortNachsorge(w)) {
    if(w.day<n.naechsteMeldung)continue;
    const f=inhaber(w,n.amt);if(!f)continue; // Keine Meldung im Namen eines ausgeschiedenen Ministers.
    const wert=wertVon(w,n.groesse),letzte=n.meldungen.at(-1),vorher=letzte?.wert??n.ausgang;
    const delta=(HOCH_SCHLECHT.has(n.groesse)?-1:1)*(wert-vorher),krise=kritisch(n.groesse,wert);
    const weitereProbleme=AEMTER[n.amt].fach.filter(id=>id!==n.groesse).map(groesse=>({groesse,wert:wertVon(w,groesse)})).filter(p=>kritisch(p.groesse,p.wert));
    const schwer=(p:{groesse:string;wert:number})=>HOCH_SCHLECHT.has(p.groesse)?p.wert:100-p.wert;
    weitereProbleme.sort((a,b)=>schwer(b)-schwer(a));
    const handlungsbedarf=krise||weitereProbleme.length>0;
    n.ruhigeMeldungen=handlungsbedarf?0:n.ruhigeMeldungen+1;
    const entwicklung:RessortEntwicklung=!krise?(weitereProbleme.length?'teilErholt':n.ruhigeMeldungen>=2?'stabilisiert':'entspannt'):
      letzte&&!(letzte.zielKritisch??letzte.kritisch)?'rueckfall':delta>=RESSORT_NACHSORGE.schritt-1e-8?'fortschritt':delta<=-RESSORT_NACHSORGE.schritt+1e-8?'rueckschlag':'unveraendert';
    const e=eigenVon(w,f),wechsel=f.id!==n.verantwortlich.id||f.name!==n.verantwortlich.name||e.seit!==n.verantwortlich.seit?n.verantwortlich.name:undefined;
    n.verantwortlich={id:f.id,name:f.name,seit:e.seit};
    const m:RessortMeldung={tag:w.day,datum:w.date,name:f.name,figur:f.id,amtsantritt:e.seit,wechsel,wert,vorher,entwicklung,kritisch:handlungsbedarf,zielKritisch:krise,weitereProbleme,schritt:'beobachten'};
    if(handlungsbedarf) {
      const offen=z.ressortAnliegen?.find(a=>a.amt===n.amt&&['offen','besprochen','abgelehnt'].includes(a.status)&&ressortInhaber(w,a));
      if(ressortArbeitet(w,f))m.schritt='bearbeitung';
      else if(offeneRessortVorfaelle(w).some(v=>v.amt===n.amt))m.schritt='verantwortung';
      else {
        const a=offen??legeRessortAnliegenAn(w,f,krise?n.groesse:weitereProbleme[0]!.groesse,n.id);
        m.schritt=a?'anliegen':'warteschlange';
        if(a){m.anliegen=a.id;m.frist=a.frist;m.vorschlag=structuredClone(a.vorschlag);}
      }
    }
    n.status=entwicklung==='stabilisiert'?'stabilisiert':'beobachtung';
    n.naechsteMeldung=w.day+(n.status==='stabilisiert'?RESSORT_NACHSORGE.stabilTakt:RESSORT_NACHSORGE.takt);
    bewerteRessortErholung(w,n,m);
    n.meldungen.push(m);if(n.meldungen.length>8)n.meldungen.shift();
    addLog(w,'ereignis',t('rn.log',{name:f.name,entwicklung:t(`rn.status.${entwicklung}`),vor:vorher.toFixed(1),nach:wert.toFixed(1)}));
  }
}
