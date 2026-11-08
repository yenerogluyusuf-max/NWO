// Struktur der Umfrage-Institute und des Fehler-Generators (RECHERCHE_MEDIEN_UMFRAGEN.md, Kapitel B).

import { describe, expect, test } from "vitest";
import { FEHLER_GENERATOR, UMFRAGE_INSTITUTE, umfrageInstitut } from "../src/data/umfrage_institute";

describe("Umfrage-Institute", () => {
  test("Fünf bis sieben Institute mit eindeutigen Kennungen", () => {
    expect(UMFRAGE_INSTITUTE.length).toBeGreaterThanOrEqual(5);
    expect(UMFRAGE_INSTITUTE.length).toBeLessThanOrEqual(7);
    expect(new Set(UMFRAGE_INSTITUTE.map((i) => i.id)).size).toBe(UMFRAGE_INSTITUTE.length);
    for (const i of UMFRAGE_INSTITUTE) expect(umfrageInstitut(i.id)).toBe(i);
  });

  test("Wertebereiche gemäß Kalibrierung (Recherche B.4.4)", () => {
    for (const i of UMFRAGE_INSTITUTE) {
      // Haus-Bias: oppositionell bis −6, regierungsnah bis +3 (Recherche B.2.6)
      expect(i.hausBias, i.id).toBeGreaterThanOrEqual(-6);
      expect(i.hausBias, i.id).toBeLessThanOrEqual(3);
      // σ: 1,2 (n>5000) bis 2,5 (Online-Panel)
      expect(i.sigma, i.id).toBeGreaterThanOrEqual(1);
      expect(i.sigma, i.id).toBeLessThanOrEqual(3);
      expect(i.fatTailP, i.id).toBeGreaterThanOrEqual(0);
      expect(i.fatTailP, i.id).toBeLessThanOrEqual(0.25);
      expect(i.stichprobe, i.id).toBeGreaterThanOrEqual(1000);
      expect(i.publikation.wennGuenstig, i.id).toBeGreaterThanOrEqual(0);
      expect(i.publikation.wennGuenstig, i.id).toBeLessThanOrEqual(1);
      expect(i.publikation.wennUnguenstig, i.id).toBeGreaterThanOrEqual(0);
      expect(i.publikation.wennUnguenstig, i.id).toBeLessThanOrEqual(1);
      // Ungünstige Ergebnisse werden nie häufiger publiziert als günstige
      expect(i.publikation.wennUnguenstig, i.id).toBeLessThanOrEqual(i.publikation.wennGuenstig);
    }
  });

  test("Vorzeichen der Haus-Effekte folgen der Lager-Codierung", () => {
    for (const i of UMFRAGE_INSTITUTE) {
      if (i.typ === "regierungsnah" || i.typ === "online_grosspanel") expect(i.hausBias, i.id).toBeGreaterThan(0);
      if (i.typ === "oppo_codiert" || i.typ === "oppo_militant") expect(i.hausBias, i.id).toBeLessThan(0);
    }
    // Der militante Oppositionelle verzerrt stärker als der codierte (Recherche B.2.6)
    const yoruk = umfrageInstitut("yoruk")!;
    const kent = umfrageInstitut("kent")!;
    expect(Math.abs(yoruk.hausBias)).toBeGreaterThan(Math.abs(kent.hausBias));
  });

  test("Fehler-Generator: Schwellen und Spannen sind geordnet", () => {
    const g = FEHLER_GENERATOR;
    expect(g.angstklimaModifikator.mittelAb).toBeLessThan(g.angstklimaModifikator.hochAb);
    expect(g.angstklimaModifikator.hoch).toBeLessThan(g.angstklimaModifikator.mittel);
    expect(g.eventLagPp.min).toBeLessThan(g.eventLagPp.max);
    expect(g.fatTail.offsetPp.min).toBeLessThan(g.fatTail.offsetPp.max);
    expect(g.fatTail.p).toBeGreaterThan(0);
    expect(g.fatTail.gegenRegierungP).toBeGreaterThan(0.5);
    expect(g.turnoutModulPp.min).toBeLessThan(0);
    expect(g.turnoutModulPp.max).toBeGreaterThan(0);
    expect(g.diasporaOffsetRegierungPp).toBeGreaterThan(0);
    expect(g.publikationsverbotTage).toBe(10);
  });
});
