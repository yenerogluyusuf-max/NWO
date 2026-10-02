// Energie-Modul (RECHERCHE_ENERGIE.md, Abschnitt 6): Die neuen Knoten sind im Netz
// erreichbar und verbunden, die Maßnahmen wirken über die Verbindungen in die
// erwartete Richtung, und die Vorschlagslogik („was bringt am meisten“) bricht nicht.

import { describe, expect, test } from "vitest";
import { EDGES, NODES } from "../src/data/politiknetz";
import { nationalAverage, PROVINCES } from "../src/sim/netz";
import { advance, createWorld, NET, setPolicy } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { akuteProbleme, vorschlaege } from "../src/sim/vorschlaege";
import { hebel } from "../src/sim/wege";
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

const GROESSEN = ["gasabhaengigkeit", "sakarya_gas", "strommix", "energieversorgung", "energie_importrechnung", "energie_subventionslast", "strompreis"];
const MASSNAHMEN = ["m_lng_vertraege", "m_regas_ausbau", "m_gasspeicher", "m_yeka_serie", "m_sakarya_phase3", "m_akkuyu_ppa", "m_heimische_kohle", "m_energieeffizienz", "m_preiswahrheit", "m_gashub"];

describe("Energie-Knoten im Katalog", () => {
  test("die sieben Größen, die Mangellage und zehn neue Maßnahmen sind im Netz und verbunden", () => {
    const touched = new Set(EDGES.flatMap((k) => [k.from, k.to]));
    for (const id of [...GROESSEN, "p_energiemangel", ...MASSNAHMEN]) {
      expect(NET.index.has(id)).toBe(true);
      expect(touched.has(id)).toBe(true);
    }
  });

  test("die Energie-Maßnahmen tragen Kosten und Umsetzungsdauer", () => {
    for (const id of MASSNAHMEN) {
      const n = NODES.find((x) => x.id === id)!;
      expect(n.kind).toBe("massnahme");
      expect(typeof n.cost).toBe("number");
      expect(n.months).toBeGreaterThan(0);
    }
  });

  test("die Mangellage ist ein Problem mit Hysterese-Schwelle 60 (akut ≥ 60, Ende < 52)", () => {
    const n = NODES.find((x) => x.id === "p_energiemangel")!;
    expect(n.kind).toBe("problem");
    expect(n.threshold).toBe(60);
  });
});

describe("Energie-Maßnahmen wirken über die Verbindungen", () => {
  test("Gasspeicher-Ausbau erhöht die Versorgungssicherheit und drückt die Mangellage", () => {
    const up = (w: World) => setPolicy(w, "m_gasspeicher", 90);
    expect(avgAfter(36, "energieversorgung", up)).toBeGreaterThan(avgAfter(36, "energieversorgung") + 1);
    expect(avgAfter(36, "p_energiemangel", up)).toBeLessThan(avgAfter(36, "p_energiemangel"));
  });

  test("Preiswahrheit senkt die Subventionslast und verteuert die Energie", () => {
    const up = (w: World) => setPolicy(w, "m_preiswahrheit", 80);
    expect(avgAfter(12, "energie_subventionslast", up)).toBeLessThan(avgAfter(12, "energie_subventionslast") - 1);
    expect(avgAfter(12, "energiepreise", up)).toBeGreaterThan(avgAfter(12, "energiepreise"));
  });

  test("LNG-Verträge senken die Abhängigkeit und stützen die Versorgung", () => {
    const up = (w: World) => setPolicy(w, "m_lng_vertraege", 85);
    expect(avgAfter(24, "gasabhaengigkeit", up)).toBeLessThan(avgAfter(24, "gasabhaengigkeit"));
    expect(avgAfter(24, "energieversorgung", up)).toBeGreaterThan(avgAfter(24, "energieversorgung"));
  });

  test("Sakarya Phase 3 hebt die eigene Förderung und senkt die Importrechnung", () => {
    const up = (w: World) => setPolicy(w, "m_sakarya_phase3", 85);
    expect(avgAfter(36, "sakarya_gas", up)).toBeGreaterThan(avgAfter(36, "sakarya_gas") + 1);
    expect(avgAfter(36, "energie_importrechnung", up)).toBeLessThan(avgAfter(36, "energie_importrechnung"));
  });
});

describe("Vom Problem zum Vorschlag", () => {
  test("Hebel für die Mangellage zeigen die Energie-Maßnahmen in der richtigen Richtung", () => {
    const h = hebel("p_energiemangel", -1, 12);
    const ids = h.map((x) => x.node.id);
    expect(ids).toContain("m_gasspeicher");
    expect(ids).toContain("m_lng_vertraege");
    expect(ids).toContain("m_regas_ausbau");
    for (const x of h) if (["m_gasspeicher", "m_lng_vertraege", "m_regas_ausbau"].includes(x.node.id)) expect(x.richtung).toBe(1);
  });

  test("Vorschläge laufen auch bei landesweit akuter Energie-Mangellage", () => {
    const w = createWorld(turkey2026, 3);
    startAfterElection(w, schnellProfil());
    w.spiel!.ereignisse = [];
    const i = NET.index.get("p_energiemangel")!;
    for (let p = 0; p < PROVINCES; p++) w.net.values[i * PROVINCES + p] = 70;
    expect(akuteProbleme(w).some((a) => a.id === "p_energiemangel")).toBe(true);
    const vs = vorschlaege(w, 8);
    expect(Array.isArray(vs)).toBe(true);
    for (const v of vs) expect(NET.index.has(v.massnahme)).toBe(true);
  });
});
