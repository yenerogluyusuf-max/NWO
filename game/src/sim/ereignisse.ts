import { bucheFinanzsaldo, kassenbestand, bipWertMrd } from "./staatsgeld";
// Ereignismotor: Ereignisse entstehen aus dem Zustand der Welt (Weltmodell, Abschnitt 7), nicht aus einem Drehbuch.
// Jede Vorlage ist ein Muster mit Bedingung, Ort, Stärke und mindestens zwei Antworten, die etwas kosten.
// Wer nichts entscheidet, bekommt nach der Frist die schlechtere Standardfolge.
// Alle Wahrscheinlichkeiten und Wirkungen sind Platzhalter der Kalibrierung (vgl. SZENARIEN.md, Wirkungsmodell).
//
// TODO (Energie-Modul): Die zehn Ereignis-Hooks aus RECHERCHE_ENERGIE.md, Abschnitt 6.3,
// als Vorlagen einbauen — u. a. „Poker mit dem Kreml“ (RU-Gasvertrag läuft 12/2026 aus,
// terminfest), „Iran-Leere“, „Hormuz-Blockade“ (Brent-Szenarien), „Kälteeinbruch Februar“
// (Speicher-Drawdown), „Pipeline-Sabotage“, „Dürrejahr“ (Hydro-Einbruch), „Akkuyu-Zeitplan“,
// „Blackout-Warnung“ (Sommer-Peak), „Tuapse/Novorossiysk“, „EU-CBAM startet“.
// Anknüpfung an die neuen Knoten des Energie-Moduls (politiknetz.ts): energieversorgung,
// p_energiemangel, energie_importrechnung, energie_subventionslast, strompreis,
// gasabhaengigkeit, sakarya_gas, strommix.

import { koalitionsAntwort } from "./koalitionsereignis";
import { aktuelleErinnerungsZusage, zusagenErinnerungsAntwort, zusagenErinnerungsAntworten } from "./zusagenantwort";
import { NET } from "./modell";
import { nationalAverage, PROVINCES } from "./netz";
import { PROVINZEN, SEISMIC, BORDER } from "./regional";
import { wirke, wertIn, vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { anrede, ersetze, figur } from "./figuren";
import { criticizeCentralBank, replaceGovernor, setFiscalImpulse } from "./eingriffe";
import { interveniere } from "./devisen";
import { bringeEin, provinzenText, pruefeVorhaben, setPolicy, setzeEinbringHaken, stufeIn } from "./handeln";
import { FORDERUNG, PARTEI_NAME, bereitschaftAendern, forderungVon } from "./fraktionen";
import { INNEN_VORLAGEN } from "./ereignisse-innen";
import { KATASTROPHE_VORLAGEN } from "./ereignisse-katastrophe";
import { setzeKatastrophenOeffner } from "./katastrophe";
import { INITIATIVE_VORLAGEN, INITIATIVE_VORLAGE_IDS } from "./initiative";
import { schutzFuer } from "./programme";
import { schwierig } from "./spiel";
import { AUSSEN_VORLAGEN } from "./ereignisse-aussen";
import { KRIEG_VORLAGEN } from "./ereignisse-krieg";
import { EU_VORLAGEN } from "./ereignisse-eu";
import { WELT_VORLAGEN } from "./welt-ereignisse";
import { VERMITTLUNG_VORLAGEN } from "./ereignisse-vermittlung";
import { REICH_VORLAGEN } from "./ereignisse-reich";
import { PERSONEN_VORLAGEN } from "./ereignisse-personen";
import { MACHTKREIS_VORLAGEN } from "./ereignisse-machtkreis";
import { VERFASSUNG_VORLAGEN } from "./ereignisse-verfassung";
import { WAHL_VORLAGEN } from "./ereignisse-wahl";
import { regierungsJahre } from "./amtszeit";
import { addDays, dayOfMonth, formatDateDe } from "./dates";
import { SAISON_VORLAGEN } from "./ereignisse-saison";
import { setzeVerfassungsOeffner } from "./verfassung";
import { brecheZusage, zusageAbschluss, zusageBezug, zusageVorhaben, zusageText, zusageVon } from "./zusagen";
import { istMinisterienZusage, ministerienAnPartei, naechsteRessorts, ressortNamen } from "./ressortvergabe";
import { skala, skalenArt, stufenName } from "../data/skalen";
import { PROZ_STADT, akutIn, dk, einwohner, kosten, monatVon, namen, nf, opt, sommer, ziehe } from "./ereignis-hilfen";
import type { Option, SzenenName, Vorlage } from "./ereignis-hilfen";
import { Rng } from "./rng";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";
import { kannZahlen } from "./kapital";
import { momentaufnahme, rueckblickAnlegen } from "./berichte";
import { t } from "../i18n";
import { aktiveParteivorsitzende } from "./koalitionslage";
import { VERFASSUNG, belastungEreignis } from "./aufmerksamkeit";

export type { Option, Vorlage, SzenenName } from "./ereignis-hilfen";
/** Stellschraube für die Häufigkeit aller Ereignisse. */
export const EREIGNIS_RATE = 1;

/** Die zweite Hälfte einer Amtszeit ist rauer: Krisen werden häufiger, je länger man regiert (Regierungsalter). Nur Krisen aus der Außenwelt und der Wirtschaft. */
const ALTERSKRISEN = new Set(["weltwirtschaftskrise", "pandemie", "waehrungsrutsch", "energiepreisschock", "haushaltsdruck", "bankenstress"]);
function alterFaktor(world: World, id: string): number {
  if (!ALTERSKRISEN.has(id)) return 1;
  // Regierungsalter ab Beginn der Amtszeit, ein Teil früherer Amtszeiten geht mit (sim/amtszeit.ts)
  const jahre = regierungsJahre(world);
  return 1 + Math.min(1.2, 0.18 * Math.max(0, jahre - 1.5));
}

/** Feste Termine des Staatsjahres: Sie kommen immer und zählen nicht zur Dichte. */
const TERMINE = new Set(["mindestlohn", "haushaltsjahr", "kommunalwahl", "zusage", "koalitionsangebot"]);
/** Ab so vielen Ereignissen in zwölf Monaten (offen oder entschieden) werden neue seltener: Das Spiel soll fordern, nicht zuschütten. */
const DICHTE_SCHWELLE = 6;
function dichteFaktor(world: World, id: string): number {
  if (TERMINE.has(id) || id.startsWith("start_")) return 1;
  const sp = world.spiel;
  if (!sp) return 1;
  const grenze = world.day - 365;
  let n = sp.ereignisse.filter((e) => !TERMINE.has(e.vorlage) && !e.vorlage.startsWith("start_")).length;
  for (let i = sp.chronik.length - 1; i >= 0; i--) {
    const c = sp.chronik[i]!;
    if (c.tag < grenze) break;
    // ZEI-1: Die Haken des Ereignis-Wettbewerbs („ausgesessen“/„gärt weiter“), Berichte und Momente sind keine Präsentationen,
    // feste Termine des Staatsjahres zählen nie zur Dichte. Gelesen werden Merkmale, nicht der übersetzte Titel.
    if (c.art || (c.vorlage && TERMINE.has(c.vorlage))) continue;
    n++;
  }
  return n <= DICHTE_SCHWELLE ? 1 : Math.max(0.3, 1 - 0.14 * (n - DICHTE_SCHWELLE));
}

// ---------------------------------------------------------------------------
// Vorlagen

/** Provinznamen als Aufzählung für den Katalog (`{orte, list}`): im Deutschen „A, B und C“, sonst nach Sprache (wie in ereignisse-innen.ts). */
const orte = (provinzen: number[]): string[] => [...new Set(provinzen)].map((p) => PROVINZEN[p - 1]?.name ?? String(p));

const ERDBEBEN: Vorlage = {
  id: "erdbeben",
  szene: "anatolien",
  frist: 7,
  abkuehlung: 240,
  // Seit dem Katastrophen-Modul (sim/katastrophe.ts) löst allein der Risiko-Layer Beben aus: Er legt einen Fall an, dieser alte Würfel
  // erzeugte keinen. Die Vorlage bleibt für ältere Spielstände mit offenem Ereignis.
  chance: () => 0,
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => (SEISMIC.has(pl) ? 1 : 0.05) * wertIn(w, "p_erdbebengefahr", [pl]) ** 2, 1);
    if (!p.length) return null;
    const staerke = rng.next() ** 1.5 * 0.65 + 0.35;
    const vorsorge = (wertIn(w, "erdbebenvorsorge", p) + wertIn(w, "bauqualitaet", p)) / 200;
    const schaden = clamp(staerke * (1.25 - 0.8 * vorsorge), 0.05, 1);
    return { provinzen: p, staerke, daten: { mag: 5.6 + 1.9 * staerke, schaden, vorsorge } };
  },
  titel: (_, ev) => t("ev.erdbeben.titel", { orte: orte(ev.provinzen) }),
  text: (w, ev) => {
    const s = dk(ev, "schaden");
    return [
      t("ev.erdbeben.text1", {
        mag: dk(ev, "mag"),
        orte: orte(ev.provinzen),
        n: einwohner(ev.provinzen),
        schaden: s < 0.3 ? "leicht" : s < 0.6 ? "mittel" : "schwer",
      }),
      t("ev.erdbeben.text2", { wer: anrede(figur(w, "inneres")) }),
    ];
  },
  warum: (_, ev) => t("ev.erdbeben.warum", { v: Math.round(dk(ev, "vorsorge") * 100) }),
  eroeffne: (w, ev) => {
    const s = dk(ev, "schaden");
    wirke(w, "wohnungsbau", -10 * s, ev.provinzen);
    wirke(w, "bauwirtschaft", -4 * s, ev.provinzen);
    wirke(w, "p_wohnungsnot", 12 * s, ev.provinzen);
    wirke(w, "lebenshaltung", 4 * s, ev.provinzen);
    vertrauenAendern(w, -2 * s);
  },
  optionen: (_, ev) => {
    const s = dk(ev, "schaden");
    return [
      opt("fonds", t("ev.erdbeben.opt.fonds.label"), t("ev.erdbeben.opt.fonds.beschr"), 8, (w) => {
        kosten(w, 0.5 * s + 0.1);
        wirke(w, "wohnungsbau", 8 * s, ev.provinzen);
        wirke(w, "p_wohnungsnot", -8 * s, ev.provinzen);
        wirke(w, "korruption", 2 * s + 1);
        vertrauenAendern(w, 3.5 * s);
        return t("ev.erdbeben.opt.fonds.ausgang");
      }),
      opt("nothilfe", t("ev.erdbeben.opt.nothilfe.label"), t("ev.erdbeben.opt.nothilfe.beschr"), 2, (w) => {
        kosten(w, 0.1 * s + 0.03);
        vertrauenAendern(w, -1 * s);
        return t("ev.erdbeben.opt.nothilfe.ausgang");
      }),
      opt("untersuchung", t("ev.erdbeben.opt.untersuchung.label"), t("ev.erdbeben.opt.untersuchung.beschr"), 5, (w) => {
        kosten(w, 0.15 * s + 0.05);
        wirke(w, "erdbebenvorsorge", 3);
        wirke(w, "bauqualitaet", 2);
        wirke(w, "korruption", -2);
        vertrauenAendern(w, 1.5 * (1 - dk(ev, "vorsorge")));
        return t("ev.erdbeben.opt.untersuchung.ausgang");
      }),
    ];
  },
  standard: (w, ev) => {
    kosten(w, 0.05);
    vertrauenAendern(w, -2.5 * dk(ev, "schaden"));
    wirke(w, "p_wohnungsnot", 3 * dk(ev, "schaden"), ev.provinzen);
    return t("ev.erdbeben.standard");
  },
};

const DUERRE: Vorlage = {
  id: "duerre",
  szene: "anatolien",
  frist: 10,
  abkuehlung: 300,
  // Nur noch der Risiko-Layer (sim/katastrophe.ts) löst Dürren aus, mit Fall und Abschluss; die Vorlage bleibt für ältere Spielstände.
  chance: () => 0,
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => wertIn(w, "p_wassermangel", [pl]) ** 3, 4);
    if (!p.length) return null;
    return { provinzen: p, staerke: 0.4 + 0.6 * rng.next() };
  },
  titel: () => t("ev.duerre.titel"),
  text: (w, ev) => [
    t("ev.duerre.text1", { orte: orte(ev.provinzen) }),
    t("ev.duerre.text2", { wer: anrede(figur(w, "finanzen")) }),
  ],
  warum: () => t("ev.duerre.warum"),
  eroeffne: (w, ev) => {
    wirke(w, "ernte", -8 * ev.staerke, ev.provinzen);
    wirke(w, "lebensmittelpreise", 6 * ev.staerke, ev.provinzen);
    wirke(w, "landwirtschaft_einkommen", -6 * ev.staerke, ev.provinzen);
  },
  optionen: (_, ev) => [
    opt("hilfe", t("ev.duerre.opt.hilfe.label"), t("ev.duerre.opt.hilfe.beschr"), 3, (w) => {
      kosten(w, 0.12);
      wirke(w, "landwirtschaft_einkommen", 5 * ev.staerke, ev.provinzen);
      wirke(w, "ernte", 3 * ev.staerke, ev.provinzen);
      return t("ev.duerre.opt.hilfe.ausgang");
    }),
    opt("import", t("ev.duerre.opt.import.label"), t("ev.duerre.opt.import.beschr"), 2, (w) => {
      kosten(w, 0.08);
      wirke(w, "lebensmittelpreise", -5 * ev.staerke, ev.provinzen);
      wirke(w, "landwirtschaft_einkommen", -2 * ev.staerke, ev.provinzen);
      return t("ev.duerre.opt.import.ausgang");
    }),
    opt("rationieren", t("ev.duerre.opt.rationieren.label"), t("ev.duerre.opt.rationieren.beschr"), 3, (w) => {
      vertrauenAendern(w, -1.5 * ev.staerke);
      wirke(w, "wasserversorgung", 3, ev.provinzen);
      return t("ev.duerre.opt.rationieren.ausgang");
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "ernte", -4 * ev.staerke, ev.provinzen);
    wirke(w, "wasserversorgung", -4 * ev.staerke, ev.provinzen);
    vertrauenAendern(w, -2 * ev.staerke);
    return t("ev.duerre.standard");
  },
};

const WAEHRUNG: Vorlage = {
  id: "waehrungsrutsch",
  szene: "bank",
  frist: 5,
  abkuehlung: 240,
  chance: (w) => {
    const h = w.history;
    const letzter = h[h.length - 1];
    const davor = h[h.length - 2];
    const monat = letzter && davor ? (letzter.usdTry / davor.usdTry - 1) * 100 : 0;
    return monat > 6 || w.economy.riskPremium > 420 ? 0.5 : 0.006;
  },
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("ev.waehrungsrutsch.titel"),
  text: (w) => [
    t("ev.waehrungsrutsch.text1", { kurs: w.economy.usdTry, rp: Math.round(w.economy.riskPremium) }),
    t("ev.waehrungsrutsch.text2", { wer1: anrede(figur(w, "finanzen")), wer2: anrede(figur(w, "zentralbank")) }),
  ],
  warum: () => t("ev.waehrungsrutsch.warum"),
  optionen: () => [
    opt("reserven", t("ev.waehrungsrutsch.opt.reserven.label"), t("ev.waehrungsrutsch.opt.reserven.beschr"), 3, (w) => {
      // Über die Interventionsrechnung der Devisenlage (sim/devisen.ts): Reserven sinken wirklich, die Stütze verteilt sich über Wochen
      const r = interveniere(w, 10);
      if (!r.ok) {
        w.economy.credibility = clamp(w.economy.credibility - 0.02, 0.05, 0.95);
        return t("ev.waehrungsrutsch.opt.reserven.scheitern", { info: r.text });
      }
      return t("ev.waehrungsrutsch.opt.reserven.ausgang", { info: r.text });
    }),
    opt("kapital", t("ev.waehrungsrutsch.opt.kapital.label"), t("ev.waehrungsrutsch.opt.kapital.beschr"), 6, (w) => {
      w.economy.usdTry *= 0.93;
      w.economy.eurTry *= 0.93;
      w.economy.credibility = clamp(w.economy.credibility - 0.06, 0.05, 0.95);
      wirke(w, "auslandskapital", -8);
      wirke(w, "schattenwirtschaft", 5);
      wirke(w, "vertrauen_maerkte", -8);
      return t("ev.waehrungsrutsch.opt.kapital.ausgang");
    }),
    opt("ruhe", t("ev.waehrungsrutsch.opt.ruhe.label"), t("ev.waehrungsrutsch.opt.ruhe.beschr"), 2, (w) => {
      w.economy.credibility = clamp(w.economy.credibility + 0.02, 0.05, 0.95);
      w.economy.riskPremium -= 10;
      const g = figur(w, "zentralbank");
      if (g) g.loyalitaet = Math.min(100, g.loyalitaet + 6);
      return t("ev.waehrungsrutsch.opt.ruhe.ausgang");
    }),
  ],
  standard: (w) => {
    w.economy.riskPremium += 30;
    w.economy.usdTry *= 1.03;
    w.economy.eurTry *= 1.03;
    w.economy.credibility = clamp(w.economy.credibility - 0.03, 0.05, 0.95);
    return t("ev.waehrungsrutsch.standard");
  },
};

const ENERGIE: Vorlage = {
  id: "energiepreisschock",
  szene: "istanbul",
  frist: 10,
  abkuehlung: 240,
  chance: (w) => ((w.economy.oel ?? 100) > 128 ? 0.6 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("ev.energiepreisschock.titel"),
  text: (w) => [
    t("ev.energiepreisschock.text1", { p: Math.round((w.economy.oel ?? 100) - 100) }),
    t("ev.energiepreisschock.text2"),
  ],
  warum: () => t("ev.energiepreisschock.warum"),
  eroeffne: (w) => {
    wirke(w, "energiepreise", 6);
    wirke(w, "lebenshaltung", 3);
  },
  optionen: () => [
    opt("deckel", t("ev.energiepreisschock.opt.deckel.label"), t("ev.energiepreisschock.opt.deckel.beschr"), 3, (w) => {
      kosten(w, 0.4);
      wirke(w, "energiepreise", -6);
      wirke(w, "lebenshaltung", -3);
      return t("ev.energiepreisschock.opt.deckel.ausgang");
    }),
    opt("haerte", t("ev.energiepreisschock.opt.haerte.label"), t("ev.energiepreisschock.opt.haerte.beschr"), 2, (w) => {
      kosten(w, 0.15);
      wirke(w, "lebenshaltung", 1);
      vertrauenAendern(w, -1.5);
      return t("ev.energiepreisschock.opt.haerte.ausgang");
    }),
    opt("sparen", t("ev.energiepreisschock.opt.sparen.label"), t("ev.energiepreisschock.opt.sparen.beschr"), 2, (w) => {
      wirke(w, "energieimporte", -2);
      vertrauenAendern(w, -0.5);
      return t("ev.energiepreisschock.opt.sparen.ausgang");
    }),
  ],
  standard: (w) => {
    vertrauenAendern(w, -2);
    wirke(w, "lebenshaltung", 2);
    return t("ev.energiepreisschock.standard");
  },
};

const HAUSHALT: Vorlage = {
  id: "haushaltsdruck",
  szene: "bank",
  frist: 12,
  abkuehlung: 400,
  chance: (w) => (w.economy.riskPremium > 450 || w.economy.debtRatio > 45 ? 0.4 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("ev.haushaltsdruck.titel"),
  text: (w) => [
    t("ev.haushaltsdruck.text1", { schulden: w.economy.debtRatio, rp: Math.round(w.economy.riskPremium) }),
    t("ev.haushaltsdruck.text2", { wer: anrede(figur(w, "finanzen")) }),
  ],
  warum: () => t("ev.haushaltsdruck.warum"),
  optionen: () => [
    opt("sparpaket", t("ev.haushaltsdruck.opt.sparpaket.label"), t("ev.haushaltsdruck.opt.sparpaket.beschr"), 6, (w) => {
      setFiscalImpulse(w, w.economy.fiscalImpulse - 1.5);
      wirke(w, "vertrauen_maerkte", 6);
      vertrauenAendern(w, -3);
      const f = figur(w, "finanzen");
      if (f) f.loyalitaet = Math.min(100, f.loyalitaet + 8);
      return t("ev.haushaltsdruck.opt.sparpaket.ausgang");
    }),
    opt("steuer", t("ev.haushaltsdruck.opt.steuer.label"), t("ev.haushaltsdruck.opt.steuer.beschr"), 6, (w) => {
      bucheFinanzsaldo(w.economy, -0.6);
      wirke(w, "steuereinnahmen", 4);
      wirke(w, "lebenshaltung", 3);
      vertrauenAendern(w, -2);
      return t("ev.haushaltsdruck.opt.steuer.ausgang");
    }),
    opt("wachstum", t("ev.haushaltsdruck.opt.wachstum.label"), t("ev.haushaltsdruck.opt.wachstum.beschr"), 0, (w) => {
      w.economy.riskPremium += 40;
      return t("ev.haushaltsdruck.opt.wachstum.ausgang");
    }),
  ],
  standard: (w) => {
    w.economy.riskPremium += 50;
    w.economy.credibility = clamp(w.economy.credibility - 0.03, 0.05, 0.95);
    return t("ev.haushaltsdruck.standard");
  },
};

/**
 * Vier Geschichten mit demselben Kern: öffentliches Geld, kein Wettbewerb, Nähe zur Regierung. Die Variante wird beim Eintreten gezogen,
 * damit sich Affären nicht wie Kopien lesen. Titel und Text stehen im Katalog unter `ev.korruptionsaffaere.v.<variante>.*`.
 */
const AFFAEREN = ["vergabe", "beschaffung", "klinik", "energie"] as const;
const affaere = (ev: OffenesEreignis): (typeof AFFAEREN)[number] => AFFAEREN[Number(ev.daten?.variante ?? 0)] ?? AFFAEREN[0];

const KORRUPTION: Vorlage = {
  id: "korruptionsaffaere",
  szene: "parlament",
  frist: 10,
  abkuehlung: 420,
  chance: (w) => 0.03 * (0.5 + nationalAverage(NET, w.net, "korruption") / 50) * (w.player?.partner.includes("Bauunternehmer") ? 1.6 : 1),
  // Es kommt eine der Geschichten, die am längsten nicht erzählt wurde (unter mehreren gleich alten entscheidet der Zufall)
  erzeuge: (w, rng) => {
    const alter = AFFAEREN.map((_, i) => w.spiel?.zuletzt[`korruptionsaffaere#${i}`] ?? -1e9);
    const aelteste = Math.min(...alter);
    const kandidaten = alter.flatMap((t, i) => (t === aelteste ? [i] : []));
    return { provinzen: [], staerke: 1, daten: { variante: kandidaten[Math.floor(rng.next() * kandidaten.length)]! } };
  },
  eroeffne: (w, ev) => {
    if (w.spiel) w.spiel.zuletzt[`korruptionsaffaere#${Number(ev.daten?.variante ?? 0)}`] = w.day;
  },
  titel: (_w, ev) => t(`ev.korruptionsaffaere.v.${affaere(ev)}.titel`),
  text: (w, ev) => {
    const v = affaere(ev);
    return [
      v === "vergabe" && w.player?.partner.includes("Bauunternehmer") ? t("ev.korruptionsaffaere.v.vergabe.familie") : t(`ev.korruptionsaffaere.v.${v}.text`),
      t("ev.korruptionsaffaere.text2", { wer: anrede(figur(w, "stab")) }),
    ];
  },
  warum: () => t("ev.korruptionsaffaere.warum"),
  optionen: () => [
    opt("aufklaeren", t("ev.korruptionsaffaere.opt.aufklaeren.label"), t("ev.korruptionsaffaere.opt.aufklaeren.beschr"), 3, (w) => {
      vertrauenAendern(w, -2);
      wirke(w, "korruption", -4);
      wirke(w, "justizvertrauen", 2);
      return t("ev.korruptionsaffaere.opt.aufklaeren.ausgang");
    }),
    opt("abwiegeln", t("ev.korruptionsaffaere.opt.abwiegeln.label"), t("ev.korruptionsaffaere.opt.abwiegeln.beschr"), 1, (w) => {
      vertrauenAendern(w, -3);
      wirke(w, "korruption", 2);
      wirke(w, "pressefreiheit", -1);
      return t("ev.korruptionsaffaere.opt.abwiegeln.ausgang");
    }),
    opt("opfern", t("ev.korruptionsaffaere.opt.opfern.label"), t("ev.korruptionsaffaere.opt.opfern.beschr"), 4, (w, _e, rng) => {
      vertrauenAendern(w, -0.5);
      const opfer = rng.next() < 0.5 ? "inneres" : "aussen";
      const alt = figur(w, opfer);
      const name = alt ? anrede(alt) : t("ev.korruptionsaffaere.opt.opfern.jemand");
      ersetze(w, opfer, rng);
      return t("ev.korruptionsaffaere.opt.opfern.ausgang", { wer: name });
    }),
  ],
  standard: (w) => {
    vertrauenAendern(w, -3);
    wirke(w, "korruption", 3);
    return t("ev.korruptionsaffaere.standard");
  },
};

const STREIK: Vorlage = {
  id: "streikwelle",
  szene: "istanbul",
  frist: 10,
  abkuehlung: 240,
  chance: (w) => (akutIn(w, "p_streiks").length > 0 ? 0.15 : w.economy.inflation > 25 && nationalAverage(NET, w.net, "realeinkommen") < 48 ? 0.08 : 0.008),
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => wertIn(w, "streikneigung", [pl]) ** 2 * (PROVINZEN[pl - 1]?.grossstadt ? 2 : 1), 3);
    return p.length ? { provinzen: p, staerke: 0.5 + 0.5 * rng.next() } : null;
  },
  titel: () => t("ev.streikwelle.titel"),
  text: (w, ev) => [
    t("ev.streikwelle.text1", { orte: orte(ev.provinzen), inflation: w.published.inflation.value }),
    t("ev.streikwelle.text2"),
  ],
  warum: () => t("ev.streikwelle.warum"),
  eroeffne: (w, ev) => {
    wirke(w, "produktivitaet", -3 * ev.staerke, ev.provinzen);
    wirke(w, "streikneigung", 4 * ev.staerke, ev.provinzen);
  },
  optionen: (_, ev) => [
    opt("lohn", t("ev.streikwelle.opt.lohn.label"), t("ev.streikwelle.opt.lohn.beschr"), 3, (w) => {
      kosten(w, 0.2);
      wirke(w, "streikneigung", -8 * ev.staerke, ev.provinzen);
      wirke(w, "arbeitnehmer", 4, ev.provinzen);
      wirke(w, "kostendruck", 3);
      return t("ev.streikwelle.opt.lohn.ausgang");
    }),
    opt("verbot", t("ev.streikwelle.opt.verbot.label"), t("ev.streikwelle.opt.verbot.beschr"), 5, (w) => {
      wirke(w, "streikneigung", -5 * ev.staerke, ev.provinzen);
      wirke(w, "polarisierung", 6);
      wirke(w, "rechtssicherheit", -4);
      wirke(w, "arbeitnehmer", -6);
      // Das Verbot ist Recht, kein Augenblick: Gewerkschaftsrechte sinken dauerhaft (Spielparameter: 25 Stufen)
      setPolicy(w, "m_gewerkschaftsrechte", Math.max(0, stufeIn(w, "m_gewerkschaftsrechte", null) - 25));
      return t("wort.streikverbot.ausgang");
    }),
    opt("vermitteln", t("ev.streikwelle.opt.vermitteln.label"), t("ev.streikwelle.opt.vermitteln.beschr"), 3, (w) => {
      wirke(w, "streikneigung", -4 * ev.staerke, ev.provinzen);
      wirke(w, "arbeitnehmer", 1);
      wirke(w, "unternehmer", -1);
      return t("ev.streikwelle.opt.vermitteln.ausgang");
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "produktivitaet", -3 * ev.staerke, ev.provinzen);
    vertrauenAendern(w, -1.5);
    return t("ev.streikwelle.standard");
  },
};

const MIETE: Vorlage = {
  id: "mietproteste",
  szene: "istanbul",
  frist: 10,
  abkuehlung: 300,
  chance: (w) => (akutIn(w, "p_wohnungsnot").length > 0 ? 0.12 : 0.005),
  erzeuge: (w, rng) => {
    const akut = akutIn(w, "p_wohnungsnot");
    const p = ziehe(rng, (pl) => (akut.includes(pl) ? (PROVINZEN[pl - 1]?.bevoelkerung ?? 0) : 0), 2);
    return p.length ? { provinzen: p, staerke: 0.5 + 0.5 * rng.next() } : null;
  },
  titel: () => t("ev.mietproteste.titel"),
  text: (_, ev) => [t("ev.mietproteste.text1", { orte: orte(ev.provinzen) }), t("ev.mietproteste.text2")],
  warum: () => t("ev.mietproteste.warum"),
  eroeffne: (w, ev) => {
    wirke(w, "junge", -3 * ev.staerke, ev.provinzen);
    wirke(w, "staedtische_saekulare", -2 * ev.staerke, ev.provinzen);
  },
  optionen: (_, ev) => [
    opt("deckel", t("ev.mietproteste.opt.deckel.label"), t("ev.mietproteste.opt.deckel.beschr"), 4, (w) => {
      wirke(w, "mieten", -6 * ev.staerke, ev.provinzen);
      wirke(w, "wohnungsbau", -3, ev.provinzen);
      wirke(w, "unternehmer", -2);
      return t("ev.mietproteste.opt.deckel.ausgang");
    }),
    // Befund A-4: Die Wirkung kommt sofort (Wohnungsnot und Rückhalt der Jungen in derselben Antwort); der Text sagt das jetzt
    opt("sozial", t("ev.mietproteste.opt.sozial.label"), t("ev.mietproteste.opt.sozial.beschr"), 3, (w) => {
      kosten(w, 0.2);
      wirke(w, "p_wohnungsnot", -3 * ev.staerke, ev.provinzen);
      wirke(w, "junge", 3, ev.provinzen);
      return t("ev.mietproteste.opt.sozial.ausgang");
    }),
    opt("raeumen", t("ev.mietproteste.opt.raeumen.label"), t("ev.mietproteste.opt.raeumen.beschr"), 2, (w) => {
      wirke(w, "polarisierung", 5);
      wirke(w, "pressefreiheit", -2);
      wirke(w, "junge", -5, ev.provinzen);
      wirke(w, "staedtische_saekulare", -5, ev.provinzen);
      return t("ev.mietproteste.opt.raeumen.ausgang");
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "junge", -3 * ev.staerke, ev.provinzen);
    vertrauenAendern(w, -1);
    return t("ev.mietproteste.standard");
  },
};

const FLUECHTLINGE: Vorlage = {
  id: "fluechtlingswelle",
  szene: "anatolien",
  frist: 10,
  abkuehlung: 400,
  chance: () => 0.018,
  erzeuge: (_, rng) => ({ provinzen: [...new Set([31, ...[...BORDER].filter(() => rng.next() < 0.6).slice(0, 3)])], staerke: 0.4 + 0.6 * rng.next() }),
  titel: () => t("ev.fluechtlingswelle.titel"),
  text: (w, ev) => [
    t("ev.fluechtlingswelle.text1", { orte: orte(ev.provinzen) }),
    t("ev.fluechtlingswelle.text2", { wer1: anrede(figur(w, "inneres")), wer2: anrede(figur(w, "aussen")) }),
  ],
  warum: () => t("ev.fluechtlingswelle.warum"),
  eroeffne: (w, ev) => {
    wirke(w, "gefluechtete", 6 * ev.staerke, ev.provinzen);
    wirke(w, "p_migrationsdruck", 5 * ev.staerke, ev.provinzen);
  },
  optionen: (_, ev) => [
    // Befund A-4: Die Antwort bucht keine Kritik von Menschenrechtlern, die EU-Beziehung steigt; der Text nennt jetzt, was geschieht
    opt("grenze", t("ev.fluechtlingswelle.opt.grenze.label"), t("ev.fluechtlingswelle.opt.grenze.beschr"), 4, (w) => {
      wirke(w, "gefluechtete", -5 * ev.staerke, ev.provinzen);
      wirke(w, "beziehungen_eu", 2);
      wirke(w, "konservative", 2);
      return t("ev.fluechtlingswelle.opt.grenze.ausgang");
    }),
    opt("aufnehmen", t("ev.fluechtlingswelle.opt.aufnehmen.label"), t("ev.fluechtlingswelle.opt.aufnehmen.beschr"), 3, (w) => {
      kosten(w, 0.25);
      wirke(w, "beziehungen_eu", 3);
      wirke(w, "p_migrationsdruck", 4 * ev.staerke, ev.provinzen);
      wirke(w, "konservative", -2);
      return t("ev.fluechtlingswelle.opt.aufnehmen.ausgang");
    }),
    // Befund A-4: Die Vereinbarung kommt immer zustande (EU-Geld, mehr Geflüchtete bleiben); kein „wenn es klappt“ mehr
    opt("eu", t("ev.fluechtlingswelle.opt.eu.label"), t("ev.fluechtlingswelle.opt.eu.beschr"), 5, (w) => {
      bucheFinanzsaldo(w.economy, -0.1);
      wirke(w, "beziehungen_eu", 2);
      wirke(w, "gefluechtete", 3 * ev.staerke, ev.provinzen);
      return t("ev.fluechtlingswelle.opt.eu.ausgang");
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "p_migrationsdruck", 6 * ev.staerke, ev.provinzen);
    vertrauenAendern(w, -1);
    return t("ev.fluechtlingswelle.standard");
  },
};

const ANSCHLAG: Vorlage = {
  id: "anschlag",
  szene: "istanbul",
  frist: 5,
  abkuehlung: 360,
  chance: (w) => 0.012 * (nationalAverage(NET, w.net, "terrorgefahr") / 50),
  erzeuge: (_, rng) => {
    const p = ziehe(rng, (pl) => (PROZ_STADT.has(pl) ? 3 : 0.5), 1);
    return p.length ? { provinzen: p, staerke: 1 } : null;
  },
  titel: (_, ev) => t("ev.anschlag.titel", { orte: orte(ev.provinzen) }),
  text: (w, ev) => [
    t("ev.anschlag.text1", { orte: orte(ev.provinzen) }),
    t("ev.anschlag.text2", { wer: anrede(figur(w, "inneres")) }),
  ],
  warum: () => t("ev.anschlag.warum"),
  eroeffne: (w) => {
    wirke(w, "terrorgefahr", 4);
    vertrauenAendern(w, -1);
  },
  optionen: () => [
    opt("paket", t("ev.anschlag.opt.paket.label"), t("ev.anschlag.opt.paket.beschr"), 4, (w) => {
      wirke(w, "terrorgefahr", -5);
      wirke(w, "pressefreiheit", -3);
      wirke(w, "rechtssicherheit", -2);
      wirke(w, "konservative", 3);
      wirke(w, "staedtische_saekulare", -2);
      // Das Paket gilt fort: mehr Personal und Befugnisse für Polizei und Gendarmerie (Spielparameter: 15 Stufen)
      setPolicy(w, "m_polizei", Math.min(100, stufeIn(w, "m_polizei", null) + 15));
      return t("wort.sicherheitspaket.ausgang");
    }),
    opt("besonnen", t("ev.anschlag.opt.besonnen.label"), t("ev.anschlag.opt.besonnen.beschr"), 2, (w) => {
      vertrauenAendern(w, 1.5);
      wirke(w, "terrorgefahr", -1);
      return t("ev.anschlag.opt.besonnen.ausgang");
    }),
  ],
  standard: (w) => {
    vertrauenAendern(w, -2);
    return t("ev.anschlag.standard");
  },
};


const WALDBRAND: Vorlage = {
  id: "waldbrand",
  szene: "anatolien",
  frist: 5,
  abkuehlung: 200,
  // Nur noch der Risiko-Layer (sim/katastrophe.ts) löst Großbrände aus, mit Fall und Abschluss; die Vorlage bleibt für ältere Spielstände.
  chance: () => 0,
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => (["Ege", "Akdeniz"].includes(PROVINZEN[pl - 1]?.region ?? "") ? 1 : 0.05), 2);
    return p.length ? { provinzen: p, staerke: 0.4 + 0.6 * rng.next() } : null;
  },
  titel: () => t("ev.waldbrand.titel"),
  text: (_, ev) => [t("ev.waldbrand.text1", { orte: orte(ev.provinzen) })],
  warum: () => t("ev.waldbrand.warum"),
  eroeffne: (w, ev) => {
    wirke(w, "tourismus", -5 * ev.staerke, ev.provinzen);
    wirke(w, "luftqualitaet", -4 * ev.staerke, ev.provinzen);
  },
  optionen: (_, ev) => [
    opt("loeschen", t("ev.waldbrand.opt.loeschen.label"), t("ev.waldbrand.opt.loeschen.beschr"), 3, (w) => {
      kosten(w, 0.1);
      wirke(w, "tourismus", 3 * ev.staerke, ev.provinzen);
      vertrauenAendern(w, 1);
      return t("ev.waldbrand.opt.loeschen.ausgang");
    }),
    opt("entschaedigen", t("ev.waldbrand.opt.entschaedigen.label"), t("ev.waldbrand.opt.entschaedigen.beschr"), 3, (w) => {
      kosten(w, 0.2);
      vertrauenAendern(w, 2 * ev.staerke);
      return t("ev.waldbrand.opt.entschaedigen.ausgang");
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "tourismus", -3 * ev.staerke, ev.provinzen);
    vertrauenAendern(w, -2 * ev.staerke);
    return t("ev.waldbrand.standard");
  },
};

const STROM: Vorlage = {
  id: "stromausfaelle",
  szene: "istanbul",
  frist: 7,
  abkuehlung: 240,
  chance: (w) => (nationalAverage(NET, w.net, "stromversorgung") < 50 || akutIn(w, "p_stromausfaelle").length > 0 ? 0.08 : 0.004),
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => (PROZ_STADT.has(pl) ? 2 : 0.6) * (100 - wertIn(w, "stromversorgung", [pl])), 3);
    return p.length ? { provinzen: p, staerke: 0.5 + 0.5 * rng.next() } : null;
  },
  titel: () => t("ev.stromausfaelle.titel"),
  text: (_, ev) => [t("ev.stromausfaelle.text1", { orte: orte(ev.provinzen) })],
  warum: () => t("ev.stromausfaelle.warum"),
  eroeffne: (w, ev) => {
    wirke(w, "stromversorgung", -6 * ev.staerke, ev.provinzen);
    wirke(w, "produktivitaet", -2 * ev.staerke, ev.provinzen);
  },
  optionen: (_, ev) => [
    opt("ration", t("ev.stromausfaelle.opt.ration.label"), t("ev.stromausfaelle.opt.ration.beschr"), 2, (w) => {
      wirke(w, "produktivitaet", -2, ev.provinzen);
      wirke(w, "stromversorgung", 3, ev.provinzen);
      return t("ev.stromausfaelle.opt.ration.ausgang");
    }),
    opt("import", t("ev.stromausfaelle.opt.import.label"), t("ev.stromausfaelle.opt.import.beschr"), 3, (w) => {
      kosten(w, 0.2);
      wirke(w, "stromversorgung", 5, ev.provinzen);
      wirke(w, "energieimporte", 2);
      return t("ev.stromausfaelle.opt.import.ausgang");
    }),
  ],
  standard: (w, ev) => {
    vertrauenAendern(w, -2 * ev.staerke);
    wirke(w, "produktivitaet", -2 * ev.staerke, ev.provinzen);
    return t("ev.stromausfaelle.standard");
  },
};

const AERZTE: Vorlage = {
  id: "aerztestreik",
  szene: "parlament",
  frist: 10,
  abkuehlung: 300,
  chance: (w) => (akutIn(w, "p_aerztemangel").length > 0 ? 0.08 : 0.004),
  erzeuge: (w, rng) => {
    const akut = akutIn(w, "p_aerztemangel");
    const p = ziehe(rng, (pl) => (akut.includes(pl) ? 1 : 0.05), 3);
    return p.length ? { provinzen: p, staerke: 0.5 + 0.5 * rng.next() } : null;
  },
  titel: () => t("ev.aerztestreik.titel"),
  text: (_, ev) => [t("ev.aerztestreik.text1", { orte: orte(ev.provinzen) })],
  warum: () => t("ev.aerztestreik.warum"),
  eroeffne: (w, ev) => {
    wirke(w, "wartezeiten", 5 * ev.staerke, ev.provinzen);
    wirke(w, "abwanderung", 3 * ev.staerke);
  },
  optionen: (_, ev) => [
    opt("gehalt", t("ev.aerztestreik.opt.gehalt.label"), t("ev.aerztestreik.opt.gehalt.beschr"), 3, (w) => {
      kosten(w, 0.2);
      wirke(w, "aerzte", 4 * ev.staerke, ev.provinzen);
      wirke(w, "abwanderung", -2);
      return t("ev.aerztestreik.opt.gehalt.ausgang");
    }),
    opt("ausland", t("ev.aerztestreik.opt.ausland.label"), t("ev.aerztestreik.opt.ausland.beschr"), 3, (w) => {
      wirke(w, "aerzte", 2 * ev.staerke, ev.provinzen);
      return t("ev.aerztestreik.opt.ausland.ausgang");
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "aerzte", -2 * ev.staerke, ev.provinzen);
    vertrauenAendern(w, -1);
    return t("ev.aerztestreik.standard");
  },
};

const PREISDECKEL: Vorlage = {
  id: "preisdeckel_knappheit",
  szene: "istanbul",
  frist: 10,
  abkuehlung: 300,
  chance: (w) => (nationalAverage(NET, w.net, "m_preiskontrollen") >= 60 ? 0.25 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("ev.preisdeckel_knappheit.titel"),
  text: () => [t("ev.preisdeckel_knappheit.text1")],
  warum: () => t("ev.preisdeckel_knappheit.warum"),
  eroeffne: (w) => {
    wirke(w, "schattenwirtschaft", 4);
    wirke(w, "lebenshaltung", 3);
  },
  optionen: () => [
    opt("lockern", t("ev.preisdeckel_knappheit.opt.lockern.label"), t("ev.preisdeckel_knappheit.opt.lockern.beschr"), 2, (w) => {
      setPolicy(w, "m_preiskontrollen", Math.max(0, nationalAverage(NET, w.net, "m_preiskontrollen") - 25));
      return t("ev.preisdeckel_knappheit.opt.lockern.ausgang");
    }),
    opt("importieren", t("ev.preisdeckel_knappheit.opt.importieren.label"), t("ev.preisdeckel_knappheit.opt.importieren.beschr"), 3, (w) => {
      kosten(w, 0.2);
      wirke(w, "lebensmittelpreise", -3);
      return t("ev.preisdeckel_knappheit.opt.importieren.ausgang");
    }),
    opt("durchhalten", t("ev.preisdeckel_knappheit.opt.durchhalten.label"), t("ev.preisdeckel_knappheit.opt.durchhalten.beschr"), 2, (w) => {
      wirke(w, "schattenwirtschaft", 6);
      wirke(w, "mittelstand", -3);
      return t("ev.preisdeckel_knappheit.opt.durchhalten.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "schattenwirtschaft", 3);
    vertrauenAendern(w, -1.5);
    return t("ev.preisdeckel_knappheit.standard");
  },
};

const MIETDECKEL: Vorlage = {
  id: "mietdeckel_folgen",
  szene: "istanbul",
  frist: 10,
  abkuehlung: 300,
  chance: (w) => (nationalAverage(NET, w.net, "m_mietdeckel") >= 60 ? 0.2 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("ev.mietdeckel_folgen.titel"),
  text: () => [t("ev.mietdeckel_folgen.text1")],
  warum: () => t("ev.mietdeckel_folgen.warum"),
  eroeffne: (w) => {
    wirke(w, "wohnungsbau", -4);
    wirke(w, "bauwirtschaft", -3);
  },
  optionen: () => [
    opt("ausnahme", t("ev.mietdeckel_folgen.opt.ausnahme.label"), t("ev.mietdeckel_folgen.opt.ausnahme.beschr"), 3, (w) => {
      wirke(w, "wohnungsbau", 4);
      wirke(w, "junge", -1);
      return t("ev.mietdeckel_folgen.opt.ausnahme.ausgang");
    }),
    opt("foerdern", t("ev.mietdeckel_folgen.opt.foerdern.label"), t("ev.mietdeckel_folgen.opt.foerdern.beschr"), 4, (w) => {
      kosten(w, 0.3);
      wirke(w, "wohnungsbau", 6);
      wirke(w, "bauwirtschaft", 3);
      return t("ev.mietdeckel_folgen.opt.foerdern.ausgang");
    }),
    opt("beibehalten", t("ev.mietdeckel_folgen.opt.beibehalten.label"), t("ev.mietdeckel_folgen.opt.beibehalten.beschr"), 0, (w) => {
      wirke(w, "wohnungsbau", -3);
      return t("ev.mietdeckel_folgen.opt.beibehalten.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "wohnungsbau", -3);
    return t("ev.mietdeckel_folgen.standard");
  },
};

export { zusageVorhaben };

/** Fällige Zusagen (aus dem Wahlkampf, Absprachen mit Fraktionen, Bündnispartner, Länder). Die Regeln stehen in sim/zusagen.ts. */
const ZUSAGE: Vorlage = {
  id: "zusage",
  szene: "parlament",
  frist: 20,
  abkuehlung: 0,
  chance: () => 0,
  erzeuge: () => null,
  titel: (w, ev) => t("ze.titel", { wer: zusageVon(w.spiel?.zusagen.find(z=>z.id===String(ev.daten?.zusage))?.von??"") }),
  text: (w, ev) => {
    const z=w.spiel?.zusagen.find(z=>z.id===String(ev.daten?.zusage));
    return z?[t("ze.text",{wer:zusageBezug(w,z).name,text:zusageText(z)}),t("ze.antwortFrist",{datum:formatDateDe(addDays(w.date,ev.frist-w.day))})]:[t("ze.veraltet")];
  },
  warum: () => t("ze.warum"),
  optionen: zusagenErinnerungsAntworten,
  standard: (w, ev) => {
    const z=aktuelleErinnerungsZusage(w,ev);
    return z?brecheZusage(w,z,true):t("ze.veraltet");
  },
};

/** Angebote anderer Fraktionen, wenn dem Lager die Mehrheit fehlt. */

const KOALITION: Vorlage = {
  id: "koalitionsangebot",
  szene: "parlament",
  frist: 30,
  abkuehlung: 240,
  chance: (w) => (w.spiel && w.parliament && w.player && w.spiel.figuren.length && lueckeJetzt(w) > 0 ? 0.1 : 0),
  erzeuge: (w, rng) => {
    const parl = w.parliament;
    if (!parl || !w.player) return null;
    const kandidaten = Object.entries(parl.seats)
      .filter(([k, s]) => s >= 15 && k !== w.player!.partei.kurz && !(w.spiel?.lager ?? []).includes(k) && FORDERUNG[k])
      .map(([k]) => k);
    if (!kandidaten.length) return null;
    const partei = kandidaten[Math.floor(rng.next() * kandidaten.length)]!;
    return { provinzen: [], staerke: 1, daten: { partei, sitze: parl.seats[partei] ?? 0 } };
  },
  titel: (_, ev) => t("ev.koalitionsangebot.titel", { partei: String(ev.daten?.partei) }),
  text: (w, ev) => {
    const partei = String(ev.daten?.partei);
    const f = forderungVon(w, partei);
    return [
      t("ev.koalitionsangebot.text1", { partei, sitze: w.parliament?.seats[partei] ?? 0 }),
      t("ev.koalitionsangebot.text2", { preis: f?.text ?? t("ev.koalitionsangebot.preis.allgemein") }),
    ];
  },
  warum: () => t("ev.koalitionsangebot.warum"),
  optionen: (w, ev) => [
    koalitionsAntwort(w, String(ev.daten?.partei), "zustimmen", t("ka.annehmen"), "z-koalition"),
    // Eine klare Absage kostet weniger Gesprächsbereitschaft als ein Angebot, das unbeantwortet verfällt (Spielparameter −5 / −10)
    opt("ablehnen", t("ev.koalitionsangebot.opt.ablehnen.label"), t("ev.koalitionsangebot.opt.ablehnen.beschr"), 0, (w) => {
      bereitschaftAendern(w, String(ev.daten?.partei), -5);
      return t("ev.koalitionsangebot.opt.ablehnen.ausgang");
    }),
  ],
  standard: (w, ev) => {
    bereitschaftAendern(w, String(ev.daten?.partei), -10);
    return t("ev.koalitionsangebot.standard");
  },
};

function lueckeJetzt(w: World): number {
  const parl = w.parliament;
  const player = w.player;
  if (!parl || !player) return 0;
  const lager = [player.partei.kurz, ...(w.spiel?.lager ?? [])].reduce((s, p) => s + (parl.seats[p] ?? 0), 0);
  return Math.max(0, 301 - lager);
}

// Erster Spieltag (Entscheidungen E): drei drängende Vorgänge, am Abend eine erste echte Entscheidung

const START_HAUSHALT: Vorlage = {
  id: "start_haushalt",
  szene: "bank",
  frist: 30,
  abkuehlung: 0,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("ev.start_haushalt.titel"),
  text: (w) => [
    t("ev.start_haushalt.text1", { wer: anrede(figur(w, "finanzen")), inflation: w.published.inflation.value, schulden: w.economy.debtRatio }),
    t("ev.start_haushalt.text2"),
  ],
  warum: () => t("ev.start_haushalt.warum"),
  optionen: () => [
    opt("sparen", t("ev.start_haushalt.opt.sparen.label"), t("ev.start_haushalt.opt.sparen.beschr"), 3, (w) => {
      setFiscalImpulse(w, w.economy.fiscalImpulse - 1);
      wirke(w, "vertrauen_maerkte", 4);
      vertrauenAendern(w, -1);
      const f = figur(w, "finanzen");
      if (f) f.loyalitaet = Math.min(100, f.loyalitaet + 8);
      return t("ev.start_haushalt.opt.sparen.ausgang");
    }),
    opt("mitte", t("ev.start_haushalt.opt.mitte.label"), t("ev.start_haushalt.opt.mitte.beschr"), 0, () => t("ev.start_haushalt.opt.mitte.ausgang")),
    opt("wachstum", t("ev.start_haushalt.opt.wachstum.label"), t("ev.start_haushalt.opt.wachstum.beschr"), 3, (w) => {
      setFiscalImpulse(w, w.economy.fiscalImpulse + 1.5);
      vertrauenAendern(w, 1);
      const f = figur(w, "finanzen");
      if (f) f.loyalitaet = Math.max(0, f.loyalitaet - 8);
      return t("ev.start_haushalt.opt.wachstum.ausgang");
    }),
  ],
  standard: () => t("ev.start_haushalt.standard"),
};

/** Was der Partner einfordert: die offene Zusage an ihn (in der aktuellen Sprache), sonst die allgemeine Erinnerung. */
function partnerZusage(w: World, partei: string): string {
  const z = w.spiel?.zusagen.find((x) => x.von === partei && !x.erfuellt && !x.gebrochen);
  return (z ? zusageText(z) : t("ev.start_partner.zusage.allgemein")).trim().replace(/\.$/, "");
}

const START_PARTNER: Vorlage = {
  id: "start_partner",
  szene: "parlament",
  frist: 30,
  abkuehlung: 0,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: (w) => (w.player?.buendnis ? t("ev.start_partner.titel", { partei: w.player.buendnis }) : t("ev.start_partner.opposition.titel")),
  text: (w) => {
    const partei = w.player?.buendnis;
    if (!partei) return [t("ev.start_partner.opposition.text1")];
    // Befund A (Wortprüfung): „Der Vorsitz der YENİ“ → die Vorsitzende bzw. der Vorsitzende mit Namen, sonst die Parteiführung
    const f = aktiveParteivorsitzende(w, partei)[0];
    return [t("ev.start_partner.text1", { partei, g: f ? (f.weiblich ? "f" : "m") : "x", name: f?.name ?? "", zusage: partnerZusage(w, partei) })];
  },
  warum: () => t("ev.start_partner.warum"),
  optionen: (w) => {
    const partei = w.player?.buendnis;
    if (!partei) return START_OPPOSITION_OPTIONEN();
    const z = w.spiel?.zusagen.find((x) => x.von===partei && istMinisterienZusage(x) && !x.erfuellt && !x.gebrochen);
    const partner = (ww: World, d: number) => {
      for(const f of aktiveParteivorsitzende(ww,partei)) f.loyalitaet = clamp(f.loyalitaet + d, 0, 100);
    };
    if (z) {
      // Die Zusage „zwei Ministerien“: Wer großzügig ist, gibt die Ressorts wirklich ab (sim/ressortvergabe.ts)
      const zwei = ressortNamen(naechsteRessorts(w, z.von, 2));
      const eins = ressortNamen(naechsteRessorts(w, z.von, 1));
      return [
        opt("grosszuegig", t("wort.partner.zwei.titel"), t("wort.partner.zwei.text", { ressorts: zwei, partei: PARTEI_NAME[z.von] ?? z.von }), 4, (ww) => {
          const vergeben = ministerienAnPartei(ww, z.von, 2);
          if (vergeben.length >= 2) {
            z.erfuellt = true;
            zusageAbschluss(ww, z, "erfuellt");
          }
          partner(ww, 12);
          return t("wort.partner.zwei.ausgang", { partei: PARTEI_NAME[z.von] ?? z.von, ressorts: ressortNamen(vergeben) });
        }),
        opt("knapp", t("wort.partner.eins.titel"), t("wort.partner.eins.text", { ressorts: eins, partei: PARTEI_NAME[z.von] ?? z.von }), 2, (ww) => {
          const vergeben = ministerienAnPartei(ww, z.von, 1);
          z.faellig = ww.day + 90;
          partner(ww, 3);
          return t("wort.partner.eins.ausgang", { partei: PARTEI_NAME[z.von] ?? z.von, ressorts: ressortNamen(vergeben) });
        }),
        opt("vertagen", t("wort.partner.vertagen.titel"), t("wort.partner.vertagen.text"), 0, (ww) => {
          partner(ww, -10);
          return t("wort.partner.vertagen.ausgang");
        }),
      ];
    }
    // Andere Bündniszusagen: ehrlich, was die Antwort tut (Zuwendung, keine Erfüllung der konkreten Forderung)
    return [
      opt("grosszuegig", t("wort.partner.zuwendung.titel"), t("wort.partner.zuwendung.text"), 4, (ww) => {
        partner(ww, 12);
        return t("wort.partner.zuwendung.ausgang", { partei: PARTEI_NAME[partei] ?? partei });
      }),
      opt("knapp", t("ev.start_partner.opt.knapp.label"), t("ev.start_partner.opt.knapp.beschr"), 1, (ww) => {
        partner(ww, 3);
        return t("ev.start_partner.opt.knapp.ausgang");
      }),
      opt("vertagen", t("ev.start_partner.opt.vertagen.label"), t("ev.start_partner.opt.vertagen.beschr"), 0, (ww) => {
        partner(ww, -10);
        return t("ev.start_partner.opt.vertagen.ausgang");
      }),
    ];
  },
  standard: () => t("ev.start_partner.standard"),
};

const START_OPPOSITION_OPTIONEN = (): Option[] => [
  opt("liste", t("ev.start_partner.opposition.opt.liste.label"), t("ev.start_partner.opposition.opt.liste.beschr"), 2, (ww) => {
    vertrauenAendern(ww, 1);
    return t("ev.start_partner.opposition.opt.liste.ausgang");
  }),
  opt("abwarten", t("ev.start_partner.opposition.opt.abwarten.label"), t("ev.start_partner.opposition.opt.abwarten.beschr"), 0, () => t("ev.start_partner.opposition.opt.abwarten.ausgang")),
];

const ERDBEBEN_REGION = [31, 46, 2, 44, 27, 80, 1, 21, 63, 79, 23];

const START_WIEDERAUFBAU: Vorlage = {
  id: "start_wiederaufbau",
  szene: "anatolien",
  frist: 30,
  abkuehlung: 0,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("ev.start_wiederaufbau.titel"),
  text: (w) => [t("ev.start_wiederaufbau.text1"), t("ev.start_wiederaufbau.text2", { wer: anrede(figur(w, "stab")) })],
  warum: () => t("ev.start_wiederaufbau.warum"),
  optionen: () => [
    opt("chefsache", t("ev.start_wiederaufbau.opt.chefsache.label"), t("ev.start_wiederaufbau.opt.chefsache.beschr"), 6, (w) => {
      kosten(w, 0.4);
      wirke(w, "wohnungsbau", 6, ERDBEBEN_REGION);
      wirke(w, "p_wohnungsnot", -5, ERDBEBEN_REGION);
      wirke(w, "korruption", 1.5);
      vertrauenAendern(w, 1.5);
      return t("ev.start_wiederaufbau.opt.chefsache.ausgang");
    }),
    opt("sauber", t("ev.start_wiederaufbau.opt.sauber.label"), t("ev.start_wiederaufbau.opt.sauber.beschr"), 4, (w) => {
      kosten(w, 0.2);
      wirke(w, "wohnungsbau", 3, ERDBEBEN_REGION);
      wirke(w, "erdbebenvorsorge", 3, ERDBEBEN_REGION);
      wirke(w, "bauqualitaet", 3, ERDBEBEN_REGION);
      return t("ev.start_wiederaufbau.opt.sauber.ausgang");
    }),
    opt("weiter", t("ev.start_wiederaufbau.opt.weiter.label"), t("ev.start_wiederaufbau.opt.weiter.beschr"), 0, (w) => {
      vertrauenAendern(w, -0.5);
      return t("ev.start_wiederaufbau.opt.weiter.ausgang");
    }),
  ],
  standard: () => t("ev.start_wiederaufbau.standard"),
};

export const VORLAGEN: Vorlage[] = [
  ERDBEBEN, DUERRE, WAEHRUNG, ENERGIE, HAUSHALT, KORRUPTION, STREIK, MIETE, FLUECHTLINGE, ANSCHLAG, WALDBRAND, STROM, AERZTE, PREISDECKEL, MIETDECKEL, KOALITION,
  ZUSAGE, START_HAUSHALT, START_PARTNER, START_WIEDERAUFBAU,
  ...KATASTROPHE_VORLAGEN,
  ...INNEN_VORLAGEN, ...AUSSEN_VORLAGEN, ...INITIATIVE_VORLAGEN, ...REICH_VORLAGEN, ...PERSONEN_VORLAGEN, ...MACHTKREIS_VORLAGEN, ...VERFASSUNG_VORLAGEN, ...WAHL_VORLAGEN, ...KRIEG_VORLAGEN, ...EU_VORLAGEN, ...VERMITTLUNG_VORLAGEN, ...WELT_VORLAGEN, ...SAISON_VORLAGEN,
];

/** Womit man die Ursache eines Ereignisses selbst regeln kann (statt nur zu reagieren). */
const EREIGNIS_MASSNAHMEN: Record<string, string[]> = {
  erdbeben: ["m_bauaufsicht", "m_stadterneuerung"],
  grossbeben: ["m_afad_ausbau", "m_gebaeudeverstaerkung", "m_bauaufsicht", "m_stadterneuerung"],
  katastrophe_flut: ["m_afad_ausbau", "m_staudaemme", "m_regionalfoerderung"],
  katastrophe_waldbrand: ["m_afad_ausbau", "m_umweltauflagen"],
  katastrophe_duerre: ["m_bewaesserung", "m_wasserleitungen", "m_agrarsubventionen"],
  duerre: ["m_bewaesserung", "m_wasserleitungen", "m_agrarsubventionen"],
  energiepreisschock: ["m_energiesubventionen", "m_solar_wind", "m_speicher_smartgrid"],
  korruptionsaffaere: ["m_antikorruption", "m_justizreform"],
  streikwelle: ["m_mindestlohn", "m_gewerkschaftsrechte"],
  mietproteste: ["m_mietdeckel", "m_sozialwohnungen", "m_baukredite"],
  fluechtlingswelle: ["m_integration", "m_grenzschutz", "m_rueckkehr"],
  anschlag: ["m_polizei", "m_polizeitechnik"],
  waldbrand: ["m_umweltauflagen"],
  stromausfaelle: ["m_netzausbau", "m_speicher_smartgrid"],
  aerztestreik: ["m_aerztegehalt", "m_krankenhausbau"],
  preisdeckel_knappheit: ["m_preiskontrollen"],
  mietdeckel_folgen: ["m_mietdeckel", "m_baukredite"],
  mindestlohn: ["m_mindestlohn"],
  bergwerksunglueck: ["m_gewerkschaftsrechte", "m_antikorruption"],
  ueberschwemmung: ["m_staudaemme", "m_regionalfoerderung", "m_autobahnen"],
  bankenstress: ["m_bankenaufsicht", "m_kreditgarantien"],
  studentenproteste: ["m_stipendien", "m_wissenschaftsfreiheit", "m_unigruendungen"],
  pressekonflikt: ["m_medienaufsicht", "m_internetsperren"],
  bauamnestie_forderung: ["m_bauamnestie", "m_bauaufsicht"],
  rentnerprotest: ["m_renten"],
  grippewelle: ["m_krankenhausbau", "m_hausarzt", "m_aerztegehalt"],
  bauernproteste: ["m_agrarsubventionen", "m_bewaesserung", "m_saatgut"],
  fabrikschliessungen: ["m_industrie_modernisierung", "m_kreditgarantien", "m_ausbildung"],
  buergermeister_verfahren: ["m_justizreform"],
  tourismusrekord: ["m_tourismuswerbung"],
  grenzzwischenfall: ["m_grenzschutz", "m_verteidigung"],
  eu_angebot: ["m_eu_annaeherung", "m_justizreform"],
  gasvertrag: ["m_gasfoerderung", "m_solar_wind"],
  gasfund: ["m_gasfoerderung"],
  cyberangriff: ["m_smart_infrastruktur"],
  weltwirtschaftskrise: ["m_kmu", "m_kreditgarantien", "m_investitionsanreize"],
  pandemie: ["m_krankenhausbau", "m_hausarzt", "m_medizintechnik"],
  erbe_raubgrabung: ["m_archaeologie", "m_polizei"],
  erbe_erdbebenschaden: ["m_bauaufsicht", "m_denkmalschutz"],
  recht_ernennung: ["m_justizreform", "m_richterrat"],
  recht_haftrevolte: ["m_haftvermeidung", "m_richterstellen"],
  mil_lieferverzug: ["m_verteidigung", "m_ruestungsindustrie"],
  infra_bauunfall: ["m_bauaufsicht", "m_instandhaltung"],
};
for (const v of VORLAGEN) if (EREIGNIS_MASSNAHMEN[v.id]) v.massnahmen = EREIGNIS_MASSNAHMEN[v.id]!;

/**
 * Gedächtnis (Takt): Welche Antwort später als eigenes Ereignis zurückkommt. Ein Folgehaken öffnet nach den genannten Tagen (gewürfelt), wenn
 * seine Bedingung dann noch gilt; die Ursache steht in der Chronik der Antwort. Die Folgen sind schwelende Folgen der Entscheidung, keine
 * neuen Zufälle: Ein Mietdeckel bremst den Neubau, ein Streikverbot nährt neue Proteste, eine eingefrorene Lohnrunde die nächste Streikwelle.
 */
const EREIGNIS_FOLGEN: Record<string, NonNullable<Vorlage["folgen"]>> = {
  mietproteste: {
    deckel: { vorlage: "mietdeckel_folgen", nach: [150, 330] },
    raeumen: { vorlage: "studentenproteste", nach: [60, 180] },
  },
  mindestlohn: {
    einfrieren: { vorlage: "streikwelle", nach: [90, 240], bedingung: (w) => nationalAverage(NET, w.net, "streikneigung") > 35 },
    aussetzen: { vorlage: "streikwelle", nach: [90, 240], bedingung: (w) => nationalAverage(NET, w.net, "streikneigung") > 35 },
    halten: { vorlage: "streikwelle", nach: [120, 300], bedingung: (w) => nationalAverage(NET, w.net, "streikneigung") > 40 },
    kraeftig: { vorlage: "fabrikschliessungen", nach: [150, 360], bedingung: (w) => nationalAverage(NET, w.net, "kostendruck") > 45 },
    trotzdem: { vorlage: "fabrikschliessungen", nach: [120, 300], bedingung: (w) => w.economy.unemployment > 8 },
  },
  haushaltsjahr: {
    fortschreiben: { vorlage: "haushaltsdruck", nach: [120, 300], bedingung: (w) => w.economy.deficit > 4 },
    wahlgeschenke: { vorlage: "haushaltsdruck", nach: [200, 400], bedingung: (w) => w.economy.deficit > 3.5 },
  },
  korruptionsaffaere: { abwiegeln: { vorlage: "pressekonflikt", nach: [60, 200] } },
  streikwelle: { verbot: { vorlage: "streikwelle", nach: [120, 240], bedingung: (w) => nationalAverage(NET, w.net, "streikneigung") > 40 } },
  studentenproteste: { raeumen: { vorlage: "pressekonflikt", nach: [60, 150] } },
  pressekonflikt: { haerte: { vorlage: "studentenproteste", nach: [60, 180] } },
  waehrungsrutsch: { ruhe: { vorlage: "bankenstress", nach: [90, 240], bedingung: (w) => w.economy.riskPremium > 450 } },
  fluechtlingswelle: { grenze: { vorlage: "grenzzwischenfall", nach: [90, 240] } },
  buergermeister_verfahren: { verwalter: { vorlage: "pressekonflikt", nach: [60, 180] } },
};
for (const v of VORLAGEN) {
  const f = EREIGNIS_FOLGEN[v.id];
  if (f && !v.folgen) v.folgen = f;
}

// ---------------------------------------------------------------------------
// ZEI-1: Ereignis-Wettbewerb (VERBESSERUNGSPLAN_2026-09-30, Vorbild D4)
// Pro Monat konkurrieren die ausgelösten Kandidaten um wenige Präsentations-Slots; die Dringlichkeit
// entscheidet. Der Rest wird „ausgesessen“ (Standardfolge tritt ein) oder „eskaliert still“ (gärt weiter
// und kommt dringlicher zurück) — beides mit Haken in der Chronik, damit es nachvollziehbar bleibt.

/** Slots und Eskalations-Schub je Schwierigkeit: entspannt 3, normal 2, hart 2 — aber hart mit höherer Eskalationschance. */
export const EREIGNIS_WETTBEWERB = {
  /** Präsentations-Slots je Monat (feste Termine des Staatsjahres zählen nicht dagegen) */
  slots: { entspannt: 3, normal: 2, hart: 2 },
  /** Wie stark gärende Vorgänge zurückkommen (Chance und Stärke je Eskalationsstufe) */
  eskalationsSchub: { entspannt: 0.8, normal: 1, hart: 1.5 },
  /** Höchste Eskalationsstufe eines gärenden Vorgangs */
  maxStufe: 3,
  /** Multiplikativer Schub auf die Monatschance je Eskalationsstufe */
  chanceSchub: 1.2,
  /** Stärke-Zuschlag je Eskalationsstufe, wenn der Vorgang schließlich auf den Tisch kommt */
  staerkeSchub: 0.15,
} as const;

/**
 * Akute Einzelfälle (das Beben, der Anschlag, der Markteinbruch sind geschehen, ob man hinsieht oder nicht)
 * und verfallende Angebote oder Fristen: Sie werden „ausgesessen“ — die Standardfolge tritt im Hintergrund ein.
 * Alle übrigen Vorlagen sind schwelende Konflikte und eskalieren still.
 */
const AUSGESSESSEN = new Set([
  "erdbeben", "anschlag", "waldbrand", "ueberschwemmung", "bergwerksunglueck", "grippewelle",
  "cyberangriff", "erbe_erdbebenschaden", "erbe_raubgrabung", "infra_bauunfall",
  "waehrungsrutsch", "energiepreisschock", "haushaltsdruck", "ratingagentur", "bankenstress",
  "weltwirtschaftskrise", "pandemie", "grenzzwischenfall",
  "eu_angebot", "iwf_angebot", "nato_ratifizierung", "gasfund", "land_angebot", "tourismusrekord",
  "erbe_fund", "kanal_istanbul", "vertrag_verlaengerung", "gasvertrag", "mil_militaerrat", "recht_ernennung",
]);

/** Schwere der Standardfolge für die Dringlichkeit (1 = normal): Je schlimmer das Ausgesessen-Werden, desto weiter vorn der Vorgang. */
const SCHWERE: Record<string, number> = {
  erdbeben: 3, anschlag: 3, pandemie: 3, weltwirtschaftskrise: 3,
  bankenstress: 2.5, waehrungsrutsch: 2.5, ueberschwemmung: 2.5, bergwerksunglueck: 2.5,
  energiepreisschock: 2.2, haushaltsdruck: 2.2,
  ratingagentur: 2, cyberangriff: 2, grenzzwischenfall: 2, streikwelle: 2, korruptionsaffaere: 2,
  duerre: 2, fluechtlingswelle: 2, waldbrand: 2,
  land_fordert: 1.8, land_drohkulisse: 2.2, recht_haftrevolte: 1.8,
  grippewelle: 1.6, stromausfaelle: 1.6,
  aerztestreik: 1.5, mietproteste: 1.5, fabrikschliessungen: 1.5, bauernproteste: 1.5,
  person_ruecktritt: 1.5, infra_bauunfall: 1.5, preisdeckel_knappheit: 1.5,
  buergermeister_verfahren: 1.4, studentenproteste: 1.4, pressekonflikt: 1.4, rentnerprotest: 1.4,
  erbe_erdbebenschaden: 1.4, vertrag_verlaengerung: 1.4, gasvertrag: 1.4, land_provokation: 1.4,
  person_intrige: 1.4, mietdeckel_folgen: 1.4,
  mil_lieferverzug: 1.3, person_skandal: 1.3, person_leck: 1.2,
};
for (const v of VORLAGEN) {
  if (AUSGESSESSEN.has(v.id)) v.wettbewerb = "aussitzen";
  if (SCHWERE[v.id] !== undefined) v.schwere = SCHWERE[v.id];
}

/**
 * Dringlichkeit im Monatswettbewerb: Schwere der Standardfolge, Stärke des Falls, Fristnähe,
 * Neuheit des Themas (was lange nicht drankam, wird wieder interessant) und Eskalationsstufe.
 */
function dringlichkeit(world: World, v: Vorlage, staerke: number): number {
  const spiel = world.spiel!;
  const fristNaehe = 12 / Math.max(4, v.frist);
  const neuheit = 1 + Math.min(1.5, (world.day - (spiel.zuletzt[v.id] ?? 0)) / 365);
  const stufe = spiel.eskalation?.[v.id] ?? 0;
  return (v.schwere ?? 1) * (0.6 + 0.4 * staerke) * fristNaehe * neuheit * (1 + 0.7 * stufe);
}

const VORLAGE_NACH_ID = new Map(VORLAGEN.map((v) => [v.id, v]));

/**
 * Die Antworten eines Ereignisses. Gibt es keine kostenlose, kommt immer „Abwarten“ dazu: Wer kein Kapital hat, soll nicht vor lauter grauen
 * Knöpfen stehen, sondern die Standardfolge bewusst in Kauf nehmen können.
 */
export function antworten(w: World, ev: OffenesEreignis): Option[] {
  const v = vorlage(ev.vorlage);
  const optionen = v.optionen(w, ev);
  if (optionen.some((o) => !o.sperre && (o.anzeigePk ?? o.pk) === 0)) return optionen;
  return [
    ...optionen,
    {
      id: "aussitzen",
      label: t("ev.abwarten.label"),
      beschreibung: t("ev.abwarten.beschr"),
      pk: 0,
      wirkung: (ww, e, rng) => v.standard(ww, e, rng),
    },
  ];
}

export function vorlage(id: string): Vorlage {
  const v = VORLAGE_NACH_ID.get(id);
  if (!v) throw new Error(`Unbekannte Ereignisvorlage: ${id}`);
  return v;
}

// ---------------------------------------------------------------------------
// Motor

export const MAX_OFFEN = 3;
/** Was Schweigen bis zur Frist zusätzlich an Zustimmung kostet (Spielparameter); das Fenster nennt dieselbe Zahl. */
export const SCHWEIGEN_ZUSTIMMUNG = 0.8;

/**
 * Takt der Ereignisse (alle Werte Spielparameter): Der Monatswettbewerb legt nur die Sieger fest; sie öffnen verteilt über den Monat
 * (Messung vom 05.10.: 96 % der Entscheidungen öffneten am Monatsersten, 60 % der Zeit lagen in Lücken über 60 Tagen).
 */
export const TAKT = {
  /** Der erste Eröffnungstag liegt 1 bis 6 Tage nach dem Monatsersten */
  ersterVersatz: 6,
  /** Abstand zwischen zwei Eröffnungen desselben Monats, in Tagen */
  abstandMin: 6,
  abstandMax: 8,
  /** Spätester Eröffnungstag (Tage nach dem Monatsersten), damit alles im selben Monat bleibt */
  letzterTag: 26,
  /** Ist die Obergrenze offener Vorgänge erreicht, rückt ein geplanter Vorgang um diese Tage nach … */
  verschiebungTage: 3,
  /** … höchstens so oft, danach greift die Verliererbehandlung (ausgesessen oder gärt weiter) */
  maxVerschiebungen: 4,
  /** Fällige Zusagen öffnen höchstens eine je Tag und höchstens zwei gleichzeitig (Messung: bis zu 10 an einem Tag) */
  zusageProTag: 1,
  zusageGleichzeitig: 2,
  /** … und zwischen zwei eingeforderten Zusagen liegen mindestens so viele Tage (Messung 05.10.: sonst zehn Zusagen an zehn Tagen hintereinander) */
  zusageAbstand: 4,
  /** Ein Folgehaken wartet höchstens so lange auf einen freien Platz, danach verfällt er */
  folgeWartetTage: 30,
} as const;

/** Vorlagen, deren Öffnen den Präsidenten sofort belastet (Eskalation im eigenen Land oder an den Grenzen). */
const ESKALATION_VORLAGEN = new Set(["anschlag", "cyberangriff", "waehrungsrutsch", "weltwirtschaftskrise", "bankenstress", "pandemie", "land_provokation", "land_drohkulisse", "grenzzwischenfall", "grossbeben", "katastrophe_flut"]);

/** Was eine Vorlage bei Auslösung erzeugt (Ort, Stärke, Daten); Felder dürfen fehlen. */
type Erzeugung = { provinzen?: number[]; staerke?: number; daten?: Record<string, number | string> };

/** Baut das offene Ereignis aus Vorlage und Erzeugung — gleichermaßen für präsentierte und für ausgesessene Vorgänge. */
function baueEreignis(world: World, v: Vorlage, gen: Erzeugung): OffenesEreignis {
  const spiel = world.spiel!;
  const ev: OffenesEreignis = {
    id: `${v.id}-${world.day}-${spiel.ereignisse.length}`,
    vorlage: v.id,
    tag: world.day,
    frist: world.day + v.frist,
    provinzen: gen.provinzen ?? [],
    staerke: (gen.staerke ?? 1) * schutzFuer(world, v.id) * (v.id.startsWith("start_") || v.id === "zusage" ? 1 : schwierig(world).haerte),
  };
  if (gen.daten) ev.daten = gen.daten;
  return ev;
}

export function oeffne(world: World, vorlageId: string, rng: Rng, params?: { provinzen?: number[]; staerke?: number; daten?: Record<string, number | string> }): OffenesEreignis | null {
  const spiel = world.spiel;
  if (!spiel) return null;
  const v = vorlage(vorlageId);
  const gen = params ?? v.erzeuge(world, rng);
  if (!gen) return null;
  const ev = baueEreignis(world, v, gen);
  spiel.ereignisse.push(ev);
  spiel.zuletzt[vorlageId] = world.day;
  v.eroeffne?.(world, ev, rng);
  addLog(world, "ereignis", v.titel(world, ev), v.text(world, ev)[0]);
  if (ESKALATION_VORLAGEN.has(vorlageId)) belastungEreignis(world, VERFASSUNG.eskalation, t("n5.eskalation", { titel: v.titel(world, ev) }));
  return ev;
}

/**
 * Einmal im Monat: Vorlagen würfeln. Der Zufall wird für jede Vorlage gezogen, damit der Verlauf stabil bleibt.
 * ZEI-1: Ausgelöste Kandidaten konkurrieren um die Präsentations-Slots des Monats (EREIGNIS_WETTBEWERB.slots),
 * sortiert nach Dringlichkeit. Alle bisherigen Bedingungen (Chance, Abkühlung, Dichte-Dämpfung, MAX_OFFEN,
 * feste Termine) gelten weiter — der Wettbewerb ersetzt keine davon, er verteilt nur die Slots.
 */
export function ereignisMonat(world: World, rng: Rng): void {
  const spiel = world.spiel;
  if (!spiel || spiel.ende) return;
  const grad = spiel.schwierigkeit ?? "normal";
  const schub = EREIGNIS_WETTBEWERB.eskalationsSchub[grad];
  const eskalation = spiel.eskalation ?? (spiel.eskalation = {});
  const offenNormal = () => spiel.ereignisse.filter((e) => !e.vorlage.startsWith("start_")).length;
  const geplantNormal = () => (spiel.geplant ?? []).filter((g) => !TERMINE.has(g.vorlage)).length;

  // 1. Kandidaten sammeln: Chance, Abkühlung, Dichte und Obergrenze wie bisher; gärende Vorgänge kommen eher wieder
  const kandidaten: { v: Vorlage; gen: Erzeugung }[] = [];
  for (const v of VORLAGEN) {
    const u = rng.next();
    const basis = v.chance(world);
    if (basis <= 0) continue;
    if (offenNormal() + geplantNormal() >= MAX_OFFEN) continue;
    if (spiel.ereignisse.some((e) => e.vorlage === v.id) || spiel.geplant?.some((g) => g.vorlage === v.id)) continue;
    if (world.day - (spiel.zuletzt[v.id] ?? -1e9) < v.abkuehlung) continue;
    const stufe = eskalation[v.id] ?? 0;
    const eskFaktor = stufe > 0 ? 1 + EREIGNIS_WETTBEWERB.chanceSchub * stufe * schub : 1;
    if (u >= basis * EREIGNIS_RATE * schwierig(world).ereignisse * alterFaktor(world, v.id) * dichteFaktor(world, v.id) * eskFaktor) continue;
    const gen = v.erzeuge(world, rng);
    if (!gen) continue;
    kandidaten.push({ v, gen });
  }
  if (!kandidaten.length) return;

  // AUS-1 (Eigeninitiative): Pro Monat klopft höchstens eine Länder-Initiative an — die mit dem schwersten
  // Treiber (daten.gewicht). Die übrigen warten still: Ihre Treiber stehen ja weiter, sie kommen später
  // wieder, statt die Chronik mit Haken zu füllen.
  const initiativeK = kandidaten.filter((k) => INITIATIVE_VORLAGE_IDS.has(k.v.id));
  if (initiativeK.length > 1) {
    initiativeK.sort((a, b) => Number(b.gen.daten?.gewicht ?? 0) - Number(a.gen.daten?.gewicht ?? 0) || VORLAGEN.indexOf(a.v) - VORLAGEN.indexOf(b.v));
    const beste = initiativeK[0]!;
    for (let i = kandidaten.length - 1; i >= 0; i--) if (INITIATIVE_VORLAGE_IDS.has(kandidaten[i]!.v.id) && kandidaten[i] !== beste) kandidaten.splice(i, 1);
  }
  if (!kandidaten.length) return;

  // 2. Der Wettbewerb: feste Termine des Staatsjahres kommen immer; der Rest sortiert nach Dringlichkeit um die Slots
  const feste = kandidaten.filter((k) => TERMINE.has(k.v.id));
  const rest = kandidaten.filter((k) => !TERMINE.has(k.v.id));
  rest.sort((a, b) => dringlichkeit(world, b.v, b.gen.staerke ?? 1) - dringlichkeit(world, a.v, a.gen.staerke ?? 1) || VORLAGEN.indexOf(a.v) - VORLAGEN.indexOf(b.v));
  const slots = EREIGNIS_WETTBEWERB.slots[grad];
  const gewinner = [...feste, ...rest.slice(0, slots)];
  const verlierer = rest.slice(slots);

  // AUS-1 (Eigeninitiative): höchstens eine Länder-Initiative pro Monat gesamt — die dringlichste gewinnt,
  // weitere rutschen in die Verliererbehandlung (sie gären weiter oder verfallen wie gehabt)
  let initiativeSchon = false;
  for (let i = gewinner.length - 1; i >= 0; i--) {
    if (!INITIATIVE_VORLAGE_IDS.has(gewinner[i]!.v.id)) continue;
    if (initiativeSchon) verlierer.push(gewinner.splice(i, 1)[0]!);
    else initiativeSchon = true;
  }

  // Takt: Die Sieger öffnen nicht alle am Monatsersten, sondern verteilt über den Monat (Prüfer 10: 97 % am Ersten); feste
  // Kalendertage der Vorlage (Saison, Gedenktage) gelten, sonst würfelt der Takt mit mindestens sechs Tagen Abstand.
  let versatz = Math.floor(rng.next() * TAKT.ersterVersatz);
  for (const k of gewinner) {
    // Die Obergrenze offener Vorgänge gilt auch für Sieger; wer nicht mehr passt, rutscht in die Verliererbehandlung
    if (offenNormal() + geplantNormal() >= MAX_OFFEN && !TERMINE.has(k.v.id)) {
      verlierer.push(k);
      continue;
    }
    // Ein gärender Vorgang, der es schließlich auf den Tisch schafft, kommt härter zurück (Schwellenwert ist gestiegen)
    const stufe = eskalation[k.v.id] ?? 0;
    delete eskalation[k.v.id];
    const staerke = stufe > 0 ? (k.gen.staerke ?? 1) * (1 + EREIGNIS_WETTBEWERB.staerkeSchub * stufe * schub) : k.gen.staerke;
    let tag: number;
    if (k.v.tag !== undefined) tag = world.day + (Math.min(28, Math.max(1, k.v.tag)) - dayOfMonth(world.date));
    else {
      tag = world.day + 1 + Math.min(TAKT.letzterTag, versatz);
      versatz += TAKT.abstandMin + Math.floor(rng.next() * (TAKT.abstandMax - TAKT.abstandMin + 1));
    }
    (spiel.geplant ??= []).push({ vorlage: k.v.id, tag, provinzen: k.gen.provinzen ?? [], staerke: staerke ?? 1, ...(k.gen.daten ? { daten: k.gen.daten } : {}) });
  }

  // 3. Nicht präsentiert: je nach Ereignis-Typ ausgesessen (Standardfolge tritt ein) oder still eskaliert (gärt weiter).
  // Länder-Initiativen (AUS-1) fallen aus dieser Behandlung heraus: Sie warten still auf den nächsten Monat —
  // ihr Treiber ist keine schwelende Lage, die gärt, sondern ein Interesse, das wieder anklopft.
  for (const k of verlierer) {
    if (INITIATIVE_VORLAGE_IDS.has(k.v.id)) continue;
    verliererBehandeln(world, rng, k.v, k.gen);
  }
}

/**
 * Nicht präsentiert: je nach Ereignis-Typ ausgesessen (Standardfolge tritt ein) oder still eskaliert (gärt weiter).
 * Gilt für Verlierer des Monatswettbewerbs und für geplante Vorgänge, die wegen der Obergrenze nicht mehr öffnen konnten.
 */
function verliererBehandeln(world: World, rng: Rng, v: Vorlage, gen: Erzeugung): void {
  const spiel = world.spiel!;
  const eskalation = spiel.eskalation ?? (spiel.eskalation = {});
  const ev = baueEreignis(world, v, gen);
  const titel = v.titel(world, ev);
  if (v.wettbewerb === "aussitzen") {
    // Der Vorgang läuft ohne Entscheidung schlecht aus: Es greift die Standardfolge, sonst nichts
    const ausgang = v.standard(world, ev, rng);
    spiel.zuletzt[v.id] = world.day;
    delete eskalation[v.id];
    spiel.chronik.push({ tag: world.day, datum: world.date, titel, ausgang: t("ereignis.chronik.ausgesessen", { ausgang }), art: "haken", vorlage: v.id, ohneEntscheidung: true });
    addLog(world, "ereignis", t("ereignis.log.ausgesessen", { titel }), ausgang);
  } else {
    const stufe = Math.min(EREIGNIS_WETTBEWERB.maxStufe, (eskalation[v.id] ?? 0) + 1);
    eskalation[v.id] = stufe;
    spiel.chronik.push({ tag: world.day, datum: world.date, titel, ausgang: t("ereignis.chronik.gaert", { stufe, max: EREIGNIS_WETTBEWERB.maxStufe }), art: "haken", vorlage: v.id });
    addLog(world, "ereignis", t("ereignis.log.gaert", { titel }), t("ereignis.log.gaert_warum"));
  }
}

/** Für Tests und Werkzeuge: wie `ereignisMonat`, aber die geplanten Vorgänge des Monats öffnen sofort, ohne ihren gewürfelten Tag abzuwarten. */
export function ereignisMonatSofort(world: World, rng: Rng): void {
  ereignisMonat(world, rng);
  const sp = world.spiel;
  if (!sp?.geplant?.length) return;
  for (const p of sp.geplant) p.tag = world.day;
  geplanteOeffnen(world, rng);
}

/** Takt: Geplante Vorgänge öffnen an ihrem Tag; ist die Obergrenze erreicht, rücken sie nach oder werden wie Verlierer behandelt. */
function geplanteOeffnen(world: World, rng: Rng): void {
  const spiel = world.spiel!;
  if (!spiel.geplant?.length) return;
  const rest: NonNullable<typeof spiel.geplant> = [];
  for (const p of spiel.geplant) {
    if (p.tag > world.day) {
      rest.push(p);
      continue;
    }
    if (spiel.ereignisse.some((e) => e.vorlage === p.vorlage)) continue; // läuft schon: der Plan verfällt
    const v = vorlage(p.vorlage);
    const gen = { provinzen: p.provinzen, staerke: p.staerke, ...(p.daten ? { daten: p.daten } : {}) };
    const offen = spiel.ereignisse.filter((e) => !e.vorlage.startsWith("start_")).length;
    if (offen >= MAX_OFFEN && !TERMINE.has(p.vorlage)) {
      const n = (p.verschoben ?? 0) + 1;
      if (n >= TAKT.maxVerschiebungen) verliererBehandeln(world, rng, v, gen);
      else rest.push({ ...p, tag: world.day + TAKT.verschiebungTage, verschoben: n });
      continue;
    }
    oeffne(world, p.vorlage, rng, gen);
  }
  spiel.geplant = rest;
}

/** Folgehaken (Vorlage.folgen): Das Ereignis, das aus einer früheren Antwort entsteht, öffnet, sobald ein Platz frei ist. */
function folgenOeffnen(world: World, rng: Rng): void {
  const spiel = world.spiel!;
  if (!spiel.folgen?.length) return;
  const rest: NonNullable<typeof spiel.folgen> = [];
  for (const f of spiel.folgen) {
    if (f.tag > world.day) {
      rest.push(f);
      continue;
    }
    if (spiel.ereignisse.some((e) => e.vorlage === f.vorlage)) continue;
    const offen = spiel.ereignisse.filter((e) => !e.vorlage.startsWith("start_")).length;
    if (offen >= MAX_OFFEN) {
      if (world.day - f.tag < TAKT.folgeWartetTage) rest.push(f);
      continue;
    }
    oeffne(world, f.vorlage, rng);
  }
  spiel.folgen = rest;
}

/** Täglich: fällige Zusagen einfordern, Fristen abwarten. */
export function ereignisTag(world: World, rng: Rng): void {
  const spiel = world.spiel;
  if (!spiel) return;
  // Alte Spielstände: Zusagen an „Fraktionen“ (Stimmenkauf) gibt es nicht mehr; ihre Ereignisse verschwinden mit ihnen
  if (spiel.zusagen.some((z) => z.von === "Fraktionen")) {
    spiel.zusagen = spiel.zusagen.filter((z) => z.von !== "Fraktionen");
  }
  spiel.ereignisse = spiel.ereignisse.filter((e) => e.vorlage !== "zusage" || spiel.zusagen.some((z) => z.id === String(e.daten?.zusage) && !z.erfuellt && !z.gebrochen && z.faellig <= world.day));
  // Fällige Zusagen kommen der Reihe nach (älteste zuerst), nicht alle am selben Tag
  const offeneZusagen = spiel.ereignisse.filter((e) => e.vorlage === "zusage").length;
  const faellige = spiel.zusagen
    .filter((z) => !z.erfuellt && !z.gebrochen && z.faellig <= world.day && !spiel.ereignisse.some((e) => e.vorlage === "zusage" && e.daten?.zusage === z.id))
    .sort((a, b) => a.faellig - b.faellig);
  let neueZusagen = 0;
  const g = (spiel.gegenkraft ??= {});
  for (const z of faellige) {
    if (offeneZusagen + neueZusagen >= TAKT.zusageGleichzeitig || neueZusagen >= TAKT.zusageProTag) break;
    if (world.day - (g.zusageTag ?? -1e9) < TAKT.zusageAbstand) break;
    oeffne(world, "zusage", rng, { provinzen: [], staerke: 1, daten: { zusage: z.id } });
    g.zusageTag = world.day;
    neueZusagen++;
  }
  geplanteOeffnen(world, rng);
  folgenOeffnen(world, rng);
  for (const ev of [...spiel.ereignisse]) {
    if (ev.frist > world.day) continue;
    const v = vorlage(ev.vorlage);
    const ausgang = v.standard(world, ev, rng);
    // Schweigen wird bemerkt: Ein Präsident, der nicht antwortet, wirkt schwach
    if (!ev.vorlage.startsWith("start_")) spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - SCHWEIGEN_ZUSTIMMUNG);
    abschliessen(world, ev, v.titel(world, ev), t("ereignis.chronik.keine", { ausgang }), true);
  }
}

function abschliessen(world: World, ev: OffenesEreignis, titel: string, ausgang: string, ohneEntscheidung = false): void {
  const spiel = world.spiel!;
  spiel.ereignisse = spiel.ereignisse.filter((e) => e.id !== ev.id);
  spiel.chronik.push({ tag: world.day, datum: world.date, titel, ausgang, vorlage: ev.vorlage, ...(ohneEntscheidung ? { ohneEntscheidung: true as const } : {}) });
  addLog(world, "entscheidung", `${titel}: ${ausgang}`);
}

/** Wer die Ursache selbst regelt (ein Vorhaben zu einer zugehörigen Maßnahme einbringt), hat das Ereignis in die Hand genommen. */
setzeEinbringHaken((world, massnahmeId, text) => {
  const spiel = world.spiel;
  if (!spiel) return;
  for (const ev of [...spiel.ereignisse]) {
    // Zusagen erledigt die Gesetzesabwicklung nur bei einem ausreichenden Entwurf/Beschluss.
    if (ev.vorlage.startsWith("start_") || ev.vorlage === "zusage") continue;
    const v = vorlage(ev.vorlage);
    if (!v.massnahmen?.includes(massnahmeId)) continue;
    abschliessen(world, ev, v.titel(world, ev), t("ereignis.chronik.ursache", { text }));
  }
});

// Der Verfassungskern (sim/verfassung.ts) öffnet seine Vorgangs-Ereignisse über diesen Haken,
// ohne den Ereignismotor importieren zu müssen (Importrichtung bleibt einseitig).
setzeVerfassungsOeffner((w, vorlageId, rng) => {
  oeffne(w, vorlageId, rng);
});

// Das Katastrophen-Modul (sim/katastrophe.ts, INF-5) öffnet seine Lagen über denselben Weg;
// es kommt garantiert auf den Tisch (Auto-Stopp A) und steht nie im Monats-Wettbewerb.
setzeKatastrophenOeffner((w, vorlageId, rng, params) => {
  oeffne(w, vorlageId, rng, params);
});

/** Ergebnis einer Rechnung auf der Kopie: Ausgangstext, sichtbare Folgen und der dabei zusätzlich gebuchte Preis. */
interface KopieFolgen {
  text: string;
  zeilen: string[];
  /** Kapital, das die Wirkung selbst bucht (über den Preis der Antwort hinaus; negativ = Gewinn) */
  kapital: number;
  /** Veränderung der Nettoschuld (Schulden minus Kasse) in Prozent des BIP; negativ = Einnahme */
  bip: number;
}

const VORSCHAU_CACHE = new Map<string, KopieFolgen>();

/** Nettoschuld in Mrd. Lira: Schuldenstand minus Kasse (so rechnet auch der Haushalt). */
const nettoschuld = (w: World): number => (w.economy.debtRatio * bipWertMrd(w.economy)) / 100 - kassenbestand(w.economy);

/** Antwort auf der Kopie ausführen (Preis in Kapital und BIP gemessen, nichts davon geschieht wirklich). */
function antwortAufKopie(world: World, ev: OffenesEreignis, optionId: string): KopieFolgen {
  return folgenAufKopie(world, ev, optionId, (kopie, evK) => {
    const o = antworten(kopie, evK).find((x) => x.id === optionId);
    if (!o || o.sperre) return null;
    o.wirkung(kopie, evK, new Rng(12345));
    return "";
  }, true);
}

/**
 * Der Preis einer Antwort, wie er wirklich gebucht wird: der Kapitalpreis der Antwort plus alles, was ihre Wirkung selbst bucht
 * (etwa ein gestartetes Bauvorhaben oder eine Entlassung), und die Kosten in Prozent des BIP. Daraus entsteht die Plakette
 * im Ereignisfenster; test/schau-antworten.test.ts vergleicht sie mit der echten Buchung (Befund A-4, 5. November 2026).
 */
export function preisVorschau(world: World, ev: OffenesEreignis, optionId: string): { kapital: number; bip: number } {
  const o = antworten(world, ev).find((x) => x.id === optionId);
  if (!o || o.sperre) return { kapital: o ? (o.anzeigePk ?? o.pk) : 0, bip: 0 };
  const r = antwortAufKopie(world, ev, optionId);
  // Gebucht wird der Preis der Antwort und, was die Wirkung selbst bucht. `anzeigePk` nennt einen Preis, der erst später fällig wird
  // (etwa beim Einbringen eines Gesetzes) oder den die Wirkung selbst bucht; er zählt nur, wenn er höher ist als das sofort Gebuchte.
  const sofort = o.pk + r.kapital;
  const kapital = o.anzeigePk !== undefined ? Math.max(o.anzeigePk, sofort) : sofort;
  return { kapital: Math.round(kapital * 10) / 10, bip: r.bip };
}

/**
 * Was eine Antwort sofort bewirkt: auf einer Kopie der Welt durchgerechnet, nichts davon geschieht wirklich.
 * Zeigt Maßnahmenänderungen, Haushalt und die Größen, die sich am stärksten bewegen.
 */
export function wirkungsVorschau(world: World, ev: OffenesEreignis, optionId: string): string[] {
  if (ev.vorlage === "zusage") return zusagenErinnerungsAntwort(world, ev, optionId)?.sofortfolgen ?? [];
  return antwortAufKopie(world, ev, optionId).zeilen;
}

/**
 * Was geschieht, wenn bis zur Frist niemand antwortet: die Standardfolge der Vorlage auf einer Kopie, dazu der Preis des
 * Schweigens in der Umfrage (wie in ereignisseTag). Spielerdurchlauf 5. November: „Man erfährt nicht, was die Standardfolge ist.“
 */
export function standardVorschau(world: World, ev: OffenesEreignis): { text: string; zeilen: string[] } | null {
  const { kapital: _k, bip: _b, ...r } = folgenAufKopie(world, ev, "§standard", (kopie, evK) => {
    const text = vorlage(evK.vorlage).standard(kopie, evK, new Rng(12345));
    if (!evK.vorlage.startsWith("start_")) kopie.spiel!.umfrage.zustimmung = Math.max(0, kopie.spiel!.umfrage.zustimmung - SCHWEIGEN_ZUSTIMMUNG);
    return text;
  });
  return r.text ? r : null;
}

/**
 * Rechnet eine Wirkung auf einer Kopie der Welt durch und beschreibt, was sich sofort ändert. Mit `preisAufPlakette` stehen Schulden
 * und Kasse nicht als Folge da, weil die Plakette der Antwort den Preis in Prozent des BIP schon nennt (Befund A-7: Preis dreifach).
 */
function folgenAufKopie(world: World, ev: OffenesEreignis, schluessel: string, anwenden: (kopie: World, evK: OffenesEreignis) => string | null, preisAufPlakette = false): KopieFolgen {
  const key = `${ev.id}|${schluessel}|${preisAufPlakette ? 1 : 0}|${world.day}|${Math.floor(world.spiel?.kapital ?? 0)}|${world.economy.debtRatio}|${kassenbestand(world.economy)}|${bipWertMrd(world.economy)}`;
  const gemerkt = VORSCHAU_CACHE.get(key);
  if (gemerkt) return gemerkt;
  const zeilen: string[] = [];
  let text = "";
  let kapital = 0;
  let bip = 0;
  try {
    const kopie = structuredClone(world);
    const evK = kopie.spiel!.ereignisse.find((e) => e.id === ev.id);
    if (evK) {
      const vorher = new Map<string, number>();
      for (const n of NET.nodes) if (!n.input) vorher.set(n.id, nationalAverage(NET, world.net, n.id));
      const schulden0 = kopie.economy.debtRatio;
      const kasse0 = kassenbestand(kopie.economy);
      const risiko0 = kopie.economy.riskPremium;
      const fx0 = kopie.economy.usdTry;
      const zust0 = kopie.spiel!.umfrage.zustimmung;
      const loyal0 = new Map(kopie.spiel!.figuren.map((f) => [f.id, f.loyalitaet]));
      const imAmt0 = new Set(kopie.spiel!.figuren.filter((f) => f.imAmt).map((f) => f.id));
      // Personen über Kennung und Name: Bei einem Austausch behält der Posten seine Kennung, die Person wechselt (Befund A-11)
      const person0 = new Map(kopie.spiel!.figuren.map((f) => [f.id, f.name]));
      const kapital0 = kopie.spiel!.kapital;
      const netto0 = nettoschuld(kopie);
      const bip0 = bipWertMrd(kopie.economy);
      const ergebnis = anwenden(kopie, evK);
      if (ergebnis !== null) {
        text = ergebnis;
        kapital = kapital0 - kopie.spiel!.kapital;
        bip = bip0 > 0 ? ((nettoschuld(kopie) - netto0) / bip0) * 100 : 0;
        // 1. Maßnahmen, die der Spieler damit verändert
        for (const [id, ziel] of Object.entries(kopie.net.targets)) {
          const jetzt = nationalAverage(NET, world.net, id);
          const alt = world.net.targets[id];
          if (Math.abs(ziel - (alt ?? jetzt)) >= 1 && Math.abs(ziel - jetzt) >= 1) zeilen.push(t(ziel > jetzt ? "n9.vs.auf" : "n9.vs.ab", { name: NET.nodes[NET.index.get(id)!]!.name, von: stufenName(id, jetzt), auf: stufenName(id, ziel) }));
        }
        // 2. Haushalt und Märkte
        const vz = (d: number, stellen: number) => `${d > 0 ? "+" : "−"}${nf(Math.abs(d), stellen)}`;
        const ds = kopie.economy.debtRatio - schulden0;
        if (!preisAufPlakette && Math.abs(ds) >= 0.04) zeilen.push(t("ereignis.vs.schulden", { d: vz(ds, 2) }));
        const dk = kassenbestand(kopie.economy) - kasse0;
        if (!preisAufPlakette && Math.abs(dk) > 0.001) zeilen.push(t("sf.kasseAenderung", { betrag: vz(dk, 2) }));
        const dr = kopie.economy.riskPremium - risiko0;
        if (Math.abs(dr) >= 4) zeilen.push(t("ereignis.vs.risiko", { d: vz(dr, 0) }));
        const df = (kopie.economy.usdTry / fx0 - 1) * 100;
        if (Math.abs(df) >= 0.4) zeilen.push(t("ereignis.vs.lira", { richtung: df > 0 ? "schwaecher" : "staerker", d: nf(Math.abs(df)) }));
        const dz = kopie.spiel!.umfrage.zustimmung - zust0;
        if (Math.abs(dz) >= 0.5) zeilen.push(t("ereignis.vs.zustimmung", { d: vz(dz, 1) }));
        // 3. Personen. Nur wer vorher und nachher dieselbe Person im Amt ist: Wer durch die Antwort erst ins Amt rückt, gewinnt oder
        // verliert keinen Rückhalt (Spielerdurchlauf: „Die Person opfern“ nannte die Nachfolgerin; Befund A-11: die Kennung bleibt beim Austausch).
        // Bewegt sich der Rückhalt bei vielen zugleich, steht das als eine Zeile da, nicht als Liste unbeteiligter Minister.
        const bewegt: { f: { rolle: string; name: string }; d: number }[] = [];
        for (const f of kopie.spiel!.figuren) {
          if (!f.imAmt || !imAmt0.has(f.id) || person0.get(f.id) !== f.name) continue;
          const d = f.loyalitaet - (loyal0.get(f.id) ?? f.loyalitaet);
          if (Math.abs(d) >= 3) bewegt.push({ f, d });
        }
        const gleich = bewegt.length >= 3 && bewegt.every((b) => Math.sign(b.d) === Math.sign(bewegt[0]!.d));
        if (gleich) zeilen.push(t("ev.vs.kabinett", { n: bewegt.length, richtung: bewegt[0]!.d > 0 ? "mehr" : "weniger" }));
        else for (const { f, d } of bewegt) zeilen.push(t("ereignis.vs.rueckhalt", { rolle: f.rolle, name: f.name, richtung: d > 0 ? "mehr" : "weniger" }));
        // 4. Die Größen, die sich am stärksten bewegen
        const aenderungen: { name: string; d: number }[] = [];
        for (const n of NET.nodes) {
          if (n.input) continue;
          const d = nationalAverage(NET, kopie.net, n.id) - (vorher.get(n.id) ?? 0);
          if (Math.abs(d) >= 0.4) aenderungen.push({ name: n.name, d });
        }
        aenderungen.sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
        for (const a of aenderungen.slice(0, 4)) zeilen.push(`${a.name} ${vz(a.d, 1)}`);
      }
    }
  } catch {
    // Keine Vorschau ist besser als eine falsche
  }
  const ergebnis = { text, zeilen: zeilen.slice(0, 6), kapital, bip };
  if (VORSCHAU_CACHE.size > 300) VORSCHAU_CACHE.clear();
  VORSCHAU_CACHE.set(key, ergebnis);
  return ergebnis;
}

export interface EreignisAnsicht {
  id: string;
  vorlage: string;
  szene: SzenenName;
  titel: string;
  text: string[];
  warum: string;
  frist: number;
  tageBisFrist: number;
  /** `preis`: wie gebucht, gemessen auf einer Kopie (Kapital einschließlich dessen, was die Wirkung selbst bucht; BIP in Prozent) */
  optionen: (Omit<Option, "wirkung"> & { bezahlbar: boolean; vorschau: string[]; preis: { kapital: number; bip: number } })[];
  /** Maßnahmen, mit denen man die Ursache selbst regeln kann */
  massnahmen: { id: string; name: string; ziel?: number }[];
  /** Beschriftung der Zeile mit den Maßnahmen */
  massnahmenText: string;
  /** Was ohne Antwort bis zur Frist geschieht (Text der Standardfolge und ihre sofortigen Wirkungen) */
  standardFolge?: { text: string; zeilen: string[] };
}

function zusageAnsicht(world: World, ev: OffenesEreignis, v: Vorlage): { massnahmen: { id: string; name: string; ziel?: number }[]; massnahmenText: string } {
  if (ev.vorlage === "zusage") {
    const z = world.spiel?.zusagen.find((x) => x.id === String(ev.daten?.zusage));
    const vorhaben = zusageVorhaben(world, z);
    return { massnahmen: vorhaben ? [{ id: vorhaben.id, name: vorhaben.name, ziel: vorhaben.ziel }] : [], massnahmenText: t("ze.gesetzAnsehen") };
  }
  return { massnahmen: (v.massnahmen ?? []).map((id) => ({ id, name: NET.nodes[NET.index.get(id)!]!.name })), massnahmenText: t("ereignis.ursache") };
}

export function ansicht(world: World, ev: OffenesEreignis): EreignisAnsicht {
  const v = vorlage(ev.vorlage);
  return {
    id: ev.id,
    vorlage: ev.vorlage,
    szene: v.szene,
    titel: v.titel(world, ev),
    text: v.text(world, ev),
    warum: v.warum(world, ev),
    frist: ev.frist,
    tageBisFrist: Math.max(0, ev.frist - world.day),
    optionen: antworten(world, ev).map(({ wirkung: _w, ...rest }) => ({ ...rest, bezahlbar: kannZahlen(world.spiel?.kapital ?? 0, rest.anzeigePk ?? rest.pk), vorschau: rest.sperre ? [] : rest.sofortfolgen ?? wirkungsVorschau(world, ev, rest.id), preis: preisVorschau(world, ev, rest.id) })),
    ...zusageAnsicht(world, ev, v),
    ...(() => {
      const sf = standardVorschau(world, ev);
      return sf ? { standardFolge: sf } : {};
    })(),
  };
}

export function entscheide(world: World, ereignisId: string, optionId: string, rng: Rng): { ok: boolean; text: string } {
  const spiel = world.spiel;
  const ev = spiel?.ereignisse.find((e) => e.id === ereignisId);
  if (!spiel || !ev) return { ok: false, text: t("ereignis.nichtOffen") };
  const v = vorlage(ev.vorlage);
  const o = antworten(world, ev).find((x) => x.id === optionId);
  if (!o) return { ok: false, text: t("ereignis.keineAntwort") };
  if (o.sperre) return { ok: false, text: o.sperre };
  const vollerPreis = o.anzeigePk ?? o.pk;
  if (!kannZahlen(spiel.kapital, vollerPreis)) return { ok: false, text: t("ereignis.fehltKapitalGenau", { noetig: vollerPreis, vorhanden: Math.floor(spiel.kapital) }) };
  spiel.kapital -= o.pk;
  const titel = v.titel(world, ev);
  // Rückblick (sim/berichte.ts): Stand vor der Antwort festhalten, damit der Bericht nach 6, 12 und 24 Monaten zeigen kann, was davon blieb
  const beobachten = ev.vorlage !== "zusage" && !ev.vorlage.startsWith("start_");
  const vor = beobachten ? momentaufnahme(world) : undefined;
  const ausgang = o.wirkung(world, ev, rng);
  if (vor) rueckblickAnlegen(world, "ereignis", t("takt.bericht.ereignis", { titel, antwort: o.label }), vor, momentaufnahme(world));
  abschliessen(world, ev, titel, `${o.label}. ${ausgang}`);
  // Gedächtnis: Manche Antworten kommen später als eigenes Ereignis zurück (Vorlage.folgen)
  const folge = v.folgen?.[optionId];
  if (folge && (!folge.bedingung || folge.bedingung(world))) {
    const [von, bis] = folge.nach;
    (spiel.folgen ??= []).push({ vorlage: folge.vorlage, tag: world.day + von + Math.floor(rng.next() * (bis - von + 1)), aus: v.id, antwort: optionId });
  }
  return { ok: true, text: ausgang };
}

/** Für Bots und Tests: die günstigste sinnvolle Antwort, die noch bezahlbar ist. */
export function standardAntwort(world: World, ev: OffenesEreignis): string | null {
  const opts = antworten(world, ev).filter((o) => !o.sperre && (world.spiel?.kapital ?? 0) >= (o.anzeigePk ?? o.pk));
  return opts.length ? opts[0]!.id : null;
}

// Die Kritik an der Zentralbank oder ein Austausch der Führung als Antwort auf einen Währungsrutsch bleibt Sache der
// direkten Eingriffe; hier nur zur Nutzung durch Befehle und Oberfläche bereitgestellt.
export { criticizeCentralBank, replaceGovernor };
