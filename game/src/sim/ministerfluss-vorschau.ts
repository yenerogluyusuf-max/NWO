// Der erwartete Nutzen eines Eingriffs in Zahlen: Das Politiknetz wird auf einer Kopie einige Monate ohne und mit dem Eingriff
// fortgeschrieben (bei sonst unveränderter Wirtschaftslage), und die betroffenen Größen werden verglichen. Nichts davon geschieht wirklich.
// Die Rechnung nutzt dieselben Schritte wie das Spiel (Umsetzungsrampe und Netzschritt), keine eigene Wirkungslogik.

import { NET } from "./modell";
import { PROVINCES, nationalAverage, stepNet } from "./netz";
import { REGIONAL } from "./regional";
import { starteUmsetzung, umsetzungMonat } from "./umsetzung";
import { ueberlast } from "./handeln";
import { clamp } from "./economy";
import { HOCH_SCHLECHT } from "./personen";
import type { NetState } from "./netz";
import type { World } from "./types";
import type { NutzenZeile } from "./ministerfluss-typen";

export interface Eingriff {
  id: string;
  ziel: number;
  ort: number[] | null;
}

const CACHE = new Map<string, NutzenZeile[]>();

/** Wendet einen Eingriff auf eine Kopie des Netzes an, so wie `wendeAn` in handeln.ts es auf das echte Netz tut (ohne Protokoll, Zusagen und Figuren). */
function setzeZiel(net: NetState, world: World, e: Eingriff): void {
  const i = NET.index.get(e.id);
  const node = i === undefined ? undefined : NET.nodes[i];
  if (i === undefined || !node || node.kind !== "massnahme") return;
  const target = clamp(Math.round(e.ziel), 0, 100);
  const monate = Math.max(1, (node.months ?? 1) * ueberlast(world));
  const vorher = e.ort ? mittel(net, i, e.ort) : nationalAverage(NET, net, e.id);
  if (!e.ort) {
    net.targets[e.id] = target;
    net.steps[e.id] = Math.max(Math.abs(target - vorher) / monate, 0.01);
    if (net.ziele) delete net.ziele[e.id];
    if (net.schritte) delete net.schritte[e.id];
  } else {
    net.ziele ??= {};
    net.schritte ??= {};
    const arr = (net.ziele[e.id] ??= new Array(PROVINCES).fill(-1));
    const st = (net.schritte[e.id] ??= new Array(PROVINCES).fill(100));
    if (net.targets[e.id] !== undefined) {
      for (let p = 0; p < PROVINCES; p++) {
        if (!e.ort.includes(p + 1) && arr[p]! < 0) {
          arr[p] = net.targets[e.id]!;
          st[p] = net.steps[e.id] ?? 100;
        }
      }
      delete net.targets[e.id];
      delete net.steps[e.id];
    }
    for (const p of e.ort) {
      arr[p - 1] = target;
      st[p - 1] = Math.max(Math.abs(target - net.values[i * PROVINCES + p - 1]!) / monate, 0.01);
    }
  }
  starteUmsetzung(NET, net, e.id, target - vorher, monate);
}

function mittel(net: NetState, i: number, ort: number[]): number {
  let s = 0;
  let w = 0;
  for (const p of ort) {
    s += net.values[i * PROVINCES + p - 1]! * net.weights[p - 1]!;
    w += net.weights[p - 1]!;
  }
  return w ? s / w : 0;
}

function lies(net: NetState, id: string): { wert: number; einheit: NutzenZeile["einheit"] } {
  const i = NET.index.get(id)!;
  const node = NET.nodes[i]!;
  if (node.kind === "problem" && node.threshold) {
    let n = 0;
    for (let p = 0; p < PROVINCES; p++) if (net.values[i * PROVINCES + p]! >= node.threshold) n++;
    return { wert: n, einheit: "Provinzen" };
  }
  return { wert: nationalAverage(NET, net, id), einheit: "von 100" };
}

function rechne(world: World, eingriffe: Eingriff[], monate: number): NetState {
  const net = structuredClone(world.net);
  const wirtschaft = { ...world.economy };
  for (const e of eingriffe) setzeZiel(net, world, e);
  for (let m = 0; m < monate; m++) {
    umsetzungMonat(net);
    stepNet(NET, net, wirtschaft, REGIONAL);
  }
  return net;
}

/** Die Größen, an denen ein Eingriff in eine Maßnahme zuerst sichtbar wird: ihre stärksten Verbindungen zu Größen und Problemen. */
export function zielGroessenVon(massnahmeId: string, n = 3): string[] {
  const out: { id: string; w: number }[] = [];
  for (const e of NET.edges) {
    if (e.from !== massnahmeId) continue;
    const ziel = NET.nodes[NET.index.get(e.to)!];
    if (!ziel || (ziel.kind !== "groesse" && ziel.kind !== "problem") || ziel.input) continue;
    out.push({ id: ziel.id, w: Math.abs(e.weight) });
  }
  return out.sort((a, b) => b.w - a.w).slice(0, n).map((x) => x.id);
}

/**
 * Stand heute, Stand ohne Eingriff und Stand mit Eingriff nach `monate` Monaten für die genannten Größen.
 * Das Ergebnis wird je Tag, Eingriff und Größen zwischengespeichert.
 */
export function nutzenVorschau(world: World, eingriffe: Eingriff[], groessen: string[], monate = 12): NutzenZeile[] {
  const ids = [...new Set(groessen)].filter((id) => NET.index.has(id));
  if (!eingriffe.length || !ids.length) return [];
  // Der Verlauf ändert sich nicht täglich: alle 15 Tage neu rechnen, sofort neu bei anderem Eingriff
  const key = `${Math.floor(world.day / 15)}|${Math.floor(world.spiel?.kapital ?? 0)}|${eingriffe.map((e) => `${e.id}:${e.ziel}:${e.ort?.join(",") ?? "-"}`).join(";")}|${ids.join(",")}|${monate}`;
  const gemerkt = CACHE.get(key);
  if (gemerkt) return gemerkt;
  let zeilen: NutzenZeile[] = [];
  try {
    const ohne = rechne(world, [], monate);
    const mit = rechne(world, eingriffe, monate);
    zeilen = ids.map((id) => {
      const node = NET.nodes[NET.index.get(id)!]!;
      const jetzt = lies(world.net, id);
      const o = lies(ohne, id).wert;
      const m = lies(mit, id).wert;
      const schlecht = node.kind === "problem" || HOCH_SCHLECHT.has(id);
      const d = m - o;
      const schwelle = jetzt.einheit === "Provinzen" ? 0.5 : 0.4;
      const besser = Math.abs(d) < schwelle ? null : schlecht ? d < 0 : d > 0;
      const runde = (x: number) => (jetzt.einheit === "Provinzen" ? Math.round(x) : Math.round(x * 10) / 10);
      return { id, name: node.name, art: node.kind === "problem" ? "problem" : "groesse", einheit: jetzt.einheit, jetzt: runde(jetzt.wert), ohne: runde(o), mit: runde(m), monate, schlechtWennHoch: schlecht, besser } satisfies NutzenZeile;
    });
  } catch {
    // Keine Vorschau ist besser als eine falsche
    zeilen = [];
  }
  if (CACHE.size > 400) CACHE.clear();
  CACHE.set(key, zeilen);
  return zeilen;
}
