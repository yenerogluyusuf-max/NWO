// Befehle an die Minister: Angebot, Vorschau, Erteilen, Weigerung, Ausführung über die Kernfunktionen.

import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { eigenVon } from "../src/sim/personen";
import { verfassungVon } from "../src/sim/aufmerksamkeit";
import { MAX_BEFEHLE, befehlAngebote, befehlVorschau, erteileBefehl, laufendeBefehle, verweigerungsChance } from "../src/sim/minister-befehle";
import { ministerflussMonat } from "../src/sim/ministerfluss-monat";
import { flussZustand } from "../src/sim/ministerfluss";
import type { Figur } from "../src/sim/spiel-typen";
import type { World } from "../src/sim/types";

function welt(seed = 5): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 90;
  advance(w, 200);
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 90;
  verfassungVon(w).aufmerksamkeit = 100;
  verfassungVon(w).belastung = 0;
  delete verfassungVon(w).pauseBis;
  return w;
}

const minister = (w: World, amt: Figur["amt"]): Figur => w.spiel!.figuren.find((f) => f.amt === amt && f.imAmt)!;

function stark(w: World, f: Figur): void {
  f.loyalitaet = 90;
  const e = eigenVon(w, f);
  e.faehigkeit = 90;
  e.groll = 0;
}

describe("Angebot und Vorschau", () => {
  test("jedes Regierungsressort bietet Ziele und Vorhaben an, nur das Außenressort Verhandlungen", () => {
    const w = welt();
    for (const amt of ["finanzen", "inneres", "justiz", "generalstab", "wirtschaft", "stab"] as const) {
      const a = befehlAngebote(w, minister(w, amt).id);
      expect(a.some((x) => x.entwurf.typ === "ziel" || x.entwurf.typ === "vorhaben")).toBe(true);
      expect(a.some((x) => x.entwurf.typ === "verhandeln")).toBe(false);
    }
    const aussen = befehlAngebote(w, minister(w, "aussen").id);
    expect(aussen.some((x) => x.entwurf.typ === "verhandeln")).toBe(true);
    // Die Zentralbank und die Opposition nehmen keine Befehle an
    expect(befehlAngebote(w, minister(w, "zentralbank").id)).toEqual([]);
  });

  test("die Vorschau nennt Kosten, Dauer, Chance und das Risiko der Weigerung", () => {
    const w = welt();
    const f = minister(w, "wirtschaft");
    stark(w, f);
    const a = befehlAngebote(w, f.id).find((x) => x.entwurf.typ === "vorhaben")!;
    const v = befehlVorschau(w, a.entwurf);
    expect(v.moeglich).toBe(true);
    expect(v.kosten.aufmerksamkeit).toBeGreaterThan(0);
    expect(v.kosten.aufmerksamkeit).toBeLessThan(10);
    expect(v.dauerMonate).toBeGreaterThanOrEqual(1);
    expect(v.erfolgschance).toBeGreaterThan(0.6);
    expect(v.verweigerung).toBe(0);
    f.loyalitaet = 30;
    expect(befehlVorschau(w, a.entwurf).verweigerung).toBeGreaterThan(0.3);
    expect(verweigerungsChance(f)).toBeCloseTo((55 - 30) / 60, 5);
  });

  test("ein Vorhaben, das schon im Parlament liegt, lässt sich nicht noch einmal vorbereiten", () => {
    const w = welt();
    const f = minister(w, "wirtschaft");
    const a = befehlAngebote(w, f.id).find((x) => x.entwurf.typ === "vorhaben")!;
    w.spiel!.gesetze.push({ id: "g-x", massnahme: a.entwurf.massnahme!, name: "x", abstimmung: w.day + 10, ziel: 50, pk: 1, ort: null } as never);
    expect(befehlVorschau(w, a.entwurf).moeglich).toBe(false);
  });
});

describe("Erteilen und Ausführen", () => {
  test("ein Vorhaben-Befehl läuft einige Monate und bringt das Gesetz ein; der Präsident spart Aufmerksamkeit", () => {
    const w = welt(6);
    const f = minister(w, "wirtschaft");
    stark(w, f);
    const a = befehlAngebote(w, f.id).find((x) => x.entwurf.typ === "vorhaben")!;
    const att0 = verfassungVon(w).aufmerksamkeit;
    const r = erteileBefehl(w, a.entwurf);
    expect(r.ok).toBe(true);
    expect(laufendeBefehle(w).length).toBe(1);
    // Der Befehl kostet nur einen Bruchteil der Aufmerksamkeit, die das Gesetz selbst kostete (10)
    expect(att0 - verfassungVon(w).aufmerksamkeit).toBeLessThan(5);
    const gesetze = w.spiel!.gesetze.length;
    const b = flussZustand(w).befehle[0]!;
    // Der Befehl ist noch nicht fällig
    ministerflussMonat(w);
    expect(b.status).toBe("laeuft");
    b.faellig = w.day;
    // Erfolg ist ein deterministischer Wurf: Die Chance ist hoch, für den Test genügt das Ergebnis, egal welcher Art
    ministerflussMonat(w);
    expect(b.status).toBe("erledigt");
    expect(b.ergebnis).toBeDefined();
    const rm = flussZustand(w).rueckmeldungen.find((x) => x.befehlId === b.id);
    expect(rm).toBeDefined();
    if (b.ergebnis === "erfolg") expect(w.spiel!.gesetze.length).toBe(gesetze + 1);
    else expect(w.spiel!.gesetze.length).toBe(gesetze);
  });

  test("über viele Seeds glückt der Entwurf eines starken Ministers meistens und scheitert eines schwachen öfter", () => {
    let starkOk = 0;
    let schwachOk = 0;
    const n = 14;
    for (let s = 1; s <= n; s++) {
      for (const art of ["stark", "schwach"] as const) {
        const w = welt(s);
        const f = minister(w, "wirtschaft");
        if (art === "stark") stark(w, f);
        else {
          f.loyalitaet = 60;
          eigenVon(w, f).faehigkeit = 30;
        }
        const a = befehlAngebote(w, f.id).find((x) => x.entwurf.typ === "vorhaben");
        if (!a) continue;
        if (!erteileBefehl(w, a.entwurf).ok) continue;
        const b = flussZustand(w).befehle[0]!;
        b.faellig = w.day;
        ministerflussMonat(w);
        if (b.ergebnis === "erfolg" || b.ergebnis === "teilerfolg") (art === "stark" ? (starkOk++, 0) : (schwachOk++, 0));
      }
    }
    expect(starkOk).toBeGreaterThan(schwachOk);
    expect(starkOk).toBeGreaterThanOrEqual(Math.floor(n * 0.7));
  });

  test("ein Minister ohne Rückhalt weigert sich; ein loyaler tut es nie", () => {
    let verweigert = 0;
    for (let s = 1; s <= 12; s++) {
      const w = welt(s);
      const f = minister(w, "finanzen");
      f.loyalitaet = 40;
      eigenVon(w, f).faehigkeit = 80;
      const a = befehlAngebote(w, f.id).find((x) => x.entwurf.typ === "vorhaben");
      if (!a) continue;
      const r = erteileBefehl(w, a.entwurf);
      if (r.ok && flussZustand(w).befehle.some((b) => b.status === "verweigert")) verweigert++;
    }
    expect(verweigert).toBeGreaterThan(0);
    expect(verweigert).toBeLessThan(12);

    for (let s = 1; s <= 12; s++) {
      const w = welt(s);
      const f = minister(w, "finanzen");
      stark(w, f);
      const a = befehlAngebote(w, f.id).find((x) => x.entwurf.typ === "vorhaben");
      if (!a) continue;
      expect(erteileBefehl(w, a.entwurf).ok).toBe(true);
      expect(flussZustand(w).befehle.some((b) => b.status === "verweigert")).toBe(false);
    }
  });

  test("eine Weigerung wird zur Rückmeldung mit Hinweis und kostet Groll, nicht Kapital", () => {
    for (let s = 1; s <= 20; s++) {
      const w = welt(s);
      const f = minister(w, "inneres");
      f.loyalitaet = 12;
      const kapital = w.spiel!.kapital;
      const a = befehlAngebote(w, f.id).find((x) => x.entwurf.typ === "vorhaben");
      if (!a) continue;
      const groll = eigenVon(w, f).groll;
      erteileBefehl(w, a.entwurf);
      const b = flussZustand(w).befehle[0];
      if (b?.status !== "verweigert") continue;
      expect(w.spiel!.kapital).toBe(kapital);
      expect(eigenVon(w, f).groll).toBeGreaterThan(groll);
      expect(flussZustand(w).rueckmeldungen.some((x) => x.ergebnis === "verweigert")).toBe(true);
      return;
    }
    throw new Error("Bei Loyalität 12 hätte sich in 20 Seeds mindestens einmal ein Minister weigern müssen");
  });

  test("höchstens vier Befehle zugleich, einer je Minister", () => {
    const w = welt(8);
    let erteilt = 0;
    for (const amt of ["finanzen", "inneres", "justiz", "generalstab", "wirtschaft", "stab"] as const) {
      const f = minister(w, amt);
      stark(w, f);
      const a = befehlAngebote(w, f.id).find((x) => x.entwurf.typ === "vorhaben");
      if (!a) continue;
      const r = erteileBefehl(w, a.entwurf);
      if (r.ok) erteilt++;
    }
    expect(laufendeBefehle(w).length).toBeLessThanOrEqual(MAX_BEFEHLE);
    expect(erteilt).toBeGreaterThanOrEqual(1);
    const f = minister(w, "wirtschaft");
    const a = befehlAngebote(w, f.id).find((x) => x.entwurf.typ === "vorhaben")!;
    expect(befehlVorschau(w, a.entwurf).moeglich).toBe(false);
  });

  test("Ziel setzen läuft als Auftrag mit Frist über das Gespräch und folgt dessen Regeln", () => {
    const w = welt(5);
    const f = minister(w, "inneres");
    stark(w, f);
    const a = befehlAngebote(w, f.id).find((x) => x.entwurf.typ === "ziel");
    expect(a).toBeDefined();
    const v = befehlVorschau(w, a!.entwurf);
    expect(v.moeglich).toBe(true);
    expect(v.dauerMonate).toBe(6);
    const r = erteileBefehl(w, a!.entwurf);
    expect(r.ok).toBe(true);
    expect(eigenVon(w, f).auftrag?.status).toBe("laeuft");
    // Ein zweiter Auftrag an denselben Minister geht nicht
    expect(befehlVorschau(w, a!.entwurf).moeglich).toBe(false);
  });

  test("Verhandeln lassen: das Außenressort führt die Handlung aus und meldet zurück", () => {
    const w = welt(5);
    const f = minister(w, "aussen");
    stark(w, f);
    const a = befehlAngebote(w, f.id).find((x) => x.entwurf.typ === "verhandeln");
    expect(a).toBeDefined();
    const kapital = w.spiel!.kapital;
    expect(erteileBefehl(w, a!.entwurf).ok).toBe(true);
    // Das Kapital wird erst bei Abschluss fällig
    expect(w.spiel!.kapital).toBe(kapital);
    const b = flussZustand(w).befehle[0]!;
    b.faellig = w.day;
    ministerflussMonat(w);
    expect(b.status).toBe("erledigt");
    expect(flussZustand(w).rueckmeldungen.some((x) => x.befehlId === b.id)).toBe(true);
    if (b.ergebnis === "erfolg") expect(w.spiel!.kapital).toBeLessThan(kapital);
  });
});
