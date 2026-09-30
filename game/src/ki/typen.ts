// Sprachmodell im Gespräch: gemeinsame Typen.
// Das Modell ersetzt nicht den Kern des Spiels. Es liest die Lage, erklärt sie und schlägt Aktionen aus einem festen Katalog vor;
// ausgeführt wird nur, was der Kern prüft und der Spieler bestätigt (Entwicklungsplan, Abschnitt 7).

/** "auto": erst ein Schlüssel auf dem Entwicklungsserver, dann ein eigener; "aus": regelbasiert; sonst die Kennung eines Anbieters (anbieterliste.ts) */
export type AnbieterArt = string;

export interface KiKonfig {
  art: AnbieterArt;
  /** Eigener Schlüssel je Anbieter für den Aufruf aus dem Browser; wird nur lokal gespeichert */
  schluessel: Record<string, string>;
  /** Gewähltes Modell je Anbieter */
  modell: Record<string, string>;
  /** Adresse (bis vor /chat/completions) für „anderen OpenAI-kompatiblen Dienst“ */
  eigenUrl: string;
  /** Adresse eines lokalen, OpenAI-kompatiblen Servers (llama.cpp, Ollama, LM Studio) */
  lokalUrl: string;
  /** Obergrenze der Aufrufe je Sitzung, damit keine Kosten aus dem Ruder laufen */
  maxAufrufe: number;
}

export interface KiNachricht {
  rolle: "user" | "assistant";
  text: string;
}

export interface KiAntwortRoh {
  text: string;
  tokensEin: number;
  tokensAus: number;
  modell: string;
}

/** Ein Vorschlag des Modells, aus dem festen Katalog. Alle Felder stammen aus einer Modellantwort und werden vor der Ausführung geprüft. */
export type KiAktion =
  | { art: "massnahme"; id: string; stufe?: number; richtung?: 1 | -1; orte?: string[] | null; weg?: "gesetz" | "erlass"; grund?: string }
  | { art: "land"; land: string; handlung: string; grund?: string }
  | { art: "fraktion"; partei: string; handlung: string; grund?: string }
  | { art: "figur"; amt: string; handlung: string; grund?: string }
  | { art: "programm"; grund?: string }
  | { art: "haushalt"; handlung: string; posten?: string; stufe?: number; grund?: string }
  | { art: "ereignis"; id: string; option: string; grund?: string }
  | { art: "zeit"; tage: number; grund?: string }
  | { art: "vorhaben"; id: string; grund?: string }
  | { art: "abkommen"; land: string; bieten: string[]; verlangen: string[]; jahre?: number; grund?: string }
  | { art: "vermittlung"; id: string; grund?: string };

export interface KiErgebnis {
  antwort: string;
  aktionen: KiAktion[];
  /** Ob die Antwort als gültiges JSON gelesen werden konnte */
  gelesen: boolean;
}

export interface KiVorschau {
  aktion: KiAktion;
  /** Kurzer Satz für den Knopf, zum Beispiel „Mindestlohn auf Stufe 60 als Gesetz“ */
  titel: string;
  /** Kosten in Politischem Kapital, falls bekannt */
  kosten?: number;
  /** Warum die Aktion so nicht geht; sonst leer */
  problem?: string;
  /** Hinweis, etwa zu Mehrheit oder Dauer */
  hinweis?: string;
}

export const STANDARD_KONFIG: KiKonfig = {
  art: "auto",
  schluessel: {},
  modell: {},
  eigenUrl: "",
  lokalUrl: "http://127.0.0.1:18127/v1",
  maxAufrufe: 150,
};
