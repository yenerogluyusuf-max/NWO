// Verbindliche Proportionen der gezeichneten Porträts: Für alle Kopfformen und beide Geschlechter liegt jedes Element
// innerhalb der Toleranz (ui/art/portraet-proportionen.ts). Zusätzlich: Die Renderer-Zeichnung folgt dem Raster.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { KOPFFORMEN, KOPFHOEHE, OVAL, SOLL, pruefe, raster } from "../src/ui/art/portraet-proportionen";
import { Portraet, rasterVon } from "../src/ui/art/Portraet";

const GESCHLECHTER = ["f", "m"] as const;

describe("Proportionsraster", () => {
  test("zwölf Kopfformen, alle Maße innerhalb der Toleranz, Frau und Mann", () => {
    expect(KOPFFORMEN.length).toBeGreaterThanOrEqual(12);
    for (let i = 0; i < KOPFFORMEN.length; i++)
      for (const g of GESCHLECHTER) {
        const fehler = pruefe(raster(i, g));
        expect(fehler, `Form ${i} ${g}`).toEqual([]);
      }
  });

  test("die Sollwerte stimmen mit den Vorgaben überein (0,50 H Augenlinie, 0,68 Nase, 0,80 Mund, Ansatz 0,18, Kinn 1,0)", () => {
    expect(SOLL.augenlinie.soll).toBe(0.5);
    expect(SOLL.nasenspitze.soll).toBe(0.68);
    expect(SOLL.mundlinie.soll).toBe(0.8);
    expect(SOLL.haaransatz.soll).toBe(0.18);
    expect(SOLL.braue.soll).toBe(0.06);
    expect(SOLL.augenBreite.soll).toBe(0.2);
    expect(SOLL.augenAbstand.soll).toBe(1);
    expect(SOLL.schaedelBreite.soll).toBe(0.72);
    expect(SOLL.hals.soll).toBe(0.5);
    expect(SOLL.schultern.min).toBe(2.2);
    expect(SOLL.schultern.max).toBe(2.6);
  });

  test("das Raster rechnet nach: Linien aufsteigend, Ohren zwischen Brauen und Nasenunterkante, Kopf im Oval", () => {
    for (let i = 0; i < KOPFFORMEN.length; i++)
      for (const g of GESCHLECHTER) {
        const r = raster(i, g);
        expect(r.kinnY - r.oben).toBeCloseTo(KOPFHOEHE, 9);
        expect((r.ey - r.oben) / r.H).toBeCloseTo(0.5, 9);
        expect(r.ohrenOben).toBeGreaterThanOrEqual(r.braueY);
        expect(r.ohrenUnten).toBeLessThanOrEqual(r.nasenbasisY);
        expect(r.oben).toBeGreaterThan(OVAL.cy - OVAL.ry);
        expect(r.kinnY).toBeLessThan(OVAL.cy + OVAL.ry);
        expect(r.ey).toBeLessThan(OVAL.cy); // Blick leicht über der Ovalmitte
        expect(r.augenLuecke).toBeCloseTo(r.augenBreite, 9); // Abstand = eine Augenbreite
      }
  });

  test("Frauen und Männer unterscheiden sich in Hals und Schulterbreite, nicht im Raster", () => {
    for (let i = 0; i < KOPFFORMEN.length; i++) {
      const f = raster(i, "f");
      const m = raster(i, "m");
      expect(f.ey).toBe(m.ey);
      expect(f.nasenspitzeY).toBe(m.nasenspitzeY);
      expect(f.mundY).toBe(m.mundY);
      expect(f.haaransatzY).toBe(m.haaransatzY);
      expect(f.kinnY).toBe(m.kinnY);
      expect(f.halsBreite).toBeLessThan(m.halsBreite);
      expect(f.schulterBreite).toBeLessThan(m.schulterBreite);
    }
  });

  test("der Renderer benutzt das Raster der Eingabe (Kopfform, Geschlecht), unabhängig vom Samen und von der Größe", () => {
    for (const g of GESCHLECHTER) {
      const a = rasterVon({ seed: "A", geschlecht: g, kopfform: 3 });
      const b = rasterVon({ seed: "ganz anderer Samen", geschlecht: g, kopfform: 3 });
      expect(a).toEqual(b);
      expect(a).toEqual(raster(3, g));
    }
  });

  test("gleiche Maße in allen Größen: dasselbe Bild in 40 und 240 px (nur Breite und Höhe unterscheiden sich), das Raster bleibt", () => {
    const gross = renderToStaticMarkup(createElement(Portraet, { seed: "Größe", geschlecht: "m", alter: 44, size: 240, lebendig: false, raster: false }));
    const klein = renderToStaticMarkup(createElement(Portraet, { seed: "Größe", geschlecht: "m", alter: 44, size: 40, lebendig: false, raster: false }));
    expect(gross).toContain('viewBox="-12 -8 124 144"');
    expect(klein).toContain('viewBox="-12 -8 124 144"');
  });

  test("Hilfslinien: die Prüfansicht zeichnet Augen-, Nasen- und Mundlinie sowie die Mitte", () => {
    const html = renderToStaticMarkup(createElement(Portraet, { seed: "Linien", geschlecht: "f", alter: 40, size: 160, hilfslinien: true, hintergrund: false, raster: false }));
    for (const t of ["Augen 0,50", "Nase 0,68", "Mund 0,80", "Ansatz 0,18", "Kinn 1,0", "Brauen"]) expect(html).toContain(t);
  });
});
