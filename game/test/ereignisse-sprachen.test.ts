// Sprachwache der Ereignisse (Befund A-1/I-1, 5. November 2026): Jede Ereignisvorlage wird in Englisch und Türkisch geöffnet, jede Antwort
// auf einer Kopie ausgeführt. Titel, Text, Begründung, Antworten, Vorschau, Standardfolge und Ausgang dürfen keine deutschen Reste enthalten:
// kein ä/ß und nicht zwei oder mehr häufige deutsche Wörter in einem Text. Mit SPRACHREST_AUS=<datei> schreibt der Test alle Funde.
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { writeFileSync } from "node:fs";
import { VORLAGEN } from "../src/sim/ereignisse";
import type { World } from "../src/sim/types";

/** Die Datenmodule setzen ihre Übersetzungen beim Laden ein (i18n/daten.ts): Je Sprache werden alle Module frisch geladen. */
async function module(sprache: "en" | "tr") {
  vi.resetModules();
  const i18n = await import("../src/i18n");
  await i18n.setzeSprache(sprache);
  const [world, scenario, prolog, ereignisse, rng, laender, abkommen, mk, pers] = await Promise.all([
    import("../src/sim/world"), import("../src/sim/scenario"), import("../src/sim/prolog"), import("../src/sim/ereignisse"), import("../src/sim/rng"),
    import("../src/sim/laender"), import("../src/sim/abkommen"), import("../src/sim/machtkreis"), import("../src/sim/personen"),
  ]);
  return { ...world, ...scenario, ...prolog, ...ereignisse, ...rng, ...laender, laufendeVertraege: abkommen.laufende, verhandleVertrag: abkommen.verhandle, ...mk, ...pers };
}
type M = Awaited<ReturnType<typeof module>>;
let m: M;

/** Häufige deutsche Funktionswörter, die im Englischen und Türkischen nicht als eigenes Wort vorkommen. */
const WORT = /(?<![\p{L}'’])(und|der|das|den|dem|des|nicht|mit|für|ist|sind|wird|werden|eine|einen|einem|einer|sich|auf|auch|aber|oder|wenn|dass|nach|bei|über|Sie|Ihre|Ihren|Ihnen|kostet|Kostet|Kapital|zum|zur|vom|ins|noch|schon|wie|als|ohne|gegen|keine|jetzt|hier|Präsident|Regierung|Minister|Ministerin|Zustimmung|Vertrauen)(?![\p{L}'’])/gu;
const ZEICHEN = /[äÄß]/;

/** Liefert einen Grund, wenn der Text deutsch wirkt, sonst null. */
export function deutscherRest(text: string): string | null {
  if (ZEICHEN.test(text)) return `Zeichen ${text.match(ZEICHEN)![0]}`;
  const treffer = new Set([...text.matchAll(WORT)].map((m) => m[1]!));
  return treffer.size >= 2 ? `Wörter ${[...treffer].slice(0, 4).join(", ")}` : null;
}

function welt(seed: number): World {
  const { createWorld, turkey2026, startAfterElection, schnellProfil, advance, weltZustand } = m;
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 100;
  advance(w, 210);
  w.spiel!.ereignisse = [];
  w.spiel!.hinweise = [];
  w.spiel!.zuletzt = {};
  for (const z of Object.values(weltZustand(w))) delete z.initiativeZuletzt;
  weltZustand(w).EU!.versatz += 30;
  weltZustand(w).GRC!.konflikt = 80;
  return w;
}

/** Lagen, die eine Vorlage braucht (wie in ereignisse-texte.test.ts). */
function bereite(w: World, id: string): void {
  const { laufendeVertraege, verhandleVertrag, weltZustand, machtkreis, personen, eigenVon } = m;
  if (id === "vertrag_verlaengerung") {
    verhandleVertrag(w, { land: "SYR", gibt: ["bauauftraege", "energie_lieferung"], will: ["w_rueckkehr"], jahre: 2 });
    const v = laufendeVertraege(w, "SYR")[0];
    if (v) v.ablauf = w.day + 100;
  }
  if (id === "land_drohkulisse") weltZustand(w).GRC!.konflikt = 90;
  // Welle E2: Forschung und Große Ziele brauchen eine Lage (wie in ereignisse-texte.test.ts)
  if (id === "forschung_verwaltung") w.spiel!.reich!.verwaltung = 0;
  if (id === "grossziel_gelegenheit") {
    const ziele = ["nahostordnung", "drehscheibe", "turkunion", "weltbuehne", "kornkammer", "seemacht", "technologie"];
    w.spiel!.grosseZiele = { verfolgt: ziele, stand: Object.fromEntries(ziele.map((z) => [z, { stufe: 0, vorbereitung: 30, versuche: 0 }])), vertretungen: {} };
  }
  if (id === "kreis_seitenwechsel" || id === "kreis_putschzirkel") {
    const mk = machtkreis(w);
    const kandidat = personen(w).find((p) => p.rolle === "finanzen" && p.figur) ?? personen(w).find((p) => p.figur && p.rolle !== "opposition");
    if (kandidat?.figur) {
      kandidat.figur.loyalitaet = 10;
      const eigen = eigenVon(w, kandidat.figur);
      eigen.groll = 60;
      eigen.ehrgeiz = 70;
    }
    const stab = personen(w).find((p) => p.rolle === "generalstab" && p.figur) ?? kandidat;
    if (stab) mk.geheimnisse.push({ id: "g-test-putsch", person: stab.schluessel, art: "putschzirkel", schwere: 2, aufgedeckt: true, oeffentlich: false, seit: w.day });
  }
  if (id === "zusage") w.spiel!.zusagen.push({ id: "z-renten", von: Object.keys(w.parliament!.seats)[1]!, text: "", faellig: 0, massnahme: "m_wissenschaftsfreiheit", richtung: 1, erfuellt: false, gebrochen: false });
}

const SAMEN = [1, 2, 3, 5];
const funde: Record<string, { vorlage: string; feld: string; grund: string; text: string }[]> = { en: [], tr: [] };

for (const sprache of ["en", "tr"] as const) {
  describe(`Ereignisse auf ${sprache}`, () => {
    const basis = new Map<number, string>();
    beforeAll(async () => { m = await module(sprache); }, 60_000);
    test.each(VORLAGEN.map((v) => v.id))(`%s ohne deutsche Reste (${sprache})`, (id) => {
      const { load, save, oeffne, ansicht, entscheide, Rng } = m;
      const eigene: typeof funde.en = [];
      const pruefe = (feld: string, text: string | undefined) => {
        if (!text) return;
        const g = deutscherRest(text);
        if (g) eigene.push({ vorlage: id, feld, grund: g, text: text.slice(0, 160) });
      };
      for (const seed of SAMEN) {
        if (!basis.has(seed)) basis.set(seed, save(welt(seed)));
        const w = load(basis.get(seed)!);
        bereite(w, id);
        const params = id === "zusage" ? { provinzen: [], staerke: 1, daten: { zusage: "z-renten" } } : undefined;
        const log0 = w.log.length;
        const ev = oeffne(w, id, new Rng(seed * 13), params);
        if (!ev) continue;
        const a = ansicht(w, ev);
        pruefe("titel", a.titel);
        a.text.forEach((x, i) => pruefe(`text${i + 1}`, x));
        pruefe("warum", a.warum);
        pruefe("massnahmenText", a.massnahmenText);
        a.massnahmen.forEach((m) => pruefe("massnahme", m.name));
        if (a.standardFolge) {
          pruefe("standard", a.standardFolge.text);
          a.standardFolge.zeilen.forEach((z) => pruefe("standard.zeile", z));
        }
        for (const l of w.log.slice(log0)) { pruefe("log", l.text); pruefe("log.warum", l.why); }
        for (const o of a.optionen) {
          pruefe(`${o.id}.label`, o.label);
          pruefe(`${o.id}.beschreibung`, o.beschreibung);
          pruefe(`${o.id}.sperre`, o.sperre);
          pruefe(`${o.id}.warnung`, o.warnung);
          o.bedingungen?.forEach((b) => pruefe(`${o.id}.bedingung`, b));
          o.vorschau.forEach((z) => pruefe(`${o.id}.vorschau`, z));
          const k = load(basis.get(seed)!);
          bereite(k, id);
          const e2 = oeffne(k, id, new Rng(seed * 13), params);
          if (!e2) continue;
          k.spiel!.kapital = 500;
          const n0 = k.log.length;
          const r = entscheide(k, e2.id, o.id, new Rng(5));
          pruefe(`${o.id}.ausgang`, r.text);
          for (const l of k.log.slice(n0)) pruefe(`${o.id}.log`, l.text);
        }
      }
      const einzeln = [...new Map(eigene.map((f) => [`${f.feld}|${f.text}`, f])).values()];
      funde[sprache]!.push(...einzeln);
      expect(einzeln.map((f) => `${f.feld}: ${f.text}`)).toEqual([]);
    }, 120_000);
  });
}

afterAll(() => {
  if (process.env.SPRACHREST_AUS) writeFileSync(process.env.SPRACHREST_AUS, JSON.stringify(funde, null, 1));
  vi.resetModules();
});
