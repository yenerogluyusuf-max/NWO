// INN-2 (Democracy-4-Muster): Maßnahmen laufen sichtbar über ihre Umsetzungsdauer an.
// Geprüft werden: der monatliche Lauf des Umsetzungsstands, die Dämpfung der ausgehenden
// Kanten (Faktor umsetzung/100, kombiniert mit der Kanten-Verzögerung), die Dämpfung bei
// Feinjustierung statt Reset, die Migration alter Stände (= 100), die Dauer in Parser-
// Antworten und der Determinismus des Ganzen.

import { describe, expect, test } from "vitest";
import { buildModel, createNet, nationalAverage, stepNet, type NetState } from "../src/sim/netz";
import { advance, createWorld, load, save, setPolicy } from "../src/sim/world";
import { NET } from "../src/sim/modell";
import { turkey2026 } from "../src/sim/scenario";
import { befehl } from "../src/sim/befehle";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { bereichStand } from "../src/ui/politik/bereiche";
import { restMonate, starteUmsetzung, umsetzungsStand, wirkungsFaktor } from "../src/sim/umsetzung";
import type { EdgeSpec, NodeSpec } from "../src/data/politiknetz";
import type { World } from "../src/sim/types";

/** Lässt die Welt laufen, bis das Politiknetz n Monatsschritte gemacht hat. */
function monateLaufen(w: World, n: number): void {
  const ziel = w.net.month + n;
  while (w.net.month < ziel) advance(w, 1);
}

// Ein Mininetz: eine Maßnahme mit Umsetzungsdauer (4 Monate), eine Zielgröße, eine Kante.
// Mit `vorgeschichte = true` liegt die Maßnahme schon länger auf 90 (Historie synchron),
// sonst ist sie gerade erst auf 90 gesprungen (Historie noch 50) — für Verzögerungstests.
function miniNetz(gewicht: number, lag: number, vorgeschichte = true): { model: ReturnType<typeof buildModel>; net: NetState } {
  const nodes: NodeSpec[] = [
    { id: "m_test", name: "Testmaßnahme", theme: "wirtschaft", kind: "massnahme", text: "Platzhalter für die Prüfung.", start: 50, decay: 0, months: 4 },
    { id: "zielgroesse", name: "Zielgröße", theme: "wirtschaft", kind: "groesse", text: "Platzhalter für die Prüfung.", start: 50, decay: 0 },
  ];
  const edges: EdgeSpec[] = [{ from: "m_test", to: "zielgroesse", weight: gewicht, lag, why: "Testwirkung mit ausreichend langer Begründung." }];
  const model = buildModel(nodes, edges);
  const w = createWorld(turkey2026, 1);
  const net = createNet(model, w.economy);
  // Die Maßnahme steht voll auf 90 (Abweichung +40)
  const i = model.index.get("m_test")!;
  for (let p = 0; p < 81; p++) net.values[i * 81 + p] = 90;
  if (vorgeschichte) net.history = net.history.map(() => net.values.slice());
  return { model, net };
}

describe("Umsetzungsstand läuft monatlich", () => {
  test("startet beim Beschluss bei 0 und nähert sich linear der 100", () => {
    const dauer = NET.nodes.find((n) => n.id === "m_exportfoerderung")!.months!;
    const w = createWorld(turkey2026, 5);
    setPolicy(w, "m_exportfoerderung", 80);
    expect(umsetzungsStand(w.net, "m_exportfoerderung")).toBe(0);
    expect(restMonate(w.net, "m_exportfoerderung")).toBe(dauer);

    monateLaufen(w, 1);
    expect(umsetzungsStand(w.net, "m_exportfoerderung")).toBeCloseTo(100 / dauer, 6);
    monateLaufen(w, dauer - 2);
    expect(umsetzungsStand(w.net, "m_exportfoerderung")).toBeCloseTo(((dauer - 1) * 100) / dauer, 6);
    expect(restMonate(w.net, "m_exportfoerderung")).toBe(1);

    // Nach der vollen Umsetzungsdauer: Eintrag aufgeräumt, Faktor wieder 1
    monateLaufen(w, 1);
    expect(umsetzungsStand(w.net, "m_exportfoerderung")).toBe(100);
    expect(w.net.umsetzung!["m_exportfoerderung"]).toBeUndefined();
    expect(wirkungsFaktor(w.net, "m_exportfoerderung")).toBe(1);
    expect(restMonate(w.net, "m_exportfoerderung")).toBeNull();
  });

  test("erscheint als Balken in den Bereichsdaten der Oberfläche", () => {
    const dauer = NET.nodes.find((n) => n.id === "m_krankenhausbau")!.months!;
    const w = createWorld(turkey2026, 5);
    setPolicy(w, "m_krankenhausbau", 80);
    const zeile = bereichStand(w, "gesundheit").massnahmen.find((m) => m.id === "m_krankenhausbau")!;
    expect(zeile.umsetzung?.stand).toBe(0);
    expect(zeile.umsetzung!.rest).toBeGreaterThan(0);
    monateLaufen(w, dauer);
    expect(bereichStand(w, "gesundheit").massnahmen.find((m) => m.id === "m_krankenhausbau")!.umsetzung).toBeUndefined();
  });
});

describe("Wirkung skaliert mit dem Umsetzungsstand", () => {
  test("voller Stand wirkt voll, halber Stand halb, null wirkt nicht", () => {
    for (const [stand, erwartet] of [
      [undefined, 70], // kein Eintrag: Faktor 1 → 50 + 0,5 × 40
      [100, 70],
      [50, 60],
      [0, 50],
    ] as const) {
      const { model, net } = miniNetz(0.5, 0);
      if (stand !== undefined) net.umsetzung = { m_test: stand };
      stepNet(model, net, createWorld(turkey2026, 1).economy);
      expect(nationalAverage(model, net, "zielgroesse"), `Stand ${stand}`).toBeCloseTo(erwartet, 6);
    }
  });

  test("kombiniert mit der Kanten-Verzögerung: beide wirken", () => {
    // Verzögerung 2 Monate und Umsetzungsstand 50: drei Monate lang nichts, dann die halbe Wirkung
    const { model, net } = miniNetz(0.5, 2, false);
    net.umsetzung = { m_test: 50 };
    const e = createWorld(turkey2026, 1).economy;
    stepNet(model, net, e);
    stepNet(model, net, e);
    stepNet(model, net, e);
    expect(nationalAverage(model, net, "zielgroesse")).toBeCloseTo(50, 6);
    stepNet(model, net, e);
    expect(nationalAverage(model, net, "zielgroesse")).toBeCloseTo(60, 6);
  });

  test("Maßnahme ohne Umsetzungsdauer bekommt keinen Eintrag und wirkt sofort", () => {
    const nodes: NodeSpec[] = [{ id: "m_sofort", name: "Sofortmaßnahme", theme: "wirtschaft", kind: "massnahme", text: "Platzhalter.", start: 50, decay: 0 }];
    const model = buildModel(nodes, []);
    const net = createNet(model, createWorld(turkey2026, 1).economy);
    starteUmsetzung(model, net, "m_sofort", 30, 1);
    expect(net.umsetzung?.["m_sofort"]).toBeUndefined();
    expect(wirkungsFaktor(net, "m_sofort")).toBe(1);
  });
});

describe("Änderung dämpft statt zu resetten", () => {
  test("Regel: eine Stufe kostet 25 Punkte, mehr beginnt bei 0", () => {
    const w = createWorld(turkey2026, 5);
    setPolicy(w, "m_exportfoerderung", 80);
    expect(umsetzungsStand(w.net, "m_exportfoerderung")).toBe(0);
    starteUmsetzung(NET, w.net, "m_exportfoerderung", 1, 6); // Feinjustierung aus dem Reset heraus
    expect(umsetzungsStand(w.net, "m_exportfoerderung")).toBe(0); // unter 0 geht nicht
    starteUmsetzung(NET, w.net, "m_exportfoerderung", -1, 6);
    w.net.umsetzung!["m_exportfoerderung"] = 100;
    starteUmsetzung(NET, w.net, "m_exportfoerderung", 1, 6);
    expect(umsetzungsStand(w.net, "m_exportfoerderung")).toBe(75);
    starteUmsetzung(NET, w.net, "m_exportfoerderung", -20, 6);
    expect(umsetzungsStand(w.net, "m_exportfoerderung")).toBe(0);
  });

  test("im Spiel: Feinjustierung nach voller Umsetzung dämpft auf 75", () => {
    const dauer = NET.nodes.find((n) => n.id === "m_exportfoerderung")!.months!;
    const w = createWorld(turkey2026, 5);
    setPolicy(w, "m_exportfoerderung", 80);
    monateLaufen(w, dauer);
    expect(umsetzungsStand(w.net, "m_exportfoerderung")).toBe(100);
    // |Δ| ≤ 1 gegenüber dem aktuellen Stand: dämpfen statt resetten
    const jetzt = nationalAverage(NET, w.net, "m_exportfoerderung");
    setPolicy(w, "m_exportfoerderung", Math.round(jetzt));
    expect(umsetzungsStand(w.net, "m_exportfoerderung")).toBe(75);
    // Größere Änderung: Neustart der Umsetzung
    setPolicy(w, "m_exportfoerderung", 20);
    expect(umsetzungsStand(w.net, "m_exportfoerderung")).toBe(0);
  });
});

describe("Migration und Robustheit", () => {
  test("alter Spielstand ohne Umsetzungsstand gilt als voll umgesetzt (= 100)", () => {
    const w = createWorld(turkey2026, 9);
    setPolicy(w, "m_exportfoerderung", 80);
    advance(w, 40);
    const roh = JSON.parse(save(w)) as { net: Record<string, unknown> };
    delete roh.net["umsetzung"];
    delete roh.net["umsetzungTempo"];
    const geladen = load(JSON.stringify(roh));
    // Bestehende Maßnahmen: Stand 100, Faktor 1 — genau wie vor der Erweiterung
    expect(umsetzungsStand(geladen.net, "m_exportfoerderung")).toBe(100);
    expect(wirkungsFaktor(geladen.net, "m_exportfoerderung")).toBe(1);
    expect(geladen.net.umsetzung ?? {}).toEqual({});
    // und der Stand spielt normal weiter
    advance(geladen, 60);
    expect(Number.isFinite(nationalAverage(NET, geladen.net, "m_exportfoerderung"))).toBe(true);
  });

  test("beschädigte Einträge werden beim Laden repariert", () => {
    const w = createWorld(turkey2026, 9);
    setPolicy(w, "m_exportfoerderung", 80);
    const roh = JSON.parse(save(w)) as { net: { umsetzung: Record<string, number>; umsetzungTempo: Record<string, number> } };
    roh.net.umsetzung["m_exportfoerderung"] = null as unknown as number; // so legt JSON ein NaN ab
    roh.net.umsetzung["m_unbekannt"] = 40;
    const geladen = load(JSON.stringify(roh));
    expect(geladen.net.umsetzung!["m_exportfoerderung"]).toBeUndefined();
    expect(geladen.net.umsetzung!["m_unbekannt"]).toBeUndefined();
    expect(wirkungsFaktor(geladen.net, "m_exportfoerderung")).toBe(1);
  });
});

describe("Antworten nennen die Umsetzungsdauer", () => {
  test("Parser: „beschlossen, Umsetzung läuft über N Monate“", () => {
    const w = createWorld(turkey2026, 7);
    startAfterElection(w, schnellProfil());
    const node = NET.nodes.find((n) => n.id === "m_exportfoerderung")!;
    const r = befehl(`Erhoehe ${node.name}`, w);
    expect(r.ok, r.text).toBe(true);
    expect(r.text).toMatch(/Umsetzung über etwa \d+ Monate/);
  });

  test("Direktbeschluss protokolliert die Dauer", () => {
    const dauer = NET.nodes.find((n) => n.id === "m_schulbau")!.months!;
    const w = createWorld(turkey2026, 7);
    setPolicy(w, "m_schulbau", 90);
    const l = w.log[w.log.length - 1]!;
    expect(l.why).toContain(`Umsetzung läuft über etwa ${dauer} Monate`);
  });
});

describe("Determinismus", () => {
  test("gleicher Samen, gleicher Umsetzungsverlauf", () => {
    const a = createWorld(turkey2026, 42);
    const b = createWorld(turkey2026, 42);
    setPolicy(a, "m_exportfoerderung", 85);
    setPolicy(b, "m_exportfoerderung", 85);
    setPolicy(a, "m_schulbau", 70);
    setPolicy(b, "m_schulbau", 70);
    advance(a, 200);
    advance(b, 200);
    expect(JSON.stringify(a.net)).toBe(JSON.stringify(b.net));
  });
});
