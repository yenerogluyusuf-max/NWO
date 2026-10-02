// Zustand der Spielschleife: Kapital, Gesetze, Ereignisse, Figuren, Umfragen, Ziele, Ende.
// Alles reines JSON, damit Speichern und Laden wie beim übrigen Weltzustand funktionieren.
// Alle Zahlen dieser Schicht sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

export type Weg = "gesetz" | "erlass";

/** Ein Vorhaben auf dem Weg durch das Parlament. */
export interface Gesetz {
  id: string;
  massnahme: string;
  name: string;
  stufe: number;
  /** Kfz-Kennziffern; null = ganzes Land */
  provinzen: number[] | null;
  eingebracht: number;
  abstimmung: number;
  /** Beim Einbringen gezahltes Politisches Kapital */
  pk: number;
  /** Gekaufte Stimmen (Absprachen mit Fraktionen) */
  absprachen: number;
  /** +1 erhöht, −1 senkt die Maßnahme; Fraktionen stimmen für das, was sie wollen */
  richtung?: number;
}

export interface Figur {
  id: string;
  name: string;
  rolle: string;
  amt: "finanzen" | "inneres" | "aussen" | "zentralbank" | "opposition" | "partner" | "stab" | "justiz" | "generalstab" | "wirtschaft";
  /** Was die Figur will; bestimmt, wie sie auf Entscheidungen reagiert */
  ziel: string;
  /** 0 bis 100 */
  loyalitaet: number;
  imAmt: boolean;
  partei?: string;
  /** Geschlecht der Figur für Name und Porträt */
  weiblich?: boolean;
  /** Letzter Tag eines Gesprächs mit dem Präsidenten (Abkühlzeit) */
  gespraech?: number;
  /** Profil, Aufträge und Erinnerung; ältere Spielstände legen es beim ersten Zugriff an (sim/personen.ts) */
  eigen?: import("./personen-typen").FigurEigen;
}

export interface Zusage {
  id: string;
  von: string;
  text: string;
  faellig: number;
  /** Fordert eine Maßnahme in eine Richtung */
  massnahme?: string;
  richtung?: number;
  erfuellt: boolean;
  gebrochen: boolean;
  /** Wie oft die Zusage schon vertröstet wurde; nach zweimal ist Schluss */
  vertroestet?: number;
  /** Stufe der geforderten Maßnahme, als die Zusage gegeben wurde (für den Fortschritt) */
  stufeStart?: number;
  /** Zielstufe der Maßnahme, festgehalten, damit der Fortschritt eine feste Messlatte hat */
  stufeZiel?: number;
  /** Tag, an dem sie erfüllt oder gebrochen wurde */
  abgeschlossen?: number;
}

/** Ein Ereignis, das auf eine Entscheidung wartet. */
export interface OffenesEreignis {
  id: string;
  vorlage: string;
  tag: number;
  /** An diesem Tag greift die Standardfolge, wenn nichts entschieden wurde */
  frist: number;
  provinzen: number[];
  /** 0 bis 1 */
  staerke: number;
  daten?: Record<string, number | string>;
}

export interface ChronikEintrag {
  tag: number;
  datum: string;
  titel: string;
  ausgang: string;
}

export interface Umfrage {
  /** Zustimmung zum Präsidenten, 0 bis 100 */
  zustimmung: number;
  verlauf: { monat: string; wert: number }[];
}

export interface Ende {
  tag: number;
  datum: string;
  art: "wiederwahl" | "abwahl" | "sturz" | "amtszeitende";
  titel: string;
  text: string;
  anteil?: number;
}

/** Eine aktive Krise (Krisen-Blocker, MIL-3): Der Zustand selbst wird aus der Welt abgeleitet, gespeichert ist nur, was gerade aktiv ist und seit wann (Hysterese). Die Regeln stehen in sim/krisen.ts. */
export interface AktiveKrise {
  id: string;
  /** Tag (seit Spielbeginn), an dem die Krise aktiv wurde */
  seit: number;
}

/** Meldung an die Oberfläche (Wahlabend, Warnung, Ende); die Oberfläche quittiert sie. */
export interface Hinweis {
  id: string;
  titel: string;
  text: string[];
  szene: "istanbul" | "parlament" | "bank" | "anatolien" | "wahlnacht";
}

/** Phase eines laufenden Verfassungsvorgangs (sim/verfassung.ts). */
export type VerfassungsPhase = "parlament" | "aym" | "kampagne";

/** Ein Verfassungspaket auf seinem Weg: Parlament, Verfassungsgericht, gegebenenfalls Volksabstimmung. */
export interface VerfassungsVorgang {
  id: string;
  /** Artikel-Kennung → Varianten-Kennung (sim/verfassung.ts, ARTIKEL) */
  paket: Record<string, string>;
  phase: VerfassungsPhase;
  eingebracht: number;
  /** Tag der Parlamentsabstimmung */
  abstimmung: number;
  /** Gekaufte Stimmen (Absprachen, teurer als bei Gesetzen) */
  absprachen: number;
  /** Beim Einbringen gezahltes Politisches Kapital */
  pk: number;
  /** Ergebnis der Parlamentsabstimmung (Ja-Stimmen), nach der Abstimmung */
  ja?: number;
  /** Ob die Opposition das Paket vor das Verfassungsgericht gezogen hat */
  aymAngefochten?: boolean;
  /** Tag der Entscheidung des Verfassungsgerichts */
  aymTag?: number;
  /** Tag der Volksabstimmung (nur bei 301 bis 359 Ja-Stimmen) */
  referendumTag?: number;
  /** In die Kampagne investiertes Kapital */
  kampagnenPk?: number;
  /** Letzter Tag eines Kampagnen-Impulses (Abkühlzeit) */
  kampagneZuletzt?: number;
  /** Für welche Phase das Entscheidungs-Ereignis schon geöffnet wurde */
  phaseGeoeffnet?: string;
}

/** Stand der Verfassungsfrage in dieser Partie; ältere Spielstände legen ihn beim ersten Zugriff an. */
export interface VerfassungsZustand {
  laufend?: VerfassungsVorgang;
  /** Nummer der Amtszeit, in der bereits ein Vorgang lief (harte Regel: einer je Amtszeit) */
  amtszeitBelegt: number;
  /** Artikel-Kennung → Tag, ab dem der Artikel wieder eingebracht werden kann (12 Monate nach einem Scheitern) */
  sperren: Record<string, number>;
  /** Beschlossene Verfassungsänderungen: Artikel-Kennung → Varianten-Kennung (nur Abweichungen vom bisherigen Recht) */
  aktiv: Record<string, string>;
  /** Abgeschlossene Vorgänge für Chronik und Anzeige */
  historie: { tag: number; datum: string; ausgang: string; artikel: string[] }[];
}

/** Verhältnis zu einer Fraktion des Parlaments. */
export interface Fraktion {
  /** Wie offen sie für den Präsidenten ist, 0 bis 100 */
  bereitschaft: number;
  /** Bis zu diesem Tag stimmt sie bei Gesetzen mit, ohne im Lager zu sein */
  duldungBis?: number;
  /** Letzter Tag eines Gesprächs bzw. Zugeständnisses (Abkühlzeit) */
  gespraech?: number;
  zugestaendnis?: number;
  /** Woran die Fraktion ihre Unterstützung gerade knüpft; wechselt mit der Zeit und der Lage */
  forderung?: { massnahme: string; text: string; seit: number };
}

export interface SpielZustand {
  /** Politisches Kapital: knapp, wächst mit Vertrauen und Mehrheit */
  kapital: number;
  gesetze: Gesetz[];
  ereignisse: OffenesEreignis[];
  /** Letzter Tag je Ereignisvorlage (Abkühlzeit gegen Wiederholung) */
  zuletzt: Record<string, number>;
  /** ZEI-1: Eskalationsstufe gärender Vorgänge je Ereignisvorlage — nicht präsentiert, sie kommen dringlicher zurück; ältere Spielstände legen es beim ersten Bedarf an */
  eskalation?: Record<string, number>;
  figuren: Figur[];
  zusagen: Zusage[];
  umfrage: Umfrage;
  /** Kennungen der gewählten Ziele */
  ziele: string[];
  /** Ob der erste Spieltag (Zielwahl und drei Vorgänge) abgeschlossen ist */
  ersterTagErledigt: boolean;
  /** Tag der nächsten Präsidentschaftswahl */
  wahltag: number;
  /** 1 oder 2: Wiederwahl ist einmal möglich */
  amtszeit: number;
  /** Partner im Regierungslager außer der eigenen Partei (Parteikürzel) */
  lager: string[];
  /** Verhältnis zu den Fraktionen (Parteikürzel); ältere Spielstände haben es noch nicht */
  fraktionen?: Record<string, Fraktion>;
  /** Tage der letzten Gespräche mit Personen des Umfelds (begrenzte Termine) */
  termine?: number[];
  /** Wer im Streit aus dem Umfeld gegangen ist (und was er mitnimmt) */
  ehemalige?: import("./personen-typen").Ehemalige[];
  /** Das Verhältnis zu den übrigen Ländern */
  welt?: Record<string, import("./laender").LandZustand>;
  /** Beschlüsse, deren Wirkung beobachtet wird, und die daraus entstandenen Berichte */
  beobachtungen?: import("./berichte").Beobachtung[];
  berichte?: import("./berichte").Bericht[];
  /** Regierungsprogramme: fertige und laufende Schritte */
  programm?: import("./programme").ProgrammZustand;
  /** Verlauf der Wählerstimmung je Gruppe, Monat für Monat; ältere Spielstände füllen ihn beim ersten Aufruf aus dem Netzgedächtnis */
  waehler?: import("./waehler-verlauf").WaehlerVerlauf;
  /** Das Reich: Bestand, Vorhaben und Vorteile der Fachbereiche; ältere Spielstände legen es beim ersten Zugriff an */
  reich?: import("./reich-typen").ReichZustand;
  /** Letzter Tag je Vermittlung zwischen zwei Ländern (Verhandlungstisch) */
  vermittelt?: Record<string, number>;
  /** Die Wirtschaftsakte: Zentralbank, Haushalt, Kennzahlen-Verlauf; ältere Spielstände legen sie beim ersten Zugriff an */
  wirtschaft?: import("./wirtschaft-typen").WirtschaftZustand;
  /** Dauerhafte Vorteile aus Programmen: „rabatt:<Thema>“ (Anteil), „schutz:<Ereignis>“ (Faktor) */
  modifikatoren?: Record<string, number>;
  /** Schwierigkeit dieser Partie; ältere Spielstände spielen auf „normal“ */
  schwierigkeit?: "entspannt" | "normal" | "hart";
  /** Aufmerksamkeit und Belastung des Präsidenten; ältere Spielstände laden mit den Startwerten (sim/aufmerksamkeit.ts) */
  verfassung?: import("./aufmerksamkeit").Verfassung;
  /** Die Verfassungsfrage (REC-1): Paket, Hürden, Gericht, Volksabstimmung; ältere Spielstände legen ihn beim ersten Zugriff an (sim/verfassung.ts) */
  verfassungsvorgang?: VerfassungsZustand;
  /** Zufallssalz dieser Partie (für Wechsel der Forderungen); ältere Spielstände legen es beim ersten Bedarf an */
  salz?: number;
  /** Monate in Folge mit sehr niedriger Zustimmung (Sturzgefahr) */
  tiefstand: number;
  chronik: ChronikEintrag[];
  hinweise: Hinweis[];
  /** Aktive Krisen-Blocker (MIL-3); ältere Spielstände haben das Feld noch nicht, es wird beim ersten Tick gefüllt */
  krisen?: AktiveKrise[];
  /** Konfliktvorgänge (MIL-1 „Krieg als Vorgang“); ältere Spielstände haben das Feld nicht — kein Krieg-Feld = kein Konflikt, es wird beim ersten Zugriff angelegt */
  kriege?: import("./krieg-typen").KriegVorgang[];
  /** Die Zeitung (UI-1): Archiv, Warteschlange und Badge-Zähler; ältere Spielstände legen es beim ersten Monatsschritt an (sim/zeitung.ts) */
  zeitung?: import("./zeitung").ZeitungZustand;
  /** Verschiebung, die die Zustimmung beim Start auf den Wahlanteil setzt */
  kalibrierung: number;
  /** Ausgangswerte für die Bilanz */
  start: { inflation: number; arbeitslosigkeit: number; wachstum: number; schulden: number; vertrauen: number; akut: number; datum: string };
  ende?: Ende;
}
