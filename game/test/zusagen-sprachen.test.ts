// Zusagen erscheinen in der Sprache des Spielers: die vier Zusagen des Wahlprogramms über ihre feste Kennung (auch in älteren
// Spielständen), neue Zusagen über die gespeicherte Meldung; der deutsche Wortlaut bleibt für Prüfungen am Text erhalten.
import { afterEach, describe, expect, it } from "vitest";
import de from "../src/i18n/katalog/de/zusagen.json";
import tr from "../src/i18n/katalog/tr/zusagen.json";
import en from "../src/i18n/katalog/en/zusagen.json";
import { msg, platzhalter, setzeSprache } from "../src/i18n";
import { zusageText, zusageVon } from "../src/sim/zusagen";
import { istMinisterienZusage } from "../src/sim/ressortvergabe";
import type { Zusage } from "../src/sim/spiel-typen";

afterEach(async () => {
  await setzeSprache("de");
});

const alt: Zusage = { id: "z-ministerien", von: "YENİ", text: "Der YENİ Parti wurden zwei Ministerien zugesagt", faellig: 45, erfuellt: false, gebrochen: false };

describe("Zusagen in drei Sprachen", () => {
  it("haben in allen Katalogen dieselben Schlüssel und Platzhalter", () => {
    for (const k of Object.keys(de) as (keyof typeof de)[]) {
      expect(platzhalter(tr[k])).toEqual(platzhalter(de[k]));
      expect(platzhalter(en[k])).toEqual(platzhalter(de[k]));
    }
    expect(Object.keys(tr).sort()).toEqual(Object.keys(de).sort());
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
  });

  it("übersetzt die Startzusage eines älteren Spielstands über die Kennung", async () => {
    expect(zusageText(alt)).toBe(alt.text);
    await setzeSprache("tr");
    expect(zusageText(alt)).toBe("YENİ Parti'ye iki bakanlık sözü verildi");
    await setzeSprache("en");
    expect(zusageText(alt)).toBe("YENİ Parti was promised two ministries");
  });

  it("nutzt die gespeicherte Meldung und behält den deutschen Text für die Prüfung", async () => {
    const z: Zusage = { id: "z-CHP-10-0", von: "CHP", text: "Die CHP erwartet 2 weitere Ministerien", msg: msg("umbildung.zusage", { partei: "CHP", n: 2 }), faellig: 130, erfuellt: false, gebrochen: false };
    expect(istMinisterienZusage(z)).toBe(true);
    await setzeSprache("en");
    expect(zusageText(z)).toBe("The CHP expects 2 more ministries");
    expect(zusageVon("EU-Kommission")).toBe("European Commission");
    expect(zusageVon("Denkmalbehörde von Hatay")).toBe("Heritage authority of Hatay");
    expect(zusageVon("CHP")).toBe("CHP");
  });
});
