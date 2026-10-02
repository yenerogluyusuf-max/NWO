// Die Diaspora als politische und ökonomische Größe (RECHERCHE_DIASPORA.md, Kapitel 6).
// Sie ist (noch) keine eigene Wählergruppe in sim/gruppen.ts — siehe dort den TODO-Verweis —
// sondern zunächst ein Datenmodul für Wahlmodul, Devisenkanal und Ereignisse.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), kalibriert auf die Wahl 2023
// (YSK) und die Zahlungsbilanz-Daten der TCMB — keine Tatsachenbehauptungen.

/** Länder-Cluster des Auslandswahlrechts (Recherche 6.1, Länder-Modifikatoren). */
export type DiasporaLand =
  | "belgien"
  | "oesterreich"
  | "deutschland"
  | "frankreich"
  | "niederlande"
  | "anglosphaere"; // USA, UK, Skandinavien, Kanada — spätere, gebildetere, säkularere Migration

export interface DiasporaLandProfil {
  land: DiasporaLand;
  /**
   * Regierungslager-Plus gegenüber dem Inland bei Präsidentschaftswahlen, in Prozentpunkten
   * (Stichwahl 2023: BE 74,7 %, AT 73,9 %, DE 67,4 %, FR 66,8 % vs. Inland 52,2 %; SWP 2024A31).
   * Negativ heißt: Opposition überrepräsentiert.
   */
  lagerModifikatorPp: number;
  /** Anteil an allen registrierten Auslandswählern (YSK 2023: DE 1.501.152 von 3.416.098 ≈ 44 %) */
  anteilWaehler: number;
  /** Starker pro-kurdischer Block (Frankreich: HDP/YSP 17,9 % bei der Parlamentswahl 2023) */
  proKurdischStark?: boolean;
}

export const DIASPORA_LAENDER: DiasporaLandProfil[] = [
  { land: "deutschland", lagerModifikatorPp: 15, anteilWaehler: 0.44 },
  { land: "frankreich", lagerModifikatorPp: 14, anteilWaehler: 0.12, proKurdischStark: true },
  { land: "niederlande", lagerModifikatorPp: 15, anteilWaehler: 0.08 }, // plausibilisiert aus Parlamentsdaten (AKP+MHP 66,4 %)
  { land: "belgien", lagerModifikatorPp: 22, anteilWaehler: 0.04 },
  { land: "oesterreich", lagerModifikatorPp: 21, anteilWaehler: 0.03 },
  // Spielparameter: Richtung belegt (KAS/Yücel 2023), Größe unverifiziert — Kalibrierung offen
  { land: "anglosphaere", lagerModifikatorPp: -15, anteilWaehler: 0.09 },
  // Rest (KKTC 140.111, Schweiz, Schweden, Golf, Australien u. a.): anteilWaehler ergibt sich als Differenz
];

/** Grundparameter der Diaspora-Wählergruppe (Recherche 6.1, kalibriert auf 2023). */
export const DIASPORA_PROFIL = {
  /** Registrierte Auslandswähler 2023 (YSK): 3.416.098 (1. Tur) / 3.423.759 (Stichwahl) */
  registrierteWaehler: 3_420_000,
  /** Anteil an der Gesamtwählerschaft (64,1 Mio.) */
  anteilWählerschaft: 0.053,
  /** Baseline-Wahlbeteiligung Ausland 2018/2023: ~50 % (Korridor 45–55 %; Inland ~88 %) */
  beteiligung: 0.5,
  beteiligungKorridor: { min: 0.45, max: 0.55 },
  /** Effektive Auslandsstimmen 2023: ~1,8 Mio. von ~55,8 Mio. (1. Tur) */
  anteilStimmen: 0.033,
  /**
   * Lager-Verteilung im Ausland (Parlamentswahl 2023, SWP 2024A31: AKP+MHP 62–69 % in Westeuropa).
   * Summe muss 100 ergeben.
   */
  lagerVerteilung: { regierung: 62, mitteLinks: 26, proKurdisch: 8, sonstige: 4 },
  /** Regierungslager-Plus Ausland gesamt vs. Inland, Präsidentschaft (Stichwahl 2023: 59,7 % vs. 52,2 %) */
  lagerModifikatorInlandPp: 7,
  /**
   * Diaspora stimmt nur bei Präsidentschafts-, Parlamentswahlen und Referenden ab —
   * bei Kommunalwahlen ist sie inaktiv (Anadolu Ajansı, 31.03.2024).
   */
  nurNationaleWahlen: true,
  /** Generationendrift: pro Legislaturperiode schrumpft das Regierungslager-Plus (Richtung belegt, Tempo unverifiziert) */
  generationendriftPpProLegislatur: { min: -2, max: -1 },
  /** Einbürgerungswelle im Gastland (StARModG 2024): Doppelstaatler bleiben wahlberechtigt, Bindung driftet Richtung Inlandsniveau */
  einbuergerungsDriftPpProJahr: 0.5,
  /** Dauerhaftes Polster durch regierungsnahe türkische Medien in der Diaspora (Karaahmetoğlu-Analyse, KAS 2023) */
  medienPolsterPp: 3,
  /** Mobilisierungsmultiplikator durch Konsulate, Moscheenetz (~900 Gemeinden in DE) und Vorfeldorganisation (~30.000 Aktive, Selbstauskunft) */
  mobilisierungsMultiplikator: 1.5,
} as const;

/** Kampagne „Auslandstour" (Recherche 6.1, Mechanik-Regel 2): historische Mobilisierungsstärke von Konsulat/UID/YTB-Netz. */
export const DIASPORA_KAMPAGNE = {
  beteiligungPlusPp: { min: 3, max: 8 },
  lagerPlusPp: { min: 2, max: 4 },
  /** Chance auf Einreise-/Auftrittsverbot durch das Gastland (NL/DE 2017, Wahllokal-Absagen 2023) */
  auftrittsverbotChance: 0.25,
  beziehungGastland: { min: -15, max: -5 },
  /** Belagerungs-Narrativ: Verbot befeuert eher die Beteiligung (2017-Muster) */
  belagerungBeteiligungPp: 2,
} as const;

/**
 * Der „Döviz-Pfad" (Recherche 4.2 und 6.2): Barmittel, Tourismus und die Zahlungsbilanz-Position
 * „Netto-Fehler und -Auslassungen" (NHN). Zweischneidig: Bei Vertrauen fließt Diaspora-Geld rein,
 * bei Vertrauenskrise dreht der Kanal.
 */
export const DIASPORA_DOEVIZ = {
  /** Offizielle Remittances (Weltbank 2024: 982 Mio. USD) — statistisch fast verschwunden, spielmechanisch vernachlässigbar */
  remittancesMrdUsd: 1,
  /** NHN-Benchmark Zufluss (2022: +24,2 Mrd. USD, revidiert +28,8 — Cumhuriyet-Rekord, TCMB) */
  krisenZuflussMrdUsd: { min: 5, max: 20 },
  /** Schwelle des Diaspora-Vertrauens, ab der der Kanal in der Krise offen ist */
  vertrauenZuflussAb: 60,
  /** Schwelle, unter der der Kanal in den Abfluss dreht (2023–2025: −37,3 Mrd. USD kumuliert, TCMB via Halk TV, 14.02.2026) */
  vertrauenAbflussAb: 40,
  /** NHN-Benchmark Abfluss je Jahr (2025: −16,6 Mrd. USD) */
  abflussMrdUsd: { min: -16, max: -10 },
  /** YUVAM: kurkorumalı Diaspora-Einlagen, Zentralbank-Zuschlag 1–3 % p.a.; 2025 als einziges KKM-Überbleibsel fortgeführt (TCMB, 23.08.2025) */
  yuvam: { zuschlagPaPct: { min: 1, max: 3 }, vertrauenPlus: 5 },
  /** „Gurbetçi-Sommer": 9,6 Mio. Diaspora-Ankünfte, ~10,4 Mrd. USD (17 % der Tourismuseinnahmen 2024, TÜİK) */
  tourismus: {
    einnahmenMrdUsd: 10.4,
    anteilTourismussektor: 0.17,
    /** Reisewarnung oder Grenzschikane: −30 % Ankünfte für eine Saison */
    reisewarnungVerlustMrdUsd: 3,
  },
} as const;

/**
 * Ereignis-Karten der Diaspora als Konfliktquelle (Recherche 6.3, mit historischem Beleg).
 * Alle Effekte sind Spielparameter (Platzhalter der Kalibrierung).
 */
export interface DiasporaEreignis {
  id: string;
  titel: string;
  /** Historischer Beleg aus der Recherche (nur Kommentar-Kontext) */
  beleg: string;
  beziehungGastland: number;
  diasporaBeteiligungPp?: number;
  diasporaMobilisierung?: number;
}

export const DIASPORA_EREIGNISSE: DiasporaEreignis[] = [
  // DITIB 2016/17: 19 Imame, GBA-Ermittlungen, Einstellung 11.08.2022 (Tagesspiegel)
  { id: "imam_affaere", titel: "Spitzelberichte aus Moscheen an Konsulate aufgedeckt", beleg: "DITIB-Affäre 2016/17", beziehungGastland: -15 },
  // Fidan→Kahl-Liste 2017: >300 Personen, >200 Vereine (SZ/NDR/WDR)
  { id: "geheimdienst_liste", titel: "Geheimdienst-Liste mit Regimekritikern wird publik", beleg: "MIT-Liste an den BND, 2017", beziehungGastland: -20 },
  // Merih Demiral, EM 02.07.2024: UEFA-Sperre, gegenseitige Botschafter-Einbestellungen
  { id: "wolfsgruss", titel: "Prominenter zeigt ultranationalistisches Symbol im Gastland", beleg: "Wolfsgruß-Affäre, EM 2024", beziehungGastland: -10, diasporaMobilisierung: 5 },
  // 9 nicht-konsularische Wahllokale 2023 nicht genehmigt (YSK 2023/779)
  { id: "wahllokal_streit", titel: "Gastland verweigert Wahllokale und Auftritte", beleg: "Standort-Absagen 2023; NL/DE 2017", beziehungGastland: -10, diasporaBeteiligungPp: 4 },
  // PKK in Deutschland verboten seit 26.11.1993, ~14.500 Anhänger (BfV/BMI 2023)
  { id: "exil_gewalt", titel: "Gewalt zwischen PKK-Umfeld und türkischen Nationalisten im Gastland", beleg: "PKK-Verbot seit 1993", beziehungGastland: -10 },
  // StARModG seit 27.06.2024: türkische Einbürgerungen +110 % (2024), +51 % (2025) — Destatis
  { id: "einbuergerungswelle", titel: "Gastland liberalisiert die Staatsbürgerschaft", beleg: "Einbürgerungsreform Deutschland 2024", beziehungGastland: 10 },
  // FR-Verbot Grauenwölfe 2020, AT-Strafbarkeit Wolfsgruß 2019, EU-Parlaments-Forderung 2021
  { id: "verbotsdebatte", titel: "Gastland diskutiert Verbot der Ülkücü-Bewegung", beleg: "FR 2020 / AT 2019 / EU-Parlament 2021", beziehungGastland: -10, diasporaMobilisierung: 5 },
  // Kavcıoğlu-NHN-Logik 2022; YUVAM 2022/2025 (TCMB)
  { id: "remittance_retter", titel: "Währungskrise: Regierung appelliert an Diaspora-Ersparnisse", beleg: "NHN-Zuflüsse 2022; YUVAM", beziehungGastland: 0 },
  // Konsulate als „zentrale Rolle" bei der Mobilisierung (SWP 2024A31)
  { id: "konsulats_affaere", titel: "Konsulate nutzen Wählerdaten für Parteizwecke", beleg: "Konsularische Mobilisierung 2023", beziehungGastland: -10 },
];
