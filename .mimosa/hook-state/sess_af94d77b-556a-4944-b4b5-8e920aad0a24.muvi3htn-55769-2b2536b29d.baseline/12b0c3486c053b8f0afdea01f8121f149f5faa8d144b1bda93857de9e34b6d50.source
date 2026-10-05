import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import {
  kabinettStatus,
  berechneMinisterKapital,
  bereiteKabinettssitzungVor,
  halteKabinettssitzungAb,
} from "../src/sim/kabinett";
import { kapitalEinkommen } from "../src/sim/spiel";
import { eigenVon, loyalitaetVerschieben, grollVerschieben } from "../src/sim/personen";

function welt(): ReturnType<typeof createWorld> {
  const w = createWorld(turkey2026, 42);
  startAfterElection(w, schnellProfil());
  return w;
}

describe("Ministerrat (Bakanlar Kurulu) – Simulation & Democracy-4-Kopplung", () => {
  test("KabinettStatus erfasst die 7 Regierungsminister korrekt", () => {
    const w = welt();
    const st = kabinettStatus(w);

    expect(st.minister.length).toBe(7);
    const aemter = st.minister.map((m) => m.amt);
    expect(aemter).toContain("finanzen");
    expect(aemter).toContain("inneres");
    expect(aemter).toContain("aussen");
    expect(aemter).toContain("justiz");
    expect(aemter).toContain("generalstab");
    expect(aemter).toContain("wirtschaft");
    expect(aemter).toContain("stab");

    expect(st.kapitalSumme).toBeGreaterThan(2.5);
    expect(st.schnittLoyalitaet).toBeGreaterThan(40);
    expect(st.disziplin).toBeDefined();
  });

  test("Minister erzeugen Politisches Kapital je nach Loyalität und Leistung", () => {
    const w = welt();
    const st = kabinettStatus(w);
    const fin = st.minister.find((m) => m.amt === "finanzen")!;
    const fFin = w.spiel!.figuren.find((f) => f.amt === "finanzen")!;

    // Loyalität steigern -> Ertrag steigt
    loyalitaetVerschieben(fFin, 25);
    const kHoch = berechneMinisterKapital(w, fFin);
    expect(kHoch.beitrag).toBeGreaterThanOrEqual(fin.kapitalBeitrag);

    // Loyalität senken und Groll steigern -> Ertrag bricht ein
    loyalitaetVerschieben(fFin, -70);
    grollVerschieben(w, fFin, 60);
    const kTief = berechneMinisterKapital(w, fFin);
    expect(kTief.beitrag).toBeLessThan(kHoch.beitrag);
    expect(kTief.beitrag).toBeLessThanOrEqual(0.5);
  });

  test("kapitalEinkommen bezieht den Ertrag des Ministerrats mit ein", () => {
    const w = welt();
    const st = kabinettStatus(w);
    const einkommen = kapitalEinkommen(w);

    expect(einkommen.kabinett).toBeCloseTo(st.kapitalSumme, 1);
    expect(einkommen.summe).toBeGreaterThan(einkommen.grund);
  });

  test("Kabinettssitzung: Vorbereitung und Beschlussdurchführung verschieben Loyalitäten", () => {
    const w = welt();
    const themen = bereiteKabinettssitzungVor(w);
    expect(themen.length).toBeGreaterThanOrEqual(2);

    const haushalt = themen.find((t) => t.id === "haushalt_prioritaet");
    expect(haushalt).toBeDefined();

    const fFin = w.spiel!.figuren.find((f) => f.amt === "finanzen")!;
    const fGen = w.spiel!.figuren.find((f) => f.amt === "generalstab")!;
    const finLoyalVorher = fFin.loyalitaet;
    const genLoyalVorher = fGen.loyalitaet;

    // Beschluss: Sparkurs zugunsten der Finanzen
    const res = halteKabinettssitzungAb(w, "haushalt_prioritaet", "sparen");
    expect(res.erfolg).toBe(true);
    expect(res.effekteText.length).toBeGreaterThan(0);

    // Finanzminister gewinnt Loyalität, Generalstab verliert
    expect(fFin.loyalitaet).toBeGreaterThan(finLoyalVorher);
    expect(fGen.loyalitaet).toBeLessThan(genLoyalVorher);

    // Letzter Sitzungstag wurde vermerkt
    expect(w.spiel!.zuletzt.kabinettssitzung).toBe(w.day);
  });
});

describe("Kabinettshebel wirken bezahlt und bleiben (Reparatur Welle 2)", () => {
  test("Sparkurs: der Impuls sinkt um 0,6 % des BIP, die Defizit-Grundlinie bleibt, die Nachfrage bremst", () => {
    const sparen = welt();
    const basis = welt();
    const grundlinie = sparen.economy.deficit;
    const impulsVorher = sparen.economy.fiscalImpulse;
    expect(halteKabinettssitzungAb(sparen, "haushalt_prioritaet", "sparen").erfolg).toBe(true);
    expect(sparen.economy.fiscalImpulse).toBeCloseTo(impulsVorher - 0.6, 6);
    expect(sparen.economy.deficit).toBe(grundlinie);
    // Nach einem Jahr: weniger Schulden, aber auch weniger Auslastung als ohne Beschluss (die Gegenrechnung)
    for (let m = 0; m < 12; m++) {
      advance(sparen, 30);
      advance(basis, 30);
    }
    expect(sparen.economy.outputGap).toBeLessThan(basis.economy.outputGap);
    expect(sparen.economy.debtRatio).toBeLessThan(basis.economy.debtRatio);
  });

  test("Wachstumsimpuls: wird nicht mehr überschrieben, hebt die Auslastung und kostet Schulden", () => {
    const impuls = welt();
    const basis = welt();
    const wachstumVorher = impuls.economy.growth;
    impuls.spiel!.kapital = 50;
    expect(halteKabinettssitzungAb(impuls, "haushalt_prioritaet", "investieren").erfolg).toBe(true);
    // Kein direkter Eingriff ins Wachstum mehr
    expect(impuls.economy.growth).toBe(wachstumVorher);
    for (let m = 0; m < 12; m++) {
      advance(impuls, 30);
      advance(basis, 30);
    }
    expect(impuls.economy.outputGap).toBeGreaterThan(basis.economy.outputGap);
    expect(impuls.economy.debtRatio).toBeGreaterThan(basis.economy.debtRatio);
  });

  test("Wiederholte Sparbeschlüsse laufen nicht ins Unendliche (Deckel bei −3 % des BIP)", () => {
    const w = welt();
    for (let i = 0; i < 12; i++) {
      w.spiel!.zuletzt.kabinettssitzung = -999;
      halteKabinettssitzungAb(w, "haushalt_prioritaet", "sparen");
    }
    expect(w.economy.fiscalImpulse).toBeGreaterThanOrEqual(-3);
  });
});
