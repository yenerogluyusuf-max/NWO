import { test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { machtkreis, regimeGrad } from "../src/sim/machtkreis";
test("probe", () => {
  for (const seed of [1,2,3,4,5,6]) {
    const w = createWorld(turkey2026, seed);
    startAfterElection(w, schnellProfil());
    const z: Record<string, number> = {};
    const gesehen = new Set<string>();
    for (let tag = 0; tag < 3650 && !w.spiel!.ende; tag += 10) {
      advance(w, 10);
      for (const e of w.spiel!.ereignisse) if (!gesehen.has(e.id)) { gesehen.add(e.id); if (e.vorlage.startsWith("kreis_") || e.vorlage.startsWith("person_")) z[e.vorlage] = (z[e.vorlage] ?? 0) + 1; }
    }
    const mk = machtkreis(w);
    console.log(seed, w.date, w.spiel!.ende?.art ?? "-", JSON.stringify(z), "angst", mk.angst.toFixed(0), "nachf", mk.nachfolge.toFixed(0), "regime", regimeGrad(w), "geh", mk.geheimnisse.length, "bez", mk.beziehungen.length, "szenen", mk.szenen.length);
  }
});
