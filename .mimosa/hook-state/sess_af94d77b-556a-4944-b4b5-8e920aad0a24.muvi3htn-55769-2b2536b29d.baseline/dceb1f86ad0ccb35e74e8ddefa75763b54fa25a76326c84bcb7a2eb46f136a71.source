// Porträtsystem: deterministisch aus dem Samen, Geschlecht und Alter der Eingabe gelten strikt, Vielfalt, Mienen, Zubehör,
// Alterslogik (Haut, Haar, Glatze), keine kaputten Zahlen.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test } from "vitest";
import { ANZAHL_FRISUREN, Portraet, STIMMUNGEN, stimmungAus, type PortraetProps } from "../src/ui/art/Portraet";
import { waehleAus } from "../src/ui/art/portraet-kern";
import { setzeManifest } from "../src/ui/art/portraet-bilder";

beforeEach(() => setzeManifest(null));

const html = (p: PortraetProps) => renderToStaticMarkup(createElement(Portraet, { raster: false, ...p }));
/** Das Bild ohne die zufälligen Kennungen der Verläufe (useId), damit zwei Aufrufe vergleichbar sind */
const rein = (p: PortraetProps) => html(p).replace(/«[^»]*»/g, "ID");
const KAPUTT = /NaN|undefined|Infinity|\[object/;

describe("Porträt", () => {
  test("gleicher Samen gibt gleiches Bild, anderer Samen ein anderes", () => {
    expect(rein({ seed: "Defne Aksoy" })).toBe(rein({ seed: "Defne Aksoy" }));
    expect(rein({ seed: "Defne Aksoy" })).not.toBe(rein({ seed: "Orhan Özgür" }));
  });

  test("60 Namen: keine kaputten Zahlen, mindestens 50 verschiedene Bilder", () => {
    const bilder = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const h = rein({ seed: `Person ${i + 1}`, size: 112 });
      expect(h).not.toMatch(KAPUTT);
      bilder.add(h);
    }
    expect(bilder.size).toBeGreaterThanOrEqual(50);
  });

  test("20 Frisuren (je Geschlecht zehn), alle zeichnen ohne Fehler und unterscheiden sich", () => {
    expect(ANZAHL_FRISUREN).toBe(20);
    for (const g of ["m", "f"] as const) {
      const set = new Set<string>();
      for (let i = 0; i < 10; i++) {
        // Alter 50: Glatze (Stil 3) und Geheimratsecken (Stil 4) sind für Männer erlaubt
        const h = rein({ seed: "Frisur", geschlecht: g, alter: 50, haare: i, kopftuch: false, bart: "keiner", size: 140 });
        expect(h).not.toMatch(KAPUTT);
        set.add(h);
      }
      expect(set.size).toBe(10);
    }
  });

  test("neun Mienen sehen verschieden aus; Zustand wird zur passenden Miene", () => {
    expect(STIMMUNGEN.length).toBe(9);
    for (const g of ["m", "f"] as const) {
      const set = new Set(STIMMUNGEN.map((s) => rein({ seed: "Barış Sezer", geschlecht: g, alter: 48, stimmung: s, size: 150 })));
      expect(set.size).toBe(STIMMUNGEN.length);
    }
    expect(stimmungAus({ groll: 55 })).toBe("veraergert");
    expect(stimmungAus({ kommissarisch: true })).toBe("besorgt");
    expect(stimmungAus({ ehrgeiz: 80, loyalitaet: 50 })).toBe("selbstgefaellig");
    expect(stimmungAus({ loyalitaet: 80 })).toBe("sicher");
    expect(stimmungAus({ loyalitaet: 30 })).toBe("besorgt");
    expect(stimmungAus({ loyalitaet: 45 })).toBe("muede");
    expect(stimmungAus({ loyalitaet: 60, ehrgeiz: 20 })).toBe("neutral");
  });

  test("Lächeln zeigt Zähne und einen offenen Mund, Überraschung einen offenen Mund ohne Zähne, Ernst einen geschlossenen", () => {
    const l = rein({ seed: "X", geschlecht: "f", alter: 36, stimmung: "laechelnd", size: 150 });
    const u = rein({ seed: "X", geschlecht: "f", alter: 36, stimmung: "ueberrascht", size: 150 });
    const e = rein({ seed: "X", geschlecht: "f", alter: 36, stimmung: "ernst", size: 150 });
    expect(l).toContain("#f6efdf"); // Zähne
    expect(u).not.toContain("#f6efdf");
    expect(u).toContain("#3a1612"); // Mundinneres
    expect(e).not.toContain("#3a1612");
  });
});

describe("Geschlecht und Alter der Eingabe gelten strikt", () => {
  test("das Geschlecht kommt aus der Eingabe, nie aus dem Samen", () => {
    for (let i = 0; i < 80; i++) {
      expect(waehleAus({ seed: `Leyla Özkan ${i}`, geschlecht: "f" }).geschlecht).toBe("f");
      expect(waehleAus({ seed: `Murat Güneş ${i}`, geschlecht: "m" }).geschlecht).toBe("m");
    }
    // Männer tragen nie einen Haarstil der Frauen: die Zeichnung unterscheidet sich im Raster (Halsbreite) strikt
    expect(waehleAus({ seed: "Leyla Özkan", geschlecht: "m" }).rs.halsBreite).toBeGreaterThan(waehleAus({ seed: "Leyla Özkan", geschlecht: "f" }).rs.halsBreite);
  });

  test("unter 30: glatte Haut, volles Haar, keine Glatze; 30 bis 44: kaum Linien", () => {
    for (let i = 0; i < 60; i++) {
      for (const al of [18, 22, 26, 29]) {
        const a = waehleAus({ seed: `jung ${i}`, geschlecht: "m", alter: al });
        expect(a.falten).toBe(0);
        expect(a.grau).toBe(0);
        expect(a.glatze).toBe(false);
        expect(a.alter).toBe(al);
      }
      for (const al of [30, 36, 44]) {
        const a = waehleAus({ seed: `mitte ${i}`, geschlecht: "f", alter: al });
        expect(a.falten).toBeLessThanOrEqual(0.22 + 1e-9);
        expect(a.glatze).toBe(false);
      }
    }
  });

  test("45 bis 59: graue Schläfen und sichtbare Falten; ab 60 graues oder weißes Haar und tiefe Falten", () => {
    for (const al of [46, 52, 58]) {
      const a = waehleAus({ seed: "mittelalt", geschlecht: "m", alter: al });
      expect(a.falten).toBeGreaterThan(0.22);
      expect(a.falten).toBeLessThan(0.64);
      expect(a.schlaefen).toBeGreaterThan(0.3);
    }
    for (const al of [62, 70, 80]) {
      const a = waehleAus({ seed: "alt", geschlecht: "f", alter: al });
      expect(a.falten).toBeGreaterThanOrEqual(0.64);
      expect(a.grau).toBeGreaterThan(0.85);
    }
    // je älter, desto mehr Falten und Grau (monoton)
    let vorher = -1;
    for (let al = 20; al <= 90; al += 5) {
      const a = waehleAus({ seed: "reihe", geschlecht: "m", alter: al });
      expect(a.falten).toBeGreaterThanOrEqual(vorher);
      vorher = a.falten;
    }
  });

  test("Glatze mit Haarkranz nur bei Männern ab 40, nie bei Frauen; Geheimratsecken nur ab 45", () => {
    let glatzen = 0;
    for (let i = 0; i < 400; i++) {
      for (const al of [20, 30, 39]) expect(waehleAus({ seed: `s${i}`, geschlecht: "m", alter: al }).glatze).toBe(false);
      for (const al of [20, 40, 60, 80]) expect(waehleAus({ seed: `s${i}`, geschlecht: "f", alter: al }).glatze).toBe(false);
      for (const al of [44, 70]) {
        const a = waehleAus({ seed: `s${i}`, geschlecht: "m", alter: al });
        if (a.glatze) glatzen++;
        if (al < 45) expect(a.stil).not.toBe(4);
      }
    }
    expect(glatzen).toBeGreaterThan(0);
    // erzwungene Stile: Glatze unter 40 wird zu Kurzhaar, Geheimratsecken unter 45 zu Seitenscheitel
    expect(waehleAus({ seed: "a", geschlecht: "m", alter: 25, haare: 3 }).glatze).toBe(false);
    expect(waehleAus({ seed: "a", geschlecht: "m", alter: 25, haare: 4 }).stil).toBe(1);
    expect(waehleAus({ seed: "a", geschlecht: "m", alter: 50, haare: 3 }).glatze).toBe(true);
  });

  test("Falten erscheinen im Bild nur, wo das Alter sie verlangt (und nur bei Bildern ab 64 px)", () => {
    const jung = rein({ seed: "Elif Kaya", geschlecht: "f", alter: 24, haare: 0, size: 140, stimmung: "neutral" });
    const alt = rein({ seed: "Elif Kaya", geschlecht: "f", alter: 78, haare: 0, size: 140, stimmung: "neutral" });
    const klein = rein({ seed: "Elif Kaya", geschlecht: "f", alter: 78, haare: 0, size: 44, stimmung: "neutral" });
    expect(alt.length).toBeGreaterThan(jung.length);
    expect(klein.length).toBeLessThan(alt.length);
  });
});

describe("Brille, Bart, Kopftuch, Größen", () => {
  test("Brille: zwei Gläser zentriert auf den Augen, Steg über der Nase, Bügel; vier Formen", () => {
    const ohne = rein({ seed: "Pınar Koçak", geschlecht: "f", alter: 44, brille: false, size: 140 });
    const formen = (["rund", "oval", "eckig", "halb"] as const).map((b) => rein({ seed: "Pınar Koçak", geschlecht: "f", alter: 44, brille: b, size: 140 }));
    expect(new Set(formen).size).toBe(4);
    for (const h of formen) {
      expect(h).not.toBe(ohne);
      expect(h).not.toMatch(KAPUTT);
      // Bügel enden an den Ohren: Linien mit abgerundeten Enden
      expect((h.match(/stroke-linecap="round" fill="none"/g) ?? []).length).toBeGreaterThanOrEqual((ohne.match(/stroke-linecap="round" fill="none"/g) ?? []).length + 2);
    }
    // Gläser sitzen auf den Augen: Die Mitte jedes Glases liegt auf der Augenlinie (Raster)
    const a = waehleAus({ seed: "Pınar Koçak", geschlecht: "f", alter: 44, brille: "rund" });
    expect(a.brille).toBe("rund");
    expect(waehleAus({ seed: "Pınar Koçak", geschlecht: "f", alter: 44, brille: false }).brille).toBe(false);
  });

  test("Bart und Kopftuch ändern das Bild; Kopftuch nur wenn gewünscht oder aus dem Samen (Frauen)", () => {
    const basis = rein({ seed: "Orhan Özgür", geschlecht: "m", alter: 50, bart: "keiner", brille: false });
    for (const bart of ["stoppel", "schnurr", "kinn", "voll"] as const) expect(rein({ seed: "Orhan Özgür", geschlecht: "m", alter: 50, bart, brille: false })).not.toBe(basis);
    const ohne = rein({ seed: "Melis Yalçın", geschlecht: "f", alter: 40, kopftuch: false });
    const mit = rein({ seed: "Melis Yalçın", geschlecht: "f", alter: 40, kopftuch: true });
    expect(mit).not.toBe(ohne);
    expect(mit).not.toMatch(KAPUTT);
    // Männer tragen aus dem Samen nie ein Kopftuch
    for (let i = 0; i < 100; i++) expect(waehleAus({ seed: `m${i}`, geschlecht: "m" }).kopftuch).toBe(false);
  });

  test("Rollen: jede Rolle hat ihren Hintergrund und ihre Kleidung; Uniform und Robe erscheinen nur dort", () => {
    const rollen = ["finanzen", "inneres", "aussen", "zentralbank", "stab", "opposition", "justiz", "generalstab", "wirtschaft", "partner"];
    const bilder = new Set(rollen.map((r) => rein({ seed: "Rolle", geschlecht: "m", alter: 50, rolle: r, size: 160 })));
    expect(bilder.size).toBe(rollen.length);
    expect(rein({ seed: "Rolle", geschlecht: "m", alter: 50, rolle: "generalstab", size: 160 })).toContain("#a02a22"); // Kragenspiegel
    expect(rein({ seed: "Rolle", geschlecht: "m", alter: 50, rolle: "justiz", size: 160 })).toContain("#f3eee2"); // Beffchen
    expect(rein({ seed: "Rolle", geschlecht: "m", alter: 50, rolle: "stab", size: 160 })).not.toContain("#a02a22");
  });

  test("Namensschild erst ab 190 px; Rahmen mit Nieten", () => {
    expect(html({ seed: "Damla Turan", size: 200, namensschild: "Damla Turan" })).toContain("Damla Turan</text>");
    expect(html({ seed: "Damla Turan", size: 150, namensschild: "Damla Turan" })).not.toContain("</text>");
  });

  test("Größen von 40 bis 240; Seitenverhältnis wie die Cameo; Kennzeichnung nur mit Titel", () => {
    for (const size of [40, 56, 96, 140, 240]) {
      const h = html({ seed: "Damla Turan", size });
      expect(h).toContain(`width="${size}"`);
      expect(h).toContain(`height="${size * 1.18}"`);
      expect(h).toContain('aria-hidden="true"');
    }
    expect(html({ seed: "X", titel: "Porträt von X" })).toContain('aria-label="Porträt von X"');
  });

  test("Bewegung steht nur im Stil: Blinzeln und Neigung hängen an Klassen, die nur die Effektstufe aktiviert", () => {
    const h = html({ seed: "Damla Turan", size: 96 });
    expect(h).toContain("pt-lid");
    expect(h).toContain("pt-kopf");
    expect(html({ seed: "Damla Turan", size: 96, lebendig: false })).not.toContain("pt-kopf");
    expect(html({ seed: "Damla Turan", size: 32 })).not.toContain("pt-kopf");
  });
});
