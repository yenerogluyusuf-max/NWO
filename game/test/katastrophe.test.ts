// Katastrophen-Modul (INF-5): Risiko-Layer mit deterministischem Auslöser je Zone, Bereitschaft
// als schadenssenkende Größe, Krisen-Kopplung (Katastrophenlage), Hilfskette, Versprechensschuld
// (Anlage, Fortschritt, Bilanz- und Wahl-Malus), Baukapazität-Wettbewerb des Wiederaufbaus,
// Migration und Determinismus über volle Ticks.

import { describe, expect, test } from "vitest";
import { createWorld, advance, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { Rng } from "../src/sim/rng";
import { provinceValue, nationalAverage, PROVINCES } from "../src/sim/netz";
import { NET } from "../src/sim/modell";
import { wirke } from "../src/sim/wirkung";
import { bringeEin } from "../src/sim/handeln";
import { entscheide, oeffne } from "../src/sim/ereignisse";
import { aktiveKrisen, krisenAktualisieren, krisenFuerMassnahme } from "../src/sim/krisen";
import {
  ZONEN,
  bereitschaft,
  beginneWiederaufbau,
  depremRisiko,
  fallMit,
  katastropheMonat,
  katastrophenZustand,
  loeseAus,
  monatsWurf,
  nebelStufe,
  schadenBerechnen,
  starteUebergang,
  versprechensschuldMalus,
  versprechensLage,
  zusageFestlegen,
  KATASTROPHE,
} from "../src/sim/katastrophe";
import { bauplan, beginne, registriereVorhaben, vorhabenDef, warteschlange } from "../src/sim/reich";
import type { World } from "../src/sim/types";
import type { KatastropheFall } from "../src/sim/spiel-typen";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  return w;
}

/** Ein großer, sauber definierter Erdbeben-Fall für Ketten- und Schuld-Tests. */
function testFall(w: World, wohnungen = 42_000): KatastropheFall {
  const z = katastrophenZustand(w);
  const fall: KatastropheFall = {
    id: `kat-erdbeben-test-${z.faelle.length}`,
    art: "erdbeben",
    provinzen: [46, 31],
    tag: w.day,
    datum: w.date,
    staerke: 0.9,
    tote: 9_000,
    verletzte: 28_000,
    obdachlos: 135_000,
    wohnungen,
    bereitschaft: 45,
    verhindert: { tote: 400, wohnungen: 1_800 },
    hilfe: { soforthilfe: true },
    privatGeliefert: 0,
  };
  z.faelle.push(fall);
  return fall;
}

const idx = (id: string) => NET.index.get(id)!;

describe("Katastrophen: Risiko-Layer und Auslöser", () => {
  test("Auslöser ist deterministisch je Zone und Monat", () => {
    // Gleicher Wurf bei gleichen Argumenten; die Zonen würfeln getrennte Reihen
    expect(monatsWurf(1, "beben|kaf", "2028-10")).toBe(monatsWurf(1, "beben|kaf", "2028-10"));
    expect(monatsWurf(1, "beben|kaf", "2028-10")).not.toBe(monatsWurf(1, "beben|daf", "2028-10"));
    // Seed 1: Die Nordanatolische Verwerfung schlägt im Oktober 2028 zu, sonst bleibt es ruhig
    expect(monatsWurf(1, "beben|kaf", "2028-10")).toBeLessThan(KATASTROPHE.bebenChance.kaf);
    expect(monatsWurf(6, "beben|kaf", "2028-10")).toBeGreaterThan(KATASTROPHE.bebenChance.kaf);
  });

  test("das Erdbeben-Risiko je Provinz kommt aus dem Profil (1–5)", () => {
    const werte = new Set(Array.from({ length: PROVINCES }, (_, p) => depremRisiko(p + 1)));
    expect([...werte].sort()).toEqual([2, 3, 4, 5]);
    // Die Bruchzonen tragen das hohe Risiko; Istanbul ist hoch gefährdet
    expect(depremRisiko(34)).toBeGreaterThanOrEqual(4);
    expect(ZONEN.daf.every((p) => depremRisiko(p) >= 1)).toBe(true);
  });

  test("Seed 1 löst im Oktober 2028 ein Großbeben auf der Nordanatolischen Verwerfung aus (Auto-Stopp A)", () => {
    const w = welt(1);
    advance(w, 87); // 01.09.2028: noch Ruhe
    expect(katastrophenZustand(w).faelle).toHaveLength(0);
    advance(w, 31); // 01.10.2028: Monatswurf der Zone kaf
    const z = katastrophenZustand(w);
    expect(z.faelle).toHaveLength(1);
    const fall = z.faelle[0]!;
    expect(fall.art).toBe("erdbeben");
    expect(fall.provinzen.every((p) => ZONEN.kaf.includes(p))).toBe(true);
    expect(fall.tote).toBeGreaterThan(0);
    // Die Entscheidungslage liegt auf dem Tisch (Klasse A: das Spiel hält an)
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "grossbeben")).toBe(true);
  });

  test("das Epizentrum folgt Risiko² × Einwohner (deterministisch gewichtet)", () => {
    const w = welt(6);
    let hoch = 0;
    for (let i = 0; i < 20; i++) {
      const fall = loeseAus(w, new Rng(100 + i), { art: "erdbeben", zone: "daf", provinzen: [] });
      if (fall && depremRisiko(fall.provinzen[0]!) >= 4) hoch++;
    }
    expect(hoch).toBeGreaterThanOrEqual(10);
  });
});

describe("Katastrophen: Bereitschaft senkt den Schaden", () => {
  test("höhere Bereitschaft drückt Opferzahlen und zeigt in der Nachbetrachtung, was sie verhindert hat", () => {
    const w = welt(6);
    const tief = schadenBerechnen(w, "erdbeben", [46, 31], 0.9);
    expect(Math.round(bereitschaft(w))).toBe(45);
    wirke(w, "katastrophenschutz", 35); // 45 → 80
    const hoch = schadenBerechnen(w, "erdbeben", [46, 31], 0.9);
    expect(hoch.tote).toBeLessThan(tief.tote);
    expect(hoch.wohnungen).toBeLessThan(tief.wohnungen);
    expect(hoch.verhindert.tote).toBeGreaterThan(tief.verhindert.tote);
    expect(hoch.verhindert.tote).toBeGreaterThan(0);
    // Größenordnung bleibt respektvoll und realistisch (Volltreffer in zwei Kernprovinzen 2023: fünfstellig)
    const voll = schadenBerechnen(w, "erdbeben", [46, 31], 1.0);
    expect(voll.tote).toBeGreaterThan(1_000);
    expect(voll.tote).toBeLessThan(30_000);
  });

  test("die Bereitschaft wächst über die Maßnahmen des Netzes", () => {
    const w = welt(6);
    const vorher = nationalAverage(NET, w.net, "katastrophenschutz");
    wirke(w, "m_afad_ausbau", 20);
    advance(w, 450); // Nach Ablauf der Wirkungsverzögerung (13+ Monate)
    expect(nationalAverage(NET, w.net, "katastrophenschutz")).toBeGreaterThan(vorher);
  });
});

describe("Katastrophen: Ereignis und Krisen-Kopplung", () => {
  test("Großbeben öffnet die Katastrophenlage; nur Versorgung bleibt unverteuert", () => {
    const w = welt(6);
    loeseAus(w, new Rng(5), { art: "erdbeben", zone: "daf", provinzen: [] });
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "grossbeben")).toBe(true);
    krisenAktualisieren(w);
    expect(aktiveKrisen(w).map((k) => k.id)).toContain("katastrophenlage");
    // AFAD-Ausbau und Frühwarnsystem (Thema Sicherheit) gehören zur Versorgung: kein Malus
    expect(krisenFuerMassnahme(w, "m_afad_ausbau")).toHaveLength(0);
    expect(krisenFuerMassnahme(w, "m_fruehwarnsystem")).toHaveLength(0);
    // Prestige (Kultur) ist gesperrt, der Rest teurer
    expect(krisenFuerMassnahme(w, "m_denkmalschutz").some((k) => k.art === "gesperrt")).toBe(true);
    expect(krisenFuerMassnahme(w, "m_verteidigung").some((k) => k.art === "teuer")).toBe(true);
  });

  test("Antwort „volles Versprechen“: Soforthilfe läuft, die Zusage ist angelegt", () => {
    const w = welt(6);
    const fall = testFall(w);
    const ev = oeffne(w, "grossbeben", new Rng(9), { provinzen: fall.provinzen, staerke: fall.staerke, daten: { fall: fall.id } })!;
    const r = entscheide(w, ev.id, "versprechen_voll", new Rng(9));
    expect(r.ok, r.text).toBe(true);
    const f = fallMit(w, fall.id)!;
    expect(f.hilfe.soforthilfe).toBe(true);
    expect(f.zusage).toBeDefined();
    // Vollversprechen ≈ zerstörter Bestand (auf 500 gerundet)
    expect(Math.abs(f.zusage!.wohnungen - f.wohnungen)).toBeLessThanOrEqual(500);
    // Das Ereignis ist entschieden
    expect(w.spiel!.ereignisse.some((e) => e.id === ev.id)).toBe(false);
  });

  test("wer die Ursache selbst regelt (AFAD-Ausbau-Gesetz), nimmt dem Ereignis die Schärfe", () => {
    const w = welt(6);
    loeseAus(w, new Rng(5), { art: "erdbeben", zone: "daf", provinzen: [] });
    w.spiel!.kapital = 120;
    const r = bringeEin(w, "m_afad_ausbau", 60, null, "gesetz");
    expect(r.ok, r.text).toBe(true);
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "grossbeben")).toBe(false);
    expect(w.spiel!.chronik.some((c) => c.ausgang.includes("Selbst an der Ursache"))).toBe(true);
  });
});

describe("Katastrophen: Hilfskette und Wiederaufbau", () => {
  test("Übergangsversorgung kostet monatlich, das Wohnungsbau-Programm liefert Wohnungen", () => {
    const w = welt(6);
    const fall = testFall(w);
    zusageFestlegen(w, fall.id, "voll");
    const uebergang = starteUebergang(w, fall.id);
    expect(uebergang.ok, uebergang.text).toBe(true);

    // Monatskosten der Übergangsversorgung
    const schuldenVorher = w.economy.debtRatio;
    katastropheMonat(w, new Rng(3));
    expect(w.economy.debtRatio - schuldenVorher).toBeCloseTo(KATASTROPHE.uebergangKosten * fall.staerke, 6);

    // Wohnungsbau-Programm beginnen (Stammfirma: ohne Vergabevorlauf)
    w.spiel!.kapital = 120;
    const bau = beginneWiederaufbau(w, fall.id, "stammfirma");
    expect(bau.ok, bau.text).toBe(true);
    expect(fall.wohnbau).toBeDefined();
    expect(w.spiel!.reich!.laufend.some((l) => l.id === fall.wohnbau!.id)).toBe(true);

    // Drei Monate Bauzeit: gelieferte Wohnungen wachsen über den Fortschritt des Vorhabens
    advance(w, 95);
    const f = fallMit(w, fall.id)!;
    expect(f.zusage!.geliefert).toBeGreaterThan(0);
    expect(f.zusage!.geliefert).toBeLessThan(f.zusage!.wohnungen);
  });

  test("Wiederaufbau konkurriert um die Baukapazität und verdrängt andere Vorhaben", () => {
    const w = welt(6);
    // Ein großes anderes Bauvorhaben belegt die Kapazität zuerst
    registriereVorhaben({
      id: "test_bau_inf5",
      bereich: "infrastruktur",
      klasse: "grossprojekt",
      name: "Testachse",
      text: "Testvorhaben für den Kapazitätswettbewerb.",
      voraus: [],
      kosten: { pk: 0, bau: 6000, monate: 40 },
      abschluss: [],
      kehrseite: "Test.",
    });
    const gestartet = beginne(w, "test_bau_inf5", "stammfirma");
    expect(gestartet.ok, gestartet.text).toBe(true);
    const rateVorher = bauplan(w)["test_bau_inf5"]!;

    // Der Wiederaufbau beginnt — und steht fortan vorn in der Baureihenfolge
    const fall = testFall(w);
    w.spiel!.kapital = 120;
    const bau = beginneWiederaufbau(w, fall.id, "stammfirma");
    expect(bau.ok, bau.text).toBe(true);
    const rateNachher = bauplan(w)["test_bau_inf5"]!;
    const rateWohnbau = bauplan(w)[fall.wohnbau!.id]!;
    expect(rateWohnbau).toBeGreaterThan(0);
    expect(rateNachher).toBeLessThan(rateVorher);
    expect(rateVorher - rateNachher).toBeCloseTo(rateWohnbau, 6);
    // Die öffentliche Baureihenfolge zeigt die Verdrängung
    const schlange = warteschlange(w);
    expect(schlange.find((e) => e.id === fall.wohnbau!.id)!.position).toBe(1);
    expect(schlange.find((e) => e.id === "test_bau_inf5")!.position).toBe(2);
  });

  test("der Nebel der ersten Tage: unsicher, vermutet, bekannt", () => {
    const w = welt(6);
    const fall = loeseAus(w, new Rng(5), { art: "erdbeben", zone: "daf", provinzen: [] })!;
    expect(nebelStufe(w, fall)).toBe("unsicher");
    advance(w, 3);
    expect(nebelStufe(w, fall)).toBe("vermutet");
    advance(w, 4);
    expect(nebelStufe(w, fall)).toBe("bekannt");
  });

  test("Migration: die Region leert sich, die Metropolen spüren Druck", () => {
    const w = welt(6);
    const fluchtVorher = Array.from({ length: PROVINCES }, (_, p) => provinceValue(NET, w.net, "landflucht", p + 1));
    const notVorher = provinceValue(NET, w.net, "p_wohnungsnot", 34);
    const fall = loeseAus(w, new Rng(5), { art: "erdbeben", zone: "daf", provinzen: [] })!;
    expect(fall.wohnungen).toBeGreaterThan(0);
    expect(provinceValue(NET, w.net, "landflucht", fall.provinzen[0]!)).toBeGreaterThan(fluchtVorher[fall.provinzen[0]! - 1]!);
    expect(provinceValue(NET, w.net, "p_wohnungsnot", 34)).toBeGreaterThan(notVorher);
  });
});

describe("Katastrophen: Versprechensschuld", () => {
  test("Anlage, Fortschritt und Bilanz-Malus bei Unwucht", () => {
    const w = welt(6);
    const fall = testFall(w);
    zusageFestlegen(w, fall.id, "voll");
    expect(fall.zusage!.wohnungen).toBe(42_000);

    // Frisch versprochen: noch kein Malus (Gnadenfrist)
    expect(versprechensschuldMalus(w).punkte).toBe(0);

    // Ein halbes Jahr später, kaum geliefert: die Schuld drückt spürbar
    fall.tag = w.day - 200;
    fall.zusage!.geliefert = 5_000;
    const malus = versprechensschuldMalus(w);
    expect(malus.punkte).toBeGreaterThan(3);
    expect(malus.text).toContain("5.000 von 42.000");

    // Geliefert, was versprochen war: kein Malus
    fall.zusage!.geliefert = 42_000;
    expect(versprechensschuldMalus(w).punkte).toBe(0);

    // Die Lage-Tabelle zeigt geliefert X von Y
    const zeilen = versprechensLage(w);
    expect(zeilen).toHaveLength(1);
    expect(zeilen[0]!.quote).toBe(1);
  });

  test("die Unwucht kostet am Wahltag Stimmen (Wahl-Malus)", () => {
    const w = welt(6);
    const kopie = load(save(w)); // identische Ausgangslage, identischer Zufallszustand
    const fall = testFall(w);
    zusageFestlegen(w, fall.id, "voll");
    fall.tag = w.day - 200; // lange genug her, kaum geliefert
    const schuld = versprechensschuldMalus(w).punkte;
    expect(schuld).toBeGreaterThan(1);

    // Beide Welten gehen mit derselben Zustimmung in die Wahl — nur eine trägt die Schuld
    for (const x of [w, kopie]) {
      x.spiel!.umfrage.zustimmung = 45;
      x.spiel!.wahltag = x.day;
      advance(x, 2);
    }
    expect(w.spiel!.ende?.art).toBe("abwahl");
    expect(kopie.spiel!.ende?.art).toBe("abwahl");
    const differenz = kopie.spiel!.ende!.anteil! - w.spiel!.ende!.anteil!;
    expect(differenz).toBeCloseTo(schuld, 1);
    expect(w.spiel!.chronik.some((c) => c.titel.includes("Versprechensschuld"))).toBe(true);
  });
});

describe("Katastrophen: Determinismus und Spielstände", () => {
  test("zwei Partien mit demselben Seed erleben dieselbe Katastrophe", () => {
    const a = welt(1);
    const b = welt(1);
    advance(a, 120);
    advance(b, 120);
    expect(JSON.stringify(a.spiel!.katastrophen)).toBe(JSON.stringify(b.spiel!.katastrophen));
    expect(katastrophenZustand(a).faelle).toHaveLength(1);
  });

  test("ein Spielstand lädt und meldet das dynamische Wohnbau-Vorhaben erneut an", () => {
    const w = welt(6);
    const fall = testFall(w);
    w.spiel!.kapital = 120;
    expect(beginneWiederaufbau(w, fall.id, "stammfirma").ok).toBe(true);
    const geladen = load(save(w));
    // Nach dem Laden kennt das Reich das dynamische Vorhaben wieder, und der Bau läuft weiter
    expect(vorhabenDef(fall.wohnbau!.id)).toBeDefined();
    expect(geladen.spiel!.reich!.laufend.some((l) => l.id === fall.wohnbau!.id)).toBe(true);
    expect(katastrophenZustand(geladen).faelle).toHaveLength(1);
    advance(geladen, 62);
    expect(fallMit(geladen, fall.id)!.zusage).toBeUndefined(); // ohne Zusage keine Schuld — aber der Fortschritt läuft
    expect(bauplan(geladen)[fall.wohnbau!.id]).toBeGreaterThan(0);
  });
});
