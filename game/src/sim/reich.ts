// Das Reich: Vorhaben beginnen, bauen, im Bestand halten; Vorteile freischalten. Kern der Fachbereiche (FACHBEREICHE.md).
// Der Kern ist die einzige Wahrheitsquelle: Oberfläche und Sprachmodell lesen `vorhabenSicht` und rufen `beginne` auf.

import { NET } from "./modell";
import { nationalAverage, PROVINCES, decayVon } from "./netz";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { dimensionZu, landAendern } from "./laender";
import { ERBE, ERBE_NACH_ID } from "../data/erbe";
import { VORHABEN, VORTEILE, STAETTEN_START } from "../data/reich";
import type { Rng } from "./rng";
import type { World } from "./types";
import type { Effekt, LaufEintrag, ReichMeldung, ReichZustand, Voraussetzung, Vergabe, Vorhaben } from "./reich-typen";
import { VERGABE_NAMEN } from "./reich-typen";
import type { VorteilDef } from "../data/reich/typen";
import { kannZahlen } from "./kapital";
import { zeitungEreignis } from "./zeitung";
import { AUFMERKSAMKEIT_KOSTEN, VERFASSUNG, belastungSinken, neuanfangGrund, verbrauche } from "./aufmerksamkeit";

const VORHABEN_NACH_ID = new Map(VORHABEN.map((v) => [v.id, v]));
const VORTEIL_NACH_ID = new Map(VORTEILE.map((v) => [v.id, v]));

export const vorhabenDef = (id: string): Vorhaben | undefined => VORHABEN_NACH_ID.get(id);
export const vorteilDef = (id: string): VorteilDef | undefined => VORTEIL_NACH_ID.get(id);

const VERWALTUNG_START = 60;
/** Anteil unabhängiger und reformorientierter Mitglieder am Spielbeginn */
const SITZE_START: Record<string, number> = { aym: 6 / 15, hsk: 6 / 13 };
const MELDUNGEN_MAX = 40;

// ---------------------------------------------------------------------------
// Zustand

/** Der Zustand des Reiches; wird beim ersten Zugriff angelegt (ältere Spielstände haben ihn nicht). */
export function reichZustand(w: World): ReichZustand {
  const spiel = w.spiel;
  if (!spiel) throw new Error("Ohne Spielschleife gibt es kein Reich.");
  if (spiel.reich) return spiel.reich;
  const z: ReichZustand = {
    verwaltung: VERWALTUNG_START,
    bestand: {},
    laufend: [],
    staetten: {},
    vorteile: [],
    gewaehlt: {},
    meldungen: [],
    feier: [],
    bauGenutzt: 0,
    sitze: { aym: { loyal: 9, unabhaengig: 3, reform: 3 }, hsk: { loyal: 7, unabhaengig: 3, reform: 3 } },
  };
  for (const e of ERBE) z.staetten[e.id] = { zustand: STAETTEN_START[e.id] ?? (e.unesco.status === "welterbe" ? 66 : e.unesco.status === "tentativ" ? 52 : 46) };
  for (const v of VORHABEN) {
    if (v.start?.status === "fertig") {
      z.bestand[v.id] = { seit: "Spielbeginn", zustand: v.start.zustand ?? 78 };
      if (v.ast) z.gewaehlt[v.ast] = v.id;
    } else if (v.start?.status === "im_bau") {
      z.laufend.push({ id: v.id, fortschritt: Math.round(v.kosten.bau * (v.start.fortschritt ?? 0.3)), start: "Spielbeginn" });
      if (v.ast) z.gewaehlt[v.ast] = v.id;
    }
  }
  spiel.reich = z;
  return z;
}

// ---------------------------------------------------------------------------
// Bauvergabe (INF-1, Suzerain-Vorbild)
// Alle Faktoren und Schwellen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

export interface VergabeRegeln {
  /** Faktor auf Baupunkte und Mindestbauzeit */
  zeit: number;
  /** Faktor auf Kapital- und Schuldenkosten */
  kosten: number;
  /** Monate Vergabephase vor dem Baubeginn */
  vorlauf: number;
  /** Zustand, mit dem das Bauwerk in den Bestand geht (ohne Angabe: 90) */
  zustandFertig?: number;
}

export const VERGABE_REGELN: Record<Vergabe, VergabeRegeln> = {
  // Schnell und loyal: kürzere Bauzeit, höhere Kosten, Nähe ohne Wettbewerb — das Korruptionsrisiko wächst, die Unternehmer danken es
  stammfirma: { zeit: 0.8, kosten: 1.15, vorlauf: 0 },
  // Günstig und langsam: weniger Kosten, längere Bauzeit, und das Ergebnis beginnt in schlechterem Zustand
  sparvergabe: { zeit: 1.25, kosten: 0.9, vorlauf: 0, zustandFertig: 70 },
  // Transparente Ausschreibung: der Baubeginn verzögert sich um die Vergabephase; dafür kein Korruptionsrisiko, Märkte und EU sehen es gern
  ausschreibung: { zeit: 1, kosten: 1, vorlauf: 2 },
};

/** Was eine Vergabe aus den Katalogwerten eines Vorhabens macht; die einzige Stelle, an der die Faktoren angewandt werden. */
export function vergabeAngebot(v: Vorhaben, vergabe: Vergabe): { pk: number; bau: number; monate: number; vorlauf: number; zustandFertig?: number } {
  const r = VERGABE_REGELN[vergabe];
  return {
    pk: Math.round(v.kosten.pk * r.kosten * 10) / 10,
    bau: Math.round(v.kosten.bau * r.zeit),
    monate: Math.max(1, Math.round(v.kosten.monate * r.zeit)),
    vorlauf: r.vorlauf,
    ...(r.zustandFertig !== undefined ? { zustandFertig: r.zustandFertig } : {}),
  };
}

/** Die Vergabe eines laufenden Vorhabens; ältere Spielstände ohne Angabe gelten als transparente Ausschreibung. */
export const laufVergabe = (l: LaufEintrag): Vergabe => l.vergabe ?? "ausschreibung";

/** Wirksame Baupunkte und Mindestbauzeit eines laufenden Vorhabens (die Vergabe hat sie beim Beginn festgelegt). */
export const laufBau = (l: LaufEintrag, v: Vorhaben): number => l.bau ?? v.kosten.bau;
export const laufMonate = (l: LaufEintrag, v: Vorhaben): number => l.monate ?? v.kosten.monate;

/** Läuft noch die Vergabephase? Dann ruht der Bau, ohne zu pausieren. */
export const inVergabePhase = (w: World, l: LaufEintrag): boolean => l.vergabeBis !== undefined && w.day < l.vergabeBis;

/** Skandalnähe der Stammfirma: je Monat Bauzeit wächst die Korruption im Land ein wenig (nährt die Affären-Ereignisse). */
const STAMMFIRMA_KORRUPTION_MONAT = 0.2;

// ---------------------------------------------------------------------------
// Größen

const level = (w: World, id: string): number => nationalAverage(NET, w.net, id);

/** Baupunkte je Monat, die das Land insgesamt aufbringt. */
export function bauKapazitaet(w: World): number {
  const z = reichZustand(w);
  let cap = 110 + 0.35 * level(w, "m_bauindustrie") + 0.25 * level(w, "m_industrie_modernisierung") + 0.15 * level(w, "m_fachkraefteprogramm");
  for (const id of Object.keys(z.bestand)) cap += vorhabenDef(id)?.kapazitaet?.bau ?? 0;
  return Math.round(cap * 10) / 10;
}

export interface VerwaltungBilanz {
  vorrat: number;
  einkommen: number;
  bau: number;
  unterhalt: number;
  netto: number;
}

/** Verwaltungskraft: Vorrat und monatliche Bilanz. */
export function verwaltungBilanz(w: World): VerwaltungBilanz {
  const z = reichZustand(w);
  let einkommen = 18 + 0.05 * level(w, "m_verwaltungsdigital");
  for (const id of Object.keys(z.bestand)) einkommen += vorhabenDef(id)?.kapazitaet?.verwaltung ?? 0;
  let bau = 0;
  for (const l of z.laufend) if (!l.pausiert) bau += vorhabenDef(l.id)?.kosten.verwaltung ?? 0;
  let unterhalt = 0;
  for (const id of Object.keys(z.bestand)) unterhalt += vorhabenDef(id)?.unterhalt ?? 0;
  return { vorrat: z.verwaltung, einkommen, bau, unterhalt, netto: einkommen - bau - unterhalt };
}

/** Mittlerer Erhaltungszustand aller Stätten, Welterbe doppelt gewichtet. */
export function erhaltung(w: World): number {
  const z = reichZustand(w);
  let s = 0;
  let g = 0;
  for (const e of ERBE) {
    const gew = e.unesco.status === "welterbe" ? 2 : 1;
    s += (z.staetten[e.id]?.zustand ?? 50) * gew;
    g += gew;
  }
  return g ? s / g : 50;
}

// ---------------------------------------------------------------------------
// Voraussetzungen

export interface VorausStand {
  voraus: Voraussetzung;
  erfuellt: boolean;
  fortschritt: number;
  text: string;
}

const nodeName = (id: string): string => NET.nodes[NET.index.get(id) ?? -1]?.name ?? id;

export function pruefeVoraus(w: World, v: Voraussetzung): VorausStand {
  const z = reichZustand(w);
  const ok = (erfuellt: boolean, fortschritt: number, text: string): VorausStand => ({ voraus: v, erfuellt, fortschritt: erfuellt ? 1 : clamp(fortschritt, 0, 0.99), text });
  switch (v.art) {
    case "bestand": {
      const d = vorhabenDef(v.id);
      const da = !!z.bestand[v.id];
      const im = z.laufend.find((l) => l.id === v.id);
      return ok(da, im && d ? im.fortschritt / laufBau(im, d) : 0, `„${d?.name ?? v.id}“ ist fertig`);
    }
    case "nicht-bestand":
      return ok(!z.bestand[v.id], 0, v.text);
    case "staette-max": {
      const st = z.staetten[v.id]?.zustand ?? 0;
      return ok(st <= v.max, 1 - (st - v.max) / 100, `${v.text} (jetzt ${Math.round(st)})`);
    }
    case "staetten": {
      const zustaende = v.ids.map((id) => ({ id, z: z.staetten[id]?.zustand ?? 0 }));
      const schwach = zustaende.reduce((a, b) => (b.z < a.z ? b : a));
      const erfuellt = zustaende.every((s) => s.z >= v.min);
      const f = zustaende.reduce((s, x) => s + Math.min(1, x.z / v.min), 0) / zustaende.length;
      return ok(erfuellt, f, `${v.text} (schwächste: ${ERBE_NACH_ID[schwach.id]?.name ?? schwach.id}, Zustand ${Math.round(schwach.z)})`);
    }
    case "knoten": {
      const jetzt = level(w, v.id);
      const gut = (v.min === undefined || jetzt >= v.min) && (v.max === undefined || jetzt <= v.max);
      const ziel = v.min ?? v.max!;
      return ok(gut, 1 - Math.abs(ziel - jetzt) / 50, `${nodeName(v.id)} ${v.min !== undefined ? `mindestens ${v.min}` : `höchstens ${v.max}`} (jetzt ${Math.round(jetzt)})`);
    }
    case "massnahme": {
      const jetzt = level(w, v.id);
      const gut = (v.min === undefined || jetzt >= v.min - 0.5) && (v.max === undefined || jetzt <= v.max + 0.5);
      const ziel = v.min ?? v.max!;
      return ok(gut, 1 - Math.abs(ziel - jetzt) / 50, `${nodeName(v.id)} ${v.min !== undefined ? `mindestens auf Stufe ${v.min}` : `höchstens auf Stufe ${v.max}`} (jetzt ${Math.round(jetzt)})`);
    }
    case "land": {
      const jetzt = dimensionZu(w, v.land, v.dim);
      const gut = (v.min === undefined || jetzt >= v.min) && (v.max === undefined || jetzt <= v.max);
      const namen = { handel: "Handel", sicherheit: "Sicherheit", vertrauen: "Vertrauen", konflikt: "Konflikt" } as const;
      const ziel = v.min ?? v.max!;
      return ok(gut, 1 - Math.abs(ziel - jetzt) / 50, `${namen[v.dim]} zu ${v.land} ${v.min !== undefined ? `mindestens ${v.min}` : `höchstens ${v.max}`} (jetzt ${Math.round(jetzt)})`);
    }
    case "vorteil": {
      const d = vorteilDef(v.id);
      return ok(aktiveVorteile(w).includes(v.id), 0, `Vorteil „${d?.name ?? v.id}“ ist aktiv`);
    }
    case "jahr": {
      const j = Number(w.date.slice(0, 4));
      return ok(j >= v.min, 0, `Frühestens ab ${v.min}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Sicht auf ein Vorhaben

export type VorhabenStatus = "fertig" | "im_bau" | "pausiert" | "verfuegbar" | "gesperrt" | "ausgeschlossen";

export interface VorhabenSicht {
  v: Vorhaben;
  status: VorhabenStatus;
  voraus: VorausStand[];
  /** Warum es nicht geht (gesperrt oder ausgeschlossen), sonst leer */
  grund?: string;
  /** 0 bis 1 */
  fortschritt: number;
  restMonate?: number;
  /** Baupunkte je Monat, die das Vorhaben bei der jetzigen Reihenfolge bekommt (0 = wartet oder ruht) */
  rate?: number;
  bezahlbar: boolean;
  /** Reicht die Verwaltungskraft für den Beginn? */
  verwaltungOk: boolean;
  zustand?: number;
  /** Ob alle Voraussetzungen erfüllt sind */
  bereit: boolean;
  /** Gewählte Vergabe eines laufenden Vorhabens (ältere Spielstände: „ausschreibung“) */
  vergabe?: Vergabe;
  /** Läuft noch die Vergabephase vor dem Baubeginn? */
  vergabePhase?: boolean;
  /** Verbleibende Monate der Vergabephase */
  vergabeMonate?: number;
}

export function vorhabenSicht(w: World, id: string): VorhabenSicht | null {
  const v = vorhabenDef(id);
  const spiel = w.spiel;
  if (!v || !spiel) return null;
  const z = reichZustand(w);
  const voraus = v.voraus.map((x) => pruefeVoraus(w, x));
  const bereit = voraus.every((x) => x.erfuellt);
  const bezahlbar = kannZahlen(spiel.kapital, v.kosten.pk);
  const verwaltungOk = z.verwaltung >= (v.kosten.verwaltung ?? 0) * 3;
  const bestand = z.bestand[id];
  const lauf = z.laufend.find((l) => l.id === id);
  const basis = { v, voraus, bezahlbar, verwaltungOk, bereit };
  if (bestand) return { ...basis, status: "fertig", fortschritt: 1, zustand: bestand.zustand };
  if (lauf) {
    const bau = laufBau(lauf, v);
    const f = bau > 0 ? lauf.fortschritt / bau : 1;
    const rate = bauplan(w)[id] ?? 0;
    const cap = Math.max(1, rate > 0 ? rate : Math.min(bau / Math.max(1, laufMonate(lauf, v)), bauKapazitaet(w)));
    const phase = inVergabePhase(w, lauf);
    const vorlauf = phase ? Math.ceil((lauf.vergabeBis! - w.day) / 30) : 0;
    return {
      ...basis,
      status: lauf.pausiert ? "pausiert" : "im_bau",
      fortschritt: f,
      rate,
      restMonate: vorlauf + Math.ceil((bau - lauf.fortschritt) / cap),
      vergabe: laufVergabe(lauf),
      vergabePhase: phase,
      vergabeMonate: vorlauf,
    };
  }
  if (v.sperre) {
    const s = pruefeVoraus(w, v.sperre.solange);
    if (s.erfuellt) return { ...basis, status: "gesperrt", grund: v.sperre.text, fortschritt: 0 };
  }
  if (v.ast) {
    const anderes = z.gewaehlt[v.ast];
    if (anderes && anderes !== id) return { ...basis, status: "ausgeschlossen", grund: `Schließt sich mit „${vorhabenDef(anderes)?.name ?? anderes}“ aus.`, fortschritt: 0 };
  }
  return { ...basis, status: "verfuegbar", fortschritt: 0 };
}

/** Wie viele Baupunkte je Monat jedes laufende Vorhaben bei der jetzigen Reihenfolge und Kapazität bekommt. */
export function bauplan(w: World): Record<string, number> {
  const z = reichZustand(w);
  const verzug = z.verwaltung <= 0 ? 0.5 : 1;
  let cap = bauKapazitaet(w);
  const out: Record<string, number> = {};
  for (const l of z.laufend) {
    const v = vorhabenDef(l.id);
    // Pausierte Vorhaben und solche in der Vergabephase ziehen keine Baukapazität
    if (!v || l.pausiert || inVergabePhase(w, l)) {
      out[l.id] = 0;
      continue;
    }
    const rest = Math.max(0, laufBau(l, v) - l.fortschritt);
    const aufnahme = Math.min(laufBau(l, v) / Math.max(1, laufMonate(l, v)), cap, rest);
    out[l.id] = aufnahme * verzug;
    cap -= aufnahme;
  }
  return out;
}

/** Alle Vorhaben eines Bereichs mit ihrer Sicht. */
export function vorhabenListe(w: World, bereich: string): VorhabenSicht[] {
  return VORHABEN.filter((v) => v.bereich === bereich).map((v) => vorhabenSicht(w, v.id)!);
}

// ---------------------------------------------------------------------------
// Wirkungen

export function wendeEffekt(w: World, e: Effekt, faktor = 1): void {
  const spiel = w.spiel;
  const z = spiel ? reichZustand(w) : null;
  switch (e.t) {
    case "knoten":
      if (NET.index.has(e.id)) wirke(w, e.id, e.d * faktor, e.provinzen && e.provinzen.length ? e.provinzen : null);
      break;
    case "land":
      landAendern(w, e.land, { [e.dim]: e.d * faktor });
      break;
    case "kapital":
      if (spiel) spiel.kapital = clamp(spiel.kapital + e.d * faktor, 0, 150);
      break;
    case "schulden":
      w.economy.debtRatio += e.d * faktor;
      break;
    case "risiko":
      w.economy.riskPremium = Math.max(0, w.economy.riskPremium + e.d * faktor);
      break;
    case "staette":
      if (z?.staetten[e.id]) z.staetten[e.id]!.zustand = clamp(z.staetten[e.id]!.zustand + e.d * faktor, 0, 100);
      break;
    case "serie":
      if (z) for (const s of ERBE) if ((e.serie === "alle" || s.serien?.includes(e.serie as never)) && z.staetten[s.id]) z.staetten[s.id]!.zustand = clamp(z.staetten[s.id]!.zustand + e.d * faktor, 0, 100);
      break;
    case "entferne":
      if (z) delete z.bestand[e.id];
      break;
    case "bestand":
      if (z?.bestand[e.id]) z.bestand[e.id]!.zustand = clamp(z.bestand[e.id]!.zustand + e.d * faktor, 0, 100);
      break;
  }
}

/** Effekte, die in Wörtern und mit Richtung darstellbar sind (für Karten und Vorschau). */
export interface EffektZeile {
  text: string;
  /** +1 der Wert steigt, −1 er sinkt */
  richtung: 1 | -1;
  /** Ob das für das Land gut ist (grün) oder schlecht (rot) */
  gut: boolean;
}

/** Größen, bei denen ein höherer Wert schlechter ist. */
const SCHLECHT_WENN_HOCH = new Set([
  "haftueberfuellung",
  "ausnahmerecht",
  "strassburg_druck",
  "korruption",
  "polarisierung",
  "kriminalitaet",
  "terrorgefahr",
  "stau",
  "energiepreise",
  "energieimporte",
  "lebenshaltung",
  "armut",
  "ungleichheit",
  "schattenwirtschaft",
  "duerre",
  "kostendruck",
  "mieten",
  "abwanderung",
  "landflucht",
  "zinslast",
  "streikneigung",
  "gefluechtete",
]);

export function effektZeile(e: Effekt, modus: "sofort" | "dauer" = "sofort"): EffektZeile | null {
  const zahl = (x: number) => Math.abs(x).toLocaleString("de-DE", { maximumFractionDigits: 1 });
  // Dauerwirkungen sind je Monat angegeben; bei Größen des Netzes zeigt die Oberfläche, um wie viel sich das Gleichgewicht dauerhaft verschiebt
  if (modus === "dauer" && e.t === "knoten") {
    const node = NET.nodes[NET.index.get(e.id) ?? -1];
    const verschiebung = node && decayVon(node) > 0 ? e.d / decayVon(node) : e.d;
    return effektZeile({ ...e, d: Math.round(verschiebung * 10) / 10 }, "sofort");
  }
  const je = modus === "dauer" && e.t !== "knoten" ? " je Monat" : "";
  const z = effektZeileBasis(e, zahl);
  return z ? { ...z, text: z.text + je } : null;
}

function effektZeileBasis(e: Effekt, zahl: (x: number) => string): EffektZeile | null {
  switch (e.t) {
    case "knoten": {
      if (!e.d) return null;
      const node = NET.nodes[NET.index.get(e.id) ?? -1];
      const name = node?.name ?? e.id;
      const gruppe = node?.kind === "gruppe";
      const schlecht = SCHLECHT_WENN_HOCH.has(e.id);
      const wo = e.provinzen && e.provinzen.length && e.provinzen.length < PROVINCES ? ` in ${e.provinzen.length} ${e.provinzen.length === 1 ? "Provinz" : "Provinzen"}` : "";
      return { text: `${name} ${e.d > 0 ? "+" : "−"}${zahl(e.d)}${wo}`, richtung: e.d > 0 ? 1 : -1, gut: gruppe ? e.d > 0 : schlecht ? e.d < 0 : e.d > 0 };
    }
    case "land":
      return { text: `${e.land}: ${{ handel: "Handel", sicherheit: "Sicherheit", vertrauen: "Vertrauen", konflikt: "Konflikt" }[e.dim]} ${e.d > 0 ? "+" : "−"}${zahl(e.d)}`, richtung: e.d > 0 ? 1 : -1, gut: e.dim === "konflikt" ? e.d < 0 : e.d > 0 };
    case "kapital":
      return { text: `Politisches Kapital ${e.d > 0 ? "+" : "−"}${zahl(e.d)}`, richtung: e.d > 0 ? 1 : -1, gut: e.d > 0 };
    case "schulden":
      return { text: `Schulden ${e.d > 0 ? "+" : "−"}${zahl(e.d)} Prozentpunkte des BIP`, richtung: e.d > 0 ? 1 : -1, gut: e.d < 0 };
    case "risiko":
      return { text: `Risikoaufschlag ${e.d > 0 ? "+" : "−"}${zahl(e.d)} Punkte`, richtung: e.d > 0 ? 1 : -1, gut: e.d < 0 };
    case "staette":
      return { text: `${ERBE_NACH_ID[e.id]?.name ?? e.id}: Zustand ${e.d > 0 ? "+" : "−"}${zahl(e.d)}`, richtung: e.d > 0 ? 1 : -1, gut: e.d > 0 };
    case "serie":
      return { text: `${e.serie === "alle" ? "Alle Stätten des Landes" : "Alle Stätten der Route"}: Zustand ${e.d > 0 ? "+" : "−"}${zahl(e.d)}`, richtung: e.d > 0 ? 1 : -1, gut: e.d > 0 };
    case "entferne":
      return { text: `${vorhabenDef(e.id)?.name ?? e.id} verlässt den Bestand`, richtung: -1, gut: true };
    case "bestand":
      return { text: `${vorhabenDef(e.id)?.name ?? e.id}: Zustand ${e.d > 0 ? "+" : "−"}${zahl(e.d)}`, richtung: e.d > 0 ? 1 : -1, gut: e.d > 0 };
  }
}

// ---------------------------------------------------------------------------
// Beginnen, Pausieren, Reihenfolge

export function beginne(w: World, id: string, vergabe: Vergabe = "ausschreibung"): { ok: boolean; text: string; why?: string } {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: "Ohne Spielschleife gibt es kein Reich." };
  if (spiel.ende) return { ok: false, text: "Die Amtszeit ist beendet." };
  const s = vorhabenSicht(w, id);
  if (!s) return { ok: false, text: "Dieses Vorhaben gibt es nicht." };
  const v = s.v;
  if (s.status === "fertig") return { ok: false, text: `„${v.name}“ ist schon fertig.` };
  if (s.status === "im_bau" || s.status === "pausiert") return { ok: false, text: `„${v.name}“ läuft bereits.` };
  if (s.status === "gesperrt") return { ok: false, text: `„${v.name}“ ist gesperrt: ${s.grund}` };
  if (s.status === "ausgeschlossen") return { ok: false, text: `„${v.name}“: ${s.grund}` };
  const fehlt = s.voraus.filter((x) => !x.erfuellt).map((x) => x.text);
  if (fehlt.length) return { ok: false, text: `Voraussetzungen fehlen: ${fehlt.join("; ")}.` };
  // Die Vergabe steht ab dem Beginn fest und lässt sich nicht mehr ändern; sie legt Kosten und Bauzeit neu fest
  const angebot = vergabeAngebot(v, vergabe);
  if (!kannZahlen(spiel.kapital, angebot.pk)) return { ok: false, text: `Dafür fehlt Kapital (${angebot.pk} nötig, ${Math.floor(spiel.kapital)} vorhanden).` };
  if (!s.verwaltungOk) return { ok: false, text: "Die Verwaltungskraft reicht nicht für ein weiteres Vorhaben; erst laufende abschließen oder die Verwaltung stärken." };
  const pause = neuanfangGrund(w);
  if (pause) return { ok: false, text: pause };
  const z = reichZustand(w);
  spiel.kapital -= angebot.pk;
  verbrauche(w, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, v.name);
  // Was der Präsident eben beschlossen hat, kommt an die Spitze der Baureihenfolge; „Später“ schiebt es zurück
  z.laufend.unshift({
    id,
    fortschritt: 0,
    start: w.date,
    vergabe,
    bau: angebot.bau,
    monate: angebot.monate,
    ...(angebot.vorlauf > 0 ? { vergabeBis: w.day + angebot.vorlauf * 30 } : {}),
    ...(angebot.zustandFertig !== undefined ? { zustandFertig: angebot.zustandFertig } : {}),
  });
  if (v.ast) z.gewaehlt[v.ast] = id;
  // Die Nebenwirkungen der Vergabe; an der Korruptionsgröße hängt die Wahrscheinlichkeit von Affären-Ereignissen
  if (vergabe === "stammfirma") {
    wirke(w, "korruption", 1.5);
    wirke(w, "unternehmer", 2);
  } else if (vergabe === "ausschreibung") {
    wirke(w, "vertrauen_maerkte", 1);
    wirke(w, "legitimitaet", 0.5);
    landAendern(w, "EU", { vertrauen: 1 });
  }
  const cap = Math.max(1, Math.min(angebot.bau / Math.max(1, angebot.monate), bauKapazitaet(w)));
  const monate = angebot.vorlauf + Math.max(angebot.monate, Math.ceil(angebot.bau / cap));
  const weg = VERGABE_NAMEN[vergabe];
  const text = `Beginn: ${v.name} (${weg}). Voraussichtlich ${monate} ${monate === 1 ? "Monat" : "Monate"} bis zur Fertigstellung.`;
  const preis =
    vergabe === "stammfirma"
      ? "Schneller und teurer; die Nähe ohne Wettbewerb nährt das Korruptionsrisiko, die Unternehmer danken den Auftrag."
      : vergabe === "sparvergabe"
        ? "Günstiger und langsamer; das Ergebnis beginnt in schlechterem Zustand."
        : "Die Vergabephase verzögert den Baubeginn; dafür entsteht kein Korruptionsrisiko, und Märkte, EU und Legitimität sehen die Transparenz gern.";
  const why = `Kostet ${angebot.pk} Kapital${v.kosten.verwaltung ? ` und ${v.kosten.verwaltung} Verwaltungskraft je Monat` : ""}. ${preis} ${v.kehrseite}`;
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

export function pausiere(w: World, id: string, an: boolean): boolean {
  const l = reichZustand(w).laufend.find((x) => x.id === id);
  if (!l) return false;
  l.pausiert = an;
  return true;
}

/** Verwaltungskraft je überholter Position beim Vorziehen (Verdrängungspreis, INF-3). Spielparameter, keine Tatsache. */
export const VORZIEHEN_VERWALTUNG = 10;

export interface VerschiebeErgebnis {
  ok: boolean;
  /** Verwaltungskraft, die das Vorziehen gekostet hat */
  kosten?: number;
  /** Namen der Vorhaben, die dadurch später dran sind */
  verdrangt?: string[];
  grund?: string;
}

/** Schiebt ein Vorhaben in der Baureihenfolge nach vorn (−1) oder hinten (+1). Vorziehen kostet Verwaltungskraft und verdrängt das überholte Vorhaben; Zurückstellen ist frei. */
export function verschiebe(w: World, id: string, richtung: -1 | 1): VerschiebeErgebnis {
  const z = reichZustand(w);
  const l = z.laufend;
  const i = l.findIndex((x) => x.id === id);
  const j = i + richtung;
  if (i < 0 || j < 0 || j >= l.length) return { ok: false, grund: "An diesem Ende der Reihenfolge geht es nicht weiter." };
  const andere = l[j]!;
  if (richtung === -1) {
    if (z.verwaltung < VORZIEHEN_VERWALTUNG) return { ok: false, grund: `Vorziehen kostet ${VORZIEHEN_VERWALTUNG} Verwaltungskraft; der Vorrat reicht nicht.` };
    z.verwaltung = clamp(z.verwaltung - VORZIEHEN_VERWALTUNG, 0, 100);
  }
  [l[i], l[j]] = [l[j]!, l[i]!];
  if (richtung === -1) {
    const eigener = vorhabenDef(id)?.name ?? id;
    const fremder = vorhabenDef(andere.id)?.name ?? andere.id;
    addLog(w, "entscheidung", `„${eigener}“ in der Baureihenfolge vorgezogen.`, `Kostet ${VORZIEHEN_VERWALTUNG} Verwaltungskraft; verdrängt „${fremder}“.`);
    return { ok: true, kosten: VORZIEHEN_VERWALTUNG, verdrangt: [fremder] };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Baureihenfolge, öffentlich (INF-3)

export interface SchlangeEintrag {
  id: string;
  /** Position in der Reihenfolge, 1 baut zuerst */
  position: number;
  vergabe: Vergabe;
  pausiert: boolean;
  /** Läuft noch die Vergabephase vor dem Baubeginn? */
  vergabePhase: boolean;
  /** Baupunkte je Monat bei jetziger Reihenfolge und Kapazität (0 = wartet, ruht oder Vergabephase) */
  rate: number;
  /** Geschätzte Monate bis zum Baubeginn (undefined: pausiert) */
  startIn?: number;
  /** Geschätzte Monate bis zur Fertigstellung (undefined: pausiert oder unabsehbar) */
  fertigIn?: number;
}

/**
 * Die Baureihenfolge als öffentliche Liste mit ehrlichen Schätzungen:
 * Monat für Monat nachgespielt, solange Kapazität und Reihenfolge bleiben, wie sie sind.
 */
export function warteschlange(w: World): SchlangeEintrag[] {
  const z = reichZustand(w);
  const plan = bauplan(w);
  const kapazitaet = bauKapazitaet(w);
  const verzug = z.verwaltung <= 0 ? 0.5 : 1;
  const ausstehend = new Map<string, number>();
  const vorlauf = new Map<string, number>();
  for (const l of z.laufend) {
    const v = vorhabenDef(l.id);
    if (!v) continue;
    ausstehend.set(l.id, Math.max(0, laufBau(l, v) - l.fortschritt));
    vorlauf.set(l.id, inVergabePhase(w, l) ? Math.ceil((l.vergabeBis! - w.day) / 30) : 0);
  }
  const startIn: Record<string, number | undefined> = {};
  const fertigIn: Record<string, number | undefined> = {};
  const MAX_MONATE = 600;
  for (let m = 1; m <= MAX_MONATE; m++) {
    let frei = kapazitaet;
    let allesFertig = true;
    for (const l of z.laufend) {
      const v = vorhabenDef(l.id);
      if (!v || l.pausiert) continue;
      let rest = ausstehend.get(l.id)!;
      if (rest <= 0) continue;
      allesFertig = false;
      if ((vorlauf.get(l.id) ?? 0) >= m) continue; // die Vergabephase läuft noch
      const aufnahme = Math.min(laufBau(l, v) / Math.max(1, laufMonate(l, v)), frei, rest) * verzug;
      if (aufnahme <= 0) continue;
      if (startIn[l.id] === undefined) startIn[l.id] = m - 1;
      rest -= aufnahme;
      frei -= aufnahme / verzug;
      ausstehend.set(l.id, rest);
      if (rest <= 1e-6) fertigIn[l.id] = m;
    }
    if (allesFertig) break;
  }
  return z.laufend.map((l, i) => ({
    id: l.id,
    position: i + 1,
    vergabe: laufVergabe(l),
    pausiert: !!l.pausiert,
    vergabePhase: inVergabePhase(w, l),
    rate: plan[l.id] ?? 0,
    ...(l.pausiert ? {} : { startIn: startIn[l.id] ?? (vorlauf.get(l.id) || undefined), fertigIn: fertigIn[l.id] }),
  }));
}

// ---------------------------------------------------------------------------
// Vorteile

export function aktiveVorteile(w: World): string[] {
  const z = w.spiel?.reich;
  if (!z) return [];
  return VORTEILE.filter((d) => d.voraus.every((x) => pruefeVoraus(w, x).erfuellt)).map((d) => d.id);
}

// ---------------------------------------------------------------------------
// Monat

function meldung(w: World, art: ReichMeldung["art"], text: string): void {
  const z = reichZustand(w);
  z.meldungen.push({ tag: w.day, datum: w.date, art, text });
  if (z.meldungen.length > MELDUNGEN_MAX) z.meldungen.shift();
}

function schliesseAb(w: World, v: Vorhaben): void {
  const z = reichZustand(w);
  const l = z.laufend.find((x) => x.id === v.id);
  z.laufend = z.laufend.filter((x) => x.id !== v.id);
  // Restaurierungen sind Arbeiten, keine Bauwerke: Sie lassen sich später wiederholen
  if (v.klasse !== "restaurierung") z.bestand[v.id] = { seit: w.date, zustand: l?.zustandFertig ?? 90 };
  for (const e of v.abschluss) wendeEffekt(w, e);
  const wichtig = v.klasse === "wunder" || v.klasse === "grossprojekt" || v.klasse === "serie";
  if (wichtig && !z.feier.includes(v.id)) z.feier.push(v.id);
  const text = `Fertig: ${v.name}.`;
  meldung(w, "fertig", text);
  // Die Sparvergabe zeigt sich am Ende: Das Stück geht in schlechterem Zustand in den Bestand
  const sparhinnweis = l?.zustandFertig !== undefined ? ` Die Sparvergabe zeigt sich: Der Zustand beginnt bei ${l.zustandFertig}.` : "";
  addLog(w, "entscheidung", text, `${v.kehrseite}${sparhinnweis}`);
  w.spiel!.chronik.push({ tag: w.day, datum: w.date, titel: v.name, ausgang: `Fertiggestellt (${v.klasse === "wunder" ? "Wunder" : v.klasse === "serie" ? "Themenroute" : "Vorhaben"}).` });
  // Fertigstellung: Großereignis für die Zeitung (Eilmeldung digital, Print im nächsten Monat)
  if (wichtig)
    zeitungEreignis(w, {
      art: "fertigstellung",
      titel: v.name,
      fakt: `${v.name} ist fertiggestellt — ${v.klasse === "wunder" ? "ein Wunder der Amtszeit" : v.klasse === "serie" ? "eine ganze Themenroute" : "ein Großprojekt der Amtszeit"}.`,
      wertung: 0.7,
      schluessel: [v.name],
    });
}

/** Einmal im Monat: bauen, verfallen lassen, wirken lassen, Vorteile prüfen. */
export function reichMonat(w: World, _rng?: Rng): void {
  const spiel = w.spiel;
  if (!spiel || spiel.ende) return;
  const z = reichZustand(w);

  // 1. Verwaltungskraft
  const vb = verwaltungBilanz(w);
  z.verwaltung = clamp(z.verwaltung + vb.netto, 0, 100);
  const verzug = z.verwaltung <= 0 ? 0.5 : 1;
  if (verzug < 1 && z.laufend.length) {
    wirke(w, "legitimitaet", -0.4);
    if (!z.meldungen.some((m) => m.art === "verzug" && w.day - m.tag < 60)) meldung(w, "verzug", "Die Verwaltungskraft ist aufgebraucht: Bauvorhaben kommen nur zur Hälfte voran, die Legitimität leidet.");
  }

  // 2. Bau
  let cap = bauKapazitaet(w);
  let genutzt = 0;
  for (const l of [...z.laufend]) {
    if (l.pausiert || inVergabePhase(w, l)) continue;
    const v = vorhabenDef(l.id);
    if (!v) continue;
    const bau = laufBau(l, v);
    const rest = Math.max(0, bau - l.fortschritt);
    const monatsMax = bau / Math.max(1, laufMonate(l, v));
    const aufnahme = Math.min(monatsMax, cap, rest) * verzug;
    l.fortschritt += aufnahme;
    cap -= aufnahme / verzug;
    genutzt += aufnahme;
    // Stammfirma: Nähe ohne Wettbewerb nährt jeden Baumonat das Korruptionsrisiko (und damit die Affären-Ereignisse)
    if (laufVergabe(l) === "stammfirma") wirke(w, "korruption", STAMMFIRMA_KORRUPTION_MONAT);
    if (v.kosten.schulden && bau > 0) w.economy.debtRatio += (v.kosten.schulden * VERGABE_REGELN[laufVergabe(l)].kosten * aufnahme) / bau;
    if (l.fortschritt >= bau - 1e-6) schliesseAb(w, v);
  }
  z.bauGenutzt = genutzt;

  // 3. Bestand: Dauerwirkung nach Zustand, Verfall mit Pflege
  const pflege = 1.25 - 0.6 * (level(w, "m_instandhaltung") / 100);
  for (const [id, b] of Object.entries(z.bestand)) {
    const v = vorhabenDef(id);
    if (!v) continue;
    // Was am Spielbeginn schon stand, steckt in den Startwerten des Netzes: Es wirkt nur nach seinem Zustand gegenüber dem Start
    // (verfällt es, sinkt der Nutzen; wird es saniert, steigt er). Neue Bauten wirken nach ihrem Zustand.
    const ref = v.start?.status === "fertig" ? (v.start.zustand ?? 78) : 0;
    const skala = ref > 0 ? clamp((b.zustand - ref) / 30, -1, 1) : b.zustand < 30 ? 0.4 * (b.zustand / 30) : b.zustand / 100;
    if (v.dauer) for (const e of v.dauer) wendeEffekt(w, e, skala);
    const rate = v.bereich === "militaer" ? 0.1 : v.bereich === "infrastruktur" ? 0.09 : 0.06;
    b.zustand = Math.max(15, b.zustand - rate * pflege);
  }

  // 3b. Besetzung der Gerichte: Je mehr unabhängige und reformorientierte Mitglieder im Vergleich zum Start, desto unabhängiger die Justiz
  for (const [key, sitz] of Object.entries(z.sitze)) {
    const n = sitz.loyal + sitz.unabhaengig + sitz.reform;
    if (!n) continue;
    const anteil = (sitz.unabhaengig + sitz.reform) / n;
    wirke(w, "justiz_unabhaengigkeit", (anteil - (SITZE_START[key] ?? anteil)) * 0.9);
  }

  // 4. Stätten: Verfall, Denkmalschutz bremst; Zustand je Provinz in die Größe „Erhaltung des Kulturerbes“
  const schutz = 1.2 - 0.5 * (level(w, "m_denkmalschutz") / 100);
  const summe = new Map<number, { s: number; n: number }>();
  for (const e of ERBE) {
    const st = z.staetten[e.id];
    if (!st) continue;
    st.zustand = Math.max(5, st.zustand - 0.05 * schutz);
    const a = summe.get(e.plaka) ?? { s: 0, n: 0 };
    a.s += st.zustand;
    a.n += 1;
    summe.set(e.plaka, a);
  }
  const i = NET.index.get("kulturerbe");
  if (i !== undefined) {
    for (const [plaka, a] of summe) {
      const ziel = a.s / a.n;
      const jetzt = w.net.values[i * PROVINCES + plaka - 1]!;
      wirke(w, "kulturerbe", (ziel - jetzt) * 0.25, [plaka]);
    }
  }

  // 5. Vorteile: aktiv, solange ihre Bedingungen gelten
  const aktiv = aktiveVorteile(w);
  for (const id of aktiv) {
    const d = vorteilDef(id);
    if (d?.dauer) for (const e of d.dauer) wendeEffekt(w, e);
  }
  for (const id of aktiv) {
    if (!z.vorteile.includes(id)) {
      const d = vorteilDef(id);
      meldung(w, "freigeschaltet", `Vorteil erreicht: ${d?.name ?? id}.`);
      addLog(w, "entscheidung", `Vorteil erreicht: ${d?.name ?? id}.`, d?.text);
    }
  }
  for (const id of z.vorteile) if (!aktiv.includes(id)) meldung(w, "gesperrt", `Vorteil verloren: ${vorteilDef(id)?.name ?? id}. Die Voraussetzungen gelten nicht mehr.`);
  z.vorteile = aktiv;
}

/** Die Oberfläche hat die Fertigstellung gezeigt: Die Feier lässt die Belastung des Präsidenten sinken. */
export function quittiereFeier(w: World, id: string): void {
  const z = w.spiel?.reich;
  if (z) z.feier = z.feier.filter((x) => x !== id);
  if (z) belastungSinken(w, VERFASSUNG.feierErloesung);
}

/** Pflegt ein Bestandsstück oder eine Stätte: hebt den Zustand (Instandsetzung ohne eigenes Vorhaben ist in den Katalogen als Restaurierung abgebildet). */
export function zustandAnheben(w: World, id: string, d: number): void {
  const z = reichZustand(w);
  if (z.bestand[id]) z.bestand[id]!.zustand = clamp(z.bestand[id]!.zustand + d, 0, 100);
  else if (z.staetten[id]) z.staetten[id]!.zustand = clamp(z.staetten[id]!.zustand + d, 0, 100);
}
