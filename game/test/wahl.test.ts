// Die Wahl als Ereignis mit Folgen: Kandidatenfeld, erster Wahlgang, Stichwahl, Parlamentswahl, Provinzergebnisse, Rede, Anfechtung, Ende.

import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { PROVINCES } from "../src/sim/netz";
import { entscheide } from "../src/sim/ereignisse";
import { WAHL, hochrechnung, huerdeProzent, istLetzteWahl, kandidatenFeld, rede, stichwahlAnteile, wahlabend, wahlabendQuittieren } from "../src/sim/wahl";
import { SPIEL, zielZustimmung } from "../src/sim/spiel";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

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
  versprechen: ["Rentenerhöhung in den ersten hundert Tagen versprochen."],
  wahl: { runde: 2, anteil: 51 },
};

function spiel(seed = 5): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, profil);
  w.spiel!.ereignisse = [];
  return w;
}

/** Hebt oder senkt die Zustimmung dauerhaft auf einen Zielwert (über die Kalibrierung, damit sie nicht zurückläuft). */
const ZIEL = new WeakMap<World, number>();
function stelleZustimmung(w: World, wert: number): void {
  w.spiel!.umfrage.zustimmung = wert;
  w.spiel!.kalibrierung += wert - 51 + 4;
  ZIEL.set(w, wert);
}

/**
 * Läuft bis kurz nach dem ersten Wahlgang und lässt alle Ereignisse unbeantwortet verfallen. Wer fünf Jahre nichts entscheidet, verliert
 * unterwegs Zustimmung (liegengelassene Bitten, sim/infrastruktur.ts); damit die Tests die Wahl bei der gesetzten Zustimmung prüfen,
 * wird sie halbjährlich und einen Monat vor dem Wahltag wieder auf den Zielwert gesetzt.
 */
function bisWahltag(w: World): void {
  const ziel = ZIEL.get(w);
  while (ziel !== undefined && w.spiel!.wahltag - w.day > 30 && !w.spiel!.ende) {
    advance(w, Math.min(180, w.spiel!.wahltag - w.day - 30));
    for (let i = 0; i < 3; i++) w.spiel!.kalibrierung += ziel - zielZustimmung(w);
    w.spiel!.umfrage.zustimmung = ziel;
  }
  advance(w, w.spiel!.wahltag - w.day + 1);
}

describe("Kandidatenfeld", () => {
  test("Amtsinhaber, Hauptgegner und ein Dritter, mit Parteien", () => {
    const w = spiel();
    const k = kandidatenFeld(w, false);
    expect(k.map((x) => x.id)).toEqual(["amt", "gegner", "dritte"]);
    expect(k[0]!.name).toBe("Test");
    expect(k[0]!.partei).toBe("PW");
    expect(k[1]!.partei).not.toBe("PW");
    expect(k[2]!.name.length).toBeGreaterThan(3);
  });

  test("In der letzten Amtszeit tritt der Nachfolger an, nicht der Präsident", () => {
    const w = spiel();
    w.spiel!.amtszeit = 2;
    expect(istLetzteWahl(w)).toBe(true);
    const k = kandidatenFeld(w, true);
    expect(k[0]!.nachfolger).toBe(true);
    expect(k[0]!.name).not.toBe("Test");
  });
});

describe("Erster Wahlgang", () => {
  test("Hohe Zustimmung: Sieg im ersten Wahlgang, mit Ergebnis, Parlament und Folgen", () => {
    const w = spiel();
    stelleZustimmung(w, 80);
    bisWahltag(w);
    const sp = w.spiel!;
    expect(sp.ende).toBeUndefined();
    expect(sp.wahl!.historie).toHaveLength(1);
    const e = sp.wahl!.historie[0]!;
    expect(e.gewonnen).toBe(true);
    expect(e.runden).toHaveLength(1);
    expect(e.runden[0]!.anteile.amt!).toBeGreaterThan(50);
    const summe = (e.runden[0]!.anteile.amt ?? 0) + (e.runden[0]!.anteile.gegner ?? 0) + (e.runden[0]!.anteile.dritte ?? 0);
    expect(summe).toBeGreaterThan(97);
    expect(summe).toBeLessThanOrEqual(100.3);
    expect(e.runden[0]!.beteiligung).toBeGreaterThan(60);
    expect(sp.amtszeit).toBe(2);
    expect(sp.wahl!.abend).toBe(e.id);
    expect(wahlabend(w)?.id).toBe(e.id);
    // Quittieren räumt Abend und Rückfall-Hinweis auf
    expect(sp.hinweise.some((h) => h.id === e.id)).toBe(true);
    wahlabendQuittieren(w);
    expect(sp.wahl!.abend).toBeUndefined();
    expect(sp.hinweise.some((h) => h.id === e.id)).toBe(false);
  });

  test("Niedrige Zustimmung: Niederlage, Ende mit Abwahl", () => {
    const w = spiel();
    stelleZustimmung(w, 30);
    // Runde „Das Netz atmet“: Gewöhnung und Gegendruck lassen die Zustimmung bei einem dauerhaft erzwungenen Tief nicht mehr bei 26 bis 28
    // Prozent stehen, sondern in Jahr zwei unter die Sturzschwelle (25) fallen (gemessen: Seed 5, 22 Prozent nach 22 Monaten, vorher 25 bis 27).
    // Der Test prüft die Wahl und nicht den Sturz: Die Schwelle ist hier ausgeschaltet; den Sturz decken test/enden.test.ts und test/spielschleife.test.ts ab.
    const spielwerte = SPIEL as { sturzSchwelle: number };
    const schwelle = spielwerte.sturzSchwelle;
    spielwerte.sturzSchwelle = 0;
    try {
      bisWahltag(w);
    } finally {
      spielwerte.sturzSchwelle = schwelle;
    }
    expect(w.spiel!.ende?.art).toBe("abwahl");
    expect(w.spiel!.ende?.titel).toBe("Abgewählt");
    expect(w.spiel!.wahl!.historie[0]!.gewonnen).toBe(false);
  });

  test("Provinzergebnisse: Der bevölkerungsgewichtete Schnitt trifft das Landesergebnis", () => {
    const w = spiel();
    stelleZustimmung(w, 80);
    bisWahltag(w);
    const e = w.spiel!.wahl!.historie[0]!;
    const gew = w.net.weights;
    let amt = 0;
    let gewSumme = 0;
    const plakas = Object.keys(e.provinzen).map(Number).sort((a, b) => a - b);
    expect(plakas).toHaveLength(PROVINCES);
    plakas.forEach((p, i) => {
      amt += e.provinzen[String(p)]!.amt * gew[i]!;
      gewSumme += gew[i]!;
    });
    expect(amt / gewSumme).toBeCloseTo(e.runden[e.runden.length - 1]!.anteile.amt!, 0);
    for (const p of plakas) {
      const r = e.provinzen[String(p)]!;
      expect(r.amt + r.gegner).toBeLessThanOrEqual(99.5);
    }
  });

  test("Hochrechnung: fünf Stufen, die letzte ist das Endergebnis, Provinzen kommen nach und nach hinzu", () => {
    const w = spiel();
    stelleZustimmung(w, 80);
    bisWahltag(w);
    const e = w.spiel!.wahl!.historie[0]!;
    const h = hochrechnung(e);
    expect(h).toHaveLength(5);
    expect(h[4]!.amt).toBeCloseTo(e.runden[0]!.anteile.amt!, 1);
    expect(h[4]!.provinzen).toHaveLength(PROVINCES);
    for (let i = 1; i < h.length; i++) expect(h[i]!.provinzen.length).toBeGreaterThanOrEqual(h[i - 1]!.provinzen.length);
  });
});

describe("Parlamentswahl am selben Tag", () => {
  test("Neue Sitzverteilung mit 600 Sitzen, Lager angepasst, Hürde beachtet", () => {
    const w = spiel();
    const vorher = { ...w.parliament!.seats };
    stelleZustimmung(w, 80);
    bisWahltag(w);
    const p = w.spiel!.wahl!.historie[0]!.parlament;
    expect(Object.values(p.sitzeNachher).reduce((a, b) => a + b, 0)).toBe(600);
    expect(w.parliament!.seats).toEqual(p.sitzeNachher);
    expect(p.sitzeVorher).toEqual(vorher);
    expect(p.huerde).toBe(7);
    for (const q of p.unterHuerde) expect(p.sitzeNachher[q] ?? 0).toBe(0);
    for (const q of w.spiel!.lager) expect(w.parliament!.seats[q] ?? 0).toBeGreaterThan(0);
    expect(p.lagerSitzeNachher).toBe([w.player!.partei.kurz, ...w.spiel!.lager].reduce((s, q) => s + (w.parliament!.seats[q] ?? 0), 0));
  });

  test("Der Zugewinn des Präsidenten schlägt auf das Lager durch: hohe Zustimmung ergibt mehr Sitze als niedrige", () => {
    const mittel = (z: number) => {
      let s = 0;
      for (const seed of [1, 2, 3, 4, 5, 6]) {
        const w = spiel(seed);
        stelleZustimmung(w, z);
        bisWahltag(w);
        // Die Parlamentswahl ist am ersten Wahltag entschieden, auch wenn die Stichwahl noch aussteht
        s += (w.spiel!.wahl!.stichwahl?.parlament ?? w.spiel!.wahl!.historie[0]!.parlament).lagerSitzeNachher;
      }
      return s / 6;
    };
    expect(mittel(85)).toBeGreaterThan(mittel(52) + 20);
  });

  test("Die Sperrklausel folgt dem Verfassungsartikel: bei zehn Prozent fallen kleine Parteien heraus", () => {
    const w = spiel();
    w.spiel!.verfassungsvorgang = { amtszeitBelegt: 0, sperren: {}, aktiv: { wahlrecht: "zehn" }, historie: [] };
    expect(huerdeProzent(w)).toBe(10);
    stelleZustimmung(w, 80);
    bisWahltag(w);
    const p = w.spiel!.wahl!.historie[0]!.parlament;
    expect(p.huerde).toBe(10);
    for (const [partei, anteil] of Object.entries(p.anteile)) {
      if (partei === "Andere" || w.spiel!.lager.includes(partei) || partei === w.player!.partei.kurz) continue;
      if (anteil < 10) expect(p.sitzeNachher[partei] ?? 0).toBe(0);
    }
  });

  test("Spielstände mit bestehendem Parlament laufen weiter, ohne dass Felder fehlen", () => {
    const w = spiel();
    delete w.spiel!.wahl;
    delete w.spiel!.amtszeiten;
    stelleZustimmung(w, 80);
    expect(() => bisWahltag(w)).not.toThrow();
    expect(w.spiel!.wahl!.historie.length).toBe(1);
  });
});

describe("Stichwahl", () => {
  /** Findet einen Seed, bei dem eine mittlere Zustimmung zur Stichwahl führt. */
  function stichwahlWelt(): World {
    for (let seed = 1; seed <= 60; seed++) {
      const w = spiel(seed);
      stelleZustimmung(w, 48);
      bisWahltag(w);
      if (w.spiel!.wahl?.stichwahl) return w;
    }
    throw new Error("Kein Seed mit Stichwahl gefunden");
  }

  test("Ohne absolute Mehrheit gibt es nach 14 Tagen eine Stichwahl; zwischen den Runden entscheidet der Spieler", () => {
    const w = stichwahlWelt();
    const v = w.spiel!.wahl!.stichwahl!;
    expect(v.tag - w.day).toBeLessThanOrEqual(WAHL.stichwahlTage);
    expect(w.spiel!.ende).toBeUndefined();
    expect(w.spiel!.amtszeit).toBe(1);
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("wahl-stichwahl-"))).toBe(true);
    const ev = w.spiel!.ereignisse.find((e) => e.vorlage === "wahl_stichwahl");
    expect(ev).toBeDefined();
    const basis = stichwahlAnteile(v).amt;
    w.spiel!.kapital = 50;
    entscheide(w, ev!.id, "werben", new Rng(1));
    expect(v.entscheidung).toBe("werben");
    expect(stichwahlAnteile(v).amt).toBeGreaterThan(basis);
    advance(w, WAHL.stichwahlTage + 2);
    expect(w.spiel!.wahl!.stichwahl).toBeUndefined();
    const e = w.spiel!.wahl!.historie[0]!;
    expect(e.runden).toHaveLength(2);
    expect(e.runden[1]!.anteile.amt! + e.runden[1]!.anteile.gegner!).toBeCloseTo(100, 0);
    expect(e.gewonnen ? w.spiel!.amtszeit : 0).toBe(e.gewonnen ? 2 : 0);
    expect(e.gewonnen || w.spiel!.ende?.art === "abwahl").toBe(true);
  });

  test("Mobilisieren erhöht den Anteil, Abwarten ändert nichts", () => {
    const w = stichwahlWelt();
    const v = w.spiel!.wahl!.stichwahl!;
    const basis = stichwahlAnteile(v).amt;
    v.mobilisierung += WAHL.mobilisierung;
    expect(stichwahlAnteile(v).amt).toBeGreaterThan(basis);
  });
});

describe("Rede und Anfechtung", () => {
  test("Die Rede wirkt einmal und nur nach einem Sieg", () => {
    const w = spiel();
    stelleZustimmung(w, 80);
    bisWahltag(w);
    const e = w.spiel!.wahl!.historie[0]!;
    const r = rede(w, "einend");
    expect(r.ok).toBe(true);
    expect(e.rede).toBe("einend");
    expect(rede(w, "triumph").ok).toBe(false);
    const w2 = spiel();
    stelleZustimmung(w2, 30);
    bisWahltag(w2);
    expect(rede(w2, "einend").ok).toBe(false);
  });

  test("Ein knapper Sieg wird angefochten: Ereignis und Zustand", () => {
    let gefunden = false;
    for (let seed = 1; seed <= 80 && !gefunden; seed++) {
      const w = spiel(seed);
      stelleZustimmung(w, 51);
      bisWahltag(w);
      if (w.spiel!.wahl?.stichwahl) advance(w, WAHL.stichwahlTage + 2);
      const e = w.spiel!.wahl!.historie[0];
      if (e?.gewonnen && e.marge < WAHL.knapp) {
        gefunden = true;
        expect(e.anfechtung).toMatch(/laufend|abgewiesen/);
        expect(w.spiel!.ereignisse.some((x) => x.vorlage === "wahl_anfechtung") || e.anfechtung === "abgewiesen").toBe(true);
      }
    }
    expect(gefunden).toBe(true);
  });
});
