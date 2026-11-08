// Auskünfte und Anzeigelogik des Krisenstabs: Gefährdungslage, Hilfskette, Szenario, Hebel der Vorsorge.
// Alles reine Lesefunktionen über dem Katastrophen-Modul; die Mechanik selbst prüft test/katastrophe.test.ts.

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";
import {
  beginneWiederaufbau,
  bereitGegenReferenz,
  bereitSenkung,
  bereitschaft,
  hilfsketteSicht,
  loeseAus,
  risikoUebersicht,
  schadenBerechnen,
  soforthilfe,
  starteUebergang,
  szenario,
} from "../src/sim/katastrophe";
import { bringeEin } from "../src/sim/handeln";
import { hebel, HEBEL_IDS, naechsteStufe } from "../src/ui/katastrophe/daten";

function welt(seed = 31): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  return w;
}

function mitBeben(seed = 31) {
  const w = welt(seed);
  const fall = loeseAus(w, new Rng(5), { art: "erdbeben", zone: "daf", provinzen: [] })!;
  return { w, fall };
}

describe("Gefährdungslage", () => {
  test("Sechs Zeilen (drei Bruchzonen, Flut, Brand, Dürre) mit Chancen zwischen 0 und 1", () => {
    const r = risikoUebersicht(welt());
    expect(r.map((x) => x.id)).toEqual(["beben-kaf", "beben-daf", "beben-baf", "flut", "waldbrand", "duerre"]);
    for (const x of r) {
      expect(x.jahresChance).toBeGreaterThanOrEqual(0);
      expect(x.jahresChance).toBeLessThanOrEqual(1);
      expect(x.gebiet.length).toBeGreaterThan(0);
      expect(x.bevoelkerung).toBeGreaterThan(0);
      expect(x.freiIn).toBe(0);
    }
    // Erdbeben ganzjährig, Flut nur im Herbst: bei gleichem Monatswert ist die Jahreschance der Flut kleiner als 4 × Monatschance
    expect(r.find((x) => x.id === "flut")!.saison).toBe("August bis November");
  });

  test("Deterministisch: gleicher Stand, gleiche Auskunft", () => {
    expect(JSON.stringify(risikoUebersicht(welt(7)))).toBe(JSON.stringify(risikoUebersicht(welt(7))));
  });

  test("Das Gebiet ist nach Gefährdung geordnet, Hochrisiko-Provinzen stehen vorn", () => {
    const daf = risikoUebersicht(welt()).find((x) => x.id === "beben-daf")!;
    const risiken = daf.gebiet.map((g) => g.risiko ?? 0);
    expect(Math.max(...risiken.slice(0, 3))).toBeGreaterThanOrEqual(4);
    expect(daf.kennzahl?.wert).toBeGreaterThanOrEqual(0);
    expect(daf.kennzahl?.wert).toBeLessThanOrEqual(100);
  });

  test("Nach einem Beben ruht das Erdbeben-Risiko: Chance null, Ruhephase sichtbar", () => {
    const { w } = mitBeben();
    for (const x of risikoUebersicht(w).filter((r) => r.art === "erdbeben")) {
      expect(x.jahresChance).toBe(0);
      expect(x.freiIn).toBeGreaterThan(30);
    }
    // Die anderen Gefahren sind davon unberührt
    expect(risikoUebersicht(w).find((x) => x.id === "flut")!.freiIn).toBe(0);
  });

  test("Ein alter Spielstand ohne Katastrophen-Feld bricht die Auskunft nicht", () => {
    const w = welt();
    delete (w.spiel as { katastrophen?: unknown }).katastrophen;
    expect(() => risikoUebersicht(w)).not.toThrow();
    expect(risikoUebersicht(w)).toHaveLength(6);
  });
});

describe("Bereitschaft", () => {
  test("Senkung der Opferzahlen wächst mit dem Stand; die Referenz 20 ist der Nullpunkt", () => {
    expect(bereitSenkung(0)).toBe(0);
    expect(bereitSenkung(100)).toBe(45);
    expect(bereitSenkung(45)).toBeCloseTo(20.3, 1);
    expect(bereitGegenReferenz(20)).toBe(0);
    expect(bereitGegenReferenz(60)).toBeGreaterThan(0);
    expect(bereitGegenReferenz(5)).toBeLessThan(0);
  });
});

describe("Szenario", () => {
  const staende = [
    { name: "Ohne Vorsorge", stand: 0 },
    { name: "Heute", stand: 45 },
    { name: "Voll ausgebaut", stand: 100 },
  ];

  test("Mehr Vorsorge, weniger Opfer; der heutige Stand entspricht der Schadensrechnung", () => {
    const w = welt();
    const heute = Math.round(bereitschaft(w));
    const z = szenario(w, "erdbeben", [31], 0.75, [{ name: "Ohne", stand: 0 }, { name: "Heute", stand: heute }, { name: "Voll", stand: 100 }]);
    expect(z[0]!.tote).toBeGreaterThan(z[1]!.tote);
    expect(z[1]!.tote).toBeGreaterThan(z[2]!.tote);
    const direkt = schadenBerechnen(w, "erdbeben", [31], 0.75);
    expect(Math.abs(z[1]!.tote - direkt.tote)).toBeLessThanOrEqual(1);
    expect(Math.abs(z[1]!.wohnungen - direkt.wohnungen)).toBeLessThanOrEqual(1);
  });

  test("Stärkere Lage, mehr Schaden; Dürre fordert keine Opfer", () => {
    const w = welt();
    const leicht = szenario(w, "erdbeben", [31], 0.5, staende)[1]!;
    const schwer = szenario(w, "erdbeben", [31], 0.95, staende)[1]!;
    expect(schwer.tote).toBeGreaterThan(leicht.tote);
    for (const zeile of szenario(w, "duerre", [42], 0.8, staende)) expect(zeile.tote).toBe(0);
  });
});

describe("Hilfskette", () => {
  test("Frischer Fall: Nothilfe steht aus, Übergang gesperrt, Wiederaufbau offen", () => {
    const { w, fall } = mitBeben();
    const k = hilfsketteSicht(w, fall);
    expect(k.map((s) => s.id)).toEqual(["nothilfe", "uebergang", "wiederaufbau", "bewaeltigt"]);
    expect(k[0]!.status).toBe("offen");
    expect(k[1]!.status).toBe("gesperrt");
    expect(k[2]!.status).toBe("offen");
    expect(k[3]!.status).toBe("offen");
  });

  test("Nach Nothilfe wird der Übergang frei, danach läuft er mit Fortschritt", () => {
    const { w, fall } = mitBeben();
    soforthilfe(w, fall.id);
    let k = hilfsketteSicht(w, fall);
    expect(k[0]!.status).toBe("erledigt");
    expect(k[1]!.status).toBe("offen");
    expect(starteUebergang(w, fall.id).ok).toBe(true);
    k = hilfsketteSicht(w, fall);
    expect(k[1]!.status).toBe("laeuft");
    expect(k[1]!.fortschritt).toBeGreaterThanOrEqual(0);
    expect(k[1]!.fortschritt).toBeLessThan(0.1);
    expect(k[1]!.detail).toMatch(/Monate/);
  });

  test("Das Wohnungsbau-Programm macht aus „offen“ ein „läuft“ mit Baufortschritt", () => {
    const { w, fall } = mitBeben();
    w.spiel!.kapital = 200;
    const r = beginneWiederaufbau(w, fall.id, "ausschreibung");
    const k = hilfsketteSicht(w, fall);
    if (r.ok) {
      expect(k[2]!.status).toBe("laeuft");
      expect(k[2]!.detail).toMatch(/Baureihenfolge|Programm/);
    } else {
      expect(k[2]!.status).toBe("offen");
    }
  });

  test("Dürre: kein Wohnbestand, also entfällt der Wiederaufbau; die Kette nennt, wann die Lage als bewältigt gilt", () => {
    const w = welt();
    const fall = loeseAus(w, new Rng(2), { art: "duerre", provinzen: [] })!;
    const k = hilfsketteSicht(w, fall);
    expect(k.find((s) => s.id === "wiederaufbau")!.status).toBe("entfaellt");
    // Seit der Reparatur schließen auch Fälle ohne Wohnungen (Mindestdauer, Wassermangel an der Ruhelage, Frist)
    const b = k.find((s) => s.id === "bewaeltigt")!;
    expect(b.status).toBe("offen");
    expect(b.detail).toMatch(/Monat/);
  });
});

describe("Hebel der Vorsorge", () => {
  test("Jeder vorhandene Hebel hat Stufe, Zielstufe, Preis und Wirkung", () => {
    const h = hebel(welt());
    expect(h.length).toBeGreaterThanOrEqual(4);
    for (const z of h) {
      expect(HEBEL_IDS).toContain(z.id as (typeof HEBEL_IDS)[number]);
      expect(z.pk).toBeGreaterThanOrEqual(2);
      expect(z.monate).toBeGreaterThan(0);
      if (!z.ausgeschoepft) expect(z.ziel).toBeGreaterThan(z.stufe);
      expect(z.wirkung.length).toBeGreaterThan(0);
    }
    const afad = h.find((z) => z.id === "m_afad_ausbau")!;
    expect(afad.wirkung.some((x) => /Katastrophenschutz/.test(x.auf))).toBe(true);
  });

  test("Nächste Stufe: zwanzig weiter auf volle Zehner, nie über 100", () => {
    expect(naechsteStufe(40)).toBe(60);
    expect(naechsteStufe(43)).toBe(60);
    expect(naechsteStufe(88)).toBe(100);
    expect(naechsteStufe(100)).toBe(100);
  });

  test("Ein eingebrachtes Gesetz steht danach als „im Parlament“ da und lässt sich nicht doppelt einbringen", () => {
    const w = welt();
    w.spiel!.kapital = 200;
    const vorher = hebel(w).find((z) => z.id === "m_afad_ausbau")!;
    expect(vorher.imParlament).toBe(false);
    expect(bringeEin(w, "m_afad_ausbau", vorher.ziel, null, "gesetz").ok).toBe(true);
    expect(hebel(w).find((z) => z.id === "m_afad_ausbau")!.imParlament).toBe(true);
  });
});
