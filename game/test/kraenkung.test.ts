// Beobachter-Kränkungen (sim/kraenkung.ts): Schutzmächte des Opfers verlieren Vertrauen und gewinnen Konflikt; Sanktion und Angriff lösen aus.
import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { BEOBACHTER, kraenke } from "../src/sim/kraenkung";
import { dimensionZu, weltZustand } from "../src/sim/laender";
import { fuehreInstrumentAus } from "../src/sim/diplomatie";
import { formatiere } from "../src/i18n/format";
import type { World } from "../src/sim/types";

function welt(): World {
  const w = createWorld(turkey2026, 4);
  startAfterElection(w, schnellProfil());
  w.spiel!.kapital = 150;
  return w;
}

describe("Beobachter", () => {
  test("Ein Angriff auf Griechenland kränkt EU und USA, nicht Russland", () => {
    const w = welt();
    const vor = { eu: dimensionZu(w, "EU", "vertrauen"), usa: dimensionZu(w, "USA", "vertrauen"), rus: dimensionZu(w, "RUS", "vertrauen"), euK: weltZustand(w)["EU"]!.konflikt };
    expect(kraenke(w, "GRC", "angriff")).toEqual(["EU", "USA"]);
    expect(dimensionZu(w, "EU", "vertrauen")).toBeLessThan(vor.eu);
    expect(dimensionZu(w, "USA", "vertrauen")).toBeLessThan(vor.usa);
    expect(weltZustand(w)["EU"]!.konflikt).toBeGreaterThan(vor.euK);
    expect(dimensionZu(w, "RUS", "vertrauen")).toBeCloseTo(vor.rus, 6);
    expect(weltZustand(w)["EU"]!.erinnerung.at(-1)).toMatch(/Angriff gegen Griechenland/);
  });
  test("Die Sanktion gegen Russland lässt China zusehen", () => {
    const w = welt();
    const vor = dimensionZu(w, "CHN", "vertrauen");
    const r = fuehreInstrumentAus(w, "sanktion", "RUS");
    expect(r.ok).toBe(true);
    expect(dimensionZu(w, "CHN", "vertrauen")).toBeLessThan(vor);
  });
  test("Jeder Beobachter ist ein Land des Spiels; Notizen sind richtig gebeugt", () => {
    const w = welt();
    for (const [opfer, zeugen] of Object.entries(BEOBACHTER)) for (const z of [opfer, ...zeugen]) expect(weltZustand(w)[z], z).toBeDefined();
    expect(formatiere("Sah die türkischen Sanktionen gegen {opfer}", { opfer: "Vereinigte Staaten" }, "de")).toBe("Sah die türkischen Sanktionen gegen die Vereinigten Staaten");
  });
});
