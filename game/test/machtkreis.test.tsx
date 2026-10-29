// Der Machtkreis: Nebenfiguren, Beziehungen und Geheimnisse entstehen deterministisch, ältere Spielstände legen ihn an,
// die Hebel kosten und wirken, der Regierungsstil prägt Angst und Fähigkeit, die Fraktionsdisziplin zählt einmal je Gesetz,
// Untersuchungen enden mit Ergebnis, die Ereignisse haben Texte und Antworten, die Ansicht rendert in drei Sprachen.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { setPolicy } from "../src/sim/handeln";
import {
  HEBEL,
  MACHTKREIS,
  disziplinStimmen,
  hebelFuer,
  machtkreis,
  machtkreisMonat,
  nebenVon,
  personen,
  regimeGrad,
  regimeStil,
  schluesselVon,
  zieheHebel,
} from "../src/sim/machtkreis";
import { MACHTKREIS_VORLAGEN } from "../src/sim/ereignisse-machtkreis";
import { eigenVon } from "../src/sim/personen";
import { Machtkreis } from "../src/ui/personen/Machtkreis";
import { ladeSprache, setzeSprache } from "../src/i18n";
import de from "../src/i18n/katalog/de/machtkreis.json";
import tr from "../src/i18n/katalog/tr/machtkreis.json";
import en from "../src/i18n/katalog/en/machtkreis.json";
import type { World } from "../src/sim/types";
import { Rng } from "../src/sim/rng";
import { NET } from "../src/sim/modell";

function setzeKnoten(w: World, id: string, wert: number): void {
  const i = NET.index.get(id)!;
  for (let p = 0; p < 81; p++) w.net.values[i * 81 + p] = wert;
}

const KAPUTT = /undefined|NaN|\[object|\$\{|Infinity|⟦|mk\.[a-z]+\./;

function neu(seed = 11): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 80;
  return w;
}

afterAll(async () => { await setzeSprache("de"); });

describe("Anlegen", () => {
  test("vier Nebenfiguren, Beziehungen und Geheimnisse, deterministisch", () => {
    const a = neu(11);
    const b = neu(11);
    const mk = machtkreis(a);
    expect(mk.neben.map((n) => n.art)).toEqual(["kronprinz", "fraktionschef", "journalist", "richter"]);
    expect(mk.beziehungen.length).toBeGreaterThan(3);
    expect(JSON.stringify(machtkreis(b))).toBe(JSON.stringify(mk));
    // Keine Nebenfigur trägt den Namen eines Amtsträgers
    const namen = new Set(a.spiel!.figuren.map((f) => f.name));
    for (const n of mk.neben) expect(namen.has(n.name), n.name).toBe(false);
    // Jede Beziehung verbindet zwei Personen, die es gibt
    const da = new Set(personen(a).map((p) => p.schluessel));
    for (const x of mk.beziehungen) expect(da.has(x.a) && da.has(x.b)).toBe(true);
  });

  test("ältere Spielstände ohne Machtkreis laden und legen ihn an", () => {
    const w = neu(5);
    delete w.spiel!.machtkreis;
    const w2 = load(save(w));
    expect(w2.spiel!.machtkreis).toBeUndefined();
    advance(w2, 40);
    expect(w2.spiel!.machtkreis?.neben.length).toBe(4);
  });

  test("Stil zu Beginn gelenkt, mehr Pressefreiheit macht ihn offener", () => {
    const w = neu();
    const vorher = regimeGrad(w);
    expect(regimeStil(vorher)).toBe("gelenkt");
    setPolicy(w, "m_medienaufsicht", 10, null);
    setzeKnoten(w, "pressefreiheit", 75);
    setzeKnoten(w, "justiz_unabhaengigkeit", 75);
    expect(regimeGrad(w)).toBeLessThan(vorher);
  });
});

describe("Hebel", () => {
  test("jeder Hebel hat Preis und Satz; Befördern kostet Kapital und kränkt Rivalen", () => {
    const w = neu();
    const kp = nebenVon(w, "kronprinz")!;
    const s = schluesselVon(kp);
    const sicht = hebelFuer(w, s);
    expect(sicht.length).toBeGreaterThan(2);
    for (const h of sicht) {
      expect(h.pk).toBeGreaterThan(0);
      expect(h.folge).not.toMatch(KAPUTT);
    }
    const kap = w.spiel!.kapital;
    const loy = kp.loyalitaet;
    const r = zieheHebel(w, s, "befoerdern");
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(kap - MACHTKREIS.pk.befoerdern);
    expect(kp.loyalitaet).toBeGreaterThan(loy);
    // Abkühlung
    const zweit = zieheHebel(w, s, "befoerdern");
    expect(zweit.ok).toBe(false);
    expect(machtkreis(w).szenen.length).toBe(1);
  });

  test("Absprache, dann Kaltstellen: Wortbruch kostet alle", () => {
    const w = neu();
    const fin = w.spiel!.figuren.find((f) => f.amt === "finanzen")!;
    const s = schluesselVon(fin);
    expect(zieheHebel(w, s, "deal").ok).toBe(true);
    const anderer = w.spiel!.figuren.find((f) => f.amt === "aussen")!;
    const vorher = anderer.loyalitaet;
    expect(zieheHebel(w, s, "kaltstellen").ok).toBe(true);
    expect(anderer.loyalitaet).toBeLessThan(vorher);
    expect(machtkreis(w).deals[s]).toBeUndefined();
  });

  test("Bauernopfer entlässt; Untersuchung endet mit Ergebnis", () => {
    const w = neu();
    const inn = w.spiel!.figuren.find((f) => f.amt === "inneres")!;
    const alt = inn.name;
    expect(zieheHebel(w, schluesselVon(inn), "bauernopfer").ok).toBe(true);
    expect(inn.name).not.toBe(alt);
    const aus = w.spiel!.figuren.find((f) => f.amt === "aussen")!;
    expect(zieheHebel(w, schluesselVon(aus), "untersuchung").ok).toBe(true);
    expect(machtkreis(w).untersuchungen.length).toBe(1);
    advance(w, 200);
    expect(machtkreis(w).untersuchungen.length).toBe(0);
    expect(w.log.some((l) => l.text.includes(aus.name) && /Überprüfung/.test(l.text))).toBe(true);
  });

  test("Säuberung nur, wenn nicht offen; senkt Fähigkeit und schützt vor Putsch", () => {
    const w = neu();
    const gs = w.spiel!.figuren.find((f) => f.amt === "generalstab")!;
    const fae = eigenVon(w, gs).faehigkeit;
    const r = zieheHebel(w, schluesselVon(gs), "saeuberung");
    expect(r.ok).toBe(true);
    expect(eigenVon(w, gs).faehigkeit).toBeLessThan(fae);
    expect(machtkreis(w).angst).toBeGreaterThan(0);
  });

  test("Begnadigung nur für Inhaftierte", () => {
    const w = neu();
    const j = nebenVon(w, "journalist")!;
    expect(hebelFuer(w, schluesselVon(j)).some((h) => h.hebel === "begnadigung")).toBe(false);
    j.status = "haft";
    j.bis = w.day + 300;
    expect(zieheHebel(w, schluesselVon(j), "begnadigung").ok).toBe(true);
    expect(j.status).toBe("aktiv");
  });

  test("alle Hebel bekannt", () => {
    expect(HEBEL.length).toBe(7);
  });
});

describe("Monat", () => {
  test("Angst unter autoritärem Stil frisst Fähigkeit", () => {
    const w = neu();
    setzeKnoten(w, "pressefreiheit", 5);
    setzeKnoten(w, "justiz_unabhaengigkeit", 5);
    expect(regimeStil(regimeGrad(w))).toBe("autoritaer");
    const fin = w.spiel!.figuren.find((f) => f.amt === "finanzen")!;
    const vorher = eigenVon(w, fin).faehigkeit;
    machtkreis(w).angst = 80;
    for (let i = 0; i < 12; i++) machtkreisMonat(w);
    expect(eigenVon(w, fin).faehigkeit).toBeLessThan(vorher);
  });

  test("Fraktionsdisziplin zählt einmal je Gesetz", () => {
    const w = neu();
    const g = { id: "g-test", massnahme: "m_polizei", name: "Test", stufe: 60, provinzen: null, eingebracht: w.day, abstimmung: w.day + 60, pk: 0, absprachen: 0, stimmenBonus: 2 };
    w.spiel!.gesetze.push(g);
    machtkreisMonat(w);
    machtkreisMonat(w);
    expect(g.stimmenBonus).toBe(2 + disziplinStimmen(w));
  });

  test("Nachfolgedruck wächst bei schlechten Zahlen und langer Amtszeit", () => {
    const w = neu();
    const mk = machtkreis(w);
    const vorher = mk.nachfolge;
    w.spiel!.umfrage.zustimmung = 30;
    w.spiel!.amtszeit = 3;
    for (let i = 0; i < 6; i++) machtkreisMonat(w);
    expect(mk.nachfolge).toBeGreaterThan(vorher + 10);
  });
});

describe("Ereignisse", () => {
  test("jede Vorlage hat Titel, Text, Antworten und eine Standardfolge ohne kaputte Texte", () => {
    const w = neu();
    const mk = machtkreis(w);
    const ps = personen(w);
    const reg = ps.filter((p) => p.art === "amt" && p.rolle !== "opposition" && p.rolle !== "zentralbank" && p.rolle !== "partner");
    const a = reg[0]!;
    const b = reg[1]!;
    mk.geheimnisse.push({ id: "g-x", person: a.schluessel, art: "putschzirkel", schwere: 3, aufgedeckt: true, oeffentlich: false, seit: 0 });
    const kp = nebenVon(w, "kronprinz")!;
    const j = nebenVon(w, "journalist")!;
    for (const v of MACHTKREIS_VORLAGEN) {
      const ev = { id: `e-${v.id}`, vorlage: v.id, tag: w.day, frist: w.day + v.frist, provinzen: [], staerke: 1, daten: { a: v.id === "kreis_nachfolge" || v.id === "kreis_parteitag" ? schluesselVon(kp) : a.schluessel, b: b.schluessel, g: "g-x", j: schluesselVon(j) } } as never;
      const texte = [v.titel(w, ev), ...v.text(w, ev), v.warum(w, ev)];
      for (const x of texte) expect(x, v.id).not.toMatch(KAPUTT);
      const opts = v.optionen(w, ev);
      expect(opts.length, v.id).toBeGreaterThanOrEqual(2);
      for (const o of opts) {
        expect(o.label).not.toMatch(KAPUTT);
        expect(o.beschreibung).not.toMatch(KAPUTT);
      }
      const kopie = load(save(w));
      expect(v.standard(kopie, ev, new Rng(3))).not.toMatch(KAPUTT);
      expect(opts[0]!.wirkung(kopie, ev, new Rng(3))).not.toMatch(KAPUTT);
    }
  });

  test("ein Jahrzehnt ohne Ausnahmen, Ereignisse treten auf, aber nicht ständig", () => {
    const w = neu(7);
    let anzahl = 0;
    const gesehen = new Set<string>();
    for (let tag = 0; tag < 3650 && !w.spiel!.ende; tag += 30) {
      advance(w, 30);
      for (const e of w.spiel!.ereignisse) if (e.vorlage.startsWith("kreis_") && !gesehen.has(e.id)) {
        gesehen.add(e.id);
        anzahl++;
      }
      w.spiel!.ereignisse = w.spiel!.ereignisse.filter((e) => !e.vorlage.startsWith("kreis_"));
    }
    expect(anzahl).toBeLessThan(40);
  });
});

describe("Kataloge und Ansicht", () => {
  test("gleiche Schlüssel in drei Sprachen", () => {
    expect(Object.keys(tr).sort()).toEqual(Object.keys(de).sort());
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
  });

  test("Ansicht rendert in DE, TR und EN ohne kaputte Texte", async () => {
    const w = neu();
    const kp = nebenVon(w, "kronprinz")!;
    zieheHebel(w, schluesselVon(kp), "deal");
    for (const s of ["de", "tr", "en"] as const) {
      await ladeSprache(s);
      await setzeSprache(s);
      const html = renderToStaticMarkup(createElement(Machtkreis, { world: w }));
      expect(html, s).toContain("mk-netz");
      expect(html, s).not.toMatch(KAPUTT);
      if (s !== "de") expect(html, s).not.toMatch(/Loyalität|Beziehungen|Kapital\b/);
    }
  });
});
