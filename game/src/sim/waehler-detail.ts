// Die Wähler im Einzelnen: Warum eine Gruppe so gestimmt ist (Ursachenkette), was sie mag und fürchtet, wohin sie wechseln würde,
// wie sich ihre Stimmung entwickelt hat und was ihr helfen würde. Alles aus dem Politiknetz gerechnet, nichts nebenbei erfunden.
//
// Grundlage ist eine Eigenschaft des Netzes selbst: Eine Größe strebt in jedem Monat um `Trägheit × (Wert − Ruhelage)` zurück zur Ruhelage
// und bekommt von jeder Verbindung `Gewicht × (Abweichung des Auslösers)` dazu. Im Gleichgewicht gilt also
//     Abweichung der Größe = Σ Gewicht × Abweichung des Auslösers ÷ Trägheit,
// und jeder Summand ist der Beitrag genau dieses Auslösers. Damit lässt sich die Stimmung in ihre Ursachen zerlegen und die Wirkung einer
// Entscheidung in Punkten vorwegnehmen (ohne Verzögerungen und Deckelungen; die Oberfläche nennt das „langfristig“).

import { NET } from "./modell";
import { PROVINCES, nationalAverage, startAverage } from "./netz";
import { GRUPPEN, GRUPPEN_SUMME } from "./gruppen";
import { hebel } from "./wege";
import { FORDERUNGEN, PARTEI_NAME } from "./fraktionen";
import { pruefeVorhaben, provinzName } from "./handeln";
import { PROVINZEN, REGION_DE } from "./regional";
import { launenWort, vorMonaten } from "./waehler";
import { zielZustimmung } from "./spiel";
import { vorlage } from "./ereignisse";
import { verlaufVon } from "./waehler-verlauf";
import type { EdgeSpec, NodeSpec } from "../data/politiknetz";
import type { World } from "./types";

const knoten = (id: string): NodeSpec => NET.nodes[NET.index.get(id)!]!;

/** Wie viel eine Gruppe zur Zustimmung beiträgt, je Punkt Stimmung: Gewicht der Gruppe mal 0,25 (siehe `zustimmungsTeile`). */
export const ZUSTIMMUNG_JE_GRUPPEN_PUNKT = 0.25;
export const ZUSTIMMUNG_JE_VERTRAUENS_PUNKT = 0.45;

export const SCHWELLE_TRAEGER = 58;
export const SCHWELLE_SCHWANKEND = 45;

export type Rolle = "traeger" | "schwankend" | "gegner";

export const rolleVon = (laune: number): Rolle => (laune >= SCHWELLE_TRAEGER ? "traeger" : laune >= SCHWELLE_SCHWANKEND ? "schwankend" : "gegner");

/** Was die Gruppe bei der nächsten Wahl täte, in einem Wort. */
export function absichtWort(laune: number): string {
  if (laune >= 70) return "würde Sie mit Überzeugung wählen";
  if (laune >= SCHWELLE_TRAEGER) return "würde Sie wieder wählen";
  if (laune >= 50) return "schwankt, mit leichter Neigung zu Ihnen";
  if (laune >= SCHWELLE_SCHWANKEND) return "schwankt, mit leichter Neigung zu einer anderen Partei";
  if (laune >= 33) return "würde eher wechseln";
  return "wendet sich ab";
}

// ---------------------------------------------------------------------------
// Netz-Zerlegung

const EIN = new Map<string, EdgeSpec[]>();
const AUS = new Map<string, EdgeSpec[]>();
for (const e of NET.edges) {
  (EIN.get(e.to) ?? EIN.set(e.to, []).get(e.to)!).push(e);
  (AUS.get(e.from) ?? AUS.set(e.from, []).get(e.from)!).push(e);
}

/** Abweichung eines Knotens im Landesdurchschnitt von seiner Ruhelage (so rechnet auch das Netz). */
export function abweichungVomStart(world: World, id: string): number {
  return nationalAverage(NET, world.net, id) - startAverage(NET, world.net, id);
}

function abweichungVor(world: World, id: string, monate: number): number | null {
  const v = vorMonaten(world, id, monate);
  return v === null ? null : v - startAverage(NET, world.net, id);
}

export interface Treiber {
  von: string;
  name: string;
  art: NodeSpec["kind"];
  /** Stärke der Verbindung */
  gewicht: number;
  /** Abweichung des Auslösers von seiner Ruhelage, in Punkten seines Wertes */
  abweichung: number;
  /** Wie viele Punkte das Gleichgewicht der Größe dadurch verschoben ist */
  beitrag: number;
  /** Wie sich dieser Beitrag in den letzten Monaten verändert hat (null: keine Verlaufsdaten) */
  veraenderung: number | null;
  /** Die Begründung der Verbindung */
  text: string;
}

/** Die Ursachen für den Stand einer Größe (oder Gruppe), nach Beitrag sortiert. */
export function treiber(world: World, id: string, monate = 3): Treiber[] {
  const nach = knoten(id);
  const decay = nach.decay > 0 ? nach.decay : 0.1;
  const out: Treiber[] = [];
  for (const e of EIN.get(id) ?? []) {
    const von = knoten(e.from);
    const abw = abweichungVom(world, e.from);
    const frueher = abweichungVor(world, e.from, monate);
    const beitrag = (e.weight * abw) / decay;
    out.push({
      von: e.from,
      name: von.name,
      art: von.kind,
      gewicht: e.weight,
      abweichung: abw,
      beitrag,
      veraenderung: frueher === null ? null : beitrag - (e.weight * frueher) / decay,
      text: e.why,
    });
  }
  return out.sort((a, b) => Math.abs(b.beitrag) - Math.abs(a.beitrag));
}

const abweichungVom = abweichungVomStart;

export interface KettenGlied {
  id: string;
  name: string;
  art: NodeSpec["kind"];
  /** Wert im Landesdurchschnitt */
  wert: number;
  /** Abweichung von der Ruhelage */
  abweichung: number;
  /** Beitrag zur übergeordneten Größe, in deren Punkten */
  beitrag: number;
  /** Ob ein Anstieg dieser Größe die Stimmung der Gruppe am Anfang der Kette hebt (+1) oder drückt (−1) */
  vorzeichen: 1 | -1;
  text: string;
  kinder: KettenGlied[];
}

/**
 * Die Ursachenkette einer Größe: Was sie heute von ihrer Ruhelage entfernt, und was wiederum jene Ursachen entfernt hat.
 * Endet bei Maßnahmen und Eingangsgrößen, denn dort beginnt die Entscheidung oder die Wirtschaft.
 */
export function kette(world: World, id: string, tiefe = 2, breite = 3, schwelle = 0.4, vorzeichenOben: 1 | -1 = 1): KettenGlied[] {
  const liste = treiber(world, id).filter((t) => Math.abs(t.beitrag) >= schwelle).slice(0, breite);
  return liste.map((t) => {
    const von = knoten(t.von);
    const ende = tiefe <= 1 || von.kind === "massnahme" || !!von.input;
    const vorzeichen = (t.gewicht >= 0 ? 1 : -1) * vorzeichenOben as 1 | -1;
    return {
      id: t.von,
      name: t.name,
      art: t.art,
      wert: nationalAverage(NET, world.net, t.von),
      abweichung: t.abweichung,
      beitrag: t.beitrag,
      vorzeichen,
      text: t.text,
      kinder: ende ? [] : kette(world, t.von, tiefe - 1, Math.max(2, breite - 1), schwelle, vorzeichen),
    };
  });
}

/** Wohin sich die Größe bei den heutigen Verhältnissen entwickelt (Gleichgewicht), und wie weit sie davon entfernt ist. */
export function tendenz(world: World, id: string): { jetzt: number; ziel: number; abstand: number } {
  const jetzt = nationalAverage(NET, world.net, id);
  const ziel = Math.max(0, Math.min(100, startAverage(NET, world.net, id) + treiber(world, id).reduce((s, t) => s + t.beitrag, 0)));
  return { jetzt, ziel, abstand: ziel - jetzt };
}

// ---------------------------------------------------------------------------
// Vorwegnahme einer Entscheidung

/** Alle Größen, die von `start` aus über Verbindungen erreichbar sind (Maßnahmen und Eingangsgrößen bleiben außen vor). */
function erreichbar(start: string): string[] {
  const tiefe = new Map<string, number>([[start, 0]]);
  const front = [start];
  while (front.length) {
    const von = front.shift()!;
    const d = tiefe.get(von)!;
    if (d >= 6) continue;
    for (const e of AUS.get(von) ?? []) {
      if (tiefe.has(e.to)) continue;
      const ziel = knoten(e.to);
      if (ziel.kind === "massnahme" || ziel.input) continue;
      tiefe.set(e.to, d + 1);
      front.push(e.to);
    }
  }
  return [...tiefe.keys()].filter((k) => k !== start);
}

/**
 * Um wie viele Punkte sich die Größen langfristig verschieben, wenn `start` um `delta` Punkte bewegt wird.
 * Rechnet das Gleichgewicht des Netzes durch (Maßnahmen und Eingangsgrößen bleiben fest; Wirtschaftsrückwirkungen fehlen).
 */
export function gleichgewicht(start: string, delta: number): Map<string, number> {
  const liste = erreichbar(start);
  const shift = new Map<string, number>([[start, delta]]);
  for (let runde = 0; runde < 10; runde++) {
    for (const k of liste) {
      const decay = knoten(k).decay > 0 ? knoten(k).decay : 0.1;
      let s = 0;
      for (const e of EIN.get(k) ?? []) s += e.weight * (shift.get(e.from) ?? 0);
      shift.set(k, Math.max(-60, Math.min(60, s / decay)));
    }
  }
  shift.delete(start);
  return shift;
}

/**
 * Wie sich die Größen nach `monate` Monaten verschoben haben, wenn `start` um `delta` Punkte bewegt wird: das Netz auf Abweichungen gerechnet,
 * mit Umsetzungsdauer der Maßnahme, Verzögerung der Verbindungen und Trägheit der Größen, aber ohne Wirtschaftsrückwirkungen und ohne Deckelung.
 * Für einen Blick auf die Größenordnung; die genaue Vorschau rechnet das ganze Modell mit Zufall.
 */
export function wirkungNach(start: string, delta: number, monate: number[], dauer = knoten(start).months ?? 1): Map<number, Map<string, number>> {
  const liste = erreichbar(start);
  const bis = Math.max(...monate);
  // hist[t] = Abweichungen am Ende von Monat t (t = 0: vor der Entscheidung)
  const hist: Map<string, number>[] = [new Map()];
  const out = new Map<number, Map<string, number>>();
  for (let t = 1; t <= bis; t++) {
    const prev = hist[t - 1]!;
    const jetzt = new Map<string, number>();
    jetzt.set(start, delta * Math.min(1, t / Math.max(1, dauer)));
    for (const k of liste) {
      const decay = knoten(k).decay > 0 ? knoten(k).decay : 0.1;
      let zufluss = 0;
      for (const e of EIN.get(k) ?? []) {
        const zurueck = t - 1 - e.lag;
        const quelle = zurueck < 0 ? 0 : (hist[zurueck]!.get(e.from) ?? 0);
        zufluss += e.weight * quelle;
      }
      const v = prev.get(k) ?? 0;
      jetzt.set(k, v + zufluss - decay * v);
    }
    hist.push(jetzt);
    if (monate.includes(t)) {
      const m = new Map(jetzt);
      m.delete(start);
      out.set(t, m);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Mögen, Hassen, Sorgen

export interface Praeferenz {
  id: string;
  name: string;
  /** +1: mehr davon macht die Gruppe zufriedener, −1: weniger davon */
  richtung: 1 | -1;
  staerke: number;
  /** Aktuelle Stufe im Landesdurchschnitt */
  stufe: number;
  /** Abweichung von der Ruhelage */
  seitStart: number;
  /** Ob der heutige Stand der Gruppe hilft (+1), schadet (−1) oder nichts ändert (0) */
  wirkt: 1 | -1 | 0;
}

/** Maßnahmen, an denen die Gruppe hängt, nach Stärke (direkt und über eine Zwischengröße). */
export function praeferenzen(world: World, id: string, n = 6): { will: Praeferenz[]; hasst: Praeferenz[] } {
  const zu = (richtung: 1 | -1) =>
    hebel(id, 1, 40)
      .filter((h) => h.richtung === richtung)
      .slice(0, n)
      .map<Praeferenz>((h) => {
        const abw = abweichungVom(world, h.node.id);
        return {
          id: h.node.id,
          name: h.node.name,
          richtung,
          staerke: h.staerke,
          stufe: nationalAverage(NET, world.net, h.node.id),
          seitStart: abw,
          wirkt: Math.abs(abw) < 2 ? 0 : (abw * richtung > 0 ? 1 : -1),
        };
      });
  return { will: zu(1), hasst: zu(-1) };
}

export interface Sorge {
  id: string;
  name: string;
  art: NodeSpec["kind"];
  /** +1: ein höherer Wert freut die Gruppe, −1: ein höherer Wert stört sie */
  vorzeichen: 1 | -1;
  gewicht: number;
  wert: number;
  seitStart: number;
  /** Ob die Größe heute hilft (+1), stört (−1) oder ruhig ist (0) */
  wirkt: 1 | -1 | 0;
  /** In wie vielen Provinzen das Problem akut ist (nur bei Problemen) */
  akutIn: number;
  text: string;
}

/** Worauf die Gruppe achtet: Größen und Probleme mit direkter Verbindung zu ihrer Stimmung. */
export function sorgen(world: World, id: string, n = 8): Sorge[] {
  const out: Sorge[] = [];
  for (const e of EIN.get(id) ?? []) {
    const von = knoten(e.from);
    if (von.kind === "massnahme") continue;
    const abw = abweichungVom(world, e.from);
    const i = NET.index.get(e.from)!;
    let akut = 0;
    if (von.kind === "problem" && von.threshold) for (let p = 0; p < PROVINCES; p++) if (world.net.values[i * PROVINCES + p]! >= von.threshold) akut++;
    out.push({
      id: e.from,
      name: von.name,
      art: von.kind,
      vorzeichen: e.weight >= 0 ? 1 : -1,
      gewicht: Math.abs(e.weight),
      wert: nationalAverage(NET, world.net, e.from),
      seitStart: abw,
      wirkt: Math.abs(e.weight * abw) < 0.01 ? 0 : e.weight * abw > 0 ? 1 : -1,
      akutIn: akut,
      text: e.why,
    });
  }
  return out.sort((a, b) => b.gewicht - a.gewicht).slice(0, n);
}

// ---------------------------------------------------------------------------
// Wählerwanderung

export interface Wanderungsziel {
  partei: string;
  name: string;
  ausrichtung?: string;
  /** Wie sehr das, was die Partei fordert, die Gruppe zufriedener machte (Punkte je 20 Stufen), gemittelt */
  naehe: number;
  imLager: boolean;
  /** Wofür die Partei einsteht, soweit es die Gruppe betrifft */
  passt: string[];
}

export interface Wanderung {
  /** Anteil der Gruppe, der bei dieser Stimmung eher die Seite wechselte (Spielparameter) */
  neigung: number;
  ziele: Wanderungsziel[];
}

/** Wechselneigung: unter 50 Punkten wächst sie; bei 10 wechselt praktisch jeder. Spielparameter, keine Messung. */
export function wechselNeigung(laune: number): number {
  return Math.max(0, Math.min(1, (SCHWELLE_TRAEGER - laune) / 48));
}

/**
 * Wohin die Gruppe wechseln würde, wenn sie es täte: zu den Parteien, deren Forderungen sie am meisten zufriedener machen.
 * Die Nähe ergibt sich aus den Forderungen der Fraktionen (Spielparameter) und den Hebeln der Gruppe im Netz.
 */
export function wanderung(world: World, id: string): Wanderung {
  const laune = nationalAverage(NET, world.net, id);
  const eigene = world.player?.partei.kurz;
  const lager = new Set(world.spiel?.lager ?? []);
  const parteien = Object.keys(world.parliament?.seats ?? {}).filter((p) => p !== eigene);
  const ziele: Wanderungsziel[] = [];
  for (const p of parteien) {
    const forderungen = FORDERUNGEN[p] ?? [];
    if (!forderungen.length) continue;
    const werte = forderungen.map((f) => ({ f, w: gleichgewicht(f.massnahme, 20).get(id) ?? 0 }));
    const naehe = werte.reduce((s, x) => s + x.w, 0) / werte.length;
    ziele.push({
      partei: p,
      name: PARTEI_NAME[p] ?? p,
      naehe,
      imLager: lager.has(p),
      passt: werte.filter((x) => x.w >= 0.3).sort((a, b) => b.w - a.w).slice(0, 2).map((x) => x.f.text),
    });
  }
  ziele.sort((a, b) => b.naehe - a.naehe);
  return { neigung: wechselNeigung(laune), ziele: ziele.slice(0, 4) };
}

export interface Abwanderung {
  /** Anteil aller Wähler, die bei den heutigen Stimmungen eher die Seite wechselten (Spielparameter, gewichtet nach Gruppengröße) */
  anteil: number;
  ziele: { partei: string; name: string; imLager: boolean; /** Anteil der Abwanderer, 0 bis 1 */ anteil: number; herkunft: string[] }[];
}

/** Wohin die Wähler insgesamt abwandern würden: alle Gruppen zusammen, nach Wechselneigung und Nähe der Parteien. */
export function abwanderung(world: World): Abwanderung {
  let gesamt = 0;
  const partei = new Map<string, { name: string; imLager: boolean; punkte: number; herkunft: Map<string, number> }>();
  for (const g of GRUPPEN) {
    const anteil = g.gewicht / GRUPPEN_SUMME;
    const w = wanderung(world, g.id);
    const abw = anteil * w.neigung;
    gesamt += abw;
    const positiv = w.ziele.filter((z) => z.naehe > 0.1);
    const summe = positiv.reduce((s, z) => s + z.naehe, 0);
    if (summe <= 0 || abw <= 0) continue;
    for (const z of positiv) {
      const e = partei.get(z.partei) ?? { name: z.name, imLager: z.imLager, punkte: 0, herkunft: new Map() };
      const teil = (abw * z.naehe) / summe;
      e.punkte += teil;
      e.herkunft.set(knoten(g.id).name, (e.herkunft.get(knoten(g.id).name) ?? 0) + teil);
      partei.set(z.partei, e);
    }
  }
  const verteilt = [...partei.values()].reduce((s, e) => s + e.punkte, 0) || 1;
  const ziele = [...partei.entries()]
    .map(([p, e]) => ({
      partei: p,
      name: e.name,
      imLager: e.imLager,
      anteil: e.punkte / verteilt,
      herkunft: [...e.herkunft.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n]) => n),
    }))
    .sort((a, b) => b.anteil - a.anteil)
    .slice(0, 4);
  return { anteil: gesamt, ziele };
}

// ---------------------------------------------------------------------------
// Regionen

export interface RegionStimmung {
  region: string;
  name: string;
  laune: number;
  /** Abstand zum Landesdurchschnitt */
  abstand: number;
}

export interface Regionen {
  regionen: RegionStimmung[];
  /** Größter Unterschied zwischen zwei Provinzen */
  spanne: number;
  schlechteste: { plaka: number; name: string; laune: number } | null;
  beste: { plaka: number; name: string; laune: number } | null;
}

export function regionen(world: World, id: string): Regionen {
  const i = NET.index.get(id)!;
  const land = nationalAverage(NET, world.net, id);
  const summe = new Map<string, { s: number; w: number }>();
  let min = { plaka: 0, laune: Infinity };
  let max = { plaka: 0, laune: -Infinity };
  for (const p of PROVINZEN) {
    const v = world.net.values[i * PROVINCES + p.plaka - 1]!;
    const wgt = world.net.weights[p.plaka - 1]!;
    const e = summe.get(p.region) ?? { s: 0, w: 0 };
    e.s += v * wgt;
    e.w += wgt;
    summe.set(p.region, e);
    if (v < min.laune) min = { plaka: p.plaka, laune: v };
    if (v > max.laune) max = { plaka: p.plaka, laune: v };
  }
  const liste = [...summe.entries()]
    .map(([region, e]) => ({ region, name: REGION_DE[region] ?? region, laune: e.s / e.w, abstand: e.s / e.w - land }))
    .sort((a, b) => a.laune - b.laune);
  return {
    regionen: liste,
    spanne: max.laune - min.laune,
    schlechteste: min.plaka ? { plaka: min.plaka, name: provinzName(min.plaka), laune: min.laune } : null,
    beste: max.plaka ? { plaka: max.plaka, name: provinzName(max.plaka), laune: max.laune } : null,
  };
}

// ---------------------------------------------------------------------------
// Koalition

export interface GruppeKurz {
  id: string;
  name: string;
  anteil: number;
  laune: number;
  trend: number | null;
  /** Wohin die Stimmung bei heutigen Verhältnissen strebt */
  ziel: number;
  rolle: Rolle;
  /** Punkte der Zustimmung gegenüber neutral (50) */
  beitrag: number;
  /** Punkte der Zustimmung, die es brächte, die Gruppe auf die Trägerschwelle zu holen (0, wenn sie schon trägt) */
  potenzial: number;
}

export interface Koalition {
  gruppen: GruppeKurz[];
  /** Anteile am Gewicht aller Gruppen, jeweils 0 bis 1 */
  traeger: number;
  schwankend: number;
  gegner: number;
  zustimmung: number;
  /** Wohin die Umfrage bei heutigen Verhältnissen strebt */
  zielZustimmung: number;
  /** Die gewinnbarste Gruppe: größtes Potenzial bei schwankender Stimmung */
  gewinnbar: GruppeKurz | null;
  /** Die Gruppe, die am schnellsten wegbricht */
  gefaehrdet: GruppeKurz | null;
}

export function koalition(world: World): Koalition {
  const gruppen: GruppeKurz[] = GRUPPEN.map((g) => {
    const laune = nationalAverage(NET, world.net, g.id);
    const frueher = vorMonaten(world, g.id, 3);
    const anteil = g.gewicht / GRUPPEN_SUMME;
    return {
      id: g.id,
      name: knoten(g.id).name,
      anteil,
      laune,
      trend: frueher === null ? null : laune - frueher,
      ziel: tendenz(world, g.id).ziel,
      rolle: rolleVon(laune),
      beitrag: ZUSTIMMUNG_JE_GRUPPEN_PUNKT * anteil * (laune - 50),
      potenzial: Math.max(0, ZUSTIMMUNG_JE_GRUPPEN_PUNKT * anteil * (SCHWELLE_TRAEGER - laune)),
    };
  }).sort((a, b) => b.anteil - a.anteil);
  const teil = (r: Rolle) => gruppen.filter((g) => g.rolle === r).reduce((s, g) => s + g.anteil, 0);
  const gewinnbar = gruppen.filter((g) => g.rolle !== "traeger" && g.ziel >= g.laune - 1).sort((a, b) => b.potenzial - a.potenzial)[0] ?? null;
  const gefaehrdet = [...gruppen].filter((g) => g.ziel < g.laune - 1 && g.rolle !== "gegner").sort((a, b) => a.ziel - a.laune - (b.ziel - b.laune))[0] ?? null;
  return {
    gruppen,
    traeger: teil("traeger"),
    schwankend: teil("schwankend"),
    gegner: teil("gegner"),
    zustimmung: world.spiel!.umfrage.zustimmung,
    zielZustimmung: zielZustimmung(world),
    gewinnbar,
    gefaehrdet,
  };
}

// ---------------------------------------------------------------------------
// Was würde helfen

export interface Nebenwirkung {
  id: string;
  name: string;
  /** Verschiebung der Stimmung dieser Gruppe in Punkten */
  punkte: number;
}

export interface Hilfe {
  massnahme: string;
  name: string;
  richtung: 1 | -1;
  von: number;
  auf: number;
  /** Bis wann gerechnet wird: Monate bis zur Wahl (mindestens 6) */
  horizont: number;
  /** Verschiebung der Stimmung der gewählten Gruppe nach einem Jahr, bis zur Wahl und langfristig */
  nach12: number;
  gewinn: number;
  langfristig: number;
  /** Verschiebung der Zustimmung insgesamt bis zur Wahl in Punkten (Näherung aus den Gruppen und dem Vertrauen) */
  zustimmung: number;
  gewinner: Nebenwirkung[];
  verlierer: Nebenwirkung[];
  /** Bei Schritten für die Zustimmung insgesamt: die Gruppe, die am meisten gewinnt */
  hauptgruppe?: Nebenwirkung;
  /** Kosten als Gesetz in Politischem Kapital */
  pk: number;
  kostenBip: number;
  monate: number;
  /** Ob das Einbringen jetzt möglich ist; sonst der Grund */
  moeglich: boolean;
  grund?: string;
  /** Ob dem Lager die Mehrheit fehlt */
  mehrheitFehlt: boolean;
}

/** Monate bis zur nächsten Wahl, auf 6 bis 60 begrenzt. */
export function horizontBisWahl(world: World): number {
  const monate = Math.round(((world.spiel?.wahltag ?? world.day + 1200) - world.day) / 30.4);
  return Math.max(6, Math.min(60, monate));
}

/**
 * Maßnahmen, die der Gruppe am meisten bringen, mit den Nebenwirkungen auf die anderen Gruppen, den Kosten und einer Vorschau bis zur Wahl.
 * Der Sprung ist eine spürbare Stufe (20 Punkte), damit die Zahlen vergleichbar bleiben. Ohne Rückwirkungen über die Wirtschaft gerechnet.
 */
export function hilfen(world: World, id: string, n = 4, sprung = 20): Hilfe[] {
  const horizont = horizontBisWahl(world);
  const out: Hilfe[] = [];
  for (const h of hebel(id, 1, 30)) {
    const von = nationalAverage(NET, world.net, h.node.id);
    const auf = Math.max(0, Math.min(100, Math.round(von + h.richtung * sprung)));
    if (Math.abs(auf - von) < 5) continue;
    const pr = pruefeVorhaben(world, h.node.id, auf);
    const spaet = wirkungNach(h.node.id, auf - von, [12, horizont], pr.monate);
    const bisWahl = spaet.get(horizont)!;
    const gewinn = bisWahl.get(id) ?? 0;
    if (gewinn < 0.3) continue;
    const lang = gleichgewicht(h.node.id, auf - von);
    const alle: Nebenwirkung[] = GRUPPEN.map((g) => ({ id: g.id, name: knoten(g.id).name, punkte: bisWahl.get(g.id) ?? 0 }));
    const zustimmung = zustimmungAus(bisWahl);
    out.push({
      massnahme: h.node.id,
      name: h.node.name,
      richtung: h.richtung,
      von,
      auf,
      horizont,
      nach12: spaet.get(12)!.get(id) ?? 0,
      gewinn,
      langfristig: lang.get(id) ?? 0,
      zustimmung,
      gewinner: alle.filter((x) => x.id !== id && x.punkte >= 0.4).sort((a, b) => b.punkte - a.punkte).slice(0, 3),
      verlierer: alle.filter((x) => x.punkte <= -0.4).sort((a, b) => a.punkte - b.punkte).slice(0, 3),
      pk: pr.gesetz.pk,
      kostenBip: pr.kostenBip,
      monate: pr.monate,
      moeglich: pr.ok,
      ...(pr.grund ? { grund: pr.grund } : {}),
      mehrheitFehlt: pr.gesetz.stimmen.luecke > 0,
    });
  }
  return out.sort((a, b) => b.gewinn - a.gewinn).slice(0, n);
}

/** Die Zustimmung in Punkten aus den Verschiebungen der Gruppen und des Vertrauens (Näherung nach `zustimmungsTeile`). */
export function zustimmungAus(verschiebung: Map<string, number>): number {
  return (
    ZUSTIMMUNG_JE_GRUPPEN_PUNKT * GRUPPEN.reduce((sum, g) => sum + (g.gewicht / GRUPPEN_SUMME) * (verschiebung.get(g.id) ?? 0), 0) +
    ZUSTIMMUNG_JE_VERTRAUENS_PUNKT * (verschiebung.get("vertrauen_regierung") ?? 0)
  );
}

/**
 * Die wirksamsten einzelnen Schritte für die Zustimmung insgesamt bis zur Wahl: Jede Maßnahme, rauf oder runter, wird durchgerechnet.
 * Wie bei `hilfen` ohne Rückwirkungen über die Wirtschaft; Nebenwirkungen auf die Gruppen stehen dabei.
 */
export function schritteFuerZustimmung(world: World, n = 3, sprung = 20): Hilfe[] {
  const horizont = horizontBisWahl(world);
  const kandidaten: { id: string; auf: number; von: number; z: number }[] = [];
  for (const node of NET.nodes) {
    if (node.kind !== "massnahme") continue;
    const von = nationalAverage(NET, world.net, node.id);
    for (const r of [1, -1] as const) {
      const auf = Math.max(0, Math.min(100, Math.round(von + r * sprung)));
      if (Math.abs(auf - von) < 5) continue;
      const bisWahl = wirkungNach(node.id, auf - von, [horizont], node.months ?? 1).get(horizont)!;
      const z = zustimmungAus(bisWahl);
      if (z >= 0.15) kandidaten.push({ id: node.id, auf, von, z });
    }
  }
  kandidaten.sort((a, b) => b.z - a.z);
  const out: Hilfe[] = [];
  for (const k of kandidaten.slice(0, n * 4)) {
    const pr = pruefeVorhaben(world, k.id, k.auf);
    if (!pr.ok) continue;
    const spaet = wirkungNach(k.id, k.auf - k.von, [12, horizont], pr.monate);
    const bisWahl = spaet.get(horizont)!;
    const lang = gleichgewicht(k.id, k.auf - k.von);
    const alle: Nebenwirkung[] = GRUPPEN.map((g) => ({ id: g.id, name: knoten(g.id).name, punkte: bisWahl.get(g.id) ?? 0 }));
    const haupt = [...alle].sort((a, b) => b.punkte - a.punkte)[0];
    out.push({
      massnahme: k.id,
      name: knoten(k.id).name,
      richtung: k.auf > k.von ? 1 : -1,
      von: k.von,
      auf: k.auf,
      horizont,
      nach12: zustimmungAus(spaet.get(12)!),
      gewinn: zustimmungAus(bisWahl),
      langfristig: zustimmungAus(lang),
      zustimmung: zustimmungAus(bisWahl),
      gewinner: alle.filter((x) => x.punkte >= 0.4).sort((a, b) => b.punkte - a.punkte).slice(0, 3),
      verlierer: alle.filter((x) => x.punkte <= -0.4).sort((a, b) => a.punkte - b.punkte).slice(0, 3),
      ...(haupt && haupt.punkte >= 0.4 ? { hauptgruppe: haupt } : {}),
      pk: pr.gesetz.pk,
      kostenBip: pr.kostenBip,
      monate: pr.monate,
      moeglich: pr.ok,
      mehrheitFehlt: pr.gesetz.stimmen.luecke > 0,
    });
    if (out.length >= n) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Anknüpfungspunkte: Was liegt schon auf dem Tisch, das diese Gruppe betrifft?

export interface Handlungen {
  /** Offene Zusagen, deren Maßnahme der Gruppe wichtig ist */
  zusagen: { id: string; von: string; text: string; faellig: number; massnahme: string; richtung: number }[];
  /** Offene Ereignisse, die mit einer Maßnahme geregelt werden können, an der die Gruppe hängt */
  ereignisse: { id: string; titel: string; massnahme: string }[];
  /** Wirkungsberichte zu Beschlüssen, die die Gruppe berühren */
  berichte: { datum: string; titel: string; urteil: string; text: string; massnahme: string }[];
}

/** Maßnahmen, die die Stimmung der Gruppe bewegen (direkt oder über eine Zwischengröße), egal in welche Richtung. */
function wichtigeMassnahmen(id: string): Set<string> {
  return new Set(hebel(id, 1, 60).map((h) => h.node.id));
}

export function handlungen(world: World, id: string): Handlungen {
  const wichtig = wichtigeMassnahmen(id);
  const spiel = world.spiel!;
  const zusagen = spiel.zusagen
    .filter((z) => !z.erfuellt && !z.gebrochen && z.massnahme && wichtig.has(z.massnahme))
    .map((z) => ({ id: z.id, von: z.von, text: z.text, faellig: z.faellig, massnahme: z.massnahme!, richtung: z.richtung ?? 1 }));
  const ereignisse: Handlungen["ereignisse"] = [];
  for (const ev of spiel.ereignisse) {
    if (ev.vorlage.startsWith("start_")) continue;
    let v;
    try {
      v = vorlage(ev.vorlage);
    } catch {
      continue;
    }
    const m = (v.massnahmen ?? []).find((x) => wichtig.has(x));
    if (m) ereignisse.push({ id: ev.id, titel: v.titel(world, ev), massnahme: m });
  }
  const berichte = (spiel.berichte ?? [])
    .filter((b) => wichtig.has(b.massnahme))
    .slice(-3)
    .reverse()
    .map((b) => ({ datum: b.datum, titel: b.titel, urteil: b.urteil, text: b.zeilen[0] ?? b.hinweis, massnahme: b.massnahme }));
  return { zusagen, ereignisse, berichte };
}

/** Alles zu einer Gruppe auf einmal, für die Oberfläche. */
export function gruppenDetail(world: World, id: string) {
  const kurz = koalition(world).gruppen.find((g) => g.id === id)!;
  return {
    kurz,
    wort: launenWort(kurz.laune),
    absicht: absichtWort(kurz.laune),
    treiber: treiber(world, id, 3),
    kette: kette(world, id),
    tendenz: tendenz(world, id),
    praeferenzen: praeferenzen(world, id),
    sorgen: sorgen(world, id),
    wanderung: wanderung(world, id),
    verlauf: verlaufVon(world, id),
    regionen: regionen(world, id),
    hilfen: hilfen(world, id),
    handlungen: handlungen(world, id),
  };
}
