// Die Kataloge für Wahl, Umbildung, Ziele und Bilanz: vollständig in drei Sprachen, gleiche Platzhalter, formatierbar, nichts Deutsches in Türkisch und Englisch.
// Der deutsche Katalog ist die Quelle; Türkisch und Englisch sind Entwürfe und von Muttersprachlern zu prüfen.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { formatiere, platzhalter } from "../src/i18n";
import de from "../src/i18n/katalog/de/wahl.json";
import tr from "../src/i18n/katalog/tr/wahl.json";
import en from "../src/i18n/katalog/en/wahl.json";
import type { Params } from "../src/i18n";

const KATALOG = { de: de as Record<string, string>, tr: tr as Record<string, string>, en: en as Record<string, string> };

const QUELLEN = ["src/sim/wahl.ts", "src/sim/amtszeit.ts", "src/sim/ereignisse-wahl.ts", "src/sim/ziele.ts", "src/sim/bilanz.ts", "src/ui/wahl/Wahlabend.tsx", "src/ui/wahl/Umbildung.tsx", "src/ui/ZielWahl.tsx", "src/ui/wahl/ParlamentNachtrag.tsx"];

const TON = ["einend", "triumph", "bescheiden"];
const WER = ["opposition", "wahlrat", "ausland", "maerkte", "partei"];
const ENTSCHIEDEN = ["behalten", "ersetzt", "versetzt", "entlassen"];
const BEREICH = ["wirtschaft", "land", "aussen", "staat"];

/** Dynamische Schlüsselfamilien (Vorlage im Quelltext → alle Ausprägungen). */
const FAMILIEN: Record<string, string[]> = {
  "wahl.rede.${ton}": TON.map((x) => `wahl.rede.${x}`),
  "wahl.rede.${ton}_ausgang": TON.map((x) => `wahl.rede.${x}_ausgang`),
  "wahl.rede.${rede.ton}_ausgang": TON.map((x) => `wahl.rede.${x}_ausgang`),
  "wahl.ui.rede.${ton}_beschr": TON.map((x) => `wahl.ui.rede.${x}_beschr`),
  "wahl.ui.wer.${wer}": WER.map((x) => `wahl.ui.wer.${x}`),
  "umbildung.ui.entschieden.${m.entschieden}": ENTSCHIEDEN.map((x) => `umbildung.ui.entschieden.${x}`),
  "ziel.bereich.${g.bereich}": BEREICH.map((x) => `ziel.bereich.${x}`),
};

function schluesselAusQuellen(): { statisch: Set<string>; dynamisch: Set<string> } {
  const statisch = new Set<string>();
  const dynamisch = new Set<string>();
  for (const f of QUELLEN) {
    const s = readFileSync(join(__dirname, "..", f), "utf8");
    for (const m of s.matchAll(/"((?:wahl|umbildung|amtszeit|nachfolge|ziel|bilanz)\.[a-z0-9_.]+)"/g)) statisch.add(m[1]!);
    for (const m of s.matchAll(/`((?:wahl|umbildung|amtszeit|nachfolge|ziel|bilanz)\.[^`]*\$\{[^`]*)`/g)) dynamisch.add(m[1]!);
  }
  return { statisch, dynamisch };
}

describe("Kataloge Wahl, Umbildung, Ziele, Bilanz", () => {
  test("Alle im Code verwendeten Schlüssel stehen im deutschen Katalog", () => {
    const { statisch, dynamisch } = schluesselAusQuellen();
    const fehlt = [...statisch].filter((k) => !(k in KATALOG.de));
    expect(fehlt).toEqual([]);
    for (const d of dynamisch) {
      expect(FAMILIEN[d], `unbekannte Schlüsselfamilie ${d}`).toBeDefined();
      for (const k of FAMILIEN[d]!) expect(k in KATALOG.de, k).toBe(true);
    }
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
    const strings: Record<string, string> = { datum: "2033-06-05", d: "2033-06-05", gang: "stich", richtung: "plus", hatRivale: "ja", letzte: "ja" };
    for (const lang of ["de", "tr", "en"] as const) {
      for (const [k, v] of Object.entries(KATALOG[lang])) {
        const params: Params = {};
        for (const n of platzhalter(v)) params[n] = n in strings ? strings[n]! : n === "liste" || n === "parteien" || n === "ziele" ? ["A", "B", "C"] : 3;
        const text = formatiere(v, params, lang);
        expect(text, `${lang} ${k}`).not.toMatch(/[{}]|undefined|NaN|\[object/);
        expect(text.length, `${lang} ${k}`).toBeGreaterThan(0);
      }
    }
  });

  test("In Türkisch und Englisch steht kein deutscher Text", () => {
    const deutsch = /\b(Prozent|Sitze|Sitzen|Kapital|Amtszeit|Wahlgang|Stichwahl|nicht|und|der|die|das|wird|Wahl)\b/;
    for (const lang of ["tr", "en"] as const) {
      for (const [k, v] of Object.entries(KATALOG[lang])) {
        // Parteinamen und Eigennamen bleiben; geprüft wird der Text ohne Platzhalter
        const ohne = v.replace(/\{[^{}]*\}/g, " ");
        expect(ohne, `${lang} ${k}`).not.toMatch(deutsch);
      }
    }
  });
});
