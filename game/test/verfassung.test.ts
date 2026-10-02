// Die Verfassungsreform als mehrstufiger Vorgang (REC-1): Hürden 301/360, Verfassungsgericht nach
// Sitze-Stand, Referendum als Mini-Wahl, Gegenreaktion, Einmaligkeit je Amtszeit, Sperrfristen,
// Migration und Determinismus.

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { Rng } from "../src/sim/rng";
import { nationalAverage } from "../src/sim/netz";
import { NET } from "../src/sim/modell";
import { befehl } from "../src/sim/befehle";
import { entscheide } from "../src/sim/ereignisse";
import { reichZustand } from "../src/sim/reich";
import { dimensionZu } from "../src/sim/laender";
import {
  ARTIKEL,
  VERFASSUNG_REGELN,
  amtszeitBelegt,
  artikelSperre,
  autoritaerScore,
  aymEntscheiden,
  aymSicht,
  bringeVerfassungEin,
  geaenderteArtikel,
  kampagnenImpuls,
  paketSalienz,
  paketStimmen,
  paketVervollstaendigen,
  pruefeVerfassung,
  referendumAuszaehlen,
  referendumPrognose,
  statusQuoVon,
  verfassungAbstimmen,
  verfassungAktiv,
  verfassungKapitalAbzug,
  verfassungsZustand,
  zieheVerfassungZurueck,
} from "../src/sim/verfassung";
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

/** Autoritäres Paket (zwei Artikel, Score 4) und demokratisierendes Paket (zwei Artikel, Score −2). */
const AUTORITAER = { wahlrecht: "zehn", notstand: "weit" };
const DEMOKRATISCH = { wahlrecht: "fuenf", justiz: "acht_sieben" };

/** Bringt ein Paket ein und setzt die Prognose exakt auf ein Stimmen-Ziel (test-seitige Justierung über Absprachen). */
function einbringenMitZiel(w: World, paket: Record<string, string>, zielStimmen: number) {
  const r = bringeVerfassungEin(w, paket);
  expect(r.ok).toBe(true);
  const v = verfassungsZustand(w).laufend!;
  const basis = paketStimmen(w, v.paket, 0).erwartet;
  v.absprachen = zielStimmen - basis;
  return v;
}

// ---------------------------------------------------------------------------

describe("Paket und Werkstatt", () => {
  test("Katalog: fünf Artikel, je zwei bis drei Varianten, jeder mit genau einem Status quo", () => {
    expect(ARTIKEL).toHaveLength(5);
    for (const a of ARTIKEL) {
      expect(a.varianten.length).toBeGreaterThanOrEqual(2);
      expect(a.varianten.length).toBeLessThanOrEqual(3);
      expect(a.varianten.filter((v) => v.statusQuo)).toHaveLength(1);
      expect(statusQuoVon(a.id)).toBeTruthy();
    }
  });

  test("Vervollständigen füllt fehlende Artikel mit dem Status quo; der Score folgt den Varianten", () => {
    const p = paketVervollstaendigen(AUTORITAER);
    expect(geaenderteArtikel(p)).toHaveLength(2);
    expect(autoritaerScore(p)).toBe(4);
    expect(autoritaerScore(paketVervollstaendigen(DEMOKRATISCH))).toBe(-2);
    expect(autoritaerScore(paketVervollstaendigen({}))).toBe(0);
  });

  test("Ein Paket ohne Änderung lässt sich nicht einbringen; Kosten wachsen je Artikel", () => {
    const w = neueWelt();
    expect(pruefeVerfassung(w, {}).ok).toBe(false);
    const eins = pruefeVerfassung(w, { wahlrecht: "fuenf" });
    const zwei = pruefeVerfassung(w, DEMOKRATISCH);
    expect(eins.ok).toBe(true);
    expect(eins.pk).toBe(VERFASSUNG_REGELN.pkBasis + VERFASSUNG_REGELN.pkJeArtikel);
    expect(zwei.pk).toBe(VERFASSUNG_REGELN.pkBasis + 2 * VERFASSUNG_REGELN.pkJeArtikel);
  });

  test("Einbringen zahlt Kapital, terminiert die Abstimmung und legt die Amtszeit fest", () => {
    const w = neueWelt();
    const kapitalVorher = w.spiel!.kapital;
    const pr = pruefeVerfassung(w, DEMOKRATISCH);
    const r = bringeVerfassungEin(w, DEMOKRATISCH);
    expect(r.ok).toBe(true);
    const v = verfassungsZustand(w).laufend!;
    expect(w.spiel!.kapital).toBeCloseTo(kapitalVorher - pr.pk, 5);
    expect(v.abstimmung).toBe(w.day + VERFASSUNG_REGELN.tageBisAbstimmung);
    expect(v.phase).toBe("parlament");
    expect(amtszeitBelegt(w)).toBe(true);
    // Solange der Vorgang läuft, ist kein zweiter möglich
    expect(pruefeVerfassung(w, AUTORITAER).ok).toBe(false);
  });

  test("Parser: „Verfassungsänderung einbringen“ schnürt das Paket und bringt es ein", () => {
    const w = neueWelt();
    const r = befehl("Verfassungsänderung einbringen: Wahlhürde auf fünf Prozent", w);
    expect(r.ok).toBe(true);
    const v = verfassungsZustand(w).laufend!;
    expect(v.paket.wahlrecht).toBe("fuenf");
    const z = befehl("Verfassungspaket zurückziehen", w);
    expect(z.ok).toBe(true);
    expect(verfassungsZustand(w).laufend).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------

describe("Hürden im Parlament", () => {
  test("Ab 360 Ja-Stimmen wird das Paket direkt Gesetz", () => {
    const w = neueWelt(5);
    einbringenMitZiel(w, DEMOKRATISCH, 380);
    const r = verfassungAbstimmen(w, new Rng(11));
    expect(r.ja).toBeGreaterThanOrEqual(VERFASSUNG_REGELN.direkt);
    expect(r.weg).toBe("direkt");
  });

  test("Zwischen 301 und 359 führt nur das Referendum weiter", () => {
    const w = neueWelt(6);
    einbringenMitZiel(w, DEMOKRATISCH, 330);
    const r = verfassungAbstimmen(w, new Rng(11));
    expect(r.ja).toBeGreaterThanOrEqual(VERFASSUNG_REGELN.mehrheit);
    expect(r.ja).toBeLessThan(VERFASSUNG_REGELN.direkt);
    expect(r.weg).toBe("referendum");
    const v = verfassungsZustand(w).laufend;
    // Ohne Anfechtung beginnt die Kampagne, mit Anfechtung geht es zuerst zum Gericht
    expect(v?.phase === "kampagne" || v?.phase === "aym").toBe(true);
  });

  test("Unter 301 scheitert das Paket: Kapital teilweise verbrannt, Vertrauen sinkt, Artikel zwölf Monate gesperrt", () => {
    const w = neueWelt(7);
    const kapitalVorher = w.spiel!.kapital;
    const vertrauenVorher = nationalAverage(NET, w.net, "vertrauen_regierung");
    const v = einbringenMitZiel(w, DEMOKRATISCH, 280);
    const r = verfassungAbstimmen(w, new Rng(11));
    expect(r.weg).toBe("gescheitert");
    const z = verfassungsZustand(w);
    expect(z.laufend).toBeUndefined();
    // Verbrannt: es kommt nur der Scheitern-Anteil zurück
    expect(w.spiel!.kapital).toBeCloseTo(kapitalVorher - v.pk + Math.floor(v.pk * VERFASSUNG_REGELN.scheiternZurueck), 5);
    expect(nationalAverage(NET, w.net, "vertrauen_regierung")).toBeLessThan(vertrauenVorher);
    // Sperrfrist für die geänderten Artikel
    for (const x of geaenderteArtikel(DEMOKRATISCH)) {
      expect(artikelSperre(w, x.artikel.id)).toBe(w.day + VERFASSUNG_REGELN.sperrTage);
    }
    // Dieselben Artikel sind gesperrt, ein anderes Paket ohne sie wäre es nicht (nur die Amtszeit-Regel greift)
    const pr = pruefeVerfassung(w, DEMOKRATISCH);
    expect(pr.ok).toBe(false);
    expect(pr.grund).toMatch(/Amtszeit|gesperrt/);
    expect(z.historie[z.historie.length - 1]!.ausgang).toMatch(/gescheitert/);
  });
});

// ---------------------------------------------------------------------------

describe("Verfassungsgericht folgt dem Sitze-Stand", () => {
  test("Die Kassationswahrscheinlichkeit steigt mit unabhängigen und reformorientierten Sitzen und mit autoritärem Paket", () => {
    const w = neueWelt();
    const reich = reichZustand(w);
    const basis = aymSicht(w, AUTORITAER);
    expect(basis.sitze).toEqual({ loyal: 9, unabhaengig: 3, reform: 3 });
    reich.sitze.aym = { loyal: 3, unabhaengig: 7, reform: 5 };
    const reformiert = aymSicht(w, AUTORITAER);
    expect(reformiert.pKassation).toBeGreaterThan(basis.pKassation);
    // Demokratisierende Pakete werden seltener kassiert als autoritäre bei gleichem Gericht
    expect(aymSicht(w, DEMOKRATISCH).pKassation).toBeLessThan(aymSicht(w, AUTORITAER).pKassation);
    // Schranken der Wahrscheinlichkeit
    reich.sitze.aym = { loyal: 15, unabhaengig: 0, reform: 0 };
    expect(aymSicht(w, AUTORITAER).pKassation).toBeLessThanOrEqual(0.1);
    reich.sitze.aym = { loyal: 0, unabhaengig: 5, reform: 10 };
    expect(aymSicht(w, AUTORITAER).pKassation).toBeGreaterThan(0.4);
  });

  test("Kassation: Paket tot, Groll, Sperrfristen; Annahme: der Weg ist frei", () => {
    // Ein reformiertes Gericht kassiert in Serie deutlich öfter als ein loyales
    const zaehle = (sitze: { loyal: number; unabhaengig: number; reform: number }): number => {
      let n = 0;
      for (let s = 1; s <= 30; s++) {
        const w = neueWelt(s);
        reichZustand(w).sitze.aym = { ...sitze };
        einbringenMitZiel(w, AUTORITAER, 380);
        verfassungAbstimmen(w, new Rng(3));
        const z = verfassungsZustand(w);
        if (!z.laufend) continue; // ohne Anfechtung schon beschlossen
        z.laufend.phase = "aym";
        z.laufend.aymTag = w.day;
        if (aymEntscheiden(w, new Rng(s * 31)).kassiert) n++;
      }
      return n;
    };
    const loyal = zaehle({ loyal: 15, unabhaengig: 0, reform: 0 });
    const reform = zaehle({ loyal: 0, unabhaengig: 5, reform: 10 });
    expect(reform).toBeGreaterThan(loyal + 3);
    expect(loyal).toBeLessThanOrEqual(4);

    // Einzelner Kassationsfall: Paket tot, Polarisierung hoch, Artikel gesperrt
    const w = neueWelt(9);
    reichZustand(w).sitze.aym = { loyal: 0, unabhaengig: 0, reform: 15 };
    einbringenMitZiel(w, AUTORITAER, 380);
    const polarVorher = nationalAverage(NET, w.net, "polarisierung");
    // Mit reformorientiertem Vollgericht liegt die Wahrscheinlichkeit hoch; Seeds bis zur Kassation drehen
    let kassiert = false;
    for (let s = 1; s <= 40 && !kassiert; s++) {
      const kopie = neueWelt(9);
      reichZustand(kopie).sitze.aym = { loyal: 0, unabhaengig: 0, reform: 15 };
      einbringenMitZiel(kopie, AUTORITAER, 380);
      verfassungAbstimmen(kopie, new Rng(3));
      const z = verfassungsZustand(kopie);
      if (!z.laufend) continue;
      z.laufend.phase = "aym";
      z.laufend.aymTag = kopie.day;
      const r = aymEntscheiden(kopie, new Rng(s * 7));
      if (r.kassiert) {
        kassiert = true;
        expect(z.laufend).toBeUndefined();
        expect(nationalAverage(NET, kopie.net, "polarisierung")).toBeGreaterThan(polarVorher);
        expect(artikelSperre(kopie, "wahlrecht")).toBeGreaterThan(kopie.day);
        expect(z.historie[z.historie.length - 1]!.ausgang).toMatch(/kassiert/);
      }
    }
    expect(kassiert).toBe(true);
    void w;
  });
});

// ---------------------------------------------------------------------------

describe("Referendum als Mini-Wahl", () => {
  function inDieKampagne(w: World, paket: Record<string, string>, zielStimmen = 330) {
    const v = einbringenMitZiel(w, paket, zielStimmen);
    v.phase = "kampagne";
    v.ja = zielStimmen;
    v.referendumTag = w.day + VERFASSUNG_REGELN.kampagnenTage;
    return v;
  }

  test("Die Prognose setzt sich aus Zustimmung, Themen-Salienz und Kampagne zusammen", () => {
    const w = neueWelt();
    w.spiel!.umfrage.zustimmung = 55;
    inDieKampagne(w, DEMOKRATISCH);
    const sal = paketSalienz(paketVervollstaendigen(DEMOKRATISCH));
    const p = referendumPrognose(w)!;
    expect(p.mitte).toBeCloseTo(55 + sal.summe, 5);
    expect(p.kampagne).toBe(0);
    // Kampagne: Kapital fließt, die Mitte steigt, die Abkühlzeit greift
    const kapitalVorher = w.spiel!.kapital;
    const r = kampagnenImpuls(w);
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(kapitalVorher - VERFASSUNG_REGELN.kampagnePk);
    const p2 = referendumPrognose(w)!;
    expect(p2.kampagne).toBeGreaterThan(0);
    expect(p2.mitte).toBeGreaterThan(p.mitte);
    expect(kampagnenImpuls(w).ok).toBe(false); // Abkühlzeit
    // Gruppen-Beiträge folgen den Wähler-Reaktionen der Artikel
    const minderheiten = p.gruppen.find((g) => g.id === "minderheiten")!;
    expect(minderheiten.beitrag).toBeGreaterThan(0);
  });

  test("Ja bei hoher Zustimmung: Das Paket tritt in Kraft, demokratisierend kostet es laufend Kapital", () => {
    const w = neueWelt(12);
    w.spiel!.umfrage.zustimmung = 80;
    inDieKampagne(w, DEMOKRATISCH);
    const r = referendumAuszaehlen(w, new Rng(5));
    expect(r.anteil).toBeGreaterThanOrEqual(50);
    expect(r.ja).toBe(true);
    const z = verfassungsZustand(w);
    expect(z.laufend).toBeUndefined();
    expect(verfassungAktiv(w, "wahlrecht")).toBe("fuenf");
    expect(verfassungAktiv(w, "justiz")).toBe("acht_sieben");
    // Währungs-Ersatz light: demokratisierende Verfassung kostet laufend Politisches Kapital
    expect(verfassungKapitalAbzug(w)).toBeGreaterThan(0);
    // Die Gerichtsbesetzung ist dem Parlament näher gerückt
    const sitze = reichZustand(w).sitze.aym!;
    expect(sitze.loyal).toBeLessThan(9);
  });

  test("Nein bei niedriger Zustimmung: schwerer Vertrauensverlust, gestärkte Opposition, Sperrfristen", () => {
    const w = neueWelt(13);
    w.spiel!.umfrage.zustimmung = 20;
    inDieKampagne(w, AUTORITAER);
    const vertrauenVorher = nationalAverage(NET, w.net, "vertrauen_regierung");
    const bereitVorher = { ...w.spiel!.fraktionen };
    const r = referendumAuszaehlen(w, new Rng(5));
    expect(r.ja).toBe(false);
    const z = verfassungsZustand(w);
    expect(z.laufend).toBeUndefined();
    expect(nationalAverage(NET, w.net, "vertrauen_regierung")).toBeLessThan(vertrauenVorher - 3);
    expect(w.spiel!.umfrage.zustimmung).toBeLessThan(20);
    // Die Opposition geht gestärkt aus der Nacht
    const eineOpposition = Object.keys(w.parliament!.seats).find((p) => p !== "PW" && !w.spiel!.lager.includes(p) && (w.parliament!.seats[p] ?? 0) > 10)!;
    const jetzt = w.spiel!.fraktionen?.[eineOpposition]?.bereitschaft;
    if (jetzt !== undefined && bereitVorher[eineOpposition]) expect(jetzt).toBeLessThan(bereitVorher[eineOpposition]!.bereitschaft);
    expect(artikelSperre(w, "wahlrecht")).toBeGreaterThan(w.day);
    expect(z.historie[z.historie.length - 1]!.ausgang).toMatch(/abgelehnt/);
    // Ein Hinweis auf die Referendum-Nacht liegt vor
    expect(w.spiel!.hinweise.some((h) => h.szene === "wahlnacht")).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe("Gegenreaktion", () => {
  test("Autoritäres Paket: Proteste, Straßburg, EU-Misstrauen und nervöse Märkte", () => {
    const w = neueWelt(14);
    w.spiel!.umfrage.zustimmung = 80;
    const euVorher = dimensionZu(w, "EU", "vertrauen");
    const risikoVorher = w.economy.riskPremium;
    const strassburgVorher = nationalAverage(NET, w.net, "strassburg_druck");
    const v = einbringenMitZiel(w, AUTORITAER, 330);
    v.phase = "kampagne";
    v.ja = 330;
    v.referendumTag = w.day;
    const r = referendumAuszaehlen(w, new Rng(5));
    expect(r.ja).toBe(true);
    // Protest-Ereignis ist auf dem Tisch
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "verfassung_proteste")).toBe(true);
    expect(nationalAverage(NET, w.net, "strassburg_druck")).toBeGreaterThan(strassburgVorher);
    expect(dimensionZu(w, "EU", "vertrauen")).toBeLessThan(euVorher);
    expect(w.economy.riskPremium).toBeGreaterThan(risikoVorher);
  });

  test("Demokratisierendes Paket: Legitimität und EU-Vertrauen wachsen, keine Proteste", () => {
    const w = neueWelt(15);
    w.spiel!.umfrage.zustimmung = 80;
    const euVorher = dimensionZu(w, "EU", "vertrauen");
    const legitVorher = nationalAverage(NET, w.net, "legitimitaet");
    const v = einbringenMitZiel(w, { wahlrecht: "fuenf", notstand: "eng" }, 330);
    v.phase = "kampagne";
    v.ja = 330;
    v.referendumTag = w.day;
    referendumAuszaehlen(w, new Rng(5));
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "verfassung_proteste")).toBe(false);
    expect(nationalAverage(NET, w.net, "legitimitaet")).toBeGreaterThan(legitVorher);
    expect(dimensionZu(w, "EU", "vertrauen")).toBeGreaterThan(euVorher);
  });
});

// ---------------------------------------------------------------------------

describe("Einmaligkeit und Verlauf des Vorgangs", () => {
  test("Eine Verfassungsfrage je Amtszeit — auch nach Rückzug; die nächste Amtszeit fragt neu", () => {
    const w = neueWelt();
    bringeVerfassungEin(w, DEMOKRATISCH);
    const r = zieheVerfassungZurueck(w);
    expect(r.ok).toBe(true);
    const pr = pruefeVerfassung(w, AUTORITAER);
    expect(pr.ok).toBe(false);
    expect(pr.grund).toMatch(/Amtszeit/);
    // Nach der Wiederwahl trägt das Land eine neue Frage
    w.spiel!.amtszeit = 2;
    expect(pruefeVerfassung(w, AUTORITAER).ok).toBe(true);
  });

  test("Der tägliche Lauf öffnet die Stufen-Ereignisse zum Termin (Auto-Stopp über den Ereignismotor)", () => {
    const w = neueWelt(21);
    einbringenMitZiel(w, DEMOKRATISCH, 380);
    advance(w, VERFASSUNG_REGELN.tageBisAbstimmung);
    const ev = w.spiel!.ereignisse.find((e) => e.vorlage === "verfassung_abstimmung");
    expect(ev).toBeDefined();
    // Entscheiden: das Paket (hohe Prognose) geht weiter — beschlossen oder vor das Gericht gezogen
    const r = entscheide(w, ev!.id, "abstimmen", new Rng(9));
    expect(r.ok).toBe(true);
    const z = verfassungsZustand(w);
    if (z.laufend) {
      expect(z.laufend.phase).toBe("aym");
      advance(w, VERFASSUNG_REGELN.aymTage + 1);
      const aymEv = w.spiel!.ereignisse.find((e) => e.vorlage === "verfassung_aym");
      expect(aymEv).toBeDefined();
      entscheide(w, aymEv!.id, "abwarten", new Rng(10));
    }
    // Am Ende ist der Vorgang abgeschlossen — beschlossen oder kassiert, beides in der Historie
    expect(verfassungsZustand(w).laufend).toBeUndefined();
    expect(verfassungsZustand(w).historie.length).toBeGreaterThan(0);
  });

  test("Das Paket „Weitere Wiederwahl“ erlaubt eine dritte Amtszeit", () => {
    const w = neueWelt(22);
    const z = verfassungsZustand(w);
    z.aktiv.amtszeit = "wiederwahl_plus";
    w.spiel!.amtszeit = 2;
    w.spiel!.umfrage.zustimmung = 62;
    w.spiel!.wahltag = w.day;
    advance(w, 1);
    expect(w.spiel!.ende).toBeUndefined();
    expect(w.spiel!.amtszeit).toBe(3);
    // Nach der dritten ist Schluss
    w.spiel!.wahltag = w.day;
    advance(w, 1);
    expect(w.spiel!.ende?.art).toBe("amtszeitende");
  });
});

// ---------------------------------------------------------------------------

describe("Migration und Determinismus", () => {
  test("Ein Spielstand ohne Verfassungsfeld lädt und läuft weiter; der Stand wird bei Zugriff angelegt", () => {
    const a = neueWelt(31);
    bringeVerfassungEin(a, DEMOKRATISCH);
    const alt = JSON.parse(save(a)) as { spiel: Record<string, unknown> };
    delete alt.spiel.verfassungsvorgang;
    const b = load(JSON.stringify(alt));
    expect(() => advance(b, 35)).not.toThrow();
    const z = verfassungsZustand(b);
    expect(z.aktiv).toEqual({});
    expect(z.sperren).toEqual({});
    // Der alte Stand kennt die harte Regel nicht mehr, ein Paket lässt sich einbringen
    expect(pruefeVerfassung(b, AUTORITAER).ok).toBe(true);
  });

  test("Gleicher Seed, gleiche Aktionen: beide Welten laufen den Vorgang identisch", () => {
    const lauf = () => {
      const w = neueWelt(41);
      einbringenMitZiel(w, AUTORITAER, 380);
      advance(w, VERFASSUNG_REGELN.tageBisAbstimmung);
      const ev = w.spiel!.ereignisse.find((e) => e.vorlage === "verfassung_abstimmung");
      if (ev) entscheide(w, ev.id, "abstimmen", new Rng(7));
      advance(w, VERFASSUNG_REGELN.aymTage + 2);
      const aymEv = w.spiel!.ereignisse.find((e) => e.vorlage === "verfassung_aym");
      if (aymEv) entscheide(w, aymEv.id, "abwarten", new Rng(7));
      advance(w, 40);
      const refEv = w.spiel!.ereignisse.find((e) => e.vorlage === "verfassung_referendum");
      if (refEv) entscheide(w, refEv.id, "auszaehlen", new Rng(7));
      advance(w, 5);
      return w;
    };
    const a = lauf();
    const b = lauf();
    expect(JSON.stringify(a.spiel!.verfassungsvorgang)).toBe(JSON.stringify(b.spiel!.verfassungsvorgang));
    expect(a.date).toBe(b.date);
    expect(a.rngState).toBe(b.rngState);
    // Der gesamte Spielzustand ist identisch
    expect(JSON.stringify(a.spiel)).toBe(JSON.stringify(b.spiel));
  });
});
