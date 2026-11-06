// Weitere Ereignisvorlagen: Innenpolitik, Wirtschaft, Gesellschaft, Katastrophen.
// Jede Vorlage ist ein Muster aus dem Zustand der Welt (Bedingung), mit mindestens zwei Antworten, die etwas kosten,
// und einer schlechteren Standardfolge, wenn der Präsident schweigt. Alle Wahrscheinlichkeiten und Wirkungen sind
// Platzhalter der Kalibrierung; Zahlen im Text kommen aus dem Weltzustand, nie aus dem Kopf.
//
// TODO (Energie-Modul): Innenpolitische Folge-Ereignisse der Energie-Hooks aus
// RECHERCHE_ENERGIE.md, Abschnitt 6.3 hier ergänzen — Rationierung (erst Industrie,
// nie Haushalte), Tarifsprünge und Wählerreaktionen auf „Preiswahrheit“, Lokalproteste
// bei heimischer Kohle. Anknüpfung: p_energiemangel, energiepreise, strompreis,
// m_preiswahrheit, m_heimische_kohle (politiknetz.ts).

import { wirke, wertIn, vertrauenAendern } from "./wirkung";
import { marktSchock } from "./maerkte";
import { medienEntspannung, medienHaerte, medienVerfahren } from "./medien";
import { kommunalwahlDurchfuehren, kommunalwahlFaellig, kommunenVon, istLagerPartei, setzeZwangsverwalter } from "./kommunen";
import { schreibeHaushaltFort } from "./haushalt";
import { setPolicy } from "./handeln";
import { stufeIn } from "./handeln";
import { beginne, beginneRegional, regionalPlan, vergabeAngebot, vorhabenSicht } from "./reich";
import { anrede, figur, loyalitaetAendern, zufallsName } from "./figuren";
import { BANKEN, KOHLEFIRMEN, TEXTILFIRMEN, ZEITUNGEN, waehle } from "./akteure";
import { PROZ_STADT, akutIn, beschr, jahrVon, kosten, monatVon, netz, nf, opt, sommer, ziehe } from "./ereignis-hilfen";
import type { Option, Vorlage } from "./ereignis-hilfen";
import { t } from "../i18n";
import { PROVINZEN } from "./regional";
import type { World } from "./types";

/**
 * Startet eine Antwort ein Bauvorhaben, bucht dessen Vergabe das Kapital (das Ereignis erstattet seinen eigenen Preis zurück).
 * `anzeigePk` nennt dann den Preis der Vergabe, damit die Bezahlbarkeit den ganzen Preis kennt.
 */
function vergabePreis(def: () => Parameters<typeof vergabeAngebot>[0] | undefined): { anzeigePk?: number } {
  try {
    const v = def();
    return v ? { anzeigePk: vergabeAngebot(v, "ausschreibung").pk } : {};
  } catch {
    return {};
  }
}

/** Provinznamen als Aufzählung für den Katalog (`{orte, list}`): im Deutschen wie `namen()` „A, B und C“, sonst nach Sprache. */
const orte = (provinzen: number[]): string[] => provinzen.map((p) => PROVINZEN[p - 1]?.name ?? String(p));

const KOHLE = [67, 43, 45, 74]; // Zonguldak, Kütahya, Manisa, Bartın
const SCHWARZMEER = [53, 61, 8, 28, 52, 55, 57, 67, 74, 37];
const TEXTIL = [16, 20, 59, 64, 46]; // Bursa, Denizli, Tekirdağ, Uşak, Kahramanmaraş
const AGRAR = [42, 63, 1, 33, 21, 47]; // Konya, Şanlıurfa, Adana, Mersin, Diyarbakır, Mardin

/** Lage zum Jahresende: Teuerung (ab 12 % Inflation), Rezession (Wachstum unter 0,5 % oder Arbeitslosigkeit deutlich über dem Start), sonst ruhiger Aufschwung. */
function mindestlohnLage(w: World): string {
  if (w.economy.inflation >= 12) return "teuerung";
  if (w.economy.growth < 0.5 || w.economy.unemployment > (w.spiel?.start.arbeitslosigkeit ?? 9) + 1.5) return "rezession";
  return "ruhe";
}

function mindestlohnRuhe(): Option[] {
  const k = (s: string) => `takt.var.mindestlohn.ruhe.${s}`;
  return [
    opt("reallohn", t(k("reallohn.label")), t(k("reallohn.beschr")), 2, (ww) => {
      setPolicy(ww, "m_mindestlohn", Math.min(100, netz(ww, "m_mindestlohn") + 10));
      wirke(ww, "arbeitnehmer", 2.5);
      wirke(ww, "unternehmer", -1.5);
      wirke(ww, "kostendruck", 1);
      return t(k("reallohn.ausgang"));
    }),
    opt("stabil", t(k("stabil.label")), t(k("stabil.beschr")), 1, (ww) => {
      setPolicy(ww, "m_mindestlohn", Math.min(100, netz(ww, "m_mindestlohn") + 5));
      wirke(ww, "arbeitnehmer", 1);
      return t(k("stabil.ausgang"));
    }),
    opt("aussetzen", t(k("aussetzen.label")), t(k("aussetzen.beschr")), 0, (ww) => {
      wirke(ww, "arbeitnehmer", -2.5);
      wirke(ww, "streikneigung", 2.5);
      wirke(ww, "unternehmer", 1.5);
      return t(k("aussetzen.ausgang"));
    }),
  ];
}

function mindestlohnRezession(): Option[] {
  const k = (s: string) => `takt.var.mindestlohn.rezession.${s}`;
  return [
    opt("halten", t(k("halten.label")), t(k("halten.beschr")), 1, (ww) => {
      wirke(ww, "arbeitnehmer", -1);
      wirke(ww, "streikneigung", 1.5);
      wirke(ww, "unternehmer", 1);
      return t(k("halten.ausgang"));
    }),
    opt("entlasten", t(k("entlasten.label")), t(k("entlasten.beschr")), 2, (ww) => {
      kosten(ww, 0.15);
      wirke(ww, "unternehmer", 2.5);
      wirke(ww, "mittelstand", 1.5);
      wirke(ww, "arbeitnehmer", -0.5);
      return t(k("entlasten.ausgang"));
    }),
    opt("trotzdem", t(k("trotzdem.label")), t(k("trotzdem.beschr")), 3, (ww) => {
      setPolicy(ww, "m_mindestlohn", Math.min(100, netz(ww, "m_mindestlohn") + 8));
      wirke(ww, "arbeitnehmer", 2.5);
      wirke(ww, "unternehmer", -3);
      wirke(ww, "arbeitslosigkeit", 1);
      return t(k("trotzdem.ausgang"));
    }),
  ];
}

const MINDESTLOHN: Vorlage = {
  id: "mindestlohn",
  szene: "istanbul",
  frist: 25,
  abkuehlung: 300,
  chance: (w) => (monatVon(w) === 12 ? 0.95 : 0),
  // Takt (Variantenpool): Die Lage des Landes bestimmt, welche Frage das Jahresende stellt: Teuerung, ruhiger Aufschwung oder Rezession
  erzeuge: (w) => ({ provinzen: [], staerke: 1, daten: { variante: mindestlohnLage(w) } }),
  titel: () => t("evi.mindestlohn.titel"),
  text: (w, ev) => ev.daten?.variante === "ruhe" ? [t("takt.var.mindestlohn.ruhe.text", { inflation: nf(w.published.inflation.value), wachstum: nf(w.economy.growth) })]
    : ev.daten?.variante === "rezession" ? [t("takt.var.mindestlohn.rezession.text", { wachstum: nf(w.economy.growth), arbeitslos: nf(w.economy.unemployment) })]
    : [
    t("evi.mindestlohn.text1", { inflation: nf(w.published.inflation.value) }),
  ],
  warum: (_, ev) => ev.daten?.variante === "ruhe" ? t("takt.var.mindestlohn.ruhe.warum") : ev.daten?.variante === "rezession" ? t("takt.var.mindestlohn.rezession.warum") : t("evi.mindestlohn.warum"),
  optionen: (_, ev) => ev.daten?.variante === "ruhe" ? mindestlohnRuhe() : ev.daten?.variante === "rezession" ? mindestlohnRezession() : [
    opt("kraeftig", t("evi.mindestlohn.opt.kraeftig.label"), beschr(3, 0, t("evi.mindestlohn.opt.kraeftig.folge")), 3, (ww) => {
      setPolicy(ww, "m_mindestlohn", Math.min(100, netz(ww, "m_mindestlohn") + 15));
      wirke(ww, "arbeitnehmer", 3);
      wirke(ww, "unternehmer", -3);
      wirke(ww, "kostendruck", 2);
      return t("evi.mindestlohn.opt.kraeftig.ausgang");
    }),
    opt("mass", t("evi.mindestlohn.opt.mass.label"), beschr(1, 0, t("evi.mindestlohn.opt.mass.folge")), 1, (ww) => {
      setPolicy(ww, "m_mindestlohn", Math.min(100, netz(ww, "m_mindestlohn") + 6));
      wirke(ww, "arbeitnehmer", 1);
      return t("evi.mindestlohn.opt.mass.ausgang");
    }),
    opt("einfrieren", t("evi.mindestlohn.opt.einfrieren.label"), beschr(0, 0, t("evi.mindestlohn.opt.einfrieren.folge")), 0, (ww) => {
      wirke(ww, "arbeitnehmer", -4);
      wirke(ww, "streikneigung", 4);
      wirke(ww, "unternehmer", 2);
      return t("evi.mindestlohn.opt.einfrieren.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "arbeitnehmer", -3);
    wirke(w, "streikneigung", 3);
    return t("evi.mindestlohn.standard");
  },
};

/** Lage im Oktober: Sparzwang (Defizit ab 4,5 % des BIP), Wahljahr (Wahl binnen etwa 13 Monaten) oder ruhiges Jahr. */
function haushaltLage(w: World): string {
  if (w.economy.deficit >= 4.5) return "defizit";
  const bisWahl = (w.spiel?.wahltag ?? 1e9) - w.day;
  if (bisWahl >= 0 && bisWahl <= 400) return "wahljahr";
  return "ruhe";
}

const HAUSHALTSJAHR: Vorlage = {
  id: "haushaltsjahr",
  szene: "bank",
  frist: 25,
  abkuehlung: 300,
  // WIR-3: Das Haushaltsfenster öffnet jedes Jahr zuverlässig (Auto-Stopp Klasse A über das Ereignis)
  chance: (w) => (monatVon(w) === 10 && jahrVon(w) >= 2028 ? 1 : 0),
  // Takt (Variantenpool): Sparzwang, Wahljahr oder ruhiges Jahr geben dem Haushaltsfenster jeweils eine eigene Frage
  erzeuge: (w) => ({ provinzen: [], staerke: 1, daten: { variante: haushaltLage(w) } }),
  titel: () => t("evi.haushaltsjahr.titel"),
  text: (w, ev) => [
    t("evi.haushaltsjahr.text1", { wer: anrede(figur(w, "finanzen")), schulden: nf(w.economy.debtRatio), inflation: nf(w.published.inflation.value) }),
    ...(ev.daten?.variante === "defizit" ? [t("takt.var.haushaltsjahr.defizit.text", { defizit: nf(w.economy.deficit) })] : ev.daten?.variante === "wahljahr" ? [t("takt.var.haushaltsjahr.wahljahr.text")] : []),
    t("evi.haushaltsjahr.text2"),
  ],
  warum: () => t("evi.haushaltsjahr.warum"),
  optionen: (_, ev) => [
    ...(ev.daten?.variante === "defizit"
      ? [
          opt("sparpaket", t("takt.var.haushaltsjahr.defizit.sparpaket.label"), t("takt.var.haushaltsjahr.defizit.sparpaket.beschr"), 2, (w) => {
            kosten(w, -0.4);
            wirke(w, "arbeitnehmer", -1.5);
            wirke(w, "vertrauen_maerkte", 1.5);
            return t("takt.var.haushaltsjahr.defizit.sparpaket.ausgang");
          }),
        ]
      : ev.daten?.variante === "wahljahr"
        ? [
            opt("wahlgeschenke", t("takt.var.haushaltsjahr.wahljahr.wahlgeschenke.label"), t("takt.var.haushaltsjahr.wahljahr.wahlgeschenke.beschr"), 2, (w) => {
              kosten(w, 0.3);
              wirke(w, "rentner", 2.5);
              wirke(w, "arbeitnehmer", 2);
              wirke(w, "vertrauen_maerkte", -1.2);
              return t("takt.var.haushaltsjahr.wahljahr.wahlgeschenke.ausgang");
            }),
          ]
        : []),
    opt("entwurf", t("evi.haushaltsjahr.opt.entwurf.label"), beschr(0, 0, t("evi.haushaltsjahr.opt.entwurf.folge")), 0, () => t("evi.haushaltsjahr.opt.entwurf.ausgang")),
    opt("fortschreiben", t("evi.haushaltsjahr.opt.fortschreiben.label"), beschr(0, 0, t("evi.haushaltsjahr.opt.fortschreiben.folge")), 0, (w) => {
      schreibeHaushaltFort(w);
      return t("evi.haushaltsjahr.opt.fortschreiben.ausgang");
    }),
  ],
  standard: (w) => {
    schreibeHaushaltFort(w);
    return t("evi.haushaltsjahr.standard");
  },
};

const BERGWERK: Vorlage = {
  id: "bergwerksunglueck",
  szene: "anatolien",
  frist: 6,
  abkuehlung: 500,
  chance: (w) => 0.008 + Math.max(0, netz(w, "korruption") - 45) * 0.0007,
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => (KOHLE.includes(pl) ? 1 : 0), 1);
    return p.length ? { provinzen: p, staerke: 0.6 + 0.4 * rng.next(), daten: { firma: waehle(rng, KOHLEFIRMEN) } } : null;
  },
  titel: (_, ev) => t("evi.bergwerksunglueck.titel", { firma: String(ev.daten?.firma) }),
  text: (_, ev) => [
    t("evi.bergwerksunglueck.text1", { firma: String(ev.daten?.firma), orte: orte(ev.provinzen) }),
  ],
  warum: () => t("evi.bergwerksunglueck.warum"),
  eroeffne: (w, ev) => {
    wirke(w, "streikneigung", 4 * ev.staerke);
    vertrauenAendern(w, -1.5 * ev.staerke);
  },
  optionen: (_, ev) => [
    opt("untersuchen", t("evi.bergwerksunglueck.opt.untersuchen.label"), beschr(4, 0.05, t("evi.bergwerksunglueck.opt.untersuchen.folge")), 4, (w) => {
      kosten(w, 0.05);
      wirke(w, "justizvertrauen", 3);
      wirke(w, "korruption", -2);
      wirke(w, "arbeitnehmer", 2);
      wirke(w, "unternehmer", -2);
      vertrauenAendern(w, 1 * ev.staerke);
      return t("evi.bergwerksunglueck.opt.untersuchen.ausgang");
    }),
    opt("entschaedigen", t("evi.bergwerksunglueck.opt.entschaedigen.label"), beschr(2, 0.05, t("evi.bergwerksunglueck.opt.entschaedigen.folge")), 2, (w) => {
      kosten(w, 0.05);
      wirke(w, "arbeitnehmer", 1);
      vertrauenAendern(w, 1.5 * ev.staerke);
      return t("evi.bergwerksunglueck.opt.entschaedigen.ausgang");
    }),
    opt("betreiber", t("evi.bergwerksunglueck.opt.betreiber.label"), beschr(1, 0, t("evi.bergwerksunglueck.opt.betreiber.folge")), 1, (w) => {
      wirke(w, "justizvertrauen", -3);
      wirke(w, "streikneigung", 4);
      vertrauenAendern(w, -1);
      return t("evi.bergwerksunglueck.opt.betreiber.ausgang");
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "streikneigung", 4);
    vertrauenAendern(w, -2 * ev.staerke);
    return t("evi.bergwerksunglueck.standard");
  },
};

const UEBERSCHWEMMUNG: Vorlage = {
  id: "ueberschwemmung",
  szene: "anatolien",
  frist: 6,
  abkuehlung: 240,
  // Nur noch der Risiko-Layer (sim/katastrophe.ts, Sturzflut) löst Fluten aus, mit Fall und Abschluss; die Vorlage bleibt für ältere Spielstände.
  chance: () => 0,
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => (SCHWARZMEER.includes(pl) ? 1 : 0), 2);
    return p.length ? { provinzen: p, staerke: 0.4 + 0.6 * rng.next() } : null;
  },
  titel: () => t("evi.ueberschwemmung.titel"),
  text: (_, ev) => [t("evi.ueberschwemmung.text1", { orte: orte(ev.provinzen) })],
  warum: () => t("evi.ueberschwemmung.warum"),
  eroeffne: (w, ev) => {
    wirke(w, "verkehrsnetz", -6 * ev.staerke, ev.provinzen);
    wirke(w, "ernte", -4 * ev.staerke, ev.provinzen);
    wirke(w, "wasserversorgung", -3 * ev.staerke, ev.provinzen);
  },
  optionen: (_, ev) => [
    opt("hilfe", t("evi.ueberschwemmung.opt.hilfe.label"), beschr(3, 0.15, t("evi.ueberschwemmung.opt.hilfe.folge")), 3, (w) => {
      kosten(w, 0.15);
      wirke(w, "verkehrsnetz", 5 * ev.staerke, ev.provinzen);
      wirke(w, "ernte", 2, ev.provinzen);
      vertrauenAendern(w, 1.5);
      return t("evi.ueberschwemmung.opt.hilfe.ausgang");
    }),
    opt("schutz", t("evi.ueberschwemmung.opt.schutz.label"), beschr(5, 0.3, t("evi.ueberschwemmung.opt.schutz.folge")), 5, (w) => {
      kosten(w, 0.3);
      wirke(w, "verkehrsnetz", 3 * ev.staerke, ev.provinzen);
      wirke(w, "landflucht", 2, ev.provinzen);
      vertrauenAendern(w, 0.5);
      return t("evi.ueberschwemmung.opt.schutz.ausgang");
    }),
    opt("kommunen", t("evi.ueberschwemmung.opt.kommunen.label"), beschr(0, 0, t("evi.ueberschwemmung.opt.kommunen.folge")), 0, (w) => {
      vertrauenAendern(w, -1.5);
      return t("evi.ueberschwemmung.opt.kommunen.ausgang");
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "verkehrsnetz", -2 * ev.staerke, ev.provinzen);
    vertrauenAendern(w, -2 * ev.staerke);
    return t("evi.ueberschwemmung.standard");
  },
};

const BANKENSTRESS: Vorlage = {
  id: "bankenstress",
  szene: "bank",
  frist: 6,
  abkuehlung: 400,
  chance: (w) => (w.economy.riskPremium > 350 || netz(w, "vertrauen_maerkte") < 36 ? 0.12 : 0.004),
  erzeuge: (_, rng) => ({ provinzen: [], staerke: 1, daten: { bank: waehle(rng, BANKEN) } }),
  titel: (_, ev) => t("evi.bankenstress.titel", { bank: String(ev.daten?.bank) }),
  text: (w, ev) => [
    t("evi.bankenstress.text1", { bank: String(ev.daten?.bank), aufschlag: nf(w.economy.riskPremium, 0) }),
  ],
  warum: () => t("evi.bankenstress.warum"),
  eroeffne: (w) => {
    wirke(w, "kredite", -4);
    wirke(w, "vertrauen_maerkte", -3);
  },
  optionen: () => [
    opt("liquiditaet", t("evi.bankenstress.opt.liquiditaet.label"), beschr(4, 0.4, t("evi.bankenstress.opt.liquiditaet.folge")), 4, (w) => {
      kosten(w, 0.4);
      wirke(w, "kredite", 5);
      wirke(w, "vertrauen_maerkte", 3);
      return t("evi.bankenstress.opt.liquiditaet.ausgang");
    }),
    opt("abwickeln", t("evi.bankenstress.opt.abwickeln.label"), beschr(3, 0.15, t("evi.bankenstress.opt.abwickeln.folge")), 3, (w) => {
      kosten(w, 0.15);
      wirke(w, "vertrauen_maerkte", 4);
      wirke(w, "mittelstand", -2);
      wirke(w, "kredite", -2);
      return t("evi.bankenstress.opt.abwickeln.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "kredite", -4);
    wirke(w, "vertrauen_maerkte", -4);
    w.economy.riskPremium += 25;
    return t("evi.bankenstress.standard");
  },
};

const STUDENTEN: Vorlage = {
  id: "studentenproteste",
  szene: "istanbul",
  frist: 10,
  abkuehlung: 300,
  chance: (w) => (netz(w, "m_wissenschaftsfreiheit") < 45 ? 0.03 : 0.004) + (akutIn(w, "p_jugendarbeitslosigkeit").length > 0 ? 0.015 : 0),
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => (PROZ_STADT.has(pl) ? 1 : 0.1), 2);
    return p.length ? { provinzen: p, staerke: 0.5 + 0.5 * rng.next() } : null;
  },
  titel: () => t("evi.studentenproteste.titel"),
  text: (_, ev) => [t("evi.studentenproteste.text1", { orte: orte(ev.provinzen) })],
  warum: () => t("evi.studentenproteste.warum"),
  eroeffne: (w, ev) => {
    wirke(w, "junge", -3 * ev.staerke);
    wirke(w, "polarisierung", 2 * ev.staerke);
  },
  optionen: (_, ev) => [
    opt("dialog", t("evi.studentenproteste.opt.dialog.label"), beschr(3, 0.1, t("evi.studentenproteste.opt.dialog.folge")), 3, (w) => {
      kosten(w, 0.1);
      wirke(w, "junge", 4 * ev.staerke);
      wirke(w, "hochschule", 1);
      wirke(w, "polarisierung", -1);
      return t("evi.studentenproteste.opt.dialog.ausgang");
    }),
    opt("raeumen", t("evi.studentenproteste.opt.raeumen.label"), beschr(2, 0, t("evi.studentenproteste.opt.raeumen.folge")), 2, (w) => {
      wirke(w, "junge", -5);
      wirke(w, "pressefreiheit", -2);
      wirke(w, "polarisierung", 3);
      wirke(w, "beziehungen_eu", -2);
      loyalitaetAendern(w, "inneres", 3);
      return t("evi.studentenproteste.opt.raeumen.ausgang");
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "junge", -3 * ev.staerke);
    wirke(w, "polarisierung", 2);
    return t("evi.studentenproteste.standard");
  },
};

const PRESSE: Vorlage = {
  id: "pressekonflikt",
  szene: "istanbul",
  frist: 8,
  abkuehlung: 400,
  // Laufende Verfahren gegen Journalisten (Eingriff „Anzeige gegen Journalisten“, sim/medien.ts) machen den Konflikt wahrscheinlicher
  chance: (w) => (netz(w, "pressefreiheit") < 55 ? 0.02 : 0.006) + 0.008 * medienVerfahren(w),
  // Runde „Netz atmet“: Festnahmen von Journalisten erschrecken die Anleger (sim/maerkte.ts)
  eroeffne: (w) => {
    marktSchock(w, "presse", 0.8);
  },
  erzeuge: (w, rng) => ({ provinzen: [], staerke: 1, daten: { blatt: waehle(rng, ZEITUNGEN), chef: zufallsName(w, rng) } }),
  titel: (_, ev) => t("evi.pressekonflikt.titel", { blatt: String(ev.daten?.blatt) }),
  text: (_, ev) => [
    t("evi.pressekonflikt.text1", { blatt: String(ev.daten?.blatt), chef: String(ev.daten?.chef) }),
  ],
  warum: () => t("evi.pressekonflikt.warum"),
  optionen: () => [
    opt("freilassen", t("evi.pressekonflikt.opt.freilassen.label"), beschr(3, 0, t("evi.pressekonflikt.opt.freilassen.folge")), 3, (w) => {
      wirke(w, "pressefreiheit", 3);
      wirke(w, "ansehen", 2);
      wirke(w, "beziehungen_eu", 2);
      wirke(w, "polarisierung", -1);
      marktSchock(w, "presse", -0.6);
      medienEntspannung(w);
      loyalitaetAendern(w, "inneres", -4, t("evi.pressekonflikt.opt.freilassen.grund"));
      return t("evi.pressekonflikt.opt.freilassen.ausgang");
    }),
    opt("justiz", t("evi.pressekonflikt.opt.justiz.label"), beschr(1, 0, t("evi.pressekonflikt.opt.justiz.folge")), 1, (w) => {
      wirke(w, "ansehen", -1);
      return t("evi.pressekonflikt.opt.justiz.ausgang");
    }),
    opt("haerte", t("evi.pressekonflikt.opt.haerte.label"), beschr(2, 0, t("evi.pressekonflikt.opt.haerte.folge")), 2, (w) => {
      wirke(w, "pressefreiheit", -5);
      wirke(w, "polarisierung", 3);
      wirke(w, "beziehungen_eu", -4);
      wirke(w, "ansehen", -3);
      wirke(w, "konservative", 2);
      marktSchock(w, "presse", 1);
      medienHaerte(w);
      loyalitaetAendern(w, "inneres", 3);
      return t("evi.pressekonflikt.opt.haerte.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "ansehen", -1);
    wirke(w, "polarisierung", 1);
    return t("evi.pressekonflikt.standard");
  },
};

const BAUAMNESTIE: Vorlage = {
  id: "bauamnestie_forderung",
  szene: "parlament",
  frist: 20,
  abkuehlung: 400,
  chance: (w) => (netz(w, "m_bauamnestie") < 40 ? 0.018 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("evi.bauamnestie_forderung.titel"),
  text: (w) => [
    t("evi.bauamnestie_forderung.text1", { wer: anrede(figur(w, "partner")) || t("evi.bauamnestie_forderung.partner_ersatz") }),
  ],
  warum: () => t("evi.bauamnestie_forderung.warum"),
  optionen: () => [
    opt("zustimmen", t("evi.bauamnestie_forderung.opt.zustimmen.label"), beschr(0, -0.1, t("evi.bauamnestie_forderung.opt.zustimmen.folge")), 0, (w) => {
      kosten(w, -0.1);
      vertrauenAendern(w, 2);
      wirke(w, "steuereinnahmen", 2);
      loyalitaetAendern(w, "partner", 8);
      // Die Amnestie gilt als Maßnahme fort, auf der Stufe, die ihr Text beschreibt (data/skalen.ts: 45 = „Legalisierung
      // gegen Gebühr, ohne Prüfung der Statik“). Bauqualität und Erdbebenvorsorge sinken über die Kanten der Maßnahme
      // (data/politiknetz.ts), daher hier kein zusätzlicher Sofortabzug: sonst zählte derselbe Schaden doppelt.
      setPolicy(w, "m_bauamnestie", Math.max(45, stufeIn(w, "m_bauamnestie", null)));
      return t("wort.bauamnestie.ausgang");
    }),
    opt("statik", t("evi.bauamnestie_forderung.opt.statik.label"), beschr(3, 0, t("evi.bauamnestie_forderung.opt.statik.folge")), 3, (w) => {
      wirke(w, "steuereinnahmen", 1);
      wirke(w, "bauqualitaet", -1);
      loyalitaetAendern(w, "partner", 3);
      return t("evi.bauamnestie_forderung.opt.statik.ausgang");
    }),
    opt("ablehnen", t("evi.bauamnestie_forderung.opt.ablehnen.label"), beschr(2, 0, t("evi.bauamnestie_forderung.opt.ablehnen.folge")), 2, (w) => {
      wirke(w, "bauqualitaet", 1);
      loyalitaetAendern(w, "partner", -8, t("evi.bauamnestie_forderung.opt.ablehnen.grund"));
      return t("evi.bauamnestie_forderung.opt.ablehnen.ausgang");
    }),
  ],
  standard: (w) => {
    loyalitaetAendern(w, "partner", -5);
    return t("evi.bauamnestie_forderung.standard");
  },
};

const RENTNER: Vorlage = {
  id: "rentnerprotest",
  szene: "anatolien",
  frist: 10,
  abkuehlung: 300,
  chance: (w) => (w.economy.inflation > 12 && netz(w, "rentenniveau") < 52 ? 0.07 : 0.004),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("evi.rentnerprotest.titel"),
  text: (w) => [t("evi.rentnerprotest.text1", { inflation: nf(w.published.inflation.value) })],
  warum: () => t("evi.rentnerprotest.warum"),
  optionen: () => [
    opt("erhoehen", t("evi.rentnerprotest.opt.erhoehen.label"), beschr(3, 0.3, t("evi.rentnerprotest.opt.erhoehen.folge")), 3, (w) => {
      kosten(w, 0.3);
      wirke(w, "rentner", 5);
      wirke(w, "armut", -2);
      loyalitaetAendern(w, "finanzen", -3);
      return t("evi.rentnerprotest.opt.erhoehen.ausgang");
    }),
    opt("einmal", t("evi.rentnerprotest.opt.einmal.label"), beschr(2, 0.15, t("evi.rentnerprotest.opt.einmal.folge")), 2, (w) => {
      kosten(w, 0.15);
      wirke(w, "rentner", 3);
      return t("evi.rentnerprotest.opt.einmal.ausgang");
    }),
    opt("ablehnen", t("evi.rentnerprotest.opt.ablehnen.label"), beschr(0, 0, t("evi.rentnerprotest.opt.ablehnen.folge")), 0, (w) => {
      wirke(w, "rentner", -4);
      return t("evi.rentnerprotest.opt.ablehnen.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "rentner", -3);
    vertrauenAendern(w, -1);
    return t("evi.rentnerprotest.standard");
  },
};

const EPIDEMIE: Vorlage = {
  id: "grippewelle",
  szene: "parlament",
  frist: 8,
  abkuehlung: 300,
  chance: (w) => {
    const winter = [11, 12, 1, 2, 3].includes(monatVon(w));
    return winter ? 0.025 + (netz(w, "gesundheitsversorgung") < 55 ? 0.025 : 0) : 0;
  },
  erzeuge: (_, rng) => ({ provinzen: [], staerke: 0.5 + 0.5 * rng.next() }),
  titel: () => t("evi.grippewelle.titel"),
  text: () => [t("evi.grippewelle.text1")],
  warum: () => t("evi.grippewelle.warum"),
  eroeffne: (w, ev) => {
    wirke(w, "gesundheitsversorgung", -4 * ev.staerke);
    wirke(w, "wartezeiten", 5 * ev.staerke);
    wirke(w, "produktivitaet", -1);
  },
  optionen: () => [
    opt("impfen", t("evi.grippewelle.opt.impfen.label"), beschr(2, 0.1, t("evi.grippewelle.opt.impfen.folge")), 2, (w) => {
      kosten(w, 0.1);
      wirke(w, "gesundheitsversorgung", 3);
      wirke(w, "wartezeiten", -2);
      return t("evi.grippewelle.opt.impfen.ausgang");
    }),
    opt("kapazitaet", t("evi.grippewelle.opt.kapazitaet.label"), beschr(4, 0.25, t("evi.grippewelle.opt.kapazitaet.folge")), 4, (w) => {
      kosten(w, 0.25);
      wirke(w, "gesundheitsversorgung", 4);
      wirke(w, "wartezeiten", -4);
      wirke(w, "aerzte", 1);
      return t("evi.grippewelle.opt.kapazitaet.ausgang");
    }),
    opt("abwarten", t("evi.grippewelle.opt.abwarten.label"), beschr(0, 0, t("evi.grippewelle.opt.abwarten.folge")), 0, (w) => {
      vertrauenAendern(w, -1);
      return t("evi.grippewelle.opt.abwarten.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "wartezeiten", 3);
    vertrauenAendern(w, -1.5);
    return t("evi.grippewelle.standard");
  },
};

const BAUERN: Vorlage = {
  id: "bauernproteste",
  szene: "anatolien",
  frist: 10,
  abkuehlung: 300,
  chance: (w) => (netz(w, "landwirte") < 42 ? 0.05 : 0.004),
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => (AGRAR.includes(pl) ? 1 + (100 - wertIn(w, "landwirtschaft_einkommen", [pl])) / 50 : 0.05), 3);
    return p.length ? { provinzen: p, staerke: 0.5 + 0.5 * rng.next() } : null;
  },
  titel: () => t("evi.bauernproteste.titel"),
  text: (_, ev) => [t("evi.bauernproteste.text1", { orte: orte(ev.provinzen) })],
  warum: () => t("evi.bauernproteste.warum"),
  eroeffne: (w, ev) => {
    wirke(w, "landwirte", -3 * ev.staerke);
    wirke(w, "landflucht", 2, ev.provinzen);
  },
  optionen: (_, ev) => [
    opt("subventionen", t("evi.bauernproteste.opt.subventionen.label"), beschr(3, 0.2, t("evi.bauernproteste.opt.subventionen.folge")), 3, (w) => {
      setPolicy(w, "m_agrarsubventionen", Math.min(100, netz(w, "m_agrarsubventionen") + 12));
      wirke(w, "landwirte", 4 * ev.staerke);
      return t("evi.bauernproteste.opt.subventionen.ausgang");
    }),
    opt("mindestpreise", t("evi.bauernproteste.opt.mindestpreise.label"), beschr(2, 0.05, t("evi.bauernproteste.opt.mindestpreise.folge")), 2, (w) => {
      kosten(w, 0.05);
      wirke(w, "landwirte", 4 * ev.staerke);
      wirke(w, "lebensmittelpreise", 3);
      return t("evi.bauernproteste.opt.mindestpreise.ausgang");
    }),
    opt("gespraech", t("evi.bauernproteste.opt.gespraech.label"), beschr(1, 0, t("evi.bauernproteste.opt.gespraech.folge")), 1, (w) => {
      wirke(w, "landwirte", 1);
      return t("evi.bauernproteste.opt.gespraech.ausgang");
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "landwirte", -3 * ev.staerke);
    vertrauenAendern(w, -1);
    return t("evi.bauernproteste.standard");
  },
};

const FABRIK: Vorlage = {
  id: "fabrikschliessungen",
  szene: "anatolien",
  frist: 10,
  abkuehlung: 300,
  chance: (w) => (netz(w, "kostendruck") > 58 ? 0.05 : 0.004),
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => (TEXTIL.includes(pl) ? 1 : 0.02), 2);
    return p.length ? { provinzen: p, staerke: 0.5 + 0.5 * rng.next(), daten: { firma: waehle(rng, TEXTILFIRMEN) } } : null;
  },
  titel: (_, ev) => t("evi.fabrikschliessungen.titel", { firma: String(ev.daten?.firma) }),
  text: (_, ev) => [t("evi.fabrikschliessungen.text1", { firma: String(ev.daten?.firma), orte: orte(ev.provinzen) })],
  warum: () => t("evi.fabrikschliessungen.warum"),
  eroeffne: (w, ev) => {
    wirke(w, "arbeitsplaetze_industrie", -4 * ev.staerke, ev.provinzen);
    wirke(w, "industrie", -2 * ev.staerke, ev.provinzen);
    wirke(w, "streikneigung", 2);
  },
  optionen: (_, ev) => [
    opt("kurzarbeit", t("evi.fabrikschliessungen.opt.kurzarbeit.label"), beschr(3, 0.15, t("evi.fabrikschliessungen.opt.kurzarbeit.folge")), 3, (w) => {
      kosten(w, 0.15);
      wirke(w, "arbeitsplaetze_industrie", 3 * ev.staerke, ev.provinzen);
      wirke(w, "arbeitnehmer", 2);
      return t("evi.fabrikschliessungen.opt.kurzarbeit.ausgang");
    }),
    opt("kredit", t("evi.fabrikschliessungen.opt.kredit.label"), beschr(3, 0.1, t("evi.fabrikschliessungen.opt.kredit.folge")), 3, (w) => {
      kosten(w, 0.1);
      wirke(w, "kredite", 2);
      wirke(w, "mittelstand", 2);
      wirke(w, "arbeitsplaetze_industrie", 2 * ev.staerke, ev.provinzen);
      return t("evi.fabrikschliessungen.opt.kredit.ausgang");
    }),
    opt("umschulen", t("evi.fabrikschliessungen.opt.umschulen.label"), beschr(4, 0.2, t("evi.fabrikschliessungen.opt.umschulen.folge")), 4, (w) => {
      kosten(w, 0.2);
      wirke(w, "fachkraefte", 2);
      wirke(w, "arbeitsplaetze_industrie", 1, ev.provinzen);
      return t("evi.fabrikschliessungen.opt.umschulen.ausgang");
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "arbeitsplaetze_industrie", -3 * ev.staerke, ev.provinzen);
    wirke(w, "armut", 2, ev.provinzen);
    vertrauenAendern(w, -1);
    return t("evi.fabrikschliessungen.standard");
  },
};

const KAYYUM: Vorlage = {
  id: "buergermeister_verfahren",
  szene: "parlament",
  frist: 10,
  abkuehlung: 400,
  chance: (w) => 0.006 + Math.max(0, netz(w, "polarisierung") - 50) * 0.0008,
  // Runde „Netz atmet“: Ein Verfahren gegen eine Stadtspitze der Opposition verunsichert die Anleger (sim/maerkte.ts)
  eroeffne: (w) => {
    marktSchock(w, "verhaftung", 0.6);
  },
  erzeuge: (w, rng) => {
    const p = ziehe(rng, (pl) => (PROZ_STADT.has(pl) ? 1 : 0), 1);
    if (!p.length) return null;
    // Die stärkste Fraktion außerhalb des Lagers stellt das Stadtoberhaupt
    const seats = Object.entries(w.parliament?.seats ?? {}).filter(([k]) => k !== w.player?.partei.kurz && !(w.spiel?.lager ?? []).includes(k)).sort((a, b) => b[1] - a[1]);
    // Das Rathaus vor Ort (sim/kommunen.ts): Gehört es dem Lager, sucht die Justiz sich kein Ziel dort
    const rathaus = w.spiel ? kommunenVon(w).rathaus[String(p[0])] : undefined;
    if (rathaus && istLagerPartei(w, rathaus.partei)) return null;
    return { provinzen: p, staerke: 1, daten: { name: zufallsName(w, rng), partei: rathaus?.partei ?? seats[0]?.[0] ?? "Opposition" } };
  },
  titel: (_, ev) => t("evi.buergermeister_verfahren.titel", { orte: orte(ev.provinzen) }),
  text: (_, ev) => [
    t("evi.buergermeister_verfahren.text1", {
      orte: orte(ev.provinzen),
      name: String(ev.daten?.name),
      // „Opposition“ ist der Ersatz aus erzeuge (keine Fraktion bekannt): nur für die Anzeige übersetzt, gespeichert bleibt der Wert
      partei: ev.daten?.partei === "Opposition" ? t("evi.buergermeister_verfahren.opposition") : String(ev.daten?.partei),
    }),
  ],
  warum: () => t("evi.buergermeister_verfahren.warum"),
  optionen: () => [
    opt("justiz", t("evi.buergermeister_verfahren.opt.justiz.label"), beschr(2, 0, t("evi.buergermeister_verfahren.opt.justiz.folge")), 2, (w) => {
      wirke(w, "justizvertrauen", 2);
      wirke(w, "polarisierung", -1);
      loyalitaetAendern(w, "inneres", -2);
      return t("evi.buergermeister_verfahren.opt.justiz.ausgang");
    }),
    opt("verwalter", t("evi.buergermeister_verfahren.opt.verwalter.label"), beschr(3, 0, t("evi.buergermeister_verfahren.opt.verwalter.folge")), 3, (w, ev) => {
      wirke(w, "polarisierung", 5);
      wirke(w, "justizvertrauen", -4);
      wirke(w, "ansehen", -3);
      wirke(w, "beziehungen_eu", -2);
      wirke(w, "staedtische_saekulare", -4);
      wirke(w, "konservative", 1);
      marktSchock(w, "verhaftung", 1.4);
      // Ortszustand mit Folgen bis zur nächsten Kommunalwahl (sim/kommunen.ts)
      for (const pl of ev.provinzen) setzeZwangsverwalter(w, pl);
      return t("evi.buergermeister_verfahren.opt.verwalter.ausgang");
    }),
    opt("dialog", t("evi.buergermeister_verfahren.opt.dialog.label"), beschr(2, 0, t("evi.buergermeister_verfahren.opt.dialog.folge")), 2, (w) => {
      wirke(w, "polarisierung", -2);
      vertrauenAendern(w, 1);
      wirke(w, "konservative", -1);
      return t("evi.buergermeister_verfahren.opt.dialog.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "polarisierung", 2);
    return t("evi.buergermeister_verfahren.standard");
  },
};

const TOURISMUS: Vorlage = {
  id: "tourismusrekord",
  szene: "anatolien",
  frist: 12,
  abkuehlung: 300,
  chance: (w) => (sommer(w) && netz(w, "tourismus") >= 50 ? 0.05 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("evi.tourismusrekord.titel"),
  text: () => [t("evi.tourismusrekord.text1")],
  warum: () => t("evi.tourismusrekord.warum"),
  optionen: (w0) => [
    // Befund A-4: Der Ausbau startet ein Bauvorhaben, dessen Vergabe mehr kostet als die 3 Kapital des Ereignisses; die Bezahlbarkeit
    // prüft deshalb den Preis der Vergabe (die Plakette misst die Buchung selbst).
    { ...opt("ausbauen", t("evi.tourismusrekord.opt.ausbauen.label"), beschr(3, 0.2, t("evi.tourismusrekord.opt.ausbauen.folge")), 3, (w) => {
      // Ein echtes Bauvorhaben in den Küstenprovinzen (Antalya, Muğla, İzmir); das Kapital des Ereignisses trägt die Vergabe
      w.spiel!.kapital += 3;
      const r = beginneRegional(w, "reg_strassen", [7, 48, 35]);
      if (r.ok) {
        wirke(w, "tourismus", 1);
        return t("wort.kueste.begonnen");
      }
      w.spiel!.kapital -= 3;
      kosten(w, 0.2);
      wirke(w, "tourismus", 3);
      wirke(w, "verkehrsnetz", 2);
      return t("wort.kueste.ohne_bau", { grund: r.text });
    }), ...vergabePreis(() => { const pl = regionalPlan(w0, "reg_strassen", [7, 48, 35]); return pl.ok ? pl.def : undefined; }) },
    opt("abgabe", t("evi.tourismusrekord.opt.abgabe.label"), beschr(1, -0.15, t("evi.tourismusrekord.opt.abgabe.folge")), 1, (w) => {
      kosten(w, -0.15);
      wirke(w, "steuereinnahmen", 1);
      wirke(w, "tourismus", -1);
      return t("evi.tourismusrekord.opt.abgabe.ausgang");
    }),
    opt("geniessen", t("evi.tourismusrekord.opt.geniessen.label"), beschr(0, 0, t("evi.tourismusrekord.opt.geniessen.folge")), 0, (w) => {
      vertrauenAendern(w, 0.5);
      return t("evi.tourismusrekord.opt.geniessen.ausgang");
    }),
  ],
  standard: () => t("evi.tourismusrekord.standard"),
};

const KANAL: Vorlage = {
  id: "kanal_istanbul",
  szene: "istanbul",
  frist: 30,
  abkuehlung: 3000,
  chance: (w) => (w.day > 200 ? 0.012 : 0),
  erzeuge: () => ({ provinzen: [34], staerke: 1 }),
  titel: () => t("evi.kanal_istanbul.titel"),
  text: () => [
    t("evi.kanal_istanbul.text1"),
  ],
  warum: () => t("evi.kanal_istanbul.warum"),
  optionen: (w0) => [
    // Befund A-4: „6 Kapital“ stand da, gebucht wurde der Preis der Vergabe (12). Die Bezahlbarkeit prüft jetzt diesen Preis.
    { ...opt("bauen", t("evi.kanal_istanbul.opt.bauen.label"), beschr(6, 1.0, t("evi.kanal_istanbul.opt.bauen.folge")), 6, (w) => {
      wirke(w, "konservative", 2);
      wirke(w, "staedtische_saekulare", -3);
      // Der Kanal wird ein echtes Bauvorhaben (data/reich/infrastruktur.ts): Kosten, Bauzeit und Folgen trägt das Vorhaben
      w.spiel!.kapital += 6;
      const r = beginne(w, "infra_kanal_istanbul");
      if (r.ok) return t("wort.kanal.begonnen");
      w.spiel!.kapital -= 6;
      wirke(w, "bauwirtschaft", 3, [34]);
      return t("wort.kanal.ohne_bau", { grund: r.text });
    }), ...vergabePreis(() => { const sv = vorhabenSicht(w0, "infra_kanal_istanbul"); return sv && !["fertig", "im_bau", "pausiert", "gesperrt", "ausgeschlossen"].includes(sv.status) ? sv.v : undefined; }) },
    opt("nahverkehr", t("evi.kanal_istanbul.opt.nahverkehr.label"), beschr(3, 0.3, t("evi.kanal_istanbul.opt.nahverkehr.folge")), 3, (w) => {
      kosten(w, 0.3);
      wirke(w, "stau", -4, [34]);
      wirke(w, "bauwirtschaft", 2, [34]);
      wirke(w, "staedtische_saekulare", 2);
      return t("evi.kanal_istanbul.opt.nahverkehr.ausgang");
    }),
    opt("verschieben", t("evi.kanal_istanbul.opt.verschieben.label"), beschr(0, 0, t("evi.kanal_istanbul.opt.verschieben.folge")), 0, (w) => {
      wirke(w, "bauwirtschaft", -1);
      return t("evi.kanal_istanbul.opt.verschieben.ausgang");
    }),
  ],
  standard: () => t("evi.kanal_istanbul.standard"),
};

const KOMMUNALWAHL: Vorlage = {
  id: "kommunalwahl",
  szene: "wahlnacht",
  frist: 25,
  abkuehlung: 3000,
  // Alle fünf Jahre (sim/kommunen.ts): 25.03.2029, dann Ende März 2034, 2039 …
  chance: (w) => (kommunalwahlFaellig(w) ? 1 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => t("evi.kommunalwahl.titel"),
  text: (w) => [
    t("evi.kommunalwahl.text1", { zustimmung: nf(w.spiel?.umfrage.zustimmung ?? 0, 0) }),
  ],
  warum: () => t("evi.kommunalwahl.warum"),
  optionen: (w) => {
    // Ergebnis je Provinz nach relativer Mehrheit: Hochburgen, Stimmung, Vertrauen vor Ort, Amtsbonus, Bündnisse und Zwangsverwaltung
    // (sim/kommunen.ts); der Wahlkampf gibt dem Lager einen Zuschlag in Prozentpunkten
    const ergebnis = (ww: typeof w, bonus = 0): string => kommunalwahlDurchfuehren(ww, bonus).text;
    return [
      opt("reisen", t("evi.kommunalwahl.opt.reisen.label"), beschr(4, 0, t("evi.kommunalwahl.opt.reisen.folge")), 4, (ww) => {
        vertrauenAendern(ww, 2);
        wirke(ww, "polarisierung", 2);
        return t("evi.kommunalwahl.opt.reisen.ausgang", { ergebnis: ergebnis(ww, 3) });
      }),
      opt("projekte", t("evi.kommunalwahl.opt.projekte.label"), beschr(3, 0.1, t("evi.kommunalwahl.opt.projekte.folge")), 3, (ww) => {
        kosten(ww, 0.1);
        wirke(ww, "verkehrsnetz", 2);
        vertrauenAendern(ww, 1.5);
        return t("evi.kommunalwahl.opt.projekte.ausgang", { ergebnis: ergebnis(ww, 2) });
      }),
      opt("sachlich", t("evi.kommunalwahl.opt.sachlich.label"), beschr(0, 0, t("evi.kommunalwahl.opt.sachlich.folge")), 0, (ww) => t("evi.kommunalwahl.opt.sachlich.ausgang", { ergebnis: ergebnis(ww) })),
    ];
  },
  standard: (w) => kommunalwahlDurchfuehren(w, 0).text,
};

export const INNEN_VORLAGEN: Vorlage[] = [
  MINDESTLOHN, HAUSHALTSJAHR, BERGWERK, UEBERSCHWEMMUNG, BANKENSTRESS, STUDENTEN, PRESSE, BAUAMNESTIE, RENTNER, EPIDEMIE, BAUERN, FABRIK, KAYYUM, TOURISMUS, KANAL, KOMMUNALWAHL,
];
