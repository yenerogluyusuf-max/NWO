// Struktur des Diaspora-Datenmoduls (RECHERCHE_DIASPORA.md, Kapitel 6).

import { describe, expect, test } from "vitest";
import {
  DIASPORA_DOEVIZ,
  DIASPORA_EREIGNISSE,
  DIASPORA_KAMPAGNE,
  DIASPORA_LAENDER,
  DIASPORA_PROFIL,
} from "../src/data/diaspora";

describe("Diaspora-Profil", () => {
  test("Grundparameter im belegten Rahmen (YSK 2023)", () => {
    expect(DIASPORA_PROFIL.registrierteWaehler).toBeGreaterThanOrEqual(3_400_000);
    expect(DIASPORA_PROFIL.registrierteWaehler).toBeLessThanOrEqual(3_500_000);
    expect(DIASPORA_PROFIL.anteilWählerschaft).toBeCloseTo(0.053, 3);
    // Baseline-Beteiligung liegt im Korridor und deutlich unter dem Inland (~88 %)
    expect(DIASPORA_PROFIL.beteiligung).toBeGreaterThanOrEqual(DIASPORA_PROFIL.beteiligungKorridor.min);
    expect(DIASPORA_PROFIL.beteiligung).toBeLessThanOrEqual(DIASPORA_PROFIL.beteiligungKorridor.max);
    expect(DIASPORA_PROFIL.beteiligung).toBeLessThan(0.88);
    expect(DIASPORA_PROFIL.nurNationaleWahlen).toBe(true);
    expect(DIASPORA_PROFIL.lagerModifikatorInlandPp).toBe(7);
  });

  test("Lager-Verteilung summiert sich auf 100", () => {
    const l = DIASPORA_PROFIL.lagerVerteilung;
    expect(l.regierung + l.mitteLinks + l.proKurdisch + l.sonstige).toBe(100);
    // Das Regierungslager liegt im Ausland deutlich über dem Inlandswert (~46 % bei der Parlamentswahl 2023)
    expect(l.regierung).toBeGreaterThan(50);
  });

  test("Länder-Modifikatoren: Spanne und Vorzeichen folgen der Recherche", () => {
    expect(DIASPORA_LAENDER.length).toBeGreaterThanOrEqual(5);
    for (const p of DIASPORA_LAENDER) {
      expect(p.lagerModifikatorPp, p.land).toBeGreaterThanOrEqual(-25);
      expect(p.lagerModifikatorPp, p.land).toBeLessThanOrEqual(25);
      expect(p.anteilWaehler, p.land).toBeGreaterThan(0);
      expect(p.anteilWaehler, p.land).toBeLessThanOrEqual(1);
    }
    const nach = (land: string) => DIASPORA_LAENDER.find((p) => p.land === land)!;
    // Belgien und Österreich am stärksten regierungsnah (Stichwahl 2023: 74,7 % / 73,9 %)
    expect(nach("belgien").lagerModifikatorPp).toBeGreaterThan(nach("deutschland").lagerModifikatorPp);
    // Anglosphäre oppositionell codiert (KAS/Yücel 2023, qualitativ belegt)
    expect(nach("anglosphaere").lagerModifikatorPp).toBeLessThan(0);
    // Deutschland stellt die größte Wählergruppe (~44 %, YSK 2023)
    const maxAnteil = Math.max(...DIASPORA_LAENDER.map((p) => p.anteilWaehler));
    expect(nach("deutschland").anteilWaehler).toBe(maxAnteil);
  });

  test("Döviz-Pfad: zweischneidiger Kanal mit geordneten Schwellen", () => {
    expect(DIASPORA_DOEVIZ.vertrauenAbflussAb).toBeLessThan(DIASPORA_DOEVIZ.vertrauenZuflussAb);
    expect(DIASPORA_DOEVIZ.krisenZuflussMrdUsd.min).toBeLessThan(DIASPORA_DOEVIZ.krisenZuflussMrdUsd.max);
    expect(DIASPORA_DOEVIZ.abflussMrdUsd.min).toBeLessThan(0);
    expect(DIASPORA_DOEVIZ.abflussMrdUsd.max).toBeLessThan(0);
    expect(DIASPORA_DOEVIZ.yuvam.zuschlagPaPct.min).toBeGreaterThan(0);
    expect(DIASPORA_DOEVIZ.tourismus.anteilTourismussektor).toBeCloseTo(0.17, 2);
  });

  test("Kampagne und Ereignisse: eindeutige Kennungen, plausible Effekte", () => {
    expect(DIASPORA_KAMPAGNE.auftrittsverbotChance).toBeGreaterThan(0);
    expect(DIASPORA_KAMPAGNE.auftrittsverbotChance).toBeLessThan(1);
    expect(DIASPORA_KAMPAGNE.beziehungGastland.max).toBeLessThan(0);
    expect(new Set(DIASPORA_EREIGNISSE.map((e) => e.id)).size).toBe(DIASPORA_EREIGNISSE.length);
    for (const e of DIASPORA_EREIGNISSE) {
      expect(e.titel.length).toBeGreaterThan(5);
      expect(e.beleg.length).toBeGreaterThan(3);
      expect(e.beziehungGastland, e.id).toBeGreaterThanOrEqual(-25);
      expect(e.beziehungGastland, e.id).toBeLessThanOrEqual(15);
    }
  });
});
