import { bucheFinanzsaldo } from "./staatsgeld";
// Gemeinsame Typen und Hilfen aller Ereignisvorlagen (Vorlagen liegen in ereignisse*.ts).

import { festeZusage } from "./zusagenfolgen";
import { NET } from "./modell";
import { PROVINCES, nationalAverage } from "./netz";
import { PROVINZEN } from "./regional";
import { wirke } from "./wirkung";
import type { Rng } from "./rng";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";
import type { Msg } from "../i18n";
import { aktuelleLocale, zahl } from "../i18n";

export type SzenenName = "istanbul" | "parlament" | "bank" | "anatolien" | "wahlnacht";

/**
 * Die zuständige Stelle, an der der Spieler selbst handeln kann (Vorgabe „Voraussetzungen verlinken“, 06.10.2026): Jede Antwort eines
 * Bereichsvorgangs nennt sie, das Ereignisfenster führt mit einem Klick dorthin, ohne den Vorgang zu entscheiden.
 */
export type Stelle =
  | { art: "medien"; cluster?: string }
  | { art: "zentralbank"; abschnitt?: "sitzung" | "gouverneur" | "stufe" | "devisen" }
  | { art: "staette"; id: string }
  /** Welle E1: die Außenakte, auf ein Land (mit Reiter), einen Block oder die Vermittlung gestellt */
  | { art: "welt"; land?: string; tab?: "beitritt" | "verhandeln" | "handeln"; block?: string; vermittlung?: true };

export interface Option {
  id: string;
  label: string;
  /** Preis und Risiko in Worten */
  beschreibung: string;
  /** Politisches Kapital, das der Ereignismotor abbucht */
  pk: number;
  /** Was die Oberfläche als Preis zeigt, wenn der Preis erst später anfällt (etwa der Preis eines Gesetzes) */
  anzeigePk?: number;
  /** Inhaltliches Hindernis: sichtbar erklären und vor Ausführung erneut prüfen. */
  sperre?: string;
  /** Konkrete Bedingungen und Risiken zusätzlich zu Preis und Kurzbeschreibung. */
  bedingungen?: string[];
  warnung?: string;
  /** Bereits mit der echten Handlung auf einer Kopie berechnete Sofortfolgen. */
  sofortfolgen?: string[];
  aufmerksamkeit?: number;
  /** Wo man dasselbe selbst in der Hand hat (Medienakte, Zentralbank, Kulturstätte) */
  stelle?: Stelle;
  /** Führt aus und liefert den Ausgang als Satz für Protokoll und Chronik */
  wirkung: (w: World, ev: OffenesEreignis, rng: Rng) => string;
}

export interface Vorlage {
  id: string;
  szene: SzenenName;
  titel: (w: World, ev: OffenesEreignis) => string;
  text: (w: World, ev: OffenesEreignis) => string[];
  warum: (w: World, ev: OffenesEreignis) => string;
  optionen: (w: World, ev: OffenesEreignis) => Option[];
  /** Folge ohne Entscheidung */
  standard: (w: World, ev: OffenesEreignis, rng: Rng) => string;
  /** Erste Wirkung beim Eintreten */
  eroeffne?: (w: World, ev: OffenesEreignis, rng: Rng) => void;
  frist: number;
  abkuehlung: number;
  /** Maßnahmen, mit denen man die Ursache selbst regeln kann; wer eine davon einbringt, hat das Ereignis in die Hand genommen */
  massnahmen?: string[];
  /** Die zuständige Stelle des Vorgangs: Das Ereignisfenster führt dorthin statt in die Akte des Themas */
  stelle?: (w: World, ev: OffenesEreignis) => Stelle;
  /**
   * ZEI-1 (Ereignis-Wettbewerb): Was geschieht, wenn der ausgelöste Vorgang im Monatswettbewerb keinen
   * Präsentations-Slot bekommt. „aussitzen“: Er tritt im Hintergrund ein und läuft ohne Antwort schlecht aus
   * (Standardfolge; für akute Einzelfälle und verfallende Angebote). „eskalieren“ (Standard): Er gärt weiter
   * und kommt dringlicher zurück (für schwelende Konflikte).
   */
  wettbewerb?: "aussitzen" | "eskalieren";
  /** ZEI-1: Schwere der Standardfolge für die Dringlichkeit im Wettbewerb (1 = normal, höher = schlimmer). */
  schwere?: number;
  /**
   * Fester Kalendertag (1 bis 28), an dem der Vorgang öffnet, wenn er im Monat ausgelöst wurde (Saisonereignisse, Gedenktage).
   * Fehlt er, würfelt der Takt (sim/ereignisse.ts, `plane`) den Eröffnungstag, damit nicht alles am Monatsersten kommt.
   */
  tag?: number;
  /**
   * Folgehaken: Was aus der gewählten Antwort später als eigenes Ereignis zurückkommt. Das Ereignis `vorlage` öffnet nach
   * `nach[0]` bis `nach[1]` Tagen (deterministisch gewürfelt), wenn die Bedingung dann noch gilt (sim/ereignisse.ts, `folgenTag`).
   */
  folgen?: Record<string, { vorlage: string; nach: [number, number]; bedingung?: (w: World) => boolean }>;
  /** Wahrscheinlichkeit pro Monat, 0 = nicht möglich */
  chance: (w: World) => number;
  /**
   * Eigener Wurf (Welle H3): Der Monatswürfel nimmt für diese Vorlage keine Zahl aus dem Zufallsstrom der Partie, sondern einen festen Wert
   * aus Samen, Vorlage und Tag. So verschiebt eine neue Vorlage den Strom der übrigen nie, auch nicht, wenn ihre Bedingung in zwei
   * verglichenen Partien verschieden ausfällt (Vorschau gegen echte Rechnung). Ältere Vorlagen ziehen weiter aus dem Strom.
   */
  eigenerWurf?: true;
  /**
   * Kein Zusatzplatz (Entscheidung des Koordinators, Welle H3): Der Vorgang konkurriert im Monatswettbewerb um dieselben Plätze, schafft aber
   * keinen eigenen. Im Monat stehen höchstens so viele Plätze offen, wie andere Vorgänge ihn beanspruchen; gewinnt er, verdrängt er den
   * schwächsten von ihnen. Ist er allein, gärt er weiter (Haken in der Chronik) und kommt mit höherer Dringlichkeit zurück.
   */
  ohneZusatzplatz?: true;
  erzeuge: (w: World, rng: Rng) => { provinzen: number[]; staerke: number; daten?: Record<string, number | string> } | null;
}


// ---------------------------------------------------------------------------
// Hilfen

/** Zahl mit festen Nachkommastellen in der Sprache des Spiels (Befund I-9: nie fest deutsch). Minus null erscheint als Null. */
export const nf = (x: number, d = 1) => zahl(Math.abs(x) < 0.5 * 10 ** -d ? 0 : x, d);
export const monatVon = (w: World) => Number(w.date.slice(5, 7));
export const sommer = (w: World) => monatVon(w) >= 6 && monatVon(w) <= 9;

export function namen(provinzen: number[]): string {
  const n = provinzen.map((p) => PROVINZEN[p - 1]?.name ?? String(p));
  if (n.length === 1) return n[0]!;
  return `${n.slice(0, -1).join(", ")} und ${n[n.length - 1]}`;
}

export function einwohner(provinzen: number[]): number {
  return provinzen.reduce((s, p) => s + (PROVINZEN[p - 1]?.bevoelkerung ?? 0), 0);
}

export function ziehe(rng: Rng, gewicht: (plaka: number) => number, n: number): number[] {
  const g = Array.from({ length: PROVINCES }, (_, p) => Math.max(0, gewicht(p + 1)));
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    const summe = g.reduce((a, b) => a + b, 0);
    if (summe <= 0) break;
    let r = rng.next() * summe;
    for (let p = 0; p < PROVINCES; p++) {
      r -= g[p]!;
      if (r <= 0) {
        out.push(p + 1);
        g[p] = 0;
        break;
      }
    }
  }
  return out;
}

export const akutIn = (w: World, id: string): number[] => {
  const i = NET.index.get(id);
  const node = i === undefined ? undefined : NET.nodes[i];
  if (i === undefined || !node?.threshold) return [];
  const out: number[] = [];
  for (let p = 0; p < PROVINCES; p++) if (w.net.values[i * PROVINCES + p]! >= node.threshold) out.push(p + 1);
  return out;
};

/** Einmalige Kosten in % des BIP: nutzen Kasse, dann Kredit und stützen kurz die Nachfrage. */
export function kosten(w: World, prozentBip: number): void {
  bucheFinanzsaldo(w.economy, prozentBip);
  w.economy.outputGap += 0.08 * prozentBip;
}

export const dk = (ev: OffenesEreignis, k: string): number => Number(ev.daten?.[k] ?? 0);

export function opt(id: string, label: string, beschreibung: string, pk: number, wirkung: Option["wirkung"]): Option {
  return { id, label, beschreibung, pk, wirkung };
}


export const PROZ_STADT = new Set([34, 6, 35, 16, 1, 27, 42, 7, 33, 21]);

export const jahrVon = (w: World): number => Number(w.date.slice(0, 4));

/** Landesdurchschnitt eines Knotens. */
export const netz = (w: World, id: string): number => nationalAverage(NET, w.net, id);

/**
 * Beschreibung einer Antwort: nur die Folge in Worten. Den Preis (Kapital und Anteil am BIP) zeigt das Ereignisfenster auf der
 * Plakette, gemessen auf einer Kopie der Welt mit derselben Buchung wie bei der echten Antwort (sim/ereignisse.ts, `preisVorschau`).
 * Befund A-4/A-7/A-43 (5. November 2026): Von Hand geschriebene Preise wichen von der Buchung ab und standen dreifach in der Karte.
 * `pk` und `bipProzent` bleiben in der Unterschrift, damit die Vorlagen ihre Zahlen weiter an einer Stelle nennen.
 */
export function beschr(_pk: number, _bipProzent: number, folge: string): string {
  return satzAnfang(folge);
}

/** Erster Buchstabe groß, nach den Regeln der Sprache (im Türkischen i → İ). */
export function satzAnfang(s: string): string {
  const x = s.trimStart();
  return x ? x[0]!.toLocaleUpperCase(aktuelleLocale()) + x.slice(1) : x;
}

/** Eine Zusage, die später fällig wird und dann als Ereignis eingefordert wird. */
export function zusageAnlegen(w: World, z: { von: string; text: string; tage: number; massnahme?: string; msg?: Msg }): void {
  w.spiel?.zusagen.push(festeZusage(w, {
    id: `z-${z.von}-${w.day}-${w.spiel.zusagen.length}`,
    von: z.von,
    text: z.text,
    ...(z.msg ? { msg: z.msg } : {}),
    faellig: w.day + z.tage,
    ...(z.massnahme ? { massnahme: z.massnahme, richtung: 1 } : {}),
    erfuellt: false,
    gebrochen: false,
  }));
}
