// Takt und Gegenkräfte (sim/ereignisse.ts, sim/takt.ts, sim/berichte.ts, sim/kabinett.ts, sim/katastrophe.ts, ui/mentor.ts, ui/schreibtisch/briefing.ts):
// Das Jahr bekommt einen Rhythmus, Entscheidungen haben Gedächtnis und Folgen, Nichtstun hat einen Preis.

import { afterEach, describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { wirke } from "../src/sim/wirkung";
import { TAKT, ansicht, entscheide, ereignisMonat, ereignisTag, oeffne, vorlage } from "../src/sim/ereignisse";
import { SAISON_VORLAGEN, NEUWAHLFORDERUNG } from "../src/sim/ereignisse-saison";
import { PERSONEN_VORLAGEN } from "../src/sim/ereignisse-personen";
import { GEGENKRAFT, altlast, kapitalVerfall, neuwahlForderungFaellig, taktMonat } from "../src/sim/takt";
import { berichteTag, momentaufnahme, rueckblickAnlegen } from "../src/sim/berichte";
import { kapitalEinkommen } from "../src/sim/spiel";
import { setPolicy } from "../src/sim/handeln";
import { PROGRAMME, programmZustand } from "../src/sim/programme";
import { AEMTER, HOCH_SCHLECHT } from "../src/sim/personen";
import { bereiteKabinettssitzungVor, halteKabinettssitzungAb, kabinettStatus } from "../src/sim/kabinett";
import { zornMonat } from "../src/sim/katastrophe";
import { mentorNotes } from "../src/ui/mentor";
import { KALENDER, termine } from "../src/ui/schreibtisch/briefing";
import { dayOfMonth } from "../src/sim/dates";
import { Rng } from "../src/sim/rng";
import { setzeSprache } from "../src/i18n";
import type { KatastropheFall } from "../src/sim/spiel-typen";
import type { World } from "../src/sim/types";

function welt(seed = 3): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.hinweise = [];
  w.spiel!.kapital = 60;
  return w;
}

/** Läuft bis zum nächsten Monatsersten (nach einem Vorlauf), ohne Ereignisse stehen zu lassen. */
function zumMonatsersten(w: World, vorlauf = 200): void {
  advance(w, vorlauf);
  while (dayOfMonth(w.date) !== 1) advance(w, 1);
  w.spiel!.ereignisse = [];
  w.spiel!.geplant = [];
}

afterEach(async () => {
  await setzeSprache("de");
});

describe("Takt: Eröffnungstage", () => {
  test("Die Sieger des Monatswettbewerbs öffnen verteilt über den Monat, nicht am Monatsersten", () => {
    let mitPlan = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const w = welt(seed);
      zumMonatsersten(w);
      ereignisMonat(w, new Rng(seed));
      const plan = w.spiel!.geplant ?? [];
      if (plan.length) mitPlan++;
      const nichtFest = plan.filter((p) => vorlage(p.vorlage).tag === undefined).map((p) => p.tag).sort((a, b) => a - b);
      for (const p of plan) {
        expect(p.tag, `seed ${seed} ${p.vorlage}`).toBeGreaterThan(w.day);
        expect(p.tag, `seed ${seed} ${p.vorlage}`).toBeLessThanOrEqual(w.day + 28);
      }
      // gewürfelte Tage liegen mindestens einen Tag, in der Regel sechs Tage auseinander
      for (let i = 1; i < nichtFest.length; i++) expect(nichtFest[i]! - nichtFest[i - 1]!).toBeGreaterThanOrEqual(TAKT.abstandMin);
    }
    expect(mitPlan).toBeGreaterThan(8);
  });

  test("Ein geplanter Vorgang öffnet an seinem Tag und nicht früher", () => {
    const w = welt();
    w.spiel!.geplant = [{ vorlage: "mietproteste", tag: w.day + 3, provinzen: [34], staerke: 1 }];
    advance(w, 2);
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "mietproteste")).toBe(false);
    advance(w, 2);
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "mietproteste")).toBe(true);
    expect(w.spiel!.geplant ?? []).toHaveLength(0);
  });

  test("Ist die Obergrenze erreicht, rückt der Plan nach und wird danach wie ein Verlierer behandelt", () => {
    const w = welt();
    const rng = new Rng(1);
    for (const id of ["streikwelle", "mietproteste", "aerztestreik"]) oeffne(w, id, rng, { provinzen: [34], staerke: 1 });
    w.spiel!.ereignisse.forEach((e) => (e.frist = w.day + 999));
    w.spiel!.geplant = [{ vorlage: "studentenproteste", tag: w.day, provinzen: [34], staerke: 1 }];
    ereignisTag(w, rng);
    expect(w.spiel!.geplant![0]!.verschoben).toBe(1);
    expect(w.spiel!.geplant![0]!.tag).toBe(w.day + TAKT.verschiebungTage);
    const chronik0 = w.spiel!.chronik.length;
    for (let i = 0; i < TAKT.maxVerschiebungen; i++) {
      w.day += TAKT.verschiebungTage;
      ereignisTag(w, rng);
    }
    expect(w.spiel!.geplant ?? []).toHaveLength(0);
    expect(w.spiel!.chronik.length).toBeGreaterThan(chronik0); // „Im Hintergrund gärt es weiter“
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "studentenproteste")).toBe(false);
  });

  test("Fällige Zusagen kommen der Reihe nach: mit Mindestabstand, höchstens eine je Tag und zwei gleichzeitig", () => {
    const w = welt();
    for (let i = 0; i < 6; i++) w.spiel!.zusagen.push({ id: `z-t${i}`, von: "PW", text: `Versprechen ${i}`, faellig: w.day - 1 - i, erfuellt: false, gebrochen: false });
    const offene = () => w.spiel!.ereignisse.filter((e) => e.vorlage === "zusage").length;
    const rng = new Rng(2);
    ereignisTag(w, rng);
    expect(offene()).toBe(TAKT.zusageProTag);
    // Vor Ablauf des Mindestabstands kommt keine zweite
    w.day += TAKT.zusageAbstand - 1;
    ereignisTag(w, rng);
    expect(offene()).toBe(TAKT.zusageProTag);
    w.day += 1;
    ereignisTag(w, rng);
    expect(offene()).toBe(TAKT.zusageGleichzeitig);
    // Zwei sind offen: auch nach dem nächsten Abstand kommt keine dritte, solange nichts beantwortet ist
    w.day += TAKT.zusageAbstand;
    ereignisTag(w, rng);
    expect(offene()).toBe(TAKT.zusageGleichzeitig);
  });
});

describe("Gegenkräfte", () => {
  test("Kapital über der Schwelle verfällt, brachliegender Rückhalt kostet Legitimität", () => {
    expect(kapitalVerfall(GEGENKRAFT.kapitalSchwelle)).toBe(0);
    expect(kapitalVerfall(90)).toBe(0);
    expect(kapitalVerfall(150)).toBeCloseTo(50 * GEGENKRAFT.kapitalVerfall, 6);
    const w = welt();
    w.spiel!.kapital = 150;
    const legit0 = nationalAverage(NET, w.net, "legitimitaet");
    taktMonat(w);
    expect(w.spiel!.kapital).toBeCloseTo(150 - kapitalVerfall(150), 6);
    expect(nationalAverage(NET, w.net, "legitimitaet")).toBeLessThan(legit0);
    // unter der Schwelle geschieht nichts
    const w2 = welt();
    w2.spiel!.kapital = 80;
    taktMonat(w2);
    expect(w2.spiel!.kapital).toBe(80);
  });

  test("Altlasten zehren am Monatseinkommen: überfällige Zusagen verteuern das Regieren", () => {
    const w = welt();
    const a0 = altlast(w);
    const summe0 = kapitalEinkommen(w).summe;
    w.spiel!.zusagen.push({ id: "z-alt", von: "PW", text: "Altes Versprechen", faellig: w.day - 200, erfuellt: false, gebrochen: false });
    expect(altlast(w)).toBeGreaterThan(a0);
    expect(kapitalEinkommen(w).summe).toBeLessThan(summe0);
    expect(kapitalEinkommen(w).altlast).toBeCloseTo(altlast(w), 6);
    expect(altlast(w)).toBeLessThanOrEqual(GEGENKRAFT.altlastMax);
  });

  test("Eine Zusage, die ein Jahr überfällig ist, verfällt als Bruch", () => {
    const w = welt();
    w.spiel!.zusagen.push({ id: "z-alt", von: "PW", text: "Altes Versprechen", faellig: w.day - GEGENKRAFT.zusageVerfall - 5, erfuellt: false, gebrochen: false });
    taktMonat(w);
    expect(w.spiel!.zusagen.find((z) => z.id === "z-alt")!.gebrochen).toBe(true);
  });

  test("Ein dauerhaft schwaches Lager löst die Neuwahlforderung aus; ihre Antworten haben Folgen", () => {
    const w = welt();
    w.spiel!.lager = [];
    w.spiel!.umfrage.zustimmung = 38;
    for (let i = 0; i < GEGENKRAFT.schwachMonate; i++) taktMonat(w);
    expect(w.spiel!.gegenkraft!.schwachMonate).toBeGreaterThanOrEqual(GEGENKRAFT.schwachMonate);
    expect(neuwahlForderungFaellig(w)).toBe(true);
    expect(NEUWAHLFORDERUNG.chance(w)).toBeGreaterThan(0);
    const ev = oeffne(w, "neuwahlforderung", new Rng(4))!;
    expect(ev).toBeTruthy();
    const r = entscheide(w, ev.id, "neuwahl", new Rng(5));
    expect(r.ok).toBe(true);
    expect(w.spiel!.wahltag).toBeLessThanOrEqual(w.day + 60);
    // gerade beantwortet: kein zweites Mal binnen eines Jahres
    expect(neuwahlForderungFaellig(w)).toBe(false);
  });

  test("Zorn über zu wenig Hilfe: viele Tote ohne Hilfe kosten Vertrauen, versorgte Fälle nicht", () => {
    const fall = (w: World, tote: number, hilfe: boolean): KatastropheFall => ({
      id: "t", art: "erdbeben", provinzen: [31, 46], tag: w.day - 100, datum: w.date, staerke: 0.9, tote, verletzte: 0, obdachlos: 0, wohnungen: 100000, bereitschaft: 30,
      verhindert: { tote: 0, wohnungen: 0 }, hilfe: hilfe ? { soforthilfe: true, uebergangBis: w.day + 30 } : { soforthilfe: false }, privatGeliefert: hilfe ? 100000 : 0,
    });
    const vertrauen = (w: World) => nationalAverage(NET, w.net, "vertrauen_regierung");
    const a = welt();
    const a0 = vertrauen(a);
    zornMonat(a, fall(a, 60000, false), null);
    expect(vertrauen(a)).toBeLessThan(a0);
    const b = welt();
    const b0 = vertrauen(b);
    zornMonat(b, fall(b, 60000, true), null);
    expect(vertrauen(b)).toBeCloseTo(b0, 6);
    const c = welt();
    const c0 = vertrauen(c);
    zornMonat(c, fall(c, 200, false), null); // unter der Schwelle
    expect(vertrauen(c)).toBeCloseTo(c0, 6);
  });
});

describe("Gedächtnis: Rückblicke und Folgehaken", () => {
  test("Eine Entscheidung mit erkennbarer Wirkung bekommt Berichte nach 6, 12 und 24 Monaten", () => {
    const w = welt();
    const vor = momentaufnahme(w);
    wirke(w, "mieten", 12);
    expect(rueckblickAnlegen(w, "ereignis", "Test: Mieten", vor, momentaufnahme(w))).toBe(true);
    const r = w.spiel!.rueckblicke![0]!;
    expect(Object.keys(r.werte)).toContain("mieten");
    advance(w, 30 * 6 + 3);
    const b6 = w.spiel!.berichte!.find((b) => b.massnahme.startsWith("rueckblick:") && b.monate === 6);
    expect(b6).toBeTruthy();
    expect(b6!.groessen!.some((g) => g.id === "mieten")).toBe(true);
    expect(b6!.zeilen.length).toBeGreaterThan(0);
  });

  test("Hat die Entscheidung nichts bewegt, entsteht kein Rückblick", () => {
    const w = welt();
    const vor = momentaufnahme(w);
    expect(rueckblickAnlegen(w, "ereignis", "Nichts", vor, momentaufnahme(w))).toBe(false);
    expect(w.spiel!.rueckblicke ?? []).toHaveLength(0);
  });

  test("Ein schlechtes Urteil hält an (Hinweis der Klasse B), höchstens einmal in dreißig Tagen", () => {
    const w = welt();
    w.spiel!.rueckblicke = [
      { id: "ereignis:a:0", art: "ereignis", name: "Test A", tag: w.day - 200, werte: { vertrauen_regierung: 95 }, berichtet: [] },
      { id: "ereignis:b:0", art: "ereignis", name: "Test B", tag: w.day - 200, werte: { vertrauen_regierung: 95 }, berichtet: [] },
    ];
    berichteTag(w);
    const stopps = w.spiel!.hinweise.filter((h) => h.id.startsWith("bericht-schlecht-"));
    expect(stopps).toHaveLength(1);
    expect(w.spiel!.berichte!.filter((b) => b.massnahme.startsWith("rueckblick:"))).toHaveLength(2);
  });

  test("Schon vorhandene Programmschritte werden beim ersten Zählen nur markiert; neue bekommen einen Rückblick", () => {
    const w = welt();
    const schritte = PROGRAMME.flatMap((p) => p.schritte);
    programmZustand(w).fertig = [schritte[0]!.id];
    taktMonat(w);
    const marke = w.spiel!.rueckblicke!.find((r) => r.id === `programm:${schritte[0]!.id}`);
    expect(marke?.stumm).toBe(true);
    // ein weiterer Schritt wird fertig: Rückblick (oder, ohne beobachtbare Größe, nur eine Markierung), nie ein doppelter Eintrag
    programmZustand(w).fertig = [schritte[0]!.id, schritte[1]!.id];
    taktMonat(w);
    taktMonat(w);
    expect(w.spiel!.rueckblicke!.filter((r) => r.id === `programm:${schritte[1]!.id}`)).toHaveLength(1);
  });

  test("Gesetze bekommen einen dritten Bericht nach 24 Monaten", () => {
    const w = welt();
    setPolicy(w, "m_mindestlohn", 90);
    advance(w, 30 * 25);
    const monate = (w.spiel!.berichte ?? []).filter((b) => (b.name ?? "").includes("Mindestlohn")).map((b) => b.monate).sort((a, b) => a - b);
    expect(monate).toEqual([6, 12, 24]);
  });

  test("Folgehaken: ein ausgesessener Rechnungshofbericht kommt als Affäre zurück", () => {
    const w = welt();
    w.spiel!.kapital = 100;
    const rng = new Rng(7);
    const ev = oeffne(w, "saison_rechnungshof", rng)!;
    expect(entscheide(w, ev.id, "aussitzen", rng).ok).toBe(true);
    const f = w.spiel!.folgen!.find((x) => x.vorlage === "korruptionsaffaere")!;
    expect(f).toBeTruthy();
    expect(f.tag).toBeGreaterThanOrEqual(w.day + 90);
    expect(f.tag).toBeLessThanOrEqual(w.day + 240);
    w.day = f.tag;
    ereignisTag(w, rng);
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "korruptionsaffaere")).toBe(true);
    expect(w.spiel!.folgen ?? []).toHaveLength(0);
  });
});

describe("Kabinett, Mentorin und Kalender", () => {
  test("Auch bei Meuterei gibt es nicht beliebig oft eine Sitzung", () => {
    const w = welt();
    for (const f of w.spiel!.figuren) if (AEMTER[f.amt].regierungsamt) f.loyalitaet = 20;
    expect(kabinettStatus(w).disziplin).toBe("rebellisch");
    w.spiel!.zuletzt.kabinettssitzung = w.day - 5;
    expect(kabinettStatus(w).sitzungMoeglich).toBe(false);
    w.spiel!.zuletzt.kabinettssitzung = w.day - 20;
    expect(kabinettStatus(w).sitzungMoeglich).toBe(true);
  });

  test("Der größte Ressortkonflikt wird Thema der Sitzung; die Antwort wirkt auf die Person", () => {
    const w = welt();
    const f = w.spiel!.figuren.find((x) => AEMTER[x.amt].regierungsamt && x.imAmt)!;
    for (const id of AEMTER[f.amt].fach) if (NET.index.has(id)) wirke(w, id, HOCH_SCHLECHT.has(id) ? 90 : -90);
    const themen = bereiteKabinettssitzungVor(w);
    const konflikt = themen.find((t) => t.id.startsWith("ressortkonflikt_"));
    expect(konflikt).toBeTruthy();
    expect(konflikt!.optionen.map((o) => o.id)).toEqual(["mittel", "reihenfolge", "ruege"]);
    const amt = konflikt!.id.replace("ressortkonflikt_", "");
    const person = w.spiel!.figuren.find((x) => x.amt === amt)!;
    const l0 = person.loyalitaet;
    w.spiel!.kapital = 50;
    const r = halteKabinettssitzungAb(w, konflikt!.id, "mittel");
    expect(r.erfolg).toBe(true);
    expect(person.loyalitaet).toBeGreaterThan(l0);
  });

  test("Mentorin: jede Notiz nur einmal, die dringendste zuerst", () => {
    const w = welt();
    advance(w, 70);
    w.spiel!.kapital = 5;
    const notizen = mentorNotes(w);
    const ids = notizen.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(notizen.filter((n) => /Kapital/.test(n.short) && /knapp|aufgebraucht/.test(n.short))).toHaveLength(1);
    const prios = notizen.map((n) => n.prio ?? 0);
    expect(prios).toEqual([...prios].sort((a, b) => b - a));
    expect(notizen.length).toBeLessThanOrEqual(5);
  });

  test("Terminblatt: Zinssitzung und Jahreskalender stehen darin, die Termine mit Entscheidung bleiben", () => {
    const w = welt();
    const t = termine(w);
    expect(t.some((x) => x.id === "zins")).toBe(true);
    expect(t.some((x) => x.id === "wahl")).toBe(true);
    expect(t.map((x) => x.tage)).toEqual([...t.map((x) => x.tage)].sort((a, b) => a - b));
    const ids = KALENDER.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const k of KALENDER.filter((x) => x.nurAnzeige)) expect(k.weich).toBe(true);
  });
});

describe("Neue Ereignisse: Texte in drei Sprachen", () => {
  const neue = [...SAISON_VORLAGEN, ...PERSONEN_VORLAGEN.filter((v) => v.id === "person_altersruecktritt")];

  test("Jede neue Vorlage hat lesbare Texte und rechnet ihre Antworten fehlerfrei, in Deutsch, Türkisch und Englisch", async () => {
    for (const lang of ["de", "tr", "en"] as const) {
      await setzeSprache(lang);
      for (const v of neue) {
        let geoeffnet = 0;
        for (let seed = 1; seed <= 6; seed++) {
          const w = welt(seed);
          w.spiel!.kapital = 100;
          const ev = oeffne(w, v.id, new Rng(seed * 17));
          if (!ev) continue;
          geoeffnet++;
          const a = ansicht(w, ev);
          const alles = [a.titel, ...a.text, a.warum, ...a.optionen.flatMap((o) => [o.label, o.beschreibung])].join(" ¦ ");
          expect(alles, `${lang} ${v.id}`).not.toMatch(/⟦|undefined|NaN|\[object|\$\{/);
          for (const o of a.optionen) {
            const w2 = welt(seed);
            w2.spiel!.kapital = 100;
            const ev2 = oeffne(w2, v.id, new Rng(seed * 17))!;
            const r = entscheide(w2, ev2.id, o.id, new Rng(5));
            if (r.ok) expect(r.text, `${lang} ${v.id}/${o.id}`).not.toMatch(/⟦|undefined|NaN|\[object|\$\{/);
          }
        }
        expect(geoeffnet, `${lang} ${v.id}`).toBeGreaterThan(0);
      }
    }
  });

  test("Saisonereignisse haben feste Kalendertage und Standardfolgen", () => {
    for (const v of SAISON_VORLAGEN.filter((x) => x.id.startsWith("saison_"))) {
      expect(v.tag, v.id).toBeGreaterThanOrEqual(1);
      expect(v.tag, v.id).toBeLessThanOrEqual(28);
      const w = welt();
      const ev = oeffne(w, v.id, new Rng(1))!;
      expect(typeof v.standard(w, ev, new Rng(1))).toBe("string");
    }
  });
});
