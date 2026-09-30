// Kapital auf Pump: Bis 20 im Minus darf gehandelt werden; es kostet Legitimität und Vertrauen, bis die Gutschriften es ausgleichen.

import { describe, expect, test } from "vitest";
import { createWorld, advance } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { UEBERZIEHUNG, kannZahlen, nurAufPump } from "../src/sim/kapital";
import { beginne } from "../src/sim/reich";
import { fuehreAktionAus } from "../src/sim/laender";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";

function welt() {
  const w = createWorld(turkey2026, 6);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  return w;
}

describe("Überziehung des Politischen Kapitals", () => {
  test("Regeln der Grenze", () => {
    expect(UEBERZIEHUNG).toBe(20);
    expect(kannZahlen(0, 20)).toBe(true);
    expect(kannZahlen(0, 21)).toBe(false);
    expect(kannZahlen(-20, 0)).toBe(true);
    expect(kannZahlen(-20, 1)).toBe(false);
    expect(nurAufPump(2, 5)).toBe(true);
    expect(nurAufPump(10, 5)).toBe(false);
    expect(nurAufPump(0, 0)).toBe(false);
  });

  test("Mit leerem Kapital lassen sich kleine Dinge bezahlen, das Konto rutscht ins Minus", () => {
    const w = welt();
    w.spiel!.kapital = 1;
    const r = fuehreAktionAus(w, "EU", "gipfel");
    expect(r.ok, r.text).toBe(true);
    expect(w.spiel!.kapital).toBeLessThan(0);
    const b = beginne(w, "restaurierung_ephesos");
    expect(b.ok, b.text).toBe(true);
    expect(w.spiel!.kapital).toBeGreaterThanOrEqual(-20);
  });

  test("Am Ende der Überziehung ist Schluss", () => {
    const w = welt();
    w.spiel!.kapital = -19;
    const b = beginne(w, "restaurierung_ephesos");
    expect(b.ok).toBe(false);
    expect(w.spiel!.kapital).toBe(-19);
  });

  test("Im Minus sinken Legitimität und Vertrauen, die Gutschrift gleicht das Konto aus", () => {
    const w = welt();
    w.spiel!.kapital = -15;
    const l0 = nationalAverage(NET, w.net, "legitimitaet");
    advance(w, 35);
    const l1 = nationalAverage(NET, w.net, "legitimitaet");
    expect(l1).toBeLessThan(l0);
    // Die monatliche Gutschrift (etwa sieben) verkleinert das Minus
    expect(w.spiel!.kapital).toBeGreaterThan(-15);
    expect(w.spiel!.kapital).toBeLessThan(0 + 1);
  });
});
