// Der Katalog des Schreibtischs (Tagesbriefing, Warnungen, Termine, Empfehlungen, „Stand der Dinge“) in drei Sprachen:
// gleiche Schlüssel, gleiche Platzhalter, und das Briefing rendert auf Türkisch und Englisch ohne deutsche Reste.
import { afterEach, describe, expect, it } from "vitest";
import de from "../src/i18n/katalog/de/schreibtisch.json";
import tr from "../src/i18n/katalog/tr/schreibtisch.json";
import en from "../src/i18n/katalog/en/schreibtisch.json";
import { platzhalter, setzeSprache } from "../src/i18n";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { briefing } from "../src/ui/schreibtisch/briefing";

// Deutsch nennt das Land im Dativ aus den Länderdaten („zu Griechenland“); Türkisch und Englisch brauchen den Namen
const AUSNAHMEN = new Set(["sk.e.l.text"]);

afterEach(async () => {
  await setzeSprache("de");
});

/** Wörter, die nur in deutschen Satzbausteinen des Briefings stehen (Eigennamen aus den Daten bleiben außen vor) */
const DEUTSCH = /\b(Kapital ist|Zustimmung|Amtsantritt|Abstimmung|Sitze|Monaten|Tagen|heute|morgen|fällig|Frist|Wahlanteil|je Dollar|Präsident|Mehrheit)\b/;

describe("Schreibtisch-Katalog", () => {
  for (const sprache of ["tr", "en"] as const) {
    it(`rendert das Briefing auf ${sprache} ohne deutsche Satzbausteine`, async () => {
      const w = createWorld(turkey2026, 6);
      startAfterElection(w, schnellProfil());
      w.spiel!.kapital = 5;
      await setzeSprache(sprache);
      const b = briefing(w);
      const texte = [
        ...b.kennzahlen.flatMap((k) => [k.label, k.wert, k.zusatz]),
        ...b.warnungen.flatMap((x) => [x.text, x.warum]),
        ...b.termine.map((x) => `${x.datum} ${x.text}`),
        ...b.empfehlungen.flatMap((e) => [e.rat, e.kosten ?? ""]),
        ...(b.verfassung ? [b.verfassung.stufeName, b.verfassung.fluss] : []),
      ];
      expect(b.warnungen.some((x) => x.id === "kapital")).toBe(true);
      for (const x of texte) {
        expect(x, x).not.toMatch(DEUTSCH);
        expect(x, x).not.toMatch(/⟦|NaN|undefined/);
      }
    });
  }

  it("hat in allen Sprachen dieselben Schlüssel und Platzhalter", () => {
    for (const [name, kat] of [["tr", tr], ["en", en]] as const) {
      expect(Object.keys(kat).sort(), name).toEqual(Object.keys(de).sort());
      for (const [k, v] of Object.entries(de)) {
        if (AUSNAHMEN.has(k)) continue;
        expect(platzhalter((kat as Record<string, string>)[k]!), `${name} ${k}`).toEqual(platzhalter(v));
      }
    }
  });
});

// Feste Sichttexte der Oberfläche (aus JSX übernommen, Katalog oberflaeche.json): in allen drei Sprachen vorhanden und nie leer
import ofDe from "../src/i18n/katalog/de/oberflaeche.json";
import ofTr from "../src/i18n/katalog/tr/oberflaeche.json";
import ofEn from "../src/i18n/katalog/en/oberflaeche.json";
describe("Oberflächen-Katalog", () => {
  it("hat in allen Sprachen dieselben Schlüssel, ohne leere Texte und ohne Platzhalter", () => {
    for (const [name, kat] of [["tr", ofTr], ["en", ofEn]] as const) {
      expect(Object.keys(kat).sort(), name).toEqual(Object.keys(ofDe).sort());
      for (const [k, v] of Object.entries(kat as Record<string, string>)) {
        expect(v.trim().length, `${name} ${k}`).toBeGreaterThan(0);
        expect(platzhalter(v), `${name} ${k}`).toEqual([]);
      }
    }
  });
});
