// Nur eine Lesesicht: Priorität und Navigation ändern weder Fristen noch politische Folgen.
import type { World } from '../../sim/types';
import type { Amt, Vorlage } from '../../sim/ministerfluss-typen';
import type { ZusagenWarnung } from '../../sim/zusagenwarnung';
import { zusageText } from '../../sim/zusagen';
import { ressortInhaber } from '../../sim/ressortanliegen';
import { offeneRessortVorfaelle } from '../../sim/ressortpolitik';
import { aktiveRessortNachsorge } from '../../sim/ressortnachsorge';
import { AEMTER } from '../../sim/personen';
import { rendere, t } from '../../i18n';
import { addDays, formatDateDe } from '../../sim/dates';
import { stimmenPrognose } from '../../sim/handeln';
import { versorgungsStimmen } from '../../sim/versorgungsmehrheit';
import { versorgungsVorlageHindernis, type VersorgungsProgramm } from '../../sim/versorgungspolitik';
import type { Briefing, Ziel } from './briefing';

export type Arbeitsbereich = 'entscheiden' | 'arbeit' | 'rueckblick';
export type ArbeitsGruppe = 'vorlagen' | 'minister' | 'zusagen';
export type ArbeitsAuswahl = { bereich: Arbeitsbereich; gruppe: ArbeitsGruppe; id?: string };
export type ArbeitsSprung = { art:'intern'; auswahl:ArbeitsAuswahl } | { art:'extern'; ziel:Ziel };
export interface Prioritaet { id:string; titel:string; grund:string; ton:'rot'|'gelb'|'ruhig'; tage?:number; rang:number; sprung:ArbeitsSprung }
export const fristText = (tage:number) => t(tage<0?'sd.ueberfaellig':tage===0?'sd.heute':'sd.inTagen',{n:Math.abs(tage)});
/** Nach Erledigung wird kein anderer Vorgang automatisch zur bestätigungsfähigen Auswahl. */
export function aktuelleAuswahl<T extends {id:string}>(liste:readonly T[],id:string|undefined):T|undefined {
  return id ? liste.find(x=>x.id===id) : undefined;
}
export function schreibtischArbeit(w:World,b:Pick<Briefing,'warnungen'|'faellig'>,mappe:readonly Vorlage[],zusagen:readonly ZusagenWarnung[]) {
  const anliegen=(w.spiel?.ministerfluss?.ressortAnliegen??[]).filter(a=>['offen','besprochen','abgelehnt'].includes(a.status)&&ressortInhaber(w,a));
  const vorfaelle=offeneRessortVorfaelle(w),nachsorge=aktiveRessortNachsorge(w);
  const aemter=[...new Set<Amt>([...vorfaelle.map(v=>v.amt),...anliegen.map(a=>a.amt)])];
  const minister=aemter.map(amt=>({id:amt,amt,name:AEMTER[amt].ressort,anzahl:vorfaelle.filter(v=>v.amt===amt).length+anliegen.filter(a=>a.amt===amt).length}));
  const beobachtet=[...new Set(nachsorge.map(n=>n.amt))].map(amt=>({id:amt,amt,name:AEMTER[amt].ressort,
    forderungen:nachsorge.filter(n=>n.amt===amt).flatMap(n=>n.rueckhalt?.forderungen??[]).filter(f=>f.status==='offen').length}));
  const prioritaeten:Prioritaet[]=[];
  const intern=(bereich:Arbeitsbereich,gruppe:ArbeitsGruppe,id:string):ArbeitsSprung=>({art:'intern',auswahl:{bereich,gruppe,id}});
  for(const z of zusagen) {
    const tage=z.erinnerung?z.erinnerung.frist-w.day:z.tage;
    prioritaeten.push({id:`z-${z.z.id}`,titel:zusageText(z.z),grund:t('sd.zusageGrund',{partei:z.partei}),tage,
      ton:z.akut||z.druck?.bruch?'rot':'gelb',rang:z.akut||z.druck?.bruch?120:tage<=7?105:70,
      sprung:intern('entscheiden','zusagen',z.z.id)});
  }
  for(const v of vorfaelle)prioritaeten.push({id:`rv-${v.id}`,titel:t('sd.verantwortung',{name:v.name}),grund:AEMTER[v.amt].ressort,
    ton:v.erfolg?'gelb':'rot',rang:v.erfolg?88:115,sprung:intern('entscheiden','minister',v.amt)});
  for(const a of anliegen)prioritaeten.push({id:`ra-${a.id}`,titel:t('sd.gespraech',{name:a.name}),grund:AEMTER[a.amt].ressort,
    tage:a.frist-w.day,ton:a.frist-w.day<=3?'rot':'gelb',rang:a.frist-w.day<=3?110:80,sprung:intern('entscheiden','minister',a.amt)});
  // Dasselbe Ereignis oder dieselbe Zusage erhält oben nur einen Platz.
  const zusageIds=new Set(zusagen.map(z=>z.z.id));
  const ereignisse=new Set<string>();
  for(const v of mappe) {
    for(const o of v.optionen)if(o.aktion.art==='ereignis')ereignisse.add(o.aktion.ereignisId);
    if(v.optionen.some(o=>o.aktion.art==='zusage'&&zusageIds.has(o.aktion.zusageId)))continue;
    prioritaeten.push({id:`v-${v.id}`,titel:v.titel,grund:v.prioritaetGrund,tage:v.frist,
      ton:v.frist!==undefined&&v.frist<=3?'rot':v.art==='warnung'?'gelb':'ruhig',rang:v.frist!==undefined&&v.frist<=3?110:Math.min(90,v.prioritaet),sprung:intern('entscheiden','vorlagen',v.id)});
  }
  for(const n of nachsorge) {
    const offen=(n.rueckhalt?.forderungen??[]).filter(f=>f.status==='offen').sort((a,c)=>a.frist-c.frist);
    if(!offen.length)continue;
    const f=offen[0]!;
    prioritaeten.push({id:`rf-${n.id}`,titel:t('sd.forderung',{partei:f.partei}),grund:AEMTER[n.amt].ressort,tage:f.frist-w.day,
      ton:f.frist-w.day<=7?'rot':'gelb',rang:f.frist-w.day<=7?106:75,sprung:intern('arbeit','minister',n.amt)});
  }
  for(const x of b.warnungen) {
    if(x.id.startsWith('frist-')&&ereignisse.has(x.id.slice(6)))continue;
    if(x.id==='partner'&&zusagen.some(z=>z.akut||z.druck?.bruch))continue;
    prioritaeten.push({id:`w-${x.id}`,titel:x.text,grund:x.warum,ton:x.stufe,rang:x.stufe==='rot'?108:65,sprung:{art:'extern',ziel:x.ziel}});
  }
  prioritaeten.sort((a,c)=>c.rang-a.rang||(a.tage??Infinity)-(c.tage??Infinity)||a.id.localeCompare(c.id));
  // Mehrere Probleme desselben Ministers öffnen dieselbe Akte: eine hervorgehobene Karte reicht.
  const gesehen=new Set<string>();
  const highlights=prioritaeten.filter(p=>{
    const s=p.sprung,key=s.art==='intern'&&s.auswahl.gruppe==='minister'?`${s.auswahl.bereich}:${s.auswahl.id}`:p.id;
    if(gesehen.has(key))return false;gesehen.add(key);return true;
  }).slice(0,3);
  return {minister,beobachtet,nachsorge,highlights,anliegen,vorfaelle};
}

export interface RegierungsVorgang { id:string;titel:string;status:string;unter:string;tage:number;datum:string;ziel:Ziel;votum:boolean }
/** Die drei laufenden Regierungswege teilen die Übersicht; ihre jeweiligen Simulationskerne bleiben maßgeblich. */
export function regierungsVorgaenge(w:World):RegierungsVorgang[] {
  const out:RegierungsVorgang[]=[];
  const g=w.spiel?.wirtschaft?.haushalt.gesetz;
  if(g) {
    const p=stimmenPrognose(structuredClone(w),g.abstimmung,g.absprachen);
    out.push({id:'haushaltsgesetz',titel:t('sd.haushaltsgesetz',{jahr:g.jahr+1}),status:t('sd.beratung'),
      unter:t('sd.stimmen',{ja:p.ja,luecke:p.luecke}),tage:g.abstimmung-w.day,datum:p.datum,ziel:{art:'akte',akte:'wirtschaft',start:'haushalt'},votum:true});
  }
  const reg=w.spiel?.gueter?.regierung;
  for(const v of Object.values(reg?.vorlagen??{})) {
    if(!v||v.status!=='offen')continue;
    const ja=versorgungsStimmen(w,v,v.abstimmung).reduce((s,f)=>s+f.ja,0),hindernis=versorgungsVorlageHindernis(structuredClone(w),v);
    out.push({id:v.id,titel:t(`regierung.${v.programm}.titel`),status:t(hindernis?'mandat.vollzugBlockiert':'sd.beratung'),
      unter:t('sd.stimmen',{ja,luecke:Math.max(0,301-ja)})+(hindernis?` · ${rendere(hindernis)}`:''),tage:v.abstimmung-w.day,
      datum:addDays(w.date,v.abstimmung-w.day),ziel:{art:'akte',akte:'wirtschaft',start:'inventar',programm:v.programm},votum:true});
  }
  for(const [id,a] of Object.entries(reg?.programme??{})) {
    if(!a||a.bis<=w.day)continue;
    const wartet=a.ab>w.day,tag=wartet?a.ab:a.bis;
    out.push({id:`programm-${id}`,titel:t(`regierung.${id}.titel`),status:t(wartet?'sd.vorlauf':'sd.aktiv'),
      unter:t(wartet?'sd.beginn':'sd.ende',{datum:formatDateDe(addDays(w.date,tag-w.day))}),tage:tag-w.day,
      datum:addDays(w.date,tag-w.day),ziel:{art:'akte',akte:'wirtschaft',start:'inventar',programm:id as VersorgungsProgramm},votum:false});
  }
  return out.sort((a,b)=>a.tage-b.tage);
}
