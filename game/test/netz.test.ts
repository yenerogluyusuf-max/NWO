import { describe, expect, test } from "vitest";
import { EDGES, NODES } from "../src/data/politiknetz";
import { createNet, nationalAverage, PROVINCES, startAverage, stepNet } from "../src/sim/netz";
import { advance, createWorld, NET, setPolicy } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import type { World } from "../src/sim/types";

const SEEDS = [1, 2, 3, 4, 5, 6];

function avgAfter(months: number, id: string, setup?: (w: World) => void): number {
  const values = SEEDS.map((seed) => {
    const w = createWorld(turkey2026, seed);
    setup?.(w);
    advance(w, months * 30.5);
    return nationalAverage(NET, w.net, id);
  });
  return values.reduce((a, b) => a + b, 0) / values.length;
}

describe("Katalog", () => {
  test("mehr als 150 Knoten, jede Verbindung zeigt auf bekannte Knoten", () => {
    expect(NODES.length).toBeGreaterThan(150);
    expect(NET.edges.length).toBe(EDGES.length);
    expect(new Set(NODES.map((n) => n.id)).size).toBe(NODES.length);
  });

  test("jeder Knoten ist verbunden, jede Verbindung hat eine Begründung", () => {
    const touched = new Set(EDGES.flatMap((e) => [e.from, e.to]));
    const loose = NODES.filter((n) => !touched.has(n.id)).map((n) => n.id);
    expect(loose).toEqual([]);
    for (const e of EDGES) expect(e.why.length).toBeGreaterThan(10);
  });
});

describe("Dynamik", () => {
  test("ohne Anstoß bleibt das Netz in Ruhe", () => {
    const w = createWorld(turkey2026, 1);
    const net = createNet(NET, w.economy);
    for (let m = 0; m < 60; m++) stepNet(NET, net, w.economy);
    let maxDev = 0;
    for (let k = 0; k < net.values.length; k++) maxDev = Math.max(maxDev, Math.abs(net.values[k]! - net.start[k]!));
    expect(maxDev).toBeLessThan(1e-9);
  });

  test("Störungen klingen ab statt sich aufzuschaukeln", () => {
    const w = createWorld(turkey2026, 1);
    const net = createNet(NET, w.economy);
    NET.nodes.forEach((n, i) => {
      if (n.kind === "massnahme" || n.input) return;
      for (let p = 0; p < PROVINCES; p++) net.values[i * PROVINCES + p] = Math.min(100, net.values[i * PROVINCES + p]! + 20);
    });
    net.history = net.history.map(() => net.values.slice());
    for (let m = 0; m < 120; m++) stepNet(NET, net, w.economy);
    let sum = 0;
    let count = 0;
    NET.nodes.forEach((n, i) => {
      if (n.kind === "massnahme" || n.input) return;
      for (let p = 0; p < PROVINCES; p++) {
        sum += Math.abs(net.values[i * PROVINCES + p]! - net.start[i * PROVINCES + p]!);
        count++;
      }
    });
    expect(sum / count).toBeLessThan(5);
  });
});

describe("Maßnahmen wirken in die erwartete Richtung", () => {
  test("höherer Mindestlohn: höhere Reallöhne, zufriedenere Beschäftigte, mehr Kostendruck", () => {
    const up = (w: World) => setPolicy(w, "m_mindestlohn", 80);
    expect(avgAfter(12, "realeinkommen", up)).toBeGreaterThan(avgAfter(12, "realeinkommen"));
    expect(avgAfter(12, "arbeitnehmer", up)).toBeGreaterThan(avgAfter(12, "arbeitnehmer"));
    expect(avgAfter(12, "kostendruck", up)).toBeGreaterThan(avgAfter(12, "kostendruck"));
  });

  test("Wasserleitungen senken nach einigen Jahren den Wassermangel", () => {
    const build = (w: World) => setPolicy(w, "m_wasserleitungen", 90);
    expect(avgAfter(48, "p_wassermangel", build)).toBeLessThan(avgAfter(48, "p_wassermangel") - 1);
  });

  test("Maßnahmen kosten Geld und erhöhen die Schulden", () => {
    const w = createWorld(turkey2026, 2);
    const base = createWorld(turkey2026, 2);
    setPolicy(w, "m_renten", 90);
    advance(w, 400);
    advance(base, 400);
    expect(w.economy.policyCost).toBeGreaterThan(0.3);
    expect(w.economy.debtRatio).toBeGreaterThan(base.economy.debtRatio);
  });

  test("Umsetzung braucht Zeit: Schulbau ist nach drei Monaten erst zum kleinen Teil umgesetzt", () => {
    const w = createWorld(turkey2026, 3);
    setPolicy(w, "m_schulbau", 95);
    advance(w, 92);
    const level = nationalAverage(NET, w.net, "m_schulbau");
    expect(level).toBeGreaterThan(startAverage(NET, w.net, "m_schulbau"));
    expect(level).toBeLessThan(60);
  });
});

test("Leistung: zehn Spieljahre mit vollem Netz in unter 3 Sekunden", () => {
  const w = createWorld(turkey2026, 9);
  const t0 = performance.now();
  advance(w, 3650);
  const ms = performance.now() - t0;
  console.log(`Zehn Spieljahre mit Politiknetz: ${ms.toFixed(0)} ms`);
  expect(ms).toBeLessThan(3000);
});
