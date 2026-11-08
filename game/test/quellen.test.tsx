// Die Quellen-Akte: Jede Quelle mit Name, Verweis, Lizenz und Nutzung; die drei Sprachen mit denselben
// Schlüsseln; der Attributionstext enthält jede Quelle; das Rendern ist ohne kaputte Texte.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import de from "../src/i18n/katalog/de/quellen.json";
import tr from "../src/i18n/katalog/tr/quellen.json";
import en from "../src/i18n/katalog/en/quellen.json";
import { QUELLEN, QUELLEN_GRUPPEN, quellenText } from "../src/data/quellen";
import { Quellen } from "../src/ui/quellen/Quellen";

const KAPUTT = /undefined|NaN|\[object|\$\{|quellen\.[a-z]/;

describe("Quellenregister", () => {
  it("jede Quelle hat Verweis, Lizenz und Nutzung, und jede Gruppe fasst etwas", () => {
    expect(QUELLEN.length).toBeGreaterThanOrEqual(12);
    for (const q of QUELLEN) {
      expect(q.url.startsWith("http"), q.id).toBe(true);
      expect(q.lizenz.length).toBeGreaterThan(3);
      expect(q.nutzung.length).toBeGreaterThan(10);
    }
    const gruppen = new Set(QUELLEN.map((q) => q.gruppe));
    for (const g of QUELLEN_GRUPPEN) expect(gruppen.has(g.id), g.id).toBe(true);
  });

  it("der Attributionstext nennt jede Quelle", () => {
    const text = quellenText();
    for (const q of QUELLEN) expect(text).toContain(q.name);
  });

  it("die Akte rendert ohne kaputte Texte und mit jeder Quelle", () => {
    const html = renderToStaticMarkup(createElement(Quellen));
    expect(html).not.toMatch(KAPUTT);
    for (const q of QUELLEN) expect(html).toContain(q.name);
    expect(html).toContain("http");
  });

  it("alle drei Sprachen haben dieselben Schlüssel", () => {
    for (const k of Object.keys(de)) {
      expect(tr, k).toHaveProperty(k);
      expect(en, k).toHaveProperty(k);
    }
    expect(Object.keys(tr).length).toBe(Object.keys(de).length);
    expect(Object.keys(en).length).toBe(Object.keys(de).length);
  });
});
