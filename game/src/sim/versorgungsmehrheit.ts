// Stimmen für Versorgungsvorlagen aus den bestehenden Sitzen, Parteilinien und Beziehungen.
// Reine Vorschau: kein Zufallszug und keine Veränderung beim Öffnen einer Ansicht.
import type { World } from "./types";
import type { VersorgungsProgramm } from "./versorgungspolitik";
import { parteiAchsen, spielerAchsen, uebereinstimmung } from "./linie";
import { NULL_ACHSEN } from "../data/linien";
import { startBereitschaft } from "./fraktionen";
import { clamp } from "./economy";
import { addDays } from "./dates";
import { aktiverKoalitionsVorsitz, KOALITIONSBRUCH_LOYALITAET, naechsteKoalitionspruefung, regierungsSitze } from "./koalitionslage";

export const VERSORGUNGS_KLAUSELN = ["sozial", "haushalt", "kontrolle", "zivil", "einsatz"] as const;
export type VersorgungsKlausel = typeof VERSORGUNGS_KLAUSELN[number];
export interface VersorgungsEntwurf {
  programm: VersorgungsProgramm;
  klauseln: VersorgungsKlausel[];
  gespraeche: string[];
}
export interface VersorgungsStimme {
  partei: string; sitze: number; ja: number;
  rolle: "eigene" | "koalition" | "duldung" | "opposition";
  forderung: VersorgungsKlausel; erfuellt: boolean; bereitschaft: number;
}
/** Gemeinsame Regel für Verhandlungsprognose und tatsächlich gebuchte Abstimmungsfolgen. */
export function versorgungsReaktionsDelta(f:VersorgungsStimme,angenommen:boolean):number {
  if(f.rolle==="eigene") return 0;
  return angenommen ? (f.erfuellt ? 3 : f.rolle==="koalition" ? -4 : -1) : f.rolle==="koalition" ? -2 : 0;
}
export interface VersorgungsBruchrisiko {
  partei:string;personen:{id:string;name:string;vorher:number;nachher:number}[];
  pruefung:string;zeitpunkt:"vorher"|"gleich"|"spaeter";angenommen:boolean;sitze:number;ohne:number;
}
/** Nur die unmittelbare Votumsreaktion unter heutiger Lage; weitere Monatsfolgen sind keine Zusage. */
export function versorgungsBruchrisiken(w:World,stimmen:VersorgungsStimme[],tag:number):VersorgungsBruchrisiko[] {
  const votum=addDays(w.date,tag-w.day),naechste=naechsteKoalitionspruefung(w.date),nachVotum=naechsteKoalitionspruefung(votum,true);
  const angenommen=stimmen.reduce((s,f)=>s+f.ja,0)>=301;
  return stimmen.filter(f=>f.rolle==="koalition").flatMap(f=>{
    const personen=(w.spiel?.figuren??[]).filter(p=>p.partei===f.partei&&aktiverKoalitionsVorsitz(w,p)).map(p=>({id:p.id,name:p.name,vorher:p.loyalitaet,nachher:clamp(p.loyalitaet+versorgungsReaktionsDelta(f,angenommen),0,100)}));
    const schonVorher=naechste<votum&&personen.some(p=>p.vorher<KOALITIONSBRUCH_LOYALITAET);
    const betroffen=personen.filter(p=>schonVorher?p.vorher<KOALITIONSBRUCH_LOYALITAET:p.nachher<KOALITIONSBRUCH_LOYALITAET);
    if(!betroffen.length)return [];
    return [{partei:f.partei,personen:betroffen,pruefung:schonVorher?naechste:nachVotum,
      zeitpunkt:schonVorher?"vorher":nachVotum===votum?"gleich":"spaeter",angenommen,sitze:f.sitze,ohne:regierungsSitze(w,f.partei)}];
  });
}
const MASSNAHME = { schutz: "m_preiskontrollen", energie: "m_lng_vertraege", netz: "m_regionalfoerderung" };
/** Ein zukünftiger Stichtag berücksichtigt bekannte Duldungsfristen; die übrige politische Lage bleibt die heutige. */
export function versorgungsStimmen(w: World, e: VersorgungsEntwurf, stichtag=w.day): VersorgungsStimme[] {
  const krieg = w.spiel?.kriege?.some(k => k.phase === "krieg" || k.phase === "waffenruhe");
  const kurs = e.klauseln.includes("zivil") ? "zivil" : e.klauseln.includes("einsatz") ? "militaer" : w.spiel?.gueter?.prioritaet;
  return Object.entries(w.parliament?.seats ?? {}).filter(([,s]) => s > 0).map(([partei, sitze]) => {
    const eigene = partei === w.player?.partei.kurz;
    const a = eigene ? spielerAchsen(w) : parteiAchsen(partei) ?? NULL_ACHSEN;
    const fr = w.spiel?.fraktionen?.[partei];
    const rolle: VersorgungsStimme["rolle"] = eigene ? "eigene" : w.spiel?.lager.includes(partei) ? "koalition" : (fr?.duldungBis ?? -1) > stichtag ? "duldung" : "opposition";
    const bereitschaft = fr?.bereitschaft ?? startBereitschaft(w, partei);
    const forderung: VersorgungsKlausel = a.national >= 60 && krieg ? "einsatz" : a.zentral <= -50 ? "zivil" : a.wirtschaft <= -20 || a.religion >= 70 ? "sozial" : a.wirtschaft >= 25 || a.national >= 60 ? "haushalt" : "kontrolle";
    const erfuellt = e.klauseln.includes(forderung);
    let linie = uebereinstimmung(a, MASSNAHME[e.programm], 1);
    if (krieg && kurs === "militaer") linie += a.national / 200;
    if (krieg && kurs === "zivil") linie -= a.national / 200;
    if (e.klauseln.includes("sozial") && a.wirtschaft > 20) linie -= 0.25;
    if (e.klauseln.includes("haushalt") && a.wirtschaft < -20) linie -= 0.3;
    linie = clamp(linie, -1, 1);
    const gespraech = e.gespraeche.includes(partei) ? 0.06 : 0;
    const anteil = eigene ? 0.9 + 0.08 * linie + (erfuellt ? 0.03 : 0) : rolle === "koalition"
      ? 0.64 + 0.14 * linie + (bereitschaft - 50) * 0.002 + (erfuellt ? 0.24 : 0) + gespraech
      : (rolle === "duldung" ? 0.35 : 0.07) + 0.18 * Math.max(0, linie) + bereitschaft * 0.001 + (erfuellt ? 0.48 : 0) + gespraech;
    return { partei, sitze, ja: Math.round(sitze * clamp(anteil, 0, 1)), rolle, forderung, erfuellt, bereitschaft };
  }).sort((a,b) => b.sitze-a.sitze || a.partei.localeCompare(b.partei));
}

/** Noch laufende Duldungen, die zum geplanten Votum bereits beendet sind. */
export function auslaufendeVersorgungsDuldungen(w:World,stichtag:number): {partei:string;bis:number}[] {
  return Object.entries(w.parliament?.seats??{}).flatMap(([partei,sitze])=>{
    const bis=w.spiel?.fraktionen?.[partei]?.duldungBis;
    return sitze>0 && partei!==w.player?.partei.kurz && !w.spiel?.lager.includes(partei) && bis!==undefined && bis>w.day && bis<=stichtag ? [{partei,bis}] : [];
  });
}
