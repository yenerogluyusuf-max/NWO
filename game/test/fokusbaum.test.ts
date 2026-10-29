// Fokusbaum: Daten angeschlossen (Netz, Gesetze, Wissensbaum, Länder), ein Fokus zur Zeit, Gegenwege schließen aus, Bestand hält,
// Gegenspieler reagieren nach der Richtung, Texte in drei Sprachen, ältere Spielstände.

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { ABBILDUNG, AESTE, AUSSEN, FOKI, FOKUS, FOKUS_VON, OEFFNET, astRaster } from "../src/data/fokusbaum";
import { GESETZESVORHABEN } from "../src/data/gesetzesvorhaben";
import { ZWEIG_VON } from "../src/data/wissensbaum";
import { LAENDER } from "../src/sim/laender";
import { beginneFokus, brichFokusAb, fokusFolgen, fokusMonat, fokusReaktion, fokusSicht, fokusTag, fokusUeberblick, fokusZustand, naechsterFokus } from "../src/sim/fokus";
import { gesetzesTisch } from "../src/sim/gesetzgebung";
import { forschungsTempo } from "../src/sim/wissensbaum-kern";
import { NET } from "../src/sim/modell";
import { nationalAverage, startAverage } from "../src/sim/netz";
import { katalogVon } from "../src/i18n";
import de from "../src/i18n/katalog/de/fokus.json";
import tr from "../src/i18n/katalog/tr/fokus.json";
import en from "../src/i18n/katalog/en/fokus.json";
import type { World } from "../src/sim/types";

function neu(seed = 7): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 120;
  return w;
}

/** Einen Fokus sofort vollenden (Vorgänger künstlich als fertig markieren). */
function vollende(w: World, id: string): void {
  const z = fokusZustand(w);
  for (const v of FOKUS_VON[id]!.voraus) if (!z.fertig.some((x) => x.id === v)) z.fertig.push({ id: v, tag: w.day });
  z.aktiv = { id, start: w.day - 1, ende: w.day, pk: 5 };
  fokusTag(w);
}

describe("Fokusbaum: Daten", () => {
  test("102 Foki, eindeutig, Vorgänger und Gegenwege bekannt", () => {
    expect(FOKI.length).toBeGreaterThanOrEqual(100);
    expect(new Set(FOKI.map((f) => f.id)).size).toBe(FOKI.length);
    for (const f of FOKI) {
      for (const v of f.voraus) expect(FOKUS_VON[v], `${f.id} → ${v}`).toBeDefined();
      for (const g of f.ausschluesse ?? []) expect(FOKUS_VON[g], `${f.id} × ${g}`).toBeDefined();
    }
  });

  test("Abbildung, Gesetze, Wissensknoten und Länder zeigen auf Vorhandenes", () => {
    for (const [k, ziele] of Object.entries(ABBILDUNG)) for (const [n] of ziele) expect(NET.index.has(n), `${k} → ${n}`).toBe(true);
    const gv = new Set(GESETZESVORHABEN.map((v) => v.id));
    for (const [id, o] of Object.entries(OEFFNET)) {
      expect(FOKUS_VON[id], id).toBeDefined();
      for (const g of o.gesetze ?? []) expect(gv.has(g), g).toBe(true);
      for (const k of o.wissen ?? []) expect(ZWEIG_VON[k], k).toBeDefined();
    }
    const laender = new Set(LAENDER.map((l) => l.id));
    for (const [id, m] of Object.entries(AUSSEN)) {
      expect(FOKUS_VON[id], id).toBeDefined();
      for (const l of Object.keys(m)) expect(laender.has(l), l).toBe(true);
    }
    // Jeder Fokus wirkt im Land (Netz, Außen, Vorbereitung oder Sofortwirkung)
    for (const f of FOKI) {
      const wirkt = fokusFolgen(f).length > 0 || !!AUSSEN[f.id] || !!OEFFNET[f.id] || !!f.wirkung.sofortKapital || !!f.wirkung.sofortVertrauen || !!f.wirkung.rabattThema || !!f.wirkung.achsenVerschiebung;
      expect(wirkt, f.id).toBe(true);
    }
    // Eingangsgrößen des Wirtschaftsmodells werden nie direkt verschoben
    const eingaenge = new Set(NET.nodes.filter((n) => n.input).map((n) => n.id));
    for (const f of FOKI) for (const x of fokusFolgen(f)) expect(eingaenge.has(x.knoten), `${f.id} → ${x.knoten}`).toBe(false);
  });

  test("Raster ohne Überlappung je Ast", () => {
    for (const a of AESTE) {
      const r = astRaster(a);
      const belegt = new Set(Object.values(r.plaetze).map((p) => `${p.zeile}/${p.spalte}`));
      expect(belegt.size).toBe(Object.keys(r.plaetze).length);
      for (const f of FOKI.filter((x) => x.ast === a)) for (const v of f.voraus) expect(r.plaetze[v]!.zeile).toBeLessThan(r.plaetze[f.id]!.zeile);
    }
  });

  test("Texte in drei Sprachen mit gleichen Schlüsseln und Platzhaltern", () => {
    const schluessel = Object.keys(de);
    expect(Object.keys(tr).sort()).toEqual([...schluessel].sort());
    expect(Object.keys(en).sort()).toEqual([...schluessel].sort());
    const ph = (s: string) => [...s.matchAll(/\{(\w+)/g)].map((m) => m[1]).sort().join(",");
    for (const k of schluessel) {
      expect(ph((tr as Record<string, string>)[k]!), k).toBe(ph((de as Record<string, string>)[k]!));
      expect(ph((en as Record<string, string>)[k]!), k).toBe(ph((de as Record<string, string>)[k]!));
    }
    for (const f of FOKI) for (const feld of ["titel", "unter", "text"]) expect(katalogVon("de")[`fokus.f.${f.id}.${feld}`], `${f.id}.${feld}`).toBeTruthy();
  });
});

describe("Fokusbaum: Spiel", () => {
  test("Wurzeln sind möglich, Kinder gesperrt mit Grund", () => {
    const w = neu();
    expect(fokusSicht(w, "fok_wirt_auftakt").status).toBe("moeglich");
    const kind = fokusSicht(w, "fok_wirt_orthodoxie");
    expect(kind.status).toBe("gesperrt");
    expect(kind.grund).toContain("Nationale Wirtschaftsstrategie");
  });

  test("Ein Fokus zur Zeit: Kapital, Laufzeit, Abschluss mit Bestand und Chronik", () => {
    const w = neu();
    const vorher = w.spiel!.kapital;
    const r = beginneFokus(w, "fok_wis_auftakt");
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBeLessThan(vorher);
    const zweit = fokusSicht(w, "fok_wirt_auftakt");
    expect(zweit.startbar).toBe(false);
    expect(zweit.grund).toContain("läuft schon");
    expect(beginneFokus(w, "fok_wirt_auftakt").ok).toBe(false);
    advance(w, FOKUS_VON["fok_wis_auftakt"]!.tage + 2);
    const z = fokusZustand(w);
    expect(z.aktiv).toBeNull();
    expect(z.fertig.map((x) => x.id)).toContain("fok_wis_auftakt");
    expect(Object.keys(z.bestand).length).toBeGreaterThan(0);
    expect(w.spiel!.chronik.some((c) => c.titel.includes("Nationale Innovationsinitiative"))).toBe(true);
    expect(fokusUeberblick(w).stempel?.id).toBe("fok_wis_auftakt");
    // Forschung im ganzen Baum etwas schneller
    expect(w.spiel!.modifikatoren?.["fokus:forschung"] ?? 0).toBeGreaterThan(0);
  });

  test("Abbrechen gibt ein Viertel zurück", () => {
    const w = neu();
    beginneFokus(w, "fok_wirt_auftakt");
    const k = w.spiel!.kapital;
    const pk = fokusZustand(w).aktiv!.pk;
    expect(brichFokusAb(w).ok).toBe(true);
    expect(w.spiel!.kapital).toBe(k + Math.floor(pk * FOKUS.abbruchErstattung));
    expect(fokusZustand(w).aktiv).toBeNull();
  });

  test("Gegenwege schließen sich aus", () => {
    const w = neu();
    vollende(w, "fok_wirt_orthodoxie");
    const gegen = fokusSicht(w, "fok_wirt_niedrigzins");
    expect(gegen.status).toBe("ausgeschlossen");
    expect(gegen.durch).toBe("fok_wirt_orthodoxie");
    // auch die Folgeäste des Gegenwegs bleiben zu (Vorgänger fehlt)
    expect(fokusSicht(w, "fok_wirt_verstaatlichung").status).not.toBe("moeglich");
    vollende(w, "fok_sich_nato");
    expect(fokusSicht(w, "fok_sich_eurasien").status).toBe("ausgeschlossen");
  });

  test("Der Bestand hält über Jahre gegen den Rücklauf", () => {
    // Gleiche Welt zweimal: einmal mit gehaltenem Bestand, einmal ohne; der Unterschied nach drei Jahren ist der Bestand
    const lauf = (halten: boolean): { knoten: string; wert: number; abw: number } => {
      const w = neu();
      vollende(w, "fok_ges_versoehnung");
      const z = fokusZustand(w);
      const [knoten, wert] = Object.entries(z.bestand).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]!;
      if (!halten) z.bestand = {};
      advance(w, 3 * 365);
      return { knoten, wert, abw: nationalAverage(NET, w.net, knoten) - startAverage(NET, w.net, knoten) };
    };
    const mit = lauf(true);
    const ohne = lauf(false);
    const d = mit.abw - ohne.abw;
    expect(Math.sign(d)).toBe(Math.sign(mit.wert));
    expect(Math.abs(d)).toBeGreaterThan(Math.abs(mit.wert) * 0.5);
    expect(() => fokusMonat(neu())).not.toThrow();
  });

  test("Gegenspieler: Gruppen und Partner nach der Richtung", () => {
    const w = neu();
    const r1 = fokusReaktion(w, FOKUS_VON["fok_ges_religioes"]!);
    const r2 = fokusReaktion(w, FOKUS_VON["fok_ges_laizismus"]!);
    const kons = (r: typeof r1) => r.gruppen.find((g) => g.id === "konservative")?.delta ?? 0;
    expect(kons(r1)).toBeGreaterThan(0);
    expect(kons(r2)).toBeLessThan(0);
    const sak = (r: typeof r1) => r.gruppen.find((g) => g.id === "staedtische_saekulare")?.delta ?? 0;
    expect(sak(r2)).toBeGreaterThan(sak(r1));
  });

  test("Vorbereitete Gesetze: mehr Stimmen und oben auf dem Tisch", () => {
    const w = neu();
    const vorher = gesetzesTisch(w).find((s) => s.def.id === "gv_gewaltschutz")!;
    vollende(w, "fok_ges_frauenrechte");
    const nachher = gesetzesTisch(w).find((s) => s.def.id === "gv_gewaltschutz")!;
    expect(nachher.fassungen.kompromiss.stimmenBonus - vorher.fassungen.kompromiss.stimmenBonus).toBe(FOKUS.gesetzStimmen);
    expect(nachher.anlass).toBe("fokus");
    expect(nachher.rang).toBeGreaterThan(vorher.rang);
  });

  test("Getragene Wissensknoten forschen schneller", () => {
    const w = neu();
    const vorher = forschungsTempo(w, "mil_stahlkuppel");
    vollende(w, "fok_sich_celik_kubbe");
    expect(forschungsTempo(w, "mil_stahlkuppel")).toBeCloseTo(vorher * FOKUS.wissenTempo, 5);
  });

  test("Außenwirkung beim Abschluss", () => {
    const w = neu();
    const vorher = JSON.stringify(w.spiel!.welt);
    vollende(w, "fok_sich_eurasien");
    expect(JSON.stringify(w.spiel!.welt)).not.toBe(vorher);
  });

  test("Bot findet einen Fokus und spielt ihn durch", () => {
    const w = neu();
    let n = 0;
    for (let i = 0; i < 24; i++) {
      const s = naechsterFokus(w);
      if (s && beginneFokus(w, s.def.id).ok) n++;
      advance(w, 30);
    }
    expect(n).toBeGreaterThanOrEqual(3);
    expect(fokusZustand(w).fertig.length).toBeGreaterThanOrEqual(3);
  });

  test("Ältere Spielstände: ohne Feld lesbar, beim ersten Zugriff angelegt, Stand bleibt beim Laden", () => {
    const w = neu();
    delete w.spiel!.fokus;
    expect(fokusSicht(w, "fok_wirt_auftakt").status).toBe("moeglich");
    expect(fokusUeberblick(w).fertig).toBe(0);
    expect(w.spiel!.fokus).toBeUndefined();
    beginneFokus(w, "fok_wirt_auftakt");
    expect(fokusZustand(w).aktiv?.id).toBe("fok_wirt_auftakt");
    const w2 = load(save(w));
    expect(w2.spiel!.fokus?.aktiv?.id).toBe("fok_wirt_auftakt");
    const alt = load(save(w));
    (alt.spiel as unknown as { fokus: unknown }).fokus = { aktiv: null };
    expect(fokusZustand(alt).fertig).toEqual([]);
    expect(fokusZustand(alt).bestand).toEqual({});
  });
});
