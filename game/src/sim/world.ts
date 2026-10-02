// Weltzustand, Zeit und Handlungen. Jede verbindliche Zustandsänderung wird
// protokolliert (Entwicklungsplan, Abschnitt 6).

import type { EconomyState, MonthlySnapshot, Scenario, World } from "./types";
import { Rng, seedToState } from "./rng";
import { addDays, dayOfMonth, formatDateDe, formatMonthDe, monthNumber, monthOf, previousMonth } from "./dates";
import { clamp, dailyDepreciation, dailyRiskPremium, monthlyUpdate, realRate } from "./economy";
import { createNet, nationalAverage, policyCost, startAverage, stepNet } from "./netz";
import { REGIONAL, WEIGHTS } from "./regional";
import { ARCHETYP_DELTAS } from "../data/provinz_archetypen";
import { NET } from "./modell";
import { addLog, fmt } from "./log";
import { spielTick } from "./spiel";
import { ergaenzeFiguren } from "./figuren";
import { migriereVerfassung } from "./aufmerksamkeit";
import { zinssitzung } from "./zentralbank";
import { wirtschaftMonat } from "./wirtschaft-tick";
import { migriereUmsetzung, umsetzungMonat } from "./umsetzung";
import { turkey2026 } from "./scenario";

// Das Netz, das Protokoll und die Eingriffe liegen in eigenen Dateien; hier bleiben die Namen erreichbar.
export { NET } from "./modell";
export { addLog } from "./log";
export { replaceGovernor, criticizeCentralBank, setFiscalImpulse } from "./eingriffe";
export { setPolicy } from "./handeln";

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
    net: createNet(NET, economy, REGIONAL, WEIGHTS, ARCHETYP_DELTAS),
  };
  addLog(world, "ereignis", "Amtsantritt. Die Wirtschaftsdaten stammen vom Stichtag " + formatDateDe(scenario.dataDate) + ".");
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
      eurTry: e.eurTry / Math.pow(monthlyDepreciation, k - 1),
      policyRate: e.policyRate,
      riskPremium: e.riskPremium,
      debtRatio: e.debtRatio,
    });
  }
  return history;
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

  // Geldpolitischer Ausschuss: die Regel der Bank, mit Druck oder Weisung der Regierung (Zentralbank-Modul)
  if (world.ppkDays.includes(world.day)) zinssitzung(world);

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
      eurTry: e.eurTry,
      policyRate: e.policyRate,
      riskPremium: e.riskPremium,
      debtRatio: e.debtRatio,
    });
    publishQuarterlyGrowth(world);
    monthlyNet(world);
    wirtschaftMonat(world);
  }

  // Statistiken erscheinen mit Verzögerung (Wirtschaftsmodell, Abschnitt 2)
  if (dayOfMonth(world.date) === 3) publishInflation(world);
  if (dayOfMonth(world.date) === 10) publishUnemployment(world);

  // Spielschleife: Parlament, Ereignisse, Umfragen, Wahl (nur mit Amtsantritt)
  spielTick(world, rng);

  world.rngState = rng.state;
}

/** Politiknetz einen Monat fortschreiben und an das Wirtschaftsmodell zurückkoppeln. */
function monthlyNet(world: World): void {
  const e = world.economy;
  // INN-2: Erst läuft der Umsetzungsstand einen Monat weiter, dann wirken die Kanten
  // mit dem neuen Stand — so zählt auch der erste Monat nach einem Beschluss.
  umsetzungMonat(world.net);
  stepNet(NET, world.net, e, REGIONAL);
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
// Speichern und Laden: Der ganze Zustand ist reines JSON.

export function save(world: World): string {
  return JSON.stringify(world);
}

/**
 * Ältere Spielstände haben weniger Knoten im Politiknetz (neue Größen und Maßnahmen wurden hinten angehängt). Ohne Anpassung
 * rechnen die neuen Größen mit fehlenden Werten, und alles wird zu „NaN“. Hier bekommen die neuen Knoten ihre Startwerte.
 */
export function migriereNetz(world: World): void {
  const n = NET.nodes.length;
  const soll = n * 81;
  const ist = world.net.values.length;
  if (ist >= soll) return;
  const frisch = createNet(NET, world.economy, REGIONAL, WEIGHTS, ARCHETYP_DELTAS);
  const neu = frisch.start.slice(ist, soll);
  world.net.values.push(...neu);
  world.net.start.push(...neu);
  for (const slot of world.net.history) slot.push(...neu);
  if (world.net.acute) world.net.acute.push(...new Array<number>(soll - ist).fill(0));
}

const zahl = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

/**
 * Ein Spielstand, der mit „NaN“ gespeichert wurde, enthält `null` statt Zahlen (JSON kennt kein NaN). Damit er weiterspielbar ist,
 * bekommen fehlende Werte den Startwert des Szenarios oder einen ruhigen Vorgabewert.
 */
export function bereinigeZahlen(world: World): void {
  const n = world.net.values.length;
  for (let i = 0; i < n; i++) {
    if (!zahl(world.net.start[i])) world.net.start[i] = 50;
    if (!zahl(world.net.values[i])) world.net.values[i] = world.net.start[i]!;
  }
  for (const slot of world.net.history) for (let i = 0; i < slot.length; i++) if (!zahl(slot[i])) slot[i] = world.net.values[i] ?? 50;
  const start = Object.fromEntries(Object.entries(turkey2026.economy).map(([k, v]) => [k, v.value])) as Record<string, number>;
  const eco = world.economy as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(eco)) if ((v === null || typeof v !== "object") && !zahl(v) && start[k] !== undefined) eco[k] = start[k];
  for (const k of ["fxChange12", "policyCost", "costPush", "potentialShift"]) if (!zahl(eco[k])) eco[k] = 0;
  const s = world.spiel;
  if (s) {
    if (!zahl(s.kapital)) s.kapital = 30;
    if (!zahl(s.umfrage.zustimmung)) s.umfrage.zustimmung = 45;
    s.umfrage.verlauf = s.umfrage.verlauf.filter((v) => zahl(v.wert));
    if (s.reich) {
      if (!zahl(s.reich.verwaltung)) s.reich.verwaltung = 50;
      for (const b of Object.values(s.reich.bestand)) if (!zahl(b.zustand)) b.zustand = 60;
      for (const st of Object.values(s.reich.staetten)) if (!zahl(st.zustand)) st.zustand = 50;
      for (const l of s.reich.laufend) if (!zahl(l.fortschritt)) l.fortschritt = 0;
    }
  }
}

export function load(json: string): World {
  const w = JSON.parse(json) as World;
  migriereNetz(w);
  bereinigeZahlen(w);
  // Ältere Spielstände: die neuen Ämter des Umfelds (Justiz, Streitkräfte, Wirtschaft) werden einmal ergänzt
  ergaenzeFiguren(w);
  // Ältere Spielstände: das Belastungs-/Aufmerksamkeitskonto lädt mit den Startwerten
  migriereVerfassung(w);
  // Ältere Spielstände (INN-2): Es gab keinen Umsetzungsstand; Beschlossenes gilt als voll
  // umgesetzt (fehlender Eintrag = 100), beschädigte Einträge werden repariert
  migriereUmsetzung(NET, w.net);
  return w;
}

