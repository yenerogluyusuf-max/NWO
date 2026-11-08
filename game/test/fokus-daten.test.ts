import { describe, it, expect } from "vitest";
import {
  ALLE_FOKI,
  FOKUS_NACH_ID,
  FOKUS_NACH_AST,
  FOKUS_AESTE_META,
  istFokusAusgeschlossen,
  sindVoraussetzungenErfuellt,
  berechneFokusKosten,
  type FokusAst,
} from "../src/data/fokus";
import { PARTEI_ACHSEN } from "../src/data/linien";

describe("Nationaler Fokusbaum (Agenda-Daten)", () => {
  it("enthält alle 7 definierten Äste", () => {
    const aeste: FokusAst[] = [
      "wirtschaft",
      "sicherheit",
      "gesellschaft",
      "aussen",
      "staat",
      "regionen",
      "wissen",
    ];
    for (const ast of aeste) {
      expect(FOKUS_AESTE_META[ast]).toBeDefined();
      expect(FOKUS_AESTE_META[ast].titelTr).toBeTruthy();
      expect(FOKUS_AESTE_META[ast].titelEn).toBeTruthy();
      expect(FOKUS_NACH_AST[ast].length).toBeGreaterThanOrEqual(4);
    }
  });

  it("hat eindeutige IDs und gültige Raster-Positionen", () => {
    const ids = new Set<string>();
    for (const f of ALLE_FOKI) {
      expect(ids.has(f.id)).toBe(false);
      ids.add(f.id);
      expect(f.raster.spalte).toBeGreaterThanOrEqual(1);
      expect(f.raster.zeile).toBeGreaterThanOrEqual(1);
      expect(f.tage).toBeGreaterThanOrEqual(30);
      expect(f.kapital).toBeGreaterThanOrEqual(1);
    }
  });

  it("alle Vorgänger (voraus) verweisen auf existierende Foki", () => {
    for (const f of ALLE_FOKI) {
      for (const vId of f.voraus) {
        expect(FOKUS_NACH_ID[vId]).toBeDefined();
        // Vorgänger sollte im selben Ast liegen
        expect(FOKUS_NACH_ID[vId]!.ast).toBe(f.ast);
      }
    }
  });

  it("Ausschlüsse (ausschluesse) sind valide Foki", () => {
    for (const f of ALLE_FOKI) {
      if (f.ausschluesse) {
        for (const aId of f.ausschluesse) {
          expect(FOKUS_NACH_ID[aId]).toBeDefined();
        }
      }
    }
  });

  it("istFokusAusgeschlossen erkennt verbotene Pfade korrekt", () => {
    const check1 = istFokusAusgeschlossen("fok_wirt_niedrigzins", ["fok_wirt_orthodoxie"]);
    expect(check1.ausgeschlossen).toBe(true);

    const check2 = istFokusAusgeschlossen("fok_wirt_niedrigzins", ["fok_wirt_auftakt"]);
    expect(check2.ausgeschlossen).toBe(false);
  });

  it("sindVoraussetzungenErfuellt prüft Ketten logisch ab", () => {
    expect(sindVoraussetzungenErfuellt("fok_wirt_auftakt", [])).toBe(true);
    expect(sindVoraussetzungenErfuellt("fok_wirt_orthodoxie", [])).toBe(false);
    expect(sindVoraussetzungenErfuellt("fok_wirt_orthodoxie", ["fok_wirt_auftakt"])).toBe(true);
  });

  it("berechneFokusKosten rabattiert nach Parteilinie", () => {
    const orthodoxie = FOKUS_NACH_ID["fok_wirt_orthodoxie"]!;
    // Partei mit hoher Marktorientierung (wirtschaft > 20)
    const kostenMarktnah = berechneFokusKosten(orthodoxie, PARTEI_ACHSEN["YENİ"]);
    // Partei mit starker Staatswirtschaft (DEM, CHP etc.)
    const kostenLinks = berechneFokusKosten(orthodoxie, PARTEI_ACHSEN["DEM"]);

    expect(kostenMarktnah).toBeLessThanOrEqual(orthodoxie.kapital);
    expect(kostenLinks).toBeGreaterThanOrEqual(orthodoxie.kapital);
  });

  it("alle Foki besitzen vollständige dreisprachige Titel und Beschreibungen", () => {
    for (const f of ALLE_FOKI) {
      expect(f.titel.length).toBeGreaterThan(3);
      expect(f.titelTr.length).toBeGreaterThan(3);
      expect(f.titelEn.length).toBeGreaterThan(3);
      expect(f.beschreibung.length).toBeGreaterThan(10);
      expect(f.beschreibungTr.length).toBeGreaterThan(10);
      expect(f.beschreibungEn.length).toBeGreaterThan(10);
    }
  });
});
