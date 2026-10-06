// Direkte Eingriffe des Präsidenten in Zentralbank und Haushalt.
// Der Spieler setzt den Leitzins nicht selbst (Wirtschaftsmodell, Abschnitt 5); Eingriffe kosten
// Glaubwürdigkeit und wirken über Währung und Erwartungen.

import { addLog, fmt } from "./log";
import { clamp } from "./economy";
import { addMarke, wirtschaftZustand } from "./wirtschaft";
import { programmZustand } from "./programme";
import { figur, neuerName, zentralbankGekraenkt } from "./figuren";
import { Rng } from "./rng";
import { GESPRAECH_ABKUEHLUNG, sprichMitFigur } from "./gespraeche";
import { entlasseSchnell } from "./nachfolge";
import type { Figur } from "./spiel-typen";
import type { GovernorStance } from "./types";
import type { World } from "./types";
import { t } from "../i18n";

/** Die Zentralbankführung austauschen (Stufe B). */
/** Platzhalter der Befehle und der Vorschau: „irgendeine neue Führung“, ohne Namen. */
const GOUVERNEUR_PLATZHALTER = t("sim2.sim.eingriffe.54f843e");

export function replaceGovernor(world: World, stance: GovernorStance, name: string): void {
  // Ist die Bank gesetzlich geschützt, lässt sich die Führung nicht entlassen (auch nicht über Gespräch oder Befehl)
  if (world.spiel && wirtschaftZustand(world).zb.stufe === "A") {
    addLog(world, "entscheidung", t("sim2.sim.eingriffe.c4ee291"), t("sim2.sim.eingriffe.c17279a"));
    return;
  }
  if (world.spiel) programmZustand(world).zentralbankAngriff = world.day;
  const e = world.economy;
  const loss = stance === "gefuegig" ? 0.25 : 0.1;
  e.credibility = clamp(e.credibility - loss, 0.05, 0.95);
  const jump = (stance === "gefuegig" ? 0.08 : 0.03) * (1 - e.credibility);
  e.usdTry *= 1 + jump;
  e.eurTry *= 1 + jump;
  e.riskPremium += stance === "gefuegig" ? 90 : 40;
  addMarke(world, "eingriff", `Neue Führung der Zentralbank (${stance === "gefuegig" ? "regierungsnah" : stance})`);
  const g = figur(world, "zentralbank");
  // Ohne genannten Namen trat früher niemand an: Die Figur behielt den Namen der entlassenen Führung. Jetzt bekommt die neue Führung einen
  // eigenen Namen (aus einem Zufallsstrom, der den Spielstrom nicht berührt, damit die Vorschau und der echte Lauf gleich ernennen).
  if (g && name === GOUVERNEUR_PLATZHALTER) {
    const benutzt = new Set((world.spiel?.figuren ?? []).map((f) => f.name));
    name = neuerName(new Rng(world.seed * 7 + world.day), benutzt, g.weiblich);
  }
  world.governor = { name, stance };
  if (g) g.name = name;
  if (g) g.loyalitaet = stance === "gefuegig" ? 70 : 50;
  addLog(
    world,
    "entscheidung",
    t("sim2.sim.eingriffe.465fc4d", { p0: name }),
    t("sim2.sim.eingriffe.a6feb6b", { p0: fmt(jump * 100) }),
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
    t("sim2.sim.eingriffe.26e7eb4"),
    faktor > 1 ? t("sim2.sim.eingriffe.31f7890") : t("sim2.sim.eingriffe.10c0f63"),
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
    t("sim2.sim.eingriffe.7d8016d", { p0: fmt(before), p1: fmt(percentOfGdp) }),
    percentOfGdp > before
      ? t("sim2.sim.eingriffe.ca52626")
      : t("sim2.sim.eingriffe.698861a"),
  );
  if (percentOfGdp !== before) addMarke(world, "haushalt", `Haushaltsimpuls ${fmt(before)} auf ${fmt(percentOfGdp)} % des BIP`);
}

/** Ein Mitglied der Regierung entlassen und ersetzen (Amtsträger mit Ministerium). Ohne Auswahlfenster wählt der Zufallsstrom einen Kandidaten; die Oberfläche geht über sim/nachfolge.ts. */
export function entlasseFigur(world: World, amt: Figur["amt"], rng: import("./rng").Rng): { ok: boolean; text: string; why?: string } {
  const r = entlasseSchnell(world, amt, rng);
  return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
}

export { GESPRAECH_ABKUEHLUNG, sprichMitFigur };
