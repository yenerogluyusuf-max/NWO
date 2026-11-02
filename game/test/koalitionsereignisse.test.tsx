import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { ansicht, entscheide, oeffne } from "../src/sim/ereignisse";
import { aktiveParteivorsitzende, regierungsSitze } from "../src/sim/koalitionslage";
import { eigenVon } from "../src/sim/personen";
import { fraktion } from "../src/sim/fraktionen";
import { Rng } from "../src/sim/rng";
import { spielTick } from "../src/sim/spiel";
import { verhandle } from "../src/sim/verhandeln";
import { ministerVorlagen } from "../src/sim/ministerfluss";
import { NET } from "../src/sim/modell";
import { PROVINCES } from "../src/sim/netz";
import { addDays, formatDateDe } from "../src/sim/dates";
import { setzeSprache, t, katalogVon, platzhalter } from "../src/i18n";
import { EreignisFenster } from "../src/ui/EreignisFenster";
import type { World } from "../src/sim/types";

const WEGE = ["koalitionsangebot", "wahl_koalitionsrunde"] as const;
type Weg = typeof WEGE[number];
const option = (weg: Weg) => weg === "koalitionsangebot" ? "zustimmen" : "koalition-YENİ";
const chef = (w: World) => aktiveParteivorsitzende(w, "YENİ")[0]!;
function welt() {
  const w = createWorld(turkey2026, 17); startAfterElection(w, { ...schnellProfil(), buendnis: "YENİ" });
  w.spiel!.lager = []; w.spiel!.zusagen = []; w.spiel!.ereignisse = []; w.spiel!.kapital = 150;
  w.parliament!.seats = { [w.player!.partei.kurz]: 200, "YENİ": 120, CHP: 200, MHP: 50, DEM: 30 };
  for (const p of Object.keys(w.parliament!.seats)) fraktion(w, p).bereitschaft = 60;
  w.spiel!.verfassung!.aufmerksamkeit = 80;
  fraktion(w, "YENİ").forderung = { massnahme: "m_forschung", text: "Forschung fördern", seit: w.day };
  wert(w, 30);
  chef(w).loyalitaet = 19; chef(w).gespraech = w.day; eigenVon(w, chef(w)).groll = 64;
  return w;
}
function angebot(w: World, weg: Weg) {
  return oeffne(w, weg, new Rng(3), { provinzen: [], staerke: 1, daten: { partei: "YENİ", sitze: 120 } })!;
}
function wert(w: World, n: number) {
  const i = NET.index.get("m_forschung")!;
  for (let p = 0; p < PROVINCES; p++) w.net.values[i * PROVINCES + p] = n;
}
afterEach(async () => { await setzeSprache("de"); });

describe("Bündnisereignisse erhalten Personen und prüfen den aktuellen Zustand", () => {
  test.each(WEGE)("%s erhält den ursprünglichen Vorsitz statt einen zweiten anzulegen", weg => {
    const w = welt(), f = chef(w), ev = angebot(w, weg), vorher = structuredClone(f), n = w.spiel!.figuren.length;
    const rng = new Rng(5), zufall = rng.state;
    expect(entscheide(w, ev.id, option(weg), rng).ok).toBe(true);
    expect(aktiveParteivorsitzende(w, "YENİ")).toEqual([vorher]); expect(w.spiel!.figuren.length).toBe(n);
    expect(rng.state).toBe(zufall); expect(w.spiel!.lager.filter(p => p === "YENİ")).toHaveLength(1);
  });
  test.each(WEGE)("%s legt nur bei fehlendem aktivem Vorsitz eine neue Person mit freier Kennung an", weg => {
    const w = welt(), f = chef(w); f.imAmt = false; f.id = "partner-YENİ"; f.loyalitaet = 3;
    w.spiel!.figuren.push({ ...structuredClone(f), id: "partner-YENİ-2" });
    w.spiel!.figuren.find(f => f.amt === "finanzen")!.partei = "YENİ";
    const vorher = structuredClone(w.spiel!.figuren), ev = angebot(w, weg);
    expect(ansicht(w, ev).optionen.find(o => o.id === option(weg))!.bedingungen).toContain(t("fa.neu", { n: 55 }));
    expect(entscheide(w, ev.id, option(weg), new Rng(5)).ok).toBe(true);
    expect(aktiveParteivorsitzende(w, "YENİ")).toHaveLength(1);
    expect(chef(w)).toMatchObject({ id: "partner-YENİ-3", loyalitaet: 55, imAmt: true });
    expect(w.spiel!.figuren.slice(0, -1)).toEqual(vorher);
    expect(chef(load(save(w)))).toEqual(chef(w));
  });
  test("mehrere vorhandene aktive Vorsitzende bleiben erhalten, ohne einen dritten hinzuzufügen", () => {
    const w = welt(); w.spiel!.figuren.push({ ...structuredClone(chef(w)), id: "zweiter-vorsitz", loyalitaet: 45 });
    const vorher = structuredClone(aktiveParteivorsitzende(w, "YENİ")), ev = angebot(w, "wahl_koalitionsrunde");
    expect(entscheide(w, ev.id, "koalition-YENİ", new Rng(2)).ok).toBe(true);
    expect(aktiveParteivorsitzende(w, "YENİ")).toEqual(vorher);
  });
  test.each(WEGE)("%s bucht genau 4 PK, ersetzt die Duldung und bindet das angebotene Ziel ohne persönliche Belohnung", weg => {
    const w = welt(), ev = angebot(w, weg), pk = w.spiel!.kapital, auf = w.spiel!.verfassung!.aufmerksamkeit;
    fraktion(w, "YENİ").duldungBis = w.day + 120;
    w.spiel!.zusagen.push({ id: "alter-vertrag", von: "YENİ", text: "Alte Zusage", faellig: w.day + 120, erfuellt: false, gebrochen: false });
    const alt = structuredClone(w.spiel!.zusagen[0]);
    const a = ansicht(w, ev).optionen.find(o => o.id === option(weg))!;
    expect(a.pk).toBe(4); expect(a.bedingungen!.join(" ")).toContain(formatDateDe(addDays(w.date, 150)));
    expect(a.bedingungen!.join(" ")).toContain(t("fa.stufe", { n: 50 }));
    expect(entscheide(w, ev.id, option(weg), new Rng(5)).ok).toBe(true);
    expect(w.spiel!.kapital).toBe(pk - 4); expect(w.spiel!.verfassung!.aufmerksamkeit).toBe(auf);
    expect(chef(w).loyalitaet).toBe(19); expect(fraktion(w, "YENİ").bereitschaft).toBe(60);
    expect(fraktion(w, "YENİ").duldungBis).toBeUndefined(); expect(w.spiel!.zusagen[0]).toEqual(alt);
    expect(w.spiel!.zusagen.at(-1)).toMatchObject({ faellig: w.day + 150, von: "YENİ", stufeZiel: 50, erfuellt: false });
    expect(w.spiel!.zusagen.at(-1)!.stufeStart).toBeCloseTo(30);
    const stand = save(w); expect(entscheide(w, ev.id, option(weg), new Rng(5)).ok).toBe(false); expect(save(w)).toBe(stand);
  });
  test.each(WEGE)("%s zeigt geänderte Sitze und die verbleibende Mehrheitslücke vor der Annahme", weg => {
    const w = welt(), ev = angebot(w, weg); w.parliament!.seats["YENİ"] = 80;
    const a = ansicht(w, ev), o = a.optionen.find(o => o.id === option(weg))!;
    expect(o.bedingungen).toContain(t("ka.luecke", { sitze: 80, danach: 280, fehlen: 21 }));
    expect(o.warnung).toContain("80");
    if (weg === "koalitionsangebot") expect(a.text.join(" ")).toContain("80 Sitze");
    const r = entscheide(w, ev.id, option(weg), new Rng(5)); expect(r.ok).toBe(true); expect(r.text).toContain("80");
    expect(regierungsSitze(w)).toBe(280);
  });
  test.each(WEGE)("%s kann nach einem normalen Bündnisabschluss keinen zweiten Vertrag oder Preis buchen", weg => {
    const w = welt(), ev = angebot(w, weg);
    expect(verhandle(w, "YENİ", "koalition", new Rng(7)).ok).toBe(true);
    ansicht(w, ev); const stand = save(w);
    expect(entscheide(w, ev.id, option(weg), new Rng(5)).ok).toBe(false); expect(save(w)).toBe(stand);
    expect(w.spiel!.zusagen).toHaveLength(1); expect(w.spiel!.ereignisse.some(e => e.id === ev.id)).toBe(true);
  });
  test.each(WEGE)("%s wird bei Verlust der erforderlichen Sitze ohne Nebenbuchung abgewiesen", weg => {
    const w = welt(), ev = angebot(w, weg); w.parliament!.seats["YENİ"] = 14;
    const a = ansicht(w, ev).optionen.find(o => o.id === option(weg));
    expect(!a || !!a.sperre).toBe(true); const stand = save(w);
    expect(entscheide(w, ev.id, option(weg), new Rng(1)).ok).toBe(false); expect(save(w)).toBe(stand);
  });
  test("ein altes Angebot der nun eigenen Partei kann nicht angenommen werden", () => {
    const w = welt(), ev = angebot(w, "koalitionsangebot"); w.player!.partei.kurz = "YENİ";
    const o = ansicht(w, ev).optionen.find(o => o.id === "zustimmen")!; expect(o.sperre).toBe(t("ka.eigene"));
    const stand = save(w); expect(entscheide(w, ev.id, "zustimmen", new Rng(2)).ok).toBe(false); expect(save(w)).toBe(stand);
  });
  test("fehlendes Kapital blockiert den Ereignisabschluss ohne neue Zusage oder Figur", () => {
    const w = welt(), ev = angebot(w, "koalitionsangebot"); w.spiel!.kapital = -20;
    expect(ansicht(w, ev).optionen.find(o => o.id === "zustimmen")!.bezahlbar).toBe(false);
    const stand = save(w); expect(entscheide(w, ev.id, "zustimmen", new Rng(2)).ok).toBe(false); expect(save(w)).toBe(stand);
  });
  test("zwei berechtigte spätere Abschlüsse desselben Tages überschreiben keine Zusagenkennung", () => {
    const w = welt(), ev = angebot(w, "koalitionsangebot");
    expect(entscheide(w, ev.id, "zustimmen", new Rng(1)).ok).toBe(true);
    const erste = structuredClone(w.spiel!.zusagen[0]); w.spiel!.lager = []; w.spiel!.zuletzt = {};
    const neu = angebot(w, "koalitionsangebot"); expect(entscheide(w, neu.id, "zustimmen", new Rng(1)).ok).toBe(true);
    expect(w.spiel!.zusagen).toHaveLength(2); expect(w.spiel!.zusagen[0]).toEqual(erste);
    expect(new Set(w.spiel!.zusagen.map(z => z.id)).size).toBe(2); expect(aktiveParteivorsitzende(w, "YENİ")).toHaveLength(1);
  });
  test.each(WEGE)("%s: tatsächlicher Monatsbruch bleibt ohne Gespräch möglich, das Gespräch erhält die Mehrheit", weg => {
    const w = welt(); w.date = "2028-06-30"; w.spiel!.start.datum = w.date; w.day = 0;
    const ev = angebot(w, weg), a = ansicht(w, ev).optionen.find(o => o.id === option(weg))!;
    expect(a.warnung).toBe(t("ka.bruch", { datum: formatDateDe("2028-07-01"), sitze: 120, rest: 200 }));
    expect(entscheide(w, ev.id, option(weg), new Rng(5)).ok).toBe(true);
    const ohne = load(save(w)), pk = w.spiel!.kapital, auf = w.spiel!.verfassung!.aufmerksamkeit;
    expect(verhandle(w, "YENİ", "gespraech", new Rng(7)).ok).toBe(true);
    expect(chef(w).loyalitaet).toBe(24); expect(w.spiel!.kapital).toBe(pk - 1); expect(w.spiel!.verfassung!.aufmerksamkeit).toBe(auf - 2);
    for (const x of [w, ohne]) { x.day = 1; x.date = "2028-07-01"; spielTick(x, new Rng(19)); }
    expect(ohne.spiel!.lager).not.toContain("YENİ"); expect(regierungsSitze(ohne)).toBe(200);
    expect(w.spiel!.lager).toContain("YENİ"); expect(regierungsSitze(w)).toBe(320);
  });
  test("die genaue Bruchschwelle und bereits beschlossene Ziele bleiben in der Mappe auch am selben Tag aktuell", () => {
    const w = welt(), ev = angebot(w, "koalitionsangebot"); chef(w).loyalitaet = 20.0001;
    const lesen = () => ministerVorlagen(w, { tiefe: 0, probleme: 0 }).find(v => v.id === `ereignis:${ev.id}`)!.optionen.find(o => o.id === "zustimmen")!;
    expect(lesen().text).not.toContain("Vorsicht"); lesen();
    chef(w).loyalitaet = 19.9999;
    expect(lesen().text).toContain("Vorsicht"); expect(lesen().text).toContain(t("vm.bruch.knapp", { grenze: 20 }));
    w.parliament!.seats["YENİ"] = 80;
    expect(lesen().text).toContain(t("ka.luecke", { sitze: 80, danach: 280, fehlen: 21 }));
    wert(w, 40); expect(lesen().text).toContain(t("fa.stufe", { n: 60 }));
    w.net.targets.m_forschung = 60; expect(lesen().text).toContain(t("fa.zielBeschlossen"));
    w.spiel!.lager.push("YENİ"); expect(lesen().moeglich).toBe(false); expect(lesen().grund).toBe(t("ka.bereitsPartner"));
  });
  test.each(["de", "en", "tr"] as const)("Ereigniskarte zeigt auf %s die verbindlichen Bedingungen und das Risiko zustandsneutral", async lang => {
    await setzeSprache(lang); const w = welt(), ev = angebot(w, "koalitionsangebot");
    const a = ansicht(w, ev), stand = save(w), o = a.optionen.find(o => o.id === "zustimmen")!;
    const html = renderToStaticMarkup(<EreignisFenster ansicht={a} datum={w.date} kapital={w.spiel!.kapital} onWaehle={() => {}} onSpaeter={() => {}} />);
    for (const text of o.bedingungen!) expect(html).toContain(text);
    expect(html).toContain(o.warnung); expect(html).toContain("ev2-option-warnung"); expect(html).not.toContain("⟦");
    expect(save(w)).toBe(stand);
    for (const key of Object.keys(katalogVon("de")).filter(k => k.startsWith("ka."))) {
      expect(katalogVon(lang)[key]).toBeDefined(); expect(platzhalter(katalogVon(lang)[key]!)).toEqual(platzhalter(katalogVon("de")[key]!));
    }
  });
  test("die Ministermappe wechselt die Sprache des gleichen offenen Angebots ohne neuen Spieltag", async () => {
    const w = welt(), ev = angebot(w, "koalitionsangebot");
    const text = () => ministerVorlagen(w, { tiefe: 0, probleme: 0 }).find(v => v.id === `ereignis:${ev.id}`)!.optionen.find(o => o.id === "zustimmen")!.text;
    expect(text()).toContain(t("ka.preis")); text();
    await setzeSprache("en"); expect(text()).toContain(t("ka.preis"));
  });
});
