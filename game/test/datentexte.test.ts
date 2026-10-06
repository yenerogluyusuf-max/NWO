// Texte aus Datenmodulen (Politiknetz, Stufen, Programme, Reich, Erbe, Ämter) in drei Sprachen:
// Der deutsche Katalog entspricht den Daten, Türkisch und Englisch haben jeden Schlüssel mit denselben Platzhaltern,
// und beim Laden in Türkisch oder Englisch stehen die Übersetzungen in den Daten.
import { describe, expect, it, vi } from "vitest";
import { platzhalter } from "../src/i18n";
import { angemeldeteDatentexte } from "../src/i18n/daten";
import { NODES } from "../src/data/politiknetz";
import "../src/data/skalen";
import "../src/sim/programme";
import "../src/sim/personen";
import "../src/data/reich/index";
import "../src/data/erbe";
import "../src/sim/regional";
import "../src/sim/personen-typen";

type Tabelle = Record<string, string>;
const lade = (s: string): Record<string, Tabelle> =>
  Object.fromEntries(Object.entries(import.meta.glob<Tabelle>("../src/i18n/katalog/*/*.json", { eager: true, import: "default" })).filter(([p]) => p.includes(`/katalog/${s}/`)).map(([p, t]) => [p.split("/").pop()!, t]));
const DE = lade("de");
const TR = lade("tr");
const EN = lade("en");

// Kataloge, die dieser Strang anlegt und vollständig in drei Sprachen führt
const VOLL = ["netzknoten.json", "simtexte.json", "daten_skala.json", "daten_programm.json", "daten_amt.json", "daten_vorhaben.json", "daten_vorteil.json", "daten_erbe.json", "daten_region.json", "daten_person.json", "oberflaeche2.json", "simtexte2.json"];

describe("Datentexte", () => {
  it("der deutsche Katalog entspricht den angemeldeten Daten", () => {
    const daten = angemeldeteDatentexte();
    const katalog: Tabelle = {};
    for (const f of VOLL) Object.assign(katalog, DE[f]);
    for (const [k, v] of Object.entries(daten)) expect(katalog[k], k).toBe(v);
    const netz: Tabelle = { ...DE["netz.json"], ...DE["netzknoten.json"] };
    for (const n of NODES) for (const f of ["name", "text"] as const) if (n[f]) expect(netz[`netz.knoten.${n.id}.${f}`], `${n.id}.${f}`).toBe(n[f]);
  });

  for (const f of VOLL) {
    it(`${f}: Türkisch und Englisch vollständig, Platzhalter passen`, () => {
      const de = DE[f]!;
      for (const [name, kat] of [["tr", TR[f]], ["en", EN[f]]] as const) {
        expect(kat, `${name}/${f}`).toBeDefined();
        expect(Object.keys(kat!).sort(), `${name}/${f}`).toEqual(Object.keys(de).sort());
        for (const [k, v] of Object.entries(de)) {
          const ziel = kat![k]!;
          expect(ziel.trim().length, `${name} ${k}`).toBeGreaterThan(0);
          for (const p of platzhalter(ziel)) expect(platzhalter(v), `${name} ${k}: {${p}}`).toContain(p);
        }
      }
    });
  }

  for (const sprache of ["tr", "en"] as const) {
    it(`setzt beim Laden auf ${sprache} die Übersetzungen ein`, async () => {
      vi.resetModules();
      const i18n = await import("../src/i18n");
      await i18n.setzeSprache(sprache);
      const { skala, tunSatz } = await import("../src/data/skalen");
      const { PROGRAMME } = await import("../src/sim/programme");
      const { VORHABEN, VORTEILE } = await import("../src/data/reich/index");
      const { NET } = await import("../src/sim/modell");
      const T = sprache === "tr" ? TR : EN;
      expect(skala("m_mietdeckel", 30).stufen.map((s) => s.name)).toContain(T["daten_skala.json"]!["daten.skala.m_mietdeckel.30.name"]);
      expect(skala("m_lehrergehaelter", 45).frage).toBe(T["simtexte.json"]!["skala.frage.menge"]);
      expect(tunSatz("m_lehrergehaelter", 1, "X")).not.toMatch(/ausbauen/);
      expect(PROGRAMME.find((p) => p.id === "preise")!.titel).toBe(T["daten_programm.json"]!["daten.programm.preise.titel"]);
      const inst = VORHABEN.find((v) => v.pflegt === "infra_marmaray");
      expect(inst?.name ?? "").not.toMatch(/Instandsetzung/);
      expect(VORHABEN.find((v) => v.id === "infra_marmaray")!.kehrseite).toBe(T["daten_vorhaben.json"]!["daten.vorhaben.infra_marmaray.kehrseite"]);
      expect(VORTEILE.find((v) => v.id === "v_drehkreuz")!.name).toBe(T["daten_vorteil.json"]!["daten.vorteil.v_drehkreuz.name"]);
      expect(NET.nodes[NET.index.get("haftueberfuellung")!]!.name).toBe(T["netzknoten.json"]!["netz.knoten.haftueberfuellung.name"]);
      await i18n.setzeSprache("de");
      vi.resetModules();
    });
  }
});
