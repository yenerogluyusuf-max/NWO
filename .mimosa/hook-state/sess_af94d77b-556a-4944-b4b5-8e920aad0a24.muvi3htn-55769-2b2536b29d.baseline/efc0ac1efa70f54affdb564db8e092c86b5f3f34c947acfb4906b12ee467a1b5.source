// Akte Außenlage: rendert alle drei Reiter ohne Fehler und ohne fehlende Schlüssel.
import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { aussenZustand, aussenMonat, fuehreInstrumentAus } from "../src/sim/diplomatie";
import { weltModell } from "../src/sim/welt-modell";
import { Aussenlage } from "../src/ui/welt/Aussenlage";
import { Welt } from "../src/ui/Welt";

describe("Akte Außenlage", () => {
  test("Lage rendert Kennzahlen, Energie, Flucht, Terror, Frieden und Staatsführungen", () => {
    const w = createWorld(turkey2026, 3);
    startAfterElection(w, schnellProfil());
    aussenZustand(w).monat = "";
    aussenMonat(w, weltModell(w));
    fuehreInstrumentAus(w, "grenzsicherung");
    const html = renderToStaticMarkup(<Aussenlage world={w} refresh={() => {}} />);
    expect(html).toContain("al-zahlen");
    expect(html).toContain("al-mix");
    expect(html).toContain("al-koepfe");
    expect(html).not.toMatch(/⟦/);
  });
  test("Welt zeigt den neuen Modus", () => {
    const w = createWorld(turkey2026, 3);
    startAfterElection(w, schnellProfil());
    const html = renderToStaticMarkup(<Welt world={w} refresh={() => {}} />);
    expect(html).not.toMatch(/⟦/);
  });
});
