import { expect, test } from "vitest";
import { PolicyNet, PROVINCES, type NetEdge, type NetNode } from "../src/sim/netz";
import { Rng } from "../src/sim/rng";

// Simulationsversuch (Entwicklungsplan, Abschnitt 6): 150 Knoten je Provinz,
// 400 Verbindungen mit bis zu 12 Monaten Verzögerung, zehn Jahre Spielzeit.
test("Politiknetz: 150 Knoten × 81 Provinzen über 10 Jahre in unter 2 Sekunden", () => {
  const rng = new Rng(99);
  const nodes: NetNode[] = Array.from({ length: 150 }, (_, i) => ({
    id: `k${i}`,
    values: Float64Array.from({ length: PROVINCES }, () => rng.between(0, 100)),
    rest: 50,
    decay: 0.05,
  }));
  const edges: NetEdge[] = Array.from({ length: 400 }, () => ({
    from: Math.floor(rng.next() * 150),
    to: Math.floor(rng.next() * 150),
    weight: rng.between(-0.02, 0.02),
    lag: Math.floor(rng.next() * 13),
  }));
  const net = new PolicyNet(nodes, edges);

  const t0 = performance.now();
  for (let m = 0; m < 120; m++) net.step();
  const ms = performance.now() - t0;
  console.log(`Politiknetz: 120 Monate in ${ms.toFixed(0)} ms`);

  expect(ms).toBeLessThan(2000);
  for (const n of nodes) for (const v of n.values) expect(Number.isFinite(v)).toBe(true);
});
