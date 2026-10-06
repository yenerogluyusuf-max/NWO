// Wissensbaum in der Ansicht: Standortwahl eines Werks, Heureka-Zeile und Tempozeile in drei Sprachen, ohne kaputte Texte.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { VORHABEN } from "../src/data/reich";
import { beginneKnoten, knotenSicht, wissensbaumMonat } from "../src/sim/wissensbaum";
import { reichZustand } from "../src/sim/reich";
import { beziehungAendern } from "../src/sim/welt-modell";
import { NET } from "../src/sim/modell";
import { PROVINCES } from "../src/sim/netz";
import { Detail } from "../src/ui/wissen/Wissensbaum";
import { setzeSprache } from "../src/i18n";
import type { World } from "../src/sim/types";

const KAPUTT = /undefined|NaN|\[object|\$\{|Infinity|⟦|wissen\.[a-z]/;

function setze(w: World, id: string, wert: number): void {
  const i = NET.index.get(id)!;
  for (let p = 0; p < PROVINCES; p++) w.net.values[i * PROVINCES + p] = wert;
}
function welt(): World {
  const w = createWorld(turkey2026, 11);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 200;
  for (const id of ["bio_genomik", "ki_chipfab"]) {
    for (const x of VORHABEN.find((v) => v.id === id)!.voraus) {
      if (x.art === "knoten" || x.art === "massnahme") setze(w, x.id, Math.min(100, (x.min ?? 50) + 5));
      if (x.art === "bestand") reichZustand(w).bestand[x.id] = { seit: w.date, zustand: 90 };
      if (x.art === "land") beziehungAendern(w, x.land, { [x.dim]: 60 });
    }
  }
  return w;
}

afterAll(async () => {
  await setzeSprache("de");
});

describe("Wissensbaum-Ansicht in drei Sprachen", () => {
  for (const sprache of ["de", "tr", "en"] as const) {
    test(`${sprache}: Standorte, Heureka und Tempozeile`, async () => {
      await setzeSprache(sprache);
      const w = welt();
      const k = knotenSicht(w, "ki_chipfab")!;
      expect(k.zustand).toBe("moeglich");
      const html = renderToStaticMarkup(createElement(Detail, { w, k, onGetan: () => {}, onZu: () => {} }));
      expect(html).toContain("wb-standort");
      expect((html.match(/name="ort-ki_chipfab"/g) ?? []).length).toBe(4);
      expect(html).toContain("Kocaeli");
      expect(html).not.toMatch(KAPUTT);
      // Laufender Knoten mit Heureka: Tempozeile nennt nur abweichende Faktoren
      setze(w, "m_forschung", 30);
      wissensbaumMonat(w);
      setze(w, "m_forschung", 50);
      expect(beginneKnoten(w, "bio_genomik").ok).toBe(true);
      setze(w, "m_forschung", 65);
      wissensbaumMonat(w);
      const kl = knotenSicht(w, "bio_genomik")!;
      expect(kl.heureka?.ausgeloest).toBe(true);
      const html2 = renderToStaticMarkup(createElement(Detail, { w, k: kl, onGetan: () => {}, onZu: () => {} }));
      expect(html2).toContain("wb-heureka ja");
      expect(html2).toContain("wb-tempozeile");
      expect(html2).not.toMatch(KAPUTT);
      if (sprache !== "de") expect(html2).not.toMatch(/Schwerpunkt|Abwanderung|Forschungsförderung|Standort/);
    });
  }
});
