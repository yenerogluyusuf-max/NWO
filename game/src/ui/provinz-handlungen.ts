// Was in einer Provinz fehlt (Welle 1, E5; karte.md Befund 1 und Schritt K3): Der Knopf der Provinzkarte öffnete immer den
// Autobahnbau, gleich was dort fehlte. Jetzt sucht er in dieser Reihenfolge:
//   1. das akuteste Problem der Provinz (größter Abstand über seiner Schwelle) und die Maßnahme, die es im Politiknetz am stärksten
//      senkt (direkt oder über eine Zwischengröße, Gewichte der Kanten);
//   2. das am stärksten überlastete Netz der Provinz mit einem Ausbau (Land › Netze);
//   3. den schwächsten Wert der „Lage im Spiel“ gegenüber dem Landesmittel und die Maßnahme, die ihn am stärksten hebt.
// Reine Logik ohne Oberfläche, damit sie sich ohne Browser prüfen lässt. Keine eigenen Zahlen: Schwellen, Auslastung und Gewichte
// kommen aus dem Politiknetz und aus sim/infrastruktur.ts.

import { NET } from "../sim/world";
import { nationalAverage, PROVINCES } from "../sim/netz";
import { auslastung, AUSBAUTEN, NETZE, type NetzId } from "../sim/infrastruktur";
import { SCHWELLE } from "../data/infrastruktur-netze";
import { stufeIn } from "../sim/handeln";
import type { Theme } from "../data/politiknetz";
import type { World } from "../sim/types";

/** Die Werte der Provinzkarte unter „Lage im Spiel“ (ui/ProvinceCard.tsx); höher ist besser. */
export const LAGE_WERTE = ["verkehrsnetz", "gesundheitsversorgung", "wasserversorgung", "stromversorgung", "internet"] as const;

export type ProvinzBedarf =
  | { art: "problem"; problem: string; massnahme: string; theme: Theme; richtung: 1 | -1; wert: number; schwelle: number }
  | { art: "netz"; netz: NetzId; a: number }
  | { art: "lage"; knoten: string; massnahme: string; theme: Theme; richtung: 1 | -1; wert: number; land: number };

const wertIn = (w: World, id: string, plaka: number): number => w.net.values[NET.index.get(id)! * PROVINCES + plaka - 1]!;
const knoten = (id: string) => NET.nodes[NET.index.get(id)!]!;

/**
 * Die Maßnahme, die `ziel` am stärksten bewegt: Summe der Kantengewichte direkt und über eine Zwischengröße (Produkt der Gewichte).
 * `richtung` −1 heißt „senken“ (Problem), +1 „heben“ (Lage). Liefert, ob die Maßnahme dafür steigen (+1) oder fallen (−1) muss.
 */
export function besteMassnahme(ziel: string, richtung: 1 | -1): { id: string; richtung: 1 | -1 } | null {
  const wirkung = new Map<string, number>();
  for (const e of NET.edges) {
    if (knoten(e.from).kind !== "massnahme") continue;
    if (e.to === ziel) wirkung.set(e.from, (wirkung.get(e.from) ?? 0) + e.weight);
  }
  for (const zw of NET.edges) {
    if (zw.to !== ziel || knoten(zw.from).kind === "massnahme") continue;
    for (const e of NET.edges) {
      if (e.to !== zw.from || knoten(e.from).kind !== "massnahme") continue;
      wirkung.set(e.from, (wirkung.get(e.from) ?? 0) + e.weight * zw.weight);
    }
  }
  let best: { id: string; staerke: number; richtung: 1 | -1 } | null = null;
  for (const [id, x] of wirkung) {
    if (Math.abs(x) < 1e-9) continue;
    // Gewünschte Bewegung des Ziels geteilt durch das Vorzeichen der Wirkung: in diese Richtung muss die Maßnahme
    const r = (Math.sign(x) === richtung ? 1 : -1) as 1 | -1;
    // Bei gleicher Stärke zählt die Maßnahme, die steigen soll (Ausbau statt Kürzung), dann die Kennung
    if (!best || Math.abs(x) > best.staerke + 1e-12 || (Math.abs(Math.abs(x) - best.staerke) <= 1e-12 && r > best.richtung)) best = { id, staerke: Math.abs(x), richtung: r };
  }
  return best ? { id: best.id, richtung: best.richtung } : null;
}

/** Das akuteste Problem der Provinz: größter Abstand über der Schwelle, gemessen am Weg bis 100 (wie die Stadtbanner). */
function akutestesProblem(w: World, plaka: number): { id: string; wert: number; schwelle: number } | null {
  let best: { id: string; wert: number; schwelle: number; e: number } | null = null;
  for (const n of NET.nodes) {
    if (n.kind !== "problem" || !n.threshold) continue;
    const v = wertIn(w, n.id, plaka);
    if (v < n.threshold) continue;
    const e = (v - n.threshold) / Math.max(1, 100 - n.threshold);
    if (!best || e > best.e) best = { id: n.id, wert: v, schwelle: n.threshold, e };
  }
  return best ? { id: best.id, wert: best.wert, schwelle: best.schwelle } : null;
}

/** Das am stärksten überlastete Netz der Provinz, für das es einen Ausbau gibt (ab „überlastet“, SCHWELLE.ueberlast). */
function schlimmstesNetz(w: World, plaka: number): { netz: NetzId; a: number } | null {
  if (!w.spiel) return null;
  let best: { netz: NetzId; a: number } | null = null;
  for (const n of NETZE) {
    if (n.start.art === "land" || !AUSBAUTEN.some((a) => a.netz === n.id)) continue;
    const a = auslastung(w, n.id, plaka);
    if (a === null || a < SCHWELLE.ueberlast) continue;
    if (!best || a > best.a) best = { netz: n.id, a };
  }
  return best;
}

/** Was in der Provinz am meisten fehlt, mit dem Ort, an dem man es angeht. */
export function bedarfIn(w: World, plaka: number): ProvinzBedarf | null {
  const p = akutestesProblem(w, plaka);
  if (p) {
    const m = besteMassnahme(p.id, -1);
    if (m) return { art: "problem", problem: p.id, massnahme: m.id, theme: knoten(m.id).theme, richtung: m.richtung, wert: p.wert, schwelle: p.schwelle };
  }
  const netz = schlimmstesNetz(w, plaka);
  if (netz) return { art: "netz", ...netz };
  // Der schwächste Wert gegenüber dem Landesmittel
  let schwach: { id: string; wert: number; land: number; abstand: number } | null = null;
  for (const id of LAGE_WERTE) {
    const wert = wertIn(w, id, plaka);
    const land = nationalAverage(NET, w.net, id);
    if (!schwach || wert - land < schwach.abstand) schwach = { id, wert, land, abstand: wert - land };
  }
  if (!schwach) return null;
  const m = besteMassnahme(schwach.id, 1);
  if (!m) return null;
  return { art: "lage", knoten: schwach.id, massnahme: m.id, theme: knoten(m.id).theme, richtung: m.richtung, wert: schwach.wert, land: schwach.land };
}

/** Der Vorschlag für den Schieber der Maßnahme: dieselbe Regel wie die übrigen Sprünge (ui/Stage.tsx), 20 Stufen in die Richtung. */
export function vorschlagStufe(w: World, b: Extract<ProvinzBedarf, { massnahme: string }>, plaka: number): number {
  return Math.max(0, Math.min(100, Math.round(stufeIn(w, b.massnahme, [plaka])) + 20 * b.richtung));
}
