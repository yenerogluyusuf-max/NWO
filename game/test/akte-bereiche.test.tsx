// Acht Bereichsakten auf dem Gerüst: jede rendert alle Reiter in drei Sprachen ohne kaputte Platzhalter,
// hat drei Kernwerte, und die vorhandenen Ansichten bleiben unter „Instrumente“ erreichbar (Kinder werden durchgereicht).

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vitest";
import { advance, createWorld, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { AkteRahmen, BEREICHE, BereichsAkte, kernwerteBereich, lageUrteil } from "../src/ui/akte/Bereiche";
import type { AktenReiterId } from "../src/ui/akte/Akte";
import { setzeSprache } from "../src/i18n";
import type { World } from "../src/sim/types";

const KAPUTT = /undefined|NaN|\[object|\$\{|Infinity|⟦/;
const REITER: AktenReiterId[] = ["lage", "instrumente", "verlauf", "personen", "vorgaenge"];

afterEach(async () => {
  await setzeSprache("de");
});

function welt(): World {
  const w = createWorld(turkey2026, 7);
  startAfterElection(w, schnellProfil());
  advance(w, 95);
  return w;
}

function rendere(w: World, bereich: (typeof BEREICHE)[number], reiter: AktenReiterId): string {
  return renderToStaticMarkup(
    createElement(BereichsAkte, {
      bereich,
      world: w,
      tabs: [{ id: "a", label: "Erste Ansicht" }, { id: "b", label: "Zweite Ansicht" }],
      aktiverTab: "a",
      onTab: () => {},
      reiter,
      onReiter: () => {},
      children: createElement("div", { id: "bestehende-ansicht" }, "Bestehend"),
    }),
  );
}

describe("Bereichsakten", () => {
  test("alle acht Akten, alle Reiter, drei Sprachen", async () => {
    const w = welt();
    for (const sprache of ["de", "tr", "en"] as const) {
      await setzeSprache(sprache);
      for (const b of BEREICHE) {
        for (const r of REITER) {
          const html = rendere(w, b, r);
          expect(html, `${sprache}/${b}/${r}`).toContain("ak-akte");
          expect(html, `${sprache}/${b}/${r}`).not.toMatch(KAPUTT);
          expect(html, `${sprache}/${b}/${r}`).not.toMatch(/akte\.b\./);
        }
      }
    }
  });

  test("Instrumente zeigen die bestehende Ansicht und die Unterreiter", () => {
    const w = welt();
    for (const b of BEREICHE) {
      const html = rendere(w, b, "instrumente");
      expect(html).toContain("bestehende-ansicht");
      expect(html).toContain("Zweite Ansicht");
    }
  });

  test("je drei Kernwerte ohne kaputte Werte", () => {
    const w = welt();
    for (const b of BEREICHE) {
      const k = kernwerteBereich(w, b);
      expect(k, b).toHaveLength(3);
      for (const x of k) expect(`${x.label} ${x.wert}`).not.toMatch(KAPUTT);
      // Im laufenden Spiel hat jeder Kernwert eine Zahl; ein Strich hieße falsche Knoten-ID
      for (const x of k) expect(x.wert, `${b}: ${x.label}`).not.toBe("—");
    }
  });

  test("Lage-Urteil: ein Satz ohne Platzhalter, Stufe passt zu den Tönen", async () => {
    const w = welt();
    for (const sprache of ["de", "tr", "en"] as const) {
      await setzeSprache(sprache);
      for (const b of BEREICHE) {
        const u = lageUrteil(w, b);
        expect(["ruhig", "gemischt", "angespannt", "kritisch"]).toContain(u.stufe);
        expect(u.satz.length).toBeGreaterThan(5);
        expect(u.satz).not.toMatch(KAPUTT);
        const schlecht = kernwerteBereich(w, b).filter((k) => k.ton === "schlecht").length;
        if (schlecht >= 2) expect(u.stufe).toBe("kritisch");
        if (schlecht === 0) expect(u.stufe).not.toBe("angespannt");
      }
    }
  });

  test("ohne Bereich bleibt der Inhalt unverändert", () => {
    const html = renderToStaticMarkup(
      createElement(AkteRahmen, {
        world: welt(), tabs: [], aktiverTab: "x", onTab: () => {}, reiter: "lage", onReiter: () => {},
        children: createElement("p", null, "nur"),
      }),
    );
    expect(html).toBe("<p>nur</p>");
  });
});

describe("Speicherkompatibilität", () => {
  const datei = `${homedir()}/Downloads/staatsraeson_2029-11-20.json`;
  test.skipIf(!existsSync(datei))("Stand vom 20.11.2029: alle acht Akten rechnen, 24 Monate laufen (Datei nur gelesen)", () => {
    const d = JSON.parse(readFileSync(datei, "utf8")) as { welt: unknown };
    const w = load(JSON.stringify(d.welt));
    for (const b of BEREICHE) for (const r of REITER) expect(rendere(w, b, r)).not.toMatch(KAPUTT);
    for (let i = 0; i < 24; i++) {
      advance(w, 30);
      w.spiel!.ereignisse = [];
      if (w.spiel!.ende) break;
    }
    for (const b of BEREICHE) {
      expect(kernwerteBereich(w, b)).toHaveLength(3);
      for (const r of REITER) expect(rendere(w, b, r)).not.toMatch(KAPUTT);
    }
  }, 180_000);
});
