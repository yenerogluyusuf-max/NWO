// MIL-1 „Krieg als Vorgang“: Phasenübergänge (spannung → drohkulisse → beschluss → krieg → waffenruhe → frieden),
// Parlamentspflicht beim Einsatzbeschluss (Erlass als teurer Ausweg), Doktrin-Passung (konsistent schlägt gemischt),
// Erschöpfungsuhr mit Anti-Aussitzen-Floor, Friedenspreise mit Presse-Effekt, Demobilisierungs-Sperre,
// Putsch-Risiko-Ereignis bei Niederlage, Migration alter Spielstände und Determinismus.

import { describe, expect, test } from "vitest";
import { createWorld, advance, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import {
  KRIEG,
  aktiveKriege,
  doktrinPassung,
  eigenStaerke,
  fuehreKriegHandlungAus,
  gegnerStaerke,
  handlungenFuer,
  kriegMit,
  kriegMonat,
  kriege,
  paketAnnahme,
  poVerlustFuer,
  presseFaktor,
} from "../src/sim/krieg";
import { wirke } from "../src/sim/wirkung";
import { nationalAverage } from "../src/sim/netz";
import { NET } from "../src/sim/modell";
import { weltZustand } from "../src/sim/laender";
import { reichZustand } from "../src/sim/reich";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";
import type { KriegVorgang } from "../src/sim/krieg-typen";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 120;
  return w;
}

/** Mehrheit im Parlament herstellen (eigene Partei so groß, dass der Beschluss sicher durchgeht). */
function mehrheit(w: World, sitze: number): void {
  w.parliament!.seats = { [w.player!.partei.kurz]: sitze };
}

/** Einen Spannungs-Vorgang mit Griechenland über die Monatsprüfung entstehen lassen. */
function spannungMitGrc(w: World): KriegVorgang {
  weltZustand(w)["GRC"]!.konflikt = 80;
  kriegMonat(w, new Rng(1));
  const k = kriegMit(w, "GRC");
  expect(k, "Spannungs-Vorgang entsteht aus der Konflikt-Dimension").toBeTruthy();
  return k!;
}

/** In die Drohkulisse treiben (Eskalation über der Schwelle, ein Tages-Schritt). */
function inDrohkulisse(w: World, k: KriegVorgang): void {
  k.eskalation = 80;
  const rng = new Rng(w.rngState);
  w.rngState = rng.state;
  advance(w, 1);
  expect(k.phase, "Übergang spannung → drohkulisse").toBe("drohkulisse");
}

describe("Phasengerüst: der volle Weg durch den Vorgang", () => {
  test("spannung → drohkulisse → beschluss → krieg → waffenruhe → frieden", () => {
    const w = welt();
    mehrheit(w, 400);
    const k = spannungMitGrc(w);
    expect(k.phase).toBe("spannung");
    expect(aktiveKriege(w)).toHaveLength(1);

    inDrohkulisse(w, k);
    // Auto-Stopp Klasse A: die Drohkulisse liegt als Entscheidungs-Ereignis auf dem Tisch
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "krieg_drohkulisse")).toBe(true);

    // Kriegsziel mit Rahmung deklarieren (legt die Preise der Folgehandlungen fest)
    const ziel = fuehreKriegHandlungAus(w, k.id, "ziel_verteidigung");
    expect(ziel.ok, ziel.text).toBe(true);
    expect(k.rahmung).toBe("verteidigung");
    // Ohne Deklaration gibt es keinen Beschluss; danach schon
    expect(handlungenFuer(w, k.id).some((h) => h.id === "beschluss" && h.moeglich)).toBe(true);

    // Einsatzbeschluss ins Parlament
    const b = fuehreKriegHandlungAus(w, k.id, "beschluss");
    expect(b.ok, b.text).toBe(true);
    expect(k.phase).toBe("beschluss");
    advance(w, KRIEG.beschlussTage);
    expect(k.phase, "Parlament mit Mehrheit beschließt den Krieg").toBe("krieg");
    expect(k.uhr).toBeGreaterThan(90);

    // Verlauf: wöchentliche Frontlage; der Gegner bietet bei Erschöpfung Waffenruhe an
    k.uhrGegner = 30;
    const wr = fuehreKriegHandlungAus(w, k.id, "waffenruhe");
    expect(wr.ok, wr.text).toBe(true);
    expect(k.phase).toBe("waffenruhe");

    // Schrittweiser Frieden: Paket über die Kriegs-Klauseln
    const pakete = handlungenFuer(w, k.id).filter((h) => h.id.startsWith("paket_"));
    expect(pakete.length).toBeGreaterThan(0);
    const f = fuehreKriegHandlungAus(w, k.id, "paket_ausgewogen");
    expect(f.ok, f.text).toBe(true);
    expect(k.phase).toBe("frieden");
    expect(k.ausgang).toBe("weisser_frieden");
  });

  test("defensiver Pfad: ab der Angriffsschwelle schlägt der Gegner zu (Selbstverteidigungs-Rahmung)", () => {
    const w = welt();
    const k = spannungMitGrc(w);
    inDrohkulisse(w, k);
    weltZustand(w)["GRC"]!.konflikt = 96; // die Eskalation folgt der Konflikt-Dimension über die Schwelle
    k.eskalation = KRIEG.angriffAb;
    advance(w, 1);
    expect(k.phase).toBe("krieg");
    expect(k.rahmung, "ohne eigene Deklaration liegt die Verteidigungs-Rahmung auf der Hand").toBe("verteidigung");
  });

  test("stiller Ausstieg: Deeskalation unter die Ruheschwelle beendet den Vorgang", () => {
    const w = welt();
    const k = spannungMitGrc(w);
    weltZustand(w)["GRC"]!.konflikt = 20;
    k.eskalation = KRIEG.spannungAus - 1;
    advance(w, 2);
    expect(k.phase).toBe("beendet");
    expect(k.ausgang).toBe("rueckzug");
    expect(aktiveKriege(w)).toHaveLength(0);
  });

  test("höchstens zwei aktive Konflikte gleichzeitig", () => {
    const w = welt();
    const z = weltZustand(w);
    z["GRC"]!.konflikt = 80;
    z["IRN"]!.konflikt = 80;
    z["ISR"]!.konflikt = 80;
    kriegMonat(w, new Rng(1));
    expect(aktiveKriege(w).length).toBeLessThanOrEqual(KRIEG.maxAktiv);
    expect(kriegMit(w, "ISR")).toBeUndefined();
  });
});

describe("Parlamentspflicht und Erlass", () => {
  test("ohne Mehrheit scheitert der Einsatzbeschluss und gilt als Schwäche", () => {
    const w = welt();
    mehrheit(w, 50);
    const k = spannungMitGrc(w);
    inDrohkulisse(w, k);
    fuehreKriegHandlungAus(w, k.id, "ziel_verteidigung");
    const zustimmungVorher = w.spiel!.umfrage.zustimmung;
    fuehreKriegHandlungAus(w, k.id, "beschluss");
    advance(w, KRIEG.beschlussTage);
    expect(k.phase, "kein Krieg ohne Parlamentsmehrheit").not.toBe("krieg");
    expect(k.phase).toBe("drohkulisse");
    expect(w.spiel!.umfrage.zustimmung, "verlorene Abstimmung kostet Zustimmung").toBeLessThan(zustimmungVorher);
  });

  test("der Erlass umgeht das Parlament: doppelte Kosten und Vertrauensverlust", () => {
    const w = welt();
    mehrheit(w, 50); // keine Mehrheit nötig
    const k = spannungMitGrc(w);
    inDrohkulisse(w, k);
    fuehreKriegHandlungAus(w, k.id, "ziel_verteidigung");
    const sichtB = handlungenFuer(w, k.id).find((h) => h.id === "beschluss")!;
    const sichtE = handlungenFuer(w, k.id).find((h) => h.id === "beschluss_erlass")!;
    expect(sichtE.pk, "Erlass kostet das Doppelte").toBe(sichtB.pk * 2);
    const kapitalVorher = w.spiel!.kapital;
    const r = fuehreKriegHandlungAus(w, k.id, "beschluss_erlass");
    expect(r.ok, r.text).toBe(true);
    expect(k.phase).toBe("krieg");
    expect(kapitalVorher - w.spiel!.kapital).toBe(sichtE.pk);
  });
});

describe("Doktrin-Passung (Suzerain-Konsistenz-Regel)", () => {
  function doktrinDrohnen(w: World): void {
    reichZustand(w).bestand["doktrin_drohnen"] = { seit: w.date, zustand: 90 };
  }

  test("konsistente Doktrin wirkt multiplikativ stärker als jede Mischung", () => {
    const w = welt();
    doktrinDrohnen(w);
    // Konsistent: Kernglieder des Drohnenverbunds erfüllt (Modernisierung ≥ 55, Bereitschaft Luftwaffe ≥ 55)
    wirke(w, "modernisierung", 40);
    wirke(w, "bereitschaft_luft", 30);
    const konsistent = doktrinPassung(w);
    expect(konsistent.konsistent).toBe(true);
    expect(konsistent.fehlt).toHaveLength(0);

    // Gemischt: ein Kernglied fällt weg — die UND-Paarung verwässert die ganze Linie
    wirke(w, "modernisierung", -80);
    const gemischt = doktrinPassung(w);
    expect(gemischt.konsistent).toBe(false);
    expect(gemischt.fehlt.length).toBeGreaterThan(0);
    expect(konsistent.faktor, "konsistent schlägt gemischt").toBeGreaterThan(gemischt.faktor);

    // Ohne Doktrin bleibt der Faktor neutral
    const w2 = welt(7);
    expect(doktrinPassung(w2).faktor).toBe(1);
  });

  test("die Passung schlägt sich in der eigenen Stärke nieder (Vorbereitung multiplikativ)", () => {
    const w = welt();
    const k = spannungMitGrc(w);
    doktrinDrohnen(w);
    wirke(w, "modernisierung", 40);
    wirke(w, "bereitschaft_luft", 30);
    const stark = eigenStaerke(w, k);
    wirke(w, "modernisierung", -80);
    const schwach = eigenStaerke(w, k);
    expect(stark).toBeGreaterThan(schwach);
    // Gegnerstärke ist lesbar und steigt mit der Eskalation
    expect(gegnerStaerke(w, "GRC")).toBeGreaterThan(0);
  });
});

describe("Erschöpfungsuhr und Anti-Aussitzen", () => {
  function imKrieg(w: World): KriegVorgang {
    mehrheit(w, 400);
    const k = spannungMitGrc(w);
    inDrohkulisse(w, k);
    fuehreKriegHandlungAus(w, k.id, "ziel_verteidigung");
    fuehreKriegHandlungAus(w, k.id, "beschluss");
    advance(w, KRIEG.beschlussTage);
    expect(k.phase).toBe("krieg");
    return k;
  }

  test("die Uhr fällt mit Verlusten und Dauer, aber nicht unter 0, solange der Gegner das Kriegsziel nicht kontrolliert", () => {
    const w = welt();
    const k = imKrieg(w);
    k.front = 60; // der Gegner kontrolliert nichts
    k.uhr = 0.4;
    k.seit = w.day - 6; // nach dem nächsten Tag ist der Wochenschritt fällig
    advance(w, 1);
    expect(k.woche).toBe(1);
    expect(k.uhr, "Anti-Aussitzen: Floor bei 0 ohne feindliche Zielkontrolle").toBe(0);

    // Kontrolliert der Gegner das Ziel (Front tief), entfällt der Floor
    k.front = 20;
    k.seit = w.day - 6;
    advance(w, 1);
    expect(k.uhr, "mit feindlicher Zielkontrolle kann die Uhr unter 0 fallen").toBeLessThan(0);
  });

  test("Stagnation über zwei Wochen untergräbt das Offiziersvertrauen", () => {
    const w = welt();
    const k = imKrieg(w);
    const vorher = nationalAverage(NET, w.net, "offiziersvertrauen");
    // Zwei Stillstandswochen erzwingen: der Verstärkungs-Schub gleicht den Rückzug exakt aus
    k.frontSchub = 5;
    k.seit = w.day - 6;
    advance(w, 1);
    expect(k.stagnation, "erste Stillstandswoche").toBe(1);
    k.frontSchub = 5;
    k.seit = w.day - 6;
    advance(w, 1);
    expect(k.stagnation, "zweite Stillstandswoche").toBe(2);
    expect(nationalAverage(NET, w.net, "offiziersvertrauen"), "Stagnation frisst die Führung").toBeLessThan(vorher);
  });
});

describe("Friedenspreise: freie Presse verteuert den Frieden", () => {
  test("derselbe Friedenspreis kostet bei freier Presse mehr Zustimmung", () => {
    const w = welt();
    const gelenkt = poVerlustFuer(w, 6);
    wirke(w, "pressefreiheit", 50);
    const frei = poVerlustFuer(w, 6);
    expect(frei).toBeGreaterThan(gelenkt);
    expect(presseFaktor(w)).toBeGreaterThan(1);
  });

  test("Paket-Annahme folgt der Erschöpfung beider Seiten", () => {
    const w = welt();
    const k = spannungMitGrc(w);
    k.front = 50;
    k.uhr = 100;
    k.uhrGegner = 90;
    const p = { gebiet: 0 as const, reparation: 0 as const, garantien: true, rueckzug: true };
    const frisch = paketAnnahme(w, k, p);
    k.uhrGegner = 20;
    const erschoepft = paketAnnahme(w, k, p);
    expect(erschoepft).toBeGreaterThan(frisch);
  });
});

describe("Demobilisierungs-Rechnung (90 Tage)", () => {
  test("er erneute Mobilisierung ist gesperrt, bis der Auslauf bezahlt ist", () => {
    const w = welt();
    mehrheit(w, 400);
    const k = spannungMitGrc(w);
    inDrohkulisse(w, k);
    fuehreKriegHandlungAus(w, k.id, "mobil_teil");
    expect(k.mobilmachung).toBe(1);
    fuehreKriegHandlungAus(w, k.id, "ziel_verteidigung");
    fuehreKriegHandlungAus(w, k.id, "beschluss");
    advance(w, KRIEG.beschlussTage);
    k.uhrGegner = 30;
    fuehreKriegHandlungAus(w, k.id, "waffenruhe");
    const f = fuehreKriegHandlungAus(w, k.id, "paket_ausgewogen");
    expect(f.ok, f.text).toBe(true);
    expect(k.demobSperreBis, "90-Tage-Sperre steht").toBe(w.day + KRIEG.demobTage);
    expect(k.mobilmachung).toBe(0);

    // Zweiter Konflikt: Mobilmachung gesperrt, mit ehrlicher Begründung
    weltZustand(w)["IRN"]!.konflikt = 80;
    kriegMonat(w, new Rng(2));
    const k2 = kriegMit(w, "IRN")!;
    k2.eskalation = 80;
    advance(w, 1);
    const mobil = handlungenFuer(w, k2.id).find((h) => h.id === "mobil_teil")!;
    expect(mobil.moeglich).toBe(false);
    expect(mobil.grund).toContain("Demobilisierung");

    // Nach den 90 Tagen ist der Weg wieder frei
    advance(w, KRIEG.demobTage + 2);
    expect(handlungenFuer(w, k2.id).find((h) => h.id === "mobil_teil")!.moeglich).toBe(true);
  });
});

describe("Niederlage und Putsch-Risiko", () => {
  test("Niederlage bei zerbrochenem Offiziersvertrauen löst das Putsch-Risiko-Ereignis aus", () => {
    const w = welt();
    mehrheit(w, 400);
    const k = spannungMitGrc(w);
    inDrohkulisse(w, k);
    fuehreKriegHandlungAus(w, k.id, "ziel_verteidigung");
    fuehreKriegHandlungAus(w, k.id, "beschluss");
    advance(w, KRIEG.beschlussTage);
    expect(k.phase).toBe("krieg");
    // Offiziersvertrauen zerbrechen und die Front zusammenbrechen lassen
    wirke(w, "offiziersvertrauen", -35);
    k.front = 20; // feindliche Zielkontrolle: der Uhr-Floor entfällt
    k.uhr = -99;
    k.seit = w.day - 6;
    advance(w, 1);
    expect(k.phase).toBe("beendet");
    expect(k.ausgang).toBe("niederlage");
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "putschgeruechte"), "Putsch-Risiko-Ereignis liegt auf dem Tisch").toBe(true);
  });

  test("bei intaktem Offizierskorps bleibt das Putsch-Ereignis aus", () => {
    const w = welt();
    mehrheit(w, 400);
    const k = spannungMitGrc(w);
    inDrohkulisse(w, k);
    fuehreKriegHandlungAus(w, k.id, "ziel_verteidigung");
    fuehreKriegHandlungAus(w, k.id, "beschluss");
    advance(w, KRIEG.beschlussTage);
    wirke(w, "offiziersvertrauen", 40); // Vertrauen weit über der Schwelle
    k.front = 20;
    k.uhr = -99;
    k.seit = w.day - 6;
    advance(w, 1);
    expect(k.ausgang).toBe("niederlage");
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "putschgeruechte")).toBe(false);
  });
});

describe("Spielstände und Determinismus", () => {
  test("ein alter Spielstand ohne Krieg-Feld lädt: kein Konflikt, kein Fehler", () => {
    const w = welt();
    spannungMitGrc(w);
    const roh = JSON.parse(JSON.stringify(w)) as World;
    delete roh.spiel!.kriege;
    const geladen = load(JSON.stringify(roh));
    expect(kriege(geladen)).toEqual([]);
    expect(kriegMit(geladen, "GRC")).toBeUndefined();
    advance(geladen, 5); // der Tick verträgt das fehlende Feld und legt es bei Bedarf an
    expect(kriege(geladen)).toBeDefined();
  });

  test("derselbe Seed mit denselben Schritten erzeugt denselben Konfliktverlauf", () => {
    const lauf = () => {
      const w = welt(11);
      mehrheit(w, 400);
      weltZustand(w)["GRC"]!.konflikt = 80;
      advance(w, 45);
      const k = kriegMit(w, "GRC");
      if (k) {
        k.eskalation = 80;
        advance(w, 30);
      }
      return JSON.stringify(w.spiel!.kriege ?? []);
    };
    expect(lauf()).toBe(lauf());
  });
});
