// Der Wissensbaum (Civ-6-Vorbild, Konzept FOKUS_FORSCHUNG_KRIEG_KONZEPT_2026-10-05.md): eine Sicht auf die Technologie-Vorhaben des Reiches,
// geordnet in sechs Zweige. Die Knoten SIND die vorhandenen Vorhaben (data/reich/technologie.ts, zukunft.ts, militaer.ts) mit ihren Voraussetzungen
// aus Bildung, Fachkräften, Forschungsetat und Partnern; hier stehen nur Zweig, Lizenzgeber und Werke. Keine Parallelwelt: Gebaut wird über Reich.
//
// Alle Zahlen sind Spielparameter (Kalibrierung, keine Messwerte). Firmen sind reale Institutionen, nur als Träger genannt, ohne Zahlen;
// Fundstelle je Firma in `quelle`.

import type { GutId } from "./gueter";
import type { GattungId } from "./streitkraefte";

export type ZweigId = "digital" | "energie" | "luftraum" | "ruestung" | "bio" | "werkstoff";

export interface ZweigDef {
  id: ZweigId;
  /** Vorhaben-Kennungen in grober Reihenfolge; die Spalte ergibt sich aus den Voraussetzungen */
  knoten: string[];
}

export const ZWEIGE: ZweigDef[] = [
  { id: "digital", knoten: ["chips_design", "ki_strategie", "ki_rechenzentren", "quanten_zentrum", "ki_sprachmodell", "ki_chipfab", "quanten_computer", "chips_euv", "ki_agi"] },
  { id: "energie", knoten: ["batt_zellfabrik", "energie_fusion_forschung", "meer_offshore_wind", "h2_elektrolyse", "energie_smr", "energie_brennstoffkreislauf", "energie_fusion_testreaktor", "energie_fusion_kraftwerk"] },
  { id: "luftraum", knoten: ["luft_triebwerke", "raum_agentur", "raum_satelliten", "luft_regionalflugzeug", "luft_flugtaxi", "raum_bahnhof", "raum_traeger", "raum_mondsonde", "raum_orbit_bemannt", "raum_mondbasis", "raum_mars", "raum_aufzug"] },
  { id: "ruestung", knoten: ["mil_drohnen", "mil_huerjet", "mil_altay", "mil_kaan_motor", "mil_stahlkuppel", "ki_militaer", "meer_uwdrohnen", "mil_kaan", "mil_tf2000", "meer_uboote"] },
  { id: "bio", knoten: ["bio_genomik", "bio_impfstoffwerk", "bio_saatgut", "bio_medizintechnik", "bio_gentherapie"] },
  { id: "werkstoff", knoten: ["nano_zentrum", "robotik_offensive", "meer_institut", "meer_hafenautomatisierung", "meer_tiefsee_gas", "meer_tiefseebergbau"] },
];

export const ZWEIG_VON: Record<string, ZweigId> = Object.fromEntries(ZWEIGE.flatMap((z) => z.knoten.map((k) => [k, z.id])));

/** Wer eine Lizenz oder Technik verkauft (Hauptakteure der Weltlage). */
export type Lizenzgeber = "USA" | "EU" | "CHN" | "RUS";

/** Lizenzgeber je Knoten (Spielparameter, Plausibilität: wer die Technik heute anbietet). Wunder und Eigenentwicklungen ohne Lizenz. */
export const LIZENZ: Record<string, Lizenzgeber[]> = {
  chips_design: ["USA", "EU"],
  ki_rechenzentren: ["USA", "CHN"],
  ki_sprachmodell: ["USA", "CHN"],
  ki_chipfab: ["USA", "EU", "CHN"],
  quanten_zentrum: ["EU", "USA"],
  batt_zellfabrik: ["CHN", "EU"],
  meer_offshore_wind: ["EU", "CHN"],
  h2_elektrolyse: ["EU", "CHN"],
  energie_smr: ["USA", "RUS"],
  luft_triebwerke: ["USA", "EU"],
  luft_regionalflugzeug: ["EU"],
  raum_satelliten: ["EU", "CHN"],
  raum_traeger: ["RUS", "CHN"],
  mil_kaan_motor: ["EU", "USA"],
  mil_altay: ["EU"],
  meer_uboote: ["EU"],
  bio_genomik: ["EU", "USA"],
  bio_impfstoffwerk: ["EU", "CHN"],
  bio_medizintechnik: ["EU"],
  robotik_offensive: ["EU", "CHN"],
  nano_zentrum: ["EU"],
};

/** Wer mit wem rivalisiert: Eine Lizenz beim einen kostet Vertrauen beim anderen (Spielparameter). */
export const RIVALEN: Record<Lizenzgeber, { id: Lizenzgeber; d: number }[]> = {
  USA: [{ id: "CHN", d: -1 }, { id: "RUS", d: -2 }],
  EU: [{ id: "RUS", d: -1 }],
  CHN: [{ id: "USA", d: -3 }, { id: "EU", d: -1 }],
  RUS: [{ id: "USA", d: -4 }, { id: "EU", d: -3 }],
};

/** Wer ein Werk trägt: der Staat, eine heimische Firma oder ein ausländischer Partner. */
export type Traeger = "staat" | "firma" | "ausland";

export interface WerkDef {
  /** Vorhaben-Kennung */
  id: string;
  /** Welche Warengruppe das Werk zusätzlich herstellt und um welchen Anteil der Ausgangsproduktion (Spielparameter) */
  gut?: { id: GutId; anteil: number };
  /** Welche Gattungen der Streitkräfte heimisch eine halbe Generation weiter kommen */
  militaer?: GattungId[];
  /** Heimische Firma als Träger: reale Institution, Fundstelle im Projekt */
  firma?: { name: string; quelle: string };
}

export const WERKE: WerkDef[] = [
  // Elektronik: Produktion 4 Mrd. $ bei 24 Mrd. $ Verbrauch (data/gueter.ts); eine Chipfabrik deckt einen Teil der Lücke
  { id: "ki_chipfab", gut: { id: "elektronik", anteil: 0.75 }, militaer: ["drohnen", "raketen", "luftabwehr"], firma: { name: "ASELSAN", quelle: "RECHERCHE_GLM_2, Abschnitt 2.5 (Chipentwurf bei ASELSAN und TÜBİTAK BİLGEM)" } },
  { id: "batt_zellfabrik", gut: { id: "elektronik", anteil: 0.2 } },
  { id: "bio_impfstoffwerk", gut: { id: "medikamente", anteil: 0.2 } },
  { id: "bio_medizintechnik", gut: { id: "medikamente", anteil: 0.12 } },
  { id: "luft_triebwerke", militaer: ["kampfflugzeuge"], firma: { name: "TEI", quelle: "RECHERCHE_GLM_4, Firmentabelle (TEI: Triebwerke, Wartung, Teile)" } },
  { id: "mil_kaan_motor", militaer: ["kampfflugzeuge"], firma: { name: "TEI", quelle: "RECHERCHE_GLM_4, Firmentabelle (TEI: Triebwerke, Wartung, Teile)" } },
  { id: "ki_militaer", militaer: ["drohnen"], firma: { name: "Baykar", quelle: "RECHERCHE_GLM_4, Firmentabelle (Baykar: Drohnen)" } },
  { id: "meer_uboote", militaer: ["marine"] },
  { id: "mil_altay", militaer: ["panzer"] },
];

export const WERK_VON: Record<string, WerkDef> = Object.fromEntries(WERKE.map((w) => [w.id, w]));

/** Spielparameter des Wissensbaums */
export const BAUM = {
  /** Forschungstempo aus der Forschungsrate (1 = Stand 2026): Tempo = basis + gewicht · Rate, begrenzt */
  // (Forschung voll ausgebaut ohne Bildung: etwa 1,6; mit gehobener Innovationsgrenze bis 2,5; gekürzt bis 0,5)
  tempoBasis: 0.5,
  tempoGewicht: 0.5,
  tempoMin: 0.5,
  tempoMax: 2.5,
  /** Abwanderung: je % des BIP Bildungsüberhang über der Schwelle sinkt das Tempo um so viel, höchstens bis zur Untergrenze */
  abwanderungJeProzent: 0.1,
  abwanderungMin: 0.7,
  /** Schwerpunkt: Kapital, Sperrfrist in Tagen, Tempo im Zweig und in den anderen */
  schwerpunktPk: 2,
  schwerpunktSperre: 365,
  schwerpunktTempo: 1.25,
  andereTempo: 0.9,
  /** Lizenz: Kapital zusätzlich, Tempo, Mehrkosten der Schulden (Gebühren), Tempo, wenn der Lizenzgeber sperrt */
  lizenzPk: 2,
  lizenzTempo: 1.6,
  lizenzSchulden: 1.2,
  gesperrtTempo: 0.5,
  /** Ertrag eines Werks mit fremder Lizenz oder fremdem Träger, wenn der Partner sperrt */
  gesperrtErtrag: 0.4,
  /** Vertrauen, unter dem ein Partner Lieferungen und Updates zurückhält */
  partnerVertrauenMin: 30,
  /** Träger: Anteil der Schulden, Tempo, Kapital zusätzlich */
  traeger: {
    staat: { schulden: 1, tempo: 1, pk: 0, generation: 0.5 },
    firma: { schulden: 0.6, tempo: 1, pk: 1, generation: 0.5 },
    ausland: { schulden: 0.4, tempo: 1.25, pk: 0, generation: 0.25 },
  } as Record<Traeger, { schulden: number; tempo: number; pk: number; generation: number }>,
  /** So viele Tage zeigt der Baum einen Durchbruch mit Stempel */
  durchbruchTage: 120,
};
