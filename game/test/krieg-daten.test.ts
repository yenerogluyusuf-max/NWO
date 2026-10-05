import { describe, it, expect } from "vitest";
import {
  AUSRUESTUNGS_GENERATIONEN,
  DIVISIONS_VORLAGEN,
  MILITAER_DOKTRINEN,
  SCHAUPLATZ_REGIONEN,
} from "../src/data/krieg-daten";

describe("Militär- und Kriegsdaten (Ausrüstung, Divisionen, Doktrinen, Schauplätze)", () => {
  it("alle Ausrüstungs-Generationen (1 bis 3) sind definiert", () => {
    const kategorien = new Set(AUSRUESTUNGS_GENERATIONEN.map((a) => a.kategorie));
    expect(kategorien.has("infanterie")).toBe(true);
    expect(kategorien.has("gepanzert")).toBe(true);
    expect(kategorien.has("drohnen")).toBe(true);

    for (const a of AUSRUESTUNGS_GENERATIONEN) {
      expect(a.generation).toBeGreaterThanOrEqual(1);
      expect(a.generation).toBeLessThanOrEqual(3);
      expect(a.angriffswert).toBeGreaterThan(0);
      expect(a.verteidigungswert).toBeGreaterThan(0);
      expect(a.herstellungskosten).toBeGreaterThan(0);
    }
  });

  it("Divisions-Vorlagen besitzen vollständige Geländeboni und Kampfwertattribute", () => {
    expect(DIVISIONS_VORLAGEN.length).toBeGreaterThanOrEqual(5);
    for (const div of DIVISIONS_VORLAGEN) {
      expect(div.feuerkraft).toBeGreaterThan(0);
      expect(div.organisation).toBeGreaterThan(0);
      expect(div.nachschubBedarf).toBeGreaterThan(0);
      expect(div.gelaendeBoni.ebene).toBeGreaterThan(0);
      expect(div.gelaendeBoni.gebirge).toBeGreaterThan(0);
      expect(div.gelaendeBoni.stadt).toBeGreaterThan(0);
      expect(div.gelaendeBoni.kueste).toBeGreaterThan(0);
    }
  });

  it("Militär-Doktrinen decken alle 4 strategischen Doktrinbäume ab", () => {
    const baeume = new Set(MILITAER_DOKTRINEN.map((d) => d.baum));
    expect(baeume.has("tiefenangriff")).toBe(true);
    expect(baeume.has("asymmetrisch")).toBe(true);
    expect(baeume.has("festung")).toBe(true);
    expect(baeume.has("mavi_vatan")).toBe(true);

    for (const dok of MILITAER_DOKTRINEN) {
      expect(dok.boni).toBeDefined();
      expect(typeof dok.boni.angriffMod).toBe("number");
      expect(typeof dok.boni.verteidigungMod).toBe("number");
    }
  });

  it("Schauplatz-Regionen umfassen alle strategischen Grenztheater", () => {
    const theater = new Set(SCHAUPLATZ_REGIONEN.map((r) => r.theater));
    expect(theater.has("syrien")).toBe(true);
    expect(theater.has("irak")).toBe(true);
    expect(theater.has("aegaeis")).toBe(true);
    expect(theater.has("zypern")).toBe(true);
    expect(theater.has("kaukasus")).toBe(true);

    for (const reg of SCHAUPLATZ_REGIONEN) {
      expect(reg.provinzenAnzahl).toBeGreaterThan(0);
      expect(reg.strategischerWert).toBeGreaterThanOrEqual(1);
      expect(reg.strategischerWert).toBeLessThanOrEqual(10);
    }
  });

  it("alle militärischen Datenstrukturen verfügen über trilinguale Bezeichnungen", () => {
    for (const a of AUSRUESTUNGS_GENERATIONEN) {
      expect(a.nameTr.length).toBeGreaterThan(2);
      expect(a.nameEn.length).toBeGreaterThan(2);
    }
    for (const d of DIVISIONS_VORLAGEN) {
      expect(d.nameTr.length).toBeGreaterThan(2);
      expect(d.nameEn.length).toBeGreaterThan(2);
    }
    for (const dok of MILITAER_DOKTRINEN) {
      expect(dok.nameTr.length).toBeGreaterThan(2);
      expect(dok.nameEn.length).toBeGreaterThan(2);
    }
    for (const r of SCHAUPLATZ_REGIONEN) {
      expect(r.nameTr.length).toBeGreaterThan(2);
      expect(r.nameEn.length).toBeGreaterThan(2);
    }
  });
});
