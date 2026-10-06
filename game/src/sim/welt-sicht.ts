// Lesefunktionen für die Länderansicht: Anzeigegruppen, Haltung zur Türkei für jeden Akteur, Suche und die Wahlansicht.
// Nichts davon verändert den Zustand (außer dem Anlegen des Weltmodells beim ersten Zugriff älterer Spielstände).

import { GRUPPEN_FILTER } from "../data/welt-institutionen";
import { WEITERE } from "../data/welt-weitere";
import { formatDateDe } from "./dates";
import { haltungWort, LAENDER } from "./laender";
import { AKTEUR_IDS, akteurName, beziehungZurTuerkei, eigenVon, haltungFuehrung, haltungWortVon, istHauptakteur, weltModell } from "./welt-modell";
import { lagebildZu } from "./welt-dienst";
import type { World } from "./types";
import { t as tx } from "../i18n";

export interface AkteurKurz {
  id: string;
  name: string;
  kurz: string;
  haupt: boolean;
  gruppe: string;
}

export const ANZEIGE_GRUPPEN = [tx("sim2.sim.welt-sicht.36d8358"), "Nachbarn", "EU-Staaten", tx("sim2.sim.welt-sicht.b34f67d"), tx("sim2.sim.welt-sicht.64ed00f"), tx("sim2.sim.welt-sicht.2b8b714")] as const;

const GRUPPE_VON: Record<string, (typeof ANZEIGE_GRUPPEN)[number]> = {
  USA: tx("sim2.sim.welt-sicht.36d8358"), EU: tx("sim2.sim.welt-sicht.36d8358"), RUS: tx("sim2.sim.welt-sicht.36d8358"), CHN: tx("sim2.sim.welt-sicht.36d8358"), IND: tx("sim2.sim.welt-sicht.36d8358"), BRA: tx("sim2.sim.welt-sicht.36d8358"), GBR: tx("sim2.sim.welt-sicht.36d8358"),
  GRC: "Nachbarn", IRN: "Nachbarn", SYR: "Nachbarn", IRQ: "Nachbarn", ARM: "Nachbarn", ISR: "Nachbarn", UKR: "Nachbarn", GEO: "Nachbarn", CYP: "Nachbarn", BGR: "Nachbarn", AZE: "Nachbarn",
  DEU: "EU-Staaten", FRA: "EU-Staaten", ITA: "EU-Staaten", ESP: "EU-Staaten", POL: "EU-Staaten", NLD: "EU-Staaten", ROU: "EU-Staaten", HUN: "EU-Staaten", AUT: "EU-Staaten", SWE: "EU-Staaten",
  SAU: tx("sim2.sim.welt-sicht.b34f67d"), ARE: tx("sim2.sim.welt-sicht.b34f67d"), QAT: tx("sim2.sim.welt-sicht.b34f67d"), EGY: tx("sim2.sim.welt-sicht.b34f67d"), PAK: tx("sim2.sim.welt-sicht.b34f67d"), LBY: tx("sim2.sim.welt-sicht.b34f67d"),
  KAZ: tx("sim2.sim.welt-sicht.64ed00f"), UZB: tx("sim2.sim.welt-sicht.64ed00f"), KGZ: tx("sim2.sim.welt-sicht.64ed00f"), TKM: tx("sim2.sim.welt-sicht.64ed00f"),
  ZAF: tx("sim2.sim.welt-sicht.2b8b714"), ETH: tx("sim2.sim.welt-sicht.2b8b714"), IDN: tx("sim2.sim.welt-sicht.2b8b714"),
};

/** Alle Akteure in der Reihenfolge der Anzeigegruppen. */
export function akteurListe(): AkteurKurz[] {
  const haupt = new Map(LAENDER.map((l) => [l.id, l]));
  const weitere = new Map(WEITERE.map((x) => [x.id, x]));
  const alle: AkteurKurz[] = AKTEUR_IDS.map((id) => {
    const h = haupt.get(id);
    const w = weitere.get(id);
    return { id, name: h?.name ?? w?.name ?? id, kurz: h?.kurz ?? w?.kurz ?? id, haupt: !!h, gruppe: GRUPPE_VON[id] ?? "Süden und Afrika" };
  });
  const rang = (g: string) => ANZEIGE_GRUPPEN.indexOf(g as (typeof ANZEIGE_GRUPPEN)[number]);
  return alle.sort((a, b) => rang(a.gruppe) - rang(b.gruppe));
}

/** Ob ein Akteur zu einem Filter der Bildschirmgruppen gehört (ids = null bedeutet alle). */
export function imFilter(filterId: string, id: string): boolean {
  const f = GRUPPEN_FILTER.find((x) => x.id === filterId);
  return !f || f.ids === null || f.ids.includes(id);
}

const norm = (s: string): string =>
  s
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss");

/** Suche nach Name oder Kürzel, ohne auf Umlaute zu achten. */
export function trifft(a: AkteurKurz, text: string): boolean {
  const t = norm(text.trim());
  if (!t) return true;
  return norm(a.name).includes(t) || norm(a.kurz) === t || a.id.toLowerCase() === t;
}

/** Haltung eines Akteurs zur Türkei in einem Wort (Hauptakteure wie bisher, weitere nach derselben Schwelle). */
export function haltungWortAlle(w: World, id: string): string {
  if (istHauptakteur(id)) return haltungWort(w, id);
  const b = beziehungZurTuerkei(w, id);
  if (b.vertrauen >= 75) return "enger Partner";
  if (b.vertrauen >= 55 && b.konflikt < 50) return "Partner";
  if (b.vertrauen >= 40) return b.konflikt >= 60 ? "angespannt" : "nüchtern";
  if (b.vertrauen >= 25) return "kühl";
  return "feindselig";
}

export interface WahlSicht {
  art: string;
  datum: string;
  datumDe: string;
  tage: number;
  monate: number;
  fuehrung: { kurs: -1 | 0 | 1; wort: string };
  herausforderer?: { kurs: -1 | 0 | 1; wort: string; staerke: string };
  /** Aussicht der Amtsführung laut Aufklärung (nur, wenn der Dienst ein Lagebild geliefert hat) */
  lagebild?: { prozent: number; tage: number };
  /** Ob in diesem Staat ein Machtwechsel durch Wahl überhaupt möglich ist */
  offen: boolean;
}

const staerkeWort = (x: number): string => (x >= 58 ? tx("sim2.sim.welt-sicht.b2bb223") : x <= 42 ? "schwach" : "gleichauf");

export function wahlSicht(w: World, id: string): WahlSicht | null {
  const e = eigenVon(w, id);
  if (!e.wahl) return null;
  const tage = e.wahl.tag - w.day;
  const ch = e.wahl.herausforderer;
  const l = lagebildZu(w, id);
  const k = haltungFuehrung(w, id);
  return {
    art: e.wahl.art,
    datum: e.wahl.datum,
    datumDe: /^\d{4}-\d{2}-\d{2}$/.test(e.wahl.datum) ? formatDateDe(e.wahl.datum) : e.wahl.datum,
    tage,
    monate: Math.max(0, Math.round(tage / 30)),
    fuehrung: { kurs: k, wort: haltungWortVon(k) },
    ...(ch ? { herausforderer: { kurs: ch.kurs, wort: haltungWortVon(ch.kurs), staerke: staerkeWort(ch.staerke) } } : {}),
    ...(l ? { lagebild: { prozent: Math.round(l.pAmtsfuehrung * 100), tage: w.day - l.tag } } : {}),
    offen: e.form === "demokratie" || e.form === "hybrid",
  };
}

/** Das letzte Wahlergebnis (Meldung), falls es eines gab. */
export function letzteWahl(w: World, id: string): { datum: string; titel: string; fakt: string } | undefined {
  const n = [...weltModell(w).nachrichten].reverse().find((x) => x.id === id && (x.art === "wahl" || x.art === "machtwechsel"));
  return n ? { datum: n.datum, titel: n.titel, fakt: n.fakt } : undefined;
}

export { akteurName };
