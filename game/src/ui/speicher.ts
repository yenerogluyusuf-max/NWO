// Speichern und Laden im Browser (localStorage). Der ganze Weltzustand ist reines JSON.
// Der Spielstand wird jeden Monat und bei jeder Entscheidung gesichert; „Fortsetzen“ liest ihn wieder ein.
//
// Sitzungs-Snapshot (für das „Stand der Dinge“-Blatt beim Laden): Jeder Spielstand trägt `vorsitzung` —
// die drei Kennzahlen zu Beginn der laufenden Sitzung. Autospeichern schreibt die Welt neu, führt die
// Vergleichsbasis aber unverändert weiter; erst `sitzungBegonnen` (beim Laden/Fortsetzen) setzt sie auf
// den eben geladenen Stand. Alte Spielstände ohne `vorsitzung` liefern „keine Vergleichsdaten“, der nächste
// Speicherlauf legt die Basis an — rückwärtskompatibel.

import { load } from "../sim/world";
import type { World } from "../sim/types";

const KEY = "staatsraeson-spielstand-v1";

/** Die drei Kennzahlen, deren Delta das Re-Entry-Blatt zeigt, plus Stand, zu dem sie gehören. */
export interface KennzahlenSnapshot {
  tag: number;
  datum: string;
  zustimmung: number;
  inflation: number;
  kapital: number;
}

interface SpielstandDatei {
  version: number;
  gespeichert: string;
  welt: World;
  vorsitzung?: KennzahlenSnapshot;
}

export function snapshotVon(world: World): KennzahlenSnapshot {
  return {
    tag: world.day,
    datum: world.date,
    zustimmung: world.spiel?.umfrage.zustimmung ?? 0,
    inflation: world.published.inflation.value,
    kapital: world.spiel?.kapital ?? 0,
  };
}

export interface SpielstandInfo {
  gespeichert: string;
  name: string;
  datum: string;
  zustimmung?: number;
}

export function speichere(world: World): boolean {
  try {
    // Die Vergleichsbasis der Sitzung überlebt jedes Autospeichern; fehlt sie (alte Stände), beginnt sie jetzt.
    let vorsitzung: KennzahlenSnapshot | undefined;
    const raw = localStorage.getItem(KEY);
    if (raw) vorsitzung = (JSON.parse(raw) as SpielstandDatei).vorsitzung;
    const datei: SpielstandDatei = { version: 1, gespeichert: new Date().toISOString(), welt: world, vorsitzung: vorsitzung ?? snapshotVon(world) };
    localStorage.setItem(KEY, JSON.stringify(datei));
    return true;
  } catch {
    return false;
  }
}

/** Vergleichsbasis aus der vorigen Sitzung; fehlt sie (alte Spielstände), gibt es „keine Vergleichsdaten“. */
export function vorsitzungSnapshot(): KennzahlenSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as SpielstandDatei).vorsitzung ?? null;
  } catch {
    return null;
  }
}

/** Markiert den Sitzungsbeginn: Der geladene Stand wird zur Vergleichsbasis der nächsten Sitzung. */
export function sitzungBegonnen(world: World): void {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const datei = JSON.parse(raw) as SpielstandDatei;
    datei.vorsitzung = snapshotVon(world);
    localStorage.setItem(KEY, JSON.stringify(datei));
  } catch {
    /* ohne Speicher spielt es sich trotzdem */
  }
}

export function spielstandInfo(): SpielstandInfo | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as { gespeichert: string; welt: World };
    if (d.welt.spiel?.ende) return null;
    return {
      gespeichert: d.gespeichert,
      name: d.welt.player?.name ?? "Präsident",
      datum: d.welt.date,
      ...(d.welt.spiel ? { zustimmung: d.welt.spiel.umfrage.zustimmung } : {}),
    };
  } catch {
    return null;
  }
}

export function ladeSpielstand(): World | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return load(JSON.stringify((JSON.parse(raw) as { welt: World }).welt));
  } catch {
    return null;
  }
}

export function loescheSpielstand(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ohne Speicher spielt es sich trotzdem */
  }
}
