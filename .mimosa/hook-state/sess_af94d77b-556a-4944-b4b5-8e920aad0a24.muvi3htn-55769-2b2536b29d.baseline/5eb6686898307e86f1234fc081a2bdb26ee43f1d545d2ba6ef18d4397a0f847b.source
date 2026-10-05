// Kleine Werkzeuge, mit denen Ereignisse und Entscheidungen den Weltzustand verschieben.
// Ein Stoß auf einen Knoten wirkt sofort (auch auf Verbindungen ohne Verzögerung) und klingt
// danach über die Trägheit des Knotens wieder ab.

import { NET } from "./modell";
import { PROVINCES } from "./netz";
import type { World } from "./types";

function clampIndex(x: number): number {
  return Math.min(100, Math.max(0, x));
}

/** Verschiebt einen Knoten in den genannten Provinzen (Kfz-Kennziffern) oder im ganzen Land. */
export function wirke(world: World, id: string, delta: number, provinzen?: number[] | null): void {
  const i = NET.index.get(id);
  if (i === undefined) throw new Error(`Unbekannter Knoten: ${id}`);
  const s = world.net;
  const jetzt = s.history[s.month % s.history.length]!;
  const liste = provinzen && provinzen.length ? provinzen : null;
  for (let p = 0; p < PROVINCES; p++) {
    if (liste && !liste.includes(p + 1)) continue;
    const k = i * PROVINCES + p;
    const neu = clampIndex(s.values[k]! + delta);
    const echt = neu - s.values[k]!;
    s.values[k] = neu;
    jetzt[k] = clampIndex(jetzt[k]! + echt);
  }
}

/** Durchschnitt eines Knotens über die genannten Provinzen, nach Bevölkerung gewichtet. */
export function wertIn(world: World, id: string, provinzen: number[]): number {
  const i = NET.index.get(id);
  if (i === undefined) return NaN;
  let sum = 0;
  let w = 0;
  for (const plaka of provinzen) {
    const weight = world.net.weights[plaka - 1]!;
    sum += world.net.values[i * PROVINCES + plaka - 1]! * weight;
    w += weight;
  }
  return w > 0 ? sum / w : NaN;
}

/** Vertrauen in die Regierung, landesweit verschoben. */
export function vertrauenAendern(world: World, delta: number): void {
  wirke(world, "vertrauen_regierung", delta);
}
