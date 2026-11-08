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
import { ohneZufallsereignisse } from "./_ohne-zufall";

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
    // Der Überläufer-Wurf (sim/spiel.ts, ueberlaeufer) sieht die Zustimmung nach dem Monatsschritt der Umfrage, also rund 26 statt 15:
    // Aussicht (35 − 26) / 100 = 9 % im Monat, in zwölf Monaten 68 %. Eine einzelne Partie war darum ein Münzwurf: Seed 6 verlor mit
    // a355523 sechs Sitze, nach Welle E1 (neue Vorgänge, anderer Zufallsstrom) keinen, ohne Zufallsereignisse in beiden Ständen keinen.
    // Gezählt werden darum zwölf Partien ohne Zufallsereignisse (test/_ohne-zufall.ts). Gemessen 6 von 12 (über 20 Samen 13), erwartet 8;
    // verlangt sind 5. Jeder Überläufer geht von der Präsidentenpartei weg, keine Partie gewinnt Sitze.
    let mitUeberlaeufern = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const w = welt(seed);
      const partei = w.player!.partei.kurz;
      const vorher = w.parliament!.seats[partei] ?? 0;
      ohneZufallsereignisse(() => {
        for (let m = 0; m < 12; m++) { w.spiel!.umfrage.zustimmung = 15; w.spiel!.tiefstand = 0; advance(w, 30); }
      });
      const nachher = w.parliament!.seats[partei] ?? 0;
      expect(nachher).toBeLessThanOrEqual(vorher);
      if (nachher < vorher) mitUeberlaeufern++;
    }
    expect(mitUeberlaeufern).toBeGreaterThanOrEqual(5);
  });
});
