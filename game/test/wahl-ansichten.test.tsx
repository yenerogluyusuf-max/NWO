// Die Ansichten der Wahl: Wahlabend, Umbildung, Zielwahl der neuen Amtszeit. Reine Darstellung, per renderToStaticMarkup geprüft.
// Geprüft wird: Inhalte vollständig, keine kaputten Platzhalter, keine Emojis, Schriften nicht unter 12 px, drei Sprachen.

import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { Wahlabend, sitzPunkte } from "../src/ui/wahl/Wahlabend";
import { Umbildung } from "../src/ui/wahl/Umbildung";
import { ZielWahl } from "../src/ui/ZielWahl";
import { umbildungSicht } from "../src/sim/amtszeit";
import { zieleAngebot } from "../src/sim/ziele";
import { erstelleBilanz } from "../src/sim/bilanz";
import { aktuelleSprache, setzeSprache } from "../src/i18n";
import { zielZustimmung } from "../src/sim/spiel";
import type { World } from "../src/sim/types";

const EMOJI = /[\u{1F300}-\u{1FAFF}️]/u;
const KAPUTT = /undefined|NaN|\[object|\bnull\b|\$\{|Infinity|⟦/;

afterEach(async () => {
  await setzeSprache("de");
});

function nachWiederwahl(): World {
  const w = createWorld(turkey2026, 5);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.umfrage.zustimmung = 80;
  w.spiel!.kalibrierung += 33;
  advance(w, w.spiel!.wahltag - w.day + 1);
  if (w.spiel!.wahl?.stichwahl) advance(w, 16);
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 40;
  return w;
}

const keine = () => {};

/**
 * Bis kurz nach dem ersten Wahlgang, mit der Zustimmung `ziel` am Wahltag: Wer fünf Jahre nichts entscheidet, verliert unterwegs
 * Zustimmung (liegengelassene Bitten, sim/infrastruktur.ts); darum wird sie halbjährlich und einen Monat vor der Wahl auf den Zielwert gesetzt.
 */
function bisWahltagMit(w: World, ziel: number): void {
  const anker = () => {
    for (let i = 0; i < 3; i++) w.spiel!.kalibrierung += ziel - zielZustimmung(w);
    w.spiel!.umfrage.zustimmung = ziel;
  };
  while (w.spiel!.wahltag - w.day > 30 && !w.spiel!.ende) {
    advance(w, Math.min(180, w.spiel!.wahltag - w.day - 30));
    anker();
  }
  advance(w, w.spiel!.wahltag - w.day + 1);
}

describe("Wahlabend", () => {
  test("Endstand: Kandidaten, Provinzkarte, Sitze vorher und nachher, Reaktionen, Rede", () => {
    const w = nachWiederwahl();
    const e = w.spiel!.wahl!.historie[0]!;
    const html = renderToStaticMarkup(createElement(Wahlabend, { ergebnis: e, onRede: () => "ok", onSchliessen: keine, stufe: 5 }));
    expect(html).toContain("Wahlabend");
    expect(html).toContain("Endergebnis");
    expect(html).toContain(e.kandidaten[0]!.name);
    expect(html).toContain(e.kandidaten[1]!.name);
    const karte = html.slice(html.indexOf("wn-karte"), html.indexOf("</svg>", html.indexOf("wn-karte")));
    expect((karte.match(/<path /g) ?? []).length).toBe(81);
    const sitze = html.slice(html.indexOf("wn-sitze"), html.indexOf("wn-parteien"));
    expect((sitze.match(/<circle /g) ?? []).length).toBe(1200);
    expect(html).toContain("Das neue Parlament");
    expect(html).toContain("Reaktionen");
    expect(html).toContain("Ihre Rede an die Nation");
    expect(html).toContain("Einende Rede");
    expect(html).toContain("Weiter");
    expect(html).not.toMatch(KAPUTT);
    expect(html).not.toMatch(EMOJI);
  });

  test("Anfangsstand: nichts ausgezählt, Weiter gesperrt, Rede gesperrt", () => {
    const w = nachWiederwahl();
    const e = w.spiel!.wahl!.historie[0]!;
    const html = renderToStaticMarkup(createElement(Wahlabend, { ergebnis: e, onRede: () => "ok", onSchliessen: keine, stufe: 0 }));
    expect(html).toContain("0 % ausgezählt");
    expect(html).toContain("Auszählung läuft");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>[^<]*Auszählung läuft/);
    expect(html).not.toMatch(KAPUTT);
  });

  test("Stichwahl: beide Wahlgänge stehen im Ergebnis", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const w = createWorld(turkey2026, seed);
      startAfterElection(w, schnellProfil());
      w.spiel!.ereignisse = [];
      w.spiel!.umfrage.zustimmung = 48;
      w.spiel!.kalibrierung += 1;
      bisWahltagMit(w, 48);
      if (!w.spiel!.wahl?.stichwahl) continue;
      advance(w, 16);
      const e = w.spiel!.wahl!.historie[0]!;
      const html = renderToStaticMarkup(createElement(Wahlabend, { ergebnis: e, onSchliessen: keine, stufe: 5 }));
      expect(html).toContain("1. Wahlgang");
      expect(html).toContain("2. Wahlgang");
      expect(html).not.toMatch(KAPUTT);
      return;
    }
    throw new Error("keine Stichwahl gefunden");
  });

  test("Niederlage: keine Rede, Hinweis auf die Bilanz", () => {
    const w = createWorld(turkey2026, 5);
    startAfterElection(w, schnellProfil());
    w.spiel!.kalibrierung += 38 - zielZustimmung(w);
    w.spiel!.umfrage.zustimmung = 38;
    bisWahltagMit(w, 38);
    if (w.spiel!.wahl?.stichwahl) advance(w, 16);
    const e = w.spiel!.wahl!.historie[0]!;
    expect(e.gewonnen).toBe(false);
    const html = renderToStaticMarkup(createElement(Wahlabend, { ergebnis: e, onRede: () => "ok", onSchliessen: keine, stufe: 5 }));
    expect(html).not.toContain("Ihre Rede an die Nation");
    expect(html).toContain("Bilanz");
  });

  test("Türkisch und Englisch: Überschriften in der Sprache, keine deutschen Reste in den festen Texten", async () => {
    const w = nachWiederwahl();
    const e = w.spiel!.wahl!.historie[0]!;
    await setzeSprache("tr");
    let html = renderToStaticMarkup(createElement(Wahlabend, { ergebnis: e, onRede: () => "ok", onSchliessen: keine, stufe: 5 }));
    expect(aktuelleSprache()).toBe("tr");
    expect(html).toContain("Seçim gecesi");
    expect(html).toContain("Yeni meclis");
    expect(html).toContain("Tepkiler");
    expect(html).not.toContain("Das neue Parlament");
    expect(html).not.toMatch(KAPUTT);
    await setzeSprache("en");
    html = renderToStaticMarkup(createElement(Wahlabend, { ergebnis: e, onRede: () => "ok", onSchliessen: keine, stufe: 5 }));
    expect(html).toContain("Election night");
    expect(html).toContain("The new parliament");
    expect(html).not.toMatch(KAPUTT);
  });

  test("Sitzpunkte: 600 Punkte auf Halbkreisen, links nach rechts", () => {
    const p = sitzPunkte(600);
    expect(p).toHaveLength(600);
    expect(p[0]!.x).toBeLessThan(p[599]!.x);
    expect(sitzPunkte(0)).toHaveLength(0);
  });
});

describe("Umbildung", () => {
  test("Sieben Ministerkarten mit Werten und Aktionen, Zwischenbilanz, Kronprinzen in der letzten Amtszeit", () => {
    const w = nachWiederwahl();
    const sicht = umbildungSicht(w)!;
    const html = renderToStaticMarkup(
      createElement(Umbildung, {
        sicht,
        kapital: w.spiel!.kapital,
        zwischenbilanz: erstelleBilanz(w, "zwischen"),
        aspiranten: w.spiel!.nachfolge?.aspiranten ?? [],
        onBehalten: keine,
        onErsetzen: keine,
        onEntlassen: keine,
        onVersetzen: keine,
        onPartner: keine,
        onFertig: keine,
      }),
    );
    expect((html.match(/class="ub-karte[\s"]/g) ?? []).length).toBe(7);
    expect(html).toContain("Die Regierung neu aufstellen");
    expect(html).toContain("Im Amt bestätigen");
    expect(html).toContain("Zwischenbilanz der ersten Amtszeit");
    expect(html).toContain("Die Nachfolgefrage");
    expect(html).toContain("Umbildung abschließen");
    expect(html).not.toMatch(KAPUTT);
    expect(html).not.toMatch(EMOJI);
  });

  test("Entschiedene Karten tragen ihren Status", () => {
    const w = nachWiederwahl();
    w.spiel!.umbildung!.entschieden.finanzen = "behalten";
    const html = renderToStaticMarkup(createElement(Umbildung, { sicht: umbildungSicht(w)!, kapital: 10, onBehalten: keine, onErsetzen: keine, onEntlassen: keine, onVersetzen: keine, onPartner: keine, onFertig: keine }));
    expect(html).toContain("bestätigt");
    expect(html).toContain("1 von 7");
  });

  test("Türkisch: Titel und Knöpfe", async () => {
    const w = nachWiederwahl();
    await setzeSprache("tr");
    const html = renderToStaticMarkup(createElement(Umbildung, { sicht: umbildungSicht(w)!, kapital: 10, onBehalten: keine, onErsetzen: keine, onEntlassen: keine, onVersetzen: keine, onPartner: keine, onFertig: keine }));
    expect(html).toContain("Hükümeti yeniden kurmak");
    expect(html).toContain("Görevde teyit et");
    expect(html).not.toMatch(KAPUTT);
  });
});

describe("Zielwahl der neuen Amtszeit", () => {
  test("Gruppiert nach Bereichen, mit Stand, ohne Schwierigkeit", () => {
    const w = nachWiederwahl();
    const html = renderToStaticMarkup(createElement(ZielWahl, { modus: "amtszeit", angebot: zieleAngebot(w, true), onFertig: keine }));
    expect(html).toContain("Beginn der Amtszeit");
    expect(html).toContain("Außenpolitik");
    expect(html).toContain("Staat und Ordnung");
    expect(html).toContain("Heute:");
    expect(html).toContain("Ein Nachfolger, der gewinnt");
    expect(html).not.toContain("Schwierigkeit");
    expect(html).not.toMatch(KAPUTT);
  });

  test("Der erste Tag bleibt wie bisher: ganze Liste mit Schwierigkeit", () => {
    const html = renderToStaticMarkup(createElement(ZielWahl, { onFertig: keine }));
    expect(html).toContain("Erster Tag im Amt");
    expect(html).toContain("Schwierigkeit");
    expect(html).toContain("Inflation unter 15 Prozent");
  });
});

describe("Gestaltung", () => {
  test("Keine Schrift unter 12 px in wahl.css", () => {
    const css = readFileSync(`${__dirname}/../src/ui/wahl/wahl.css`, "utf8");
    for (const m of css.matchAll(/font:[^;]*?(\d+(?:\.\d+)?)px/g)) expect(Number(m[1]), m[0]).toBeGreaterThanOrEqual(12);
    for (const m of css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) expect(Number(m[1]), m[0]).toBeGreaterThanOrEqual(12);
  });
});
