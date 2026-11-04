// Warnen und hinführen (PRUEFUNG_GESAMT_2026-11-04): Der Schreibtisch warnt vor Massenbewegungen, Putschgefahr, starker Opposition,
// Groll, Ausschussforderung, versiegendem Nachschub und dem Ende einer Waffenruhe; jede Warnung hat ein Ziel. Hinweisfenster
// bekommen ein Ziel aus ihrer Kennung.

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { warnungen } from "../src/ui/schreibtisch/briefing";
import { hinweisZiel } from "../src/ui/hinweisziel";
import { gesellschaftVon } from "../src/sim/gesellschaft";
import { starteBewegung } from "../src/sim/bewegungen";
import { oppositionVon } from "../src/sim/opposition";
import { endenZustand } from "../src/sim/enden";
import { transportZustand } from "../src/sim/transport";
import { setzeSprache } from "../src/i18n";
import type { World } from "../src/sim/types";

const KAPUTT = /undefined|NaN|\{[a-z]+\}|sk\.w\./;
function welt(): World {
  const w = createWorld(turkey2026, 6);
  startAfterElection(w, schnellProfil());
  return w;
}
const ids = (w: World) => warnungen(w).map((x) => x.id);

describe("Innenpolitische Warnungen", () => {
  test("Massenbewegung, Putschstufe, starke Opposition, Ausschuss und Groll erscheinen mit Ziel", async () => {
    for (const sprache of ["de", "en", "tr"] as const) {
      await setzeSprache(sprache);
      const w = welt();
      const b = starteBewegung(w, "teuerung", [34, 6], 40)!;
      b.phase = "massen";
      endenZustand(w).putsch.stufe = 2;
      oppositionVon(w).staerke = 70;
      oppositionVon(w).ausschussBis = w.day + 10;
      gesellschaftVon(w).milieus.kurden!.groll = 60;
      const ws = warnungen(w);
      for (const id of [`bewegung-${b.id}`, "putsch", "opposition", "ausschuss", "groll-kurden"]) {
        const x = ws.find((y) => y.id === id);
        expect(x, id).toBeTruthy();
        expect(x!.ziel).toBeTruthy();
        expect(`${x!.text} ${x!.warum}`).not.toMatch(KAPUTT);
      }
      expect(ws.find((y) => y.id === "putsch")!.stufe).toBe("rot");
      expect(ws.find((y) => y.id === "ausschuss")!.stufe).toBe("rot");
    }
    await setzeSprache("de");
  });
  test("ohne Anlass keine dieser Warnungen", () => {
    const w = welt();
    expect(ids(w).some((id) => ["putsch", "opposition", "ausschuss"].includes(id) || id.startsWith("bewegung-") || id.startsWith("nachschub-"))).toBe(false);
  });
});

describe("Kriegswarnungen", () => {
  test("versiegender Nachschub und eine endende Waffenruhe führen ins Konfliktdossier", () => {
    const w = welt();
    const k = { id: "kv-SYR-1", land: "SYR", phase: "krieg" as const, seit: w.day, eskalation: 90, mobilmachung: 1 as const, front: 40, frontVorher: 40, uhr: 80, uhrGegner: 80, woche: 0, verluste: 0 };
    (w.spiel!.kriege ??= []).push(k);
    const z = transportZustand(w);
    z.bilanz = { monat: w.date.slice(0, 7), routen: [], regionen: {}, depots: { SYR: { land: "SYR", kriegId: k.id, anfang: 0, geliefert: 0.1, verbraucht: 0.1, bedarf: 1, ende: 0, deckung: 0.1, tage: 0 } } };
    const n = warnungen(w).find((x) => x.id === `nachschub-${k.id}`);
    expect(n?.ziel).toEqual({ art: "konflikt", land: "SYR" });
    expect(n?.stufe).toBe("rot");
    (k as { phase: string }).phase = "waffenruhe";
    expect(warnungen(w).find((x) => x.id === `waffenruhe-${k.id}`)?.ziel).toEqual({ art: "konflikt", land: "SYR" });
  });
});

describe("Ziele der Hinweisfenster", () => {
  test("aus der Kennung abgeleitet", () => {
    expect(hinweisZiel("krieg-gegenangebot-kv-GRC-120")).toEqual({ art: "konflikt", land: "GRC" });
    expect(hinweisZiel("krieg-zwischenfall-CYP-300")).toEqual({ art: "konflikt", land: "CYP" });
    expect(hinweisZiel("aussen-sanktion-eu_handel-200")).toEqual({ art: "akte", akte: "welt" });
    expect(hinweisZiel("putsch-geruecht-50")).toEqual({ art: "akte", akte: "personen" });
    expect(hinweisZiel("unbekannt-1")).toBeUndefined();
  });
});
