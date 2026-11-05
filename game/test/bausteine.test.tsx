// Gemeinsame Bausteine (ui/bausteine, PLAN_OBERFLAECHE_DETAIL Teil 1, Q3 und Arbeitspaket 5): Rechnung und Darstellung ohne
// kaputte Werte, in drei Sprachen.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, test } from "vitest";
import { setzeSprache } from "../src/i18n";
import { Rad, radWinkel, type RadStueck } from "../src/ui/bausteine/Rad";
import { Preisfeld, ReglerZeile } from "../src/ui/bausteine/ReglerZeile";
import { Tacho, imBand, tachoWinkel } from "../src/ui/bausteine/Tacho";
import { Kreisfeld, kreisLage } from "../src/ui/bausteine/Kreisfeld";
import { Erklaer } from "../src/ui/bausteine/Erklaer";
import { Seitenfenster } from "../src/ui/bausteine/Seitenfenster";
import { anteil, delta, geld, index } from "../src/ui/bausteine/zahlformat";

const KAPUTT = /undefined|NaN|\[object|\{[a-z]+\}|Infinity|bs\./;
afterEach(async () => { await setzeSprache("de"); });

const STUECKE: RadStueck[] = [
  { id: "a", name: "Renten", wert: 4000, farbe: "#b23a26", klickbar: true },
  { id: "b", name: "Bildung", wert: 1900, farbe: "#00938f" },
  { id: "c", name: "Zinsen", wert: 2100, farbe: "#5f9b3a", schraffiert: true },
];

test("Zahlformat: Indizes ganzzahlig, Geld in Mrd./Bio., kein −0", () => {
  expect(index(87.3)).toBe("87");
  expect(index(-0.2)).toBe("0");
  expect(geld(1944)).toBe("1,9 Bio. ₺");
  expect(geld(12.34)).toBe("12,3 Mrd. ₺");
  expect(geld(0.01)).toBe("0,0 Mrd. ₺");
  expect(anteil(54.2)).toBe("54 %");
  expect(anteil(2.94, 1)).toBe("2,9 %");
  expect(delta(-0.04, 1)).toBe("0,0");
  expect(delta(3)).toBe("+3");
  expect(delta(-2)).toBe("−2");
});

test("Rad: Winkel decken den Kreis, Anteile summieren auf 1; Darstellung mit Legende und Mitte", () => {
  const w = radWinkel(STUECKE);
  expect(w.reduce((s, x) => s + x.anteil, 0)).toBeCloseTo(1, 9);
  expect(w[w.length - 1]!.bis).toBeCloseTo(Math.PI * 2, 9);
  const html = renderToStaticMarkup(createElement(Rad, { aussen: { stuecke: STUECKE, titel: "Ausgaben", gesamt: 8000 }, wertText: geld, mitte: { titel: "Defizit", wert: "2,9 %" }, aria: "Rad", onStueck: () => {} }));
  expect(html).toContain("Renten");
  expect(html).toContain("8,0 Bio. ₺");
  expect(html).toContain("hr-einzeln");
  expect(html).toContain("50 %");
  expect(html).not.toMatch(KAPUTT);
});

test("Reglerzeile und Preisfeld: vorher → nachher, − und + an den Grenzen gesperrt, rote Fakten markiert", () => {
  const html = renderToStaticMarkup(
    createElement("ul", null, createElement(ReglerZeile, { kl: "hd", zustand: "on", name: createElement("span", null, "Bildung"), wert: 4, min: -4, max: 4, onWert: () => {}, minus: "kürzen", plus: "ausbauen", aria: "Bildung", anzeigeKlasse: "betrag", vorher: "1,9 Bio. ₺", nachher: "2,1 Bio. ₺" },
      createElement(Preisfeld, { kl: "hd", fakten: [{ label: "Kapital", wert: "5 Kapital" }, { label: "Mehrheit", wert: "es fehlen 12", schlecht: true }] }))),
  );
  expect(html).toContain('class="hd-zeile on"');
  expect(html).toMatch(/<s>1,9 Bio\. ₺<\/s> <b>2,1 Bio\. ₺<\/b>/);
  expect(html).toMatch(/aria-label="ausbauen"[^>]*disabled/);
  expect(html).toContain('<dd class="schlecht">es fehlen 12</dd>');
});

test("Tacho: Winkel von links nach rechts, geklemmt; außerhalb des Bands rot", () => {
  expect(tachoWinkel(0, 0, 100)).toBeCloseTo(-Math.PI / 2, 9);
  expect(tachoWinkel(100, 0, 100)).toBeCloseTo(Math.PI / 2, 9);
  expect(tachoWinkel(500, 0, 100)).toBeCloseTo(Math.PI / 2, 9);
  expect(imBand(5, [2, 6])).toBe(true);
  expect(imBand(34.9, [2, 6])).toBe(false);
  const html = renderToStaticMarkup(createElement(Tacho, { titel: "Inflation", wert: 34.9, text: "34,9 %", min: 0, max: 60, band: [2, 6], bandText: ["2 %", "6 %"] }));
  expect(html).toContain("schlecht");
  expect(html).toContain("Ziel 2 %–6 %");
  expect(html).not.toMatch(KAPUTT);
});

test("Kreisfeld: keine zwei Kreise überdecken sich; Fläche nach Anteil", () => {
  const kreise = Array.from({ length: 9 }, (_, i) => ({ id: `g${i}`, name: `Gruppe ${i}`, wert: 45 + i, anteil: 0.05 + i * 0.02 }));
  const lage = kreisLage(kreise);
  for (let i = 0; i < lage.length; i++)
    for (let j = i + 1; j < lage.length; j++) {
      const a = lage[i]!, b = lage[j]!;
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r + 1.9);
    }
  const gross = lage.find((l) => l.id === "g8")!, klein = lage.find((l) => l.id === "g0")!;
  expect(gross.r).toBeGreaterThan(klein.r);
  const html = renderToStaticMarkup(createElement(Kreisfeld, { kreise, titel: "Das Volk", onKreis: () => {} }));
  expect(html).toContain('role="button"');
  expect(html).not.toMatch(KAPUTT);
});

test("Erklärung und Seitenfenster: lesbar in drei Sprachen, ohne Platzhalter", async () => {
  for (const sprache of ["de", "en", "tr"] as const) {
    await setzeSprache(sprache);
    const html = renderToStaticMarkup(
      createElement(Seitenfenster, { titel: "Land", reiter: [{ id: "karte", label: "Karte" }, { id: "bau", label: "Bauleiste" }], aktiv: "karte", onSchliessen: () => {} }, createElement(Erklaer, null, "Regeltext")),
    );
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain("Regeltext");
    expect(html).not.toMatch(KAPUTT);
  }
});
