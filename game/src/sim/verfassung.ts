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

import { marktSchock } from "./maerkte";
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
import { AEMTER, eigenVon, loyalitaetVerschieben } from "./personen";
import { landAendern } from "./laender";
import { kannZahlen } from "./kapital";
import { AUFMERKSAMKEIT_KOSTEN, neuanfangGrund, unsicherheitFaktor, verbrauche } from "./aufmerksamkeit";
import type { Rng } from "./rng";
import type { World } from "./types";
import type { Ergebnis } from "./handeln";
import type { VerfassungsVorgang, VerfassungsZustand } from "./spiel-typen";
import { t } from "../i18n";

// ---------------------------------------------------------------------------
// Spielparameter des Vorgangs

export const VERFASSUNG_REGELN = {
  /**
   * Hürden der Parlamentsabstimmung nach Art. 175 der Verfassung (tuerkei/INSTITUTIONEN.md, Abschnitt 3): 360 Stimmen (drei Fünftel) schicken die
   * Änderung in die Volksabstimmung, ab 400 (zwei Drittel) gilt sie ohne Referendum. Früher standen hier 301/360; die Oberfläche (Parlamentskopf,
   * Fußnote) und der Prolog nannten schon 360/400. Nicht abgebildet: die Einstiegshürde von 200 Antragstellern (zu prüfen, ob sie spielerisch zählt).
   */
  mehrheit: 360,
  direkt: 400,
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
 * Der Katalog: sechs Artikel mit je zwei bis drei Varianten (Spielparameter; die Sachverhalte stehen in
 * data/reich/recht.ts und RECHERCHE_VERTIEFUNG_MACHT_KAPITAL.md, Abschnitt 14d).
 */
export const ARTIKEL: VerfassungsArtikel[] = [
  {
    id: "amtszeit",
    name: t("sim2.sim.verfassung.27ac921"),
    frage: t("sim2.sim.verfassung.67f9e95"),
    varianten: [
      {
        id: "unveraendert",
        name: "Wie bisher",
        text: t("sim2.sim.verfassung.33b4d1b"),
        statusQuo: true,
        autoritaer: 0,
        parteien: {},
        waehler: {},
        effekte: [],
      },
      {
        id: "wiederwahl_plus",
        name: "Weitere Wiederwahl",
        text: t("sim2.sim.verfassung.dd395ec"),
        autoritaer: 2,
        parteien: { AKP: 2, MHP: 1, YRP: 1, CHP: -2, DEM: -2, "İYİ": -1, "YENİ": -1, Zafer: 0 },
        waehler: { konservative: 2, nationalisten: 1, staedtische_saekulare: -4, junge: -2, minderheiten: -2 },
        effekte: [
          { id: "polarisierung", d: 3 },
          { id: "legitimitaet", d: -2 },
        ],
      },
      {
        id: "unbegrenzt",
        name: "Keine Begrenzung",
        text: t("sim2.sim.verfassung.596e909"),
        autoritaer: 3,
        parteien: { AKP: 2, MHP: 1, YRP: 1, CHP: -2, DEM: -2, "İYİ": -2, "YENİ": -2, Zafer: 0 },
        waehler: { konservative: 3, nationalisten: 1, staedtische_saekulare: -6, junge: -3, minderheiten: -3, beamte: -1 },
        effekte: [
          { id: "polarisierung", d: 5 },
          { id: "legitimitaet", d: -4 },
          { id: "ansehen", d: -1 },
        ],
      },
      {
        id: "neuwahl_jetzt",
        name: "Vorgezogene Neuwahl",
        text: t("sim2.sim.verfassung.e306390"),
        autoritaer: 0,
        parteien: { CHP: 1, DEM: 1, "İYİ": 1, "YENİ": 1, AKP: -2, MHP: -2, YRP: -1, Zafer: 0 },
        waehler: { staedtische_saekulare: 1, junge: 1 },
        effekte: [{ id: "legitimitaet", d: 1 }],
      },
    ],
  },
  {
    id: "amtszeitlaenge",
    name: t("sim2.sim.verfassung.15692e8"),
    frage: t("sim2.sim.verfassung.4fbe51e"),
    varianten: [
      {
        id: "jahre_5",
        name: t("sim2.sim.verfassung.7869fd7"),
        text: t("sim2.sim.verfassung.d74a38b"),
        statusQuo: true,
        autoritaer: 0,
        parteien: {},
        waehler: {},
        effekte: [],
      },
      {
        id: "jahre_4",
        name: "Vier Jahre",
        text: t("sim2.sim.verfassung.b619f64"),
        autoritaer: -1,
        parteien: { CHP: 2, DEM: 1, "YENİ": 1, "İYİ": 1, AKP: -1, MHP: -1, YRP: 0, Zafer: 0 },
        waehler: { staedtische_saekulare: 2, junge: 1, konservative: -1 },
        effekte: [{ id: "legitimitaet", d: 1 }],
      },
      {
        id: "jahre_7",
        name: "Sieben Jahre",
        text: t("sim2.sim.verfassung.52f0d66"),
        autoritaer: 1,
        parteien: { AKP: 1, MHP: 1, YRP: 1, CHP: -2, DEM: -1, "İYİ": -1, "YENİ": -1, Zafer: 0 },
        waehler: { konservative: 1, staedtische_saekulare: -2, junge: -1 },
        effekte: [
          { id: "polarisierung", d: 1 },
          { id: "legitimitaet", d: -1 },
        ],
      },
    ],
  },
  {
    id: "wahlrecht",
    name: t("sim2.sim.verfassung.7dfc985"),
    frage: t("sim2.sim.verfassung.b4d3422"),
    varianten: [
      {
        id: "sieben",
        name: t("sim2.sim.verfassung.53612fb"),
        text: t("sim2.sim.verfassung.03925a7"),
        statusQuo: true,
        autoritaer: 0,
        parteien: {},
        waehler: {},
        effekte: [],
      },
      {
        id: "fuenf",
        name: t("sim2.sim.verfassung.875dbd8"),
        text: t("sim2.sim.verfassung.2e2c70a"),
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
        name: t("sim2.sim.verfassung.03b8de9"),
        text: t("sim2.sim.verfassung.47fdf5d"),
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
    name: t("sim2.sim.verfassung.4405a0f"),
    frage: t("sim2.sim.verfassung.01900cc"),
    varianten: [
      {
        id: "zwoelf_drei",
        name: t("sim2.sim.verfassung.23be689"),
        text: t("sim2.sim.verfassung.f859c9c"),
        statusQuo: true,
        autoritaer: 0,
        parteien: {},
        waehler: {},
        effekte: [],
      },
      {
        id: "acht_sieben",
        name: "Acht plus sieben",
        text: t("sim2.sim.verfassung.445e6bd"),
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
        name: t("sim2.sim.verfassung.f5a8c4c"),
        text: t("sim2.sim.verfassung.39d0d66"),
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
    frage: t("sim2.sim.verfassung.a84a8e5"),
    varianten: [
      {
        id: "eng",
        name: "Eng begrenzt",
        text: t("sim2.sim.verfassung.83d1edf"),
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
        text: t("sim2.sim.verfassung.fef8003"),
        statusQuo: true,
        autoritaer: 0,
        parteien: {},
        waehler: {},
        effekte: [],
      },
      {
        id: "weit",
        name: "Weit gefasst",
        text: t("sim2.sim.verfassung.9e00939"),
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
    name: t("sim2.sim.verfassung.ce66db1"),
    frage: t("sim2.sim.verfassung.614efaa"),
    varianten: [
      {
        id: "unveraendert",
        name: "Wie bisher",
        text: t("sim2.sim.verfassung.5a9395c"),
        statusQuo: true,
        autoritaer: 0,
        parteien: {},
        waehler: {},
        effekte: [],
      },
      {
        id: "aufgehoben",
        name: t("sim2.sim.verfassung.475988a"),
        text: t("sim2.sim.verfassung.51e3c47"),
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
  if (stimmen.erwartet >= VERFASSUNG_REGELN.direkt) hinweise.push(t("sim2.sim.verfassung.541581a", { p0: VERFASSUNG_REGELN.direkt }));
  else if (stimmen.erwartet >= VERFASSUNG_REGELN.mehrheit) hinweise.push(t("sim2.sim.verfassung.0f116e9", { p0: VERFASSUNG_REGELN.mehrheit, p1: VERFASSUNG_REGELN.direkt - 1 }));
  else hinweise.push(t("sim2.sim.verfassung.1fb3b28", { p0: VERFASSUNG_REGELN.mehrheit }));
  if (aut >= 2) hinweise.push(t("sim2.sim.verfassung.e816112"));
  if (aut <= -2) hinweise.push(t("sim2.sim.verfassung.36d36d2"));
  const aym = aymSicht(w, paket);
  hinweise.push(
    t("sim2.sim.verfassung.ca7e403", { p0: aym.pKassation < 0.12 ? t("sim2.sim.verfassung.i76ce50c") : aym.pKassation < 0.25 ? t("sim2.sim.verfassung.i743db5d") : t("sim2.sim.verfassung.i0e98fb6") }),
  );
  const base: VerfassungPruefung = { ok: true, pk, geaendert: geaendert.length, stimmen, autoritaer: aut, hinweise };
  const spiel = w.spiel;
  if (!spiel) return { ...base, ok: false, grund: t("sim2.sim.verfassung.1dc1eb2") };
  if (spiel.ende) return { ...base, ok: false, grund: t("sim2.sim.verfassung.56f5ccf") };
  if (!geaendert.length) return { ...base, ok: false, grund: t("sim2.sim.verfassung.560c0ee") };
  const pause = neuanfangGrund(w);
  if (pause) return { ...base, ok: false, grund: pause };
  const z = verfassungsZustand(w);
  if (z.laufend) return { ...base, ok: false, grund: t("sim2.sim.verfassung.0b90108") };
  if (amtszeitBelegt(w)) {
    return {
      ...base,
      ok: false,
      grund: t("sim2.sim.verfassung.ec4f0af"),
    };
  }
  const gesperrt = geaendert.filter((x) => artikelSperre(w, x.artikel.id) > 0);
  if (gesperrt.length) {
    const rest = Math.max(...gesperrt.map((x) => artikelSperre(w, x.artikel.id) - w.day));
    return { ...base, ok: false, grund: t("sim2.sim.verfassung.e6b674d", { p0: gesperrt.map((x) => `„${x.artikel.name}“`).join(", "), p1: rest }) };
  }
  if (!kannZahlen(spiel.kapital, pk)) return { ...base, ok: false, grund: t("sim2.sim.verfassung.b59ea0f", { p0: pk, p1: Math.floor(spiel.kapital) }) };
  return base;
}

/** Das Paket einbringen: Kapital und Aufmerksamkeit fließen, die Abstimmung ist terminiert. */
export function bringeVerfassungEin(w: World, paketRoh: Record<string, string>): Ergebnis {
  const pr = pruefeVerfassung(w, paketRoh);
  if (!pr.ok) return { ok: false, text: pr.grund ?? t("sim2.sim.verfassung.a87f6d4") };
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
  const text = t("sim2.sim.verfassung.c2f4d96", { p0: namen, p1: datum });
  const why = t("sim2.sim.verfassung.d4e5840", { p0: pr.pk, p1: pr.stimmen.erwartet, p2: pr.stimmen.tief, p3: pr.stimmen.hoch, p4: VERFASSUNG_REGELN.direkt, p5: VERFASSUNG_REGELN.mehrheit });
  addLog(w, "entscheidung", text, why);
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: "Verfassungspaket eingebracht", ausgang: namen });
  return { ok: true, text, why };
}

/** Das Paket vor der Abstimmung zurückziehen: ein Teil des Kapitals kommt zurück, gekaufte Stimmen sind verloren. */
export function zieheVerfassungZurueck(w: World): Ergebnis {
  const spiel = w.spiel;
  const z = spiel ? verfassungsZustand(w) : undefined;
  const v = z?.laufend;
  if (!spiel || !z || !v || v.phase !== "parlament") return { ok: false, text: t("sim2.sim.verfassung.383199f") };
  const zurueck = Math.floor(v.pk * VERFASSUNG_REGELN.rueckzugAnteil);
  spiel.kapital = Math.min(REGELN.kapitalMax, spiel.kapital + zurueck);
  z.historie.push({ tag: w.day, datum: w.date, ausgang: t("sim2.sim.verfassung.001d49c"), artikel: geaenderteArtikel(v.paket).map((x) => x.artikel.name) });
  delete z.laufend;
  // Freiwillig zurückgezogene Pakete sperren keine Artikel; die Amtszeit gilt gleichwohl als belegt
  const text = t("sim2.sim.verfassung.8ce3dc4");
  const why = t("sim2.sim.verfassung.a37aea8", { p0: zurueck, p1: v.pk });
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Stimmen für das Paket kaufen: dieselbe Absprachen-Logik wie bei Gesetzen, nur doppelt so teuer. */
export function verfassungStimmenKaufen(w: World, anzahl: number): Ergebnis {
  const spiel = w.spiel;
  const v = spiel ? verfassungsZustand(w).laufend : undefined;
  if (!spiel || !v || v.phase !== "parlament") return { ok: false, text: t("sim2.sim.verfassung.383199f") };
  const n = Math.max(1, Math.round(anzahl));
  const kosten = Math.ceil(n * REGELN.kaufKostenProStimme * VERFASSUNG_REGELN.kaufFaktor);
  if (!kannZahlen(spiel.kapital, kosten)) return { ok: false, text: t("sim2.sim.verfassung.98a6635", { p0: n, p1: kosten, p2: Math.floor(spiel.kapital) }) };
  spiel.kapital -= kosten;
  v.absprachen += n;
  const text = t("sim2.sim.verfassung.07e7935", { p0: n });
  const why = t("sim2.sim.verfassung.10a7b56", { p0: kosten });
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
  if (!v) return { ja: 0, weg: "gescheitert", angefochten: false, text: t("sim2.sim.verfassung.ef6c451") };
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
    z.historie.push({ tag: w.day, datum: w.date, ausgang: t("sim2.sim.verfassung.8164822", { p0: ja, p1: nein }), artikel: geaenderteArtikel(v.paket).map((x) => x.artikel.name) });
    delete z.laufend;
    const text = t("sim2.sim.verfassung.d35a095", { p0: ja, p1: nein, p2: VERFASSUNG_REGELN.mehrheit - ja });
    addLog(
      w,
      "entscheidung",
      text,
      t("sim2.sim.verfassung.2846d70", { p0: v.pk, p1: v.pk - zurueck }),
    );
    spiel.chronik.push({ tag: w.day, datum: w.date, titel: "Verfassungspaket gescheitert", ausgang: t("sim2.sim.verfassung.241e38f", { p0: ja, p1: nein, p2: VERFASSUNG_REGELN.mehrheit }) });
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
      ? t("sim2.sim.verfassung.a5a4432", { p0: ja, p1: nein, p2: VERFASSUNG_REGELN.direkt })
      : t("sim2.sim.verfassung.47cf3c1", { p0: ja, p1: nein, p2: VERFASSUNG_REGELN.mehrheit, p3: VERFASSUNG_REGELN.direkt - 1 });
  if (angefochten) {
    v.phase = "aym";
    v.aymTag = w.day + VERFASSUNG_REGELN.aymTage;
    addLog(w, "ereignis", t("sim2.sim.verfassung.3442314", { p0: wegText, p1: VERFASSUNG_REGELN.aymTage }), t("sim2.sim.verfassung.5c40147"));
  } else {
    addLog(w, "ereignis", t("sim2.sim.verfassung.84f127a", { p0: wegText }), t("sim2.sim.verfassung.1db54cb"));
    weiterNachAym(w, rng);
  }
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: t("sim2.sim.verfassung.8977bcd"), ausgang: `${ja} zu ${nein}${angefochten ? "; die Opposition fechtet an" : ""}` });
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
    t("sim2.sim.verfassung.48132c4", { p0: datum }),
    t("sim2.sim.verfassung.5ba05f5"),
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
  if (!v) return { kassiert: false, text: t("sim2.sim.verfassung.88495c8") };
  const sicht = aymSicht(w, v.paket);
  const kassiert = rng.next() < sicht.pKassation;
  if (kassiert) {
    for (const x of geaenderteArtikel(v.paket)) z.sperren[x.artikel.id] = w.day + VERFASSUNG_REGELN.sperrTage;
    z.historie.push({ tag: w.day, datum: w.date, ausgang: "Vom Verfassungsgericht kassiert", artikel: geaenderteArtikel(v.paket).map((x) => x.artikel.name) });
    delete z.laufend;
    wirke(w, "polarisierung", 2);
    vertrauenAendern(w, -1.5);
    spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - 1);
    const text = t("sim2.sim.verfassung.7321505");
    addLog(
      w,
      "ereignis",
      text,
      t("sim2.sim.verfassung.6704ca0"),
    );
    spiel.chronik.push({ tag: w.day, datum: w.date, titel: t("sim2.sim.verfassung.851e8f9"), ausgang: t("sim2.sim.verfassung.3aa2806") });
    return { kassiert, text };
  }
  addLog(w, "ereignis", t("sim2.sim.verfassung.37845af"), t("sim2.sim.verfassung.54f0f07"));
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: t("sim2.sim.verfassung.60bb5f0"), ausgang: t("sim2.sim.verfassung.94ebb26") });
  weiterNachAym(w, rng);
  return { kassiert, text: t("sim2.sim.verfassung.d42e1dd") };
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
  if (!spiel || !v || v.phase !== "kampagne") return { ok: false, text: t("sim2.sim.verfassung.0e117e2") };
  const rest = (v.kampagneZuletzt ?? -1e9) + VERFASSUNG_REGELN.kampagneAbkuehlung - w.day;
  if (rest > 0) return { ok: false, text: t("sim2.sim.verfassung.747d89b", { p0: rest, p1: rest === 1 ? t("sim2.sim.verfassung.i982963c") : t("sim2.sim.verfassung.i8c3427b") }) };
  if (!kannZahlen(spiel.kapital, VERFASSUNG_REGELN.kampagnePk)) return { ok: false, text: t("sim2.sim.verfassung.a128d4d", { p0: VERFASSUNG_REGELN.kampagnePk, p1: Math.floor(spiel.kapital) }) };
  spiel.kapital -= VERFASSUNG_REGELN.kampagnePk;
  v.kampagnenPk = (v.kampagnenPk ?? 0) + VERFASSUNG_REGELN.kampagnePk;
  v.kampagneZuletzt = w.day;
  verbrauche(w, AUFMERKSAMKEIT_KOSTEN.verfassungKampagne, "Referendum-Kampagne");
  const pr = referendumPrognose(w)!;
  const text = t("sim2.sim.verfassung.699731f", { p0: fmt(pr.mitte) });
  const why = t("sim2.sim.verfassung.b106d2c", { p0: VERFASSUNG_REGELN.kampagnePk });
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Wahlabend der Volksabstimmung: die Auszählung mit derselben Streuung wie die Präsidentschaftswahl. */
export function referendumAuszaehlen(w: World, rng: Rng): { ja: boolean; anteil: number; text: string } {
  const spiel = w.spiel!;
  const z = verfassungsZustand(w);
  const v = z.laufend;
  if (!v) return { ja: false, anteil: 0, text: t("sim2.sim.verfassung.ef6c451") };
  const pr = referendumPrognose(w)!;
  const anteil = clamp(pr.mitte + rng.normal(VERFASSUNG_REGELN.referendumStreuung), 0, 100);
  if (anteil >= 50) {
    const text = t("sim2.sim.verfassung.27790e0", { p0: fmt(anteil) });
    addLog(w, "ereignis", text, t("sim2.sim.verfassung.f83303d"));
    beschliessePaket(w, rng);
    return { ja: true, anteil, text };
  }
  // Nein: schwerer Vertrauensverlust, gestärkte Opposition, Sperrfristen
  z.historie.push({ tag: w.day, datum: w.date, ausgang: t("sim2.sim.verfassung.d64cc12", { p0: fmt(anteil) }), artikel: geaenderteArtikel(v.paket).map((x) => x.artikel.name) });
  for (const x of geaenderteArtikel(v.paket)) z.sperren[x.artikel.id] = w.day + VERFASSUNG_REGELN.sperrTage;
  delete z.laufend;
  vertrauenAendern(w, -4);
  spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - 3);
  wirke(w, "polarisierung", 2);
  for (const [partei, sitze] of Object.entries(w.parliament?.seats ?? {})) {
    if (partei === w.player?.partei.kurz || spiel.lager.includes(partei) || !sitze) continue;
    bereitschaftAendern(w, partei, -10);
  }
  const text = t("sim2.sim.verfassung.1c6adfb", { p0: fmt(anteil) });
  addLog(
    w,
    "ereignis",
    text,
    t("sim2.sim.verfassung.27a6960"),
  );
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: "Referendum verloren", ausgang: t("sim2.sim.verfassung.21ec61f", { p0: fmt(anteil) }) });
  spiel.hinweise.push({
    id: `referendum-nein-${w.day}`,
    titel: "Referendum-Nacht: Das Nein",
    szene: "wahlnacht",
    text: [t("sim2.sim.verfassung.9ff3544", { p0: fmt(anteil) }), t("sim2.sim.verfassung.9da0ba8")],
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
    // Die vorgezogene Neuwahl ist eine Einmalwirkung: Sie darf eine gelockerte Amtszeitgrenze („weitere Wiederwahl“, „unbegrenzt“) nicht überschreiben
    if (x.variante.id === "neuwahl_jetzt" && ["wiederwahl_plus", "unbegrenzt"].includes(z.aktiv.amtszeit ?? "")) {
      // Grenze bleibt
    } else {
      z.aktiv[x.artikel.id] = x.variante.id;
    }
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
  if (geaendert.some((x) => x.variante.id === "neuwahl_jetzt")) {
    spiel.wahltag = Math.min(spiel.wahltag, w.day + 60);
    addLog(w, "ereignis", t("sim2.sim.verfassung.8ee9e3e"), t("sim2.sim.verfassung.b98881e"));
  }

  // Keine Begrenzung der Amtszeiten: Die Rivalen im Kabinett sehen ihre Chance schwinden (Groll, Loyalität), die Venedig-Kommission des Europarats
  // äußert sich kritisch (Straßburg-Druck, Vertrauen der EU), und die Kür des Nachfolgers entfällt (sim/amtszeit.ts nimmt sie träge zurück)
  if (geaendert.some((x) => x.variante.id === "unbegrenzt")) {
    for (const f of spiel.figuren) {
      if (!f.imAmt || !AEMTER[f.amt].regierungsamt || f.amt === "partner") continue;
      const e = eigenVon(w, f);
      if (e.ehrgeiz >= 60) {
        e.groll = clamp(e.groll + 6, 0, 100);
        loyalitaetVerschieben(f, -3);
      }
    }
    wirke(w, "strassburg_druck", 3);
    landAendern(w, "EU", { vertrauen: -3 }, t("sim2.sim.verfassung.0fd5334"));
  }

  // 2. Gegenreaktion: autoritäre Pakete rufen Straße, Straßburg, EU und Märkte auf den Plan
  if (aut >= 2) {
    oeffneVerfassungsEreignis(w, "verfassung_proteste", rng);
    wirke(w, "strassburg_druck", 4);
    wirke(w, "ansehen", -2);
    landAendern(w, "EU", { vertrauen: -4 }, t("sim2.sim.verfassung.4efa7d1"));
    marktSchock(w, "verfassung", geaendert.some((x) => x.variante.id === "unbegrenzt") ? 1.6 : 1);
  } else if (aut <= -2) {
    // Demokratisierende Pakete: Legitimität und Ansehen wachsen; das laufende Kapital-Konto trägt den Verzicht
    wirke(w, "legitimitaet", 2);
    wirke(w, "ansehen", 2);
    landAendern(w, "EU", { vertrauen: 3 }, t("sim2.sim.verfassung.73319dd"));
  }

  z.historie.push({ tag: w.day, datum: w.date, ausgang: t("sim2.sim.verfassung.ceac3d3"), artikel: geaendert.map((x) => `${x.artikel.name}: ${x.variante.name}`) });
  delete z.laufend;
  const namen = geaendert.map((x) => `„${x.artikel.name}: ${x.variante.name}“`).join(", ");
  addLog(
    w,
    "entscheidung",
    t("sim2.sim.verfassung.a8ca1a3", { p0: namen }),
    aut >= 2
      ? t("sim2.sim.verfassung.2c2972e")
      : aut <= -2
        ? t("sim2.sim.verfassung.267a75b")
        : t("sim2.sim.verfassung.e1299ec"),
  );
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: t("sim2.sim.verfassung.780e6c6"), ausgang: namen });
  spiel.hinweise.push({
    id: `verfassung-kraft-${w.day}`,
    titel: t("sim2.sim.verfassung.780e6c6"),
    szene: "parlament",
    text: [t("sim2.sim.verfassung.fe3d3d0", { p0: namen }), aut >= 2 ? t("sim2.sim.verfassung.af09795") : t("sim2.sim.verfassung.bb7c166")],
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
    if (amtszeitBelegt(w)) return { zeile: t("sim2.sim.verfassung.131a303") };
    const aktiv = Object.keys(z?.aktiv ?? {}).length;
    return { zeile: aktiv ? t("sim2.sim.verfassung.bd70c06") : t("sim2.sim.verfassung.2738a17") };
  }
  const frist = v.phase === "parlament" ? v.abstimmung : v.phase === "aym" ? (v.aymTag ?? w.day) : (v.referendumTag ?? w.day);
  const phase = v.phase === "parlament" ? t("sim2.sim.verfassung.8c5c0f7") : v.phase === "aym" ? "beim Verfassungsgericht" : t("sim2.sim.verfassung.e81c871");
  return { zeile: t("sim2.sim.verfassung.57d627e", { p0: phase, p1: Math.max(0, frist - w.day) }), fristIn: Math.max(0, frist - w.day), phase: v.phase };
}
