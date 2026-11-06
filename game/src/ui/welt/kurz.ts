// Welle B3 (ENTSCHEIDUNGEN Z, „Zahlen statt Sätze“): Karten zeigen nur den ersten Satz einer Beschreibung; der Rest bleibt als
// Tooltip erreichbar. Ein Satzende ist ein Punkt, Ausrufe- oder Fragezeichen nach einem Buchstaben, gefolgt von einem Großbuchstaben
// (so trennt „am 2. November“ nicht), und der erste Satz hat mindestens fünf Wörter (so trennt „z. B.“ nicht).

const ENDE = /([^\d\s][.!?])\s+(?=[A-ZÄÖÜÇŞİĞ„"«])/g;

/** Erster Satz und Rest einer Beschreibung. */
export function ersterSatz(text: string): { satz: string; rest: string } {
  for (const m of text.matchAll(ENDE)) {
    const ende = (m.index ?? 0) + m[1]!.length;
    const satz = text.slice(0, ende).trim();
    if (satz.split(/\s+/).length >= 5) return { satz, rest: text.slice(ende).trim() };
  }
  return { satz: text.trim(), rest: "" };
}
