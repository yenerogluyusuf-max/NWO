#!/usr/bin/env node
// Export des Politiknetzes als prüfbare Tabelle (INN-1: Datenhaltung maschinenlesbar).
//
// Was das Skript tut:
//   1. Bündelt scripts/runner.ts mit rolldown (wie ki-benchmark.mjs), damit der Export
//      exakt die Daten des Spiels ausgibt — keine Kopie, kein Abgleich von Hand.
//   2. Schreibt die Kanten (mit Form, Parametern und Begründung) und die Knoten
//      (mit Rücklauf, Trägheit und den vier Preisen) als CSV und JSON.
//
// Aufruf:
//   node scripts/netz-export.mjs                      # schreibt scripts/netz-kanten.csv/.json und netz-knoten.csv
//   node scripts/netz-export.mjs --ziel=/tmp/netz     # schreibt /tmp/netz-kanten.csv usw.
//   node scripts/netz-export.mjs --format=csv         # nur CSV (Standard: beide)
//
// Alle Werte sind Spielparameter, keine Messwerte — Grundlage für die Kalibrierung (WIR-1).

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HIER = dirname(fileURLToPath(import.meta.url));
const GAME = join(HIER, "..");
const ARGV = process.argv.slice(2);
const arg = (name, fallback) => {
  const f = ARGV.find((a) => a.startsWith(`--${name}=`));
  return f ? f.split("=").slice(1).join("=") : fallback;
};

// --- Spielkern bündeln (derselbe Weg wie ki-benchmark.mjs) ---------------------
function runnerBauen() {
  mkdirSync(join(HIER, ".build"), { recursive: true });
  const ziel = join(HIER, ".build/runner.mjs");
  const quellen = [join(HIER, "runner.ts"), join(GAME, "src/sim/netzexport.ts"), join(GAME, "src/data/politiknetz.ts")];
  if (existsSync(ziel) && quellen.every((q) => statSync(ziel).mtimeMs > statSync(q).mtimeMs)) return;
  console.log("Bündle den Spielkern für den Export (rolldown) …");
  execFileSync(join(GAME, "node_modules/.bin/rolldown"), [join(HIER, "runner.ts"), "-o", ziel, "-f", "esm", "-p", "node"], { stdio: "inherit" });
}

runnerBauen();

const basis = arg("ziel", join(HIER, "netz"));
const format = arg("format", "beide");
const runner = join(HIER, ".build/runner.mjs");
const aus = (cmd) => execFileSync("node", [runner, "netzexport", cmd], { maxBuffer: 64 * 1024 * 1024 });

const geschrieben = [];
if (format === "csv" || format === "beide") {
  writeFileSync(`${basis}-kanten.csv`, aus("csv"));
  writeFileSync(`${basis}-knoten.csv`, aus("knoten-csv"));
  geschrieben.push(`${basis}-kanten.csv`, `${basis}-knoten.csv`);
}
if (format === "json" || format === "beide") {
  writeFileSync(`${basis}.json`, aus("json"));
  geschrieben.push(`${basis}.json`);
}
for (const p of geschrieben) console.log(`geschrieben: ${p}`);
