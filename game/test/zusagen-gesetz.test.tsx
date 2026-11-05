import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, save, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { fraktion } from "../src/sim/fraktionen";
import { aktiveParteivorsitzende, regierungsSitze } from "../src/sim/koalitionslage";
import { bringeEin, gesetzeAbstimmen, setPolicy, stufeIn, zieheGesetzZurueck } from "../src/sim/handeln";
import { loeseEin, loeseZusageEin, zusageVorhaben, zusagenMonat, zusagenSicht } from "../src/sim/zusagen";
import { zusageZiel } from "../src/sim/zusagenfolgen";
import { NET } from "../src/sim/modell";
import { PROVINCES } from "../src/sim/netz";
import { skala } from "../src/data/skalen";
import { addDays } from "../src/sim/dates";
import { spielTick } from "../src/sim/spiel";
import { oeffne, ansicht, entscheide } from "../src/sim/ereignisse";
import { Rng } from "../src/sim/rng";
import { setzeSprache, t } from "../src/i18n";
import { ZusagenAnsicht } from "../src/ui/personen/ZusagenAnsicht";
import type { World } from "../src/sim/types";
import type { Zusage } from "../src/sim/spiel-typen";

function welt(richtung = 1) {
  const w = createWorld(turkey2026, 17);
  startAfterElection(w, { ...schnellProfil(), buendnis: "YENİ" });
  w.spiel!.ereignisse = []; w.spiel!.zusagen = []; w.spiel!.gesetze = [];
  w.spiel!.lager = ["YENİ"]; w.spiel!.kapital = 150;
  w.parliament!.seats = { [w.player!.partei.kurz]: 200, "YENİ": 120, CHP: 200, MHP: 50, DEM: 30 };
  fraktion(w, "YENİ").bereitschaft = 60; chef(w).loyalitaet = 40;
  const massnahme = "m_renten";
  const start = Math.round(stufeIn(w, massnahme, null));
  const z: Zusage = { id: "z-gesetz-test", von: "YENİ", text: "Rentenpolitik zugesagt", massnahme, richtung,
    stufeStart: start, stufeZiel: start + 20 * richtung, faellig: w.day + 90, erfuellt: false, gebrochen: false };
  w.spiel!.zusagen.push(z);
  return w;
}
const chef = (w: World) => aktiveParteivorsitzende(w, "YENİ")[0]!;
const zusage = (w: World) => w.spiel!.zusagen[0]!;
function abstimmen(w: World, ja: boolean) {
  const g = w.spiel!.gesetze[0]!;
  g.absprachen = ja ? 600 : -600;
  w.day = g.abstimmung; w.date = addDays(w.spiel!.start.datum, w.day);
  return gesetzeAbstimmen(w, new Rng(5))[0]!;
}
function ohneZusage(w: World) { const k = load(save(w)); k.spiel!.zusagen = []; return k; }
afterEach(async () => { await setzeSprache("de"); });

describe("Gesetzeszusagen werden erst beim zugesagten Beschluss belohnt", () => {
  test("Einbringen lässt Loyalität und Bereitschaft unverändert und zeigt den tatsächlichen Abstimmungstermin", () => {
    const w = welt(), z = zusage(w), kapital = w.spiel!.kapital;
    z.faellig = w.day;
    expect(loeseEin(w, z).ok).toBe(true);
    expect(chef(w).loyalitaet).toBe(40); expect(fraktion(w, z.von).bereitschaft).toBe(60);
    expect(z.erfuellt).toBe(false); expect(z.abgeschlossen).toBeUndefined();
    expect(w.spiel!.kapital).toBeLessThan(kapital); expect(w.spiel!.gesetze[0]!.stufe).toBe(z.stufeZiel);
    expect(z.faellig).toBe(w.spiel!.gesetze[0]!.abstimmung + 15);
    expect(w.log.at(-1)!.text).toContain("Gesetz zur Zusage eingebracht");
    const s = zusagenSicht(w)[0]!;
    expect(s.gesetz!.gesperrt).toBe(true); expect(s.gesetz!.text).toContain("Bei Annahme erfüllt");
    expect(s.gehalten.join(" ")).toContain("keinen Zusagenbonus");
    const stand = save(w); expect(loeseEin(w, z).ok).toBe(false); expect(save(w)).toBe(stand);
  });
  test("Annahme bucht den zusätzlichen Zusagenbonus sofort und genau einmal, auch ohne Zusagenansicht", () => {
    const w = welt(), z = zusage(w), k = ohneZusage(w);
    for (const x of [w, k]) expect(bringeEin(x, z.massnahme!, z.stufeZiel!, null, "gesetz").ok).toBe(true);
    expect(abstimmen(w, true).angenommen).toBe(true); abstimmen(k, true);
    expect(z.erfuellt).toBe(true); expect(z.abgeschlossen).toBe(w.day);
    expect(chef(w).loyalitaet - chef(k).loyalitaet).toBeCloseTo(12);
    expect(fraktion(w, z.von).bereitschaft - fraktion(k, z.von).bereitschaft).toBeCloseTo(10);
    const loyal = chef(w).loyalitaet, bereit = fraktion(w, z.von).bereitschaft;
    const neu = load(save(w)); zusagenMonat(neu); zusagenMonat(neu);
    expect(chef(neu).loyalitaet).toBe(loyal); expect(fraktion(neu, z.von).bereitschaft).toBe(bereit);
    expect(loeseZusageEin(neu, zusage(neu)).ok).toBe(false);
  });
  test.each(["ablehnen", "zurueckziehen"] as const)("%s und erneutes Einbringen schenken keine Loyalität", art => {
    const w = welt(), z = zusage(w);
    expect(loeseEin(w, z).ok).toBe(true);
    if (art === "ablehnen") expect(abstimmen(w, false).angenommen).toBe(false);
    else expect(zieheGesetzZurueck(w, w.spiel!.gesetze[0]!.id).ok).toBe(true);
    expect(z.erfuellt).toBe(false); expect(chef(w).loyalitaet).toBe(40);
    // Nach einer Niederlage ruht das Thema (G6, ein Weg zum Gesetz): erst danach lässt es sich erneut einbringen
    if (art === "ablehnen") {
      const r = loeseEin(w, z);
      expect(r.ok).toBe(false); expect(r.text).toContain("ruht");
      w.spiel!.gesetzgebung!.ruhe = {};
    }
    expect(loeseEin(w, z).ok).toBe(true); expect(chef(w).loyalitaet).toBe(40);
    expect(fraktion(w, z.von).bereitschaft).toBe(60);
  });
  test.each([1, -1])("Teiländerung in Richtung %s erfüllt das feste Ziel nicht und verschiebt es nicht", richtung => {
    const w = welt(richtung), z = zusage(w), ziel = z.stufeZiel!, k = ohneZusage(w);
    for (const x of [w, k]) setPolicy(x, z.massnahme!, z.stufeStart! + 5 * richtung);
    expect(z.erfuellt).toBe(false); expect(chef(w).loyalitaet).toBe(chef(k).loyalitaet);
    // Die tatsächliche Umsetzung ist inzwischen teilweise fortgeschritten.
    const i = NET.index.get(z.massnahme!)!;
    for (let p = 0; p < PROVINCES; p++) w.net.values[i * PROVINCES + p] = z.stufeStart! + 5 * richtung;
    expect(zusageVorhaben(w, z)!.ziel).toBe(ziel);
    expect(loeseEin(w, z).ok).toBe(true); expect(w.spiel!.gesetze[0]!.stufe).toBe(ziel);
    expect(abstimmen(w, true).angenommen).toBe(true); expect(z.erfuellt).toBe(true);
  });
  test("regionaler Beschluss genügt nicht für die landesweite Zusage", () => {
    const w = welt(), z = zusage(w), k = ohneZusage(w);
    for (const x of [w, k]) setPolicy(x, z.massnahme!, z.stufeZiel!, [34]);
    expect(z.erfuellt).toBe(false); expect(chef(w).loyalitaet).toBe(chef(k).loyalitaet);
    expect(loeseEin(w, z).ok).toBe(true); expect(abstimmen(w, true).angenommen).toBe(true);
    expect(z.erfuellt).toBe(true);
  });
  test.each(["teil", "regional"] as const)("Ansicht benennt unzureichenden Entwurf: %s", art => {
    const w = welt(), z = zusage(w);
    expect(bringeEin(w, z.massnahme!, art === "teil" ? z.stufeStart! + 5 : z.stufeZiel!, art === "regional" ? [34] : null, "gesetz").ok).toBe(true);
    const s = zusagenSicht(w)[0]!;
    expect(s.gesetz!.text).toContain("bleibt auch bei Annahme offen");
    expect(s.gesetz!.gesperrt).toBe(true); expect(abstimmen(w, true).angenommen).toBe(true);
    expect(z.erfuellt).toBe(false);
  });
  test("Altzusage ohne Ziel erhält beim Beschluss denselben Schwellenwert wie in der Vorschau", () => {
    const w = welt(), z = zusage(w); delete z.stufeZiel; delete z.stufeStart;
    const ziel = zusageVorhaben(w, z)!.ziel;
    setPolicy(w, z.massnahme!, ziel - 1);
    expect(z.stufeZiel).toBe(ziel); expect(z.erfuellt).toBe(false);
    setPolicy(w, z.massnahme!, ziel); expect(z.erfuellt).toBe(true);
  });
  test("bereits beschlossenes Ziel wird ohne neues Gesetz und zusätzliche Kosten anerkannt", () => {
    const w = welt(), z = zusage(w); w.net.targets[z.massnahme!] = z.stufeZiel!;
    const k = w.spiel!.kapital;
    expect(zusageVorhaben(w, z)!.erreicht).toBe(true);
    expect(zusagenSicht(w)[0]!.gesetz!.aktion).toBe("Erfüllung verbuchen");
    expect(loeseEin(w, z).ok).toBe(true); expect(z.erfuellt).toBe(true);
    expect(w.spiel!.kapital).toBe(k); expect(w.spiel!.gesetze).toHaveLength(0);
    expect(chef(w).loyalitaet).toBe(52); expect(fraktion(w, z.von).bereitschaft).toBe(70);
  });
  test("bestehender Rücknahmebeschluss verhindert falsche Erfüllung durch den noch höheren Istwert", () => {
    const w = welt(), z = zusage(w), i = NET.index.get(z.massnahme!)!;
    for (let p = 0; p < PROVINCES; p++) w.net.values[i * PROVINCES + p] = z.stufeZiel! + 2;
    w.net.targets[z.massnahme!] = z.stufeStart!;
    expect(zusageVorhaben(w, z)!.erreicht).toBe(false);
  });
  test("mangelndes Kapital gibt keine Belohnung und markiert das Versprechen nicht als erfüllt", () => {
    const w = welt(), z = zusage(w); w.spiel!.kapital = -100;
    expect(loeseEin(w, z).ok).toBe(false); expect(z.erfuellt).toBe(false);
    expect(chef(w).loyalitaet).toBe(40); expect(fraktion(w, z.von).bereitschaft).toBe(60);
  });
  test("erledigte alte Spielstände erhalten bei der allgemeinen Nachbuchung keine zweite Personenbelohnung", () => {
    const w = welt(), z = zusage(w); z.erfuellt = true;
    for (const mitDatum of [false, true]) {
      if (mitDatum) z.abgeschlossen = w.day;
      const neu = load(save(w)); zusagenMonat(neu);
      expect(chef(neu).loyalitaet).toBe(40); expect(fraktion(neu, z.von).bereitschaft).toBe(60);
      expect(zusage(neu).abgeschlossen).toBeDefined();
    }
  });
  test("benannte Regimestufen behalten nach Zwischenfortschritt das vereinbarte Ziel", () => {
    const w = welt(), z = zusage(w); z.massnahme = "m_justizreform"; delete z.stufeZiel;
    const jetzt = stufeIn(w, z.massnahme, null), ziel = zusageZiel(z, jetzt);
    expect(skala(z.massnahme, jetzt).stufen.map(st => st.w)).toContain(ziel);
    z.stufeZiel = ziel; expect(zusageZiel(z, ziel - 1)).toBe(ziel);
  });
  test("Regimevorschau benennt auch einen Zwischenstand ohne fehlende Zustandsnamen", () => {
    const w = welt(), z = zusage(w); z.massnahme = "m_justizreform"; delete z.stufeZiel;
    const i = NET.index.get(z.massnahme)!;
    for (let p = 0; p < PROVINCES; p++) w.net.values[i * PROVINCES + p] = 31;
    const v = zusageVorhaben(w, z)!;
    expect(v.jetztName).toBeTruthy(); expect(v.zielName).toBeTruthy();
  });
  test("Fälligkeitserinnerung verspricht beim Einbringen keine Erfüllung und bucht keinen Bonus", () => {
    const w = welt(), z = zusage(w); z.faellig = w.day;
    const ev = oeffne(w, "zusage", new Rng(3), { provinzen: [], staerke: 1, daten: { zusage: z.id } })!;
    const sicht = ansicht(w, ev), option = sicht.optionen.find(o => o.id === "erfuellen")!;
    expect(JSON.stringify(option)).toContain("keinen Zusagenbonus");
    expect(entscheide(w, ev.id, "erfuellen", new Rng(3)).ok).toBe(true);
    expect(z.erfuellt).toBe(false); expect(chef(w).loyalitaet).toBe(40);
  });
  test("tatsächlich erfüllte Zusage stabilisiert den Partner vor der Koalitionsprüfung am selben Tag", () => {
    const w = welt(), z = zusage(w); w.date = "2028-06-10"; w.day = 0; w.spiel!.start.datum = w.date;
    chef(w).loyalitaet = 12;
    expect(loeseEin(w, z).ok).toBe(true); expect(chef(w).loyalitaet).toBe(12);
    const k = ohneZusage(w);
    for (const x of [w, k]) {
      x.spiel!.gesetze[0]!.absprachen = 600;
      x.day = 21; x.date = "2028-07-01"; spielTick(x, new Rng(19));
    }
    expect(z.erfuellt).toBe(true); expect(w.spiel!.lager).toContain("YENİ");
    expect(k.spiel!.lager).not.toContain("YENİ");
    expect(regierungsSitze(w)).toBe(320); expect(regierungsSitze(k)).toBe(200);
  });
  test.each(["de", "en", "tr"] as const)("Zusagenakte erklärt die Beschlussbedingung auf %s", async lang => {
    await setzeSprache(lang); const w = welt(), z = zusage(w);
    let html = renderToStaticMarkup(<ZusagenAnsicht world={w} refresh={() => {}} />);
    expect(html).toContain(t("zusage.gesetz.offen.titel")); expect(html).toContain(t("zusage.gesetz.aktion"));
    loeseEin(w, z); const stand = save(w);
    html = renderToStaticMarkup(<ZusagenAnsicht world={w} refresh={() => {}} />);
    expect(html).toContain(t("zusage.gesetz.beratung.titel")); expect(html).toContain(t("zusage.gesetz.deckt"));
    expect(html).not.toContain("⟦"); expect(save(w)).toBe(stand);
  });
});
