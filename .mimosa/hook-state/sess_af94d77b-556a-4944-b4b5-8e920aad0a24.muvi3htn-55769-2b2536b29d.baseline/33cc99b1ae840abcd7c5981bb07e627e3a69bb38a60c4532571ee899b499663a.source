// Geometrie des Halbrunds: Sitzpositionen für n Abgeordnete und ihre Zuordnung zu Fraktionen.
// Reine Rechnung ohne Oberfläche, damit sie sich testen lässt (test/parlament.test.ts).

export interface Sitz {
  /** Nummer von links nach rechts (0 = ganz links außen) */
  i: number;
  x: number;
  y: number;
  /** Winkel im Halbkreis, π = links, 0 = rechts */
  winkel: number;
  reihe: number;
}

export interface Sitzplan {
  n: number;
  breite: number;
  hoehe: number;
  mitte: { x: number; y: number };
  innen: number;
  aussen: number;
  reihen: number;
  sitzRadius: number;
  /** Nach dem Winkel sortiert: Fraktionen belegen zusammenhängende Keile */
  sitze: Sitz[];
}

const AUSSEN = 300;
const INNEN_ANTEIL = 0.4;
const KOPF = 34;

/** Verteilt `summe` ganzzahlig im Verhältnis der Gewichte (größter Rest); mit Obergrenzen je Eintrag. */
export function proportional(gewichte: number[], summe: number, grenzen?: number[]): number[] {
  const n = gewichte.length;
  const out = new Array<number>(n).fill(0);
  let rest = Math.max(0, Math.round(summe));
  // Mehrere Durchgänge: Was an einer Obergrenze scheitert, geht an die übrigen
  for (let runde = 0; runde < n + 2 && rest > 0; runde++) {
    const aktiv = gewichte.map((g, k) => (g > 0 && out[k]! < (grenzen ? grenzen[k]! : Infinity) ? g : 0));
    const gesamt = aktiv.reduce((a, b) => a + b, 0);
    if (gesamt <= 0) break;
    const anteile = aktiv.map((g) => (g / gesamt) * rest);
    const basis = anteile.map((a, k) => Math.min(Math.floor(a), (grenzen ? grenzen[k]! : Infinity) - out[k]!));
    let vergeben = 0;
    basis.forEach((b, k) => {
      out[k] = out[k]! + Math.max(0, b);
      vergeben += Math.max(0, b);
    });
    let uebrig = rest - vergeben;
    const reihenfolge = anteile
      .map((a, k) => ({ k, r: a - Math.floor(a) }))
      .filter((x) => aktiv[x.k]! > 0)
      .sort((p, q) => q.r - p.r || p.k - q.k);
    for (const { k } of reihenfolge) {
      if (uebrig <= 0) break;
      if (out[k]! < (grenzen ? grenzen[k]! : Infinity)) {
        out[k] = out[k]! + 1;
        uebrig--;
        vergeben++;
      }
    }
    if (vergeben === 0) break;
    rest -= vergeben;
  }
  return out;
}

const cache = new Map<number, Sitzplan>();

/** Baut das Halbrund für n Sitze: passende Reihenzahl, Sitze je Reihe im Verhältnis zum Radius. */
export function baueSitzplan(n = 600): Sitzplan {
  const gemerkt = cache.get(n);
  if (gemerkt) return gemerkt;
  const innen = AUSSEN * INNEN_ANTEIL;
  // Reihenzahl, bei der der Sitzabstand innerhalb und zwischen den Reihen gleich wird und n am besten aufgeht
  let beste = { reihen: 5, fehler: Infinity };
  for (let reihen = 3; reihen <= 30; reihen++) {
    const d = (AUSSEN - innen) / (reihen - 1);
    let schaetzung = 0;
    for (let k = 0; k < reihen; k++) schaetzung += (Math.PI * (innen + k * d)) / d;
    const fehler = Math.abs(schaetzung - n);
    if (fehler < beste.fehler) beste = { reihen, fehler };
  }
  const reihen = beste.reihen;
  const d = (AUSSEN - innen) / (reihen - 1);
  const radien = Array.from({ length: reihen }, (_, k) => innen + k * d);
  const je = proportional(radien, n);
  const sitzRadius = Math.min(9, 0.44 * d);
  const rand = sitzRadius + 6;
  const breite = 2 * (AUSSEN + rand);
  // Oben bleibt Platz für die Beschriftung der Mehrheitslinie
  const mitte = { x: breite / 2, y: AUSSEN + rand + KOPF };
  const hoehe = mitte.y + sitzRadius + 8;
  const roh: Sitz[] = [];
  radien.forEach((r, reihe) => {
    const m = je[reihe]!;
    for (let k = 0; k < m; k++) {
      const winkel = m === 1 ? Math.PI / 2 : Math.PI - (Math.PI * k) / (m - 1);
      roh.push({ i: 0, x: mitte.x + r * Math.cos(winkel), y: mitte.y - r * Math.sin(winkel), winkel, reihe });
    }
  });
  roh.sort((a, b) => (Math.abs(b.winkel - a.winkel) > 1e-9 ? b.winkel - a.winkel : a.reihe - b.reihe));
  roh.forEach((s, i) => (s.i = i));
  const plan: Sitzplan = { n, breite, hoehe, mitte, innen, aussen: AUSSEN, reihen, sitzRadius, sitze: roh };
  cache.set(n, plan);
  return plan;
}

export interface Gruppe {
  partei: string;
  sitze: number;
}

/** Welche Fraktion auf welchem Sitz (Index = Sitznummer von links) sitzt: Die Gruppen belegen der Reihe nach je einen Keil. */
export function belege(plan: Sitzplan, gruppen: Gruppe[]): string[] {
  const out: string[] = [];
  for (const g of gruppen) for (let k = 0; k < g.sitze && out.length < plan.n; k++) out.push(g.partei);
  while (out.length < plan.n) out.push("");
  return out;
}

/** Winkel der Grenze hinter dem Sitz mit der Nummer `nummer` (0-basiert), etwa für die Mehrheitslinie. */
export function grenzWinkel(plan: Sitzplan, nummer: number): number {
  const a = plan.sitze[Math.max(0, Math.min(plan.n - 1, nummer))]!;
  const b = plan.sitze[Math.max(0, Math.min(plan.n - 1, nummer + 1))]!;
  return (a.winkel + b.winkel) / 2;
}

/** Kleiner, fester Zufallsgenerator für gleichbleibende Muster (Abweichler in einem Keil). */
export function zufall(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Einfacher Streuwert aus einem Text, damit dieselbe Abstimmung immer dasselbe Muster zeigt. */
export function streuwert(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
