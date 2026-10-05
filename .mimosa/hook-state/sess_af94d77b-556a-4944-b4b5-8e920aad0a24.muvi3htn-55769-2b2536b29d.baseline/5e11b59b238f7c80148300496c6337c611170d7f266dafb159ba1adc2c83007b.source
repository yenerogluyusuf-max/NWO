// Gemeinsame Hilfen des Ministerflusses: der gespeicherte Zustand, die Zuordnung von Maßnahmen zu Ressorts und Ministern
// und ein deterministischer Würfel, der den Zufallsstrom des Spiels nicht anzapft.

import { NET } from "./modell";
import { AEMTER, eigenVon, hashZahl } from "./personen";
import { figur } from "./figuren";
import { neuerMinisterFluss, type Amt, type MinisterFlussZustand, type VorlageMinister } from "./ministerfluss-typen";
import type { Figur } from "./spiel-typen";
import type { World } from "./types";

/** Die Regierungsämter in der Reihenfolge des Kabinetts. */
export const KABINETT_AMT: Amt[] = ["stab", "finanzen", "inneres", "aussen", "justiz", "generalstab", "wirtschaft"];

/** Der Zustand des Ministerflusses; ältere Spielstände legen ihn beim ersten Zugriff an (Migration). */
export function flussZustand(w: World): MinisterFlussZustand {
  const sp = w.spiel;
  if (!sp) return neuerMinisterFluss();
  const z = (sp.ministerfluss ??= neuerMinisterFluss());
  // Felder, die ältere Fassungen noch nicht kannten, ergänzen
  z.erledigt ??= {};
  z.vertagt ??= {};
  z.abgelehnt ??= {};
  z.befehle ??= [];
  z.rueckmeldungen ??= [];
  z.gelesen ??= [];
  z.verfallen ??= [];
  z.gesehen ??= {};
  return z;
}

/** Welches Thema des Politiknetzes in welches Ressort gehört, wenn kein Amt die Maßnahme ausdrücklich führt. */
const THEMA_AMT: Record<string, Amt> = {
  wirtschaft: "wirtschaft",
  haushalt: "finanzen",
  arbeit: "wirtschaft",
  gesundheit: "stab",
  bildung: "stab",
  infrastruktur: "wirtschaft",
  energie: "wirtschaft",
  landwirtschaft: "wirtschaft",
  wohnen: "wirtschaft",
  sicherheit: "inneres",
  recht: "justiz",
  militaer: "generalstab",
  kultur: "stab",
  gesellschaft: "stab",
  aussen: "aussen",
  gruppen: "stab",
};

/** Welcher Minister eine Maßnahme vorlegt: zuerst das Amt, das sie ausdrücklich führt, sonst das Ressort ihres Themas. */
export function ressortFuerMassnahme(id: string): Amt {
  for (const amt of KABINETT_AMT) if (AEMTER[amt].massnahmen.includes(id)) return amt;
  const node = NET.nodes[NET.index.get(id) ?? -1];
  return (node?.theme && THEMA_AMT[node.theme]) || "stab";
}

/** Ob das Amt mit jemandem besetzt ist, der etwas vorlegen kann. */
export function amtBesetzt(w: World, amt: Amt): Figur | undefined {
  const f = figur(w, amt);
  return f && f.imAmt ? f : undefined;
}

/** Wer das Ressort vorlegt: der Amtsinhaber, ersatzweise das Präsidialamt. */
export function ministerFuer(w: World, amt: Amt): Figur | undefined {
  return amtBesetzt(w, amt) ?? amtBesetzt(w, "stab");
}

export function ministerInfo(w: World, f: Figur): VorlageMinister {
  const e = eigenVon(w, f);
  return { id: f.id, name: f.name, rolle: f.rolle, weiblich: f.weiblich ?? false, loyalitaet: Math.round(f.loyalitaet), faehigkeit: Math.round(e.faehigkeit), stil: e.stil };
}

/** Ein deterministischer Wurf zwischen 0 und 1 aus Seed, Tag und Salz. */
export function wurf(w: World, salz: string): number {
  return hashZahl(`${w.seed}|${w.day}|${salz}`);
}

/** Ein deterministischer Wert zwischen 0 und 1, der nicht vom Tag abhängt (stabil, solange die Frage dieselbe bleibt). */
export function stabilerWert(w: World, salz: string): number {
  return hashZahl(`${w.seed}|${salz}`);
}

/** Schließt eine Zeichenkette für Kennungen ab: nur Buchstaben, Ziffern und Trennzeichen. */
export const kennung = (s: string): string => s.replace(/[^a-zA-Z0-9_:.-]/g, "");

export const klemme = (x: number, a = 0, b = 100): number => Math.min(b, Math.max(a, x));

/** Räumt eine Liste von Schlüsseln auf die jüngsten `max` Einträge. */
export function kappeRecord<T extends { tag?: number }>(r: Record<string, T>, max: number, wert: (v: T) => number): void {
  const keys = Object.keys(r);
  if (keys.length <= max) return;
  keys.sort((a, b) => wert(r[a]!) - wert(r[b]!));
  for (const k of keys.slice(0, keys.length - max)) delete r[k];
}
