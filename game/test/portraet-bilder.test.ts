// Rasterbilder als zweiter Weg: Manifest bereinigen, deterministisch und passend auswählen, Rückfall auf die Zeichnung.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vitest";
import { MAX_STRAFE, altersgruppe, bereinige, setzeManifest, strafe, waehleBild, type BildAnfrage, type BildEintrag, type Manifest } from "../src/ui/art/portraet-bilder";
import { Portraet } from "../src/ui/art/Portraet";

afterEach(() => setzeManifest("ungeladen"));

const eintrag = (datei: string, o: Partial<BildEintrag> = {}): BildEintrag => ({ datei, geschlecht: "f", alter: 40, ton: 2, kopftuch: false, brille: false, bart: false, uniform: false, robe: false, ...o });
const manifest = (...b: BildEintrag[]): Manifest => ({ version: 1, bilder: b });
const frage = (o: Partial<BildAnfrage> = {}): BildAnfrage => ({ seed: "Test", geschlecht: "f", alter: 41, ton: 2, kopftuch: false, brille: false, bart: false, uniform: false, robe: false, ...o });

describe("Auswahl der Rasterbilder", () => {
  test("Altersgruppen: nächste Dekade von 30 bis 70", () => {
    expect([altersgruppe(22), altersgruppe(34), altersgruppe(46), altersgruppe(55), altersgruppe(68), altersgruppe(80)]).toEqual([30, 30, 50, 60, 70, 70]);
  });

  test("Geschlecht, Kopftuch, Uniform und Robe sind hart; ohne Treffer kein Bild", () => {
    const m = manifest(eintrag("p-f-40-2-01.webp"), eintrag("p-m-40-2-01.webp", { geschlecht: "m" }), eintrag("p-f-40-2-02-kopftuch.webp", { kopftuch: true }), eintrag("p-m-50-2-01-uniform.webp", { geschlecht: "m", alter: 50, uniform: true }), eintrag("p-f-50-2-05-robe.webp", { alter: 50, robe: true }));
    expect(waehleBild(m, frage())!.datei).toBe("p-f-40-2-01.webp");
    expect(waehleBild(m, frage({ geschlecht: "m" }))!.datei).toBe("p-m-40-2-01.webp");
    expect(waehleBild(m, frage({ kopftuch: true }))!.datei).toBe("p-f-40-2-02-kopftuch.webp");
    expect(waehleBild(m, frage({ geschlecht: "m", alter: 50, uniform: true }))!.datei).toBe("p-m-50-2-01-uniform.webp");
    expect(waehleBild(m, frage({ alter: 50, robe: true }))!.datei).toBe("p-f-50-2-05-robe.webp");
    // ohne passende Uniform kein Bild: lieber die Zeichnung als ein General im Anzug
    expect(waehleBild(manifest(eintrag("p-m-40-2-01.webp", { geschlecht: "m" })), frage({ geschlecht: "m", uniform: true }))).toBeNull();
    // ein Mann ohne Männerbilder bekommt kein Frauenbild
    expect(waehleBild(manifest(eintrag("p-f-40-2-01.webp")), frage({ geschlecht: "m" }))).toBeNull();
  });

  test("Alter, Hautton, Brille und Bart sind weich: das nächste Bild gewinnt", () => {
    const m = manifest(eintrag("a.webp", { alter: 30, ton: 1 }), eintrag("b.webp", { alter: 50, ton: 1 }), eintrag("c.webp", { alter: 50, ton: 4, brille: true }));
    expect(waehleBild(m, frage({ alter: 52, ton: 1 }))!.datei).toBe("b.webp");
    expect(waehleBild(m, frage({ alter: 52, ton: 4, brille: true }))!.datei).toBe("c.webp");
    // eine Brille, die kein Bild trägt, ist ein Abzug, kein Ausschluss
    expect(waehleBild(manifest(eintrag("d.webp", { alter: 50 })), frage({ alter: 52, brille: true }))!.datei).toBe("d.webp");
    expect(strafe(eintrag("x.webp"), frage({ brille: true }))).toBeGreaterThan(strafe(eintrag("x.webp"), frage())!);
    // zu schlechter Treffer (Strafe über der Grenze): Rückfall auf die Zeichnung
    expect(strafe(eintrag("y.webp", { alter: 70, ton: 5, brille: true, bart: true }), frage({ alter: 30, ton: 1 }))!).toBeGreaterThan(MAX_STRAFE);
    expect(waehleBild(manifest(eintrag("y.webp", { alter: 70, ton: 5, brille: true, bart: true })), frage({ alter: 30, ton: 1 }))).toBeNull();
  });

  test("deterministisch aus dem Samen: gleicher Samen, gleiches Bild; viele Samen verteilen sich über die gleichwertigen Bilder", () => {
    const m = manifest(...Array.from({ length: 6 }, (_, i) => eintrag(`p-f-40-2-0${i + 1}.webp`)));
    expect(waehleBild(m, frage({ seed: "Anna" }))!.datei).toBe(waehleBild(m, frage({ seed: "Anna" }))!.datei);
    const gewaehlt = new Set(Array.from({ length: 80 }, (_, i) => waehleBild(m, frage({ seed: `Person ${i}` }))!.datei));
    expect(gewaehlt.size).toBeGreaterThanOrEqual(4);
  });

  test("Manifest bereinigen: Schema des Werkzeugs baue_manifest.mjs, fehlende Merkmale gelten als falsch, Müll fällt heraus", () => {
    const m = bereinige({ version: 1, bilder: [{ datei: "p-f-50-2-03-brille.webp", geschlecht: "f", alter: 50, ton: 2, brille: true }, { datei: 5 }, null, { datei: "x.webp", geschlecht: "q", alter: 1, ton: 1 }] });
    expect(m!.bilder).toHaveLength(1);
    expect(m!.bilder[0]).toMatchObject({ kopftuch: false, brille: true, bart: false, uniform: false, robe: false });
    expect(bereinige({ bilder: [] })).toBeNull();
    expect(bereinige("kein Manifest")).toBeNull();
    expect(bereinige(null)).toBeNull();
  });
});

describe("Porträt mit Rasterbild", () => {
  const html = (p: Parameters<typeof Portraet>[0]) => renderToStaticMarkup(createElement(Portraet, p));

  test("mit passendem Eintrag erscheint das Bild im Oval, mit Rückfall auf die Zeichnung ohne Manifest und ohne Treffer", () => {
    // ohne Manifest: gezeichnetes Gesicht
    setzeManifest(null);
    const gezeichnet = html({ seed: "Leyla Özkan", geschlecht: "f", alter: 40, kopftuch: false, brille: false, size: 120 });
    expect(gezeichnet).not.toContain("<image");
    expect(gezeichnet).toContain("pt-lid");
    // mit synthetischem Manifest (Platzhalter-Bildadressen)
    setzeManifest(manifest(eintrag("p-f-40-1-01.webp", { ton: 1 }), eintrag("p-f-40-2-01.webp", { ton: 2 }), eintrag("p-f-40-3-01.webp", { ton: 3 })));
    const mitBild = html({ seed: "Leyla Özkan", geschlecht: "f", alter: 40, kopftuch: false, brille: false, size: 120 });
    expect(mitBild).toContain("<image");
    expect(mitBild).toMatch(/href="\/ui\/portraits\/p-f-40-[123]-01\.webp"/);
    expect(mitBild).not.toContain("pt-lid");
    // kein Treffer (Mann, Manifest nur mit Frauen): Zeichnung
    expect(html({ seed: "Murat Güneş", geschlecht: "m", alter: 20, bart: "keiner", brille: false, size: 120 })).not.toContain("<image");
    // mit raster={false} bleibt es bei der Zeichnung
    expect(html({ seed: "Leyla Özkan", geschlecht: "f", alter: 40, size: 120, raster: false })).not.toContain("<image");
  });

  test("das Geschlecht der Eingabe gilt strikt, nie das des Samens", () => {
    setzeManifest(manifest(eintrag("p-f-40-2-01.webp"), eintrag("p-m-40-2-01.webp", { geschlecht: "m" })));
    for (const name of ["Leyla Özkan", "Murat Güneş", "Defne Aksoy", "Orhan Özgür", "Zeynep", "Kemal"]) {
      expect(html({ seed: name, geschlecht: "f", alter: 40, kopftuch: false, brille: false, size: 100 })).toContain("p-f-40-2-01.webp");
      expect(html({ seed: name, geschlecht: "m", alter: 40, bart: "keiner", brille: false, size: 100 })).toContain("p-m-40-2-01.webp");
    }
  });
});
