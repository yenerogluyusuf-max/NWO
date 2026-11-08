// Debug-Ausgabe der Lernfall-Replays gegen die CSV-Istwerte.
// Bundlen: npx rolldown scripts/lernfaelle-debug.ts -f esm -o scripts/.build/lernfaelle-debug.mjs
// Laufen:  node scripts/.build/lernfaelle-debug.mjs
import { LERNFAELLE, ladeZeitreihen, replay } from "./lernfaelle";

const serien = ladeZeitreihen();
const fmt = (x: number | undefined, d = 1) => (x === undefined ? "  --  " : x.toFixed(d).padStart(6));

for (const fall of LERNFAELLE) {
  console.log(`\n=== Lernfall ${fall.id}: ${fall.titel} (Start ${fall.startMonat}, ${fall.monate} Monate) ===`);
  console.log("Monat   | TÜFE sim/ist   | Zins sim/ist | USD/TRY sim/ist | CDS sim/ist     | ALQ sim/ist   | Schulden sim | Erwart | Glaubw | fxChange12 | Regelzins");
  const reihe = replay(fall, serien);
  for (const r of reihe) {
    const ist = serien.get(r.monat);
    console.log(
      `${r.monat} | ${fmt(r.inflation)}/${fmt(ist?.tuefe)} | ${fmt(r.leitzins)}/${fmt(ist?.leitzins)} | ${fmt(r.usdTry)}/${fmt(ist?.usdtry)} | ${fmt(r.cds, 0)}/${fmt(ist?.cds, 0)} | ${fmt(r.alq)}/${fmt(ist?.alq)} | ${fmt(r.schuldenquote)} | ${fmt(r.erwartung)} | ${fmt(r.glaubwuerdigkeit, 2)} | ${fmt(r.fxChange12)} | ${fmt(r.regelzinsAusgewogen)}`,
    );
  }
}
