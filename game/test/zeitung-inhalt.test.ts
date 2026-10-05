// Die Zeitung nach dem Umbau: Rubriken aus dem Weltzustand, Texte mit eigenem Inhalt je Lesart, Einordnung der
// Eilmeldung, Knöpfe zur passenden Akte und Aufwärtskompatibilität alter Ausgaben.

import { describe, expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { medienCluster } from "../src/data/medien";
import { artikelFuer, berichtZuVorgang, zeitungEreignis, zeitungMonat, type TextKontext, type ZeitungAusgabe, type ZeitungVorgang } from "../src/sim/zeitung";
import { Zeitung } from "../src/ui/Zeitung";
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
  versprechen: ["Rentenerhöhung in den ersten hundert Tagen versprochen."],
  wahl: { runde: 2, anteil: 51 },
};

function spiel(seed = 5): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, profil);
  w.spiel!.ereignisse = [];
  return w;
}

function tageZumErsten(datum: string): number {
  const [j, m, t] = datum.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(j, m, 0)).getUTCDate() - t + 1;
}

const monatliche = (w: World): ZeitungAusgabe[] => (w.spiel!.zeitung?.archiv ?? []).filter((a) => a.anlass === "monatlich");
const alleTexte = (a: ZeitungAusgabe): string[] => a.blaetter.flatMap((b) => [...b.artikel.flatMap((x) => [x.schlagzeile, ...x.text]), ...(b.kommentar ? [b.kommentar.titel, ...b.kommentar.text] : [])]);
const de = (x: number) => x.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

describe("Rubriken aus dem Weltzustand", () => {
  test("die Monatsausgabe trägt Zahlen, Lage, Parlament und Ausland — jede Zahl stammt aus dem Zustand", () => {
    const w = spiel();
    for (let m = 0; m < 3; m++) advance(w, tageZumErsten(w.date));
    const a = monatliche(w).at(-1)!;
    expect(a.zahlen?.length).toBeGreaterThanOrEqual(5);
    const ids = a.zahlen!.map((k) => k.id);
    for (const id of ["inflation", "arbeit", "wachstum", "zins", "lira"]) expect(ids).toContain(id);
    // Die Kennzahlen sind die veröffentlichten bzw. öffentlichen Werte des Zustands, nie die verdeckten
    const inflation = a.zahlen!.find((k) => k.id === "inflation")!;
    expect(inflation.wert).toBe(w.published.inflation.value);
    expect(a.zahlen!.find((k) => k.id === "lira")!.wert).toBe(w.economy.usdTry);
    // Der Verlauf reicht nie über den veröffentlichten Stand hinaus (kein Blick in unveröffentlichte Monate)
    for (const k of a.zahlen!) if (k.verlauf) expect(k.verlauf.length).toBeLessThanOrEqual(12);
    // Lage: nach betroffenem Bevölkerungsanteil geordnet, mit Provinzzahl und Name der am stärksten betroffenen Provinz
    expect(a.lage!.length).toBeGreaterThan(0);
    for (let i = 1; i < a.lage!.length; i++) expect(a.lage![i - 1]!.anteil).toBeGreaterThanOrEqual(a.lage![i]!.anteil);
    for (const p of a.lage!) {
      expect(p.provinzen).toBeGreaterThan(0);
      expect(p.schlimmste.length).toBeGreaterThan(2);
    }
    expect(a.parlament!.noetig).toBe(301);
    expect(a.parlament!.lager).toBeGreaterThan(0);
    // Der Überblicksartikel nennt jede Kennzahl in der Schreibweise des Zustands
    const ueb = a.blaetter.flatMap((b) => b.artikel).filter((x) => x.art === "ueberblick");
    expect(ueb.length).toBeGreaterThanOrEqual(2);
    for (const art of ueb) {
      const t = art.text.join(" ");
      expect(t).toContain(de(w.published.inflation.value));
      expect(t).toContain(de(w.published.unemployment.value));
      expect(t).toContain(de(w.economy.usdTry));
    }
  });

  test("jedes Blatt bringt die Wirtschaft im Überblick, aber in eigener Reihenfolge", () => {
    const w = spiel();
    for (let m = 0; m < 2; m++) advance(w, tageZumErsten(w.date));
    const a = monatliche(w).at(-1)!;
    const erste = a.blaetter.map((b) => b.artikel.find((x) => x.art === "ueberblick")!.text[0]!);
    for (const t of erste) expect(t.startsWith("Die Lage in Zahlen:")).toBe(true);
    // Mindestens zwei Lesarten ordnen die Zahlen verschieden (Regierungsnahe vom Besten, Oppositionelle vom Schlechtesten)
    expect(new Set(erste).size).toBeGreaterThanOrEqual(2);
  });

  test("Rubriken ohne Stoff entfallen: keine Lage-, keine Ausland-Zeile, kein Artikel dazu", () => {
    const w = spiel(9);
    // Keine akuten Probleme, keine Spannungen, keine Vermittlung, kein Krieg
    w.net.values.fill(0);
    for (const l of Object.values(w.spiel!.welt ?? {})) l.konflikt = 5;
    w.spiel!.vermittlung = {};
    w.spiel!.kriege = [];
    zeitungMonat(w);
    const a = monatliche(w).at(-1)!;
    expect(a.lage ?? []).toHaveLength(0);
    expect(a.ausland).toBeUndefined();
    for (const b of a.blaetter) {
      expect(b.artikel.some((x) => x.art === "lage")).toBe(false);
      expect(b.artikel.some((x) => x.art === "ausland")).toBe(false);
      expect(b.artikel.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("Texte mit Inhalt", () => {
  test("keine Platzhaltersätze ohne Inhalt in zwei Jahren Ausgaben", () => {
    const verboten = [
      "Methodik und Einordnung",
      "Was gesichert ist, was unklar bleibt",
      "Der Stand der Umsetzung, nüchtern betrachtet",
      "Die Entwicklung im Kontext der letzten Monate",
      "Das Wichtigste zum Beschluss im Überblick",
      "Auslöser, Zahlen und die offenen Fragen",
      "Ein ruhiger Monat im Land",
      "Was geschah und was folgt — der Überblick",
    ];
    const w = spiel(3);
    zeitungEreignis(w, { art: "krise", titel: "Kriegsgefahr", fakt: "Der Konflikt mit Israel steht bei 76 von 100.", wertung: -0.9, krieg: true });
    for (let m = 0; m < 24; m++) advance(w, tageZumErsten(w.date));
    for (const a of w.spiel!.zeitung!.archiv) for (const t of alleTexte(a)) for (const v of verboten) expect(t.includes(v), `${a.nummer}: ${v}`).toBe(false);
  });

  test("keine Zahl „−0,0“ im Text und kein Doppelpunkt-Salat bei Wirkungsberichten", () => {
    const v = berichtZuVorgang(
      {
        tag: 10,
        datum: "2029-09-20",
        massnahme: "m_staudaemme",
        titel: "Staudämme und Speicher: Stufe 30 auf 50, 6 Monate danach",
        monate: 6,
        urteil: "schwach",
        zeilen: ["Wasserversorgung: 49,4 auf 49,4 (−0,0)", "Erneuerbare Energie: 45,0 auf 45,0 (+0,0)", "Polarisierung: 71,2 auf 69,0 (−2,2)", "Dürre: akut in 12 auf 11 Provinzen"],
        hinweis: "Die volle Wirkung braucht noch etwa 18 Monate. Bisher ist kaum etwas zu sehen.",
      },
      0,
    );
    expect(v.daten?.typ).toBe("bericht");
    if (v.daten?.typ === "bericht") {
      expect(v.daten.veraenderungen[0]).toMatchObject({ name: "Polarisierung", von: 71.2, auf: 69 }); // deutlichste Veränderung zuerst
      expect(v.daten.akut[0]).toMatchObject({ name: "Dürre", von: 12, auf: 11 });
      expect(v.daten.rest).toBe(18);
    }
    const k: TextKontext = { name: "T", partei: "PW", opposition: { name: "Onur Duran", rolle: "Oppositionsführer" } };
    for (const id of ["holding_kern", "opposition_masse", "digital_frei"]) {
      const a = artikelFuer(medienCluster(id)!, v, k, "t");
      const t = [a.schlagzeile, ...a.text].join(" ");
      expect(t).not.toContain("−0,0");
      expect(t).not.toContain("+0,0");
    }
    const neutral = artikelFuer(medienCluster("digital_frei")!, v, k, "t").text.join(" ");
    expect(neutral).toContain("unverändert bei 49,4");
    expect(neutral).toContain("18 Monate");
  });

  test("dieselbe Meldung wird in den Lesarten verschieden gewichtet und zugeschrieben, nicht nur kommentiert", () => {
    const v: ZeitungVorgang = {
      id: "g",
      art: "gesetz",
      sparte: "politik",
      titel: "Mietpreisbremse",
      fakt: "Das Parlament nimmt „Mietpreisbremse“ mit Mehrheit an.",
      wertung: 0.3,
      tag: 1,
      datum: "2028-07-01",
      daten: { typ: "gesetz", name: "Mietpreisbremse", ja: true },
    };
    const k: TextKontext = { name: "T", partei: "PW", inneres: { name: "Damla Sarı", rolle: "Innenministerin" }, opposition: { name: "Onur Duran", rolle: "Oppositionsführer" }, mehrheit: { lager: 334, duldung: 0, noetig: 301 } };
    const regierung = artikelFuer(medienCluster("holding_kern")!, v, k, "1").text.join(" ");
    const opposition = artikelFuer(medienCluster("opposition_masse")!, v, k, "2").text.join(" ");
    const neutral = artikelFuer(medienCluster("digital_frei")!, v, k, "3").text.join(" ");
    expect(regierung).toContain("Innenministerin Damla Sarı");
    expect(opposition).toContain("Oppositionsführer Onur Duran");
    expect(neutral).toContain("334 von 600 Sitzen"); // die unabhängige Lesart nennt die Mehrheitslage
    expect(neutral).not.toContain("Innenministerin");
    expect(regierung).not.toContain("Oppositionsführer");
  });

  test("Zitate folgen der deutschen Zeichensetzung („Satz“, sagt …)", () => {
    const w = spiel(4);
    for (let m = 0; m < 6; m++) advance(w, tageZumErsten(w.date));
    const texte = w.spiel!.zeitung!.archiv.flatMap(alleTexte);
    const mitZitat = texte.filter((t) => t.includes("“, sagt "));
    expect(mitZitat.length).toBeGreaterThan(0);
    for (const t of texte) expect(t).not.toMatch(/\.“, sagt /);
  });

  test("ein Kommentar nennt nur Themen, die das Blatt selbst gedruckt hat", () => {
    const w = spiel(7);
    for (let m = 0; m < 10; m++) {
      if (m % 2 === 0) zeitungEreignis(w, { art: "krise", titel: `Lage ${m}`, fakt: `Fakt ${m}.`, wertung: -0.8 });
      advance(w, tageZumErsten(w.date));
    }
    for (const a of monatliche(w)) {
      for (const b of a.blaetter) {
        const k = b.kommentar?.text.join(" ") ?? "";
        for (const still of b.verschwiegen) expect(k.includes(`„${still}“`), `${b.name}: ${still}`).toBe(false);
      }
    }
  });
});

describe("Eilmeldung mit Einordnung", () => {
  test("Kriegsgefahr: Was feststeht und was offen ist stammen aus dem Zustand; der Knopf führt zur Länderakte", () => {
    const w = spiel(6);
    zeitungEreignis(w, { art: "krise", titel: "Kriegsgefahr", fakt: "Der Konflikt mit Israel steht bei 76 von 100.", wertung: -0.9, krieg: true });
    const eil = w.spiel!.zeitung!.archiv.at(-1)!;
    const digital = eil.blaetter.find((b) => b.digital)!.artikel[0]!;
    expect(digital.einordnung).toBeDefined();
    expect(digital.einordnung!.feststeht.length + digital.einordnung!.offen.length).toBeGreaterThan(0);
    expect(digital.handlung?.ziel).toEqual({ art: "land", id: "ISR" });
    // Die Einordnung steht im eigenen Kasten, der Text wiederholt sie nicht
    expect(digital.text.join(" ")).not.toContain("Gesichert:");
    // Die Eil-Ausgabe trägt ebenfalls die Rubriken
    expect(eil.zahlen?.length).toBeGreaterThan(0);
    // Die Print-Blätter verweisen auf das Netzportal statt auf einen Platzhalter
    const print = eil.blaetter.find((b) => !b.digital)!;
    expect(print.artikel[0]!.text.join(" ")).toContain("Das Netzportal");
    // Im nächsten Monat greift der Print die Einordnung als Text auf (Gesichert/Offen)
    advance(w, tageZumErsten(w.date));
    const neutral = monatliche(w).at(-1)!.blaetter.find((b) => b.ton === "neutral");
    if (neutral) expect(neutral.artikel.some((x) => x.text.join(" ").includes("Gesichert:")) || neutral.verschwiegen.includes("Kriegsgefahr")).toBe(true);
  });

  test("Bruch im Lager: die Mehrheitslage steht in der Einordnung, der Knopf führt ins Parlament", () => {
    const w = spiel(2);
    zeitungEreignis(w, { art: "bruch", titel: "YENİ verlässt das Lager", fakt: "Die YENİ verlässt das Regierungslager.", wertung: -0.9 });
    const digital = w.spiel!.zeitung!.archiv.at(-1)!.blaetter.find((b) => b.digital)!.artikel[0]!;
    expect(digital.einordnung!.feststeht.join(" ")).toMatch(/von 600 Sitzen/);
    expect(digital.handlung?.ziel).toEqual({ art: "akte", akte: "parlament" });
  });
});

describe("Oberfläche nach dem Umbau", () => {
  test("Kästen und Kommentar erscheinen; Knöpfe nur, wenn die Bühne onGehe liefert", () => {
    const w = spiel(5);
    for (let m = 0; m < 3; m++) advance(w, tageZumErsten(w.date));
    const ohne = renderToStaticMarkup(createElement(Zeitung, { world: w }));
    expect(ohne).toContain("Zahlen des Monats");
    expect(ohne).toContain("Lage im Land");
    expect(ohne).toContain("Parlament");
    expect(ohne).toContain("Kommentar");
    expect(ohne).not.toContain("zt-gehe");
    const mit = renderToStaticMarkup(createElement(Zeitung, { world: w, onGehe: () => {} }));
    expect(mit).toContain("zt-gehe");
    expect(mit).toContain("Zum Parlament →");
  });

  test("alte Ausgaben ohne neue Felder lassen sich weiter zeichnen", () => {
    const w = spiel(5);
    for (let m = 0; m < 3; m++) advance(w, tageZumErsten(w.date));
    for (const a of w.spiel!.zeitung!.archiv) {
      delete a.zahlen;
      delete a.lage;
      delete a.parlament;
      delete a.ausland;
      for (const b of a.blaetter) {
        delete b.kommentar;
        for (const x of b.artikel) {
          delete x.handlung;
          delete x.einordnung;
        }
      }
    }
    const html = renderToStaticMarkup(createElement(Zeitung, { world: w, onGehe: () => {} }));
    expect(html).toContain("Ausgabe Nr.");
    expect(html).not.toContain("Zahlen des Monats");
  });

  test("das Archiv unterscheidet die Ausgaben: nicht fünfmal dieselbe Zeile", () => {
    const w = spiel(8);
    for (let m = 0; m < 12; m++) advance(w, tageZumErsten(w.date));
    const leads = w.spiel!.zeitung!.archiv.map((a) => (a.blaetter.find((b) => b.ton === "neutral" && b.artikel.length) ?? a.blaetter[0]!).artikel[0]!.schlagzeile);
    const haeufigste = Math.max(...[...new Set(leads)].map((l) => leads.filter((x) => x === l).length));
    expect(haeufigste).toBeLessThanOrEqual(3);
  });
});
