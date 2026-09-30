// Wer wie abstimmt: Aus den Zahlen der Simulation (Lager, Duldung, Sachstimmen, Übertritte, Gesamtergebnis) wird eine Verteilung auf Fraktionen und Sitze.
// Die Simulation zählt nur Ja und Nein insgesamt; die Aufteilung auf Fraktionen folgt der Reihenfolge, in der sie diese Zahlen bildet:
// erst das Lager, dann die duldenden Fraktionen, dann Fraktionen mit erfüllter Kernforderung, zuletzt Übertritte aus der Opposition.

import type { World } from "../../sim/types";
import type { Gesetz } from "../../sim/spiel-typen";
import { duldung, sachstimmen } from "../../sim/fraktionen";
import { gesetzRichtung, stimmenSicht } from "../../sim/handeln";
import type { Fraktionslage, Parlamentslage } from "./lage";
import { proportional, zufall } from "./geometrie";

export type Zustand = "fest" | "zusage" | "wackelig" | "offen" | "nein";
export const ZUSTAENDE: Zustand[] = ["fest", "zusage", "wackelig", "offen", "nein"];

export type Zaehler = Record<string, Record<Zustand, number>>;

const leer = (): Record<Zustand, number> => ({ fest: 0, zusage: 0, wackelig: 0, offen: 0, nein: 0 });

function fuelle(z: Zaehler, frei: Record<string, number>, teilnehmer: Fraktionslage[], zustand: Zustand, menge: number): number {
  if (menge <= 0 || teilnehmer.length === 0) return 0;
  const gewicht = teilnehmer.map((f) => Math.max(0, frei[f.partei] ?? 0));
  const anteile = proportional(gewicht, menge, gewicht);
  let summe = 0;
  teilnehmer.forEach((f, k) => {
    const a = anteile[k]!;
    z[f.partei]![zustand] += a;
    frei[f.partei] = (frei[f.partei] ?? 0) - a;
    summe += a;
  });
  return summe;
}

export interface Vorgabe {
  /** Parteien, deren Kernforderung das Gesetz erfüllt */
  sachParteien: string[];
  duldungJa: number;
  sachJa: number;
  /** Gekaufte Stimmen (Absprachen) */
  absprachen: number;
  /** Erwartete Ja-Stimmen ohne Absprachen; der Rest über Lager, Duldung und Sachstimmen sind Übertritte */
  erwartet: number;
  /** Obere Grenze der Spanne */
  hoch: number;
}

/** Erwartete Verteilung vor der Abstimmung: pro Fraktion, wie viele Sitze fest, zugesagt, wackelig, offen oder Nein sind. */
export function verteileErwartung(lage: Parlamentslage, v: Vorgabe): Zaehler {
  const z: Zaehler = {};
  const frei: Record<string, number> = {};
  for (const f of lage.fraktionen) {
    z[f.partei] = leer();
    frei[f.partei] = f.sitze;
  }
  const lager = lage.fraktionen.filter((f) => f.rolle === "eigene" || f.rolle === "lager");
  const dulder = lage.fraktionen.filter((f) => f.rolle === "duldung");
  const sach = lage.fraktionen.filter((f) => f.rolle === "opposition" && v.sachParteien.includes(f.partei));
  const rest = lage.fraktionen.filter((f) => f.rolle === "opposition" && !v.sachParteien.includes(f.partei));
  fuelle(z, frei, lager, "fest", lage.lager);
  fuelle(z, frei, dulder, "zusage", v.duldungJa);
  fuelle(z, frei, sach, "zusage", v.sachJa);
  fuelle(z, frei, rest, "zusage", v.absprachen);
  const uebertritt = Math.max(0, v.erwartet - lage.lager - v.duldungJa - v.sachJa);
  fuelle(z, frei, rest, "wackelig", uebertritt);
  fuelle(z, frei, rest, "offen", Math.max(0, v.hoch - v.erwartet));
  for (const f of lage.fraktionen) z[f.partei]!.nein = frei[f.partei] ?? 0;
  return z;
}

/** Ja-Stimmen je Fraktion bei einem Ergebnis von `ja` Stimmen: die Reihenfolge der Simulation, von unten gekürzt. */
export function verteileErgebnis(lage: Parlamentslage, ja: number, duldungJa: number, sachJa: number, sachParteien: string[]): Record<string, number> {
  const z: Zaehler = {};
  const frei: Record<string, number> = {};
  for (const f of lage.fraktionen) {
    z[f.partei] = leer();
    frei[f.partei] = f.sitze;
  }
  const lager = lage.fraktionen.filter((f) => f.rolle === "eigene" || f.rolle === "lager");
  const dulder = lage.fraktionen.filter((f) => f.rolle === "duldung");
  const sach = lage.fraktionen.filter((f) => f.rolle === "opposition" && sachParteien.includes(f.partei));
  let budget = Math.max(0, Math.min(lage.gesamt, Math.round(ja)));
  budget -= fuelle(z, frei, lager, "fest", Math.min(budget, lage.lager));
  budget -= fuelle(z, frei, dulder, "zusage", Math.min(budget, duldungJa));
  budget -= fuelle(z, frei, sach, "zusage", Math.min(budget, sachJa));
  // Der Rest kommt aus der Opposition, zuerst aus den Fraktionen ohne Absprache, dann aus allen freien Sitzen
  const opposition = lage.fraktionen.filter((f) => f.rolle === "opposition" && !sachParteien.includes(f.partei));
  budget -= fuelle(z, frei, opposition, "wackelig", budget);
  if (budget > 0) budget -= fuelle(z, frei, lage.fraktionen, "wackelig", budget);
  const out: Record<string, number> = {};
  for (const f of lage.fraktionen) {
    const c = z[f.partei]!;
    out[f.partei] = c.fest + c.zusage + c.wackelig;
  }
  return out;
}

/** Wie das Ergebnis am Ende im Halbrund liegt: je Sitz (von links) Ja oder Nein; Abweichler sind in ihrem Keil verstreut. */
export function stimmzettel(lage: Parlamentslage, jaJe: Record<string, number>, seed: number): boolean[] {
  const out: boolean[] = [];
  const rng = zufall(seed);
  for (const f of lage.fraktionen) {
    const ja = Math.max(0, Math.min(f.sitze, jaJe[f.partei] ?? 0));
    const stimmen = Array.from({ length: f.sitze }, (_, k) => k < ja);
    // Mischen (Fisher-Yates mit festem Zufall): die wenigen Abweichler sitzen irgendwo im Keil
    for (let i = stimmen.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [stimmen[i], stimmen[j]] = [stimmen[j]!, stimmen[i]!];
    }
    out.push(...stimmen);
  }
  return out;
}

/** Was die Simulation für ein Gesetz erwartet, in der Form dieses Moduls. */
export function vorgabeFuer(world: World, g: Gesetz | null): Vorgabe {
  const richtung = g ? gesetzRichtung(world, g) : 0;
  const sicht = stimmenSicht(world, g ? { massnahme: g.massnahme, richtung } : undefined);
  const dul = duldung(world);
  const sach = sachstimmen(world, g?.massnahme, richtung);
  return { sachParteien: sach.parteien, duldungJa: dul.ja, sachJa: sach.ja, absprachen: g?.absprachen ?? 0, erwartet: sicht.erwartet, hoch: sicht.high };
}

export function zaehleZustaende(z: Zaehler): Record<Zustand, number> {
  const out = leer();
  for (const c of Object.values(z)) for (const k of ZUSTAENDE) out[k] += c[k];
  return out;
}

/** Zustand je Sitz (von links): Innerhalb der Keile der Fraktionen liegen erst die festen, dann zugesagte, wackelige, offene und Nein-Sitze. */
export function zustandJeSitz(lage: Parlamentslage, z: Zaehler): Zustand[] {
  const out: Zustand[] = [];
  for (const f of lage.fraktionen) {
    const c = z[f.partei]!;
    const liste: Zustand[] = [];
    for (const k of ZUSTAENDE) for (let i = 0; i < c[k]; i++) liste.push(k);
    while (liste.length < f.sitze) liste.push("nein");
    out.push(...liste.slice(0, f.sitze));
  }
  return out;
}
