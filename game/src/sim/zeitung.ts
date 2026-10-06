// Die Zeitung (UI-1 aus VERBESSERUNGSPLAN_2026-09-30, Suzerain-Vorbild: „Zeitung als Soft-Dashboard").
// Jeden Monat — und bei Großereignissen sofort — erscheint eine Ausgabe mit zwei bis drei Blättern
// aus verschiedenen Medien-Clustern (data/medien.ts): dieselbe Realität in verschiedenen Framings.
//   - regierungsnahe Blätter feiern Erfolge und schreiben Misserfolge klein (Eigentümer-Empfindlichkeit
//     steuert die Stärke des Drehs), zitieren Amtsträger und messen am Amtsantritt,
//   - oppositionsnahe dramatisieren und fragen nach Kosten und Verlierern,
//   - unabhängige berichten nüchtern, nennen Vormonat, Trend und die Unsicherheit.
// Die Wahrheit liegt nur in den internen Werten (RECHERCHE_MEDIEN_UMFRAGEN.md, A.5.4).
//
// Stoff einer Ausgabe: Chronik (Entscheidungen, Programme, Skandale), Gesetze, Wirkungsberichte,
// die Wirtschaftszahlen (nur veröffentlichte Werte), die akuten Probleme des Landes, das Ausland,
// die Umfrage des Monats — jede Zahl im Text stammt aus dem Weltzustand. Rubriken, zu denen der
// Weltzustand nichts hergibt, entfallen; es gibt keine Füllsätze.
//
// Artikel sind regelbasierte Bausteine aus dem Weltzustand (data/zeitung_texte.ts) — KEINE KI.
// KI-Text kommt später (KI-2); die Schnittstelle dafür ist `textQuelle: "regel" | "ki"` an jedem Artikel.
//
// Umfragen: Das Zeitungs-Modul ist der Consumer für die TODOs in sim/umfrage.ts. Die veröffentlichte
// Umfrage des Monats kommt von einem Institut mit Haus-Bias und erscheint IN der Zeitung (nicht mehr
// als nackte Zahl im Umlauf). Die interne Fortschreibung (spiel.umfrage.zustimmung) bleibt die
// Wahrheit des Spiels und treibt Sturzgefahr und Wahl — gemessen wird nur fürs Blatt.
//
// Determinismus: Alle Zufallsziehungen der Zeitung laufen über eigene, aus dem Weltzustand abgeleitete
// Zufallsquellen (Muster wie hashZahl in sim/personen.ts) — der Zufallsstrom des Spiels wird nicht
// angezapft, die bisherige Simulation bleibt bit-identisch.
//
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { medienCluster, type MedienCluster } from "../data/medien";
import { UMFRAGE_INSTITUTE, type UmfrageInstitut } from "../data/umfrage_institute";
import { KONFLIKT_NACH_ID } from "../data/konflikte";
import {
  baustein,
  kommentarFuer,
  kzBewertung,
  type AuslandPunkt,
  type KennzahlDaten,
  type LagePunkt,
  type TextKontext,
  type VorgangDaten,
} from "../data/zeitung_texte";
import { hashZahl } from "./personen";
import { Rng } from "./rng";
import { clamp } from "./economy";
import { NET } from "./modell";
import { PROVINCES, nationalAverage } from "./netz";
import { PROVINZEN } from "./regional";
import { LAENDER } from "./laender";
import { weltNachrichten } from "./welt-modell";
import { wirke } from "./wirkung";
import { umfrageMessung } from "./umfrage";
import { blattAuswahlWelt, istGesperrt, medienMonat, medienVon, publikationsverbot, reichweiteJetzt, wirksamerCluster } from "./medien";
import { fmt } from "./log";
import { formatMonthDe } from "./dates";
import type { MonthlySnapshot, World } from "./types";
import type { Bericht } from "./berichte";
import { t as tx } from "../i18n";

export type { AuslandPunkt, KennzahlDaten, LagePunkt, TextKontext, VorgangDaten } from "../data/zeitung_texte";

// ---------------------------------------------------------------------------
// Typen

export type Sparte = "politik" | "wirtschaft" | "ereignis" | "programm" | "welt" | "umfrage";

export type VorgangArt =
  | "wahlsieg"
  | "bruch"
  | "krise"
  | "fertigstellung"
  | "skandal"
  | "ereignis"
  | "programm"
  | "gesetz"
  | "wirtschaft"
  | "umfrage"
  | "bericht"
  | "lage"
  | "ausland"
  | "ueberblick";

/**
 * Wohin ein Artikel führt: eine Akte oder ein Land. Eine Teilmenge der Ziele des Schreibtischs
 * (ui/schreibtisch/briefing.ts), damit `gehe` aus der Bühne unverändert übergeben werden kann.
 */
export type ZeitungZiel =
  | { art: "akte"; akte: "wirtschaft" | "parlament" | "waehler" | "welt" | "chronik" | "programme" | "beschluesse" | "wirkungsbericht" | "bereiche" | "reich_kultur" | "reich_infra" }
  | { art: "land"; id: string };

export interface ZeitungHandlung {
  /** Beschriftung des Knopfes („Zum Parlament“) */
  text: string;
  ziel: ZeitungZiel;
}

/** Ein redaktioneller Vorgang: die Realität, aus der jedes Blatt seine eigene Schlagzeile baut. */
export interface ZeitungVorgang {
  id: string;
  art: VorgangArt;
  sparte: Sparte;
  /** Kurzer Sachverhalt („Die YENİ verlässt das Lager") */
  titel: string;
  /** Der nackte Fakt mit Zahlen — erscheint in JEDEM Framing, nur der Dreh drumherum ist cluster-eigen */
  fakt: string;
  /** Bewertung für die Regierung: −1 (Katastrophe) bis +1 (Triumph) */
  wertung: number;
  tag: number;
  datum: string;
  /** Großereignis: löst eine Eilmeldung aus und wirkt stärker */
  gross?: boolean;
  /** Kriegsphase (Krise der besonderen Art) */
  krieg?: boolean;
  /** Textanker, die dieser Vorgang in der Monatssammlung ersetzt (Chronik/Log-Dubletten) */
  schluessel?: string[];
  /** Strukturierte Angaben aus dem Weltzustand, aus denen jedes Blatt seinen eigenen Text baut */
  daten?: VorgangDaten;
  /** Wohin der Artikel führen soll; fehlt sie, leitet `handlungFuer` sie aus der Art ab */
  handlung?: ZeitungHandlung;
}

export type FramingArt = "regierungsnah" | "oppositionell" | "neutral";

/** Die Einordnung einer Eilmeldung: was feststeht, was offen ist. */
export interface ZeitungEinordnung {
  feststeht: string[];
  offen: string[];
}

export interface ZeitungArtikel {
  id: string;
  art: VorgangArt;
  sparte: Sparte;
  schlagzeile: string;
  /** 1–3 Absätze; der erste trägt den gemeinsamen Fakt, der Rest den Dreh des Blattes */
  text: string[];
  /** Herkunft des Textes; KI kommt später (KI-2), der Fallback bleibt „regel" */
  textQuelle: "regel" | "ki";
  /** Endgültige Stimmungswirkung des Artikels (Vorzeichen = Richtung für die Regierung) */
  wirkung: number;
  framing: { art: FramingArt; staerke: number };
  /** Kleingedruckt: regierungsnahe Blätter entsorgen Unbequemes unterhalb der Falz */
  kurz: boolean;
  /** Was der Leser daraufhin tun kann (Knopf zur passenden Akte); fehlt bei älteren Ausgaben */
  handlung?: ZeitungHandlung;
  /** Nur Eilmeldungen: Was feststeht, was offen ist */
  einordnung?: ZeitungEinordnung;
}

/** Der Leitkommentar eines Blattes. */
export interface ZeitungKommentar {
  titel: string;
  text: string[];
}

export interface ZeitungBlatt {
  clusterId: string;
  /** Erfundener Blattname (nie der Name eines echten Mediums) */
  name: string;
  /** Zeile unter dem Titel — Charakter in einem Satz */
  unterzeile: string;
  digital: boolean;
  ton: FramingArt;
  artikel: ZeitungArtikel[];
  /** Titel der Vorgänge, die dieses Blatt (noch) nicht gebracht hat — Sichtbarkeit des Schweigens */
  verschwiegen: string[];
  /** Die Meinung des Blattes zum Monat; nur in Monatsausgaben */
  kommentar?: ZeitungKommentar;
  /** Faktor auf die Reichweite zum Erscheinen (Medien-Zustand: Druck, Märtyrer-Effekt, Ausweichen); fehlt in älteren Ausgaben (= 1) */
  reichweite?: number;
  /** Selbstzensur der Redaktion zum Erscheinen (0 bis 100); fehlt in älteren Ausgaben */
  selbstzensur?: number;
}

/** Die veröffentlichte Umfrage des Monats: Institut, Messwert und das, was das Haus offenlegt. */
export interface ZeitungUmfrage {
  institutId: string;
  institut: string;
  wert: number;
  vormonat?: number;
  stichprobe?: number;
  methode: string;
  /** Messwert des Instituts minus wahrer Wert — intern, fürs Balancing und spätere Mentorin-Texte */
  abweichung: number;
}

/** Eine Kennzahl des Monats mit Vormonat und Verlauf (nur veröffentlichte bzw. öffentliche Werte). */
export interface ZeitungKennzahl extends KennzahlDaten {
  name: string;
  /** Bezugsmonat bzw. Quelle, etwa „August 2029“ oder der Name des Instituts */
  stand?: string;
  /** Bis zu zwölf Monatswerte, älteste zuerst; nur wenn echte Verlaufsdaten vorliegen */
  verlauf?: number[];
}

/** Das Parlament in einem Kasten. */
export interface ZeitungParlament {
  lager: number;
  duldung: number;
  noetig: number;
  /** Gesetze, die gerade im Parlament liegen */
  gesetze: string[];
}

/** Eine Zeile im Kasten „Ausland“. */
export interface ZeitungAuslandZeile {
  text: string;
  ziel?: ZeitungZiel;
}

export interface ZeitungAusgabe {
  nummer: number;
  datum: string;
  monat: string;
  anlass: "monatlich" | "eilmeldung";
  blaetter: ZeitungBlatt[];
  umfrage?: ZeitungUmfrage;
  /** Name eines Instituts, dessen Ergebnis in der Schublade blieb (Recherche B.4.2) */
  umfrageSchublade?: string;
  /** Gesetzliches Publikationsverbot vor der Wahl: In dieser Ausgabe erscheint keine neue Umfrage */
  umfrageVerbot?: boolean;
  /** Blätter, die nicht erschienen sind, und warum (Lizenzentzug, Blackout, Reglerstufe) */
  gesperrt?: { clusterId: string; name: string; grund: "lizenzentzug" | "blackout" | "regler" }[];
  /** Zahlen des Monats; fehlt bei Ausgaben aus der Zeit vor dem Umbau der Zeitung */
  zahlen?: ZeitungKennzahl[];
  /** Die akutesten Probleme des Landes */
  lage?: LagePunkt[];
  parlament?: ZeitungParlament;
  ausland?: ZeitungAuslandZeile[];
}

export interface ZeitungZustand {
  /** Neueste Ausgabe zuletzt; auf ARCHIV_MAX begrenzt */
  archiv: ZeitungAusgabe[];
  /** Ausgaben seit dem letzten Öffnen der Zeitung (Badge am Einstieg) */
  ungelesen: number;
  naechsteNummer: number;
  /** Großereignisse, die Digital schon brachte und Print erst im nächsten Monat bringt */
  warteschlange: ZeitungVorgang[];
  /** Tag der letzten Monatsausgabe (Chronik-Sammlung ab hier) */
  letzteMonatsausgabeTag: number;
  /** Messwert der zuletzt veröffentlichten Umfrage (Delta-Text) */
  letzteUmfrage?: number;
  /** Veröffentlichte Werte der letzten Ausgabe (Delta-Text); Arbeitslosigkeit und Wachstum fehlen in älteren Ständen */
  wirtschaft: { inflation: number; policyRate: number; usdTry: number; arbeit?: number; wachstum?: number };
  /** Provinzen je akutem Problem zur letzten Monatsausgabe (Vormonats-Vergleich) */
  akutVorher?: Record<string, number>;
  /** Konfliktwerte je Land und Konfliktpaar zur letzten Monatsausgabe */
  auslandVorher?: Record<string, number>;
  /** Alle veröffentlichten Umfragewerte, älteste zuerst (Sparkline) */
  umfrageReihe?: number[];
}

export const ARCHIV_MAX = 12;

// ---------------------------------------------------------------------------
// Die Blätter: erfundene Namen je Cluster (reale Vorbilder nur in data/medien.ts-Kommentaren)

interface BlattDef {
  name: string;
  unterzeile: string;
}

const BLAETTER: Record<string, BlattDef> = {
  staatsrundfunk: { name: "Der Staatsbote", unterzeile: "Amtlich. Ausgewogen. Immer schon da." },
  holding_kern: { name: "Neue Warte", unterzeile: tx("sim2.sim.zeitung.e737635") },
  holding_breit: { name: "Tagespost", unterzeile: tx("sim2.sim.zeitung.2e7c9fc") },
  kommerz_konform: { name: "Abendkurier", unterzeile: tx("sim2.sim.zeitung.5499cfb") },
  opposition_masse: { name: "Die Freie Stimme", unterzeile: tx("sim2.sim.zeitung.29d96c9") },
  opposition_nische: { name: "Der Widerspruch", unterzeile: "Klein auflagestark an Haltung." },
  digital_frei: { name: "Das Netzportal", unterzeile: tx("sim2.sim.zeitung.6e4985a") },
};

export function blattDef(clusterId: string): BlattDef {
  return BLAETTER[clusterId] ?? { name: "Der Anzeiger", unterzeile: tx("sim2.sim.zeitung.52b082a") };
}

// ---------------------------------------------------------------------------
// Framing-Regeln

/** Die Lesart eines Clusters folgt der Ausrichtung, nicht dem Marktanteil. */
export function framingFuer(cluster: MedienCluster): FramingArt {
  switch (cluster.ausrichtung) {
    case "staatlich":
    case "loyalistisch":
    case "linientreu_opportunistisch":
    case "konform_kommerziell":
      return "regierungsnah";
    case "oppositionell_masse":
    case "oppositionell_nische":
      return "oppositionell";
    case "unabhaengig_digital":
      return "neutral";
  }
}

/**
 * Die Stärke des Drehs: Je empfindlicher der Eigentümer auf Regierungsdruck reagiert,
 * desto größer die Feier und desto kleiner der Misserfolg. Freie Blätter drehen aus
 * Überzeugung in die andere Richtung; neutrale bleiben nah am Fakt.
 */
export function framingStaerke(cluster: MedienCluster): number {
  const f = cluster.eigentuemerEmpfindlichkeit / 100;
  const art = framingFuer(cluster);
  if (art === "regierungsnah") return clamp(0.3 + 0.7 * f, 0, 1);
  if (art === "oppositionell") return clamp(0.9 - f, 0, 1);
  return 0.15;
}

/** Mit welcher Wahrscheinlichkeit ein Cluster einen Vorgang überhaupt bringt (Recherche A.5.4). */
export function berichtP(cluster: MedienCluster, vorgang: Pick<ZeitungVorgang, "wertung">): number {
  // Unangenehm für die Regierung → Skandal-Quote Regierung; angenehm → Bereitschaft, Regierungsnahes zu tragen
  return vorgang.wertung < 0 ? cluster.berichtSkandalRegierung : cluster.berichtSkandalOpposition;
}

/** Deterministische Zufallsquelle der Zeitung: zapft den Strom des Spiels NICHT an. */
function zeitungZufall(salz: string): Rng {
  return new Rng(Math.floor(hashZahl(salz) * 2 ** 31));
}

// ---------------------------------------------------------------------------
// Artikel

/** Wie stark ein Artikel die Stimmung bewegt: Großereignisse und Skandale schwerer als Routine. */
const WIRKUNG_FAKTOR: Record<VorgangArt, number> = {
  wahlsieg: 0.9,
  bruch: 1.1,
  krise: 1.1,
  fertigstellung: 0.8,
  skandal: 1.2,
  ereignis: 0.4,
  programm: 0.5,
  gesetz: 0.4,
  wirtschaft: 0.6,
  umfrage: 0.4,
  // Neue Stoffe: Wirkungsberichte ersetzen die frühere Chronikzeile (≈ gleiche Stärke); Lage und Überblick
  // berichten über Zustände, die schon über das Politiknetz wirken, und zählen nicht doppelt.
  bericht: 0.4,
  lage: 0,
  ausland: 0.15,
  ueberblick: 0,
};

/** Wohin ein Artikel der Art nach führt (Knopf in der Oberfläche); ohne passende Akte keiner. */
export function handlungFuer(v: ZeitungVorgang): ZeitungHandlung | undefined {
  if (v.handlung) return v.handlung;
  switch (v.art) {
    case "gesetz":
    case "bruch":
      return { text: "Zum Parlament", ziel: { art: "akte", akte: "parlament" } };
    case "wirtschaft":
    case "ueberblick":
      return { text: "Zur Wirtschaftsakte", ziel: { art: "akte", akte: "wirtschaft" } };
    case "lage":
      return { text: tx("sim2.sim.zeitung.e6ec8c9"), ziel: { art: "akte", akte: "bereiche" } };
    case "bericht":
      return { text: tx("sim2.sim.zeitung.5730ed2"), ziel: { art: "akte", akte: "wirkungsbericht" } };
    case "programm":
      return { text: tx("sim2.sim.zeitung.f5314df"), ziel: { art: "akte", akte: "programme" } };
    case "ausland": {
      const p = v.daten?.typ === "ausland" ? v.daten.punkt : undefined;
      const name = p && (p.art === "krieg" || p.art === "spannung") ? p.land : undefined;
      const id = name ? LAENDER.find((l) => l.name === name)?.id : undefined;
      return id ? { text: tx("sim2.sim.zeitung.29516dc"), ziel: { art: "land", id } } : { text: "Zur Weltkarte", ziel: { art: "akte", akte: "welt" } };
    }
    case "krise":
      return v.krieg ? { text: "Zur Weltkarte", ziel: { art: "akte", akte: "welt" } } : { text: "Zur Wirtschaftsakte", ziel: { art: "akte", akte: "wirtschaft" } };
    case "wahlsieg":
      return { text: "Zur Chronik", ziel: { art: "akte", akte: "chronik" } };
    default:
      return undefined;
  }
}

/** Ein Blatt macht aus einem Vorgang einen Artikel (gleicher Fakt, eigener Dreh). */
export function artikelFuer(cluster: MedienCluster, vorgang: ZeitungVorgang, kontext: TextKontext, id: string): ZeitungArtikel {
  const art = framingFuer(cluster);
  const staerke = framingStaerke(cluster);
  const wahl = hashZahl(`${vorgang.id}|${cluster.id}`);
  const b = baustein(art, staerke, vorgang, kontext, wahl);
  // Kleingedrucktes wirkt gedämpfter, Dramatisiertes stärker (Sichtbarkeits-Mechanik)
  const sicht = b.kurz ? 0.5 : art === "neutral" ? 0.8 : 1;
  const wirkung = clamp(vorgang.wertung * WIRKUNG_FAKTOR[vorgang.art] * sicht, -1.5, 1.5);
  const teile = b.ersetztFakt ? b.absaetze : [vorgang.fakt, ...b.absaetze];
  const text = b.kurz ? [teile.join(" ")] : teile;
  const handlung = handlungFuer(vorgang);
  return {
    id,
    art: vorgang.art,
    sparte: vorgang.sparte,
    schlagzeile: b.schlagzeile,
    text,
    textQuelle: "regel",
    wirkung,
    framing: { art, staerke },
    kurz: b.kurz,
    ...(handlung ? { handlung } : {}),
  };
}

// ---------------------------------------------------------------------------
// Kontext: Amtsträger, Zahlen und Mehrheitslage für die Texte

function amtVon(world: World, amt: "finanzen" | "inneres" | "aussen" | "opposition" | "wirtschaft"): { name: string; rolle: string } | undefined {
  const f = world.spiel?.figuren.find((x) => x.amt === amt && x.imAmt);
  return f ? { name: f.name, rolle: f.rolle } : undefined;
}

/** Mehrheitslage des Regierungslagers: Sitze des Lagers plus Sitze der Fraktionen, die es gerade dulden. */
function mehrheitVon(world: World): TextKontext["mehrheit"] | undefined {
  const parl = world.parliament;
  const player = world.player;
  const spiel = world.spiel;
  if (!parl || !player || !spiel) return undefined;
  const parteien = [player.partei.kurz, ...spiel.lager];
  const lager = parteien.reduce((s, p) => s + (parl.seats[p] ?? 0), 0);
  let duldung = 0;
  for (const [p, fr] of Object.entries(spiel.fraktionen ?? {})) {
    if (parteien.includes(p)) continue;
    if (fr.duldungBis !== undefined && fr.duldungBis > world.day) duldung += parl.seats[p] ?? 0;
  }
  return { lager, duldung, noetig: 301 };
}

function kontextVon(world: World): TextKontext {
  const fin = amtVon(world, "finanzen");
  const aus = amtVon(world, "aussen");
  const inn = amtVon(world, "inneres");
  const opp = amtVon(world, "opposition");
  const wirt = amtVon(world, "wirtschaft");
  const mehrheit = mehrheitVon(world);
  return {
    name: world.player?.name ?? "Die Regierung",
    partei: world.player?.partei.kurz ?? "",
    ...(fin ? { finanz: fin } : {}),
    ...(aus ? { aussen: aus } : {}),
    ...(inn ? { inneres: inn } : {}),
    ...(opp ? { opposition: opp } : {}),
    ...(wirt ? { wirtschaft: wirt } : {}),
    zahlen: {
      inflation: world.published.inflation.value,
      arbeit: world.published.unemployment.value,
      wachstum: world.published.growth.value,
      zins: world.economy.policyRate,
      lira: world.economy.usdTry,
    },
    ...(mehrheit ? { mehrheit } : {}),
  };
}

// ---------------------------------------------------------------------------
// Blatt- und Ausgabenbau

/** Welche Cluster eine Ausgabe tragen: immer ein regierungsnahes und ein oppositionsnahes Blatt, jeden zweiten Monat zusätzlich das digitale (Recherche A.5.4). */
export function blattAuswahl(monatIndex: number): string[] {
  const regierungsnah = ["holding_kern", "staatsrundfunk", "holding_breit", "kommerz_konform"];
  const opposition = ["opposition_masse", "opposition_nische"];
  const auswahl = [regierungsnah[monatIndex % regierungsnah.length]!, opposition[monatIndex % opposition.length]!];
  if (monatIndex % 2 === 0) auswahl.push("digital_frei");
  return auswahl;
}

function monatIndex(datum: string): number {
  const [j, m] = datum.split("-").map(Number) as [number, number];
  return j * 12 + (m - 1);
}

/** Gewicht einer Meldung für die Platzierung: Großes zuerst, Routine zuletzt. */
const RANG: Record<VorgangArt, number> = {
  wahlsieg: 1,
  bruch: 1,
  krise: 1,
  skandal: 1,
  fertigstellung: 0.9,
  gesetz: 0.6,
  bericht: 0.55,
  wirtschaft: 0.5,
  ausland: 0.5,
  lage: 0.45,
  programm: 0.4,
  ueberblick: 0.4,
  ereignis: 0.3,
  umfrage: 0.2,
};

function vorgangRang(v: ZeitungVorgang): number {
  return RANG[v.art] + Math.abs(v.wertung) * 0.5 + (v.gross ? 1 : 0);
}

/** Platz im Blatt: Regierungsnahe stellen Gutes nach vorn, Oppositionelle Schlechtes; Kleingedrucktes rutscht ab. */
function blattRang(f: FramingArt, a: ZeitungArtikel, v: ZeitungVorgang): number {
  const richtung = f === "regierungsnah" ? 0.4 : f === "oppositionell" ? -0.4 : 0;
  return vorgangRang(v) + richtung * v.wertung - (a.kurz ? 0.6 : 0);
}

const MAX_ARTIKEL = 6;

/** Baut die Blätter einer Ausgabe: je Cluster eigene Ziehung, eigener Dreh, eigenes Schweigen, eigener Kommentar. */
function baueBlaetter(
  clusterIds: string[],
  vorgaenge: ZeitungVorgang[],
  kontext: TextKontext,
  rng: Rng,
  nummer: number,
  zahlen: KennzahlDaten[],
  world?: World,
): ZeitungBlatt[] {
  const blaetter: ZeitungBlatt[] = [];
  const nachrichten = vorgaenge.filter((v) => v.art !== "ueberblick" && v.art !== "umfrage");
  const stimmung = nachrichten.length ? nachrichten.reduce((s, v) => s + v.wertung, 0) / nachrichten.length : 0;
  const nachRang = [...nachrichten].sort((a, b) => vorgangRang(b) - vorgangRang(a));
  /** Das Thema, an dem ein Kommentar des Blattes ansetzt: bei schlechter Stimmung das Problem, bei guter der Erfolg — nur aus dem, was das Blatt gedruckt hat. */
  const themaFuer = (f: FramingArt, gedruckt: ZeitungVorgang[]): ZeitungVorgang | undefined => {
    const liste = nachRang.filter((v) => gedruckt.includes(v));
    const schlecht = liste.find((v) => v.wertung < -0.1);
    const gut = liste.find((v) => v.wertung > 0.1);
    if (stimmung < -0.15) return schlecht;
    if (stimmung > 0.15) return gut;
    return f === "regierungsnah" ? (gut ?? schlecht) : f === "oppositionell" ? (schlecht ?? gut) : liste[0];
  };
  for (const id of clusterIds) {
    const basis = medienCluster(id);
    if (!basis) continue;
    // Der Cluster, wie er jetzt wirkt: Ausrichtung nach Eigentümer und Kippen, Berichte nach Selbstzensur (sim/medien.ts)
    const cluster = world ? wirksamerCluster(world, basis) : basis;
    const def = blattDef(id);
    const f = framingFuer(cluster);
    const paare: { a: ZeitungArtikel; v: ZeitungVorgang }[] = [];
    const verschwiegen: string[] = [];
    vorgaenge.forEach((v, i) => {
      // Die Wirtschaft im Überblick gehört in jedes Blatt; alles andere bringt ein Blatt mit seiner Wahrscheinlichkeit
      const ziehung = rng.next();
      if (v.art === "ueberblick" || ziehung < berichtP(cluster, v)) paare.push({ a: artikelFuer(cluster, v, kontext, `a${nummer}-${id}-${i}`), v });
      else verschwiegen.push(v.titel);
    });
    // Ein Blatt ohne Meldung gibt es nicht: Im Zweifel steht die Wirtschaft im Überblick auf der Frontseite
    if (paare.length === 0) {
      const v = vorgaenge.find((x) => x.art === "ueberblick") ?? vorgaenge[0];
      if (v) paare.push({ a: artikelFuer(cluster, v, kontext, `a${nummer}-${id}-f`), v });
    }
    paare.sort((x, y) => blattRang(f, y.a, y.v) - blattRang(f, x.a, x.v));
    const artikel = paare.slice(0, MAX_ARTIKEL).map((p) => p.a);
    const thema = themaFuer(f, paare.map((p) => p.v));
    const kommentar = kommentarFuer(f, { stimmung, ...(thema ? { thema: thema.titel } : {}), zahlen, kontext }, hashZahl(`${nummer}|${id}|kommentar`));
    blaetter.push({
      clusterId: id,
      name: def.name,
      unterzeile: def.unterzeile,
      digital: cluster.digital,
      ton: f,
      artikel,
      verschwiegen: verschwiegen.slice(0, 3),
      kommentar,
      ...(world ? { reichweite: Math.round(reichweiteJetzt(world, id) * 100) / 100, selbstzensur: Math.round(medienVon(world).cluster[id]?.selbstzensur ?? 0) } : {}),
    });
  }
  return blaetter;
}

// ---------------------------------------------------------------------------
// Umfrage des Monats (Consumer der TODOs in sim/umfrage.ts: Instituts-Auswahl + Publikation)

export interface UmfrageErgebnis {
  umfrage?: ZeitungUmfrage;
  schublade?: string;
}

/**
 * Ein Institut misst den wahren Wert — mit Haus-Bias, Angstklima und Rauschen — und entscheidet
 * dann nach seiner Publikationsregel, ob die Zahl das Blatt sieht (Recherche B.4.2).
 * Verbraucht nur die übergebene Zufallsquelle.
 */
export function monatsUmfrage(wahrerWert: number, angstklima: number, rng: Rng, vormonat?: number): UmfrageErgebnis {
  const institut: UmfrageInstitut = UMFRAGE_INSTITUTE[Math.floor(rng.next() * UMFRAGE_INSTITUTE.length)]!;
  // Kommerzielle Häuser: der Haus-Effekt springt von Welle zu Welle (Recherche B.2.6)
  const sprung = institut.hausBiasInstabilitaet ? (rng.next() * 2 - 1) * institut.hausBiasInstabilitaet : 0;
  const effektivesBias = institut.hausBias + sprung;
  const gemessen = clamp(umfrageMessung(wahrerWert, rng, { institutId: institut.id, angstklima }) + sprung, 0, 100);
  // Gefällt das Ergebnis dem eigenen Lager? (Recherche B.4.2: Schubladen-Umfragen)
  const guenstig = effektivesBias >= 0 ? gemessen >= wahrerWert - 1 : gemessen <= wahrerWert - 2;
  const p = guenstig ? institut.publikation.wennGuenstig : institut.publikation.wennUnguenstig;
  if (rng.next() >= p) return { schublade: institut.name };
  const wert = Math.round(gemessen * 10) / 10;
  const umfrage: ZeitungUmfrage = {
    institutId: institut.id,
    institut: institut.name,
    wert,
    ...(vormonat !== undefined ? { vormonat } : {}),
    ...(institut.stichprobeTransparent ? { stichprobe: institut.stichprobe } : {}),
    methode: institut.methode.replace("_", " + "),
    abweichung: Math.round((gemessen - wahrerWert) * 10) / 10,
  };
  return { umfrage };
}

// ---------------------------------------------------------------------------
// Zustand

export function zeitungStart(world: World): ZeitungZustand {
  return {
    archiv: [],
    ungelesen: 0,
    naechsteNummer: 1,
    warteschlange: [],
    // Die erste Ausgabe greift den laufenden Monat auf (bei alten Spielständen: den letzten Monat)
    letzteMonatsausgabeTag: Math.max(0, world.day - 31),
    wirtschaft: {
      inflation: world.published.inflation.value,
      policyRate: world.economy.policyRate,
      usdTry: world.economy.usdTry,
      arbeit: world.published.unemployment.value,
      wachstum: world.published.growth.value,
    },
  };
}

/** Der Zeitungszustand; ältere Spielstände legen ihn beim ersten Bedarf an (Migration). */
export function zeitungVon(world: World): ZeitungZustand {
  const spiel = world.spiel!;
  if (!spiel.zeitung) spiel.zeitung = zeitungStart(world);
  return spiel.zeitung;
}

/** Die Oberfläche hat die Zeitung geöffnet: Das Badge „Neue Ausgabe" erlischt. */
export function zeitungGelesen(world: World): void {
  const z = world.spiel?.zeitung;
  if (z) z.ungelesen = 0;
}

function legeAb(world: World, ausgabe: ZeitungAusgabe): void {
  const z = zeitungVon(world);
  z.archiv.push(ausgabe);
  if (z.archiv.length > ARCHIV_MAX) z.archiv.splice(0, z.archiv.length - ARCHIV_MAX);
  z.ungelesen += 1;
  z.naechsteNummer += 1;
}

function hinweis(world: World, ausgabe: ZeitungAusgabe): void {
  const spiel = world.spiel!;
  const lead = ausgabe.blaetter[0]?.artikel[0];
  spiel.hinweise.push({
    // Präfix „zeitung-": Klasse C der Auto-Stopp-Taxonomie — Umlauf, die Zeit läuft weiter
    id: `zeitung-${ausgabe.anlass === "eilmeldung" ? "eil-" : ""}${world.day}-${ausgabe.nummer}`,
    titel: ausgabe.anlass === "eilmeldung" ? tx("sim2.sim.zeitung.8df18d7") : "Die Zeitung: Neue Ausgabe",
    szene: "istanbul",
    text: [
      `Ausgabe Nr. ${ausgabe.nummer}: ${ausgabe.blaetter.map((b) => b.name).join(", ")}.${lead ? ` Leitartikel: „${lead.schlagzeile}" (${ausgabe.blaetter[0]!.name}).` : ""}`,
    ],
  });
}

// ---------------------------------------------------------------------------
// Rubriken aus dem Weltzustand: Zahlen des Monats, Lage im Land, Parlament, Ausland

/** Verlauf einer Kennzahl aus den Monatswerten bis zum Bezugsmonat (nie über den veröffentlichten Stand hinaus). */
function monatsReihe(world: World, feld: (h: MonthlySnapshot) => number | undefined, bis: string): number[] {
  return world.history
    .filter((h) => h.month <= bis)
    .map(feld)
    .filter((x): x is number => typeof x === "number" && Number.isFinite(x))
    .slice(-12);
}

/** Bezugszeitraum einer veröffentlichten Zahl: Monat („2028-11“) oder Quartal („2028-Q3“) — letzter Monat und Anzeigetext. */
function zeitraum(period: string): { bis: string; text: string } {
  const q = /^(\d{4})-Q([1-4])$/.exec(period);
  if (q) return { bis: `${q[1]}-${String(Number(q[2]) * 3).padStart(2, "0")}`, text: `${q[2]}. Quartal ${q[1]}` };
  return { bis: period, text: formatMonthDe(period) };
}

function kennzahlenVon(world: World, z: ZeitungZustand, umfrage?: ZeitungUmfrage): ZeitungKennzahl[] {
  const pub = world.published;
  const heute = world.date.slice(0, 7);
  const out: ZeitungKennzahl[] = [
    { id: "inflation", name: "Inflation", wert: pub.inflation.value, vorher: z.wirtschaft.inflation, gut: -1, stand: zeitraum(pub.inflation.period).text, verlauf: monatsReihe(world, (h) => h.inflation, zeitraum(pub.inflation.period).bis) },
    {
      id: "arbeit",
      name: "Arbeitslosigkeit",
      wert: pub.unemployment.value,
      ...(z.wirtschaft.arbeit !== undefined ? { vorher: z.wirtschaft.arbeit } : {}),
      gut: -1,
      stand: zeitraum(pub.unemployment.period).text,
      verlauf: monatsReihe(world, (h) => h.unemployment, zeitraum(pub.unemployment.period).bis),
    },
    {
      id: "wachstum",
      name: "Wachstum",
      wert: pub.growth.value,
      ...(z.wirtschaft.wachstum !== undefined ? { vorher: z.wirtschaft.wachstum } : {}),
      gut: 1,
      stand: zeitraum(pub.growth.period).text,
      verlauf: monatsReihe(world, (h) => h.growth, zeitraum(pub.growth.period).bis),
    },
    { id: "zins", name: "Leitzins", wert: world.economy.policyRate, vorher: z.wirtschaft.policyRate, gut: -1, verlauf: monatsReihe(world, (h) => h.policyRate, heute) },
    { id: "lira", name: "Lira je Dollar", wert: world.economy.usdTry, vorher: z.wirtschaft.usdTry, gut: -1, verlauf: monatsReihe(world, (h) => h.usdTry, heute) },
  ];
  if (umfrage) {
    out.push({
      id: "zustimmung",
      name: "Zustimmung (Umfrage)",
      wert: umfrage.wert,
      ...(umfrage.vormonat !== undefined ? { vorher: umfrage.vormonat } : {}),
      gut: 1,
      stand: umfrage.institut,
      verlauf: [...(z.umfrageReihe ?? []), umfrage.wert].slice(-12),
    });
  }
  // Verläufe mit weniger als drei Punkten sind keine Linie
  return out.map((k) => (k.verlauf && k.verlauf.length < 3 ? { ...k, verlauf: undefined } : k)).map(({ verlauf, ...rest }) => (verlauf ? { ...rest, verlauf } : rest));
}

/** Alle akuten Probleme des Landes, nach betroffenem Bevölkerungsanteil geordnet. */
function lagePunkte(world: World, z: ZeitungZustand): LagePunkt[] {
  const out: LagePunkt[] = [];
  const summe = world.net.weights.reduce((s, x) => s + x, 0) || 1;
  for (const n of NET.nodes) {
    if (n.kind !== "problem" || !n.threshold) continue;
    const i = NET.index.get(n.id)!;
    let anzahl = 0;
    let last = 0;
    let maxWert = -Infinity;
    let maxP = -1;
    for (let p = 0; p < PROVINCES; p++) {
      const v = world.net.values[i * PROVINCES + p]!;
      if (v >= n.threshold) {
        anzahl++;
        last += world.net.weights[p]!;
        if (v > maxWert) {
          maxWert = v;
          maxP = p;
        }
      }
    }
    if (anzahl === 0) continue;
    const vorher = z.akutVorher?.[n.id];
    out.push({
      id: n.id,
      name: n.name,
      provinzen: anzahl,
      anteil: clamp(last / summe, 0, 1),
      schlimmste: PROVINZEN[maxP]?.name ?? `Provinz ${maxP + 1}`,
      ...(vorher !== undefined ? { vorher } : {}),
    });
  }
  return out.sort((a, b) => b.anteil - a.anteil);
}

function parlamentVon(world: World): ZeitungParlament | undefined {
  const m = mehrheitVon(world);
  if (!m) return undefined;
  return { lager: m.lager, duldung: m.duldung, noetig: m.noetig, gesetze: (world.spiel?.gesetze ?? []).map((g) => g.name) };
}

const PHASE_NAME: Record<string, string> = {
  spannung: "Spannung",
  drohkulisse: "Drohkulisse",
  beschluss: "Beschluss",
  krieg: "Krieg",
  waffenruhe: "Waffenruhe",
  frieden: "Frieden",
  beendet: "beendet",
};

/** Was im Ausland gerade zählt: Konflikte mit uns, hohe Spannungen, Vermittlungen, der EU-Beitritt. */
function auslandPunkte(world: World, z: ZeitungZustand): AuslandPunkt[] {
  const spiel = world.spiel;
  const out: AuslandPunkt[] = [];
  if (!spiel) return out;
  const imKrieg = new Set<string>();
  for (const k of spiel.kriege ?? []) {
    if (k.phase === "beendet" || k.phase === "frieden") continue;
    const l = LAENDER.find((x) => x.id === k.land);
    if (!l) continue;
    imKrieg.add(l.id);
    out.push({ art: "krieg", land: l.name, dat: l.dat, phase: PHASE_NAME[k.phase] ?? k.phase, eskalation: Math.round(k.eskalation), tage: Math.max(0, world.day - k.seit) });
  }
  const spannungen = LAENDER.filter((l) => !imKrieg.has(l.id))
    .map((l) => ({ l, wert: spiel.welt?.[l.id]?.konflikt }))
    .filter((x): x is { l: (typeof LAENDER)[number]; wert: number } => typeof x.wert === "number" && x.wert >= 60)
    .sort((a, b) => b.wert - a.wert)
    .slice(0, 2);
  for (const s of spannungen) {
    const vorher = z.auslandVorher?.[s.l.id];
    out.push({ art: "spannung", land: s.l.name, dat: s.l.dat, wert: Math.round(s.wert), ...(vorher !== undefined ? { vorher: Math.round(vorher) } : {}) });
  }
  for (const [id, kz] of Object.entries(spiel.vermittlung ?? {})) {
    if (kz.einigung !== undefined || kz.konfliktIndex < 55) continue;
    const vorher = z.auslandVorher?.[`v:${id}`];
    out.push({ art: "vermittlung", titel: KONFLIKT_NACH_ID[id]?.titel ?? id, konflikt: Math.round(kz.konfliktIndex), reif: Math.round(kz.reif), ...(vorher !== undefined ? { konfliktVorher: Math.round(vorher) } : {}) });
  }
  const eu = spiel.eu;
  if (eu && eu.phase !== "eingefroren") {
    const kapitel = Object.values(eu.kapitel);
    out.push({
      art: "eu",
      phase: eu.phase,
      abgeschlossen: kapitel.filter((k) => k.status === "abgeschlossen").length,
      offen: kapitel.filter((k) => k.status === "offen").length,
      gesamt: kapitel.length,
    });
  }
  return out;
}

function auslandZeile(world: World, p: AuslandPunkt): ZeitungAuslandZeile {
  switch (p.art) {
    case "krieg": {
      const l = LAENDER.find((x) => x.name === p.land);
      return { text: tx("sim2.sim.zeitung.ad1846e", { p0: p.dat, p1: p.phase, p2: p.eskalation }), ...(l ? { ziel: { art: "land" as const, id: l.id } } : {}) };
    }
    case "spannung": {
      const l = LAENDER.find((x) => x.name === p.land);
      return { text: tx("sim2.sim.zeitung.85b2eb9", { p0: p.dat, p1: p.wert, p2: p.vorher !== undefined ? (p.vorher === p.wert ? " (unverändert)" : ` (zuvor ${p.vorher})`) : "" }), ...(l ? { ziel: { art: "land" as const, id: l.id } } : {}) };
    }
    case "vermittlung":
      return { text: tx("sim2.sim.zeitung.19eb96d", { p0: p.titel, p1: p.konflikt, p2: p.reif }), ziel: { art: "akte", akte: "welt" } };
    case "eu":
      return { text: tx("sim2.sim.zeitung.65ba3bc", { p0: p.phase, p1: p.abgeschlossen, p2: p.gesamt, p3: p.offen }), ziel: { art: "akte", akte: "welt" } };
  }
  void world;
}

/** Zeilen aus dem Weltmodell (Wahlen, Machtwechsel, Krisen anderer Staaten) seit der letzten Ausgabe, die wichtigsten zuerst. */
function weltZeilen(world: World, z: ZeitungZustand): ZeitungAuslandZeile[] {
  return weltNachrichten(world, z.letzteMonatsausgabeTag, 3).map((n) => ({ text: `${n.land}: ${n.titel}. ${n.fakt}`, ziel: { art: "land" as const, id: n.id } }));
}

// ---------------------------------------------------------------------------
// Vorgänge: die Realität des Monats

const prozentText = (x: number) => `${fmt(x)} Prozent`;

function ueberblickVorgang(world: World, zahlen: ZeitungKennzahl[]): ZeitungVorgang {
  const k = zahlen.filter((x) => x.id !== "zustimmung");
  const get = (id: ZeitungKennzahl["id"]) => k.find((x) => x.id === id);
  const infl = get("inflation");
  const arbeit = get("arbeit");
  const wachstum = get("wachstum");
  const teile = [
    infl ? `Inflation ${prozentText(infl.wert)}` : "",
    arbeit ? `Arbeitslosigkeit ${prozentText(arbeit.wert)}` : "",
    wachstum ? `Wachstum ${prozentText(wachstum.wert)}` : "",
  ].filter(Boolean);
  const fakt = tx("sim2.sim.zeitung.0828ab6", { p0: teile.join(", "), p1: prozentText(world.economy.policyRate), p2: fmt(world.economy.usdTry) });
  const mittel = k.length ? k.reduce((s, x) => s + kzBewertung(x), 0) / k.length : 0;
  return {
    id: `ueberblick-${world.day}`,
    art: "ueberblick",
    sparte: "wirtschaft",
    titel: tx("sim2.sim.zeitung.55adf36"),
    fakt,
    wertung: clamp(mittel * 0.4, -0.6, 0.6),
    tag: world.day,
    datum: world.date,
    daten: { typ: "ueberblick", zahlen: k.map(({ id, wert, vorher, gut }) => ({ id, wert, gut, ...(vorher !== undefined ? { vorher } : {}) })) },
  };
}

/** Die größten Wirtschaftsbewegungen seit der letzten Ausgabe (veröffentlichte Werte, nie die verdeckten). */
function wirtschaftVorgaenge(world: World, z: ZeitungZustand): ZeitungVorgang[] {
  const kandidaten: { titel: string; fakt: string; wertung: number; schwere: number; daten: VorgangDaten }[] = [];
  const infl = world.published.inflation;
  const dInfl = infl.value - z.wirtschaft.inflation;
  const startInfl = world.spiel?.start.inflation;
  if (Math.abs(dInfl) >= 0.75) {
    kandidaten.push({
      titel: dInfl > 0 ? "Teuerung zieht an" : tx("sim2.sim.zeitung.e5e20de"),
      fakt: tx("sim2.sim.zeitung.c108bf2", { p0: fmt(infl.value), p1: fmt(z.wirtschaft.inflation), p2: formatMonthDe(infl.period) }),
      wertung: dInfl > 0 ? -0.7 : 0.55,
      schwere: Math.abs(dInfl),
      daten: { typ: "kennzahl", kennzahl: "inflation", wert: infl.value, vorher: z.wirtschaft.inflation, ...(startInfl !== undefined ? { start: startInfl } : {}), stand: formatMonthDe(infl.period) },
    });
  }
  const dZins = world.economy.policyRate - z.wirtschaft.policyRate;
  if (Math.abs(dZins) >= 0.5) {
    kandidaten.push({
      titel: dZins > 0 ? tx("sim2.sim.zeitung.638fea9") : tx("sim2.sim.zeitung.e667661"),
      fakt: tx("sim2.sim.zeitung.6d9e2ea", { p0: fmt(world.economy.policyRate), p1: fmt(z.wirtschaft.policyRate) }),
      wertung: dZins > 0 ? -0.35 : 0.25,
      schwere: Math.abs(dZins) * 1.5,
      daten: { typ: "kennzahl", kennzahl: "zins", wert: world.economy.policyRate, vorher: z.wirtschaft.policyRate },
    });
  }
  const dLira = (world.economy.usdTry / z.wirtschaft.usdTry - 1) * 100;
  if (Math.abs(dLira) >= 2) {
    kandidaten.push({
      titel: dLira > 0 ? tx("sim2.sim.zeitung.a156552") : tx("sim2.sim.zeitung.ea8892d"),
      fakt: tx("sim2.sim.zeitung.160b22e", { p0: fmt(world.economy.usdTry), p1: fmt(Math.abs(dLira)), p2: dLira > 0 ? "mehr" : "weniger" }),
      wertung: dLira > 0 ? -0.6 : 0.4,
      schwere: Math.abs(dLira) / 2,
      daten: { typ: "kennzahl", kennzahl: "lira", wert: world.economy.usdTry, vorher: z.wirtschaft.usdTry },
    });
  }
  kandidaten.sort((a, b) => b.schwere - a.schwere);
  return kandidaten.slice(0, 2).map((k, i) => ({ id: `wirt-${world.day}-${i}`, art: "wirtschaft" as const, sparte: "wirtschaft" as const, titel: k.titel, fakt: k.fakt, wertung: k.wertung, tag: world.day, datum: world.date, daten: k.daten }));
}

/** Eine akute Lage als Vorgang: das Problem mit der größten Bewegung zum Vormonat, sonst reihum eines der drei größten. */
function lageVorgang(world: World, punkte: LagePunkt[]): ZeitungVorgang | null {
  if (!punkte.length) return null;
  const mitDelta = punkte.filter((p) => p.vorher !== undefined).map((p) => ({ p, d: p.provinzen - p.vorher! }));
  const bewegt = [...mitDelta].filter((x) => Math.abs(x.d) >= 2).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
  const fokus = bewegt?.p ?? punkte[monatIndex(world.date) % Math.min(3, punkte.length)]!;
  const gebessert = mitDelta.filter((x) => x.d <= -2 && x.p.id !== fokus.id).sort((a, b) => a.d - b.d).map((x) => x.p).slice(0, 2);
  const gebessertFokus = bewegt && bewegt.d <= -2 ? [fokus, ...gebessert] : gebessert;
  const weitere = punkte.filter((p) => p.id !== fokus.id).slice(0, 2);
  const verschlechtert = bewegt !== undefined && bewegt.d >= 2;
  const verbessert = bewegt !== undefined && bewegt.d <= -2;
  const vergleich = fokus.vorher !== undefined ? ` (Vormonat ${fokus.vorher})` : "";
  const wertung = clamp(-(0.15 + 0.5 * fokus.anteil) - (verschlechtert ? 0.15 : 0) + (verbessert ? 0.45 : 0), -0.8, 0.3);
  return {
    id: `lage-${world.day}`,
    art: "lage",
    sparte: "ereignis",
    titel: tx("sim2.sim.zeitung.0197449", { p0: fokus.name, p1: fokus.provinzen, p2: fokus.provinzen === 1 ? "Provinz" : "Provinzen" }),
    fakt: tx("sim2.sim.zeitung.e1917c3", { p0: fokus.name, p1: fokus.provinzen, p2: fokus.provinzen === 1 ? "Provinz" : "Provinzen", p3: vergleich, p4: Math.round(fokus.anteil * 100), p5: fokus.schlimmste }),
    wertung,
    tag: world.day,
    datum: world.date,
    daten: { typ: "lage", fokus, weitere, gebessert: gebessertFokus },
  };
}

/** Ein Ausland-Vorgang: ein laufender Konflikt immer, sonst nur, was sich seit dem Vormonat spürbar bewegt hat. */
function auslandVorgang(world: World, punkte: AuslandPunkt[]): ZeitungVorgang | null {
  const krieg = punkte.find((p) => p.art === "krieg");
  const vermittlung = punkte.find((p) => p.art === "vermittlung" && (p.konfliktVorher === undefined || Math.abs(p.konflikt - p.konfliktVorher) >= 5));
  const spannung = punkte.find((p) => p.art === "spannung" && (p.vorher === undefined || Math.abs(p.wert - p.vorher) >= 5 || p.wert >= 75));
  const p = krieg ?? vermittlung ?? spannung;
  if (!p) return null;
  const zeile = auslandZeile(world, p).text;
  const wertung = p.art === "krieg" ? -0.5 : p.art === "spannung" ? (p.vorher !== undefined && p.wert < p.vorher ? 0.2 : -0.3) : p.art === "vermittlung" ? 0.1 : 0.2;
  const titel = p.art === "krieg" || p.art === "spannung" ? tx("sim2.sim.zeitung.24b1640", { p0: p.dat }) : p.art === "vermittlung" ? p.titel : "EU-Beitritt";
  return { id: `ausland-${world.day}`, art: "ausland", sparte: "welt", titel, fakt: `${zeile}.`, wertung, tag: world.day, datum: world.date, daten: { typ: "ausland", punkt: p } };
}

/** Wirkungsberichte, die seit der letzten Ausgabe erschienen sind, als Vorgänge mit Zahlen statt roher Logzeile. */
function berichtVorgaenge(world: World, z: ZeitungZustand): ZeitungVorgang[] {
  const out: ZeitungVorgang[] = [];
  (world.spiel?.berichte ?? []).forEach((r, i) => {
    if (r.tag <= z.letzteMonatsausgabeTag || r.tag >= world.day) return;
    out.push(berichtZuVorgang(r, i));
  });
  // Die zwei mit der deutlichsten Bewegung
  return out.sort((a, b) => Math.abs(b.wertung) - Math.abs(a.wertung)).slice(0, 2);
}

const ZAHL = "([\\d.]+(?:,\\d+)?)";
const num = (s: string): number => Number(s.replace(/\./g, "").replace(",", "."));

/** Zerlegt die Textzeilen eines Wirkungsberichts in Zahlen; was nicht passt, bleibt als Rohzeile erhalten. */
export function berichtZuVorgang(r: Bericht, index: number): ZeitungVorgang {
  const t = new RegExp(tx("sim2.sim.zeitung.d1d87fa")).exec(r.titel);
  const name = t?.[1] ?? r.titel;
  const von = t ? Number(t[2]) : 0;
  const auf = t ? Number(t[3]) : 0;
  const veraenderungen: { name: string; von: number; auf: number }[] = [];
  const akut: { name: string; von: number; auf: number }[] = [];
  const roh: string[] = [];
  for (const zeile of r.zeilen) {
    const a = new RegExp(tx("sim2.sim.zeitung.4fe013f", { p0: ZAHL, p1: ZAHL, p2: ZAHL })).exec(zeile);
    const b = /^(.+?): akut in (\d+) auf (\d+) Provinzen$/.exec(zeile);
    if (a) veraenderungen.push({ name: a[1]!, von: num(a[2]!), auf: num(a[3]!) });
    else if (b) akut.push({ name: b[1]!, von: Number(b[2]), auf: Number(b[3]) });
    else roh.push(zeile);
  }
  veraenderungen.sort((x, y) => Math.abs(y.auf - y.von) - Math.abs(x.auf - x.von));
  const rest = /noch etwa (\d+) Monat/.exec(r.hinweis);
  const wertung = r.urteil === "gut" ? 0.4 : r.urteil === "keine" ? -0.35 : r.urteil === "gemischt" ? 0 : -0.1;
  return {
    id: `bericht-${r.tag}-${index}`,
    art: "bericht",
    sparte: "programm",
    titel: tx("sim2.sim.zeitung.a3cd068", { p0: name }),
    // Was sich nicht in Zahlen zerlegen ließ (anderes Zeilenformat), bleibt im Fakt stehen — es geht nichts verloren
    fakt: tx("sim2.sim.zeitung.4c7f9a2", { p0: r.monate, p1: name, p2: von, p3: auf, p4: !veraenderungen.length && !akut.length && roh.length ? ` ${roh.join("; ")}.` : "" }),
    wertung,
    tag: r.tag,
    datum: r.datum,
    daten: { typ: "bericht", name, monate: r.monate, urteil: r.urteil, von, auf, veraenderungen, akut, ...(rest ? { rest: Number(rest[1]) } : {}) },
  };
}

/** Chronik-Einträge des Monats als Vorgänge (Ereignisse, Skandale, Programme) — ohne das, was die Eilmeldung schon griff. */
function chronikVorgaenge(world: World, z: ZeitungZustand): ZeitungVorgang[] {
  const spiel = world.spiel!;
  const gesperrt = z.warteschlange.flatMap((v) => v.schluessel ?? []);
  const out: ZeitungVorgang[] = [];
  for (const c of spiel.chronik) {
    if (c.tag <= z.letzteMonatsausgabeTag || c.tag >= world.day) continue;
    if (gesperrt.some((s) => c.titel.includes(s) || c.ausgang.includes(s))) continue;
    if (/^(Der Präsident wirkt|Die Lage beruhigt|Überlastung)/.test(c.titel)) continue; // Verfassung ist intern
    if (c.titel.startsWith("Wirkungsbericht:")) continue; // erscheint mit Zahlen über spiel.berichte
    let art: VorgangArt = "ereignis";
    let sparte: Sparte = "ereignis";
    let wertung = c.ausgang.startsWith("Keine Entscheidung") || c.ausgang.startsWith("Ausgesessen") ? -0.55 : -0.15;
    let daten: VorgangDaten | undefined;
    const programm = /^(Schritt erreicht|Programm erfüllt): (.+)$/.exec(c.titel);
    if (c.titel.includes("packt aus")) {
      art = "skandal";
      sparte = "politik";
      wertung = -0.9;
    } else if (programm) {
      art = "programm";
      sparte = "programm";
      wertung = 0.5;
      daten = { typ: "programm", schritt: programm[2]!, erfuellt: programm[1] === "Programm erfüllt" };
    } else if (/^Haushaltsgesetz/.test(c.titel)) {
      const ja = c.ausgang.includes("angenommen") && !c.ausgang.includes("abgelehnt");
      art = "gesetz";
      sparte = "politik";
      wertung = ja ? 0.3 : -0.5;
      daten = { typ: "gesetz", name: c.titel, ja };
    } else if (/^(Verfassung|Referendum)/.test(c.titel)) {
      sparte = "politik";
      wertung = /in Kraft|angenommen|zulässt|lässt das Paket zu/.test(`${c.titel} ${c.ausgang}`) ? 0.3 : /gescheitert|kassiert|verloren|tot/.test(`${c.titel} ${c.ausgang}`) ? -0.6 : 0;
    } else if (/^(EU-|Kapitel \d|Zollunion)/.test(c.titel)) {
      sparte = "welt";
      wertung = /geschlossen|modernisiert|angekündigt/.test(c.titel) ? 0.3 : 0.1;
    } else if (/^(Frieden mit|Niederlage gegen)/.test(c.titel)) {
      sparte = "welt";
      wertung = c.titel.startsWith("Frieden") ? 0.5 : -0.9;
    } else if (/bewältigt$/.test(c.titel)) {
      wertung = 0.4;
    } else if (c.titel === "Zusammenbruch") {
      wertung = -0.6;
    }
    out.push({ id: `chronik-${c.tag}-${out.length}`, art, sparte, titel: c.titel, fakt: `${c.titel}: ${c.ausgang}`, wertung, tag: c.tag, datum: c.datum, ...(daten ? { daten } : {}) });
  }
  // Die vier folgenreichsten, in zeitlicher Reihenfolge
  return [...out]
    .sort((a, b) => Math.abs(b.wertung) - Math.abs(a.wertung) || b.tag - a.tag)
    .slice(0, 4)
    .sort((a, b) => a.tag - b.tag);
}

/** Beschlossene und gescheiterte Gesetze des Monats aus dem Protokoll. */
function gesetzVorgaenge(world: World, z: ZeitungZustand): ZeitungVorgang[] {
  const out: ZeitungVorgang[] = [];
  for (const l of world.log) {
    if (l.day <= z.letzteMonatsausgabeTag || l.day >= world.day || l.kind !== "entscheidung") continue;
    const ja = /^Das Parlament nimmt „(.+)“ an/.exec(l.text);
    const nein = /^Das Parlament lehnt „(.+)“ ab/.exec(l.text);
    const m = ja ?? nein;
    if (!m) continue;
    out.push({
      id: `gesetz-${l.day}-${out.length}`,
      art: "gesetz",
      sparte: "politik",
      titel: m[1]!,
      fakt: ja ? tx("sim2.sim.zeitung.065f3a1", { p0: m[1] }) : `Das Parlament lehnt „${m[1]}" ab.`,
      wertung: ja ? 0.3 : -0.5,
      tag: l.day,
      datum: l.date,
      daten: { typ: "gesetz", name: m[1]!, ja: !!ja },
    });
  }
  return out.slice(-2);
}

/** Repressionsklima für die Umfrage-Messung: aus der Pressefreiheit abgeleitet (Recherche B.3). */
function angstklimaVon(world: World): number {
  const presse = nationalAverage(NET, world.net, "pressefreiheit");
  return clamp(Number.isFinite(presse) ? 100 - presse : 0, 0, 100);
}

/** Die Monatsausgabe: Routine, Eilmeldungen im Print, Umfrage des Instituts — und die Wirkung auf die Wählergruppen. */
export function zeitungMonat(world: World): void {
  const spiel = world.spiel;
  if (!spiel || spiel.ende) return;
  const z = zeitungVon(world);
  const monat = world.date.slice(0, 7);
  if (z.archiv.some((a) => a.anlass === "monatlich" && a.monat === monat)) return;
  const kontext = kontextVon(world);
  const rng = zeitungZufall(`${world.seed}|zeitung|${monat}`);
  // Der Zustand der Medien (Lizenzen aus den Reglern, Selbstzensur, Reichweite) wird fortgeschrieben, bevor die Ausgabe entsteht
  medienMonat(world);

  // Print holt auf, was Digital schon brachte (nur was VOR heute geschah — nicht das, was heute passiert)
  const printNachhol = z.warteschlange.filter((v) => v.tag < world.day);
  z.warteschlange = z.warteschlange.filter((v) => v.tag >= world.day);

  // Die Umfrage des Monats: ein Institut mit Haus-Bias misst, und manchmal bleibt die Zahl in der Schublade
  // Vor der Wahl gilt das Publikationsverbot (Wahlgesetz, `publikationsverbotTage` in data/umfrage_institute.ts): keine neue Zahl, auch nicht aus der Schublade
  const verbot = publikationsverbot(world);
  const ergebnis: UmfrageErgebnis = verbot ? {} : monatsUmfrage(spiel.umfrage.zustimmung, angstklimaVon(world), rng, z.letzteUmfrage);

  const zahlen = kennzahlenVon(world, z, ergebnis.umfrage);
  const lage = lagePunkte(world, z);
  const ausland = auslandPunkte(world, z);

  const vorgaenge: ZeitungVorgang[] = [
    ...printNachhol,
    ...chronikVorgaenge(world, z),
    ...berichtVorgaenge(world, z),
    ...gesetzVorgaenge(world, z),
    ...wirtschaftVorgaenge(world, z),
  ];
  const lv = lageVorgang(world, lage);
  if (lv) vorgaenge.push(lv);
  const av = auslandVorgang(world, ausland);
  if (av) vorgaenge.push(av);

  if (ergebnis.umfrage) {
    z.letzteUmfrage = ergebnis.umfrage.wert;
    const u = ergebnis.umfrage;
    const delta = u.vormonat !== undefined ? u.wert - u.vormonat : undefined;
    const stich = u.stichprobe !== undefined ? `Stichprobe ${u.stichprobe.toLocaleString("de-DE")}, Methode ${u.methode}` : tx("sim2.sim.zeitung.e2cb800", { p0: u.methode });
    vorgaenge.push({
      id: `umfrage-${world.day}`,
      art: "umfrage",
      sparte: "umfrage",
      titel: tx("sim2.sim.zeitung.345c08a", { p0: u.institut, p1: fmt(u.wert) }),
      fakt: tx("sim2.sim.zeitung.8477ef0", { p0: u.institut, p1: fmt(u.wert), p2: delta !== undefined ? ` (${delta >= 0 ? "+" : "−"}${fmt(Math.abs(delta))} zum Vormonat)` : "", p3: stich }),
      wertung: delta === undefined ? 0.05 : delta > 1 ? 0.4 : delta < -1 ? -0.5 : 0.05,
      tag: world.day,
      datum: world.date,
      daten: { typ: "umfrage", institut: u.institut, wert: u.wert, ...(delta !== undefined ? { delta } : {}), ...(u.stichprobe !== undefined ? { stichprobe: u.stichprobe } : {}) },
    });
  }
  const ueb = ueberblickVorgang(world, zahlen);
  vorgaenge.push(ueb);

  // Gesperrte Blätter erscheinen nicht; ein Ersatz aus derselben Richtung oder das Netz springt ein, sonst fehlt die Stimme
  const auswahl = blattAuswahlWelt(world, blattAuswahl(monatIndex(world.date)));
  const blaetter = baueBlaetter(auswahl.ids, vorgaenge, kontext, rng, z.naechsteNummer, zahlen, world);
  const ausgabe: ZeitungAusgabe = {
    nummer: z.naechsteNummer,
    datum: world.date,
    monat,
    anlass: "monatlich",
    blaetter,
    zahlen,
    lage: lage.slice(0, 3),
    ...(parlamentVon(world) ? { parlament: parlamentVon(world)! } : {}),
    ...(ausland.length || weltZeilen(world, z).length ? { ausland: [...ausland.map((p) => auslandZeile(world, p)), ...weltZeilen(world, z)] } : {}),
    ...(ergebnis.umfrage ? { umfrage: ergebnis.umfrage } : {}),
    ...(ergebnis.schublade ? { umfrageSchublade: ergebnis.schublade } : {}),
    ...(verbot ? { umfrageVerbot: true } : {}),
    ...(auswahl.gesperrt.length ? { gesperrt: auswahl.gesperrt.map((g) => ({ clusterId: g.id, name: blattDef(g.id).name, grund: g.grund })) } : {}),
  };
  legeAb(world, ausgabe);
  hinweis(world, ausgabe);
  z.letzteMonatsausgabeTag = world.day;
  z.wirtschaft = {
    inflation: world.published.inflation.value,
    policyRate: world.economy.policyRate,
    usdTry: world.economy.usdTry,
    arbeit: world.published.unemployment.value,
    wachstum: world.published.growth.value,
  };
  z.akutVorher = Object.fromEntries(lage.map((p) => [p.id, p.provinzen]));
  z.auslandVorher = Object.fromEntries([
    ...ausland.flatMap((p) => (p.art === "spannung" ? [[LAENDER.find((l) => l.name === p.land)?.id ?? p.land, p.wert] as [string, number]] : [])),
    ...Object.entries(spiel.vermittlung ?? {}).map(([id, kz]) => [`v:${id}`, kz.konfliktIndex] as [string, number]),
  ]);
  if (ergebnis.umfrage) z.umfrageReihe = [...(z.umfrageReihe ?? []), ergebnis.umfrage.wert].slice(-24);
  wendeWirkungAn(world, ausgabe);
}

// ---------------------------------------------------------------------------
// Eilmeldung: Digital berichtet noch am selben Tag, Print erst im nächsten Monat

export interface Grossereignis {
  art: "wahlsieg" | "bruch" | "krise" | "fertigstellung";
  titel: string;
  fakt: string;
  wertung: number;
  krieg?: boolean;
  schluessel?: string[];
}

const SPARTE_GROSS: Record<Grossereignis["art"], Sparte> = { wahlsieg: "politik", bruch: "politik", krise: "welt", fertigstellung: "programm" };

const nz = (x: number) => Math.round(x).toLocaleString("de-DE");

/**
 * Die Einordnung einer Eilmeldung aus dem Weltzustand zum Zeitpunkt des Ereignisses: Was feststeht, was offen ist,
 * und wohin der Leser jetzt gehen kann. Nur Angaben, die der Weltzustand hergibt — keine Platzhalter.
 */
function eilEinordnung(world: World, e: Grossereignis): { feststeht: string[]; offen: string[]; handlung?: ZeitungHandlung } {
  const spiel = world.spiel!;
  const text = `${e.titel} ${e.fakt}`;
  const feststeht: string[] = [];
  const offen: string[] = [];
  const land = LAENDER.find((l) => text.includes(l.name) || text.includes(l.dat) || text.includes(l.akk));
  const mehrheit = mehrheitVon(world);

  if (e.krieg || /Kriegsgefahr|Konflikt/.test(e.titel)) {
    const krieg = (spiel.kriege ?? []).find((k) => k.phase !== "beendet" && (!land || k.land === land.id));
    if (krieg) {
      const l = LAENDER.find((x) => x.id === krieg.land);
      feststeht.push(tx("sim2.sim.zeitung.2915b22", { p0: l?.dat ?? krieg.land, p1: PHASE_NAME[krieg.phase] ?? krieg.phase, p2: nz(krieg.eskalation), p3: krieg.mobilmachung }));
    } else if (land) {
      const w = spiel.welt?.[land.id];
      if (w) feststeht.push(tx("sim2.sim.zeitung.46a4eb9", { p0: land.dat, p1: nz(w.konflikt) }));
    }
    if (land) {
      const verhaeltnis = nationalAverage(NET, world.net, land.knoten);
      if (Number.isFinite(verhaeltnis)) offen.push(tx("sim2.sim.zeitung.9aa0184", { p0: nz(verhaeltnis) }));
    }
    offen.push(tx("sim2.sim.zeitung.c46005b"));
    return { feststeht, offen, handlung: land ? { text: tx("sim2.sim.zeitung.ea372c4", { p0: land.name }), ziel: { art: "land", id: land.id } } : { text: "Zur Weltkarte", ziel: { art: "akte", akte: "welt" } } };
  }

  if (e.art === "bruch") {
    if (mehrheit) feststeht.push(tx("sim2.sim.zeitung.8701375", { p0: mehrheit.lager, p1: mehrheit.duldung > 0 ? `, dazu ${mehrheit.duldung} geduldete` : "", p2: mehrheit.noetig }));
    const partei = Object.keys(world.parliament?.seats ?? {}).find((p) => text.includes(p));
    const fr = partei ? spiel.fraktionen?.[partei] : undefined;
    if (partei && fr) offen.push(tx("sim2.sim.zeitung.baf205d", { p0: partei, p1: nz(world.parliament!.seats[partei] ?? 0), p2: nz(fr.bereitschaft) }));
    return { feststeht, offen, handlung: { text: "Zum Parlament", ziel: { art: "akte", akte: "parlament" } } };
  }

  if (e.art === "wahlsieg") {
    feststeht.push(`Die Amtszeit ${spiel.amtszeit} beginnt.`);
    if (mehrheit) offen.push(tx("sim2.sim.zeitung.38c2703", { p0: mehrheit.lager }));
    return { feststeht, offen, handlung: { text: "Zur Chronik", ziel: { art: "akte", akte: "chronik" } } };
  }

  if (e.art === "fertigstellung") {
    offen.push(tx("sim2.sim.zeitung.34b4235"));
    const kultur = /Kirche|Moschee|Museum|Stätte|Wunder|Kultur|Palast|Denkmal|Theater|Bibliothek|Oper/.test(e.titel);
    return { feststeht, offen, handlung: { text: kultur ? tx("sim2.sim.zeitung.b89f9d7") : "Zum Reich: Infrastruktur", ziel: { art: "akte", akte: kultur ? "reich_kultur" : "reich_infra" } } };
  }

  if (/EU|Reformpaket|Screening|Kapitel|Zollunion|Visa/.test(text)) {
    const eu = spiel.eu;
    if (eu) {
      const kapitel = Object.values(eu.kapitel);
      feststeht.push(tx("sim2.sim.zeitung.06ed151", { p0: eu.phase, p1: kapitel.filter((k) => k.status === "abgeschlossen").length, p2: kapitel.length }));
    }
    offen.push(tx("sim2.sim.zeitung.e049e39"));
    return { feststeht, offen, handlung: { text: "Zur Weltkarte", ziel: { art: "akte", akte: "welt" } } };
  }

  if (/Wahlkampf/.test(e.titel)) return { feststeht, offen, handlung: { text: tx("sim2.sim.zeitung.cf8beb6"), ziel: { art: "akte", akte: "waehler" } } };

  if (/Lira|Währung|Zins|Inflation|Schulden|Kapital|Wirtschaft|Rezession|Zahlungs|Risiko|Krise/.test(e.titel)) {
    feststeht.push(tx("sim2.sim.zeitung.735a6c9", { p0: fmt(world.economy.usdTry), p1: prozentText(world.economy.policyRate), p2: prozentText(world.published.inflation.value) }));
    feststeht.push(tx("sim2.sim.zeitung.1b54558", { p0: nz(world.economy.riskPremium), p1: prozentText(world.economy.debtRatio) }));
    offen.push(tx("sim2.sim.zeitung.0f7dad7"));
    return { feststeht, offen, handlung: { text: "Zur Wirtschaftsakte", ziel: { art: "akte", akte: "wirtschaft" } } };
  }

  return { feststeht, offen, handlung: { text: "Zur Chronik", ziel: { art: "akte", akte: "chronik" } } };
}

/**
 * Großereignis (Wahlsieg, Vertragsbruch, Krise, Fertigstellung, Kriegsphase): Die digitalen
 * Cluster bringen es sofort (Eilmeldung), die Print-Blätter erst in der nächsten Monatsausgabe —
 * bis dahin liegt der Vorgang in der Warteschlange (Sichtbarkeits-Mechanik, Recherche A.5.4).
 */
export function zeitungEreignis(world: World, e: Grossereignis): void {
  const spiel = world.spiel;
  if (!spiel || spiel.ende) return;
  const z = zeitungVon(world);
  const einordnung = eilEinordnung(world, e);
  const vorgang: ZeitungVorgang = {
    id: `gross-${world.day}-${z.naechsteNummer}`,
    art: e.art,
    sparte: e.krieg ? "welt" : SPARTE_GROSS[e.art],
    titel: e.titel,
    fakt: e.fakt,
    wertung: e.wertung,
    tag: world.day,
    datum: world.date,
    gross: true,
    ...(e.krieg ? { krieg: true } : {}),
    ...(e.schluessel ? { schluessel: e.schluessel } : {}),
    daten: { typ: "eil", feststeht: einordnung.feststeht, offen: einordnung.offen },
    ...(einordnung.handlung ? { handlung: einordnung.handlung } : {}),
  };
  z.warteschlange.push(vorgang);

  const kontext = kontextVon(world);
  // Eilmeldung: das digitale Blatt mit der Meldung, dazu die Blätter des Monats ohne sie (Print folgt).
  // Ein Großereignis ist für das freie Netz zu groß zum Übersehen — Digital berichtet immer;
  // die Berichtswahrscheinlichkeit wirkt auf die Print-Aufarbeitung im nächsten Monat (und auf Routine).
  const eilBasis = ["digital_frei", ...blattAuswahl(monatIndex(world.date)).filter((id) => id !== "digital_frei")];
  const eilAuswahl = blattAuswahlWelt(world, eilBasis);
  const auswahl = eilAuswahl.ids;
  const netzName = blattDef("digital_frei").name;
  const blaetter: ZeitungBlatt[] = [];
  for (const id of auswahl) {
    const cluster = wirksamerCluster(world, medienCluster(id)!);
    const def = blattDef(id);
    if (cluster.digital) {
      // Die Einordnung steht in der Eilmeldung im eigenen Kasten; der Text wiederholt sie nicht (die Warteschlange behält sie für den Print)
      const artikel = artikelFuer(cluster, { ...vorgang, daten: undefined }, kontext, `e${z.naechsteNummer}-${id}`);
      const mitEinordnung: ZeitungArtikel = einordnung.feststeht.length || einordnung.offen.length ? { ...artikel, einordnung: { feststeht: einordnung.feststeht, offen: einordnung.offen } } : artikel;
      blaetter.push({ clusterId: id, name: def.name, unterzeile: def.unterzeile, digital: true, ton: framingFuer(cluster), artikel: [mitEinordnung], verschwiegen: [], reichweite: Math.round(reichweiteJetzt(world, id) * 100) / 100 });
    } else {
      blaetter.push({
        clusterId: id,
        name: def.name,
        unterzeile: def.unterzeile,
        digital: false,
        ton: framingFuer(cluster),
        artikel: [
          {
            id: `e${z.naechsteNummer}-${id}-hinweis`,
            art: "ereignis",
            sparte: "politik",
            schlagzeile: tx("sim2.sim.zeitung.79f8d6e"),
            text: [
              istGesperrt(world, "digital_frei")
                ? tx("sim2.sim.zeitung.a4a58e4", { p0: vorgang.titel, p1: netzName })
                : tx("sim2.sim.zeitung.39cfbfe", { p0: vorgang.titel, p1: netzName }),
            ],
            textQuelle: "regel",
            wirkung: 0,
            framing: { art: framingFuer(cluster), staerke: framingStaerke(cluster) },
            kurz: true,
          },
        ],
        verschwiegen: [vorgang.titel],
        reichweite: Math.round(reichweiteJetzt(world, id) * 100) / 100,
      });
    }
  }
  const zahlen = kennzahlenVon(world, z);
  const lage = lagePunkte(world, z);
  const ausland = auslandPunkte(world, z);
  const parl = parlamentVon(world);
  const ausgabe: ZeitungAusgabe = {
    nummer: z.naechsteNummer,
    datum: world.date,
    monat: world.date.slice(0, 7),
    anlass: "eilmeldung",
    blaetter,
    ...(eilAuswahl.gesperrt.length ? { gesperrt: eilAuswahl.gesperrt.map((g) => ({ clusterId: g.id, name: blattDef(g.id).name, grund: g.grund })) } : {}),
    zahlen,
    lage: lage.slice(0, 3),
    ...(parl ? { parlament: parl } : {}),
    ...(ausland.length || weltZeilen(world, z).length ? { ausland: [...ausland.map((p) => auslandZeile(world, p)), ...weltZeilen(world, z)] } : {}),
  };
  legeAb(world, ausgabe);
  hinweis(world, ausgabe);
  // Nur die digitale Reichweite wirkt schon jetzt; der Print-Effekt kommt mit der Monatsausgabe
  wendeWirkungAn(world, ausgabe);
}

// ---------------------------------------------------------------------------
// Spieler-Wirkung: Berichte bewegen die Wählergruppen, Schweigen lässt sie ruhig

/** Welche Wählergruppen ein Mediensegment ausmachen (Näherung nach data/medien.ts, A.5.2). */
const SEGMENT_GRUPPEN: Record<keyof MedienCluster["reichweiteSegmente"], [gruppe: string, anteil: number][]> = {
  laendlich_konservativ: [
    ["konservative", 0.5],
    ["landwirte", 0.3],
    ["rentner", 0.2],
  ],
  urban_alt: [
    ["arbeitnehmer", 0.6],
    ["rentner", 0.4],
  ],
  urban_jung: [["junge", 1]],
  kurdistan: [["minderheiten", 1]],
  akademisch: [["staedtische_saekulare", 1]],
};

/** Grundzug je Artikel: klein genug, dass eine einzelne Ausgabe nie kippt (Kalibrierung). */
const WIRKUNG_GRUNDZUG = 0.9;
/** Obergrenze je Gruppe und Ausgabe, damit auch Dauerfeuer nicht eskaliert. */
const WIRKUNG_DECKEL = 1.6;

/**
 * Die Stimmungswirkung einer Ausgabe je Wählergruppe: Reichweite des Clusters im Segment ×
 * Segment-Anteil der Gruppe × Wirkung des Artikels. Wer nicht berichtet, wirkt nicht —
 * so erreicht derselbe Skandal das ländliche Lager schwächer als die urbane Opposition (A.5.4).
 */
export function berechneWirkung(ausgabe: ZeitungAusgabe): Map<string, number> {
  const delta = new Map<string, number>();
  for (const blatt of ausgabe.blaetter) {
    const cluster = medienCluster(blatt.clusterId);
    if (!cluster) continue;
    for (const artikel of blatt.artikel) {
      if (artikel.wirkung === 0) continue;
      for (const [segment, gruppen] of Object.entries(SEGMENT_GRUPPEN)) {
        const reichweite = cluster.reichweiteSegmente[segment as keyof MedienCluster["reichweiteSegmente"]] * (blatt.reichweite ?? 1);
        if (reichweite <= 0) continue;
        for (const [gruppe, anteil] of gruppen) {
          const d = WIRKUNG_GRUNDZUG * artikel.wirkung * reichweite * anteil;
          delta.set(gruppe, clamp((delta.get(gruppe) ?? 0) + d, -WIRKUNG_DECKEL, WIRKUNG_DECKEL));
        }
      }
    }
  }
  return delta;
}

/** Wendet die Stimmungswirkung einer Ausgabe auf das Politiknetz an (Gruppen klingen von selbst wieder ab). */
export function wendeWirkungAn(world: World, ausgabe: ZeitungAusgabe): void {
  for (const [gruppe, delta] of berechneWirkung(ausgabe)) {
    if (Math.abs(delta) < 0.01) continue;
    wirke(world, gruppe, delta);
  }
}
