// Die Welt außerhalb der Türkei: Energiepreis, Nachfrage der EU, Zinsniveau der Weltmärkte.
// Alle drei sind Indizes mit Start 100 (keine Preise), ziehen langsam zurück zum Mittel und
// werden gelegentlich von Schocks getroffen. Die Türkei kann sie nicht steuern, nur abfedern.
// Die Wirkung auf Inflation, Wachstum und Risikoaufschlag steht in economy.ts (AUSSEN).

import { addLog } from "./log";
import type { Rng } from "./rng";
import type { World } from "./types";

export const AUSSENWELT = {
  /** Rückkehr zum Mittel pro Monat */
  rueckkehr: 0.08,
  /** Monatliche Schwankung (Standardabweichung, Indexpunkte) */
  rauschen: { oel: 3.5, eu: 1.2, weltzins: 1.0 },
  /** Wahrscheinlichkeit eines Schocks pro Monat */
  schockChance: { oel: 0.035, eu: 0.02, weltzins: 0.015 },
} as const;

export function aussenweltStart(world: World): void {
  const e = world.economy;
  e.oel ??= 100;
  e.euNachfrage ??= 100;
  e.weltzins ??= 100;
}

/** Ein Monat Außenwelt. Meldet Schocks im Protokoll (Art „markt“), damit die Oberfläche sie anzeigen kann. */
export function aussenweltMonat(world: World, rng: Rng): void {
  const e = world.economy;
  aussenweltStart(world);
  const schritt = (wert: number, sd: number) => wert + AUSSENWELT.rueckkehr * (100 - wert) + rng.normal(sd);
  e.oel = Math.max(40, schritt(e.oel!, AUSSENWELT.rauschen.oel));
  e.euNachfrage = Math.max(60, schritt(e.euNachfrage!, AUSSENWELT.rauschen.eu));
  e.weltzins = Math.max(60, schritt(e.weltzins!, AUSSENWELT.rauschen.weltzins));

  if (rng.next() < AUSSENWELT.schockChance.oel) {
    const richtung = rng.next() < 0.7 ? 1 : -1;
    const staerke = rng.between(18, 38);
    e.oel = Math.max(40, e.oel! + richtung * staerke);
    addLog(
      world,
      "markt",
      richtung > 0 ? "Der Energiepreis springt am Weltmarkt nach oben." : "Der Energiepreis fällt am Weltmarkt deutlich.",
      richtung > 0
        ? "Die Türkei importiert den größten Teil ihrer Energie: Das treibt Inflation und Lira unter Druck."
        : "Billigere Energie entlastet Preise und Handelsbilanz.",
    );
  }
  if (rng.next() < AUSSENWELT.schockChance.eu) {
    const staerke = rng.between(8, 16);
    e.euNachfrage = Math.max(60, e.euNachfrage! - staerke);
    addLog(world, "markt", "Die Nachfrage aus der EU bricht ein.", "Die EU ist der wichtigste Handelspartner: Exporte und Beschäftigung in den Industrieprovinzen leiden.");
  }
  if (rng.next() < AUSSENWELT.schockChance.weltzins) {
    const staerke = rng.between(6, 14);
    e.weltzins = e.weltzins! + staerke;
    addLog(world, "markt", "Die großen Zentralbanken heben die Zinsen an.", "Anleger ziehen Geld aus Schwellenländern ab: Risikoaufschlag und Lira geraten unter Druck.");
  }
}
