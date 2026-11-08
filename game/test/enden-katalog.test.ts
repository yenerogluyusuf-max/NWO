// Der Katalog der Enden, des Nachfolger-Wahlkampfs und des Vermächtnisses: vollständig in drei Sprachen, gleiche Platzhalter, formatierbar, nichts Deutsches
// in Türkisch und Englisch. Deutsch ist die Quelle; Türkisch und Englisch sind Entwürfe und von Muttersprachlern zu prüfen.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { formatiere, platzhalter } from "../src/i18n";
import de from "../src/i18n/katalog/de/enden.json";
import tr from "../src/i18n/katalog/tr/enden.json";
import en from "../src/i18n/katalog/en/enden.json";
import deWahl from "../src/i18n/katalog/de/wahl.json";
import type { Params } from "../src/i18n";

const KATALOG = { de: de as Record<string, string>, tr: tr as Record<string, string>, en: en as Record<string, string> };
const WAHL_DE = deWahl as Record<string, string>;

const QUELLEN = ["src/sim/enden.ts", "src/sim/dauerherrscher.ts", "src/ui/Chronik.tsx", "src/sim/ereignisse-wahl.ts", "src/sim/wahlkampf.ts", "src/ui/wahl/Vermaechtnis.tsx", "src/ui/Wahlkampf.tsx", "src/ui/BilanzFenster.tsx"];

const ENDEN_ARTEN = ["abwahl", "sturz", "amtszeitende", "ruecktritt", "putsch", "amtsenthebung", "tod"];
const KRIEGS_AUSGANG = ["sieg", "niederlage", "rueckzug", "weisser_frieden", "frieden", "spannung", "drohkulisse", "beschluss", "krieg", "waffenruhe", "beendet"];
const VERFAHREN = ["abgeschrieben", "ohne_anklage", "freispruch"];
const DUELL = ["klar", "vorn", "gleich", "hinten", "desaster"];
const ART = ["gemeinsam", "allein"];

/** Dynamische Schlüsselfamilien (Vorlage im Quelltext → alle Ausprägungen). */
const FAMILIEN: Record<string, string[]> = {
  "enden.amtsenthebung.${ausgang}.titel": VERFAHREN.map((x) => `enden.amtsenthebung.${x}.titel`),
  "enden.amtsenthebung.${ausgang}.text": VERFAHREN.map((x) => `enden.amtsenthebung.${x}.text`),
  "enden.duell.nachfolger.${stufe}": DUELL.map((x) => `enden.duell.nachfolger.${x}`),
  "enden.wk.auftritt.${art}.${v.punkte >= 0 ? \"gut\" : \"schlecht\"}": ART.flatMap((a) => [`enden.wk.auftritt.${a}.gut`, `enden.wk.auftritt.${a}.schlecht`]),
  "enden.wk.auftritt.${art}.log": ART.map((a) => `enden.wk.auftritt.${a}.log`),
  "vermaechtnis.ende.${d.ende.art}": ENDEN_ARTEN.map((x) => `vermaechtnis.ende.${x}`),
  "vermaechtnis.krieg.${k.ausgang}": KRIEGS_AUSGANG.map((x) => `vermaechtnis.krieg.${x}`),
  "vermaechtnis.epilog.${d.ende.art}": ENDEN_ARTEN.filter((x) => x !== "amtszeitende").map((x) => `vermaechtnis.epilog.${x}`),
};

function schluesselAusQuellen(): { statisch: Set<string>; dynamisch: Set<string> } {
  const statisch = new Set<string>();
  const dynamisch = new Set<string>();
  for (const f of QUELLEN) {
    const s = readFileSync(join(__dirname, "..", f), "utf8");
    for (const m of s.matchAll(/"((?:enden|dauer|vermaechtnis|bilanz\.ui)\.[a-z0-9_.]+)"/g)) statisch.add(m[1]!);
    for (const m of s.matchAll(/`((?:enden|dauer|vermaechtnis)\.[^`]*\$\{[^`]*)`/g)) dynamisch.add(m[1]!);
  }
  return { statisch, dynamisch };
}

describe("Katalog Enden, Nachfolger-Wahlkampf, Vermächtnis", () => {
  test("Alle im Code verwendeten Schlüssel stehen im deutschen Katalog", () => {
    const { statisch, dynamisch } = schluesselAusQuellen();
    const fehlt = [...statisch].filter((k) => !(k in KATALOG.de) && !(k in WAHL_DE));
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
    const strings: Record<string, string> = { von: "2028-06-05", bis: "2033-06-05", datum: "2033-06-05", ergebnis: "ja", gang: "stich", letzte: "ja", hatKosten: "ja" };
    const listen = new Set(["liste", "kosten", "ursachen", "artikel"]);
    for (const lang of ["de", "tr", "en"] as const) {
      for (const [k, v] of Object.entries(KATALOG[lang])) {
        const params: Params = {};
        for (const n of platzhalter(v)) params[n] = n in strings ? strings[n]! : listen.has(n) ? ["A", "B", "C"] : n === "name" || n === "general" || n === "gegner" || n === "rolle" || n === "partei" || n === "text" ? "Name" : 3;
        const text = formatiere(v, params, lang);
        expect(text, `${lang} ${k}`).not.toMatch(/[{}]|undefined|NaN|\[object/);
        expect(text.length, `${lang} ${k}`).toBeGreaterThan(0);
      }
    }
  });

  test("In Türkisch und Englisch steht kein deutscher Text", () => {
    const deutsch = /\b(Prozent|Sitze|Sitzen|Kapital|Amtszeit|Wahlgang|Stichwahl|nicht|und|der|die|das|wird|Wahl|Präsident|Partei)\b/;
    for (const lang of ["tr", "en"] as const) {
      for (const [k, v] of Object.entries(KATALOG[lang])) {
        const ohne = v.replace(/\{[^{}]*\}/g, " ");
        expect(ohne, `${lang} ${k}`).not.toMatch(deutsch);
      }
    }
  });
});
