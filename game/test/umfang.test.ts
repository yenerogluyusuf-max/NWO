// Der politische Preis wächst mit dem Umfang: das ganze Land kostet mehr als eine Region, eine Region mehr als eine Provinz.

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { pruefeVorhaben, umfangFaktor } from "../src/sim/handeln";

const welt = () => {
  const w = createWorld(turkey2026, 7);
  startAfterElection(w, schnellProfil());
  return w;
};

describe("Umfang und Preis", () => {
  test("Der Umfangsfaktor wächst streng mit dem Bevölkerungsanteil, ohne Sättigung", () => {
    const anteile = [0.002, 0.02, 0.1, 0.2, 0.33, 0.5, 0.8, 1];
    const f = anteile.map(umfangFaktor);
    for (let i = 1; i < f.length; i++) expect(f[i]!).toBeGreaterThan(f[i - 1]!);
    expect(umfangFaktor(1)).toBeCloseTo(1, 10);
    expect(umfangFaktor(0.33)).toBeLessThan(0.7); // vorher zahlte ein Drittel der Bevölkerung schon fast den vollen Preis
    expect(umfangFaktor(0.002)).toBeLessThan(0.3);
  });

  test("Ganzes Land, Region und einzelne Provinz kosten gestaffelt (Kapital und Haushalt)", () => {
    const w = welt();
    const marmara = [34, 41, 16, 59, 22, 39, 10, 17, 11, 54, 77, 20];
    for (const id of ["m_investitionsanreize", "m_wasserleitungen", "m_schulbau"]) {
      const land = pruefeVorhaben(w, id, 80, null);
      const region = pruefeVorhaben(w, id, 80, marmara);
      const provinz = pruefeVorhaben(w, id, 80, [75]);
      expect(land.gesetz.pk, `${id}: Land > Region`).toBeGreaterThan(region.gesetz.pk);
      expect(region.gesetz.pk, `${id}: Region >= Provinz`).toBeGreaterThanOrEqual(provinz.gesetz.pk);
      expect(land.kostenBip).toBeGreaterThan(region.kostenBip);
      expect(region.kostenBip).toBeGreaterThan(provinz.kostenBip);
      expect(region.hinweise.some((h) => h.startsWith("Umfang:"))).toBe(true);
    }
  });
});
