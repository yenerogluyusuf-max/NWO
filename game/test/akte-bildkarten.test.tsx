// Bildkarten der Bereichsakten (GESTALTUNG_2026-11-04, G3): Auswahl aus dem echten Zustand der Vorhaben, Reihenfolge,
// keine Ableger, Sprung in die Fachansicht und dreisprachige Darstellung ohne kaputte Platzhalter. Nur lesend.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, test } from "vitest";
import { advance, createWorld, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { vorhabenSicht } from "../src/sim/reich";
import { kartenAuswahl } from "../src/ui/akte/Bildkarten";
import { BereichsAkte } from "../src/ui/akte/Bereiche";
import { setzeSprache } from "../src/i18n";
import type { World } from "../src/sim/types";

const KAPUTT = /undefined|NaN|\[object|\$\{|Infinity|⟦/;
afterEach(async () => { await setzeSprache("de"); });

function welt(): World {
  const w = createWorld(turkey2026, 7);
  startAfterElection(w, schnellProfil());
  advance(w, 60);
  return w;
}

test("Auswahl: höchstens vier, Laufendes vor Möglichem vor Gesperrtem, keine Instandsetzung", () => {
  const w = welt();
  for (const bereich of ["militaer", "infrastruktur"]) {
    const a = kartenAuswahl(w, bereich);
    expect(a.length).toBeGreaterThan(0);
    expect(a.length).toBeLessThanOrEqual(4);
    const rang = { bau: 0, moeglich: 1, verlangt: 2 } as const;
    for (let i = 1; i < a.length; i++) expect(rang[a[i]!.z]).toBeGreaterThanOrEqual(rang[a[i - 1]!.z]);
    for (const { s, z } of a) {
      expect(/^(instandsetzung|sanierung)_/.test(s.v.id)).toBe(false);
      expect(s.v.bereich).toBe(bereich);
      // Der Kartenzustand folgt der Simulation: im Bau ist im Bau, möglich heißt alle Voraussetzungen erfüllt
      const echt = vorhabenSicht(w, s.v.id)!;
      if (z === "bau") expect(["im_bau", "pausiert"]).toContain(echt.status);
      if (z === "moeglich") expect(echt.status === "verfuegbar" && echt.bereit).toBe(true);
      if (z === "verlangt") expect(echt.status === "verfuegbar" && !echt.bereit).toBe(true);
    }
  }
});

test("Lage von Sicherheit und Land zeigt Bildkarten in drei Sprachen, liest nur und springt in den Reich-Reiter", async () => {
  const w = welt(), vorher = save(w);
  for (const sprache of ["de", "en", "tr"] as const) {
    await setzeSprache(sprache);
    for (const [bereich, tab] of [["sicherheit", "reich_militaer"], ["land", "reich_infra"]] as const) {
      const html = renderToStaticMarkup(createElement(BereichsAkte, {
        bereich, world: w, tabs: [{ id: tab, label: "Fachansicht" }], aktiverTab: tab, onTab: () => {}, reiter: "lage", onReiter: () => {}, children: null,
      }));
      expect(html).toContain("gz-karte");
      expect(html).toContain("ak-kopfbild");
      expect(html).not.toMatch(KAPUTT);
      expect(html).not.toContain("gz.");
    }
  }
  expect(save(w)).toBe(vorher);
});

test("Ohne passenden Reiter (Fachansicht fehlt) erscheinen keine Bildkarten, die Lage bleibt vollständig", () => {
  const w = welt();
  const html = renderToStaticMarkup(createElement(BereichsAkte, {
    bereich: "sicherheit", world: w, tabs: [], aktiverTab: "", onTab: () => {}, reiter: "lage", onReiter: () => {}, children: null,
  }));
  expect(html).not.toContain("gz-karte");
  expect(html).toContain("ak-urteil");
});

test("Leere Lageabschnitte stehen nicht mehr einzeln als „Derzeit nichts.“ da", () => {
  const w = welt();
  const html = renderToStaticMarkup(createElement(BereichsAkte, {
    bereich: "sicherheit", world: w, tabs: [], aktiverTab: "", onTab: () => {}, reiter: "lage", onReiter: () => {}, children: null,
  }));
  expect(html).not.toContain("Derzeit nichts.");
});
