// Wiederholbare Spielbarkeitsmessung (Analyse vom 29.09.2026).
// Benutzung: Datei nach game/test/ kopieren und ausführen:
//   cd game && cp ../analyse_2026-09-29/messungen.test.ts test/zz_messungen.test.ts
//   MESSUNG_OUT=../analyse_2026-09-29/messungen_ausgabe.txt npx vitest run test/zz_messungen.test.ts
//   rm test/zz_messungen.test.ts
// Die Datei verändert nichts am Spiel; sie liest nur den Simulationskern.

import { appendFileSync, writeFileSync } from "node:fs";
import { test } from "vitest";
import { createWorld, advance, NET, setFiscalImpulse, setPolicy } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { activeProvinces, nationalAverage, policyCost, PROVINCES } from "../src/sim/netz";
import { befehl } from "../src/sim/befehle";
import { outlook } from "../src/sim/forecast";
import { REGIONAL } from "../src/sim/regional";
import type { World } from "../src/sim/types";

const AUS = process.env.MESSUNG_OUT ?? "messungen_ausgabe.txt";
writeFileSync(AUS, "");
const out = (s = "") => appendFileSync(AUS, s + "\n");

const profil: PlayerProfile = {
  name: "Test", heimat: "Ankara", heimatPlaka: 6, jugend: "", beruf: "", partner: "", motiv: "",
  partei: { name: "Partei der Werte", kurz: "PW", farbe: "#2e6b3f" }, naehe: {}, versprechen: [], wahl: { runde: 2, anteil: 51 },
};
const neu = (seed = 42): World => { const w = createWorld(turkey2026, seed); startAfterElection(w, profil); return w; };
const akut = (w: World) => NET.nodes.filter((n) => n.kind === "problem" && activeProvinces(NET, w.net, n.id).length > 0).length;
const zeile = (w: World, label: string) => {
  const e = w.economy;
  out(`${label.padEnd(10)} ${w.date} | Infl ${e.inflation.toFixed(1).padStart(5)} | Wachst ${e.growth.toFixed(1).padStart(5)} | AL ${e.unemployment.toFixed(1).padStart(5)} | Lira ${e.usdTry.toFixed(1).padStart(6)} | Zins ${String(e.policyRate).padStart(5)} | Schuld ${e.debtRatio.toFixed(1).padStart(5)} | Risiko ${e.riskPremium.toFixed(0).padStart(4)} | Vertrauen ${nationalAverage(NET, w.net, "vertrauen_regierung").toFixed(1).padStart(5)} | akute Probleme ${akut(w)} | Logeinträge ${w.log.length}`);
};

test("1 Verläufe: nichts tun, Extreme", () => {
  out("== 1. Fünf Jahre ohne Eingabe (Seed 42) ==");
  let w = neu(); zeile(w, "Start");
  for (let y = 1; y <= 5; y++) { advance(w, 365); zeile(w, `Jahr ${y}`); }
  out("\n== 1b. Ausgaben +20 %-Punkte des BIP und gefügige Zentralbank ==");
  w = neu(); befehl("Entlasse den Gouverneur, ersetze ihn", w); setFiscalImpulse(w, 20); zeile(w, "Start");
  for (let y = 1; y <= 5; y++) { advance(w, 365); zeile(w, `Jahr ${y}`); }
  out("\n== 1c. Alle Maßnahmen auf 100 ==");
  w = neu(); for (const n of NET.nodes) if (n.kind === "massnahme") setPolicy(w, n.id, 100); zeile(w, "Start");
  for (let y = 1; y <= 5; y++) { advance(w, 365); zeile(w, `Jahr ${y}`); }
});

test("2 Kosten und Einzelwirkung auf das Vertrauen", () => {
  out("\n== 2. Maßnahmen und Kosten ==");
  const m = NET.nodes.filter((n) => n.kind === "massnahme");
  out(`Maßnahmen: ${m.length}, davon mit Kosten: ${m.filter((n) => n.cost).length}; Kanten: ${NET.edges.length}`);
  const absW = NET.edges.map((e) => Math.abs(e.weight)).sort((a, b) => a - b);
  out(`Kantengewicht |w|: Median ${absW[Math.floor(absW.length / 2)]!.toFixed(3)}, Maximum ${absW[absW.length - 1]!.toFixed(2)}`);
  const passiv = (() => { const w = neu(1); advance(w, 365 * 3); return nationalAverage(NET, w.net, "vertrauen_regierung"); })();
  const res = m.map((n) => { const w = neu(1); setPolicy(w, n.id, 100); advance(w, 365 * 3); return { name: n.name, v: nationalAverage(NET, w.net, "vertrauen_regierung"), kosten: policyCost(NET, w.net) }; }).sort((a, b) => b.v - a.v);
  out(`Vertrauen nach 3 Jahren ohne Eingabe: ${passiv.toFixed(1)}. Beste Einzelmaßnahmen (Stufe 100):`);
  for (const r of res.slice(0, 8)) out(`  ${r.name.padEnd(46)} Vertrauen ${r.v.toFixed(1)}  Kosten ${r.kosten.toFixed(2)} % BIP`);
});

test("3 Abdeckung des Gesprächs", () => {
  out("\n== 3. Gespräch: 40 natürliche Eingaben ==");
  const eingaben = [
    "krieg", "Wir erklären Syrien den Krieg", "Truppen nach Syrien schicken", "Verhandle mit der EU", "Rede an die Nation halten",
    "Neuwahlen ausrufen", "Minister entlassen", "Neues Kabinett bilden", "Bau einen neuen Flughafen in Istanbul", "Kanal Istanbul bauen",
    "Erdbebenhilfe für Hatay", "Steuern erhöhen", "Erhöhe die Steuern", "Senke die Mehrwertsteuer", "Mehrwertsteuer senken",
    "Rentner sollen mehr bekommen", "Erhöhe die Renten", "Mehr Geld für Bildung", "Baue Schulen", "Ich möchte die Arbeitslosigkeit senken",
    "Wie ist die Stimmung im Land?", "Wie stehe ich in den Umfragen?", "Was sagt die Opposition?", "Habe ich eine Mehrheit im Parlament?",
    "Lass mich mit dem Zentralbankchef sprechen", "Was soll ich als Nächstes tun?", "Was ist das größte Problem?", "Hilfe",
    "Erhöhe den Mindestlohn", "Erhoehe den Mindestlohn", "Mindestlohn auf 80", "Mindestlohn senken",
    "Wasserleitungen bauen", "Erhöhe die Wasserleitungen", "Kritisiere die Zentralbank", "Entlasse den Zentralbankchef",
    "Zinsen senken", "30 Tage weiter", "ein Jahr weiter", "weiter",
  ];
  let ok = 0;
  for (const t of eingaben) {
    const r = befehl(t, neu(1));
    if (r.ok) ok++;
    out((r.ok ? "angenommen  " : "abgelehnt   ") + `„${t}“`.padEnd(46) + " -> " + r.text.replace(/\s+/g, " ").slice(0, 90));
  }
  out(`angenommen: ${ok} von ${eingaben.length} (die Ausführung kann trotzdem falsch sein, siehe Zeilen mit Mehrwertsteuer, Rede halten, Erdbebenhilfe)`);
});

test("4 Regionale Tiefe", () => {
  out("\n== 4. Regionale Tiefe des Politiknetzes ==");
  const w = neu(1);
  const spread = (ww: World, i: number) => { let mn = 1e9, mx = -1e9; for (let p = 0; p < PROVINCES; p++) { const v = ww.net.values[i * PROVINCES + p]!; mn = Math.min(mn, v); mx = Math.max(mx, v); } return mx - mn; };
  const art: Record<string, [number, number]> = {};
  NET.nodes.forEach((n, i) => { const k = (art[n.kind] ??= [0, 0]); k[1]++; if (spread(w, i) > 0.5) k[0]++; });
  out(`Knoten mit regionaler Streuung > 0,5 Indexpunkte beim Start: ${Object.values(art).reduce((a, b) => a + b[0], 0)} von ${NET.nodes.length}`);
  for (const [k, [a, b]] of Object.entries(art)) out(`   ${k.padEnd(10)} ${a} von ${b}`);
  out(`Knoten mit eigener Regionalformel: ${Object.keys(REGIONAL).length}`);
  const w2 = neu(1); setPolicy(w2, "m_wasserleitungen", 90); advance(w2, 365 * 3);
  const w0 = neu(1); advance(w0, 365 * 3);
  const i = NET.index.get("wasserversorgung")!;
  const d = Array.from({ length: PROVINCES }, (_, p) => w2.net.values[i * PROVINCES + p]! - w0.net.values[i * PROVINCES + p]!);
  out(`Wasserleitungen auf 90: Wirkung auf die Wasserversorgung nach 3 Jahren, kleinste Provinz ${Math.min(...d).toFixed(2)}, größte ${Math.max(...d).toFixed(2)}`);
  out("Akute Probleme beim Start:");
  for (const pr of NET.nodes.filter((n) => n.kind === "problem")) { const c = activeProvinces(NET, w.net, pr.id).length; if (c) out(`   ${pr.name}: ${c} Provinzen`); }
});

test("5 Leistung", () => {
  out("\n== 5. Leistung (Node) ==");
  const w = neu(1);
  let t = performance.now(); advance(w, 365); out(`1 Spieljahr: ${(performance.now() - t).toFixed(0)} ms`);
  t = performance.now(); structuredClone(w); out(`structuredClone(World): ${(performance.now() - t).toFixed(1)} ms`);
  t = performance.now();
  for (const m of ["inflation", "growth", "unemployment", "usdTry"] as const) outlook(w, (x) => setFiscalImpulse(x, 2), m, 12, 16);
  out(`Vorschau einer Entscheidung (Decisions.tsx: 4 Größen x 16 Läufe): ${(performance.now() - t).toFixed(0)} ms`);
});
