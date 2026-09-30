// Der Verlauf der Wählerstimmung: Jede Gruppe und die Zustimmung, Monat für Monat, damit die Oberfläche zeigen kann,
// wie sich Entscheidungen ausgewirkt haben. Bewusst ohne Abhängigkeit von der Spielschleife (wird von ihr aufgerufen).

import { NET } from "./modell";
import { PROVINCES, nationalAverage } from "./netz";
import { GRUPPEN } from "./gruppen";
import type { World } from "./types";

export interface WaehlerVerlauf {
  /** Monat je Eintrag als „JJJJ-MM“ */
  monate: string[];
  /** Stimmung je Gruppe, gleichlang wie `monate` (später hinzugekommene Gruppen beginnen mit null) */
  laune: Record<string, (number | null)[]>;
  zustimmung: (number | null)[];
}

const VERLAUF_MAX = 72;

/** Wert eines Knotens im Landesdurchschnitt vor n Monaten, aus dem Gedächtnis des Netzes (13 Monate). */
function frueherWert(world: World, id: string, n: number): number | null {
  const s = world.net;
  const i = NET.index.get(id);
  if (i === undefined || s.month < n) return null;
  const slot = s.history[(s.month - n + s.history.length * 1000) % s.history.length];
  if (!slot) return null;
  let sum = 0;
  for (let p = 0; p < PROVINCES; p++) sum += slot[i * PROVINCES + p]! * s.weights[p]!;
  return Number.isFinite(sum) ? sum : null;
}

function monatVor(datum: string, n: number): string {
  const [j, m] = datum.split("-").map(Number) as [number, number];
  const idx = j * 12 + (m - 1) - n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

/** Legt den Verlauf an und füllt ihn aus dem Gedächtnis des Netzes, falls er fehlt (ältere Spielstände). */
export function verlaufSichern(world: World): WaehlerVerlauf {
  const spiel = world.spiel!;
  if (spiel.waehler && spiel.waehler.monate.length) return spiel.waehler;
  const v: WaehlerVerlauf = { monate: [], laune: {}, zustimmung: [] };
  spiel.waehler = v;
  const heute = world.date.slice(0, 7);
  for (let n = Math.min(12, world.net.month); n >= 1; n--) {
    const monat = monatVor(heute, n);
    v.monate.push(monat);
    for (const g of GRUPPEN) (v.laune[g.id] ??= []).push(frueherWert(world, g.id, n));
    const eintrag = spiel.umfrage.verlauf.find((u) => u.monat === monat);
    v.zustimmung.push(eintrag ? eintrag.wert : null);
  }
  return v;
}

/** Einmal im Monat: Stimmung aller Gruppen und die Zustimmung festhalten. */
export function verlaufAufzeichnen(world: World): void {
  const spiel = world.spiel;
  if (!spiel) return;
  const v = verlaufSichern(world);
  const monat = world.date.slice(0, 7);
  if (v.monate[v.monate.length - 1] === monat) return;
  v.monate.push(monat);
  for (const g of GRUPPEN) {
    const reihe = (v.laune[g.id] ??= []);
    while (reihe.length < v.monate.length - 1) reihe.unshift(null);
    reihe.push(nationalAverage(NET, world.net, g.id));
  }
  v.zustimmung.push(spiel.umfrage.zustimmung);
  while (v.monate.length > VERLAUF_MAX) {
    v.monate.shift();
    v.zustimmung.shift();
    for (const g of GRUPPEN) v.laune[g.id]?.shift();
  }
}

export interface Reihe {
  monate: string[];
  werte: (number | null)[];
}

function mitHeute(monate: string[], werte: (number | null)[], monat: string, jetzt: number): Reihe {
  const m = [...monate];
  const w = [...werte];
  while (w.length < m.length) w.unshift(null);
  if (m[m.length - 1] !== monat) {
    m.push(monat);
    w.push(jetzt);
  } else w[w.length - 1] = jetzt;
  return { monate: m, werte: w };
}

/** Die Stimmung einer Gruppe über die Zeit, einschließlich des heutigen Werts. */
export function verlaufVon(world: World, id: string): Reihe {
  const v = verlaufSichern(world);
  return mitHeute(v.monate, v.laune[id] ?? [], world.date.slice(0, 7), nationalAverage(NET, world.net, id));
}

export function zustimmungsVerlauf(world: World): Reihe {
  const v = verlaufSichern(world);
  return mitHeute(v.monate, v.zustimmung, world.date.slice(0, 7), world.spiel!.umfrage.zustimmung);
}

export interface Marke {
  monat: string;
  text: string;
}

/** Beschlossene Gesetze als Marken im Verlauf: Was Sie entschieden haben, und wie die Stimmung danach lief. */
export function entscheidungsMarken(world: World): Marke[] {
  const out: Marke[] = [];
  for (const l of world.log) {
    if (l.kind !== "entscheidung") continue;
    const m = /^Das Parlament nimmt „(.+)“ an/.exec(l.text);
    if (m) out.push({ monat: l.date.slice(0, 7), text: m[1]! });
  }
  return out;
}
