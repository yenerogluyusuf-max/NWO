// Neue Provinzen aus annektierten Regionen (Welle 3, K5; ENTSCHEIDUNGEN AA 1): eine eigene Provinz je annektierter Region mit der nächsten
// freien Kfz-Kennziffer ab 82, Einwohnern (Daten K2), Steuern, Wahlberechtigten; Sitze in der TBMM erst nach der nächsten Parlamentswahl,
// verteilt nach Art. 4 des Gesetzes Nr. 2839 (data/annexion.ts). Eingliederungszeit in Jahren nach der Haltung der Bevölkerung.
//
// Bewusst ein eigenes, schlankes Modul ohne Kriegs- und Außenimporte: Das Weltmodell, die Wahl und der Haushalt lesen es, ohne den
// Krieg in ihre Ladereihenfolge zu ziehen. Die 81 Provinzen des Politiknetzes bleiben unverändert (feste Indizes, Spielparameter): Die
// neue Provinz zählt in Einwohnern, Haushalt, Wahl und Karte, aber nicht als 82. Spalte des Netzes.

import { BIP_PRO_KOPF_USD, TR_BIP_PRO_KOPF_USD, WAEHLER_JE_EINWOHNER } from "../data/besatzung";
import { EINGLIEDERUNG, GANZER_STAAT, SITZE_GESAMT, VERWALTENDE_PROVINZ } from "../data/annexion";
import { REGIONEN, REGION_NACH_ID, SCHAUPLATZ_NACH_LAND } from "../data/schauplaetze";
import { PROVINZEN } from "./regional";
import { START_EINNAHMEN_BIP } from "./staatsgeld";
import type { NeueProvinz } from "./krieg-typen";
import type { World } from "./types";

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

/** Einwohner der 81 Provinzen (data/provinzdaten.json, belegt). */
export const TR_EINWOHNER = PROVINZEN.reduce((s, p) => s + p.bevoelkerung, 0);

export const neueProvinzen = (w: World): NeueProvinz[] => w.spiel?.provinzenNeu ?? [];
export const aktiveProvinzen = (w: World): NeueProvinz[] => neueProvinzen(w).filter((p) => p.verloren === undefined);
export const neueProvinzVon = (w: World, region: string): NeueProvinz | undefined => aktiveProvinzen(w).find((p) => p.region === region);

/** Nächste freie Kennziffer: 82 oder eins über der höchsten je vergebenen (verlorene Provinzen behalten ihre). */
export function naechstePlaka(w: World): number {
  return Math.max(81, ...neueProvinzen(w).map((p) => p.plaka)) + 1;
}

export const einwohnerAnteil = (einwohner: number): number => einwohner / TR_EINWOHNER;

/** Anteil der Region am türkischen BIP (Einwohner mal BIP je Kopf des früheren Landes, data/besatzung.ts). */
export function bipAnteil(landId: string, einwohner: number): number {
  return (einwohner * (BIP_PRO_KOPF_USD[landId] ?? 0)) / (TR_EINWOHNER * TR_BIP_PRO_KOPF_USD);
}

/** Steuern einer annektierten Region je Monat in % des BIP: Einnahmenquote des Staates (Plan 2026) mal Wirtschaftskraft mal Eingliederung. */
export function einnahmenMonat(landId: string, einwohner: number, grad: number): number {
  return (START_EINNAHMEN_BIP * bipAnteil(landId, einwohner) * clamp(grad, 0, 1)) / 12;
}

/** Eingliederungszeit in Tagen nach dem Widerstand beim Beschluss (data/annexion.ts, EINGLIEDERUNG). */
export function eingliederungTage(widerstand: number): number {
  const jahre = EINGLIEDERUNG.jahreMin + ((EINGLIEDERUNG.jahreMax - EINGLIEDERUNG.jahreMin) * clamp(widerstand, 0, 100)) / 100;
  return Math.round(jahre * 365);
}

export function eingliederungsGrad(_w: World, p: NeueProvinz, tag: number): number {
  return clamp((tag - p.seit) / Math.max(1, p.eingliederungBis - p.seit), 0, 1);
}

/** Anteil, der die Staatsangehörigkeit ablehnt (Spielparameter aus dem Widerstand; Vorbild Krim 2014, Frist von einem Monat bis 18.04.2014). */
export const ablehnungAus = (widerstand: number): number => Math.round(clamp(widerstand * EINGLIEDERUNG.ablehnungJeWiderstand, 0, 0.5) * 1000) / 1000;

/** Wahlberechtigte: Einwohner mal Anteil wie in der Türkei, ohne die, die die Staatsangehörigkeit ablehnen. */
export const wahlberechtigte = (p: Pick<NeueProvinz, "einwohner" | "ablehnung">): number => Math.round(p.einwohner * WAEHLER_JE_EINWOHNER * (1 - p.ablehnung));

/** Die Provinz anlegen (aus sim/annexion.ts). */
export function provinzAnlegen(w: World, x: { region: string; land: string; widerstand: number; vertrag?: boolean }): NeueProvinz {
  const sp = w.spiel!;
  const da = neueProvinzVon(w, x.region);
  if (da) return da;
  const r = REGION_NACH_ID[x.region];
  const p: NeueProvinz = {
    plaka: naechstePlaka(w),
    region: x.region,
    land: x.land,
    seit: w.day,
    einwohner: r?.einwohner?.zahl ?? 0,
    ablehnung: ablehnungAus(x.widerstand),
    eingliederungBis: w.day + eingliederungTage(x.widerstand),
    ...(x.vertrag ? { vertrag: true as const } : {}),
  };
  (sp.provinzenNeu ??= []).push(p);
  return p;
}

export function provinzAufloesen(w: World, region: string): NeueProvinz | undefined {
  const p = neueProvinzVon(w, region);
  if (p) {
    p.verloren = w.day;
    delete p.sitze;
  }
  return p;
}

/** Einwohner der Türkei mit den neuen Provinzen. */
export const einwohnerTuerkei = (w: World): number => TR_EINWOHNER + aktiveProvinzen(w).reduce((s, p) => s + p.einwohner, 0);

/** Die türkische Provinz, die die Region verwaltet (Stimmenmuster der ersten Wahl). */
export function verwaltendeProvinz(region: string): number {
  const fest = VERWALTENDE_PROVINZ[region];
  if (fest) return fest;
  const r = REGION_NACH_ID[region];
  const s = r ? Object.values(SCHAUPLATZ_NACH_LAND).find((x) => x.id === r.schauplatz) : undefined;
  return s?.grenzprovinzen[0] ?? 79;
}

// ---------------------------------------------------------------------------
// Sitze nach Art. 4 des Gesetzes Nr. 2839

/** Verteilung nach dem Gesetz: zuerst je Provinz ein Sitz, dann nach Bevölkerung mit Quote, Reste nach der Größe der Restbevölkerung. */
export function sitzeNachGesetz(bev: Map<number, number>, gesamt = SITZE_GESAMT): Map<number, number> {
  const n = bev.size;
  const rest = gesamt - n;
  const summe = [...bev.values()].reduce((s, x) => s + x, 0);
  const quote = summe / rest;
  const out = new Map<number, number>();
  const reste: [number, number][] = [];
  for (const [plaka, b] of bev) {
    out.set(plaka, 1 + Math.floor(b / quote));
    reste.push([plaka, b / quote - Math.floor(b / quote)]);
  }
  let frei = gesamt - [...out.values()].reduce((s, x) => s + x, 0);
  // Gleichstand entscheidet im Gesetz das Los; hier die kleinere Kennziffer (deterministisch)
  reste.sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  for (const [plaka] of reste) {
    if (frei <= 0) break;
    out.set(plaka, out.get(plaka)! + 1);
    frei -= 1;
  }
  return out;
}

/**
 * Die Sitze, wenn die neuen Provinzen mitwählen: Die 81 Provinzen behalten ihre amtliche Verteilung (YSK, data/provinzdaten.json); nur die
 * Sitze, die das Gesetz durch die neue Provinz verschiebt, wandern. Dafür wird das Gesetz zweimal auf dieselben Bevölkerungszahlen angewendet,
 * ohne und mit den neuen Provinzen, und der Unterschied auf die amtliche Verteilung übertragen. So ordnet eine kleine neue Provinz nicht die
 * 81 alten neu, nur weil die Bevölkerungsdaten nicht genau die der YSK sind.
 */
export function sitzPlan(provinzen: Pick<NeueProvinz, "plaka" | "einwohner" | "ablehnung">[]): Map<number, number> {
  const amtlich = new Map(PROVINZEN.map((p) => [p.plaka, p.sitze] as const));
  if (!provinzen.length) return amtlich;
  const alt = new Map(PROVINZEN.map((p) => [p.plaka, p.bevoelkerung] as const));
  const neu = new Map(alt);
  for (const p of provinzen) neu.set(p.plaka, Math.round(p.einwohner * (1 - p.ablehnung)));
  const ohne = sitzeNachGesetz(alt);
  const mit = sitzeNachGesetz(neu);
  const out = new Map(amtlich);
  for (const [plaka, s] of mit) out.set(plaka, (amtlich.get(plaka) ?? 0) + s - (ohne.get(plaka) ?? 0));
  // Gegen Rundung: Die Summe bleibt 600, eine Provinz behält mindestens einen Sitz
  for (const [plaka, s] of out) if (s < 1) out.set(plaka, 1);
  return out;
}

/** Die Sitze der Provinzen, die bei einer Wahl am Tag `tag` mitwählen (ab einem Monat nach dem Beschluss, Spielparameter). */
export function waehlendeProvinzen(w: World): NeueProvinz[] {
  return aktiveProvinzen(w).filter((p) => w.day - p.seit >= 30);
}

/** Für die Akte: Sitze, die eine Provinz bei der nächsten Wahl bekäme (dieselbe Rechnung wie bei der Wahl). */
export function sitzePrognose(w: World, extra?: Pick<NeueProvinz, "plaka" | "einwohner" | "ablehnung">): number {
  const liste: Pick<NeueProvinz, "plaka" | "einwohner" | "ablehnung">[] = [...aktiveProvinzen(w)];
  if (extra && !liste.some((p) => p.plaka === extra.plaka)) liste.push(extra);
  const plan = sitzPlan(liste);
  return extra ? plan.get(extra.plaka) ?? 0 : 0;
}

/** Nach einer Parlamentswahl: die Sitze der neuen Provinzen festschreiben (sim/wahl.ts). */
export function sitzeFestschreiben(w: World, plan: Map<number, number>): void {
  for (const p of aktiveProvinzen(w)) {
    const s = plan.get(p.plaka);
    if (s !== undefined) p.sitze = s;
  }
}

// ---------------------------------------------------------------------------
// Ein ganzer Staat annektiert (Befund A6): Exilregierung, Nichtanerkennung; keine Machtwechsel und keine Angriffe mehr

export function staatAnnektiert(w: World, landId: string): boolean {
  if (!GANZER_STAAT.has(landId)) return false;
  const s = SCHAUPLATZ_NACH_LAND[landId];
  if (!s) return false;
  const regionen = REGIONEN.filter((r) => r.schauplatz === s.id);
  const besetzt = w.spiel?.besatzung ?? [];
  return regionen.length > 0 && regionen.every((r) => besetzt.some((b) => b.region === r.id && b.form === "annexion"));
}
