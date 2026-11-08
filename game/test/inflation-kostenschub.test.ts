// Welle H5: Kostenschub nach der Veränderung statt nach dem Niveau, Glaubwürdigkeit bei anhaltend straffer Politik.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { COUPLING, advance, createWorld, load, save, spiralAnteil } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { NET } from "../src/sim/modell";
import { nationalAverage, startAverage } from "../src/sim/netz";
import { setPolicy } from "../src/sim/handeln";
import { PARAMS, glaubwuerdigkeitsAbzug, glaubwuerdigkeitsZuwachs, monthlyUpdate, ungedeckterMehrbedarf } from "../src/sim/economy";
import { Rng } from "../src/sim/rng";
import { VORLAGEN } from "../src/sim/ereignisse";
import { ohneZufallsereignisse } from "./_ohne-zufall";

/** Die festen Termine des Staatsjahres (sim/ereignisse.ts, TERMINE): Sie sind kein Zufall und bleiben in der Messung des Modells. */
const FESTE_TERMINE = new Set(["mindestlohn", "haushaltsjahr", "kommunalwahl", "zusage", "koalitionsangebot"]);
import type { EconomyState, MonthlySnapshot, World } from "../src/sim/types";

const kosten = (w: World) => nationalAverage(NET, w.net, "kostendruck") - startAverage(NET, w.net, "kostendruck");
/** Bis zum nächsten Monatsabschluss (der Monatserste) und einen Tag darüber */
const monat = (w: World) => {
  advance(w, 1);
  while (w.date.slice(8) !== "02") advance(w, 1);
};

describe("Kostenschub (Welle H5)", () => {
  test("ein dauerhaft hoher Kostendruck treibt nach der Übergangszeit keine zusätzliche Inflation mehr", () => {
    // Zwei gleiche Welten; in einer heben Zölle die Kosten der Vorprodukte dauerhaft (ohne die Lohn-Preis-Spirale zu berühren).
    // Der Kostendruck baut sich über rund drei Jahre auf, danach bleibt er hoch.
    const mit = createWorld(turkey2026, 7), ohne = createWorld(turkey2026, 7);
    setPolicy(mit, "m_zoelle", 100);
    let spitze = 0, inflSpitze = 0;
    for (let m = 0; m < 72; m++) {
      monat(mit);
      monat(ohne);
      spitze = Math.max(spitze, mit.economy.costPush - ohne.economy.costPush);
      inflSpitze = Math.max(inflSpitze, mit.economy.inflation - ohne.economy.inflation);
    }
    const abstand = kosten(mit) - kosten(ohne);
    const schub = mit.economy.costPush - ohne.economy.costPush;
    expect(spitze).toBeGreaterThan(0.3);
    expect(inflSpitze).toBeGreaterThan(0.3);
    expect(abstand).toBeGreaterThan(15);
    expect(spiralAnteil(mit)).toBe(0);
    // Vorher hätte der Mehrschub COUPLING.costPush × Abstand betragen, für immer; jetzt ist er fast verschwunden
    expect(Math.abs(schub)).toBeLessThan(0.05 * COUPLING.costPush * abstand);
    expect(Math.abs(schub)).toBeLessThan(0.15 * spitze);
    // Die Inflation kehrt zur Vergleichswelt zurück (gleiches Rauschen; die Bank schwingt etwas nach): Das Preisniveau ist einmal gestiegen, die Rate nicht dauerhaft
    expect(Math.abs(mit.economy.inflation - ohne.economy.inflation)).toBeLessThan(0.5 * inflSpitze);
  });

  test("die Lohn-Preis-Spirale trägt ihren Anteil dauerhaft, aber nur einmal", () => {
    const w = createWorld(turkey2026, 7);
    setPolicy(w, "m_mindestlohn", 100);
    setPolicy(w, "m_gewerkschaftsrechte", 100);
    for (let m = 0; m < 60; m++) monat(w);
    const s = spiralAnteil(w);
    expect(s).toBeGreaterThan(1);
    // Im Gleichgewicht bleibt genau der Beitrag der Spirale, nicht der ganze Abstand zum Start
    expect(w.economy.costPush).toBeCloseTo(COUPLING.costPush * s, 1);
    expect(w.economy.costPush).toBeLessThan(COUPLING.costPush * kosten(w));
  });
});

/** Sechs Monate Vorgeschichte mit gleichem Realzins und gleicher Inflation */
function vorgeschichte(realRate: number, inflation: number): MonthlySnapshot[] {
  return Array.from({ length: 12 }, (_, k) => ({
    month: `2039-${String(k + 1).padStart(2, "0")}`, inflation, growth: 3, unemployment: 9, outputGap: 0, realRate,
    usdTry: 100, eurTry: 110, policyRate: 25, riskPremium: 300, debtRatio: 30,
  }));
}

function lage(): EconomyState {
  const e = structuredClone(createWorld(turkey2026, 3).economy);
  Object.assign(e, { credibility: 0.1, policyRate: 25, expectedInflation: 16, inflation: 16.5, inflationTarget: 5, outputGap: -1 });
  return e;
}

describe("Glaubwürdigkeit (Welle H5)", () => {
  test("anhaltend straffe Politik mit fallender Inflation hebt die Glaubwürdigkeit", () => {
    const e = lage();
    expect(glaubwuerdigkeitsZuwachs(e, vorgeschichte(9, 18))).toBeGreaterThan(0.01);
    const vor = e.credibility;
    monthlyUpdate(e, vorgeschichte(9, 18), new Rng(5));
    expect(e.credibility).toBeGreaterThan(vor + 0.01);
  });

  test("ein einzelner straffer Monat genügt nicht", () => {
    const e = lage();
    const h = vorgeschichte(1, 18);
    h[h.length - 1]!.realRate = 9;
    expect(glaubwuerdigkeitsZuwachs(e, h)).toBe(0);
  });

  test("steigt die Inflation über der Erwartung, wächst sie nur halb so schnell", () => {
    // Lernfall 2023: Die gelieferte Straffung stabilisierte die Erwartungen, obwohl die Inflation noch stieg (PARAMS.glaubOhneTrend)
    const e = lage();
    const steigt = glaubwuerdigkeitsZuwachs(e, vorgeschichte(9, 14));
    e.inflation = 15;
    const unter = glaubwuerdigkeitsZuwachs(e, vorgeschichte(9, 14));
    expect(unter).toBeGreaterThan(0);
    e.inflation = 16.5;
    expect(steigt).toBeCloseTo(PARAMS.glaubOhneTrend * glaubwuerdigkeitsZuwachs(e, vorgeschichte(9, 18)), 9);
  });

  test("der Zuwachs wächst mit der Straffheit und schrumpft mit der erreichten Glaubwürdigkeit", () => {
    const e = lage();
    e.policyRate = 16 + PARAMS.neutralRealRate + 1;
    const knapp = glaubwuerdigkeitsZuwachs(e, vorgeschichte(PARAMS.neutralRealRate + 1, 18));
    e.policyRate = 25;
    const voll = glaubwuerdigkeitsZuwachs(e, vorgeschichte(9, 18));
    expect(knapp).toBeGreaterThan(0);
    expect(voll).toBeGreaterThan(2 * knapp);
    e.credibility = 0.8;
    expect(glaubwuerdigkeitsZuwachs(e, vorgeschichte(9, 18))).toBeLessThan(voll / 3);
  });

  test("eine dauerhaft breitere Steuerbasis deckt Mehrbedarf, ein Boom ohne Lira-Etat nicht", () => {
    const e = lage();
    Object.assign(e, { policyCost: 2.2, fiscalImpulse: 0.3, konjunkturSaldo: 1 });
    delete e.etat;
    expect(glaubwuerdigkeitsAbzug(e).mehrbedarf).toBeGreaterThan(0);
    const mitEtat = { ...e, etat: { jahr: 2039 } as EconomyState["etat"] } as EconomyState;
    expect(ungedeckterMehrbedarf(mitEtat)).toBeCloseTo(1.5, 9);
    expect(glaubwuerdigkeitsAbzug(mitEtat).mehrbedarf).toBe(0);
  });
});

describe("Determinismus (Welle H5)", () => {
  test("gleicher Samen, gleicher Verlauf mit Bezugswerten", () => {
    const a = createWorld(turkey2026, 11), b = createWorld(turkey2026, 11);
    setPolicy(a, "m_mindestlohn", 90);
    setPolicy(b, "m_mindestlohn", 90);
    advance(a, 400);
    advance(b, 400);
    expect(a.economy.kostenRef).toBeDefined();
    expect(save(a)).toBe(save(b));
    // Ein Zwischenstand läuft nach dem Laden genauso weiter
    const c = load(save(a));
    advance(a, 200);
    advance(c, 200);
    expect(save(c)).toBe(save(a));
  });
});

// Der Spielstand des Inhabers (Kopie, nicht eingecheckt): fehlt er, entfallen die Tests
const INHABER = new URL("../../spielstand/staatsraeson_2039-02-02.json", import.meta.url);
const inhaber = () => load(JSON.stringify((JSON.parse(readFileSync(INHABER, "utf8")) as { welt: World }).welt));

describe.skipIf(!existsSync(INHABER))("Spielstand des Inhabers (Welle H5)", () => {
  test("lädt ohne Sprung: Der Kostenschub klingt glatt aus", () => {
    const w = inhaber();
    expect(w.economy.kostenRef).toBeUndefined();
    const cp0 = w.economy.costPush, inf0 = w.economy.inflation;
    monat(w);
    // Im ersten Monat bleibt der Schub beim gespeicherten Abstand zum Start (Netz und Rauschen bewegen ihn wenig)
    expect(Math.abs(w.economy.costPush - cp0)).toBeLessThan(0.25);
    expect(Math.abs(w.economy.inflation - inf0)).toBeLessThan(1.5);
    let vorher = w.economy.costPush;
    for (let m = 0; m < 24; m++) {
      monat(w);
      expect(Math.abs(w.economy.costPush - vorher)).toBeLessThan(0.3);
      vorher = w.economy.costPush;
    }
    expect(w.economy.costPush).toBeLessThan(cp0 - 0.5);
  });

  test("bei 9 % Realzins sinkt die Inflation über zwei Jahre, die Glaubwürdigkeit erholt sich, und das kostet", () => {
    // Gemessen wird das Inflationsmodell, nicht der Zufallsverlauf: Zufallsereignisse würfeln nicht. Die festen Termine des Staatsjahres
    // (Mindestlohn, Haushaltsjahr, Kommunalwahl) kommen weiter und laufen ohne Antwort in ihre Standardfolge, wie in jeder Partie.
    // Mit Zufallsereignissen schwankte die Inflation nach 24 Monaten je nach Verlauf zwischen 13,0 und 15,2 %, je nachdem, welche Vorgänge
    // in welchem Monat kamen (Messung Welle H3, 6. November 2026). Schwellen und Aussage sind unverändert.
    const w = inhaber();
    const start = { inf: w.economy.inflation, glaub: w.economy.credibility, alq: w.economy.unemployment, zins: w.economy.policyRate };
    const chancen = VORLAGEN.map((v) => v.chance);
    try {
      for (const v of VORLAGEN) if (!FESTE_TERMINE.has(v.id)) v.chance = () => 0;
      for (let m = 0; m < 24; m++) monat(w);
    } finally {
      VORLAGEN.forEach((v, i) => (v.chance = chancen[i]!));
    }
    expect(w.economy.inflation).toBeLessThan(start.inf - 2);
    expect(w.economy.credibility).toBeGreaterThan(start.glaub + 0.1);
    expect(w.economy.policyRate).toBeLessThan(start.zins);
    expect(w.economy.unemployment).toBeGreaterThan(start.alq + 1);
  });
});

// Welle H5b: Spielstand des Inhabers vom 3. August 2043 (Kopie, nicht eingecheckt). Im echten Spiel fiel die Inflation danach bei einem Ziel von
// 5 % bis Mai 2045 auf 0,3 %, ohne Rohstoffpreisverfall: Ein dauerhafter Energiemangel bremste die Auslastung jeden Monat neu (−0,26 Punkte),
// und eine Auslastung von −4 bis −7 drückte die Inflation unter dem Ziel voll.
const INHABER_2043 = new URL("../../spielstand/staatsraeson_2043-08-03.json", import.meta.url);

describe.skipIf(!existsSync(INHABER_2043))("Spielstand des Inhabers 2043 (Welle H5b)", () => {
  test("ohne echten Grund läuft die Inflation in der Nähe des Ziels aus, nicht weit darunter", () => {
    const roh = JSON.parse(readFileSync(INHABER_2043, "utf8")) as { welt: World };
    const w = load(JSON.stringify(roh.welt));
    // Ein Ölpreisverfall wäre ein echter Grund für eine Inflation unter dem Ziel. Der Ölpreis bleibt darum auf seinem Stand von 2043,
    // damit der Test das Modell misst und nicht einen Schock der Außenwelt.
    const oel = w.economy.oel;
    const verlauf: number[] = [];
    ohneZufallsereignisse(() => {
      for (let m = 0; m < 24; m++) {
        monat(w);
        w.economy.oel = oel;
        verlauf.push(w.economy.inflation);
      }
    });
    const ziel = w.economy.inflationTarget;
    // Ziel − 2: Die TCMB nennt um ihr Ziel von 5 % ein Band von ±2 Punkten (Spielparameter, wie das Ziel selbst im Spiel). Darunter braucht
    // es einen echten Grund. Vorher fiel die Inflation in diesem Lauf auf 1,2 %, mit freiem Ölpreis auf 0,6 %.
    expect(Math.min(...verlauf)).toBeGreaterThan(ziel - 2);
    // Nach zwei Jahren steht sie wieder in der Nähe des Ziels
    expect(Math.abs(verlauf.at(-1)! - ziel)).toBeLessThan(2);
  });
});
