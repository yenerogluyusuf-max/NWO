// Die Bereiche der Politik: jedes Themenfeld hat Beschreibung, Maßnahmen und eine erklärbare Ampel; die Listen zeigen, was läuft.

import { describe, expect, test } from "vitest";
import { advance, createWorld, setPolicy } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { bringeEin } from "../src/sim/handeln";
import { BEREICHE, BEREICH_THEMEN, EINHEIT, NEUTRAL, SCHLECHT_WENN_HOCH, alleBereiche, bereichStand, bewerte, vorschlaegeIn, alleVorschlaege } from "../src/ui/politik/bereiche";

function welt(seed = 6) {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 120;
  return w;
}

describe("Bereiche der Politik", () => {
  test("Jedes Themenfeld des Netzes außer den Wählergruppen ist ein Bereich, mit Text und Maßnahmen", () => {
    const themen = new Set(NET.nodes.map((n) => n.theme));
    themen.delete("gruppen");
    expect(new Set(BEREICH_THEMEN)).toEqual(themen);
    for (const b of BEREICHE) {
      expect(b.text.length, b.theme).toBeGreaterThan(20);
      expect(NET.nodes.some((n) => n.theme === b.theme && n.kind === "massnahme"), `${b.theme} hat keine Maßnahme`).toBe(true);
    }
  });

  test("Alle Größen der Bewertungslisten gibt es im Netz", () => {
    const ids = new Set(NET.nodes.map((n) => n.id));
    for (const id of [...SCHLECHT_WENN_HOCH, ...NEUTRAL, ...Object.keys(EINHEIT)]) expect(ids.has(id), id).toBe(true);
  });

  test("Bewertung: bei „hoch ist schlecht“ kehrt sich die Richtung um, neutrale Größen werden nicht bewertet", () => {
    expect(bewerte("mieten", 80)).toBe("schlecht");
    expect(bewerte("mieten", 20)).toBe("gut");
    expect(bewerte("gesundheitsversorgung", 80)).toBe("gut");
    expect(bewerte("gesundheitsversorgung", 20)).toBe("schlecht");
    expect(bewerte("gesundheitsversorgung", 50)).toBe("mittel");
    expect(bewerte("geburtenrate", 10)).toBe("neutral");
  });

  test("Jeder Bereich liefert Stand, Lage, Maßnahmen und eine begründete Ampel", () => {
    const w = welt();
    for (const t of BEREICH_THEMEN) {
      const s = bereichStand(w, t);
      expect(s.massnahmen.length, t).toBeGreaterThan(0);
      expect(s.lage.length, t).toBeGreaterThan(0);
      expect(["gruen", "gelb", "rot"]).toContain(s.ampel);
      expect(s.ampelGrund.length).toBeGreaterThan(10);
      // Ohne Problem und ohne schlechte Größe steht die Ampel auf Grün
      if (s.probleme.length === 0 && !s.lage.some((l) => !l.input && l.bewertung === "schlecht")) expect(s.ampel).toBe("gruen");
      for (const l of s.lage) expect(Number.isFinite(l.jetzt), `${t}/${l.id}`).toBe(true);
    }
  });

  test("Akute Probleme verfärben die Ampel des Bereichs, zu dem sie gehören", () => {
    const w = welt();
    const alle = alleBereiche(w);
    const akutGesamt = alle.reduce((s, b) => s + b.akut, 0);
    // Die Startlage hat akute Probleme (Wasser, Erdbeben, Migration, …); sie liegen in ihren Bereichen
    expect(akutGesamt).toBeGreaterThan(0);
    for (const b of alle) {
      if (b.akut >= 3) expect(b.ampel).toBe("rot");
      if (b.akut >= 1) expect(b.ampel).not.toBe("gruen");
    }
  });

  test("Was läuft, steht oben in der Maßnahmenliste: ein Gesetz im Parlament und eine Umsetzung", () => {
    const w = welt();
    const vorher = bereichStand(w, "gesundheit");
    expect(vorher.laufend).toBe(0);
    const id = "m_krankenhausbau";
    const r = bringeEin(w, id, 80, null, "gesetz");
    expect(r.ok, r.text).toBe(true);
    const nach = bereichStand(w, "gesundheit");
    expect(nach.laufend).toBe(1);
    expect(nach.massnahmen[0]!.id).toBe(id);
    expect(nach.massnahmen[0]!.imParlament?.stufe).toBe(80);
    // Nach der Abstimmung läuft die Umsetzung: Ziel gesetzt
    w.spiel!.lager = Object.keys(w.parliament!.seats);
    advance(w, 120);
    const spaeter = bereichStand(w, "gesundheit");
    const z = spaeter.massnahmen.find((m) => m.id === id)!;
    expect(z.imParlament).toBeUndefined();
    setPolicy(w, id, 90);
    expect(bereichStand(w, "gesundheit").massnahmen.find((m) => m.id === id)!.ziel).toBe(90);
  });

  test("Vorschläge lassen sich einem Bereich zuordnen und gehören dann auch zu dessen Maßnahmen", () => {
    const w = welt();
    const alle = alleVorschlaege(w);
    expect(alle.length).toBeGreaterThan(0);
    for (const t of BEREICH_THEMEN) {
      const ids = new Set(bereichStand(w, t).massnahmen.map((m) => m.id));
      for (const v of vorschlaegeIn(alle, t)) expect(ids.has(v.massnahme), `${t}: ${v.massnahme}`).toBe(true);
    }
  });
});
