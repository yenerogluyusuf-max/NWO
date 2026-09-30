// Parlament: Halbrund-Geometrie, Verteilung der Stimmen auf Fraktionen und Lesen der Abstimmungen aus dem Protokoll.

import { describe, expect, test } from "vitest";
import { advance, createWorld, NET } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { bringeEin, gesetzSicht, pruefeVorhaben, stimmenSicht } from "../src/sim/handeln";
import { nationalAverage } from "../src/sim/netz";
import { baueSitzplan, belege, grenzWinkel, proportional } from "../src/ui/parlament/geometrie";
import { parlamentsLage } from "../src/ui/parlament/lage";
import { baueVerlauf, istAbstimmung, leseAbstimmung, letzteAbstimmungen, merkeGesetze } from "../src/ui/parlament/abstimmung";
import { stimmzettel, verteileErgebnis, verteileErwartung, vorgabeFuer, zaehleZustaende, zustandJeSitz } from "../src/ui/parlament/stimmen";
import type { World } from "../src/sim/types";

const profil = (): PlayerProfile => ({
  name: "Test",
  heimat: "Ankara",
  heimatPlaka: 6,
  jugend: "",
  beruf: "Ökonom",
  partner: "Bauunternehmer, Aufträge vom Staat möglich",
  motiv: "",
  partei: { name: "Partei der Werte", kurz: "PW", farbe: "#555" },
  naehe: {},
  buendnis: "YENİ",
  versprechen: ["Der YENİ Parti wurden zwei Ministerien zugesagt."],
  wahl: { runde: 2, anteil: 51 },
});

function neueWelt(seed = 3): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, profil());
  return w;
}

describe("Halbrund-Geometrie", () => {
  const plan = baueSitzplan(600);

  test("600 Sitze, von links nach rechts nach Winkel geordnet, alle im Bild", () => {
    expect(plan.sitze).toHaveLength(600);
    for (let i = 1; i < plan.sitze.length; i++) expect(plan.sitze[i]!.winkel).toBeLessThanOrEqual(plan.sitze[i - 1]!.winkel + 1e-9);
    for (const s of plan.sitze) {
      expect(s.x).toBeGreaterThan(plan.sitzRadius);
      expect(s.x).toBeLessThan(plan.breite - plan.sitzRadius);
      expect(s.y).toBeGreaterThan(plan.sitzRadius);
      expect(s.y).toBeLessThanOrEqual(plan.mitte.y + 0.001);
    }
  });

  test("Sitze überlappen nicht: kleinster Abstand ist mindestens ein Sitzdurchmesser", () => {
    let kleinster = Infinity;
    for (let i = 0; i < plan.sitze.length; i++) {
      for (let j = i + 1; j < plan.sitze.length; j++) {
        const a = plan.sitze[i]!;
        const b = plan.sitze[j]!;
        if (Math.abs(a.x - b.x) > 40) continue;
        kleinster = Math.min(kleinster, Math.hypot(a.x - b.x, a.y - b.y));
      }
    }
    expect(kleinster).toBeGreaterThanOrEqual(plan.sitzRadius * 2 * 0.98);
  });

  test("auch andere Sitzzahlen gehen auf", () => {
    for (const n of [1, 7, 100, 450, 600, 640]) expect(baueSitzplan(n).sitze).toHaveLength(n);
  });

  test("Fraktionen belegen zusammenhängende Keile und die Mehrheitslinie liegt zwischen Sitz 301 und 302", () => {
    const partei = belege(plan, [{ partei: "A", sitze: 326 }, { partei: "B", sitze: 274 }]);
    expect(partei.filter((p) => p === "A")).toHaveLength(326);
    expect(partei.indexOf("B")).toBe(326);
    const a = grenzWinkel(plan, 300);
    expect(a).toBeLessThan(plan.sitze[300]!.winkel + 1e-9);
    expect(a).toBeGreaterThan(plan.sitze[301]!.winkel - 1e-9);
    // die Mitte des Halbrunds ist etwa Sitz 300: die Linie liegt nahe der Senkrechten
    expect(Math.abs(a - Math.PI / 2)).toBeLessThan(0.08);
  });
});

describe("proportional", () => {
  test("verteilt die Summe genau und respektiert Obergrenzen", () => {
    expect(proportional([1, 1, 1], 10).reduce((a, b) => a + b, 0)).toBe(10);
    const g = proportional([100, 10, 10], 50, [20, 100, 100]);
    expect(g[0]).toBe(20);
    expect(g.reduce((a, b) => a + b, 0)).toBe(50);
    expect(proportional([0, 0], 5)).toEqual([0, 0]);
    expect(proportional([3, 1], 0)).toEqual([0, 0]);
  });
});

describe("Stimmen auf Fraktionen", () => {
  const w = neueWelt();
  const lage = parlamentsLage(w)!;

  test("Lage: Fraktionen ergeben 600 Sitze, Lager zuerst", () => {
    expect(lage.gesamt).toBe(600);
    expect(lage.fraktionen[0]!.rolle).toBe("eigene");
    expect(lage.lager + lage.duldung + lage.opposition).toBe(600);
    expect(lage.lager).toBe(stimmenSicht(w).lager);
  });

  test("Ergebnis: Summe der Ja-Stimmen ist genau das Ergebnis, das Lager stimmt zuerst", () => {
    for (const ja of [0, 100, 300, 301, lage.lager, lage.lager + 40, 450, 600]) {
      const je = verteileErgebnis(lage, ja, 0, 0, []);
      expect(Object.values(je).reduce((a, b) => a + b, 0)).toBe(ja);
      for (const f of lage.fraktionen) expect(je[f.partei]).toBeLessThanOrEqual(f.sitze);
      if (ja >= lage.lager) for (const f of lage.fraktionen.filter((x) => x.rolle === "eigene" || x.rolle === "lager")) expect(je[f.partei]).toBe(f.sitze);
    }
  });

  test("Stimmzettel: je Fraktion so viele Ja wie zugeteilt, insgesamt 600 Sitze", () => {
    const je = verteileErgebnis(lage, lage.lager + 37, 0, 0, []);
    const z = stimmzettel(lage, je, 42);
    expect(z).toHaveLength(600);
    let start = 0;
    for (const f of lage.fraktionen) {
      expect(z.slice(start, start + f.sitze).filter(Boolean)).toHaveLength(je[f.partei]!);
      start += f.sitze;
    }
    // dasselbe Ergebnis, dasselbe Muster
    expect(stimmzettel(lage, je, 42)).toEqual(z);
  });

  test("Erwartung entspricht der Rechnung der Simulation", () => {
    const v = vorgabeFuer(w, null);
    const z = verteileErwartung(lage, v);
    const zahlen = zaehleZustaende(z);
    expect(zahlen.fest + zahlen.zusage + zahlen.wackelig).toBe(v.erwartet);
    expect(zahlen.fest).toBe(lage.lager);
    expect(zahlen.fest + zahlen.zusage + zahlen.wackelig + zahlen.offen + zahlen.nein).toBe(600);
    expect(zustandJeSitz(lage, z)).toHaveLength(600);
  });

  test("Erwartung eines Gesetzes mit Absprachen zählt sie als Zusagen", () => {
    const id = "m_krankenhausbau";
    const ziel = Math.min(100, nationalAverage(NET, w.net, id) + 20);
    const pr = pruefeVorhaben(w, id, ziel);
    expect(pr.ok).toBe(true);
    w.spiel!.kapital = 200;
    bringeEin(w, id, ziel, null, "gesetz");
    const g = w.spiel!.gesetze[0]!;
    g.absprachen = 25;
    const z = verteileErwartung(lage, vorgabeFuer(w, g));
    const zahlen = zaehleZustaende(z);
    expect(zahlen.fest + zahlen.zusage + zahlen.wackelig).toBe(gesetzSicht(w, g).ja);
  });
});

describe("Abstimmungen im Protokoll", () => {
  test("liest angenommene und abgelehnte Abstimmungen, sonst nichts", () => {
    const a = leseAbstimmung({ text: "Das Parlament nimmt „Justizreform“ im ganzen Land an (332 zu 268). Stufe 60.", day: 10, date: "2028-06-15" });
    expect(a).toMatchObject({ name: "Justizreform", ort: "im ganzen Land", ja: 332, nein: 268, angenommen: true, stufe: 60 });
    const b = leseAbstimmung({ text: "Das Parlament nimmt „Polizei und Gendarmerie“ in Van, Hakkari und Şırnak an (310 zu 290). Stufe 40.", day: 11, date: "2028-06-16" });
    expect(b).toMatchObject({ name: "Polizei und Gendarmerie", ort: "in Van, Hakkari und Şırnak", ja: 310, angenommen: true });
    const c = leseAbstimmung({ text: "Das Parlament lehnt „Renten“ ab (280 zu 320).", day: 12, date: "2028-06-17" });
    expect(c).toMatchObject({ name: "Renten", ja: 280, nein: 320, angenommen: false });
    expect(leseAbstimmung({ text: "Der Haushalt wird beschlossen.", day: 1, date: "2028-01-01" })).toBeNull();
    expect(istAbstimmung("Das Parlament nimmt „X“ im ganzen Land an (1 zu 2).")).toBe(true);
    expect(istAbstimmung("Das Parlament berät.")).toBe(false);
  });

  test("eine echte Abstimmung der Simulation wird gelesen und liefert einen Stimmzettel mit genau dem Ergebnis", () => {
    const w = neueWelt(5);
    w.spiel!.kapital = 200;
    const speicher = new Map<string, string[]>();
    let ok = 0;
    for (const id of ["m_krankenhausbau", "m_wasserleitungen", "m_bauaufsicht", "m_polizei"]) {
      const ziel = Math.min(100, nationalAverage(NET, w.net, id) + 20);
      if (pruefeVorhaben(w, id, ziel).ok) {
        bringeEin(w, id, ziel, null, "gesetz");
        ok++;
      }
    }
    expect(ok).toBeGreaterThan(0);
    merkeGesetze(w, speicher);
    const vorher = w.log.length;
    advance(w, 40);
    const neu = w.log.slice(vorher).filter((l) => istAbstimmung(l.text));
    expect(neu.length).toBeGreaterThan(0);
    for (const l of neu) {
      const ab = leseAbstimmung(l)!;
      expect(ab).not.toBeNull();
      expect(ab.ja + ab.nein).toBe(600);
      const v = baueVerlauf(w, ab, speicher.get(ab.name) ?? [])!;
      expect(v.votum).toHaveLength(600);
      expect(v.jaKum[599]).toBe(ab.ja);
    }
    expect(letzteAbstimmungen(w, 10).length).toBe(neu.length);
  });
});
