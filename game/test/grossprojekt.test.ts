// Freie Großprojekte (INF-4): der Interpreter zerlegt freie Eingaben in Typ, Ort, Maßstab und Strecke;
// die Schätzung liefert Bänder statt Festpreise; die Verwirklichung beim Bau ist deterministisch;
// Grenzübertritte werden zur Verhandlungsserie, und ein Veto macht die Strecke tot oder den Umweg teurer.

import { describe, expect, test } from "vitest";
import { createWorld, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { befehl } from "../src/sim/befehle";
import { laufBau, reichMonat, reichZustand, vorhabenDef, vorhabenListe } from "../src/sim/reich";
import { Rng } from "../src/sim/rng";
import { weltZustand } from "../src/sim/laender";
import { leseAntwort, vorschau, fuehreAus } from "../src/ki/aktionen";
import {
  beginneFrei,
  entwirf,
  freieEntwuerfe,
  friedensAntwort,
  interpretiere,
  schaetze,
  transitGegenAnnehmen,
  transitPaket,
  transitUmweg,
  transitVerhandeln,
  UMWEG_FAKTOR,
  type ProjektDeutung,
} from "../src/sim/grossprojekt";
import type { ProjektTyp } from "../src/sim/reich-typen";

function welt(seed = 4) {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 150;
  return w;
}

const alsProjekt = (text: string): ProjektDeutung => {
  const d = interpretiere(text);
  if (d.art !== "projekt") throw new Error(`„${text}“ wurde nicht als Projekt verstanden: ${JSON.stringify(d)}`);
  return d;
};

describe("Interpreter: Typ, Ort, Maßstab, Strecke", () => {
  test.each<[string, ProjektTyp]>([
    ["Baue den größten Hafen der Welt bei Mersin", "hafen"],
    ["Autobahn bis China", "strasse"],
    ["Hochgeschwindigkeitsbahn von Ankara nach İzmir", "schiene"],
    ["Neue Hauptstadt in Zentralanatolien", "stadt"],
    ["Baue ein neues Atomkraftwerk in Sinop", "energie"],
    ["Baue einen Kanal durch Istanbul", "kanal"],
    ["Baue ein riesiges Denkmal in Ankara", "prestige"],
    ["Große Bewässerung im Südosten", "wasser"],
    ["Baue die Bagdadbahn", "schiene"],
  ])("Typ wird erkannt: %s", (text, typ) => {
    expect(alsProjekt(text).typ).toBe(typ);
  });

  test("Orte aus Provinznamen und Regionen", () => {
    expect(alsProjekt("Baue den größten Hafen der Welt bei Mersin").provinzen).toEqual([33]);
    expect(alsProjekt("Hochgeschwindigkeitsbahn von Ankara nach İzmir").provinzen).toEqual([6, 35]);
    expect(alsProjekt("Neue Hauptstadt in Zentralanatolien").provinzen.length).toBeGreaterThan(5);
  });

  test("Maßstäbe: weltgrößte, kontinental, regional, national", () => {
    expect(alsProjekt("Baue den größten Hafen der Welt bei Mersin").massstab).toBe("weltgroesste");
    expect(alsProjekt("Autobahn bis China").massstab).toBe("kontinental");
    expect(alsProjekt("Baue einen neuen Hafen in Mersin").massstab).toBe("regional");
    expect(alsProjekt("Baue ein landesweites Solarpark-Programm").massstab).toBe("national");
  });

  test("„bis China“ wird zur Länderkette mit vermuteten Zwischenländern", () => {
    const d = alsProjekt("Autobahn bis China");
    expect(d.transit).toContain("CHN");
    expect(d.transit.indexOf("CHN")).toBe(d.transit.length - 1);
    expect(d.transitVermutet.length).toBeGreaterThan(0);
    for (const x of d.transitVermutet) expect(d.transit).toContain(x);
  });

  test("Bagdadbahn führt über Syrien und den Irak", () => {
    const d = alsProjekt("Baue die Bagdadbahn");
    expect(d.transit).toEqual(["SYR", "IRQ"]);
  });

  test("Unsinn bekommt eine ehrliche Absage mit Alternativweg", () => {
    const d = interpretiere("Baue einen Palast auf dem Mond");
    expect(d.art).toBe("absage");
    if (d.art !== "absage") return;
    expect(d.grund).toContain("Palast auf dem Mond");
    expect(d.alternativ.length).toBeGreaterThan(20);
  });

  test("„Frieden zwischen Ukraine und Russland“ wird zur Vermittlung geroutet, nicht zum Projekt", () => {
    const d = interpretiere("Frieden zwischen Ukraine und Russland");
    expect(d.art).toBe("frieden");
    if (d.art !== "frieden") return;
    expect(d.vermittlungId).toBe("ukr_rus");
    const w = welt();
    const a = friedensAntwort(w, d);
    expect(a.text).toContain("vermittelt");
    expect(a.text).toContain("Zwischen Dritten");
  });

  test("Mehrdeutigkeit führt zur Rückfrage, nie zur Ausführung", () => {
    const ohne = interpretiere("Baue etwas von Ankara nach Konya");
    expect(ohne.art).toBe("rueckfrage");
    if (ohne.art === "rueckfrage") expect(ohne.frage).toContain("Schiene oder Straße");
    const zwei = interpretiere("Baue eine Bahn und eine Autobahn nach Adana");
    expect(zwei.art).toBe("rueckfrage");
    if (zwei.art === "rueckfrage") expect(zwei.frage).toMatch(/Schiene|Straße/);
  });

  test("Hafen ohne Küste wird hinterfragt statt erfunden", () => {
    const d = interpretiere("Baue einen neuen Hafen in Ankara");
    expect(d.art).toBe("rueckfrage");
  });
});

describe("Schätzung: Bänder je Typ (3-Ebenen-Modell)", () => {
  test("Kosten-, Zeit- und Wirkungsbänder sind geordnet (tief < mitte < hoch)", () => {
    const w = welt();
    for (const text of ["Baue eine Eisenbahn von Ankara nach Konya", "Baue einen neuen Hafen in Mersin", "Baue den größten Flughafen der Welt in Istanbul"]) {
      const s = schaetze(w, alsProjekt(text), text);
      for (const b of [s.pk, s.bau, s.monate, s.schulden]) {
        expect(b.tief).toBeLessThan(b.mitte);
        expect(b.mitte).toBeLessThan(b.hoch);
      }
      expect(s.wirkungen.length).toBeGreaterThan(0);
      expect(s.mentor.length).toBeGreaterThan(40);
    }
  });

  test("Kostenüberschreitungs-Erwartung je Typ: Schiene ~45 %, Straße ~20 %, Prestige bis ~70 %", () => {
    const w = welt();
    const schiene = schaetze(w, alsProjekt("Baue eine Eisenbahn von Ankara nach Konya"), "x");
    expect(schiene.ueberzugBand[0]).toBeLessThanOrEqual(0.45);
    expect(schiene.ueberzugBand[1]).toBeGreaterThanOrEqual(0.45);
    const strasse = schaetze(w, alsProjekt("Baue eine neue Autobahn in Hatay"), "x");
    expect(strasse.ueberzugBand[0]).toBeLessThanOrEqual(0.2);
    expect(strasse.ueberzugBand[1]).toBeGreaterThanOrEqual(0.2);
    expect(strasse.ueberzugBand[1]).toBeLessThan(schiene.ueberzugBand[1]);
    const prestige = schaetze(w, alsProjekt("Baue das größte Denkmal der Welt in Ankara"), "x");
    expect(prestige.ueberzugBand[1]).toBeGreaterThanOrEqual(0.7);
  });

  test("Verkehrsillusion steht bei verkehrsabhängigen Typen im Blatt (25–60 %)", () => {
    const w = welt();
    for (const text of ["Baue eine Eisenbahn von Ankara nach Konya", "Baue einen neuen Hafen in Mersin"]) {
      const s = schaetze(w, alsProjekt(text), text);
      const illusion = s.risiken.find((r) => r.name === "Verkehrsillusion");
      expect(illusion, text).toBeTruthy();
      expect(illusion!.wert).toContain("25 bis 60");
    }
    const energie = schaetze(w, alsProjekt("Baue ein neues Atomkraftwerk in Sinop"), "x");
    expect(energie.risiken.some((r) => r.name === "Verkehrsillusion")).toBe(false);
  });

  test("Der Mentorin-Text erklärt Richtung und Bandbreite, nie exakte Zahlenreihen", () => {
    const w = welt();
    const s = schaetze(w, alsProjekt("Baue einen neuen Hafen in Mersin"), "x");
    expect(s.mentor).toContain("Band");
    expect(s.mentor).toMatch(/Überschreitung|Regel/);
    expect(s.mentor).toMatch(/Zweitrundeneffekt|Rivalen|Nachbarn/);
  });
});

describe("Ins Reich: Entwurf, Annahme, Verwirklichung", () => {
  test("Ein Entwurf liegt mit geschätzten Bändern im Reich, noch nicht in der Vorhabenliste", () => {
    const w = welt();
    const e = entwirf(w, "Baue einen neuen Hafen in Mersin");
    expect(e.art).toBe("entwurf");
    if (e.art !== "entwurf") return;
    expect(freieEntwuerfe(w).map((x) => x.id)).toContain(e.id);
    expect(vorhabenDef(e.id)?.frei).toBe(true);
    expect(vorhabenListe(w, "infrastruktur").some((x) => x.v.id === e.id)).toBe(false);
  });

  test("Annahme verwirklicht die Bänder: Wirkungen liegen im Band, das Vorhaben läuft mit Vergabe", () => {
    const w = welt();
    const e = entwirf(w, "Baue eine Eisenbahn von Ankara nach Konya");
    if (e.art !== "entwurf") throw new Error("kein Entwurf");
    const r = beginneFrei(w, e.id, "stammfirma");
    expect(r.ok).toBe(true);
    const z = reichZustand(w);
    const lauf = z.laufend.find((l) => l.id === e.id);
    expect(lauf?.frei).toBe(true);
    expect(lauf?.vergabe).toBe("stammfirma");
    // Verwirklichte Dauerwirkungen respektieren die Bänder der Schätzung
    const def = vorhabenDef(e.id)!;
    for (const wkg of e.eintrag.schaetzung.wirkungen.filter((x) => x.vorlage.t === "knoten")) {
      const realisiert = (def.dauer ?? []).find((x) => x.t === "knoten" && x.id === (wkg.vorlage as { id: string }).id);
      expect(realisiert, wkg.name).toBeTruthy();
    }
    // Begonnene freie Vorhaben tauchen in der Vorhabenliste auf
    expect(vorhabenListe(w, "infrastruktur").some((x) => x.v.id === e.id)).toBe(true);
  });

  test("Überschreitung tritt deterministisch ein: gleicher Wurf, gleiches Ergebnis", () => {
    const ergebnis = (seed: number) => {
      const w = welt();
      const e = entwirf(w, "Baue eine Eisenbahn von Ankara nach Konya");
      if (e.art !== "entwurf") throw new Error("kein Entwurf");
      beginneFrei(w, e.id);
      const z = reichZustand(w);
      const lauf = z.laufend.find((l) => l.id === e.id)!;
      const def = vorhabenDef(e.id)!;
      const bauVorher = laufBau(lauf, def);
      lauf.fortschritt = Math.ceil(bauVorher * 0.36);
      reichMonat(w, new Rng(seed));
      return { gewachsen: laufBau(lauf, def) > bauVorher, meldung: z.meldungen.some((m) => m.art === "ueberzug") };
    };
    // Dieselbe Saat → dasselbe Ergebnis (Determinismus)
    expect(ergebnis(11)).toEqual(ergebnis(11));
    expect(ergebnis(23)).toEqual(ergebnis(23));
    // Über viele Saaten: Schiene (60 %) zeigt beide Ausgänge, und die Meldung folgt dem Wachstum
    const ausgaenge = Array.from({ length: 40 }, (_, i) => ergebnis(i + 1));
    expect(ausgaenge.some((x) => x.gewachsen)).toBe(true);
    expect(ausgaenge.some((x) => !x.gewachsen)).toBe(true);
    for (const x of ausgaenge) expect(x.meldung).toBe(x.gewachsen);
  });

  test("Zweitrundeneffekt: Rivalen und Nachbarländer nehmen ab", () => {
    const w = welt();
    const d = alsProjekt("Baue den größten Hafen der Welt bei Mersin");
    const s = schaetze(w, d, "x");
    expect(s.nachbarn.some((n) => n.art === "provinz")).toBe(true);
    expect(s.nachbarn.some((n) => n.art === "land")).toBe(true);
    const e = entwirf(w, "Baue den größten Hafen der Welt bei Mersin");
    if (e.art !== "entwurf") throw new Error("kein Entwurf");
    beginneFrei(w, e.id);
    const def = vorhabenDef(e.id)!;
    // Rivalenprovinzen verlieren regionale Wirtschaft (Gravitation)
    expect((def.dauer ?? []).some((x) => x.t === "knoten" && x.id === "wachstum_regional" && x.d < 0)).toBe(true);
    // Griechenland verliert Handel und Vertrauen (internationale Strahlkraft)
    expect(def.abschluss.some((x) => x.t === "land" && x.land === "GRC" && x.d < 0)).toBe(true);
  });
});

describe("Bagdadbahn-Verhandlungsserie", () => {
  test("Ohne Zusagen der Transitländer beginnt die Strecke nicht", () => {
    const w = welt();
    const e = entwirf(w, "Baue die Bagdadbahn");
    if (e.art !== "entwurf") throw new Error("kein Entwurf");
    expect(Object.keys(e.eintrag.transit ?? {}).sort()).toEqual(["IRQ", "SYR"]);
    const r = beginneFrei(w, e.id);
    expect(r.ok).toBe(false);
    expect(r.text).toContain("Durchfahrt");
  });

  test("Zusage beider Transitländer öffnet die Strecke", () => {
    const w = welt();
    const e = entwirf(w, "Baue die Bagdadbahn");
    if (e.art !== "entwurf") throw new Error("kein Entwurf");
    const r1 = transitVerhandeln(w, e.id, "IRQ");
    expect(r1.ok).toBe(true);
    const r2 = transitVerhandeln(w, e.id, "SYR");
    expect(r2.ok).toBe(true);
    expect(r2.text).toContain("Strecke ist frei");
    const b = beginneFrei(w, e.id, "ausschreibung");
    expect(b.ok).toBe(true);
    const lauf = reichZustand(w).laufend.find((l) => l.id === e.id);
    expect(lauf?.frei).toBe(true);
    // Die Transitländer profitieren beim Abschluss (Paketgeschäft)
    const def = vorhabenDef(e.id)!;
    expect(def.abschluss.some((x) => x.t === "land" && x.land === "IRQ" && x.d > 0)).toBe(true);
  });

  test("Ein Veto macht die Strecke tot — oder den Umweg teurer", () => {
    const w = welt();
    const e = entwirf(w, "Autobahn bis Griechenland");
    if (e.art !== "entwurf") throw new Error("kein Entwurf");
    expect(e.eintrag.transit).toEqual({ GRC: "offen" });
    // Athen wird maximal abweisend gemacht (Spielsituation, keine Tatsache)
    const zg = weltZustand(w)["GRC"]!;
    zg.versatz = -60;
    zg.konflikt = 100;
    const r = transitVerhandeln(w, e.id, "GRC");
    expect(r.ok).toBe(false);
    expect(e.eintrag.transit!["GRC"]).toBe("veto");
    // Mit dem Veto beginnt nichts
    const blockiert = beginneFrei(w, e.id);
    expect(blockiert.ok).toBe(false);
    expect(blockiert.text).toContain("verweigert");
    // Der Umweg: teurer und länger, aber möglich
    const bauVorher = e.eintrag.def.kosten.bau;
    const u = transitUmweg(w, e.id, "GRC");
    expect(u.ok).toBe(true);
    expect(e.eintrag.transit!["GRC"]).toBe("umgangen");
    expect(e.eintrag.def.kosten.bau).toBe(Math.round(bauVorher * UMWEG_FAKTOR));
    expect(beginneFrei(w, e.id).ok).toBe(true);
  });

  test("Gegenangebot eines Transitlandes lässt sich annehmen", () => {
    const w = welt();
    const e = entwirf(w, "Autobahn bis Syrien");
    if (e.art !== "entwurf") throw new Error("kein Entwurf");
    // Damaskus wird so eingestellt, dass das erste Paket knapp scheitert (Spielsituation)
    const zs = weltZustand(w)["SYR"]!;
    zs.versatz = -60;
    zs.konflikt = 100;
    const r = transitVerhandeln(w, e.id, "SYR");
    expect(r.ok).toBe(false);
    expect(e.eintrag.transitGegen?.["SYR"], r.text).toBeTruthy();
    expect(e.eintrag.transit!["SYR"]).toBe("offen");
    const a = transitGegenAnnehmen(w, e.id, "SYR");
    expect(a.ok).toBe(true);
    expect(e.eintrag.transit!["SYR"]).toBe("zusage");
    expect(beginneFrei(w, e.id).ok).toBe(true);
  });

  test("Das Transit-Paket verlangt die Durchfahrt und bietet die besten Klauseln des Landes", () => {
    const w = welt();
    const p = transitPaket(w, "IRQ");
    expect(p).toBeTruthy();
    expect(p!.will.length).toBe(1);
    expect(p!.gibt.length).toBeGreaterThan(0);
    // Ein Land ohne Durchfahrts-Klausel liefert kein Paket (kommt einem Veto gleich)
    for (const landId of ["SYR", "IRQ", "GRC", "CHN", "GEO", "AZE", "KAZ"]) {
      expect(transitPaket(w, landId), landId).toBeTruthy();
    }
  });
});

describe("Migration und Spielstand", () => {
  test("Ältere Spielstände ohne freie Projekte laufen weiter", () => {
    const w = welt();
    delete w.spiel!.reich;
    const geladen = load(JSON.stringify(w));
    expect(freieEntwuerfe(geladen)).toEqual([]);
    const e = entwirf(geladen, "Baue einen neuen Hafen in Mersin");
    expect(e.art).toBe("entwurf");
  });

  test("Ein Entwurf übersteht Speichern und Laden samt Definition und Schätzung", () => {
    const w = welt();
    const e = entwirf(w, "Autobahn bis China");
    if (e.art !== "entwurf") throw new Error("kein Entwurf");
    const geladen = load(JSON.stringify(w));
    const entwuerfe = freieEntwuerfe(geladen);
    expect(entwuerfe.map((x) => x.id)).toContain(e.id);
    expect(entwuerfe[0]!.eintrag.schaetzung.transit?.length).toBeGreaterThan(0);
    // Die Definition ist nach dem Laden wieder erreichbar
    expect(vorhabenDef(e.id)?.name).toBe(e.eintrag.def.name);
    expect(vorhabenListe(geladen, "infrastruktur").some((x) => x.v.id === e.id)).toBe(false);
  });

  test("Ein begonnenes freies Vorhaben läuft nach dem Laden weiter", () => {
    const w = welt();
    const e = entwirf(w, "Baue einen neuen Hafen in Mersin");
    if (e.art !== "entwurf") throw new Error("kein Entwurf");
    expect(beginneFrei(w, e.id).ok).toBe(true);
    const geladen = load(JSON.stringify(w));
    expect(reichZustand(geladen).laufend.some((l) => l.id === e.id && l.frei)).toBe(true);
    expect(vorhabenDef(e.id)?.frei).toBe(true);
  });
});

describe("Parser: freie Eingabe läuft durch den Interpreter", () => {
  test("„Größter Hafen der Welt“ erzeugt ein Schätzblatt im Reich", () => {
    const w = welt();
    const r = befehl("Baue den größten Hafen der Welt bei Mersin", w);
    expect(r.ok).toBe(true);
    expect(r.text).toContain("Schätzblatt");
    expect(r.text).toMatch(/Kapital|Baupunkte/);
    expect(r.why).toBeTruthy();
    expect(freieEntwuerfe(w).length).toBe(1);
    expect(freieEntwuerfe(w)[0]!.eintrag.schaetzung.massstab).toBe("weltgroesste");
  });

  test("„Autobahn bis China“ erzeugt einen Entwurf mit Transit-Kette", () => {
    const w = welt();
    const r = befehl("Autobahn bis China", w);
    expect(r.ok).toBe(true);
    expect(r.text).toContain("Verhandlungstisch");
    const e = freieEntwuerfe(w)[0]!;
    expect(Object.keys(e.eintrag.transit ?? {})).toContain("CHN");
  });

  test("„Palast auf dem Mond“ wird ehrlich abgesagt", () => {
    const w = welt();
    const r = befehl("Baue einen Palast auf dem Mond", w);
    expect(r.ok).toBe(false);
    expect(r.text).toContain("jenseits");
    expect(r.why).toContain("Denkmal");
    expect(freieEntwuerfe(w).length).toBe(0);
  });

  test("„Frieden zwischen Ukraine und Russland“ verweist auf die Vermittlung", () => {
    const w = welt();
    const r = befehl("Frieden zwischen Ukraine und Russland", w);
    expect(r.ok).toBe(false);
    expect(r.text).toContain("vermittelt");
    expect(freieEntwuerfe(w).length).toBe(0);
  });

  test("Mehrdeutiges führt zur Rückfrage", () => {
    const w = welt();
    const r = befehl("Baue etwas von Ankara nach Konya", w);
    expect(r.ok).toBe(false);
    expect(r.text).toContain("Schiene oder Straße");
  });

  test("Maßnahmen bleiben Maßnahmen: „Wasserleitungen in Hatay und Adana“ ist kein Großprojekt", () => {
    const w = welt();
    const r = befehl("Baue Wasserleitungen in Hatay und Adana", w);
    expect(r.text).not.toContain("Schätzblatt");
    expect(freieEntwuerfe(w).length).toBe(0);
  });
});

describe("KI-Aktion art:\"grossprojekt\"", () => {
  test("Das Protokoll liest die Aktion aus einer Modellantwort", () => {
    const er = leseAntwort(`{"antwort":"Ich schlage den Hafen vor.","aktionen":[{"art":"grossprojekt","text":"größter Hafen der Welt bei Mersin","vergabe":"stammfirma","grund":"Logistik"}]}`);
    expect(er.aktionen.length).toBe(1);
    const a = er.aktionen[0]!;
    expect(a.art).toBe("grossprojekt");
    if (a.art === "grossprojekt") {
      expect(a.text).toContain("Hafen");
      expect(a.vergabe).toBe("stammfirma");
    }
  });

  test("Vorschau zeigt Bandbreiten, Ausführung legt den Entwurf an und beginnt", () => {
    const w = welt();
    const a = { art: "grossprojekt" as const, text: "Baue eine Eisenbahn von Ankara nach Konya" };
    const v = vorschau(w, a);
    expect(v.problem).toBeUndefined();
    expect(v.hinweis).toContain("Bandbreiten");
    const r = fuehreAus(w, a);
    expect(r.ok).toBe(true);
    const lauf = reichZustand(w).laufend.find((l) => l.frei);
    expect(lauf).toBeTruthy();
  });

  test("Ein Projekt mit Grenzübertritt wird zum Entwurf mit Verhandlungshinweis, nicht zum heimlichen Bau", () => {
    const w = welt();
    const a = { art: "grossprojekt" as const, text: "Autobahn bis China" };
    const v = vorschau(w, a);
    expect(v.problem).toBeUndefined();
    expect(v.hinweis).toContain("Verhandlungsserie");
    const r = fuehreAus(w, a);
    expect(r.ok).toBe(true);
    expect(r.text).toContain("Verhandlungstisch");
    expect(reichZustand(w).laufend.some((l) => l.frei)).toBe(false);
    expect(freieEntwuerfe(w).length).toBe(1);
  });

  test("Unsinn und Frieden werden in der Vorschau ehrlich abgefangen", () => {
    const w = welt();
    const absurd = vorschau(w, { art: "grossprojekt", text: "Palast auf dem Mond" });
    expect(absurd.problem).toContain("jenseits");
    const frieden = vorschau(w, { art: "grossprojekt", text: "Frieden zwischen Ukraine und Russland" });
    expect(frieden.problem).toContain("vermittelt");
  });
});
