import { expect, test } from "vitest";
import { createWorld, tick } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { radStuecke } from "../src/ui/wirtschaft/HaushaltsRad";
import { haushaltZustand } from "../src/sim/wirtschaft";

function welt() {
  const w = createWorld(turkey2026, 17);
  startAfterElection(w, { ...schnellProfil(), buendnis: "YENİ" });
  return w;
}

test("Außenring summiert genau auf die Ausgaben, Personal nicht doppelt", () => {
  const w = welt();
  for (let i = 0; i < 40; i++) tick(w);
  const r = radStuecke(w);
  const summe = r.aussen.reduce((s, x) => s + x.mrd, 0);
  expect(r.ueberhangMrd).toBe(0);
  expect(Math.abs(summe - r.ausgabenMrd)).toBeLessThan(0.01 * r.ausgabenMrd);
  expect(r.aussen.some((x) => x.id === "uebrig")).toBe(true);
});

test("Innenring summiert auf Einnahmen und neue Schulden", () => {
  const w = welt();
  const r = radStuecke(w);
  const summe = r.innen.reduce((s, x) => s + x.mrd, 0);
  expect(Math.abs(summe - (r.einnahmenMrd + r.kreditMrd))).toBeLessThan(0.01 * (r.einnahmenMrd + r.kreditMrd));
});

test("Mehr Personal vergrößert das Reststück, nicht das Stück Staat", () => {
  const w = welt();
  const vor = radStuecke(w);
  haushaltZustand(w).stufen.personal = 3;
  const nach = radStuecke(w);
  const staat = (r: typeof vor) => r.aussen.find((x) => x.id === "staat")?.mrd ?? 0;
  expect(staat(nach)).toBeCloseTo(staat(vor), 3);
});
