// Übersetzungsschicht: Meldungsformat, türkische Fallendungen, Rückfallkette, Meldungen im Spielstand.

import { afterEach, describe, expect, it } from "vitest";
import { ek, formatiere, msg, platzhalter, registriere, rendere, setzeSprache, t, tIn } from "../src/i18n";

afterEach(async () => {
  await setzeSprache("de");
});

describe("türkische Fallendungen (Eigennamen)", () => {
  const faelle: [string, string, string][] = [
    ["Almanya", "dat", "Almanya’ya"], ["Almanya", "akk", "Almanya’yı"], ["Almanya", "gen", "Almanya’nın"],
    ["Almanya", "loc", "Almanya’da"], ["Almanya", "abl", "Almanya’dan"], ["Almanya", "ins", "Almanya’yla"],
    ["Irak", "dat", "Irak’a"], ["Irak", "loc", "Irak’ta"], ["Irak", "abl", "Irak’tan"], ["Irak", "ins", "Irak’la"], ["Irak", "gen", "Irak’ın"], ["Irak", "akk", "Irak’ı"],
    ["Ankara", "dat", "Ankara’ya"], ["Ankara", "loc", "Ankara’da"],
    ["İstanbul", "loc", "İstanbul’da"], ["İstanbul", "dat", "İstanbul’a"], ["İstanbul", "akk", "İstanbul’u"], ["İstanbul", "gen", "İstanbul’un"],
    ["Berlin", "loc", "Berlin’de"], ["Berlin", "ins", "Berlin’le"], ["Berlin", "gen", "Berlin’in"],
    ["Paris", "loc", "Paris’te"], ["Paris", "abl", "Paris’ten"],
    ["Brüksel", "loc", "Brüksel’de"], ["Brüksel", "akk", "Brüksel’i"],
    ["Rusya", "dat", "Rusya’ya"], ["Rusya", "ins", "Rusya’yla"],
    ["Ürdün", "gen", "Ürdün’ün"], ["Ürdün", "loc", "Ürdün’de"],
    ["Suriye", "dat", "Suriye’ye"], ["Suriye", "gen", "Suriye’nin"], ["Suriye", "akk", "Suriye’yi"], ["Suriye", "ins", "Suriye’yle"],
    ["İran", "dat", "İran’a"], ["Mısır", "gen", "Mısır’ın"], ["Mısır", "loc", "Mısır’da"],
    ["Çin", "loc", "Çin’de"], ["Çin", "abl", "Çin’den"],
    ["Gaziantep", "loc", "Gaziantep’te"], ["Gaziantep", "abl", "Gaziantep’ten"], ["Gaziantep", "dat", "Gaziantep’e"],
    ["Hatay", "dat", "Hatay’a"], ["Hatay", "gen", "Hatay’ın"],
    ["Diyarbakır", "loc", "Diyarbakır’da"], ["Mersin", "abl", "Mersin’den"], ["Van", "loc", "Van’da"], ["Kayseri", "dat", "Kayseri’ye"],
    ["ABD", "dat", "ABD’ye"], ["ABD", "gen", "ABD’nin"], ["ABD", "ins", "ABD’yle"], ["ABD", "loc", "ABD’de"], ["ABD", "akk", "ABD’yi"],
    ["AB", "dat", "AB’ye"], ["AB", "loc", "AB’de"],
    ["NATO", "dat", "NATO’ya"], ["NATO", "gen", "NATO’nun"], ["NATO", "loc", "NATO’da"],
    ["TBMM", "dat", "TBMM’ye"], ["TBMM", "gen", "TBMM’nin"], ["TBMM", "loc", "TBMM’de"],
    ["AYM", "dat", "AYM’ye"], ["PKK", "dat", "PKK’ya"],
    // Gattungsnamen bekommen keinen Apostroph
    ["hükümet", "dat", "hükümete"], ["hükümet", "loc", "hükümette"],
  ];
  it.each(faelle)("%s + %s → %s", (wort, fall, soll) => {
    expect(ek(wort, fall as Parameters<typeof ek>[1])).toBe(soll);
  });

  it("lässt den Grundfall und Wörter mit Apostroph unverändert", () => {
    expect(ek("Ankara", "nom")).toBe("Ankara");
    expect(ek("Ankara’ya", "dat")).toBe("Ankara’ya");
  });
});

describe("Meldungsformat", () => {
  it("setzt Werte ein und zeigt fehlende Werte sichtbar", () => {
    expect(formatiere("Hallo {name}", { name: "Welt" }, "de")).toBe("Hallo Welt");
    expect(formatiere("Hallo {name}", {}, "de")).toBe("Hallo {name}");
  });

  it("formatiert Zahlen nach Sprache", () => {
    expect(formatiere("{n, number}", { n: 1234.5 }, "de")).toBe("1.234,5");
    expect(formatiere("{n, number}", { n: 1234.5 }, "en")).toBe("1,234.5");
    expect(formatiere("{n, number}", { n: 1234.5 }, "tr")).toBe("1.234,5");
    expect(formatiere("{n, number, 1}", { n: 17 }, "de")).toBe("17,0");
    expect(formatiere("{n, number, 1}", { n: 17 }, "en")).toBe("17.0");
  });

  it("formatiert Prozent nach Sprache", () => {
    expect(formatiere("{n, prozent, 1}", { n: 17.5 }, "de")).toBe("17,5 %");
    expect(formatiere("{n, prozent, 1}", { n: 17.5 }, "tr")).toBe("%17,5");
    expect(formatiere("{n, prozent, 1}", { n: 17.5 }, "en")).toBe("17.5%");
  });

  it("formatiert Daten nach Sprache", () => {
    expect(formatiere("{d, date}", { d: "2030-05-05" }, "de")).toBe("5. Mai 2030");
    expect(formatiere("{d, date}", { d: "2030-05-05" }, "tr")).toBe("5 Mayıs 2030");
    expect(formatiere("{d, date}", { d: "2030-05-05" }, "en")).toBe("5 May 2030");
    expect(formatiere("{d, date, monat}", { d: "2030-05-05" }, "de")).toBe("Mai 2030");
    expect(formatiere("{d, date, monat}", { d: "2030-05-05" }, "tr")).toBe("Mayıs 2030");
  });

  it("wählt die Mehrzahl nach Sprachregel", () => {
    const de = "{n, plural, one {# Provinz} other {# Provinzen}}";
    const tr = "{n, plural, other {# il}}";
    expect(formatiere(de, { n: 1 }, "de")).toBe("1 Provinz");
    expect(formatiere(de, { n: 3 }, "de")).toBe("3 Provinzen");
    expect(formatiere(tr, { n: 3 }, "tr")).toBe("3 il");
    expect(formatiere("{n, plural, =0 {keine} one {eine} other {#}}", { n: 0 }, "de")).toBe("keine");
    expect(formatiere("{n, plural, other {# Provinzen}}", { n: 1200 }, "de")).toBe("1.200 Provinzen");
  });

  it("wählt nach Wert (select), mit Rückfall other", () => {
    const v = "{g, select, f {Ministerin} m {Minister} other {Amtsperson}}";
    expect(formatiere(v, { g: "f" }, "de")).toBe("Ministerin");
    expect(formatiere(v, { g: "x" }, "de")).toBe("Amtsperson");
  });

  it("bildet Aufzählungen", () => {
    const l = ["A", "B", "C"];
    expect(formatiere("{l, list}", { l }, "de")).toBe("A, B und C");
    expect(formatiere("{l, list}", { l }, "tr")).toBe("A, B ve C");
    expect(formatiere("{l, list}", { l }, "en")).toBe("A, B and C");
    expect(formatiere("{l, list, oder}", { l }, "de")).toBe("A, B oder C");
  });

  it("wendet Fälle an: Formen des Eigennamens, sonst im Türkischen die Lautregeln", () => {
    const syrien = { nom: "Syrien", dat: "Syrien", akk: "Syrien" };
    expect(formatiere("Gespräche mit {land|dat}", { land: syrien }, "de")).toBe("Gespräche mit Syrien");
    expect(formatiere("{land|dat} gönderildi", { land: "Almanya" }, "tr")).toBe("Almanya’ya gönderildi");
    expect(formatiere("{land|dat} gönderildi", { land: { nom: "Almanya" } }, "tr")).toBe("Almanya’ya gönderildi");
    expect(formatiere("{land|dat} gönderildi", { land: { nom: "Almanya", dat: "Almanya’ya" } }, "tr")).toBe("Almanya’ya gönderildi");
    // Deutsch und Englisch ändern ein einfaches Wort nicht
    expect(formatiere("with {land|dat}", { land: "Germany" }, "en")).toBe("with Germany");
  });

  it("schreibt nach Sprache groß: türkisches i/İ und ı/I", () => {
    expect(formatiere("{s|gross}", { s: "istanbul" }, "tr")).toBe("İSTANBUL");
    expect(formatiere("{s|gross}", { s: "ılık" }, "tr")).toBe("ILIK");
    expect(formatiere("{s|anfang}", { s: "istanbul" }, "tr")).toBe("İstanbul");
    expect(formatiere("{s|gross}", { s: "straße" }, "de")).toBe("STRASSE");
  });

  it("schreibt wörtliche Klammern mit doppelter Klammer", () => {
    expect(formatiere("{{x}} und {y}", { y: 1 }, "de")).toBe("{x} und 1");
  });

  it("verschachtelt Mehrzahl und Einsatzwerte", () => {
    const v = "{n, plural, one {Ein Fall in {ort|dat}} other {# Fälle in {ort|dat}}}";
    expect(formatiere(v, { n: 2, ort: "Hatay" }, "de")).toBe("2 Fälle in Hatay");
    expect(formatiere("{n, plural, other {{ort|loc} # vaka}}", { n: 2, ort: "Hatay" }, "tr")).toBe("Hatay’da 2 vaka");
  });

  it("nennt die Platzhalter einer Vorlage (für den Vergleich der Sprachen)", () => {
    expect(platzhalter("{a} und {n, plural, one {{b}} other {# {c}}}")).toEqual(["a", "b", "c", "n"]);
  });

  it("meldet kaputte Vorlagen", () => {
    expect(() => formatiere("{a", {}, "de")).toThrow();
    expect(() => formatiere("{n, plural, one {x}}", { n: 2 }, "de")).toThrow();
  });
});

describe("Katalog und Rückfall", () => {
  it("findet Texte je Sprache und fällt auf Englisch, dann Deutsch zurück", async () => {
    registriere("de", { "test.a": "Zeile {n}", "test.nur_de": "nur deutsch", "test.de_en": "auf Deutsch" });
    registriere("en", { "test.a": "Line {n}", "test.de_en": "in English" });
    registriere("tr", { "test.a": "Satır {n}" });
    expect(tIn("de", "test.a", { n: 2 })).toBe("Zeile 2");
    expect(tIn("tr", "test.a", { n: 2 })).toBe("Satır 2");
    expect(tIn("tr", "test.de_en")).toBe("in English");
    expect(tIn("tr", "test.nur_de")).toBe("nur deutsch");
    expect(tIn("de", "test.fehlt")).toMatch(/test\.fehlt/);
  });

  it("wechselt die Sprache für t()", async () => {
    registriere("de", { "test.b": "Neues Spiel" });
    registriere("tr", { "test.b": "Yeni oyun" });
    registriere("en", { "test.b": "New game" });
    expect(t("test.b")).toBe("Neues Spiel");
    await setzeSprache("tr");
    expect(t("test.b")).toBe("Yeni oyun");
    await setzeSprache("en");
    expect(t("test.b")).toBe("New game");
  });

  it("speichert Meldungen als Schlüssel und rendert sie in der aktuellen Sprache; alte Texte bleiben Texte", async () => {
    registriere("de", { "test.c": "Waffenruhe mit {land}" });
    registriere("en", { "test.c": "Ceasefire with {land}" });
    const m = msg("test.c", { land: "Syrien" });
    expect(JSON.parse(JSON.stringify(m))).toEqual(m);
    expect(rendere(m)).toBe("Waffenruhe mit Syrien");
    await setzeSprache("en");
    expect(rendere(m)).toBe("Ceasefire with Syrien");
    expect(rendere("Ein alter Text aus dem Spielstand")).toBe("Ein alter Text aus dem Spielstand");
  });
});
