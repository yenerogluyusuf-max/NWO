// Welle H3: Vernachlässigte Bereiche melden sich (Medien, Zentralbank, Kultur).
// Geprüft wird: Der Vorgang kommt bei Vernachlässigung und nicht bei Pflege, die Antworten buchen, was die Plakette zeigt,
// die Folgen ohne Antwort treten ein, gleicher Samen ergibt denselben Verlauf, und der Spielstand des Inhabers lädt und läuft.
import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { VORLAGEN, ansicht, antworten, entscheide, ereignisMonatSofort, oeffne, preisVorschau, vorlage } from "../src/sim/ereignisse";
import { BEREICHSDRUCK, angreifer, letzteMedienarbeit, letzterZbKontakt, zbLage } from "../src/sim/ereignisse-bereiche";
import { ERBE_DRUCK, erbeLageMonat, verfallKandidaten } from "../src/sim/ereignisse-reich";
import { fuehreMedienAktionAus, medienVon } from "../src/sim/medien";
import { machDruck } from "../src/sim/zentralbank";
import { ratingSicht } from "../src/sim/maerkte";
import { beginne, reichZustand } from "../src/sim/reich";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

function welt(seed = 4): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 60;
  return w;
}

/** Eine Partie, die so lange liegen gelassen wurde, dass jeder Bereich als vernachlässigt gilt (ohne Ereignisse, damit nichts dazwischenkommt). */
function vernachlaessigt(seed = 4): World {
  const w = welt(seed);
  for (let i = 0; i < 11; i++) {
    advance(w, 30);
    w.spiel!.ereignisse = [];
    w.spiel!.geplant = [];
  }
  w.spiel!.kapital = 60;
  return w;
}

const knoten = (w: World, id: string) => nationalAverage(NET, w.net, id);

describe("Medien: Kampagne eines kritischen Hauses", () => {
  test("kommt nach langer Ruhe, nicht nach Medienarbeit", () => {
    const w = vernachlaessigt();
    expect(w.day - letzteMedienarbeit(w)).toBeGreaterThanOrEqual(BEREICHSDRUCK.medien.ruheTage);
    expect(angreifer(w)).not.toBeNull();
    expect(vorlage("medien_kampagne").chance(w)).toBeGreaterThan(0);
    // Pflege: eine Pressekonferenz setzt die Uhr zurück
    expect(fuehreMedienAktionAus(w, "pressekonferenz").ok).toBe(true);
    expect(vorlage("medien_kampagne").chance(w)).toBe(0);
  });

  test("am Anfang der Amtszeit ist die Presse noch nicht vernachlässigt", () => {
    expect(vorlage("medien_kampagne").chance(welt())).toBe(0);
  });

  test("Schweigen kostet Vertrauen und bringt dem Haus Leser; die Interview-Antwort ist ein echter Medieneingriff", () => {
    const w = vernachlaessigt();
    const ev = oeffne(w, "medien_kampagne", new Rng(3))!;
    const blatt = String(ev.daten!.blatt);
    const k = load(save(w));
    const vor = knoten(k, "vertrauen_regierung");
    const reich0 = medienVon(k).cluster[blatt]!.reichweite;
    entscheide(k, ev.id, "abwarten", new Rng(1));
    expect(knoten(k, "vertrauen_regierung")).toBeLessThan(vor - 0.5 * BEREICHSDRUCK.medien.schaden * ev.staerke);
    expect(medienVon(k).cluster[blatt]!.reichweite).toBeCloseTo(reich0 + BEREICHSDRUCK.medien.reichweite, 6);
    const i = load(save(w));
    const n0 = medienVon(i).eingriffe.length;
    expect(entscheide(i, ev.id, "interview", new Rng(1)).ok).toBe(true);
    expect(medienVon(i).eingriffe.length).toBe(n0 + 1);
    expect(medienVon(i).cluster[blatt]!.wohlwollenBis).toBeGreaterThan(i.day);
  });
});

describe("Zentralbank: Zweifel an der Notenbank", () => {
  test("kommt bei geringer Glaubwürdigkeit und langem Schweigen, nicht nach einer Rede für die Bank", () => {
    const w = vernachlaessigt();
    w.economy.credibility = 0.1;
    w.economy.policyRate = w.economy.inflation; // keine Erholung: Realzins null, die Agentur droht
    expect(zbLage(w)).toBe("glaubwuerdigkeit");
    expect(w.day - letzterZbKontakt(w)).toBeGreaterThanOrEqual(BEREICHSDRUCK.zentralbank.pflegeTage);
    expect(vorlage("zentralbank_vertrauen").chance(w)).toBeGreaterThan(0);
    expect(machDruck(w, 1, "rede").ok).toBe(true);
    expect(vorlage("zentralbank_vertrauen").chance(w)).toBe(0);
  });

  test("ohne Lage (glaubwürdige Bank, Inflation im Rahmen) kommt nichts, auch wenn man schweigt", () => {
    const w = vernachlaessigt();
    w.economy.credibility = 0.8;
    w.published.inflation.value = Math.max(3, w.economy.inflationTarget + 1);
    // Auch kein hoher Realzins bei schwachem Wachstum (dritte Lage „zins“): Leitzins knapp über der Inflation
    w.economy.policyRate = w.published.inflation.value + 1;
    expect(zbLage(w)).toBeNull();
    expect(vorlage("zentralbank_vertrauen").chance(w)).toBe(0);
  });

  test("Abwarten senkt erst den Ausblick, beim zweiten Mal die Note; Stützen setzt die Rede und rückt die nächste Sitzung", () => {
    const w = vernachlaessigt();
    w.economy.credibility = 0.1;
    w.economy.policyRate = w.economy.inflation; // keine Erholung: Realzins null, die Agentur droht
    const ev = oeffne(w, "zentralbank_vertrauen", new Rng(2))!;
    expect(ev.daten!.lage).toBe("glaubwuerdigkeit");
    const a = load(save(w));
    const stufe0 = ratingSicht(a).index;
    const abstand0 = ratingSicht(a).abstand;
    // Entscheidung des Koordinators (6. November): wie echte Agenturen erst der negative Ausblick, dann die Herabstufung
    entscheide(a, ev.id, "abwarten", new Rng(1));
    expect(ratingSicht(a).index).toBe(stufe0);
    // Der Maßstab wird um eine halbe Stufe strenger (dazu kommt der kleine Verlust an Glaubwürdigkeit aus dem Schweigen)
    expect(ratingSicht(a).abstand).toBeLessThanOrEqual(abstand0 - BEREICHSDRUCK.zentralbank.ausblickPunkte / 10 + 1e-9);
    expect(a.spiel!.wirtschaft!.zb.ausblickNegativ).toBe(a.day);
    a.spiel!.zuletzt = {};
    const ev2 = oeffne(a, "zentralbank_vertrauen", new Rng(2))!;
    expect(antworten(a, ev2).find((o) => o.id === "abwarten")!.beschreibung).toMatch(/stuft die Agentur ab/);
    entscheide(a, ev2.id, "abwarten", new Rng(1));
    expect(ratingSicht(a).index).toBe(stufe0 - 1);
    expect(a.spiel!.wirtschaft!.zb.ausblickNegativ).toBeUndefined();
    const b = load(save(w));
    const g0 = b.economy.credibility;
    entscheide(b, ev.id, "stuetzen", new Rng(1));
    expect(b.economy.credibility).toBeGreaterThan(g0);
    expect(b.spiel!.wirtschaft!.zb.druck?.richtung).toBe(1);
    expect(letzterZbKontakt(b)).toBe(b.day);
  });
});

describe("Kein Zusatzplatz", () => {
  test("Ist ein Bereichsvorgang im Monat allein, wird er nicht vorgelegt, sondern gärt weiter", () => {
    const w = vernachlaessigt();
    w.spiel!.eskalation = {};
    w.spiel!.zuletzt = {};
    w.economy.credibility = 0.1;
    w.economy.policyRate = w.economy.inflation; // keine Erholung: Realzins null, die Agentur droht
    const alle = VORLAGEN.map((v) => v.chance);
    VORLAGEN.forEach((v) => { if (v.id !== "zentralbank_vertrauen") v.chance = () => 0; });
    const zb = vorlage("zentralbank_vertrauen");
    const zbChance = zb.chance;
    try {
      zb.chance = () => 1;
      ereignisMonatSofort(w, new Rng(1));
      expect(w.spiel!.ereignisse.some((e) => e.vorlage === "zentralbank_vertrauen")).toBe(false);
      expect(w.spiel!.eskalation?.zentralbank_vertrauen).toBe(1);
    } finally {
      VORLAGEN.forEach((v, i) => (v.chance = alle[i]!));
      zb.chance = zbChance;
    }
  });
});

describe("Kultur: Verfall einer Stätte", () => {
  test("meldet sich unter der Schwelle, nicht bei laufender Restaurierung oder gepflegter Stätte", () => {
    const w = welt();
    const z = reichZustand(w);
    for (const st of Object.values(z.staetten)) st.zustand = 80;
    expect(verfallKandidaten(w)).toEqual([]);
    expect(vorlage("erbe_verfall").chance(w)).toBe(0);
    z.staetten.thyatira!.zustand = 20;
    expect(verfallKandidaten(w).map((e) => e.id)).toEqual(["thyatira"]);
    expect(vorlage("erbe_verfall").chance(w)).toBeGreaterThan(0);
    expect(beginne(w, "restaurierung_thyatira").ok).toBe(true);
    expect(verfallKandidaten(w)).toEqual([]);
  });

  test("Welterbe: erst die Liste des gefährdeten Welterbes, dann die Streichung; gepflegt kommt es wieder herunter", () => {
    const w = welt();
    const z = reichZustand(w);
    for (const st of Object.values(z.staetten)) st.zustand = 80;
    z.staetten.ani!.zustand = 30;
    const ev = oeffne(w, "erbe_verfall", new Rng(1))!;
    expect(ev.daten).toMatchObject({ staette: "ani", lage: "warnung" });
    // Die Folgen in der Provinz stehen bei der Antwort, mit denselben Zahlen, die gebucht werden
    expect(antworten(w, ev).find((o) => o.id === "abwarten")!.bedingungen).toEqual([`In Kars: Tourismus −${ERBE_DRUCK.folgen.gefaehrdet.tourismus.toLocaleString("de-DE", { minimumFractionDigits: 1 })}.`]);
    const vorher = knoten(w, "ansehen");
    entscheide(w, ev.id, "abwarten", new Rng(1));
    expect(z.staetten.ani!.lage).toBe("gefaehrdet");
    expect(knoten(w, "ansehen")).toBeLessThan(vorher);
    // Gepflegt: über Schwelle plus Erholung kommt die Stätte von der Liste
    const g = load(save(w));
    reichZustand(g).staetten.ani!.zustand = ERBE_DRUCK.schwelle.welterbe + ERBE_DRUCK.erholung;
    erbeLageMonat(g);
    expect(reichZustand(g).staetten.ani!.lage).toBeUndefined();
    // Weiter liegen gelassen: die Streichung
    w.spiel!.zuletzt = {};
    const ev2 = oeffne(w, "erbe_verfall", new Rng(1))!;
    expect(ev2.daten).toMatchObject({ staette: "ani", lage: "streichung" });
    entscheide(w, ev2.id, "abwarten", new Rng(1));
    expect(z.staetten.ani!.lage).toBe("gestrichen");
    expect(verfallKandidaten(w).some((e) => e.id === "ani")).toBe(false);
  });

  test("Andere Stätten schließen; die Notsicherung hebt den Zustand sofort", () => {
    const w = welt();
    const z = reichZustand(w);
    for (const st of Object.values(z.staetten)) st.zustand = 80;
    z.staetten.philadelphia!.zustand = 20;
    const ev = oeffne(w, "erbe_verfall", new Rng(1))!;
    expect(ev.daten).toMatchObject({ staette: "philadelphia", lage: "schliessung" });
    const k = load(save(w));
    entscheide(k, ev.id, "notsicherung", new Rng(1));
    expect(reichZustand(k).staetten.philadelphia!.zustand).toBeCloseTo(20 + ERBE_DRUCK.notsicherung.zustand, 6);
    expect(reichZustand(k).staetten.philadelphia!.lage).toBeUndefined();
    entscheide(w, ev.id, "abwarten", new Rng(1));
    expect(z.staetten.philadelphia!.lage).toBe("geschlossen");
  });
});

describe("Antworten buchen, was die Plakette zeigt, und nennen ihre Stelle", () => {
  function faelle(): { w: World; id: string }[] {
    const a = vernachlaessigt();
    const b = vernachlaessigt();
    b.economy.credibility = 0.1;
    b.economy.policyRate = b.economy.inflation;
    const c = vernachlaessigt();
    c.economy.credibility = 0.8;
    c.published.inflation.value = 25;
    const d = welt();
    reichZustand(d).staetten.ani!.zustand = 30;
    // Eigener Samen: Der Vorschau-Zwischenspeicher kennt Ereignisse an Tag und Kennung, zwei gleiche Welten teilten sonst den Eintrag
    const e = welt(5);
    reichZustand(e).staetten.thyatira!.zustand = 15;
    return [{ w: a, id: "medien_kampagne" }, { w: b, id: "zentralbank_vertrauen" }, { w: c, id: "zentralbank_vertrauen" }, { w: d, id: "erbe_verfall" }, { w: e, id: "erbe_verfall" }];
  }

  test.each(faelle().map((f, i) => [i, f.id] as const))("Fall %i (%s)", (i) => {
    const { w, id } = faelle()[i]!;
    const ev = oeffne(w, id, new Rng(5))!;
    const a = ansicht(w, ev);
    expect(a.optionen.length).toBeGreaterThanOrEqual(2);
    expect(a.optionen.length).toBeLessThanOrEqual(4);
    expect(a.stelle).toBeDefined();
    for (const o of antworten(w, ev)) {
      expect(o.stelle, `${id}/${o.id} ohne Stelle`).toBeDefined();
      if (o.sperre) continue;
      const preis = preisVorschau(w, ev, o.id);
      const k = load(save(w));
      const k0 = k.spiel!.kapital;
      expect(entscheide(k, ev.id, o.id, new Rng(1)).ok).toBe(true);
      expect(Math.round((k0 - k.spiel!.kapital) * 10) / 10, `${id}/${o.id}`).toBeCloseTo(preis.kapital, 6);
      // Keine Schau: Jede Antwort ändert den Spielstand (außer dem Protokoll)
      expect(save(k), `${id}/${o.id}`).not.toBe(save(w));
    }
  });
});

describe("Determinismus und alte Spielstände", () => {
  test("gleicher Samen, gleicher Verlauf über 30 Monate ohne Eingriffe", () => {
    const lauf = () => {
      const w = createWorld(turkey2026, 11);
      startAfterElection(w, schnellProfil());
      for (let i = 0; i < 30; i++) advance(w, 30);
      return { chronik: w.spiel!.chronik.filter((c) => ["medien_kampagne", "zentralbank_vertrauen", "erbe_verfall"].includes(c.vorlage ?? "")).map((c) => `${c.tag}:${c.titel}`), stand: save(w) };
    };
    const a = lauf();
    const b = lauf();
    expect(a.chronik).toEqual(b.chronik);
    expect(a.stand).toBe(b.stand);
  }, 120_000);

  const datei = new URL("../../spielstand/staatsraeson_2039-02-02.json", import.meta.url);
  test.skipIf(!existsSync(datei))("Der Spielstand des Inhabers (2039) lädt, alle drei Bereiche gelten als vernachlässigt, und er läuft weiter", () => {
    const d = JSON.parse(readFileSync(datei, "utf8")) as { welt: unknown };
    const w = load(JSON.stringify(d.welt));
    expect(vorlage("medien_kampagne").chance(w)).toBeGreaterThan(0);
    expect(vorlage("zentralbank_vertrauen").chance(w)).toBeGreaterThan(0);
    // Die 16 Restaurierungen von 2036 warten ohne Fortschritt in der Baureihe: Sie schützen die Stätten nicht mehr
    expect(verfallKandidaten(w).map((e) => e.id)).toEqual(expect.arrayContaining(["thyatira", "philadelphia", "smyrna"]));
    const ev = oeffne(w, "erbe_verfall", new Rng(1))!;
    expect(antworten(w, ev).map((o) => o.id)).toContain("vorziehen");
    for (let i = 0; i < 3; i++) advance(w, 30);
    expect(Number.isFinite(w.spiel!.umfrage.zustimmung)).toBe(true);
  }, 120_000);
});
