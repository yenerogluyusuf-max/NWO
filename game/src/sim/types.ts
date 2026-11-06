// Datenmodell des Simulationskerns. Der Kern kennt keine Oberfläche und
// kein Sprachmodell; er verändert den Zustand nur nach seinen eigenen Regeln.

/** Haltung der Zentralbankführung (Wirtschaftsmodell, Abschnitt 5). */
export type GovernorStance = "vorsichtig" | "ausgewogen" | "gefuegig";

export interface Governor {
  name: string;
  stance: GovernorStance;
}

export interface EconomyState {
  /** Leitzins in % p. a. */
  policyRate: number;
  /** Tatsächliche Inflation, % zum Vorjahr (für den Spieler erst nach Veröffentlichung sichtbar). */
  inflation: number;
  /** Inflationserwartung von Haushalten und Firmen, % */
  expectedInflation: number;
  /** Inflationsziel der Zentralbank, % */
  inflationTarget: number;
  /** Glaubwürdigkeit der Zentralbank, 0 bis 1 (intern) */
  credibility: number;
  /** Auslastung: Abweichung vom Produktionspotenzial in % (intern) */
  outputGap: number;
  /** Potenzialwachstum in % p. a. */
  potentialGrowth: number;
  /** Wachstum, % zum Vorjahr */
  growth: number;
  /** Arbeitslosenquote in % */
  unemployment: number;
  /** Lira je US-Dollar */
  usdTry: number;
  /** Lira je Euro */
  eurTry: number;
  /** Risikoaufschlag (CDS 5 Jahre) in Basispunkten */
  riskPremium: number;
  /** Anker der Finanzierungsbedingungen (bp): folgt dem Risikoaufschlag langsam; die Abweichung verteuert Kredite (economy.ts Z1) */
  riskAnker?: number;
  /** Last laufender Sanktionen (sim/diplomatie.ts): Aufschlag am Markt in bp, Ausfall der Auslandsnachfrage in Indexpunkten */
  sanktionsLast?: { risiko: number; nachfrage: number };
  /** Anteil fehlender Energie (Öl und Gas, 0 bis 1) im letzten Liefermonat (sim/gueter.ts) */
  energieMangel?: number;
  /** Welle H5: Bezugswert des Energiemangels, an den sich die Preise schon angepasst haben (wie `kostenRef`); fehlt in älteren Spielständen (dann 0) */
  mangelRef?: number;
  /** Staatsschulden in % des BIP */
  debtRatio: number;
  /** Verfügbarer nominaler Kassenbestand in Mrd. Lira; getrennt von Zentralbank-Devisenreserven. */
  kassenbestandMrd?: number;
  /** Geplantes Haushaltsdefizit in % des BIP */
  deficit: number;
  /** Zusätzliche Ausgaben (+) oder Kürzungen (−) des Spielers in % des BIP */
  fiscalImpulse: number;
  /** Abgeleitet: Abwertung der Lira gegenüber dem Dollar in den letzten 12 Monaten, % */
  fxChange12: number;
  /** Aus dem Politiknetz: Kosten der Maßnahmen gegenüber dem Start in % des BIP pro Jahr */
  policyCost: number;
  /** Aus dem Politiknetz: Kostendruck der Betriebe auf die Inflation, Prozentpunkte */
  costPush: number;
  /**
   * Welle H5: Bezugswert des Kostendrucks (Indexpunkte), an den sich die Preise schon angepasst haben. Er folgt dem Kostendruck langsam
   * (sim/world.ts, KOSTEN); nur der Abstand dazu treibt die Inflation. Fehlt in älteren Spielständen: Er beginnt dann beim Startwert des
   * Netzes, sodass der bisherige Kostenschub glatt ausklingt statt zu springen.
   */
  kostenRef?: number;
  /** Aus dem Politiknetz: Verschiebung des Potenzialwachstums durch Produktivität, Prozentpunkte */
  potentialShift: number;
  /** Mehr- oder Minderzins des Staates gegenüber dem Start in % des BIP je Jahr (Zinsdienst folgt den Marktzinsen); fehlt in älteren Spielständen */
  zinsMehrlast?: number;
  /** Außenwelt (Index, Start = 100); fehlt in älteren Spielständen */
  oel?: number;
  euNachfrage?: number;
  weltzins?: number;
  // Runde „Netz atmet“ (sim/maerkte.ts, aus dem Politiknetz): Alle Felder fehlen in älteren Spielständen und in Lernfall-Replays; die Zuschläge in
  // economy.ts sind dann neutral (0 bzw. 1).
  /** Aufschlag auf den Risikoaufschlag aus politischen Schocks (Basispunkte); klingt monatlich ab (sim/maerkte.ts, marktSchock) */
  politikRisiko?: number;
  /** Aufschlag auf den Risikoaufschlag aus der Lage der Institutionen (Justiz, Rechtssicherheit, Presse, Marktvertrauen), Basispunkte */
  institutionenRisiko?: number;
  /** Sektorenindex der Realwirtschaft: mittlere Abweichung von Industrie, Export, Mittelstand, Investitionen, Bau und Tourismus vom Start (Indexpunkte) */
  sektorIndex?: number;
  /** Faktor auf die Wirkung des Ölpreises nach Importabhängigkeit (1 = Start) */
  energieFaktor?: number;
  /** Mehreinnahmen aus der Steuerbasis jenseits von Sätzen und Konjunktur (Steuermoral, Schattenwirtschaft, Verwaltung) in % des BIP je Jahr.
   * Seit Welle H1 (06.11.2026) ohne den Konjunkturteil: den tragen die Steuerelastizitäten und der Lira-Etat (sim/staatsgeld.ts). */
  konjunkturSaldo?: number;
  /** Welle H1: das Haushaltsgesetz des laufenden Jahres in Lira (Planpfad des BIP); fehlt in älteren Spielständen und ohne Spielschleife */
  etat?: import("./staatsgeld").Haushaltsetat;
  /** Welle H1: Ertrag der Steuermaßnahmen je Steuerart in % des Plan-BIP, mit `policyCost` im Monatsabschluss gebucht */
  steuerErtrag?: Record<string, number>;
  /** Welle H1: Teil des Netzknotens „Steuereinnahmen“ (Indexpunkte), der aus Steuersätzen und Konjunktur stammt und darum nicht in `konjunkturSaldo` zählt */
  steuerbasisSchatten?: number;
  /** Welle H1: Übergang älterer Spielstände; der frühere Konjunktursaldo läuft in Monatsschritten aus, damit nichts springt (% des BIP) */
  konjunkturUebergang?: { rest: number; schritt: number };
  /** Verschiebung der natürlichen Arbeitslosigkeit durch die Lage am Arbeitsmarkt des Netzes (Prozentpunkte) */
  arbeitsmarktShift?: number;
  /** Rating als Bestand mit Ausblick (sim/maerkte.ts) */
  rating?: { stufe: number; ausblick: -1 | 0 | 1; seit: number; bezug: number; zaehler: number; tendenz: number };
  /** Letzter Tag je Art politischer Marktschocks (verhindert, dass dieselbe Art den Markt täglich neu erschreckt) */
  marktSchockTag?: Record<string, number>;
  /** Stufe der Verschlechterung je Wachposten (Notstand, Justiz, Presse, Rechtssicherheit; 0 bis 3), damit Überschreitungen einmal als Marktschock gelesen werden */
  institutionenVormonat?: Record<string, number>;
  // WIR-2 (Außenwirtschaft minimal, sim/devisen.ts): die Devisen-Lage als zweite, nicht druckbare Währung.
  // Alle vier fehlen in älteren Spielständen und in Lernfall-Replays; die Zuschläge in economy.ts sind dann neutral (0).
  /** Leistungsbilanz-Saldo in % des BIP (laufendes Jahr); Start aus currentAccountPctGdp */
  leistungsbilanzPctBip?: number;
  /** TCMB-Bruttoreserven inkl. Gold, Mrd. USD (Spielgröße; Start aus grossReservesUsdBn) */
  reservenBruttoUsdMrd?: number;
  /** Netto-Reserven ohne Swaps, Mrd. USD (Spielgröße; Start aus netReservesExSwapsUsdBn; kann negativ werden) */
  reservenNettoUsdMrd?: number;
  /** Reserven-Druck 0 bis 1 mit Hysterese (devisen.ts): treibt CDS- und Abwertungszuschlag (economy.ts) */
  reservenDruck?: number;
  /** Restglättung laufender Deviseninterventionen (Anteil, 0,015 = 1,5 % Kursstütze); wird täglich verbraucht */
  fxPuffer?: number;
  // Reine Realwelt-Datenfelder des Szenarios (Stichtag 25.09.2026, RECHERCHE_REALWELT_TUERKEI_2026 Abschnitt 11.1).
  // Sie steuern keine Mechanik und fehlen in älteren Spielständen.
  /** Kerninflation, % zum Vorjahr (TÜİK 08/2026) */
  coreInflation?: number;
  /** ENAG-Gegenrechnung zur Inflation, % (08/2026) */
  enagInflation?: number;
  /** TCMB-Bruttoreserven inkl. Gold, Mrd. USD (18.09.2026) */
  grossReservesUsdBn?: number;
  /** Netto-Reserven ohne Swaps, Mrd. USD (06/2026) */
  netReservesExSwapsUsdBn?: number;
  /** Brent-Preis in USD am Stichtag (Hormuz-Krieg) */
  oilBrentUsd?: number;
  /** OVP-Schätzung der Energieimporte 2026, Mrd. USD */
  energyImportsUsdBn2026?: number;
  /** Leistungsbilanz in % des BIP (OVP-Erwartung 2026) */
  currentAccountPctGdp?: number;
  /** Netto-Mindestlohn in Lira (seit 01.01.2026) */
  minimumWageNetTry?: number;
  /** Nominales BIP in Bio. Lira (aus OVP-Defizit abgeleitet) */
  bipTryTn?: number;
  /** Fortschreibung der Geldbeträge im Spiel, getrennt nach realem BIP und Preisen. */
  geldbasis?: import("./staatsgeld").Geldbasis;
  /** Letzter abgeschlossener Makro-Monat. Spätere Einzelbeschlüsse ändern diesen Beleg nicht. */
  schuldenAbschluss?: import("./staatsgeld").SchuldenRechnung & { monat: string; datum: string };
}

/** Größen, die nicht im Szenario stehen, sondern abgeleitet werden. */
export type DerivedEconomyKey = "fxChange12" | "policyCost" | "costPush" | "potentialShift";

/** Monatsschnappschuss für Verzögerungen und Statistiken. */
export interface MonthlySnapshot {
  /** Monat im Format JJJJ-MM */
  month: string;
  inflation: number;
  growth: number;
  unemployment: number;
  outputGap: number;
  realRate: number;
  usdTry: number;
  /** Seit Version 0.6; ältere Spielstände haben diese Felder nicht */
  eurTry?: number;
  policyRate?: number;
  riskPremium?: number;
  debtRatio?: number;
}

/** Ein veröffentlichter Wert: Der Spieler sieht nur diesen. */
export interface PublishedValue {
  value: number;
  /** Bezugszeitraum, z. B. „2028-05“ */
  period: string;
  /** Veröffentlichungsdatum JJJJ-MM-TT */
  publishedOn: string;
}

export interface Published {
  inflation: PublishedValue;
  growth: PublishedValue;
  unemployment: PublishedValue;
}

export type LogKind = "entscheidung" | "ereignis" | "statistik" | "markt";

export interface LogEntry {
  /** Strukturierte Abstimmung im Parlament: Oberfläche, Zeitung und Bilanz lesen dieses Feld, nicht den (übersetzten) Text. */
  abstimmung?: { art: "gesetz" | "haushalt"; name: string; ort: string; ja: number; nein: number; angenommen: boolean; stufe?: number; abwesend?: number };
  /** Strukturiertes Votum: bleibt nach Sprachwechsel und späteren Wahlen korrekt abspielbar. */
  versorgungsvotum?: { programm: import("./versorgungspolitik").VersorgungsProgramm; stimmen: import("./versorgungsmehrheit").VersorgungsStimme[] };
  day: number;
  date: string;
  kind: LogKind;
  text: string;
  /** Kurze Begründung, die „Warum?“ beantwortet */
  why?: string;
  /** Dieser Eintrag setzt etwas in Kraft (Gesetz verkündet, Erlass, Präsidialbeschluss, Kommissionsbeschluss, Ausnahmezustand);
   *  die Umsetzungsakte zählt nur diese als Beschlüsse (befund-B B-23) */
  beschluss?: "gesetz" | "erlass" | "beschluss" | "kommission" | "notstand";
}

export interface World {
  scenarioId: string;
  seed: number;
  rngState: number;
  /** Tage seit Spielbeginn */
  day: number;
  /** Aktuelles Datum JJJJ-MM-TT */
  date: string;
  economy: EconomyState;
  governor: Governor;
  /** Tage (seit Spielbeginn), an denen der Geldpolitische Ausschuss tagt */
  ppkDays: number[];
  history: MonthlySnapshot[];
  published: Published;
  log: LogEntry[];
  net: import("./netz").NetState;
  /** Aus dem Prolog; fehlt nur in Tests ohne Prolog */
  player?: import("./prolog").PlayerProfile;
  parliament?: import("./prolog").Parliament;
  /** Spielschleife (Kapital, Gesetze, Ereignisse, Figuren, Umfragen, Ziele); fehlt nur in Tests ohne Amtsantritt */
  spiel?: import("./spiel-typen").SpielZustand;
}

/** Herkunft eines Startwerts (Entwicklungsplan, Abschnitt 5). */
export type Provenance = "belegt" | "abgeleitet" | "geschaetzt";

export interface StartValue {
  value: number;
  provenance: Provenance;
  note?: string;
}

export interface Scenario {
  id: string;
  /** Stichtag der Daten */
  dataDate: string;
  /** Datum im Spiel beim Start */
  startDate: string;
  description: string;
  economy: Record<Exclude<keyof EconomyState, DerivedEconomyKey>, StartValue>;
  governor: Governor;
  published: Published;
  /** Inflationspfad der Regierung (OVP 2027–2029, 06.09.2026), getrennt vom TCMB-Zwischenziel; nur Daten, keine Mechanik */
  ovpInflationPath?: { values: Record<string, number>; provenance: Provenance; note?: string };
}
