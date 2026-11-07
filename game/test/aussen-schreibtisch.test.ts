// Welle E1: Die Außenpolitik meldet sich auf dem Schreibtisch, und die EU startet mit dem echten Stand.
// Geprüft wird: der Startstand (vier Spielkapitel offen, Stillstand, Sperren durch Zypern und den Rat 2006) und seine Migration, der sichtbare
// Preis des Reformpakets mit der Reformzusage als zweitem Weg, die Forderung der EU nennt, was sie freischaltet, die Gipfel, die Einladung nach
// Istanbul und der Fortschrittsbericht kommen, wenn die Lage es verlangt, und nicht sonst, ihre Antworten buchen, was sie zeigen, gleicher Samen
// ergibt denselben Verlauf, die Kante Ansehen → Vertrauen wirkt schwach, und der Spielstand des Inhabers lädt und bringt Libyen auf den Tisch.
import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { ansicht, antworten, entscheide, oeffne, vorlage } from "../src/sim/ereignisse";
import { schliesse } from "../src/sim/abkommen";
import { landAendern, vertrauenZu, weltZustand } from "../src/sim/laender";
import { DIPLOMATIE, einladungsKandidat, offenerEuBericht } from "../src/sim/ereignisse-diplomatie";
import { EU_REGELN, KAPITEL, START_OFFEN, annaeherungSicht, euFreischaltung, euKapitalAbzug, euMonat, euZustand, kapitelSicht, kuendigeReformAn } from "../src/sim/eu";
import { VERMITTLUNG, konfliktSicht, konfliktZustand, vermittlungMonat } from "../src/sim/vermittlung";
import { KONFLIKT_NACH_ID } from "../src/data/konflikte";
import { zielZustimmung } from "../src/sim/spiel";
import { wirke } from "../src/sim/wirkung";
import { NET } from "../src/sim/modell";
import { EDGES } from "../src/data/politiknetz";
import { PROVINCES, nationalAverage } from "../src/sim/netz";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

function welt(seed = 4): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 60;
  return w;
}

const knoten = (w: World, id: string) => nationalAverage(NET, w.net, id);
function setze(w: World, id: string, wert: number): void {
  const i = NET.index.get(id)!;
  for (let p = 0; p < PROVINCES; p++) w.net.values[i * PROVINCES + p] = wert;
}
/** Springt an den Monatsersten eines Monats im laufenden Jahr (nur das Datum; für die Kalenderprüfung der Gipfel). */
const imMonat = (w: World, monat: number) => {
  w.date = `${w.date.slice(0, 4)}-${String(monat).padStart(2, "0")}-01`;
};

describe("EU: echter Startstand (ENTSCHEIDUNGEN AA 2)", () => {
  test("neue Partie: 12, 17, 27 und 33 offen mit echtem Datum, Stillstand, Sperren durch Zypern und den Rat 2006", () => {
    const w = welt();
    const z = euZustand(w);
    expect(z.phase).toBe("eingefroren");
    for (const [id, seit] of Object.entries(START_OFFEN)) {
      expect(z.kapitel[id]!.status).toBe("offen");
      expect(z.kapitel[id]!.seit).toBe(seit);
      expect(z.kapitel[id]!.geoeffnet!).toBeLessThan(0);
    }
    expect(KAPITEL.filter((k) => z.kapitel[k.id]!.status === "offen")).toHaveLength(4);
    // Im Stillstand verhandelt niemand: die alten Kapitel kosten kein laufendes Kapital
    expect(euKapitalAbzug(w)).toBe(0);
    const ks = kapitelSicht(w);
    expect(ks.find((s) => s.def.id === "k11")!.blockiertRat).toBe(true);
    expect(ks.filter((s) => s.blockiertZypern).map((s) => s.def.nummer).sort((a, b) => a - b)).toEqual([15, 23, 24, 31]);
    // Der Ratsbeschluss 2006 fällt mit dem Zusatzprotokoll (Hafen-Öffnung für Zypern)
    schliesse(w, { land: "CYP", gibt: ["hafen_oeffnung"], will: [], jahre: 5 });
    expect(kapitelSicht(w).find((s) => s.def.id === "k11")!.blockiertRat).toBe(false);
  });

  test("im Stillstand bewegt sich kein Kapitel, auch wenn seine Schlusskriterien erfüllt sind", () => {
    const w = welt();
    setze(w, "m_umweltauflagen", 70);
    setze(w, "luftqualitaet", 70);
    euMonat(w, new Rng(1));
    expect(euZustand(w).kapitel.k27!.status).toBe("offen");
  });

  test("nach dem Reformpaket schließt ein seit Jahren offenes Kapitel, sobald die Schlusskriterien mit Substanz stehen; die alten belegen keinen Verhandlungsplatz", () => {
    const w = welt();
    setze(w, "m_eu_annaeherung", 60);
    expect(kuendigeReformAn(w).ok).toBe(true);
    const z = euZustand(w);
    z.phase = "verhandlung";
    weltZustand(w).CYP!.konflikt = 40;
    weltZustand(w).GRC!.konflikt = 50;
    setze(w, "m_umweltauflagen", 70);
    setze(w, "luftqualitaet", 70);
    euMonat(w, new Rng(1));
    expect(z.kapitel.k27!.status).toBe("abgeschlossen");
    // Drei alte Kapitel laufen weiter; jedes offene Kapitel kostet jetzt laufend Kapital
    const offen = KAPITEL.filter((k) => z.kapitel[k.id]!.status === "offen");
    expect(offen.filter((k) => z.kapitel[k.id]!.seit !== undefined)).toHaveLength(3);
    expect(euKapitalAbzug(w)).toBeCloseTo(offen.length * EU_REGELN.kapitalJeKapitel, 6);
    // Die alten belegen keinen der Verhandlungsplätze: Neben ihnen öffnen bis zu zwei neue
    const neuOffen = offen.filter((k) => z.kapitel[k.id]!.seit === undefined).length;
    expect(neuOffen).toBeGreaterThan(0);
    expect(neuOffen).toBeLessThanOrEqual(EU_REGELN.parallelMax);
  });

  test("ein alter Spielstand übernimmt den Startstand nur für Kapitel, die dort noch zu sind", () => {
    const w = welt();
    euZustand(w);
    const roh = JSON.parse(save(w)) as World;
    const eu = roh.spiel!.eu!;
    delete eu.startstand;
    for (const k of KAPITEL) eu.kapitel[k.id] = { status: "zu" };
    eu.kapitel.k27 = { status: "abgeschlossen", geschlossen: 100 };
    const g = load(JSON.stringify(roh));
    const z = euZustand(g);
    expect(z.kapitel.k27!.status).toBe("abgeschlossen");
    expect(z.kapitel.k12!.status).toBe("offen");
    expect(z.kapitel.k33!.seit).toBe(START_OFFEN.k33);
    expect(z.startstand).toBe(1);
  });
});

describe("EU: sichtbarer Preis und Reformforderung", () => {
  test("der Preis steht als Zahl da; eine laufende Reformzusage mit der EU ersetzt die Schwelle", () => {
    const w = welt();
    const a = annaeherungSicht(w);
    expect(a.noetig).toBe(EU_REGELN.annaeherungMin);
    expect(a.substanz).toBe(false);
    expect(a.moeglich).toBe(false);
    expect(a.grund).toContain(String(EU_REGELN.annaeherungMin));
    // Die Forderung der EU nennt, was die Zusage freischaltet
    const frei = euFreischaltung(w, "reform_zusage")!;
    expect(frei).toContain("Reformpaket");
    expect(frei).toContain(String(EU_REGELN.annaeherungMin));
    schliesse(w, { land: "EU", gibt: ["reform_zusage"], will: [], jahre: 5 });
    const b = annaeherungSicht(w);
    expect(b.reformzusage).toBe(true);
    expect(b.moeglich).toBe(true);
    expect(kuendigeReformAn(w).ok).toBe(true);
  });

  test("die Forderung der EU zeigt die Freischaltung auf der Karte", () => {
    const w = welt();
    landAendern(w, "EU", { vertrauen: 10 });
    const ev = oeffne(w, "land_fordert", new Rng(3), { provinzen: [], staerke: 1, daten: { land: "EU", anlass: "anliegen", klausel: "reform_zusage", text: "Rechtsstaat" } })!;
    const a = ansicht(w, ev);
    expect(a.optionen.find((o) => o.id === "erfuellen")!.bedingungen?.join(" ") ?? "").toContain("Reformpaket");
    expect(euFreischaltung(w, "migration_zusage")).toContain("Visafreiheit");
    expect(euFreischaltung(w, "zoll")).toBeNull();
  });
});

describe("EU-Fortschrittsbericht als Karte", () => {
  test("kommt nach dem Bericht im November, nicht vorher und nicht nach der Antwort", () => {
    const w = welt();
    expect(vorlage("eu_bericht").chance(w)).toBe(0);
    imMonat(w, 11);
    euMonat(w, new Rng(1));
    expect(offenerEuBericht(w)).not.toBeNull();
    expect(vorlage("eu_bericht").chance(w)).toBeGreaterThan(0);
    const ev = oeffne(w, "eu_bericht", new Rng(2))!;
    const k = load(save(w));
    const eu0 = vertrauenZu(k, "EU");
    const n0 = k.spiel!.zusagen.length;
    expect(entscheide(k, ev.id, "zusagen", new Rng(1)).ok).toBe(true);
    expect(vertrauenZu(k, "EU")).toBeGreaterThan(eu0);
    const zu = k.spiel!.zusagen[n0]!;
    expect(zu.massnahme).toBe("m_eu_annaeherung");
    expect(vorlage("eu_bericht").chance(k)).toBe(0);
    const r = load(save(w));
    const nat0 = knoten(r, "nationalisten");
    entscheide(r, ev.id, "zurueckweisen", new Rng(1));
    expect(knoten(r, "nationalisten")).toBeGreaterThan(nat0);
    expect(vertrauenZu(r, "EU")).toBeLessThan(eu0);
    const s = load(save(w));
    entscheide(s, ev.id, "abwarten", new Rng(1));
    expect(vertrauenZu(s, "EU")).toBeLessThan(eu0);
  });

  test("der Hinweis ohne Antwort entfällt; der Bericht steht als Merkmal „bericht“ in der Chronik", () => {
    const w = welt();
    imMonat(w, 11);
    euMonat(w, new Rng(1));
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("eu-bericht-"))).toBe(false);
    expect(w.spiel!.chronik.at(-1)!.art).toBe("bericht");
  });
});

describe("Gipfel", () => {
  test("jeder Gipfel kommt nur in seinem Monat", () => {
    const w = welt();
    for (const [g, monat] of Object.entries(DIPLOMATIE.monat)) {
      for (let m = 1; m <= 12; m++) {
        imMonat(w, m);
        expect(vorlage(`gipfel_${g}`).chance(w) > 0, `${g} im Monat ${m}`).toBe(m === monat);
      }
    }
  });

  test("NATO: die Zusage legt eine Zusage auf den Verteidigungsetat an und freut Washington; Fernbleiben kostet in Washington", () => {
    const w = welt();
    imMonat(w, 7);
    const ev = oeffne(w, "gipfel_nato", new Rng(1))!;
    const a = load(save(w));
    const usa0 = vertrauenZu(a, "USA");
    const n0 = a.spiel!.zusagen.length;
    expect(entscheide(a, ev.id, "zusage", new Rng(1)).ok).toBe(true);
    expect(vertrauenZu(a, "USA")).toBeGreaterThan(usa0);
    expect(a.spiel!.zusagen[n0]!.massnahme).toBe("m_verteidigung");
    const b = load(save(w));
    const nat0 = knoten(b, "nationalisten");
    entscheide(b, ev.id, "fernbleiben", new Rng(1));
    expect(vertrauenZu(b, "USA")).toBeLessThan(usa0);
    expect(knoten(b, "nationalisten")).toBeGreaterThan(nat0);
    // Fernbleiben ist kostenlos in Kapital, aber nicht ohne Preis; jede Antwort nennt ihre Stelle
    expect(antworten(w, ev).find((o) => o.id === "fernbleiben")!.pk).toBe(0);
    for (const o of antworten(w, ev)) expect(o.stelle, o.id).toBeDefined();
  });

  test("UN: die Anklage trifft das Land mit dem schärfsten Streit; Turkstaaten: der Korridor geht denselben Weg wie die Blockakte", () => {
    const w = welt();
    weltZustand(w).GRC!.konflikt = 95;
    imMonat(w, 9);
    const ev = oeffne(w, "gipfel_un", new Rng(1))!;
    expect(ev.daten!.gegner).toBe("GRC");
    const a = load(save(w));
    const k0 = weltZustand(a).GRC!.konflikt;
    entscheide(a, ev.id, "anklage", new Rng(1));
    expect(weltZustand(a).GRC!.konflikt).toBeGreaterThan(k0);
    imMonat(w, 10);
    const ots = oeffne(w, "gipfel_ots", new Rng(1))!;
    const b = load(save(w));
    const kap0 = b.spiel!.kapital;
    entscheide(b, ots.id, "korridor", new Rng(1));
    const plakette = ansicht(w, ots).optionen.find((o) => o.id === "korridor")!.preis.kapital;
    expect(kap0 - b.spiel!.kapital).toBeCloseTo(plakette, 5);
  });
});

describe("Vermittlung: Istanbul lädt ein", () => {
  test("kommt, wenn ein Konflikt reif ist, und nicht in der frischen Partie", () => {
    const w = welt();
    expect(einladungsKandidat(w)).toBeNull();
    expect(vorlage("vermittlung_einladung").chance(w)).toBe(0);
    const z = konfliktZustand(w, "lby_fraktionen");
    z.reif = 60;
    const k = einladungsKandidat(w);
    expect(k?.id).toBe("lby_fraktionen");
    expect(k!.aussicht).toBeGreaterThanOrEqual(DIPLOMATIE.vermittlung.aussichtAb);
    expect(vorlage("vermittlung_einladung").chance(w)).toBeGreaterThan(0);
  });

  test("Einladen bucht den Preis des Vermittelns, die Runde folgt im Monatsschritt; gleicher Samen, gleicher Ausgang", () => {
    const lauf = () => {
      const w = welt(9);
      konfliktZustand(w, "lby_fraktionen").reif = 60;
      const ev = oeffne(w, "vermittlung_einladung", new Rng(1))!;
      const plakette = ansicht(w, ev).optionen.find((o) => o.id === "einladen")!.preis.kapital;
      const kap0 = w.spiel!.kapital;
      const ans0 = knoten(w, "ansehen");
      expect(entscheide(w, ev.id, "einladen", new Rng(1)).ok).toBe(true);
      expect(kap0 - w.spiel!.kapital).toBeCloseTo(plakette, 5);
      expect(plakette).toBe(KONFLIKT_NACH_ID.lby_fraktionen!.pk);
      expect(knoten(w, "ansehen")).toBeCloseTo(ans0 + VERMITTLUNG.einladungAnsehen, 5);
      const z = konfliktZustand(w, "lby_fraktionen");
      expect(z.einladung).toBe(w.day + VERMITTLUNG.einladungTage);
      expect(konfliktSicht(w, KONFLIKT_NACH_ID.lby_fraktionen!).moeglich).toBe(false);
      w.day = z.einladung!;
      vermittlungMonat(w, new Rng(5));
      expect(z.einladung).toBeUndefined();
      expect(w.spiel!.hinweise.some((h) => h.id.startsWith("vermittlung-runde-lby_fraktionen"))).toBe(true);
      return JSON.stringify([z.einigung ?? null, Math.round(z.reif * 1000)]);
    };
    expect(lauf()).toBe(lauf());
  });

  test("Abwarten: andere laden ein, beide Seiten merken es sich", () => {
    const w = welt();
    konfliktZustand(w, "arm_aze").reif = 60;
    const ev = oeffne(w, "vermittlung_einladung", new Rng(1), { provinzen: [], staerke: 1, daten: { konflikt: "arm_aze", aussicht: 50 } })!;
    const v0 = vertrauenZu(w, "ARM");
    entscheide(w, ev.id, "abwarten", new Rng(1));
    expect(vertrauenZu(w, "ARM")).toBeLessThan(v0);
  });
});

describe("Kante Ansehen → Vertrauen in die Regierung (ENTSCHEIDUNGEN AA 3)", () => {
  test("die Kante ist schwach (0,02) und Ansehen +4 hebt die Zielzustimmung nach 12 Monaten um 0,1 bis 0,3 Punkte", () => {
    const kante = EDGES.find((e) => e.from === "ansehen" && e.to === "vertrauen_regierung");
    expect(kante?.weight).toBe(0.02);
    const basis = welt(42042);
    const mit = welt(42042);
    wirke(mit, "ansehen", 4);
    advance(basis, 360);
    advance(mit, 360);
    const d = zielZustimmung(mit) - zielZustimmung(basis);
    expect(d).toBeGreaterThan(0.1);
    expect(d).toBeLessThan(0.3);
  });
});

describe("Spielstand des Inhabers (2043)", () => {
  const datei = new URL("../../spielstand/staatsraeson_2043-08-03.json", import.meta.url);
  test.skipIf(!existsSync(datei))("lädt mit dem Startstand, Libyen ist reif und kommt binnen drei Monaten auf den Tisch", () => {
    const roh = JSON.parse(readFileSync(datei, "utf8"));
    const w = load(JSON.stringify(roh.welt ?? roh));
    const z = euZustand(w);
    expect(Object.keys(START_OFFEN).every((id) => z.kapitel[id]!.status === "offen")).toBe(true);
    expect(einladungsKandidat(w)?.id).toBe("lby_fraktionen");
    const c0 = w.spiel!.chronik.length;
    let gesehen = false;
    for (let m = 0; m < 3 && !gesehen; m++) {
      advance(w, 30);
      gesehen = w.spiel!.ereignisse.some((e) => e.vorlage === "vermittlung_einladung") || !!w.spiel!.geplant?.some((g) => g.vorlage === "vermittlung_einladung") || w.spiel!.chronik.slice(c0).some((c) => c.vorlage === "vermittlung_einladung" && !c.art);
    }
    expect(gesehen).toBe(true);
  });
});
