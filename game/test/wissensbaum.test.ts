// Wissensbaum: Knoten sind Vorhaben des Reiches; Bildung öffnet, Forschungsetat treibt, Abwanderung bremst; Lizenz und Träger
// haben Preis und Gegenspieler; fertige Werke stellen Güter her und heben die heimische Rüstung. Dazu alte Spielstände und Texte.

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { VORHABEN } from "../src/data/reich";
import { BAUM, HEUREKA, LIZENZ, STANDORT, WERKE, ZWEIGE, ZWEIG_VON } from "../src/data/wissensbaum";
import { baumSicht, beginneKnoten, kaufeLizenz, knotenSicht, militaerGueterFaktor, naechsterKnoten, setzeSchwerpunkt, standortSichten, wissensbaumMonat } from "../src/sim/wissensbaum";
import { werkLast } from "../src/sim/infrastruktur";
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

describe("Wissensbaum: Standort, Heureka, Protokoll", () => {
  test("Ein Werk lässt sich an einem anderen Standort bauen; Last, Ortswirkung und Fertigstellung folgen dorthin", () => {
    const w = neu();
    erfuelle(w, "ki_chipfab");
    const orte = standortSichten(w, "ki_chipfab");
    expect(orte.map((o) => o.plaka)).toEqual([41, 34, 6, 35]);
    for (const o of orte) {
      expect(o.tempo).toBeGreaterThanOrEqual(STANDORT.tempoMin * STANDORT.ueberlastTempo - 1e-9);
      expect(o.tempo).toBeLessThanOrEqual(STANDORT.tempoMax);
    }
    expect(beginneKnoten(w, "ki_chipfab", { standort: 99 }).ok).toBe(false);
    expect(beginneKnoten(w, "ki_chipfab", { standort: 6 }).ok).toBe(true);
    const z = baumZustand(w);
    expect(z.standort!.ki_chipfab!.plaka).toBe(6);
    expect(knotenSicht(w, "ki_chipfab")!.standort).toBe(6);
    expect(werkLast(w, "ki_chipfab").every((l) => l.provinzen[0] === 6)).toBe(true);
    // Fertigstellung: Vertrauen in Ankara steigt, nicht in Kocaeli
    const i = NET.index.get("vertrauen_regierung")!;
    const ank = w.net.values[i * PROVINCES + 5]!;
    const koc = w.net.values[i * PROVINCES + 40]!;
    reichZustand(w).bestand.ki_chipfab = { seit: w.date, zustand: 90 };
    wissensbaumMonat(w);
    expect(w.net.values[i * PROVINCES + 5]!).toBeGreaterThan(ank);
    expect(w.net.values[i * PROVINCES + 40]!).toBeCloseTo(koc, 6);
  });

  test("Mehr Fachkräfte vor Ort bauen schneller", () => {
    const w = neu();
    erfuelle(w, "luft_triebwerke");
    const i = NET.index.get("fachkraefte")!;
    w.net.values[i * PROVINCES + 25] = 40; // Eskişehir
    w.net.values[i * PROVINCES + 5] = 80; // Ankara
    const [esk, ank] = standortSichten(w, "luft_triebwerke");
    expect(ank!.tempo).toBeGreaterThan(esk!.tempo);
  });

  test("Der Beginn steht einmal im Protokoll, in der Sprache des Spiels, ohne die deutsche Zeile des Reiches", () => {
    const w = neu();
    erfuelle(w, "nano_zentrum");
    const vorher = w.log.length;
    expect(beginneKnoten(w, "nano_zentrum").ok).toBe(true);
    const neue = w.log.slice(vorher);
    expect(neue.some((e) => e.text.startsWith("Beginn:"))).toBe(false);
    expect(neue.filter((e) => e.kind === "entscheidung").length).toBe(1);
  });

  test("Heureka: Was zu Beginn erfüllt ist, gilt still; eine später erfüllte Bedingung beschleunigt den Knoten mit Meldung", () => {
    const w = neu();
    setze(w, "m_forschung", 30);
    wissensbaumMonat(w);
    const z = baumZustand(w);
    expect(z.heurekaGeprueft).toBe(true);
    expect(z.heureka!.some((h) => h.id === "bio_genomik")).toBe(false);
    erfuelle(w, "bio_genomik");
    setze(w, "m_forschung", 30);
    setze(w, "m_forschung", 50);
    expect(beginneKnoten(w, "bio_genomik").ok).toBe(true);
    const ohne = forschungsTempo(w, "bio_genomik");
    expect(knotenSicht(w, "bio_genomik")!.heureka!.erfuellt).toBe(false);
    setze(w, "m_forschung", 65);
    const vorher = w.log.length;
    wissensbaumMonat(w);
    expect(z.heureka!.some((h) => h.id === "bio_genomik" && h.tag === w.day)).toBe(true);
    expect(forschungsTempo(w, "bio_genomik")).toBeCloseTo(ohne * BAUM.heurekaTempo, 6);
    expect(w.log.slice(vorher).some((e) => e.text.includes(t("wissen.n.bio_genomik.name")))).toBe(true);
    expect(knotenSicht(w, "bio_genomik")!.heureka!.frisch).toBe(true);
  });

  test("Jede Heureka-Bedingung ist ein Vorhaben oder eine Maßnahme des Spiels, nie Voraussetzung des eigenen Knotens, und hat Text", () => {
    for (const h of HEUREKA) {
      expect(ZWEIG_VON[h.knoten]).toBeDefined();
      const v = VORHABEN.find((x) => x.id === h.knoten)!;
      if (h.bedingung.art === "vorhaben") {
        expect(VORHABEN.some((x) => x.id === h.bedingung.id)).toBe(true);
        expect(v.voraus.some((x) => x.art === "bestand" && x.id === h.bedingung.id)).toBe(false);
      } else {
        expect(NET.index.has(h.bedingung.id)).toBe(true);
        const vor = v.voraus.find((x) => x.art === "massnahme" && x.id === h.bedingung.id);
        if (vor && vor.art === "massnahme") expect(h.bedingung.min).toBeGreaterThan(vor.min ?? 0);
      }
      const w = neu();
      expect(knotenSicht(w, h.knoten)!.heureka!.text).not.toMatch(/⟦|wissen\./);
    }
  });

  test("Ein Spielstand ohne Standorte und Heureka lädt und rechnet weiter", () => {
    const w = neu();
    erfuelle(w, "bio_impfstoffwerk");
    beginneKnoten(w, "bio_impfstoffwerk");
    const json = JSON.parse(JSON.stringify(w)) as World;
    delete json.spiel!.wissensbaum!.standort;
    delete json.spiel!.wissensbaum!.heureka;
    delete json.spiel!.wissensbaum!.heurekaGeprueft;
    expect(forschungsTempo(json, "bio_impfstoffwerk")).toBeGreaterThan(0);
    wissensbaumMonat(json);
    expect(json.spiel!.wissensbaum!.standort).toEqual({});
    expect(Array.isArray(json.spiel!.wissensbaum!.heureka)).toBe(true);
    expect(knotenSicht(json, "bio_impfstoffwerk")!.standort).toBe(38);
  });
});
