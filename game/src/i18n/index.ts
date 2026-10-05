// Übersetzungsschicht: Schlüssel → Text in Deutsch, Türkisch oder Englisch (Konzept: SPRACHEN_KONZEPT_2026-10-04.md).
//
//   t("krieg.waffenruhe.titel", { land: "Syrien" })     fertiger Text in der aktuellen Sprache
//   msg("krieg.waffenruhe.titel", { land: "Syrien" })   Meldung für den Spielstand (Schlüssel + Werte), erst bei der Anzeige in Text verwandeln
//   rendere(eintrag.text)                               nimmt Msg oder einen alten fertigen Text (Spielstände vor der Umstellung)
//
// Regeln: Der Katalog liegt in src/i18n/katalog/<sprache>/<bereich>.json (flache Tabelle Schlüssel → Vorlage). Deutsch ist die
// Quellsprache und immer geladen; Türkisch und Englisch laden beim Wechsel nach. Fehlt ein Schlüssel, gilt Englisch, dann Deutsch;
// in der Entwicklung erscheint ein auffälliges ⟦Schlüssel⟧, damit nichts unbemerkt deutsch bleibt.

import { formatiere } from "./format";
import { LOCALE, SPRACHEN, istMsg, type Msg, type Params, type Sprache } from "./typen";

export { SPRACHEN, istMsg } from "./typen";
export type { Msg, Params, Sprache, Formen, Fall, Wert } from "./typen";
export { ek } from "./tuerkisch";
export { formatiere, platzhalter } from "./format";

type Tabelle = Record<string, string>;

const tabellen: Record<Sprache, Tabelle> = { de: {}, tr: {}, en: {} };
const geladen: Record<Sprache, boolean> = { de: false, tr: false, en: false };

// `import.meta.glob` gibt es nur unter Vite (App, Entwicklung, Tests). Werkzeuge, die die Simulation mit einem anderen Bündler laufen lassen
// (scripts/netz-export.mjs über runner.mjs), laden dann keine Kataloge; Datum, Zahl und Liste brauchen sie nicht.
function globOderLeer<T>(f: () => T, leer: T): T {
  try {
    return f();
  } catch {
    return leer;
  }
}

const deDateien = globOderLeer(() => import.meta.glob<Tabelle>("./katalog/de/*.json", { eager: true, import: "default" }), {} as Record<string, Tabelle>);
const spaeter: Record<"tr" | "en", Record<string, () => Promise<Tabelle>>> = {
  tr: globOderLeer(() => import.meta.glob<Tabelle>("./katalog/tr/*.json", { import: "default" }), {} as Record<string, () => Promise<Tabelle>>),
  en: globOderLeer(() => import.meta.glob<Tabelle>("./katalog/en/*.json", { import: "default" }), {} as Record<string, () => Promise<Tabelle>>),
};

for (const t of Object.values(deDateien)) Object.assign(tabellen.de, t);
geladen.de = true;

const SCHLUESSEL = "staatsraeson-sprache";

function startSprache(): Sprache {
  // Ohne Fenster (Tests, Werkzeuge, Worker) gilt immer Deutsch: Die Simulation und ihre Tests sollen nie von einer Geräteeinstellung abhängen.
  if (typeof window === "undefined") return "de";
  try {
    const s = localStorage.getItem(SCHLUESSEL);
    if (s === "de" || s === "tr" || s === "en") return s;
  } catch {
    /* kein Speicher (Test, privates Fenster) */
  }
  try {
    const n = navigator.language.slice(0, 2).toLowerCase();
    if (n === "tr" || n === "en" || n === "de") return n;
  } catch {
    /* kein Browser */
  }
  return "de";
}

let aktuell: Sprache = startSprache();
const hoerer = new Set<() => void>();

export const aktuelleSprache = (): Sprache => aktuell;
export const aktuelleLocale = (): string => LOCALE[aktuell];

export function abonniere(f: () => void): () => void {
  hoerer.add(f);
  return () => hoerer.delete(f);
}

/** Lädt die Kataloge einer Sprache (Deutsch ist immer da). */
export async function ladeSprache(s: Sprache): Promise<void> {
  if (geladen[s]) return;
  if (s !== "de") {
    const teile = await Promise.all(Object.values(spaeter[s]).map((f) => f()));
    for (const t of teile) Object.assign(tabellen[s], t);
  }
  geladen[s] = true;
}

/** Wechselt die Sprache: Kataloge nachladen, merken, Dokumentsprache setzen, Oberfläche benachrichtigen. */
export async function setzeSprache(s: Sprache): Promise<void> {
  await ladeSprache(s);
  aktuell = s;
  try {
    localStorage.setItem(SCHLUESSEL, s);
  } catch {
    /* ohne Speicher gilt die Wahl nur für diese Sitzung */
  }
  try {
    document.documentElement.lang = s;
  } catch {
    /* kein Dokument */
  }
  for (const f of [...hoerer]) f();
}

/**
 * Sprachwechsel in der Oberfläche: Sprache merken, dann die Seite neu laden. Viele Texte entstehen beim Laden der Datenmodule (Kataloge,
 * Beschriftungen); nur ein Neustart der Oberfläche bringt sie alle in die neue Sprache. Der Aufrufer sichert vorher den Spielstand
 * (`await window.__sichereJetzt?.()`), siehe ui/SprachWahl.tsx.
 */
export async function wechsleSprache(s: Sprache): Promise<void> {
  if (s === aktuell) return;
  await ladeSprache(s);
  try {
    localStorage.setItem(SCHLUESSEL, s);
  } catch {
    /* ohne Speicher gilt die Wahl nur bis zum Neuladen: dann ist ein Wechsel nicht möglich */
  }
  location.reload();
}

/** Für Tests und Werkzeuge: Tabelle direkt eintragen. */
export function registriere(s: Sprache, tabelle: Tabelle): void {
  Object.assign(tabellen[s], tabelle);
  geladen[s] = true;
}

export const katalogDe = (): Readonly<Tabelle> => tabellen.de;
export const katalogVon = (s: Sprache): Readonly<Tabelle> => tabellen[s];

const DEV = (() => {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
})();

/** Text zu einem Schlüssel in einer bestimmten Sprache (Rückfall: Englisch, dann Deutsch). */
export function tIn(sprache: Sprache, key: string, params?: Params): string {
  let vorlage = tabellen[sprache][key];
  let wie: Sprache = sprache;
  if (vorlage === undefined) {
    vorlage = tabellen.en[key];
    wie = "en";
  }
  if (vorlage === undefined) {
    vorlage = tabellen.de[key];
    wie = "de";
  }
  if (vorlage === undefined) return DEV ? `⟦${key}⟧` : key;
  return formatiere(vorlage, params, wie);
}

/** Text zu einem Schlüssel in der aktuellen Sprache. */
export const t = (key: string, params?: Params): string => tIn(aktuell, key, params);

/** Meldung für den Spielstand: nur Schlüssel und JSON-Werte, Text entsteht bei der Anzeige. */
export function msg(k: string, p?: NonNullable<Msg["p"]>): Msg {
  return p === undefined ? { k } : { k, p };
}

/** Macht aus einer Meldung (oder einem alten fertigen Text) den Text der aktuellen Sprache. */
export function rendere(x: Msg | string): string {
  return istMsg(x) ? t(x.k, x.p) : x;
}

// ---------------------------------------------------------------------------
// Formatierung ohne Katalog: Datum, Zahl, Liste in der aktuellen Sprache

export const zahl = (n: number, stellen?: number): string =>
  new Intl.NumberFormat(aktuelleLocale(), stellen === undefined ? { maximumFractionDigits: 2 } : { minimumFractionDigits: stellen, maximumFractionDigits: stellen }).format(n);

export function datum(iso: string | Date, stil: "lang" | "kurz" | "monat" | "tag" = "lang"): string {
  return formatiere(`{d, date, ${stil}}`, { d: iso }, aktuell);
}

export const liste = (l: readonly (string | number)[], stil?: "oder"): string => formatiere(stil ? `{l, list, ${stil}}` : "{l, list}", { l }, aktuell);

export const sprachName = (s: Sprache): string => SPRACHEN.find((x) => x.id === s)!.name;
