// Der Katalog takt.json: vollständig in drei Sprachen, gleiche Platzhalter, formatierbar, nichts Deutsches in Türkisch und Englisch.
// Der deutsche Katalog ist die Quelle; Türkisch und Englisch sind Entwürfe und von Muttersprachlern zu prüfen.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { formatiere, platzhalter } from "../src/i18n";
import de from "../src/i18n/katalog/de/takt.json";
import tr from "../src/i18n/katalog/tr/takt.json";
import en from "../src/i18n/katalog/en/takt.json";
import type { Params } from "../src/i18n";

const KATALOG = { de: de as Record<string, string>, tr: tr as Record<string, string>, en: en as Record<string, string> };

const QUELLEN = [
  "src/sim/ereignisse-saison.ts",
  "src/sim/ereignisse-personen.ts",
  "src/sim/takt.ts",
  "src/sim/kabinett.ts",
  "src/sim/berichte.ts",
  "src/ui/schreibtisch/briefing.ts",
  "src/ui/politik/BerichtAkte.tsx",
  "src/sim/ereignisse.ts",
];

describe("Katalog takt.json", () => {
  test("Alle im Code verwendeten festen Schlüssel stehen im deutschen Katalog", () => {
    const fehlt: string[] = [];
    for (const f of QUELLEN) {
      const s = readFileSync(join(__dirname, "..", f), "utf8");
      for (const m of s.matchAll(/"(takt\.[a-z0-9_.]+)"/g)) if (!(m[1]! in KATALOG.de)) fehlt.push(`${f}: ${m[1]}`);
    }
    expect(fehlt).toEqual([]);
  });

  test("Türkisch und Englisch haben dieselben Schlüssel wie Deutsch, und nur diese", () => {
    expect(Object.keys(KATALOG.tr).sort()).toEqual(Object.keys(KATALOG.de).sort());
    expect(Object.keys(KATALOG.en).sort()).toEqual(Object.keys(KATALOG.de).sort());
  });

  test("Jede Übersetzung hat dieselben Platzhalter wie das Original", () => {
    for (const [k, v] of Object.entries(KATALOG.de)) {
      expect(platzhalter(KATALOG.tr[k]!), `tr ${k}`).toEqual(platzhalter(v));
      expect(platzhalter(KATALOG.en[k]!), `en ${k}`).toEqual(platzhalter(v));
    }
  });

  test("Jede Vorlage lässt sich in jeder Sprache formatieren, ohne offene Platzhalter", () => {
    for (const lang of ["de", "tr", "en"] as const) {
      for (const [k, v] of Object.entries(KATALOG[lang])) {
        const params: Params = {};
        for (const n of platzhalter(v)) params[n] = /^(land|name|wer|rolle|titel|antwort|groesse|beste|schlechteste)$/.test(n) ? "Syrien" : 3;
        const text = formatiere(v, params, lang);
        expect(text, `${lang} ${k}`).not.toMatch(/[{}]|undefined|NaN|\[object/);
        expect(text.length, `${lang} ${k}`).toBeGreaterThan(0);
      }
    }
  });

  test("In Türkisch und Englisch steht kein deutscher Text", () => {
    const deutsch = /\b(Prozent|Kapital|Amtszeit|Zusage|Wahl|nicht|und|der|die|das|wird|Ereignis|Bericht)\b/;
    for (const lang of ["tr", "en"] as const) {
      for (const [k, v] of Object.entries(KATALOG[lang])) {
        const ohne = v.replace(/\{[^{}]*\}/g, " ");
        expect(ohne, `${lang} ${k}`).not.toMatch(deutsch);
      }
    }
  });
});
