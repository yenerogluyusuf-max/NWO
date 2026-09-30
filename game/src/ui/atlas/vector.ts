// Vektorebene der Karte: Flächen, Grenzen, Flüsse, Straßen, Bahn, Einrichtungen und Namen.
//
// Alles wird in Geräte-Pixeln pro Bild gezeichnet, durch dieselbe Kamera wie das Gelände. Dadurch ist jede Linie
// bei jedem Zoom scharf (vorher: ein festes Bild von 4800 Pixeln Breite, das beim Hineinzoomen vierfach vergrößert wurde).
// Gezeichnet wird nur, wenn sich Kamera, Farben oder Auswahl ändern; unsichtbare Linien werden übersprungen,
// winzige je nach Zoom ausgelassen.

import water from "../../data/gewaesser.json";
import { lonLatToUv, WORLD_W, type AtlasScene, type Relief } from "./scene";
import { NATION_COLOR, REGION_COLORS } from "./overlay";
import { imPunkt, ladeMeta, ladeStufe, type KBesitzer, type KFlaeche, type KRing, type KStufe } from "./daten";
import { PROVINZEN } from "../../sim/regional";
import type { Kartenebene } from "../ebenen";

export interface BezirkInfo {
  name: string;
  plaka: number;
  flaeche: number;
  strasseKm: number;
  dichte: number;
  krankenhaeuser: number;
  flughaefen: number;
  kraftwerke: number;
}

export interface VectorStyle {
  fill?: Record<number, string>;
  fillAlpha?: number;
  hover?: number;
  selected?: number;
  hoverBezirk?: number;
  /** ISO-Kürzel des Landes unter dem Zeiger */
  hoverLand?: string;
  ebene: Kartenebene;
  /** Farben der Länder nach ISO-Kürzel (Ebene „Beziehungen“) */
  laender?: Record<string, string>;
}

interface Shape {
  uv: Float32Array;
  xyz: Float32Array;
  n: number;
  bb: [number, number, number, number];
}

interface Lines {
  count: number;
  start: Uint32Array;
  len: Uint32Array;
  bb: Float32Array;
  xyz: Float32Array;
}

interface BezirkShape extends BezirkInfo {
  shapes: Shape[];
  bb: [number, number, number, number];
}

interface Punkte {
  krankenhaus: [number, number, string][];
  flughafen: [number, number, string, string, string][];
  kraftwerk: [number, number, string, string, string][];
  staudamm: [number, number, string][];
  hafen: [number, number, string][];
  universitaet: [number, number, string][];
}

/** Länder in eigenen, gedämpften Landesfarben (Ebene „Gelände“ und „Politisch“). */
const COUNTRY_COLORS: Record<string, string> = {
  GRC: "#5b87bf", BGR: "#4f8f5c", SYR: "#9c7aa8", IRQ: "#b59a57", IRN: "#5f9468", GEO: "#b8625a", ARM: "#d4914a",
  AZE: "#4f93a8", RUS: "#8f3d3d", UKR: "#d2bd55", ROU: "#c9a94f", MDA: "#a3b35a", SRB: "#9b6a6a", MKD: "#cf7f47",
  ALB: "#a64b4b", MNE: "#8d8fb8", KOS: "#7fa0c8", BIH: "#6f8fb0", HRV: "#7aa0d0", HUN: "#6aa07a", SVK: "#8a8fc0",
  ITA: "#5f9a5f", LBN: "#5fa39a", ISR: "#6f8fcf", PSX: "#8faa6a", JOR: "#b08a64", EGY: "#c8b27c", LBY: "#7ea06a",
  SAU: "#6d9a52", KWT: "#8aa0a0", TKM: "#a0a86a", KAZ: "#6fa3c0", CYP: "#b9a07e", CYN: "#b9a07e",
};

const REGION_OF = new Map(PROVINZEN.map((p) => [p.plaka, p.region]));

function shapeOf(r: Relief, atlas: AtlasScene, pts: number[][]): Shape {
  const n = pts.length;
  const uv = new Float32Array(n * 2);
  const xyz = new Float32Array(n * 3);
  let u0 = 9;
  let v0 = 9;
  let u1 = -9;
  let v1 = -9;
  for (let i = 0; i < n; i++) {
    const [u, v] = lonLatToUv(r, pts[i]![0]!, pts[i]![1]!);
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

function pointInShape(s: Shape, u: number, v: number): boolean {
  let inside = false;
  for (let i = 0, j = s.n - 1; i < s.n; j = i++) {
    const ui = s.uv[2 * i]!;
    const vi = s.uv[2 * i + 1]!;
    const uj = s.uv[2 * j]!;
    const vj = s.uv[2 * j + 1]!;
    if (vi > v !== vj > v && u < ((uj - ui) * (v - vi)) / (vj - vi) + ui) inside = !inside;
  }
  return inside;
}

function linesFrom(r: Relief, atlas: AtlasScene, buf: ArrayBuffer): Lines {
  const a = new Int32Array(buf);
  const count = a[0]!;
  const start = new Uint32Array(count);
  const len = new Uint32Array(count);
  let total = 0;
  // erster Durchlauf: Punktzahl
  for (let i = 1, k = 0; k < count; k++) {
    const n = a[i]!;
    start[k] = total;
    len[k] = n;
    total += n;
    i += 1 + 2 * n;
  }
  const xyz = new Float32Array(total * 3);
  const bb = new Float32Array(count * 4);
  let p = 0;
  for (let i = 1, k = 0; k < count; k++) {
    const n = a[i]!;
    let u0 = 9;
    let v0 = 9;
    let u1 = -9;
    let v1 = -9;
    for (let j = 0; j < n; j++) {
      const [u, v] = lonLatToUv(r, a[i + 1 + 2 * j]! / 1e5, a[i + 2 + 2 * j]! / 1e5);
      xyz[3 * p] = (u - 0.5) * WORLD_W;
      xyz[3 * p + 1] = atlas.heightAt(u, v) + 0.003;
      xyz[3 * p + 2] = (v - 0.5) * atlas.worldH;
      p++;
      if (u < u0) u0 = u;
      if (u > u1) u1 = u;
      if (v < v0) v0 = v;
      if (v > v1) v1 = v;
    }
    bb[4 * k] = u0;
    bb[4 * k + 1] = v0;
    bb[4 * k + 2] = u1;
    bb[4 * k + 3] = v1;
    i += 1 + 2 * n;
  }
  return { count, start, len, bb, xyz };
}

export class VectorLayer {
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private style: VectorStyle = { ebene: "gelaende" };
  private dirty = true;
  private lastHash = "";
  private m: Float32Array = new Float32Array(16);
  private cssW = 1;
  private cssH = 1;

  private lakes: Shape[] = [];
  private rivers: { rank: number; shape: Shape }[] = [];

  /** Landzerlegung in drei Detailstufen; geladen wird von grob nach fein */
  private stufen: (KStufe | null)[] = [null, null, null];
  private besitzer: KBesitzer[] = [];
  private landIndex = new Map<string, number>();
  private fremd: number[] = [];
  private stufeNr = 0;
  private bisGrenzen = [60, 200];
  private geladen = false;

  private tiers: (Lines | null)[] = [null, null, null, null];
  private tierLoading = [false, false, false, false];
  private rail: Lines | null = null;
  private punkte: Punkte | null = null;
  private bezirke: BezirkShape[] | null = null;
  private infraLoading = false;
  onDaten: (() => void) | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private atlas: AtlasScene,
    private relief: Relief,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.bauen();
    void this.ladeKarte();
  }

  private bauen() {
    const { relief, atlas } = this;
    // Gewässer
    const w = water as { rivers: { rank: number; lines: number[][][] }[]; lakes: { rings: number[][][] }[] };
    for (const l of w.lakes) for (const ring of l.rings) this.lakes.push(shapeOf(relief, atlas, ring));
    for (const r of w.rivers) for (const line of r.lines) this.rivers.push({ rank: r.rank, shape: shapeOf(relief, atlas, line) });
  }

  /** Landzerlegung laden: zuerst die grobe Stufe, damit die Karte sofort steht, dann die feineren. */
  private async ladeKarte() {
    const meta = await ladeMeta();
    if (!meta) return;
    this.besitzer = meta.besitzer;
    meta.besitzer.forEach((b, i) => {
      if (b.k === "l" && b.iso) {
        this.landIndex.set(b.iso, i);
        this.fremd.push(i);
      }
    });
    this.bisGrenzen = meta.stufen.slice(0, 2).map((x) => x.bis);
    for (let i = 0; i < meta.stufen.length; i++) {
      const st = await ladeStufe(meta.stufen[i]!.datei, this.relief, this.atlas, meta.besitzer.length);
      if (!st) continue;
      this.stufen[i] = st;
      this.geladen = true;
      this.dirty = true;
      this.onDaten?.();
    }
  }

  /** Besitzer der Länder mit Namen, Beschriftungspunkt und Größe (für die Beschriftung und Prüfungen). */
  laender(): KBesitzer[] {
    return this.besitzer.filter((b) => b.k === "l");
  }

  kartenGeladen(): boolean {
    return this.geladen;
  }

  /** Straßen, Bahn, Bezirke und Einrichtungen laden (nur wenn sie vorhanden sind). */
  ladeInfrastruktur(stufe: number): void {
    const { relief, atlas } = this;
    const ladeLinien = (name: string, ziel: (l: Lines) => void, flag?: { i: number }) => {
      fetch(`/data/osm/${name}`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
        .then((buf) => {
          ziel(linesFrom(relief, atlas, buf));
          this.dirty = true;
          this.onDaten?.();
        })
        .catch(() => {
          if (flag) this.tierLoading[flag.i] = false;
        });
    };
    for (let t = 0; t <= Math.min(3, stufe); t++) {
      if (this.tiers[t] || this.tierLoading[t]) continue;
      this.tierLoading[t] = true;
      ladeLinien(`strassen-${t}.bin`, (l) => (this.tiers[t] = l), { i: t });
    }
    if (!this.infraLoading) {
      this.infraLoading = true;
      ladeLinien("schiene.bin", (l) => (this.rail = l));
      fetch("/data/osm/punkte.json")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((p: Punkte) => {
          this.punkte = p;
          this.dirty = true;
          this.onDaten?.();
        })
        .catch(() => undefined);
      fetch("/data/osm/bezirke.json")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d: { bezirke: (Omit<BezirkShape, "shapes" | "bb" | "dichte" | "strasseKm" | "krankenhaeuser" | "flughaefen" | "kraftwerke" | "flaeche"> & { rings: number[][][]; flaeche_km2: number; strasse_km: number; strasse_dichte: number; krankenhaeuser: number; flughaefen: number; kraftwerke: number })[] }) => {
          this.bezirke = d.bezirke.map((b) => {
            const shapes = b.rings.map((ring) => shapeOf(relief, atlas, ring));
            let bb: [number, number, number, number] = [9, 9, -9, -9];
            for (const s of shapes) bb = [Math.min(bb[0], s.bb[0]), Math.min(bb[1], s.bb[1]), Math.max(bb[2], s.bb[2]), Math.max(bb[3], s.bb[3])];
            return { name: b.name, plaka: b.plaka, flaeche: b.flaeche_km2, strasseKm: b.strasse_km, dichte: b.strasse_dichte, krankenhaeuser: b.krankenhaeuser, flughaefen: b.flughaefen, kraftwerke: b.kraftwerke, shapes, bb };
          });
          this.dirty = true;
          this.onDaten?.();
        })
        .catch(() => undefined);
    }
  }

  hatBezirke(): boolean {
    return this.bezirke !== null;
  }

  setStyle(s: Partial<VectorStyle>): void {
    this.style = { ...this.style, ...s };
    this.dirty = true;
  }

  markDirty(): void {
    this.dirty = true;
  }

  resize(cssW: number, cssH: number, dpr: number): void {
    this.cssW = cssW;
    this.cssH = cssH;
    this.dpr = dpr;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.dirty = true;
  }

  // -------------------------------------------------------------------------
  // Picking

  /** Stufe für Treffer: die zuletzt gezeichnete, sonst die feinste vorhandene */
  private pickStufe(): KStufe | null {
    return this.stufen[this.stufeNr] ?? this.stufen[1] ?? this.stufen[0] ?? this.stufen[2] ?? null;
  }

  pickProvince(u: number, v: number): number | undefined {
    const st = this.pickStufe();
    if (!st) return undefined;
    for (let i = 0; i < 81; i++) {
      for (const f of st.porBesitzer[i] ?? []) if (imPunkt(f, u, v)) return i + 1;
    }
    return undefined;
  }

  /** Welches Land außerhalb der Türkei liegt an dieser Stelle? (ISO-Kürzel der Karte) */
  pickLand(u: number, v: number): string | undefined {
    const st = this.pickStufe();
    if (!st) return undefined;
    for (const i of this.fremd) {
      for (const f of st.porBesitzer[i] ?? []) if (imPunkt(f, u, v)) return this.besitzer[i]!.iso;
    }
    return undefined;
  }

  pickBezirk(u: number, v: number): { index: number; info: BezirkInfo } | undefined {
    if (!this.bezirke) return undefined;
    for (let i = 0; i < this.bezirke.length; i++) {
      const b = this.bezirke[i]!;
      if (u < b.bb[0] || u > b.bb[2] || v < b.bb[1] || v > b.bb[3]) continue;
      for (const s of b.shapes) if (pointInShape(s, u, v)) return { index: i, info: b };
    }
    return undefined;
  }

  // -------------------------------------------------------------------------
  // Zeichnen

  private pathXyz(xyz: Float32Array, from: number, n: number, close: boolean): void {
    const { ctx, m } = this;
    const W = this.cssW;
    const H = this.cssH;
    let pen = false;
    let lx = 0;
    let ly = 0;
    for (let i = 0; i < n; i++) {
      const o = 3 * (from + i);
      const x = xyz[o]!;
      const y = xyz[o + 1]!;
      const z = xyz[o + 2]!;
      const w = m[3]! * x + m[7]! * y + m[11]! * z + m[15]!;
      if (w <= 1e-4) {
        pen = false;
        continue;
      }
      const cx = (m[0]! * x + m[4]! * y + m[8]! * z + m[12]!) / w;
      const cy = (m[1]! * x + m[5]! * y + m[9]! * z + m[13]!) / w;
      const X = (cx + 1) * 0.5 * W;
      const Y = (1 - cy) * 0.5 * H;
      if (!pen) {
        ctx.moveTo(X, Y);
        pen = true;
      } else {
        // Punkte, die weniger als einen halben Bildpunkt auseinanderliegen, tragen nichts bei
        if (Math.abs(X - lx) + Math.abs(Y - ly) < 0.6 && i < n - 1) continue;
        ctx.lineTo(X, Y);
      }
      lx = X;
      ly = Y;
    }
    if (close && pen) ctx.closePath();
  }

  private inView(bb: ArrayLike<number>, o: number, b: { u0: number; u1: number; v0: number; v1: number }, ppu: number, minPx: number): boolean {
    const u0 = bb[o]!;
    const v0 = bb[o + 1]!;
    const u1 = bb[o + 2]!;
    const v1 = bb[o + 3]!;
    if (u1 < b.u0 || u0 > b.u1 || v1 < b.v0 || v0 > b.v1) return false;
    return (u1 - u0 + (v1 - v0)) * ppu >= minPx;
  }

  private drawLines(l: Lines | null, b: { u0: number; u1: number; v0: number; v1: number }, ppu: number, minPx: number): void {
    if (!l) return;
    for (let k = 0; k < l.count; k++) {
      if (!this.inView(l.bb, 4 * k, b, ppu, minPx)) continue;
      this.pathXyz(l.xyz, l.start[k]!, l.len[k]!, false);
    }
  }

  private flaechenPfad(fl: KFlaeche[], b: { u0: number; u1: number; v0: number; v1: number }): void {
    for (const f of fl) {
      if (f.bb[2] < b.u0 || f.bb[0] > b.u1 || f.bb[3] < b.v0 || f.bb[1] > b.v1) continue;
      for (const r of f.ringe) this.pathXyz(r.xyz, 0, r.n, true);
    }
  }

  private bogenPfad(st: KStufe, typen: number[], b: { u0: number; u1: number; v0: number; v1: number }): void {
    for (const bg of st.bogen) {
      if (!typen.includes(bg.typ)) continue;
      const bb = bg.ring.bb;
      if (bb[2] < b.u0 || bb[0] > b.u1 || bb[3] < b.v0 || bb[1] > b.v1) continue;
      this.pathXyz(bg.ring.xyz, 0, bg.ring.n, false);
    }
  }

  /** Zeichnet, wenn sich etwas geändert hat. */
  draw(): void {
    const { ctx, atlas } = this;
    const m = atlas.matrix();
    const hash = `${m[0]!.toFixed(4)}${m[5]!.toFixed(4)}${m[10]!.toFixed(4)}${m[12]!.toFixed(4)}${m[13]!.toFixed(4)}${m[14]!.toFixed(4)}${this.cssW}x${this.cssH}`;
    if (!this.dirty && hash === this.lastHash) return;
    this.dirty = false;
    this.lastHash = hash;
    this.m = m;
    const W = this.cssW;
    const H = this.cssH;
    const b = atlas.viewBounds();
    const ppu = W / Math.max(0.02, b.u1 - b.u0 - 0.08);
    const pxGrad = ppu / (this.relief.lon1 - this.relief.lon0);
    const st = this.style;
    const ebene = st.ebene;
    const infra = ebene === "infrastruktur";
    // Detailstufe der Landzerlegung: grob, solange die Karte klein ist
    let nr = pxGrad < this.bisGrenzen[0]! ? 0 : pxGrad < this.bisGrenzen[1]! ? 1 : 2;
    while (nr > 0 && !this.stufen[nr]) nr--;
    while (nr < 2 && !this.stufen[nr]) nr++;
    this.stufeNr = nr;
    const karte = this.stufen[nr] ?? null;
    // Ausbaustufe der Straßen: nur bei Bedarf laden
    const stufe = infra ? (ppu > 9000 ? 3 : ppu > 5000 ? 2 : ppu > 3000 ? 1 : 0) : ppu > 7000 ? 1 : -1;
    if (stufe >= 0 || infra || ppu > 3500) this.ladeInfrastruktur(Math.max(0, stufe));
    if (ppu > 6500 && stufe < 2) this.ladeInfrastruktur(2);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const z = Math.min(2.4, Math.max(0.85, ppu / 4200));

    // Die übrigen Länder: erst ein ruhiger Grauton, darüber ihre Landesfarbe (in der Ebene „Welt“ die Farbe der Beziehung)
    if (karte) {
      ctx.beginPath();
      for (const i of this.fremd) this.flaechenPfad(karte.porBesitzer[i]!, b);
      ctx.fillStyle = "rgba(70, 68, 60, 0.30)";
      ctx.fill("evenodd");
      for (const i of this.fremd) {
        const iso = this.besitzer[i]!.iso!;
        const col = st.laender ? st.laender[iso] : COUNTRY_COLORS[iso];
        if (!col) continue;
        ctx.beginPath();
        this.flaechenPfad(karte.porBesitzer[i]!, b);
        ctx.globalAlpha = st.laender ? 0.55 : 0.26;
        ctx.fillStyle = col;
        ctx.fill("evenodd");
      }
      ctx.globalAlpha = 1;
      ctx.beginPath();
      this.bogenPfad(karte, [5], b);
      ctx.strokeStyle = "rgba(28, 20, 16, 0.58)";
      ctx.lineWidth = 1.05 * z;
      ctx.stroke();
    }

    // Die Türkei: Landesfarbe mit Regionstönung, oder die Farben der Kartenebene
    const political = st.fill === undefined;
    const bezirkFill = infra && this.bezirke !== null && ppu > 3200;
    if (karte) {
      for (let plaka = 1; plaka <= 81; plaka++) {
        const fl = karte.porBesitzer[plaka - 1]!;
        if (!fl.length) continue;
        let col: string | undefined;
        let alpha: number;
        if (political) {
          col = NATION_COLOR;
          alpha = 0.5;
        } else {
          col = st.fill![plaka];
          alpha = st.fillAlpha ?? 0.62;
        }
        if (bezirkFill) alpha = 0;
        if (!col || alpha <= 0) continue;
        ctx.beginPath();
        this.flaechenPfad(fl, b);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = col;
        ctx.fill("evenodd");
        if (political) {
          ctx.globalAlpha = 0.2;
          ctx.fillStyle = REGION_COLORS[REGION_OF.get(plaka) ?? ""] ?? col;
          ctx.fill("evenodd");
        }
      }
    }
    ctx.globalAlpha = 1;

    // Bezirke: Färbung nach Straßendichte (Infrastruktur) und feine Grenzen beim Hineinzoomen
    if (this.bezirke && (infra || ppu > 3800)) {
      if (bezirkFill) {
        for (const bz of this.bezirke) {
          if (bz.bb[2] < b.u0 || bz.bb[0] > b.u1 || bz.bb[3] < b.v0 || bz.bb[1] > b.v1) continue;
          ctx.beginPath();
          for (const s of bz.shapes) this.pathXyz(s.xyz, 0, s.n, true);
          ctx.fillStyle = dichteFarbe(bz.dichte);
          ctx.globalAlpha = 0.72;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      for (const bz of this.bezirke) {
        if (bz.bb[2] < b.u0 || bz.bb[0] > b.u1 || bz.bb[3] < b.v0 || bz.bb[1] > b.v1) continue;
        for (const s of bz.shapes) this.pathXyz(s.xyz, 0, s.n, true);
      }
      ctx.strokeStyle = "rgba(38, 24, 14, 0.42)";
      ctx.lineWidth = 0.7 * z;
      ctx.stroke();
    }

    // Seen und Flüsse
    ctx.beginPath();
    for (const s of this.lakes) if (this.inView(s.bb, 0, b, ppu, 2)) this.pathXyz(s.xyz, 0, s.n, true);
    ctx.fillStyle = "rgba(38, 78, 100, 0.95)";
    ctx.fill();
    ctx.strokeStyle = "rgba(170, 200, 205, 0.7)";
    ctx.lineWidth = 0.9 * z;
    ctx.stroke();
    for (let rank = 1; rank <= 8; rank++) {
      ctx.beginPath();
      let any = false;
      for (const r of this.rivers) {
        if (r.rank !== rank || !this.inView(r.shape.bb, 0, b, ppu, 3)) continue;
        this.pathXyz(r.shape.xyz, 0, r.shape.n, false);
        any = true;
      }
      if (!any) continue;
      ctx.strokeStyle = "rgba(38, 86, 118, 0.95)";
      ctx.lineWidth = Math.max(0.9, 3.0 - rank * 0.28) * z;
      ctx.stroke();
    }

    // Provinzgrenzen fein, Regionsgrenzen kräftiger
    if (karte) {
      ctx.beginPath();
      this.bogenPfad(karte, [2], b);
      ctx.strokeStyle = "rgba(30, 18, 12, 0.5)";
      ctx.lineWidth = (bezirkFill ? 1.4 : 1.0) * z;
      ctx.setLineDash([5 * z, 3.5 * z]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      this.bogenPfad(karte, [3], b);
      ctx.strokeStyle = "rgba(30, 18, 12, 0.66)";
      ctx.lineWidth = 2.0 * z;
      ctx.stroke();
    }

    // Straßen und Bahn
    this.drawVerkehr(b, ppu, z, infra);

    // Landesgrenze: roter Farbsaum nach innen, dunkle Linie darüber
    if (karte) {
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < 81; i++) this.flaechenPfad(karte.porBesitzer[i]!, b);
      ctx.clip("evenodd");
      ctx.beginPath();
      this.bogenPfad(karte, [0, 4], b);
      ctx.strokeStyle = "rgba(162, 54, 38, 0.7)";
      ctx.lineWidth = Math.min(9, Math.max(3.5, 4.4 * z));
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      this.bogenPfad(karte, [0, 4], b);
      ctx.strokeStyle = "rgba(24, 12, 8, 0.95)";
      ctx.lineWidth = 1.4 * z;
      ctx.stroke();
    }

    // Auswahl und Hover
    const markiere = (plaka: number | undefined, fill: string, sSchwarz: number, sGold: number) => {
      if (!plaka || !karte) return;
      const fl = karte.porBesitzer[plaka - 1];
      if (!fl?.length) return;
      ctx.beginPath();
      this.flaechenPfad(fl, b);
      ctx.fillStyle = fill;
      ctx.fill("evenodd");
      if (sSchwarz > 0) {
        ctx.strokeStyle = "rgba(30, 20, 12, 0.9)";
        ctx.lineWidth = sSchwarz * z;
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(241, 213, 143, 1)";
      ctx.lineWidth = sGold * z;
      ctx.stroke();
    };
    if (st.hover && st.hover !== st.selected) markiere(st.hover, "rgba(255, 246, 220, 0.2)", 0, 1.8);
    markiere(st.selected, "rgba(255, 240, 200, 0.16)", 4.2, 2.0);
    if (st.hoverLand && karte) {
      const i = this.landIndex.get(st.hoverLand);
      if (i !== undefined) {
        ctx.beginPath();
        this.flaechenPfad(karte.porBesitzer[i]!, b);
        ctx.fillStyle = "rgba(255, 246, 220, 0.2)";
        ctx.fill("evenodd");
        ctx.strokeStyle = "rgba(241, 213, 143, 0.95)";
        ctx.lineWidth = 1.8 * z;
        ctx.stroke();
      }
    }
    if (st.hoverBezirk !== undefined && this.bezirke) {
      const bz = this.bezirke[st.hoverBezirk];
      if (bz) {
        ctx.beginPath();
        for (const s of bz.shapes) this.pathXyz(s.xyz, 0, s.n, true);
        ctx.fillStyle = "rgba(255, 246, 220, 0.24)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 246, 220, 0.95)";
        ctx.lineWidth = 1.6 * z;
        ctx.stroke();
      }
    }
  }

  private drawVerkehr(b: { u0: number; u1: number; v0: number; v1: number }, ppu: number, z: number, infra: boolean): void {
    const { ctx } = this;
    // Ab welcher Vergrößerung welche Klasse sichtbar wird; in der Infrastruktur-Ebene früher und dichter.
    const ab = infra ? [1400, 2800, 5200, 9000] : [4800, 7500, 12000, Infinity];
    if (ppu < ab[0]!) return;
    const alpha = infra ? 1 : Math.min(0.92, (ppu - ab[0]!) / 2200);
    ctx.globalAlpha = alpha;
    // Klasse 0 Autobahn und Schnellstraße, 1 Hauptstraße, 2 Landstraße, 3 Nebenstraße
    const stile = [
      { minPx: 2, casing: "rgba(252,244,222,0.9)", core: "rgba(150,38,28,0.98)", w: 2.0 },
      { minPx: 3, casing: "rgba(252,244,222,0.8)", core: "rgba(176,82,42,0.95)", w: 1.5 },
      { minPx: 4, casing: "rgba(252,244,222,0.65)", core: "rgba(120,86,54,0.85)", w: 1.05 },
      { minPx: 5, casing: "rgba(252,244,222,0.5)", core: "rgba(96,74,52,0.7)", w: 0.75 },
    ];
    const zz = Math.min(2.2, Math.max(0.9, ppu / 6000));
    // erst die feinen, dann die groben Straßen, damit Autobahnen oben liegen
    for (let t = 3; t >= 0; t--) {
      const s = stile[t]!;
      if (ppu < ab[t]! || !this.tiers[t]) continue;
      ctx.beginPath();
      this.drawLines(this.tiers[t]!, b, ppu, s.minPx);
      if (ppu > 3500) {
        ctx.strokeStyle = s.casing;
        ctx.lineWidth = (s.w + 1.4) * zz;
        ctx.stroke();
      }
      ctx.strokeStyle = s.core;
      ctx.lineWidth = s.w * zz;
      ctx.stroke();
    }
    if (this.rail && ppu > (infra ? 1800 : 6500)) {
      ctx.beginPath();
      this.drawLines(this.rail, b, ppu, 3);
      ctx.strokeStyle = "rgba(24,18,14,0.92)";
      ctx.lineWidth = 2.0 * z;
      ctx.stroke();
      ctx.setLineDash([4 * z, 4 * z]);
      ctx.strokeStyle = "rgba(246,238,214,0.95)";
      ctx.lineWidth = 1.0 * z;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1;
    if (this.punkte && ppu > (infra ? 1800 : 5200)) this.drawPunkte(b, ppu, z, infra);
  }

  private zeichnePunkt(u: number, v: number, art: "krankenhaus" | "flughafen" | "kraftwerk" | "staudamm" | "hafen", r: number): void {
    const { ctx, atlas } = this;
    const p = atlas.project(u, v);
    if (!p.sichtbar || p.x < -20 || p.x > this.cssW + 20 || p.y < -20 || p.y > this.cssH + 20) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "rgba(24,14,8,0.95)";
    if (art === "krankenhaus") {
      ctx.fillStyle = "#f6efe0";
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#b02a22";
      ctx.lineWidth = Math.max(1.4, r * 0.32);
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, 0);
      ctx.lineTo(r * 0.55, 0);
      ctx.moveTo(0, -r * 0.55);
      ctx.lineTo(0, r * 0.55);
      ctx.stroke();
    } else if (art === "flughafen") {
      ctx.fillStyle = "#274b73";
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#f4ecd8";
      ctx.lineWidth = Math.max(1.3, r * 0.28);
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, r * 0.1);
      ctx.lineTo(r * 0.7, -r * 0.1);
      ctx.moveTo(-r * 0.15, -r * 0.55);
      ctx.lineTo(r * 0.15, r * 0.55);
      ctx.stroke();
    } else if (art === "kraftwerk") {
      ctx.fillStyle = "#e0b23a";
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (art === "staudamm") {
      ctx.fillStyle = "#4b7f96";
      ctx.fillRect(-r, -r * 0.6, r * 2, r * 1.2);
      ctx.strokeRect(-r, -r * 0.6, r * 2, r * 1.2);
    } else {
      ctx.fillStyle = "#3a6f7a";
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#f4ecd8";
      ctx.lineWidth = Math.max(1.2, r * 0.26);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.6);
      ctx.lineTo(0, r * 0.5);
      ctx.moveTo(-r * 0.5, 0);
      ctx.lineTo(r * 0.5, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawPunkte(b: { u0: number; u1: number; v0: number; v1: number }, ppu: number, _z: number, infra: boolean): void {
    const pk = this.punkte!;
    const relief = this.relief;
    const r = Math.min(8, Math.max(3.4, ppu / 3000));
    const zeige = (liste: [number, number, ...string[]][], art: Parameters<VectorLayer["zeichnePunkt"]>[2], rr: number) => {
      for (const p of liste) {
        const [u, v] = lonLatToUv(relief, p[0] as number, p[1] as number);
        if (u < b.u0 || u > b.u1 || v < b.v0 || v > b.v1) continue;
        this.zeichnePunkt(u, v, art, rr);
      }
    };
    zeige(pk.flughafen, "flughafen", r * 1.15);
    zeige(pk.hafen, "hafen", r * 0.95);
    if (infra) {
      if (ppu > 2600) zeige(pk.krankenhaus, "krankenhaus", r);
      if (ppu > 4200) {
        zeige(pk.kraftwerk.filter((k) => k[3] !== "solar" && k[3] !== "wind" && k[2] !== ""), "kraftwerk", r * 0.8);
        zeige(pk.staudamm.filter((k) => k[2] !== ""), "staudamm", r * 0.8);
      }
    }
  }
}

/** Straßendichte (km je km²) in Farbe: dünn hell, dicht dunkel; das Landesmittel liegt bei etwa 1. */
export function dichteFarbe(d: number): string {
  const t = Math.min(1, Math.max(0, Math.sqrt(Math.max(0, d - 0.2) / 2.8)));
  const a = [236, 226, 200];
  const c = [38, 90, 98];
  return `rgb(${Math.round(a[0]! + (c[0]! - a[0]!) * t)},${Math.round(a[1]! + (c[1]! - a[1]!) * t)},${Math.round(a[2]! + (c[2]! - a[2]!) * t)})`;
}

