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
