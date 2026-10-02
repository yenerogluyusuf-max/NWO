// Die Reich-Ansicht zeichnet die öffentliche Baureihenfolge mit Positionen, Vergabe-Plaketten und Verdrängungspreis, ohne zu brechen (Server-Rendering).

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { beginne, vorhabenSicht } from "../src/sim/reich";
import { Reich } from "../src/ui/Reich";
import { VorhabenKarte } from "../src/ui/reich/VorhabenKarte";

function neu() {
  const w = createWorld(turkey2026, 6);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 150;
  return w;
}

describe("Reich-Ansicht mit Bauvergabe und Baureihenfolge", () => {
  test("Baureihenfolge ist öffentlich: Positionen, Vergabe-Plaketten und Schätzungen stehen da", () => {
    const w = neu();
    beginne(w, "restaurierung_ephesos", "stammfirma");
    const html = renderToStaticMarkup(createElement(Reich, { world: w, bereich: "infrastruktur", refresh: () => {} }));
    expect(html).toContain("Baureihenfolge");
    expect(html).toContain("Verwaltungskraft");
    expect(html).toContain("Stammfirma");
    // die Anfangsbauten stammen aus einem Spielstand ohne Vergabe und gelten als transparent ausgeschrieben
    expect(html).toContain("Transparente Ausschreibung");
    expect(html).not.toContain("NaN");
  });

  test("Vorhabenkarte zeigt die Vergabe-Plakette und die Vergabephase eines laufenden Vorhabens", () => {
    const w = neu();
    beginne(w, "restaurierung_pergamon", "sparvergabe");
    const s1 = vorhabenSicht(w, "restaurierung_pergamon")!;
    const html1 = renderToStaticMarkup(createElement(VorhabenKarte, { s: s1, onBeginne: () => {} }));
    expect(html1).toContain("Sparvergabe");
    expect(html1).not.toContain("NaN");
    beginne(w, "restaurierung_smyrna", "ausschreibung");
    const s2 = vorhabenSicht(w, "restaurierung_smyrna")!;
    const html2 = renderToStaticMarkup(createElement(VorhabenKarte, { s: s2, onBeginne: () => {} }));
    expect(html2).toContain("Vergabephase");
    expect(html2).not.toContain("NaN");
  });

  test("Eine verfügbare Karte bietet den Beginn mit Vergabe-Wahl an", () => {
    const w = neu();
    const s = vorhabenSicht(w, "restaurierung_sardes")!;
    expect(s.status).toBe("verfuegbar");
    const html = renderToStaticMarkup(createElement(VorhabenKarte, { s, onBeginne: () => {}, kapital: 150 }));
    expect(html).toContain("Beginnen");
    expect(html).not.toContain("NaN");
  });
});
