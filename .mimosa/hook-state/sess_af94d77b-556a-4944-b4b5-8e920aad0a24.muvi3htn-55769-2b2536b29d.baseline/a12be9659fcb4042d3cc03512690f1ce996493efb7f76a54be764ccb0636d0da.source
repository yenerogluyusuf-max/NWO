// Personen: Profile, Gespräche mit Folgen, Aufträge, Entlassung und Nachfolge, Ehemalige, Zusagen, ältere Spielstände.

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { ANSATZ_REIHENFOLGE, ansaetzeFuer, fuehreGespraech, planeGespraech, themenFuer, MAX_TERMINE } from "../src/sim/gespraeche";
import { AEMTER, eigenVon, sorgeText } from "../src/sim/personen";
import type { World } from "../src/sim/types";

function welt(seed = 3): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 60;
  return w;
}

describe("Personen: Profil und Umfeld", () => {
  test("Das Umfeld hat Regierung, Zentralbank und Opposition, jede Person ein Profil", () => {
    const w = welt();
    const amts = w.spiel!.figuren.map((f) => f.amt);
    for (const a of ["finanzen", "inneres", "aussen", "zentralbank", "stab", "opposition", "justiz", "generalstab", "wirtschaft"]) expect(amts).toContain(a);
    for (const f of w.spiel!.figuren) {
      const e = eigenVon(w, f);
      expect(e.faehigkeit).toBeGreaterThanOrEqual(0);
      expect(e.ehrgeiz).toBeLessThanOrEqual(100);
      expect(sorgeText(w, f)).not.toMatch(/undefined|NaN|\[object/);
    }
  });

  test("Namen im Umfeld sind eindeutig", () => {
    const w = welt();
    const namen = w.spiel!.figuren.map((f) => f.name);
    expect(new Set(namen).size).toBe(namen.length);
  });
});

describe("Gespräche", () => {
  test("Jede Kombination aus Person, Thema und Ansatz lässt sich planen und ohne Absturz ausführen", () => {
    for (const f0 of welt().spiel!.figuren) {
      if (f0.amt === "opposition") continue;
      const themen = themenFuer(welt(), f0.id);
      expect(themen.length).toBeGreaterThanOrEqual(2);
      for (const t of themen) {
        for (const a of ANSATZ_REIHENFOLGE) {
          const w = welt();
          const f = w.spiel!.figuren.find((x) => x.id === f0.id)!;
          f.loyalitaet = 40;
          eigenVon(w, f).groll = 50;
          const p = planeGespraech(w, f.id, t.id, a);
          if ("grund" in p && !("ansatz" in p)) continue;
          const r = fuehreGespraech(w, f.id, t.id, a);
          const alles = JSON.stringify(r);
          expect(alles, `${f.amt}/${t.id}/${a}`).not.toMatch(/undefined|NaN|\[object|Infinity/);
        }
      }
    }
  });

  test("Vertrauen aufbauen kostet Kapital, hebt die Loyalität und verbraucht den Termin", () => {
    const w = welt();
    const f = w.spiel!.figuren.find((x) => x.amt === "finanzen")!;
    const vorher = f.loyalitaet;
    const kapital = w.spiel!.kapital;
    const r = fuehreGespraech(w, f.id, "sorge", "vertrauen");
    expect(r.ok).toBe(true);
    expect(f.loyalitaet).toBeGreaterThan(vorher);
    expect(w.spiel!.kapital).toBe(kapital - 1);
    // Abkühlzeit: sofort ein zweites Gespräch geht nicht
    const zweites = fuehreGespraech(w, f.id, "sorge", "vertrauen");
    expect(zweites.ok).toBe(false);
    expect(zweites.text).toMatch(/vor Kurzem/);
  });

  test("Termine sind knapp: höchstens vier in dreißig Tagen", () => {
    const w = welt();
    const ids = w.spiel!.figuren.filter((f) => f.amt !== "opposition").map((f) => f.id);
    let ok = 0;
    for (const id of ids) if (fuehreGespraech(w, id, "sorge", "rat").ok) ok++;
    expect(ok).toBe(MAX_TERMINE);
  });

  test("Rat enthält Zahlen aus dem Weltzustand und ist bei geringer Loyalität verweigert", () => {
    const w = welt();
    const f = w.spiel!.figuren.find((x) => x.amt === "inneres")!;
    f.loyalitaet = 70;
    const lage = themenFuer(w, f.id).find((t) => t.art === "lage")!;
    const r = fuehreGespraech(w, f.id, lage.id, "rat");
    expect(r.ok).toBe(true);
    expect(r.hinweise.join(" ")).toMatch(/\d/);
    const w2 = welt();
    const g = w2.spiel!.figuren.find((x) => x.amt === "inneres")!;
    g.loyalitaet = 20;
    const p = planeGespraech(w2, g.id, "sorge", "rat");
    expect("grund" in p && p.grund).toMatch(/Loyalität/);
  });

  test("Ein Auftrag läuft mit Frist und wird am Stichtag gemessen", () => {
    const w = welt();
    const f = w.spiel!.figuren.find((x) => x.amt === "inneres")!;
    f.loyalitaet = 70;
    const t = themenFuer(w, f.id).find((x) => x.art === "lage")!;
    const r = fuehreGespraech(w, f.id, t.id, "auftrag");
    expect(r.ok).toBe(true);
    const a = eigenVon(w, f).auftrag!;
    expect(a.status).toBe("laeuft");
    expect(a.frist).toBe(w.day + 180);
    advance(w, 250);
    expect(["erfuellt", "verfehlt"]).toContain(eigenVon(w, f).auftrag!.status);
    expect(eigenVon(w, f).erinnerung.some((x) => /Auftrag/.test(x.text))).toBe(true);
  });

  test("Kritik senkt Loyalität und erhöht Groll; ohne Anlass ist sie gesperrt", () => {
    const w = welt();
    const f = w.spiel!.figuren.find((x) => x.amt === "wirtschaft")!;
    const sorge = planeGespraech(w, f.id, "sorge", "kritik");
    expect("grund" in sorge && sorge.grund).toBeTruthy();
    const lage = themenFuer(w, f.id).find((t) => t.art === "lage" && t.dringlich);
    if (lage) {
      const vorher = f.loyalitaet;
      const g0 = eigenVon(w, f).groll;
      expect(fuehreGespraech(w, f.id, lage.id, "kritik").ok).toBe(true);
      expect(f.loyalitaet).toBeLessThan(vorher);
      expect(eigenVon(w, f).groll).toBeGreaterThan(g0);
    }
  });

  test("Anerkennung gibt Mittel, kostet Kapital und macht Neid bei den anderen", () => {
    const w = welt();
    const f = w.spiel!.figuren.find((x) => x.amt === "justiz")!;
    const anderer = w.spiel!.figuren.find((x) => x.amt === "inneres")!;
    const g0 = eigenVon(w, anderer).groll;
    const r = fuehreGespraech(w, f.id, "sorge", "belohnung");
    expect(r.ok).toBe(true);
    expect(eigenVon(w, f).mittelBis).toBeGreaterThan(w.day);
    expect(eigenVon(w, anderer).groll).toBeGreaterThan(g0);
    expect(r.kosten).toBe(2);
  });

  test("Die Machtfrage kann zum Rücktritt führen: kommissarische Leitung und Ehemalige", () => {
    const w = welt(5);
    const f = w.spiel!.figuren.find((x) => x.amt === "generalstab")!;
    f.loyalitaet = 8;
    eigenVon(w, f).groll = 80;
    eigenVon(w, f).ehrgeiz = 90;
    const alterName = f.name;
    const r = fuehreGespraech(w, f.id, "sorge", "machtfrage");
    expect(r.ok).toBe(true);
    expect(r.ausgang).toBe("bruch");
    expect(f.name).not.toBe(alterName);
    expect(eigenVon(w, f).kommissarisch).toBe(true);
    expect(w.spiel!.ehemalige!.some((x) => x.name === alterName)).toBe(true);
  });

  test("ansaetzeFuer nennt für jeden Ansatz Kosten und Vorschau oder den Grund", () => {
    const w = welt();
    const f = w.spiel!.figuren.find((x) => x.amt === "stab")!;
    const liste = ansaetzeFuer(w, f.id, "sorge");
    expect(liste).toHaveLength(ANSATZ_REIHENFOLGE.length);
    for (const a of liste) expect(a.plan.grund || a.plan.folgen.length).toBeTruthy();
  });
});

describe("Ämter", () => {
  test("Regierungsämter haben eine Ressortwirkung mit gültigen Knoten", () => {
    for (const d of Object.values(AEMTER)) {
      for (const x of d.wirkung) expect(typeof x.id).toBe("string");
      expect(d.stile.length).toBeGreaterThan(0);
    }
  });
});

describe("Ältere Spielstände", () => {
  test("Ohne Profile und ohne die neuen Ämter lädt der Spielstand, ergänzt sie und läuft weiter", () => {
    const w = welt();
    const f = w.spiel!.figuren;
    w.spiel!.figuren = f.filter((x) => !["justiz", "generalstab", "wirtschaft"].includes(x.amt));
    for (const x of w.spiel!.figuren) delete x.eigen;
    delete w.spiel!.termine;
    delete w.spiel!.ehemalige;
    const neu = load(save(w));
    const amts = neu.spiel!.figuren.map((x) => x.amt);
    expect(amts).toContain("justiz");
    expect(amts).toContain("generalstab");
    expect(amts).toContain("wirtschaft");
    advance(neu, 90);
    expect(neu.spiel!.figuren.every((x) => Number.isFinite(x.loyalitaet))).toBe(true);
  });
});

// ---------------------------------------------------------------------------

import { ehemaligeMonat, entlasse, entlassungsFolgen, ernenneNachfolger, kandidatenFuer } from "../src/sim/nachfolge";
import { brecheFrei, loeseEin, vertroesteFrei, zusageBezug, zusagenBilanz, zusagenSicht } from "../src/sim/zusagen";
import { entscheide, oeffne, ansicht } from "../src/sim/ereignisse";
import { Rng } from "../src/sim/rng";
import { nationalAverage } from "../src/sim/netz";
import { NET } from "../src/sim/modell";

describe("Nachfolge", () => {
  test("Drei Kandidaten mit verschiedenen Namen und Profilen, stabil bei wiederholtem Aufruf", () => {
    const w = welt();
    const a = kandidatenFuer(w, "finanzen");
    const b = kandidatenFuer(w, "finanzen");
    expect(a).toHaveLength(3);
    expect(a.map((k) => k.name)).toEqual(b.map((k) => k.name));
    expect(new Set(a.map((k) => k.name)).size).toBe(3);
    expect(new Set(a.map((k) => k.id)).size).toBe(3);
    // Männlicher Amtsinhaber, männliche Kandidaten; weibliche Amtsinhaberin, weibliche Kandidatinnen
    const f = w.spiel!.figuren.find((x) => x.amt === "finanzen")!;
    expect(a.every((k) => k.weiblich === !!f.weiblich)).toBe(true);
    for (const k of a) expect(`${k.herkunft} ${k.staerke} ${k.schwaeche}`).not.toMatch(/undefined|NaN/);
  });

  test("Entlassung mit Kandidat: Amt neu besetzt, Kosten gebucht, Ehemaliger vermerkt, Lager verärgert, Märkte reagieren", () => {
    const w = welt();
    const f = w.spiel!.figuren.find((x) => x.amt === "finanzen")!;
    const alt = f.name;
    const ks = kandidatenFuer(w, "finanzen");
    const risiko0 = w.economy.riskPremium;
    const kapital0 = w.spiel!.kapital;
    const lagerGenossen = w.spiel!.figuren.filter((x) => x !== f && eigenVon(w, x).lager === eigenVon(w, f).lager && AEMTER[x.amt].regierungsamt);
    const loy0 = lagerGenossen.map((x) => x.loyalitaet);
    const r = entlasse(w, "finanzen", ks[0]!.id);
    expect(r.ok).toBe(true);
    expect(f.name).toBe(ks[0]!.name);
    expect(f.name).not.toBe(alt);
    expect(w.spiel!.kapital).toBe(kapital0 - ks[0]!.pk);
    expect(w.spiel!.ehemalige!.some((x) => x.name === alt)).toBe(true);
    // Der Wechsel im Finanzministerium kostet 30 Punkte; die Marktreaktion auf den Kandidaten kommt dazu (der Fachmann beruhigt)
    expect(w.economy.riskPremium).toBeCloseTo(risiko0 + 30 + ks[0]!.markt, 5);
    lagerGenossen.forEach((x, i) => expect(x.loyalitaet).toBeLessThan(loy0[i]!));
    expect(eigenVon(w, f).einarbeitungBis).toBeGreaterThan(w.day);
    expect(eigenVon(w, f).kommissarisch).toBeFalsy();
    expect(entlassungsFolgen(w, "finanzen").length).toBeGreaterThan(2);
  });

  test("Kommissarische Leitung und spätere Ernennung; Ämter ohne Entlassung sind gesperrt", () => {
    const w = welt();
    const f = w.spiel!.figuren.find((x) => x.amt === "inneres")!;
    expect(entlasse(w, "inneres", null).ok).toBe(true);
    expect(eigenVon(w, f).kommissarisch).toBe(true);
    const interim = f.name;
    const k = kandidatenFuer(w, "inneres")[0]!;
    const r = ernenneNachfolger(w, "inneres", k.id);
    expect(r.ok).toBe(true);
    expect(f.name).not.toBe(interim);
    expect(eigenVon(w, f).kommissarisch).toBeFalsy();
    // Wer nicht kommissarisch führt, wird nicht ernannt, sondern entlassen
    expect(ernenneNachfolger(w, "inneres", k.id).ok).toBe(false);
    expect(entlasse(w, "zentralbank", null).ok).toBe(false);
    expect(entlasse(w, "opposition", null).ok).toBe(false);
  });

  test("Zu wenig Kapital: keine Entlassung", () => {
    const w = welt();
    w.spiel!.kapital = -19;
    expect(entlasse(w, "aussen", kandidatenFuer(w, "aussen")[0]!.id).ok).toBe(false);
  });

  test("Wer im Streit geht, kann später aussagen: Vertrauen und Legitimität sinken", () => {
    const w = welt();
    w.spiel!.ehemalige = [{ name: "Test Person", amt: "aussen", rolle: "Außenminister", ausgeschieden: 0, groll: 90, ehrgeiz: 80, lager: "diplomatie", grund: "Streit", ausgepackt: false }];
    const v0 = nationalAverage(NET, w.net, "vertrauen_regierung");
    for (let i = 0; i < 80 && !w.spiel!.ehemalige[0]!.ausgepackt; i++) {
      w.day += 30;
      ehemaligeMonat(w);
    }
    expect(w.spiel!.ehemalige[0]!.ausgepackt).toBe(true);
    expect(nationalAverage(NET, w.net, "vertrauen_regierung")).toBeLessThan(v0);
    expect(w.spiel!.chronik.some((c) => /packt aus/.test(c.titel))).toBe(true);
  });
});

describe("Ereignisse um Personen", () => {
  function pw(): { w: World; id: string } {
    const w = welt(4);
    w.spiel!.kapital = 60;
    const f = w.spiel!.figuren.find((x) => x.amt === "inneres")!;
    f.loyalitaet = 10;
    eigenVon(w, f).groll = 70;
    eigenVon(w, f).ehrgeiz = 85;
    return { w, id: f.id };
  }

  test("Rücktrittsdrohung: Zugeständnisse halten die Person, Annehmen bringt eine kommissarische Leitung", () => {
    const a = pw();
    const ev = oeffne(a.w, "person_ruecktritt", new Rng(1))!;
    expect(ev.daten?.figur).toBe(a.id);
    const alt = a.w.spiel!.figuren.find((x) => x.id === a.id)!;
    const loy0 = alt.loyalitaet;
    entscheide(a.w, ev.id, "zugestaendnisse", new Rng(1));
    expect(alt.loyalitaet).toBeGreaterThan(loy0 + 10);
    expect(eigenVon(a.w, alt).kommissarisch).toBeFalsy();

    const b = pw();
    const ev2 = oeffne(b.w, "person_ruecktritt", new Rng(1))!;
    const name0 = b.w.spiel!.figuren.find((x) => x.id === b.id)!.name;
    entscheide(b.w, ev2.id, "annehmen", new Rng(1));
    const neu = b.w.spiel!.figuren.find((x) => x.id === b.id)!;
    expect(neu.name).not.toBe(name0);
    expect(eigenVon(b.w, neu).kommissarisch).toBe(true);
  });

  test("Skandal, Intrige und Leck: jede Antwort läuft ohne Fehler durch und verändert das Umfeld", () => {
    for (const vorlage of ["person_skandal", "person_intrige", "person_leck"]) {
      const { w } = pw();
      const ev = oeffne(w, vorlage, new Rng(2))!;
      const a = ansicht(w, ev);
      expect(a.optionen.some((o) => (o.anzeigePk ?? o.pk) === 0)).toBe(true);
      for (const o of a.optionen) {
        const p = pw();
        const e2 = oeffne(p.w, vorlage, new Rng(2))!;
        const r = entscheide(p.w, e2.id, o.id, new Rng(3));
        expect(r.text).not.toMatch(/undefined|NaN/);
      }
    }
  });
});

describe("Zusagen", () => {
  test("Die Ansicht nennt Bezug, Frist, Fortschritt und die Folgen von Halten und Brechen", () => {
    const w = welt();
    const s = zusagenSicht(w);
    expect(s.length).toBeGreaterThan(0);
    for (const z of s) {
      expect(z.gehalten.length).toBeGreaterThan(0);
      expect(z.gebrochen.length).toBeGreaterThan(0);
      expect(["ruhig", "bald", "dringend", "ueberfaellig"]).toContain(z.dringlichkeit);
      if (z.z.massnahme) {
        expect(z.fortschritt).toBeTruthy();
        expect(z.fortschritt!.anteil).toBeGreaterThanOrEqual(0);
        expect(z.fortschritt!.anteil).toBeLessThanOrEqual(1);
      }
      expect(zusageBezug(w, z.z).name.length).toBeGreaterThan(0);
    }
  });

  test("Vertrösten kostet 1 Kapital und Geduld, höchstens zweimal; Brechen kostet Glaubwürdigkeit", () => {
    const w = welt();
    const z = w.spiel!.zusagen[0]!;
    const k0 = w.spiel!.kapital;
    const b0 = zusagenBilanz(w);
    expect(vertroesteFrei(w, z).ok).toBe(true);
    expect(w.spiel!.kapital).toBe(k0 - 1);
    expect(z.vertroestet).toBe(1);
    expect(z.faellig).toBe(w.day + 90);
    expect(vertroesteFrei(w, z).ok).toBe(true);
    expect(vertroesteFrei(w, z).ok).toBe(false);
    expect(zusagenBilanz(w).glaubwuerdigkeit).toBeLessThan(b0.glaubwuerdigkeit);
    const l0 = nationalAverage(NET, w.net, "legitimitaet");
    expect(brecheFrei(w, z).ok).toBe(true);
    expect(z.gebrochen).toBe(true);
    expect(z.abgeschlossen).toBe(w.day);
    expect(nationalAverage(NET, w.net, "legitimitaet")).toBeLessThan(l0);
    expect(zusagenBilanz(w).gebrochen).toBe(1);
    // Zweimal abschließen bucht die Folgen nicht doppelt
    const l1 = nationalAverage(NET, w.net, "legitimitaet");
    expect(brecheFrei(w, z).ok).toBe(false);
    expect(nationalAverage(NET, w.net, "legitimitaet")).toBe(l1);
  });

  test("Einlösen: Ohne Gesetz kostet es 4 Kapital, mit Gesetz trägt das Gesetz die Kosten; die Glaubwürdigkeit steigt", () => {
    const w = welt();
    w.spiel!.zusagen.push({ id: "z-ohne", von: "Tester", text: "Ein Versprechen ohne Gesetz", faellig: w.day + 30, erfuellt: false, gebrochen: false });
    const z = w.spiel!.zusagen.find((x) => x.id === "z-ohne")!;
    const k0 = w.spiel!.kapital;
    const g0 = zusagenBilanz(w).glaubwuerdigkeit;
    const r = loeseEin(w, z);
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(k0 - 4);
    expect(z.erfuellt).toBe(true);
    expect(zusagenBilanz(w).glaubwuerdigkeit).toBeGreaterThan(g0);
  });

  test("Zusagen, die andere Systeme erfüllen (Gesetz beschlossen), werden im Monat nachgebucht", () => {
    const w = welt();
    const z = w.spiel!.zusagen[0]!;
    z.erfuellt = true;
    const l0 = nationalAverage(NET, w.net, "legitimitaet");
    advance(w, 35);
    expect(z.abgeschlossen).toBeDefined();
    expect(nationalAverage(NET, w.net, "legitimitaet")).toBeGreaterThan(l0 - 0.5);
  });
});

describe("Lange Partie mit Personen", () => {
  test("Fünf Jahre ohne Zutun: alle Werte endlich, Namen eindeutig, keine kaputten Texte im Protokoll", () => {
    const w = welt(9);
    for (let i = 0; i < 60 && !w.spiel!.ende; i++) {
      advance(w, 30);
      // Ereignisse verfallen lassen, damit Rücktritte und Skandale ihren Lauf nehmen
    }
    for (const f of w.spiel!.figuren) {
      expect(Number.isFinite(f.loyalitaet)).toBe(true);
      const e = eigenVon(w, f);
      expect(Number.isFinite(e.groll)).toBe(true);
      expect(Number.isFinite(e.ehrgeiz)).toBe(true);
    }
    const namen = w.spiel!.figuren.map((f) => f.name);
    expect(new Set(namen).size).toBe(namen.length);
    expect(w.log.filter((l) => /undefined|NaN|\[object/.test(l.text)).length).toBe(0);
  });
});

import { standardAntwort } from "../src/sim/ereignisse";
import { personenHinweise, ratZuEreignis, umfeldKontext } from "../src/sim/personen-api";

describe("Spielverlauf mit Gesprächen und Wechseln", () => {
  test("Vier Jahre: Gespräche in allen Ansätzen, Aufträge, Wechsel; nichts wird unendlich, kein Text ist kaputt", () => {
    const w = welt(11);
    const rng = new Rng(7);
    let gespraeche = 0;
    for (let monat = 0; monat < 48 && !w.spiel!.ende; monat++) {
      // Ereignisse beantworten wie ein einfacher Spieler
      for (const ev of [...w.spiel!.ereignisse]) {
        const id = standardAntwort(w, ev);
        if (id) entscheide(w, ev.id, id, rng);
      }
      w.spiel!.kapital = Math.max(w.spiel!.kapital, 30);
      const personen = w.spiel!.figuren.filter((f) => f.imAmt && f.amt !== "opposition");
      const f = personen[monat % personen.length]!;
      const themen = themenFuer(w, f.id);
      const ansatz = ANSATZ_REIHENFOLGE[monat % ANSATZ_REIHENFOLGE.length]!;
      const t = themen[monat % themen.length]!;
      const r = fuehreGespraech(w, f.id, t.id, ansatz);
      if (r.ok) gespraeche++;
      if (monat === 20) {
        // Ein Wechsel mitten in der Partie
        const kk = kandidatenFuer(w, "wirtschaft");
        entlasse(w, "wirtschaft", kk[1]!.id);
      }
      advance(w, 30);
    }
    expect(gespraeche).toBeGreaterThan(10);
    for (const f of w.spiel!.figuren) {
      expect(Number.isFinite(f.loyalitaet)).toBe(true);
      expect(f.loyalitaet).toBeGreaterThanOrEqual(0);
      expect(f.loyalitaet).toBeLessThanOrEqual(100);
      const e = eigenVon(w, f);
      expect(Number.isFinite(e.groll) && Number.isFinite(e.ehrgeiz) && Number.isFinite(e.faehigkeit)).toBe(true);
    }
    const namen = w.spiel!.figuren.map((f) => f.name);
    expect(new Set(namen).size).toBe(namen.length);
    expect(w.log.filter((l) => /undefined|NaN|\[object/.test(l.text + (l.why ?? ""))).length).toBe(0);
    expect(Object.values(w.net.values).every((x) => Number.isFinite(x))).toBe(true);
  });

  test("Schnittstellen: Hinweise, Ressortrat und Kontext für das Sprachmodell", () => {
    const w = welt();
    const f = w.spiel!.figuren.find((x) => x.amt === "aussen")!;
    f.loyalitaet = 10;
    expect(personenHinweise(w).some((h) => h.figurId === f.id && h.ton === "rot")).toBe(true);
    const kontext = umfeldKontext(w);
    expect(kontext).toMatch(/Loyalität/);
    expect(kontext).not.toMatch(/undefined|NaN/);
    w.spiel!.ereignisse.push({ id: "e-test", vorlage: "waehrungsrutsch", tag: w.day, frist: w.day + 10, provinzen: [], staerke: 1 });
    const rat = ratZuEreignis(w, "e-test");
    expect(rat.map((x) => x.rolle).join(" ")).toMatch(/Finanzminister|Gouverneurin/);
    for (const r of rat) expect(r.zeilen.join(" ")).not.toMatch(/undefined|NaN/);
  });
});
