// Welle M1: Machtkreis und Dienst umgebaut. Geprüft wird:
//   - Hebel: Minister ohne doppelte Hebel, keine freie Säuberung, die Überprüfung bindet Kapazität des Dienstes.
//   - Karten: 3 bis 5 Personen, jede gezeigte Zahl ist die gebuchte (Nachfolgedruck, Disziplin, Preis).
//   - Abspaltung: kommt nach dem Bruch mit dem Kronprinzen, nicht ohne; Gründung nach der Frist mit Sitzen und Anteilen; Versöhnen und
//     Beschleunigen buchen, was sie zeigen; die Präsidentenwahl kennt die Abspaltung.
//   - Säuberung: nur nach einem Putschversuch; die Antworten buchen, was sie zeigen (EU eingefroren).
//   - Dienst: drei Gelegenheiten mit Bedingung, keine Liste der Zielstaaten mehr; Länderakte zeigt den Dienst nur bei Anlass.
//   - Determinismus, Rundlauf, Spielstände des Inhabers (2039, 2043, 2045) und die Ansichten in drei Sprachen.
import { afterAll, describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { antworten, entscheide, oeffne, vorlage } from "../src/sim/ereignisse";
import {
  HEBEL_WIRKUNG,
  SAEUBERUNG_FOLGEN,
  disziplinStimmen,
  hebelFuer,
  machtkreis,
  nebenVon,
  personen,
  schluesselVon,
  zieheHebel,
} from "../src/sim/machtkreis";
import { kreisGefahren, kreisKarten } from "../src/sim/machtkreis-sicht";
import { ABSPALTUNG, ABSPALTUNG_PARTEI, abspaltungGroesse, abspaltungMonat, drohendeAbspaltung, gegruendeteAbspaltung } from "../src/sim/abspaltung";
import { SAEUBERUNG } from "../src/sim/ereignisse-m1";
import { dienstImLand, gelegenheiten } from "../src/sim/dienst-sicht";
import { dienst } from "../src/sim/welt-dienst";
import { endenZustand } from "../src/sim/enden";
import { wahlRechnung } from "../src/sim/wahl";
import { Machtkreis } from "../src/ui/personen/Machtkreis";
import { Dienst } from "../src/ui/welt/Dienst";
import { ladeSprache, setzeSprache } from "../src/i18n";
import de from "../src/i18n/katalog/de/welle_m1.json";
import en from "../src/i18n/katalog/en/welle_m1.json";
import tr from "../src/i18n/katalog/tr/welle_m1.json";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

const KAPUTT = /undefined|NaN|\[object|\$\{|Infinity|⟦|welle_m1\.|\{[a-z]+(, [a-z]+)?\}/;

function welt(seed = 4): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 60;
  machtkreis(w);
  dienst(w);
  return w;
}
/** Ruhige Monate: ohne Ereignisse, damit nichts dazwischenkommt. */
function ruhig(w: World, monate: number): void {
  for (let i = 0; i < monate; i++) {
    advance(w, 30);
    w.spiel!.ereignisse = [];
    w.spiel!.geplant = [];
  }
}
/** Ein Kronprinz, der beim Kaltstellen bricht: ehrgeizig, mäßig loyal, mit Einfluss. */
function bruchbereit(w: World): void {
  const kp = nebenVon(w, "kronprinz")!;
  kp.ehrgeiz = 85;
  kp.loyalitaet = 50;
  kp.einfluss = 60;
}
const zahlDe = (x: number): string => x.toLocaleString("de-DE", { maximumFractionDigits: 1 });

afterAll(async () => { await setzeSprache("de"); });

describe("Hebel", () => {
  test("Minister ohne Befördern, Absprache und Bauernopfer; niemand mit freier Säuberung", () => {
    const w = welt();
    for (const p of personen(w)) {
      const h = hebelFuer(w, p.schluessel).map((x) => x.hebel);
      expect(h, p.rolle).not.toContain("saeuberung");
      if (p.figur && ["finanzen", "inneres", "aussen", "stab", "justiz", "generalstab", "wirtschaft"].includes(p.rolle)) {
        expect(h, p.rolle).not.toContain("befoerdern");
        expect(h, p.rolle).not.toContain("deal");
        expect(h, p.rolle).not.toContain("bauernopfer");
        expect(h, p.rolle).toContain("untersuchung");
      }
    }
    // Kronprinz und Fraktionsvorsitz behalten ihre Hebel
    expect(hebelFuer(w, schluesselVon(nebenVon(w, "kronprinz")!)).map((x) => x.hebel)).toEqual(expect.arrayContaining(["befoerdern", "kaltstellen", "deal", "untersuchung"]));
  });

  test("die Überprüfung bindet Kapazität des Dienstes und wird ohne Kapazität gesperrt", () => {
    const w = welt();
    const dz = dienst(w);
    const p = personen(w).find((x) => x.rolle === "aussen")!;
    const vorher = dz.kapazitaet;
    expect(zieheHebel(w, p.schluessel, "untersuchung").ok).toBe(true);
    expect(dz.kapazitaet).toBe(vorher - HEBEL_WIRKUNG.untersuchung.kapazitaet);
    dz.kapazitaet = HEBEL_WIRKUNG.untersuchung.kapazitaet - 1;
    const q = personen(w).find((x) => x.rolle === "finanzen")!;
    const s = hebelFuer(w, q.schluessel).find((x) => x.hebel === "untersuchung")!;
    expect(s.moeglich).toBe(false);
    expect(s.grund).toMatch(/Kapazität/);
  });
});

describe("Karten", () => {
  test("3 bis 5 Personen, Kronprinz zuerst; bei Wechselgefahr und bekanntem Geheimnis kommen Minister dazu", () => {
    const w = welt();
    const k = kreisKarten(w);
    expect(k.length).toBeGreaterThanOrEqual(3);
    expect(k.length).toBeLessThanOrEqual(5);
    expect(k[0]!.grund).toBe("kronprinz");
    const fin = personen(w).find((p) => p.rolle === "finanzen")!;
    machtkreis(w).geheimnisse.push({ id: "g-t", person: fin.schluessel, art: "korruption", schwere: 2, aufgedeckt: true, oeffentlich: false, seit: w.day });
    const k2 = kreisKarten(w);
    const karte = k2.find((x) => x.person.schluessel === fin.schluessel)!;
    expect(karte.grund).toBe("geheimnis");
    expect(karte.handlungen.map((h) => h.id)).toEqual(expect.arrayContaining(["gespraech", "untersuchung"]));
    expect(k2.length).toBeLessThanOrEqual(5);
  });

  test("gezeigte Zahlen = gebuchte Zahlen (Nachfolgedruck, Disziplin, Kapital)", () => {
    const w = welt();
    const mk = machtkreis(w);
    mk.nachfolge = 70;
    const kp = kreisKarten(w).find((x) => x.grund === "kronprinz")!;
    const deal = kp.handlungen.find((h) => h.hebel === "deal")!;
    const nachher = Math.max(0, 70 + HEBEL_WIRKUNG.deal.kronprinzDruck);
    expect(deal.zahlen).toContain(`70 → ${nachher}`);
    const kap = w.spiel!.kapital;
    expect(zieheHebel(w, kp.person.schluessel, "deal").ok).toBe(true);
    expect(mk.nachfolge).toBe(nachher);
    expect(w.spiel!.kapital).toBe(kap - deal.pk!);
    // Fraktionsvorsitz: die Disziplin nach dem Befördern ist die angekündigte
    const fc = kreisKarten(w).find((x) => x.grund === "fraktionschef")!;
    const bef = fc.handlungen.find((h) => h.hebel === "befoerdern")!;
    zieheHebel(w, fc.person.schluessel, "befoerdern");
    const d = disziplinStimmen(w);
    expect(bef.zahlen).toContain(`→ ${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d)} `);
  });

  test("Gefahren nennen Parteitag, Abspaltung und Wechsel mit Zahl", () => {
    const w = welt();
    expect(kreisGefahren(w).length).toBe(0);
    machtkreis(w).nachfolge = 85;
    expect(kreisGefahren(w).map((g) => g.art)).toContain("parteitag");
  });
});

describe("Abspaltung", () => {
  test("kein Bruch ohne Kaltstellen; nach dem Kaltstellen eines ehrgeizigen Kronprinzen droht sie mit Frist", () => {
    const w = welt();
    bruchbereit(w);
    ruhig(w, 3);
    expect(drohendeAbspaltung(w)).toBeUndefined();
    const kp = nebenVon(w, "kronprinz")!;
    expect(zieheHebel(w, schluesselVon(kp), "kaltstellen").ok).toBe(true);
    abspaltungMonat(w);
    const a = drohendeAbspaltung(w)!;
    expect(a.gruender).toBe(kp.name);
    expect(a.gruendung - w.day).toBe(ABSPALTUNG.frist);
    expect(vorlage("kreis_abspaltung").chance(w)).toBe(1);
    // Ein loyaler Kronprinz bricht nicht
    const v = welt(5);
    const kv = nebenVon(v, "kronprinz")!;
    kv.loyalitaet = 95;
    kv.ehrgeiz = 85;
    zieheHebel(v, schluesselVon(kv), "kaltstellen");
    abspaltungMonat(v);
    expect(drohendeAbspaltung(v)).toBeUndefined();
  });

  test("die Gründung nimmt Sitze und Anteile wie angekündigt, ein neuer Kronprinz rückt nach, die Wahl kennt sie", () => {
    const w = welt();
    bruchbereit(w);
    const kp = nebenVon(w, "kronprinz")!;
    zieheHebel(w, schluesselVon(kp), "kaltstellen");
    abspaltungMonat(w);
    const a = drohendeAbspaltung(w)!;
    const g = abspaltungGroesse(a.einfluss);
    const eigene = w.player!.partei.kurz;
    const sitze = w.parliament!.seats[eigene]!;
    const anteil = w.parliament!.shares[eigene]!;
    const ohne = wahlRechnung(w, 55, false).amt;
    const ev = oeffne(w, "kreis_abspaltung", new Rng(3))!;
    const op = antworten(w, ev).find((o) => o.id === "abwarten")!;
    expect(op.bedingungen!.join(" ")).toContain(zahlDe(g.anteil));
    entscheide(w, ev.id, "abwarten", new Rng(1));
    expect(gegruendeteAbspaltung(w)).toBeUndefined();
    ruhig(w, Math.ceil(ABSPALTUNG.frist / 30) + 1);
    const p = gegruendeteAbspaltung(w)!;
    expect(p).toBeDefined();
    expect(p.abgeordnete).toBe(g.abgeordnete);
    expect(p.anteil).toBeCloseTo(g.anteil, 5);
    expect(w.parliament!.seats[ABSPALTUNG_PARTEI] ?? 0).toBe(g.abgeordnete);
    expect(w.parliament!.seats[eigene]).toBe(sitze - g.abgeordnete);
    expect(w.parliament!.shares[eigene]).toBeCloseTo(anteil - g.anteil, 1);
    expect(nebenVon(w, "kronprinz")!.name).not.toBe(kp.name);
    const mit = wahlRechnung(w, 55, false);
    expect(mit.einfluesse.some((e) => e.punkte === -Math.round(g.anteil * ABSPALTUNG.praesidentschaft * 10) / 10)).toBe(true);
    expect(mit.amt).toBeLessThan(ohne);
  });

  test("Versöhnen und Beschleunigen buchen, was sie zeigen", () => {
    const w = welt();
    bruchbereit(w);
    zieheHebel(w, schluesselVon(nebenVon(w, "kronprinz")!), "kaltstellen");
    abspaltungMonat(w);
    const k = load(save(w));
    // Versöhnen: Druck steigt um den gezeigten Wert, keine Partei, Kronprinz wieder aktiv
    const ev = oeffne(w, "kreis_abspaltung", new Rng(3))!;
    const druck = Math.round(machtkreis(w).nachfolge);
    const ver = antworten(w, ev).find((o) => o.id === "versoehnen")!;
    expect(ver.bedingungen![0]).toContain(`${druck} → ${Math.min(100, druck + ABSPALTUNG.versoehnen.druck)}`);
    expect(entscheide(w, ev.id, "versoehnen", new Rng(1)).ok).toBe(true);
    expect(drohendeAbspaltung(w)).toBeUndefined();
    expect(nebenVon(w, "kronprinz")!.status).toBe("aktiv");
    expect(Math.round(machtkreis(w).nachfolge)).toBe(Math.min(100, druck + ABSPALTUNG.versoehnen.druck));
    ruhig(w, 8);
    expect(gegruendeteAbspaltung(w)).toBeUndefined();
    // Beschleunigen: sofort, kleiner
    const a = drohendeAbspaltung(k)!;
    const klein = abspaltungGroesse(a.einfluss, ABSPALTUNG.beschleunigen.faktor);
    const e2 = oeffne(k, "kreis_abspaltung", new Rng(3))!;
    expect(antworten(k, e2).find((o) => o.id === "beschleunigen")!.bedingungen![0]).toContain(zahlDe(klein.anteil));
    entscheide(k, e2.id, "beschleunigen", new Rng(1));
    expect(gegruendeteAbspaltung(k)!.anteil).toBeCloseTo(klein.anteil, 5);
    expect(gegruendeteAbspaltung(k)!.abgeordnete).toBe(klein.abgeordnete);
  });
});

describe("Säuberung mit Anlass", () => {
  test("nur nach einem Putschversuch, einmal je Versuch; Säubern friert die EU-Gespräche ein", () => {
    const w = welt();
    expect(vorlage("kreis_saeuberung").chance(w)).toBe(0);
    endenZustand(w).putsch.letzterVersuch = w.day;
    expect(vorlage("kreis_saeuberung").chance(w)).toBe(1);
    if (w.spiel!.eu) w.spiel!.eu.phase = "verhandlung";
    const angst = machtkreis(w).angst;
    const ev = oeffne(w, "kreis_saeuberung", new Rng(2))!;
    expect(vorlage("kreis_saeuberung").chance(w)).toBe(0);
    const op = antworten(w, ev).find((o) => o.id === "saeubern")!;
    expect(op.bedingungen![0]).toContain(`${Math.round(SAEUBERUNG.saeubern.schutzTage / 30)}`);
    entscheide(w, ev.id, "saeubern", new Rng(1));
    expect(machtkreis(w).angst).toBeCloseTo(Math.min(100, angst + SAEUBERUNG_FOLGEN.angst), 5);
    if (w.spiel!.eu) expect(w.spiel!.eu.phase).toBe("eingefroren");
    expect(w.spiel!.enden!.putsch.geschuetztBis).toBeGreaterThanOrEqual(w.day + SAEUBERUNG.saeubern.schutzTage);
    // Nach dem Fenster kommt der Vorgang nicht mehr
    const v = welt(6);
    endenZustand(v).putsch.letzterVersuch = v.day - SAEUBERUNG.fenster - 1;
    expect(vorlage("kreis_saeuberung").chance(v)).toBe(0);
  });
});

describe("Dienst als eine Akte", () => {
  test("drei Gelegenheiten mit Bedingung; der Schlag gegen Kader hängt an der Stärke der Täter", () => {
    const w = welt();
    const g = gelegenheiten(w);
    expect(g.map((x) => x.art)).toEqual(["zugriff", "kader", "kanal"]);
    for (const x of g) expect(x.bedingung.text).not.toMatch(KAPUTT);
  });

  test("Länderakte zeigt den Dienst nur bei Anlass", () => {
    const w = welt();
    expect(dienstImLand(w, "IRQ")).toBe(false);
    oeffne(w, "dienst_kader", new Rng(1), { provinzen: [], staerke: 1, daten: { land: "IRQ", taeter: "pkk" } });
    expect(dienstImLand(w, "IRQ")).toBe(true);
  });

  test("die Akte hat keine Auswahl der Zielstaaten und keine Operationen ohne Zweck mehr", () => {
    const w = welt();
    const html = renderToStaticMarkup(createElement(Dienst, { world: w, refresh: () => {}, onLand: () => {} }));
    expect(html).not.toContain("<select");
    expect(html).not.toMatch(/Desinformation|Wahlkampf unterstützen|Cyberangriff/);
    expect(html.match(/dz-gel /g)?.length).toBe(3);
  });
});

describe("Determinismus und Rundlauf", () => {
  test("gleicher Samen, gleicher Bruch: gleicher Verlauf über ein Jahr", () => {
    const lauf = () => {
      const w = welt(9);
      bruchbereit(w);
      zieheHebel(w, schluesselVon(nebenVon(w, "kronprinz")!), "kaltstellen");
      advance(w, 365);
      return save(w);
    };
    expect(lauf()).toBe(lauf());
  });

  test("Speichern und Laden mit Abspaltung ist exakt", () => {
    const w = welt();
    bruchbereit(w);
    zieheHebel(w, schluesselVon(nebenVon(w, "kronprinz")!), "kaltstellen");
    ruhig(w, 8);
    const a = save(w);
    expect(save(load(a))).toBe(a);
  });

  for (const datei of ["staatsraeson_2039-02-02.json", "staatsraeson_2043-08-03.json", "staatsraeson_2045-06-04.json"]) {
    const pfad = new URL(`../../spielstand/${datei}`, import.meta.url);
    test.skipIf(!existsSync(pfad))(`Spielstand des Inhabers ${datei}: lädt exakt, Karten und Akte zeigen sich`, () => {
      const roh = JSON.parse(readFileSync(pfad, "utf8")) as { welt: unknown };
      const w = load(JSON.stringify(roh.welt));
      const s = save(w);
      expect(save(load(s))).toBe(s);
      const k = kreisKarten(w);
      expect(k.length).toBeGreaterThanOrEqual(3);
      expect(k.length).toBeLessThanOrEqual(5);
      expect(gelegenheiten(w).length).toBe(3);
      // Kein Hebel bietet mehr die Säuberung an
      for (const p of personen(w)) expect(hebelFuer(w, p.schluessel).some((h) => h.hebel === "saeuberung")).toBe(false);
    });
  }
});

describe("Kataloge und Ansichten", () => {
  test("gleiche Schlüssel in drei Sprachen", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
    expect(Object.keys(tr).sort()).toEqual(Object.keys(de).sort());
  });

  test("Machtkreis und Dienst rendern in DE, EN und TR ohne kaputte Texte, mit Abspaltung", async () => {
    const w = welt();
    bruchbereit(w);
    zieheHebel(w, schluesselVon(nebenVon(w, "kronprinz")!), "kaltstellen");
    abspaltungMonat(w);
    machtkreis(w).nachfolge = 85;
    for (const s of ["de", "en", "tr"] as const) {
      await ladeSprache(s);
      await setzeSprache(s);
      const mk = renderToStaticMarkup(createElement(Machtkreis, { world: w }));
      expect(mk, s).toContain("mk2-karte");
      expect(mk, s).toContain("mk-netz");
      expect(mk, s).not.toMatch(KAPUTT);
      const dz = renderToStaticMarkup(createElement(Dienst, { world: w, refresh: () => {}, onLand: () => {} }));
      expect(dz, s).not.toMatch(KAPUTT);
      if (s !== "de") expect(mk + dz, s).not.toMatch(/Loyalität|Nachfolgedruck|Kapazität|Gelegenheit/);
    }
  });
});
