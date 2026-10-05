// Typdefinitionen für den Wissens- und Technologiebaum mit Eureka-System.
// Vorbild: Civilization VI Technologiebaum mit Heureka-Momenten & HOI4 Forschungsplätzen.
// Alle Werte sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

export type TechFeld =
  | "digital_ki"      // Mikroelektronik, KI-Modelle, Quantenbit
  | "energie_umwelt"  // Fusionsforschung, Speicher, Geothermie, Wasserstoff
  | "aerospace_raum"  // Turbofan-Triebwerke, Hyperschall, Satelliten, Mondlandung
  | "bio_gesundheit"  // mRNA-Impfstoffe, Genomik, Bioengineering
  | "marine_meer"     // AIP-U-Boot-Antrieb, Tiefseebergbau, Meerwasserentsalzung
  | "material_nano";  // Graphen, Verbundwerkstoffe, ballistische Keramiken

export type TechEpoche = 1 | 2 | 3 | 4 | 5;

export interface EurekaTrigger {
  /** Beschreibung des Eureka-Ziels (z.B. „Baue 2 Offshore-Windparks“) */
  beschreibung: string;
  beschreibungTr: string;
  beschreibungEn: string;
  /** Art des Auslösers */
  art:
    | "fokus"           // Ein nationaler Fokus abgeschlossen
    | "vorhaben"        // Ein bestimmtes Bauvorhaben abgeschlossen
    | "massnahme"       // Eine Maßnahme erreicht Schwelle
    | "metrik"          // Ein nationaler Messwert erreicht Ziel
    | "abkommen"        // Ein internationales Abkommen aktiv
    | "katastrophe"     // Eine Naturkatastrophe bewältigt
    | "militaer_aktion";// Ein militärischer Meilenstein
  zielId: string;
  zielWert?: number;
}

export interface TechnologieDef {
  id: string;
  feld: TechFeld;
  epoche: TechEpoche;
  name: string;
  nameTr: string;
  nameEn: string;
  kurz: string;
  kurzTr: string;
  kurzEn: string;
  text: string;
  textTr: string;
  textEn: string;
  /** Benötigte Forschungspunkte (Basisdauer) */
  forschungspunkte: number;
  /** Vorgänger-Technologien im Baum */
  voraus: string[];
  /** Civ-6 Heureka-Bedingung (senkt Kosten um ca. 40 %) */
  eureka: EurekaTrigger;
  /** Was die Technologie dauerhaft freischaltet oder verbessert */
  ertrag: {
    schaltetFreiVorhaben?: string[];
    schaltetFreiFokus?: string[];
    schaltetFreiDoktrin?: string[];
    modifikatoren?: Record<string, number>;
  };
  /** Historisches oder futuristisches Zitat bei Abschluss */
  zitat?: {
    text: string;
    urheber: string;
  };
  /** Position im Spaltenraster (Epoche 1..5, Zeile 1..N) */
  raster: {
    spalte: number;
    zeile: number;
  };
}

export interface ForschungsFortschritt {
  techId: string;
  punkteGesammelt: number;
  punkteBedarf: number;
  eurekaAusgeloest: boolean;
  monateAktiv: number;
}

export interface ForschungsZustand {
  /** Verfügbare Slots (Standard: 2, erweiterbar bis 4) */
  slotsGesamt: number;
  aktiveForschung: (ForschungsFortschritt | null)[];
  abgeschlosseneTechs: string[];
  ausgeloesteEurekas: string[];
  /** Monatliche nationale Forschungsrate (beeinflusst durch Haushalt & Brain Drain) */
  forschungsrate: number;
}
