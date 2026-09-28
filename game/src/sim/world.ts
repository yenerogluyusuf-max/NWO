// Weltzustand, Zeit und Handlungen. Jede verbindliche Zustandsänderung wird
// protokolliert (Entwicklungsplan, Abschnitt 6).

import type { EconomyState, GovernorStance, LogEntry, LogKind, MonthlySnapshot, Scenario, World } from "./types";
import { Rng, seedToState } from "./rng";
import { addDays, dayOfMonth, formatMonthDe, monthNumber, monthOf, previousMonth } from "./dates";
import { clamp, dailyDepreciation, dailyRiskPremium, monthlyUpdate, ppkDecision, realRate } from "./economy";
import { buildModel, createNet, nationalAverage, policyCost, startAverage, stepNet, type NetModel } from "./netz";
import { EDGES, NODES } from "../data/politiknetz";

/** Das Politiknetz ist statisch; nur sein Zustand gehört zum Spielstand. */
export const NET: NetModel = buildModel(NODES, EDGES);

/** Kopplung des Politiknetzes an das Wirtschaftsmodell (Platzhalter für die Kalibrierung). */
const COUPLING = {
  /** Prozentpunkte Inflation je Indexpunkt Kostendruck über dem Start */
  costPush: 0.08,
  /** Prozentpunkte Potenzialwachstum je Indexpunkt Produktivität über dem Start */
  productivity: 0.04,
};

const PPK_INTERVAL_DAYS = 45;

export function createWorld(scenario: Scenario, seed: number): World {
  const economy = {
    ...Object.fromEntries(Object.entries(scenario.economy).map(([k, v]) => [k, v.value])),
    fxChange12: 0,
    policyCost: 0,
    costPush: 0,
    potentialShift: 0,
  } as unknown as EconomyState;
  const history = syntheticHistory(economy, scenario.startDate);
  economy.fxChange12 = (economy.usdTry / history[0]!.usdTry - 1) * 100;

  const ppkDays: number[] = [];
  for (let d = 20; d < 365 * 30; d += PPK_INTERVAL_DAYS) ppkDays.push(d);

  const world: World = {
    scenarioId: scenario.id,
    seed,
    rngState: seedToState(seed),
    day: 0,
    date: scenario.startDate,
    economy,
    governor: { ...scenario.governor },
    ppkDays,
    history,
    published: structuredClone(scenario.published),
    log: [],
    net: createNet(NET, economy),
  };
  addLog(world, "ereignis", "Amtsantritt. Die Wirtschaftsdaten stammen vom Stichtag " + scenario.dataDate + ".");
  return world;
}

/**
 * Zwölf Monate Vorgeschichte, rückwärts aus den Startwerten abgeleitet, damit
 * Vorjahresvergleiche und Verzögerungen vom ersten Tag an funktionieren.
 * Die Auslastung vor einem Jahr ergibt sich aus dem gemessenen Wachstum.
 */
function syntheticHistory(e: EconomyState, startDate: string): MonthlySnapshot[] {
  const gapYearAgo = e.outputGap - (e.growth - e.potentialGrowth);
  const monthlyDepreciation = Math.pow(1 + (e.inflation - 2.5) / 100, 1 / 12);
  const history: MonthlySnapshot[] = [];
  for (let k = 12; k >= 1; k--) {
    const share = (12 - k) / 11;
    history.push({
      month: previousMonth(monthOf(startDate), k),
      inflation: e.inflation,
      growth: e.growth,
      unemployment: e.unemployment,
      outputGap: gapYearAgo + share * (e.outputGap - gapYearAgo),
      realRate: realRate(e),
      usdTry: e.usdTry / Math.pow(monthlyDepreciation, k - 1),
    });
  }
  return history;
}

export function addLog(world: World, kind: LogKind, text: string, why?: string): void {
  const entry: LogEntry = { day: world.day, date: world.date, kind, text };
  if (why) entry.why = why;
  world.log.push(entry);
}

/** Einen Tag fortschreiben. */
export function tick(world: World): void {
  const rng = new Rng(world.rngState);
  world.day += 1;
  world.date = addDays(world.date, 1);
  const e = world.economy;

  // Finanzmärkte reagieren täglich (Z4, Z8)
  const dep = dailyDepreciation(e, rng);
  e.usdTry *= 1 + dep;
  e.eurTry *= 1 + dep + rng.normal(0.002);
  e.riskPremium = clamp(dailyRiskPremium(e, rng), 50, 2000);

  // Geldpolitischer Ausschuss
  if (world.ppkDays.includes(world.day)) {
    const { newRate, why } = ppkDecision(e, world.governor.stance);
    const old = e.policyRate;
    e.policyRate = newRate;
    const text =
      newRate === old
        ? `Die Zentralbank hält den Leitzins bei ${fmt(newRate)} %.`
        : `Die Zentralbank ${newRate > old ? "erhöht" : "senkt"} den Leitzins von ${fmt(old)} auf ${fmt(newRate)} %.`;
    addLog(world, "entscheidung", text, why);
  }

  // Realwirtschaft monatlich, jeweils am Monatsersten für den abgelaufenen Monat
  if (dayOfMonth(world.date) === 1) {
    monthlyUpdate(e, world.history, rng);
    world.history.push({
      month: previousMonth(monthOf(world.date)),
      inflation: e.inflation,
      growth: e.growth,
      unemployment: e.unemployment,
      outputGap: e.outputGap,
      realRate: realRate(e),
      usdTry: e.usdTry,
    });
    publishQuarterlyGrowth(world);
    monthlyNet(world);
  }

  // Statistiken erscheinen mit Verzögerung (Wirtschaftsmodell, Abschnitt 2)
  if (dayOfMonth(world.date) === 3) publishInflation(world);
  if (dayOfMonth(world.date) === 10) publishUnemployment(world);

  world.rngState = rng.state;
}

/** Politiknetz einen Monat fortschreiben und an das Wirtschaftsmodell zurückkoppeln. */
function monthlyNet(world: World): void {
  const e = world.economy;
  stepNet(NET, world.net, e);
  e.policyCost = policyCost(NET, world.net);
  const cost = nationalAverage(NET, world.net, "kostendruck") - startAverage(NET, world.net, "kostendruck");
  e.costPush = clamp(COUPLING.costPush * cost, -5, 5);
  const prod = nationalAverage(NET, world.net, "produktivitaet") - startAverage(NET, world.net, "produktivitaet");
  e.potentialShift = clamp(COUPLING.productivity * prod, -2, 2);
}

export function advance(world: World, days: number): void {
  for (let i = 0; i < days; i++) tick(world);
}

function findSnapshot(world: World, month: string) {
  return world.history.find((s) => s.month === month);
}

function publishInflation(world: World): void {
  const month = previousMonth(monthOf(world.date));
  const snap = findSnapshot(world, month);
  if (!snap) return;
  const before = world.published.inflation.value;
  world.published.inflation = { value: snap.inflation, period: month, publishedOn: world.date };
  addLog(
    world,
    "statistik",
    `Inflation ${formatMonthDe(month)}: ${fmt(snap.inflation)} % zum Vorjahr (zuvor ${fmt(before)} %).`,
  );
}

function publishUnemployment(world: World): void {
  const month = previousMonth(monthOf(world.date), 2);
  const snap = findSnapshot(world, month);
  if (!snap) return;
  world.published.unemployment = { value: snap.unemployment, period: month, publishedOn: world.date };
  addLog(world, "statistik", `Arbeitslosenquote ${formatMonthDe(month)}: ${fmt(snap.unemployment)} %.`);
}

function publishQuarterlyGrowth(world: World): void {
  // Am 1. März, Juni, September und Dezember erscheint das Quartal, das zwei Monate zuvor endete.
  const m = monthNumber(world.date);
  if (m % 3 !== 0) return;
  const quarterEnd = previousMonth(monthOf(world.date), 3);
  const snap = findSnapshot(world, quarterEnd);
  if (!snap) return;
  const q = Math.ceil(Number(quarterEnd.slice(5, 7)) / 3);
  const period = `${quarterEnd.slice(0, 4)}-Q${q}`;
  world.published.growth = { value: snap.growth, period, publishedOn: world.date };
  addLog(world, "statistik", `Wachstum ${q}. Quartal ${quarterEnd.slice(0, 4)}: ${fmt(snap.growth)} % zum Vorjahr.`);
}

// ---------------------------------------------------------------------------
// Handlungen des Spielers (vorerst als Entwickleransicht mit Knöpfen, M1)

/** Die Zentralbankführung austauschen (Stufe B). */
export function replaceGovernor(world: World, stance: GovernorStance, name: string): void {
  const e = world.economy;
  const loss = stance === "gefuegig" ? 0.25 : 0.1;
  e.credibility = clamp(e.credibility - loss, 0.05, 0.95);
  const jump = (stance === "gefuegig" ? 0.08 : 0.03) * (1 - e.credibility);
  e.usdTry *= 1 + jump;
  e.eurTry *= 1 + jump;
  e.riskPremium += stance === "gefuegig" ? 90 : 40;
  world.governor = { name, stance };
  addLog(
    world,
    "entscheidung",
    `Der Präsident entlässt die Zentralbankführung und ernennt ${name}.`,
    `Märkte werten das als Eingriff in die Unabhängigkeit: Die Lira fällt um ${fmt(jump * 100)} %, der Risikoaufschlag steigt.`,
  );
}

/** Die Zentralbank öffentlich kritisieren. */
export function criticizeCentralBank(world: World): void {
  const e = world.economy;
  e.credibility = clamp(e.credibility - 0.03, 0.05, 0.95);
  e.usdTry *= 1.008;
  e.eurTry *= 1.008;
  e.riskPremium += 10;
  addLog(
    world,
    "entscheidung",
    "Der Präsident kritisiert die Zinspolitik öffentlich.",
    "Anleger fürchten politischen Druck; die Lira gibt leicht nach.",
  );
}

/** Zusätzliche Staatsausgaben (+) oder Kürzungen (−) in % des BIP festlegen. */
export function setFiscalImpulse(world: World, percentOfGdp: number): void {
  const before = world.economy.fiscalImpulse;
  world.economy.fiscalImpulse = percentOfGdp;
  addLog(
    world,
    "entscheidung",
    `Haushalt: zusätzlicher Impuls von ${fmt(before)} auf ${fmt(percentOfGdp)} % des BIP geändert.`,
    percentOfGdp > before
      ? "Mehr Ausgaben stützen die Nachfrage, erhöhen aber Defizit und Schulden."
      : "Weniger Ausgaben dämpfen die Nachfrage und entlasten den Haushalt.",
  );
}

/** Eine Maßnahme des Politiknetzes auf eine neue Stufe setzen (0–100). */
export function setPolicy(world: World, id: string, level: number): void {
  const i = NET.index.get(id);
  const node = i === undefined ? undefined : NET.nodes[i];
  if (!node || node.kind !== "massnahme") throw new Error(`Keine Maßnahme: ${id}`);
  const target = clamp(Math.round(level), 0, 100);
  const current = nationalAverage(NET, world.net, id);
  world.net.targets[id] = target;
  world.net.steps[id] = Math.max(Math.abs(target - current) / (node.months ?? 1), 0.01);
  const costChange = ((target - current) / 100) * (node.cost ?? 0);
  const months = node.months ?? 1;
  addLog(
    world,
    "entscheidung",
    `${node.name}: von Stufe ${Math.round(current)} auf ${target} ${target > current ? "erhöht" : "gesenkt"}.`,
    `${node.text} Umsetzung in etwa ${months} ${months === 1 ? "Monat" : "Monaten"}` +
      (costChange !== 0
        ? `; ${costChange > 0 ? "kostet" : "bringt"} jährlich etwa ${fmt(Math.abs(costChange))} % der Wirtschaftsleistung.`
        : "."),
  );
}

// ---------------------------------------------------------------------------
// Speichern und Laden: Der ganze Zustand ist reines JSON.

export function save(world: World): string {
  return JSON.stringify(world);
}

export function load(json: string): World {
  return JSON.parse(json) as World;
}

function fmt(x: number): string {
  return x.toLocaleString("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
}
