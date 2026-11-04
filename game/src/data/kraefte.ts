// Gemeinsame Kräfteskala aller Staaten (PRUEFUNG_GESAMT_2026-11-04, Krieg): Früher bekamen Gegner einen festen Tabellenwert
// (Iran 58, Griechenland 52), die Türkei dagegen ein Produkt vieler Faktoren unter 1 (rund 33 im Normalstand). Folge: Die Türkei
// verlor mit der NATO an ihrer Seite gegen Iran. Jetzt stehen alle auf derselben Skala, gespeist aus zwei belegten Größen.
//
// Quellen: SIPRI Military Expenditure Database (Ausgaben in Mrd. US-Dollar; Türkei 2025: 30,0 Mrd., übrige 2024) und IISS/
// Länderauswertungen (aktive Soldaten), übernommen aus data/entwurf_glm/streitkraefte.ts (RECHERCHE_GLM_4_STREITKRAEFTE_RUESTUNG.md).
// Die Formel ist ein Spielparameter, keine Tatsache:  r = Ausgaben^0,35 · (Aktive in Tsd.)^0,35,  Stärke = 100 · (1 − e^(−r/45)).
// Die gleichen Exponenten gewichten Geld und Masse gleich; die Sättigung hält die Großmächte unter 100.
// Bekannte Grenze: Rüstungsimporteure mit hohen Ausgaben (Saudi-Arabien) liegen höher als ihre Kampfkraft; ohne Quelle für einen
// Korrekturfaktor bleibt das so.

export interface KraftBeleg {
  ausgabenMrdDollar: number;
  jahr: 2024 | 2025;
  aktiveTsd: number;
  quelle: string;
}

export const KRAFT_BELEG: Record<string, KraftBeleg> = {
  TUR: { ausgabenMrdDollar: 30.0, jahr: 2025, aktiveTsd: 355, quelle: "SIPRI 4/2026; IISS-Auswertung (untere Bandgrenze 355.000)" },
  USA: { ausgabenMrdDollar: 997, jahr: 2024, aktiveTsd: 1300, quelle: "SIPRI 4/2025" },
  RUS: { ausgabenMrdDollar: 149, jahr: 2024, aktiveTsd: 1100, quelle: "SIPRI 4/2025" },
  CHN: { ausgabenMrdDollar: 314, jahr: 2024, aktiveTsd: 2000, quelle: "SIPRI 4/2025" },
  GRC: { ausgabenMrdDollar: 14, jahr: 2024, aktiveTsd: 140, quelle: "SIPRI (~); DW 25.7.2024" },
  IRN: { ausgabenMrdDollar: 12, jahr: 2024, aktiveTsd: 600, quelle: "SIPRI-Schätzband breit (Lücke)" },
  SYR: { ausgabenMrdDollar: 0.5, jahr: 2024, aktiveTsd: 150, quelle: "Lücke: Staat im Umbau, Mitte des Bandes 100–200 Tsd." },
  ISR: { ausgabenMrdDollar: 46.5, jahr: 2024, aktiveTsd: 170, quelle: "SIPRI 4/2025 (+65 %)" },
  ARM: { ausgabenMrdDollar: 1.5, jahr: 2024, aktiveTsd: 45, quelle: "zu prüfen" },
  GEO: { ausgabenMrdDollar: 0.4, jahr: 2024, aktiveTsd: 37, quelle: "zu prüfen" },
  UKR: { ausgabenMrdDollar: 65, jahr: 2024, aktiveTsd: 850, quelle: "SIPRI (~); Mitte des Bandes 800–900 Tsd." },
  AZE: { ausgabenMrdDollar: 5, jahr: 2024, aktiveTsd: 126, quelle: "SIPRI (~)" },
  SAU: { ausgabenMrdDollar: 80.3, jahr: 2024, aktiveTsd: 250, quelle: "SIPRI 4/2025" },
  EGY: { ausgabenMrdDollar: 4, jahr: 2024, aktiveTsd: 450, quelle: "zu prüfen (Band 3–5)" },
  KAZ: { ausgabenMrdDollar: 2, jahr: 2024, aktiveTsd: 40, quelle: "zu prüfen" },
  DEU: { ausgabenMrdDollar: 107, jahr: 2024, aktiveTsd: 180, quelle: "SIPRI-Auswertung (~)" },
  GBR: { ausgabenMrdDollar: 94, jahr: 2024, aktiveTsd: 140, quelle: "SIPRI-Auswertung (~)" },
  FRA: { ausgabenMrdDollar: 70, jahr: 2024, aktiveTsd: 200, quelle: "SIPRI-Top10 (~)" },
  POL: { ausgabenMrdDollar: 35, jahr: 2024, aktiveTsd: 200, quelle: "SIPRI-Auswertung (~)" },
  ITA: { ausgabenMrdDollar: 34, jahr: 2024, aktiveTsd: 165, quelle: "zu prüfen" },
  BGR: { ausgabenMrdDollar: 2, jahr: 2024, aktiveTsd: 37, quelle: "zu prüfen" },
  ROU: { ausgabenMrdDollar: 9, jahr: 2024, aktiveTsd: 70, quelle: "zu prüfen" },
  PAK: { ausgabenMrdDollar: 10.5, jahr: 2024, aktiveTsd: 650, quelle: "zu prüfen" },
};

/** Stärke auf der gemeinsamen Skala 0–100 aus Ausgaben und Personal (Spielparameter-Formel, siehe Kopf). */
export function kraftAusBeleg(b: KraftBeleg): number {
  const r = Math.pow(b.ausgabenMrdDollar, 0.35) * Math.pow(b.aktiveTsd, 0.35);
  return Math.round(1000 * (1 - Math.exp(-r / 45))) / 10;
}

/**
 * Akteure ohne Beleg in der Tabelle: Spielparameter, von der alten Skala auf die neue umgerechnet (Faktor 0,6, der mittlere
 * Abstand der belegten Länder zwischen alter und neuer Skala). „EU“ ist kein Staat und kämpft nicht selbst (sim/pakte.ts).
 */
const OHNE_BELEG: Record<string, number> = { IRQ: 22, CYP: 8, LBY: 12, EU: 50 };

export const KRAFT: Record<string, number> = {
  ...Object.fromEntries(Object.entries(KRAFT_BELEG).map(([id, b]) => [id, kraftAusBeleg(b)])),
  ...OHNE_BELEG,
};

/** Die Türkei auf derselben Skala: Grundwert ihrer Streitkräfte im Normalstand (Bereitschaft, Moral, Teilmobilmachung). */
export const KRAFT_TUERKEI = KRAFT.TUR!;

/**
 * Der Normalstand, an dem sich die türkischen Faktoren messen (gemessen in Spielständen kurz nach Amtsantritt, Seeds 3/6/11):
 * gewichtete Bereitschaft 57,9, Moralfaktor 0,86, Nachschubfaktor 0,778, Teilmobilmachung 0,85. Bei genau diesem Stand ist
 * die türkische Stärke gleich ihrem Grundwert; besser vorbereitet, voll mobilisiert oder verbündet ist sie höher, schlecht
 * versorgt oder demoralisiert niedriger.
 */
export const NORMALSTAND = { bereitschaft: 57.9, moral: 0.86, nachschub: 0.778, mobilmachung: 0.85 } as const;
