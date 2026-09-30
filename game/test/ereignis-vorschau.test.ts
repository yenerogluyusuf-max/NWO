// Ereignisse: Was eine Antwort bewirkt, ohne sie auszuführen, und der direkte Weg zur Ursache.

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { ansicht, oeffne, entscheide } from "../src/sim/ereignisse";
import { bringeEin } from "../src/sim/handeln";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { Rng } from "../src/sim/rng";

function neu() {
  const w = createWorld(turkey2026, 4);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 60;
  return w;
}

describe("Wirkungsvorschau", () => {
  test("Jede Antwort zeigt, was sie bewirkt; die Welt bleibt unverändert", () => {
    const w = neu();
    const ev = oeffne(w, "mindestlohn", new Rng(1))!;
    const vorherKapital = w.spiel!.kapital;
    const vorherZiele = JSON.stringify(w.net.targets);
    const vorherSchulden = w.economy.debtRatio;
    const a = ansicht(w, ev);
    expect(a.optionen.length).toBeGreaterThanOrEqual(2);
    const kraeftig = a.optionen.find((o) => o.id === "kraeftig")!;
    expect(kraeftig.vorschau.some((z) => /Mindestlohn: Stufe/.test(z))).toBe(true);
    expect(kraeftig.vorschau.some((z) => /Beschäftigte/.test(z))).toBe(true);
    expect(w.spiel!.kapital).toBe(vorherKapital);
    expect(JSON.stringify(w.net.targets)).toBe(vorherZiele);
    expect(w.economy.debtRatio).toBe(vorherSchulden);
    expect(w.spiel!.ereignisse).toHaveLength(1);
  });

  test("Die Vorschau stimmt mit der echten Wirkung überein", () => {
    const w = neu();
    const ev = oeffne(w, "mindestlohn", new Rng(1))!;
    const vorschau = ansicht(w, ev).optionen.find((o) => o.id === "kraeftig")!.vorschau;
    const zeile = vorschau.find((z) => z.startsWith("Mindestlohn: Stufe"))!;
    const ziel = Number(zeile.match(/auf (\d+)/)![1]);
    entscheide(w, ev.id, "kraeftig", new Rng(2));
    expect(w.net.targets.m_mindestlohn).toBe(ziel);
  });
});

describe("Direkt an der Ursache ansetzen", () => {
  test("Zu jedem Ereignis nennt die Ansicht die Maßnahmen, die die Ursache regeln", () => {
    const w = neu();
    const ev = oeffne(w, "mindestlohn", new Rng(1))!;
    expect(ansicht(w, ev).massnahmen.map((m) => m.id)).toEqual(["m_mindestlohn"]);
    for (const m of ansicht(w, ev).massnahmen) expect(NET.index.has(m.id)).toBe(true);
  });

  test("Wer die Maßnahme selbst einbringt, nimmt das Ereignis in die Hand: keine Standardfolge", () => {
    const w = neu();
    const ev = oeffne(w, "mindestlohn", new Rng(1))!;
    const r = bringeEin(w, "m_mindestlohn", Math.round(nationalAverage(NET, w.net, "m_mindestlohn")) + 10, null, "gesetz");
    expect(r.ok).toBe(true);
    expect(w.spiel!.ereignisse.some((e) => e.id === ev.id)).toBe(false);
    expect(w.spiel!.chronik.some((c) => c.titel === "Der Mindestlohn für das neue Jahr" && /Selbst an der Ursache/.test(c.ausgang))).toBe(true);
  });
});
