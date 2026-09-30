// Abstimmungen erkennen und aufbereiten: Die Simulation schreibt jede Abstimmung als Protokollzeile („Das Parlament nimmt … an (326 zu 274)“).
// Diese Zeile ist die Quelle; test/parlament.test.ts prüft, dass das Format hier noch gelesen wird.

import type { LogEntry, World } from "../../sim/types";
import { duldung, SACHSTIMMEN_QUOTE, sachstimmen } from "../../sim/fraktionen";
import { gesetzRichtung } from "../../sim/handeln";
import { parlamentsLage, type Parlamentslage } from "./lage";
import { streuwert } from "./geometrie";
import { stimmzettel, verteileErgebnis } from "./stimmen";

export interface Abstimmung {
  name: string;
  ja: number;
  nein: number;
  angenommen: boolean;
  tag: number;
  datum: string;
  /** „im ganzen Land“ oder die betroffenen Provinzen, wie im Protokoll */
  ort: string;
  stufe?: number;
}

const ANGENOMMEN = /^Das Parlament nimmt „(.+?)“ (.*?) ?an \((\d+) zu (\d+)\)\.(?: Stufe (\d+)\.)?/;
const ABGELEHNT = /^Das Parlament lehnt „(.+?)“ ab \((\d+) zu (\d+)\)/;

export function istAbstimmung(text: string): boolean {
  return text.startsWith("Das Parlament nimmt „") || text.startsWith("Das Parlament lehnt „");
}

export function leseAbstimmung(l: Pick<LogEntry, "text" | "day" | "date">): Abstimmung | null {
  const a = ANGENOMMEN.exec(l.text);
  if (a) return { name: a[1]!, ort: a[2]!, ja: Number(a[3]), nein: Number(a[4]), angenommen: true, tag: l.day, datum: l.date, ...(a[5] ? { stufe: Number(a[5]) } : {}) };
  const b = ABGELEHNT.exec(l.text);
  if (b) return { name: b[1]!, ort: "", ja: Number(b[2]), nein: Number(b[3]), angenommen: false, tag: l.day, datum: l.date };
  return null;
}

/** Die letzten Abstimmungen, die neueste zuerst. */
export function letzteAbstimmungen(world: World, n = 6): Abstimmung[] {
  const out: Abstimmung[] = [];
  for (let i = world.log.length - 1; i >= 0 && out.length < n; i--) {
    const l = world.log[i]!;
    if (l.kind !== "entscheidung") continue;
    const a = leseAbstimmung(l);
    if (a) out.push(a);
  }
  return out;
}

/** Merkt sich für jedes Gesetz vor der Abstimmung, welche Fraktionen aus Sachgründen mitstimmen: Nach der Abstimmung ist das Gesetz nicht mehr da. */
export function merkeGesetze(world: World, speicher: Map<string, string[]>): void {
  for (const g of world.spiel?.gesetze ?? []) speicher.set(g.name, sachstimmen(world, g.massnahme, gesetzRichtung(world, g)).parteien);
}

export interface Verlauf {
  lage: Parlamentslage;
  /** Ja oder Nein je Sitz von links */
  votum: boolean[];
  /** Ja-Stimmen bis einschließlich Sitz i */
  jaKum: number[];
  jaJe: Record<string, number>;
}

/** Stimmzettel für eine Abstimmung: Die Summe der Ja-Stimmen ist genau das Ergebnis der Simulation. */
export function baueVerlauf(world: World, ab: Abstimmung, sachParteien: string[] = []): Verlauf | null {
  const lage = parlamentsLage(world);
  if (!lage) return null;
  const dul = duldung(world);
  const sachJa = lage.fraktionen.filter((f) => sachParteien.includes(f.partei)).reduce((s, f) => s + Math.round(f.sitze * SACHSTIMMEN_QUOTE), 0);
  const jaJe = verteileErgebnis(lage, ab.ja, dul.ja, sachJa, sachParteien);
  const votum = stimmzettel(lage, jaJe, streuwert(`${ab.name}|${ab.tag}|${ab.ja}`));
  const jaKum: number[] = [];
  let z = 0;
  for (const v of votum) {
    if (v) z++;
    jaKum.push(z);
  }
  return { lage, votum, jaKum, jaJe };
}

// ---------------------------------------------------------------------------
// Wiederholen: Die Oberfläche kann jede frühere Abstimmung erneut abspielen (Knopf im Parlament).

type Hoerer = (ab: Abstimmung, sach: string[]) => void;
const hoerer = new Set<Hoerer>();

export function amAbstimmungBeobachten(h: Hoerer): () => void {
  hoerer.add(h);
  return () => hoerer.delete(h);
}

export function spieleAbstimmungAb(ab: Abstimmung, sach: string[] = []): void {
  for (const h of hoerer) h(ab, sach);
}
