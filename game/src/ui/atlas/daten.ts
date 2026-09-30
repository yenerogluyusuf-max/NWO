// Kartendaten der Landzerlegung: 81 Provinzen und die Länder ringsum in drei Detailstufen (tools/geodaten/karte_daten.py).
// Grenzen sind je Stufe nur einmal vereinfacht, Nachbarn schließen daher ohne Lücke und Überlappung aneinander.

import { lonLatToUv, WORLD_W, type AtlasScene, type Relief } from "./scene";

export interface KRing {
  uv: Float32Array;
  xyz: Float32Array;
  n: number;
  bb: [number, number, number, number];
}

/** Eine Fläche: Außenring und Löcher (gefüllt mit gerader/ungerader Regel). */
export interface KFlaeche {
  besitzer: number;
  ringe: KRing[];
  bb: [number, number, number, number];
}

export interface KBogen {
  /** 0 Küste der Türkei, 2 Provinzgrenze, 3 Regionsgrenze, 4 Landesgrenze der Türkei, 5 Grenze zwischen anderen Ländern */
  typ: number;
  ring: KRing;
}

export interface KStufe {
  flaechen: KFlaeche[];
  porBesitzer: KFlaeche[][];
  bogen: KBogen[];
}

export interface KBesitzer {
  k: "p" | "l";
  plaka?: number;
  iso?: string;
  name?: string;
  lon?: number;
  lat?: number;
  flaeche?: number;
  rang?: number;
  einwohner?: number;
}

export interface KarteMeta {
  quelle: string;
  besitzer: KBesitzer[];
  stufen: { datei: string; bis: number; tol: number }[];
}

export async function ladeMeta(): Promise<KarteMeta | null> {
  try {
    const r = await fetch("/data/karte/karte.json");
    if (!r.ok) return null;
    return (await r.json()) as KarteMeta;
  } catch {
    return null;
  }
}

function ringVon(relief: Relief, atlas: AtlasScene, a: Int32Array, o: number, n: number): KRing {
  const uv = new Float32Array(n * 2);
  const xyz = new Float32Array(n * 3);
  let u0 = 9;
  let v0 = 9;
  let u1 = -9;
  let v1 = -9;
  for (let i = 0; i < n; i++) {
    const [u, v] = lonLatToUv(relief, a[o + 2 * i]! / 1e5, a[o + 2 * i + 1]! / 1e5);
    uv[2 * i] = u;
    uv[2 * i + 1] = v;
    xyz[3 * i] = (u - 0.5) * WORLD_W;
    xyz[3 * i + 1] = atlas.heightAt(u, v) + 0.004;
    xyz[3 * i + 2] = (v - 0.5) * atlas.worldH;
    if (u < u0) u0 = u;
    if (u > u1) u1 = u;
    if (v < v0) v0 = v;
    if (v > v1) v1 = v;
  }
  return { uv, xyz, n, bb: [u0, v0, u1, v1] };
}

export async function ladeStufe(datei: string, relief: Relief, atlas: AtlasScene, anzahlBesitzer: number): Promise<KStufe | null> {
  try {
    const r = await fetch(`/data/karte/${datei}`);
    if (!r.ok) return null;
    const a = new Int32Array(await r.arrayBuffer());
    if (a[0] !== 0x4b32) return null;
    const nFl = a[2]!;
    const nBogen = a[3]!;
    let p = 4;
    const flaechen: KFlaeche[] = [];
    const porBesitzer: KFlaeche[][] = Array.from({ length: anzahlBesitzer }, () => []);
    for (let f = 0; f < nFl; f++) {
      const besitzer = a[p]!;
      const nRinge = a[p + 1]!;
      p += 2;
      const ringe: KRing[] = [];
      let bb: [number, number, number, number] = [9, 9, -9, -9];
      for (let k = 0; k < nRinge; k++) {
        const n = a[p]!;
        const ring = ringVon(relief, atlas, a, p + 1, n);
        p += 1 + 2 * n;
        ringe.push(ring);
        if (k === 0) bb = [ring.bb[0], ring.bb[1], ring.bb[2], ring.bb[3]];
      }
      const fl: KFlaeche = { besitzer, ringe, bb };
      flaechen.push(fl);
      porBesitzer[besitzer]?.push(fl);
    }
    const bogen: KBogen[] = [];
    for (let b = 0; b < nBogen; b++) {
      const typ = a[p]!;
      const n = a[p + 1]!;
      bogen.push({ typ, ring: ringVon(relief, atlas, a, p + 2, n) });
      p += 2 + 2 * n;
    }
    return { flaechen, porBesitzer, bogen };
  } catch {
    return null;
  }
}

/** Liegt der Punkt in der Fläche (Außenring und Löcher, gerade/ungerade Regel)? */
export function imPunkt(f: KFlaeche, u: number, v: number): boolean {
  if (u < f.bb[0] || u > f.bb[2] || v < f.bb[1] || v > f.bb[3]) return false;
  let drin = false;
  for (const r of f.ringe) {
    const uv = r.uv;
    for (let i = 0, j = r.n - 1; i < r.n; j = i++) {
      const ui = uv[2 * i]!;
      const vi = uv[2 * i + 1]!;
      const uj = uv[2 * j]!;
      const vj = uv[2 * j + 1]!;
      if (vi > v !== vj > v && u < ((uj - ui) * (v - vi)) / (vj - vi) + ui) drin = !drin;
    }
  }
  return drin;
}
