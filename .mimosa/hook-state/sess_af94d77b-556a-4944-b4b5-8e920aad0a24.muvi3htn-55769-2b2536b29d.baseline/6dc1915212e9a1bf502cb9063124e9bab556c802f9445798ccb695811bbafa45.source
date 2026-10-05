// Gesellschaft als System (Fork GESELLSCHAFT, 05.10.2026; SPIEL_DURCHDACHT_2026-10-05.md, Welle 4; Prüfberichte 4 und 7).
//
// Bisher waren die Wählergruppen Senken: Wut verpuffte, Proteste klangen in zwei Jahren auf den Startwert zurück, die Opposition handelte
// nie, Rathäuser waren eine Zahl aus 2024. Dieses Modul gibt der Gesellschaft Zustand und Gedächtnis:
//
//   gesellschaftVon(w)      Zustand (Milieus mit Groll, Repressionsgedächtnis, Opposition, Bewegungen, Rathäuser, Verlauf)
//   gesellschaftMonat(w)    monatlich (aus sim/waehler-verlauf.ts aufgerufen): Milieus, Opposition, Bewegungen, Kommunen, Rückwirkung
//   milieuLage(w)           die fünf Milieus (Kurden, Aleviten, Frauen, Geflüchtete, Diaspora) mit Stimmung, Groll, Trend und Ursachen
//   gesellschaftLage(w)     Kennzahlen der Akte mit Verlauf
//
// Milieus sind keine neuen Wählergruppen im Politiknetz (das würde jede Zustimmungsrechnung neu kalibrieren), sondern eine Schicht darüber:
// Ihre Stimmung wird aus vorhandenen Knoten gelesen, ihr Groll ist eigener Zustand und wirkt zurück (Proteste, Gruppenlaune, Polarisierung).
// Die Kurdinnen und Kurden werden nach dem Stimmenanteil der YSP 2023 je Provinz gewichtet (data/provinzdaten.json, belegt), als Näherung
// für die Siedlungsschwerpunkte; Aleviten, Frauen, Geflüchtete und Diaspora landesweit. Alle Zahlen sind Spielparameter.

import type { World } from "./types";
import type { GesellschaftZustand, GesellschaftsMonat, MilieuId, MilieuZustand } from "./gesellschaft-typen";
import { NET } from "./modell";
import { PROVINCES, nationalAverage } from "./netz";
import { PROVINZEN } from "./regional";
import { wirke } from "./wirkung";
import { clamp } from "./economy";
import { oppositionMonat, oppositionStart } from "./opposition";
import { bewegungenMonat } from "./bewegungen";
import { kommunenMonat, kommunenStart, rathaeuserLager } from "./kommunen";

export const GESELLSCHAFT = {
  /** Groll wächst um diesen Anteil der Lücke unter 50 je Monat, sonst klingt er ab (Spielparameter) */
  grollZuwachs: 0.08,
  grollAbbau: 0.04,
  grollVerfall: 0.985,
  /** Repressionsgedächtnis: Verfall je Monat (Spielparameter) */
  repressionVerfall: 0.97,
  /** Rückwirkung des Grolls auf die Laune der zugehörigen Gruppe je Grollpunkt über 30 (Spielparameter) */
  grollAufGruppe: 0.008,
  /** Repression über 30 nährt Polarisierung und Protestdruck je Punkt (Spielparameter) */
  repressionAufPolarisierung: 0.015,
  repressionAufProtest: 0.02,
  verlaufMax: 120,
};

interface Quelle {
  id: string;
  g: number;
}

interface MilieuDef {
  id: MilieuId;
  /** Netzgruppe, auf die der Groll zurückwirkt */
  gruppe?: string;
  quellen: Quelle[];
  /** Provinzgewicht (Anteil), sonst Bevölkerung */
  gewicht?: (plaka: number) => number;
}

const YSP = PROVINZEN.map((p) => (p.stimmen2023?.YSP ?? 0) * p.bevoelkerung);
const YSP_SUMME = YSP.reduce((a, b) => a + b, 0) || 1;

export const MILIEUS: MilieuDef[] = [
  {
    id: "kurden",
    gruppe: "minderheiten",
    gewicht: (plaka) => YSP[plaka - 1]! / YSP_SUMME,
    quellen: [
      { id: "minderheiten", g: 0.55 },
      { id: "m_minderheitenrechte", g: 0.25 },
      { id: "m_friedensprozess", g: 0.25 },
      { id: "ausnahmerecht", g: -0.2 },
      { id: "terrorgefahr", g: -0.1 },
    ],
  },
  {
    id: "aleviten",
    gruppe: "minderheiten",
    quellen: [
      { id: "minderheiten", g: 0.45 },
      { id: "m_minderheitenrechte", g: 0.15 },
      { id: "m_religionsbehoerde", g: -0.25 },
      { id: "m_religioese_schulen", g: -0.2 },
      { id: "polarisierung", g: -0.1 },
    ],
  },
  {
    id: "frauen",
    gruppe: "staedtische_saekulare",
    quellen: [
      { id: "frauenrechte", g: 0.4 },
      { id: "m_gewaltschutz", g: 0.25 },
      { id: "m_kinderbetreuung", g: 0.15 },
      { id: "arbeitnehmer", g: 0.1 },
      { id: "m_religioese_schulen", g: -0.1 },
    ],
  },
  {
    id: "gefluechtete",
    quellen: [
      { id: "m_integration", g: 0.35 },
      { id: "m_rueckkehr", g: -0.3 },
      { id: "nationalisten", g: -0.15 },
      { id: "arme", g: 0.1 },
    ],
  },
  {
    id: "diaspora",
    quellen: [
      { id: "ansehen", g: 0.3 },
      { id: "beziehungen_eu", g: 0.2 },
      { id: "m_eu_annaeherung", g: 0.1 },
      { id: "pressefreiheit", g: 0.15 },
      { id: "polarisierung", g: -0.1 },
    ],
  },
];

export const MILIEU_IDS = MILIEUS.map((m) => m.id);

/** Wert eines Netzknotens, landesweit oder mit eigenem Provinzgewicht; fehlt der Knoten, 50. */
export function knoten(w: World, id: string, gewicht?: (plaka: number) => number): number {
  const i = NET.index.get(id);
  if (i === undefined) return 50;
  if (!gewicht) return nationalAverage(NET, w.net, id);
  let s = 0;
  let g = 0;
  for (let p = 0; p < PROVINCES; p++) {
    const gp = gewicht(p + 1);
    s += w.net.values[i * PROVINCES + p]! * gp;
    g += gp;
  }
  return g > 0 ? s / g : nationalAverage(NET, w.net, id);
}

/** Wert eines Knotens in einer Provinz. */
export function knotenIn(w: World, id: string, plaka: number): number {
  const i = NET.index.get(id);
  if (i === undefined) return 50;
  return w.net.values[i * PROVINCES + plaka - 1]!;
}

export function milieuStimmung(w: World, def: MilieuDef): number {
  let s = 50;
  for (const q of def.quellen) s += q.g * (knoten(w, q.id, def.gewicht) - 50);
  return clamp(s, 0, 100);
}

function startZustand(w: World): GesellschaftZustand {
  const milieus = {} as Record<MilieuId, MilieuZustand>;
  for (const m of MILIEUS) {
    const st = milieuStimmung(w, m);
    // Startgroll: was schon da ist, wenn das Spiel beginnt (Spielparameter aus der Startstimmung)
    milieus[m.id] = { groll: clamp(20 + 0.5 * (50 - st), 5, 60), stimmung: st };
  }
  return {
    v: 1,
    milieus,
    repression: clamp(10 + 0.3 * (knoten(w, "ausnahmerecht") - 30), 0, 60),
    opposition: oppositionStart(w),
    bewegungen: [],
    frueher: [],
    kommunen: kommunenStart(w),
    verlauf: [],
    zuletzt: {},
    monat: w.date.slice(0, 7),
  };
}

/** Der Zustand; ältere Spielstände ohne Feld bekommen beim ersten Zugriff einen aus der aktuellen Lage gerechneten Start. */
export function gesellschaftVon(w: World): GesellschaftZustand {
  const sp = w.spiel!;
  sp.gesellschaft ??= startZustand(w);
  const g = sp.gesellschaft;
  for (const m of MILIEUS) g.milieus[m.id] ??= { groll: 20, stimmung: milieuStimmung(w, m) };
  g.bewegungen ??= [];
  g.frueher ??= [];
  g.verlauf ??= [];
  g.zuletzt ??= {};
  return g;
}

/** Repressionsgedächtnis erhöhen (Instrumente der Opposition, Polizei, Verbote, Zwangsverwalter). */
export function repressionBuchen(w: World, punkte: number): void {
  const g = gesellschaftVon(w);
  g.repression = clamp(g.repression + punkte, 0, 100);
}

/** Groll eines Milieus direkt verändern (Ereignisse, Zugeständnisse). */
export function grollAendern(w: World, id: MilieuId, delta: number): void {
  const g = gesellschaftVon(w);
  const m = g.milieus[id];
  if (m) m.groll = clamp(m.groll + delta, 0, 100);
}

function milieusMonat(w: World, g: GesellschaftZustand): void {
  const k = GESELLSCHAFT;
  for (const def of MILIEUS) {
    const m = g.milieus[def.id];
    const st = milieuStimmung(w, def);
    m.stimmung = st;
    const luecke = 50 - st;
    m.groll = clamp((m.groll + (luecke > 0 ? k.grollZuwachs * luecke : k.grollAbbau * luecke)) * k.grollVerfall, 0, 100);
    // Gedächtnis wirkt zurück: Wer lange gekränkt ist, wird nicht durch einen guten Monat versöhnt
    if (def.gruppe && m.groll > 35) wirke(w, def.gruppe, -k.grollAufGruppe * (m.groll - 35), def.id === "kurden" ? kurdischeProvinzen() : null);
  }
}

/** Provinzen mit dem höchsten YSP-Anteil 2023 (Näherung für kurdische Siedlungsschwerpunkte, belegt in data/provinzdaten.json). */
export function kurdischeProvinzen(n = 12): number[] {
  return [...PROVINZEN].sort((a, b) => (b.stimmen2023?.YSP ?? 0) - (a.stimmen2023?.YSP ?? 0)).slice(0, n).map((p) => p.plaka);
}

function repressionMonat(w: World, g: GesellschaftZustand): void {
  const k = GESELLSCHAFT;
  const ueber = Math.max(0, g.repression - 30);
  if (ueber > 0) {
    wirke(w, "polarisierung", k.repressionAufPolarisierung * ueber);
    if (NET.index.has("protestdruck")) wirke(w, "protestdruck", k.repressionAufProtest * ueber);
  }
  g.repression = clamp(g.repression * k.repressionVerfall, 0, 100);
}

/** Einmal im Monat (sim/waehler-verlauf.ts ruft es mit der Aufzeichnung): Milieus, Opposition, Straße, Kommunen, Verlauf. */
export function gesellschaftMonat(w: World): void {
  if (!w.spiel || w.spiel.ende) return;
  const g = gesellschaftVon(w);
  const monat = w.date.slice(0, 7);
  if (g.monat === monat && g.verlauf.length > 0) return;
  g.monat = monat;
  milieusMonat(w, g);
  repressionMonat(w, g);
  oppositionMonat(w, g);
  bewegungenMonat(w, g);
  kommunenMonat(w, g);
  const eintrag: GesellschaftsMonat = {
    monat,
    polarisierung: Math.round(knoten(w, "polarisierung") * 10) / 10,
    protest: Math.round(knoten(w, "protestdruck") * 10) / 10,
    opposition: Math.round(g.opposition.staerke * 10) / 10,
    repression: Math.round(g.repression * 10) / 10,
    rathaeuserLager: rathaeuserLager(w),
    grollMittel: Math.round((MILIEUS.reduce((s, m) => s + g.milieus[m.id].groll, 0) / MILIEUS.length) * 10) / 10,
    bewegungen: g.bewegungen.length,
  };
  g.verlauf.push(eintrag);
  if (g.verlauf.length > GESELLSCHAFT.verlaufMax) g.verlauf.splice(0, g.verlauf.length - GESELLSCHAFT.verlaufMax);
}

// ---------------------------------------------------------------------------
// Sichten für die Oberfläche

export interface MilieuSicht {
  id: MilieuId;
  stimmung: number;
  groll: number;
  /** Groll vor drei Monaten (aus dem Verlauf nicht gespeichert: Näherung über die Stimmung), Trend des Grolls */
  trend: "steigt" | "faellt" | "gleich";
  /** Die zwei stärksten Ursachen (Knoten mit Beitrag) */
  ursachen: { id: string; beitrag: number }[];
}

export function milieuLage(w: World): MilieuSicht[] {
  const g = gesellschaftVon(w);
  return MILIEUS.map((def) => {
    const m = g.milieus[def.id];
    const ursachen = def.quellen
      .map((q) => ({ id: q.id, beitrag: Math.round(q.g * (knoten(w, q.id, def.gewicht) - 50) * 10) / 10 }))
      .sort((a, b) => Math.abs(b.beitrag) - Math.abs(a.beitrag))
      .slice(0, 2);
    const luecke = 50 - m.stimmung;
    const trend = luecke > 2 ? "steigt" : luecke < -2 ? "faellt" : "gleich";
    return { id: def.id, stimmung: Math.round(m.stimmung), groll: Math.round(m.groll), trend, ursachen };
  });
}

export interface GesellschaftKennzahl {
  id: "polarisierung" | "protest" | "opposition" | "repression" | "rathaeuser" | "groll";
  wert: number;
  reihe: { monate: string[]; werte: (number | null)[] };
}

export function gesellschaftLage(w: World): GesellschaftKennzahl[] {
  const g = gesellschaftVon(w);
  const monate = g.verlauf.map((v) => v.monat);
  const reihe = (f: (v: GesellschaftsMonat) => number) => ({ monate, werte: g.verlauf.map(f) });
  return [
    { id: "polarisierung", wert: Math.round(knoten(w, "polarisierung")), reihe: reihe((v) => v.polarisierung) },
    { id: "protest", wert: Math.round(knoten(w, "protestdruck")), reihe: reihe((v) => v.protest) },
    { id: "opposition", wert: Math.round(g.opposition.staerke), reihe: reihe((v) => v.opposition) },
    { id: "repression", wert: Math.round(g.repression), reihe: reihe((v) => v.repression) },
    { id: "rathaeuser", wert: rathaeuserLager(w), reihe: reihe((v) => v.rathaeuserLager) },
    { id: "groll", wert: Math.round(MILIEUS.reduce((s, m) => s + g.milieus[m.id].groll, 0) / MILIEUS.length), reihe: reihe((v) => v.grollMittel) },
  ];
}

/** Für das Wahlmodul (Fork NACHFOLGE, sim/wahl.ts): Zuschlag auf die Gegnerstärke aus Opposition und Groll (Prozentpunkte, Spielparameter). */
export function gesellschaftWahlDruck(w: World): number {
  if (!w.spiel) return 0;
  const g = gesellschaftVon(w);
  const groll = MILIEUS.reduce((s, m) => s + g.milieus[m.id].groll, 0) / MILIEUS.length;
  return clamp(0.06 * (g.opposition.staerke - 50) + 0.04 * (groll - 30) + 0.02 * g.opposition.maertyrer, -4, 6);
}
