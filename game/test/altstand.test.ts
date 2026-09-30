// Ältere Spielstände (mit weniger Knoten im Politiknetz) laufen weiter: Die neuen Knoten bekommen Startwerte, nichts wird NaN.

import { describe, expect, test } from "vitest";
import { createWorld, advance, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { kapitalEinkommen } from "../src/sim/spiel";
import { nationalAverage } from "../src/sim/netz";
import type { World } from "../src/sim/types";

/** So sah der Spielstand vor der Erweiterung aus: das Netz mit nur den alten 199 Knoten. */
function alterStand(): string {
  const w = createWorld(turkey2026, 9);
  startAfterElection(w, schnellProfil());
  advance(w, 200);
  const alt = 199 * 81;
  w.net.values.length = alt;
  w.net.start.length = alt;
  for (const s of w.net.history) s.length = alt;
  if (w.net.acute) w.net.acute.length = alt;
  delete w.spiel!.reich;
  return JSON.stringify(w);
}

describe("Alter Spielstand", () => {
  test("wird beim Laden um die neuen Knoten ergänzt", () => {
    const w = load(alterStand());
    expect(w.net.values).toHaveLength(NET.nodes.length * 81);
    expect(w.net.start).toHaveLength(NET.nodes.length * 81);
    for (const s of w.net.history) expect(s).toHaveLength(NET.nodes.length * 81);
    for (const id of ["legitimitaet", "justiz_unabhaengigkeit", "kulturerbe", "bereitschaft_heer"]) expect(Number.isFinite(nationalAverage(NET, w.net, id)), id).toBe(true);
  });

  test("Kapital, Zustimmung und Wirtschaft bleiben Zahlen, auch nach Jahren", () => {
    const w: World = load(alterStand());
    expect(Number.isFinite(kapitalEinkommen(w).summe)).toBe(true);
    advance(w, 365 * 2);
    expect(Number.isFinite(w.spiel!.kapital)).toBe(true);
    expect(Number.isFinite(w.spiel!.umfrage.zustimmung)).toBe(true);
    expect(Number.isFinite(w.economy.inflation)).toBe(true);
    expect(Number.isFinite(w.economy.usdTry)).toBe(true);
    expect(Number.isFinite(w.economy.policyRate)).toBe(true);
    for (let i = 0; i < w.net.values.length; i++) expect(Number.isFinite(w.net.values[i]!), `Index ${i}`).toBe(true);
  });

  test("Ohne Migration wäre es NaN (der Fehler ist real)", () => {
    const w: World = JSON.parse(alterStand());
    // ungeladen, ohne Ergänzung: Die fehlenden Knoten liefern keine Zahl
    expect(Number.isFinite(nationalAverage(NET, w.net, "legitimitaet"))).toBe(false);
  });
});

describe("Beschädigter Spielstand (NaN wurde als null gespeichert)", () => {
  test("wird beim Laden repariert und spielt weiter", () => {
    const w = createWorld(turkey2026, 11);
    startAfterElection(w, schnellProfil());
    advance(w, 120);
    // so, wie JSON.stringify NaN ablegt
    w.spiel!.kapital = NaN;
    w.spiel!.umfrage.zustimmung = NaN;
    w.economy.inflation = NaN;
    w.economy.usdTry = NaN;
    w.economy.policyRate = NaN;
    w.net.values[5 * 81 + 3] = NaN;
    const geladen = load(JSON.stringify(w));
    expect(geladen.spiel!.kapital).toBeGreaterThan(0);
    for (const k of ["inflation", "usdTry", "policyRate"] as const) expect(Number.isFinite(geladen.economy[k]), k).toBe(true);
    expect(Number.isFinite(geladen.net.values[5 * 81 + 3]!)).toBe(true);
    advance(geladen, 365);
    expect(Number.isFinite(geladen.spiel!.kapital)).toBe(true);
    expect(Number.isFinite(geladen.spiel!.umfrage.zustimmung)).toBe(true);
  });
});
