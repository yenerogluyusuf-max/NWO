// Ein echter Spieldurchlauf durch den Simulationskern: Prolog-Abschluss,
// freie Befehle über das Gespräch, Zeitverlauf und Bilanz. Dient zugleich als
// Prüfung, dass sich das Spiel tatsächlich spielen lässt.

import { describe, expect, test } from "vitest";
import { createWorld, advance, NET } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { befehl } from "../src/sim/befehle";
import { nationalAverage, policyCost } from "../src/sim/netz";
import { formatDateDe } from "../src/sim/dates";
import type { World } from "../src/sim/types";

const profil: PlayerProfile = {
  name: "Aylin Demir",
  heimat: "Istanbul",
  heimatPlaka: 34,
  jugend: "Aufgewachsen in Beyoğlu",
  beruf: "Wirtschaftsjuristin",
  partner: "Kerem",
  motiv: "Der Staat soll funktionieren, ohne dass jemand übersehen wird",
  partei: { name: "Aufbruchspartei", kurz: "AP", farbe: "#2f5d62" },
  naehe: { unternehmer: 3, staedtische_saekulare: 3, junge: 2 },
  versprechen: ["Die Mieten müssen sinken", "Keine Geschenke auf Pump"],
  wahl: { runde: 2, anteil: 52.3 },
};

function bericht(w: World, was: string) {
  console.log(`\n[${formatDateDe(w.date)}] ${was}`);
  console.log(
    `  Lage: Inflation ${w.published.inflation.value} % · Lira ${w.economy.usdTry.toFixed(1)} je $ · Zins ${w.economy.policyRate} % · Politikosten ${policyCost(NET, w.net).toFixed(2)} % BIP`,
  );
}

describe("Partie: Aylin Demir übernimmt die Türkei", () => {
  test("vom Amtseid bis zur ersten Bilanz", () => {
    const w = createWorld(turkey2026, 42);
    startAfterElection(w, profil);
    bericht(w, "Amtseid. Die Akten liegen bereit.");

    // Erster Befehl: Lage erfassen
    let r = befehl("Wie hoch ist die Inflation?", w);
    console.log(`  Sie: „Wie hoch ist die Inflation?"`);
    console.log(`  Kanzlei: ${r.text}`);
    expect(r.ok).toBe(true);

    // Erste Entscheidung: Mindestlohn — die Kanzlei rechnet
    r = befehl("Erhoehe den Mindestlohn um 25 Punkte", w);
    console.log(`  Sie: „Erhoehe den Mindestlohn um 25 Punkte"`);
    console.log(`  Kanzlei: ${r.text}`);
    console.log(`           (${r.why ?? ""})`);
    expect(r.ok).toBe(true);

    // Haushaltsimpuls
    r = befehl("Ich will mehr ausgeben, ein Investitionsprogramm", w);
    console.log(`  Sie: „Ich will mehr ausgeben"`);
    console.log(`  Kanzlei: ${r.text}`);
    expect(w.economy.fiscalImpulse).toBeGreaterThan(0);

    // Die Zentralbank wehrt sich nicht — sie wird kritisiert
    r = befehl("Kritisiere die Zentralbank oeffentlich", w);
    console.log(`  Sie: „Kritisiere die Zentralbank öffentlich"`);
    console.log(`  Kanzlei: ${r.text}`);
    expect(r.ok).toBe(true);

    // Zwei Monate laufen lassen
    r = befehl("60 Tage weiter", w);
    console.log(`  Sie: „60 Tage weiter"`);
    console.log(`  Kanzlei: ${r.text.slice(0, 160)}…`);
    bericht(w, "Zwei Monate später.");

    // Bilanz
    const mindestlohn = nationalAverage(NET, w.net, "m_mindestlohn");
    const beschluesse = w.log.filter((l) => l.kind === "entscheidung");
    console.log(`\n  Bilanz: Mindestlohn jetzt bei ${mindestlohn.toFixed(1)} · ${beschluesse.length} Beschlüsse im Buch`);
    for (const l of beschluesse.slice(-3)) console.log(`   · ${l.text}`);

    expect(w.day).toBe(60);
    expect(beschluesse.length).toBeGreaterThanOrEqual(3);
    expect(mindestlohn).toBeGreaterThan(60);
  });
});
