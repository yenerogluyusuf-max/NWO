// Die Front als Linie entlang der Regionsgrenzen (krieg.md Schritt 10, Welle 3 K6). Vorher zeigte die 3D-Karte keine Front und die 2D-Karte
// eine kurze Zackenlinie an einem gerechneten Punkt. Jetzt verläuft die Linie dort, wo türkisch gehaltenes Gebiet an das Gebiet des Gegners
// stößt, wie in Hearts of Iron IV. Beide Karten (AtlasMap in 3D, Karte2D) zeichnen dieselben Linien aus derselben Rechnung.
//
// Wie die Linie entsteht (alles in Länge und Breite, reine Logik ohne Oberfläche):
//   - Für jede Kante einer gehaltenen Region (im Krieg genommen oder besetzt) wird ein Punkt knapp außerhalb geprüft (FUEHLER). Liegt er im
//     Land des Gegners und weder in der Türkei noch in einer anderen gehaltenen Region, ist die Kante Front, der Gegner liegt außen.
//   - Für jede noch nicht gehaltene Zielregion: Liegt der Punkt außerhalb in der Türkei, verläuft die Front auf der Grenze, der Gegner innen.
//   - Benachbarte Frontkanten werden zu Linien verbunden; kurze Lücken werden überbrückt, kurze Reste fallen weg (Spielparameter der
//     Darstellung, weil die Umrisse auf etwa 600 m vereinfacht sind und Nachbarn keine gemeinsamen Punkte haben).
// Die Art der Linie folgt der Lage: „front“ im Krieg, „waffenruhe“ in der Waffenruhe, „linie“ für eine Besatzung nach dem Krieg.

import type { World } from "../../sim/types";
import { kriegsKarte, schauplatzFuer, zielRegionen, type KriegsKarte } from "../../sim/kriegsschauplatz";
import { REGION_NACH_ID, SCHAUPLAETZE } from "../../data/schauplaetze";
import nachbarn from "../../data/nachbarn.json";
import SCHAUPLATZ_FLAECHEN_ROH from "../../data/schauplatz-flaechen.json";
import { PROVINCE_FC, provinceLonLat, ringsOf } from "./overlay";

/** Kriege und Besatzung nur lesen: `kriege()` und `besatzung()` legen fehlende Listen an, das Zeichnen darf den Spielstand nicht ändern */
const nurLesen = (w: World) => ({ kriege: w.spiel?.kriege ?? [], besatzung: w.spiel?.besatzung ?? [] });

type P = [number, number];

export const SCHAUPLATZ_FLAECHEN = SCHAUPLATZ_FLAECHEN_ROH as unknown as Record<string, P[][]>;

/** Abstand des Prüfpunkts außerhalb einer Kante, in Grad Breite (etwa 3 km; Spielparameter der Darstellung) */
const FUEHLER = 0.03;
/** Lücken bis zu dieser Länge (Grad) zwischen zwei Frontstücken werden überbrückt */
const LUECKE = 0.06;
/** Frontstücke unter dieser Länge (Grad) entfallen */
const MIN_LAENGE = 0.08;

interface Flaeche {
  ringe: P[][];
  x0: number; y0: number; x1: number; y1: number;
}

function flaeche(ringe: P[][]): Flaeche {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of ringe) for (const [x, y] of r) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { ringe, x0, y0, x1, y1 };
}

/** Punkt in Fläche (gerade/ungerade über alle Ringe, damit Löcher stimmen) */
export function inFlaeche(f: Flaeche, x: number, y: number): boolean {
  if (x < f.x0 || x > f.x1 || y < f.y0 || y > f.y1) return false;
  let drin = false;
  for (const r of f.ringe) {
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i]!;
      const [xj, yj] = r[j]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) drin = !drin;
    }
  }
  return drin;
}

const TUERKEI: Flaeche[] = PROVINCE_FC.features.map((f) => flaeche(ringsOf(f) as unknown as P[][]));
const LAENDER: Record<string, Flaeche> = Object.fromEntries(
  (nachbarn as unknown as { countries: { iso: string; rings: P[][] }[] }).countries.map((c) => [c.iso, flaeche(c.rings)]),
);
const REGIONEN: Record<string, Flaeche> = Object.fromEntries(Object.entries(SCHAUPLATZ_FLAECHEN).map(([id, r]) => [id, flaeche(r)]));

export const inTuerkei = (x: number, y: number): boolean => TUERKEI.some((f) => inFlaeche(f, x, y));
export const inLand = (iso: string, x: number, y: number): boolean => !!LAENDER[iso] && inFlaeche(LAENDER[iso]!, x, y);

/** Die Region unter einem Punkt (Länge, Breite), aus einer Liste von Kennungen; für den Klick auf der Karte. */
export function regionBei(lon: number, lat: number, ids: readonly string[]): string | undefined {
  return ids.find((id) => REGIONEN[id] && inFlaeche(REGIONEN[id]!, lon, lat));
}

/** Das Land, gegen das der Schauplatz einer Region gilt. */
export function landVonRegion(id: string): string | undefined {
  const r = REGION_NACH_ID[id];
  return r ? SCHAUPLAETZE.find((s) => s.id === r.schauplatz)?.land : undefined;
}

/** Mitte der Umrisse mehrerer Regionen und ein Kameraabstand, der sie zeigt (Kamera der Ortswahl). */
export function rahmenVon(ids: readonly string[]): { lon: number; lat: number; breite: number; hoehe: number } | undefined {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const id of ids) {
    const f = REGIONEN[id];
    if (!f) continue;
    x0 = Math.min(x0, f.x0); y0 = Math.min(y0, f.y0); x1 = Math.max(x1, f.x1); y1 = Math.max(y1, f.y1);
  }
  if (!Number.isFinite(x0)) return undefined;
  return { lon: (x0 + x1) / 2, lat: (y0 + y1) / 2, breite: x1 - x0, hoehe: y1 - y0 };
}

export interface FrontLinie {
  land: string;
  art: "front" | "waffenruhe" | "linie";
  punkte: P[];
  /** Je Abschnitt (punkte[i] → punkte[i + 1]) die Richtung zum Gegner in Länge und Breite */
  feind: P[];
}

export interface FrontEingabe {
  land: string;
  art: FrontLinie["art"];
  /** Von der Türkei gehaltene Regionen dieses Landes */
  gehalten: string[];
  /** Noch nicht gehaltene Zielregionen (beim Gegner oder umkämpft), deren Grenze zur Türkei Front sein kann */
  ziel: string[];
}

/** Kanten einer Fläche mit Prüfpunkt außen; `aussen` ist die Richtung nach außen in Länge/Breite (nicht normiert). */
function kanten(ring: P[]): { a: P; b: P; mitte: P; aussen: P; laenge: number }[] {
  let flaecheZ = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) flaecheZ += (ring[j]![0] - ring[i]![0]) * (ring[j]![1] + ring[i]![1]);
  // flaecheZ > 0: Ring gegen den Uhrzeigersinn (Länge nach rechts, Breite nach oben)
  const ccw = flaecheZ > 0;
  const out: { a: P; b: P; mitte: P; aussen: P; laenge: number }[] = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    const k = Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
    const dx = (b[0] - a[0]) * k;
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy);
    if (l < 1e-9) continue;
    // Normale im gestauchten Raum (Länge mal Kosinus), zurück in Länge/Breite
    const nx = (ccw ? dy : -dy) / l;
    const ny = (ccw ? -dx : dx) / l;
    out.push({ a, b, mitte: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], aussen: [nx / k, ny], laenge: l });
  }
  return out;
}

/** Verbindet markierte Kanten eines Rings zu Linien (über das Ringende hinweg), überbrückt kurze Lücken, verwirft kurze Reste. */
function ketten(ks: ReturnType<typeof kanten>, markiert: boolean[], feindAussen: boolean): { punkte: P[]; feind: P[]; laenge: number }[] {
  const n = ks.length;
  if (!n || !markiert.some(Boolean)) return [];
  const m = [...markiert];
  // Lücken überbrücken: unmarkierte Läufe zwischen markierten Kanten, die kürzer als LUECKE sind
  if (m.some((x) => !x)) {
    const start = m.findIndex((x) => x);
    let i = start;
    let schritte = 0;
    while (schritte < n) {
      if (!m[i % n]) {
        let j = i, laenge = 0, c = 0;
        while (!m[j % n] && c < n) { laenge += ks[j % n]!.laenge; j++; c++; }
        if (laenge < LUECKE) for (let q = i; q < j; q++) m[q % n] = true;
        schritte += c;
        i = j;
      } else { i++; schritte++; }
    }
  }
  if (m.every(Boolean)) {
    const punkte = [...ks.map((k) => k.a), ks[0]!.a];
    const feind = ks.map((k) => (feindAussen ? k.aussen : [-k.aussen[0], -k.aussen[1]] as P));
    return [{ punkte, feind, laenge: ks.reduce((s, k) => s + k.laenge, 0) }];
  }
  // Beginn hinter einer unmarkierten Kante, damit keine Kette am Ringende zerschnitten wird
  const erste = m.findIndex((x, i) => x && !m[(i - 1 + n) % n]);
  const out: { punkte: P[]; feind: P[]; laenge: number }[] = [];
  let lauf: { punkte: P[]; feind: P[]; laenge: number } | null = null;
  for (let c = 0; c < n; c++) {
    const i = (erste + c) % n;
    const k = ks[i]!;
    if (m[i]) {
      if (!lauf) lauf = { punkte: [k.a], feind: [], laenge: 0 };
      lauf.punkte.push(k.b);
      lauf.feind.push(feindAussen ? k.aussen : [-k.aussen[0], -k.aussen[1]]);
      lauf.laenge += k.laenge;
    } else if (lauf) {
      out.push(lauf);
      lauf = null;
    }
  }
  if (lauf) out.push(lauf);
  return out.filter((l) => l.laenge >= MIN_LAENGE);
}

/** Die Frontlinien für gegebene Lagen (ohne Spielstand prüfbar). */
export function frontLinien(eingaben: readonly FrontEingabe[]): FrontLinie[] {
  const out: FrontLinie[] = [];
  const alleGehalten = new Set(eingaben.flatMap((e) => e.gehalten));
  const inGehalten = (x: number, y: number, ohne: string): boolean => [...alleGehalten].some((id) => id !== ohne && REGIONEN[id] && inFlaeche(REGIONEN[id]!, x, y));
  for (const e of eingaben) {
    for (const id of e.gehalten) {
      // Inseln haben keine Landfront; ihre Küste weicht in den Kartendaten des Landes und der Region um mehr als den Fühler ab
      if (REGION_NACH_ID[id]?.gelaende === "insel") continue;
      for (const ring of SCHAUPLATZ_FLAECHEN[id] ?? []) {
        const ks = kanten(ring);
        // Zwei Fühler (einfach und zweieinhalbfach): Beide müssen beim Gegner liegen, sonst ist es Küste oder Ungenauigkeit der Umrisse
        const feindBei = (k: (typeof ks)[number], f: number): boolean => {
          const x = k.mitte[0] + k.aussen[0] * f, y = k.mitte[1] + k.aussen[1] * f;
          return inLand(e.land, x, y) && !inTuerkei(x, y) && !inGehalten(x, y, id);
        };
        const mark = ks.map((k) => feindBei(k, FUEHLER) && feindBei(k, FUEHLER * 2.5));
        for (const l of ketten(ks, mark, true)) out.push({ land: e.land, art: e.art, punkte: l.punkte, feind: l.feind });
      }
    }
    if (e.art === "linie") continue;
    for (const id of e.ziel) {
      if (alleGehalten.has(id)) continue;
      for (const ring of SCHAUPLATZ_FLAECHEN[id] ?? []) {
        const ks = kanten(ring);
        const mark = ks.map((k) => inTuerkei(k.mitte[0] + k.aussen[0] * FUEHLER, k.mitte[1] + k.aussen[1] * FUEHLER));
        for (const l of ketten(ks, mark, false)) out.push({ land: e.land, art: e.art, punkte: l.punkte, feind: l.feind });
      }
    }
  }
  return out;
}

/** Punkt auf den Linien eines Landes, der einem Ort am nächsten liegt, mit der Richtung zum Gegner dort. */
export function frontPunktNahe(linien: readonly FrontLinie[], land: string, ort: P): { punkt: P; feind: P; laengs: P } | undefined {
  let best: { punkt: P; feind: P; laengs: P; d: number } | undefined;
  for (const l of linien) {
    if (l.land !== land) continue;
    for (let i = 0; i < l.punkte.length - 1; i++) {
      const a = l.punkte[i]!, b = l.punkte[i + 1]!;
      const m: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const d = Math.hypot(m[0] - ort[0], m[1] - ort[1]);
      if (!best || d < best.d) {
        const f = l.feind[i]!;
        const fl = Math.hypot(f[0], f[1]) || 1;
        const ll = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        best = { punkt: m, feind: [f[0] / fl, f[1] / fl], laengs: [(b[0] - a[0]) / ll, (b[1] - a[1]) / ll], d };
      }
    }
  }
  return best && { punkt: best.punkt, feind: best.feind, laengs: best.laengs };
}

export interface KriegsLage {
  karte: KriegsKarte | null;
  linien: FrontLinie[];
  /** Regionen, die zum Zielraum eines laufenden Krieges gehören (stärker gezeichnet als der übrige Schauplatz) */
  ziel: string[];
  /** Verbände an der Front (aus `kriegsKarte`, Stärke und Art unverändert, Lage an der Frontlinie, sonst wie gerechnet) */
  verbaende: NonNullable<KriegsKarte["verbaende"]>;
}

let letzte: { sig: string; lage: KriegsLage } | null = null;

/** Die ganze Kriegslage für beide Karten: `kriegsKarte` aus der Simulation, dazu Front, Zielraum und Lage der Verbände. */
export function kriegsLage(w: World): KriegsLage {
  const karte = kriegsKarte(w, nurLesen(w).kriege, provinceLonLat);
  const eingaben: FrontEingabe[] = [];
  const ziel: string[] = [];
  const imKrieg = new Set<string>();
  for (const k of nurLesen(w).kriege) {
    if ((k.phase !== "krieg" && k.phase !== "waffenruhe") || !schauplatzFuer(k.land)) continue;
    imKrieg.add(k.land);
    const lage = k.regionen ?? {};
    const zr = zielRegionen(k).map((r) => r.id);
    ziel.push(...zr);
    const gehalten = Object.entries(lage).filter(([, l]) => l === "eigen").map(([id]) => id);
    const offen = zr.filter((id) => lage[id] !== "eigen" && (REGION_NACH_ID[id]?.tiefe === 1 || lage[id] === "umkaempft"));
    eingaben.push({ land: k.land, art: k.phase === "krieg" ? "front" : "waffenruhe", gehalten, ziel: offen });
  }
  const nachLand = new Map<string, string[]>();
  for (const b of nurLesen(w).besatzung) if (!imKrieg.has(b.land)) nachLand.set(b.land, [...(nachLand.get(b.land) ?? []), b.region]);
  for (const [land, gehalten] of nachLand) eingaben.push({ land, art: "linie", gehalten, ziel: [] });
  const sig = JSON.stringify([eingaben, karte?.verbaende ?? [], karte?.regionen.map((r) => r.id + r.lage)]);
  if (letzte?.sig === sig) return { ...letzte.lage, karte };
  const linien = frontLinien(eingaben);
  // Verbände an die Front: die eigenen dahinter, der Gegner davor, an der Stelle nächst der umkämpften Region (sonst der Zielregion)
  const verbaende = (karte?.verbaende ?? []).map((v) => ({ ...v }));
  for (const land of new Set(verbaende.map((v) => v.land))) {
    const k = nurLesen(w).kriege.find((x) => x.land === land && (x.phase === "krieg" || x.phase === "waffenruhe"));
    const umk = k ? Object.entries(k.regionen ?? {}).find(([, l]) => l === "umkaempft")?.[0] : undefined;
    const bezug = REGION_NACH_ID[umk ?? (k ? zielRegionen(k).find((r) => k.regionen?.[r.id] !== "eigen")?.id ?? "" : "")];
    const fp = bezug ? frontPunktNahe(linien, land, [bezug.lon, bezug.lat]) : undefined;
    if (!fp) continue;
    const eigene = verbaende.filter((v) => v.land === land && v.seite === "eigen");
    eigene.forEach((v, i) => {
      const quer = (i - (eigene.length - 1) / 2) * 0.42;
      v.lon = fp.punkt[0] - fp.feind[0] * 0.3 + fp.laengs[0] * quer;
      v.lat = fp.punkt[1] - fp.feind[1] * 0.3 + fp.laengs[1] * quer;
    });
    for (const v of verbaende.filter((x) => x.land === land && x.seite === "gegner")) {
      v.lon = fp.punkt[0] + fp.feind[0] * 0.3;
      v.lat = fp.punkt[1] + fp.feind[1] * 0.3;
    }
  }
  const lage: KriegsLage = { karte, linien, ziel, verbaende };
  letzte = { sig, lage };
  return lage;
}
