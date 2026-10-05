// Gemalte Rasterporträts als zweiter Weg: Der Ordner public/ui/portraits/ enthält WebP-Bilder und ein Manifest portraits.json
// (erzeugt von tools/portraits/baue_manifest.mjs aus den Dateinamen `p-<f|m>-<alter>-<ton>-<nn>[-<merkmale>].webp`).
// Das Manifest wird einmal geladen. `waehleBild` sucht deterministisch aus dem Samen unter den Einträgen, die am besten zur Anfrage passen;
// gibt es keinen passenden Eintrag (oder kein Manifest), bleibt es bei den gezeichneten Gesichtern (Rückfall).
//   Hart: Geschlecht, Kopftuch (ja oder nein), Uniform, Robe. Weich: Altersgruppe, Hautton, Brille, Bart.

import { useSyncExternalStore } from "react";
import { hash } from "./portraet-kern";

export interface BildEintrag {
  datei: string;
  geschlecht: "f" | "m";
  alter: number;
  ton: number;
  kopftuch: boolean;
  brille: boolean;
  bart: boolean;
  uniform: boolean;
  robe: boolean;
}

export interface Manifest {
  version: number;
  bilder: BildEintrag[];
}

export interface BildAnfrage {
  seed: string;
  geschlecht: "f" | "m";
  alter: number;
  ton: number;
  kopftuch: boolean;
  brille: boolean;
  bart: boolean;
  uniform: boolean;
  robe: boolean;
}

export const BILDER_ORDNER = "/ui/portraits/";

/** Nächste Altersgruppe der Bilder (30 bis 70) */
export const altersgruppe = (alter: number): number => Math.max(30, Math.min(70, Math.round(alter / 10) * 10));

const gueltig = (e: unknown): e is BildEintrag => {
  const x = e as Partial<BildEintrag> | null;
  return !!x && typeof x.datei === "string" && (x.geschlecht === "f" || x.geschlecht === "m") && typeof x.alter === "number" && typeof x.ton === "number";
};

/** Macht aus beliebigen geladenen Daten ein sauberes Manifest (fehlende Merkmale gelten als falsch). */
export function bereinige(daten: unknown): Manifest | null {
  const d = daten as { version?: unknown; bilder?: unknown } | null;
  if (!d || !Array.isArray(d.bilder)) return null;
  const bilder: BildEintrag[] = [];
  for (const e of d.bilder) {
    if (!gueltig(e)) continue;
    bilder.push({ datei: e.datei, geschlecht: e.geschlecht, alter: e.alter, ton: e.ton, kopftuch: !!e.kopftuch, brille: !!e.brille, bart: !!e.bart, uniform: !!e.uniform, robe: !!e.robe });
  }
  return bilder.length ? { version: typeof d.version === "number" ? d.version : 1, bilder } : null;
}

/** Strafpunkte eines Eintrags für eine Anfrage; null = darf gar nicht gewählt werden. */
export function strafe(e: BildEintrag, a: BildAnfrage): number | null {
  if (e.geschlecht !== a.geschlecht) return null;
  if (e.kopftuch !== a.kopftuch) return null;
  if (e.uniform !== a.uniform) return null;
  if (e.robe !== a.robe) return null;
  let s = Math.abs(e.alter - altersgruppe(a.alter)) / 10;
  s += Math.abs(e.ton - a.ton) * 0.8;
  if (e.brille !== a.brille) s += 2;
  if (e.bart !== a.bart) s += 2;
  return s;
}

/** Die Strafgrenze: schlechter als das passt es nicht mehr, dann zeichnet das Spiel das Gesicht selbst. */
export const MAX_STRAFE = 4;

/** Deterministische Auswahl unter den besten Treffern; null, wenn nichts passt. */
export function waehleBild(m: Manifest | null, a: BildAnfrage): BildEintrag | null {
  if (!m || m.bilder.length === 0) return null;
  let best = Infinity;
  const treffer: { e: BildEintrag; s: number }[] = [];
  for (const e of m.bilder) {
    const s = strafe(e, a);
    if (s === null) continue;
    treffer.push({ e, s });
    if (s < best) best = s;
  }
  if (!treffer.length || best > MAX_STRAFE) return null;
  const gut = treffer.filter((t) => t.s <= best + 0.5).sort((x, y) => (x.e.datei < y.e.datei ? -1 : 1));
  return gut[hash(a.seed + "|bild") % gut.length]!.e;
}

// ---------------------------------------------------------------------------
// Laden (einmal) und Beobachten

let manifest: Manifest | null = null;
let geladen = false;
let laeuft = false;
const hoerer = new Set<() => void>();

function fertig(m: Manifest | null): void {
  manifest = m;
  geladen = true;
  laeuft = false;
  for (const f of [...hoerer]) f();
}

/** Lädt das Manifest einmal; bei Fehler, leerem Ordner oder ohne Browser bleibt es leer (Rückfall auf gezeichnete Gesichter). */
export function ladeManifest(): void {
  if (geladen || laeuft) return;
  if (typeof window === "undefined" || typeof fetch !== "function") {
    geladen = true;
    return;
  }
  laeuft = true;
  fetch(`${BILDER_ORDNER}portraits.json`, { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => fertig(bereinige(d)))
    .catch(() => fertig(null));
}

/** Für Tests und Werkzeuge: Manifest setzen (null = leer) oder zurücksetzen. */
export function setzeManifest(m: Manifest | null | "ungeladen"): void {
  if (m === "ungeladen") {
    manifest = null;
    geladen = false;
    laeuft = false;
  } else {
    manifest = m;
    geladen = true;
    laeuft = false;
  }
  for (const f of [...hoerer]) f();
}

export const aktuellesManifest = (): Manifest | null => manifest;

const abonniere = (f: () => void): (() => void) => {
  hoerer.add(f);
  ladeManifest();
  return () => hoerer.delete(f);
};

/** Das Manifest in React: lädt beim ersten Einsatz und zeichnet neu, sobald es da ist. */
export function useManifest(): Manifest | null {
  return useSyncExternalStore(abonniere, aktuellesManifest, aktuellesManifest);
}
