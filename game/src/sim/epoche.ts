// Amtszeit-Epochen (Vorbild Civilization 6, RECHERCHE_GLM_16 §4.2): Historische Momente einer Amtszeit sammeln einen Epochenwert.
// Bei der Wiederwahl wird die abgelaufene Amtszeit bewertet: golden, normal, dunkel oder heroisch (golden nach einer dunklen).
// Die Bewertung wirkt in die neue Amtszeit hinein (Kapital, Legitimität, Protest) und steht in Chronik und Bilanz.
//
// Designlehre aus der Civ-6-Kritik: Momente müssen erzählen. Deshalb wenige, große Momente (Inflation gebrochen, Krieg gewonnen,
// Wunder eröffnet), keine Punkte für Kleinigkeiten. Alle Werte sind Spielparameter ohne Beleg.

import type { World } from "./types";
import { t } from "../i18n";
import { addLog } from "./log";
import { wirke } from "./wirkung";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { kriege } from "./krieg";
import { reichZustand, vorhabenDef } from "./reich";
import { grosseZiele, ZIELE } from "./grosseziele";
import { aussenZustand } from "./diplomatie";
import { akteurName } from "./welt-modell";

export type EpochenStufe = "golden" | "normal" | "dunkel" | "heroisch";

export interface EpochenMoment { tag: number; datum: string; id: string; wert: number; titel: string }

export interface EpochenZustand {
  /** Amtszeit, deren Momente gerade gesammelt werden */
  amtszeit: number;
  wert: number;
  momente: EpochenMoment[];
  /** Bewertungen abgelaufener Amtszeiten */
  bewertungen: { amtszeit: number; wert: number; stufe: EpochenStufe }[];
  /** Was schon gezählt wurde (Kriege, Bauwerke, Zielstufen, Sanktionen) und Abkühlungen je Momentart */
  gesehen: string[];
  zuletzt: Record<string, number>;
  /** Werte des Vormonats für Übergänge */
  vor?: { inflation: number; wachstum: number; usdTry: number[] };
}

export const EPOCHE = {
  /** Ab diesem Wert ist eine Amtszeit golden, bis zu diesem dunkel (Spielparameter) */
  goldenAb: 8,
  dunkelBis: -5,
  /** Nach einer dunklen Amtszeit genügt dieser Wert für eine heroische */
  heroischAb: 4,
  /** Abkühlung wiederkehrender Momente (Lira-Sturz, Massenprotest) in Tagen */
  abkuehlung: 365,
  folgen: {
    golden: { kapital: 15, legitimitaet: 3, protest: 0 },
    heroisch: { kapital: 20, legitimitaet: 4, protest: -3 },
    normal: { kapital: 0, legitimitaet: 0, protest: 0 },
    dunkel: { kapital: -10, legitimitaet: -3, protest: 3 },
  } as Record<EpochenStufe, { kapital: number; legitimitaet: number; protest: number }>,
} as const;

export function epochenZustand(w: World): EpochenZustand {
  const sp = w.spiel!;
  sp.epoche ??= { amtszeit: sp.amtszeit, wert: 0, momente: [], bewertungen: [], gesehen: [], zuletzt: {} };
  return sp.epoche;
}

function moment(w: World, id: string, wert: number, params: Record<string, string | number> = {}): void {
  const z = epochenZustand(w);
  const titel = t(`epoche.moment.${id}`, params);
  z.momente.push({ tag: w.day, datum: w.date, id, wert, titel });
  z.wert += wert;
  z.zuletzt[id] = w.day;
  w.spiel!.chronik.push({ tag: w.day, datum: w.date, titel: t("epoche.chronik.titel", { titel }), ausgang: t("epoche.chronik.wert", { wert: wert > 0 ? `+${wert}` : String(wert), summe: z.wert }) });
}

const frei = (z: EpochenZustand, id: string, tag: number): boolean => tag - (z.zuletzt[id] ?? -1e9) >= EPOCHE.abkuehlung;

/** Monatlich: neue historische Momente erkennen. Nur lesend auf die übrigen Bereiche. */
export function epocheMonat(w: World): void {
  const sp = w.spiel;
  if (!sp || sp.ende) return;
  const z = epochenZustand(w), e = w.economy;
  if (z.amtszeit !== sp.amtszeit) { z.amtszeit = sp.amtszeit; z.wert = 0; z.momente = []; }
  const vor = z.vor;
  // Wirtschaft: Inflation gebrochen, Rezession überwunden, Lira-Sturz, galoppierende Inflation
  if (vor) {
    if (vor.inflation >= 20 && e.inflation < 20 && !z.gesehen.includes(`inf20-${sp.amtszeit}`)) { z.gesehen.push(`inf20-${sp.amtszeit}`); moment(w, "inflation_gebrochen", 3); }
    if (vor.inflation >= 10 && e.inflation < 10 && !z.gesehen.includes("inf10")) { z.gesehen.push("inf10"); moment(w, "inflation_einstellig", 4); }
    if (vor.wachstum < 0 && e.growth > 0.5 && frei(z, "rezession_ueberwunden", w.day)) moment(w, "rezession_ueberwunden", 2);
    if (vor.inflation < 60 && e.inflation >= 60 && frei(z, "inflation_galopp", w.day)) moment(w, "inflation_galopp", -3);
    const vor3 = vor.usdTry[0];
    if (vor3 && e.usdTry / vor3 > 1.25 && frei(z, "lira_sturz", w.day)) moment(w, "lira_sturz", -3, { prozent: Math.round((e.usdTry / vor3 - 1) * 100) });
  }
  z.vor = { inflation: e.inflation, wachstum: e.growth, usdTry: [...(vor?.usdTry ?? []), e.usdTry].slice(-3) };
  // Gesellschaft: Massenproteste
  if (nationalAverage(NET, w.net, "protestdruck") >= 65 && frei(z, "massenprotest", w.day)) moment(w, "massenprotest", -3);
  // Bauwerke: Wunder und Großprojekte, die in dieser Partie fertig wurden (der Startbestand zählt nicht)
  const r = reichZustand(w);
  for (const id of Object.keys(r.bestand)) {
    const k = `bau-${id}`;
    if (z.gesehen.includes(k)) continue;
    z.gesehen.push(k);
    const v = vorhabenDef(id);
    if (!vor || !v || (v.klasse !== "wunder" && v.klasse !== "grossprojekt")) continue;
    moment(w, v.klasse === "wunder" ? "wunder" : "grossprojekt", v.klasse === "wunder" ? 4 : 2, { name: v.name });
  }
  // Krieg: Sieg, Frieden, Niederlage
  for (const k of kriege(w)) {
    if (!k.ausgang || z.gesehen.includes(`krieg-${k.id}`)) continue;
    z.gesehen.push(`krieg-${k.id}`);
    const land = akteurName(k.land);
    if (k.ausgang === "sieg") moment(w, "krieg_sieg", 5, { land });
    else if (k.ausgang === "niederlage" || k.ausgang === "rueckzug" || k.ausgang === "nachgegeben") moment(w, "krieg_niederlage", -5, { land });
    else if (k.ausgang === "weisser_frieden" || k.ausgang === "frieden") moment(w, "frieden", 2, { land });
  }
  // Große Ziele: jede erreichte Stufe, die Utopie besonders
  const g = grosseZiele(w);
  for (const ziel of ZIELE) {
    const stufe = g.stand[ziel.id]?.stufe ?? 0;
    for (let s = 1; s <= stufe; s++) {
      const k = `ziel-${ziel.id}-${s}`;
      if (z.gesehen.includes(k)) continue;
      z.gesehen.push(k);
      const utopie = s === ziel.stufen.length;
      moment(w, utopie ? "ziel_utopie" : "ziel_stufe", utopie ? 6 : 3, { ziel: t(`gz2.ziel.${ziel.id}.titel`) });
    }
  }
  // Sanktionen gegen die Türkei: neue kosten, aufgehobene (auch die Start-Sanktion) bringen
  const a = aussenZustand(w);
  const jetzt = a.sanktionen.map((s) => s.id);
  const startS = a.startSanktionen ?? [];
  for (const id of jetzt) {
    const k = `sank-${id}-${a.sanktionen.find((s) => s.id === id)!.seit}`;
    if (z.gesehen.includes(k)) continue;
    z.gesehen.push(k);
    if (vor && !startS.includes(id)) moment(w, "sanktion", -3, { von: akteurName(id === "caatsa" ? "USA" : "EU") });
  }
  for (const id of startS) {
    const k = `sank-aufgehoben-${id}`;
    if (!jetzt.includes(id) && !z.gesehen.includes(k)) { z.gesehen.push(k); moment(w, "sanktion_aufgehoben", 3, { von: akteurName(id === "caatsa" ? "USA" : "EU") }); }
  }
}

export function stufeVon(wert: number, vorige?: EpochenStufe): EpochenStufe {
  if (wert >= EPOCHE.goldenAb) return vorige === "dunkel" ? "heroisch" : "golden";
  if (vorige === "dunkel" && wert >= EPOCHE.heroischAb) return "heroisch";
  if (wert <= EPOCHE.dunkelBis) return "dunkel";
  return "normal";
}

/** Bei der Wiederwahl (sim/amtszeit.ts beginneAmtszeit): die abgelaufene Amtszeit bewerten und die Folgen setzen. */
export function bewerteEpoche(w: World, abgelaufen: number): EpochenStufe {
  const z = epochenZustand(w), sp = w.spiel!;
  if (z.bewertungen.some((b) => b.amtszeit === abgelaufen)) return z.bewertungen.find((b) => b.amtszeit === abgelaufen)!.stufe;
  const vorige = z.bewertungen.at(-1)?.stufe;
  const stufe = stufeVon(z.wert, vorige);
  z.bewertungen.push({ amtszeit: abgelaufen, wert: z.wert, stufe });
  const f = EPOCHE.folgen[stufe];
  if (f.kapital) sp.kapital = Math.max(0, sp.kapital + f.kapital);
  if (f.legitimitaet) wirke(w, "legitimitaet", f.legitimitaet);
  if (f.protest) wirke(w, "protestdruck", f.protest);
  const titel = t(`epoche.stufe.${stufe}`);
  sp.chronik.push({ tag: w.day, datum: w.date, titel: t("epoche.bewertung.titel", { nr: abgelaufen, stufe: titel }), ausgang: t(`epoche.stufe.${stufe}.folge`) });
  if (!sp.hinweise.some((h) => h.id === `epoche-${abgelaufen}`)) sp.hinweise.push({ id: `epoche-${abgelaufen}`, titel: t("epoche.bewertung.titel", { nr: abgelaufen, stufe: titel }), text: [t(`epoche.stufe.${stufe}.text`, { wert: z.wert }), t(`epoche.stufe.${stufe}.folge`)], szene: "wahlnacht" });
  addLog(w, "ereignis", t("epoche.bewertung.titel", { nr: abgelaufen, stufe: titel }), t(`epoche.stufe.${stufe}.folge`));
  z.amtszeit = abgelaufen + 1; z.wert = 0; z.momente = [];
  return stufe;
}

/** Für die Anzeige: Stand der laufenden Amtszeit und wohin er führt. */
export function epochenSicht(w: World): { amtszeit: number; wert: number; aussicht: EpochenStufe; momente: EpochenMoment[]; vorige?: EpochenStufe; bisGolden: number } | null {
  if (!w.spiel) return null;
  const z = w.spiel.epoche;
  const wert = z?.wert ?? 0, vorige = z?.bewertungen.at(-1)?.stufe;
  return { amtszeit: w.spiel.amtszeit, wert, aussicht: stufeVon(wert, vorige), momente: (z?.momente ?? []).slice(-3).reverse(), ...(vorige ? { vorige } : {}), bisGolden: Math.max(0, (vorige === "dunkel" ? EPOCHE.heroischAb : EPOCHE.goldenAb) - wert) };
}
