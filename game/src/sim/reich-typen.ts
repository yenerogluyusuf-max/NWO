// Das Reich: Bestand, Vorhaben und Vorteile der Fachbereiche (FACHBEREICHE.md).
// Ein Vorhaben ist etwas Einzelnes, das man beginnt, baut und im Bestand hält: ein Wunder, ein Großprojekt, eine Reform, eine Beschaffung.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen; Tatsachen stehen mit Quelle im Text.

import type { Dimension } from "./laender";

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
  art: "fertig" | "verfall" | "verzug" | "freigeschaltet" | "gesperrt";
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
}
