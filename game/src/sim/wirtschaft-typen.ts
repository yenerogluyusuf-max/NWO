// Zustand der Wirtschaftsakte: Zentralbank (Zinssitzungen, Druck, Unabhängigkeit), Haushalt (Posten, Zinsdienst) und der Verlauf
// weiterer Kennzahlen mit Ereignismarken. Alles reines JSON. Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung);
// Tatsachen stehen mit Quelle in `data/haushaltsplan.ts`.

/** Stufe der Unabhängigkeit der Zentralbank (WIRTSCHAFTSMODELL.md, Abschnitt 5). */
export type Unabhaengigkeit = "A" | "B" | "C";

/** Druck des Präsidenten auf die nächste Zinssitzung. */
export interface ZbDruck {
  /** −1: Senkung verlangen, +1: eine Straffung stützen */
  richtung: -1 | 1;
  weg: "gespraech" | "rede";
  /** Wie stark der Druck gemeint ist (Gespräch schwächer als öffentliche Rede) */
  staerke: number;
  tag: number;
}

/** Eine Zinssitzung des Geldpolitischen Ausschusses. */
export interface Sitzung {
  tag: number;
  datum: string;
  alt: number;
  neu: number;
  /** Was die Regel der Bank ohne jeden Einfluss ergeben hätte */
  regel: number;
  /** Um wie viel Prozentpunkte der Zins wegen Druck oder Weisung von der Regel abweicht */
  abweichung: number;
  druck?: ZbDruck;
  stufe: Unabhaengigkeit;
  begruendung: string;
  /** „Was danach kommt“, in Sätzen */
  folgen: string[];
}

export interface ZentralbankZustand {
  stufe: Unabhaengigkeit;
  /** Druck für die nächste Sitzung; wird dort verbraucht */
  druck: ZbDruck | null;
  /** Stufe C: der Zins, den der Präsident für die nächste Sitzung festlegt */
  vorgabe?: number | null;
  /** Letzter Tag eines vertraulichen Gesprächs mit der Gouverneurin */
  gespraech?: number;
  /** Tage öffentlicher Angriffe der letzten zwölf Monate: Wiederholung verstärkt die Wirkung */
  kritikTage: number[];
  /** Letzter Tag einer Änderung der Unabhängigkeit (Abkühlzeit) */
  stufeGeaendert?: number;
  /** Letzter Tag einer Neubesetzung der Führung (Abkühlzeit) */
  gouverneurGeaendert?: number;
  sitzungen: Sitzung[];
}

export interface HaushaltAenderung {
  tag: number;
  datum: string;
  posten: string;
  text: string;
  /** Folgen in Sätzen */
  folgen: string[];
}

export interface HaushaltZustand {
  /** Reglerstufe je Posten, −2 bis +2 (0 = Grundlinie des Haushaltsgesetzes) */
  stufen: Record<string, number>;
  /** Durchschnittszins auf die Staatsschuld in %, folgt dem Marktzins nur langsam (die Schuld wird erst bei Fälligkeit neu finanziert) */
  zinssatz: number;
  /** Marktzins (Leitzins plus Risikoaufschlag) beim Start */
  marktStart: number;
  aenderungen: HaushaltAenderung[];
  /** Letzter Tag einer Änderung */
  letzteAenderung?: number;
}

/** Eine Marke auf der Zeitachse der Diagramme. */
export interface Marke {
  tag: number;
  monat: string;
  art: "zins" | "haushalt" | "eingriff" | "ereignis";
  text: string;
}

export interface WirtschaftZustand {
  zb: ZentralbankZustand;
  haushalt: HaushaltZustand;
  /** Achse der aufgezeichneten Reihen, „JJJJ-MM“ */
  monate: string[];
  /** Monatswerte weiterer Kennzahlen (parallel zu `monate`); die Größen des Wirtschaftsmodells stehen in `world.history` */
  reihen: Record<string, number[]>;
  marken: Marke[];
}
