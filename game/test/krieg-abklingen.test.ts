// Welle H2 (6. November): Im Spielstand des Inhabers (2. Februar 2039) stand die Spannung mit Israel seit März 2029 bei 70, die
// Drohkulisse mit Zypern seit April 2032 bei 80, und die Krise „Kriegsgefahr“ galt seit Tag 270 ununterbrochen. Ursache: Die Eskalation
// folgte allein dem Konfliktwert, der zu seinem Ruhewert zurückkehrt (Israel 70, Zypern 72 plus Anker 8); die Ausstiegsschwellen
// (Spannung unter 22 bei Konflikt unter 45, Drohkulisse unter 45) lagen darunter. Jetzt klingt eine Spannung ohne neuen Anlass ab,
// ein Anlass nährt sie, und die Kriegsgefahr folgt dem Vorgang.

import { describe, expect, test } from "vitest";
import { createWorld, advance } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { KRIEG, aktiveKriege, fuehreKriegHandlungAus, kriegMit, kriegMonat, kriege, spannungsVerlauf } from "../src/sim/krieg";
import { konfliktRuhewert, landAendern, weltZustand } from "../src/sim/laender";
import { aktiveKrisen } from "../src/sim/krisen";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";
import type { KriegVorgang } from "../src/sim/krieg-typen";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 120;
  return w;
}

/** Der Zustand aus dem Spielstand 2039: Spannung mit Israel bei 70, Konflikt auf seinem Ruhewert, Phase seit Jahren, ohne Feld `genaehrt`. */
function wieImSpielstand(w: World): KriegVorgang {
  const k: KriegVorgang = { id: `kv-ISR-${w.day - 3600}`, land: "ISR", phase: "spannung", seit: w.day - 3600, eskalation: 70, mobilmachung: 0, front: 50, frontVorher: 50, uhr: 100, uhrGegner: 100, woche: 0, verluste: 0 };
  kriege(w).push(k);
  weltZustand(w)["ISR"]!.konflikt = konfliktRuhewert(w, "ISR");
  w.spiel!.krisen = [{ id: "kriegsgefahr", seit: w.day - 3600 }];
  return k;
}

describe("Spannung ohne Anlass klingt ab (Spielstand 2039)", () => {
  test("die alte Spannung mit Israel endet, sobald kein Anlass mehr kommt, und die Kriegsgefahr endet mit ihr", () => {
    const w = welt();
    // Andere Länder ruhig stellen; Israel selbst liegt mit 70 im Bereich der Zwischenfälle (rund 7 % im Monat)
    for (const l of Object.values(weltZustand(w))) l.konflikt = Math.min(l.konflikt, 45);
    const k = wieImSpielstand(w);
    expect(weltZustand(w)["ISR"]!.konflikt).toBe(70);
    // Ein echter Zwischenfall nährt die Spannung erneut (gewollt, Welle H2). Der Zufallsstrom hängt am ganzen Spiel: Auf dem
    // zusammengeführten Stand kam am 1. September 2028 einer, allein auf welle/h2 nicht. Geprüft wird deshalb nicht ein fester Tag,
    // sondern die Regel: Nach dem letzten Anlass endet die Spannung spätestens nach Nährfrist plus Abklingen von höchstens 100 Punkten.
    const frist = KRIEG.naehrFrist + Math.ceil(100 / KRIEG.abklingenJeTag);
    let ohneAnlass = 0;
    // Zwischenfälle können sie zur Drohkulisse treiben (Entscheidungsfenster); ohne Antwort und ohne Zwischenfälle in dieser Phase fällt sie zurück
    for (let i = 0; i < 2000 && (k.phase === "spannung" || k.phase === "drohkulisse"); i++) {
      const vorher = k.genaehrt;
      advance(w, 1);
      ohneAnlass = k.genaehrt === vorher ? ohneAnlass + 1 : 0;
      expect(ohneAnlass, "vorher blieb sie bei 70 stehen").toBeLessThanOrEqual(frist);
    }
    expect(k.phase).toBe("beendet");
    expect(k.ausgang).toBe("abgeklungen");
    expect(aktiveKrisen(w).map((x) => x.id)).not.toContain("kriegsgefahr");
    expect(w.log.some((e) => e.text.includes("Israel") && e.text.includes("abgeklungen"))).toBe(true);
  });

  test("die Drohkulisse mit hohem Ruhewert (Zypern 80) fällt zur Spannung zurück und endet", () => {
    const w = welt();
    const z = weltZustand(w);
    z["CYP"]!.anker = 8;
    z["CYP"]!.konflikt = 80;
    const k: KriegVorgang = { id: "kv-CYP-0", land: "CYP", phase: "drohkulisse", seit: w.day - 2500, eskalation: 80, mobilmachung: 0, front: 50, frontVorher: 50, uhr: 100, uhrGegner: 100, woche: 0, verluste: 0 };
    kriege(w).push(k);
    let spannung = false;
    for (let i = 0; i < 200 && k.phase !== "beendet"; i++) {
      advance(w, 1);
      if (k.phase === "spannung") spannung = true;
      if (k.phase === "krieg") break;
    }
    expect(spannung).toBe(true);
    expect(k.phase).toBe("beendet");
  });

  test("ein Anlass nährt die Spannung: Solange er frisch ist, folgt sie dem Konflikt", () => {
    const w = welt();
    for (const l of Object.values(weltZustand(w))) l.konflikt = Math.min(l.konflikt, 45);
    weltZustand(w)["ISR"]!.konflikt = 76;
    kriegMonat(w, new Rng(1));
    const k = kriegMit(w, "ISR")!;
    expect(k, "Vorgang aus dem Anstieg über den Ruhewert").toBeTruthy();
    expect(k.genaehrt).toBe(w.day);
    advance(w, KRIEG.naehrFrist - 5);
    expect(k.phase).toBe("spannung");
    expect(k.eskalation, "in der Nährfrist folgt sie dem Konflikt").toBeGreaterThan(66);
    // Ein Zwischenfall (Sprung im Konfliktwert) nährt sie erneut
    landAendern(w, "ISR", { konflikt: 6 }, "Zwischenfall");
    advance(w, 1);
    expect(k.genaehrt, "der Tagesschritt erkennt den Sprung").toBe(w.day);
    const v = spannungsVerlauf(w, k)!;
    expect(v.klingtAb).toBe(false);
    expect(v.endeEtwa).toBeGreaterThan(w.day + KRIEG.naehrFrist);
    // Ohne weiteren Anlass endet sie am vorausgesagten Tag; nährt sie ein Zwischenfall des Zufalls erneut, gilt die Vorausschau von da an
    let ende = v.endeEtwa!;
    let anlass = k.genaehrt;
    for (let i = 0; i < 1500 && k.phase !== "beendet"; i++) {
      advance(w, 1);
      if (k.genaehrt !== anlass && k.phase === "spannung") {
        anlass = k.genaehrt;
        ende = spannungsVerlauf(w, k)!.endeEtwa!;
      }
    }
    expect(k.phase).toBe("beendet");
    expect(Math.abs(w.day - ende), "Vorausschau und Lauf rechnen nach denselben Regeln").toBeLessThan(15);
  });

  test("Diplomatie wirkt: Beruhigen, Vermittlung und ein Vertrag verkürzen die Spannung", () => {
    // Verglichen wird die Vorausschau (dieselben Regeln wie der Tagesschritt), damit Zwischenfälle des Zufalls den Vergleich nicht verwischen
    const anlage = (): { w: World; k: KriegVorgang } => {
      const w = welt();
      for (const l of Object.values(weltZustand(w))) l.konflikt = Math.min(l.konflikt, 45);
      weltZustand(w)["ISR"]!.konflikt = 76;
      kriegMonat(w, new Rng(1));
      return { w, k: kriegMit(w, "ISR")! };
    };
    const a = anlage();
    const abwarten = spannungsVerlauf(a.w, a.k)!.endeEtwa!;
    const b = anlage();
    expect(fuehreKriegHandlungAus(b.w, b.k.id, "deeskalation").ok).toBe(true);
    const beruhigt = spannungsVerlauf(b.w, b.k)!.endeEtwa!;
    expect(beruhigt).toBeLessThan(abwarten);
    // Ein Vertrag (sim/abkommen.ts: Konflikt −3, Anker −6 je laufendem Vertrag) und eine Geste (Entspannen: Konflikt −12) nehmen der
    // Spannung die Nahrung: Der Tagesschritt erkennt den Fall des Konfliktwerts, sie klingt sofort ab
    for (const delta of [-3, -12]) {
      const c = anlage();
      weltZustand(c.w)["ISR"]!.anker = -6;
      landAendern(c.w, "ISR", { konflikt: delta });
      advance(c.w, 1);
      const v = spannungsVerlauf(c.w, c.k)!;
      expect(v.ruhewert).toBe(64);
      expect(v.klingtAb).toBe(true);
      expect(v.endeEtwa!).toBeLessThan(abwarten);
    }
    // Und im Lauf: Beruhigt endet die Spannung tatsächlich
    for (let i = 0; i < 800 && b.k.phase !== "beendet"; i++) advance(b.w, 1);
    expect(b.k.phase).toBe("beendet");
  });

  test("Eskalation durch den Präsidenten nährt die Spannung (Mobilmachung, Kriegsziel)", () => {
    const w = welt();
    weltZustand(w)["GRC"]!.konflikt = 80;
    kriegMonat(w, new Rng(1));
    const k = kriegMit(w, "GRC")!;
    advance(w, 30);
    const vorher = k.genaehrt!;
    expect(fuehreKriegHandlungAus(w, k.id, "bereitschaft").ok).toBe(true);
    expect(k.genaehrt).toBeGreaterThan(vorher);
  });

  test("ein dauerhaft hoher Konflikt ohne neuen Anstieg legt keinen Vorgang an", () => {
    const w = welt();
    const z = weltZustand(w);
    z["CYP"]!.anker = 8;
    z["CYP"]!.konflikt = konfliktRuhewert(w, "CYP");
    expect(z["CYP"]!.konflikt).toBeGreaterThanOrEqual(KRIEG.anlageAb);
    kriegMonat(w, new Rng(1));
    expect(kriegMit(w, "CYP")).toBeUndefined();
    z["CYP"]!.konflikt += KRIEG.anlageUeberRuhe + 1;
    kriegMonat(w, new Rng(1));
    expect(kriegMit(w, "CYP")).toBeTruthy();
    expect(aktiveKriege(w)).toHaveLength(1);
  });
});
