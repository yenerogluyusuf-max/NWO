// Welle E4 (07.11.2026): Rüstung, Streitkräfte, Medien und Zeitung.
//   - Die Zeitung liest Wirkungsberichte aus ihren Feldern, nie aus übersetztem Text (ENTSCHEIDUNGEN U); kein „Stufe 0 auf 0“ mehr
//   - Ein Lager je Haus: Kopf und Reiter der Zeitung zeigen dasselbe Lager wie die Medienansicht
import { afterAll, describe, expect, test } from "vitest";
import { setzeSprache } from "../src/i18n";
import { createWorld, advance } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { berichtZuVorgang, zeitungVon } from "../src/sim/zeitung";
import { medienLager } from "../src/sim/medien";
import { medienCluster } from "../src/data/medien";
import { stufenName } from "../src/data/skalen";
import type { Bericht } from "../src/sim/berichte";

function spiel(seed = 4) {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  return w;
}

/** Ein Bericht, wie berichte.ts ihn heute schreibt: Titel mit Einheiten, Zahlen in Feldern. */
function bericht(titel: string): Bericht {
  return {
    tag: 400, datum: "2029-07-01", massnahme: "m_mindestlohn", titel, monate: 12, urteil: "gut",
    zeilen: [titel], hinweis: "", name: "Mindestlohn", von: 50, auf: 60, rest: 4,
    groessen: [
      { id: "arbeitnehmer", name: "Arbeitnehmer", art: "groesse", vorher: 48, nachher: 51.5, delta: 3.5, bewertung: "erwartet", besser: true },
      { id: "inflation", name: "Inflation", art: "groesse", vorher: 40, nachher: 41, delta: 1, bewertung: "ruhig", besser: null },
      { id: "armut", name: "Armut", art: "problem", vorher: 9, nachher: 7, delta: -2, bewertung: "erwartet", besser: true },
    ],
  };
}

describe("Zeitung liest Wirkungsberichte aus Feldern (ENTSCHEIDUNGEN U)", () => {
  afterAll(async () => { await setzeSprache("de"); });

  test("Name, Stufen, Größen und Restmonate kommen aus den Feldern; kein „Stufe 0 auf 0“, kein Titel als Name", () => {
    const v = berichtZuVorgang(bericht("Mindestlohn: von 37.050 Lira netto im Monat auf 48.300 Lira netto im Monat, 12 Monate danach"), 0);
    expect(v.titel).toBe("Wirkungsprüfung: Mindestlohn");
    expect(v.fakt).not.toContain("Stufe 0 auf 0");
    expect(v.fakt).toContain(stufenName("m_mindestlohn", 50));
    expect(v.fakt).toContain(stufenName("m_mindestlohn", 60));
    expect(v.daten).toMatchObject({ typ: "bericht", name: "Mindestlohn", von: 50, auf: 60, rest: 4 });
    if (v.daten?.typ === "bericht") {
      expect(v.daten.veraenderungen[0]).toMatchObject({ name: "Arbeitnehmer", von: 48, auf: 51.5 });
      expect(v.daten.akut[0]).toMatchObject({ name: "Armut", von: 9, auf: 7 });
    }
  });

  test("Derselbe Bericht ergibt in de, en und tr dieselben Zahlen, gleich wie der Titel übersetzt ist", async () => {
    const daten = [] as unknown[];
    for (const [sprache, titel] of [["de", "Mindestlohn: von 37.050 Lira auf 48.300 Lira, 12 Monate danach"], ["en", "Minimum wage: from 37,050 lira to 48,300 lira, 12 months later"], ["tr", "Asgari ücret: 37.050 liradan 48.300 liraya, 12 ay sonra"]] as const) {
      await setzeSprache(sprache);
      const v = berichtZuVorgang(bericht(titel), 0);
      daten.push({ ...v.daten, wertung: v.wertung });
    }
    expect(daten[1]).toEqual(daten[0]);
    expect(daten[2]).toEqual(daten[0]);
  });
});

describe("Ein Lager je Haus (Abendkurier)", () => {
  test("Jedes Blatt der Monatsausgabe trägt das Lager der Medienansicht", () => {
    const w = spiel(4);
    advance(w, 70);
    const ausgabe = zeitungVon(w).archiv.at(-1)!;
    expect(ausgabe.blaetter.length).toBeGreaterThan(0);
    for (const b of ausgabe.blaetter) expect(b.lager, b.name).toBe(medienLager(w, medienCluster(b.clusterId)!));
    // Der Abendkurier ist ein angepasstes Haus, kein regierungsnahes (vorher zeigte die Zeitung „regierungsnah“, die Medienansicht „angepasst“)
    expect(medienLager(w, medienCluster("kommerz_konform")!)).toBe("angepasst");
  });
});
