import { stufeVon } from "../src/sim/haushalt";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { describe, expect, test } from "vitest";
import { befehl, willkommensText } from "../src/sim/befehle";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { NET } from "../src/sim/world";

function welt() {
  return createWorld(turkey2026, 7);
}

describe("Gespraech: freie Sprache wird geprueft ausgefuehrt", () => {
  test("Willkommen und Hilfe nennen Beispiele", () => {
    const w = welt();
    expect(willkommensText()).toContain("Mindestlohn");
    const r = befehl("Hilfe", w);
    expect(r.ok).toBe(true);
    expect(r.text).toContain("Inflation");
  });

  test("Inflationsfrage beantwortet mit veroeffentlichtem Wert und Verzoegerung", () => {
    const w = welt();
    const r = befehl("Wie hoch ist die Inflation?", w);
    expect(r.ok).toBe(true);
    expect(r.text).toMatch(/%/);
    expect(r.why).toBeTruthy();
  });

  test("Zinsaenderung verlangt die Wege statt einer Ausfuehrung", () => {
    const w = welt();
    const vorher = w.economy.policyRate;
    const r = befehl("Senke den Leitzins sofort!", w);
    expect(r.ok).toBe(false);
    expect(r.text).toContain("Zentralbank");
    expect(w.economy.policyRate).toBe(vorher);
  });

  test("Kritik an der Zentralbank wird ausgefuehrt", () => {
    const w = welt();
    const vorher = w.economy.credibility;
    const r = befehl("Kritisiere die Zentralbank oeffentlich", w);
    expect(r.ok).toBe(true);
    expect(w.economy.credibility).toBeLessThan(vorher);
  });

  test("Gouverneurin ersetzen ist moeglich", () => {
    const w = welt();
    const r = befehl("Ersetze die Gouverneurin durch eine gefaellige", w);
    expect(r.ok).toBe(true);
    expect(w.governor.stance).toBe("gefuegig");
  });

  test("Haushalt: ausgeben und sparen laufen über die Haushaltsregler", () => {
    const w = welt();
    startAfterElection(w, schnellProfil());
    const kapital = w.spiel!.kapital;
    const r1 = befehl("Ich will mehr ausgeben, ein Konjunkturpaket", w);
    expect(r1.ok, r1.text).toBe(true);
    expect(r1.text).toMatch(/Nachtragshaushalt/);
    expect(stufeVon(w, "investitionen")).toBe(1);
    expect(w.spiel!.kapital).toBeLessThan(kapital);
    const r2 = befehl("Wir muessen sparen", w);
    expect(r2.ok, r2.text).toBe(true);
    expect(stufeVon(w, "personal")).toBe(-1);
  });

  test("Zeit: 10 Tage weiter veraendert das Datum", () => {
    const w = welt();
    const tag = w.day;
    const r = befehl("10 Tage weiter", w);
    expect(r.ok).toBe(true);
    expect(w.day).toBe(tag + 10);
  });

  test("Massnahme wird erkannt und gesetzt", () => {
    const w = welt();
    const node = NET.nodes.find((n) => n.kind === "massnahme")!;
    const r = befehl("Erhoehe " + node.name, w);
    expect(r.ok).toBe(true);
    expect(w.net.targets[node.id]).toBeGreaterThan(node.start);
  });

  test("Massnahme ohne Richtung erzeugt eine Rueckfrage ohne Zustandsaenderung", () => {
    const w = welt();
    const node = NET.nodes.find((n) => n.kind === "massnahme")!;
    const ziel = w.net.targets[node.id];
    const r = befehl(node.name, w);
    expect(r.ok).toBe(false);
    expect(r.text).toContain("Richtung");
    expect(w.net.targets[node.id]).toBe(ziel);
  });

  test("Unverstandenes erzeugt eine Rueckfrage, keine Ausfuehrung", () => {
    const w = welt();
    const tag = w.day;
    const r = befehl("Bau eine Zeitmaschine und bring alles in Ordnung", w);
    expect(r.ok).toBe(false);
    expect(w.day).toBe(tag);
  });
});
