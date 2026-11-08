// Welle H6 (06.11.2026): Am Verhandlungstisch zählt die Gegenleistung. Rückmeldung des Inhabers zu seinem Spielstand 2039:
// Russland nahm Akkuyu, den Getreidekorridor und Transit ohne jede Gegenleistung an („kein Russland der Welt würde so ein Angebot
// annehmen“). Jetzt muss der Saldo der Gegenseite aus den Klauseln über einer Mindestmarge liegen; die Beziehung senkt nur die Marge.

import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { LAENDER, vertrauenZu, weltZustand } from "../src/sim/laender";
import { KLAUSEL_NACH_ID, PROFILE } from "../src/data/abkommen";
import { ABWAEGUNG, bewerte, klauselnFuer, verhandle, vorschlagVomPartner, type Angebot } from "../src/sim/abkommen";
import { importiereSpielstandDatei } from "../src/ui/speicher";
import type { World } from "../src/sim/types";

const A = (land: string, gibt: string[], will: string[], jahre: 2 | 5 | 10 = 5): Angebot => ({ land, gibt, will, jahre });
const EINSEITIG = A("RUS", [], ["w_akkuyu", "w_getreide", "w_transit"]);

function neu(): World {
  const w = createWorld(turkey2026, 11);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 100;
  return w;
}

/** Die beste denkbare Beziehung: volles Vertrauen, kein Streit, zwei gehaltene Verträge, keine Brüche */
function bestFreunde(w: World, landId: string): void {
  const z = weltZustand(w)[landId]!;
  z.versatz += 100 - vertrauenZu(w, landId);
  z.konflikt = 0;
  z.gehalten = 2;
  z.bruch = 0;
}

// Der Spielstand des Inhabers liegt nur in der Arbeitskopie (nicht eingecheckt). Fehlt er, steht dieselbe Lage nach: Vertrauen 100,
// kaum Streit, zwei gehaltene Verträge mit Russland.
const STAND = new URL("../../spielstand/staatsraeson_2039-02-02.json", import.meta.url);
function inhaber(): World {
  if (existsSync(STAND)) return importiereSpielstandDatei(readFileSync(STAND, "utf8"))!;
  const w = neu();
  bestFreunde(w, "RUS");
  weltZustand(w)["RUS"]!.konflikt = 21;
  return w;
}

describe("Gegenleistung statt Stimmung", () => {
  test.skipIf(!existsSync(STAND))("Der Spielstand des Inhabers: Russland nimmt Akkuyu, Korridor und Transit ohne Gegenleistung nicht mehr an", () => {
    const w = inhaber();
    expect(vertrauenZu(w, "RUS")).toBeGreaterThan(95); // dieselbe Lage wie im Bild des Inhabers
    const b = bewerte(w, EINSEITIG);
    expect(b.urteil).not.toBe("zustimmung");
    expect(b.punkte).toBeLessThan(0); // der Saldo: Russland gibt nur
    expect(b.gibtWert).toBe(0);
    expect(b.grenze).toBeGreaterThanOrEqual(0);
  });

  test("Einseitige Forderung wird abgelehnt, auch bei bester Beziehung, in jedem Land", () => {
    const w = neu();
    for (const l of LAENDER) {
      bestFreunde(w, l.id);
      for (const k of klauselnFuer(w, l.id)) {
        if (k.def.seite !== "will" || k.gesperrt || k.rot || k.wert >= 0) continue;
        const b = bewerte(w, A(l.id, [], [k.def.id]));
        expect(b.urteil, `${l.id}/${k.def.id}`).not.toBe("zustimmung");
      }
    }
  });

  test("Ausgewogenes Paket wird angenommen: Gasverträge gegen Akkuyu, Korridor und Transit", () => {
    const w = inhaber();
    const b = bewerte(w, A("RUS", ["gas_kauf"], ["w_akkuyu", "w_getreide", "w_transit"]));
    expect(b.urteil).toBe("zustimmung");
    expect(b.gibtWert).toBeGreaterThan(b.willKosten);
    // Auch bei neutraler Beziehung zum Spielstart trägt ein Paket mit klarem Überschuss
    const w2 = neu();
    expect(bewerte(w2, A("SYR", ["bauauftraege", "energie_lieferung"], ["w_rueckkehr"])).urteil).toBe("zustimmung");
  });

  test("Vertrauen allein trägt kein Paket: Die Beziehung senkt nur die Marge, nie unter null", () => {
    const w = neu();
    const a = A("USA", ["ruestung_kauf"], ["w_ruestung"]);
    const vorher = bewerte(w, a);
    bestFreunde(w, "USA");
    const nachher = bewerte(w, a);
    expect(nachher.punkte).toBe(vorher.punkte); // der Saldo der Klauseln bleibt
    expect(nachher.grenze).toBeLessThanOrEqual(vorher.grenze);
    expect(nachher.grenze).toBeGreaterThanOrEqual(ABWAEGUNG.margeMin);
    // Ein Paket mit negativem Saldo scheitert, gleich wie gut die Beziehung ist
    const minus = A("USA", ["vermittlung_zusage"], ["w_sanktion"]);
    expect(bewerte(w, minus).punkte).toBeLessThan(0);
    expect(bewerte(w, minus).urteil).not.toBe("zustimmung");
  });

  test("Eine Forderung im eigenen Interesse der Gegenseite trägt sich selbst", () => {
    const w = neu();
    bestFreunde(w, "RUS");
    const alt = PROFILE.RUS!.werte.w_akkuyu!;
    try {
      PROFILE.RUS!.werte.w_akkuyu = 1;
      expect(bewerte(w, A("RUS", [], ["w_akkuyu"])).urteil).toBe("zustimmung");
    } finally {
      PROFILE.RUS!.werte.w_akkuyu = alt;
    }
    expect(bewerte(w, A("RUS", [], ["w_akkuyu"])).urteil).not.toBe("zustimmung");
  });

  test("Schlechte Beziehung: Ohne Gesprächsfaden verhandelt die Gegenseite gar nicht", () => {
    const w = neu();
    const z = weltZustand(w)["RUS"]!;
    z.versatz -= vertrauenZu(w, "RUS");
    z.konflikt = 100;
    z.bruch = 10;
    const b = bewerte(w, A("RUS", ["gas_kauf", "zahlungsweg", "transit"], ["w_getreide"]));
    expect(b.gespraech).toBe(false);
    expect(b.urteil).toBe("ablehnung");
    expect(b.gegenangebote).toHaveLength(0);
  });
});

describe("Gegenangebote aus den Wünschen der Gegenseite", () => {
  test("Auf das einseitige Paket nennt Moskau, was es dafür will; jeder Vorschlag findet seine Zustimmung", () => {
    const w = inhaber();
    const b = bewerte(w, EINSEITIG);
    expect(b.urteil).toBe("gegenangebot");
    expect(b.gegenangebote.length).toBeGreaterThanOrEqual(1);
    expect(b.gegenangebote.length).toBeLessThanOrEqual(3);
    const wuensche = klauselnFuer(w, "RUS").filter((k) => k.def.seite === "gibt" && k.wert > 0 && !k.gesperrt);
    for (const g of b.gegenangebote) {
      expect(bewerte(w, g.angebot).urteil, g.text).toBe("zustimmung");
      // Jede zusätzliche Leistung stammt aus der Wunschliste der Gegenseite
      for (const id of g.angebot.gibt) expect(wuensche.some((k) => k.def.id === id), id).toBe(true);
    }
    // Der erste Vorschlag ist der größte Wunsch, der die Lücke schließt (hier: die Gasverträge)
    expect(b.gegenangebote[0]!.angebot.gibt).toEqual(["gas_kauf"]);
    expect(b.gegenangebote[0]!.art).toBe("zusatz");
  });

  test("Reicht eine Leistung nicht, schlägt die Gegenseite zwei vor; der Verzicht auf die teuerste Forderung wird angeboten, wo er reicht", () => {
    const w = neu();
    bestFreunde(w, "EU");
    const zwei = bewerte(w, A("EU", ["vermittlung_zusage"], ["w_visa", "w_zollunion"]));
    expect(zwei.urteil).toBe("gegenangebot");
    for (const g of zwei.gegenangebote) expect(bewerte(w, g.angebot).urteil).toBe("zustimmung");
    const verzicht = bewerte(w, A("EU", ["migration_zusage"], ["w_visa", "w_ruestung"]));
    const v = verzicht.gegenangebote.find((g) => g.art === "verzicht");
    expect(v, JSON.stringify(verzicht.gegenangebote.map((g) => g.text))).toBeDefined();
    expect(v!.angebot.will).toEqual(["w_ruestung"]); // die Visafreiheit kostet Brüssel am meisten
  });
});

describe("Vorgänge, die die Bewertung nutzen", () => {
  test("Ein Partner schlägt nur vor, was er selbst annimmt, und legt eine Gegenleistung bei", () => {
    for (const w of [neu(), inhaber()]) {
      for (const l of LAENDER) {
        const a = vorschlagVomPartner(w, l.id);
        if (!a) continue;
        expect(bewerte(w, a).urteil, l.id).toBe("zustimmung");
        // Ein Vorschlag ist kein verkleidetes Verlangen: Er enthält immer eine Gegenleistung an die Türkei
        expect(a.will.length, l.id).toBeGreaterThan(0);
        expect(a.will.every((id) => KLAUSEL_NACH_ID[id]!.seite === "will"), l.id).toBe(true);
      }
    }
  });

  test("Ein Angebot unterbreiten folgt demselben Urteil: das einseitige Paket schließt keinen Vertrag", () => {
    const w = inhaber();
    w.spiel!.kapital = 50;
    const vorher = (weltZustand(w)["RUS"]!.vertraege ?? []).length;
    const r = verhandle(w, EINSEITIG);
    expect(r.ok).toBe(false);
    expect(r.urteil).toBe("gegenangebot");
    expect((weltZustand(w)["RUS"]!.vertraege ?? []).length).toBe(vorher);
  });
});

describe("Determinismus", () => {
  test("Gleiche Lage, gleiches Urteil, gleiche Gegenangebote", () => {
    const w1 = inhaber();
    const w2 = inhaber();
    for (const a of [EINSEITIG, A("RUS", ["gas_kauf"], ["w_akkuyu"]), A("USA", ["s400"], ["w_ruestung", "w_sanktion"]), A("EU", ["vermittlung_zusage"], ["w_visa"])]) {
      const b1 = bewerte(w1, a);
      expect(JSON.stringify(bewerte(w1, a))).toBe(JSON.stringify(b1));
      expect(JSON.stringify(bewerte(w2, a))).toBe(JSON.stringify(b1));
    }
    expect(JSON.stringify(LAENDER.map((l) => vorschlagVomPartner(w1, l.id)))).toBe(JSON.stringify(LAENDER.map((l) => vorschlagVomPartner(w2, l.id))));
  });
});
