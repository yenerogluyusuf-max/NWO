// AP 4 (PLAN_OBERFLAECHE_DETAIL_2026-11-05.md, Anhang A 1.1; ENTSCHEIDUNGEN W 2 und F4): ein Weg zum Gesetz. Die Maßnahme ist die
// Eingangstür, die Einträge des Gesetzeskatalogs sind benannte Fassungen. Eine Stimmenzahl überall, freie Stufen gelten als die
// nächste Fassung, die Tagesordnung zeigt dieselben Zahlen wie ihre Quellen.

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { GESETZESVORHABEN, FASSUNGEN, STANDARD_SCHRITTE } from "../src/data/gesetzesvorhaben";
import { bringeEin, gesetzPrognose, gesetzeAbstimmen, pruefeVorhaben } from "../src/sim/handeln";
import { fassungFuerStufe, fassungsKnoepfe, gesetzesPrognose, gesetzgebungVon, vorhabenSicht } from "../src/sim/gesetzgebung";
import { tagesordnung } from "../src/sim/tagesordnung";
import { haushaltZustand } from "../src/sim/wirtschaft";
import { haushaltsGesetzSicht } from "../src/sim/haushalt";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

function welt(seed = 7): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 200;
  return w;
}

const imNetz = GESETZESVORHABEN.filter((v) => NET.index.has(v.massnahme));

describe("Eine Stimmenzahl", () => {
  test("Katalog, Maßnahmenzeile und Prüfung nennen für jede Fassung dieselben Ja-Stimmen", () => {
    const w = welt();
    for (const v of imNetz) {
      const s = vorhabenSicht(w, v);
      for (const f of FASSUNGEN) {
        const fs = s.fassungen[f];
        const p = gesetzesPrognose(w, v.massnahme, fs.ziel, null, f);
        expect(p.ja, `${v.id} ${f}`).toBe(fs.ja);
        expect(pruefeVorhaben(w, v.massnahme, fs.ziel, null, f).gesetz.stimmen.erwartet).toBe(fs.ja);
        expect(p.fassung?.bonus ?? 0).toBe(fs.stimmenBonus);
      }
    }
  });

  test("F4: Eine freie Stufe auf dem Schritt einer Fassung gilt als diese Fassung, in der Gegenrichtung als keine", () => {
    const w = welt();
    for (const v of imNetz) {
      const stufe = nationalAverage(NET, w.net, v.massnahme);
      const schritte = v.schritte ?? STANDARD_SCHRITTE;
      FASSUNGEN.forEach((f, i) => {
        const ziel = Math.round(stufe + v.richtung * schritte[i]!);
        if (ziel < 0 || ziel > 100) return; // am Rand gekappt: kein voller Schritt
        expect(fassungFuerStufe(w, v.massnahme, ziel)?.fassung, `${v.id} ${f}`).toBe(f);
      });
      const gegen = Math.round(stufe - v.richtung * 10);
      const gegenEintrag = GESETZESVORHABEN.some((x) => x.massnahme === v.massnahme && x.richtung === -v.richtung);
      if (gegen >= 0 && gegen <= 100 && !gegenEintrag) expect(fassungFuerStufe(w, v.massnahme, gegen), v.id).toBeUndefined();
    }
  });

  test("Alle Katalogeinträge sind als Fassung an ihrer Maßnahme erreichbar", () => {
    const w = welt();
    const erreichbar = new Set(NET.nodes.filter((n) => n.kind === "massnahme").flatMap((n) => fassungsKnoepfe(w, n.id).map((k) => k.vorhaben)));
    expect(imNetz.length).toBe(GESETZESVORHABEN.length);
    expect(imNetz.filter((v) => !erreichbar.has(v.id)).map((v) => v.id)).toEqual([]);
  });
});

describe("Freie Stufe als Fassung", () => {
  test("Ein Gesetz aus dem Regler trägt Fassung und Bonus; nach der Annahme folgen Verbände und Ruhezeit wie im Katalog", () => {
    const w = welt();
    const v = GESETZESVORHABEN.find((x) => x.id === "gv_mindestlohn")!;
    const stufe = nationalAverage(NET, w.net, v.massnahme);
    const ziel = Math.round(stufe + v.richtung * 20); // zwischen Kompromiss (18) und scharf (30)
    expect(bringeEin(w, v.massnahme, ziel, null, "gesetz").ok).toBe(true);
    const g = w.spiel!.gesetze.find((x) => x.massnahme === v.massnahme)!;
    expect(g.vorhaben).toBe("gv_mindestlohn");
    expect(g.fassung).toBe("kompromiss");
    // Seit N4 heißt der Eintrag „Mindestlohnrunde“: Den Mindestlohn setzt die Kommission fest, kein Gesetz (B-4)
    expect(g.name).toContain("Mindestlohnrunde");
    g.absprachen = 600;
    w.day = g.abstimmung;
    gesetzeAbstimmen(w, new Rng(3));
    const z = gesetzgebungVon(w);
    expect(z.beschlossen.map((b) => b.vorhaben)).toContain("gv_mindestlohn");
    expect(z.ruhe.gv_mindestlohn).toBeGreaterThan(w.day);
    // Jetzt ruht das Thema auch am Regler (G6)
    const pr = pruefeVorhaben(w, v.massnahme, ziel + 10 * v.richtung, null);
    expect(pr.ok).toBe(false);
    expect(pr.grund).toMatch(/ruht/);
  });

  test("Regional oder ohne Katalogeintrag bleibt eine Änderung frei: kein Bonus, keine Fassung", () => {
    const w = welt();
    const v = GESETZESVORHABEN.find((x) => x.id === "gv_mindestlohn")!;
    const stufe = nationalAverage(NET, w.net, v.massnahme);
    expect(pruefeVorhaben(w, v.massnahme, stufe + 20 * v.richtung, [34]).fassung).toBeUndefined();
    const ohne = NET.nodes.find((n) => n.kind === "massnahme" && !GESETZESVORHABEN.some((x) => x.massnahme === n.id))!;
    const s = nationalAverage(NET, w.net, ohne.id);
    expect(pruefeVorhaben(w, ohne.id, s > 50 ? s - 20 : s + 20, null).fassung).toBeUndefined();
  });
});

describe("Tagesordnung", () => {
  test("Gesetz und Haushalt stehen je einmal darauf, mit den Zahlen ihrer Quelle", () => {
    const w = welt();
    const v = GESETZESVORHABEN.find((x) => x.id === "gv_mindestlohn")!;
    const stufe = nationalAverage(NET, w.net, v.massnahme);
    expect(bringeEin(w, v.massnahme, Math.round(stufe + 20 * v.richtung), null, "gesetz").ok).toBe(true);
    const z = haushaltZustand(w);
    z.gesetz = { jahr: Number(w.date.slice(0, 4)), schritte: {}, eingebracht: w.day, abstimmung: w.day + 25, absprachen: 0 };
    const to = tagesordnung(w);
    const g = w.spiel!.gesetze.find((x) => x.massnahme === v.massnahme)!;
    const gz = to.filter((p) => p.art === "gesetz" && p.gesetzId === g.id);
    expect(gz).toHaveLength(1);
    expect(gz[0]!.ja).toBe(gesetzPrognose(w, g).ja);
    const hz = to.filter((p) => p.art === "haushalt");
    expect(hz).toHaveLength(1);
    expect(hz[0]!.ja).toBe(haushaltsGesetzSicht(w)!.ja);
    // nach Termin geordnet
    expect(to.map((p) => p.tag)).toEqual([...to.map((p) => p.tag)].sort((a, b) => a - b));
  });

  test("Leer ohne Vorlagen", () => {
    const w = welt();
    w.spiel!.gesetze = [];
    expect(tagesordnung(w).filter((p) => p.art === "gesetz")).toEqual([]);
  });
});
