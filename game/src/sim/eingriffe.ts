// Direkte Eingriffe des Präsidenten in Zentralbank und Haushalt.
// Der Spieler setzt den Leitzins nicht selbst (Wirtschaftsmodell, Abschnitt 5); Eingriffe kosten
// Glaubwürdigkeit und wirken über Währung und Erwartungen.

import { addLog, fmt } from "./log";
import { clamp } from "./economy";
import { addMarke, wirtschaftZustand } from "./wirtschaft";
import { programmZustand } from "./programme";
import { figur, zentralbankGekraenkt } from "./figuren";
import { GESPRAECH_ABKUEHLUNG, sprichMitFigur } from "./gespraeche";
import { entlasseSchnell } from "./nachfolge";
import type { Figur } from "./spiel-typen";
import type { GovernorStance } from "./types";
import type { World } from "./types";

/** Die Zentralbankführung austauschen (Stufe B). */
export function replaceGovernor(world: World, stance: GovernorStance, name: string): void {
  if (world.spiel) programmZustand(world).zentralbankAngriff = world.day;
  const e = world.economy;
  const loss = stance === "gefuegig" ? 0.25 : 0.1;
  e.credibility = clamp(e.credibility - loss, 0.05, 0.95);
  const jump = (stance === "gefuegig" ? 0.08 : 0.03) * (1 - e.credibility);
  e.usdTry *= 1 + jump;
  e.eurTry *= 1 + jump;
  e.riskPremium += stance === "gefuegig" ? 90 : 40;
  world.governor = { name, stance };
  addMarke(world, "eingriff", `Neue Führung der Zentralbank (${stance === "gefuegig" ? "regierungsnah" : stance})`);
  const g = figur(world, "zentralbank");
  if (g && name !== "eine neue, regierungsnahe Führung") g.name = name;
  if (g) g.loyalitaet = stance === "gefuegig" ? 70 : 50;
  addLog(
    world,
    "entscheidung",
    `Der Präsident entlässt die Zentralbankführung und ernennt ${name}.`,
    `Märkte werten das als Eingriff in die Unabhängigkeit: Die Lira fällt um ${fmt(jump * 100)} %, der Risikoaufschlag steigt.`,
  );
}

/** Wie stark ein Druck auf die Zinssitzung gemeint ist: vertraulich im Gespräch schwächer als öffentlich in einer Rede. */
export const DRUCK_STAERKE = { gespraech: 0.6, rede: 1.2 } as const;

/** Wie oft die Bank in den letzten zwölf Monaten öffentlich angegriffen wurde; jeder weitere Angriff wirkt stärker (Faktor ab 1). */
export function kritikStaerke(world: World): number {
  const z = world.spiel ? wirtschaftZustand(world).zb : null;
  const n = z ? z.kritikTage.filter((d) => d > world.day - 365).length : 0;
  return 1 + 0.5 * n;
}

/** Die Zentralbank öffentlich kritisieren. Wiederholte Kritik verstärkt die Wirkung; die nächste Zinssitzung steht unter Druck. */
export function criticizeCentralBank(world: World): void {
  if (world.spiel) programmZustand(world).zentralbankAngriff = world.day;
  const faktor = kritikStaerke(world);
  const e = world.economy;
  e.credibility = clamp(e.credibility - 0.03 * faktor, 0.05, 0.95);
  e.usdTry *= 1 + 0.008 * faktor;
  e.eurTry *= 1 + 0.008 * faktor;
  e.riskPremium += 10 * faktor;
  if (world.spiel) {
    const z = wirtschaftZustand(world).zb;
    z.kritikTage = z.kritikTage.filter((d) => d > world.day - 365);
    z.kritikTage.push(world.day);
    if (z.stufe !== "C") z.druck = { richtung: -1, weg: "rede", staerke: DRUCK_STAERKE.rede, tag: world.day };
  }
  addLog(
    world,
    "entscheidung",
    "Der Präsident kritisiert die Zinspolitik öffentlich.",
    faktor > 1 ? "Wiederholte Kritik: Anleger fürchten dauerhaften politischen Druck; die Lira gibt deutlicher nach." : "Anleger fürchten politischen Druck; die Lira gibt leicht nach.",
  );
  addMarke(world, "eingriff", "Öffentliche Kritik an der Zinspolitik");
  zentralbankGekraenkt(world, -6);
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
  if (percentOfGdp !== before) addMarke(world, "haushalt", `Haushaltsimpuls ${fmt(before)} auf ${fmt(percentOfGdp)} % des BIP`);
}

/** Ein Mitglied der Regierung entlassen und ersetzen (Amtsträger mit Ministerium). Ohne Auswahlfenster wählt der Zufallsstrom einen Kandidaten; die Oberfläche geht über sim/nachfolge.ts. */
export function entlasseFigur(world: World, amt: Figur["amt"], rng: import("./rng").Rng): { ok: boolean; text: string; why?: string } {
  const r = entlasseSchnell(world, amt, rng);
  return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
}

export { GESPRAECH_ABKUEHLUNG, sprichMitFigur };
