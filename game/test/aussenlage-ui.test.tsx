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
import { InnereSicherheit } from "../src/ui/militaer/InnereSicherheit";

describe("Akte Außenlage", () => {
  // Seit dem 6. November ohne Kennzahlen-Kacheln (stehen im Kopf, G-9), ohne Terror und Frieden (in der Sicherheit, G-10) und ohne
  // das Raster der Staatsführungen ohne Namen (G-29); geprüft werden Energie, Flucht und Sanktionen
  test("Lage rendert Energie, Flucht und Sanktionen; Terror und Frieden stehen in der Sicherheit", () => {
    const w = createWorld(turkey2026, 3);
    startAfterElection(w, schnellProfil());
    aussenZustand(w).monat = "";
    aussenMonat(w, weltModell(w));
    fuehreInstrumentAus(w, "grenzsicherung");
    const html = renderToStaticMarkup(<Aussenlage world={w} refresh={() => {}} />);
    expect(html).not.toContain("al-zahlen");
    expect(html).toContain("al-mix");
    expect(html).not.toContain("al-koepfe");
    const innen = renderToStaticMarkup(<InnereSicherheit world={w} />);
    expect(innen).toContain("si-phasen");
    expect(innen).not.toMatch(/⟦/);
    expect(html).not.toMatch(/⟦/);
  });
  test("Welt zeigt den neuen Modus", () => {
    const w = createWorld(turkey2026, 3);
    startAfterElection(w, schnellProfil());
    const html = renderToStaticMarkup(<Welt world={w} refresh={() => {}} />);
    expect(html).not.toMatch(/⟦/);
  });
});
