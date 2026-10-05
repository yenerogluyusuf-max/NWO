// Pakte, Koalitionen und Kriege zwischen anderen Staaten (sim/pakte.ts):
//   - Pakt-Ableitung aus den Institutionen und den laufenden Beistandsklauseln
//   - Bündnisfall nur für das Opfer; der Angreifer löst keine Pflicht aus; ein Pakt mit beiden Streitparteien wird gespalten
//   - Koalitionen wirken auf Stärke, Lastteilung, Friedensannahme, lösen sich im Frieden auf
//   - Handlung „Bündnispartner rufen“, Beistandsvorgang
//   - Kriege zwischen anderen Staaten: Ausgangslage, Zündung, Ende, Pakt-Beitritt, Beistandsruf mit drei Antworten
//   - Speicherkompatibilität (der Stand vom 20.11.2029 wird nur GELESEN) und Kalibrierung (mehrere Seeds)

import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { createWorld, advance, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { weltZustand } from "../src/sim/laender";
import {
  KRIEG,
  aktiveKriege,
  beistandVorgangGrund,
  eigenStaerke,
  eroeffneBeistandsVorgang,
  fuehreKriegHandlungAus,
  gegnerStaerke,
  handlungenFuer,
  kriegMit,
  kriegMonat,
  kriege,
  PAKETE,
  paketAnnahme,
} from "../src/sim/krieg";
import {
  DRITTKRIEG,
  KOALITION,
  KRIEGSPAARE,
  TUR,
  allePakte,
  drittKriege,
  koalitionenIn,
  koalitionsFaktoren,
  paktDefs,
  paktSicht,
  pakteVon,
} from "../src/sim/pakte";
import { beziehungZurTuerkei, paarVon, setzePaar, weltModell, weltModellMonat } from "../src/sim/welt-modell";
import { entscheide, vorlage } from "../src/sim/ereignisse";
import { laufende } from "../src/sim/abkommen";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";
import type { KriegVorgang } from "../src/sim/krieg-typen";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 200;
  w.parliament!.seats = { [w.player!.partei.kurz]: 450 };
  return w;
}

/** Bringt einen Konfliktvorgang bis zum Krieg: per Schlag des Gegners („angriff“) oder per Erlass mit der gewählten Rahmung. */
function inDenKrieg(land: string, weg: "angriff" | "verteidigung" | "schutz" | "beistand" | "revision", seed = 6): { w: World; k: KriegVorgang } {
  const w = welt(seed);
  weltZustand(w)[land]!.konflikt = 80;
  kriegMonat(w, new Rng(1));
  const k0 = kriegMit(w, land)!;
  k0.eskalation = 80;
  advance(w, 1);
  if (weg === "angriff") {
    k0.eskalation = 99;
    advance(w, 1);
  } else {
    expect(fuehreKriegHandlungAus(w, k0.id, `ziel_${weg}`).ok).toBe(true);
    expect(fuehreKriegHandlungAus(w, k0.id, "beschluss_erlass").ok).toBe(true);
  }
  const k = kriege(w).find((x) => x.land === land)!;
  expect(k.phase).toBe("krieg");
  return { w, k };
}

/** Springt zum Ersten des nächsten Monats und schreibt das Weltmodell fort. */
function monat(w: World): void {
  const [y, m] = w.date.split("-").map(Number) as [number, number];
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const iso = `${ny}-${String(nm).padStart(2, "0")}-01`;
  const diff = Math.round((Date.UTC(ny, nm - 1, 1) - Date.UTC(y, m - 1, Number(w.date.slice(8, 10)))) / 86_400_000);
  w.day += diff;
  w.date = iso;
  weltModellMonat(w);
}

describe("Pakte aus den Institutionen und den Verträgen", () => {
  test("NATO und Mekka-Pakt sind kollektiv, die EU leistet Beistand, BRICS und G20 verpflichten zu nichts", () => {
    const p = Object.fromEntries(paktDefs().map((x) => [x.id, x]));
    expect(p.nato!.klausel).toBe("kollektiv");
    expect(p.nato!.mitglieder).toEqual(expect.arrayContaining([TUR, "USA", "GRC", "DEU"]));
    expect(p.mekka!.klausel).toBe("kollektiv");
    expect(p.mekka!.mitglieder).toEqual(expect.arrayContaining([TUR, "SAU", "PAK"]));
    expect(p.eu!.klausel).toBe("beistand");
    expect(p.eu!.mitglieder).toEqual(expect.arrayContaining(["EU", "GRC", "CYP"]));
    expect(p.eu!.mitglieder).not.toContain(TUR);
    expect(p.golf!.klausel).toBe("beistand");
    expect(p.ots!.klausel).toBe("konsultation");
    expect(p.sco!.klausel).toBe("konsultation");
    expect(p.brics!.klausel).toBe("keine");
    expect(p.g20!.klausel).toBe("keine");
    for (const x of paktDefs()) {
      expect(x.text.length, x.id).toBeGreaterThan(20);
      expect(x.quelle.length, x.id).toBeGreaterThan(3);
    }
  });

  test("Eine laufende Beistandsklausel im Vertrag wird zum bilateralen Pakt; die Mekka-Klausel wird nicht doppelt gezählt", () => {
    const w = welt();
    expect(allePakte(w).some((x) => x.id === "bilateral-SAU")).toBe(false);
    weltZustand(w)["AZE"]!.vertraege = [
      { id: "v-test", land: "AZE", gibt: ["beistand"], will: [], jahre: 10, seit: w.day, ablauf: w.day + 3650, status: "laeuft", verstoesse: 0, letztePruefung: w.day },
    ];
    const b = allePakte(w).find((x) => x.id === "bilateral-AZE")!;
    expect(b.bilateral).toBe(true);
    expect(b.mitglieder).toEqual([TUR, "AZE"]);
    expect(pakteVon(w, "AZE").map((x) => x.id)).toContain("bilateral-AZE");
    // gekündigt: weg
    weltZustand(w)["AZE"]!.vertraege![0]!.status = "gekuendigt";
    expect(allePakte(w).some((x) => x.id === "bilateral-AZE")).toBe(false);
  });

  test("paktSicht nennt Türkei-Mitgliedschaft, Pflichtgewicht und laufende Kriege der Mitglieder", () => {
    const w = welt();
    const s = Object.fromEntries(paktSicht(w).map((x) => [x.id, x]));
    expect(s.nato!.tuerkeiMitglied).toBe(true);
    expect(s.eu!.tuerkeiMitglied).toBe(false);
    expect(s.nato!.pflichtGewicht).toBe(1);
    // In der Ausgangslage kämpft die Ukraine nicht in einem Pakt, aber die USA (NATO) im Krieg gegen den Iran
    expect(s.nato!.kriege.some((k) => k.mitglieder.includes("USA"))).toBe(true);
    expect(s.brics!.kriege.length).toBeGreaterThan(0);
  });
});

describe("Koalitionen im Krieg der Türkei: Pflicht nur für das Opfer", () => {
  test("Der Gegner greift an: Mekka-Partner kommen aus Pflicht, NATO-Partner treten bei", () => {
    const { w, k } = inDenKrieg("IRN", "angriff");
    const ko = k.koalition!;
    expect(ko.aggressor).toBe("gegner");
    const eigen = ko.partner.filter((p) => p.seite === "eigen");
    const sau = eigen.find((p) => p.id === "SAU");
    expect(sau?.pflicht, "Mekka-Pakt: Der Angriff auf einen gilt als Angriff auf alle").toBe(true);
    expect(sau?.pakt).toBe("mekka");
    expect(eigen.some((p) => p.pakt === "nato" && p.pflicht), "NATO-Mitglieder treten aus Art. 5 bei").toBe(true);
    // Die Sicht für die Oberfläche
    const sicht = koalitionenIn(w, k.id);
    expect(sicht.aggressor).toBe("gegner");
    expect(sicht.gegner[0]!.rolle).toBe("hauptgegner");
    expect(sicht.eigen.some((x) => x.id === "SAU" && x.rolle === "partner" && x.pflicht)).toBe(true);
    // Hinweis im Dossier
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("krieg-koalition-"))).toBe(true);
  });

  test("Die Türkei greift an: Der Bündnisfall greift nicht für sie, die Seite des Opfers sammelt Partner, der Angriff kostet Ansehen", () => {
    const { w, k } = inDenKrieg("IRN", "revision");
    const ko = k.koalition!;
    expect(ko.aggressor).toBe("tuerkei");
    expect(ko.partner.filter((p) => p.seite === "eigen" && p.pflicht), "kein Bündnisfall für den Angreifer").toHaveLength(0);
    expect(w.log.some((e) => e.text.startsWith("Der Bündnisfall greift nicht"))).toBe(true);
    // Das Opfer (Iran) hat keine Verteidigungspakte; die Bündnispartner des Gegners kämen nur aus Eigeninteresse
    for (const p of ko.partner.filter((x) => x.seite === "gegner")) expect(p.pflicht).toBe(false);
  });

  test("Türkei gegen ein NATO-Mitglied: Der Pakt wird gespalten, niemand tritt aus der NATO-Klausel bei; die EU steht Griechenland bei", () => {
    const { k } = inDenKrieg("GRC", "revision");
    const ko = k.koalition!;
    expect(ko.spaltung).toBe("nato");
    expect(ko.partner.some((p) => p.pakt === "nato" && p.pflicht)).toBe(false);
    const gegner = ko.partner.filter((p) => p.seite === "gegner");
    expect(gegner.some((p) => p.pakt === "eu" && p.pflicht), "Art. 42 Abs. 7 EUV: Beistand für das angegriffene Mitglied").toBe(true);
    expect(gegner.map((p) => p.id)).toEqual(expect.arrayContaining(["CYP"]));
  });

  test("Griechenland greift an: Die Türkei kann auf Mekka-Partner zählen, nicht auf die NATO (Spaltung)", () => {
    const { k } = inDenKrieg("GRC", "angriff");
    const ko = k.koalition!;
    expect(ko.aggressor).toBe("gegner");
    expect(ko.spaltung).toBe("nato");
    const eigen = ko.partner.filter((p) => p.seite === "eigen").map((p) => p.id);
    expect(eigen).toEqual(expect.arrayContaining(["SAU", "PAK"]));
    expect(ko.partner.some((p) => p.seite === "eigen" && p.pakt === "nato")).toBe(false);
    // Die EU-Staaten haben keine Pflicht, Griechenland beizustehen: Es hat angegriffen
    expect(ko.partner.some((p) => p.seite === "gegner" && p.pflicht)).toBe(false);
  });

  test("Abwesende werden mit Pflicht und Zögern erfasst (Grundlage der Folgen beim Kriegsbeginn)", () => {
    const w = welt();
    weltZustand(w)["IRN"]!.konflikt = 80;
    // Alle NATO-Partner würden verweigern, wenn ihr Vertrauen in die Türkei am Boden ist: Die Rechnung zeigt es als „abwesend mit Pflicht“
    kriegMonat(w, new Rng(1));
    const k = kriegMit(w, "IRN")!;
    k.eskalation = 80;
    advance(w, 1);
    k.eskalation = 99;
    advance(w, 1);
    const ko = k.koalition!;
    for (const a of ko.abwesend) {
      expect(typeof a.pflicht).toBe("boolean");
      expect(typeof a.zoegert).toBe("boolean");
    }
  });
});

describe("Determinismus", () => {
  test("Gleicher Seed, gleiche Koalitionen und gleiche Drittkriege", () => {
    const a = inDenKrieg("IRN", "angriff", 13);
    const b = inDenKrieg("IRN", "angriff", 13);
    expect(a.k.koalition!.partner.map((p) => `${p.id}:${p.seite}:${p.einsatz}`)).toEqual(b.k.koalition!.partner.map((p) => `${p.id}:${p.seite}:${p.einsatz}`));
    expect(JSON.stringify(drittKriege(a.w, true))).toBe(JSON.stringify(drittKriege(b.w, true)));
  });
});

describe("Wirkung der Koalitionen auf den Krieg", () => {
  test("Stärke: Partner heben die eigene Stärke (Deckel) und die des Gegners (Deckel)", () => {
    const { w, k } = inDenKrieg("IRN", "angriff");
    const f = koalitionsFaktoren(w, k);
    expect(f.eigenPlus).toBeGreaterThan(0);
    expect(f.eigenPlus).toBeLessThanOrEqual(KOALITION.deckelEigen);
    expect(f.gegnerPlus).toBeGreaterThanOrEqual(0);
    expect(f.gegnerPlus).toBeLessThanOrEqual(KOALITION.deckelGegner);
    const mit = eigenStaerke(w, k);
    const ko = k.koalition!;
    k.koalition = { ...ko, partner: [] };
    const ohne = eigenStaerke(w, k);
    expect(mit).toBeGreaterThan(ohne);
    expect(mit / ohne).toBeCloseTo(1 + f.eigenPlus, 5);
    k.koalition = ko;
  });

  test("Stärke des Gegners: Griechenlands EU-Partner erhöhen sie über den Tabellenwert plus Eskalation", () => {
    const { w, k } = inDenKrieg("GRC", "revision");
    expect(koalitionsFaktoren(w, k).gegnerPlus).toBeGreaterThan(0);
    expect(gegnerStaerke(w, "GRC")).toBeGreaterThan(52 + k.eskalation * 0.08);
  });

  test("Friedensannahme: Partner des Gegners blockieren harte Pakete stärker als weiche", () => {
    const { w, k } = inDenKrieg("GRC", "revision");
    // Eine Lage, in der die Annahme nicht an den Rändern 5 und 98 klebt
    k.front = 75;
    k.uhrGegner = 30;
    k.uhr = 90;
    const hart = PAKETE.paket_sieg!.paket(k.front);
    const weich = PAKETE.paket_weiss!.paket(k.front);
    const mitHart = paketAnnahme(w, k, hart);
    const mitWeich = paketAnnahme(w, k, weich);
    const ko = k.koalition!;
    k.koalition = { ...ko, partner: ko.partner.filter((p) => p.seite !== "gegner") };
    const ohneHart = paketAnnahme(w, k, hart);
    const ohneWeich = paketAnnahme(w, k, weich);
    expect(ohneHart).toBeGreaterThan(mitHart);
    expect(ohneHart - mitHart).toBeGreaterThan(ohneWeich - mitWeich);
    expect(ohneHart - mitHart).toBeLessThanOrEqual(KOALITION.blockadeDeckel + 1);
    k.koalition = ko;
  });

  test("Wochenschritt: Die Kampfkraft der Partner schmilzt, Erschöpfte steigen aus, nichts wird NaN", () => {
    const { w, k } = inDenKrieg("IRN", "angriff");
    const vorher = k.koalition!.partner.length;
    expect(vorher).toBeGreaterThan(0);
    for (let i = 0; i < 40 && k.phase === "krieg"; i++) advance(w, 7);
    for (const p of k.koalition!.partner) {
      expect(p.rest).toBeGreaterThan(KOALITION.aussteigenUnter);
      expect(p.rest).toBeLessThanOrEqual(1);
      expect(Number.isFinite(p.rest)).toBe(true);
    }
    // Spätestens nach vielen Wochen ist die Koalition geschrumpft oder verbraucht
    const rest = k.koalition!.partner.reduce((s, p) => s + p.rest, 0);
    expect(rest).toBeLessThan(vorher);
  });

  test("Frieden löst die Koalitionen auf", () => {
    const { w, k } = inDenKrieg("SYR", "schutz");
    k.phase = "waffenruhe";
    k.seit = w.day;
    k.front = 70;
    k.uhrGegner = 20;
    k.uhr = 90;
    const r = fuehreKriegHandlungAus(w, k.id, "paket_ausgewogen");
    expect(r.ok, r.text).toBe(true);
    expect(k.phase).toBe("frieden");
    expect(k.koalition!.partner).toHaveLength(0);
  });
});

describe("Handlung „Bündnispartner um Beistand bitten“", () => {
  test("Zögernde Partner der Türkei können bewegt werden; die Bitte hat Preis und Abkühlung", () => {
    const { w, k } = inDenKrieg("IRN", "revision");
    const ko = k.koalition!;
    // Türkei als Angreifer: USA und andere Staaten zögern, aber Pflicht besteht nicht
    const h = handlungenFuer(w, k.id).find((x) => x.id === "koalition_rufen");
    if (!h) {
      // Niemand zögert in diesem Aufbau: Dann ist die Handlung nicht im Angebot
      expect(ko.abwesend.filter((a) => a.seite === "eigen")).toHaveLength(0);
      return;
    }
    expect(h.pk).toBe(6);
    expect(h.moeglich).toBe(true);
    const vorher = ko.partner.length;
    const r = fuehreKriegHandlungAus(w, k.id, "koalition_rufen");
    expect(r.ok, r.text).toBe(true);
    expect(k.koalition!.gerufen).toBe(w.day);
    expect(k.koalition!.partner.length).toBeGreaterThanOrEqual(vorher);
    // Zweite Bitte am selben Tag: gesperrt
    const h2 = handlungenFuer(w, k.id).find((x) => x.id === "koalition_rufen");
    if (h2) expect(h2.moeglich).toBe(false);
  });
});

describe("Beistandsvorgang", () => {
  test("Ein Pakt-Partner ist Opfer: Es entsteht ein Vorgang in der Drohkulisse mit Rahmung Beistand und dem Partner an der Seite", () => {
    const w = welt();
    expect(beistandVorgangGrund(w, "IRN")).toBeUndefined();
    const r = eroeffneBeistandsVorgang(w, "IRN", "SAU", "mekka");
    expect(r.ok, r.text).toBe(true);
    const k = kriegMit(w, "IRN")!;
    expect(k.phase).toBe("drohkulisse");
    expect(k.rahmung).toBe("beistand");
    expect(k.kriegszielDeklariert).toBe(true);
    expect(k.beistandFuer).toEqual({ partner: "SAU", pakt: "mekka" });
    expect(k.koalition!.partner[0]).toMatchObject({ id: "SAU", seite: "eigen", pflicht: true, pakt: "mekka" });
    // Ein zweiter Vorgang mit demselben Land ist nicht möglich
    expect(beistandVorgangGrund(w, "IRN")).toMatch(/läuft schon/);
    // Gegen einen Angreifer ohne eigene Akte gibt es nur Material
    expect(beistandVorgangGrund(w, "IND")).toMatch(/Material und Diplomatie/);
    // Der Einsatzbeschluss bleibt Entscheidung: kein automatischer Krieg
    expect(aktiveKriege(w)).toHaveLength(1);
    expect(handlungenFuer(w, k.id).some((x) => x.id === "beschluss" && x.moeglich)).toBe(true);
  });

  test("Die Grenze von zwei aktiven Vorgängen gilt auch für den Beistand", () => {
    const w = welt();
    expect(eroeffneBeistandsVorgang(w, "IRN", "SAU", "mekka").ok).toBe(true);
    expect(eroeffneBeistandsVorgang(w, "SYR", "SAU", "mekka").ok).toBe(true);
    expect(aktiveKriege(w)).toHaveLength(KRIEG.maxAktiv);
    expect(eroeffneBeistandsVorgang(w, "IRQ", "SAU", "mekka").ok).toBe(false);
  });
});

describe("Kriege zwischen anderen Staaten", () => {
  test("Ausgangslage: Russland–Ukraine und Iran–Israel (mit den USA) laufen, Armenien–Aserbaidschan nicht", () => {
    const w = welt();
    const k = drittKriege(w);
    const ids = k.map((x) => `${x.a}-${x.b}`);
    expect(ids).toEqual(expect.arrayContaining(["RUS-UKR", "IRN-ISR"]));
    expect(ids).not.toContain("ARM-AZE");
    const iran = k.find((x) => x.a === "IRN")!;
    expect(iran.seiteB).toEqual(expect.arrayContaining(["ISR", "USA"]));
    expect(iran.anlass).toBe("ausgangslage");
    expect(iran.seitText).toMatch(/2026/);
    const ru = k.find((x) => x.a === "RUS")!;
    expect(ru.angreifer).toBe("a");
    expect(ru.vermittlung).toBe("ukr_rus");
    // Ausgangslage heißt: Die Wirkungen auf die Türkei zählen erst über die Startintensität hinaus
    expect(ru.intensitaetStart).toBe(ru.intensitaet);
  });

  test("Kriege großer Mächte untereinander sind keine Kandidaten", () => {
    const grosse = new Set(["USA", "EU", "RUS", "CHN"]);
    for (const p of KRIEGSPAARE) expect(grosse.has(p.a) && grosse.has(p.b), `${p.a}-${p.b}`).toBe(false);
  });

  test("Ein Paar über der Schwelle zündet über die Monate, meldet es und endet, wenn die Spannung fällt", () => {
    let gezuendet = 0;
    for (const seed of [3, 7, 11, 19]) {
      const w = welt(seed);
      weltModell(w);
      drittKriege(w);
      const m = weltModell(w);
      let k = null as ReturnType<typeof drittKriege>[number] | null;
      for (let i = 0; i < 40 && !k; i++) {
        setzePaar(m, "ISR", "SYR", { spannung: 100 });
        monat(w);
        k = drittKriege(w).find((x) => x.a === "ISR" && x.b === "SYR") ?? null;
      }
      if (!k) continue;
      gezuendet++;
      expect(k.anlass).toBe("spannung");
      expect(k.intensitaetStart).toBe(0);
      expect(weltModell(w).nachrichten.some((n) => n.art === "krieg" && n.gegen === "SYR")).toBe(true);
      // Entspannung: Spannung auf null → der Krieg klingt ab
      for (let i = 0; i < 12 && k.ende === undefined; i++) {
        setzePaar(m, "ISR", "SYR", { spannung: -100 });
        monat(w);
      }
      expect(k.ende, "Krieg endet mit der Spannung").toBeDefined();
      expect(["abklingen", "erschoepfung"]).toContain(k.ausgang);
      expect(drittKriege(w).includes(k)).toBe(false);
      expect(weltModell(w).nachrichten.some((n) => n.art === "waffenstillstand")).toBe(true);
    }
    expect(gezuendet, "mindestens ein Seed zündet bei Dauerspannung 100").toBeGreaterThan(0);
  });

  test("Pakt-Partner des Opfers treten bei: Pakistan stellt sich im Mekka-Pakt an die Seite Saudi-Arabiens", () => {
    let beigetreten = 0;
    for (const seed of [3, 7, 11, 19, 23]) {
      const w = welt(seed);
      drittKriege(w);
      const m = weltModell(w);
      // Pakistan ist in diesem Test handlungsfähig (die Beitrittsrechnung zieht Instabilität und eigene Kriegslast ab)
      m.laender["PAK"]!.stabilitaet = 60;
      m.laender["PAK"]!.krieg = 10;
      m.kriege!.push({ id: "dk-test", a: "IRN", b: "SAU", seiteA: ["IRN"], seiteB: ["SAU"], angreifer: "a", anlass: "spannung", seit: w.day, intensitaet: 85, intensitaetStart: 0, beitritte: [] });
      for (let i = 0; i < 12; i++) {
        setzePaar(m, "IRN", "SAU", { spannung: 100 });
        monat(w);
        w.spiel!.ereignisse = [];
      }
      const k = m.kriege!.find((x) => x.id === "dk-test")!;
      if (k.seiteB.includes("PAK")) {
        beigetreten++;
        const b = k.beitritte.find((x) => x.id === "PAK")!;
        expect(b.pakt).toBe("mekka");
        expect(b.seite).toBe("b");
      }
      expect(k.seiteB.length + k.seiteA.length).toBeLessThanOrEqual(2 + DRITTKRIEG.maxKrieg);
    }
    expect(beigetreten).toBeGreaterThan(0);
  });

  test("Ein Pakt-Partner ohne Opferrolle tritt nicht aus Pflicht bei", () => {
    // Greift Saudi-Arabien den Iran an, ist der Iran kein Pakt-Mitglied mit Klausel: niemand wird zur Pflicht gerufen
    const w = welt();
    drittKriege(w);
    const m = weltModell(w);
    m.kriege!.push({ id: "dk-test", a: "IRN", b: "SAU", seiteA: ["IRN"], seiteB: ["SAU"], angreifer: "b", anlass: "spannung", seit: w.day, intensitaet: 85, intensitaetStart: 0, beitritte: [] });
    for (let i = 0; i < 12; i++) {
      setzePaar(m, "IRN", "SAU", { spannung: 100 });
      monat(w);
      w.spiel!.ereignisse = [];
    }
    const k = m.kriege!.find((x) => x.id === "dk-test")!;
    // Der Angreifer ist Saudi-Arabien: Der Mekka-Pakt verpflichtet Pakistan nicht
    expect(k.beitritte.filter((x) => x.pakt === "mekka")).toHaveLength(0);
  });
});

describe("Beistandsruf", () => {
  function mitRuf(seed = 6): { w: World; ev: NonNullable<World["spiel"]>["ereignisse"][number] } {
    const w = welt(seed);
    drittKriege(w);
    const m = weltModell(w);
    m.kriege!.push({ id: "dk-test", a: "IRN", b: "SAU", seiteA: ["IRN"], seiteB: ["SAU"], angreifer: "a", anlass: "spannung", seit: w.day, intensitaet: 85, intensitaetStart: 0, beitritte: [] });
    setzePaar(m, "IRN", "SAU", { spannung: 100 });
    for (let i = 0; i < 4 && !w.spiel!.ereignisse.some((e) => e.vorlage === "krieg_beistandsruf"); i++) {
      setzePaar(m, "IRN", "SAU", { spannung: 100 });
      monat(w);
    }
    const ev = w.spiel!.ereignisse.find((e) => e.vorlage === "krieg_beistandsruf");
    expect(ev, "der Beistandsruf liegt als Entscheidung auf dem Tisch").toBeDefined();
    return { w, ev: ev! };
  }

  test("Wird ein Pakt-Partner angegriffen, kommt der Ruf einmal und mit drei Antworten", () => {
    const { w, ev } = mitRuf();
    expect(ev.daten).toMatchObject({ partner: "SAU", gegner: "IRN", pakt: "mekka" });
    expect(weltModell(w).rufe!["dk-test|mekka"]).toBe(w.day);
    // Nicht doppelt: weitere Monate öffnen keinen zweiten
    w.spiel!.ereignisse = w.spiel!.ereignisse.filter((e) => e !== ev);
    for (let i = 0; i < 3; i++) {
      setzePaar(weltModell(w), "IRN", "SAU", { spannung: 100 });
      monat(w);
    }
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "krieg_beistandsruf")).toBe(false);
  });

  test("Truppen: ein Vorgang gegen den Angreifer mit Rahmung Beistand entsteht", () => {
    const { w, ev } = mitRuf();
    const r = entscheide(w, ev.id, "truppen", new Rng(2));
    expect(r.ok, r.text).toBe(true);
    const k = kriegMit(w, "IRN")!;
    expect(k.rahmung).toBe("beistand");
    expect(k.koalition!.partner.some((p) => p.id === "SAU" && p.pflicht)).toBe(true);
  });

  test("Material: Vertrauen und Sicherheit des Partners steigen, es entsteht kein Vorgang", () => {
    const { w, ev } = mitRuf();
    const vorher = beziehungZurTuerkei(w, "SAU");
    const r = entscheide(w, ev.id, "material", new Rng(2));
    expect(r.ok, r.text).toBe(true);
    const nachher = beziehungZurTuerkei(w, "SAU");
    expect(nachher.vertrauen).toBeGreaterThan(vorher.vertrauen);
    expect(nachher.sicherheit).toBeGreaterThan(vorher.sicherheit);
    expect(kriegMit(w, "IRN")).toBeUndefined();
  });

  test("Verweigern kostet Vertrauen und zählt einen Verstoß gegen den Vertrag mit Beistandsklausel; Schweigen kostet mehr", () => {
    const { w, ev } = mitRuf();
    const v = laufende(w, "SAU").find((x) => x.gibt.includes("beistand"))!;
    expect(v, "Der Mekka-Vertrag läuft in der Ausgangslage").toBeDefined();
    const vorher = beziehungZurTuerkei(w, "SAU").vertrauen;
    const r = entscheide(w, ev.id, "verweigern", new Rng(2));
    expect(r.ok, r.text).toBe(true);
    expect(beziehungZurTuerkei(w, "SAU").vertrauen).toBeLessThan(vorher - 5);
    expect(v.verstoesse).toBe(1);
    expect(v.status).toBe("laeuft");

    // Schweigen (Standardfolge nach der Frist) kostet mehr als die offene Ablehnung
    const a = mitRuf(7);
    const b = mitRuf(7);
    const start = beziehungZurTuerkei(a.w, "SAU").vertrauen;
    entscheide(a.w, a.ev.id, "verweigern", new Rng(2));
    const nachAblehnung = beziehungZurTuerkei(a.w, "SAU").vertrauen;
    expect(beziehungZurTuerkei(b.w, "SAU").vertrauen).toBe(start);
    const text = vorlage("krieg_beistandsruf").standard(b.w, b.ev, new Rng(2));
    expect(text).toMatch(/unbeantwortet/);
    expect(beziehungZurTuerkei(b.w, "SAU").vertrauen).toBeLessThan(nachAblehnung);
  });

  test("Zwei Verstöße brechen den Vertrag und die Erinnerung an den Bruch bleibt", () => {
    const { w, ev } = mitRuf();
    const v = laufende(w, "SAU").find((x) => x.gibt.includes("beistand"))!;
    v.verstoesse = 1;
    entscheide(w, ev.id, "verweigern", new Rng(2));
    expect(v.status).toBe("gebrochen");
    expect(weltZustand(w)["SAU"]!.bruch ?? 0).toBeGreaterThan(0);
  });
});

describe("Speicherkompatibilität: ältere Spielstände", () => {
  const datei = `${homedir()}/Downloads/staatsraeson_2029-11-20.json`;

  test.skipIf(!existsSync(datei))("Der Stand vom 20.11.2029 (ohne Weltmodell, mit Spannungsvorgang Israel) lädt und läuft 24 Monate (Datei nur gelesen)", () => {
    const d = JSON.parse(readFileSync(datei, "utf8")) as { welt: unknown };
    const w = load(JSON.stringify(d.welt));
    expect(w.spiel!.weltmodell).toBeUndefined();
    const israel = w.spiel!.kriege!.find((k) => k.land === "ISR")!;
    expect(israel.koalition).toBeUndefined();
    // Die Vorschau für den laufenden Vorgang funktioniert ohne gespeicherte Koalition
    const sicht = koalitionenIn(w, israel.id);
    expect(sicht.aggressor === "gegner" || sicht.aggressor === "tuerkei").toBe(true);
    expect(Number.isFinite(eigenStaerke(w, israel))).toBe(true);
    expect(Number.isFinite(gegnerStaerke(w, "ISR"))).toBe(true);
    // Die Kriege zwischen Dritten entstehen beim ersten Zugriff aus dem Stand
    expect(drittKriege(w).map((k) => `${k.a}-${k.b}`)).toEqual(expect.arrayContaining(["RUS-UKR"]));
    for (let i = 0; i < 24; i++) {
      advance(w, 30);
      w.spiel!.ereignisse = [];
      if (w.spiel!.ende) break;
    }
    const m = weltModell(w);
    expect(Array.isArray(m.kriege)).toBe(true);
    for (const k of m.kriege!) {
      expect(Number.isFinite(k.intensitaet)).toBe(true);
      expect(k.intensitaet).toBeGreaterThanOrEqual(0);
      expect(k.intensitaet).toBeLessThanOrEqual(100);
    }
    expect(Number.isFinite(w.economy.inflation)).toBe(true);
    expect(Number.isFinite(w.spiel!.umfrage.zustimmung)).toBe(true);
    for (const k of kriege(w)) {
      expect(Number.isFinite(k.front)).toBe(true);
      expect(Number.isFinite(k.uhr)).toBe(true);
    }
  });

  test("Ein Vorgang ohne Koalition mitten im Krieg läuft weiter (Vorschau, Wochenschritt, Friedenspaket)", () => {
    const { w, k } = inDenKrieg("SYR", "schutz");
    delete k.koalition;
    for (let i = 0; i < 4; i++) advance(w, 7);
    expect(k.phase).toBe("krieg");
    expect(Number.isFinite(k.front)).toBe(true);
    expect(Number.isFinite(paketAnnahme(w, k, PAKETE.paket_ausgewogen!.paket(k.front)))).toBe(true);
  });
});

describe("Kalibrierung: kein Weltkrieg im Standardlauf", () => {
  test("Über mehrere Seeds und die ganze Amtszeit: wenige neue Kriege, die Ausgangslage bleibt, Beitritte begrenzt", () => {
    let neu = 0;
    let beitritte = 0;
    let rufe = 0;
    const seeds = [3, 7, 11, 19, 23, 29, 31, 37];
    for (const seed of seeds) {
      const w = createWorld(turkey2026, seed);
      startAfterElection(w, schnellProfil());
      w.spiel!.kapital = 200;
      for (let j = 0; j < 8 && !w.spiel!.ende; j++) {
        advance(w, 365);
        w.spiel!.ereignisse = [];
      }
      const k = drittKriege(w, true);
      const n = k.filter((x) => x.anlass === "spannung").length;
      expect(n, `Seed ${seed}`).toBeLessThanOrEqual(4);
      expect(drittKriege(w).length, `Seed ${seed}: gleichzeitig laufende Kriege`).toBeLessThanOrEqual(5);
      // Ohne Vermittlung bleiben die Kriege der Ausgangslage, wie es die Vermittlung vorgibt
      expect(drittKriege(w).map((x) => `${x.a}-${x.b}`)).toEqual(expect.arrayContaining(["RUS-UKR", "IRN-ISR"]));
      neu += n;
      beitritte += k.reduce((s, x) => s + x.beitritte.filter((y) => y.pakt).length, 0);
      rufe += Object.keys(weltModell(w).rufe ?? {}).length;
      // Die Beteiligten bleiben Teilmenge der Akteure
      for (const x of k) {
        expect(x.seiteA).toContain(x.a);
        expect(x.seiteB).toContain(x.b);
        expect(new Set([...x.seiteA, ...x.seiteB]).size).toBe(x.seiteA.length + x.seiteB.length);
      }
    }
    expect(neu).toBeLessThanOrEqual(seeds.length * 2);
    expect(beitritte).toBeLessThanOrEqual(neu * DRITTKRIEG.maxKrieg);
    expect(rufe).toBeLessThanOrEqual(neu);
  });

  test("Die Spannung des Paares bleibt im Bereich, der Krieg macht die Beteiligten nicht unbegrenzt belastet", () => {
    const w = welt(19);
    drittKriege(w);
    const m = weltModell(w);
    m.kriege!.push({ id: "dk-test", a: "ISR", b: "SYR", seiteA: ["ISR"], seiteB: ["SYR"], anlass: "spannung", seit: w.day, intensitaet: 80, intensitaetStart: 0, beitritte: [] });
    for (let i = 0; i < 24; i++) {
      monat(w);
      const v = paarVon(w, "ISR", "SYR");
      expect(v.spannung).toBeGreaterThanOrEqual(0);
      expect(v.spannung).toBeLessThanOrEqual(100);
    }
    for (const id of ["ISR", "SYR"]) {
      const e = weltModell(w).laender[id]!;
      expect(e.krieg).toBeLessThanOrEqual(100);
      expect(Number.isFinite(e.stabilitaet)).toBe(true);
    }
  });
});

void kriegMonat;
