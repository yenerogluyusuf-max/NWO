// Arbeitspaket 0 des Detailplans Oberfläche (PLAN_OBERFLAECHE_DETAIL_2026-11-05.md): Sofort-Fehler aus dem Rundgang vom
// 5. November, jeder mit einem Beleg. Nur lesend; die Welt bleibt unverändert.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { advance, createWorld, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { kernwerteBereich, BereichsAkte } from "../src/ui/akte/Bereiche";
import { Reich } from "../src/ui/Reich";
import { kapitalEinkommen } from "../src/sim/spiel";
import { paktSicht } from "../src/sim/pakte";
import { angespannteLaender } from "../src/ui/akte/Konfliktlage";
import type { World } from "../src/sim/types";

function welt(): World {
  const w = createWorld(turkey2026, 11);
  startAfterElection(w, schnellProfil());
  advance(w, 45);
  return w;
}

test("Kapitaltabelle der Verwaltung summiert sichtbar zum Saldo und zeigt kein −0,0", () => {
  const w = welt();
  const vorher = save(w);
  const html = renderToStaticMarkup(createElement(Reich, { world: w, bereich: "haushalt", refresh: () => {} }));
  expect(html).not.toContain("−0,0");
  expect(html).toContain("Ertrag des Kabinetts");
  expect(html).toContain("Saldo je Monat");
  const k = kapitalEinkommen(w);
  expect(k.grund + k.vertrauen + k.mehrheit + k.legitimitaet + k.kabinett - k.unterhalt - k.altlast).toBeCloseTo(k.summe, 6);
  expect(save(w)).toBe(vorher);
});

test("Baureihenfolge nicht in Kultur, Recht und Haushalt", () => {
  const w = welt();
  for (const bereich of ["kultur", "recht", "haushalt"] as const) {
    const html = renderToStaticMarkup(createElement(Reich, { world: w, bereich, refresh: () => {} }));
    expect(html).not.toMatch(/Altay|KAAN/);
  }
});

test("NATO zählt alle Mitglieder (32), nicht nur die modellierten", () => {
  const w = welt();
  const nato = paktSicht(w).find((p) => p.id === "nato")!;
  expect(nato).toBeTruthy();
  const html = renderToStaticMarkup(createElement(BereichsAkte, { bereich: "sicherheit", world: w, tabs: [{ id: "x", label: "x" }], aktiverTab: "x", onTab: () => {}, reiter: "lage", onReiter: () => {}, children: null }));
  expect(html).not.toMatch(/Nordatlantikpakt[^<]*<\/b><span>1[0-9] /);
});

test("Konfliktlage ohne EU und ferne Mächte; Kopf zählt angespannte Länder mit", () => {
  const w = welt();
  for (const l of angespannteLaender(w)) expect(["EU", "USA", "CHN", "SAU", "KAZ"]).not.toContain(l.id);
  const k = kernwerteBereich(w, "sicherheit").find((x) => x.label === "Laufende Konflikte")!;
  expect(k.hinweis).toMatch(/angespannt/);
});

test("Land nennt das Verkehrsnetz beim Namen und zählt Netze mit örtlicher Überlast", () => {
  const w = welt();
  const labels = kernwerteBereich(w, "land").map((k) => k.label);
  expect(labels).toContain("Verkehrsnetz");
  expect(labels).toContain("Netze mit Überlast");
  expect(labels).not.toContain("Infrastruktur");
});

test("Keine internen Kürzel (Z1) … in Spielertexten", () => {
  for (const sprache of ["de", "en", "tr"]) {
    const ordner = join(__dirname, "../src/i18n/katalog", sprache);
    for (const datei of readdirSync(ordner)) expect(readFileSync(join(ordner, datei), "utf8")).not.toMatch(/\(Z\d\)/);
  }
});

test("Krisenrat und Katastrophen teilen keine CSS-Klassen mehr (.kr-lage, .kr-kopf)", () => {
  const krisenrat = readFileSync(join(__dirname, "../src/ui/wirtschaft/krisenrat.css"), "utf8");
  expect(krisenrat).not.toMatch(/\.kr-(lage|kopf)\b/);
});
