// Wissensbaum: Knoten sind Vorhaben des Reiches; Bildung öffnet, Forschungsetat treibt, Abwanderung bremst; Lizenz und Träger
// haben Preis und Gegenspieler; fertige Werke stellen Güter her und heben die heimische Rüstung. Dazu alte Spielstände und Texte.

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { VORHABEN } from "../src/data/reich";
import { BAUM, LIZENZ, WERKE, ZWEIGE, ZWEIG_VON } from "../src/data/wissensbaum";
import { baumSicht, beginneKnoten, kaufeLizenz, knotenSicht, militaerGueterFaktor, naechsterKnoten, setzeSchwerpunkt, wissensbaumMonat } from "../src/sim/wissensbaum";
import { baumZustand, forschungsTempo, kostenFaktor, landesTempo, partnerGesperrt, werkZusatz } from "../src/sim/wissensbaum-kern";
import { reichMonat, reichZustand } from "../src/sim/reich";
import { haushaltZustand } from "../src/sim/wirtschaft";
import { gueterSicht } from "../src/sim/gueter";
import { streitkraefte } from "../src/sim/streitkraefte";
import { beziehungAendern, beziehungZurTuerkei } from "../src/sim/welt-modell";
import { NET } from "../src/sim/modell";
import { PROVINCES } from "../src/sim/netz";
import { t } from "../src/i18n";
import type { World } from "../src/sim/types";

function neu(seed = 11): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 200;
  return w;
}
function setze(w: World, id: string, wert: number): void {
  const i = NET.index.get(id)!;
  for (let p = 0; p < PROVINCES; p++) w.net.values[i * PROVINCES + p] = wert;
}
/** Alle Voraussetzungen eines Knotens künstlich erfüllen (Größen hoch, Vorgänger fertig). */
function erfuelle(w: World, id: string): void {
  const v = VORHABEN.find((x) => x.id === id)!;
  for (const x of v.voraus) {
    if (x.art === "knoten" || x.art === "massnahme") setze(w, x.id, Math.min(100, (x.min ?? 50) + 5));
    if (x.art === "bestand") reichZustand(w).bestand[x.id] = { seit: w.date, zustand: 90 };
    if (x.art === "land") beziehungAendern(w, x.land, { [x.dim]: 60 });
  }
}

describe("Wissensbaum: Aufbau", () => {
  test("Jeder Knoten ist ein vorhandenes Vorhaben, steht in genau einem Zweig, und Vorgänger liegen weiter links", () => {
    const ids = ZWEIGE.flatMap((z) => z.knoten);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(45);
    for (const id of ids) expect(VORHABEN.some((v) => v.id === id)).toBe(true);
    const w = neu();
    for (const z of baumSicht(w).zweige)
      for (const k of z.knoten)
        for (const v of k.vorgaenger) expect(knotenSicht(w, v)!.spalte).toBeLessThan(k.spalte);
    for (const id of Object.keys(LIZENZ)) expect(ZWEIG_VON[id]).toBeDefined();
    for (const d of WERKE) expect(ZWEIG_VON[d.id]).toBeDefined();
  });

  test("Zu Beginn: Tempo 1, der Drohnenverbund steht, und jeder gesperrte Knoten nennt einen Grund", () => {
    const w = neu();
    const l = landesTempo(w);
    expect(l.forschung).toBeCloseTo(1, 6);
    expect(l.abwanderung).toBe(1);
    const s = baumSicht(w);
    const alle = s.zweige.flatMap((z) => z.knoten);
    expect(alle.find((k) => k.id === "mil_drohnen")!.zustand).toBe("fertig");
    for (const k of alle.filter((x) => x.zustand === "gesperrt")) expect(k.grund).toMatch(/\S/);
    expect(s.satz).toMatch(/\S/);
  });
});

describe("Wissensbaum: Bildung öffnet, Forschung treibt, Abwanderung bremst", () => {
  test("Fehlen Hochschulen oder Fachkräfte, sagt der Grund „Bildung“; mit mehr Ingenieuren öffnet sich der Knoten", () => {
    const w = neu();
    setze(w, "hochschule", 30);
    setze(w, "fachkraefte", 30);
    const k = knotenSicht(w, "chips_design")!;
    expect(k.zustand).toBe("gesperrt");
    expect(k.hindernis).toBe("bildung");
    expect(baumSicht(w).wartenAufBildung).toBeGreaterThanOrEqual(2);
    erfuelle(w, "chips_design");
    expect(knotenSicht(w, "chips_design")!.zustand).toBe("moeglich");
  });

  test("Mehr Forschungsetat beschleunigt; ohne Bildung verpufft ein Teil, mit gehobener Innovationsgrenze trägt mehr", () => {
    const w = neu();
    const z = haushaltZustand(w);
    z.stufen.forschung = 12;
    z.wirksam = { ...(z.wirksam ?? {}), forschung: 12 };
    const ohneBildung = landesTempo(w).forschung;
    expect(ohneBildung).toBeGreaterThan(1.3);
    expect(baumSicht(w).etat.verpufft).toBeGreaterThan(0.3);
    setze(w, "hochschule", 90);
    setze(w, "fachkraefte", 90);
    setze(w, "bildungsqualitaet", 90);
    expect(landesTempo(w).forschung).toBeGreaterThan(ohneBildung);
    z.stufen.forschung = -3;
    z.wirksam.forschung = -3;
    expect(landesTempo(w).forschung).toBeLessThan(1);
  });

  test("Abwanderung: Bildung weit vor der Forschung senkt das Tempo", () => {
    const w = neu();
    const z = haushaltZustand(w);
    z.stufen.bildung = 10;
    z.wirksam = { ...(z.wirksam ?? {}), bildung: 10 };
    expect(landesTempo(w).abwanderung).toBeLessThan(1);
    expect(baumSicht(w).abwanderung).toBe(true);
  });

  test("Ein laufender Knoten kommt mit hohem Forschungsetat schneller voran als ohne", () => {
    const fortschritt = (etat: number): number => {
      const w = neu(3);
      erfuelle(w, "bio_genomik");
      const z = haushaltZustand(w);
      z.stufen.forschung = etat;
      z.wirksam = { ...(z.wirksam ?? {}), forschung: etat };
      expect(beginneKnoten(w, "bio_genomik").ok).toBe(true);
      const l = reichZustand(w).laufend.find((x) => x.id === "bio_genomik")!;
      l.vergabeBis = undefined;
      for (let i = 0; i < 6; i++) reichMonat(w);
      return reichZustand(w).laufend.find((x) => x.id === "bio_genomik")?.fortschritt ?? Infinity;
    };
    expect(fortschritt(8)).toBeGreaterThan(fortschritt(0) * 1.2);
  });
});

describe("Wissensbaum: Entscheidungen mit Preis", () => {
  test("Lizenz: kostet mehr Kapital, beschleunigt, der Lizenzgeber freut sich, sein Rivale nicht", () => {
    const w = neu();
    erfuelle(w, "batt_zellfabrik");
    const vorher = w.spiel!.kapital;
    const usa = beziehungZurTuerkei(w, "USA").vertrauen;
    const k = knotenSicht(w, "batt_zellfabrik")!;
    const r = beginneKnoten(w, "batt_zellfabrik", { lizenz: "CHN" });
    expect(r.ok).toBe(true);
    expect(vorher - w.spiel!.kapital).toBeCloseTo(k.pk + BAUM.lizenzPk, 6);
    expect(baumZustand(w).lizenzen.batt_zellfabrik).toBe("CHN");
    expect(beziehungZurTuerkei(w, "USA").vertrauen).toBeLessThan(usa);
    const mit = forschungsTempo(w, "batt_zellfabrik");
    expect(mit).toBeCloseTo(landesTempo(w).forschung * BAUM.lizenzTempo, 6);
    expect(kostenFaktor(w, "batt_zellfabrik")).toBeCloseTo(BAUM.lizenzSchulden, 6);
    // Sperrt der Lizenzgeber (Vertrauen bricht ein), stockt der Bau
    beziehungAendern(w, "CHN", { vertrauen: -100 });
    expect(partnerGesperrt(w, "CHN")).toBe(true);
    expect(forschungsTempo(w, "batt_zellfabrik")).toBeLessThan(mit / 2);
  });

  test("Lizenz nur von Anbietern, und nachkaufen geht nur bei laufendem Knoten", () => {
    const w = neu();
    erfuelle(w, "chips_design");
    expect(beginneKnoten(w, "chips_design", { lizenz: "RUS" }).ok).toBe(false);
    expect(kaufeLizenz(w, "chips_design", "USA").ok).toBe(false);
    expect(beginneKnoten(w, "chips_design").ok).toBe(true);
    expect(kaufeLizenz(w, "chips_design", "USA").ok).toBe(true);
    expect(kaufeLizenz(w, "chips_design", "EU").ok).toBe(false);
  });

  test("Werk mit heimischer Firma: weniger Schulden, ein Kapital mehr; mit ausländischem Partner schneller", () => {
    const w = neu();
    erfuelle(w, "bio_impfstoffwerk");
    const vorher = w.spiel!.kapital;
    const pk = knotenSicht(w, "bio_impfstoffwerk")!.pk;
    expect(beginneKnoten(w, "bio_impfstoffwerk", { traeger: "firma" }).ok).toBe(true);
    expect(vorher - w.spiel!.kapital).toBeCloseTo(pk + 1, 6);
    expect(kostenFaktor(w, "bio_impfstoffwerk")).toBeCloseTo(BAUM.traeger.firma.schulden, 6);
    const w2 = neu();
    erfuelle(w2, "bio_impfstoffwerk");
    expect(beginneKnoten(w2, "bio_impfstoffwerk", { traeger: "ausland", partner: "EU" }).ok).toBe(true);
    expect(forschungsTempo(w2, "bio_impfstoffwerk")).toBeCloseTo(landesTempo(w2).forschung * BAUM.traeger.ausland.tempo, 6);
    expect(beginneKnoten(neu(), "chips_design", { traeger: "firma" }).ok).toBe(false);
  });

  test("Schwerpunkt: kostet Kapital, beschleunigt den Zweig, bremst die anderen, ein Jahr Sperre", () => {
    const w = neu();
    erfuelle(w, "chips_design");
    erfuelle(w, "bio_genomik");
    beginneKnoten(w, "chips_design");
    beginneKnoten(w, "bio_genomik");
    const a = forschungsTempo(w, "chips_design");
    const b = forschungsTempo(w, "bio_genomik");
    const vorher = w.spiel!.kapital;
    expect(setzeSchwerpunkt(w, "digital").ok).toBe(true);
    expect(vorher - w.spiel!.kapital).toBe(BAUM.schwerpunktPk);
    expect(forschungsTempo(w, "chips_design")).toBeCloseTo(a * BAUM.schwerpunktTempo, 6);
    expect(forschungsTempo(w, "bio_genomik")).toBeCloseTo(b * BAUM.andereTempo, 6);
    expect(setzeSchwerpunkt(w, "bio").ok).toBe(false);
    w.day += BAUM.schwerpunktSperre + 1;
    expect(setzeSchwerpunkt(w, "bio").ok).toBe(true);
  });
});

describe("Wissensbaum: Werke wirken", () => {
  test("Eine fertige Chipfabrik stellt Elektronik her, hebt Drohnen eine halbe Generation und beschleunigt ihre Fertigung", () => {
    const w = neu();
    baumZustand(w);
    const elektronik = () => gueterSicht(w).find((g) => g.def.id === "elektronik")!;
    const vorher = elektronik().produktion;
    const gen = streitkraefte(w).gattungen.drohnen.heimGeneration;
    expect(militaerGueterFaktor(w, "drohnen")).toBe(1);
    reichZustand(w).bestand.ki_chipfab = { seit: w.date, zustand: 90 };
    expect(werkZusatz(w, "elektronik")).toBeCloseTo(0.75, 6);
    expect(elektronik().produktion).toBeGreaterThan(vorher * 1.5);
    wissensbaumMonat(w);
    expect(streitkraefte(w).gattungen.drohnen.heimGeneration).toBeCloseTo(Math.min(5, gen + 0.5), 6);
    expect(militaerGueterFaktor(w, "drohnen")).toBeGreaterThan(1.2);
    expect(baumSicht(w).zweige.flatMap((z) => z.knoten).find((k) => k.id === "ki_chipfab")!.durchbruch).toBe(true);
    // Ein zweiter Monat verbucht nichts doppelt
    wissensbaumMonat(w);
    expect(streitkraefte(w).gattungen.drohnen.heimGeneration).toBeCloseTo(Math.min(5, gen + 0.5), 6);
  });

  test("Was zu Beginn schon stand, zählt nicht zusätzlich", () => {
    const w = neu();
    reichZustand(w).bestand.ki_chipfab = { seit: w.date, zustand: 90 };
    baumZustand(w);
    expect(werkZusatz(w, "elektronik")).toBe(0);
  });
});

describe("Wissensbaum: alte Spielstände, Bot, Texte", () => {
  test("Ein Spielstand ohne Wissensbaum legt ihn an und läuft weiter", () => {
    const w = neu();
    delete w.spiel!.wissensbaum;
    const json = JSON.parse(JSON.stringify(w)) as World;
    expect(json.spiel!.wissensbaum).toBeUndefined();
    wissensbaumMonat(json);
    const z = json.spiel!.wissensbaum!;
    expect(z.v).toBe(1);
    expect(z.verbucht).toContain("mil_drohnen");
    expect(z.durchbrueche).toEqual([]);
    expect(baumSicht(json).zweige.length).toBe(ZWEIGE.length);
  });

  test("Der Bot findet einen nächsten Knoten, sobald einer möglich ist", () => {
    const w = neu();
    erfuelle(w, "nano_zentrum");
    const k = naechsterKnoten(w);
    expect(k).not.toBeNull();
    expect(beginneKnoten(w, k!.id).ok).toBe(true);
  });

  test("Jeder Knoten, Zweig und jede Größe der Voraussetzungen hat Text", () => {
    for (const z of ZWEIGE) {
      expect(t(`wissen.z.${z.id}.name`)).not.toMatch(/⟦|wissen\./);
      for (const id of z.knoten) {
        expect(t(`wissen.n.${id}.name`)).not.toMatch(/⟦|wissen\./);
        expect(t(`wissen.n.${id}.satz`)).not.toMatch(/⟦|wissen\./);
        for (const x of VORHABEN.find((v) => v.id === id)!.voraus)
          if ((x.art === "knoten" || x.art === "massnahme" || x.art === "bestand") && !ZWEIG_VON[x.id]) expect(t(`wissen.g.${x.id}`)).not.toMatch(/⟦|wissen\./);
      }
    }
  });
});
