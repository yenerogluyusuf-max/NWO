// Deutsche Beugung der Ländernamen mit Artikel nach Präpositionen (Gesamtbild vom 4. November: „Zwischenfall mit Vereinigte Staaten“).
import { describe, expect, test } from "vitest";
import { formatiere } from "../src/i18n/format";

describe("Ländernamen mit Artikel", () => {
  test("Dativ nach mit/von/bei, Akkusativ nach gegen, „nach“ wird „in die“", () => {
    expect(formatiere("Zwischenfall mit {land}", { land: "Vereinigte Staaten" }, "de")).toBe("Zwischenfall mit den Vereinigten Staaten");
    expect(formatiere("Sanktionen von {land} drohen", { land: "Europäische Union" }, "de")).toBe("Sanktionen von der Europäischen Union drohen");
    expect(formatiere("Die Türkei verhängt Sanktionen gegen {land}.", { land: "Vereinigtes Königreich" }, "de")).toBe("Die Türkei verhängt Sanktionen gegen das Vereinigte Königreich.");
    expect(formatiere("Der Botschafter kehrt nach {land} zurück.", { land: "Vereinigte Staaten" }, "de")).toBe("Der Botschafter kehrt in die Vereinigten Staaten zurück.");
    expect(formatiere("Staatsbesuch bei {land}", { land: "Niederlande" }, "de")).toBe("Staatsbesuch bei den Niederlanden");
  });
  test("Ohne Präposition Grundform; Namen ohne Artikel und andere Sprachen bleiben unverändert", () => {
    expect(formatiere("{land}: Spannung steigt", { land: "Vereinigte Staaten" }, "de")).toBe("Vereinigte Staaten: Spannung steigt");
    expect(formatiere("Zwischenfall mit {land}", { land: "Russland" }, "de")).toBe("Zwischenfall mit Russland");
    expect(formatiere("Incident with {land}", { land: "Vereinigte Staaten" }, "en")).toBe("Incident with Vereinigte Staaten");
    expect(formatiere("Konflikt mit {land|dat}", { land: "Vereinigte Staaten" }, "de")).toBe("Konflikt mit Vereinigte Staaten");
  });
});
