// Rechenkern des Politiknetzes (Spieldesign, Abschnitt 5): Knoten mit einem
// Wert je Provinz, Verbindungen mit Stärke und Verzögerung in Monaten.
// Noch ohne Inhalt; dient dem Simulationsversuch (Entwicklungsplan, Abschnitt 6).

export const PROVINCES = 81;

export interface NetNode {
  id: string;
  /** Wert je Provinz, Index = Kfz-Kennziffer − 1 */
  values: Float64Array;
  /** Ruhewert, zu dem der Knoten ohne Einflüsse zurückkehrt */
  rest: number;
  /** Anteil der Rückkehr zum Ruhewert pro Monat */
  decay: number;
}

export interface NetEdge {
  from: number;
  to: number;
  weight: number;
  /** Verzögerung in Monaten, 0 bis MAX_LAG */
  lag: number;
}

export const MAX_LAG = 12;

export class PolicyNet {
  /** Ringpuffer der Knotenwerte für Verzögerungen: history[t % (MAX_LAG+1)][node] */
  private history: Float64Array[][];
  private month = 0;

  constructor(
    public nodes: NetNode[],
    public edges: NetEdge[],
  ) {
    this.history = Array.from({ length: MAX_LAG + 1 }, () =>
      nodes.map((n) => Float64Array.from(n.values)),
    );
  }

  /** Einen Monat fortschreiben. */
  step(): void {
    const n = this.nodes.length;
    const delta = Array.from({ length: n }, () => new Float64Array(PROVINCES));
    for (const e of this.edges) {
      const past = this.history[(this.month - e.lag + (MAX_LAG + 1) * 1000) % (MAX_LAG + 1)]![e.from]!;
      const d = delta[e.to]!;
      for (let p = 0; p < PROVINCES; p++) d[p]! += e.weight * (past[p]! - this.nodes[e.from]!.rest);
    }
    for (let i = 0; i < n; i++) {
      const node = this.nodes[i]!;
      const v = node.values;
      const d = delta[i]!;
      for (let p = 0; p < PROVINCES; p++) {
        v[p] = v[p]! + d[p]! - node.decay * (v[p]! - node.rest);
      }
    }
    this.month += 1;
    const slot = this.history[this.month % (MAX_LAG + 1)]!;
    for (let i = 0; i < n; i++) slot[i]!.set(this.nodes[i]!.values);
  }
}
