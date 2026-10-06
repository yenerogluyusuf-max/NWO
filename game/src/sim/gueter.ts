// Güterbilanz: wie autark ist das Land, was wird eingeführt und ausgeführt, was liegt im Lager (data/gueter.ts).
//
// Schlank gehalten (Leitsatz „Realismus verpackt in ein Spiel“): 16 Warengruppen, ein Monatsschritt, wenige Spielparameter.
// Das Makromodell bleibt unangetastet. Mengen folgen den Netzknoten (Ernte, Industrie, Stromversorgung …) relativ zum Spielstart.
// Fällt Einfuhr aus (Krieg mit einem Lieferland, Sanktionen, Hormus), deckt zuerst das Lager, der Rest wird als Fehlmenge spürbar:
// Preise steigen, Industrie und Versorgung leiden, und zwar nur in der Abweichung von der Ausgangslage, damit eine ruhige Welt nichts verschiebt.
// Erdgas wird nur angezeigt; seine Versorgung rechnet das Außenmodul (sim/diplomatie.ts), damit nichts doppelt wirkt.

import { GUETER, GUT_NACH_ID, RESERVE_KOSTEN, type GutDef, type GutId } from "../data/gueter";
import { NET } from "./modell";
import { nationalAverage, startAverage } from "./netz";
import { wirke } from "./wirkung";
import { kosten } from "./ereignis-hilfen";
import { kannZahlen } from "./kapital";
import { aktiveKriege } from "./krieg";
import { aussenZustand, lieferanteilVerschieben } from "./diplomatie";
import { addLog } from "./log";
import { akteurName } from "./welt-modell";
import { t } from "../i18n";
import { werkZusatz } from "./wissensbaum-kern";
import type { World } from "./types";

export interface GueterZustand {
  v: 1;
  monat: string;
  /** Lager in der Einheit der Gruppe */
  lager: Partial<Record<GutId, number>>;
  ausfuhrStopp: GutId[];
  /** Ausfuhrförderung läuft bis zu diesem Tag */
  foerderungBis: Partial<Record<GutId, number>>;
  /** Einfuhrquelle gewechselt: halbiert den blockierten Anteil */
  quelleGewechselt: GutId[];
  /** Ausfallanteil der Einfuhr im ersten Monat: die Ausgangslage, die Märkte und Preise schon enthalten */
  basis?: Partial<Record<GutId, number>>;
  /** Zusätzlich angelegte strategische Reserve über den üblichen Lagerstand hinaus */
  reserve?: Partial<Record<GutId, number>>;
  /** Monate, seit der Ausfall über der Ausgangslage liegt: Der Handel weicht mit der Zeit auf andere Lieferländer aus */
  dauer?: Partial<Record<GutId, number>>;
  /** Letzte 24 Monate: Autarkiegrad je Gruppe */
  verlauf: { monat: string; autarkie: Partial<Record<GutId, number>> }[];
}

export interface GutSicht {
  def: GutDef;
  produktion: number;
  verbrauch: number;
  einfuhr: number;
  ausfuhr: number;
  lager: number;
  lagerMonate: number;
  /** Eigenversorgung in Prozent (Produktion zu Verbrauch, höchstens 100) */
  autarkie: number;
  /** Anteil der Einfuhr, der gerade ausfällt (0 bis 1) */
  blockiert: number;
  /** Ausfall über der Ausgangslage (0 bis 1): ihn muss das Lager decken */
  zusatz: number;
  /** Fehlmenge in Prozent des Monatsverbrauchs nach Lager */
  fehlProzent: number;
  /** Wie viele Tage das Lager reicht, wenn alle Einfuhren ausfallen (Infinity ohne nennenswerte Einfuhr) */
  reichweiteTage: number;
  /** Wie viele Tage das Lager beim jetzigen Ausfall reicht (Infinity ohne Ausfall) */
  reichweiteJetzt: number;
  /** Kriegsampel: rot unter 30, gelb unter 90 Tagen; „keine“, wo die Einfuhr kaum zählt */
  ampel: "gruen" | "gelb" | "rot" | "keine";
  ausfuhrStopp: boolean;
  foerderung: boolean;
  quelleGewechselt: boolean;
  /** Ein Satz zur Lage */
  satz: string;
}

/** Spielparameter */
export const GUETER_REGELN = {
  pkReserve: 2,
  pkFreigabe: 1,
  pkFoerderung: 3,
  pkStopp: 2,
  pkQuelle: 3,
  /** Förderung wirkt so viele Tage */
  foerderTage: 365,
  /** Kosten eines Quellenwechsels in % des BIP (teurere Lieferanten) */
  quelleKosten: 0.03,
  foerderKosten: 0.04,
  /** Anteil des Ausfalls, der nach einem Jahr Umleitung bleibt */
  restNachJahr: 1 / 3,
  /** Grenzen der Kriegsampel in Tagen Lagerreichweite (Idee aus RECHERCHE_GLM_3, 5.1) */
  ampelRot: 30,
  ampelGelb: 90,
};

export function gueterZustand(w: World): GueterZustand {
  const sp = w.spiel!;
  const s = sp as unknown as { gueter?: GueterZustand };
  if (!s.gueter) {
    const lager: Partial<Record<GutId, number>> = {};
    for (const g of GUETER) lager[g.id] = (g.verbrauch / 12) * g.lagerMonate;
    s.gueter = { v: 1, monat: "", lager, ausfuhrStopp: [], foerderungBis: {}, quelleGewechselt: [], verlauf: [] };
  }
  return s.gueter;
}

const stoss = (w: World, id: string, d: number): void => {
  if (NET.index.has(id) && d !== 0) wirke(w, id, d);
};

function verhaeltnis(w: World, knoten: string): number {
  if (!NET.index.has(knoten)) return 1;
  const jetzt = nationalAverage(NET, w.net, knoten);
  const start = startAverage(NET, w.net, knoten);
  return start > 0.5 ? jetzt / start : 1;
}

function faktor(w: World, treiber: { knoten: string; elastizitaet: number }[] | undefined): number {
  let f = 1;
  for (const tr of treiber ?? []) f *= 1 + tr.elastizitaet * (verhaeltnis(w, tr.knoten) - 1);
  return Math.max(0.2, Math.min(2, f));
}

/** Welche Lieferländer gerade ausfallen: Krieg mit der Türkei, Sanktionen gegen die Türkei. */
function ausfallLaender(w: World): Set<string> {
  const aus = new Set<string>();
  for (const k of aktiveKriege(w)) if (k.phase === "krieg" || k.phase === "waffenruhe") aus.add(k.land);
  try {
    for (const s of aussenZustand(w).sanktionen) aus.add(s.von);
  } catch {
    /* ohne Außenmodul (ältere Stände vor dem ersten Monat) keine Sanktionen */
  }
  return aus;
}

function hormusFaktor(w: World): number {
  try {
    const h = aussenZustand(w).energie.hormus;
    return h === "geschlossen" ? 1 : h === "gestoert" ? 0.4 : 0;
  } catch {
    return 0;
  }
}

function sichtVon(w: World, z: GueterZustand, g: GutDef, aus: Set<string>, hormus: number): GutSicht {
  // Neu gebaute Werke des Wissensbaums (Chipfabrik, Impfstoffwerk …) stellen zusätzlich her
  const produktion = g.produktion * faktor(w, g.produktionTreiber) * (1 + werkZusatz(w, g.id));
  const verbrauch = g.verbrauch * faktor(w, g.verbrauchTreiber);
  const stopp = z.ausfuhrStopp.includes(g.id);
  const foerderung = (z.foerderungBis[g.id] ?? -1) >= w.day;
  const ausfuhr = stopp ? 0 : g.ausfuhr * (produktion / Math.max(1e-9, g.produktion)) * (foerderung ? 1.15 : 1);
  const einfuhr = Math.max(0, verbrauch + ausfuhr - produktion);
  const gewechselt = z.quelleGewechselt.includes(g.id);
  let blockiert = g.lieferanten.filter((l) => aus.has(l.land)).reduce((a, l) => a + l.anteil, 0) / 100;
  blockiert += (g.hormusAnteil ?? 0) * hormus;
  if (gewechselt) blockiert *= 0.5;
  blockiert = Math.max(0, Math.min(1, blockiert));
  // Nach einem Jahr hat der Handel bis auf ein Drittel umgeleitet (teurer, aber lieferbar)
  const umgeleitet = Math.max(GUETER_REGELN.restNachJahr, 1 - (z.dauer?.[g.id] ?? 0) / 12);
  const zusatz = Math.max(0, blockiert - (z.basis?.[g.id] ?? blockiert)) * umgeleitet;
  const lager = z.lager[g.id] ?? 0;
  const monatsVerbrauch = verbrauch / 12;
  const fehlMonat = Math.max(0, (einfuhr * zusatz) / 12 - lager);
  const fehlProzent = monatsVerbrauch > 0 ? (fehlMonat / monatsVerbrauch) * 100 : 0;
  const tagesEinfuhr = einfuhr / 365;
  const reichweiteTage = tagesEinfuhr > 0 ? lager / tagesEinfuhr : Infinity;
  const reichweiteJetzt = zusatz > 0 && tagesEinfuhr > 0 ? lager / (tagesEinfuhr * zusatz) : Infinity;
  const zaehlt = g.id !== "ruestung" && einfuhr > 0.05 * verbrauch;
  const massgeblich = zusatz > 0 ? reichweiteJetzt : reichweiteTage;
  const ampel = !zaehlt ? "keine" : massgeblich < GUETER_REGELN.ampelRot ? "rot" : massgeblich < GUETER_REGELN.ampelGelb ? "gelb" : "gruen";
  const autarkie = g.id === "ruestung" ? (NET.index.has("ruestungsautarkie") ? Math.round(nationalAverage(NET, w.net, "ruestungsautarkie")) : 0) : verbrauch > 0 ? Math.min(100, (produktion / verbrauch) * 100) : 100;
  return {
    def: g, produktion, verbrauch, einfuhr, ausfuhr, lager,
    lagerMonate: monatsVerbrauch > 0 ? lager / monatsVerbrauch : 0,
    autarkie, blockiert, zusatz, fehlProzent, reichweiteTage, reichweiteJetzt, ampel, ausfuhrStopp: stopp, foerderung, quelleGewechselt: gewechselt,
    satz: satzFuer(g, autarkie, zusatz, fehlProzent),
  };
}

function satzFuer(g: GutDef, autarkie: number, blockiert: number, fehl: number): string {
  const name = t(`gueter.gut.${g.id}`);
  const haupt = g.lieferanten[0]?.land;
  const land = haupt ? akteurName(haupt) : "";
  if (fehl > 0.5) return t("gueter.satz.fehl", { name, fehl: Math.round(fehl) });
  if (blockiert > 0.05) return t("gueter.satz.lager", { name, anteil: Math.round(blockiert * 100) });
  if (autarkie >= 99.5) return t("gueter.satz.selbst", { name });
  if (haupt) return t("gueter.satz.einfuhr", { name, autarkie: Math.round(autarkie), land });
  return t("gueter.satz.knapp", { name, autarkie: Math.round(autarkie) });
}

/** Die ganze Bilanz in der Reihenfolge von data/gueter.ts */
export function gueterSicht(w: World): GutSicht[] {
  if (!w.spiel) return [];
  const z = gueterZustand(w);
  const aus = ausfallLaender(w);
  const hormus = hormusFaktor(w);
  return GUETER.map((g) => sichtVon(w, z, g, aus, hormus));
}

/** Üblicher Lagerstand plus angelegte Reserve */
export function lagerSoll(z: GueterZustand, g: GutDef): number {
  return (g.verbrauch / 12) * g.lagerMonate + (z.reserve?.[g.id] ?? 0);
}

/**
 * Monatsschritt: Fällt mehr Einfuhr aus als zu Beginn, deckt das Lager; ist es leer, wirkt die Fehlmenge ins Netz.
 * Ohne zusätzlichen Ausfall füllt der Handel das Lager langsam (ein Sechstel der Lücke je Monat) wieder auf.
 */
export function gueterMonat(w: World): void {
  if (!w.spiel) return;
  const z = gueterZustand(w);
  const monat = w.date.slice(0, 7);
  if (z.monat === monat) return;
  z.monat = monat;
  if (!z.basis) {
    const aus = ausfallLaender(w);
    const hormus = hormusFaktor(w);
    z.basis = Object.fromEntries(GUETER.map((g) => [g.id, sichtVon(w, { ...z, basis: {} }, g, aus, hormus).blockiert]));
  }
  const sicht = gueterSicht(w);
  for (const s of sicht) {
    const g = s.def;
    const lager = z.lager[g.id] ?? 0;
    const bedarf = (s.einfuhr * s.zusatz) / 12;
    z.dauer ??= {};
    z.dauer[g.id] = bedarf > 1e-9 ? (z.dauer[g.id] ?? 0) + 1 : 0;
    if (bedarf > 1e-9) z.lager[g.id] = Math.max(0, lager - bedarf);
    else {
      const soll = lagerSoll(z, g);
      if (lager < soll) z.lager[g.id] = lager + (soll - lager) / 6;
    }
    if (g.id === "erdgas" || g.id === "ruestung" || s.fehlProzent < 0.05) continue;
    for (const e of g.engpass) stoss(w, e.knoten, e.jeProzent * s.fehlProzent * 0.1);
  }
  z.verlauf.push({ monat, autarkie: Object.fromEntries(sicht.map((s) => [s.def.id, Math.round(s.autarkie)])) });
  if (z.verlauf.length > 24) z.verlauf.splice(0, z.verlauf.length - 24);
}

// ---------------------------------------------------------------------------
// Instrumente

export type GutInstrument = "reserve" | "freigabe" | "foerderung" | "stopp" | "quelle";

export interface InstrumentVorschau {
  id: GutInstrument;
  moeglich: boolean;
  pk: number;
  /** Kosten in % des BIP */
  bip: number;
  /** Wirkung in einem Satz */
  wirkung: string;
  grund?: string;
}

export function gutInstrumente(w: World, gut: GutId): InstrumentVorschau[] {
  const g = GUT_NACH_ID.get(gut)!;
  const z = gueterZustand(w);
  const kap = w.spiel?.kapital ?? 0;
  const out: InstrumentVorschau[] = [];
  const reserveKosten = RESERVE_KOSTEN[gut];
  if (reserveKosten !== undefined) {
    out.push({ id: "reserve", moeglich: kannZahlen(kap, GUETER_REGELN.pkReserve), pk: GUETER_REGELN.pkReserve, bip: reserveKosten, wirkung: t("gueter.wirkung.reserve") });
    const hat = (z.lager[gut] ?? 0) > g.verbrauch / 12 / 4;
    out.push({ id: "freigabe", moeglich: hat && kannZahlen(kap, GUETER_REGELN.pkFreigabe), pk: GUETER_REGELN.pkFreigabe, bip: 0, wirkung: t("gueter.wirkung.freigabe"), ...(hat ? {} : { grund: t("gueter.grund.leer") }) });
  }
  if (g.ausfuhr > 0) {
    const stopp = z.ausfuhrStopp.includes(gut);
    out.push({ id: "foerderung", moeglich: !stopp && kannZahlen(kap, GUETER_REGELN.pkFoerderung), pk: GUETER_REGELN.pkFoerderung, bip: GUETER_REGELN.foerderKosten, wirkung: t("gueter.wirkung.foerderung") });
    out.push({ id: "stopp", moeglich: kannZahlen(kap, GUETER_REGELN.pkStopp), pk: GUETER_REGELN.pkStopp, bip: 0, wirkung: t(stopp ? "gueter.wirkung.stopp_aus" : "gueter.wirkung.stopp") });
  }
  if (g.lieferanten.length && !z.quelleGewechselt.includes(gut)) {
    out.push({ id: "quelle", moeglich: kannZahlen(kap, GUETER_REGELN.pkQuelle), pk: GUETER_REGELN.pkQuelle, bip: GUETER_REGELN.quelleKosten, wirkung: t("gueter.wirkung.quelle") });
  }
  return out;
}

function preisKnoten(g: GutDef): string | undefined {
  return g.engpass.find((e) => e.jeProzent > 0)?.knoten;
}

export function fuehreGutInstrumentAus(w: World, gut: GutId, id: GutInstrument): { ok: boolean; text: string } {
  const sp = w.spiel;
  if (!sp) return { ok: false, text: "" };
  const g = GUT_NACH_ID.get(gut)!;
  const iv = gutInstrumente(w, gut).find((x) => x.id === id);
  if (!iv || !iv.moeglich) return { ok: false, text: iv?.grund ?? t("gueter.grund.nicht") };
  const z = gueterZustand(w);
  const name = t(`gueter.gut.${gut}`);
  sp.kapital -= iv.pk;
  if (iv.bip) kosten(w, iv.bip);
  const monat = g.verbrauch / 12;
  let text: string;
  switch (id) {
    case "reserve":
      z.lager[gut] = (z.lager[gut] ?? 0) + monat;
      z.reserve ??= {};
      z.reserve[gut] = (z.reserve[gut] ?? 0) + monat;
      text = t("gueter.erg.reserve", { name });
      break;
    case "freigabe": {
      z.lager[gut] = Math.max(0, (z.lager[gut] ?? 0) - monat);
      if (z.reserve?.[gut]) z.reserve[gut] = Math.max(0, z.reserve[gut]! - monat);
      const k = preisKnoten(g);
      if (k) stoss(w, k, -1.5);
      text = t("gueter.erg.freigabe", { name });
      break;
    }
    case "foerderung":
      z.foerderungBis[gut] = w.day + GUETER_REGELN.foerderTage;
      stoss(w, "export", 1);
      text = t("gueter.erg.foerderung", { name });
      break;
    case "stopp": {
      const i = z.ausfuhrStopp.indexOf(gut);
      if (i >= 0) {
        z.ausfuhrStopp.splice(i, 1);
        stoss(w, "export", 0.8);
        text = t("gueter.erg.stopp_aus", { name });
      } else {
        z.ausfuhrStopp.push(gut);
        const k = preisKnoten(g);
        if (k) stoss(w, k, -1);
        stoss(w, "export", -0.8);
        stoss(w, "ansehen", -0.5);
        text = t("gueter.erg.stopp", { name });
      }
      break;
    }
    case "quelle":
      z.quelleGewechselt.push(gut);
      if (gut === "erdgas") lieferanteilVerschieben(w, "LNG", 5);
      text = t("gueter.erg.quelle", { name });
      break;
  }
  addLog(w, "entscheidung", text);
  return { ok: true, text };
}
