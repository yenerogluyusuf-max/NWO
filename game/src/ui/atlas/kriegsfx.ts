// Die Lage eines Krieges auf der Karte (Effektschicht, fx.ts), dezent im Stil von Civ und HOI: keine Explosionen, nur Bewegung, die die
// Richtung zeigt. Mit Effektstufe „aus“ steht alles still.
//
// Welle 3, K6 (krieg.md Schritt 10):
//   - Gehaltene Regionen liegen bündig in der Farbe der Türkei auf der Karte (NATION_COLOR, overlay.ts), besetzt mit feiner Schraffur,
//     annektiert ohne; innen nur feine Grenzen, damit sie wie ein Stück Land wirken und nicht wie einzelne Flecken.
//   - Die Front ist eine Linie entlang der Regionsgrenzen (ui/atlas/front.ts) mit Zähnen zum Gegner; in der Waffenruhe gestrichelt ohne
//     Zähne, nach dem Krieg als feine Besatzungslinie. Wo keine Landfront besteht (Inseln), bleibt die kurze Zackenlinie am Vorstoß.
//   - Zielregionen beim Gegner sind gestrichelt umrandet und leicht getönt, der übrige Schauplatz nur angedeutet.
//   - Verbände als Marken an der Front (wie in der 2D-Karte), umkämpfte Region in Ocker mit ruhig pulsierendem Rand.
// Dazu die Ortswahl (ortswahl.ts): Regionen nach Bewertung gefärbt, die Auswahl in Siegelrot, der Ort unter dem Zeiger hervorgehoben.

import type { AtlasScene } from "./scene";
import { BEWERTUNG_FARBE, rgba, type Bewertung } from "./ortswahl";

export interface KriegUvRegion {
  u: number;
  v: number;
  /** Radius in Texturkoordinaten (Breite) */
  r: number;
  lage: "gegner" | "umkaempft" | "eigen" | "besetzt";
  annexion?: boolean;
  /** Gehört zum Zielraum eines laufenden Krieges */
  ziel?: boolean;
  /** Fläche der Region als Ringe in Texturkoordinaten (aus der Karte); fehlt sie, gilt der Umkreis `r` */
  ringe?: [number, number][][];
  name: string;
}

export interface KriegUvLinie {
  art: "front" | "waffenruhe" | "linie";
  land: string;
  punkte: [number, number][];
  /** Je Abschnitt ein Punkt ein Stück weiter zum Gegner (Texturkoordinaten), daraus die Richtung der Zähne auf dem Bildschirm */
  feindPunkte: [number, number][];
}

export interface KriegUvVerband {
  u: number;
  v: number;
  seite: "eigen" | "gegner";
  art: "heer" | "luft" | "see";
  staerke: number;
  text: string;
}

export interface KriegUv {
  regionen: KriegUvRegion[];
  pfeile: { von: [number, number]; nach: [number, number]; seite: "eigen" | "gegner"; land?: string }[];
  /** Bedrohte Provinzen als Mittelpunkte (u, v) */
  bedroht: [number, number][];
  aktiv: boolean;
  linien?: KriegUvLinie[];
  /** Länder, für deren Krieg eine Frontlinie gezeichnet ist (dort entfällt die Zackenlinie am Pfeil) */
  mitLinie?: string[];
  verbaende?: KriegUvVerband[];
}

export interface OrtswahlUvRegion {
  id: string;
  name: string;
  u: number;
  v: number;
  ringe: [number, number][][];
  stil: Bewertung | "gewaehlt";
  hover: boolean;
}

type Pt = { x: number; y: number };

function bodenKreis(atlas: AtlasScene, u: number, v: number, radius: number, schritte = 40): Pt[] | null {
  const h = atlas.heightAt(u, v);
  const aspekt = atlas.worldW / atlas.worldH;
  const pts: Pt[] = [];
  for (let i = 0; i < schritte; i++) {
    const w = (i / schritte) * Math.PI * 2;
    // Leicht unregelmäßiger Rand, damit es nach Gebiet aussieht, nicht nach Zielscheibe (fest je Ort)
    const wellig = 1 + 0.12 * Math.sin(w * 3 + u * 900) + 0.07 * Math.sin(w * 5 + v * 700);
    const p = atlas.project(u + Math.cos(w) * radius * wellig, v + Math.sin(w) * radius * wellig * aspekt, h);
    if (!p.sichtbar) return null;
    pts.push(p);
  }
  return pts;
}

/** Die Ringe einer Region auf die Karte gebracht (jeder Punkt in seiner Bodenhöhe, damit Küsten deckungsgleich liegen); null, wenn ein Punkt außer Sicht liegt. */
function bodenRinge(atlas: AtlasScene, ringe: [number, number][][]): Pt[][] | null {
  const out: Pt[][] = [];
  for (const ring of ringe) {
    const pts: Pt[] = [];
    for (const [ru, rv] of ring) {
      const p = atlas.project(ru, rv);
      if (!p.sichtbar) return null;
      pts.push(p);
    }
    out.push(pts);
  }
  return out;
}

function pfadRinge(ctx: CanvasRenderingContext2D, ringe: Pt[][]): void {
  ctx.beginPath();
  for (const pts of ringe) {
    pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
    ctx.closePath();
  }
}

function pfad(ctx: CanvasRenderingContext2D, pts: Pt[]): void {
  ctx.beginPath();
  pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
  ctx.closePath();
}

function schraffur(ctx: CanvasRenderingContext2D, ringe: Pt[][], farbe: string, abstand: number, breite = 1): void {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of ringe.flat()) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
  }
  ctx.save();
  pfadRinge(ctx, ringe);
  ctx.clip();
  ctx.beginPath();
  for (let x = x0 - (y1 - y0); x < x1; x += abstand) {
    ctx.moveTo(x, y1);
    ctx.lineTo(x + (y1 - y0), y0);
  }
  ctx.strokeStyle = farbe;
  ctx.lineWidth = breite;
  ctx.stroke();
  ctx.restore();
}

/** Farbe der Türkei auf der Karte (overlay.ts NATION_COLOR #a8604a): gehaltenes Gebiet liegt bündig daran */
const NATION = "168, 96, 74";
const SIEGEL = "122, 26, 18";

/** Beschriftung auf der Karte mit hellem Rand (mindestens 13 px, Gestaltungsregel) */
function name(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, farbe: string, groesse: number, gewicht = 600): void {
  ctx.font = `italic ${gewicht} ${groesse.toFixed(1)}px 'Fraunces Variable', Georgia, 'Times New Roman', serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = "rgba(250, 244, 228, 0.92)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = farbe;
  ctx.fillText(text, x, y);
}

/** Frontlinie: heller Grund, kräftiger Strich, Zähne zum Gegner (im Krieg), gestrichelt in der Waffenruhe, fein als Besatzungslinie. */
function zeichneLinie(ctx: CanvasRenderingContext2D, atlas: AtlasScene, l: KriegUvLinie, z: number): void {
  const pts: Pt[] = [];
  const feind: Pt[] = [];
  for (let i = 0; i < l.punkte.length; i++) {
    const p = atlas.project(l.punkte[i]![0], l.punkte[i]![1]);
    if (!p.sichtbar) return;
    pts.push(p);
  }
  for (const f of l.feindPunkte) {
    const p = atlas.project(f[0], f[1]);
    feind.push(p);
  }
  const linie = () => {
    ctx.beginPath();
    pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
  };
  ctx.save();
  if (l.art === "linie") {
    linie();
    ctx.strokeStyle = "rgba(250, 244, 228, 0.6)";
    ctx.lineWidth = 3.4 * z;
    ctx.stroke();
    ctx.setLineDash([4 * z, 4 * z]);
    ctx.strokeStyle = `rgba(${SIEGEL}, 0.7)`;
    ctx.lineWidth = 1.5 * z;
    ctx.stroke();
    ctx.restore();
    return;
  }
  linie();
  ctx.strokeStyle = "rgba(250, 244, 228, 0.82)";
  ctx.lineWidth = 6 * z;
  ctx.stroke();
  if (l.art === "waffenruhe") ctx.setLineDash([9 * z, 6 * z]);
  ctx.strokeStyle = `rgba(${SIEGEL}, 0.95)`;
  ctx.lineWidth = 2.6 * z;
  ctx.stroke();
  ctx.setLineDash([]);
  if (l.art === "front") {
    // Zähne in gleichen Abständen entlang der Linie, zur Seite des Gegners
    const abstand = 15 * z;
    const g = 4.6 * z;
    let rest = abstand / 2;
    ctx.beginPath();
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!, b = pts[i + 1]!;
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 0.01) continue;
      const ux = dx / len, uy = dy / len;
      // Seite des Gegners auf dem Bildschirm aus dem Prüfpunkt des Abschnitts
      const f = feind[i];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      let nx = -uy, ny = ux;
      if (f && (f.x - mx) * nx + (f.y - my) * ny < 0) { nx = -nx; ny = -ny; }
      let s = rest;
      while (s < len) {
        const px = a.x + ux * s, py = a.y + uy * s;
        ctx.moveTo(px - ux * g * 0.6, py - uy * g * 0.6);
        ctx.lineTo(px + nx * g, py + ny * g);
        ctx.lineTo(px + ux * g * 0.6, py + uy * g * 0.6);
        s += abstand;
      }
      rest = s - len;
    }
    ctx.fillStyle = `rgba(${SIEGEL}, 0.95)`;
    ctx.fill();
  }
  ctx.restore();
}

/** Marke eines Verbands (vereinfacht nach den taktischen Zeichen der NATO, wie in der 2D-Karte); gibt das belegte Rechteck zurück. */
function zeichneVerband(ctx: CanvasRenderingContext2D, atlas: AtlasScene, v: KriegUvVerband, z: number): { x0: number; y0: number; x1: number; y1: number } | null {
  const p = atlas.project(v.u, v.v);
  if (!p.sichtbar) return null;
  const k = Math.min(1.25, Math.max(0.9, z));
  const w = 28 * k, h = 19 * k;
  const eigen = v.seite === "eigen";
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.shadowColor = "rgba(30, 20, 10, 0.35)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = eigen ? "#f6eedb" : "#3a3530";
  ctx.strokeStyle = eigen ? "#8e2a22" : "#1f1b17";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 2);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.stroke();
  ctx.strokeStyle = eigen ? "#8e2a22" : "#e8dfcc";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const a = eigen ? v.art : "heer";
  if (a === "heer") { ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.moveTo(-w / 2, h / 2); ctx.lineTo(w / 2, -h / 2); }
  else if (a === "luft") { ctx.moveTo(-8 * k, 1 * k); ctx.quadraticCurveTo(-4 * k, -6 * k, 0, 1 * k); ctx.quadraticCurveTo(4 * k, 8 * k, 8 * k, 1 * k); }
  else { ctx.moveTo(-8 * k, 2 * k); ctx.quadraticCurveTo(-4 * k, -4 * k, 0, 2 * k); ctx.quadraticCurveTo(4 * k, 8 * k, 8 * k, 2 * k); }
  ctx.stroke();
  ctx.font = `600 ${(13 * k).toFixed(1)}px 'EB Garamond Variable', Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(246, 238, 219, 0.95)";
  ctx.strokeText(v.text, 0, h / 2 + 2);
  ctx.fillStyle = eigen ? "#5c1a12" : "#2a1f18";
  ctx.fillText(v.text, 0, h / 2 + 2);
  ctx.restore();
  return { x0: p.x - w / 2 - 2, y0: p.y - h / 2 - 2, x1: p.x + w / 2 + 2, y1: p.y + h / 2 + 18 * k };
}

/** Zeichnet die Kriegslage. `bewegung` = Zierbewegung erlaubt (Effektstufe), `z` = Linienfaktor der Karte. */
export function zeichneKrieg(ctx: CanvasRenderingContext2D, atlas: AtlasScene, lage: KriegUv, jetztMs: number, z: number, bewegung: boolean): void {
  const puls = bewegung ? 0.5 + 0.5 * Math.sin(jetztMs / 520) : 0.6;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const flaechen = lage.regionen.map((r) => {
    const kreis = r.ringe ? null : bodenKreis(atlas, r.u, r.v, r.r);
    return { r, pts: r.ringe ? bodenRinge(atlas, r.ringe) : kreis ? [kreis] : null };
  });

  // 1. Schauplatz beim Gegner: Zielregionen getönt und gestrichelt, der Rest nur angedeutet
  for (const { r, pts } of flaechen) {
    if (!pts || r.lage !== "gegner") continue;
    pfadRinge(ctx, pts);
    if (r.ziel) {
      ctx.fillStyle = "rgba(60, 56, 50, 0.13)";
      ctx.fill();
      ctx.strokeStyle = "rgba(60, 56, 50, 0.62)";
      ctx.lineWidth = 1.2 * z;
      ctx.setLineDash([5 * z, 3 * z]);
    } else {
      ctx.strokeStyle = "rgba(60, 56, 50, 0.32)";
      ctx.lineWidth = 0.9 * z;
      ctx.setLineDash([3 * z, 3 * z]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 2. Gehaltenes Gebiet bündig: eine Fläche in der Farbe der Türkei, besetzt schraffiert, innen feine Grenzen
  const gehalten = flaechen.filter((f) => f.pts && (f.r.lage === "eigen" || f.r.lage === "besetzt"));
  if (gehalten.length) {
    ctx.beginPath();
    for (const { pts } of gehalten) for (const ring of pts!) ring.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
    ctx.fillStyle = `rgba(${NATION}, 0.62)`;
    ctx.fill();
    for (const { r, pts } of gehalten) {
      if (!r.annexion) schraffur(ctx, pts!, `rgba(${SIEGEL}, 0.32)`, 7 * z, 1.1);
      pfadRinge(ctx, pts!);
      ctx.strokeStyle = `rgba(${SIEGEL}, 0.32)`;
      ctx.lineWidth = 0.9 * z;
      ctx.stroke();
    }
  }

  // 3. Umkämpft: Ocker mit ruhig pulsierendem Rand
  for (const { r, pts } of flaechen) {
    if (!pts || r.lage !== "umkaempft") continue;
    pfadRinge(ctx, pts);
    ctx.fillStyle = `rgba(196, 140, 48, ${(0.22 + 0.14 * puls).toFixed(3)})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(176, 112, 30, ${(0.55 + 0.4 * puls).toFixed(3)})`;
    ctx.lineWidth = (1.1 + 0.7 * puls) * Math.min(z, 1.6);
    ctx.setLineDash([5 * z, 4 * z]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 4. Bedrohte Provinzen: Warnring
  for (const [u, v] of lage.bedroht) {
    const pts = bodenKreis(atlas, u, v, 0.006, 32);
    if (!pts) continue;
    pfad(ctx, pts);
    ctx.strokeStyle = `rgba(150, 38, 28, ${(0.45 + 0.4 * puls).toFixed(3)})`;
    ctx.lineWidth = 2 * z;
    ctx.setLineDash([6 * z, 4 * z]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 5. Frontlinien entlang der Regionsgrenzen
  for (const l of lage.linien ?? []) zeichneLinie(ctx, atlas, l, z);

  // 6. Vorstoßpfeile; die kurze Zackenlinie an der Spitze nur, wo keine Linie die Front zeigt (etwa auf Inseln)
  const mitLinie = new Set(lage.mitLinie ?? []);
  for (const p of lage.pfeile) {
    const a = atlas.project(p.von[0], p.von[1]);
    const b = atlas.project(p.nach[0], p.nach[1]);
    if (!a.sichtbar || !b.sichtbar) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const laenge = Math.hypot(dx, dy);
    if (laenge < 8) continue;
    // Bogen: Kontrollpunkt seitlich der Mitte
    const nx = -dy / laenge;
    const ny = dx / laenge;
    const c = { x: (a.x + b.x) / 2 + nx * laenge * 0.18, y: (a.y + b.y) / 2 + ny * laenge * 0.18 };
    // Endpunkt etwas vor dem Ziel, damit die Spitze am Rand der Region sitzt
    const t1 = 0.86;
    const ende = { x: (1 - t1) ** 2 * a.x + 2 * (1 - t1) * t1 * c.x + t1 ** 2 * b.x, y: (1 - t1) ** 2 * a.y + 2 * (1 - t1) * t1 * c.y + t1 ** 2 * b.y };
    const tx = 2 * (1 - t1) * (c.x - a.x) + 2 * t1 * (b.x - c.x);
    const ty = 2 * (1 - t1) * (c.y - a.y) + 2 * t1 * (b.y - c.y);
    const tl = Math.hypot(tx, ty) || 1;
    const ux = tx / tl;
    const uy = ty / tl;
    const farbe = p.seite === "eigen" ? "150, 38, 28" : "40, 44, 58";
    // Schaft: breiter, halbdurchsichtiger Grund und ein laufender Strich darauf
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(c.x, c.y, ende.x, ende.y);
    ctx.strokeStyle = `rgba(${farbe}, 0.28)`;
    ctx.lineWidth = 7 * z;
    ctx.stroke();
    ctx.setLineDash([9 * z, 7 * z]);
    ctx.lineDashOffset = bewegung ? -((jetztMs / 40) % (16 * z)) : 0;
    ctx.strokeStyle = `rgba(${farbe}, 0.85)`;
    ctx.lineWidth = 2.4 * z;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    // Spitze
    const s = 11 * z;
    ctx.beginPath();
    ctx.moveTo(ende.x + ux * s * 0.9, ende.y + uy * s * 0.9);
    ctx.lineTo(ende.x - uy * s * 0.6, ende.y + ux * s * 0.6);
    ctx.lineTo(ende.x + uy * s * 0.6, ende.y - ux * s * 0.6);
    ctx.closePath();
    ctx.fillStyle = `rgba(${farbe}, 0.92)`;
    ctx.fill();
    if (p.land && mitLinie.has(p.land)) continue;
    // Frontabschnitt quer zur Stoßrichtung, mit Zacken zur Seite des Angreifers (HOI-Frontlinie)
    const fx = ende.x + ux * s * 1.3;
    const fy = ende.y + uy * s * 1.3;
    const halb = 22 * z;
    ctx.beginPath();
    const zacken = 6;
    for (let i = 0; i <= zacken; i++) {
      const q = -halb + (2 * halb * i) / zacken;
      const px = fx - uy * q;
      const py = fy + ux * q;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
      if (i < zacken) {
        const qm = q + halb / zacken;
        ctx.lineTo(fx - uy * qm - ux * 4 * z, fy + ux * qm - uy * 4 * z);
      }
    }
    ctx.strokeStyle = `rgba(${farbe}, 0.9)`;
    ctx.lineWidth = 1.8 * z;
    ctx.stroke();
  }

  // 7. Verbände an der Front
  const marken: { x0: number; y0: number; x1: number; y1: number }[] = [];
  for (const v of lage.verbaende ?? []) {
    const r = zeichneVerband(ctx, atlas, v, z);
    if (r) marken.push(r);
  }

  // 8. Namen: gehalten und umkämpft kräftig, Zielregionen beim Gegner leiser; ein Name unter einer Marke rückt über sie
  const groesse = Math.max(13, 12 * Math.min(1.4, z));
  for (const r of lage.regionen) {
    if (r.lage === "gegner" && !r.ziel) continue;
    const p = atlas.project(r.u, r.v);
    if (!p.sichtbar) continue;
    ctx.font = `italic 650 ${groesse.toFixed(1)}px 'Fraunces Variable', Georgia, serif`;
    const hb = ctx.measureText(r.name).width / 2 + 3;
    let y = p.y;
    for (const m of marken) if (p.x + hb > m.x0 && p.x - hb < m.x1 && y + groesse / 2 > m.y0 && y - groesse / 2 < m.y1) y = m.y0 - groesse / 2 - 3;
    name(ctx, r.name, p.x, y, r.lage === "umkaempft" ? "#6a4410" : r.lage === "gegner" ? "#4a3e32" : "#5c1a12", groesse, r.lage === "gegner" ? 500 : 650);
  }
  ctx.restore();
}

/** Ortswahl über der Karte: jede wählbare Region nach Bewertung, die Auswahl kräftig, der Ort unter dem Zeiger hervorgehoben. */
export function zeichneOrtswahl(ctx: CanvasRenderingContext2D, atlas: AtlasScene, regionen: OrtswahlUvRegion[], z: number): void {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const reihenfolge: (Bewertung | "gewaehlt")[] = ["gesperrt", "erfuellt", "moeglich", "gut", "gewaehlt"];
  const sortiert = [...regionen].sort((a, b) => reihenfolge.indexOf(a.stil) - reihenfolge.indexOf(b.stil) || Number(a.hover) - Number(b.hover));
  for (const r of sortiert) {
    const pts = bodenRinge(atlas, r.ringe);
    if (!pts) continue;
    const f = BEWERTUNG_FARBE[r.stil];
    pfadRinge(ctx, pts);
    ctx.fillStyle = rgba(f.fuell, Math.min(0.8, f.fuell[3] + (r.hover ? 0.14 : 0)));
    ctx.fill();
    if (r.stil === "gesperrt") schraffur(ctx, pts, "rgba(90, 84, 76, 0.22)", 6 * z);
    pfadRinge(ctx, pts);
    if (r.hover || r.stil === "gewaehlt") {
      ctx.strokeStyle = "rgba(250, 244, 228, 0.9)";
      ctx.lineWidth = (f.strich + 3) * z;
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(f.rand);
    ctx.lineWidth = (f.strich + (r.hover ? 1 : 0)) * z;
    if (r.stil === "moeglich") ctx.setLineDash([5 * z, 3 * z]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  const groesse = Math.max(13, 12.5 * Math.min(1.4, z));
  for (const r of sortiert) {
    const p = atlas.project(r.u, r.v);
    if (!p.sichtbar) continue;
    const farbe = r.stil === "gewaehlt" ? "#5c1a12" : r.stil === "gesperrt" ? "#5a4a38" : r.stil === "erfuellt" ? "#5c2a1a" : "#3a2a12";
    name(ctx, r.name, p.x, p.y, farbe, groesse + (r.stil === "gewaehlt" || r.hover ? 1 : 0), r.stil === "gewaehlt" ? 700 : r.stil === "gesperrt" ? 500 : 600);
  }
  ctx.restore();
}
