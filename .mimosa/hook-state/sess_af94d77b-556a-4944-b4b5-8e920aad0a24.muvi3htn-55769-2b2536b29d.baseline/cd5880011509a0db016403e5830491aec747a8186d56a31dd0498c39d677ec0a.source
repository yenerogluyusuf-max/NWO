// Sprachen und Typen der Übersetzungsschicht (Konzept: SPRACHEN_KONZEPT_2026-10-04.md).
// Quellsprache ist Deutsch; Türkisch und Englisch sind vollwertige Spielsprachen.

export type Sprache = "de" | "tr" | "en";

export const SPRACHEN: { id: Sprache; name: string; locale: string }[] = [
  { id: "de", name: "Deutsch", locale: "de-DE" },
  { id: "tr", name: "Türkçe", locale: "tr-TR" },
  { id: "en", name: "English", locale: "en-GB" },
];

export const LOCALE: Record<Sprache, string> = { de: "de-DE", tr: "tr-TR", en: "en-GB" };

/** Fälle, die ein Platzhalter per `{name|dat}` annehmen kann (türkische Fälle; im Deutschen und Englischen nur über Formen eines Eigennamens). */
export type Fall = "nom" | "gen" | "dat" | "akk" | "loc" | "abl" | "ins";

/**
 * Ein Eigenname mit seinen Formen je Fall (wie die Felder `dat` und `akk` in sim/laender.ts).
 * Fehlt eine Form, gilt: Türkisch wird nach den Lautregeln gebildet, die anderen Sprachen nehmen die Grundform.
 */
export interface Formen {
  nom: string;
  gen?: string;
  dat?: string;
  akk?: string;
  loc?: string;
  abl?: string;
  ins?: string;
}

export type Wert = string | number | boolean | null | undefined | Date | readonly (string | number)[] | Formen;
export type Params = Record<string, Wert>;

/**
 * Eine Meldung, wie sie im Spielstand liegt: Schlüssel und Einsatzwerte statt eines fertigen Satzes.
 * So erscheint ein Protokolleintrag nach einem Sprachwechsel in der neuen Sprache.
 * Die Einsatzwerte müssen reines JSON sein (Texte, Zahlen, Wahrheitswerte, ISO-Daten).
 */
export interface Msg {
  k: string;
  p?: Record<string, string | number | boolean | readonly (string | number)[] | null>;
}

export const istMsg = (x: unknown): x is Msg => typeof x === "object" && x !== null && typeof (x as Msg).k === "string";
