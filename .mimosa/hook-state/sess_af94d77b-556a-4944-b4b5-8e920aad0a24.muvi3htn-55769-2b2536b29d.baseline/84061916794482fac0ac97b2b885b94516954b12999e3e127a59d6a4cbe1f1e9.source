// Die Konfliktpaare zwischen Drittstaaten, zwischen denen Ankara vermitteln kann (AUS-4 aus
// VERBESSERUNGSPLAN_2026-09-30): die Alleinstellung des Spiels. Die Auswahl und die Ausgangslage folgen
// RECHERCHE_REALWELT_LAENDERDOSSIERS.md, Teil IV „Konflikt-Topologie" (Vermittlungs-Priorität: A2 Ukraine–Russland,
// A3/A4 Kaukasus-Dreieck, A1 Hormus/Iran, B5 Libyen). Das Mediation-Design (ZOPA, ripeness, Spoiler, Garantien)
// steht in AUSSENPOLITIK §6 / DESIGN_BESTANDSAUFNAHME.md Kapitel 6; die Kalibrierung hängt am Istanbul-Kommuniqué
// 2022 und am Getreideabkommen (33 Mio. t, Juli 2022).
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen; Tatsachen stehen
// nur in den Texten und sind in der Recherche belegt (Feld „quelle").

/** Eine Konfliktpartei: ein Spiel-Land oder ein nur benannter Akteur (Fraktion ohne eigene Länderakte). */
export interface KonfliktPartei {
  /** Land-Kennung für die Beziehungsmechanik (Vertrauen, Konflikt-Ausstrahlung); null = kein Akteur der Länderliste */
  land: string | null;
  name: string;
  /** Dativ-Form für Fließtexte („der Regierung in Tripolis") */
  dat: string;
  /** 2–3 Kernforderungen dieser Seite */
  forderungen: string[];
  /** 1–2 rote Linien: was diese Seite nie annimmt */
  roteLinien: string[];
}

/** Ein Hebelpunkt der ZOPA: zeigt Richtung und Bandbreite des möglichen Ausgleichs, nie „die Lösung". */
export interface Hebelpunkt {
  id: string;
  label: string;
  /** Was an diesem Punkt beweglich ist */
  text: string;
  /** Richtung/Bandbreite des Ausgleichs (für die Anzeige im ZOPA-Band) */
  richtung: string;
}

export interface KonfliktDef {
  id: string;
  titel: string;
  a: KonfliktPartei;
  b: KonfliktPartei;
  /** Ausgangslage in einem Satz (mit Belegstand) */
  text: string;
  /** Recherche-Verweis */
  quelle: string;
  /** Reifegrad zu Spielbeginn (0–100): Schmerz des Patts gegen Schmerz des Kompromisses */
  reifStart: number;
  /** Intensität des Konflikts zu Spielbeginn (0–100) */
  konfliktStart: number;
  /**
   * Strukturelle Überlappung der Positionen (0–100): Wie weit die Zone möglicher Einigung bei voller Reife
   * und vollem Vertrauen überhaupt öffnen kann.
   */
  zopaBasis: number;
  /** 2–3 Hebelpunkte des Ausgleichs */
  hebel: Hebelpunkt[];
  /** Was ein Abkommen zwischen den Dritten enthält (Anzeige und Texte) */
  paket: string[];
  /** Kapital eines Vermittlungsversuchs */
  pk: number;
  /** Tage Ruhe nach einem Versuch */
  abkuehlung: number;
  /** Mindestvertrauen beider Seiten in die Türkei als Vermittler */
  minA: number;
  minB: number;
  /** Der Ölpreis koppelt die Reife (Hormus-Logik: je teurer das Öl, desto größer der Druck aller) */
  oelKopplung?: boolean;
}

export const KONFLIKTE: KonfliktDef[] = [
  {
    id: "arm_aze",
    titel: "Armenien und Aserbaidschan",
    a: {
      land: "ARM", name: "Armenien", dat: "Armenien",
      forderungen: [
        "Grenzöffnung und die Bahnverbindung Gjumri–Kars als erster sichtbarer Schritt",
        "Die TRIPP-Verbindung nach Nachitschewan läuft unter armenischem Recht und armenischer Hoheit",
      ],
      roteLinien: ["Kein Transit-Regime am Sangesur-Abschnitt, das die armenische Hoheit aushebelt"],
    },
    b: {
      land: "AZE", name: "Aserbaidschan", dat: "Aserbaidschan",
      forderungen: [
        "Verfassungsänderung in Armenien vor der Signatur: kein Territorialanspruch mehr im Grundgesetz",
        "Ungehinderter Zugang nach Nachitschewan über den TRIPP-Korridor",
      ],
      roteLinien: ["Keine Signatur des Friedensvertrags ohne vorherige Verfassungsänderung in Eriwan"],
    },
    text: "Der Friedensvertrag ist seit August 2025 parafiert, aber nicht signiert: Baku wartet auf das armenische Referendum, Eriwan auf die Grenzöffnung aus Ankara. Ankara hält die eigene Grenze als Hebel geschlossen — und wäre der größte Nutznießer des Korridors.",
    quelle: "RECHERCHE_REALWELT_LAENDERDOSSIERS.md, Teil IV A3/A4 (Friedensvertrag parafiert 08.08.2025, Referendum hängt, TRIPP-Bau ab H2/2026)",
    reifStart: 58,
    konfliktStart: 45,
    zopaBasis: 70,
    hebel: [
      { id: "tripp", label: "TRIPP-Korridor", text: "Transit nach Nachitschewan über armenisches Gebiet.", richtung: "Öffnung gegen Hoheit: Die Verbindung kommt, die Frage ist, wessen Recht auf ihr gilt — von voller armenischer Kontrolle bis zu internationalem Regime." },
      { id: "verfassung", label: "Signaturfolge", text: "Referendum in Armenien und Signatur des Friedensvertrags.", richtung: "Baku signiert nach der Verfassungsänderung, Eriwan will umgekehrt; dazwischen liegt ein Fahrplan mit Schritten und Gegenschritten." },
      { id: "grenze", label: "Grenze und Bahn", text: "Grenzöffnung für Drittstaatler, Bahn Gjumri–Kars, Ani-Brücke.", richtung: "Teilöffnung sofort gegen volle Öffnung nach Signatur — je mehr vorab läuft, desto mehr Druck fällt vom Referendum." },
    ],
    paket: ["Fahrplan: Referendum, dann Signatur des Friedensvertrags", "TRIPP-Transit unter armenischer Hoheit mit internationalem Monitoring", "Grenzöffnung für Drittstaatler und die Bahn Gjumri–Kars"],
    pk: 5,
    abkuehlung: 240,
    minA: 35,
    minB: 45,
  },
  {
    id: "ukr_rus",
    titel: "Ukraine und Russland",
    a: {
      land: "UKR", name: "Ukraine", dat: "der Ukraine",
      forderungen: [
        "Sicherheitsgarantien, bevor über territoriale Fragen gesprochen wird",
        "Vollständiger Austausch der Gefangenen und der verschleppten Kinder",
      ],
      roteLinien: ["Keine völkerrechtliche Anerkennung der Annexionen"],
    },
    b: {
      land: "RUS", name: "Russland", dat: "Russland",
      forderungen: [
        "Verhandlung über den Status der besetzten Gebiete von den jetzigen Linien aus",
        "Schritte bei den Sanktionen und ein offizieller Kanal nach Europa",
      ],
      roteLinien: ["Keine NATO-Mitgliedschaft der Ukraine"],
    },
    text: "Der Krieg ist eingefroren, nicht beendet: Die Istanbul-Runden, der Austausch in Abu Dhabi und die gescheiterte Genfer Runde liegen zurück, die Waffenruhen brachen jeweils in Tagen. Ankara hat den Getreideplan in der Schublade und führt die maritime Sicherheitskomponente — ein Erfolg hier ist der größte Prestige-Hebel des Spiels.",
    quelle: "RECHERCHE_REALWELT_LAENDERDOSSIERS.md, Teil IV A2 (Istanbul-Runden 2025, Genf 02/2026 gescheitert, Fidan-Getreideplan 08/2026)",
    reifStart: 32,
    konfliktStart: 80,
    zopaBasis: 45,
    hebel: [
      { id: "getreide", label: "Getreidekorridor", text: "Getreide und Dünger durch das Schwarze Meer; Häfen und Versicherer arbeiten wieder.", richtung: "Vom begrenzten Getreidefenster (Vorbild 2022: 33 Mio. t) bis zum dauerhaften Handelskorridor mit Inspektion — zieht nie die Territorialfrage mit." },
      { id: "gefangene", label: "Gefangenenaustausch", text: "Austauschformate nach dem Vorbild 1000-für-1000 in Istanbul.", richtung: "Kleine, wiederholbare Runden bauen Vertrauen für alles Größere — die eine Richtung, die beiden Seiten nie etwas kostet." },
      { id: "meerengen", label: "Meerengen und Sicherheit", text: "Montreux-Regeln und die maritime Sicherheitskomponente unter türkischer Führung.", richtung: "Ruhe auf See gegen Ruhe an der Front: ein Waffenstillstand auf dem Wasser ist leichter zu halten als an der Linie." },
    ],
    paket: ["Gefangenenaustausch in Istanbul", "Getreide- und Handelskorridor im Schwarzen Meer", "Meerengenregeln nach Montreux mit türkischer Beobachtung"],
    pk: 5,
    abkuehlung: 240,
    minA: 45,
    minB: 35,
  },
  {
    id: "isr_irn",
    titel: "Israel und Iran: die Hormus-Folge",
    a: {
      land: "ISR", name: "Israel", dat: "Israel",
      forderungen: [
        "Öffnung der Straße von Hormus für den Handel aller",
        "Dauerhafte Waffenruhe und ein Ende der Angriffe über Stellvertreter",
      ],
      roteLinien: ["Kein Abkommen, das Teherans Vorrücken Richtung Bombe festschreibt"],
    },
    b: {
      land: "IRN", name: "Iran", dat: "dem Iran",
      forderungen: [
        "Sanktions- und Blockade-Schritte, bevor Hormus geöffnet wird",
        "Auszahlung der im Islamabad-Memorandum freigegebenen Gelder",
      ],
      roteLinien: ["Keine Öffnung von Hormus ohne vorherige Sanktions-Schritte"],
    },
    text: "Der Krieg zwischen Israel, den USA und Iran ist seit der 60-Tage-Waffenruhe des Islamabad-Memorandums angehalten, nicht gelöst: Hormus bleibt geschlossen, der Ölpreis treibt alle Importeure — die Türkei ist der Hauptleidtragende außerhalb der Kriegsparteien. Katar und Oman vermitteln bereits; Ankara wäre Gastgeber mit eigenem wirtschaftlichem Interesse.",
    quelle: "RECHERCHE_REALWELT_LAENDERDOSSIERS.md, Teil IV A1 (Krieg seit 28.02.2026, Islamabad-Memorandum 06/2026, Hormus geschlossen)",
    reifStart: 20,
    konfliktStart: 75,
    zopaBasis: 40,
    hebel: [
      { id: "hormus", label: "Straße von Hormus", text: "Teheran koppelt die Öffnung an Blockade-Ende und Sanktionen.", richtung: "Öffnung gegen Sanktions-Schritte: von symbolischer Passage einzelner Konvois bis zur vollen Wiederöffnung gegen Zeitplan — nie umsonst." },
      { id: "gelder", label: "Freigegebene Gelder", text: "Die rund 24 Mrd. $ des Islamabad-Memorandums als wiederholbares Format.", richtung: "Geldfluss gegen Waffenruhe-Verlängerung: jede Tranche kauft Wochen der Ruhe — ein Tausch, der beidseitig wiederholbar ist." },
      { id: "kanal", label: "Vermittlungskanäle", text: "Katar und Oman vermitteln bereits; Ankara böte einen größeren Tisch.", richtung: "Vom technischen Kanal zum Istanbul-Format: je mehr Seiten an einem Tisch, desto teurer der Alleingang für Spoiler." },
    ],
    paket: ["Stufenweise Öffnung der Straße von Hormus gegen einen Sanktions-Zeitplan", "Verlängerung der Waffenruhe gegen Auszahlung weiterer Tranchen", "Istanbul-Format: alle Kanäle an einem Tisch"],
    pk: 6,
    abkuehlung: 240,
    minA: 25,
    minB: 30,
    oelKopplung: true,
  },
  {
    id: "lby_fraktionen",
    titel: "Libyen: Tripolis und der Osten",
    a: {
      land: "LBY", name: "Regierung in Tripolis", dat: "der Regierung in Tripolis",
      forderungen: [
        "Anerkennung als Regierung des ganzen Landes, nicht als Verwaltung des Westens",
        "Die Öleinnahmen laufen über die Zentralbank in Tripolis",
      ],
      roteLinien: ["Keine Teilung des Landes als Dauerzustand"],
    },
    b: {
      land: "LBY", name: "Das Lager im Osten", dat: "dem Lager im Osten",
      forderungen: [
        "Eigener Zugriff auf die Öleinnahmen und Posten in den Zentralinstitutionen",
        "Die Sicherheitskontrolle im Osten bleibt in eigenen Händen",
      ],
      roteLinien: ["Keine Entwaffnung der eigenen Verbände ohne internationale Garantien"],
    },
    text: "Libyen ist geteilt, ohne dass Krieg herrscht: das Duopol aus Tripolis und dem Osten hält den Waffenstillstand von 2020, aber kein Staat wächst zusammen. Ankara ist der einzige externe Akteur mit Draht zu beiden Lagern — Ausbilder und Drohnen im Westen, wachsende Kontakte in den Osten.",
    quelle: "RECHERCHE_REALWELT_LAENDERDOSSIERS.md, Teil IV B5 (Duopol Dbeibeh/Haftar, kein Krieg seit 2020, Ankara mit Zugang zu beiden Lagern)",
    reifStart: 40,
    konfliktStart: 55,
    zopaBasis: 55,
    hebel: [
      { id: "einnahmen", label: "Öleinnahmen-Treuhand", text: "Die Einnahmen fließen, aber beide Seiten sehen die Aufteilung.", richtung: "Vom Treuhandkonto mit doppeltem Schlüssel bis zur Aufteilungsformel mit internationaler Prüfung — Geld ist der eine Hebel, den beide brauchen." },
      { id: "memorandum", label: "Seegrenz-Memorandum", text: "Das türkisch-libysche Memorandum von 2019 als Anker der Partnerschaft.", richtung: "Ankaras Zugewinn: Ratifizierung gegen Vermittlerrolle — je fester das Memorandum, desto mehr Gewicht hat der Vermittler." },
      { id: "sicherheit", label: "Sicherheitskräfte", text: "Ausbildung und gemeinsame Strukturen statt rivalisierender Verbände.", richtung: "Von parallelen Ausbildungsprogrammen zu einem gemeinsamen Rat der Sicherheitskräfte — nie die Entwaffnung einer Seite." },
    ],
    paket: ["Öleinnahmen-Treuhand mit doppeltem Schlüssel", "Regelmäßige Treffen der Sicherheitskräfte beider Lager in Istanbul", "Fahrplan für gemeinsame Institutionen"],
    pk: 5,
    abkuehlung: 240,
    minA: 50,
    minB: 50,
  },
];

export const KONFLIKT_NACH_ID: Record<string, KonfliktDef> = Object.fromEntries(KONFLIKTE.map((k) => [k.id, k]));

// ---------------------------------------------------------------------------
// Spoiler: Wer den Ausgleich fürchtet, schlägt zu (AUSSENPOLITIK §6: Spoiler-Parteien).
// Drei Antwortmuster: öffentlich verurteilen (Beziehung zu einer Seite −), diskret dämpfen (Kapital),
// ignorieren (Reif −). Die Stärke der Vorlagen ist ein Spielparameter.

export type SpoilerArtId = "provokation" | "hardliner" | "sabotage" | "ultimatum";

export interface SpoilerArt {
  id: SpoilerArtId;
  label: string;
  /** Was geschieht (Platzhalter {seite} wird durch den Parteinamen ersetzt) */
  text: string;
  /** Reif-Verlust, wenn nichts geschieht (ignorieren / keine Entscheidung) */
  reif: number;
  /** Konflikt-Index-Anstieg, wenn nichts geschieht */
  konflikt: number;
}

export const SPOILER_ARTEN: Record<SpoilerArtId, SpoilerArt> = {
  provokation: {
    id: "provokation", label: "Provokation am Verhandlungstisch",
    text: "{seite} lässt Muskeln spielen: ein Zwischenfall an der Linie, eine Rede für die eigene Galerie — gerechnet darauf, dass der Tisch in Istanbul zusammenbricht.",
    reif: 8, konflikt: 4,
  },
  hardliner: {
    id: "hardliner", label: "Hardliner gewinnen Oberwasser",
    text: "Bei {seite} gewinnen die Hardliner eine Runde: Wer vom Ausgleich spricht, gilt dort plötzlich als Verräter, und die Verhandlungsdelegation verliert ihr Mandat.",
    reif: 10, konflikt: 3,
  },
  sabotage: {
    id: "sabotage", label: "Sabotage von außen",
    text: "Eine dritte Macht, die am Konflikt verdient, torpediert die Annäherung: Indiskretionen, Waffenlieferungen an die Spoiler, ein inszenierter Zwischenfall.",
    reif: 6, konflikt: 8,
  },
  ultimatum: {
    id: "ultimatum", label: "Einseitige Forderungsverschärfung",
    text: "{seite} verschärft öffentlich die Bedingungen: Was gestern verhandelbar war, wird zur Vorbedingung erklärt — ein Ultimatum, das die Zone des Möglichen einengt.",
    reif: 7, konflikt: 3,
  },
};

// ---------------------------------------------------------------------------
// Garantien (AUSSENPOLITIK §6, Schritt 4: Dritte bürgen und binden sich). Jede Garantie kostet laufend
// (Geld und Aufmerksamkeit) und bricht bei einem Verstoß einer Seite — mit Gesichtsverlust oder Eingreifen-Zwang.

export type GarantieArtId = "ueberwachung" | "wirtschaft" | "militaer";

export interface GarantieDef {
  id: GarantieArtId;
  label: string;
  /** Was die Türkei zusagt */
  text: string;
  /** Einmaliges Kapital beim Angebot */
  pk: number;
  /** Einmalkosten in % des BIP (Aufbau, Stationierung, Fonds) */
  bip: number;
  /** Laufendes Kapital pro Monat, solange die Garantie steht */
  monatPk: number;
  /** Bonus auf die Vermittlungsaussicht, wenn das Paket eine Garantie enthält */
  aussicht: number;
  /** Monatliche Grundchance eines Verstoßes (skaliert mit dem Konflikt-Index) */
  verstossChance: number;
  /** Kehrseite für die Anzeige */
  risiko: string;
}

export const GARANTIEN: Record<GarantieArtId, GarantieDef> = {
  ueberwachung: {
    id: "ueberwachung", label: "Überwachungsmission",
    text: "Türkische Beobachter und eine gemeinsame Meldestelle wachen über die Einhaltung: klein, anhaltend, unbewaffnet.",
    pk: 3, bip: 0.05, monatPk: 0.3, aussicht: 5, verstossChance: 0.02,
    risiko: "Jeder gemeldete Verstoß landet auf dem Schreibtisch des Garanten — klein, aber ständig.",
  },
  wirtschaft: {
    id: "wirtschaft", label: "Wirtschafts-Anker",
    text: "Ein Korridor nach dem Getreide-Modell: türkische Häfen, Versicherer und Banken tragen den Handel beider Seiten — Handelsbonus und Prestige für Ankara.",
    pk: 5, bip: 0.1, monatPk: 0.2, aussicht: 8, verstossChance: 0.03,
    risiko: "Der Anker hält nur, solange beide Seiten liefern; bricht der Korridor, verliert der Garant das Gesicht.",
  },
  militaer: {
    id: "militaer", label: "Militärische Garantie",
    text: "Ankara garantiert die Vereinbarung militärisch: Ausbilder, Beobachter und die Zusage, im Ernstfall einzugreifen.",
    pk: 8, bip: 0.15, monatPk: 0.5, aussicht: 12, verstossChance: 0.06,
    risiko: "Die größte Wirkung, das größte Risiko: Ein Verstoß zwingt zum Eingreifen — oder zum Gesichtsverlust der Garantiemacht.",
  },
};

// ---------------------------------------------------------------------------
// Vorbereitungshandlungen des Vermittlers (Reife schaffen, bevor der Tisch steht)

export type VorbereitungId = "kanaele" | "vertrauensmassnahme" | "gastgeber";

export interface VorbereitungDef {
  id: VorbereitungId;
  label: string;
  hinweis: string;
  pk: number;
  /** Aufmerksamkeit des Präsidenten */
  aufmerksamkeit: number;
  /** Tage Ruhe nach der Handlung (je Konflikt) */
  abkuehlung: number;
  /** Reif-Gewinn */
  reif: number;
  /** Konflikt-Index-Senkung */
  konflikt: number;
  /** Ansehen-Gewinn (Gastgeberrolle) */
  ansehen: number;
}

export const VORBEREITUNGEN: Record<VorbereitungId, VorbereitungDef> = {
  kanaele: {
    id: "kanaele", label: "Kanäle öffnen",
    hinweis: "Diskrete Gesprächskanäle zu beiden Seiten: Geheimdienst zu Geheimdienst, Außenamt zu Außenamt. Niemand verliert das Gesicht, alle hören zu.",
    pk: 2, aufmerksamkeit: 4, abkuehlung: 90, reif: 6, konflikt: 0, ansehen: 0,
  },
  vertrauensmassnahme: {
    id: "vertrauensmassnahme", label: "Vertrauensmaßnahmen vorschlagen",
    hinweis: "Kleine, prüfbare Schritte: ein Gefangenenaustausch, ein humanitärer Korridor, eine Feuerpause an einem Abschnitt. Wer klein liefert, kann groß liefern.",
    pk: 4, aufmerksamkeit: 6, abkuehlung: 150, reif: 9, konflikt: 4, ansehen: 0,
  },
  gastgeber: {
    id: "gastgeber", label: "Gastgeberrolle: Istanbul lädt ein",
    hinweis: "Ein formelles Gipfelangebot nach dem Vorbild von Istanbul 2022: Ankara stellt Ort, Format und Diskretion. Schon die Einladung zeigt Führung.",
    pk: 6, aufmerksamkeit: 8, abkuehlung: 240, reif: 13, konflikt: 2, ansehen: 1,
  },
};
