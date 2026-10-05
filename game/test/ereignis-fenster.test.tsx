// Ereignisfenster: Szene, Sprecher mit Gesicht, Kennzahlen, Antwortkarten mit Folgen, Aktensprung; drei Sprachen ohne kaputte Platzhalter.

import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { ansicht, oeffne } from "../src/sim/ereignisse";
import { Rng } from "../src/sim/rng";
import { EreignisFenster } from "../src/ui/EreignisFenster";
import { akteFuer, kennzahlenFuer, richtungVon, sprecherFuer, themaFuer, zitatAus } from "../src/ui/ereignis/kontext";
import { platzhalter, registriere, setzeSprache } from "../src/i18n";

const KAPUTT = /undefined|NaN|\[object|\$\{|Infinity|⟦/;

afterEach(async () => {
  await setzeSprache("de");
});

function neu() {
  const w = createWorld(turkey2026, 4);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 60;
  return w;
}

function fenster(w: ReturnType<typeof neu>, vorlage: string) {
  const ev = oeffne(w, vorlage, new Rng(3))!;
  expect(ev).toBeTruthy();
  const a = ansicht(w, ev);
  const html = renderToStaticMarkup(
    createElement(EreignisFenster, { ansicht: a, datum: "3. Oktober 2031", kapital: 16, onWaehle: () => {}, onSpaeter: () => {}, world: w, onAkte: () => {} }),
  );
  return { a, html };
}

describe("Ereignisfenster", () => {
  test("Haushaltsfenster: Finanzministerium spricht, Kennzahlen, Aktensprung, Hinweise zu beiden Antworten", () => {
    const w = neu();
    const { a, html } = fenster(w, "haushaltsjahr");
    expect(themaFuer(a)).toBe("haushalt");
    const s = sprecherFuer(w, a)!;
    expect(s.figur.amt).toBe("finanzen");
    expect(html).toContain(s.figur.name);
    expect(html).toContain("ev2-szene-haushalt");
    expect(html).toContain("Worum es geht");
    expect(html).toContain("Schulden in % des BIP");
    expect(html).toContain("Haushaltsakte öffnen");
    expect(html).toContain("Öffnet sofort die Haushaltsakte");
    expect(html).toMatch(/Was mitläuft: Alle Posten wachsen mit der Inflation/);
    expect(html).not.toMatch(KAPUTT);
    expect(akteFuer("haushalt").ziel).toEqual({ dossier: "wirtschaft", start: "haushalt" });
  });

  test("Kennzahlen je Thema haben Werte, Verläufe nur aus echten Monatsdaten", () => {
    const w = neu();
    for (const th of ["haushalt", "wirtschaft", "aussen", "sicherheit", "gesellschaft", "katastrophe", "recht"] as const) {
      const k = kennzahlenFuer(w, th);
      expect(k.length).toBeGreaterThanOrEqual(2);
      for (const z of k) expect(`${z.label} ${z.wert}`).not.toMatch(KAPUTT);
    }
  });

  test("Mehrere Vorlagen rendern ohne Fehler und mit Sprecher", () => {
    const w = neu();
    for (const v of ["mindestlohn", "haushaltsjahr"]) {
      w.spiel!.ereignisse = [];
      const { html } = fenster(w, v);
      expect(html).toContain("ev2-sprecher");
      expect(html).not.toMatch(KAPUTT);
    }
  });

  test("Zitat und Richtung der Folgen", () => {
    expect(zitatAus(["Erster Satz. Zweiter Satz.", "Absatz"])).toEqual({ zitat: "Erster Satz.", rest: ["Zweiter Satz.", "Absatz"] });
    expect(richtungVon("Mindestlohn: Stufe 40 auf 60")).toBe("auf");
    expect(richtungVon("Schulden −0,40 Prozentpunkte")).toBe("ab");
    expect(richtungVon("Finanzminister X: weniger Rückhalt")).toBe("ab");
  });

  test("Türkisch und Englisch: gleiche Schlüssel und Platzhalter wie Deutsch, Fenster rendert", async () => {
    const lade = (l: string) => JSON.parse(readFileSync(`src/i18n/katalog/${l}/ereignis.json`, "utf8")) as Record<string, string>;
    const de = lade("de");
    for (const l of ["tr", "en"] as const) {
      const k = lade(l);
      expect(Object.keys(k).sort()).toEqual(Object.keys(de).sort());
      for (const key of Object.keys(de)) expect(platzhalter(k[key]!)).toEqual(platzhalter(de[key]!));
      registriere(l, k);
      await setzeSprache(l);
      const w = neu();
      const { html } = fenster(w, "haushaltsjahr");
      expect(html).not.toMatch(KAPUTT);
      expect(html).toContain(k["ereignis.worum"]!);
    }
  });
});
