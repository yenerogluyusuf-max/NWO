// Die Verfassungsreform als mehrstufiger Vorgang — der größte politische Hebel der Bühne (REC-1,
// VERBESSERUNGSPLAN_2026-09-30; RECHERCHE_VERTIEFUNG_MACHT_KAPITAL.md, Kapitel „Systemwechsel als Mechanik“).
//
// Der Weg ist der Konflikt, nie ein Einzelkauf:
//   1. Paket schnüren: vier bis sechs Artikel, jeder mit Varianten; jede Variante hat Lager- und
//      Wähler-Präferenzen und Langzeit-Effekte auf das Politiknetz.
//   2. Hürden im Parlament: 301 bis 359 Ja-Stimmen führen nur über eine Volksabstimmung, ab 360 wird das
//      Paket direkt Gesetz, unter 301 ist es gescheitert (Kapital teilweise verbrannt, Vertrauensverlust).
//   3. Kontrollinstanz: Die Opposition kann das Paket vor das Verfassungsgericht ziehen; das Gericht
//      entscheidet nach seinem tatsächlichen Besetzungsstand (Sitze-Modell aus sim/reich.ts).
//   4. Referendum als Mini-Wahl: Kampagnenzeit, Zustimmung, Themen-Salienz und Wählergruppen-Reaktionen
//      entscheiden; ein Nein kostet schweres Vertrauen und stärkt die Opposition.
//   5. Gegenreaktion: Autoritäre Pakete erzeugen Proteste, Druck aus Straßburg, Misstrauen der EU und
//      nervöse Märkte; demokratisierende Pakete stärken die Legitimität, kosten aber laufend etwas
//      Politisches Kapital (wer Kontrolle abgibt, regiert mit weniger Druckmitteln).
//
// Harte Regel: eine Verfassungsfrage je Amtszeit. Gescheiterte Pakete sperren ihre Artikel für zwölf Monate.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { clamp } from "./economy";
import { addDays, formatDateDe } from "./dates";
import { addLog, fmt } from "./log";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { vertrauenAendern, wirke } from "./wirkung";
import { GRUPPEN, GRUPPEN_SUMME } from "./gruppen";
import { bereitschaftAendern, duldung } from "./fraktionen";
import { REGELN } from "./handeln";
import { reichZustand } from "./reich";
import { landAendern } from "./laender";
import { kannZahlen } from "./kapital";
import { AUFMERKSAMKEIT_KOSTEN, neuanfangGrund, unsicherheitFaktor, verbrauche } from "./aufmerksamkeit";
import type { Rng } from "./rng";
import type { World } from "./types";
import type { Ergebnis } from "./handeln";
import type { VerfassungsVorgang, VerfassungsZustand } from "./spiel-typen";

// ---------------------------------------------------------------------------
// Spielparameter des Vorgangs

export const VERFASSUNG_REGELN = {
  /** Hürden der Parlamentsabstimmung (Spielparameter, an das Verfassungsreferendum-Design angelehnt) */
  mehrheit: 301,
  direkt: 360,
  /** Tage vom Einbringen bis zur Abstimmung (länger als ein Gesetz: das Land redet mit) */
  tageBisAbstimmung: 28,
  /** Tage bis zur Entscheidung des Verfassungsgerichts */
  aymTage: 14,
  /** Kampagnenzeit vor der Volksabstimmung (4 bis 6 Wochen) */
  kampagnenTage: 35,
  /** Politisches Kapital: Grundpreis plus Aufschlag je geändertem Artikel */
  pkBasis: 14,
  pkJeArtikel: 4,
  /** Stimmenkauf ist bei der Verfassungsfrage doppelt so teuer wie bei Gesetzen */
  kaufFaktor: 2,
  /** Kapitalrückfluss beim freiwilligen Rückzug vor der Abstimmung */
  rueckzugAnteil: 0.6,
  /** Kapitalrückfluss beim Scheitern im Parlament (der Rest ist verbrannt) */
  scheiternZurueck: 0.4,
  /** Sperrfrist für Artikel eines gescheiterten Pakets (Tage; zwölf Monate) */
  sperrTage: 365,
  /** Ein Kampagnen-Impuls kostet Kapital und braucht eine Woche Abstand */
  kampagnePk: 5,
  kampagneAbkuehlung: 7,
  /** Kampagnen-Wirkung: Wurzelgesetz mit Deckel (Prozentpunkte) */
  kampagneFaktor: 1.5,
  kampagneMax: 6,
  /** Puffer über der Hürde für eine „sichere“ Prognose */
  stimmenPuffer: 10,
  /** Streuung der Wahlabend-Auszählung (wie bei der Präsidentschaftswahl) */
  referendumStreuung: 2.2,
} as const;

// ---------------------------------------------------------------------------
// Artikel-Katalog

/** Eine Effektzeile auf das Politiknetz (Langzeit-Effekt der Variante, beim Beschluss). */
export interface NetzEffekt {
  id: string;
  d: number;
}

export interface VerfassungsVariante {
  id: string;
  name: string;
  /** Ein Satz: was sich ändert */
  text: string;
  /** Ob diese Variante dem bisherigen Recht entspricht (kein Artikel-Preis, keine Effekte) */
  statusQuo?: boolean;
  /**
   * Richtung der Macht: + autoritär (Machtkonzentration), − demokratisierend (Kontrolle stärker), 0 neutral.
   * Treibt die Gegenreaktion, die Anfechtungs- und die Kassationswahrscheinlichkeit.
   */
  autoritaer: number;
  /** Präferenz der Fraktionen: −2 strikt dagegen bis +2 entschieden dafür (eigene Partei und Lager stimmen ohnehin) */
  parteien: Record<string, number>;
  /** Wählergruppen-Reaktion in der Volksabstimmung (Prozentpunkte, gewichtet) */
  waehler: Record<string, number>;
  /** Langzeit-Effekte auf das Politiknetz, wenn das Paket beschlossen wird */
  effekte: NetzEffekt[];
  /** Verschiebung der Gerichtsbesetzung (nur Justiz-Artikel; wirkt über sim/reich.ts auf justiz_unabhaengigkeit) */
  sitze?: { loyal: number; unabhaengig: number; reform: number };
}

export interface VerfassungsArtikel {
  id: string;
  name: string;
  frage: string;
  varianten: VerfassungsVariante[];
}

/**
 * Der Katalog: fünf Artikel mit je zwei bis drei Varianten (Spielparameter; die Sachverhalte stehen in
 * data/reich/recht.ts und RECHERCHE_VERTIEFUNG_MACHT_KAPITAL.md, Abschnitt 14d).
 */
export const ARTIKEL: VerfassungsArtikel[] = [
  {
    id: "amtszeit",
    name: "Amtszeit und Wiederwahl",
    frage: "Wie lange regiert ein Präsident, und wie oft darf er wieder antreten?",
    varianten: [
      {
        id: "unveraendert",
        name: "Wie bisher",
        text: "Fünf Jahre, eine Wiederwahl — die Amtszeitfrage bleibt unangetastet.",
        statusQuo: true,
        autoritaer: 0,
        parteien: {},
        waehler: {},
        effekte: [],
      },
      {
        id: "wiederwahl_plus",
        name: "Weitere Wiederwahl",
        text: "Eine zusätzliche Wiederwahl wird möglich: Wer das Amt hält, kann ein drittes Mal antreten.",
        autoritaer: 2,
        parteien: { AKP: 2, MHP: 1, YRP: 1, CHP: -2, DEM: -2, "İYİ": -1, "YENİ": -1, Zafer: 0 },
        waehler: { konservative: 2, nationalisten: 1, staedtische_saekulare: -4, junge: -2, minderheiten: -2 },
        effekte: [
          { id: "polarisierung", d: 3 },
          { id: "legitimitaet", d: -2 },
        ],
      },
      {
        id: "neuwahl_jetzt",
        name: "Vorgezogene Neuwahl",
        text: "Mit dem Beschluss wird binnen zwei Monaten neu gewählt: Wer gewinnt, beginnt die Amtszeit von vorn.",
        autoritaer: 0,
        parteien: { CHP: 1, DEM: 1, "İYİ": 1, "YENİ": 1, AKP: -2, MHP: -2, YRP: -1, Zafer: 0 },
        waehler: { staedtische_saekulare: 1, junge: 1 },
        effekte: [{ id: "legitimitaet", d: 1 }],
      },
    ],
  },
  {
    id: "wahlrecht",
    name: "Wahlhürde",
    frage: "Ab wie viel Prozent zieht eine Partei ins Parlament ein?",
    varianten: [
      {
        id: "sieben",
        name: "Sieben Prozent",
        text: "Die Sperrklausel bleibt bei sieben Prozent.",
        statusQuo: true,
        autoritaer: 0,
        parteien: {},
        waehler: {},
        effekte: [],
      },
      {
        id: "fuenf",
        name: "Fünf Prozent",
        text: "Kleinere Parteien kommen leichter hinein: Das Parlament bildet das Land breiter ab.",
        autoritaer: -1,
        parteien: { DEM: 2, CHP: 1, "YENİ": 1, YRP: 1, Zafer: 1, "İYİ": 0, AKP: -1, MHP: -2 },
        waehler: { minderheiten: 4, staedtische_saekulare: 2, junge: 1, nationalisten: -2 },
        effekte: [
          { id: "legitimitaet", d: 2 },
          { id: "polarisierung", d: -2 },
          { id: "minderheiten", d: 2 },
        ],
      },
      {
        id: "zehn",
        name: "Zehn Prozent",
        text: "Die höchste Hürde Europas: Kleine Parteien bleiben draußen, große Lager gewinnen ihre Sitze.",
        autoritaer: 2,
        parteien: { MHP: 2, AKP: 1, Zafer: 1, CHP: -2, DEM: -2, "İYİ": -1, "YENİ": -1, YRP: -1 },
        waehler: { minderheiten: -5, staedtische_saekulare: -2, nationalisten: 2 },
        effekte: [
          { id: "polarisierung", d: 3 },
          { id: "minderheiten", d: -3 },
          { id: "legitimitaet", d: -2 },
        ],
      },
    ],
  },
  {
    id: "justiz",
    name: "Besetzung des Verfassungsgerichts",
    frage: "Wer bestimmt, was Verfassung ist — der Präsident oder das Parlament?",
    varianten: [
      {
        id: "zwoelf_drei",
        name: "Zwölf plus drei",
        text: "Wie bisher: Zwölf Mitglieder ernennt der Präsident, drei wählt das Parlament.",
        statusQuo: true,
        autoritaer: 0,
        parteien: {},
        waehler: {},
        effekte: [],
      },
      {
        id: "acht_sieben",
        name: "Acht plus sieben",
        text: "Acht ernennt der Präsident, sieben wählt das Parlament: Das Gericht wird unabhängiger vom Palast.",
        autoritaer: -1,
        parteien: { CHP: 2, "YENİ": 2, DEM: 1, "İYİ": 1, AKP: -2, MHP: -1, YRP: -1, Zafer: -1 },
        waehler: { staedtische_saekulare: 2, unternehmer: 1, beamte: 1, konservative: -1 },
        effekte: [
          { id: "justiz_unabhaengigkeit", d: 3 },
          { id: "legitimitaet", d: 2 },
        ],
        sitze: { loyal: -4, unabhaengig: 3, reform: 1 },
      },
      {
        id: "parlament_staerkt",
        name: "Parlament wählt die Mehrheit",
        text: "Acht der fünfzehn Mitglieder wählt das Parlament: Die Kontrolle der Kontrolle wandert ins Haus.",
        autoritaer: -2,
        parteien: { CHP: 2, "YENİ": 2, DEM: 2, "İYİ": 1, AKP: -2, MHP: -2, YRP: -2, Zafer: -1 },
        waehler: { staedtische_saekulare: 3, beamte: 1, unternehmer: 1, konservative: -2 },
        effekte: [
          { id: "justiz_unabhaengigkeit", d: 5 },
          { id: "legitimitaet", d: 3 },
          { id: "rechtssicherheit", d: 2 },
        ],
        sitze: { loyal: -6, unabhaengig: 4, reform: 2 },
      },
    ],
  },
  {
    id: "notstand",
    name: "Notstandsartikel",
    frage: "Wie weit reicht die Ausnahme, bevor sie zur Regel wird?",
    varianten: [
      {
        id: "eng",
        name: "Eng begrenzt",
        text: "Ausnahmezustand nur mit Zustimmung des Parlaments und auf vier Monate begrenzt.",
        autoritaer: -1,
        parteien: { CHP: 2, DEM: 2, "YENİ": 1, "İYİ": 1, YRP: 0, AKP: -1, MHP: -2, Zafer: -2 },
        waehler: { staedtische_saekulare: 2, minderheiten: 2, nationalisten: -2, konservative: -1 },
        effekte: [
          { id: "ausnahmerecht", d: -4 },
          { id: "legitimitaet", d: 2 },
          { id: "terrorgefahr", d: 1 },
        ],
      },
      {
        id: "unveraendert",
        name: "Wie bisher",
        text: "Die Notstandsregeln bleiben, wie sie sind.",
        statusQuo: true,
        autoritaer: 0,
        parteien: {},
        waehler: {},
        effekte: [],
      },
      {
        id: "weit",
        name: "Weit gefasst",
        text: "Der Präsident regiert im Ausnahmezustand per Dekret am Parlament vorbei, und die Fristen fallen großzügig aus.",
        autoritaer: 2,
        parteien: { MHP: 2, AKP: 1, Zafer: 1, YRP: 0, "İYİ": -1, CHP: -2, DEM: -2, "YENİ": -2 },
        waehler: { nationalisten: 2, konservative: 1, staedtische_saekulare: -4, minderheiten: -3, junge: -2 },
        effekte: [
          { id: "ausnahmerecht", d: 6 },
          { id: "justiz_unabhaengigkeit", d: -3 },
          { id: "legitimitaet", d: -3 },
          { id: "terrorgefahr", d: -1 },
        ],
      },
    ],
  },
  {
    id: "immunitaet",
    name: "Immunität der Abgeordneten",
    frage: "Schützt das Mandat vor der Staatsanwaltschaft?",
    varianten: [
      {
        id: "unveraendert",
        name: "Wie bisher",
        text: "Abgeordnete bleiben während des Mandats vor Ermittlungen geschützt.",
        statusQuo: true,
        autoritaer: 0,
        parteien: {},
        waehler: {},
        effekte: [],
      },
      {
        id: "aufgehoben",
        name: "Immunität aufgehoben",
        text: "Ermittlungen gegen Abgeordnete werden sofort möglich — gegen Korruption wie gegen kritische Reden.",
        autoritaer: 1,
        parteien: { Zafer: 2, MHP: 1, AKP: 1, "İYİ": 1, YRP: 1, CHP: -1, "YENİ": -1, DEM: -2 },
        waehler: { nationalisten: 2, arme: 1, staedtische_saekulare: -1, minderheiten: -3 },
        effekte: [
          { id: "polarisierung", d: 3 },
          { id: "legitimitaet", d: -2 },
          { id: "korruption", d: -2 },
          { id: "justizvertrauen", d: 1 },
        ],
      },
    ],
  },
];

const ARTIKEL_NACH_ID = new Map(ARTIKEL.map((a) => [a.id, a]));
const VARIANTE_NACH_ID = new Map<string, VerfassungsVariante>(ARTIKEL.flatMap((a) => a.varianten.map((v) => [v.id, v])));

export const artikelDef = (id: string): VerfassungsArtikel | undefined => ARTIKEL_NACH_ID.get(id);
export const varianteDef = (id: string): VerfassungsVariante | undefined => VARIANTE_NACH_ID.get(id);

/** Die Status-quo-Variante eines Artikels. */
export function statusQuoVon(artikelId: string): string {
  const a = ARTIKEL_NACH_ID.get(artikelId);
  return a?.varianten.find((v) => v.statusQuo)?.id ?? a?.varianten[0]?.id ?? "";
}

/** Ein vollständiges Paket: fehlende Artikel werden mit dem Status quo aufgefüllt. */
export function paketVervollstaendigen(paket: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of ARTIKEL) {
    const gewaehlt = paket[a.id];
    out[a.id] = gewaehlt && a.varianten.some((v) => v.id === gewaehlt) ? gewaehlt : statusQuoVon(a.id);
  }
  return out;
}

/** Die Artikel eines Pakets, die vom bisherigen Recht abweichen. */
export function geaenderteArtikel(paket: Record<string, string>): { artikel: VerfassungsArtikel; variante: VerfassungsVariante }[] {
  return ARTIKEL.map((a) => ({ artikel: a, variante: VARIANTE_NACH_ID.get(paket[a.id] ?? "")! })).filter((x) => x.variante && !x.variante.statusQuo);
}

/** Summe der Macht-Richtung eines Pakets: positiv autoritär, negativ demokratisierend. */
export function autoritaerScore(paket: Record<string, string>): number {
  return geaenderteArtikel(paket).reduce((s, x) => s + x.variante.autoritaer, 0);
}

// ---------------------------------------------------------------------------
// Zustand

/** Der Stand der Verfassungsfrage; wird beim ersten Zugriff angelegt (ältere Spielstände haben ihn nicht). */
export function verfassungsZustand(w: World): VerfassungsZustand {
  const spiel = w.spiel;
  if (!spiel) throw new Error("Ohne Spielschleife gibt es keine Verfassungsfrage.");
  return (spiel.verfassungsvorgang ??= { amtszeitBelegt: 0, sperren: {}, aktiv: {}, historie: [] });
}

/** Beschlossene Variante eines Artikels; leer, wenn das bisherige Recht gilt. */
export function verfassungAktiv(w: World, artikelId: string): string | undefined {
  return w.spiel?.verfassungsvorgang?.aktiv[artikelId];
}

/** Ob in dieser Amtszeit schon ein Verfassungsvorgang lief (harte Regel: einer je Amtszeit). */
export function amtszeitBelegt(w: World): boolean {
  const spiel = w.spiel;
  if (!spiel) return false;
  return (spiel.verfassungsvorgang?.amtszeitBelegt ?? 0) === spiel.amtszeit;
}

/** Bis wann ein Artikel nach einem Scheitern gesperrt ist; 0 = frei. */
export function artikelSperre(w: World, artikelId: string): number {
  const bis = w.spiel?.verfassungsvorgang?.sperren[artikelId] ?? 0;
  return bis > w.day ? bis : 0;
}

// ---------------------------------------------------------------------------
// Stimmen-Prognose (Richtung und Bandbreite — die Mentorin erklärt die Rechnung, keine Scheingenauigkeit)

export interface PaketStimmen {
  /** Erwartete Ja-Stimmen einschließlich Absprachen */
  erwartet: number;
  tief: number;
  hoch: number;
  /** Sitze des Regierungslagers (stimmen geschlossen) */
  lager: number;
  /** Ja-Stimmen duldender Fraktionen */
  duldung: number;
  /** Rechnung je Oppositionsfraktion */
  fraktionen: { partei: string; sitze: number; quote: number; ja: number }[];
  /** Fehlende Stimmen bis zur Hürde 301 (erwartet) */
  lueckeMehrheit: number;
  /** Fehlende Stimmen bis zur Direkt-Hürde 360 (erwartet) */
  lueckeDirekt: number;
}

/**
 * Wie das Parlament zu einem Paket stünde: Das Lager stimmt geschlossen, duldende Fraktionen wie bei
 * Gesetzen, die übrigen Fraktionen nach ihren Präferenzen für die enthaltenen Artikel und nach der
 * Beliebtheit des Präsidenten im Land.
 */
export function paketStimmen(w: World, paket: Record<string, string>, absprachen = 0): PaketStimmen {
  const parl = w.parliament;
  const spiel = w.spiel;
  if (!parl || !spiel) return { erwartet: 600, tief: 590, hoch: 600, lager: 600, duldung: 0, fraktionen: [], lueckeMehrheit: 0, lueckeDirekt: 0 };
  const eigene = w.player?.partei.kurz ?? "";
  const lagerParteien = [eigene, ...spiel.lager];
  const lager = lagerParteien.reduce((s, p) => s + (parl.seats[p] ?? 0), 0);
  const dul = duldung(w);
  const geaendert = geaenderteArtikel(paket);
  const zustimmung = spiel.umfrage.zustimmung;
  const beliebtheit = (zustimmung - 45) / 100;
  const fraktionen: PaketStimmen["fraktionen"] = [];
  for (const [partei, sitze] of Object.entries(parl.seats)) {
    if (lagerParteien.includes(partei) || dul.parteien.includes(partei) || sitze <= 0) continue;
    // Präferenz: Mittel über die geänderten Artikel; wer nichts zum Thema sagt, misstraut dem Vorgang leicht
    const praef = geaendert.length ? geaendert.reduce((s, x) => s + (x.variante.parteien[partei] ?? -0.5), 0) / geaendert.length : 0;
    const quote = clamp(0.28 + 0.16 * praef + 0.35 * beliebtheit, 0.02, 0.92);
    fraktionen.push({ partei, sitze, quote, ja: Math.round(sitze * quote) });
  }
  const opJa = fraktionen.reduce((s, f) => s + f.ja, 0);
  const erwartet = Math.min(600, lager + dul.ja + opJa + absprachen);
  // Wie bei den Gesetzen: Angespanntheit des Präsidenten verbreitert die Schätzung
  const band = Math.round((10 + geaendert.length * 2) * unsicherheitFaktor(w));
  return {
    erwartet,
    tief: Math.max(0, erwartet - band),
    hoch: Math.min(600, erwartet + band),
    lager,
    duldung: dul.ja,
    fraktionen,
    lueckeMehrheit: Math.max(0, VERFASSUNG_REGELN.mehrheit - erwartet),
    lueckeDirekt: Math.max(0, VERFASSUNG_REGELN.direkt - erwartet),
  };
}

// ---------------------------------------------------------------------------
// Prüfen und Einbringen

export interface VerfassungPruefung {
  ok: boolean;
  grund?: string;
  pk: number;
  geaendert: number;
  stimmen: PaketStimmen;
  autoritaer: number;
  hinweise: string[];
}

export function pruefeVerfassung(w: World, paketRoh: Record<string, string>): VerfassungPruefung {
  const paket = paketVervollstaendigen(paketRoh);
  const geaendert = geaenderteArtikel(paket);
  const pk = VERFASSUNG_REGELN.pkBasis + VERFASSUNG_REGELN.pkJeArtikel * geaendert.length;
  const stimmen = paketStimmen(w, paket);
  const aut = autoritaerScore(paket);
  const hinweise: string[] = [];
  if (stimmen.erwartet >= VERFASSUNG_REGELN.direkt) hinweise.push(`Ab ${VERFASSUNG_REGELN.direkt} Stimmen wird das Paket direkt Gesetz — keine Volksabstimmung nötig.`);
  else if (stimmen.erwartet >= VERFASSUNG_REGELN.mehrheit) hinweise.push(`Zwischen ${VERFASSUNG_REGELN.mehrheit} und ${VERFASSUNG_REGELN.direkt - 1} Stimmen entscheidet das Volk in einer Volksabstimmung.`);
  else hinweise.push(`Unter ${VERFASSUNG_REGELN.mehrheit} Stimmen scheitert das Paket, und ein Teil des Kapitals ist verbrannt.`);
  if (aut >= 2) hinweise.push("Das Paket zieht die Macht zum Palast: Proteste, Straßburg, die EU und die Märkte werden reagieren.");
  if (aut <= -2) hinweise.push("Das Paket gibt Kontrolle ab: Es stärkt die Legitimität, kostet aber laufend etwas Politisches Kapital — wer weniger zwingen kann, muss mehr überzeugen.");
  const aym = aymSicht(w, paket);
  hinweise.push(
    `Verfassungsgericht: Die Chance, dass es ein angefochtenes Paket kassiert, liegt nach seinem jetzigen Besetzungsstand eher ${aym.pKassation < 0.12 ? "niedrig" : aym.pKassation < 0.25 ? "im mittleren Bereich" : "hoch"}.`,
  );
  const base: VerfassungPruefung = { ok: true, pk, geaendert: geaendert.length, stimmen, autoritaer: aut, hinweise };
  const spiel = w.spiel;
  if (!spiel) return { ...base, ok: false, grund: "Ohne Amtsantritt gibt es keine Verfassungsfrage." };
  if (spiel.ende) return { ...base, ok: false, grund: "Die Amtszeit ist beendet." };
  if (!geaendert.length) return { ...base, ok: false, grund: "Das Paket ändert nichts: Wählen Sie mindestens einen Artikel, der vom bisherigen Recht abweicht." };
  const pause = neuanfangGrund(w);
  if (pause) return { ...base, ok: false, grund: pause };
  const z = verfassungsZustand(w);
  if (z.laufend) return { ...base, ok: false, grund: "Es läuft bereits ein Verfassungsvorgang; erst sein Abschluss macht den Weg frei." };
  if (amtszeitBelegt(w)) {
    return {
      ...base,
      ok: false,
      grund: "Eine Verfassungsfrage je Amtszeit: Diese Amtszeit hatte ihre Debatte über die Spielregeln schon. Wer sie ständig neu verhandelt, entwertet alle Regeln — das trägt das Land nicht.",
    };
  }
  const gesperrt = geaendert.filter((x) => artikelSperre(w, x.artikel.id) > 0);
  if (gesperrt.length) {
    const rest = Math.max(...gesperrt.map((x) => artikelSperre(w, x.artikel.id) - w.day));
    return { ...base, ok: false, grund: `Nach dem Scheitern des letzten Pakets ist ${gesperrt.map((x) => `„${x.artikel.name}“`).join(", ")} noch ${rest} Tage gesperrt; zwölf Monate trägt das Land dieselbe Frage nicht zweimal.` };
  }
  if (!kannZahlen(spiel.kapital, pk)) return { ...base, ok: false, grund: `Für dieses Paket fehlt Politisches Kapital (nötig ${pk}, vorhanden ${Math.floor(spiel.kapital)}).` };
  return base;
}

/** Das Paket einbringen: Kapital und Aufmerksamkeit fließen, die Abstimmung ist terminiert. */
export function bringeVerfassungEin(w: World, paketRoh: Record<string, string>): Ergebnis {
  const pr = pruefeVerfassung(w, paketRoh);
  if (!pr.ok) return { ok: false, text: pr.grund ?? "Nicht möglich." };
  const spiel = w.spiel!;
  const z = verfassungsZustand(w);
  const paket = paketVervollstaendigen(paketRoh);
  spiel.kapital -= pr.pk;
  verbrauche(w, AUFMERKSAMKEIT_KOSTEN.verfassungPaket, "Verfassungspaket");
  const vorgang: VerfassungsVorgang = {
    id: `vf-${w.day}`,
    paket,
    phase: "parlament",
    eingebracht: w.day,
    abstimmung: w.day + VERFASSUNG_REGELN.tageBisAbstimmung,
    absprachen: 0,
    pk: pr.pk,
  };
  z.laufend = vorgang;
  z.amtszeitBelegt = spiel.amtszeit;
  const namen = geaenderteArtikel(paket).map((x) => `„${x.artikel.name}: ${x.variante.name}“`).join(", ");
  const datum = formatDateDe(addDays(w.date, VERFASSUNG_REGELN.tageBisAbstimmung));
  const text = `Verfassungspaket eingebracht: ${namen}. Das Parlament stimmt am ${datum} ab.`;
  const why = `${pr.pk} Kapital gezahlt. Erwartet werden ${pr.stimmen.erwartet} Ja-Stimmen (Spanne ${pr.stimmen.tief} bis ${pr.stimmen.hoch}): Ab ${VERFASSUNG_REGELN.direkt} wird es direkt Gesetz, ab ${VERFASSUNG_REGELN.mehrheit} entscheidet eine Volksabstimmung, darunter scheitert es. Eine Verfassungsfrage je Amtszeit — diese ist es.`;
  addLog(w, "entscheidung", text, why);
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: "Verfassungspaket eingebracht", ausgang: namen });
  return { ok: true, text, why };
}

/** Das Paket vor der Abstimmung zurückziehen: ein Teil des Kapitals kommt zurück, gekaufte Stimmen sind verloren. */
export function zieheVerfassungZurueck(w: World): Ergebnis {
  const spiel = w.spiel;
  const z = spiel ? verfassungsZustand(w) : undefined;
  const v = z?.laufend;
  if (!spiel || !z || !v || v.phase !== "parlament") return { ok: false, text: "Es liegt kein Paket mehr zur Abstimmung vor." };
  const zurueck = Math.floor(v.pk * VERFASSUNG_REGELN.rueckzugAnteil);
  spiel.kapital = Math.min(REGELN.kapitalMax, spiel.kapital + zurueck);
  z.historie.push({ tag: w.day, datum: w.date, ausgang: "Vor der Abstimmung zurückgezogen", artikel: geaenderteArtikel(v.paket).map((x) => x.artikel.name) });
  delete z.laufend;
  // Freiwillig zurückgezogene Pakete sperren keine Artikel; die Amtszeit gilt gleichwohl als belegt
  const text = "Das Verfassungspaket wird zurückgezogen.";
  const why = `${zurueck} von ${v.pk} Kapital kommen zurück, die Absprachen sind verloren. Die Amtszeit hat ihre Verfassungsdebatte damit hinter sich.`;
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Stimmen für das Paket kaufen: dieselbe Absprachen-Logik wie bei Gesetzen, nur doppelt so teuer. */
export function verfassungStimmenKaufen(w: World, anzahl: number): Ergebnis {
  const spiel = w.spiel;
  const v = spiel ? verfassungsZustand(w).laufend : undefined;
  if (!spiel || !v || v.phase !== "parlament") return { ok: false, text: "Es liegt kein Paket mehr zur Abstimmung vor." };
  const n = Math.max(1, Math.round(anzahl));
  const kosten = Math.ceil(n * REGELN.kaufKostenProStimme * VERFASSUNG_REGELN.kaufFaktor);
  if (!kannZahlen(spiel.kapital, kosten)) return { ok: false, text: `Für ${n} Stimmen fehlt Politisches Kapital (nötig ${kosten}, vorhanden ${Math.floor(spiel.kapital)}).` };
  spiel.kapital -= kosten;
  v.absprachen += n;
  const text = `${n} Stimmen für das Verfassungspaket gesichert.`;
  const why = `Kostet ${kosten} Kapital — bei der Verfassungsfrage verlangen die Fraktionen das Doppelte wie bei Gesetzen, weil jede Stimme die Spielregeln selbst betrifft.`;
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

// ---------------------------------------------------------------------------
// Parlament: die Abstimmung

export interface AbstimmungsErgebnis {
  ja: number;
  weg: "direkt" | "referendum" | "gescheitert";
  angefochten: boolean;
  text: string;
}

/** Die Abstimmung über das Paket: Hürden, danach die Frage der Anfechtung. */
export function verfassungAbstimmen(w: World, rng: Rng): AbstimmungsErgebnis {
  const spiel = w.spiel!;
  const z = verfassungsZustand(w);
  const v = z.laufend;
  // Das Ereignis kann einen bereits abgeschlossenen Vorgang überholt haben: dann ist die Abstimmung hinfällig
  if (!v) return { ja: 0, weg: "gescheitert", angefochten: false, text: "Der Vorgang ist bereits abgeschlossen; die Abstimmung entfällt." };
  const sicht = paketStimmen(w, v.paket, v.absprachen);
  const ja = Math.min(600, Math.max(0, sicht.erwartet + Math.round(rng.normal(6))));
  v.ja = ja;
  const nein = 600 - ja;

  if (ja < VERFASSUNG_REGELN.mehrheit) {
    // Gescheitert: Kapital teilweise verbrannt, Vertrauen sinkt, die Artikel sind zwölf Monate gesperrt
    const zurueck = Math.floor(v.pk * VERFASSUNG_REGELN.scheiternZurueck);
    spiel.kapital = Math.min(REGELN.kapitalMax, spiel.kapital + zurueck);
    vertrauenAendern(w, -2);
    spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - 1.5);
    for (const x of geaenderteArtikel(v.paket)) z.sperren[x.artikel.id] = w.day + VERFASSUNG_REGELN.sperrTage;
    z.historie.push({ tag: w.day, datum: w.date, ausgang: `Im Parlament gescheitert (${ja} zu ${nein})`, artikel: geaenderteArtikel(v.paket).map((x) => x.artikel.name) });
    delete z.laufend;
    const text = `Das Parlament lehnt das Verfassungspaket ab (${ja} zu ${nein}). Es fehlten ${VERFASSUNG_REGELN.mehrheit - ja} Stimmen zur ersten Hürde.`;
    addLog(
      w,
      "entscheidung",
      text,
      `Von ${v.pk} Kapital sind ${v.pk - zurueck} verbrannt; die betroffenen Artikel sind zwölf Monate gesperrt. Wer die Spielregeln ändern will und scheitert, verliert im Land an Vertrauen.`,
    );
    spiel.chronik.push({ tag: w.day, datum: w.date, titel: "Verfassungspaket gescheitert", ausgang: `${ja} zu ${nein}: Die Hürde von ${VERFASSUNG_REGELN.mehrheit} blieb unerreicht.` });
    return { ja, weg: "gescheitert", angefochten: false, text };
  }

  const weg: AbstimmungsErgebnis["weg"] = ja >= VERFASSUNG_REGELN.direkt ? "direkt" : "referendum";
  // Die Opposition prüft die Anfechtung: eher bei autoritären Paketen, eher wenn sie stark ist, eher bei Polarisierung
  const aut = autoritaerScore(v.paket);
  const oppSitze = 600 - sicht.lager;
  const polar = nationalAverage(NET, w.net, "polarisierung") / 100;
  const pAnfechtung = clamp(0.3 + 0.12 * Math.max(0, aut) - (aut < 0 ? 0.15 : 0) + (oppSitze >= 200 ? 0.15 : 0) + 0.2 * polar - 0.25, 0.05, 0.9);
  const angefochten = rng.next() < pAnfechtung;
  v.aymAngefochten = angefochten;
  const wegText =
    weg === "direkt"
      ? `Mit ${ja} zu ${nein} überspringt das Paket die Hürde von ${VERFASSUNG_REGELN.direkt}: Es braucht keine Volksabstimmung.`
      : `Mit ${ja} zu ${nein} liegt das Paket zwischen ${VERFASSUNG_REGELN.mehrheit} und ${VERFASSUNG_REGELN.direkt - 1}: Das Volk wird entscheiden.`;
  if (angefochten) {
    v.phase = "aym";
    v.aymTag = w.day + VERFASSUNG_REGELN.aymTage;
    addLog(w, "ereignis", `${wegText} Die Opposition zieht vor das Verfassungsgericht; die Entscheidung wird in ${VERFASSUNG_REGELN.aymTage} Tagen erwartet.`, "Wer im Parlament verliert, versucht es über die Kontrollinstanz — je nach Besetzung des Gerichts mit Aussicht.");
  } else {
    addLog(w, "ereignis", `${wegText} Die Opposition verzichtet auf eine Anfechtung.`, "Ohne Gang vor das Verfassungsgericht geht es direkt weiter.");
    weiterNachAym(w, rng);
  }
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: "Verfassungspaket im Parlament angenommen", ausgang: `${ja} zu ${nein}${angefochten ? "; die Opposition fechtet an" : ""}` });
  return { ja, weg, angefochten, text: `${wegText}${angefochten ? " Die Opposition zieht vor das Verfassungsgericht." : ""}` };
}

/** Nach der Parlamentsphase (mit oder ohne Gericht): weiter zum Beschluss oder in die Kampagne. */
function weiterNachAym(w: World, rng: Rng): void {
  const z = verfassungsZustand(w);
  const v = z.laufend!;
  if ((v.ja ?? 0) >= VERFASSUNG_REGELN.direkt) {
    beschliessePaket(w, rng);
    return;
  }
  v.phase = "kampagne";
  v.referendumTag = w.day + VERFASSUNG_REGELN.kampagnenTage;
  const datum = formatDateDe(addDays(w.date, VERFASSUNG_REGELN.kampagnenTage));
  addLog(
    w,
    "ereignis",
    `Die Kampagne zur Volksabstimmung beginnt; gewählt wird am ${datum}.`,
    "Die Zustimmung zum Präsidenten trägt das Ja-Lager, die Artikel ziehen ihre Wählergruppen je Richtung — und Kapital in der Kampagne verschiebt die Mitte.",
  );
}

// ---------------------------------------------------------------------------
// Verfassungsgericht (AYM): Kontrollinstanz mit echter Wahrscheinlichkeit aus dem Sitze-Stand

export interface AymSicht {
  sitze: { loyal: number; unabhaengig: number; reform: number };
  /** Wahrscheinlichkeit, dass das Gericht ein angefochtenes Paket kassiert */
  pKassation: number;
}

/** Wie das Gericht zu diesem Paket stünde: Je unabhängiger und reformorientierter die Mehrheit, desto eher kassiert es — autoritäre Pakete eher als demokratisierende. */
export function aymSicht(w: World, paket: Record<string, string>): AymSicht {
  const sitze = w.spiel?.reich?.sitze.aym ?? { loyal: 9, unabhaengig: 3, reform: 3 };
  const n = Math.max(1, sitze.loyal + sitze.unabhaengig + sitze.reform);
  const aut = autoritaerScore(paket);
  const gewicht = (sitze.unabhaengig * 0.5 + sitze.reform * 0.8) / n;
  const pKassation = clamp(gewicht * (0.3 + 0.15 * Math.max(0, aut)) + 0.04, 0.02, 0.85);
  return { sitze, pKassation };
}

/** Das Gericht entscheidet: Kassation beendet das Paket mit Groll, Annahme gibt den Weg frei. */
export function aymEntscheiden(w: World, rng: Rng): { kassiert: boolean; text: string } {
  const spiel = w.spiel!;
  const z = verfassungsZustand(w);
  const v = z.laufend;
  if (!v) return { kassiert: false, text: "Der Vorgang ist bereits abgeschlossen; das Verfahren wird eingestellt." };
  const sicht = aymSicht(w, v.paket);
  const kassiert = rng.next() < sicht.pKassation;
  if (kassiert) {
    for (const x of geaenderteArtikel(v.paket)) z.sperren[x.artikel.id] = w.day + VERFASSUNG_REGELN.sperrTage;
    z.historie.push({ tag: w.day, datum: w.date, ausgang: "Vom Verfassungsgericht kassiert", artikel: geaenderteArtikel(v.paket).map((x) => x.artikel.name) });
    delete z.laufend;
    wirke(w, "polarisierung", 2);
    vertrauenAendern(w, -1.5);
    spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - 1);
    const text = "Das Verfassungsgericht kassiert das Paket: zentrale Artikel verletzten die Verfassung. Das eingesetzte Kapital ist verloren.";
    addLog(
      w,
      "ereignis",
      text,
      "Die Richter entscheiden nach ihrem Stand: Unabhängige und Reformorientierte trugen die Kassation. Der Groll im Lager ist groß, die Polarisierung wächst, und die Artikel sind zwölf Monate gesperrt.",
    );
    spiel.chronik.push({ tag: w.day, datum: w.date, titel: "Verfassungsgericht kassiert das Paket", ausgang: "Die Kontrollinstanz hält die Regierung an die Regeln." });
    return { kassiert, text };
  }
  addLog(w, "ereignis", "Das Verfassungsgericht lässt das Paket zu.", "Die Mehrheit der Richter sieht keinen Verfassungsverstoß; der Weg ist frei.");
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: "Verfassungsgericht lässt das Paket zu", ausgang: "Die Anfechtung der Opposition scheitert." });
  weiterNachAym(w, rng);
  return { kassiert, text: "Das Verfassungsgericht lässt das Paket zu; der Weg ist frei." };
}

// ---------------------------------------------------------------------------
// Referendum als Mini-Wahl

export interface ReferendumPrognose {
  /** Erwarteter Ja-Anteil in Prozent */
  mitte: number;
  tief: number;
  hoch: number;
  /** Bestandteile: Zustimmung, Themen-Salienz der Artikel, Kampagnen-Wirkung */
  zustimmung: number;
  salienz: number;
  kampagne: number;
  /** Reaktion je Wählergruppe über alle Artikel (gewichtet) */
  gruppen: { id: string; beitrag: number }[];
}

/** Wählergruppen-Salienz eines Pakets: gewichtete Summe der Reaktionen über die geänderten Artikel (Prozentpunkte). */
export function paketSalienz(paket: Record<string, string>): { summe: number; gruppen: { id: string; beitrag: number }[] } {
  const gruppen = GRUPPEN.map((g) => {
    const beitrag = geaenderteArtikel(paket).reduce((s, x) => s + (x.variante.waehler[g.id] ?? 0), 0);
    return { id: g.id, beitrag: (g.gewicht * beitrag) / GRUPPEN_SUMME };
  });
  return { summe: gruppen.reduce((s, g) => s + g.beitrag, 0), gruppen };
}

/**
 * Die Lage vor der Volksabstimmung: Die Zustimmung zum Präsidenten trägt das Ja-Lager (vereinfachte
 * Wahl-Mechanik), die Artikel verschieben sie über ihre Wählergruppen, die Kampagne über ihr Kapital.
 */
export function referendumPrognose(w: World): ReferendumPrognose | null {
  const spiel = w.spiel;
  const v = spiel?.verfassungsvorgang?.laufend;
  if (!spiel || !v) return null;
  const salienz = paketSalienz(v.paket);
  const kampagne = Math.min(VERFASSUNG_REGELN.kampagneMax, Math.sqrt(Math.max(0, v.kampagnenPk ?? 0)) * VERFASSUNG_REGELN.kampagneFaktor);
  const mitte = clamp(spiel.umfrage.zustimmung + salienz.summe + kampagne, 5, 95);
  const band = 4 * unsicherheitFaktor(w);
  return {
    mitte,
    tief: clamp(mitte - band, 0, 100),
    hoch: clamp(mitte + band, 0, 100),
    zustimmung: spiel.umfrage.zustimmung,
    salienz: salienz.summe,
    kampagne,
    gruppen: salienz.gruppen,
  };
}

/** Kapital in die Kampagne: verschiebt die Mitte, mit abnehmendem Ertrag und Abkühlzeit. */
export function kampagnenImpuls(w: World): Ergebnis {
  const spiel = w.spiel;
  const v = spiel ? verfassungsZustand(w).laufend : undefined;
  if (!spiel || !v || v.phase !== "kampagne") return { ok: false, text: "Es läuft gerade keine Kampagne zu einer Volksabstimmung." };
  const rest = (v.kampagneZuletzt ?? -1e9) + VERFASSUNG_REGELN.kampagneAbkuehlung - w.day;
  if (rest > 0) return { ok: false, text: `Der Wahlkampf braucht Abstand: der nächste Impuls ist in ${rest} ${rest === 1 ? "Tag" : "Tagen"} sinnvoll.` };
  if (!kannZahlen(spiel.kapital, VERFASSUNG_REGELN.kampagnePk)) return { ok: false, text: `Dafür fehlt Politisches Kapital (nötig ${VERFASSUNG_REGELN.kampagnePk}, vorhanden ${Math.floor(spiel.kapital)}).` };
  spiel.kapital -= VERFASSUNG_REGELN.kampagnePk;
  v.kampagnenPk = (v.kampagnenPk ?? 0) + VERFASSUNG_REGELN.kampagnePk;
  v.kampagneZuletzt = w.day;
  verbrauche(w, AUFMERKSAMKEIT_KOSTEN.verfassungKampagne, "Referendum-Kampagne");
  const pr = referendumPrognose(w)!;
  const text = `Kampagnen-Impuls: Auftritte, Plakate, Reisen ins Land. Erwarteter Ja-Anteil nun etwa ${fmt(pr.mitte)} Prozent.`;
  const why = `${VERFASSUNG_REGELN.kampagnePk} Kapital; die Wirkung jeder weiteren Welle nimmt ab. Zustimmung, Artikel und Kampagne zusammen tragen das Ja-Lager.`;
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Wahlabend der Volksabstimmung: die Auszählung mit derselben Streuung wie die Präsidentschaftswahl. */
export function referendumAuszaehlen(w: World, rng: Rng): { ja: boolean; anteil: number; text: string } {
  const spiel = w.spiel!;
  const z = verfassungsZustand(w);
  const v = z.laufend;
  if (!v) return { ja: false, anteil: 0, text: "Der Vorgang ist bereits abgeschlossen; die Abstimmung entfällt." };
  const pr = referendumPrognose(w)!;
  const anteil = clamp(pr.mitte + rng.normal(VERFASSUNG_REGELN.referendumStreuung), 0, 100);
  if (anteil >= 50) {
    const text = `Referendum-Nacht: ${fmt(anteil)} Prozent stimmen Ja. Das Paket ist beschlossen.`;
    addLog(w, "ereignis", text, "Das Volk hat die Verfassungsänderung getragen; die Artikel treten in Kraft.");
    beschliessePaket(w, rng);
    return { ja: true, anteil, text };
  }
  // Nein: schwerer Vertrauensverlust, gestärkte Opposition, Sperrfristen
  z.historie.push({ tag: w.day, datum: w.date, ausgang: `Im Referendum abgelehnt (${fmt(anteil)} Prozent Ja)`, artikel: geaenderteArtikel(v.paket).map((x) => x.artikel.name) });
  for (const x of geaenderteArtikel(v.paket)) z.sperren[x.artikel.id] = w.day + VERFASSUNG_REGELN.sperrTage;
  delete z.laufend;
  vertrauenAendern(w, -4);
  spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - 3);
  wirke(w, "polarisierung", 2);
  for (const [partei, sitze] of Object.entries(w.parliament?.seats ?? {})) {
    if (partei === w.player?.partei.kurz || spiel.lager.includes(partei) || !sitze) continue;
    bereitschaftAendern(w, partei, -10);
  }
  const text = `Referendum-Nacht: Nur ${fmt(anteil)} Prozent stimmen Ja. Das Volk lehnt das Paket ab.`;
  addLog(
    w,
    "ereignis",
    text,
    "Eine verlorene Volksabstimmung ist ein Urteil über die Regierung selbst: Das Vertrauen fällt schwer, die Opposition geht gestärkt aus der Nacht, und die Artikel sind zwölf Monate gesperrt.",
  );
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: "Referendum verloren", ausgang: `${fmt(anteil)} Prozent Ja — das Paket ist tot, die Opposition triumphiert.` });
  spiel.hinweise.push({
    id: `referendum-nein-${w.day}`,
    titel: "Referendum-Nacht: Das Nein",
    szene: "wahlnacht",
    text: [`${fmt(anteil)} Prozent Ja reichen nicht: Das Volk lehnt das Verfassungspaket ab.`, "Die Opposition feiert auf den Plätzen; die Regierung verliert schwer an Vertrauen. Zwölf Monate lang trägt das Land dieselbe Frage nicht noch einmal."],
  });
  return { ja: false, anteil, text };
}

// ---------------------------------------------------------------------------
// Beschluss: Langzeit-Effekte, Währungs-Ersatz und Gegenreaktion

/** Kapital-Abzug demokratisierender Verfassungsänderungen (Spielparameter): Wer Kontrolle abgibt, regiert mit weniger Druckmitteln. */
export function verfassungKapitalAbzug(w: World): number {
  const aktiv = w.spiel?.verfassungsvorgang?.aktiv ?? {};
  let summe = 0;
  for (const varianteId of Object.values(aktiv)) {
    const v = VARIANTE_NACH_ID.get(varianteId);
    if (v && v.autoritaer < 0) summe += 0.2 * -v.autoritaer;
  }
  return Math.min(1.5, summe);
}

/** Das Paket tritt in Kraft: Artikel-Effekte ins Netz, Sonderwirkungen, Gegenreaktion je Richtung. */
function beschliessePaket(w: World, rng: Rng): void {
  const spiel = w.spiel!;
  const z = verfassungsZustand(w);
  const v = z.laufend!;
  const geaendert = geaenderteArtikel(v.paket);
  const aut = autoritaerScore(v.paket);

  // 1. Artikel in Kraft: beschlossene Varianten und ihre Langzeit-Effekte
  for (const x of geaendert) {
    z.aktiv[x.artikel.id] = x.variante.id;
    for (const e of x.variante.effekte) wirke(w, e.id, e.d);
    // Justiz-Artikel verschiebt die Besetzung des Gerichts (wirkt über sim/reich.ts auf die Unabhängigkeit)
    if (x.variante.sitze) {
      const reich = reichZustand(w);
      const sitze = (reich.sitze.aym ??= { loyal: 9, unabhaengig: 3, reform: 3 });
      sitze.loyal = Math.max(0, sitze.loyal + x.variante.sitze.loyal);
      sitze.unabhaengig = Math.max(0, sitze.unabhaengig + x.variante.sitze.unabhaengig);
      sitze.reform = Math.max(0, sitze.reform + x.variante.sitze.reform);
    }
  }
  // Sonderwirkung: vorgezogene Neuwahl stellt den Wahltermin
  if (z.aktiv.amtszeit === "neuwahl_jetzt") {
    spiel.wahltag = Math.min(spiel.wahltag, w.day + 60);
    addLog(w, "ereignis", `Der Wahltermin rückt vor: In etwa zwei Monaten wird gewählt.`, "Wer die Amtszeit neu stellt, stellt sich dem Urteil — gewinnen heißt von vorn beginnen, verlieren heißt gehen.");
  }

  // 2. Gegenreaktion: autoritäre Pakete rufen Straße, Straßburg, EU und Märkte auf den Plan
  if (aut >= 2) {
    oeffneVerfassungsEreignis(w, "verfassung_proteste", rng);
    wirke(w, "strassburg_druck", 4);
    wirke(w, "ansehen", -2);
    landAendern(w, "EU", { vertrauen: -4 }, "Verfassungspaket zugunsten des Palasts");
    wirke(w, "vertrauen_maerkte", -3);
    w.economy.riskPremium = clamp(w.economy.riskPremium + 40, 50, 2000);
  } else if (aut <= -2) {
    // Demokratisierende Pakete: Legitimität und Ansehen wachsen; das laufende Kapital-Konto trägt den Verzicht
    wirke(w, "legitimitaet", 2);
    wirke(w, "ansehen", 2);
    landAendern(w, "EU", { vertrauen: 3 }, "Verfassung stärkt die Kontrolle der Gewalt");
  }

  z.historie.push({ tag: w.day, datum: w.date, ausgang: "Beschlossen und in Kraft", artikel: geaendert.map((x) => `${x.artikel.name}: ${x.variante.name}`) });
  delete z.laufend;
  const namen = geaendert.map((x) => `„${x.artikel.name}: ${x.variante.name}“`).join(", ");
  addLog(
    w,
    "entscheidung",
    `Die Verfassungsänderung tritt in Kraft: ${namen}.`,
    aut >= 2
      ? "Die Macht rückt zusammen — und die Antwort kommt: Proteste, Straßburg, die EU und die Märkte lesen das Paket als Richtungsentscheidung."
      : aut <= -2
        ? "Die Kontrolle wird stärker: Legitimität und Ansehen wachsen, aber wer weniger zwingen kann, regiert mit weniger Politischem Kapital im Monat."
        : "Die Spielregeln des Landes stehen jetzt anders — jede Folge wirkt über Jahre.",
  );
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: "Verfassungsänderung in Kraft", ausgang: namen });
  spiel.hinweise.push({
    id: `verfassung-kraft-${w.day}`,
    titel: "Verfassungsänderung in Kraft",
    szene: "parlament",
    text: [`Das Paket ist Verfassungsrecht: ${namen}.`, aut >= 2 ? "Die Straße, Straßburg und die Märkte antworten bereits; die Opposition wird das nicht vergessen." : "Das Land regiert ab heute nach anderen Regeln."],
  });
}

// ---------------------------------------------------------------------------
// Vorgangs-Ereignisse (Auto-Stopp A über den Ereignismotor)

/** Der Ereignismotor meldet seinen Öffner hier an (ereignisse.ts), damit dieser Kern ohne Importzyklus bleibt. */
let oeffner: ((w: World, vorlageId: string, rng: Rng) => void) | null = null;
export function setzeVerfassungsOeffner(fn: (w: World, vorlageId: string, rng: Rng) => void): void {
  oeffner = fn;
}

function oeffneVerfassungsEreignis(w: World, vorlageId: string, rng: Rng): void {
  oeffner?.(w, vorlageId, rng);
}

/** Für welche Phase wartet der Vorgang auf das Entscheidungs-Ereignis? */
const PHASE_EREIGNIS: Record<string, string> = { parlament: "verfassung_abstimmung", aym: "verfassung_aym", kampagne: "verfassung_referendum" };

/** Täglich aus der Spielschleife: terminierte Stufen des Vorgangs öffnen ihr Entscheidungs-Ereignis. */
export function verfassungsVorgangTag(w: World, rng: Rng): void {
  const spiel = w.spiel;
  const z = spiel?.verfassungsvorgang;
  const v = z?.laufend;
  if (!spiel || !z || !v || spiel.ende) return;
  const frist =
    v.phase === "parlament" ? v.abstimmung : v.phase === "aym" ? (v.aymTag ?? w.day) : v.phase === "kampagne" ? (v.referendumTag ?? w.day) : Infinity;
  if (w.day < frist) return;
  if (v.phaseGeoeffnet === v.phase) return;
  v.phaseGeoeffnet = v.phase;
  oeffneVerfassungsEreignis(w, PHASE_EREIGNIS[v.phase]!, rng);
}

/** Kompakter Stand für Oberfläche und Befehlszeile. */
export function verfassungStand(w: World): { zeile: string; fristIn?: number; phase?: string } {
  const spiel = w.spiel;
  const z = spiel?.verfassungsvorgang;
  const v = z?.laufend;
  if (!spiel || !z || !v) {
    if (amtszeitBelegt(w)) return { zeile: "Diese Amtszeit hat ihre Verfassungsdebatte hinter sich." };
    const aktiv = Object.keys(z?.aktiv ?? {}).length;
    return { zeile: aktiv ? "Kein laufender Vorgang; die zuletzt beschlossenen Artikel wirken weiter." : "Kein laufender Vorgang; die Werkstatt im Parlament schnürt ein Paket." };
  }
  const frist = v.phase === "parlament" ? v.abstimmung : v.phase === "aym" ? (v.aymTag ?? w.day) : (v.referendumTag ?? w.day);
  const phase = v.phase === "parlament" ? "vor der Parlamentsabstimmung" : v.phase === "aym" ? "beim Verfassungsgericht" : "in der Referendum-Kampagne";
  return { zeile: `Das Paket liegt ${phase}; der nächste Schritt ist in ${Math.max(0, frist - w.day)} Tagen.`, fristIn: Math.max(0, frist - w.day), phase: v.phase };
}
