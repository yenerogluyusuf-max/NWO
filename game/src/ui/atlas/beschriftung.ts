// Beschriftung der Karte: Länder, Meere, Gebirge, Städte, Gipfel, Inseln, Seen und Flüsse, dazu Gradnetz und Maßstab.
// Alles wird pro Bild in die Vektorebene gezeichnet. Große, gesperrte Namen (Länder, Meere, Gebirge) liegen als Hintergrund
// und weichen nur einander aus; Städte, Gipfel und kleine Namen belegen Rechtecke und verdrängen einander nach Rang.
// Daten: public/data/karte/orte.json (tools/geodaten/karte_daten.py).

import { lonLatToUv, type AtlasScene, type Relief } from "./scene";
import type { KBesitzer } from "./daten";

interface Ort { n: string; lon: number; lat: number; pop: number; k: "h" | "s" | "o"; mz: number; l: string }
interface Gipfel { n: string; lon: number; lat: number; ele: number; mz: number }
interface Flaeche { n: string; lon: number; lat: number; rot: number; gr: number }
interface Insel { n: string; lon: number; lat: number; mz: number }
interface See { n: string; lon: number; lat: number; mz: number }
interface Fluss { n: string; lon: number; lat: number; lon2: number; lat2: number; mz: number }
interface OrteDaten { orte: Ort[]; gipfel: Gipfel[]; meere: Flaeche[]; gebirge: Flaeche[]; inseln: Insel[]; seen: See[]; fluesse: Fluss[] }

type Rect = { x: number; y: number; w: number; h: number };

export interface BeschriftungsOptionen {
  cssW: number;
  cssH: number;
  /** Bildpunkte je Längengrad in der Bildmitte */
  pxGrad: number;
  /** Ebene „Welt“: Ländernamen kräftiger */
  welt: boolean;
  /** Von Beschriftungen der Oberfläche (Stadtschilder) belegte Rechtecke */
  reserviert: Rect[];
  /** Namen, die schon anders dargestellt werden (z. B. vom Rahmen übergebene Meeresnamen) */
  ausgeblendet?: Set<string>;
}

const SERIF = "'Fraunces Variable', Georgia, 'Times New Roman', serif";
const NAMENSZEICHEN = new Map<string, number>();

function fuenfer(x: number) {
  return Math.max(0, Math.min(1, x));
}

export class Beschriftung {
  private daten: OrteDaten | null = null;
  private laender: KBesitzer[] = [];
  private anker: Record<string, number[]> = {};
  /** vorberechnete Texturkoordinaten je Eintrag */
  private uv = new Map<object, [number, number]>();
  private uv2 = new Map<object, [number, number]>();
  private breiten = new Map<string, number>();
  private ctx!: CanvasRenderingContext2D;
  /** Die im letzten Bild gesetzten Namen mit ihren Rechtecken (für Prüfungen der Überschneidung) */
  platziert: { art: string; text: string; rects: Rect[]; hinten: boolean }[] = [];

  constructor(
    private atlas: AtlasScene,
    private relief: Relief,
  ) {}

  async lade(): Promise<boolean> {
    try {
      const r = await fetch("/data/karte/orte.json");
      if (!r.ok) return false;
      const d = (await r.json()) as OrteDaten;
      this.daten = d;
      const setze = (list: { lon: number; lat: number }[]) => list.forEach((o) => this.uv.set(o, lonLatToUv(this.relief, o.lon, o.lat)));
      setze(d.orte);
      setze(d.gipfel);
      setze(d.meere);
      setze(d.gebirge);
      setze(d.inseln);
      setze(d.seen);
      setze(d.fluesse);
      for (const f of d.fluesse) this.uv2.set(f, lonLatToUv(this.relief, f.lon2, f.lat2));
      performance.mark("karte-orte-geladen");
      return true;
    } catch {
      return false;
    }
  }

  setLaender(laender: KBesitzer[], anker: Record<string, number[]>) {
    this.laender = laender;
    this.anker = anker;
  }

  bereit(): boolean {
    return this.daten !== null;
  }

  // -------------------------------------------------------------------------
  // Hilfen

  private breite(font: string, text: string): number {
    const k = font + "|" + text;
    let w = this.breiten.get(k);
    if (w === undefined) {
      this.ctx.font = font;
      w = this.ctx.measureText(text).width;
      this.breiten.set(k, w);
    }
    return w;
  }

  private zeichenBreite(font: string, ch: string): number {
    const k = font + "#" + ch;
    let w = NAMENSZEICHEN.get(k);
    if (w === undefined) {
      this.ctx.font = font;
      w = this.ctx.measureText(ch).width;
      NAMENSZEICHEN.set(k, w);
    }
    return w;
  }

  /** Gesperrter Text, Mitte auf (0, 0); liefert die Gesamtbreite. */
  private gesperrt(text: string, font: string, gap: number, zeichnen: boolean, fuellung?: string, kontur?: string, konturBreite = 2): number {
    const { ctx } = this;
    let total = 0;
    const zeichen = Array.from(text);
    for (const ch of zeichen) total += this.zeichenBreite(font, ch) + gap;
    total -= gap;
    if (!zeichnen) return total;
    ctx.font = font;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    let x = -total / 2;
    if (kontur) {
      ctx.lineWidth = konturBreite;
      ctx.strokeStyle = kontur;
    }
    if (fuellung) ctx.fillStyle = fuellung;
    for (const ch of zeichen) {
      if (kontur) ctx.strokeText(ch, x, 0);
      if (fuellung) ctx.fillText(ch, x, 0);
      x += this.zeichenBreite(font, ch) + gap;
    }
    return total;
  }

  private static ueberlappt(a: Rect, b: Rect, luft = 0): boolean {
    return a.x < b.x + b.w + luft && a.x + a.w + luft > b.x && a.y < b.y + b.h + luft && a.y + a.h + luft > b.y;
  }

  // -------------------------------------------------------------------------
  // Zeichnen

  draw(ctx: CanvasRenderingContext2D, o: BeschriftungsOptionen): void {
    if (!this.daten) return;
    this.ctx = ctx;
    this.platziert = [];
    const { cssW: W, cssH: H, pxGrad } = o;
    const d = this.daten;
    const atlas = this.atlas;
    const sichtbar = (x: number, y: number, rand = 30) => x > -rand && x < W + rand && y > -rand && y < H + rand;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    this.gradnetz(o);

    // --- Hintergrundnamen: Länder, Gebirge, große Meere; sie weichen nur einander aus
    const hinten: Rect[] = [];
    const platziereHinten = (r: Rect, art = "name", text = "") => {
      for (const b of hinten) if (Beschriftung.ueberlappt(r, b, 4)) return false;
      hinten.push(r);
      this.platziert.push({ art, text, rects: [r], hinten: true });
      return true;
    };
    const pxKm = pxGrad / 90;
    const imBild = (r: Rect) => r.x >= 96 && r.x + r.w <= W - 18 && r.y >= 74 && r.y + r.h <= H - 64;

    // Meere
    for (const m of d.meere) {
      if (o.ausgeblendet?.has(m.n.toLowerCase())) continue;
      const bereich: Record<number, [number, number]> = { 1: [0, 300], 2: [0, 340], 3: [45, 520], 4: [110, 1200], 5: [170, 1400] };
      const [a, b] = bereich[m.gr] ?? [0, 400];
      if (pxGrad < a || pxGrad > b) continue;
      const uv = this.uv.get(m)!;
      const p = atlas.project(uv[0], uv[1], 0);
      if (!p.sichtbar || !sichtbar(p.x, p.y, 80)) continue;
      const basis = m.gr === 1 ? 27 : m.gr === 2 ? 21 : m.gr === 3 ? 16 : m.gr === 4 ? 13 : 11;
      const groesse = basis * Math.max(0.85, Math.min(2.1, Math.pow(pxGrad / 75, 0.55)));
      const font = `italic 400 ${groesse.toFixed(1)}px ${SERIF}`;
      const gap = groesse * (m.gr <= 2 ? 0.34 : 0.2);
      const br = this.gesperrt(m.n, font, gap, false);
      const alpha = fuenfer(Math.min((pxGrad - a) / 25 + 0.3, (b - pxGrad) / (b * 0.25)));
      const cos = Math.cos(m.rot);
      const sin = Math.abs(Math.sin(m.rot));
      const rect = { x: p.x - (br * cos + groesse * sin) / 2, y: p.y - (br * sin + groesse * cos) / 2, w: br * cos + groesse * sin, h: br * sin + groesse * cos };
      if (!imBild(rect) || !platziereHinten(rect, "meer", m.n)) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(m.rot);
      this.gesperrt(m.n, font, gap, true, `rgba(206, 228, 232, ${0.78 * alpha})`, `rgba(8, 20, 30, ${0.4 * alpha})`, Math.max(2, groesse * 0.08));
      ctx.restore();
    }

    // Gebirge
    for (const m of d.gebirge) {
      const [a, b] = m.gr === 1 ? [30, 200] : [80, 330];
      if (pxGrad < a || pxGrad > b) continue;
      const uv = this.uv.get(m)!;
      const p = atlas.project(uv[0], uv[1]);
      if (!p.sichtbar || !sichtbar(p.x, p.y, 60)) continue;
      const groesse = (m.gr === 1 ? 19 : 14) * Math.max(0.85, Math.min(1.9, Math.pow(pxGrad / 75, 0.5)));
      const font = `italic 600 ${groesse.toFixed(1)}px ${SERIF}`;
      const gap = groesse * 0.3;
      const br = this.gesperrt(m.n.toLocaleUpperCase("de"), font, gap, false);
      const alpha = fuenfer(Math.min((pxGrad - a) / 20 + 0.2, (b - pxGrad) / 40));
      const cos = Math.cos(m.rot);
      const sin = Math.abs(Math.sin(m.rot));
      const rect = { x: p.x - (br * cos + groesse * sin) / 2, y: p.y - (br * sin + groesse * cos) / 2, w: br * cos + groesse * sin, h: br * sin + groesse * cos };
      if (!imBild(rect) || !platziereHinten(rect, "gebirge", m.n)) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(m.rot);
      this.gesperrt(m.n.toLocaleUpperCase("de"), font, gap, true, `rgba(244, 226, 196, ${0.5 * alpha})`, `rgba(46, 26, 12, ${0.4 * alpha})`, Math.max(2, groesse * 0.1));
      ctx.restore();
    }

    // Länder: der Name folgt dem sichtbaren Teil des Landes
    const laenderListe: { name: string; tr: boolean; flaeche: number; anker: number[]; lon: number; lat: number }[] = [
      { name: "Türkiye", tr: true, flaeche: 780000, anker: this.anker.TUR ?? [], lon: 34.3, lat: 39.1 },
    ];
    for (const l of this.laender) {
      if (!l.iso || !l.name || l.iso === "HRV" || l.iso === "HUN" || l.iso === "CYN") continue;
      laenderListe.push({ name: l.name, tr: false, flaeche: l.flaeche ?? 10000, anker: this.anker[l.iso] ?? [], lon: l.lon ?? 0, lat: l.lat ?? 0 });
    }
    for (const l of laenderListe) {
      const wurzel = Math.sqrt(l.flaeche) * pxKm;
      const groesse = Math.max(9, Math.min(l.tr ? 120 : 56, wurzel * (l.tr ? 0.15 : 0.105)));
      // Beim Hineinzoomen treten die Ländernamen zurück, damit sie die Karte nicht zudecken
      const alpha = fuenfer((330 - groesse) / 160) * (l.tr ? fuenfer((185 - pxGrad) / 65) : fuenfer((320 - pxGrad) / 110));
      if (alpha <= 0.02) continue;
      if (wurzel < 55) continue;
      const text = l.tr ? l.name.toLocaleUpperCase("tr") : l.name.toLocaleUpperCase("de");
      const fest = Math.max(1, Math.min(2, groesse / 30));
      // Ankerpunkte vom größten Abstand zur Grenze an durchprobieren: Der Name muss in den sichtbaren Landesteil und ins Bild passen
      const punkte = l.anker.length ? l.anker : [l.lon, l.lat, 0.4];
      const text0 = text;
      for (let i = 0; i < punkte.length; i += 3) {
        const uv = lonLatToUv(this.relief, punkte[i]!, punkte[i + 1]!);
        const p = atlas.project(uv[0], uv[1], 0);
        if (!p.sichtbar || p.x < 60 || p.x > W - 20 || p.y < 60 || p.y > H - 60) continue;
        const halb = punkte[i + 2]! * pxGrad * 0.92;
        let g = groesse;
        let gap = g * 0.3;
        let br = this.gesperrt(text0, `700 ${g.toFixed(1)}px ${SERIF}`, gap, false);
        if (br > halb * 2) {
          g *= (halb * 2) / br;
          if (g < 9) continue;
          gap = g * 0.26;
          br = this.gesperrt(text0, `700 ${g.toFixed(1)}px ${SERIF}`, gap, false);
        }
        const rect = { x: p.x - br / 2, y: p.y - g * 0.6, w: br, h: g * 1.2 };
        if (!imBild(rect) || !platziereHinten(rect, "land", l.name)) continue;
        ctx.save();
        ctx.translate(p.x, p.y);
        const faktor = o.welt ? 1.35 : 1;
        this.gesperrt(text0, `700 ${g.toFixed(1)}px ${SERIF}`, gap, true, `rgba(250, 240, 222, ${(l.tr ? 0.4 : 0.42) * alpha * faktor})`, `rgba(20, 12, 8, ${0.3 * alpha})`, Math.max(2, g * 0.06 * fest));
        ctx.restore();
        break;
      }
    }

    // --- Vordergrund: Namen mit Rang
    const belegt: Rect[] = [...o.reserviert];
    const frei = (r: Rect, luft = 2) => {
      for (const b of belegt) if (Beschriftung.ueberlappt(r, b, luft)) return false;
      return true;
    };
    interface Kandidat {
      prio: number;
      zeichne: () => void;
      rects: Rect[];
    }
    const kand: Kandidat[] = [];

    const halo = "rgba(22, 13, 8, 0.86)";
    const schrift = (px: number, gewicht = 600, kursiv = false) => `${kursiv ? "italic " : ""}${gewicht} ${px}px ${SERIF}`;

    // Städte
    for (const s of d.orte) {
      if (pxGrad < s.mz) continue;
      if (o.ausgeblendet?.has(s.n.toLowerCase())) continue;
      const uv = this.uv.get(s)!;
      const p = atlas.project(uv[0], uv[1]);
      if (!p.sichtbar || !sichtbar(p.x, p.y, 10) || p.y < 62) continue;
      const hauptstadt = s.k === "h";
      const px = hauptstadt ? 14.5 : s.pop >= 500_000 ? 13 : s.pop >= 100_000 ? 12 : 11;
      const font = schrift(px, hauptstadt ? 700 : s.pop >= 100_000 ? 600 : 500);
      const br = this.breite(font, s.n);
      const r = hauptstadt ? 5 : s.pop >= 500_000 ? 4 : s.pop >= 100_000 ? 3.3 : 2.5;
      const varianten: [number, number, "left" | "right" | "center", number][] = [
        [p.x + r + 4, p.y, "left", 0],
        [p.x - r - 4, p.y, "right", 0],
        [p.x, p.y - r - px * 0.7 - 2, "center", 0],
        [p.x, p.y + r + px * 0.7 + 2, "center", 0],
      ];
      const rects = varianten.map(([tx, ty, ausr]) => ({ x: ausr === "left" ? tx - 2 : ausr === "right" ? tx - br - 2 : tx - br / 2 - 2, y: ty - px * 0.62, w: br + 4, h: px * 1.24 }));
      const punktRect = { x: p.x - r - 2, y: p.y - r - 2, w: 2 * r + 4, h: 2 * r + 4 };
      const prio = (hauptstadt ? 1000 : 0) + Math.log10(Math.max(1000, s.pop)) * 60 + (s.l === "TUR" ? 4 : 0);
      kand.push({
        prio,
        rects: [punktRect, ...rects],
        zeichne: () => {
          let gewaehlt = -1;
          for (let i = 0; i < rects.length; i++) {
            if (frei(rects[i]!) && frei(punktRect, 0)) {
              gewaehlt = i;
              break;
            }
          }
          if (gewaehlt < 0) return;
          belegt.push(punktRect, rects[gewaehlt]!);
          this.platziert.push({ art: "stadt", text: s.n, rects: [punktRect, rects[gewaehlt]!], hinten: false });
          const [tx, ty, ausr] = varianten[gewaehlt]!;
          // Punkt
          ctx.beginPath();
          if (hauptstadt) {
            ctx.moveTo(p.x, p.y - r - 1);
            ctx.lineTo(p.x + r + 1, p.y);
            ctx.lineTo(p.x, p.y + r + 1);
            ctx.lineTo(p.x - r - 1, p.y);
            ctx.closePath();
          } else ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = hauptstadt ? "#f3d68c" : s.pop >= 500_000 ? "#efc9b6" : "#f4ead2";
          ctx.fill();
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = "rgba(24, 14, 8, 0.95)";
          ctx.stroke();
          // Name
          ctx.font = font;
          ctx.textBaseline = "middle";
          ctx.textAlign = ausr;
          ctx.lineWidth = 3.2;
          ctx.strokeStyle = halo;
          ctx.strokeText(s.n, tx, ty);
          ctx.fillStyle = hauptstadt ? "#ffe9a8" : "#f6ecd6";
          ctx.fillText(s.n, tx, ty);
        },
      });
    }

    // Gipfel
    for (const g of d.gipfel) {
      if (pxGrad < g.mz) continue;
      const uv = this.uv.get(g)!;
      const p = atlas.project(uv[0], uv[1]);
      if (!p.sichtbar || !sichtbar(p.x, p.y, 10) || p.y < 62) continue;
      const text = `${g.n} ${g.ele.toLocaleString("de-DE")} m`;
      const font = schrift(10.5, 500, true);
      const br = this.breite(font, text);
      const rect = { x: p.x + 6, y: p.y - 7, w: br + 4, h: 14 };
      const punktRect = { x: p.x - 6, y: p.y - 6, w: 12, h: 12 };
      kand.push({
        prio: 200 + g.ele / 40,
        rects: [punktRect, rect],
        zeichne: () => {
          if (!frei(rect) || !frei(punktRect, 0)) return;
          belegt.push(punktRect, rect);
          this.platziert.push({ art: "gipfel", text, rects: [punktRect, rect], hinten: false });
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - 5);
          ctx.lineTo(p.x + 4.6, p.y + 3.2);
          ctx.lineTo(p.x - 4.6, p.y + 3.2);
          ctx.closePath();
          ctx.fillStyle = "#f1e6cc";
          ctx.fill();
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = "rgba(30, 18, 10, 0.95)";
          ctx.stroke();
          ctx.font = font;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.lineWidth = 3;
          ctx.strokeStyle = halo;
          ctx.strokeText(text, p.x + 8, p.y);
          ctx.fillStyle = "#efe2c4";
          ctx.fillText(text, p.x + 8, p.y);
        },
      });
    }

    // Inseln, Seen, Flüsse: kursiv ohne Punkt
    const kursiv = (n: string, px: number, x: number, y: number, prio: number, farbe: string, haloFarbe: string, winkel = 0) => {
      const font = schrift(px, 500, true);
      const br = this.breite(font, n);
      const rect = { x: x - br / 2 - 2, y: y - px * 0.65, w: br + 4, h: px * 1.3 };
      const rr = winkel === 0 ? rect : { x: x - br / 2 * Math.abs(Math.cos(winkel)) - px, y: y - br / 2 * Math.abs(Math.sin(winkel)) - px, w: br * Math.abs(Math.cos(winkel)) + 2 * px, h: br * Math.abs(Math.sin(winkel)) + 2 * px };
      kand.push({
        prio,
        rects: [rr],
        zeichne: () => {
          if (!frei(rr)) return;
          belegt.push(rr);
          this.platziert.push({ art: "kursiv", text: n, rects: [rr], hinten: false });
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(winkel);
          ctx.font = font;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = 3;
          ctx.strokeStyle = haloFarbe;
          ctx.strokeText(n, 0, 0);
          ctx.fillStyle = farbe;
          ctx.fillText(n, 0, 0);
          ctx.restore();
        },
      });
    };
    for (const i of d.inseln) {
      if (pxGrad < i.mz) continue;
      const uv = this.uv.get(i)!;
      const p = atlas.project(uv[0], uv[1]);
      if (!p.sichtbar || !sichtbar(p.x, p.y, 10) || p.y < 62) continue;
      kursiv(i.n, 12.5, p.x, p.y, 120, "#f4ecd6", halo);
    }
    for (const s of d.seen) {
      if (pxGrad < s.mz) continue;
      const uv = this.uv.get(s)!;
      const p = atlas.project(uv[0], uv[1]);
      if (!p.sichtbar || !sichtbar(p.x, p.y, 10) || p.y < 62) continue;
      kursiv(s.n, 11.5, p.x, p.y, 110, "#cfe6ee", "rgba(8, 26, 40, 0.85)");
    }
    for (const f of d.fluesse) {
      if (pxGrad < f.mz) continue;
      const uv = this.uv.get(f)!;
      const uv2 = this.uv2.get(f)!;
      const a = atlas.project(uv[0], uv[1]);
      const b = atlas.project(uv2[0], uv2[1]);
      if (!a.sichtbar || !b.sichtbar || !sichtbar(a.x, a.y, 10) || a.y < 62) continue;
      let w = Math.atan2(b.y - a.y, b.x - a.x);
      if (w > Math.PI / 2) w -= Math.PI;
      if (w < -Math.PI / 2) w += Math.PI;
      kursiv(f.n, 11, (a.x + b.x) / 2, (a.y + b.y) / 2, 100, "#bfe0f0", "rgba(6, 24, 40, 0.85)", Math.abs(w) > 1.2 ? 0 : w);
    }

    kand.sort((a, b) => b.prio - a.prio);
    for (const k of kand) k.zeichne();

    this.massstab(o);
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Gradnetz und Maßstab

  private gradnetz(o: BeschriftungsOptionen): void {
    const { ctx, atlas, relief } = this;
    const { pxGrad } = o;
    const schritt = pxGrad >= 420 ? 0.25 : pxGrad >= 220 ? 0.5 : pxGrad >= 100 ? 1 : pxGrad >= 46 ? 2 : 5;
    const b = atlas.viewBounds();
    // Grenzen des sichtbaren Ausschnitts in Länge und Breite
    const lon0 = relief.lon0 + b.u0 * (relief.lon1 - relief.lon0);
    const lon1 = relief.lon0 + b.u1 * (relief.lon1 - relief.lon0);
    const mercN = Math.log(Math.tan(Math.PI / 4 + (relief.lat1 * Math.PI) / 360));
    const mercS = Math.log(Math.tan(Math.PI / 4 + (relief.lat0 * Math.PI) / 360));
    const latVon = (v: number) => (2 * Math.atan(Math.exp(mercN + v * (mercS - mercN))) - Math.PI / 2) * (180 / Math.PI);
    const latN = latVon(Math.max(0, b.v0));
    const latS = latVon(Math.min(1, b.v1));
    ctx.beginPath();
    for (let lon = Math.ceil(lon0 / schritt) * schritt; lon <= lon1; lon += schritt) {
      let stift = false;
      for (let lat = Math.max(relief.lat0, latS); lat <= Math.min(relief.lat1, latN) + 1e-6; lat += schritt / 6) {
        const [u, v] = lonLatToUv(relief, lon, lat);
        const p = atlas.project(u, v, 0);
        if (!p.sichtbar) {
          stift = false;
          continue;
        }
        if (!stift) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
        stift = true;
      }
    }
    for (let lat = Math.ceil(Math.max(relief.lat0, latS) / schritt) * schritt; lat <= Math.min(relief.lat1, latN); lat += schritt) {
      let stift = false;
      for (let lon = Math.max(relief.lon0, lon0); lon <= Math.min(relief.lon1, lon1) + 1e-6; lon += schritt / 6) {
        const [u, v] = lonLatToUv(relief, lon, lat);
        const p = atlas.project(u, v, 0);
        if (!p.sichtbar) {
          stift = false;
          continue;
        }
        if (!stift) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
        stift = true;
      }
    }
    ctx.strokeStyle = "rgba(255, 244, 220, 0.11)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  private massstab(o: BeschriftungsOptionen): void {
    const { ctx, atlas, relief } = this;
    const x0 = 106;
    const y = o.cssH - 34;
    if (o.cssW < 620 || y < 300) return;
    const a = atlas.groundUv(x0, y);
    const b = atlas.groundUv(x0 + 100, y);
    if (!a || !b) return;
    const dlon = Math.abs(b[0] - a[0]) * (relief.lon1 - relief.lon0);
    const mercN = Math.log(Math.tan(Math.PI / 4 + (relief.lat1 * Math.PI) / 360));
    const mercS = Math.log(Math.tan(Math.PI / 4 + (relief.lat0 * Math.PI) / 360));
    const lat = (2 * Math.atan(Math.exp(mercN + a[1] * (mercS - mercN))) - Math.PI / 2) * (180 / Math.PI);
    const kmPro100 = dlon * 111.32 * Math.cos((lat * Math.PI) / 180);
    if (!(kmPro100 > 0)) return;
    // schöne Länge zwischen 60 und 150 Bildpunkten
    const wahl = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
    let km = wahl[0]!;
    for (const w of wahl) {
      const px = (w / kmPro100) * 100;
      if (px >= 60 && px <= 170) {
        km = w;
        break;
      }
      if (px < 60) km = w;
    }
    const len = (km / kmPro100) * 100;
    const halb = len / 2;
    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "rgba(20, 12, 8, 0.95)";
    // zwei Hälften: dunkel und hell
    ctx.fillStyle = "rgba(20, 12, 8, 0.9)";
    ctx.fillRect(x0, y, halb, 5);
    ctx.fillStyle = "rgba(246, 236, 214, 0.95)";
    ctx.fillRect(x0 + halb, y, halb, 5);
    ctx.strokeRect(x0, y, len, 5);
    ctx.font = `600 11px ${SERIF}`;
    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(22, 13, 8, 0.85)";
    ctx.fillStyle = "#f6ecd6";
    ctx.strokeText("0", x0, y - 3);
    ctx.fillText("0", x0, y - 3);
    const text = `${km.toLocaleString("de-DE")} km`;
    ctx.textAlign = "right";
    ctx.strokeText(text, x0 + len, y - 3);
    ctx.fillText(text, x0 + len, y - 3);
    ctx.restore();
  }
}
