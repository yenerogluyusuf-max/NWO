// Sprachwache für Katastrophen und Verfassungsvorgang (Befund A-1, 6. November 2026). Die allgemeine Sprachwache
// (test/ereignisse-sprachen.test.ts) öffnet jede Vorlage in einer frischen Partie. Die Katastrophen (grossbeben, katastrophe_*)
// öffnen dort nicht, weil sie einen Fall des Risiko-Layers brauchen, und die Verfassungsvorlagen zeigen nur den Zweig ohne
// laufenden Vorgang. Hier werden sie so geöffnet wie im Spiel: der Fall wie in sim/katastrophe.ts (`loeseAus`) angelegt und mit
// `oeffne(w, id, rng, { provinzen, staerke, daten: { fall } })` geöffnet, in jeder Nebelstufe; das Verfassungspaket eingebracht und
// in jede Phase gestellt. Jede Antwort läuft auf einer Kopie, mit mehreren Würfeln für die Zweige des Ausgangs.
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import type { World } from "../src/sim/types";
import type { KatastropheFall, KatastrophenArt } from "../src/sim/spiel-typen";

/** Die Datenmodule setzen ihre Übersetzungen beim Laden ein: Je Sprache werden alle Module frisch geladen. */
async function module(sprache: "de" | "en" | "tr") {
  vi.resetModules();
  const i18n = await import("../src/i18n");
  await i18n.setzeSprache(sprache);
  const [world, scenario, prolog, ereignisse, rng, katastrophe, verfassung] = await Promise.all([
    import("../src/sim/world"), import("../src/sim/scenario"), import("../src/sim/prolog"), import("../src/sim/ereignisse"), import("../src/sim/rng"),
    import("../src/sim/katastrophe"), import("../src/sim/verfassung"),
  ]);
  return { ...world, ...scenario, ...prolog, ...ereignisse, ...rng, ...katastrophe, ...verfassung };
}
type M = Awaited<ReturnType<typeof module>>;
let m: M;

/** Dieselbe Prüfung wie in test/ereignisse-sprachen.test.ts: kein ä/ß und nicht zwei häufige deutsche Wörter in einem Text. */
const WORT = /(?<![\p{L}'’])(und|der|das|den|dem|des|nicht|mit|für|ist|sind|wird|werden|eine|einen|einem|einer|sich|auf|auch|aber|oder|wenn|dass|nach|bei|über|Sie|Ihre|Ihren|Ihnen|kostet|Kostet|Kapital|zum|zur|vom|ins|noch|schon|wie|als|ohne|gegen|keine|jetzt|hier|Präsident|Regierung|Minister|Ministerin|Zustimmung|Vertrauen)(?![\p{L}'’])/gu;
const ZEICHEN = /[äÄß]/;
function deutscherRest(text: string): string | null {
  if (ZEICHEN.test(text)) return `Zeichen ${text.match(ZEICHEN)![0]}`;
  const treffer = new Set([...text.matchAll(WORT)].map((x) => x[1]!));
  return treffer.size >= 2 ? `Wörter ${[...treffer].slice(0, 4).join(", ")}` : null;
}
/** Kaputte Texte in jeder Sprache: offene Platzhalter, undefined, NaN. */
const KAPUTT = /undefined|NaN|\[object|\{[a-zA-Z]+[|,}]|Infinity/;

function welt(seed: number): World {
  const { createWorld, turkey2026, startAfterElection, schnellProfil } = m;
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.hinweise = [];
  w.spiel!.kapital = 200;
  return w;
}

/** Ein Fall wie aus `loeseAus`: Schaden aus `schadenBerechnen`, Wohnungen wahlweise unter oder über der Programmgrenze. */
function fall(w: World, art: KatastrophenArt, provinzen: number[], staerke: number, wohnungen?: number): KatastropheFall {
  const schaden = m.schadenBerechnen(w, art, provinzen, staerke);
  const f: KatastropheFall = {
    id: `kat-${art}-${w.day}`,
    art,
    provinzen,
    tag: w.day,
    datum: w.date,
    staerke,
    tote: schaden.tote,
    verletzte: schaden.verletzte,
    obdachlos: schaden.obdachlos,
    wohnungen: wohnungen ?? schaden.wohnungen,
    bereitschaft: schaden.bereitschaft,
    verhindert: schaden.verhindert,
    hilfe: { soforthilfe: false },
    privatGeliefert: 0,
  };
  m.katastrophenZustand(w).faelle.push(f);
  return f;
}

/** Lagen je Vorlage: Art, Provinzen, Stärke und Wohnungen (null = aus dem Schaden). */
const LAGEN: { id: string; art: KatastrophenArt; provinzen: number[]; staerke: number; wohnungen?: number }[] = [
  { id: "grossbeben", art: "erdbeben", provinzen: [31, 46, 2], staerke: 0.9 },
  { id: "grossbeben", art: "erdbeben", provinzen: [34], staerke: 0.7, wohnungen: 800 },
  { id: "grossbeben", art: "erdbeben", provinzen: [35, 45], staerke: 0.56 },
  { id: "katastrophe_flut", art: "flut", provinzen: [37, 61], staerke: 0.8 },
  { id: "katastrophe_flut", art: "flut", provinzen: [53], staerke: 0.45 },
  { id: "katastrophe_waldbrand", art: "waldbrand", provinzen: [7, 48], staerke: 0.9 },
  { id: "katastrophe_waldbrand", art: "waldbrand", provinzen: [9], staerke: 0.5 },
  { id: "katastrophe_duerre", art: "duerre", provinzen: [42, 70, 68], staerke: 0.7 },
];

/** Alle Texte einer Ansicht und aller Antworten (auf Kopien ausgeführt, mit mehreren Würfeln). */
function sammle(w: World, oeffnen: (k: World) => { id: string } | null, pruefe: (feld: string, text: string | undefined) => void): number {
  const { save, load, ansicht, entscheide, Rng } = m;
  const basis = save(w);
  const k0 = load(basis);
  const log0 = k0.log.length;
  const ev = oeffnen(k0);
  if (!ev) return 0;
  const a = ansicht(k0, ev as Parameters<typeof ansicht>[1]);
  pruefe("titel", a.titel);
  a.text.forEach((x, i) => pruefe(`text${i + 1}`, x));
  pruefe("warum", a.warum);
  if (a.standardFolge) {
    pruefe("standard", a.standardFolge.text);
    a.standardFolge.zeilen.forEach((z) => pruefe("standard.zeile", z));
  }
  for (const l of k0.log.slice(log0)) { pruefe("log", l.text); pruefe("log.warum", l.why); }
  for (const o of a.optionen) {
    pruefe(`${o.id}.label`, o.label);
    pruefe(`${o.id}.beschreibung`, o.beschreibung);
    pruefe(`${o.id}.sperre`, o.sperre);
    pruefe(`${o.id}.warnung`, o.warnung);
    o.bedingungen?.forEach((b) => pruefe(`${o.id}.bedingung`, b));
    o.vorschau.forEach((z) => pruefe(`${o.id}.vorschau`, z));
    for (const wurf of [1, 2, 3, 5, 8, 13]) {
      const k = load(basis);
      const e2 = oeffnen(k);
      if (!e2) continue;
      k.spiel!.kapital = 500;
      const n0 = k.log.length;
      const r = entscheide(k, e2.id, o.id, new Rng(wurf));
      pruefe(`${o.id}.ausgang`, r.text);
      for (const l of k.log.slice(n0)) { pruefe(`${o.id}.log`, l.text); pruefe(`${o.id}.log.warum`, l.why); }
    }
  }
  return 1;
}

for (const sprache of ["en", "tr", "de"] as const) {
  describe(`Katastrophen und Verfassung auf ${sprache}`, () => {
    beforeAll(async () => { m = await module(sprache); }, 60_000);

    const pruefer = (vorlage: string, funde: string[]) => (feld: string, text: string | undefined) => {
      if (!text) return;
      if (KAPUTT.test(text)) funde.push(`${vorlage} ${feld} kaputt: ${text.slice(0, 160)}`);
      if (sprache === "de") return;
      const g = deutscherRest(text);
      if (g) funde.push(`${vorlage} ${feld} (${g}): ${text.slice(0, 160)}`);
    };

    test.each(["grossbeben", "katastrophe_flut", "katastrophe_waldbrand", "katastrophe_duerre"])(`%s ohne deutsche Reste (${sprache})`, (id) => {
      const funde: string[] = [];
      let geoeffnet = 0;
      for (const lage of LAGEN.filter((l) => l.id === id)) {
        // Nebelstufen: am Tag des Ereignisses (unsicher), nach 4 Tagen (vermutet) und nach 8 Tagen (bekannt)
        for (const alter of [0, 4, 8]) {
          for (const seed of [1, 2]) {
            const w = welt(seed);
            const f = fall(w, lage.art, lage.provinzen, lage.staerke, lage.wohnungen);
            f.tag = w.day - alter;
            const params = { provinzen: f.provinzen, staerke: lage.staerke, daten: { fall: f.id } };
            geoeffnet += sammle(w, (k) => m.oeffne(k, id, new m.Rng(seed * 13), params), pruefer(id, funde));
          }
        }
      }
      expect(geoeffnet, `${id} ließ sich nie öffnen`).toBeGreaterThan(0);
      expect([...new Set(funde)]).toEqual([]);
    }, 120_000);

    /** Ein Paket einbringen und den Vorgang in die Phase stellen, die die Vorlage erwartet. */
    function vorgang(w: World, paket: Record<string, string>, phase: "parlament" | "aym" | "kampagne"): boolean {
      const r = m.bringeVerfassungEin(w, paket);
      if (!r.ok) return false;
      const v = w.spiel!.verfassungsvorgang!.laufend!;
      v.phase = phase;
      v.absprachen = 3;
      if (phase === "aym") v.aymTag = w.day;
      if (phase === "kampagne") v.referendumTag = w.day;
      return true;
    }
    const PAKETE: Record<string, string>[] = [
      { amtszeit: "unbegrenzt", notstand: "weit" },
      { amtszeitlaenge: "jahre_4", justiz: "acht_sieben", notstand: "eng" },
      { amtszeit: "wiederwahl_plus", amtszeitlaenge: "jahre_7", wahlrecht: "zehn" },
    ];
    const PHASE: Record<string, "parlament" | "aym" | "kampagne"> = { verfassung_abstimmung: "parlament", verfassung_aym: "aym", verfassung_referendum: "kampagne", verfassung_proteste: "parlament" };

    test.each(Object.keys(PHASE))(`%s mit laufendem Vorgang ohne deutsche Reste (${sprache})`, (id) => {
      const funde: string[] = [];
      let geoeffnet = 0;
      for (const paket of PAKETE) {
        for (const seed of [1, 2]) {
          const w = welt(seed);
          if (!vorgang(w, paket, PHASE[id]!)) continue;
          geoeffnet += sammle(w, (k) => m.oeffne(k, id, new m.Rng(seed * 7)), pruefer(id, funde));
          if (id === "verfassung_proteste") {
            // Im Spiel öffnen die Proteste, wenn das Paket schon in Kraft ist: die geltende Fassung statt des laufenden Vorgangs
            const z = w.spiel!.verfassungsvorgang!;
            z.aktiv = { ...z.aktiv, ...paket };
            delete z.laufend;
            geoeffnet += sammle(w, (k) => m.oeffne(k, id, new m.Rng(seed * 7)), pruefer(id, funde));
          }
        }
      }
      expect(geoeffnet, `${id} ließ sich nie öffnen`).toBeGreaterThan(0);
      expect([...new Set(funde)]).toEqual([]);
    }, 120_000);
  });
}

afterAll(() => {
  vi.resetModules();
});
