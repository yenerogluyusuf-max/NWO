import { createWorld, advance, NET, setPolicy } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection } from "../src/sim/prolog";
import { waehleZiele } from "../src/sim/spiel";
import { entscheide, standardAntwort } from "../src/sim/ereignisse";
import { Rng } from "../src/sim/rng";

const profil: any = { name: "T", heimat: "Ankara", heimatPlaka: 6, jugend: "", beruf: "Ö", partner: "", motiv: "", partei: { name: "PW", kurz: "PW", farbe: "#555" }, naehe: {}, versprechen: [], wahl: { runde: 2, anteil: 51 } };

function lauf(maximal: boolean) {
  const w = createWorld(turkey2026, 42);
  startAfterElection(w, profil);
  waehleZiele(w, [], "normal");
  const rng = new Rng(42 * 7919);
  if (maximal) for (const n of NET.nodes) if (n.kind === "massnahme") setPolicy(w, n.id, 100);
  let cdsMax = 0, schuldenMax = 0, inflMax = 0;
  for (let m = 1; m <= 62; m++) {
    if (maximal) for (const ev of [...w.spiel!.ereignisse]) { const id = standardAntwort(w, ev); if (id) entscheide(w, ev.id, id, rng); }
    advance(w, 30);
    cdsMax = Math.max(cdsMax, w.economy.riskPremium);
    schuldenMax = Math.max(schuldenMax, w.economy.debtRatio);
    inflMax = Math.max(inflMax, w.economy.inflation);
    if (m % 12 === 0) {
      const e = w.economy;
      console.log(`  M${m}: infl ${e.inflation.toFixed(1)} · schulden ${e.debtRatio.toFixed(1)} · cds ${e.riskPremium.toFixed(0)} · zust ${w.spiel!.umfrage.zustimmung.toFixed(1)}`);
    }
    if (w.spiel!.ende) break;
  }
  const e = w.economy;
  console.log(`  ENDE: infl ${e.inflation.toFixed(1)} · schulden ${e.debtRatio.toFixed(1)} · cds ${e.riskPremium.toFixed(0)} · maxima: infl ${inflMax.toFixed(1)} schulden ${schuldenMax.toFixed(1)} cds ${cdsMax.toFixed(0)}`);
}

console.log("PASSIV:"); lauf(false);
console.log("MAXIMAL:"); lauf(true);
