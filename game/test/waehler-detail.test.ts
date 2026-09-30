// Wähler im Einzelnen: Ursachenkette, Tendenz, Vorwegnahme von Entscheidungen, Wanderung, Verlauf, Koalition.

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { setPolicy } from "../src/sim/handeln";
import { NET } from "../src/sim/modell";
import { nationalAverage, startAverage } from "../src/sim/netz";
import { GRUPPEN } from "../src/sim/gruppen";
import { absichtWort, gleichgewicht, hilfen, wirkungNach, koalition, kette, praeferenzen, regionen, rolleVon, sorgen, tendenz, treiber, wanderung, gruppenDetail } from "../src/sim/waehler-detail";
import { entscheidungsMarken, verlaufSichern, verlaufVon, zustimmungsVerlauf } from "../src/sim/waehler-verlauf";

function neu(seed = 6) {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  return w;
}

describe("Ursachen", () => {
  test("Die Beiträge der Verbindungen erklären die Abweichung der Gruppe im Gleichgewicht", () => {
    const w = neu();
    setPolicy(w, "m_mindestlohn", 90);
    advance(w, 30 * 30);
    for (const g of GRUPPEN) {
      const t = tendenz(w, g.id);
      const laune = nationalAverage(NET, w.net, g.id);
      // Nach zweieinhalb Jahren ohne weitere Änderung liegt die Stimmung nahe am Gleichgewicht, das die Beiträge ergeben
      expect(Number.isFinite(t.ziel)).toBe(true);
      expect(Math.abs(laune - t.ziel)).toBeLessThan(6);
    }
  });

  test("Eine beschlossene Maßnahme steht mit positivem Beitrag an der Spitze der Ursachen der betroffenen Gruppe", () => {
    const w = neu();
    setPolicy(w, "m_mindestlohn", 90);
    advance(w, 30 * 8);
    const t = treiber(w, "arbeitnehmer");
    const mindest = t.find((x) => x.von === "m_mindestlohn");
    expect(mindest).toBeDefined();
    expect(mindest!.beitrag).toBeGreaterThan(0);
    expect(mindest!.veraenderung).not.toBeNull();
    // nach Beitrag sortiert
    for (let i = 1; i < t.length; i++) expect(Math.abs(t[i - 1]!.beitrag)).toBeGreaterThanOrEqual(Math.abs(t[i]!.beitrag) - 1e-9);
  });

  test("Die Kette führt bis zu Maßnahmen oder Eingangsgrößen und endet dort", () => {
    const w = neu();
    setPolicy(w, "m_mindestlohn", 90);
    setPolicy(w, "m_zoelle", 90);
    advance(w, 30 * 10);
    const k = kette(w, "arbeitnehmer", 3);
    expect(k.length).toBeGreaterThan(0);
    const pruefe = (glieder: typeof k, tiefe: number) => {
      expect(tiefe).toBeLessThanOrEqual(3);
      for (const g of glieder) {
        expect(Number.isFinite(g.beitrag)).toBe(true);
        if (g.art === "massnahme") expect(g.kinder).toHaveLength(0);
        pruefe(g.kinder, tiefe + 1);
      }
    };
    pruefe(k, 1);
  });
});

describe("Vorwegnahme (Gleichgewicht)", () => {
  test("Die Vorhersage trifft Richtung und Größenordnung der echten Rechnung nach drei Jahren", () => {
    const w = neu();
    const vorher = GRUPPEN.map((g) => nationalAverage(NET, w.net, g.id));
    const von = nationalAverage(NET, w.net, "m_mindestlohn");
    const delta = 90 - von;
    const soll = gleichgewicht("m_mindestlohn", delta);
    setPolicy(w, "m_mindestlohn", 90);
    advance(w, 30 * 36);
    const echt = GRUPPEN.map((g, i) => nationalAverage(NET, w.net, g.id) - vorher[i]!);
    const laune = GRUPPEN.map((g) => soll.get(g.id) ?? 0);
    // Die Gruppe mit der größten vorhergesagten Wirkung bewegt sich in dieselbe Richtung und in derselben Größenordnung
    const i = laune.reduce((best, x, k) => (Math.abs(x) > Math.abs(laune[best]!) ? k : best), 0);
    expect(Math.sign(echt[i]!)).toBe(Math.sign(laune[i]!));
    expect(Math.abs(echt[i]!) / Math.abs(laune[i]!)).toBeGreaterThan(0.4);
    expect(Math.abs(echt[i]!) / Math.abs(laune[i]!)).toBeLessThan(2.2);
  });

  test("Das lineare Vorschaumodell trifft die echte Rechnung nach 12 und 36 Monaten (gegen eine Partie ohne Maßnahme)", () => {
    const a = neu();
    const b = neu();
    const von = nationalAverage(NET, a.net, "m_kmu");
    const soll = wirkungNach("m_kmu", 70 - von, [12, 36], NET.nodes[NET.index.get("m_kmu")!]!.months ?? 1);
    setPolicy(b, "m_kmu", 70);
    advance(a, 30 * 12);
    advance(b, 30 * 12);
    const echt12 = nationalAverage(NET, b.net, "unternehmer") - nationalAverage(NET, a.net, "unternehmer");
    advance(a, 30 * 24);
    advance(b, 30 * 24);
    const echt36 = nationalAverage(NET, b.net, "unternehmer") - nationalAverage(NET, a.net, "unternehmer");
    expect(soll.get(12)!.get("unternehmer")!).toBeGreaterThan(echt12 * 0.75);
    expect(soll.get(12)!.get("unternehmer")!).toBeLessThan(echt12 * 1.25);
    expect(soll.get(36)!.get("unternehmer")!).toBeGreaterThan(echt36 * 0.85);
    expect(soll.get(36)!.get("unternehmer")!).toBeLessThan(echt36 * 1.15);
  });

  test("Hilfen: Vorschläge helfen der Gruppe, nennen Kosten und Nebenwirkungen und sind nach Gewinn sortiert", () => {
    const w = neu();
    const h = hilfen(w, "rentner", 4);
    expect(h.length).toBeGreaterThan(0);
    for (const x of h) {
      expect(x.gewinn).toBeGreaterThan(0);
      expect(x.pk).toBeGreaterThan(0);
      expect(x.horizont).toBeGreaterThanOrEqual(6);
      expect(x.langfristig).toBeGreaterThanOrEqual(x.gewinn - 1e-6);
      expect(Number.isFinite(x.zustimmung)).toBe(true);
      expect(x.auf).not.toBe(x.von);
      expect(NET.nodes[NET.index.get(x.massnahme)!]!.kind).toBe("massnahme");
    }
    for (let i = 1; i < h.length; i++) expect(h[i - 1]!.gewinn).toBeGreaterThanOrEqual(h[i]!.gewinn);
  });
});

describe("Mögen, Sorgen, Wanderung, Regionen", () => {
  test("Präferenzen trennen, was eine Gruppe mehr und was sie weniger will", () => {
    const w = neu();
    const p = praeferenzen(w, "unternehmer");
    expect(p.will.length).toBeGreaterThan(0);
    expect(p.will.every((x) => x.richtung === 1)).toBe(true);
    expect(p.hasst.every((x) => x.richtung === -1)).toBe(true);
  });

  test("Sorgen: Größen mit Vorzeichen, ohne Maßnahmen", () => {
    const w = neu();
    const s = sorgen(w, "arbeitnehmer");
    expect(s.length).toBeGreaterThan(0);
    expect(s.every((x) => x.art !== "massnahme")).toBe(true);
  });

  test("Wanderung: unzufriedene Gruppen neigen mehr zum Wechsel, Ziele sind Parteien ohne die eigene", () => {
    const w = neu();
    const zufrieden = wanderung(w, "rentner");
    w.net.values[NET.index.get("rentner")! * 81 + 0] = 10;
    for (let p = 0; p < 81; p++) w.net.values[NET.index.get("rentner")! * 81 + p] = 20;
    const wuetend = wanderung(w, "rentner");
    expect(wuetend.neigung).toBeGreaterThan(zufrieden.neigung);
    expect(wuetend.ziele.length).toBeGreaterThan(0);
    expect(wuetend.ziele.map((z) => z.partei)).not.toContain(w.player!.partei.kurz);
    for (const z of wuetend.ziele) expect(Number.isFinite(z.naehe)).toBe(true);
  });

  test("Regionen: sieben Regionen, Spanne endlich", () => {
    const w = neu();
    const r = regionen(w, "junge");
    expect(r.regionen).toHaveLength(7);
    expect(Number.isFinite(r.spanne)).toBe(true);
  });
});

describe("Koalition und Verlauf", () => {
  test("Die Gewichte von Trägern, Schwankenden und Gegnern ergeben 1; die Rollen folgen den Schwellen", () => {
    const w = neu();
    const k = koalition(w);
    expect(k.traeger + k.schwankend + k.gegner).toBeCloseTo(1, 6);
    for (const g of k.gruppen) expect(g.rolle).toBe(rolleVon(g.laune));
    expect(k.gruppen.length).toBe(GRUPPEN.length);
    expect(absichtWort(80)).toMatch(/Überzeugung/);
    expect(absichtWort(20)).toMatch(/abwendet|wendet/);
  });

  test("Der Verlauf wird jeden Monat fortgeschrieben und ist bis zum heutigen Wert vollständig", () => {
    const w = neu();
    advance(w, 30 * 5);
    const v = verlaufVon(w, "rentner");
    expect(v.monate.length).toBe(v.werte.length);
    expect(v.werte.filter((x) => x !== null).length).toBeGreaterThanOrEqual(5);
    expect(v.werte[v.werte.length - 1]).toBeCloseTo(nationalAverage(NET, w.net, "rentner"), 6);
    const z = zustimmungsVerlauf(w);
    expect(z.monate.length).toBe(z.werte.length);
    expect(z.werte[z.werte.length - 1]).toBeCloseTo(w.spiel!.umfrage.zustimmung, 6);
  });

  test("Ältere Spielstände ohne Verlauf bekommen ihn aus dem Netzgedächtnis, ohne NaN", () => {
    const w = neu();
    advance(w, 30 * 9);
    delete w.spiel!.waehler;
    const geladen = load(save(w));
    expect(geladen.spiel!.waehler).toBeUndefined();
    const v = verlaufVon(geladen, "arbeitnehmer");
    expect(v.werte.every((x) => x === null || Number.isFinite(x))).toBe(true);
    expect(v.werte.filter((x) => x !== null).length).toBeGreaterThanOrEqual(9);
    expect(verlaufSichern(geladen).monate.length).toBeGreaterThan(0);
  });

  test("Beschlossene Gesetze erscheinen als Marken", () => {
    const w = neu();
    w.log.push({ day: 40, date: "2026-10-10", kind: "entscheidung", text: "Das Parlament nimmt „Mindestlohn“ an (330 zu 200)." });
    expect(entscheidungsMarken(w)).toEqual([{ monat: "2026-10", text: "Mindestlohn" }]);
  });

  test("Alles zu einer Gruppe auf einmal ist endlich", () => {
    const w = neu();
    advance(w, 30 * 4);
    for (const g of GRUPPEN) {
      const d = gruppenDetail(w, g.id);
      expect(JSON.stringify(d)).not.toMatch(/null,null,null,null,null,null,null,null,null,null,null,null,null,null,null/);
      const zahlen = JSON.stringify(d).match(/-?\d+\.?\d*(e-?\d+)?/g)!.map(Number);
      expect(zahlen.every(Number.isFinite)).toBe(true);
      expect(startAverage(NET, w.net, g.id)).toBeGreaterThan(0);
    }
  });
});
