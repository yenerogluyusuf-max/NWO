// Einstellungen und Verbrauchszähler des Sprachmodells. Alles bleibt im Browser dieses Rechners (localStorage).

import { STANDARD_KONFIG, type KiKonfig } from "./typen";

const SCHLUESSEL = "staatsraeson.ki.konfig";
const ZAEHLER = "staatsraeson.ki.zaehler";

export interface KiZaehler {
  aufrufe: number;
  tokensEin: number;
  tokensAus: number;
}

function lies<T>(key: string): T | null {
  try {
    const roh = localStorage.getItem(key);
    return roh ? (JSON.parse(roh) as T) : null;
  } catch {
    return null;
  }
}

function schreibe(key: string, wert: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(wert));
  } catch {
    /* ohne Speicher läuft das Spiel weiter, die Einstellung gilt dann nur bis zum Neuladen */
  }
}

/** Liest die gespeicherte Konfiguration, auch die ältere Form mit einem einzigen Claude-Schlüssel und einem lokalen Modell. */
export function konfigAusRoh(roh: unknown): KiKonfig {
  const r = (roh && typeof roh === "object" ? roh : {}) as Record<string, unknown>;
  const k: KiKonfig = { ...STANDARD_KONFIG, schluessel: {}, modell: {} };
  const text = (x: unknown) => (typeof x === "string" ? x : "");
  if (typeof r.art === "string") k.art = r.art === "proxy" ? "auto" : r.art;
  if (r.schluessel && typeof r.schluessel === "object") for (const [id, v] of Object.entries(r.schluessel as Record<string, unknown>)) k.schluessel[id] = text(v);
  else if (typeof r.schluessel === "string" && r.schluessel) k.schluessel.anthropic = r.schluessel;
  if (r.modell && typeof r.modell === "object") for (const [id, v] of Object.entries(r.modell as Record<string, unknown>)) k.modell[id] = text(v);
  else if (typeof r.modell === "string" && r.modell) k.modell.anthropic = r.modell;
  if (typeof r.lokalModell === "string" && r.lokalModell) k.modell.lokal ??= r.lokalModell;
  if (typeof r.eigenUrl === "string") k.eigenUrl = r.eigenUrl;
  if (typeof r.lokalUrl === "string" && r.lokalUrl) k.lokalUrl = r.lokalUrl;
  if (typeof r.maxAufrufe === "number" && r.maxAufrufe >= 1) k.maxAufrufe = Math.min(2000, Math.round(r.maxAufrufe));
  return k;
}

export function ladeKonfig(): KiKonfig {
  return konfigAusRoh(lies<unknown>(SCHLUESSEL));
}

export function speichereKonfig(k: KiKonfig): void {
  schreibe(SCHLUESSEL, k);
}

export function ladeZaehler(): KiZaehler {
  // Der Zähler gilt je Browser-Sitzung, damit ein neuer Tag mit frischem Budget beginnt
  try {
    const roh = sessionStorage.getItem(ZAEHLER);
    if (roh) return JSON.parse(roh) as KiZaehler;
  } catch {
    /* ignorieren */
  }
  return { aufrufe: 0, tokensEin: 0, tokensAus: 0 };
}

export function zaehle(z: KiZaehler, ein: number, aus: number): KiZaehler {
  const neu = { aufrufe: z.aufrufe + 1, tokensEin: z.tokensEin + ein, tokensAus: z.tokensAus + aus };
  try {
    sessionStorage.setItem(ZAEHLER, JSON.stringify(neu));
  } catch {
    /* ignorieren */
  }
  return neu;
}
