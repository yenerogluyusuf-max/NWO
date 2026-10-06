// Die Streitkräfte als Bestand: wenige, verständliche Gattungen mit Zahl, Technologiegeneration (1 bis 5) und Herkunft.
//
// Quellen (im Projekt belegt):
//   - Personal: 481.000 Aktive, 380.000 Reservisten, Wehrpflicht 6 Monate (RECHERCHE_INNENPOLITIK.md Z. 74 nach Wikipedia
//     „Turkish Armed Forces“ und Defense News 2026; RECHERCHE_KONKURRENZ_FACHBEREICHE.md Abschnitt Türkei).
//   - Kampfflugzeuge: Bestand 235 F-16 (RECHERCHE_KONKURRENZ_FACHBEREICHE.md, Tabelle Programme, Stand Sept. 2026).
//   - Laufende Beschaffungen: KAAN Block 10 (20 Stück, Vertrag 08.05.2026, Triebwerk GE F110), Eurofighter (20 neu, Okt. 2025),
//     F-16 Block 70 (40 bestellt), Stahlkuppel (47 Systeme, Aug. 2025), Altay T1 (Serienstart 05.09.2025) (ebenda).
//   - Drohnen: heimische Fertigung (TB2, Akıncı, TB3; ebenda), Luftabwehr: 2 S-400-Batterien (ebenda).
// Lücken (als Spielparameter gekennzeichnet): Bestandszahlen von Panzern, Schiffen, Drohnen, Luftabwehr und Raketen sind im Projekt
// nicht belegt (IISS Military Balance ist nicht offen zugänglich, RECHERCHE_GITHUB_DATEN.md Z. 101). Diese Gattungen werden als
// Index (100 = Stand 2026) geführt, nicht als erfundene Stückzahl. Generationen, Lieferzeiten und Preise sind Spielparameter.

export type GattungId = "personal" | "panzer" | "kampfflugzeuge" | "drohnen" | "marine" | "luftabwehr" | "raketen" | "munition";
export type Teilstreitkraft = "heer" | "luft" | "see";

export interface GattungDef {
  id: GattungId;
  teil: Teilstreitkraft;
  /** "stueck": echte, belegte Zahl; "index": 100 = Stand 2026 (Bestandszahl nicht belegt); "tage": Vorrat in Tagen Gefecht */
  einheit: "stueck" | "index" | "tage";
  start: number;
  /** Technologiegeneration 1 bis 5 beim Start (Spielparameter) */
  generation: number;
  /** Anteil aus heimischer Fertigung beim Start, 0 bis 1 (Spielparameter, Richtung belegt) */
  heimisch: number;
  /** Hauptlieferland des importierten Anteils (Länderkennung aus sim/laender.ts) */
  lieferland: string | null;
  /** Gewicht innerhalb der Teilstreitkraft (Spielparameter) */
  gewicht: number;
  /** Wie viel eine Bestellung umfasst und kostet (Spielparameter) */
  los: { menge: number; pk: number; bip: number; monateKauf: number; monateBau: number };
  quelle: string;
}

export const GATTUNGEN: GattungDef[] = [
  { id: "personal", teil: "heer", einheit: "stueck", start: 481_000, generation: 3, heimisch: 1, lieferland: null, gewicht: 0.3,
    los: { menge: 20_000, pk: 3, bip: 0.05, monateKauf: 6, monateBau: 6 }, quelle: "481.000 Aktive (RECHERCHE_INNENPOLITIK.md)" },
  { id: "panzer", teil: "heer", einheit: "index", start: 100, generation: 3, heimisch: 0.4, lieferland: "EU", gewicht: 0.35,
    los: { menge: 10, pk: 5, bip: 0.15, monateKauf: 18, monateBau: 30 }, quelle: "Index; Altay T1 seit 2025 in Serie (RECHERCHE_KONKURRENZ_FACHBEREICHE.md)" },
  { id: "kampfflugzeuge", teil: "luft", einheit: "stueck", start: 235, generation: 3, heimisch: 0, lieferland: "USA", gewicht: 0.4,
    los: { menge: 20, pk: 8, bip: 0.35, monateKauf: 36, monateBau: 60 }, quelle: "235 F-16 (RECHERCHE_KONKURRENZ_FACHBEREICHE.md)" },
  { id: "drohnen", teil: "luft", einheit: "index", start: 100, generation: 4, heimisch: 1, lieferland: null, gewicht: 0.3,
    los: { menge: 15, pk: 3, bip: 0.05, monateKauf: 6, monateBau: 9 }, quelle: "Index; TB2, Akıncı, TB3 heimisch (ebenda)" },
  { id: "luftabwehr", teil: "luft", einheit: "index", start: 100, generation: 3, heimisch: 0.5, lieferland: "RUS", gewicht: 0.3,
    los: { menge: 10, pk: 5, bip: 0.12, monateKauf: 24, monateBau: 30 }, quelle: "Index; 2 S-400-Batterien, Stahlkuppel bestellt (ebenda)" },
  { id: "marine", teil: "see", einheit: "index", start: 100, generation: 3, heimisch: 0.7, lieferland: "EU", gewicht: 0.7,
    los: { menge: 8, pk: 6, bip: 0.2, monateKauf: 36, monateBau: 48 }, quelle: "Index; İstif-Fregatten, Anadolu heimisch (ebenda)" },
  { id: "raketen", teil: "see", einheit: "index", start: 100, generation: 3, heimisch: 0.9, lieferland: null, gewicht: 0.3,
    los: { menge: 10, pk: 4, bip: 0.08, monateKauf: 12, monateBau: 18 }, quelle: "Index; Raketen und gelenkte Munition als Exportschwerpunkt (RECHERCHE_INNENPOLITIK.md)" },
  { id: "munition", teil: "heer", einheit: "tage", start: 60, generation: 3, heimisch: 0.8, lieferland: null, gewicht: 0.35,
    los: { menge: 15, pk: 2, bip: 0.06, monateKauf: 3, monateBau: 4 }, quelle: "Spielparameter (Vorrat nicht belegt)" },
];

export const GATTUNG_NACH_ID = Object.fromEntries(GATTUNGEN.map((g) => [g.id, g])) as Record<GattungId, GattungDef>;

/** Belegte, bereits laufende Beschaffungen zum Spielstart (Lieferzeiten sind Spielparameter). */
export const START_BESCHAFFUNGEN: { gattung: GattungId; art: "kauf" | "produktion"; menge: number; generation: number; monate: number; lieferland: string | null; name: string }[] = [
  { gattung: "kampfflugzeuge", art: "produktion", menge: 20, generation: 5, monate: 72, lieferland: "USA", name: "KAAN Block 10 (Triebwerk GE F110)" },
  { gattung: "kampfflugzeuge", art: "kauf", menge: 20, generation: 4, monate: 36, lieferland: "EU", name: "Eurofighter" },
  { gattung: "kampfflugzeuge", art: "kauf", menge: 40, generation: 4, monate: 48, lieferland: "USA", name: "F-16 Block 70" },
  { gattung: "luftabwehr", art: "produktion", menge: 25, generation: 4, monate: 36, lieferland: null, name: "Stahlkuppel" },
  { gattung: "panzer", art: "produktion", menge: 10, generation: 4, monate: 30, lieferland: "EU", name: "Altay T1" },
];

/** Benannte Zielräume je Gegner: Vorstufe der Regionen (Schwierigkeit 0,6 bis 1,4 auf die Gegenwehr, Bedeutung 1 bis 3; Spielparameter). */
export interface Zielraum {
  id: string;
  land: string;
  schwierigkeit: number;
  bedeutung: number;
}

export const ZIELRAEUME: Zielraum[] = [
  { id: "syr_grenzstreifen", land: "SYR", schwierigkeit: 0.7, bedeutung: 1 },
  { id: "syr_tief", land: "SYR", schwierigkeit: 1.2, bedeutung: 2 },
  { id: "irq_berge", land: "IRQ", schwierigkeit: 0.85, bedeutung: 1 },
  { id: "irq_tief", land: "IRQ", schwierigkeit: 1.3, bedeutung: 2 },
  { id: "grc_inseln", land: "GRC", schwierigkeit: 1.1, bedeutung: 2 },
  { id: "grc_thrakien", land: "GRC", schwierigkeit: 1.4, bedeutung: 3 },
  { id: "cyp_schutz", land: "CYP", schwierigkeit: 0.8, bedeutung: 2 },
  { id: "arm_korridor", land: "ARM", schwierigkeit: 0.9, bedeutung: 2 },
  { id: "irn_grenze", land: "IRN", schwierigkeit: 1.0, bedeutung: 1 },
  { id: "irn_tief", land: "IRN", schwierigkeit: 1.4, bedeutung: 3 },
  // Maximalziele: der ganze Schauplatz (data/schauplaetze.ts ZIELRAUM_REGIONEN); teuer an Gegenwehr, Ansehen und Besatzung
  { id: "syr_maximal", land: "SYR", schwierigkeit: 1.35, bedeutung: 3 },
  { id: "irq_maximal", land: "IRQ", schwierigkeit: 1.5, bedeutung: 3 },
  { id: "grc_maximal", land: "GRC", schwierigkeit: 1.7, bedeutung: 3 },
  { id: "cyp_maximal", land: "CYP", schwierigkeit: 1.25, bedeutung: 3 },
  { id: "arm_maximal", land: "ARM", schwierigkeit: 1.35, bedeutung: 3 },
];

export const STANDARD_ZIEL = { schwierigkeit: 1, bedeutung: 2 };
