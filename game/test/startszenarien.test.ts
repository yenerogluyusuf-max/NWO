// Startszenarien und Biografie: Das Spiel beginnt je nach Szenario mit anderer Partei, anderem Erbe, anderer Lage und anderem Wahltermin;
// Beruf, Jugend, Motiv, Partner und Wahlnacht wirken messbar auf Figuren, Kapital und Gegner (jedes mit Vorteil und Preis).

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { STATIONS, antwortenFuer, emptyProfile, schnellProfil, startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { STARTSZENARIEN, STARTSZENARIO_NACH_ID } from "../src/data/startszenarien";
import { FOLGEN, biografieFolgen, merkmaleVon, wendeBiografieAn } from "../src/sim/biografie";
import { eigenVon } from "../src/sim/personen";
import { figur } from "../src/sim/figuren";
import { PARTEI_ACHSEN, VOREINSTELLUNGEN } from "../src/data/linien";
import { spielerAchsen, voreinstellungAlsAngabe } from "../src/sim/linie";
import { krisenAktiv } from "./_krisen-hilfe";

const wurf = (seed: number) => {
  let s = seed;
  return (n: number) => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return Math.floor((s / 4294967296) * n);
  };
};

function start(szenario: PlayerProfile["startszenario"], seed = 5, linie?: string) {
  const w = createWorld(turkey2026, seed);
  const p = schnellProfil("Szenariotest", wurf(seed), linie ? voreinstellungAlsAngabe(VOREINSTELLUNGEN.find((v) => v.id === linie)!, linie) : undefined, szenario);
  startAfterElection(w, p);
  return w;
}

describe("Startszenarien", () => {
  test("vier Szenarien: drei spielbar, die Opposition folgt später", () => {
    expect(STARTSZENARIEN.map((s) => s.id)).toEqual(["neugruendung", "regierungspartei", "uebergang", "opposition"]);
    expect(STARTSZENARIEN.filter((s) => s.verfuegbar).length).toBe(3);
    expect(STARTSZENARIO_NACH_ID.opposition.verfuegbar).toBe(false);
  });

  test("Neugründung ist der bisherige Start (unverändert)", () => {
    const w = start("neugruendung");
    const alt = createWorld(turkey2026, 5);
    startAfterElection(alt, schnellProfil("Szenariotest", wurf(5)));
    expect(w.player!.partei.kurz).toBe(alt.player!.partei.kurz);
    expect(w.spiel!.wahltag).toBe(alt.spiel!.wahltag);
    expect(w.parliament!.seats).toEqual(alt.parliament!.seats);
  });

  test("Regierungspartei übernehmen: AKP, Bündnis mit der MHP, vorhandenes Parlament, Erbe, Wahl in gut zweieinhalb Jahren", () => {
    const w = start("regierungspartei");
    expect(w.player!.partei.kurz).toBe("AKP");
    expect(w.player!.buendnis).toBe("MHP");
    expect(w.player!.achsen).toEqual(PARTEI_ACHSEN.AKP);
    // Die Partei der Szene tritt mit ihrem Umfrageanteil an, ohne anderen Parteien Stimmen abzunehmen
    expect(w.parliament!.seats["AKP"]!).toBeGreaterThan(150);
    expect(w.parliament!.shares["AKP"]!).toBeGreaterThan(25);
    expect(Object.keys(w.parliament!.shares).filter((k) => k === "AKP").length).toBe(1);
    // Erbe der Vorgänger: zwei offene Zusagen
    const ids = w.spiel!.zusagen.map((z) => z.id);
    expect(ids).toContain("z-friedensprozess");
    expect(ids).toContain("z-renten");
    // Wahl in gut zweieinhalb Jahren statt in fünf
    expect(w.spiel!.wahltag - w.day).toBe(STARTSZENARIO_NACH_ID.regierungspartei.wahltagTage);
    expect(w.spiel!.umfrage.zustimmung).toBeCloseTo(52.5, 0);
    expect(w.log.some((l) => /übernimmt den Vorsitz der AKP/.test(l.text))).toBe(true);
    expect(spielerAchsen(w)).toEqual(PARTEI_ACHSEN.AKP);
    // Die Mehrheit steht: Das Spiel beginnt mit einem Regierungslager
    const lager = [w.player!.partei.kurz, ...w.spiel!.lager].reduce((s, p) => s + (w.parliament!.seats[p] ?? 0), 0);
    expect(lager).toBeGreaterThanOrEqual(301);
  });

  test("Übergangsregierung nach der Krise: Wirtschaft in der Krise, Krisenblocker, Wahl in gut einem Jahr", () => {
    const normal = start("neugruendung");
    const krise = start("uebergang");
    expect(krise.economy.inflation).toBeGreaterThan(normal.economy.inflation + 10);
    expect(krise.economy.unemployment).toBeGreaterThan(normal.economy.unemployment + 2);
    expect(krise.economy.riskPremium).toBeGreaterThan(normal.economy.riskPremium + 300);
    expect(krise.economy.usdTry).toBeGreaterThan(normal.economy.usdTry * 1.3);
    expect(krise.published.inflation.value).toBeGreaterThan(normal.published.inflation.value + 10);
    // Die Bilanz misst von der Krise aus
    expect(krise.spiel!.start.inflation).toBe(krise.published.inflation.value);
    expect(krise.spiel!.wahltag - krise.day).toBe(STARTSZENARIO_NACH_ID.uebergang.wahltagTage);
    expect(krise.spiel!.umfrage.zustimmung).toBeCloseTo(47, 0);
    expect(krisenAktiv(krise)).toBeGreaterThanOrEqual(krisenAktiv(normal));
    expect(krise.log.some((l) => /Krise/.test(l.text))).toBe(true);
  });

  test("Die Stationen, die das Szenario festlegt, entfallen im Prolog", () => {
    const p = emptyProfile();
    p.startszenario = "regierungspartei";
    const uebersprungen = STATIONS.filter((s) => s.ueberspringen?.(p)).map((s) => s.id);
    expect(uebersprungen).toEqual(["partei", "wahlkampf", "wahlnacht"]);
    p.startszenario = "uebergang";
    expect(STATIONS.filter((s) => s.ueberspringen?.(p)).map((s) => s.id)).toEqual(["wahlnacht"]);
    p.startszenario = "neugruendung";
    expect(STATIONS.filter((s) => s.ueberspringen?.(p)).length).toBe(0);
  });

  test("Bündnisantworten: Die klassischen Muster behalten vier feste Antworten, jede andere Linie bekommt Partner nach Nähe", () => {
    const wahlkampf = STATIONS.find((s) => s.id === "wahlkampf")!;
    const klassisch = emptyProfile();
    klassisch.partei = { name: "Partei der Werte", kurz: "PW", farbe: "#000" };
    expect(antwortenFuer(wahlkampf, klassisch).length).toBe(4);
    // In der Oberfläche sehen auch sie die übrigen nahen Parteien, mit Zusage nach dem Muster z-start-*
    const erweitert = antwortenFuer(wahlkampf, klassisch, true);
    expect(erweitert.length).toBeGreaterThan(4);
    const extra = erweitert[2]!;
    extra.apply(klassisch);
    expect(["CHP", "İYİ", "AKP", "DEM", "Zafer", "YRP"]).toContain(klassisch.buendnis);
    expect(klassisch.buendnisZusage?.partei).toBe(klassisch.buendnis);
    klassisch.buendnis = undefined as never;
    delete klassisch.buendnisZusage;
    klassisch.versprechen = [];
    const aut = emptyProfile();
    const v = VOREINSTELLUNGEN.find((x) => x.id === "autoritaer")!;
    aut.partei = { name: "Partei der Ordnung", kurz: v.kurz, farbe: v.farbe };
    aut.achsen = v.achsen;
    const antworten = antwortenFuer(wahlkampf, aut);
    expect(antworten.length).toBeGreaterThanOrEqual(4);
    antworten[0]!.apply(aut);
    expect(["MHP", "Zafer", "AKP", "İYİ"]).toContain(aut.buendnis);
    expect(aut.buendnisZusage?.partei).toBe(aut.buendnis);
    const w = createWorld(turkey2026, 7);
    startAfterElection(w, aut);
    expect(w.spiel!.zusagen.some((z) => z.id === `z-start-${aut.buendnis}`)).toBe(true);
    expect(w.spiel!.lager).toContain(aut.buendnis!);
  });

  test("Spielstände ohne die neuen Felder starten und laden wie vorher (Testprofil ohne Achsen, Szenario, Wahlstil)", () => {
    const w = createWorld(turkey2026, 9);
    const p = schnellProfil("Alt", () => 1);
    delete p.achsen;
    delete p.startszenario;
    delete p.wahlStil;
    startAfterElection(w, p);
    expect(w.spiel).toBeDefined();
    expect(w.player!.partei.kurz).toBe("PG");
    expect(spielerAchsen(w)).toEqual(VOREINSTELLUNGEN.find((v) => v.kurz === "PG")!.achsen);
  });
});

describe("Die Biografie wirkt: Vorteil und Preis", () => {
  const profil = (o: Partial<PlayerProfile>): PlayerProfile => ({ ...emptyProfile(), partei: { name: "Test", kurz: "AP", farbe: "#000" }, ...o });
  const frisch = (seed = 2) => {
    const w = createWorld(turkey2026, seed);
    startAfterElection(w, profil({}));
    return w;
  };

  test("Merkmale kommen aus den Texten des Profils", () => {
    expect(merkmaleVon({ beruf: "Anwalt", jugend: "Studentenbewegung", motiv: "Mentor", partner: "Richterin, eigene Karriere, eigene Meinung" })).toEqual(["anwalt", "studentenbewegung", "mentor", "richterin"]);
    expect(merkmaleVon({ beruf: "Ökonom", jugend: "Sportverein", motiv: "Ehrgeiz", partner: "Bauunternehmer, Aufträge vom Staat möglich", wahlStil: "knapp" })).toEqual(["oekonom", "sportverein", "ehrgeiz", "bauunternehmer", "wahl:knapp"]);
    expect(merkmaleVon({ beruf: "", jugend: "", motiv: "", partner: "" })).toEqual([]);
  });

  test("jedes Merkmal hat mindestens einen Vorteil und einen Preis (keine Antwort ist strikt besser)", () => {
    for (const [id, f] of Object.entries(FOLGEN)) {
      expect(f.vorteil.length, id).toBeGreaterThan(0);
      expect(f.preis.length, id).toBeGreaterThan(0);
    }
  });

  test("Anwalt: Justizministerium besser, aber die Opposition kennt die Mandanten", () => {
    const basis = frisch();
    const w = createWorld(turkey2026, 2);
    const p = profil({ beruf: "Anwalt" });
    startAfterElection(w, p);
    expect(eigenVon(w, figur(w, "justiz")!).faehigkeit).toBeGreaterThan(eigenVon(basis, figur(basis, "justiz")!).faehigkeit + 5);
    expect(eigenVon(w, figur(w, "opposition")!).ehrgeiz).toBeGreaterThan(eigenVon(basis, figur(basis, "opposition")!).ehrgeiz);
  });

  test("Unternehmer hebt das Wirtschaftsressort, Ökonom den Finanzminister", () => {
    const basis = frisch();
    const u = createWorld(turkey2026, 2);
    startAfterElection(u, profil({ beruf: "Unternehmer" }));
    expect(eigenVon(u, figur(u, "wirtschaft")!).faehigkeit).toBeGreaterThan(eigenVon(basis, figur(basis, "wirtschaft")!).faehigkeit + 5);
    const o = createWorld(turkey2026, 2);
    startAfterElection(o, profil({ beruf: "Ökonom" }));
    expect(eigenVon(o, figur(o, "finanzen")!).faehigkeit).toBeGreaterThan(eigenVon(basis, figur(basis, "finanzen")!).faehigkeit + 5);
  });

  test("Studentenbewegung: Der Generalstab misstraut", () => {
    const basis = frisch();
    const w = createWorld(turkey2026, 2);
    startAfterElection(w, profil({ jugend: "Studentenbewegung" }));
    expect(figur(w, "generalstab")!.loyalitaet).toBeLessThan(figur(basis, "generalstab")!.loyalitaet - 5);
  });

  test("Motiv Ehrgeiz: mehr Kapital, aber der Stab fürchtet dich", () => {
    const basis = frisch();
    const w = createWorld(turkey2026, 2);
    startAfterElection(w, profil({ motiv: "Ehrgeiz" }));
    expect(w.spiel!.kapital).toBeGreaterThan(basis.spiel!.kapital);
    expect(figur(w, "stab")!.loyalitaet).toBeLessThan(figur(basis, "stab")!.loyalitaet);
  });

  test("Wahlnacht: Jeder Ausgang hat Vorteil und Preis, keiner ist strikt besser", () => {
    const basis = frisch();
    const ausgaenge = ["knapp", "klar", "erste"] as const;
    const ws = ausgaenge.map((stil) => {
      const w = createWorld(turkey2026, 2);
      startAfterElection(w, profil({ wahlStil: stil }));
      return w;
    });
    const kapital = ws.map((w) => w.spiel!.kapital - basis.spiel!.kapital);
    const partner = ws.map((w) => (figur(w, "partner") ? figur(w, "partner")!.loyalitaet : 0));
    // knapp: mehr Kapital und Partnerloyalität; klar: weniger Partnerloyalität; erste Runde: am meisten Kapital
    expect(kapital[0]!).toBeGreaterThan(0);
    expect(kapital[2]!).toBeGreaterThan(kapital[0]!);
    expect(kapital[1]!).toBe(0);
    if (figur(ws[0]!, "partner") && figur(ws[1]!, "partner")) expect(partner[0]!).toBeGreaterThan(partner[1]!);
    // Kein Ausgang ist in allen Wirkungen besser als ein anderer: Jeder trägt mindestens einen Vorteil und einen Preis
    for (const stil of ausgaenge) {
      const f = FOLGEN[`wahl:${stil}`]!;
      expect(f.vorteil.length + f.preis.length).toBeGreaterThanOrEqual(3);
    }
  });

  test("Die Antworten der Wahlnacht zeigen Vorteil und Preis an", () => {
    const st = STATIONS.find((s) => s.id === "wahlnacht")!;
    for (const a of st.answers) {
      expect(a.vorteil?.length ?? 0).toBeGreaterThan(5);
      expect(a.preis?.length ?? 0).toBeGreaterThan(5);
      expect(a.vorteil).not.toMatch(/⟦/);
    }
  });

  test("die Zusammenfassung nennt die Folgen der gewählten Biografie", () => {
    const folgen = biografieFolgen({ beruf: "Arzt", jugend: "Familienbetrieb", motiv: "Korruption", partner: "Krankenpfleger, bodenständig, meidet Kameras", wahlStil: "klar" });
    expect(folgen.map((f) => f.id)).toEqual(["arzt", "familienbetrieb", "korruption", "krankenpfleger", "wahl_klar"]);
  });

  test("wendeBiografieAn ohne Spielstand tut nichts und liefert die Merkmale", () => {
    const w = createWorld(turkey2026, 1);
    expect(wendeBiografieAn(w, { beruf: "Arzt", jugend: "", motiv: "", partner: "" })).toEqual(["arzt"]);
  });
});
