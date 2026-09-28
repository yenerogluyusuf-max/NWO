// Zeichenebenen über dem Relief: Provinzflächen, Tintengrenzen, Landesmaske
// und eine unsichtbare Ebene, aus der sich die Provinz unter dem Mauszeiger ablesen lässt.

import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import raw from "../../data/provinzen.json";
import water from "../../data/gewaesser.json";
import { lonLatToUv, type Relief } from "./scene";

export interface ProvinceProps {
  id: string;
  plaka: number;
  name: string;
}

export const PROVINCE_FC = raw as unknown as FeatureCollection<Geometry, ProvinceProps>;

export const OVERLAY_W = 3200;

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
  /** Füllfarbe je Kfz-Kennziffer (CSS), leer = nur Grenzen */
  fill?: Record<number, string>;
  fillAlpha?: number;
  hover?: number;
  selected?: number;
}

/** Sichtbare Ebene: außerhalb der Türkei eine Papierlasur, innen Farben und Tintengrenzen. */
export function drawOverlay(c: HTMLCanvasElement, r: Relief, style: OverlayStyle): void {
  const ctx = c.getContext("2d")!;
  const W = c.width;
  const H = c.height;
  ctx.clearRect(0, 0, W, H);

  // Nachbarländer wie auf alten Karten: in Papierfarbe zurückgenommen
  ctx.save();
  ctx.fillStyle = "rgba(226, 214, 188, 0.62)";
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "destination-out";
  for (const f of PROVINCE_FC.features) {
    tracePath(ctx, r, f, W, H);
    ctx.fill();
  }
  ctx.restore();

  // Lasur je Provinz
  if (style.fill) {
    ctx.globalAlpha = style.fillAlpha ?? 0.5;
    for (const f of PROVINCE_FC.features) {
      const col = style.fill[f.properties.plaka];
      if (!col) continue;
      tracePath(ctx, r, f, W, H);
      ctx.fillStyle = col;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Seen: Wasserfläche mit Tintenrand
  const w = water as { rivers: { rank: number; lines: number[][][] }[]; lakes: { rings: number[][][] }[] };
  for (const lake of w.lakes) {
    ctx.beginPath();
    for (const ring of lake.rings) {
      ring.forEach((pt, i) => {
        const [u, v] = lonLatToUv(r, pt[0]!, pt[1]!);
        if (i === 0) ctx.moveTo(u * W, v * H);
        else ctx.lineTo(u * W, v * H);
      });
      ctx.closePath();
    }
    ctx.fillStyle = "rgba(120, 168, 180, 0.95)";
    ctx.fill();
    ctx.strokeStyle = "rgba(40, 60, 70, 0.8)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // Flüsse: blaue Tinte, große Flüsse breiter
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const river of w.rivers) {
    ctx.strokeStyle = "rgba(52, 96, 122, 0.85)";
    ctx.lineWidth = Math.max(1.2, 4.2 - river.rank * 0.45);
    for (const line of river.lines) {
      ctx.beginPath();
      line.forEach((pt, i) => {
        const [u, v] = lonLatToUv(r, pt[0]!, pt[1]!);
        const j = Math.sin(i * 7.31) * 0.8;
        if (i === 0) ctx.moveTo(u * W + j, v * H);
        else ctx.lineTo(u * W + j, v * H - j * 0.5);
      });
      ctx.stroke();
    }
  }

  // Provinzgrenzen: dünne, leicht zitternde Tintenlinien
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(60, 44, 34, 0.55)";
  ctx.lineWidth = 1.3;
  ctx.setLineDash([7, 3, 2, 3]);
  PROVINCE_FC.features.forEach((f, k) => {
    tracePath(ctx, r, f, W, H, 0.6, k);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Landesgrenze: breiter Farbsaum außen, wie auf politischen Karten.
  // Auf einer eigenen Ebene zeichnen und das Landesinnere wieder ausschneiden.
  const border = document.createElement("canvas");
  border.width = W;
  border.height = H;
  const bctx = border.getContext("2d")!;
  bctx.lineJoin = "round";
  bctx.strokeStyle = "rgba(150, 40, 32, 0.55)";
  bctx.lineWidth = 12;
  for (const f of PROVINCE_FC.features) {
    tracePath(bctx, r, f, W, H);
    bctx.stroke();
  }
  bctx.globalCompositeOperation = "destination-out";
  for (const f of PROVINCE_FC.features) {
    tracePath(bctx, r, f, W, H);
    bctx.fill();
  }
  ctx.drawImage(border, 0, 0);

  const outline = (plaka: number | undefined, color: string, width: number) => {
    if (!plaka) return;
    const f = PROVINCE_FC.features.find((x) => x.properties.plaka === plaka);
    if (!f) return;
    tracePath(ctx, r, f, W, H);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.fillStyle = color.replace(/[\d.]+\)$/, "0.12)");
    ctx.fill();
  };
  outline(style.hover, "rgba(250, 240, 210, 0.95)", 3);
  outline(style.selected, "rgba(40, 24, 18, 0.95)", 3.5);
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
