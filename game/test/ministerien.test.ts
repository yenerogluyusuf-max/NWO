// AP 3 (PLAN_OBERFLAECHE_DETAIL_2026-11-05.md): die 17 Ministerien in der Simulation. Jede Maßnahme hat genau ein Amt, jede Vorlage
// kommt vom zuständigen Ministerium, das Kabinettskapital bleibt in der Summe gleich (F3), alte Spielstände bekommen die neuen Minister,
// ohne dass der Zufallsstrom der Partie sich verschiebt.

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { AEMTER, NEUE_AEMTER, sorgeText } from "../src/sim/personen";
import { AEMTER_OHNE_MINISTERIUM, MINISTERIEN, ressortVon } from "../src/data/ministerien";
import { ressortFuerMassnahme, KABINETT_AMT } from "../src/sim/ministerfluss-kern";
import { KAPITAL_GEWICHT, kabinettStatus } from "../src/sim/kabinett";
import { POSTEN } from "../src/sim/haushalt";
import { EREIGNIS_BEZUG } from "../src/sim/gespraeche";
import { ministerVorlagen } from "../src/sim/ministerfluss";
import type { World } from "../src/sim/types";

function welt(seed = 3): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  return w;
}

describe("Zuordnung", () => {
  test("Siebzehn Ministerien, jede Maßnahme des Netzes bei genau einem Amt", () => {
    expect(MINISTERIEN.length).toBe(17);
    const massnahmen = NET.nodes.filter((n) => n.kind === "massnahme").map((n) => n.id);
    const zaehler = new Map<string, number>();
    for (const m of [...MINISTERIEN, ...AEMTER_OHNE_MINISTERIUM]) for (const id of m.massnahmen) zaehler.set(id, (zaehler.get(id) ?? 0) + 1);
    expect(massnahmen.filter((id) => zaehler.get(id) !== 1)).toEqual([]);
    expect([...zaehler.keys()].filter((id) => !massnahmen.includes(id))).toEqual([]);
  });

  test("Der Ministerfluss legt jede Maßnahme beim Amt aus data/ministerien.ts vor", () => {
    for (const n of NET.nodes.filter((x) => x.kind === "massnahme")) {
      expect(ressortFuerMassnahme(n.id)).toBe(ressortVon(n.id));
      expect(AEMTER[ressortFuerMassnahme(n.id)].massnahmen).toContain(n.id);
    }
    expect(KABINETT_AMT.length).toBe(19);
  });

  test("Jeder Ausgabenposten gehört einem besetzten Regierungsamt", () => {
    for (const p of POSTEN.filter((x) => x.seite === "ausgabe")) expect(AEMTER[p.amt].regierungsamt).toBe(true);
    expect(POSTEN.find((p) => p.id === "verteidigung")!.amt).toBe("verteidigung");
    expect(POSTEN.find((p) => p.id === "gesundheit")!.amt).toBe("gesundheit");
  });

  test("Ereignisse nennen nur Größen, die ein beteiligtes Ressort kennt", () => {
    for (const [id, b] of Object.entries(EREIGNIS_BEZUG)) {
      const fach = new Set(b.amt.flatMap((a) => AEMTER[a].fach));
      for (const g of b.groessen ?? []) expect(fach.has(g) || NET.index.has(g), `${id}: ${g}`).toBe(true);
    }
  });

  test("Leitgrößen der neuen Ressorts gibt es im Netz", () => {
    for (const a of NEUE_AEMTER) for (const id of AEMTER[a].fach) expect(NET.index.has(id), `${a}: ${id}`).toBe(true);
  });
});

describe("Kabinett", () => {
  test("Eine neue Partie hat 17 Minister, Präsidialamt, Generalstab und Zentralbank, ohne doppelte Nachnamen", () => {
    const w = welt();
    const aemter = new Set(w.spiel!.figuren.map((f) => f.amt));
    for (const m of MINISTERIEN) expect(aemter).toContain(m.id);
    for (const a of ["stab", "generalstab", "zentralbank", "opposition"] as const) expect(aemter).toContain(a);
    const nach = w.spiel!.figuren.map((f) => f.name.split(" ").at(-1));
    expect(new Set(nach).size).toBe(nach.length);
    // Die neuen Minister teilen keinen Vornamen mit anderen
    const neu = w.spiel!.figuren.filter((f) => NEUE_AEMTER.has(f.amt)).map((f) => f.name.split(" ")[0]);
    const alle = w.spiel!.figuren.map((f) => f.name.split(" ")[0]);
    for (const v of neu) expect(alle.filter((x) => x === v).length, v).toBe(1);
    for (const f of w.spiel!.figuren) expect(sorgeText(w, f)).not.toMatch(/undefined|NaN|\{/);
  });

  test("F3: Gewicht 7/17, Jugend und Handel tragen nichts bei", () => {
    expect(KAPITAL_GEWICHT).toBeCloseTo(7 / 17, 10);
    const w = welt();
    const st = kabinettStatus(w);
    expect(st.minister.length).toBe(19);
    for (const m of st.minister.filter((x) => x.amt === "jugend" || x.amt === "handel")) expect(m.kapitalBeitrag).toBe(0);
    // Die Summe liegt in der Größenordnung von sieben Ämtern mit je rund 0,65 (vorher etwa 4 bis 5 Kapital im Monat)
    expect(st.kapitalSumme).toBeGreaterThan(2.5);
    expect(st.kapitalSumme).toBeLessThan(7);
  });
});

describe("Vorlagen", () => {
  test("Ein Jahr lang: Vorlagen kommen von vielen Ressorts, jede vom Amt ihrer Maßnahme (vorher die Hälfte vom Wirtschaftsminister)", () => {
    const w = welt(5);
    const zaehl: Record<string, number> = {};
    for (let m = 0; m < 12; m++) {
      w.spiel!.ereignisse = [];
      advance(w, 30);
      for (const v of ministerVorlagen(w)) {
        zaehl[v.amt] = (zaehl[v.amt] ?? 0) + 1;
        if (v.minister) expect(w.spiel!.figuren.find((f) => f.id === v.minister!.id)?.amt).toBe(v.amt);
      }
    }
    const summe = Object.values(zaehl).reduce((a, b) => a + b, 0);
    expect(Object.keys(zaehl).length).toBeGreaterThanOrEqual(8);
    expect((zaehl.wirtschaft ?? 0) / summe).toBeLessThan(0.25);
  }, 120_000);
});

describe("Ältere Spielstände", () => {
  test("Ein Stand ohne die neuen Ministerien bekommt sie beim Laden; der Zufallsstrom bleibt derselbe", () => {
    const w = welt(11);
    advance(w, 20);
    const alt = JSON.parse(save(w));
    alt.spiel.figuren = alt.spiel.figuren.filter((f: { amt: string }) => !NEUE_AEMTER.has(f.amt as never));
    for (const f of alt.spiel.figuren) if (f.amt === "wirtschaft") f.rolle = "Wirtschaftsminister";
    const mit = load(save(w));
    const ohne = load(JSON.stringify(alt));
    for (const m of MINISTERIEN) expect(ohne.spiel!.figuren.some((f) => f.amt === m.id)).toBe(true);
    expect(ohne.spiel!.figuren.find((f) => f.amt === "wirtschaft")!.rolle).not.toBe("Wirtschaftsminister");
    expect(ohne.rngState).toEqual(mit.rngState);
    // Neue Namen kollidieren nicht mit den alten
    const nach = ohne.spiel!.figuren.map((f) => f.name.split(" ").at(-1));
    expect(new Set(nach).size).toBe(nach.length);
  });
});
