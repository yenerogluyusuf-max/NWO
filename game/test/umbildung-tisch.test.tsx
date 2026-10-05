// Kabinettstisch: Porträtkarten, Abzeichen, Kandidaten-Schublade, Folgenpanel, Fußleiste; drei Sprachen, keine kaputten Platzhalter.

import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vitest";
import { Umbildung, stimmungVon, type UmbildungProps } from "../src/ui/wahl/Umbildung";
import { platzhalter, setzeSprache } from "../src/i18n";
import type { UmbildungMinister, UmbildungSicht } from "../src/sim/amtszeit";

const EMOJI = /[\u{1F300}-\u{1FAFF}️]/u;
const KAPUTT = /undefined|NaN|\[object|\bnull\b|\$\{|Infinity|⟦/;

afterEach(async () => {
  await setzeSprache("de");
});

const AEMTER: UmbildungMinister["amt"][] = ["finanzen", "inneres", "aussen", "stab", "justiz", "generalstab", "wirtschaft"];

function minister(amt: UmbildungMinister["amt"], i: number, extra: Partial<UmbildungMinister> = {}): UmbildungMinister {
  return {
    amt,
    name: `Person ${i + 1} mit sehr langem Namen Özgür-Yıldırımoğlu`,
    rolle: `Ministerin für ${amt} und besondere Aufgaben im Kabinett`,
    weiblich: i % 2 === 0,
    loyalitaet: 40 + i * 8,
    faehigkeit: 55 + i * 4,
    ehrgeiz: 30 + i * 9,
    groll: i === 2 ? 55 : 0,
    kommissarisch: i === 3,
    kandidaten: [
      { id: `k${i}a`, name: "Aylin Demir", herkunft: "Langjährige Staatssekretärin", staerke: "Kennt das Ressort.", schwaeche: "Wenig Rückhalt in der Partei.", faehigkeit: 70, ehrgeiz: 50, loyalitaet: 60, pk: 4 },
      { id: `k${i}b`, name: "Murat Polat", herkunft: "Haushaltsdirektor der Zentralbank", staerke: "Wird von der Fachwelt ernst genommen.", schwaeche: "Sagt öfter Nein.", faehigkeit: 76, ehrgeiz: 40, loyalitaet: 45, pk: 5 },
    ],
    ...extra,
  };
}

function sicht(extra: Partial<UmbildungSicht> = {}): UmbildungSicht {
  return {
    offen: true,
    anlass: "wiederwahl",
    tageBisEnde: 60,
    minister: AEMTER.map((a, i) => minister(a, i, i === 1 ? { entschieden: "behalten" } : i === 4 ? { entschieden: "ersetzt" } : {})),
    partner: [
      { partei: "YENİ", name: "YENİ Parti", sitze: 86, anspruch: 2, vergeben: 0 },
      { partei: "MHP", name: "MHP", sitze: 40, anspruch: 1, vergeben: 1 },
    ],
    rabatt: 0.5,
    ...extra,
  };
}

const keine = () => {};
const props = (extra: Partial<UmbildungProps> = {}): UmbildungProps => ({
  sicht: sicht(),
  kapital: 40,
  onBehalten: keine,
  onErsetzen: keine,
  onEntlassen: keine,
  onVersetzen: keine,
  onPartner: keine,
  onFertig: keine,
  onSpaeter: keine,
  ...extra,
});
const html = (p: UmbildungProps) => renderToStaticMarkup(createElement(Umbildung, p));

describe("Kabinettstisch", () => {
  test("jede Ministerin und jeder Minister hat eine Porträtkarte mit drei Kennzahlen", () => {
    const h = html(props());
    expect((h.match(/class="ub-karte[ "]/g) ?? []).length).toBe(7);
    const tisch = h.slice(h.indexOf("ub-tisch"), h.indexOf("ub-seite"));
    expect((tisch.match(/class="portraet"/g) ?? []).length).toBe(7);
    expect((tisch.match(/class="ub-wert /g) ?? []).length).toBe(21);
    expect(h).toContain("Loyalität");
    expect(h).toContain("Ehrgeiz");
    expect(h).not.toMatch(KAPUTT);
    expect(h).not.toMatch(EMOJI);
  });

  test("Abzeichen und Stempel nach Zustand", () => {
    const h = html(props({ aspiranten: [{ amt: "aussen", name: "Barış Sezer", staerke: 60, ehrgeiz: 63, rolle: "Außenminister" }] }));
    expect(h).toContain("Kommissarisch");
    expect(h).toContain("Groll");
    expect(h).toContain("Kronprinz");
    expect(h).toContain("ub-stempel behalten");
    expect(h).toContain("ub-stempel ersetzt");
  });

  test("Aktionen: bestätigte Karten sperren Bestätigen; Partnerchips mit Partei; Fußleiste bleibt", () => {
    const h = html(props());
    expect(h).toContain("ub-parteichip");
    expect(h).toContain("YENİ Parti");
    expect(h).toContain("ub-fuss");
    expect(h).toContain("Umbildung abschließen");
    expect(h).toContain("Später");
    // Der Partner MHP hat seinen Anspruch erfüllt: sein Chip ist gesperrt, der von YENİ nicht
    const chips = h.match(/<button[^>]*ub-parteichip[^>]*>/g) ?? [];
    expect(chips.length).toBe(14);
    expect(chips.filter((c) => c.includes("disabled")).length).toBeGreaterThanOrEqual(7);
  });

  test("Folgenpanel zeigt Kapital, Loyalität, Partner und Märkte; Wechsel im Finanzressort beunruhigt die Märkte", () => {
    const ruhig = html(props());
    expect(ruhig).toContain("Folgen");
    expect(ruhig).toContain("Keine Signale an die Märkte.");
    const m = sicht();
    m.minister[0] = minister("finanzen", 0, { entschieden: "ersetzt" });
    expect(html(props({ sicht: m }))).toContain("gilt den Märkten als Signal");
  });

  test("Zählung und geschlossenes Fenster: offen=false sperrt die Aktionen", () => {
    const h = html(props());
    expect(h).toContain("2 von 7 entschieden");
    const zu = html(props({ sicht: sicht({ offen: false }) }));
    expect(zu).toContain("disabled");
  });

  test("Zwischenbilanz erscheint in der Seitenleiste, wenn sie geliefert wird", () => {
    const h = html(
      props({
        zwischenbilanz: {
          kennzahlen: [{ name: "Zustimmung", start: "51 %", ende: "58 %" }],
          ziele: [{ titel: "Inflation unter 15 Prozent", erreicht: true, stand: "jetzt 6,1 %" }],
        } as unknown as UmbildungProps["zwischenbilanz"],
      }),
    );
    expect(h).toContain("Zwischenbilanz");
    expect(h).toContain("Inflation unter 15 Prozent");
  });

  test("Stimmung aus dem Zustand der Person", () => {
    expect(stimmungVon({ groll: 50, ehrgeiz: 0, loyalitaet: 90, kommissarisch: false })).toBe("veraergert");
    expect(stimmungVon({ groll: 0, ehrgeiz: 0, loyalitaet: 90, kommissarisch: false })).toBe("sicher");
    expect(stimmungVon({ groll: 0, ehrgeiz: 0, loyalitaet: 50, kommissarisch: true })).toBe("besorgt");
  });

  test("Türkisch und Englisch: keine kaputten Platzhalter, Texte da", async () => {
    await setzeSprache("tr");
    const tr = html(props());
    expect(tr).not.toMatch(KAPUTT);
    expect(tr).toContain("Kabine");
    expect(tr).toContain("Sonuçlar");
    await setzeSprache("en");
    const en = html(props());
    expect(en).not.toMatch(KAPUTT);
    expect(en).toContain("Consequences");
    expect(en).toContain("Confirm");
  });

  test("Stylesheet: keine Schrift unter 12 px im Umbildungsblock", () => {
    const css = readFileSync("src/ui/wahl/wahl.css", "utf-8");
    const block = css.slice(css.indexOf("/* Umbildung: Kabinettstisch"), css.indexOf("/* Nachtrag der Parlamentswahl"));
    for (const m of block.matchAll(/font:\s*(?:italic\s+)?(?:\d+\s+)?(\d+(?:\.\d+)?)px/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(12);
  });
});

describe("Katalog gesichter.json", () => {
  const lade = (l: string): Record<string, string> => JSON.parse(readFileSync(`src/i18n/katalog/${l}/gesichter.json`, "utf-8"));
  test("alle drei Sprachen haben dieselben Schlüssel und Platzhalter", () => {
    const de = lade("de");
    for (const l of ["tr", "en"]) {
      const x = lade(l);
      expect(Object.keys(x).sort()).toEqual(Object.keys(de).sort());
      for (const k of Object.keys(de)) expect(platzhalter(x[k]!), `${l} ${k}`).toEqual(platzhalter(de[k]!));
    }
  });
});
