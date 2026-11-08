// Welle 3, K5 (krieg.md Schritte 8 und 9, Befunde A4, A6, C5, C6, C8): Besatzung als Verwaltung und Annexion mit Folgen.
// Abnahme laut krieg.md: Die Annexion von Asas verändert Einwohnerzahl, Haushalt und Außenlage messbar; der Spieler sieht die Folgen vorher;
// ein späterer Krieg mit Syrien beginnt mit Asas als türkischer Region. Dazu: jede Form hat eine eigene Kurve über drei Jahre, die
// Stellvertreterverwaltung kann einen Skandal auslösen, die Vorschau ist die Buchung, alte Spielstände laden, der Lauf ist deterministisch.

import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { kriegMonat } from "../src/sim/krieg";
import { regionenSetzen } from "../src/sim/kriegsschauplatz";
import {
  aendereBesatzung,
  besatzung,
  besatzungAnlegen,
  besatzungHaushalt,
  besatzungMonat,
  besatzungNachFrieden,
  besatzungsSicht,
  formKurve,
  migriereBesatzung,
  monatsWerte,
} from "../src/sim/besatzung";
import { annexionVorschau, annexionen, annexionsLast, gvAbstimmung } from "../src/sim/annexion";
import { aktiveProvinzen, einwohnerTuerkei, sitzPlan, staatAnnektiert, TR_EINWOHNER } from "../src/sim/provinzen-neu";
import { parlamentswahl } from "../src/sim/wahl";
import { FORMEN, FORM, RUECKKEHR_MAX } from "../src/data/besatzung";
import { IWF_BAND, SANKTIONS_STUFEN, SITZE_GESAMT } from "../src/data/annexion";
import { REGION_NACH_ID } from "../src/data/schauplaetze";
import { VORLAGEN, antworten, oeffne } from "../src/sim/ereignisse";
import { SKANDAL } from "../src/sim/ereignisse-besatzung";
import { weltZustand } from "../src/sim/laender";
import { bipWertMrd } from "../src/sim/staatsgeld";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { Rng } from "../src/sim/rng";
import type { KriegVorgang } from "../src/sim/krieg-typen";
import type { World } from "../src/sim/types";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 200;
  return w;
}

/** Asas als Sicherheitszone nach einem Frieden (wie im Lauf K3: Syrien frisch, Frieden entlang der Linie). */
function mitAsas(seed = 6): World {
  const w = welt(seed);
  besatzungAnlegen(w, { region: "syr_asas", land: "SYR" });
  return w;
}

const ansehen = (w: World) => nationalAverage(NET, w.net, "ansehen");

describe("Schritt 8: fünf Formen, jede mit eigener Kurve", () => {
  test("drei Jahre: Kosten, Widerstand, Ansehen und Rückkehr unterscheiden sich je Form", () => {
    const w = mitAsas();
    const ende = Object.fromEntries(FORMEN.map((f) => [f, formKurve(w, "syr_asas", f).at(-1)!]));
    for (const f of FORMEN) expect(formKurve(w, "syr_asas", f)).toHaveLength(37);
    // Jede Form unterscheidet sich von jeder anderen in mindestens einer Größe
    for (const a of FORMEN) for (const b of FORMEN) {
      if (a === b) continue;
      const x = ende[a]!, y = ende[b]!;
      expect(Math.abs(x.kosten - y.kosten) + Math.abs(x.widerstand - y.widerstand) + Math.abs(x.ansehen - y.ansehen) + Math.abs(x.rueckkehr - y.rueckkehr) / 1e5, `${a} gegen ${b}`).toBeGreaterThan(0.05);
    }
    // Richtungen nach den Vorbildern
    expect(ende.zivil!.widerstand).toBeLessThan(ende.zone!.widerstand);
    expect(ende.zivil!.kosten).toBeGreaterThan(ende.zone!.kosten);
    expect(ende.satellit!.kosten).toBeGreaterThan(ende.zivil!.kosten);
    expect(ende.annexion!.ansehen).toBeLessThan(Math.min(ende.zone!.ansehen, ende.zivil!.ansehen, ende.satellit!.ansehen));
    expect(ende.zivil!.rueckkehr).toBeGreaterThan(ende.zone!.rueckkehr);
    expect(ende.annexion!.einnahmen).toBeGreaterThan(0);
    for (const f of ["zone", "zivil", "satellit"] as const) expect(ende[f]!.einnahmen).toBe(0);
  });

  test("die Kurve ist die Buchung: ein Monat Zivilverwaltung wie vorhergesagt", () => {
    const w = mitAsas();
    expect(aendereBesatzung(w, "syr_asas", "zivil").ok).toBe(true);
    const kurve = formKurve(w, "syr_asas", "zivil");
    const vorher = { schuld: w.economy.debtRatio };
    const b = besatzung(w)[0]!;
    const erwartet = monatsWerte(w, { region: b.region, land: b.land, form: b.form, widerstand: b.widerstand });
    expect(besatzungHaushalt(w).kosten).toBeCloseTo(erwartet.kosten, 10);
    besatzungMonat(w);
    expect(b.widerstand).toBeCloseTo(kurve[1]!.widerstand, 6);
    expect(b.rueckkehr).toBe(kurve[1]!.rueckkehr);
    expect(w.economy.debtRatio).toBeGreaterThan(vorher.schuld);
    expect(kurve[1]!.rueckkehr).toBeLessThanOrEqual(RUECKKEHR_MAX);
  });

  test("Formen mit Stellvertretern gibt es nur, wo der Schauplatz Verbündete vor Ort kennt", () => {
    const w = welt();
    besatzungAnlegen(w, { region: "syr_asas", land: "SYR" });
    besatzungAnlegen(w, { region: "grc_chios", land: "GRC" });
    const s = besatzungsSicht(w);
    expect(s.find((x) => x.region === "syr_asas")!.stellvertreter).toBe(true);
    expect(s.find((x) => x.region === "grc_chios")!.stellvertreter).toBe(false);
  });

  test("die Stellvertreterverwaltung kann einen Skandal auslösen, sonst nicht; die Zeilen sind die Buchung", () => {
    const v = VORLAGEN.find((x) => x.id === "besatzung_skandal")!;
    expect(v.eigenerWurf).toBe(true);
    expect(v.ohneZusatzplatz).toBe(true);
    const ohne = welt();
    expect(v.chance(ohne)).toBe(0);
    const w = mitAsas();
    expect(v.chance(w)).toBe(0); // erst nach 90 Tagen
    advance(w, SKANDAL.abTagen + 1);
    w.spiel!.ereignisse = [];
    expect(v.chance(w)).toBeGreaterThan(0);
    // Zivilverwaltung: keine Stellvertreter, kein Skandal
    const z = load(save(w));
    aendereBesatzung(z, "syr_asas", "zivil");
    advance(z, SKANDAL.abTagen + 1);
    expect(v.chance(z)).toBe(0);
    const ev = oeffne(w, "besatzung_skandal", new Rng(1))!;
    expect(ev).toBeTruthy();
    for (const o of antworten(w, ev)) {
      const k = load(save(w));
      const evK = k.spiel!.ereignisse.find((e) => e.id === ev.id)!;
      const a0 = ansehen(k);
      antworten(k, evK).find((x) => x.id === o.id)!.wirkung(k, evK, new Rng(1));
      const d = ansehen(k) - a0;
      const zeile = (o.bedingungen ?? []).find((s) => s.startsWith("Ansehen"));
      if (o.id === "untersuchen") expect(d).toBeCloseTo(SKANDAL.untersuchen.ansehen, 1);
      if (o.id === "bestreiten") expect(d).toBeCloseTo(SKANDAL.bestreiten.ansehen, 1);
      if (o.id === "zivil") expect(d).toBeCloseTo(FORM.zivil.ansehenWechsel, 1);
      if (zeile) expect(zeile).toContain(String(Math.abs(Math.round(d * 10) / 10)).replace(".", ","));
    }
  });
});

describe("Schritt 9: Annexion von Asas mit Folgen", () => {
  test("vor dem Klick sichtbar, danach gebucht: Provinz 82, Einwohner, Haushalt, Außenlage", () => {
    const w = mitAsas();
    const b = besatzung(w)[0]!;
    const v = annexionVorschau(w, b);
    expect(v.plaka).toBe(82);
    expect(v.einwohner).toBe(REGION_NACH_ID["syr_asas"]!.einwohner!.zahl);
    expect(v.stufen).toHaveLength(4);
    expect(v.gv!.ja + v.gv!.nein + v.gv!.enth + (v.gv!.abwesend ?? 0)).toBe(193);
    const vorher = { ew: einwohnerTuerkei(w), eu: weltZustand(w)["EU"]!.konflikt, syr: weltZustand(w)["SYR"]!.konflikt, ansehen: ansehen(w), kapital: w.spiel!.kapital };
    expect(aendereBesatzung(w, "syr_asas", "annexion").ok).toBe(true);
    expect(w.spiel!.kapital).toBeCloseTo(vorher.kapital - FORM.annexion.pk, 6);
    // Einwohner
    expect(einwohnerTuerkei(w) - vorher.ew).toBe(729383);
    expect(aktiveProvinzen(w)[0]!.plaka).toBe(82);
    // Außenlage
    expect(weltZustand(w)["EU"]!.konflikt).toBeGreaterThan(vorher.eu);
    expect(weltZustand(w)["SYR"]!.konflikt).toBeGreaterThan(vorher.syr);
    expect(ansehen(w)).toBeLessThan(vorher.ansehen);
    // Haushalt: Dienste und Sicherheit kosten, Steuern kommen mit der Eingliederung
    const h0 = besatzungHaushalt(w);
    expect(h0.provinzen).toBe(1);
    expect(h0.kosten).toBeGreaterThan(FORM.annexion.sicherheitMonat);
    advance(w, 400);
    expect(besatzungHaushalt(w).einnahmen).toBeGreaterThan(h0.einnahmen);
    // Abstimmungen und Sanktionen nach dem Krim-Muster
    const a = annexionen(w)[0]!;
    expect(a.sr).toBeTruthy();
    expect(a.gv).toBeTruthy();
    expect(a.gv!.ja + a.gv!.nein + a.gv!.enth + (a.gv!.abwesend ?? 0)).toBe(193);
    expect(a.gv!.ja).toBeGreaterThanOrEqual(60);
    expect(a.stufe).toBe(4);
    expect(annexionsLast(w).risiko).toBeGreaterThan(0);
    expect(w.economy.sanktionsLast!.risiko).toBeGreaterThan(0);
  });

  test("Sanktionen bleiben im IWF-Band: nach einem Jahr höchstens 1,5 %, nach drei Jahren höchstens 9 % des BIP", () => {
    const mit = mitAsas(9), ohne = mitAsas(9);
    aendereBesatzung(mit, "syr_asas", "annexion");
    // Der Zwilling zahlt dieselbe Besatzung, aber ohne Annexion: gemessen wird nur, was Abstimmung und Sanktionen kosten
    aendereBesatzung(ohne, "syr_asas", "zivil");
    let summe = 0;
    for (let m = 1; m <= 36; m++) {
      advance(mit, 30);
      advance(ohne, 30);
      const luecke = 100 * (1 - bipWertMrd(mit.economy, true) / bipWertMrd(ohne.economy, true));
      summe += luecke / 12;
      if (m === 12) expect(luecke, "nach einem Jahr").toBeLessThanOrEqual(IWF_BAND.sofortMax);
    }
    expect(summe, "kumuliert über drei Jahre").toBeLessThanOrEqual(IWF_BAND.mittelfristigMax);
    expect(annexionen(mit)[0]!.stufe).toBe(SANKTIONS_STUFEN.length);
  }, 120_000);

  test("die Generalversammlung liegt in der Größenordnung der Vergleichsfälle; ein EU-Mitglied als Opfer bringt mehr Ja-Stimmen", () => {
    const w = welt();
    const syr = gvAbstimmung(w, "SYR");
    const grc = gvAbstimmung(w, "GRC");
    for (const x of [syr, grc]) expect(x.ja + x.nein + x.enth + (x.abwesend ?? 0)).toBe(193);
    expect(syr.ja).toBeGreaterThanOrEqual(70);
    expect(grc.ja).toBeGreaterThan(syr.ja);
    expect(grc.ja).toBeLessThanOrEqual(160);
  });

  test("Sitze erst nach der nächsten Wahl, nach Gesetz Nr. 2839; zusammen bleiben es 600", () => {
    const w = mitAsas();
    aendereBesatzung(w, "syr_asas", "annexion");
    expect(aktiveProvinzen(w)[0]!.sitze).toBeUndefined();
    const plan = sitzPlan(aktiveProvinzen(w));
    expect([...plan.values()].reduce((s, x) => s + x, 0)).toBe(SITZE_GESAMT);
    expect(plan.get(82)!).toBeGreaterThanOrEqual(1);
    advance(w, 40);
    parlamentswahl(w, new Rng(3), 0);
    const p = aktiveProvinzen(w)[0]!;
    expect(p.sitze).toBe(plan.get(82));
    expect(Object.values(w.parliament!.seats).reduce((s, x) => s + x, 0)).toBe(SITZE_GESAMT);
    expect(w.parliament!.byProvince![82]).toBeTruthy();
  });

  test("ohne neue Provinz ändert die Wahl nichts an der amtlichen Verteilung", () => {
    const plan = sitzPlan([]);
    expect([...plan.values()].reduce((s, x) => s + x, 0)).toBe(SITZE_GESAMT);
  });

  test("zwei Annexionen: Kennziffern 82 und 83; ein laufender Vorgang nimmt die zweite Region auf", () => {
    const w = mitAsas();
    besatzungAnlegen(w, { region: "syr_manbidsch", land: "SYR" });
    aendereBesatzung(w, "syr_asas", "annexion");
    aendereBesatzung(w, "syr_manbidsch", "annexion");
    expect(aktiveProvinzen(w).map((p) => p.plaka)).toEqual([82, 83]);
    expect(annexionen(w)).toHaveLength(1);
    expect(annexionen(w)[0]!.regionen).toEqual(["syr_asas", "syr_manbidsch"]);
    expect(einwohnerTuerkei(w)).toBe(TR_EINWOHNER + 729383 + REGION_NACH_ID["syr_manbidsch"]!.einwohner!.zahl);
  });

  test("Hatay-Weg: Abtretung per Vertrag nach einem Angriff auf die Türkei ohne Abstimmung und ohne Sanktionen", () => {
    const w = welt();
    const k = { id: "kv-test", land: "SYR", phase: "frieden", rahmung: "verteidigung", front: 90, zielraum: "syr_grenzstreifen", regionen: { syr_asas: "eigen", syr_manbidsch: "eigen", syr_qamischli: "gegner" } } as unknown as KriegVorgang;
    besatzungNachFrieden(w, k, 1, { formen: { syr_asas: "annexion", syr_manbidsch: "zone" } });
    expect(besatzung(w).map((b) => [b.region, b.form])).toEqual([["syr_asas", "annexion"], ["syr_manbidsch", "zone"]]);
    const a = annexionen(w)[0]!;
    expect(a.vertrag).toBe(true);
    expect(a.stufeMax).toBe(0);
    advance(w, 30);
    expect(a.stufe).toBe(0);
    expect(annexionsLast(w).risiko).toBe(0);
    expect(aktiveProvinzen(w)[0]!.vertrag).toBe(true);
  });

  test("Friedenstisch-Schnittstelle: „abtretung“ und Formnamen in den Forderungen, „rueckgabe“ gibt zurück", () => {
    const w = welt();
    const k = { id: "kv-test", land: "SYR", phase: "frieden", rahmung: "schutz", front: 90, zielraum: "syr_grenzstreifen", regionen: { syr_asas: "eigen", syr_manbidsch: "eigen", syr_qamischli: "eigen" } } as unknown as KriegVorgang;
    besatzungNachFrieden(w, k, 1, { forderungen: { syr_asas: "abtretung", syr_manbidsch: "zivil", syr_qamischli: "rueckgabe" } });
    expect(Object.fromEntries(besatzung(w).map((b) => [b.region, b.form]))).toEqual({ syr_asas: "annexion", syr_manbidsch: "zivil" });
    // Die Türkei hatte begonnen: erzwungener Vertrag, höchstens die erste Sanktionsstufe
    expect(annexionen(w)[0]!.stufeMax).toBe(1);
  });
});

describe("Befund A6: Revanche statt zweiter Eroberung", () => {
  test("ein späterer Krieg beginnt mit Asas als türkisch; im Vorteil zielt der Gegner zuerst auf Asas, dann auf die Grenzprovinzen", () => {
    const w = mitAsas();
    aendereBesatzung(w, "syr_asas", "annexion");
    const k = { id: "kv-rev", land: "SYR", phase: "krieg", woche: 3, front: 55, zielraum: "syr_grenzstreifen", seit: w.day } as unknown as KriegVorgang;
    regionenSetzen(w, k);
    expect(k.regionen!["syr_asas"]).toBe("eigen");
    k.front = 40;
    regionenSetzen(w, k);
    expect(k.regionen!["syr_asas"]).toBe("umkaempft");
    expect(k.bedroht).toEqual([]);
    k.front = 10;
    regionenSetzen(w, k);
    expect(k.regionen!["syr_asas"]).toBe("gegner");
    expect(k.bedroht!.length).toBeGreaterThan(0);
    // Frieden nach der Niederlage: Die Provinz ist verloren, ihre Kennziffer bleibt vergeben
    besatzungNachFrieden(w, k, -1);
    expect(besatzung(w)).toHaveLength(0);
    expect(aktiveProvinzen(w)).toHaveLength(0);
    expect(w.spiel!.provinzenNeu![0]!.verloren).toBe(w.day);
  });

  test("ganz Zypern annektiert: Exilregierung, kein neuer Kriegsvorgang", () => {
    const w = welt();
    for (const id of ["cyp_nikosia", "cyp_larnaka", "cyp_limassol", "cyp_paphos"]) {
      if (!REGION_NACH_ID[id]) continue;
      besatzungAnlegen(w, { region: id, land: "CYP" });
      aendereBesatzung(w, id, "annexion");
    }
    expect(staatAnnektiert(w, "CYP")).toBe(true);
    weltZustand(w)["CYP"]!.konflikt = 95;
    kriegMonat(w, new Rng(2));
    expect((w.spiel!.kriege ?? []).some((k) => k.land === "CYP" && k.phase !== "beendet")).toBe(false);
  });
});

describe("Spielstände und Determinismus", () => {
  test("Speichern und Laden nach einer Annexion: Feld für Feld gleich", () => {
    const w = mitAsas();
    aendereBesatzung(w, "syr_asas", "annexion");
    advance(w, 20);
    // Die Teile von K5 kommen Feld für Feld zurück; danach ist der Stand ein Fixpunkt (das erste Laden ergänzt am Tag 20 Wirtschaftsfelder,
    // migriereKonjunktur, unabhängig von K5)
    const g = load(save(w));
    for (const k of ["besatzung", "provinzenNeu", "annexionen"] as const) expect(JSON.stringify(g.spiel![k])).toBe(JSON.stringify(w.spiel![k]));
    const s = save(g);
    expect(save(load(s))).toBe(s);
  });

  test("alte Formen laden als neue: Pufferzone wird Sicherheitszone, Verwaltung wird Zivilverwaltung", () => {
    const w = welt();
    w.spiel!.besatzung = [
      { region: "syr_asas", land: "SYR", seit: 1, form: "pufferzone" as never, widerstand: 30, aufstand: 0 },
      { region: "syr_manbidsch", land: "SYR", seit: 1, form: "verwaltung" as never, widerstand: 30, aufstand: 0 },
    ];
    const g = load(save(w));
    expect(g.spiel!.besatzung!.map((b) => b.form)).toEqual(["zone", "zivil"]);
    migriereBesatzung(g);
    expect(save(load(save(g)))).toBe(save(g));
  });

  test("ohne Besatzung legt Laden nichts an", () => {
    const w = welt();
    const s = save(w);
    const g = load(s);
    expect(g.spiel!.besatzung).toBeUndefined();
    expect(g.spiel!.provinzenNeu).toBeUndefined();
    expect(g.spiel!.annexionen).toBeUndefined();
  });

  test("gleicher Samen, gleicher Verlauf", () => {
    const lauf = () => {
      const w = mitAsas(4);
      aendereBesatzung(w, "syr_asas", "annexion");
      advance(w, 200);
      return save(w);
    };
    expect(lauf()).toBe(lauf());
  });

  test.skipIf(!existsSync("../spielstand/staatsraeson_2043-08-03.json"))("Spielstand des Inhabers 2043 lädt und rundet exakt", () => {
    const w = load(JSON.stringify(JSON.parse(readFileSync("../spielstand/staatsraeson_2043-08-03.json", "utf8")).welt));
    const s = save(w);
    expect(save(load(s))).toBe(s);
    expect(besatzungsSicht(w)).toEqual([]);
  });

  test.skipIf(!existsSync("../spielstand/staatsraeson_2045-06-04.json"))("Spielstand des Inhabers 2045: die Linie mit Griechenland lädt als Sicherheitszone", () => {
    const w = load(JSON.stringify(JSON.parse(readFileSync("../spielstand/staatsraeson_2045-06-04.json", "utf8")).welt));
    const liste = besatzung(w);
    expect(liste.length).toBe(4);
    expect(liste.every((b) => b.form === "zone" && b.grundlage === "linie")).toBe(true);
    expect(aendereBesatzung(w, liste[0]!.region, "annexion").ok).toBe(false);
  });
});
