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
import { beginne, beginneRegional } from "./reich";
import { anrede, figur, loyalitaetAendern, zufallsName } from "./figuren";
import { BANKEN, KOHLEFIRMEN, TEXTILFIRMEN, ZEITUNGEN, waehle } from "./akteure";
import { PROZ_STADT, akutIn, beschr, jahrVon, kosten, monatVon, namen, netz, nf, opt, sommer, ziehe } from "./ereignis-hilfen";
import type { Option, Vorlage } from "./ereignis-hilfen";
import { t } from "../i18n";
import type { World } from "./types";

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
  titel: () => "Der Mindestlohn für das neue Jahr",
  text: (w, ev) => ev.daten?.variante === "ruhe" ? [t("takt.var.mindestlohn.ruhe.text", { inflation: nf(w.published.inflation.value), wachstum: nf(w.economy.growth) })]
    : ev.daten?.variante === "rezession" ? [t("takt.var.mindestlohn.rezession.text", { wachstum: nf(w.economy.growth), arbeitslos: nf(w.economy.unemployment) })]
    : [
    `Die Mindestlohnkommission legt zum Jahresende fest, was ab Januar gilt. Die Gewerkschaften verlangen einen Ausgleich für die Teuerung (Inflation ${nf(w.published.inflation.value)} %), die Arbeitgeber warnen vor Kosten, die kleine Betriebe nicht tragen können.`,
  ],
  warum: (_, ev) => ev.daten?.variante === "ruhe" ? t("takt.var.mindestlohn.ruhe.warum") : ev.daten?.variante === "rezession" ? t("takt.var.mindestlohn.rezession.warum") : "Der Mindestlohn ist der wichtigste Preis am Arbeitsmarkt: Er schützt die Ärmsten und stützt die Nachfrage, kostet aber Betriebe Spielraum und kann die Preise treiben.",
  optionen: (_, ev) => ev.daten?.variante === "ruhe" ? mindestlohnRuhe() : ev.daten?.variante === "rezession" ? mindestlohnRezession() : [
    opt("kraeftig", "Kräftig anheben", beschr(3, 0, "die Beschäftigten gewinnen, kleine Betriebe und die Preise stehen unter Druck."), 3, (ww) => {
      setPolicy(ww, "m_mindestlohn", Math.min(100, netz(ww, "m_mindestlohn") + 15));
      wirke(ww, "arbeitnehmer", 3);
      wirke(ww, "unternehmer", -3);
      wirke(ww, "kostendruck", 2);
      return "Der Mindestlohn steigt deutlich.";
    }),
    opt("mass", "Den Preisanstieg ausgleichen", beschr(1, 0, "ein Kompromiss, der beide Seiten unzufrieden lässt."), 1, (ww) => {
      setPolicy(ww, "m_mindestlohn", Math.min(100, netz(ww, "m_mindestlohn") + 6));
      wirke(ww, "arbeitnehmer", 1);
      return "Der Mindestlohn folgt der Inflation.";
    }),
    opt("einfrieren", "Einfrieren", beschr(0, 0, "die Betriebe atmen auf, die Streikneigung steigt."), 0, (ww) => {
      wirke(ww, "arbeitnehmer", -4);
      wirke(ww, "streikneigung", 4);
      wirke(ww, "unternehmer", 2);
      return "Der Mindestlohn bleibt, wie er ist.";
    }),
  ],
  standard: (w) => {
    wirke(w, "arbeitnehmer", -3);
    wirke(w, "streikneigung", 3);
    return "Ohne Entscheidung bleibt der Mindestlohn eingefroren; die Gewerkschaften sind verärgert.";
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
  titel: () => "Das Haushaltsfenster öffnet",
  text: (w, ev) => [
    `${anrede(figur(w, "finanzen"))} legt den Haushaltsentwurf für das nächste Jahr vor. Die Schulden liegen bei ${nf(w.economy.debtRatio)} % des BIP, die Inflation bei ${nf(w.published.inflation.value)} %.`,
    ...(ev.daten?.variante === "defizit" ? [t("takt.var.haushaltsjahr.defizit.text", { defizit: nf(w.economy.deficit) })] : ev.daten?.variante === "wahljahr" ? [t("takt.var.haushaltsjahr.wahljahr.text")] : []),
    "Vier Wochen lang stellen Sie die Regler des Haushalts kostenlos; danach geht der Entwurf als Haushaltsgesetz ins Parlament. Wer nichts einbringt, fährt mit dem Vorjahr weiter — die Posten laufen mit der Inflation automatisch mit.",
  ],
  warum: () => "Der Haushalt ist der größte parlamentarische Akt des Jahres: Einmal im Oktober werden alle Regler gemeinsam entschieden. Außerhalb des Fensters kostet jede Änderung als Nachtragshaushalt das Doppelte und etwas Legitimität.",
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
    opt("entwurf", "Den Entwurf selbst vorbereiten", beschr(0, 0, "die Regler in der Haushaltsakte sind jetzt kostenlos; das Gesetz braucht eine Mehrheit."), 0, () => "Das Fenster ist offen: Regler in der Haushaltsakte stellen — Pakete des Finanzministeriums lassen sich übernehmen — und das Haushaltsgesetz einbringen."),
    opt("fortschreiben", "Den Vorjahrshaushalt fortschreiben", beschr(0, 0, "keine Änderung, kein Risiko im Parlament."), 0, (w) => {
      schreibeHaushaltFort(w);
      return "Der Haushalt läuft unverändert weiter (inflationsausgeglichen).";
    }),
  ],
  standard: (w) => {
    schreibeHaushaltFort(w);
    return "Ohne Entscheidung läuft der Vorjahrshaushalt weiter (inflationsausgeglichen).";
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
  titel: (_, ev) => `Grubenunglück bei ${ev.daten?.firma}`,
  text: (_, ev) => [
    `Im Bergwerk der ${ev.daten?.firma} in ${namen(ev.provinzen)} ist es zu einem schweren Unglück gekommen; Rettungskräfte suchen nach Eingeschlossenen. Gewerkschaften sprechen von Warnungen, die jahrelang ignoriert wurden.`,
  ],
  warum: () => "Arbeitsschutz wird meist erst nach einem Unglück Thema. Aufsicht kostet Geld und Zeit, ihr Fehlen kostet Menschenleben und irgendwann das Vertrauen.",
  eroeffne: (w, ev) => {
    wirke(w, "streikneigung", 4 * ev.staerke);
    vertrauenAendern(w, -1.5 * ev.staerke);
  },
  optionen: (_, ev) => [
    opt("untersuchen", "Unabhängige Untersuchung und schärfere Aufsicht", beschr(4, 0.05, "der Bergbau wird teurer, das Vertrauen wächst."), 4, (w) => {
      kosten(w, 0.05);
      wirke(w, "justizvertrauen", 3);
      wirke(w, "korruption", -2);
      wirke(w, "arbeitnehmer", 2);
      wirke(w, "unternehmer", -2);
      vertrauenAendern(w, 1 * ev.staerke);
      return "Eine unabhängige Kommission untersucht das Unglück; die Aufsicht wird verschärft.";
    }),
    opt("entschaedigen", "Familien entschädigen und Nothilfe leisten", beschr(2, 0.05, "lindert die Not, ändert nichts an den Ursachen."), 2, (w) => {
      kosten(w, 0.05);
      wirke(w, "arbeitnehmer", 1);
      vertrauenAendern(w, 1.5 * ev.staerke);
      return "Die Familien der Opfer werden entschädigt.";
    }),
    opt("betreiber", "Die Verantwortung beim Betreiber suchen", beschr(1, 0, "schnell erledigt, aber die Gewerkschaften glauben es nicht."), 1, (w) => {
      wirke(w, "justizvertrauen", -3);
      wirke(w, "streikneigung", 4);
      vertrauenAendern(w, -1);
      return "Der Betreiber wird belangt; die Kritik an der Aufsicht bleibt.";
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "streikneigung", 4);
    vertrauenAendern(w, -2 * ev.staerke);
    return "Ohne Antwort wächst der Zorn der Bergleute und ihrer Familien.";
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
  titel: () => "Überschwemmungen am Schwarzen Meer",
  text: (_, ev) => [`Sturzfluten reißen in ${namen(ev.provinzen)} Brücken und Straßen mit; Dörfer sind abgeschnitten, Felder stehen unter Wasser.`],
  warum: () => "Steile Täler, Bebauung an Bachläufen und fehlender Hochwasserschutz machen aus Starkregen eine Katastrophe.",
  eroeffne: (w, ev) => {
    wirke(w, "verkehrsnetz", -6 * ev.staerke, ev.provinzen);
    wirke(w, "ernte", -4 * ev.staerke, ev.provinzen);
    wirke(w, "wasserversorgung", -3 * ev.staerke, ev.provinzen);
  },
  optionen: (_, ev) => [
    opt("hilfe", "Katastrophenhilfe und Wiederaufbau der Straßen", beschr(3, 0.15, "die Region kommt schneller auf die Beine."), 3, (w) => {
      kosten(w, 0.15);
      wirke(w, "verkehrsnetz", 5 * ev.staerke, ev.provinzen);
      wirke(w, "ernte", 2, ev.provinzen);
      vertrauenAendern(w, 1.5);
      return "Der Wiederaufbau der Straßen beginnt; Betroffene erhalten Hilfe.";
    }),
    opt("schutz", "Hochwasserschutz und Umsiedlung aus Gefahrenlagen", beschr(5, 0.3, "langfristig sicherer, kurzfristig teuer und unbeliebt bei den Umzuziehenden."), 5, (w) => {
      kosten(w, 0.3);
      wirke(w, "verkehrsnetz", 3 * ev.staerke, ev.provinzen);
      wirke(w, "landflucht", 2, ev.provinzen);
      vertrauenAendern(w, 0.5);
      return "Ein Hochwasserschutzprogramm wird aufgelegt; gefährdete Siedlungen werden verlegt.";
    }),
    opt("kommunen", "Den Kommunen die Aufräumarbeit überlassen", beschr(0, 0, "die Region fühlt sich allein gelassen."), 0, (w) => {
      vertrauenAendern(w, -1.5);
      return "Die Kommunen räumen auf, so gut sie können.";
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "verkehrsnetz", -2 * ev.staerke, ev.provinzen);
    vertrauenAendern(w, -2 * ev.staerke);
    return "Die Hilfe kommt spät; die Menschen in den Tälern fühlen sich im Stich gelassen.";
  },
};

const BANKENSTRESS: Vorlage = {
  id: "bankenstress",
  szene: "bank",
  frist: 6,
  abkuehlung: 400,
  chance: (w) => (w.economy.riskPremium > 350 || netz(w, "vertrauen_maerkte") < 36 ? 0.12 : 0.004),
  erzeuge: (_, rng) => ({ provinzen: [], staerke: 1, daten: { bank: waehle(rng, BANKEN) } }),
  titel: (_, ev) => `Die ${ev.daten?.bank} gerät ins Wanken`,
  text: (w, ev) => [
    `Die ${ev.daten?.bank}, eine Bank mittlerer Größe, kann ihre Refinanzierung nicht mehr sichern; Kunden heben Geld ab. Der Risikoaufschlag steht bei ${nf(w.economy.riskPremium, 0)} Basispunkten, die Märkte beobachten jede Reaktion.`,
  ],
  warum: () => "Banken leben von Vertrauen. Springt der Staat ein, sichert er die Ersparnisse und belohnt riskantes Wirtschaften; lässt er sie fallen, riskiert er einen Dominoeffekt.",
  eroeffne: (w) => {
    wirke(w, "kredite", -4);
    wirke(w, "vertrauen_maerkte", -3);
  },
  optionen: () => [
    opt("liquiditaet", "Liquidität bereitstellen", beschr(4, 0.4, "die Bank hält, die Kreditvergabe erholt sich, der Steuerzahler haftet."), 4, (w) => {
      kosten(w, 0.4);
      wirke(w, "kredite", 5);
      wirke(w, "vertrauen_maerkte", 3);
      return "Der Staat stellt der Bank Liquidität bereit.";
    }),
    opt("abwickeln", "Abwickeln und die Aufsicht durchgreifen lassen", beschr(3, 0.15, "der Markt lernt, die Kunden sind gesichert, kleine Firmen leiden."), 3, (w) => {
      kosten(w, 0.15);
      wirke(w, "vertrauen_maerkte", 4);
      wirke(w, "mittelstand", -2);
      wirke(w, "kredite", -2);
      return "Die Bank wird abgewickelt; die Einlagen sind gesichert.";
    }),
  ],
  standard: (w) => {
    wirke(w, "kredite", -4);
    wirke(w, "vertrauen_maerkte", -4);
    w.economy.riskPremium += 25;
    return "Ohne Entscheidung erfasst die Unruhe weitere Banken; der Risikoaufschlag steigt.";
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
  titel: () => "Studentinnen und Studenten gehen auf die Straße",
  text: (_, ev) => [`In ${namen(ev.provinzen)} besetzen Studierende Hörsäle und marschieren durch die Innenstädte: gegen Studiengebühren, Wohnungsnot und fehlende Aussichten auf Arbeit.`],
  warum: () => "Junge Menschen ohne Perspektive sind der verlässlichste Auslöser für Massenproteste; wie ein Staat mit ihnen umgeht, prägt sein Bild bei allen anderen.",
  eroeffne: (w, ev) => {
    wirke(w, "junge", -3 * ev.staerke);
    wirke(w, "polarisierung", 2 * ev.staerke);
  },
  optionen: (_, ev) => [
    opt("dialog", "Dialog und Stipendien", beschr(3, 0.1, "entspannt die Lage, kostet Geld."), 3, (w) => {
      kosten(w, 0.1);
      wirke(w, "junge", 4 * ev.staerke);
      wirke(w, "hochschule", 1);
      wirke(w, "polarisierung", -1);
      return "Der Präsident empfängt Studierendenvertreter; Stipendien werden aufgestockt.";
    }),
    opt("raeumen", "Hochschulen räumen lassen", beschr(2, 0, "Ruhe auf den Straßen, der Preis ist Vertrauen der Jungen und im Ausland."), 2, (w) => {
      wirke(w, "junge", -5);
      wirke(w, "pressefreiheit", -2);
      wirke(w, "polarisierung", 3);
      wirke(w, "beziehungen_eu", -2);
      loyalitaetAendern(w, "inneres", 3);
      return "Die Polizei räumt die besetzten Hörsäle.";
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "junge", -3 * ev.staerke);
    wirke(w, "polarisierung", 2);
    return "Die Proteste ziehen sich hin und werden lauter.";
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
  titel: (_, ev) => `Festnahmen bei der Zeitung ${ev.daten?.blatt}`,
  text: (_, ev) => [
    `Bei der Zeitung ${ev.daten?.blatt} sind der Chefredakteur ${ev.daten?.chef} und mehrere Reporter nach kritischen Berichten festgenommen worden. Verbände und die EU fordern ihre Freilassung; regierungsnahe Medien sprechen von Propaganda gegen den Staat.`,
  ],
  warum: () => "Kontrolle über die Medien verschafft kurz Ruhe, kostet aber Glaubwürdigkeit im Land und Ansehen im Ausland; ein Staat, der Kritik einsperrt, bekommt dafür die schlechteren Informationen.",
  optionen: () => [
    opt("freilassen", "Die Freilassung veranlassen und die Verfahren prüfen", beschr(3, 0, "die Pressefreiheit und das Ausland danken es, die Sicherheitskräfte murren."), 3, (w) => {
      wirke(w, "pressefreiheit", 3);
      wirke(w, "ansehen", 2);
      wirke(w, "beziehungen_eu", 2);
      wirke(w, "polarisierung", -1);
      marktSchock(w, "presse", -0.6);
      medienEntspannung(w);
      loyalitaetAendern(w, "inneres", -4, "Die Innenministerin sieht ihre Sicherheitskräfte im Stich gelassen.");
      return "Die Journalisten kommen frei; die Verfahren werden überprüft, und die Redaktionen trauen sich wieder.";
    }),
    opt("justiz", "Der Justiz ihren Lauf lassen", beschr(1, 0, "kein Eingriff, aber auch kein Signal."), 1, (w) => {
      wirke(w, "ansehen", -1);
      return "Die Justiz führt die Verfahren fort.";
    }),
    opt("haerte", "Härte zeigen und die Medienaufsicht ausweiten", beschr(2, 0, "das Lager jubelt, Land und Ausland wenden sich ab."), 2, (w) => {
      wirke(w, "pressefreiheit", -5);
      wirke(w, "polarisierung", 3);
      wirke(w, "beziehungen_eu", -4);
      wirke(w, "ansehen", -3);
      wirke(w, "konservative", 2);
      marktSchock(w, "presse", 1);
      medienHaerte(w);
      loyalitaetAendern(w, "inneres", 3);
      return "Die Medienaufsicht wird ausgeweitet: Strafen und Verfahren treffen vor allem die kritischen Blätter, die Redaktionen lassen mehr weg.";
    }),
  ],
  standard: (w) => {
    wirke(w, "ansehen", -1);
    wirke(w, "polarisierung", 1);
    return "Die Verfahren laufen; die Kritik hält an.";
  },
};

const BAUAMNESTIE: Vorlage = {
  id: "bauamnestie_forderung",
  szene: "parlament",
  frist: 20,
  abkuehlung: 400,
  chance: (w) => (netz(w, "m_bauamnestie") < 40 ? 0.018 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Eine Bauamnestie wird gefordert",
  text: (w) => [
    `${anrede(figur(w, "partner")) || "Ein Bündnispartner"} drängt auf ein Bauamnestie-Gesetz: Wer ohne Genehmigung gebaut hat, zahlt eine Gebühr und wird legalisiert. Das bringt Geld und Stimmen, und es legalisiert Häuser, die kein Statiker je gesehen hat.`,
  ],
  warum: () => "Bauamnestien sind populär und einträglich. Sie sind auch der Grund, warum bei Erdbeben so viele Häuser einstürzen: Wer weiß, dass Schwarzbauten legalisiert werden, baut ohne Prüfung.",
  optionen: () => [
    opt("zustimmen", "Zustimmen", beschr(0, -0.1, "Einnahmen und Zustimmung jetzt, Erdbebenrisiko später."), 0, (w) => {
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
    opt("statik", "Nur mit Statiknachweis", beschr(3, 0, "ein Kompromiss, der die Baupolitik schützt und den Partner nur halb zufrieden stellt."), 3, (w) => {
      wirke(w, "steuereinnahmen", 1);
      wirke(w, "bauqualitaet", -1);
      loyalitaetAendern(w, "partner", 3);
      return "Eine Amnestie gilt nur für Gebäude mit bestandenem Statiknachweis.";
    }),
    opt("ablehnen", "Ablehnen", beschr(2, 0, "die Bausicherheit gewinnt, der Partner ist verärgert."), 2, (w) => {
      wirke(w, "bauqualitaet", 1);
      loyalitaetAendern(w, "partner", -8, "Der Partner hält Ihnen die abgelehnte Bauamnestie vor.");
      return "Die Bauamnestie wird abgelehnt.";
    }),
  ],
  standard: (w) => {
    loyalitaetAendern(w, "partner", -5);
    return "Die Forderung bleibt unbeantwortet; der Partner wird ungeduldig.";
  },
};

const RENTNER: Vorlage = {
  id: "rentnerprotest",
  szene: "anatolien",
  frist: 10,
  abkuehlung: 300,
  chance: (w) => (w.economy.inflation > 12 && netz(w, "rentenniveau") < 52 ? 0.07 : 0.004),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Rentner fordern Ausgleich",
  text: (w) => [`Rentnerverbände demonstrieren vor dem Parlament: Bei ${nf(w.published.inflation.value)} % Inflation reicht die Mindestrente nicht mehr bis zum Monatsende.`],
  warum: () => "Renten hinken der Teuerung hinterher, weil sie nur in Schritten angepasst werden. Rentner wählen zuverlässig, und ihre Not ist sichtbar.",
  optionen: () => [
    opt("erhoehen", "Die Mindestrente kräftig erhöhen", beschr(3, 0.3, "die Not sinkt, der Haushalt spürt es dauerhaft."), 3, (w) => {
      kosten(w, 0.3);
      wirke(w, "rentner", 5);
      wirke(w, "armut", -2);
      loyalitaetAendern(w, "finanzen", -3);
      return "Die Mindestrente steigt deutlich.";
    }),
    opt("einmal", "Eine Einmalzahlung leisten", beschr(2, 0.15, "lindert kurz, ohne den Haushalt dauerhaft zu belasten."), 2, (w) => {
      kosten(w, 0.15);
      wirke(w, "rentner", 3);
      return "Rentner erhalten eine Einmalzahlung.";
    }),
    opt("ablehnen", "Nichts tun", beschr(0, 0, "der Haushalt bleibt ruhig, die Rentner sind wütend."), 0, (w) => {
      wirke(w, "rentner", -4);
      return "Die Forderung wird zurückgewiesen.";
    }),
  ],
  standard: (w) => {
    wirke(w, "rentner", -3);
    vertrauenAendern(w, -1);
    return "Die Demonstrationen gehen weiter.";
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
  titel: () => "Eine schwere Grippewelle",
  text: () => ["Eine Grippewelle legt Schulen, Betriebe und Notaufnahmen lahm. In den Krankenhäusern fehlen Betten und Personal."],
  warum: () => "Wie gut ein Gesundheitssystem ist, zeigt sich in der Spitzenbelastung, nicht im Durchschnitt.",
  eroeffne: (w, ev) => {
    wirke(w, "gesundheitsversorgung", -4 * ev.staerke);
    wirke(w, "wartezeiten", 5 * ev.staerke);
    wirke(w, "produktivitaet", -1);
  },
  optionen: () => [
    opt("impfen", "Impfkampagne und Aufrufe", beschr(2, 0.1, "wirkt in Wochen, hilft vor allem den Schwächsten."), 2, (w) => {
      kosten(w, 0.1);
      wirke(w, "gesundheitsversorgung", 3);
      wirke(w, "wartezeiten", -2);
      return "Eine landesweite Impfkampagne läuft an.";
    }),
    opt("kapazitaet", "Krankenhauskapazitäten und Personal aufstocken", beschr(4, 0.25, "stärkt das System auch nach der Welle."), 4, (w) => {
      kosten(w, 0.25);
      wirke(w, "gesundheitsversorgung", 4);
      wirke(w, "wartezeiten", -4);
      wirke(w, "aerzte", 1);
      return "Zusätzliche Betten und Personal werden bereitgestellt.";
    }),
    opt("abwarten", "Auf die Selbstheilung setzen", beschr(0, 0, "die Welle läuft aus, das Vertrauen leidet."), 0, (w) => {
      vertrauenAendern(w, -1);
      return "Die Regierung setzt auf Eigenverantwortung.";
    }),
  ],
  standard: (w) => {
    wirke(w, "wartezeiten", 3);
    vertrauenAendern(w, -1.5);
    return "Die Krankenhäuser laufen über; die Kritik an der Regierung wächst.";
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
  titel: () => "Traktoren vor den Rathäusern",
  text: (_, ev) => [`Bäuerinnen und Bauern blockieren in ${namen(ev.provinzen)} mit ihren Traktoren die Straßen: Dünger und Diesel sind teuer, die Erzeugerpreise fallen.`],
  warum: () => "Landwirte tragen das Risiko von Wetter und Preisen. Wenn die Kosten schneller steigen als die Preise, die sie erzielen, geben sie auf und ziehen in die Städte.",
  eroeffne: (w, ev) => {
    wirke(w, "landwirte", -3 * ev.staerke);
    wirke(w, "landflucht", 2, ev.provinzen);
  },
  optionen: (_, ev) => [
    opt("subventionen", "Agrarsubventionen erhöhen", beschr(3, 0.2, "hilft schnell, belastet den Haushalt."), 3, (w) => {
      setPolicy(w, "m_agrarsubventionen", Math.min(100, netz(w, "m_agrarsubventionen") + 12));
      wirke(w, "landwirte", 4 * ev.staerke);
      return "Die Agrarsubventionen steigen.";
    }),
    opt("mindestpreise", "Mindestpreise für Getreide garantieren", beschr(2, 0.05, "sichert die Einkommen, verteuert die Lebensmittel."), 2, (w) => {
      kosten(w, 0.05);
      wirke(w, "landwirte", 4 * ev.staerke);
      wirke(w, "lebensmittelpreise", 3);
      return "Der Staat garantiert Mindestpreise für Getreide.";
    }),
    opt("gespraech", "Gespräche mit den Verbänden", beschr(1, 0, "Zeit gewonnen, nichts gelöst."), 1, (w) => {
      wirke(w, "landwirte", 1);
      return "Die Regierung lädt die Bauernverbände zu Gesprächen.";
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "landwirte", -3 * ev.staerke);
    vertrauenAendern(w, -1);
    return "Die Blockaden halten an, bis die Ernte drängt.";
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
  titel: (_, ev) => `${ev.daten?.firma} schließt Werke`,
  text: (_, ev) => [`Die ${ev.daten?.firma} und ihre Zulieferer schließen Werke in ${namen(ev.provinzen)}: Energie, Löhne und Kredite sind zu teuer, Aufträge wandern in Länder mit niedrigeren Kosten ab.`],
  warum: () => "Industrie reagiert auf Kosten, nicht auf Reden. Wenn die Kosten schneller steigen als die Preise, die sich am Weltmarkt erzielen lassen, verschwinden Arbeitsplätze, die nicht wiederkommen.",
  eroeffne: (w, ev) => {
    wirke(w, "arbeitsplaetze_industrie", -4 * ev.staerke, ev.provinzen);
    wirke(w, "industrie", -2 * ev.staerke, ev.provinzen);
    wirke(w, "streikneigung", 2);
  },
  optionen: (_, ev) => [
    opt("kurzarbeit", "Kurzarbeitergeld", beschr(3, 0.15, "rettet Stellen auf Zeit."), 3, (w) => {
      kosten(w, 0.15);
      wirke(w, "arbeitsplaetze_industrie", 3 * ev.staerke, ev.provinzen);
      wirke(w, "arbeitnehmer", 2);
      return "Kurzarbeitergeld überbrückt die Auftragslücke.";
    }),
    opt("kredit", "Kreditgarantien für die Betriebe", beschr(3, 0.1, "hilft den Betrieben, nicht unbedingt den Beschäftigten."), 3, (w) => {
      kosten(w, 0.1);
      wirke(w, "kredite", 2);
      wirke(w, "mittelstand", 2);
      wirke(w, "arbeitsplaetze_industrie", 2 * ev.staerke, ev.provinzen);
      return "Der Staat verbürgt Kredite für betroffene Betriebe.";
    }),
    opt("umschulen", "Umschulung und neue Ansiedlungen", beschr(4, 0.2, "wirkt langsam, aber tragfähig."), 4, (w) => {
      kosten(w, 0.2);
      wirke(w, "fachkraefte", 2);
      wirke(w, "arbeitsplaetze_industrie", 1, ev.provinzen);
      return "Ein Umschulungsprogramm und Ansiedlungshilfen werden aufgelegt.";
    }),
  ],
  standard: (w, ev) => {
    wirke(w, "arbeitsplaetze_industrie", -3 * ev.staerke, ev.provinzen);
    wirke(w, "armut", 2, ev.provinzen);
    vertrauenAendern(w, -1);
    return "Die Entlassungen laufen weiter; in den Orten fehlt es an Alternativen.";
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
  titel: (_, ev) => `Verfahren gegen das Rathaus von ${namen(ev.provinzen)}`,
  text: (_, ev) => [
    `Staatsanwälte werfen dem Rathaus von ${namen(ev.provinzen)} unter ${ev.daten?.name} (${ev.daten?.partei}) Unregelmäßigkeiten bei Vergaben vor. Die Partei spricht von einem politischen Verfahren, das Innenministerium erwägt, einen Zwangsverwalter einzusetzen.`,
  ],
  warum: () => "Wo die Regierung eine Stadt nicht gewinnt, bleibt ihr die Justiz. Wer sie einsetzt, gewinnt Kontrolle und verliert Glaubwürdigkeit bei allen, die den Vorwurf für politisch halten.",
  optionen: () => [
    opt("justiz", "Die Justiz unabhängig arbeiten lassen", beschr(2, 0, "wahrt den Anschein des Rechtsstaats, kostet die Kontrolle über die Stadt."), 2, (w) => {
      wirke(w, "justizvertrauen", 2);
      wirke(w, "polarisierung", -1);
      loyalitaetAendern(w, "inneres", -2);
      return "Das Verfahren läuft ohne Eingriff der Regierung.";
    }),
    opt("verwalter", "Einen Zwangsverwalter einsetzen", beschr(3, 0, "Kontrolle über die Stadt, Streit im ganzen Land."), 3, (w, ev) => {
      wirke(w, "polarisierung", 5);
      wirke(w, "justizvertrauen", -4);
      wirke(w, "ansehen", -3);
      wirke(w, "beziehungen_eu", -2);
      wirke(w, "staedtische_saekulare", -4);
      wirke(w, "konservative", 1);
      marktSchock(w, "verhaftung", 1.4);
      // Ortszustand mit Folgen bis zur nächsten Kommunalwahl (sim/kommunen.ts)
      for (const pl of ev.provinzen) setzeZwangsverwalter(w, pl);
      return "Ein Zwangsverwalter übernimmt die Geschäfte der Stadt.";
    }),
    opt("dialog", "Das Gespräch mit der Stadtspitze suchen", beschr(2, 0, "entspannt die Lage, ohne den Vorwurf auszuräumen."), 2, (w) => {
      wirke(w, "polarisierung", -2);
      vertrauenAendern(w, 1);
      wirke(w, "konservative", -1);
      return "Der Präsident lädt die Stadtspitze zu einem Gespräch.";
    }),
  ],
  standard: (w) => {
    wirke(w, "polarisierung", 2);
    return "Die Lage in der Stadt bleibt gespannt; das Verfahren zieht sich.";
  },
};

const TOURISMUS: Vorlage = {
  id: "tourismusrekord",
  szene: "anatolien",
  frist: 12,
  abkuehlung: 300,
  chance: (w) => (sommer(w) && netz(w, "tourismus") >= 50 ? 0.05 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Eine Rekordsaison",
  text: () => ["Die Hotels an der Küste sind voll, die Flughäfen melden Höchstwerte. Die Branche fragt, was der Staat mit dem Rückenwind anfängt."],
  warum: () => "Gute Jahre sind die Zeit, in der man Infrastruktur baut, nicht nur feiert: Die Saison von heute entscheidet über die von übermorgen.",
  optionen: () => [
    opt("ausbauen", "In Küsteninfrastruktur investieren", beschr(3, 0.2, "sichert die Zukunft der Saison."), 3, (w) => {
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
    }),
    opt("abgabe", "Eine Abgabe auf Übernachtungen erheben", beschr(1, -0.15, "bringt Geld, dämpft die Nachfrage ein wenig."), 1, (w) => {
      kosten(w, -0.15);
      wirke(w, "steuereinnahmen", 1);
      wirke(w, "tourismus", -1);
      return "Übernachtungen werden mit einer Abgabe belegt.";
    }),
    opt("geniessen", "Den Erfolg genießen", beschr(0, 0, "ein guter Sommer und sonst nichts."), 0, (w) => {
      vertrauenAendern(w, 0.5);
      return "Die Regierung feiert die Saison.";
    }),
  ],
  standard: () => "Die Saison endet, ohne dass der Staat etwas daraus macht.",
};

const KANAL: Vorlage = {
  id: "kanal_istanbul",
  szene: "istanbul",
  frist: 30,
  abkuehlung: 3000,
  chance: (w) => (w.day > 200 ? 0.012 : 0),
  erzeuge: () => ({ provinzen: [34], staerke: 1 }),
  titel: () => "Der Kanal Istanbul",
  text: () => [
    "Ein Großprojekt liegt bereit: ein zweiter Wasserweg neben dem Bosporus. Bauindustrie und Regierungsnahe drängen auf den Baubeginn; Umweltverbände, Wasserwerke und die Opposition warnen vor Kosten und Folgen für Trinkwasser und Meer.",
  ],
  warum: () => "Großprojekte binden Geld, Kapital und Aufmerksamkeit über Jahre. Sie versprechen Wachstum, und manche halten es, andere hinterlassen vor allem Schulden.",
  optionen: () => [
    opt("bauen", "Bauen", beschr(6, 1.0, "Aufträge und Schlagzeilen, dazu Schulden und Umweltrisiken."), 6, (w) => {
      wirke(w, "konservative", 2);
      wirke(w, "staedtische_saekulare", -3);
      // Der Kanal wird ein echtes Bauvorhaben (data/reich/infrastruktur.ts): Kosten, Bauzeit und Folgen trägt das Vorhaben
      w.spiel!.kapital += 6;
      const r = beginne(w, "infra_kanal_istanbul");
      if (r.ok) return t("wort.kanal.begonnen");
      w.spiel!.kapital -= 6;
      wirke(w, "bauwirtschaft", 3, [34]);
      return t("wort.kanal.ohne_bau", { grund: r.text });
    }),
    opt("nahverkehr", "Stattdessen Metro und Nahverkehr ausbauen", beschr(3, 0.3, "spürbar im Alltag, weniger eindrucksvoll auf Fotos."), 3, (w) => {
      kosten(w, 0.3);
      wirke(w, "stau", -4, [34]);
      wirke(w, "bauwirtschaft", 2, [34]);
      wirke(w, "staedtische_saekulare", 2);
      return "Die Regierung setzt auf Metro und Nahverkehr statt auf einen Kanal.";
    }),
    opt("verschieben", "Verschieben", beschr(0, 0, "die Bauindustrie ist enttäuscht, das Geld bleibt im Haushalt."), 0, (w) => {
      wirke(w, "bauwirtschaft", -1);
      return "Das Projekt wird zurückgestellt.";
    }),
  ],
  standard: () => "Das Projekt bleibt liegen.",
};

const KOMMUNALWAHL: Vorlage = {
  id: "kommunalwahl",
  szene: "wahlnacht",
  frist: 25,
  abkuehlung: 3000,
  // Alle fünf Jahre (sim/kommunen.ts): 25.03.2029, dann Ende März 2034, 2039 …
  chance: (w) => (kommunalwahlFaellig(w) ? 1 : 0),
  erzeuge: () => ({ provinzen: [], staerke: 1 }),
  titel: () => "Kommunalwahlen",
  text: (w) => [
    `Im ganzen Land werden Bürgermeister und Gemeinderäte gewählt. Es ist der erste Stimmungstest seit Ihrem Amtsantritt; Ihre Zustimmung liegt bei ${nf(w.spiel?.umfrage.zustimmung ?? 0, 0)} %.`,
  ],
  warum: () => "Kommunalwahlen zeigen, ob die Menschen dem Präsidenten zutrauen, ihre Stadt zu verwalten, und sie sind die Generalprobe für die nächste Präsidentschaftswahl.",
  optionen: (w) => {
    // Ergebnis je Provinz aus dem Vertrauen vor Ort, Amtsbonus und Zwangsverwaltung (sim/kommunen.ts); der Wahlkampf gibt einen Zuschlag
    const ergebnis = (ww: typeof w, bonus = 0): string => kommunalwahlDurchfuehren(ww, bonus).text;
    return [
      opt("reisen", "Selbst durchs Land reisen", beschr(4, 0, "bringt Stimmen und Schlagzeilen, mobilisiert auch die Gegner."), 4, (ww) => {
        vertrauenAendern(ww, 2);
        wirke(ww, "polarisierung", 2);
        return `Der Präsident führt Wahlkampf. ${ergebnis(ww, 3)}`;
      }),
      opt("projekte", "Lokale Projekte vorziehen", beschr(3, 0.1, "Straßen und Schulen vor dem Wahltag."), 3, (ww) => {
        kosten(ww, 0.1);
        wirke(ww, "verkehrsnetz", 2);
        vertrauenAendern(ww, 1.5);
        return `Projekte in den Provinzen werden vorgezogen. ${ergebnis(ww, 2)}`;
      }),
      opt("sachlich", "Sachlich bleiben", beschr(0, 0, "keine Hilfe, kein Schaden."), 0, (ww) => `Der Präsident hält sich im Wahlkampf zurück. ${ergebnis(ww)}`),
    ];
  },
  standard: (w) => kommunalwahlDurchfuehren(w, 0).text,
};

export const INNEN_VORLAGEN: Vorlage[] = [
  MINDESTLOHN, HAUSHALTSJAHR, BERGWERK, UEBERSCHWEMMUNG, BANKENSTRESS, STUDENTEN, PRESSE, BAUAMNESTIE, RENTNER, EPIDEMIE, BAUERN, FABRIK, KAYYUM, TOURISMUS, KANAL, KOMMUNALWAHL,
];
