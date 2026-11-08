// Enden der Laufbahn und Nachfolger-Wahlkampf: Putsch mit Warnstufen, Amtsenthebung nach AY 105, Gesundheit, Rücktritt, Bilanz-Ursachen, Vermächtnis,
// Wahlkampf für den Nachfolger in der letzten Amtszeit.

import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { figur } from "../src/sim/figuren";
import { eigenVon } from "../src/sim/personen";
import { wirke } from "../src/sim/wirkung";
import { Rng } from "../src/sim/rng";
import { beende } from "../src/sim/spiel";
import { umbildungAbschliessen, waehleZieleAmtszeit, kuereNachfolger } from "../src/sim/amtszeit";
import {
  ENDEN,
  amtsenthebungSitze,
  endenMonat,
  endenSicht,
  endenZustand,
  krankheitAbgeben,
  krankheitOffen,
  krankheitVerschweigen,
  putschRisiko,
  putschVersuch,
  ruecktrittErklaeren,
} from "../src/sim/enden";
import { entscheide } from "../src/sim/ereignisse";
import { erstelleBilanz } from "../src/sim/bilanz";
import { vermaechtnis } from "../src/sim/vermaechtnis";
import { WAHLKAMPF, auftrittVorschau, migriereWahlkampf, nachfolgerAuftritt, wahlEffekte, wahlkampfSicht, wahlkampfTag } from "../src/sim/wahlkampf";
import type { World } from "../src/sim/types";
import type { EndeArt } from "../src/sim/spiel-typen";

const profil: PlayerProfile = {
  name: "Test",
  heimat: "Ankara",
  heimatPlaka: 6,
  jugend: "",
  beruf: "",
  partner: "Bauunternehmer, Aufträge vom Staat möglich",
  motiv: "",
  partei: { name: "Partei der Werte", kurz: "PW", farbe: "#2e6b3f" },
  naehe: {},
  buendnis: "YENİ",
  versprechen: [],
  wahl: { runde: 2, anteil: 51 },
};

function spiel(seed = 5): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, profil);
  w.spiel!.ereignisse = [];
  return w;
}

/** Extremzustand: zerrüttetes Offizierskorps, ehrgeiziger und illoyaler Generalstab, schwache Straße. */
function putschlage(w: World): void {
  wirke(w, "offiziersvertrauen", -90);
  const gf = figur(w, "generalstab")!;
  gf.loyalitaet = 5;
  eigenVon(w, gf).ehrgeiz = 90;
  w.spiel!.umfrage.zustimmung = 25;
}

function nachWiederwahl(seed = 5): World {
  const w = spiel(seed);
  w.spiel!.umfrage.zustimmung = 80;
  w.spiel!.kalibrierung += 33;
  advance(w, w.spiel!.wahltag - w.day + 1);
  if (w.spiel!.wahl?.stichwahl) advance(w, 16);
  if (w.spiel!.amtszeit !== 2) throw new Error("Wiederwahl blieb aus");
  w.spiel!.ereignisse = [];
  return w;
}

function letzteAmtszeit(seed = 5): World {
  const w = nachWiederwahl(seed);
  umbildungAbschliessen(w);
  waehleZieleAmtszeit(w, []);
  kuereNachfolger(w, "offen");
  w.spiel!.ereignisse = [];
  delete w.spiel!.wahlkampf;
  return w;
}

describe("Putsch", () => {
  test("Das Risiko steigt mit zerrüttetem Offiziersvertrauen, ehrgeizigem Generalstab und schwacher Straße", () => {
    const w = spiel();
    const vorher = putschRisiko(w).risiko;
    putschlage(w);
    const r = putschRisiko(w);
    expect(r.risiko).toBeGreaterThan(vorher + 20);
    expect(r.risiko).toBeGreaterThanOrEqual(ENDEN.putschStufe3);
    expect(r.teile.reduce((s, x) => s + x.punkte, 0)).toBeGreaterThan(70);
    expect(endenSicht(w).putsch.stufe).toBe(3);
  });

  test("Der Putschversuch gelingt bei zerrüttetem Korps und beendet die Laufbahn", () => {
    const w = spiel();
    putschlage(w);
    expect(putschVersuch(w, new Rng(1))).toBe("gelungen");
    expect(w.spiel!.ende?.art).toBe("putsch");
    expect(w.spiel!.ereignisse).toEqual([]);
  });

  test("Der Putschversuch scheitert bei loyalem Korps: Generalstab wird ersetzt, Schutz ein Jahr, Laufbahn geht weiter", () => {
    const w = spiel();
    wirke(w, "offiziersvertrauen", 50);
    const gf = figur(w, "generalstab")!;
    const alt = gf.name;
    gf.loyalitaet = 90;
    eigenVon(w, gf).ehrgeiz = 10;
    w.spiel!.umfrage.zustimmung = 70;
    expect(putschVersuch(w, new Rng(2))).toBe("gescheitert");
    const sp = w.spiel!;
    expect(sp.ende).toBeUndefined();
    expect(figur(w, "generalstab")!.name).not.toBe(alt);
    expect(endenZustand(w).putsch.geschuetztBis).toBeGreaterThan(w.day + 300);
    expect(sp.hinweise.some((h) => h.id.startsWith("putsch-gescheitert-"))).toBe(true);
  });

  test("Auf Stufe 3 öffnet der Monatshaken die Warnung oder es kommt zum Versuch; die Warnung bietet drei Antworten", () => {
    let warnung = 0;
    let versuche = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const w = spiel(seed + 20);
      putschlage(w);
      endenMonat(w, new Rng(seed));
      const z = endenZustand(w);
      expect(z.putsch.stufe).toBe(3);
      if (z.putsch.versuche > 0) versuche++;
      else if (w.spiel!.ereignisse.some((e) => e.vorlage === "putsch_warnung")) warnung++;
    }
    expect(warnung).toBeGreaterThan(10);
    expect(versuche).toBeLessThan(15);
    const w = spiel(31);
    putschlage(w);
    for (let seed = 1; seed <= 40 && !w.spiel!.ereignisse.some((e) => e.vorlage === "putsch_warnung"); seed++) {
      const k = JSON.parse(JSON.stringify(w)) as World;
      endenMonat(k, new Rng(seed));
      if (k.spiel!.ereignisse.some((e) => e.vorlage === "putsch_warnung") && !k.spiel!.ende) {
        const ev = k.spiel!.ereignisse.find((e) => e.vorlage === "putsch_warnung")!;
        k.spiel!.kapital = 50;
        const r = entscheide(k, ev.id, "einbinden", new Rng(1));
        expect(r.ok).toBe(true);
        expect(endenZustand(k).putsch.geschuetztBis).toBeGreaterThan(k.day + 300);
        return;
      }
    }
    throw new Error("Keine Warnung gefunden");
  });
});

describe("Amtsenthebung (AY 105)", () => {
  test("Gegen den Präsidenten zählen alle außerhalb des Lagers plus Abweichler im Lager; Einschwören halbiert die Abweichler", () => {
    const w = spiel();
    w.spiel!.umfrage.zustimmung = 30;
    const a = amtsenthebungSitze(w);
    expect(a.gegen).toBeGreaterThan(w.parliament!.seats ? 600 - a.lager : 0);
    expect(a.abweichler).toBeGreaterThan(0);
    endenZustand(w).amtsenthebung.schutzBis = w.day + 100;
    expect(amtsenthebungSitze(w).abweichler).toBeLessThanOrEqual(Math.round(a.abweichler / 2) + 1);
  });

  test("Das Verfassungsgericht verurteilt bei hoher Unabhängigkeit häufig, bei niedriger selten", () => {
    const zaehle = (unabhaengig: number): number => {
      let n = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const w = spiel(seed + 40);
        wirke(w, "justiz_unabhaengigkeit", unabhaengig - 50);
        const z = endenZustand(w);
        z.amtsenthebung = { stufe: 3, seit: w.day - 70, gegenSitze: 420, verfahrenTag: w.day - 200 };
        // genügend Sitze gegen den Präsidenten, damit die Anklage steht
        const seats = w.parliament!.seats;
        for (const p of Object.keys(seats)) seats[p] = p === profil.partei.kurz ? 150 : Math.round(450 / (Object.keys(seats).length - 1));
        endenMonat(w, new Rng(seed));
        if (w.spiel!.ende?.art === "amtsenthebung") n++;
      }
      return n;
    };
    expect(zaehle(100)).toBeGreaterThan(zaehle(0));
  });

  test("Ein Antrag ohne Mehrheit verläuft im Sand (Stufe 1 fällt auf 0)", () => {
    const w = spiel();
    const z = endenZustand(w);
    z.amtsenthebung = { stufe: 1, seit: w.day - 10, gegenSitze: 305, verfahrenTag: w.day - 10 };
    w.spiel!.umfrage.zustimmung = 70;
    endenMonat(w, new Rng(3));
    expect(z.amtsenthebung.stufe).toBe(0);
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("amtsenthebung-ende-"))).toBe(true);
  });
});

describe("Gesundheit und Rücktritt", () => {
  test("Offen sagen: Behandlung, nach drei Monaten wieder gesund", () => {
    const w = spiel();
    krankheitOffen(w);
    const g = endenZustand(w).gesundheit;
    expect(g.zustand).toBe("krank");
    w.day += 100;
    endenMonat(w, new Rng(1));
    expect(g.zustand).toBe("gesund");
  });

  test("Verschweigen führt über Gerüchte irgendwann zum Zusammenbruch (Rücktritt oder Tod)", () => {
    const w = spiel();
    krankheitVerschweigen(w);
    let monate = 0;
    const rng = new Rng(7);
    while (!w.spiel!.ende && monate < 400) {
      w.day += 30;
      endenMonat(w, rng);
      monate++;
    }
    expect(["ruecktritt", "tod"]).toContain(w.spiel!.ende?.art);
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("gesundheit-leck-"))).toBe(true);
  });

  test("Aus Gesundheitsgründen zurücktreten beendet die Laufbahn mit Rücktritt", () => {
    const w = spiel();
    krankheitAbgeben(w);
    expect(w.spiel!.ende?.art).toBe("ruecktritt");
  });

  test("Bei Zustimmung am Boden und wankendem Lager kommt die Rücktrittsforderung; Rücktritt erklären beendet", () => {
    const w = spiel();
    w.spiel!.umfrage.zustimmung = 20;
    for (const f of w.spiel!.figuren) if (f.amt === "partner") f.loyalitaet = 20;
    endenMonat(w, new Rng(2));
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "ruecktritt_forderung")).toBe(true);
    ruecktrittErklaeren(w);
    expect(w.spiel!.ende?.art).toBe("ruecktritt");
  });
});

describe("Bilanz und Vermächtnis aller Enden", () => {
  const ARTEN: EndeArt[] = ["abwahl", "sturz", "amtszeitende", "ruecktritt", "putsch", "amtsenthebung", "tod"];
  for (const art of ARTEN) {
    test(`Ende ${art}: Bilanz nennt Ursachen, Vermächtnis hat alle Kapitel und ist JSON`, () => {
      const w = spiel();
      advance(w, 200);
      beende(w, art, "Titel", "Text");
      const b = erstelleBilanz(w);
      if (art !== "tod" && art !== "amtszeitende") expect(b.absaetze.join(" ")).toMatch(/Warum es endete/);
      if (art === "tod") expect(b.absaetze.join(" ")).toMatch(/starb im Amt/);
      const d = vermaechtnis(w);
      expect(d.ende?.art).toBe(art);
      expect(d.amtszeiten.length).toBeGreaterThanOrEqual(1);
      expect(d.kabinett.amtierend.length).toBeGreaterThan(3);
      expect(d.kurve.length).toBeGreaterThan(1);
      expect(() => JSON.stringify(d)).not.toThrow();
    });
  }
});

describe("Wahlkampf für den Nachfolger (letzte Amtszeit)", () => {
  test("In der ersten Amtszeit kämpft der Präsident für sich; Auftritte für einen Nachfolger gibt es nicht", () => {
    const w = spiel();
    w.spiel!.wahltag = w.day + 40;
    wahlkampfTag(w);
    expect(w.spiel!.wahlkampf?.rolle).toBe("amt");
    expect(wahlkampfSicht(w).rolle).toBe("amt");
    expect(nachfolgerAuftritt(w, "gemeinsam").ok).toBe(false);
  });

  test("In der letzten Amtszeit kämpft der Präsident für den Nachfolger: Rolle, Sicht, Beginn-Hinweis", () => {
    const w = letzteAmtszeit();
    w.spiel!.wahltag = w.day + 40;
    wahlkampfTag(w);
    const k = w.spiel!.wahlkampf!;
    expect(k.rolle).toBe("nachfolger");
    const s = wahlkampfSicht(w);
    expect(s.rolle).toBe("nachfolger");
    expect(s.nachfolger?.name).toBe(w.spiel!.nachfolge!.nachfolger!.name);
    expect(s.auftritte?.vorschau.gemeinsam.uebrig).toBe(WAHLKAMPF.auftrittGemeinsamMax);
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("wahlkampf-beginn-") && h.text.join(" ").includes(s.nachfolger!.name))).toBe(true);
  });

  test("Gemeinsame Auftritte wirken mit der Beliebtheit des Präsidenten, auch negativ; Deckel und Abnutzung gelten", () => {
    const w = letzteAmtszeit();
    w.spiel!.wahltag = w.day + 40;
    wahlkampfTag(w);
    w.spiel!.umfrage.zustimmung = 80;
    expect(auftrittVorschau(w, "gemeinsam").punkte).toBeGreaterThan(0.5);
    w.spiel!.umfrage.zustimmung = 30;
    expect(auftrittVorschau(w, "gemeinsam").punkte).toBeLessThan(0);
    w.spiel!.umfrage.zustimmung = 80;
    const ap = w.spiel!.wahlkampf!.ap;
    const r1 = nachfolgerAuftritt(w, "gemeinsam");
    expect(r1.ok).toBe(true);
    expect(w.spiel!.wahlkampf!.ap).toBe(ap - WAHLKAMPF.auftrittGemeinsamAp);
    const erst = w.spiel!.wahlkampf!.nachfolgerAuftritte!.punkte;
    expect(erst).toBeLessThanOrEqual(WAHLKAMPF.auftrittGemeinsamDeckel);
    expect(nachfolgerAuftritt(w, "gemeinsam").ok).toBe(true);
    const zweit = w.spiel!.wahlkampf!.nachfolgerAuftritte!.punkte - erst;
    expect(zweit).toBeLessThan(erst);
    expect(nachfolgerAuftritt(w, "gemeinsam").ok).toBe(false);
    expect(wahlEffekte(w).teile.some((x) => x.name === "Auftritte des Nachfolgers")).toBe(true);
  });

  test("Auftritte brauchen Aktionspunkte", () => {
    const w = letzteAmtszeit();
    w.spiel!.wahltag = w.day + 40;
    wahlkampfTag(w);
    w.spiel!.wahlkampf!.ap = 0.5;
    expect(nachfolgerAuftritt(w, "allein").ok).toBe(false);
  });

  test("Das TV-Duell tritt der Nachfolger aus: Die Szene spricht nicht vom Präsidenten", () => {
    const w = letzteAmtszeit();
    w.spiel!.wahltag = w.day + 40;
    wahlkampfTag(w);
    w.spiel!.wahltag = w.day + 10;
    wahlkampfTag(w);
    const d = w.spiel!.wahlkampf!.duell;
    expect(d.tag).toBeDefined();
    expect(d.szene).toBeTruthy();
    expect(d.szene).not.toMatch(/Der Präsident|der Präsident/);
  });

  test("Alte Spielstände im Wahlkampf ohne Rolle bekommen sie bei der Migration aus der Amtszeit", () => {
    const w = letzteAmtszeit();
    w.spiel!.wahltag = w.day + 40;
    wahlkampfTag(w);
    delete w.spiel!.wahlkampf!.rolle;
    expect(wahlkampfSicht(w).rolle).toBe("amt");
    migriereWahlkampf(w);
    expect(w.spiel!.wahlkampf!.rolle).toBe("nachfolger");
    const e = spiel();
    e.spiel!.wahltag = e.day + 40;
    wahlkampfTag(e);
    delete e.spiel!.wahlkampf!.rolle;
    migriereWahlkampf(e);
    expect(e.spiel!.wahlkampf!.rolle).toBe("amt");
  });
});
