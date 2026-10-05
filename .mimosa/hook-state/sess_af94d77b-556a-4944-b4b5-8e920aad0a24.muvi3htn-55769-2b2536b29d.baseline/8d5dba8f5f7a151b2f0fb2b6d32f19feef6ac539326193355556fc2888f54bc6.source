// Wirkungsberichte, zweite Stufe: ehrliche Zahlen, echter Verlauf, Reifegrad statt Nullvergleich, Regionen, Abwärtskompatibilität.

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { setPolicy } from "../src/sim/handeln";
import { veraenderung, type Bericht } from "../src/sim/berichte";
import { NET } from "../src/sim/modell";
import { provinceValue } from "../src/sim/netz";

function neu() {
  const w = createWorld(turkey2026, 9);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.hinweise = [];
  return w;
}

const tageBis = (monate: number) => 30 * monate + 1;

describe("Wirkungsberichte: Darstellung der Zahlen", () => {
  test("Kleinstwerte sind „unverändert“, nie „−0,0“ oder „+0,0“", () => {
    for (const d of [0, -0, 0.0001, -0.0001, 0.049, -0.049, -1e-12]) expect(veraenderung(d)).toBe("unverändert");
    expect(veraenderung(2.27)).toBe("+2,3");
    expect(veraenderung(-2.2)).toBe("−2,2");
    expect(veraenderung(-0.05)).toBe("−0,1");
  });

  test("Kein Bericht enthält eine Null mit Vorzeichen", () => {
    const w = neu();
    setPolicy(w, "m_staudaemme", 100);
    setPolicy(w, "m_wasserleitungen", 100);
    setPolicy(w, "m_renten", 100);
    advance(w, tageBis(13));
    expect(w.spiel!.berichte!.length).toBeGreaterThanOrEqual(6);
    for (const b of w.spiel!.berichte!) {
      const text = [...b.zeilen, b.kurz, b.hinweis, ...(b.begruendung ?? [])].join(" ");
      expect(text).not.toMatch(/[−+-]0,0(?!\d)/);
    }
  });
});

describe("Wirkungsberichte: Reifegrad statt Nullvergleich", () => {
  test("Ein Bau, der noch läuft, wird als „zu früh“ gemeldet, mit Umsetzungsstand und Restdauer", () => {
    const w = neu();
    setPolicy(w, "m_staudaemme", 100);
    advance(w, tageBis(6));
    const b = w.spiel!.berichte![0]!;
    expect(b.phase).toBe("zu_frueh");
    expect(b.urteil).toBe("schwach");
    expect(b.reife!.stand).toBeGreaterThan(0);
    expect(b.reife!.stand).toBeLessThan(100);
    expect(b.reife!.restMonate).toBeGreaterThan(20);
    expect(b.kurz).toMatch(/^Umsetzung zu \d+ Prozent, noch keine Wirkung messbar; volle Wirkung in etwa \d+ Monaten\.$/);
    // Die unmittelbaren Wirkungswege sind „noch nicht fällig“, nicht „keine Wirkung“
    const direkt = b.groessen!.filter((g) => g.art === "groesse");
    expect(direkt.length).toBeGreaterThan(0);
    expect(direkt.every((g) => g.bewertung === "spaeter")).toBe(true);
    expect(b.begruendung!.join(" ")).toMatch(/Noch nicht fällig: .*Verzögerung: 12 Monate/);
    // Der Chronik-Eintrag trägt kein Urteil („Keine Wirkung“ wäre falsch)
    const c = w.spiel!.chronik.find((x) => x.titel === "Wirkungsbericht: Staudämme und Speicher")!;
    expect(c.ausgang).not.toMatch(/Es wirkt\.|Keine Wirkung|Gemischte Bilanz|Bisher kaum Wirkung/);
  });

  test("Die Kurzfassung ist ein vollständiger Satz und kurz genug für die Meldung", () => {
    const w = neu();
    setPolicy(w, "m_renten", 100);
    setPolicy(w, "m_staudaemme", 100);
    advance(w, tageBis(13));
    for (const b of w.spiel!.berichte!) {
      expect(b.kurz).toMatch(/\.$/);
      expect(b.kurz).not.toMatch(/…|\.\.\./);
      expect(b.kurz!.length).toBeLessThanOrEqual(140);
    }
  });
});

describe("Wirkungsberichte: ehrliche Bilanz mit Preis", () => {
  test("Eine Rentenerhöhung wirkt, kostet aber: gemischt, mit benannter Nebenwirkung", () => {
    const w = neu();
    setPolicy(w, "m_renten", 100);
    advance(w, tageBis(13));
    const b = w.spiel!.berichte!.find((x) => x.monate === 12)!;
    expect(b.urteil).toBe("gemischt");
    expect(b.groessen!.find((g) => g.id === "rentenniveau")!.bewertung).toBe("erwartet");
    const preis = b.groessen!.filter((g) => g.bewertung === "nebenwirkung").map((g) => g.id);
    expect(preis).toContain("sozialkassen");
    expect(b.begruendung!.join(" ")).toMatch(/Der Preis ist eingetreten: .*Sozialversicherung/);
    expect(b.kosten!.bipProJahr).toBeGreaterThan(0);
  });

  test("Eine ausgebliebene Nebenwirkung ist kein Verstoß gegen die Erwartung", () => {
    const w = neu();
    setPolicy(w, "m_staudaemme", 100);
    advance(w, tageBis(6));
    // Der Bericht darf nicht „keine Wirkung in die gewünschte Richtung“ sagen, nur weil sich die Polarisierung anders bewegt hat als modelliert
    expect(w.spiel!.berichte![0]!.urteil).not.toBe("keine");
  });

  test("Was ein anderer Beschluss erklärt, wird ihm zugeschrieben, nicht dieser Maßnahme", () => {
    const w = neu();
    setPolicy(w, "m_renten", 100);
    setPolicy(w, "m_wasserleitungen", 100, [31, 27, 63]);
    advance(w, tageBis(13));
    const b = w.spiel!.berichte!.find((x) => x.massnahme === "m_wasserleitungen" && x.monate === 12)!;
    const beschaeftigte = b.groessen!.find((g) => g.id === "arbeitnehmer")!;
    // Die Rentenerhöhung belastet die Beitragszahler (Verbindung m_renten → arbeitnehmer?) oder nicht: Wo die Bewegung gegen das Modell der
    // Wasserleitungen läuft und eine andere Maßnahme sie über eine eigene Verbindung erklärt, ist sie „fremd“ und zählt nicht gegen die Maßnahme.
    if (beschaeftigte.bewertung === "fremd") {
      expect(beschaeftigte.ursachen!.length).toBeGreaterThan(0);
      expect(b.urteil).not.toBe("keine");
      expect(b.begruendung!.join(" ")).toMatch(/anderen Beschlüssen zuzuschreiben/);
    }
    // Eine Bewegung entgegen dem Modell ohne anderen Erklärer bleibt „gegenläufig“ und zählt gegen die Maßnahme
    const ohneErklaerer = b.groessen!.filter((g) => g.bewertung === "gegenlaeufig");
    for (const g of ohneErklaerer) expect(g.ursachen ?? []).toHaveLength(0);
  });

  test("Gleichzeitig wirkende Beschlüsse werden genannt", () => {
    const w = neu();
    setPolicy(w, "m_wasserleitungen", 100);
    advance(w, 40);
    setPolicy(w, "m_staudaemme", 100);
    advance(w, tageBis(13));
    const b = w.spiel!.berichte!.find((x) => x.massnahme === "m_staudaemme" && x.monate === 6)!;
    expect(b.mitwirkend!.map((m) => m.massnahme)).toContain("m_wasserleitungen");
    expect(b.begruendung!.join(" ")).toMatch(/Zeitgleich wirkten auch: .*Wasserleitungen/);
  });
});

describe("Wirkungsberichte: Verlauf aus echten Stichproben", () => {
  test("Der Verlauf beginnt beim Stand des Beschlusses und hat monatliche Punkte", () => {
    const w = neu();
    setPolicy(w, "m_renten", 100);
    advance(w, tageBis(13));
    const b = w.spiel!.berichte!.find((x) => x.monate === 12)!;
    expect(b.verlaufTage![0]).toBe(0);
    expect(b.verlaufTage!.length).toBeGreaterThanOrEqual(12);
    for (let i = 1; i < b.verlaufTage!.length; i++) expect(b.verlaufTage![i]!).toBeGreaterThan(b.verlaufTage![i - 1]!);
    for (const g of b.groessen!) {
      expect(g.verlauf!.length).toBe(b.verlaufTage!.length);
      for (const x of g.verlauf!) expect(Number.isFinite(x)).toBe(true);
    }
    const rente = b.groessen!.find((g) => g.id === "rentenniveau")!;
    expect(rente.verlauf![0]).toBeCloseTo(rente.vorher, 1);
    expect(rente.verlauf![rente.verlauf!.length - 1]).toBeCloseTo(rente.nachher, 1);
    // Der Sechs-Monats-Bericht hat die kürzere Kurve
    const b6 = w.spiel!.berichte!.find((x) => x.monate === 6)!;
    expect(b6.verlaufTage!.length).toBeLessThan(b.verlaufTage!.length);
  });

  test("Der Speicherbedarf bleibt begrenzt", () => {
    const w = neu();
    setPolicy(w, "m_renten", 100);
    advance(w, tageBis(30));
    const o = w.spiel!.beobachtungen![0]!;
    // Die Stichproben laufen jetzt bis zum 24-Monats-Bericht: höchstens ein Punkt je Monat plus der Beschluss
    expect(o.verlauf!.tage.length).toBeLessThanOrEqual(26);
  });

  test("Gleiche Welt, gleicher Bericht (Determinismus)", () => {
    const lauf = () => {
      const w = neu();
      setPolicy(w, "m_renten", 100);
      setPolicy(w, "m_staudaemme", 80);
      advance(w, tageBis(13));
      return JSON.stringify(w.spiel!.berichte);
    };
    expect(lauf()).toBe(lauf());
  });
});

describe("Wirkungsberichte: Regionen", () => {
  test("Bei einem regionalen Beschluss stimmen die genannten Provinzen mit den Werten im Netz überein", () => {
    const w = neu();
    const ort = [31, 27, 63]; // Hatay, Gaziantep, Şanlıurfa
    setPolicy(w, "m_wasserleitungen", 100, ort);
    // Bis genau zum Berichtstag vorspulen: Die genannten Werte sind die des Berichtstages, nicht die eines späteren Monats
    for (let i = 0; i < 500 && !w.spiel!.berichte?.some((x) => x.monate === 12); i++) advance(w, 1);
    const b = w.spiel!.berichte!.find((x) => x.monate === 12)!;
    expect(b.regional).toBe("unterschiedlich");
    const mitRegionen = b.groessen!.filter((g) => g.regionen);
    expect(mitRegionen.length).toBeGreaterThan(0);
    for (const g of mitRegionen) {
      for (const r of [...g.regionen!.besser, ...g.regionen!.schlechter]) {
        expect(r.nachher).toBeCloseTo(provinceValue(NET, w.net, g.id, r.plaka), 1);
        expect(r.delta).toBeCloseTo(r.nachher - r.vorher, 0);
      }
      for (const r of g.regionen!.besser) expect(Math.abs(r.delta)).toBeGreaterThanOrEqual(0.8);
    }
    // Wo etwas gebaut wurde, ist die Verbesserung am größten
    const wasser = b.groessen!.find((g) => g.id === "wasserversorgung");
    if (wasser?.regionen?.besser.length) expect(ort).toContain(wasser.regionen.besser[0]!.plaka);
  });

  test("Wirkt etwas im ganzen Land gleich, gibt es keine Liste von Spitzenreitern", () => {
    const w = neu();
    setPolicy(w, "m_renten", 100);
    advance(w, tageBis(13));
    const b = w.spiel!.berichte!.find((x) => x.monate === 12)!;
    const rente = b.groessen!.find((g) => g.id === "rentenniveau")!;
    expect(rente.regionen).toBeUndefined();
    expect(b.regional).toBeDefined();
  });
});

describe("Wirkungsberichte: Abwärtskompatibilität", () => {
  test("Eine Beobachtung aus einem älteren Spielstand (ohne Verlauf und Provinzwerte) liefert einen Bericht mit zwei Punkten", () => {
    const w = neu();
    setPolicy(w, "m_renten", 100);
    for (const o of w.spiel!.beobachtungen!) {
      delete o.verlauf;
      delete o.provinzwerte;
      delete o.akutOrte;
    }
    advance(w, tageBis(7));
    const b = w.spiel!.berichte![0]!;
    expect(b.verlaufTage).toHaveLength(2);
    for (const g of b.groessen!) expect(g.verlauf).toHaveLength(2);
    expect(b.regional).toBeUndefined();
    expect(b.zeilen.length).toBeGreaterThan(0);
    expect(b.kurz).toBeTruthy();
  });

  test("Speichern und Laden erhält Beobachtungen und Berichte samt Zusatzfeldern", () => {
    const w = neu();
    setPolicy(w, "m_renten", 100);
    advance(w, tageBis(7));
    const geladen = load(save(w));
    expect(geladen.spiel!.berichte).toEqual(w.spiel!.berichte);
    expect(geladen.spiel!.beobachtungen).toEqual(w.spiel!.beobachtungen);
    // Nach dem Laden läuft die Stichprobe weiter
    advance(geladen, tageBis(6));
    const b12 = geladen.spiel!.berichte!.find((x: Bericht) => x.monate === 12)!;
    expect(b12.verlaufTage!.length).toBeGreaterThanOrEqual(12);
  });
});
