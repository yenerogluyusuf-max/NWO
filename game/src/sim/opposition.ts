// Die Opposition als Akteur (Fork GESELLSCHAFT, 05.10.2026; Prüfbericht 4: „Die Opposition ist kein Akteur“).
//
// Die stärkste Fraktion außerhalb des Lagers führt die Opposition. Sie hat eine Stärke (Mobilisierung und Glaubwürdigkeit), Bündnisse,
// laufende Verfahren und einen Märtyrer-Wert, und sie handelt selbst: Kampagnen gegen die Teuerung, Untersuchungsausschüsse, Großdemonstrationen,
// Bündnisse, Boykott des Parlaments, Anfragen. Der Spieler hat Instrumente mit Preis: Gespräch, Ausschuss zulassen, Ermittlungen, Aufhebung
// der Immunität, Parteiverbot. Repression schwächt sie sofort und stärkt sie später (Märtyrer). Alle Zahlen sind Spielparameter.

import type { World } from "./types";
import type { GesellschaftZustand, OppZugArt, OppositionZustand } from "./gesellschaft-typen";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { kannZahlen } from "./kapital";
import { hashWert, verbrauche } from "./aufmerksamkeit";
import { marktSchock } from "./maerkte";
import { PARTEI_NAME } from "./fraktionen";
import { gesellschaftVon, knoten, repressionBuchen } from "./gesellschaft";
import { starteBewegung } from "./bewegungen";
import { t } from "../i18n";

export const OPPOSITION = {
  /** Abstand der eigenen Züge in Tagen (Spielparameter) */
  zugMin: 55,
  zugSpanne: 70,
  /** Anpassung der Stärke an ihr Ziel je Monat */
  traegheit: 0.15,
  maertyrerVerfall: 0.96,
  verfahrenVerfall: 0.93,
  /** Tage bis zur Entscheidung des Verfassungsgerichts über ein Verbot */
  verbotTage: 180,
  ausschussTage: 60,
};

const lagerParteien = (w: World): Set<string> => new Set([w.player?.partei.kurz ?? "", ...(w.spiel?.lager ?? [])]);

/** Die Fraktionen außerhalb des Lagers, nach Sitzen geordnet. */
export function oppositionsFraktionen(w: World): { partei: string; sitze: number }[] {
  const lager = lagerParteien(w);
  return Object.entries(w.parliament?.seats ?? {})
    .filter(([p, s]) => !lager.has(p) && s > 0)
    .map(([partei, sitze]) => ({ partei, sitze }))
    .sort((a, b) => b.sitze - a.sitze);
}

export function oppositionStart(w: World): OppositionZustand {
  const fr = oppositionsFraktionen(w);
  const sitze = fr.reduce((s, f) => s + f.sitze, 0);
  return {
    partei: fr[0]?.partei ?? "Opposition",
    staerke: clamp(20 + (80 * sitze) / 600, 20, 70),
    buendnis: [],
    verfahren: 0,
    maertyrer: 0,
    naechsterZug: w.day + 45,
    zuege: [],
  };
}

export function oppositionVon(w: World): OppositionZustand {
  return gesellschaftVon(w).opposition;
}

export const parteiName = (k: string): string => PARTEI_NAME[k] ?? k;

/** Das Ziel der Stärke: Unzufriedenheit, Märtyrer und Bündnisse stärken, laufende Verfahren und eine beliebte Regierung schwächen. */
export function zielStaerke(w: World, o: OppositionZustand): number {
  const zust = w.spiel?.umfrage.zustimmung ?? 50;
  return clamp(48 + 0.8 * (50 - zust) + 0.25 * o.maertyrer + 3 * o.buendnis.length - 2.5 * o.verfahren + 0.1 * (knoten(w, "polarisierung") - 50), 5, 95);
}

function hinweis(w: World, art: string, titel: string, text: string): void {
  w.spiel?.hinweise.push({ id: `gesellschaft-opp-${art}-${w.day}`, titel, text: [text], szene: "parlament" });
}

function zug(w: World, o: OppositionZustand, art: OppZugArt, text: string, gross: boolean): void {
  o.zuege.push({ tag: w.day, datum: w.date, art, text });
  if (o.zuege.length > 40) o.zuege.splice(0, o.zuege.length - 40);
  addLog(w, "ereignis", text, t("ges.opp.log_warum", { partei: parteiName(o.partei) }));
  if (gross) hinweis(w, art, t(`ges.opp.zug.${art}.titel`, { partei: parteiName(o.partei) }), text);
}

/** Welcher Zug jetzt naheliegt: nach den Schwächen der Regierung und der eigenen Lage. */
export function naechsterZugArt(w: World, o: OppositionZustand): OppZugArt {
  const g = gesellschaftVon(w);
  const inflation = w.published?.inflation?.value ?? w.economy.inflation;
  if (o.verbot && !o.verbot.ausgang) return "boykott";
  if (o.immunitaetAufgehoben && g.repression > 45) return "boykott";
  if (o.staerke < 45 && o.buendnis.length < 2 && oppositionsFraktionen(w).length > o.buendnis.length + 1) return "buendnis";
  if (g.repression > 40 || knoten(w, "polarisierung") > 65) return "grossdemo";
  if (inflation > 15) return "kampagne";
  if (knoten(w, "korruption") > 55 && !o.ausschussBis) return "ausschuss";
  return "anfrage";
}

function fuehreZugAus(w: World, o: OppositionZustand, art: OppZugArt): void {
  const name = parteiName(o.partei);
  switch (art) {
    case "kampagne":
      wirke(w, "vertrauen_regierung", -0.35);
      wirke(w, "arbeitnehmer", -0.2);
      wirke(w, "rentner", -0.15);
      o.staerke = clamp(o.staerke + 2, 0, 100);
      zug(w, o, art, t("ges.opp.zug.kampagne.text", { partei: name }), false);
      break;
    case "ausschuss":
      o.ausschussBis = w.day + OPPOSITION.ausschussTage;
      wirke(w, "legitimitaet", -0.3);
      o.staerke = clamp(o.staerke + 1.5, 0, 100);
      zug(w, o, art, t("ges.opp.zug.ausschuss.text", { partei: name, tage: OPPOSITION.ausschussTage }), true);
      break;
    case "grossdemo": {
      o.staerke = clamp(o.staerke + 2.5, 0, 100);
      starteBewegung(w, "opposition", [34, 6, 35], 22);
      zug(w, o, art, t("ges.opp.zug.grossdemo.text", { partei: name }), true);
      break;
    }
    case "buendnis": {
      const neu = oppositionsFraktionen(w).find((f) => f.partei !== o.partei && !o.buendnis.includes(f.partei));
      if (!neu) return fuehreZugAus(w, o, "anfrage");
      o.buendnis.push(neu.partei);
      o.staerke = clamp(o.staerke + 5, 0, 100);
      wirke(w, "polarisierung", 0.8);
      zug(w, o, art, t("ges.opp.zug.buendnis.text", { partei: name, mit: parteiName(neu.partei) }), true);
      break;
    }
    case "boykott":
      wirke(w, "legitimitaet", -1.5);
      wirke(w, "ansehen", -0.5);
      o.staerke = clamp(o.staerke + 1, 0, 100);
      zug(w, o, art, t("ges.opp.zug.boykott.text", { partei: name }), true);
      break;
    case "anfrage":
      wirke(w, "vertrauen_regierung", -0.1);
      zug(w, o, art, t("ges.opp.zug.anfrage.text", { partei: name }), false);
      break;
  }
}

/** Monatlich: Führung prüfen (die stärkste Fraktion außerhalb des Lagers), Stärke folgt dem Ziel, Verfahren und Märtyrer klingen ab, Züge. */
export function oppositionMonat(w: World, g: GesellschaftZustand): void {
  const o = g.opposition;
  const fr = oppositionsFraktionen(w);
  if (fr[0] && !fr.some((f) => f.partei === o.partei)) o.partei = fr[0].partei;
  o.buendnis = o.buendnis.filter((p) => fr.some((f) => f.partei === p));
  o.staerke = clamp(o.staerke + OPPOSITION.traegheit * (zielStaerke(w, o) - o.staerke), 0, 100);
  o.maertyrer = clamp(o.maertyrer * OPPOSITION.maertyrerVerfall, 0, 100);
  o.verfahren = clamp(o.verfahren * OPPOSITION.verfahrenVerfall, 0, 12);
  if (o.ausschussBis !== undefined && w.day > o.ausschussBis) {
    // Verweigert: Die Forderung verfällt, das Misstrauen bleibt
    wirke(w, "legitimitaet", -0.4);
    o.staerke = clamp(o.staerke + 1.5, 0, 100);
    delete o.ausschussBis;
    addLog(w, "ereignis", t("ges.opp.ausschuss_verweigert", { partei: parteiName(o.partei) }));
  }
  if (o.verbot && !o.verbot.ausgang && w.day >= o.verbot.entscheidAm) verbotEntscheiden(w, o);
  if (w.day >= o.naechsterZug) {
    fuehreZugAus(w, o, naechsterZugArt(w, o));
    o.naechsterZug = w.day + OPPOSITION.zugMin + Math.floor(hashWert(`${w.seed}|opp|${w.day}`) * OPPOSITION.zugSpanne);
  }
  // Auf die Stimmung wirkt die Opposition über ihre Züge, nicht als Dauerabzug: Sonst zählte sie doppelt (Gegnerstärke im Wahlmodul)
}

function verbotEntscheiden(w: World, o: OppositionZustand): void {
  const v = o.verbot!;
  const unabh = knoten(w, "justiz_unabhaengigkeit");
  const p = clamp(0.25 + ((50 - unabh) / 100) * 0.8, 0.05, 0.85);
  const name = parteiName(o.partei);
  if (hashWert(`${w.seed}|verbot|${v.seit}`) < p) {
    v.ausgang = "verboten";
    o.staerke = clamp(o.staerke * 0.6, 0, 100);
    o.maertyrer = clamp(o.maertyrer + 20, 0, 100);
    wirke(w, "protestdruck", 6);
    wirke(w, "ansehen", -4);
    wirke(w, "polarisierung", 4);
    hinweis(w, "verboten", t("ges.opp.verbot.verboten.titel", { partei: name }), t("ges.opp.verbot.verboten.text", { partei: name }));
  } else {
    v.ausgang = "abgewiesen";
    o.staerke = clamp(o.staerke + 8, 0, 100);
    wirke(w, "legitimitaet", -2);
    hinweis(w, "abgewiesen", t("ges.opp.verbot.abgewiesen.titel", { partei: name }), t("ges.opp.verbot.abgewiesen.text", { partei: name }));
  }
  addLog(w, "ereignis", t(`ges.opp.verbot.${v.ausgang}.titel`, { partei: name }));
}

// ---------------------------------------------------------------------------
// Instrumente des Spielers

export type OppInstrument = "gespraech" | "ausschuss_zulassen" | "ermittlung" | "immunitaet" | "verbot";

interface InstrumentDef {
  kapital: number;
  aufmerksamkeit: number;
  abkuehlung: number;
  /** Folgen in Worten, Schlüssel unter ges.opp.folge.* */
  folgen: string[];
}

export const OPP_INSTRUMENTE: Record<OppInstrument, InstrumentDef> = {
  gespraech: { kapital: 3, aufmerksamkeit: 6, abkuehlung: 90, folgen: ["polarisierung_runter", "staerke_leicht_rauf", "lager_murrt"] },
  ausschuss_zulassen: { kapital: 2, aufmerksamkeit: 4, abkuehlung: 0, folgen: ["legitimitaet_rauf", "vertrauen_leicht_runter", "staerke_leicht_runter"] },
  ermittlung: { kapital: 4, aufmerksamkeit: 8, abkuehlung: 180, folgen: ["staerke_runter", "maertyrer_rauf", "ansehen_runter", "markt"] },
  immunitaet: { kapital: 8, aufmerksamkeit: 10, abkuehlung: 99999, folgen: ["staerke_runter", "maertyrer_stark", "ansehen_runter", "eu_runter", "boykott"] },
  verbot: { kapital: 12, aufmerksamkeit: 12, abkuehlung: 99999, folgen: ["gericht", "polarisierung_rauf", "ansehen_runter", "markt", "rueckschlag"] },
};

export interface OppInstrumentSicht {
  id: OppInstrument;
  kapital: number;
  aufmerksamkeit: number;
  moeglich: boolean;
  grund?: string;
  folgen: string[];
  /** Erwartete Wirkung auf die Stärke (sofort, Punkte) */
  staerkeSofort: number;
}

export function oppositionInstrumente(w: World): OppInstrumentSicht[] {
  const g = gesellschaftVon(w);
  const o = g.opposition;
  const kap = w.spiel?.kapital ?? 0;
  const sofort: Record<OppInstrument, number> = { gespraech: 1, ausschuss_zulassen: -1, ermittlung: -6, immunitaet: -8, verbot: 0 };
  return (Object.keys(OPP_INSTRUMENTE) as OppInstrument[]).map((id) => {
    const d = OPP_INSTRUMENTE[id];
    let grund: string | undefined;
    const zuletzt = g.zuletzt[`opp|${id}`];
    if (id === "ausschuss_zulassen" && o.ausschussBis === undefined) grund = t("ges.opp.grund.keine_forderung");
    else if (id === "immunitaet" && o.immunitaetAufgehoben) grund = t("ges.opp.grund.schon_aufgehoben");
    else if (id === "verbot" && o.verbot) grund = o.verbot.ausgang ? t("ges.opp.grund.verbot_entschieden") : t("ges.opp.grund.verbot_laeuft");
    else if (zuletzt !== undefined && w.day - zuletzt < d.abkuehlung) grund = t("ges.grund.abkuehlung", { tage: d.abkuehlung - (w.day - zuletzt) });
    else if (!kannZahlen(kap, d.kapital)) grund = t("ges.grund.kapital", { kapital: d.kapital });
    return {
      id,
      kapital: d.kapital,
      aufmerksamkeit: d.aufmerksamkeit,
      moeglich: !grund,
      ...(grund ? { grund } : {}),
      folgen: d.folgen.map((f) => t(`ges.opp.folge.${f}`)),
      staerkeSofort: sofort[id],
    };
  });
}

export interface GesErgebnis {
  ok: boolean;
  text: string;
}

export function oppositionInstrument(w: World, id: OppInstrument): GesErgebnis {
  const sp = w.spiel;
  if (!sp) return { ok: false, text: "" };
  const sicht = oppositionInstrumente(w).find((s) => s.id === id)!;
  if (!sicht.moeglich) return { ok: false, text: sicht.grund ?? "" };
  const g = gesellschaftVon(w);
  const o = g.opposition;
  const d = OPP_INSTRUMENTE[id];
  sp.kapital -= d.kapital;
  verbrauche(w, d.aufmerksamkeit, `Opposition: ${id}`);
  g.zuletzt[`opp|${id}`] = w.day;
  const name = parteiName(o.partei);
  let text = "";
  switch (id) {
    case "gespraech":
      wirke(w, "polarisierung", -2);
      wirke(w, "legitimitaet", 0.5);
      wirke(w, "nationalisten", -0.5);
      o.staerke = clamp(o.staerke + 1, 0, 100);
      text = t("ges.opp.ergebnis.gespraech", { partei: name });
      break;
    case "ausschuss_zulassen":
      delete o.ausschussBis;
      wirke(w, "legitimitaet", 1.5);
      wirke(w, "vertrauen_regierung", -0.5);
      o.staerke = clamp(o.staerke - 1, 0, 100);
      text = t("ges.opp.ergebnis.ausschuss_zulassen");
      break;
    case "ermittlung":
      o.staerke = clamp(o.staerke - 6, 0, 100);
      o.verfahren = clamp(o.verfahren + 1, 0, 12);
      o.maertyrer = clamp(o.maertyrer + 8, 0, 100);
      wirke(w, "ansehen", -2);
      wirke(w, "beziehungen_eu", -2);
      wirke(w, "polarisierung", 2);
      wirke(w, "konservative", 0.5);
      marktSchock(w, "justiz", 0.6);
      repressionBuchen(w, 8);
      text = t("ges.opp.ergebnis.ermittlung", { partei: name });
      break;
    case "immunitaet":
      o.immunitaetAufgehoben = true;
      o.staerke = clamp(o.staerke - 8, 0, 100);
      o.maertyrer = clamp(o.maertyrer + 12, 0, 100);
      wirke(w, "legitimitaet", -2);
      wirke(w, "ansehen", -2.5);
      wirke(w, "beziehungen_eu", -3);
      marktSchock(w, "verhaftung", 0.8);
      repressionBuchen(w, 12);
      text = t("ges.opp.ergebnis.immunitaet", { partei: name });
      break;
    case "verbot":
      o.verbot = { seit: w.day, entscheidAm: w.day + OPPOSITION.verbotTage };
      wirke(w, "polarisierung", 4);
      wirke(w, "ansehen", -3);
      wirke(w, "beziehungen_eu", -4);
      marktSchock(w, "justiz", 1.0);
      repressionBuchen(w, 15);
      text = t("ges.opp.ergebnis.verbot", { partei: name, tage: OPPOSITION.verbotTage });
      break;
  }
  addLog(w, "entscheidung", text, t("ges.log.kapital", { kapital: d.kapital }));
  sp.chronik.push({ tag: w.day, datum: w.date, titel: t(`ges.opp.instrument.${id}`), ausgang: text });
  return { ok: true, text };
}
