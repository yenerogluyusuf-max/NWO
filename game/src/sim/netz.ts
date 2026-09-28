// Rechenkern des Politiknetzes (Spieldesign, Abschnitt 5).
//
// Jeder Knoten hat einen Wert je Provinz. Eine Verbindung gibt pro Monat einen
// Anteil der Abweichung ihres Ausgangsknotens vom Startwert weiter, mit
// Verzögerung. Der Zustand besteht nur aus flachen Zahlenlisten, damit er als
// JSON gespeichert und für die Vorschau schnell kopiert werden kann.

import type { EdgeSpec, NodeSpec } from "../data/politiknetz";
import type { EconomyState } from "./types";
import { potential } from "./economy";

export const PROVINCES = 81;
export const MAX_LAG = 12;
const SLOTS = MAX_LAG + 1;

export interface NetState {
  /** Werte, Index = Knoten × 81 + (Kfz-Kennziffer − 1) */
  values: number[];
  /** Startwerte (Ruhelage) je Knoten und Provinz */
  start: number[];
  /** Ringpuffer der Werte der letzten 13 Monate */
  history: number[][];
  month: number;
  /** Zielstufe je Maßnahme, die der Spieler beschlossen hat */
  targets: Record<string, number>;
  /** Umsetzungsschritt je Monat für laufende Änderungen */
  steps: Record<string, number>;
  /** Bevölkerungsanteil je Provinz für Landesdurchschnitte */
  weights: number[];
}

export interface NetModel {
  nodes: NodeSpec[];
  edges: EdgeSpec[];
  index: Map<string, number>;
  edgeFrom: Int32Array;
  edgeTo: Int32Array;
  edgeWeight: Float64Array;
  edgeLag: Int32Array;
}

export function buildModel(nodes: NodeSpec[], edges: EdgeSpec[]): NetModel {
  const index = new Map(nodes.map((n, i) => [n.id, i]));
  for (const e of edges) {
    if (!index.has(e.from)) throw new Error(`Politiknetz: unbekannter Knoten „${e.from}“`);
    if (!index.has(e.to)) throw new Error(`Politiknetz: unbekannter Knoten „${e.to}“`);
    if (e.lag < 0 || e.lag > MAX_LAG) throw new Error(`Politiknetz: Verzögerung außerhalb 0–12 bei ${e.from} → ${e.to}`);
  }
  return {
    nodes,
    edges,
    index,
    edgeFrom: Int32Array.from(edges.map((e) => index.get(e.from)!)),
    edgeTo: Int32Array.from(edges.map((e) => index.get(e.to)!)),
    edgeWeight: Float64Array.from(edges.map((e) => e.weight)),
    edgeLag: Int32Array.from(edges.map((e) => e.lag)),
  };
}

/** Regionale Startwerte: Faktor je Knoten und Provinz (1 = Landesdurchschnitt). */
export type RegionalStart = Record<string, number[]>;

export function createNet(
  model: NetModel,
  economy: EconomyState,
  regional: RegionalStart = {},
  weights: number[] = new Array(PROVINCES).fill(1 / PROVINCES),
): NetState {
  const n = model.nodes.length;
  const start = new Array<number>(n * PROVINCES);
  model.nodes.forEach((node, i) => {
    const base = node.input ? inputValue(node.input, economy, 1) : node.start;
    const factors = regional[node.id];
    for (let p = 0; p < PROVINCES; p++) {
      const f = factors?.[p] ?? 1;
      start[i * PROVINCES + p] = node.input ? inputValue(node.input, economy, f) : clampIndex(base * f);
    }
  });
  const values = start.slice();
  return {
    values,
    start,
    history: Array.from({ length: SLOTS }, () => values.slice()),
    month: 0,
    targets: {},
    steps: {},
    weights: weights.slice(),
  };
}

/** Wert einer Eingangsgröße aus dem Wirtschaftsmodell, je Provinz mit Faktor. */
function inputValue(input: NonNullable<NodeSpec["input"]>, e: EconomyState, factor: number): number {
  switch (input) {
    case "inflation":
      return e.inflation;
    case "arbeitslosigkeit":
      return e.unemployment * factor;
    case "wachstum":
      return 50 + (e.growth - potential(e)) * 5;
    case "leitzins":
      return e.policyRate;
    case "abwertung":
      return e.fxChange12;
    case "defizit":
      return 50 + (e.deficit + e.fiscalImpulse + e.policyCost) * 5;
    case "schulden":
      return e.debtRatio;
  }
}

/** Ein Monat: Eingänge übernehmen, Maßnahmen umsetzen, Wirkungen weitergeben. */
export function stepNet(model: NetModel, s: NetState, e: EconomyState, regional: RegionalStart = {}): void {
  const n = model.nodes.length;
  const v = s.values;

  // Eingänge aus dem Wirtschaftsmodell
  model.nodes.forEach((node, i) => {
    if (!node.input) return;
    const factors = regional[node.id];
    for (let p = 0; p < PROVINCES; p++) v[i * PROVINCES + p] = inputValue(node.input, e, factors?.[p] ?? 1);
  });

  // Maßnahmen bewegen sich schrittweise auf ihr Ziel zu (Umsetzungsgrad)
  for (const [id, target] of Object.entries(s.targets)) {
    const i = model.index.get(id);
    if (i === undefined) continue;
    const step = s.steps[id] ?? 100;
    for (let p = 0; p < PROVINCES; p++) {
      const k = i * PROVINCES + p;
      const diff = target - v[k]!;
      v[k] = v[k]! + Math.sign(diff) * Math.min(Math.abs(diff), step);
    }
  }

  // Wirkungen über die Verbindungen
  const delta = new Float64Array(n * PROVINCES);
  for (let j = 0; j < model.edgeFrom.length; j++) {
    const from = model.edgeFrom[j]!;
    const to = model.edgeTo[j]!;
    const w = model.edgeWeight[j]!;
    const past = s.history[(s.month - model.edgeLag[j]! + SLOTS * 1000) % SLOTS]!;
    const fo = from * PROVINCES;
    const to0 = to * PROVINCES;
    for (let p = 0; p < PROVINCES; p++) {
      delta[to0 + p] = delta[to0 + p]! + w * (past[fo + p]! - s.start[fo + p]!);
    }
  }

  model.nodes.forEach((node, i) => {
    if (node.input || node.kind === "massnahme") return;
    const o = i * PROVINCES;
    for (let p = 0; p < PROVINCES; p++) {
      const k = o + p;
      const next = v[k]! + delta[k]! - node.decay * (v[k]! - s.start[k]!);
      v[k] = clampIndex(next);
    }
  });

  s.month += 1;
  s.history[s.month % SLOTS] = v.slice();
}

/** Landesdurchschnitt eines Knotens, gewichtet nach Bevölkerung. */
export function nationalAverage(model: NetModel, s: NetState, id: string): number {
  const i = model.index.get(id);
  if (i === undefined) return NaN;
  let sum = 0;
  for (let p = 0; p < PROVINCES; p++) sum += s.values[i * PROVINCES + p]! * s.weights[p]!;
  return sum;
}

export function provinceValue(model: NetModel, s: NetState, id: string, plaka: number): number {
  const i = model.index.get(id);
  if (i === undefined) return NaN;
  return s.values[i * PROVINCES + plaka - 1]!;
}

export function startAverage(model: NetModel, s: NetState, id: string): number {
  const i = model.index.get(id);
  if (i === undefined) return NaN;
  let sum = 0;
  for (let p = 0; p < PROVINCES; p++) sum += s.start[i * PROVINCES + p]! * s.weights[p]!;
  return sum;
}

/** Laufende Kosten aller Maßnahmen gegenüber dem Start in % des BIP pro Jahr. */
export function policyCost(model: NetModel, s: NetState): number {
  let total = 0;
  model.nodes.forEach((node) => {
    if (node.kind !== "massnahme" || !node.cost) return;
    total += ((nationalAverage(model, s, node.id) - startAverage(model, s, node.id)) / 100) * node.cost;
  });
  return total;
}

/** Provinzen, in denen ein Problem akut ist. */
export function activeProvinces(model: NetModel, s: NetState, id: string): number[] {
  const i = model.index.get(id);
  const node = i === undefined ? undefined : model.nodes[i];
  if (i === undefined || !node?.threshold) return [];
  const out: number[] = [];
  for (let p = 0; p < PROVINCES; p++) if (s.values[i * PROVINCES + p]! >= node.threshold) out.push(p + 1);
  return out;
}

function clampIndex(x: number): number {
  return Math.min(100, Math.max(0, x));
}
