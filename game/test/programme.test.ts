// Regierungsprogramme: Aufbau, Ablauf, Wirkung und Erreichbarkeit.

import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { setPolicy, pruefeVorhaben } from "../src/sim/handeln";
import { criticizeCentralBank } from "../src/sim/eingriffe";
import { MAX_LAUFEND, PROGRAMME, naechsterSchritt, programmZustand, pruefeBedingung, rabattFuer, schrittSicht, starteSchritt } from "../src/sim/programme";
import type { World } from "../src/sim/types";

function neu(seed = 8): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 150;
  return w;
}

describe("Aufbau", () => {
  test("Alle Verweise gelten, jedes Programm endet in einem Vermächtnis, Voraussetzungen zeigen nach vorn", () => {
    const alle = new Map(PROGRAMME.flatMap((p) => p.schritte.map((s) => [s.id, s] as const)));
    for (const p of PROGRAMME) {
      expect(p.schritte.filter((s) => s.vermaechtnis)).toHaveLength(1);
      expect(p.schritte[p.schritte.length - 1]!.vermaechtnis).toBe(true);
      const gesehen = new Set<string>();
      for (const s of p.schritte) {
        for (const v of s.voraus) expect(gesehen.has(v), `${s.id} braucht ${v} früher`).toBe(true);
        gesehen.add(s.id);
        for (const b of s.bedingung) if ("id" in b) expect(NET.index.has(b.id), `${s.id}: ${b.id}`).toBe(true);
        expect(s.kapital).toBeGreaterThan(0);
        expect(s.tage).toBeGreaterThanOrEqual(30);
      }
    }
    expect(alle.size).toBeGreaterThanOrEqual(35);
  });
});

describe("Ablauf", () => {
  test("Ein Schritt braucht Voraussetzungen, Kapital und Zeit, dann wirkt er dauerhaft", () => {
    const w = neu();
    expect(starteSchritt(w, "erdbeben2").ok).toBe(false); // Voraussetzung fehlt
    expect(schrittSicht(w, PROGRAMME[0]!.schritte[0]!).status).toBe("bereit");
    const k0 = w.spiel!.kapital;
    expect(starteSchritt(w, "erdbeben1").ok).toBe(true);
    expect(w.spiel!.kapital).toBe(k0 - 3);
    advance(w, 20);
    expect(programmZustand(w).fertig).not.toContain("erdbeben1");
    advance(w, 15);
    expect(programmZustand(w).fertig).toContain("erdbeben1");
    expect(w.spiel!.hinweise.some((h) => /erdbeben1/.test(h.id))).toBe(true);
    // Der zweite Schritt verlangt echte Politik: die Bauaufsicht auf Stufe 60
    expect(schrittSicht(w, PROGRAMME[0]!.schritte[1]!).status).toBe("offen");
    setPolicy(w, "m_bauaufsicht", 70);
    advance(w, 30 * 14);
    expect(schrittSicht(w, PROGRAMME[0]!.schritte[1]!).status).toBe("bereit");
    expect(starteSchritt(w, "erdbeben2").ok).toBe(true);
    advance(w, 50);
    expect(rabattFuer(w, "wohnen")).toBeCloseTo(0.15, 6);
  });

  test("Höchstens zwei Schritte laufen gleichzeitig", () => {
    const w = neu();
    expect(starteSchritt(w, "erdbeben1").ok).toBe(true);
    expect(starteSchritt(w, "preise1").ok).toBe(true);
    const dritter = starteSchritt(w, "erdbeben1");
    expect(dritter.ok).toBe(false);
    expect(MAX_LAUFEND).toBe(2);
  });

  test("Ein Angriff auf die Zentralbank setzt die Ruhe-Bedingung zurück", () => {
    const w = neu();
    advance(w, 200);
    const b = pruefeBedingung(w, { art: "ruhe-zentralbank", tage: 180 });
    expect(b.erfuellt).toBe(true);
    criticizeCentralBank(w);
    expect(pruefeBedingung(w, { art: "ruhe-zentralbank", tage: 180 }).erfuellt).toBe(false);
  });

  test("Der Rabatt senkt die Kapitalkosten der Maßnahmen des Themas", () => {
    const w = neu();
    const vorher = pruefeVorhaben(w, "m_sozialwohnungen", 80).gesetz.pk;
    w.spiel!.modifikatoren = { "rabatt:wohnen": 0.3 };
    expect(pruefeVorhaben(w, "m_sozialwohnungen", 80).gesetz.pk).toBeLessThan(vorher);
  });

  test("Der nächste Schritt wird genannt", () => {
    const w = neu();
    expect(naechsterSchritt(w)).not.toBeNull();
  });
});

describe("Erreichbarkeit", () => {
  test("Bei entsprechender Politik lässt sich jedes Programm bis zum Vermächtnis führen", () => {
    const w = neu();
    // Alle geforderten Maßnahmen auf den verlangten Stand bringen (Minimum: hoch; Maximum: niedrig)
    for (const p of PROGRAMME) for (const s of p.schritte) for (const b of s.bedingung) {
      if (b.art === "massnahme") setPolicy(w, b.id, Math.min(100, b.min + 15));
      if (b.art === "massnahme-max") setPolicy(w, b.id, Math.max(0, b.max - 15));
    }
    const fehlend = new Set<string>();
    for (let monat = 0; monat < 12 * 9; monat++) {
      w.spiel!.kapital = 150;
      w.spiel!.ereignisse = [];
      w.spiel!.hinweise = [];
      for (const p of PROGRAMME) for (const s of p.schritte) if (schrittSicht(w, s).status === "bereit") starteSchritt(w, s.id);
      advance(w, 30);
      if (w.spiel!.ende) break;
    }
    const z = programmZustand(w);
    for (const p of PROGRAMME) for (const s of p.schritte) if (!z.fertig.includes(s.id)) fehlend.add(`${p.id}/${s.id}: ${schrittSicht(w, s).bedingungen.filter((b) => !b.erfuellt).map((b) => b.text).join(" ; ") || "gesperrt"}`);
    expect([...fehlend], `nicht erreicht:\n${[...fehlend].join("\n")}`).toEqual([]);
  });
});
