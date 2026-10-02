// Gemeinsame Typen und Hilfen aller Ereignisvorlagen (Vorlagen liegen in ereignisse*.ts).

import { NET } from "./modell";
import { PROVINCES, nationalAverage } from "./netz";
import { PROVINZEN } from "./regional";
import { wirke } from "./wirkung";
import type { Rng } from "./rng";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";

export type SzenenName = "istanbul" | "parlament" | "bank" | "anatolien" | "wahlnacht";

export interface Option {
  id: string;
  label: string;
  /** Preis und Risiko in Worten */
  beschreibung: string;
  /** Politisches Kapital, das der Ereignismotor abbucht */
  pk: number;
  /** Was die Oberfläche als Preis zeigt, wenn der Preis erst später anfällt (etwa der Preis eines Gesetzes) */
  anzeigePk?: number;
  /** Führt aus und liefert den Ausgang als Satz für Protokoll und Chronik */
  wirkung: (w: World, ev: OffenesEreignis, rng: Rng) => string;
}

export interface Vorlage {
  id: string;
  szene: SzenenName;
  titel: (w: World, ev: OffenesEreignis) => string;
  text: (w: World, ev: OffenesEreignis) => string[];
  warum: (w: World, ev: OffenesEreignis) => string;
  optionen: (w: World, ev: OffenesEreignis) => Option[];
  /** Folge ohne Entscheidung */
  standard: (w: World, ev: OffenesEreignis, rng: Rng) => string;
  /** Erste Wirkung beim Eintreten */
  eroeffne?: (w: World, ev: OffenesEreignis, rng: Rng) => void;
  frist: number;
  abkuehlung: number;
  /** Maßnahmen, mit denen man die Ursache selbst regeln kann; wer eine davon einbringt, hat das Ereignis in die Hand genommen */
  massnahmen?: string[];
  /**
   * ZEI-1 (Ereignis-Wettbewerb): Was geschieht, wenn der ausgelöste Vorgang im Monatswettbewerb keinen
   * Präsentations-Slot bekommt. „aussitzen“: Er tritt im Hintergrund ein und läuft ohne Antwort schlecht aus
   * (Standardfolge; für akute Einzelfälle und verfallende Angebote). „eskalieren“ (Standard): Er gärt weiter
   * und kommt dringlicher zurück (für schwelende Konflikte).
   */
  wettbewerb?: "aussitzen" | "eskalieren";
  /** ZEI-1: Schwere der Standardfolge für die Dringlichkeit im Wettbewerb (1 = normal, höher = schlimmer). */
  schwere?: number;
  /** Wahrscheinlichkeit pro Monat, 0 = nicht möglich */
  chance: (w: World) => number;
  erzeuge: (w: World, rng: Rng) => { provinzen: number[]; staerke: number; daten?: Record<string, number | string> } | null;
}


// ---------------------------------------------------------------------------
// Hilfen

export const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
export const monatVon = (w: World) => Number(w.date.slice(5, 7));
export const sommer = (w: World) => monatVon(w) >= 6 && monatVon(w) <= 9;

export function namen(provinzen: number[]): string {
  const n = provinzen.map((p) => PROVINZEN[p - 1]?.name ?? String(p));
  if (n.length === 1) return n[0]!;
  return `${n.slice(0, -1).join(", ")} und ${n[n.length - 1]}`;
}

export function einwohner(provinzen: number[]): number {
  return provinzen.reduce((s, p) => s + (PROVINZEN[p - 1]?.bevoelkerung ?? 0), 0);
}

export function ziehe(rng: Rng, gewicht: (plaka: number) => number, n: number): number[] {
  const g = Array.from({ length: PROVINCES }, (_, p) => Math.max(0, gewicht(p + 1)));
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    const summe = g.reduce((a, b) => a + b, 0);
    if (summe <= 0) break;
    let r = rng.next() * summe;
    for (let p = 0; p < PROVINCES; p++) {
      r -= g[p]!;
      if (r <= 0) {
        out.push(p + 1);
        g[p] = 0;
        break;
      }
    }
  }
  return out;
}

export const akutIn = (w: World, id: string): number[] => {
  const i = NET.index.get(id);
  const node = i === undefined ? undefined : NET.nodes[i];
  if (i === undefined || !node?.threshold) return [];
  const out: number[] = [];
  for (let p = 0; p < PROVINCES; p++) if (w.net.values[i * PROVINCES + p]! >= node.threshold) out.push(p + 1);
  return out;
};

/** Einmalige Kosten in % des BIP: erhöhen die Schulden und stützen kurz die Nachfrage. */
export function kosten(w: World, prozentBip: number): void {
  w.economy.debtRatio += prozentBip;
  w.economy.outputGap += 0.08 * prozentBip;
}

export const dk = (ev: OffenesEreignis, k: string): number => Number(ev.daten?.[k] ?? 0);

export function opt(id: string, label: string, beschreibung: string, pk: number, wirkung: Option["wirkung"]): Option {
  return { id, label, beschreibung, pk, wirkung };
}


export const PROZ_STADT = new Set([34, 6, 35, 16, 1, 27, 42, 7, 33, 21]);

export const jahrVon = (w: World): number => Number(w.date.slice(0, 4));

/** Landesdurchschnitt eines Knotens. */
export const netz = (w: World, id: string): number => nationalAverage(NET, w.net, id);

/** Preisangabe einer Antwort in Worten: „Kostet 3 Kapital und 0,2 % des BIP; …“ */
export function beschr(pk: number, bipProzent: number, folge: string): string {
  const teile: string[] = [];
  if (pk > 0) teile.push(`${pk} Kapital`);
  if (bipProzent > 0) teile.push(`${nf(bipProzent, bipProzent < 0.1 ? 2 : 1)} % des BIP`);
  const preis = teile.length ? `Kostet ${teile.join(" und ")}` : bipProzent < 0 ? `Bringt ${nf(-bipProzent, 2)} % des BIP` : "Kostet nichts";
  return `${preis}; ${folge}`;
}

/** Eine Zusage, die später fällig wird und dann als Ereignis eingefordert wird. */
export function zusageAnlegen(w: World, z: { von: string; text: string; tage: number; massnahme?: string }): void {
  w.spiel?.zusagen.push({
    id: `z-${z.von}-${w.day}-${w.spiel.zusagen.length}`,
    von: z.von,
    text: z.text,
    faellig: w.day + z.tage,
    ...(z.massnahme ? { massnahme: z.massnahme, richtung: 1 } : {}),
    erfuellt: false,
    gebrochen: false,
  });
}
