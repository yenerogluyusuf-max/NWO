// Meldungsformat der Übersetzungsschicht: eine kleine, abhängigkeitsfreie Teilmenge von ICU MessageFormat.
//
//   {name}                       Einsatzwert (Text, Zahl, Datum, Liste, Eigenname mit Formen)
//   {name|dat}                   Fall (im Türkischen mit Lautregeln, sonst Form des Eigennamens oder Grundform); weitere Marken: |gross |klein |anfang
//   {n, number}                  Zahl nach Sprache; {n, number, 1} mit festen Nachkommastellen
//   {n, prozent, 1}              Zahl in Prozent (de „17,5 %“, tr „%17,5“, en „17.5%“)
//   {d, date}                    Datum (ISO „2030-05-05“ oder Date); Stile: lang (Standard), kurz, monat, tag
//   {z, time}                    Uhrzeit in Ortszeit (Zeitstempel in ms, Date oder ISO-Text)
//   {liste, list}                Aufzählung („A, B und C“); Stil „oder“ für Alternativen
//   {n, plural, one {…} other {…}}   Mehrzahl nach Sprachregel, „#“ steht für die Zahl; auch =0, =1
//   {x, select, a {…} other {…}}      Auswahl nach Wert
//   {{ und }}                    wörtliche Klammern

import { ek } from "./tuerkisch";
import { LOCALE, type Fall, type Formen, type Params, type Sprache, type Wert } from "./typen";

interface Platz {
  name: string;
  pipes: string[];
  art: string | undefined;
  stil: string | undefined;
  optionen: Record<string, Knoten[]> | undefined;
}
type Knoten = string | Platz;

const cache = new Map<string, Knoten[]>();

/** Findet das passende Ende einer Klammer, mit Verschachtelung. */
function klammerEnde(s: string, start: number): number {
  let tiefe = 0;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (c === "{") tiefe++;
    else if (c === "}") {
      tiefe--;
      if (tiefe === 0) return i;
    }
  }
  throw new Error(`Meldung ohne schließende Klammer: ${s}`);
}

/** Teilt an Kommas der obersten Ebene (nur die ersten `max - 1` Trennstellen). */
function teile(s: string, max: number): string[] {
  const teile: string[] = [];
  let tiefe = 0;
  let von = 0;
  for (let i = 0; i < s.length && teile.length < max - 1; i++) {
    const c = s[i];
    if (c === "{") tiefe++;
    else if (c === "}") tiefe--;
    else if (c === "," && tiefe === 0) {
      teile.push(s.slice(von, i));
      von = i + 1;
    }
  }
  teile.push(s.slice(von));
  return teile;
}

function parseOptionen(s: string): Record<string, Knoten[]> {
  const out: Record<string, Knoten[]> = {};
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i]!)) i++;
    if (i >= s.length) break;
    let j = i;
    while (j < s.length && s[j] !== "{" && !/\s/.test(s[j]!)) j++;
    const schluessel = s.slice(i, j);
    while (j < s.length && /\s/.test(s[j]!)) j++;
    if (s[j] !== "{") throw new Error(`Option „${schluessel}“ ohne Klammer: ${s}`);
    const ende = klammerEnde(s, j);
    out[schluessel] = parse(s.slice(j + 1, ende));
    i = ende + 1;
  }
  return out;
}

export function parse(src: string): Knoten[] {
  const hit = cache.get(src);
  if (hit) return hit;
  const knoten: Knoten[] = [];
  let text = "";
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (c === "{" && src[i + 1] === "{") {
      text += "{";
      i++;
    } else if (c === "}" && src[i + 1] === "}") {
      text += "}";
      i++;
    } else if (c === "{") {
      if (text) knoten.push(text);
      text = "";
      const ende = klammerEnde(src, i);
      const innen = src.slice(i + 1, ende);
      const [kopf = "", art, rest] = teile(innen, 3);
      const [name = "", ...pipes] = kopf.split("|").map((x) => x.trim());
      const artT = art?.trim();
      if (artT === "plural" || artT === "select") {
        knoten.push({ name, pipes, art: artT, stil: undefined, optionen: parseOptionen(rest ?? "") });
      } else {
        knoten.push({ name, pipes, art: artT, stil: rest?.trim(), optionen: undefined });
      }
      i = ende;
    } else {
      text += c;
    }
  }
  if (text) knoten.push(text);
  cache.set(src, knoten);
  return knoten;
}

const istFormen = (w: Wert): w is Formen => typeof w === "object" && w !== null && !(w instanceof Date) && !Array.isArray(w) && "nom" in w;

function datumVon(w: Wert): Date | null {
  if (w instanceof Date) return w;
  if (typeof w === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(w);
    if (m) return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  }
  return null;
}

function zahlVon(w: Wert): number {
  if (typeof w === "number") return w;
  if (typeof w === "string") return Number(w.replace(",", "."));
  return NaN;
}

function formatZahl(n: number, sprache: Sprache, stellen?: number): string {
  const opt: Intl.NumberFormatOptions = stellen === undefined ? { maximumFractionDigits: 2 } : { minimumFractionDigits: stellen, maximumFractionDigits: stellen };
  return new Intl.NumberFormat(LOCALE[sprache], opt).format(n);
}

function formatDatum(d: Date, sprache: Sprache, stil: string | undefined): string {
  const opt: Intl.DateTimeFormatOptions =
    stil === "kurz" ? { day: "numeric", month: "short", year: "numeric" }
    : stil === "monat" ? { month: "long", year: "numeric" }
    : stil === "tag" ? { day: "numeric", month: "long" }
    : { day: "numeric", month: "long", year: "numeric" };
  return new Intl.DateTimeFormat(LOCALE[sprache], { ...opt, timeZone: "UTC" }).format(d);
}

function formatListe(l: readonly (string | number)[], sprache: Sprache, stil: string | undefined): string {
  return new Intl.ListFormat(LOCALE[sprache], { type: stil === "oder" ? "disjunction" : "conjunction", style: "long" }).format(l.map(String));
}

const FAELLE = new Set<string>(["nom", "gen", "dat", "akk", "loc", "abl", "ins"]);

/** Grundtext eines Wertes ohne Art-Angabe. */
function grundText(w: Wert, sprache: Sprache): string {
  if (w === null || w === undefined) return "";
  if (istFormen(w)) return w.nom;
  if (w instanceof Date) return formatDatum(w, sprache, undefined);
  if (Array.isArray(w)) return formatListe(w, sprache, undefined);
  if (typeof w === "number") return formatZahl(w, sprache);
  return String(w);
}

function wendeMarkeAn(text: string, wert: Wert, marke: string, sprache: Sprache): string {
  if (FAELLE.has(marke)) {
    const fall = marke as Fall;
    if (istFormen(wert)) {
      const form = wert[fall];
      if (form !== undefined) return form;
    }
    return sprache === "tr" ? ek(istFormen(wert) ? wert.nom : text, fall) : text;
  }
  const l = LOCALE[sprache];
  if (marke === "gross") return text.toLocaleUpperCase(l);
  if (marke === "klein") return text.toLocaleLowerCase(l);
  if (marke === "anfang") return text.length ? text[0]!.toLocaleUpperCase(l) + text.slice(1) : text;
  throw new Error(`Unbekannte Marke „${marke}“`);
}

function rendereKnoten(knoten: Knoten[], params: Params, sprache: Sprache, pluralZahl?: string): string {
  let out = "";
  for (const k of knoten) {
    if (typeof k === "string") {
      out += pluralZahl === undefined ? k : k.replaceAll("#", pluralZahl);
      continue;
    }
    if (!(k.name in params)) {
      out += `{${k.name}}`;
      continue;
    }
    const w = params[k.name];
    let text: string;
    switch (k.art) {
      case undefined:
        text = grundText(w, sprache);
        break;
      case "number": {
        const n = zahlVon(w);
        const stellen = k.stil !== undefined && k.stil !== "" ? Number(k.stil) : undefined;
        text = Number.isFinite(n) ? formatZahl(n, sprache, stellen) : grundText(w, sprache);
        break;
      }
      case "prozent": {
        const n = zahlVon(w);
        const stellen = k.stil !== undefined && k.stil !== "" ? Number(k.stil) : 0;
        const z = formatZahl(n, sprache, stellen);
        text = sprache === "tr" ? `%${z}` : sprache === "de" ? `${z} %` : `${z}%`;
        break;
      }
      case "date": {
        const d = datumVon(w);
        text = d ? formatDatum(d, sprache, k.stil) : grundText(w, sprache);
        break;
      }
      case "time": {
        // Uhrzeit in der Ortszeit des Geräts (Zeitstempel in Millisekunden, Date oder ISO-Text mit Uhrzeit)
        const d = w instanceof Date ? w : typeof w === "number" || typeof w === "string" ? new Date(w) : null;
        text = d && !Number.isNaN(d.getTime()) ? new Intl.DateTimeFormat(LOCALE[sprache], { hour: "2-digit", minute: "2-digit" }).format(d) : grundText(w, sprache);
        break;
      }
      case "list":
        text = Array.isArray(w) ? formatListe(w, sprache, k.stil) : grundText(w, sprache);
        break;
      case "plural": {
        const n = zahlVon(w);
        const kat = new Intl.PluralRules(LOCALE[sprache]).select(n);
        const opt = k.optionen!;
        const zweig = opt[`=${n}`] ?? opt[kat] ?? opt["other"];
        if (!zweig) throw new Error(`plural ohne „other“: ${k.name}`);
        text = rendereKnoten(zweig, params, sprache, formatZahl(n, sprache));
        break;
      }
      case "select": {
        const opt = k.optionen!;
        const zweig = opt[String(w)] ?? opt["other"];
        if (!zweig) throw new Error(`select ohne „other“: ${k.name}`);
        text = rendereKnoten(zweig, params, sprache);
        break;
      }
      default:
        throw new Error(`Unbekannte Art „${k.art}“ bei ${k.name}`);
    }
    for (const marke of k.pipes) text = wendeMarkeAn(text, w, marke, sprache);
    out += text;
  }
  return out;
}

/** Setzt die Einsatzwerte in eine Meldungsvorlage ein. */
export function formatiere(vorlage: string, params: Params | undefined, sprache: Sprache): string {
  return rendereKnoten(parse(vorlage), params ?? {}, sprache);
}

/** Namen der Platzhalter einer Vorlage (für die Vollständigkeitsprüfung zwischen den Sprachen). */
export function platzhalter(vorlage: string): string[] {
  const namen = new Set<string>();
  const gehe = (k: Knoten[]) => {
    for (const x of k) {
      if (typeof x === "string") continue;
      namen.add(x.name);
      if (x.optionen) for (const z of Object.values(x.optionen)) gehe(z);
    }
  };
  gehe(parse(vorlage));
  return [...namen].sort();
}
