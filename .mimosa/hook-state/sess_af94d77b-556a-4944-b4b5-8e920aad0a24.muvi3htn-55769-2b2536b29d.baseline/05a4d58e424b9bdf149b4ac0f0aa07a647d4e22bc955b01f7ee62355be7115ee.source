// Kartendaten der Landzerlegung: 81 Provinzen und die Länder der ganzen Welt in drei Detailstufen (tools/geodaten/karte2/).
// Grenzen sind je Stufe nur einmal vereinfacht, Nachbarn schließen daher ohne Lücke und Überlappung aneinander.
//
// Zwei Quellen je Stufe: karte-L*.bin (Kern: Türkei und Nachbarn, OSM-Küste) und karte-W*.bin (übrige Welt, Natural Earth); `fuegeZusammen` hängt die Welt-Stufe an.
//
// Besitzerwechsel (Vorbereitung für Annexion und Besatzung, Welle 2): Jede Fläche (`KFlaeche`) trägt einen Besitzerindex in `karte.json` → `besitzer`;
// Füllung, Auswahl und Treffer lesen nur `porBesitzer[index]`. Eine Fläche wechselt den Besitzer, indem sie dort herausgenommen, in die Liste des neuen
// Besitzers gelegt und ihr `besitzer`-Feld gesetzt wird (`uebertrageFlaechen`). Das gilt für ganze Länder wie für Regionen, sobald Regionen als eigene
// Flächen vorliegen (Natural Earth Verwaltungsgebiete Stufe 1, gemeinfrei: Syrien 15, Irak 18, Griechenland 14, Zypern 5, Armenien 11, Georgien 12, Iran 31).
// Grenzbögen (`bogen`) sind getrennt davon; ihr Typ (4 = Landesgrenze der Türkei, 5 = Grenze anderer Länder) muss nach dem Wechsel neu zugeordnet werden.

import { lonLatToUv, type AtlasScene, type Relief } from "./scene";

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
  /** p Provinz, l Land außerhalb der Türkei, t Sammelbesitzer Türkei (Vereinigung der Provinzen) */
  k: "p" | "l" | "t";
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
  /** Länder außerhalb des Kerns: eine Datei je Detailstufe (gleiches Format), Besitzer wie in `besitzer` */
  welt?: { stufen: string[] };
  /** Beschriftungsanker je Land: Länge, Breite, Abstand zur Grenze (Grad), dreifach hintereinander */
  anker?: Record<string, number[]>;
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
    xyz[3 * i] = (u - 0.5) * atlas.worldW;
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

/**
 * Legt Flächen eines Besitzers einem anderen Besitzer zu (Annexion, Besatzung). Ohne `auswahl` wechseln alle Flächen von `von`.
 * Liefert die Zahl der übertragenen Flächen. Die Grenzbögen bleiben unberührt (siehe Kopf der Datei).
 */
export function uebertrageFlaechen(stufe: KStufe, von: number, nach: number, auswahl?: (f: KFlaeche) => boolean): number {
  const quelle = stufe.porBesitzer[von];
  if (!quelle || von === nach) return 0;
  const bleibt: KFlaeche[] = [];
  const geht: KFlaeche[] = [];
  for (const f of quelle) (!auswahl || auswahl(f) ? geht : bleibt).push(f);
  if (!geht.length) return 0;
  stufe.porBesitzer[von] = bleibt;
  const ziel = (stufe.porBesitzer[nach] ??= []);
  for (const f of geht) {
    f.besitzer = nach;
    ziel.push(f);
  }
  return geht.length;
}

/** Hängt die Flächen und Bögen einer Welt-Stufe an die Stufe der Landzerlegung an (die Besitzerindizes sind dieselben). */
export function fuegeZusammen(ziel: KStufe, w: KStufe): void {
  for (const f of w.flaechen) {
    ziel.flaechen.push(f);
    (ziel.porBesitzer[f.besitzer] ??= []).push(f);
  }
  for (const b of w.bogen) ziel.bogen.push(b);
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
