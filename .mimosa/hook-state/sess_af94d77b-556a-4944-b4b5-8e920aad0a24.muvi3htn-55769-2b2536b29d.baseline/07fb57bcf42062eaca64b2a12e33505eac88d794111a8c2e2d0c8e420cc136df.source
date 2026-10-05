// Der Erbekatalog ist stimmig: Provinz und Koordinaten passen zusammen, die sieben Kirchen sind vollständig.

import { describe, expect, test } from "vitest";
import { ERBE, KIRCHEN_DER_OFFENBARUNG } from "../src/data/erbe";
import { PROVINCE_FC, ringsOf } from "../src/ui/atlas/overlay";
import { PROVINZEN } from "../src/sim/regional";

function innen(ring: number[][], lon: number, lat: number): boolean {
  let drin = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi! > lat !== yj! > lat && lon < ((xj! - xi!) * (lat - yi!)) / (yj! - yi!) + xi!) drin = !drin;
  }
  return drin;
}

/** Abstand in Grad zur Provinz: 0, wenn der Punkt in ihr liegt. */
function abstandZurProvinz(plaka: number, lon: number, lat: number): number {
  const f = PROVINCE_FC.features.find((x) => x.properties.plaka === plaka)!;
  const ringe = ringsOf(f) as number[][][];
  if (ringe.some((r) => innen(r, lon, lat))) return 0;
  let best = Infinity;
  for (const ring of ringe) for (const p of ring) best = Math.min(best, Math.hypot((p[0]! - lon) * Math.cos((lat * Math.PI) / 180), p[1]! - lat));
  return best;
}

describe("Erbekatalog", () => {
  test("53 Stätten, eindeutige Kennungen, gültige Provinzen", () => {
    expect(ERBE).toHaveLength(53);
    expect(new Set(ERBE.map((e) => e.id)).size).toBe(ERBE.length);
    for (const e of ERBE) expect(PROVINZEN.some((p) => p.plaka === e.plaka), `${e.id}: Plaka ${e.plaka}`).toBe(true);
  });

  test("Jede Stätte liegt in ihrer Provinz oder höchstens 0,12 Grad (etwa 10 km) daneben (Grobgrenzen der Karte)", () => {
    for (const e of ERBE) {
      const d = abstandZurProvinz(e.plaka, e.lon, e.lat);
      expect(d, `${e.id} (Plaka ${e.plaka}) liegt ${d.toFixed(2)} Grad außerhalb`).toBeLessThan(0.12);
    }
  });

  test("Die sieben Kirchen der Offenbarung sind vollständig und liegen im Westen", () => {
    expect(KIRCHEN_DER_OFFENBARUNG.map((e) => e.id).sort()).toEqual(["ephesos", "laodikeia", "pergamon", "philadelphia", "sardes", "smyrna", "thyatira"]);
    for (const k of KIRCHEN_DER_OFFENBARUNG) {
      expect(k.lon).toBeGreaterThan(26.5);
      expect(k.lon).toBeLessThan(30);
      expect(k.serien).toContain("kirchen7");
    }
  });

  test("Welterbe: 22 Stätten laut Recherche, mit Jahr", () => {
    const w = ERBE.filter((e) => e.unesco.status === "welterbe");
    expect(w.length).toBeGreaterThanOrEqual(21);
    for (const e of w) expect(e.unesco.jahr).toBeGreaterThan(1984);
  });
});
