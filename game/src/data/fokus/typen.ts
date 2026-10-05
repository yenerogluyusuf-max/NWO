// Typdefinitionen für den Nationalen Fokusbaum („Agenda“).
// Vorbild: Hearts of Iron IV National Focus Trees & Civilization VI Kultur-/Politikbaum.
// Alle Werte sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import type { AchseId } from "../linien";

export type FokusAst =
  | "wirtschaft"   // Wirtschaftsordnung (Export vs. Autarkie, Staat vs. Markt)
  | "sicherheit"   // Sicherheit & Streitkräfte (Drohnen, Mavi Vatan, NATO vs. Souveränität)
  | "gesellschaft" // Gesellschaft & Kultur (Laizismus vs. Religion, Zivilgesellschaft)
  | "aussen"       // Außenpolitik & Bündnisse (EU-Harmonisierung vs. Türkische Welt vs. Blockfreiheit)
  | "staat"        // Staat, Justiz & Verfassung (Präsidialgewalt vs. Gewaltenteilung)
  | "regionen"     // Land, Infrastruktur & Megaprojekte (GAP, Kanal Istanbul, Erdbebenfestung)
  | "wissen";      // Innovation, Wissenschaft & Zukunft (KI, Raumfahrt, Halbleiter)

export interface FokusAstMeta {
  id: FokusAst;
  titel: string;
  titelTr: string;
  titelEn: string;
  beschreibung: string;
  farbe: string;
  ikone: string;
}

export type FokusBedingung =
  | { art: "massnahme"; id: string; min?: number; max?: number }
  | { art: "groesse"; id: string; min?: number; max?: number }
  | { art: "bestand"; id: string }
  | { art: "vorteil"; id: string }
  | { art: "achsen_naehe"; achse: AchseId; wert: number; toleranz: number }
  | { art: "krieg"; aktiv: boolean }
  | { art: "buendnis"; paktId: string }
  | { art: "jahr"; min: number };

export interface FokusWirkung {
  /** Dauerhafte Modifikatoren auf Kernmetriken */
  metriken?: Record<string, number>;
  /** Einmaliger Effekt bei Abschluss */
  sofortKapital?: number;
  sofortVertrauen?: number;
  /** Verschiebung der Parteilinie / des politischen Spektrums */
  achsenVerschiebung?: Partial<Record<AchseId, number>>;
  /** Prozentualer Rabatt auf Politikmaßnahmen einer Sparte */
  rabattThema?: { thema: string; anteil: number };
  /** Freischaltung spezieller Gesetze oder Erlasse */
  schaltetFrei?: string[];
  /** Geopolitische Auswirkung (z.B. Spannung, Vertrauen zu Allianzen) */
  weltSpannungDelta?: number;
  /** Militärische Doktrinpunkte oder Boni */
  militaerDoktrinPunkte?: number;
}

export interface FokusDefinition {
  id: string;
  ast: FokusAst;
  titel: string;
  titelTr: string;
  titelEn: string;
  untertitel: string;
  untertitelTr: string;
  untertitelEn: string;
  beschreibung: string;
  beschreibungTr: string;
  beschreibungEn: string;
  /** Vorgänger-Foki, die abgeschlossen sein müssen */
  voraus: string[];
  /** Sich gegenseitig ausschließende Foki (HOI4 Mutually Exclusive) */
  ausschluesse?: string[];
  /** Dauer in Tagen (meist 60 bis 180 Tage) */
  tage: number;
  /** Kosten in politischem Kapital */
  kapital: number;
  /** Benötigte Aufmerksamkeit (Slots) */
  aufmerksamkeit: number;
  /** Bedingungen in der Spielwelt vor Aktivierung */
  bedingungen?: FokusBedingung[];
  /** Wirkungen bei Vollendung */
  wirkung: FokusWirkung;
  /** Historisches Zitat oder Leitspruch bei Vollendung */
  zitat?: {
    text: string;
    urheber: string;
  };
  /** Grafische Position im Baum-Raster (Spalte 1..N, Zeile 1..N) */
  raster: {
    spalte: number;
    zeile: number;
  };
}
