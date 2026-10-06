// Die Streitkräfte als messbarer Bestand mit Ausbau (Wunsch des Nutzers: „Größe des Militärs, technologische Wappnung messen und upgraden“).
//
// Grundsatz „Realismus verpackt in ein Spiel“: acht Gattungen mit Zahl, Generation und Herkunft, fünf Arten des Ausbaus mit Preis und
// Zeit, ein Kampfkraft-Index (1,0 = Stand 2026). Die Bereitschaftsbalken des Politiknetzes (Ausbildung, Ersatzteile, Moral) bleiben
// eigenständig; der Bestand bestimmt Größe und Technik. Modernisierung und Rüstungsautarkie im Netz folgen dem Bestand (keine Dopplung:
// nur Änderungen des Bestands schieben die Knoten). Alle Zahlen außer den in data/streitkraefte.ts belegten sind Spielparameter.
//
// Schnittstellen zu parallel entstehenden Modulen ohne harte Abhängigkeit: `setzeEtatQuelle` (Verteidigungsetat aus dem Haushalt),
// `setzeInnovationsQuelle` (Innovationsgrenze aus der Wissensbasis), `setzeGueterQuelle` (Engpässe bei Stahl, Chips, Triebwerken).
// Fehlt eine Quelle, gilt ein Rückfall aus vorhandenen Größen.

import { GATTUNGEN, GATTUNG_NACH_ID, START_BESCHAFFUNGEN, type GattungId, type Teilstreitkraft } from "../data/streitkraefte";
import { NET } from "./modell";
import { nationalAverage, startAverage } from "./netz";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { kannZahlen } from "./kapital";
import { verbrauche } from "./aufmerksamkeit";
import { kosten } from "./ereignis-hilfen";
import { haushaltZustand } from "./wirtschaft";
import { RESSORT_NACH_ID } from "../data/haushaltsplan";
import { innovationsGrenze as wissensGrenze, WISSEN } from "./wissensbasis";
import { t } from "../i18n";
import type { World } from "./types";

export type BeschaffungsArt = "kauf" | "produktion" | "entwicklung" | "modernisierung";

export interface GattungStand {
  menge: number;
  generation: number;
  heimisch: number;
  /** Höchste Generation, die die heimische Industrie bauen kann */
  heimGeneration: number;
}

export interface Beschaffung {
  id: string;
  gattung: GattungId;
  art: BeschaffungsArt;
  menge: number;
  generation: number;
  lieferland: string | null;
  /** Tag, an dem geliefert wird (verschiebt sich bei Lieferstopp) */
  fertig: number;
  beginn: number;
  /** Kosten in % des BIP je Monat bis zur Lieferung */
  bipMonat: number;
  name?: string;
  /** Nur Entwicklung: scheitert sie am Ende? (deterministisch beim Beginn bestimmt) */
  scheitert?: boolean;
  gestoppt?: boolean;
}

export interface StreitkraefteZustand {
  v: 1;
  gattungen: Record<GattungId, GattungStand>;
  laufend: Beschaffung[];
  /** Wehrdienst in Monaten (0 = Berufsarmee) */
  wehrdienst: number;
  /** Zuletzt an das Netz gemeldete Werte (nur Änderungen schieben die Knoten) */
  gemeldet: { modern: number; autarkie: number; index: number };
  zaehler: number;
  /** Monate in Folge, in denen der Etat unter der Erhaltungsschwelle lag */
  unterdeckung?: number;
}

export const STREITKRAEFTE = {
  /** Gleichzeitige Beschaffungen bei normalem Etat */
  kapazitaet: 4,
  /** Gefechtstage, die ein laufender Krieg je Monat verbraucht */
  munitionKriegMonat: 6,
  /** Entwicklung: Grundlaufzeit in Monaten und Fehlschlag ohne Wissensbasis */
  entwicklungMonate: 48,
  entwicklungRisiko: 0.4,
  aufmerksamkeit: 4,
  /** Unter diesem Etat-Faktor fehlt Geld für den Erhalt: alle so viele Monate wird ein Los des ältesten Geräts ausgemustert */
  erhaltSchwelle: 0.8,
  erhaltMonate: 6,
} as const;

// ---------------------------------------------------------------------------
// Quellen anderer Module (ohne Importzyklus)

let etatQuelle: ((w: World) => number) | null = null;
let innovationsQuelle: ((w: World) => number) | null = null;
let gueterQuelle: ((w: World, gattung: GattungId) => number) | null = null;

/** Verteidigungsetat als Faktor (1 = normal), etwa aus sim/haushalt.ts `verteidigungsEtat`. */
export const setzeEtatQuelle = (f: ((w: World) => number) | null): void => {
  etatQuelle = f;
};
/** Innovationsgrenze 0 bis 1, etwa aus sim/wissensbasis.ts `innovationsGrenze`. */
export const setzeInnovationsQuelle = (f: ((w: World) => number) | null): void => {
  innovationsQuelle = f;
};
/** Verfügbarkeit nötiger Güter 0 bis 1 (1 = kein Engpass), etwa aus sim/gueter.ts. */
export const setzeGueterQuelle = (f: ((w: World, gattung: GattungId) => number) | null): void => {
  gueterQuelle = f;
};

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const knoten = (w: World, id: string): number => (NET.index.has(id) ? nationalAverage(NET, w.net, id) : 50);
const knotenStart = (w: World, id: string): number => (NET.index.has(id) ? startAverage(NET, w.net, id) : 50);

/** Etat-Faktor (1 = Verteidigungsetat 2026): Quelle von außen, sonst der wirksame Ressortetat „verteidigung“ (sim/wirtschaft.ts). */
export function etatFaktor(w: World): number {
  if (etatQuelle) return clamp(etatQuelle(w), 0.3, 2);
  const r = RESSORT_NACH_ID.verteidigung;
  if (!r || !w.spiel) return 1;
  const z = haushaltZustand(w);
  const stufe = z.wirksam?.verteidigung ?? z.stufen.verteidigung ?? 0;
  return clamp(Math.max(0, r.startBip + stufe * r.schritt) / r.startBip, 0.3, 2);
}

/** Innovation 0 bis 1 (0,5 = Stand 2026): Quelle von außen, sonst die Innovationsgrenze der Wissensbasis (sim/wissensbasis.ts). */
export function innovationsGrenze(w: World): number {
  if (innovationsQuelle) return clamp(innovationsQuelle(w), 0, 1);
  if (!w.spiel) return 0.5;
  return clamp((0.5 * wissensGrenze(w)) / WISSEN.grenzeStart, 0, 1);
}

// ---------------------------------------------------------------------------
// Zustand und Migration

export function streitkraefte(w: World): StreitkraefteZustand {
  const sp = w.spiel!;
  if (!sp.streitkraefte) sp.streitkraefte = neuerZustand(w);
  return sp.streitkraefte;
}

/** Neuer Bestand. Bei älteren Spielständen passt er zu ihren Balken: Bereitschaft über oder unter dem Start skaliert die Mengen. */
function neuerZustand(w: World): StreitkraefteZustand {
  const skala: Record<Teilstreitkraft, number> = {
    heer: clamp(knoten(w, "bereitschaft_heer") / Math.max(1, knotenStart(w, "bereitschaft_heer")), 0.6, 1.4),
    luft: clamp(knoten(w, "bereitschaft_luft") / Math.max(1, knotenStart(w, "bereitschaft_luft")), 0.6, 1.4),
    see: clamp(knoten(w, "bereitschaft_see") / Math.max(1, knotenStart(w, "bereitschaft_see")), 0.6, 1.4),
  };
  const gattungen = {} as Record<GattungId, GattungStand>;
  for (const g of GATTUNGEN) {
    const menge = g.einheit === "stueck" ? Math.round(g.start * skala[g.teil]) : Math.round(g.start * skala[g.teil] * 10) / 10;
    gattungen[g.id] = { menge, generation: g.generation, heimisch: g.heimisch, heimGeneration: g.heimisch > 0 ? g.generation : 2 };
  }
  const laufend: Beschaffung[] = START_BESCHAFFUNGEN.map((b, i) => ({
    id: `start-${i}`,
    gattung: b.gattung,
    art: b.art,
    menge: b.menge,
    generation: b.generation,
    lieferland: b.lieferland,
    beginn: w.day,
    fertig: w.day + b.monate * 30,
    bipMonat: 0,
    name: b.name,
  }));
  const z: StreitkraefteZustand = { v: 1, gattungen, laufend, wehrdienst: 6, gemeldet: { modern: 0, autarkie: 0, index: 1 }, zaehler: 0 };
  z.gemeldet = { modern: generationMittel(z), autarkie: autarkie(z), index: kampfkraftIndex(w, z) };
  return z;
}

// ---------------------------------------------------------------------------
// Kennzahlen

const genFaktor = (g: number): number => 1 + 0.25 * (g - 3);

/** Kampfkraft je Teilstreitkraft relativ zum Start 2026 (1 = Stand 2026). */
export function teilIndex(z: StreitkraefteZustand, teil: Teilstreitkraft): number {
  let summe = 0;
  let gew = 0;
  for (const g of GATTUNGEN) {
    if (g.teil !== teil) continue;
    const s = z.gattungen[g.id];
    const menge = g.einheit === "tage" ? Math.min(1.2, s.menge / g.start) : s.menge / g.start;
    summe += g.gewicht * menge * (genFaktor(s.generation) / genFaktor(g.generation));
    gew += g.gewicht;
  }
  return gew > 0 ? summe / gew : 1;
}

/** Gesamt-Kampfkraft (Heer 45 %, Luft 35 %, See 20 %); 1,0 = Stand 2026. */
export function kampfkraftIndex(_w: World, z: StreitkraefteZustand): number {
  return 0.45 * teilIndex(z, "heer") + 0.35 * teilIndex(z, "luft") + 0.2 * teilIndex(z, "see");
}

/** Mittlere Generation, nach Gewicht. */
export function generationMittel(z: StreitkraefteZustand): number {
  let s = 0;
  let n = 0;
  for (const g of GATTUNGEN) {
    s += g.gewicht * z.gattungen[g.id].generation;
    n += g.gewicht;
  }
  return s / n;
}

/** Anteil heimischer Fertigung, nach Gewicht (0 bis 1). */
export function autarkie(z: StreitkraefteZustand): number {
  let s = 0;
  let n = 0;
  for (const g of GATTUNGEN) {
    s += g.gewicht * z.gattungen[g.id].heimisch;
    n += g.gewicht;
  }
  return s / n;
}

/** Faktor auf die eigene Kriegsstärke aus dem Bestand (1 = Stand 2026). */
export function bestandsFaktor(w: World): number {
  if (!w.spiel) return 1;
  return clamp(0.55 + 0.45 * kampfkraftIndex(w, streitkraefte(w)), 0.5, 1.6);
}

/**
 * Kampfkraft der Gattungen, die eine Einsatzart trägt (1 = Stand 2026), nach Gewicht: Menge relativ zum Start mal Generation.
 * Munition zählt als Vorrat mit höchstens 1,2; leere Lager drücken stark (der Krieg verbraucht sie, sim/kriegsschauplatz.ts).
 */
export function einsatzIndex(w: World, traeger: Partial<Record<GattungId, number>>): number {
  if (!w.spiel) return 1;
  const z = streitkraefte(w);
  let summe = 0;
  let gew = 0;
  for (const [id, g] of Object.entries(traeger) as [GattungId, number][]) {
    const def = GATTUNG_NACH_ID[id];
    const s = z.gattungen[id];
    const menge = def.einheit === "tage" ? Math.min(1.2, s.menge / def.start) : s.menge / def.start;
    summe += g * menge * (genFaktor(s.generation) / genFaktor(def.generation));
    gew += g;
  }
  return gew > 0 ? summe / gew : 1;
}

/** Mittlere Generation der Gattungen einer Einsatzart. */
export function einsatzGeneration(w: World, traeger: Partial<Record<GattungId, number>>): number {
  if (!w.spiel) return 3;
  const z = streitkraefte(w);
  let s = 0;
  let n = 0;
  for (const [id, g] of Object.entries(traeger) as [GattungId, number][]) {
    if (id === "munition" || id === "personal") continue;
    s += g * z.gattungen[id].generation;
    n += g;
  }
  return n > 0 ? s / n : 3;
}

/**
 * Kriegsverluste: Die am stärksten tragende Gattung verliert den Anteil `anteil` (0 bis 1) ihres Bestands, die übrigen nach ihrem Gewicht
 * weniger; Personal in Stück. Ersatz kommt nur über Beschaffung (Kauf, Fertigung) — mit Lieferzeit, Einfuhrabhängigkeit und Lizenzsperre.
 */
export function kriegsVerluste(w: World, traeger: Partial<Record<GattungId, number>>, anteil: number): void {
  if (!w.spiel || anteil <= 0) return;
  const z = streitkraefte(w);
  const groesst = Math.max(...Object.values(traeger).map((x) => x ?? 0), 0.01);
  for (const [id, g] of Object.entries(traeger) as [GattungId, number][]) {
    if (id === "munition") continue;
    const s = z.gattungen[id];
    const def = GATTUNG_NACH_ID[id];
    // Personal zählt Köpfe: Gefallene und Verwundete sind ein kleiner Teil dessen, was an Gerät verloren geht (Spielparameter)
    const verlust = s.menge * anteil * (g / groesst) * (id === "personal" ? 0.1 : 1);
    s.menge = def.einheit === "stueck" ? Math.max(0, Math.round(s.menge - verlust)) : Math.max(0, Math.round((s.menge - verlust) * 10) / 10);
  }
}

/** Zusätzlicher Munitionsverbrauch (Gefechtstage), etwa bei hartem Tempo. */
export function verbraucheMunition(w: World, tage: number): void {
  if (!w.spiel || tage <= 0) return;
  const m = streitkraefte(w).gattungen.munition;
  m.menge = Math.max(0, Math.round((m.menge - tage) * 10) / 10);
}

const sanktioniert = (w: World, land: string | null): boolean => {
  if (!land) return false;
  const a = w.spiel?.weltmodell as unknown as { aussen?: { sanktionen?: { von: string }[] } } | undefined;
  return !!a?.aussen?.sanktionen?.some((s) => s.von === land);
};

// ---------------------------------------------------------------------------
// Ausbau

export interface AusbauVorschau {
  ok: boolean;
  grund?: string;
  pk: number;
  bipGesamt: number;
  monate: number;
  generation: number;
  risiko?: number;
  abhaengig: string | null;
}

/** Vorschau einer Beschaffung: Preis, Dauer, Generation, Abhängigkeit; `ok` mit Grund, wenn sie nicht geht. */
export function vorschauAusbau(w: World, gattung: GattungId, art: BeschaffungsArt): AusbauVorschau {
  const z = streitkraefte(w);
  const def = GATTUNG_NACH_ID[gattung];
  const s = z.gattungen[gattung];
  const etat = etatFaktor(w);
  const gueter = gueterQuelle ? clamp(gueterQuelle(w, gattung), 0.2, 1.3) : 1;
  const innov = innovationsGrenze(w);
  const belegt = z.laufend.filter((b) => !b.name).length;
  const kap = Math.max(1, Math.round(STREITKRAEFTE.kapazitaet * etat));
  const basis = { pk: def.los.pk, bipGesamt: def.los.bip, abhaengig: null as string | null };
  let monate = def.los.monateKauf;
  let generation = s.generation;
  let risiko: number | undefined;
  if (art === "kauf") {
    generation = Math.min(5, def.generation + 1);
    basis.abhaengig = def.lieferland;
    monate = def.los.monateKauf;
  } else if (art === "produktion") {
    generation = s.heimGeneration;
    monate = Math.round(def.los.monateBau / gueter);
    basis.bipGesamt *= 0.85;
  } else if (art === "entwicklung") {
    generation = Math.min(5, s.heimGeneration + 1);
    monate = Math.round(STREITKRAEFTE.entwicklungMonate * (1.5 - 0.7 * innov));
    basis.pk = def.los.pk + 4;
    basis.bipGesamt = def.los.bip * 1.6;
    risiko = Math.round(STREITKRAEFTE.entwicklungRisiko * (1 - 0.75 * innov) * 100) / 100;
  } else {
    generation = Math.min(5, s.generation + 0.5);
    monate = 18;
    basis.pk = Math.ceil(def.los.pk * 0.6);
    basis.bipGesamt = def.los.bip * 0.5;
  }
  const v: AusbauVorschau = { ok: true, pk: basis.pk, bipGesamt: Math.round(basis.bipGesamt * 100) / 100, monate, generation, abhaengig: basis.abhaengig, ...(risiko !== undefined ? { risiko } : {}) };
  if (belegt >= kap) return { ...v, ok: false, grund: t("militaer.grund.kapazitaet", { n: kap }) };
  if (!kannZahlen(w.spiel!.kapital, v.pk)) return { ...v, ok: false, grund: t("militaer.grund.kapital") };
  if (art === "kauf" && sanktioniert(w, def.lieferland)) return { ...v, ok: false, grund: t("militaer.grund.sanktion") };
  if (art === "kauf" && !def.lieferland) return { ...v, ok: false, grund: t("militaer.grund.kein_import") };
  if (art === "entwicklung" && s.heimGeneration >= 5) return { ...v, ok: false, grund: t("militaer.grund.spitze") };
  if (art === "entwicklung" && z.laufend.some((b) => b.gattung === gattung && b.art === "entwicklung")) return { ...v, ok: false, grund: t("militaer.grund.laeuft") };
  if (art === "modernisierung" && s.generation >= 5) return { ...v, ok: false, grund: t("militaer.grund.spitze") };
  return v;
}

/** Eine Beschaffung beginnen. */
export function beginneAusbau(w: World, gattung: GattungId, art: BeschaffungsArt): { ok: boolean; text: string } {
  const v = vorschauAusbau(w, gattung, art);
  if (!v.ok) return { ok: false, text: v.grund ?? "" };
  const z = streitkraefte(w);
  const def = GATTUNG_NACH_ID[gattung];
  const sp = w.spiel!;
  sp.kapital -= v.pk;
  verbrauche(w, STREITKRAEFTE.aufmerksamkeit, "Beschaffung");
  z.zaehler += 1;
  const scheitert = art === "entwicklung" ? hash01(`${w.seed}-${gattung}-${z.zaehler}`) < (v.risiko ?? 0) : undefined;
  z.laufend.push({
    id: `b-${z.zaehler}`,
    gattung,
    art,
    menge: art === "entwicklung" || art === "modernisierung" ? 0 : def.los.menge,
    generation: v.generation,
    lieferland: art === "kauf" ? def.lieferland : null,
    beginn: w.day,
    fertig: w.day + v.monate * 30,
    bipMonat: v.bipGesamt / Math.max(1, v.monate),
    ...(scheitert !== undefined ? { scheitert } : {}),
  });
  if (art === "produktion") wirke(w, "arbeitsplaetze_industrie", 0.6);
  const text = t(`militaer.beginn.${art}`, { gattung: t(`militaer.gattung.${gattung}`), monate: v.monate });
  addLog(w, "entscheidung", text);
  return { ok: true, text };
}

/** Ausmustern: Bestand sinkt sofort um ein Los, spart künftige Last (kleine Entlastung des Haushalts). */
export function mustereAus(w: World, gattung: GattungId): { ok: boolean; text: string } {
  const z = streitkraefte(w);
  const def = GATTUNG_NACH_ID[gattung];
  const s = z.gattungen[gattung];
  if (s.menge <= def.los.menge) return { ok: false, text: t("militaer.grund.zu_wenig") };
  s.menge = Math.round((s.menge - def.los.menge) * 10) / 10;
  kosten(w, -def.los.bip * 0.2);
  z.unterdeckung = 0;
  const text = t("militaer.ausgemustert", { gattung: t(`militaer.gattung.${gattung}`) });
  addLog(w, "entscheidung", text);
  return { ok: true, text };
}

/** Wehrdienst ändern (0 = Berufsarmee, 6, 12 oder 18 Monate): mehr Reserve, aber Unmut bei den Jungen. */
export function setzeWehrdienst(w: World, monate: 0 | 6 | 12 | 18): { ok: boolean; text: string } {
  const z = streitkraefte(w);
  if (z.wehrdienst === monate) return { ok: false, text: t("militaer.wehrdienst.gleich") };
  const d = monate - z.wehrdienst;
  z.wehrdienst = monate;
  const p = z.gattungen.personal;
  p.menge = Math.max(200_000, Math.round(p.menge * (1 + 0.012 * d)));
  wirke(w, "junge", -0.25 * d);
  wirke(w, "truppenmoral", monate === 0 ? 2 : d > 0 ? -1 : 1);
  const text = t("militaer.wehrdienst.neu", { n: monate });
  addLog(w, "entscheidung", text);
  return { ok: true, text };
}

function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

// ---------------------------------------------------------------------------
// Monat

/** Monatlicher Schritt: Lieferungen, Lieferstopps, Kosten, Munitionsverbrauch im Krieg, Rückmeldung ans Netz. */
export function streitkraefteMonat(w: World, imKrieg: boolean): void {
  if (!w.spiel) return;
  const z = streitkraefte(w);
  // Der Verteidigungsetat trägt die Beschaffungen: was über die Kapazität hinausgeht, verzögert sich um einen Monat
  const kap = Math.max(1, Math.round(STREITKRAEFTE.kapazitaet * etatFaktor(w)));
  const eigene = z.laufend.filter((b) => !b.name).sort((a, b) => a.beginn - b.beginn);
  const verzug = new Set(eigene.slice(kap).map((b) => b.id));
  for (const b of [...z.laufend]) {
    if (verzug.has(b.id)) {
      b.fertig += 30;
      continue;
    }
    // Lieferstopp bei Sanktionen des Lieferlands: die Lieferung verschiebt sich um einen Monat
    if (b.lieferland && sanktioniert(w, b.lieferland)) {
      b.fertig += 30;
      if (!b.gestoppt) {
        b.gestoppt = true;
        w.spiel.hinweise.push({ id: `militaer-lieferstopp-${b.id}`, titel: t("militaer.lieferstopp.titel"), text: [t("militaer.lieferstopp.text", { gattung: t(`militaer.gattung.${b.gattung}`) })], szene: "parlament" });
      }
      continue;
    }
    b.gestoppt = false;
    if (w.day < b.fertig) continue;
    liefere(w, z, b);
    z.laufend = z.laufend.filter((x) => x.id !== b.id);
  }
  erhalte(w, z);
  if (imKrieg) {
    const m = z.gattungen.munition;
    m.menge = Math.max(0, m.menge - STREITKRAEFTE.munitionKriegMonat);
  }
  meldeAnsNetz(w, z);
}

/** Zu wenig Etat für den Erhalt: Nach einigen Monaten wird ein Los des ältesten Geräts ausgemustert. */
function erhalte(w: World, z: StreitkraefteZustand): void {
  if (etatFaktor(w) >= STREITKRAEFTE.erhaltSchwelle) {
    z.unterdeckung = 0;
    return;
  }
  z.unterdeckung = (z.unterdeckung ?? 0) + 1;
  if (z.unterdeckung < STREITKRAEFTE.erhaltMonate) return;
  z.unterdeckung = 0;
  const kandidat = GATTUNGEN.filter((g) => g.einheit !== "tage" && g.id !== "personal" && z.gattungen[g.id].menge > g.los.menge)
    .sort((a, b) => z.gattungen[a.id].generation - z.gattungen[b.id].generation)[0];
  if (!kandidat) return;
  const s = z.gattungen[kandidat.id];
  s.menge = Math.round((s.menge - kandidat.los.menge) * 10) / 10;
  addLog(w, "ereignis", t("militaer.erhalt", { gattung: t(`militaer.gattung.${kandidat.id}`) }));
}

function liefere(w: World, z: StreitkraefteZustand, b: Beschaffung): void {
  const s = z.gattungen[b.gattung];
  const g = t(`militaer.gattung.${b.gattung}`);
  if (b.art === "entwicklung") {
    if (b.scheitert) {
      w.spiel!.hinweise.push({ id: `militaer-entwicklung-gescheitert-${b.id}`, titel: t("militaer.entwicklung.gescheitert_titel"), text: [t("militaer.entwicklung.gescheitert", { gattung: g })], szene: "anatolien" });
      return;
    }
    s.heimGeneration = Math.max(s.heimGeneration, b.generation);
    w.spiel!.hinweise.push({ id: `militaer-entwicklung-${b.id}`, titel: t("militaer.entwicklung.titel"), text: [t("militaer.entwicklung.text", { gattung: g, gen: b.generation })], szene: "anatolien" });
    return;
  }
  if (b.art === "modernisierung") {
    s.generation = Math.min(5, Math.round((s.generation + 0.5) * 10) / 10);
    return;
  }
  const neu = s.menge + b.menge;
  s.generation = Math.round(((s.generation * s.menge + b.generation * b.menge) / neu) * 10) / 10;
  const heimNeu = b.art === "produktion" ? 1 : 0;
  s.heimisch = Math.round(((s.heimisch * s.menge + heimNeu * b.menge) / neu) * 100) / 100;
  s.menge = Math.round(neu * 10) / 10;
  addLog(w, "ereignis", t("militaer.geliefert", { gattung: g, name: b.name ?? g }));
}

/** Nur Änderungen des Bestands schieben Modernisierung, Rüstungsautarkie und Abschreckung im Netz. */
function meldeAnsNetz(w: World, z: StreitkraefteZustand): void {
  const modern = generationMittel(z);
  const aut = autarkie(z);
  const idx = kampfkraftIndex(w, z);
  const dm = modern - z.gemeldet.modern;
  const da = aut - z.gemeldet.autarkie;
  const di = idx - z.gemeldet.index;
  if (Math.abs(dm) > 0.01) wirke(w, "modernisierung", 20 * dm);
  if (Math.abs(da) > 0.005) wirke(w, "ruestungsautarkie", 60 * da);
  if (Math.abs(di) > 0.005) wirke(w, "abschreckung", 25 * di);
  z.gemeldet = { modern, autarkie: aut, index: idx };
}

// ---------------------------------------------------------------------------
// Sicht für die Oberfläche

export interface GattungSicht {
  id: GattungId;
  teil: Teilstreitkraft;
  einheit: "stueck" | "index" | "tage";
  menge: number;
  start: number;
  generation: number;
  heimGeneration: number;
  heimisch: number;
  lieferland: string | null;
  quelle: string;
}

export function streitkraefteSicht(w: World): { gattungen: GattungSicht[]; index: number; teile: Record<Teilstreitkraft, number>; laufend: Beschaffung[]; etat: number; innovation: number; wehrdienst: number; kapazitaet: number } {
  const z = streitkraefte(w);
  return {
    gattungen: GATTUNGEN.map((g) => ({ id: g.id, teil: g.teil, einheit: g.einheit, start: g.start, quelle: g.quelle, lieferland: g.lieferland, ...z.gattungen[g.id] })),
    index: kampfkraftIndex(w, z),
    teile: { heer: teilIndex(z, "heer"), luft: teilIndex(z, "luft"), see: teilIndex(z, "see") },
    laufend: [...z.laufend].sort((a, b) => a.fertig - b.fertig),
    etat: etatFaktor(w),
    innovation: innovationsGrenze(w),
    wehrdienst: z.wehrdienst,
    kapazitaet: Math.max(1, Math.round(STREITKRAEFTE.kapazitaet * etatFaktor(w))),
  };
}
