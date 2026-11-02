import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { fraktion, forderungVon } from "../src/sim/fraktionen";
import { fraktionsUebersicht, verhandle } from "../src/sim/verhandeln";
import { festeZusage, zusageStufen, zusageZiel } from "../src/sim/zusagenfolgen";
import { zusageVorhaben, zusagenPflege, zusagenSicht } from "../src/sim/zusagen";
import { bringeEin, gesetzeAbstimmen } from "../src/sim/handeln";
import { aktiveParteivorsitzende } from "../src/sim/koalitionslage";
import { zusageAnlegen } from "../src/sim/ereignis-hilfen";
import { ansicht, entscheide, oeffne } from "../src/sim/ereignisse";
import { verspreche, wahlkampfTag, WAHLKAMPF } from "../src/sim/wahlkampf";
import { NET } from "../src/sim/modell";
import { PROVINCES } from "../src/sim/netz";
import { Rng } from "../src/sim/rng";
import { addDays } from "../src/sim/dates";
import { setzeSprache, t, katalogVon, platzhalter } from "../src/i18n";
import { FraktionsAbkommen } from "../src/ui/parlament/FraktionsAbkommen";
import type { World } from "../src/sim/types";
import type { Zusage } from "../src/sim/spiel-typen";

function wert(w: World, id: string, n: number) {
  const i = NET.index.get(id)!;
  for (let p = 0; p < PROVINCES; p++) w.net.values[i * PROVINCES + p] = n;
}
function welt(massnahme = "m_forschung", n = 30) {
  const w = createWorld(turkey2026, 17);
  startAfterElection(w, { ...schnellProfil(), buendnis: "YENİ" });
  w.spiel!.ereignisse = []; w.spiel!.zusagen = []; w.spiel!.gesetze = [];
  w.spiel!.lager = []; w.spiel!.kapital = 150;
  w.parliament!.seats = { [w.player!.partei.kurz]: 200, "YENİ": 120, CHP: 200, MHP: 50, DEM: 30 };
  for (const p of Object.keys(w.parliament!.seats)) fraktion(w, p).bereitschaft = 60;
  fraktion(w, "YENİ").forderung = { massnahme, text: "Forschung fördern", seit: w.day };
  wert(w, massnahme, n);
  return w;
}
const angebot = (w: World) => fraktionsUebersicht(w).find(f => f.partei === "YENİ")!;
const zusage = (w: World) => w.spiel!.zusagen.at(-1)!;
const chef = (w: World) => aktiveParteivorsitzende(w, "YENİ")[0]!;
function alt(w: World, extra: Partial<Zusage> = {}): Zusage {
  const z: Zusage = { id: "z-alt", von: "YENİ", text: "Forschung zugesagt", faellig: w.day + 90,
    massnahme: "m_forschung", richtung: 1, erfuellt: false, gebrochen: false, ...extra };
  w.spiel!.zusagen.push(z); return z;
}
afterEach(async () => { await setzeSprache("de"); });

describe("Verbindliche Zielstufen werden beim Vereinbaren gespeichert", () => {
  test.each(["koalition", "duldung"] as const)("%s speichert exakt den angebotenen Ausgangsstand und das Ziel", art => {
    const w = welt(), a = angebot(w).zusagenziel!, loyal = chef(w).loyalitaet;
    expect(a.stufeStart).toBeCloseTo(30); expect(a.stufeZiel).toBe(50);
    expect(verhandle(w, "YENİ", art, new Rng(3)).ok).toBe(true);
    expect(zusage(w)).toMatchObject({ massnahme: a.massnahme, stufeStart: a.stufeStart, stufeZiel: a.stufeZiel, erfuellt: false });
    expect(chef(w).loyalitaet).toBe(loyal);
  });
  test.each(["m_forschung", "m_wissenschaftsfreiheit"])("späteres Öffnen oder laufende Umsetzung verändert das zugesagte Ziel bei %s nicht", id => {
    const w = welt(id, id === "m_forschung" ? 30 : 40);
    expect(verhandle(w, "YENİ", "duldung", new Rng(3)).ok).toBe(true);
    const z = zusage(w), ziel = z.stufeZiel!, start = z.stufeStart!;
    const frueh = load(save(w)); zusagenSicht(frueh);
    for (const x of [w, frueh]) { wert(x, id, ziel - 1); zusagenPflege(x); }
    expect(z.stufeZiel).toBe(ziel); expect(z.stufeStart).toBe(start);
    expect(zusageVorhaben(w, z)!.ziel).toBe(ziel);
    expect(zusage(frueh).stufeZiel).toBe(ziel);
    expect(zusage(load(save(w)))).toMatchObject({ stufeStart: start, stufeZiel: ziel });
  });
  test("eine später wechselnde Fraktionsforderung schreibt die alte Zusage nicht um", () => {
    const w = welt(); verhandle(w, "YENİ", "duldung", new Rng(3));
    const vorher = structuredClone(zusage(w)); w.day += 271; w.date = addDays(w.date, 271);
    const neu = forderungVon(w, "YENİ"); expect(neu.massnahme).not.toBe(vorher.massnahme);
    zusagenPflege(w); expect(zusage(w)).toEqual(vorher);
  });
  test("erneute Verträge erhalten eigene Ausgangsstände, ohne frühere Ziele zu überschreiben", () => {
    const w = welt(); verhandle(w, "YENİ", "duldung", new Rng(3)); const erstes = zusage(w);
    wert(w, "m_forschung", 45);
    expect(verhandle(w, "YENİ", "koalition", new Rng(4)).ok).toBe(true);
    expect(erstes.stufeZiel).toBe(50); expect(zusage(w).stufeZiel).toBe(65);
  });
  test.each([1, -1])("bekannter alter Ausgangsstand bleibt bei Richtung %s die Messlatte", richtung => {
    const w = welt("m_forschung", 50), z = alt(w, { richtung, stufeStart: richtung > 0 ? 30 : 70 });
    expect(zusageVorhaben(w, z)!.ziel).toBe(50); zusagenPflege(w);
    expect(z.stufeZiel).toBe(50); expect(z.erfuellt).toBe(false);
  });
  test.each([[44.99, 55], [45.01, 80]])("benannte Regimestufen halten Zwischenstand %s und Ziel %s fest", (start, ziel) => {
    const w = welt("m_justizreform", start!);
    const z = festeZusage(w, alt(w, { massnahme: "m_justizreform" }));
    expect(z.stufeStart).toBeCloseTo(start!); expect(z.stufeZiel).toBe(ziel);
    wert(w, "m_justizreform", 82);
    expect(zusageZiel(z, 82)).toBe(ziel);
    expect(zusageZiel({ massnahme: "m_justizreform", richtung: 1, stufeStart: start! }, 82)).toBe(ziel);
  });
  test("vollständig gespeicherte alte Ziele werden unverändert erhalten", () => {
    const w = welt(), z = alt(w, { stufeStart: 10, stufeZiel: 47 });
    wert(w, "m_forschung", 62); const vor = structuredClone(z); zusagenPflege(w);
    expect(z).toEqual(vor); expect(festeZusage(w, z)).toEqual(vor);
  });
  test("ohne historische Zielwerte wird einmal der vorhandene Stand ergänzt, ohne rückwirkende Belohnung", () => {
    const w = welt(), z = alt(w), loyal = chef(w).loyalitaet;
    zusagenPflege(w); expect(z.stufeStart).toBeCloseTo(30); expect(z.stufeZiel).toBe(50);
    wert(w, "m_forschung", 50); zusagenPflege(w);
    expect(z.stufeZiel).toBe(50); expect(z.erfuellt).toBe(false); expect(chef(w).loyalitaet).toBe(loyal);
  });
  test("Zielvorschau und Kopie einer neuen Zusage verändern weder Quelle noch Spielstand", () => {
    const w = welt(), z = alt(w), vorher = save(w), original = structuredClone(z);
    expect(festeZusage(w, z).stufeZiel).toBe(50); expect(zusageStufen(w, z)?.stufeZiel).toBe(50);
    expect(z).toEqual(original); expect(save(w)).toBe(vorher);
  });
  test("Gesetzesunabhängige Zusagen bekommen kein erfundenes Politikziel", () => {
    const w = welt(); zusageAnlegen(w, { von: "YENİ", text: "Zwei Ministerien", tage: 90 });
    expect(zusage(w).stufeStart).toBeUndefined(); expect(zusage(w).stufeZiel).toBeUndefined();
  });
  test("über Ereignishilfen vereinbarte Zusagen sind sofort festgelegt", () => {
    const w = welt(); zusageAnlegen(w, { von: "YENİ", text: "Forschung", tage: 90, massnahme: "m_forschung" });
    expect(zusage(w).stufeStart).toBeCloseTo(30); expect(zusage(w).stufeZiel).toBe(50);
  });
  test.each(["koalitionsangebot", "wahl_koalitionsrunde"])("auch %s hält das Ziel bei Annahme fest", vorlage => {
    const w = welt(), e = oeffne(w, vorlage, new Rng(3), { provinzen: [], staerke: 1, daten: { partei: "YENİ", sitze: 120 } })!;
    const option = vorlage === "koalitionsangebot" ? "zustimmen" : "koalition-YENİ";
    expect(ansicht(w, e).optionen.some(o => o.id === option)).toBe(true);
    expect(entscheide(w, e.id, option, new Rng(3)).ok).toBe(true);
    expect(zusage(w).stufeStart).toBeCloseTo(30); expect(zusage(w).stufeZiel).toBe(50);
  });
  test("Wahlversprechen erhalten bereits beim Aussprechen ein festes Ziel", () => {
    const w = welt(); wert(w, "m_renten", 30); w.spiel!.wahltag = w.day + WAHLKAMPF.beginnTage;
    wahlkampfTag(w); expect(verspreche(w, "v_renten").ok).toBe(true);
    expect(zusage(w).stufeStart).toBeCloseTo(30); expect(zusage(w).stufeZiel).toBe(50);
  });
  test("Amtsantritt legt Wahlprogramm und Bündnisforderungen vor der ersten Ansicht fest", () => {
    const w = createWorld(turkey2026, 17);
    startAfterElection(w, { ...schnellProfil(), versprechen: ["Rentenerhöhung", "Offene Vergaben"], buendnis: "YENİ", buendnisZusage: { partei: "YENİ" } });
    const gesetze = w.spiel!.zusagen.filter(z => z.massnahme && z.richtung);
    expect(gesetze.length).toBeGreaterThanOrEqual(3);
    for (const z of gesetze) { expect(z.stufeStart).toBeDefined(); expect(z.stufeZiel).toBeDefined(); }
    expect(gesetze.some(z => z.id === "z-renten")).toBe(true); expect(gesetze.some(z => z.id === "z-start-YENİ")).toBe(true);
  });
  test("ein späterer Beschluss erfüllt nach Zwischenfortschritt das ursprüngliche Vertragsziel", () => {
    const w = welt(); expect(verhandle(w, "YENİ", "koalition", new Rng(3)).ok).toBe(true);
    const z = zusage(w); wert(w, "m_forschung", 40); const ohne = load(save(w)); ohne.spiel!.zusagen = [];
    for (const x of [w, ohne]) {
      expect(bringeEin(x, "m_forschung", 50, null, "gesetz").ok).toBe(true);
      const g = x.spiel!.gesetze[0]!; g.absprachen = 600; x.date = addDays(x.date, g.abstimmung - x.day); x.day = g.abstimmung;
      expect(gesetzeAbstimmen(x, new Rng(5))[0]!.angenommen).toBe(true);
    }
    expect(z.stufeZiel).toBe(50); expect(z.erfuellt).toBe(true);
    expect(chef(w).loyalitaet - chef(ohne).loyalitaet).toBeCloseTo(12);
  });
  test("schon beschlossene Ziele werden vor dem Abschluss ausdrücklich gezeigt", () => {
    const w = welt(); w.net.targets.m_forschung = 50;
    expect(angebot(w).zusagenziel!.bereitsBeschlossen).toBe(true);
    const html = renderToStaticMarkup(<FraktionsAbkommen world={w} fraktion={angebot(w)} onVerhandlung={() => {}} />);
    expect(html).toContain(t("fa.zielBeschlossen"));
  });
  test.each(["de", "en", "tr"] as const)("Angebotskarte erklärt das feste Ziel auf %s zustandsneutral", async lang => {
    await setzeSprache(lang); const w = welt("m_wissenschaftsfreiheit", 40), a = angebot(w), stand = save(w);
    const html = renderToStaticMarkup(<FraktionsAbkommen world={w} fraktion={a} onVerhandlung={() => {}} />);
    expect(a.zusagenziel!.stufeZiel).toBe(65); expect(html).toContain(a.zusagenziel!.zielName!);
    expect(html).toContain(t("fa.zielFest")); expect(html).toContain(t("fa.ausgang")); expect(html).toContain(t("fa.ziel"));
    expect(save(w)).toBe(stand); expect(html).not.toContain("⟦");
    for (const key of Object.keys(katalogVon("de")).filter(k => k.startsWith("fa."))) {
      expect(katalogVon(lang)[key]).toBeDefined(); expect(platzhalter(katalogVon(lang)[key]!)).toEqual(platzhalter(katalogVon("de")[key]!));
    }
  });
});
