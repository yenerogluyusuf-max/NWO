// INN-1: Kantenformel (Democracy 4: `Ziel, f(x), Inertia`), Trägheit je Größe,
// Vier-Preise-Regel, Migration alter Spielstände und maschinenlesbarer Export.
// Alle Parameter sind Spielparameter, keine Tatsachen.

import { describe, expect, test } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EDGES, NODES, type EdgeSpec, type NodeSpec } from "../src/data/politiknetz";
import { buildModel, createNet, decayVon, formWert, nationalAverage, PROVINCES, stepNet, type NetModel, type NetState } from "../src/sim/netz";
import { NET } from "../src/sim/modell";
import { createWorld, advance, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { kapitalEinkommen } from "../src/sim/spiel";
import { preisFaktoren, pruefeVorhaben, REGELN, setPolicy, unterhaltKosten } from "../src/sim/handeln";
import { REGIONAL, WEIGHTS } from "../src/sim/regional";
import { kantenCsv, kantenZeilen, knotenZeilen } from "../src/sim/netzexport";
import { potential } from "../src/sim/economy";
import type { EconomyState } from "../src/sim/types";

const ECO: EconomyState = createWorld(turkey2026, 1).economy;

const groesse = (id: string, extra?: Partial<NodeSpec>): NodeSpec => ({ id, name: id, theme: "wirtschaft", kind: "groesse", text: "", start: 50, decay: 0.1, ...extra });

/** Kleines Testnetz: a (Quelle) → b (Ziel); die Quelle wird von Hand auf 70 gesetzt. */
function miniNetz(edge: EdgeSpec, knotenExtra?: Partial<NodeSpec>): { model: NetModel; s: NetState } {
  const model = buildModel([groesse("a"), groesse("b", knotenExtra)], [edge]);
  const s = createNet(model, ECO);
  const ia = model.index.get("a")!;
  for (let p = 0; p < PROVINCES; p++) s.values[ia * PROVINCES + p] = 70;
  s.history = s.history.map(() => s.values.slice());
  return { model, s };
}

describe("Kantenformel: Referenzwerte", () => {
  test("linear ist die Identität (bisheriges Verhalten)", () => {
    expect(formWert(undefined, 73)).toBe(73);
    expect(formWert({ typ: "linear" }, 73)).toBe(73);
  });

  test("saettigung: (1 − e^(−k·x/100)) · 100, abnehmender Grenznutzen", () => {
    expect(formWert({ typ: "saettigung", k: 2 }, 0)).toBe(0);
    expect(formWert({ typ: "saettigung", k: 2 }, 100)).toBeCloseTo((1 - Math.exp(-2)) * 100, 10); // ≈ 86,47
    expect(formWert({ typ: "saettigung", k: 2 }, 50)).toBeCloseTo((1 - Math.exp(-1)) * 100, 10); // ≈ 63,21
    // Standard-k ist 2
    expect(formWert({ typ: "saettigung" }, 100)).toBeCloseTo(formWert({ typ: "saettigung", k: 2 }, 100), 12);
  });

  test("schwelle: S-Kurve 100 / (1 + e^(−k·(x−mitte)))", () => {
    expect(formWert({ typ: "schwelle", k: 0.12, mitte: 50 }, 50)).toBeCloseTo(50, 12);
    expect(formWert({ typ: "schwelle", k: 0.12, mitte: 50 }, 70)).toBeCloseTo(100 / (1 + Math.exp(-2.4)), 10); // ≈ 91,76
    expect(formWert({ typ: "schwelle", k: 0.12, mitte: 50 }, 30)).toBeCloseTo(100 / (1 + Math.exp(2.4)), 10); // ≈ 8,24
    // Standard: k = 0,12, mitte = 50
    expect(formWert({ typ: "schwelle" }, 50)).toBeCloseTo(50, 12);
  });

  test("umkehr: (x/100)^exponent · 100 — erst nichts, dann viel", () => {
    expect(formWert({ typ: "umkehr", exponent: 2 }, 50)).toBeCloseTo(25, 12);
    expect(formWert({ typ: "umkehr", exponent: 6 }, 50)).toBeCloseTo(100 * Math.pow(0.5, 6), 12); // ≈ 1,5625
    expect(formWert({ typ: "umkehr", exponent: 6 }, 100)).toBeCloseTo(100, 12);
    // Standard-Exponent ist 2
    expect(formWert({ typ: "umkehr" }, 50)).toBeCloseTo(25, 12);
  });
});

describe("Kantenformel im Monatsschritt", () => {
  const bWert = (model: NetModel, s: NetState): number => s.values[model.index.get("b")! * PROVINCES]!;

  test("lineare Kante rechnet wie bisher: w · (x − x₀)", () => {
    const { model, s } = miniNetz({ from: "a", to: "b", weight: 0.5, lag: 0, why: "linear" });
    stepNet(model, s, ECO);
    // 50 + 0,5 · (70 − 50) − 0,1 · 0 = 60, exakt wie vor der Kantenformel
    expect(bWert(model, s)).toBe(60);
  });

  test("umkehr-Kante rechnet w · (F(x) − F(x₀))", () => {
    const { model, s } = miniNetz({ from: "a", to: "b", weight: 0.5, lag: 0, why: "potenz", form: { typ: "umkehr", exponent: 2 } });
    stepNet(model, s, ECO);
    // 50 + 0,5 · (49 − 25) = 62
    expect(bWert(model, s)).toBeCloseTo(62, 10);
  });

  test("saettigung- und schwelle-Kante rechnen die Referenzwerte", () => {
    const sat = miniNetz({ from: "a", to: "b", weight: 0.5, lag: 0, why: "sättigung", form: { typ: "saettigung", k: 2 } });
    stepNet(sat.model, sat.s, ECO);
    expect(bWert(sat.model, sat.s)).toBeCloseTo(50 + 0.5 * ((1 - Math.exp(-1.4)) * 100 - (1 - Math.exp(-1)) * 100), 10);
    const sch = miniNetz({ from: "a", to: "b", weight: 0.5, lag: 0, why: "schwelle", form: { typ: "schwelle", k: 0.12, mitte: 50 } });
    stepNet(sch.model, sch.s, ECO);
    expect(bWert(sch.model, sch.s)).toBeCloseTo(50 + 0.5 * (100 / (1 + Math.exp(-2.4)) - 50), 10);
  });

  test("beim Startwert ist der Beitrag jeder Form 0 (Ruhelage bleibt Ruhelage)", () => {
    const model = buildModel(
      [groesse("a"), groesse("b")],
      [
        { from: "a", to: "b", weight: 0.5, lag: 0, why: "s", form: { typ: "saettigung", k: 1.5 } },
        { from: "b", to: "a", weight: 0.5, lag: 1, why: "u", form: { typ: "umkehr", exponent: 3 } },
      ],
    );
    const s = createNet(model, ECO);
    for (let m = 0; m < 24; m++) stepNet(model, s, ECO);
    for (let k = 0; k < s.values.length; k++) expect(Math.abs(s.values[k]! - s.start[k]!)).toBeLessThan(1e-9);
  });

  test("Katalog-Validierung: keine Form an Eingangsgrößen, Parameter im Rahmen", () => {
    const eingang: NodeSpec = { id: "inf", name: "inf", theme: "wirtschaft", kind: "groesse", text: "", start: 0, decay: 0, input: "inflation" };
    expect(() => buildModel([eingang, groesse("b")], [{ from: "inf", to: "b", weight: 0.1, lag: 0, why: "x", form: { typ: "umkehr" } }])).toThrow(/Eingangsgröße/);
    expect(() => buildModel([groesse("a"), groesse("b")], [{ from: "a", to: "b", weight: 0.1, lag: 0, why: "x", form: { typ: "schwelle", k: -1 } }])).toThrow(/k muss positiv/);
    expect(() => buildModel([groesse("a"), groesse("b")], [{ from: "a", to: "b", weight: 0.1, lag: 0, why: "x", form: { typ: "schwelle", mitte: 120 } }])).toThrow(/mitte/);
    expect(() => buildModel([groesse("a"), groesse("b")], [{ from: "a", to: "b", weight: 0.1, lag: 0, why: "x", form: { typ: "umkehr", exponent: 0.5 } }])).toThrow(/exponent/);
  });
});

describe("Lineare Kanten bleiben bit-identisch", () => {
  // Der Algorithmus vor der Kantenformel (Referenz-Implementierung, aus sim/netz.ts übernommen).
  function stepAlt(model: NetModel, s: NetState, e: EconomyState, regional: Record<string, number[]> = {}): void {
    const n = model.nodes.length;
    const v = s.values;
    // Eingänge aus dem Wirtschaftsmodell (wie im Kern, damit vergleichbar)
    model.nodes.forEach((node, i) => {
      if (!node.input) return;
      const factors = regional[node.id];
      for (let p = 0; p < PROVINCES; p++) {
        const f = factors?.[p] ?? 1;
        switch (node.input) {
          case "inflation":
            v[i * PROVINCES + p] = e.inflation;
            break;
          case "arbeitslosigkeit":
            v[i * PROVINCES + p] = e.unemployment * f;
            break;
          case "wachstum":
            v[i * PROVINCES + p] = 50 + (e.growth - potential(e)) * 5;
            break;
          case "leitzins":
            v[i * PROVINCES + p] = e.policyRate;
            break;
          case "abwertung":
            v[i * PROVINCES + p] = e.fxChange12;
            break;
          case "defizit":
            v[i * PROVINCES + p] = 50 + (e.deficit + e.fiscalImpulse + e.policyCost + (e.zinsMehrlast ?? 0)) * 5;
            break;
          case "schulden":
            v[i * PROVINCES + p] = e.debtRatio;
            break;
        }
      }
    });
    const delta = new Float64Array(n * PROVINCES);
    const um = s.umsetzung;
    for (let j = 0; j < model.edgeFrom.length; j++) {
      const from = model.edgeFrom[j]!;
      const to = model.edgeTo[j]!;
      const w = model.edgeWeight[j]! * (um ? (um[model.nodes[from]!.id] ?? 100) / 100 : 1);
      const past = s.history[(s.month - model.edgeLag[j]! + 13 * 1000) % 13]!;
      const fo = from * PROVINCES;
      const to0 = to * PROVINCES;
      for (let p = 0; p < PROVINCES; p++) {
        delta[to0 + p] = delta[to0 + p]! + w * (past[fo + p]! - s.start[fo + p]!);
      }
    }
    model.nodes.forEach((node, i) => {
      if (node.input || node.kind === "massnahme") return;
      const o = i * PROVINCES;
      for (let p = 0; p < PROVINCES; p++) {
        const k = o + p;
        const next = v[k]! + delta[k]! - node.decay * (v[k]! - s.start[k]!);
        v[k] = Math.min(100, Math.max(0, next));
      }
    });
    s.month += 1;
    s.history[s.month % 13] = v.slice();
  }

  test("ohne Formen und ohne Trägheit rechnet der neue Kern exakt wie der alte", () => {
    // Katalog ohne die neuen Felder: das ist der Stand vor INN-1
    const knoten = NODES.map((n) => ({ ...n, traegheit: undefined }));
    const kanten = EDGES.map((e) => ({ ...e, form: undefined }));
    const model = buildModel(knoten, kanten);
    const neu = createNet(model, ECO, REGIONAL, WEIGHTS);
    const alt = createNet(model, ECO, REGIONAL, WEIGHTS);
    // Schock, damit überhaupt etwas durch das Netz fließt
    for (const s of [neu, alt]) {
      for (let k = 0; k < s.values.length; k += 997) s.values[k] = Math.min(100, s.values[k]! + 15);
      s.history = s.history.map(() => s.values.slice());
    }
    for (let m = 0; m < 8; m++) {
      stepNet(model, neu, ECO, REGIONAL);
      stepAlt(model, alt, ECO, REGIONAL);
    }
    expect(neu.values).toEqual(alt.values);
    expect(neu.month).toBe(alt.month);
  });
});

describe("Trägheit je Größe", () => {
  test("traegheit teilt den monatlichen Rücklauf (2 = halb so schnell)", () => {
    expect(decayVon(groesse("x"))).toBe(0.1);
    expect(decayVon(groesse("x", { traegheit: 2 }))).toBe(0.05);
    expect(decayVon(groesse("x", { decay: 0.03, traegheit: 2.5 }))).toBeCloseTo(0.012, 12);
  });

  test("im Monatsschritt kehrt eine träge Größe langsamer zurück", () => {
    const model = buildModel([groesse("traeg", { traegheit: 2 }), groesse("flink")], []);
    const s = createNet(model, ECO);
    for (const id of ["traeg", "flink"]) {
      const i = model.index.get(id)!;
      for (let p = 0; p < PROVINCES; p++) s.values[i * PROVINCES + p] = 70;
    }
    s.history = s.history.map(() => s.values.slice());
    stepNet(model, s, ECO);
    // 70 − 0,05 · 20 = 69 (träge) statt 70 − 0,1 · 20 = 68 (flink)
    expect(s.values[model.index.get("traeg")! * PROVINCES]!).toBeCloseTo(69, 10);
    expect(s.values[model.index.get("flink")! * PROVINCES]!).toBeCloseTo(68, 10);
  });

  test("Katalog: träge Größen sind die strukturellen, Stimmungen bleiben schnell", () => {
    const bei = (id: string) => NODES.find((n) => n.id === id);
    expect(bei("realeinkommen")?.traegheit).toBe(2);
    expect(bei("justiz_unabhaengigkeit")?.traegheit).toBe(2.5);
    expect(bei("verkehrsnetz")?.traegheit).toBe(2.5);
    expect(bei("vertrauen_regierung")?.traegheit).toBeUndefined();
    for (const n of NODES) if (n.traegheit !== undefined) expect(n.traegheit).toBeGreaterThan(0);
  });
});

describe("Vier-Preise-Regel", () => {
  test("Defaults: einfuehren = alter Preis, streichen = Exit-Preis im Rahmen 1,5–2 ×", () => {
    expect(REGELN.streichFaktor).toBeGreaterThanOrEqual(1.5);
    expect(REGELN.streichFaktor).toBeLessThanOrEqual(2);
    const ohne = preisFaktoren({ preise: undefined });
    expect(ohne).toEqual({ einfuehren: 1, aendern: 1, streichen: REGELN.streichFaktor, unterhaltMonat: 0 });
  });

  test("jede Maßnahme: der Exit-Preis ist mindestens so hoch wie das Einführen", () => {
    for (const n of NODES) {
      if (n.kind !== "massnahme") continue;
      const p = preisFaktoren(n);
      expect(p.streichen, n.id).toBeGreaterThanOrEqual(p.einfuehren);
      expect(p.unterhaltMonat, n.id).toBeGreaterThanOrEqual(0);
    }
  });

  test("explizite Preise aus dem Katalog (Spielparameter)", () => {
    const bei = (id: string) => NODES.find((n) => n.id === id)!;
    expect(preisFaktoren(bei("m_mindestlohn")).streichen).toBe(2);
    expect(preisFaktoren(bei("m_notstand")).streichen).toBe(2.5);
    expect(preisFaktoren(bei("m_notstand")).unterhaltMonat).toBe(0.3);
  });

  test("Zurücknehmen kostet mehr Kapital als Einführen (gleiche Stufenzahl)", () => {
    const w = createWorld(turkey2026, 7);
    startAfterElection(w, schnellProfil());
    // ±25 Stufen, damit die Rundung auf ganze Kapitalpunkte das Verhältnis nicht verzerrt
    // m_mindestlohn mit explizitem Exit-Preis 2
    const hoch = pruefeVorhaben(w, "m_mindestlohn", 75);
    const runter = pruefeVorhaben(w, "m_mindestlohn", 25);
    expect(runter.gesetz.pk / hoch.gesetz.pk).toBeCloseTo(2, 1);
    // Maßnahme ohne eigene Preise: der dokumentierte Default 1,6
    const hochS = pruefeVorhaben(w, "m_schulbau", 70);
    const runterS = pruefeVorhaben(w, "m_schulbau", 20);
    expect(runterS.gesetz.pk / hochS.gesetz.pk).toBeCloseTo(REGELN.streichFaktor, 1);
    // Der Exit-Hinweis steht in der Prüfung
    expect(runter.hinweise.some((h) => h.startsWith("Exit-Preis"))).toBe(true);
    expect(hoch.hinweise.some((h) => h.startsWith("Exit-Preis"))).toBe(false);
  });

  test("Unterhalt zehrt monatlich am Kapital, anteilig zur Stufe", () => {
    const w = createWorld(turkey2026, 7);
    startAfterElection(w, schnellProfil());
    const u = unterhaltKosten(w);
    expect(u.summe).toBeGreaterThan(0.2);
    expect(u.posten.map((p) => p.id)).toContain("m_notstand");
    // Der Notstand steht beim Szenariostart auf 10: 0,3 · 10/100 = 0,03
    const notstand = u.posten.find((p) => p.id === "m_notstand")!;
    expect(notstand.betrag).toBeCloseTo(0.03, 6);
    // kapitalEinkommen zieht denselben Betrag ab
    const k = kapitalEinkommen(w);
    expect(k.unterhalt).toBeCloseTo(u.summe, 12);
    // Zurückgenommene Maßnahmen kosten keinen Unterhalt mehr
    setPolicy(w, "m_notstand", 0);
    advance(w, 40);
    expect(unterhaltKosten(w).posten.find((p) => p.id === "m_notstand")).toBeUndefined();
  });
});

describe("Migration alter Spielstände", () => {
  test("alter Stand läuft mit Kantenformel, Trägheit und Unterhalt weiter", () => {
    // So sah der Spielstand vor den Erweiterungen aus: weniger Knoten, keine neuen Felder
    const w = createWorld(turkey2026, 9);
    startAfterElection(w, schnellProfil());
    advance(w, 200);
    const alt = 199 * 81;
    w.net.values.length = alt;
    w.net.start.length = alt;
    for (const s of w.net.history) s.length = alt;
    if (w.net.acute) w.net.acute.length = alt;
    delete w.spiel!.reich;
    const geladen = load(JSON.stringify(w));
    advance(geladen, 365 * 2);
    for (let i = 0; i < geladen.net.values.length; i++) expect(Number.isFinite(geladen.net.values[i]!), `Index ${i}`).toBe(true);
    expect(Number.isFinite(geladen.spiel!.kapital)).toBe(true);
    const k = kapitalEinkommen(geladen);
    expect(Number.isFinite(k.summe)).toBe(true);
    expect(k.unterhalt).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(nationalAverage(NET, geladen.net, "korruption"))).toBe(true);
  });
});

describe("Maschinenlesbarer Export (INN-1 Datenhaltung)", () => {
  test("Kantentabelle: eine Zeile je Verbindung, mit Form, Parametern und Begründung", () => {
    const zeilen = kantenZeilen();
    expect(zeilen).toHaveLength(EDGES.length);
    for (const z of zeilen) {
      expect(z.begruendung.length).toBeGreaterThan(10);
      expect(z.id).toBe(`${z.von}→${z.nach}`);
      expect(["linear", "saettigung", "schwelle", "umkehr"]).toContain(z.form);
    }
    const geformt = zeilen.filter((z) => z.form !== "linear");
    expect(geformt.length).toBeGreaterThanOrEqual(15);
    // Schlüssel-Kanten aus der Umstellung (RECHERCHE_VERTIEFUNG_RECHT_SICHERHEIT_MEDIEN)
    const bei = (id: string) => zeilen.find((z) => z.id === id)!;
    expect(bei("m_mindestlohn→realeinkommen").form).toBe("saettigung");
    expect(bei("pressefreiheit→korruption").form).toBe("umkehr");
    expect(JSON.parse(bei("pressefreiheit→korruption").parameter).exponent).toBe(6);
    expect(bei("vertrauen_maerkte→auslandskapital").form).toBe("schwelle");
    expect(JSON.parse(bei("vertrauen_maerkte→auslandskapital").parameter).mitte).toBe(45);
    expect(bei("m_notstand→ausnahmerecht").form).toBe("umkehr");
  });

  test("Knotentabelle trägt Trägheit und die vier Preise", () => {
    const zeilen = knotenZeilen();
    expect(zeilen).toHaveLength(NODES.length);
    const real = zeilen.find((z) => z.id === "realeinkommen")!;
    expect(real.traegheit).toBe(2);
    const notstand = zeilen.find((z) => z.id === "m_notstand")!;
    expect(JSON.parse(notstand.preise).streichen).toBe(2.5);
  });

  test("CSV hat Kopfzeile und eine Zeile je Kante", () => {
    const csv = kantenCsv().trimEnd().split("\n");
    expect(csv[0]).toBe("id;von;nach;gewicht;verzoegerung;form;parameter;begruendung");
    expect(csv).toHaveLength(EDGES.length + 1);
  });

  test("Export-Skript läuft über den runner.ts-Bundling-Weg und schreibt prüfbare Dateien", () => {
    const ziel = join(mkdtempSync(join(tmpdir(), "netz-export-")), "netz");
    execFileSync("node", ["scripts/netz-export.mjs", `--ziel=${ziel}`], { cwd: join(__dirname, ".."), stdio: "pipe", timeout: 240_000 });
    const csv = readFileSync(`${ziel}-kanten.csv`, "utf-8").trimEnd().split("\n");
    expect(csv).toHaveLength(EDGES.length + 1);
    expect(csv.some((z) => z.includes("saettigung"))).toBe(true);
    const json = JSON.parse(readFileSync(`${ziel}.json`, "utf-8")) as { kanten: unknown[]; knoten: unknown[] };
    expect(json.kanten).toHaveLength(EDGES.length);
    expect(json.knoten).toHaveLength(NODES.length);
    expect(existsSync(`${ziel}-knoten.csv`)).toBe(true);
  }, 300_000);
});
