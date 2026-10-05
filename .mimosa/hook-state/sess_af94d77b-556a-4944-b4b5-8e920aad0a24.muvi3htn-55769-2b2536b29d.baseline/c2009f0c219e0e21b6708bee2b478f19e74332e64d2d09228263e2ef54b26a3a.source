// Der Zukunftskatalog und das Technologie-Feld: Konsistenz (Kosten, Voraussetzungen, Ketten, keine Zyklen), das Unrealistische ist teuer und lang,
// ungewisse Durchbrüche und Kostenüberschreitungen fallen deterministisch, Wirkungen während des Baus, Zuordnung der freien Eingabe zum Katalog.

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { PROVINCES, nationalAverage } from "../src/sim/netz";
import { LAENDER, dimensionZu, landAendern } from "../src/sim/laender";
import { VORHABEN } from "../src/data/reich";
import { TECH_ALLE } from "../src/data/reich/technologie";
import { ZUKUNFT_ALLE } from "../src/data/reich/zukunft";
import { REGIONAL_VORLAGEN } from "../src/data/reich/regional";
import { KATALOG_ZIELE, katalogFuerEingabe } from "../src/data/reich/katalog";
import { FELDER, THEMEN, type Vorhaben } from "../src/sim/reich-typen";
import { beginne, pausiere, reichZustand, vorhabenDef, vorhabenListe } from "../src/sim/reich";
import { Neues } from "../src/ui/reich/Neues";

const NEU: Vorhaben[] = [...ZUKUNFT_ALLE, ...TECH_ALLE];
const ALLE_NEU = [...NEU, ...REGIONAL_VORLAGEN];
const ID = new Map(VORHABEN.map((v) => [v.id, v]));

function welt(seed = 4) {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 150;
  return w;
}

/** Erfüllt die Voraussetzungen eines Vorhabens künstlich (Test), damit sich das Verhalten im Bau prüfen lässt. */
function erfuelle(w: ReturnType<typeof welt>, v: Vorhaben) {
  const z = reichZustand(w);
  for (const x of v.voraus) {
    if (x.art === "bestand") z.bestand[x.id] = { seit: "Test", zustand: 90 };
    else if (x.art === "knoten" || x.art === "massnahme") {
      const i = NET.index.get(x.id)!;
      for (let p = 0; p < PROVINCES; p++) w.net.values[i * PROVINCES + p] = Math.max(w.net.values[i * PROVINCES + p]!, (x.min ?? 0) + 3);
    } else if (x.art === "land") landAendern(w, x.land, { [x.dim]: 45 });
  }
}

/** Alle laufenden Bauten ruhen: Der Test misst nur das eine Vorhaben bei voller Baukapazität. */
function freieBahn(w: ReturnType<typeof welt>) {
  for (const l of reichZustand(w).laufend) pausiere(w, l.id, true);
}

describe("Katalog: Konsistenz", () => {
  test("Es sind deutlich mehr Großvorhaben, alle mit eindeutiger Kennung und echtem Preis", () => {
    expect(NEU.length).toBeGreaterThanOrEqual(55);
    expect(new Set(VORHABEN.map((v) => v.id)).size).toBe(VORHABEN.length);
    for (const v of ALLE_NEU) {
      expect(v.kosten.pk, v.id).toBeGreaterThan(0);
      expect(v.kosten.bau, v.id).toBeGreaterThan(0);
      expect(v.kosten.monate, v.id).toBeGreaterThan(0);
      if (v.kosten.bau >= 500) {
        expect(v.kosten.verwaltung ?? 0, `${v.id}: Verwaltungskraft`).toBeGreaterThan(0);
        expect(v.kosten.schulden ?? 0, `${v.id}: Schulden`).toBeGreaterThan(0);
      }
      expect(v.verlierer, `${v.id}: ohne Verlierer`).toBeTruthy();
      expect(v.kehrseite.length, v.id).toBeGreaterThan(50);
      expect(v.text.length, v.id).toBeGreaterThan(60);
    }
  });

  test("Jede Zahl ist ein Spielparameter mit Maßstab: Der Katalog nennt Analogien, keine erfundene Genauigkeit", () => {
    for (const v of NEU) expect(v.anker ?? "", `${v.id}: Maßstab fehlt`).toMatch(/Spielparameter/);
    for (const v of NEU) expect(v.anker ?? "", v.id).not.toMatch(/\d{1,3}(\.\d{3})+ Prozent|exakt/);
  });

  test("Voraussetzungen sind erreichbar: bekannte Vorhaben, Größen im Netz, Länder, keine Mindestwerte über dem Möglichen", () => {
    const LAND = new Set(LAENDER.map((l) => l.id));
    for (const v of ALLE_NEU) {
      for (const x of v.voraus) {
        if (x.art === "bestand") {
          const ziel = ID.get(x.id);
          expect(ziel, `${v.id}: Vorhaben ${x.id}`).toBeDefined();
          expect(ziel!.pflegt, `${v.id}: Ziel ist eine Pflege`).toBeUndefined();
          expect(ziel!.vorlage, `${v.id}: Ziel ist eine Vorlage`).toBeUndefined();
          expect(ziel!.klasse === "restaurierung" && !ziel!.start, `${v.id}: Ziel wird nie Bestand`).toBe(false);
        } else if (x.art === "knoten" || x.art === "massnahme") {
          const node = NET.nodes[NET.index.get(x.id) ?? -1];
          expect(node, `${v.id}: Knoten ${x.id}`).toBeDefined();
          if (x.art === "massnahme") expect(node!.kind, `${v.id}: ${x.id}`).toBe("massnahme");
          if (x.min !== undefined) expect(x.min, `${v.id}: ${x.id} min`).toBeLessThanOrEqual(90);
          if (x.max !== undefined) expect(x.max, `${v.id}: ${x.id} max`).toBeGreaterThanOrEqual(10);
        } else if (x.art === "land") {
          expect(LAND.has(x.land), `${v.id}: Land ${x.land}`).toBe(true);
          if (x.min !== undefined) expect(x.min).toBeLessThanOrEqual(90);
        }
      }
    }
  });

  test("Keine Zyklen: Jede Kette lässt sich der Reihe nach bauen", () => {
    const farbe = new Map<string, 0 | 1 | 2>();
    const besuche = (id: string, pfad: string[]) => {
      if (farbe.get(id) === 2) return;
      expect(farbe.get(id), `Zyklus: ${[...pfad, id].join(" → ")}`).not.toBe(1);
      farbe.set(id, 1);
      for (const x of ID.get(id)?.voraus ?? []) if (x.art === "bestand") besuche(x.id, [...pfad, id]);
      farbe.set(id, 2);
    };
    for (const v of VORHABEN) besuche(v.id, []);
  });

  test("Stufen passen zu den Ketten: Wer ein Glied des Themas verlangt, steht höher; höhere Stufen verlangen etwas Fertiges", () => {
    for (const v of NEU) {
      const deps = v.voraus.filter((x) => x.art === "bestand").map((x) => ID.get((x as { id: string }).id)!);
      for (const d of deps) if (d.thema === v.thema && d.stufe !== undefined) expect(v.stufe!, `${v.id} nach ${d.id}`).toBeGreaterThan(d.stufe);
      if ((v.stufe ?? 1) >= 2) expect(deps.length, `${v.id}: Stufe ${v.stufe} ohne Vorstufe`).toBeGreaterThan(0);
      expect(THEMEN.some((t) => t.id === v.thema), `${v.id}: Thema`).toBe(true);
    }
  });

  test("Das Unrealistische ist möglich, aber extrem teuer: Jahrzehnte, riesige Schulden, Vorstufen, Überschreitung, Ansehen als Gegenwert", () => {
    const utopien = NEU.filter((v) => v.unrealistisch);
    expect(utopien.length).toBeGreaterThanOrEqual(12);
    for (const id of ["raum_mars", "raum_aufzug", "stadt_unterwasser", "energie_fusion_kraftwerk", "raum_mondbasis", "ki_agi"]) expect(utopien.map((v) => v.id)).toContain(id);
    for (const v of utopien) {
      expect(v.kosten.bau, `${v.id}: Baupunkte`).toBeGreaterThanOrEqual(9000);
      expect(v.kosten.monate, `${v.id}: Dauer (Monate)`).toBeGreaterThanOrEqual(150);
      expect(v.kosten.schulden ?? 0, `${v.id}: Schulden`).toBeGreaterThanOrEqual(5);
      expect(v.kosten.pk, `${v.id}: Kapital`).toBeGreaterThanOrEqual(30);
      expect(v.ueberzug?.p ?? 0, `${v.id}: Überschreitung`).toBeGreaterThanOrEqual(0.8);
      expect(v.voraus.length, `${v.id}: Voraussetzungen`).toBeGreaterThanOrEqual(3);
      expect(v.bauwirkung?.length ?? 0, `${v.id}: Wirkung im Bau`).toBeGreaterThan(0);
      const ansehen = [...v.abschluss, ...(v.dauer ?? [])].some((e) => e.t === "knoten" && e.id === "ansehen" && e.d > 0);
      expect(ansehen, `${v.id}: Ansehen als Gegenwert`).toBe(true);
    }
    // nichts davon ist gleich am Anfang beginnbar
    const w = welt();
    for (const v of utopien) expect(beginne(w, v.id).ok, v.id).toBe(false);
  });

  test("Technologie: gültige Felder, lange Laufzeit, ungewisse Durchbrüche und Mehrkosten bei den großen Vorhaben", () => {
    expect(TECH_ALLE.length).toBeGreaterThanOrEqual(23);
    const felder = new Set(FELDER.map((f) => f.id));
    for (const v of TECH_ALLE) {
      expect(v.thema).toBe("technologie");
      expect(felder.has(v.feld ?? ""), `${v.id}: Feld`).toBe(true);
      expect(v.konkurrenz ?? "", `${v.id}: Konkurrenz und Spionage`).toMatch(/\w/);
      if (v.kosten.bau >= 2000) expect(v.scheitern || v.ueberzug, `${v.id}: Ungewissheit`).toBeTruthy();
    }
    for (const f of FELDER) expect(TECH_ALLE.some((v) => v.feld === f.id), f.id).toBe(true);
    // jede Kette beginnt bei der Forschung oder beim Aufbau und führt zu Anlagen
    for (const f of FELDER) expect(Math.min(...TECH_ALLE.filter((v) => v.feld === f.id).map((v) => v.stufe ?? 99)), `${f.id}: Einstieg`).toBe(1);
    expect(TECH_ALLE.filter((v) => v.klasse === "forschung").length).toBeGreaterThanOrEqual(2);
  });

  test("Themen: Raumfahrt, KI und Verkehr sind Ketten mit mehreren Stufen", () => {
    for (const [thema, stufen] of [["raumfahrt", 8], ["ki", 5], ["verkehr", 3], ["energie", 3]] as const) {
      const hoechste = Math.max(...NEU.filter((v) => v.thema === thema).map((v) => v.stufe ?? 0));
      expect(hoechste, thema).toBeGreaterThanOrEqual(stufen);
    }
    expect(NEU.filter((v) => v.thema === "raumfahrt").length).toBeGreaterThanOrEqual(9);
    expect(NEU.filter((v) => v.thema === "ki").length).toBeGreaterThanOrEqual(8);
  });
});

describe("Katalog: Verhalten im Spiel", () => {
  test("Das Transitabkommen ist von Anfang an möglich, wirkt auf die Nachbarn und öffnet die nächste Stufe", () => {
    const w = welt();
    const vorherKaz = dimensionZu(w, "KAZ", "vertrauen");
    const vorherChn = dimensionZu(w, "CHN", "handel");
    expect(beginne(w, "welt_korridor_terminals").ok).toBe(false);
    const r = beginne(w, "welt_korridor_abkommen");
    expect(r.ok, r.text).toBe(true);
    freieBahn(w);
    pausiere(w, "welt_korridor_abkommen", false);
    advance(w, 30 * 14);
    expect(reichZustand(w).bestand.welt_korridor_abkommen).toBeDefined();
    expect(dimensionZu(w, "KAZ", "vertrauen")).toBeGreaterThan(vorherKaz + 2);
    expect(dimensionZu(w, "CHN", "handel")).toBeGreaterThan(vorherChn + 1);
    expect(beginne(w, "welt_korridor_terminals").ok).toBe(true);
  });

  test("Während des Baus wirken Aufträge, und die Schulden steigen mit dem Bau", () => {
    const a = welt(7);
    const b = welt(7);
    freieBahn(a);
    freieBahn(b);
    expect(beginne(a, "welt_megahafen", "stammfirma").ok).toBe(true);
    advance(a, 30 * 18);
    advance(b, 30 * 18);
    expect(nationalAverage(NET, a.net, "bauwirtschaft")).toBeGreaterThan(nationalAverage(NET, b.net, "bauwirtschaft") + 0.3);
    expect(a.economy.debtRatio).toBeGreaterThan(b.economy.debtRatio + 0.1);
  });

  test("Kostenüberschreitung: deterministisch aus Spielstand und Vorhaben, mit Mehrkosten und Verzögerung", () => {
    const ergebnisse: { bau: number; monate: number; n: number }[] = [];
    for (let seed = 1; seed <= 14; seed++) {
      const w = welt(seed);
      freieBahn(w);
      expect(beginne(w, "welt_megahafen", "stammfirma").ok).toBe(true);
      advance(w, 30 * 34);
      const l = reichZustand(w).laufend.find((x) => x.id === "welt_megahafen")!;
      ergebnisse.push({ bau: l.bau!, monate: l.monate!, n: l.ueberzugN ?? 0 });
    }
    expect(ergebnisse.every((e) => e.n === 1)).toBe(true);
    const mehr = ergebnisse.filter((e) => e.bau > Math.round(4200 * 0.8));
    expect(mehr.length).toBeGreaterThan(0);
    expect(mehr.length).toBeLessThan(ergebnisse.length);
    for (const e of mehr) expect(e.monate).toBeGreaterThan(Math.round(72 * 0.8));
    // gleicher Spielstand, gleiches Ergebnis
    const x = welt(5);
    const y = welt(5);
    for (const w of [x, y]) {
      freieBahn(w);
      beginne(w, "welt_megahafen", "stammfirma");
      advance(w, 30 * 34);
    }
    const lx = reichZustand(x).laufend.find((l) => l.id === "welt_megahafen")!;
    const ly = reichZustand(y).laufend.find((l) => l.id === "welt_megahafen")!;
    expect([lx.bau, lx.monate, lx.ueberzugN]).toEqual([ly.bau, ly.monate, ly.ueberzugN]);
  });

  test("Ungewisser Durchbruch: Manche Triebwerksprogramme scheitern, manche gelingen, und der Ausgang steht mit dem Spielstand fest", { timeout: 120000 }, () => {
    const aus: ("gescheitert" | "gelungen" | "laeuft")[] = [];
    const v = vorhabenDef("luft_triebwerke")!;
    for (let seed = 1; seed <= 24; seed++) {
      const w = welt(seed);
      freieBahn(w);
      erfuelle(w, v);
      w.economy.debtRatio = 20;
      const r = beginne(w, "luft_triebwerke", "stammfirma");
      expect(r.ok, r.text).toBe(true);
      advance(w, 30 * 44);
      const z = reichZustand(w);
      const gescheitert = z.meldungen.some((m) => m.art === "gescheitert" && m.text.includes("Triebwerk"));
      aus.push(gescheitert ? "gescheitert" : z.bestand.luft_triebwerke ? "gelungen" : "laeuft");
      if (gescheitert) {
        expect(z.laufend.some((l) => l.id === "luft_triebwerke")).toBe(false);
        expect(z.bestand.luft_triebwerke).toBeUndefined();
        expect(w.spiel!.chronik.some((c) => c.titel === v.name && c.ausgang.startsWith("Gescheitert"))).toBe(true);
      }
    }
    expect(aus).toContain("gescheitert");
    expect(aus.filter((a) => a !== "gescheitert").length).toBeGreaterThan(0);
    const w2 = welt(3);
    const w3 = welt(3);
    for (const w of [w2, w3]) {
      freieBahn(w);
      erfuelle(w, v);
      beginne(w, "luft_triebwerke", "stammfirma");
      advance(w, 30 * 44);
    }
    expect(JSON.stringify(reichZustand(w2).meldungen.map((m) => m.art))).toBe(JSON.stringify(reichZustand(w3).meldungen.map((m) => m.art)));
  });

  test("Wer es nach dem Scheitern noch einmal versucht, beginnt bei null", { timeout: 120000 }, () => {
    const v = vorhabenDef("luft_triebwerke")!;
    for (let seed = 1; seed <= 30; seed++) {
      const w = welt(seed);
      freieBahn(w);
      erfuelle(w, v);
      beginne(w, "luft_triebwerke", "stammfirma");
      advance(w, 30 * 44);
      const z = reichZustand(w);
      if (!z.meldungen.some((m) => m.art === "gescheitert")) continue;
      w.spiel!.kapital = 150;
      z.verwaltung = 90;
      erfuelle(w, v);
      const neu = beginne(w, "luft_triebwerke", "stammfirma");
      expect(neu.ok, neu.text).toBe(true);
      expect(z.laufend.find((l) => l.id === "luft_triebwerke")!.fortschritt).toBe(0);
      return;
    }
    throw new Error("Kein Scheitern in 30 Spielständen");
  });

  test("Die Vorschau warnt vor Mehrkosten und ungewissem Durchbruch", async () => {
    const { wirkungsVorschau } = await import("../src/sim/reich");
    const w = welt();
    expect(wirkungsVorschau(w, "luft_triebwerke")!.risiko).toMatch(/Durchbruch ist ungewiss/);
    expect(wirkungsVorschau(w, "raum_mars")!.risiko).toMatch(/Wahrscheinlichkeit/);
    expect(wirkungsVorschau(w, "raum_mars")!.waehrendBau.length).toBeGreaterThan(0);
    expect(wirkungsVorschau(w, "welt_korridor_abkommen")!.risiko).toBeUndefined();
  });
});

describe("Katalog: Zuordnung der freien Eingabe", () => {
  test.each([
    ["Autobahn bis China", "welt_autobahn_china"],
    ["Baue eine Hochgeschwindigkeitsbahn bis nach China", "welt_hsr_china"],
    ["Marsmission", "raum_mars"],
    ["Wir bauen einen Weltraumaufzug", "raum_aufzug"],
    ["Eine Mondbasis!", "raum_mondbasis"],
    ["Landung auf dem Mond", "raum_mondsonde"],
    ["Schickt einen Astronauten ins All", "raum_orbit_bemannt"],
    ["Ein eigener Weltraumbahnhof", "raum_bahnhof"],
    ["Eigene Trägerrakete", "raum_traeger"],
    ["Unterwasserstadt im Marmarameer", "stadt_unterwasser"],
    ["Neue Hauptstadt in Zentralanatolien", "stadt_hauptstadt_neu"],
    ["Fusionskraftwerk", "energie_fusion_kraftwerk"],
    ["Ein eigenes Sprachmodell", "ki_sprachmodell"],
    ["Chipfabrik bauen", "ki_chipfab"],
    ["Eine Brücke nach Zypern", "welt_bruecke_zypern"],
    ["Magnetschwebebahn von Istanbul nach Ankara", "welt_maglev"],
    ["Offshore Windpark im Meer", "meer_offshore_wind"],
    ["Nationale U-Boote", "meer_uboote"],
    ["Gentherapie für alle", "bio_gentherapie"],
    ["Quantencomputer", "quanten_computer"],
    ["Wasserstoff Elektrolyse", "h2_elektrolyse"],
  ])("„%s“ → %s", (text, id) => {
    const t = katalogFuerEingabe(text);
    expect(t?.id, text).toBe(id);
    expect(vorhabenDef(id), id).toBeDefined();
  });

  test("Programme für Regionen werden als Vorlage gemeldet; Unsinn und Fremdes bleiben unzugeordnet", () => {
    expect(katalogFuerEingabe("Baue Schulen in Hatay")).toMatchObject({ id: "reg_schulbau", vorlage: true });
    expect(katalogFuerEingabe("Wohnungsbau in Van")).toMatchObject({ id: "reg_wohnungsbau", vorlage: true });
    expect(katalogFuerEingabe("Erhöhe den Mindestlohn")).toBeNull();
    expect(katalogFuerEingabe("")).toBeNull();
    expect(katalogFuerEingabe("Baue ein Schloss")).toBeNull();
  });

  test("Jede Regel zeigt auf ein Vorhaben, das es gibt", () => {
    for (const id of KATALOG_ZIELE) expect(ID.get(id), id).toBeDefined();
  });
});

describe("Katalog: Oberfläche", () => {
  test("Neue Vorhaben sind nach Thema gegliedert, mit Ketten, Technologiefeldern und dem Unrealistischen", () => {
    const w = welt();
    const liste = vorhabenListe(w, "infrastruktur");
    const offen = liste.filter((s) => s.status !== "fertig" && s.status !== "im_bau" && s.status !== "pausiert" && (s.v.klasse !== "restaurierung" || !!s.v.vorlage));
    const h = renderToStaticMarkup(createElement(Neues, { world: w, liste: offen, alle: liste, onBeginne: () => {}, ergebnisse: {}, refresh: () => {} }));
    for (const t of ["Programme für Regionen", "Verkehr und Welt", "Energie und Wasser", "Städte", "Raumfahrt", "Künstliche Intelligenz", "Technologie", "Unrealistisch, aber möglich", "Meerestechnologie", "Biotechnologie", "Autobahn bis China", "Marsmission"]) {
      expect(h, t).toContain(t);
    }
    expect(h).toContain("Weg der Stufen");
    expect(h).toContain("Stufe 3");
    expect(h).not.toContain("NaN");
    expect(h).not.toContain("Instandsetzung:");
  });
});
