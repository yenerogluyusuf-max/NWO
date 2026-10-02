#!/usr/bin/env node
// KI-Benchmark für Staatsräson: prüft die Sprachmodell-Anbieter aus anbieterliste.ts
// mit Aufgaben aus dem echten Spielbetrieb und den echten Prüfungen des Spiels.
//
// Ablauf:
//   1. Bündelt scripts/runner.ts mit rolldown (darin laufen systemText/zustandsText aus
//      ki/kontext.ts und leseAntwort/vorschau aus ki/aktionen.ts — also genau das, was das
//      Spiel tut; der Systemprompt ist derselbe, denselben Zustand sieht auch das Modell).
//   2. Findet Anbieter über Umgebungsvariablen (ANTHROPIC_API_KEY, MIMO_API_KEY,
//      DEEPSEEK_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, MISTRAL_API_KEY)
//      und lokale Server (Ollama auf :11434, Spiel-Standard auf 127.0.0.1:18127).
//   3. Spielt 21 Aufgaben je Anbieter durch: Befehle ausführen, Rat zu einem Ereignis,
//      Vertragsangebot formulieren, ehrlich ablehnen, was es nicht gibt, türkische Eingabe.
//   4. Bewertet: JSON-valide-Quote, Aktions-Korrektheit (vorschau() des Spiels muss die Aktion
//      ohne Problem akzeptieren UND sie muss der erwarteten entsprechen), Halluzinations-Quote
//      (erfundene IDs/Handlungen), Latenz, Kosten (Preistabelle unten, überschreibbar per ENV).
//   5. Schreibt ki-benchmark-ergebnis.md und ki-benchmark-roh.json.
//
// Aufruf:
//   node scripts/ki-benchmark.mjs                      # alle gefundenen Anbieter
//   node scripts/ki-benchmark.mjs --anbieter=ollama,deepseek
//   node scripts/ki-benchmark.mjs --liste              # nur zeigen, was gefunden wurde
//   OPENAI_MODELL=gpt-5 GEMINI_MODELL=gemini-3-flash node scripts/ki-benchmark.mjs
//   PREIS_DEEPSEEK_EIN=0.3 PREIS_DEEPSEEK_AUS=1.2 node scripts/ki-benchmark.mjs

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HIER = dirname(fileURLToPath(import.meta.url));
const GAME = join(HIER, "..");
const ARGV = process.argv.slice(2);
const arg = (name, fallback) => {
  const f = ARGV.find((a) => a.startsWith(`--${name}=`));
  return f ? f.split("=").slice(1).join("=") : fallback;
};
const flag = (name) => ARGV.includes(`--${name}`);

// --- Aufgaben aus dem echten Spielbetrieb -----------------------------------
const AUFGABEN = [
  { id: "b01", art: "befehl", eingabe: "Erhöhe den Mindestlohn auf 60.", erwarte: { art: "massnahme", id: "m_mindestlohn" } },
  { id: "b02", art: "befehl", eingabe: "Baue Wasserleitungen in Hatay und Adana.", erwarte: { art: "massnahme", id: "m_wasserleitungen" } },
  { id: "b03", art: "befehl", eingabe: "Senke die Mehrwertsteuer um 10 Punkte.", erwarte: { art: "massnahme", id: "m_mwst" } },
  { id: "b04", art: "befehl", eingabe: "Gipfeltreffen mit der EU.", erwarte: { art: "land", land: "EU", handlung: "gipfel" } },
  { id: "b05", art: "befehl", eingabe: "Handelsabkommen mit Aserbaidschan.", erwarte: { art: "land", land: "AZE", handlung: "handel" } },
  { id: "b06", art: "befehl", eingabe: "Führe ein Gespräch mit der CHP.", erwarte: { art: "fraktion", partei: "CHP", handlung: "gespraech" } },
  { id: "b07", art: "befehl", eingabe: "Handle eine Duldung mit der MHP aus.", erwarte: { art: "fraktion", partei: "MHP", handlung: "duldung" } },
  { id: "b08", art: "befehl", eingabe: "Entlasse den Finanzminister.", erwarte: { art: "figur", amt: "finanzen", handlung: "entlassen" } },
  { id: "b09", art: "befehl", eingabe: "Kritisiere die Zentralbank öffentlich.", erwarte: { art: "haushalt", handlung: "zentralbank_kritisieren" } },
  { id: "b10", art: "befehl", eingabe: "Starte den nächsten Programmschritt.", erwarte: { art: "programm" } },
  { id: "b11", art: "befehl", eingabe: "Ein Monat weiter.", erwarte: { art: "zeit" } },
  { id: "b12", art: "befehl", eingabe: "Ein Konjunkturprogramm: Gib insgesamt mehr aus.", erwarte: { art: "haushalt", handlung: "mehr_ausgeben" } },
  { id: "b13", art: "befehl", eingabe: "Beginne den Ausbau von Kappadokien als Vorhaben des Reiches.", erwarte: { art: "vorhaben", id: "ausbau_kappadokien" } },
  { id: "r01", art: "rat", eingabe: "Erkläre das offene Ereignis [{ereignisId}] in wenigen Sätzen: Worum geht es, welche Antwort hat welchen Preis und welche Nebenwirkung, und welche würdest du empfehlen (mit Begründung, neutral nach Wirkung im Spiel)? Schlage höchstens die empfohlene Antwort als Aktion vor." },
  { id: "f01", art: "frage", eingabe: "Wie stehe ich in den Umfragen, und welche Wählergruppen sind gerade verärgert?", erwarteKeineAktion: true },
  { id: "f02", art: "frage", eingabe: "Was ist mein nächster Schritt im Regierungsprogramm, und bin ich dafür bereit?", erwarteKeineAktion: true },
  { id: "f03", art: "frage", eingabe: "Wie ist das Verhältnis zu Russland, und welche Handlungen sind dort gerade möglich?", erwarteKeineAktion: true },
  { id: "e01", art: "ehrlich", eingabe: "Bau einen Hafen in Trabzon.", erwarteKeineAktion: true, notiz: "Freie Großprojekte gibt es nicht; erwartet ist eine ehrliche Absage ohne Aktion." },
  { id: "e02", art: "ehrlich", eingabe: "Erkläre Griechenland den Krieg und schicke Truppen.", erwarteKeineAktion: true, notiz: "Krieg gibt es nicht." },
  { id: "v01", art: "befehl", eingabe: "Biete Armenien einen Vertrag an: Wir öffnen die Grenze und gewähren Zollerleichterungen; im Gegenzug wollen wir die Bahnverbindung über unser Gebiet. Laufzeit fünf Jahre.", erwarte: { art: "abkommen", land: "ARM" }, notiz: "Prüft, ob Klausel-IDs (grenzoeffnung, zoll, w_transit) korrekt aus dem Katalog gewählt werden." },
  { id: "t01", art: "befehl", eingabe: "Asgari ücreti yüzde 25 artır.", erwarte: { art: "massnahme", id: "m_mindestlohn" }, notiz: "Türkische Eingabe." },
];

// --- Anbieter (Spiegel von anbieterliste.ts) + Preisschätzungen (USD/1 Mio. Token) ----------
const ANBIETER = [
  { id: "anthropic", name: "Claude (Anthropic)", protokoll: "anthropic", basis: "https://api.anthropic.com/v1", envVar: "ANTHROPIC_API_KEY", modell: "claude-sonnet-5-5", tokenFeld: "max_tokens", temperatur: null, preisEin: 3, preisAus: 15 },
  { id: "anthropic-haiku", name: "Claude Haiku 4.5", protokoll: "anthropic", basis: "https://api.anthropic.com/v1", envVar: "ANTHROPIC_API_KEY", modell: "claude-haiku-4-5-20251001", tokenFeld: "max_tokens", temperatur: null, preisEin: 1, preisAus: 5 },
  { id: "mimo", name: "Xiaomi MiMo", protokoll: "openai", basis: "https://api.xiaomimimo.com/v1", envVar: "MIMO_API_KEY", modell: "mimo-v2.6-flash", tokenFeld: "max_completion_tokens", temperatur: 0.3, extra: { thinking: { type: "disabled" } }, preisEin: 0.3, preisAus: 1 },
  { id: "deepseek", name: "DeepSeek", protokoll: "openai", basis: "https://api.deepseek.com", envVar: "DEEPSEEK_API_KEY", modell: "deepseek-v4-flash", tokenFeld: "max_tokens", temperatur: 0.3, preisEin: 0.3, preisAus: 1.2 },
  { id: "openai", name: "OpenAI", protokoll: "openai", basis: "https://api.openai.com/v1", envVar: "OPENAI_API_KEY", modell: process.env.OPENAI_MODELL ?? "", tokenFeld: "max_completion_tokens", temperatur: null, preisEin: 2, preisAus: 8 },
  { id: "gemini", name: "Google Gemini", protokoll: "openai", basis: "https://generativelanguage.googleapis.com/v1beta/openai", envVar: "GEMINI_API_KEY", modell: process.env.GEMINI_MODELL ?? "", tokenFeld: "max_tokens", temperatur: 0.3, preisEin: 0.3, preisAus: 2.5 },
  { id: "openrouter", name: "OpenRouter", protokoll: "openai", basis: "https://openrouter.ai/api/v1", envVar: "OPENROUTER_API_KEY", modell: process.env.OPENROUTER_MODELL ?? "", tokenFeld: "max_tokens", temperatur: 0.3, preisEin: 0.5, preisAus: 2 },
  { id: "mistral", name: "Mistral", protokoll: "openai", basis: "https://api.mistral.ai/v1", envVar: "MISTRAL_API_KEY", modell: process.env.MISTRAL_MODELL ?? "", tokenFeld: "max_tokens", temperatur: 0.3, preisEin: 0.4, preisAus: 1.2 },
];

async function ollamaModelle() {
  try {
    const r = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(2500) });
    if (!r.ok) return [];
    const j = await r.json();
    return (j.models ?? []).map((m) => m.name);
  } catch {
    return [];
  }
}

async function lokalerServer() {
  try {
    const r = await fetch("http://127.0.0.1:18127/v1/models", { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch {
    return false;
  }
}

async function findeAnbieter() {
  const gefunden = [];
  for (const a of ANBIETER) {
    const key = (process.env[a.envVar] ?? "").trim();
    if (!key) continue;
    if (!a.modell) continue; // Modellname muss per ENV nachgeliefert werden
    gefunden.push({ ...a, schluessel: key, preisEinProMio: Number(process.env[`PREIS_${a.id.toUpperCase()}_EIN`] ?? a.preisEin), preisAusProMio: Number(process.env[`PREIS_${a.id.toUpperCase()}_AUS`] ?? a.preisAus) });
  }
  const modelle = await ollamaModelle();
  for (const m of modelle.slice(0, 2)) {
    gefunden.push({ id: `ollama:${m}`, name: `Ollama lokal (${m})`, protokoll: "openai", basis: "http://localhost:11434/v1", modell: m, schluessel: "ollama", tokenFeld: "max_tokens", temperatur: 0.3, preisEinProMio: 0, preisAusProMio: 0 });
  }
  if (!modelle.length && (await lokalerServer())) {
    gefunden.push({ id: "lokal", name: "Lokaler Server (127.0.0.1:18127)", protokoll: "openai", basis: "http://127.0.0.1:18127/v1", modell: "local", schluessel: "", tokenFeld: "max_tokens", temperatur: 0.3, preisEinProMio: 0, preisAusProMio: 0 });
  }
  return gefunden;
}

// --- Bundle bauen -------------------------------------------------------------
function baueBundle() {
  mkdirSync(join(HIER, ".build"), { recursive: true });
  const ziel = join(HIER, ".build/runner.mjs");
  if (existsSync(ziel) && statSync(ziel).mtimeMs > statSync(join(HIER, "runner.ts")).mtimeMs) return;
  console.log("Bündle den Spielkern für den Benchmark (rolldown) …");
  execFileSync(join(GAME, "node_modules/.bin/rolldown"), [join(HIER, "runner.ts"), "-o", ziel, "-f", "esm", "-p", "node"], { stdio: "inherit" });
}

// --- Ergebnis-Markdown ----------------------------------------------------------
function bericht(roh, gefunden) {
  const erg = roh.ergebnisse;
  const jeAnbieter = new Map();
  for (const e of erg) {
    if (!jeAnbieter.has(e.anbieter)) jeAnbieter.set(e.anbieter, []);
    jeAnbieter.get(e.anbieter).push(e);
  }
  const pct = (x) => `${(x * 100).toFixed(0)} %`;
  const zeilen = [];
  for (const [id, liste] of jeAnbieter) {
    const a = gefunden.find((g) => g.id === id);
    const ok = liste.filter((e) => e.ok);
    const fehler = liste.filter((e) => !e.ok);
    const jsonQ = ok.length ? ok.filter((e) => e.jsonValide).length / ok.length : 0;
    // Befehle (Soll-Aktion) getrennt von den Fällen, in denen bewusst KEINE Aktion erwartet wird
    const befehle = ok.filter((e) => e.art === "befehl" && e.treffer !== null);
    const korrektQ = befehle.length ? befehle.filter((e) => e.treffer).length / befehle.length : 0;
    const ohne = ok.filter((e) => (e.art === "frage" || e.art === "ehrlich") && e.treffer !== null);
    const ohneQ = ohne.length ? ohne.filter((e) => e.treffer).length / ohne.length : 0;
    const aktionenGesamt = ok.reduce((s, e) => s + e.aktionen, 0);
    const hallQ = aktionenGesamt ? ok.reduce((s, e) => s + e.halluzinationen.length, 0) / aktionenGesamt : 0;
    const ausfQ = aktionenGesamt ? ok.reduce((s, e) => s + e.aktionenAusfuehrbar, 0) / aktionenGesamt : 0;
    const lat = ok.length ? ok.reduce((s, e) => s + e.ms, 0) / ok.length : 0;
    const kosten = ok.reduce((s, e) => s + e.kosten, 0);
    const proAufgabe = ok.length ? kosten / ok.length : 0;
    zeilen.push({
      id,
      name: a?.name ?? id,
      modell: ok[0]?.modell ?? a?.modell ?? "?",
      aufgaben: liste.length,
      fehler: fehler.length,
      jsonQ,
      korrektQ,
      ohneQ,
      befehleN: befehle.length,
      ohneN: ohne.length,
      hallQ,
      ausfQ,
      lat,
      proAufgabe,
      sitzung50: proAufgabe * 50,
    });
  }
  zeilen.sort((a, b) => b.korrektQ - a.korrektQ || a.proAufgabe - b.proAufgabe);
  const detailTabellen = [...jeAnbieter.entries()].map(([id, liste]) => {
    const a = gefunden.find((g) => g.id === id);
    return `\n### ${a?.name ?? id} — Einzelergebnisse\n\n| Aufgabe | Art | JSON | Treffer | Aktionen (ausführbar) | Halluzination | ms | Kosten | Antwortanfang / Fehler |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n` +
      liste.map((e) => `| ${e.aufgabe} | ${e.art} | ${e.ok ? (e.jsonValide ? "✓" : "✗") : "—"} | ${e.treffer === null ? "—" : e.treffer ? "✓" : "✗"} | ${e.aktionen} (${e.aktionenAusfuehrbar}) | ${e.halluzinationen.length ? e.halluzinationen.join("; ") : "—"} | ${e.ms} | ${e.kosten ? e.kosten.toFixed(4) : "0"} | ${(e.fehler ?? e.antwortKurz).replace(/\|/g, "\\|").slice(0, 140)} |`).join("\n");
  }).join("\n");
  return `# KI-Benchmark — Ergebnis

Datum: ${roh.datum} · Aufgaben je Anbieter: ${AUFGABEN.length} · Systemprompt und Prüfung echt aus dem Spiel (kontext.ts / aktionen.ts)
Preise: Schätzwerte aus der Skript-Konfiguration (per ENV PREIS_<ANBIETER>_EIN/AUS überschreibbar); lokale Modelle kosten 0.

## Übersicht (sortiert nach Aktions-Korrektheit)

| Anbieter | Modell | Fehler | JSON valide | Befehl korrekt* | Keine-Aktion korrekt | ausführbar** | Halluzination | Ø Latenz | Kosten/Aufgabe | Kosten/Sitzung (50 Aufrufe) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${zeilen.map((z) => `| ${z.name} | ${z.modell} | ${z.fehler}/${z.aufgaben} | ${pct(z.jsonQ)} | ${pct(z.korrektQ)} (${z.befehleN}) | ${pct(z.ohneQ)} (${z.ohneN}) | ${pct(z.ausfQ)} | ${pct(z.hallQ)} | ${z.lat.toFixed(0)} ms | ${z.proAufgabe.toFixed(4)} USD | ${z.sitzung50.toFixed(2)} USD |`).join("\n")}

\\* „Befehl korrekt": Anteil der Befehlsaufgaben, bei denen mindestens eine Aktion der erwarteten entspricht UND vorschau() des Spiels kein Problem meldet (Kapital, Mehrheit, Abkühlzeit eingerechnet); in Klammern die Zahl der Befehlsaufgaben. „Keine-Aktion korrekt": Anteil der Frage-/Ehrlichkeitsaufgaben ohne vorgeschlagene Aktion.
\\*\\* „ausführbar": Anteil aller vorgeschlagenen Aktionen, die vorschau() akzeptiert.

${detailTabellen}
`;
}

// --- Hauptteil ------------------------------------------------------------------
baueBundle();
const gefunden = await findeAnbieter();
const nur = arg("anbieter", "") ? arg("anbieter", "").split(",").map((s) => s.trim()) : null;
const auswahl = nur ? gefunden.filter((g) => nur.some((n) => g.id.startsWith(n))) : gefunden;
const nurAufgaben = arg("aufgaben", "") ? arg("aufgaben", "").split(",").map((s) => s.trim()) : null;
const aufgaben = nurAufgaben ? AUFGABEN.filter((a) => nurAufgaben.includes(a.id)) : AUFGABEN;

if (flag("liste")) {
  console.log("Gefundene Anbieter:");
  for (const g of gefunden) console.log(`  ${g.id}  (${g.name}, Modell: ${g.modell})`);
  if (!gefunden.length) console.log("  — keine —");
  process.exit(0);
}

if (!auswahl.length) {
  console.log(`Kein Anbieter verfügbar — der Benchmark wird NICHT ausgeführt.

Gefunden wurde: nichts (keine API-Schlüssel in der Umgebung, kein Ollama-Modell, kein lokaler Server auf 127.0.0.1:18127).

So führst du den Benchmark aus:
  • Cloud-Anbieter: Schlüssel setzen, z. B.
      export ANTHROPIC_API_KEY=sk-ant-...     # deckt Claude Sonnet + Haiku ab
      export DEEPSEEK_API_KEY=...
      export GEMINI_API_KEY=... GEMINI_MODELL=gemini-3-flash
      export OPENAI_API_KEY=... OPENAI_MODELL=<name aus dem Konto>
      export MIMO_API_KEY=... / OPENROUTER_API_KEY=... (+ OPENROUTER_MODELL) / MISTRAL_API_KEY=... (+ MISTRAL_MODELL)
  • Lokal & kostenlos: Ollama ist installiert, aber es ist kein Modell geladen:
      ollama pull qwen3:8b        # oder llama3.1:8b / mistral:7b
      ollama serve                # falls der Dienst nicht läuft
  • Dann:
      node game/scripts/ki-benchmark.mjs                  # alle Anbieter
      node game/scripts/ki-benchmark.mjs --anbieter=ollama
  • Ergebnis: game/scripts/ki-benchmark-ergebnis.md (+ ki-benchmark-roh.json)

Die Suite umfasst ${AUFGABEN.length} Aufgaben je Anbieter: 14 Befehle (Maßnahme, Land, Fraktion, Figur,
Haushalt, Programm, Zeit, Reichs-Vorhaben, Vertragsangebot mit Klauseln, türkische Eingabe),
1 Ereignis-Rat, 3 Lage-Fragen, 2 Ehrlichkeits-Proben (Hafen in Trabzon, Krieg mit Griechenland).`);
  process.exit(0);
}

const konf = { anbieter: auswahl, aufgaben, ausJson: join(HIER, "ki-benchmark-roh.json") };
writeFileSync(join(HIER, ".build/bench-konfig.json"), JSON.stringify(konf, null, 2));
console.log(`Starte Benchmark für: ${auswahl.map((a) => a.id).join(", ")} (${aufgaben.length} Aufgaben je Anbieter)`);
execFileSync(process.execPath, [join(HIER, ".build/runner.mjs"), "benchmark", join(HIER, ".build/bench-konfig.json")], { stdio: "inherit", maxBuffer: 64 * 1024 * 1024 });
const roh = JSON.parse(readFileSync(join(HIER, "ki-benchmark-roh.json"), "utf-8"));
writeFileSync(join(HIER, "ki-benchmark-ergebnis.md"), bericht(roh, auswahl));
console.log(`\nGeschrieben: ${join(HIER, "ki-benchmark-ergebnis.md")}`);
