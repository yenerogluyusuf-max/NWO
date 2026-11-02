import type { World } from "./types";
import { haushaltsGesetzSicht, haushaltsStimmenKaufen } from "./haushalt";
import { haushaltZustand } from "./wirtschaft";
import { fraktionsUebersicht, verhandle, type FraktionSicht } from "./verhandeln";
import { REGELN, STIMMEN_PUFFER } from "./handeln";
import { AUFMERKSAMKEIT_KOSTEN } from "./aufmerksamkeit";
import { kannZahlen } from "./kapital";
import { Rng } from "./rng";
import { t } from "../i18n";
import { aktiverKoalitionsVorsitz, naechsteKoalitionspruefung } from "./koalitionslage";
import { zusagenDruck, type ZusagenDruckLage } from "./zusagendruck";

export type HaushaltsMehrheitsArt="einfach"|"puffer"|"duldung"|"koalition";
export interface HaushaltsMehrheitsPlan {
  art:HaushaltsMehrheitsArt;partei?:string;fraktion?:FraktionSicht;stand:string;
  vorher:number;nachher:number;gewinn:number;luecke:number;stimmen:number;
  pk:number;aufmerksamkeit:number;kapitalDanach:number;aufmerksamkeitDanach:number;
  bereitschaftDelta:number;moeglich:boolean;grund?:string;
  risiken:{partei:string;name:string;loyalitaet:number;datum:string;sitze:number}[];
  druck:ZusagenDruckLage[];
}

/** Vorhandene Handlungen probeweise auf einer Kopie ausführen; keine erfundenen Stimmen oder neuen Vertragsregeln. */
export function haushaltsMehrheitsPlan(w:World,art:HaushaltsMehrheitsArt,partei?:string):HaushaltsMehrheitsPlan|undefined {
  if(!w.spiel || w.spiel.ende || !["einfach","puffer","duldung","koalition"].includes(art))return;
  const k=structuredClone(w),vor=haushaltsGesetzSicht(k);
  if(!vor)return;
  const sp=k.spiel!,pkVor=sp.kapital,aufVor=sp.verfassung?.aufmerksamkeit??80;
  let fraktion:FraktionSicht|undefined,stimmen=0,pk=0,aufmerksamkeit=0,grund:string|undefined;
  let bereitschaftDelta=0;
  if(art==="einfach"||art==="puffer") {
    stimmen=Math.max(0,REGELN.mehrheit+(art==="puffer"?STIMMEN_PUFFER:0)-vor.ja);
    if(!stimmen)return;
    pk=Math.ceil(stimmen*REGELN.kaufKostenProStimme);
    if(!kannZahlen(pkVor,pk))grund=t("hm.kapital");
    else {const r=haushaltsStimmenKaufen(k,stimmen);if(!r.ok)grund=r.text;}
  } else {
    if(!partei)return;
    fraktion=fraktionsUebersicht(k).find(f=>f.partei===partei);
    const a=fraktion?.aktionen.find(a=>a.id===art);
    if(!fraktion||!a?.moeglich)return;
    // Vertragstext und festes Ziel bleiben die Werte vor dem Abschluss.
    fraktion=structuredClone({...fraktion,aktionen:[a]});
    pk=a.pk;aufmerksamkeit=art==="duldung"?AUFMERKSAMKEIT_KOSTEN.duldung:AUFMERKSAMKEIT_KOSTEN.koalition;
    const r=verhandle(k,partei,art,new Rng(w.rngState));if(!r.ok)return;
    bereitschaftDelta=(sp.fraktionen?.[partei]?.bereitschaft??0)-fraktion.bereitschaft;
  }
  const nach=haushaltsGesetzSicht(k)!;
  if(fraktion&&nach.ja<=vor.ja)return;
  const datum=naechsteKoalitionspruefung(w.date);
  const risiken=sp.figuren.filter(f=>aktiverKoalitionsVorsitz(k,f)&&f.loyalitaet<20&&datum<=nach.datum)
    .map(f=>({partei:f.partei!,name:f.name,loyalitaet:f.loyalitaet,datum,sitze:k.parliament?.seats[f.partei!]??0}));
  const druck=[...new Set(sp.lager)].flatMap(p=>{const d=zusagenDruck(k,p);return d&&d.pruefung<=nach.datum?[d]:[];});
  const plan:HaushaltsMehrheitsPlan={art,partei:fraktion?partei:undefined,fraktion,stand:"",vorher:vor.ja,nachher:grund?Math.min(600,vor.ja+stimmen):nach.ja,
    gewinn:grund?stimmen:nach.ja-vor.ja,luecke:grund?Math.max(0,301-vor.ja-stimmen):nach.luecke,stimmen,pk,aufmerksamkeit,
    kapitalDanach:pkVor-pk,aufmerksamkeitDanach:grund?aufVor:sp.verfassung?.aufmerksamkeit??80,bereitschaftDelta,moeglich:!grund,grund,risiken,druck};
  plan.stand=JSON.stringify({tag:w.day,datum:w.date,rng:w.rngState,gesetz:haushaltZustand(k).gesetz,
    kapital:w.spiel.kapital,verfassung:w.spiel.verfassung,sitze:w.parliament?.seats,lager:w.spiel.lager,plan});
  return plan;
}

/** Alle derzeit ausführbaren Abkommen, nach verbleibender Lücke und Preis sortiert. */
export function haushaltsFraktionsWege(w:World):HaushaltsMehrheitsPlan[] {
  if(!w.spiel||w.spiel.ende||!w.spiel.wirtschaft?.haushalt.gesetz)return [];
  return Object.keys(w.parliament?.seats??{}).flatMap(p=>["duldung","koalition"].flatMap(art=>{
    const angebot=haushaltsMehrheitsPlan(w,art as "duldung"|"koalition",p);return angebot?[angebot]:[];
  })).sort((a,b)=>a.luecke-b.luecke||a.pk-b.pk||b.gewinn-a.gewinn||(a.partei??"").localeCompare(b.partei??""));
}

/** Veraltete Karten buchen nichts; jede Annahme verwendet erneut die echten Handlungen. */
export function sichereHaushaltsMehrheit(w:World,angebot:HaushaltsMehrheitsPlan):{ok:boolean;text:string;why?:string} {
  const jetzt=haushaltsMehrheitsPlan(w,angebot.art,angebot.partei);
  if(!jetzt?.moeglich||jetzt.stand!==angebot.stand)return {ok:false,text:t("hm.veraltet")};
  if(jetzt.art==="einfach"||jetzt.art==="puffer")return haushaltsStimmenKaufen(w,jetzt.stimmen);
  const sp=w.spiel!,vorher=new Set(sp.zusagen.map(z=>z.id)),kapital=sp.kapital,aufmerksamkeit=sp.verfassung?.aufmerksamkeit??80;
  const rng=new Rng(w.rngState),r=verhandle(w,jetzt.partei!,jetzt.art,rng);
  if(r.ok){
    w.rngState=rng.state;
    (haushaltZustand(w).gesetz!.abkommen??=[]).push({partei:jetzt.partei!,art:jetzt.art,tag:w.day,datum:w.date,
      pk:kapital-sp.kapital,aufmerksamkeit:aufmerksamkeit-(sp.verfassung?.aufmerksamkeit??80),
      vorher:jetzt.vorher,nachher:haushaltsGesetzSicht(w)!.ja,bereitschaft:jetzt.bereitschaftDelta,
      zusagen:structuredClone(sp.zusagen.filter(z=>!vorher.has(z.id)))});
  }
  return r;
}
