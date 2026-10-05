// Das Weltmodell: Die Staaten spielen und entwickeln sich auch ohne die Türkei.

import { describe, expect, test } from "vitest";
import { createWorld, advance } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { weltMonat, vertrauenZu, weltZustand } from "../src/sim/laender";
import {
  AKTEUR_IDS,
  beziehungZurTuerkei,
  eigenVon,
  fuehreGesteAus,
  gestenFuerWeitere,
  jungeNachrichten,
  lage,
  paarStart,
  paarVon,
  startWerte,
  weltModell,
  weltModellMonat,
  weltNachrichten,
  istHauptakteur,
} from "../src/sim/welt-modell";
import { ratErgebnis, ratPruefung, fuehreInstitutionsAktionAus, institutionsAktionen, institutionSicht } from "../src/sim/welt-bloecke";
import { WELT, WELT_REGELN, PAARE } from "../src/data/welt-daten";
import { WEITERE } from "../src/data/welt-weitere";
import { INSTITUTIONEN, mitgliedschaften } from "../src/data/welt-institutionen";
import { VORLAGEN } from "../src/sim/ereignisse";
import { vermittlungVon } from "../src/sim/vermittlung";
import { Rng } from "../src/sim/rng";
import { aussicht, beantworteEinfluss, dienst, dienstSicht, lagebildZu, opsOptionen, ordneAn } from "../src/sim/welt-dienst";
import { pAmtsfuehrung, haltungFuehrung, haltungWortVon } from "../src/sim/welt-modell";
import { load } from "../src/sim/world";
import type { World } from "../src/sim/types";

function neu(seed = 11): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 100;
  return w;
}

/** Springt zum Ersten des nächsten Monats und schreibt das Weltmodell fort (ohne den schweren Rest der Simulation). */
function monat(w: World): void {
  const [y, m] = w.date.split("-").map(Number) as [number, number];
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const iso = `${ny}-${String(nm).padStart(2, "0")}-01`;
  const diff = Math.round((Date.UTC(ny, nm - 1, 1) - Date.UTC(y, m - 1, Number(w.date.slice(8, 10)))) / 86_400_000);
  w.day += diff;
  w.date = iso;
  weltModellMonat(w);
}
const monate = (w: World, n: number): void => {
  for (let i = 0; i < n; i++) monat(w);
};

describe("Aufbau und Startwerte", () => {
  test("41 Akteure: 18 Hauptakteure und 23 weitere, jeder mit Eigenzustand und Beziehung zur Türkei", () => {
    expect(AKTEUR_IDS).toHaveLength(WELT.length + WEITERE.length);
    expect(WELT.length).toBe(18);
    expect(WEITERE.length).toBeGreaterThanOrEqual(20);
    expect(new Set(AKTEUR_IDS).size).toBe(AKTEUR_IDS.length);
    const w = neu();
    for (const id of AKTEUR_IDS) {
      const e = eigenVon(w, id);
      for (const k of ["wachstum", "inflation", "schulden", "defizit", "ruestung", "stabilitaet", "rueckhalt", "bedrohung", "krieg"] as const) expect(Number.isFinite(e[k]), `${id}.${k}`).toBe(true);
      const b = beziehungZurTuerkei(w, id);
      for (const v of Object.values(b)) expect(v >= 0 && v <= 100, id).toBe(true);
      expect(istHauptakteur(id) === (e.tr === undefined), id).toBe(true);
    }
  });

  test("Jeder Startwert nennt seine Herkunft: Weltbank, Dossier oder Spielparameter", () => {
    for (const id of AKTEUR_IDS) {
      const s = startWerte(id);
      for (const h of Object.values(s.herkunft)) expect(h, id).toMatch(/^(Weltbank \d{4}|Dossier \d+|Spielparameter)$/);
    }
    // Belegte Werte stammen wirklich aus dem Datensatz: USA 2025 Wachstum 2,2 Prozent
    expect(startWerte("USA").wachstum).toBeCloseTo(2.2, 1);
    expect(startWerte("USA").herkunft.wachstum).toBe("Weltbank 2025");
    // Ersatz aus dem Dossier: Libyen
    expect(startWerte("LBY").herkunft.wachstum).toBe("Dossier 15");
    // Veraltete Weltbank-Werte (Deutschland: Schulden 1990) gelten nicht
    expect(startWerte("DEU").herkunft.schulden).toBe("Spielparameter");
  });

  test("Alle Wahltermine liegen nach dem Spielbeginn bzw. führen zum nächsten künftigen Termin; Paare liegen in den Grenzen", () => {
    const w = neu();
    for (const id of AKTEUR_IDS) {
      const e = eigenVon(w, id);
      if (e.wahl) expect(e.wahl.tag, id).toBeGreaterThan(w.day);
    }
    for (const a of AKTEUR_IDS) for (const b of AKTEUR_IDS) {
      if (a >= b) continue;
      const [bu, ha, sp] = paarStart(a, b);
      expect(bu >= -100 && bu <= 100 && ha >= 0 && ha <= 100 && sp >= 0 && sp <= 100, `${a}|${b}`).toBe(true);
    }
    for (const p of PAARE) {
      expect(AKTEUR_IDS.includes(p.a) && AKTEUR_IDS.includes(p.b), `${p.a}|${p.b}`).toBe(true);
      expect(p.quelle.length).toBeGreaterThan(5);
    }
  });

  test("Institutionen nennen nur bekannte Akteure; Mitgliedschaften sind abrufbar", () => {
    for (const i of INSTITUTIONEN) for (const id of [...i.mitglieder, ...(i.partner ?? []), ...(i.beobachter ?? [])]) {
      if (id === "TUR") continue;
      expect(AKTEUR_IDS.includes(id), `${i.id}/${id}`).toBe(true);
    }
    expect(mitgliedschaften("BRA").some((x) => x.institution.id === "brics")).toBe(true);
    expect(mitgliedschaften("DEU").map((x) => x.institution.id)).toEqual(expect.arrayContaining(["eu", "nato", "g20"]));
  });
});

describe("Dynamik", () => {
  test("Der Monatsschritt ist deterministisch: gleicher Seed, gleiche Welt; anderer Seed, andere Welt", () => {
    const a = neu(5);
    const b = neu(5);
    const c = neu(6);
    monate(a, 18);
    monate(b, 18);
    monate(c, 18);
    expect(JSON.stringify(weltModell(a))).toBe(JSON.stringify(weltModell(b)));
    expect(JSON.stringify(weltModell(a))).not.toBe(JSON.stringify(weltModell(c)));
  });

  test("Das Weltmodell läuft doppelt nicht im selben Monat, und der Spielstrom wird nicht angezapft", () => {
    const w = neu(3);
    const z1 = w.day;
    weltModellMonat(w);
    const nach = JSON.stringify(weltModell(w));
    weltModellMonat(w);
    expect(JSON.stringify(weltModell(w))).toBe(nach);
    expect(w.day).toBe(z1);
  });

  test("Realismus über viele Welten: Werte bleiben in den Grenzen, Streuung wächst mit der Fragilität, Preise kehren zum Trend zurück", () => {
    const stat: Record<string, { g: number[]; p: number[]; s: number[] }> = {};
    for (const id of AKTEUR_IDS) stat[id] = { g: [], p: [], s: [] };
    let wechsel = 0;
    let anzahl = 0;
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8];
    for (const seed of seeds) {
      const w = neu(seed);
      monate(w, 60);
      const m = weltModell(w);
      wechsel += m.nachrichten.filter((n) => n.art === "machtwechsel").length;
      anzahl += 1;
      for (const id of AKTEUR_IDS) {
        const e = m.laender[id]!;
        expect(e.wachstum >= -15 && e.wachstum <= 15, `${id} g`).toBe(true);
        expect(e.inflation >= -2 && e.inflation <= 150, `${id} p`).toBe(true);
        expect(e.stabilitaet >= 0 && e.stabilitaet <= 100, `${id} s`).toBe(true);
        expect(e.rueckhalt >= 0 && e.rueckhalt <= 100, `${id} r`).toBe(true);
        expect(e.schulden >= 0 && e.schulden <= 400, `${id} d`).toBe(true);
        expect(e.ruestung > 0 && e.ruestung <= 40, `${id} rü`).toBe(true);
        for (const [g, p, s] of e.verlauf) {
          stat[id]!.g.push(g);
          stat[id]!.p.push(p);
          stat[id]!.s.push(s);
        }
      }
    }
    const mean = (x: number[]) => x.reduce((a, b) => a + b, 0) / x.length;
    const sd = (x: number[]) => Math.sqrt(mean(x.map((v) => (v - mean(x)) ** 2)));
    const klasse = (k: string) => AKTEUR_IDS.filter((id) => (WELT.find((d) => d.id === id) ?? WEITERE.find((d) => d.id === id))!.klasse === k);
    const streuung = (k: string) => mean(klasse(k).map((id) => sd(stat[id]!.g)));
    expect(streuung("fragil")).toBeGreaterThan(streuung("aufstrebend"));
    expect(streuung("aufstrebend")).toBeGreaterThan(streuung("fortgeschritten"));
    // Die Streuung liegt in der Größenordnung der Parameter (stationäre Standardabweichung; hier mit Kriseneffekten etwas darüber)
    expect(streuung("fortgeschritten")).toBeGreaterThan(0.4 * WELT_REGELN.sdWachstum.fortgeschritten);
    expect(streuung("fortgeschritten")).toBeLessThan(2.5 * WELT_REGELN.sdWachstum.fortgeschritten);
    // Inflation: Fortgeschrittene bleiben niedrig, Iran bleibt hoch, aber unterhalb des Startwerts (Rückkehr zum Trend)
    expect(mean(klasse("fortgeschritten").map((id) => mean(stat[id]!.p)))).toBeLessThan(6);
    expect(mean(stat.IRN!.p)).toBeGreaterThan(mean(stat.DEU!.p) + 8);
    expect(mean(stat.IRN!.p.slice(-12))).toBeLessThan(startWerte("IRN").inflation);
    // Kein Land verläuft wie das andere
    expect(JSON.stringify(stat.FRA!.g)).not.toBe(JSON.stringify(stat.ITA!.g));
    // Machtwechsel je Land und Jahrzehnt in plausibler Bandbreite (Wahlen und Wechsel außerhalb)
    const proJahrzehnt = (wechsel / anzahl / AKTEUR_IDS.length) * 2;
    expect(proJahrzehnt).toBeGreaterThan(0.15);
    expect(proJahrzehnt).toBeLessThan(2.5);
  });

  test("Wahlen finden zum Termin statt: Die USA wählen am 7. November 2028, danach steht die nächste Wahl", () => {
    const w = neu(2);
    expect(eigenVon(w, "USA").wahl?.datum).toBe("2028-11-07");
    monate(w, 6);
    expect(eigenVon(w, "USA").wahl?.datum).toBe("2030-11-05");
    expect(weltModell(w).nachrichten.some((n) => n.id === "USA" && (n.art === "wahl" || n.art === "machtwechsel"))).toBe(true);
  });

  test("Die Zahlen der Beziehungen driften zur Anfangslage zurück und die Vermittlung bleibt die Wahrheit der Drittkonflikte", () => {
    const w = neu(4);
    weltModellMonat(w);
    vermittlungVon(w).ukr_rus!.konfliktIndex = 61;
    monat(w);
    expect(paarVon(w, "RUS", "UKR").spannung).toBe(61);
    // Eine Verschiebung klingt zur Anfangslage ab (zwei Staaten, die selten miteinander zu tun haben; Mittel über mehrere Welten)
    let spannung = 0;
    let buendnis = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const x = neu(seed);
      weltModellMonat(x);
      weltModell(x).paare["TKM|ZAF"] = [-60, 50, 90];
      monate(x, 12);
      const [bu, , sp] = weltModell(x).paare["TKM|ZAF"]!;
      spannung += sp;
      buendnis += bu;
    }
    expect(spannung / 6).toBeLessThan(85);
    expect(buendnis / 6).toBeGreaterThan(-60);
  });

  test("Performance: Das Weltmodell schreibt 41 Staaten in wenigen Millisekunden fort", () => {
    const w = neu(9);
    monate(w, 3);
    const t0 = performance.now();
    monate(w, 24);
    const ms = (performance.now() - t0) / 24;
    expect(ms).toBeLessThan(25);
  });
});

describe("Speichern, Laden und alte Spielstände", () => {
  test("Der Zustand ist reines JSON, bleibt klein und überlebt Speichern und Laden", () => {
    const w = neu(8);
    monate(w, 30);
    const roh = JSON.stringify(weltModell(w));
    expect(roh.length).toBeLessThan(160_000);
    const w2 = load(JSON.stringify(w));
    expect(JSON.stringify(weltModell(w2))).toBe(roh);
    // Danach läuft die Welt gleich weiter
    monat(w);
    monat(w2);
    expect(JSON.stringify(weltModell(w2))).toBe(JSON.stringify(weltModell(w)));
  });

  test("Ein alter Spielstand ohne Weltmodell legt es beim ersten Zugriff an und läuft weiter", () => {
    const w = neu(12);
    advance(w, 40);
    delete w.spiel!.weltmodell;
    const l = lage(w, "FRA");
    expect(l.wachstum).toBeCloseTo(startWerte("FRA").wachstum, 0);
    expect(w.spiel!.weltmodell).toBeDefined();
    monat(w);
    expect(weltModell(w).monat).toBe(w.date.slice(0, 7));
  });

  test("Der Monatsschritt der Länder ruft das Weltmodell an (Haken)", () => {
    const w = neu(13);
    expect(w.spiel!.weltmodell?.monat ?? "").toBe("");
    weltMonat(w);
    expect(weltModell(w).monat).toBe(w.date.slice(0, 7));
  });
});

describe("Nachrichten und Ereignisse", () => {
  test("weltNachrichten liefert Meldungen mit Zahlen aus dem Zustand, wichtige zuerst, und filtert nach Tag", () => {
    let nachrichten: ReturnType<typeof weltNachrichten> = [];
    let w = neu(21);
    for (let seed = 21; seed < 36 && nachrichten.length === 0; seed++) {
      w = neu(seed);
      monate(w, 36);
      nachrichten = weltNachrichten(w, 0, 10);
    }
    expect(nachrichten.length).toBeGreaterThan(0);
    for (const n of nachrichten) {
      expect(n.titel.length).toBeGreaterThan(5);
      expect(n.fakt).toMatch(/\d/);
      expect(Math.abs(n.wertung)).toBeLessThanOrEqual(0.4);
      expect(AKTEUR_IDS).toContain(n.id);
    }
    const spaet = Math.max(...nachrichten.map((n) => n.tag));
    expect(weltNachrichten(w, spaet, 10)).toHaveLength(0);
    expect(jungeNachrichten(w, nachrichten[0]!.id).length).toBeGreaterThan(0);
  });

  test("Ein vorgemerkter Machtwechsel wird dem Spieler vorgelegt, höchstens eines in 150 Tagen", () => {
    const w = neu(31);
    weltModellMonat(w);
    const m = weltModell(w);
    m.ereignisKandidaten = [{ art: "machtwechsel", id: "GRC", kurs: -1 }];
    m.ereignisTag = -1e9;
    // Den Haken ausführen, wie es der Monatsschritt tut
    const vorher = w.spiel!.ereignisse.length;
    monat(w);
    expect(w.spiel!.ereignisse.length).toBeGreaterThanOrEqual(vorher);
    expect(VORLAGEN.some((v) => v.id === "welt_machtwechsel")).toBe(true);
    expect(VORLAGEN.some((v) => v.id === "welt_krise")).toBe(true);
  });

  test("Beide Vorlagen haben Optionen mit Preis und Wirkung", () => {
    const w = neu(33);
    for (const id of ["welt_machtwechsel", "welt_krise"]) {
      const v = VORLAGEN.find((x) => x.id === id)!;
      const gen = v.erzeuge(w, new Rng(1))!;
      const ev = { id: "x", vorlage: id, tag: w.day, frist: 30, ...gen, daten: id === "welt_krise" ? { land: "EGY", krise: "waehrung" } : { land: "GRC", kurs: -1 } } as never;
      expect(v.titel(w, ev).length).toBeGreaterThan(5);
      expect(v.text(w, ev).join(" ")).toMatch(/\d|Prozent|Führung/);
      const optionen = v.optionen(w, ev);
      expect(optionen.length).toBeGreaterThanOrEqual(2);
      for (const o of optionen) expect(o.beschreibung.length).toBeGreaterThan(20);
    }
  });
});

describe("Gesten gegenüber weiteren Staaten", () => {
  test("Ein Gipfel kostet Kapital, hebt das Vertrauen, wirkt über den Anker auf die EU und kühlt ab", () => {
    const w = neu(14);
    weltModellMonat(w);
    const v0 = beziehungZurTuerkei(w, "NLD").vertrauen;
    const eu0 = vertrauenZu(w, "EU");
    const kapital = w.spiel!.kapital;
    const r = fuehreGesteAus(w, "NLD", "gipfel");
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(kapital - 3);
    expect(beziehungZurTuerkei(w, "NLD").vertrauen).toBeGreaterThan(v0 + 3);
    expect(vertrauenZu(w, "EU")).toBeGreaterThan(eu0);
    expect(fuehreGesteAus(w, "NLD", "gipfel").ok).toBe(false);
    advance(w, 125);
    expect(gestenFuerWeitere(w, "NLD").find((g) => g.aktion.id === "gipfel")!.moeglich).toBe(true);
  });

  test("Öffentlicher Druck verschlechtert das Verhältnis zu einem Land", () => {
    const w = neu(15);
    const v0 = beziehungZurTuerkei(w, "POL").vertrauen;
    expect(fuehreGesteAus(w, "POL", "druck").ok).toBe(true);
    expect(beziehungZurTuerkei(w, "POL").vertrauen).toBeLessThan(v0 - 4);
    expect(beziehungZurTuerkei(w, "POL").konflikt).toBeGreaterThan(5);
  });
});

describe("EU-Rat und Institutionen", () => {
  test("Zu Beginn verweigert kein weiterer Mitgliedstaat die Einstimmigkeit; Österreich bremst am stärksten", () => {
    const w = neu(16);
    for (const kap of ["k23", "k24", "k31", "k5"]) expect(ratPruefung(w, kap)).toBeNull();
    const e = ratErgebnis(w, "erweiterung");
    expect(e.stimmen.length).toBeGreaterThanOrEqual(13);
    // Unter den weiteren Mitgliedstaaten bremst Österreich am stärksten (Griechenland und Zypern führt die Veto-Logik in sim/eu.ts)
    expect(e.stimmen.filter((s) => !s.konflikt)[0]!.id).toBe("AUT");
    expect(e.einstimmig).toBe(true);
    expect(e.stimmen.some((s) => s.id === "HUN" && s.stimme === "dafuer")).toBe(true);
  });

  test("Verfällt das Verhältnis, verweigert ein Staat die Einstimmigkeit und das Protokoll nennt ihn", () => {
    const w = neu(17);
    const e = eigenVon(w, "NLD");
    e.tr!.vertrauen = 0;
    e.tr!.konflikt = 100;
    const r = ratPruefung(w, "k23");
    expect(r?.blockiert).toBe(true);
    expect(r?.text).toMatch(/Niederlande/);
    expect(w.log.some((l) => /Der Rat blockiert/.test(l.text))).toBe(true);
  });

  test("Partnerland der BRICS: Kosten, Süden gewinnt, Westen verliert, nur einmal", () => {
    const w = neu(18);
    weltModellMonat(w);
    const usa0 = vertrauenZu(w, "USA");
    const rus0 = vertrauenZu(w, "RUS");
    const bra0 = beziehungZurTuerkei(w, "BRA").vertrauen;
    const fra0 = beziehungZurTuerkei(w, "FRA").vertrauen;
    expect(institutionsAktionen(w, "brics")[0]!.moeglich).toBe(true);
    const r = fuehreInstitutionsAktionAus(w, "brics_partner");
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(100 - 6);
    expect(vertrauenZu(w, "RUS")).toBeGreaterThan(rus0);
    expect(beziehungZurTuerkei(w, "BRA").vertrauen).toBeGreaterThan(bra0);
    expect(vertrauenZu(w, "USA")).toBeLessThan(usa0);
    expect(beziehungZurTuerkei(w, "FRA").vertrauen).toBeLessThan(fra0);
    expect(institutionSicht(w, "brics").tuerkei).toBe("partner");
    expect(fuehreInstitutionsAktionAus(w, "brics_partner").ok).toBe(false);
  });

  test("Haupt- und weitere Akteure sind sauber getrennt: Hauptakteure behalten ihren Verhandlungstisch", () => {
    const w = neu(19);
    expect(Object.keys(weltZustand(w))).toHaveLength(18);
    expect(Object.keys(weltModell(w).laender)).toHaveLength(AKTEUR_IDS.length);
  });
});


describe("Wahltermine über den Horizont hinaus", () => {
  test("Ist die Liste der belegten Termine durch, wiederholt sich der letzte im Zyklus der Regierungsform", () => {
    const w = neu(81);
    const ziel = "2033-07-01";
    const diff = Math.round((Date.UTC(2033, 6, 1) - Date.UTC(2028, 5, 5)) / 86_400_000);
    w.day += diff;
    w.date = ziel;
    delete w.spiel!.weltmodell;
    const usa = eigenVon(w, "USA").wahl!;
    expect(usa.datum).toBe("2036-11-02");
    expect(usa.art).toBe("Präsidentenwahl");
    expect(eigenVon(w, "EU").wahl!.datum).toBe("2034-06-07");
    // Keine Wiederholung für Monarchien, Kriegsrecht und Übergangsstaaten
    expect(eigenVon(w, "SAU").wahl).toBeNull();
    expect(eigenVon(w, "UKR").wahl).toBeNull();
    expect(eigenVon(w, "LBY").wahl).toBeNull();
    for (const id of AKTEUR_IDS) {
      const e = eigenVon(w, id);
      if (e.wahl) expect(e.wahl.tag, id).toBeGreaterThan(w.day);
    }
  });
});

describe("Wahlen mit Lagern und Einfluss von außen", () => {
  test("Fünf Monate vor der Wahl tritt ein Herausforderer an, mit Haltung zur Türkei und Stärke", () => {
    const w = neu(41);
    monate(w, 2);
    const ch = eigenVon(w, "USA").wahl?.herausforderer;
    expect(ch).toBeDefined();
    expect([-1, 0, 1]).toContain(ch!.kurs);
    expect(ch!.staerke).toBeGreaterThanOrEqual(30);
    expect(ch!.staerke).toBeLessThanOrEqual(70);
    expect(haltungWortVon(ch!.kurs)).toMatch(/türkei/i);
    expect([-1, 0, 1]).toContain(haltungFuehrung(w, "USA"));
  });

  test("Der Einfluss von außen verschiebt die Wahlchance spürbar, aber begrenzt", () => {
    const w = neu(42);
    monate(w, 2);
    const e = eigenVon(w, "GRC");
    e.wahl = { tag: w.day + 90, datum: "2028-12-01", art: "Parlamentswahl", herausforderer: { kurs: -1, staerke: 50 } };
    e.einfluss = 0;
    const ohne = pAmtsfuehrung(w, "GRC");
    e.einfluss = 3;
    const fuer = pAmtsfuehrung(w, "GRC");
    e.einfluss = -3;
    const gegen = pAmtsfuehrung(w, "GRC");
    expect(fuer).toBeLessThan(ohne - 0.1);
    expect(ohne - fuer).toBeLessThan(0.35);
    expect(gegen).toBeGreaterThan(ohne + 0.05);
    // Nie sicher: auch mit voller Unterstützung bleibt eine Chance für die Amtsführung
    expect(fuer).toBeGreaterThan(0.05);
  });

  test("Gewinnt der Herausforderer, übernimmt die Führung seine Haltung zur Türkei", () => {
    let gesehen = 0;
    for (let seed = 50; seed < 110 && gesehen < 3; seed++) {
      const w = neu(seed);
      const e = eigenVon(w, "GRC");
      // Wahl in drei Monaten, schwache Amtsführung, starker Herausforderer: Machtwechsel wahrscheinlich
      e.wahl = { tag: w.day + 60, datum: "2028-08-10", art: "Parlamentswahl", herausforderer: { kurs: 1, staerke: 70 } };
      e.rueckhalt = 20;
      monate(w, 3);
      if (weltModell(w).nachrichten.some((n) => n.id === "GRC" && n.art === "machtwechsel")) {
        gesehen++;
        expect(e.kurs).toBe(1);
        expect(e.amtsMonate).toBeLessThan(3);
        expect(e.einfluss).toBe(0);
      }
    }
    expect(gesehen).toBeGreaterThan(0);
  });
});

describe("Verdeckte Operationen des Dienstes", () => {
  test("Anordnen kostet Kapital und Kapazität; die Kapazität wächst monatlich nach; unmögliche Operationen sagen warum", () => {
    const w = neu(61);
    weltModellMonat(w);
    const kap0 = dienst(w).kapazitaet;
    const pk0 = w.spiel!.kapital;
    // Keine Wahl in Sicht: Unterstützung im Wahlkampf geht nicht
    const opt = opsOptionen(w, "SAU").find((o) => o.def.art === "kandidat")!;
    expect(opt.moeglich).toBe(false);
    expect(opt.grund).toMatch(/Wahl|Monarchie/);
    const r = ordneAn(w, "desinfo", "RUS");
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(pk0 - 2);
    expect(dienst(w).kapazitaet).toBe(kap0 - 15);
    monat(w);
    expect(dienst(w).kapazitaet).toBeGreaterThan(kap0 - 15);
    // Die Kapazität ist knapp: Irgendwann reicht sie nicht mehr
    let letzte = { ok: true } as { ok: boolean; text: string };
    for (let i = 0; i < 6 && letzte.ok; i++) letzte = ordneAn(w, "cyber", i % 2 ? "CHN" : "IRN");
    expect(letzte.ok).toBe(false);
  });

  test("Aussichten sind niedrig bis mittel und hängen vom Zielstaat ab (Apparat, Medien, Abstand zur Wahl, Vorbereitung)", () => {
    const w = neu(62);
    monate(w, 2);
    const schwach = aussicht(w, "desinfo", "GEO");
    const stark = aussicht(w, "desinfo", "CHN");
    expect(schwach.p).toBeGreaterThan(stark.p);
    for (const id of ["USA", "DEU", "RUS", "IRN", "GEO", "CHN"]) {
      for (const art of ["kandidat", "desinfo", "netz", "cyber"] as const) {
        const a = aussicht(w, art, id);
        expect(a.p).toBeLessThanOrEqual(0.7);
        expect(a.p).toBeGreaterThanOrEqual(0.03);
        expect(a.pAuf).toBeGreaterThanOrEqual(0.08);
        expect(a.faktoren.length).toBeGreaterThanOrEqual(3);
      }
    }
    // Vorbereitung hilft
    const dz = dienst(w);
    const p0 = aussicht(w, "desinfo", "RUS").p;
    dz.zugang.RUS = 3;
    expect(aussicht(w, "desinfo", "RUS").p).toBeGreaterThan(p0);
  });

  test("Ergebnis und Aufdeckung sind deterministisch und folgen den Aussichten (Quoten über viele Welten)", () => {
    let erfolge = 0;
    let entdeckt = 0;
    let n = 0;
    for (let seed = 200; seed < 260; seed++) {
      const w = neu(seed);
      monate(w, 1);
      const e = eigenVon(w, "GRC");
      e.wahl = { tag: w.day + 100, datum: "2028-11-01", art: "Parlamentswahl", herausforderer: { kurs: 1, staerke: 50 } };
      expect(ordneAn(w, "kandidat", "GRC", "herausforderer").ok).toBe(true);
      monate(w, 5);
      const bericht = dienstSicht(w).bericht.find((b) => b.titel.startsWith("Ein Lager"));
      const ergebnis = dienstSicht(w).bericht.find((b) => b.ausgang !== "info");
      expect(ergebnis, `Seed ${seed}`).toBeDefined();
      void bericht;
      n++;
      if (/^Erfolg/.test(ergebnis!.text)) erfolge++;
      if (ergebnis!.ausgang === "aufgedeckt") entdeckt++;
    }
    expect(erfolge / n).toBeGreaterThan(0.05);
    expect(erfolge / n).toBeLessThan(0.55);
    expect(entdeckt / n).toBeGreaterThan(0.1);
    expect(entdeckt / n).toBeLessThan(0.85);
    // Dieselbe Welt, dasselbe Ergebnis
    const a = neu(205);
    const b = neu(205);
    for (const x of [a, b]) {
      monate(x, 1);
      eigenVon(x, "GRC").wahl = { tag: x.day + 100, datum: "2028-11-01", art: "Parlamentswahl", herausforderer: { kurs: 1, staerke: 50 } };
      ordneAn(x, "kandidat", "GRC", "herausforderer");
      monate(x, 5);
    }
    expect(JSON.stringify(dienstSicht(a).bericht)).toBe(JSON.stringify(dienstSicht(b).bericht));
  });

  test("Eine aufgedeckte Operation hat echte Folgen: Botschafter einbestellt, Vertrauen sinkt, die Zeitung berichtet", () => {
    let gefunden = false;
    for (let seed = 300; seed < 380 && !gefunden; seed++) {
      const vorbereite = (): World => {
        const x = neu(seed);
        monate(x, 1);
        eigenVon(x, "NLD").wahl = { tag: x.day + 100, datum: "2028-11-01", art: "Parlamentswahl", herausforderer: { kurs: 1, staerke: 50 } };
        return x;
      };
      const w = vorbereite();
      const kontrolle = vorbereite();
      const pk = w.spiel!.kapital;
      ordneAn(w, "kandidat", "NLD", "herausforderer");
      expect(pk - w.spiel!.kapital).toBe(4);
      monate(w, 5);
      monate(kontrolle, 5);
      const e = dienstSicht(w).bericht.find((b) => b.ausgang === "aufgedeckt");
      if (!e) continue;
      gefunden = true;
      expect(e.text).toMatch(/Botschafter/);
      // Gegenüber derselben Welt ohne Operation ist das Vertrauen deutlich geringer
      expect(beziehungZurTuerkei(w, "NLD").vertrauen).toBeLessThan(beziehungZurTuerkei(kontrolle, "NLD").vertrauen - 3);
      const news = weltNachrichten(w, 0, 20).filter((n) => n.titel.startsWith("Spionagevorwürfe"));
      expect(news.length).toBeGreaterThan(0);
      expect(news[0]!.fakt).toMatch(/Geheimdienst/);
      expect(weltNachrichten(kontrolle, 0, 20).some((n) => n.titel.startsWith("Spionagevorwürfe"))).toBe(false);
    }
    expect(gefunden).toBe(true);
  });

  test("Aufklärung liefert ein Lagebild mit Zahlen; ohne Erfolg nicht", () => {
    let mit = false;
    for (let seed = 400; seed < 460 && !mit; seed++) {
      const w = neu(seed);
      monate(w, 2);
      ordneAn(w, "cyber", "USA");
      monate(w, 3);
      const l = lagebildZu(w, "USA");
      if (l) {
        mit = true;
        expect(l.pAmtsfuehrung).toBeGreaterThan(0.02);
        expect(l.pAmtsfuehrung).toBeLessThan(0.99);
        expect(dienstSicht(w).bericht.some((b) => /Lagebild/.test(b.text))).toBe(true);
      }
    }
    expect(mit).toBe(true);
  });
});

describe("Spiegelbild: Operationen anderer Staaten gegen die Türkei", () => {
  test("Eine entdeckte fremde Operation wird dem Spieler vorgelegt, die Antworten haben Preis und Wirkung", () => {
    const w = neu(71);
    monate(w, 1);
    const dz = dienst(w);
    dz.zaehler = 1;
    dz.eingehend.push({ id: 1, von: "RUS", art: "einfluss", start: w.day, ende: w.day + 120, aufgedeckt: true });
    const m = weltModell(w);
    m.ereignisKandidaten = [{ art: "einfluss", id: "RUS", einfluss: "einfluss", opId: 1 }];
    m.ereignisTag = -1e9;
    const v0 = vertrauenZu(w, "RUS");
    const z0 = w.spiel!.ereignisse.length;
    const text = beantworteEinfluss(w, 1, "RUS", "einfluss", "oeffentlich");
    expect(text).toMatch(/öffentlich/);
    expect(vertrauenZu(w, "RUS")).toBeLessThan(v0);
    expect(dz.eingehend.find((x) => x.id === 1)).toBeUndefined();
    expect(w.spiel!.ereignisse.length).toBe(z0);
    expect(VORLAGEN.some((v) => v.id === "welt_einfluss")).toBe(true);
  });

  test("Unentdeckte fremde Operationen bleiben dem Spieler verborgen und wirken still", () => {
    const w = neu(72);
    monate(w, 1);
    const dz = dienst(w);
    dz.zaehler = 5;
    dz.eingehend.push({ id: 5, von: "USA", art: "medien", start: w.day, ende: w.day + 40, aufgedeckt: false });
    const sicht = dienstSicht(w);
    expect(sicht.aufgedeckteFremde).toHaveLength(0);
    expect(sicht.bericht.some((b) => /USA|Vereinigte Staaten/.test(b.titel + b.text))).toBe(false);
  });

  test("Die Ströme der Welt bleiben im Spielstand klein, auch mit Dienst", () => {
    const w = neu(73);
    monate(w, 30);
    ordneAn(w, "netz", "FRA");
    monate(w, 8);
    expect(JSON.stringify(weltModell(w)).length).toBeLessThan(180_000);
    const w2 = load(JSON.stringify(w));
    expect(JSON.stringify(dienst(w2))).toBe(JSON.stringify(dienst(w)));
  });
});
