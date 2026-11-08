import { describe, it, expect } from "vitest";
import {
  MIT_OPERATIONEN,
  MIT_OPERATIONEN_NACH_ID,
  type MitOperationsKategorie,
} from "../src/data/mit-daten";

describe("Geheimdienst- & Spezialoperationen (MİT-Daten)", () => {
  it("alle Operations-Kategorien sind abgedeckt", () => {
    const kategorien: MitOperationsKategorie[] = [
      "grenzaufklaerung",
      "elektronische_stoerung",
      "sabotage",
      "spionageabwehr",
      "extraktion",
    ];
    const gefundene = new Set(MIT_OPERATIONEN.map((op) => op.kategorie));
    for (const kat of kategorien) {
      expect(gefundene.has(kat)).toBe(true);
    }
  });

  it("jede Operation hat plausible Wahrscheinlichkeiten und Kosten", () => {
    for (const op of MIT_OPERATIONEN) {
      expect(op.erfolgsBasis).toBeGreaterThan(0.5);
      expect(op.erfolgsBasis).toBeLessThanOrEqual(1.0);
      expect(op.entdeckungsRisiko).toBeGreaterThan(0.0);
      expect(op.entdeckungsRisiko).toBeLessThan(0.5);
      expect(op.tage).toBeGreaterThanOrEqual(15);
      expect(op.kapital).toBeGreaterThanOrEqual(1);
    }
  });

  it("alle Operationen besitzen vollständige trilinguale Titel und Texte", () => {
    for (const op of MIT_OPERATIONEN) {
      expect(op.titel.length).toBeGreaterThan(3);
      expect(op.titelTr.length).toBeGreaterThan(3);
      expect(op.titelEn.length).toBeGreaterThan(3);
      expect(op.beschreibung.length).toBeGreaterThan(10);
      expect(op.beschreibungTr.length).toBeGreaterThan(10);
      expect(op.beschreibungEn.length).toBeGreaterThan(10);
    }
  });
});
