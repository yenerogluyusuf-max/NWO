// Die Zeitung (UI-1): Monatsausgabe, Framing je Cluster, Berichtswahrscheinlichkeit und
// Eigentümer-Empfindlichkeit, die veröffentlichte Umfrage eines Instituts, Tempo (Digital vor Print),
// Archiv-Begrenzung, Migration alter Spielstände, Determinismus und die leichte Wirkung auf die Wählergruppen.

import { describe, expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { Rng } from "../src/sim/rng";
import { medienCluster } from "../src/data/medien";
import { UMFRAGE_INSTITUTE } from "../src/data/umfrage_institute";
import {
  ARCHIV_MAX,
  artikelFuer,
  berichtP,
  berechneWirkung,
  framingStaerke,
  monatsUmfrage,
  zeitungEreignis,
  zeitungGelesen,
  type ZeitungAusgabe,
  type ZeitungVorgang,
} from "../src/sim/zeitung";
import { bewerteHalt, hinweisKlasse } from "../src/ui/autostopp";
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

/** Tage bis zum nächsten Monatsersten (dort läuft der Monatsschritt und damit die Zeitung). */
function tageZumErsten(datum: string): number {
  const [j, m, t] = datum.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(j, m, 0)).getUTCDate() - t + 1;
}

const monatliche = (w: World): ZeitungAusgabe[] => (w.spiel!.zeitung?.archiv ?? []).filter((a) => a.anlass === "monatlich");

const KRISE: ZeitungVorgang = {
  id: "v-krise",
  art: "krise",
  sparte: "welt",
  titel: "Lira-Vertrauen erschüttert",
  fakt: "Die Lira hat in zwölf Monaten 45 % verloren; der Risikoaufschlag liegt bei 620 Punkten.",
  wertung: -0.8,
  tag: 1,
  datum: "2028-06-20",
};

const KONTEXT = { name: "Test Präsident", partei: "PW" };

describe("Monatsausgabe", () => {
  test("entsteht am Monatsersten mit zwei bis drei Blättern aus verschiedenen Clustern", () => {
    const w = spiel();
    advance(w, tageZumErsten(w.date));
    const z = w.spiel!.zeitung!;
    expect(z).toBeDefined();
    const a = monatliche(w).at(-1)!;
    expect(a.monat).toBe(w.date.slice(0, 7));
    expect(a.blaetter.length).toBeGreaterThanOrEqual(2);
    expect(a.blaetter.length).toBeLessThanOrEqual(3);
    expect(new Set(a.blaetter.map((b) => b.clusterId)).size).toBe(a.blaetter.length);
    // Mindestens zwei Lesarten an Bord; jedes Blatt hat Inhalt, alle Texte regelbasiert
    expect(new Set(a.blaetter.map((b) => b.ton)).size).toBeGreaterThanOrEqual(2);
    for (const b of a.blaetter) {
      expect(b.artikel.length, b.clusterId).toBeGreaterThanOrEqual(1);
      for (const art of b.artikel) {
        expect(art.textQuelle).toBe("regel");
        expect(art.schlagzeile.length).toBeGreaterThan(3);
        expect(art.text.length).toBeGreaterThanOrEqual(1);
      }
    }
    expect(z.ungelesen).toBeGreaterThanOrEqual(1);
  });

  test("erscheint jeden Monat erneut und zählt das Badge mit, bis sie gelesen wird", () => {
    const w = spiel();
    advance(w, tageZumErsten(w.date));
    advance(w, tageZumErsten(w.date));
    expect(monatliche(w).length).toBeGreaterThanOrEqual(2);
    const z = w.spiel!.zeitung!;
    expect(z.ungelesen).toBeGreaterThanOrEqual(2);
    zeitungGelesen(w);
    expect(z.ungelesen).toBe(0);
  });

  test("ist ein Hinweis der Klasse C: kein Stopp, die Meldung wandert in den Umlauf", () => {
    expect(hinweisKlasse("zeitung-100-3")).toBe("C");
    expect(hinweisKlasse("zeitung-eil-100-3")).toBe("C");
    const w = spiel();
    w.spiel!.hinweise = [];
    advance(w, tageZumErsten(w.date));
    const hz = w.spiel!.hinweise.find((h) => h.id.startsWith("zeitung-"));
    expect(hz).toBeDefined();
    // Isoliert bewerten: offene Ereignisse (Klasse A) und andere Hinweise gehören nicht zur Frage,
    // ob ein Zeitungs-Hinweis allein je anhalten würde (vgl. autostopp.test.ts)
    w.spiel!.ereignisse = [];
    w.spiel!.hinweise = w.spiel!.hinweise.filter((h) => h.id.startsWith("zeitung-"));
    const bw = bewerteHalt(w.spiel!, new Set());
    expect(bw.halt).toBe(false);
    expect(bw.klasse).toBeNull();
    expect(bw.umlaufHinweise.map((h) => h.id)).toEqual([hz!.id]);
  });
});

describe("Framing je Cluster", () => {
  test("gleiche Fakten, andere Bewertung: der Fakt steht in jedem Blatt, der Dreh nicht", () => {
    const staat = artikelFuer(medienCluster("staatsrundfunk")!, KRISE, KONTEXT, "a1");
    const oppo = artikelFuer(medienCluster("opposition_masse")!, KRISE, KONTEXT, "a2");
    const frei = artikelFuer(medienCluster("digital_frei")!, KRISE, KONTEXT, "a3");
    // Dieselbe Realität überall …
    for (const a of [staat, oppo, frei]) {
      expect(a.text.join(" ")).toContain("620 Punkten");
      expect(a.text.join(" ")).toContain("45 %");
    }
    // … aber drei verschiedene Schlagzeilen und Lesarten
    expect(new Set([staat.schlagzeile, oppo.schlagzeile, frei.schlagzeile]).size).toBe(3);
    expect(staat.framing.art).toBe("regierungsnah");
    expect(oppo.framing.art).toBe("oppositionell");
    expect(frei.framing.art).toBe("neutral");
    // Regierungsnah schreibt die Krise klein, die Opposition dramatisiert groß
    expect(staat.kurz).toBe(true);
    expect(oppo.kurz).toBe(false);
    expect(staat.schlagzeile).toContain("Spekulation");
    expect(oppo.schlagzeile).toContain("Adresse");
  });

  test("Erfolge feiert das Regierungslager groß, die Opposition schreibt sie klein", () => {
    const fertig: ZeitungVorgang = { ...KRISE, id: "v-fertig", art: "fertigstellung", sparte: "programm", titel: "Großer Hafen", fakt: "Der Große Hafen ist fertiggestellt.", wertung: 0.7 };
    const staat = artikelFuer(medienCluster("holding_kern")!, fertig, KONTEXT, "b1");
    const oppo = artikelFuer(medienCluster("opposition_nische")!, fertig, KONTEXT, "b2");
    expect(staat.kurz).toBe(false);
    expect(oppo.kurz).toBe(true);
    expect(staat.schlagzeile).not.toBe(oppo.schlagzeile);
    expect(staat.wirkung).toBeGreaterThan(0);
    expect(oppo.wirkung).toBeGreaterThan(0); // auch zynisch bleibt es eine gute Nachricht, nur kleiner
    expect(oppo.wirkung).toBeLessThan(staat.wirkung);
  });

  test("Eigentümer-Empfindlichkeit steuert die Framing-Stärke", () => {
    const staerke = (id: string) => framingStaerke(medienCluster(id)!);
    expect(staerke("staatsrundfunk")).toBeGreaterThan(staerke("holding_kern"));
    expect(staerke("holding_kern")).toBeGreaterThan(staerke("kommerz_konform"));
    // Empfindliche Eigentümer entsorgen Unbequemes unterhalb der Falz (kurz), Freie nicht
    expect(artikelFuer(medienCluster("staatsrundfunk")!, KRISE, KONTEXT, "c1").kurz).toBe(true);
    expect(artikelFuer(medienCluster("kommerz_konform")!, KRISE, KONTEXT, "c2").kurz).toBe(false);
    // Opposition dreht aus Überzeugung maximal: 0,9 minus Empfindlichkeit (0,10) = 0,8 — mindestens so stark
    expect(artikelFuer(medienCluster("opposition_masse")!, KRISE, KONTEXT, "c3").framing.staerke).toBeGreaterThanOrEqual(0.8);
  });
});

describe("Berichtswahrscheinlichkeit", () => {
  test("folgt dem Cluster und der Richtung des Vorgangs (Recherche A.5.4)", () => {
    expect(berichtP(medienCluster("staatsrundfunk")!, { wertung: -0.5 })).toBe(0.05);
    expect(berichtP(medienCluster("opposition_masse")!, { wertung: -0.5 })).toBe(0.9);
    expect(berichtP(medienCluster("staatsrundfunk")!, { wertung: 0.5 })).toBe(0.95);
    expect(berichtP(medienCluster("opposition_nische")!, { wertung: 0.5 })).toBe(0.5);
  });

  test("über viele Ausgaben: Regierungsnahe verschweigen Krisen oft, Oppositionsnahe fast nie", () => {
    const w = spiel(7);
    for (let m = 0; m < 12; m++) {
      zeitungEreignis(w, { art: "krise", titel: `Krise ${m}`, fakt: `Krisenfakt ${m} mit harter Zahl.`, wertung: -0.8 });
      advance(w, tageZumErsten(w.date));
    }
    let regBericht = 0;
    let regGesamt = 0;
    let oppBericht = 0;
    let oppGesamt = 0;
    for (let m = 0; m < 12; m++) {
      for (const a of monatliche(w)) {
        for (const b of a.blaetter) {
          const berichtet = b.artikel.some((art) => art.text.join(" ").includes(`Krisenfakt ${m}`));
          const verschwiegen = b.verschwiegen.includes(`Krise ${m}`);
          if (!berichtet && !verschwiegen) continue; // ein anderes Blatt des Monats hatte den Vorgang nicht
          if (b.ton === "regierungsnah") {
            regGesamt++;
            if (berichtet) regBericht++;
          } else if (b.ton === "oppositionell") {
            oppGesamt++;
            if (berichtet) oppBericht++;
          }
        }
      }
    }
    expect(regGesamt).toBeGreaterThan(5);
    expect(oppGesamt).toBeGreaterThan(5);
    const regRate = regBericht / regGesamt;
    const oppRate = oppBericht / oppGesamt;
    expect(oppRate).toBeGreaterThan(regRate + 0.3);
    expect(regRate).toBeLessThan(0.5);
  });
});

describe("Umfrage des Monats", () => {
  test("Instituts-Bias: regierungsnahe Häuser messen zu hoch, oppositionelle zu niedrig", () => {
    const nachInstitut = new Map<string, number[]>();
    for (let i = 0; i < 900; i++) {
      const e = monatsUmfrage(50, 0, new Rng(10_000 + i));
      if (!e.umfrage) continue;
      const l = nachInstitut.get(e.umfrage.institutId) ?? [];
      l.push(e.umfrage.abweichung);
      nachInstitut.set(e.umfrage.institutId, l);
    }
    const schnitt = (id: string) => {
      const l = nachInstitut.get(id) ?? [];
      return l.reduce((s, x) => s + x, 0) / l.length;
    };
    for (const id of ["meridyen", "yoruk", "anker"]) expect((nachInstitut.get(id) ?? []).length, id).toBeGreaterThan(30);
    expect(schnitt("meridyen")).toBeGreaterThan(0.8); // Haus-Bias +2
    expect(schnitt("yoruk")).toBeLessThan(-3.5); // Haus-Bias −5
    expect(schnitt("anker")).toBeGreaterThan(-2.2); // Goldstandard bleibt nahe am wahren Wert
    expect(schnitt("anker")).toBeLessThan(0.5);
  });

  test("Publikationsregel: ungünstige Ergebnisse bleiben in der Schublade (Recherche B.4.2)", () => {
    // meridyen (regierungsnah): ein klares Minus für die Regierung wird oft nicht publiziert
    let schublade = 0;
    let publiziert = 0;
    for (let i = 0; i < 300; i++) {
      const rng = new Rng(20_000 + i);
      // Wahre 40: ein regierungsnahes Haus mit +2 Bias steht vor einem ungünstigen Bild
      const e = monatsUmfrage(40, 0, rng);
      if (e.schublade) schublade++;
      else publiziert++;
    }
    expect(schublade).toBeGreaterThan(0);
    expect(publiziert).toBeGreaterThan(0);
  });

  test("erscheint IN der Zeitung: Institut, Wert und Methodik stehen im Blatt", () => {
    const w = spiel(5);
    let veroeffentlicht = 0;
    let imBlatt = 0;
    for (let m = 0; m < 8; m++) {
      advance(w, tageZumErsten(w.date));
      const a = monatliche(w).at(-1)!;
      if (!a.umfrage) continue;
      veroeffentlicht++;
      expect(UMFRAGE_INSTITUTE.some((i) => i.id === a.umfrage!.institutId)).toBe(true);
      expect(a.umfrage.wert).toBeGreaterThanOrEqual(0);
      expect(a.umfrage.wert).toBeLessThanOrEqual(100);
      expect(a.umfrage.institut.length).toBeGreaterThan(3);
      // … und sie ist nicht nur Metadaten: mindestens ein Blatt bringt sie als Artikel
      if (a.blaetter.some((b) => b.artikel.some((art) => art.sparte === "umfrage" && art.text.join(" ").includes(a.umfrage!.institut)))) imBlatt++;
    }
    expect(veroeffentlicht).toBeGreaterThanOrEqual(3);
    expect(imBlatt).toBeGreaterThanOrEqual(1);
  });

  test("die interne Zustimmung bleibt die Wahrheit des Spiels; veröffentlicht wird nur gemessen", () => {
    const w = spiel(9);
    advance(w, tageZumErsten(w.date));
    const zustimmung = w.spiel!.umfrage.zustimmung;
    // Der interne Wert folgt weiter der trägen Annäherung (kein Messfehler im Spielstand)
    expect(Number.isFinite(zustimmung)).toBe(true);
    const a = monatliche(w).at(-1)!;
    if (a.umfrage) expect(a.umfrage.abweichung).not.toBeNaN();
    // Über acht Monate weicht mindestens eine veröffentlichte Messung spürbar ab (Bias + Rauschen)
    let abweichungen = 0;
    for (let m = 0; m < 8; m++) {
      advance(w, tageZumErsten(w.date));
      const x = monatliche(w).at(-1)!;
      if (x.umfrage && Math.abs(x.umfrage.abweichung) >= 0.5) abweichungen++;
    }
    expect(abweichungen).toBeGreaterThanOrEqual(2);
  });
});

describe("Tempo: Digital vor Print", () => {
  test("ein Großereignis bringt die Eilmeldung noch am selben Tag — Print erst im nächsten Monat", () => {
    const w = spiel(5);
    const datumEreignis = w.date;
    zeitungEreignis(w, { art: "krise", titel: "Lira-Vertrauen erschüttert", fakt: "Die Lira hat in zwölf Monaten 50 % verloren.", wertung: -0.8 });
    const z = w.spiel!.zeitung!;
    const eil = z.archiv.at(-1)!;
    expect(eil.anlass).toBe("eilmeldung");
    expect(eil.datum).toBe(datumEreignis);
    // Digital trägt die Meldung sofort …
    const digital = eil.blaetter.find((b) => b.digital)!;
    expect(digital.artikel.some((a) => a.text.join(" ").includes("50 %"))).toBe(true);
    // … Print schweigt in derselben Ausgabe noch (die Druckerpresse läuft erst für morgen)
    for (const b of eil.blaetter.filter((x) => !x.digital)) {
      expect(b.artikel.every((a) => !a.text.join(" ").includes("50 %"))).toBe(true);
      expect(b.verschwiegen).toContain("Lira-Vertrauen erschüttert");
    }
    // Nächster Monatserster: Die Print-Blätter greifen den Vorgang auf (oder verschweigen ihn sichtbar)
    advance(w, tageZumErsten(w.date));
    const monat = monatliche(w).at(-1)!;
    const print = monat.blaetter.filter((b) => !b.digital);
    const erwaehnt = print.some((b) => b.artikel.some((a) => a.text.join(" ").includes("50 %")));
    const geschwiegen = print.some((b) => b.verschwiegen.includes("Lira-Vertrauen erschüttert"));
    expect(erwaehnt || geschwiegen).toBe(true);
    expect(z.warteschlange.filter((v) => v.tag < w.day)).toHaveLength(0);
  });

  test("Ereignisse des Ausgabetages selbst kommen erst nächsten Monat in den Print", () => {
    const w = spiel(6);
    advance(w, tageZumErsten(w.date)); // jetzt am Monatsersten
    zeitungEreignis(w, { art: "bruch", titel: "YENİ verlässt das Lager", fakt: "Die YENİ verlässt das Regierungslager.", wertung: -0.9 });
    const z = w.spiel!.zeitung!;
    // Die heutige Monatsausgabe wurde vor diesem Vorgang gedruckt: Er wartet auf den nächsten Monat
    const heute = monatliche(w).find((a) => a.monat === w.date.slice(0, 7))!;
    expect(heute.blaetter.every((b) => b.artikel.every((a) => !a.text.join(" ").includes("verlässt das Regierungslager")))).toBe(true);
    advance(w, tageZumErsten(w.date));
    const naechster = monatliche(w).at(-1)!;
    const irgendwo = naechster.blaetter.some((b) => b.artikel.some((a) => a.text.join(" ").includes("verlässt das Regierungslager")) || b.verschwiegen.includes("YENİ verlässt das Lager"));
    expect(irgendwo).toBe(true);
    expect(z).toBeDefined();
  });
});

describe("Wirkung auf die Wählergruppen", () => {
  test("Berichte erreichen die Segmente des Clusters: junge Opposition spürt mehr als das konservative Land", () => {
    const w = spiel(5);
    const jungeVorher = nationalAverage(NET, w.net, "junge");
    const konsVorher = nationalAverage(NET, w.net, "konservative");
    // Digital berichtet sofort (Reichweite: junge 0,40 — ländlich-konservativ 0,02)
    zeitungEreignis(w, { art: "krise", titel: "Krise", fakt: "Krisenfakt.", wertung: -0.9 });
    const jungeNachher = nationalAverage(NET, w.net, "junge");
    const konsNachher = nationalAverage(NET, w.net, "konservative");
    expect(jungeNachher).toBeLessThan(jungeVorher);
    expect(konsNachher).toBeLessThan(konsVorher + 1e-9);
    expect(jungeVorher - jungeNachher).toBeGreaterThan((konsVorher - konsNachher) * 5);
    // Leicht bleibt es: Eine einzelne Meldung kippt nichts
    expect(jungeVorher - jungeNachher).toBeLessThan(1);
  });

  test("Schweigen dämpft: Ohne Artikel keine Wirkung; freundliche Berichte stützen das eigene Lager", () => {
    // Reine Rechnung ohne Welt: nur berichtete Vorgänge erzeugen Deltas
    const ausgabe: ZeitungAusgabe = {
      nummer: 1,
      datum: "2028-07-01",
      monat: "2028-07",
      anlass: "monatlich",
      blaetter: [
        {
          clusterId: "holding_kern",
          name: "Neue Warte",
          unterzeile: "",
          digital: false,
          ton: "regierungsnah",
          artikel: [artikelFuer(medienCluster("holding_kern")!, { ...KRISE, art: "fertigstellung", wertung: 0.7, fakt: "Fertig." }, KONTEXT, "x1")],
          verschwiegen: ["Lira-Vertrauen erschüttert"],
        },
      ],
    };
    const delta = berechneWirkung(ausgabe);
    // Erfolg groß im regierungsnahen Blatt → die konservativen Segmente steigen
    expect(delta.get("konservative") ?? 0).toBeGreaterThan(0);
    expect(delta.get("landwirte") ?? 0).toBeGreaterThan(0);
    // Kein negatives Delta nirgends — der verschwiegene Vorgang wirkt nicht
    for (const d of delta.values()) expect(d).toBeGreaterThanOrEqual(0);
  });
});

describe("Archiv, Migration, Determinismus", () => {
  test("das Archiv begrenzt sich auf die letzten zwölf Ausgaben", () => {
    const w = spiel(8);
    for (let m = 0; m < 15; m++) {
      if (m % 3 === 0) zeitungEreignis(w, { art: "krise", titel: `Krisenmonat ${m}`, fakt: `Fakt ${m}.`, wertung: -0.7 });
      advance(w, tageZumErsten(w.date));
    }
    const z = w.spiel!.zeitung!;
    expect(z.archiv.length).toBeLessThanOrEqual(ARCHIV_MAX);
    expect(z.archiv.length).toBeGreaterThan(5);
    // Neueste steht hinten; die Nummern lückenlos aufsteigend
    for (let i = 1; i < z.archiv.length; i++) expect(z.archiv[i]!.nummer).toBeGreaterThan(z.archiv[i - 1]!.nummer);
  });

  test("alte Spielstände ohne Zeitung bekommen ab dem nächsten Monat Ausgaben", () => {
    const w = spiel(10);
    advance(w, 100);
    const json = save(w);
    const alt = JSON.parse(json) as World;
    delete alt.spiel!.zeitung; // so sieht ein Stand aus, der vor der Zeitung gespeichert wurde
    const geladen = load(JSON.stringify(alt));
    expect(geladen.spiel!.zeitung).toBeUndefined();
    advance(geladen, tageZumErsten(geladen.date));
    expect(geladen.spiel!.zeitung).toBeDefined();
    expect(geladen.spiel!.zeitung!.archiv.length).toBeGreaterThanOrEqual(1);
  });

  test("gleicher Seed ergibt dieselbe Zeitung — auch über Speichern und Laden hinweg", () => {
    const a = spiel(11);
    const b = spiel(11);
    for (const w of [a, b]) advance(w, 200);
    expect(JSON.stringify(a.spiel!.zeitung)).toBe(JSON.stringify(b.spiel!.zeitung));
    const kopie = load(save(a));
    advance(a, 70);
    advance(kopie, 70);
    expect(JSON.stringify(a.spiel!.zeitung)).toBe(JSON.stringify(kopie.spiel!.zeitung));
  });
});

describe("Inhaltliche Leitplanken", () => {
  test("keine echten Medien- oder Institutsnamen im Spiel-Content", () => {
    const echte = ["Sabah", "Hürriyet", "Sözcü", "Cumhuriyet", "TRT", "TELE1", "Medyascope", "Posta", "Milliyet", "Diken", "T24", "KONDA", "MetroPOLL", "Optimar", "GENAR", "SONAR", "Gezici", "Avrasya", "Areda", "BirGün", "Evrensel"];
    const w = spiel(12);
    for (let m = 0; m < 4; m++) {
      zeitungEreignis(w, { art: "krise", titel: `Lage ${m}`, fakt: `Fakt ${m}.`, wertung: -0.7 });
      advance(w, tageZumErsten(w.date));
    }
    const gesamt = JSON.stringify(w.spiel!.zeitung);
    for (const name of echte) expect(gesamt.includes(name), name).toBe(false);
    for (const a of w.spiel!.zeitung!.archiv) {
      for (const b of a.blaetter) {
        for (const name of echte) {
          expect(b.name.includes(name), `${b.name} ~ ${name}`).toBe(false);
        }
      }
    }
  });
});

describe("Oberfläche", () => {
  test("die Frontseite lässt sich zeichnen: Masthead, Blätter-Reiter, Archiv und Regulierungs-Referenz", () => {
    const w = spiel(5);
    advance(w, tageZumErsten(w.date));
    const html = renderToStaticMarkup(createElement(Zeitung, { world: w }));
    expect(html).toContain("Ausgabe Nr.");
    expect(html).toContain("Archiv");
    expect(html).toContain("Was Eingriffe kosten würden");
    expect(html).toContain("Rang 159");
    expect(html).toContain("tablist");
    // Keine echte Blattzeile im UI-Text
    expect(html).not.toContain("Hürriyet");
  });

  test("ohne Ausgabe steht ein ehrlicher Hinweis statt einer leeren Seite", () => {
    const w = spiel(5);
    const html = renderToStaticMarkup(createElement(Zeitung, { world: w }));
    expect(html).toContain("erste Ausgabe");
  });
});
