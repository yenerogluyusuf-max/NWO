// Welle H1 (06.11.2026): Der Haushalt rechnet wie ein echter Staat. Ausgaben stehen im Haushaltsgesetz in Lira fest (Plan-BIP), Einnahmen
// folgen dem nominalen BIP mit der Elastizität jeder Steuer (sim/staatsgeld.ts). Geprüft: Boom, Rezession, Inflation über Plan,
// Jahreswechsel, Inflationsausgleich, Migration ohne Sprung (mit dem Spielstand des Inhabers) und Determinismus.
import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { bipMrd, haushaltsRechnung, kaufkraft, planVerhaeltnis, staatsgeldMonat } from "../src/sim/staatsgeld";
import { defizitJetzt } from "../src/sim/wirtschaft";
import { staatsfinanzen } from "../src/sim/staatsfinanzen";
import { INFLATIONSAUSGLEICH, POSTEN_NACH_ID, forschungsBudget, gleicheInflationAus, inflationsausgleichPlan, nimmKuerzungHin, realeStufe } from "../src/sim/haushalt";
import { radStuecke } from "../src/ui/wirtschaft/HaushaltsRad";
import { EINNAHMEN_ANTEIL, EINNAHMEN_ARTEN } from "../src/data/haushaltsplan";
import { ministerFuer } from "../src/sim/ministerfluss-kern";
import type { World } from "../src/sim/types";
import { ansicht, entscheide, oeffne } from "../src/sim/ereignisse";
import { Rng } from "../src/sim/rng";
import { bipWertMrd, kassenbestand } from "../src/sim/staatsgeld";

function welt(): World {
  const w = createWorld(turkey2026, 17);
  startAfterElection(w, { ...schnellProfil(), buendnis: "YENİ" });
  w.spiel!.kapital = 100;
  w.spiel!.ereignisse = [];
  return w;
}

/** Monate ohne Spielschleife fortschreiben: Planpfad mit den Planraten, Wirtschaft mit den gesetzten Raten. Nur die Geldbasis bewegt sich. */
function monate(w: World, n: number, wachstum: number, inflation: number): void {
  w.economy.growth = wachstum;
  w.economy.inflation = inflation;
  for (let i = 0; i < n; i++) {
    const [j, m] = w.date.slice(0, 7).split("-").map(Number) as [number, number];
    const neu = m === 12 ? `${j + 1}-01` : `${j}-${String(m + 1).padStart(2, "0")}`;
    w.date = `${neu}-01`;
    staatsgeldMonat(w);
  }
}

const etat = (w: World) => w.economy.etat!;

test("Der Lira-Etat entsteht beim Amtsantritt aus den heutigen Quoten: auf dem Plan rechnet alles wie vorher", () => {
  const w = welt(), e = w.economy;
  expect(etat(w).jahr).toBe(2028);
  expect(planVerhaeltnis(e)).toEqual({ plan: 1, ausgleich: 1, kaufkraft: 1 });
  expect(defizitJetzt(w)).toBeCloseTo(e.deficit + e.fiscalImpulse + e.policyCost + (e.zinsMehrlast ?? 0) - (e.konjunkturSaldo ?? 0), 10);
  expect(defizitJetzt(w)).toBeCloseTo(3.1, 6);
  // Wirtschaft genau auf dem Plan: nichts bewegt sich
  monate(w, 4, etat(w).wachstum, etat(w).inflation);
  expect(planVerhaeltnis(e).plan).toBeCloseTo(1, 12);
  expect(defizitJetzt(w)).toBeCloseTo(3.1, 6);
});

test("Unter dem Jahr bleiben die Lira-Ausgaben fest, die Einnahmen folgen der Wirtschaft", () => {
  const w = welt(), vor = staatsfinanzen(w);
  const p = etat(w);
  monate(w, 5, p.wachstum + 6, p.inflation + 10);
  const nach = staatsfinanzen(w);
  // Ausgaben ohne Zinsen: dieselben Lira (der Planpfad wächst nur mit den Planraten)
  const planFaktor = (etat(w).real * etat(w).preise) / (p.real * p.preise);
  expect(nach.vollzug.primaerMrd / vor.vollzug.primaerMrd).toBeCloseTo(planFaktor, 9);
  expect(nach.vollzug.einnahmenMrd).toBeGreaterThan(nach.vollzug.einnahmenPlanMrd);
  expect(nach.vollzug.abweichungMrd).toBeCloseTo(nach.vollzug.einnahmenMrd - nach.vollzug.einnahmenPlanMrd, 6);
  // Getrennte Summen: Einnahmen − Ausgaben = −Kredit, und neue Schulden sind keine Einnahme
  expect(nach.ausgabenMrd - nach.einnahmenMrd).toBeCloseTo(nach.kreditMrd, 6);
  expect(nach.kreditMrd).toBeCloseTo(defizitJetzt(w) * bipMrd(w) / 100, 6);
});

test("Boom über Plan: Mehreinnahmen, das Defizit sinkt", () => {
  const w = welt(), vorher = defizitJetzt(w), p = etat(w);
  monate(w, 6, p.wachstum + 5, p.inflation);
  const r = haushaltsRechnung(w.economy);
  expect(r.plan).toBeLessThan(1);
  expect(r.einnahmen).toBeGreaterThan(r.einnahmenPlan);
  expect(defizitJetzt(w)).toBeLessThan(vorher - 0.4);
  // Die Körperschaftsteuer (Elastizität 1,96) wächst stärker als die Verbrauchsteuern (0,51)
  const sz = staatsfinanzen(w).steuern, quote = (id: string) => { const z = sz.find((x) => x.id === id)!; return z.ertragMrd / z.planMrd; };
  expect(quote("kst")).toBeGreaterThan(quote("est"));
  expect(quote("est")).toBeGreaterThan(quote("oetv"));
});

test("Rezession unter Plan: ein Loch, das Defizit steigt", () => {
  const w = welt(), vorher = defizitJetzt(w), p = etat(w);
  monate(w, 6, p.wachstum - 6, p.inflation);
  const f = staatsfinanzen(w);
  expect(f.vollzug.abweichungMrd).toBeLessThan(0);
  expect(defizitJetzt(w)).toBeGreaterThan(vorher + 0.4);
});

test("Inflation über Plan: Die Lira-Ausgaben verlieren real, das Defizit sinkt, die Ressorts wirken schwächer", () => {
  const w = welt(), vorher = defizitJetzt(w), p = etat(w), forschung = forschungsBudget(w);
  // Vergleich: dieselbe Welt mit Inflation genau nach Plan
  const plan = load(save(w));
  monate(plan, 6, p.wachstum, p.inflation);
  monate(w, 6, p.wachstum, p.inflation + 12);
  const f = staatsfinanzen(w), fp = staatsfinanzen(plan), real = (x: typeof f) => x.vollzug.primaerMrd / x.basis.preise;
  expect(f.vollzug.primaerMrd).toBeCloseTo(fp.vollzug.primaerMrd, 6);
  expect(kaufkraft(w.economy)).toBeLessThan(0.97);
  expect(real(f)).toBeLessThan(real(fp) * 0.97);
  expect(f.vollzug.kaufkraftVerlustMrd).toBeGreaterThan(0);
  expect(defizitJetzt(w)).toBeLessThan(vorher - 0.5);
  expect(forschungsBudget(w)).toBeLessThan(forschung * 0.97);
  // Dieselbe Stufe wirkt real kleiner: Bildung auf Stufe 0 wirkt bei 3 % weniger Kaufkraft wie eine Kürzung
  expect(realeStufe(POSTEN_NACH_ID.bildung!, 0, 0.97)).toBeLessThan(0);
  expect(realeStufe(POSTEN_NACH_ID.rentenalter!, 2, 0.9)).toBe(2);
});

test("Im Januar beginnt ein neues Haushaltsjahr mit dem heutigen BIP als Grundlage", () => {
  const w = welt(), p = etat(w);
  w.date = "2028-06-01"; // im Takt der Geldbasis
  monate(w, 6, p.wachstum + 4, p.inflation + 6);
  expect(etat(w).jahr).toBe(2028);
  expect(planVerhaeltnis(w.economy).plan).toBeLessThan(0.99);
  monate(w, 1, p.wachstum, p.inflation);
  expect(w.date).toBe("2029-01-01");
  expect(etat(w).jahr).toBe(2029);
  expect(planVerhaeltnis(w.economy)).toEqual({ plan: 1, ausgleich: 1, kaufkraft: 1 });
});

test("Elastizitäten: belegte Werte oder ausdrücklich Spielparameter, Anteile summieren auf 1", () => {
  for (const a of EINNAHMEN_ARTEN) expect(a.elastizitaet === 1 ? /Spielparameter/.test(a.beleg) : /WP\/14\/110/.test(a.beleg)).toBe(true);
  expect(Object.values(EINNAHMEN_ANTEIL).reduce((s, x) => s + x, 0)).toBeCloseTo(1, 12);
});

test("Inflationsausgleich: Nachtrag mit Kapitalpreis stellt die Kaufkraft her, Hinnehmen kostet Loyalität", () => {
  const w = welt(), p = etat(w);
  expect(inflationsausgleichPlan(w)).toBeUndefined();
  monate(w, 6, p.wachstum, p.inflation + 12);
  const plan = inflationsausgleichPlan(w)!;
  expect(plan.kaufkraft).toBeLessThanOrEqual(INFLATIONSAUSGLEICH.schwelle);
  expect(plan.pk).toBeGreaterThan(0);
  const k = load(save(w)), pk = k.spiel!.kapital, defizit = defizitJetzt(k);
  expect(gleicheInflationAus(k).ok).toBe(true);
  expect(kaufkraft(k.economy)).toBeCloseTo(1, 12);
  expect(k.spiel!.kapital).toBeCloseTo(pk - plan.pk, 9);
  expect(defizitJetzt(k)).toBeCloseTo(defizit + plan.mehrBip, 9);
  expect(inflationsausgleichPlan(k)).toBeUndefined();
  // Die Einnahmen berührt der Nachtrag nicht
  expect(haushaltsRechnung(k.economy).einnahmen).toBeCloseTo(haushaltsRechnung(w.economy).einnahmen, 12);
  const h = load(save(w)), f = ministerFuer(h, "bildung")!, loy = f.loyalitaet;
  nimmKuerzungHin(h);
  expect(ministerFuer(h, "bildung")!.loyalitaet).toBe(Math.max(0, loy + INFLATIONSAUSGLEICH.loyalitaet));
  expect(kaufkraft(h.economy)).toBeCloseTo(kaufkraft(w.economy), 12);
});

test("Der Vorgang „Inflationsausgleich“: jede Antwort wirkt, Plakette = Buchung", () => {
  const w = welt(), p = etat(w);
  monate(w, 6, p.wachstum, p.inflation + 12);
  const ev = oeffne(w, "inflationsausgleich", new Rng(7))!;
  const a = ansicht(w, ev);
  expect(a.optionen.map((o) => o.id)).toEqual(["nachtrag", "steuer", "hinnehmen"]);
  const netto = (x: World) => (x.economy.debtRatio * bipWertMrd(x.economy)) / 100 - kassenbestand(x.economy);
  for (const o of a.optionen) {
    if (o.sperre) continue;
    const k = load(save(w)), kap = k.spiel!.kapital, n0 = netto(k), vorher = save(k);
    expect(entscheide(k, ev.id, o.id, new Rng(3)).ok).toBe(true);
    expect(save(k)).not.toBe(vorher);
    expect(kap - k.spiel!.kapital).toBeCloseTo(o.preis.kapital, 6);
    expect(((netto(k) - n0) / bipWertMrd(k.economy)) * 100).toBeCloseTo(o.preis.bip, 2);
    if (o.id !== "hinnehmen") expect(kaufkraft(k.economy)).toBeCloseTo(1, 9);
  }
});

test("Haushaltsrad: Einnahmen und Lücke getrennt, der Ring geht trotzdem auf", () => {
  const w = welt(), r = radStuecke(w);
  const steuern = r.innen.filter((x) => !x.abgesetzt).reduce((s, x) => s + x.mrd, 0);
  expect(steuern).toBeCloseTo(r.einnahmenMrd, 6);
  const kredit = r.innen.find((x) => x.id === "kredit")!;
  expect(kredit.abgesetzt).toBe(true);
  expect(kredit.mrd).toBeCloseTo(r.kreditMrd, 6);
  expect(r.einnahmenMrd + r.kreditMrd).toBeCloseTo(r.ausgabenMrd, 6);
  expect(r.einnahmenMrd).toBeLessThan(r.ausgabenMrd);
});

test("Determinismus: gleicher Samen, gleicher Verlauf über zwei Haushaltsjahre", () => {
  const a = welt(), b = welt();
  advance(a, 560);
  advance(b, 560);
  expect(a.economy.etat!.jahr).toBe(2029);
  expect(save(a)).toBe(save(b));
});

// Der Spielstand des Inhabers (Kopie, nicht eingecheckt): fehlt er, entfällt der Test
const INHABER = new URL("../../spielstand/staatsraeson_2039-02-02.json", import.meta.url);
test.skipIf(!existsSync(INHABER))("Migration mit dem Spielstand des Inhabers: kein Sprung beim Laden, 24 Monate ruhig", () => {
  const roh = JSON.parse(readFileSync(INHABER, "utf8")) as { welt: World };
  const e0 = roh.welt.economy;
  expect(e0.etat).toBeUndefined();
  const alt = e0.deficit + e0.fiscalImpulse + e0.policyCost + (e0.zinsMehrlast ?? 0) - (e0.konjunkturSaldo ?? 0);
  const w = load(JSON.stringify(roh.welt));
  expect(w.economy.etat?.jahr).toBe(2039);
  expect(defizitJetzt(w)).toBeCloseTo(alt, 9);
  expect(w.economy.konjunkturUebergang).toBeDefined();
  // Erneutes Laden migriert nicht doppelt
  expect(defizitJetzt(load(save(w)))).toBeCloseTo(alt, 9);
  const verlauf = [defizitJetzt(w)];
  for (let m = 0; m < 24; m++) {
    do advance(w, 1); while (w.date.slice(8) !== "02");
    verlauf.push(defizitJetzt(w));
  }
  const spruenge = verlauf.slice(1).map((x, i) => Math.abs(x - verlauf[i]!));
  expect(Math.max(...spruenge)).toBeLessThan(0.6);
  expect(spruenge[0]).toBeLessThan(0.25);
  expect(Math.max(...verlauf)).toBeLessThan(6);
  expect(w.economy.konjunkturUebergang).toBeUndefined();
}, 120_000);
