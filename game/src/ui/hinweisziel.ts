// Wohin ein Hinweis führt (PRUEFUNG_GESAMT_2026-11-04): Hinweisfenster hatten nur „Verstanden“ und keinen Weg zur Antwort.
// Das Ziel wird aus der Kennung abgeleitet, damit nicht jede Hinweisquelle umgebaut werden muss. Unbekannte Kennungen: kein Knopf.
import type { Ziel } from "./schreibtisch/briefing";

export function hinweisZiel(id: string): Ziel | undefined {
  // Konfliktvorgänge tragen das Land in ihrer Kennung („kv-GRC-123“), Zwischenfälle direkt („krieg-zwischenfall-CYP-…“)
  const vorgang = /kv-([A-Z]{3})-/.exec(id) ?? /^krieg-zwischenfall-([A-Z]{3})-/.exec(id);
  if (vorgang) return { art: "konflikt", land: vorgang[1]! };
  if (id.startsWith("krieg-") || id.startsWith("militaer-")) return { art: "akte", akte: "reich_militaer" };
  if (id.startsWith("aussen-") || id.startsWith("vermittlung-")) return { art: "akte", akte: "welt" };
  if (id.startsWith("putsch-") || id.startsWith("mit-")) return { art: "akte", akte: "personen" };
  if (id.startsWith("gesellschaft-")) return { art: "akte", akte: "waehler" };
  if (id.startsWith("amtsenthebung-") || id.startsWith("ueberlaeufer-")) return { art: "akte", akte: "parlament" };
  return undefined;
}
