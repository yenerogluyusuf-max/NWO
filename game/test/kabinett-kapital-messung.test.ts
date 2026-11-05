// Messung (AP 3, PLAN_OBERFLAECHE_DETAIL_2026-11-05.md): Kapitalertrag des Kabinetts in den Strategie-Partien.
// Läuft nur mit KAPITAL_MESSUNG=<datei>; schreibt je Strategie und Seed die Summe des Kabinettsbeitrags, das Kapital am Ende,
// die Zahl der Minister und das Ende der Partie. Vorher und nachher vergleichen: Der Ertrag soll sich höchstens um 5 % ändern.
import { test } from "vitest";
import { writeFileSync } from "node:fs";
import { spieleStrategie, type Strategie } from "../scripts/balance-strategien";
import { kapitalEinkommen } from "../src/sim/spiel";
import { kabinettStatus } from "../src/sim/kabinett";

const datei = process.env.KAPITAL_MESSUNG;
const strategien = (process.env.KAPITAL_STRATEGIEN ?? "entlastung,industrie_fokus,sozial_dienste").split(",") as Strategie[];
const seeds = (process.env.KAPITAL_SEEDS ?? "5,17").split(",").map(Number);
const jahre = Number(process.env.KAPITAL_JAHRE ?? 3);

test.skipIf(!datei)("Kapitalertrag des Kabinetts", () => {
  const out: unknown[] = [];
  for (const s of strategien)
    for (const seed of seeds) {
      let kabinett = 0, monate = 0, minister = 0, zuletzt = "";
      const r = spieleStrategie(s, seed, jahre, (w) => {
        const monat = w.date.slice(0, 7);
        if (!w.spiel || w.spiel.ende || monat === zuletzt) return;
        zuletzt = monat;
        kabinett += kapitalEinkommen(w).kabinett;
        minister = kabinettStatus(w).minister.length;
        monate++;
      });
      out.push({ strategie: s, seed, monate, kabinett: Math.round(kabinett * 10) / 10, jeMonat: Math.round((kabinett / Math.max(1, monate)) * 100) / 100, minister, ende: r.ende, tage: r.tage });
    }
  writeFileSync(datei!, JSON.stringify(out, null, 1) + "\n");
}, 1_800_000);
