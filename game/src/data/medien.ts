// Die Medienlandschaft als sieben Cluster (RECHERCHE_MEDIEN_UMFRAGEN.md, Kapitel A.5).
// Die Namen der Cluster sind erfunden und neutral; die realen Vorbilder (Turkuvaz/Kalyon, Demirören,
// Doğuş, Ciner, TRT, Sözcü/Halk TV/TELE1, Medyascope/T24 u. a.) stehen nur in den Kommentaren.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), aus TİAK-Quoten 2024, dem Reuters
// Digital News Report 2025 und dem Media Ownership Monitor abgeleitet — keine Tatsachenbehauptungen.

/** Wählersegmente der Reichweitentabelle (Recherche A.5.2). */
export type MedienSegment =
  | "laendlich_konservativ" // ≈ GRUPPEN konservative, landwirte, rentner
  | "urban_alt"             // ≈ GRUPPEN arbeitnehmer, rentner (städtisch)
  | "urban_jung"            // ≈ GRUPPE junge
  | "kurdistan"             // ≈ GRUPPE minderheiten
  | "akademisch";           // ≈ GRUPPE staedtische_saekulare

/** Womit ein Cluster unter Druck gesetzt werden kann (Recherche A.5.1, Spalte „Verwundbarkeit“). */
export type MedienVerwundbarkeit =
  | "eigentum"  // Eigentümer ist über Aufträge/Kredite/Beteiligungen erpressbar
  | "plattform" // Verwundbar über Algorithmen, Kontosperrungen, Lizenzpflicht für Online-Kanäle
  | "lizenz";   // Verwundbar über Aufsichtsbehörde: Strafen, Blackouts, Lizenzentzug, Anzeigenstopp

export type MedienAusrichtung =
  | "staatlich"
  | "loyalistisch"
  | "linientreu_opportunistisch"
  | "konform_kommerziell"
  | "oppositionell_masse"
  | "oppositionell_nische"
  | "unabhaengig_digital";

export interface MedienCluster {
  id: string;
  /** Erfundener, neutraler Spielname */
  name: string;
  ausrichtung: MedienAusrichtung;
  /**
   * Anteil je Wählersegment, den das Cluster wöchentlich als primäre Newsquelle erreicht (0–1).
   * Modellwerte aus Recherche A.5.2; die Summen je Segment liegen nur ungefähr bei 1.
   */
  reichweiteSegmente: Record<MedienSegment, number>;
  /** Wie empfindlich der Eigentümer auf Regierungsdruck reagiert, 0–100 (Recherche A.5.1) */
  eigentuemerEmpfindlichkeit: number;
  /** true, wenn die Reichweite primär digital entsteht */
  digital: boolean;
  verwundbarkeit: MedienVerwundbarkeit[];
  /** Wahrscheinlichkeit, dass ein Regierungsskandal berichtet wird (Recherche A.5.4) */
  berichtSkandalRegierung: number;
  /** Wahrscheinlichkeit, dass ein Oppositionsskandal berichtet wird */
  berichtSkandalOpposition: number;
  /** Optionale Sonderrolle im Spiel (z. B. Wahlnacht-Datenhoheit) */
  sonderrolle?: string;
}

export const MEDIEN_CLUSTER: MedienCluster[] = [
  {
    // Vorbild: TRT-Verbund + Anadolu Ajansı — „State-Controlled" (State Media Monitor, 13.09.2025);
    // Sehanteile 2024: TRT 1 5,49 %, TRT Haber 1,97 % (TİAK via Wikipedia). Bandrol-Finanzierung 2023: 86,3 % der Einnahmen.
    id: "staatsrundfunk",
    name: "Staatlicher Rundfunkverbund",
    ausrichtung: "staatlich",
    reichweiteSegmente: { laendlich_konservativ: 0.25, urban_alt: 0.15, urban_jung: 0.03, kurdistan: 0.15, akademisch: 0.02 },
    eigentuemerEmpfindlichkeit: 100, // direkt steuerbar; kein Widerstand, aber Vertrauensmalus (niedrigste Vertrauenswerte, DNR 2025)
    digital: false,
    verwundbarkeit: ["eigentum"],
    berichtSkandalRegierung: 0.05,
    berichtSkandalOpposition: 0.95,
    sonderrolle: "wahlnacht_datenhoheit", // AA-Monopol auf den Ergebnisdatenfluss in der Wahlnacht
  },
  {
    // Vorbild: Turkuvaz Medya (Kalyon/Zirve): Sabah, ATV (9,49 % Sehanteil 2024), A Haber, Takvim;
    // Eigentümer über Bau-/Energieaufträge gebunden (MOM, 29.11.2021).
    id: "holding_kern",
    name: "Bau- und Energieholding Medien",
    ausrichtung: "loyalistisch",
    // Spielparameter: C2/C3 teilen in der Recherche den kombinierten „HAVUZ"-Wert; die Aufteilung 60/40 ist Kalibrierung.
    reichweiteSegmente: { laendlich_konservativ: 0.33, urban_alt: 0.24, urban_jung: 0.12, kurdistan: 0.21, akademisch: 0.06 },
    eigentuemerEmpfindlichkeit: 95,
    digital: false,
    verwundbarkeit: ["eigentum"],
    berichtSkandalRegierung: 0.1,
    berichtSkandalOpposition: 0.98,
    sonderrolle: "kampagnenmaschine",
  },
  {
    // Vorbild: Demirören (Hürriyet, Posta, Milliyet, Kanal D 6,28 %, CNN Türk, DHA); gekauft 2018 für 916 Mio. $,
    // davon 675 Mio. $ Kredit der staatlichen Ziraat Bank (MOM, 29.11.2021) → Kreditabhängigkeit.
    id: "holding_breit",
    name: "Kreditfinanzierte Mediengruppe",
    ausrichtung: "linientreu_opportunistisch",
    // Spielparameter: zweiter Teil des „HAVUZ"-Werts (40 %), s. o.
    reichweiteSegmente: { laendlich_konservativ: 0.22, urban_alt: 0.16, urban_jung: 0.08, kurdistan: 0.14, akademisch: 0.04 },
    eigentuemerEmpfindlichkeit: 85,
    digital: false,
    verwundbarkeit: ["eigentum"],
    berichtSkandalRegierung: 0.2,
    berichtSkandalOpposition: 0.9,
    sonderrolle: "kippt_bei_machtwechsel_signal",
  },
  {
    // Vorbild: Doğuş (Star TV 5,15 %, NTV), Ciner/Can (Show TV 7,34 %, Habertürk), İhlas, Kanal-7/Yeni-Şafak-Block;
    // wirtschaftspragmatisch, dokumentierte Selbstzensur (MOM, 29.11.2021).
    id: "kommerz_konform",
    name: "Kommerzielle Familiensender",
    ausrichtung: "konform_kommerziell",
    reichweiteSegmente: { laendlich_konservativ: 0.15, urban_alt: 0.2, urban_jung: 0.15, kurdistan: 0.1, akademisch: 0.13 },
    eigentuemerEmpfindlichkeit: 60, // öffentliche Ausschreibungen; bei hohem Druck weitgehend ruhigstellbar
    digital: false,
    verwundbarkeit: ["eigentum"],
    berichtSkandalRegierung: 0.3,
    berichtSkandalOpposition: 0.7,
  },
  {
    // Vorbild: Sözcü/Sözcü TV, Halk TV, TELE1, KRT, NOW TV (6,71 % Sehanteil 2024); höchste Vertrauenswerte
    // im Markt (Reuters DNR 2025). Keine Eigner-Hebel — Angriffsfläche ist die Aufsicht (2025: 99 Sanktionen, ~4,5 Mio. €).
    id: "opposition_masse",
    name: "Freie Massensender",
    ausrichtung: "oppositionell_masse",
    reichweiteSegmente: { laendlich_konservativ: 0.03, urban_alt: 0.15, urban_jung: 0.22, kurdistan: 0.25, akademisch: 0.4 },
    eigentuemerEmpfindlichkeit: 10,
    digital: false,
    verwundbarkeit: ["lizenz"], // RTÜK-Strafen, Blackouts (2025: 25 Tage gesamt), Lizenzentzug-Drohung
    berichtSkandalRegierung: 0.9,
    berichtSkandalOpposition: 0.4,
  },
  {
    // Vorbild: Cumhuriyet, BirGün, Evrensel, Yeniçağ, Karar — klein, aber meinungsführend; trugen 97 % der
    // BİK-Anzeigenstrafen (808 Tage 2020, 97 % auf fünf Blätter; bianet, 28.09.2021).
    id: "opposition_nische",
    name: "Unabhängige Zeitungen",
    ausrichtung: "oppositionell_nische",
    // Spielparameter: C6 fehlt in Tabelle A.5.2 (dort in den Restsummen enthalten); kleine Werte sind Kalibrierung.
    reichweiteSegmente: { laendlich_konservativ: 0.01, urban_alt: 0.03, urban_jung: 0.04, kurdistan: 0.05, akademisch: 0.1 },
    eigentuemerEmpfindlichkeit: 5,
    digital: false,
    verwundbarkeit: ["lizenz"], // BİK-Anzeigenstopp (Existenz über Staatsanzeigen), TCK-217/A-Verfahren
    berichtSkandalRegierung: 0.8,
    berichtSkandalOpposition: 0.5,
  },
  {
    // Vorbild: Medyascope, T24, Diken, DW Türkçe, YouTube-Creator; immun gegen Eigner-Druck, aber verwundbar über
    // Google-Algorithmus (Jan. 2025: bis −80 % Traffic), RTÜK-Lizenzpflicht für YouTube (seit Dez. 2024), Kontosperrungen.
    id: "digital_frei",
    name: "Digitale Nachrichtenkanäle",
    ausrichtung: "unabhaengig_digital",
    reichweiteSegmente: { laendlich_konservativ: 0.02, urban_alt: 0.1, urban_jung: 0.4, kurdistan: 0.15, akademisch: 0.35 },
    eigentuemerEmpfindlichkeit: 0,
    digital: true,
    verwundbarkeit: ["plattform", "lizenz"],
    berichtSkandalRegierung: 0.7,
    berichtSkandalOpposition: 0.6,
  },
];

/**
 * Was Regulierungshebel das Regime kosten (Recherche A.5.3: RTÜK/BİK/TCK-217/A-Praxis mit realen Referenzwerten).
 * rsfMalus bewegt den lebenden Pressefreiheits-Rang (Start 2028: Rang 159, Score 29,4 — RSF-Index 2025).
 * Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung).
 */
export interface RegulierungsPreis {
  /** Realer Referenzwert aus der Recherche (nur Kommentar-Kontext, kein Spielwert) */
  referenz: string;
  rsfMalus: number;
  /** Mobilisierungseffekt für die Opposition (Empörung), in Prozentpunkten Stimmung */
  oppoMobilisierung?: number;
  einmalig?: boolean;
}

export interface RegulierungsPreise {
  rtuek_geldstrafe: RegulierungsPreis;
  rtuek_programmstopp: RegulierungsPreis;
  blackout_10tage: RegulierungsPreis;
  bik_anzeigenstopp: RegulierungsPreis;
  tck217a_verfahren: RegulierungsPreis;
  lizenzentzug: RegulierungsPreis;
  kontosperrung: RegulierungsPreis;
}

export const REGULIERUNG_PREISE: RegulierungsPreise = {
  rtuek_geldstrafe: { referenz: "1–5 % Monatswerbeumsatz; 2025: ~4,5 Mio. €/Jahr gesamt", rsfMalus: 1 },
  rtuek_programmstopp: { referenz: "2025: 54 Sanktionen auf News-Formate", rsfMalus: 0.5 },
  blackout_10tage: { referenz: "Sözcü TV 10 Tage, Halk TV 10 Tage, TELE1 5 Tage (2025)", rsfMalus: 3, oppoMobilisierung: 2 },
  bik_anzeigenstopp: { referenz: "808 Tage (2020), 97 % auf fünf Blätter; Limit 60 Tage umgangen", rsfMalus: 0.5 },
  tck217a_verfahren: { referenz: "4.188 Ermittlungen in zwei Jahren; 83 Journalisten seit 2022", rsfMalus: 0.5 },
  lizenzentzug: { referenz: "Açık Radyo 2024; Drohkulisse 2025", rsfMalus: 8, einmalig: true },
  kontosperrung: { referenz: ">700 X-Konten gesperrt (März 2025)", rsfMalus: 1 },
};

/** Pressefreiheits-Index als lebender Jahreswert (Recherche, Vorgabenkapitel): Start 2028 = Rang 159, Score 29,4. */
export const RSF_START = { rang: 159, score: 29.4 } as const;

export function medienCluster(id: string): MedienCluster | undefined {
  return MEDIEN_CLUSTER.find((c) => c.id === id);
}
