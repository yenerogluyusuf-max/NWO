// Die kompakte Vorlagenkarte: Am Schreibtisch erscheint dieselbe Karte kompakt (Lage in einem Satz, Wirkzeile statt Tabelle,
// Optionen zugeklappt hinter „Aufschlagen“), im Ministerrat voll. Der Test hält die Zusage aus dem Kartenkopf:
// kein Doppeltext (was die Wirkzeile sagt, steht nicht noch einmal in der Lage), Knöpfe nach dem, was sie auslösen,
// und in allen Sprachen keine kaputten Schlüssel.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, describe, expect, it } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { ministerVorlagen } from "../src/sim/ministerfluss";
import { knopfText, lageSatz, VorlageKarte } from "../src/ui/minister/VorlageKarte";
import { setzeSprache } from "../src/i18n";
import type { Vorlage } from "../src/sim/ministerfluss-typen";
import type { World } from "../src/sim/types";

const KAPUTT = /undefined|NaN|\[object|mf\.[a-z]/;

function welt(): World {
  const w = createWorld(turkey2026, 11);
  startAfterElection(w, schnellProfil());
  advance(w, 45);
  return w;
}

function vorlage(): Vorlage {
  const w = welt();
  const v = ministerVorlagen(w).find((x) => x.optionen.length >= 2 && x.anlass.length > 0);
  expect(v, "es muss eine Vorlage mit mindestens zwei Optionen vorliegen").toBeTruthy();
  return v!;
}

function html(v: Vorlage, kompakt: boolean): string {
  return renderToStaticMarkup(
    createElement(VorlageKarte, { v, kompakt, nummer: 1, onEntscheide: () => {} }),
  );
}

describe("Lage in einem Satz", () => {
  it("nimmt den ersten Satz mit Zahl", () => {
    const z = lageSatz("Die Überfüllung liegt bei 124 Prozent. Die Gefängnisse sind voll. Weitere Sätze folgen.");
    expect(z.satz).toBe("Die Überfüllung liegt bei 124 Prozent.");
    expect(z.rest).toContain("Gefängnisse");
  });

  it("holt den Satz mit Zahl nach, wenn der erste ohne ist", () => {
    const z = lageSatz("Die Lage spitzt sich zu. Rund 41 Prozent der Plätze sind belegt. Der Rest steht unter dem Klappdeckel.");
    expect(z.satz).toContain("41 Prozent");
    expect(z.rest).not.toContain("41 Prozent");
  });

  it("hält bei einem Satz alles drin", () => {
    const z = lageSatz("Ein Satz mit 12 Zahlen.");
    expect(z.satz).toContain("12");
    expect(z.rest).toBe("");
  });
});

describe("Knöpfe nach dem, was sie auslösen", () => {
  it("beschriftet jede Option über den Aktionstyp, ohne rohe Schlüssel", () => {
    const v = vorlage();
    for (const o of v.optionen) {
      const text = knopfText(o);
      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toMatch(/^mf\./);
    }
  });
});

describe("Die Karte in beiden Modi", () => {
  it("kompakt: zugeklappt, mit Schwellenzeile, ohne doppelte Lage", () => {
    const v = vorlage();
    const html = renderToStaticMarkup(createElement(VorlageKarte, { v, kompakt: true, nummer: 1, onEntscheide: () => {} }));
    expect(html).toMatch(/mf-karte[^"]*kompakt/);
    expect(html).not.toContain("mf-mehr");
    expect(html).not.toMatch(KAPUTT);
  });

  it("voll: Lage-Ausarbeitung und alle Optionen offen", () => {
    const v = vorlage();
    const html = renderToStaticMarkup(createElement(VorlageKarte, { v, nummer: 1, onEntscheide: () => {} }));
    expect(html).not.toContain("kompakt");
    expect(html).not.toMatch(KAPUTT);
  });

  it("die kompakte Karte zeigt den Minister mit Namen und Amt", () => {
    const v = vorlage();
    const html = renderToStaticMarkup(createElement(VorlageKarte, { v, kompakt: true, nummer: 1, onEntscheide: () => {} }));
    if (v.minister) {
      expect(html).toContain(v.minister.name);
      expect(html).toContain("mf-wer");
    }
  });

  for (const s of ["tr", "en"] as const) {
    it(`rendert kompakt auf ${s} ohne kaputte Texte`, async () => {
      await setzeSprache(s);
      const html = renderToStaticMarkup(
        createElement(VorlageKarte, { v: vorlage(), kompakt: true, nummer: 1, onEntscheide: () => {} }),
      );
      expect(html).not.toMatch(KAPUTT);
    });
  }

  afterAll(async () => {
    await setzeSprache("de");
  });
});
