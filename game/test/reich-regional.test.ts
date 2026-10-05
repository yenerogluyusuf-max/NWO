// Projekte in einzelnen Regionen: Dieselbe Vorlage lässt sich für eine Provinz, eine Region oder das ganze Land anlegen. Kosten, Dauer und Baukapazität
// wachsen mit dem Umfang (derselbe `umfangFaktor` wie in der Politik), die Wirkung gilt nur in den gewählten Provinzen, mehrere Projekte sind
// unterscheidbar, und dasselbe Vorhaben am selben Ort gibt es nur einmal.

import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { ERBE } from "../src/data/erbe";
import { PROVINZEN } from "../src/sim/regional";
import { umfangFaktor } from "../src/sim/handeln";
import { ALLE_PROVINZEN, beginneRegional, groessenWert, kartenOrte, pausiere, pflegeIdFuer, pflegeStand, regionalPlan, regionalVorschau, reichZustand, vorhabenDef, vorhabenListe } from "../src/sim/reich";
import { VorlageKarte } from "../src/ui/reich/Regional";
import { Neues } from "../src/ui/reich/Neues";
import { REGIONAL_VORLAGEN } from "../src/data/reich/regional";

function welt(seed = 4) {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 150;
  return w;
}
const freieBahn = (w: ReturnType<typeof welt>) => reichZustand(w).laufend.forEach((l) => pausiere(w, l.id, true));
const MARMARA = PROVINZEN.filter((p) => p.region === "Marmara").map((p) => p.plaka);

describe("Umfang bestimmt den Preis", () => {
  test("Das ganze Land kostet mehr als eine Region, eine Region mehr als eine Provinz: Kapital, Baupunkte, Dauer, Verwaltung, Schulden", () => {
    const w = welt();
    const hatay = regionalVorschau(w, "reg_wohnungsbau", [31]);
    const marmara = regionalVorschau(w, "reg_wohnungsbau", MARMARA);
    const land = regionalVorschau(w, "reg_wohnungsbau", null);
    if (!hatay.ok || !marmara.ok || !land.ok) throw new Error("Vorschau fehlt");
    for (const f of ["pk", "bau", "monate", "verwaltung", "schulden"] as const) {
      expect(land.def.kosten[f]!, f).toBeGreaterThan(marmara.def.kosten[f]!);
      expect(marmara.def.kosten[f]!, f).toBeGreaterThan(hatay.def.kosten[f]!);
    }
    // das ganze Land kostet genau so viel wie die Vorlage
    expect(land.def.kosten.pk).toBe(14);
    expect(land.def.kosten.bau).toBe(7200);
    expect(land.def.kosten.monate).toBe(60);
  });

  test("Das Kapital folgt derselben Rechnung wie die Politik (`umfangFaktor` nach Bevölkerungsanteil)", () => {
    const w = welt();
    for (const ort of [[31], [34, 6, 35], MARMARA]) {
      const v = regionalVorschau(w, "reg_wohnungsbau", ort);
      if (!v.ok) throw new Error("Vorschau fehlt");
      const anteil = ort.reduce((s, p) => s + w.net.weights[p - 1]!, 0);
      expect(v.faktoren.pk).toBeCloseTo(umfangFaktor(anteil), 10);
      expect(v.def.kosten.pk).toBeCloseTo(Math.round(14 * umfangFaktor(anteil) * 10) / 10, 5);
    }
  });

  test("Das Preisschild nennt den Umfang: Bevölkerungsanteil und Faktoren", () => {
    const w = welt();
    const v = regionalVorschau(w, "reg_wohnungsbau", [31]);
    if (!v.ok) throw new Error("Vorschau fehlt");
    expect(v.preisschild).toMatch(/betrifft (unter 1|\d+) Prozent der Bevölkerung · Kapital ×[\d,]+ · Baupunkte ×[\d,]+ · Dauer ×[\d,]+/);
    expect(v.vorschau.sofort.length).toBeGreaterThan(0);
    // die Ausgangslage steht an der Wirkung, und zwar die der gewählten Provinz
    const z = v.vorschau.sofort.find((x) => x.text.startsWith("Wohnungsbau"))!;
    expect(z.heute).toBe(Math.round(groessenWert(w, "wohnungsbau", [31])));
  });

  test("Auch kleinste Vorhaben haben einen Sockel, und mehr Provinzen kosten nie weniger", () => {
    const w = welt();
    const klein = regionalPlan(w, "reg_wohnungsbau", [31]);
    if (!klein.ok) throw new Error("Plan fehlt");
    expect(klein.def.kosten.bau).toBeGreaterThanOrEqual(40);
    expect(klein.def.kosten.monate).toBeGreaterThanOrEqual(3);
    let letzte = 0;
    for (let n = 1; n <= 12; n++) {
      const p = regionalPlan(w, "reg_wohnungsbau", ALLE_PROVINZEN.slice(0, n));
      if (!p.ok) throw new Error("Plan fehlt");
      expect(p.def.kosten.pk).toBeGreaterThanOrEqual(letzte);
      letzte = p.def.kosten.pk;
    }
  });
});

describe("Wirkung nur in den gewählten Provinzen", () => {
  test("Jede Wirkung auf Größen gilt nur dort; Bauwirkung ebenfalls", () => {
    const w = welt();
    const plan = regionalPlan(w, "reg_wasser", [31, 1]);
    if (!plan.ok) throw new Error("Plan fehlt");
    for (const e of [...plan.def.abschluss, ...(plan.def.dauer ?? []), ...(plan.def.bauwirkung ?? [])]) {
      if (e.t === "knoten") expect(e.provinzen, e.id).toEqual([1, 31]);
    }
    expect(plan.def.provinzen).toEqual([1, 31]);
    expect(plan.def.instanzVon).toBe("reg_wasser");
  });

  test("Nach der Fertigstellung ist die Größe dort besser als im Vergleichslauf, anderswo nicht", { timeout: 60000 }, () => {
    const a = welt(9);
    const b = welt(9);
    freieBahn(a);
    freieBahn(b);
    const r = beginneRegional(a, "reg_wohnungsbau", [31]);
    expect(r.ok, r.text).toBe(true);
    advance(a, 30 * 40);
    advance(b, 30 * 40);
    expect(reichZustand(a).bestand["reg_wohnungsbau@p31"]).toBeDefined();
    expect(groessenWert(a, "wohnungsbau", [31]) - groessenWert(b, "wohnungsbau", [31])).toBeGreaterThan(1);
    expect(Math.abs(groessenWert(a, "wohnungsbau", [22]) - groessenWert(b, "wohnungsbau", [22]))).toBeLessThan(0.3);
    // der Vorher-Nachher-Eintrag gehört zu diesem Ort
    const e = reichZustand(a).verlauf!.find((x) => x.id === "reg_wohnungsbau@p31")!;
    expect(e).toBeDefined();
    expect(e.vorher.wohnungsbau).toBeDefined();
    // und das fertige Stück lässt sich instand setzen
    const pid = pflegeIdFuer("reg_wohnungsbau@p31");
    expect(pid, "Instandsetzung").toBeDefined();
    expect(vorhabenDef(pid!)?.name).toMatch(/^Instandsetzung: Wohnungsbauprogramm: Hatay/);
    expect(pflegeStand(a, "reg_wohnungsbau@p31")).not.toBeNull();
  });
});

describe("Mehrere Projekte, keine Dubletten", () => {
  test("Dasselbe Programm am selben Ort gibt es nur einmal; Überschneidungen werden benannt", () => {
    const w = welt();
    expect(beginneRegional(w, "reg_wohnungsbau", [31]).ok).toBe(true);
    const doppelt = beginneRegional(w, "reg_wohnungsbau", [31]);
    expect(doppelt.ok).toBe(false);
    expect(doppelt.text).toMatch(/Dasselbe Programm gibt es dort schon/);
    const ueberschneidung = beginneRegional(w, "reg_wohnungsbau", [1, 31, 33]);
    expect(ueberschneidung.ok).toBe(false);
    expect(ueberschneidung.text).toContain("Hatay");
    // die Vorschau warnt schon vor dem Anlegen
    const v = regionalVorschau(w, "reg_wohnungsbau", [31]);
    expect(v.ok && v.konflikt).toBeTruthy();
    // genau ein Eintrag, keine zweite Baustelle
    expect(reichZustand(w).laufend.filter((l) => l.id.startsWith("reg_wohnungsbau@"))).toHaveLength(1);
    expect(Object.keys(reichZustand(w).regional!)).toHaveLength(1);
  });

  test("Gleichzeitige Projekte in verschiedenen Regionen sind in „Im Bau“ und in der Baureihenfolge unterscheidbar (Name und Ort)", () => {
    const w = welt();
    expect(beginneRegional(w, "reg_wohnungsbau", [31]).ok).toBe(true);
    expect(beginneRegional(w, "reg_wohnungsbau", [22]).ok).toBe(true);
    expect(beginneRegional(w, "reg_schulbau", [31]).ok).toBe(true);
    const namen = reichZustand(w).laufend.filter((l) => l.id.includes("@")).map((l) => vorhabenDef(l.id)!.name);
    expect(new Set(namen).size).toBe(3);
    expect(namen).toEqual(expect.arrayContaining(["Wohnungsbauprogramm: Hatay", "Wohnungsbauprogramm: Edirne", "Schulbauprogramm: Hatay"]));
    for (const l of reichZustand(w).laufend.filter((x) => x.id.includes("@"))) expect(vorhabenDef(l.id)!.ort?.name).toBeTruthy();
  });

  test("Zwei Welten teilen sich keine angelegten Programme (die Anmeldung ist nur Sitzungsgedächtnis)", () => {
    const a = welt(1);
    const b = welt(2);
    expect(beginneRegional(a, "reg_wohnungsbau", [31]).ok).toBe(true);
    const inB = vorhabenListe(b, "infrastruktur").filter((s) => s.v.id.includes("@"));
    expect(inB).toHaveLength(0);
    expect(vorhabenListe(a, "infrastruktur").filter((s) => s.v.id.includes("@")).length).toBeGreaterThan(0);
    expect(beginneRegional(b, "reg_wohnungsbau", [31]).ok).toBe(true);
  });

  test("Speichern und Laden: Die Definitionen stehen im Spielstand", () => {
    const w = welt();
    beginneRegional(w, "reg_wohnungsbau", MARMARA);
    const kopie = JSON.parse(JSON.stringify(w)) as typeof w;
    const z = reichZustand(kopie);
    const id = Object.keys(z.regional!)[0]!;
    expect(vorhabenDef(id)?.name).toBe("Wohnungsbauprogramm: Marmara");
    expect(z.regional![id]!.provinzen).toEqual(MARMARA.slice().sort((x, y) => x - y));
    expect(vorhabenListe(kopie, "infrastruktur").some((s) => s.v.id === id && s.status === "im_bau")).toBe(true);
  });

  test("Ohne Vorlage und ohne Ort geht nichts kaputt, und eine gescheiterte Anlage hinterlässt nichts", () => {
    const w = welt();
    // unter den Voraussetzungen des Staudamms (Wasserleitungen mindestens auf Stufe 40) geht es nicht: Der Eintrag wird zurückgenommen
    const z = reichZustand(w);
    z.verwaltung = 0;
    expect(beginneRegional(w, "reg_wohnungsbau", [31]).ok).toBe(false);
    expect(Object.keys(z.regional ?? {})).toHaveLength(0);
    expect(beginneRegional(w, "infra_marmaray", [31]).ok).toBe(false);
    expect(beginneRegional(w, "gibt_es_nicht", [31]).ok).toBe(false);
    const ganz = regionalPlan(w, "reg_wohnungsbau", []);
    expect(ganz.ok && ganz.provinzen).toHaveLength(81);
  });
});

describe("Stätten und Karte", () => {
  test("Das Restaurierungsprogramm zählt die Stätten der Provinzen und kostet nach deren Zahl", () => {
    const w = welt();
    const stambul = ERBE.filter((e) => e.plaka === 34);
    expect(stambul.length).toBeGreaterThan(1);
    const plan = regionalPlan(w, "reg_kultur", [34]);
    if (!plan.ok) throw new Error("Plan fehlt");
    expect(plan.def.abschluss.filter((e) => e.t === "staette")).toHaveLength(stambul.length);
    expect(plan.faktoren.art).toBe("staetten");
    expect(plan.def.kosten.bau).toBe(Math.max(40, Math.round(5300 * (stambul.length / ERBE.length))));
    const ohne = ALLE_PROVINZEN.find((p) => !ERBE.some((e) => e.plaka === p))!;
    const kaputt = regionalPlan(w, "reg_kultur", [ohne]);
    expect(kaputt.ok).toBe(false);
    expect(kaputt.ok === false && kaputt.grund).toMatch(/keine Stätte/);
  });

  test("Das Programm hebt den Zustand der Stätten dort", { timeout: 60000 }, () => {
    const w = welt(6);
    freieBahn(w);
    const vorher = ERBE.filter((e) => e.plaka === 34).map((e) => reichZustand(w).staetten[e.id]!.zustand);
    expect(beginneRegional(w, "reg_kultur", [34]).ok).toBe(true);
    advance(w, 30 * 40);
    const nachher = ERBE.filter((e) => e.plaka === 34).map((e) => reichZustand(w).staetten[e.id]!.zustand);
    nachher.forEach((n, i) => expect(n).toBeGreaterThan(vorher[i]! + 10));
  });

  test("Auf der Karte erscheinen Baustellen und fertige Projekte am Ort", { timeout: 60000 }, () => {
    const w = welt(3);
    freieBahn(w);
    beginneRegional(w, "reg_wohnungsbau", [31]);
    const bau = kartenOrte(w).find((o) => o.id === "v:reg_wohnungsbau@p31")!;
    expect(bau.art).toBe("bau");
    expect(bau.text).toContain("im Bau");
    expect(bau.lat).toBeGreaterThan(35);
    expect(bau.lat).toBeLessThan(43);
    expect(bau.lon).toBeGreaterThan(25);
    expect(bau.lon).toBeLessThan(45);
    advance(w, 30 * 40);
    expect(kartenOrte(w).find((o) => o.id === "v:reg_wohnungsbau@p31")!.art).toBe("wunder");
    expect(kartenOrte(w).find((o) => o.id === "v:reg_wohnungsbau@p31")!.text).toContain("fertig");
    // Katalogprojekte stehen ebenfalls auf der Karte
    expect(kartenOrte(welt()).some((o) => o.id === "v:infra_marmaray")).toBe(true);
  });
});

describe("Oberfläche", () => {
  test("Die Karte einer Vorlage fragt nach dem Ort, zeigt Preisschild und Wirkung nur dort und bietet das Anlegen", () => {
    const w = welt();
    const v = vorhabenDef("reg_schulbau")!;
    const h = renderToStaticMarkup(createElement(VorlageKarte, { world: w, v, refresh: () => {} }));
    expect(h).toContain("Wo?");
    expect(h).toContain("Anlegen");
    expect(h).toContain("Wirkung nur dort");
    expect(h).toMatch(/betrifft .* Prozent der Bevölkerung/);
    expect(h).toContain("Provinzen");
    expect(h).not.toContain("NaN");
  });

  test("Jede Vorlage lässt sich anzeigen und anlegen", () => {
    const w = welt();
    for (const v of REGIONAL_VORLAGEN) {
      const h = renderToStaticMarkup(createElement(VorlageKarte, { world: w, v, refresh: () => {} }));
      expect(h, v.id).toContain("Anlegen");
      expect(h, v.id).not.toContain("NaN");
      expect(regionalVorschau(w, v.id, [34]).ok, v.id).toBe(true);
    }
  });

  test("Die Liste „Neue Vorhaben“ zeigt die Programme für Regionen zuerst", () => {
    const w = welt();
    const liste = vorhabenListe(w, "infrastruktur");
    const offen = liste.filter((s) => s.status !== "fertig" && s.status !== "im_bau" && s.status !== "pausiert" && (s.v.klasse !== "restaurierung" || !!s.v.vorlage));
    const h = renderToStaticMarkup(createElement(Neues, { world: w, liste: offen, alle: liste, onBeginne: () => {}, ergebnisse: {}, refresh: () => {} }));
    expect(h.indexOf("Programme für Regionen")).toBeGreaterThan(-1);
    expect(h.indexOf("Programme für Regionen")).toBeLessThan(h.indexOf("Verkehr und Welt"));
    expect(h).toContain("Wohnungsbauprogramm");
  });
});
