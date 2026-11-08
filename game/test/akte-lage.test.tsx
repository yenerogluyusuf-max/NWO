// Akten-Gerüst und Navigation (Stufe 1): Wirtschaftsakte als Referenz, Mehrheit getrennt, Kapital addiert sich auf, drei Startfragen,
// alter Spielstand lädt mit den neuen Ansichten und läuft 24 Monate.

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vitest";
import { advance, createWorld, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { kapitalEinkommen } from "../src/sim/spiel";
import { WirtschaftAkte, kernwerteWirtschaft } from "../src/ui/wirtschaft/Akte";
import { kapitalTeile, mehrheitsSicht, startFragen } from "../src/ui/akte/lage";
import { setzeSprache } from "../src/i18n";
import type { World } from "../src/sim/types";

const KAPUTT = /undefined|NaN|\[object|\$\{|Infinity|⟦/;

afterEach(async () => {
  await setzeSprache("de");
});

function welt(): World {
  const w = createWorld(turkey2026, 7);
  startAfterElection(w, schnellProfil());
  advance(w, 95);
  return w;
}

describe("Akten-Gerüst: Wirtschaft als Referenz", () => {
  test("alle Reiter rendern ohne kaputte Platzhalter, in drei Sprachen", async () => {
    const w = welt();
    for (const sprache of ["de", "tr", "en"] as const) {
      await setzeSprache(sprache);
      for (const start of ["lage", "zentralbank", "haushalt"] as const) {
        const html = renderToStaticMarkup(createElement(WirtschaftAkte, { world: w, start }));
        expect(html).toContain("ak-akte");
        expect(html).not.toMatch(KAPUTT);
      }
    }
  });

  test("drei Kernwerte mit Verlauf", () => {
    const k = kernwerteWirtschaft(welt());
    expect(k).toHaveLength(3);
    for (const x of k) expect(x.wert).not.toMatch(KAPUTT);
  });
});

describe("Kopfleiste und Schreibtisch", () => {
  test("Kapital: die Teile addieren sich genau zur Gutschrift", () => {
    const w = welt();
    const k = kapitalEinkommen(w);
    const summe = kapitalTeile(k).reduce((s, p) => s + p.wert, 0);
    expect(summe).toBeCloseTo(k.summe, 9);
  });

  test("Mehrheit trennt Lager, Duldung und Opposition und zeigt nie 600/600 ohne Parlament", () => {
    const w = welt();
    const m = mehrheitsSicht(w);
    expect(m.vorhanden).toBe(true);
    expect(m.lager + m.geduldet + m.opposition).toBe(600);
    expect(m.lager).toBeLessThan(600);
    const leer = createWorld(turkey2026, 1);
    expect(mehrheitsSicht(leer).vorhanden).toBe(false);
  });

  test("drei Startfragen aus vorhandenen Daten", () => {
    const f = startFragen(welt());
    for (const x of [f.abhaengig, f.zuerst, f.liegenLassen]) {
      expect(x.length).toBeGreaterThan(10);
      expect(x).not.toMatch(KAPUTT);
    }
  });
});

describe("Speicherkompatibilität", () => {
  const datei = `${homedir()}/Downloads/staatsraeson_2029-11-20.json`;
  test.skipIf(!existsSync(datei))("Stand vom 20.11.2029 lädt, neue Ansichten rechnen, 24 Monate laufen (Datei nur gelesen)", () => {
    const d = JSON.parse(readFileSync(datei, "utf8")) as { welt: unknown };
    const w = load(JSON.stringify(d.welt));
    expect(renderToStaticMarkup(createElement(WirtschaftAkte, { world: w }))).not.toMatch(KAPUTT);
    expect(mehrheitsSicht(w).vorhanden).toBe(true);
    for (let i = 0; i < 24; i++) {
      advance(w, 30);
      w.spiel!.ereignisse = [];
      if (w.spiel!.ende) break;
    }
    expect(startFragen(w).abhaengig).not.toMatch(KAPUTT);
    expect(kapitalTeile(kapitalEinkommen(w)).reduce((s, p) => s + p.wert, 0)).toBeCloseTo(kapitalEinkommen(w).summe, 9);
  }, 120_000);
});
