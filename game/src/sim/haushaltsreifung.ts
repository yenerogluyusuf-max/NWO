import type { World } from "./types";
import { letzterHaushaltsBeschluss } from "./haushaltsbericht";
import { haushaltZustand } from "./wirtschaft";
import { haushaltMonat, POSTEN_NACH_ID } from "./haushalt";
import { transportPlan } from "./transport";
import { gueterSicht } from "./gueter";
import { zivileVersorgungsDeckung } from "./versorgungspolitik";
import { nationalAverage } from "./netz";
import { NET } from "./modell";

/** Isoliert nur den nächsten Reifungsschritt: gleicher heutiger Ausgangsstand, andere Zielansätze.
 * Frühere Wirkungen werden nicht rückwirkend entfernt; spätere Nachträge nicht dem alten Beschluss zugeschrieben. */
export function haushaltsReifungVorbereiten(w:World) {
  const b=letzterHaushaltsBeschluss(w);if(!b?.angenommen)return;
  const z=haushaltZustand(w);
  const posten=b.posten.filter(p=>(z.stufen[p.id]??0)===p.danach);
  if(!posten.length||z.reifungsbeleg?.tag===w.day)return;
  const alternativ=structuredClone(w),alt=haushaltZustand(alternativ);
  for(const p of posten)alt.stufen[p.id]=p.vorher;
  return {alternativ,posten,beschluss:b.id};
}

function versorgung(w:World) {
  // Die Vorschau darf weder Lager noch Transport- oder politische Konten des echten Spiels anlegen oder buchen.
  const k=structuredClone(w),plan=transportPlan(k),sicht=gueterSicht(k,plan);
  const waren=Object.fromEntries(sicht.map(s=>[s.def.id,s.fluss])),handel=sicht.reduce((n,s)=>n+s.fluss.handelsDeltaUsdMrd,0);
  const depots=Object.values(plan.bilanz.depots),bedarf=depots.reduce((n,d)=>n+d.bedarf,0);
  return {deckung:zivileVersorgungsDeckung({monat:w.date.slice(0,7),tag:w.day,waren,handelsDeltaUsdMrd:handel}),handel,
    einsatz:bedarf>0?depots.reduce((n,d)=>n+d.verbraucht,0)/bedarf:undefined};
}

export function haushaltsReifungBelegen(w:World,p:ReturnType<typeof haushaltsReifungVorbereiten>):void {
  if(!p)return;
  haushaltMonat(p.alternativ);
  const ist=versorgung(w),alt=versorgung(p.alternativ);
  const ids=new Set([...p.posten.flatMap(p=>POSTEN_NACH_ID[p.id]?.dauer.map(d=>d.id)??[]),"abwanderung"]);
  haushaltZustand(w).reifungsbeleg={beschluss:p.beschluss,tag:w.day,datum:w.date,posten:p.posten.map(p=>p.id),
    deckung:ist.deckung-alt.deckung,handel:ist.handel-alt.handel,
    einsatz:ist.einsatz!==undefined&&alt.einsatz!==undefined?ist.einsatz-alt.einsatz:undefined,
    knoten:[...ids].filter(id=>NET.index.has(id)).map(id=>({id,delta:nationalAverage(NET,w.net,id)-nationalAverage(NET,p.alternativ.net,id)})).filter(x=>Math.abs(x.delta)>1e-8)};
}
