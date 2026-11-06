// Nur eine Lesesicht: Priorität und Navigation ändern weder Fristen noch politische Folgen.
import { haushaltsTitel } from '../../sim/haushalt';
import type { World } from '../../sim/types';
import type { Amt, Vorlage } from '../../sim/ministerfluss-typen';
import type { ZusagenWarnung } from '../../sim/zusagenwarnung';
import { zusageText } from '../../sim/zusagen';
import { ressortInhaber, ressortEigenart, RESSORT_STILLSTAND } from '../../sim/ressortanliegen';
import { offeneRessortVorfaelle, vorfallAnfrage, vorfallFrist } from '../../sim/ressortpolitik';
import { aktiveRessortNachsorge } from '../../sim/ressortnachsorge';
import { AEMTER } from '../../sim/personen';
import { offenerKonflikt, wartendeVorgaenge } from '../../sim/vorgaenge';
import { PROVINZEN } from '../../sim/regional';
import { rendere, t, zahl } from '../../i18n';
import { NET } from '../../sim/modell';
import { wertVon } from '../../sim/personen';
import { verwaltungBilanz } from '../../sim/reich';
import { WAHLKAMPF } from '../../sim/wahlkampf';
import { lageSatz } from '../minister/VorlageKarte';
import { addDays, formatDateDe } from '../../sim/dates';
import { stimmenPrognose } from '../../sim/handeln';
import { versorgungsStimmen } from '../../sim/versorgungsmehrheit';
import { versorgungsVorlageHindernis, type VersorgungsProgramm } from '../../sim/versorgungspolitik';
import { istMinisterienZusage } from '../../sim/ressortvergabe';
import { schreibtischMappe } from '../../sim/ministerfluss';
import { gefaehrdeteZusagen } from '../../sim/zusagenwarnung';
import { tageslage, type Briefing, type Warnung, type Ziel } from './briefing';

export type Arbeitsbereich = 'entscheiden' | 'arbeit' | 'rueckblick';
export type ArbeitsGruppe = 'vorlagen' | 'minister' | 'zusagen';
export type ArbeitsAuswahl = { bereich: Arbeitsbereich; gruppe: ArbeitsGruppe; id?: string };
export type ArbeitsSprung = { art:'intern'; auswahl:ArbeitsAuswahl } | { art:'extern'; ziel:Ziel } | { art:'vorgang'; id:string };
/** Ordnung des Tisches (Rückmeldung 06.11.2026): Minister, Parteien, Land, Fristen */
export type TischGruppe = 'minister' | 'parteien' | 'land' | 'fristen';
export const TISCH_GRUPPEN: TischGruppe[] = ['minister','parteien','land','fristen'];
/** Eine Zeile der gebündelten Stillstände: ein Ressort, sein Vorfall und was dort sonst offen ist */
export interface RessortReihe { amt:Amt; name:string; vorfall:string; anliegen?:string; groesse:string; vor:number; nach:number; anfrage:number; tage:number; vorlagen:Vorlage[] }
/** Eine Forderung einer Partei an ein Ressort (Nachbeobachtung nach einer Ministerentscheidung) */
export interface ForderungsReihe { amt:Amt; nachsorge:string; forderung:string; groesse:string; stand:number; ziel:number; tage:number }
export type TischInhalt =
  | { art:'vorlage'; vorlage:Vorlage }
  | { art:'ressort'; amt:Amt; anliegen?:string; vorfall?:string; vorlagen:Vorlage[] }
  | { art:'ressorts'; reihen:RessortReihe[] }
  | { art:'zusage'; zusageId:string }
  | { art:'partei'; partei:string; reihen:ForderungsReihe[] }
  | { art:'vorgang'; id:string }
  | { art:'sprung'; ziel:Ziel };
export interface Prioritaet { id:string; titel:string; grund:string; ton:'rot'|'gelb'|'ruhig'; tage?:number; rang:number; sprung:ArbeitsSprung; gruppe:TischGruppe; inhalt:TischInhalt; amt?:Amt }
/** Lagebericht ohne eigene Entscheidung: steht im ruhigen Block „Lage“, nicht auf dem Tisch, und zählt nicht am Reiter */
export interface LageEintrag { id:string; text:string; warum:string; ton:'rot'|'gelb'; ziel:Ziel }
export const fristText = (tage:number) => t(tage<0?'sd.ueberfaellig':tage===0?'sd.heute':'sd.inTagen',{n:Math.abs(tage)});
/**
 * Ehrliche Dringlichkeit: Rot nur bei einer Frist bis 7 Tage oder echter Gefahr (Bruch einer Zusage). Eine Frist darüber ist gelb, ohne Frist
 * ruhig. Vorher stand jeder Ressortvorfall als „Dringend“ in Rot, ohne Frist und ohne Folge des Wartens.
 */
export const DRINGEND_TAGE = 7;
export const ehrlicherTon = (tage:number|undefined, gefahr = false): Prioritaet['ton'] =>
  gefahr || (tage !== undefined && tage <= DRINGEND_TAGE) ? 'rot' : tage !== undefined ? 'gelb' : 'ruhig';
/** Nach Erledigung wird kein anderer Vorgang automatisch zur bestätigungsfähigen Auswahl. */
export function aktuelleAuswahl<T extends {id:string}>(liste:readonly T[],id:string|undefined):T|undefined {
  return id ? liste.find(x=>x.id===id) : undefined;
}
/**
 * Zusagen, über die gerade ein offenes Ereignis entscheidet: Die Startzusage der Ministerien steht im Ereignis „… meldet sich“
 * (start_partner). Befund A-3 (5. November 2026): Sie stand zweimal auf dem Tisch, als Zusagenkarte und als Ereignis, mit zwei Knöpfen
 * und demselben Preis. Der Tisch führt sie jetzt einmal, als Ereignis; unter Kabinett und Verwaltung › Zusagen bleibt sie sichtbar.
 */
export function zusagenImEreignis(w:World):Set<string> {
  const ids=new Set<string>(),sp=w.spiel;if(!sp)return ids;
  for(const e of sp.ereignisse){
    if(e.vorlage==='zusage'&&e.daten?.zusage)ids.add(String(e.daten.zusage));
    if(e.vorlage==='start_partner')for(const z of sp.zusagen)if(!z.erfuellt&&!z.gebrochen&&istMinisterienZusage(z)&&(!e.daten?.partei||z.von===e.daten.partei))ids.add(z.id);
  }
  return ids;
}
const knoten=(id:string)=>NET.nodes[NET.index.get(id)??-1]?.name??id;
const ressortName=(amt:Amt)=>t(`daten.amt.${amt}.ressort`);
const tagDatum=(w:World,tag:number)=>formatDateDe(addDays(w.date,tag-w.day));
const liste=(namen:string[])=>namen.length<2?(namen[0]??''):t('h4.liste',{vorne:namen.slice(0,-1).join(', '),letzte:namen.at(-1)!});
/** Welche Vorlagen der Mappe zu einem Ressort gehören; Ereignisse, Zusagen, Probleme und Netzbitten sind eigene Einträge */
const ressortVorlage=(v:Vorlage)=>v.quelle!=='ereignis'&&v.quelle!=='zusage'&&v.quelle!=='problem'&&!v.thema.startsWith('infra:');

/**
 * Der Tisch des Präsidenten (Rückmeldung des Inhabers 06.11.2026: „Schreibtisch ist eine Katastrophe … ich kann hier auch nichts machen“).
 * Nur Lesen: Rangfolge und Bündelung ändern weder Fristen noch politische Folgen.
 * - Pro Ressort höchstens ein Eintrag: Anfrage, Vorfall und Vorlagen desselben Ministers stehen zusammen. Vorher verdeckte der fristlose
 *   Vorfall die offene Anfrage desselben Ministers, also gerade den Ausweg aus dem Stillstand.
 * - Gleichartiges wird ein Eintrag: Stillstände mehrerer Ressorts, Forderungen einer Partei an mehrere Ressorts.
 * - Lageberichte ohne eigene Entscheidung (Opposition, Kulturstätte, Verwaltungskraft …) stehen im Block „Lage“.
 */
export function schreibtischArbeit(w:World,b:Pick<Briefing,'warnungen'|'faellig'>,mappe:readonly Vorlage[],zusagenAlle:readonly ZusagenWarnung[]) {
  const imEreignis=zusagenImEreignis(w);
  const zusagen=zusagenAlle.filter(z=>!imEreignis.has(z.z.id));
  const anliegen=(w.spiel?.ministerfluss?.ressortAnliegen??[]).filter(a=>['offen','besprochen','abgelehnt'].includes(a.status)&&ressortInhaber(w,a));
  const vorfaelle=offeneRessortVorfaelle(w),nachsorge=aktiveRessortNachsorge(w);
  const aemter=[...new Set<Amt>([...vorfaelle.map(v=>v.amt),...anliegen.map(a=>a.amt)])];
  const minister=aemter.map(amt=>({id:amt,amt,name:AEMTER[amt].ressort,anzahl:vorfaelle.filter(v=>v.amt===amt).length+anliegen.filter(a=>a.amt===amt).length}));
  const beobachtet=[...new Set(nachsorge.map(n=>n.amt))].map(amt=>({id:amt,amt,name:AEMTER[amt].ressort,
    forderungen:nachsorge.filter(n=>n.amt===amt).flatMap(n=>n.rueckhalt?.forderungen??[]).filter(f=>f.status==='offen').length}));
  const alle:Prioritaet[]=[];
  const intern=(bereich:Arbeitsbereich,gruppe:ArbeitsGruppe,id:string):ArbeitsSprung=>({art:'intern',auswahl:{bereich,gruppe,id}});
  // Rang: Rot nach Restzeit zuerst, sonst nach Gewicht der Sache (Spielparameter der Anzeige, keine Simulation)
  const rang=(ton:Prioritaet['ton'],basis:number,tage?:number,gefahr=false)=>ton==='rot'?(gefahr?220:200)-Math.max(-10,Math.min(DRINGEND_TAGE,tage??0)):basis;

  // Zusagen unter Druck: Bruch einer Zusage ist echte Gefahr
  const zusageIds=new Set(zusagen.map(z=>z.z.id));
  for(const z of zusagen) {
    const tage=z.erinnerung?z.erinnerung.frist-w.day:z.tage,gefahr=!!(z.akut||z.druck?.bruch),ton=ehrlicherTon(tage,gefahr);
    alle.push({id:`z-${z.z.id}`,titel:zusageText(z.z),grund:t('sd.zusageGrund',{partei:z.partei}),tage,ton,rang:rang(ton,74,tage,gefahr),
      sprung:intern('entscheiden','zusagen',z.z.id),gruppe:'parteien',inhalt:{art:'zusage',zusageId:z.z.id}});
  }

  // Ressorts: Anfrage, Vorfall und Vorlagen je Amt sammeln
  const ereignisse=new Set<string>();
  const proAmt=new Map<Amt,Vorlage[]>();
  for(const v of mappe) {
    for(const o of v.optionen)if(o.aktion.art==='ereignis')ereignisse.add(o.aktion.ereignisId);
    if(v.optionen.some(o=>o.aktion.art==='zusage'&&zusageIds.has(o.aktion.zusageId)))continue;
    if(ressortVorlage(v)){proAmt.set(v.amt,[...(proAmt.get(v.amt)??[]),v]);continue;}
    const gruppe:TischGruppe=v.quelle==='zusage'?'parteien':v.quelle==='ereignis'?'fristen':'land';
    const ton=ehrlicherTon(v.frist);
    alle.push({id:`v-${v.id}`,titel:v.titel,grund:lageSatz(v.anlass[0]??'').satz||v.prioritaetGrund,tage:v.frist,ton,
      rang:rang(ton,v.quelle==='ereignis'?Math.min(95,v.prioritaet+20):Math.min(85,v.prioritaet+10),v.frist),
      sprung:intern('entscheiden','vorlagen',v.id),gruppe,inhalt:{art:'vorlage',vorlage:v},amt:v.amt});
  }
  const ressortAemter=[...new Set<Amt>([...vorfaelle.map(v=>v.amt),...anliegen.map(a=>a.amt),...proAmt.keys()])];
  const reihen:RessortReihe[]=[];
  for(const amt of ressortAemter){
    const a=anliegen.find(x=>x.amt===amt),v=vorfaelle.find(x=>x.amt===amt),vs=proAmt.get(amt)??[];
    if(v)reihen.push({amt,name:v.name,vorfall:v.id,...(a?{anliegen:a.id}:{}),groesse:v.folge.groesse,vor:v.folge.vorher,nach:v.folge.nachher,anfrage:vorfallAnfrage(v),tage:vorfallFrist(v)-w.day,vorlagen:vs});
  }
  const buendel=reihen.length>=2;
  if(buendel){
    reihen.sort((x,y)=>(x.anliegen?0:1)-(y.anliegen?0:1)||x.tage-y.tage);
    // Die nächste Frist im Bündel: eine offene Anfrage oder das Ende der Reaktionszeit
    const fristen=reihen.map(r=>{const a=r.anliegen?anliegen.find(x=>x.id===r.anliegen):undefined;return a?Math.min(r.tage,a.frist-w.day):r.tage;});
    const tage=Math.min(...fristen),ton=ehrlicherTon(tage);
    alle.push({id:'rs-stillstand',titel:t('h4.still.titel',{n:reihen.length}),grund:t('h4.still.satz',{ressorts:liste(reihen.map(r=>ressortName(r.amt)))}),tage,ton,
      rang:rang(ton,79,tage),sprung:intern('entscheiden','minister',reihen[0]!.amt),gruppe:'minister',inhalt:{art:'ressorts',reihen}});
  }
  for(const amt of ressortAemter){
    if(buendel&&reihen.some(r=>r.amt===amt))continue;
    const a=anliegen.find(x=>x.amt===amt),v=vorfaelle.find(x=>x.amt===amt),vs=proAmt.get(amt)??[];
    let titel:string,grund:string,tage:number|undefined,basis:number;
    if(a){
      const typ=ressortEigenart(w,a);
      titel=t('h4.r.anliegen.titel',{ressort:ressortName(amt)});
      grund=t('h4.r.anliegen.satz',{name:a.name,seit:tagDatum(w,a.seit),groesse:knoten(a.groesse),wert:zahl(wertVon(w,a.groesse),0),frist:tagDatum(w,a.frist),
        eigen:typ?.eigen?'ja':'nein',punkte:zahl(RESSORT_STILLSTAND.groesse,1),vertrauen:zahl(RESSORT_STILLSTAND.vertrauen,1)});
      tage=a.frist-w.day;basis=82;
    }else if(v){
      titel=t('h4.r.vorfall.titel',{ressort:ressortName(amt),art:v.art==='eigeninitiative'?(v.erfolg?'gut':'schlecht'):v.art});
      grund=t('h4.r.vorfall.satz',{art:v.art,name:v.name,anfrage:tagDatum(w,vorfallAnfrage(v)),groesse:knoten(v.folge.groesse),vor:zahl(v.folge.vorher,0),nach:zahl(v.folge.nachher,0),frist:tagDatum(w,vorfallFrist(v))});
      tage=vorfallFrist(v)-w.day;basis=62;
    }else{
      const erste=vs[0]!;titel=erste.titel;grund=lageSatz(erste.anlass[0]??'').satz||erste.prioritaetGrund;tage=erste.frist;basis=Math.min(72,erste.prioritaet+10);
    }
    const ton=ehrlicherTon(tage);
    alle.push({id:`r-${amt}`,titel,grund,tage,ton,rang:rang(ton,basis,tage),sprung:intern('entscheiden','minister',amt),gruppe:'minister',amt,
      inhalt:{art:'ressort',amt,...(a?{anliegen:a.id}:{}),...(v?{vorfall:v.id}:{}),vorlagen:vs}});
  }

  // Wohnungsbau-Vorgänge, die auf eine Entscheidung warten; läuft die Frist ab, gilt der Standardweg.
  // Nur lesen: vorgaenge() legt die Liste sonst im Spielstand an, und die Anzeige veränderte den Stand
  for(const v of w.spiel?.vorgaenge?wartendeVorgaenge(w):[]){
    const k=offenerKonflikt(v)!,tage=k.frist-w.day,ort=PROVINZEN[v.plaka-1]?.name??String(v.plaka),ton=ehrlicherTon(tage);
    alle.push({id:`vg-${v.id}`,titel:t('vorgang.ui.titel',{ort}),grund:t('vorgang.ui.entscheiden'),tage,ton,rang:rang(ton,84,tage),
      sprung:{art:'vorgang',id:v.id},gruppe:'land',inhalt:{art:'vorgang',id:v.id}});
  }

  // Forderungen einer Partei: ein Eintrag je Partei, die Ressorts darin
  const proPartei=new Map<string,ForderungsReihe[]>();
  for(const n of nachsorge)for(const f of n.rueckhalt?.forderungen??[]){
    if(f.status!=='offen')continue;
    proPartei.set(f.partei,[...(proPartei.get(f.partei)??[]),{amt:n.amt,nachsorge:n.id,forderung:f.id,groesse:f.groesse,stand:f.stand,ziel:f.ziel,tage:f.frist-w.day}]);
  }
  for(const [partei,rs] of proPartei){
    rs.sort((x,y)=>x.tage-y.tage);
    const tage=rs[0]!.tage,ton=ehrlicherTon(tage);
    alle.push({id:`p-${partei}`,titel:t('h4.partei.titel',{partei,n:rs.length,ressort:ressortName(rs[0]!.amt)}),
      grund:t('h4.partei.satz',{partei,punkte:zahl(Math.abs(rs[0]!.ziel-rs[0]!.stand),0)}),tage,ton,rang:rang(ton,76,tage),
      sprung:intern('arbeit','minister',rs[0]!.amt),gruppe:'parteien',inhalt:{art:'partei',partei,reihen:rs}});
  }

  // Warnungen: Eine Ereignisfrist ohne Platz in der Mappe ist eine Entscheidung; alles andere ist Lage
  const lage:LageEintrag[]=[];
  for(const x of b.warnungen) {
    if(x.id.startsWith('frist-')){
      if(ereignisse.has(x.id.slice(6)))continue;
      alle.push({id:`w-${x.id}`,titel:x.text,grund:x.warum,tage:0,ton:'rot',rang:rang('rot',0,0),sprung:{art:'extern',ziel:x.ziel},gruppe:'fristen',inhalt:{art:'sprung',ziel:x.ziel}});
      continue;
    }
    if(x.id==='partner'&&zusagen.some(z=>z.akut||z.druck?.bruch))continue;
    lage.push({id:x.id,text:x.text,warum:lageWarum(w,x),ton:x.stufe,ziel:x.ziel});
  }
  alle.sort((a,c)=>c.rang-a.rang||(a.tage??Infinity)-(c.tage??Infinity)||a.id.localeCompare(c.id));
  // alle: die echten Entscheidungen nach Dringlichkeit; highlights: die ersten drei als große Karten (Vorgabe „Eine Frage, ein Bild oben“)
  return {minister,beobachtet,nachsorge,highlights:alle.slice(0,3),alle,lage,anliegen,vorfaelle};
}

/** Konkreter Satz zu einer Lage, wo die Daten es hergeben; sonst die Begründung der Warnung */
function lageWarum(w:World,x:Warnung):string {
  if(x.id==='verwaltung'&&w.spiel?.reich){
    const vb=verwaltungBilanz(w);
    return t('h4.lage.verwaltung',{einkommen:zahl(vb.einkommen,0),bau:zahl(vb.bau,0),unterhalt:zahl(vb.unterhalt,0)});
  }
  return x.warum;
}

export interface FristZeile { id:string; text:string; wann:string; tage:number; ziel:Ziel }
/** Termine mit Ziel für die Gruppe „Fristen“: Sie zählen nicht als Entscheidung, haben aber einen Sprung. Termine ohne Ziel fallen weg. */
export function tischFristen(w:World,b:Pick<Briefing,'faellig'|'termine'>,max=5):FristZeile[] {
  const sp=w.spiel;if(!sp)return [];
  const out:FristZeile[]=[
    ...regierungsVorgaenge(w).map(g=>({id:g.id,text:g.titel,wann:`${g.status} · ${formatDateDe(g.datum)}`,tage:g.tage,ziel:g.ziel})),
    ...b.faellig.filter(f=>(f.art==='gesetz'||f.art==='duldung'||f.art==='schritt')&&f.knopf.art==='gehe').map(f=>({id:f.id,text:f.titel,wann:f.tage===undefined?t('sk.bereit'):fristText(f.tage),tage:f.tage??0,ziel:(f.knopf as {ziel:Ziel}).ziel})),
    ...b.termine.filter(x=>!x.id.startsWith('g-')&&!x.id.startsWith('z-')&&x.ziel).map(x=>({id:`t-${x.id}`,text:x.text,wann:x.datum,tage:x.tage,ziel:x.ziel!})),
  ];
  // Der Wahlkampf kündigt sich an: Wer ihn nicht vorbereitet, verliert am Wahltag rund acht Punkte an Angriffe, Duell und Lager (Messung 5. November)
  const bis=sp.wahltag-WAHLKAMPF.beginnTage-w.day;
  if(!sp.ende&&bis>0&&bis<=180)out.push({id:'wahlkampf-beginn',text:t('sd.wahlkampfFrist'),wann:fristText(bis),tage:bis,ziel:{art:'akte',akte:'wahlkampf'}});
  return out.sort((a,c)=>a.tage-c.tage).slice(0,max);
}

export interface RegierungsVorgang { id:string;titel:string;status:string;unter:string;tage:number;datum:string;ziel:Ziel;votum:boolean }
/** Die drei laufenden Regierungswege teilen die Übersicht; ihre jeweiligen Simulationskerne bleiben maßgeblich. */
export function regierungsVorgaenge(w:World):RegierungsVorgang[] {
  const out:RegierungsVorgang[]=[];
  const g=w.spiel?.wirtschaft?.haushalt.gesetz;
  if(g) {
    const p=stimmenPrognose(structuredClone(w),g.abstimmung,g.absprachen);
    out.push({id:'haushaltsgesetz',titel:haushaltsTitel(g),status:t('sd.beratung'),
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

/**
 * Wie viel auf dem Tisch liegt: dieselbe Liste wie im Schreibtisch, für den Zähler an der Leiste (Befund A-26: Leiste „2“, Tisch „7“).
 * Gemerkt je Tag und Stand der Vorgänge, weil die Leiste bei jedem Tagesschritt neu zeichnet.
 */
let tischGemerkt: { schluessel: string; n: number } | undefined;
export function tischAnzahl(w:World):number {
  const sp=w.spiel;if(!sp||sp.ende)return 0;
  const schluessel=`${w.seed}|${w.day}|${Math.floor(sp.kapital)}|${sp.ereignisse.map(e=>e.id).join(',')}|${sp.zusagen.filter(z=>z.erfuellt||z.gebrochen).length}|${sp.zusagen.length}|${sp.ministerfluss?.ressortAnliegen?.length??0}`;
  if(tischGemerkt?.schluessel===schluessel)return tischGemerkt.n;
  const b=tageslage(w),mappe=schreibtischMappe(w,5),n=schreibtischArbeit(w,b,mappe.mappe,gefaehrdeteZusagen(w)).alle.length;
  tischGemerkt={schluessel,n};
  return n;
}
