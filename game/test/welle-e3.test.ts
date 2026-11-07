// Welle E3: Machtkreis und Dienst. Erst die vier Fehler (Namensdoppel, Journalist im Kabinettsstreit, Kaltstellen, Prozentanzeige des MİT),
// dann die Vorgänge auf dem Schreibtisch: Befund einer Überprüfung, Stufen des Nachfolgedrucks mit Parteitag, Zugriff, Schlag gegen Kader,
// Austausch, aufgeflogene und fremde Operationen. Geprüft wird: Der Vorgang kommt, wenn die Lage es verlangt, und nicht sonst; die Antworten
// buchen, was sie zeigen; der Lauf ist deterministisch; der Spielstand des Inhabers lädt.
import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { antworten, entscheide, oeffne, vorlage } from "../src/sim/ereignisse";
import {
  NACHFOLGE_STUFEN,
  bereinigeNamensdoppel,
  heftigsteRivalitaet,
  machtkreis,
  machtkreisMonat,
  nebenVon,
  personVon,
  personen,
  schluesselVon,
  zieheHebel,
} from "../src/sim/machtkreis";
import { KREIS, offeneStufe } from "../src/sim/ereignisse-kreis";
import { NACHFOLGE_WIRKUNG } from "../src/sim/ereignisse-machtkreis";
import { DIENST_VORGAENGE } from "../src/sim/ereignisse-dienst";
import { VORGANG, dienst, offeneFremde, vorgangAussicht } from "../src/sim/welt-dienst";
import { kandidatenFuer } from "../src/sim/nachfolge";
import { eigenVon, KALT_LEISTUNG, leistung } from "../src/sim/personen";
import { aussenZustand } from "../src/sim/diplomatie";
import { beziehungAendern, beziehungZurTuerkei, weltModellMonat } from "../src/sim/welt-modell";
import { MitZusatz } from "../src/ui/behoerden/Mit";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

function welt(seed = 4): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 60;
  machtkreis(w);
  return w;
}
const knoten = (w: World, id: string) => nationalAverage(NET, w.net, id);
/** Ruhige Monate: ohne Ereignisse, damit nichts dazwischenkommt. */
function ruhig(w: World, monate: number): void {
  for (let i = 0; i < monate; i++) {
    advance(w, 30);
    w.spiel!.ereignisse = [];
    w.spiel!.geplant = [];
  }
}

describe("Welle 1: Fehler", () => {
  test("Ernennungen meiden die Namen der Nebenfiguren und der Ehemaligen", () => {
    const w = welt();
    const neben = new Set(machtkreis(w).neben.map((n) => n.name));
    for (const amt of ["finanzen", "inneres", "aussen", "wirtschaft"] as const)
      for (const k of kandidatenFuer(w, amt)) expect(neben.has(k.name)).toBe(false);
  });

  test("ein Kronprinz mit dem Namen eines Ehemaligen wird beim Laden umbenannt, alle Schlüssel ziehen mit", () => {
    const w = welt();
    const mk = machtkreis(w);
    const kp = nebenVon(w, "kronprinz")!;
    const alt = schluesselVon(kp);
    const fin = w.spiel!.figuren.find((f) => f.amt === "finanzen")!;
    kp.name = fin.name;
    const doppel = schluesselVon(kp);
    // Beziehung, Geheimnis und Absprache am alten Schlüssel
    for (const b of mk.beziehungen) { if (b.a === alt) b.a = doppel; if (b.b === alt) b.b = doppel; }
    mk.geheimnisse.push({ id: "g-test", person: doppel, art: "korruption", schwere: 2, aufgedeckt: false, oeffentlich: false, seit: w.day });
    mk.deals[doppel] = w.day + 100;
    mk.zuletzt[`deal|${doppel}`] = w.day;
    const geladen = load(save(w));
    const kp2 = nebenVon(geladen, "kronprinz")!;
    expect(kp2.name).not.toBe(fin.name);
    const neu = schluesselVon(kp2);
    const mk2 = machtkreis(geladen);
    expect(mk2.geheimnisse.find((g) => g.id === "g-test")!.person).toBe(neu);
    expect(mk2.deals[neu]).toBe(w.day + 100);
    expect(mk2.zuletzt[`deal|${neu}`]).toBe(w.day);
    expect(JSON.stringify(mk2)).not.toContain(doppel);
    // Zweites Laden ändert nichts mehr
    bereinigeNamensdoppel(geladen);
    expect(nebenVon(geladen, "kronprinz")!.name).toBe(kp2.name);
  });

  test("Journalistin und Verfassungsrichter streiten nicht im Kabinett", () => {
    const w = welt();
    const mk = machtkreis(w);
    const j = nebenVon(w, "journalist")!;
    const stab = personen(w).find((p) => p.rolle === "stab")!;
    mk.beziehungen = mk.beziehungen.filter((b) => b.art !== "rivalen");
    mk.beziehungen.push({ a: schluesselVon(j), b: stab.schluessel, art: "rivalen", staerke: 90, bekannt: true });
    expect(heftigsteRivalitaet(w)).toBeUndefined();
    expect(vorlage("kreis_rivalitaet").chance(w)).toBe(0);
    // Über zwei Jahre entsteht keine Rivalität mit Presse oder Gericht
    const v = welt(7);
    ruhig(v, 24);
    const aussen = new Set(["journalist", "richter", "opposition"]);
    for (const b of machtkreis(v).beziehungen.filter((x) => x.art === "rivalen")) {
      expect(aussen.has(personVon(v, b.a)?.rolle ?? "")).toBe(false);
      expect(aussen.has(personVon(v, b.b)?.rolle ?? "")).toBe(false);
    }
  });

  test("Kaltstellen senkt die Leistung des Ressorts, sofort und nach einem Monat", () => {
    const w = welt();
    const p = personen(w).find((x) => x.rolle === "inneres")!;
    const f = p.figur!;
    eigenVon(w, f).einarbeitungBis = 0;
    const vorher = leistung(w, f);
    expect(zieheHebel(w, p.schluessel, "kaltstellen").ok).toBe(true);
    const nachher = leistung(w, f);
    expect(nachher).toBeLessThan(vorher);
    machtkreisMonat(w);
    expect(leistung(w, f)).toBeLessThan(vorher);
    // Der Faktor wirkt, auch wenn vorher Kritik den Druck setzte
    eigenVon(w, f).druckBis = w.day + 60;
    expect(leistung(w, f)).toBeCloseTo(nachher, 6);
    expect(KALT_LEISTUNG).toBeLessThan(1);
  });

  test("MİT: Aussicht, Leck und Schutz in Prozent", () => {
    const w = welt();
    const html = renderToStaticMarkup(createElement(MitZusatz, { w, refresh: () => {} }));
    expect(html).not.toMatch(/Aussicht [01]\s%/);
    expect(html).toMatch(/Aussicht \d{2}\s%/);
    expect(html).toMatch(/Schutz des Präsidenten: \d{2}\s%/);
  });
});

describe("Machtkreis: Befund einer Überprüfung", () => {
  function mitBefund(): { w: World; schluessel: string } {
    const w = welt();
    const p = personen(w).find((x) => x.rolle === "inneres")!;
    const mk = machtkreis(w);
    mk.geheimnisse = mk.geheimnisse.filter((g) => g.person !== p.schluessel);
    mk.geheimnisse.push({ id: "g-bef", person: p.schluessel, art: "korruption", schwere: 2, aufgedeckt: true, oeffentlich: false, seit: w.day });
    mk.befunde = [{ person: p.schluessel, geheimnis: "g-bef", tag: w.day }];
    return { w, schluessel: p.schluessel };
  }

  test("kommt nur mit Befund", () => {
    expect(vorlage("kreis_befund").chance(welt())).toBe(0);
    const { w } = mitBefund();
    expect(vorlage("kreis_befund").chance(w)).toBe(1);
    const ev = oeffne(w, "kreis_befund", new Rng(1))!;
    expect(ev.daten?.g).toBe("g-bef");
    expect(vorlage("kreis_befund").chance(w)).toBe(0);
  });

  test("eine Überprüfung mit Fund legt den Befund an", () => {
    const w = welt();
    const p = personen(w).find((x) => x.rolle === "aussen")!;
    const mk = machtkreis(w);
    mk.geheimnisse = mk.geheimnisse.filter((g) => g.person !== p.schluessel);
    mk.geheimnisse.push({ id: "g-x", person: p.schluessel, art: "auslandskontakt", schwere: 3, aufgedeckt: false, oeffentlich: false, seit: w.day });
    // Den Fund für diesen Test sicher machen: alle Würfe des Kreises fallen hier nach Samen und Tag
    let gefunden = false;
    for (let versuch = 0; versuch < 12 && !gefunden; versuch++) {
      const k = load(save(w));
      k.day += versuch;
      machtkreis(k).untersuchungen.push({ person: p.schluessel, beginn: k.day - 80, ende: k.day - 1 });
      machtkreisMonat(k);
      gefunden = (machtkreis(k).befunde ?? []).some((b) => b.geheimnis === "g-x");
    }
    expect(gefunden).toBe(true);
  });

  test("die Antworten buchen die gezeigten Zahlen", () => {
    const { w, schluessel } = mitBefund();
    const ev = oeffne(w, "kreis_befund", new Rng(1))!;
    const q = KREIS.befund;
    const opts = antworten(w, ev);
    expect(opts.map((o) => o.id)).toEqual(["nutzen", "opfern", "decken", "abwarten"]);
    for (const o of opts) expect(o.stelle?.art).toBe("machtkreis");
    // Nutzen: Loyalität +25
    const a = load(save(w));
    const loy0 = personVon(a, schluessel)!.loyalitaet;
    expect(entscheide(a, ev.id, "nutzen", new Rng(2)).ok).toBe(true);
    expect(personVon(a, schluessel)!.loyalitaet - loy0).toBeCloseTo(Math.min(q.nutzen.loyalitaet, 100 - loy0), 6);
    expect(opts[0]!.bedingungen![0]).toContain(`+${q.nutzen.loyalitaet}`);
    // Opfern: Rücktritt, Vertrauen steigt
    const b = load(save(w));
    const name = personVon(b, schluessel)!.name;
    const vt0 = knoten(b, "vertrauen_regierung");
    expect(entscheide(b, ev.id, "opfern", new Rng(2)).ok).toBe(true);
    expect(b.spiel!.figuren.find((f) => f.amt === "inneres")!.name).not.toBe(name);
    expect(knoten(b, "vertrauen_regierung")).toBeGreaterThan(vt0);
    expect(machtkreis(b).geheimnisse.find((g) => g.id === "g-bef")?.oeffentlich ?? true).toBe(true);
  });
});

describe("Machtkreis: Stufen des Nachfolgedrucks und Parteitag", () => {
  test("eine Stufe wird einmal gemeldet, beim Sinken zurückgesetzt", () => {
    const w = welt();
    const mk = machtkreis(w);
    mk.nachfolge = 50;
    expect(offeneStufe(w)).toBe(0);
    expect(vorlage("kreis_nachfolge_stufe").chance(w)).toBe(0);
    mk.nachfolge = 85;
    expect(offeneStufe(w)).toBe(2);
    const ev = oeffne(w, "kreis_nachfolge_stufe", new Rng(1))!;
    expect(ev.daten?.stufe).toBe(2);
    expect(mk.nachfolgeStufe).toBe(2);
    expect(offeneStufe(w)).toBe(0);
    mk.nachfolge = 95;
    expect(offeneStufe(w)).toBe(3);
    // Fällt der Druck deutlich, wird die Stufe wieder frei
    mk.nachfolgeStufe = 2;
    mk.nachfolge = 60;
    machtkreisMonat(w);
    expect(mk.nachfolgeStufe).toBeLessThan(2);
  });

  test("Antworten zeigen den Druck, den sie buchen; Schweigen auf Stufe 3 setzt den außerordentlichen Parteitag an", () => {
    const w = welt();
    const mk = machtkreis(w);
    mk.nachfolge = 96;
    const ev = oeffne(w, "kreis_nachfolge_stufe", new Rng(1))!;
    expect(ev.daten?.stufe).toBe(3);
    const opts = antworten(w, ev);
    expect(opts.map((o) => o.id)).toEqual(["designieren", "hinhalten", "ausbooten", "abwarten"]);
    const h = load(save(w));
    expect(entscheide(h, ev.id, "hinhalten", new Rng(2)).ok).toBe(true);
    expect(machtkreis(h).nachfolge).toBeCloseTo(96 + NACHFOLGE_WIRKUNG.hinhalten.druck, 6);
    expect(opts[1]!.bedingungen![0]).toContain(`96 → ${96 + NACHFOLGE_WIRKUNG.hinhalten.druck}`);
    const s = load(save(w));
    expect(entscheide(s, ev.id, "abwarten", new Rng(2)).ok).toBe(true);
    expect(machtkreis(s).parteitag?.tag).toBe(s.day + NACHFOLGE_STUFEN.ausserordentlichTage);
  });

  test("am Termin tritt der Kronprinz bei hohem Druck an, sonst tagt der Parteitag still", () => {
    const w = welt();
    const mk = machtkreis(w);
    mk.nachfolge = 90;
    mk.nachfolgeStufe = 3;
    mk.parteitag = { tag: w.day + 10 };
    w.day += 15;
    machtkreisMonat(w);
    expect(mk.parteitagFaellig).toBeDefined();
    expect(vorlage("kreis_parteitag").chance(w)).toBe(1);
    oeffne(w, "kreis_parteitag", new Rng(1));
    expect(mk.parteitagFaellig).toBeUndefined();
    expect(vorlage("kreis_parteitag").chance(w)).toBe(0);
    // Niedriger Druck: still, der Druck sinkt
    const v = welt();
    const mv = machtkreis(v);
    mv.nachfolge = 50;
    mv.parteitag = { tag: v.day + 5 };
    v.day += 10;
    const vorher = mv.nachfolge;
    machtkreisMonat(v);
    expect(mv.parteitag).toBeUndefined();
    expect(mv.nachfolge).toBeLessThan(vorher);
    expect(vorlage("kreis_parteitag").chance(v)).toBe(0);
  });
});

describe("Dienst: Gelegenheiten", () => {
  test("Zugriff: erst nach einem halben Jahr, höchstens eine Gelegenheit im Quartal", () => {
    const w = welt();
    expect(vorlage("dienst_zugriff").chance(w)).toBe(0);
    ruhig(w, 7);
    expect(vorlage("dienst_zugriff").chance(w)).toBeGreaterThan(0);
    oeffne(w, "dienst_zugriff", new Rng(1));
    expect(vorlage("dienst_zugriff").chance(w)).toBe(0);
    expect(vorlage("dienst_kader").chance(w)).toBe(0);
  });

  test("Zugriff: angeordnet mit der gezeigten Aussicht, aufgelöst gegen dieselben Zahlen", () => {
    const w = welt();
    ruhig(w, 7);
    const ev = oeffne(w, "dienst_zugriff", new Rng(1))!;
    const land = String(ev.daten!.land);
    const a = vorgangAussicht(w, "zugriff", land);
    const o = antworten(w, ev).find((x) => x.id === "zugriff")!;
    expect(o.bedingungen![0]).toContain(`${Math.round(a.p * 100)} %`);
    expect(o.bedingungen![0]).toContain(`${Math.round(a.pAuf * 100)} %`);
    const kap0 = dienst(w).kapazitaet;
    expect(entscheide(w, ev.id, "zugriff", new Rng(2)).ok).toBe(true);
    const op = dienst(w).ops.find((x) => x.art === "zugriff")!;
    expect(op.p).toBeCloseTo(a.p, 9);
    expect(op.pAuf).toBeCloseTo(a.pAuf, 9);
    expect(dienst(w).kapazitaet).toBe(kap0 - 25);
    ruhig(w, 3);
    expect(dienst(w).ops.some((x) => x.id === op.id)).toBe(false);
    expect(dienst(w).bericht.some((b) => b.titel.includes("Zugriff"))).toBe(true);
  });

  test("Kader: nur bei starkem Täterkreis; ein Erfolg senkt ihn um die gezeigten Punkte und kostet den Friedensprozess", () => {
    const w = welt();
    ruhig(w, 7);
    const az = aussenZustand(w);
    az.terror.pkk = 10;
    az.terror.is = 10;
    expect(vorlage("dienst_kader").chance(w)).toBe(0);
    az.terror.pkk = 45;
    expect(vorlage("dienst_kader").chance(w)).toBeGreaterThan(0);
    // Erfolg sicher: viele Samen, bis einer gelingt; verglichen mit derselben Partie ohne die Operation
    let geprueft = false;
    for (let seed = 1; seed < 40 && !geprueft; seed++) {
      const k = load(save(w));
      k.seed = seed;
      aussenZustand(k).friedens.phase = 1;
      const ev = oeffne(k, "dienst_kader", new Rng(1))!;
      entscheide(k, ev.id, "schlag", new Rng(2));
      const kontrolle = load(save(k));
      dienst(kontrolle).ops = dienst(kontrolle).ops.filter((x) => x.art !== "kader");
      ruhig(k, 2);
      ruhig(kontrolle, 2);
      if (dienst(k).bericht.at(-1)?.ausgang === "fehlschlag") continue;
      const d = aussenZustand(k).terror.pkk - aussenZustand(kontrolle).terror.pkk;
      if (d >= -0.5) continue;
      // Die Täterkreise laufen monatlich um ein Zehntel zu ihrem Ziel zurück (sim/diplomatie.ts): nach zwei Monaten bleiben rund 80 %
      expect(d).toBeLessThan(-0.7 * VORGANG.kader.erfolg.taeter.schlag);
      expect(aussenZustand(k).friedens.fortschritt - aussenZustand(kontrolle).friedens.fortschritt).toBeLessThan(0.7 * VORGANG.kader.erfolg.frieden.schlag);
      geprueft = true;
    }
    expect(geprueft).toBe(true);
    expect(VORGANG.kader.erfolg.taeter.schlag).toBeGreaterThan(0);
  });

  test("Kanal: nur, wenn Washington und Moskau beide mit Ankara reden", () => {
    const w = welt();
    ruhig(w, 7);
    beziehungAendern(w, "USA", { vertrauen: 100 });
    beziehungAendern(w, "RUS", { vertrauen: 100 });
    expect(vorlage("dienst_kanal").chance(w)).toBeGreaterThan(0);
    for (let i = 0; i < 20 && beziehungZurTuerkei(w, "RUS").vertrauen >= DIENST_VORGAENGE.kanal.vertrauen; i++) beziehungAendern(w, "RUS", { vertrauen: -30 });
    expect(beziehungZurTuerkei(w, "RUS").vertrauen).toBeLessThan(DIENST_VORGAENGE.kanal.vertrauen);
    expect(vorlage("dienst_kanal").chance(w)).toBe(0);
  });
});

describe("Dienst: aufgeflogene und fremde Operationen", () => {
  test("eine aufgeflogene Operation kommt auf den Tisch; die Antworten buchen ihre Zahlen", () => {
    const w = welt();
    expect(vorlage("dienst_aufgeflogen").chance(w)).toBe(0);
    dienst(w).aufgeflogen = [{ op: 99, art: "desinfo", ziel: "GRC", tag: w.day, erfolg: false }];
    expect(vorlage("dienst_aufgeflogen").chance(w)).toBe(1);
    const ev = oeffne(w, "dienst_aufgeflogen", new Rng(1))!;
    expect(ev.daten?.land).toBe("GRC");
    expect(dienst(w).aufgeflogen).toEqual([]);
    const q = DIENST_VORGAENGE.aufgeflogen;
    const a = load(save(w));
    const pf0 = knoten(a, "pressefreiheit");
    entscheide(a, ev.id, "dementieren", new Rng(2));
    expect(knoten(a, "pressefreiheit")).toBeLessThan(pf0);
    const b = load(save(w));
    const kap0 = dienst(b).kapazitaet;
    entscheide(b, ev.id, "opfern", new Rng(2));
    expect(dienst(b).kapazitaet).toBe(Math.max(0, kap0 + q.opfern.kapazitaet));
    const c = load(save(w));
    const nat0 = knoten(c, "nationalisten");
    entscheide(c, ev.id, "bekennen", new Rng(2));
    expect(knoten(c, "nationalisten")).toBeGreaterThan(nat0);
  });

  test("eine aufgedeckte fremde Operation kommt als Vorgang, einmal", () => {
    const w = welt();
    const dz = dienst(w);
    expect(vorlage("dienst_fremd").chance(w)).toBe(0);
    dz.eingehend.push({ id: 501, von: "ISR", art: "abhoeren", start: w.day, ende: w.day + 120, aufgedeckt: true });
    expect(offeneFremde(w)?.id).toBe(501);
    expect(vorlage("dienst_fremd").chance(w)).toBe(1);
    const ev = oeffne(w, "dienst_fremd", new Rng(1))!;
    expect(ev.daten?.land).toBe("ISR");
    expect(vorlage("dienst_fremd").chance(w)).toBe(0);
    expect(entscheide(w, ev.id, "oeffentlich", new Rng(2)).ok).toBe(true);
    expect(dz.eingehend.some((x) => x.id === 501)).toBe(false);
  });
});

describe("Gesamtlauf", () => {
  test("gleicher Samen, gleicher Verlauf über zwei Jahre mit allen Vorgängen", () => {
    const lauf = () => {
      const w = welt(11);
      machtkreis(w).nachfolge = 70;
      for (let i = 0; i < 24; i++) {
        advance(w, 30);
        for (const e of [...w.spiel!.ereignisse]) {
          const o = antworten(w, e).find((x) => !x.sperre && (w.spiel!.kapital >= (x.anzeigePk ?? x.pk)));
          if (o) entscheide(w, e.id, o.id, new Rng(w.day));
        }
      }
      return save(w);
    };
    expect(lauf()).toBe(lauf());
  }, 300_000);
});

// Der Spielstand des Inhabers (Kopie, nicht eingecheckt): fehlt er, entfällt der Test
const INHABER = new URL("../../spielstand/staatsraeson_2043-08-03.json", import.meta.url);
test.skipIf(!existsSync(INHABER))("Spielstand des Inhabers: Kronprinz umbenannt, Stufe 80 offen, Vorgänge kommen", () => {
  const roh = JSON.parse(readFileSync(INHABER, "utf8")) as { welt: World };
  const w = load(JSON.stringify(roh.welt));
  const kp = nebenVon(w, "kronprinz")!;
  expect(kp.name).not.toBe("Cem Bilgin");
  expect(offeneStufe(w)).toBe(2);
  expect(vorlage("kreis_nachfolge_stufe").chance(w)).toBe(1);
}, 120_000);
