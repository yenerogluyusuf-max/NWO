// Belegte Regionen der Kriegsschauplätze (Welle 3, K2; krieg.md Schritt 4, Befund C7): Jede Region ist eine echte Verwaltungseinheit mit
// Fläche, Einwohnern samt Stichjahr und Quelle, ihren Ressourcen und einem Umriss aus einer freien Quelle (tools/geodaten/schauplatz_flaechen.py).
// Die Umrisse überlappen sich nicht, und jeder Ort liegt in seiner Region.

import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { QUELLE, REGIONEN, SCHAUPLAETZE, ZIELRAUM_REGIONEN } from "../src/data/schauplaetze";
import FLAECHEN_ROH from "../src/data/schauplatz-flaechen.json";

const FLAECHEN = FLAECHEN_ROH as unknown as Record<string, [number, number][][]>;
const katalog = (spr: string) => JSON.parse(readFileSync(new URL(`../src/i18n/katalog/${spr}/welle_k2.json`, import.meta.url), "utf-8")) as Record<string, string>;

/** Punkt im Ring (Strahlverfahren). */
function innen(lon: number, lat: number, ring: [number, number][]): boolean {
  let drin = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) drin = !drin;
  }
  return drin;
}
const inRegion = (id: string, lon: number, lat: number) => (FLAECHEN[id] ?? []).some((r) => innen(lon, lat, r));

/** Fläche eines Rings in km² (Längengrad mit dem Kosinus der Breite, Erdradius 6.371 km): genau genug für einen Abgleich auf wenige Prozent. */
function ringKm2(ring: [number, number][]): number {
  const R = 6371.0072;
  const rad = Math.PI / 180;
  let s = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[j]!;
    const [x2, y2] = ring[i]!;
    s += (x2 - x1) * rad * (2 + Math.sin(y1 * rad) + Math.sin(y2 * rad));
  }
  return Math.abs((s * R * R) / 2);
}

describe("Belegte Regionen", () => {
  test("jede Region hat Verwaltungseinheit, Fläche, Einwohner mit Stichjahr und Quelle", () => {
    expect(REGIONEN).toHaveLength(40);
    for (const r of REGIONEN) {
      expect(r.einheit.name.length, r.id).toBeGreaterThan(1);
      expect(r.flaecheKm2, r.id).toBeGreaterThan(100);
      expect(r.einwohner, `${r.id}: Einwohner fehlen (Lücke muss begründet sein)`).not.toBeNull();
      expect(r.einwohner!.zahl, r.id).toBeGreaterThan(10_000);
      expect(r.einwohner!.jahr, r.id).toBeGreaterThanOrEqual(2016);
      expect(r.einwohner!.jahr, r.id).toBeLessThanOrEqual(2026);
      expect(r.einwohner!.quelle, r.id).toMatch(/https:\/\//);
      if (["nordsyrien", "nordirak", "suedkaukasus", "nordwestiran"].includes(r.schauplatz)) expect(r.einheit.pcode, r.id).toMatch(/^(SY|IQ|AM|IR)/);
    }
    expect(QUELLE.flaeche).toMatch(/OCHA COD-AB/);
  });

  test("jede Ressource ist belegt und in allen drei Sprachen benannt", () => {
    const kat = { de: katalog("de"), en: katalog("en"), tr: katalog("tr") };
    const ids = new Set<string>();
    for (const r of REGIONEN) {
      for (const x of r.ressourcen) {
        expect(ids.has(x.id), `${x.id} doppelt`).toBe(false);
        ids.add(x.id);
        expect(x.quelle.length, x.id).toBeGreaterThan(8);
        for (const [spr, k] of Object.entries(kat)) expect(k[`welle_k2.res.${x.id}`], `${spr}: ${x.id}`).toBeTruthy();
      }
    }
    expect(ids.size).toBeGreaterThan(40);
  });

  test("der Umriss hat die belegte Fläche (vereinfacht, auf 8 % genau)", () => {
    for (const r of REGIONEN) {
      const ringe = FLAECHEN[r.id];
      expect(ringe?.length, r.id).toBeGreaterThan(0);
      const km2 = ringe!.reduce((s, ring) => s + ringKm2(ring), 0);
      expect(Math.abs(km2 / r.flaecheKm2 - 1), `${r.id}: Umriss ${Math.round(km2)} km², belegt ${r.flaecheKm2} km²`).toBeLessThan(0.08);
    }
  });

  test("jeder Ort liegt in seiner Region", () => {
    for (const r of REGIONEN) {
      // Hafenstädte auf der Küstenlinie: ein Punkt im Umkreis von 3 km genügt
      const nah = [[0, 0], [0.03, 0], [-0.03, 0], [0, 0.03], [0, -0.03]].some(([dx, dy]) => inRegion(r.id, r.lon + dx!, r.lat + dy!));
      expect(nah, r.id).toBe(true);
    }
  });

  test("die Regionen eines Schauplatzes überlappen sich nicht", () => {
    for (const s of SCHAUPLAETZE) {
      const regionen = REGIONEN.filter((r) => r.schauplatz === s.id);
      const pkt = regionen.flatMap((r) => FLAECHEN[r.id]!.flat());
      const lon0 = Math.min(...pkt.map((p) => p[0])), lon1 = Math.max(...pkt.map((p) => p[0]));
      const lat0 = Math.min(...pkt.map((p) => p[1])), lat1 = Math.max(...pkt.map((p) => p[1]));
      let gedeckt = 0;
      let doppelt = 0;
      const schritt = 0.025;
      for (let lo = lon0; lo <= lon1; lo += schritt) {
        for (let la = lat0; la <= lat1; la += schritt) {
          const n = regionen.filter((r) => inRegion(r.id, lo, la)).length;
          if (n >= 1) gedeckt++;
          if (n >= 2) doppelt++;
        }
      }
      expect(gedeckt, s.id).toBeGreaterThan(50);
      expect(doppelt / gedeckt, `${s.id}: ${doppelt} von ${gedeckt} Rasterpunkten doppelt`).toBeLessThan(0.002);
    }
  });

  test("jeder Zielraum besteht aus Regionen seines Schauplatzes", () => {
    for (const [id, liste] of Object.entries(ZIELRAUM_REGIONEN)) {
      const land = id.slice(0, 3);
      for (const r of liste) expect(REGIONEN.find((x) => x.id === r)?.id.slice(0, 3), `${id}: ${r}`).toBe(land);
    }
  });
});
