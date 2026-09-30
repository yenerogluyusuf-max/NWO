// Die Wirtschaftsakte: Verläufe aller Kennzahlen, Zinssitzungen mit Druck und Weisung, Haushaltsposten mit Folgen, Zinsdienst des Staates,
// Folgeketten und alte Spielstände.

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save, setFiscalImpulse } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { metricValue, prognoseReihen } from "../src/sim/forecast";
import { alleMarken, defizitJetzt, verlauf, wirtschaftZustand, zbZustand, zinsausgabenJetzt } from "../src/sim/wirtschaft";
import { KENNZAHLEN, aktuellerWert, kennzahl } from "../src/sim/wirtschaft-kennzahlen";
import { aendereStufe, druckOptionen, druckWirkung, ernenneGouverneur, machDruck, naechsteSitzung, setzeVorgabe } from "../src/sim/zentralbank";
import { PAKETE, POSTEN, haushaltMonat, impulsAusPosten, postenVorschau, setzePosten, stufeVon, wendePaketAn } from "../src/sim/haushalt";
import { impulsKette, netzKette, zinsKette } from "../src/sim/folgen";
import { ZINSSATZ_START } from "../src/data/haushaltsplan";
import type { World } from "../src/sim/types";

function welt(seed = 3, stance?: "vorsichtig" | "ausgewogen" | "gefuegig"): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 60;
  if (stance) w.governor.stance = stance;
  // Das Lager hat die Mehrheit, damit Gesetzesänderungen möglich sind
  const p = w.player!.partei.kurz;
  w.parliament!.seats[p] = 450;
  return w;
}

/** Ereignisse würden die Läufe stören; sie werden laufend geleert. */
function bis(w: World, tag: number): void {
  while (w.day < tag) {
    advance(w, 1);
    w.spiel!.ereignisse = [];
  }
}

describe("Kennzahlen und Verläufe", () => {
  test("Jede Kennzahl hat einen endlichen Wert, einen Verlauf, eine gültige Prognosegröße und Treiber", () => {
    const w = welt();
    bis(w, 200);
    expect(KENNZAHLEN.length).toBeGreaterThanOrEqual(18);
    const ids = new Set(KENNZAHLEN.map((k) => k.id));
    expect(ids.size).toBe(KENNZAHLEN.length);
    for (const k of KENNZAHLEN) {
      const v = verlauf(w, k.id);
      expect(v.length, k.id).toBeGreaterThanOrEqual(12);
      for (const p of v) expect(Number.isFinite(p.wert), `${k.id} ${p.monat}`).toBe(true);
      expect(Number.isFinite(aktuellerWert(w, k.id)), k.id).toBe(true);
      if (k.prognose) expect(Number.isFinite(metricValue(w, k.prognose as never)), `${k.id} Prognose`).toBe(true);
      const t = k.treiber(w);
      for (const z of t.zeilen) expect(Number.isFinite(z.wirkung), `${k.id}: ${z.name}`).toBe(true);
      expect(k.erklaerung.length, k.id).toBeGreaterThan(30);
      expect(k.handlungen.length, k.id).toBeGreaterThan(0);
    }
  });

  test("Die Reihen wachsen monatlich, mit der Achse im Gleichschritt, und bleiben begrenzt", () => {
    const w = welt();
    const z = wirtschaftZustand(w);
    const n0 = z.monate.length;
    bis(w, 130);
    expect(z.monate.length).toBeGreaterThan(n0);
    for (const r of Object.values(z.reihen)) expect(r).toHaveLength(z.monate.length);
    bis(w, 365 * 11);
    expect(z.monate.length).toBeLessThanOrEqual(120);
    for (const r of Object.values(z.reihen)) expect(r).toHaveLength(z.monate.length);
  });

  test("Ein Spielstand ohne Wirtschaftsakte legt sie beim Laden neu an und läuft weiter", () => {
    const w = welt();
    bis(w, 60);
    delete w.spiel!.wirtschaft;
    const l = load(save(w));
    expect(l.spiel!.wirtschaft).toBeUndefined();
    expect(verlauf(l, "defizit").length).toBeGreaterThanOrEqual(12);
    advance(l, 120);
    expect(l.spiel!.wirtschaft).toBeDefined();
    expect(Number.isFinite(defizitJetzt(l))).toBe(true);
  });

  test("Marken auf der Zeitachse: Eingriffe und Zinsentscheide erscheinen", () => {
    const w = welt();
    setFiscalImpulse(w, 1);
    bis(w, 60);
    const m = alleMarken(w);
    expect(m.some((x) => x.art === "haushalt")).toBe(true);
    expect(m.some((x) => x.art === "zins")).toBe(true);
  });
});

describe("Zinssitzungen", () => {
  test("Ohne Einfluss folgt die Bank ihrer Regel", () => {
    const w = welt();
    bis(w, 400);
    const z = zbZustand(w);
    expect(z.sitzungen.length).toBeGreaterThanOrEqual(8);
    for (const s of z.sitzungen) {
      expect(s.abweichung).toBe(0);
      expect(s.neu).toBe(s.regel);
      expect(s.begruendung.length).toBeGreaterThan(10);
    }
  });

  test("Eine gefügige Führung folgt dem Druck, eine strenge Führung kaum", () => {
    const g = welt(3, "gefuegig");
    const v = welt(3, "vorsichtig");
    const dg = druckWirkung(g, -1, "rede");
    const dv = druckWirkung(v, -1, "rede");
    expect(dg.abweichung).toBeLessThanOrEqual(-2);
    expect(Math.abs(dv.abweichung)).toBeLessThanOrEqual(1);
    // Vertraulich wirkt schwächer als öffentlich
    expect(Math.abs(druckWirkung(g, -1, "gespraech").abweichung)).toBeLessThan(Math.abs(dg.abweichung));
  });

  test("Druck wird auf der nächsten Sitzung verbraucht, weicht ab und kostet Glaubwürdigkeit und Märkte", () => {
    const w = welt(3, "gefuegig");
    const cred0 = w.economy.credibility;
    const r = machDruck(w, -1, "gespraech");
    expect(r.ok, r.text).toBe(true);
    expect(w.spiel!.kapital).toBeLessThan(60);
    const s = naechsteSitzung(w)!;
    expect(s.tage).toBeGreaterThan(0);
    const risiko0 = w.economy.riskPremium;
    bis(w, s.tag);
    const z = zbZustand(w);
    const letzte = z.sitzungen[z.sitzungen.length - 1]!;
    expect(letzte.tag).toBe(s.tag);
    expect(letzte.druck?.weg).toBe("gespraech");
    expect(letzte.abweichung).toBeLessThan(0);
    expect(letzte.neu).toBeLessThan(letzte.regel);
    expect(z.druck).toBeNull();
    expect(w.economy.credibility).toBeLessThan(cred0);
    expect(w.economy.riskPremium).toBeGreaterThan(risiko0 - 1);
    expect(letzte.folgen.length).toBeGreaterThan(2);
  });

  test("Öffentliche Kritik setzt die nächste Sitzung unter Druck und wirkt wiederholt stärker", () => {
    const w = welt(3, "gefuegig");
    const r = machDruck(w, -1, "rede");
    expect(r.ok).toBe(true);
    expect(zbZustand(w).druck?.weg).toBe("rede");
    const cred1 = w.economy.credibility;
    machDruck(w, -1, "rede");
    const cred2 = w.economy.credibility;
    const erster = 0.45 - cred1;
    const zweiter = cred1 - cred2;
    expect(zweiter).toBeGreaterThan(erster);
  });

  test("Weisungsgebunden legt der Präsident den Zins fest; das kostet die Glaubwürdigkeit", () => {
    const w = welt();
    const c0 = w.economy.credibility;
    const a = aendereStufe(w, "C");
    expect(a.ok, a.text).toBe(true);
    expect(w.economy.credibility).toBeLessThan(c0 - 0.1);
    expect(machDruck(w, -1, "rede").ok).toBe(false);
    const v = setzeVorgabe(w, 12);
    expect(v.ok).toBe(true);
    bis(w, naechsteSitzung(w)!.tag);
    const s = zbZustand(w).sitzungen.at(-1)!;
    expect(s.neu).toBe(12);
    expect(s.stufe).toBe("C");
    expect(s.abweichung).not.toBe(0);
    expect(zbZustand(w).vorgabe).toBeNull();
  });

  test("Die Unabhängigkeit ändert sich stufenweise, kostet Kapital und braucht die Mehrheit; geschützt lässt sich die Führung nicht entlassen", () => {
    const w = welt();
    expect(aendereStufe(w, "A").ok).toBe(true);
    expect(zbZustand(w).stufe).toBe("A");
    expect(ernenneGouverneur(w, "gefuegig").ok).toBe(false);
    // Abkühlzeit
    expect(aendereStufe(w, "B").ok).toBe(false);
    // ohne Mehrheit
    const v = welt();
    v.parliament!.seats[v.player!.partei.kurz] = 50;
    v.spiel!.lager = [];
    const r = aendereStufe(v, "C");
    expect(r.ok).toBe(false);
    expect(r.text).toMatch(/Mehrheit/);
  });

  test("Die Führung neu besetzen ändert die Haltung; eine strenge Führung beruhigt die Märkte teilweise", () => {
    const w = welt(3, "gefuegig");
    const c0 = w.economy.credibility;
    const r = ernenneGouverneur(w, "vorsichtig");
    expect(r.ok, r.text).toBe(true);
    expect(w.governor.stance).toBe("vorsichtig");
    expect(w.economy.credibility).toBeGreaterThanOrEqual(c0 - 0.001);
    expect(ernenneGouverneur(w, "gefuegig").ok).toBe(false); // Abkühlzeit
  });

  test("Die Optionen vor der Sitzung nennen den Beschluss der Bank und die Kosten", () => {
    const w = welt(3, "gefuegig");
    const o = druckOptionen(w);
    expect(o.map((x) => x.id)).toEqual(["keiner", "gespraech_senken", "rede_senken", "gespraech_straffen", "rede_straffen"]);
    expect(o[0]!.abweichung).toBe(0);
    expect(o[2]!.abweichung).toBeLessThan(o[1]!.abweichung);
    for (const x of o) expect(x.kosten.length).toBeGreaterThan(0);
  });
});

describe("Haushalt", () => {
  test("Ein Posten ändert den Impuls, kostet Kapital und wirkt dauerhaft auf die Politikfelder", () => {
    const a = welt();
    const b = structuredClone(a);
    const imp0 = a.economy.fiscalImpulse;
    const k0 = a.spiel!.kapital;
    const r = setzePosten(a, "investitionen", 2);
    expect(r.ok, r.text).toBe(true);
    expect(stufeVon(a, "investitionen")).toBe(2);
    expect(a.economy.fiscalImpulse).toBeCloseTo(imp0 + 0.8, 6);
    expect(a.spiel!.kapital).toBe(k0 - 2);
    expect(impulsAusPosten(a)).toBeCloseTo(0.8, 6);
    bis(a, 200);
    bis(b, 200);
    const bau = (x: World) => nationalAverage(NET, x.net, "bauwirtschaft");
    expect(bau(a)).toBeGreaterThan(bau(b) + 0.5);
    // Nachfrage und Defizit folgen
    expect(defizitJetzt(a)).toBeGreaterThan(defizitJetzt(b));
  });

  test("Steuern anheben senkt Impuls und Defizit, trifft Gruppen und kostet doppelt", () => {
    const w = welt();
    const k0 = w.spiel!.kapital;
    const arbeitnehmer0 = nationalAverage(NET, w.net, "arbeitnehmer");
    const defizit0 = defizitJetzt(w);
    const r = setzePosten(w, "einkommensteuer", 1);
    expect(r.ok, r.text).toBe(true);
    expect(w.spiel!.kapital).toBe(k0 - 2);
    expect(defizitJetzt(w)).toBeCloseTo(defizit0 - 0.3, 6);
    expect(nationalAverage(NET, w.net, "arbeitnehmer")).toBeLessThan(arbeitnehmer0);
  });

  test("Die Vorschau nennt Kapital, Defizit vorher und nachher; ohne Kapital geht es nicht", () => {
    const w = welt();
    const v = postenVorschau(w, "soziales", 2);
    expect(v.ok).toBe(true);
    expect(v.delta).toBe(2);
    expect(v.defizitNachher).toBeCloseTo(v.defizitVorher - v.impuls, 6);
    expect(v.zeilen.length).toBeGreaterThan(2);
    w.spiel!.kapital = -19;
    const teuer = postenVorschau(w, "soziales", -2);
    expect(teuer.ok).toBe(false);
    expect(setzePosten(w, "soziales", -2).ok).toBe(false);
    expect(stufeVon(w, "soziales")).toBe(0);
  });

  test("Kürzen in die unbeliebte Richtung kostet doppelt; Stufen bleiben zwischen −2 und +2", () => {
    const w = welt();
    const k0 = w.spiel!.kapital;
    expect(setzePosten(w, "personal", -1).ok).toBe(true);
    expect(w.spiel!.kapital).toBe(k0 - 2);
    expect(setzePosten(w, "personal", 9).ok).toBe(true);
    expect(stufeVon(w, "personal")).toBe(2);
  });

  test("Pakete des Haushaltsjahres setzen mehrere Regler ohne Kapitalkosten", () => {
    const w = welt();
    const k0 = w.spiel!.kapital;
    wendePaketAn(w, "konsolidieren");
    expect(w.spiel!.kapital).toBe(k0);
    for (const [id, delta] of Object.entries(PAKETE.konsolidieren!.schritte)) expect(stufeVon(w, id)).toBe(delta);
    expect(impulsAusPosten(w)).toBeLessThan(-0.9);
  });

  test("Jeder Posten nennt Gewinner, Verlierer, Kehrseite und wirkt auf bekannte Größen", () => {
    for (const p of POSTEN) {
      expect(p.gewinner.length).toBeGreaterThan(3);
      expect(p.verlierer.length).toBeGreaterThan(3);
      expect(p.kehrseite.length).toBeGreaterThan(20);
      expect(p.dauer.length + p.sofort.length).toBeGreaterThan(1);
      for (const x of [...p.sofort, ...p.dauer]) expect(NET.index.has(x.id), `${p.id}: ${x.id}`).toBe(true);
    }
  });

  test("Zinsdienst: Steigende Marktzinsen verteuern die Staatsschuld langsam, sinkende entlasten", () => {
    const hoch = welt();
    const tief = welt();
    hoch.economy.policyRate = 60;
    tief.economy.policyRate = 10;
    const z0 = wirtschaftZustand(hoch).haushalt.zinssatz;
    haushaltMonat(hoch);
    // langsam: nach einem Monat erst ein kleiner Schritt
    expect(wirtschaftZustand(hoch).haushalt.zinssatz - z0).toBeLessThan(0.7);
    for (let i = 0; i < 36; i++) {
      haushaltMonat(hoch);
      haushaltMonat(tief);
    }
    const zh = wirtschaftZustand(hoch).haushalt.zinssatz;
    const zt = wirtschaftZustand(tief).haushalt.zinssatz;
    expect(zh).toBeGreaterThan(ZINSSATZ_START + 2);
    expect(zt).toBeLessThan(ZINSSATZ_START - 2);
    expect(hoch.economy.zinsMehrlast ?? 0).toBeGreaterThan(0);
    expect(tief.economy.zinsMehrlast ?? 0).toBeLessThan(0);
    expect(defizitJetzt(hoch)).toBeGreaterThan(defizitJetzt(tief));
    // Beim Start ist der Zinsdienst genau die Größenordnung aus dem Haushaltsgesetz: 3,5 % des BIP
    expect(zinsausgabenJetzt(welt())).toBeCloseTo(3.5, 1);
  });
});

describe("Folgeketten und Prognose", () => {
  test("Die Kette einer Zinserhöhung nennt Währung, Auslastung, Inflation, Beschäftigung und Zinsdienst mit Verzögerung", () => {
    const hoch = zinsKette(2);
    const texte = hoch.map((g) => g.text).join(" | ");
    expect(texte).toMatch(/Lira wird stärker/);
    expect(texte).toMatch(/Inflation sinkt/);
    expect(texte).toMatch(/Zinsdienst/);
    expect(hoch.some((g) => g.nach >= 6)).toBe(true);
    const tief = zinsKette(-2);
    expect(tief.map((g) => g.text).join(" ")).toMatch(/Inflation steigt/);
    expect(zinsKette(0)).toEqual([]);
  });

  test("Aus dem Politiknetz: Ein höherer Leitzins verteuert Kredite und Wohnungsbau, jede Stufe mit Verzögerung", () => {
    const k = netzKette("leitzins", 1);
    const namen = k.map((g) => g.text);
    expect(namen).toContain("Kreditvergabe");
    const kredit = k.find((g) => g.text === "Kreditvergabe")!;
    expect(kredit.richtung).toBe(-1);
    expect(kredit.ebene).toBe(1);
    expect(kredit.nach).toBeGreaterThan(0);
    expect(k.some((g) => g.ebene >= 2)).toBe(true);
  });

  test("Ein Ausgabenimpuls stützt Nachfrage und Wachstum und vergrößert das Defizit", () => {
    const k = impulsKette(1);
    expect(k.map((g) => g.text).join(" ")).toMatch(/Nachfrage steigt/);
    expect(k.find((g) => /Defizit wächst/.test(g.text))?.gut).toBe(false);
  });

  test("Das Prognoseband je Monat: mit mehr Investitionen wächst das Defizit", () => {
    const w = welt();
    const r = prognoseReihen(w, { art: "posten", id: "investitionen", stufe: 2 }, ["defizit", "growth"], 6, 4);
    expect(r).toHaveLength(2);
    const d = r[0]!;
    expect(d.ohne).toHaveLength(6);
    expect(d.mit).toHaveLength(6);
    expect(d.mit[5]!.mid).toBeGreaterThan(d.ohne[5]!.mid);
    for (const b of [...d.ohne, ...d.mit]) expect(b.low <= b.mid && b.mid <= b.high).toBe(true);
    expect(prognoseReihen(w, null, ["defizit"], 3, 2)[0]!.mit).toEqual([]);
  });

  test("Kennzahl-Suche und Namen", () => {
    expect(kennzahl("inflation")?.name).toBe("Inflation");
    expect(kennzahl("gibtsnicht")).toBeUndefined();
  });
});

describe("Schutz der Bank gilt auf allen Wegen", () => {
  test("Auch der direkte Befehl entlässt die Führung nicht, solange die Bank gesetzlich geschützt ist", async () => {
    const { replaceGovernor } = await import("../src/sim/world");
    const w = welt(3, "vorsichtig");
    expect(aendereStufe(w, "A").ok).toBe(true);
    const c0 = w.economy.credibility;
    replaceGovernor(w, "gefuegig", "eine neue, regierungsnahe Führung");
    expect(w.governor.stance).toBe("vorsichtig");
    expect(w.economy.credibility).toBe(c0);
    expect(w.log.at(-1)!.text).toMatch(/gesetzlich geschützt/);
  });
});
