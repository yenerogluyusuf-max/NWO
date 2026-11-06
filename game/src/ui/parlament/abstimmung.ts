// Abstimmungen erkennen und aufbereiten: Die Simulation schreibt jede Abstimmung als Protokollzeile mit dem Feld `abstimmung`
// (seit 5. November 2026; der Text ist übersetzt). Ältere Spielstände haben nur den deutschen Text („Das Parlament nimmt … an (326 zu 274)“);
// test/parlament.test.ts prüft, dass beides gelesen wird.

import type { LogEntry, World } from "../../sim/types";
import { duldung, SACHSTIMMEN_QUOTE, sachstimmen, PARTEI_NAME } from "../../sim/fraktionen";
import { gesetzRichtung } from "../../sim/handeln";
import { parlamentsLage, PARTY_COLORS, type Parlamentslage, type Rolle } from "./lage";
import type { VersorgungsStimme } from "../../sim/versorgungsmehrheit";
import { t } from "../../i18n";
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
  /** Abwesende Mitglieder (Art. 96: gezählt wird unter den Anwesenden); ältere Einträge haben 600 Stimmen ohne Abwesende */
  abwesend?: number;
  fraktionen?: VersorgungsStimme[];
}

const ANGENOMMEN = /^Das Parlament nimmt „(.+?)“ (.*?) ?an \((\d+) zu (\d+)\)\.(?: Stufe (\d+)\.)?/;
const ABGELEHNT = /^Das Parlament lehnt „(.+?)“ ab \((\d+) zu (\d+)\)/;

/** Eine Abstimmung über ein Gesetz (der Haushalt zählt hier nicht). Neue Einträge tragen das Feld abstimmung; ältere nur den deutschen Text. */
export function istAbstimmung(l: string | Pick<LogEntry, "text" | "abstimmung">): boolean {
  if (typeof l !== "string" && l.abstimmung) return l.abstimmung.art === "gesetz";
  const text = typeof l === "string" ? l : l.text;
  return text.startsWith("Das Parlament nimmt „") || text.startsWith("Das Parlament lehnt „");
}

export function leseAbstimmung(l: Pick<LogEntry, "text" | "day" | "date" | "versorgungsvotum" | "abstimmung">): Abstimmung | null {
  if (l.versorgungsvotum) {
    const v=l.versorgungsvotum, ja=v.stimmen.reduce((s,f)=>s+f.ja,0), gesamt=v.stimmen.reduce((s,f)=>s+f.sitze,0);
    return {name:t(`regierung.${v.programm}.titel`),ja,nein:gesamt-ja,angenommen:ja>=301,tag:l.day,datum:l.date,ort:t("mandat.kicker"),fraktionen:v.stimmen};
  }
  if (l.abstimmung) {
    const s = l.abstimmung;
    if (s.art !== "gesetz") return null;
    return { name: s.name, ort: s.ort, ja: s.ja, nein: s.nein, angenommen: s.angenommen, tag: l.day, datum: l.date, ...(s.stufe !== undefined ? { stufe: s.stufe } : {}), ...(s.abwesend ? { abwesend: s.abwesend } : {}) };
  }
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
  /** Ja, Nein oder abwesend (null) je Sitz von links */
  votum: (boolean | null)[];
  /** Ja-Stimmen bis einschließlich Sitz i */
  jaKum: number[];
  /** Nein-Stimmen bis einschließlich Sitz i (Abwesende zählen nicht) */
  neinKum: number[];
  jaJe: Record<string, number>;
}

/** Stimmzettel für eine Abstimmung: Die Summe der Ja-Stimmen ist genau das Ergebnis der Simulation. */
export function baueVerlauf(world: World, ab: Abstimmung, sachParteien: string[] = []): Verlauf | null {
  let lage = parlamentsLage(world);
  if (ab.fraktionen) {
    const gesamt=ab.fraktionen.reduce((s,f)=>s+f.sitze,0);
    const rang:Record<Rolle,number>={eigene:0,lager:1,duldung:2,opposition:3};
    const fraktionen=ab.fraktionen.map(f=>({partei:f.partei,name:PARTEI_NAME[f.partei]??f.partei,sitze:f.sitze,anteil:gesamt?f.sitze/gesamt*100:0,
      rolle:(f.rolle==="koalition"?"lager":f.rolle) as Rolle,farbe:PARTY_COLORS[f.partei]??world.player?.partei.farbe??"#999"})).sort((a,b)=>rang[a.rolle]-rang[b.rolle]||b.sitze-a.sitze);
    const summe=(rollen:Rolle[])=>fraktionen.filter(f=>rollen.includes(f.rolle)).reduce((s,f)=>s+f.sitze,0);
    lage={fraktionen,gesamt,lager:summe(["eigene","lager"]),duldung:summe(["duldung"]),opposition:summe(["opposition"]),eigene:fraktionen.find(f=>f.rolle==="eigene")?.partei??"",hatLager:fraktionen.some(f=>f.rolle==="lager")};
  }
  if (!lage) return null;
  const dul = duldung(world);
  const sachJa = lage.fraktionen.filter((f) => sachParteien.includes(f.partei)).reduce((s, f) => s + Math.round(f.sitze * SACHSTIMMEN_QUOTE), 0);
  const jaJe = ab.fraktionen ? Object.fromEntries(ab.fraktionen.map(f=>[f.partei,f.ja])) : verteileErgebnis(lage, ab.ja, dul.ja, sachJa, sachParteien);
  const votum: (boolean | null)[] = stimmzettel(lage, jaJe, streuwert(`${ab.name}|${ab.tag}|${ab.ja}`));
  // Abwesende sitzen unter denen, die nicht mit Ja stimmen; welche, entscheidet ein fester Zufall
  let rest = Math.max(0, Math.min(ab.abwesend ?? 0, votum.filter((v) => !v).length));
  const nein = votum.map((v, i) => ({ v, i, r: streuwert(`${ab.name}|${ab.tag}|abwesend|${i}`) })).filter((x) => !x.v).sort((a, b) => a.r - b.r);
  for (const x of nein) {
    if (rest-- <= 0) break;
    votum[x.i] = null;
  }
  const jaKum: number[] = [];
  const neinKum: number[] = [];
  let z = 0;
  let n = 0;
  for (const v of votum) {
    if (v) z++;
    else if (v === false) n++;
    jaKum.push(z);
    neinKum.push(n);
  }
  return { lage, votum, jaKum, neinKum, jaJe };
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

// Aus der Liste „Zur Abstimmung“ springt der Spieler zur Verteilung eines Gesetzes im Halbrund.
const ansichtHoerer = new Set<(gesetzId: string) => void>();

export function amAnsichtBeobachten(h: (gesetzId: string) => void): () => void {
  ansichtHoerer.add(h);
  return () => ansichtHoerer.delete(h);
}

export function zeigeImHalbrund(gesetzId: string): void {
  for (const h of ansichtHoerer) h(gesetzId);
}
