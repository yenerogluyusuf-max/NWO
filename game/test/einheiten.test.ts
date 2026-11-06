// Echte Einheiten an den Reglern (Befund B-1, B-15): Keine Maßnahme zeigt „% des Ausgangs“ oder „Stufe NN“, in keiner Sprache.
// Mengen zeigen ihre Größe, Zustandsmaßnahmen benannte Zustände, Lücken das Verhältnis zu 2026. Nur Anzeige: Die Simulation bleibt.
import { afterAll, describe, expect, test, vi } from "vitest";
import { EINHEITEN, groesse, type Menge } from "../src/data/einheiten";

const SPRACHEN = ["de", "en", "tr"] as const;
// Reste der alten Anzeige in allen drei Sprachen
const ALT = /des Ausgangs|of the start|başlangıcın|(Stufe|Level|Seviye) \d|Wie heute|As today|Bugünkü gibi/i;
// Deutsche Bausteine, die in Englisch und Türkisch nicht vorkommen dürfen
const DEUTSCH = /[äß]|(?<!\p{L})(der|die|das|des|und|im|je|wie|mit|ohne|für|Jahr|Monat|netto|Mrd|Mio|heute|gegenüber|eingestellt)(?!\p{L})/u;

async function lade(sprache: (typeof SPRACHEN)[number]) {
  vi.resetModules();
  const i18n = await import("../src/i18n");
  await i18n.setzeSprache(sprache);
  const skalen = await import("../src/data/skalen");
  const { NET } = await import("../src/sim/modell");
  return { ...skalen, massnahmen: NET.nodes.filter((n) => n.kind === "massnahme") };
}

afterAll(async () => {
  vi.resetModules();
  const i18n = await import("../src/i18n");
  await i18n.setzeSprache("de");
});

describe("Einheiten an den Reglern", () => {
  for (const sprache of SPRACHEN) {
    test(`${sprache}: alle 117 Maßnahmen am Start, bei 50 % und 150 % ohne alte Anzeige`, async () => {
      const { stufenName, massnahmen } = await lade(sprache);
      expect(massnahmen.length).toBe(117);
      for (const n of massnahmen) {
        // B-15: Der Notstand gehört zum Auftrag N4 (Ausnahmezustand) und behält dort seinen Zustandsnamen
        if (n.id === "m_notstand") continue;
        for (const w of [n.start, n.start * 0.5, Math.min(100, n.start * 1.5)]) {
          const text = stufenName(n.id, w);
          expect(text, `${sprache} ${n.id} @${w}`).not.toMatch(ALT);
          expect(text.length, `${sprache} ${n.id} @${w}`).toBeGreaterThan(1);
          if (sprache !== "de") expect(text, `${sprache} ${n.id} @${w}: deutscher Rest`).not.toMatch(DEUTSCH);
        }
      }
    });
  }

  test("Startwerte erscheinen so, wie die Recherche sie belegt", async () => {
    const { stufenName } = await lade("de");
    expect(stufenName("m_mindestlohn", 50)).toBe("28.075,50 Lira netto im Monat");
    expect(stufenName("m_unigruendungen", 50)).toBe("602.117 Studienplätze im Jahr");
    expect(stufenName("m_gasfoerderung", 50)).toBe("9,5 Mio. m³ Gas am Tag");
    expect(stufenName("m_richterstellen", 45)).toBe("31 Richter und Staatsanwälte je 100.000");
    expect(stufenName("m_kindergeld", 45)).toBe("7.500 Lira im Monat ab dem dritten Kind");
    const en = await lade("en");
    expect(en.stufenName("m_mindestlohn", 50)).toBe("28,075.50 lira net a month");
    const tr = await lade("tr");
    expect(tr.stufenName("m_mindestlohn", 50)).toBe("aylık net 28.075,50 lira");
    expect(tr.stufenName("m_haftvermeidung", 30)).toBe("tutuklu oranı %15");
  });

  test("Umgekehrte Regler: Die Anzeige sinkt, wenn der Regler steigt", async () => {
    const { stufenName } = await lade("de");
    expect(stufenName("m_haftvermeidung", 45)).toBe("10 % der Gefangenen in Untersuchungshaft");
    expect(stufenName("m_haftvermeidung", 15)).toBe("30 % der Gefangenen in Untersuchungshaft");
    expect(stufenName("m_handelssysteme", 60)).toBe("Abfertigungszeit an der Grenze: halb so viel wie 2026");
    expect(stufenName("m_handelssysteme", 15)).toBe("Abfertigungszeit an der Grenze: doppelt so viel wie 2026");
    const e = EINHEITEN.m_haftvermeidung as Menge;
    let vorher = Infinity;
    for (let w = 0; w <= 100; w += 5) {
      const x = groesse(e, w, 30);
      expect(x).toBeLessThanOrEqual(vorher);
      expect(x).toBeLessThanOrEqual(30); // höchstens das Doppelte des Startanteils
      vorher = x;
    }
  });

  test("Keine Fantasiezahlen über die Grenze: Quoten bis 100 %, Gas bis zur Förderanlage, Pipelines in ganzen Strängen", async () => {
    for (const [id, e] of Object.entries(EINHEITEN)) {
      if (e.art !== "menge" || e.form?.art !== "anteil") continue;
      for (let w = 0; w <= 100; w += 1) expect(groesse(e, w, 40), id).toBeLessThanOrEqual(100);
    }
    const gas = EINHEITEN.m_gasfoerderung as Menge;
    for (let w = 0; w <= 100; w += 1) expect(groesse(gas, w, 50)).toBeLessThanOrEqual(20);
    const hub = EINHEITEN.m_gashub as Menge;
    for (let w = 0; w <= 100; w += 1) {
      const x = groesse(hub, w, 30);
      expect(Number.isInteger(Math.round((x - 47.5) / 15.75 * 1000) / 1000), `${w}`).toBe(true);
      expect(x).toBeGreaterThanOrEqual(16);
      expect(x).toBeLessThanOrEqual(79);
    }
    const { stufenName } = await lade("de");
    expect(stufenName("m_arbeitslosengeld", 100)).toBe("100 % des letzten Bruttolohns");
  });

  test("Zustände: Startzustand 2026 am Startwert, die Simulation behandelt die Maßnahme weiter als Menge", async () => {
    const { stufenName, skala, skalenArt, hatZustaende, massnahmen } = await lade("de");
    const zustand = massnahmen.filter((n) => hatZustaende(n.id));
    expect(zustand.map((n) => n.id).sort()).toEqual(
      ["m_akkuyu_ppa", "m_baukredite", "m_digitale_oeffentlichkeit", "m_fruehrente", "m_fruehwarnsystem", "m_heimische_kohle", "m_preiswahrheit", "m_sakarya_phase3", "m_verwaltungsdigital"],
    );
    for (const n of zustand) {
      expect(skalenArt(n.id), n.id).toBe("menge");
      const stufen = skala(n.id, n.start).stufen;
      expect(stufen.map((s) => s.w), n.id).toContain(n.start);
      expect(stufenName(n.id, n.start)).toBe(stufen.find((s) => s.w === n.start)!.name);
    }
    expect(stufenName("m_preiswahrheit", 25)).toBe("Staffeltarif: Vielverbraucher zahlen mehr");
    expect(stufenName("m_akkuyu_ppa", 40)).toMatch(/12,35 US-Cent/);
  });

  test("Lücken zeigen das Verhältnis zu 2026 statt einer erfundenen Zahl", async () => {
    const { stufenName } = await lade("de");
    const luecken = Object.entries(EINHEITEN).filter(([, e]) => e.art === "luecke").map(([id]) => id);
    expect(luecken.length).toBe(12);
    expect(stufenName("m_ausbildung", 40)).toBe("Kursteilnehmer: wie 2026");
    expect(stufenName("m_ausbildung", 60)).toBe("Kursteilnehmer: +50 % gegenüber 2026");
    expect(stufenName("m_ausbildung", 20)).toBe("Kursteilnehmer: halb so viel wie 2026");
    expect(stufenName("m_ausbildung", 0)).toBe("Kursteilnehmer: eingestellt");
  });

  test("B-15: Kein Zustand heißt mehr „Wie heute“ (außer dem Notstand, Auftrag N4)", async () => {
    const { skala, skalenArt, massnahmen } = await lade("de");
    for (const n of massnahmen) {
      if (skalenArt(n.id) !== "regime" || n.id === "m_notstand") continue;
      for (const s of skala(n.id, n.start).stufen) expect(s.name, `${n.id}.${s.w}`).not.toMatch(/Wie heute/);
    }
  });
});
