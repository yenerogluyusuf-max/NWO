// Wählerkoalition: Gruppen mit Laune, Gründen und Forderungen; die Zustimmungsrechnung geht auf.

import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { waehlerLage, zustimmungsBilanz } from "../src/sim/waehler";
import { setPolicy } from "../src/sim/handeln";
import { GRUPPEN, GRUPPEN_SUMME } from "../src/sim/gruppen";

function neu() {
  const w = createWorld(turkey2026, 6);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  return w;
}

describe("Wählerkoalition", () => {
  test("Acht Gruppen mit Laune, Gewicht, Gründen und Forderungen", () => {
    const w = neu();
    const lage = waehlerLage(w);
    expect(lage).toHaveLength(8);
    expect(lage.reduce((s, g) => s + g.anteil, 0)).toBeCloseTo(1, 6);
    for (const g of lage) {
      expect(g.laune).toBeGreaterThan(0);
      expect(g.laune).toBeLessThan(100);
      expect(g.gruende.length).toBeGreaterThan(0);
      expect(g.forderungen.length).toBeGreaterThan(0);
      expect(g.wort.length).toBeGreaterThan(3);
    }
    expect(GRUPPEN_SUMME).toBeCloseTo(GRUPPEN.reduce((s, g) => s + g.gewicht, 0), 6);
  });

  test("Eine Maßnahme bewegt die Gruppe, die sie betrifft, und erscheint unter den Gründen", () => {
    const w = neu();
    const vorher = waehlerLage(w).find((g) => g.id === "arbeitnehmer")!;
    setPolicy(w, "m_mindestlohn", 90);
    advance(w, 30 * 6);
    const nachher = waehlerLage(w).find((g) => g.id === "arbeitnehmer")!;
    expect(nachher.laune).toBeGreaterThan(vorher.laune);
    expect(nachher.veraendert).toBe(true);
    expect(nachher.gruende.some((r) => /Mindestlohn/.test(r.name) && r.richtung > 0)).toBe(true);
    expect(nachher.trend).not.toBeNull();
  });

  test("Die Zustimmungsrechnung nennt Posten, die zusammen die Richtung der Zustimmung ergeben", () => {
    const w = neu();
    advance(w, 30 * 8);
    const b = zustimmungsBilanz(w);
    expect(b.posten.map((p) => p.name)).toContain("Regierungsmüdigkeit");
    expect(b.posten.find((p) => p.name === "Regierungsmüdigkeit")!.delta).toBeLessThan(0);
    expect(b.wahlIn).toBeGreaterThan(40);
    expect(b.jetzt).toBeGreaterThan(0);
  });
});
