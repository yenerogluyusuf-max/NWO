// Das politische Spektrum: Achsen, Linie als Preis (Kosten, Stimmen, Partnerloyalität), Nähe der Gruppen und Parteien.
// Die Formeln sind neutral: Jede Richtung wird gleich behandelt (Spiegelung der Linie spiegelt die Wirkung).

import { describe, expect, test } from "vitest";
import { ACHSEN_IDS, GRUPPEN_ACHSEN, MASSNAHME_VEKTOR, NULL_ACHSEN, PARTEI_ACHSEN, VOREINSTELLUNGEN, type Achsen } from "../src/data/linien";
import { GRUPPEN } from "../src/sim/gruppen";
import { NET, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { pruefeVorhaben, stimmenSicht } from "../src/sim/handeln";
import { figur } from "../src/sim/figuren";
import {
  LINIE,
  abstand,
  gruppenNaehe,
  jaAnteilLager,
  linienFaktor,
  naeheAusAbstand,
  naeheFuerLinie,
  naeheZuPartei,
  parteiAchsen,
  quellenAusAchsen,
  reagierePartner,
  setzeLinie,
  spielerAchsen,
  zustimmungsEinfluss,
  preisFaktor,
  uebereinstimmung,
  vorschau,
  voreinstellungAlsAngabe,
} from "../src/sim/linie";
import { POLLS } from "../src/sim/prolog";
import { waehlePartner } from "../src/sim/fraktionen";
import { kurswechsel, kurswechselKosten, reagiereStamm } from "../src/sim/linie";

const spiegel = (a: Achsen): Achsen => ({ wirtschaft: -a.wirtschaft, gesellschaft: -a.gesellschaft, national: -a.national, religion: -a.religion, zentral: -a.zentral });
const preset = (id: string) => VOREINSTELLUNGEN.find((v) => v.id === id)!;

function welt(id: string, buendnis?: string, seed = 3) {
  const w = createWorld(turkey2026, seed);
  const p: PlayerProfile = schnellProfil("Linientest", () => 0, voreinstellungAlsAngabe(preset(id), id));
  if (buendnis) p.buendnis = buendnis;
  startAfterElection(w, p);
  return w;
}

describe("Daten: Achsen, Parteien, Gruppen, Maßnahmen", () => {
  test("jede der 117 Maßnahmen hat einen Achsenvektor, und es gibt keine überzähligen", () => {
    const ids = NET.nodes.filter((n) => n.kind === "massnahme").map((n) => n.id);
    expect(ids.length).toBe(117);
    for (const id of ids) expect(MASSNAHME_VEKTOR[id], id).toBeDefined();
    for (const id of Object.keys(MASSNAHME_VEKTOR)) expect(ids, id).toContain(id);
  });

  test("alle Werte liegen im erlaubten Bereich", () => {
    for (const [id, v] of Object.entries(MASSNAHME_VEKTOR)) for (const k of ACHSEN_IDS) expect(Math.abs(v[k]), `${id}.${k}`).toBeLessThanOrEqual(1);
    for (const a of [...Object.values(PARTEI_ACHSEN), ...Object.values(GRUPPEN_ACHSEN), ...VOREINSTELLUNGEN.map((v) => v.achsen)]) for (const k of ACHSEN_IDS) expect(Math.abs(a[k])).toBeLessThanOrEqual(100);
  });

  test("jede Wählergruppe hat ein Achsenprofil", () => {
    for (const g of GRUPPEN) expect(GRUPPEN_ACHSEN[g.id], g.id).toBeDefined();
  });

  test("mindestens zehn Voreinstellungen, eindeutige Kürzel, keine Kollision mit der Szene, vom linken zum rechten Rand", () => {
    expect(VOREINSTELLUNGEN.length).toBeGreaterThanOrEqual(10);
    const kurz = VOREINSTELLUNGEN.map((v) => v.kurz);
    expect(new Set(kurz).size).toBe(kurz.length);
    for (const k of kurz) expect(k in PARTEI_ACHSEN, k).toBe(false);
    const w = VOREINSTELLUNGEN.map((v) => v.achsen.wirtschaft);
    expect(Math.min(...w)).toBeLessThanOrEqual(-85);
    expect(Math.max(...w)).toBeGreaterThanOrEqual(85);
    const g = VOREINSTELLUNGEN.map((v) => v.achsen.gesellschaft);
    expect(Math.min(...g)).toBeLessThanOrEqual(-60);
    expect(Math.max(...g)).toBeGreaterThanOrEqual(85);
  });
});

describe("Abstand und Nähe", () => {
  test("Abstand ist null zu sich selbst, symmetrisch und höchstens 1", () => {
    const a = preset("sozialistisch").achsen;
    const b = preset("autoritaer").achsen;
    expect(abstand(a, a)).toBe(0);
    expect(abstand(a, b)).toBeCloseTo(abstand(b, a), 10);
    expect(abstand(a, b)).toBeLessThanOrEqual(1);
  });

  test("Nähe zu den Parteien der Szene: nah, wo die Linie nah ist, fern, wo sie fern ist", () => {
    const aut = preset("autoritaer").achsen;
    expect(naeheZuPartei(aut, "MHP")).toBe(2);
    expect(naeheZuPartei(aut, "DEM")).toBe(-2);
    const soz = preset("sozialistisch").achsen;
    expect(naeheZuPartei(soz, "DEM")).toBeGreaterThanOrEqual(1);
    expect(naeheZuPartei(soz, "MHP")).toBeLessThan(0);
    expect(naeheAusAbstand(0)).toBe(2);
    expect(naeheAusAbstand(1)).toBe(-2);
  });

  test("Nähe der Gruppen: Summe über alle Gruppen null (gewichtet), höchstens ±5, und sie folgt den Achsen", () => {
    for (const v of VOREINSTELLUNGEN) {
      const n = gruppenNaehe(v.achsen);
      const summe = GRUPPEN.reduce((s, g) => s + g.gewicht * n[g.id]!, 0);
      expect(Math.abs(summe), v.id).toBeLessThan(GRUPPEN.reduce((s, g) => s + g.gewicht, 0) * 0.6);
      for (const g of GRUPPEN) expect(Math.abs(n[g.id]!), `${v.id}.${g.id}`).toBeLessThanOrEqual(LINIE.gruppenNaehe + 1);
    }
    const links = gruppenNaehe(preset("sozialistisch").achsen);
    expect(links["arme"]!).toBeGreaterThan(links["unternehmer"]!);
    const rechts = gruppenNaehe(preset("libertaer").achsen);
    expect(rechts["unternehmer"]!).toBeGreaterThan(rechts["arme"]!);
    const relig = gruppenNaehe(preset("islamistisch").achsen);
    expect(relig["konservative"]!).toBeGreaterThan(relig["staedtische_saekulare"]!);
  });

  test("die klassischen Muster behalten ihre von Hand gesetzte Nähe (Kalibrierung bleibt)", () => {
    expect(naeheFuerLinie("PG", preset("gerechtigkeit").achsen)).toEqual({ arbeitnehmer: 4, rentner: 3, unternehmer: -2 });
    expect(naeheFuerLinie("PR", preset("regionen").achsen)).toEqual({ landwirte: 4, junge: 1 });
  });

  test("Quellen einer neuen Partei: Summe 1, die Nähe entscheidet", () => {
    const q = quellenAusAchsen(preset("nationalistisch").achsen, POLLS);
    expect(Object.values(q).reduce((s, x) => s + x, 0)).toBeCloseTo(1, 6);
    expect(q["MHP"]!).toBeGreaterThan(q["DEM"]!);
    const l = quellenAusAchsen(preset("sozialistisch").achsen, POLLS);
    expect(l["DEM"]!).toBeGreaterThan(l["MHP"]!);
  });

  test("Partnerwahl rechnet für freie Linien aus den Achsen", () => {
    const sitze = { AKP: 150, MHP: 60, "YENİ": 90, CHP: 80, DEM: 50, "İYİ": 40, Zafer: 20, YRP: 10, NAT: 100 };
    const partner = waehlePartner(sitze, "NAT", undefined, preset("nationalistisch").achsen);
    expect(partner.length).toBeGreaterThan(0);
    expect(partner).not.toContain("DEM");
  });
});

describe("Linie als Preis (neutral für jede Richtung)", () => {
  test("Übereinstimmung ist spiegelsymmetrisch: Linie und Richtung gespiegelt ergeben dieselbe Wirkung", () => {
    for (const id of Object.keys(MASSNAHME_VEKTOR)) {
      for (const v of VOREINSTELLUNGEN) {
        const a = uebereinstimmung(v.achsen, id, 1);
        expect(uebereinstimmung(v.achsen, id, -1), id).toBeCloseTo(-a, 10);
        expect(uebereinstimmung(spiegel(v.achsen), id, 1), id).toBeCloseTo(-a, 10);
      }
    }
  });

  test("die Mitte ohne Linie zahlt für nichts mehr oder weniger", () => {
    const w = { player: { partei: { kurz: "X", name: "X", farbe: "#000" }, achsen: NULL_ACHSEN } } as never;
    for (const id of Object.keys(MASSNAHME_VEKTOR)) expect(linienFaktor(w, id, 10)).toBe(1);
  });

  test("Kosten: mit der Linie billiger, gegen sie teurer; der Spielraum ist begrenzt", () => {
    const lib = welt("libertaer", "YENİ");
    const sozial = welt("sozialistisch", "CHP");
    // Privatisierung hoch: passt zur libertären, nicht zur sozialistischen Linie
    const pL = pruefeVorhaben(lib, "m_privatisierung", 70).gesetz.pk;
    const pS = pruefeVorhaben(sozial, "m_privatisierung", 70).gesetz.pk;
    expect(pL).toBeLessThan(pS);
    // Sozialhilfe hoch: umgekehrt
    const sL = pruefeVorhaben(lib, "m_sozialhilfe", 70).gesetz.pk;
    const sS = pruefeVorhaben(sozial, "m_sozialhilfe", 70).gesetz.pk;
    expect(sS).toBeLessThan(sL);
    for (const v of VOREINSTELLUNGEN) {
      for (const id of Object.keys(MASSNAHME_VEKTOR)) {
        const f = linienFaktor({ player: { partei: { kurz: v.kurz, name: v.id, farbe: "#000" }, achsen: v.achsen } } as never, id, 1);
        expect(f).toBeGreaterThanOrEqual(1 - LINIE.rabatt - 1e-9);
        expect(f).toBeLessThanOrEqual(1 + LINIE.aufschlag + 1e-9);
      }
    }
  });

  test("Stimmen: Ohne Angabe des Gesetzes rechnet das Lager wie früher, mit Angabe stimmt ein Teil gegen seine Linie nicht mit", () => {
    const w = welt("autoritaer", "MHP");
    const ohne = stimmenSicht(w);
    const dafuer = stimmenSicht(w, { massnahme: "m_polizei", richtung: 1 });
    const dagegen = stimmenSicht(w, { massnahme: "m_versammlungsfreiheit", richtung: 1 });
    expect(ohne.erwartet).toBeGreaterThanOrEqual(ohne.lager);
    expect(dafuer.erwartet).toBeGreaterThan(dagegen.erwartet);
    // Dieselbe Rechnung für die Gegenrichtung: Wer Versammlungsfreiheit senkt, bekommt aus dem autoritären Lager mehr
    const senken = stimmenSicht(w, { massnahme: "m_versammlungsfreiheit", richtung: -1 });
    expect(senken.erwartet).toBeGreaterThan(dagegen.erwartet);
  });

  test("Stimmen: Eine libertäre Regierung verliert bei Internetsperren Abweichler, eine autoritäre nicht", () => {
    const lib = welt("libertaer", "YENİ");
    const aut = welt("autoritaer", "MHP");
    const l = stimmenSicht(lib, { massnahme: "m_internetsperren", richtung: 1 });
    const a = stimmenSicht(aut, { massnahme: "m_internetsperren", richtung: 1 });
    expect(l.erwartet - l.lager).toBeLessThan(a.erwartet - a.lager);
  });

  test("Anteil der Lagerpartei: voll bei Übereinstimmung, begrenzt bei Gegenläufigkeit, die eigene Partei hält mehr Disziplin", () => {
    const w = welt("liberal", "MHP");
    const fremd = jaAnteilLager(w, "MHP", "m_wissenschaftsfreiheit", 1);
    const eigen = jaAnteilLager(w, w.player!.partei.kurz, "m_internetsperren", 1);
    expect(fremd).toBeLessThan(1);
    expect(fremd).toBeGreaterThanOrEqual(1 - LINIE.abweichler);
    expect(eigen).toBeLessThan(1);
    expect(eigen).toBeGreaterThan(fremd);
    expect(jaAnteilLager(w, "MHP", "m_polizei", 1)).toBe(1);
  });

  test("Partnerloyalität: Die Partei misst eine Änderung an ihrer Linie", () => {
    const w = welt("autoritaer", "MHP");
    const partner = figur(w, "partner")!;
    expect(partner.partei).toBe("MHP");
    const vorher = partner.loyalitaet;
    reagierePartner(w, "m_polizei", 1, 40);
    expect(partner.loyalitaet).toBeGreaterThan(vorher);
    const mitte = partner.loyalitaet;
    reagierePartner(w, "m_versammlungsfreiheit", 1, 40);
    expect(partner.loyalitaet).toBeLessThan(mitte);
  });

  test("Spielstände ohne Achsen: Die Linie kommt aus dem Kürzel, sonst die Mitte", () => {
    const w = createWorld(turkey2026, 1);
    startAfterElection(w, schnellProfil("Alt", () => 2));
    delete (w.player as { achsen?: unknown }).achsen;
    expect(w.player!.partei.kurz).toBe("PW");
    expect(spielerAchsen(w)).toEqual(preset("werte").achsen);
    expect(parteiAchsen("gibt-es-nicht")).toBeUndefined();
  });
});

describe("Vorschau im Konfigurator", () => {
  test("zeigt Gruppen, Parteien, billige und teure Maßnahmen, die zur Linie passen", () => {
    const v = vorschau(preset("libertaer").achsen, "LBT");
    expect(v.gruppen[0]!.naehe).toBeGreaterThan(0);
    expect(v.gruppen[v.gruppen.length - 1]!.naehe).toBeLessThan(0);
    expect(v.parteien[0]!.abstand).toBeLessThan(v.parteien[v.parteien.length - 1]!.abstand);
    expect(v.billig.length).toBe(5);
    for (const m of v.billig) expect(m.faktor).toBeLessThan(1);
    for (const m of v.teuer) expect(m.faktor).toBeGreaterThan(1);
    // Privatisieren (↑) ist für die libertäre Linie billig, für die sozialistische ist es das Zurücknehmen (↓)
    expect(v.billig.find((m) => m.id === "m_privatisierung")?.richtung).toBe(1);
    expect(vorschau(preset("sozialistisch").achsen, "SL").billig.find((m) => m.id === "m_privatisierung")?.richtung).toBe(-1);
    expect(vorschau(preset("sozialistisch").achsen, "SL").teuer.find((m) => m.id === "m_privatisierung")?.richtung).not.toBe(-1);
  });
});

describe("Stammwählerschaft und Kurswechsel", () => {
  test("Linientreue wird honoriert, der Bruch bestraft, derselbe Betrag in jede Richtung", () => {
    const aut = welt("autoritaer", "MHP");
    const z0 = aut.spiel!.kalibrierung;
    reagiereStamm(aut, "m_polizei", 1, 20);
    expect(aut.spiel!.kalibrierung).toBeGreaterThan(z0);
    const z1 = aut.spiel!.kalibrierung;
    reagiereStamm(aut, "m_versammlungsfreiheit", 1, 20);
    expect(aut.spiel!.kalibrierung).toBeLessThan(z1);
    // Spiegel: Die libertäre Linie bekommt für das Gegenstück dasselbe Plus
    const lib = welt("libertaer", "YENİ");
    const l0 = lib.spiel!.kalibrierung;
    reagiereStamm(lib, "m_versammlungsfreiheit", 1, 20);
    expect(lib.spiel!.kalibrierung - l0).toBeGreaterThan(0);
    // Der Saldo bleibt im Band
    for (let i = 0; i < 40; i++) reagiereStamm(aut, "m_polizei", 1, 40);
    expect(aut.player!.stammSaldo!).toBeLessThanOrEqual(LINIE.stammGrenze);
  });

  test("Kurswechsel kostet Kapital und Glaubwürdigkeit, ändert die Linie und ihre Preise", () => {
    const w = welt("liberal", "YENİ");
    w.spiel!.kapital = 60;
    const neu = preset("autoritaer").achsen;
    const kosten = kurswechselKosten(w, neu);
    expect(kosten).toBeGreaterThan(30);
    const vorher = pruefeVorhaben(w, "m_internetsperren", 70).gesetz.pk;
    const k0 = w.spiel!.kapital;
    const kal0 = w.spiel!.kalibrierung;
    const r = kurswechsel(w, neu);
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(k0 - kosten);
    expect(w.spiel!.kalibrierung).toBeLessThan(kal0);
    expect(spielerAchsen(w)).toEqual(neu);
    expect(pruefeVorhaben(w, "m_internetsperren", 70).gesetz.pk).toBeLessThan(vorher);
    // Wer kein Kapital hat, kann den Kurs nicht wechseln; eine gleiche Linie ist kein Wechsel
    w.spiel!.kapital = -19;
    expect(kurswechsel(w, preset("sozialistisch").achsen).ok).toBe(false);
    expect(kurswechsel(w, neu).ok).toBe(false);
  });

  test("Hinweis in der Prüfung: mit der Linie billiger, gegen die Linie teurer", () => {
    const lib = welt("libertaer", "YENİ");
    expect(pruefeVorhaben(lib, "m_privatisierung", 70).hinweise.some((h) => /Linie.*günstiger/.test(h))).toBe(true);
    expect(pruefeVorhaben(lib, "m_internetsperren", 70).hinweise.some((h) => /gegen die Linie.*teurer/.test(h))).toBe(true);
  });
});

describe("Ausgleich des politischen Preises (Stammwähler-Bonus)", () => {
  test("beliebte Maßnahmen bringen weniger Zusatz als unbeliebte, in beiden Richtungen gleich gerechnet", () => {
    // Sozialhilfe erhöhen ist beliebt (positiver Einfluss auf die Zustimmung), Zuzahlungen erhöhen ist es nicht
    expect(zustimmungsEinfluss("m_sozialhilfe")).toBeGreaterThan(0);
    expect(zustimmungsEinfluss("m_zuzahlungen")).toBeLessThan(0);
    expect(preisFaktor("m_sozialhilfe", 1)).toBeLessThan(1);
    expect(preisFaktor("m_zuzahlungen", 1)).toBeGreaterThan(1);
    // Senken kehrt das Vorzeichen um: Sozialhilfe senken ist unbeliebt, Zuzahlungen senken beliebt
    expect(preisFaktor("m_sozialhilfe", -1)).toBeGreaterThan(1);
    expect(preisFaktor("m_zuzahlungen", -1)).toBeLessThan(1);
  });

  test("der Faktor bleibt in seinen Grenzen, für jede Maßnahme und Richtung", () => {
    for (const id of Object.keys(MASSNAHME_VEKTOR))
      for (const r of [1, -1]) {
        const f = preisFaktor(id, r);
        expect(Number.isFinite(f)).toBe(true);
        expect(f).toBeGreaterThanOrEqual(LINIE.preisUnten);
        expect(f).toBeLessThanOrEqual(LINIE.preisOben);
      }
  });
});
