// Das Reich: Bestand, Vorhaben und Vorteile der Fachbereiche (FACHBEREICHE.md).
// Ein Vorhaben ist etwas Einzelnes, das man beginnt, baut und im Bestand hält: ein Wunder, ein Großprojekt, eine Reform, eine Beschaffung.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen; Tatsachen stehen mit Quelle im Text.

import type { Dimension } from "./laender";
import type { Angebot } from "./abkommen-typen";
import { t } from "../i18n";

export type Bereich = "kultur" | "recht" | "militaer" | "infrastruktur" | "haushalt";



/** Objekt mit festen Schlüsseln, dessen Werte bei jedem Lesen aus dem Katalog kommen */
function sprachObjekt<K extends string>(schluessel: readonly K[], wert: (k: K) => string): Record<K, string> {
  const o = {} as Record<K, string>;
  for (const k of schluessel) Object.defineProperty(o, k, { get: () => wert(k), enumerable: true });
  return o;
}

export type Klasse =
  | "wunder"
  | "grossprojekt"
  | "serie"
  | "restaurierung"
  | "ausbau"
  | "reform"
  | "beschaffung"
  | "institution"
  | "doktrin"
  | "sonderrecht"
  | "forschung";

export const BEREICH_NAMEN = sprachObjekt(["kultur", "recht", "militaer", "infrastruktur", "haushalt"] as Bereich[], (k) => t(`reich.bereich.${k}`)) as Record<Bereich, string>;

/** Namen der Klassen in der aktuellen Sprache (Katalog reichtypen.json); als Getter, damit ein Sprachwechsel sofort greift */
const KLASSEN: Klasse[] = ["wunder", "grossprojekt", "serie", "restaurierung", "ausbau", "reform", "beschaffung", "institution", "doktrin", "sonderrecht", "forschung"];
export const KLASSEN_NAMEN = sprachObjekt(KLASSEN, (k) => t(`reich.klasse.${k}`)) as Record<Klasse, string>;

/** Themen der Ansicht „Neue Vorhaben“ (Vorhaben.thema), in der Reihenfolge der Anzeige. */
export const THEMEN: { id: string; titel: string; satz: string }[] = ["regional", "verkehr", "energie", "stadt", "raumfahrt", "ki", "technologie"].map((id) => ({
  id,
  get titel() { return t(`reich.thema.${id}.titel`); },
  get satz() { return t(`reich.thema.${id}.satz`); },
}));

/** Technologiefelder (Vorhaben.feld) in der Reihenfolge der Anzeige. */
export const FELDER: { id: string; titel: string }[] = ["meer", "luft", "bio", "chips", "energietech", "quanten", "robotik", "nano"].map((id) => ({
  id,
  get titel() { return t(`reich.feld.${id}`); },
}));

/** Was ein Vorhaben oder ein Vorteil in der Welt bewegt. Nichts davon ist nur Geld. */
export type Effekt =
  | { t: "knoten"; id: string; d: number; provinzen?: number[] }
  | { t: "land"; land: string; dim: Dimension; d: number }
  | { t: "kapital"; d: number }
  /** Prozentpunkte der Schuldenquote */
  | { t: "schulden"; d: number }
  /** Zustand einer Kulturstätte */
  | { t: "staette"; id: string; d: number }
  /** Alle Stätten einer Serie */
  | { t: "serie"; serie: string; d: number }
  /** Risikoaufschlag in Basispunkten */
  | { t: "risiko"; d: number }
  /** Nimmt ein Stück aus dem Bestand (abgegeben, stillgelegt) */
  | { t: "entferne"; id: string }
  /** Hebt oder senkt den Zustand eines Bestandsstücks (Sanierung, Instandsetzung) */
  | { t: "bestand"; id: string; d: number };

export type Voraussetzung =
  | { art: "bestand"; id: string }
  | { art: "nicht-bestand"; id: string; text: string }
  | { art: "staetten"; ids: string[]; min: number; text: string }
  | { art: "staette-max"; id: string; max: number; text: string }
  /** Ein Bestandsstück ist höchstens so gut erhalten (Pflege lohnt erst, wenn der Zustand nachgelassen hat) */
  | { art: "bestand-max"; id: string; max: number; text: string }
  | { art: "knoten"; id: string; min?: number; max?: number }
  | { art: "massnahme"; id: string; min?: number; max?: number }
  | { art: "land"; land: string; dim: Dimension; min?: number; max?: number }
  | { art: "vorteil"; id: string }
  | { art: "jahr"; min: number };

/**
 * Die drei Wege der Bauvergabe (INF-1, Suzerain-Vorbild): Wer bauen lässt, entscheidet einmal je Vorhaben,
 * wie der Auftrag vergeben wird — die Wahl steht danach fest.
 * Alle Faktoren und Schwellen dazu sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachen.
 */
export type Vergabe = "stammfirma" | "sparvergabe" | "ausschreibung";

export const VERGABE_NAMEN = sprachObjekt(["stammfirma", "sparvergabe", "ausschreibung"] as Vergabe[], (k) => t(`reich.vergabe.${k}`)) as Record<Vergabe, string>;

// ---------------------------------------------------------------------------
// Freie Großprojekte (INF-4, GRO-01/02; GROSSPROJEKTE.md und PLANERWEITERUNG.md, Nachtrag §8)
// Der Spieler tippt ein beliebiges Vorhaben; der Interpreter in sim/grossprojekt.ts zerlegt es,
// die Schätzung rechnet mit dem 3-Ebenen-Modell (direkte Effekte, Zweitrundeneffekte, politische Folgen).
// Alle Zahlen dazu sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

export type ProjektTyp = "schiene" | "strasse" | "hafen" | "flughafen" | "kanal" | "stadt" | "energie" | "prestige" | "wasser" | "sonstig";

export const PROJEKT_TYP_NAMEN: Record<ProjektTyp, string> = {
  schiene: "Schiene",
  strasse: "Straße",
  hafen: "Hafen",
  flughafen: "Flughafen",
  kanal: "Kanal",
  stadt: "Stadt",
  energie: "Energie",
  prestige: "Prestige",
  wasser: "Wasser",
  sonstig: "Vorhaben",
};

export type Massstab = "klein" | "regional" | "national" | "kontinental" | "weltgroesste";

export const MASSSTAB_NAMEN: Record<Massstab, string> = {
  klein: "klein",
  regional: "regional",
  national: "national",
  kontinental: "kontinental",
  weltgroesste: "größte der Welt",
};

/** Eine Schätzung als Band: Erwartungswert mit ehrlicher Unsicherheit nach unten und oben. */
export interface Band {
  tief: number;
  mitte: number;
  hoch: number;
}

/** Eine Wirkung der Schätzung: Richtung und Bandbreite; `vorlage` trägt Knoten/Land und den Mittelwert (mit Vorzeichen). */
export interface WirkungsBand {
  /** Anzeigename (Knoten- oder Ländername) */
  name: string;
  /** +1 steigt, −1 sinkt */
  richtung: 1 | -1;
  /** Ob das für das Land gut ist */
  gut: boolean;
  /** Bandbreite der Verschiebung in Punkten (Beträge) */
  band: Band;
  /** Mittlere Verschiebung mit Vorzeichen; bei der Annahme wird der verwirklichte Betrag im Band gezogen und mit diesem Vorzeichen versehen */
  wert: number;
  /** Effekt-Vorlage mit Mittelwert in `d`; bei der Annahme wird der verwirklichte Wert im Band gezogen */
  vorlage: Effekt;
  /** Ortsangabe in Worten, etwa „in 3 Provinzen“ */
  wo?: string;
}

export interface RisikoZeile {
  name: string;
  /** Formulierte Größenordnung, etwa „hoch“ oder „25 bis 60 % der Planung“ */
  wert: string;
  text: string;
}

/** Zweitrundeneffekt: eine Nachbarprovinz oder ein Nachbarland, die/ das wirtschaftlich abnimmt. */
export interface NachbarEffekt {
  name: string;
  art: "provinz" | "land";
  text: string;
}

/** Ein Land auf der Strecke eines grenzüberschreitenden Vorhabens (Bagdadbahn-Logik). */
export interface TransitSchritt {
  land: string;
  name: string;
  /** Vom Interpreter ergänzt (Korridor-Schätzung), nicht vom Spieler genannt */
  vermutet?: boolean;
}

/** Das Schätzblatt eines freien Großprojekts: Bänder statt Festpreise, Risiken, Mentorin-Text. */
export interface Schaetzung {
  eingabe: string;
  typ: ProjektTyp;
  massstab: Massstab;
  klasse: Klasse;
  name: string;
  pk: Band;
  /** Baupunkte insgesamt */
  bau: Band;
  monate: Band;
  /** Prozentpunkte der Schuldenquote über die Bauzeit */
  schulden: Band;
  /** Verwaltungskraft je Monat im Bau */
  verwaltung: number;
  /** Verwaltungskraft je Monat im Bestand */
  unterhalt: number;
  wirkungen: WirkungsBand[];
  risiken: RisikoZeile[];
  nachbarn: NachbarEffekt[];
  /** Grenzübertritte in Reihenfolge; leer/undefined = rein national */
  transit?: TransitSchritt[];
  /** Wahrscheinlichkeit, dass die Kostenüberschreitung im Bau eintritt (Spielparameter) */
  ueberzugP: number;
  /** Größe der Überschreitung als Anteil der Baukosten [tief, hoch] (Spielparameter) */
  ueberzugBand: [number, number];
  /** Mentorin-Text: erklärt Richtung und Bandbreite, nennt nie exakte Zahlen */
  mentor: string;
}

export type TransitStand = "offen" | "zusage" | "veto" | "umgangen";

/** Ein freies Großprojekt im Reich: Entwurf (Schätzblatt) oder begonnenes Vorhaben. */
export interface FreiEintrag {
  def: Vorhaben;
  schaetzung: Schaetzung;
  stand: "entwurf" | "begonnen";
  /** Transitland → Verhandlungsstand; ein Veto zwingt zum Umweg oder zur Aufgabe */
  transit?: Record<string, TransitStand>;
  /** Gegenangebot eines Transitlandes, das der Spieler annehmen kann */
  transitGegen?: Record<string, Angebot>;
}

/** Bilder der Wunder-Animation: einfache Silhouetten im Stil des Spiels. */
export type WunderBild =
  | "tempel"
  | "kuppel"
  | "bruecke"
  | "turm"
  | "tor"
  | "fels"
  | "damm"
  | "bahn"
  | "flughafen"
  | "schiff"
  | "kirche"
  | "reaktor"
  | "stadt"
  | "kanal"
  | "gericht"
  | "jet"
  | "kuppelschirm"
  // Nacht N6 (Befund F-26): eigene Motive je Art von Vorhaben
  | "panzer"
  | "drohne"
  | "rakete"
  | "satellit"
  | "rechenzentrum"
  | "chip"
  | "klinik"
  | "schule"
  | "mast"
  | "hafen"
  | "konferenz"
  | "wind"
  | "labor"
  | "uboot"
  | "wohnblock"
  | "strasse"
  | "museum"
  | "feld"
  | "mond"
  | "quanten"
  | "netzwerk"
  | "fabrik"
  | "roboter"
  | "leitung"
  | "bohrinsel"
  | "triebwerk"
  | "tunnel"
  | "bank";

export interface Vorhaben {
  id: string;
  bereich: Bereich;
  klasse: Klasse;
  name: string;
  /** Ein bis zwei Sätze: was es ist und warum es zählt */
  text: string;
  ort?: { lat: number; lon: number; plaka: number; name: string };
  /** Regionale Wirkung; sonst landesweit */
  provinzen?: number[];
  voraus: Voraussetzung[];
  kosten: {
    /** Politisches Kapital beim Beginn */
    pk: number;
    /** Baupunkte insgesamt */
    bau: number;
    /** Frühestens so viele Monate, auch mit reichlich Baukapazität */
    monate: number;
    /** Verwaltungskraft je Monat im Bau */
    verwaltung?: number;
    /** Schuldenquote in Prozentpunkten, verteilt über die Bauzeit */
    schulden?: number;
  };
  /** Einmalig bei Fertigstellung */
  abschluss: Effekt[];
  /** Jeden Monat, solange es im Bestand ist; skaliert mit dem Zustand */
  dauer?: Effekt[];
  /** Verwaltungskraft je Monat im Bestand */
  unterhalt?: number;
  /** Kapazität, die es dem Land gibt, solange es im Bestand ist */
  kapazitaet?: { bau?: number; verwaltung?: number };
  /** Wie der Preis in Worten lautet, der nicht im Geld steckt */
  kehrseite: string;
  /** Wählergruppe (Knoten-ID) oder Akteur, der verliert */
  verlierer?: string;
  /** Vorhaben derselben Astkennung schließen einander aus (Doktrinen, Reformwege) */
  ast?: string;
  /** Nur einmal je Partie (Wunder) */
  einmalig?: boolean;
  bild?: WunderBild;
  zitat?: { text: string; von: string };
  quelle?: string;
  /** Steht schon am Spielbeginn im Bestand (gebaut) oder im Bau */
  start?: { status: "fertig" | "im_bau"; zustand?: number; fortschritt?: number };
  /** Solange das gilt, ist das Vorhaben gesperrt (etwa ein blockiertes Rüstungsprogramm); Text erklärt es */
  sperre?: { solange: Voraussetzung; text: string };
  /** Frei eingegebenes Großprojekt (INF-4): Kosten und Wirkungen sind Schätzungen; Überschreitungen möglich */
  frei?: boolean;
  /** Größen, an denen man den Zustand eines Bestandsstücks ohne Zustandswirkung ablesen kann (etwa die Belegung der Haftanstalten) */
  zeigt?: string[];
  /** Dieses Vorhaben pflegt ein Bestandsstück (Instandsetzung): Kennung des gepflegten Stücks */
  pflegt?: string;
  /** Gruppe in „Neue Vorhaben“ (etwa „verkehr“, „energie“, „stadt“, „raumfahrt“, „ki“) */
  thema?: string;
  /** Stufe in einer Kette (1 = Einstieg); höhere Stufen verlangen die niedrigeren als Voraussetzung */
  stufe?: number;
  /** Möglich, aber extrem schwierig und sehr teuer: Prestigeprojekte über Jahrzehnte, keine Abkürzung zum Sieg */
  unrealistisch?: boolean;
  /** Maßstab des Preises in Worten („Spielparameter, Analogie zu …“); keine erfundene Genauigkeit */
  anker?: string;
  /** Wirkt jeden Monat, solange gebaut wird: Aufbruch und Arbeit, aber auch Lasten */
  bauwirkung?: Effekt[];
  /** Kostenüberschreitung im Bau: Wahrscheinlichkeit, Größe als Anteil der Baupunkte und Marken des Baufortschritts (Standard 35 %); gewürfelt wird aus Spielstand und Vorhaben, ohne den Zufallsstrom des Spiels anzuzapfen */
  ueberzug?: { p: number; band: [number, number]; an?: number[] };
  /** Kein Bestandsstück, das man pflegen könnte (eine Mission, ein Abkommen) */
  ohnePflege?: boolean;
  /** Vorlage für Vorhaben in gewählten Provinzen: Die Werte gelten für das ganze Land, der Spieler wählt den Ort */
  vorlage?: Vorlage;
  /** Instanz einer Vorlage (für gewählte Provinzen angelegt): Kennung der Vorlage */
  instanzVon?: string;
  /** Technologiefeld innerhalb des Themas „technologie“ (siehe FELDER) */
  feld?: string;
  /** Konkurrenz und Spionage: was andere Staaten tun, die dasselbe wollen oder mitlesen */
  konkurrenz?: string;
  /** Ungewisser Durchbruch: Bei dieser Marke des Baufortschritts fällt der Wurf (deterministisch aus Spielstand und Vorhaben); trifft er, scheitert das Vorhaben, und das Geld ist verloren. `folge` sind die Wirkungen des Scheiterns (Standard: Ansehen und Legitimität sinken). */
  scheitern?: { p: number; an: number; folge?: Effekt[] };
}

/** Eine Vorlage für Vorhaben, die der Spieler für einzelne Provinzen, eine Region oder das ganze Land anlegt (Wohnungsbau, Schulen, Wasser …). */
export interface Vorlage {
  /** Maßnahme des Politiknetzes; nach ihr fragt die Ortswahl „wo es akut ist“ */
  massnahme: string;
  /** Wonach Kosten und Dauer skalieren: nach der Bevölkerung der Provinzen (Standard) oder nach der Zahl der Stätten dort */
  nach?: "bevoelkerung" | "staetten";
  /** Kurzer Name für Meldungen und Chips („Wohnungsbau“) */
  kurz: string;
}

export interface BestandEintrag {
  seit: string;
  /** 0 bis 100: Der Zustand skaliert die Dauerwirkung; er verfällt ohne Pflege */
  zustand: number;
}

export interface LaufEintrag {
  id: string;
  /** Erreichte Baupunkte */
  fortschritt: number;
  start: string;
  pausiert?: boolean;
  /** Gewählte Bauvergabe; fehlt in älteren Spielständen und beim Schnellstart, dann gilt „ausschreibung“ */
  vergabe?: Vergabe;
  /** Wirksame Baupunkte insgesamt, beim Beginn nach der Vergabe festgelegt (sonst Katalogwert) */
  bau?: number;
  /** Wirksame Mindestbauzeit in Monaten, beim Beginn nach der Vergabe festgelegt (sonst Katalogwert) */
  monate?: number;
  /** Bis zu diesem Tag läuft die Vergabephase; erst danach fließt Baukapazität (transparente Ausschreibung) */
  vergabeBis?: number;
  /** Zustand, mit dem das fertige Stück in den Bestand geht (Sparvergabe beginnt niedriger; sonst 90) */
  zustandFertig?: number;
  /** Frei eingegebenes Großprojekt (INF-4): die Schätzung steht in ReichZustand.frei */
  frei?: boolean;
  /** Kostenüberschreitung freier Projekte: ob an der 35-%-Marke schon gewürfelt wurde */
  ueberzugGeprueft?: boolean;
  /** Ausgangslage beim Beginn: Größe → Wert (Landes- oder Provinzdurchschnitt), damit nach der Fertigstellung Vorher und Nachher stehen */
  vorher?: Record<string, number>;
  /** Bei Pflege und Restaurierung: Zustand des Stücks beim Beginn */
  zustandVorher?: number;
  /** Bei Vorhaben mit Kostenüberschreitung (Katalog): wie viele Marken schon geprüft sind */
  ueberzugN?: number;
  /** Bei Vorhaben mit ungewissem Durchbruch: ob der Wurf schon gefallen ist */
  durchbruchGeprueft?: boolean;
}

/** Ein Vorhaben, das aus einer Vorlage für gewählte Provinzen angelegt wurde; die Definition steht im Spielstand. */
export interface RegionalEintrag {
  vorlage: string;
  provinzen: number[];
  def: Vorhaben;
  /** Die Instandsetzung für das fertige Stück */
  pflege?: Vorhaben;
  angelegt: string;
}

/** Ein abgeschlossener Eingriff mit Vorher und Nachher: Bau, Instandsetzung oder Restaurierung. */
export interface Eingriff {
  id: string;
  name: string;
  tag: number;
  datum: string;
  art: "bau" | "pflege";
  /** Größe → Wert beim Beginn */
  vorher: Record<string, number>;
  /** Größe → Wert am Tag der Fertigstellung (die Stöße des Abschlusses sind eingerechnet, die Dauerwirkung baut sich danach auf) */
  nachher: Record<string, number>;
  /** Bei Pflege und Restaurierung: Zustand des Stücks vorher und nachher */
  zustand?: { vorher: number; nachher: number };
}

export interface StaetteZustand {
  zustand: number;
  /** Nutzungsmodus, bei manchen Stätten eine Entscheidung (Museum, Moschee, geteilte Nutzung) */
  modus?: string;
}

export interface ReichMeldung {
  tag: number;
  datum: string;
  text: string;
  art: "fertig" | "verfall" | "verzug" | "freigeschaltet" | "gesperrt" | "ueberzug" | "gescheitert";
}

export interface ReichZustand {
  /** Verwaltungskraft, Vorrat 0 bis 100 */
  verwaltung: number;
  bestand: Record<string, BestandEintrag>;
  laufend: LaufEintrag[];
  staetten: Record<string, StaetteZustand>;
  vorteile: string[];
  /** Ast → gewähltes Vorhaben */
  gewaehlt: Record<string, string>;
  meldungen: ReichMeldung[];
  /** Kennungen frisch fertiggestellter Vorhaben, die die Oberfläche noch feiert (Wunder-Animation) */
  feier: string[];
  /** Laufender Baufortschritt des letzten Monats (Anzeige): genutzte Baupunkte */
  bauGenutzt: number;
  /** Besetzung der Gerichte nach Lagern (Sitze): loyal zur Regierung, unabhängig, reformorientiert */
  sitze: Record<string, { loyal: number; unabhaengig: number; reform: number }>;
  /** Frei eingegebene Großprojekte (INF-4): Entwürfe mit Schätzung und begonnene Vorhaben; fehlt in älteren Spielständen */
  frei?: Record<string, FreiEintrag>;
  /** Abgeschlossene Eingriffe mit Vorher und Nachher, neueste zuletzt; fehlt in älteren Spielständen */
  verlauf?: Eingriff[];
  /** Für Provinzen angelegte Vorhaben (aus Vorlagen); fehlt in älteren Spielständen */
  regional?: Record<string, RegionalEintrag>;
}
