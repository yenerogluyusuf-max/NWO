// Runde „Das Netz atmet“ (05.10.2026): Zusammenspiel der Maßnahmen, Gewöhnung, Sättigung, Protestdruck-Schleife, Kopplung an die Wirtschaft,
// Marktschocks, Rating und Katalog. Alle Werte sind Spielparameter, keine Tatsachen.

import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { EDGES, NODES, SYNERGIEN, type NodeSpec, type SynergieSpec } from "../src/data/politiknetz";
import { GEGENKRAEFTE, buildModel, createNet, nationalAverage, PROVINCES, stepNet, type NetModel, type NetState } from "../src/sim/netz";
import { NET } from "../src/sim/modell";
import { advance, createWorld, load, setPolicy } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { wirke } from "../src/sim/wirkung";
import { koppleNetzAnWirtschaft, marktSchock, ratingAendere, ratingDruck, ratingSicht, RATING_STUFEN } from "../src/sim/maerkte";
import { leistungsbilanzZerlegung } from "../src/sim/devisen";
import { defizitJetzt, defizitStrukturell } from "../src/sim/wirtschaft";
import { aussenweltMonat } from "../src/sim/aussenwelt";
import { weltModell } from "../src/sim/welt-modell";
import { Rng } from "../src/sim/rng";
import { katalogVon, platzhalter, registriere } from "../src/i18n";
import { zusammenspielFuer } from "../src/sim/synergien";
import type { EconomyState, World } from "../src/sim/types";
import deKat from "../src/i18n/katalog/de/netz.json";
import trKat from "../src/i18n/katalog/tr/netz.json";
import enKat from "../src/i18n/katalog/en/netz.json";
import deMarkt from "../src/i18n/katalog/de/markt.json";
import trMarkt from "../src/i18n/katalog/tr/markt.json";
import enMarkt from "../src/i18n/katalog/en/markt.json";

const ECO: EconomyState = createWorld(turkey2026, 1).economy;

const knoten = (id: string, kind: NodeSpec["kind"] = "groesse", extra?: Partial<NodeSpec>): NodeSpec => ({ id, name: id, theme: "wirtschaft", kind, text: "", start: 50, decay: 0.1, ...extra });
const massnahme = (id: string): NodeSpec => ({ id, name: id, theme: "wirtschaft", kind: "massnahme", text: "", start: 50, decay: 0, cost: 0, months: 1 });

function welt(seed = 5): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil("Netz", (n) => Math.floor(0.37 * n)));
  return w;
}

function setze(model: NetModel, s: NetState, id: string, wert: number): void {
  const i = model.index.get(id)!;
  for (let p = 0; p < PROVINCES; p++) s.values[i * PROVINCES + p] = wert;
  s.history = s.history.map((h) => {
    const k = h.slice();
    for (let p = 0; p < PROVINCES; p++) k[i * PROVINCES + p] = wert;
    return k;
  });
}

const wertVon = (model: NetModel, s: NetState, id: string): number => s.values[model.index.get(id)! * PROVINCES]!;

describe("Zusammenspiel zweier Maßnahmen", () => {
  const spec = (modus: SynergieSpec["modus"], weight = 0.01): SynergieSpec => ({ id: "t", a: "ma", b: "mb", to: "z", weight, lag: 0, modus, why: "" });
  function lauf(modus: SynergieSpec["modus"], a: number, b: number, weight = 0.01): number {
    const model = buildModel([massnahme("ma"), massnahme("mb"), knoten("z")], [], [spec(modus, weight)]);
    const s = createNet(model, ECO);
    setze(model, s, "ma", a);
    setze(model, s, "mb", b);
    stepNet(model, s, ECO);
    return wertVon(model, s, "z") - 50;
  }

  test("gleich: wirkt nur, wenn beide in dieselbe Richtung bewegt sind, mit der kleineren Abweichung", () => {
    expect(lauf("gleich", 90, 60)).toBeCloseTo(0.01 * 10, 10); // min(40, 10) = 10
    expect(lauf("gleich", 90, 50)).toBeCloseTo(0, 12); // b unverändert: kein Zusammenspiel
    expect(lauf("gleich", 90, 20)).toBeCloseTo(0, 12); // gegensinnig: nichts
    expect(lauf("gleich", 20, 30)).toBeCloseTo(-0.01 * 20, 10); // beide gesenkt: min(30, 20) = 20, negatives Vorzeichen
  });

  test("gegen: wirkt, wenn die eine erhöht und die andere gesenkt wird", () => {
    expect(lauf("gegen", 80, 30)).toBeCloseTo(0.01 * 20, 10); // min(30, 20)
    expect(lauf("gegen", 30, 80)).toBeCloseTo(-0.01 * 20, 10); // umgekehrt: Vorzeichen der ersten Maßnahme
    expect(lauf("gegen", 80, 80)).toBeCloseTo(0, 12);
  });

  test("ein negatives Gewicht wendet das Zusammenspiel gegen das Ziel", () => {
    expect(lauf("gleich", 90, 80, -0.02)).toBeCloseTo(-0.02 * 30, 10);
  });

  test("ohne Zusammenspiele rechnet das Modell wie vorher (leere Liste)", () => {
    const a = buildModel([massnahme("ma"), massnahme("mb"), knoten("z")], []);
    const s = createNet(a, ECO);
    setze(a, s, "ma", 90);
    setze(a, s, "mb", 90);
    stepNet(a, s, ECO);
    expect(wertVon(a, s, "z")).toBe(50);
  });

  test("Das echte Netz kennt mindestens 20 Zusammenspiele; alle verweisen auf Maßnahmen und Zielknoten", () => {
    expect(SYNERGIEN.length).toBeGreaterThanOrEqual(20);
    const ids = new Set(SYNERGIEN.map((s) => s.id));
    expect(ids.size).toBe(SYNERGIEN.length);
    for (const s of SYNERGIEN) {
      expect(NET.nodes[NET.index.get(s.a)!]!.kind).toBe("massnahme");
      expect(NET.nodes[NET.index.get(s.b)!]!.kind).toBe("massnahme");
      expect(NET.index.has(s.to)).toBe(true);
    }
  });

  test("Mietdeckel und Baukredite zusammen helfen dem Wohnungsbau mehr als einzeln", () => {
    const messe = (setzer: (w: World) => void): number => {
      const w = welt();
      setzer(w);
      for (let m = 0; m < 30; m++) for (let t = 0; t < 30; t++) {
        advance(w, 1);
        w.spiel!.hinweise = [];
        w.spiel!.ereignisse = [];
        w.spiel!.ende = undefined;
      }
      return nationalAverage(NET, w.net, "wohnungsbau");
    };
    const deckel = messe((w) => setPolicy(w, "m_mietdeckel", 80));
    const kredite = messe((w) => setPolicy(w, "m_baukredite", 80));
    const beide = messe((w) => {
      setPolicy(w, "m_mietdeckel", 80);
      setPolicy(w, "m_baukredite", 80);
    });
    const keine = messe(() => undefined);
    // Das Zusammenspiel kommt zur Summe der Einzelwirkungen hinzu (beide − keine > (deckel − keine) + (kredite − keine))
    expect(beide - keine).toBeGreaterThan(deckel - keine + (kredite - keine) + 0.2);
  });

  test("Die Netz-Ansicht findet die Partner einer Maßnahme", () => {
    const z = zusammenspielFuer("m_mietdeckel");
    expect(z.some((x) => x.partner === "m_baukredite" && x.ziel === "wohnungsbau")).toBe(true);
    expect(zusammenspielFuer("m_baukredite").some((x) => x.partner === "m_mietdeckel")).toBe(true);
  });
});

describe("Gewöhnung und Sättigung der Stimmung", () => {
  const modelle = (gegenkraefte: boolean): NetModel =>
    buildModel([knoten("inflation"), knoten("g", "gruppe", { decay: 0.1 })], [{ from: "inflation", to: "g", weight: 0.05, lag: 0, why: "" }], [], { gegenkraefte });

  function verlauf(gegenkraefte: boolean, monate: number): number[] {
    const model = modelle(gegenkraefte);
    const s = createNet(model, ECO);
    const out: number[] = [];
    for (let m = 0; m < monate; m++) {
      setze(model, s, "inflation", 80); // dauerhaft 30 über dem Start
      stepNet(model, s, ECO);
      out.push(wertVon(model, s, "g"));
    }
    return out;
  }

  test("Der erste Monat zählt voll; danach verblasst die Wirkung einer Dauerlage", () => {
    const mit = verlauf(true, 60);
    const ohne = verlauf(false, 60);
    // Monat 1: Bezugswert = Start, nur die Sättigung der Stimmung greift (bei 50 noch nicht)
    expect(mit[0]).toBeCloseTo(ohne[0]!, 10);
    // nach fünf Jahren liegt die Stimmung deutlich unter der Rechnung ohne Gegenkräfte
    expect(mit[59]!).toBeLessThan(ohne[59]! - 3);
    expect(mit[59]!).toBeGreaterThan(50);
  });

  test("Der Bezugswert wandert zur Quelle und steht im Spielstand", () => {
    const model = modelle(true);
    const s = createNet(model, ECO);
    for (let m = 0; m < 80; m++) {
      setze(model, s, "inflation", 80);
      stepNet(model, s, ECO);
    }
    const ref = s.bezug!["inflation"]!;
    expect(ref.length).toBe(PROVINCES);
    expect(ref[0]!).toBeGreaterThan(70);
    expect(ref[0]!).toBeLessThanOrEqual(80);
    expect(JSON.parse(JSON.stringify(s)).bezug.inflation[0]).toBeCloseTo(ref[0]!, 12);
  });

  test("Ein Spielstand ohne Bezugswerte rechnet weiter (Bezug beginnt beim Start)", () => {
    const model = modelle(true);
    const s = createNet(model, ECO);
    expect(s.bezug).toBeUndefined();
    setze(model, s, "inflation", 80);
    stepNet(model, s, ECO);
    expect(s.bezug).toBeDefined();
    expect(Number.isFinite(wertVon(model, s, "g"))).toBe(true);
  });

  test("Sättigung: Am Rand wirkt ein Schub nach außen schwächer, der Rückweg zur Mitte bleibt frei", () => {
    const model = buildModel([knoten("q"), knoten("g", "gruppe", { decay: 0 })], [{ from: "q", to: "g", weight: 0.1, lag: 0, why: "" }], []);
    const schritt = (start: number, quelle: number): number => {
      const s = createNet(model, ECO);
      setze(model, s, "g", start);
      setze(model, s, "q", quelle);
      const vorher = wertVon(model, s, "g");
      stepNet(model, s, ECO);
      return wertVon(model, s, "g") - vorher;
    };
    const mitte = schritt(50, 80);
    const rand = schritt(95, 80);
    expect(rand).toBeGreaterThan(0);
    expect(rand).toBeLessThan(mitte * 0.5);
    // Rückweg: ein negativer Schub bei einem Knoten über 50 wird nicht gebremst
    const zurueck = schritt(95, 20);
    expect(zurueck).toBeLessThan(0);
    expect(Math.abs(zurueck)).toBeGreaterThan(rand * 0.9);
  });

  test("Die Gegenkräfte sind einstellbar und haben vernünftige Standardwerte", () => {
    expect(GEGENKRAEFTE.anteil).toBeGreaterThan(0);
    expect(GEGENKRAEFTE.anteil).toBeLessThanOrEqual(1);
    expect(GEGENKRAEFTE.tempo).toBeGreaterThan(0);
    expect(GEGENKRAEFTE.saettigung).toBeGreaterThanOrEqual(0);
    expect(GEGENKRAEFTE.saettigung).toBeLessThan(1);
  });
});

describe("Das Netz: neue Größen und die Protestdruck-Schleife", () => {
  test("Die neuen Größen stehen am Ende der Liste und haben Kanten in beide Richtungen", () => {
    const ids = NODES.map((n) => n.id);
    expect(ids.slice(-3)).toEqual(["protestdruck", "lohn_preis", "ueberhitzung"]);
    for (const id of ["protestdruck", "lohn_preis", "ueberhitzung"]) {
      expect(EDGES.some((e) => e.from === id)).toBe(true);
      expect(EDGES.some((e) => e.to === id)).toBe(true);
    }
  });

  test("Keine doppelten Kanten, keine unbekannten Knoten", () => {
    const paare = new Set<string>();
    for (const e of EDGES) {
      const k = `${e.from}>${e.to}`;
      expect(paare.has(k)).toBe(false);
      paare.add(k);
      expect(NET.index.has(e.from) && NET.index.has(e.to)).toBe(true);
    }
  });

  test("Alle elf Gruppen haben jetzt ausgehende Kanten (keine Senken mehr)", () => {
    for (const g of ["rentner", "arbeitnehmer", "unternehmer", "landwirte", "junge", "beamte", "konservative", "staedtische_saekulare", "minderheiten", "nationalisten", "arme"]) {
      expect(EDGES.filter((e) => e.from === g).length).toBeGreaterThanOrEqual(2);
    }
  });

  test("Weitere Senken sind angebunden", () => {
    for (const id of ["lebenserwartung", "geburtenrate", "klimaschutz", "steuereinnahmen", "arbeitsplaetze_industrie", "produktivitaet", "wachstum"]) {
      expect(EDGES.some((e) => e.from === id)).toBe(true);
    }
  });

  test("Notstand dämpft den Protestdruck kurz und heizt ihn später an; die Legitimität zahlt", () => {
    const messe = (notstand: boolean): { mon: number; protest: number; legit: number }[] => {
      const w = welt();
      if (notstand) setPolicy(w, "m_notstand", 100);
      const out: { mon: number; protest: number; legit: number }[] = [];
      for (let m = 1; m <= 40; m++) {
        for (let t = 0; t < 30; t++) {
          advance(w, 1);
          w.spiel!.hinweise = [];
          w.spiel!.ereignisse = [];
          w.spiel!.ende = undefined;
        }
        if (m === 10 || m === 40) out.push({ mon: m, protest: nationalAverage(NET, w.net, "protestdruck"), legit: nationalAverage(NET, w.net, "legitimitaet") });
      }
      return out;
    };
    const ohne = messe(false);
    const mit = messe(true);
    expect(mit[0]!.protest).toBeLessThan(ohne[0]!.protest); // kurzfristig gedämpft
    expect(mit[1]!.protest).toBeGreaterThan(ohne[1]!.protest + 10); // langfristig deutlich höher
    expect(mit[1]!.legit).toBeLessThan(ohne[1]!.legit - 15);
  });

  test("Mindestlohn 100 bleibt nicht ohne Gegenwirkung: Schwarzarbeit, Jugendarbeitslosigkeit und der Mittelstand zahlen", () => {
    const messe = (hoch: boolean): Record<string, number> => {
      const w = welt();
      if (hoch) setPolicy(w, "m_mindestlohn", 100);
      for (let m = 0; m < 36; m++) for (let t = 0; t < 30; t++) {
        advance(w, 1);
        w.spiel!.hinweise = [];
        w.spiel!.ereignisse = [];
        w.spiel!.ende = undefined;
      }
      const n = (id: string) => nationalAverage(NET, w.net, id);
      return { informell: n("informelle_arbeit"), jugend: n("jugendarbeitslosigkeit"), mittelstand: n("mittelstand"), spirale: n("lohn_preis"), kosten: n("kostendruck"), infl: w.economy.inflation };
    };
    const ohne = messe(false);
    const mit = messe(true);
    expect(mit.informell!).toBeGreaterThan(ohne.informell! + 10);
    expect(mit.jugend!).toBeGreaterThan(ohne.jugend! + 5);
    expect(mit.mittelstand!).toBeLessThan(ohne.mittelstand! - 10);
    expect(mit.spirale!).toBeGreaterThan(ohne.spirale! + 20);
    expect(mit.infl!).toBeGreaterThan(ohne.infl!);
  });

  test("Alle Maßnahmen auf 100 sind nach drei Jahren teuer: höhere Inflation und höherer Risikoaufschlag als ohne Eingriff", () => {
    const messe = (alles: boolean): { infl: number; cds: number; anschlag: number } => {
      const w = welt();
      if (alles) for (const n of NET.nodes) if (n.kind === "massnahme") try { setPolicy(w, n.id, 100); } catch { /* nicht jede Maßnahme lässt sich setzen */ }
      for (let m = 0; m < 36; m++) for (let t = 0; t < 30; t++) {
        advance(w, 1);
        w.spiel!.hinweise = [];
        w.spiel!.ereignisse = [];
        w.spiel!.ende = undefined;
      }
      let anschlag = 0;
      for (const n of NET.nodes) {
        if (n.kind === "massnahme" || n.input) continue;
        const x = nationalAverage(NET, w.net, n.id);
        if (x <= 2 || x >= 98) anschlag += 1;
      }
      return { infl: w.economy.inflation, cds: w.economy.riskPremium, anschlag };
    };
    const ohne = messe(false);
    const alles = messe(true);
    expect(alles.infl).toBeGreaterThan(ohne.infl + 5);
    expect(alles.cds).toBeGreaterThan(ohne.cds + 100);
    // Messung vorher: 92 von 135 Größen am Anschlag (Prüfbericht 9); jetzt höchstens ein Zehntel der Größen
    expect(alles.anschlag).toBeLessThan(NET.nodes.length / 10);
  });
});

describe("Marktschocks", () => {
  test("Ein Schreck hebt Risikoaufschlag und Kurs, senkt die Reserven und hinterlässt einen abklingenden Aufschlag", () => {
    const w = welt();
    const e = w.economy;
    const cds0 = e.riskPremium;
    const kurs0 = e.usdTry;
    const res0 = e.reservenNettoUsdMrd!;
    const r = marktSchock(w, "verhaftung", 1);
    expect(e.riskPremium).toBeGreaterThan(cds0 + 30);
    expect(e.usdTry).toBeGreaterThan(kurs0 * 1.015);
    expect(e.reservenNettoUsdMrd!).toBeLessThan(res0 - 2);
    expect(e.politikRisiko!).toBeGreaterThan(10);
    expect(r.cds).toBeGreaterThan(0);
    expect(w.log[w.log.length - 1]!.kind).toBe("markt");
    // klingt ab
    const p0 = e.politikRisiko!;
    for (let m = 0; m < 12; m++) koppleNetzAnWirtschaft(w);
    expect(e.politikRisiko!).toBeLessThan(p0 * 0.3);
  });

  test("Beruhigung wirkt halb so stark und senkt den Aufschlag", () => {
    const w = welt();
    const e = w.economy;
    const cds0 = e.riskPremium;
    marktSchock(w, "reform", -1);
    expect(e.riskPremium).toBeLessThan(cds0);
    const w2 = welt();
    const cds1 = w2.economy.riskPremium;
    marktSchock(w2, "reform", 1);
    expect(w2.economy.riskPremium - cds1).toBeGreaterThan(2 * (cds0 - e.riskPremium) * 0.9);
  });

  test("Dieselbe Art im Abstand weniger Tage wirkt nur zu 30 Prozent; schwache Zentralbank verstärkt, starke dämpft", () => {
    const a = welt();
    const c0 = a.economy.riskPremium;
    marktSchock(a, "justiz", 1);
    const erster = a.economy.riskPremium - c0;
    const c1 = a.economy.riskPremium;
    marktSchock(a, "justiz", 1);
    const zweiter = a.economy.riskPremium - c1;
    expect(zweiter).toBeLessThan(erster * 0.4);
    const schwach = welt();
    schwach.economy.credibility = 0.1;
    const stark = welt();
    stark.economy.credibility = 0.9;
    const s0 = schwach.economy.riskPremium;
    const t0 = stark.economy.riskPremium;
    marktSchock(schwach, "notstand", 1);
    marktSchock(stark, "notstand", 1);
    expect(schwach.economy.riskPremium - s0).toBeGreaterThan(stark.economy.riskPremium - t0);
  });

  test("Wachposten: Wer Ausnahmerecht und Justiz beschneidet, bekommt die Reaktion der Märkte (Schwellen, kein Flackern)", () => {
    const w = welt();
    koppleNetzAnWirtschaft(w);
    const vorher = w.log.filter((l) => l.kind === "markt").length;
    wirke(w, "ausnahmerecht", 25);
    koppleNetzAnWirtschaft(w);
    expect(w.log.filter((l) => l.kind === "markt").length).toBeGreaterThan(vorher);
    // dieselbe Stufe noch einmal: kein neuer Schreck
    const nach = w.log.filter((l) => l.kind === "markt").length;
    koppleNetzAnWirtschaft(w);
    expect(w.log.filter((l) => l.kind === "markt").length).toBe(nach);
    // Institutionen im Risikoaufschlag
    const w2 = welt();
    wirke(w2, "justiz_unabhaengigkeit", -30);
    wirke(w2, "pressefreiheit", -30);
    koppleNetzAnWirtschaft(w2);
    expect(w2.economy.institutionenRisiko!).toBeGreaterThan(30);
  });
});

describe("Rating als Bestand", () => {
  test("Start BB−, Ausblick stabil; eine Stufe runter kostet Aufschlag, rauf bringt Entlastung", () => {
    const w = welt();
    expect(ratingSicht(w).stufe).toBe("BB−");
    expect(ratingSicht(w).ausblick).toBe(0);
    const c0 = w.economy.riskPremium;
    ratingAendere(w, -1);
    expect(ratingSicht(w).stufe).toBe("B+");
    expect(w.economy.riskPremium).toBeGreaterThan(c0);
    ratingAendere(w, 1);
    ratingAendere(w, 1);
    expect(ratingSicht(w).stufe).toBe("BB");
    expect(w.log.filter((l) => l.kind === "markt").length).toBeGreaterThanOrEqual(3);
  });

  test("Anhaltender Druck führt nach den üblichen Monaten zur Herabstufung, mit Ausblick davor", () => {
    const w = welt();
    ratingSicht(w);
    ratingDruck(w, 14); // die Agenturen werden strenger
    const stufen: number[] = [];
    const ausblicke: number[] = [];
    for (let m = 0; m < 9; m++) {
      koppleNetzAnWirtschaft(w);
      stufen.push(ratingSicht(w).index);
      ausblicke.push(ratingSicht(w).ausblick);
    }
    expect(ausblicke[0]).toBe(-1);
    expect(stufen[stufen.length - 1]).toBe(stufen[0]! - 1);
    expect(RATING_STUFEN[ratingSicht(w).index]).toBe("B+");
  });
});

describe("Konjunktur, Branchen und Importabhängigkeit", () => {
  test("Rezession belastet den Haushalt (Stabilisatoren), Aufschwung entlastet ihn", () => {
    const w = welt();
    const plan = defizitStrukturell(w);
    w.economy.outputGap = -3;
    koppleNetzAnWirtschaft(w);
    expect(w.economy.konjunkturSaldo!).toBeLessThan(-0.5);
    expect(defizitJetzt(w)).toBeGreaterThan(plan + 0.5);
    w.economy.outputGap = 3;
    koppleNetzAnWirtschaft(w);
    expect(defizitJetzt(w)).toBeLessThan(plan - 0.5);
  });

  test("Der Sektorenindex folgt den Branchen und wirkt auf die Leistungsbilanz", () => {
    const w = welt();
    koppleNetzAnWirtschaft(w);
    const basis = leistungsbilanzZerlegung(w).ziel;
    for (const id of ["industrie", "export", "mittelstand", "investitionen"]) wirke(w, id, -25);
    koppleNetzAnWirtschaft(w);
    expect(w.economy.sektorIndex!).toBeLessThan(-8);
    expect(leistungsbilanzZerlegung(w).ziel).toBeLessThan(basis - 0.1);
    expect(leistungsbilanzZerlegung(w).zeilen.some((z) => z.name.startsWith("Branchen"))).toBe(true);
  });

  test("Importabhängigkeit bestimmt die Wirkung des Ölpreises", () => {
    const hoch = welt();
    wirke(hoch, "energieimporte", 25);
    koppleNetzAnWirtschaft(hoch);
    const tief = welt();
    wirke(tief, "energieimporte", -25);
    koppleNetzAnWirtschaft(tief);
    expect(hoch.economy.energieFaktor!).toBeGreaterThan(1.1);
    expect(tief.economy.energieFaktor!).toBeLessThan(0.9);
  });

  test("Die Außenwelt folgt der EU im Weltmodell (EU-Nachfrage sinkt bei Rezession der EU)", () => {
    const w = welt();
    weltModell(w).laender["EU"]!.wachstum = -3;
    const rng = new Rng(7);
    for (let m = 0; m < 24; m++) aussenweltMonat(w, rng);
    expect(w.economy.euNachfrage!).toBeLessThan(97);
    const w2 = welt();
    weltModell(w2).laender["EU"]!.wachstum = 5;
    const rng2 = new Rng(7);
    for (let m = 0; m < 24; m++) aussenweltMonat(w2, rng2);
    expect(w2.economy.euNachfrage!).toBeGreaterThan(w.economy.euNachfrage! + 10);
  });
});

describe("Alte Spielstände", () => {
  const datei = join(homedir(), "Downloads", "staatsraeson_2029-11-20.json");
  test.skipIf(!existsSync(datei))("Der Stand vom 20.11.2029 lädt, ergänzt die neuen Größen und läuft zwei Jahre ohne Fehler (nur gelesen)", () => {
    const roh = JSON.parse(readFileSync(datei, "utf8")) as { welt: World };
    const w = load(JSON.stringify(roh.welt));
    expect(w.net.values.length).toBe(NET.nodes.length * PROVINCES);
    expect(w.net.start.length).toBe(NET.nodes.length * PROVINCES);
    for (let m = 0; m < 24; m++) for (let t = 0; t < 30; t++) {
      advance(w, 1);
      w.spiel!.hinweise = [];
      w.spiel!.ereignisse = [];
      w.spiel!.ende = undefined;
    }
    expect(w.net.values.every((x) => Number.isFinite(x))).toBe(true);
    expect(w.net.bezug).toBeDefined();
    expect(Number.isFinite(w.economy.riskPremium)).toBe(true);
    expect(w.economy.rating).toBeDefined();
  });

  test("Ein Netzzustand ohne die neuen Felder wird nach load() weitergerechnet (Größen am Ende, kein NaN)", () => {
    const w = welt();
    const alt = JSON.parse(JSON.stringify(w)) as World;
    // Zustand vor der Runde: drei Knoten weniger, keine Bezugswerte, keine Wirtschafts-Zusatzfelder
    const n = NET.nodes.length - 3;
    alt.net.values = alt.net.values.slice(0, n * PROVINCES);
    alt.net.start = alt.net.start.slice(0, n * PROVINCES);
    alt.net.history = alt.net.history.map((h) => h.slice(0, n * PROVINCES));
    delete alt.net.bezug;
    delete alt.economy.politikRisiko;
    delete alt.economy.rating;
    const g = load(JSON.stringify(alt));
    expect(g.net.values.length).toBe(NET.nodes.length * PROVINCES);
    advance(g, 90);
    expect(g.net.values.every((x) => Number.isFinite(x))).toBe(true);
  });
});

describe("Katalog: Netz und Märkte in drei Sprachen", () => {
  test("Schlüssel und Platzhalter stimmen in Deutsch, Türkisch und Englisch überein", () => {
    for (const [de, tr, en, name] of [
      [deKat, trKat, enKat, "netz"],
      [deMarkt, trMarkt, enMarkt, "markt"],
    ] as const) {
      const schluessel = Object.keys(de).sort();
      expect(Object.keys(tr).sort(), `${name}: tr`).toEqual(schluessel);
      expect(Object.keys(en).sort(), `${name}: en`).toEqual(schluessel);
      for (const k of schluessel) {
        const soll = platzhalter((de as Record<string, string>)[k]!);
        expect(platzhalter((tr as Record<string, string>)[k]!), `${k} (tr)`).toEqual(soll);
        expect(platzhalter((en as Record<string, string>)[k]!), `${k} (en)`).toEqual(soll);
      }
    }
  });

  test("Der deutsche Katalog stimmt mit den Texten im Datenmodul überein", () => {
    const de = deKat as Record<string, string>;
    for (const n of NODES.slice(-3)) {
      expect(de[`netz.knoten.${n.id}.name`]).toBe(n.name);
      expect(de[`netz.knoten.${n.id}.text`]).toBe(n.text);
    }
    for (const [k, v] of Object.entries(de)) {
      if (k.startsWith("netz.kante.")) {
        const [, , von, nach] = k.split(".");
        const e = EDGES.find((x) => x.from === von && x.to === nach);
        expect(e, k).toBeDefined();
        expect(e!.why, k).toBe(v);
      }
      if (k.startsWith("netz.synergie.")) {
        const s = SYNERGIEN.find((x) => `netz.synergie.${x.id}` === k);
        expect(s, k).toBeDefined();
        expect(s!.why, k).toBe(v);
      }
    }
  });

  test("Türkische und englische Texte sind nicht leer und nicht mit dem Deutschen identisch (Entwurf)", () => {
    const de = deKat as Record<string, string>;
    for (const [k, v] of Object.entries(de)) {
      if (!/\s/.test(v)) continue;
      expect((trKat as Record<string, string>)[k]!.length, k).toBeGreaterThan(2);
      expect((enKat as Record<string, string>)[k]!.length, k).toBeGreaterThan(2);
      expect((trKat as Record<string, string>)[k], k).not.toBe(v);
      expect((enKat as Record<string, string>)[k], k).not.toBe(v);
    }
  });

  test("Der Katalog ist im Laufzeit-Katalog registriert (deutsch)", () => {
    expect(katalogVon("de")["netz.knoten.protestdruck.name"]).toBe("Protestdruck");
    registriere("de", {});
    expect(katalogVon("de")["markt.rating.herab.titel"]).toBe("Herabstufung auf {nach}");
  });
});
