// Typen der Personen: Profil, Aufträge, Erinnerung, Ehemalige. Alles reines JSON, es gehört zum Spielstand.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

/** Wie eine Person auftritt und was sie antreibt. */
export type Stil = "nuechtern" | "eitel" | "streng" | "loyal" | "vorsichtig" | "machtbewusst";

export const STIL_NAMEN: Record<Stil, string> = {
  nuechtern: "nüchtern",
  eitel: "eitel",
  streng: "streng",
  loyal: "loyal bis zur Selbstverleugnung",
  vorsichtig: "vorsichtig",
  machtbewusst: "machtbewusst",
};

/** Wo eine Person ihren Rückhalt hat; wer sie entlässt, trifft auch dieses Lager. */
export type LagerArt = "praesident" | "partei" | "apparat" | "markt" | "diplomatie" | "justiz" | "streitkraefte" | "opposition";

export const LAGER_NAMEN: Record<LagerArt, string> = {
  praesident: "Vertraute des Präsidenten",
  partei: "Parteibasis",
  apparat: "Sicherheitsapparat",
  markt: "Wirtschaft und Märkte",
  diplomatie: "Diplomatie",
  justiz: "Richter und Juristen",
  streitkraefte: "Streitkräfte",
  opposition: "Opposition",
};

/** Ein Auftrag mit Frist: Die Person arbeitet an einer Größe des Ressorts; am Stichtag wird gemessen. */
export interface Auftrag {
  id: string;
  text: string;
  /** Größe des Politiknetzes, an der gemessen wird */
  groesse: string;
  /** +1 die Größe soll steigen, −1 sinken */
  richtung: 1 | -1;
  /** Um so viele Punkte soll sie sich bewegen */
  delta: number;
  seit: number;
  frist: number;
  vorher: number;
  status: "laeuft" | "erfuellt" | "verfehlt";
  /** Wert am Ende (nur nach Abschluss) */
  nachher?: number;
}

export interface Erinnerung {
  tag: number;
  text: string;
}

/** Was eine Figur über die Rolle hinaus ausmacht. Wird beim ersten Zugriff aus dem Spielstand abgeleitet, wenn es fehlt. */
export interface FigurEigen {
  stil: Stil;
  /** Wie gut sie ihr Ressort führt, 0 bis 100 */
  faehigkeit: number;
  /** Wie sehr sie nach mehr strebt, 0 bis 100 */
  ehrgeiz: number;
  /** Aufgestauter Ärger, 0 bis 100: führt zu Durchstechereien und zum Bruch */
  groll: number;
  lager: LagerArt;
  /** Seit diesem Tag im Amt */
  seit: number;
  /** Zusatzmittel für das Ressort bis zu diesem Tag (Anerkennung, Beförderung) */
  mittelBis?: number;
  /** Bis zu diesem Tag arbeitet sie unter Druck (Kritik): mehr Einsatz, mehr Groll */
  druckBis?: number;
  /** Letzter Tag, an dem sie mit dem Rücktritt gedroht hat */
  drohung?: number;
  /** Bis zu diesem Tag arbeitet sich die Person ein: die Ressortleistung ist geringer */
  einarbeitungBis?: number;
  /** Eine kommissarische Leitung, bis ein Nachfolger ernannt wird */
  kommissarisch?: boolean;
  erinnerung: Erinnerung[];
  auftrag?: Auftrag;
  /** Abgeschlossene Aufträge: erfüllt und verfehlt */
  bilanz?: { erfuellt: number; verfehlt: number };
}

/** Wer gegangen ist und was er mitnimmt. */
export interface Ehemalige {
  name: string;
  weiblich?: boolean;
  amt: string;
  rolle: string;
  ausgeschieden: number;
  /** Wie im Streit er ging, 0 bis 100 */
  groll: number;
  ehrgeiz: number;
  lager: LagerArt;
  grund: string;
  /** Ob er schon gegen den Präsidenten ausgesagt hat */
  ausgepackt: boolean;
}

/** Ein Kandidat für ein frei gewordenes Amt. */
export interface Kandidat {
  id: string;
  name: string;
  weiblich: boolean;
  stil: Stil;
  faehigkeit: number;
  ehrgeiz: number;
  lager: LagerArt;
  /** Wie gut sie dem Präsidenten anfangs gesinnt ist */
  loyalitaet: number;
  /** Ein Satz zur Herkunft */
  herkunft: string;
  staerke: string;
  schwaeche: string;
  /** Reaktion der Märkte in Basispunkten Risikoaufschlag (nur Finanzen und Wirtschaft) */
  markt: number;
  /** Wie das Lager der Person auf die Ernennung antwortet: Loyalität der anderen im gleichen Lager */
  lagerEcho: number;
  /** Politisches Kapital, das die Ernennung kostet */
  pk: number;
}
