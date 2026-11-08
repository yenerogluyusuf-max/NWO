// Tagarbeit 6. November (T4): Die Akte „Opposition & Straße“ zeichnet alle vier Reiter vollständig. Jede Möglichkeit bleibt erreichbar:
// fünf Instrumente mit Knopf, 81 Rathäuser als wählbare Zeilen, und die ruhige Straße zeigt die Bewegungen gegen ihre Schwelle.

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { GesellschaftAkte } from "../src/ui/gesellschaft/GesellschaftAkte";
import { BEWEGUNG } from "../src/sim/bewegungen";
import { gesellschaftVon } from "../src/sim/gesellschaft";
import { PROVINZEN } from "../src/sim/regional";
import { t } from "../src/i18n";

function neu() {
  const w = createWorld(turkey2026, 6);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  return w;
}

const zeichne = (start: "lage" | "opposition" | "strasse" | "kommunen") => renderToStaticMarkup(createElement(GesellschaftAkte, { world: neu(), start }));

describe("Akte Opposition & Straße", () => {
  test("Opposition: fünf Instrumente mit Knopf und Wirkung auf die Wahl, die Züge neben der Führung", () => {
    const html = zeichne("opposition");
    expect((html.match(/class="ges-instrument[ "]/g) ?? []).length).toBe(5);
    expect((html.match(/class="knopf ges-tat"/g) ?? []).length).toBe(5);
    expect(html).toContain(t("tag_t4.opp.wahl_heute"));
    expect(html).toContain(t("ges.opp.zuege"));
    expect(html).not.toContain("NaN");
  });

  test("Straße in Ruhe: drei Bewegungen gegen ihre Schwelle und drei Milieus mit Groll", () => {
    const w = neu();
    gesellschaftVon(w).bewegungen = [];
    const html = renderToStaticMarkup(createElement(GesellschaftAkte, { world: w, start: "strasse" }));
    expect(html).toContain(t("nacht_n2.strasse.leer_titel"));
    expect((html.match(/class="ges-druck/g) ?? []).length).toBe(3);
    expect((html.match(/class="ges-glut"/g) ?? []).length).toBe(3);
    expect(html).toContain(`left:${BEWEGUNG.schwelle}%`);
  });

  test("Rathäuser: jede Provinz als wählbare Zeile, keine Handlung, bevor eine Stadt geöffnet ist", () => {
    const html = zeichne("kommunen");
    expect((html.match(/class="ges-rathaus-zeile"/g) ?? []).length).toBe(PROVINZEN.length);
    expect(html).not.toContain(t("ges.kom.einsetzen"));
  });

  test("Lage: Milieus und Kennzahlen ohne NaN", () => {
    const html = zeichne("lage");
    expect((html.match(/class="ges-milieu"/g) ?? []).length).toBe(5);
    expect(html).not.toContain("NaN");
  });
});
