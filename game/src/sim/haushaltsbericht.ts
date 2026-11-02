import { staatsfinanzen } from "./staatsfinanzen";
// Gespeicherte Haushaltsbelege: direkte Buchungen, offene Verpflichtungen und spätere Beobachtung getrennt halten.
import type { World } from "./types";
import type { Zusage } from "./spiel-typen";
import type { HaushaltsGesetz } from "./wirtschaft-typen";
import type { RegierungsBilanz } from "./versorgungspolitik";
import { POSTEN_NACH_ID, inSpanne } from "./haushalt";
import { haushaltZustand, defizitJetzt } from "./wirtschaft";
import { nationalAverage } from "./netz";
import { NET } from "./modell";
import { addDays } from "./dates";
import { aktiveParteivorsitzende, regierungsSitze } from "./koalitionslage";
import { zusagenDruck, type ZusagenDruckLage } from "./zusagendruck";
import { startBereitschaft } from "./fraktionen";

export interface HaushaltsAbkommen {
  partei:string;art:"duldung"|"koalition";tag:number;datum:string;pk:number;aufmerksamkeit:number;
  vorher:number;nachher:number;bereitschaft:number;zusagen:Zusage[];
}
export interface HaushaltsStand {
  sozial?:{armut:number;lebenshaltung:number;realeinkommen:number};
  defizit:number;impuls:number;schulden:number;wachstum:number;inflation:number;legitimitaet:number;zustimmung:number;
  /** Geldbeträge zum damaligen Stand; bei Altbelegen ausdrücklich unbekannt. */
  finanzen?: { einnahmenMrd:number;ausgabenMrd:number;kreditMrd:number;realEinnahmenMrd:number;preisbasis:string };
  sitze:number;
  parteien:{partei:string;rolle:"koalition"|"duldung"|"opposition";sitze:number;bereitschaft:number;personen:{id:string;name:string;loyalitaet:number}[]}[];
  personen:{id:string;name:string;loyalitaet:number}[];
}
export interface HaushaltsZusage {
  z:Zusage;quelle:"haushalt"|"bestehend";status:"offen"|"erfuellt"|"gebrochen"|"unbekannt";datum:string;
}
export interface HaushaltsAbschluss {
  krisenpaket?:HaushaltsGesetz["krisenpaket"];
  id:string;jahr:number;tag:number;datum:string;ja:number;angenommen:boolean;absprachen:number;
  posten:{id:string;vorher:number;ziel:number;danach:number;reifeMonate:number}[];
  abkommen:HaushaltsAbkommen[];zusagen:HaushaltsZusage[];vorher:HaushaltsStand;nachher:HaushaltsStand;
}
export interface HaushaltsReifung {
  beschluss:string;tag:number;datum:string;posten:string[];
  deckung:number;handel:number;einsatz?:number;
  knoten:{id:string;delta:number}[];
}
export interface HaushaltsMonatsbericht {
  monat:string;datum:string;abschluss:HaushaltsAbschluss;stand:HaushaltsStand;zusagen:HaushaltsZusage[];
  reifung?:HaushaltsReifung;
  versorgung?:{monat:string;deckung:number;handel:number};
  koalition?:RegierungsBilanz["koalition"];
  druck:ZusagenDruckLage[];
  ressort?:import("./ressortanliegen").RessortFolge[];
  ressortnachsorge?:import("./ressortnachsorge").RessortNachsorge[];
  ministerpolitik?:import("./ressortpolitik").RessortVorfall[];
  umsetzung:{id:string;ziel:number;heute:number;wirksam:number;ersetzt:boolean}[];
}

export function haushaltsStand(w:World):HaushaltsStand {
  const sp=w.spiel!,e=w.economy,f=staatsfinanzen(w);
  return {sozial:{armut:nationalAverage(NET,w.net,"armut"),lebenshaltung:nationalAverage(NET,w.net,"lebenshaltung"),realeinkommen:nationalAverage(NET,w.net,"realeinkommen")},finanzen:{einnahmenMrd:f.einnahmenMrd,ausgabenMrd:f.ausgabenMrd,kreditMrd:f.kreditMrd,realEinnahmenMrd:f.realeEinnahmenMrd,preisbasis:f.basis.seit},defizit:defizitJetzt(w),impuls:e.fiscalImpulse,schulden:e.debtRatio,wachstum:e.growth,inflation:e.inflation,
    legitimitaet:nationalAverage(NET,w.net,"legitimitaet"),zustimmung:sp.umfrage.zustimmung,sitze:regierungsSitze(w),
    parteien:Object.entries(w.parliament?.seats??{}).filter(([p,s])=>s>0&&p!==w.player?.partei.kurz).map(([partei,sitze])=>({partei,sitze,
      rolle:sp.lager.includes(partei)?"koalition":(sp.fraktionen?.[partei]?.duldungBis??0)>w.day?"duldung":"opposition",
      bereitschaft:sp.fraktionen?.[partei]?.bereitschaft??startBereitschaft(w,partei),
      personen:aktiveParteivorsitzende(w,partei).map(f=>({id:f.id,name:f.name,loyalitaet:f.loyalitaet}))})),
    personen:sp.figuren.filter(f=>f.imAmt).map(f=>({id:f.id,name:f.name,loyalitaet:f.loyalitaet}))};
}

function zusagenStand(w:World,belege:HaushaltsZusage[]):HaushaltsZusage[] {
  return belege.map(b=>{
    const z=w.spiel?.zusagen.find(z=>z.id===b.z.id);
    return {z:structuredClone(z??b.z),quelle:b.quelle,status:!z?"unbekannt":z.erfuellt?"erfuellt":z.gebrochen?"gebrochen":"offen",datum:z?addDays(w.date,z.faellig-w.day):b.datum};
  });
}

/** Vor dem Beschluss erfassen; bestehende andere Verpflichtungen werden nicht nachträglich als Haushaltspreis ausgegeben. */
export function beginneHaushaltsBeleg(w:World,g:HaushaltsGesetz,ja:number):HaushaltsAbschluss {
  const abkommen=structuredClone(g.abkommen??[]),zugesagt=new Map(abkommen.flatMap(a=>a.zusagen.map(z=>[z.id,z] as const)));
  const traeger=new Set([...(w.spiel?.lager??[]),...abkommen.map(a=>a.partei),...Object.keys(w.spiel?.fraktionen??{}).filter(p=>(w.spiel!.fraktionen![p]?.duldungBis??0)>w.day)]);
  const ziele=new Map([...zugesagt]);
  for(const z of w.spiel!.zusagen)if(traeger.has(z.von)&&!z.erfuellt&&!z.gebrochen)ziele.set(z.id,z);
  const zusagen=zusagenStand(w,[...ziele.values()].map(z=>({z,quelle:zugesagt.has(z.id)?"haushalt":"bestehend",status:"offen",datum:addDays(w.date,z.faellig-w.day)})));
  const vorher=haushaltsStand(w),z=haushaltZustand(w);
  return {id:`haushalt-${g.jahr}-${g.eingebracht}`,jahr:g.jahr,...(g.krisenpaket?{krisenpaket:g.krisenpaket}:{}),tag:w.day,datum:w.date,ja,angenommen:ja>=301,absprachen:g.absprachen,abkommen,zusagen,vorher,nachher:vorher,
    posten:Object.entries(g.schritte).flatMap(([id,n])=>{const p=POSTEN_NACH_ID[id];if(!p)return [];const v=z.stufen[p.id]??0,ziel=inSpanne(p,n);return ziel===v?[]:[{id:p.id,vorher:v,ziel,danach:v,reifeMonate:p.reifeMonate}];})};
}

export function schliesseHaushaltsBeleg(w:World,b:HaushaltsAbschluss):void {
  const z=haushaltZustand(w);b.nachher=haushaltsStand(w);
  for(const p of b.posten)p.danach=z.stufen[p.id]??0;
  b.zusagen=zusagenStand(w,b.zusagen);
  const a=(z.abschluesse??=[]);if(a.some(x=>x.id===b.id))return;
  a.push(b);if(a.length>8)a.shift();
}

export function letzterHaushaltsBeschluss(w:World):HaushaltsAbschluss|undefined {
  return w.spiel?.wirtschaft?.haushalt.abschluesse?.at(-1);
}

/** Heutiger Status ist ausdrücklich von den gespeicherten Monatsständen getrennt. */
export function haushaltsNachsorge(w:World,b=letzterHaushaltsBeschluss(w)):HaushaltsMonatsbericht|undefined {
  if(!b||!w.spiel)return;
  const z=w.spiel.wirtschaft!.haushalt,reg=w.spiel.gueter?.regierung?.bericht,ware=w.spiel.gueter?.bilanz;
  return {monat:w.date.slice(0,7),datum:w.date,abschluss:structuredClone(b),stand:haushaltsStand(w),zusagen:zusagenStand(w,b.zusagen),
    ressort:structuredClone((w.spiel.ministerfluss?.ressortFolgen??[]).filter(f=>f.tag>w.day-31)),
    ressortnachsorge:structuredClone((w.spiel.ministerfluss?.ressortNachsorge??[]).filter(n=>n.status!=="abgeloest"||n.meldungen.some(m=>m.tag>w.day-31))),
    ministerpolitik:structuredClone((w.spiel.ministerfluss?.ressortVorfaelle??[]).filter(v=>Math.max(v.tag,v.entscheidung?.tag??0)>w.day-31)),
    reifung:z.reifungsbeleg?.beschluss===b.id?structuredClone(z.reifungsbeleg):undefined,
    umsetzung:b.posten.map(p=>({id:p.id,ziel:p.danach,heute:z.stufen[p.id]??0,wirksam:z.wirksam?(z.wirksam[p.id]??0):(z.stufen[p.id]??0),ersetzt:(z.stufen[p.id]??0)!==p.danach})),
    druck:[...new Set(w.spiel.lager)].flatMap(p=>{const d=zusagenDruck(w,p);return d?[structuredClone(d)]:[];}),
    versorgung:reg&&ware&&reg.monat===ware.monat?{monat:reg.monat,deckung:reg.deckung,handel:ware.handelsDeltaUsdMrd}:undefined};
}

/** Nach Versorgungsbewertung und tatsächlicher Koalitionsprüfung einmalig speichern. */
export function haushaltsMonatsabschluss(w:World):void {
  const b=haushaltsNachsorge(w);if(!b)return;
  const z=haushaltZustand(w),berichte=(z.monatsberichte??=[]);
  if(berichte.some(x=>x.monat===b.monat&&x.abschluss.id===b.abschluss.id))return;
  const r=z.reifungsbeleg;b.reifung=r?.tag===w.day&&r.beschluss===b.abschluss.id?structuredClone(r):undefined;
  const reg=w.spiel?.gueter?.regierung?.bericht;
  if(reg?.monat===b.monat&&reg.koalition)b.koalition=structuredClone(reg.koalition);
  berichte.push(b);if(berichte.length>12)berichte.shift();
  if(reg?.monat===b.monat)reg.haushalt=structuredClone(b);
}
