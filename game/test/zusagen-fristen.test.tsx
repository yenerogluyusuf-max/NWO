import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { bringeEin, REGELN, stufeIn } from "../src/sim/handeln";
import { loeseEin, loeseZusageEin, zusagenSicht } from "../src/sim/zusagen";
import { gefaehrdeteZusagen, zusagenSchrittPlan } from "../src/sim/zusagenwarnung";
import { ansicht, entscheide, ereignisTag, oeffne, standardAntwort } from "../src/sim/ereignisse";
import { ministerVorlagen } from "../src/sim/ministerfluss";
import { hashWert, VERFASSUNG, verfassungVon } from "../src/sim/aufmerksamkeit";
import { aktiveParteivorsitzende, regierungsSitze } from "../src/sim/koalitionslage";
import { fraktion } from "../src/sim/fraktionen";
import { spielTick } from "../src/sim/spiel";
import { addDays, formatDateDe } from "../src/sim/dates";
import { Rng } from "../src/sim/rng";
import { setzeSprache, t } from "../src/i18n";
import { EreignisFenster } from "../src/ui/EreignisFenster";
import { ZusagenSchritte } from "../src/ui/schreibtisch/ZusagenWache";
import type { World } from "../src/sim/types";
import type { Zusage } from "../src/sim/spiel-typen";

function welt(faellig = 0) {
  const w = createWorld(turkey2026, 17);
  startAfterElection(w, { ...schnellProfil(), buendnis: "YENİ" });
  w.date = "2028-06-10"; w.day = 0; w.spiel!.start.datum = w.date;
  w.spiel!.ereignisse = []; w.spiel!.gesetze = []; w.spiel!.zusagen = [];
  w.spiel!.lager = ["YENİ"]; w.spiel!.kapital = 150;
  w.parliament!.seats = { [w.player!.partei.kurz]: 200, "YENİ": 120, CHP: 200, MHP: 50, DEM: 30 };
  fraktion(w, "YENİ").bereitschaft = 60; chef(w).loyalitaet = 30;
  const massnahme = "m_renten", stufeStart = Math.round(stufeIn(w, massnahme, null));
  const z: Zusage = { id: "z-frist", von: "YENİ", text: "Rentenpolitik zugesagt", faellig,
    massnahme, richtung: 1, stufeStart, stufeZiel: stufeStart + 20, erfuellt: false, gebrochen: false };
  w.spiel!.zusagen.push(z);
  verfassungVon(w).belastung = 0;
  return w;
}
const zusage = (w: World) => w.spiel!.zusagen[0]!;
const chef = (w: World) => aktiveParteivorsitzende(w, "YENİ")[0]!;
function erinnerung(w: World, z = zusage(w)) {
  return oeffne(w, "zusage", new Rng(3), { provinzen: [], staerke: 1, daten: { zusage: z.id } })!;
}
function einbringen(w: World, weg: "zusage" | "gesetz") {
  const z = zusage(w);
  return weg === "zusage" ? loeseEin(w, z) : bringeEin(w, z.massnahme!, z.stufeZiel!, null, "gesetz");
}
afterEach(async () => { await setzeSprache("de"); });

describe("Zusagenfristen folgen dem ausreichenden Entwurf statt dem Zugangsweg", () => {
  test.each(["zusage", "gesetz"] as const)("%s gewährt dieselbe Beratungszeit mit und ohne offene Erinnerung", weg => {
    for (const offen of [false, true]) {
      const w = welt(), z = zusage(w); if (offen) erinnerung(w);
      expect(einbringen(w, weg).ok).toBe(true);
      expect(z.faellig).toBe(w.spiel!.gesetze[0]!.abstimmung + 15);
      expect(z.erfuellt).toBe(false); expect(chef(w).loyalitaet).toBe(30);
      expect(w.spiel!.ereignisse.some(e => e.daten?.zusage === z.id)).toBe(false);
    }
  });
  test.each(["zusage", "gesetz"] as const)("%s verkürzt eine noch längere Zusagenfrist nicht", weg => {
    const w = welt(150), z = zusage(w);
    expect(einbringen(w, weg).ok).toBe(true); expect(z.faellig).toBe(150);
    expect(zusagenSicht(w)[0]!.datum).toBe(addDays(w.date, 150));
  });
  test("verzögerte Einbringung rechnet mit dem wirklichen Votum einschließlich zwei Tagen Verzug", () => {
    const w = welt(), z = zusage(w); erinnerung(w);
    verfassungVon(w).belastung = 65;
    while (hashWert(`${w.seed}|${w.day}|${z.massnahme}|verzug`) >= VERFASSUNG.verzugChance) w.seed++;
    expect(einbringen(w, "gesetz").ok).toBe(true);
    expect(w.spiel!.gesetze[0]!.abstimmung).toBe(w.day + REGELN.tageBisAbstimmung + VERFASSUNG.verzugTage);
    expect(z.faellig).toBe(38);
  });
  test.each(["teil", "regional", "gegenlaeufig"] as const)("%s beseitigt weder Erinnerung noch bestehende Frist", art => {
    const w = welt(), z = zusage(w), ev = erinnerung(w);
    const stufe = art === "regional" ? z.stufeZiel! : z.stufeStart! + (art === "teil" ? 5 : -5);
    expect(bringeEin(w, z.massnahme!, stufe, art === "regional" ? [34] : null, "gesetz").ok).toBe(true);
    expect(z.faellig).toBe(0); expect(z.erfuellt).toBe(false);
    expect(w.spiel!.ereignisse).toContain(ev);
    const s = gefaehrdeteZusagen(w)[0]!;
    expect(s.erinnerung?.id).toBe(ev.id); expect(s.gruende).toContain("teil");
    const neu = load(save(w)); ereignisTag(neu, new Rng(19));
    expect(neu.spiel!.ereignisse.some(e => e.id === ev.id)).toBe(true);
  });
  test("ein Entwurf berücksichtigt nur die von ihm erfüllbaren Zusagen mehrerer Fraktionen", () => {
    const w = welt(), z = zusage(w); erinnerung(w);
    const strenger: Zusage = { ...z, id: "z-strenger", von: "CHP", stufeZiel: z.stufeZiel! + 10 };
    w.spiel!.zusagen.push(strenger); const e2 = erinnerung(w, strenger);
    expect(einbringen(w, "gesetz").ok).toBe(true);
    expect(z.faellig).toBe(36); expect(strenger.faellig).toBe(0);
    expect(w.spiel!.ereignisse.map(e => e.id)).toEqual([e2.id]);
  });
  test.each(["kapital", "pause", "entwurf"] as const)("gescheiterte Einlösung wegen %s schenkt keine Zeit und verändert keine Zusage", grund => {
    const w = welt(), z = zusage(w); erinnerung(w);
    if (grund === "kapital") w.spiel!.kapital = -20;
    if (grund === "pause") verfassungVon(w).pauseBis = 10;
    if (grund === "entwurf") bringeEin(w, z.massnahme!, z.stufeStart! + 5, null, "gesetz");
    const vorher = structuredClone(z), ereignisse = structuredClone(w.spiel!.ereignisse), kapital = w.spiel!.kapital;
    expect(loeseZusageEin(w, z).ok).toBe(false);
    expect(z).toEqual(vorher); expect(w.spiel!.ereignisse).toEqual(ereignisse); expect(w.spiel!.kapital).toBe(kapital);
  });
  test.each(["kapital", "pause", "entwurf"] as const)("Erinnerungsantwort bleibt bei %s offen und wird nicht als Entscheidung verbucht", grund => {
    const w = welt(), z = zusage(w), ev = erinnerung(w);
    if (grund === "kapital") w.spiel!.kapital = -20;
    if (grund === "pause") verfassungVon(w).pauseBis = 10;
    if (grund === "entwurf") bringeEin(w, z.massnahme!, z.stufeStart! + 5, null, "gesetz");
    const o = ansicht(w, ev).optionen.find(o => o.id === "erfuellen")!;
    expect(!o.bezahlbar || !!o.sperre).toBe(true);
    expect(standardAntwort(w, ev)).not.toBe("erfuellen");
    const vor = save(w);
    expect(entscheide(w, ev.id, "erfuellen", new Rng(5)).ok).toBe(false); expect(save(w)).toBe(vor);
  });
  test("zulässige Erinnerungsantwort bucht den Gesetzespreis einmal und schließt genau einmal ab", () => {
    const w = welt(), ev = erinnerung(w), o = ansicht(w, ev).optionen.find(o => o.id === "erfuellen")!;
    const kapital = w.spiel!.kapital, chronik = w.spiel!.chronik.length;
    expect(entscheide(w, ev.id, "erfuellen", new Rng(5)).ok).toBe(true);
    expect(w.spiel!.kapital).toBe(kapital - o.anzeigePk!); expect(zusage(w).faellig).toBe(36);
    expect(w.spiel!.chronik.length - chronik).toBe(1); expect(w.spiel!.ereignisse).toHaveLength(0);
  });
  test("Ministermappe übernimmt die konkrete Sperre der offenen Erinnerung", () => {
    const w = welt(), z = zusage(w), ev = erinnerung(w);
    bringeEin(w, z.massnahme!, z.stufeStart! + 5, null, "gesetz");
    const v = ministerVorlagen(w, { tiefe: 0 }).find(v => v.thema === `ereignis:${ev.id}`)!;
    const o = v.optionen.find(o => o.id === "erfuellen")!;
    expect(o.moeglich).toBe(false); expect(o.grund).toBe(t("zusage.gesetz.laeuft"));
  });
  test("unbeantwortete Zusage behält trotz Teilentwurf ihre echte Folge bis zur Monatsprüfung", () => {
    const w = welt(), z = zusage(w); erinnerung(w);
    const ausreichend = load(save(w));
    expect(bringeEin(w, z.massnahme!, z.stufeStart! + 5, null, "gesetz").ok).toBe(true);
    expect(einbringen(ausreichend, "gesetz").ok).toBe(true);
    for (const x of [w, ausreichend]) {
      x.day = 20; x.date = "2028-06-30"; ereignisTag(x, new Rng(19));
    }
    expect(z.gebrochen).toBe(true); expect(chef(w).loyalitaet).toBe(15);
    expect(zusage(ausreichend).gebrochen).toBe(false); expect(chef(ausreichend).loyalitaet).toBe(30);
    for (const x of [w, ausreichend]) {
      x.spiel!.gesetze[0]!.absprachen = -600;
      x.day = 21; x.date = "2028-07-01"; spielTick(x, new Rng(19));
    }
    expect(regierungsSitze(w)).toBe(200); expect(regierungsSitze(ausreichend)).toBe(320);
    expect(zusage(ausreichend).erfuellt).toBe(false); expect(zusage(ausreichend).faellig).toBe(36);
  });
  test.each(["de", "en", "tr"] as const)("Frist und Hindernis stehen vor der Aktion in der Oberfläche auf %s", async lang => {
    await setzeSprache(lang); const w = welt(), z = zusage(w), ev = erinnerung(w);
    const p = zusagenSchrittPlan(w, z.id, "einloesen")!, stand = save(w);
    const html = renderToStaticMarkup(<ZusagenSchritte world={w} s={gefaehrdeteZusagen(w)[0]!} onGehe={() => {}} onErgebnis={() => {}} />);
    expect(html).toContain(t("zusage.gesetz.fristDanach", { datum: formatDateDe(addDays(w.date, p.faelligDanach)) }));
    expect(save(w)).toBe(stand);
    expect(zusagenSicht(w)[0]!.gesetz!.text).toContain(t("zusage.gesetz.fristRegel"));
    bringeEin(w, z.massnahme!, z.stufeStart! + 5, null, "gesetz");
    const a = ansicht(w, ev);
    const fenster = renderToStaticMarkup(<EreignisFenster ansicht={a} datum={w.date} kapital={w.spiel!.kapital} onWaehle={() => {}} onSpaeter={() => {}} />);
    expect(fenster).toContain(`disabled=""`); expect(fenster).toContain(t("zusage.gesetz.laeuft"));
    expect(fenster).not.toContain("⟦"); expect(html).not.toContain("⟦");
  });
});
