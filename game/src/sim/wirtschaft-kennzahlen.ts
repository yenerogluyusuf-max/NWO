// Die Kennzahlen der Wirtschaftsakte: Name, Erklärung, Verlauf, Prognose, Treiber („Was bewegt diese Zahl?“) und was man dagegen tun kann.
// Die Treiber stammen aus den Formeln des Wirtschaftsmodells (`economy.ts`) und den Verbindungen des Politiknetzes, nicht aus dem Kopf.

import type { World } from "./types";
import { AUSSEN, PARAMS, potential, ppkZiel, PPK_GEWICHTE, realRate } from "./economy";
import { NET } from "./modell";
import { nationalAverage, startAverage } from "./netz";
import { formatDateDe, formatMonthDe } from "./dates";
import { defizitJetzt, haushaltZustand, startMonat, verlauf, wirtschaftZustand, zinsausgabenJetzt } from "./wirtschaft";
import { istGut } from "./folgen";
import { ZINSSATZ_START } from "../data/haushaltsplan";

export type Gruppe = "Preise und Geld" | "Wirtschaft und Arbeit" | "Staat und Märkte" | "Alltag der Menschen";
export const GRUPPEN: Gruppe[] = ["Preise und Geld", "Wirtschaft und Arbeit", "Staat und Märkte", "Alltag der Menschen"];

export interface Treiber {
  name: string;
  wirkung: number;
  einheit: string;
  text: string;
  /** Ob der Beitrag die Zahl hebt oder senkt (für die Farbe) */
  richtung: 1 | -1 | 0;
}

export interface TreiberBlock {
  kopf?: string;
  zeilen: Treiber[];
}

export interface Handlung {
  label: string;
  ziel: "zentralbank" | "haushalt";
  /** Haushaltsposten, der vorgewählt wird */
  posten?: string;
  /** Um wie viele Stufen der Posten für die Vorschau „Was wäre, wenn?“ bewegt wird */
  stufe?: number;
  /** Zentralbank: welcher Abschnitt */
  abschnitt?: "sitzung" | "gouverneur" | "stufe";
}

export interface Linie {
  wert: number;
  text: string;
  art: "ziel" | "grenze";
}

export interface Kennzahl {
  id: string;
  name: string;
  gruppe: Gruppe;
  einheit: string;
  stellen: number;
  /** Ob ein niedriger oder hoher Wert besser ist */
  gut: "niedrig" | "hoch" | "neutral";
  erklaerung: string;
  gemessen: (w: World) => string;
  /** Größe der Vorschau (`forecast.ts`), falls es eine Prognose gibt */
  prognose?: string;
  /** Größe für den Vergleich mit anderen Ländern (`ui/vergleich.ts`) */
  vergleichId?: string;
  linien?: (w: World) => Linie[];
  treiber: (w: World) => TreiberBlock;
  handlungen: Handlung[];
}

const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const netz = (w: World, id: string) => nationalAverage(NET, w.net, id);
const rz = (wirkung: number): 1 | -1 | 0 => (wirkung > 0.005 ? 1 : wirkung < -0.005 ? -1 : 0);
const tr = (name: string, wirkung: number, einheit: string, text: string): Treiber => ({ name, wirkung, einheit, text, richtung: rz(wirkung) });

/** Die stärksten Verbindungen, die auf einen Knoten des Politiknetzes wirken (Abweichung der Quelle vom Start mal Stärke, je Monat). */
export function netzTreiber(w: World, id: string, max = 7): Treiber[] {
  const i = NET.index.get(id);
  if (i === undefined) return [];
  const out: Treiber[] = [];
  for (let j = 0; j < NET.edgeTo.length; j++) {
    if (NET.edgeTo[j] !== i) continue;
    const von = NET.nodes[NET.edgeFrom[j]!]!;
    const abw = nationalAverage(NET, w.net, von.id) - startAverage(NET, w.net, von.id);
    const wirkung = NET.edgeWeight[j]! * abw;
    if (Math.abs(wirkung) < 0.015) continue;
    out.push(tr(von.name, wirkung, "Punkte je Monat", NET.edges[j]!.why));
  }
  const node = NET.nodes[i]!;
  const rueck = -node.decay * (netz(w, id) - startAverage(NET, w.net, id));
  if (Math.abs(rueck) >= 0.015) out.push(tr("Rückkehr zur Ruhelage", rueck, "Punkte je Monat", "Ohne Anstoß kehrt jede Größe langsam zu ihrem Ausgangswert zurück."));
  return out.sort((a, b) => Math.abs(b.wirkung) - Math.abs(a.wirkung)).slice(0, max);
}

const nodeName = (id: string) => NET.nodes[NET.index.get(id) ?? -1]?.name ?? id;

function netzKennzahl(id: string, gruppe: Gruppe, gut: "niedrig" | "hoch", handlungen: Handlung[], ergaenzung = ""): Kennzahl {
  const node = NET.nodes[NET.index.get(id)!]!;
  return {
    id: id === "realeinkommen" ? "reallohn" : id === "lebenshaltung" ? "teuerung" : id,
    name: node.name,
    gruppe,
    einheit: "Indexpunkte",
    stellen: 1,
    gut,
    erklaerung: `${node.text}${ergaenzung ? ` ${ergaenzung}` : ""} Ein Index von 0 bis 100; der Startwert ist die Ruhelage.`,
    gemessen: () => "monatlich fortgeschrieben (Politiknetz)",
    prognose: `net:${id}`,
    treiber: (w) => ({ kopf: "Die stärksten Einflüsse auf diese Größe im Politiknetz, je Monat:", zeilen: netzTreiber(w, id) }),
    handlungen,
  };
}

export const KENNZAHLEN: Kennzahl[] = [
  {
    id: "inflation", name: "Inflation", gruppe: "Preise und Geld", einheit: "%", stellen: 1, gut: "niedrig",
    erklaerung: "Wie stark die Preise gegenüber dem Vorjahresmonat gestiegen sind. Das Statistikamt meldet den Wert Anfang des Folgemonats; Sie steuern also immer mit Blick in den Rückspiegel.",
    gemessen: (w) => `${formatMonthDe(w.published.inflation.period)}, veröffentlicht am ${formatDateDe(w.published.inflation.publishedOn)}`,
    prognose: "inflation", vergleichId: "inflation",
    linien: (w) => [{ wert: w.economy.inflationTarget, text: "Zwischenziel der Zentralbank", art: "ziel" }],
    treiber: (w) => {
      const e = w.economy;
      const excess = e.fxChange12 - (e.inflation - PARAMS.foreignInflation);
      const zeilen = [
        tr("Erwartungen von Haushalten und Firmen", e.expectedInflation, "%", "Wer mit Teuerung rechnet, setzt Preise und Löhne entsprechend."),
        tr("Auslastung der Wirtschaft", PARAMS.gapOnInflation * e.outputGap, "Prozentpunkte", "Läuft die Wirtschaft heiß, steigen Preise und Löhne schneller (Z2)."),
        tr("Abwertung der Lira über die Teuerung hinaus", PARAMS.fxPassThrough * excess, "Prozentpunkte", "Eine schwächere Lira verteuert Importe, vor allem Energie (Z5)."),
        tr("Kostendruck der Betriebe", e.costPush, "Prozentpunkte", "Aus dem Politiknetz: Löhne, Energie und Vorprodukte."),
        tr("Energiepreise", AUSSEN.oelAufInflation * ((e.oel ?? 100) - 100), "Prozentpunkte", "Öl und Gas werden in Dollar bezahlt."),
      ];
      const anker = zeilen.reduce((a, z) => a + z.wirkung, 0);
      return { kopf: `Die Inflation läuft mit ${nf(PARAMS.inflationSpeed * 100, 0)} % pro Monat auf den Wert ${nf(anker)} % zu, den diese Kräfte zusammen ergeben.`, zeilen };
    },
    handlungen: [
      { label: "Die nächste Zinssitzung vorbereiten", ziel: "zentralbank", abschnitt: "sitzung" },
      { label: "Ausgaben zügeln: den Haushalt ansehen", ziel: "haushalt" },
      { label: "Preise drücken: Subventionen", ziel: "haushalt", posten: "subventionen", stufe: 1 },
    ],
  },
  {
    id: "erwartung", name: "Inflationserwartung", gruppe: "Preise und Geld", einheit: "%", stellen: 1, gut: "niedrig",
    erklaerung: "Was Haushalte und Firmen für die nächsten Monate erwarten, als Umfrage und deshalb ungenau. Sie bestimmt, wie hoch Löhne und Preise angesetzt werden; ist sie verankert, lässt sich die Inflation leichter senken (Z3).",
    gemessen: () => "monatlich, als Umfrage",
    prognose: "expectedInflation",
    linien: (w) => [{ wert: w.economy.inflationTarget, text: "Zwischenziel der Zentralbank", art: "ziel" }],
    treiber: (w) => {
      const e = w.economy;
      return {
        kopf: `Die Erwartung folgt zu ${nf(PARAMS.expectationSpeed * 100, 0)} % pro Monat einem Mischwert aus dem Ziel der Bank und der tatsächlichen Inflation; je glaubwürdiger die Bank, desto mehr zählt das Ziel.`,
        zeilen: [
          tr("Ziel der Zentralbank (Gewicht: Glaubwürdigkeit)", e.credibility * e.inflationTarget, "%", "Wer der Bank vertraut, rechnet mit ihrem Ziel."),
          tr("Tatsächliche Inflation (Gewicht: Misstrauen)", (1 - e.credibility) * e.inflation, "%", "Wer ihr nicht vertraut, rechnet mit der Teuerung von gestern."),
        ],
      };
    },
    handlungen: [
      { label: "Glaubwürdigkeit der Bank pflegen", ziel: "zentralbank", abschnitt: "stufe" },
      { label: "Eine strenge Führung einsetzen", ziel: "zentralbank", abschnitt: "gouverneur" },
    ],
  },
  {
    id: "leitzins", name: "Leitzins", gruppe: "Preise und Geld", einheit: "%", stellen: 1, gut: "neutral",
    erklaerung: "Der Zins, zu dem sich Banken bei der Zentralbank Geld leihen. Ihn legt der Geldpolitische Ausschuss fest, nicht der Präsident, solange die Bank unabhängig ist; Sie können Druck machen, die Führung tauschen oder das Gesetz ändern.",
    gemessen: () => "tagesaktuell; der Ausschuss tagt alle 45 Tage",
    prognose: "policyRate",
    treiber: (w) => {
      const e = w.economy;
      const g = PPK_GEWICHTE[w.governor.stance];
      const ziel = ppkZiel(e, w.governor.stance);
      return {
        kopf: `Die Regel der Bank zielt auf ${nf(ziel)} % (jetzt ${nf(e.policyRate)} %); bei jeder Sitzung legt sie die halbe Strecke zurück, höchstens fünf Punkte.`,
        zeilen: [
          tr("Neutraler Realzins", PARAMS.neutralRealRate, "%", "Der Zins, der die Wirtschaft weder bremst noch antreibt."),
          tr("Erwartete Inflation", e.expectedInflation, "%", "Der Realzins ist Leitzins minus erwartete Teuerung."),
          tr("Inflation über dem Ziel", g.infl * (e.inflation - e.inflationTarget), "Punkte", "Liegt die Inflation über dem Ziel, strafft die Bank."),
          tr("Auslastung", g.gap * e.outputGap, "Punkte", "Läuft die Wirtschaft heiß, strafft sie; ist sie schwach, lockert sie."),
          tr("Haltung der Führung", g.bias, "Punkte", "Eine gefügige Führung neigt zu niedrigeren Zinsen."),
        ],
      };
    },
    handlungen: [
      { label: "Die nächste Zinssitzung vorbereiten", ziel: "zentralbank", abschnitt: "sitzung" },
      { label: "Die Führung der Bank ansehen", ziel: "zentralbank", abschnitt: "gouverneur" },
    ],
  },
  {
    id: "realzins", name: "Realzins", gruppe: "Preise und Geld", einheit: "%", stellen: 1, gut: "neutral",
    erklaerung: "Der Leitzins abzüglich der erwarteten Inflation. Er entscheidet, ob Geld sich lohnt zu sparen oder zu leihen, und wirkt nach etwa einem halben Jahr auf die Nachfrage (Z1). Liegt er unter null, verliert die Bank Glaubwürdigkeit.",
    gemessen: () => "abgeleitet aus Leitzins und Erwartung",
    treiber: (w) => ({
      kopf: `Der Realzins wirkt mit ${PARAMS.rateLagMonths} Monaten Verzögerung auf die Auslastung: Je höher er über ${PARAMS.neutralRealRate} % liegt, desto stärker bremst er.`,
      zeilen: [
        tr("Leitzins", w.economy.policyRate, "%", "Von der Zentralbank festgelegt."),
        tr("Erwartete Inflation", -w.economy.expectedInflation, "%", "Zieht vom Leitzins ab."),
      ],
    }),
    handlungen: [{ label: "Die nächste Zinssitzung vorbereiten", ziel: "zentralbank", abschnitt: "sitzung" }],
  },
  {
    id: "usd", name: "Lira je US-Dollar", gruppe: "Preise und Geld", einheit: "Lira", stellen: 2, gut: "niedrig",
    erklaerung: "Der Außenwert der Lira. Er reagiert täglich auf Zinsen, Inflation und Vertrauen. Eine schwächere Lira macht Importe teurer, Exporte und Urlaub billiger.",
    gemessen: () => "tagesaktuell",
    prognose: "usdTry", vergleichId: "abwertung",
    treiber: (w) => {
      const e = w.economy;
      return {
        kopf: "Der erwartete Kursverlauf im Jahr, als Abwertung der Lira in Prozent; dazu kommt täglich ein Zufall, der bei geringem Vertrauen größer ist.",
        zeilen: [
          tr("Inflation über dem Ausland", e.inflation - PARAMS.foreignInflation, "% im Jahr", "Wer mehr Inflation hat als seine Partner, wertet auf Dauer ab."),
          tr("Realzins über dem Neutralwert", -PARAMS.carryOnFx * (realRate(e) - PARAMS.neutralRealRate), "% im Jahr", "Ein hoher Realzins zieht Kapital an und stützt die Lira (Z4)."),
          tr("Risikoaufschlag", (e.riskPremium - 250) / 100, "% im Jahr", "Mehr Risiko heißt Kapitalabfluss."),
        ],
      };
    },
    handlungen: [
      { label: "Zinssitzung und Druck auf die Bank", ziel: "zentralbank", abschnitt: "sitzung" },
      { label: "Defizit und Schulden im Blick halten", ziel: "haushalt" },
    ],
  },
  {
    id: "eur", name: "Lira je Euro", gruppe: "Preise und Geld", einheit: "Lira", stellen: 2, gut: "niedrig",
    erklaerung: "Wie beim Dollar. Die EU ist der wichtigste Handelspartner der Türkei.",
    gemessen: () => "tagesaktuell",
    prognose: "eurTry",
    treiber: (w) => ({ kopf: "Der Euro-Kurs folgt dem Dollar-Kurs mit eigenem Rauschen; die Gründe stehen bei „Lira je US-Dollar“.", zeilen: KENNZAHLEN_NACH_ID_SPAET("usd").treiber(w).zeilen }),
    handlungen: [{ label: "Zinssitzung und Druck auf die Bank", ziel: "zentralbank", abschnitt: "sitzung" }],
  },
  {
    id: "wachstum", name: "Wachstum", gruppe: "Wirtschaft und Arbeit", einheit: "%", stellen: 1, gut: "hoch",
    erklaerung: "Wie stark die Wirtschaftsleistung gegenüber dem Vorjahresquartal gewachsen ist. Erscheint etwa zwei Monate nach Quartalsende.",
    gemessen: (w) => `${w.published.growth.period}, veröffentlicht am ${formatDateDe(w.published.growth.publishedOn)}`,
    prognose: "growth", vergleichId: "wachstum",
    treiber: (w) => {
      const e = w.economy;
      const alt = w.history[w.history.length - 12]?.outputGap ?? e.outputGap;
      const lag = w.history[w.history.length - PARAMS.rateLagMonths];
      const laggedReal = lag ? lag.realRate : realRate(e);
      return {
        kopf: "Wachstum ist das Potenzial der Wirtschaft plus die Veränderung ihrer Auslastung gegenüber dem Vorjahr. Die Auslastung bewegen, je Monat:",
        zeilen: [
          tr("Potenzialwachstum (mit Produktivität)", potential(e), "% im Jahr", "Was die Wirtschaft bei normaler Auslastung leisten kann."),
          tr("Veränderung der Auslastung seit einem Jahr", e.outputGap - alt, "Punkte", "Mehr Auslastung heißt mehr Wachstum."),
          tr("Zins von vor einem halben Jahr", -PARAMS.rateOnGap * (laggedReal - PARAMS.neutralRealRate), "Punkte je Monat", "Hohe Realzinsen bremsen die Nachfrage (Z1)."),
          tr("Staatsausgaben und Maßnahmen", PARAMS.fiscalOnGap * (e.fiscalImpulse + e.policyCost), "Punkte je Monat", "Mehr Ausgaben stützen die Nachfrage (Z6)."),
          tr("Nachfrage aus der EU", AUSSEN.euAufAuslastung * ((e.euNachfrage ?? 100) - 100), "Punkte je Monat", "Die EU ist der größte Abnehmer."),
          tr("Energiepreise", -AUSSEN.oelAufAuslastung * ((e.oel ?? 100) - 100), "Punkte je Monat", "Teure Energie dämpft die Produktion."),
        ],
      };
    },
    handlungen: [
      { label: "Investieren: Haushalt öffnen", ziel: "haushalt", posten: "investitionen", stufe: 1 },
      { label: "Zinssenkung anstreben", ziel: "zentralbank", abschnitt: "sitzung" },
    ],
  },
  {
    id: "arbeitslosigkeit", name: "Arbeitslosenquote", gruppe: "Wirtschaft und Arbeit", einheit: "%", stellen: 1, gut: "niedrig",
    erklaerung: "Anteil der Arbeitsuchenden an den Erwerbspersonen. Folgt dem Wachstum mit Verzögerung.",
    gemessen: (w) => `${formatMonthDe(w.published.unemployment.period)}, veröffentlicht am ${formatDateDe(w.published.unemployment.publishedOn)}`,
    prognose: "unemployment", vergleichId: "arbeitslosigkeit",
    treiber: (w) => {
      const e = w.economy;
      return {
        kopf: "Die Quote bewegt sich je Monat um:",
        zeilen: [
          tr(`Rückkehr zur natürlichen Quote (${PARAMS.naturalUnemployment} %)`, 0.03 * (PARAMS.naturalUnemployment - e.unemployment), "Punkte je Monat", "Auf Dauer pendelt sich der Arbeitsmarkt bei einer Grundquote ein."),
          tr("Wachstum über oder unter Potenzial", -PARAMS.okun * (e.growth - potential(e)), "Punkte je Monat", "Wächst die Wirtschaft schneller als ihr Potenzial, entsteht Arbeit (Z9)."),
        ],
      };
    },
    handlungen: [
      { label: "Investieren: Haushalt öffnen", ziel: "haushalt", posten: "investitionen", stufe: 1 },
      { label: "Zinssenkung anstreben", ziel: "zentralbank", abschnitt: "sitzung" },
    ],
  },
  netzKennzahl("realeinkommen", "Wirtschaft und Arbeit", "hoch", [
    { label: "Steuern auf Löhne senken", ziel: "haushalt", posten: "einkommensteuer", stufe: -1 },
    { label: "Inflation bekämpfen: die Zinssitzung", ziel: "zentralbank", abschnitt: "sitzung" },
  ], "Wenn Preise schneller steigen als Löhne, sinkt sie."),
  netzKennzahl("investitionen", "Wirtschaft und Arbeit", "hoch", [
    { label: "Öffentlich investieren", ziel: "haushalt", posten: "investitionen", stufe: 1 },
    { label: "Gewinnsteuern senken", ziel: "haushalt", posten: "unternehmensteuer", stufe: -1 },
  ]),
  netzKennzahl("kredite", "Wirtschaft und Arbeit", "hoch", [{ label: "Zinssitzung: Kredit hängt am Leitzins", ziel: "zentralbank", abschnitt: "sitzung" }]),
  netzKennzahl("export", "Wirtschaft und Arbeit", "hoch", [{ label: "Lira und Zinsen: die Zentralbank", ziel: "zentralbank", abschnitt: "sitzung" }]),
  {
    id: "defizit", name: "Haushaltsdefizit", gruppe: "Staat und Märkte", einheit: "% des BIP", stellen: 1, gut: "niedrig",
    erklaerung: "Was der Staat im Jahr mehr ausgibt als einnimmt, in Prozent der Wirtschaftsleistung: die Grundlinie des Haushaltsgesetzes, Ihr Ausgabenimpuls, die Kosten Ihrer Maßnahmen und der Mehr- oder Minderzins auf die Schuld.",
    gemessen: () => "geplant, aus dem Modell berechnet",
    prognose: "defizit",
    linien: () => [{ wert: 3, text: "EU-Referenzwert 3 % (Maastricht)", art: "grenze" }],
    treiber: (w) => {
      const e = w.economy;
      return {
        kopf: `Das geplante Defizit beträgt ${nf(defizitJetzt(w))} % des BIP:`,
        zeilen: [
          tr("Grundlinie des Haushaltsgesetzes", e.deficit, "% des BIP", "Was ohne Ihr Zutun geplant war."),
          tr("Ihr Ausgabenimpuls (Haushaltsposten, Ereignisse)", e.fiscalImpulse, "% des BIP", "Mehr Ausgaben oder weniger Steuern vergrößern das Defizit."),
          tr("Kosten der beschlossenen Maßnahmen", e.policyCost, "% des BIP", "Aus dem Politiknetz: laufende Kosten gegenüber dem Amtsantritt."),
          tr("Mehr- oder Minderzins auf die Schuld", e.zinsMehrlast ?? 0, "% des BIP", "Der Staat zahlt Marktzinsen, wenn er Schulden neu finanziert."),
        ],
      };
    },
    handlungen: [
      { label: "Den Haushalt ansehen", ziel: "haushalt" },
      { label: "Ausgaben kürzen: Personal", ziel: "haushalt", posten: "personal", stufe: -1 },
      { label: "Einnahmen erhöhen: Verbrauchsteuern", ziel: "haushalt", posten: "verbrauchsteuern", stufe: 1 },
    ],
  },
  {
    id: "schulden", name: "Staatsschulden", gruppe: "Staat und Märkte", einheit: "% des BIP", stellen: 1, gut: "niedrig",
    erklaerung: "Alle Schulden des Staates im Verhältnis zur Wirtschaftsleistung. Hohe Inflation lässt die Quote sinken, weil die Wirtschaftsleistung nominal schneller wächst als die Schulden.",
    gemessen: () => "Schätzung des Finanzministeriums",
    prognose: "debtRatio", vergleichId: "schulden",
    linien: () => [{ wert: 60, text: "EU-Referenzwert 60 % (Maastricht)", art: "grenze" }],
    treiber: (w) => {
      const e = w.economy;
      const wachstum = (e.growth + e.inflation) / 100;
      const flow = defizitJetzt(w) - e.debtRatio * wachstum;
      return {
        kopf: `Die Schuldenquote ändert sich um ${flow >= 0 ? "+" : ""}${nf(flow)} Punkte im Jahr:`,
        zeilen: [
          tr("Defizit", defizitJetzt(w), "Punkte im Jahr", "Jedes Defizit wird zu neuen Schulden (Z7)."),
          tr("Wachstum und Inflation (nominal)", -e.debtRatio * wachstum, "Punkte im Jahr", "Eine wachsende Wirtschaft verkleinert die Quote, auch durch Preissteigerung."),
        ],
      };
    },
    handlungen: [
      { label: "Den Haushalt ansehen", ziel: "haushalt" },
      { label: "Zinsen niedrig halten: die Zentralbank", ziel: "zentralbank", abschnitt: "sitzung" },
    ],
  },
  {
    id: "zinsausgaben", name: "Zinsausgaben des Staates", gruppe: "Staat und Märkte", einheit: "% des BIP", stellen: 1, gut: "niedrig",
    erklaerung: "Was der Staat im Jahr für Zinsen zahlt. Nach dem Haushaltsgesetz 2026 waren es rund 3,5 % des BIP, etwa jeder fünfte Lira der Steuereinnahmen. Der Durchschnittszins folgt den Marktzinsen nur langsam, weil Schulden erst bei Fälligkeit neu finanziert werden.",
    gemessen: () => "monatlich fortgeschrieben (Modell)",
    prognose: "zinsausgaben",
    treiber: (w) => {
      const z = haushaltZustand(w);
      return {
        kopf: `Der Durchschnittszins auf die Schuld liegt bei ${nf(z.zinssatz)} % (Start: ${nf(ZINSSATZ_START)} %) und folgt dem Marktzins (Leitzins plus Risikoaufschlag) nur zu einem Viertel.`,
        zeilen: [
          tr("Schuld zum Startzins", (w.economy.debtRatio * ZINSSATZ_START) / 100, "% des BIP", "Was die Schuld beim Start gekostet hätte."),
          tr("Mehr- oder Minderzins seit dem Start", w.economy.zinsMehrlast ?? 0, "% des BIP", "Steigende Marktzinsen verteuern jede neu finanzierte Schuld."),
        ],
      };
    },
    handlungen: [
      { label: "Zinsen und Risiko: die Zentralbank", ziel: "zentralbank", abschnitt: "sitzung" },
      { label: "Schulden bremsen: den Haushalt ansehen", ziel: "haushalt" },
    ],
  },
  {
    id: "risiko", name: "Risikoaufschlag", gruppe: "Staat und Märkte", einheit: "Basispunkte", stellen: 0, gut: "niedrig",
    erklaerung: "Was Anleger als Aufpreis für das Risiko verlangen, dass der Staat nicht zahlt (CDS auf fünf Jahre). Er steigt bei hoher Inflation, hohen Schulden und politischer Unsicherheit.",
    gemessen: () => "tagesaktuell",
    prognose: "riskPremium",
    treiber: (w) => {
      const e = w.economy;
      const zeilen = [
        tr("Grundniveau", 150, "Basispunkte", "Ein Land mit stabiler Lage hat kaum weniger."),
        tr("Inflation über 10 %", 3 * Math.max(0, e.inflation - 10), "Basispunkte", "Hohe Inflation entwertet Anleihen."),
        tr("Schulden über 40 % des BIP", 2 * Math.max(0, e.debtRatio - 40), "Basispunkte", "Mehr Schulden, mehr Risiko."),
        tr("Fehlende Glaubwürdigkeit der Bank", 200 * (1 - e.credibility), "Basispunkte", "Politischer Druck auf die Bank macht Anleger nervös (Z8)."),
        tr("Weltzinsen", AUSSEN.weltzinsAufRisiko * ((e.weltzins ?? 100) - 100), "Basispunkte", "Steigen Zinsen weltweit, werden Schwellenländer riskanter."),
      ];
      const grund = zeilen.reduce((a, z) => a + z.wirkung, 0);
      return { kopf: `Der Risikoaufschlag zieht mit 2 % pro Tag zu seinem Grundwert von ${nf(grund, 0)} Punkten (jetzt ${nf(e.riskPremium, 0)}).`, zeilen };
    },
    handlungen: [
      { label: "Glaubwürdigkeit der Bank pflegen", ziel: "zentralbank", abschnitt: "stufe" },
      { label: "Defizit begrenzen: den Haushalt ansehen", ziel: "haushalt" },
    ],
  },
  netzKennzahl("vertrauen_maerkte", "Staat und Märkte", "hoch", [
    { label: "Defizit begrenzen: den Haushalt ansehen", ziel: "haushalt" },
    { label: "Glaubwürdigkeit der Bank pflegen", ziel: "zentralbank", abschnitt: "stufe" },
  ]),
  netzKennzahl("lebenshaltung", "Alltag der Menschen", "niedrig", [
    { label: "Preise drücken: Subventionen", ziel: "haushalt", posten: "subventionen", stufe: 1 },
    { label: "Verbrauchsteuern senken", ziel: "haushalt", posten: "verbrauchsteuern", stufe: -1 },
    { label: "Inflation bekämpfen: die Zinssitzung", ziel: "zentralbank", abschnitt: "sitzung" },
  ], "Wähler beurteilen die Lage nach den Preisen, die sie täglich sehen."),
  netzKennzahl("armut", "Alltag der Menschen", "niedrig", [
    { label: "Sozialleistungen ausbauen", ziel: "haushalt", posten: "soziales", stufe: 1 },
    { label: "Preise drücken: Subventionen", ziel: "haushalt", posten: "subventionen", stufe: 1 },
  ]),
];

export const KENNZAHLEN_NACH_ID: Record<string, Kennzahl> = Object.fromEntries(KENNZAHLEN.map((k) => [k.id, k]));
function KENNZAHLEN_NACH_ID_SPAET(id: string): Kennzahl {
  return KENNZAHLEN_NACH_ID[id]!;
}

export function kennzahl(id: string): Kennzahl | undefined {
  return KENNZAHLEN_NACH_ID[id];
}

/** Der aktuelle Wert, den der Spieler kennt (bei veröffentlichten Größen der veröffentlichte). */
export function aktuellerWert(w: World, id: string): number {
  const v = verlauf(w, id);
  return v.length ? v[v.length - 1]!.wert : NaN;
}

/** Wert beim Amtsantritt (für den Vergleich „seit dem Start“). */
export function startWert(w: World, id: string): number {
  const v = verlauf(w, id);
  const m = startMonat(w);
  const p = v.find((x) => x.monat >= m) ?? v[0];
  return p ? p.wert : NaN;
}

/** Wert vor zwölf Monaten oder, wenn der Verlauf kürzer ist, der älteste. */
export function wertVorMonaten(w: World, id: string, monate: number): number {
  const v = verlauf(w, id);
  if (!v.length) return NaN;
  return v[Math.max(0, v.length - 1 - monate)]!.wert;
}

/** Wie sich die Zahl seit dem Start verändert hat und ob das gut ist. */
export function bewertung(k: Kennzahl, jetzt: number, davor: number): { delta: number; gut: boolean | null } {
  const delta = jetzt - davor;
  const klein = Math.abs(delta) < Math.max(0.05, Math.abs(davor) * 0.01);
  if (klein || k.gut === "neutral") return { delta, gut: null };
  return { delta, gut: k.gut === "niedrig" ? delta < 0 : delta > 0 };
}

export { istGut, nodeName, wirtschaftZustand, zinsausgabenJetzt };
