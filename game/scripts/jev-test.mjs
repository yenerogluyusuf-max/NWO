#!/usr/bin/env node
// Jev-Testbatterie für Staatsräson (TypeSafe System One).
//
// Was das Skript tut:
//   1. Lädt die Testfälle (jev-testfaelle.json) und den echten Handlungskatalog des Spiels
//      (katalog.json; wird bei Bedarf mit rolldown aus scripts/runner.ts neu gebaut).
//   2. Fragt Jev pro Fall: Intent (Choice über 10 Klassen), Ziel-Maßnahme (Choice über den
//      echten Maßnahmenkatalog + „keine"), Ziel-Land (Choice über die 18 Länder + „keins") —
//      alle drei Fragen in EINER Anfrage (fan-out), dazu bei den Noul-/Score-Fällen je eine Frage.
//   3. Misst: Trefferquoten (Intent/Ziel), durchschnittliche Confidence, Latenz, Token-Verbrauch
//      und was ein Confidence-Gate (Standard 0,7) automatisch durchließe.
//   4. Schreibt jev-test-ergebnis.md.
//
// Ausführen:
//   TYPESAFE_API_KEY=ts-... node scripts/jev-test.mjs            # volle Batterie
//   node scripts/jev-test.mjs                                    # ohne Schlüssel: nur Selbsttest
//   node scripts/jev-test.mjs --nur=de01,tr02                    # einzelne Fälle
//   node scripts/jev-test.mjs --gate=0.8                         # anderes Confidence-Gate
//   node scripts/jev-test.mjs --katalog-neu                      # Katalog aus dem Spiel neu bauen
//
// Kosten: Das Skript zählt Token. Preise je 1 Mio. Token können als Umgebungsvariablen
// TYPESAFE_PREIS_EIN / TYPESAFE_PREIS_AUS (USD) gesetzt werden; sonst steht in der Ausgabe
// nur der Token-Verbrauch.

import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HIER = dirname(fileURLToPath(import.meta.url));
const GAME = join(HIER, "..");
const API = "https://api.typesafe.ai/v1/systemone";
const MODELL = "jev-latest";
const ARGV = process.argv.slice(2);
const arg = (name, fallback) => {
  const f = ARGV.find((a) => a.startsWith(`--${name}=`));
  return f ? f.split("=").slice(1).join("=") : fallback;
};
const GATE = Number(arg("gate", "0.7"));
const NUR = arg("nur", "") ? arg("nur", "").split(",").map((s) => s.trim()) : null;
const flag = (name) => ARGV.includes(`--${name}`);

// --- Katalog sicherstellen -------------------------------------------------
function katalogPfad() {
  return join(HIER, "katalog.json");
}
function baueKatalog() {
  console.log("Baue den Handlungskatalog aus dem Spiel (rolldown + runner) …");
  execFileSync(join(GAME, "node_modules/.bin/rolldown"), [join(HIER, "runner.ts"), "-o", join(HIER, ".build/runner.mjs"), "-f", "esm", "-p", "node"], { stdio: "inherit" });
  const aus = execFileSync(process.execPath, [join(HIER, ".build/runner.mjs"), "katalog"], { maxBuffer: 64 * 1024 * 1024 });
  writeFileSync(katalogPfad(), aus);
}
if (flag("katalog-neu") || !existsSync(katalogPfad()) || statSync(katalogPfad()).mtimeMs < statSync(join(HIER, "runner.ts")).mtimeMs) {
  baueKatalog();
}
const KATALOG = JSON.parse(readFileSync(katalogPfad(), "utf-8"));
const FALLE = JSON.parse(readFileSync(join(HIER, "jev-testfaelle.json"), "utf-8"));

// --- Selbsttest der Testfälle gegen den echten Katalog ---------------------
function selbsttest() {
  const fehler = [];
  const massIds = new Set(KATALOG.massnahmen.map((m) => m.id));
  const landIds = new Set(KATALOG.laender.map((l) => l.id));
  const intentIds = new Set(Object.keys(FALLE.intents));
  const de = FALLE.choice.filter((f) => f.sprache === "de").length;
  const tr = FALLE.choice.filter((f) => f.sprache === "tr").length;
  if (de !== 15) fehler.push(`Choice-Fälle deutsch: ${de} statt 15`);
  if (tr !== 15) fehler.push(`Choice-Fälle türkisch: ${tr} statt 15`);
  if (FALLE.noul.length !== 5) fehler.push(`Noul-Fälle: ${FALLE.noul.length} statt 5`);
  if (FALLE.score.length !== 5) fehler.push(`Score-Fälle: ${FALLE.score.length} statt 5`);
  for (const f of FALLE.choice) {
    if (!intentIds.has(f.sollIntent)) fehler.push(`${f.id}: unbekannter Soll-Intent „${f.sollIntent}“`);
    if (f.sollZiel) {
      const bekannt = massIds.has(f.sollZiel) || landIds.has(f.sollZiel);
      if (!bekannt) fehler.push(`${f.id}: Soll-Ziel „${f.sollZiel}“ ist weder Maßnahme noch Land des Spiels`);
    }
  }
  for (const f of FALLE.score) if (f.sollStufe < 0 || f.sollStufe >= FALLE.dringlichkeitStufen.length) fehler.push(`${f.id}: sollStufe außerhalb der Stufen`);
  return fehler;
}

// --- Jev aufrufen ----------------------------------------------------------
async function jev(schluessel, state, questions, versuch = 0) {
  const t0 = Date.now();
  const r = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${schluessel}` },
    body: JSON.stringify({ state, model: MODELL, questions }),
  });
  const text = await r.text();
  if ((r.status === 429 || r.status === 529) && versuch < 4) {
    const warten = 1000 * 2 ** versuch;
    console.warn(`  ${r.status} — warte ${warten} ms und versuche erneut …`);
    await new Promise((res) => setTimeout(res, warten));
    return jev(schluessel, state, questions, versuch + 1);
  }
  if (!r.ok) throw new Error(`TypeSafe HTTP ${r.status}: ${text.slice(0, 400)}`);
  return { j: JSON.parse(text), ms: Date.now() - t0 };
}

function fragenFuerChoice() {
  const zielKriterien = Object.fromEntries(KATALOG.massnahmen.map((m) => [m.id, m.name]));
  zielKriterien["keine"] = "Die Eingabe meint keine Maßnahme aus dem Katalog.";
  const landKriterien = Object.fromEntries(KATALOG.laender.map((l) => [l.id, l.name]));
  landKriterien["keins"] = "Die Eingabe richtet sich an kein dieser Länder.";
  return {
    intent: {
      type: "choice",
      instructions:
        "Du routest Eingaben des Spielers im Strategiespiel „Staatsräson“ (der Spieler ist Staatspräsident der Türkei; Eingaben auf Deutsch oder Türkisch). Welche Art von Auftrag ist das? Antworte „unklar“, wenn nichts sicher passt.",
      criteria: FALLE.intents,
    },
    ziel: {
      type: "choice",
      instructions: "Falls die Eingabe eine Maßnahme aus diesem Katalog ändern will: welche? Sonst „keine“.",
      criteria: zielKriterien,
    },
    land: {
      type: "choice",
      instructions: "Falls die Eingabe ein Land betrifft (Handlung oder Frage zum Verhältnis): welches? Sonst „keins“.",
      criteria: landKriterien,
    },
  };
}

// --- Hauptteil -------------------------------------------------------------
const KEY = (process.env.TYPESAFE_API_KEY ?? "").trim();
const fehler = selbsttest();
if (fehler.length) {
  console.error("Selbsttest der Testfälle fehlgeschlagen:");
  for (const f of fehler) console.error("  - " + f);
  process.exit(1);
}
console.log("Selbsttest: 30 Choice-Fälle (15 de / 15 tr), 5 Noul-, 5 Score-Fälle — alle Soll-Werte existieren im echten Katalog des Spiels.");

if (!KEY) {
  const beispiel = { state: FALLE.choice[0].eingabe, model: MODELL, questions: fragenFuerChoice() };
  console.log(`
Kein TYPESAFE_API_KEY in der Umgebung — die Batterie wird NICHT ausgeführt.

So führst du sie aus:
  1. Schlüssel besorgen (https://typesafe.ai) und setzen:
       export TYPESAFE_API_KEY=ts-...
  2. Batterie starten:
       node game/scripts/jev-test.mjs
  3. Ergebnis lesen: game/scripts/jev-test-ergebnis.md

Der Katalog kommt echt aus dem Spiel: ${KATALOG.massnahmen.length} Maßnahmen, ${KATALOG.laender.length} Länder.
Beispiel einer Anfrage (Fall „${FALLE.choice[0].id}"), gekürzt:
${JSON.stringify({ ...beispiel, questions: Object.fromEntries(Object.entries(beispiel.questions).map(([k, q]) => [k, { ...q, criteria: `…${Object.keys(q.criteria).length} Optionen…` }])) }, null, 2)}
`);
  process.exit(0);
}

const protokoll = [];
let tokensEin = 0, tokensAus = 0;

function aufzeichnen(zeile) {
  protokoll.push(zeile);
  console.log(zeile);
}

// Choice-Fälle
const choiceFaelle = NUR ? FALLE.choice.filter((f) => NUR.includes(f.id)) : FALLE.choice;
const noulFaelle = NUR ? FALLE.noul.filter((f) => NUR.includes(f.id)) : FALLE.noul;
const scoreFaelle = NUR ? FALLE.score.filter((f) => NUR.includes(f.id)) : FALLE.score;

const erg = { choice: [], noul: [], score: [] };

for (const f of choiceFaelle) {
  const { j, ms } = await jev(KEY, f.eingabe, fragenFuerChoice());
  tokensEin += j.usage?.input_tokens ?? 0;
  tokensAus += j.usage?.output_tokens ?? 0;
  const intent = j.answers.intent;
  const ziel = j.answers.ziel;
  const land = j.answers.land;
  const intentOk = intent.choice === f.sollIntent;
  let zielOk = null;
  if (f.sollZiel) {
    zielOk = ziel.choice === f.sollZiel || land.choice === f.sollZiel;
  }
  erg.choice.push({ ...f, intent: intent.choice, intentConf: intent.confidence, ziel: ziel.choice, zielConf: ziel.confidence, land: land.choice, intentOk, zielOk, ms });
  aufzeichnen(`${f.id}  intent=${intent.choice}${intentOk ? " ✓" : ` ✗ (soll ${f.sollIntent})`} conf=${intent.confidence.toFixed(2)}  ziel=${ziel.choice}${zielOk === null ? "" : zielOk ? " ✓" : ` ✗ (soll ${f.sollZiel})`}  ${ms} ms`);
}

for (const f of noulFaelle) {
  const { j, ms } = await jev(KEY, f.state, {
    rote_linie: {
      type: "noul",
      instructions: f.frage,
      criteria: {
        true: "Das Angebot verlangt etwas, das die Gegenseite grundsätzlich niemals annehmen würde (existenzielle Souveränitäts- oder Identitätsfrage); die Verhandlung ist damit sofort tot.",
        false: "Das Angebot ist verhandelbar; die Gegenseite kann es ablehnen oder ein Gegenangebot machen, aber es berührt keine unantastbare Grenze.",
      },
    },
  });
  tokensEin += j.usage?.input_tokens ?? 0;
  tokensAus += j.usage?.output_tokens ?? 0;
  const p = j.answers.rote_linie.noul;
  const ok = f.soll ? p >= 0.5 : p < 0.5;
  erg.noul.push({ ...f, p, ok, ms });
  aufzeichnen(`${f.id}  noul=${p.toFixed(3)}${ok ? " ✓" : ` ✗ (soll ${f.soll ? "≥0,5" : "<0,5"})`}  ${ms} ms`);
}

for (const f of scoreFaelle) {
  const { j, ms } = await jev(KEY, f.state, {
    dringlichkeit: {
      type: "score",
      instructions: "Wie dringlich ist dieses Ereignis für die Regierung? Bewerte nach Handlungsdruck und Frist, nicht nach Thema.",
      criteria: FALLE.dringlichkeitStufen,
    },
  });
  tokensEin += j.usage?.input_tokens ?? 0;
  tokensAus += j.usage?.output_tokens ?? 0;
  const a = j.answers.dringlichkeit;
  const stufe = Math.round(a.score);
  const ok = Math.abs(stufe - f.sollStufe) <= 1;
  erg.score.push({ ...f, stufe, roh: a.score, conf: a.confidence, ok, ms });
  aufzeichnen(`${f.id}  stufe=${stufe} (${a.score.toFixed(2)})${ok ? " ✓" : ` ✗ (soll ${f.sollStufe})`} conf=${a.confidence.toFixed(2)}  ${ms} ms`);
}

// --- Metriken ---------------------------------------------------------------
const schnitt = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const quote = (xs) => (xs.length ? xs.filter(Boolean).length / xs.length : 0);
const intentQuote = quote(erg.choice.map((x) => x.intentOk));
const zielFaelle = erg.choice.filter((x) => x.zielOk !== null);
const zielQuote = quote(zielFaelle.map((x) => x.zielOk));
const confSchnitt = schnitt(erg.choice.map((x) => x.intentConf));
const gate = erg.choice.filter((x) => x.intentConf >= GATE);
const gateQuote = gate.length ? quote(gate.map((x) => x.intentOk)) : 0;
const noulQuote = quote(erg.noul.map((x) => x.ok));
const scoreQuote = quote(erg.score.map((x) => x.ok));
const latenz = schnitt([...erg.choice, ...erg.noul, ...erg.score].map((x) => x.ms));
const preisEin = Number(process.env.TYPESAFE_PREIS_EIN ?? "0");
const preisAus = Number(process.env.TYPESAFE_PREIS_AUS ?? "0");
const kosten = (tokensEin * preisEin + tokensAus * preisAus) / 1_000_000;
const proAnfrage = erg.choice.length + erg.noul.length + erg.score.length;

const md = `# Jev-Testbatterie — Ergebnis

Datum: ${new Date().toISOString()} · Modell: ${MODELL} · Fälle: ${proAnfrage} · Confidence-Gate: ${GATE}

## Kennzahlen

| Metrik | Wert |
| --- | --- |
| Intent-Trefferquote (30 Choice-Fälle) | ${(intentQuote * 100).toFixed(1)} % |
| Ziel-Trefferquote (Maßnahme/Land, ${zielFaelle.length} Fälle mit Soll) | ${(zielQuote * 100).toFixed(1)} % |
| Noul-Trefferquote (Rote Linie, 5 Fälle) | ${(noulQuote * 100).toFixed(1)} % |
| Score-Trefferquote (Dringlichkeit ±1, 5 Fälle) | ${(scoreQuote * 100).toFixed(1)} % |
| Ø Confidence (Intent) | ${confSchnitt.toFixed(3)} |
| Gate ${GATE}: Anteil automatisch geroutet | ${gate.length}/${erg.choice.length} Fälle, davon ${(gateQuote * 100).toFixed(1)} % richtig |
| Ø Latenz je Anfrage | ${latenz.toFixed(0)} ms |
| Token gesamt (ein/aus) | ${tokensEin} / ${tokensAus} |
| Ø Token je Anfrage (ein/aus) | ${(tokensEin / Math.max(1, proAnfrage)).toFixed(0)} / ${(tokensAus / Math.max(1, proAnfrage)).toFixed(0)} |
| Kosten gesamt | ${preisEin || preisAus ? kosten.toFixed(4) + " USD" : "unbekannt (TYPESAFE_PREIS_EIN/AUS nicht gesetzt)"} |

## Choice-Fälle im Einzelnen

| Fall | Eingabe | Soll-Intent | Jev-Intent | Conf | Soll-Ziel | Jev-Ziel | ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
${erg.choice.map((x) => `| ${x.id} | ${x.eingabe.replace(/\|/g, "\\|")} | ${x.sollIntent} | ${x.intent}${x.intentOk ? "" : " ✗"} | ${x.intentConf.toFixed(2)} | ${x.sollZiel ?? "—"} | ${x.ziel}${x.zielOk === false ? " ✗" : ""} | ${x.ms} |`).join("\n")}

## Noul-Fälle (Rote Linie; Soll: ${"≥0,5 = Veto"})

| Fall | Soll | Jev (p) | ok | ms |
| --- | --- | --- | --- | --- |
${erg.noul.map((x) => `| ${x.id} | ${x.soll ? "Veto" : "verhandelbar"} | ${x.p.toFixed(3)} | ${x.ok ? "✓" : "✗"} | ${x.ms} |`).join("\n")}

## Score-Fälle (Dringlichkeit, Toleranz ±1 Stufe)

| Fall | Soll-Stufe | Jev-Stufe (roh) | Conf | ok | ms |
| --- | --- | --- | --- | --- | --- |
${erg.score.map((x) => `| ${x.id} | ${x.sollStufe} | ${x.stufe} (${x.roh.toFixed(2)}) | ${x.conf.toFixed(2)} | ${x.ok ? "✓" : "✗"} | ${x.ms} |`).join("\n")}
`;

writeFileSync(join(HIER, "jev-test-ergebnis.md"), md);
console.log(`\nGeschrieben: ${join(HIER, "jev-test-ergebnis.md")}`);
console.log(`Intent ${(intentQuote * 100).toFixed(1)} % · Ziel ${(zielQuote * 100).toFixed(1)} % · Noul ${(noulQuote * 100).toFixed(1)} % · Score ${(scoreQuote * 100).toFixed(1)} % · Ø ${latenz.toFixed(0)} ms · ${tokensEin}+${tokensAus} Token`);
