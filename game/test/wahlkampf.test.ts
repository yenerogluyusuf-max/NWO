// Der Wahlkampf als Handlungsphase (INN-5): Phasenbeginn acht Wochen vor der Wahl, Wochenbudget,
// Reisen mit Ortsbezug und abnehmendem Ertrag, Auslandstour auf den Diaspora-Block, Versprechen als
// Zusagen mit Bruch-Preis, TV-Duell mit Vorbereitung, Gegner-Angriffe bei echten Schwachstellen,
// nur die nationale Wahl, Migration und Determinismus.

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { PROVINCES, nationalAverage } from "../src/sim/netz";
import { wirke } from "../src/sim/wirkung";
import { Rng } from "../src/sim/rng";
import { brecheZusage, zusagenBilanz } from "../src/sim/zusagen";
import { DIASPORA_PROFIL } from "../src/data/diaspora";
import type { World } from "../src/sim/types";
import {
  VERSPRECHEN,
  WAHLKAMPF,
  auslandstour,
  diasporaBlock,
  duellVorbereiten,
  gegnerProfil,
  migriereWahlkampf,
  reise,
  reiseKosten,
  schwachstelle,
  verspreche,
  wahlEffekte,
  wahlkampfAktiv,
  wahlkampfSicht,
} from "../src/sim/wahlkampf";

/** Ruhiger Zufall: nie ein Risiko, keine Streuung, Mittelwerte. */
const ruhig = { next: () => 0.99, normal: () => 0, between: (a: number, b: number) => (a + b) / 2, state: 0 } as unknown as Rng;
/** Unglücklicher Zufall: jedes Risiko tritt ein, keine Streuung. */
const pech = { next: () => 0.001, normal: () => 0, between: (a: number, b: number) => (a + b) / 2, state: 0 } as unknown as Rng;

function neu(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.hinweise = [];
  return w;
}

/** Versetzt die Partie ans Fenster des Wahlkampfs und startet die Phase. */
function inDenWahlkampf(w: World, tageBisWahl = WAHLKAMPF.beginnTage): World {
  w.spiel!.wahltag = w.day + tageBisWahl;
  advance(w, 1);
  expect(wahlkampfAktiv(w)).toBe(true);
  return w;
}

describe("Phase und Wochenbudget", () => {
  test("die Phase beginnt acht Wochen vor der Wahl — nicht früher", () => {
    const w = neu();
    advance(w, 30);
    expect(w.spiel!.wahlkampf).toBeUndefined();
    w.spiel!.wahltag = w.day + WAHLKAMPF.beginnTage + 10;
    advance(w, 9);
    expect(w.spiel!.wahlkampf).toBeUndefined();
    advance(w, 2);
    const k = w.spiel!.wahlkampf!;
    expect(k).toBeDefined();
    expect(k.ap).toBe(WAHLKAMPF.apProWoche);
    expect(k.amtszeit).toBe(w.spiel!.amtszeit);
    // Der Phasenbeginn wird als Wendepunkt angekündigt (Auto-Stopp B, ui/autostopp.ts)
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("wahlkampf-beginn-"))).toBe(true);
  });

  test("Aktionspunkte: Verbrauch je nach Entfernung, Deckel, wöchentlicher Reset", () => {
    const w = inDenWahlkampf(neu());
    const k = () => w.spiel!.wahlkampf!;
    // Ankara (6) liegt in Zentralanatolien: nah = 1 AP; Adana (1) am Mittelmeer: fern = 2 AP
    expect(reiseKosten(6)).toBe(WAHLKAMPF.reiseApNah);
    expect(reiseKosten(1)).toBe(WAHLKAMPF.reiseApFern);
    expect(reise(w, 6, ruhig).ok).toBe(true);
    expect(k().ap).toBe(WAHLKAMPF.apProWoche - WAHLKAMPF.reiseApNah);
    expect(reise(w, 1, ruhig).ok).toBe(true);
    expect(k().ap).toBe(WAHLKAMPF.apProWoche - WAHLKAMPF.reiseApNah - WAHLKAMPF.reiseApFern);
    // Ohne Budget geht nichts
    k().ap = 0;
    const vorher = k().reisen.length;
    expect(reise(w, 6, ruhig).ok).toBe(false);
    expect(k().reisen.length).toBe(vorher);
    // Wochenwechsel: neues Budget (und die Wochenroutine: Angriff und Ticker)
    const woche = k().woche;
    advance(w, WAHLKAMPF.wocheTage);
    expect(k().woche).toBeGreaterThan(woche);
    expect(k().ap).toBe(WAHLKAMPF.apProWoche);
    expect(k().ticker.length).toBeGreaterThan(0);
  });

  test("Aufmerksamkeit lädt sich während der Phase anderthalbmal so schnell auf", () => {
    const w = inDenWahlkampf(neu());
    const v = w.spiel!.verfassung!;
    v.aufmerksamkeit = 50;
    const vorher = v.aufmerksamkeit;
    advance(w, 1);
    // Regeneration 3 × 1,5 = 4,5 je Tag (kein Verbrauch in diesem ruhigen Tag)
    expect(v.aufmerksamkeit - vorher).toBeCloseTo(4.5, 1);
  });
});

describe("Reisen: Ortsbezug und abnehmender Ertrag", () => {
  test("ein Besuch hebt das Vertrauen lokal, nicht im ganzen Land gleichermaßen", () => {
    const w = inDenWahlkampf(neu());
    const i = NET.index.get("vertrauen_regierung")!;
    const vorOrt = w.net.values[i * PROVINCES + 5]!;
    const vorLand = nationalAverage(NET, w.net, "vertrauen_regierung");
    const r = reise(w, 6, ruhig); // Ankara
    expect(r.ok).toBe(true);
    const nachOrt = w.net.values[i * PROVINCES + 5]!;
    const nachLand = nationalAverage(NET, w.net, "vertrauen_regierung");
    expect(nachOrt - vorOrt).toBeGreaterThan(1);
    // Landesdurchschnitt bewegt sich nur um den Bevölkerungsanteil — deutlich weniger als vor Ort
    expect(nachLand - vorLand).toBeLessThan(nachOrt - vorOrt);
  });

  test("wiederholte Besuche nutzen sich ab", () => {
    const w = inDenWahlkampf(neu());
    expect(reise(w, 6, ruhig).ok).toBe(true);
    expect(reise(w, 6, ruhig).ok).toBe(true);
    expect(reise(w, 6, ruhig).ok).toBe(true);
    const [e1, e2, e3] = w.spiel!.wahlkampf!.reisen.map((r) => r.effekt);
    expect(e1).toBeGreaterThan(e2!);
    expect(e2).toBeGreaterThan(e3!);
    expect(e2).toBeCloseTo(e1! * WAHLKAMPF.reiseAbnutzung, 1);
  });

  test("brennende Probleme vor Ort: Chance und Risiko; der Archätyp verstärkt", () => {
    const w = inDenWahlkampf(neu());
    // Armut in der ganzen Türkei über die Schwelle heben (Start 40, Schwelle 60)
    wirke(w, "p_armut", 100);
    const sw = schwachstelle(w);
    expect(sw).not.toBeNull();
    expect(sw!.last).toBeGreaterThan(0);
    // Mit ruhigem Zufall: verstärkte Wirkung, kein Missgeschick
    expect(reise(w, 6, ruhig).ok).toBe(true);
    const gut = w.spiel!.wahlkampf!.reisen[0]!;
    expect(gut.missglueckt).toBe(false);
    expect(gut.effekt).toBeGreaterThan(WAHLKAMPF.reiseVertrauen);
    // Mit Pech: der Besuch geht nach hinten los
    const w2 = inDenWahlkampf(neu());
    wirke(w2, "p_armut", 100);
    expect(reise(w2, 6, pech).ok).toBe(true);
    const schlecht = w2.spiel!.wahlkampf!.reisen[0]!;
    expect(schlecht.missglueckt).toBe(true);
    expect(schlecht.effekt).toBeLessThan(0);
  });
});

describe("Auslandstour: der Diaspora-Block", () => {
  test("eine Tour mobilisiert Beteiligung und Lager-Anteil des Blocks", () => {
    const w = inDenWahlkampf(neu());
    const z = w.spiel!.umfrage.zustimmung;
    const vorher = diasporaBlock(w, z);
    expect(auslandstour(w, "deutschland", ruhig).ok).toBe(true);
    const k = w.spiel!.wahlkampf!;
    expect(k.ap).toBe(WAHLKAMPF.apProWoche - WAHLKAMPF.tourAp);
    expect(k.touren).toHaveLength(1);
    const nachher = diasporaBlock(w, z);
    expect(nachher.beteiligung).toBeGreaterThan(vorher.beteiligung);
    expect(nachher.lagerAnteil).toBeGreaterThan(vorher.lagerAnteil);
    expect(nachher.beitrag).toBeGreaterThan(vorher.beitrag);
    // Der Block wirkt nur bei nationalen Wahlen — die Präsidentschaftswahl ist eine
    expect(DIASPORA_PROFIL.nurNationaleWahlen).toBe(true);
    // Heimischer Fernseheffekt ist im Zustand verbucht (Vertrauen ist gestiegen)
    expect(nationalAverage(NET, w.net, "vertrauen_regierung")).toBeGreaterThan(nationalAverage(NET, neu().net, "vertrauen_regierung") - 0.01);
  });

  test("das Gastland kann ein Auftrittsverbot aussprechen (2017-Muster)", () => {
    const w = inDenWahlkampf(neu());
    expect(auslandstour(w, "belgien", pech).ok).toBe(true);
    const tour = w.spiel!.wahlkampf!.touren[0]!;
    expect(tour.verbot).toBe(true);
    // Belagerungs-Narrativ: die Beteiligung steigt trotzdem — und die Beziehung zur EU leidet
    expect(tour.beteiligungPlus).toBeGreaterThan(0);
    expect(w.log.some((l) => l.text.includes("Auslandstour"))).toBe(true);
  });
});

describe("Versprechen: Beifall jetzt, Zusage mit Frist, Bruch-Preis später", () => {
  test("ein Versprechen bringt Beifall der Zielgruppen und wird zur Zusage zwölf Monate nach der Wahl", () => {
    const w = inDenWahlkampf(neu());
    const k = () => w.spiel!.wahlkampf!;
    const launeVorher = nationalAverage(NET, w.net, "arbeitnehmer");
    expect(verspreche(w, "v_mindestlohn").ok).toBe(true);
    expect(k().versprechen).toContain("v_mindestlohn");
    expect(k().ap).toBe(WAHLKAMPF.apProWoche - WAHLKAMPF.versprechenAp);
    expect(nationalAverage(NET, w.net, "arbeitnehmer")).toBeGreaterThan(launeVorher);
    // Doppelt geht nicht
    expect(verspreche(w, "v_mindestlohn").ok).toBe(false);
    // Die Zusage steht im Zusagen-System: Wähler, Maßnahme, Frist = Wahltag + 12 Monate
    const z = w.spiel!.zusagen.find((x) => x.id === "z-wahl-v_mindestlohn")!;
    expect(z).toBeDefined();
    expect(z.von).toBe("Wähler");
    expect(z.massnahme).toBe("m_mindestlohn");
    expect(z.richtung).toBe(1);
    expect(z.faellig).toBe(w.spiel!.wahltag + Math.round(WAHLKAMPF.versprechenFristMonate * 30.4));
    expect(z.erfuellt).toBe(false);
    expect(z.gebrochen).toBe(false);
  });

  test("der Bruch der Versprechens-Zusage kostet Glaubwürdigkeit (Kipppunkte des Zusagen-Systems)", () => {
    const w = inDenWahlkampf(neu());
    verspreche(w, "v_renten");
    const vorher = zusagenBilanz(w);
    const z = w.spiel!.zusagen.find((x) => x.id === "z-wahl-v_renten")!;
    brecheZusage(w, z);
    const nachher = zusagenBilanz(w);
    expect(z.gebrochen).toBe(true);
    expect(nachher.gebrochen).toBe(vorher.gebrochen + 1);
    expect(nachher.glaubwuerdigkeit).toBe(vorher.glaubwuerdigkeit - 15);
  });

  test("angeschlagene Glaubwürdigkeit dämpft den Beifall; jedes weitere Versprechen nutzt sich ab", () => {
    const w = inDenWahlkampf(neu());
    // Glaubwürdigkeit ruinieren: zwei vorhandene Zusagen brechen
    for (const z of w.spiel!.zusagen.filter((x) => !x.erfuellt && !x.gebrochen).slice(0, 2)) brecheZusage(w, z);
    const s1 = wahlkampfSicht(w);
    expect(s1.glaubwuerdigkeit).toBeLessThan(60);
    const laune = () => nationalAverage(NET, w.net, "rentner");
    const l0 = laune();
    verspreche(w, "v_renten");
    const beifallAngeschlagen = laune() - l0;
    // Referenz mit intakter Glaubwürdigkeit
    const w2 = inDenWahlkampf(neu());
    const l2 = () => nationalAverage(NET, w2.net, "rentner");
    const l20 = l2();
    verspreche(w2, "v_renten");
    const beifallIntakt = l2() - l20;
    expect(beifallAngeschlagen).toBeLessThan(beifallIntakt);
    // Abnutzung: das zweite Versprechen bringt der jeweiligen Zielgruppe weniger
    const w3 = inDenWahlkampf(neu());
    const a = () => nationalAverage(NET, w3.net, "arbeitnehmer");
    const a0 = a();
    verspreche(w3, "v_mindestlohn");
    const erstes = a() - a0;
    const m = () => nationalAverage(NET, w3.net, "arme");
    const m0 = m();
    verspreche(w3, "v_mwst"); // arme ist Zielgruppe
    const zweites = m() - m0;
    expect(zweites).toBeLessThan(erstes * 1.35); // Abnutzungsfaktor 1/(1+0,25) schlägt den Zwei-Gruppen-Bonus
  });

  test("der Katalog hat zwölf Versprechen, jedes mit echter Maßnahme im Politiknetz", () => {
    expect(VERSPRECHEN).toHaveLength(12);
    for (const v of VERSPRECHEN) {
      expect(NET.index.get(v.massnahme), v.id).toBeDefined();
      expect(v.zielgruppen.length).toBeGreaterThan(0);
      expect(v.titel.length).toBeGreaterThan(5);
    }
  });
});

describe("TV-Duell", () => {
  test("Vorbereitung kostet 2 AP und entscheidet den Ausgang mit", () => {
    const w = inDenWahlkampf(neu(), 20);
    expect(duellVorbereiten(w).ok).toBe(true);
    expect(w.spiel!.wahlkampf!.ap).toBe(WAHLKAMPF.apProWoche - WAHLKAMPF.duellAp);
    expect(duellVorbereiten(w).ok).toBe(false); // nur einmal
    // Zum Duelltag vorspulen
    w.spiel!.wahltag = w.day + WAHLKAMPF.duellTageVorher;
    advance(w, 1);
    const d = w.spiel!.wahlkampf!.duell;
    expect(d.tag).toBeDefined();
    expect(d.effekt).toBeDefined();
    expect(d.szene!.length).toBeGreaterThan(20);
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("wahlkampf-duell-"))).toBe(true);
  });

  test("vorbereitet schlägt unvorbereitet — gleiche Lage, gleicher Zufall, anderer Ausgang", () => {
    const ausgang = (vorbereitet: boolean): number => {
      const w = inDenWahlkampf(neu(6), 20);
      w.spiel!.umfrage.zustimmung = 48;
      if (vorbereitet) duellVorbereiten(w);
      w.spiel!.wahltag = w.day + WAHLKAMPF.duellTageVorher;
      // Beide Partien verbrauchen bis zum Duell denselben Zufallsstrom
      advance(w, 1);
      return w.spiel!.wahlkampf!.duell.effekt!;
    };
    const mit = ausgang(true);
    const ohne = ausgang(false);
    expect(mit).toBeGreaterThan(ohne);
    // Die Differenz entspricht Bonus + Malus, übertragen mit dem Duell-Faktor
    expect(mit - ohne).toBeCloseTo((WAHLKAMPF.duellVorbereitetBonus + WAHLKAMPF.duellUnvorbereitetMalus) * WAHLKAMPF.duellUebertrag, 0);
  });
});

describe("Die Gegenseite", () => {
  test("Angriffe treffen stärker, wenn echte Probleme rot stehen", () => {
    // Kontrollierte Ausgangslage: in beiden Partien steht nichts rot (alle Probleme weit unter die Schwelle)
    const beruhige = (w: World) => {
      for (const node of NET.nodes) if (node.kind === "problem" && node.threshold) wirke(w, node.id, -100);
    };
    const w = inDenWahlkampf(neu());
    beruhige(w);
    expect(schwachstelle(w)).toBeNull();
    advance(w, WAHLKAMPF.wocheTage);
    const ohne = w.spiel!.wahlkampf!.angriffe;
    // Zweite Partie mit flächendeckend roter Armut: derselbe Zeitablauf, dieselbe Woche
    const w2 = inDenWahlkampf(neu());
    beruhige(w2);
    wirke(w2, "p_armut", 100);
    expect(schwachstelle(w2)!.id).toBe("p_armut");
    advance(w2, WAHLKAMPF.wocheTage);
    const mit = w2.spiel!.wahlkampf!.angriffe;
    expect(mit).toBeLessThan(ohne); // negativ gebucht: stärkerer Angriff = kleinerer Wert
    expect(w2.spiel!.wahlkampf!.angriffeLog.some((a) => a.thema === "Armut")).toBe(true);
    // Gedeckelt: nie schlimmer als der Gesamtdeckel
    expect(mit).toBeGreaterThanOrEqual(-WAHLKAMPF.angriffDeckelGesamt);
  });

  test("der Spieler sieht die Stärke des Gegners nur durch das Bias seiner Umfragen", () => {
    const w = inDenWahlkampf(neu());
    const g = gegnerProfil(w);
    expect(g.name.length).toBeGreaterThan(3);
    expect(g.partei.length).toBeGreaterThan(0);
    // Nach der ersten Ticker-Messung: Die sichtbare Stärke spiegelt die letzte Messung (100 − Messwert), nicht die Wahrheit
    const letzte = w.spiel!.wahlkampf!.ticker[w.spiel!.wahlkampf!.ticker.length - 1]!;
    expect(g.staerkeSicht).toBeCloseTo(100 - letzte.wert, 1);
    expect(g.institut).toBe(letzte.institut);
    const wahr = 100 - w.spiel!.umfrage.zustimmung;
    // Sicht und Wahrheit weichen um den Messfehler auseinander (Haus-Bias + Rauschen)
    expect(Math.abs((g.staerkeSicht ?? 0) - wahr)).toBeLessThan(15);
  });
});

describe("Wahltag und Phasenende", () => {
  test("die Kampagnen-Effekte fließen in die Wahlrechnung; danach schließt die Phase, die Zusagen bleiben", () => {
    const w = inDenWahlkampf(neu(), 20);
    w.spiel!.umfrage.zustimmung = 62; // sichere Wiederwahl
    verspreche(w, "v_renten");
    w.spiel!.wahltag = w.day + WAHLKAMPF.duellTageVorher;
    advance(w, 1); // Duell
    const effekte = wahlEffekte(w);
    expect(effekte.teile.length).toBeGreaterThan(0);
    expect(effekte.teile.some((t) => t.name === "TV-Duell")).toBe(true);
    const zusagenVorher = w.spiel!.zusagen.length;
    advance(w, WAHLKAMPF.duellTageVorher + 2); // über den Wahltag hinaus
    expect(w.spiel!.ende).toBeUndefined(); // wiedergewählt, Amtszeit 2
    expect(w.spiel!.amtszeit).toBe(2);
    // Die Phase ist geschlossen, der Zustand aufgeräumt
    expect(w.spiel!.wahlkampf).toBeUndefined();
    // Die Versprechen leben als Zusagen weiter (Frist zwölf Monate nach der Wahl)
    expect(w.spiel!.zusagen.length).toBe(zusagenVorher);
    const z = w.spiel!.zusagen.find((x) => x.id === "z-wahl-v_renten")!;
    expect(z.gebrochen).toBe(false);
    expect(z.faellig).toBeGreaterThan(w.day);
    // Der Wahlabend steht im Protokoll — mit der Bilanz des Schlussspurts
    expect(w.log.some((l) => l.text.includes("Wahlabend"))).toBe(true);
  });

  test("die Kommunalwahl bleibt unberührt: kein Wahlkampf ohne den nationalen Wahltag", () => {
    const w = neu();
    // Weit vor der Präsidentschaftswahl: Auch Monate später gibt es keinen Wahlkampf-Zustand
    advance(w, 90);
    expect(w.spiel!.wahlkampf).toBeUndefined();
    expect(wahlkampfAktiv(w)).toBe(false);
  });
});

describe("Migration und Determinismus", () => {
  test("alte Spielstände ohne Wahlkampf-Feld laden unverändert; beschädigte Felder werden repariert", () => {
    const w = inDenWahlkampf(neu());
    reise(w, 6, ruhig);
    const json = save(w);
    // Feld ganz entfernen (alter Stand): Phase beginnt beim nächsten Tick im Fenster erneut
    const roh = JSON.parse(json) as World;
    delete roh.spiel!.wahlkampf;
    const alt = load(JSON.stringify(roh));
    expect(alt.spiel!.wahlkampf).toBeUndefined();
    expect(alt.spiel!.wahltag - alt.day).toBeLessThanOrEqual(WAHLKAMPF.beginnTage);
    advance(alt, 1);
    expect(alt.spiel!.wahlkampf).toBeDefined();
    // Beschädigte Werte (NaN wird zu null, Arrays fehlen)
    const roh2 = JSON.parse(json) as World;
    const k = roh2.spiel!.wahlkampf!;
    k.ap = Number.NaN;
    k.angriffe = -999;
    (k as unknown as Record<string, unknown>).besuche = [];
    (k as unknown as Record<string, unknown>).ticker = null;
    // Das Laden selbst ruft die Migration (world.ts); ein zweiter Aufruf bleibt ohne Wirkung
    const geladen = load(JSON.stringify(roh2));
    migriereWahlkampf(geladen);
    const k2 = geladen.spiel!.wahlkampf!;
    expect(k2.ap).toBe(WAHLKAMPF.apProWoche);
    expect(k2.angriffe).toBe(-WAHLKAMPF.angriffDeckelGesamt);
    expect(k2.besuche).toEqual({});
    expect(k2.ticker).toEqual([]);
  });

  test("gleiche Partie, gleiche Handlungen: exakt gleicher Verlauf", () => {
    const partie = (): string => {
      const w = inDenWahlkampf(neu(11), 40);
      reise(w, 6, new Rng(w.rngState ^ w.day));
      w.rngState = (w.rngState + 1) | 0;
      auslandstour(w, "deutschland", new Rng(w.rngState ^ w.day));
      w.rngState = (w.rngState + 1) | 0;
      verspreche(w, "v_mindestlohn");
      duellVorbereiten(w);
      advance(w, 30);
      const k = w.spiel!.wahlkampf!;
      return JSON.stringify({ k, z: w.spiel!.umfrage.zustimmung, rng: w.rngState, tag: w.day });
    };
    expect(partie()).toBe(partie());
  });
});
