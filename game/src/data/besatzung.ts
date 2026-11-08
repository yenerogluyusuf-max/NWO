// Besatzung als Verwaltung und Annexion mit Folgen (Welle 3, K5; dokumentation/analyse_2026-11-05/bereiche/krieg.md Schritte 8 und 9,
// Befunde A4, A6, C5, C6, C8). Recherche: dokumentation/analyse_2026-11-05/bereiche/recherche_besatzung.md (im Folgenden „RB“) und die
// Nachrecherche vom 08.11.2026 (Quellen unten je Zahl).
//
// Fünf Formen nach echten Vorbildern. Jede Zahl trägt hier eine Quelle oder heißt ausdrücklich „Spielparameter“. Die drei Jahre einer
// Form rechnet sim/besatzung.ts (`formKurve`) mit derselben Monatsrechnung, die das Spiel bucht.

import type { Gelaende } from "./schauplaetze";

export type BesatzungsForm = "zone" | "zivil" | "satellit" | "annexion";
/** Was der Friedenstisch (K4) oder die Akte je Region festlegt: eine der vier Formen oder die Rückgabe. */
export type BesatzungsWahl = BesatzungsForm | "rueckgabe";
export const FORMEN: BesatzungsForm[] = ["zone", "zivil", "satellit", "annexion"];

/** Alte Namen aus Spielständen vor Welle 3, K5. */
export const ALTE_FORM: Record<string, BesatzungsForm> = { pufferzone: "zone", verwaltung: "zivil" };

// ---------------------------------------------------------------------------
// Bezugszahlen (belegt)

/** Türkei: BIP je Einwohner 2024 in US-$ (IWF WEO, https://www.imf.org/external/datamapper/api/v1/NGDPDPC/TUR, Abruf 08.11.2026). */
export const TR_BIP_PRO_KOPF_USD = 15914;

/**
 * BIP je Einwohner 2024 in US-$ des Landes, dem die Region gehörte (Steuerkraft einer neuen Provinz).
 * IWF WEO, https://www.imf.org/external/datamapper/api/v1/NGDPDPC (Abruf 08.11.2026): Irak 6.388, Griechenland 24.688, Zypern 38.933,
 * Armenien 8.456, Iran 4.834. Syrien führt der IWF nicht; Weltbank, Pressemitteilung 07.07.2025: Bruttonationaleinkommen je Kopf 830 US-$ (2024),
 * https://www.worldbank.org/en/news/press-release/2025/07/07/new-world-bank-report-highlights-syria-s-economic-challenges-and-recovery-prospects-for-2025
 */
export const BIP_PRO_KOPF_USD: Record<string, number> = { SYR: 830, IRQ: 6388, GRC: 24688, CYP: 38933, ARM: 8456, IRN: 4834 };

/**
 * Anteil der Wahlberechtigten an den Einwohnern: Türkei 2023, 60.697.843 Wahlberechtigte im Inland (YSK, 18.04.2023; DHA:
 * https://www.dha.com.tr/politika/ysk-baskani-yener-64-milyon-113-bin-941-secmen-oy-kullanacak-2237229) bei 85.279.553 Einwohnern (TÜİK, ADNKS
 * 31.12.2022) = 71,2 %. Für eine neue Provinz gilt derselbe Anteil (Spielparameter: Syrien ist jünger, die Altersstruktur der Regionen ist nicht erhoben).
 */
export const WAEHLER_JE_EINWOHNER = 0.712;

// ---------------------------------------------------------------------------
// Die Formen

export interface FormDef {
  /** Vorbild und Beleg (nur im Code, keine Quellen in der Oberfläche) */
  vorbild: string;
  /** Sicherheit je Region und Monat in % des BIP (Truppen, Stützpunkte, Grenze); Spielparameter (Wert vor K5 übernommen) */
  sicherheitMonat: number;
  /** Dienste je Einwohner und Jahr als Anteil am türkischen BIP je Kopf (Schulen, Gesundheit, Strom, Haushaltshilfe) */
  dienstJeKopf: number;
  /** Ziel des Widerstands (0 bis 100); Spielparameter */
  widerstandZiel: number;
  /** Ansehen in der Welt je Monat (Netzknoten „ansehen“); Spielparameter */
  ansehenMonat: number;
  /** Ansehen beim Wechsel in diese Form; Spielparameter */
  ansehenWechsel: number;
  /** Rückkehr von Geflüchteten aus der Türkei je Monat (nur Syrien), Personen; Spielparameter mit belegter Obergrenze RUECKKEHR_MAX */
  rueckkehrMonat: number;
  /** Politisches Kapital für den Wechsel in diese Form; Spielparameter (Annexion wie vor K5) */
  pk: number;
}

export const FORM: Record<BesatzungsForm, FormDef> = {
  /**
   * Sicherheitszone: Militär hält das Gebiet, örtliche Räte und, wo es sie gibt, verbündete Kämpfer verwalten (Stellvertreter). Vorbild
   * Nordsyrien 2016 bis 2024: Syrische Interimsregierung in Azaz, Syrische Nationalarmee mit über 35 Fraktionen und 70.000 bis 90.000 Kämpfern,
   * über 100 türkische Stützpunkte (HRW, 29.02.2024, RB A.1). Die Fraktionen finanzieren sich selbst, auch über Abgaben von bis zu 50 % der Ernte
   * (HRW 2024), darum keine Dienstkosten. Menschenrechtsrisiko: Plünderung, Lösegeld, Eigentumsentzug (HRW 2024, Amnesty 02.08.2018,
   * UN-Untersuchungskommission; RB A.2), daher der Skandal in sim/ereignisse-besatzung.ts.
   */
  zone: { vorbild: "SNA/SIG Nordsyrien 2016–2024 (HRW 29.02.2024)", sicherheitMonat: 0.012, dienstJeKopf: 0, widerstandZiel: 35, ansehenMonat: -0.03, ansehenWechsel: 0, rueckkehrMonat: 3000, pk: 6 },
  /**
   * Zivilverwaltung über die Grenzprovinz: Die Gouverneure von Kilis, Gaziantep, Hatay und Şanlıurfa beaufsichtigen Bildung, Gesundheit,
   * Bankwesen und Hilfe; Lira und PTT als einzige Finanzdienstleister, Strom über das türkische Netz, rund 700 Schulen, Krankenhaus al-Bab
   * für 17 Mio. US-$ (HRW 29.02.2024; Anadolu; RB A.1). Zuständigkeit: Azez und Çobanbey unter Kilis, Cerablus und el-Bab unter Gaziantep
   * (Karar, „Suriye'nin kuzeybatısında ‚Fırat modeli‘“, https://www.karar.com/suriyenin-kuzeybatisinda-firat-modeli-796770), Afrin unter Hatay
   * (Hürriyet 2018), Tall Abyad–Ras al-Ain unter Şanlıurfa (HRW 2024). Die Gesamtkosten der Zonen sind eine Lücke (RB, Lücke 1):
   * `dienstJeKopf` 3 % ist ein Spielparameter, kleiner als TRNZ und Krim, weil Renten und Haushaltshilfe fehlen.
   */
  zivil: { vorbild: "Gouverneure Kilis/Gaziantep/Hatay/Şanlıurfa (HRW 2024)", sicherheitMonat: 0.012, dienstJeKopf: 0.03, widerstandZiel: 22, ansehenMonat: 0, ansehenWechsel: 1, rueckkehrMonat: 10000, pk: 6 },
  /**
   * Satellitenstaat nach dem Muster der TRNZ (ausgerufen 15.11.1983; nur von der Türkei anerkannt; UN-SR 541 und 550, je 13:1:1; RB B).
   * Haushaltshilfe: Abkommen über wirtschaftliche und finanzielle Zusammenarbeit 2026, 21 Mrd. TL neu, mit Überträgen rund 23 Mrd. TL
   * (Milliyet, https://www.milliyet.com.tr/7568820), nach Angabe des Ministerpräsidenten rund 560 Mio. US-$ (Turkish Minute, 03.04.2026,
   * https://turkishminute.com/2026/04/03/turkey-to-provide-560-million-for-northern-cyprus-turkish-cypriot-pm-says/). Bei rund 490.000
   * Einwohnern (Band 383.000–590.000, RB B) sind das 1.143 US-$ je Kopf, also 7,2 % des türkischen BIP je Kopf (TR_BIP_PRO_KOPF_USD).
   */
  satellit: { vorbild: "TRNZ seit 1983; Hilfsabkommen 2026", sicherheitMonat: 0.01, dienstJeKopf: 0.072, widerstandZiel: 28, ansehenMonat: -0.05, ansehenWechsel: -3, rueckkehrMonat: 6000, pk: 10 },
  /**
   * Annexion: Die Region wird eine türkische Provinz (ENTSCHEIDUNGEN AA 1). Eingliederungskosten nach dem Vorbild Krim: Föderales
   * Zielprogramm 2015–2022 mit 877,8 Mrd. Rubel aus dem föderalen Haushalt (The Moscow Times, 24.03.2015; Black Sea News,
   * https://blackseanews.net/en/read/181961), also rund 110 Mrd. Rubel im Jahr für rund 2,68 Mio. Einwohner (Zählung Oktober 2014:
   * 2,28 Mio. Republik Krim, 0,39 Mio. Sewastopol) = 41.000 Rubel je Kopf. Russisches BIP 2015: 80,4 Bio. Rubel (Rosstat via TASS,
   * https://tass.com/economy/854032) bei 146,3 Mio. Einwohnern = 550.000 Rubel je Kopf. Ergebnis 7,5 % des BIP je Kopf, während der Eingliederung.
   * Danach trägt die Provinz ihre Steuern (sim/provinzen-neu.ts); Sicherheit wie in der Zone. Widerstand und Ansehen: Spielparameter
   * (Wert vor K5 übernommen).
   */
  annexion: { vorbild: "Krim 2014; Zielprogramm 2015–2022", sicherheitMonat: 0.012, dienstJeKopf: 0.075, widerstandZiel: 60, ansehenMonat: -0.15, ansehenWechsel: -8, rueckkehrMonat: 4000, pk: 14 },
};

/** Gelände erhöht den Widerstand (Spielparameter, Wert vor K5 übernommen). */
export const GELAENDE_WIDERSTAND: Record<Gelaende, number> = { ebene: 0, berge: 12, stadt: 10, insel: -5, kueste: 0 };

/**
 * Obergrenze der Rückkehr aus der Türkei nach Syrien je Monat, über alle Regionen zusammen: Göç İdaresi, 700.120 freiwillige Rückkehrer
 * zwischen dem 08.12.2024 und dem 27.06.2026 (RB A.5; Milliyet https://www.milliyet.com.tr/7582169), also 567 Tage, rund 37.000 im Monat
 * (UNHCR 30.04.2026: 639.995). Die Werte je Form oben sind Spielparameter darunter.
 */
export const RUECKKEHR_MAX = 37000;

/** Weitere Spielparameter der Besatzung (Werte vor K5 übernommen, wo nichts anderes steht). */
export const BESATZUNG = {
  /** Ab diesem Widerstand drohen Anschläge; ab `aufstand` über drei Monate fällt die Region zurück */
  anschlagAb: 50,
  aufstand: 85,
  /** Tempo, mit dem der Widerstand zu seinem Ziel strebt, je Monat (Anteil des Abstands) */
  tempo: 0.15,
  /** Ölfelder unter Kontrolle tragen einen Teil der Kosten selbst (% des BIP je Monat) */
  oelErtrag: 0.008,
  /** Kapital für die Rückgabe (keins) und für einen Formwechsel ohne eigene Angabe */
  pkWechsel: 6,
  pkAnnexion: 14,
  /** Widerstand, mit dem eine neu besetzte Region beginnt */
  widerstandStart: 30,
};
