// Der Chat kennt Länder, Wähler und Programme.

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { befehl } from "../src/sim/befehle";
import { programmZustand } from "../src/sim/programme";
import type { World } from "../src/sim/types";

function neu(): World {
  const w = createWorld(turkey2026, 12);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 80;
  return w;
}

describe("Länder im Chat", () => {
  test.each([
    ["Wie ist das Verhältnis zu Russland?", /Russland: .*Handel .*Vertrauen/],
    ["Wie stehen wir zu Griechenland?", /Griechenland/],
    ["Was will die EU von uns?", /Europäische Union/],
    ["Wie ist die Lage mit dem Iran", /Iran/],
  ])("„%s“", (satz, muster) => {
    const w = neu();
    const r = befehl(satz, w);
    expect(r.ok).toBe(true);
    expect(r.text).toMatch(muster as RegExp);
  });

  test.each([
    ["Gipfeltreffen mit der EU", /Gipfeltreffen mit der Europäischen Union/],
    ["Lade den Präsidenten der USA zu einem Gipfel ein", /Gipfeltreffen mit den Vereinigten Staaten/],
    ["Schließe ein Handelsabkommen mit Aserbaidschan", /Handelsabkommen mit Aserbaidschan/],
    ["Mach öffentlich Druck auf Griechenland", /Griechenland/],
  ])("„%s“ wird ausgeführt", (satz, muster) => {
    const w = neu();
    const k = w.spiel!.kapital;
    const r = befehl(satz, w);
    expect(r.ok, r.text).toBe(true);
    expect(r.text).toMatch(muster as RegExp);
    expect(w.spiel!.kapital).toBeLessThan(k);
  });

  test("„Verhandle mit der EU“ nennt die Möglichkeiten statt zu verweigern", () => {
    const w = neu();
    const r = befehl("Verhandle mit der EU", w);
    expect(r.ok).toBe(true);
    expect(r.text).toMatch(/Gipfeltreffen|Handelsabkommen/);
  });

  test("Krieg gegen ein Land wird weiter ehrlich abgelehnt", () => {
    const w = neu();
    const r = befehl("Wir erklären Syrien den Krieg", w);
    expect(r.ok).toBe(false);
    expect(r.text).toMatch(/noch nicht/);
  });

  test("Die Aussage „Diplomatie gibt es nicht“ ist verschwunden", () => {
    const w = neu();
    expect(befehl("Gipfeltreffen mit Russland", w).text).not.toMatch(/gibt es in diesem Stand noch nicht/);
  });
});

describe("Wähler im Chat", () => {
  test("Fragen zu einer Gruppe und zur Koalition", () => {
    const w = neu();
    const a = befehl("Wie stehen die Rentner zu mir?", w);
    expect(a.ok).toBe(true);
    expect(a.text).toMatch(/Rentnerinnen und Rentner sind/);
    const b = befehl("Wer ist verärgert?", w);
    expect(b.ok).toBe(true);
    expect(b.text).toMatch(/Verärgert|Zufrieden|Keine Gruppe/);
  });
});

describe("Programme im Chat", () => {
  test("Nächster Schritt erfragen und starten", () => {
    const w = neu();
    const a = befehl("Was ist mein nächster Schritt im Programm?", w);
    expect(a.ok).toBe(true);
    expect(a.text).toMatch(/Als Nächstes im Programm/);
    const b = befehl("Starte den nächsten Programmschritt", w);
    expect(b.ok, b.text).toBe(true);
    expect(programmZustand(w).laufend.length).toBe(1);
  });
});
