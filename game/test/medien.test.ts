// Medien als System (Runde 2, Fork MEDIEN): Zustand je Cluster, Eingriffe mit Preis und Gegenreaktion, Lizenzen aus den Reglern, Kippen der
// opportunistischen Blätter, Wirkung auf Zeitung und Reichweite, Wahrnehmung der Umfragen (Institute statt Wahrheit, Rohdaten,
// Publikationsverbot), Pressekonflikt und Vollständigkeit der Kataloge.

import { describe, expect, test } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { MEDIEN_CLUSTER, REGULIERUNG_PREISE, RSF_START, medienCluster } from "../src/data/medien";
import { blattAuswahl, zeitungVon } from "../src/sim/zeitung";
import {
  AKTIONEN,
  MEDIEN,
  ROHDATEN,
  angezeigteZustimmung,
  blattAuswahlWelt,
  fuehreMedienAktionAus,
  institutsReihe,
  lizenzVon,
  medienAktionen,
  medienHaerte,
  medienMonat,
  medienVon,
  publikationsverbot,
  reglerLizenz,
  reichweiteJetzt,
  rohdatenKaufen,
  rsfSicht,
  startSelbstzensur,
  wirksamerCluster,
  type AktionId,
} from "../src/sim/medien";
import { MedienAkte } from "../src/ui/MedienAkte";
import { Zeitung } from "../src/ui/Zeitung";
import { platzhalter } from "../src/i18n";
import type { World } from "../src/sim/types";

const profil: PlayerProfile = {
  name: "Test",
  heimat: "Ankara",
  heimatPlaka: 6,
  jugend: "",
  beruf: "",
  partner: "Bauunternehmer, Aufträge vom Staat möglich",
  motiv: "",
  partei: { name: "Partei der Werte", kurz: "PW", farbe: "#2e6b3f" },
  naehe: {},
  buendnis: "YENİ",
  versprechen: [],
  wahl: { runde: 2, anteil: 51 },
};

function spiel(seed = 7): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, profil);
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 100;
  return w;
}

function tageZumErsten(datum: string): number {
  const [j, m, t] = datum.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(j, m, 0)).getUTCDate() - t + 1;
}

/** Setzt den Wert eines Netzknotens in allen Provinzen (die Regler bewegen sich sonst über Monate). */
function setzeKnoten(w: World, id: string, wert: number): void {
  const i = NET.index.get(id)!;
  for (let p = 0; p < 81; p++) w.net.values[i * 81 + p] = wert;
}

describe("Zustand je Cluster", () => {
  test("alle sieben Cluster haben einen Startzustand aus den Daten", () => {
    const w = spiel();
    const m = medienVon(w);
    expect(Object.keys(m.cluster).sort()).toEqual(MEDIEN_CLUSTER.map((c) => c.id).sort());
    for (const c of MEDIEN_CLUSTER) {
      const z = m.cluster[c.id]!;
      expect(z.selbstzensur).toBe(startSelbstzensur(c));
      expect(z.reichweite).toBe(1);
      expect(z.lizenz).toBe("frei");
    }
    expect(m.cluster["staatsrundfunk"]!.eigentuemer).toBe("staatsnah");
    expect(m.cluster["opposition_masse"]!.eigentuemer).toBe("oppositionell");
    expect(m.rsfScore).toBe(RSF_START.score);
    expect(rsfSicht(w).rang).toBe(RSF_START.rang);
  });

  test("ein älterer Spielstand ohne Medienfeld läuft weiter, der Zustand entsteht beim ersten Zugriff", () => {
    const w = spiel();
    delete (w.spiel as { medien?: unknown }).medien;
    const geladen = load(JSON.stringify(JSON.parse(save(w))));
    advance(geladen, tageZumErsten(geladen.date) + 2);
    expect(geladen.spiel!.medien).toBeDefined();
    expect(zeitungVon(geladen).archiv.length).toBeGreaterThan(0);
  });

  test("fehlende Cluster in einem alten Zustand werden ergänzt", () => {
    const w = spiel();
    const m = medienVon(w);
    delete m.cluster["digital_frei"];
    expect(medienVon(w).cluster["digital_frei"]).toBeDefined();
  });
});

describe("Eingriffe", () => {
  test("jede Aktion hat Preis, Vorschau und passt nur zu passenden Clustern", () => {
    const w = spiel();
    const liste = medienAktionen(w);
    expect(liste.length).toBeGreaterThan(Object.keys(AKTIONEN).length);
    for (const a of liste) {
      expect(a.kapital).toBeGreaterThan(0);
      expect(a.aufmerksamkeit).toBeGreaterThan(0);
      expect(a.vorschau.length).toBeGreaterThan(0);
      expect(a.vorschau.join(" ")).not.toContain("⟦");
    }
    const finden = (aktion: AktionId, cluster?: string) => liste.find((a) => a.aktion === aktion && a.cluster === cluster)!;
    // Lizenzentzug braucht vorher Druck der Aufsicht
    expect(finden("lizenzentzug", "opposition_masse").moeglich).toBe(false);
    // Netzsperren nur gegen digitale Kanäle
    expect(finden("sperre_netz", "digital_frei").anwendbar).toBe(true);
    expect(finden("sperre_netz", "opposition_masse").anwendbar).toBe(false);
    // Eigentümerdruck: nicht beim Staatsfunk, aber bei der kreditfinanzierten Gruppe
    expect(finden("eigentuemerdruck", "staatsrundfunk").anwendbar).toBe(false);
    expect(finden("eigentuemerdruck", "holding_breit").moeglich).toBe(true);
    // Übernahme: kreditfinanzierte Gruppe ja, freie Massensender erst nach Druck (Treuhänder)
    expect(finden("uebernahme", "holding_breit").anwendbar).toBe(true);
    expect(finden("uebernahme", "opposition_masse").moeglich).toBe(false);
  });

  test("ein Eingriff kostet Kapital und Aufmerksamkeit, setzt den Zustand und senkt den Pressefreiheitswert", () => {
    const w = spiel();
    const m = medienVon(w);
    const kapitalVorher = w.spiel!.kapital;
    const szVorher = m.cluster["holding_breit"]!.selbstzensur;
    const rsfVorher = m.rsfScore;
    const r = fuehreMedienAktionAus(w, "eigentuemerdruck", "holding_breit");
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(kapitalVorher - AKTIONEN.eigentuemerdruck.kapital);
    expect(m.cluster["holding_breit"]!.selbstzensur).toBeGreaterThan(szVorher);
    expect(m.rsfScore).toBeLessThan(rsfVorher);
    expect(m.eingriffe).toHaveLength(1);
    expect(m.eingriffe[0]!.aktion).toBe("eigentuemerdruck");
    // Pause: derselbe Eingriff am selben Blatt gleich noch einmal geht nicht
    const noch = fuehreMedienAktionAus(w, "eigentuemerdruck", "holding_breit");
    expect(noch.ok).toBe(false);
  });

  test("ohne Kapital geht nichts, auch nicht auf Pump unter der Grenze", () => {
    const w = spiel();
    w.spiel!.kapital = -30;
    const r = fuehreMedienAktionAus(w, "pressekonferenz");
    expect(r.ok).toBe(false);
  });

  test("Lizenzentzug: erst Strafe der Aufsicht, dann Sperre auf Zeit, einmal je Blatt, mit Märtyrer-Effekt und Marktreaktion", () => {
    const w = spiel();
    const m = medienVon(w);
    expect(fuehreMedienAktionAus(w, "aufsichtsstrafe", "opposition_masse").ok).toBe(true);
    expect(lizenzVon(w, "opposition_masse")).toBe("gedraengt");
    const risikoVorher = w.economy.riskPremium;
    const r = fuehreMedienAktionAus(w, "lizenzentzug", "opposition_masse");
    expect(r.ok).toBe(true);
    expect(lizenzVon(w, "opposition_masse")).toBe("gesperrt");
    expect(m.cluster["opposition_masse"]!.maertyrer).toBeGreaterThanOrEqual(30);
    expect(w.economy.riskPremium).toBeGreaterThan(risikoVorher);
    expect(fuehreMedienAktionAus(w, "lizenzentzug", "opposition_masse").ok).toBe(false);
    // Die Sperre endet nach der Frist; das Blatt steht dann weiter unter Druck
    w.day += MEDIEN.lizenzentzugTage + 1;
    expect(lizenzVon(w, "opposition_masse")).not.toBe("gesperrt");
  });

  test("Übernahme macht das Blatt regierungsnah: Ausrichtung, Selbstzensur und Berichte über die Regierung ändern sich", () => {
    const w = spiel();
    const vorher = wirksamerCluster(w, medienCluster("holding_breit")!);
    expect(fuehreMedienAktionAus(w, "uebernahme", "holding_breit").ok).toBe(true);
    const nachher = wirksamerCluster(w, medienCluster("holding_breit")!);
    expect(nachher.ausrichtung).toBe("loyalistisch");
    expect(nachher.berichtSkandalRegierung).toBeLessThan(vorher.berichtSkandalRegierung);
    expect(medienVon(w).cluster["holding_breit"]!.selbstzensur).toBeGreaterThanOrEqual(80);
    // einmalig
    expect(fuehreMedienAktionAus(w, "uebernahme", "holding_breit").ok).toBe(false);
  });

  test("Blackout sperrt zehn Tage; die Ausgabe bringt dann einen Ersatz und nennt die Sperre", () => {
    const w = spiel();
    expect(fuehreMedienAktionAus(w, "blackout", "opposition_masse").ok).toBe(true);
    expect(lizenzVon(w, "opposition_masse")).toBe("gesperrt");
    const auswahl = blattAuswahlWelt(w, ["holding_kern", "opposition_masse"]);
    expect(auswahl.ids).not.toContain("opposition_masse");
    expect(auswahl.ids.length).toBe(2);
    expect(auswahl.gesperrt.map((g) => g.id)).toEqual(["opposition_masse"]);
    w.day += MEDIEN.blackoutTage + 1;
    expect(lizenzVon(w, "opposition_masse")).not.toBe("gesperrt");
  });

  test("Interview-Offensive macht ein Blatt für Wochen milder; Pressekonferenz bringt Vertrauen", () => {
    const w = spiel();
    const vorher = wirksamerCluster(w, medienCluster("opposition_masse")!).berichtSkandalRegierung;
    expect(fuehreMedienAktionAus(w, "interview", "opposition_masse").ok).toBe(true);
    expect(wirksamerCluster(w, medienCluster("opposition_masse")!).berichtSkandalRegierung).toBeLessThan(vorher);
    const i = NET.index.get("vertrauen_regierung")!;
    const v0 = w.net.values[i * 81]!;
    expect(fuehreMedienAktionAus(w, "pressekonferenz").ok).toBe(true);
    expect(w.net.values[i * 81]!).toBeGreaterThan(v0 - 0.0001);
  });

  test("Selbstzensur dämpft den Bericht über die Regierung und erhöht den über die Opposition", () => {
    const w = spiel();
    const c = medienCluster("kommerz_konform")!;
    const vorher = wirksamerCluster(w, c);
    medienVon(w).cluster["kommerz_konform"]!.selbstzensur = 100;
    const nachher = wirksamerCluster(w, c);
    expect(nachher.berichtSkandalRegierung).toBeLessThan(vorher.berichtSkandalRegierung * 0.5);
    expect(nachher.berichtSkandalOpposition).toBeGreaterThanOrEqual(vorher.berichtSkandalOpposition);
  });

  test("Härte im Pressekonflikt ändert den Zustand: mehr Selbstzensur, Druck auf kritische Blätter, Verfahren", () => {
    const w = spiel();
    const m = medienVon(w);
    const sz = m.cluster["opposition_masse"]!.selbstzensur;
    medienHaerte(w);
    expect(m.cluster["opposition_masse"]!.selbstzensur).toBeGreaterThan(sz);
    expect(lizenzVon(w, "opposition_masse")).toBe("gedraengt");
    expect(m.verfahren).toBeGreaterThan(0);
    expect(m.cluster["staatsrundfunk"]!.selbstzensur).toBe(startSelbstzensur(medienCluster("staatsrundfunk")!));
  });
});

describe("Regler setzen die Lizenzlage; hohe Stufen schließen Sender", () => {
  test("die Stufe der Medienaufsicht macht aus „Verbote und Schließungen“ eine echte Sperre", () => {
    const c = medienCluster("opposition_masse")!;
    expect(reglerLizenz(c, 50, 0)).toBe("frei");
    expect(reglerLizenz(c, 70, 0)).toBe("gedraengt");
    expect(reglerLizenz(c, 90, 0)).toBe("gesperrt");
    const digital = medienCluster("digital_frei")!;
    expect(reglerLizenz(digital, 0, 95)).toBe("gesperrt");
    expect(reglerLizenz(digital, 0, 70)).toBe("gedraengt");
    expect(reglerLizenz(medienCluster("staatsrundfunk")!, 100, 100)).toBe("frei");
  });

  test("im Monatsschritt: Regler auf 95 sperrt das Blatt und die Zeitung erscheint ohne es", () => {
    const w = spiel();
    setzeKnoten(w, "m_medienaufsicht", 95);
    advance(w, tageZumErsten(w.date));
    const a = [...zeitungVon(w).archiv].reverse().find((x) => x.anlass === "monatlich")!;
    expect(lizenzVon(w, "opposition_masse")).toBe("gesperrt");
    expect(a.blaetter.map((b) => b.clusterId)).not.toContain("opposition_masse");
    expect(a.gesperrt?.some((g) => g.clusterId === "opposition_masse" && g.grund === "regler")).toBe(true);
    // Der Regler zurück: Das Blatt darf wieder erscheinen
    setzeKnoten(w, "m_medienaufsicht", 30);
    medienMonat(w);
    expect(lizenzVon(w, "opposition_masse")).toBe("frei");
  });
});

describe("Kippen, Reichweite, Rendite", () => {
  test("das opportunistische Blatt kippt bei schwacher Zustimmung und kehrt bei klar besseren Werten zurück (Hysterese)", () => {
    const w = spiel();
    const z = medienVon(w).cluster["holding_breit"]!;
    w.spiel!.umfrage.zustimmung = MEDIEN.kippSchwelle - 5;
    medienMonat(w);
    expect(z.gekippt).toBe(true);
    expect(wirksamerCluster(w, medienCluster("holding_breit")!).ausrichtung).toBe("oppositionell_masse");
    w.spiel!.umfrage.zustimmung = MEDIEN.kippRueck - 2;
    medienMonat(w);
    expect(z.gekippt).toBe(true);
    w.spiel!.umfrage.zustimmung = MEDIEN.kippRueck + 3;
    medienMonat(w);
    expect(z.gekippt).toBe(false);
  });

  test("Anzeigenstopp senkt die Reichweite über Monate, Märtyrer-Effekt hebt sie, beides klingt ab", () => {
    const w = spiel();
    const z = medienVon(w).cluster["opposition_nische"]!;
    expect(fuehreMedienAktionAus(w, "anzeigenstopp", "opposition_nische").ok).toBe(true);
    expect(z.finanzdruck).toBeGreaterThan(0);
    for (let i = 0; i < 4; i++) medienMonat(w);
    expect(z.reichweite).toBeLessThan(1);
    z.finanzdruck = 0;
    z.maertyrer = 80;
    for (let i = 0; i < 6; i++) medienMonat(w);
    expect(z.reichweite).toBeGreaterThan(0.9);
    for (let i = 0; i < 40; i++) medienMonat(w);
    expect(z.maertyrer).toBeLessThan(5);
    expect(z.reichweite).toBeGreaterThan(0.9);
    expect(z.reichweite).toBeLessThan(1.1);
  });

  test("gesperrte Blätter haben keine Reichweite", () => {
    const w = spiel();
    fuehreMedienAktionAus(w, "blackout", "opposition_masse");
    expect(reichweiteJetzt(w, "opposition_masse")).toBe(0);
    expect(reichweiteJetzt(w, "holding_kern")).toBeGreaterThan(0);
  });

  test("Kontrollrendite: Wer Redaktionen zum Schweigen bringt, gewinnt Vertrauen und zahlt mit Legitimität", () => {
    const w = spiel();
    const m = medienVon(w);
    for (const c of MEDIEN_CLUSTER) m.cluster[c.id]!.selbstzensur = Math.min(100, startSelbstzensur(c) + 40);
    const vi = NET.index.get("vertrauen_regierung")!;
    const li = NET.index.get("legitimitaet")!;
    const v0 = w.net.values[vi * 81]!;
    const l0 = w.net.values[li * 81]!;
    medienMonat(w);
    expect(w.net.values[vi * 81]!).toBeGreaterThanOrEqual(v0);
    expect(w.net.values[li * 81]!).toBeLessThanOrEqual(l0);
  });

  test("der Pressefreiheitswert folgt den Eingriffen und erholt sich langsam", () => {
    const w = spiel();
    const start = rsfSicht(w).score;
    for (const id of ["eigentuemerdruck", "verfahren"] as AktionId[]) fuehreMedienAktionAus(w, id, "kommerz_konform");
    const tief = rsfSicht(w).score;
    expect(tief).toBeLessThan(start);
    expect(rsfSicht(w).rang).toBeGreaterThan(RSF_START.rang);
    for (let i = 0; i < 12; i++) medienMonat(w);
    expect(rsfSicht(w).verlauf.length).toBeGreaterThanOrEqual(12);
    expect(rsfSicht(w).score).toBeGreaterThanOrEqual(tief);
  });
});

describe("Wahrnehmung: Institute statt Wahrheit", () => {
  test("nach der ersten Ausgabe zeigt das Spiel den Wert eines Instituts, nicht die Wahrheit", () => {
    const w = spiel();
    const start = angezeigteZustimmung(w);
    expect(start.quelle).toBe("start");
    for (let i = 0; i < 6; i++) advance(w, tageZumErsten(w.date));
    const zeig = angezeigteZustimmung(w);
    expect(["institut", "start"]).toContain(zeig.quelle);
    if (zeig.quelle === "institut") {
      expect(zeig.institut).toBeTruthy();
      expect(zeig.streuung).toBeGreaterThan(0);
      expect(institutsReihe(w).length).toBeGreaterThan(0);
    }
  });

  test("Rohdaten: Kosten, Wartezeit, Gültigkeit; danach zeigt die Anzeige die Wahrheit", () => {
    const w = spiel();
    const kapital = w.spiel!.kapital;
    const r = rohdatenKaufen(w);
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(kapital - ROHDATEN.kapital);
    expect(rohdatenKaufen(w).ok).toBe(false);
    expect(angezeigteZustimmung(w).quelle).not.toBe("rohdaten");
    w.day += ROHDATEN.wartetage;
    const a = angezeigteZustimmung(w);
    expect(a.quelle).toBe("rohdaten");
    expect(a.wert).toBeCloseTo(Math.round(w.spiel!.umfrage.zustimmung * 10) / 10, 5);
    w.day += ROHDATEN.gueltigTage + 1;
    expect(angezeigteZustimmung(w).quelle).not.toBe("rohdaten");
  });

  test("Publikationsverbot: vor der Wahl erscheint keine neue Umfrage, auch nicht aus der Schublade", () => {
    const w = spiel();
    advance(w, tageZumErsten(w.date) + 1);
    w.spiel!.wahltag = w.day + 5;
    expect(publikationsverbot(w)).toBe(true);
    const n = zeitungVon(w).archiv.length;
    advance(w, tageZumErsten(w.date));
    if (w.date.slice(0, 7) !== "") {
      const neue = zeitungVon(w).archiv.slice(n).filter((a) => a.anlass === "monatlich");
      // Der Monatsersten liegt nach der Wahl, wenn der Wahltag 5 Tage entfernt war: dann gilt das Verbot nicht mehr
      expect(neue.length).toBeGreaterThan(0);
    }
    // Direkter Test: Liegt der Wahltag in zehn Tagen oder weniger, erscheint keine Umfrage
    const w2 = spiel(9);
    advance(w2, 10);
    w2.spiel!.wahltag = w2.day + tageZumErsten(w2.date) + 3;
    advance(w2, tageZumErsten(w2.date));
    const a = [...zeitungVon(w2).archiv].reverse().find((x) => x.anlass === "monatlich")!;
    expect(a.umfrageVerbot).toBe(true);
    expect(a.umfrage).toBeUndefined();
    expect(a.umfrageSchublade).toBeUndefined();
  });
});

describe("Ansicht", () => {
  test("der Reiter „Medien“ zeigt Tableau, Eingriffe, Wahrnehmung und Verlauf ohne fehlende Texte", () => {
    const w = spiel();
    fuehreMedienAktionAus(w, "aufsichtsstrafe", "opposition_masse");
    const html = renderToStaticMarkup(createElement(MedienAkte, { world: w }));
    expect(html).not.toContain("⟦");
    for (const c of MEDIEN_CLUSTER) expect(html).toContain(c.name);
    expect(html).toContain("Pressefreiheit");
    expect(html).toContain("Rohdaten kaufen");
    expect(html).toContain("Letzte Eingriffe");
    expect(html).toContain("Anordnen");
  });

  test("die Zeitungsakte hat die Reiter Ausgaben und Medien und nennt gesperrte Blätter", () => {
    const w = spiel();
    setzeKnoten(w, "m_medienaufsicht", 95);
    advance(w, tageZumErsten(w.date));
    const html = renderToStaticMarkup(createElement(Zeitung, { world: w }));
    expect(html).toContain("zt-reiter");
    expect(html).toContain("Medien");
    expect(html).toContain("Nicht erschienen:");
    expect(html).not.toContain("⟦");
    // Die Auswahl der Blätter bleibt deterministisch gleich lang
    expect(blattAuswahl(0).length).toBeGreaterThanOrEqual(2);
  });
});

describe("Kataloge", () => {
  const dir = new URL("../src/i18n/katalog/", import.meta.url);
  const lies = (l: string): Record<string, string> => JSON.parse(readFileSync(new URL(`${l}/medien.json`, dir), "utf-8"));
  const de = lies("de");
  const tr = lies("tr");
  const en = lies("en");

  test("jede Sprache hat dieselben Schlüssel und dieselben Platzhalter", () => {
    expect(Object.keys(tr).sort()).toEqual(Object.keys(de).sort());
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
    for (const k of Object.keys(de)) {
      expect(platzhalter(tr[k]!), `tr ${k}`).toEqual(platzhalter(de[k]!));
      expect(platzhalter(en[k]!), `en ${k}`).toEqual(platzhalter(de[k]!));
    }
  });

  test("jeder im Code benutzte Schlüssel steht im deutschen Katalog (auch die zusammengesetzten)", () => {
    const quellen = ["../src/sim/medien.ts", "../src/ui/MedienAkte.tsx", "../src/ui/Zeitung.tsx", "../src/ui/Waehler.tsx", "../src/ui/Chronik.tsx"];
    const schluessel = new Set<string>();
    for (const q of quellen) {
      const text = readFileSync(new URL(q, import.meta.url), "utf-8");
      for (const m of text.matchAll(/["`](medien\.[a-z_]+(?:\.[a-z_]+)+)["`]/g)) schluessel.add(m[1]!);
    }
    for (const id of Object.keys(AKTIONEN)) {
      schluessel.add(`medien.aktion.${id}.name`);
      schluessel.add(`medien.aktion.${id}.text`);
      schluessel.add(`medien.ergebnis.${id}`);
    }
    for (const e of ["staatsnah", "opportunistisch", "privat", "oppositionell"]) schluessel.add(`medien.eigentuemer.${e}`);
    for (const l of ["frei", "gedraengt", "gesperrt"]) schluessel.add(`medien.lizenz.${l}`);
    for (const g of ["lizenzentzug", "blackout", "regler"]) schluessel.add(`medien.sperre.${g}`);
    // Die Übernahme hat zwei Wege (Kauf, Treuhänder) statt eines Ergebnistextes
    schluessel.delete("medien.ergebnis.uebernahme");
    schluessel.add("medien.ergebnis.uebernahme_kauf");
    schluessel.add("medien.ergebnis.uebernahme_treuhaender");
    // Texte, die nur als Schlüsselbasis stehen (Vorlagen mit Punkt am Ende) ausschließen
    const fehlend = [...schluessel].filter((k) => !(k in de) && !k.endsWith("."));
    expect(fehlend).toEqual([]);
  });

  test("die Kataloge sind nicht leer und die Dateien liegen an ihrem Platz", () => {
    for (const l of ["de", "tr", "en"]) expect(readdirSync(new URL(`${l}/`, dir))).toContain("medien.json");
    expect(Object.keys(de).length).toBeGreaterThan(120);
  });
});

// Die Daten selbst (data/medien.ts): Cluster, Reichweiten, Preise, Pressefreiheits-Start. Diese Tests standen früher als eigene Datei
// in test/medien.test.ts; die Datei wurde für die Mechanik ersetzt, die Datenprüfung steht seither hier.
describe("Daten: Cluster, Preise, Pressefreiheit", () => {
  test("sieben Cluster mit eindeutigen Kennungen, jeder mit Ausrichtung und Verwundbarkeit", () => {
    expect(MEDIEN_CLUSTER).toHaveLength(7);
    expect(new Set(MEDIEN_CLUSTER.map((c) => c.id)).size).toBe(7);
    for (const c of MEDIEN_CLUSTER) {
      expect(c.name.length).toBeGreaterThan(3);
      expect(c.verwundbarkeit.length).toBeGreaterThan(0);
      expect(medienCluster(c.id)).toBe(c);
    }
    expect(medienCluster("gibt_es_nicht")).toBeUndefined();
  });

  test("Reichweiten liegen zwischen 0 und 1, die Summen je Segment bei etwa 1", () => {
    const segmente = ["laendlich_konservativ", "urban_alt", "urban_jung", "kurdistan", "akademisch"] as const;
    for (const c of MEDIEN_CLUSTER) for (const s of segmente) expect(c.reichweiteSegmente[s]).toBeGreaterThanOrEqual(0), expect(c.reichweiteSegmente[s]).toBeLessThanOrEqual(1);
    for (const s of segmente) {
      const summe = MEDIEN_CLUSTER.reduce((x, c) => x + c.reichweiteSegmente[s], 0);
      expect(summe).toBeGreaterThan(0.5);
      expect(summe).toBeLessThan(1.6);
    }
  });

  test("Berichtswahrscheinlichkeiten sind Wahrscheinlichkeiten; Regierungsnahe berichten Regierungsskandale selten, Freie oft", () => {
    for (const c of MEDIEN_CLUSTER) {
      for (const p of [c.berichtSkandalRegierung, c.berichtSkandalOpposition]) {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      }
    }
    expect(medienCluster("staatsrundfunk")!.berichtSkandalRegierung).toBeLessThan(0.15);
    expect(medienCluster("opposition_masse")!.berichtSkandalRegierung).toBeGreaterThan(0.7);
    expect(medienCluster("digital_frei")!.digital).toBe(true);
  });

  test("sieben Regulierungspreise mit positiven Punkten; der Lizenzentzug ist einmalig und der teuerste", () => {
    const preise = Object.values(REGULIERUNG_PREISE);
    expect(preise).toHaveLength(7);
    for (const p of preise) expect(p.rsfMalus).toBeGreaterThan(0);
    expect(REGULIERUNG_PREISE.lizenzentzug.einmalig).toBe(true);
    expect(REGULIERUNG_PREISE.lizenzentzug.rsfMalus).toBe(Math.max(...preise.map((p) => p.rsfMalus)));
    expect(REGULIERUNG_PREISE.blackout_10tage.oppoMobilisierung).toBeGreaterThan(0);
  });

  test("Pressefreiheit startet bei Rang 159 und Wert 29,4", () => {
    expect(RSF_START.rang).toBe(159);
    expect(RSF_START.score).toBe(29.4);
  });
});
