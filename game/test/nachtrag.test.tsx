// Nachträgliche Parlamentswahl für ältere Spielstände: Die Wahl lief ohne neue Sitzverteilung; das Spiel fragt einmal und wertet auf Wunsch nachträglich aus.
// Der Teststand entsteht in-process: eine Partie bis nach der Wahl 2033 spielen, dann das alte Format herstellen (altes Parlament und Lager zurück, keine Wahl-Historie,
// keine Umbildung, keine Zielwahl) und bis zum 1. August 2033 laufen lassen.

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { NACHTRAG, parlamentNachtragAntwort, parlamentNachtragBeantwortet, parlamentNachtragFrage, parlamentNachtragPruefen, wahlabend } from "../src/sim/wahl";
import { Wahlabend } from "../src/ui/wahl/Wahlabend";
import { ParlamentNachtrag } from "../src/ui/wahl/ParlamentNachtrag";
import { ladeSprache, setzeSprache } from "../src/i18n";
import type { World } from "../src/sim/types";

const profil: PlayerProfile = {
  name: "Deniz Aydın",
  heimat: "Ankara",
  heimatPlaka: 6,
  jugend: "",
  beruf: "",
  partner: "Bauunternehmer",
  motiv: "",
  partei: { name: "Aufbruchspartei", kurz: "AP", farbe: "#2f5d62" },
  naehe: {},
  buendnis: "YENİ",
  versprechen: [],
  wahl: { runde: 2, anteil: 51 },
};

/** Ein Stand im alten Format, `monateNachWahl` Monate nach der Wahl (Amtszeit 2, Parlament und Lager wie vor der Wahl, ohne Historie). */
function alterStand(seed = 5, monateNachWahl = 2): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, profil);
  const sp = w.spiel!;
  sp.umfrage.zustimmung = 80;
  sp.kalibrierung += 33;
  advance(w, sp.wahltag - w.day - 2);
  const parlament = JSON.parse(JSON.stringify(w.parliament));
  const lager = [...sp.lager];
  advance(w, 4);
  if (sp.wahl?.stichwahl) advance(w, 16);
  if (sp.amtszeit !== 2) throw new Error("Wiederwahl blieb aus");
  advance(w, Math.round(monateNachWahl * 30.4));
  // In das alte Format zurück: Die Wahl hat damals nichts an den Sitzen geändert und nichts in der Historie hinterlassen
  w.parliament = parlament;
  sp.lager = lager;
  delete sp.wahl;
  delete sp.umbildung;
  delete sp.zielwahl;
  delete sp.zielArchiv;
  delete sp.amtszeiten;
  delete sp.wahlkampf;
  delete sp.nachfolge;
  sp.ereignisse = [];
  sp.hinweise = [];
  return w;
}

const sitze = (w: World): Record<string, number> => ({ ...w.parliament!.seats });
const summe = (s: Record<string, number>): number => Object.values(s).reduce((a, b) => a + b, 0);
const lagerSitze = (w: World): number => [w.player!.partei.kurz, ...w.spiel!.lager].reduce((s, p) => s + (w.parliament!.seats[p] ?? 0), 0);

afterEach(async () => {
  await setzeSprache("de");
});

describe("Die Frage", () => {
  test("Sie erscheint nach dem Laden eines alten Stands, genau einmal, und hält Umbildung und Zielwahl zurück", () => {
    const w = alterStand();
    expect(parlamentNachtragFrage(w)).toBeUndefined();
    expect(w.spiel!.wahl?.historie ?? []).toHaveLength(0);
    advance(w, 1);
    const f = parlamentNachtragFrage(w)!;
    expect(f).toBeDefined();
    expect(f.status).toBe("frage");
    expect(f.datum.slice(0, 7)).toBe("2033-06");
    expect(parlamentNachtragBeantwortet(w)).toBe(false);
    const seit = f.seit;
    // Über zwei Monatswechsel hinweg: Die Frage bleibt dieselbe, Umbildung und Zielwahl warten
    advance(w, 70);
    expect(parlamentNachtragFrage(w)!.seit).toBe(seit);
    expect(w.spiel!.umbildung).toBeUndefined();
    expect(w.spiel!.zielwahl).toBeUndefined();
    expect(w.log.filter((l) => l.text === "Die Parlamentswahl wurde noch ohne neue Sitzverteilung gespielt.")).toHaveLength(1);
    // Das Parlament bleibt unangetastet
    expect(w.spiel!.wahl!.historie).toHaveLength(0);
  });

  test("Sie erscheint nicht bei Amtszeit 1, nicht bei einer neu gespielten Wahl und nicht, wenn die Wahl mehr als 14 Monate zurückliegt", () => {
    const erste = createWorld(turkey2026, 3);
    startAfterElection(erste, profil);
    advance(erste, 400);
    expect(parlamentNachtragFrage(erste)).toBeUndefined();

    // Neu gespielte Wahl: Die Historie enthält das Ergebnis, es gibt nichts nachzutragen
    const neu = createWorld(turkey2026, 5);
    startAfterElection(neu, profil);
    neu.spiel!.umfrage.zustimmung = 80;
    neu.spiel!.kalibrierung += 33;
    advance(neu, neu.spiel!.wahltag - neu.day + 1);
    if (neu.spiel!.wahl?.stichwahl) advance(neu, 16);
    advance(neu, 70);
    expect(neu.spiel!.wahl!.historie.length).toBeGreaterThanOrEqual(1);
    expect(parlamentNachtragFrage(neu)).toBeUndefined();
    expect(neu.spiel!.wahl!.nachtrag).toBeUndefined();

    // Mehr als 14 Monate nach der Wahl: keine Frage mehr
    const alt = alterStand(5, 18);
    advance(alt, 1);
    expect(parlamentNachtragFrage(alt)).toBeUndefined();
    expect(alt.spiel!.wahl?.nachtrag).toBeUndefined();
  });

  test("Der Merker überlebt Speichern und Laden; ein Stand mit offener Frage fragt nach dem Laden weiter, ein beantworteter nie wieder", () => {
    const w = alterStand(6);
    advance(w, 1);
    const geladen = load(save(w));
    expect(parlamentNachtragFrage(geladen)?.status).toBe("frage");
    expect(() => advance(geladen, 5)).not.toThrow();
    parlamentNachtragAntwort(geladen, "nein");
    const nochmal = load(save(geladen));
    expect(parlamentNachtragFrage(nochmal)).toBeUndefined();
    advance(nochmal, 400);
    parlamentNachtragPruefen(nochmal);
    expect(parlamentNachtragFrage(nochmal)).toBeUndefined();
    expect(nochmal.spiel!.wahl!.nachtrag!.status).toBe("nein");
  });
});

describe("Antwort Nein", () => {
  test("Das Parlament, das Lager und die Historie bleiben, die Frage kommt nie wieder, Umbildung und Zielwahl folgen", () => {
    const w = alterStand();
    advance(w, 1);
    const vorher = JSON.stringify({ p: w.parliament, l: w.spiel!.lager });
    const r = parlamentNachtragAntwort(w, "nein");
    expect(r.ok).toBe(true);
    expect(JSON.stringify({ p: w.parliament, l: w.spiel!.lager })).toBe(vorher);
    expect(w.spiel!.wahl!.historie).toHaveLength(0);
    expect(w.spiel!.wahl!.nachtrag!.status).toBe("nein");
    expect(wahlabend(w)).toBeUndefined();
    // Das Nachholen von Umbildung und Zielwahl läuft jetzt
    expect(w.spiel!.umbildung?.anlass).toBe("nachgereicht");
    expect(w.spiel!.zielwahl?.offen).toBe(true);
    // Eine zweite Antwort ist ohne Frage wirkungslos
    expect(parlamentNachtragAntwort(w, "ja").ok).toBe(false);
    advance(w, 500);
    expect(parlamentNachtragFrage(w)).toBeUndefined();
    expect(w.spiel!.wahl!.historie).toHaveLength(0);
  });
});

describe("Antwort Ja", () => {
  test("Sitze und Lager ändern sich nachvollziehbar, das Ergebnis steht in der Historie, der Wahlabend ist nachgetragen", () => {
    const w = alterStand();
    advance(w, 1);
    const seatsVorher = sitze(w);
    const lagerVorher = [...w.spiel!.lager];
    const lagerSitzeVorher = lagerSitze(w);
    expect(summe(seatsVorher)).toBe(600);
    const r = parlamentNachtragAntwort(w, "ja");
    expect(r.ok).toBe(true);
    const sp = w.spiel!;
    const h = sp.wahl!.historie;
    expect(h).toHaveLength(1);
    const e = h[0]!;
    expect(e.nachgetragen).toBe(true);
    expect(e.gewonnen).toBe(true);
    expect(e.letzteWahl).toBe(false);
    expect(e.datum.slice(0, 7)).toBe("2033-06");
    expect(e.amtszeit).toBe(1);
    // Das Ergebnis dokumentiert Vorher und Nachher und stimmt mit dem Parlament überein
    expect(e.parlament.sitzeVorher).toEqual(seatsVorher);
    expect(e.parlament.sitzeNachher).toEqual(sitze(w));
    expect(e.parlament.lagerSitzeVorher).toBe(lagerSitzeVorher);
    expect(e.parlament.lagerSitzeNachher).toBe(lagerSitze(w));
    expect(summe(sitze(w))).toBe(600);
    // Die Sitze haben sich tatsächlich verschoben (die Wahl würfelt Stimmung und Parteien neu)
    expect(sitze(w)).not.toEqual(seatsVorher);
    expect(e.parlament.lagerVorher).toEqual(expect.arrayContaining([profil.partei.kurz]));
    // Die Verschiebung bleibt in einem glaubhaften Rahmen (höchstens zehn Prozentpunkte der Stimmen, in Sitzen deutlich weniger als die Hälfte)
    expect(Math.abs(lagerSitze(w) - lagerSitzeVorher)).toBeLessThan(150);
    // Lager: Wer keinen Sitz mehr hat, ist draußen
    for (const p of sp.lager) expect(sitze(w)[p] ?? 0).toBeGreaterThan(0)
    expect(lagerVorher.length).toBeGreaterThanOrEqual(sp.lager.length);
    // Wahlabend, Chronik, Zeitung
    expect(wahlabend(w)?.id).toBe(e.id);
    expect(sp.chronik.some((c) => c.titel === "Parlamentswahl nachgetragen")).toBe(true);
    expect(JSON.stringify(sp.zeitung ?? {})).toContain("Parlamentswahl nachgezählt");
    // Provinzergebnisse und Anteile
    expect(Object.keys(e.provinzen)).toHaveLength(81);
    expect(Object.values(e.parlament.anteile).reduce((a, b) => a + b, 0)).toBeGreaterThan(95);
    // Koalitionsrunde nur ohne Mehrheit
    const ohneMehrheit = lagerSitze(w) < 301;
    expect(sp.ereignisse.some((x) => x.vorlage === "wahl_koalitionsrunde")).toBe(ohneMehrheit);
    // Umbildung und Zielwahl kommen danach
    expect(sp.umbildung?.anlass).toBe("nachgereicht");
    expect(sp.zielwahl?.offen).toBe(true);
    // Ohne Frage und ohne zweiten Nachtrag
    expect(parlamentNachtragFrage(w)).toBeUndefined();
    expect(parlamentNachtragAntwort(w, "ja").ok).toBe(false);
    expect(sp.wahl!.nachtrag!.status).toBe("ja");
    expect(sp.wahl!.nachtrag!.ergebnis).toBe(e.id);
  });

  test("Dieselbe Welt und dieselben Handlungen liefern dasselbe Parlament (deterministisch); der Stand bleibt gültiges JSON", () => {
    const a = alterStand(8);
    const b = alterStand(8);
    advance(a, 1);
    advance(b, 1);
    parlamentNachtragAntwort(a, "ja");
    parlamentNachtragAntwort(b, "ja");
    expect(a.parliament).toEqual(b.parliament);
    expect(a.spiel!.lager).toEqual(b.spiel!.lager);
    expect(() => JSON.parse(JSON.stringify(a))).not.toThrow();
    const geladen = load(save(a));
    expect(geladen.parliament).toEqual(a.parliament);
    expect(geladen.spiel!.wahl!.historie[0]!.nachgetragen).toBe(true);
    expect(() => advance(geladen, 60)).not.toThrow();
    expect(parlamentNachtragFrage(geladen)).toBeUndefined();
  });

  test("Die Zustimmung am Wahltag bestimmt die Richtung: Mit schwacher Stimmung verliert das Lager im Schnitt mehr als mit starker", () => {
    const mittel = (zustimmung: number): number => {
      let d = 0;
      const seeds = [1, 2, 3, 4, 5, 6];
      for (const seed of seeds) {
        const w = alterStand(seed);
        const sp = w.spiel!;
        for (const v of sp.umfrage.verlauf) if (v.monat === "2033-06") v.wert = zustimmung;
        advance(w, 1);
        const vorher = lagerSitze(w);
        parlamentNachtragAntwort(w, "ja");
        d += lagerSitze(w) - vorher;
      }
      return d / seeds.length;
    };
    expect(mittel(75)).toBeGreaterThan(mittel(40));
    // Der Wahlsieg steht fest: Auch bei schwacher Stimmung rechnet die Schätzung mit mindestens dem Mindestanteil
    expect(NACHTRAG.amtMindestens).toBeGreaterThan(50);
  });
});

describe("Ansichten", () => {
  test("Das Fragefenster nennt das Datum, beide Antworten und die Sicherung", () => {
    const html = renderToStaticMarkup(<ParlamentNachtrag datum="2033-06-05" lagerSitze={365} onJa={() => {}} onNein={() => {}} />);
    expect(html).toContain("Parlamentswahl nachtragen?");
    expect(html).toContain("Die Parlamentswahl vom 5. Juni 2033 wurde mit einer älteren Spielversion gespielt, ohne neue Sitzverteilung. Nachträglich auswerten?");
    expect(html).toContain("Ja, Sitze neu verteilen");
    expect(html).toContain("Nein, Parlament bleibt");
    expect(html).toContain("Der bisherige Stand bleibt als Sicherung erhalten");
    expect(html).toContain("365 von 600 Sitzen");
    expect(renderToStaticMarkup(<ParlamentNachtrag datum="2033-06-05" lagerSitze={365} onJa={() => {}} onNein={() => {}} beschaeftigt />)).toContain("disabled");
  });

  test("Das Fragefenster gibt es auch auf Türkisch und Englisch", async () => {
    await ladeSprache("tr");
    await setzeSprache("tr");
    const tr = renderToStaticMarkup(<ParlamentNachtrag datum="2033-06-05" lagerSitze={365} onJa={() => {}} onNein={() => {}} />);
    expect(tr).toContain("Meclis seçimi sonradan yapılsın mı?");
    expect(tr).toContain("5 Haziran 2033");
    expect(tr).toContain("Evet, sandalyeleri yeniden dağıt");
    await ladeSprache("en");
    await setzeSprache("en");
    const en = renderToStaticMarkup(<ParlamentNachtrag datum="2033-06-05" lagerSitze={365} onJa={() => {}} onNein={() => {}} />);
    expect(en).toContain("Hold the parliamentary election retroactively?");
    expect(en).toContain("5 June 2033");
    expect(en).toContain("No, parliament stays");
  });

  test("Der nachgetragene Wahlabend trägt die Überschrift, zeigt Stimmenanteile und Sitze, hat keine Rede und keine Auszählungs-Wartezeit", () => {
    const w = alterStand();
    advance(w, 1);
    parlamentNachtragAntwort(w, "ja");
    const e = wahlabend(w)!;
    const html = renderToStaticMarkup(<Wahlabend ergebnis={e} onRede={() => ""} onSchliessen={() => {}} />);
    expect(html).toContain("Wahlabend nachgetragen");
    expect(html).toContain("Stimmenanteile");
    expect(html).toContain("Die Parlamentswahl vom 5. Juni 2033");
    expect(html).toContain("Lager vorn");
    expect(html).toContain("Opposition vorn");
    expect(html).toContain("Danach folgen die Umbildung und die Ziele der Amtszeit");
    expect(html).not.toContain("Ihre Rede an die Nation");
    expect(html).not.toContain("Auszählung läuft");
    // Weiter-Knopf sofort bedienbar
    expect(html).not.toMatch(/brass-button"[^>]*disabled/);
  });
});
