// Länder-Eigeninitiative (AUS-1, VERBESSERUNGSPLAN_2026-09-30): die Welt handelt von sich aus.
// Auslösung durch die sechs Treiber, Dämpfung (max. 1 pro Monat im Ereignis-Wettbewerb) und Abkühlung
// (90 Tage je Land), alle fünf Initiative-Typen mit ihren Folgen, Vertragsverlängerung bei Auslauf,
// Rote-Linie-Forderung, Übergabe der Drohkulisse an den Konfliktvorgang (MIL-1), Determinismus über
// Seeds und Migration alter Spielstände ohne die neuen Felder.

import { afterEach, describe, expect, test } from "vitest";
import { createWorld, advance, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { antworten, entscheide, ereignisMonat, oeffne, vorlage, VORLAGEN } from "../src/sim/ereignisse";
import type { Vorlage } from "../src/sim/ereignis-hilfen";
import { INITIATIVE_REGELN, INITIATIVE_VORLAGE_IDS, besterKandidat, initiativeKandidaten } from "../src/sim/initiative";
import { laufende, schliesse, verhandle } from "../src/sim/abkommen";
import { vertrauenZu, weltZustand } from "../src/sim/laender";
import { verfassungVon } from "../src/sim/aufmerksamkeit";
import { KRIEG, kriegMit, kriegMonat, kriegTag } from "../src/sim/krieg";
import { spielTick } from "../src/sim/spiel"; // Modulinitialisierung: registriert die Krieg-Brücke der Eigeninitiative
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";
import type { Vertrag } from "../src/sim/abkommen-typen";

const R = INITIATIVE_REGELN;
void spielTick;

/** Eine frische Partie hinter der Ruhephase der Eigeninitiative, mit voller Kasse. */
function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 100;
  w.day = R.startTag + 10;
  return w;
}

/** Ein Vertrag, der in `rest` Tagen ausläuft (direkt eingetragen, ohne Verhandlung). */
function auslaufenderVertrag(w: World, landId: string, rest = 200): Vertrag {
  const v: Vertrag = {
    id: `v-test-${landId}`, land: landId, gibt: ["bauauftraege"], will: [], jahre: 5,
    seit: w.day - 1600, ablauf: w.day + rest, status: "laeuft", verstoesse: 0, letztePruefung: w.day - 100,
  };
  (weltZustand(w)[landId]!.vertraege ??= []).push(v);
  return v;
}

// Erzwungene Chancen nach dem Muster von test/ereignis-wettbewerb.test.ts (Modulzustand, wird zurückgenommen)
const restaurierungen: (() => void)[] = [];
afterEach(() => {
  while (restaurierungen.length) restaurierungen.pop()!();
});

/** Setzt die Monatschance aller Initiative-Vorlagen auf 1, alle anderen auf 0 (und liefert die Rücknahme). */
function nurInitiative(): void {
  const alt = new Map<string, Vorlage["chance"]>();
  for (const v of VORLAGEN) {
    alt.set(v.id, v.chance);
    v.chance = INITIATIVE_VORLAGE_IDS.has(v.id) ? () => 1 : () => 0;
  }
  restaurierungen.push(() => {
    for (const v of VORLAGEN) v.chance = alt.get(v.id)!;
  });
}

const offeneInitiative = (w: World) => w.spiel!.ereignisse.find((e) => INITIATIVE_VORLAGE_IDS.has(e.vorlage));

/** Lässt den Ereignis-Wettbewerb so viele Monate laufen, bis die erste Initiative offen ist (deterministisch). */
function ersteInitiative(w: World, maxMonate = 36): string {
  const rng = new Rng(99);
  for (let i = 0; i < maxMonate; i++) {
    ereignisMonat(w, rng);
    const ev = offeneInitiative(w);
    if (ev) return ev.vorlage;
    // Das Tableau für die nächste Runde frei halten; die Monats-Sperre der Initiative bleibt unberührt
    w.spiel!.ereignisse = w.spiel!.ereignisse.filter((e) => INITIATIVE_VORLAGE_IDS.has(e.vorlage));
    w.day += 30;
  }
  throw new Error("Keine Initiative ausgelöst");
}

const kandidatenFuer = (w: World, landId: string) => initiativeKandidaten(w).filter((k) => k.land === landId);

// ---------------------------------------------------------------------------

describe("Treiber: was ein Land auf den Plan ruft", () => {
  test("Rote Linie bedroht (Veto am Verhandlungstisch) treibt eine Forderung", () => {
    const w = welt();
    const b = verhandle(w, { land: "GRC", gibt: [], will: ["w_inseln"], jahre: 2 });
    expect(b.urteil).toBe("veto");
    expect(weltZustand(w).GRC!.rotBedroht).toBe(w.day);
    const k = kandidatenFuer(w, "GRC").find((x) => x.vorlage === "land_fordert" && x.daten.anlass === "rot");
    expect(k).toBeDefined();
    expect(k!.gewicht).toBeGreaterThan(0);
  });

  test("Öffentlicher Druck aus Ankara bedroht die Rote Linie ebenfalls", () => {
    const w = welt();
    weltZustand(w).CYP!.zuletzt.druck = w.day - 10;
    const k = kandidatenFuer(w, "CYP").find((x) => x.vorlage === "land_fordert" && x.daten.anlass === "rot");
    expect(k).toBeDefined();
  });

  test("Offene Anliegen treiben eine Forderung", () => {
    const w = welt();
    const k = initiativeKandidaten(w).find((x) => x.vorlage === "land_fordert" && x.daten.anlass === "anliegen");
    expect(k).toBeDefined();
    expect(String(k!.daten.text ?? "").length).toBeGreaterThan(5);
  });

  test("Vertrag vor dem Auslauf (< 12 Monate) treibt eine Verlängerung", () => {
    const w = welt();
    auslaufenderVertrag(w, "SYR", 200);
    const k = kandidatenFuer(w, "SYR").find((x) => x.vorlage === "vertrag_verlaengerung");
    expect(k).toBeDefined();
    expect(k!.daten.vertrag).toBe("v-test-SYR");
    // Weit entfernter Ablauf treibt nichts
    const w2 = welt();
    auslaufenderVertrag(w2, "SYR", 800);
    expect(kandidatenFuer(w2, "SYR").some((x) => x.vorlage === "vertrag_verlaengerung")).toBe(false);
  });

  test("Hoher Konflikt treibt Provokation, sehr hoher die Drohkulisse", () => {
    const w = welt();
    weltZustand(w).GRC!.konflikt = 75;
    expect(kandidatenFuer(w, "GRC").some((x) => x.vorlage === "land_provokation")).toBe(true);
    expect(kandidatenFuer(w, "GRC").some((x) => x.vorlage === "land_drohkulisse")).toBe(false);
    weltZustand(w).GRC!.konflikt = 90;
    expect(kandidatenFuer(w, "GRC").some((x) => x.vorlage === "land_drohkulisse")).toBe(true);
    expect(kandidatenFuer(w, "GRC").some((x) => x.vorlage === "land_provokation")).toBe(false);
  });

  test("Hohes Vertrauen treibt ein Angebot", () => {
    const w = welt();
    weltZustand(w).AZE!.versatz = 60;
    expect(vertrauenZu(w, "AZE")).toBeGreaterThanOrEqual(R.vertrauenAngebot);
    const k = kandidatenFuer(w, "AZE").find((x) => x.vorlage === "land_angebot");
    expect(k).toBeDefined();
    expect(String(k!.daten.gibt ?? "").length + String(k!.daten.will ?? "").length).toBeGreaterThan(0);
  });

  test("Ausstrahlung eines Drittland-Vertrags treibt eine Forderung des Getroffenen", () => {
    const w = welt();
    schliesse(w, { land: "AZE", gibt: ["ruestung_koop"], will: [], jahre: 5 }); // wirkt auf Armenien aus
    const k = kandidatenFuer(w, "ARM").find((x) => x.vorlage === "land_fordert" && x.daten.anlass === "ausstrahlung");
    expect(k).toBeDefined();
    expect(k!.daten.quelle).toBe("AZE");
  });

  test("Vor der Ruhephase und bei vollem Tableau bleibt die Welt still", () => {
    const w = welt();
    w.day = R.startTag - 5;
    weltZustand(w).GRC!.konflikt = 95;
    expect(initiativeKandidaten(w)).toHaveLength(0);
    expect(besterKandidat(w, "land_drohkulisse")).toBeNull();
    nurInitiative();
    ereignisMonat(w, new Rng(1));
    expect(w.spiel!.ereignisse).toHaveLength(0);
    // Volles Tableau: drei offene Vorgänge blockieren die Präsentation (MAX_OFFEN in sim/ereignisse.ts)
    w.day = R.startTag + 10;
    w.spiel!.ereignisse = [
      { id: "x1", vorlage: "streikwelle", tag: 0, frist: 999, provinzen: [], staerke: 1 },
      { id: "x2", vorlage: "duerre", tag: 0, frist: 999, provinzen: [], staerke: 1 },
      { id: "x3", vorlage: "miete", tag: 0, frist: 999, provinzen: [], staerke: 1 },
    ];
    ereignisMonat(w, new Rng(1));
    expect(w.spiel!.ereignisse).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------

describe("Dämpfung und Abkühlung im Ereignis-Wettbewerb", () => {
  /** Eine Welt mit vielen gleichzeitigen Treibern. */
  function aufgeheizt(seed = 6): World {
    const w = welt(seed);
    weltZustand(w).GRC!.konflikt = 92;
    weltZustand(w).CYP!.konflikt = 90;
    weltZustand(w).AZE!.versatz = 60;
    auslaufenderVertrag(w, "SYR", 200);
    return w;
  }

  test("Mehrere Treiber, aber höchstens eine Initiative pro Monat", () => {
    const w = aufgeheizt();
    expect(initiativeKandidaten(w).length).toBeGreaterThan(1);
    nurInitiative(); // alle Initiative-Vorlagen lösen sicher aus, der Rest schweigt
    ereignisMonat(w, new Rng(3));
    const offen = w.spiel!.ereignisse.filter((e) => INITIATIVE_VORLAGE_IDS.has(e.vorlage));
    expect(offen.length).toBe(R.maxProMonat);
    // Die Monats-Sperre steht: ein zweiter Durchlauf am selben Tag öffnet nichts mehr
    const zahl = w.spiel!.ereignisse.length;
    ereignisMonat(w, new Rng(4));
    expect(w.spiel!.ereignisse).toHaveLength(zahl);
  });

  test("Nach einer Initiative ruht das Land für 90 Tage", () => {
    const w = aufgeheizt();
    nurInitiative();
    ereignisMonat(w, new Rng(3));
    const ev = offeneInitiative(w)!;
    const landId = String(ev.daten?.land);
    expect(weltZustand(w)[landId]!.initiativeZuletzt).toBe(w.day);
    // Vorgang beantwortet und Monats-Sperre vorbei: das Land bleibt trotzdem in Abkühlung
    w.spiel!.ereignisse = [];
    w.day += 30;
    expect(kandidatenFuer(w, landId)).toHaveLength(0);
    w.day += R.abkuehlungLand - 30 - 1;
    expect(kandidatenFuer(w, landId)).toHaveLength(0);
    w.day += 1;
    // Nach 90 Tagen darf das Land wieder — seine Treiber (hier Konflikt) stehen noch
    expect(kandidatenFuer(w, landId).length).toBeGreaterThan(0);
  });

  test("Ein Land mit offenem Vorgang kommt nicht noch einmal dran", () => {
    const w = aufgeheizt();
    nurInitiative();
    ereignisMonat(w, new Rng(3));
    const landId = String(offeneInitiative(w)!.daten?.land);
    weltZustand(w)[landId]!.initiativeZuletzt = undefined; // Abkühlung künstlich aufheben
    expect(kandidatenFuer(w, landId)).toHaveLength(0);
  });

  test("Verlierer-Initiativen warten still: keine Chronik-Haken, keine Eskalationsstufe", () => {
    const w = aufgeheizt();
    // Nur eine lahme heimische Vorlage konkurriert sicher; die Initiative ist dringlicher, gewinnt aber nicht immer einen Slot
    const alt = new Map<string, Vorlage["chance"]>();
    for (const v of VORLAGEN) {
      alt.set(v.id, v.chance);
      v.chance = INITIATIVE_VORLAGE_IDS.has(v.id) ? () => 1 : () => 0;
    }
    restaurierungen.push(() => {
      for (const v of VORLAGEN) v.chance = alt.get(v.id)!;
    });
    const chronik0 = w.spiel!.chronik.length;
    ereignisMonat(w, new Rng(3));
    // Genau eine Initiative wird präsentiert; keine weiteren Initiative-Spuren in Chronik oder Eskalation
    expect(w.spiel!.ereignisse.filter((e) => INITIATIVE_VORLAGE_IDS.has(e.vorlage)).length).toBe(1);
    const haken = w.spiel!.chronik.slice(chronik0).filter((c) => /^(Ausgesessen|Im Hintergrund)/.test(c.ausgang));
    expect(haken).toHaveLength(0);
    expect(Object.keys(w.spiel!.eskalation ?? {}).filter((id) => INITIATIVE_VORLAGE_IDS.has(id))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------

describe("Die fünf Initiative-Typen und ihre Folgen", () => {
  test("Forderung: erfüllen schließt einen Vertrag, ablehnen kostet Beziehung, Gegenangebot verhandelt", () => {
    // Erfüllen
    const w = welt();
    weltZustand(w).GRC!.rotBedroht = w.day;
    const k = kandidatenFuer(w, "GRC").find((x) => x.daten.anlass === "rot")!;
    const ev = oeffne(w, "land_fordert", new Rng(5), { provinzen: [], staerke: 1, daten: k.daten })!;
    const vertraegeVorher = laufende(w, "GRC").length;
    const kapitalVorher = w.spiel!.kapital;
    const r = entscheide(w, ev.id, "erfuellen", new Rng(7));
    expect(r.ok).toBe(true);
    expect(laufende(w, "GRC").length).toBe(vertraegeVorher + 1);
    expect(w.spiel!.kapital).toBeLessThan(kapitalVorher);
    expect(w.spiel!.chronik.some((c) => c.titel.includes("fordert"))).toBe(true);

    // Ablehnen: Beziehung kühlt ab, Konflikt steigt, kostet nichts
    const w2 = welt();
    weltZustand(w2).GRC!.rotBedroht = w2.day;
    const k2 = kandidatenFuer(w2, "GRC").find((x) => x.daten.anlass === "rot")!;
    const ev2 = oeffne(w2, "land_fordert", new Rng(5), { provinzen: [], staerke: 1, daten: k2.daten })!;
    const v0 = vertrauenZu(w2, "GRC");
    const konflikt0 = weltZustand(w2).GRC!.konflikt;
    const r2 = entscheide(w2, ev2.id, "ablehnen", new Rng(7));
    expect(r2.ok).toBe(true);
    expect(vertrauenZu(w2, "GRC")).toBeLessThan(v0);
    expect(weltZustand(w2).GRC!.konflikt).toBeGreaterThan(konflikt0);
    expect(w2.spiel!.kapital).toBe(100);

    // Gegenangebot: ein Tausch, der entweder zum Vertrag führt oder an der Forderung scheitert — beides ehrlich
    const w3 = welt();
    weltZustand(w3).GRC!.rotBedroht = w3.day;
    const k3 = kandidatenFuer(w3, "GRC").find((x) => x.daten.anlass === "rot")!;
    const ev3 = oeffne(w3, "land_fordert", new Rng(5), { provinzen: [], staerke: 1, daten: k3.daten })!;
    const r3 = entscheide(w3, ev3.id, "gegenangebot", new Rng(7));
    expect(r3.ok).toBe(true);
    expect(r3.text.length).toBeGreaterThan(10);
  });

  test("Angebot: annehmen schließt den Vertrag, ablehnen kostet nur etwas Wärme", () => {
    const w = welt();
    weltZustand(w).AZE!.versatz = 60;
    const k = kandidatenFuer(w, "AZE").find((x) => x.vorlage === "land_angebot")!;
    const ev = oeffne(w, "land_angebot", new Rng(5), { provinzen: [], staerke: 1, daten: k.daten })!;
    const r = entscheide(w, ev.id, "annehmen", new Rng(7));
    expect(r.ok).toBe(true);
    expect(laufende(w, "AZE").length).toBeGreaterThan(0);

    const w2 = welt();
    weltZustand(w2).AZE!.versatz = 60;
    const k2 = kandidatenFuer(w2, "AZE").find((x) => x.vorlage === "land_angebot")!;
    const ev2 = oeffne(w2, "land_angebot", new Rng(5), { provinzen: [], staerke: 1, daten: k2.daten })!;
    const versatz0 = weltZustand(w2).AZE!.versatz;
    const r2 = entscheide(w2, ev2.id, "ablehnen", new Rng(7));
    expect(r2.ok).toBe(true);
    expect(w2.spiel!.kapital).toBe(100);
    expect(weltZustand(w2).AZE!.versatz).toBeLessThan(versatz0); // das Vertrauen kühlt messbar ab
  });

  test("Vertragsverlängerung bei Auslauf: zwei Jahre, fünf mit Zugabe oder auslaufen", () => {
    const w = welt();
    const v = auslaufenderVertrag(w, "SYR", 200);
    const k = kandidatenFuer(w, "SYR").find((x) => x.vorlage === "vertrag_verlaengerung")!;
    const ev = oeffne(w, "vertrag_verlaengerung", new Rng(5), { provinzen: [], staerke: 1, daten: k.daten })!;
    const ablauf0 = v.ablauf;
    expect(antworten(w, ev).length).toBeGreaterThanOrEqual(3);
    // Kurz verlängern: genau zwei Jahre mehr
    const r = entscheide(w, ev.id, "verlaengern2", new Rng(7));
    expect(r.ok).toBe(true);
    expect(v.ablauf).toBe(ablauf0 + 720);

    // Die lange Fassung mit leicht geänderten Konditionen (Zugabe), wenn das Land eine findet
    const w2 = welt();
    const v2 = auslaufenderVertrag(w2, "SYR", 200);
    const k2 = kandidatenFuer(w2, "SYR").find((x) => x.vorlage === "vertrag_verlaengerung")!;
    const ev2 = oeffne(w2, "vertrag_verlaengerung", new Rng(5), { provinzen: [], staerke: 1, daten: k2.daten })!;
    const lang = k2.daten.zugabe ? "verlaengern_zugabe" : "verlaengern5";
    const vertraege0 = laufende(w2, "SYR").length;
    const ablauf2 = v2.ablauf;
    const r2 = entscheide(w2, ev2.id, lang, new Rng(7));
    expect(r2.ok).toBe(true);
    expect(v2.ablauf).toBe(ablauf2 + 1800);
    if (k2.daten.zugabe) expect(laufende(w2, "SYR").length).toBe(vertraege0 + 1); // das Zusatzprotokoll

    // Auslaufen lassen: kostenlos, kleiner Vertrauensverlust
    const w3 = welt();
    auslaufenderVertrag(w3, "SYR", 200);
    const k3 = kandidatenFuer(w3, "SYR").find((x) => x.vorlage === "vertrag_verlaengerung")!;
    const ev3 = oeffne(w3, "vertrag_verlaengerung", new Rng(5), { provinzen: [], staerke: 1, daten: k3.daten })!;
    const v3 = vertrauenZu(w3, "SYR");
    const r3 = entscheide(w3, ev3.id, "auslaufen", new Rng(7));
    expect(r3.ok).toBe(true);
    expect(w3.spiel!.kapital).toBe(100);
    expect(vertrauenZu(w3, "SYR")).toBeLessThan(v3);
  });

  test("Provokation: dulden kostet Gesicht, kontern eskaliert, Vermittlung beruhigt oder scheitert", () => {
    const w = welt();
    weltZustand(w).GRC!.konflikt = 75;
    const ev = oeffne(w, "land_provokation", new Rng(5), { provinzen: [], staerke: 1, daten: { land: "GRC" } })!;
    const konflikt0 = weltZustand(w).GRC!.konflikt;
    const r = entscheide(w, ev.id, "dulden", new Rng(7));
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(100);
    expect(weltZustand(w).GRC!.konflikt).toBeGreaterThan(konflikt0);

    const w2 = welt();
    weltZustand(w2).GRC!.konflikt = 75;
    const ev2 = oeffne(w2, "land_provokation", new Rng(5), { provinzen: [], staerke: 1, daten: { land: "GRC" } })!;
    const r2 = entscheide(w2, ev2.id, "kontern", new Rng(7));
    expect(r2.ok).toBe(true);
    expect(weltZustand(w2).GRC!.konflikt).toBeGreaterThan(75);

    const w3 = welt();
    weltZustand(w3).GRC!.konflikt = 75;
    const ev3 = oeffne(w3, "land_provokation", new Rng(5), { provinzen: [], staerke: 1, daten: { land: "GRC" } })!;
    const r3 = entscheide(w3, ev3.id, "vermittlung", new Rng(7));
    expect(r3.ok).toBe(true);
    expect(weltZustand(w3).GRC!.konflikt).not.toBe(75);
  });

  test("Drohkulisse: standhalten bleibt an der Kriegsschwelle und hebt den Konfliktvorgang", () => {
    const w = welt();
    weltZustand(w).GRC!.konflikt = 90;
    // Das Kriegsmodul (MIL-1) hat mit dem Land bereits eine Spannung angelegt
    kriegMonat(w, new Rng(3));
    const vorgang = kriegMit(w, "GRC");
    expect(vorgang).toBeDefined();
    expect(vorgang!.phase).toBe("spannung");

    const ev = oeffne(w, "land_drohkulisse", new Rng(5), { provinzen: [], staerke: 1, daten: { land: "GRC" } })!;
    const r = entscheide(w, ev.id, "standhalten", new Rng(7));
    expect(r.ok).toBe(true);
    expect(weltZustand(w).GRC!.konflikt).toBeGreaterThan(90);
    // Die Übergabe hebt die Spannung auf Drohkulisse-Niveau; der Tagestick des Kriegsmoduls vollzieht den Phasenwechsel
    expect(vorgang!.eskalation).toBeGreaterThanOrEqual(KRIEG.drohkulisseAb);
    kriegTag(w, new Rng(11));
    expect(vorgang!.phase).toBe("drohkulisse");
    expect(w.log.some((l) => l.text.includes("Kriegsschwelle"))).toBe(true);
    // Ein automatischer Krieg beginnt dadurch nicht
    expect(vorgang!.phase).not.toBe("krieg");
    expect(w.spiel!.ende).toBeUndefined();

    // Nachgeben entspannt die Lage spürbar und kostet Gesicht
    const w2 = welt();
    weltZustand(w2).GRC!.konflikt = 90;
    const ev2 = oeffne(w2, "land_drohkulisse", new Rng(5), { provinzen: [], staerke: 1, daten: { land: "GRC" } })!;
    const r2 = entscheide(w2, ev2.id, "nachgeben", new Rng(7));
    expect(r2.ok).toBe(true);
    expect(weltZustand(w2).GRC!.konflikt).toBeLessThanOrEqual(80);

    // Verfristen: die Standardfolge treibt Konflikt und Belastung
    const w3 = welt();
    weltZustand(w3).GRC!.konflikt = 90;
    const ev3 = oeffne(w3, "land_drohkulisse", new Rng(5), { provinzen: [], staerke: 1, daten: { land: "GRC" } })!;
    const belastung0 = verfassungVon(w3).belastung;
    const ausgang = vorlage("land_drohkulisse").standard(w3, ev3, new Rng(7));
    expect(ausgang.length).toBeGreaterThan(10);
    expect(weltZustand(w3).GRC!.konflikt).toBeGreaterThan(90);
    expect(verfassungVon(w3).belastung).toBeGreaterThan(belastung0);
  });

  test("Jede Initiative hat eine kostenlose Antwort und landet in der Chronik", () => {
    const w = welt();
    weltZustand(w).GRC!.konflikt = 95;
    ersteInitiative(w);
    const ev = offeneInitiative(w)!;
    expect(antworten(w, ev).some((o) => o.pk === 0)).toBe(true);
    entscheide(w, ev.id, antworten(w, ev).find((o) => o.pk === 0)!.id, new Rng(7));
    expect(w.spiel!.chronik.some((c) => c.titel.length > 3)).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe("Determinismus und Migration", () => {
  test("Gleicher Seed, gleiche Eigeninitiative im Wettbewerb", () => {
    const lauf = () => {
      const w = welt(6);
      weltZustand(w).GRC!.konflikt = 92;
      weltZustand(w).AZE!.versatz = 60;
      auslaufenderVertrag(w, "SYR", 200);
      const rng = new Rng(42);
      const spur: string[] = [];
      for (let m = 0; m < 12; m++) {
        ereignisMonat(w, rng);
        const ev = offeneInitiative(w);
        spur.push(ev ? `${ev.vorlage}:${String(ev.daten?.land)}` : "-");
        if (ev) entscheide(w, ev.id, antworten(w, ev).find((o) => o.pk === 0)!.id, new Rng(1));
        w.spiel!.ereignisse = [];
        w.day += 30;
      }
      return spur.join("|");
    };
    expect(lauf()).toBe(lauf());
  });

  test("Alter Spielstand ohne die neuen Felder läuft weiter", () => {
    const w = createWorld(turkey2026, 9);
    startAfterElection(w, schnellProfil());
    advance(w, 220);
    // So sieht ein Spielstand von vor der Eigeninitiative aus: keine Initiative-Felder an den Ländern
    for (const z of Object.values(w.spiel!.welt ?? {})) {
      delete z.initiativeZuletzt;
      delete z.rotBedroht;
    }
    const geladen = load(JSON.stringify(w));
    expect(() => initiativeKandidaten(geladen)).not.toThrow();
    // Der Wettbewerb arbeitet auf dem geladenen Stand und begründet die Felder neu;
    // noch offene Vorgänge aus der Zeit vor dem Speichern zählen nicht als neue Initiative
    geladen.spiel!.ereignisse = [];
    ersteInitiative(geladen);
    const ev = offeneInitiative(geladen)!;
    expect(weltZustand(geladen)[String(ev.daten?.land)]!.initiativeZuletzt).toBe(geladen.day);
  });
});
