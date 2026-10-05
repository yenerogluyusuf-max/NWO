// Bewegungssprache: Kurven, Dauern, Zeitgeber, Farben und Effektstufe (ohne Browser).

import { describe, expect, it } from "vitest";
import {
  DAUER, KURVEN, Takt, Tween, abonniereEffekte, atmen, dauerFaktor, effektstufe, erschuetterung, federAus, flugBogen, flugDauer, leerlaufBilder,
  mischeFarbe, mitDeckkraft, nachfeder, naechsteStufe, naehere, parseFarbe, sanftInOut, setzeEffektstufe, staffel, weichAus, zierBewegung,
} from "../src/ui/anim";

describe("Kurven", () => {
  it("starten bei 0 und enden bei 1", () => {
    for (const [name, k] of Object.entries(KURVEN)) {
      expect(k(0), name).toBeCloseTo(0, 5);
      expect(k(1), name).toBeCloseTo(1, 5);
    }
  });
  it("sind monoton, wo sie es sein sollen", () => {
    let letzter = -1;
    for (let i = 0; i <= 20; i++) {
      const v = sanftInOut(i / 20);
      expect(v).toBeGreaterThanOrEqual(letzter);
      letzter = v;
    }
    expect(weichAus(0.5)).toBeGreaterThan(0.5);
  });
  it("Feder schwingt über das Ziel und kehrt zurück", () => {
    const werte = Array.from({ length: 21 }, (_, i) => federAus(i / 20));
    expect(Math.max(...werte)).toBeGreaterThan(1.02);
    expect(werte[20]).toBeCloseTo(1, 5);
    expect(nachfeder(1)).toBeCloseTo(1, 2);
  });
  it("Atmen pendelt zwischen 0 und 1, Erschütterung klingt ab", () => {
    expect(atmen(0, 2000)).toBeCloseTo(0, 5);
    expect(atmen(1000, 2000)).toBeCloseTo(1, 5);
    const frueh = Math.max(...Array.from({ length: 40 }, (_, i) => Math.abs(erschuetterung(i * 5, 800))));
    const spaet = Math.max(...Array.from({ length: 20 }, (_, i) => Math.abs(erschuetterung(700 + i * 5, 800))));
    expect(frueh).toBeGreaterThan(spaet);
    expect(erschuetterung(800, 800)).toBe(0);
  });
});

describe("Dauern", () => {
  it("Staffelung bleibt unter der Obergrenze", () => {
    expect(staffel(0, 10)).toBe(0);
    expect(staffel(9, 10)).toBeLessThanOrEqual(240);
    expect(staffel(3, 1)).toBe(0);
  });
  it("Flugdauer wächst mit Strecke und Zoom, bleibt in Grenzen", () => {
    expect(flugDauer(0)).toBe(DAUER.flugMin);
    expect(flugDauer(0.3)).toBeGreaterThan(flugDauer(0.01));
    expect(flugDauer(5, 20)).toBe(DAUER.flugMax);
    expect(flugDauer(0.5, 0.2)).toBeGreaterThan(flugDauer(0.5, 1));
  });
  it("Bogen ist bei kurzer Strecke klein und bei weiter größer", () => {
    expect(flugBogen(0)).toBe(1);
    expect(flugBogen(1)).toBeGreaterThan(flugBogen(0.05));
    expect(flugBogen(100)).toBeLessThanOrEqual(1.56);
  });
});

describe("Zeitgeber", () => {
  it("Tween läuft vom Start zum Ziel und endet", () => {
    const t = new Tween({ von: 10, nach: 20, dauerMs: 100, kurve: (x) => x, startMs: 1000 });
    expect(t.wert(1000)).toBe(10);
    expect(t.wert(1050)).toBeCloseTo(15, 5);
    expect(t.fertig(1099)).toBe(false);
    expect(t.fertig(1100)).toBe(true);
    expect(t.wert(5000)).toBe(20);
  });
  it("Tween ohne Dauer springt sofort (Effekte aus)", () => {
    const t = new Tween({ von: 0, nach: 7, dauerMs: 0 });
    expect(t.wert(0)).toBe(7);
    expect(t.fertig(0)).toBe(true);
  });
  it("Takt begrenzt die Bildrate", () => {
    const t = new Takt(30);
    let n = 0;
    for (let ms = 0; ms < 1000; ms += 1000 / 60) if (t.darf(ms)) n++;
    expect(n).toBeGreaterThanOrEqual(28);
    expect(n).toBeLessThanOrEqual(31);
    expect(new Takt(0).darf(0)).toBe(false);
    expect(new Takt(Infinity).darf(0)).toBe(true);
  });
  it("Annäherung ist bildratenunabhängig", () => {
    // 16 ms in einem Schritt entspricht zwei Schritten zu 8 ms
    const a = naehere(0, 1, 16, 100);
    const b = naehere(naehere(0, 1, 8, 100), 1, 8, 100);
    expect(a).toBeCloseTo(b, 6);
    expect(naehere(0, 1, 5, 0)).toBe(1);
  });
});

describe("Farben", () => {
  it("liest Hex und rgb", () => {
    expect(parseFarbe("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseFarbe("#8a7a64")).toEqual({ r: 138, g: 122, b: 100, a: 1 });
    expect(parseFarbe("rgba(10, 20, 30, 0.5)")).toEqual({ r: 10, g: 20, b: 30, a: 0.5 });
    expect(parseFarbe("rot")).toBeNull();
  });
  it("mischt und setzt Deckkraft", () => {
    expect(mischeFarbe("#000000", "#ffffff", 0.5)).toBe("rgba(128, 128, 128, 1)");
    expect(mischeFarbe("rgb(0,0,0)", "rgba(100,100,100,0)", 1)).toBe("rgba(100, 100, 100, 0)");
    expect(mischeFarbe("unbekannt", "#fff", 0.2)).toBe("unbekannt");
    expect(mitDeckkraft("rgba(10, 10, 10, 0.5)", 0.5)).toBe("rgba(10, 10, 10, 0.25)");
  });
});

describe("Effektstufe", () => {
  it("wechselt, benachrichtigt und liefert Faktoren", () => {
    let n = 0;
    const ab = abonniereEffekte(() => n++);
    setzeEffektstufe("hoch");
    expect(effektstufe()).toBe("hoch");
    expect(leerlaufBilder()).toBe(30);
    expect(zierBewegung()).toBe(true);
    setzeEffektstufe("mittel");
    expect(leerlaufBilder()).toBe(15);
    expect(zierBewegung()).toBe(false);
    expect(zierBewegung("mittel", true)).toBe(true);
    setzeEffektstufe("aus");
    expect(dauerFaktor()).toBe(0);
    expect(leerlaufBilder()).toBe(0);
    expect(n).toBe(3);
    expect(naechsteStufe("hoch")).toBe("mittel");
    expect(naechsteStufe("aus")).toBe("hoch");
    ab();
    setzeEffektstufe("mittel");
    expect(n).toBe(3);
  });
});
