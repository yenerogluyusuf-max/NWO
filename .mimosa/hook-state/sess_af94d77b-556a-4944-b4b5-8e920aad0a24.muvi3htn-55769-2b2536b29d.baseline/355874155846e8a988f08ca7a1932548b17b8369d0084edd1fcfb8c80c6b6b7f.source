// Der EU-Beitrittsprozess als mehrjähriger Vorgang (AUS-2): Kriterien-Messung, Screening-Dauer,
// Kapitel-Eröffnung und -Abschluss, Alibi-Erkennung, Zypern-Blockade, nationales Veto,
// Zollunion-Update mit echten Effekten, Fortschrittsbericht, Visa-Track, Migration und Determinismus.

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { Rng } from "../src/sim/rng";
import { NET } from "../src/sim/modell";
import { PROVINCES, nationalAverage } from "../src/sim/netz";
import { entscheide } from "../src/sim/ereignisse";
import { schliesse } from "../src/sim/abkommen";
import { weltZustand, vertrauenZu } from "../src/sim/laender";
import {
  EU_REGELN,
  KAPITEL,
  KAPITEL_NACH_ID,
  VISA_KRITERIEN,
  annaeherungSicht,
  erfuelltMitSubstanz,
  euKapitalAbzug,
  euKurz,
  euMonat,
  euZustand,
  kriteriumStand,
  kuendigeReformAn,
  naechsterSchritt,
  noteFuer,
  vetoBeantworten,
  visaStand,
  zollunionAnnehmen,
  zypernBewegung,
} from "../src/sim/eu";
import type { World } from "../src/sim/types";

function welt(seed = 5): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  return w;
}

/** Setzt einen Politiknetz-Knoten in allen Provinzen auf einen festen Wert. */
function setze(w: World, id: string, wert: number): void {
  const i = NET.index.get(id)!;
  for (let p = 0; p < PROVINCES; p++) w.net.values[i * PROVINCES + p] = wert;
}

/** Bringt den Vorgang in die Verhandlungsphase, ohne die Zeit laufen zu lassen. */
function inVerhandlung(w: World): void {
  const z = euZustand(w);
  setze(w, "m_eu_annaeherung", 60);
  const r = kuendigeReformAn(w);
  expect(r.ok).toBe(true);
  z.phase = "verhandlung";
  z.screeningBis = w.day;
}

/** Räumt die Veto-Länder aus dem Weg: beide Konflikte unter den Schwelle. */
function ohneVeto(w: World): void {
  weltZustand(w).CYP!.konflikt = 40;
  weltZustand(w).GRC!.konflikt = 50;
}

/** Lässt kein Kapitel erfüllt sein: alle Kriterien-Knoten auf deutlich unerfüllte Werte. */
function keinKapitelErfuellt(w: World): void {
  for (const def of KAPITEL) {
    for (const k of [...def.oeffnung, ...def.schluss]) {
      if (k.knoten) setze(w, k.knoten, k.art === "max" ? 100 : 0);
    }
  }
}

// ---------------------------------------------------------------------------

describe("Kriterien-Messung", () => {
  test("min/max-Kriterien messen den Landesdurchschnitt und den Abstand zur Marke", () => {
    const w = welt();
    setze(w, "justiz_unabhaengigkeit", 55);
    setze(w, "korruption", 45);
    const justiz = kriteriumStand(w, KAPITEL_NACH_ID.get("k23")!.oeffnung[0]!);
    expect(justiz.erfuellt).toBe(true);
    expect(justiz.abstand).toBeCloseTo(5, 5);
    const kor = kriteriumStand(w, KAPITEL_NACH_ID.get("k24")!.oeffnung[0]!); // korruption max 50
    expect(kor.erfuellt).toBe(true);
    expect(kor.abstand).toBeCloseTo(5, 5);
    setze(w, "korruption", 52);
    expect(kriteriumStand(w, KAPITEL_NACH_ID.get("k24")!.oeffnung[0]!).erfuellt).toBe(false);
  });

  test("Vertrags-Kriterium: nur ein laufender Vertrag mit der Klausel zählt (Rückübernahme)", () => {
    const w = welt();
    const rueck = VISA_KRITERIEN.find((k) => k.id === "ruecknahme")!;
    expect(kriteriumStand(w, rueck).erfuellt).toBe(false);
    schliesse(w, { land: "EU", gibt: ["migration_zusage"], will: [], jahre: 5 });
    expect(kriteriumStand(w, rueck).erfuellt).toBe(true);
  });

  test("Alibi-Logik: erfüllt ohne Puffer über der Marke zählt nicht als Substanz", () => {
    const w = welt();
    const k27 = KAPITEL_NACH_ID.get("k27")!; // Öffnung: m_umweltauflagen ≥ 40
    setze(w, "m_umweltauflagen", 41); // über der Marke, aber innerhalb der Alibi-Marge
    let s = erfuelltMitSubstanz([kriteriumStand(w, k27.oeffnung[0]!)]);
    expect(s.erfuellt).toBe(false);
    expect(s.alibi).toBe(true);
    setze(w, "m_umweltauflagen", 40 + EU_REGELN.alibiMarge);
    s = erfuelltMitSubstanz([kriteriumStand(w, k27.oeffnung[0]!)]);
    expect(s.erfuellt).toBe(true);
    expect(s.alibi).toBe(false);
  });

  test("Zehn von 35 Kapiteln: komprimierte Menge mit den Kernkapiteln 23/24", () => {
    expect(KAPITEL).toHaveLength(10);
    expect(KAPITEL.map((k) => k.nummer)).toContain(23);
    expect(KAPITEL.map((k) => k.nummer)).toContain(24);
    expect(KAPITEL.filter((k) => k.zypernBlockiert).map((k) => k.nummer)).toEqual([23, 24]);
    for (const k of KAPITEL) {
      expect(k.oeffnung.length).toBeGreaterThanOrEqual(1);
      expect(k.schluss.length).toBeGreaterThanOrEqual(1);
      expect(k.jahre).toBeGreaterThanOrEqual(2);
    }
  });
});

// ---------------------------------------------------------------------------

describe("Vorgangs-Zustände", () => {
  test("Ankündigung braucht Substanz: ohne Annäherung über 55 bleibt alles eingefroren", () => {
    const w = welt();
    setze(w, "m_eu_annaeherung", 40);
    const sicht = annaeherungSicht(w);
    expect(sicht.moeglich).toBe(false);
    expect(sicht.grund).toContain("Substanz");
    const r = kuendigeReformAn(w);
    expect(r.ok).toBe(false);
    expect(euZustand(w).phase).toBe("eingefroren");
  });

  test("Ankündigung kostet Kapital, startet das Screening und wärmt die Beziehung", () => {
    const w = welt();
    setze(w, "m_eu_annaeherung", 58);
    const kapital = w.spiel!.kapital;
    const vertrauen = vertrauenZu(w, "EU");
    const r = kuendigeReformAn(w);
    expect(r.ok).toBe(true);
    const z = euZustand(w);
    expect(z.phase).toBe("screening");
    expect(z.screeningBis).toBe(w.day + EU_REGELN.screeningTage);
    expect(w.spiel!.kapital).toBeCloseTo(kapital - EU_REGELN.pkAnkuendigung, 5);
    expect(vertrauenZu(w, "EU")).toBeGreaterThan(vertrauen);
  });

  test("Screening-Dauer: erst nach zwölf Monaten beginnen die Kapitel-Verhandlungen", () => {
    const w = welt(7);
    setze(w, "m_eu_annaeherung", 58);
    expect(kuendigeReformAn(w).ok).toBe(true);
    advance(w, 300);
    expect(euZustand(w).phase).toBe("screening");
    advance(w, 100); // über die 365 Tage hinaus, in den nächsten Monatsersten
    expect(euZustand(w).phase).toBe("verhandlung");
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("eu-screening-"))).toBe(true);
  });

  test("Ein Kapitel öffnet mit erfüllten Öffnungskriterien (Substanz), höchstens zwei parallel", () => {
    const w = welt();
    inVerhandlung(w);
    ohneVeto(w);
    keinKapitelErfuellt(w);
    const z = euZustand(w);
    // Kapitel 27 (m_umweltauflagen ≥ 40) und 15 (energieversorgung ≥ 50) mit Puffer erfüllen
    setze(w, "m_umweltauflagen", 48);
    setze(w, "energieversorgung", 56);
    euMonat(w, new Rng(1));
    expect(z.kapitel.k27!.status).toBe("offen");
    expect(z.kapitel.k15!.status).toBe("offen");
    // Zwei parallel: ein drittes erfülltes Kapitel muss warten
    setze(w, "vertrauen_maerkte", 52);
    setze(w, "rechtssicherheit", 50);
    euMonat(w, new Rng(2));
    expect(z.kapitel.k17!.status).toBe("bereit");
    expect(z.kapitel.k17!.status).not.toBe("offen");
  });

  test("Kapitel-Abschluss braucht Verhandlungszeit UND erfüllte Schlusskriterien", () => {
    const w = welt();
    inVerhandlung(w);
    ohneVeto(w);
    keinKapitelErfuellt(w);
    const z = euZustand(w);
    setze(w, "m_umweltauflagen", 60);
    setze(w, "luftqualitaet", 50);
    euMonat(w, new Rng(1));
    expect(z.kapitel.k27!.status).toBe("offen");
    // Kriterien erfüllt, aber die zwei Jahre sind nicht um
    euMonat(w, new Rng(2));
    expect(z.kapitel.k27!.status).toBe("offen");
    // Zeit vorspulen: zwei Jahre Verhandlung vorbei
    z.kapitel.k27!.geoeffnet = w.day - KAPITEL_NACH_ID.get("k27")!.jahre * 365;
    euMonat(w, new Rng(3));
    expect(z.kapitel.k27!.status).toBe("abgeschlossen");
    expect(euKapitalAbzug(w)).toBe(0); // kein offenes Kapitel mehr verhandelt
  });

  test("Der Innenpreis: verhandelte Kapitel kosten laufend Kapital (REC-Logik)", () => {
    const w = welt();
    inVerhandlung(w);
    ohneVeto(w);
    keinKapitelErfuellt(w);
    setze(w, "m_umweltauflagen", 48);
    euMonat(w, new Rng(1));
    expect(euZustand(w).kapitel.k27!.status).toBe("offen");
    expect(euKapitalAbzug(w)).toBeCloseTo(EU_REGELN.kapitalJeKapitel, 5);
  });
});

// ---------------------------------------------------------------------------

describe("Blocker", () => {
  test("Zypern-Kopplung: ohne Bewegung bleiben die Kapitel 23 und 24 blockiert", () => {
    const w = welt();
    inVerhandlung(w);
    keinKapitelErfuellt(w);
    // Kriterien von Kapitel 23 mit Substanz erfüllen, Zypern bleibt heiß (Start: Konflikt 72)
    setze(w, "justiz_unabhaengigkeit", 56);
    setze(w, "urteilsbefolgung", 54);
    setze(w, "pressefreiheit", 46);
    expect(zypernBewegung(w).bewegt).toBe(false);
    euMonat(w, new Rng(1));
    expect(euZustand(w).kapitel.k23!.status).toBe("bereit");
    expect(naechsterSchritt(w, KAPITEL_NACH_ID.get("k23")!, euZustand(w))).toContain("Zypern");
    // Zypern entschärfen → der Weg ist frei (Konflikt unter 50, auch unter der Veto-Schwelle)
    weltZustand(w).CYP!.konflikt = 45;
    expect(zypernBewegung(w).bewegt).toBe(true);
    euMonat(w, new Rng(2));
    expect(euZustand(w).kapitel.k23!.status).toBe("offen");
  });

  test("Zypern-Bewegung durch das Ankara-Protokoll (Vertrag mit Hafen-Öffnung)", () => {
    const w = welt();
    schliesse(w, { land: "CYP", gibt: ["hafen_oeffnung"], will: [], jahre: 5 });
    expect(zypernBewegung(w).bewegt).toBe(true);
  });

  test("Nationales Veto: ein Mitglied blockiert die Eröffnung, Auto-Stopp A mit Entscheidung", () => {
    const w = welt();
    inVerhandlung(w);
    keinKapitelErfuellt(w);
    weltZustand(w).CYP!.konflikt = 75; // über der Veto-Schwelle von 60
    setze(w, "korruption", 42);
    setze(w, "m_antikorruption", 46);
    euMonat(w, new Rng(1));
    const z = euZustand(w);
    expect(z.kapitel.k5!.status).toBe("bereit");
    const ev = w.spiel!.ereignisse.find((e) => e.vorlage === "eu_veto");
    expect(ev).toBeDefined();
    expect(String(ev!.daten?.land)).toBe("CYP");
    expect(String(ev!.daten?.kapitel)).toBe("k5");
    // Abwarten: ein Jahr blockiert, danach Ruhe vor neuen Vetos
    const r = entscheide(w, ev!.id, "abwarten", new Rng(2));
    expect(r.ok).toBe(true);
    expect(z.kapitel.k5!.gesperrtBis).toBe(w.day + EU_REGELN.vetoSperreTage);
    euMonat(w, new Rng(3));
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "eu_veto")).toBe(false);
    expect(z.kapitel.k5!.status).toBe("bereit");
  });

  test("Zugeständnis hebt das Veto auf und öffnet das Kapitel — mit Innenpreis", () => {
    const w = welt();
    inVerhandlung(w);
    keinKapitelErfuellt(w);
    weltZustand(w).CYP!.konflikt = 75;
    setze(w, "korruption", 42);
    setze(w, "m_antikorruption", 46);
    const nationalisten = nationalAverage(NET, w.net, "nationalisten");
    euMonat(w, new Rng(1));
    const ev = w.spiel!.ereignisse.find((e) => e.vorlage === "eu_veto")!;
    const r = entscheide(w, ev.id, "zugestaendnis", new Rng(2));
    expect(r.ok).toBe(true);
    const z = euZustand(w);
    expect(z.kapitel.k5!.status).toBe("offen");
    expect(weltZustand(w).CYP!.konflikt).toBeLessThan(75);
    expect(nationalAverage(NET, w.net, "nationalisten")).toBeLessThan(nationalisten); // Zypern-Zugeständnis: Nationalisten −
  });

  test("Alibi-Erkennung: knapp erfüllte Kriterien öffnen nicht und landen im Bericht", () => {
    const w = welt();
    inVerhandlung(w);
    ohneVeto(w);
    keinKapitelErfuellt(w);
    const z = euZustand(w);
    setze(w, "m_umweltauflagen", 41); // erfüllt (≥ 40), aber ohne Puffer von 3
    euMonat(w, new Rng(1));
    expect(z.kapitel.k27!.status).toBe("bereit");
    expect(z.kapitel.k27!.status).not.toBe("offen");
    // Der November-Bericht benennt die Alibi-Reform
    w.date = `${Number(w.date.slice(0, 4))}-11-01`;
    euMonat(w, new Rng(2));
    const bericht = z.berichte[z.berichte.length - 1]!;
    expect(bericht.alibi).toContain("k27");
    expect(bericht.zeilen.join(" ")).toContain("Alibi");
    expect(naechsterSchritt(w, KAPITEL_NACH_ID.get("k27")!, z)).toContain("knapp");
  });
});

// ---------------------------------------------------------------------------

describe("Zollunion-Update", () => {
  /** Schließt drei Kapitel direkt ab und bringt die Voraussetzungen. */
  function dreiKapitelGeschlossen(w: World): void {
    inVerhandlung(w);
    ohneVeto(w);
    const z = euZustand(w);
    for (const id of ["k15", "k27", "k12"]) z.kapitel[id] = { status: "abgeschlossen", geschlossen: w.day };
  }

  test("Mit drei geschlossenen Kapiteln bietet Brüssel das Mandat an (Auto-Stopp A)", () => {
    const w = welt();
    dreiKapitelGeschlossen(w);
    euMonat(w, new Rng(1));
    const ev = w.spiel!.ereignisse.find((e) => e.vorlage === "eu_zollunion");
    expect(ev).toBeDefined();
  });

  test("Annehmen: Handel und Industrie gewinnen, die Landwirtschaft verliert Schutz, CDS sinkt", () => {
    const w = welt();
    dreiKapitelGeschlossen(w);
    const exportVor = nationalAverage(NET, w.net, "export");
    const landwirteVor = nationalAverage(NET, w.net, "landwirte");
    const industrieVor = nationalAverage(NET, w.net, "industrie");
    const handelVor = weltZustand(w).EU!.handel;
    const cdsVor = w.economy.riskPremium;
    const text = zollunionAnnehmen(w);
    expect(text).toContain("modernisiert");
    expect(euZustand(w).zollunion).toBe("modernisiert");
    expect(nationalAverage(NET, w.net, "export")).toBeGreaterThan(exportVor);
    expect(nationalAverage(NET, w.net, "industrie")).toBeGreaterThan(industrieVor);
    expect(nationalAverage(NET, w.net, "landwirte")).toBeLessThan(landwirteVor);
    expect(weltZustand(w).EU!.handel).toBeGreaterThan(handelVor);
    expect(w.economy.riskPremium).toBeLessThan(cdsVor);
  });

  test("Ablehnen (Standardfolge): das Angebot vertagt sich um zwei Jahre", () => {
    const w = welt();
    dreiKapitelGeschlossen(w);
    euMonat(w, new Rng(1));
    const ev = w.spiel!.ereignisse.find((e) => e.vorlage === "eu_zollunion")!;
    const r = entscheide(w, ev.id, "ablehnen", new Rng(2));
    expect(r.ok).toBe(true);
    const z = euZustand(w);
    expect(z.zollunion).toBe("unveraendert");
    expect(z.zollunionSperreBis).toBe(w.day + EU_REGELN.zollunionSperreTage);
    euMonat(w, new Rng(3));
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "eu_zollunion")).toBe(false);
  });
});

// ---------------------------------------------------------------------------

describe("Fortschrittsbericht und Visa-Track", () => {
  test("Der November-Bericht benotet jedes Kapitel und nennt die nächsten Schritte", () => {
    const w = welt();
    inVerhandlung(w);
    ohneVeto(w);
    keinKapitelErfuellt(w);
    const z = euZustand(w);
    z.kapitel.k15 = { status: "abgeschlossen", geschlossen: w.day };
    w.date = `${Number(w.date.slice(0, 4))}-11-01`;
    euMonat(w, new Rng(1));
    const bericht = z.berichte[z.berichte.length - 1]!;
    expect(Object.keys(bericht.noten)).toHaveLength(KAPITEL.length);
    expect(bericht.noten.k15).toBe("erfüllt");
    expect(bericht.noten.k23).toBe("früh");
    expect(bericht.zeilen.length).toBeGreaterThan(KAPITEL.length);
    expect(bericht.zeilen.join(" ")).toContain("Kapitel 23");
    // Auto-Stopp B: Hinweis an die Oberfläche
    expect(w.spiel!.hinweise.some((h) => h.id === `eu-bericht-${bericht.jahr}`)).toBe(true);
    expect(w.spiel!.chronik.some((c) => c.titel.includes("Fortschrittsbericht"))).toBe(true);
  });

  test("Noten folgen dem Fortschritt: früh, mittel, fortgeschritten, erfüllt", () => {
    const w = welt();
    inVerhandlung(w);
    ohneVeto(w);
    keinKapitelErfuellt(w);
    const z = euZustand(w);
    expect(noteFuer(w, KAPITEL_NACH_ID.get("k27")!, z)).toBe("früh");
    setze(w, "m_umweltauflagen", 60);
    setze(w, "luftqualitaet", 50);
    euMonat(w, new Rng(1)); // öffnet k27; Schlusskriterien sind erfüllt
    expect(noteFuer(w, KAPITEL_NACH_ID.get("k27")!, z)).toBe("fortgeschritten");
    z.kapitel.k27!.status = "abgeschlossen";
    expect(noteFuer(w, KAPITEL_NACH_ID.get("k27")!, z)).toBe("erfüllt");
  });

  test("Visaliberalisierung: sechs Kriterien, dann wird gewährt — mit spürbarem Nutzen", () => {
    const w = welt();
    expect(visaStand(w).gewaehrt).toBe(false);
    setze(w, "m_verwaltungsdigital", 55);
    setze(w, "m_grenzschutz", 62);
    setze(w, "justiz_unabhaengigkeit", 47);
    setze(w, "rechtssicherheit", 50);
    setze(w, "gefluechtete", 45);
    expect(visaStand(w).erfuellt).toBe(VISA_KRITERIEN.length - 1); // Rücknahme fehlt noch
    schliesse(w, { land: "EU", gibt: ["migration_zusage"], will: [], jahre: 5 });
    const saekulare = nationalAverage(NET, w.net, "staedtische_saekulare");
    const junge = nationalAverage(NET, w.net, "junge");
    euMonat(w, new Rng(1));
    expect(visaStand(w).gewaehrt).toBe(true);
    expect(nationalAverage(NET, w.net, "staedtische_saekulare")).toBeGreaterThan(saekulare);
    expect(nationalAverage(NET, w.net, "junge")).toBeGreaterThan(junge);
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("eu-visa-"))).toBe(true);
    // Einmalig: ein weiterer Monat ändert nichts mehr
    const stand = nationalAverage(NET, w.net, "staedtische_saekulare");
    euMonat(w, new Rng(2));
    expect(nationalAverage(NET, w.net, "staedtische_saekulare")).toBeCloseTo(stand, 5);
  });

  test("Endgame ehrlich: alle Kapitel geschlossen bringt die Perspektive, nicht den Beitritt", () => {
    const w = welt();
    inVerhandlung(w);
    ohneVeto(w);
    keinKapitelErfuellt(w);
    const z = euZustand(w);
    // Neun Kapitel sind geschlossen, das zehnte (k27) steht kurz vor dem Abschluss
    for (const k of KAPITEL.filter((x) => x.id !== "k27")) z.kapitel[k.id] = { status: "abgeschlossen", geschlossen: w.day };
    z.kapitel.k27 = { status: "offen", geoeffnet: w.day - KAPITEL_NACH_ID.get("k27")!.jahre * 365 };
    setze(w, "m_umweltauflagen", 60);
    setze(w, "luftqualitaet", 50);
    euMonat(w, new Rng(1));
    expect(z.kapitel.k27!.status).toBe("abgeschlossen");
    expect(z.phase).toBe("perspektive");
    const hinweis = w.spiel!.hinweise.find((h) => h.id.startsWith("eu-perspektive-"));
    expect(hinweis).toBeDefined();
    expect(hinweis!.text.join(" ")).toContain("Jahren"); // ehrlich: der Beitritt bleibt ein Weg von Jahren
    expect(euKurz(w)).toContain(`${KAPITEL.length}/${KAPITEL.length}`);
  });
});

// ---------------------------------------------------------------------------

describe("Migration und Determinismus", () => {
  test("Ein alter Spielstand ohne EU-Feld lädt: eingefroren, der Tick legt den Zustand an", () => {
    const w = welt();
    const roh = JSON.parse(save(w)) as World;
    delete roh.spiel!.eu;
    const geladen = load(JSON.stringify(roh));
    expect(geladen.spiel!.eu).toBeUndefined();
    advance(geladen, 40); // über einen Monatsersten hinweg
    expect(geladen.spiel!.eu).toBeDefined();
    expect(euZustand(geladen).phase).toBe("eingefroren");
    expect(Object.keys(euZustand(geladen).kapitel)).toHaveLength(KAPITEL.length);
  });

  test("Gleicher Seed, gleiche Eingriffe, gleicher EU-Zustand", () => {
    const lauf = () => {
      const w = welt(11);
      setze(w, "m_eu_annaeherung", 58);
      kuendigeReformAn(w);
      setze(w, "m_umweltauflagen", 50);
      setze(w, "energieversorgung", 56);
      advance(w, 430); // über das Screening hinaus in die Verhandlungsphase
      return JSON.stringify(w.spiel!.eu);
    };
    expect(lauf()).toBe(lauf());
  });

  test("Speichern und Laden mitten im Vorgang ändert nichts am Stand", () => {
    const w = welt(13);
    inVerhandlung(w);
    ohneVeto(w);
    setze(w, "m_umweltauflagen", 50);
    euMonat(w, new Rng(1));
    const vorher = JSON.stringify(w.spiel!.eu);
    const geladen = load(save(w));
    expect(JSON.stringify(geladen.spiel!.eu)).toBe(vorher);
  });
});
