// AUS-4: Vermittlung zwischen Drittstaaten — ZOPA, Reifegrad, Spoiler, Garantien, Einigung und Prestige.
// Kalibrierung: Istanbul 2022/Getreideabkommen als Testfall-Konstante (Aussichts-Band 8–85 %).

import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { vertrauenZu, weltZustand } from "../src/sim/laender";
import { GARANTIEN, KONFLIKTE, KONFLIKT_NACH_ID, SPOILER_ARTEN, VORBEREITUNGEN } from "../src/data/konflikte";
import {
  VERMITTLUNG,
  aussichtFuer,
  beendeGarantie,
  bieteGarantie,
  konfliktSicht,
  konfliktSichten,
  konfliktZustand,
  spoilerFolge,
  vermittlungMonat,
  vermittlungVon,
  vermittle,
  verstossFolge,
  vorbereite,
  zopaFuer,
} from "../src/sim/vermittlung";
import { entscheide, oeffne } from "../src/sim/ereignisse";
import { hashWert } from "../src/sim/aufmerksamkeit";
import { Rng } from "../src/sim/rng";
import type { OffenesEreignis } from "../src/sim/spiel-typen";

function neu(seed = 11) {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.hinweise = [];
  w.spiel!.kapital = 100;
  return w;
}

const RNG_SICHER = { next: () => 0 } as unknown as Rng;
const RNG_DANEBEN = { next: () => 0.999 } as unknown as Rng;

function evFuer(konflikt: string, art: string, seite = "a"): OffenesEreignis {
  return { id: `t-${konflikt}-${art}`, vorlage: "vermittlung_spoiler", tag: 0, frist: 10, provinzen: [], staerke: 1, daten: { konflikt, art, seite } };
}

/** Vertrauen beider Seiten künstlich hoch (Istanbul-Bedingungen) */
function vertrauenHoch(w: ReturnType<typeof neu>, a: string, b: string, da = 20, db = 15) {
  weltZustand(w)[a]!.versatz += da;
  weltZustand(w)[b]!.versatz += db;
}

describe("Konfliktpaare (Datenlage)", () => {
  test("Vier aktive Drittstaaten-Konflikte mit Forderungen, roten Linien, Hebeln und Ausgangslage", () => {
    expect(KONFLIKTE.map((k) => k.id)).toEqual(["arm_aze", "ukr_rus", "isr_irn", "lby_fraktionen"]);
    for (const k of KONFLIKTE) {
      expect(k.a.forderungen.length, `${k.id} a`).toBeGreaterThanOrEqual(2);
      expect(k.b.forderungen.length, `${k.id} b`).toBeGreaterThanOrEqual(2);
      expect(k.a.roteLinien.length + k.b.roteLinien.length, `${k.id} rot`).toBeGreaterThanOrEqual(2);
      expect(k.hebel.length, `${k.id} Hebel`).toBeGreaterThanOrEqual(2);
      expect(k.hebel.length, `${k.id} Hebel max`).toBeLessThanOrEqual(3);
      for (const h of k.hebel) expect(h.richtung.length, `${k.id}/${h.id}`).toBeGreaterThan(30);
      expect(k.reifStart).toBeGreaterThanOrEqual(0);
      expect(k.reifStart).toBeLessThanOrEqual(100);
      expect(k.quelle).toMatch(/RECHERCHE/);
    }
    // Die Recherche-Lage: Kaukasus am reifsten (parafiert, unsigniert), Hormus am unruhigsten
    expect(KONFLIKT_NACH_ID.arm_aze!.reifStart).toBeGreaterThan(KONFLIKT_NACH_ID.ukr_rus!.reifStart);
    expect(KONFLIKT_NACH_ID.isr_irn!.reifStart).toBeLessThan(VERMITTLUNG.zopaOeffnetAb);
  });
});

describe("ZOPA: breit, schmal, geschlossen", () => {
  test("Geschlossen ohne Mindestreife oder ohne Vertrauen; Gründe werden genannt", () => {
    const w = neu();
    // Hormus beginnt unter der Öffnungsreife
    const hormus = zopaFuer(w, KONFLIKT_NACH_ID.isr_irn!);
    expect(hormus.stufe).toBe("geschlossen");
    expect(hormus.gruende.some((g) => /nicht reif/.test(g))).toBe(true);
    // Vertrauensbruch auf einer Seite schließt die Zone ebenfalls
    weltZustand(w)["RUS"]!.versatz = -60;
    const ukr = zopaFuer(w, KONFLIKT_NACH_ID.ukr_rus!);
    expect(ukr.stufe).toBe("geschlossen");
    expect(ukr.gruende.some((g) => /vertraut Ankara/.test(g))).toBe(true);
  });

  test("Schmal in der Ausgangslage; breit bei Reife, Vertrauen und Bandbreite", () => {
    const w = neu();
    // Ukraine/Russland: reif 32 → eine enge Zone
    expect(zopaFuer(w, KONFLIKT_NACH_ID.ukr_rus!).stufe).toBe("schmal");
    // Kaukasus mit Istanbul-Vorbereitung: reif und vertrauensvoll → breites Band
    vertrauenHoch(w, "ARM", "AZE", 25, 0);
    konfliktZustand(w, "arm_aze").reif = 72;
    const z = zopaFuer(w, KONFLIKT_NACH_ID.arm_aze!);
    expect(z.stufe).toBe("breit");
    expect(z.breite).toBeGreaterThanOrEqual(VERMITTLUNG.zopaBreitBand);
  });

  test("Die Bandbreite wächst mit Reife und Vertrauen", () => {
    const w = neu();
    const def = KONFLIKT_NACH_ID.ukr_rus!;
    const eng = zopaFuer(w, def).breite;
    konfliktZustand(w, "ukr_rus").reif = 80;
    vertrauenHoch(w, "UKR", "RUS");
    expect(zopaFuer(w, def).breite).toBeGreaterThan(eng);
  });
});

describe("Reife-Dynamik (ripeness)", () => {
  test("Der Patt-Schmerz treibt die Reife; Vorbereitungshandlungen reifen die Lage", () => {
    const w = neu();
    const z = konfliktZustand(w, "ukr_rus");
    const r0 = z.reif;
    const r = vorbereite(w, "ukr_rus", "kanaele");
    expect(r.ok, r.text).toBe(true);
    expect(z.reif).toBeCloseTo(r0 + VORBEREITUNGEN.kanaele.reif, 3);
    expect(w.spiel!.kapital).toBe(100 - VORBEREITUNGEN.kanaele.pk);
    // Abkühlung greift
    expect(vorbereite(w, "ukr_rus", "kanaele").text).toMatch(/Wieder möglich/);
    // Vertrauensmaßnahme senkt zusätzlich den Konflikt-Index
    const k0 = z.konfliktIndex;
    expect(vorbereite(w, "ukr_rus", "vertrauensmassnahme").ok).toBe(true);
    expect(z.konfliktIndex).toBeCloseTo(k0 - VORBEREITUNGEN.vertrauensmassnahme.konflikt, 3);
  });

  test("Ein heißer Konflikt reift im Monatstick von selbst (Schmerz des Patts), ein kalter zieht sich zurück", () => {
    const w = neu();
    const heiss = konfliktZustand(w, "ukr_rus");
    heiss.konfliktIndex = 95;
    const r0 = heiss.reif;
    vermittlungMonat(w, new Rng(1));
    expect(heiss.reif).toBeGreaterThan(r0);
    // Hormus: Ölpreis-Schock wirkt als externes Signal
    const w2 = neu();
    const hormus = konfliktZustand(w2, "isr_irn");
    w2.economy.oel = 130;
    const h0 = hormus.reif;
    vermittlungMonat(w2, new Rng(1));
    expect(hormus.reif).toBeGreaterThan(h0 + 0.5);
    // Verlauf wird für die Kurve aufgezeichnet
    expect(hormus.reifVerlauf.length).toBe(1);
  });

  test("Reif-Kipppunkte melden sich als Hinweis (Auto-Stopp B): Gesprächsbereitschaft und Einigungsfenster", () => {
    const w = neu();
    const z = konfliktZustand(w, "ukr_rus");
    z.reif = VERMITTLUNG.kippBereit - 2;
    expect(vorbereite(w, "ukr_rus", "kanaele").ok).toBe(true); // +6 → über die Schwelle
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("vermittlung-kipp-ukr_rus-2") && /Gesprächsbereitschaft/.test(h.titel))).toBe(true);
    z.reif = VERMITTLUNG.kippFenster - 4;
    expect(vorbereite(w, "ukr_rus", "vertrauensmassnahme").ok).toBe(true); // +9 → Einigungsfenster
    expect(w.spiel!.hinweise.some((h) => /Fenster für eine Einigung/.test(h.titel))).toBe(true);
    // Absturz unter das Ende meldet das Einfrieren
    z.reif = VERMITTLUNG.kippEnde + 3;
    spoilerFolge(w, evFuer("ukr_rus", "hardliner"), "ignorieren"); // −10 → unter 20
    expect(w.spiel!.hinweise.some((h) => /einzufrieren/.test(h.titel))).toBe(true);
  });
});

describe("Spoiler-Ereignisse", () => {
  test("Verurteilen kostet die Spoiler-Seite Beziehung, schützt die andere und stabilisiert die Reife", () => {
    const w = neu();
    vertrauenHoch(w, "UKR", "RUS");
    const z = konfliktZustand(w, "ukr_rus");
    const vr = vertrauenZu(w, "RUS");
    const vu = vertrauenZu(w, "UKR");
    const r0 = z.reif;
    const aus = spoilerFolge(w, evFuer("ukr_rus", "provokation", "b"), "verurteilen");
    expect(aus).toMatch(/verurteilt/);
    expect(vertrauenZu(w, "RUS")).toBeLessThan(vr - 3); // Spoiler-Seite b = Russland
    expect(vertrauenZu(w, "UKR")).toBeGreaterThan(vu); // die andere Seite fühlt sich geschützt
    expect(z.reif).toBeGreaterThan(r0);
  });

  test("Diskret dämpfen hält den Schaden klein; Ignorieren kostet Reife und treibt den Konflikt", () => {
    const w = neu();
    const z = konfliktZustand(w, "ukr_rus");
    const r0 = z.reif;
    const k0 = z.konfliktIndex;
    spoilerFolge(w, evFuer("ukr_rus", "provokation"), "daempfen");
    expect(z.reif).toBeCloseTo(r0 - 2, 3);
    expect(z.konfliktIndex).toBeCloseTo(k0 - 2, 3);
    const w2 = neu();
    const z2 = konfliktZustand(w2, "ukr_rus");
    const art = SPOILER_ARTEN.sabotage;
    const r2 = z2.reif;
    const aus = spoilerFolge(w2, evFuer("ukr_rus", "sabotage"), "ignorieren");
    expect(aus).toMatch(/Reife.*sinkt/);
    expect(z2.reif).toBeCloseTo(r2 - art.reif, 3);
    expect(z2.konfliktIndex).toBeGreaterThan(KONFLIKT_NACH_ID.ukr_rus!.konfliktStart);
  });

  test("Ohne türkisches Engagement am Konflikt feuern keine Spoiler (Ereignis-Budget bleibt frei)", () => {
    // Derselbe Samen wie im Öffnungs-Test — aber ohne Vorbereitung bleibt der Monat ruhig
    let geprueft = 0;
    for (let seed = 1; seed < 80; seed++) {
      const w = neu(seed);
      const z = konfliktZustand(w, "arm_aze");
      z.reif = 80;
      z.konfliktIndex = 100;
      const monat = w.date.slice(0, 7);
      const chance = VERMITTLUNG.spoilerChance + 50 * VERMITTLUNG.spoilerKonflikt;
      if (hashWert(`${w.seed}|spoiler|arm_aze|${monat}`) >= chance) continue;
      geprueft++;
      vermittlungMonat(w, new Rng(1));
      expect(w.spiel!.ereignisse.some((e) => e.vorlage === "vermittlung_spoiler")).toBe(false);
    }
    expect(geprueft).toBeGreaterThan(0); // der Wurf traf wirklich — nur die Schranke hielt
  });

  test("Der Monatstick öffnet Spoiler als Entscheidungs-Ereignis (Auto-Stopp A), und die Antworten wirken", () => {
    // Ein Samen, bei dem der deterministische Spoiler-Wurf des Monats trifft
    let w: ReturnType<typeof neu> | null = null;
    for (let seed = 1; seed < 80 && !w; seed++) {
      const kandidat = neu(seed);
      const z = konfliktZustand(kandidat, "arm_aze");
      z.reif = 80;
      z.konfliktIndex = 100;
      z.vorbereitet.kanaele = 0; // Ankara sitzt am Tisch: erst dann lohnen Spoiler
      const monat = kandidat.date.slice(0, 7);
      const chance = VERMITTLUNG.spoilerChance + 50 * VERMITTLUNG.spoilerKonflikt;
      if (hashWert(`${kandidat.seed}|spoiler|arm_aze|${monat}`) < chance) w = kandidat;
    }
    expect(w).not.toBeNull();
    vermittlungMonat(w!, new Rng(1));
    const ev = w!.spiel!.ereignisse.find((e) => e.vorlage === "vermittlung_spoiler");
    expect(ev).toBeDefined();
    expect(ev!.daten?.konflikt).toBe("arm_aze");
    // Die Antwort „verurteilen" läuft über denselben Motor wie alle Ereignisse
    const vu = vertrauenZu(w!, "ARM");
    const r = entscheide(w!, ev!.id, "verurteilen", new Rng(5));
    expect(r.text).toMatch(/verurteilt|geschützt/);
    expect(vertrauenZu(w!, "ARM")).toBeLessThan(vu + 3);
  });
});

describe("Garantien", () => {
  function bereit(seed = 11) {
    const w = neu(seed);
    vertrauenHoch(w, "ARM", "AZE", 25, 0);
    konfliktZustand(w, "arm_aze").reif = 70;
    return w;
  }

  test("Angebot erst ab Reife; es hebt die Aussicht und kostet beim Angebot Kapital", () => {
    const w = neu();
    // Ausgangslage des Kaukasus: reif 58 ≥ 50 → möglich; Ukraine: reif 32 < 50 → gesperrt
    expect(bieteGarantie(w, "ukr_rus", "wirtschaft").ok).toBe(false);
    const a0 = aussichtFuer(w, KONFLIKT_NACH_ID.arm_aze!);
    const kap = w.spiel!.kapital;
    const r = bieteGarantie(w, "arm_aze", "wirtschaft");
    expect(r.ok, r.text).toBe(true);
    expect(w.spiel!.kapital).toBe(kap - GARANTIEN.wirtschaft.pk);
    expect(konfliktZustand(w, "arm_aze").garantieAngebot).toBe("wirtschaft");
    expect(aussichtFuer(w, KONFLIKT_NACH_ID.arm_aze!)).toBe(a0 + GARANTIEN.wirtschaft.aussicht);
    // Doppelt geht nicht
    expect(bieteGarantie(w, "arm_aze", "militaer").ok).toBe(false);
  });

  test("Erfolg mit Angebot aktiviert die Garantie: laufende Kosten, Wirtschafts-Anker wirkt monatlich", () => {
    const w = bereit();
    bieteGarantie(w, "arm_aze", "wirtschaft");
    const schulden0 = w.economy.debtRatio;
    const r = vermittle(w, "arm_aze", RNG_SICHER);
    expect(r.ok, r.text).toBe(true);
    const z = konfliktZustand(w, "arm_aze");
    expect(z.garantie).toBe("wirtschaft");
    expect(z.garantieAngebot).toBeUndefined();
    expect(w.economy.debtRatio).toBeGreaterThan(schulden0); // Aufbaukosten
    const export0 = nationalAverage(NET, w.net, "export");
    const kap = w.spiel!.kapital;
    vermittlungMonat(w, new Rng(1));
    expect(w.spiel!.kapital).toBeCloseTo(kap - GARANTIEN.wirtschaft.monatPk, 3);
    expect(nationalAverage(NET, w.net, "export")).toBeGreaterThan(export0);
  });

  test("Scheitern nach Garantie-Angebot ist ein Gesichtsverlust; das Angebot verfällt", () => {
    const w = bereit();
    bieteGarantie(w, "arm_aze", "militaer");
    const an0 = nationalAverage(NET, w.net, "ansehen");
    const r = vermittle(w, "arm_aze", RNG_DANEBEN);
    expect(r.ok).toBe(false);
    expect(r.why).toMatch(/Gesichtsverlust/);
    expect(konfliktZustand(w, "arm_aze").garantieAngebot).toBeUndefined();
    expect(nationalAverage(NET, w.net, "ansehen")).toBeLessThan(an0 - 1);
  });

  test("Verstoß: Hinnehmen bricht die Garantie (Ansehen −6, Reif stürzt ab), Dämpfen rettet sie teuer", () => {
    const w = bereit();
    bieteGarantie(w, "arm_aze", "ueberwachung");
    vermittle(w, "arm_aze", RNG_SICHER);
    const z = konfliktZustand(w, "arm_aze");
    const an0 = nationalAverage(NET, w.net, "ansehen");
    const r0 = z.reif;
    const aus = verstossFolge(w, { ...evFuer("arm_aze", "x"), daten: { konflikt: "arm_aze", garantie: "ueberwachung" } }, "hinnehmen");
    expect(aus).toMatch(/gebrochen/);
    expect(z.garantie).toBeUndefined();
    expect(nationalAverage(NET, w.net, "ansehen")).toBeLessThan(an0 - 4);
    expect(z.reif).toBeLessThan(r0 - 10);
    // Dämpfen: die Garantie steht weiter
    const w2 = bereit(12);
    bieteGarantie(w2, "arm_aze", "ueberwachung");
    vermittle(w2, "arm_aze", RNG_SICHER);
    const z2 = konfliktZustand(w2, "arm_aze");
    verstossFolge(w2, { ...evFuer("arm_aze", "x"), daten: { konflikt: "arm_aze", garantie: "ueberwachung" } }, "daempfen");
    expect(z2.garantie).toBe("ueberwachung");
  });

  test("Militärische Garantie: Eingreifen setzt die Vereinbarung durch — teuer, aber mit Gesicht", () => {
    const w = bereit();
    bieteGarantie(w, "arm_aze", "militaer");
    vermittle(w, "arm_aze", RNG_SICHER);
    const z = konfliktZustand(w, "arm_aze");
    const schulden0 = w.economy.debtRatio;
    const an0 = nationalAverage(NET, w.net, "ansehen");
    const aus = verstossFolge(w, { ...evFuer("arm_aze", "x"), daten: { konflikt: "arm_aze", garantie: "militaer" } }, "eingreifen");
    expect(aus).toMatch(/durchgesetzt|ernst meint/);
    expect(z.garantie).toBe("militaer");
    expect(w.economy.debtRatio).toBeGreaterThan(schulden0 + 0.2);
    expect(nationalAverage(NET, w.net, "ansehen")).toBeGreaterThan(an0);
  });

  test("Geordnetes Beenden ohne Gesichtsverlust, mitten im Konflikt mit", () => {
    const w = bereit();
    bieteGarantie(w, "arm_aze", "ueberwachung");
    vermittle(w, "arm_aze", RNG_SICHER);
    konfliktZustand(w, "arm_aze").konfliktIndex = 20; // stabilisiert
    const an0 = nationalAverage(NET, w.net, "ansehen");
    expect(beendeGarantie(w, "arm_aze").text).toMatch(/geordnet/);
    expect(nationalAverage(NET, w.net, "ansehen")).toBeGreaterThanOrEqual(an0 - 0.01);
    const w2 = bereit(13);
    bieteGarantie(w2, "arm_aze", "ueberwachung");
    vermittle(w2, "arm_aze", RNG_SICHER);
    konfliktZustand(w2, "arm_aze").konfliktIndex = 60;
    const an1 = nationalAverage(NET, w2.net, "ansehen");
    expect(beendeGarantie(w2, "arm_aze").text).toMatch(/Wortbruch/);
    expect(nationalAverage(NET, w2.net, "ansehen")).toBeLessThan(an1);
  });
});

describe("Einigung und Prestige", () => {
  test("Einigung: Abkommen zwischen Dritten, Konflikt-Index sinkt über Monate, Zeitung berichtet", () => {
    const w = neu();
    vertrauenHoch(w, "UKR", "RUS");
    const z = konfliktZustand(w, "ukr_rus");
    const k0 = z.konfliktIndex;
    const ku0 = weltZustand(w)["UKR"]!.konflikt;
    const r = vermittle(w, "ukr_rus", RNG_SICHER);
    expect(r.ok, r.text).toBe(true);
    expect(r.text).toMatch(/einigen sich in Istanbul/);
    expect(z.einigung).toBe(w.day);
    expect(konfliktSicht(w, KONFLIKT_NACH_ID.ukr_rus!).status).toBe("geeint");
    // Die Zeitung berichtet (Eilmeldung digital sofort, Print-Vorgang in der Warteschlange)
    const zeitung = w.spiel!.zeitung;
    expect(zeitung?.archiv.some((a) => a.anlass === "eilmeldung")).toBe(true);
    expect(zeitung?.warteschlange.some((v) => v.titel.includes("Abkommen in Istanbul"))).toBe(true);
    // Der Konflikt-Index des Paares sinkt über Monate — sichtbar auch in den Länderakten
    for (let i = 0; i < 4; i++) advance(w, 30);
    expect(z.konfliktIndex).toBeLessThanOrEqual(k0 - 3 * VERMITTLUNG.einigungSenkung);
    expect(weltZustand(w)["UKR"]!.konflikt).toBeLessThan(ku0);
    // Am Boden: stabilisiert
    z.konfliktIndex = 22;
    expect(konfliktSicht(w, KONFLIKT_NACH_ID.ukr_rus!).status).toBe("stabilisiert");
  });

  test("Prestige: Ansehen und Vertrauen aller steigen; EU und USA reagieren positiv", () => {
    const w = neu();
    vertrauenHoch(w, "UKR", "RUS");
    const an0 = nationalAverage(NET, w.net, "ansehen");
    const eu0 = vertrauenZu(w, "EU");
    const us0 = vertrauenZu(w, "USA");
    const vu0 = vertrauenZu(w, "UKR");
    expect(vermittle(w, "ukr_rus", RNG_SICHER).ok).toBe(true);
    expect(nationalAverage(NET, w.net, "ansehen")).toBeGreaterThan(an0 + 2);
    expect(vertrauenZu(w, "UKR")).toBeGreaterThan(vu0);
    expect(vertrauenZu(w, "EU")).toBeGreaterThan(eu0);
    expect(vertrauenZu(w, "USA")).toBeGreaterThan(us0);
  });

  test("Scheitern kostet Kapital, Ansehen und Reife; ein geschlossener ZOPA sperrt den Versuch", () => {
    const w = neu();
    vertrauenHoch(w, "UKR", "RUS");
    const z = konfliktZustand(w, "ukr_rus");
    const r0 = z.reif;
    const an0 = nationalAverage(NET, w.net, "ansehen");
    const r = vermittle(w, "ukr_rus", RNG_DANEBEN);
    expect(r.ok).toBe(false);
    expect(r.text).toMatch(/scheitert/);
    expect(z.reif).toBeLessThan(r0);
    expect(nationalAverage(NET, w.net, "ansehen")).toBeLessThan(an0);
    // Hormus: ZOPA geschlossen → gar kein Versuch möglich
    const sicht = konfliktSicht(w, KONFLIKT_NACH_ID.isr_irn!);
    expect(sicht.moeglich).toBe(false);
    expect(sicht.grund).toMatch(/Zone möglicher Einigung/);
  });
});

describe("Getreide-Testfall-Konstante (Kalibrierung Istanbul 2022)", () => {
  test("Istanbul-Bedingungen 2022: hohe Reife, Vertrauen, Krieg — die Aussicht liegt im Erfolgsband", () => {
    const w = neu();
    vertrauenHoch(w, "UKR", "RUS", 10, 18);
    const z = konfliktZustand(w, "ukr_rus");
    z.reif = 80;
    z.konfliktIndex = 60; // der Krieg lief weiter
    const a = aussichtFuer(w, KONFLIKT_NACH_ID.ukr_rus!);
    expect(a).toBeGreaterThanOrEqual(60);
    expect(a).toBeLessThanOrEqual(85);
  });

  test("Das Band hält: katastrophale Lage 8 %, ideale Lage mit Garantie 85 %", () => {
    const w = neu();
    const def = KONFLIKT_NACH_ID.ukr_rus!;
    const z = konfliktZustand(w, "ukr_rus");
    z.reif = 0;
    z.konfliktIndex = 100;
    weltZustand(w)["UKR"]!.versatz = -60;
    weltZustand(w)["RUS"]!.versatz = -60;
    expect(aussichtFuer(w, def)).toBe(VERMITTLUNG.aussichtMin);
    const w2 = neu();
    const z2 = konfliktZustand(w2, "ukr_rus");
    z2.reif = 100;
    z2.konfliktIndex = 0;
    z2.garantieAngebot = "militaer";
    weltZustand(w2)["UKR"]!.versatz = 60;
    weltZustand(w2)["RUS"]!.versatz = 60;
    expect(aussichtFuer(w2, def)).toBe(VERMITTLUNG.aussichtMax);
  });

  test("Die Aussicht aller Konflikte bleibt in jeder Ausgangslage im Band 8–85", () => {
    const w = neu();
    for (const s of konfliktSichten(w)) {
      expect(s.aussicht, s.def.id).toBeGreaterThanOrEqual(VERMITTLUNG.aussichtMin);
      expect(s.aussicht, s.def.id).toBeLessThanOrEqual(VERMITTLUNG.aussichtMax);
    }
  });
});

describe("Migration und Determinismus", () => {
  test("Ältere Spielstände ohne Vermittlungszustand laden mit der Datenlage; beschädigte Werte werden repariert", () => {
    const w = neu();
    delete w.spiel!.vermittlung;
    const alle = vermittlungVon(w);
    expect(alle.arm_aze!.reif).toBe(KONFLIKT_NACH_ID.arm_aze!.reifStart);
    expect(alle.ukr_rus!.konfliktIndex).toBe(KONFLIKT_NACH_ID.ukr_rus!.konfliktStart);
    // NaN-Ruinen aus einem kaputten Spielstand
    w.spiel!.vermittlung = { arm_aze: { reif: Number.NaN, konfliktIndex: Number.NaN, vorbereitet: {}, reifVerlauf: [] } } as never;
    expect(vermittlungVon(w).arm_aze!.reif).toBe(KONFLIKT_NACH_ID.arm_aze!.reifStart);
  });

  test("Gleiche Saat, gleiche Welt: zwei Partien laufen bit-identisch", () => {
    const a = neu(42);
    const b = neu(42);
    for (let i = 0; i < 4; i++) {
      advance(a, 30);
      advance(b, 30);
    }
    expect(JSON.stringify(a.spiel!.vermittlung)).toBe(JSON.stringify(b.spiel!.vermittlung));
    expect(a.rngState).toBe(b.rngState);
  });

  test("Der Vermittlungstick verändert den Zufallsstrom des Spiels nicht", () => {
    const w = neu(7);
    konfliktZustand(w, "ukr_rus").konfliktIndex = 95;
    const rng = new Rng(123);
    vermittlungMonat(w, rng);
    expect(rng.state).toBe(123); // alle Monatsziehungen laufen über den Hash, nicht über den Strom
  });
});
