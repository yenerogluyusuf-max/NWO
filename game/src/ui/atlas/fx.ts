// Effektschicht der Karte: eine leichte Zeichenfläche über der Vektorebene für alles, was sich bewegt und nur wenige Pfade braucht:
// Hover (hebt die Provinz leicht an, Randlicht), Auswahl (goldener Umriss, der atmet), Ereignisringe, Funken bei Fertigstellung,
// Tinte beim Besitzerwechsel. Die schwere Vektorebene (Flächen, Straßen, Namen) bleibt dabei unberührt: Ein Hover kostet nur
// ein paar Pfade statt eines ganzen Bildes. Alles richtet sich nach der Effektstufe (anim/effekte.ts).

import { DAUER } from "../anim/dauer";
import { atmen, erschuetterung, klemme, sanftInOut, weichAus } from "../anim/easing";
import { bewegungsFaktor, leerlaufBilder, zierBewegung, type Effektstufe } from "../anim/effekte";
import { mitDeckkraft } from "../anim/farbe";
import { naehere } from "../anim/zeitgeber";
import type { KFlaeche } from "./daten";
import { huelle } from "./tinte";
import type { AtlasScene } from "./scene";
import type { VectorLayer } from "./vector";

export interface FxZiel {
  hover?: number;
  selected?: number;
  landAuswahl?: string;
  hoverLand?: string;
}

interface Licht {
  art: "provinz" | "land";
  id: number | string;
  hover: number;
  auswahl: number;
  hoverZiel: number;
  auswahlZiel: number;
}

interface Ring {
  start: number;
  dauer: number;
  u: number;
  v: number;
  farbe: string;
  /** Endradius als Anteil der Kartenbreite (Texturkoordinaten) */
  radius: number;
  anzahl: number;
}

interface Funke {
  start: number;
  dauer: number;
  u: number;
  v: number;
}

interface TintenLauf {
  start: number;
  dauer: number;
  flaechen: KFlaeche[];
  farbe: string;
  mitte: { u: number; v: number; r: number };
  fertig: () => void;
}

const GOLD = "241, 213, 143";

export class FxLayer {
  private ctx: CanvasRenderingContext2D;
  private cssW = 1;
  private cssH = 1;
  private dpr = 1;
  private lichter = new Map<string, Licht>();
  private ringe: Ring[] = [];
  private funken: Funke[] = [];
  private tinten: TintenLauf[] = [];
  private bebenLauf: { start: number; dauer: number; amp: number } | null = null;
  private letzteZeit = 0;
  private gezeichnet = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private atlas: AtlasScene,
    private vector: VectorLayer,
  ) {
    this.ctx = canvas.getContext("2d")!;
  }

  resize(cssW: number, cssH: number, dpr: number): void {
    this.cssW = cssW;
    this.cssH = cssH;
    this.dpr = dpr;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.gezeichnet = true;
  }

  // -------------------------------------------------------------------------
  // Eingaben

  private licht(art: "provinz" | "land", id: number | string): Licht {
    const k = `${art}:${id}`;
    let l = this.lichter.get(k);
    if (!l) {
      l = { art, id, hover: 0, auswahl: 0, hoverZiel: 0, auswahlZiel: 0 };
      this.lichter.set(k, l);
    }
    return l;
  }

  /** Setzt, was gerade hervorgehoben werden soll; die Helligkeit läuft weich nach. */
  setZiel(z: FxZiel, stufe: Effektstufe): void {
    for (const l of this.lichter.values()) {
      l.hoverZiel = 0;
      l.auswahlZiel = 0;
    }
    if (z.hover && z.hover !== z.selected) this.licht("provinz", z.hover).hoverZiel = 1;
    if (z.selected) this.licht("provinz", z.selected).auswahlZiel = 1;
    if (z.landAuswahl) this.licht("land", z.landAuswahl).auswahlZiel = 1;
    if (z.hoverLand && z.hoverLand !== z.landAuswahl) this.licht("land", z.hoverLand).hoverZiel = 1;
    if (stufe === "aus") for (const l of this.lichter.values()) {
      l.hover = l.hoverZiel;
      l.auswahl = l.auswahlZiel;
    }
    this.gezeichnet = true;
  }

  /** Ring auf der Karte (Ereignis, Beben, Anschlag): drei Wellen, die nach außen laufen. */
  ring(u: number, v: number, jetztMs: number, farbe = "rgba(196, 70, 52, 1)", radius = 0.045, dauerMs: number = DAUER.ring): void {
    this.ringe.push({ start: jetztMs, dauer: dauerMs, u, v, farbe, radius, anzahl: 3 });
  }

  /** Funken und ein heller Ring bei Fertigstellung. */
  funke(u: number, v: number, jetztMs: number): void {
    this.funken.push({ start: jetztMs, dauer: DAUER.funken, u, v });
    this.ring(u, v, jetztMs, "rgba(241, 213, 143, 1)", 0.02, DAUER.funken);
  }

  /** Kamera erschüttern (Beben). */
  beben(jetztMs: number, amplitude = 1, dauerMs: number = DAUER.beben): void {
    this.bebenLauf = { start: jetztMs, dauer: dauerMs, amp: amplitude };
  }

  /** Versatz der Kamera in Anteilen von 1 (mit der Kerngröße malnehmen); (0, 0), wenn nichts bebt. */
  schuettel(jetztMs: number): [number, number] {
    const b = this.bebenLauf;
    if (!b) return [0, 0];
    const t = jetztMs - b.start;
    if (t >= b.dauer) {
      this.bebenLauf = null;
      return [0, 0];
    }
    return [erschuetterung(t, b.dauer, 17) * b.amp, erschuetterung(t + 23, b.dauer, 23) * b.amp * 0.7];
  }

  /** Tinte läuft über die Flächen; `fertig` wird am Ende aufgerufen (dort wechselt der Besitzer in den Daten). */
  tinte(flaechen: KFlaeche[], farbe: string, jetztMs: number, dauerMs: number, fertig: () => void): void {
    this.tinten.push({ start: jetztMs, dauer: dauerMs, flaechen, farbe, mitte: huelle(flaechen, this.atlas.worldW / this.atlas.worldH), fertig });
  }

  // -------------------------------------------------------------------------
  // Zeichnen

  /** Läuft gerade eine Animation (Ring, Funken, Tinte, Beben, weiches Nachlaufen des Hovers)? Dann zeichnet die Karte jedes Bild. */
  laeuft(): boolean {
    if (this.ringe.length || this.funken.length || this.tinten.length || this.bebenLauf) return true;
    for (const l of this.lichter.values()) if (Math.abs(l.hover - l.hoverZiel) > 0.004 || Math.abs(l.auswahl - l.auswahlZiel) > 0.004) return true;
    return false;
  }

  /** Bebt die Kamera noch? */
  bebt(jetztMs: number): boolean {
    return !!this.bebenLauf && jetztMs - this.bebenLauf.start < this.bebenLauf.dauer;
  }

  /** Atmet eine Auswahl (ruhige Zierbewegung)? Dann reichen im Leerlauf wenige Bilder je Sekunde. */
  atmet(stufe: Effektstufe): boolean {
    if (!zierBewegung(stufe, true)) return false;
    for (const l of this.lichter.values()) if (l.auswahlZiel > 0) return true;
    return false;
  }

  /** Braucht die Schicht weitere Bilder? */
  aktiv(stufe: Effektstufe): boolean {
    return this.laeuft() || this.atmet(stufe);
  }

  /** Bilder je Sekunde, die die Schicht im Leerlauf braucht (Atmen); bei Bewegung zeichnet die Karte ohnehin jedes Bild. */
  leerlaufBilder(stufe: Effektstufe): number {
    return leerlaufBilder(stufe);
  }

  draw(jetztMs: number, stufe: Effektstufe): void {
    const ctx = this.ctx;
    const dt = this.letzteZeit ? Math.min(100, jetztMs - this.letzteZeit) : 16;
    this.letzteZeit = jetztMs;
    const etwas = this.aktiv(stufe);
    if (!etwas && !this.gezeichnet) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.cssW, this.cssH);
    this.gezeichnet = false;
    if (!etwas) return;
    this.vector.fxMatrixAktuell();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    const z = this.vector.fxLinienFaktor();
    const atem = zierBewegung(stufe, true) ? atmen(jetztMs, stufe === "hoch" ? 2200 : 3000) : 0.5;

    // Hover und Auswahl: Helligkeit läuft weich nach
    for (const [k, l] of this.lichter) {
      l.hover = stufe === "aus" ? l.hoverZiel : naehere(l.hover, l.hoverZiel, dt, DAUER.hover / 3);
      l.auswahl = stufe === "aus" ? l.auswahlZiel : naehere(l.auswahl, l.auswahlZiel, dt, DAUER.hover / 2.5);
      if (l.hover < 0.01 && l.auswahl < 0.01 && l.hoverZiel === 0 && l.auswahlZiel === 0) {
        this.lichter.delete(k);
        continue;
      }
      if (l.hover >= 0.01) this.zeichneHover(l, z, stufe);
      if (l.auswahl >= 0.01) this.zeichneAuswahl(l, z, stufe, atem);
    }

    // Tinte (Besitzerwechsel)
    for (let i = this.tinten.length - 1; i >= 0; i--) {
      const t = this.tinten[i]!;
      const p = klemme((jetztMs - t.start) / Math.max(1, t.dauer));
      this.zeichneTinte(t, sanftInOut(p), z);
      if (p >= 1) {
        this.tinten.splice(i, 1);
        t.fertig();
      }
    }

    // Ringe und Funken
    for (let i = this.ringe.length - 1; i >= 0; i--) {
      const r = this.ringe[i]!;
      const p = (jetztMs - r.start) / r.dauer;
      if (p >= 1) {
        this.ringe.splice(i, 1);
        continue;
      }
      this.zeichneRing(r, p, z, stufe);
    }
    for (let i = this.funken.length - 1; i >= 0; i--) {
      const f = this.funken[i]!;
      const p = (jetztMs - f.start) / f.dauer;
      if (p >= 1) {
        this.funken.splice(i, 1);
        continue;
      }
      this.zeichneFunken(f, p);
    }
    this.gezeichnet = true;
  }

  private zeichneHover(l: Licht, z: number, stufe: Effektstufe): void {
    const { ctx, vector } = this;
    const a = l.hover;
    const hebung = bewegungsFaktor(stufe) === 0 ? 0 : 2.5 * a;
    const pfad = (): boolean => (l.art === "provinz" ? vector.fxPfad(ctx, "provinz", l.id as number) : vector.fxPfad(ctx, "land", l.id as string));
    if (hebung > 0.05) {
      // Schatten unter der angehobenen Fläche
      ctx.save();
      ctx.translate(0, 3.2 * a);
      ctx.beginPath();
      if (pfad()) {
        ctx.fillStyle = `rgba(14, 8, 4, ${0.2 * a})`;
        ctx.fill("evenodd");
      }
      ctx.restore();
    }
    ctx.save();
    ctx.translate(0, -hebung);
    ctx.beginPath();
    if (pfad()) {
      ctx.fillStyle = `rgba(255, 246, 220, ${0.22 * a})`;
      ctx.fill("evenodd");
      if (stufe !== "aus") {
        ctx.shadowColor = `rgba(${GOLD}, ${0.85 * a})`;
        ctx.shadowBlur = 10 * a;
      }
      ctx.strokeStyle = `rgba(${GOLD}, ${0.95 * a})`;
      ctx.lineWidth = 1.8 * z;
      ctx.stroke();
    }
    ctx.restore();
  }

  private zeichneAuswahl(l: Licht, z: number, stufe: Effektstufe, atem: number): void {
    const { ctx, vector } = this;
    const a = l.auswahl;
    ctx.beginPath();
    const ok = l.art === "provinz" ? vector.fxPfad(ctx, "provinz", l.id as number) : vector.fxPfad(ctx, "land", l.id as string);
    if (!ok) return;
    ctx.fillStyle = `rgba(255, 240, 200, ${(0.12 + 0.06 * atem) * a})`;
    ctx.fill("evenodd");
    ctx.strokeStyle = `rgba(30, 20, 12, ${0.9 * a})`;
    ctx.lineWidth = 4.2 * z;
    ctx.stroke();
    ctx.save();
    if (stufe === "hoch") {
      ctx.shadowColor = `rgba(${GOLD}, ${(0.5 + 0.4 * atem) * a})`;
      ctx.shadowBlur = 6 + 9 * atem;
    }
    ctx.strokeStyle = `rgba(${GOLD}, ${(0.86 + 0.14 * atem) * a})`;
    ctx.lineWidth = (2.0 + 0.9 * atem) * z;
    ctx.stroke();
    ctx.restore();
  }

  /** Kreis auf der Karte (Bodenfläche) als Linienzug in Bildschirmkoordinaten: erscheint auf der geneigten Karte als Ellipse. */
  private bodenKreis(u: number, v: number, radius: number, schritte = 48): { x: number; y: number }[] | null {
    const { atlas } = this;
    const h = atlas.heightAt(u, v);
    const aspekt = atlas.worldW / atlas.worldH;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < schritte; i++) {
      const w = (i / schritte) * Math.PI * 2;
      // Radius in Texturbreiten; die Höhe der Karte wird mit dem Seitenverhältnis ausgeglichen, damit es auf dem Boden ein Kreis ist
      const p = atlas.project(u + Math.cos(w) * radius, v + (Math.sin(w) * radius) * aspekt, h);
      if (!p.sichtbar) return null;
      pts.push(p);
    }
    return pts;
  }

  private zeichneRing(r: Ring, p: number, z: number, stufe: Effektstufe): void {
    const { ctx } = this;
    for (let k = 0; k < r.anzahl; k++) {
      const pk = klemme((p - k * 0.17) / (1 - (r.anzahl - 1) * 0.17));
      if (pk <= 0 || pk >= 1) continue;
      const radius = r.radius * (0.15 + 0.85 * weichAus(pk));
      const pts = this.bodenKreis(r.u, r.v, radius);
      if (!pts) continue;
      ctx.beginPath();
      pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
      ctx.closePath();
      ctx.strokeStyle = mitDeckkraft(r.farbe, 0.9 * (1 - pk));
      ctx.lineWidth = (3.2 - 1.8 * pk) * z;
      if (stufe === "hoch") {
        ctx.shadowColor = mitDeckkraft(r.farbe, 0.6 * (1 - pk));
        ctx.shadowBlur = 8;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  private zeichneFunken(f: Funke, p: number): void {
    const { ctx, atlas } = this;
    const mitte = atlas.project(f.u, f.v);
    if (!mitte.sichtbar) return;
    const e = weichAus(p);
    ctx.fillStyle = `rgba(${GOLD}, ${1 - p})`;
    for (let i = 0; i < 16; i++) {
      const w = (i / 16) * Math.PI * 2 + (i % 2) * 0.2;
      const d = (14 + (i % 3) * 9) * e;
      const x = mitte.x + Math.cos(w) * d;
      const y = mitte.y + Math.sin(w) * d * 0.62 - 26 * p;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.2, 2.6 * (1 - p) + (i % 3) * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private zeichneTinte(t: TintenLauf, e: number, z: number): void {
    const { ctx, vector } = this;
    ctx.save();
    ctx.beginPath();
    if (!vector.fxPfadFlaechen(ctx, t.flaechen)) {
      ctx.restore();
      return;
    }
    ctx.clip("evenodd");
    // Der Kreis wächst über die Hülle der Flächen hinaus, damit die ganze Fläche gefüllt wird
    const radius = Math.max(1e-5, t.mitte.r * 1.25 * e);
    const pts = this.bodenKreis(t.mitte.u, t.mitte.v, radius, 72);
    if (pts) {
      ctx.beginPath();
      pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
      ctx.closePath();
      ctx.fillStyle = mitDeckkraft(t.farbe, 0.6);
      ctx.fill();
      // feuchter Rand der Tinte
      ctx.strokeStyle = `rgba(20, 10, 6, ${0.5 * (1 - e)})`;
      ctx.lineWidth = 2.4 * z;
      ctx.stroke();
    }
    ctx.restore();
  }
}
