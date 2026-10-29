// Kern des Wissensbaums ohne Abhängigkeit vom Reich: Zustand im Spielstand, Forschungstempo, Kostenfaktor und Ertrag der Werke.
// Gelesen vom Reich (Bautempo, Schulden), von der Güterbilanz (zusätzliche Produktion) und von den Streitkräften (Fertigungstempo).
// Die Ansicht und die Entscheidungen stehen in sim/wissensbaum.ts. Alle Zahlen: Spielparameter in data/wissensbaum.ts.

import { BAUM, LIZENZ, WERKE, WERK_VON, ZWEIG_VON, type Lizenzgeber, type Traeger, type ZweigId } from "../data/wissensbaum";
import type { GutId } from "../data/gueter";
import { bildungsUeberhang, forschungsRate, WISSEN } from "./wissensbasis";
import type { World } from "./types";

export interface WissensbaumZustand {
  v: 1;
  /** Gewählte Richtung der Forschung */
  schwerpunkt: ZweigId | null;
  /** Tag der letzten Wahl des Schwerpunkts */
  schwerpunktTag: number;
  /** Vorhaben → Lizenzgeber */
  lizenzen: Record<string, Lizenzgeber>;
  /** Werk → Träger und, beim ausländischen Träger, der Partner */
  traeger: Record<string, { art: Traeger; partner?: Lizenzgeber }>;
  /** Fertige Knoten, deren Durchbruch schon verbucht ist */
  verbucht: string[];
  /** Frische Durchbrüche für den Stempel in der Ansicht */
  durchbrueche: { id: string; tag: number }[];
  /** Partner, deren Sperre schon gemeldet ist */
  gemeldet: Lizenzgeber[];
  /** Was beim Anlegen schon stand: steckt in den Startwerten, zählt also nicht zusätzlich */
  start: string[];
  /** Werk → gewählter Standort (Kfz-Kennziffer) und das beim Beginn festgestellte Tempo des Standorts */
  standort?: Record<string, { plaka: number; tempo: number }>;
  /** Knoten mit ausgelöstem Heureka und der Tag (für den Stempel) */
  heureka?: { id: string; tag: number }[];
  /** Ob die Heureka-Bedingungen schon einmal geprüft sind (beim ersten Mal still) */
  heurekaGeprueft?: boolean;
}

/** Zustand des Wissensbaums; ältere Spielstände legen ihn beim ersten Zugriff an. Was zu Beginn schon steht, gilt als verbucht. */
export function baumZustand(w: World): WissensbaumZustand {
  const sp = w.spiel!;
  sp.wissensbaum ??= {
    v: 1,
    schwerpunkt: null,
    schwerpunktTag: -100_000,
    lizenzen: {},
    traeger: {},
    verbucht: Object.keys(sp.reich?.bestand ?? {}).filter((id) => ZWEIG_VON[id]),
    durchbrueche: [],
    gemeldet: [],
    start: Object.keys(sp.reich?.bestand ?? {}),
  };
  const z = sp.wissensbaum;
  z.lizenzen ??= {};
  z.traeger ??= {};
  z.verbucht ??= [];
  z.durchbrueche ??= [];
  z.gemeldet ??= [];
  z.start ??= Object.keys(sp.reich?.bestand ?? {});
  z.standort ??= {};
  z.heureka ??= [];
  return z;
}

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

// Ob ein Partner sperrt, rechnet sim/wissensbaum.ts (Krieg, Sanktion, Vertrauen) und meldet die Prüfung hier an:
// So zieht der Kern, den das Reich früh lädt, Außenpolitik und Krieg nicht in die Ladereihenfolge.
let sperrQuelle: ((w: World, p: Lizenzgeber) => boolean) | null = null;
export const setzeSperrQuelle = (f: ((w: World, p: Lizenzgeber) => boolean) | null): void => {
  sperrQuelle = f;
};

/** Sperrt der Partner gerade Lieferungen und Updates (Krieg, Sanktion gegen die Türkei, Vertrauen zu tief)? */
export function partnerGesperrt(w: World, p: Lizenzgeber): boolean {
  if (!w.spiel || !sperrQuelle) return false;
  return sperrQuelle(w, p);
}

/** Die Bestandteile des Forschungstempos, für die Anzeige. */
export interface TempoTeile {
  /** aus Forschungsetat und Innovationsgrenze */
  forschung: number;
  /** Abwanderung der Fachkräfte */
  abwanderung: number;
  /** Schwerpunkt des Zweigs */
  schwerpunkt: number;
  /** Lizenz oder Sperre des Lizenzgebers */
  lizenz: number;
  /** Träger des Werks */
  traeger: number;
  /** Standort des Werks (Fachkräfte und Netze vor Ort) */
  standort: number;
  /** Heureka: Verwandtes ist schon gekonnt */
  heureka: number;
  /** Fokusbaum (sim/fokus.ts): Foki der Agenda, die Forschung allgemein oder diesen Knoten tragen */
  fokus: number;
  gesamt: number;
}

/** Das allgemeine Tempo des Landes (ohne Zweig und Lizenz): 1 = Stand 2026. */
export function landesTempo(w: World): { forschung: number; abwanderung: number } {
  if (!w.spiel) return { forschung: 1, abwanderung: 1 };
  let rate = 1;
  let ueberhang = 0;
  try {
    rate = forschungsRate(w);
    ueberhang = bildungsUeberhang(w);
  } catch {
    /* ohne Haushalt (Werkzeuge): Stand 2026 */
  }
  const forschung = clamp(BAUM.tempoBasis + BAUM.tempoGewicht * rate, BAUM.tempoMin, BAUM.tempoMax);
  const abwanderung = clamp(1 - BAUM.abwanderungJeProzent * Math.max(0, ueberhang - WISSEN.abwanderungSchwelle), BAUM.abwanderungMin, 1);
  return { forschung, abwanderung };
}

/** Tempo eines Knotens im Baum (Vorhaben außerhalb des Baums: 1). Multipliziert die monatliche Bauleistung im Reich. */
export function tempoTeile(w: World, id: string): TempoTeile | null {
  const zweig = ZWEIG_VON[id];
  if (!zweig || !w.spiel) return null;
  const z = baumZustand(w);
  const land = landesTempo(w);
  const schwerpunkt = z.schwerpunkt === null ? 1 : z.schwerpunkt === zweig ? BAUM.schwerpunktTempo : BAUM.andereTempo;
  const lg = z.lizenzen[id];
  const lizenz = lg ? (partnerGesperrt(w, lg) ? BAUM.gesperrtTempo : BAUM.lizenzTempo) : 1;
  const tr = z.traeger[id];
  const traeger = tr ? (tr.art === "ausland" && tr.partner && partnerGesperrt(w, tr.partner) ? BAUM.gesperrtTempo : BAUM.traeger[tr.art].tempo) : 1;
  const standort = z.standort?.[id]?.tempo ?? 1;
  const heureka = z.heureka?.some((h) => h.id === id) ? BAUM.heurekaTempo : 1;
  // Fokusbaum: Modifikatoren statt Import (sim/fokus.ts schreibt sie beim Abschluss eines Fokus)
  const mod = w.spiel.modifikatoren ?? {};
  const fokus = (1 + (mod["fokus:forschung"] ?? 0)) * (mod[`fokus:wissen:${id}`] ?? 1);
  const gesamt = land.forschung * land.abwanderung * schwerpunkt * lizenz * traeger * standort * heureka * fokus;
  return { forschung: land.forschung, abwanderung: land.abwanderung, schwerpunkt, lizenz, traeger, standort, heureka, fokus, gesamt };
}

export function forschungsTempo(w: World, id: string): number {
  return tempoTeile(w, id)?.gesamt ?? 1;
}

/** Faktor auf die Schulden eines Vorhabens: Lizenzgebühren erhöhen, Firmen und Partner tragen einen Teil. */
export function kostenFaktor(w: World, id: string): number {
  if (!ZWEIG_VON[id] || !w.spiel?.wissensbaum) return 1;
  const z = w.spiel.wissensbaum;
  const lizenz = z.lizenzen[id] ? BAUM.lizenzSchulden : 1;
  const tr = z.traeger[id];
  return lizenz * (tr ? BAUM.traeger[tr.art].schulden : 1);
}

/** Ertrag eines fertigen Werks (0 bis etwa 1): Zustand des Bestands, gedrückt, wenn Lizenzgeber oder Partner sperrt. */
export function werkErtrag(w: World, id: string): number {
  const b = w.spiel?.reich?.bestand[id];
  if (!b) return 0;
  const z = w.spiel!.wissensbaum;
  let f = Math.min(1, b.zustand / 90);
  const lg = z?.lizenzen[id];
  if (lg && partnerGesperrt(w, lg)) f *= BAUM.gesperrtErtrag;
  const tr = z?.traeger[id];
  if (tr?.art === "ausland" && tr.partner && partnerGesperrt(w, tr.partner)) f *= BAUM.gesperrtErtrag;
  return f;
}

/** Zusätzliche Produktion einer Warengruppe aus fertigen Werken, als Anteil der Ausgangsproduktion (0 = keine Werke). */
export function werkZusatz(w: World, gut: GutId): number {
  if (!w.spiel?.reich) return 0;
  const start = baumZustand(w).start;
  let s = 0;
  // Werke, die schon zu Beginn standen, stecken in den Startwerten; nur neu gebaute zählen zusätzlich
  for (const d of WERKE) if (d.gut?.id === gut && w.spiel.reich.bestand[d.id] && !start.includes(d.id)) s += d.gut.anteil * werkErtrag(w, d.id);
  return s;
}

/** Standort eines Werks (Kfz-Kennziffer): der gewählte, sonst der erste aus den Daten; `undefined` ohne Werk. Liest nur. */
export function standortVon(w: World, id: string): number | undefined {
  const d = WERK_VON[id];
  if (!d) return undefined;
  return w.spiel?.wissensbaum?.standort?.[id]?.plaka ?? d.standorte[0]?.plaka;
}

/** Lizenzgeber, die für einen Knoten in Frage kommen. */
export function lizenzgeber(id: string): Lizenzgeber[] {
  return LIZENZ[id] ?? [];
}
