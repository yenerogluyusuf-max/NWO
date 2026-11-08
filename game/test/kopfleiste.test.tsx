// Kopfleiste in drei Zonen: Wer, Wann, Wie steht es, dazu das Menü. Sprache und Sichern stehen nicht mehr als Dauerknöpfe in der Leiste,
// die Mehrheit erscheint als „348/600“ mit Balken statt als Doppeltext, und alle drei Sprachen haben dieselben Schlüssel.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import de from "../src/i18n/katalog/de/kopf.json";
import tr from "../src/i18n/katalog/tr/kopf.json";
import en from "../src/i18n/katalog/en/kopf.json";
import { platzhalter, setzeSprache } from "../src/i18n";
import { Kopfleiste, MehrheitsBalken, type KopfWert } from "../src/ui/kopf/Kopfleiste";

const KAPUTT = /undefined|NaN|\[object|\$\{|kopf\.[a-z]/;

afterEach(async () => {
  await setzeSprache("de");
});

function leiste(werte: KopfWert[], extra: Partial<Parameters<typeof Kopfleiste>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(Kopfleiste, {
      name: "Hakan Erdem",
      partei: "Partei für Ordnung und Fortschritt",
      parteiFarbe: "#335577",
      amt: "Staatspräsident",
      datum: "3. Oktober 2034",
      tempo: 1,
      onTempo: () => {},
      werte,
      wahlbar: [
        { id: "inflation", name: "Inflation" },
        { id: "lira", name: "Lira je $" },
        { id: "leitzins", name: "Leitzins" },
      ],
      gewaehlt: new Set(["inflation", "lira"]),
      onWertWechsel: () => {},
      sicherStatus: "ruhig",
      sicherGrund: null,
      onSichern: () => {},
      onSpielstaende: () => {},
      ...extra,
    }),
  );
}

const WERTE: KopfWert[] = [
  { id: "zustimmung", icon: "haende", name: "Zustimmung", wert: "65 %", trend: 1.2, steigenGut: true, tip: "x", onKlick: () => {} },
  { id: "kapital", icon: "siegel", name: "Kapital", wert: "10", tip: "x" },
  {
    id: "parlament",
    icon: "parlament",
    name: "Parlament",
    wert: "348",
    zusatz: "/600",
    tip: "x",
    bild: createElement(MehrheitsBalken, { lager: 330, geduldet: 18, gesamt: 600, schwelle: 301 }),
  },
  { id: "inflation", icon: "preis", name: "Inflation", wert: "6,7 %", trend: -0.1, tip: "x" },
];

describe("Kopfleiste", () => {
  it("ordnet in drei Zonen und ein Menü", () => {
    const html = leiste(WERTE);
    const wer = html.indexOf("kf-wer");
    const wann = html.indexOf("kf-wann");
    const wie = html.indexOf("kf-wie");
    const menue = html.indexOf("kf-menue");
    expect(wer).toBeGreaterThan(-1);
    expect(wer).toBeLessThan(wann);
    expect(wann).toBeLessThan(wie);
    expect(wie).toBeLessThan(menue);
    // Die Sprachwahl und der Sichern-Knopf liegen im (geschlossenen) Menü, nicht in der Leiste
    expect(html).not.toContain("sprachwahl");
    expect(html).not.toContain("hud-speichern");
    expect(html).not.toContain("Weitere Werte");
    expect(html).not.toMatch(KAPUTT);
  });

  it("zeigt die Mehrheit als Zahl mit Balken und Schwellenstrich", () => {
    const html = leiste(WERTE);
    expect(html).toContain("348");
    expect(html).toContain("/600");
    expect(html).toContain("kf-mh-schwelle");
    expect(html).not.toContain("Mehrheit steht");
  });

  it("färbt den Trend nach Bedeutung: steigende Zustimmung gut, fallende Inflation gut", () => {
    const html = leiste(WERTE);
    const zust = html.slice(html.indexOf("kf-zustimmung"), html.indexOf("kf-kapital"));
    const infl = html.slice(html.indexOf("kf-inflation"));
    expect(zust).toContain("kf-trend gut");
    expect(infl).toContain("kf-trend gut");
  });

  it("macht klickbare Kennzahlen zu Knöpfen", () => {
    const html = leiste(WERTE);
    const zust = html.slice(html.indexOf("kf-zustimmung") - 60, html.indexOf("kf-zustimmung"));
    expect(zust).toContain("<button");
    const kap = html.slice(html.indexOf("kf-kapital") - 60, html.indexOf("kf-kapital"));
    expect(kap).toContain("<div");
  });

  it("meldet einen Speicherfehler am Menüknopf", () => {
    const html = leiste(WERTE, { sicherStatus: "fehler", sicherGrund: "Speicher voll" });
    expect(html).toContain("kf-menue-knopf fehler");
    expect(html).toContain("kf-menue-punkt");
  });

  for (const s of ["tr", "en"] as const) {
    it(`rendert auf ${s} ohne kaputte Texte`, async () => {
      await setzeSprache(s);
      const html = leiste(WERTE);
      expect(html).not.toMatch(KAPUTT);
    });
  }

  it("hat in allen drei Sprachen dieselben Schlüssel und Platzhalter", () => {
    for (const k of Object.keys(de)) {
      expect(tr, k).toHaveProperty(k);
      expect(en, k).toHaveProperty(k);
      const p = platzhalter((de as Record<string, string>)[k]!).sort();
      expect(platzhalter((tr as Record<string, string>)[k]!).sort(), `tr ${k}`).toEqual(p);
      expect(platzhalter((en as Record<string, string>)[k]!).sort(), `en ${k}`).toEqual(p);
    }
    expect(Object.keys(tr).length).toBe(Object.keys(de).length);
    expect(Object.keys(en).length).toBe(Object.keys(de).length);
  });
});
