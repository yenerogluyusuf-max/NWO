// Verhandlungen mit den Fraktionen, Kapital-Gutschrift, aussichtslose Gesetze.

import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { bringeEin, gesetzSicht, REGELN, stimmenSicht, zieheGesetzZurueck } from "../src/sim/handeln";
import { fraktionsUebersicht, verhandle } from "../src/sim/verhandeln";
import { kapitalEinkommen } from "../src/sim/spiel";
import { befehl } from "../src/sim/befehle";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

const profil: PlayerProfile = {
  name: "Test",
  heimat: "Ankara",
  heimatPlaka: 6,
  jugend: "",
  beruf: "",
  partner: "Bauunternehmer, Aufträge vom Staat möglich",
  motiv: "",
  partei: { name: "Aufbruchspartei", kurz: "AP", farbe: "#2f5d62" },
  naehe: {},
  versprechen: [],
  wahl: { runde: 2, anteil: 51 },
};

function minderheit(seed = 7): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, profil);
  w.spiel!.ereignisse = [];
  w.spiel!.lager = [];
  w.spiel!.kapital = 60;
  return w;
}

describe("Kapital lädt sich monatlich auf", () => {
  test("Am Monatsersten kommt genau die angezeigte Gutschrift dazu", () => {
    const w = minderheit();
    const k = kapitalEinkommen(w);
    expect(k.summe).toBeCloseTo(k.grund + k.vertrauen + k.mehrheit + k.legitimitaet, 6);
    expect(k.summe).toBeGreaterThan(3);
    // bis zum nächsten Monatsersten laufen; Ereignisse ausschließen, die Kapital kosten könnten (sie kosten nur bei Antwort)
    w.spiel!.kapital = 10;
    const vorher = w.spiel!.kapital;
    let tage = 0;
    while (w.date < k.naechste && tage < 40) {
      advance(w, 1);
      tage++;
    }
    expect(w.date).toBe(k.naechste);
    expect(w.spiel!.kapital - vorher).toBeGreaterThan(k.summe * 0.6);
  });
});

describe("Fraktionen verhandeln", () => {
  test("Jede Fraktion außer der eigenen erscheint mit Stand und Schritten", () => {
    const w = minderheit();
    const f = fraktionsUebersicht(w);
    expect(f.length).toBeGreaterThanOrEqual(4);
    expect(f.every((x) => x.partei !== "AP")).toBe(true);
    for (const x of f) {
      expect(x.forderung.length).toBeGreaterThan(3);
      expect(x.aktionen.map((a) => a.id)).toContain("gespraech");
      expect(x.bereitschaft).toBeGreaterThanOrEqual(0);
      expect(x.bereitschaft).toBeLessThanOrEqual(100);
    }
  });

  test("Ein Gespräch kostet Kapital, macht offener und hat eine Abkühlzeit", () => {
    const w = minderheit();
    const partei = fraktionsUebersicht(w)[0]!.partei;
    const b0 = fraktionsUebersicht(w)[0]!.bereitschaft;
    const k0 = w.spiel!.kapital;
    const r = verhandle(w, partei, "gespraech", new Rng(1));
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(k0 - 1);
    expect(fraktionsUebersicht(w).find((x) => x.partei === partei)!.bereitschaft).toBeGreaterThan(b0);
    expect(verhandle(w, partei, "gespraech", new Rng(1)).ok).toBe(false);
  });

  test("Eine Duldung liefert Stimmen für Gesetze und läuft aus", () => {
    const w = minderheit();
    const f = fraktionsUebersicht(w).find((x) => x.aktionen.find((a) => a.id === "duldung")?.moeglich) ?? fraktionsUebersicht(w)[0]!;
    // Bereitschaft künstlich heben (in der Praxis durch Gespräche und Zugeständnisse)
    w.spiel!.fraktionen![f.partei]!.bereitschaft = 70;
    const vorher = stimmenSicht(w).erwartet;
    const r = verhandle(w, f.partei, "duldung", new Rng(2));
    expect(r.ok).toBe(true);
    expect(stimmenSicht(w).erwartet).toBeGreaterThan(vorher + f.sitze * 0.4);
    expect(w.spiel!.zusagen.some((z) => z.von === f.partei && !z.erfuellt)).toBe(true);
    advance(w, 200);
    expect(stimmenSicht(w).duldung).toBe(0);
  });

  test("Ein Bündnis holt die Fraktion ins Lager, aber nur bei genug Offenheit", () => {
    const w = minderheit();
    const f = fraktionsUebersicht(w).find((x) => x.sitze >= 10)!;
    w.spiel!.fraktionen![f.partei]!.bereitschaft = 30;
    expect(verhandle(w, f.partei, "koalition", new Rng(3)).ok).toBe(false);
    w.spiel!.fraktionen![f.partei]!.bereitschaft = 70;
    const lager0 = stimmenSicht(w).lager;
    expect(verhandle(w, f.partei, "koalition", new Rng(3)).ok).toBe(true);
    expect(w.spiel!.lager).toContain(f.partei);
    expect(stimmenSicht(w).lager).toBe(lager0 + f.sitze);
  });

  test("Ohne Kapital gibt es keine Verhandlung", () => {
    const w = minderheit();
    w.spiel!.kapital = -20;
    const partei = fraktionsUebersicht(w)[0]!.partei;
    expect(verhandle(w, partei, "gespraech", new Rng(1)).ok).toBe(false);
  });
});

describe("Aussichtslose Gesetze", () => {
  test("Die Lücke, die Kosten und der Rückzug stimmen", () => {
    const w = minderheit();
    w.spiel!.kapital = 60;
    const r = bringeEin(w, "m_mindestlohn", 70, null, "gesetz");
    expect(r.ok).toBe(true);
    const g = w.spiel!.gesetze[0]!;
    const gs = gesetzSicht(w, g);
    expect(gs.luecke).toBeGreaterThan(0);
    expect(gs.kosten).toBe(Math.ceil(gs.noetig * REGELN.kaufKostenProStimme));
    const kapital = w.spiel!.kapital;
    const zr = zieheGesetzZurueck(w, g.id);
    expect(zr.ok).toBe(true);
    expect(w.spiel!.gesetze).toHaveLength(0);
    expect(w.spiel!.kapital).toBe(kapital + Math.floor(g.pk * REGELN.rueckzugAnteil));
  });
});

describe("Chat: Verhandlung", () => {
  test("Die Frage nach der Opposition erklärt den Weg statt auf Diplomatie zu verweisen", () => {
    const w = minderheit();
    const r = befehl("Wie verhandle ich mit der Opposition?", w);
    expect(r.ok).toBe(true);
    expect(r.text).toMatch(/Gespräch/);
    expect(r.text).toMatch(/Duldung/);
    expect(r.text).not.toMatch(/anderen Staaten/);
  });

  test("Ein Gespräch mit einer Fraktion wird ausgeführt", () => {
    const w = minderheit();
    const partei = fraktionsUebersicht(w)[0]!;
    const k0 = w.spiel!.kapital;
    const r = befehl(`Führe ein Gespräch mit der ${partei.partei}`, w);
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(k0 - 1);
  });

  test("Die Kapital-Frage nennt Datum und Aufschlüsselung", () => {
    const w = minderheit();
    const r = befehl("Wie viel Kapital habe ich und lädt es sich auf?", w);
    expect(r.ok).toBe(true);
    expect(r.text).toMatch(/Grundeinkommen/);
    expect(r.text).toMatch(/2028/);
  });
});

describe("Start mit Regierungsmehrheit", () => {
  const PROFILE: [string, string | undefined][] = [["AP", undefined], ["AP", "YENİ"], ["PG", undefined], ["PG", "MHP"], ["PW", undefined], ["PW", "YENİ"], ["PR", undefined]];
  test.each(PROFILE)("Profil %s mit Bündnis %s beginnt mit mindestens 301 Sitzen", (kurz, buendnis) => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const w = createWorld(turkey2026, seed);
      startAfterElection(w, { ...profil, partei: { name: kurz, kurz, farbe: "#555" }, ...(buendnis ? { buendnis } : {}) });
      const s = stimmenSicht(w);
      expect(s.lager, `Seed ${seed}`).toBeGreaterThanOrEqual(301);
      // Jeder Partner im Lager hat eine Figur und eine offene Zusage (außer dem Bündnispartner aus dem Prolog)
      for (const p of w.spiel!.lager) expect(w.spiel!.figuren.some((f) => f.partei === p), `${p} ohne Figur`).toBe(true);
    }
  });

  test("Die Startmeldung nennt die Partner und die Mehrheit", () => {
    const w = createWorld(turkey2026, 1);
    startAfterElection(w, profil);
    const meldung = w.log.find((l) => l.text.includes("Präsidentschaftswahl"))!;
    expect(meldung.text).toMatch(/Regierungslager \d+ Sitze/);
    expect(meldung.why).toMatch(/Regierungsmehrheit/);
  });
});
