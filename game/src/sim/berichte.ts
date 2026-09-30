// Wirkungsberichte: Sechs und zwölf Monate nach einem Beschluss zeigt das Spiel, was sich getan hat. Ein Gesetz ist keine Wirkung;
// die Berichte machen sichtbar, ob es gewirkt hat, wo, und ob es Nebenwirkungen gab. Die Zahlen zeigen die Veränderung insgesamt,
// nicht nur die dieser einen Maßnahme: Im Politiknetz wirkt vieles zugleich.

import { NET } from "./modell";
import { PROVINCES, nationalAverage } from "./netz";
import { addLog } from "./log";
import type { World } from "./types";

export interface Beobachtung {
  id: string;
  name: string;
  tag: number;
  von: number;
  auf: number;
  ort: number[] | null;
  /** Landesdurchschnitt der Zielgrößen zum Zeitpunkt des Beschlusses */
  werte: Record<string, number>;
  /** Anzahl der Provinzen mit akutem Problem zum Zeitpunkt des Beschlusses */
  akut: Record<string, number>;
  /** Welche Berichte schon erschienen sind (Monate) */
  berichtet: number[];
}

export interface Bericht {
  tag: number;
  datum: string;
  massnahme: string;
  titel: string;
  monate: number;
  urteil: "gut" | "schwach" | "keine" | "gemischt";
  zeilen: string[];
  hinweis: string;
}

const REGEL = { schwelle: 8, berichteNachMonaten: [6, 12] };

function zielGroessen(id: string): { id: string; erwartung: 1 | -1 }[] {
  return NET.edges
    .filter((e) => e.from === id)
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 4)
    .map((e) => ({ id: e.to, erwartung: (e.weight >= 0 ? 1 : -1) as 1 | -1 }));
}

function problemeUm(id: string): string[] {
  const nah = new Set<string>();
  for (const e of NET.edges) if (e.from === id) nah.add(e.to);
  for (const e of NET.edges) if (nah.has(e.from)) nah.add(e.to);
  return [...nah].filter((n) => NET.nodes[NET.index.get(n)!]!.kind === "problem");
}

function akutZahl(world: World, id: string): number {
  const node = NET.nodes[NET.index.get(id)!]!;
  const i = NET.index.get(id)!;
  let n = 0;
  for (let p = 0; p < PROVINCES; p++) if (node.threshold && world.net.values[i * PROVINCES + p]! >= node.threshold) n++;
  return n;
}

/** Nach einem Beschluss festhalten, wie die Lage vorher war. */
export function beobachte(world: World, id: string, von: number, auf: number, ort: number[] | null): void {
  const spiel = world.spiel;
  if (!spiel || Math.abs(auf - von) < REGEL.schwelle) return;
  const node = NET.nodes[NET.index.get(id)!];
  if (!node || node.kind !== "massnahme") return;
  const werte: Record<string, number> = {};
  for (const z of zielGroessen(id)) if (!NET.nodes[NET.index.get(z.id)!]!.input) werte[z.id] = nationalAverage(NET, world.net, z.id);
  const akut: Record<string, number> = {};
  for (const p of problemeUm(id)) akut[p] = akutZahl(world, p);
  (spiel.beobachtungen ??= []).push({ id, name: node.name, tag: world.day, von, auf, ort, werte, akut, berichtet: [] });
  if (spiel.beobachtungen.length > 60) spiel.beobachtungen.shift();
}

const nf = (x: number) => x.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function bericht(world: World, b: Beobachtung, monate: number): Bericht {
  const node = NET.nodes[NET.index.get(b.id)!]!;
  const zeilen: string[] = [];
  let passt = 0;
  let gegen = 0;
  let bewegt = 0;
  const ziele = zielGroessen(b.id);
  for (const z of ziele) {
    if (b.werte[z.id] === undefined) continue;
    const n = NET.nodes[NET.index.get(z.id)!]!;
    const jetzt = nationalAverage(NET, world.net, z.id);
    const d = jetzt - b.werte[z.id]!;
    const erwartet = z.erwartung * (b.auf > b.von ? 1 : -1);
    zeilen.push(`${n.name}: ${nf(b.werte[z.id]!)} auf ${nf(jetzt)} (${d >= 0 ? "+" : "−"}${nf(Math.abs(d))})`);
    if (Math.abs(d) >= 0.8) {
      bewegt++;
      if (d * erwartet > 0) passt++;
      else if (Math.abs(d) >= 1.5) gegen++;
    }
  }
  for (const [pid, vorher] of Object.entries(b.akut)) {
    const jetzt = akutZahl(world, pid);
    if (jetzt === vorher && vorher === 0) continue;
    const n = NET.nodes[NET.index.get(pid)!]!;
    zeilen.push(`${n.name}: akut in ${vorher} auf ${jetzt} Provinzen`);
    if (jetzt < vorher) passt++;
    else if (jetzt > vorher + 1) gegen++;
  }
  const rest = Math.max(0, (node.months ?? 1) - monate);
  const urteil: Bericht["urteil"] = passt >= 1 && gegen === 0 ? "gut" : passt >= 1 && gegen >= 1 ? "gemischt" : bewegt === 0 ? "schwach" : "keine";
  const orte = b.ort ? ` (nur in ${b.ort.length} ${b.ort.length === 1 ? "Provinz" : "Provinzen"})` : "";
  return {
    tag: world.day,
    datum: world.date,
    massnahme: b.id,
    titel: `${b.name}${orte}: Stufe ${Math.round(b.von)} auf ${Math.round(b.auf)}, ${monate} Monate danach`,
    monate,
    urteil,
    zeilen,
    hinweis:
      (rest > 0 ? `Die volle Wirkung braucht noch etwa ${rest} ${rest === 1 ? "Monat" : "Monate"}. ` : "") +
      (urteil === "gut" ? "Es wirkt in die gewünschte Richtung." : urteil === "gemischt" ? "Es wirkt, aber anderes hat sich verschlechtert; ob es an dieser Maßnahme liegt, zeigt das Politiknetz." : urteil === "schwach" ? "Bisher ist kaum etwas zu sehen." : "Die Zahlen bewegen sich nicht in die gewünschte Richtung.") +
      " Die Zahlen zeigen die Veränderung insgesamt, nicht nur die dieser Maßnahme.",
  };
}

/** Täglich: Fällige Berichte schreiben. */
export function berichteTag(world: World): void {
  const spiel = world.spiel;
  if (!spiel?.beobachtungen) return;
  for (const b of spiel.beobachtungen) {
    for (const m of REGEL.berichteNachMonaten) {
      if (b.berichtet.includes(m) || world.day - b.tag < m * 30) continue;
      b.berichtet.push(m);
      const r = bericht(world, b, m);
      (spiel.berichte ??= []).push(r);
      if (spiel.berichte.length > 80) spiel.berichte.shift();
      spiel.chronik.push({ tag: world.day, datum: world.date, titel: `Wirkungsbericht: ${b.name}`, ausgang: `${r.zeilen.slice(0, 2).join("; ")}. ${r.urteil === "gut" ? "Es wirkt." : r.urteil === "schwach" ? "Bisher kaum Wirkung." : r.urteil === "gemischt" ? "Gemischte Bilanz." : "Keine Wirkung in die gewünschte Richtung."}` });
      addLog(world, "ereignis", `Wirkungsbericht: ${b.name}, ${m} Monate danach`, r.zeilen.join("; ") + ". " + r.hinweis);
    }
  }
}
