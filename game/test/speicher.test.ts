// Speichern im Browser: Der Spielstand liegt nicht mehr im 5-MB-localStorage, Fehler werden gemeldet statt verschluckt.

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createWorld, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import {
  alleSlots,
  beiSpeicherfehler,
  fruehereStaende,
  ladeRueck,
  importiereSpielstandDatei,
  ladeSlot,
  ladeSpielstand,
  letzterSpeicherfehler,
  loescheSlot,
  loescheSpielstand,
  setzeLagerFuerTest,
  sitzungBegonnen,
  speichere,
  speichereSlot,
  speichereWarten,
  speicherRuhe,
  spielstandInfo,
  vorsitzungSnapshot,
  type Lager,
} from "../src/ui/speicher";
import { advance } from "../src/sim/world";

function speicherLager(name = "Test", grenze = Infinity): Lager & { daten: Map<string, string>; schreibzugriffe: number } {
  const daten = new Map<string, string>();
  const l = {
    name,
    daten,
    schreibzugriffe: 0,
    async put(key: string, text: string) {
      l.schreibzugriffe++;
      if (text.length > grenze) throw Object.assign(new Error("The quota has been exceeded."), { name: "QuotaExceededError" });
      // Eine kurze Verzögerung, damit die Reihenfolge der Schreibvorgänge wirklich geprüft wird
      await new Promise((r) => setTimeout(r, key === "auto" && text.length % 2 ? 6 : 1));
      daten.set(key, text);
    },
    async get(key: string) {
      return daten.get(key) ?? null;
    },
    async del(key: string) {
      daten.delete(key);
    },
  };
  return l;
}

const welt = (seed = 3) => {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  return w;
};

let haupt: ReturnType<typeof speicherLager>;
beforeEach(() => {
  haupt = speicherLager("IndexedDB");
  setzeLagerFuerTest({ haupt, not: null });
});
afterEach(() => setzeLagerFuerTest(null));

describe("Speichern und Laden im Browser", () => {
  test("Der Rundlauf erhält den Stand exakt, auch bei einem Spielstand weit über der localStorage-Grenze", async () => {
    const w = welt();
    advance(w, 400);
    const r = await speichereWarten(w);
    expect(r).toEqual({ ok: true, wo: "IndexedDB" });
    expect(save(w).length).toBeGreaterThan(1_000_000);
    const b = (await ladeSpielstand())!;
    expect(b.date).toBe(w.date);
    expect(JSON.stringify(b.spiel)).toBe(JSON.stringify(w.spiel));
    expect(spielstandInfo()?.datum).toBe(w.date);
  });

  test("Ein gescheiterter Schreibvorgang wird gemeldet, nicht als Erfolg ausgegeben", async () => {
    setzeLagerFuerTest({ haupt: speicherLager("IndexedDB", 10), not: speicherLager("localStorage", 10) });
    const gemeldet: (string | null)[] = [];
    const ab = beiSpeicherfehler((g) => gemeldet.push(g));
    const r = await speichereWarten(welt());
    expect(r.ok).toBe(false);
    expect(r.ok ? "" : r.grund).toMatch(/Als Datei sichern/);
    expect(r.ok ? "" : r.grund).toMatch(/QuotaExceededError/);
    expect(letzterSpeicherfehler()).toBeTruthy();
    expect(gemeldet.length).toBe(1);
    expect(spielstandInfo()).toBeNull(); // nichts als gesichert ausgeben, was nicht gesichert ist
    // Sobald es wieder klappt, verschwindet der Fehler
    setzeLagerFuerTest({ haupt: speicherLager(), not: null });
    await speichereWarten(welt());
    expect(letzterSpeicherfehler()).toBeNull();
    ab();
  });

  test("Fällt die IndexedDB aus, springt der Notspeicher ein", async () => {
    const kaputt = speicherLager("IndexedDB", 0);
    const not = speicherLager("localStorage");
    setzeLagerFuerTest({ haupt: kaputt, not });
    const r = await speichereWarten(welt());
    expect(r).toEqual({ ok: true, wo: "localStorage" });
    expect((await ladeSpielstand())?.date).toBeTruthy();
  });

  test("Schnell hintereinander: der neueste Stand gewinnt", async () => {
    const w = welt();
    const stand: string[] = [];
    for (let i = 0; i < 5; i++) {
      advance(w, 31);
      stand.push(w.date);
      speichere(w); // wie die Entscheidungen im Spiel: ohne Warten
    }
    await speicherRuhe();
    expect((await ladeSpielstand())!.date).toBe(stand[4]);
    expect(spielstandInfo()!.datum).toBe(stand[4]);
  });

  test("Slots: sichern, auflisten, laden, löschen", async () => {
    const w = welt();
    expect(alleSlots()).toEqual([]);
    expect((await speichereSlot(w, 2, "Vor der Verfassungsreform")).ok).toBe(true);
    advance(w, 62);
    expect((await speichereSlot(w, 4)).ok).toBe(true);
    const liste = alleSlots();
    expect(liste.map((s) => s.slot)).toEqual([2, 4]);
    expect(liste[0]!.label).toBe("Vor der Verfassungsreform");
    expect(liste[1]!.label).toBe("Slot 4");
    expect((await ladeSlot(2))!.date).not.toBe(w.date);
    expect((await ladeSlot(4))!.date).toBe(w.date);
    await loescheSlot(2);
    expect(alleSlots().map((s) => s.slot)).toEqual([4]);
    expect(await ladeSlot(2)).toBeNull();
  });

  test("Neues Spiel löscht den automatischen Stand, nicht die Slots", async () => {
    const w = welt();
    await speichereWarten(w);
    await speichereSlot(w, 1, "Anfang");
    sitzungBegonnen(w);
    expect(vorsitzungSnapshot()?.datum).toBe(w.date);
    loescheSpielstand();
    await speicherRuhe();
    expect(spielstandInfo()).toBeNull();
    expect(await ladeSpielstand()).toBeNull();
    expect(vorsitzungSnapshot()).toBeNull();
    expect(alleSlots()).toHaveLength(1);
  });

  test("Dateiimport: neues und altes Format, Unsinn wird abgelehnt, der Stand wird abgelegt", async () => {
    const w = welt();
    advance(w, 120);
    const mitVorsitzung = JSON.stringify({ version: 1, gespeichert: "x", welt: w, vorsitzung: { tag: 5, datum: "2028-09-30", zustimmung: 50, inflation: 30, kapital: 12 } });
    const a = importiereSpielstandDatei(mitVorsitzung)!;
    expect(a.date).toBe(w.date);
    expect(vorsitzungSnapshot()?.datum).toBe("2028-09-30");
    const nackt = importiereSpielstandDatei(JSON.stringify(w))!; // älteres Format: nur die Welt
    expect(nackt.date).toBe(w.date);
    expect(vorsitzungSnapshot()?.datum).toBe(w.date);
    await speicherRuhe();
    expect((await ladeSpielstand())!.date).toBe(w.date);
    expect(importiereSpielstandDatei("{kein json")).toBeNull();
    expect(importiereSpielstandDatei('{"foo":1}')).toBeNull();
    expect(importiereSpielstandDatei("[]")).toBeNull();
  });
});

describe("Kein Fortschritt geht verloren", () => {
  const stand = (w: ReturnType<typeof welt>) => w.date;

  test("Das Laden einer älteren Datei überschreibt den weiteren Stand nicht: Er bleibt als weitester Stand erhalten", async () => {
    const alt = welt(5);
    advance(alt, 60);
    const frueherDatei = JSON.stringify({ version: 1, gespeichert: "x", welt: alt });
    const weit = welt(5);
    advance(weit, 900); // weit gespielt
    await speichereWarten(weit);
    expect(spielstandInfo()!.datum).toBe(stand(weit));
    // Jemand lädt die ältere Datei (Titelbild oder Reiter Spielstand): der automatische Stand wird dabei ersetzt
    const geladen = importiereSpielstandDatei(frueherDatei)!;
    expect(stand(geladen)).toBe(stand(alt));
    await speicherRuhe();
    expect((await ladeSpielstand())!.date).toBe(stand(alt));
    // … aber der weite Stand ist zurückholbar
    const liste = fruehereStaende();
    expect(liste.some((r) => r.key === "hoechst" && r.info.datum === stand(weit))).toBe(true);
    const zurueck = (await ladeRueck("hoechst"))!;
    expect(zurueck.date).toBe(stand(weit));
    expect(JSON.stringify(zurueck.spiel)).toBe(JSON.stringify(weit.spiel));
  });

  test("Mehrmaliges Laden älterer Stände zerstört den weitesten Stand nicht", async () => {
    const a = welt(6);
    advance(a, 30);
    const b = welt(6);
    advance(b, 600);
    await speichereWarten(b);
    for (let i = 0; i < 6; i++) {
      importiereSpielstandDatei(JSON.stringify({ version: 1, gespeichert: "x", welt: a }));
      await speicherRuhe();
    }
    expect((await ladeRueck("hoechst"))!.date).toBe(stand(b));
  });

  test("„Neues Spiel“ löscht den Fortschritt nicht, er bleibt als Sicherung", async () => {
    const w = welt(7);
    advance(w, 500);
    await speichereWarten(w);
    loescheSpielstand();
    await speicherRuhe();
    expect(spielstandInfo()).toBeNull();
    const liste = fruehereStaende();
    expect(liste.length).toBeGreaterThan(0);
    expect((await ladeRueck(liste[0]!.key))!.date).toBe(stand(w));
  });

  test("Rollierende Sicherungen: höchstens alle 15 Minuten, drei Stück, neueste zuerst", async () => {
    let jetzt = 1_800_000_000_000;
    const spion = vi.spyOn(Date, "now").mockImplementation(() => jetzt);
    try {
      const w = welt(8);
      const daten: string[] = [];
      for (let i = 0; i < 6; i++) {
        advance(w, 40);
        daten.push(stand(w));
        await speichereWarten(w);
        jetzt += 16 * 60 * 1000; // 16 Minuten später
      }
      const alle = fruehereStaende();
      const rueck = alle.filter((r) => r.art === "rolle");
      expect(rueck.length).toBeLessThanOrEqual(3);
      expect(rueck.length).toBeGreaterThanOrEqual(2);
      // Der unmittelbare Vorgänger des aktuellen Stands ist aufgehoben (als weitester Stand oder als erste Rücksicherung; Duplikate zeigt die Liste nur einmal)
      expect(alle.some((r) => r.info.datum === daten[4])).toBe(true);
      // Die Rücksicherungen liegen in absteigender Reihenfolge und sind lesbar
      const daten2 = alle.map((r) => r.info.datum);
      expect([...daten2].sort().reverse()).toEqual(daten2);
      for (const r of alle) expect((await ladeRueck(r.key))!.date).toBe(r.info.datum);
    } finally {
      spion.mockRestore();
    }
  });
});
