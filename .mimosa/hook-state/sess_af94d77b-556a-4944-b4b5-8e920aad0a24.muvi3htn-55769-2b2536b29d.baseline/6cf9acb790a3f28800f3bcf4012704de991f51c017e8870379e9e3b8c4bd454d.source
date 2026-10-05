// Unbegrenzte Amtszeiten: Die Verfassung kann die Grenze lockern, und damit endet das Spiel nicht mehr nach der letzten Amtszeit.
//   - Artikel „amtszeit“ mit „unbegrenzt“ und Artikel „amtszeitlaenge“ (4, 5, 7 Jahre), Verfahren wie die anderen Pakete
//   - maxAmtszeiten liefert Infinity; es gibt keine letzte Wahl, keine Kronprinzen, keinen Nachfolger-Wahlkampf, kein Ende „Amtszeitende“
//   - nach jeder gewonnenen Wahl beginnt eine neue Amtszeit mit Zwischenbilanz, Zielwahl und Umbildungsfenster (Wahl 3, Wahl 4)
//   - Langzeitfolgen: Ehrgeiz und Groll im Kabinett, Legitimität, Polarisierung, EU, Putschrisiko, Alter und Gesundheit
//   - Spielstände ohne die neuen Felder laden weiter (??=)
// Die langen Läufe (zwölf Seeds, dreißig Jahre) laufen mit ENDEN_LANG=1 und schreiben ihre Zahlen nach ENDEN_AUS (Kalibrierung); ohne Variable läuft eine kurze Stichprobe.

import { appendFileSync, writeFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { advance, createWorld, NET } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { nationalAverage } from "../src/sim/netz";
import { entscheide, standardAntwort } from "../src/sim/ereignisse";
import { bringeEin, pruefeVorhaben } from "../src/sim/handeln";
import { waehleZiele } from "../src/sim/spiel";
import { duellVorbereiten, wahlkampfAktiv, wahlkampfSicht, wahlkampfTag } from "../src/sim/wahlkampf";
import { amtszeitBegrenzt, amtszeitJahre, kuerFaellig, maxAmtszeiten, nachfolgeZustand, regelPruefen, umbildungAbschliessen, waehleZieleAmtszeit } from "../src/sim/amtszeit";
import { ARTIKEL, VERFASSUNG_REGELN, artikelDef, bringeVerfassungEin, paketStimmen, paketVervollstaendigen, referendumAuszaehlen, verfassungAktiv, verfassungsZustand } from "../src/sim/verfassung";
import { istLetzteWahl, wahlabendQuittieren } from "../src/sim/wahl";
import { DAUER, dauerStufe } from "../src/sim/dauerherrscher";
import { ENDEN, alterDesPraesidenten, altersFaktor, endenMonat, endenSicht, endenZustand, putschRisiko, startAlter } from "../src/sim/enden";
import { erstelleBilanz } from "../src/sim/bilanz";
import { figur } from "../src/sim/figuren";
import { eigenVon } from "../src/sim/personen";
import { vertrauenZu } from "../src/sim/laender";
import { amtszeitZeile } from "../src/ui/Chronik";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

const AUS = process.env.ENDEN_AUS;
if (AUS) writeFileSync(AUS, "");
const out = (s: string) => AUS && appendFileSync(AUS, s + "\n");
const LANG = process.env.ENDEN_LANG === "1";

const profil: PlayerProfile = {
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
};

function spiel(seed = 5): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, profil);
  waehleZiele(w, ["inflation15", "wohnen", "mehrheit"], "normal");
  w.spiel!.ereignisse = [];
  return w;
}

/** Setzt die Verfassungsregel, als wäre sie beschlossen worden (der Weg über das Parlament steht in den Verfassungstests). */
function regel(w: World, artikel: string, variante: string): void {
  verfassungsZustand(w).aktiv[artikel] = variante;
}

/** Bringt ein Paket ein und führt es über die Volksabstimmung in Kraft (hohe Zustimmung, damit es durchgeht). */
function inKraft(w: World, paket: Record<string, string>, seed = 5): { ja: boolean } {
  w.spiel!.kapital = 150;
  const r = bringeVerfassungEin(w, paket);
  if (!r.ok) throw new Error(r.text);
  const v = verfassungsZustand(w).laufend!;
  v.absprachen = 330 - paketStimmen(w, v.paket, 0).erwartet;
  v.phase = "kampagne";
  v.ja = 330;
  v.referendumTag = w.day + VERFASSUNG_REGELN.kampagnenTage;
  w.spiel!.umfrage.zustimmung = 90;
  return referendumAuszaehlen(w, new Rng(seed));
}

// ---------------------------------------------------------------------------
// Ein klarer Bot (wie „klug“ in test/spielbarkeit.test.ts), der auch Umbildung und Zielwahl der neuen Amtszeiten beantwortet

const KLUG = ["m_wasserleitungen", "m_krankenhausbau", "m_sozialwohnungen", "m_bauaufsicht", "m_polizei", "m_stadterneuerung", "m_ausbildung", "m_aerztegehalt", "m_bewaesserung", "m_netzausbau"];

function klarerBot(w: World, rng: Rng, monat: number): void {
  const sp = w.spiel!;
  if (w.spiel!.wahl?.abend) wahlabendQuittieren(w);
  sp.hinweise = [];
  for (const ev of [...sp.ereignisse]) {
    const id = standardAntwort(w, ev);
    if (id) entscheide(w, ev.id, id, rng);
  }
  if (sp.umbildung && !sp.umbildung.abgeschlossen) umbildungAbschliessen(w);
  if (sp.zielwahl?.offen) waehleZieleAmtszeit(w, []);
  if (wahlkampfAktiv(w) && (sp.wahlkampf?.ap ?? 0) >= 2) duellVorbereiten(w);
  const id = KLUG[monat % KLUG.length]!;
  const ziel = Math.min(100, nationalAverage(NET, w.net, id) + 20);
  const pr = pruefeVorhaben(w, id, ziel);
  if (pr.ok && sp.kapital > pr.gesetz.pk + 8) bringeEin(w, id, ziel, null, "gesetz");
}

interface Lang {
  seed: number;
  ende: string;
  jahre: number;
  amtszeit: number;
  wahlen: number;
  gewonnen: number;
  alterEnde: number;
  /** Mittel über die Kabinettsminister: Ehrgeiz am Ende der ersten und der letzten Amtszeit */
  ehrgeiz1: number;
  ehrgeizN: number;
  legitimitaet1: number;
  legitimitaetN: number;
  eu1: number;
  euN: number;
  zustimmungN: number;
}

function ehrgeizMittel(w: World): number {
  const xs = w.spiel!.figuren.filter((f) => f.imAmt && f.amt !== "partner" && f.amt !== "opposition" && f.amt !== "zentralbank").map((f) => eigenVon(w, f).ehrgeiz);
  return xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
}

/** Ein Lauf mit unbegrenzter Amtszeit bis zum Ende oder bis `maxJahre`. */
function langerLauf(seed: number, maxJahre: number): Lang {
  const w = spiel(seed);
  regel(w, "amtszeit", "unbegrenzt");
  const rng = new Rng(seed * 7919);
  let monat = 0;
  let marke1: { e: number; l: number; eu: number } | null = null;
  const sp = w.spiel!;
  while (!sp.ende && monat < maxJahre * 12) {
    klarerBot(w, rng, monat);
    advance(w, 30);
    monat++;
    if (!marke1 && sp.amtszeit === 2) marke1 = { e: ehrgeizMittel(w), l: nationalAverage(NET, w.net, "legitimitaet"), eu: vertrauenZu(w, "EU") };
  }
  const historie = sp.wahl?.historie ?? [];
  return {
    seed,
    ende: sp.ende?.art ?? "läuft",
    jahre: w.day / 365,
    amtszeit: sp.amtszeit,
    wahlen: historie.length,
    gewonnen: historie.filter((h) => h.gewonnen).length,
    alterEnde: alterDesPraesidenten(w),
    ehrgeiz1: marke1?.e ?? NaN,
    ehrgeizN: ehrgeizMittel(w),
    legitimitaet1: marke1?.l ?? NaN,
    legitimitaetN: nationalAverage(NET, w.net, "legitimitaet"),
    eu1: marke1?.eu ?? NaN,
    euN: vertrauenZu(w, "EU"),
    zustimmungN: sp.umfrage.zustimmung,
  };
}

// ---------------------------------------------------------------------------

describe("Verfassungsartikel für die Amtszeit", () => {
  test("Der Artikel „amtszeit“ kennt zwei (Standard), drei und keine Begrenzung", () => {
    const a = artikelDef("amtszeit")!;
    expect(a.varianten.map((v) => v.id)).toEqual(expect.arrayContaining(["unveraendert", "wiederwahl_plus", "unbegrenzt", "neuwahl_jetzt"]));
    const u = a.varianten.find((v) => v.id === "unbegrenzt")!;
    // Das stärkste Paket des Artikels: Machtkonzentration über der der dritten Amtszeit, mit Preis (Polarisierung, Legitimität)
    expect(u.autoritaer).toBeGreaterThan(a.varianten.find((v) => v.id === "wiederwahl_plus")!.autoritaer);
    expect(u.effekte.find((e) => e.id === "legitimitaet")!.d).toBeLessThan(a.varianten.find((v) => v.id === "wiederwahl_plus")!.effekte.find((e) => e.id === "legitimitaet")!.d);
    expect(u.effekte.find((e) => e.id === "polarisierung")!.d).toBeGreaterThan(0);
    expect(u.statusQuo).toBeUndefined();
  });

  test("Der Artikel „amtszeitlaenge“ kennt vier, fünf (Standard) und sieben Jahre; ein Paket wird mit dem Status quo aufgefüllt", () => {
    const a = artikelDef("amtszeitlaenge")!;
    expect(a.varianten.map((v) => v.id)).toEqual(["jahre_5", "jahre_4", "jahre_7"]);
    expect(a.varianten.find((v) => v.id === "jahre_5")!.statusQuo).toBe(true);
    expect(paketVervollstaendigen({ amtszeit: "unbegrenzt" }).amtszeitlaenge).toBe("jahre_5");
    // Die Varianten-Kennungen sind über alle Artikel eindeutig (die Suche läuft über eine gemeinsame Tabelle)
    const alle = ARTIKEL.flatMap((x) => x.varianten.map((v) => v.id));
    const mehrfach = alle.filter((id, i) => alle.indexOf(id) !== i);
    expect([...new Set(mehrfach)].sort()).toEqual(["unveraendert"]);
    expect(ARTIKEL.every((x) => x.varianten.some((v) => v.statusQuo))).toBe(true);
  });

  test("Das Paket tritt über die Volksabstimmung in Kraft: Grenze fällt, Rivalen grollen, Legitimität und EU leiden, Straßburg drückt", () => {
    const w = spiel(11);
    const fs = w.spiel!.figuren.filter((f) => f.imAmt && f.amt !== "partner" && f.amt !== "opposition" && f.amt !== "zentralbank");
    for (const f of fs) eigenVon(w, f).ehrgeiz = 80;
    const groll0 = fs.reduce((s, f) => s + eigenVon(w, f).groll, 0);
    const legit0 = nationalAverage(NET, w.net, "legitimitaet");
    const eu0 = vertrauenZu(w, "EU");
    const str0 = nationalAverage(NET, w.net, "strassburg_druck");
    expect(maxAmtszeiten(w)).toBe(2);
    const r = inKraft(w, { amtszeit: "unbegrenzt" });
    expect(r.ja).toBe(true);
    expect(verfassungAktiv(w, "amtszeit")).toBe("unbegrenzt");
    expect(maxAmtszeiten(w)).toBe(Infinity);
    expect(fs.reduce((s, f) => s + eigenVon(w, f).groll, 0)).toBeGreaterThan(groll0 + 20);
    expect(nationalAverage(NET, w.net, "legitimitaet")).toBeLessThan(legit0 - 3);
    expect(vertrauenZu(w, "EU")).toBeLessThan(eu0 - 5);
    expect(nationalAverage(NET, w.net, "strassburg_druck")).toBeGreaterThan(str0 + 3);
    expect(w.spiel!.chronik.some((c) => c.titel === "Verfassungsänderung in Kraft")).toBe(true);
  });

  test("Die Amtszeitlänge ändert sich über denselben Weg und gilt für die nächste Amtszeit", () => {
    const w = spiel(18);
    inKraft(w, { amtszeitlaenge: "jahre_7" });
    expect(verfassungAktiv(w, "amtszeitlaenge")).toBe("jahre_7");
    expect(amtszeitJahre(w)).toBe(7);
  });

  test("Die Regel lockert die Grenze: maxAmtszeiten, amtszeitBegrenzt, Chronik-Zeile, Amtszeitlänge", () => {
    const w = spiel();
    expect(maxAmtszeiten(w)).toBe(2);
    expect(amtszeitBegrenzt(w)).toBe(true);
    expect(amtszeitZeile(w)).toBe("Amtszeit 1 von 2.");
    regel(w, "amtszeit", "wiederwahl_plus");
    expect(maxAmtszeiten(w)).toBe(3);
    expect(amtszeitZeile(w)).toBe("Amtszeit 1 von 3.");
    regel(w, "amtszeit", "unbegrenzt");
    expect(maxAmtszeiten(w)).toBe(Infinity);
    expect(amtszeitBegrenzt(w)).toBe(false);
    expect(amtszeitZeile(w)).toBe("Amtszeit 1, ohne Begrenzung.");
    expect(amtszeitJahre(w)).toBe(5);
    regel(w, "amtszeitlaenge", "jahre_7");
    expect(amtszeitJahre(w)).toBe(7);
    regel(w, "amtszeitlaenge", "jahre_4");
    expect(amtszeitJahre(w)).toBe(4);
    // Unendlich wird nie gespeichert: Der Spielstand bleibt gültiges JSON
    expect(JSON.stringify(w)).not.toContain("Infinity");
    expect(() => JSON.parse(JSON.stringify(w))).not.toThrow();
  });

  test("Die vorgezogene Neuwahl überschreibt die gelockerte Grenze nicht und stellt den Wahltermin vor", () => {
    const w = spiel(12);
    regel(w, "amtszeit", "unbegrenzt");
    const r = inKraft(w, { amtszeit: "neuwahl_jetzt" }, 6);
    expect(r.ja).toBe(true);
    expect(verfassungAktiv(w, "amtszeit")).toBe("unbegrenzt");
    expect(maxAmtszeiten(w)).toBe(Infinity);
    expect(w.spiel!.wahltag - w.day).toBeLessThanOrEqual(60);
  });
});

describe("Ohne Grenze gibt es keine letzte Amtszeit", () => {
  test("Keine letzte Wahl, keine Kür, keine Nachfolge, kein Nachfolger-Wahlkampf", () => {
    const w = spiel(6);
    regel(w, "amtszeit", "unbegrenzt");
    w.spiel!.umfrage.zustimmung = 80;
    w.spiel!.kalibrierung += 33;
    advance(w, w.spiel!.wahltag - w.day + 1);
    if (w.spiel!.wahl?.stichwahl) advance(w, 16);
    expect(w.spiel!.amtszeit).toBe(2);
    umbildungAbschliessen(w);
    waehleZieleAmtszeit(w, []);
    expect(istLetzteWahl(w)).toBe(false);
    expect(nachfolgeZustand(w)).toBeUndefined();
    expect(w.spiel!.nachfolge).toBeUndefined();
    w.spiel!.wahltag = w.day + 500;
    expect(kuerFaellig(w)).toBe(false);
    w.spiel!.wahltag = w.day + 40;
    wahlkampfTag(w);
    expect(w.spiel!.wahlkampf?.rolle).toBe("amt");
    expect(wahlkampfSicht(w).nachfolger).toBeUndefined();
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "nachfolge_kuer")).toBe(false);
  });

  test("Fällt die Grenze mitten in der letzten Amtszeit, entfällt die Nachfolge und der Wahlkampf kämpft für den Präsidenten", () => {
    const w = spiel(7);
    w.spiel!.umfrage.zustimmung = 80;
    w.spiel!.kalibrierung += 33;
    advance(w, w.spiel!.wahltag - w.day + 1);
    if (w.spiel!.wahl?.stichwahl) advance(w, 16);
    umbildungAbschliessen(w);
    waehleZieleAmtszeit(w, []);
    expect(istLetzteWahl(w)).toBe(true);
    expect(w.spiel!.nachfolge).toBeDefined();
    w.spiel!.wahltag = w.day + 40;
    wahlkampfTag(w);
    expect(w.spiel!.wahlkampf?.rolle).toBe("nachfolger");
    regel(w, "amtszeit", "unbegrenzt");
    regelPruefen(w);
    expect(w.spiel!.nachfolge).toBeUndefined();
    expect(w.spiel!.wahlkampf?.rolle).toBe("amt");
    expect(w.spiel!.chronik.some((c) => c.titel === "Die Amtszeitgrenze fällt")).toBe(true);
    expect(istLetzteWahl(w)).toBe(false);
  });

  test("Die Bilanz kennt kein „Amtszeitende“ ohne Grenze; das Vermächtnis bleibt ein Zwischenstand", () => {
    const w = spiel(8);
    regel(w, "amtszeit", "unbegrenzt");
    advance(w, 200);
    const b = erstelleBilanz(w, "zwischen");
    expect(b.absaetze.join(" ")).not.toMatch(/keine weitere Amtszeit/);
  });
});

describe("Langzeitfolgen der Dauerherrschaft", () => {
  test("Die Stufe wächst mit den Amtszeiten über der zweiten", () => {
    const w = spiel();
    expect(dauerStufe(w)).toBe(0);
    w.spiel!.amtszeit = 2;
    expect(dauerStufe(w)).toBe(0);
    w.spiel!.amtszeit = 3;
    expect(dauerStufe(w)).toBe(1);
    w.spiel!.amtszeit = 4;
    expect(dauerStufe(w)).toBe(2);
    w.spiel!.amtszeit = 20;
    expect(dauerStufe(w)).toBe(DAUER.maxStufen);
  });

  test("Ab der dritten Amtszeit steigen Ehrgeiz und Groll der Rivalen, Legitimität und Vertrauen der EU sinken, Polarisierung steigt", () => {
    const messe = (amtszeit: number) => {
      const w = spiel(9);
      w.spiel!.amtszeit = amtszeit;
      const e0 = ehrgeizMittel(w);
      const l0 = nationalAverage(NET, w.net, "legitimitaet");
      const p0 = nationalAverage(NET, w.net, "polarisierung");
      const eu0 = vertrauenZu(w, "EU");
      advance(w, 365);
      return { e: ehrgeizMittel(w) - e0, l: nationalAverage(NET, w.net, "legitimitaet") - l0, p: nationalAverage(NET, w.net, "polarisierung") - p0, eu: vertrauenZu(w, "EU") - eu0 };
    };
    const ohne = messe(1);
    const mit = messe(4);
    expect(mit.e).toBeGreaterThan(ohne.e + 2);
    expect(mit.l).toBeLessThan(ohne.l - 1);
    expect(mit.p).toBeGreaterThan(ohne.p + 1);
    expect(mit.eu).toBeLessThan(ohne.eu - 1);
  });

  test("Das Putschrisiko enthält ab der dritten Amtszeit den Posten „Lange Herrschaft“", () => {
    const w = spiel(10);
    expect(putschRisiko(w).teile.some((x) => x.name === "Lange Herrschaft")).toBe(false);
    w.spiel!.amtszeit = 4;
    const r = putschRisiko(w);
    expect(r.teile.find((x) => x.name === "Lange Herrschaft")!.punkte).toBeGreaterThan(0);
  });

  test("Das Alter läuft mit dem Datum, ist beim Amtsantritt 47 bis 58 und beim selben Seed gleich", () => {
    const a = spiel(13);
    const b = spiel(13);
    expect(startAlter(a)).toBe(startAlter(b));
    expect(startAlter(a)).toBeGreaterThanOrEqual(ENDEN.startAlterMin);
    expect(startAlter(a)).toBeLessThan(ENDEN.startAlterMin + ENDEN.startAlterSpanne);
    const alt0 = alterDesPraesidenten(a);
    a.day += Math.round(365.25 * 10);
    expect(alterDesPraesidenten(a)).toBe(alt0 + 10);
    expect(endenSicht(a).alter).toBe(alt0 + 10);
    const alter = new Set<number>();
    for (let s = 1; s <= 40; s++) alter.add(startAlter(spiel(s)));
    expect(alter.size).toBeGreaterThanOrEqual(6);
  });

  test("Die Alterskurve der Krankheit wächst quadratisch: nichts bis 50, 1 bei 60, 4 bei 70, 9 bei 80", () => {
    expect(altersFaktor(45)).toBe(0);
    expect(altersFaktor(60)).toBeCloseTo(1, 6);
    expect(altersFaktor(70)).toBeCloseTo(4, 6);
    expect(altersFaktor(80)).toBeCloseTo(9, 6);
  });

  test("Alterswarnungen: Bei 65, 70, 75 und 80 Jahren kommt je ein Hinweis, jeder nur einmal; Ehrgeizige werden ehrgeiziger", () => {
    const w = spiel(14);
    const z = endenZustand(w);
    z.startAlter = 60;
    const rng = new Rng(1);
    const gefunden: string[] = [];
    for (let jahr = 0; jahr < 24; jahr++) {
      w.day = Math.round(jahr * 365.25) + 1;
      for (let m = 0; m < 12; m++) {
        w.spiel!.hinweise = [];
        w.day += 30;
        endenMonat(w, rng);
        for (const h of w.spiel!.hinweise) if (h.id.startsWith("alter-")) gefunden.push(h.id.split("-")[1]!);
        if (w.spiel!.ende) break;
      }
      if (w.spiel!.ende) break;
    }
    // Die Stufen kommen in der richtigen Reihenfolge und nie doppelt (die Partie kann vorher durch Krankheit enden)
    const eindeutig = [...new Set(gefunden)];
    expect(gefunden).toEqual(eindeutig);
    expect(eindeutig.length).toBeGreaterThanOrEqual(1);
    expect(eindeutig.map(Number)).toEqual([...eindeutig].map(Number).sort((a, b) => a - b));
  });

  test("Ein älterer Stand ohne Altersfeld lädt weiter, meldet nichts nach und rechnet das Alter aus dem Seed", () => {
    const w = spiel(15);
    delete w.spiel!.enden;
    w.day = 365 * 12;
    const rng = new Rng(2);
    w.spiel!.hinweise = [];
    expect(() => endenMonat(w, rng)).not.toThrow();
    expect(w.spiel!.hinweise.filter((h) => h.id.startsWith("alter-"))).toHaveLength(0);
    expect(endenZustand(w).startAlter).toBeGreaterThanOrEqual(ENDEN.startAlterMin);
    const kopie = JSON.parse(JSON.stringify(w)) as World;
    expect(kopie.spiel!.enden!.alterStufe).toBeDefined();
  });

  test("Krankheit trifft Ältere häufiger als Jüngere (gleiche Würfe, nur das Alter unterscheidet sich)", () => {
    const zaehle = (startAlterWert: number) => {
      let n = 0;
      for (let seed = 1; seed <= 200; seed++) {
        const w = spiel(100 + (seed % 5));
        endenZustand(w).startAlter = startAlterWert;
        endenZustand(w).alterStufe = 9;
        w.day = 400;
        const rng = new Rng(seed * 31);
        for (let m = 0; m < 24; m++) {
          w.day += 30;
          endenMonat(w, rng);
          if (w.spiel!.ereignisse.some((e) => e.vorlage === "krankheit_praesident")) {
            n++;
            break;
          }
          if (w.spiel!.ende) break;
        }
      }
      return n;
    };
    expect(zaehle(70)).toBeGreaterThan(zaehle(50) + 3);
  });
});

describe("Mehrere Wahlen ohne Grenze", () => {
  test("Wahl 3: Nach der dritten Wahl beginnt eine weitere Amtszeit mit Zwischenbilanz, Zielwahl und Umbildungsfenster; das Spiel geht weiter", () => {
    const w = spiel(16);
    regel(w, "amtszeit", "unbegrenzt");
    const sp = w.spiel!;
    for (let nr = 1; nr <= 3; nr++) {
      sp.umfrage.zustimmung = 82;
      sp.kalibrierung += 33;
      advance(w, sp.wahltag - w.day + 1);
      if (sp.wahl?.stichwahl) advance(w, 16);
      expect(sp.ende, `nach Wahl ${nr}`).toBeUndefined();
      expect(sp.amtszeit).toBe(nr + 1);
      expect(sp.zielwahl?.offen).toBe(true);
      expect(sp.umbildung?.anlass).toBe("wiederwahl");
      expect(sp.zielArchiv!.some((a) => a.amtszeit === nr)).toBe(true);
      expect(sp.wahl!.historie).toHaveLength(nr);
      const zwischen = erstelleBilanz(w, "zwischen");
      expect(zwischen.titel).toBeTruthy();
      expect(zwischen.absaetze.length).toBeGreaterThan(3);
      wahlabendQuittieren(w);
      sp.ereignisse = [];
      sp.hinweise = [];
      umbildungAbschliessen(w);
      waehleZieleAmtszeit(w, []);
    }
    expect(sp.amtszeit).toBe(4);
    expect(istLetzteWahl(w)).toBe(false);
    // Die Dauerherrschaft ist angekommen: Hinweis und Chronik
    expect(sp.chronik.some((c) => /Amtszeit 4/.test(c.titel))).toBe(true);
  });

  test("Die Länge der Amtszeit gilt ab der nächsten Amtszeit (sieben Jahre)", () => {
    const w = spiel(17);
    const sp = w.spiel!;
    regel(w, "amtszeitlaenge", "jahre_7");
    sp.umfrage.zustimmung = 82;
    sp.kalibrierung += 33;
    advance(w, sp.wahltag - w.day + 1);
    if (sp.wahl?.stichwahl) advance(w, 16);
    expect(sp.amtszeit).toBe(2);
    expect(sp.wahltag - w.day).toBeGreaterThan(365 * 6.9);
    expect(sp.wahltag - w.day).toBeLessThan(365 * 7.1 + 2);
  });

  const SEEDS = LANG ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [1, 2];
  const JAHRE = LANG ? 40 : 16;
  const laeufe: Lang[] = [];
  test(`Läufe mit klarem Bot (${SEEDS.length} Seeds, bis ${JAHRE} Jahre): Wahl 3 und 4 kommen vor, ohne Amtszeitende`, { timeout: LANG ? 3_600_000 : 300_000 }, () => {
    for (const seed of SEEDS) {
      const l = langerLauf(seed, JAHRE);
      laeufe.push(l);
      out(
        `seed ${String(seed).padStart(2)} | ${l.ende.padEnd(13)} nach ${l.jahre.toFixed(1)} J | Amtszeit ${l.amtszeit}, ${l.gewonnen} von ${l.wahlen} Wahlen gewonnen | Alter am Ende ${l.alterEnde} | Ehrgeiz ${l.ehrgeiz1.toFixed(0)} → ${l.ehrgeizN.toFixed(0)} | Legitimität ${l.legitimitaet1.toFixed(0)} → ${l.legitimitaetN.toFixed(0)} | EU ${l.eu1.toFixed(0)} → ${l.euN.toFixed(0)} | Zustimmung ${l.zustimmungN.toFixed(0)}`,
      );
      // Nie das Ende der Verfassung: Ohne Grenze gibt es kein „Amtszeitende“
      expect(l.ende).not.toBe("amtszeitende");
    }
    expect(laeufe.some((l) => l.wahlen >= 3)).toBe(true);
    // Mit der Dauer wächst der Ehrgeiz im Kabinett (Mittelwert über die Läufe, die eine dritte Amtszeit erreichen)
    const lang = laeufe.filter((l) => l.amtszeit >= 4 && Number.isFinite(l.ehrgeiz1));
    if (lang.length) {
      const d = lang.reduce((s, l) => s + (l.ehrgeizN - l.ehrgeiz1), 0) / lang.length;
      expect(d).toBeGreaterThan(0);
    }
  });
});
