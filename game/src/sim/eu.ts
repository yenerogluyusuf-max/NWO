// Der EU-Beitrittsprozess als mehrjähriger Vorgang — das größte Langzeitziel der Bühne (AUS-2,
// VERBESSERUNGSPLAN_2026-09-30; RECHERCHE_REALWELT_LAENDERDOSSIERS.md, Dossier 2 „EU als Akteur",
// Dossier 17 „Zypern" und Teil IV „Verknüpfungen").
//
// Der Weg und seine ehrlichen Bremsen:
//   1. Eingefroren: Die Gespräche liegen seit 2018 auf Eis; der Two-Track (Sicherheit, Energie,
//      Migration) ersetzt keine Beitrittsperspektive. Der Präsident kann ein Reformpaket ankündigen
//      (Voraussetzung: Die Maßnahme „Annäherung an die EU" steht hoch genug — Ankündigung ohne
//      Substanz macht das Spiel nicht mit).
//   2. Screening: zwölf Monate Bestandsaufnahme durch die Kommission.
//   3. Kapitel-Verhandlungen: 10 von 35 Kapiteln als spielbare Menge (Kompression, Begründung unten),
//      höchstens zwei parallel, der Rest der Reihe nach. Ein Kapitel öffnet, wenn seine Öffnungs-
//      kriterien am Politiknetz messbar erfüllt sind; es schließt vorläufig, wenn die Schlusskriterien
//      erfüllt sind UND die Verhandlungszeit vergangen ist.
//   4. Blocker: die Zypern-Kopplung (ohne Bewegung im Zypern-Dossier bleiben die Kapitel 23 und 24
//      zu — dokumentierte Verknüpfung), nationale Vetos benannter Mitgliedstaaten (Griechenland,
//      Zypern: Auto-Stopp A) und die Alibi-Erkennung (Kriterien nur knapp erfüllt → der Fortschritts-
//      bericht erkennt Fensterdressing, Stillstand und Gesichtsverlust).
//   5. Zwischenziele: das Zollunion-Update als eigenes Teilabkommen mit echten Effekten (Auto-Stopp A)
//      und die Visaliberalisierung als separater Mini-Track mit sechs Kriterien.
//   6. Jährlicher Fortschrittsbericht im November (Auto-Stopp B, vor dem Haushaltsfenster):
//      benotet jedes Kapitel und nennt die nächsten Schritte.
//   7. Endgame: die Beitritts-Perspektive. Mit zehn Kapiteln à zwei bis drei Jahren und maximal zwei
//      parallelen Verhandlungen ist sie in einer einzigen Amtszeit nicht zu schaffen — das ist Absicht
//      und steht so im Spiel.
//
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { addLog } from "./log";
import { clamp } from "./economy";
import { wirke, vertrauenAendern } from "./wirkung";
import { landAendern, vertrauenZu, weltZustand } from "./laender";
import { laufende } from "./abkommen";
import { zeitungEreignis } from "./zeitung";
import { oeffne } from "./ereignisse";
import { kannZahlen } from "./kapital";
import { formatDateDe } from "./dates";
import type { Rng } from "./rng";
import type { World } from "./types";
import { t } from "../i18n";

// ---------------------------------------------------------------------------
// Spielparameter des Vorgangs

export const EU_REGELN = {
  /** Dauer des Screenings in Tagen (zwölf Monate) */
  screeningTage: 365,
  /** Höchstens so viele Kapitel werden parallel verhandelt, der Rest der Reihe nach */
  parallelMax: 2,
  /** Monat des jährlichen Fortschrittsberichts (November, vor dem Haushaltsfenster) */
  berichtMonat: 11,
  /**
   * Alibi-Schwelle: Ein Kriterium, das nur um weniger als so viele Punkte über der Marke steht,
   * liest Brüssel als Fensterdressing — das Kapitel rührt sich nicht, bis die Substanz stimmt.
   */
  alibiMarge: 3,
  /** Ab so vielen vorläufig geschlossenen Kapiteln bietet Brüssel das Mandat für das Zollunion-Update an */
  zollunionKapitel: 3,
  /** Nach einer Ablehnung des Zollunion-Angebots kommt es frühestens so viele Tage wieder auf den Tisch */
  zollunionSperreTage: 730,
  /** Nach einem nicht beantworteten Veto ist das Kapitel so viele Tage blockiert */
  vetoSperreTage: 365,
  /** Kapital für die Ankündigung des Reformpakets */
  pkAnkuendigung: 6,
  /** Kapital für das Zugeständnis, mit dem ein Veto aufgehoben wird */
  pkVetoZugestaendnis: 5,
  /** Laufender Innenpreis je verhandeltem Kapitel (REC-Logik: Reformen kosten laufend Kapital) */
  kapitalJeKapitel: 0.15,
} as const;

// ---------------------------------------------------------------------------
// Zustand (reines JSON; ältere Spielstände legen ihn beim ersten Zugriff an)

export type EuPhase = "eingefroren" | "screening" | "verhandlung" | "perspektive";

export type KapitelStatus = "zu" | "bereit" | "offen" | "abgeschlossen";

export interface KapitelZustand {
  status: KapitelStatus;
  /** Tag der Eröffnung bzw. des vorläufigen Abschlusses */
  geoeffnet?: number;
  geschlossen?: number;
  /** Bis zu diesem Tag blockiert ein nicht beantwortetes Veto die Eröffnung */
  gesperrtBis?: number;
  /** Jahr, in dem der Fortschrittsbericht das Kapitel zuletzt als Alibi-Reform benannt hat */
  alibiJahr?: number;
}

export type EuNote = "früh" | "mittel" | "fortgeschritten" | "erfüllt";

export interface EuBericht {
  tag: number;
  datum: string;
  jahr: number;
  /** Kapitel-Kennung → Note */
  noten: Record<string, EuNote>;
  /** Als Alibi-Reform erkannte Kapitel (Kennungen) */
  alibi: string[];
  /** Durch die Zypernfrage oder ein Veto blockierte Kapitel (Kennungen) */
  blockiert: string[];
  /** Zeilen im Mentorin-Stil: Stand und nächste Schritte */
  zeilen: string[];
}

export interface EuZustand {
  phase: EuPhase;
  /** Tag der Ankündigung des Reformpakets */
  reformSeit?: number;
  /** Tag, an dem das Screening endet */
  screeningBis?: number;
  kapitel: Record<string, KapitelZustand>;
  /** Das Zollunion-Update als Zwischenziel */
  zollunion: "unveraendert" | "modernisiert";
  /** Nach einer Ablehnung kommt das Angebot erst wieder nach diesem Tag auf den Tisch */
  zollunionSperreBis?: number;
  /** Bis zu diesem Tag ruht das Veto eines Mitgliedstaats nach einer Entscheidung (Jahr der Ruhe) */
  vetoRuhe?: Record<string, number>;
  /** Tag, an dem die Visaliberalisierung gewährt wurde */
  visaSeit?: number;
  /** Archiv der jährlichen Fortschrittsberichte, neueste zuletzt */
  berichte: EuBericht[];
}

// ---------------------------------------------------------------------------
// Kriterien und Kapitel

/** Ein messbares Kriterium am Politiknetz — oder ein Vertrags-Nachweis (Rückübernahme). */
export interface Kriterium {
  id: string;
  text: string;
  /** Politiknetz-Knoten; fehlt, wenn ein Vertrag zählt */
  knoten?: string;
  art?: "min" | "max";
  wert?: number;
  /** Statt eines Knotens: ein laufender Vertrag mit dieser Klausel bei diesem Land */
  vertrag?: { land: string; klausel: string };
}

export interface KapitelDef {
  id: string;
  nummer: number;
  name: string;
  /** Ein Satz zum Inhalt */
  text: string;
  oeffnung: Kriterium[];
  schluss: Kriterium[];
  /** Verhandlungsdauer in Jahren, bis ein erfülltes Kapitel vorläufig schließt */
  jahre: number;
  /** Blockiert durch die Zypernfrage (dokumentierte Verknüpfung, Dossier 17) */
  zypernBlockiert?: boolean;
  /** Stoßwirkungen beim vorläufigen Abschluss: Knoten und Delta */
  nutzen: { knoten: string; d: number; text: string }[];
}

const K = (id: string, text: string, knoten: string, art: "min" | "max", wert: number): Kriterium => ({ id, text, knoten, art, wert });

/**
 * Zehn von 35 Kapiteln als spielbare Menge. Die Wahl folgt der politischen Brisanz, nicht dem
 * Alphabet: 23 und 24 sind die Rechtsstaats-Kernkapitel (und an Zypern gekoppelt), 5, 17 und 33
 * tragen die wirtschaftliche Substanz, 11, 12, 15 und 27 die Sektoren mit dem größten innen-
 * politischen Preis, 31 die außenpolitische Ausrichtung. Die übrigen 25 Kapitel laufen als
 * Binnenmarkt-Technik im Hintergrund mit; sie hätten keine eigene Entscheidung geboten.
 */
export const KAPITEL: KapitelDef[] = [
  {
    id: "k23", nummer: 23, name: t("sim2.sim.eu.098ad1f"), zypernBlockiert: true, jahre: 3,
    text: t("sim2.sim.eu.4d0f899"),
    oeffnung: [
      K("justiz", t("sim2.sim.eu.6d9cb25"), "justiz_unabhaengigkeit", "min", 50),
      K("urteile", t("sim2.sim.eu.b652d7e"), "urteilsbefolgung", "min", 48),
      K("presse", "Pressefreiheit mindestens 40", "pressefreiheit", "min", 40),
    ],
    schluss: [
      K("justiz", t("sim2.sim.eu.f360b7f"), "justiz_unabhaengigkeit", "min", 62),
      K("urteile", t("sim2.sim.eu.5cf1068"), "urteilsbefolgung", "min", 60),
      K("strassburg", t("sim2.sim.eu.c9d21b0"), "strassburg_druck", "max", 35),
    ],
    nutzen: [
      { knoten: "auslandskapital", d: 2, text: t("sim2.sim.eu.7572a00") },
      { knoten: "ansehen", d: 2, text: t("sim2.sim.eu.5db9cfd") },
    ],
  },
  {
    id: "k24", nummer: 24, name: t("sim2.sim.eu.aface41"), zypernBlockiert: true, jahre: 3,
    text: t("sim2.sim.eu.22cdf3f"),
    oeffnung: [
      K("korruption", t("sim2.sim.eu.0a714eb"), "korruption", "max", 50),
      K("grenze", "Grenzschutz mindestens 55", "m_grenzschutz", "min", 55),
    ],
    schluss: [
      K("korruption", t("sim2.sim.eu.cc03530"), "korruption", "max", 40),
      K("grenze", "Grenzschutz mindestens 65", "m_grenzschutz", "min", 65),
      K("ausnahme", t("sim2.sim.eu.a95a02c"), "ausnahmerecht", "max", 15),
    ],
    nutzen: [
      { knoten: "rechtssicherheit", d: 1.5, text: t("sim2.sim.eu.56281a5") },
      { knoten: "beziehungen_eu", d: 1.5, text: t("sim2.sim.eu.0bb230d") },
    ],
  },
  {
    id: "k5", nummer: 5, name: t("sim2.sim.eu.397ac60"), jahre: 2,
    text: t("sim2.sim.eu.e93dee2"),
    oeffnung: [
      K("korruption", t("sim2.sim.eu.783f1d9"), "korruption", "max", 48),
      K("anti", t("sim2.sim.eu.dece126"), "m_antikorruption", "min", 40),
    ],
    schluss: [
      K("korruption", t("sim2.sim.eu.e772d8d"), "korruption", "max", 38),
      K("anti", t("sim2.sim.eu.a399966"), "m_antikorruption", "min", 55),
    ],
    nutzen: [
      { knoten: "auslandskapital", d: 1, text: t("sim2.sim.eu.f483d37") },
      { knoten: "mittelstand", d: 1, text: "Auch kleine Betriebe kommen zum Zug" },
    ],
  },
  {
    id: "k15", nummer: 15, name: "Energie", jahre: 2,
    text: t("sim2.sim.eu.1bee802"),
    oeffnung: [K("versorgung", "Energieversorgung mindestens 50", "energieversorgung", "min", 50)],
    schluss: [
      K("versorgung", "Energieversorgung mindestens 58", "energieversorgung", "min", 58),
      K("sakarya", t("sim2.sim.eu.6a70322"), "sakarya_gas", "min", 40),
    ],
    nutzen: [
      { knoten: "export", d: 1, text: t("sim2.sim.eu.7683911") },
      { knoten: "beziehungen_eu", d: 1, text: t("sim2.sim.eu.442a477") },
    ],
  },
  {
    id: "k17", nummer: 17, name: t("sim2.sim.eu.0c34658"), jahre: 2,
    text: t("sim2.sim.eu.3109073"),
    oeffnung: [
      K("maerkte", t("sim2.sim.eu.ccea2f7"), "vertrauen_maerkte", "min", 48),
      K("recht", "Rechtssicherheit mindestens 45", "rechtssicherheit", "min", 45),
    ],
    schluss: [
      K("maerkte", t("sim2.sim.eu.6e7a0d9"), "vertrauen_maerkte", "min", 58),
      K("recht", "Rechtssicherheit mindestens 55", "rechtssicherheit", "min", 55),
    ],
    nutzen: [
      { knoten: "investitionen", d: 1.5, text: "Berechenbare Regeln machen Mut zum Bauen" },
      { knoten: "auslandskapital", d: 1.5, text: t("sim2.sim.eu.cc4354f") },
    ],
  },
  {
    id: "k12", nummer: 12, name: t("sim2.sim.eu.3e364eb"), jahre: 2,
    text: t("sim2.sim.eu.8b3217a"),
    oeffnung: [K("einkommen", t("sim2.sim.eu.fccaa51"), "landwirtschaft_einkommen", "min", 40)],
    schluss: [
      K("forschung", t("sim2.sim.eu.15d44fd"), "m_agrarforschung", "min", 45),
      K("ernte", t("sim2.sim.eu.9b22068"), "ernte", "min", 55),
    ],
    nutzen: [{ knoten: "export", d: 1, text: t("sim2.sim.eu.053c54c") }],
  },
  {
    id: "k27", nummer: 27, name: t("sim2.sim.eu.e742817"), jahre: 2,
    text: t("sim2.sim.eu.ff9665c"),
    oeffnung: [K("auflagen", "Umweltauflagen mindestens 40", "m_umweltauflagen", "min", 40)],
    schluss: [
      K("auflagen", "Umweltauflagen mindestens 55", "m_umweltauflagen", "min", 55),
      K("luft", t("sim2.sim.eu.20bdb8f"), "luftqualitaet", "min", 45),
    ],
    nutzen: [{ knoten: "ansehen", d: 1, text: t("sim2.sim.eu.175ed2e") }],
  },
  {
    id: "k33", nummer: 33, name: t("sim2.sim.eu.b7f92e1"), jahre: 2,
    text: t("sim2.sim.eu.1657464"),
    oeffnung: [
      K("digital", "Digitale Verwaltung mindestens 40", "m_verwaltungsdigital", "min", 40),
      K("steuern", "Steuereinnahmen mindestens 50", "steuereinnahmen", "min", 50),
    ],
    schluss: [
      K("digital", "Digitale Verwaltung mindestens 55", "m_verwaltungsdigital", "min", 55),
      K("schatten", t("sim2.sim.eu.96c7e6a"), "schattenwirtschaft", "max", 40),
    ],
    nutzen: [{ knoten: "vertrauen_maerkte", d: 1.5, text: "Solide Finanzen beruhigen Anleger" }],
  },
  {
    id: "k11", nummer: 11, name: t("sim2.sim.eu.033d3dc"), jahre: 3,
    text: t("sim2.sim.eu.31b57cc"),
    oeffnung: [K("forschung", t("sim2.sim.eu.182e2cc"), "m_agrarforschung", "min", 40)],
    schluss: [
      K("einkommen", t("sim2.sim.eu.d28853d"), "landwirtschaft_einkommen", "min", 55),
      K("subventionen", t("sim2.sim.eu.555cf32"), "m_agrarsubventionen", "max", 50),
    ],
    nutzen: [{ knoten: "landwirtschaft_einkommen", d: 1, text: t("sim2.sim.eu.04a3344") }],
  },
  {
    id: "k31", nummer: 31, name: t("sim2.sim.eu.aae2259"), jahre: 2,
    text: t("sim2.sim.eu.78ef0e3"),
    oeffnung: [K("ansehen", "Internationales Ansehen mindestens 50", "ansehen", "min", 50)],
    schluss: [
      K("ansehen", "Internationales Ansehen mindestens 55", "ansehen", "min", 55),
      K("russland", t("sim2.sim.eu.eee9e31"), "beziehungen_russland", "max", 50),
    ],
    nutzen: [
      { knoten: "beziehungen_eu", d: 2, text: t("sim2.sim.eu.9875a33") },
      { knoten: "abschreckung", d: 1, text: "Eingebunden statt allein" },
    ],
  },
];

export const KAPITEL_NACH_ID = new Map(KAPITEL.map((k) => [k.id, k]));

/** Kapitel, die an der Zypernfrage hängen (Dossier 17: Nikosia knüpft jeden EU-Schritt an Bewegung). */
export const ZYPERN_KAPITEL = KAPITEL.filter((k) => k.zypernBlockiert).map((k) => k.id);

// ---------------------------------------------------------------------------
// Kriterien messen

export interface KriteriumStand {
  kriterium: Kriterium;
  /** Aktueller Wert (bei Vertrags-Kriterien 0 oder 100) */
  jetzt: number;
  erfuellt: boolean;
  /** Punkte über der Schwelle in Erfüllungsrichtung; negativ = unerfüllt */
  abstand: number;
}

export function kriteriumStand(w: World, k: Kriterium): KriteriumStand {
  if (k.vertrag) {
    const ok = laufende(w, k.vertrag.land).some((v) => [...v.gibt, ...v.will].includes(k.vertrag!.klausel));
    return { kriterium: k, jetzt: ok ? 100 : 0, erfuellt: ok, abstand: ok ? 100 : -100 };
  }
  const jetzt = nationalAverage(NET, w.net, k.knoten!);
  const abstand = k.art === "max" ? k.wert! - jetzt : jetzt - k.wert!;
  // Gewichtete Summen tragen Float-Staub: ein Hauch Toleranz, damit „genau auf der Marke“ als erfüllt zählt
  return { kriterium: k, jetzt, erfuellt: abstand >= -EPS, abstand };
}

export function kriterienStand(w: World, ks: Kriterium[]): KriteriumStand[] {
  return ks.map((k) => kriteriumStand(w, k));
}

/** Toleranz gegen Float-Staub der gewichteten Durchschnitte (weit unter jeder spürbaren Spielgröße). */
const EPS = 1e-6;

/** Alle Kriterien erfüllt — und zwar mit Substanz: Liegt das knappste Kriterium innerhalb der
 *  Alibi-Marge, erkennt Brüssel Fensterdressing; die Erfüllung zählt erst oberhalb der Marge. */
export function erfuelltMitSubstanz(stand: KriteriumStand[]): { erfuellt: boolean; alibi: boolean } {
  const alle = stand.every((s) => s.erfuellt);
  if (!alle) return { erfuellt: false, alibi: false };
  const knappstes = Math.min(...stand.map((s) => s.abstand));
  return { erfuellt: knappstes >= EU_REGELN.alibiMarge - EPS, alibi: knappstes < EU_REGELN.alibiMarge - EPS };
}

// ---------------------------------------------------------------------------
// Zypern-Kopplung und nationale Vetos

/**
 * Bewegung im Zypern-Dossier: Der Konflikt ist gedämpft, ein Vertrag mit der Hafen-Öffnung läuft
 * (das Ankara-Protokoll) oder das Vertrauen reicht für Gespräche. Erst dann rühren sich die
 * Kapitel 23 und 24 — dokumentierte Verknüpfung (Dossier 17, Rote Linie Nr. 5).
 */
export function zypernBewegung(w: World): { bewegt: boolean; text: string } {
  const z = weltZustand(w).CYP;
  if (!z) return { bewegt: true, text: "" };
  if (laufende(w, "CYP").some((v) => [...v.gibt, ...v.will].includes("hafen_oeffnung"))) {
    return { bewegt: true, text: t("sim2.sim.eu.b5dbaa5") };
  }
  if (z.konflikt <= 50) return { bewegt: true, text: t("sim2.sim.eu.2b0c2fd", { p0: Math.round(z.konflikt) }) };
  if (vertrauenZu(w, "CYP") >= 45) return { bewegt: true, text: t("sim2.sim.eu.d63008a") };
  return {
    bewegt: false,
    text: t("sim2.sim.eu.7fb147d", { p0: Math.round(z.konflikt) }),
  };
}

export interface VetoLand {
  land: string;
  /** Ab diesem Konfliktwert legt das Mitglied sein Veto ein */
  konfliktAb: number;
  text: string;
}

/** Benannte Mitgliedstaaten mit Blockade-Macht: Griechenland und Zypern (Dossier 2, Rote Linie 3). */
export const VETO_LAENDER: VetoLand[] = [
  { land: "GRC", konfliktAb: 70, text: t("sim2.sim.eu.aeeb728") },
  { land: "CYP", konfliktAb: 60, text: t("sim2.sim.eu.975209e") },
];

/**
 * Haken für die weiteren Mitgliedstaaten (sim/welt-bloecke.ts): Verweigert ein Staat im Rat die Einstimmigkeit, bleibt das Kapitel zu.
 * Registriert sich beim Laden des Weltmodells; ohne Registrierung gilt nur die Veto-Logik von Griechenland und Zypern.
 */
export type RatPruefung = (w: World, kapitelId: string) => { blockiert: boolean; text: string } | null;
let ratPruefung: RatPruefung | undefined;
export function setzeRatPruefung(f: RatPruefung): void {
  ratPruefung = f;
}

/** Ein aktives Veto gegen die Eröffnung, oder null. Nach einer beantworteten Veto-Krise ruht das Mitglied ein Jahr. */
export function vetoGegen(w: World): VetoLand | null {
  const ruhe = w.spiel?.eu?.vetoRuhe ?? {};
  for (const v of VETO_LAENDER) {
    if (w.day < (ruhe[v.land] ?? 0)) continue;
    const z = weltZustand(w)[v.land];
    if (z && z.konflikt >= v.konfliktAb) return v;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Zustand anlegen und lesen

export function euZustand(w: World): EuZustand {
  const spiel = w.spiel!;
  if (!spiel.eu) {
    const kapitel: Record<string, KapitelZustand> = {};
    for (const k of KAPITEL) kapitel[k.id] = { status: "zu" };
    spiel.eu = { phase: "eingefroren", kapitel, zollunion: "unveraendert", berichte: [] };
  }
  return spiel.eu;
}

/** REC-Logik: Jedes verhandelte Kapitel kostet laufend Kapital — Reformen binden Rückhalt. */
export function euKapitalAbzug(w: World): number {
  const z = w.spiel?.eu;
  if (!z) return 0;
  const offene = Object.values(z.kapitel).filter((k) => k.status === "offen").length;
  return offene * EU_REGELN.kapitalJeKapitel;
}

export const PHASEN_TEXT: Record<EuPhase, string> = {
  eingefroren: t("sim2.sim.eu.d96bd17"),
  screening: t("sim2.sim.eu.c6ac757"),
  verhandlung: t("sim2.sim.eu.1158a66"),
  perspektive: t("sim2.sim.eu.4a2aa16"),
};

// ---------------------------------------------------------------------------
// Spielerhandlung: Reformpaket ankündigen

export interface AnnaeherungSicht {
  moeglich: boolean;
  grund?: string;
  /** Wert der Maßnahme „Annäherung an die EU“ */
  annaeherung: number;
}

export function annaeherungSicht(w: World): AnnaeherungSicht {
  const z = euZustand(w);
  const annaeherung = nationalAverage(NET, w.net, "m_eu_annaeherung");
  const base: AnnaeherungSicht = { moeglich: true, annaeherung };
  if (z.phase !== "eingefroren") return { ...base, moeglich: false, grund: t("sim2.sim.eu.a87c88d") };
  if (annaeherung < 55)
    return {
      ...base,
      moeglich: false,
      grund: t("sim2.sim.eu.2157f8c", { p0: Math.round(annaeherung) }),
    };
  if (!kannZahlen(w.spiel!.kapital, EU_REGELN.pkAnkuendigung)) return { ...base, moeglich: false, grund: t("sim2.sim.eu.2d06e23") };
  return base;
}

/** Der Einstieg: Der Präsident kündigt das Reformpaket an; Brüssel öffnet das Screening. */
export function kuendigeReformAn(w: World): { ok: boolean; text: string; why?: string } {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: t("sim2.sim.eu.6035e32") };
  const sicht = annaeherungSicht(w);
  if (!sicht.moeglich) return { ok: false, text: sicht.grund ?? t("sim2.sim.eu.dbc20ad") };
  const z = euZustand(w);
  spiel.kapital -= EU_REGELN.pkAnkuendigung;
  z.phase = "screening";
  z.reformSeit = w.day;
  z.screeningBis = w.day + EU_REGELN.screeningTage;
  landAendern(w, "EU", { vertrauen: 6 }, t("sim2.sim.eu.9e36794"));
  wirke(w, "staedtische_saekulare", 2);
  wirke(w, "nationalisten", -1);
  wirke(w, "beziehungen_eu", 2);
  zeitungEreignis(w, {
    art: "krise",
    titel: t("sim2.sim.eu.5209d12"),
    fakt: t("sim2.sim.eu.b75154a", { p0: formatDateDe(addTag(w, EU_REGELN.screeningTage)) }),
    wertung: 0.6,
    schluessel: ["Reformpaket", "Screening"],
  });
  const text = t("sim2.sim.eu.45f5c80", { p0: formatDateDe(addTag(w, EU_REGELN.screeningTage)) });
  const why = t("sim2.sim.eu.86a31cc", { p0: EU_REGELN.pkAnkuendigung, p1: Math.round(sicht.annaeherung) });
  addLog(w, "entscheidung", text, why);
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: t("sim2.sim.eu.da35033"), ausgang: t("sim2.sim.eu.42a0467") });
  return { ok: true, text, why };
}

function addTag(w: World, tage: number): string {
  const d = new Date(Date.parse(w.date + "T00:00:00Z") + tage * 86_400_000);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Veto und Zollunion: die Antworten auf die Auto-Stopps der Klasse A
// (die Vorlagen stehen in sim/ereignisse-eu.ts und rufen genau diese Funktionen)

/** Veto-Antwort „Zugeständnis": Der Konflikt mit dem Mitgliedstaat wird entschärft, das Kapitel öffnet. */
export function vetoBeantworten(w: World, landId: string, kapitelId: string): string {
  const z = euZustand(w);
  const k = z.kapitel[kapitelId];
  const def = KAPITEL_NACH_ID.get(kapitelId);
  if (!k || !def) return t("sim2.sim.eu.3de5b51");
  (z.vetoRuhe ??= {})[landId] = w.day + EU_REGELN.vetoSperreTage;
  landAendern(w, landId, { konflikt: -10, vertrauen: 5 }, t("sim2.sim.eu.da61f7d"));
  wirke(w, "nationalisten", landId === "CYP" ? -4 : -2);
  if (landId === "CYP") wirke(w, "staedtische_saekulare", 2);
  landAendern(w, "EU", { vertrauen: 3 }, t("sim2.sim.eu.047a8f4"));
  oeffneKapitel(w, def);
  return t("sim2.sim.eu.9f4abd7", { p0: landId === "CYP" ? "Nikosia" : "Athen", p1: def.nummer, p2: def.name });
}

/** Veto-Antwort „Abwarten": Das Kapitel bleibt ein Jahr blockiert. */
export function vetoAbwarten(w: World, landId: string, kapitelId: string): string {
  const z = euZustand(w);
  const k = z.kapitel[kapitelId];
  if (k) k.gesperrtBis = w.day + EU_REGELN.vetoSperreTage;
  (z.vetoRuhe ??= {})[landId] = w.day + EU_REGELN.vetoSperreTage;
  landAendern(w, "EU", { vertrauen: -2 }, t("sim2.sim.eu.043237b"));
  const def = KAPITEL_NACH_ID.get(kapitelId);
  return t("sim2.sim.eu.1a3f18d", { p0: def?.nummer ?? "?", p1: landId === "CYP" ? "Nikosia" : "Athen" });
}

/** Zollunion-Antwort „Annehmen": Das Update wird vereinbart — mit echten Effekten in beide Richtungen. */
export function zollunionAnnehmen(w: World): string {
  const z = euZustand(w);
  z.zollunion = "modernisiert";
  // Handel +: der Binnenmarkt öffnet sich für Dienstleistungen und Agrar
  wirke(w, "export", 4);
  wirke(w, "auslandskapital", 3);
  wirke(w, "industrie", 2);
  wirke(w, "mittelstand", 2);
  wirke(w, "unternehmer", 3);
  // Landwirtschaft −: ohne die alten Schutzzölle stehen die Höfe im Wettbewerb
  wirke(w, "landwirtschaft_einkommen", -3);
  wirke(w, "landwirte", -3);
  landAendern(w, "EU", { handel: 12, vertrauen: 6 }, t("sim2.sim.eu.c3f9768"));
  w.economy.riskPremium = Math.max(0, w.economy.riskPremium - 40);
  zeitungEreignis(w, {
    art: "krise",
    titel: "Zollunion modernisiert",
    fakt: t("sim2.sim.eu.3beaade"),
    wertung: 0.8,
    schluessel: ["Zollunion"],
  });
  const spiel = w.spiel!;
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: "Zollunion modernisiert", ausgang: t("sim2.sim.eu.2406223") });
  return t("sim2.sim.eu.b75efda");
}

/** Zollunion-Antwort „Ablehnen": Das Mandat vertagt sich um zwei Jahre. */
export function zollunionAblehnen(w: World): string {
  const z = euZustand(w);
  z.zollunionSperreBis = w.day + EU_REGELN.zollunionSperreTage;
  landAendern(w, "EU", { vertrauen: -3 }, t("sim2.sim.eu.983b4ab"));
  return t("sim2.sim.eu.c978f0a");
}

// ---------------------------------------------------------------------------
// Kapitel öffnen und schließen

function offeneKapitel(z: EuZustand): string[] {
  return KAPITEL.filter((k) => z.kapitel[k.id]!.status === "offen").map((k) => k.id);
}

function oeffneKapitel(w: World, def: KapitelDef): void {
  const z = euZustand(w);
  const k = z.kapitel[def.id]!;
  k.status = "offen";
  k.geoeffnet = w.day;
  landAendern(w, "EU", { vertrauen: 3, handel: 2 }, t("sim2.sim.eu.af7f279", { p0: def.nummer, p1: def.name }));
  wirke(w, "beziehungen_eu", 1);
  addLog(
    w,
    "ereignis",
    t("sim2.sim.eu.4a16ba4", { p0: def.nummer, p1: def.name }),
    t("sim2.sim.eu.beb7ddc", { p0: def.text, p1: def.jahre, p2: def.jahre === 1 ? "Jahr" : "Jahren" }),
  );
  w.spiel!.chronik.push({ tag: w.day, datum: w.date, titel: t("sim2.sim.eu.77515fe", { p0: def.nummer }), ausgang: t("sim2.sim.eu.bb7d433", { p0: def.name }) });
}

function schliesseKapitel(w: World, def: KapitelDef): void {
  const z = euZustand(w);
  const k = z.kapitel[def.id]!;
  k.status = "abgeschlossen";
  k.geschlossen = w.day;
  for (const n of def.nutzen) wirke(w, n.knoten, n.d);
  landAendern(w, "EU", { vertrauen: 5, handel: 3 }, t("sim2.sim.eu.c6d0403", { p0: def.nummer, p1: def.name }));
  w.economy.riskPremium = Math.max(0, w.economy.riskPremium - 15);
  // Der Innenpreis der Reformen: Nationale Kreise lesen jeden Abschluss als Fremdbestimmung
  wirke(w, "nationalisten", -1);
  wirke(w, "staedtische_saekulare", 1);
  addLog(
    w,
    "ereignis",
    t("sim2.sim.eu.fd4cebe", { p0: def.nummer, p1: def.name }),
    t("sim2.sim.eu.7e20316", { p0: def.nutzen.map((n) => n.text).join("; ") }),
  );
  w.spiel!.chronik.push({ tag: w.day, datum: w.date, titel: `Kapitel ${def.nummer} geschlossen`, ausgang: t("sim2.sim.eu.d4a9da7", { p0: def.name }) });
  // Endgame: alle spielbaren Kapitel geschlossen → glaubwürdige Perspektive, ehrlich kein Beitritt
  if (KAPITEL.every((x) => z.kapitel[x.id]!.status === "abgeschlossen")) {
    z.phase = "perspektive";
    wirke(w, "ansehen", 5);
    wirke(w, "auslandskapital", 5);
    landAendern(w, "EU", { vertrauen: 10, handel: 8 }, t("sim2.sim.eu.70351de"));
    w.economy.riskPremium = Math.max(0, w.economy.riskPremium - 50);
    zeitungEreignis(w, {
      art: "wahlsieg",
      titel: "Beitritts-Perspektive erreicht",
      fakt: t("sim2.sim.eu.2cc2591"),
      wertung: 1,
      schluessel: ["Beitritt"],
    });
    w.spiel!.hinweise.push({
      id: `eu-perspektive-${w.day}`,
      titel: "Beitritts-Perspektive",
      szene: "istanbul",
      text: [
        t("sim2.sim.eu.1a58795"),
        t("sim2.sim.eu.0d47075"),
      ],
    });
    addLog(w, "ereignis", "Beitritts-Perspektive erreicht.", t("sim2.sim.eu.e3ac48e"));
  }
}

// ---------------------------------------------------------------------------
// Visaliberalisierung: separater Mini-Track mit sechs Kriterien

export const VISA_KRITERIEN: Kriterium[] = [
  K("pass", t("sim2.sim.eu.ce4bbcb"), "m_verwaltungsdigital", "min", 50),
  { id: "ruecknahme", text: t("sim2.sim.eu.32dd58d"), vertrag: { land: "EU", klausel: "migration_zusage" } },
  K("grenze", "Wirksamer Grenzschutz (≥ 60)", "m_grenzschutz", "min", 60),
  K("justiz", t("sim2.sim.eu.7f7e3f9"), "justiz_unabhaengigkeit", "min", 45),
  K("daten", t("sim2.sim.eu.f793c81"), "rechtssicherheit", "min", 48),
  K("migration", t("sim2.sim.eu.27e77cb"), "gefluechtete", "max", 50),
];

export function visaStand(w: World): { kriterien: KriteriumStand[]; erfuellt: number; gewaehrt: boolean } {
  const z = euZustand(w);
  const stand = kriterienStand(w, VISA_KRITERIEN);
  return { kriterien: stand, erfuellt: stand.filter((s) => s.erfuellt).length, gewaehrt: z.visaSeit !== undefined };
}

function visaPruefen(w: World): void {
  const z = euZustand(w);
  if (z.visaSeit !== undefined) return;
  const s = visaStand(w);
  if (s.erfuellt < VISA_KRITERIEN.length) return;
  z.visaSeit = w.day;
  // Der Nutzen: Erleichterung für Reisende und Wirtschaft, spürbar bei denen, die Europa als Zukunft lesen
  wirke(w, "staedtische_saekulare", 3);
  wirke(w, "junge", 3);
  wirke(w, "unternehmer", 2);
  wirke(w, "tourismus", 2);
  wirke(w, "export", 1);
  landAendern(w, "EU", { vertrauen: 5, handel: 3 }, t("sim2.sim.eu.577c1fb"));
  zeitungEreignis(w, {
    art: "krise",
    titel: t("sim2.sim.eu.75037fc"),
    fakt: t("sim2.sim.eu.a3eccb5"),
    wertung: 0.9,
    schluessel: ["Visafreiheit"],
  });
  w.spiel!.hinweise.push({
    id: `eu-visa-${w.day}`,
    titel: "Visafreiheit",
    szene: "istanbul",
    text: [
      t("sim2.sim.eu.9f706ac"),
      t("sim2.sim.eu.4ebe581"),
    ],
  });
  addLog(w, "ereignis", t("sim2.sim.eu.63d000b"), t("sim2.sim.eu.61dc631"));
}

// ---------------------------------------------------------------------------
// Der jährliche Fortschrittsbericht (November, Auto-Stopp B)

export function noteFuer(w: World, def: KapitelDef, z: EuZustand): EuNote {
  const k = z.kapitel[def.id]!;
  if (k.status === "abgeschlossen") return "erfüllt";
  const stand = kriterienStand(w, def.schluss);
  const grad = stand.filter((s) => s.erfuellt).length / Math.max(1, stand.length);
  if (k.status === "offen" && grad >= 0.66) return "fortgeschritten";
  if (k.status === "offen" || k.status === "bereit" || grad >= 0.33) return "mittel";
  return "früh";
}

/** Der nächste Schritt für ein Kapitel, in einem Satz (Mentorin-Stil). */
export function naechsterSchritt(w: World, def: KapitelDef, z: EuZustand): string {
  const k = z.kapitel[def.id]!;
  if (k.status === "abgeschlossen") return t("sim2.sim.eu.5977bf0");
  if (def.zypernBlockiert && !zypernBewegung(w).bewegt) return t("sim2.sim.eu.c709ee0");
  if (k.gesperrtBis && w.day < k.gesperrtBis) return t("sim2.sim.eu.384224d", { p0: k.gesperrtBis - w.day });
  const kriterien = k.status === "offen" ? def.schluss : def.oeffnung;
  const stand = kriterienStand(w, kriterien);
  const substanz = erfuelltMitSubstanz(stand);
  if (substanz.alibi) return t("sim2.sim.eu.1ccd068");
  const fehlend = stand.find((s) => !s.erfuellt);
  if (fehlend) return t("sim2.sim.eu.4a6191b", { p0: fehlend.kriterium.text, p1: Math.round(fehlend.jetzt) });
  if (k.status === "offen") {
    const rest = Math.max(0, (k.geoeffnet ?? w.day) + def.jahre * 365 - w.day);
    return rest > 0 ? t("sim2.sim.eu.ae6516d", { p0: Math.ceil(rest / 365), p1: rest > 365 ? "Jahre" : "Jahr" }) : t("sim2.sim.eu.9dfd7b3");
  }
  return t("sim2.sim.eu.ce6438a");
}

function fortschrittsbericht(w: World): void {
  const spiel = w.spiel!;
  const z = euZustand(w);
  const jahr = Number(w.date.slice(0, 4));
  const noten: Record<string, EuNote> = {};
  const alibi: string[] = [];
  const blockiert: string[] = [];
  const zeilen: string[] = [];
  const zypern = zypernBewegung(w);

  for (const def of KAPITEL) {
    const k = z.kapitel[def.id]!;
    noten[def.id] = noteFuer(w, def, z);
    if (def.zypernBlockiert && !zypern.bewegt && k.status !== "abgeschlossen") blockiert.push(def.id);
    // Alibi-Erkennung: erfüllt, aber ohne Puffer — die Kommission benennt es im Bericht
    const kriterien = k.status === "offen" ? def.schluss : def.oeffnung;
    const substanz = erfuelltMitSubstanz(kriterienStand(w, kriterien));
    if (substanz.alibi && k.status !== "abgeschlossen") {
      alibi.push(def.id);
      if (k.alibiJahr !== jahr) {
        k.alibiJahr = jahr;
        landAendern(w, "EU", { vertrauen: -2 }, t("sim2.sim.eu.f734417", { p0: def.nummer }));
        wirke(w, "ansehen", -0.5);
      }
    }
  }

  if (z.phase === "eingefroren") {
    zeilen.push(t("sim2.sim.eu.72ed0a0"));
  } else {
    zeilen.push(`Stand: ${PHASEN_TEXT[z.phase]}`);
    const offene = offeneKapitel(z).length;
    const fertige = KAPITEL.filter((x) => z.kapitel[x.id]!.status === "abgeschlossen").length;
    zeilen.push(t("sim2.sim.eu.ed11a4b", { p0: fertige, p1: KAPITEL.length, p2: offene, p3: EU_REGELN.parallelMax }));
  }
  for (const def of KAPITEL) {
    const marke = alibi.includes(def.id) ? " (Alibi-Verdacht)" : blockiert.includes(def.id) ? " (blockiert: Zypernfrage)" : "";
    zeilen.push(`Kapitel ${def.nummer} „${def.name}“: ${noten[def.id]}${marke} — ${naechsterSchritt(w, def, z)}`);
  }
  if (alibi.length) zeilen.push(t("sim2.sim.eu.8250048"));
  if (z.zollunion === "unveraendert" && z.phase === "verhandlung") zeilen.push(t("sim2.sim.eu.396ea89", { p0: EU_REGELN.zollunionKapitel }));
  const visa = visaStand(w);
  if (!visa.gewaehrt) zeilen.push(t("sim2.sim.eu.640803d", { p0: visa.erfuellt, p1: VISA_KRITERIEN.length }));

  const bericht: EuBericht = { tag: w.day, datum: w.date, jahr, noten, alibi, blockiert, zeilen };
  z.berichte.push(bericht);
  if (z.berichte.length > 8) z.berichte.shift();
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: `EU-Fortschrittsbericht ${jahr}`, ausgang: zeilen[1] ?? zeilen[0]! });
  addLog(w, "ereignis", `EU-Fortschrittsbericht ${jahr}`, zeilen.slice(0, 4).join(" "));
  spiel.hinweise.push({
    id: `eu-bericht-${jahr}`,
    titel: `EU-Fortschrittsbericht ${jahr}`,
    szene: "istanbul",
    text: zeilen.slice(0, 8),
  });
}

// ---------------------------------------------------------------------------
// Der Monatsschritt des Vorgangs

/** Einmal im Monat aus der Spielschleife: Screening, Kapitel, Zollunion, Visa, Bericht. */
export function euMonat(w: World, rng: Rng): void {
  const spiel = w.spiel;
  if (!spiel || spiel.ende) return;
  const z = euZustand(w);

  // 1. Screening endet: die Verhandlungsphase beginnt
  if (z.phase === "screening" && z.screeningBis !== undefined && w.day >= z.screeningBis) {
    z.phase = "verhandlung";
    landAendern(w, "EU", { vertrauen: 4 }, t("sim2.sim.eu.095ab8d"));
    zeitungEreignis(w, {
      art: "krise",
      titel: "Screening abgeschlossen",
      fakt: t("sim2.sim.eu.62bf73e"),
      wertung: 0.7,
      schluessel: ["Screening", "Beitrittskapitel"],
    });
    spiel.hinweise.push({
      id: `eu-screening-${w.day}`,
      titel: "Screening abgeschlossen",
      szene: "istanbul",
      text: [
        t("sim2.sim.eu.52a5329"),
        t("sim2.sim.eu.3441958"),
      ],
    });
    addLog(w, "ereignis", t("sim2.sim.eu.691eb06"), t("sim2.sim.eu.532a0f2"));
  }

  // 2. Kapitel-Verhandlungen
  if (z.phase === "verhandlung") {
    const zypern = zypernBewegung(w);
    // a) Eröffnungen: bereit, Substanz vorhanden, kein Blocker, Platz frei
    for (const def of KAPITEL) {
      const k = z.kapitel[def.id]!;
      if (k.status !== "zu" && k.status !== "bereit") continue;
      const substanz = erfuelltMitSubstanz(kriterienStand(w, def.oeffnung));
      if (!substanz.erfuellt && !substanz.alibi) {
        k.status = "zu";
        continue;
      }
      k.status = "bereit";
      if (substanz.alibi) continue; // Fensterdressing: erkannt, keine Eröffnung
      if (def.zypernBlockiert && !zypern.bewegt) continue; // Zypern-Kopplung
      if (k.gesperrtBis && w.day < k.gesperrtBis) continue; // Veto-Sperre läuft
      if (offeneKapitel(z).length >= EU_REGELN.parallelMax) continue;
      // Nationale Vetos benannter Mitglieder: Auto-Stopp A mit Entscheidung
      const veto = vetoGegen(w);
      if (veto) {
        if (!spiel.ereignisse.some((e) => e.vorlage === "eu_veto")) {
          oeffne(w, "eu_veto", rng, { daten: { land: veto.land, kapitel: def.id } });
        }
        continue;
      }
      // Einstimmigkeit im Rat: Weitere Mitgliedstaaten können die Eröffnung verweigern (Weltmodell)
      if (ratPruefung?.(w, def.id)?.blockiert) continue;
      oeffneKapitel(w, def);
      if (offeneKapitel(z).length >= EU_REGELN.parallelMax) break;
    }
    // b) Abschlüsse: Zeit um, Schlusskriterien mit Substanz erfüllt
    for (const def of KAPITEL) {
      const k = z.kapitel[def.id]!;
      if (k.status !== "offen" || k.geoeffnet === undefined) continue;
      if (w.day < k.geoeffnet + def.jahre * 365) continue;
      const substanz = erfuelltMitSubstanz(kriterienStand(w, def.schluss));
      if (!substanz.erfuellt) continue; // alibi oder unerfüllt: kein Abschluss
      schliesseKapitel(w, def);
    }
    // c) Zollunion-Update als Zwischenziel: Auto-Stopp A, sobald genug Kapitel geschlossen sind
    if (
      z.zollunion === "unveraendert" &&
      w.day >= (z.zollunionSperreBis ?? 0) &&
      KAPITEL.filter((x) => z.kapitel[x.id]!.status === "abgeschlossen").length >= EU_REGELN.zollunionKapitel &&
      !vetoGegen(w) &&
      !spiel.ereignisse.some((e) => e.vorlage === "eu_zollunion")
    ) {
      oeffne(w, "eu_zollunion", rng);
    }
  }

  // 3. Visa-Mini-Track: unabhängig von den Kapiteln
  visaPruefen(w);

  // 4. Der jährliche Fortschrittsbericht im November
  if (Number(w.date.slice(5, 7)) === EU_REGELN.berichtMonat) fortschrittsbericht(w);
}

// ---------------------------------------------------------------------------
// Aufbereitung für das EU-Dossier (Oberfläche)

export interface KapitelSicht {
  def: KapitelDef;
  zustand: KapitelZustand;
  note: EuNote;
  /** 0 bis 1 für den Fortschrittsbalken */
  fortschritt: number;
  oeffnung: KriteriumStand[];
  schluss: KriteriumStand[];
  schritt: string;
  blockiertZypern: boolean;
  alibi: boolean;
}

export function kapitelSicht(w: World): KapitelSicht[] {
  const z = euZustand(w);
  const zypern = zypernBewegung(w);
  return KAPITEL.map((def) => {
    const k = z.kapitel[def.id]!;
    const oeffnung = kriterienStand(w, def.oeffnung);
    const schluss = kriterienStand(w, def.schluss);
    const substanzO = erfuelltMitSubstanz(oeffnung);
    const substanzS = erfuelltMitSubstanz(schluss);
    let fortschritt: number;
    if (k.status === "abgeschlossen") fortschritt = 1;
    else {
      const gradO = oeffnung.filter((s) => s.erfuellt).length / Math.max(1, oeffnung.length);
      const gradS = schluss.filter((s) => s.erfuellt).length / Math.max(1, schluss.length);
      const zeit = k.geoeffnet !== undefined ? clamp((w.day - k.geoeffnet) / (def.jahre * 365), 0, 1) : 0;
      fortschritt = k.status === "offen" ? clamp(0.3 + 0.35 * gradS + 0.35 * zeit, 0, 0.99) : clamp(0.3 * gradO, 0, 0.29);
    }
    return {
      def,
      zustand: k,
      note: noteFuer(w, def, z),
      fortschritt,
      oeffnung,
      schluss,
      schritt: naechsterSchritt(w, def, z),
      blockiertZypern: !!def.zypernBlockiert && !zypern.bewegt && k.status !== "abgeschlossen",
      alibi: (k.status !== "abgeschlossen" && (k.status === "offen" ? substanzS.alibi : substanzO.alibi)),
    };
  });
}

export interface EuUebersicht {
  zustand: EuZustand;
  phasenText: string;
  kapitel: KapitelSicht[];
  visa: { kriterien: KriteriumStand[]; erfuellt: number; gewaehrt: boolean };
  zypern: { bewegt: boolean; text: string };
  veto: VetoLand | null;
  annaeherung: AnnaeherungSicht;
  kapitalAbzug: number;
}

export function euUebersicht(w: World): EuUebersicht {
  const z = euZustand(w);
  return {
    zustand: z,
    phasenText: PHASEN_TEXT[z.phase],
    kapitel: kapitelSicht(w),
    visa: visaStand(w),
    zypern: zypernBewegung(w),
    veto: vetoGegen(w),
    annaeherung: annaeherungSicht(w),
    kapitalAbzug: euKapitalAbzug(w),
  };
}

/** Kurzfassung für KI-Kontext und „Stand der Dinge“. */
export function euKurz(w: World): string {
  const z = w.spiel?.eu;
  if (!z) return "EU-Beitritt: eingefroren.";
  const fertig = KAPITEL.filter((k) => z.kapitel[k.id]!.status === "abgeschlossen").length;
  const teile = [`EU-Beitritt: ${z.phase}`, `${fertig}/${KAPITEL.length} Kapitel`];
  if (z.zollunion === "modernisiert") teile.push("Zollunion modernisiert");
  if (z.visaSeit !== undefined) teile.push("visafrei");
  return teile.join(", ") + ".";
}
