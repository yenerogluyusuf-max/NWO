// Inhaltsprobe (kein Test): druckt eine echte Monatsausgabe + Eilmeldung zur Sichtkontrolle.
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { zeitungEreignis } from "../src/sim/zeitung";

const w = createWorld(turkey2026, 5);
startAfterElection(w, schnellProfil());
w.spiel!.ereignisse = [];
const tage = new Date(Date.UTC(2028, 7, 0)).getUTCDate() - 5 + 1;
advance(w, tage);
zeitungEreignis(w, { art: "krise", titel: "Lira-Vertrauen erschüttert", fakt: "Die Lira hat in zwölf Monaten 47 % verloren; der Risikoaufschlag liegt bei 640 Punkten.", wertung: -0.8 });
advance(w, 1);

for (const a of w.spiel!.zeitung!.archiv) {
  console.log(`\n${"=".repeat(72)}\nAUSGABE Nr. ${a.nummer} (${a.anlass}) — ${a.datum}`);
  if (a.umfrage) console.log(`UMFRAGE: ${a.umfrage.institut}: ${a.umfrage.wert} % (${a.umfrage.methode}${a.umfrage.stichprobe ? `, n=${a.umfrage.stichprobe}` : ", Stichprobe nicht offengelegt"})`);
  if (a.umfrageSchublade) console.log(`SCHUBLADE: ${a.umfrageSchublade}`);
  for (const b of a.blaetter) {
    console.log(`\n--- ${b.name} (${b.ton}${b.digital ? ", digital" : ", Print"}) — „${b.unterzeile}"`);
    for (const art of b.artikel) {
      console.log(`  [${art.sparte}${art.kurz ? ", klein" : ""}] ${art.schlagzeile}`);
      for (const t of art.text) console.log(`    ${t}`);
    }
    if (b.verschwiegen.length) console.log(`  VERSCHWIEGEN: ${b.verschwiegen.join(" · ")}`);
  }
}
