// Welle E3b: Die letzte Amtszeit kündigt sich an (Beginn, rund 19 und 9 Monate vor der Wahl), ein Verfassungspaket, das erst nach der Wahl
// wirken könnte, wird nicht mehr angeboten und sagt beim Einbringen, dass es zu spät ist, und die Neuwahl durch das Parlament nach Art. 116
// Abs. 3 öffnet einmal eine weitere Kandidatur.
import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { antworten, entscheide, oeffne, vorlage } from "../src/sim/ereignisse";
import { LETZTE, offeneAnkuendigung } from "../src/sim/ereignisse-letzte";
import { aymEntscheiden, bringeVerfassungEin, pruefeVerfassung, verfassungAbstimmen, verfassungsZustand, zusatzKandidaturMoeglich } from "../src/sim/verfassung";
import { maxAmtszeiten } from "../src/sim/amtszeit";
import { machtkreis } from "../src/sim/machtkreis";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

function letzteWelt(seed = 4): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  const sp = w.spiel!;
  sp.ereignisse = [];
  sp.kapital = 80;
  sp.amtszeit = 2;
  sp.wahltag = w.day + 1700;
  return w;
}

describe("Ankündigung der letzten Amtszeit", () => {
  test("nur in der letzten Amtszeit, je Stufe einmal", () => {
    const frisch = createWorld(turkey2026, 4);
    startAfterElection(frisch, schnellProfil());
    expect(offeneAnkuendigung(frisch)).toBe(0);
    expect(vorlage("amtszeit_letzte").chance(frisch)).toBe(0);
    const w = letzteWelt();
    expect(offeneAnkuendigung(w)).toBe(1);
    oeffne(w, "amtszeit_letzte", new Rng(1));
    expect(offeneAnkuendigung(w)).toBe(0);
    w.spiel!.ereignisse = [];
    w.spiel!.wahltag = w.day + LETZTE.stufe2 - 10;
    expect(offeneAnkuendigung(w)).toBe(2);
    oeffne(w, "amtszeit_letzte", new Rng(1));
    w.spiel!.ereignisse = [];
    w.spiel!.wahltag = w.day + LETZTE.stufe3 - 10;
    expect(offeneAnkuendigung(w)).toBe(3);
    expect(vorlage("amtszeit_letzte").eigenerPlatz).toBe(true);
  });

  test("Wege: Verfassung, Neuwahl nach Art. 116, Nachfolger, Abtreten; die Verfassung bucht ihren Preis", () => {
    const w = letzteWelt();
    const ev = oeffne(w, "amtszeit_letzte", new Rng(1))!;
    const ids = antworten(w, ev).map((o) => o.id);
    expect(ids).toEqual(["lockern", "neuwahl", "aufbauen", "abtreten", "spaeter"]);
    const lockern = antworten(w, ev).find((o) => o.id === "lockern")!;
    expect(lockern.sperre).toBeUndefined();
    expect(lockern.bedingungen![0]).toContain("360");
    expect(lockern.bedingungen![0]).toContain("400");
    const k = load(save(w));
    const kap = k.spiel!.kapital;
    expect(entscheide(k, ev.id, "lockern", new Rng(2)).ok).toBe(true);
    expect(verfassungsZustand(k).laufend?.paket.amtszeit).toBe("wiederwahl_plus");
    expect(kap - k.spiel!.kapital).toBe(lockern.anzeigePk);
    const a = load(save(w));
    const druck = machtkreis(a).nachfolge;
    entscheide(a, ev.id, "aufbauen", new Rng(2));
    expect(machtkreis(a).nachfolge).toBeCloseTo(Math.max(0, druck + LETZTE.aufbauen.druck), 6);
  });
});

describe("Frist der Verfassung", () => {
  test("zu spät: kein Weg mehr, und wer trotzdem einbringt, liest es", () => {
    const w = letzteWelt();
    w.spiel!.wahltag = w.day + 20;
    const pr = pruefeVerfassung(w, { amtszeit: "unbegrenzt" });
    expect(pr.zuSpaet).toBe(true);
    expect(pr.hinweise[0]).toMatch(/Zu spät/);
    w.spiel!.machtkreis = undefined;
    const ev = oeffne(w, "amtszeit_letzte", new Rng(1))!;
    expect(antworten(w, ev).find((o) => o.id === "lockern")!.sperre).toMatch(/Zu spät/);
    const r = bringeVerfassungEin(w, { amtszeit: "unbegrenzt" });
    expect(r.ok).toBe(true);
    expect(r.text).toMatch(/zu spät/);
  });

  test("knapp: nur mit 400 Stimmen rechtzeitig", () => {
    const w = letzteWelt();
    w.spiel!.wahltag = w.day + 45;
    const pr = pruefeVerfassung(w, { amtszeit: "unbegrenzt" });
    expect(pr.zuSpaet).toBeUndefined();
    expect(pr.hinweise[0]).toMatch(/400/);
  });
});

describe("Art. 116 Abs. 3: Neuwahl durch das Parlament", () => {
  test("öffnet einmal eine weitere Kandidatur, 360 genügen ohne Volksabstimmung", () => {
    let geprueft = false;
    for (let s = 1; s < 30 && !geprueft; s++) {
      const w = letzteWelt();
      expect(zusatzKandidaturMoeglich(w)).toBe(true);
      const vorher = maxAmtszeiten(w);
      expect(bringeVerfassungEin(w, { amtszeit: "neuwahl_jetzt" }).ok).toBe(true);
      const v = verfassungsZustand(w).laufend!;
      v.absprachen = 120;
      w.day = v.abstimmung;
      const rng = new Rng(s);
      const e = verfassungAbstimmen(w, rng);
      if (e.weg === "gescheitert") continue;
      expect(e.weg).toBe("direkt");
      if (verfassungsZustand(w).laufend?.phase === "aym") {
        const k = aymEntscheiden(w, rng);
        if (k.kassiert) continue;
      }
      expect(verfassungsZustand(w).zusatzKandidatur).toBe(2);
      expect(maxAmtszeiten(w)).toBe(vorher + 1);
      expect(w.spiel!.wahltag).toBeLessThanOrEqual(w.day + 60);
      expect(zusatzKandidaturMoeglich(w)).toBe(false);
      expect(offeneAnkuendigung(w)).toBe(0);
      geprueft = true;
    }
    expect(geprueft).toBe(true);
  });
});

const S2043 = new URL("../../../../spielstand/s2043.json", import.meta.url);
test.skipIf(!existsSync(S2043))("Spielstand des Inhabers 2043: Die letzte Amtszeit wäre angekündigt worden", () => {
  const roh = JSON.parse(readFileSync(S2043, "utf8")) as { welt: World };
  const w = load(JSON.stringify(roh.welt));
  expect(w.spiel!.amtszeit).toBe(maxAmtszeiten(w));
  expect(offeneAnkuendigung(w)).toBe(1);
  // Drei Tage vor der Wahl (wie am 1. Juni 2045): kein Weg mehr über die Verfassung
  w.day = w.spiel!.wahltag - 3;
  expect(pruefeVerfassung(w, { amtszeit: "unbegrenzt" }).zuSpaet).toBe(true);
}, 120_000);
