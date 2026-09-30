// Jedes Ereignis lässt sich öffnen, hat lesbare Texte, benennt seine Akteure und rechnet seine Antworten fehlerfrei durch.

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { VORLAGEN, ansicht, oeffne, entscheide } from "../src/sim/ereignisse";
import { Rng } from "../src/sim/rng";
import { advance } from "../src/sim/world";
import { weltZustand } from "../src/sim/laender";

const KAPUTT = /undefined|NaN|\[object|\bnull\b|\$\{|Infinity/;

function welt(seed: number) {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 100;
  // Länder-Ereignisse setzen eine schon erlebte Lage voraus: hohes Vertrauen zur EU, Streit mit Griechenland
  advance(w, 210);
  w.spiel!.ereignisse = [];
  w.spiel!.hinweise = [];
  weltZustand(w).EU!.versatz += 30;
  weltZustand(w).GRC!.konflikt = 80;
  return w;
}

describe("Ereignistexte", () => {
  test.each(VORLAGEN.map((v) => v.id))("%s: lesbare Texte, benannte Akteure, fehlerfreie Antworten", (id) => {
    let geoeffnet = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const w = welt(seed);
      if (id === "zusage") w.spiel!.zusagen.push({ id: "z-t", von: Object.keys(w.parliament!.seats)[1]!, text: "Die Partei erwartet mehr Wissenschaftsfreiheit", faellig: 0, massnahme: "m_wissenschaftsfreiheit", richtung: 1, erfuellt: false, gebrochen: false });
      const ev = oeffne(w, id, new Rng(seed * 13), id === "zusage" ? { provinzen: [], staerke: 1, daten: { zusage: "z-t" } } : undefined);
      if (!ev) continue;
      geoeffnet++;
      const a = ansicht(w, ev);
      const alles = [a.titel, ...a.text, a.warum, ...a.optionen.flatMap((o) => [o.label, o.beschreibung, ...o.vorschau]), ...a.massnahmen.map((m) => m.name)].join(" ¦ ");
      expect(alles, `${id} Seed ${seed}`).not.toMatch(KAPUTT);
      expect(a.titel.length).toBeGreaterThan(3);
      expect(a.optionen.length).toBeGreaterThanOrEqual(2);
      // Immer gibt es mindestens eine kostenlose Antwort, auch wenn das Kapital leer ist
      expect(a.optionen.some((o) => (o.anzeigePk ?? o.pk) === 0), `${id} ohne kostenlose Antwort`).toBe(true);
      expect(alles).not.toMatch(/eines europäischen Staates|ein Nachbarland|einem Nachbarn/);
      // Jede Antwort lässt sich ausführen, ohne dass etwas abstürzt
      for (const o of a.optionen) {
        const w2 = welt(seed);
        if (id === "zusage") w2.spiel!.zusagen.push({ id: "z-t", von: Object.keys(w2.parliament!.seats)[1]!, text: "Die Partei erwartet mehr Wissenschaftsfreiheit", faellig: 0, massnahme: "m_wissenschaftsfreiheit", richtung: 1, erfuellt: false, gebrochen: false });
        const e2 = oeffne(w2, id, new Rng(seed * 13), id === "zusage" ? { provinzen: [], staerke: 1, daten: { zusage: "z-t" } } : undefined)!;
        const r = entscheide(w2, e2.id, o.id, new Rng(5));
        expect(r.text, `${id}/${o.id}`).not.toMatch(KAPUTT);
      }
    }
    if (!["zusage", "koalitionsangebot"].includes(id) && !id.startsWith("start_")) expect(geoeffnet, `${id} ließ sich nie öffnen`).toBeGreaterThan(0);
  });
});
