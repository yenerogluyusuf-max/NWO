// Welle 3, K6: Ortswahl auf der großen Karte (karte.md K1, K8), Kriegsziel aus Regionen (krieg.md Schritt 10), Front entlang der
// Regionsgrenzen in 3D und 2D, Linse „Front und Besatzung“.
import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { advance, load, save } from "../src/sim/world";
import { KRIEG, ZIELRAUM_WECHSEL, fuehreKriegHandlungAus, kriegMit, kriseEroeffnen, waehleZielraum } from "../src/sim/krieg";
import { kriegsKarte, regionenVon, zielRegionen } from "../src/sim/kriegsschauplatz";
import { UEBERZIEHUNG } from "../src/sim/kapital";
import { regionWaehlbar, waehleZielRegionen, zielBereinigen, zielLuecke, zielraumFuerRegionen, zielwahlPreis } from "../src/sim/zielwahl";
import { ZIELRAUM_REGIONEN } from "../src/data/schauplaetze";
import { ZIELRAEUME } from "../src/data/streitkraefte";
import { umschalten, klickbar, ortStil, zielTeile, type OrtswahlAnfrage } from "../src/ui/atlas/ortswahl";
import { frontLinien, inTuerkei, kriegsLage, regionBei } from "../src/ui/atlas/front";
import { bewerteRegionen, kriegszielAnfrage, kriegszielVorschau } from "../src/ui/krieg/kriegsziel-karte";
import { frontFarben, frontLinseVerfuegbar } from "../src/ui/linsen/front-linse";
import { linsenVerfuegbar, linseFuerTaste } from "../src/ui/linsen/linsen";
import { Karte2D } from "../src/ui/atlas/Karte2D";
import { provinceLonLat } from "../src/ui/atlas/overlay";
import { bisKrieg, frisch } from "./k3-hilfe";
import type { World } from "../src/sim/types";

const r = (ids: string[]) => ids.map((id) => `r:${id}`);
const SPIELSTAENDE = ["2039-02-02", "2043-08-03", "2045-06-04"].map((d) => `../spielstand/staatsraeson_${d}.json`).filter((f) => existsSync(f));

/** Frische Partie bis in die Drohkulisse mit Syrien, Kriegsziel „Schutz“, noch ohne Zielraum */
function drohkulisse(): { w: World; k: ReturnType<typeof kriegMit> & object } {
  const w = frisch(6);
  w.spiel!.kapital = 150;
  expect(kriseEroeffnen(w, "SYR").ok).toBe(true);
  const k = kriegMit(w, "SYR")!;
  advance(w, KRIEG.spannungMinTage);
  w.spiel!.ereignisse = [];
  if (k.phase === "spannung") fuehreKriegHandlungAus(w, k.id, "drohkulisse");
  fuehreKriegHandlungAus(w, k.id, "ziel_schutz");
  return { w, k };
}

describe("Kriegsziel aus Regionen (sim/zielwahl.ts)", () => {
  test("Tiefenregel: tiefer nur mit Region davor; alle festen Zielräume erfüllen sie", () => {
    expect(zielLuecke("SYR", ["syr_asas"])).toBeUndefined();
    expect(zielLuecke("SYR", ["syr_idlib"])).toBe("syr_idlib");
    expect(zielLuecke("SYR", ["syr_asas", "syr_aleppo"])).toBe("syr_aleppo");
    expect(zielLuecke("SYR", ["syr_asas", "syr_idlib", "syr_aleppo"])).toBeUndefined();
    // Gehaltenes zählt als Halt
    expect(zielLuecke("SYR", ["syr_idlib"], new Set(["syr_asas"]))).toBeUndefined();
    expect(regionWaehlbar("SYR", "syr_irq", [])).toBe(false);
    expect(regionWaehlbar("SYR", "irq_zaxo", [])).toBe(false);
    for (const z of ZIELRAEUME) expect(zielLuecke(z.land, ZIELRAUM_REGIONEN[z.id]!), z.id).toBeUndefined();
  });

  test("Abwählen streicht, was nicht mehr zusammenhängt", () => {
    expect(zielBereinigen("SYR", ["syr_asas", "syr_idlib", "syr_aleppo"])).toEqual(["syr_asas", "syr_idlib", "syr_aleppo"]);
    expect(zielBereinigen("SYR", ["syr_idlib", "syr_aleppo"])).toEqual([]);
    expect(zielBereinigen("SYR", ["syr_manbidsch", "syr_tabqa", "syr_deir"])).toEqual(["syr_manbidsch", "syr_tabqa", "syr_deir"]);
  });

  test("Gegenwehr vom kleinsten festen Zielraum, der die Auswahl enthält; genaue Auswahl ist der feste Zielraum", () => {
    expect(zielraumFuerRegionen("SYR", ZIELRAUM_REGIONEN.syr_grenzstreifen!)).toEqual({ id: "syr_grenzstreifen", genau: true });
    expect(zielraumFuerRegionen("SYR", ["syr_asas"])).toEqual({ id: "syr_grenzstreifen", genau: false });
    expect(zielraumFuerRegionen("SYR", ["syr_asas", "syr_idlib"])).toEqual({ id: "syr_tief", genau: false });
    expect(zielraumFuerRegionen("SYR", ["syr_asas", "syr_idlib", "syr_aleppo"])).toEqual({ id: "syr_maximal", genau: false });
  });

  test("Vor dem Einsatz: eigene Auswahl ohne Preis, zielRegionen folgt ihr; die genaue Auswahl setzt den festen Zielraum", () => {
    const { w, k } = drohkulisse();
    const kapital = w.spiel!.kapital;
    const e = waehleZielRegionen(w, k.id, ["syr_idlib", "syr_asas"]);
    expect(e.ok, e.text).toBe(true);
    expect(w.spiel!.kapital).toBe(kapital);
    expect(k.zielraum).toBe("syr_tief");
    expect(k.zielRegionen).toEqual(["syr_asas", "syr_idlib"]);
    expect(zielRegionen(k).map((x) => x.id)).toEqual(["syr_asas", "syr_idlib"]);
    // Dieselbe Auswahl noch einmal: abgelehnt, nichts gebucht
    expect(waehleZielRegionen(w, k.id, ["syr_asas", "syr_idlib"]).ok).toBe(false);
    // Genau der Grenzstreifen: fester Zielraum, keine eigene Liste
    expect(waehleZielRegionen(w, k.id, ZIELRAUM_REGIONEN.syr_grenzstreifen!).ok).toBe(true);
    expect(k.zielraum).toBe("syr_grenzstreifen");
    expect(k.zielRegionen).toBeUndefined();
    // Lücke, fremdes Land, leer: abgelehnt
    expect(waehleZielRegionen(w, k.id, ["syr_asas", "syr_aleppo"]).ok).toBe(false);
    expect(waehleZielRegionen(w, k.id, ["irq_zaxo"]).ok).toBe(false);
    expect(waehleZielRegionen(w, k.id, []).ok).toBe(false);
    // Der feste Zielraum der Akte räumt eine eigene Auswahl ab
    waehleZielRegionen(w, k.id, ["syr_asas"]);
    expect(waehleZielraum(w, k.id, "syr_tief").ok).toBe(true);
    expect(k.zielRegionen).toBeUndefined();
  });

  test("Im Krieg kostet der Wechsel, was die Vorschau zeigt (keine Schau); die Front ordnet sich neu", () => {
    const w = frisch(6);
    const { k } = bisKrieg(w, { land: "SYR", zielraum: "syr_grenzstreifen", form: "grossoffensive", mobil: true });
    advance(w, 21);
    w.spiel!.kapital = 50;
    const ids = ["syr_asas", "syr_manbidsch", "syr_tabqa"];
    const preis = zielwahlPreis(k, ids);
    expect(preis).toEqual({ pk: ZIELRAUM_WECHSEL.pk, moral: ZIELRAUM_WECHSEL.moral });
    const v = kriegszielVorschau(w, k, r(ids));
    expect(v.ok).toBe(true);
    expect(v.preis).toContain(String(ZIELRAUM_WECHSEL.pk));
    const vorher = w.spiel!.kapital;
    expect(waehleZielRegionen(w, k.id, ids).ok).toBe(true);
    expect(vorher - w.spiel!.kapital).toBe(preis.pk);
    expect(Object.keys(k.regionen!).length).toBe(regionenVon("SYR").length);
    expect(zielRegionen(k).map((x) => x.id)).toEqual(ids);
    // Ohne Kapital (auch nicht auf Pump, sim/kapital.ts UEBERZIEHUNG): gesperrt mit Grund, nichts gebucht
    w.spiel!.kapital = -UEBERZIEHUNG;
    const v2 = kriegszielVorschau(w, k, r(["syr_asas"]));
    expect(v2.ok).toBe(false);
    expect(waehleZielRegionen(w, k.id, ["syr_asas"]).ok).toBe(false);
  });

  test("Deterministisch und Rundlauf exakt; alte Stände ohne das Feld laden unverändert", () => {
    const lauf = () => {
      const { w, k } = drohkulisse();
      waehleZielRegionen(w, k.id, ["syr_asas", "syr_idlib"]);
      advance(w, 40);
      return save(w);
    };
    const a = lauf();
    expect(lauf()).toBe(a);
    expect(save(load(a))).toBe(a);
    expect(a).toContain('"zielRegionen":["syr_asas","syr_idlib"]');
  });

  test.runIf(SPIELSTAENDE.length > 0)("Spielstände des Inhabers laden unverändert, Rundlauf exakt, ohne neues Feld; Linse und Kriegslage rechnen", () => {
    for (const f of SPIELSTAENDE) {
      const w = load(JSON.stringify(JSON.parse(readFileSync(f, "utf-8")).welt));
      const s = save(w);
      expect(save(load(s)), f).toBe(s);
      expect(s).not.toContain("zielRegionen");
      // 2045: eingefrorene Linie mit Griechenland (K1) → Linse verfügbar, Inseln ohne Landfront, Alexandroupoli mit Besatzungslinie
      const lage = kriegsLage(w);
      expect(lage.linien.every((l) => l.art === "linie")).toBe(true);
      expect(frontLinseVerfuegbar(w)).toBe(!!lage.karte);
    }
  });
});

describe("Ortswahl (ui/atlas/ortswahl.ts)", () => {
  const anfrage = (): OrtswahlAnfrage => ({
    id: "probe", titel: "", frage: "", ziele: r(["syr_asas", "syr_idlib", "syr_aleppo", "syr_deir"]), start: [],
    bewerte: (a) => ({
      "r:syr_asas": { bewertung: "gut" },
      "r:syr_idlib": { bewertung: a.includes("r:syr_asas") ? "moeglich" : "gesperrt" },
      "r:syr_aleppo": { bewertung: a.includes("r:syr_idlib") ? "moeglich" : "gesperrt" },
      "r:syr_deir": { bewertung: "erfuellt" },
    }),
    bereinige: (a) => zielBereinigen("SYR", a.map((z) => z.slice(2))).map((id) => `r:${id}`),
    vorschau: () => ({ kennzahlen: [], zeilen: [], preis: "", ok: true }),
    uebernehmen: () => ({ ok: true, text: "" }),
  });

  test("Klick wählt und streicht; gesperrt und erfüllt bleiben; Abwählen streicht Abgehängtes", () => {
    const a = anfrage();
    let aus = umschalten(a, [], "r:syr_idlib");
    expect(aus).toEqual([]);
    aus = umschalten(a, aus, "r:syr_asas");
    aus = umschalten(a, aus, "r:syr_idlib");
    aus = umschalten(a, aus, "r:syr_aleppo");
    expect(aus).toEqual(r(["syr_asas", "syr_idlib", "syr_aleppo"]));
    expect(umschalten(a, aus, "r:syr_deir")).toEqual(aus);
    expect(umschalten(a, aus, "r:fremd")).toEqual(aus);
    expect(umschalten(a, aus, "r:syr_asas")).toEqual([]);
    expect(klickbar({ bewertung: "gesperrt" }, true)).toBe(true);
    expect(ortStil({ bewertung: "gut" }, true)).toBe("gewaehlt");
    expect(zielTeile("p:34")).toEqual({ art: "p", id: "34" });
    expect(zielTeile("l:SYR")).toEqual({ art: "l", id: "SYR" });
    expect(zielTeile("x")).toBeUndefined();
  });

  test("Kriegsziel: Bewertung nach Tiefe, Reichweite der Operation und Halt; Vorschau aus den Daten; Übernehmen bucht über die Simulation", () => {
    const { w, k } = drohkulisse();
    const b = bewerteRegionen(w, k, []);
    expect(b["r:syr_asas"]!.bewertung).toBe("gut");
    expect(b["r:syr_idlib"]!.bewertung).toBe("gesperrt");
    const b2 = bewerteRegionen(w, k, r(["syr_asas"]));
    expect(b2["r:syr_idlib"]!.bewertung).toBe("gut");
    expect(b2["r:syr_aleppo"]!.bewertung).toBe("gesperrt");
    const a = kriegszielAnfrage(w, k);
    expect(a.ziele).toHaveLength(regionenVon("SYR").length);
    expect(a.kamera!.lon).toBeGreaterThan(36);
    const v = kriegszielVorschau(w, k, r(["syr_asas", "syr_manbidsch"]));
    expect(v.kennzahlen[1]!.wert).toContain("6.443");
    expect(v.zeilen.map((z) => z.ziel)).toEqual(r(["syr_asas", "syr_manbidsch"]));
    expect(a.uebernehmen(r(["syr_asas", "syr_manbidsch"])).ok).toBe(true);
    expect(k.zielRegionen).toEqual(["syr_asas", "syr_manbidsch"]);
  });
});

describe("Front entlang der Regionsgrenzen (ui/atlas/front.ts)", () => {
  test("Zu Beginn verläuft die Front auf der Grenze der Zielregionen zur Türkei, der Gegner liegt jenseits", () => {
    const l = frontLinien([{ land: "SYR", art: "front", gehalten: [], ziel: ["syr_asas", "syr_qamischli"] }]);
    expect(l.length).toBeGreaterThanOrEqual(2);
    for (const x of l) {
      // Jeder Punkt der Linie liegt nahe der Türkei; ein Schritt zum Gegner führt aus der Türkei heraus
      const [a, b] = [x.punkte[0]!, x.punkte[1]!];
      const f = x.feind[0]!;
      const n = Math.hypot(f[0], f[1]);
      const m: [number, number] = [(a[0] + b[0]) / 2 + (f[0] / n) * 0.05, (a[1] + b[1]) / 2 + (f[1] / n) * 0.05];
      expect(inTuerkei(m[0], m[1])).toBe(false);
    }
  });

  test("Ist Asas genommen, umschließt die Front Asas und endet an der Grenze; Inseln haben keine Landfront; nach dem Krieg eine Besatzungslinie", () => {
    const l = frontLinien([{ land: "SYR", art: "front", gehalten: ["syr_asas"], ziel: ["syr_manbidsch", "syr_qamischli"] }]);
    const asas = l.filter((x) => x.punkte.some(([lo]) => lo < 37.5));
    expect(asas.length).toBe(1);
    expect(asas[0]!.punkte.length).toBeGreaterThan(10);
    const ende = asas[0]!.punkte.at(-1)!;
    expect(Math.abs(ende[1] - 36.65)).toBeLessThan(0.1);
    expect(frontLinien([{ land: "GRC", art: "front", gehalten: ["grc_mytilini"], ziel: [] }])).toEqual([]);
    const linie = frontLinien([{ land: "SYR", art: "linie", gehalten: ["syr_asas"], ziel: ["syr_qamischli"] }]);
    expect(linie.every((x) => x.art === "linie")).toBe(true);
    expect(linie.length).toBe(1);
  });

  test("Klick auf der Karte trifft die Region unter dem Zeiger", () => {
    expect(regionBei(36.63, 35.93, ["syr_idlib", "syr_asas"])).toBe("syr_idlib");
    expect(regionBei(32.0, 39.0, ["syr_idlib"])).toBeUndefined();
  });

  test("Im Krieg: dieselbe Lage für 3D und 2D; die 2D-Karte zeichnet Flächen statt Kreise", () => {
    const w = frisch(6);
    const { k } = bisKrieg(w, { land: "SYR", zielraum: "syr_grenzstreifen", form: "grossoffensive", mobil: true });
    for (let i = 0; i < 12 && !Object.values(k.regionen ?? {}).includes("eigen"); i++) advance(w, 7);
    expect(Object.values(k.regionen!)).toContain("eigen");
    const lage = kriegsLage(w);
    expect(lage.karte).toEqual(kriegsKarte(w, [k], provinceLonLat));
    expect(lage.linien.length).toBeGreaterThan(0);
    expect(lage.ziel).toEqual(zielRegionen(k).map((x) => x.id));
    expect(kriegsLage(w).linien).toBe(lage.linien);
    const html = renderToStaticMarkup(createElement(Karte2D, { krieg: lage.karte, front: lage }));
    expect(html).toContain('class="region eigen"');
    expect(html).not.toMatch(/<circle[^>]*class="(eigen|gegner|umkaempft)"/);
    expect(html).toContain("frontlinie front");
    expect(html).toContain('class="zaehne"');
    // Ortswahl in 2D: wählbare Regionen als Flächen mit Stil
    const ow = renderToStaticMarkup(createElement(Karte2D, { ortswahl: { ziele: [{ ziel: "r:syr_idlib", name: "Idlib", stil: "gut" }] } }));
    expect(ow).toContain('class="gut"');
  });
});

describe("Linse „Front und Besatzung“ (karte.md K8)", () => {
  test("nur bei Krieg auf einem Schauplatz oder Besatzung; Taste F; Bedrohtes rot", () => {
    const w = frisch(6);
    expect(frontLinseVerfuegbar(w)).toBe(false);
    expect(linsenVerfuegbar(w)).not.toContain("front");
    expect(linseFuerTaste(w, "f")).toBeNull();
    const { k } = bisKrieg(w, { land: "SYR", zielraum: "syr_grenzstreifen", form: "begrenzt" });
    expect(linsenVerfuegbar(w)).toContain("front");
    expect(linseFuerTaste(w, "f")).toBe("front");
    k.bedroht = [79];
    const f = frontFarben(w);
    expect(f.fill![79]).toBe("#b0493c");
    expect(f.legende!.hinweis).toContain("Syrien");
  });
});
