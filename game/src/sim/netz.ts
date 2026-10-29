// Rechenkern des Politiknetzes (Spieldesign, Abschnitt 5).
//
// Jeder Knoten hat einen Wert je Provinz. Eine Verbindung gibt pro Monat einen
// Anteil der Abweichung ihres Ausgangsknotens vom Startwert weiter, mit
// Verzögerung. Der Zustand besteht nur aus flachen Zahlenlisten, damit er als
// JSON gespeichert und für die Vorschau schnell kopiert werden kann.

import type { EdgeSpec, FormSpec, NodeSpec, SynergieSpec } from "../data/politiknetz";
import type { EconomyState } from "./types";
import { potential } from "./economy";

export const PROVINCES = 81;
export const MAX_LAG = 12;
const SLOTS = MAX_LAG + 1;

/**
 * Gegenkräfte des Netzes (Runde „Das Netz atmet“, 05.10.2026). Alle Werte sind Spielparameter, keine Messwerte.
 *
 *  - Gewöhnung (`anteil`, `tempo`): Verbindungen in Stimmungsknoten (Gruppen, Vertrauen, Legitimität) messen die Abweichung der Quelle
 *    nicht nur vom Start, sondern zum Teil von einem langsam mitwandernden Bezugswert. Wer sich an eine dauerhaft niedrige Inflation
 *    oder einen hohen Mindestlohn gewöhnt hat, wird dadurch nicht dauerhaft immer zufriedener; wer eine Veränderung erlebt, spürt sie voll.
 *  - Sättigung (`saettigung`): Je weiter ein Stimmungsknoten von der Mitte (50) entfernt ist, desto schwerer wird der nächste Schritt nach
 *    außen. Rückwege zur Mitte bleiben ungebremst.
 */
export const GEGENKRAEFTE = {
  /** Anteil der Quellabweichung, der vom wandernden Bezugswert statt vom festen Start gemessen wird (0 = alte Rechnung, 1 = nur Bezugswert) */
  anteil: 0.8,
  /** Monatliche Annäherung des Bezugswerts an den aktuellen Wert (0,035 = Halbwertszeit etwa zwanzig Monate) */
  tempo: 0.035,
  /** Stärke der Sättigung der Stimmungsknoten (0 = keine; bei 0,7 wirkt ein Schub am Rand nur noch zu 30 %) */
  saettigung: 0.7,
  /** Stärke der Sättigung aller übrigen Größen und Probleme (Abstand zum Startwert gemessen an der Strecke bis zum Rand) */
  saettigungGroessen: 0.5,
};

/** Stimmungsknoten: die Gruppen sowie das Vertrauen in die Regierung und ihre Legitimität (dort wirken Gewöhnung und die Sättigung zur Mitte). */
const STIMMUNG_IDS = new Set(["vertrauen_regierung", "legitimitaet"]);
export const istStimmungsknoten = (node: NodeSpec): boolean => node.kind === "gruppe" || STIMMUNG_IDS.has(node.id);

/**
 * Quellen, an die man sich gewöhnt: die Alltagsökonomie. Teuerung, Einkommen, Armut und die Transfers, die sie lindern, werden nach einer
 * Weile als normal erlebt, auch wenn sie besser sind als zu Beginn. Funktionierende Dienste (Wasser, Gesundheit, Wohnen, Sicherheit,
 * Justiz) und gelöste Probleme bleiben dagegen spürbar, solange sie funktionieren: Wer sie schafft, wird dafür belohnt, und wer bloß die
 * Lage sich von selbst bessern lässt (etwa die Inflation), kaum noch.
 */
export const GEWOEHNUNG_QUELLEN = new Set([
  "inflation", "lebenshaltung", "realeinkommen", "armut", "p_armut", "lebensmittelpreise", "energiepreise", "mieten", "arbeitslosigkeit", "leitzins",
  "abwertung", "wachstum", "m_mindestlohn", "m_kindergeld", "m_sozialhilfe", "m_renten", "m_arbeitslosengeld", "m_energiesubventionen", "m_preiskontrollen",
  "m_einkommensteuer", "m_mwst", "m_kraftstoffsteuer", "m_fruehrente", "m_zuzahlungen", "streikneigung", "protestdruck", "polarisierung",
]);

/**
 * Ziele, die jede Quelle ganz am Gewohnten messen (wandernder Bezugswert, Anteil 1): Protest entsteht aus Enttäuschung und Veränderung, nicht aus einem Niveau, an das sich das
 * Land längst gewöhnt hat. Ohne das klebte der Protestdruck nach einigen Jahren guter Regierung dauerhaft bei null (und nach schlechter
 * bei hundert) und hätte keine Wellen mehr (Messung 06.10.2026: acht von acht fleißigen Läufen ab dem fünften Jahr bei 0). Maßnahmen
 * bleiben ausgenommen: Ein Ausnahmezustand staut Unmut auch dann auf, wenn er schon lange gilt.
 */
export const GEWOEHNUNG_ZIELE = new Set(["protestdruck"]);

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
  /**
   * Stufe je Provinz beim Beschluss (wirksamer Stand): Die Rampe dämpft nur, was darüber hinaus geändert wurde. Fehlt in älteren
   * Spielständen; dann dämpft sie wie früher die ganze Abweichung vom Start, bis die laufende Umsetzung fertig ist.
   */
  umsetzungBasis?: Record<string, number[]>;
  /**
   * Gewöhnung: wandernder Bezugswert je Quellknoten (Schlüssel = Knoten-Kennung, Werte je Provinz), nur für Quellen von Verbindungen in
   * Stimmungsknoten. Fehlt in älteren Spielständen und entsteht beim ersten Monat mit dem Startwert als Bezug.
   */
  bezug?: Record<string, number[]>;
}

/** Abweichung einer Maßnahme vom Start, gedämpft durch die laufende Umsetzung: nur der Teil über der Bezugsstufe wird gedämpft. */
function gedaempft(wert: number, start: number, f: number, basis: number | undefined): number {
  if (f >= 1) return wert - start;
  if (basis === undefined) return (wert - start) * f;
  return basis - start + f * (wert - basis);
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
  /** 1, wenn die Verbindung in einen Stimmungsknoten führt (Gewöhnung wirkt) */
  /** Gewöhnung je Kante: 0 keine, 1 teilweise (GEGENKRAEFTE.anteil), 2 voll (GEWOEHNUNG_ZIELE) */
  edgeGewoehnung: Uint8Array;
  /** Knoten, die Quelle mindestens einer Verbindung in einen Stimmungsknoten sind (brauchen einen Bezugswert) */
  bezugQuellen: Int32Array;
  /** Sättigung je Knoten: 0 = keine, 1 = Stimmungsknoten (Abstand zur Mitte 50), 2 = übrige Größen und Probleme (Abstand zum Startwert) */
  stimmung: Uint8Array;
  /** Zusammenspiel zweier Maßnahmen auf einen Zielknoten (Index statt Name) */
  synergien: { spec: SynergieSpec; a: number; b: number; to: number }[];
}

export interface ModellOptionen {
  /** Gewöhnung und Sättigung der Stimmungsknoten (Standard: an). Aus nur für Vergleichsrechnungen mit der Rechnung vor der Runde „Netz atmet“. */
  gegenkraefte?: boolean;
}

export function buildModel(nodes: NodeSpec[], edges: EdgeSpec[], synergien: SynergieSpec[] = [], optionen: ModellOptionen = {}): NetModel {
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
  const gegen = optionen.gegenkraefte !== false;
  const stimmung = Uint8Array.from(nodes.map((n) => (!gegen || n.input || n.kind === "massnahme" ? 0 : istStimmungsknoten(n) ? 1 : 2)));
  const edgeTo = Int32Array.from(edges.map((e) => index.get(e.to)!));
  const edgeFrom = Int32Array.from(edges.map((e) => index.get(e.from)!));
  const edgeGewoehnung = Uint8Array.from(
    edges.map((_, j) => {
      const von = nodes[edgeFrom[j]!]!;
      if (stimmung[edgeTo[j]!] === 1 && GEWOEHNUNG_QUELLEN.has(von.id)) return 1;
      return gegen && GEWOEHNUNG_ZIELE.has(nodes[edgeTo[j]!]!.id) && von.kind !== "massnahme" ? 2 : 0;
    }),
  );
  const quellen = new Set<number>();
  edgeFrom.forEach((f, j) => {
    if (edgeGewoehnung[j]) quellen.add(f);
  });
  const syn = synergien.map((spec) => {
    const a = index.get(spec.a);
    const b = index.get(spec.b);
    const to = index.get(spec.to);
    if (a === undefined || b === undefined || to === undefined) throw new Error(`Politiknetz: unbekannter Knoten im Zusammenspiel „${spec.id}“`);
    if (nodes[a]!.kind !== "massnahme" || nodes[b]!.kind !== "massnahme") throw new Error(`Politiknetz: Zusammenspiel „${spec.id}“ verlangt zwei Maßnahmen`);
    if (spec.lag < 0 || spec.lag > MAX_LAG) throw new Error(`Politiknetz: Verzögerung außerhalb 0–12 im Zusammenspiel „${spec.id}“`);
    return { spec, a, b, to };
  });
  return {
    nodes,
    edges,
    index,
    edgeGewoehnung,
    bezugQuellen: Int32Array.from([...quellen].sort((x, y) => x - y)),
    stimmung,
    synergien: syn,
    edgeFrom,
    edgeTo,
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
      return 50 + (e.deficit + e.fiscalImpulse + e.policyCost + (e.zinsMehrlast ?? 0) - (e.konjunkturSaldo ?? 0)) * 5;
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
  // Gewöhnung (siehe GEGENKRAEFTE): Quellen von Verbindungen in Stimmungsknoten haben einen wandernden Bezugswert; ältere Spielstände
  // beginnen mit dem Startwert als Bezug (dann zählt der erste Monat wie bisher).
  if (model.bezugQuellen.length > 0) s.bezug ??= {};
  for (let j = 0; j < model.edgeFrom.length; j++) {
    const from = model.edgeFrom[j]!;
    const to = model.edgeTo[j]!;
    const fid = model.nodes[from]!.id;
    const f = um ? (um[fid] ?? 100) / 100 : 1;
    // Mit Bezugsstufe (umsetzungBasis) dämpft die Rampe nur die neue Änderung; ohne (ältere Stände) wie bisher die ganze Abweichung
    const b = f < 1 ? s.umsetzungBasis?.[fid] : undefined;
    const w = model.edgeWeight[j]! * (b ? 1 : f);
    const korr = b ? model.edgeWeight[j]! * (1 - f) : 0;
    const past = s.history[(s.month - model.edgeLag[j]! + SLOTS * 1000) % SLOTS]!;
    const fo = from * PROVINCES;
    const to0 = to * PROVINCES;
    const form = model.edgeForm[j];
    if (b) {
      for (let p = 0; p < PROVINCES; p++) {
        const x = form === null ? past[fo + p]! - b[p]! : formWert(form, past[fo + p]!) - formWert(form, b[p]!);
        delta[to0 + p] = delta[to0 + p]! - korr * x;
      }
    }
    if (model.edgeGewoehnung[j]! >= 1) {
      // 2 = volle Gewöhnung (GEWOEHNUNG_ZIELE): nur die Abweichung vom Gewohnten zählt
      const gewAnteil = model.edgeGewoehnung[j] === 2 ? 1 : GEGENKRAEFTE.anteil;
      const quellId = model.nodes[from]!.id;
      let ref = s.bezug![quellId];
      if (!ref || ref.length !== PROVINCES) {
        ref = s.start.slice(fo, fo + PROVINCES);
        s.bezug![quellId] = ref;
      }
      if (form === null) {
        for (let p = 0; p < PROVINCES; p++) {
          const basis = (1 - gewAnteil) * s.start[fo + p]! + gewAnteil * ref[p]!;
          delta[to0 + p] = delta[to0 + p]! + w * (past[fo + p]! - basis);
        }
      } else {
        for (let p = 0; p < PROVINCES; p++) {
          const basis = (1 - gewAnteil) * formWert(form, s.start[fo + p]!) + gewAnteil * formWert(form, ref[p]!);
          delta[to0 + p] = delta[to0 + p]! + w * (formWert(form, past[fo + p]!) - basis);
        }
      }
      continue;
    }
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

  // Zusammenspiel zweier Maßnahmen (Synergie oder Gegenspiel): wirkt nur, wenn beide in die Richtung bewegt sind, die der Eintrag verlangt;
  // die Stärke richtet sich nach der kleineren Abweichung (die schwächere Maßnahme bestimmt, wie viel zusammenkommt).
  for (const sy of model.synergien) {
    const past = s.history[(s.month - sy.spec.lag + SLOTS * 1000) % SLOTS]!;
    const fa = um ? (um[model.nodes[sy.a]!.id] ?? 100) / 100 : 1;
    const fb = um ? (um[model.nodes[sy.b]!.id] ?? 100) / 100 : 1;
    const ba = fa < 1 ? s.umsetzungBasis?.[model.nodes[sy.a]!.id] : undefined;
    const bb = fb < 1 ? s.umsetzungBasis?.[model.nodes[sy.b]!.id] : undefined;
    const gegen = sy.spec.modus === "gegen";
    for (let p = 0; p < PROVINCES; p++) {
      const da = gedaempft(past[sy.a * PROVINCES + p]!, s.start[sy.a * PROVINCES + p]!, fa, ba?.[p]);
      const db = gedaempft(past[sy.b * PROVINCES + p]!, s.start[sy.b * PROVINCES + p]!, fb, bb?.[p]);
      let gemeinsam = 0;
      if (gegen) {
        if (da > 0 && db < 0) gemeinsam = Math.min(da, -db);
        else if (da < 0 && db > 0) gemeinsam = -Math.min(-da, db);
      } else if (da > 0 && db > 0) gemeinsam = Math.min(da, db);
      else if (da < 0 && db < 0) gemeinsam = -Math.min(-da, -db);
      if (gemeinsam !== 0) delta[sy.to * PROVINCES + p] = delta[sy.to * PROVINCES + p]! + sy.spec.weight * gemeinsam;
    }
  }

  model.nodes.forEach((node, i) => {
    if (node.input || node.kind === "massnahme") return;
    const o = i * PROVINCES;
    const ruecklauf = decayVon(node);
    const art = model.stimmung[i]!;
    for (let p = 0; p < PROVINCES; p++) {
      const k = o + p;
      let schub = delta[k]!;
      if (art === 1) {
        // Sättigung: Ein Schub nach außen (weg von 50) wird gebremst, je weiter der Knoten schon draußen ist; Rückwege bleiben frei.
        const x = (v[k]! - 50) / 50;
        if (schub * x > 0) schub *= 1 - GEGENKRAEFTE.saettigung * x * x;
      } else if (art === 2) {
        // Dasselbe für alle übrigen Größen, gemessen am Abstand zum Startwert im Verhältnis zur Strecke bis zum Rand
        const d = v[k]! - s.start[k]!;
        const strecke = d > 0 ? 100 - s.start[k]! : s.start[k]!;
        const x = strecke > 1 ? d / strecke : 0;
        if (schub * x > 0) schub *= 1 - GEGENKRAEFTE.saettigungGroessen * x * x;
      }
      const next = v[k]! + schub - ruecklauf * (v[k]! - s.start[k]!);
      v[k] = clampIndex(next);
    }
  });

  // Gewöhnung: Die Bezugswerte folgen den neuen Werten ihrer Quellen langsam
  if (s.bezug) {
    for (const i of model.bezugQuellen) {
      const ref = s.bezug[model.nodes[i]!.id];
      if (!ref) continue;
      const o = i * PROVINCES;
      for (let p = 0; p < PROVINCES; p++) ref[p] = ref[p]! + GEGENKRAEFTE.tempo * (v[o + p]! - ref[p]!);
    }
  }

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
