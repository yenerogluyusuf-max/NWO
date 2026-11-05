// Spielerdurchlauf 5. November: Das Ereignisfenster sagt, was ohne Antwort geschieht; der Rat aus dem Ressort und die
// Kennzahlen handeln vom Ereignis, nicht von der schlechtesten Zahl des Ressorts.

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { ansicht, oeffne, standardVorschau } from "../src/sim/ereignisse";
import { ratZuEreignis } from "../src/sim/personen-api";
import { NET } from "../src/sim/modell";
import { Rng } from "../src/sim/rng";
import { richtungVon, themaFuer } from "../src/ui/ereignis/kontext";
import type { World } from "../src/sim/types";

function neu() {
  const w = createWorld(turkey2026, 4);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 60;
  return w;
}

describe("Standardfolge im Fenster", () => {
  test("Die Ansicht nennt die Standardfolge und ihren Preis in der Umfrage, ohne die Welt zu verändern", () => {
    const w = neu();
    const ev = oeffne(w, "mindestlohn", new Rng(1))!;
    const vorher = JSON.stringify({ z: w.spiel!.umfrage.zustimmung, t: w.net.targets, k: w.spiel!.kapital, c: w.spiel!.chronik.length });
    const a = ansicht(w, ev);
    expect(a.standardFolge?.text.length).toBeGreaterThan(5);
    expect(a.standardFolge?.zeilen.some((z) => /^Zustimmung −/.test(z))).toBe(true);
    expect(JSON.stringify({ z: w.spiel!.umfrage.zustimmung, t: w.net.targets, k: w.spiel!.kapital, c: w.spiel!.chronik.length })).toBe(vorher);
    expect(w.spiel!.ereignisse).toHaveLength(1);
    expect(standardVorschau(w, ev)).toEqual(a.standardFolge);
  });

  test("Richtung der Vorschauzeilen in allen Sprachen", () => {
    expect(richtungVon("Mindestlohn: Stufe 3 auf 5")).toBe("auf");
    expect(richtungVon("Minimum wage: level 5 to 3")).toBe("ab");
    expect(richtungVon("Asgari ücret: seviye 3 → 5")).toBe("auf");
    expect(richtungVon("Finance Minister X: less support")).toBe("ab");
    expect(richtungVon("Lira %1,2 zayıf")).toBe("ab");
  });
});

describe("Rat und Kennzahlen passen zum Ereignis", () => {
  test("Bei der Besetzung am Verfassungsgericht rät die Justiz zur Unabhängigkeit der Gerichte, nicht zu Gefängnissen", () => {
    const w = neu();
    const ev = oeffne(w, "recht_ernennung", new Rng(2));
    expect(ev).toBeTruthy();
    const name = NET.nodes[NET.index.get("justiz_unabhaengigkeit")!]!.name;
    const haft = NET.nodes[NET.index.get("haftueberfuellung")!]!.name;
    const justiz = w.spiel!.figuren.find((f) => f.imAmt && f.amt === "justiz")!;
    justiz.loyalitaet = 50;
    const rat = ratZuEreignis(w, ev!.id).find((r) => r.figurId === justiz.id)!;
    expect(rat.zeilen.join(" ")).not.toContain(haft);
    expect(rat.zeilen[0]).toContain(name);
  });

  test("Eine fällige Zusage nimmt das Thema ihrer Maßnahme", () => {
    const w = {
      spiel: { ereignisse: [{ id: "e1", vorlage: "zusage", daten: { zusage: "z1" } }], zusagen: [{ id: "z1", massnahme: "m_renten" }] },
    } as unknown as World;
    expect(themaFuer({ id: "e1", vorlage: "zusage", szene: "parlament" }, w)).toBe("haushalt");
    (w.spiel!.zusagen[0] as { massnahme: string }).massnahme = "m_sozialwohnungen";
    expect(themaFuer({ id: "e1", vorlage: "zusage", szene: "parlament" }, w)).toBe("wohnen");
  });
});

describe("Wertung der Vorschauzeilen", () => {
  test("Mehr Polarisierung und mehr Schulden sind schlecht, weniger Druck aus Straßburg ist gut, Stufen sind neutral", async () => {
    const { wertungVon } = await import("../src/ui/ereignis/kontext");
    const polar = NET.nodes[NET.index.get("polarisierung")!]!.name;
    const strassburg = NET.nodes[NET.index.get("strassburg_druck")!]!.name;
    expect(wertungVon(`${polar} +1,0`)).toBe("schlecht");
    expect(wertungVon(`${strassburg} −2,0`)).toBe("gut");
    expect(wertungVon("Schulden +0,40 Prozentpunkte")).toBe("schlecht");
    expect(wertungVon("Zustimmung −0,8 Punkte")).toBe("schlecht");
    expect(wertungVon("Mindestlohn: Stufe 3 auf 5")).toBe("neutral");
  });
});
