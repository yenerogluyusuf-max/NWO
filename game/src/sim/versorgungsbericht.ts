// Belege für einen abgeschlossenen Monat. Vergleichsläufe buchen weder Waren noch politische Folgen.
import type { World } from "./types";
import type { GutId } from "../data/gueter";
import type { VersorgungsBilanz, VersorgungsPrioritaet } from "./versorgung";
import type { TransportBilanz } from "./transport";
import { zivileVersorgungsDeckung, energiePartnerHindernis, type VersorgungsProgramm } from "./versorgungspolitik";
import { addDays } from "./dates";
import type { Msg } from "../i18n";

export interface EntscheidungsVergleich {
  deckung: number;
  einsatz?: number;
  handel: number;
  waren: { gut: GutId; deckung: number; bedarf: number; produktion: number; lager: number }[];
}
export interface VersorgungsEntscheidungsBeleg {
  id: "kurs" | VersorgungsProgramm;
  status: "aktiv" | "vorbereitung" | "beratung" | "beendet";
  ab?: string; bis?: string;
  grund?: Msg;
  vergleich?: EntscheidungsVergleich;
}
export interface VersorgungsNachweis {
  datum: string;
  kurs: VersorgungsPrioritaet;
  kursReferenz: VersorgungsPrioritaet;
  vorher?: { monat: string; deckung: number };
  einsatz?: number;
  entscheidungen: VersorgungsEntscheidungsBeleg[];
  engpaesse: { gut: GutId; deckung: number; lieferlaender: string[]; hormus: boolean }[];
}
export interface VersorgungsRechnung { bilanz: VersorgungsBilanz; transport: TransportBilanz }

function einsatzDeckung(t: TransportBilanz): number | undefined {
  const depots=Object.values(t.depots), bedarf=depots.reduce((n,d)=>n+d.bedarf,0);
  return bedarf>0 ? depots.reduce((n,d)=>n+d.verbraucht,0)/bedarf : undefined;
}
function vergleich(mit:VersorgungsRechnung,ohne:VersorgungsRechnung):EntscheidungsVergleich {
  const einsatz=einsatzDeckung(mit.transport), alternativ=einsatzDeckung(ohne.transport);
  return {
    deckung:zivileVersorgungsDeckung(mit.bilanz)-zivileVersorgungsDeckung(ohne.bilanz),
    einsatz:einsatz!==undefined && alternativ!==undefined ? einsatz-alternativ : undefined,
    handel:mit.bilanz.handelsDeltaUsdMrd-ohne.bilanz.handelsDeltaUsdMrd,
    waren:Object.entries(mit.bilanz.waren).flatMap(([id,f])=>{
      const alt=ohne.bilanz.waren[id as GutId];if(!f || !alt || id==="ruestung")return [];
      const d={gut:id as GutId,deckung:(f.bedarf>0?Math.min(1,f.geliefert/f.bedarf):1)-(alt.bedarf>0?Math.min(1,alt.geliefert/alt.bedarf):1),
        bedarf:f.bedarf-alt.bedarf,produktion:f.produktion-alt.produktion,lager:f.ende-alt.ende};
      return Math.max(Math.abs(d.deckung),Math.abs(d.bedarf),Math.abs(d.produktion),Math.abs(d.lager))>1e-8 ? [d] : [];
    }),
  };
}

/** Je Entscheidung: dieselbe Ausgangslage, nur diese Maßnahme auslassen; beim Kurs gilt der vorherige Kurs als Referenz.
 * Vergleiche sind nicht addierbar und behaupten keine rückwirkende Erklärung früherer Monate. */
export function versorgungsNachweis(w:World,ist:VersorgungsRechnung,rechne:(kopie:World)=>VersorgungsRechnung):VersorgungsNachweis {
  const z=w.spiel!.gueter!, reg=z.regierung, vorher=z.bilanz;
  const kurs=z.prioritaet??"ausgewogen",kursReferenz=reg?.kursVorher??"ausgewogen";
  const entscheidungen:VersorgungsEntscheidungsBeleg[]=[{id:"kurs",status:"aktiv"}];
  const datum=(tag:number)=>addDays(w.date,tag-w.day);
  for(const id of ["schutz","energie","netz"] as const) {
    const a=reg?.programme[id], v=reg?.vorlagen?.[id];
    if(a && a.bis>w.day) entscheidungen.push({id,status:a.ab>w.day?"vorbereitung":"aktiv",ab:datum(a.ab),bis:datum(a.bis)});
    else if(v?.status==="offen") entscheidungen.push({id,status:"beratung",ab:datum(v.abstimmung)});
    else if(a && a.bis>(vorher?.tag??w.day-31)) entscheidungen.push({id,status:"beendet",bis:datum(a.bis)});
  }
  for(const e of entscheidungen) {
    if(e.status!=="aktiv")continue;
    // Der Startkurs wird als Referenz gezeigt; er benötigt keinen identischen Zusatzlauf.
    if(e.id==="kurs" && kurs===kursReferenz)continue;
    const kopie=structuredClone(w);
    if(e.id==="kurs")kopie.spiel!.gueter!.prioritaet=kursReferenz;
    else delete kopie.spiel!.gueter!.regierung!.programme[e.id];
    e.vergleich=vergleich(ist,rechne(kopie));
    if(e.id==="energie") {
      const partner=reg?.programme.energie?.partner;
      if(partner)e.grund=energiePartnerHindernis(w,partner);
    }
  }
  return {datum:w.date,kurs,kursReferenz,vorher:vorher?{monat:vorher.monat,deckung:zivileVersorgungsDeckung(vorher)}:undefined,
    einsatz:einsatzDeckung(ist.transport),entscheidungen,
    engpaesse:Object.entries(ist.bilanz.waren).flatMap(([gut,f])=>f && gut!=="ruestung" && f.bedarf>0 && f.geliefert/f.bedarf<0.995
      ? [{gut:gut as GutId,deckung:f.geliefert/f.bedarf,lieferlaender:f.wege.filter(l=>l.grund!=="offen").map(l=>l.land),hormus:f.hormus>0}] : [])
      .sort((a,b)=>a.deckung-b.deckung).slice(0,3)};
}
