// Welle E4 (07.11.2026): Rüstung, Streitkräfte, Medien und Zeitung.
//   - Die Zeitung liest Wirkungsberichte aus ihren Feldern, nie aus übersetztem Text (ENTSCHEIDUNGEN U); kein „Stufe 0 auf 0“ mehr
//   - Ein Lager je Haus: Kopf und Reiter der Zeitung zeigen dasselbe Lager wie die Medienansicht
import { afterAll, describe, expect, test } from "vitest";
import { setzeSprache } from "../src/i18n";
import { createWorld, advance } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { berichtZuVorgang, zeitungVon } from "../src/sim/zeitung";
import { medienLager } from "../src/sim/medien";
import { medienCluster } from "../src/data/medien";
import { stufenName } from "../src/data/skalen";
import type { Bericht } from "../src/sim/berichte";

function spiel(seed = 4) {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  return w;
}

/** Ein Bericht, wie berichte.ts ihn heute schreibt: Titel mit Einheiten, Zahlen in Feldern. */
function bericht(titel: string): Bericht {
  return {
    tag: 400, datum: "2029-07-01", massnahme: "m_mindestlohn", titel, monate: 12, urteil: "gut",
    zeilen: [titel], hinweis: "", name: "Mindestlohn", von: 50, auf: 60, rest: 4,
    groessen: [
      { id: "arbeitnehmer", name: "Arbeitnehmer", art: "groesse", vorher: 48, nachher: 51.5, delta: 3.5, bewertung: "erwartet", besser: true },
      { id: "inflation", name: "Inflation", art: "groesse", vorher: 40, nachher: 41, delta: 1, bewertung: "ruhig", besser: null },
      { id: "armut", name: "Armut", art: "problem", vorher: 9, nachher: 7, delta: -2, bewertung: "erwartet", besser: true },
    ],
  };
}

describe("Zeitung liest Wirkungsberichte aus Feldern (ENTSCHEIDUNGEN U)", () => {
  afterAll(async () => { await setzeSprache("de"); });

  test("Name, Stufen, Größen und Restmonate kommen aus den Feldern; kein „Stufe 0 auf 0“, kein Titel als Name", () => {
    const v = berichtZuVorgang(bericht("Mindestlohn: von 37.050 Lira netto im Monat auf 48.300 Lira netto im Monat, 12 Monate danach"), 0);
    expect(v.titel).toBe("Wirkungsprüfung: Mindestlohn");
    expect(v.fakt).not.toContain("Stufe 0 auf 0");
    expect(v.fakt).toContain(stufenName("m_mindestlohn", 50));
    expect(v.fakt).toContain(stufenName("m_mindestlohn", 60));
    expect(v.daten).toMatchObject({ typ: "bericht", name: "Mindestlohn", von: 50, auf: 60, rest: 4 });
    if (v.daten?.typ === "bericht") {
      expect(v.daten.veraenderungen[0]).toMatchObject({ name: "Arbeitnehmer", von: 48, auf: 51.5 });
      expect(v.daten.akut[0]).toMatchObject({ name: "Armut", von: 9, auf: 7 });
    }
  });

  test("Derselbe Bericht ergibt in de, en und tr dieselben Zahlen, gleich wie der Titel übersetzt ist", async () => {
    const daten = [] as unknown[];
    for (const [sprache, titel] of [["de", "Mindestlohn: von 37.050 Lira auf 48.300 Lira, 12 Monate danach"], ["en", "Minimum wage: from 37,050 lira to 48,300 lira, 12 months later"], ["tr", "Asgari ücret: 37.050 liradan 48.300 liraya, 12 ay sonra"]] as const) {
      await setzeSprache(sprache);
      const v = berichtZuVorgang(bericht(titel), 0);
      daten.push({ ...v.daten, wertung: v.wertung });
    }
    expect(daten[1]).toEqual(daten[0]);
    expect(daten[2]).toEqual(daten[0]);
  });
});

describe("Ein Lager je Haus (Abendkurier)", () => {
  test("Jedes Blatt der Monatsausgabe trägt das Lager der Medienansicht", () => {
    const w = spiel(4);
    advance(w, 70);
    const ausgabe = zeitungVon(w).archiv.at(-1)!;
    expect(ausgabe.blaetter.length).toBeGreaterThan(0);
    for (const b of ausgabe.blaetter) expect(b.lager, b.name).toBe(medienLager(w, medienCluster(b.clusterId)!));
    // Der Abendkurier ist ein angepasstes Haus, kein regierungsnahes (vorher zeigte die Zeitung „regierungsnah“, die Medienansicht „angepasst“)
    expect(medienLager(w, medienCluster("kommerz_konform")!)).toBe("angepasst");
  });
});

// ---------------------------------------------------------------------------
// Welle 2: Rüstung und Medien melden sich (sim/ereignisse-ruestung.ts, sim/ereignisse-medien.ts)

import { VORLAGEN, entscheide, oeffne } from "../src/sim/ereignisse";
import { RUESTUNG_VORGAENGE } from "../src/sim/ereignisse-ruestung";
import { MEDIEN_VORGAENGE } from "../src/sim/ereignisse-medien";
import { reichZustand, vorhabenDef } from "../src/sim/reich";
import { streitkraefte, streitkraefteMonat } from "../src/sim/streitkraefte";
import { weltZustand } from "../src/sim/laender";
import { medienVon, rsfSicht, eingriffBilanz, AKTIONEN, fuehreMedienAktionAus, MEDIEN } from "../src/sim/medien";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { setPolicy } from "../src/sim/handeln";
import { Rng } from "../src/sim/rng";
import { kommunenVon } from "../src/sim/kommunen";
import { load, save } from "../src/sim/world";
import type { World } from "../src/sim/types";

const vorlage = (id: string) => VORLAGEN.find((v) => v.id === id)!;
const knoten = (w: World, id: string) => nationalAverage(NET, w.net, id);
function frisch(seed = 5): World {
  const w = spiel(seed);
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 100;
  return w;
}

describe("Rüstung: Ein Lieferant stellt Bedingungen", () => {
  test("Kommt, solange eine Lieferung aus dem Ausland läuft, öfter bei angespannter Beziehung; ohne Lieferung nie", () => {
    const w = frisch();
    const normal = vorlage("ruestung_bedingung").chance(w);
    expect(normal).toBeGreaterThan(0);
    weltZustand(w)["USA"]!.konflikt = 60;
    expect(vorlage("ruestung_bedingung").chance(w)).toBeCloseTo(normal * RUESTUNG_VORGAENGE.bedingung.angespannt, 6);
    streitkraefte(w).laufend = streitkraefte(w).laufend.filter((b) => !b.lieferland || b.lieferland === "TUR");
    expect(vorlage("ruestung_bedingung").chance(w)).toBe(0);
  });

  test("Ersatz heimisch kostet die angezeigten Monate Baufortschritt und hebt die Rüstungsautarkie um den angezeigten Wert", () => {
    const w = frisch();
    const ev = oeffne(w, "ruestung_bedingung", new Rng(1))!;
    const vorhaben = String(ev.daten!.vorhaben);
    const l = reichZustand(w).laufend.find((x) => x.id === vorhaben)!;
    const v = vorhabenDef(vorhaben)!;
    const vor = l.fortschritt, aut = knoten(w, "ruestungsautarkie");
    const h = RUESTUNG_VORGAENGE.bedingung.heimisch;
    entscheide(w, ev.id, "heimisch", new Rng(2));
    expect(vor - l.fortschritt).toBeCloseTo(Math.min(vor, (v.kosten.bau * h.monate) / v.kosten.monate), 3);
    expect(knoten(w, "ruestungsautarkie") - aut).toBeCloseTo(h.autarkie, 3);
  });
});

describe("Rüstung: Exportanfrage (ENTSCHEIDUNGEN AA 4)", () => {
  test("Liefern bucht Export, Industriearbeitsplätze und Nationalisten mit genau den angezeigten Zahlen", () => {
    const w = frisch();
    const ev = oeffne(w, "ruestung_export", new Rng(1))!;
    expect(ev).toBeTruthy();
    const vor = { e: knoten(w, "export"), a: knoten(w, "arbeitsplaetze_industrie"), n: knoten(w, "nationalisten") };
    const p = RUESTUNG_VORGAENGE.export.liefern;
    entscheide(w, ev.id, "liefern", new Rng(2));
    expect(knoten(w, "export") - vor.e).toBeCloseTo(p.export, 3);
    expect(knoten(w, "arbeitsplaetze_industrie") - vor.a).toBeCloseTo(p.arbeit, 3);
    expect(knoten(w, "nationalisten") - vor.n).toBeCloseTo(p.nationalisten, 3);
  });
});

describe("Lieferungen erscheinen in Zeitung und Wirkungsbericht", () => {
  test("Eine fertige F-16 erzeugt einen Presse-Eintrag und einen Rückblick", () => {
    const w = frisch();
    reichZustand(w).bestand["mil_f16"] = { seit: w.date, zustand: 90 };
    reichZustand(w).laufend = reichZustand(w).laufend.filter((l) => l.id !== "mil_f16");
    streitkraefteMonat(w, false);
    const c = w.spiel!.chronik.at(-1)!;
    expect(c.presse?.sparte).toBe("politik");
    expect(c.titel).toContain(vorhabenDef("mil_f16")!.name);
    expect(w.spiel!.rueckblicke?.some((r) => r.id.includes("lieferung:"))).toBe(true);
  });
});

describe("Medien: Plattform, Enthüllung, Sendezeit", () => {
  test("Plattform: kommt bei Internetsperren, nicht ohne sie; Sperren kostet den angezeigten Pressefreiheitswert", () => {
    const w = frisch();
    expect(vorlage("medien_plattform").chance(w)).toBeGreaterThan(0);
    const w0 = frisch();
    setPolicy(w0, "m_internetsperren", 0);
    for (let p = 0; p < 81; p++) w0.net.values[NET.index.get("m_internetsperren")! * 81 + p] = 0;
    expect(vorlage("medien_plattform").chance(w0)).toBe(0);
    const ev = oeffne(w, "medien_plattform", new Rng(1))!;
    const rsf = rsfSicht(w).score, aus = medienVon(w).ausweich;
    entscheide(w, ev.id, "sperren", new Rng(2));
    expect(rsf - rsfSicht(w).score).toBeCloseTo(MEDIEN_VORGAENGE.plattform.sperren.presse!, 3);
    expect(medienVon(w).ausweich - aus).toBeCloseTo(MEDIEN_VORGAENGE.plattform.sperren.ausweich!, 3);
  });

  test("Enthüllung: eine Stammfirma macht sie wahrscheinlicher; die Prüfung holt die Ausschreibung nach", () => {
    const w = frisch();
    reichZustand(w);
    const ohne = vorlage("medien_enthuellung").chance(w);
    expect(ohne).toBeGreaterThan(0);
    const l = reichZustand(w).laufend.find((x) => !x.frei)!;
    l.vergabe = "stammfirma";
    expect(vorlage("medien_enthuellung").chance(w)).toBeCloseTo(ohne * MEDIEN_VORGAENGE.enthuellung.stammfirma, 6);
    const ev = oeffne(w, "medien_enthuellung", new Rng(1))!;
    expect(ev.daten!.vorhaben).toBe(l.id);
    entscheide(w, ev.id, "pruefen", new Rng(2));
    expect(l.vergabe).toBe("ausschreibung");
    expect(l.vergabeBis).toBeGreaterThan(w.day);
  });

  test("Sendezeit: nur vor einer Wahl; ausgewogen gewinnt Pressefreiheit und senkt die Selbstzensur des Staatsfunks", () => {
    const w = frisch();
    expect(vorlage("medien_sendezeit").chance(w)).toBe(0);
    w.spiel!.ereignisse = [];
    const naechste = kommunenVon(w).naechste;
    const vorWahl = load(save(w));
    vorWahl.date = naechste.replace(/-\d\d$/, "-01");
    expect(vorlage("medien_sendezeit").chance(vorWahl)).toBeGreaterThan(0);
    const ev = oeffne(w, "medien_sendezeit", new Rng(1))!;
    const rsf = rsfSicht(w).score, sz = medienVon(w).cluster["staatsrundfunk"]!.selbstzensur;
    entscheide(w, ev.id, "ausgewogen", new Rng(2));
    expect(rsfSicht(w).score - rsf).toBeCloseTo(-MEDIEN_VORGAENGE.sendezeit.ausgewogen.presse!, 3);
    expect(medienVon(w).cluster["staatsrundfunk"]!.selbstzensur).toBeCloseTo(Math.max(0, sz + MEDIEN_VORGAENGE.sendezeit.zensurAusgewogen), 3);
  });

  test("Eingriffskarte: bringt und kostet sind die gebuchten Zahlen", () => {
    const w = frisch();
    const b = eingriffBilanz(AKTIONEN.aufsichtsstrafe, medienCluster("opposition_masse")!);
    const vor = { v: knoten(w, "vertrauen_regierung"), s: knoten(w, "staedtische_saekulare"), rsf: rsfSicht(w).score };
    expect(fuehreMedienAktionAus(w, "aufsichtsstrafe", "opposition_masse").ok).toBe(true);
    const wert = (liste: { id: string; wert: number }[], id: string) => liste.find((x) => x.id === id)?.wert ?? 0;
    expect(knoten(w, "vertrauen_regierung") - vor.v).toBeCloseTo(wert(b.bringt, "vertrauen_regierung"), 2);
    expect(knoten(w, "staedtische_saekulare") - vor.s).toBeCloseTo(wert(b.kostet, "staedtische_saekulare"), 2);
    expect(rsfSicht(w).score - vor.rsf).toBeCloseTo(wert(b.kostet, "pressefreiheitswert"), 2);
    expect(MEDIEN.wirkung.ruhe).toBeGreaterThan(0);
  });
});

describe("Neue Vorgänge verschieben den Zufallsstrom nicht und laufen deterministisch", () => {
  test("Gleicher Samen, gleicher Verlauf über zwei Jahre", () => {
    const a = spiel(9), b = spiel(9);
    advance(a, 730);
    advance(b, 730);
    expect(save(a)).toBe(save(b));
  }, 300_000);
});
