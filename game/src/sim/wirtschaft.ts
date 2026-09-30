// Die Wirtschaftsakte: Zustand, Verlauf der Kennzahlen und Marken auf der Zeitachse. Die Größen des Wirtschaftsmodells stehen schon in
// `world.history` (Monatswerte); hier kommen weitere Größen dazu (Netzknoten, Defizit, Zinsausgaben), damit jede Zahl einen Verlauf hat.

import type { World } from "./types";
import type { HaushaltZustand, Marke, WirtschaftZustand, ZentralbankZustand } from "./wirtschaft-typen";
import { realRate } from "./economy";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { monthOf, previousMonth } from "./dates";
import { ZINSSATZ_START } from "../data/haushaltsplan";
import { turkey2026 } from "./scenario";

/** So viele Monate hält der Verlauf höchstens fest. */
export const MAX_MONATE = 120;

const netz = (w: World, id: string) => nationalAverage(NET, w.net, id);

/** Das geplante Defizit in % des BIP: Grundlinie, eigener Impuls, Kosten der Maßnahmen und Mehrzinsen. */
export function defizitJetzt(w: World): number {
  const e = w.economy;
  return e.deficit + e.fiscalImpulse + e.policyCost + (e.zinsMehrlast ?? 0);
}

/** Zinsausgaben des Staates in % des BIP: Schuldenquote mal Durchschnittszins. */
export function zinsausgabenJetzt(w: World): number {
  const z = w.spiel?.wirtschaft?.haushalt;
  const satz = z ? z.zinssatz : ZINSSATZ_START;
  return (w.economy.debtRatio * satz) / 100;
}

/** Größen, die nicht in `world.history` stehen und deshalb eigens aufgezeichnet werden. */
export const EXTRA: Record<string, (w: World) => number> = {
  erwartung: (w) => w.economy.expectedInflation,
  realzins: (w) => realRate(w.economy),
  defizit: defizitJetzt,
  zinssatz: (w) => w.spiel?.wirtschaft?.haushalt.zinssatz ?? ZINSSATZ_START,
  zinsausgaben: zinsausgabenJetzt,
  reallohn: (w) => netz(w, "realeinkommen"),
  investitionen: (w) => netz(w, "investitionen"),
  export: (w) => netz(w, "export"),
  vertrauen_maerkte: (w) => netz(w, "vertrauen_maerkte"),
  teuerung: (w) => netz(w, "lebenshaltung"),
  armut: (w) => netz(w, "armut"),
  kredite: (w) => netz(w, "kredite"),
  auslandskapital: (w) => netz(w, "auslandskapital"),
  zinslast: (w) => netz(w, "zinslast"),
};

function neuerZentralbankZustand(): ZentralbankZustand {
  return { stufe: "B", druck: null, kritikTage: [], sitzungen: [] };
}

/** Der Marktzins beim Start des Szenarios (Leitzins plus Risikoaufschlag): der Bezugspunkt des Zinsdienstes, unabhängig davon, wann die Akte angelegt wird. */
export const MARKTZINS_START = turkey2026.economy.policyRate.value + turkey2026.economy.riskPremium.value / 100;

function neuerHaushaltZustand(): HaushaltZustand {
  return { stufen: {}, zinssatz: ZINSSATZ_START, marktStart: MARKTZINS_START, aenderungen: [] };
}

function neuerZustand(w: World): WirtschaftZustand {
  // Zwölf Monate Vorgeschichte als Ruhelage, damit jede Reihe von Anfang an eine Linie hat
  const monate = w.history.slice(-12).map((s) => s.month);
  while (monate.length < 12) monate.unshift(previousMonth(monate[0] ?? monthOf(w.date)));
  const reihen: Record<string, number[]> = {};
  for (const [id, f] of Object.entries(EXTRA)) reihen[id] = monate.map(() => f(w));
  return { zb: neuerZentralbankZustand(), haushalt: neuerHaushaltZustand(), monate, reihen, marken: [] };
}

/** Der Zustand der Wirtschaftsakte; ältere Spielstände legen ihn beim ersten Zugriff an. Ohne Spielschleife gibt es einen flüchtigen. */
export function wirtschaftZustand(w: World): WirtschaftZustand {
  const sp = w.spiel;
  if (sp?.wirtschaft) return sp.wirtschaft;
  const z = neuerZustand(w);
  if (sp) sp.wirtschaft = z;
  return z;
}

export const zbZustand = (w: World): ZentralbankZustand => wirtschaftZustand(w).zb;
export const haushaltZustand = (w: World): HaushaltZustand => wirtschaftZustand(w).haushalt;

/** Eine Marke auf der Zeitachse setzen (Zinsentscheid, Haushalt, Eingriff). */
export function addMarke(w: World, art: Marke["art"], text: string): void {
  if (!w.spiel) return;
  const z = wirtschaftZustand(w);
  z.marken.push({ tag: w.day, monat: monthOf(w.date), art, text });
  if (z.marken.length > 200) z.marken.shift();
}

/** Alle Marken für die Zeitachse: eigene Marken plus die Ereignisse aus der Chronik. */
export function alleMarken(w: World): Marke[] {
  const eigene = w.spiel?.wirtschaft?.marken ?? [];
  const chronik: Marke[] = (w.spiel?.chronik ?? [])
    .filter((c) => !/^(Wirkungsbericht|Schritt erreicht|Programm erfüllt)/.test(c.titel))
    .map((c) => ({ tag: c.tag, monat: monthOf(c.datum), art: "ereignis" as const, text: `${c.titel}: ${c.ausgang}` }));
  return [...eigene, ...chronik].sort((a, b) => a.tag - b.tag);
}

/** Einmal im Monat: die Reihen fortschreiben (am Monatsersten, für den Vormonat). */
export function zeichneAuf(w: World): void {
  if (!w.spiel) return;
  const z = wirtschaftZustand(w);
  const monat = previousMonth(monthOf(w.date));
  if (z.monate[z.monate.length - 1] === monat) return;
  z.monate.push(monat);
  for (const [id, f] of Object.entries(EXTRA)) {
    const reihe = (z.reihen[id] ??= z.monate.slice(0, -1).map(() => f(w)));
    reihe.push(f(w));
  }
  while (z.monate.length > MAX_MONATE) {
    z.monate.shift();
    for (const r of Object.values(z.reihen)) r.shift();
  }
}

export interface Punkt {
  monat: string;
  wert: number;
  /** Ob der Wert der aktuelle ist (noch nicht abgeschlossen) */
  jetzt?: boolean;
}

/** Größen aus `world.history`; bei veröffentlichten Größen zählt nur, was schon bekannt ist. */
type HistorieSchluessel = "inflation" | "growth" | "unemployment" | "usdTry" | "eurTry" | "policyRate" | "riskPremium" | "debtRatio";
const HIST: Record<string, { key: HistorieSchluessel; veroeffentlicht?: "inflation" | "growth" | "unemployment"; aktuell: (w: World) => number }> = {
  inflation: { key: "inflation", veroeffentlicht: "inflation", aktuell: (w) => w.published.inflation.value },
  wachstum: { key: "growth", veroeffentlicht: "growth", aktuell: (w) => w.published.growth.value },
  arbeitslosigkeit: { key: "unemployment", veroeffentlicht: "unemployment", aktuell: (w) => w.published.unemployment.value },
  usd: { key: "usdTry", aktuell: (w) => w.economy.usdTry },
  eur: { key: "eurTry", aktuell: (w) => w.economy.eurTry },
  leitzins: { key: "policyRate", aktuell: (w) => w.economy.policyRate },
  risiko: { key: "riskPremium", aktuell: (w) => w.economy.riskPremium },
  schulden: { key: "debtRatio", aktuell: (w) => w.economy.debtRatio },
};

/** Letzter Monat, der zu einer veröffentlichten Größe gehört (Quartale enden im dritten Monat). */
function bekanntBis(w: World, art: "inflation" | "growth" | "unemployment"): string {
  const p = w.published[art].period;
  const q = /^(\d{4})-Q([1-4])$/.exec(p);
  return q ? `${q[1]}-${String(Number(q[2]) * 3).padStart(2, "0")}` : p;
}

/** Der Verlauf einer Kennzahl, älteste zuerst. Tagesaktuelle Größen bekommen als letzten Punkt den heutigen Stand. */
export function verlauf(w: World, id: string): Punkt[] {
  const h = HIST[id];
  if (h) {
    const bis = h.veroeffentlicht ? bekanntBis(w, h.veroeffentlicht) : undefined;
    const punkte: Punkt[] = w.history
      .filter((s) => bis === undefined || s.month <= bis)
      .map((s) => ({ monat: s.month, wert: s[h.key] ?? NaN }))
      .filter((p) => Number.isFinite(p.wert));
    if (!h.veroeffentlicht) punkte.push({ monat: monthOf(w.date), wert: h.aktuell(w), jetzt: true });
    return punkte;
  }
  const f = EXTRA[id];
  if (!f) return [];
  const z = wirtschaftZustand(w);
  const reihe = z.reihen[id] ?? [];
  const punkte: Punkt[] = z.monate.map((m, i) => ({ monat: m, wert: reihe[i] ?? NaN })).filter((p) => Number.isFinite(p.wert));
  punkte.push({ monat: monthOf(w.date), wert: f(w), jetzt: true });
  return punkte;
}

/** Der Monat des Amtsantritts (Startlinie der Diagramme). */
export function startMonat(w: World): string {
  return monthOf(w.spiel?.start.datum ?? w.date);
}
