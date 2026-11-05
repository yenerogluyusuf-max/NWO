// Gesetzgebung nach der Verfassung (befund-B B-3, B-4, B-5, B-10; Nacht N4):
// Mehrheit der Anwesenden (Art. 96), Ausschuss, Unterschrift und Rücksendung (Art. 89), Rechtswege je Maßnahme
// (Präsidialbeschluss Art. 73, Haushaltsgeld Art. 161, Mindestlohnkommission), Ausnahmezustand mit Frist (Art. 119) und
// Stimmen mit Gesichtern statt anonymem Kauf.

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { GESETZ_SCHWELLE, PLENUM, REGELN, bringeEin, gesetzPhase, gesetzSicht, plenumAus, pruefeVorhaben, stimmenKaufen } from "../src/sim/handeln";
import { ausschussKompromiss, gesetzgebungVon, sendeZurueck, unterschreibe, zurUnterschrift } from "../src/sim/gesetzgebung";
import { absprachenAngebote, absprachenPreis, schliesseAbsprache } from "../src/sim/fraktionen-absprachen";
import { NOTSTAND, hebeNotstandAuf, notstandSicht, notstandVon, rufeNotstandAus, verlaengereNotstand } from "../src/sim/notstand";
import { rechtswegVon } from "../src/data/rechtswege";
import de from "../src/i18n/katalog/de/nacht_n4.json";
import en from "../src/i18n/katalog/en/nacht_n4.json";
import tr from "../src/i18n/katalog/tr/nacht_n4.json";
import type { World } from "../src/sim/types";

function neu(seed = 11): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 140;
  return w;
}
const stufe = (w: World, id: string) => nationalAverage(NET, w.net, id);
const knoten = (id: string) => NET.nodes[NET.index.get(id)!]!;

describe("Art. 96: Mehrheit der Anwesenden", () => {
  test("Quorum, Mehrheit unter den Anwesenden, mindestens 151 Ja", () => {
    const e = plenumAus(GESETZ_SCHWELLE);
    expect(e.angenommen).toBe(true);
    expect(e.ja + e.nein + e.abwesend).toBe(PLENUM.mitglieder);
    expect(e.ja * 2).toBeGreaterThan(e.ja + e.nein);
    expect(plenumAus(GESETZ_SCHWELLE - 1).angenommen).toBe(false);
    // Bei üblicher Anwesenheit reicht weniger als die Mitgliedermehrheit, aber nie unter 151
    expect(GESETZ_SCHWELLE).toBeLessThan(REGELN.mehrheit);
    expect(GESETZ_SCHWELLE).toBeGreaterThan(PLENUM.mindestJa);
    // Wer fast allein ist, scheitert am Mindestwert, selbst wenn die Gegenseite fehlt
    expect(plenumAus(150, 0).angenommen).toBe(false);
  });
});

describe("Rechtswege je Maßnahme (B-4)", () => {
  test("Verteidigung, Polizei und Grenzschutz ausweiten nur per Gesetz, nie per Erlass (Art. 161)", () => {
    const w = neu();
    for (const id of ["m_verteidigung", "m_polizei", "m_grenzschutz"]) {
      expect(rechtswegVon(knoten(id), 1, 80), id).toBe("haushalt");
      const pr = pruefeVorhaben(w, id, Math.min(100, stufe(w, id) + 20));
      expect(pr.erlass.moeglich, id).toBe(false);
      expect(bringeEin(w, id, Math.min(100, stufe(w, id) + 20), null, "erlass").ok).toBe(false);
    }
  });

  test("Mehrwertsteuer per Präsidialbeschluss (KDV-Gesetz Art. 28): sofort, ohne Abstimmung", () => {
    const w = neu();
    const ziel = Math.round(stufe(w, "m_mwst") - 10);
    const pr = pruefeVorhaben(w, "m_mwst", ziel);
    expect(pr.rechtsweg).toBe("beschluss");
    expect(pr.erlass).toMatchObject({ moeglich: true, art: "beschluss" });
    const vorher = w.spiel!.kapital;
    const r = bringeEin(w, "m_mwst", ziel, null, "erlass");
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(vorher - pr.erlass.pk);
    expect(w.spiel!.gesetze.some((g) => g.massnahme === "m_mwst")).toBe(false);
    expect(w.net.targets.m_mwst).toBe(ziel);
    expect(r.text).toContain("Präsidialbeschluss");
  });

  test("Mindestlohn über die Kommission: kein Plenum, Beschluss nach der Frist, Preis wie angezeigt", () => {
    const w = neu();
    const ziel = Math.round(stufe(w, "m_mindestlohn") + 20);
    const pr = pruefeVorhaben(w, "m_mindestlohn", ziel);
    expect(pr.rechtsweg).toBe("kommission");
    const vorher = w.spiel!.kapital;
    const r = bringeEin(w, "m_mindestlohn", ziel, null, "gesetz");
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(vorher - pr.gesetz.pk);
    const g = w.spiel!.gesetze.find((x) => x.massnahme === "m_mindestlohn")!;
    expect(g.weg).toBe("kommission");
    expect(gesetzPhase(w, g)).toBe("kommission");
    expect(g.abstimmung - w.day).toBe(pr.gesetz.tage);
    advance(w, pr.gesetz.tage + 1);
    expect(w.net.targets.m_mindestlohn).toBe(ziel);
    expect(w.log.some((l) => l.text.startsWith("Die Mindestlohnkommission beschließt mit 10 zu 5"))).toBe(true);
    expect(w.log.some((l) => l.abstimmung && l.abstimmung.name === g.name)).toBe(false);
  });
});

describe("Ausschuss und Präsident (Art. 88, 89)", () => {
  test("Die eigene Fraktion bringt ein, der Ausschuss berät zuerst; ein Kompromiss holt Stimmen", () => {
    const w = neu();
    const id = "m_kindergeld";
    const r = bringeEin(w, id, Math.min(100, Math.round(stufe(w, id) + 30)), null, "gesetz");
    expect(r.ok).toBe(true);
    expect(r.text).toContain("Ihre Fraktion");
    const g = w.spiel!.gesetze.find((x) => x.massnahme === id)!;
    expect(gesetzPhase(w, g)).toBe("ausschuss");
    const ziel = g.stufe;
    const ja = gesetzSicht(w, g).ja;
    expect(ausschussKompromiss(w, g.id).ok).toBe(true);
    expect(g.stufe).toBeLessThan(ziel);
    expect(g.urStufe).toBe(ziel);
    expect(gesetzSicht(w, g).ja).toBeGreaterThanOrEqual(ja);
    // Ein zweites Mal geht nicht
    expect(ausschussKompromiss(w, g.id).ok).toBe(false);
    advance(w, REGELN.ausschussTage);
    expect(gesetzPhase(w, g)).toBe("plenum");
  });

  test("Ohne Ausschussmehrheit ändert die Opposition den Entwurf; der Präsident unterschreibt oder sendet zurück", () => {
    const w = neu();
    w.spiel!.lager = [];
    // Ohne Lager fehlt die Mehrheit im Ausschuss; damit das Plenum trotzdem annimmt, holt das Gesetz viele Absprachen
    const id = "m_kindergeld";
    expect(bringeEin(w, id, Math.min(100, Math.round(stufe(w, id) + 30)), null, "gesetz").ok).toBe(true);
    const g = w.spiel!.gesetze.find((x) => x.massnahme === id)!;
    const ziel = g.stufe;
    g.absprachen = 400;
    advance(w, REGELN.ausschussTage + 1);
    expect(g.ausschuss).toBe("geaendert");
    expect(g.stufe).toBeLessThan(ziel);
    advance(w, REGELN.tageBisAbstimmung);
    const u = zurUnterschrift(w);
    expect(u).toHaveLength(1);
    expect(w.net.targets[id]).toBeUndefined();
    // Zurücksenden: neue Beratung, Wiederannahme nur mit der Mitgliedermehrheit
    expect(sendeZurueck(w, g.id).ok).toBe(true);
    const r = w.spiel!.gesetze.find((x) => x.massnahme === id)!;
    expect(r.rueckgabe).toBe(true);
    expect(gesetzSicht(w, r).schwelle).toBeGreaterThan(REGELN.mehrheit);
  });

  test("Ohne Entscheidung gilt das Gesetz nach 15 Tagen als verkündet", () => {
    const w = neu();
    w.spiel!.lager = [];
    const id = "m_kindergeld";
    bringeEin(w, id, Math.min(100, Math.round(stufe(w, id) + 30)), null, "gesetz");
    const g = w.spiel!.gesetze.find((x) => x.massnahme === id)!;
    g.absprachen = 400;
    advance(w, REGELN.tageBisAbstimmung + 1);
    expect(zurUnterschrift(w)).toHaveLength(1);
    const stufeImEntwurf = zurUnterschrift(w)[0]!.gesetz.stufe;
    advance(w, REGELN.unterschriftTage + 1);
    expect(zurUnterschrift(w)).toHaveLength(0);
    expect(w.net.targets[id]).toBe(stufeImEntwurf);
  });

  test("Unterschreiben wirkt sofort", () => {
    const w = neu();
    w.spiel!.lager = [];
    const id = "m_kindergeld";
    bringeEin(w, id, Math.min(100, Math.round(stufe(w, id) + 30)), null, "gesetz");
    w.spiel!.gesetze.find((x) => x.massnahme === id)!.absprachen = 400;
    advance(w, REGELN.tageBisAbstimmung + 1);
    const u = zurUnterschrift(w)[0]!;
    expect(unterschreibe(w, u.gesetz.id).ok).toBe(true);
    expect(w.net.targets[id]).toBe(u.gesetz.stufe);
  });

  test("Mit Mehrheit im Ausschuss bleibt der Entwurf, das Gesetz gilt am Abstimmungstag", () => {
    const w = neu();
    const id = "m_kindergeld";
    bringeEin(w, id, Math.min(100, Math.round(stufe(w, id) + 30)), null, "gesetz");
    const g = w.spiel!.gesetze.find((x) => x.massnahme === id)!;
    const ziel = g.stufe;
    advance(w, REGELN.tageBisAbstimmung + 1);
    expect(zurUnterschrift(w)).toHaveLength(0);
    expect(w.net.targets[id]).toBe(ziel);
    const l = w.log.find((x) => x.abstimmung?.name === g.name)!;
    expect(l.abstimmung!.ja + l.abstimmung!.nein + (l.abstimmung!.abwesend ?? 0)).toBe(600);
  });
});

describe("Stimmen mit Gesichtern (B-10)", () => {
  test("Angebote nennen Abgeordnete, Provinz, Preis und Risiko; der Preis steigt mit jeder Absprache", () => {
    const w = neu();
    w.spiel!.lager = [];
    const id = "m_kindergeld";
    bringeEin(w, id, Math.min(100, Math.round(stufe(w, id) + 30)), null, "gesetz");
    const g = w.spiel!.gesetze.find((x) => x.massnahme === id)!;
    const angebote = absprachenAngebote(w, g);
    expect(angebote.length).toBeGreaterThan(0);
    const a = angebote[0]!;
    expect(a.wer).toMatch(/^\S+ \S+$/);
    expect(a.n).toBeGreaterThan(0);
    expect(a.kapital).toBeGreaterThan(0);
    // Aus einer Fraktion lässt sich nur ein kleiner Teil gewinnen
    expect(a.n).toBeLessThanOrEqual(Math.ceil((w.parliament!.seats[a.partei] ?? 0) * 0.12));
    const kapital = w.spiel!.kapital;
    const ja = gesetzSicht(w, g).ja;
    expect(schliesseAbsprache(w, g.id, a.id).ok).toBe(true);
    expect(w.spiel!.kapital).toBe(kapital - a.kapital);
    expect(gesetzSicht(w, g).ja).toBe(ja + a.n);
    const danach = absprachenAngebote(w, g).find((x) => x.art === a.art && x.n === a.n);
    if (danach) expect(danach.kapital).toBeGreaterThanOrEqual(a.kapital);
  });

  test("stimmenKaufen geht über dieselben Absprachen, zum angezeigten Preis", () => {
    const w = neu();
    w.spiel!.lager = [];
    const id = "m_kindergeld";
    bringeEin(w, id, Math.min(100, Math.round(stufe(w, id) + 30)), null, "gesetz");
    const g = w.spiel!.gesetze.find((x) => x.massnahme === id)!;
    const preis = absprachenPreis(w, g, 10);
    const kapital = w.spiel!.kapital;
    expect(stimmenKaufen(w, g.id, 10).ok).toBe(true);
    expect(w.spiel!.kapital).toBe(kapital - preis.kapital);
    expect(g.absprachen).toBe(preis.stimmen);
    expect((g.zusagenListe ?? []).length).toBeGreaterThan(0);
  });
});

describe("Ausnahmezustand (B-5, Art. 119)", () => {
  test("Nur mit Anlass; Bestätigung am selben Tag; höchstens 180 Tage, Verlängerung je 120 Tage", () => {
    const w = neu();
    expect(notstandSicht(w).moeglich).toBe(false);
    expect(rufeNotstandAus(w).ok).toBe(false);
    // Anlass: schwere Wirtschaftskrise
    w.economy.inflation = 75;
    expect(notstandSicht(w).anlaesse).toContain("wirtschaft");
    const vorher = Math.round(stufe(w, "m_notstand"));
    const r = rufeNotstandAus(w);
    expect(r.ok).toBe(true);
    const z = notstandVon(w)!;
    expect(z.bis - w.day).toBe(NOTSTAND.hoechstTage);
    expect(w.net.targets.m_notstand).toBe(NOTSTAND.stufe);
    expect(verlaengereNotstand(w).ok).toBe(true);
    expect(z.bis - w.day).toBe(NOTSTAND.hoechstTage + NOTSTAND.verlaengerungTage);
    expect(hebeNotstandAuf(w).ok).toBe(true);
    expect(notstandVon(w)).toBeUndefined();
    expect(w.net.targets.m_notstand).toBe(vorher);
  });

  test("Er endet von selbst, wenn die Frist abläuft", () => {
    const w = neu();
    w.economy.inflation = 75;
    expect(rufeNotstandAus(w).ok).toBe(true);
    advance(w, NOTSTAND.hoechstTage + 1);
    expect(notstandVon(w)).toBeUndefined();
  });

  test("Der Regler führt ab den Notstandsdekreten nicht über ein Gesetz", () => {
    const w = neu();
    const pr = pruefeVorhaben(w, "m_notstand", 90);
    expect(pr.ok).toBe(false);
    expect(pr.rechtsweg).toBe("notstand");
  });

  test("Spielstand mit Ausnahmezustand und wartendem Gesetz lädt", () => {
    const w = neu();
    w.economy.inflation = 75;
    rufeNotstandAus(w);
    const w2 = load(save(w));
    expect(notstandVon(w2)?.bis).toBe(notstandVon(w)!.bis);
    expect(gesetzgebungVon(w2).notstand).toBeDefined();
  });
});

describe("Kataloge", () => {
  test("Alle Schlüssel in drei Sprachen, gleiche Platzhalter", () => {
    const platz = (s: string) => [...new Set([...s.matchAll(/\{(\w+)(?=[,}|])/g)].map((m) => m[1]))].sort().join(",");
    for (const [k, v] of Object.entries(de)) {
      expect((en as Record<string, string>)[k], `en ${k}`).toBeTruthy();
      expect((tr as Record<string, string>)[k], `tr ${k}`).toBeTruthy();
      expect(platz((en as Record<string, string>)[k]!), `en ${k}`).toBe(platz(v));
      expect(platz((tr as Record<string, string>)[k]!), `tr ${k}`).toBe(platz(v));
    }
  });
});
