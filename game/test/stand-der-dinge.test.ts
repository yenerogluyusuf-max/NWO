// „Stand der Dinge“: Sitzungs-Snapshot in speicher.ts (schreiben/lesen, Rückwärtskompatibilität)
// und das Re-Entry-Blatt (standderdinge.ts), vor allem die Deltas seit der letzten Sitzung.

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { ladeSpielstand, speichere, sitzungBegonnen, snapshotVon, vorsitzungSnapshot } from "../src/ui/speicher";
import { standDerDinge } from "../src/ui/standderdinge";
import type { World } from "../src/sim/types";

class SpeicherStub {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}

function neu(): World {
  const w = createWorld(turkey2026, 6);
  startAfterElection(w, schnellProfil());
  return w;
}

beforeEach(() => vi.stubGlobal("localStorage", new SpeicherStub()));
afterEach(() => vi.unstubAllGlobals());

describe("Sitzungs-Snapshot", () => {
  test("speichern schreibt den Snapshot, lesen gibt ihn wieder", () => {
    const w = neu();
    expect(speichere(w)).toBe(true);
    const s = vorsitzungSnapshot();
    expect(s).not.toBeNull();
    expect(s!.zustimmung).toBeCloseTo(w.spiel!.umfrage.zustimmung, 6);
    expect(s!.inflation).toBeCloseTo(w.published.inflation.value, 6);
    expect(s!.kapital).toBeCloseTo(w.spiel!.kapital, 6);
    expect(s!.datum).toBe(w.date);
  });

  test("Autospeichern führt die Vergleichsbasis weiter, sitzungBegonnen setzt sie neu", () => {
    const w = neu();
    speichere(w);
    const basis = vorsitzungSnapshot()!;
    advance(w, 45);
    w.spiel!.kapital = 99;
    speichere(w);
    // Autospeichern hat die Basis nicht angerührt
    expect(vorsitzungSnapshot()!.zustimmung).toBeCloseTo(basis.zustimmung, 6);
    expect(vorsitzungSnapshot()!.kapital).toBeCloseTo(basis.kapital, 6);
    // Neue Sitzung: der jetzige Stand wird zur Basis
    sitzungBegonnen(w);
    expect(vorsitzungSnapshot()!.kapital).toBeCloseTo(99, 6);
    // … und die Welt bleibt ladbar
    expect(ladeSpielstand()!.day).toBe(w.day);
  });

  test("alter Spielstand ohne Snapshot: keine Vergleichsdaten, nichts bricht, die Basis entsteht beim nächsten Speichern", () => {
    const w = neu();
    const alt = { version: 1, gespeichert: new Date().toISOString(), welt: JSON.parse(JSON.stringify(w)) };
    localStorage.setItem("staatsraeson-spielstand-v1", JSON.stringify(alt));
    expect(vorsitzungSnapshot()).toBeNull();
    const stand = standDerDinge(w, vorsitzungSnapshot());
    expect(stand.deltas).toBeNull();
    expect(stand.vergleichDatum).toBeNull();
    speichere(w);
    expect(vorsitzungSnapshot()).not.toBeNull();
  });
});

describe("Re-Entry-Blatt", () => {
  test("Deltas rechnen gegen den Snapshot: Zustimmung, Inflation, Kapital", () => {
    const w = neu();
    w.spiel!.umfrage.zustimmung = 46;
    w.published.inflation.value = 33.5;
    w.spiel!.kapital = 22;
    const stand = standDerDinge(w, { tag: 0, datum: "2026-09-25", zustimmung: 40, inflation: 30, kapital: 10 });
    const d = Object.fromEntries(stand.deltas!.map((x) => [x.id, x]));
    expect(d.zustimmung!.delta).toBeCloseTo(6, 6);
    expect(d.zustimmung!.gutWennAuf).toBe(true);
    expect(d.inflation!.delta).toBeCloseTo(3.5, 6);
    expect(d.inflation!.gutWennAuf).toBe(false);
    expect(d.kapital!.delta).toBeCloseTo(12, 6);
    expect(stand.vergleichDatum).toBeTruthy();
  });

  test("Blatt füllt alle Zeilen aus dem Zustand: Datum, Vorgänge (≤3), Probleme (≤3), Agenda, Frist", () => {
    const w = neu();
    advance(w, 40);
    const stand = standDerDinge(w, snapshotVon(w));
    expect(stand.datum).toBeTruthy();
    expect(stand.amtszeit).toBe(1);
    expect(stand.vorgaenge.length).toBeLessThanOrEqual(3);
    for (const v of stand.vorgaenge) expect(v.rest).toBeTruthy();
    expect(stand.probleme.length).toBeLessThanOrEqual(3);
    for (const p of stand.probleme) expect(["rot", "gelb"]).toContain(p.stufe);
    // Die Agenda zeigt den nächsten festen Termin des Staatsjahres (Kalender oder Wahl)
    expect(stand.agenda).toBeTruthy();
    expect(stand.agenda).toMatch(/Haushalt|Mindestlohn|Kommunalwahl|Wahl/);
    // Frische Partie: die drei Startvorgänge haben Fristen
    expect(stand.frist).not.toBeNull();
    expect(stand.frist!.tage).toBeGreaterThanOrEqual(0);
  });
});
