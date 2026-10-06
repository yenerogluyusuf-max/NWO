// Die Vorlagen des Ministerflusses in drei Sprachen: gleiche Schlüssel und Platzhalter, keine deutschen Bausteine in Türkisch und
// Englisch, und was der Spielstand von Vorlagen behält (gesehen, verfallen), folgt als Meldung dem Sprachwechsel; alte Texte bleiben lesbar.

import { afterEach, describe, expect, test } from "vitest";
import de from "../src/i18n/katalog/de/ministerfluss.json";
import tr from "../src/i18n/katalog/tr/ministerfluss.json";
import en from "../src/i18n/katalog/en/ministerfluss.json";
import { platzhalter, rendere, setzeSprache } from "../src/i18n";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { flussZustand, ministerVorlagen, pflegeVorlagen } from "../src/sim/ministerfluss";

afterEach(async () => {
  await setzeSprache("de");
});

function gealtert() {
  const w = createWorld(turkey2026, 7);
  startAfterElection(w, schnellProfil());
  advance(w, 240);
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 80;
  return w;
}

// Bausteine, die nur aus ministerfluss.ts kommen könnten (Namen, Zusagetexte und Größen aus anderen Modulen sind ausgenommen)
const DEUTSCH = /\b(Später|Nicht tun|Zur Kenntnis|Frist |Tragweite|neu auf dem Tisch|Kapital im Gesetz|fehlen etwa|die Mehrheit steht|bis zur vollen Wirkung|rät, noch zu warten|empfiehlt „|legt nichts mehr vor|Ziel setzen)/;

describe("Ministerfluss-Katalog", () => {
  test("hat in allen Sprachen dieselben Schlüssel und Platzhalter", () => {
    const d = de as Record<string, string>;
    for (const [name, k] of [["tr", tr], ["en", en]] as const) {
      const kk = k as Record<string, string>;
      expect(Object.keys(kk).sort(), name).toEqual(Object.keys(d).sort());
      // Das Türkische kennt kein grammatisches Geschlecht: Dort darf „weiblich“ fehlen
      const ohne = (l: string[]) => (name === "tr" ? l.filter((x) => x !== "weiblich") : l);
      for (const key of Object.keys(d)) expect(platzhalter(kk[key]!).sort(), `${name} ${key}`).toEqual(ohne(platzhalter(d[key]!)).sort());
    }
  });

  test("Vorlagen auf Türkisch und Englisch ohne deutsche Bausteine aus dem Ministerfluss", async () => {
    for (const sprache of ["tr", "en"] as const) {
      await setzeSprache(sprache);
      const w = gealtert();
      const vs = ministerVorlagen(w, { tiefe: 6 });
      expect(vs.length).toBeGreaterThan(2);
      for (const v of vs) {
        const texte = [v.titel, v.prioritaetGrund, ...v.optionen.flatMap((o) => [o.label, o.text ?? "", ...o.folgen, o.grund ?? ""]), v.empfehlung?.grund ?? "", v.empfehlung?.hinweis ?? ""];
        for (const x of texte) expect(DEUTSCH.test(x), `${sprache}: ${x}`).toBe(false);
      }
    }
  });

  test("gesehene und verfallene Vorlagen liegen als Meldung im Spielstand; alte Texte bleiben lesbar", async () => {
    const w = gealtert();
    pflegeVorlagen(w);
    const z = flussZustand(w);
    const mitMeldung = Object.values(z.gesehen).filter((g) => typeof g.titel !== "string");
    expect(mitMeldung.length).toBeGreaterThan(0);
    // Alter Spielstand: fertiger deutscher Text statt Meldung
    z.verfallen.push({ id: "alt", titel: "Alter Titel", amt: "stab", quelle: "lage", seit: 0, verfallen: 1, grund: "Alter Grund." });
    const json = JSON.parse(JSON.stringify(z));
    expect(rendere(json.verfallen.at(-1).titel)).toBe("Alter Titel");
    await setzeSprache("en");
    const g = mitMeldung[0]!;
    expect(rendere(g.titel)).not.toBe("");
    expect(DEUTSCH.test(rendere(g.titel))).toBe(false);
  });
});
