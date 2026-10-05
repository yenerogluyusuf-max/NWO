// Typen der Pakte und der Kriege zwischen anderen Staaten (sim/pakte.ts). Reines JSON, damit Speichern und Laden wie beim übrigen Weltzustand
// funktionieren. Alle Zahlen dieser Schicht sind Spielparameter (Kalibrierung), keine Tatsachenbehauptungen; Tatsachen stehen nur in den
// Texten und tragen ihre Quelle.

/**
 * Die Klausel eines Pakts:
 *   kollektiv    — der bewaffnete Angriff auf ein Mitglied gilt als Angriff auf alle (NATO Art. 5, Mekka-Pakt)
 *   beistand     — Hilfspflicht ohne Automatik, Art und Maß bleiben dem Mitglied überlassen (EU Art. 42 Abs. 7, Golf-Abkommen, bilaterale Klausel)
 *   konsultation — Pflicht zur Beratung, keine Pflicht zur Hilfe
 *   keine        — Forum oder Wirtschaftsblock ohne Verteidigungsbezug
 */
export type PaktKlausel = "kollektiv" | "beistand" | "konsultation" | "keine";

export interface PaktDef {
  /** Institutions-Kennung (data/welt-institutionen.ts) oder „bilateral-<Land>“ bei einer laufenden Beistandsklausel */
  id: string;
  name: string;
  kurz: string;
  klausel: PaktKlausel;
  /** Mitglieder als Akteur-Kennungen; die Türkei steht als „TUR“, wenn sie Mitglied ist */
  mitglieder: string[];
  /** Partner und Beobachter ohne Klauselbindung */
  partner: string[];
  /** Die Klausel in Klartext */
  text: string;
  quelle: string;
  bilateral?: boolean;
}

export interface PaktSicht extends PaktDef {
  tuerkeiMitglied: boolean;
  /** Gewicht der Pflicht (0 bis 1) aus der Klausel */
  pflichtGewicht: number;
  /** Laufende Kriege zwischen anderen Staaten, in denen Mitglieder kämpfen */
  kriege: { id: string; titel: string; mitglieder: string[] }[];
  /** Ob ein Krieg zwischen zwei Mitgliedern den Pakt gerade spaltet */
  gespalten: boolean;
}

export type DrittKriegAusgang = "einigung" | "erschoepfung" | "abklingen";

/** Ein Krieg zwischen anderen Staaten (ohne die Türkei). */
export interface DrittKrieg {
  id: string;
  /** Die beiden Hauptparteien */
  a: string;
  b: string;
  /** Alle Beteiligten je Seite, einschließlich der Hauptpartei */
  seiteA: string[];
  seiteB: string[];
  /** Wer zuerst angriff („a“ oder „b“); fehlt, wenn die Lage offen oder gemeinsam ist */
  angreifer?: "a" | "b";
  anlass: "ausgangslage" | "spannung";
  /** Spieltag des Beginns (bei der Ausgangslage: der Tag der ersten Beobachtung) */
  seit: number;
  /** Beginn in Worten, wenn die Ausgangslage ihn kennt („seit dem 24.02.2022“) */
  seitText?: string;
  /** Intensität 0 bis 100; folgt der Spannung des Paares */
  intensitaet: number;
  /** Intensität bei Beobachtungsbeginn: Wirkungen auf die Türkei zählen nur, was darüber hinausgeht (die Ausgangslage steckt in den Startwerten) */
  intensitaetStart: number;
  ende?: number;
  ausgang?: DrittKriegAusgang;
  beitritte: { id: string; seite: "a" | "b"; tag: number; grund: string; pakt?: string }[];
  /** Kennung des Konflikts in der Vermittlung (data/konflikte.ts), wenn es einen gibt */
  vermittlung?: string;
}

export interface KoalitionsSicht {
  id: string;
  name: string;
  seite: "eigen" | "gegner";
  rolle: "hauptgegner" | "partner" | "zoegert" | "abseits";
  grund: string;
  pflicht: boolean;
  pakt?: string;
  /** Verbleibende Kampfkraft 0 bis 1 (nur Partner) */
  rest?: number;
  einsatz?: number;
}

export interface KoalitionenSicht {
  aggressor: "tuerkei" | "gegner" | null;
  eigen: KoalitionsSicht[];
  gegner: KoalitionsSicht[];
  /** Pakt, den der Krieg zwischen zwei Mitgliedern spaltet */
  spaltung?: { id: string; name: string };
}
