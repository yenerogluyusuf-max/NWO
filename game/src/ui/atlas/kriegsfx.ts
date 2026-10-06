// Die Lage eines Krieges auf der Karte (Effektschicht, fx.ts): Regionen als Fläche um ihren Ort (eigen = Siegelrot, umkämpft = Ocker mit
// pulsierendem Rand, beim Gegner = graue Strichlinie, besetzt = schraffiert), ein Frontabschnitt mit Zacken an jeder umkämpften Stelle
// und gebogene Pfeile für die Vorstöße (eigene rot, gegnerische dunkel), deren Strich langsam läuft. Dezent im Stil von Civ und HOI:
// keine Explosionen, nur Bewegung, die die Richtung zeigt. Mit Effektstufe „aus“ steht alles still.

import type { AtlasScene } from "./scene";

export interface KriegUvRegion {
  u: number;
  v: number;
  /** Radius in Texturkoordinaten (Breite) */
  r: number;
  lage: "gegner" | "umkaempft" | "eigen" | "besetzt";
  annexion?: boolean;
  name: string;
}

export interface KriegUv {
  regionen: KriegUvRegion[];
  pfeile: { von: [number, number]; nach: [number, number]; seite: "eigen" | "gegner" }[];
  /** Bedrohte Provinzen als Mittelpunkte (u, v) */
  bedroht: [number, number][];
  aktiv: boolean;
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

function pfad(ctx: CanvasRenderingContext2D, pts: Pt[]): void {
  ctx.beginPath();
  pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
  ctx.closePath();
}

function schraffur(ctx: CanvasRenderingContext2D, pts: Pt[], farbe: string, abstand: number): void {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of pts) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
  }
  ctx.save();
  pfad(ctx, pts);
  ctx.clip();
  ctx.beginPath();
  for (let x = x0 - (y1 - y0); x < x1; x += abstand) {
    ctx.moveTo(x, y1);
    ctx.lineTo(x + (y1 - y0), y0);
  }
  ctx.strokeStyle = farbe;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/** Zeichnet die Kriegslage. `bewegung` = Zierbewegung erlaubt (Effektstufe), `z` = Linienfaktor der Karte. */
export function zeichneKrieg(ctx: CanvasRenderingContext2D, atlas: AtlasScene, lage: KriegUv, jetztMs: number, z: number, bewegung: boolean): void {
  const puls = bewegung ? 0.5 + 0.5 * Math.sin(jetztMs / 520) : 0.6;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // 1. Regionen
  for (const r of lage.regionen) {
    const pts = bodenKreis(atlas, r.u, r.v, r.r);
    if (!pts) continue;
    pfad(ctx, pts);
    if (r.lage === "eigen") {
      ctx.fillStyle = "rgba(150, 38, 28, 0.34)";
      ctx.fill();
      ctx.strokeStyle = "rgba(120, 28, 20, 0.85)";
      ctx.lineWidth = 1.6 * z;
      ctx.stroke();
    } else if (r.lage === "besetzt") {
      ctx.fillStyle = r.annexion ? "rgba(150, 38, 28, 0.42)" : "rgba(150, 38, 28, 0.16)";
      ctx.fill();
      if (!r.annexion) schraffur(ctx, pts, "rgba(120, 28, 20, 0.55)", 6 * z);
      ctx.strokeStyle = "rgba(120, 28, 20, 0.8)";
      ctx.lineWidth = 1.3 * z;
      ctx.setLineDash([5 * z, 3 * z]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (r.lage === "umkaempft") {
      ctx.fillStyle = `rgba(196, 140, 48, ${(0.18 + 0.14 * puls).toFixed(3)})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(176, 112, 30, ${(0.55 + 0.4 * puls).toFixed(3)})`;
      ctx.lineWidth = (1.8 + 1.2 * puls) * z;
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(60, 56, 50, 0.08)";
      ctx.fill();
      ctx.strokeStyle = "rgba(60, 56, 50, 0.45)";
      ctx.lineWidth = 1 * z;
      ctx.setLineDash([3 * z, 3 * z]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // 2. Bedrohte Provinzen: Warnring
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

  // 3. Vorstoßpfeile mit Frontabschnitt an der Spitze
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

  // 4. Namen der Regionen, die etwas bedeuten (eigen, umkämpft, besetzt)
  ctx.font = `italic 600 ${(11 * Math.min(1.4, z)).toFixed(1)}px 'Fraunces Variable', Georgia, 'Times New Roman', serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const r of lage.regionen) {
    if (r.lage === "gegner") continue;
    const p = atlas.project(r.u, r.v);
    if (!p.sichtbar) continue;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(250, 244, 228, 0.9)";
    ctx.strokeText(r.name, p.x, p.y);
    ctx.fillStyle = r.lage === "umkaempft" ? "#6a4410" : "#5c1a12";
    ctx.fillText(r.name, p.x, p.y);
  }
  ctx.restore();
}
