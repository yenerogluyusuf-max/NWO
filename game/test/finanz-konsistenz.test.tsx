import { afterEach, expect, test } from "vitest";
import { createWorld, load, save, tick } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { bipMrd, geldAusBip, schuldenMonatsrechnung, staatsgeldMonat } from "../src/sim/staatsgeld";
import { bipUsdMrd, devisenMonat, kapitalflussZerlegung } from "../src/sim/devisen";
import { monthlyUpdate } from "../src/sim/economy";
import { Rng } from "../src/sim/rng";
import { POSTEN_NACH_ID, setzePosten, haushaltMonat } from "../src/sim/haushalt";
import { baueAus, behoerden, behoerdenMonat, behoerdenVerbrauch, etatSpielraum, behoerdeSicht, vorschau, stand } from "../src/sim/behoerden";
import { BEHOERDE_NACH_ID } from "../src/data/behoerden";
import { PLAN_2026, ZINSSATZ_START } from "../src/data/haushaltsplan";
import { gutInstrumente, fuehreGutInstrumentAus } from "../src/sim/gueter";
import { GUT_NACH_ID } from "../src/data/gueter";
import { WAREN_PREIS } from "../src/sim/versorgung";
import { haushaltZustand, zinsausgabenJetzt, defizitJetzt } from "../src/sim/wirtschaft";
import { KENNZAHLEN_NACH_ID } from "../src/sim/wirtschaft-kennzahlen";
import { staatsfinanzen } from "../src/sim/staatsfinanzen";
import { Staatsfinanzen } from "../src/ui/wirtschaft/Staatsfinanzen";
import { renderToStaticMarkup } from "react-dom/server";
import { kosten } from "../src/sim/ereignis-hilfen";
import { setzeSprache, t } from "../src/i18n";

function welt() {
  const w = createWorld(turkey2026, 17);
  startAfterElection(w, { ...schnellProfil(), buendnis: "YENİ" });
  w.spiel!.kapital = 100; w.spiel!.ereignisse = [];
  return w;
}
afterEach(async () => { await setzeSprache("de"); });

test("Devisen verwenden dieselbe gewachsene und inflationierte BIP-Basis wie der Haushalt", () => {
  const w = welt(); w.economy.geldbasis!.real = 1.12; w.economy.geldbasis!.preise = 1.5;
  const vorher = save(w);
  expect(bipUsdMrd(w.economy)).toBeCloseTo(bipMrd(w) / w.economy.usdTry, 8);
  expect(save(w)).toBe(vorher);
});

test.each([["justiz", "justiz"], ["diplomatie", "aussen"]] as const)("%s bezahlt die eigene Behörde ohne doppelte Verschuldung", (id, ressort) => {
  const w = welt(); setzePosten(w, id, 2, true);
  const vorher = w.economy.debtRatio;
  expect(baueAus(w, id, "personal").ok).toBe(true);
  expect(w.economy.debtRatio).toBe(vorher);
  expect(behoerdeSicht(w, id).etat?.posten).toBe(id);
  expect(behoerdenVerbrauch(w).find(x => x.posten === id)?.ausEtat).toBeGreaterThan(0);
  expect(etatSpielraum(w, ressort)).toBeGreaterThanOrEqual(0);
});

test("Wachstum und Inflation allein tilgen keine nominalen Schulden", () => {
  const w = welt(), e = w.economy;
  w.date = "2028-02-01";
  e.geldbasis = { basisBipMrd: 100, real: 1, preise: 1, seit: "2028-01-01", letzterMonat: "2028-01" };
  Object.assign(e, { debtRatio: 20, deficit: 0, fiscalImpulse: 0, policyCost: 0, zinsMehrlast: 0, konjunkturSaldo: 0,
    growth: 12, potentialGrowth: 12, potentialShift: 0, inflation: 50, expectedInflation: 50,
    policyRate: 53, outputGap: 0, costPush: 0, sektorIndex: 0, oel: 100, euNachfrage: 100 });
  const r = new Rng(1); r.normal = () => 0;
  monthlyUpdate(e, [], r); staatsgeldMonat(w);
  expect(e.debtRatio * bipMrd(w) / 100).toBeCloseTo(20, 10);
});

test.each(["fehlend", "defekt", "ohne Szenario-BIP"])("%s: alle Geldleser verwenden denselben migrationsfreien Ersatz", art => {
  const w = welt();
  if (art === "defekt") w.economy.geldbasis!.real = -1;
  else delete w.economy.geldbasis;
  if (art === "ohne Szenario-BIP") delete w.economy.bipTryTn;
  const vorher = save(w);
  expect(bipUsdMrd(w.economy) * w.economy.usdTry).toBeCloseTo(bipMrd(w), 8);
  expect(save(w)).toBe(vorher);
  const k = load(vorher);
  expect(bipMrd(k)).toBe(bipMrd(w)); expect(k.economy.debtRatio).toBe(w.economy.debtRatio);
});

test("Reservekauf behält bei größerem BIP seinen Geldpreis und bucht ihn einmal", () => {
  const w = welt(), e = w.economy, szenario = e.bipTryTn;
  const alt = gutInstrumente(w, "erdgas").find(x => x.id === "reserve")!.bip;
  e.geldbasis!.real *= 1.2; e.geldbasis!.preise *= 1.5;
  const p = gutInstrumente(w, "erdgas").find(x => x.id === "reserve")!, g = GUT_NACH_ID.get("erdgas")!;
  expect(p.bip).toBeCloseTo(alt / 1.8, 10);
  const preis = g.verbrauch / 12 * WAREN_PREIS.erdgas * e.usdTry;
  expect(geldAusBip(w, p.bip)).toBeCloseTo(preis, 8);
  const vorher = staatsfinanzen(w).schuldenMrd;
  expect(fuehreGutInstrumentAus(w, "erdgas", "reserve").ok).toBe(true);
  expect(staatsfinanzen(w).schuldenMrd - vorher).toBeCloseTo(preis, 8);
  expect(fuehreGutInstrumentAus(w, "erdgas", "reserve").ok).toBe(false);
  expect(staatsfinanzen(w).schuldenMrd - vorher).toBeCloseTo(preis, 8);
  expect(e.bipTryTn).toBe(szenario);
});

test("Devisenabrechnung und Kennzahl rechnen die tatsächlichen Dollarflüsse mit aktuellem BIP", () => {
  const w = welt(), e = w.economy;
  e.geldbasis!.real = 1.2; e.geldbasis!.preise = 1.3;
  e.reservenNettoUsdMrd = 500; e.reservenBruttoUsdMrd = 600;
  devisenMonat(w);
  const erwartet = ((e.leistungsbilanzPctBip ?? 0) + kapitalflussZerlegung(w).ziel) / 100 / 12 * bipMrd(w) / e.usdTry;
  expect(e.reservenNettoUsdMrd - 500).toBeCloseTo(erwartet, 8);
  expect(e.reservenBruttoUsdMrd - 600).toBeCloseTo(erwartet, 8);
  expect(KENNZAHLEN_NACH_ID.reservenNetto!.treiber!(w).kopf).toContain(t("wk.t.reservenKopf", { wert: new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(erwartet) }));
  const gespeichert = save(w); devisenMonat(w); expect(save(w)).toBe(gespeichert);
});

test.each([["justiz", "justiz"], ["diplomatie", "aussen"]] as const)("%s: eigener Etat, Unterhalt, Kürzung und Jahresetat hängen zusammen", (id, ressort) => {
  const w = welt(), d = BEHOERDE_NACH_ID[id], normal = vorschau(w, id, "personal");
  setzePosten(w, "personal", 4, true);
  expect(etatSpielraum(w, ressort)).toBe(0); expect(vorschau(w, id, "personal").monate).toBe(normal.monate);
  setzePosten(w, id, -1, true);
  expect(vorschau(w, id, "personal").pk).toBe(normal.pk + 1);
  expect(vorschau(w, id, "personal").monate).toBeGreaterThan(normal.monate);
  setzePosten(w, id, 2, true);
  expect(vorschau(w, id, "personal").monate).toBeLessThan(normal.monate);
  baueAus(w, id, "personal"); const bau = structuredClone(stand(w, id).bau!);
  const gebraucht = behoerden(w).etat!.genutzt[id]!;
  w.day = bau.fertig; behoerdenMonat(w);
  expect(stand(w, id).stufen.personal).toBe(bau.ziel);
  expect(behoerden(w).etat!.genutzt[id]).toBeCloseTo(gebraucht + d.unterhalt / 12, 10);
  const debt = w.economy.debtRatio;
  w.date = `${Number(w.date.slice(0, 4)) + 1}-01-01`;
  expect(etatSpielraum(w, ressort)).toBeCloseTo(POSTEN_NACH_ID[id]!.schritt, 10);
  expect(w.economy.debtRatio).toBe(debt);
});

test.each([["justiz", "justiz"], ["diplomatie", "aussen"]] as const)("%s: Teilfinanzierung bucht ausschließlich die fehlende Summe", (id, ressort) => {
  const w = welt(); setzePosten(w, id, 1, true);
  const p = vorschau(w, id, "personal"), frei = etatSpielraum(w, ressort), vorher = w.economy.debtRatio;
  baueAus(w, id, "personal");
  expect(w.economy.debtRatio - vorher).toBeCloseTo(Math.max(0, p.bip - frei), 10);
  expect(behoerdenVerbrauch(w).find(x => x.posten === id)?.ausEtat).toBeCloseTo(Math.min(frei, p.bip), 10);
});

test("alte Personalausgaben und laufende Bauten bleiben beim Laden erhalten, ohne Erstattung oder erneuten Baupreis", () => {
  const w = welt(); setzePosten(w, "personal", 2, true); setzePosten(w, "justiz", 2, true);
  const z = behoerden(w); z.etat = { jahr: Number(w.date.slice(0, 4)), genutzt: { personal: 0.2 }, defizit: { personal: 0.03 } };
  z.stand.justiz.bau = { achse: "personal", ziel: 3, start: w.day, fertig: w.day + 30 };
  const k = load(save(w)), schulden = k.economy.debtRatio;
  expect(behoerdenVerbrauch(k).find(x => x.posten === "personal")).toMatchObject({ ausEtat: 0.2, aufsDefizit: 0.03 });
  expect(etatSpielraum(k, "finanzen")).toBeCloseTo(0.2);
  expect(etatSpielraum(k, "justiz")).toBeCloseTo(0.05);
  k.day += 30; behoerdenMonat(k);
  expect(k.economy.debtRatio).toBe(schulden);
  expect(behoerden(k).etat!.genutzt.personal).toBe(0.2);
  expect(behoerden(k).etat!.genutzt.justiz).toBeCloseTo(BEHOERDE_NACH_ID.justiz.unterhalt / 12, 10);
  expect(load(save(k)).spiel!.behoerden).toEqual(k.spiel!.behoerden);
});

test.each([
  [0, 0, 0, 0], [12, 50, 6, 0.2], [-8, -2, 3, -0.1], [3, 200, -6, 0.5], [0, 0, -600, 0],
])("Bestandsidentität bei Wachstum %s, Inflation %s, Defizit %s und FX %s", (growth, inflation, deficit, fx) => {
  const w = welt(), e = w.economy;
  e.geldbasis = { basisBipMrd: 100, real: 1, preise: 1, seit: "2028-01-01", letzterMonat: "2028-01" };
  Object.assign(e, { debtRatio: 20, growth, inflation, deficit, fiscalImpulse: 0, policyCost: 0, zinsMehrlast: 0, konjunkturSaldo: 0, usdTry: 10 * (1 + fx) });
  const before = save(w), r = schuldenMonatsrechnung(e, 10, 0.4);
  const bip = 100 * Math.pow(1 + growth / 100, 1 / 12) * Math.pow(1 + inflation / 100, 1 / 12);
  const stock = 20 + 20 * 0.4 * fx + deficit * bip / 100 / 12;
  expect(r.bipNachherMrd).toBeCloseTo(bip, 10);
  expect(r.nachherMrd).toBeCloseTo(Math.max(0, stock), 10);
  expect(r.restUeberschussMrd).toBeCloseTo(Math.max(0, -stock), 10);
  expect(r.vorherMrd + r.defizitMrd + r.wechselkursMrd + r.restUeberschussMrd).toBeCloseTo(r.nachherMrd, 10);
  expect(r.nachherQuote).toBeCloseTo(Math.max(0, stock) / bip * 100, 10);
  expect(save(w)).toBe(before);
});

test("alle Teile des Gesamtdefizits gehen einmal ein, FX bewertet keinen neuen Kredit rückwirkend", () => {
  const w = welt(), e = w.economy;
  Object.assign(e, { growth: 0, inflation: 0, debtRatio: 0, deficit: 3, fiscalImpulse: 2, policyCost: 1, zinsMehrlast: 0.7, konjunkturSaldo: 0.4 });
  const r = schuldenMonatsrechnung(e, e.usdTry / 2, 0.4);
  expect(r.wechselkursMrd).toBe(0);
  expect(r.nachherQuote).toBeCloseTo(6.3 / 12, 10);
  expect(KENNZAHLEN_NACH_ID.defizit!.treiber!(w).zeilen.reduce((s, x) => s + x.wirkung, 0)).toBeCloseTo(defizitJetzt(w), 10);
});

test.each([0, 23.8, 47.6])("Zinsdienst bei %s %% Schuldenquote ist in Haushalt, Anzeige und Defizit identisch", debtRatio => {
  const w = welt(); w.economy.debtRatio = debtRatio;
  const z = haushaltZustand(w); z.marktStart = w.economy.policyRate + w.economy.riskPremium / 100; z.zinssatz = ZINSSATZ_START;
  haushaltMonat(w);
  const zins = debtRatio * ZINSSATZ_START / 100, f = staatsfinanzen(w);
  expect(zinsausgabenJetzt(w)).toBeCloseTo(zins, 10);
  expect(f.ausgaben.find(x => x.id === "zinsen")!.quote).toBeCloseTo(zins, 10);
  expect(w.economy.zinsMehrlast).toBeCloseTo(zins - PLAN_2026.zinsenProzentBip, 10);
  expect(f.ausgabenMrd - f.einnahmenMrd).toBeCloseTo(geldAusBip(w, defizitJetzt(w)), 7);
  expect(KENNZAHLEN_NACH_ID.zinsausgaben!.treiber!(w).zeilen.reduce((s, x) => s + x.wirkung, 0)).toBeCloseTo(zins, 10);
});

test("Schuldenkennzahl zerlegt dieselbe Monatsrechnung einschließlich vollständiger Tilgung", () => {
  const w = welt(); Object.assign(w.economy, { growth: 12, inflation: 50, fiscalImpulse: -600 });
  const r = schuldenMonatsrechnung(w.economy);
  expect(KENNZAHLEN_NACH_ID.schulden!.treiber!(w).zeilen.reduce((s, x) => s + x.wirkung, 0)).toBeCloseTo(r.nachherQuote - r.vorherQuote, 10);
});

test("echter Monatswechsel speichert die Bestandsrechnung; Tageskosten schreiben den Beleg nicht um", () => {
  const w = welt(); w.date = "2028-06-30"; w.economy.geldbasis!.letzterMonat = "2028-06";
  tick(w); const r = structuredClone(w.economy.schuldenAbschluss!);
  expect(r.monat).toBe("2028-06"); expect(r.datum).toBe("2028-07-01");
  expect(r.bipNachherMrd).toBeCloseTo(bipMrd(w), 7);
  expect(r.vorherMrd + r.defizitMrd + r.wechselkursMrd + r.restUeberschussMrd).toBeCloseTo(r.nachherMrd, 7);
  const vor = staatsfinanzen(w).schuldenMrd; kosten(w, 0.2);
  expect(staatsfinanzen(w).schuldenMrd - vor).toBeCloseTo(geldAusBip(w, 0.2), 7);
  expect(w.economy.schuldenAbschluss).toEqual(r);
  const k = load(save(w)); expect(k.economy.schuldenAbschluss).toEqual(r);
  tick(w); tick(k); expect(save(k)).toBe(save(w)); expect(k.economy.schuldenAbschluss).toEqual(r);
});

test.each(["de", "en", "tr"] as const)("%s: Finanzanzeige erklärt Bestand und Monatsfluss ohne rückwirkend erfundene Belege", async lang => {
  await setzeSprache(lang); const w = welt();
  expect(renderToStaticMarkup(<Staatsfinanzen world={w} details />)).toContain(t("sf.schuldenNochOffen"));
  w.date = "2028-06-30"; w.economy.geldbasis!.letzterMonat = "2028-06"; tick(w);
  const vorher = save(w), html = renderToStaticMarkup(<Staatsfinanzen world={w} details />);
  expect(html).toContain(t("sf.schuldenFx")); expect(html).toContain(t("sf.schuldenNachher"));
  expect(html).not.toMatch(/⟦|NaN|Infinity/); expect(save(w)).toBe(vorher);
});
