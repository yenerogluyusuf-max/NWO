// Konsolen-Einstieg für die Skripte jev-test.mjs und ki-benchmark.mjs.
// Wird mit rolldown zu scripts/.build/runner.mjs gebündelt, damit die Skripte die echten
// Funktionen des Spiels benutzen (kontext.ts, aktionen.ts, world.ts) statt Kopien.
//
// Aufruf:
//   node .build/runner.mjs katalog                      → JSON des Handlungskatalogs auf stdout
//   node .build/runner.mjs benchmark <konfig.json>      → führt den KI-Benchmark aus
//   node .build/runner.mjs zustand                      → Beispiel-Zustandstext auf stdout

import { NET } from "../src/sim/modell";
import { LAENDER, AKTIONEN } from "../src/sim/laender";
import { POSTEN } from "../src/sim/haushalt";
import { VORHABEN } from "../src/data/reich";
import { KLAUSELN, PROFILE } from "../src/data/abkommen";
import { systemText, zustandsText } from "../src/ki/kontext";
import { leseAntwort, vorschau } from "../src/ki/aktionen";
import { createWorld, advance } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { vermittlungen } from "../src/sim/abkommen";
import { NET as NET2 } from "../src/sim/modell";
import { kantenCsv, knotenCsv, netzJson } from "../src/sim/netzexport";
import type { World } from "../src/sim/types";
import type { KiAktion } from "../src/ki/typen";

const SEED = 42042;

function neueWelt(): World {
  const w = createWorld(turkey2026, SEED);
  startAfterElection(w, schnellProfil());
  return w;
}

// ---------------------------------------------------------------------------
// Katalog

function katalog() {
  const massnahmen = NET.nodes.filter((n) => n.kind === "massnahme").map((n) => ({ id: n.id, name: n.name }));
  const laender = LAENDER.map((l) => ({ id: l.id, name: l.name }));
  const posten = POSTEN.map((p) => ({ id: p.id, name: p.name, seite: p.seite }));
  const vorhaben = VORHABEN.map((v) => ({ id: v.id, name: v.name }));
  const klauseln = KLAUSELN.map((k) => ({ id: k.id, name: k.name, seite: k.seite }));
  const klauselnJeLand = LAENDER.map((l) => {
    const werte = PROFILE[l.id]?.werte ?? {};
    return {
      land: l.id,
      bieten: Object.keys(werte).filter((id) => KLAUSELN.find((k) => k.id === id)?.seite === "gibt"),
      verlangen: Object.keys(werte).filter((id) => KLAUSELN.find((k) => k.id === id)?.seite === "will"),
    };
  });
  const landHandlungen = Object.keys(AKTIONEN);
  return {
    massnahmen,
    laender,
    posten,
    vorhaben,
    klauseln,
    klauselnJeLand,
    landHandlungen,
    fraktionsHandlungen: ["gespraech", "zugestaendnis", "duldung", "koalition", "abwerben"],
    haushaltHandlungen: ["posten", "mehr_ausgeben", "sparen", "zentralbank_kritisieren", "zentralbank_fuehrung_tauschen"],
    figurAemter: ["finanzen", "inneres", "aussen", "stab"],
    systemText: systemText(),
  };
}

// ---------------------------------------------------------------------------
// Benchmark

interface AnbieterKonfig {
  id: string;
  name: string;
  protokoll: "anthropic" | "openai";
  basis: string;
  modell: string;
  schluessel: string;
  tokenFeld: "max_tokens" | "max_completion_tokens";
  temperatur: number | null;
  extra?: Record<string, unknown>;
  preisEinProMio?: number; // USD je 1 Mio. Eingabe-Token (Schätzung aus der Skript-Konfig)
  preisAusProMio?: number;
}

interface Aufgabe {
  id: string;
  art: "befehl" | "frage" | "ehrlich" | "rat";
  eingabe: string;
  /** Bei befehl: mindestens eine Aktion muss diesem Muster entsprechen */
  erwarte?: { art: string; id?: string; handlung?: string; land?: string; partei?: string; amt?: string };
  /** Bei ehrlich/frage: es darf keine ausführbare Aktion vorgeschlagen werden */
  erwarteKeineAktion?: boolean;
  notiz?: string;
}

interface BenchKonfig {
  anbieter: AnbieterKonfig[];
  aufgaben: Aufgabe[];
  ausJson: string;
  maxTokens?: number;
  zeitlimitMs?: number;
  wiederholungen?: number;
}

const MAX_TOKENS = 900; // wie gespraech.ts

function passt(a: KiAktion, e: NonNullable<Aufgabe["erwarte"]>): boolean {
  const o = a as unknown as Record<string, unknown>;
  if (a.art !== e.art) return false;
  if (e.id !== undefined && o.id !== e.id) return false;
  if (e.handlung !== undefined && o.handlung !== e.handlung) return false;
  if (e.land !== undefined && o.land !== e.land) return false;
  if (e.partei !== undefined && String(o.partei ?? "").toUpperCase() !== e.partei.toUpperCase()) return false;
  if (e.amt !== undefined && o.amt !== e.amt) return false;
  return true;
}

/** Zählt Aktionen mit erfundenen IDs/Handlungen (Halluzination) — vor der Spielprüfung. */
function halluzination(a: KiAktion): string | null {
  switch (a.art) {
    case "massnahme": {
      const i = NET2.index.get(a.id);
      const n = i === undefined ? undefined : NET2.nodes[i];
      if (!n || n.kind !== "massnahme") return `erfundene Maßnahmen-ID „${a.id}“`;
      return null;
    }
    case "land":
      if (!LAENDER.find((l) => l.id === a.land)) return `erfundenes Land „${a.land}“`;
      if (!(a.handlung in AKTIONEN)) return `erfundene Länder-Handlung „${a.handlung}“`;
      return null;
    case "fraktion":
      if (!["gespraech", "zugestaendnis", "duldung", "koalition", "abwerben"].includes(a.handlung)) return `erfundene Fraktions-Handlung „${a.handlung}“`;
      return null;
    case "figur":
      if (!["finanzen", "inneres", "aussen", "stab"].includes(a.amt)) return `erfundenes Amt „${a.amt}“`;
      if (!["gespraech", "entlassen"].includes(a.handlung)) return `erfundene Figur-Handlung „${a.handlung}“`;
      return null;
    case "haushalt":
      if (!["posten", "mehr_ausgeben", "sparen", "zentralbank_kritisieren", "zentralbank_fuehrung_tauschen"].includes(a.handlung)) return `erfundene Haushaltshandlung „${a.handlung}“`;
      if (a.handlung === "posten" && a.posten && !POSTEN.find((p) => p.id === a.posten)) return `erfundener Haushaltsposten „${a.posten}“`;
      return null;
    case "vorhaben":
      if (!VORHABEN.find((v) => v.id === a.id)) return `erfundenes Vorhaben „${a.id}“`;
      return null;
    case "abkommen": {
      if (!LAENDER.find((l) => l.id === a.land)) return `erfundenes Land „${a.land}“`;
      for (const id of [...a.bieten, ...a.verlangen]) if (!KLAUSELN.find((k) => k.id === id)) return `erfundene Klausel „${id}“`;
      return null;
    }
    case "vermittlung":
      if (!["ukr_rus", "arm_aze"].includes(a.id)) return `erfundene Vermittlung „${a.id}“`;
      return null;
    default:
      return null;
  }
}

async function rufeAnbieter(an: AnbieterKonfig, system: string, benutzer: string, zeitlimitMs: number): Promise<{ text: string; ein: number; aus: number; ms: number; modell: string }> {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), zeitlimitMs);
  try {
    let url: string;
    let kopf: Record<string, string>;
    let body: unknown;
    if (an.protokoll === "anthropic") {
      url = `${an.basis}/messages`;
      kopf = { "content-type": "application/json", "x-api-key": an.schluessel, "anthropic-version": "2023-06-01" };
      body = { model: an.modell, max_tokens: MAX_TOKENS, system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }], messages: [{ role: "user", content: benutzer }] };
    } else {
      url = `${an.basis}/chat/completions`;
      kopf = { "content-type": "application/json" };
      if (an.schluessel) kopf["authorization"] = `Bearer ${an.schluessel}`;
      body = {
        model: an.modell,
        [an.tokenFeld]: MAX_TOKENS,
        ...(an.temperatur !== null ? { temperature: an.temperatur } : {}),
        ...(an.extra ?? {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: benutzer },
        ],
      };
    }
    const r = await fetch(url, { method: "POST", headers: kopf, body: JSON.stringify(body), signal: ctrl.signal });
    const roh = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${roh.slice(0, 300)}`);
    const j = JSON.parse(roh);
    if (an.protokoll === "anthropic") {
      const t = (j.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text?: string }) => b.text ?? "").join("");
      return { text: t, ein: j.usage?.input_tokens ?? 0, aus: j.usage?.output_tokens ?? 0, ms: Date.now() - t0, modell: j.model ?? an.modell };
    }
    const c = j.choices?.[0]?.message?.content;
    const t = typeof c === "string" ? c : Array.isArray(c) ? c.map((x: { text?: string }) => x?.text ?? "").join("") : "";
    return { text: t, ein: j.usage?.prompt_tokens ?? 0, aus: j.usage?.completion_tokens ?? 0, ms: Date.now() - t0, modell: j.model ?? an.modell };
  } finally {
    clearTimeout(timer);
  }
}

interface Ergebnis {
  anbieter: string;
  modell: string;
  aufgabe: string;
  art: string;
  ok: boolean;
  jsonValide: boolean;
  aktionen: number;
  aktionenAusfuehrbar: number;
  halluzinationen: string[];
  treffer: boolean | null; // bei befehl: erwartete Aktion dabei und ausführbar
  fehler?: string;
  ms: number;
  tokensEin: number;
  tokensAus: number;
  kosten: number;
  antwortKurz: string;
}

async function benchmark(konf: BenchKonfig) {
  const zeitlimit = konf.zeitlimitMs ?? 60_000;
  const { writeFileSync, readFileSync, existsSync } = await import("node:fs");
  // Fortsetzen: Schon gemessene Paare (Anbieter × Aufgabe) werden übersprungen, Ergebnisse angehängt
  let ergebnisse: Ergebnis[] = [];
  if (existsSync(konf.ausJson)) {
    try {
      ergebnisse = (JSON.parse(readFileSync(konf.ausJson, "utf-8")) as { ergebnisse: Ergebnis[] }).ergebnisse ?? [];
    } catch {
      ergebnisse = [];
    }
  }
  const fertig = new Set(ergebnisse.map((e) => `${e.anbieter}|${e.aufgabe}`));
  const system = systemText();
  for (const an of konf.anbieter) {
    for (const aufgabe of konf.aufgaben) {
      if (fertig.has(`${an.id}|${aufgabe.id}`)) {
        console.error(`[${an.id}] ${aufgabe.id}: übersprungen (schon gemessen)`);
        continue;
      }
      const w = neueWelt(); // jede Aufgabe aus demselben, sauberen Ausgangszustand
      let eingabe = aufgabe.eingabe;
      if (aufgabe.art === "rat") {
        // Bis zum ersten echten Ereignis vorspulen (höchstens 240 Tage), damit die Rat-Frage ein Ziel hat
        let offen = w.spiel?.ereignisse.filter((ev) => !ev.vorlage.startsWith("start_"))[0];
        let tage = 0;
        while (!offen && tage < 240 && !w.spiel?.ende) {
          advance(w, 7);
          tage += 7;
          offen = w.spiel?.ereignisse.filter((ev) => !ev.vorlage.startsWith("start_"))[0];
        }
        if (!offen) {
          ergebnisse.push({ anbieter: an.id, modell: an.modell, aufgabe: aufgabe.id, art: aufgabe.art, ok: false, jsonValide: false, aktionen: 0, aktionenAusfuehrbar: 0, halluzinationen: [], treffer: null, fehler: "kein offenes Ereignis im Ausgangszustand", ms: 0, tokensEin: 0, tokensAus: 0, kosten: 0, antwortKurz: "" });
          continue;
        }
        eingabe = eingabe.replace("{ereignisId}", offen.id);
      }
      const benutzer = `${zustandsText(w)}\n\nAUFTRAG DES SPIELERS:\n${eingabe}`;
      try {
        const roh = await rufeAnbieter(an, system, benutzer, zeitlimit);
        const g = leseAntwort(roh.text);
        const hall = g.aktionen.map(halluzination).filter((x): x is string => x !== null);
        const vorschauen = g.aktionen.map((a) => vorschau(w, a));
        const ausfuehrbar = vorschauen.filter((v) => !v.problem).length;
        let treffer: boolean | null = null;
        if (aufgabe.erwarte) {
          treffer = g.aktionen.some((a, i) => passt(a, aufgabe.erwarte!) && !vorschauen[i]!.problem);
        } else if (aufgabe.erwarteKeineAktion) {
          treffer = g.aktionen.length === 0;
        }
        const kosten = ((roh.ein * (an.preisEinProMio ?? 0)) + (roh.aus * (an.preisAusProMio ?? 0))) / 1_000_000;
        ergebnisse.push({
          anbieter: an.id,
          modell: roh.modell,
          aufgabe: aufgabe.id,
          art: aufgabe.art,
          ok: true,
          jsonValide: g.gelesen,
          aktionen: g.aktionen.length,
          aktionenAusfuehrbar: ausfuehrbar,
          halluzinationen: hall,
          treffer,
          ms: roh.ms,
          tokensEin: roh.ein,
          tokensAus: roh.aus,
          kosten,
          antwortKurz: (g.antwort || roh.text).slice(0, 220).replace(/\s+/g, " "),
        });
        console.error(`[${an.id}] ${aufgabe.id}: json=${g.gelesen} treffer=${treffer} hall=${hall.length} ${roh.ms}ms`);
      } catch (e) {
        ergebnisse.push({ anbieter: an.id, modell: an.modell, aufgabe: aufgabe.id, art: aufgabe.art, ok: false, jsonValide: false, aktionen: 0, aktionenAusfuehrbar: 0, halluzinationen: [], treffer: null, fehler: (e as Error).message.slice(0, 300), ms: 0, tokensEin: 0, tokensAus: 0, kosten: 0, antwortKurz: "" });
        console.error(`[${an.id}] ${aufgabe.id}: FEHLER ${(e as Error).message.slice(0, 120)}`);
      }
    }
  }
  writeFileSync(konf.ausJson, JSON.stringify({ datum: new Date().toISOString(), system, ergebnisse }, null, 2));
  console.log(JSON.stringify({ geschrieben: konf.ausJson, anzahl: ergebnisse.length }));
}

// ---------------------------------------------------------------------------

const [, , cmd, arg] = process.argv;
if (cmd === "katalog") {
  console.log(JSON.stringify(katalog(), null, 2));
} else if (cmd === "netzexport") {
  // Maschinenlesbarer Abzug des Politiknetzes (INN-1): Kanten mit Form und Begründung, Knoten mit Preisen
  if (arg === "csv") process.stdout.write(kantenCsv());
  else if (arg === "knoten-csv") process.stdout.write(knotenCsv());
  else process.stdout.write(netzJson());
} else if (cmd === "zustand") {
  const w = neueWelt();
  console.log(zustandsText(w));
  const v = vermittlungen(w);
  console.error(`Vermittlungen: ${v.map((x) => x.def.id).join(", ")}`);
} else if (cmd === "benchmark") {
  if (!arg) throw new Error("benchmark braucht den Pfad einer Konfigurations-JSON");
  const { readFileSync } = await import("node:fs");
  const konf = JSON.parse(readFileSync(arg, "utf-8")) as BenchKonfig;
  await benchmark(konf);
} else {
  console.error("Aufruf: runner.mjs katalog | zustand | netzexport [json|csv|knoten-csv] | benchmark <konfig.json>");
  process.exit(1);
}
