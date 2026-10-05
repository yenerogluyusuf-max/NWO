// Krisen-Blocker (MIL-3, HOI4 „National Spirits" light): Aktivierung an der Schwelle, Sperre/Verteuerung der
// betroffenen Maßnahmen, Ende unter der Unterschwelle (Hysterese), ehrliche Ablehnung mit Ausweg,
// derselbe Check für Parser und KI, und Laden älterer Spielstände ohne Krisen-Feld.

import { describe, expect, test } from "vitest";
import { createWorld, advance, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { bringeEin, pruefeVorhaben, setPolicy } from "../src/sim/handeln";
import { aktiveKrisen, krisenAktualisieren, krisenFuerMassnahme } from "../src/sim/krisen";
import { LAENDER, weltZustand } from "../src/sim/laender";
import { befehl } from "../src/sim/befehle";
import { fuehreAus } from "../src/ki/aktionen";
import type { World } from "../src/sim/types";

function welt(): World {
  const w = createWorld(turkey2026, 6);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  return w;
}

const ids = (w: World) => aktiveKrisen(w).map((k) => k.id);

function liraAn(w: World): void {
  w.economy.fxChange12 = 50;
  w.economy.riskPremium = 700;
  krisenAktualisieren(w);
}

function katastropheAn(w: World): void {
  w.spiel!.zuletzt.erdbeben = w.day;
  krisenAktualisieren(w);
}

/** Setzt die Konflikt-Dimension aller Nachbarn (und hebt einen davon auf `scharf`, wenn angegeben). */
function kriegAn(w: World, scharf: number, rest = 50): void {
  const welt = weltZustand(w);
  const nachbarn = LAENDER.filter((l) => l.gruppe === "Nachbarn");
  for (const n of nachbarn) welt[n.id]!.konflikt = rest;
  welt[nachbarn[0]!.id]!.konflikt = scharf;
  krisenAktualisieren(w);
}

describe("Krisen-Blocker: Lira-Vertrauen erschüttert", () => {
  test("wird über der Schwelle aktiv und verteuert Ausgaben in Wirtschaft und Haushalt", () => {
    const w = welt();
    expect(ids(w)).toEqual([]);
    const vorher = pruefeVorhaben(w, "m_exportfoerderung", 70);
    expect(vorher.ok).toBe(true);
    expect(vorher.krisenFaktor).toBe(1);

    liraAn(w);
    expect(ids(w)).toContain("lira_vertrauen");

    const waerend = pruefeVorhaben(w, "m_exportfoerderung", 70);
    expect(waerend.ok, "teuer sperrt nicht").toBe(true);
    expect(waerend.krisenFaktor).toBe(1.5);
    expect(waerend.gesetz.pk).toBe(Math.max(2, Math.round(vorher.gesetz.pk * 1.5)));
    expect(waerend.hinweise.some((h) => h.includes("Lira-Vertrauen erschüttert"))).toBe(true);

    // Einbringbar, aber zum verteuerten Preis
    w.spiel!.kapital = 100;
    const r = bringeEin(w, "m_exportfoerderung", 70, null, "gesetz");
    expect(r.ok, r.text).toBe(true);
    expect(100 - w.spiel!.kapital).toBeCloseTo(waerend.gesetz.pk, 6);
  });

  test("endet erst unter der Unterschwelle (Hysterese)", () => {
    const w = welt();
    liraAn(w);
    expect(ids(w)).toContain("lira_vertrauen");
    // Zwischen Schwelle und Unterschwelle bleibt die Krise aktiv
    w.economy.fxChange12 = 40;
    w.economy.riskPremium = 500;
    krisenAktualisieren(w);
    expect(ids(w)).toContain("lira_vertrauen");
    // Unter der Unterschwelle ist sie vorbei
    w.economy.fxChange12 = 30;
    w.economy.riskPremium = 400;
    krisenAktualisieren(w);
    expect(ids(w)).toEqual([]);
    expect(pruefeVorhaben(w, "m_exportfoerderung", 70).krisenFaktor).toBe(1);
  });
});

describe("Krisen-Blocker: Katastrophenlage", () => {
  test("sperrt Prestige, verteuert Ferneres, lässt die Versorgung unverteuert", () => {
    const w = welt();
    katastropheAn(w);
    expect(ids(w)).toContain("katastrophenlage");

    // Prestige (Kultur) gesperrt, mit Grund und Ausweg
    const denkmal = pruefeVorhaben(w, "m_denkmalschutz", 80);
    expect(denkmal.ok).toBe(false);
    expect(denkmal.grund).toContain("Katastrophenlage");
    expect(denkmal.grund).toContain("Ausweg");

    // Versorgung (Wohnen) bleibt unverteuert
    const versorgung = pruefeVorhaben(w, "m_stadterneuerung", 70);
    expect(versorgung.ok).toBe(true);
    expect(versorgung.krisenFaktor).toBe(1);

    // Der Rest (hier Militär) wird teurer
    const fern = pruefeVorhaben(w, "m_verteidigung", 70);
    expect(fern.ok).toBe(true);
    expect(fern.krisenFaktor).toBe(1.5);
  });

  test("endet, wenn die Katastrophe lange genug zurückliegt", () => {
    const w = welt();
    katastropheAn(w);
    expect(ids(w)).toContain("katastrophenlage");
    w.spiel!.zuletzt.erdbeben = w.day - 120;
    w.spiel!.ereignisse = [];
    krisenAktualisieren(w);
    expect(ids(w)).toEqual([]);
    expect(pruefeVorhaben(w, "m_denkmalschutz", 80).ok).toBe(true);
  });
});

describe("Krisen-Blocker: Kriegsgefahr", () => {
  test("macht Außen und Militär günstiger, sperrt Prestige, hält an der Hysterese fest", () => {
    const w = welt();
    const vorher = pruefeVorhaben(w, "m_verteidigung", 75);
    kriegAn(w, 80);
    expect(ids(w)).toContain("kriegsgefahr");

    const militaer = pruefeVorhaben(w, "m_verteidigung", 75);
    expect(militaer.ok).toBe(true);
    expect(militaer.krisenFaktor).toBe(0.75);
    expect(militaer.gesetz.pk).toBeLessThan(vorher.gesetz.pk);

    const aussen = pruefeVorhaben(w, "m_grenzschutz", 80);
    expect(aussen.krisenFaktor).toBe(0.75);

    const kultur = pruefeVorhaben(w, "m_denkmalschutz", 80);
    expect(kultur.ok).toBe(false);
    expect(kultur.grund).toContain("Kriegsgefahr");

    // Hysterese: zwischen Unterschwelle und Schwelle bleibt sie aktiv
    kriegAn(w, 70);
    expect(ids(w)).toContain("kriegsgefahr");
    kriegAn(w, 50);
    expect(ids(w)).toEqual([]);
  });
});

describe("Krisen-Blocker: Justiz im Umbau", () => {
  test("sperrt weitere Justiz-Maßnahmen, solange die Reform läuft — nicht die Reform selbst", () => {
    const w = welt();
    setPolicy(w, "m_justizreform", 80);
    krisenAktualisieren(w);
    expect(ids(w)).toContain("justiz_umbau");

    const andere = pruefeVorhaben(w, "m_antikorruption", 60);
    expect(andere.ok).toBe(false);
    expect(andere.grund).toContain("Justiz im Umbau");
    expect(andere.grund).toContain("Ausweg");

    const reformSelbst = pruefeVorhaben(w, "m_justizreform", 60);
    expect(reformSelbst.ok).toBe(true);

    // Reform abgeschlossen (Ziel erreicht bzw. zurückgenommen): Der Weg ist wieder frei
    delete w.net.targets["m_justizreform"];
    krisenAktualisieren(w);
    expect(ids(w)).toEqual([]);
    expect(pruefeVorhaben(w, "m_antikorruption", 60).ok).toBe(true);
  });

  test("zählt auch ein Gesetz im Parlament als laufenden Umbau", () => {
    const w = welt();
    w.spiel!.gesetze.push({ id: "g-test", massnahme: "m_justizreform", name: "Justizreform", stufe: 80, provinzen: null, eingebracht: w.day, abstimmung: w.day + 21, pk: 10, absprachen: 0 });
    krisenAktualisieren(w);
    expect(ids(w)).toContain("justiz_umbau");
    w.spiel!.gesetze = [];
    krisenAktualisieren(w);
    expect(ids(w)).toEqual([]);
  });
});

describe("Krisen-Blocker: gleiche Prüfung für Parser und KI", () => {
  test("Befehl und KI-Aktion werden mit derselben Begründung abgelehnt", () => {
    const w = welt();
    katastropheAn(w);
    const r = befehl("Erhöhe den Denkmalschutz", w);
    expect(r.ok).toBe(false);
    expect(r.text).toContain("Katastrophenlage");
    expect(r.text).toContain("Ausweg");

    const k = fuehreAus(w, { art: "massnahme", id: "m_denkmalschutz", stufe: 80 });
    expect(k.ok).toBe(false);
    expect(k.text).toContain("Katastrophenlage");

    // Nichts wurde trotzdem beschlossen
    expect(w.net.targets["m_denkmalschutz"]).toBeUndefined();
    expect(w.spiel!.gesetze).toHaveLength(0);

    // Was der Versorgung dient, geht weiterhin — auch über Parser und KI
    const gut = befehl("Bauaufsicht auf 60", w);
    expect(gut.ok, gut.text).toBe(true);
    const gutKi = fuehreAus(w, { art: "massnahme", id: "m_stadterneuerung", stufe: 70 });
    expect(gutKi.ok, gutKi.text).toBe(true);
  });
});

describe("Krisen-Blocker: Spielstände", () => {
  test("ein alter Spielstand ohne Krisen-Feld lädt, und der Tick füllt die Krisen nach", () => {
    const w = welt();
    kriegAn(w, 80);
    expect(ids(w)).toContain("kriegsgefahr");

    // So sieht ein Spielstand von vor MIL-3 aus: ohne das Feld
    const roh = JSON.parse(JSON.stringify(w)) as World;
    delete roh.spiel!.krisen;
    const geladen = load(JSON.stringify(roh));
    expect(geladen.spiel!.krisen).toBeUndefined();
    expect(aktiveKrisen(geladen)).toEqual([]);

    advance(geladen, 2);
    expect(ids(geladen)).toContain("kriegsgefahr");
    const pr = pruefeVorhaben(geladen, "m_denkmalschutz", 80);
    expect(pr.ok).toBe(false);
    expect(pr.grund).toContain("Kriegsgefahr");
  });

  test("ein Spielstand mit Krisen-Feld behält sie über das Laden", () => {
    const w = welt();
    katastropheAn(w);
    const geladen = load(JSON.stringify(w));
    expect(ids(geladen)).toContain("katastrophenlage");
    expect(krisenFuerMassnahme(geladen, "m_denkmalschutz").some((k) => k.art === "gesperrt")).toBe(true);
  });
});
