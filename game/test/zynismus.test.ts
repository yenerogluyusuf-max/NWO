// Zynismus (sim/zynismus.ts): Kehrtwende und Wahlgeschenk erhöhen ihn, er klingt ab und drückt die Zustimmung; Ereignisse zählen nicht.
import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { ZYNISMUS, politikGeaendert, zynismus, zynismusLast, zynismusMonat } from "../src/sim/zynismus";
import { zustimmungsTeile } from "../src/sim/spiel";
import { zustimmungsBilanz } from "../src/sim/waehler";
import type { World } from "../src/sim/types";

function welt(): World {
  const w = createWorld(turkey2026, 2);
  startAfterElection(w, schnellProfil());
  return w;
}

describe("Zynismus", () => {
  test("Eine Kehrtwende innerhalb der Frist kostet, eine Fortsetzung nicht", () => {
    const w = welt();
    politikGeaendert(w, "m_mindestlohn", 50, 70);
    expect(zynismus(w).wert).toBe(0);
    w.day += 100;
    politikGeaendert(w, "m_mindestlohn", 70, 75);
    expect(zynismus(w).wert).toBe(0);
    w.day += 100;
    politikGeaendert(w, "m_mindestlohn", 75, 55);
    expect(zynismus(w).wert).toBeCloseTo(ZYNISMUS.wende, 6);
  });
  test("Eine teure Erhöhung kurz vor der Wahl ist ein Wahlgeschenk; weit vor der Wahl nicht", () => {
    const w = welt();
    politikGeaendert(w, "m_krankenhausbau", 40, 60);
    expect(zynismus(w).wert).toBe(0);
    w.day = w.spiel!.wahltag - 90;
    politikGeaendert(w, "m_sozialwohnungen", 40, 60);
    expect(zynismus(w).wert).toBeGreaterThan(0);
  });
  test("Er klingt ab und erscheint als Posten in der Zustimmung", () => {
    const w = welt();
    zynismus(w).wert = 20;
    const t = zustimmungsTeile(w, 1);
    expect(t.zynismus).toBeCloseTo(20 * ZYNISMUS.gewicht, 6);
    expect(zustimmungsBilanz(w).posten.some((p) => p.name === "Zynismus")).toBe(true);
    zynismusMonat(w);
    expect(zynismusLast(w)).toBeLessThan(2);
  });
});
