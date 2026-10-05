// Marken auf der Karte: Lage und Rang, Texte der Tafel in drei Sprachen, Anreicherung aus dem Reich-Zustand, Legende und Plural der Bezirkstafel.
// UI ohne Browser: renderToStaticMarkup (kein jsdom); Überfahren, Klick und Zusammenrücken prüft die Sichtprüfung im Browser.

import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { beginne, reichZustand } from "../src/sim/reich";
import { VORHABEN } from "../src/data/reich";
import { ZUSTAND_GEFAHR, ZUSTAND_VERFALL, ereignisMarkenText, lageVon, rangVon, reichMarken } from "../src/ui/atlas/marken";
import { MarkenForm } from "../src/ui/atlas/MarkenForm";
import { MarkenLegende } from "../src/ui/atlas/MarkenLegende";
import { registriere, setzeSprache, t, tIn } from "../src/i18n";
import type { World } from "../src/sim/types";

import dePlural from "../src/i18n/katalog/de/karte.json";
import trKarte from "../src/i18n/katalog/tr/karte.json";
import enKarte from "../src/i18n/katalog/en/karte.json";
import { platzhalter } from "../src/i18n";

registriere("de", dePlural);
registriere("tr", trKarte);
registriere("en", enKarte);

afterEach(async () => {
  await setzeSprache("de");
});

function welt(seed = 21): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.kapital = 900;
  return w;
}

describe("Lage und Rang", () => {
  test("Bau ist im Bau oder pausiert; fertige Stücke nach Zustand", () => {
    expect(lageVon("bau", undefined)).toBe("imBau");
    expect(lageVon("bau", undefined, true)).toBe("pausiert");
    expect(lageVon("wunder", 90)).toBe("fertig");
    expect(lageVon("erbe", ZUSTAND_VERFALL)).toBe("fertig");
    expect(lageVon("erbe", ZUSTAND_VERFALL - 1)).toBe("verfallen");
    expect(lageVon("erbe", ZUSTAND_GEFAHR - 1)).toBe("gefahr");
    expect(lageVon("wunder", undefined)).toBe("fertig");
  });
  test("Rang: Gefahr vor Bau, Bau vor Wunder, Wunder vor Erbe", () => {
    expect(rangVon("erbe", "gefahr")).toBeGreaterThan(rangVon("bau", "imBau"));
    expect(rangVon("bau", "imBau")).toBeGreaterThan(rangVon("wunder", "fertig"));
    expect(rangVon("wunder", "fertig")).toBeGreaterThan(rangVon("erbe", "fertig"));
  });
});

describe("Marken aus dem Reich-Zustand", () => {
  test("Kulturerbe-Ebene: eine Marke je Stätte mit Zustand, Ort, Tafeltext und Rang", () => {
    const w = welt();
    const orte = reichMarken(w, "erbe").filter((o) => o.art === "erbe");
    expect(orte.length).toBeGreaterThan(20);
    for (const o of orte) {
      expect(o.name).toBeTruthy();
      expect(o.ortName).toBeTruthy();
      expect(o.artText).toBe("Kulturerbe");
      expect(o.zeile).toMatch(/Zustand \d+ von 100/);
      expect(o.naechste).toBeTruthy();
      expect(o.klick).toMatch(/Klick/);
      expect(o.text).toContain(o.name!);
      expect(["fertig", "verfallen", "gefahr"]).toContain(o.lage);
    }
    // Schlecht erhaltene Stätten führen in den Reiter Pflegen, gute in die Lage
    const schlecht = orte.find((o) => o.lage === "gefahr" || o.lage === "verfallen");
    if (schlecht) expect(schlecht.klickTab).toBe("bestand");
    const gut = orte.find((o) => o.lage === "fertig");
    if (gut) expect(gut.klickTab).toBe("lage");
  });

  test("Ein begonnenes Vorhaben erscheint als Bau mit Fortschritt, Restdauer und Ort", () => {
    const w = welt();
    let id: string | null = null;
    for (const v of VORHABEN.filter((x) => x.ort && ["wunder", "grossprojekt", "serie", "ausbau"].includes(x.klasse)).slice(0, 80)) {
      const r = beginne(w, v.id);
      if (r.ok) {
        id = v.id;
        break;
      }
    }
    expect(id).not.toBeNull();
    const bau = reichMarken(w, "gelaende").find((o) => o.id === `v:${id}`)!;
    expect(bau.art).toBe("bau");
    expect(bau.lage === "imBau" || bau.lage === "pausiert").toBe(true);
    expect(bau.fortschritt).toBeGreaterThanOrEqual(0);
    expect(bau.fortschritt).toBeLessThanOrEqual(1);
    expect(bau.zeile).toMatch(/Fortschritt \d+/);
    expect(bau.rest).toMatch(/Monat|Fertigstellung/);
    expect(bau.artText).toBe("Bauvorhaben");
    expect(bau.klickTab).toBe("lage");
    expect(bau.rang).toBe(3);
  });

  test("Ein fertiges Stück wird als Wunder in Gold gezeigt, mit Zustand", () => {
    const w = welt();
    const z = reichZustand(w);
    const v = VORHABEN.find((x) => x.ort && x.klasse === "wunder")!;
    z.bestand[v.id] = { seit: w.date, zustand: 85 };
    const m = reichMarken(w, "gelaende").find((o) => o.id === `v:${v.id}`)!;
    expect(m.art).toBe("wunder");
    expect(m.lage).toBe("fertig");
    expect(m.zeile).toMatch(/Zustand 85/);
    z.bestand[v.id]!.zustand = 30;
    const schlecht = reichMarken(w, "gelaende").find((o) => o.id === `v:${v.id}`)!;
    expect(schlecht.lage).toBe("gefahr");
    expect(schlecht.naechste).toMatch(/restaur/i);
  });
});

describe("Texte in drei Sprachen", () => {
  test("alle Schlüssel haben in allen Sprachen dieselben Platzhalter", () => {
    for (const k of Object.keys(dePlural)) {
      expect(trKarte, k).toHaveProperty([k]);
      expect(enKarte, k).toHaveProperty([k]);
      const ph = platzhalter((dePlural as Record<string, string>)[k]!).filter((x) => x !== "n");
      expect(platzhalter((trKarte as Record<string, string>)[k]!).filter((x) => x !== "n"), k).toEqual(ph);
      expect(platzhalter((enKarte as Record<string, string>)[k]!).filter((x) => x !== "n"), k).toEqual(ph);
    }
  });
  test("Bezirkstafel: Mehrzahl von Krankenhaus und Flughafen", () => {
    expect(t("karte.bezirk.einrichtungen", { k: 1, f: 1 })).toBe("1 Krankenhaus · 1 Flughafen");
    expect(t("karte.bezirk.einrichtungen", { k: 3, f: 0 })).toBe("3 Krankenhäuser · 0 Flughäfen");
    expect(tIn("en", "karte.bezirk.einrichtungen", { k: 1, f: 2 })).toBe("1 hospital · 2 airports");
    expect(tIn("tr", "karte.bezirk.einrichtungen", { k: 2, f: 1 })).toBe("2 hastane · 1 havalimanı");
  });
  test("Restdauer und Frist folgen den Mehrzahlregeln", () => {
    expect(t("marken.rest", { m: 1 })).toBe("noch mindestens 1 Monat");
    expect(t("marken.rest", { m: 14 })).toBe("noch mindestens 14 Monate");
    expect(t("marken.rest", { m: 0 })).toBe("Fertigstellung steht bevor");
    expect(tIn("en", "marken.rest", { m: 1 })).toBe("at least 1 more month");
    expect(ereignisMarkenText("Streik", 1)).toBe("Streik: Frist in 1 Tag");
    expect(ereignisMarkenText("Streik", 4)).toBe("Streik: Frist in 4 Tagen");
    expect(ereignisMarkenText("Streik", 0)).toBe("Streik: Frist heute");
    expect(tIn("tr", "marken.mehr", { n: 3 })).toBe("Bu noktada 3 işaret daha");
  });
  test("Marken-Tafel auf Englisch und Türkisch", async () => {
    const w = welt();
    await setzeSprache("en");
    const en = reichMarken(w, "erbe").find((o) => o.art === "erbe")!;
    expect(en.artText).toBe("Cultural heritage");
    expect(en.zeile).toMatch(/Condition \d+ out of 100/);
    await setzeSprache("tr");
    const tr = reichMarken(w, "erbe").find((o) => o.art === "erbe")!;
    expect(tr.artText).toBe("Kültürel miras");
    expect(tr.zeile).toMatch(/Durum: 100 üzerinden \d+/);
  });
});

describe("Formen und Legende", () => {
  test("sechs Formen mit eigener Silhouette", () => {
    const arten = ["bau", "wunder", "erbe", "ereignis", "frist", "krise"] as const;
    const klassen = arten.map((a) => renderToStaticMarkup(<MarkenForm art={a} fortschritt={0.5} />).match(/form-[a-z]+/)![0]);
    expect(new Set(klassen).size).toBe(6);
  });
  test("Bau: Der Fortschrittsring füllt sich nach Anteil, pausiert ist gestrichelt", () => {
    const halb = renderToStaticMarkup(<MarkenForm art="bau" fortschritt={0.5} />);
    const voll = renderToStaticMarkup(<MarkenForm art="bau" fortschritt={1} />);
    const dash = (h: string) => Number(/stroke-dasharray="([\d.]+) /.exec(h)![1]);
    expect(dash(halb)).toBeCloseTo(dash(voll) / 2, 1);
    expect(renderToStaticMarkup(<MarkenForm art="bau" fortschritt={0.5} pausiert />)).toContain('stroke-dasharray="3 3.2"');
    expect(renderToStaticMarkup(<MarkenForm art="bau" fortschritt={5} />)).toBe(voll);
  });
  test("Legende nennt alle sechs Marken in Worten und lässt sich einklappen", () => {
    const html = renderToStaticMarkup(<MarkenLegende />);
    expect(html).toContain("Marken auf der Karte");
    for (const a of ["bau", "wunder", "erbe", "ereignis", "frist", "krise"]) expect(html).toContain(`mz-${a}`);
    expect(html).toContain("Kran");
    expect(html).toContain("goldener Tempel");
    expect(html).toContain("Fahren Sie über eine Marke");
    expect(html).toContain('aria-expanded="true"');
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------
// Städte als Kartenobjekte (staedte.ts) und Effekte-Standard

import { METROPOLE_AB, stadtArt, stadtInfos } from "../src/ui/atlas/staedte";
import { StadtFigur } from "../src/ui/atlas/StadtFigur";
import { PROVINZEN } from "../src/sim/regional";
import { setzeEffektstufe, effektstufe, bewegungsFaktor, zierBewegung } from "../src/ui/anim/effekte";
import { Effekte } from "../src/ui/Effekte";
import dePlural2 from "../src/i18n/katalog/de/anim.json";
import trAnim from "../src/i18n/katalog/tr/anim.json";
import enAnim from "../src/i18n/katalog/en/anim.json";
registriere("de", dePlural2);
registriere("tr", trAnim);
registriere("en", enAnim);

describe("Städte als Kartenobjekte", () => {
  test("alle 81 Provinzen haben ein Stadtobjekt mit Rang, Größenzeichen und Tafeltexten", () => {
    const w = welt();
    const infos = stadtInfos(w, []);
    expect(Object.keys(infos)).toHaveLength(81);
    for (let p = 1; p <= 81; p++) {
      const i = infos[p]!;
      expect(i.name).toBe(PROVINZEN[p - 1]!.name);
      expect(i.groesse).toMatch(/^\d+,\d$/);
      expect(i.einwohnerText).toMatch(/Einwohner/);
      expect(i.rathausText).toMatch(/^Rathaus: /);
      expect(i.vorhabenText).toMatch(/Vorhaben/);
      expect(i.klick).toBe("Klick: Provinzblatt öffnen");
      expect(i.beschreibung).toContain(i.name);
      expect(i.parteiFarbe).toMatch(/^#/);
    }
  });
  test("Hauptstadt ist Ankara, Großstadt ab der Schwelle, sonst Provinzstadt; Hauptstadt hat den höchsten Rang", () => {
    expect(stadtArt(6)).toBe("hauptstadt");
    const w = welt();
    const infos = stadtInfos(w, []);
    const rang = Object.values(infos).sort((a, b) => b.rang - a.rang);
    expect(rang[0]!.plaka).toBe(6);
    for (const i of Object.values(infos)) {
      if (i.plaka === 6) continue;
      expect(i.art).toBe(i.einwohner >= METROPOLE_AB ? "metropole" : "stadt");
    }
    expect(Object.values(infos).filter((i) => i.art === "metropole").length).toBeGreaterThan(5);
  });
  test("Statussymbole und Rang folgen den Marken", () => {
    const w = welt();
    const ohne = stadtInfos(w, []);
    const mit = stadtInfos(w, [{ plaka: 34, art: "frist" }, { plaka: 35, art: "ereignis" }]);
    expect(mit[34]!.status.frist).toBe(true);
    expect(mit[35]!.status.ereignis).toBe(true);
    expect(ohne[34]!.status.frist).toBe(false);
    expect(mit[35]!.rang).toBeGreaterThan(ohne[35]!.rang);
  });
  test("Tafel auf Türkisch und Englisch", async () => {
    const w = welt();
    await setzeSprache("en");
    const en = stadtInfos(w, [])[34]!;
    expect(en.artText).toMatch(/Metropolis|Capital|Provincial city/);
    expect(en.rathausText).toMatch(/^City hall: /);
    expect(en.klick).toBe("Click: open the province card");
    await setzeSprache("tr");
    const tr = stadtInfos(w, [])[34]!;
    expect(tr.rathausText).toMatch(/^Belediye: /);
    expect(tr.vorhabenText).toMatch(/proje/);
  });
  test("Stadtfiguren: drei verschiedene Silhouetten", () => {
    const k = (a: "hauptstadt" | "metropole" | "stadt") => renderToStaticMarkup(<StadtFigur art={a} />);
    expect(new Set([k("hauptstadt"), k("metropole"), k("stadt")]).size).toBe(3);
    expect(k("hauptstadt")).toContain("figur-hauptstadt");
  });
});

describe("Effekte: Standard Mittel, Bewegung reduzieren", () => {
  test("Der Schalter nennt, was er tut", () => {
    setzeEffektstufe("mittel");
    const html = renderToStaticMarkup(<Effekte />);
    expect(html).toContain("Effekte");
    expect(html).toContain("Mittel");
    expect(html).toContain("Bewegung der Karte");
  });
  test("ohne Fenster gilt Mittel mit Bewegung, Zierbewegung nur bei Hoch", () => {
    expect(effektstufe()).toBe("mittel");
    expect(bewegungsFaktor("mittel")).toBe(1);
    expect(bewegungsFaktor("aus")).toBe(0);
    expect(zierBewegung("hoch")).toBe(true);
    expect(zierBewegung("mittel")).toBe(false);
  });
});
