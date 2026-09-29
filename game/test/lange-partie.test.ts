// Lange Partie: ein Amtsjahr mit laufenden Entscheidungen.
// Zeigt, dass das Spiel Fortschritt erzeugt: Umsetzungen laufen durch,
// Werte entwickeln sich, die Bilanz wächst.

import { describe, expect, test } from "vitest";
import { createWorld, advance, NET } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { befehl } from "../src/sim/befehle";
import { nationalAverage, policyCost, activeProvinces } from "../src/sim/netz";
import { formatDateDe } from "../src/sim/dates";
import type { World } from "../src/sim/types";

const profil: PlayerProfile = {
  name: "Aylin Demir",
  heimat: "Istanbul",
  heimatPlaka: 34,
  jugend: "Beyoğlu",
  beruf: "Wirtschaftsjuristin",
  partner: "Kerem",
  motiv: "Der Staat soll funktionieren",
  partei: { name: "Aufbruchspartei", kurz: "AP", farbe: "#2f5d62" },
  naehe: { unternehmer: 3, staedtische_saekulare: 3 },
  versprechen: ["Die Mieten müssen sinken"],
  wahl: { runde: 2, anteil: 52.3 },
};

function akutZahl(w: World): number {
  return NET.nodes.filter((n) => n.kind === "problem" && activeProvinces(NET, w.net, n.id).length > 0).length;
}

function monat(w: World, was: string) {
  const offen = Object.entries(w.net.targets).filter(([id, t]) => Math.abs(nationalAverage(NET, w.net, id) - t) > 1).length;
  console.log(
    `[${formatDateDe(w.date)}] ${was}\n` +
      `   Inflation ${w.published.inflation.value.toFixed(1)} % · Lira ${w.economy.usdTry.toFixed(1)} · Zins ${w.economy.policyRate} % · Arbeitslosigkeit ${w.economy.unemployment.toFixed(1)} %\n` +
      `   Politikosten ${policyCost(NET, w.net).toFixed(2)} % BIP (wirksam) · ${offen} Umsetzungen offen · ${akutZahl(w)} Probleme akut · Vertrauen ${w.economy.credibility.toFixed(2)}`,
  );
}

describe("Lange Partie: ein Amtsjahr", () => {
  test("Fortschritt über zwölf Monate", () => {
    const w = createWorld(turkey2026, 7);
    startAfterElection(w, profil);
    monat(w, "Amtsantritt");

    const befehle: string[] = [
      "Erhoehe den Mindestlohn um 25 Punkte",
      "Ich will mehr ausgeben",
      "Erhoehe die Landwirtschaftliche Mechanisierung",
      "Kritisiere die Zentralbank oeffentlich",
      "Erhoehe die Berufsausbildungsprogramme",
      "Sparen",
      "Erhoehe die Moderne Bewaesserung",
      "Erhoehe die Digitale Verwaltung und Steuertechnik",
      "10 Tage weiter",
      "Erhoehe den Mindestlohn auf 90",
      "Erhoehe den Stromnetzausbau",
      "Wie hoch ist die Arbeitslosigkeit?",
    ];

    // Zwölf Monate: jeden Monat ein Befehl, dazu Zeitverlauf
    for (let monatNr = 1; monatNr <= 12; monatNr++) {
      const b = befehle[(monatNr - 1) % befehle.length]!;
      const r = befehl(b, w);
      advance(w, 30);
      monat(w, `Monat ${monatNr}: „${b}" → ${r.ok ? "erledigt" : "Rückfrage"}`);
    }

    // Bilanz
    const mindestlohn = nationalAverage(NET, w.net, "m_mindestlohn");
    const mechanisierung = nationalAverage(NET, w.net, "m_mechanisierung");
    const realloehne = nationalAverage(NET, w.net, "realeinkommen");
    const beschluesse = w.log.filter((l) => l.kind === "entscheidung");
    console.log(
      `\n=== BILANZ nach einem Jahr ===\n` +
        `Mindestlohn ${mindestlohn.toFixed(1)} · Mechanisierung ${mechanisierung.toFixed(1)} · Reallöhne ${realloehne.toFixed(1)} (Start 50)\n` +
        `${beschluesse.length} Beschlüsse · ${w.log.length} Einträge im Protokoll · Politikosten ${policyCost(NET, w.net).toFixed(2)} % BIP`,
    );

    // Fortschritt ist sichtbar (360 Tage Runden + 10 Tage aus dem Zeitbefehl)
    expect(w.day).toBe(370);
    expect(mindestlohn).toBeGreaterThan(60);
    expect(mechanisierung).toBeGreaterThan(32);
    expect(beschluesse.length).toBeGreaterThanOrEqual(10);
    expect(policyCost(NET, w.net)).toBeGreaterThan(0.05);
  });
});
