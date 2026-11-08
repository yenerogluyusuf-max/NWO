// Welle 3, K4 (krieg.md Schritt 7): der Friedenstisch mit Forderungen je Region. Geprüft wird: Ein Sieg kann eine 30-km-Zone ohne Annexion
// verlangen und bekommen; ein Maximalpaket wird abgelehnt und kommt als Gegenangebot zurück; Abtretung nur unter echtem Druck; der Vermittler
// (USA oder Russland nach Nähe) bringt ein Paket, das der Gegner annimmt; was angezeigt wird, wird gebucht; die Form je Region landet in der
// Besatzung (Schnittstelle zu K5); Rückgabe mit Frist; Speichern und Laden; Determinismus; alte Spielstände.
import { describe, expect, it, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { advance, load } from "../src/sim/world";
import { fuehreKriegHandlungAus, kriegMit, paketPreis, PAKETE } from "../src/sim/krieg";
import { antworten, entscheide } from "../src/sim/ereignisse";
import { Rng } from "../src/sim/rng";
import {
  TISCH,
  abtretungsDruck,
  kuerzen,
  tischBudget,
  tischDerLage,
  tischMoeglich,
  tischPreis,
  tischPunkte,
  tischRegionen,
  tischSetzen,
  tischVorlegen,
  vermittlerPaket,
  vermittlerVon,
} from "../src/sim/friedenstisch";
import { besatzung } from "../src/sim/kriegsschauplatz";
import { UEBERGABE_TAGE } from "../src/sim/friedenstisch";
import { neueProvinzen } from "../src/sim/provinzen-neu";
import { netz } from "../src/sim/ereignis-hilfen";
import { landSicht } from "../src/sim/laender";
import { setzePaar, weltModell } from "../src/sim/welt-modell";
import type { FriedensTisch, KriegVorgang } from "../src/sim/krieg-typen";
import type { World } from "../src/sim/types";
import { bisKrieg, frisch } from "./k3-hilfe";

/** Frisch gegen Syrien mit begrenzter Operation bis zur Waffenruhe nach erreichtem Ziel (Asas, Manbidsch, Qamischli). */
function syrienWaffenruhe(seed = 6): { w: World; k: KriegVorgang } {
  const w = frisch(seed);
  const { k } = bisKrieg(w, { land: "SYR", zielraum: "syr_grenzstreifen", form: "begrenzt", mobil: true });
  for (let tag = 0; tag < 300 && k.phase === "krieg"; tag++) {
    advance(w, 1);
    for (const ev of [...w.spiel!.ereignisse]) {
      if (!w.spiel!.ereignisse.includes(ev)) continue;
      const os = antworten(w, ev).filter((x) => !x.sperre);
      // Pausen lehnt der Bot ab, bis das Ziel erreicht ist; danach nimmt er die Waffenruhe an
      const pick = os.find((x) => x.id === (k.zielErreicht !== undefined ? "annehmen" : "ablehnen")) ?? os.find((x) => (x.anzeigePk ?? x.pk) === 0) ?? os[0];
      w.spiel!.kapital = Math.max(w.spiel!.kapital, 40);
      if (pick) entscheide(w, ev.id, pick.id, new Rng(1));
    }
    if (k.phase === "krieg" && k.zielErreicht !== undefined) fuehreKriegHandlungAus(w, k.id, "waffenruhe");
  }
  expect(k.phase).toBe("waffenruhe");
  return { w, k };
}

const kopie = (w: World): World => load(JSON.stringify(w));

describe("Friedenstisch", () => {
  const basis = syrienWaffenruhe();

  it("steht in der Waffenruhe eines Landkriegs mit gehaltenem Gebiet und hat ein Budget aus Kontrolle und Erschöpfung", () => {
    const w = kopie(basis.w);
    const kk = kriegMit(w, "SYR")!;
    expect(tischMoeglich(kk)).toBe(true);
    const b = tischBudget(w, kk);
    expect(b.punkte).toBeGreaterThan(0);
    expect(b.posten.map((p) => p.id)).toContain("kontrolle");
    expect(b.posten.map((p) => p.id)).toContain("ziel");
    // Gehaltene Regionen stehen am Tisch, mit allen vier Formen samt Preis
    const regs = tischRegionen(kk, tischDerLage(kk));
    expect(regs.filter((r) => r.lage === "eigen").map((r) => r.region.id)).toEqual(expect.arrayContaining(["syr_asas", "syr_manbidsch", "syr_qamischli"]));
    for (const r of regs) expect(r.formen.map((f) => f.form)).toEqual(["zone", "zivil", "satellit", "annexion", "rueckgabe"]);
  });

  it("ein Sieg bekommt eine 30-km-Zone ohne Annexion, und gebucht wird, was der Tisch zeigt", () => {
    const w = kopie(basis.w);
    const k = kriegMit(w, "SYR")!;
    expect(tischSetzen(w, k.id, { rueckzugKm: 30 }).ok).toBe(true);
    const preis = tischPreis(w, k, k.tisch!);
    expect(preis.annahme).toBe(true);
    expect(preis.punkte).toBe(tischPunkte(k, k.tisch!));
    // Der Innenpreis am Knopf ist derselbe, den paketPreis für das Paket nennt
    expect(paketPreis(w, k, { gebiet: 1, reparation: 0, garantien: true, rueckzug: false, tisch: k.tisch! }).po).toBe(preis.po);
    const zustimmung = w.spiel!.umfrage.zustimmung;
    const r = tischVorlegen(w, k.id, "eigen");
    expect(r.ok, r.text).toBe(true);
    expect(k.phase).toBe("frieden");
    expect(k.ausgang).toBe("sieg");
    // Zustimmung: genau der angezeigte Wert (Presse eingerechnet)
    expect(w.spiel!.umfrage.zustimmung).toBeCloseTo(zustimmung + preis.zustimmung, 5);
    // Die Form je Region steht in der Besatzung (Schnittstelle zu K5), keine Annexion
    const b = besatzung(w).filter((x) => x.land === "SYR");
    expect(b.length).toBeGreaterThanOrEqual(3);
    for (const x of b) {
      expect(x.form).toBe("zone");
      expect(x.vertrag?.rueckzugKm).toBe(30);
      expect(x.vertrag?.abtretung).toBeUndefined();
    }
  });

  it("ein Maximalpaket wird abgelehnt; das Gegenangebot passt ins Budget und schließt Frieden", () => {
    const w = kopie(basis.w);
    const k = kriegMit(w, "SYR")!;
    for (const r of tischRegionen(k, tischDerLage(k))) if (r.lage === "eigen") tischSetzen(w, k.id, { region: r.region.id, form: "satellit" });
    tischSetzen(w, k.id, { rueckzugKm: 30, reparation: true, rueckkehr: true });
    const preis = tischPreis(w, k, k.tisch!);
    expect(preis.annahme).toBe(false);
    const r = tischVorlegen(w, k.id, "eigen");
    expect(r.ok).toBe(false);
    expect(k.phase).toBe("waffenruhe");
    expect(k.tischAbgelehnt?.tag).toBe(w.day);
    const gegen = k.tischAbgelehnt!.gegen;
    expect(tischPunkte(k, gegen)).toBeLessThanOrEqual(tischBudget(w, k).punkte);
    // Zuerst streicht Syrien, was seine Hoheit trifft: nicht mehr alle drei Regionen mit Sonderstatus
    expect(Object.values(gegen.regionen).filter((f) => f === "satellit").length).toBeLessThan(3);
    expect(tischVorlegen(w, k.id, "gegen").ok).toBe(true);
    expect(k.phase).toBe("frieden");
  });

  it("Abtretung nur unter echtem Druck, nie die Hauptstadt; mit Druck steht sie als Annexion per Vertrag in der Besatzung", () => {
    const w = kopie(basis.w);
    const k = kriegMit(w, "SYR")!;
    expect(abtretungsDruck(k)).toBe(false);
    expect(tischSetzen(w, k.id, { region: "syr_asas", form: "annexion" }).ok).toBe(false);
    // Der Gegner ist am Ende (Rückhalt 15): Jetzt kann Asas abgetreten werden
    k.uhrGegner = 15;
    expect(abtretungsDruck(k)).toBe(true);
    expect(tischSetzen(w, k.id, { region: "syr_asas", form: "annexion" }).ok).toBe(true);
    const preis = tischPreis(w, k, k.tisch!);
    expect(preis.annahme, `${preis.punkte}/${preis.budget}`).toBe(true);
    expect(tischVorlegen(w, k.id, "eigen").ok).toBe(true);
    const asas = besatzung(w).find((x) => x.region === "syr_asas")!;
    expect(asas.form).toBe("annexion");
    expect(asas.vertrag?.abtretung).toBe(true);
    // Hatay-Weg bei K5: Die Region wird eine Provinz ab Kennziffer 82, der Vorgang trägt den Vertrag
    expect(asas.plaka).toBeGreaterThanOrEqual(82);
    const p = neueProvinzen(w).find((x) => x.region === "syr_asas")!;
    expect(p.plaka).toBe(asas.plaka);
    expect(p.vertrag).toBe(true);
    expect(w.spiel!.annexionen?.some((a) => a.land === "SYR" && a.vertrag && a.regionen.includes("syr_asas"))).toBe(true);
  });

  it("der Vermittler ist, wer dem Gegner näher steht, und sein Paket nimmt der Gegner an", () => {
    const w = kopie(basis.w);
    const k = kriegMit(w, "SYR")!;
    // Stand 2026 im Weltmodell: USA 5, Russland 0 gegenüber Syrien
    expect(vermittlerVon(w, k)).toBe("USA");
    const v = vermittlerPaket(w, k)!;
    expect(v.von).toBe("USA");
    expect(Object.values(v.regionen)).not.toContain("annexion");
    expect(tischPunkte(k, v)).toBeLessThanOrEqual(tischBudget(w, k).punkte + TISCH.vermittlerBonus);
    expect(tischPreis(w, k, v).annahme).toBe(true);
    const usa = landSicht(w, "USA").konflikt;
    expect(tischVorlegen(w, k.id, "vermittler").ok).toBe(true);
    expect(landSicht(w, "USA").konflikt).toBeLessThan(usa);
    // Russland nach Sotschi: rückt Moskau näher an Damaskus, vermittelt Russland mit 30 km, Patrouillen und Rückkehr
    const w2 = kopie(basis.w);
    const k2 = kriegMit(w2, "SYR")!;
    setzePaar(weltModell(w2), "RUS", "SYR", { buendnis: 40 });
    expect(vermittlerVon(w2, k2)).toBe("RUS");
    const r = vermittlerPaket(w2, k2)!;
    expect(r.von).toBe("RUS");
    expect(r.patrouillen).toBe(true);
  });

  it("eine Rückgabe geht mit Frist an den Gegner zurück", () => {
    const w = kopie(basis.w);
    const k = kriegMit(w, "SYR")!;
    expect(tischSetzen(w, k.id, { region: "syr_qamischli", form: "rueckgabe" }).ok).toBe(true);
    expect(tischVorlegen(w, k.id, "eigen").ok).toBe(true);
    // Bis zur Übergabe bleibt Qamischli besetzt (Form von K5), dann geht es zurück
    const q = besatzung(w).find((x) => x.region === "syr_qamischli")!;
    expect(q.vertrag?.uebergabe).toBe(w.day + UEBERGABE_TAGE);
    advance(w, UEBERGABE_TAGE - 1);
    expect(besatzung(w).some((x) => x.region === "syr_qamischli")).toBe(true);
    advance(w, 2);
    expect(besatzung(w).some((x) => x.region === "syr_qamischli")).toBe(false);
    expect(besatzung(w).some((x) => x.region === "syr_asas")).toBe(true);
  });

  it("das Gegenangebot kürzt in fester Reihenfolge und bleibt für dieselbe Lage gleich (Determinismus)", () => {
    const w = kopie(basis.w);
    const k = kriegMit(w, "SYR")!;
    const max: FriedensTisch = { ...tischDerLage(k), rueckzugKm: 30, reparation: true, rueckkehr: true };
    const a = kuerzen(w, k, max, 10);
    const b = kuerzen(kopie(w), kriegMit(kopie(w), "SYR")!, max, 10);
    expect(a).toEqual(b);
    expect(a.reparation).toBe(false);
  });

  it("Abtretung von Asas per Vertrag: Ansehen, EU und USA bewegen sich genau um den angezeigten Wert (jede Größe einmal gebucht)", () => {
    const w = kopie(basis.w);
    const k = kriegMit(w, "SYR")!;
    k.uhrGegner = 15;
    expect(tischSetzen(w, k.id, { region: "syr_asas", form: "annexion" }).ok).toBe(true);
    const preis = tischPreis(w, k, k.tisch!);
    // Die Folgen der Abtretung stehen in der Anzeige, gebucht von K5 (extern), nicht vom Tisch
    const extern = preis.buchungen.filter((b) => (b.art === "knoten" || b.art === "land") && b.extern);
    expect(extern.some((b) => b.art === "knoten" && b.id === "ansehen")).toBe(true);
    expect(extern.some((b) => b.art === "land" && b.id === "EU")).toBe(true);
    expect(extern.some((b) => b.art === "land" && b.id === "USA")).toBe(true);
    const ansehen = netz(w, "ansehen"), eu = landSicht(w, "EU").konflikt, usa = landSicht(w, "USA").konflikt;
    expect(tischVorlegen(w, k.id, "eigen").ok).toBe(true);
    expect(netz(w, "ansehen") - ansehen).toBeCloseTo(preis.ansehen, 1);
    expect(landSicht(w, "EU").konflikt - eu).toBeCloseTo(preis.konflikt.EU ?? 0, 1);
    expect(landSicht(w, "USA").konflikt - usa).toBeCloseTo(preis.konflikt.USA ?? 0, 1);
  });

  it("die Zivilverwaltung steht am Tisch und landet als Form von K5 in der Besatzung", () => {
    const w = kopie(basis.w);
    const k = kriegMit(w, "SYR")!;
    expect(tischSetzen(w, k.id, { region: "syr_manbidsch", form: "zivil" }).ok).toBe(true);
    expect(tischVorlegen(w, k.id, "eigen").ok).toBe(true);
    expect(besatzung(w).find((x) => x.region === "syr_manbidsch")!.form).toBe("zivil");
  });

  it("Speichern und Laden mit Entwurf und Gegenangebot sind exakt", () => {
    const w = kopie(basis.w);
    const k = kriegMit(w, "SYR")!;
    tischSetzen(w, k.id, { rueckzugKm: 10, reparation: true });
    tischVorlegen(w, k.id, "eigen");
    const a = JSON.stringify(w);
    expect(JSON.stringify(load(a))).toBe(a);
  });

  it("die festen Pakete im Fernkonflikt bleiben (kein Tisch ohne Schauplatz)", () => {
    const w = kopie(basis.w);
    const k = kriegMit(w, "SYR")!;
    const fern = { ...k, land: "ISR" } as KriegVorgang;
    expect(tischMoeglich(fern)).toBe(false);
    expect(PAKETE.paket_tisch!.name.length).toBeGreaterThan(0);
  });
});

test.skipIf(!existsSync("../spielstand/staatsraeson_2043-08-03.json"))("Spielstand des Inhabers 2043 lädt unverändert, ohne Felder des Tischs", () => {
  const roh = JSON.stringify(JSON.parse(readFileSync("../spielstand/staatsraeson_2043-08-03.json", "utf8")).welt);
  const w = load(roh);
  for (const k of w.spiel!.kriege ?? []) {
    expect(k.tisch).toBeUndefined();
    expect(k.tischAbgelehnt).toBeUndefined();
  }
  const a = JSON.stringify(w);
  expect(JSON.stringify(load(a))).toBe(a);
});

it("Messwerte (Bericht K4)", () => {
  const { w, k } = syrienWaffenruhe();
  const b = tischBudget(w, k);
  const lage = tischDerLage(k);
  const zone30: FriedensTisch = { ...lage, rueckzugKm: 30 };
  const max: FriedensTisch = { ...lage, regionen: Object.fromEntries(Object.keys(lage.regionen).map((id) => [id, "satellit" as const])), rueckzugKm: 30, reparation: true, rueckkehr: true };
  const v = vermittlerPaket(w, k)!;
  const z = (x: FriedensTisch) => { const p = tischPreis(w, k, x); return `${p.punkte}/${p.budget} ${p.annahme ? "ja" : "nein"} Zust ${p.zustimmung} Nat ${p.nationalisten} Ans ${p.ansehen} ${JSON.stringify(p.konflikt)}`; };
  console.log(`[K4] ${w.date} Front ${Math.round(k.front)} uhrG ${Math.round(k.uhrGegner)} Budget ${JSON.stringify(b)}\n lage ${z(lage)}\n zone30 ${z(zone30)}\n max ${z(max)} -> gegen ${JSON.stringify(kuerzen(w, k, max, b.punkte))}\n vermittler ${vermittlerVon(w, k)} ${JSON.stringify(v)} ${z(v)}`);
});
