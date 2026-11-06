// Feiermoment (befund-H H-24): Der Wächter meldet jedes neu beschlossene Gesetz, jeden vollendeten Fokus und jedes erreichte Ziel genau
// einmal; was beim ersten Blick schon fertig war, bleibt still. Die Komponente zeigt nichts bei der Effektstufe „Aus“.

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { feierStand, neueFeiern } from "../src/ui/anim/feierwaechter";
import { Feiermoment, FEIER_DAUER } from "../src/ui/anim/Feier";
import { setzeEffektstufe } from "../src/ui/anim/effekte";
import { fokusZustand } from "../src/sim/fokus";
import { readFileSync } from "node:fs";

const welt = () => {
  const w = createWorld(turkey2026, 5);
  startAfterElection(w, schnellProfil());
  return w;
};
afterEach(() => setzeEffektstufe("mittel"));

test("ein beschlossenes Gesetz wird einmal gefeiert, ein abgelehntes nie", () => {
  const w = welt();
  const stand = feierStand(w);
  expect(neueFeiern(w, stand)).toEqual([]);
  w.log.push({ day: w.day, date: w.date, kind: "entscheidung", text: "x", abstimmung: { art: "gesetz", name: "Mietpreisbremse", ort: "TBMM", ja: 320, nein: 280, angenommen: true } });
  w.log.push({ day: w.day, date: w.date, kind: "entscheidung", text: "y", abstimmung: { art: "gesetz", name: "Abgelehnt", ort: "TBMM", ja: 200, nein: 400, angenommen: false } });
  const f = neueFeiern(w, stand);
  expect(f).toHaveLength(1);
  expect(f[0]).toMatchObject({ art: "gesetz", kicker: "Gesetz beschlossen", titel: "Mietpreisbremse" });
  expect(neueFeiern(w, stand)).toEqual([]);
});

test("ein vollendeter Fokus wird gefeiert; was beim ersten Blick schon fertig war, nicht", () => {
  const w = welt();
  const z = fokusZustand(w);
  z.fertig.push({ id: "alt", tag: 1 });
  const stand = feierStand(w);
  expect(neueFeiern(w, stand)).toEqual([]);
  z.fertig.push({ id: "neu", tag: 2 });
  const f = neueFeiern(w, stand);
  expect(f.map((x) => x.art)).toEqual(["fokus"]);
  expect(f[0]!.kicker).toBe("Fokus erreicht");
});

test("Komponente: ohne Moment nichts im Bild; Dauer kurz; Bewegung reduzieren und „Aus“ sind im Stil bedacht", () => {
  setzeEffektstufe("aus");
  expect(renderToStaticMarkup(<Feiermoment />)).toBe("");
  expect(FEIER_DAUER).toBeLessThanOrEqual(2000);
  const css = readFileSync(`${__dirname}/../src/ui/anim/feier.css`, "utf8");
  expect(css).toMatch(/prefers-reduced-motion: reduce/);
  expect(css).toMatch(/data-effekte="aus"\] \.feier \{ display: none/);
});
