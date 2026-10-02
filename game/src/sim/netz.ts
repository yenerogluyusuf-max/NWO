// Rechenkern des Politiknetzes (Spieldesign, Abschnitt 5).
//
// Jeder Knoten hat einen Wert je Provinz. Eine Verbindung gibt pro Monat einen
// Anteil der Abweichung ihres Ausgangsknotens vom Startwert weiter, mit
// Verzögerung. Der Zustand besteht nur aus flachen Zahlenlisten, damit er als
// JSON gespeichert und für die Vorschau schnell kopiert werden kann.

import type { EdgeSpec, FormSpec, NodeSpec } from "../data/politiknetz";
import type { EconomyState } from "./types";
import { potential } from "./economy";

export const PROVINCES = 81;
export const MAX_LAG = 12;
const SLOTS = MAX_LAG + 1;

/**
 * Die Kantenformel (Democracy 4: `Ziel, f(x), Inertia`) — ausgewertet auf dem Index 0–100.
 * `linear` ist die Identität, sodass w · (F(x) − F(x₀)) für lineare Kanten exakt dem alten
 * Verhalten w · (x − x₀) entspricht. Alle Parameter sind Spielparameter, keine Messwerte.
 */
export function formWert(form: FormSpec | undefined, x: number): number {
  if (!form || form.typ === "linear") return x;
  switch (form.typ) {
    case "saettigung": {
      const k = form.k ?? 2;
      return (1 - Math.exp((-k * x) / 100)) * 100;
    }
    case "schwelle": {
      const k = form.k ?? 0.12;
      const mitte = form.mitte ?? 50;
      return 100 / (1 + Math.exp(-k * (x - mitte)));
    }
    case "umkehr": {
      const exponent = form.exponent ?? 2;
      return Math.pow(Math.max(0, x) / 100, exponent) * 100;
    }
  }
}

/**
 * Monatlicher Rücklauf eines Knotens. Das optionale `traegheit`-Feld (Spielparameter) teilt den
 * Datenwert: tiefe strukturelle Größen kehren langsamer zur Ruhelage zurück als Stimmungsgrößen.
 * Knoten ohne das Feld verhalten sich bit-identisch zu früher.
 */
export function decayVon(node: NodeSpec): number {
  return node.decay / (node.traegheit ?? 1);
}

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
  /** Regionale Zielstufe je Maßnahme, Index = Kfz-Kennziffer − 1, −1 = kein regionales Ziel (Bau vor Ort) */
  ziele?: Record<string, number[]>;
  /** Umsetzungsschritt je Monat und Provinz für regionale Ziele */
  schritte?: Record<string, number[]>;
  /** Bevölkerungsanteil je Provinz für Landesdurchschnitte */
  weights: number[];
  /** Akut-Flag je Knoten und Provinz (Problem-Hysterese nach Democracy 4) */
  acute?: number[];
  /** Umsetzungsstand je aktiver Maßnahme, 0–100; fehlender Eintrag = voll umgesetzt (INN-2, Logik in sim/umsetzung.ts) */
  umsetzung?: Record<string, number>;
  /** Punkte je Monat, mit denen die Umsetzung fortschreitet (beim Beschluss festgelegt) */
  umsetzungTempo?: Record<string, number>;
}

export interface NetModel {
  nodes: NodeSpec[];
  edges: EdgeSpec[];
  index: Map<string, number>;
  edgeFrom: Int32Array;
  edgeTo: Int32Array;
  edgeWeight: Float64Array;
  edgeLag: Int32Array;
  /** Kantenformel je Verbindung; null = linear (schneller Pfad, bisheriges Verhalten) */
  edgeForm: (FormSpec | null)[];
}

export function buildModel(nodes: NodeSpec[], edges: EdgeSpec[]): NetModel {
  const index = new Map(nodes.map((n, i) => [n.id, i]));
  for (const e of edges) {
    if (!index.has(e.from)) throw new Error(`Politiknetz: unbekannter Knoten „${e.from}“`);
    if (!index.has(e.to)) throw new Error(`Politiknetz: unbekannter Knoten „${e.to}“`);
    if (e.lag < 0 || e.lag > MAX_LAG) throw new Error(`Politiknetz: Verzögerung außerhalb 0–12 bei ${e.from} → ${e.to}`);
    if (e.form) {
      const quelle = nodes[index.get(e.from)!]!;
      // Die Formen sind auf den Index 0–100 kalibriert; Eingänge aus dem Wirtschaftsmodell haben eigene Einheiten.
      if (quelle.input) throw new Error(`Politiknetz: Kantenform an Eingangsgröße „${e.from}“ (kein Index 0–100)`);
      if (e.form.k !== undefined && e.form.k <= 0) throw new Error(`Politiknetz: k muss positiv sein bei ${e.from} → ${e.to}`);
      if (e.form.mitte !== undefined && (e.form.mitte < 0 || e.form.mitte > 100)) throw new Error(`Politiknetz: mitte außerhalb 0–100 bei ${e.from} → ${e.to}`);
      if (e.form.exponent !== undefined && e.form.exponent < 1) throw new Error(`Politiknetz: exponent unter 1 bei ${e.from} → ${e.to}`);
    }
    for (const n of nodes) if (n.traegheit !== undefined && n.traegheit <= 0) throw new Error(`Politiknetz: traegheit muss positiv sein bei „${n.id}“`);
  }
  return {
    nodes,
    edges,
    index,
    edgeFrom: Int32Array.from(edges.map((e) => index.get(e.from)!)),
    edgeTo: Int32Array.from(edges.map((e) => index.get(e.to)!)),
    edgeWeight: Float64Array.from(edges.map((e) => e.weight)),
    edgeLag: Int32Array.from(edges.map((e) => e.lag)),
    edgeForm: edges.map((e) => (e.form && e.form.typ !== "linear" ? e.form : null)),
  };
}

/** Regionale Startwerte: Faktor je Knoten und Provinz (1 = Landesdurchschnitt). */
export type RegionalStart = Record<string, number[]>;

export function createNet(
  model: NetModel,
  economy: EconomyState,
  regional: RegionalStart = {},
  weights: number[] = new Array(PROVINCES).fill(1 / PROVINCES),
  deltas: RegionalStart = {},
): NetState {
  const n = model.nodes.length;
  const start = new Array<number>(n * PROVINCES);
  model.nodes.forEach((node, i) => {
    const base = node.input ? inputValue(node.input, economy, 1) : node.start;
    const factors = regional[node.id];
    const d = deltas[node.id];
    for (let p = 0; p < PROVINCES; p++) {
      const f = factors?.[p] ?? 1;
      // Archätyp-Schicht (data/provinz_archetypen.ts): additive Punkte über der
      // Echtdaten-Schicht (Faktor), nur für Katalog-Knoten; Eingänge bleiben echt.
      start[i * PROVINCES + p] = node.input ? inputValue(node.input, economy, f) : clampIndex(base * f + (d?.[p] ?? 0));
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
      return 50 + (e.deficit + e.fiscalImpulse + e.policyCost + (e.zinsMehrlast ?? 0)) * 5;
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

  // Regionale Ziele: Nur die genannten Provinzen bewegen sich (Bau vor Ort)
  if (s.ziele) {
    for (const [id, arr] of Object.entries(s.ziele)) {
      const i = model.index.get(id);
      if (i === undefined) continue;
      const st = s.schritte?.[id];
      let offen = false;
      for (let p = 0; p < PROVINCES; p++) {
        const t = arr[p]!;
        if (t < 0) continue;
        const k = i * PROVINCES + p;
        const diff = t - v[k]!;
        const step = st?.[p] ?? 100;
        if (Math.abs(diff) <= step) {
          v[k] = t;
          arr[p] = -1; // erreicht
        } else {
          v[k] = v[k]! + Math.sign(diff) * step;
          offen = true;
        }
      }
      if (!offen) {
        delete s.ziele[id];
        if (s.schritte) delete s.schritte[id];
      }
    }
  }

  // Wirkungen über die Verbindungen
  const delta = new Float64Array(n * PROVINCES);
  // INN-2-Haken (sim/umsetzung.ts): Ausgehende Kanten einer Maßnahme wirken nur mit dem
  // Stand ihrer Umsetzung (Faktor umsetzung/100); fehlt der Eintrag, wirkt sie voll.
  // Beides wirkt zusammen: erst der Umsetzungsfaktor, dann die Verzögerung der Kante.
  const um = s.umsetzung;
  for (let j = 0; j < model.edgeFrom.length; j++) {
    const from = model.edgeFrom[j]!;
    const to = model.edgeTo[j]!;
    const w = model.edgeWeight[j]! * (um ? (um[model.nodes[from]!.id] ?? 100) / 100 : 1);
    const past = s.history[(s.month - model.edgeLag[j]! + SLOTS * 1000) % SLOTS]!;
    const fo = from * PROVINCES;
    const to0 = to * PROVINCES;
    const form = model.edgeForm[j];
    if (form === null) {
      // Linear: bisheriges Verhalten, bit-identisch
      for (let p = 0; p < PROVINCES; p++) {
        delta[to0 + p] = delta[to0 + p]! + w * (past[fo + p]! - s.start[fo + p]!);
      }
    } else {
      // Kantenformel (Democracy 4): w · (F(x) − F(x₀)); beim Startwert ist der Beitrag 0 wie bei linear
      for (let p = 0; p < PROVINCES; p++) {
        delta[to0 + p] = delta[to0 + p]! + w * (formWert(form, past[fo + p]!) - formWert(form, s.start[fo + p]!));
      }
    }
  }

  model.nodes.forEach((node, i) => {
    if (node.input || node.kind === "massnahme") return;
    const o = i * PROVINCES;
    const ruecklauf = decayVon(node);
    for (let p = 0; p < PROVINCES; p++) {
      const k = o + p;
      const next = v[k]! + delta[k]! - ruecklauf * (v[k]! - s.start[k]!);
      v[k] = clampIndex(next);
    }
  });

  s.month += 1;
  s.history[s.month % SLOTS] = v.slice();

  // Problem-Hysterese (nach Democracy 4): Ein Problem bleibt akut, bis es deutlich
  // unter die Start-Schwelle fällt. Start- und Stoppschwelle sind getrennt.
  if (!s.acute) s.acute = new Array(n * PROVINCES).fill(0);
  const ac = s.acute;
  model.nodes.forEach((node, i) => {
    if (node.kind !== "problem" || !node.threshold) return;
    const stop = node.threshold - 8;
    for (let p = 0; p < PROVINCES; p++) {
      const k = i * PROVINCES + p;
      if (v[k]! >= node.threshold) ac[k] = 1;
      else if (v[k]! < stop) ac[k] = 0;
    }
  });
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

/** Provinzen, in denen ein Problem akut ist (mit Hysterese, sobald der Kern gelaufen ist). */
export function activeProvinces(model: NetModel, s: NetState, id: string): number[] {
  const i = model.index.get(id);
  const node = i === undefined ? undefined : model.nodes[i];
  if (i === undefined || !node?.threshold) return [];
  const out: number[] = [];
  const ac = s.acute;
  for (let p = 0; p < PROVINCES; p++) {
    const k = i * PROVINCES + p;
    const on = ac ? ac[k] === 1 : s.values[k]! >= node.threshold;
    if (on) out.push(p + 1);
  }
  return out;
}

function clampIndex(x: number): number {
  return Math.min(100, Math.max(0, x));
}
