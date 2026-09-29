// Zeichenebenen über dem Relief: Provinzflächen, Tintengrenzen, Landesmaske
// und eine unsichtbare Ebene, aus der sich die Provinz unter dem Mauszeiger ablesen lässt.

import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import raw from "../../data/provinzen.json";
import water from "../../data/gewaesser.json";
import neighbors from "../../data/nachbarn.json";
import { lonLatToUv, type Relief } from "./scene";
import { PROVINZEN } from "../../sim/regional";

export interface ProvinceProps {
  id: string;
  plaka: number;
  name: string;
}

export const PROVINCE_FC = raw as unknown as FeatureCollection<Geometry, ProvinceProps>;

export const OVERLAY_W = 4800;
/** Zeichenkonstanten sind für Breite 3200 kalibriert und werden damit skaliert. */
const K = OVERLAY_W / 3200;

function rings(f: Feature<Geometry, ProvinceProps>): Position[][] {
  const g = f.geometry;
  if (g.type === "Polygon") return g.coordinates;
  if (g.type === "MultiPolygon") return g.coordinates.flat();
  return [];
}

function tracePath(ctx: CanvasRenderingContext2D, r: Relief, f: Feature<Geometry, ProvinceProps>, W: number, H: number, wobble = 0, seed = 0) {
  ctx.beginPath();
  for (const ring of rings(f)) {
    ring.forEach((pt, i) => {
      const [u, v] = lonLatToUv(r, pt[0]!, pt[1]!);
      // leichtes Zittern der Hand
      const j = wobble ? Math.sin(i * 12.9898 + seed) * wobble : 0;
      const x = u * W + j;
      const y = v * H + j * 0.7;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }
}

export function makeCanvas(r: Relief): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = OVERLAY_W;
  c.height = Math.round((OVERLAY_W * r.height) / r.width);
  return c;
}

/** Unsichtbare Ebene: Rotkanal = Kfz-Kennziffer. */
export function drawPickCanvas(c: HTMLCanvasElement, r: Relief): void {
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.clearRect(0, 0, c.width, c.height);
  for (const f of PROVINCE_FC.features) {
    tracePath(ctx, r, f, c.width, c.height);
    ctx.fillStyle = `rgb(${f.properties.plaka},0,0)`;
    ctx.fill();
  }
}

export interface OverlayStyle {
  /** Füllfarbe je Kfz-Kennziffer (CSS); fehlt sie, zeigt das Brett die sieben Regionen */
  fill?: Record<number, string>;
  fillAlpha?: number;
  hover?: number;
  selected?: number;
}

/** Farben der sieben Regionen für die Kartenebene „Regionen“. */
export const REGION_COLORS: Record<string, string> = {
  Marmara: "#d9ab5e",
  Ege: "#a9bb6c",
  Akdeniz: "#e0915f",
  "İç Anadolu": "#e8cf85",
  Karadeniz: "#7fae7a",
  "Doğu Anadolu": "#a996c4",
  "Güneydoğu Anadolu": "#d58a78",
};

/** Die Türkei in der politischen Ansicht, wie ein Land in Hearts of Iron. */
export const NATION_COLOR = "#a8604a";

/** Nachbarn in eigenen, gedämpften Landesfarben. */
const COUNTRY_COLORS: Record<string, string> = {
  GRC: "#5b87bf", BGR: "#4f8f5c", SYR: "#9c7aa8", IRQ: "#b59a57", IRN: "#5f9468", GEO: "#b8625a", ARM: "#d4914a",
  AZE: "#4f93a8", RUS: "#8f3d3d", UKR: "#d2bd55", ROU: "#c9a94f", MDA: "#a3b35a", SRB: "#9b6a6a", MKD: "#cf7f47",
  ALB: "#a64b4b", MNE: "#8d8fb8", KOS: "#7fa0c8", BIH: "#6f8fb0", HRV: "#7aa0d0", HUN: "#6aa07a", SVK: "#8a8fc0",
  ITA: "#5f9a5f", LBN: "#5fa39a", ISR: "#6f8fcf", PSX: "#8faa6a", JOR: "#b08a64", EGY: "#c8b27c", LBY: "#7ea06a",
  SAU: "#6d9a52", KWT: "#8aa0a0", TKM: "#a0a86a", KAZ: "#6fa3c0", CYP: "#b9a07e", CYN: "#b9a07e",
};

/** Namen, die groß über das Land geschrieben werden, und wo (Länge, Breite, Größe). */
const COUNTRY_NAMES: { text: string; lon: number; lat: number; size: number; rot?: number }[] = [
  { text: "Türkiye", lon: 34.2, lat: 39.25, size: 120, rot: -0.02 },
  { text: "Griechenland", lon: 22.2, lat: 39.4, size: 44, rot: -0.35 },
  { text: "Bulgarien", lon: 25.3, lat: 42.75, size: 42 },
  { text: "Rumänien", lon: 25.5, lat: 45.3, size: 42 },
  { text: "Georgien", lon: 43.6, lat: 42.05, size: 36, rot: -0.1 },
  { text: "Armenien", lon: 44.9, lat: 40.25, size: 26 },
  { text: "Aserbaidschan", lon: 47.6, lat: 40.4, size: 30, rot: -0.1 },
  { text: "Iran", lon: 47.5, lat: 36.2, size: 64 },
  { text: "Irak", lon: 43.4, lat: 33.9, size: 60 },
  { text: "Syrien", lon: 38.4, lat: 35.0, size: 54 },
  { text: "Russland", lon: 43.0, lat: 44.8, size: 50 },
  { text: "Ukraine", lon: 32.5, lat: 46.6, size: 42 },
  { text: "Zypern", lon: 33.1, lat: 35.05, size: 26 },
  { text: "Libanon", lon: 35.95, lat: 33.9, size: 18, rot: -0.9 },
  { text: "Jordanien", lon: 36.6, lat: 31.6, size: 34 },
];

const REGION_OF: Record<number, string> = Object.fromEntries(PROVINZEN.map((p) => [p.plaka, p.region]));

/** Zwischenspeicher je Karte (Titelbild und Spiel haben eigene Zeichenflächen). */
const boardCache = new WeakMap<HTMLCanvasElement, { key: string; lines: HTMLCanvasElement }>();

/**
 * Zwei Ebenen: `fillCanvas` trägt die politischen Flächen und Namen (je nach Zoom kräftig
 * oder zart), `c` die Linien, Flüsse, Grenzen sowie Hover und Auswahl (immer voll).
 */
export function drawOverlay(c: HTMLCanvasElement, fillCanvas: HTMLCanvasElement, r: Relief, style: OverlayStyle): void {
  const ctx = c.getContext("2d")!;
  const W = c.width;
  const H = c.height;
  const key = JSON.stringify([W, style.fill ?? null, style.fillAlpha ?? null]);
  let cached = boardCache.get(fillCanvas);
  if (!cached || cached.key !== key) {
    const lines = cached?.lines ?? document.createElement("canvas");
    lines.width = W;
    lines.height = H;
    fillCanvas.width = W;
    fillCanvas.height = H;
    drawBoard(lines, fillCanvas, r, style);
    cached = { key, lines };
    boardCache.set(fillCanvas, cached);
  }
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(cached.lines, 0, 0);

  const find = (plaka: number | undefined) => (plaka ? PROVINCE_FC.features.find((x) => x.properties.plaka === plaka) : undefined);
  const hover = find(style.hover);
  if (hover && style.hover !== style.selected) {
    tracePath(ctx, r, hover, W, H);
    ctx.fillStyle = "rgba(255, 246, 220, 0.22)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 244, 214, 0.95)";
    ctx.lineWidth = 3.5 * K;
    ctx.stroke();
  }
  const sel = find(style.selected);
  if (sel) {
    // ausgewählte Provinz: goldener Doppelrand wie ein gesetzter Spielstein
    tracePath(ctx, r, sel, W, H);
    ctx.fillStyle = "rgba(255, 240, 200, 0.16)";
    ctx.fill();
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(30, 20, 12, 0.9)";
    ctx.lineWidth = 7 * K;
    ctx.stroke();
    ctx.strokeStyle = "rgba(241, 213, 143, 1)";
    ctx.lineWidth = 3 * K;
    ctx.stroke();
  }
}

function drawBoard(c: HTMLCanvasElement, fc: HTMLCanvasElement, r: Relief, style: OverlayStyle): void {
  const ctx = c.getContext("2d")!;
  const fill = fc.getContext("2d")!;
  const W = c.width;
  const H = c.height;
  const feats = PROVINCE_FC.features;
  ctx.clearRect(0, 0, W, H);
  fill.clearRect(0, 0, W, H);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const ringPath = (rings: number[][][], g: CanvasRenderingContext2D = ctx) => {
    g.beginPath();
    for (const ring of rings) {
      ring.forEach((pt, i) => {
        const [u, v] = lonLatToUv(r, pt[0]!, pt[1]!);
        if (i === 0) g.moveTo(u * W, v * H);
        else g.lineTo(u * W, v * H);
      });
      g.closePath();
    }
  };

  // Nachbarländer in ihren Farben, darüber ihre Grenzen
  const nb = neighbors as { countries: { iso: string; rings: number[][][] }[] };
  fill.globalAlpha = 0.62;
  for (const country of nb.countries) {
    ringPath(country.rings, fill);
    fill.fillStyle = COUNTRY_COLORS[country.iso] ?? "#9a9a8a";
    fill.fill();
  }
  fill.globalAlpha = 1;
  for (const country of nb.countries) {
    ringPath(country.rings);
    ctx.strokeStyle = "rgba(28, 20, 16, 0.75)";
    ctx.lineWidth = 2.6 * K;
    ctx.stroke();
  }

  // Die Türkei: Landesfarbe oder Farbe der Kartenebene
  const political = style.fill === undefined;
  fill.globalAlpha = political ? 0.62 : 1;
  for (const f of feats) {
    const col = political ? NATION_COLOR : style.fill![f.properties.plaka];
    if (!col) continue;
    tracePath(fill, r, f, W, H);
    fill.fillStyle = col;
    fill.fill();
  }
  fill.globalAlpha = 1;

  // Seen und Flüsse
  const w = water as { rivers: { rank: number; lines: number[][][] }[]; lakes: { rings: number[][][] }[] };
  for (const lake of w.lakes) {
    ringPath(lake.rings);
    ctx.fillStyle = "rgba(40, 78, 96, 1)";
    ctx.fill();
    ctx.strokeStyle = "rgba(170, 200, 205, 0.7)";
    ctx.lineWidth = 1.6 * K;
    ctx.stroke();
  }
  for (const river of w.rivers) {
    ctx.strokeStyle = "rgba(38, 86, 118, 0.95)";
    ctx.lineWidth = Math.max(1.6, 4.6 - river.rank * 0.45) * K;
    for (const line of river.lines) {
      ctx.beginPath();
      line.forEach((pt, i) => {
        const [u, v] = lonLatToUv(r, pt[0]!, pt[1]!);
        if (i === 0) ctx.moveTo(u * W, v * H);
        else ctx.lineTo(u * W, v * H);
      });
      ctx.stroke();
    }
  }

  // Provinzgrenzen: fein und gestrichelt, wie Staatsgrenzen in Hearts of Iron
  ctx.strokeStyle = "rgba(30, 18, 12, 0.5)";
  ctx.lineWidth = 1.4 * K;
  ctx.setLineDash([6 * K, 4 * K]);
  for (const f of feats) {
    tracePath(ctx, r, f, W, H);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Regionsgrenzen etwas kräftiger
  const regions = [...new Set(Object.values(REGION_OF))];
  const ringCanvas = document.createElement("canvas");
  ringCanvas.width = W;
  ringCanvas.height = H;
  const rctx = ringCanvas.getContext("2d")!;
  rctx.lineJoin = "round";
  for (const reg of regions) {
    const members = feats.filter((f) => REGION_OF[f.properties.plaka] === reg);
    rctx.globalCompositeOperation = "source-over";
    rctx.clearRect(0, 0, W, H);
    rctx.strokeStyle = "rgba(30, 18, 12, 0.6)";
    rctx.lineWidth = 3.4 * K;
    for (const f of members) {
      tracePath(rctx, r, f, W, H);
      rctx.stroke();
    }
    rctx.globalCompositeOperation = "destination-out";
    for (const f of members) {
      tracePath(rctx, r, f, W, H);
      rctx.fill();
    }
    ctx.drawImage(ringCanvas, 0, 0);
  }

  // Landesgrenze: Farbsaum nach innen und dunkle Linie, nur zum Ausland hin
  const layer = () => {
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    return [cv, cv.getContext("2d")!] as const;
  };
  const [foreign, fctx] = layer(); // alles außerhalb der Türkei
  fctx.fillRect(0, 0, W, H);
  fctx.globalCompositeOperation = "destination-out";
  for (const f of feats) {
    tracePath(fctx, r, f, W, H);
    fctx.fill();
  }
  const [near, nctx] = layer(); // Ausland, um einige Pixel ausgedehnt
  for (const [dx, dy] of [[0, 0], [-8, 0], [8, 0], [0, -8], [0, 8], [-6, -6], [6, 6], [-6, 6], [6, -6]]) nctx.drawImage(foreign, dx! * K, dy! * K);
  const [band, bctx] = layer();
  bctx.fillStyle = "rgba(160, 52, 36, 0.8)";
  for (const f of feats) {
    tracePath(bctx, r, f, W, H);
    bctx.fill();
  }
  bctx.globalCompositeOperation = "destination-in";
  bctx.drawImage(near, 0, 0);
  ctx.drawImage(band, 0, 0);
  const [line, lctx] = layer();
  lctx.strokeStyle = "rgba(22, 12, 8, 0.95)";
  lctx.lineWidth = 7 * K;
  lctx.lineJoin = "round";
  for (const f of feats) {
    tracePath(lctx, r, f, W, H);
    lctx.stroke();
  }
  lctx.globalCompositeOperation = "destination-in";
  lctx.drawImage(foreign, 0, 0);
  ctx.drawImage(line, 0, 0);

  // Große Ländernamen, gesperrt und leicht geschwungen, wie in Hearts of Iron
  for (const n of COUNTRY_NAMES) {
    const [u, v] = lonLatToUv(r, n.lon, n.lat);
    const text = n.text.toLocaleUpperCase("tr");
    const s = n.size * K;
    fill.save();
    fill.translate(u * W, v * H);
    fill.rotate(n.rot ?? 0);
    fill.font = `700 ${s}px 'Fraunces Variable', Georgia, serif`;
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round(s * 0.32)}px`;
    fill.textAlign = "center";
    fill.textBaseline = "middle";
    fill.lineWidth = Math.max(3, s * 0.06);
    fill.strokeStyle = "rgba(20, 12, 8, 0.35)";
    fill.strokeText(text, 0, 0);
    fill.fillStyle = n.text === "Türkiye" ? "rgba(255, 238, 214, 0.5)" : "rgba(250, 240, 222, 0.42)";
    fill.fillText(text, 0, 0);
    fill.restore();
  }
}

/** Schwerpunkt einer Provinz in Texturkoordinaten (für Beschriftungen). */
export function provinceCenters(r: Relief): Record<number, [number, number]> {
  const out: Record<number, [number, number]> = {};
  for (const f of PROVINCE_FC.features) {
    // größten Ring nehmen, dessen Mittelwert reicht für die Beschriftung
    const ring = rings(f).sort((a, b) => b.length - a.length)[0] ?? [];
    let su = 0;
    let sv = 0;
    for (const pt of ring) {
      const [u, v] = lonLatToUv(r, pt[0]!, pt[1]!);
      su += u;
      sv += v;
    }
    out[f.properties.plaka] = [su / ring.length, sv / ring.length];
  }
  return out;
}

/** Mittelpunkt einer Provinz in Länge und Breite, etwa für Kamerafahrten. */
export function provinceLonLat(plaka: number): [number, number] | undefined {
  const f = PROVINCE_FC.features.find((x) => x.properties.plaka === plaka);
  if (!f) return undefined;
  const ring = rings(f).sort((a, b) => b.length - a.length)[0] ?? [];
  let lon = 0;
  let lat = 0;
  for (const pt of ring) {
    lon += pt[0]!;
    lat += pt[1]!;
  }
  return [lon / ring.length, lat / ring.length];
}

/** Kfz-Kennziffer zu einem Provinznamen (türkische Schreibung). */
export function plakaByName(name: string): number | undefined {
  return PROVINCE_FC.features.find((f) => f.properties.name === name)?.properties.plaka;
}
