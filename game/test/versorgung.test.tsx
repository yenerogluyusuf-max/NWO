import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { aussenZustand } from "../src/sim/diplomatie";
import { fuehreGutInstrumentAus, gueterMonat, gueterSicht, gueterZustand, setzeVersorgungsPrioritaet } from "../src/sim/gueter";
import { militaerVersorgung, produktionsVersorgung } from "../src/sim/versorgung";
import { infraZustand } from "../src/sim/infrastruktur";
import { devisenMonat } from "../src/sim/devisen";
import { eigenStaerke, kriegMit, kriegMonat } from "../src/sim/krieg";
import { weltZustand } from "../src/sim/laender";
import { beginneAusbau, streitkraefte, streitkraefteMonat } from "../src/sim/streitkraefte";
import { Rng } from "../src/sim/rng";
import { Inventar } from "../src/ui/gueter/Inventar";
import { KriegDossier } from "../src/ui/welt/KriegDossier";
import { setzeSprache } from "../src/i18n";
import type { KriegVorgang } from "../src/sim/krieg-typen";
import type { World } from "../src/sim/types";

function welt(): World {
  const w = createWorld(turkey2026, 17);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 150;
  aussenZustand(w).energie.hormus = "offen";
  return w;
}
function knapp(w: World): void {
  w.spiel!.kriege = [{ id: "knapp", land: "RUS", phase: "krieg" } as KriegVorgang];
  gueterZustand(w).lager.erdoel = 0;
  gueterZustand(w).lager.erdgas = 0;
  aussenZustand(w).energie.hormus = "geschlossen";
}
const fluss = (w: World, id: string) => gueterSicht(w).find(g => g.def.id === id)!.fluss;
afterEach(async () => { await setzeSprache("de"); });

describe("Durchgehende Versorgung", () => {
  test("jede Menge hat eine Herkunft und Verwendung, auch im Krieg; Abschluss ist einmalig", () => {
    const w = welt(); knapp(w);
    gueterMonat(w);
    for (const f of Object.values(w.spiel!.gueter!.bilanz!.waren)) {
      expect(f!.anfang + f!.produktion + f!.importiert).toBeCloseTo(f!.geliefert + f!.militaerGeliefert + f!.exportiert + f!.ende + f!.verlust, 8);
      expect(f!.ende).toBeGreaterThanOrEqual(0);
      expect(f!.geliefert + f!.fehl).toBeCloseTo(f!.bedarf, 8);
    }
    const vorher = JSON.stringify(w.spiel!.gueter);
    gueterMonat(w);
    expect(JSON.stringify(w.spiel!.gueter)).toBe(vorher);
  });

  test("Reserveauftrag ist keine Sofortware; Teillieferung braucht Kapazität, kein zweiter Kauf bei offenem Auftrag", () => {
    const w = welt();
    const start = gueterZustand(w).lager.erdoel!;
    expect(fuehreGutInstrumentAus(w, "erdoel", "reserve").ok).toBe(true);
    expect(gueterZustand(w).lager.erdoel).toBe(start);
    const bezahlt = w.economy.debtRatio;
    expect(fuehreGutInstrumentAus(w, "erdoel", "reserve").ok).toBe(false);
    expect(w.economy.debtRatio).toBe(bezahlt);
    expect(fluss(w, "erdoel").reserveLieferung).toBe(0);
    w.day += 30;
    const erwartet = fluss(w, "erdoel").reserveLieferung;
    expect(erwartet).toBeGreaterThan(0);
    expect(erwartet).toBeLessThan(w.spiel!.gueter!.auftraege![0]!.rest);
    gueterMonat(w);
    expect(w.spiel!.gueter!.bilanz!.waren.erdoel!.reserveLieferung).toBe(erwartet);
    expect(w.economy.debtRatio).toBe(bezahlt);
  });

  test("Hafenkapazität begrenzt Lieferungen, Entlastung hilft, Strom wird nicht gelagert", () => {
    const w = welt();
    const normal = fluss(w, "elektronik").importiert;
    const exportNormal = fluss(w, "getreide").exportiert;
    const h = infraZustand(w).netze.hafen;
    h.kap[0] = 0.2;
    expect(fluss(w, "elektronik").importiert).toBeLessThan(normal);
    expect(fluss(w, "getreide").exportiert).toBeLessThan(exportNormal);
    h.kap[0] = 1;
    expect(fluss(w, "elektronik").importiert).toBeCloseTo(normal);
    gueterMonat(w);
    expect(w.spiel!.gueter!.lager.strom).toBe(0);
  });

  test("Umleitung wirkt erst nach Vorlauf und verursacht tatsächliche Mehrkosten", () => {
    const w = welt(); knapp(w);
    const vor = fluss(w, "erdoel");
    fuehreGutInstrumentAus(w, "erdoel", "quelle");
    expect(fluss(w, "erdoel").importiert).toBeCloseTo(vor.importiert);
    w.day += 30;
    const nach = fluss(w, "erdoel");
    expect(nach.importiert).toBeGreaterThan(vor.importiert);
    expect(nach.importUsdMrd / nach.importiert).toBeGreaterThan(vor.importUsdMrd / vor.importiert);
  });

  test("Zivil- und Militärpriorität verteilen dieselbe knappe Ware mit unterschiedlichen Folgen", () => {
    const zivil = welt(); knapp(zivil);
    const mil = load(save(zivil));
    setzeVersorgungsPrioritaet(zivil, "zivil");
    setzeVersorgungsPrioritaet(mil, "militaer");
    gueterMonat(zivil); gueterMonat(mil);
    const z = zivil.spiel!.gueter!.bilanz!.waren.erdoel!;
    const m = mil.spiel!.gueter!.bilanz!.waren.erdoel!;
    expect(z.geliefert).toBeGreaterThan(m.geliefert);
    expect(m.militaerGeliefert).toBeGreaterThan(z.militaerGeliefert);
    expect(m.geliefert + m.militaerGeliefert).toBeCloseTo(z.geliefert + z.militaerGeliefert);
    expect(militaerVersorgung(zivil).faktor).toBeLessThan(militaerVersorgung(mil).faktor);
  });

  test("Gasengpass drosselt Strom und Dünger im Folgemonat", () => {
    const w = welt(); knapp(w);
    gueterMonat(w);
    expect(w.spiel!.gueter!.bilanz!.waren.erdgas!.fehl).toBeGreaterThan(0);
    expect(produktionsVersorgung(w, "strom")).toBeLessThan(1);
    expect(produktionsVersorgung(w, "duenger")).toBeLessThan(1);
    expect(aussenZustand(w).energie.versorgung).toBeLessThan(100);
  });

  test("ein beendeter Lieferkonflikt heilt Versorgung und Produktion mit zeitlichem Nachlauf", () => {
    const w = welt(); knapp(w);
    const monat = (m: number) => { w.date = `2028-${String(m).padStart(2, "0")}-01`; w.day += 30; gueterMonat(w); };
    monat(6); monat(7);
    const krise = w.spiel!.gueter!.bilanz!.waren;
    expect(krise.erdgas!.geliefert).toBeLessThan(krise.erdgas!.bedarf);
    const duengerKrise = krise.duenger!.produktion;
    w.spiel!.kriege = [];
    aussenZustand(w).energie.hormus = "offen";
    monat(8); monat(9); monat(10);
    const erholt = w.spiel!.gueter!.bilanz!.waren;
    expect(erholt.erdgas!.geliefert).toBeCloseTo(erholt.erdgas!.bedarf);
    expect(erholt.duenger!.produktion).toBeGreaterThan(duengerKrise);
    expect(erholt.erdgas!.ende).toBeGreaterThan(0);
  });

  test("Güterrechnung geht vollständig einmal in Devisen ein; Ausgangshandel wird nicht nochmals bezahlt", () => {
    const w = welt(); gueterMonat(w);
    const normal = load(save(w));
    // Kontrollierter Mehrimport auf derselben abgeschlossenen Warenrechnung.
    w.spiel!.gueter!.bilanz!.handelsDeltaUsdMrd -= 2;
    devisenMonat(w); devisenMonat(normal);
    expect(normal.economy.reservenNettoUsdMrd! - w.economy.reservenNettoUsdMrd!).toBeCloseTo(2, 8);
    const netto = w.economy.reservenNettoUsdMrd;
    devisenMonat(w);
    expect(w.economy.reservenNettoUsdMrd).toBe(netto);
  });

  test("Materialmangel verzögert laufende Fertigung; Treibstoffmangel wirkt in realer Kriegsstärke", () => {
    const w = welt();
    const st = streitkraefte(w); st.laufend = [];
    beginneAusbau(w, "panzer", "produktion");
    expect(st.laufend.length).toBe(1);
    const termin = st.laufend[0]!.fertig;
    weltZustand(w).RUS!.konflikt = 90;
    kriegMonat(w, new Rng(4));
    const k = kriegMit(w, "RUS")!; k.phase = "krieg";
    const normal = eigenStaerke(w, k);
    gueterZustand(w).lager.erdoel = 0;
    gueterZustand(w).lager.elektronik = 0;
    aussenZustand(w).sanktionen.push({ id: "eu_handel", von: "CHN", seit: w.day });
    setzeVersorgungsPrioritaet(w, "zivil");
    gueterMonat(w);
    expect(eigenStaerke(w, k)).toBeLessThan(normal);
    streitkraefteMonat(w, true);
    expect(st.laufend[0]!.fertig).toBeGreaterThan(termin);
    expect(st.laufend[0]!.versorgungsVerzug).toBeGreaterThan(0);
    const ersterVerzug = st.laufend[0]!.versorgungsVerzug!;
    w.day += 30;
    streitkraefteMonat(w, true);
    expect(st.laufend[0]!.versorgungsVerzug).toBe(ersterVerzug * 2);
    expect(st.laufend[0]!.fertig - termin).toBe(ersterVerzug * 2);
  });

  test("Speichern erhält Bestände, Aufträge, Verteilung und Abrechnung; alter Stand bekommt keine Gratisware", () => {
    const w = welt(); knapp(w);
    fuehreGutInstrumentAus(w, "erdoel", "reserve");
    setzeVersorgungsPrioritaet(w, "zivil");
    gueterMonat(w);
    const kopie = load(save(w));
    expect(kopie.spiel!.gueter).toEqual(w.spiel!.gueter);
    gueterMonat(kopie);
    expect(kopie.spiel!.gueter).toEqual(w.spiel!.gueter);
    delete kopie.spiel!.gueter!.bilanz;
    delete kopie.spiel!.gueter!.auftraege;
    const vorher = { ...kopie.spiel!.gueter!.lager };
    gueterSicht(kopie);
    expect(kopie.spiel!.gueter!.lager).toEqual(vorher);
  });

  test("Echter Monatswechsel schließt Waren vor Devisen ab", () => {
    const w = welt();
    w.date = "2028-06-30";
    advance(w, 1);
    expect(w.spiel!.gueter!.bilanz!.monat).toBe("2028-07");
    expect(w.spiel!.wirtschaft!.devisen!.abgerechnetMonat).toBe("2028-07");
    expect(Number.isFinite(w.economy.reservenNettoUsdMrd)).toBe(true);
  });

  test.each(["de", "en", "tr"] as const)("Warenakte und Kriegsdossier rendern dieselbe Versorgung (%s)", async lang => {
    await setzeSprache(lang);
    const w = welt();
    weltZustand(w).RUS!.konflikt = 90;
    kriegMonat(w, new Rng(1));
    kriegMit(w, "RUS")!.phase = "krieg";
    gueterMonat(w);
    for (const html of [renderToStaticMarkup(createElement(Inventar, { world: w, geaendert() {} })), renderToStaticMarkup(createElement(KriegDossier, { world: w, landId: "RUS", refresh() {} }))]) {
      expect(html).toContain("rg-lage");
      expect(html).toContain('aria-pressed="true"');
      expect(html).not.toMatch(/gueter\.kette\.|\{(?:monat|name|faktor|menge)\}/);
    }
  });
});
