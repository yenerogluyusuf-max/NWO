// Die Daten des Weltmodells (sim/welt-modell.ts): Startwerte der 18 Staaten aus den Weltbank-Daten des Spiels (data/vergleich.json,
// Stand 29.09.2026) und den Länderdossiers (RECHERCHE_REALWELT_LAENDERDOSSIERS.md), dazu Regierungsform, Wahltermine und die
// Anfangslage der Beziehungen untereinander (Konflikt-Topologie, Teil IV des Dossiers).
//
// Regel des Projekts: Quelle oder Lücke. Jede Zahl trägt ihre Herkunft:
//   „Weltbank <Jahr>“      letzter Wert im Datensatz des Spiels, nur wenn er neu genug ist
//   „Dossier <Nr.>“         Wert aus den Länderdossiers (dort belegt)
//   „Spielparameter“        Größenordnung aus allgemeiner Kenntnis, im Spiel NICHT neu belegt; Kalibrierung offen
// Alle Dynamik-Parameter (Rückkehrgeschwindigkeit, Streuung, Risiken) sind Spielparameter; sie stehen mit dieser Kennzeichnung
// in WELT_REGELN. Namen von Amtsinhabern kommen nicht vor: Das Spiel spricht von Orten und Ämtern („Washington“, „die EU-Kommission“).

import vergleich from "./vergleich.json";
import { ERSATZ_WEITERE } from "./welt-weitere";

export type Regierungsform = "demokratie" | "hybrid" | "autokratie" | "monarchie" | "uebergang";
export type Streuklasse = "fortgeschritten" | "aufstrebend" | "fragil";
export type Lager = "west" | "ost" | "golf" | "mitte" | "turk";

export interface Wahl {
  /** ISO-Datum; der Tag ist auf Wochen genau (Spielparameter), der Monat folgt der Amtszeit nach der Verfassungslage */
  datum: string;
  art: string;
}

export interface WeltDef {
  id: string;
  /** Weltbank-Kürzel (die EU steht für Deutschland als Maßstab, wie in sim/laender.ts) */
  iso: string;
  form: Regierungsform;
  klasse: Streuklasse;
  lager: Lager;
  /** +1 Energieexporteur, −1 Energieimporteur, 0 neutral (Spielparameter nach der Struktur der Ausfuhren) */
  energie: -1 | 0 | 1;
  /** Der Ort der Regierung für Nachrichtentexte */
  sitz: string;
  /** Die Regierung als Amt, ohne Namen (Nominativ, mit Artikel) */
  regierung: string;
  /** Genitiv/„von“ für Wahlmeldungen: „in den USA“ */
  inLand: string;
  wahlen: Wahl[];
  /** Kriegsbelastung zu Spielbeginn (0–100), Spielparameter nach der Lage in Teil IV des Dossiers */
  krieg0: number;
  /** Ob die Führung schon sehr lange im Amt ist oder ein Übergang läuft (Monate im Amt bei Spielbeginn); Spielparameter */
  amtsMonate0: number;
}

const D = (datum: string, art: string): Wahl => ({ datum, art });

export const WELT: WeltDef[] = [
  { id: "USA", iso: "USA", form: "demokratie", klasse: "fortgeschritten", lager: "west", energie: 0, sitz: "Washington", regierung: "die US-Regierung", inLand: "in den USA", krieg0: 20, amtsMonate0: 41,
    // Verfassung: Präsidentenwahl am Dienstag nach dem ersten Montag im November; Zwischenwahlen in der Mitte der Amtszeit
    wahlen: [D("2028-11-07", "Präsidentenwahl"), D("2030-11-05", "Zwischenwahlen"), D("2032-11-02", "Präsidentenwahl")] },
  { id: "EU", iso: "DEU", form: "demokratie", klasse: "fortgeschritten", lager: "west", energie: -1, sitz: "Brüssel", regierung: "die EU-Kommission", inLand: "in der EU", krieg0: 0, amtsMonate0: 18,
    // Europawahl alle fünf Jahre (Juni 2024, 2029); danach bildet sich die Kommission neu
    wahlen: [D("2029-06-07", "Europawahl"), D("2034-06-07", "Europawahl")] },
  { id: "RUS", iso: "RUS", form: "autokratie", klasse: "aufstrebend", lager: "ost", energie: 1, sitz: "Moskau", regierung: "der Kreml", inLand: "in Russland", krieg0: 55, amtsMonate0: 100,
    // Präsidentenwahl alle sechs Jahre (März 2024, 2030); Duma alle fünf Jahre (2026, 2031)
    wahlen: [D("2030-03-17", "Präsidentenwahl"), D("2031-09-21", "Dumawahl")] },
  { id: "GRC", iso: "GRC", form: "demokratie", klasse: "fortgeschritten", lager: "west", energie: -1, sitz: "Athen", regierung: "die griechische Regierung", inLand: "in Griechenland", krieg0: 0, amtsMonate0: 12,
    // Spätestens Mitte 2027 gewählt (Dossier 4); vier Jahre später die nächste Wahl
    wahlen: [D("2031-06-30", "Parlamentswahl")] },
  { id: "IRN", iso: "IRN", form: "autokratie", klasse: "fragil", lager: "ost", energie: 1, sitz: "Teheran", regierung: "die Führung in Teheran", inLand: "im Iran", krieg0: 50, amtsMonate0: 27,
    // Präsidentenwahl alle vier Jahre (Juli 2024 → Juni 2028); die Lage nach dem Krieg 2026 macht den Termin unsicher (Dossier 5)
    wahlen: [D("2028-06-30", "Präsidentenwahl")] },
  { id: "SYR", iso: "SYR", form: "uebergang", klasse: "fragil", lager: "mitte", energie: -1, sitz: "Damaskus", regierung: "die Übergangsregierung in Damaskus", inLand: "in Syrien", krieg0: 30, amtsMonate0: 42,
    // Fünfjährige Übergangsphase seit der Verfassungsdeklaration vom 29.03.2025 (Dossier 6)
    wahlen: [D("2030-03-29", "Ende der Übergangsphase")] },
  { id: "IRQ", iso: "IRQ", form: "hybrid", klasse: "fragil", lager: "mitte", energie: 1, sitz: "Bagdad", regierung: "die irakische Regierung", inLand: "im Irak", krieg0: 10, amtsMonate0: 30,
    // Parlamentswahl alle vier Jahre (November 2025 → November 2029)
    wahlen: [D("2029-11-11", "Parlamentswahl")] },
  { id: "AZE", iso: "AZE", form: "autokratie", klasse: "aufstrebend", lager: "turk", energie: 1, sitz: "Baku", regierung: "Baku", inLand: "in Aserbaidschan", krieg0: 8, amtsMonate0: 100,
    // Präsidentenwahl alle sieben Jahre (Februar 2024 → Februar 2031)
    wahlen: [D("2031-02-07", "Präsidentenwahl")] },
  { id: "ARM", iso: "ARM", form: "demokratie", klasse: "aufstrebend", lager: "mitte", energie: -1, sitz: "Eriwan", regierung: "die armenische Regierung", inLand: "in Armenien", krieg0: 8, amtsMonate0: 24,
    // Parlamentswahl alle fünf Jahre (Juni 2026 → Juni 2031; Dossier 11)
    wahlen: [D("2031-06-07", "Parlamentswahl")] },
  { id: "SAU", iso: "SAU", form: "monarchie", klasse: "aufstrebend", lager: "golf", energie: 1, sitz: "Riad", regierung: "Riad", inLand: "in Saudi-Arabien", krieg0: 12, amtsMonate0: 100,
    wahlen: [] },
  { id: "ISR", iso: "ISR", form: "demokratie", klasse: "fortgeschritten", lager: "west", energie: 0, sitz: "Jerusalem", regierung: "die israelische Regierung", inLand: "in Israel", krieg0: 35, amtsMonate0: 20,
    // Knesset-Wahl alle vier Jahre (27.10.2026 → Oktober 2030; Dossier 13, Unsicherheit U16)
    wahlen: [D("2030-10-27", "Parlamentswahl")] },
  { id: "CHN", iso: "CHN", form: "autokratie", klasse: "aufstrebend", lager: "ost", energie: -1, sitz: "Peking", regierung: "die chinesische Führung", inLand: "in China", krieg0: 0, amtsMonate0: 100,
    // Parteitag alle fünf Jahre (Oktober 2027 → Oktober 2032)
    wahlen: [D("2032-10-20", "Parteitag")] },
  { id: "UKR", iso: "UKR", form: "hybrid", klasse: "fragil", lager: "west", energie: -1, sitz: "Kiew", regierung: "die Regierung in Kiew", inLand: "in der Ukraine", krieg0: 90, amtsMonate0: 100,
    // Kriegsrecht: kein Wahltermin (Dossier 8)
    wahlen: [] },
  { id: "GEO", iso: "GEO", form: "hybrid", klasse: "aufstrebend", lager: "west", energie: -1, sitz: "Tiflis", regierung: "die georgische Regierung", inLand: "in Georgien", krieg0: 5, amtsMonate0: 44,
    // Parlamentswahl alle vier Jahre (Oktober 2024 → Oktober 2028)
    wahlen: [D("2028-10-28", "Parlamentswahl")] },
  { id: "EGY", iso: "EGY", form: "autokratie", klasse: "aufstrebend", lager: "golf", energie: -1, sitz: "Kairo", regierung: "die ägyptische Führung", inLand: "in Ägypten", krieg0: 5, amtsMonate0: 100,
    // Präsidentenwahl alle sechs Jahre (Amtszeit bis April 2030)
    wahlen: [D("2030-03-15", "Präsidentenwahl")] },
  { id: "LBY", iso: "LBY", form: "uebergang", klasse: "fragil", lager: "mitte", energie: 1, sitz: "Tripolis", regierung: "die Regierung in Tripolis", inLand: "in Libyen", krieg0: 25, amtsMonate0: 60,
    // Wahlen weiter ohne Termin (Dossier 15)
    wahlen: [] },
  { id: "KAZ", iso: "KAZ", form: "autokratie", klasse: "aufstrebend", lager: "turk", energie: 1, sitz: "Astana", regierung: "die Führung in Astana", inLand: "in Kasachstan", krieg0: 0, amtsMonate0: 100,
    // Einmalige siebenjährige Amtszeit seit November 2022 (Verfassungsreform 2022) → November 2029
    wahlen: [D("2029-11-20", "Präsidentenwahl")] },
  { id: "CYP", iso: "CYP", form: "demokratie", klasse: "fortgeschritten", lager: "west", energie: -1, sitz: "Nikosia", regierung: "die zyprische Regierung", inLand: "in Zypern", krieg0: 0, amtsMonate0: 4,
    // Parlamentswahl alle fünf Jahre (Mai 2026 → Mai 2031), Präsidentenwahl Februar 2028 → Februar 2033 (Dossier 17)
    wahlen: [D("2031-05-25", "Parlamentswahl"), D("2033-02-19", "Präsidentenwahl")] },
];

export const WELT_NACH_ID = new Map(WELT.map((d) => [d.id, d]));

// ---------------------------------------------------------------------------
// Weltbank-Zugriff (nur Werte, die jung genug sind)

interface Indikator {
  median: number;
  laender: Record<string, [number, number]>;
}
const IND = (vergleich as unknown as { indikatoren: Record<string, Indikator> }).indikatoren;

export type Code = "wachstum" | "inflation" | "schulden" | "ruestung" | "defizit";
export const WB_CODE: Record<Code, string> = {
  wachstum: "NY.GDP.MKTP.KD.ZG",
  inflation: "FP.CPI.TOTL.ZG",
  schulden: "GC.DOD.TOTL.GD.ZS",
  ruestung: "MS.MIL.XPND.GD.ZS",
  defizit: "GC.NLD.TOTL.GD.ZS",
};
/** Ältestes Jahr, das als Startwert gilt: Ströme müssen jung sein, Bestände dürfen älter sein. */
export const WB_MINDESTJAHR: Record<Code, number> = { wachstum: 2023, inflation: 2023, ruestung: 2022, schulden: 2018, defizit: 2020 };

export interface Wert {
  wert: number;
  /** „Weltbank 2025“, „Dossier 15“ oder „Spielparameter“ */
  herkunft: string;
}

/** Der Weltbank-Wert eines Landes, falls er jung genug ist. */
export function weltbank(iso: string, code: Code): Wert | undefined {
  const w = IND[WB_CODE[code]]?.laender[iso];
  if (!w || w[1] < WB_MINDESTJAHR[code]) return undefined;
  return { wert: w[0], herkunft: `Weltbank ${w[1]}` };
}

/** Ein Rohwert aus dem Weltbank-Datensatz des Spiels, gleich welchen Alters: [Wert, Jahr]. */
export function weltbankRoh(code: string, iso: string): [number, number] | undefined {
  return IND[code]?.laender[iso];
}

/** Der Mittelwert (Median) des Datensatzes: der gemeinsame Anker, zu dem Trends zurückkehren. */
export function weltbankMedian(code: Code): number {
  return IND[WB_CODE[code]]?.median ?? 0;
}

/**
 * Ersatzwerte, wo der Weltbank-Datensatz des Spiels keinen jungen Wert hat. Dossier-Werte sind dort belegt;
 * „Spielparameter“ sind Größenordnungen aus allgemeiner Kenntnis (IWF-Reihen), die im Spiel nicht neu geprüft wurden.
 */
export const ERSATZ: Record<string, Partial<Record<Code, Wert>>> = {
  // Dossier 6 (Syrien): „Wachstum ~1 % (WB)“; Preise und Staatsfinanzen sind im Dossier nicht belegt
  SYR: { wachstum: { wert: 1, herkunft: "Dossier 6" }, inflation: { wert: 25, herkunft: "Spielparameter" }, schulden: { wert: 40, herkunft: "Spielparameter" }, ruestung: { wert: 3, herkunft: "Spielparameter" } },
  // Dossier 15 (Libyen): Wachstum 6,4–6,7 %, Inflation 12,4 % (03/2026) gegen 2,5 % (WB-Prognose, Unsicherheit U7) → Mittel; Fiskaldefizit ~30 % des BIP
  LBY: { wachstum: { wert: 6.5, herkunft: "Dossier 15" }, inflation: { wert: 7.5, herkunft: "Dossier 15" }, schulden: { wert: 15, herkunft: "Spielparameter" }, ruestung: { wert: 4, herkunft: "Spielparameter" }, defizit: { wert: -30, herkunft: "Dossier 15" } },
  // Dossier 16 (Kasachstan): Wachstum 4,5–5,5 %, Inflation 9,7–10,7 % (IWF 04/2026)
  KAZ: { wachstum: { wert: 5, herkunft: "Dossier 16" }, inflation: { wert: 10.2, herkunft: "Dossier 16" }, schulden: { wert: 25, herkunft: "Spielparameter" }, ruestung: { wert: 1, herkunft: "Spielparameter" } },
  // Dossier 17 (Zypern, Süd): Wachstum ~3 % (2026–28), Inflation 1,7 %, Schulden 56,2 % des BIP
  CYP: { wachstum: { wert: 3, herkunft: "Dossier 17" }, inflation: { wert: 1.7, herkunft: "Dossier 17" }, schulden: { wert: 56.2, herkunft: "Dossier 17" }, ruestung: { wert: 1.5, herkunft: "Spielparameter" } },
  // Staatsschulden: der Weltbank-Wert fehlt oder ist zu alt (Griechenland, Iran, Saudi-Arabien, China: ohne Wert; Israel 1999, Ägypten 2007,
  // Aserbaidschan 2010, Deutschland 1990). Größenordnungen der IWF-Reihen, nicht neu geprüft.
  GRC: { schulden: { wert: 150, herkunft: "Spielparameter" } },
  IRN: { schulden: { wert: 35, herkunft: "Spielparameter" } },
  SAU: { schulden: { wert: 26, herkunft: "Spielparameter" } },
  CHN: { schulden: { wert: 60, herkunft: "Spielparameter" }, defizit: { wert: -4, herkunft: "Spielparameter" } },
  ISR: { schulden: { wert: 68, herkunft: "Spielparameter" } },
  EGY: { schulden: { wert: 85, herkunft: "Spielparameter" }, defizit: { wert: -7, herkunft: "Spielparameter" } },
  AZE: { schulden: { wert: 20, herkunft: "Spielparameter" } },
  DEU: { schulden: { wert: 64, herkunft: "Spielparameter" } },
  EU: { schulden: { wert: 64, herkunft: "Spielparameter" } },
  // Dossier 1 (USA): Schulden Richtung 140 % bis 2031, Defizit 7–8 %; der Weltbank-Wert 115,8 % (2024) bleibt als Start
  IRQ: { defizit: { wert: -3, herkunft: "Spielparameter" } },
};

/** Der Startwert einer Größe: Weltbank vor Ersatz vor einer neutralen Lücke. */
export function startwert(id: string, iso: string, code: Code): Wert {
  const ers = ERSATZ[id]?.[code];
  const wb = weltbank(iso, code);
  // Wo der Ersatz ausdrücklich gesetzt ist (Dossier-Wert), schlägt er einen schwachen oder fehlenden Weltbank-Wert
  if (ers && (!wb || ers.herkunft.startsWith("Dossier"))) return ers;
  if (wb) return wb;
  if (ers) return ers;
  const weitere = ERSATZ_WEITERE[id]?.[code];
  if (weitere !== undefined) return { wert: weitere, herkunft: "Spielparameter" };
  const neutral: Record<Code, number> = { wachstum: 3, inflation: 5, schulden: 50, ruestung: 2, defizit: -3 };
  return { wert: neutral[code], herkunft: "Spielparameter" };
}

// ---------------------------------------------------------------------------
// Regeln der Dynamik (alle Spielparameter, Kalibrierung offen)

export const WELT_REGELN = {
  /** Rückkehr zum Trend je Monat */
  kappaWachstum: 0.06,
  kappaInflation: 0.05,
  kappaStabilitaet: 0.08,
  kappaRueckhalt: 0.06,
  kappaRuestung: 0.04,
  /**
   * Streuung (stationäre Standardabweichung) der Wachstumsrate in Prozentpunkten und der Inflation in Prozentpunkten je Klasse:
   * Größenordnung der Streuung jährlicher Raten nach Einkommens- und Stabilitätsgruppe. Der Datensatz des Spiels enthält nur den
   * letzten Wert je Land, daher ist sie nicht daraus berechnet.
   */
  sdWachstum: { fortgeschritten: 1.5, aufstrebend: 2.8, fragil: 4.5 } as Record<Streuklasse, number>,
  sdInflation: { fortgeschritten: 1.2, aufstrebend: 3.5, fragil: 8 } as Record<Streuklasse, number>,
  /** Anteil des Weltbank-Werts am Trend; der Rest ist der Median des Datensatzes (Rückkehr zur Mitte der Welt) */
  trendAnteilLand: 0.5,
  /** Wachstums-Mitnahme durch die großen Volkswirtschaften (USA, EU, China) je Monat, mal Offenheit */
  mitnahme: 0.08,
  /** Wirkung des Energiepreises (Indexpunkte über 100) auf das Trendwachstum: Exporteure gewinnen mehr, als Importeure verlieren */
  oelWachstumExporteur: 0.025,
  oelWachstumImporteur: -0.012,
  oelInflationImporteur: 0.04,
  /** Monatliche Chance eines Machtwechsels außerhalb der Wahlen, je Regierungsform (Basisrate; steigt bei Instabilität) */
  wechselMonat: { demokratie: 0.0006, hybrid: 0.0015, autokratie: 0.0012, monarchie: 0.002, uebergang: 0.004 } as Record<Regierungsform, number>,
  /** Wie oft ein Staat im Monat handelt (Chance), je Streuklasse */
  handlungChance: { fortgeschritten: 0.3, aufstrebend: 0.22, fragil: 0.16 } as Record<Streuklasse, number>,
  /** Höchstens so viele Großereignisse (Entscheidungen für den Spieler) im Abstand von so vielen Tagen */
  ereignisAbstand: 150,
} as const;

// ---------------------------------------------------------------------------
// Beziehungen untereinander (Anfangslage)

export interface PaarStart {
  a: string;
  b: string;
  /** −100 (Gegner) bis +100 (Verbündete) */
  buendnis: number;
  /** 0–100 */
  spannung: number;
  /** 0–100 */
  handel: number;
  quelle: string;
}

const P = (a: string, b: string, buendnis: number, spannung: number, handel: number, quelle: string): PaarStart => ({ a, b, buendnis, spannung, handel, quelle });

/** Ausdrücklich bekannte Paare; alles andere folgt der Lagerregel (LAGER_BUENDNIS). Werte sind Spielparameter nach den genannten Quellen. */
export const PAARE: PaarStart[] = [
  P("USA", "IRN", -90, 92, 2, "Dossier Teil IV A1: Krieg seit 28.02.2026, Blockade, Sanktionen"),
  P("ISR", "IRN", -95, 80, 0, "Dossier Teil IV A1; Spannung folgt dem Konflikt-Index der Vermittlung (isr_irn)"),
  P("RUS", "UKR", -95, 80, 5, "Dossier Teil IV A2: Krieg seit 24.02.2022; Spannung folgt dem Konflikt-Index der Vermittlung (ukr_rus)"),
  P("ARM", "AZE", -20, 45, 12, "Dossier Teil IV A3: Friedensvertrag parafiert, nicht signiert; Spannung folgt dem Konflikt-Index (arm_aze)"),
  P("USA", "RUS", -45, 62, 8, "Dossier Teil IV B7: Sanktionsregime (Rosneft/Lukoil 11/2025)"),
  P("USA", "CHN", -25, 50, 55, "Dossier Teil IV B8: Zoll-Waffenruhe, Technologiekrieg"),
  P("EU", "RUS", -60, 70, 15, "Dossier 2/3: Sanktionen, Ukraine-Finanzierung"),
  P("SAU", "IRN", -55, 70, 5, "Dossier Teil IV B3: Huthi-Angriffe, Golf-Sicherheitsarchitektur"),
  P("ISR", "SYR", -40, 55, 5, "Dossier Teil IV B4: Pufferzonen, Bombardement 08/2026"),
  P("RUS", "GEO", -35, 45, 10, "Dossier Teil IV B6: besetzte Gebiete Abchasien und Südossetien"),
  P("GRC", "CYP", 75, 5, 40, "Beide EU-Mitglieder; Dossier Teil IV B1"),
  P("EGY", "LBY", 15, 25, 20, "Dossier Teil IV B5: Grenzsicherung, Haftar-Seegrenz-Deal 12/2025"),
  P("RUS", "LBY", 20, 20, 10, "Dossier 15: russisches Africa Corps im Osten und Süden"),
  P("EU", "UKR", 60, 20, 45, "Dossier 2/8: Finanzierung 90 Mrd. € 2026–27, Beitrittsweg"),
  P("USA", "UKR", 50, 25, 20, "Dossier 8/1: Hilfszusagen, Vermittlung"),
  P("KAZ", "RUS", 35, 20, 55, "Dossier 16: eng an Moskau gebunden"),
  P("KAZ", "CHN", 35, 15, 50, "Dossier 16: eng an Peking gebunden"),
  P("IRN", "RUS", 30, 15, 25, "Dossier 5: Partnerschaft im Schatten der Sanktionen"),
  P("IRN", "CHN", 30, 15, 40, "Dossier 5: Ölabnehmer"),
  P("IRQ", "IRN", 30, 25, 45, "Dossier 7: Einfluss Teherans im Irak"),
  P("USA", "ISR", 80, 5, 40, "Dossier 1/13: Verbündeter, gemeinsamer Krieg gegen den Iran"),
  P("USA", "SAU", 45, 15, 35, "Dossier 12"),
  P("USA", "EU", 60, 15, 60, "Dossier 1/2: Handel, Ukraine, Energiepreise"),
  P("USA", "GRC", 55, 10, 25, "NATO-Verbündete"),
  P("EU", "GRC", 85, 5, 70, "Mitgliedstaat"),
  P("EU", "CYP", 85, 5, 60, "Mitgliedstaat"),
  P("EU", "ISR", 10, 30, 30, "Dossier 2/13: Kritik an Gaza-Krieg, Handel läuft"),
  P("EGY", "SAU", 55, 10, 35, "Dossier 14: Geldgeber"),
  P("EGY", "ISR", 10, 30, 15, "Dossier 14: Frieden seit 1979, kalt"),
  P("EGY", "USA", 35, 15, 30, "Dossier 14"),
  P("SYR", "SAU", 30, 15, 20, "Dossier 6: Wiederaufbau, Geld aus dem Golf"),
  P("SYR", "IRN", -30, 35, 3, "Dossier 6: Sturz des Assad-Regimes, iranischer Einfluss verloren"),
  P("CHN", "RUS", 50, 10, 60, "Dossier Teil IV B8, Dossier 3"),
  P("CHN", "SAU", 25, 15, 45, "Ölabnahme"),
  P("AZE", "RUS", -10, 35, 25, "Spielparameter: Spannungen seit 2025, Dossier 10"),
  P("AZE", "ISR", 40, 15, 30, "Dossier 10: Öllieferungen, Rüstungsgeschäfte"),
  P("ARM", "RUS", -10, 30, 35, "Dossier 11: Abwendung von Moskau"),
  P("GEO", "EU", 15, 30, 35, "Dossier 9: Kurs der Regierung rückt von der EU ab"),
];

/** Bündniswert zweier Lager, wo kein Paar ausdrücklich bekannt ist (Spielparameter). */
export const LAGER_BUENDNIS: Record<Lager, Partial<Record<Lager, number>>> = {
  west: { west: 35, ost: -35, golf: 10, mitte: 5, turk: 5 },
  ost: { ost: 25, golf: -5, mitte: 0, turk: -5 },
  golf: { golf: 30, mitte: 10, turk: 10 },
  mitte: { mitte: 5, turk: 5 },
  turk: { turk: 35 },
};

export function lagerBuendnis(a: Lager, b: Lager): number {
  return LAGER_BUENDNIS[a][b] ?? LAGER_BUENDNIS[b][a] ?? 0;
}

/** Konfliktpaare der Vermittlung (data/konflikte.ts): Deren Konflikt-Index ist die Wahrheit der Spannung des Paares. */
export const VERMITTLUNG_PAARE: { id: string; a: string; b: string }[] = [
  { id: "ukr_rus", a: "RUS", b: "UKR" },
  { id: "isr_irn", a: "IRN", b: "ISR" },
  { id: "arm_aze", a: "ARM", b: "AZE" },
];

/** Heiße Paare: Aus ihrer Spannung folgt die Kriegsbelastung beider Länder (Faktor = Anteil der Spannung). Spielparameter. */
export const HEISSE_PAARE: { a: string; b: string; faktor: number }[] = [
  { a: "RUS", b: "UKR", faktor: 1.0 },
  { a: "IRN", b: "ISR", faktor: 0.6 },
  { a: "IRN", b: "USA", faktor: 0.5 },
  { a: "ISR", b: "SYR", faktor: 0.35 },
  { a: "SAU", b: "IRN", faktor: 0.25 },
  { a: "ARM", b: "AZE", faktor: 0.3 },
];
