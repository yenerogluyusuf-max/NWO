// Ansichten der Enden: Vermächtnis (alle Kapitel, drei Sprachen), Bilanzfenster mit Wechsel zum Vermächtnis, Wahlkampf-Zentrale im Nachfolger-Wahlkampf.

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { beende } from "../src/sim/spiel";
import { vermaechtnis } from "../src/sim/vermaechtnis";
import { umbildungAbschliessen, waehleZieleAmtszeit, kuereNachfolger } from "../src/sim/amtszeit";
import { wahlkampfTag } from "../src/sim/wahlkampf";
import { ladeSprache, setzeSprache } from "../src/i18n";
import { Kurve, Vermaechtnis } from "../src/ui/wahl/Vermaechtnis";
import { BilanzFenster } from "../src/ui/BilanzFenster";
import { WahlkampfZentrale } from "../src/ui/Wahlkampf";
import type { World } from "../src/sim/types";

const profil: PlayerProfile = {
  name: "Deniz Aydın",
  heimat: "Ankara",
  heimatPlaka: 6,
  jugend: "",
  beruf: "",
  partner: "Bauunternehmer",
  motiv: "",
  partei: { name: "Partei der Werte", kurz: "PW", farbe: "#2e6b3f" },
  naehe: {},
  buendnis: "YENİ",
  versprechen: [],
  wahl: { runde: 2, anteil: 51 },
};

function beendet(art: Parameters<typeof beende>[1]): World {
  const w = createWorld(turkey2026, 5);
  startAfterElection(w, profil);
  w.spiel!.ereignisse = [];
  advance(w, 400);
  beende(w, art, "Titel", "Text");
  return w;
}

afterEach(async () => {
  await setzeSprache("de");
});

describe("Vermächtnis", () => {
  test("Alle Kapitel erscheinen, mit Epilog und Kurve", () => {
    const html = renderToStaticMarkup(<Vermaechtnis daten={vermaechtnis(beendet("abwahl"))} />);
    for (const kap of ["Die Zustimmung", "Die Amtszeiten", "Die Wahlen", "Zusagen", "Kriege", "Verfassung", "Das Reich", "Das Kabinett", "Katastrophen", "Die Zahlen", "Wendepunkte", "Und danach?"]) {
      expect(html, kap).toContain(kap);
    }
    expect(html).toContain("Ende: Abwahl");
    expect(html).toContain("<svg");
    expect(html).toContain("Die Opposition übernimmt das Amt");
  });

  test("Jede Endart hat ihren Epilog", () => {
    const erwartet: Record<string, string> = {
      sturz: "Die Straße hat entschieden",
      ruecktritt: "Der Rücktritt öffnet den Weg",
      putsch: "Das Militär hat die Verfassung beiseitegeschoben",
      amtsenthebung: "Das Amt endet durch ein Urteil",
      tod: "Das Land trauert",
      amtszeitende: "Die Verfassung erlaubt keine weitere Amtszeit",
    };
    for (const [art, text] of Object.entries(erwartet)) {
      const html = renderToStaticMarkup(<Vermaechtnis daten={vermaechtnis(beendet(art as never))} />);
      expect(html, art).toContain(text);
    }
  });

  test("Der Nachfolge-Ausgang bestimmt den Epilog der letzten Amtszeit", () => {
    const w = beendet("amtszeitende");
    w.spiel!.ende!.nachfolge = "sieg";
    expect(renderToStaticMarkup(<Vermaechtnis daten={vermaechtnis(w)} />)).toContain("Die Macht wird geordnet übergeben");
    w.spiel!.ende!.nachfolge = "niederlage";
    expect(renderToStaticMarkup(<Vermaechtnis daten={vermaechtnis(w)} />)).toContain("das Lager hat die Nachfolge verloren");
  });

  test("Auch in Türkisch und Englisch, mit türkischer Endung am Namen", async () => {
    await ladeSprache("tr");
    await setzeSprache("tr");
    const tr = renderToStaticMarkup(<Vermaechtnis daten={vermaechtnis(beendet("putsch"))} />);
    expect(tr).toContain("Siyasi miras");
    expect(tr).toContain("Deniz Aydın’ın siyasi kariyerine bakış");
    expect(tr).toContain("Son: Darbe");
    await ladeSprache("en");
    await setzeSprache("en");
    const en = renderToStaticMarkup(<Vermaechtnis daten={vermaechtnis(beendet("putsch"))} />);
    expect(en).toContain("Legacy");
    expect(en).toContain("End: coup");
    expect(en).toContain("And afterwards?");
  });

  test("Die Kurve setzt Marken für Wahlen und Grenzlinien", () => {
    const kurve = Array.from({ length: 24 }, (_, i) => ({ monat: `${2028 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`, wert: 40 + i }));
    const html = renderToStaticMarkup(<Kurve kurve={kurve} wahlen={[{ datum: "2029-06-05", anteil: 52, stichwahl: false, gewonnen: true, marge: 3, lagerSitze: 330, lagerSitzeVorher: 320, letzte: false }]} />);
    expect(html).toContain("vm-wahl gewonnen");
    expect(html).toContain("vm-grenze sieg");
    expect(html).toContain("vm-grenze sturz");
    expect(renderToStaticMarkup(<Kurve kurve={[]} wahlen={[]} />)).toBe("");
  });
});

describe("Bilanzfenster", () => {
  test("Zeigt Bilanz mit Ursache, Schaltfläche zum Vermächtnis und den Hinweis auf den erhaltenen Stand", () => {
    const w = beendet("putsch");
    const html = renderToStaticMarkup(<BilanzFenster world={w} onNeu={() => {}} onSchliessen={() => {}} />);
    expect(html).toContain("Warum es endete");
    expect(html).toContain("Vermächtnis ansehen");
    expect(html).toContain("Neue Partie");
    expect(html).toContain("Weitester Stand");
    expect(html).toContain("Karte ansehen");
  });
});

describe("Wahlkampf-Zentrale im Nachfolger-Wahlkampf", () => {
  test("Banner, Auftritte und Duell des Nachfolgers erscheinen", () => {
    const w = createWorld(turkey2026, 5);
    startAfterElection(w, profil);
    w.spiel!.umfrage.zustimmung = 80;
    w.spiel!.kalibrierung += 33;
    advance(w, w.spiel!.wahltag - w.day + 1);
    if (w.spiel!.wahl?.stichwahl) advance(w, 16);
    w.spiel!.ereignisse = [];
    umbildungAbschliessen(w);
    waehleZieleAmtszeit(w, []);
    kuereNachfolger(w, "offen");
    delete w.spiel!.wahlkampf;
    w.spiel!.wahltag = w.day + 40;
    wahlkampfTag(w);
    const n = w.spiel!.nachfolge!.nachfolger!;
    const html = renderToStaticMarkup(<WahlkampfZentrale world={w} refresh={() => {}} />);
    expect(html).toContain(`Wahlkampf für ${n.name}`);
    expect(html).toContain("Auftritte für den Nachfolger");
    expect(html).toContain("Gemeinsamer Auftritt");
    expect(html).toContain("Nachfolger allein");
    expect(html).toContain("TV-Duell des Nachfolgers");
  });
});
