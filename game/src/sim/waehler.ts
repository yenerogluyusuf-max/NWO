// Die Wählerkoalition: Wer trägt den Präsidenten, wer ist verärgert, warum, und was wollen sie? Alles aus dem Politiknetz gerechnet:
// Laune und Trend der elf Gruppen, die Gründe aus ihren Verbindungen, ihre Forderungen aus den stärksten Hebeln.

import { NET } from "./modell";
import { PROVINCES, nationalAverage, startAverage } from "./netz";
import { hebel } from "./wege";
import { GRUPPEN, GRUPPEN_SUMME } from "./gruppen";
import { zielZustimmung, zustimmungsTeile } from "./spiel";
import { addDays } from "./dates";
import type { World } from "./types";

export interface Grund {
  name: string;
  /** +1 hebt die Stimmung, −1 drückt sie */
  richtung: 1 | -1;
  /** Die Begründung aus dem Politiknetz in einem Satz */
  text: string;
  /** Wie stark, nur zum Sortieren und Zeichnen */
  wert: number;
}

export interface Forderung {
  massnahme: string;
  name: string;
  /** +1 erhöhen, −1 senken */
  richtung: 1 | -1;
  stufe: number;
}

export interface GruppenLage {
  id: string;
  name: string;
  text: string;
  /** Anteil an der Zustimmung, 0 bis 1 */
  anteil: number;
  /** Zufriedenheit 0 bis 100, 50 ist neutral */
  laune: number;
  /** Veränderung gegenüber vor drei Monaten, falls bekannt */
  trend: number | null;
  wort: string;
  gruende: Grund[];
  /** Ob die Gründe Veränderungen seit dem Amtsantritt sind (sonst die wichtigsten Einflüsse) */
  veraendert: boolean;
  forderungen: Forderung[];
  /** Beitrag zur Zustimmung in Punkten gegenüber neutral (50) */
  beitrag: number;
}

export function launenWort(x: number): string {
  if (x >= 70) return "begeistert";
  if (x >= 58) return "zufrieden";
  if (x >= 45) return "gemischt";
  if (x >= 33) return "verärgert";
  return "wütend";
}

export function vorMonaten(world: World, id: string, n: number): number | null {
  const s = world.net;
  const i = NET.index.get(id);
  if (i === undefined || world.day < 30 * n) return null;
  const slot = s.history[(s.month - n + s.history.length * 1000) % s.history.length];
  if (!slot) return null;
  let sum = 0;
  let w = 0;
  for (let p = 0; p < PROVINCES; p++) {
    sum += slot[i * PROVINCES + p]! * s.weights[p]!;
    w += s.weights[p]!;
  }
  return w > 0 ? sum / w : null;
}

function abweichung(world: World, id: string): number {
  const node = NET.nodes[NET.index.get(id)!]!;
  const s0 = world.spiel?.start;
  if (node.input) {
    if (!s0) return 0;
    if (id === "inflation") return world.economy.inflation - s0.inflation;
    if (id === "arbeitslosigkeit") return world.economy.unemployment - s0.arbeitslosigkeit;
    if (id === "wachstum") return world.economy.growth - s0.wachstum;
    return 0;
  }
  return nationalAverage(NET, world.net, id) - startAverage(NET, world.net, id);
}

export function waehlerLage(world: World): GruppenLage[] {
  const lage: GruppenLage[] = [];
  for (const g of GRUPPEN) {
    const node = NET.nodes[NET.index.get(g.id)!]!;
    const laune = nationalAverage(NET, world.net, g.id);
    const frueher = vorMonaten(world, g.id, 3);
    // Gründe: Verbindungen in die Gruppe, gewichtet mit der Veränderung des Auslösers seit dem Amtsantritt
    const kanten = NET.edges.filter((e) => e.to === g.id);
    const mitWert = kanten.map((e) => ({ e, wert: e.weight * abweichung(world, e.from) }));
    const bewegt = mitWert.filter((m) => Math.abs(m.wert) > 0.02).sort((a, b) => Math.abs(b.wert) - Math.abs(a.wert));
    const veraendert = bewegt.length > 0;
    const quelle = veraendert ? bewegt : [...mitWert].sort((a, b) => Math.abs(b.e.weight) - Math.abs(a.e.weight)).map((m) => ({ ...m, wert: m.e.weight }));
    const gruende: Grund[] = quelle.slice(0, 4).map((m) => ({
      name: NET.nodes[NET.index.get(m.e.from)!]!.name,
      richtung: (m.wert >= 0 ? 1 : -1) as 1 | -1,
      text: m.e.why,
      wert: Math.abs(m.wert),
    }));
    // Forderungen: die Hebel, die diese Gruppe am stärksten zufriedener machen, soweit sie noch etwas bewirken
    const forderungen: Forderung[] = [];
    for (const h of hebel(g.id, 1, 10)) {
      const i = NET.index.get(h.node.id)!;
      const jetzt = nationalAverage(NET, world.net, h.node.id);
      if ((h.richtung > 0 && jetzt >= 92) || (h.richtung < 0 && jetzt <= 8)) continue;
      void i;
      forderungen.push({ massnahme: h.node.id, name: h.node.name, richtung: h.richtung, stufe: Math.round(jetzt) });
      if (forderungen.length >= 3) break;
    }
    const anteil = g.gewicht / GRUPPEN_SUMME;
    lage.push({
      id: g.id,
      name: node.name,
      text: node.text,
      anteil,
      laune,
      trend: frueher === null ? null : laune - frueher,
      wort: launenWort(laune),
      gruende,
      veraendert,
      forderungen,
      beitrag: 0.25 * anteil * (laune - 50),
    });
  }
  return lage.sort((a, b) => b.anteil - a.anteil);
}

export interface Bilanzposten {
  name: string;
  /** Punkte der Zustimmung seit dem Amtsantritt */
  delta: number;
  text: string;
}

function problemLastStart(world: World): number {
  let summe = 0;
  for (const node of NET.nodes) {
    if (node.kind !== "problem" || !node.threshold) continue;
    const i = NET.index.get(node.id)!;
    for (let p = 0; p < PROVINCES; p++) if (world.net.start[i * PROVINCES + p]! >= node.threshold) summe += world.net.weights[p]!;
  }
  return summe;
}

/** Woher die Zustimmung kommt: Was sich seit dem Amtsantritt bewegt hat, in Punkten. */
export function zustimmungsBilanz(world: World): { jetzt: number; tendenz: number; posten: Bilanzposten[]; wahlIn: number; wahlDatum: string } {
  const spiel = world.spiel!;
  const monate = world.day / 30.4;
  const t = zustimmungsTeile(world, monate);
  const vertrauen0 = startAverage(NET, world.net, "vertrauen_regierung");
  const gruppen0 = GRUPPEN.reduce((s, g) => s + g.gewicht * startAverage(NET, world.net, g.id), 0) / GRUPPEN_SUMME;
  const probleme0 = 4 * problemLastStart(world);
  const posten: Bilanzposten[] = [
    { name: "Vertrauen in die Regierung", delta: 0.45 * (t.vertrauen - vertrauen0), text: "Ob die Menschen der Regierung zutrauen, ihr Leben zu verbessern." },
    { name: "Stimmung der Wählergruppen", delta: 0.25 * (t.gruppen - gruppen0), text: "Der gewichtete Durchschnitt aller Gruppen." },
    { name: "Wirtschaftslage", delta: 0.3 * (t.wirtschaft - 50), text: "Inflation, Arbeitslosigkeit und Wachstum gegenüber dem Amtsantritt." },
    { name: "Akute Probleme", delta: -(t.probleme - probleme0), text: "Je mehr Menschen in Provinzen mit akutem Problem leben, desto mehr kostet es." },
    { name: "Regierungsmüdigkeit", delta: -t.muedigkeit, text: "Jeden Monat im Amt verliert eine Regierung etwas an Glanz." },
  ];
  return {
    jetzt: spiel.umfrage.zustimmung,
    tendenz: zielZustimmung(world),
    posten,
    wahlIn: Math.round((spiel.wahltag - world.day) / 30.4),
    wahlDatum: addDays(world.date, spiel.wahltag - world.day),
  };
}
