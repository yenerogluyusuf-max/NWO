// 2D-Ersatzkarte ohne WebGL (ui/atlas/Karte2D.tsx): 81 Provinzen, Nachbarländer, Farbe der Ebene, Auswahl.
import { expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Karte2D } from "../src/ui/atlas/Karte2D";

test("zeichnet 81 Provinzen über einem Landgrund, färbt nach Ebene und markiert die Auswahl", () => {
  const html = renderToStaticMarkup(createElement(Karte2D, { fill: { 6: "#8e2a22" }, selected: 6 }));
  const provinzen = html.split('class="karte2d-provinzen"')[1]!.split("</g>")[0]!;
  expect((provinzen.match(/<path/g) ?? []).length).toBe(81);
  expect(html).toContain('class="karte2d-grund"');
  expect(html).toContain("fill:#8e2a22");
  expect(html).toContain('class="gewaehlt"');
  expect(html).toContain("<title>Ankara</title>");
  expect(html).not.toMatch(/karte2d\.|undefined|NaN/);
});

test("zeigt die Kriegslage: Regionen nach Lage, Vorstöße und bedrohte Provinzen; ein ferner Schauplatz erweitert den Ausschnitt", () => {
  const krieg = {
    regionen: [
      { id: "a", lon: 44.5, lat: 38.0, lage: "umkaempft" as const, gelaende: "berg" as const, wert: 1 },
      { id: "b", lon: 47.0, lat: 36.5, lage: "gegner" as const, gelaende: "ebene" as const, wert: 1 },
    ],
    pfeile: [{ von: [43.5, 38.4] as [number, number], nach: [44.5, 38.0] as [number, number], seite: "eigen" as const }],
    bedroht: [65],
    aktiv: true,
  };
  const html = renderToStaticMarkup(createElement(Karte2D, { krieg: krieg as never }));
  expect(html).toContain('class="karte2d-krieg aktiv"');
  // Welle 3, K6: Regionen tragen die Klasse „region“ und ihre Lage (Flächen statt Kreise; ohne Umriss wie hier bleibt der Kreis)
  expect(html).toContain('class="region umkaempft"');
  expect(html).toContain('class="pfeil eigen"');
  expect(html).toContain('class="bedroht"');
  // 47° Ost liegt außerhalb des Grundausschnitts (bis 45°): die Breite wächst über 836 hinaus
  const breite = Number(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+)/.exec(html)![1]);
  expect(breite).toBeGreaterThan((45 - 25.4) * 40 + 60);
  expect(html).not.toMatch(/karte2d\.|undefined|NaN/);
});
