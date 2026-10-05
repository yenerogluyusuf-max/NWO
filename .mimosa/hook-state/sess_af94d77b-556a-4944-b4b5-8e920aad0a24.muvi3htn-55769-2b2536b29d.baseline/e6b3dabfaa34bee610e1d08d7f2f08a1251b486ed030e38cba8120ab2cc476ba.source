// Die Wähleransicht lässt sich vollständig zeichnen (Server-Rendering) und zeigt Gruppen, Koalition und Verlaufsmarken.

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { setPolicy } from "../src/sim/handeln";
import { GRUPPEN } from "../src/sim/gruppen";
import { Waehler } from "../src/ui/Waehler";
import { GruppenDetail } from "../src/ui/waehler/GruppenDetail";
import { Sparkline } from "../src/ui/waehler/Sparkline";

function neu() {
  const w = createWorld(turkey2026, 6);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  return w;
}

describe("Wähleransicht", () => {
  test("Am Amtsantritt: Barometer, Koalition und alle Gruppen stehen da", () => {
    const html = renderToStaticMarkup(createElement(Waehler, { world: neu() }));
    expect(html).toContain("Wenn heute gewählt würde");
    expect(html).toContain("Ihre Koalition der Wähler");
    expect((html.match(/class="wa-gruppe/g) ?? []).length).toBe(GRUPPEN.length);
    expect(html).not.toContain("NaN");
  });

  test("Nach zwei Jahren mit Maßnahmen: Ursachenkette, Vorlieben und Hilfen erscheinen, nichts ist NaN", () => {
    const w = neu();
    setPolicy(w, "m_mindestlohn", 85);
    advance(w, 30 * 24);
    for (const g of GRUPPEN) {
      const html = renderToStaticMarkup(createElement(GruppenDetail, { world: w, id: g.id }));
      expect(html, g.id).toContain("Warum sie so gestimmt sind");
      expect(html, g.id).toContain("Sie wünschen mehr von");
      expect(html, g.id).not.toContain("NaN");
      expect(html, g.id).not.toContain("Infinity");
    }
  });

  test("Marken im Verlauf werden als Punkte mit Erklärung gezeichnet", () => {
    const monate = ["2028-07", "2028-08", "2028-09", "2028-10"];
    const html = renderToStaticMarkup(createElement(Sparkline, { monate, werte: [50, 52, 51, 55], marken: [{ monat: "2028-09", text: "Mindestlohn" }], beschriftung: "Test" }));
    expect(html).toContain("wa-spark-marke");
    expect(html).toContain("Mindestlohn beschlossen");
    const leer = renderToStaticMarkup(createElement(Sparkline, { monate: ["2028-07"], werte: [50], beschriftung: "Test" }));
    expect(leer).toContain("Noch zu wenig Verlauf");
  });
});
