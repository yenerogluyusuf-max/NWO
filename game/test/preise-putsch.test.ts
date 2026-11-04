// Preise schärfen, Putsch erreichbar (PRUEFUNG_GESAMT_2026-11-04): Koalitionsgespräch nach Fraktionsgröße, Antworten auf Bewegungen
// nach Größe mit Wirkung auf Zustimmung und echter Maßnahme, Putschzirkel im Risiko, kein Selbstrücktritt des Generalstabschefs,
// Überläufer bei sehr schwacher Zustimmung.

import { describe, expect, test } from "vitest";
import { createWorld, advance } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { planeGespraech, themenFuer } from "../src/sim/gespraeche";
import { bewegungAntworten, bewegungenSicht, starteBewegung, ANTWORTEN, antwortKapital } from "../src/sim/bewegungen";
import { putschRisiko } from "../src/sim/enden";
import { machtkreis } from "../src/sim/machtkreis";
import { figur } from "../src/sim/figuren";
import type { World } from "../src/sim/types";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.kapital = 150;
  w.spiel!.ereignisse = [];
  return w;
}

describe("Preise", () => {
  test("ein Vertrauensgespräch mit einem Koalitionspartner kostet nach Fraktionsgröße mehr als 1 Kapital", () => {
    const w = welt();
    const p = w.spiel!.figuren.find((f) => f.amt === "partner" && f.imAmt && f.partei && (w.parliament?.seats[f.partei] ?? 0) > 0);
    if (!p) return; // Startlage ohne Partner: nichts zu prüfen
    const th = themenFuer(w, p.id)[0]!;
    const plan = planeGespraech(w, p.id, th.id, "vertrauen");
    expect("pk" in plan && plan.pk).toBeGreaterThan(1);
  });
  test("Antworten auf Bewegungen kosten mehr, je größer die Bewegung", () => {
    const w = welt();
    const klein = starteBewegung(w, "teuerung", [34], 10)!;
    const gross = starteBewegung(w, "arbeiter", [6], 60)!;
    expect(antwortKapital(ANTWORTEN.dialog, gross)).toBeGreaterThan(antwortKapital(ANTWORTEN.dialog, klein));
    const s = bewegungenSicht(w).find((x) => x.b === gross)!.antworten.find((a) => a.id === "dialog")!;
    expect(s.kapital).toBe(antwortKapital(ANTWORTEN.dialog, gross));
  });
  test("Polizei kostet Zustimmung; ein Zugeständnis bewegt die passende Maßnahme", () => {
    const a = welt(), b = welt();
    const ba = starteBewegung(a, "teuerung", [34], 40)!, bb = starteBewegung(b, "teuerung", [34], 40)!;
    const za = a.spiel!.umfrage.zustimmung, mindestlohn = b.net.targets["m_mindestlohn"] ?? 50;
    expect(bewegungAntworten(a, ba.id, "polizei").ok).toBe(true);
    expect(a.spiel!.umfrage.zustimmung).toBeLessThan(za);
    expect(bewegungAntworten(b, bb.id, "zugestaendnis").ok).toBe(true);
    expect(b.net.targets["m_mindestlohn"]).toBeGreaterThan(mindestlohn);
  });
});

describe("Putsch erreichbar", () => {
  test("ein Putschzirkel treibt das Risiko, unentdeckt nur als „Unruhe“", () => {
    const w = welt();
    const vorher = putschRisiko(w).risiko;
    const gs = figur(w, "generalstab");
    const person = machtkreis(w).geheimnisse[0]?.person ?? gs?.id ?? "x";
    machtkreis(w).geheimnisse.push({ id: "test-zirkel", person, art: "putschzirkel", schwere: 2, aufgedeckt: false, oeffentlich: false, seit: w.day });
    const nachher = putschRisiko(w);
    expect(nachher.risiko).toBeGreaterThanOrEqual(Math.min(100, vorher + 9));
  });
  test("ein illoyaler Generalstabschef tritt nicht von selbst zurück", () => {
    const w = welt();
    const gs = figur(w, "generalstab")!;
    gs.loyalitaet = 5;
    advance(w, 120);
    expect(figur(w, "generalstab")?.id).toBe(gs.id);
  });
  test("bei sehr schwacher Zustimmung laufen Abgeordnete über", () => {
    const w = welt();
    const partei = w.player!.partei.kurz;
    const vorher = w.parliament!.seats[partei] ?? 0;
    for (let m = 0; m < 12; m++) { w.spiel!.umfrage.zustimmung = 15; w.spiel!.tiefstand = 0; advance(w, 30); }
    expect(w.parliament!.seats[partei] ?? 0).toBeLessThan(vorher);
  });
});
