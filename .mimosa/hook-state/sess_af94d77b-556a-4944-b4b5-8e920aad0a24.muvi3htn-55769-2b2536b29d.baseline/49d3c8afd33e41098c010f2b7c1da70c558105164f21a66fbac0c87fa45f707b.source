// Vermittlung zwischen Drittstaaten (AUS-4 aus VERBESSERUNGSPLAN_2026-09-30) — die Alleinstellung des Spiels.
// Das Modell folgt AUSSENPOLITIK §6 / DESIGN_BESTANDSAUFNAHME.md Kap. 6 (ZOPA, ripeness, Spoiler, Garantien)
// und der Konflikt-Topologie der Recherche (RECHERCHE_REALWELT_LAENDERDOSSIERS.md, Teil IV).
//
//   - Reife (ripeness, 0–100): Sie steigt mit dem Schmerz des Patts, durch türkische Vorbereitung und
//     Welt-Signale (Ölpreis bei Hormus); sie sinkt durch Spoiler-Ereignisse.
//   - ZOPA (Zone möglicher Einigung): Aus Forderungen, roten Linien, Reife und dem Vertrauen in Ankara
//     errechnet das Modell ein Band — breit, schmal oder geschlossen — mit Hebelpunkten statt „der Lösung".
//   - Spoiler: Provokationen, Hardliner-Gewinne, Sabotage von außen, Ultimaten — Entscheidungs-Ereignisse
//     (Auto-Stopp A) mit den drei Antwortmustern verurteilen / dämpfen / ignorieren.
//   - Garantien: Ab ausreichender Reife kann Ankara bürgen — Überwachung (klein), Wirtschafts-Anker
//     (Korridor-/Getreide-Modell) oder militärische Garantie (groß). Garantien kosten laufend und brechen
//     bei einem Verstoß — mit Gesichtsverlust oder Eingreifen-Zwang.
//   - Einigung: ein Abkommen zwischen den Dritten; der Konflikt-Index des Paares sinkt über Monate, das
//     türkische Prestige steigt, die Zeitung berichtet. Scheitern nach einem Garantie-Angebot kostet Gesicht.
//
// Kalibrierung: Istanbul-Kommuniqué 2022 und Getreideabkommen (33 Mio. t, 07/2022) als Testfall-Konstante;
// die Vermittlungsaussicht bleibt im Band 8–85 % (VERHANDLUNGSTISCH). Alle Zahlen sind Spielparameter
// (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.
//
// Determinismus: Der Monatstick zapft den Zufallsstrom des Spiels nicht an; alle Monatsziehungen laufen
// über hashWert aus Weltzustand und Datum (Muster wie in sim/zeitung.ts) — alte Spielstände bleiben
// bit-identisch, Replays deterministisch. Nur der Vermittlungswurf selbst nutzt den übergebenen Rng.
//
// Modul-Ladezyklen: Ereignis-Öffnung und Zeitungsmeldung laufen über eine Brücke, die in sim/spiel.ts
// registriert wird (Muster der Kriegsbrücke in sim/initiative.ts) — kein Import von ereignisse.ts hier.

import { GARANTIEN, KONFLIKTE, KONFLIKT_NACH_ID, SPOILER_ARTEN, VORBEREITUNGEN, type GarantieArtId, type KonfliktDef, type SpoilerArtId, type VorbereitungId } from "../data/konflikte";
import { land, landAendern, vertrauenZu } from "./laender";
import { wirke, vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { kannZahlen } from "./kapital";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { hashWert, neuanfangGrund, verbrauche } from "./aufmerksamkeit";
import { kosten } from "./ereignis-hilfen";
import type { Rng } from "./rng";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";
import type { KonfliktZustand } from "./vermittlung-typen";

/** Die Regeln der Vermittlung als Spielparameter (Kalibrierung). */
export const VERMITTLUNG = {
  /** Band der Vermittlungsaussicht (VERHANDLUNGSTISCH: 8–85 %; Testfall Istanbul 2022/Getreide) */
  aussichtMin: 8,
  aussichtMax: 85,
  /** Darunter ist die ZOPA geschlossen: Ohne Mindestreife gibt es keine Zone möglicher Einigung */
  zopaOeffnetAb: 25,
  /** Ab dieser Reife und Bandbreite gilt die ZOPA als breit */
  zopaBreitReif: 55,
  zopaBreitBand: 25,
  /** Ab dieser Reife kann Ankara Garantien anbieten */
  garantieAb: 50,
  /** Reif-Kipppunkte: Gesprächsbereitschaft (40), Einigungsfenster (60), Einfrieren (20) — Auto-Stopp B */
  kippBereit: 40,
  kippFenster: 60,
  kippEnde: 20,
  /** Patt-Schmerz: So stark treibt ein heißer Konflikt die Reife pro Monat (bei Index 100) */
  schmerzFaktor: 0.05,
  /** Ölpreis-Kopplung (Hormus): Reif-Gewinn pro Monat und Indexpunkt über 100 */
  oelFaktor: 0.03,
  /** Langfristiger Rückzug der Reife Richtung halber Ausgangslage (Erschöpfung ohne Fortschritt) */
  rueckzug: 0.02,
  /** Konflikt-Index: Rückkehr zur Ausgangslage pro Monat (schwelender Konflikt) */
  schwel: 0.4,
  /** Konflikt-Index-Senkung pro Monat nach einer Einigung, bis zum Boden */
  einigungSenkung: 2,
  einigungBoden: 15,
  /** Tage Ruhe zwischen zwei Spoiler-Ereignissen desselben Konflikts */
  spoilerAbkuehlung: 120,
  /** Grundchance eines Spoilers pro Monat (bei Reife ab ZOPA-Öffnung) */
  spoilerChance: 0.05,
  /** Zuschlag je Konflikt-Index-Punkt über 50 */
  spoilerKonflikt: 0.001,
  /** Verstoß-Skalierung: Grundchance der Garantie × (Konflikt-Index / diesem Wert) */
  verstossSkala: 60,
  /** Einigung: Prestige, Vertrauen und die Reaktion der Dritten */
  erfolg: { ansehen: 4, vertrauenAlle: 1, parteien: 5, parteienKonflikt: -6, dritte: 3 },
  /** Scheitern: ohne Garantie-Angebot klein, mit Angebot ein Gesichtsverlust */
  scheitern: { ansehen: -1, reif: -4, gesichtNachGarantie: -2 },
} as const;

export type ZopaStufe = "geschlossen" | "schmal" | "breit";

// ---------------------------------------------------------------------------
// Brücke zur Oberfläche (Ereignis-Öffnung, Zeitung) — registriert in sim/spiel.ts

export interface VermittlungBruecke {
  oeffneEreignis: (w: World, vorlage: string, daten: Record<string, number | string>, rng: Rng) => void;
  zeitung: (w: World, e: { titel: string; fakt: string; wertung: number; schluessel?: string[] }) => void;
}
let bruecke: VermittlungBruecke | null = null;
export function setzeVermittlungBruecke(b: VermittlungBruecke): void {
  bruecke = b;
}

// ---------------------------------------------------------------------------
// Zustand (mit Migration älterer Spielstände beim ersten Zugriff)

function startZustand(def: KonfliktDef): KonfliktZustand {
  return { reif: def.reifStart, konfliktIndex: def.konfliktStart, vorbereitet: {}, reifVerlauf: [], reifBand: bandFuer(def.reifStart) };
}

/** Der Vermittlungszustand aller Konfliktpaare; ältere Spielstände bekommen die Startwerte der Datenlage. */
export function vermittlungVon(w: World): Record<string, KonfliktZustand> {
  const spiel = w.spiel;
  if (!spiel) return {};
  spiel.vermittlung ??= {};
  for (const def of KONFLIKTE) {
    const z = (spiel.vermittlung[def.id] ??= startZustand(def));
    // Reparatur beschädigter oder älterer Werte (fehlende Felder, NaN)
    if (!Number.isFinite(z.reif)) z.reif = def.reifStart;
    if (!Number.isFinite(z.konfliktIndex)) z.konfliktIndex = def.konfliktStart;
    z.reif = clamp(z.reif, 0, 100);
    z.konfliktIndex = clamp(z.konfliktIndex, 0, 100);
    z.vorbereitet ??= {};
    z.reifVerlauf ??= [];
  }
  return spiel.vermittlung;
}

export function konfliktZustand(w: World, id: string): KonfliktZustand {
  return vermittlungVon(w)[id]!;
}

// ---------------------------------------------------------------------------
// ZOPA: die Zone möglicher Einigung aus Sicht des Vermittlers

export interface ZopaSicht {
  stufe: ZopaStufe;
  /** Bandbreite 0–100 */
  breite: number;
  /** Warum das Band so liegt (für die Anzeige) */
  gruende: string[];
}

function vertrauenPartei(w: World, p: KonfliktDef["a"]): number {
  return p.land ? vertrauenZu(w, p.land) : 50;
}

export function zopaFuer(w: World, def: KonfliktDef): ZopaSicht {
  const z = konfliktZustand(w, def.id);
  const va = vertrauenPartei(w, def.a);
  const vb = vertrauenPartei(w, def.b);
  const min = Math.min(va, vb);
  const breite = Math.round(clamp(def.zopaBasis * (z.reif / 100) * (0.5 + min / 200), 0, 100));
  const gruende: string[] = [];
  if (z.reif < VERMITTLUNG.zopaOeffnetAb) gruende.push(`Die Lage ist nicht reif (${Math.round(z.reif)} von ${VERMITTLUNG.zopaOeffnetAb} nötig): Der Schmerz des Patts wiegt den Kompromiss noch nicht auf.`);
  if (va < def.minA) gruende.push(`${def.a.name} vertraut Ankara als Vermittler noch nicht genug (${Math.round(va)} von ${def.minA}).`);
  if (vb < def.minB) gruende.push(`${def.b.name} vertraut Ankara als Vermittler noch nicht genug (${Math.round(vb)} von ${def.minB}).`);
  if (gruende.length) return { stufe: "geschlossen", breite, gruende };
  if (z.reif >= VERMITTLUNG.zopaBreitReif && breite >= VERMITTLUNG.zopaBreitBand) {
    gruende.push(`Die Lage ist reif (${Math.round(z.reif)}), und beide Seiten trauen Ankara den Ausgleich zu.`);
    return { stufe: "breit", breite, gruende };
  }
  gruende.push(`Es gibt eine Zone möglicher Einigung, aber sie ist eng: Reife ${Math.round(z.reif)}, Vertrauen ${Math.round(min)}.`);
  return { stufe: "schmal", breite, gruende };
}

// ---------------------------------------------------------------------------
// Aussicht (Kalibrierung: Band 8–85 %; Istanbul 2022/Getreide als Testfall)

export function aussichtFuer(w: World, def: KonfliktDef): number {
  const z = konfliktZustand(w, def.id);
  const zopa = zopaFuer(w, def);
  const min = Math.min(vertrauenPartei(w, def.a), vertrauenPartei(w, def.b));
  const ansehen = nationalAverage(NET, w.net, "ansehen");
  const zopaBonus = zopa.stufe === "breit" ? 12 : zopa.stufe === "geschlossen" ? -30 : 0;
  const garantieBonus = z.garantieAngebot ? GARANTIEN[z.garantieAngebot].aussicht : 0;
  const roh = 15 + z.reif * 0.45 + (min - 35) * 0.6 + (ansehen - 45) * 0.4 + zopaBonus + garantieBonus - z.konfliktIndex * 0.15;
  return Math.round(clamp(roh, VERMITTLUNG.aussichtMin, VERMITTLUNG.aussichtMax));
}

// ---------------------------------------------------------------------------
// Sicht für die Oberfläche

export type KonfliktStatus = "eingefroren" | "verhandelnd" | "geeint" | "stabilisiert";

export const STATUS_NAME: Record<KonfliktStatus, string> = {
  eingefroren: "eingefroren",
  verhandelnd: "verhandelnd",
  geeint: "geeint — Umsetzung läuft",
  stabilisiert: "stabilisiert",
};

export interface VorbereitungSicht {
  def: (typeof VORBEREITUNGEN)[VorbereitungId];
  moeglich: boolean;
  grund?: string;
}

export interface GarantieSicht {
  def: (typeof GARANTIEN)[GarantieArtId];
  aktiv: boolean;
  angeboten: boolean;
  moeglich: boolean;
  grund?: string;
}

export interface KonfliktSicht {
  def: KonfliktDef;
  z: KonfliktZustand;
  status: KonfliktStatus;
  zopa: ZopaSicht;
  aussicht: number;
  moeglich: boolean;
  grund?: string;
  vertrauenA: number;
  vertrauenB: number;
  vorbereitungen: VorbereitungSicht[];
  garantien: GarantieSicht[];
}

function statusFuer(z: KonfliktZustand): KonfliktStatus {
  if (z.einigung !== undefined) return z.konfliktIndex <= 25 ? "stabilisiert" : "geeint";
  return z.reif < VERMITTLUNG.kippEnde ? "eingefroren" : "verhandelnd";
}

export function konfliktSicht(w: World, def: KonfliktDef): KonfliktSicht {
  const spiel = w.spiel;
  const z = konfliktZustand(w, def.id);
  const zopa = zopaFuer(w, def);
  const va = vertrauenPartei(w, def.a);
  const vb = vertrauenPartei(w, def.b);
  let grund: string | undefined;
  const zuletzt = spiel?.vermittelt?.[def.id] ?? -1e9;
  if (spiel && !kannZahlen(spiel.kapital, def.pk)) grund = "Dafür fehlt das Kapital.";
  else if (spiel && w.day - zuletzt < def.abkuehlung) grund = `Wieder möglich in ${def.abkuehlung - (w.day - zuletzt)} Tagen.`;
  else if (va < def.minA) grund = `${def.a.name} vertraut Ankara als Vermittler noch nicht genug.`;
  else if (vb < def.minB) grund = `${def.b.name} vertraut Ankara als Vermittler noch nicht genug.`;
  else if (z.einigung !== undefined) grund = "Die Einigung steht — jetzt zählt die Umsetzung (Garantien und Spoiler-Abwehr).";
  else if (zopa.stufe === "geschlossen") grund = "Es gibt keine Zone möglicher Einigung; erst muss die Lage reifen.";
  const vorbereitungen = (Object.keys(VORBEREITUNGEN) as VorbereitungId[]).map((id) => {
    const d = VORBEREITUNGEN[id];
    let g: string | undefined;
    const rest = (z.vorbereitet[id] ?? -1e9) + d.abkuehlung - w.day;
    if (z.einigung !== undefined) g = "Die Einigung steht; Vorbereitung hat sich erledigt.";
    else if (rest > 0) g = `Wieder möglich in ${rest} Tagen.`;
    else if (spiel && !kannZahlen(spiel.kapital, d.pk)) g = "Dafür fehlt das Kapital.";
    else if (id === "gastgeber" && (z.reif < VERMITTLUNG.zopaOeffnetAb || zopa.stufe === "geschlossen")) g = "Ein Gipfel lohnt erst, wenn eine Zone möglicher Einigung besteht.";
    return { def: d, moeglich: !g, ...(g ? { grund: g } : {}) };
  });
  const garantien = (Object.keys(GARANTIEN) as GarantieArtId[]).map((id) => {
    const d = GARANTIEN[id];
    const aktiv = z.garantie === id;
    const angeboten = z.garantieAngebot === id;
    let g: string | undefined;
    if (aktiv || angeboten) g = undefined;
    else if (z.einigung !== undefined) g = z.garantie ? "Es steht schon eine Garantie." : "Die Einigung steht; eine nachträgliche Garantie wirkt nicht mehr.";
    else if (z.garantie) g = "Es steht schon eine Garantie.";
    else if (z.garantieAngebot) g = `Es liegt schon das Angebot „${GARANTIEN[z.garantieAngebot].label}" — erst ein Vermittlungsversuch entscheidet.`;
    else if (z.reif < VERMITTLUNG.garantieAb) g = `Garantien wirken erst ab Reife ${VERMITTLUNG.garantieAb} (jetzt ${Math.round(z.reif)}).`;
    else if (zopa.stufe === "geschlossen") g = "Ohne Zone möglicher Einigung ist eine Garantie wertlos.";
    else if (spiel && !kannZahlen(spiel.kapital, d.pk)) g = "Dafür fehlt das Kapital.";
    return { def: d, aktiv, angeboten, moeglich: !aktiv && !angeboten && !g, ...(g ? { grund: g } : {}) };
  });
  return {
    def, z, status: statusFuer(z), zopa, aussicht: aussichtFuer(w, def),
    moeglich: !grund, ...(grund ? { grund } : {}),
    vertrauenA: va, vertrauenB: vb, vorbereitungen, garantien,
  };
}

export function konfliktSichten(w: World): KonfliktSicht[] {
  return KONFLIKTE.map((d) => konfliktSicht(w, d));
}

// ---------------------------------------------------------------------------
// Reif-Kipppunkte (Auto-Stopp B über Hinweise)

function bandFuer(reif: number): number {
  return reif < VERMITTLUNG.kippEnde ? 0 : reif < VERMITTLUNG.kippBereit ? 1 : reif < VERMITTLUNG.kippFenster ? 2 : 3;
}

const KIPP_TEXT: Record<number, { titel: (d: KonfliktDef) => string; text: (d: KonfliktDef) => string }> = {
  0: {
    titel: (d) => `Vermittlung ${d.titel}: Der Prozess droht einzufrieren`,
    text: (d) => `Die Reife der Lage zwischen ${d.a.name} und ${d.b.name} ist unter ${VERMITTLUNG.kippEnde} gefallen. Ohne neue Kanäle und Vertrauensmaßnahmen verkommt Ankaras Vermittlung zur Makulatur — und Spoiler gewinnen Oberwasser.`,
  },
  2: {
    titel: (d) => `Vermittlung ${d.titel}: Die Gesprächsbereitschaft wächst`,
    text: (d) => `Die Lage zwischen ${d.a.name} und ${d.b.name} reift (${VERMITTLUNG.kippBereit}+): Beide Seiten prüfen ernsthaft, ob der Kompromiss billiger ist als der Patt. Jetzt zählen Kanäle, Vertrauensmaßnahmen und der richtige Moment.`,
  },
  3: {
    titel: (d) => `Vermittlung ${d.titel}: Das Fenster für eine Einigung öffnet sich`,
    text: (d) => `Die Reife hat ${VERMITTLUNG.kippFenster} erreicht: Die Zone möglicher Einigung steht so offen wie selten. Ab Reife ${VERMITTLUNG.garantieAb} kann ein türkisches Garantiepaket den Ausschlag geben — Gipfel und Vermittlungsversuch haben jetzt die beste Aussicht.`,
  },
};

function kippPruefen(w: World, def: KonfliktDef, z: KonfliktZustand): void {
  const spiel = w.spiel;
  if (!spiel) return;
  const band = bandFuer(z.reif);
  if (z.reifBand === undefined || band === z.reifBand) return;
  const vorher = z.reifBand;
  z.reifBand = band;
  // Nur echte Kippungen melden: aufwärts zu den Fenstern, abwärts ins Einfrieren
  const melden = (band > vorher && band >= 2) || (band < vorher && band === 0);
  if (!melden) return;
  const t = KIPP_TEXT[band];
  if (!t) return;
  spiel.hinweise.push({ id: `vermittlung-kipp-${def.id}-${band}-${w.day}`, titel: t.titel(def), szene: "istanbul", text: [t.text(def)] });
}

// ---------------------------------------------------------------------------
// Handlungen des Vermittlers

export interface Antwort {
  ok: boolean;
  text: string;
  why?: string;
}

function namen(def: KonfliktDef): string {
  return `${def.a.name} und ${def.b.name}`;
}

/** Vorbereitungshandlung: Reife schaffen, bevor der Tisch steht. */
export function vorbereite(w: World, konfliktId: string, vid: VorbereitungId): Antwort {
  const spiel = w.spiel;
  const def = KONFLIKT_NACH_ID[konfliktId];
  const d = VORBEREITUNGEN[vid];
  if (!spiel || !def || !d) return { ok: false, text: "Diese Handlung gibt es nicht." };
  const sicht = konfliktSicht(w, def).vorbereitungen.find((v) => v.def.id === vid);
  if (!sicht?.moeglich) return { ok: false, text: sicht?.grund ?? "Das geht gerade nicht." };
  const pause = neuanfangGrund(w);
  if (pause) return { ok: false, text: pause };
  const z = konfliktZustand(w, konfliktId);
  spiel.kapital -= d.pk;
  verbrauche(w, d.aufmerksamkeit, `${d.label}: ${def.titel}`);
  z.vorbereitet[vid] = w.day;
  z.reif = clamp(z.reif + d.reif, 0, 100);
  z.konfliktIndex = clamp(z.konfliktIndex - d.konflikt, 0, 100);
  if (d.ansehen) wirke(w, "ansehen", d.ansehen);
  // Diskrete Arbeit zahlt auf das Vertrauen beider Seiten ein
  if (def.a.land) landAendern(w, def.a.land, { vertrauen: 1 }, `${d.label} (Vermittlung)`);
  if (def.b.land && def.b.land !== def.a.land) landAendern(w, def.b.land, { vertrauen: 1 }, `${d.label} (Vermittlung)`);
  kippPruefen(w, def, z);
  const text = `${d.label} zwischen ${namen(def)}: Die Lage reift (${Math.round(z.reif)} von 100).`;
  addLog(w, "entscheidung", text, `Kostet ${d.pk} Kapital und Aufmerksamkeit. Reife +${d.reif}${d.konflikt ? `, Konflikt-Index −${d.konflikt}` : ""}${d.ansehen ? `, Ansehen +${d.ansehen}` : ""}.`);
  return { ok: true, text, why: `Kostet ${d.pk} Kapital. Reife +${d.reif}; der Weg zum Tisch wird kürzer, aber Spoiler können alles zurückwerfen.` };
}

/** Ein Garantiepaket anbieten: hebt die Aussicht des nächsten Vermittlungsversuchs, bindet Ankara im Erfolgsfall. */
export function bieteGarantie(w: World, konfliktId: string, art: GarantieArtId): Antwort {
  const spiel = w.spiel;
  const def = KONFLIKT_NACH_ID[konfliktId];
  const d = GARANTIEN[art];
  if (!spiel || !def || !d) return { ok: false, text: "Diese Garantie gibt es nicht." };
  const sicht = konfliktSicht(w, def).garantien.find((g) => g.def.id === art);
  if (!sicht || sicht.aktiv || sicht.angeboten || !sicht.moeglich) return { ok: false, text: sicht?.grund ?? "Das geht gerade nicht." };
  const pause = neuanfangGrund(w);
  if (pause) return { ok: false, text: pause };
  const z = konfliktZustand(w, konfliktId);
  spiel.kapital -= d.pk;
  verbrauche(w, 6, `Garantie-Angebot: ${def.titel}`);
  z.garantieAngebot = art;
  const text = `Ankara bietet ${namen(def)} eine Garantie an: ${d.label}.`;
  addLog(w, "entscheidung", text, `Die Aussicht des nächsten Vermittlungsversuchs steigt um ${d.aussicht} Punkte. Wird die Einigung geschlossen, steht die Garantie — mit laufenden Kosten und dem Risiko des Bruchs.`);
  return { ok: true, text, why: `Kostet ${d.pk} Kapital. Aussicht +${d.aussicht} Punkte; im Erfolgsfall läuft die Garantie mit ${d.monatPk} Kapital im Monat. ${d.risiko}` };
}

/** Eine stehende Garantie beenden: geordnet billig, mitten im Konflikt ein Gesichtsverlust. */
export function beendeGarantie(w: World, konfliktId: string): Antwort {
  const spiel = w.spiel;
  const def = KONFLIKT_NACH_ID[konfliktId];
  if (!spiel || !def) return { ok: false, text: "Diesen Konflikt gibt es nicht." };
  const z = konfliktZustand(w, konfliktId);
  if (!z.garantie) return { ok: false, text: "Es steht keine Garantie." };
  const d = GARANTIEN[z.garantie];
  const geordnet = z.konfliktIndex <= 25;
  z.garantie = undefined;
  z.garantieSeit = undefined;
  if (!geordnet) wirke(w, "ansehen", -2);
  const text = geordnet
    ? `Die Garantie „${d.label}" zwischen ${namen(def)} wird geordnet beendet: Die Lage hält auch ohne Ankaras Bürgschaft.`
    : `Ankara zieht die Garantie „${d.label}" mitten im Konflikt zurück: Das lesen beide Seiten als Wortbruch.`;
  addLog(w, "entscheidung", text, geordnet ? "Die laufenden Kosten entfallen." : "Ansehen −2; die laufenden Kosten entfallen.");
  return { ok: true, text, why: geordnet ? "Die laufenden Kosten entfallen." : "Ansehen −2; wer bürgt und davonläuft, verliert Gesicht." };
}

// ---------------------------------------------------------------------------
// Der Vermittlungsversuch

export function vermittle(w: World, konfliktId: string, rng: Rng): Antwort {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: "Ohne Spielschleife gibt es keine Vermittlung." };
  const def = KONFLIKT_NACH_ID[konfliktId];
  if (!def) return { ok: false, text: "Diese Vermittlung gibt es nicht." };
  const sicht = konfliktSicht(w, def);
  if (!sicht.moeglich) return { ok: false, text: sicht.grund ?? "Das geht gerade nicht." };
  const z = sicht.z;
  spiel.kapital -= def.pk;
  (spiel.vermittelt ??= {})[konfliktId] = w.day;
  if (rng.next() * 100 < sicht.aussicht) {
    // Einigung: ein Abkommen zwischen den Dritten — der Konflikt-Index sinkt ab jetzt über Monate
    z.einigung = w.day;
    const E = VERMITTLUNG.erfolg;
    if (def.a.land) landAendern(w, def.a.land, { vertrauen: E.parteien, konflikt: E.parteienKonflikt }, `Einigung mit ${def.b.name} in Istanbul`);
    if (def.b.land && def.b.land !== def.a.land) landAendern(w, def.b.land, { vertrauen: E.parteien, konflikt: E.parteienKonflikt }, `Einigung mit ${def.a.name} in Istanbul`);
    wirke(w, "ansehen", E.ansehen);
    vertrauenAendern(w, E.vertrauenAlle);
    // EU und USA begrüßen die Stabilisierung (Reaktion der Dritten)
    landAendern(w, "EU", { vertrauen: E.dritte }, `Vermittlungserfolg: ${def.titel}`);
    landAendern(w, "USA", { vertrauen: E.dritte }, `Vermittlungserfolg: ${def.titel}`);
    let garantieText = "";
    if (z.garantieAngebot) {
      z.garantie = z.garantieAngebot;
      z.garantieSeit = w.day;
      kosten(w, GARANTIEN[z.garantie].bip);
      garantieText = ` Die türkische Garantie „${GARANTIEN[z.garantie].label}" steht ab jetzt — mit laufenden Kosten und dem Risiko des Bruchs.`;
      z.garantieAngebot = undefined;
    }
    const text = `Vermittlung gelingt: ${namen(def)} einigen sich in Istanbul auf ein Paket.`;
    addLog(w, "entscheidung", text, `${def.paket.join("; ")}. Kostet ${def.pk} Kapital; Ankaras Ansehen wächst.${garantieText}`);
    // Die Zeitung berichtet (Eilmeldung digital, Print im nächsten Monat)
    bruecke?.zeitung(w, {
      titel: `Abkommen in Istanbul: ${def.titel}`,
      fakt: `${def.a.name} und ${def.b.name} einigen sich auf türkische Vermittlung: ${def.paket[0]}. Der Konflikt-Index sinkt, Ankaras Ansehen wächst.`,
      wertung: 0.85,
      schluessel: ["einigen sich in Istanbul"],
    });
    return { ok: true, text, why: `${def.paket.join("; ")}. Kostet ${def.pk} Kapital; Ansehen +${E.ansehen}, Vertrauen aller +${E.vertrauenAlle}.${garantieText}` };
  }
  const S = VERMITTLUNG.scheitern;
  z.reif = clamp(z.reif + S.reif, 0, 100);
  if (def.a.land) landAendern(w, def.a.land, { vertrauen: -1 });
  if (def.b.land && def.b.land !== def.a.land) landAendern(w, def.b.land, { vertrauen: -1 });
  wirke(w, "ansehen", S.ansehen);
  let gesicht = "";
  if (z.garantieAngebot) {
    // Scheitern nach einem Garantie-Angebot: Der Gesichtsverlust fällt größer aus
    wirke(w, "ansehen", S.gesichtNachGarantie - S.ansehen);
    gesicht = ` Das angebotene Garantiepaket verfängt nicht: ein Gesichtsverlust (Ansehen ${S.gesichtNachGarantie}).`;
    z.garantieAngebot = undefined;
  }
  kippPruefen(w, def, z);
  const text = `Die Vermittlung zwischen ${namen(def)} scheitert.`;
  addLog(w, "entscheidung", text, `Beide Seiten stellen zu hohe Bedingungen. Kostet ${def.pk} Kapital und etwas Ansehen; die Reife sinkt.${gesicht}`);
  return { ok: false, text, why: `Kostet ${def.pk} Kapital und etwas Ansehen; die Reife sinkt um ${-S.reif} Punkte.${gesicht}` };
}

// ---------------------------------------------------------------------------
// Spoiler und Verstoß: Folgen der Ereignis-Optionen (aufgerufen aus sim/ereignisse-vermittlung.ts)

export type SpoilerAntwort = "verurteilen" | "daempfen" | "ignorieren";

export function spoilerFolge(w: World, ev: OffenesEreignis, antwort: SpoilerAntwort): string {
  const def = KONFLIKT_NACH_ID[String(ev.daten?.konflikt ?? "")];
  if (!def) return "Der Vorgang ist gegenstandslos geworden.";
  const z = konfliktZustand(w, def.id);
  const art = SPOILER_ARTEN[(String(ev.daten?.art ?? "provokation") as SpoilerArtId)] ?? SPOILER_ARTEN.provokation;
  const seite = ev.daten?.seite === "b" ? def.b : def.a;
  const andere = ev.daten?.seite === "b" ? def.a : def.b;
  switch (antwort) {
    case "verurteilen": {
      if (seite.land) landAendern(w, seite.land, { vertrauen: -6 }, `Öffentliche Rüge aus Ankara (${def.titel})`);
      if (andere.land && andere.land !== seite.land) landAendern(w, andere.land, { vertrauen: 2 }, `Ankara rügt die Spoiler (${def.titel})`);
      z.reif = clamp(z.reif + 2, 0, 100);
      z.konfliktIndex = clamp(z.konfliktIndex - 3, 0, 100);
      wirke(w, "ansehen", 0.5);
      kippPruefen(w, def, z);
      return `Ankara verurteilt die Provokation öffentlich: ${andere.name} fühlt sich geschützt, ${seite.name} antwortet kühl — aber die Verhandlungslinie hält.`;
    }
    case "daempfen": {
      z.reif = clamp(z.reif - 2, 0, 100);
      z.konfliktIndex = clamp(z.konfliktIndex - 2, 0, 100);
      kippPruefen(w, def, z);
      return "Auf diskreten Kanälen dämpft Ankara beide Seiten: Der Schaden bleibt klein, ohne dass jemand das Gesicht verliert.";
    }
    default: {
      z.reif = clamp(z.reif - art.reif, 0, 100);
      z.konfliktIndex = clamp(z.konfliktIndex + art.konflikt, 0, 100);
      kippPruefen(w, def, z);
      return `Ankara schweigt — und die Spoiler lesen es als Freibrief: Die Reife der Lage sinkt um ${art.reif} Punkte.`;
    }
  }
}

export type VerstossAntwort = "eingreifen" | "daempfen" | "hinnehmen";

export function verstossFolge(w: World, ev: OffenesEreignis, antwort: VerstossAntwort): string {
  const def = KONFLIKT_NACH_ID[String(ev.daten?.konflikt ?? "")];
  if (!def) return "Der Vorgang ist gegenstandslos geworden.";
  const z = konfliktZustand(w, def.id);
  const d = z.garantie ? GARANTIEN[z.garantie] : undefined;
  switch (antwort) {
    case "eingreifen": {
      if (z.garantie !== "militaer") return "Ohne militärische Garantie gibt es nichts einzugreifen.";
      kosten(w, 0.3);
      wirke(w, "abschreckung", -2);
      wirke(w, "ansehen", 1);
      z.konfliktIndex = clamp(z.konfliktIndex + 8, 0, 100);
      z.reif = clamp(z.reif - 5, 0, 100);
      addLog(w, "entscheidung", `Ankara greift ein: Die Garantie zwischen ${namen(def)} wird durchgesetzt.`, "Die Entschlossenheit kostet 0,3 % des BIP und Abschreckung — aber die Garantie gilt weiter, und alle rechnen mit Ankara.");
      return "Türkische Kräfte setzen die Garantie durch: Der Verstoß wird zurückgewiesen, die Vereinbarung gilt — und alle wissen, dass Ankara es ernst meint.";
    }
    case "daempfen": {
      z.konfliktIndex = clamp(z.konfliktIndex + 6, 0, 100);
      z.reif = clamp(z.reif - 5, 0, 100);
      addLog(w, "entscheidung", `Verstoß gegen die Vereinbarung zwischen ${namen(def)}: Ankara dämpft.`, "Der Verstoß wird notiert, nicht beantwortet; die Garantie steht, aber ihre Abschreckung leidet.");
      return "Ankara dämpft auf allen Kanälen: Die Garantie steht noch, aber beide Seiten haben gelernt, dass Verstöße billig sind.";
    }
    default: {
      const label = d?.label ?? "Garantie";
      z.garantie = undefined;
      z.garantieSeit = undefined;
      wirke(w, "ansehen", -6);
      z.reif = clamp(z.reif - 15, 0, 100);
      z.konfliktIndex = clamp(z.konfliktIndex + 12, 0, 100);
      kippPruefen(w, def, z);
      addLog(w, "entscheidung", `Die Garantie „${label}" zwischen ${namen(def)} ist gebrochen.`, "Ein Verstoß ohne Antwort: Der Garant verliert das Gesicht (Ansehen −6), die Reife der Lage stürzt ab.");
      return `Der Verstoß bleibt ohne Antwort: Die Garantie „${label}" ist gebrochen — Ankara verliert das Gesicht, und die Lage fällt zurück.`;
    }
  }
}

// ---------------------------------------------------------------------------
// Monatstick: Reife-Dynamik, Konflikt-Index, Garantie-Kosten, Spoiler, Verstöße

export function vermittlungMonat(w: World, rng: Rng): void {
  const spiel = w.spiel;
  if (!spiel || spiel.ende) return;
  const alle = vermittlungVon(w);
  const monat = w.date.slice(0, 7);
  let spoilerGeoeffnet = false;
  let verstossGeoeffnet = false;

  for (const def of KONFLIKTE) {
    const z = alle[def.id]!;

    // Reif-Verlauf für die Kurve (vor der Veränderung des Monats)
    z.reifVerlauf.push({ monat, wert: Math.round(z.reif) });
    if (z.reifVerlauf.length > 24) z.reifVerlauf.shift();

    if (z.einigung !== undefined) {
      // Umsetzungsphase: Der Konflikt-Index sinkt über Monate zum Boden; die Länderakten folgen sichtbar
      if (z.konfliktIndex > VERMITTLUNG.einigungBoden) {
        z.konfliktIndex = clamp(z.konfliktIndex - VERMITTLUNG.einigungSenkung, VERMITTLUNG.einigungBoden, 100);
        if (def.a.land) landAendern(w, def.a.land, { konflikt: -1 });
        if (def.b.land && def.b.land !== def.a.land) landAendern(w, def.b.land, { konflikt: -1 });
      }
    } else {
      // Reife-Dynamik: Patt-Schmerz treibt, Erschöpfung ohne Fortschritt zieht zurück, Welt-Signale wirken
      const schmerz = (z.konfliktIndex - 50) * VERMITTLUNG.schmerzFaktor;
      const oel = def.oelKopplung ? Math.max(0, (w.economy.oel ?? 100) - 100) * VERMITTLUNG.oelFaktor : 0;
      const vertrauenMin = Math.min(vertrauenPartei(w, def.a), vertrauenPartei(w, def.b));
      const draht = vertrauenMin > 55 ? 0.2 : 0;
      const rauschen = (hashWert(`${w.seed}|verm|${def.id}|${monat}`) - 0.5) * 1.4;
      const rueckzug = (def.reifStart * 0.5 - z.reif) * VERMITTLUNG.rueckzug;
      z.reif = clamp(z.reif + schmerz + oel + draht + rauschen + rueckzug, 0, 100);
      // Der Konflikt schwelt zur Ausgangslage zurück
      const diff = def.konfliktStart - z.konfliktIndex;
      z.konfliktIndex = clamp(z.konfliktIndex + Math.sign(diff) * Math.min(VERMITTLUNG.schwel, Math.abs(diff)), 0, 100);
    }

    kippPruefen(w, def, z);

    // Stehende Garantie: laufende Kosten, Wirkung und der Verstoß-Wurf
    if (z.garantie) {
      const d = GARANTIEN[z.garantie];
      spiel.kapital -= d.monatPk;
      if (z.garantie === "wirtschaft") {
        wirke(w, "export", 0.4);
        wirke(w, "ansehen", 0.2);
      }
      const chance = d.verstossChance * (z.konfliktIndex / VERMITTLUNG.verstossSkala);
      if (!verstossGeoeffnet && hashWert(`${w.seed}|verstoss|${def.id}|${monat}`) < chance) {
        verstossGeoeffnet = true;
        bruecke?.oeffneEreignis(w, "vermittlung_verstoss", { konflikt: def.id, garantie: z.garantie }, rng);
      }
    }

    // Spoiler-Wurf: nur in der Verhandlungsphase, mit Abkühlung — und nur, wenn Ankara an diesem
    // Konflikt überhaupt am Tisch sitzt (Vorbereitung, Versuch oder Angebot): Wer sich nicht engagiert,
    // hat auch keine Annäherung, die Spoiler beschädigen könnten (hält zugleich das Ereignis-Budget frei).
    const engagement = spiel.vermittelt?.[def.id] !== undefined || Object.keys(z.vorbereitet).length > 0 || z.garantieAngebot !== undefined;
    if (
      !spoilerGeoeffnet &&
      engagement &&
      z.einigung === undefined &&
      z.reif >= VERMITTLUNG.zopaOeffnetAb &&
      w.day - (z.spoilerZuletzt ?? -1e9) >= VERMITTLUNG.spoilerAbkuehlung
    ) {
      const chance = VERMITTLUNG.spoilerChance + Math.max(0, z.konfliktIndex - 50) * VERMITTLUNG.spoilerKonflikt;
      if (hashWert(`${w.seed}|spoiler|${def.id}|${monat}`) < chance) {
        spoilerGeoeffnet = true;
        z.spoilerZuletzt = w.day;
        const arten = Object.keys(SPOILER_ARTEN) as SpoilerArtId[];
        const art = arten[Math.floor(hashWert(`${w.seed}|spoiler-art|${def.id}|${monat}`) * arten.length) % arten.length]!;
        const seite = hashWert(`${w.seed}|spoiler-seite|${def.id}|${monat}`) < 0.5 ? "a" : "b";
        bruecke?.oeffneEreignis(w, "vermittlung_spoiler", { konflikt: def.id, art, seite }, rng);
      }
    }
  }
}
