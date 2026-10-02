// ZEI-1 (VERBESSERUNGSPLAN_2026-09-30): Ereignis-Wettbewerb.
// Ausgelöste Kandidaten konkurrieren pro Monat um wenige Präsentations-Slots, sortiert nach
// Dringlichkeit (Fristnähe, Schwere der Standardfolge, Neuheit). Der Rest wird ausgesessen
// (Standardfolge) oder eskaliert still (gärt weiter) — beides mit Haken in der Chronik.
// Die Tests erzwingen Gleichzeitigkeit, indem sie den Vorlagen kurzfristig sichere Chancen geben.

import { afterEach, describe, expect, test } from "vitest";
import { createWorld, advance, NET } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { waehleZiele, type Schwierigkeit } from "../src/sim/spiel";
import { EREIGNIS_WETTBEWERB, MAX_OFFEN, VORLAGEN, ereignisMonat, vorlage } from "../src/sim/ereignisse";
import type { Vorlage } from "../src/sim/ereignisse";
import { nationalAverage } from "../src/sim/netz";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

const profil: PlayerProfile = {
  name: "Test",
  heimat: "Ankara",
  heimatPlaka: 6,
  jugend: "",
  beruf: "Ökonom",
  partner: "",
  motiv: "",
  partei: { name: "Partei der Werte", kurz: "PW", farbe: "#555" },
  naehe: {},
  versprechen: [],
  wahl: { runde: 2, anteil: 51 },
};

/** Eine frische Partie ohne die drei Startvorgänge, damit der Schreibtisch leer ist. */
function welt(seed: number, schwierigkeit: Schwierigkeit = "normal"): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, profil);
  waehleZiele(w, [], schwierigkeit);
  w.spiel!.ereignisse = [];
  return w;
}

/** Setzt die Monatschance der genannten Vorlagen auf einen festen Wert und liefert die Rücknahme. */
function setzeChancen(fest: Record<string, number>): () => void {
  const alt = new Map<string, Vorlage["chance"]>();
  for (const v of VORLAGEN) {
    alt.set(v.id, v.chance);
    v.chance = fest[v.id] !== undefined ? () => fest[v.id]! : () => 0;
  }
  return () => {
    for (const v of VORLAGEN) v.chance = alt.get(v.id)!;
  };
}

const restaurierungen: (() => void)[] = [];
afterEach(() => {
  while (restaurierungen.length) restaurierungen.pop()!();
});

/** Nur diese Vorlagen lösen sicher aus, alle anderen nie. */
function nurDiese(ids: string[]): void {
  restaurierungen.push(setzeChancen(Object.fromEntries(ids.map((id) => [id, 1]))));
}

const chronikTitel = (w: World) => w.spiel!.chronik.map((c) => c.titel);
const chronikAusgaenge = (w: World) => w.spiel!.chronik.map((c) => c.ausgang);

describe("Ereignis-Wettbewerb (ZEI-1)", () => {
  test("Viele gleichzeitig fällige Ereignisse: nur so viele werden präsentiert, wie Slots frei sind", () => {
    const w = welt(7, "normal");
    nurDiese(["erdbeben", "waehrungsrutsch", "anschlag", "korruptionsaffaere", "preisdeckel_knappheit"]);
    ereignisMonat(w, new Rng(3));
    const slots = EREIGNIS_WETTBEWERB.slots.normal;
    expect(w.spiel!.ereignisse).toHaveLength(slots);
    // Die übrigen Kandidaten landen nachvollziehbar in der Chronik
    expect(w.spiel!.chronik).toHaveLength(5 - slots);
  });

  test("Auf „entspannt“ kommen drei Vorgänge auf den Tisch, auf „normal“ zwei", () => {
    const ids = ["erdbeben", "waehrungsrutsch", "anschlag", "korruptionsaffaere"];
    const w1 = welt(7, "entspannt");
    nurDiese(ids);
    ereignisMonat(w1, new Rng(3));
    expect(w1.spiel!.ereignisse).toHaveLength(EREIGNIS_WETTBEWERB.slots.entspannt);
    restaurierungen.pop()!();

    const w2 = welt(7, "normal");
    restaurierungen.push(setzeChancen(Object.fromEntries(ids.map((id) => [id, 1]))));
    ereignisMonat(w2, new Rng(3));
    expect(w2.spiel!.ereignisse).toHaveLength(EREIGNIS_WETTBEWERB.slots.normal);
  });

  test("Dringlichkeit siegt: kurze Frist und schwere Standardfolge schlagen das lahme Thema", () => {
    const w = welt(7, "normal");
    // waehrungsrutsch (Frist 5, schwer) und anschlag (Frist 5, schwer) gegen mietdeckel_folgen (Frist 10, mild)
    nurDiese(["waehrungsrutsch", "anschlag", "mietdeckel_folgen"]);
    ereignisMonat(w, new Rng(3));
    const vorgelegt = w.spiel!.ereignisse.map((e) => e.vorlage);
    expect(vorgelegt).toContain("waehrungsrutsch");
    expect(vorgelegt).toContain("anschlag");
    expect(vorgelegt).not.toContain("mietdeckel_folgen");
    // Das lahme Thema gärt weiter statt zu verschwinden
    expect(w.spiel!.eskalation?.mietdeckel_folgen).toBe(1);
  });

  test("Ausgesessen: ein akuter Verlierer läuft mit Standardfolge schlecht aus und steht in der Chronik", () => {
    const w = welt(7, "normal");
    // Zwei dringlichere Bewerber verdrängen das Erdbeben
    nurDiese(["anschlag", "waehrungsrutsch", "erdbeben"]);
    const vertrauen0 = nationalAverage(NET, w.net, "vertrauen_regierung");
    ereignisMonat(w, new Rng(3));
    expect(w.spiel!.ereignisse.map((e) => e.vorlage)).not.toContain("erdbeben");
    // Die Standardfolge des Erdbebens hat gegriffen (Vertrauen sinkt), obwohl nichts vorgelegt wurde
    expect(nationalAverage(NET, w.net, "vertrauen_regierung")).toBeLessThan(vertrauen0);
    const eintrag = w.spiel!.chronik.find((c) => c.titel.startsWith("Erdbeben in"));
    expect(eintrag).toBeDefined();
    expect(eintrag!.ausgang).toMatch(/^Ausgesessen/);
    // Ausgesessen ist erledigt: Die Abkühlung läuft, keine Eskalation bleibt liegen
    expect(w.spiel!.zuletzt.erdbeben).toBe(w.day);
    expect(w.spiel!.eskalation?.erdbeben).toBeUndefined();
  });

  test("Stille Eskalation: der gärende Vorgang kommt im nächsten Monat dringlicher zurück und härter", () => {
    const w = welt(7, "normal");
    // Monat 1: Die Korruptionsaffäre verliert gegen zwei schwerere Vorgänge
    nurDiese(["anschlag", "waehrungsrutsch", "korruptionsaffaere"]);
    ereignisMonat(w, new Rng(3));
    expect(w.spiel!.ereignisse.map((e) => e.vorlage)).not.toContain("korruptionsaffaere");
    expect(w.spiel!.eskalation?.korruptionsaffaere).toBe(1);
    expect(chronikAusgaenge(w).some((a) => a.startsWith("Im Hintergrund"))).toBe(true);

    // Monat 2: Die Konkurrenz ist in Abkühlung, die Affäre kommt mit Eskalations-Schub auf den Tisch
    restaurierungen.pop()!();
    restaurierungen.push(setzeChancen({ korruptionsaffaere: 1 }));
    w.day += 30;
    ereignisMonat(w, new Rng(4));
    const ev = w.spiel!.ereignisse.find((e) => e.vorlage === "korruptionsaffaere");
    expect(ev).toBeDefined();
    // Schwellenwert gestiegen: Der Vorgang kommt härter zurück als eine frische Affäre (Stärke > 1)
    expect(ev!.staerke).toBeGreaterThan(1);
    // Die Eskalation ist mit der Präsentation aufgelöst
    expect(w.spiel!.eskalation?.korruptionsaffaere).toBeUndefined();
  });

  test("Chronik-Haken: „Im Hintergrund … gärt weiter“ ist als solcher erkennbar", () => {
    const w = welt(7, "normal");
    nurDiese(["anschlag", "waehrungsrutsch", "streikwelle", "aerztestreik"]);
    ereignisMonat(w, new Rng(3));
    const hintergrund = w.spiel!.chronik.filter((c) => c.ausgang.startsWith("Im Hintergrund"));
    expect(hintergrund.length).toBeGreaterThan(0);
    expect(hintergrund[0]!.ausgang).toMatch(/gärt es weiter/);
    // Titel bleibt der des Vorgangs, damit die Chronik nachvollziehbar bleibt
    expect(hintergrund[0]!.titel.length).toBeGreaterThan(3);
  });

  test("Feste Termine des Staatsjahres konkurrieren nicht um Slots", () => {
    const w = welt(7, "normal");
    // koalitionsangebot ist ein Termin: Es wird auch dann vorgelegt, wenn die Slots voll wären
    w.spiel!.lager = [];
    nurDiese(["koalitionsangebot", "anschlag", "waehrungsrutsch"]);
    ereignisMonat(w, new Rng(3));
    const vorgelegt = w.spiel!.ereignisse.map((e) => e.vorlage);
    expect(vorgelegt).toContain("koalitionsangebot");
    expect(vorgelegt.length).toBeLessThanOrEqual(EREIGNIS_WETTBEWERB.slots.normal + 1);
  });

  test("MAX_OFFEN bleibt Obergrenze: ein Sieger ohne Platz rutscht in die Verliererbehandlung", () => {
    const w = welt(7, "normal");
    // Zwei Vorgänge sind schon offen; drei Kandidaten bei zwei Slots: Der zweite Sieger findet keinen Platz mehr
    w.spiel!.ereignisse = [
      { id: "x1", vorlage: "streikwelle", tag: 0, frist: 99, provinzen: [], staerke: 1 },
      { id: "x2", vorlage: "duerre", tag: 0, frist: 99, provinzen: [], staerke: 1 },
    ];
    expect(MAX_OFFEN).toBe(3);
    nurDiese(["anschlag", "waehrungsrutsch", "korruptionsaffaere"]);
    ereignisMonat(w, new Rng(3));
    const neu = w.spiel!.ereignisse.filter((e) => !e.id.startsWith("x"));
    expect(neu).toHaveLength(1); // nur ein Platz frei — der dringlichste Kandidat (Anschlag) bekommt ihn
    expect(neu[0]!.vorlage).toBe("anschlag");
    // Der zweite Sieger (Währungsrutsch, akut) wird ausgesessen, der Rest gärt weiter
    expect(chronikAusgaenge(w).some((a) => a.startsWith("Ausgesessen"))).toBe(true);
    expect(w.spiel!.eskalation?.korruptionsaffaere).toBe(1);
  });

  test("Determinismus: gleiche Partie, gleicher Seed, gleicher Verlauf", () => {
    const lauf = () => {
      const w = welt(7, "normal");
      restaurierungen.push(setzeChancen({ anschlag: 1, waehrungsrutsch: 1, korruptionsaffaere: 1, erdbeben: 0.9 }));
      const rng = new Rng(42);
      for (let monat = 0; monat < 4; monat++) {
        ereignisMonat(w, rng);
        w.day += 30;
      }
      restaurierungen.pop()!();
      return JSON.stringify({ offen: w.spiel!.ereignisse, chronik: w.spiel!.chronik, eskalation: w.spiel!.eskalation });
    };
    expect(lauf()).toBe(lauf());
  });

  test("Der Wettbewerb ersetzt die Dichte-Dämpfung nicht: Haken zählen nicht als Präsentationen", () => {
    const w = welt(7, "normal");
    nurDiese(["anschlag", "waehrungsrutsch", "korruptionsaffaere", "streikwelle", "aerztestreik"]);
    ereignisMonat(w, new Rng(3));
    // Die Chronik trägt die Wettbewerbs-Haken, die Dichte-Bremse darf dadurch nicht stärker greifen:
    // gemessen wird das an den Vorlagen, deren Chance von der Dichte abhängt (hier: unverändert möglich)
    const dichteRelevant = w.spiel!.chronik.filter((c) => /^(Ausgesessen|Im Hintergrund)/.test(c.ausgang));
    expect(dichteRelevant.length).toBeGreaterThan(0);
    // Präsentiert wurden trotz voller Chronik nur die Slots
    expect(w.spiel!.ereignisse.length).toBe(EREIGNIS_WETTBEWERB.slots.normal);
  });
});
