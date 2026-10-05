// Datenentwurf GLM: Streitkräfte und Rüstung (zu RECHERCHE_GLM_4, Thema 4).
// Diese Datei wird NICHT vom Spiel geladen; der Streitkräfte-/Kriegs-Strang übernimmt Bestandszeilen,
// Länderkalendar und Funktionen als Vorgabe. Reine Funktionen ohne Importe aus sim/.
// Belegte Zahlen mit Quelle; ohne Quelle ausdrücklich Spielparameter. Beschaffungsdauern sind
// ausdrücklich Spielparameter (keine Belegquelle in der Recherche).

// ---------------------------------------------------------------------------
// Typen

export type Gattung = "heer" | "luft" | "marine" | "luftverteidigung" | "drohnen";

export type Generation = "alt" | "mitte" | "modern";

/** Eine Bestandszeile: Typ, Zahl, Generation, Herkunft (HOI-4-artig, ohne Einzelstücke). */
export interface BestandsZeile {
  id: string;
  gattung: Gattung;
  typ: string;
  anzahl: number;
  generation: Generation;
  herkunft: string;
  quelle?: string;
}

export interface LandMilitaer {
  /** Land-Kürzel wie in sim/laender.ts */
  land: string;
  /** Militärausgaben in Mrd. $ (SIPRI, Jahr im Kommentar) */
  ausgabenMrdDollar: number;
  ausgabenJahr: 2024 | 2025;
  quelle?: string;
  /** Aktive Soldaten, Bandangabe oder Punkt */
  aktive: [number, number?];
  /** Kernplattformen in Worten */
  kernPlattformen: string[];
  /** Beziehung zur Türkei im Spiel (Kantenanker für sim/laender.ts) */
  beziehung: string;
}

// ---------------------------------------------------------------------------
// Türkiye-Bestand (siehe RECHERCHE_GLM_4 Abschnitt 2.1)

export const TUERKEI_BESTAND: BestandsZeile[] = [
  { id: "f16", gattung: "luft", typ: "F-16C/D (B30/B40/B50)", anzahl: 240, generation: "mitte", herkunft: "USA", quelle: "f-16.net-Datenbank (278 Rümpfe); IISS prüfen" },
  { id: "kaan", gattung: "luft", typ: "KAAN Nationalkampfjet", anzahl: 0, generation: "modern", herkunft: "heimisch (TUSAŞ), Triebwerk importiert", quelle: "GLM_2" },
  { id: "leo2a4", gattung: "heer", typ: "Leopard 2A4", anzahl: 325, generation: "mitte", herkunft: "Deutschland (354 gekauft 2006)", quelle: "Auswertungen: 316–334" },
  { id: "m60t", gattung: "heer", typ: "M60T/M60A modernisiert", anzahl: 170, generation: "mitte", herkunft: "Israel-Typ/heimisch", quelle: "Auswertungen" },
  { id: "panzer_gesamt", gattung: "heer", typ: "Kampfpanzer gesamt (M60, Leo1 …)", anzahl: 2200, generation: "alt", herkunft: "gemischt", quelle: "Auswertungen; IISS prüfen" },
  { id: "anadolu", gattung: "marine", typ: "TCG Anadolu (LHD, Drohnenträger)", anzahl: 1, generation: "modern", herkunft: "heimisch", quelle: "Marinepresse, seit April 2023" },
  { id: "reis_uboot", gattung: "marine", typ: "Type 214TN Reis-Klasse (AIP)", anzahl: 6, generation: "modern", herkunft: "Deutschland (HDW-Basis) + heimisch", quelle: "Marinepresse, Piri Reis 2024" },
  { id: "istif", gattung: "marine", typ: "İstif-Klasse Korvetten (Serie)", anzahl: 4, generation: "modern", herkunft: "heimisch", quelle: "Spielparameter: Zulaufzahl prüfen" },
  { id: "hisar", gattung: "luftverteidigung", typ: "HİSAR A+/O+ Batterien", anzahl: 12, generation: "modern", herkunft: "heimisch", quelle: "Spielparameter: Stückzahl prüfen" },
  { id: "siper", gattung: "luftverteidigung", typ: "SİPER Langstrecke (100+ km)", anzahl: 2, generation: "modern", herkunft: "heimisch", quelle: "Serienvertrag 2025–2029 (defenceturk)" },
  { id: "tb2", gattung: "drohnen", typ: "Bayraktar TB2 / Akıncı Serien", anzahl: 300, generation: "modern", herkunft: "heimisch", quelle: "Spielparameter: Bestand prüfen; Exportweltmarktführer (Baykar 1,8 Mrd. $ 2024)" },
];

/** Personal (IISS-Auswertung 2024/26; MSB-Officialwert von 2015 ist alt). */
export const TUERKEI_PERSONAL = {
  aktiv: [355000, 425000] as [number, number],
  reserve: 380000,
  quelle: "IISS-Auswertung; MSB 2015: 645.138 (alt)",
  einsaetze: ["Irak", "Somalia"], // SIPRI 4/2026 nennt sie als 2025er-Ausgabentreiber
};

// ---------------------------------------------------------------------------
// Länderkalendar (SIPRI 2024/2025; „zu prüfen"-Zeilen sind Bandangaben)

export const LAENDER_MILITAER: LandMilitaer[] = [
  { land: "USA", ausgabenMrdDollar: 997, ausgabenJahr: 2024, aktive: [1300000], kernPlattformen: ["5./6. Flotte", "Incirlik-Nutzung"], beziehung: "NATO-Partner mit Druckhebeln", quelle: "SIPRI 4/2025" },
  { land: "CHN", ausgabenMrdDollar: 314, ausgabenJahr: 2024, aktive: [2000000], kernPlattformen: ["Marine-Expansion", "Drohnenexporte"], beziehung: "Handel + Korridor-Konkurrenz", quelle: "SIPRI 4/2025" },
  { land: "RUS", ausgabenMrdDollar: 149, ausgabenJahr: 2024, aktive: [1100000], kernPlattformen: ["Schwarzmeerflotte (Kriegsverluste zu prüfen)", "S-400-Fall"], beziehung: "Spannungsfeld, Energie-Lieferant", quelle: "SIPRI 4/2025" },
  { land: "DEU", ausgabenMrdDollar: 107, ausgabenJahr: 2024, aktive: [180000], kernPlattformen: ["NATO-Ostflanke"], beziehung: "EU-Partner, historischer Panzerlieferant", quelle: "SIPRI-Auswertung (~)" },
  { land: "GBR", ausgabenMrdDollar: 94, ausgabenJahr: 2024, aktive: [140000], kernPlattformen: ["F-35-Flotte"], beziehung: "NATO-Partner", quelle: "SIPRI-Auswertung (~)" },
  { land: "FRA", ausgabenMrdDollar: 70, ausgabenJahr: 2024, aktive: [200000], kernPlattformen: ["Rafale-Exportkonkurrenz"], beziehung: "EU-Partner, Mediationskonkurrenz", quelle: "SIPRI-Top10 (~)" },
  { land: "IND", ausgabenMrdDollar: 86, ausgabenJahr: 2024, aktive: [1400000], kernPlattformen: ["—"], beziehung: "Korridorkunde", quelle: "SIPRI-Auswertung (~)" },
  { land: "UKR", ausgabenMrdDollar: 65, ausgabenJahr: 2024, aktive: [800000, 900000], kernPlattformen: ["Drohnenkriegslehre"], beziehung: "Schwarzmeer-Routen-Partner", quelle: "SIPRI (~); Last ~35 % BIP" },
  { land: "ISR", ausgabenMrdDollar: 46.5, ausgabenJahr: 2024, aktive: [170000], kernPlattformen: ["Luftüberlegenheit", "Raketenabwehr"], beziehung: "Heikles Verhältnis (Konfliktanker)", quelle: "SIPRI 4/2025 (+65 %)" },
  { land: "KOR", ausgabenMrdDollar: 48, ausgabenJahr: 2024, aktive: [500000], kernPlattformen: ["Rüstungsexport-Konkurrent"], beziehung: "Exportkonkurrenz", quelle: "zu prüfen" },
  { land: "SAU", ausgabenMrdDollar: 80.3, ausgabenJahr: 2024, aktive: [250000], kernPlattformen: ["US-Systeme"], beziehung: "Golf-Partner/Investor", quelle: "SIPRI 4/2025" },
  { land: "POL", ausgabenMrdDollar: 35, ausgabenJahr: 2024, aktive: [200000], kernPlattformen: ["US-Systeme Massenkauf"], beziehung: "NATO-Ostflanke, 4,1 % BIP (NATO-Spitze)", quelle: "SIPRI-Auswertung (~)" },
  { land: "ITA", ausgabenMrdDollar: 34, ausgabenJahr: 2024, aktive: [165000], kernPlattformen: ["—"], beziehung: "NATO-Mittelmeer", quelle: "zu prüfen" },
  { land: "ESP", ausgabenMrdDollar: 24, ausgabenJahr: 2024, aktive: [120000], kernPlattformen: ["—"], beziehung: "NATO", quelle: "zu prüfen" },
  { land: "SWE", ausgabenMrdDollar: 13, ausgabenJahr: 2024, aktive: [25000], kernPlattformen: ["Gripen-Konkurrenz"], beziehung: "NATO-Neuzugang", quelle: "zu prüfen" },
  { land: "GRC", ausgabenMrdDollar: 14, ausgabenJahr: 2024, aktive: [140000], kernPlattformen: ["F-35A: bis 40 genehmigt (~8,6 Mrd. $), erster Vertrag über 20"], beziehung: "Haupt-Rivale (Ägäis)", quelle: "SIPRI (~); DW 25.7.2024" },
  { land: "EGY", ausgabenMrdDollar: 4, ausgabenJahr: 2024, aktive: [450000], kernPlattformen: ["Rafale/MiG-Mix"], beziehung: "Libyen/Gaza-Nachbar", quelle: "zu prüfen (Band 3–5)" },
  { land: "IRN", ausgabenMrdDollar: 12, ausgabenJahr: 2024, aktive: [600000], kernPlattformen: ["Drohnenexporteur", "Raketen"], beziehung: "Direkter Nachbar, Gaslieferant", quelle: "SIPRI-Schätzband breit — Lücke" },
  { land: "AZE", ausgabenMrdDollar: 5, ausgabenJahr: 2024, aktive: [126000], kernPlattformen: ["TB2/Akıncı", "T-90", "S-300/Polonez"], beziehung: "Turkstaaten-Verbündeter (Zangezur)", quelle: "SIPRI (~); Auswertung 147 Luftfahrzeuge" },
  { land: "ARM", ausgabenMrdDollar: 1.5, ausgabenJahr: 2024, aktive: [45000], kernPlattformen: ["Umorientierung nach 2020er"], beziehung: "Konfliktanker (Zangezur)", quelle: "zu prüfen" },
  { land: "GEO", ausgabenMrdDollar: 0.4, ausgabenJahr: 2024, aktive: [37000], kernPlattformen: ["—"], beziehung: "Korridor-Land, NATO-willig", quelle: "zu prüfen" },
  { land: "BGR", ausgabenMrdDollar: 2, ausgabenJahr: 2024, aktive: [37000], kernPlattformen: ["NATO-Schwarzmeerflanke"], beziehung: "NATO-Nachbar", quelle: "zu prüfen" },
  { land: "ROU", ausgabenMrdDollar: 9, ausgabenJahr: 2024, aktive: [70000], kernPlattformen: ["NATO-Schwarzmeerflanke"], beziehung: "NATO-Nachbar", quelle: "zu prüfen" },
  { land: "KAZ", ausgabenMrdDollar: 2, ausgabenJahr: 2024, aktive: [40000], kernPlattformen: ["Turkstaaten-Netz"], beziehung: "Türkische Welt", quelle: "zu prüfen" },
  { land: "PAK", ausgabenMrdDollar: 10.5, ausgabenJahr: 2024, aktive: [650000], kernPlattformen: ["China-Systeme"], beziehung: "Drohnen-/Marine-Kunde", quelle: "zu prüfen" },
  { land: "SYR", ausgabenMrdDollar: 0.5, ausgabenJahr: 2024, aktive: [100000, 200000], kernPlattformen: ["Staat im Umbau — Bestände unklar"], beziehung: "Grenzland mit Gebietsfrage (Welle K)", quelle: "Lücke" },
];

/** Rüstungsexportlinie (belegt; Startwert für sim/diplomatie.ts). */
export const RUESTUNG_EXPORT = {
  mrdDollar2024: 7.154, // SSB (+29 % ggü. 2023)
  mrdDollar_12M_2025: 10.054, // Handelsminister Bolat, AA 30.1.2026
  firmenAnker: [
    { firma: "ASELSAN", zahl: "Umsatz 2024: 120 Mrd. TL (+13 % real), Gewinn 15,2 Mrd. TL" },
    { firma: "BAYKAR", zahl: "Export 2024: 1,8 Mrd. $, 90 % Exportanteil" },
    { firma: "ROKETSAN", zahl: "Umsatz 2024 +45 % ($); Export 750 Mio. $ bis Ende 2025" },
    { firma: "TUSAŞ", zahl: "Fortune-500-TR-Defense Platz 26 (+11)" },
  ],
};

// ---------------------------------------------------------------------------
// Reine Rechnungen

/** Generationsprofil einer Gattung: Anteil je Generation (für Balken und Kampfwert). */
export function generationsprofil(zeilen: BestandsZeile[], gattung: Gattung): { alt: number; mitte: number; modern: number } {
  const gefiltert = zeilen.filter((z) => z.gattung === gattung && z.anzahl > 0);
  const gesamt = gefiltert.reduce((s, z) => s + z.anzahl, 0);
  if (gesamt === 0) return { alt: 0, mitte: 0, modern: 0 };
  const anteil = (gen: Generation) => Math.round((gefiltert.filter((z) => z.generation === gen).reduce((s, z) => s + z.anzahl, 0) / gesamt) * 100);
  return { alt: anteil("alt"), mitte: anteil("mitte"), modern: anteil("modern") };
}

/** Kampfwert-Hinweis: Masse alt ist eine Schwäche, Masse modern eine Stärke (Wort für die Akte). */
export function generationsBewertung(p: { alt: number; mitte: number; modern: number }): string {
  if (p.alt >= 60) return "Die Masse ist alt; Modernisierung ohne Generationswechsel wird teuer und langsam.";
  if (p.modern >= 50) return "Mehr als die Hälfte ist modern; der Bestand trägt einen Generationssprung.";
  return "Gemischter Bestand: Masse trägt, Modernität fehlt an den Rändern.";
}

/** Nachbarn-Wachstumsdruck: Reaktion der Gegenseite auf eigene Beschaffung (Kalibrierfall Griechenland-F-35). */
export function nachbarReaktion(eigeneStufe: "sparlinie" | "halt" | "modernisierung" | "sprung"): { land: "GRC" | "IRN" | "RUS"; text: string }[] {
  switch (eigeneStufe) {
    case "sprung":
      return [{ land: "GRC", text: "Griechenland beschleunigt seine F-35-Beschaffung (Kalibrierfall: 40 genehmigt, 20 kontraktiert, Juli 2024)." }];
    case "modernisierung":
      return [{ land: "GRC", text: "Griechenland kündigt Nachrüstung der Luftwaffe an." }];
    case "halt":
      return [{ land: "GRC", text: "Griechenland hält sein Tempo; niemand erwähnt die Pause." }];
    case "sparlinie":
      return [{ land: "RUS", text: "Moskau wertet die Sparlinie als Spielraum im Schwarzen Meer." }];
  }
}

/** Mobilisierungsskala mit echtem Preis (Vorschlag 5.5; Fachkräfte- und Wirtschaftskopplung an GLM_2). */
export type Mobilisierungsstufe = "frieden" | "uebung" | "teilweise" | "krieg";

export function mobilisierungswirkung(stufe: Mobilisierungsstufe, reservenBestand: number): { eingezogen: number; fachkraefteVerlustProzent: number; text: string } {
  const reserve = Math.max(10000, Math.min(reservenBestand, TUERKEI_PERSONAL.reserve));
  switch (stufe) {
    case "frieden":
      return { eingezogen: 0, fachkraefteVerlustProzent: 0, text: "Normalbetrieb; Reserven stehen auf Papier." };
    case "uebung":
      return { eingezogen: Math.round(reserve * 0.05), fachkraefteVerlustProzent: 0.2, text: "Wechselübungen: kleine Abzugswelle, kaum Wirtschaftseffekt." };
    case "teilweise":
      return { eingezogen: Math.round(reserve * 0.3), fachkraefteVerlustProzent: 1.5, text: "Teilmobilisierung: Exportbetriebe melden Lücken, Wählermilieus reagieren." };
    case "krieg":
      return { eingezogen: Math.round(reserve * 0.8), fachkraefteVerlustProzent: 4, text: "Vollmobilisierung: Wirtschaft zieht an der Uniform, die Wahlkampflage kippt." };
  }
}

/** Beschaffungsdauern — ausdrücklich Spielparameter (keine Belegquelle). */
export const BESCHAFFUNGSDAUERN_MONATE: Record<string, number> = {
  uboot: 108,
  kampfflugzeugEntwicklung: 144,
  kampfflugzeugKauf: 36,
  panzerProgramm: 78,
  luftverteidigung: 96,
  drohne: 24,
};
