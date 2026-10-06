// Gesetzesvorhaben mit Konflikt: Daten vollständig, Fassungen ehrlich gestaffelt, Abstimmung über die vorhandene Mechanik,
// Partner springen bei scharfen Fassungen ab, Erlass nur wo erlaubt, Verfassungsgericht hebt auf oder bestätigt, alte Spielstände laden.

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { GRUPPEN } from "../src/sim/gruppen";
import { FASSUNGEN, GESETZESVORHABEN, VERBAENDE, VORHABEN_NACH_ID } from "../src/data/gesetzesvorhaben";
import { bringeVorhabenEin, gesetzesTisch, gesetzgebungTag, gesetzgebungVon, laufendeVerfahren, vorhabenSicht } from "../src/sim/gesetzgebung";
import de from "../src/i18n/katalog/de/gesetze.json";
import tr from "../src/i18n/katalog/tr/gesetze.json";
import en from "../src/i18n/katalog/en/gesetze.json";
import type { World } from "../src/sim/types";

function neu(seed = 11): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 120;
  return w;
}
const def = (id: string) => VORHABEN_NACH_ID.get(id)!;

describe("Daten", () => {
  test("20 bis 30 Vorhaben, jede Maßnahme im Netz, jeder Akteur bekannt", () => {
    expect(GESETZESVORHABEN.length).toBeGreaterThanOrEqual(20);
    expect(GESETZESVORHABEN.length).toBeLessThanOrEqual(30);
    const gruppen = new Set(GRUPPEN.map((g) => g.id));
    for (const v of GESETZESVORHABEN) {
      expect(NET.index.has(v.massnahme), v.id).toBe(true);
      expect(v.fuer.length, v.id).toBeGreaterThan(0);
      expect(v.gegen.length, v.id).toBeGreaterThan(0);
      for (const a of [...v.fuer, ...v.gegen]) expect(gruppen.has(a) || a in VERBAENDE, `${v.id}: ${a}`).toBe(true);
    }
    for (const g of Object.values(VERBAENDE)) if (g.gruppe) expect(gruppen.has(g.gruppe)).toBe(true);
  });

  test("Texte in allen drei Sprachen", () => {
    for (const kat of [de, tr, en] as Record<string, string>[]) {
      for (const v of GESETZESVORHABEN) for (const k of ["titel", "satz", "kompromiss"]) expect(kat[`gesetz.v.${v.id}.${k}`], `${v.id}.${k}`).toBeTruthy();
      for (const id of Object.keys(VERBAENDE)) expect(kat[`gesetz.verband.${id}`], id).toBeTruthy();
      expect(Object.keys(kat).sort()).toEqual(Object.keys(de).sort());
    }
  });
});

describe("Karten", () => {
  test("Fassungen gestaffelt: scharf kostet mehr und holt weniger Stimmen als verwässert", () => {
    const w = neu();
    for (const s of gesetzesTisch(w)) {
      const [a, b, c] = FASSUNGEN.map((f) => s.fassungen[f]);
      expect(Math.abs(a!.aenderung), s.def.id).toBeGreaterThanOrEqual(Math.abs(b!.aenderung));
      expect(Math.abs(b!.aenderung), s.def.id).toBeGreaterThanOrEqual(Math.abs(c!.aenderung));
      expect(a!.pk, s.def.id).toBeGreaterThanOrEqual(c!.pk);
      expect(a!.ja, s.def.id).toBeLessThanOrEqual(c!.ja);
    }
  });

  test("Lager: Parteien nach Linie, Verbände aus den Daten; Partner, die dagegen sind, springen bei scharf ab", () => {
    const w = neu();
    const s = vorhabenSicht(w, def("gv_friedensprozess"));
    expect(s.lager.gegen.some((e) => e.id === "MHP")).toBe(true);
    expect(s.lager.fuer.some((e) => e.art === "verband")).toBe(true);
    // MHP sitzt im Lager und lehnt ab: Die scharfe Fassung verliert Stimmen, der Kompromiss gewinnt
    expect(w.spiel!.lager).toContain("MHP");
    expect(s.fassungen.scharf.stimmenBonus).toBeLessThan(0);
    expect(s.fassungen.kompromiss.stimmenBonus).toBeGreaterThan(s.fassungen.scharf.stimmenBonus);
  });

  test("ohne Lager fehlt die Mehrheit: die Karte sagt es vorher", () => {
    const w = neu();
    w.spiel!.lager = [];
    const urteile = gesetzesTisch(w).map((s) => s.fassungen.scharf.urteil);
    expect(urteile).toContain("verloren");
  });
});

describe("Ablauf", () => {
  test("Gesetz einbringen, Abstimmung, Folgen, Ruhezeit", () => {
    const w = neu();
    const r = bringeVorhabenEin(w, "gv_mindestlohn", "kompromiss", "gesetz");
    expect(r.ok).toBe(true);
    const g = w.spiel!.gesetze.find((x) => x.vorhaben === "gv_mindestlohn")!;
    expect(g.fassung).toBe("kompromiss");
    expect(laufendeVerfahren(w).parlament).toHaveLength(1);
    // zweimal geht nicht
    expect(bringeVorhabenEin(w, "gv_mindestlohn", "scharf", "gesetz").ok).toBe(false);
    advance(w, 25);
    expect(w.spiel!.gesetze.some((x) => x.vorhaben === "gv_mindestlohn")).toBe(false);
    const z = gesetzgebungVon(w);
    expect(z.beschlossen.map((b) => b.vorhaben)).toContain("gv_mindestlohn");
    expect(z.ruhe.gv_mindestlohn).toBeGreaterThan(w.day);
    expect(w.log.some((l) => l.text.startsWith("Das Parlament nimmt „Mindestlohngesetz"))).toBe(true);
    expect(vorhabenSicht(w, def("gv_mindestlohn")).fassungen.kompromiss.moeglich).toBe(false);
  });

  test("verlorene Abstimmung: Kapital weg, kurze Ruhezeit", () => {
    const w = neu();
    w.spiel!.lager = [];
    const s = gesetzesTisch(w).find((x) => x.fassungen.scharf.urteil === "verloren" && x.fassungen.scharf.moeglich)!;
    expect(bringeVorhabenEin(w, s.def.id, "scharf", "gesetz").ok).toBe(true);
    advance(w, 25);
    const z = gesetzgebungVon(w);
    expect(z.beschlossen.map((b) => b.vorhaben)).not.toContain(s.def.id);
    expect(z.ruhe[s.def.id]! - w.day).toBeLessThan(120);
  });

  test("Erlass nur, wo das Recht ihn zulässt", () => {
    const w = neu();
    expect(bringeVorhabenEin(w, "gv_einkommensteuer", "kompromiss", "erlass").ok).toBe(false);
    const r = bringeVorhabenEin(w, "gv_polizei", "kompromiss", "erlass");
    expect(r.ok).toBe(true);
    expect(laufendeVerfahren(w).gericht).toHaveLength(1);
  });

  test("Verfassungsgericht: hebt auf und setzt die alte Stufe zurück, oder bestätigt", () => {
    for (const p of [1, 0]) {
      const w = neu();
      const vorher = vorhabenSicht(w, def("gv_netzinhalte")).stufe;
      expect(bringeVorhabenEin(w, "gv_netzinhalte", "scharf", "erlass").ok).toBe(true);
      const z = gesetzgebungVon(w);
      z.pruefungen[0]!.p = p;
      z.pruefungen[0]!.tag = w.day;
      const ziel = w.net.targets.m_internetsperren;
      gesetzgebungTag(w);
      expect(z.pruefungen).toHaveLength(0);
      if (p === 1) {
        expect(w.net.targets.m_internetsperren).toBe(vorher);
        expect(w.log.some((l) => l.text.startsWith("Das Verfassungsgericht hebt den Erlass"))).toBe(true);
      } else {
        expect(w.net.targets.m_internetsperren).toBe(ziel);
        expect(w.log.some((l) => l.text.includes("weist die Klage"))).toBe(true);
      }
    }
  });
});

describe("Spielstände", () => {
  test("ältere Stände ohne Gesetzgebung laden und spielen weiter", () => {
    const w = neu();
    bringeVorhabenEin(w, "gv_renten", "verwaessert", "gesetz");
    const roh = JSON.parse(save(w));
    delete roh.spiel.gesetzgebung;
    for (const g of roh.spiel.gesetze) {
      delete g.vorhaben;
      delete g.fassung;
      delete g.stimmenBonus;
    }
    const w2 = load(JSON.stringify(roh));
    expect(() => gesetzesTisch(w2)).not.toThrow();
    expect(w2.spiel!.gesetzgebung).toBeUndefined();
    advance(w2, 25);
    expect(w2.log.some((l) => /^Das Parlament (nimmt|lehnt) „Rentenanpassungsgesetz/.test(l.text))).toBe(true);
    expect(gesetzgebungVon(w2).beschlossen).toEqual([]);
  });

  test("Spielstand mit laufender Prüfung übersteht Speichern und Laden", () => {
    const w = neu();
    bringeVorhabenEin(w, "gv_rueckkehr", "kompromiss", "erlass");
    const w2 = load(save(w));
    expect(laufendeVerfahren(w2).gericht).toHaveLength(1);
  });
});
