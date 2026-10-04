// Das Reich: Bestand, Vorhaben und Vorteile der Fachbereiche (FACHBEREICHE.md).
// Ein Vorhaben ist etwas Einzelnes, das man beginnt, baut und im Bestand hält: ein Wunder, ein Großprojekt, eine Reform, eine Beschaffung.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen; Tatsachen stehen mit Quelle im Text.

import type { Dimension } from "./laender";
import type { Angebot } from "./abkommen-typen";

export type Bereich = "kultur" | "recht" | "militaer" | "infrastruktur" | "haushalt";

export const BEREICH_NAMEN: Record<Bereich, string> = {
  kultur: "Kultur und Erbe",
  recht: "Recht und Justiz",
  militaer: "Streitkräfte",
  infrastruktur: "Infrastruktur",
  haushalt: "Haushalt und Verwaltung",
};

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
  | "sonderrecht";

export const KLASSEN_NAMEN: Record<Klasse, string> = {
  wunder: "Wunder",
  grossprojekt: "Großprojekt",
  serie: "Themenroute",
  restaurierung: "Restaurierung",
  ausbau: "Ausbau",
  reform: "Reform",
  beschaffung: "Beschaffung",
  institution: "Institution",
  doktrin: "Doktrin",
  sonderrecht: "Sonderrecht",
};

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

export const VERGABE_NAMEN: Record<Vergabe, string> = {
  stammfirma: "Stammfirma",
  sparvergabe: "Sparvergabe",
  ausschreibung: "Transparente Ausschreibung",
};

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
  | "kuppelschirm";

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
  art: "fertig" | "verfall" | "verzug" | "freigeschaltet" | "gesperrt" | "ueberzug";
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
}
