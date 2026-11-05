import { aktuelleLocale } from "../i18n";
// Protokoll: Jede verbindliche Zustandsänderung wird festgehalten (Entwicklungsplan, Abschnitt 6).

import type { LogEntry, LogKind, World } from "./types";

export function addLog(world: World, kind: LogKind, text: string, why?: string): LogEntry {
  const entry: LogEntry = { day: world.day, date: world.date, kind, text };
  if (why) entry.why = why;
  world.log.push(entry);
  return entry;
}

/** Zahl mit einer Nachkommastelle im deutschen Format. */
export function fmt(x: number): string {
  return x.toLocaleString(aktuelleLocale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 });
}
