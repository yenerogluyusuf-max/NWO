// Datumsrechnung in UTC, damit Zeitzonen die Simulation nicht verändern.

import { datum } from "../i18n";

const DAY_MS = 86_400_000;

export function addDays(isoDate: string, days: number): string {
  const t = Date.parse(isoDate + "T00:00:00Z") + days * DAY_MS;
  return new Date(t).toISOString().slice(0, 10);
}

export function dayOfMonth(isoDate: string): number {
  return Number(isoDate.slice(8, 10));
}

export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function monthNumber(isoDate: string): number {
  return Number(isoDate.slice(5, 7));
}

/** Vormonat im Format JJJJ-MM. */
export function previousMonth(month: string, back = 1): string {
  let y = Number(month.slice(0, 4));
  let m = Number(month.slice(5, 7)) - back;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

// Anzeige in der Sprache des Spiels (Deutsch, Türkisch, Englisch); die Namen der Funktionen bleiben, damit die vielen Aufrufer unverändert gelten.
// Ohne Fenster (Tests, Werkzeuge) ist die Sprache immer Deutsch, die Ausgabe also wie bisher: „5. Mai 2030“.
export function formatDateDe(isoDate: string): string {
  return datum(isoDate, "lang");
}

export function formatMonthDe(month: string): string {
  return datum(`${month.slice(0, 7)}-01`, "monat");
}
