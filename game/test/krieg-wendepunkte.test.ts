// Welle 3, K3 (krieg.md Schritt 6): Operationsformen und Wendepunkte. Geprüft wird:
//   - Ein Wendepunkt kommt, wenn die Lage es verlangt, und nicht, wenn nicht.
//   - Ohne gewählte Operation und ohne eigenen Angriff kommt keiner (der Generalstab führt), und die Vorlagen ziehen nie aus dem Zufallsstrom.
//   - Jede Antwort bucht, was sie zeigt: die Zeilen des Krieges (Front, Tempo, Gefallene, Rückhalt, Munition, Geflüchtete, Spannung, Waffenruhe,
//     neue Operation) aus der echten Buchung nachgerechnet, die Plakette gegen Kapital und BIP.
//   - Die Formen wirken: Luftschlag ohne Gelände, begrenzte Operation hält an der Zone, Landung nur auf Inseln und Zypern.
//   - Der Lauf ist deterministisch.

import { describe, expect, test, vi } from "vitest";
import { advance, load, save } from "../src/sim/world";
import { kriegszielErreicht } from "../src/sim/krieg";
import { ansicht, antworten, entscheide, oeffne, preisVorschau, VORLAGEN } from "../src/sim/ereignisse";
import { WENDEPUNKT, WENDEPUNKT_IDS, WENDEPUNKT_VORLAGEN, naechsterWendepunkt, wendepunktGilt, wendepunkteAktiv, wendepunkteWoche } from "../src/sim/ereignisse-wendepunkte";
import { anDerGrenze, formenFuer, operationsVorstoss, waehleOperation } from "../src/sim/operationen";
import { OPERATIONSFORMEN } from "../src/data/operationen";
import { streitkraefte } from "../src/sim/streitkraefte";
import { aussenZustand } from "../src/sim/diplomatie";
import { weltZustand } from "../src/sim/laender";
import { bipWertMrd, kassenbestand } from "../src/sim/staatsgeld";
import { landFormen } from "../src/sim/ereignisse-krieg";
import { PAKETE } from "../src/sim/krieg";
import { umkaempfteRegion } from "../src/sim/kriegsschauplatz";
import { Rng } from "../src/sim/rng";
import { t, zahl } from "../src/i18n";
import { bisKrieg, frisch, fuehreKrieg, type Plan } from "./k3-hilfe";
import type { KriegVorgang } from "../src/sim/krieg-typen";
import type { World } from "../src/sim/types";

const SYRIEN: Plan = { land: "SYR", zielraum: "syr_maximal", form: "begrenzt", mit: "sna" };
const krieg = (o: Plan, seed = 6): { w: World; k: KriegVorgang } => {
  const w = frisch(seed);
  const { k } = bisKrieg(w, o);
  return { w, k };
};

describe("Die Vorlagen ziehen nie aus dem Strom und schaffen keinen Platz", () => {
  test("eigener Wurf, kein Zusatzplatz, keine Monatschance", () => {
    const w = frisch();
    for (const v of WENDEPUNKT_VORLAGEN) {
      expect(v.eigenerWurf, v.id).toBe(true);
      expect(v.ohneZusatzplatz, v.id).toBe(true);
      expect(v.chance(w), v.id).toBe(0);
      expect(VORLAGEN.includes(v), v.id).toBe(true);
    }
  });
});

describe("Wendepunkte kommen, wenn die Lage es verlangt, und nicht, wenn nicht", () => {
  test("ohne Operation in einem Krieg, den der Gegner begann, kommt keiner", () => {
    const { w, k } = krieg(SYRIEN);
    delete k.operation;
    k.koalition!.aggressor = "gegner";
    expect(wendepunkteAktiv(k)).toBe(false);
    advance(w, 70);
    expect(k.wendepunkte ?? {}).toEqual({});
  });

  test("Gefallene erst ab der Schwelle", () => {
    const { w, k } = krieg(SYRIEN);
    k.gefallene = WENDEPUNKT.gefalleneAb - 1;
    expect(wendepunktGilt(w, k, "krieg_wp_gefallene")).toBe(false);
    k.gefallene = WENDEPUNKT.gefalleneAb;
    expect(wendepunktGilt(w, k, "krieg_wp_gefallene")).toBe(true);
  });

  test("Munition erst, wenn sie knapp wird", () => {
    const { w, k } = krieg(SYRIEN);
    const m = streitkraefte(w).gattungen.munition;
    m.menge = WENDEPUNKT.munitionAb + 1;
    expect(wendepunktGilt(w, k, "krieg_wp_munition")).toBe(false);
    m.menge = WENDEPUNKT.munitionAb - 1;
    expect(wendepunktGilt(w, k, "krieg_wp_munition")).toBe(true);
  });

  test("Stadtkampf nur vor einer Stadt, die die Operation erreicht", () => {
    const { w, k } = krieg({ ...SYRIEN, form: "grossoffensive", mobil: true });
    expect(umkaempfteRegion(k)?.gelaende).not.toBe("stadt");
    expect(wendepunktGilt(w, k, "krieg_wp_stadtkampf")).toBe(false);
    // Bis vor Rakka (Stadt, Tiefe 2): die Regionen davor sind genommen
    for (const r of ["syr_asas", "syr_manbidsch", "syr_qamischli", "syr_idlib", "syr_tabqa"]) k.regionen![r] = "eigen";
    expect(umkaempfteRegion(k)?.id).toBe("syr_rakka");
    expect(wendepunktGilt(w, k, "krieg_wp_stadtkampf")).toBe(true);
    // Eine begrenzte Operation hält an der Zone und kommt nicht vor Rakka
    expect(waehleOperation(w, k, "begrenzt", "sna", true).ok).toBe(true);
    expect(anDerGrenze(k)).toBe(true);
    expect(wendepunktGilt(w, k, "krieg_wp_stadtkampf")).toBe(false);
  });

  test("Flucht nur an der Landgrenze und nur mit einer Bodenoperation", () => {
    const syr = krieg(SYRIEN);
    syr.k.regionen!.syr_asas = "eigen";
    expect(wendepunktGilt(syr.w, syr.k, "krieg_wp_flucht")).toBe(true);
    const luft = krieg({ land: "SYR", zielraum: "syr_grenzstreifen", form: "luftschlag" });
    expect(wendepunktGilt(luft.w, luft.k, "krieg_wp_flucht")).toBe(false);
    const grc = krieg({ land: "GRC", zielraum: "grc_inseln", form: "landung", mobil: true });
    grc.k.regionen!.grc_mytilini = "eigen";
    expect(wendepunktGilt(grc.w, grc.k, "krieg_wp_flucht"), "über die Ägäis flieht niemand in die Türkei").toBe(false);
  });

  test("Sanktionsdrohung: gegen ein EU-Mitglied immer, sonst erst bei Spannung mit den USA oder nach einer abgelehnten Pause", () => {
    const grc = krieg({ land: "GRC", zielraum: "grc_inseln", form: "landung", mobil: true });
    expect(wendepunktGilt(grc.w, grc.k, "krieg_wp_sanktion")).toBe(true);
    const { w, k } = krieg(SYRIEN);
    weltZustand(w).USA!.konflikt = WENDEPUNKT.sanktionAb - 1;
    expect(wendepunktGilt(w, k, "krieg_wp_sanktion")).toBe(false);
    k.wendepunkte = { krieg_wp_vermittlung: 1 };
    expect(wendepunktGilt(w, k, "krieg_wp_sanktion")).toBe(true);
    delete k.wendepunkte;
    weltZustand(w).USA!.konflikt = WENDEPUNKT.sanktionAb;
    expect(wendepunktGilt(w, k, "krieg_wp_sanktion")).toBe(true);
    // Verteidigt sich die Türkei, droht niemand
    k.koalition!.aggressor = "gegner";
    k.rahmung = "verteidigung";
    delete k.rahmungDuenn;
    expect(wendepunktGilt(w, k, "krieg_wp_sanktion")).toBe(false);
  });

  test("Schlagwelle nur nach einem Luftschlag", () => {
    const luft = krieg({ land: "SYR", zielraum: "syr_grenzstreifen", form: "luftschlag" });
    expect(wendepunktGilt(luft.w, luft.k, "krieg_wp_schlagwelle")).toBe(false);
    advance(luft.w, 7);
    expect(luft.k.wendepunkte?.krieg_wp_schlagwelle, "nach einer Woche ist die Welle geflogen").toBe(1);
    const boden = krieg(SYRIEN);
    advance(boden.w, 7);
    expect(wendepunktGilt(boden.w, boden.k, "krieg_wp_schlagwelle")).toBe(false);
  });

  test("je Krieg höchstens fünf, jeder einmal, höchstens einer je Woche, und keiner, solange einer offen ist", () => {
    const { w, k } = krieg(SYRIEN);
    advance(w, 7 * 2);
    const offen = w.spiel!.ereignisse.filter((e) => WENDEPUNKT_IDS.includes(e.vorlage));
    expect(offen.length).toBeLessThanOrEqual(1);
    if (offen.length) expect(naechsterWendepunkt(w, k)).toBeUndefined();
    const r = fuehreKrieg(frisch(), { land: "SYR", zielraum: "syr_tief", form: "grossoffensive", mit: "sna", mobil: true });
    const ids = r.wendepunkte.map((x) => x.split(":")[0]);
    expect(ids.length).toBeLessThanOrEqual(WENDEPUNKT.maxJeKrieg);
    expect(new Set(ids).size).toBe(ids.length);
    const wochen = r.log.filter((l) => l.includes("krieg_wp_")).map((l) => l.split(" ")[1]);
    expect(new Set(wochen).size).toBe(wochen.length);
  });
});

describe("Die Formen wirken auf die Rechnung", () => {
  test("Luftschlag nimmt kein Gelände, verliert wenig", () => {
    const { w, k } = krieg({ land: "SYR", zielraum: "syr_grenzstreifen", form: "luftschlag" });
    expect(operationsVorstoss(k, 3)).toBe(0);
    // Nach der Schlagwelle weiter Luftschläge (zweite Welle), nicht einstellen: kein Gelände in zwei Wochen
    const ev = () => w.spiel!.ereignisse.find((e) => e.vorlage === "krieg_wp_schlagwelle");
    advance(w, 7);
    entscheide(w, ev()!.id, "welle2", new Rng(1));
    advance(w, 6);
    expect(Object.values(k.regionen ?? {}).filter((l) => l === "eigen")).toEqual([]);
    expect(k.gefallene ?? 0).toBeLessThan(5);
  });

  test("Begrenzte Operation hält an der Zone; ihr Ziel ist die Zone", () => {
    const { w, k } = krieg({ land: "SYR", zielraum: "syr_maximal", form: "begrenzt" });
    for (const r of ["syr_asas", "syr_manbidsch", "syr_qamischli"]) k.regionen![r] = "eigen";
    expect(anDerGrenze(k)).toBe(true);
    expect(operationsVorstoss(k, 3)).toBe(0);
    expect(kriegszielErreicht(k), "die Zone ist genommen: Der Gegner verhandelt").toBe(true);
    void w;
  });

  test("Landung nur auf Inseln und Zypern; Großoffensive und Landung verlangen die Teilmobilmachung", () => {
    const syr = krieg(SYRIEN);
    const f = formenFuer(syr.w, syr.k);
    expect(f.find((x) => x.id === "landung")!.moeglich).toBe(false);
    expect(f.find((x) => x.id === "landung")!.grund).toBe(t("welle_k3.op.grund.nur"));
    expect(f.find((x) => x.id === "grossoffensive")!.grund).toBe(t("welle_k3.op.grund.mobil"));
    const grc = krieg({ land: "GRC", zielraum: "grc_inseln", form: "landung", mobil: true });
    expect(formenFuer(grc.w, grc.k).find((x) => x.id === "landung")!.aktiv).toBe(true);
    expect(grc.k.einsatz).toBe("see");
    // Die SNA kämpft nur in Nordsyrien
    expect(formenFuer(grc.w, grc.k).some((x) => x.sna)).toBe(false);
  });

  test("Umstellung im Krieg kostet Kapital und ruht drei Wochen", () => {
    const { w, k } = krieg(SYRIEN);
    const pk = w.spiel!.kapital;
    k.mobilmachung = 1;
    // Direkt nach dem Beginn ruht der Befehl noch
    expect(formenFuer(w, k).find((x) => x.id === "grossoffensive")!.moeglich).toBe(false);
    advance(w, 22);
    w.spiel!.ereignisse = [];
    const vor = w.spiel!.kapital;
    expect(waehleOperation(w, k, "grossoffensive", "sna").ok).toBe(true);
    expect(vor - w.spiel!.kapital).toBe(OPERATIONSFORMEN.grossoffensive.pk);
    void pk;
  });
});

/** Was die Antwort im Vorgang wirklich bewegt hat, als dieselben Zeilen, die die Antwort zeigt (sim/ereignisse-wendepunkte.ts `zeilen`). */
function gebuchteZeilen(vor: World, nach: World, kid: string): string[] {
  const k0 = vor.spiel!.kriege!.find((x) => x.id === kid)!;
  const k1 = nach.spiel!.kriege!.find((x) => x.id === kid)!;
  const vz = (x: number) => (x > 0 ? "+" : x < 0 ? "−" : "") + zahl(Math.abs(x), Number.isInteger(Math.round(x * 10) / 10) ? 0 : 1);
  const out: string[] = [];
  const d = (a: number | undefined, b: number | undefined) => Math.round(((b ?? 0) - (a ?? 0)) * 10) / 10;
  if (d(k0.frontSchub, k1.frontSchub)) out.push(t("welle_k3.wz.front", { d: vz(d(k0.frontSchub, k1.frontSchub)) }));
  if ((k0.tempo ?? "normal") !== (k1.tempo ?? "normal")) out.push(t("welle_k3.wz.tempo", { tempo: t(`krieg.tempo.${k1.tempo}.name`) }));
  if (d(k0.gefallene, k1.gefallene)) out.push(t("welle_k3.wz.gefallene", { d: vz(d(k0.gefallene, k1.gefallene)) }));
  if (d(k0.uhr, k1.uhr)) out.push(t("welle_k3.wz.uhr", { d: vz(d(k0.uhr, k1.uhr)) }));
  if (d(k0.uhrGegner, k1.uhrGegner)) out.push(t("welle_k3.wz.uhr_gegner", { d: vz(d(k0.uhrGegner, k1.uhrGegner)) }));
  if (d(k0.eskalation, k1.eskalation)) out.push(t("welle_k3.wz.eskalation", { d: vz(d(k0.eskalation, k1.eskalation)) }));
  const dm = d(streitkraefte(vor).gattungen.munition.menge, streitkraefte(nach).gattungen.munition.menge);
  if (dm) out.push(t("welle_k3.wz.munition", { d: vz(dm) }));
  const df = Math.round((aussenZustand(nach).flucht.bestand - aussenZustand(vor).flucht.bestand) * 1e6);
  if (df) out.push(t("welle_k3.wz.flucht", { d: vz(df) }));
  for (const id of ["EU", "USA", "RUS", k0.land]) {
    const dk = d(weltZustand(vor)[id]?.konflikt, weltZustand(nach)[id]?.konflikt);
    if (dk) out.push(t("welle_k3.wz.konflikt", { land: landFormen(id), d: vz(dk) }));
  }
  if (k0.phase === "krieg" && k1.phase !== "krieg") out.push(t("welle_k3.wz.waffenruhe", { paket: PAKETE[k1.angebotPaket ?? ""]?.name ?? "" }));
  if (k0.operation === k1.operation && k0.operationWoche !== k1.operationWoche) out.push(t("welle_k3.wz.welle2"));
  if (k0.operation !== k1.operation) out.push(t(k1.verbuendete === "sna" ? "welle_k3.wz.form_sna" : "welle_k3.wz.form", { form: t(`welle_k3.op.${k1.operation}.name`) }));
  return out;
}

const netto = (w: World) => (w.economy.debtRatio * bipWertMrd(w.economy)) / 100 - kassenbestand(w.economy);

describe("Jede Antwort bucht, was sie zeigt (keine Schau)", () => {
  // Drei Kriege decken alle Fassungen ab: Syrien mit der SNA (Stadt, Flucht, Washington, Übergriffe), Griechenland mit Landung (EU, Sicherheitsrat,
  // Welterbe auf Rhodos), Syrien aus der Luft (Schlagwelle)
  const lagen: [string, () => { w: World; k: KriegVorgang }][] = [
    ["Syrien mit der SNA", () => {
      const r = krieg({ ...SYRIEN, form: "grossoffensive", mobil: true });
      for (const x of ["syr_asas", "syr_manbidsch", "syr_qamischli", "syr_idlib", "syr_tabqa"]) r.k.regionen![x] = "eigen";
      r.k.gefallene = 30;
      return r;
    }],
    ["Griechenland mit Landung", () => {
      const r = krieg({ land: "GRC", zielraum: "grc_inseln", form: "landung", mobil: true });
      for (const x of ["grc_mytilini", "grc_chios", "grc_kos"]) r.k.regionen![x] = "eigen";
      return r;
    }],
    ["Syrien aus der Luft", () => krieg({ land: "SYR", zielraum: "syr_grenzstreifen", form: "luftschlag" })],
  ];
  test.each(lagen)("%s", (_, lage) => {
    const { w: basis, k } = lage();
    // Mitten im Krieg: Die Schlagwelle liegt eine Woche zurück
    k.woche = 2;
    basis.spiel!.ereignisse = [];
    basis.spiel!.kapital = 100;
    const stand = save(basis);
    const fehler: string[] = [];
    let geprueft = 0;
    for (const v of WENDEPUNKT_VORLAGEN) {
      const w = load(stand);
      const ev = oeffne(w, v.id, new Rng(7));
      if (!ev) continue;
      const a = ansicht(w, ev);
      expect(a.optionen.some((o) => (o.anzeigePk ?? o.pk) === 0 && !o.sperre), `${v.id}: eine kostenlose Antwort`).toBe(true);
      for (const o of antworten(w, ev)) {
        if (o.sperre) continue;
        const vor = load(save(w));
        const nach = load(save(w));
        const e2 = nach.spiel!.ereignisse.find((x) => x.id === ev.id)!;
        const plakette = preisVorschau(vor, vor.spiel!.ereignisse.find((x) => x.id === ev.id)!, o.id);
        const kap0 = nach.spiel!.kapital, n0 = netto(nach), bip = bipWertMrd(nach.economy);
        const r = entscheide(nach, e2.id, o.id, new Rng(12345));
        expect(r.ok, `${v.id}:${o.id} ${r.text}`).toBe(true);
        geprueft++;
        for (const z of gebuchteZeilen(vor, nach, k.id)) if (!o.beschreibung.includes(z)) fehler.push(`${v.id}:${o.id} bucht „${z}“, zeigt aber „${o.beschreibung}“`);
        // Keine Zeile ohne Buchung: Jede Kriegszeile der Beschreibung muss gebucht sein
        const gebucht = gebuchteZeilen(vor, nach, k.id);
        const teile = o.beschreibung.replace(/\.$/, "").split(" · ");
        for (const teil of teile.slice(1)) if (!gebucht.includes(teil)) fehler.push(`${v.id}:${o.id} zeigt „${teil}“ ohne Buchung`);
        const kapital = kap0 - nach.spiel!.kapital;
        const kosten = ((netto(nach) - n0) / bip) * 100;
        if (Math.round(kapital) !== Math.round(plakette.kapital)) fehler.push(`${v.id}:${o.id} Plakette ${plakette.kapital} Kapital, gebucht ${kapital}`);
        if (Math.abs(kosten - plakette.bip) > Math.max(0.02, 0.1 * Math.abs(kosten))) fehler.push(`${v.id}:${o.id} Plakette ${plakette.bip} % des BIP, gebucht ${kosten.toFixed(3)}`);
      }
    }
    expect(fehler).toEqual([]);
    expect(geprueft).toBeGreaterThan(10);
  }, 120_000);
});

describe("Deterministisch", () => {
  test("zweimal derselbe Krieg, zweimal dieselben Wendepunkte und derselbe Zufallsstrom", () => {
    const a = frisch(), b = frisch();
    const ra = fuehreKrieg(a, { land: "SYR", zielraum: "syr_grenzstreifen", form: "begrenzt", mit: "sna" });
    const rb = fuehreKrieg(b, { land: "SYR", zielraum: "syr_grenzstreifen", form: "begrenzt", mit: "sna" });
    expect(ra.log).toEqual(rb.log);
    expect(a.rngState).toBe(b.rngState);
    expect(save(a)).toBe(save(b));
  }, 120_000);

  test("Ein Wendepunkt zieht keine Zahl aus dem Strom der Partie", () => {
    const { w, k } = krieg(SYRIEN);
    w.spiel!.ereignisse = [];
    k.wendepunkte = {};
    k.woche = 3;
    k.gefallene = 40;
    expect(naechsterWendepunkt(w, k)).toBeDefined();
    const vor = w.rngState, n = w.spiel!.ereignisse.length;
    wendepunkteWoche(w, k);
    expect(w.spiel!.ereignisse.length).toBe(n + 1);
    expect(w.rngState).toBe(vor);
  });
});

describe("Englisch und Türkisch ohne deutsche Reste, im laufenden Krieg", () => {
  const ZEICHEN = /[äÄß]/;
  const WORT = /(?<![\p{L}'’])(und|der|das|den|dem|des|nicht|mit|für|ist|sind|wird|werden|eine|einen|sich|auf|oder|nach|bei|über|Sie|Ihre|Kapital|zum|zur|gegen|keine|Front|Rückhalt|Gefallene|Spannung)(?![\p{L}'’])/gu;
  for (const sprache of ["en", "tr"] as const) {
    test(sprache, async () => {
      vi.resetModules();
      const i18n = await import("../src/i18n");
      await i18n.setzeSprache(sprache);
      const hilfe = await import("./k3-hilfe");
      const ereignisse = await import("../src/sim/ereignisse");
      const wp = await import("../src/sim/ereignisse-wendepunkte");
      const { Rng: R } = await import("../src/sim/rng");
      const funde: string[] = [];
      for (const plan of [{ land: "SYR", zielraum: "syr_maximal", form: "grossoffensive", mit: "sna", mobil: true }, { land: "GRC", zielraum: "grc_inseln", form: "landung", mobil: true }, { land: "SYR", zielraum: "syr_grenzstreifen", form: "luftschlag" }] as Plan[]) {
        const w = hilfe.frisch();
        hilfe.bisKrieg(w, plan);
        w.spiel!.ereignisse = [];
        for (const v of wp.WENDEPUNKT_VORLAGEN) {
          const ev = ereignisse.oeffne(w, v.id, new R(7));
          if (!ev) continue;
          const a = ereignisse.ansicht(w, ev);
          for (const text of [a.titel, ...a.text, a.warum, ...a.optionen.flatMap((o) => [o.label, o.beschreibung, ...o.vorschau])]) {
            const treffer = new Set([...text.matchAll(WORT)].map((m) => m[1]));
            if (ZEICHEN.test(text) || treffer.size >= 2) funde.push(`${v.id}: ${text}`);
          }
          w.spiel!.ereignisse = [];
        }
      }
      expect(funde).toEqual([]);
    }, 120_000);
  }
});
