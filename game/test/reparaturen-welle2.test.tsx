// Sofort-Reparaturen Welle 2 (SPIEL_DURCHDACHT_2026-10-05.md, Abschnitt 4), soweit nicht in eigenen Dateien geprüft:
// Lira-Ereignis (Reserven), AYM-Sitzzahl, Gouverneursname, Amtszeitzahl in der Chronik, Doppelkante und anwaltsautonomie im Netz,
// Stimmenkauf-Hinweis und die Verfassungshürden gegen die Quelle (tuerkei/INSTITUTIONEN.md, Art. 175).

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { Rng } from "../src/sim/rng";
import { NET } from "../src/sim/modell";
import { entscheide, oeffne, vorlage } from "../src/sim/ereignisse";
import { devisenZustand, interventionsVorschau } from "../src/sim/devisen";
import { reichZustand } from "../src/sim/reich";
import { replaceGovernor } from "../src/sim/eingriffe";
import { figur } from "../src/sim/figuren";
import { wirtschaftZustand } from "../src/sim/wirtschaft";
import { pruefeVorhaben, REGELN } from "../src/sim/handeln";
import { VERFASSUNG_REGELN, verfassungsZustand } from "../src/sim/verfassung";
import { Chronik } from "../src/ui/Chronik";
import type { World } from "../src/sim/types";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  return w;
}

describe("Ereignis „Die Lira rutscht“: Option Reserven", () => {
  test("Die Reserven sinken wirklich, der Kurs wird über die Interventionsrechnung gestützt", () => {
    const w = welt();
    devisenZustand(w);
    const e = w.economy;
    const nettoVorher = e.reservenNettoUsdMrd!;
    const bruttoVorher = e.reservenBruttoUsdMrd!;
    const kursVorher = e.usdTry;
    w.spiel!.kapital = 50;
    const ev = oeffne(w, "waehrungsrutsch", new Rng(3))!;
    const r = entscheide(w, ev.id, "reserven", new Rng(4));
    expect(r.ok).toBe(true);
    // Die Texte der Option und der Rechnung stimmen überein: Es sind bis zu 10 Mrd. Dollar
    expect(nettoVorher - e.reservenNettoUsdMrd!).toBeCloseTo(10, 6);
    expect(bruttoVorher - e.reservenBruttoUsdMrd!).toBeCloseTo(10, 6);
    expect(e.usdTry).toBeLessThan(kursVorher);
    expect(e.fxPuffer ?? 0).toBeGreaterThan(0); // der Rest der Stütze verteilt sich über die folgenden Wochen
    expect(r.text).toMatch(/Dollar/);
  });

  test("Sind die Reserven leer, scheitert der Versuch sichtbar und kostet Glaubwürdigkeit", () => {
    const w = welt();
    devisenZustand(w);
    w.economy.reservenBruttoUsdMrd = 3;
    w.economy.reservenNettoUsdMrd = 3;
    expect(interventionsVorschau(w, 10).ok).toBe(false); // 10 Mrd. sollen verkauft werden, brutto sind nur 3 da: nicht möglich
    const ev = oeffne(w, "waehrungsrutsch", new Rng(3))!;
    w.spiel!.kapital = 50;
    const glaubVorher = w.economy.credibility;
    const kursVorher = w.economy.usdTry;
    const r = entscheide(w, ev.id, "reserven", new Rng(4));
    expect(r.ok).toBe(true);
    expect(w.economy.reservenBruttoUsdMrd).toBe(3);
    expect(w.economy.usdTry).toBe(kursVorher);
    expect(w.economy.credibility).toBeLessThan(glaubVorher);
    expect(r.text).toMatch(/scheitert/);
  });
});

describe("Verfassungsgericht: Verpasste Ernennung ändert die Sitzzahl nicht", () => {
  const sitzzahl = (w: World) => {
    const s = reichZustand(w).sitze.aym!;
    return s.loyal + s.unabhaengig + s.reform;
  };

  test.each([
    ["mit Unabhängigen", { loyal: 9, unabhaengig: 3, reform: 3 }, { loyal: 10, unabhaengig: 2, reform: 3 }],
    ["ohne Unabhängige, mit Reformorientierten", { loyal: 9, unabhaengig: 0, reform: 6 }, { loyal: 10, unabhaengig: 0, reform: 5 }],
    ["nur das eigene Lager", { loyal: 15, unabhaengig: 0, reform: 0 }, { loyal: 15, unabhaengig: 0, reform: 0 }],
  ])("%s", (_name, vorher, nachher) => {
    const w = welt();
    reichZustand(w).sitze.aym = { ...vorher };
    expect(sitzzahl(w)).toBe(15);
    const ev = oeffne(w, "recht_ernennung", new Rng(2))!;
    vorlage("recht_ernennung")!.standard(w, ev, new Rng(5));
    expect(reichZustand(w).sitze.aym).toEqual(nachher);
    expect(sitzzahl(w)).toBe(15);
  });
});

describe("Zentralbank: Neue Führung bekommt einen Namen", () => {
  test("Ohne genannten Namen tritt nicht die entlassene Führung weiter auf", () => {
    const w = welt();
    wirtschaftZustand(w).zb.stufe = "C";
    const alt = figur(w, "zentralbank")!.name;
    replaceGovernor(w, "gefuegig", "eine neue, regierungsnahe Führung");
    const neu = figur(w, "zentralbank")!.name;
    expect(neu).not.toBe(alt);
    expect(neu).not.toBe("eine neue, regierungsnahe Führung");
    expect(w.governor?.name).toBe(neu);
    expect(w.log.some((l) => l.text.includes(`ernennt ${neu}`))).toBe(true);
  });

  test("Ein genannter Name wird übernommen", () => {
    const w = welt();
    wirtschaftZustand(w).zb.stufe = "C";
    replaceGovernor(w, "vorsichtig", "Test Person");
    expect(figur(w, "zentralbank")!.name).toBe("Test Person");
    expect(w.governor?.name).toBe("Test Person");
  });
});

describe("Chronik: Amtszeitzahl aus der Verfassung", () => {
  test("Normal „von 2“, mit dem Paket „Weitere Wiederwahl“ „von 3“", () => {
    const w = welt();
    expect(renderToStaticMarkup(<Chronik world={w} />)).toMatch(/Amtszeit 1 von 2\./);
    verfassungsZustand(w).aktiv.amtszeit = "wiederwahl_plus";
    expect(renderToStaticMarkup(<Chronik world={w} />)).toMatch(/Amtszeit 1 von 3\./);
  });
});

describe("Politiknetz: Doppelkante und anwaltsautonomie", () => {
  test("Es gibt genau eine Kante industrie → arbeitsplaetze_industrie, mit dem Summengewicht der früheren beiden", () => {
    const kanten = NET.edges.filter((k) => k.from === "industrie" && k.to === "arbeitsplaetze_industrie");
    expect(kanten.length).toBe(1);
    expect(kanten[0]!.weight).toBeCloseTo(0.09, 9);
  });

  test("Keine weitere doppelte Kante gleicher Richtung und Verzögerung", () => {
    const gesehen = new Set<string>();
    const doppelt: string[] = [];
    for (const k of NET.edges) {
      const schluessel = `${k.from}>${k.to}@${k.lag}`;
      if (gesehen.has(schluessel)) doppelt.push(schluessel);
      gesehen.add(schluessel);
    }
    expect(doppelt).toEqual([]);
  });

  test("anwaltsautonomie hat Eingänge (Ausnahmerecht, Justizunabhängigkeit) und Ausgänge", () => {
    const eingang = NET.edges.filter((k) => k.to === "anwaltsautonomie").map((k) => k.from);
    expect(eingang).toEqual(expect.arrayContaining(["ausnahmerecht", "justiz_unabhaengigkeit"]));
    expect(NET.edges.some((k) => k.from === "anwaltsautonomie")).toBe(true);
  });
});

describe("Stimmenkauf: Der Hinweis folgt der Entscheidung „ohne Nachspiel“", () => {
  test("Fehlen Stimmen, nennt der Hinweis den sofortigen Preis statt späterer Gegenleistungen", () => {
    const w = welt();
    w.spiel!.lager = [];
    const pr = pruefeVorhaben(w, "m_polizei", 90);
    const text = pr.hinweise.join(" ");
    expect(text).toMatch(/sofort bezahlt/);
    expect(text).toContain(String(REGELN.kaufKostenProStimme));
    expect(text).not.toMatch(/Gegenleistungen/);
  });
});

describe("Verfassungshürden gegen die Quelle (Art. 175)", () => {
  test("360 Stimmen schicken ein Paket zum Volk, ab 400 gilt es ohne Referendum", () => {
    expect(VERFASSUNG_REGELN.mehrheit).toBe(360);
    expect(VERFASSUNG_REGELN.direkt).toBe(400);
  });
});
