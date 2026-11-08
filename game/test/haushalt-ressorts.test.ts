// Ressortetats wie in Democracy (05.10.2026): ein Regler je Ressort mit weiter Spanne, Renten mit eigenen Stellgrößen, Wirkung mit Verzug
// und abnehmendem Ertrag, Forschung gedeckelt durch die Innovationsgrenze aus der Bildung, Migration der alten Bündel-Posten.

import { describe, expect, test } from "vitest";
import { createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import {
  POSTEN,
  POSTEN_NACH_ID,
  ertrag,
  forschungsBudget,
  haushaltMonat,
  impulsAusPosten,
  rentenSicht,
  setzePosten,
  stufeVon,
  verteidigungsEtat,
  wirksamVon,
} from "../src/sim/haushalt";
import { forschungsLeistung, forschungsSicht, innovationsGrenze, wirksameForschung } from "../src/sim/wissensbasis";
import { haushaltZustand, migriereHaushalt } from "../src/sim/wirtschaft";
import { RESSORTS_2026 } from "../src/data/haushaltsplan";
import type { World } from "../src/sim/types";

function welt(seed = 5): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 200;
  return w;
}

function monate(w: World, n: number): void {
  for (let i = 0; i < n; i++) haushaltMonat(w);
}

describe("Ressorts und Spannen", () => {
  test("Alle verlangten Ressorts gibt es, mit Texten aus dem Katalog und weiter Spanne nach oben", () => {
    const ids = POSTEN.map((p) => p.id);
    for (const id of ["rentenniveau", "rentenalter", "sozialhilfe", "gesundheit", "bildung", "forschung", "verteidigung", "innere_sicherheit", "investitionen", "wohnen", "landwirtschaft", "umwelt_energie", "kultur", "personal", "subventionen"]) expect(ids).toContain(id);
    for (const p of POSTEN) {
      for (const k of [p.name, p.text, p.gewinner, p.verlierer, p.kehrseite, p.wirkung]) expect(k).not.toMatch(/⟦|^haushalt\./);
      expect(p.min).toBeLessThan(0);
      expect(p.max).toBeGreaterThan(0);
    }
    for (const r of RESSORTS_2026) expect(r.beleg.length).toBeGreaterThan(10);
    expect(POSTEN_NACH_ID.verteidigung!.max).toBeGreaterThanOrEqual(10);
    expect(POSTEN_NACH_ID.bildung!.max).toBeGreaterThanOrEqual(10);
    expect(POSTEN_NACH_ID.forschung!.max).toBeGreaterThanOrEqual(10);
  });

  test("Massiv ins Militär: +10 Stufen kosten 2 % des BIP Impuls; die Schnittstelle meldet den Etat", () => {
    const w = welt();
    const etat0 = verteidigungsEtat(w);
    expect(setzePosten(w, "verteidigung", 10, true).ok).toBe(true);
    expect(stufeVon(w, "verteidigung")).toBe(10);
    expect(impulsAusPosten(w)).toBeCloseTo(2, 6);
    expect(verteidigungsEtat(w)).toBeCloseTo(etat0 + 2, 6);
    // über die Spanne hinaus wird gekappt
    setzePosten(w, "verteidigung", 99, true);
    expect(stufeVon(w, "verteidigung")).toBe(POSTEN_NACH_ID.verteidigung!.max);
  });

  test("Renten: Niveau und Eintrittsalter sind eigene Stellgrößen; ein höheres Alter spart, ein höheres Niveau kostet", () => {
    const w = welt();
    const r0 = rentenSicht(w);
    setzePosten(w, "rentenniveau", 2, true);
    expect(rentenSicht(w).niveau).toBe(r0.niveau + 4);
    expect(impulsAusPosten(w)).toBeGreaterThan(0);
    setzePosten(w, "rentenalter", 3, true);
    expect(rentenSicht(w).alter).toBe(r0.alter + 3);
    expect(impulsAusPosten(w)).toBeLessThan(0.4 + 1e-9);
    expect(rentenSicht(w).etat).toBeLessThan(rentenSicht(w, 2, 0).etat);
  });
});

describe("Wirkung mit Verzug und abnehmendem Ertrag", () => {
  test("Abnehmender Ertrag über +2, Kürzungen wirken voll", () => {
    expect(ertrag(2)).toBe(2);
    expect(ertrag(6)).toBe(4);
    expect(ertrag(10)).toBe(5);
    expect(ertrag(-4)).toBe(-4);
  });

  test("Bildung reift über Jahre: nach einem Jahr wirkt erst ein Teil, Fachkräfte steigen erst später deutlich", () => {
    const a = welt();
    const b = structuredClone(a);
    setzePosten(a, "bildung", 5, true);
    monate(a, 12);
    monate(b, 12);
    const teil = wirksamVon(a, "bildung") / 5;
    expect(teil).toBeGreaterThan(0.2);
    expect(teil).toBeLessThan(0.5);
    monate(a, 48);
    monate(b, 48);
    expect(wirksamVon(a, "bildung")).toBeGreaterThan(3.8);
    expect(nationalAverage(NET, a.net, "fachkraefte")).toBeGreaterThan(nationalAverage(NET, b.net, "fachkraefte"));
    expect(nationalAverage(NET, a.net, "bildungsqualitaet")).toBeGreaterThan(nationalAverage(NET, b.net, "bildungsqualitaet"));
  });
});

describe("Wissensbasis: Bildung hebt die Innovationsgrenze, Forschung wirkt nur bis dorthin voll", () => {
  test("Über der Grenze verpufft Forschung größtenteils", () => {
    expect(wirksameForschung(0.5, 0.7)).toBe(0.5);
    expect(wirksameForschung(1.7, 0.7)).toBeCloseTo(0.9, 6);
    const w = welt();
    setzePosten(w, "forschung", 12, true);
    expect(forschungsBudget(w)).toBeCloseTo(1.6, 6);
    const sicht = forschungsSicht(w, forschungsBudget(w));
    expect(sicht.verpufft).toBeGreaterThan(0.5);
  });

  test("Nur Forschung ohne Bildung bringt weniger als Forschung mit Bildung (nach Jahren)", () => {
    const nur = welt();
    const beide = structuredClone(nur);
    setzePosten(nur, "forschung", 12, true);
    setzePosten(beide, "forschung", 12, true);
    setzePosten(beide, "bildung", 10, true);
    monate(nur, 72);
    monate(beide, 72);
    expect(innovationsGrenze(beide)).toBeGreaterThan(innovationsGrenze(nur));
    expect(forschungsLeistung(beide)).toBeGreaterThan(forschungsLeistung(nur));
  });

  test("Bildung ohne Forschung lässt Fachkräfte abwandern", () => {
    const ohne = welt();
    const mit = structuredClone(ohne);
    setzePosten(ohne, "bildung", 10, true);
    setzePosten(mit, "bildung", 10, true);
    setzePosten(mit, "forschung", 6, true);
    monate(ohne, 60);
    monate(mit, 60);
    expect(nationalAverage(NET, ohne.net, "abwanderung")).toBeGreaterThan(nationalAverage(NET, mit.net, "abwanderung"));
  });
});

describe("Migration der alten Bündel-Posten", () => {
  test("Alte Stufen, Entwurf und Gesetz landen auf den Ressorts; der Impuls bleibt gleich; alte Kennungen bleiben bedienbar", () => {
    const z = migriereHaushalt({
      stufen: { soziales: 2, gesundheit_bildung: -1, sicherheit: 1, investitionen: 2 },
      zinssatz: 14,
      marktStart: 40,
      aenderungen: [],
      entwurf: { soziales: 1 },
      gesetz: { jahr: 2028, schritte: { sicherheit: 2 }, eingebracht: 0, abstimmung: 21, absprachen: 0 },
    });
    expect(z.fassung).toBe(2);
    expect(z.stufen).toEqual({ rentenniveau: 2, sozialhilfe: 2, gesundheit: -1, bildung: -1, verteidigung: 1, innere_sicherheit: 2, investitionen: 2 });
    expect(z.entwurf).toEqual({ rentenniveau: 1, sozialhilfe: 1 });
    expect(z.gesetz!.schritte).toEqual({ verteidigung: 2, innere_sicherheit: 4 });
    expect(z.wirksam).toEqual(z.stufen); // schon beschlossene Etats wirken voll weiter
    // Impuls: alt 0,4 je Stufe und Bündel
    const alt = 2 * 0.4 - 1 * 0.4 + 1 * 0.4 + 2 * 0.4;
    const neu = Object.entries(z.stufen).reduce((s, [id, st]) => s + st * POSTEN_NACH_ID[id]!.schritt, 0);
    expect(neu).toBeCloseTo(alt, 6);
    // zweimal migrieren ändert nichts
    expect(migriereHaushalt(z).stufen).toEqual(z.stufen);
  });

  test("Ein alter Spielstand mit Bündel-Stufen lädt und läuft weiter", () => {
    const w = welt();
    const hz = haushaltZustand(w);
    delete hz.fassung;
    delete hz.wirksam;
    hz.stufen = { soziales: 1 };
    const geladen = load(save(w));
    expect(stufeVon(geladen, "sozialhilfe")).toBe(1);
    expect(stufeVon(geladen, "rentenniveau")).toBe(1);
    expect(stufeVon(geladen, "soziales")).toBe(1); // alte Kennung zeigt auf Sozialhilfe
    expect(() => monate(geladen, 3)).not.toThrow();
  });
});
