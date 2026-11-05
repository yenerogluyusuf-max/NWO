// Nacht 5./6. November, Bereich N1 (Kabinett und Personen): Wächter für die Befunde aus befund-C.md.

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { bestaetigeBefehl, chatBefehl } from "../src/sim/befehle";
import { ministerVorlagen } from "../src/sim/ministerfluss";
import { bereiteKabinettssitzungVor } from "../src/sim/kabinett";
import { katalogDe, rendere } from "../src/i18n";
import type { World } from "../src/sim/types";

function neu(seed = 12): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 80;
  return w;
}

const imAmt = (w: World) => w.spiel!.figuren.filter((f) => f.imAmt).map((f) => `${f.amt}:${f.name}`).sort().join("|");

describe("C-2: Der Chat führt Personal- und kostenpflichtige Befehle nie sofort aus", () => {
  test.each(["Entlasse den Finanzminister", "Entlasse die Gesundheitsministerin", "Feuere den Verkehrsminister", "Entlasse den Chef des Generalstabs"])("„%s“ bereitet nur vor", (satz) => {
    const w = neu();
    const k = w.spiel!.kapital;
    const vorher = imAmt(w);
    const r = chatBefehl(satz, w);
    expect(r.vorschlag?.art, r.text).toBe("entlassung");
    expect(w.spiel!.kapital).toBe(k);
    expect(imAmt(w)).toBe(vorher);
  });

  test("Ein Gipfeltreffen kostet Kapital: Vorschlag mit Preis aus dem Probelauf, Ausführung erst nach Bestätigung, Preis gleich gebucht", () => {
    const w = neu();
    const k = w.spiel!.kapital;
    const r = chatBefehl("Gipfeltreffen mit der EU", w);
    expect(r.vorschlag?.art).toBe("befehl");
    expect(w.spiel!.kapital).toBe(k);
    const v = r.vorschlag as Extract<NonNullable<typeof r.vorschlag>, { art: "befehl" }>;
    expect(v.kosten).toBeGreaterThan(0);
    expect(v.folgen[0]).toMatch(/Kapital/);
    const b = bestaetigeBefehl(v, w);
    expect(b.ok, b.text).toBe(true);
    expect(w.spiel!.kapital).toBeCloseTo(k - v.kosten, 1);
  });

  test("Fragen und Zeit laufen sofort; eine Frage nach einer Person beantwortet das Kabinett", () => {
    const w = neu();
    const r = chatBefehl("Wie loyal ist mein Finanzminister?", w);
    expect(r.vorschlag).toBeUndefined();
    expect(r.text).toMatch(/Loyalität \d+/);
    const z = chatBefehl("eine Woche weiter", w);
    expect(z.vorschlag).toBeUndefined();
    expect(w.day).toBeGreaterThan(0);
  });
});

describe("C-5/C-21: Kabinettsvorlagen gehören dem richtigen Amt", () => {
  test("Jedes Kabinettsthema nennt sein Amt, die Vorlagen landen dort und nicht beim Präsidialamt", () => {
    const w = neu();
    const themen = bereiteKabinettssitzungVor(w);
    const haushalt = themen.find((t) => t.id === "haushalt_prioritaet")!;
    expect(haushalt.amt).toBe("finanzen");
    const v = ministerVorlagen(w, { tiefe: 0 }).filter((x) => x.quelle === "kabinett");
    expect(v.find((x) => x.id.startsWith("kabinett:haushalt_prioritaet"))?.amt).toBe("finanzen");
    expect(v.find((x) => x.id.startsWith("kabinett:sicherheit_justiz"))?.amt).toBe("inneres");
  });

  test("Die Titel der Lage- und Grollvorlagen kennen alle Ämter; kein roher Schlüssel, kein „Präsidialamt:“ bei Handel", () => {
    for (const amt of ["handel", "gesundheit", "verkehr", "wirtschaft", "stab"]) {
      const titel = rendere({ k: "mfl.lage.titel", p: { ressort: amt, groesse: "X" } });
      expect(titel).not.toMatch(/mfl\./);
      if (amt === "stab") continue;
      expect(titel.startsWith("Präsidialamt")).toBe(false);
      expect(rendere({ k: "mfl.p.groll.titel", p: { ressort: amt } })).not.toMatch(/Präsidialamt/);
    }
    expect(rendere({ k: "mfl.lage.titel", p: { ressort: "handel", groesse: "Teuerung" } })).toBe("Handel: Teuerung im schlechten Bereich");
    expect(katalogDe()["kab.kr.paket.e1"]).not.toMatch(/7/);
  });
});
