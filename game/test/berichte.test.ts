// Wirkungsberichte: Was ein Beschluss nach sechs und zwölf Monaten bewirkt hat.

import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { setPolicy } from "../src/sim/handeln";

function neu() {
  const w = createWorld(turkey2026, 9);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.hinweise = [];
  return w;
}

describe("Wirkungsberichte", () => {
  test("Ein großer Beschluss wird beobachtet und nach sechs und zwölf Monaten berichtet", () => {
    const w = neu();
    setPolicy(w, "m_mindestlohn", 90);
    expect(w.spiel!.beobachtungen).toHaveLength(1);
    advance(w, 30 * 5);
    expect(w.spiel!.berichte ?? []).toHaveLength(0);
    advance(w, 30 * 2);
    expect(w.spiel!.berichte).toHaveLength(1);
    const b = w.spiel!.berichte![0]!;
    expect(b.monate).toBe(6);
    expect(b.zeilen.length).toBeGreaterThan(0);
    expect(b.zeilen.join(" ")).toMatch(/Beschäftigte|Reale Einkommen|Kosten/);
    expect(["gut", "gemischt", "schwach", "keine"]).toContain(b.urteil);
    advance(w, 30 * 6);
    expect(w.spiel!.berichte).toHaveLength(2);
    expect(w.spiel!.berichte![1]!.monate).toBe(12);
    expect(w.spiel!.chronik.some((c) => /Wirkungsbericht: Mindestlohn/.test(c.titel))).toBe(true);
  });

  test("Kleine Änderungen werden nicht beobachtet", () => {
    const w = neu();
    setPolicy(w, "m_mindestlohn", 54);
    expect(w.spiel!.beobachtungen ?? []).toHaveLength(0);
  });

  test("Ein Beschluss, der wirkt, wird als wirksam bewertet", () => {
    const w = neu();
    setPolicy(w, "m_renten", 100);
    advance(w, 30 * 13);
    const b = w.spiel!.berichte!.find((x) => x.monate === 12)!;
    expect(b.urteil).toBe("gut");
    expect(b.zeilen.join(" ")).toMatch(/Rentenniveau/);
  });

  test("Was lange dauert, wird ehrlich als noch nicht wirksam gemeldet", () => {
    const w = neu();
    setPolicy(w, "m_bewaesserung", 100);
    advance(w, 30 * 7);
    const b = w.spiel!.berichte![0]!;
    expect(b.urteil).toBe("schwach");
    expect(b.hinweis).toMatch(/braucht noch etwa \d+ Monat/);
  });
});
