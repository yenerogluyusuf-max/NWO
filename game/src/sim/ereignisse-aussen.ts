// Weitere Ereignisvorlagen: Außenpolitik, Weltwirtschaft, Sicherheit und Energie.
// Wie in ereignisse-innen.ts sind Wahrscheinlichkeiten und Wirkungen Platzhalter der Kalibrierung; Zahlen im Text
// stammen aus dem Weltzustand. Namen von Staaten kommen nur vor, wo der Sachverhalt sie ohnehin bedingt.

import { ratingAendere, ratingDruck } from "./maerkte";
import { wirke, vertrauenAendern } from "./wirkung";
import { setFiscalImpulse } from "./eingriffe";
import { clamp } from "./economy";
import { anrede, figur, loyalitaetAendern } from "./figuren";
import { DEVISEN, iwfAktiv, iwfAuflagen, iwfStarten } from "./devisen";
import { CYBER_ZIELE, GRENZ_NACHBAR, NATO_BEWERBER, waehle } from "./akteure";
import { dk } from "./ereignis-hilfen";
import { beschr, kosten, monatVon, netz, nf, opt, ziehe, zusageAnlegen } from "./ereignis-hilfen";
import type { Vorlage } from "./ereignis-hilfen";
import { lieferanteilVerschieben } from "./diplomatie";
import { msg, t } from "../i18n";
import { PROVINZEN } from "./regional";

/** Lieferland im Ereignistext zu Lieferant im Energiemodell */
const LIEFERANT: Record<string, "RUS" | "AZE" | "IRN"> = { Russland: "RUS", Aserbaidschan: "AZE", Iran: "IRN" };

const GRENZE = [31, 79, 27, 63, 47, 73, 30, 65, 76, 36, 75, 8]; // Hatay, Kilis, Gaziantep, Şanlıurfa, Mardin, Şırnak, Hakkari, Van, Iğdır, Kars, Ardahan, Artvin

/** Provinznamen als Aufzählung für den Katalog (`{orte, list}`): im Deutschen wie `namen()` „A, B und C“, sonst nach Sprache. */
const orte = (provinzen: number[]): string[] => provinzen.map((p) => PROVINZEN[p - 1]?.name ?? String(p));

/** Nachbar jenseits der Grenze (GRENZ_NACHBAR, deutsche Namen) zur Länderkennung des Namenskatalogs (land.name.*) — nur für die Anzeige. */
const NACHBAR_ID: Record<string, string> = { Syrien: "SYR", Irak: "IRQ", Iran: "IRN", Armenien: "ARM", Georgien: "GEO" };
function nachbarName(provinz: number | undefined): string | undefined {
  const roh = GRENZ_NACHBAR[provinz ?? 0];
  if (roh === undefined) return undefined;
  const id = NACHBAR_ID[roh];
  return id ? t(`land.name.${id}`) : roh;
}

/** Name des Gaslieferlandes in der Anzeigesprache; gespeichert bleibt der deutsche Wert (er steuert LIEFERANT und die Beziehungen). */
function gasLand(land: unknown): string {
  const id = LIEFERANT[String(land)];
  return id ? t(`land.name.${id}`) : String(land);
}

/** NATO-Bewerber (Land und Lage aus NATO_BEWERBER, deutsch gespeichert) in der Anzeigesprache; Unbekanntes bleibt, wie es ist. */
function natoBewerber(daten: Record<string, number | string> | undefined): { land: string; lage: string } {
  const i = NATO_BEWERBER.findIndex((b) => b.land === daten?.land);
  const b = NATO_BEWERBER[i];
  if (!b) return { land: String(daten?.land ?? t("eva.nato_ratifizierung.staat_ersatz")), lage: String(daten?.lage) };
  return { land: t(`eva.nato_ratifizierung.bewerber.${i}.land`), lage: b.lage === daten?.lage ? t(`eva.nato_ratifizierung.bewerber.${i}.lage`) : String(daten?.lage) };
}

/** Ziel des Cyberangriffs (CYBER_ZIELE, deutsch gespeichert) in der Anzeigesprache. */
function cyberZiel(ziel: unknown): string {
  const i = CYBER_ZIELE.indexOf(String(ziel));
  return i >= 0 ? t(`eva.cyberangriff.ziel.${i}`) : String(ziel);
}

const GRENZZWISCHENFALL: Vorlage = {
  id: "grenzzwischenfall",
  szene: "anatolien",
  frist: 5,
  abkuehlung: 300,
  chance: (w) => (netz(w, "terrorgefahr") > 55 ? 0.04 : 0.012),
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => (GRENZE.includes(pl) ? 1 : 0), 1);
    return p.length ? { provinzen: p, staerke: 0.5 + 0.5 * rng.next() } : null;
  },
  titel: (_, ev) => t("eva.grenzzwischenfall.titel", { nachbar: nachbarName(ev.provinzen[0]) ?? t("eva.grenzzwischenfall.nachbar_ersatz_titel") }),
  text: (_, ev) => {
    const nachbar = nachbarName(ev.provinzen[0]) ?? t("eva.grenzzwischenfall.nachbar_ersatz");
    return [t("eva.grenzzwischenfall.text1", { nachbar, orte: orte(ev.provinzen) })];
  },
  warum: () => t("eva.grenzzwischenfall.warum"),
  eroeffne: (w, ev) => {
    wirke(w, "terrorgefahr", 4 * ev.staerke, ev.provinzen);
    wirke(w, "vertrauen_regierung", -0.5);
  },
  optionen: (_, ev) => [
    opt("diplomatie", t("eva.grenzzwischenfall.opt.diplomatie.label"), beschr(2, 0, t("eva.grenzzwischenfall.opt.diplomatie.folge")), 2, (w) => {
      wirke(w, "beziehungen_nahost", 2);
      wirke(w, "terrorgefahr", -1, ev.provinzen);
      loyalitaetAendern(w, "aussen", 4);
      return t("eva.grenzzwischenfall.opt.diplomatie.ausgang");
    }),
    opt("verstaerken", t("eva.grenzzwischenfall.opt.verstaerken.label"), beschr(3, 0.1, t("eva.grenzzwischenfall.opt.verstaerken.folge")), 3, (w) => {
      kosten(w, 0.1);
      wirke(w, "terrorgefahr", -3 * ev.staerke, ev.provinzen);
      wirke(w, "militaer", 2);
      loyalitaetAendern(w, "inneres", 3);
      return t("eva.grenzzwischenfall.opt.verstaerken.ausgang");
    }),
    opt("vergeltung", t("eva.grenzzwischenfall.opt.vergeltung.label"), beschr(4, 0.15, t("eva.grenzzwischenfall.opt.vergeltung.folge")), 4, (w) => {
      kosten(w, 0.15);
      vertrauenAendern(w, 2);
      wirke(w, "ansehen", -3);
      wirke(w, "beziehungen_nahost", -5);
      wirke(w, "terrorgefahr", 2, ev.provinzen);
      return t("eva.grenzzwischenfall.opt.vergeltung.ausgang");
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "terrorgefahr", 2 * ev.staerke, ev.provinzen);
    vertrauenAendern(w, -1);
    return t("eva.grenzzwischenfall.standard");
  },
};

const EU_ANGEBOT: Vorlage = {
  id: "eu_angebot",
  szene: "parlament",
  frist: 20,
  abkuehlung: 600,
  chance: (w) => (netz(w, "beziehungen_eu") >= 45 ? 0.04 : 0.005),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("eva.eu_angebot.titel"),
  text: () => [
    t("eva.eu_angebot.text1"),
  ],
  warum: () => t("eva.eu_angebot.warum"),
  optionen: () => [
    opt("verhandeln", t("eva.eu_angebot.opt.verhandeln.label"), beschr(4, 0, t("eva.eu_angebot.opt.verhandeln.folge")), 4, (w) => {
      wirke(w, "beziehungen_eu", 6);
      wirke(w, "export", 3);
      wirke(w, "auslandskapital", 3);
      wirke(w, "konservative", -1);
      zusageAnlegen(w, { von: "EU-Kommission", text: "Der EU wurde eine Justizreform zugesagt", msg: msg("zusage.eu.justizreform"), tage: 240, massnahme: "m_justizreform" });
      return t("eva.eu_angebot.opt.verhandeln.ausgang");
    }),
    opt("teilweise", t("eva.eu_angebot.opt.teilweise.label"), beschr(2, 0, t("eva.eu_angebot.opt.teilweise.folge")), 2, (w) => {
      wirke(w, "beziehungen_eu", 2);
      wirke(w, "export", 1);
      return t("eva.eu_angebot.opt.teilweise.ausgang");
    }),
    opt("ablehnen", t("eva.eu_angebot.opt.ablehnen.label"), beschr(0, 0, t("eva.eu_angebot.opt.ablehnen.folge")), 0, (w) => {
      wirke(w, "beziehungen_eu", -3);
      wirke(w, "konservative", 2);
      wirke(w, "unternehmer", -1);
      return t("eva.eu_angebot.opt.ablehnen.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "beziehungen_eu", -1);
    return t("eva.eu_angebot.standard");
  },
};

const IWF: Vorlage = {
  id: "iwf_angebot",
  szene: "bank",
  frist: 12,
  abkuehlung: 500,
  // WIR-2: Der IWF tritt auf, wenn die Märkte stürmen oder die Netto-Reserven schwinden — nicht, solange ein Programm läuft
  chance: (w) => (iwfAktiv(w) ? 0 : w.economy.riskPremium > 400 || (w.economy.reservenNettoUsdMrd ?? 99) < DEVISEN.warnungUnter ? 0.2 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("eva.iwf_angebot.titel"),
  text: (w) => {
    const auflagen = iwfAuflagen(w);
    return [
      t("eva.iwf_angebot.text1", { aufschlag: nf(w.economy.riskPremium, 0), kurs: nf(w.economy.usdTry), reserven: nf(w.economy.reservenNettoUsdMrd ?? 0), wer: anrede(figur(w, "finanzen")) }),
      t("eva.iwf_angebot.text2", { zins: nf(auflagen.zinsMindest), defizit: nf(auflagen.defizitMax) }),
    ];
  },
  warum: () => t("eva.iwf_angebot.warum"),
  optionen: (w) => [
    opt("annehmen", t("eva.iwf_angebot.opt.annehmen.label"), beschr(5, 0, t("eva.iwf_angebot.opt.annehmen.folge", { zins: nf(iwfAuflagen(w).zinsMindest), defizit: nf(iwfAuflagen(w).defizitMax) })), 5, (w) => {
      iwfStarten(w);
      wirke(w, "realeinkommen", -3);
      wirke(w, "arbeitnehmer", -3);
      wirke(w, "junge", -2);
      return t("eva.iwf_angebot.opt.annehmen.ausgang");
    }),
    opt("golf", t("eva.iwf_angebot.opt.golf.label"), beschr(4, 0, t("eva.iwf_angebot.opt.golf.folge")), 4, (w) => {
      w.economy.riskPremium = Math.max(150, w.economy.riskPremium - 30);
      w.economy.credibility = clamp(w.economy.credibility + 0.01, 0.05, 0.95);
      const e = w.economy;
      if (e.reservenBruttoUsdMrd !== undefined) e.reservenBruttoUsdMrd += 4;
      if (e.reservenNettoUsdMrd !== undefined) e.reservenNettoUsdMrd += 4;
      wirke(w, "beziehungen_nahost", 4);
      wirke(w, "beziehungen_usa", -1);
      return t("eva.iwf_angebot.opt.golf.ausgang");
    }),
    opt("allein", t("eva.iwf_angebot.opt.allein.label"), beschr(0, 0, t("eva.iwf_angebot.opt.allein.folge")), 0, (w) => {
      w.economy.riskPremium += 20;
      wirke(w, "vertrauen_maerkte", -2);
      wirke(w, "konservative", 1);
      return t("eva.iwf_angebot.opt.allein.ausgang");
    }),
  ],
  standard: (w) => {
    w.economy.riskPremium += 25;
    return t("eva.iwf_angebot.standard");
  },
};

const RATING: Vorlage = {
  id: "ratingagentur",
  szene: "bank",
  frist: 12,
  abkuehlung: 360,
  chance: (w) => (w.economy.debtRatio > 45 || netz(w, "vertrauen_maerkte") < 38 ? 0.08 : 0.004),
  erzeuge: (_, rng) => ({ provinzen: [], staerke: 1, daten: { agentur: waehle(rng, ["Fitch", "Moody's", "S&P Global Ratings"]) } }),
  titel: (_, ev) => t("eva.ratingagentur.titel", { agentur: String(ev.daten?.agentur) }),
  text: (w, ev) => [t("eva.ratingagentur.text1", { agentur: String(ev.daten?.agentur), schulden: nf(w.economy.debtRatio), inflation: nf(w.published.inflation.value) })],
  warum: () => t("eva.ratingagentur.warum"),
  optionen: () => [
    opt("fahrplan", t("eva.ratingagentur.opt.fahrplan.label"), beschr(3, 0, t("eva.ratingagentur.opt.fahrplan.folge")), 3, (w) => {
      wirke(w, "vertrauen_maerkte", 4);
      ratingDruck(w, -4);
      setFiscalImpulse(w, Math.min(w.economy.fiscalImpulse, 0));
      loyalitaetAendern(w, "finanzen", 4);
      return t("eva.ratingagentur.opt.fahrplan.ausgang");
    }),
    opt("roadshow", t("eva.ratingagentur.opt.roadshow.label"), beschr(2, 0, t("eva.ratingagentur.opt.roadshow.folge")), 2, (w) => {
      wirke(w, "auslandskapital", 3);
      w.economy.riskPremium -= 10;
      return t("eva.ratingagentur.opt.roadshow.ausgang");
    }),
    opt("zurueckweisen", t("eva.ratingagentur.opt.zurueckweisen.label"), beschr(0, 0, t("eva.ratingagentur.opt.zurueckweisen.folge")), 0, (w) => {
      w.economy.riskPremium += 20;
      ratingDruck(w, 5);
      wirke(w, "vertrauen_maerkte", -3);
      wirke(w, "konservative", 1);
      return t("eva.ratingagentur.opt.zurueckweisen.ausgang");
    }),
  ],
  standard: (w) => {
    // Runde „Netz atmet“: Die Herabstufung ist jetzt ein Zustand (sim/maerkte.ts): Stufe, Aufschlag und Vertrauen folgen daraus
    ratingAendere(w, -1);
    wirke(w, "vertrauen_maerkte", -2);
    return t("eva.ratingagentur.standard");
  },
};

const NATO: Vorlage = {
  id: "nato_ratifizierung",
  szene: "parlament",
  frist: 20,
  abkuehlung: 900,
  chance: (w) => (w.day > 300 ? 0.02 : 0),
  erzeuge: (_, rng) => {
    const b = waehle(rng, NATO_BEWERBER);
    return { provinzen: [], staerke: 1, daten: { land: b.land, lage: b.lage, ru: b.russland } };
  },
  titel: (_, ev) => t("eva.nato_ratifizierung.titel", { land: natoBewerber(ev.daten).land }),
  text: (_, ev) => [
    t("eva.nato_ratifizierung.text1", natoBewerber(ev.daten)),
    t("eva.nato_ratifizierung.text2"),
  ],
  warum: () => t("eva.nato_ratifizierung.warum"),
  optionen: (_, ev) => [
    opt("zustimmen", t("eva.nato_ratifizierung.opt.zustimmen.label"), beschr(3, 0, t("eva.nato_ratifizierung.opt.zustimmen.folge")), 3, (w) => {
      wirke(w, "beziehungen_usa", 5);
      wirke(w, "beziehungen_eu", 2);
      wirke(w, "beziehungen_russland", -4 * (dk(ev, "ru") || 1));
      wirke(w, "militaer", 2);
      wirke(w, "ansehen", 2);
      loyalitaetAendern(w, "aussen", 4);
      return t("eva.nato_ratifizierung.opt.zustimmen.ausgang");
    }),
    opt("blockieren", t("eva.nato_ratifizierung.opt.blockieren.label"), beschr(2, 0, t("eva.nato_ratifizierung.opt.blockieren.folge")), 2, (w) => {
      wirke(w, "beziehungen_usa", -4);
      wirke(w, "beziehungen_eu", -3);
      wirke(w, "beziehungen_russland", 2 * (dk(ev, "ru") || 1));
      wirke(w, "ansehen", -1);
      wirke(w, "konservative", 2);
      vertrauenAendern(w, 1);
      return t("eva.nato_ratifizierung.opt.blockieren.ausgang", { land: natoBewerber(ev.daten).land });
    }),
    opt("zeit", t("eva.nato_ratifizierung.opt.zeit.label"), beschr(0, 0, t("eva.nato_ratifizierung.opt.zeit.folge")), 0, (w) => {
      wirke(w, "ansehen", -1);
      loyalitaetAendern(w, "aussen", -2);
      return t("eva.nato_ratifizierung.opt.zeit.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "ansehen", -1);
    return t("eva.nato_ratifizierung.standard");
  },
};

const GASVERTRAG: Vorlage = {
  id: "gasvertrag",
  szene: "bank",
  frist: 20,
  abkuehlung: 700,
  chance: (w) => ([3, 9].includes(monatVon(w)) ? 0.04 : 0),
  erzeuge: (_, rng) => ({ provinzen: [], staerke: 1, daten: { land: waehle(rng, ["Russland", "Aserbaidschan", "Iran"]) } }),
  titel: (_, ev) => t("eva.gasvertrag.titel", { land: gasLand(ev.daten?.land) }),
  text: (w, ev) => [
    t("eva.gasvertrag.text1", { land: gasLand(ev.daten?.land), preise: nf(netz(w, "energiepreise"), 0), importe: nf(netz(w, "energieimporte"), 0) }),
  ],
  warum: () => t("eva.gasvertrag.warum"),
  optionen: (_, ev) => {
    const bez = ev.daten?.land === "Russland" ? "beziehungen_russland" : "beziehungen_nahost";
    return [
    opt("verlaengern", t("eva.gasvertrag.opt.verlaengern.label"), beschr(2, 0, t("eva.gasvertrag.opt.verlaengern.folge")), 2, (w) => {
      wirke(w, "energiepreise", -3);
      wirke(w, "energieimporte", 2);
      wirke(w, bez, 4);
      wirke(w, "beziehungen_eu", -3);
      // Spielparameter: Die Verlängerung bindet 4 Punkte mehr des Gasbezugs an den Lieferanten (sim/diplomatie.ts)
      lieferanteilVerschieben(w, LIEFERANT[ev.daten?.land ?? ""] ?? "RUS", 4);
      return t("wort.gas.verlaengert", { land: ev.daten?.land === undefined ? "" : gasLand(ev.daten.land) });
    }),
    opt("diversifizieren", t("eva.gasvertrag.opt.diversifizieren.label"), beschr(4, 0.2, t("eva.gasvertrag.opt.diversifizieren.folge")), 4, (w) => {
      kosten(w, 0.2);
      wirke(w, "energiepreise", 2);
      wirke(w, "energieimporte", -3);
      wirke(w, "beziehungen_eu", 2);
      wirke(w, bez, -2);
      // Spielparameter: 6 Punkte des Gasbezugs wandern zum Flüssiggas
      lieferanteilVerschieben(w, "LNG", 6);
      return t("wort.gas.diversifiziert");
    }),
    // Kurze Laufzeiten lassen sich Lieferanten bezahlen (Spielparameter +1,5); nach einem Jahr liegt der Vertrag wieder auf dem Tisch (folgen)
    opt("kurz", t("eva.gasvertrag.opt.kurz.label"), beschr(1, 0, t("eva.gasvertrag.opt.kurz.folge")), 1, (w) => {
      wirke(w, "energiepreise", 1.5);
      return t("wort.gas.kurz");
    }),
  ];
  },
  folgen: { kurz: { vorlage: "gasvertrag", nach: [330, 400] } },
  standard: (w) => {
    wirke(w, "energiepreise", 3);
    return t("eva.gasvertrag.standard");
  },
};

const GASFUND: Vorlage = {
  id: "gasfund",
  szene: "istanbul",
  frist: 15,
  abkuehlung: 3000,
  chance: (w) => (w.day > 150 ? 0.008 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("eva.gasfund.titel"),
  text: () => [t("eva.gasfund.text1")],
  warum: () => t("eva.gasfund.warum"),
  optionen: () => [
    opt("foerdern", t("eva.gasfund.opt.foerdern.label"), beschr(3, 0.3, t("eva.gasfund.opt.foerdern.folge")), 3, (w) => {
      kosten(w, 0.3);
      wirke(w, "energieimporte", -5);
      wirke(w, "energiepreise", -3);
      wirke(w, "auslandskapital", 2);
      wirke(w, "klimaschutz", -2);
      return t("eva.gasfund.opt.foerdern.ausgang");
    }),
    opt("fonds", t("wort.fonds.titel"), beschr(4, -0.4, t("eva.gasfund.opt.fonds.folge")), 4, (w) => {
      kosten(w, -0.4);
      wirke(w, "vertrauen_maerkte", 3);
      wirke(w, "energieimporte", -2);
      return t("wort.fonds.ausgang");
    }),
    opt("senken", t("eva.gasfund.opt.senken.label"), beschr(2, 0.2, t("eva.gasfund.opt.senken.folge")), 2, (w) => {
      kosten(w, 0.2);
      wirke(w, "lebenshaltung", -3);
      vertrauenAendern(w, 2);
      return t("eva.gasfund.opt.senken.ausgang");
    }),
  ],
  standard: () => t("eva.gasfund.standard"),
};

const CYBER: Vorlage = {
  id: "cyberangriff",
  szene: "istanbul",
  frist: 6,
  abkuehlung: 500,
  chance: () => 0.008,
  erzeuge: (_, rng) => ({ provinzen: [], staerke: 1, daten: { ziel: waehle(rng, CYBER_ZIELE) } }),
  titel: () => t("eva.cyberangriff.titel"),
  text: (_, ev) => [t("eva.cyberangriff.text1", { ziel: cyberZiel(ev.daten?.ziel) })],
  warum: () => t("eva.cyberangriff.warum"),
  eroeffne: (w) => {
    wirke(w, "stromversorgung", -3);
    wirke(w, "vertrauen_maerkte", -2);
  },
  optionen: () => [
    opt("behoerde", t("wort.cyber.titel"), beschr(4, 0.1, t("eva.cyberangriff.opt.behoerde.folge")), 4, (w) => {
      kosten(w, 0.1);
      wirke(w, "stromversorgung", 4);
      wirke(w, "vertrauen_maerkte", 3);
      return t("wort.cyber.ausgang");
    }),
    opt("beschuldigen", t("eva.cyberangriff.opt.beschuldigen.label"), beschr(2, 0, t("eva.cyberangriff.opt.beschuldigen.folge")), 2, (w) => {
      vertrauenAendern(w, 1);
      wirke(w, "beziehungen_nahost", -3);
      wirke(w, "ansehen", -1);
      return t("eva.cyberangriff.opt.beschuldigen.ausgang");
    }),
    opt("still", t("eva.cyberangriff.opt.still.label"), beschr(0, 0, t("eva.cyberangriff.opt.still.folge")), 0, (w) => {
      wirke(w, "vertrauen_maerkte", -3);
      return t("eva.cyberangriff.opt.still.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "vertrauen_maerkte", -3);
    return t("eva.cyberangriff.standard");
  },
};

const WELTKRISE: Vorlage = {
  id: "weltwirtschaftskrise",
  szene: "bank",
  frist: 10,
  abkuehlung: 1500,
  chance: (w) => (w.day > 500 ? 0.012 : 0),
  erzeuge: (_, rng) => ({ provinzen: [], staerke: 0.7 + 0.5 * rng.next() }),
  titel: () => t("eva.weltwirtschaftskrise.titel"),
  text: (w, ev) => [
    t("eva.weltwirtschaftskrise.text1", { wachstum: nf(w.economy.growth), aufschlag: nf(w.economy.riskPremium + 60 * ev.staerke, 0) }),
    t("eva.weltwirtschaftskrise.text2", { wer: anrede(figur(w, "finanzen")) }),
  ],
  warum: () => t("eva.weltwirtschaftskrise.warum"),
  eroeffne: (w, ev) => {
    w.economy.riskPremium += 60 * ev.staerke;
    w.economy.outputGap -= 1.6 * ev.staerke;
    wirke(w, "export", -6 * ev.staerke);
    wirke(w, "tourismus", -7 * ev.staerke);
    wirke(w, "auslandskapital", -6 * ev.staerke);
    wirke(w, "vertrauen_maerkte", -5 * ev.staerke);
    wirke(w, "mittelstand", -3 * ev.staerke);
  },
  optionen: (_, ev) => [
    opt("konjunktur", t("eva.weltwirtschaftskrise.opt.konjunktur.label"), beschr(6, 1.0, t("eva.weltwirtschaftskrise.opt.konjunktur.folge")), 6, (w) => {
      kosten(w, 1.0);
      w.economy.outputGap += 1.0 * ev.staerke;
      wirke(w, "mittelstand", 3);
      wirke(w, "arbeitnehmer", 2);
      vertrauenAendern(w, 2);
      return t("eva.weltwirtschaftskrise.opt.konjunktur.ausgang");
    }),
    opt("kurzarbeit", t("eva.weltwirtschaftskrise.opt.kurzarbeit.label"), beschr(4, 0.4, t("eva.weltwirtschaftskrise.opt.kurzarbeit.folge")), 4, (w) => {
      kosten(w, 0.4);
      wirke(w, "mittelstand", 3);
      wirke(w, "arbeitsplaetze_industrie", 3);
      wirke(w, "kredite", 2);
      return t("eva.weltwirtschaftskrise.opt.kurzarbeit.ausgang");
    }),
    opt("sparen", t("eva.weltwirtschaftskrise.opt.sparen.label"), beschr(2, 0, t("eva.weltwirtschaftskrise.opt.sparen.folge")), 2, (w) => {
      wirke(w, "vertrauen_maerkte", 3);
      wirke(w, "mittelstand", -3);
      wirke(w, "arbeitnehmer", -3);
      vertrauenAendern(w, -2);
      return t("eva.weltwirtschaftskrise.opt.sparen.ausgang");
    }),
  ],
  standard: (w, ev) => {
    w.economy.riskPremium += 30 * ev.staerke;
    wirke(w, "arbeitsplaetze_industrie", -4);
    wirke(w, "armut", 2);
    vertrauenAendern(w, -3);
    return t("eva.weltwirtschaftskrise.standard");
  },
};

const PANDEMIE: Vorlage = {
  id: "pandemie",
  szene: "parlament",
  frist: 8,
  abkuehlung: 2000,
  chance: (w) => (w.day > 700 ? 0.007 : 0),
  erzeuge: (_, rng) => ({ provinzen: [], staerke: 0.7 + 0.5 * rng.next() }),
  titel: () => t("eva.pandemie.titel"),
  text: (w) => [
    t("eva.pandemie.text1", { index: nf(netz(w, "gesundheitsversorgung"), 0) }),
    t("eva.pandemie.text2"),
  ],
  warum: () => t("eva.pandemie.warum"),
  eroeffne: (w, ev) => {
    wirke(w, "gesundheitsversorgung", -6 * ev.staerke);
    wirke(w, "wartezeiten", 8 * ev.staerke);
    wirke(w, "produktivitaet", -3 * ev.staerke);
    wirke(w, "tourismus", -6 * ev.staerke);
  },
  optionen: (_, ev) => [
    opt("beschraenken", t("eva.pandemie.opt.beschraenken.label"), beschr(6, 0.5, t("eva.pandemie.opt.beschraenken.folge")), 6, (w) => {
      kosten(w, 0.5);
      wirke(w, "gesundheitsversorgung", 5 * ev.staerke);
      wirke(w, "wartezeiten", -4);
      wirke(w, "produktivitaet", -2);
      wirke(w, "tourismus", -3);
      vertrauenAendern(w, 1.5);
      return t("eva.pandemie.opt.beschraenken.ausgang");
    }),
    opt("gezielt", t("eva.pandemie.opt.gezielt.label"), beschr(4, 0.3, t("eva.pandemie.opt.gezielt.folge")), 4, (w) => {
      kosten(w, 0.3);
      wirke(w, "gesundheitsversorgung", 3 * ev.staerke);
      wirke(w, "wartezeiten", -2);
      return t("eva.pandemie.opt.gezielt.ausgang");
    }),
    opt("offen", t("eva.pandemie.opt.offen.label"), beschr(1, 0, t("eva.pandemie.opt.offen.folge")), 1, (w) => {
      wirke(w, "gesundheitsversorgung", -3 * ev.staerke);
      wirke(w, "wartezeiten", 4);
      vertrauenAendern(w, -2);
      return t("eva.pandemie.opt.offen.ausgang");
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "gesundheitsversorgung", -4 * ev.staerke);
    wirke(w, "wartezeiten", 5);
    vertrauenAendern(w, -3);
    return t("eva.pandemie.standard");
  },
};

// TODO (Realwelt-Stand 30.09.2026, RECHERCHE_REALWELT_LAENDERDOSSIERS.md — bewusst noch NICHT als Ereignisse gebaut):
// - Kaukasus-Paketdeal (Teil IV A3/A4): Der parafierte, aber unsignierte Friedensvertrag Armenien–Aserbaidschan hängt am
//   armenischen Verfassungsreferendum (frühestens 2027); die türkische Grenzöffnung zu Armenien ist an die Signatur gekoppelt.
//   Ideale Vorlage für eine Drei-Parteien-Paketverhandlung (Eriwan–Baku–Ankara): TRIPP-Transit gegen Grenzöffnung gegen
//   Verfassungsschritt; Ausstrahlung auf IRN (verliert Transitmonopol) und GEO (Umgehungsrisiko). Vermittlungs-Priorität 2.
// - Zypern-Fenster (Teil IV B1, Dossier 17): Das informelle 5+1-Treffen (beide Gemeinschaften + Garantiemächte + UN) sollte bis
//   Ende 2026 (Amtsende Guterres) zustande kommen; der Norden ist seit 10/2025 föderationsorientiert. Ein Erfolg entblockt die
//   EU-Türkei-Datei (Zollunion, SAFE) und entlastet die Ägäis-Front, ein Scheitern vergiftet sie — Event-Kette mit EU/GRC-Koppler.

export const AUSSEN_VORLAGEN: Vorlage[] = [GRENZZWISCHENFALL, EU_ANGEBOT, IWF, RATING, NATO, GASVERTRAG, GASFUND, CYBER, WELTKRISE, PANDEMIE];

