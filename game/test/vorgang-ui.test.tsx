// Vorgangsblatt: offene Entscheidung oben, Zeitstrahl, Rechenschaft mit getrennten Modell- und Beobachtungswerten, keine kaputten Texte.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { entscheideVorgang, offenerKonflikt, starteVorgang } from "../src/sim/vorgaenge";
import { VorgangBlatt } from "../src/ui/vorgang/VorgangBlatt";
import { VorgaengeReiter } from "../src/ui/akte/Vorgaenge";
import { VorgaengePlatz } from "../src/ui/akte/Akte";

const KAPUTT = /undefined|NaN|\[object|\$\{|Infinity|⟦|vorgang\.(ui|log|weg|mit|zuordnung)\./;

describe("Vorgangsblatt Hatay", () => {
  test("vom offenen Konflikt bis zur Rechenschaft", () => {
    const w = createWorld(turkey2026, 11);
    startAfterElection(w, schnellProfil());
    expect(renderToStaticMarkup(createElement(VorgaengeReiter, { w }))).toContain("ak-leer");
    const v = starteVorgang(w, { ursprung: { art: "frei", ref: "ui-hatay" }, plaka: 31, wohnungen: 8000, begruendung: "Sichere Wohnungen nach dem Beben." });
    for (let i = 0; i < 400 && !offenerKonflikt(v); i++) advance(w, 1);
    const offen = renderToStaticMarkup(createElement(VorgangBlatt, { w, v }));
    expect(offen).toContain("vg-entscheidung");
    expect(offen).toContain("Wer bezahlt");
    expect(offen).toContain("Hatay");
    expect(offen).not.toMatch(KAPUTT);
    entscheideVorgang(w, v.id, "haushalt");
    for (let i = 0; i < 1200 && v.schritt !== "abgeschlossen"; i++) {
      const k = offenerKonflikt(v);
      if (k) entscheideVorgang(w, v.id, "kompromiss");
      advance(w, 1);
    }
    expect(v.schritt).toBe("abgeschlossen");
    const fertig = renderToStaticMarkup(createElement(VorgangBlatt, { w, v }));
    expect(fertig).toContain("vg-rechenschaft");
    expect(fertig).toContain("(Modell)");
    expect(fertig).toContain("(im Spiel beobachtet)");
    expect(fertig).toContain("Sichere Wohnungen");
    expect(fertig).not.toMatch(KAPUTT);
    const akte = renderToStaticMarkup(createElement(VorgaengePlatz, { w }));
    expect(akte).toContain("vg-reiter");
  });
});

describe("Sprünge zum Vorgang: Schreibtisch, Karte, Zusagen", () => {
  test("Schreibtisch und Provinzblatt nennen den laufenden Vorgang, die Akte öffnet ihn gezielt", async () => {
    const { Schreibtisch } = await import("../src/ui/schreibtisch/Schreibtisch");
    const { ProvinceCard } = await import("../src/ui/ProvinceCard");
    const { vorgaengeIn, wartendeVorgaenge, vorgangZuZusage } = await import("../src/sim/vorgaenge");
    const w = createWorld(turkey2026, 12);
    startAfterElection(w, schnellProfil());
    const a = starteVorgang(w, { ursprung: { art: "frei", ref: "ui-a" }, plaka: 31, wohnungen: 8000 });
    const b = starteVorgang(w, { ursprung: { art: "frei", ref: "ui-b" }, plaka: 34, wohnungen: 6000 });
    for (let i = 0; i < 400 && !offenerKonflikt(a); i++) advance(w, 1);
    expect(vorgaengeIn(w, 31).map((v) => v.id)).toEqual([a.id]);
    expect(wartendeVorgaenge(w).some((v) => v.id === a.id)).toBe(true);
    expect(vorgangZuZusage(w, "ui-b")?.id).toBe(b.id);
    const tisch = renderToStaticMarkup(createElement(Schreibtisch, { world: w, refresh: () => {}, onGehe: () => {}, onVorgang: () => {} }));
    expect(tisch).toContain("Wohnungen in Hatay");
    expect(tisch).not.toMatch(KAPUTT);
    const karte = renderToStaticMarkup(createElement(ProvinceCard, { world: w, plaka: 31, onClose: () => {}, onBauen: () => {}, onVorgang: () => {} }));
    expect(karte).toContain("Laufende Vorgänge hier");
    // Die Akte öffnet genau den angesprungenen Vorgang, nicht den ersten der Liste
    const platz = renderToStaticMarkup(createElement(VorgaengePlatz, { w, start: b.id }));
    expect(platz).toMatch(/vg-eintrag an[^>]*>[^]*?Wohnungen in İstanbul/);
  });
});
