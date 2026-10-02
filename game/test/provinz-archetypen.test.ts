// Provinz-Archätypen: Zuordnung vollständig, Delta-Matrix konsistent, und die
// Startwerte zweier Provinzen aus verschiedenen Archätypen unterscheiden sich in
// den erwarteten Knoten (RECHERCHE_PROVINZDATEN.md, Abschnitt 4).

import { describe, expect, test } from "vitest";
import { ARCHETYP_DELTAS, ARCHETYPEN, DELTAS, archetypName, archetypVon } from "../src/data/provinz_archetypen";
import { NODES } from "../src/data/politiknetz";
import { PROVINCES, provinceValue } from "../src/sim/netz";
import { createWorld, NET } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";

describe("Archätyp-Schicht", () => {
  test("81 Provinzen sind genau einem der acht Archätypen zugeordnet", () => {
    const alle = ARCHETYPEN.flatMap((a) => a.provinzen);
    expect(alle.length).toBe(PROVINCES);
    expect(new Set(alle).size).toBe(PROVINCES);
    for (const p of alle) {
      expect(p).toBeGreaterThanOrEqual(1);
      expect(p).toBeLessThanOrEqual(PROVINCES);
    }
    expect(archetypVon(34)?.id).toBe(1); // İstanbul: Metropol-Industrie-Kern
    expect(archetypVon(4)?.id).toBe(8); // Ağrı: Ost-Anatolien peripher
    expect(archetypName(42)).toContain("Agrar-Steppe"); // Konya
  });

  test("Delta-Matrix zeigt nur auf bekannte Knoten, mit acht Spalten und 81 Werten je Provinz", () => {
    const bekannt = new Set(NODES.map((n) => n.id));
    expect(Object.keys(DELTAS).length).toBeGreaterThan(20);
    for (const [id, d] of Object.entries(DELTAS)) {
      expect(bekannt.has(id)).toBe(true);
      expect(d.length).toBe(ARCHETYPEN.length);
    }
    for (const arr of Object.values(ARCHETYP_DELTAS)) expect(arr.length).toBe(PROVINCES);
    // Arbeitslosigkeit bleibt außen vor: dort stehen echte Provinzwerte in provinzdaten.json
    expect(DELTAS.arbeitslosigkeit).toBeUndefined();
  });
});

describe("Startwerte nach Archätyp", () => {
  test("İstanbul (Metropol) und Ağrı (Ost peripher) unterscheiden sich in den erwarteten Knoten", () => {
    const w = createWorld(turkey2026, 1);
    // Metropolen: teurer, industrieller, ungleicher; der Osten: Abwanderung, wenig Industrie
    expect(provinceValue(NET, w.net, "mieten", 34)).toBeGreaterThan(provinceValue(NET, w.net, "mieten", 4));
    expect(provinceValue(NET, w.net, "industrie", 34)).toBeGreaterThan(provinceValue(NET, w.net, "industrie", 4));
    expect(provinceValue(NET, w.net, "ungleichheit", 34)).toBeGreaterThan(provinceValue(NET, w.net, "ungleichheit", 4));
    expect(provinceValue(NET, w.net, "p_abwanderung", 4)).toBeGreaterThan(provinceValue(NET, w.net, "p_abwanderung", 34));
    expect(provinceValue(NET, w.net, "p_landflucht", 4)).toBeGreaterThan(provinceValue(NET, w.net, "p_landflucht", 34));
    expect(provinceValue(NET, w.net, "terrorgefahr", 4)).toBeGreaterThan(provinceValue(NET, w.net, "terrorgefahr", 34));
  });

  test("Konya (Agrar-Steppe) startet trockener als Trabzon (Karadeniz)", () => {
    const w = createWorld(turkey2026, 1);
    expect(provinceValue(NET, w.net, "p_wassermangel", 42)).toBeGreaterThan(provinceValue(NET, w.net, "p_wassermangel", 61));
    expect(provinceValue(NET, w.net, "wasserversorgung", 42)).toBeLessThan(provinceValue(NET, w.net, "wasserversorgung", 61));
  });

  test("Antalya (Tourismus-Küste) startet touristischer als Gaziantep (Südost/GAP)", () => {
    const w = createWorld(turkey2026, 1);
    expect(provinceValue(NET, w.net, "tourismus", 7)).toBeGreaterThan(provinceValue(NET, w.net, "tourismus", 27));
    expect(provinceValue(NET, w.net, "p_migrationsdruck", 27)).toBeGreaterThan(provinceValue(NET, w.net, "p_migrationsdruck", 7));
  });
});
