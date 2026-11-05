// Chronik-Einträge werden nach Merkmalen gelesen, nie nach ihrem Text: Der Titel steht in der Sprache, in der er entstand,
// und Logik, die deutsche Wörter sucht, verhält sich auf Englisch oder Türkisch anders (dieselbe Partie lief je nach Sprache
// verschieden, gefunden am 5. November 2026). Ältere Spielstände ohne Merkmale bekommen sie einmal beim Laden.

import type { World } from "./types";
import type { ChronikEintrag } from "./spiel-typen";

/** War der Eintrag eine Entscheidung (oder ihr Ausbleiben)? Momente, Berichte, Haken und Zustandsmeldungen nicht. */
export const istEntscheidung = (c: ChronikEintrag): boolean => !c.art;

/** Entschieden und nicht bloß abgelaufen: für Rückblicke auf das, was der Präsident tat */
export const istGetroffen = (c: ChronikEintrag): boolean => !c.art && !c.ohneEntscheidung;

/** Ältere Spielstände (vor dem 5. November 2026, nur auf Deutsch erzeugt): Merkmale aus dem Text ableiten. */
export function migriereChronik(w: World): void {
  for (const c of w.spiel?.chronik ?? []) {
    if (c.art || c.vorlage || c.ohneEntscheidung) continue;
    if (/^(Wirkungsbericht|Schritt erreicht|Programm erfüllt)/.test(c.titel)) c.art = "bericht";
    else if (/^(Der Präsident wirkt|Die Lage beruhigt|Überlastung)/.test(c.titel)) c.art = "zustand";
    else if (/^(Ausgesessen|Im Hintergrund)/.test(c.ausgang)) c.art = "haken";
    if (/^(Keine Entscheidung|Ausgesessen)/.test(c.ausgang)) c.ohneEntscheidung = true;
    const termin = /^(Der Mindestlohn|Der Haushalt für|Kommunalwahlen|Zusage fällig)/.exec(c.titel)?.[1];
    if (termin) c.vorlage = { "Der Mindestlohn": "mindestlohn", "Der Haushalt für": "haushaltsjahr", Kommunalwahlen: "kommunalwahl", "Zusage fällig": "zusage" }[termin];
  }
}
