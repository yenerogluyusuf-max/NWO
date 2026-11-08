// Der Ministerfluss: Vorlagen aus dem Weltzustand, Rangfolge, Empfehlung nach Minister, Entscheidung über die Kernfunktionen,
// Schreibtischmappe und Altspielstände.

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { oeffne } from "../src/sim/ereignisse";
import { Rng } from "../src/sim/rng";
import { eigenVon } from "../src/sim/personen";
import { nationalAverage } from "../src/sim/netz";
import { NET } from "../src/sim/modell";
import { entscheideVorlage, flussZustand, heuteVorlagen, ministerVorlagen, pflegeVorlagen, schreibtischMappe } from "../src/sim/ministerfluss";
import { nutzenVorschau, zielGroessenVon } from "../src/sim/ministerfluss-vorschau";
import type { World } from "../src/sim/types";

function welt(seed = 5, kapital = 60): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = kapital;
  return w;
}

/** Einige Monate spielen, damit sich Probleme und Anliegen bilden. */
function gealtert(seed = 5, tage = 240): World {
  const w = welt(seed, 80);
  advance(w, tage);
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 80;
  return w;
}

describe("Vorlagen entstehen aus dem Weltzustand", () => {
  test("gleicher Zustand, gleiche Vorlagen: Kennung, Rang und Empfehlung sind deterministisch", () => {
    const a = ministerVorlagen(gealtert(7), { tiefe: 3 });
    const b = ministerVorlagen(gealtert(7), { tiefe: 3 });
    expect(a.length).toBeGreaterThan(2);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test("jede Vorlage hat einen Rang, einen Grund und mindestens eine echte Option; Maßnahmen liegen nur einmal vor", () => {
    const w = gealtert(3);
    const v = ministerVorlagen(w, { tiefe: 2 });
    const massnahmen: string[] = [];
    for (const x of v) {
      expect(x.prioritaet).toBeGreaterThanOrEqual(0);
      expect(x.prioritaet).toBeLessThanOrEqual(100);
      expect(x.prioritaetGrund.length).toBeGreaterThan(5);
      if (x.art !== "rueckmeldung" && x.art !== "schweigen") expect(x.optionen.some((o) => o.id !== "spaeter" && o.id !== "nichts")).toBe(true);
      for (const o of x.optionen) if (o.aktion.art === "massnahme") massnahmen.push(o.aktion.id);
    }
    expect(new Set(massnahmen).size).toBe(massnahmen.length);
    // Rangfolge absteigend
    for (let i = 1; i < v.length; i++) expect(v[i - 1]!.prioritaet).toBeGreaterThanOrEqual(v[i]!.prioritaet);
  });

  test("keine erfundenen Platzhalter: kein Text ohne Inhalt, keine unaufgelösten Vorlagen", () => {
    const v = ministerVorlagen(gealtert(11), { tiefe: 3 });
    for (const x of v) {
      const text = [x.titel, ...x.anlass, ...x.optionen.flatMap((o) => [o.label, o.text ?? "", ...o.folgen])].join(" ");
      expect(text).not.toMatch(/undefined|NaN|\[object|\{\{|TODO/);
      expect(x.titel.length).toBeGreaterThan(3);
    }
  });

  test("eine Frist schlägt Routine: ein offenes Ereignis mit kurzer Frist steht vor den Vorhaben gegen Probleme", () => {
    const w = gealtert(4);
    const ev = oeffne(w, "ratingagentur", new Rng(3));
    expect(ev).not.toBeNull();
    ev!.frist = w.day + 2;
    const v = ministerVorlagen(w, { tiefe: 0 });
    const i = v.findIndex((x) => x.quelle === "ereignis");
    expect(i).toBeGreaterThanOrEqual(0);
    expect(v[i]!.frist).toBe(2);
    const erstesProblem = v.findIndex((x) => x.quelle === "problem");
    if (erstesProblem >= 0) expect(i).toBeLessThan(erstesProblem);
    expect(v[i]!.optionen.length).toBeGreaterThanOrEqual(2);
    expect(v[i]!.minister).toBeDefined();
  });
});

describe("Die Unterschriftenmappe des Schreibtischs", () => {
  test("höchstens fünf Karten, der Rest liegt im Posteingang; nicht dreimal derselbe Minister", () => {
    const w = gealtert(5);
    const m = schreibtischMappe(w, 5);
    expect(m.mappe.length).toBeLessThanOrEqual(5);
    expect(m.mappe.length + m.weitere).toBe(ministerVorlagen(w, { tiefe: 5 }).length);
    const je = new Map<string, number>();
    for (const v of m.mappe) if (v.quelle === "problem" || v.quelle === "lage") je.set(v.minister?.id ?? v.amt, (je.get(v.minister?.id ?? v.amt) ?? 0) + 1);
    for (const n of je.values()) expect(n).toBeLessThanOrEqual(2);
    // Jede Karte nennt, wer vorlegt
    for (const v of m.mappe) expect(v.minister?.name).toBeTruthy();
  });

  test("Heute zeigt dieselben Vorlagen mit Minister, Folgen in Zahlen und Ort des Problems", () => {
    const w = gealtert(5);
    const h = heuteVorlagen(w, 4);
    expect(h.length).toBeGreaterThan(0);
    const mitNutzen = h.flatMap((v) => v.optionen).filter((o) => o.nutzen && o.nutzen.length);
    expect(mitNutzen.length).toBeGreaterThan(0);
    const prob = h.find((v) => v.problem);
    if (prob) {
      expect(prob.problem!.provinzen).toBeGreaterThan(0);
      expect(prob.problem!.ortNamen.length).toBeGreaterThan(0);
    }
  });
});

describe("Die Qualität hängt am Minister", () => {
  test("ein Minister mit Loyalität unter 35 legt nichts mehr vor, sondern schweigt sichtbar", () => {
    const w = gealtert(5);
    const f = w.spiel!.figuren.find((x) => x.amt === "justiz" && x.imAmt)!;
    f.loyalitaet = 20;
    const v = ministerVorlagen(w, { tiefe: 0 });
    expect(v.some((x) => x.art === "schweigen" && x.minister?.id === f.id)).toBe(true);
    expect(v.some((x) => x.quelle === "lage" && x.minister?.id === f.id)).toBe(false);
  });

  test("unter Loyalität 40 gibt es keine Empfehlung, nur den Hinweis", () => {
    const w = gealtert(5);
    const ev = oeffne(w, "ratingagentur", new Rng(3))!;
    ev.frist = w.day + 5;
    const fin = w.spiel!.figuren.find((x) => x.amt === "finanzen" && x.imAmt)!;
    fin.loyalitaet = 38;
    const v = ministerVorlagen(w, { tiefe: 1 }).find((x) => x.quelle === "ereignis" && x.minister?.id === fin.id);
    expect(v).toBeDefined();
    expect(v!.empfehlung?.optionId).toBe("");
    expect(v!.empfehlung?.hinweis).toMatch(/hält sich zurück/);
  });

  test("der Eitle empfiehlt, was sein Haus stärkt, und der Hinweis sagt es", () => {
    let gefunden = false;
    for (let seed = 1; seed <= 12 && !gefunden; seed++) {
      const w = gealtert(seed, 200);
      for (const f of w.spiel!.figuren) {
        if (!f.imAmt) continue;
        const e = eigenVon(w, f);
        e.stil = "eitel";
        e.ehrgeiz = 80;
        f.loyalitaet = 70;
      }
      for (const v of ministerVorlagen(w, { tiefe: 4 })) {
        const o = v.optionen.find((x) => x.id === v.empfehlung?.optionId);
        if (o?.eigenesRessort && v.empfehlung?.hinweis?.includes("eigene Ressort")) gefunden = true;
      }
    }
    expect(gefunden).toBe(true);
  });
});

describe("Entscheiden läuft über die Kernfunktionen", () => {
  test("ein Vorhaben aus „Heute“ wird als Gesetz eingebracht und verschwindet aus den Vorlagen", () => {
    const w = gealtert(5);
    const v = heuteVorlagen(w, 6).find((x) => x.optionen.some((o) => o.aktion.art === "massnahme" && o.moeglich));
    expect(v).toBeDefined();
    const o = v!.optionen.find((x) => x.aktion.art === "massnahme" && x.moeglich)!;
    const gesetze = w.spiel!.gesetze.length;
    const kapital = w.spiel!.kapital;
    const r = entscheideVorlage(w, v!.id, o.id);
    expect(r.ok).toBe(true);
    expect(w.spiel!.gesetze.length).toBe(gesetze + 1);
    expect(w.spiel!.kapital).toBeLessThan(kapital);
    expect(ministerVorlagen(w, { tiefe: 0 }).some((x) => x.id === v!.id)).toBe(false);
    expect(flussZustand(w).erledigt[v!.id]).toBeDefined();
  });

  test("ein Ereignis wird über die Vorlage beantwortet und ist danach geschlossen", () => {
    const w = gealtert(5);
    const ev = oeffne(w, "ratingagentur", new Rng(3))!;
    const v = ministerVorlagen(w, { tiefe: 0 }).find((x) => x.id === `ereignis:${ev.id}`)!;
    const o = v.optionen.find((x) => x.moeglich)!;
    expect(entscheideVorlage(w, v.id, o.id).ok).toBe(true);
    expect(w.spiel!.ereignisse.some((e) => e.id === ev.id)).toBe(false);
  });

  test("ein Beschluss im Ministerrat läuft über die Vorlage und hält die Sitzung ab", () => {
    const w = gealtert(5);
    const v = ministerVorlagen(w, { tiefe: 0 }).find((x) => x.quelle === "kabinett" && !x.wartet);
    expect(v).toBeDefined();
    const o = v!.optionen.find((x) => x.moeglich && x.aktion.art === "kabinett")!;
    const r = entscheideVorlage(w, v!.id, o.id);
    expect(r.ok).toBe(true);
    expect(w.spiel!.zuletzt.kabinettssitzung).toBe(w.day);
    // Danach gibt es bis zur nächsten Sitzung keinen weiteren Beschluss
    expect(ministerVorlagen(w, { tiefe: 0 }).filter((x) => x.quelle === "kabinett").every((x) => x.wartet)).toBe(true);
  });

  test("„Später“ vertagt für 30 Tage, danach kommt die Vorlage wieder; „Nicht tun“ verwirft sie", () => {
    const w = gealtert(5);
    const v = ministerVorlagen(w, { tiefe: 0 }).find((x) => x.optionen.some((o) => o.id === "spaeter") && x.quelle !== "kabinett")!;
    const thema = v.thema;
    expect(entscheideVorlage(w, v.id, "spaeter").ok).toBe(true);
    expect(ministerVorlagen(w, { tiefe: 0 }).some((x) => x.thema === thema)).toBe(false);
    w.day += 15;
    expect(ministerVorlagen(w, { tiefe: 0 }).some((x) => x.thema === thema)).toBe(false);
    w.day += 16;
    expect(ministerVorlagen(w, { tiefe: 0 }).some((x) => x.thema === thema)).toBe(true);
    // „Nicht tun“ gilt für das Thema, auch wenn die Vorlage im nächsten Zeitfenster eine neue Kennung bekäme
    const n = ministerVorlagen(w, { tiefe: 0 }).find((x) => x.optionen.some((o) => o.id === "nichts"))!;
    expect(entscheideVorlage(w, n.id, "nichts").ok).toBe(true);
    expect(ministerVorlagen(w, { tiefe: 0 }).some((x) => x.thema === n.thema)).toBe(false);
    w.day += 60;
    expect(ministerVorlagen(w, { tiefe: 0 }).some((x) => x.thema === n.thema)).toBe(false);
  });

  test("was nicht bezahlbar ist, wird nicht ausgeführt und nicht als erledigt vermerkt", () => {
    const w = gealtert(5);
    w.spiel!.kapital = -19;
    const v = ministerVorlagen(w, { tiefe: 0 }).find((x) => x.optionen.some((o) => o.aktion.art === "massnahme" && !o.moeglich));
    if (!v) return;
    const o = v.optionen.find((x) => x.aktion.art === "massnahme" && !x.moeglich)!;
    const r = entscheideVorlage(w, v.id, o.id);
    expect(r.ok).toBe(false);
    expect(flussZustand(w).erledigt[v.id]).toBeUndefined();
  });
});

describe("Verfall wird sichtbar und Altspielstände laden", () => {
  test("eine Vorlage, die ohne Entscheidung verschwindet, steht bei den verfallenen", () => {
    const w = gealtert(5);
    pflegeVorlagen(w);
    const z = flussZustand(w);
    const id = Object.keys(z.gesehen).find((k) => z.gesehen[k]!.quelle === "problem" || z.gesehen[k]!.quelle === "lage");
    expect(id).toBeDefined();
    // Die Lage ändert sich: alle akuten Probleme verschwinden
    for (const n of NET.nodes) if (n.kind === "problem") for (let p = 0; p < 81; p++) w.net.values[NET.index.get(n.id)! * 81 + p] = 0;
    w.day += 1;
    pflegeVorlagen(w);
    expect(z.verfallen.some((x) => x.id === id)).toBe(true);
    expect(z.gesehen[id!]).toBeUndefined();
  });

  test("ein Spielstand ohne Ministerfluss lädt, rechnet Vorlagen und speichert den Zustand mit", () => {
    const w = gealtert(5);
    delete w.spiel!.ministerfluss;
    const roh = JSON.parse(save(w));
    expect(roh.spiel.ministerfluss).toBeUndefined();
    const neu = load(JSON.stringify(roh));
    expect(ministerVorlagen(neu, { tiefe: 1 }).length).toBeGreaterThan(0);
    flussZustand(neu).gelesen.push("x");
    const wieder = load(save(neu));
    expect(wieder.spiel!.ministerfluss!.gelesen).toContain("x");
  });
});

describe("Der erwartete Nutzen in Zahlen", () => {
  test("die Vorschau ändert die Welt nicht und zeigt Stand heute, ohne und mit Eingriff", () => {
    const w = gealtert(5);
    const v = heuteVorlagen(w, 3).find((x) => x.optionen.some((o) => o.aktion.art === "massnahme"))!;
    const a = v.optionen.find((o) => o.aktion.art === "massnahme")!.aktion as { art: "massnahme"; id: string; ziel: number; ort: number[] | null };
    const vorher = JSON.stringify(w.net);
    const tag = w.day;
    const z = nutzenVorschau(w, [{ id: a.id, ziel: a.ziel, ort: a.ort }], zielGroessenVon(a.id, 3), 24);
    expect(z.length).toBeGreaterThan(0);
    expect(JSON.stringify(w.net)).toBe(vorher);
    expect(w.day).toBe(tag);
    // Es gibt mindestens eine Größe, die sich mit dem Eingriff anders entwickelt als ohne
    expect(z.some((x) => x.mit !== x.ohne)).toBe(true);
    for (const x of z) expect(Number.isFinite(x.jetzt + x.ohne + x.mit)).toBe(true);
  });

  test("ohne Eingriff gibt es keine Vorschau, mit unbekannter Größe keine Zeile", () => {
    const w = gealtert(5);
    expect(nutzenVorschau(w, [], ["arbeitslosigkeit"], 12)).toEqual([]);
    expect(nutzenVorschau(w, [{ id: "m_mindestlohn", ziel: 70, ort: null }], ["gibt_es_nicht"], 12)).toEqual([]);
    void nationalAverage;
  });
});

describe("Leistung", () => {
  test("die Vorlagen eines Spielstands mit Erfahrung entstehen schnell genug für die Oberfläche", () => {
    const w = gealtert(9, 400);
    const t = performance.now();
    ministerVorlagen(w, { tiefe: 0 });
    expect(performance.now() - t).toBeLessThan(1500);
  });
});
