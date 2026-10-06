// Ältere Wirkungsberichte haben nur fertige deutsche Sätze im Spielstand. Auf Türkisch und Englisch werden Titel, Zeilen und Hinweis
// daraus gelesen und neu gesetzt; Deutsch bleibt unverändert.
import { afterEach, describe, expect, it } from "vitest";
import { setzeSprache } from "../src/i18n";
import { lokalisiereBerichte, type Bericht } from "../src/sim/berichte";
import type { World } from "../src/sim/types";

afterEach(async () => {
  await setzeSprache("de");
});

const alt = (): Bericht => ({
  tag: 205,
  datum: "2028-12-27",
  massnahme: "m_industrie_modernisierung",
  titel: "Industrielle Modernisierung: Stufe 35 auf 55, 6 Monate danach",
  monate: 6,
  urteil: "schwach",
  zeilen: ["Produktivität: 50,0 auf 50,0 (+0,0)", "Investitionen: 45,0 auf 45,1 (+0,1)"],
  hinweis: "Die volle Wirkung braucht noch etwa 30 Monate. Bisher ist kaum etwas zu sehen. Die Zahlen zeigen die Veränderung insgesamt, nicht nur die dieser Maßnahme.",
});

const welt = (b: Bericht) => ({ spiel: { berichte: [b] } }) as unknown as World;

describe("Ältere Wirkungsberichte", () => {
  it("bleiben auf Deutsch, wie sie sind", () => {
    const b = alt();
    lokalisiereBerichte(welt(b));
    expect(b).toEqual(alt());
  });

  for (const sprache of ["tr", "en"] as const) {
    it(`erscheinen auf ${sprache} ohne deutsche Satzbausteine`, async () => {
      await setzeSprache(sprache);
      const b = alt();
      lokalisiereBerichte(welt(b));
      const alles = [b.titel, ...b.zeilen, b.hinweis].join(" | ");
      expect(alles).not.toMatch(/Stufe|Monate danach| auf |Die volle Wirkung|Bisher ist|Die Zahlen/);
      expect(b.titel).toMatch(/35/);
      expect(b.titel).toMatch(/55/);
      expect(b.hinweis).toMatch(/30/);
      expect(b.zeilen[1]).toMatch(/45[.,]1/);
    });
  }
});
