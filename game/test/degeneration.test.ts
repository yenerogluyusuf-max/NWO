// ZEI-4 (VERBESSERUNGSPLAN_2026-09-30): Degenerations-Regressionstests.
// Die Spielbarkeitsanalyse vom 29.09. (ANALYSE_SPIELBARKEIT_2026-09-29.md, Abschnitt 2) fand drei
// Auswüchse, die nicht wiederkehren dürfen:
//   1. Passive Partie: Vertrauen stieg von 45 auf 57,7, null Ereignisse — Nichtstun war eine gute Strategie.
//   2. Alle Maßnahmen auf Maximum: Vertrauen 100 ab Jahr 3, Schulden kaum steigend — keine Ruinierung.
//   3. Preiskontrollen auf 100: +16,9 Vertrauen für 0,08 % des BIP — Nebenwirkungen zu schwach.
// Alle drei Szenarien laufen eine volle Amtszeit (5 Jahre) im Simulations-Loop wie lange-partie.test.ts.

import { describe, expect, test } from "vitest";
import { createWorld, advance, NET, setPolicy } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { waehleZiele } from "../src/sim/spiel";
import { activeProvinces, nationalAverage } from "../src/sim/netz";
import { entscheide, standardAntwort } from "../src/sim/ereignisse";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

const profil: PlayerProfile = {
  name: "Test",
  heimat: "Ankara",
  heimatPlaka: 6,
  jugend: "",
  beruf: "Ökonom",
  partner: "",
  motiv: "",
  partei: { name: "Partei der Werte", kurz: "PW", farbe: "#555" },
  naehe: {},
  versprechen: [],
  wahl: { runde: 2, anteil: 51 },
};

/** Zahl der Politikfelder, in denen irgendwo ein Problem akut ist. */
function akutZahl(w: World): number {
  return NET.nodes.filter((n) => n.kind === "problem" && activeProvinces(NET, w.net, n.id).length > 0).length;
}

interface Spur {
  akutMax: number;
  /** Zustimmung nach jedem Monat */
  zustimmung: number[];
  ereignisse: number;
}

/** Eine Amtszeit im Monatsloop; bricht bei Sturz oder Abwahl ab. */
function partie(seed: number, bot: (w: World, rng: Rng, monat: number) => void, monate = 62): { w: World; spur: Spur } {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, profil);
  waehleZiele(w, [], "normal");
  const rng = new Rng(seed * 7919);
  const spur: Spur = { akutMax: akutZahl(w), zustimmung: [], ereignisse: 0 };
  let m = 0;
  while (!w.spiel!.ende && m < monate) {
    bot(w, rng, m);
    advance(w, 30);
    m++;
    spur.akutMax = Math.max(spur.akutMax, akutZahl(w));
    spur.zustimmung.push(w.spiel!.umfrage.zustimmung);
  }
  spur.ereignisse = w.spiel!.chronik.length;
  return { w, spur };
}

/** Der passive Präsident: keine Eingabe, Ereignisse verfallen über ihre Frist. */
const passiv = (): void => {};

/** Beantwortet offene Ereignisse mit der ersten bezahlbaren Antwort (wie der Test-Bot in spielbarkeit). */
const beantworte = (w: World, rng: Rng): void => {
  for (const ev of [...w.spiel!.ereignisse]) {
    const id = standardAntwort(w, ev);
    if (id) entscheide(w, ev.id, id, rng);
  }
};

describe("Degeneration (ZEI-4): Extreme dürfen sich nicht lohnen", () => {
  test("Passive Partie: keine stabil steigende Zustimmung, und es gab akute Krisen", () => {
    const { w, spur } = partie(42, passiv);
    const start = profil.wahl.anteil;
    const ende = spur.zustimmung.at(-1)!;
    console.log(
      `[passiv] Ende: ${w.spiel!.ende?.art ?? "läuft"} nach ${(w.day / 365).toFixed(1)} J · Zustimmung ${start} → ${ende.toFixed(1)} · akut max ${spur.akutMax} · Chronik ${spur.ereignisse}`,
    );
    // Befund 29.09.: passive Partie stieg auf 57,7. Erwartung: nicht besser als Start + 5.
    expect(ende).toBeLessThan(start + 5);
    // Mindestens eine akute Krise trat irgendwann auf (Problem über der Schwelle)
    expect(spur.akutMax).toBeGreaterThanOrEqual(1);
  });

  test("Maximal-Partie: alle Regler auf 100 ruinieren die Wirtschaft, die Zustimmung fällt bis Jahr 3–4", () => {
    const { w, spur } = partie(42, (w2, rng, monat) => {
      if (monat === 0) for (const n of NET.nodes) if (n.kind === "massnahme") setPolicy(w2, n.id, 100);
      beantworte(w2, rng);
    });
    // Referenz: dieselbe Partie ohne den Maximalismus. Das Szenario startet in einer Krise (Inflation 31,5 %),
    // die sich normalisiert — „verschlechtert" misst sich daher an dieser Referenz, nicht am Startwert.
    const referenz = partie(42, passiv);
    const e = w.economy;
    const r = referenz.w.economy;
    console.log(
      `[maximal] Ende: ${w.spiel!.ende?.art ?? "läuft"} nach ${(w.day / 365).toFixed(1)} J · ` +
        `Inflation ${e.inflation.toFixed(1)} % (Referenz ${r.inflation.toFixed(1)}) · Schulden ${e.debtRatio.toFixed(1)} % (Referenz ${r.debtRatio.toFixed(1)}) · ` +
        `CDS ${e.riskPremium.toFixed(0)} bp (Referenz ${r.riskPremium.toFixed(0)}) · Zustimmung M12 ${spur.zustimmung[11]?.toFixed(1)} · M36 ${spur.zustimmung[35]?.toFixed(1)} · M42 ${spur.zustimmung[41]?.toFixed(1)} · M48 ${spur.zustimmung[47]?.toFixed(1)}`,
    );
    // Befund 29.09.: Vertrauen 100 ab Jahr 3, Schulden nahezu unverändert — der Maximalismus war folgenlos.
    // Schwellen aus der Messung (Seed 42): Inflation doppelt so hoch wie die Referenz (12,9 vs. 6,6),
    // CDS +125 bp (271 vs. 152). Gefordert wird eines von dreien mit etwa halbem Messabstand als Marge.
    const ruiniert = e.inflation > r.inflation + 4 || e.debtRatio > r.debtRatio + 8 || e.riskPremium > r.riskPremium + 80;
    expect(ruiniert).toBe(true);
    // Die Zustimmung fällt bis Jahr 3–4 deutlich unter den Stand nach dem ersten Jahr (gemessen −5,3; gefordert −4).
    // Messzeitpunkt M48 statt M42: Die Umsetzungsrampe (INN-2) lässt die Politiklast des Maximalismus über
    // rund drei Jahre anwachsen statt sofort zu greifen, und die kalibrierte Desinflation (WIR-1: Erwartungs-
    // kanal, Erwartungs-basierter FX-Drift) lässt das Vertrauen zunächst höher — die Bestrafung kommt dadurch
    // ~6 Monate später, aber vollständig (Inflation ~21 % vs. 4,4 %, CDS ~550 vs. ~150). Jahr 3–4 umfasst M48.
    const m12 = spur.zustimmung[11]!;
    const m48 = spur.zustimmung[47] ?? spur.zustimmung.at(-1)!;
    expect(m48).toBeLessThan(m12 - 4);
  });

  test("Preiskontrollen-Stichprobe: über 24 Monate darf die Netto-Bilanz nicht positiv sein", () => {
    // Zwei identische passive Partien; eine setzt zu Beginn die Preiskontrollen auf 100.
    // Passiv, damit die Bilanz der Maßnahme selbst gemessen wird — einschließlich der Ereignisse,
    // die der Deckel auslöst (leere Regale), ohne dass Antworten das Bild verwässern.
    const basis = partie(42, passiv, 24);
    const mit = partie(42, (w2, _rng, monat) => {
      if (monat === 0) setPolicy(w2, "m_preiskontrollen", 100);
    }, 24);
    const zBasis = basis.spur.zustimmung.at(-1)!;
    const zMit = mit.spur.zustimmung.at(-1)!;
    const schatten = nationalAverage(NET, mit.w.net, "schattenwirtschaft") - nationalAverage(NET, basis.w.net, "schattenwirtschaft");
    const schulden = mit.w.economy.debtRatio - basis.w.economy.debtRatio;
    console.log(
      `[preiskontrollen] 24 Monate · Zustimmung ohne ${zBasis.toFixed(1)} vs. mit ${zMit.toFixed(1)} (Δ ${(zMit - zBasis).toFixed(1)}) · ` +
        `Schattenwirtschaft Δ ${schatten.toFixed(1)} · Schulden Δ ${schulden.toFixed(2)} pp`,
    );
    // Befund 29.09.: +16,9 Vertrauen für 0,08 % BIP. Erwartung: Der Deckel darf die Zustimmung
    // gegenüber der identischen Partie ohne Deckel nicht nennenswert verbessern — die Nebenwirkungen
    // (graue Märkte, Erzeugerpreise, leere Regale) müssen dominieren.
    expect(zMit).toBeLessThanOrEqual(zBasis + 1);
  });
});
