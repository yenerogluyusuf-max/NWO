// Speichern und Laden im Browser (localStorage). Der ganze Weltzustand ist reines JSON.
// Der Spielstand wird jeden Monat und bei jeder Entscheidung gesichert; „Fortsetzen“ liest ihn wieder ein.

import { load } from "../sim/world";
import type { World } from "../sim/types";

const KEY = "staatsraeson-spielstand-v1";

export interface SpielstandInfo {
  gespeichert: string;
  name: string;
  datum: string;
  zustimmung?: number;
}

export function speichere(world: World): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, gespeichert: new Date().toISOString(), welt: world }));
    return true;
  } catch {
    return false;
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
