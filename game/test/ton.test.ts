// Ton-Modul: Der Schalter hält den Zustand im Speicher (Stub nach dem Muster von speicher.test.ts),
// alle Klänge werfen ohne AudioContext (Tests) nichts, die Beschriftung kommt aus dem Katalog (kein Rohschlüssel).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { spieleMeldungsTon, tonLabel, tonStatus, tonUm } from "../src/ui/ton/ton";
import { setzeSprache } from "../src/i18n";

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

beforeEach(() => {
  vi.stubGlobal("localStorage", new SpeicherStub());
});

afterEach(() => {
  vi.unstubAllGlobals();
  void setzeSprache("de");
});

describe("Ton", () => {
  it("schaltet um und hält den Zustand im Speicher", () => {
    const vorher = tonStatus();
    const nachher = tonUm();
    expect(nachher).toBe(!vorher);
    expect(tonStatus()).toBe(nachher);
    tonUm();
    expect(tonStatus()).toBe(vorher);
  });

  it("spielt alle vier Meldungsklänge ohne AudioContext fehlerfrei", () => {
    for (const art of ["markt", "bank", "parlament", "ereignis"] as const) {
      expect(() => spieleMeldungsTon(art)).not.toThrow();
    }
  });

  it("spielt auch mit ausgeschaltetem Ton nichts und wirft nichts", () => {
    if (tonStatus()) tonUm();
    expect(tonStatus()).toBe(false);
    expect(() => spieleMeldungsTon("ereignis")).not.toThrow();
  });

  it("beschriftet den Schalter aus dem Katalog", () => {
    expect(tonLabel()).toMatch(/Ton:/);
  });
});
