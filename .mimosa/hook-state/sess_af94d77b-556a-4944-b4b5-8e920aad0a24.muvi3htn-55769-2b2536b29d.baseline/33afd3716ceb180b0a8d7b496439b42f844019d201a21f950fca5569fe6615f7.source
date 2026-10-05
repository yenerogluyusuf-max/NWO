import { describe, it, expect } from "vitest";
import {
  TECHNOLOGIEN,
  TECHNOLOGIEN_NACH_ID,
  TECHNOLOGIEN_NACH_EPOCHE,
  berechneTechBedarf,
  pruefeEureka,
  eurekaMeldung,
  EUREKA_RABATT_FAKTOR,
} from "../src/data/forschung";

describe("Wissens- und Technologiebaum (Eureka-System)", () => {
  it("alle Epochen von 1 bis 5 sind mit Technologien bestückt", () => {
    for (let e = 1; e <= 5; e++) {
      const techsInEpoche = TECHNOLOGIEN_NACH_EPOCHE[e];
      expect(techsInEpoche).toBeDefined();
      expect(techsInEpoche!.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("jede Technologie hat eine gültige ID, Kosten und ein definiertes Eureka", () => {
    const ids = new Set<string>();
    for (const t of TECHNOLOGIEN) {
      expect(ids.has(t.id)).toBe(false);
      ids.add(t.id);
      expect(t.forschungspunkte).toBeGreaterThan(0);
      expect(t.eureka).toBeDefined();
      expect(t.eureka.art).toBeTruthy();
      expect(t.eureka.zielId).toBeTruthy();
    }
  });

  it("alle Vorgänger (voraus) verweisen auf gültige Technologien", () => {
    for (const t of TECHNOLOGIEN) {
      for (const vorId of t.voraus) {
        expect(TECHNOLOGIEN_NACH_ID[vorId]).toBeDefined();
        // Vorgänger muss aus einer früheren oder gleichen Epoche stammen
        expect(TECHNOLOGIEN_NACH_ID[vorId]!.epoche).toBeLessThanOrEqual(t.epoche);
      }
    }
  });

  it("berechneTechBedarf zieht den 40 % Heureka-Rabatt korrekt ab", () => {
    const tech = TECHNOLOGIEN[0]!;
    const normal = berechneTechBedarf(tech, false);
    const rabattiert = berechneTechBedarf(tech, true);

    expect(normal).toBe(tech.forschungspunkte);
    expect(rabattiert).toBe(Math.round(tech.forschungspunkte * (1 - EUREKA_RABATT_FAKTOR)));
    expect(rabattiert).toBeLessThan(normal);
  });

  it("pruefeEureka erkennt erfüllte Bedingungen präzise", () => {
    const solarTech = TECHNOLOGIEN_NACH_ID["tech_solar_perowskit"]!;

    // Noch nicht erfüllt
    const nichtErfuellt = pruefeEureka(solarTech, {
      massnahmenWerte: { m_solar_wind: 40 },
    });
    expect(nichtErfuellt).toBe(false);

    // Erfüllt
    const erfuellt = pruefeEureka(solarTech, {
      massnahmenWerte: { m_solar_wind: 65 },
    });
    expect(erfuellt).toBe(true);
  });

  it("eurekaMeldung liefert passende Meldungen in DE, TR und EN", () => {
    const tech = TECHNOLOGIEN[0]!;
    const de = eurekaMeldung(tech, "de");
    const tr = eurekaMeldung(tech, "tr");
    const en = eurekaMeldung(tech, "en");

    expect(de.titel).toBe("Heureka!");
    expect(de.text).toContain("gesenkt");

    expect(tr.titel).toContain("Buldum");
    expect(tr.text).toContain("%40 kısaldı");

    expect(en.titel).toBe("Eureka!");
    expect(en.text).toContain("40%");
  });

  it("alle Technologien haben vollständige trilinguale Bezeichnungen", () => {
    for (const t of TECHNOLOGIEN) {
      expect(t.name.length).toBeGreaterThan(3);
      expect(t.nameTr.length).toBeGreaterThan(3);
      expect(t.nameEn.length).toBeGreaterThan(3);
      expect(t.eureka.beschreibung.length).toBeGreaterThan(5);
      expect(t.eureka.beschreibungTr.length).toBeGreaterThan(5);
      expect(t.eureka.beschreibungEn.length).toBeGreaterThan(5);
    }
  });
});
