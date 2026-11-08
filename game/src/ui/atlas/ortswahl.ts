// Ortswahl auf der großen Karte (karte.md K1 und K8, Welle 3 K6). Erst die Handlung, dann der Ort (Vorbild Victoria 3: „pick an action,
// then pick a target“): Eine Akte stellt eine Anfrage, die Akte tritt zum Seitenfenster zurück, und die Karte wird frei. Jeder Ort trägt
// eine Bewertung, die seine Farbe bestimmt (nicht eine Rohzahl): gut, möglich, schon erfüllt, gesperrt. Ein Klick wählt oder streicht
// einen Ort, das Seitenfenster zeigt Auswahl, Kennzahlen und Preis, „Übernehmen“ gibt die Auswahl an den Aufrufer zurück, Esc bricht ab.
//
// Ziele sind allgemein: `p:34` (Provinz nach Kfz-Kennziffer), `r:syr_asas` (Region eines Kriegsschauplatzes, data/schauplatz-flaechen.json),
// `l:SYR` (Land). Reine Logik ohne Oberfläche, damit sie sich ohne Browser prüfen lässt.

import { createContext } from "react";

export type Bewertung = "gut" | "moeglich" | "erfuellt" | "gesperrt";
export type OrtArt = "p" | "r" | "l";

export interface OrtBewertung {
  bewertung: Bewertung;
  /** Ein kurzer Satz, warum (im Zeiger und im Seitenfenster) */
  grund?: string;
}

/** Eine Kennzahl im Seitenfenster (große Zahl, kleines Etikett; ENTSCHEIDUNGEN Z) */
export interface OrtKennzahl {
  etikett: string;
  wert: string;
  klein?: string;
}

/** Was das Seitenfenster zur aktuellen Auswahl zeigt; alles aus denselben Zahlen, die `uebernehmen` bucht (keine Schau). */
export interface OrtswahlVorschau {
  kennzahlen: OrtKennzahl[];
  /** Eine Zeile je gewähltem Ort (Name und kurze Zahlen) */
  zeilen: { ziel: string; name: string; zahlen: string }[];
  /** Ein kurzer Satz unter den Kennzahlen (etwa, welchem festen Zielraum die Auswahl entspricht) */
  hinweis?: string;
  /** Was das Übernehmen kostet, in Worten mit Zahlen; leer = kostenlos */
  preis: string;
  /** Darf übernommen werden, und wenn nicht, warum */
  ok: boolean;
  grund?: string;
}

export interface OrtswahlAnfrage {
  /** Kennung, etwa „kriegsziel:kv-SYR-1234“ */
  id: string;
  /** Kopf des Seitenfensters, etwa „Kriegsziel · Syrien“ */
  titel: string;
  /** Die eine Frage, etwa „Welche Regionen soll die Operation nehmen?“ */
  frage: string;
  /** Alle Orte, die auf der Karte wählbar erscheinen */
  ziele: string[];
  /** Vorwahl beim Öffnen */
  start: string[];
  /** Bewertung jedes Ziels für die aktuelle Auswahl (sie kann von der Auswahl abhängen, etwa beim Zusammenhang eines Zielraums) */
  bewerte: (auswahl: readonly string[]) => Record<string, OrtBewertung>;
  /** Nach jedem Klick: Auswahl bereinigen (etwa abgehängte Regionen streichen); ohne Angabe bleibt sie, wie sie ist */
  bereinige?: (auswahl: readonly string[]) => string[];
  vorschau: (auswahl: readonly string[]) => OrtswahlVorschau;
  /** Übernimmt die Auswahl; das Ergebnis erscheint als Meldung */
  uebernehmen: (auswahl: readonly string[]) => { ok: boolean; text: string };
  /** Wohin die Kamera beim Öffnen fliegt (Länge, Breite, Abstand) */
  kamera?: { lon: number; lat: number; d: number };
  /** Text des Übernehmen-Knopfs */
  knopf?: string;
}

export interface OrtswahlZustand {
  anfrage: OrtswahlAnfrage;
  auswahl: string[];
}

/** Zerlegt ein Ziel in Art und Kennung (`p:34` → p, 34). */
export function zielTeile(ziel: string): { art: OrtArt; id: string } | undefined {
  const m = /^([prl]):(.+)$/.exec(ziel);
  return m ? { art: m[1] as OrtArt, id: m[2]! } : undefined;
}

/** Ob ein Ort angeklickt werden darf: gesperrte und schon erfüllte nicht; eine gewählte Region lässt sich immer streichen. */
export function klickbar(b: OrtBewertung | undefined, gewaehlt: boolean): boolean {
  if (gewaehlt) return true;
  return !!b && (b.bewertung === "gut" || b.bewertung === "moeglich");
}

/** Ein Klick: wählt oder streicht den Ort und bereinigt danach die Auswahl. Unbekannte, gesperrte und erfüllte Orte ändern nichts. */
export function umschalten(anfrage: OrtswahlAnfrage, auswahl: readonly string[], ziel: string): string[] {
  if (!anfrage.ziele.includes(ziel)) return [...auswahl];
  const drin = auswahl.includes(ziel);
  if (!klickbar(anfrage.bewerte(auswahl)[ziel], drin)) return [...auswahl];
  const neu = drin ? auswahl.filter((z) => z !== ziel) : [...auswahl, ziel];
  return anfrage.bereinige ? anfrage.bereinige(neu) : neu;
}

/**
 * Farben der Bewertung auf der Karte (Spielparameter der Darstellung). Gewählt ist Siegelrot, gut kräftiges Messing, möglich helles Messing,
 * erfüllt die Farbe der Türkei auf der Karte (NATION_COLOR in overlay.ts), gesperrt blass. Füllung und Rand je als [r, g, b, a].
 */
export const BEWERTUNG_FARBE: Record<Bewertung | "gewaehlt", { fuell: [number, number, number, number]; rand: [number, number, number, number]; strich: number }> = {
  gewaehlt: { fuell: [142, 42, 34, 0.5], rand: [110, 26, 20, 0.95], strich: 2.4 },
  gut: { fuell: [214, 168, 72, 0.32], rand: [138, 100, 32, 0.95], strich: 1.8 },
  moeglich: { fuell: [236, 214, 160, 0.26], rand: [138, 100, 32, 0.7], strich: 1.3 },
  erfuellt: { fuell: [168, 96, 74, 0.5], rand: [120, 60, 44, 0.75], strich: 1.2 },
  gesperrt: { fuell: [90, 84, 76, 0.18], rand: [90, 84, 76, 0.35], strich: 0.9 },
};

export const rgba = (c: readonly [number, number, number, number], a = c[3]): string => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a.toFixed(3)})`;

/** Wie die Karte einen Ort zeichnet: gewählt geht der Bewertung vor. */
export function ortStil(b: OrtBewertung | undefined, gewaehlt: boolean): Bewertung | "gewaehlt" {
  if (gewaehlt) return "gewaehlt";
  return b?.bewertung ?? "gesperrt";
}

/** Startet eine Ortswahl aus einer Akte (Stage stellt den Wert bereit; ohne Stage, etwa in Tests, gibt es keinen Knopf). */
export const OrtswahlStart = createContext<((a: OrtswahlAnfrage) => void) | null>(null);

/** Breite des Seitenfensters in Pixeln (Spielparameter; karte.md K1: wie die Provinzkarte, 330 bis 420 px). */
export const SEITENFENSTER_BREITE = 372;
