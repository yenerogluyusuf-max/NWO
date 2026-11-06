// Welle H2 (6. November): Kommunalwahl je Provinz. Im Spielstand des Inhabers hielt die Partei der Werte nach der Kommunalwahl 2029
// null und nach 2034 alle 81 Rathäuser, bei 214 von 600 Sitzen. Ursache: Jede Provinz verglich das Vertrauen in die Regierung vor Ort
// mit derselben Schwelle 52, und dieses Vertrauen unterscheidet sich zwischen den Provinzen kaum (Spielstand 2039: 73 bis 82, Streuung
// 1,8). Jetzt gewinnt in jeder Provinz der stärkste Kandidat (relative Mehrheit, Gesetz 2972) nach den Hochburgen der Parteien von 2023,
// der Stimmung seit der Parlamentswahl, dem Vertrauen vor Ort, dem Amtsbonus und den Bündnissen.

import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { advance, createWorld, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { lokaleAnteile, startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { kommunalKandidaten, kommunalwahlDurchfuehren, kommunenVon, rathaeuserLager } from "../src/sim/kommunen";
import { PROVINZEN } from "../src/sim/regional";
import { gesellschaftVon } from "../src/sim/gesellschaft";
import { NET } from "../src/sim/modell";
import { PROVINCES } from "../src/sim/netz";
import type { World } from "../src/sim/types";

const profil: PlayerProfile = {
  name: "Test", heimat: "Konya", heimatPlaka: 42, jugend: "", beruf: "Ökonom", partner: "", motiv: "",
  partei: { name: "Partei der Werte", kurz: "PW", farbe: "#2e6b3f" }, naehe: {}, versprechen: [], wahl: { runde: 2, anteil: 50.6 },
};

/** Parlament der Wahl 2038 aus dem Spielstand des Inhabers (Anteile in Prozent; Sitze PW 214, AKP 216, YENİ 121, CHP 49). */
const PARLAMENT_2038 = { AKP: 25.7, Andere: 2.3, CHP: 9.8, DEM: 5.7, MHP: 6.2, PW: 26.4, YENİ: 18.2, YRP: 0.5, Zafer: 2.4, İYİ: 2.7 };

/** Die Lage des Spielstands: PW allein im Lager, Vertrauen in die Regierung überall hoch und fast gleich. */
function wieImSpielstand(vertrauen = 77): World {
  const w = createWorld(turkey2026, 3);
  startAfterElection(w, profil);
  w.spiel!.ereignisse = [];
  w.spiel!.lager = [];
  w.parliament = { shares: { ...PARLAMENT_2038 }, seats: { AKP: 216, CHP: 49, PW: 214, YENİ: 121 } };
  const i = NET.index.get("vertrauen_regierung")!;
  for (let p = 0; p < PROVINCES; p++) w.net.values[i * PROVINCES + p] = vertrauen + ((p * 7) % 5) * 0.4;
  return w;
}

const verteilung = (w: World): Record<string, number> => {
  const z: Record<string, number> = {};
  for (const r of Object.values(kommunenVon(w).rathaus)) z[r.partei] = (z[r.partei] ?? 0) + 1;
  return z;
};
const plaka = (name: string) => PROVINZEN.find((p) => p.name === name)!.plaka;

describe("Kommunalwahl je Provinz (Spielstand 2034: 0 → 81 von 81)", () => {
  test("bei 26 % und hohem, gleichmäßigem Vertrauen kein 81 zu 0, sondern ein Ergebnis je Provinz", () => {
    const w = wieImSpielstand();
    const r = kommunalwahlDurchfuehren(w, 0);
    const v = verteilung(w);
    // Vorher: Vertrauen 77 über der Schwelle 52 in jeder Provinz, also alle 81 an das Lager
    expect(r.ergebnis.lagerNachher).toBeLessThan(65);
    expect(r.ergebnis.lagerNachher).toBeGreaterThan(20);
    // Die anderen Parteien gewinnen dort, wo sie 2023 stark waren
    expect(v.AKP ?? 0).toBeGreaterThan(5);
    expect(v.DEM ?? 0).toBeGreaterThan(4);
    expect(kommunenVon(w).rathaus[String(plaka("Diyarbakır"))]!.partei).toBe("DEM");
    expect(kommunenVon(w).rathaus[String(plaka("İzmir"))]!.partei).toBe("YENİ");
    expect(r.text).toMatch(/verteilen sich auf/);
  });

  test("ein Erdrutsch bleibt möglich: mit stark gestiegener Zustimmung gewinnt das Lager deutlich mehr", () => {
    const ruhig = wieImSpielstand();
    const lauf = wieImSpielstand();
    lauf.spiel!.umfrage.verlauf = [{ monat: lauf.date.slice(0, 7), wert: 40 }];
    lauf.spiel!.umfrage.zustimmung = 70;
    ruhig.spiel!.umfrage.verlauf = [{ monat: ruhig.date.slice(0, 7), wert: 70 }];
    ruhig.spiel!.umfrage.zustimmung = 70;
    const a = kommunalwahlDurchfuehren(ruhig, 0).ergebnis.lagerNachher;
    const b = kommunalwahlDurchfuehren(lauf, 0).ergebnis.lagerNachher;
    expect(b).toBeGreaterThan(a + 10);
  });

  test("Amtsbonus: Wer die Rathäuser hält, behält mehr davon, als er aus der Opposition gewönne", () => {
    const halten = wieImSpielstand();
    for (const r of Object.values(kommunenVon(halten).rathaus)) r.partei = "PW";
    const erobern = wieImSpielstand();
    expect(rathaeuserLager(erobern)).toBe(0);
    expect(kommunalwahlDurchfuehren(halten, 0).ergebnis.lagerNachher).toBeGreaterThan(kommunalwahlDurchfuehren(erobern, 0).ergebnis.lagerNachher);
  });

  test("Bündnisse: ein Partner im Lager und ein Oppositionsbündnis treten mit gemeinsamem Kandidaten an", () => {
    const allein = wieImSpielstand();
    const mit = wieImSpielstand();
    mit.spiel!.lager = ["MHP"];
    const k = kommunalKandidaten(mit, 0)[0]!;
    expect(k.find((c) => c.id === "lager")!.parteien).toEqual(expect.arrayContaining(["PW", "MHP"]));
    expect(kommunalwahlDurchfuehren(mit, 0).ergebnis.lagerNachher).toBeGreaterThanOrEqual(kommunalwahlDurchfuehren(allein, 0).ergebnis.lagerNachher);
    // Gegenbündnis AKP und YENİ: ein Kandidat, gewinnt mehr als jede der beiden allein
    const gegen = wieImSpielstand();
    gesellschaftVon(gegen).opposition.partei = "AKP";
    gesellschaftVon(gegen).opposition.buendnis = ["YENİ"];
    expect(kommunalKandidaten(gegen, 0)[0]!.some((c) => c.id === "buendnis")).toBe(true);
    kommunalwahlDurchfuehren(gegen, 0);
    expect(rathaeuserLager(gegen)).toBeLessThan(rathaeuserLager(allein));
  });

  test("Zwangsverwalter: Das Lager zahlt in dieser Provinz bei der Wahl", () => {
    const ohne = wieImSpielstand();
    const mit = wieImSpielstand();
    const ist = plaka("İstanbul");
    kommunenVon(mit).rathaus[String(ist)]!.verwalter = { seit: mit.day };
    const lagerOhne = kommunalKandidaten(ohne, 0)[ist - 1]!.find((c) => c.id === "lager")!.anteil;
    const lagerMit = kommunalKandidaten(mit, 0)[ist - 1]!.find((c) => c.id === "lager")!.anteil;
    expect(lagerOhne - lagerMit).toBeCloseTo(10, 0);
  });

  test("Kalibrierung: Mit den Landesanteilen der Kommunalwahl 2024 gewinnt die CHP rund so viele Provinzen wie damals", () => {
    // tuerkei/STARTDATEN.md (YSK): CHP etwa 37,7 %, AKP etwa 35,5 %, die CHP gewann 35 Provinzen. Die kleinen Parteien sind dort nicht
    // verifiziert und stehen hier als „Andere“ ohne eigenen Kandidaten; die AKP gewinnt deshalb auch die Provinzen von DEM und MHP.
    const lokal = lokaleAnteile({ CHP: 37.7, AKP: 35.5, Andere: 26.8 }, "AKP");
    const chp = lokal.filter((s) => (s.CHP ?? 0) > (s.AKP ?? 0)).length;
    expect(chp).toBeGreaterThanOrEqual(30);
    expect(chp).toBeLessThanOrEqual(40);
  });
});

describe("Spielstand des Inhabers: Beim Laden ändert sich nichts", () => {
  const datei = "../spielstand/staatsraeson_2039-02-02.json";
  test.runIf(existsSync(datei))("81 Rathäuser bleiben bis zur nächsten Wahl, erst sie rechnet neu", () => {
    const w = load(JSON.stringify(JSON.parse(readFileSync(datei, "utf8")).welt));
    expect(rathaeuserLager(w)).toBe(81);
    expect(kommunenVon(w).naechste).toBe("2039-03-26");
    advance(w, 30);
    expect(rathaeuserLager(w), "vor dem Wahltag unverändert").toBe(81);
    while (kommunenVon(w).wahlen.length < 3 && w.date < "2039-06-01") advance(w, 5);
    const e = kommunenVon(w).wahlen[2]!;
    expect(e.lagerVorher).toBe(81);
    expect(e.lagerNachher).toBeLessThan(81);
    expect(e.lagerNachher).toBeGreaterThan(30);
  });
});
