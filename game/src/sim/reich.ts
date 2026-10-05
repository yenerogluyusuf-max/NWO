// Das Reich: Vorhaben beginnen, bauen, im Bestand halten; Vorteile freischalten. Kern der Fachbereiche (FACHBEREICHE.md).
// Der Kern ist die einzige Wahrheitsquelle: Oberfläche und Sprachmodell lesen `vorhabenSicht` und rufen `beginne` auf.

import { NET } from "./modell";
import { nationalAverage, PROVINCES, decayVon } from "./netz";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { dimensionZu, land, landAendern } from "./laender";
import { ERBE, ERBE_NACH_ID } from "../data/erbe";
import { VORHABEN, VORTEILE, STAETTEN_START } from "../data/reich";
import { Rng } from "./rng";
import { hashZahl } from "./personen";
import { umfangFaktor } from "./handeln";
import { PROVINZEN, REGION_DE } from "./regional";
import { instandsetzung, stoss } from "../data/reich/bau";
import MITTEN from "../data/reich/provinzmitten.json";
import type { World } from "./types";
import type { Effekt, Eingriff, LaufEintrag, ReichMeldung, ReichZustand, RegionalEintrag, Voraussetzung, Vergabe, Vorhaben } from "./reich-typen";
import { VERGABE_NAMEN } from "./reich-typen";
import type { VorteilDef } from "../data/reich/typen";
import { kannZahlen } from "./kapital";
import { zeitungEreignis } from "./zeitung";
import { AUFMERKSAMKEIT_KOSTEN, VERFASSUNG, belastungSinken, neuanfangGrund, verbrauche } from "./aufmerksamkeit";

const VORHABEN_NACH_ID = new Map(VORHABEN.map((v) => [v.id, v]));
const VORTEIL_NACH_ID = new Map(VORTEILE.map((v) => [v.id, v]));

/** Dynamisch angemeldete Vorhaben (INF-5: Wohnungsbau-Programme nach Katastrophen) — sie stehen
 * nicht im Katalog, werden aber über dieselbe Maschinerie gebaut: Baureihenfolge, Vergabe,
 * Baukapazität-Wettbewerb, Schulden über die Bauzeit. Beim Laden meldet sim/katastrophe.ts
 * sie aus dem Spielstand erneut an. */
const DYNAMISCHE: Vorhaben[] = [];

/** Pflege-Vorhaben dynamisch angelegter Stücke: gepflegtes Stück → Instandsetzung. */
const PFLEGE_DYN = new Map<string, string>();

export function registriereVorhaben(v: Vorhaben): void {
  if (!VORHABEN_NACH_ID.has(v.id)) DYNAMISCHE.push(v);
  VORHABEN_NACH_ID.set(v.id, v);
  if (v.pflegt) PFLEGE_DYN.set(v.pflegt, v.id);
}

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
  if (spiel.reich) {
    // Freie Großprojekte (INF-4): ihre Definitionen leben im Spielstand und melden sich hier für die laufende Sitzung erneut an
    if (spiel.reich.frei) for (const e of Object.values(spiel.reich.frei)) registriereVorhaben(e.def);
    // Für Provinzen angelegte Vorhaben (aus Vorlagen): ihre Definitionen leben ebenfalls im Spielstand
    if (spiel.reich.regional) {
      for (const e of Object.values(spiel.reich.regional)) {
        registriereVorhaben(e.def);
        if (e.pflege) registriereVorhaben(e.pflege);
      }
    }
    return spiel.reich;
  }
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

/** Wert einer Größe im Land oder, mit Provinzen, im Durchschnitt dieser Provinzen (nach Bevölkerung gewichtet). */
export function groessenWert(w: World, id: string, provinzen?: number[]): number {
  const i = NET.index.get(id);
  if (i === undefined) return NaN;
  if (!provinzen || !provinzen.length || provinzen.length >= PROVINCES) return nationalAverage(NET, w.net, id);
  let s = 0;
  let g = 0;
  for (const p of provinzen) {
    const gew = w.net.weights[p - 1] ?? 0;
    s += w.net.values[i * PROVINCES + p - 1]! * gew;
    g += gew;
  }
  return g > 0 ? s / g : NaN;
}

/**
 * Wie stark ein Bestandsstück wirkt, aus seinem Zustand: Der Startbestand wirkt nur gegenüber dem Spielbeginn (−1 bis 1; was am Beginn
 * schon stand, steckt in den Startwerten des Netzes), neue Bauten wirken nach ihrem Zustand (0 bis 1). Einzige Stelle der Formel.
 */
export function zustandsSkala(v: Vorhaben, zustand: number): number {
  const ref = v.start?.status === "fertig" ? (v.start.zustand ?? 78) : 0;
  return ref > 0 ? clamp((zustand - ref) / 30, -1, 1) : zustand < 30 ? 0.4 * (zustand / 30) : zustand / 100;
}

/** Zustandspunkte, die ein Stück je Monat bei Pflegefaktor 1 verliert (Spielparameter). */
export const verfallSatz = (v: Vorhaben): number => (v.bereich === "militaer" ? 0.1 : v.bereich === "infrastruktur" ? 0.09 : 0.06);

/** Pflegefaktor des Landes: Wer die Instandhaltung hoch hält, bremst den Verfall (0,65 bis 1,25). */
export const pflegeFaktor = (w: World): number => 1.25 - 0.6 * (level(w, "m_instandhaltung") / 100);

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
    case "bestand-max": {
      const b = z.bestand[v.id]?.zustand;
      return ok(b !== undefined && b <= v.max, b === undefined ? 0 : 1 - (b - v.max) / 100, `${v.text}${b === undefined ? "" : ` (jetzt ${Math.round(b)})`}`);
    }
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

/** Alle Vorhaben eines Bereichs mit ihrer Sicht — inklusive der dynamisch angemeldeten (z. B. Wohnungsbau-Programme nach Katastrophen). Freie Großprojekte im Entwurf (INF-4) erscheinen hier nicht: Sie liegen als Schätzblatt im eigenen Feld, bis sie begonnen werden. */
export function vorhabenListe(w: World, bereich: string): VorhabenSicht[] {
  const entwuerfe = new Set(
    Object.entries(reichZustand(w).frei ?? {})
      .filter(([, e]) => e.stand === "entwurf")
      .map(([id]) => id),
  );
  // Dynamisch angemeldete Definitionen gelten nur in der Welt, in deren Spielstand sie stehen (die Anmeldung ist für die Sitzung global)
  const z = reichZustand(w);
  const eigene = new Set<string>();
  for (const e of Object.values(z.regional ?? {})) {
    eigene.add(e.def.id);
    if (e.pflege) eigene.add(e.pflege.id);
  }
  const fremd = (v: Vorhaben) => (v.frei ? !z.frei?.[v.id] : v.instanzVon !== undefined || (v.pflegt?.includes("@") ?? false) ? !eigene.has(v.id) : false);
  return [...VORHABEN, ...DYNAMISCHE].filter((v) => v.bereich === bereich && !entwuerfe.has(v.id) && !fremd(v)).map((v) => vorhabenSicht(w, v.id)!);
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
  /** Der Wert der Größe heute (Land oder betroffene Provinzen), wenn die Welt bekannt ist: die Ausgangslage zur Wirkung */
  heute?: number;
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

export function effektZeile(e: Effekt, modus: "sofort" | "dauer" = "sofort", w?: World): EffektZeile | null {
  const zahl = (x: number) => Math.abs(x).toLocaleString("de-DE", { maximumFractionDigits: 1 });
  // Dauerwirkungen sind je Monat angegeben; bei Größen des Netzes zeigt die Oberfläche, um wie viel sich das Gleichgewicht dauerhaft verschiebt
  if (modus === "dauer" && e.t === "knoten") {
    const node = NET.nodes[NET.index.get(e.id) ?? -1];
    const verschiebung = node && decayVon(node) > 0 ? e.d / decayVon(node) : e.d;
    return effektZeile({ ...e, d: Math.round(verschiebung * 10) / 10 }, "sofort", w);
  }
  const je = modus === "dauer" && e.t !== "knoten" ? " je Monat" : "";
  const z = effektZeileBasis(e, zahl);
  if (!z) return null;
  const heute = w && e.t === "knoten" ? groessenWert(w, e.id, e.provinzen) : NaN;
  return { ...z, text: z.text + je, ...(Number.isFinite(heute) ? { heute: Math.round(heute) } : {}) };
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
// Ausgangslage, Pflege und Vorschau: Jedes Vorhaben zeigt vor dem Beginn, was es bewegt, und danach, was daraus wurde.

/** Die Größen, die ein Vorhaben bewegt, mit den Provinzen, in denen es das tut (die erste Nennung zählt; höchstens acht). */
function knotenZiele(v: Vorhaben): { id: string; provinzen?: number[] }[] {
  const gesehen = new Map<string, { id: string; provinzen?: number[] }>();
  // Eine Instandsetzung bewegt über den Zustand des gepflegten Stücks dessen Größen; sie gehören zu Vorher und Nachher
  const gepflegt = v.pflegt ? (vorhabenDef(v.pflegt)?.dauer ?? []) : [];
  for (const e of [...v.abschluss, ...(v.dauer ?? []), ...(v.bauwirkung ?? []), ...gepflegt]) {
    if (e.t === "knoten" && !gesehen.has(e.id) && gesehen.size < 8) gesehen.set(e.id, { id: e.id, ...(e.provinzen && e.provinzen.length ? { provinzen: e.provinzen } : {}) });
  }
  return [...gesehen.values()];
}

function messe(w: World, ziele: { id: string; provinzen?: number[] }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of ziele) {
    const x = groessenWert(w, t.id, t.provinzen);
    if (Number.isFinite(x)) out[t.id] = Math.round(x * 10) / 10;
  }
  return out;
}

/** Zustand des Stücks, das ein Vorhaben pflegt oder restauriert (Bestandsstück oder Stätte); sonst undefined. */
function zielZustand(w: World, v: Vorhaben): number | undefined {
  const z = reichZustand(w);
  for (const e of v.abschluss) {
    if (e.t === "bestand" && z.bestand[e.id]) return z.bestand[e.id]!.zustand;
    if (e.t === "staette" && z.staetten[e.id]) return z.staetten[e.id]!.zustand;
  }
  return undefined;
}

const PFLEGE_VON = new Map<string, string>(VORHABEN.filter((v) => v.pflegt).map((v) => [v.pflegt!, v.id]));
/** Das Vorhaben, das ein Bestandsstück instand setzt (etwa „sanierung_marmaray“ für „infra_marmaray“). */
export const pflegeIdFuer = (bestandId: string): string | undefined => PFLEGE_VON.get(bestandId) ?? PFLEGE_DYN.get(bestandId);

/** Um wie viele Punkte sich eine Größe durch eine Dauerwirkung × Skala dauerhaft verschiebt (Gleichgewicht, nicht der Monatsstoß). */
function verschiebungVon(e: Extract<Effekt, { t: "knoten" }>, skala: number): number {
  const node = NET.nodes[NET.index.get(e.id) ?? -1];
  const decay = node ? decayVon(node) : 0;
  return decay > 0 ? (e.d * skala) / decay : e.d * skala;
}

/** Was ein Bestandsstück bei einem Zustand an Dauerwirkung bringt, als Zeilen („Bahnnetz +1,6“); zu kleine Werte entfallen. */
function wirkungszeilen(w: World, v: Vorhaben, skala: number): EffektZeile[] {
  const out: EffektZeile[] = [];
  for (const e of v.dauer ?? []) {
    if (e.t === "knoten") {
      // Winzigkeiten (unter 0,3 Punkten dauerhafter Verschiebung) sind keine Wirkung, die man benennen sollte
      if (Math.abs(verschiebungVon(e, skala)) < 0.3) continue;
    } else if (!(e.t === "land" && Math.abs(e.d * skala) >= 0.05)) continue;
    const zeile = effektZeile({ ...e, d: e.d * skala }, "dauer", w);
    if (zeile) out.push(zeile);
  }
  return out;
}

export interface PflegeStand {
  id: string;
  v: Vorhaben;
  zustand: number;
  /** Zustand am Spielbeginn: der Bezug der Wirkung (nur beim Startbestand) */
  bezug?: number;
  /** Wirkung des Stücks, −1 bis 1 gegenüber dem Bezug (neue Bauten 0 bis 1) */
  skala: number;
  /** Ob der Zustand überhaupt etwas bewegt (sonst zeigt die Oberfläche die Größen aus `v.zeigt`) */
  wirkt: boolean;
  /** Was das Stück jetzt gegenüber dem Spielbeginn (neue Bauten: insgesamt) an Dauerwirkung bringt */
  jetzt: EffektZeile[];
  /** Zustand nach der Pflege und was sie zusätzlich bringt */
  nach?: { zustand: number; gewinn: EffektZeile[] };
  /** Ohne Pflege: Zustand in fünf Jahren, Verlust je Jahr in Zustandspunkten und was dann fehlt */
  verfall: { zustand: number; proJahr: number; verlust: EffektZeile[] };
  /** Das Pflege-Vorhaben, wenn es eines gibt */
  pflege?: VorhabenSicht;
  /** Je höher, desto dringender (Abstand zum Bezug, sonst Abstand zu 90) */
  dringlichkeit: number;
  /** Wie viele Punkte an Größen die Instandsetzung dauerhaft bewegt (Summe der Beträge): Maß dafür, ob sie sich lohnt */
  nutzen: number;
}

/** Zustand, Folgen und Pflege eines Bestandsstücks: die Zahlen, die die Oberfläche ohne eigene Rechnung zeigt. */
export function pflegeStand(w: World, id: string): PflegeStand | null {
  const z = reichZustand(w);
  const b = z.bestand[id];
  const v = vorhabenDef(id);
  if (!b || !v) return null;
  const skala = zustandsSkala(v, b.zustand);
  const ref = v.start?.status === "fertig" ? (v.start.zustand ?? 78) : undefined;
  const pflegeId = pflegeIdFuer(id);
  const pv = pflegeId ? vorhabenDef(pflegeId) : undefined;
  const hub = pv?.abschluss.find((e) => e.t === "bestand" && e.id === id);
  const faktor = pflegeFaktor(w);
  const z5 = Math.max(15, b.zustand - verfallSatz(v) * faktor * 60);
  let nutzen = 0;
  if (hub && hub.t === "bestand") {
    const dSkala = zustandsSkala(v, Math.min(100, b.zustand + hub.d)) - skala;
    for (const e of v.dauer ?? []) if (e.t === "knoten") nutzen += Math.abs(verschiebungVon(e, dSkala));
  }
  return {
    id,
    v,
    zustand: b.zustand,
    ...(ref !== undefined ? { bezug: ref } : {}),
    skala,
    wirkt: (v.dauer ?? []).some((e) => e.t === "knoten"),
    jetzt: wirkungszeilen(w, v, skala),
    ...(hub && hub.t === "bestand" ? { nach: { zustand: Math.min(100, b.zustand + hub.d), gewinn: wirkungszeilen(w, v, zustandsSkala(v, Math.min(100, b.zustand + hub.d)) - skala) } } : {}),
    verfall: { zustand: z5, proJahr: Math.round(verfallSatz(v) * faktor * 12 * 10) / 10, verlust: wirkungszeilen(w, v, zustandsSkala(v, z5) - skala) },
    ...(pflegeId ? { pflege: vorhabenSicht(w, pflegeId) ?? undefined } : {}),
    dringlichkeit: (ref ?? 90) - b.zustand,
    nutzen: Math.round(nutzen * 10) / 10,
  };
}

export interface WirkungsVorschau {
  /** Was bei der Fertigstellung einmalig geschieht, jeweils mit dem Wert heute */
  sofort: EffektZeile[];
  /** Was dauerhaft bleibt (bei Pflege: was der bessere Zustand zusätzlich bringt) */
  dauerhaft: EffektZeile[];
  /** Was schon während des Baus wirkt (Aufbruch und Arbeit, aber auch Lasten) */
  waehrendBau: EffektZeile[];
  /** Was es dem Land an Bau- und Verwaltungskraft gibt */
  kapazitaet: string[];
  /** Größen, an denen man das Stück ablesen kann, wenn sein Zustand sonst nichts bewegt */
  zeigt: { id: string; name: string; wert: number; gut: boolean }[];
  /** Die ehrliche Warnung vor der Kostenüberschreitung, wenn das Vorhaben eine hat */
  risiko?: string;
  /** Ob das Vorhaben gar keine benennbare Wirkung hat: Das darf es im Katalog nicht geben */
  leer: boolean;
}

/** Ausgangslage und erwartete Wirkung einer Definition in Zahlen aus dem Weltzustand (auch für noch nicht angelegte Instanzen). */
export function vorschauFuer(w: World, v: Vorhaben): WirkungsVorschau {
  const zeilen = (es: Effekt[] | undefined, modus: "sofort" | "dauer") => (es ?? []).map((e) => effektZeile(e, modus, w)).filter((x): x is EffektZeile => !!x);
  const sofort = zeilen(v.abschluss, "sofort");
  let dauerhaft = zeilen(v.dauer, "dauer");
  if (v.pflegt) {
    const st = pflegeStand(w, v.pflegt);
    if (st?.nach) dauerhaft = [...st.nach.gewinn, ...dauerhaft];
  }
  const waehrendBau = zeilen(v.bauwirkung, "dauer");
  const kapazitaet: string[] = [];
  const vz = (x: number) => `${x > 0 ? "+" : "−"}${Math.abs(x).toLocaleString("de-DE", { maximumFractionDigits: 1 })}`;
  if (v.kapazitaet?.bau) kapazitaet.push(`Baukapazität ${vz(v.kapazitaet.bau)} Baupunkte im Monat`);
  if (v.kapazitaet?.verwaltung) kapazitaet.push(`Verwaltungskraft ${vz(v.kapazitaet.verwaltung)} im Monat`);
  const zeigt = (v.zeigt ?? [])
    .map((gid) => {
      const node = NET.nodes[NET.index.get(gid) ?? -1];
      const wert = groessenWert(w, gid);
      return node && Number.isFinite(wert) ? { id: gid, name: node.name, wert: Math.round(wert), gut: SCHLECHT_WENN_HOCH.has(gid) ? wert < 50 : wert >= 50 } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  const u = v.ueberzug;
  const prozent = (x: number) => Math.round(x * 100);
  const teile: string[] = [];
  if (u) teile.push(`Mit ${prozent(u.p)} Prozent Wahrscheinlichkeit wird es ${prozent(u.band[0])} bis ${prozent(u.band[1])} Prozent teurer und dauert entsprechend länger; bei Vorhaben dieser Art ist das eher die Regel.`);
  if (v.scheitern) teile.push(`Der Durchbruch ist ungewiss: Mit ${prozent(v.scheitern.p)} Prozent Wahrscheinlichkeit scheitert es bei etwa ${prozent(v.scheitern.an)} Prozent des Baus, und das Geld ist verloren.`);
  const risiko = teile.length ? teile.join(" ") : undefined;
  return { sofort, dauerhaft, waehrendBau, kapazitaet, zeigt, ...(risiko ? { risiko } : {}), leer: !(sofort.length || dauerhaft.length || waehrendBau.length || kapazitaet.length || zeigt.length) };
}

/** Ausgangslage und erwartete Wirkung eines Vorhabens in Zahlen aus dem Weltzustand. */
export function wirkungsVorschau(w: World, id: string): WirkungsVorschau | null {
  const v = vorhabenDef(id);
  if (!v || !w.spiel) return null;
  return vorschauFuer(w, v);
}

/** Die Größen eines abgeschlossenen Eingriffs heute: Dritte Spalte von „Vorher, bei Fertigstellung, heute“. */
export function eingriffHeute(w: World, e: Eingriff): Record<string, number> {
  const v = vorhabenDef(e.id);
  return v ? messe(w, knotenZiele(v)) : {};
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
  const z = reichZustand(w);
  // Freie Großprojekte (INF-4): Der Entwurf muss im Reich liegen, und über die Grenze hinaus baut erst,
  // wer jede Durchfahrt hat (Bagdadbahn-Regel: ein offenes Land oder ein Veto hält die Strecke auf)
  if (v.frei) {
    const e = z.frei?.[id];
    if (!e) return { ok: false, text: "Dieses freie Vorhaben liegt nicht vor." };
    const offen = Object.entries(e.transit ?? {}).filter(([, st]) => st === "offen").map(([lId]) => land(lId).name);
    if (offen.length) return { ok: false, text: `Die Strecke ist noch nicht frei: ${offen.join(", ")} ${offen.length === 1 ? "hat" : "haben"} die Durchfahrt noch nicht zugesagt; verhandeln Sie im Schätzblatt.` };
    const veto = Object.entries(e.transit ?? {}).filter(([, st]) => st === "veto").map(([lId]) => land(lId).name);
    if (veto.length) return { ok: false, text: `${veto.join(", ")} verweigert die Durchfahrt; ohne den Umweg aus dem Schätzblatt ist die Strecke tot.` };
  }
  // Die Vergabe steht ab dem Beginn fest und lässt sich nicht mehr ändern; sie legt Kosten und Bauzeit neu fest
  const angebot = vergabeAngebot(v, vergabe);
  if (!kannZahlen(spiel.kapital, angebot.pk)) return { ok: false, text: `Dafür fehlt Kapital (${angebot.pk} nötig, ${Math.floor(spiel.kapital)} vorhanden).` };
  if (!s.verwaltungOk) return { ok: false, text: "Die Verwaltungskraft reicht nicht für ein weiteres Vorhaben; erst laufende abschließen oder die Verwaltung stärken." };
  const pause = neuanfangGrund(w);
  if (pause) return { ok: false, text: pause };
  spiel.kapital -= angebot.pk;
  verbrauche(w, AUFMERKSAMKEIT_KOSTEN.reichVorhaben, v.name);
  // Was der Präsident eben beschlossen hat, kommt an die Spitze der Baureihenfolge; „Später“ schiebt es zurück
  const vorher = messe(w, knotenZiele(v));
  const zustandVorher = zielZustand(w, v);
  z.laufend.unshift({
    id,
    fortschritt: 0,
    start: w.date,
    vergabe,
    bau: angebot.bau,
    monate: angebot.monate,
    ...(Object.keys(vorher).length ? { vorher } : {}),
    ...(zustandVorher !== undefined ? { zustandVorher } : {}),
    ...(angebot.vorlauf > 0 ? { vergabeBis: w.day + angebot.vorlauf * 30 } : {}),
    ...(angebot.zustandFertig !== undefined ? { zustandFertig: angebot.zustandFertig } : {}),
    ...(v.frei ? { frei: true } : {}),
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
  // Vorher und Nachher: Ausgangslage beim Beginn gegen den Stand am Tag der Fertigstellung (die Dauerwirkung baut sich danach auf)
  let zusatz = "";
  if (l?.vorher) {
    const pflege = v.klasse === "restaurierung";
    const nz = pflege ? zielZustand(w, v) : undefined;
    const eintrag: Eingriff = {
      id: v.id,
      name: v.name,
      tag: w.day,
      datum: w.date,
      art: pflege ? "pflege" : "bau",
      vorher: l.vorher,
      nachher: messe(w, knotenZiele(v)),
      ...(pflege && l.zustandVorher !== undefined && nz !== undefined ? { zustand: { vorher: Math.round(l.zustandVorher), nachher: Math.round(nz) } } : {}),
    };
    (z.verlauf ??= []).push(eintrag);
    if (z.verlauf.length > 40) z.verlauf.shift();
    if (eintrag.zustand) zusatz = ` Zustand ${eintrag.zustand.vorher} → ${eintrag.zustand.nachher}.`;
  }
  const wichtig = v.klasse === "wunder" || v.klasse === "grossprojekt" || v.klasse === "serie";
  if (wichtig && !z.feier.includes(v.id)) z.feier.push(v.id);
  const text = `Fertig: ${v.name}.${zusatz}`;
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

/** Prüft die Marken der Kostenüberschreitung eines Katalogvorhabens; trifft sie ein, steigen Baupunkte und Bauzeit, und die Schulden wachsen mit. */
function ueberzugPruefen(w: World, l: LaufEintrag, v: Vorhaben): void {
  const u = v.ueberzug!;
  const marken = u.an ?? [0.35];
  let n = l.ueberzugN ?? 0;
  while (n < marken.length && l.fortschritt / laufBau(l, v) >= marken[n]!) {
    const r = new Rng(Math.floor(hashZahl(`${w.seed}|ueberzug|${l.id}|${n}`) * 2 ** 31));
    n += 1;
    l.ueberzugN = n;
    if (r.next() >= u.p) continue;
    const frac = Math.round(r.between(u.band[0], u.band[1]) * 100) / 100;
    if (frac <= 0) continue;
    const jetzt = laufBau(l, v);
    const extra = Math.round(jetzt * frac);
    l.bau = jetzt + extra;
    l.monate = Math.ceil(laufMonate(l, v) * (1 + frac));
    if (v.kosten.schulden && v.kosten.bau > 0) w.economy.debtRatio += (v.kosten.schulden * extra) / v.kosten.bau;
    wirke(w, "legitimitaet", -0.6);
    meldung(w, "ueberzug", `Kostenüberschreitung bei „${v.name}“: Der Bau braucht etwa ${Math.round(frac * 100)} % mehr — Kosten und Zeit steigen.`);
    addLog(w, "entscheidung", `Kostenüberschreitung: ${v.name}`, `Bei Vorhaben dieser Größe ist das eher Regel als Ausnahme (Spielparameter, kein Zufall des Tages: Der Ausgang steht mit dem Spielstand fest). ${v.anker ?? ""}`.trim());
  }
}

/** Der Wurf des ungewissen Durchbruchs; `true`, wenn das Vorhaben scheitert und aus dem Bau genommen wurde. */
function durchbruchPruefen(w: World, l: LaufEintrag, v: Vorhaben): boolean {
  l.durchbruchGeprueft = true;
  const sch = v.scheitern!;
  const r = new Rng(Math.floor(hashZahl(`${w.seed}|durchbruch|${l.id}`) * 2 ** 31));
  if (r.next() >= sch.p) return false;
  const z = reichZustand(w);
  z.laufend = z.laufend.filter((x) => x.id !== l.id);
  if (v.ast && z.gewaehlt[v.ast] === v.id) delete z.gewaehlt[v.ast];
  for (const e of sch.folge ?? [{ t: "knoten", id: "ansehen", d: -3 }, { t: "knoten", id: "legitimitaet", d: -2 }]) wendeEffekt(w, e);
  const text = `Gescheitert: ${v.name}. Der Durchbruch blieb aus, das eingesetzte Kapital und die Baupunkte sind verloren.`;
  meldung(w, "gescheitert", text);
  addLog(w, "entscheidung", text, `${v.konkurrenz ?? "Andere Staaten forschen am Gleichen und lesen mit."} Ein Neubeginn ist möglich, beginnt aber bei null (Spielparameter, Ausgang steht mit dem Spielstand fest).`);
  w.spiel!.chronik.push({ tag: w.day, datum: w.date, titel: v.name, ausgang: "Gescheitert: Der Durchbruch blieb aus." });
  return true;
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
    // Freie Großprojekte (INF-4): Die Schätzung ist ein Band. An der 35-%-Marke des Baus fällt der Wurf,
    // ob die Kostenüberschreitung eintritt (Schiene ~45 %, Straße ~20 %, Prestige bis ~70 % — Spielparameter)
    if (l.frei && !l.ueberzugGeprueft && bau > 0 && l.fortschritt / bau >= 0.35) {
      l.ueberzugGeprueft = true;
      const eintrag = z.frei?.[l.id];
      const rngU = _rng ?? new Rng(w.rngState);
      const ueberzug = rngU.next() < (eintrag?.schaetzung.ueberzugP ?? 0.5);
      const frac = ueberzug ? Math.round(rngU.between(...(eintrag?.schaetzung.ueberzugBand ?? [0.2, 0.4])) * 100) / 100 : 0;
      if (!_rng) w.rngState = rngU.state;
      if (ueberzug && frac > 0) {
        const extra = Math.round(bau * frac);
        l.bau = bau + extra;
        if (v.kosten.schulden) w.economy.debtRatio += v.kosten.schulden * frac;
        wirke(w, "legitimitaet", -0.6);
        meldung(w, "ueberzug", `Kostenüberschreitung bei „${v.name}“: Der Bau braucht etwa ${Math.round(frac * 100)} % mehr — Kosten und Zeit steigen.`);
        addLog(w, "entscheidung", `Kostenüberschreitung: ${v.name}`, `Die Schätzung war ein Band; die Verwirklichung liegt ${Math.round(frac * 100)} % über der ursprünglichen Ansage. Solche Überschreitungen sind bei Großprojekten eher Regel als Ausnahme (Spielparameter, keine Tatsachen).`);
      }
    }
    // Was schon während des Baus wirkt: Aufbruch und Arbeit, aber auch Lasten
    if (v.bauwirkung && aufnahme > 0) for (const e of v.bauwirkung) wendeEffekt(w, e);
    // Kostenüberschreitung der Katalogvorhaben: Marken des Baufortschritts, gewürfelt aus Spielstand und Vorhaben
    // (kein Zugriff auf den Zufallsstrom des Spiels, der Ausgang steht mit dem Spielstand fest)
    if (!l.frei && v.ueberzug && bau > 0) ueberzugPruefen(w, l, v);
    // Ungewisser Durchbruch: Bei der Marke fällt der Wurf; scheitert das Vorhaben, ist das Geld verloren
    if (v.scheitern && !l.durchbruchGeprueft && bau > 0 && l.fortschritt / laufBau(l, v) >= v.scheitern.an && durchbruchPruefen(w, l, v)) continue;
    if (v.kosten.schulden && bau > 0) w.economy.debtRatio += (v.kosten.schulden * VERGABE_REGELN[laufVergabe(l)].kosten * aufnahme) / bau;
    if (l.fortschritt >= bau - 1e-6) schliesseAb(w, v);
  }
  z.bauGenutzt = genutzt;

  // 3. Bestand: Dauerwirkung nach Zustand, Verfall mit Pflege
  const pflege = pflegeFaktor(w);
  for (const [id, b] of Object.entries(z.bestand)) {
    const v = vorhabenDef(id);
    if (!v) continue;
    // Was am Spielbeginn schon stand, steckt in den Startwerten des Netzes: Es wirkt nur nach seinem Zustand gegenüber dem Start
    // (verfällt es, sinkt der Nutzen; wird es instand gesetzt, steigt er). Neue Bauten wirken nach ihrem Zustand.
    const skala = zustandsSkala(v, b.zustand);
    if (v.dauer) for (const e of v.dauer) wendeEffekt(w, e, skala);
    b.zustand = Math.max(15, b.zustand - verfallSatz(v) * pflege);
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

// ---------------------------------------------------------------------------
// Vorhaben für einzelne Provinzen (Vorlagen): Der Umfang bestimmt Preis, Dauer und Wirkungsgebiet.
// Die Werte einer Vorlage gelten für das ganze Land; ein Vorhaben für eine Provinz, eine Region oder mehrere Provinzen kostet entsprechend
// weniger, dauert kürzer und wirkt nur dort. Der politische Preis folgt `umfangFaktor` (sim/handeln.ts), derselben Rechnung wie in der Politik;
// Baupunkte und Schulden folgen dem Bevölkerungsanteil, die Bauzeit der Wurzel daraus (alle Faktoren sind Spielparameter, keine Tatsachen).

export const ALLE_PROVINZEN: number[] = Array.from({ length: PROVINCES }, (_, i) => i + 1);
/** Kleinste Baugröße als Anteil der Landesbaupunkte: Auch die kleinste Provinz braucht Planung, Gerät und Leute. */
const BAU_UNTERGRENZE = 0.025;

export function regionalAnteil(w: World, provinzen: number[]): number {
  return provinzen.reduce((s, p) => s + (w.net.weights[p - 1] ?? 0), 0);
}

export interface RegionalFaktoren {
  /** Bevölkerungsanteil der Provinzen (bei Vorlagen nach Stätten: Anteil der Stätten am Katalog) */
  anteil: number;
  art: "bevoelkerung" | "staetten";
  /** Zahl der Stätten (nur bei Vorlagen nach Stätten) */
  staetten?: number;
  /** Faktor auf das politische Kapital (wie in der Politik) */
  pk: number;
  bau: number;
  monate: number;
  verwaltung: number;
  schulden: number;
}

export function regionalFaktoren(anteil: number, art: "bevoelkerung" | "staetten" = "bevoelkerung", staetten?: number): RegionalFaktoren {
  const a = Math.min(1, Math.max(0, anteil));
  const f = umfangFaktor(a);
  return { anteil: a, art, ...(staetten !== undefined ? { staetten } : {}), pk: f, bau: Math.max(BAU_UNTERGRENZE, a), monate: 0.35 + 0.65 * Math.sqrt(a), verwaltung: f, schulden: a };
}

const regionVon = (provinzen: number[]): string | undefined =>
  Object.keys(REGION_DE).find((r) => {
    const m = PROVINZEN.filter((p) => p.region === r);
    return m.length === provinzen.length && m.every((p) => provinzen.includes(p.plaka));
  });

/** Der Ort in Worten: „ganzes Land“, eine Region, bis zu drei Provinzen mit Namen, sonst die Zahl. */
export function ortKurz(provinzen: number[]): string {
  if (provinzen.length >= PROVINCES) return "ganzes Land";
  const r = regionVon(provinzen);
  if (r) return (REGION_DE[r] ?? r).split(" (")[0]!;
  const namen = provinzen.map((p) => PROVINZEN[p - 1]?.name ?? String(p));
  return namen.length <= 3 ? namen.join(", ") : `${namen.length} Provinzen`;
}

function ortSchluessel(provinzen: number[]): string {
  if (provinzen.length >= PROVINCES) return "land";
  if (provinzen.length <= 6) return `p${provinzen.join("-")}`;
  return `n${provinzen.length}x${Math.floor(hashZahl(provinzen.join(",")) * 36 ** 5).toString(36)}`;
}

export type RegionalPlan = { ok: true; vorlage: Vorhaben; def: Vorhaben; pflege?: Vorhaben; provinzen: number[]; faktoren: RegionalFaktoren } | { ok: false; grund: string };

/** Baut aus einer Vorlage das Vorhaben für die gewählten Provinzen (`null` oder leer = ganzes Land); legt noch nichts an. */
export function regionalPlan(w: World, vorlageId: string, ort: number[] | null): RegionalPlan {
  const vorlage = vorhabenDef(vorlageId);
  if (!vorlage?.vorlage) return { ok: false, grund: "Das ist keine Vorlage für Orte." };
  const provinzen = ort && ort.length ? [...new Set(ort)].filter((p) => p >= 1 && p <= PROVINCES).sort((a, b) => a - b) : ALLE_PROVINZEN;
  if (!provinzen.length) return { ok: false, grund: "Es ist kein Ort gewählt." };
  const nachStaetten = vorlage.vorlage.nach === "staetten";
  const staetten = nachStaetten ? ERBE.filter((e) => provinzen.includes(e.plaka)) : [];
  const name = ortKurz(provinzen);
  if (nachStaetten && !staetten.length) return { ok: false, grund: `In ${name} gibt es keine Stätte im Katalog.` };
  const anteil = nachStaetten ? staetten.length / ERBE.length : regionalAnteil(w, provinzen);
  const f = regionalFaktoren(anteil, nachStaetten ? "staetten" : "bevoelkerung", nachStaetten ? staetten.length : undefined);
  const r1 = (x: number) => Math.round(x * 10) / 10;
  const gewaehlt = (e: Effekt): Effekt => (e.t === "knoten" ? { ...e, provinzen } : e.t === "land" || e.t === "kapital" || e.t === "schulden" || e.t === "risiko" ? { ...e, d: Math.round(e.d * f.pk * 100) / 100 } : e);
  const { vorlage: _v, einmalig: _e, ...rest } = vorlage;
  const zentrum = [...provinzen].sort((a, b) => (PROVINZEN[b - 1]?.bevoelkerung ?? 0) - (PROVINZEN[a - 1]?.bevoelkerung ?? 0))[0]!;
  const mitte = (MITTEN as unknown as Record<string, [number, number]>)[String(zentrum)];
  const k = vorlage.kosten;
  const umfang = nachStaetten ? `${staetten.length} ${staetten.length === 1 ? "Stätte" : "Stätten"}` : `${anteil < 0.01 ? "unter 1" : Math.round(anteil * 100)} Prozent der Bevölkerung`;
  const def: Vorhaben = {
    ...rest,
    id: `${vorlage.id}@${ortSchluessel(provinzen)}`,
    name: `${vorlage.name}: ${name}`,
    text: `${vorlage.text} Angelegt für ${name} (${umfang}).`,
    provinzen,
    ...(mitte ? { ort: { lon: mitte[0], lat: mitte[1], plaka: zentrum, name: provinzen.length === 1 ? PROVINZEN[zentrum - 1]!.name : name } } : {}),
    kosten: {
      pk: r1(k.pk * f.pk),
      bau: Math.max(40, Math.round(k.bau * f.bau)),
      monate: Math.max(3, Math.round(k.monate * f.monate)),
      ...(k.verwaltung ? { verwaltung: Math.round(k.verwaltung * f.verwaltung * 100) / 100 } : {}),
      ...(k.schulden ? { schulden: Math.round(k.schulden * f.schulden * 1000) / 1000 } : {}),
    },
    abschluss: [...rest.abschluss.map(gewaehlt), ...staetten.map((e): Effekt => ({ t: "staette", id: e.id, d: 20 }))],
    ...(rest.dauer ? { dauer: rest.dauer.map(gewaehlt) } : {}),
    ...(rest.bauwirkung ? { bauwirkung: rest.bauwirkung.map(gewaehlt) } : {}),
    ...(rest.unterhalt ? { unterhalt: Math.round(rest.unterhalt * Math.pow(Math.max(0.05, f.anteil), 0.8) * 100) / 100 } : {}),
    ...(rest.kapazitaet ? { kapazitaet: { ...(rest.kapazitaet.bau ? { bau: Math.round(rest.kapazitaet.bau * f.anteil * 10) / 10 } : {}), ...(rest.kapazitaet.verwaltung ? { verwaltung: Math.round(rest.kapazitaet.verwaltung * f.anteil * 10) / 10 } : {}) } } : {}),
    instanzVon: vorlage.id,
  };
  const pflegbar = vorlage.klasse !== "restaurierung" && !rest.ohnePflege && (def.dauer ?? []).some((e) => e.t === "knoten");
  const pflege = pflegbar
    ? instandsetzung(def, {
        id: `sanierung_${def.id}`,
        bau: Math.max(30, Math.round(def.kosten.bau * 0.08)),
        monate: 6,
        hub: 26,
        stoesse: [stoss("wartungszustand", 3, provinzen)],
        kehrseite: "Bindet Baukapazität, die dann für Neues fehlt.",
      })
    : undefined;
  return { ok: true, vorlage, def, ...(pflege ? { pflege } : {}), provinzen, faktoren: f };
}

/** Wenn dieselbe Vorlage an einem dieser Orte schon läuft oder steht, der Hinweis darauf; sonst `null`. */
export function regionalKonflikt(w: World, vorlageId: string, provinzen: number[]): string | null {
  const z = reichZustand(w);
  for (const e of Object.values(z.regional ?? {})) {
    if (e.vorlage !== vorlageId) continue;
    const aktiv = !!z.bestand[e.def.id] || z.laufend.some((l) => l.id === e.def.id);
    if (!aktiv) continue;
    const gemeinsam = e.provinzen.filter((p) => provinzen.includes(p));
    if (!gemeinsam.length) continue;
    const namen = gemeinsam.slice(0, 4).map((p) => PROVINZEN[p - 1]?.name ?? String(p)).join(", ");
    return `Dasselbe Programm gibt es dort schon („${e.def.name}“): Es überschneidet sich in ${namen}${gemeinsam.length > 4 ? " und weiteren" : ""}. Dasselbe Vorhaben legt man am selben Ort nur einmal an; wählen Sie andere Provinzen.`;
  }
  return null;
}

export type RegionalVorschau =
  | { ok: false; grund: string }
  | {
      ok: true;
      def: Vorhaben;
      provinzen: number[];
      faktoren: RegionalFaktoren;
      vorschau: WirkungsVorschau;
      /** Der Umfang auf dem Preisschild: „betrifft 12 Prozent der Bevölkerung · Kapital ×0,45 · …“ */
      preisschild: string;
      konflikt?: string;
      voraus: VorausStand[];
      bereit: boolean;
      bezahlbar: boolean;
      verwaltungOk: boolean;
    };

/** Was ein Vorhaben für diese Orte kostet, wie lange es dauert und was es dort bewegt; legt nichts an. */
export function regionalVorschau(w: World, vorlageId: string, ort: number[] | null): RegionalVorschau {
  const plan = regionalPlan(w, vorlageId, ort);
  if (!plan.ok) return plan;
  const spiel = w.spiel;
  if (!spiel) return { ok: false, grund: "Ohne Spielschleife gibt es kein Reich." };
  const z = reichZustand(w);
  const f = plan.faktoren;
  const zahl = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 2 });
  const umfang =
    f.art === "staetten"
      ? `betrifft ${f.staetten} von ${ERBE.length} Stätten`
      : `betrifft ${f.anteil < 0.01 ? "unter 1" : Math.round(f.anteil * 100)} Prozent der Bevölkerung`;
  const preisschild = `${umfang} · Kapital ×${zahl(f.pk)} · Baupunkte ×${zahl(f.bau)} · Dauer ×${zahl(f.monate)}${plan.def.kosten.schulden ? ` · Schulden ×${zahl(f.schulden)}` : ""}`;
  const konflikt = regionalKonflikt(w, vorlageId, plan.provinzen);
  const voraus = plan.def.voraus.map((x) => pruefeVoraus(w, x));
  return {
    ok: true,
    def: plan.def,
    provinzen: plan.provinzen,
    faktoren: f,
    vorschau: vorschauFuer(w, plan.def),
    preisschild,
    ...(konflikt ? { konflikt } : {}),
    voraus,
    bereit: voraus.every((x) => x.erfuellt),
    bezahlbar: kannZahlen(spiel.kapital, plan.def.kosten.pk),
    verwaltungOk: z.verwaltung >= (plan.def.kosten.verwaltung ?? 0) * 3,
  };
}

/** Legt ein Vorhaben aus einer Vorlage für die gewählten Provinzen an und beginnt es. Dasselbe Vorhaben am selben Ort gibt es nur einmal. */
export function beginneRegional(w: World, vorlageId: string, ort: number[] | null, vergabe: Vergabe = "ausschreibung"): { ok: boolean; text: string; why?: string; id?: string } {
  if (!w.spiel) return { ok: false, text: "Ohne Spielschleife gibt es kein Reich." };
  const plan = regionalPlan(w, vorlageId, ort);
  if (!plan.ok) return { ok: false, text: plan.grund };
  const konflikt = regionalKonflikt(w, vorlageId, plan.provinzen);
  if (konflikt) return { ok: false, text: konflikt };
  const z = reichZustand(w);
  (z.regional ??= {})[plan.def.id] = { vorlage: vorlageId, provinzen: plan.provinzen, def: plan.def, ...(plan.pflege ? { pflege: plan.pflege } : {}), angelegt: w.date } satisfies RegionalEintrag;
  registriereVorhaben(plan.def);
  if (plan.pflege) registriereVorhaben(plan.pflege);
  const r = beginne(w, plan.def.id, vergabe);
  if (!r.ok) {
    delete z.regional![plan.def.id];
    return r;
  }
  return { ...r, id: plan.def.id };
}

/** Ein Ort auf der Karte: eine Baustelle oder ein fertiges Projekt. Die Oberfläche (ui/Stage.tsx, `orte`) kann diese Liste anstelle der festen Vorhaben lesen. */
export interface ReichOrt {
  id: string;
  lon: number;
  lat: number;
  art: "bau" | "wunder";
  text: string;
}

/** Alle Baustellen und fertigen Projekte mit Ort: Katalog, freie Großprojekte und die für Provinzen angelegten Vorhaben. */
export function kartenOrte(w: World): ReichOrt[] {
  if (!w.spiel) return [];
  const z = reichZustand(w);
  const out: ReichOrt[] = [];
  const kandidaten = [...VORHABEN, ...Object.values(z.regional ?? {}).map((e) => e.def), ...Object.values(z.frei ?? {}).map((e) => e.def)];
  for (const v of kandidaten) {
    if (!v.ort || (!["wunder", "grossprojekt", "serie", "ausbau"].includes(v.klasse) && !v.instanzVon)) continue;
    if (z.bestand[v.id]) out.push({ id: `v:${v.id}`, lon: v.ort.lon, lat: v.ort.lat, art: "wunder", text: `${v.name} (fertig)` });
    else if (z.laufend.some((l) => l.id === v.id)) out.push({ id: `v:${v.id}`, lon: v.ort.lon, lat: v.ort.lat, art: "bau", text: `${v.name} (im Bau)` });
  }
  return out;
}
