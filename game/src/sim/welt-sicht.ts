// Lesefunktionen für die Länderansicht: Anzeigegruppen, Haltung zur Türkei für jeden Akteur, Suche und die Wahlansicht.
// Nichts davon verändert den Zustand (außer dem Anlegen des Weltmodells beim ersten Zugriff älterer Spielstände).

import { GRUPPEN_FILTER } from "../data/welt-institutionen";
import { WEITERE } from "../data/welt-weitere";
import { formatDateDe } from "./dates";
import { haltungStufe, haltungWort, LAENDER } from "./laender";
import { AKTEUR_IDS, akteurName, beziehungZurTuerkei, eigenVon, haltungFuehrung, haltungWortVon, istHauptakteur, weltModell } from "./welt-modell";
import { lagebildZu } from "./welt-dienst";
import type { World } from "./types";
import { t as tx } from "../i18n";

export interface AkteurKurz {
  id: string;
  name: string;
  kurz: string;
  haupt: boolean;
  gruppe: AnzeigeGruppe;
}

// Gruppen als feste Kennungen; der Name entsteht erst bei der Anzeige (vorher beim Laden des Moduls fest deutsch, Befund G-7)
export const ANZEIGE_GRUPPEN = ["gross", "nachbarn", "eu", "golf", "turk", "sueden"] as const;
export type AnzeigeGruppe = (typeof ANZEIGE_GRUPPEN)[number];
const GRUPPEN_SCHLUESSEL: Record<AnzeigeGruppe, string> = {
  gross: "sim2.sim.welt-sicht.36d8358", nachbarn: "nacht_n7.gruppe.nachbarn", eu: "nacht_n7.gruppe.eu", golf: "sim2.sim.welt-sicht.b34f67d", turk: "sim2.sim.welt-sicht.64ed00f", sueden: "sim2.sim.welt-sicht.2b8b714",
};
export const gruppenName = (g: AnzeigeGruppe): string => tx(GRUPPEN_SCHLUESSEL[g]);

const GRUPPE_VON: Record<string, AnzeigeGruppe> = {
  USA: "gross", EU: "gross", RUS: "gross", CHN: "gross", IND: "gross", BRA: "gross", GBR: "gross",
  GRC: "nachbarn", IRN: "nachbarn", SYR: "nachbarn", IRQ: "nachbarn", ARM: "nachbarn", ISR: "nachbarn", UKR: "nachbarn", GEO: "nachbarn", CYP: "nachbarn", BGR: "nachbarn", AZE: "nachbarn",
  DEU: "eu", FRA: "eu", ITA: "eu", ESP: "eu", POL: "eu", NLD: "eu", ROU: "eu", HUN: "eu", AUT: "eu", SWE: "eu",
  SAU: "golf", ARE: "golf", QAT: "golf", EGY: "golf", PAK: "golf", LBY: "golf",
  KAZ: "turk", UZB: "turk", KGZ: "turk", TKM: "turk",
  ZAF: "sueden", ETH: "sueden", IDN: "sueden",
};

/** Alle Akteure in der Reihenfolge der Anzeigegruppen. */
export function akteurListe(): AkteurKurz[] {
  const haupt = new Map(LAENDER.map((l) => [l.id, l]));
  const weitere = new Map(WEITERE.map((x) => [x.id, x]));
  const alle: AkteurKurz[] = AKTEUR_IDS.map((id) => {
    const h = haupt.get(id);
    const w = weitere.get(id);
    return { id, name: h ? h.name : akteurName(id), kurz: h?.kurz ?? w?.kurz ?? id, haupt: !!h, gruppe: GRUPPE_VON[id] ?? "sueden" };
  });
  const rang = (g: AnzeigeGruppe) => ANZEIGE_GRUPPEN.indexOf(g);
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
  return tx(`nacht_n7.haltung.${haltungStufe(b.vertrauen, b.konflikt)}`);
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
