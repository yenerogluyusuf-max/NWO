// Die Umfrage-Messung: Haus-Bias, Angstklima, Rauschen und fette Abweichungen
// (RECHERCHE_MEDIEN_UMFRAGEN.md, Kapitel B.4). Der Default bleibt das alte Verhalten.

import { describe, expect, test } from "vitest";
import { Rng } from "../src/sim/rng";
import { umfrageMessung, umfrageMonat } from "../src/sim/umfrage";

const mittelwert = (werte: number[]) => werte.reduce((s, x) => s + x, 0) / werte.length;

describe("Umfrage-Fortschreibung", () => {
  test("Ohne Optionen exakt das alte Verhalten (träge Annäherung, Faktor 0,35)", () => {
    expect(umfrageMonat(40, 50)).toBeCloseTo(43.5, 10);
    expect(umfrageMonat(60, 50)).toBeCloseTo(56.5, 10);
    // Auch mit Zufallsquelle, aber ohne Institut, bleibt es beim alten Verhalten …
    const rng = new Rng(42);
    expect(umfrageMonat(40, 50, rng)).toBeCloseTo(43.5, 10);
    // … und der Zufallsstrom wird dabei nicht angezapft (Determinismus des Spiels)
    expect(new Rng(42).next()).toBe(rng.next());
  });

  test("Mit Institut wird der Messfehler aktiv und bleibt deterministisch", () => {
    const a = umfrageMonat(40, 50, new Rng(7), { institutId: "meridyen" });
    const b = umfrageMonat(40, 50, new Rng(7), { institutId: "meridyen" });
    expect(a).toBe(b);
  });
});

describe("Umfrage-Messung", () => {
  test("Haus-Bias verschiebt den Mittelwert in Richtung des Lagers (Recherche B.2.6)", () => {
    const n = 4000;
    const rng = new Rng(1);
    const regierungsnah = Array.from({ length: n }, () => umfrageMessung(50, rng, { institutId: "meridyen" }));
    const oppositionell = Array.from({ length: n }, () => umfrageMessung(50, rng, { institutId: "yoruk" }));
    // meridyen: +2 pp, yoruk: −5 pp (inkl. fat-tail-Erwartungswert −0,7 pp bei beiden)
    expect(mittelwert(regierungsnah)).toBeGreaterThan(50.5);
    expect(mittelwert(oppositionell)).toBeLessThan(45.5);
  });

  test("Ohne Institut bleibt die Messung unverzerrt im Mittel", () => {
    const n = 4000;
    const rng = new Rng(2);
    const werte = Array.from({ length: n }, () => umfrageMessung(50, rng));
    // Erwartungswert 50 − 0,7 (fat tail zu 70 % gegen die Regierung), Toleranz ±0,5
    expect(mittelwert(werte)).toBeGreaterThan(48.8);
    expect(mittelwert(werte)).toBeLessThan(50);
  });

  test("Angstklima lässt das Regierungslager unterschätzt erscheinen (Recherche B.3)", () => {
    const n = 4000;
    const rngA = new Rng(3);
    const rngB = new Rng(4);
    const ohne = mittelwert(Array.from({ length: n }, () => umfrageMessung(50, rngA, { institutId: "denge" })));
    const hoch = mittelwert(Array.from({ length: n }, () => umfrageMessung(50, rngB, { institutId: "denge", angstklima: 90 })));
    expect(ohne - hoch).toBeGreaterThan(2); // Modifikator −2,5 pp
  });

  test("Ergebnisse bleiben im Bereich 0–100, auch am Rand", () => {
    const rng = new Rng(5);
    for (let i = 0; i < 500; i++) {
      const oben = umfrageMessung(99, rng, { institutId: "meridyen", angstklima: 0 });
      const unten = umfrageMessung(2, rng, { institutId: "yoruk", angstklima: 90 });
      expect(oben).toBeLessThanOrEqual(100);
      expect(oben).toBeGreaterThanOrEqual(0);
      expect(unten).toBeLessThanOrEqual(100);
      expect(unten).toBeGreaterThanOrEqual(0);
    }
  });

  test("Unbekannte Institutskennung fällt auf die neutrale Messung zurück", () => {
    const a = umfrageMessung(50, new Rng(9), { institutId: "gibts_nicht" });
    const b = umfrageMessung(50, new Rng(9));
    expect(a).toBe(b);
  });
});
