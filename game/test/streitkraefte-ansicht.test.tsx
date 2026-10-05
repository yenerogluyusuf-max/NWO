// Ansicht der Streitkräfte (ui/militaer/Streitkraefte.tsx): rendert in drei Sprachen ohne offene Platzhalter oder fehlende Schlüssel,
// zeigt Kampfkraft, alle Gattungen, laufende Vorhaben und im Krieg die Zielräume.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { setzeSprache } from "../src/i18n";
import { weltZustand } from "../src/sim/laender";
import { kriegMonat } from "../src/sim/krieg";
import { Rng } from "../src/sim/rng";
import { Streitkraefte } from "../src/ui/militaer/Streitkraefte";

afterEach(async () => {
  await setzeSprache("de");
});

describe("Streitkräfte-Ansicht", () => {
  test.each(["de", "tr", "en"] as const)("rendert vollständig (%s)", async (sprache) => {
    await setzeSprache(sprache);
    const w = createWorld(turkey2026, 6);
    startAfterElection(w, schnellProfil());
    weltZustand(w)["GRC"]!.konflikt = 80;
    kriegMonat(w, new Rng(1));
    const html = renderToStaticMarkup(createElement(Streitkraefte, { world: w, refresh: () => {} }));
    expect(html).not.toMatch(/\{\w+\}/);
    expect(html).not.toMatch(/militaer\.\w/);
    expect(html).toContain("sk-karte");
    expect((html.match(/class="sk-karte"/g) ?? []).length).toBe(8);
    expect(html).toContain("sk-ziele");
    expect(html).toContain("KAAN");
  });
});
