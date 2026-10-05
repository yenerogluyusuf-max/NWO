// Sofort-Reparaturen Welle 2 (SPIEL_DURCHDACHT_2026-10-05.md, Abschnitt 4): Katastrophen schließen nach klaren Regeln.
// Vorher blieb jeder Fall ohne Wohnungsbau-Programm für immer offen (Deckel der privaten Erholung 25 % gegen Schwelle 95 %);
// betroffen waren alle Fluten, Dürren, Waldbrände und Beben unter 1.000 Wohnungen. Dazu: Zusage nur, wenn ein Programm sie einlösen kann.

import { existsSync, readFileSync } from "node:fs";
import { formatiere, platzhalter } from "../src/i18n";
import { homedir } from "node:os";
import { describe, expect, test } from "vitest";
import { advance, createWorld, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { Rng } from "../src/sim/rng";
import { NET } from "../src/sim/modell";
import { PROVINCES } from "../src/sim/netz";
import { oeffne, vorlage } from "../src/sim/ereignisse";
import { reichZustand } from "../src/sim/reich";
import {
  KATASTROPHE,
  abschlussPruefen,
  fallMit,
  hilfsketteSicht,
  katastropheMonat,
  katastrophenZustand,
  programmMoeglich,
  versprechensLage,
  zusageFestlegen,
} from "../src/sim/katastrophe";
import type { World } from "../src/sim/types";
import type { KatastropheFall, KatastrophenArt } from "../src/sim/spiel-typen";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  // Die Prüfungen laufen über fünf Jahre: kein Wahltag und kein Sturz dazwischen
  w.spiel!.wahltag = w.day + 10_000;
  return w;
}

function fallVon(w: World, art: KatastrophenArt, wohnungen: number, provinzen = [46, 31], extra: Partial<KatastropheFall> = {}): KatastropheFall {
  const z = katastrophenZustand(w);
  const fall: KatastropheFall = {
    id: `kat-${art}-t${z.faelle.length}`,
    art,
    provinzen,
    tag: w.day,
    datum: w.date,
    staerke: 0.7,
    tote: 10,
    verletzte: 30,
    obdachlos: 100,
    wohnungen,
    bereitschaft: 45,
    verhindert: { tote: 0, wohnungen: 0 },
    hilfe: { soforthilfe: true },
    privatGeliefert: 0,
    ...extra,
  };
  z.faelle.push(fall);
  return fall;
}

/** Monatsweise vorrücken (nur das Katastrophen-Modul, ohne dass Ereignisse dazwischenfunken). */
function monate(w: World, n: number, rng = new Rng(1)): void {
  for (let i = 0; i < n; i++) {
    advance(w, 30);
    w.spiel!.ereignisse = [];
    w.spiel!.umfrage.zustimmung = 55;
    if (w.spiel!.ende) break;
  }
  void rng;
}

describe("Abschluss kleiner Fälle (vorher: nie)", () => {
  test("Ein Waldbrand mit wenigen Wohnungen schließt spätestens nach der Frist", () => {
    const w = welt();
    const fall = fallVon(w, "waldbrand", 40, [7]);
    monate(w, 11);
    expect(fallMit(w, fall.id)!.bewaeltigt, "nach elf Monaten noch offen").toBeUndefined();
    monate(w, 3);
    expect(fallMit(w, fall.id)!.bewaeltigt).toBeDefined();
    expect(w.spiel!.chronik.some((c) => /Großbrand/.test(c.titel))).toBe(true);
  });

  test("Eine kleine Flut unter der Programmgrenze erholt sich vor Ort und schließt innerhalb der Frist", () => {
    const w = welt();
    const fall = fallVon(w, "flut", 600, [61]);
    expect(programmMoeglich(fall)).toBe(false);
    monate(w, KATASTROPHE.fristMonate.flut + 1);
    const f = fallMit(w, fall.id)!;
    expect(f.bewaeltigt).toBeDefined();
    // Die Erholung vor Ort ist nicht mehr gedeckelt: Sie hat den Bedarf (fast) gedeckt oder die Frist hat gegriffen
    expect(f.privatGeliefert).toBeGreaterThan(600 * 0.25);
  });

  test("Eine Dürre schließt frühestens nach der Mindestdauer und spätestens nach der Frist", () => {
    const w = welt();
    const fall = fallVon(w, "duerre", 0, [42, 68]);
    monate(w, KATASTROPHE.duerreMindestMonate - 1);
    expect(fallMit(w, fall.id)!.bewaeltigt).toBeUndefined();
    monate(w, KATASTROPHE.fristMonate.duerre - KATASTROPHE.duerreMindestMonate + 2);
    expect(fallMit(w, fall.id)!.bewaeltigt).toBeDefined();
  });

  test("Eine Dürre mit unverändert hohem Wassermangel läuft bis zur Frist, eine abgeklungene schließt früher", () => {
    const hoch = welt();
    const fall = fallVon(hoch, "duerre", 0, [42]);
    const i = NET.index.get("p_wassermangel")! * PROVINCES + 41;
    for (let m = 0; m < KATASTROPHE.fristMonate.duerre - 1; m++) {
      hoch.net.values[i] = 95; // der Wassermangel klingt nicht ab
      advance(hoch, 30);
      hoch.spiel!.ereignisse = [];
    }
    expect(fallMit(hoch, fall.id)!.bewaeltigt, "bei hohem Wassermangel nicht vor der Frist").toBeUndefined();
    hoch.net.values[i] = 95;
    monate(hoch, 3); // Der Monatsschritt fällt auf den Monatsersten: etwas Spielraum nach der Frist
    expect(fallMit(hoch, fall.id)!.bewaeltigt).toBeDefined();

    // Liegt der Wassermangel an der Ruhelage, schließt die Dürre nach der Mindestdauer
    const ruhig = welt();
    const f2 = fallVon(ruhig, "duerre", 0, [42]);
    ruhig.net.values[i] = ruhig.net.start[i]!;
    monate(ruhig, KATASTROPHE.duerreMindestMonate + 1);
    expect(fallMit(ruhig, f2.id)!.bewaeltigt).toBeDefined();
  });
});

describe("Große Fälle: Programm, Zusage, Frist", () => {
  test("Ein großes Beben ohne Staatsprogramm bleibt akut und schließt erst nach der Frist; das Versprechen bleibt gemessen", () => {
    const w = welt();
    const fall = fallVon(w, "erdbeben", 42_000);
    fall.zusage = { wohnungen: 42_000, geliefert: 0 };
    monate(w, KATASTROPHE.fristMonate.erdbeben - 2);
    expect(fallMit(w, fall.id)!.bewaeltigt, "vor der Frist offen").toBeUndefined();
    monate(w, 4);
    const f = fallMit(w, fall.id)!;
    expect(f.bewaeltigt).toBeDefined();
    // Die Versprechensschuld bleibt auch nach dem Abschluss bestehen
    const zeile = versprechensLage(w).find((z) => z.fallId === fall.id)!;
    expect(zeile.quote).toBeLessThan(0.5);
    expect(w.log.some((l) => /akute Lage ist abgeklungen/.test(l.text))).toBe(true);
  });

  test("Ein Programm ohne öffentliche Zusage schließt nach der Lieferung (vorher: nie)", () => {
    const w = welt();
    const fall = fallVon(w, "erdbeben", 20_000);
    fall.wohnbau = { id: "kat_wohnbau_ohne_zusage", bedarf: 20_000, bau: 100, monate: 12, schulden: 0.1, vergabe: "stammfirma" };
    const reich = reichZustand(w);
    // Läuft das Programm noch, schließt nichts
    reich.laufend.push({ id: fall.wohnbau.id, fortschritt: 10, start: w.date });
    expect(abschlussPruefen(w, fall)).toBeNull();
    // Fertig gestellt, ohne dass es je eine Zusage gab
    reich.laufend = reich.laufend.filter((l) => l.id !== fall.wohnbau!.id);
    reich.bestand[fall.wohnbau.id] = { seit: w.date, zustand: 90 };
    expect(abschlussPruefen(w, fall)).toBe("geliefert");
    katastropheMonat(w, new Rng(1));
    expect(fallMit(w, fall.id)!.bewaeltigt).toBeDefined();
  });

  test("Die Übergangsversorgung hält einen sonst fälligen Abschluss zurück", () => {
    const w = welt();
    const fall = fallVon(w, "waldbrand", 40, [7], { hilfe: { soforthilfe: true, uebergangBis: w.day + 400 } });
    monate(w, 13);
    expect(fallMit(w, fall.id)!.bewaeltigt).toBeUndefined();
    monate(w, 3);
    expect(fallMit(w, fall.id)!.bewaeltigt).toBeDefined();
  });
});

describe("Zusage nur, wenn ein Programm sie einlösen kann", () => {
  test("Ein Beben unter 1.000 Wohnungen bietet kein Versprechen an und die Zusage wird verweigert", () => {
    const w = welt();
    const fall = fallVon(w, "erdbeben", 700);
    expect(programmMoeglich(fall)).toBe(false);
    const text = zusageFestlegen(w, fall.id, "voll");
    expect(text).toMatch(/Wohnungsbau-Programm/);
    expect(fall.zusage).toBeUndefined();
  });

  test("Die Ereignisantworten enthalten das Versprechen erst ab 1.000 Wohnungen", () => {
    const rng = new Rng(2);
    const klein = welt();
    const kleinFall = fallVon(klein, "erdbeben", 800);
    const evKlein = oeffne(klein, "grossbeben", rng, { provinzen: kleinFall.provinzen, staerke: 0.7, daten: { fall: kleinFall.id } })!;
    const idsKlein = vorlage("grossbeben")!.optionen(klein, evKlein).map((o) => o.id);
    expect(idsKlein).toContain("soforthilfe");
    expect(idsKlein.some((id) => id.startsWith("versprechen_"))).toBe(false);

    const gross = welt();
    const grossFall = fallVon(gross, "erdbeben", 5_000);
    const evGross = oeffne(gross, "grossbeben", rng, { provinzen: grossFall.provinzen, staerke: 0.7, daten: { fall: grossFall.id } })!;
    const idsGross = vorlage("grossbeben")!.optionen(gross, evGross).map((o) => o.id);
    expect(idsGross).toEqual(expect.arrayContaining(["versprechen_klein", "versprechen_voll", "versprechen_gross"]));
  });
});

describe("Kette und Zähler", () => {
  test("Die Kette nennt für jede Art, wann sie als bewältigt gilt (auch Dürre und Brand ohne Wohnbestand)", () => {
    const w = welt();
    const duerre = fallVon(w, "duerre", 0, [42]);
    const k = hilfsketteSicht(w, duerre);
    const schritt = k.find((s) => s.id === "bewaeltigt")!;
    expect(schritt.status).toBe("offen");
    expect(schritt.detail).toMatch(/Monat/);
    monate(w, KATASTROPHE.fristMonate.duerre + 1);
    expect(hilfsketteSicht(w, fallMit(w, duerre.id)!).find((s) => s.id === "bewaeltigt")!.status).toBe("erledigt");
  });

  test("Offene Fälle werden weniger: der Zähler sinkt, wenn Fälle schließen", () => {
    const w = welt();
    fallVon(w, "waldbrand", 30, [7]);
    fallVon(w, "duerre", 0, [42]);
    const eigene = katastrophenZustand(w).faelle.map((f) => f.id);
    const offen = () => katastrophenZustand(w).faelle.filter((f) => eigene.includes(f.id) && !f.bewaeltigt).length;
    expect(offen()).toBe(2);
    monate(w, KATASTROPHE.fristMonate.duerre + 1);
    expect(offen()).toBe(0);
  });
});

describe("Alte Spielstände", () => {
  const datei = `${homedir()}/Downloads/staatsraeson_2029-11-20.json`;

  test.skipIf(!existsSync(datei))("Der Stand vom 20.11.2029 lädt (Datei nur gelesen); offene Fälle schließen nach den neuen Regeln", () => {
    const d = JSON.parse(readFileSync(datei, "utf8")) as { welt: unknown };
    const w = load(JSON.stringify(d.welt));
    // Ein künstlich eingefügter alter Fall im Zustand von früher: Zusage unter der Programmgrenze, ohne Programm, ohne neue Felder
    const alt = fallVon(w, "erdbeben", 700, [31], { zusage: { wohnungen: 1_000, geliefert: 0 }, privatGeliefert: 100 });
    for (let i = 0; i < KATASTROPHE.fristMonate.erdbeben + 2; i++) {
      advance(w, 30);
      w.spiel!.ereignisse = [];
      if (w.spiel!.ende) break;
    }
    expect(fallMit(w, alt.id)!.bewaeltigt).toBeDefined();
    for (const f of w.spiel!.katastrophen?.faelle ?? []) {
      expect(Number.isFinite(f.privatGeliefert)).toBe(true);
    }
  });
});

describe("Texte dieser Reparatur in drei Sprachen", () => {
  const lade = (sprache: string) =>
    JSON.parse(readFileSync(new URL(`../src/i18n/katalog/${sprache}/katastrophe.json`, import.meta.url), "utf8")) as Record<string, string>;
  const de = lade("de");

  test("Türkisch und Englisch haben jeden Schlüssel mit denselben Platzhaltern wie Deutsch", () => {
    for (const sprache of ["tr", "en"] as const) {
      const t = lade(sprache);
      expect(Object.keys(t).sort(), sprache).toEqual(Object.keys(de).sort());
      for (const [k, v] of Object.entries(t)) expect(platzhalter(v), `${sprache}:${k}`).toEqual(platzhalter(de[k]!));
    }
  });

  test("Alle Vorlagen lassen sich in allen Sprachen mit Beispielwerten formatieren", () => {
    const werte = { art: "Dürre", ort: "Konya", monate: 18, geliefert: 12_000, bedarf: 42_000, frist: 24, min: 6 };
    for (const sprache of ["de", "tr", "en"] as const) {
      for (const [k, v] of Object.entries(lade(sprache))) {
        const text = formatiere(v, werte, sprache);
        expect(text.length, `${sprache}:${k}`).toBeGreaterThan(5);
        expect(text, `${sprache}:${k}`).not.toMatch(/\{[a-z]+\}/);
      }
    }
  });
});
