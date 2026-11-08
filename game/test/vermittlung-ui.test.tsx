// Die Vermittlungs-Ansicht (AUS-4): Konflikt-Auswahl, ZOPA-Band, Reif-Anzeige, Handlungsleiste und
// Garantie-Baukasten — servergerendert, ohne zu brechen.

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { weltZustand } from "../src/sim/laender";
import { bieteGarantie, konfliktZustand, vermittle } from "../src/sim/vermittlung";
import { Rng } from "../src/sim/rng";
import { Vermittlung } from "../src/ui/welt/Vermittlung";

function neu() {
  const w = createWorld(turkey2026, 6);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 150;
  return w;
}

describe("Vermittlungs-Ansicht", () => {
  test("Sie zeigt alle vier Konflikte mit Status, Forderungen, roten Linien, ZOPA-Band und Hebelpunkten", () => {
    const w = neu();
    const html = renderToStaticMarkup(createElement(Vermittlung, { world: w, refresh: () => {} }));
    for (const t of ["Armenien und Aserbaidschan", "Ukraine und Russland", "Israel und Iran", "Tripolis und der Osten"]) expect(html).toContain(t);
    expect(html).toContain("Zone möglicher Einigung");
    expect(html).toContain("Rote Linien");
    expect(html).toContain("Reife schaffen");
    expect(html).toContain("Garantien");
    expect(html).toContain("TRIPP-Korridor"); // ein Hebelpunkt mit Richtung statt „der Lösung"
    expect(html).toContain("Überwachungsmission");
    expect(html).toContain("Militärische Garantie");
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("undefined");
  });

  test("Nach einer Einigung mit Garantie zeigt die Karte Umsetzung und die stehende Garantie", () => {
    const w = neu();
    weltZustand(w)["ARM"]!.versatz += 25;
    konfliktZustand(w, "arm_aze").reif = 70;
    bieteGarantie(w, "arm_aze", "wirtschaft");
    expect(vermittle(w, "arm_aze", { next: () => 0 } as unknown as Rng).ok).toBe(true);
    konfliktZustand(w, "arm_aze").reifVerlauf.push({ monat: "2028-06", wert: 62 }, { monat: "2028-07", wert: 66 });
    const html = renderToStaticMarkup(createElement(Vermittlung, { world: w, refresh: () => {} }));
    expect(html).toContain("geeint");
    expect(html).toContain("Garantie beenden");
    expect(html).toContain("Wirtschafts-Anker");
    expect(html).not.toContain("Reife schaffen"); // nach der Einigung zählt die Umsetzung, nicht die Vorbereitung
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("undefined");
  });

  test("Ein geschlossener Konflikt erklärt, warum es (noch) keine Zone möglicher Einigung gibt", () => {
    const w = neu();
    // Hormus beginnt unter der Öffnungsreife: Der Vermitteln-Knopf ist gesperrt, der Grund steht da
    konfliktZustand(w, "isr_irn").reif = 10;
    const html = renderToStaticMarkup(createElement(Vermittlung, { world: w, refresh: () => {} }));
    expect(html).toContain("geschlossen");
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("undefined");
  });
});
