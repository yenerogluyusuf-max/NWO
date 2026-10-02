// Außenwirtschaft minimal (WIR-2 aus VERBESSERUNGSPLAN_2026-09-30): Leistungsbilanz-Treiber, J-Kurve,
// Reserven-Dynamik, Interventionen mit Interventionskosten und ehrlicher Warnung, Schwellen mit
// Hysterese (CDS-/Kurs-Zuschläge), Zahlungsbilanzkrise im Krisen-Modul, IWF-Stand-by mit drei
// Review-Raten, Migration älterer Spielstände und Determinismus.
// Modell-Entscheidungen und Modellgrenzen: kalibrierung/KALIBRIERUNG_LOG.md (WIR-2-Eintrag).

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { dailyDepreciation, dailyRiskPremium } from "../src/sim/economy";
import { Rng } from "../src/sim/rng";
import { wirke } from "../src/sim/wirkung";
import { krisenAktualisieren, krisenFuerMassnahme, aktiveKrisen } from "../src/sim/krisen";
import { setFiscalImpulse } from "../src/sim/eingriffe";
import {
  DEVISEN,
  aktualisiereReservenDruck,
  bipUsdMrd,
  devisenMonat,
  devisenZustand,
  interveniere,
  interventionsVorschau,
  iwfAnfrageMoeglich,
  iwfKuendigen,
  iwfSicht,
  iwfStarten,
  kapitalflussZerlegung,
  leistungsbilanzZerlegung,
} from "../src/sim/devisen";
import type { World } from "../src/sim/types";

function welt(seed = 3): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 60;
  const p = w.player!.partei.kurz;
  w.parliament!.seats[p] = 450;
  return w;
}

/** Ereignisse würden die Läufe stören; sie werden laufend geleert. */
function bis(w: World, tage: number): void {
  for (let i = 0; i < tage; i++) {
    advance(w, 1);
    w.spiel!.ereignisse = [];
  }
}

/** Bis zu einem absoluten Spieltag vorrücken (Reviews laufen jeweils am Monatsersten). */
function bisTag(w: World, tag: number): void {
  while (w.day < tag) {
    advance(w, 1);
    w.spiel!.ereignisse = [];
  }
}

describe("Leistungsbilanz: Treiber und J-Kurve", () => {
  test("EU-Nachfrage bessert, Energiepreis verschlechtert, Tourismus stützt; Gold/Sonstiges ist pauschal negativ", () => {
    const w = welt();
    const basis = leistungsbilanzZerlegung(w);
    const zeile = (z: ReturnType<typeof leistungsbilanzZerlegung>, name: string) => z.zeilen.find((x) => x.name === name)!.wert;
    expect(zeile(basis, "Nachfrage aus der EU")).toBeCloseTo(0, 6);
    expect(zeile(basis, "Gold und Sonstiges")).toBe(DEVISEN.goldPauschal);

    w.economy.euNachfrage = 120;
    const eu = leistungsbilanzZerlegung(w);
    expect(zeile(eu, "Nachfrage aus der EU")).toBeCloseTo(DEVISEN.euAufLb * 20, 6);
    expect(eu.ziel).toBeGreaterThan(basis.ziel);

    w.economy.euNachfrage = 100;
    w.economy.oel = 150;
    const oel = leistungsbilanzZerlegung(w);
    expect(zeile(oel, "Energie-Importrechnung")).toBeCloseTo(DEVISEN.oelAufLb * 50, 6);
    expect(oel.ziel).toBeLessThan(basis.ziel);

    w.economy.oel = 100;
    wirke(w, "tourismus", 10);
    const tour = leistungsbilanzZerlegung(w);
    expect(zeile(tour, "Tourismus")).toBeGreaterThan(0);
  });

  test("J-Kurve: frische Abwertung wirkt zunächst negativ, nach sechs Monaten positiv", () => {
    const w = welt();
    const e = w.economy;
    const h = w.history;
    const zeileJK = () => leistungsbilanzZerlegung(w).zeilen.find((x) => x.name === "Abwertung (J-Kurve)")!.wert;

    // 30 % Abwertung in den letzten 6 Monaten, ruhige Monate 7–12: Importe verteuern sich sofort
    const vor12 = h[h.length - 12]!.usdTry;
    h[h.length - 6]!.usdTry = e.usdTry / 1.3;
    h[h.length - 12]!.usdTry = h[h.length - 6]!.usdTry;
    const frisch = zeileJK();
    expect(frisch).toBeCloseTo(-DEVISEN.jKurveKurz * 30, 1);
    expect(frisch).toBeLessThan(0);

    // Dieselbe Abwertung liegt nun in den Monaten 7–12, die letzten 6 sind ruhig: Wettbewerbsfähigkeit zählt
    h[h.length - 6]!.usdTry = e.usdTry;
    h[h.length - 12]!.usdTry = e.usdTry / 1.3;
    const spaet = zeileJK();
    expect(spaet).toBeCloseTo(DEVISEN.jKurveLang * 30, 1);
    expect(spaet).toBeGreaterThan(0);
    h[h.length - 12]!.usdTry = vor12;
  });
});

describe("Reserven: Saldo, Flüsse und Intervention", () => {
  test("Reserven folgen Leistungsbilanz plus Kapitalflüssen; Ölpreis-Schock verschärft den Abfluss", () => {
    const w = welt();
    const brutto0 = w.economy.reservenBruttoUsdMrd!;
    devisenMonat(w);
    const fluesse = kapitalflussZerlegung(w).ziel;
    const erwartet = ((w.economy.leistungsbilanzPctBip! + fluesse) / 100 / 12) * bipUsdMrd(w.economy);
    const delta = w.economy.reservenBruttoUsdMrd! - brutto0;
    expect(delta).toBeCloseTo(erwartet, 1);
    expect(delta).toBeLessThan(0.5); // ruhige Lage: langsame Blutung, kein Sturz

    const w2 = welt();
    w2.economy.oel = 150;
    const brutto2 = w2.economy.reservenBruttoUsdMrd!;
    devisenMonat(w2);
    const delta2 = w2.economy.reservenBruttoUsdMrd! - brutto2;
    expect(delta2).toBeLessThan(delta); // Energie-Schock treibt die Importrechnung
  });

  test("Intervention: kostet Reserven, stützt den Kurs sofort und legt einen Puffer; bei komfortablen Reserven ohne Glaubwürdigkeitsabzug", () => {
    const w = welt();
    const e = w.economy;
    e.reservenNettoUsdMrd = 80;
    e.reservenBruttoUsdMrd = 200;
    const kurs0 = e.usdTry;
    const cred0 = e.credibility;
    const cds0 = e.riskPremium;
    const r = interveniere(w, 5);
    expect(r.ok, r.text).toBe(true);
    expect(e.reservenNettoUsdMrd).toBe(75);
    expect(e.reservenBruttoUsdMrd).toBe(195);
    expect(e.usdTry).toBeLessThan(kurs0); // sofortige Stütze
    expect(e.fxPuffer!).toBeGreaterThan(0); // Restglättung über Wochen
    expect(e.credibility).toBe(cred0); // komfortable Reserven: keine zweischneidige Strafe
    expect(e.riskPremium).toBe(cds0);
    expect(devisenZustand(w).interventionen.length).toBe(1);

    // Der Puffer dämpft die tägliche Abwertung und verbraucht sich dabei
    const rng1 = new Rng(42);
    const rng2 = new Rng(42);
    const puffer0 = e.fxPuffer!;
    const mitPuffer = dailyDepreciation(e, rng1);
    const pufferRest = e.fxPuffer!;
    expect(pufferRest).toBeLessThan(puffer0);
    e.fxPuffer = 0;
    const ohnePuffer = dailyDepreciation(e, rng2);
    expect(mitPuffer).toBeLessThan(ohnePuffer);
  });

  test("Intervention bei knappen Reserven: ehrliche Warnung, Glaubwürdigkeits- und Risikoaufschlag-Abzug (zweischneidig)", () => {
    const w = welt();
    const e = w.economy;
    e.reservenNettoUsdMrd = 22;
    e.reservenBruttoUsdMrd = 150;
    const v = interventionsVorschau(w, 5);
    expect(v.ok).toBe(true);
    expect(v.warnung).toBeTruthy(); // Warnung unter 20 Mrd. steht im Angebot
    const cred0 = e.credibility;
    const cds0 = e.riskPremium;
    interveniere(w, 5);
    expect(e.reservenNettoUsdMrd).toBe(17);
    expect(e.credibility).toBeLessThan(cred0);
    expect(e.riskPremium).toBeGreaterThan(cds0);
  });

  test("Intervention ist begrenzt: Höchstbetrag und vorhandene Reserven", () => {
    const w = welt();
    expect(interventionsVorschau(w, 50).usdMrd).toBe(DEVISEN.intervention.maxJeSchritt);
    w.economy.reservenBruttoUsdMrd = 3;
    expect(interveniere(w, 5).ok).toBe(false);
  });
});

describe("Schwellen mit Hysterese und Krisen-Modul", () => {
  test("Reserven-Druck: an unter 25, klebt bis 30, aus darüber (Hysterese) — und treibt CDS und Abwertung", () => {
    const e = welt().economy;
    e.reservenNettoUsdMrd = 24;
    aktualisiereReservenDruck(e);
    const druck = e.reservenDruck!;
    expect(druck).toBeCloseTo(1 / 25, 6);
    e.reservenNettoUsdMrd = 27; // über der An-, unter der Ausschwelle: klebt
    aktualisiereReservenDruck(e);
    expect(e.reservenDruck).toBe(druck);
    e.reservenNettoUsdMrd = 31; // über der Ausschwelle: aus
    aktualisiereReservenDruck(e);
    expect(e.reservenDruck).toBe(0);

    // CDS- und Kurs-Komponente: Druck verteuert Risiko und beschleunigt die Abwertung
    e.reservenDruck = 0.5;
    const cdsDruck = dailyRiskPremium(e, new Rng(7));
    const kursDruck = dailyDepreciation(e, new Rng(7));
    e.reservenDruck = 0;
    const cdsRuhig = dailyRiskPremium(e, new Rng(7));
    const kursRuhig = dailyDepreciation(e, new Rng(7));
    expect(cdsDruck).toBeGreaterThan(cdsRuhig);
    expect(kursDruck).toBeGreaterThan(kursRuhig);
  });

  test("Zahlungsbilanzkrise: aktiv unter 10 Mrd. mit Blockern, endet erst über 14 (Hysterese)", () => {
    const w = welt();
    w.economy.reservenNettoUsdMrd = 8;
    krisenAktualisieren(w);
    expect(aktiveKrisen(w).map((k) => k.id)).toContain("zahlungsbilanz");
    // Blocker: Ausgaben in Wirtschaft teurer, Kultur/Prestige gesperrt (mit ehrlichem Ausweg)
    const teuer = krisenFuerMassnahme(w, "m_exportfoerderung");
    expect(teuer.some((t) => t.krise.id === "zahlungsbilanz" && t.art === "teuer")).toBe(true);
    const gesperrt = krisenFuerMassnahme(w, "m_kulturfoerderung");
    expect(gesperrt.some((t) => t.krise.id === "zahlungsbilanz" && t.art === "gesperrt" && t.ausweg?.includes("IWF"))).toBe(true);

    w.economy.reservenNettoUsdMrd = 12; // über der An-, unter der Ausschwelle: bleibt aktiv
    krisenAktualisieren(w);
    expect(aktiveKrisen(w).map((k) => k.id)).toContain("zahlungsbilanz");
    w.economy.reservenNettoUsdMrd = 15;
    krisenAktualisieren(w);
    expect(aktiveKrisen(w).map((k) => k.id)).not.toContain("zahlungsbilanz");
  });

  test("Kapitalflucht verschärft die Krise: aktiver Zustand senkt die Flüsse", () => {
    const w = welt();
    const ruhig = kapitalflussZerlegung(w).ziel;
    w.economy.reservenNettoUsdMrd = 8;
    krisenAktualisieren(w);
    const krise = kapitalflussZerlegung(w).ziel;
    expect(krise).toBeCloseTo(ruhig + DEVISEN.kriseFlucht, 6);
  });
});

describe("IWF-Stand-by mit drei Review-Raten", () => {
  test("Unterzeichnung: Devisen-Zufluss, Rating-Stützung, Auflagen sichtbar; Anfrage nur in ernster Lage", () => {
    const w = welt();
    const e = w.economy;
    // Bei ruhiger Lage fragt der IWF nicht an
    expect(iwfAnfrageMoeglich(w).moeglich).toBe(false);
    e.riskPremium = 450;
    expect(iwfAnfrageMoeglich(w).moeglich).toBe(true);

    const brutto0 = e.reservenBruttoUsdMrd!;
    const cds0 = e.riskPremium;
    const cred0 = e.credibility;
    iwfStarten(w);
    expect(e.reservenBruttoUsdMrd).toBeCloseTo(brutto0 + DEVISEN.iwf.sofortUsdMrd, 6);
    expect(e.riskPremium).toBeCloseTo(cds0 + DEVISEN.iwf.risikoStart, 6);
    expect(e.credibility).toBeGreaterThan(cred0);
    const sicht = iwfSicht(w)!;
    expect(sicht.aktiv).toBe(true);
    expect(sicht.rate).toBe(1);
    expect(sicht.zinsMindest).toBeGreaterThan(0);
    expect(sicht.zeile).toContain("Review 1 von 3");
    expect(sicht.zeile).toContain("Spielraum");
  });

  test("Bestandene Review bringt die nächste Tranche; nach drei Reviews endet das Programm sauber", () => {
    const w = welt();
    iwfStarten(w);
    // Auflagen niedrig halten, damit der Mechanismus (nicht das Auflagenniveau) geprüft wird
    devisenZustand(w).iwf!.zinsMindest = 5;
    const brutto0 = w.economy.reservenBruttoUsdMrd!;
    // Die Review (Tag 122) wird am ersten Monatsersten danach wirksam
    bisTag(w, 155);
    const z = devisenZustand(w);
    expect(z.iwf).not.toBeNull();
    expect(z.iwf!.rate).toBe(2);
    expect(z.iwf!.bestanden).toBe(1);
    // Tranche geflossen (der laufende Saldo aus Leistungsbilanz und Flüssen schmälert den Zuwachs etwas)
    expect(w.economy.reservenBruttoUsdMrd!).toBeGreaterThan(brutto0 + DEVISEN.iwf.trancheUsdMrd - 2.5);
    expect(w.economy.reservenBruttoUsdMrd!).toBeLessThan(brutto0 + DEVISEN.iwf.trancheUsdMrd + 0.5);

    bisTag(w, 310);
    expect(devisenZustand(w).iwf!.rate).toBe(3);
    bisTag(w, 435);
    const ende = devisenZustand(w);
    expect(ende.iwf).toBeNull(); // dritte Review bestanden: Programm abgeschlossen
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("iwf-ende"))).toBe(true);
    expect(iwfAnfrageMoeglich(w).moeglich).toBe(false); // Abkühlung nach dem Programm
  });

  test("Verfehlte Auflagen brechen das Programm: Tranchen eingefroren, Märkte strafen den Bruch", () => {
    const w = welt();
    iwfStarten(w);
    setFiscalImpulse(w, 3); // Defizit deutlich über der Obergrenze
    const cds0 = w.economy.riskPremium;
    bisTag(w, 155);
    const z = devisenZustand(w);
    expect(z.iwf).toBeNull();
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("iwf-bruch"))).toBe(true);
    expect(w.economy.riskPremium).toBeGreaterThan(cds0); // Bruchpreis sichtbar
    expect(z.iwfAbkuehlung).toBeGreaterThan(w.day);
  });

  test("Vorzeitige Kündigung kostet wie ein Bruch", () => {
    const w = welt();
    iwfStarten(w);
    const cds0 = w.economy.riskPremium;
    const r = iwfKuendigen(w);
    expect(r.ok).toBe(true);
    expect(devisenZustand(w).iwf).toBeNull();
    expect(w.economy.riskPremium).toBeGreaterThan(cds0);
    expect(iwfKuendigen(w).ok).toBe(false);
  });
});

describe("Migration und Determinismus", () => {
  test("Ein Spielstand ohne Devisen-Felder lädt mit den Szenario-Startwerten und läuft weiter", () => {
    const w = welt();
    bis(w, 40);
    const roh = JSON.parse(save(w));
    delete roh.economy.leistungsbilanzPctBip;
    delete roh.economy.reservenBruttoUsdMrd;
    delete roh.economy.reservenNettoUsdMrd;
    delete roh.economy.reservenDruck;
    delete roh.economy.fxPuffer;
    delete roh.spiel.wirtschaft.devisen;
    const l = load(JSON.stringify(roh));
    expect(l.economy.leistungsbilanzPctBip).toBeCloseTo(-2.3, 6);
    expect(l.economy.reservenBruttoUsdMrd).toBeCloseTo(174.5, 6);
    expect(l.economy.reservenNettoUsdMrd).toBeCloseTo(29.1, 6);
    advance(l, 60);
    expect(Number.isFinite(l.economy.reservenNettoUsdMrd!)).toBe(true);
    expect(Number.isFinite(l.economy.leistungsbilanzPctBip!)).toBe(true);
  });

  test("Zwei identische Partien sind bitgleich (Determinismus trotz eigener Zufallsströme)", () => {
    const a = welt(11);
    const b = welt(11);
    for (let i = 0; i < 150; i++) {
      advance(a, 1);
      advance(b, 1);
      a.spiel!.ereignisse = [];
      b.spiel!.ereignisse = [];
    }
    expect(save(a)).toBe(save(b));
  });
});
