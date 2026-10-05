// Die Politik-Akten (Programme, Bereiche, Umsetzung) zeichnen sich vollständig und ohne kaputte Zahlen (Server-Rendering).
// Geprüft wird, was der Spieler lesen muss: Lage der Programme, nächster Schritt mit Preis, Bereichs-Kennzahlen, Umsetzungsstand.

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { setPolicy } from "../src/sim/handeln";
import { PROGRAMME } from "../src/sim/programme";
import { ProgrammeAkte } from "../src/ui/politik/ProgrammeAkte";
import { Politik } from "../src/ui/politik/Politik";
import { Beschlussbuch } from "../src/ui/Beschlussbuch";
import { EMBLEM_NAMEN } from "../src/ui/politik/embleme";
import { BEREICH_THEMEN } from "../src/ui/politik/bereiche";

function neu() {
  const w = createWorld(turkey2026, 11);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 40;
  return w;
}

describe("Programme als Karten", () => {
  test("Jedes Programm erscheint mit Titel, Leitbild, Pfad und Preis des nächsten Schritts", () => {
    const w = neu();
    const html = renderToStaticMarkup(createElement(ProgrammeAkte, { world: w, refresh: () => {} }));
    for (const p of PROGRAMME) {
      expect(html, p.titel).toContain(p.titel.replace(/&/g, "&amp;"));
      expect(html).toContain(p.leitbild.slice(0, 30).replace(/"/g, "&quot;"));
    }
    expect(html).toContain("Stationen des Programms");
    expect(html).toContain("Kapital");
    expect(html).toContain("Danach");
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("undefined");
  });

  test("Die Zähler nennen die Plätze und die bereiten Schritte", () => {
    const w = neu();
    const html = renderToStaticMarkup(createElement(ProgrammeAkte, { world: w, refresh: () => {} }));
    expect(html).toMatch(/von 2 Plätzen belegt/);
    expect(html).toMatch(/Programme erfüllt/);
  });

  test("Alle Programme und Bereiche haben ein Emblem", () => {
    const ids = new Set<string>(EMBLEM_NAMEN);
    for (const t of BEREICH_THEMEN) expect(ids.has(t), `Bereich ${t}`).toBe(true);
  });
});

describe("Bereiche", () => {
  test("Der Überblick zeigt alle Bereiche mit Lage und Kennzahlen", () => {
    const w = neu();
    const html = renderToStaticMarkup(createElement(Politik, { world: w, refresh: () => {}, onDecided: () => {} }));
    expect(html).toContain("Alle Bereiche");
    expect(html).toContain("akute Probleme");
    expect((html.match(/po-rail-eintrag/g) ?? []).length).toBeGreaterThanOrEqual(BEREICH_THEMEN.length);
    expect(html).not.toContain("NaN");
  });

  test("Ein Bereich nennt Probleme, Lage und Maßnahmen mit Stufe und Kosten", () => {
    const w = neu();
    const html = renderToStaticMarkup(createElement(Politik, { world: w, refresh: () => {}, onDecided: () => {}, start: "wohnen" }));
    expect(html).toContain("Wohnen, Bau und Erdbeben");
    expect(html).toContain("Maßnahmen");
    expect(html).toContain("Lage");
    expect(html).toContain("pd-massnahmen");
    expect(html).not.toContain("NaN");
  });
});

describe("Umsetzung", () => {
  test("Eine beschlossene Änderung erscheint mit Stand und Ziel", () => {
    const w = neu();
    setPolicy(w, "m_mindestlohn", 80, null);
    const html = renderToStaticMarkup(createElement(Beschlussbuch, { world: w, refresh: () => {}, teil: "beschluesse" }));
    expect(html).toContain("Von Beschluss zu Wirkung");
    expect(html).toContain("In Umsetzung");
    expect(html).toContain("Beschlüsse");
    expect(html).not.toContain("NaN");
  });

  test("Ohne Berichte erklärt die Akte, wann der erste kommt", () => {
    const w = neu();
    const html = renderToStaticMarkup(createElement(Beschlussbuch, { world: w, refresh: () => {}, teil: "beschluesse" }));
    expect(html).toMatch(/Was die Beschlüsse bewirkt haben/);
  });
});
