// Die Kennzahlen der Wirtschaftsakte: Name, Erklärung, Verlauf, Prognose, Treiber („Was bewegt diese Zahl?“) und was man dagegen tun kann.
// Die Treiber stammen aus den Formeln des Wirtschaftsmodells (`economy.ts`) und den Verbindungen des Politiknetzes, nicht aus dem Kopf.

import type { World } from "./types";
import { AUSSEN, PARAMS, potential, ppkZiel, PPK_GEWICHTE, realRate } from "./economy";
import { DEVISEN, kapitalflussZerlegung, leistungsbilanzZerlegung } from "./devisen";
import { NET } from "./modell";
import { nationalAverage, startAverage, decayVon } from "./netz";
import { formatDateDe, formatMonthDe } from "./dates";
import { defizitJetzt, haushaltZustand, startMonat, verlauf, wirtschaftZustand, zinsausgabenJetzt } from "./wirtschaft";
import { istGut } from "./folgen";
import { ZINSSATZ_START } from "../data/haushaltsplan";
import { aktuelleLocale, t } from "../i18n";

export type Gruppe = "Preise und Geld" | "Wirtschaft und Arbeit" | "Staat und Märkte" | "Alltag der Menschen";
export const GRUPPEN: Gruppe[] = ["Preise und Geld", "Wirtschaft und Arbeit", "Staat und Märkte", "Alltag der Menschen"];

/** Anzeigename einer Gruppe (die Gruppe selbst bleibt der deutsche Schlüssel). */
export const gruppeName = (g: Gruppe): string => t(`wk.gruppe.${GRUPPEN.indexOf(g)}`);

const EINHEITEN = ["%", "Indexpunkte", "Punkte", "Punkte je Monat", "Punkte im Jahr", "Prozentpunkte", "% im Jahr", "% des BIP", "% des BIP je Jahr", "% Kursstütze, Rest", "Basispunkte", "Lira", "Mrd. US-Dollar"];
/** Anzeigename einer Einheit (die Einheit selbst bleibt der deutsche Schlüssel, etwa für „Indexpunkte“). */
export const einheitName = (e: string): string => {
  const i = EINHEITEN.indexOf(e);
  return i < 0 ? e : t(`wk.einheit.${i}`);
};

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
  abschnitt?: "sitzung" | "gouverneur" | "stufe" | "devisen";
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

const nf = (x: number, d = 1) => x.toLocaleString(aktuelleLocale(), { minimumFractionDigits: d, maximumFractionDigits: d });
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
  const rueck = -decayVon(node) * (netz(w, id) - startAverage(NET, w.net, id));
  if (Math.abs(rueck) >= 0.015) out.push(tr(t("wk.23b7745"), rueck, "Punkte je Monat", t("wk.381fb67")));
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
    erklaerung: node.text + (ergaenzung ? ` ${ergaenzung}` : "") + " " + t("wk.t.index"),
    gemessen: () => t("wk.4dc05c7"),
    prognose: `net:${id}`,
    treiber: (w) => ({ kopf: t("wk.995b889"), zeilen: netzTreiber(w, id) }),
    handlungen,
  };
}

export const KENNZAHLEN: Kennzahl[] = [
  {
    id: "inflation", name: t("wk.5b4e842"), gruppe: "Preise und Geld", einheit: "%", stellen: 1, gut: "niedrig",
    erklaerung: t("wk.e78842b"),
    gemessen: (w) => t("wk.t.veroeffentlicht", { periode: formatMonthDe(w.published.inflation.period), datum: formatDateDe(w.published.inflation.publishedOn) }),
    prognose: "inflation", vergleichId: "inflation",
    linien: (w) => [{ wert: w.economy.inflationTarget, text: t("wk.b78fba5"), art: "ziel" }],
    treiber: (w) => {
      const e = w.economy;
      const excess = e.fxChange12 - (e.inflation - PARAMS.foreignInflation);
      const zeilen = [
        tr(t("wk.5d45027"), e.expectedInflation, "%", t("wk.1710b23")),
        tr(t("wk.72afc80"), PARAMS.gapOnInflation * e.outputGap, "Prozentpunkte", t("wk.e725ae4")),
        tr(t("wk.a6e2d43"), PARAMS.fxPassThrough * excess, "Prozentpunkte", t("wk.cf1d329")),
        tr(t("wk.d42d0e2"), e.costPush, "Prozentpunkte", t("wk.db3118d")),
        tr(t("wk.a5a1757"), AUSSEN.oelAufInflation * ((e.oel ?? 100) - 100), "Prozentpunkte", t("wk.d6456f4")),
      ];
      const anker = zeilen.reduce((a, z) => a + z.wirkung, 0);
      return { kopf: t("wk.t.inflationKopf", { tempo: nf(PARAMS.inflationSpeed * 100, 0), anker: nf(anker) }), zeilen };
    },
    handlungen: [
      { label: t("wk.b480ce3"), ziel: "zentralbank", abschnitt: "sitzung" },
      { label: t("wk.6c64a15"), ziel: "haushalt" },
      { label: t("wk.75714cf"), ziel: "haushalt", posten: "subventionen", stufe: 1 },
    ],
  },
  {
    id: "erwartung", name: t("wk.0af05e5"), gruppe: "Preise und Geld", einheit: "%", stellen: 1, gut: "niedrig",
    erklaerung: t("wk.c10b57a"),
    gemessen: () => t("wk.0393805"),
    prognose: "expectedInflation",
    linien: (w) => [{ wert: w.economy.inflationTarget, text: t("wk.b78fba5"), art: "ziel" }],
    treiber: (w) => {
      const e = w.economy;
      return {
        kopf: t("wk.t.erwartungKopf", { tempo: nf(PARAMS.expectationSpeed * 100, 0) }),
        zeilen: [
          tr(t("wk.eef6729"), e.credibility * e.inflationTarget, "%", t("wk.675cda3")),
          tr(t("wk.70a2370"), (1 - e.credibility) * e.inflation, "%", t("wk.ab626ba")),
        ],
      };
    },
    handlungen: [
      { label: t("wk.3b246f1"), ziel: "zentralbank", abschnitt: "stufe" },
      { label: t("wk.01594ac"), ziel: "zentralbank", abschnitt: "gouverneur" },
    ],
  },
  {
    id: "leitzins", name: t("wk.484806d"), gruppe: "Preise und Geld", einheit: "%", stellen: 1, gut: "neutral",
    erklaerung: t("wk.5aab496"),
    gemessen: () => t("wk.cebe672"),
    prognose: "policyRate",
    treiber: (w) => {
      const e = w.economy;
      const g = PPK_GEWICHTE[w.governor.stance];
      const ziel = ppkZiel(e, w.governor.stance);
      return {
        kopf: t("wk.t.leitzinsKopf", { ziel: nf(ziel), jetzt: nf(e.policyRate) }),
        zeilen: [
          tr(t("wk.b7a3599"), PARAMS.neutralRealRate, "%", t("wk.60921da")),
          tr(t("wk.446b70e"), e.expectedInflation, "%", t("wk.a96b886")),
          tr(t("wk.0d4d446"), g.infl * (e.inflation - e.inflationTarget), "Punkte", t("wk.1a94953")),
          tr(t("wk.ae70826"), g.gap * e.outputGap, "Punkte", t("wk.4c2dd72")),
          tr(t("wk.d92a644"), g.bias, "Punkte", t("wk.106c0bb")),
        ],
      };
    },
    handlungen: [
      { label: t("wk.b480ce3"), ziel: "zentralbank", abschnitt: "sitzung" },
      { label: t("wk.1b055e7"), ziel: "zentralbank", abschnitt: "gouverneur" },
    ],
  },
  {
    id: "realzins", name: t("wk.413a13c"), gruppe: "Preise und Geld", einheit: "%", stellen: 1, gut: "neutral",
    erklaerung: t("wk.9a85d54"),
    gemessen: () => t("wk.c3a0d06"),
    treiber: (w) => ({
      kopf: t("wk.t.realzinsKopf", { lag: PARAMS.rateLagMonths, neutral: nf(PARAMS.neutralRealRate) }),
      zeilen: [
        tr(t("wk.484806d"), w.economy.policyRate, "%", t("wk.3d16d2a")),
        tr(t("wk.446b70e"), -w.economy.expectedInflation, "%", t("wk.b527a46")),
      ],
    }),
    handlungen: [{ label: t("wk.b480ce3"), ziel: "zentralbank", abschnitt: "sitzung" }],
  },
  {
    id: "usd", name: t("wk.65b728e"), gruppe: "Preise und Geld", einheit: "Lira", stellen: 2, gut: "niedrig",
    erklaerung: t("wk.b7eface"),
    gemessen: () => t("wk.50526b2"),
    prognose: "usdTry", vergleichId: "abwertung",
    treiber: (w) => {
      const e = w.economy;
      return {
        kopf: t("wk.8485638"),
        zeilen: [
          tr(t("wk.701ed78"), e.expectedInflation - PARAMS.foreignInflation, "% im Jahr", t("wk.d5684e9")),
          tr(t("wk.b28df2b"), -PARAMS.carryOnFx * (realRate(e) - PARAMS.neutralRealRate), "% im Jahr", t("wk.75c1d9f")),
          tr(t("wk.16cdef9"), (e.riskPremium - 250) / 100, "% im Jahr", t("wk.7d5acab")),
          tr(t("wk.7d08ba6"), PARAMS.fxReservenDruckMax * (e.reservenDruck ?? 0), "% im Jahr", t("wk.5f3e1ec")),
          tr(t("wk.2e24491"), -(e.fxPuffer ?? 0) * 100, "% Kursstütze, Rest", t("wk.aaabc39")),
        ],
      };
    },
    handlungen: [
      { label: t("wk.786597b"), ziel: "zentralbank", abschnitt: "sitzung" },
      { label: t("wk.149195c"), ziel: "haushalt" },
    ],
  },
  {
    id: "eur", name: t("wk.be11e6d"), gruppe: "Preise und Geld", einheit: "Lira", stellen: 2, gut: "niedrig",
    erklaerung: t("wk.f964aae"),
    gemessen: () => t("wk.50526b2"),
    prognose: "eurTry",
    treiber: (w) => ({ kopf: t("wk.5f47b77"), zeilen: KENNZAHLEN_NACH_ID_SPAET("usd").treiber(w).zeilen }),
    handlungen: [{ label: t("wk.786597b"), ziel: "zentralbank", abschnitt: "sitzung" }],
  },
  {
    id: "wachstum", name: t("wk.f133e3f"), gruppe: "Wirtschaft und Arbeit", einheit: "%", stellen: 1, gut: "hoch",
    erklaerung: t("wk.68a7faf"),
    gemessen: (w) => t("wk.t.veroeffentlicht", { periode: w.published.growth.period, datum: formatDateDe(w.published.growth.publishedOn) }),
    prognose: "growth", vergleichId: "wachstum",
    treiber: (w) => {
      const e = w.economy;
      const alt = w.history[w.history.length - 12]?.outputGap ?? e.outputGap;
      const lag = w.history[w.history.length - PARAMS.rateLagMonths];
      const laggedReal = lag ? lag.realRate : realRate(e);
      return {
        kopf: t("wk.f8c7efb"),
        zeilen: [
          tr(t("wk.530ccc9"), potential(e), "% im Jahr", t("wk.81e9dc4")),
          tr(t("wk.b0c69d5"), e.outputGap - alt, "Punkte", t("wk.0022d28")),
          tr(t("wk.6faedb0"), -PARAMS.rateOnGap * (laggedReal - PARAMS.neutralRealRate), "Punkte je Monat", t("wk.8e0d0f9")),
          tr(t("wk.8ddb02e"), PARAMS.fiscalOnGap * (e.fiscalImpulse + e.policyCost), "Punkte je Monat", t("wk.a8fb50c")),
          tr(t("wk.cd1d645"), AUSSEN.euAufAuslastung * ((e.euNachfrage ?? 100) - 100), "Punkte je Monat", t("wk.5d8a4f5")),
          tr(t("wk.a5a1757"), -AUSSEN.oelAufAuslastung * ((e.oel ?? 100) - 100), "Punkte je Monat", t("wk.54a7d84")),
        ],
      };
    },
    handlungen: [
      { label: t("wk.53f2dd0"), ziel: "haushalt", posten: "investitionen", stufe: 1 },
      { label: t("wk.db731de"), ziel: "zentralbank", abschnitt: "sitzung" },
    ],
  },
  {
    id: "arbeitslosigkeit", name: t("wk.63dadbe"), gruppe: "Wirtschaft und Arbeit", einheit: "%", stellen: 1, gut: "niedrig",
    erklaerung: t("wk.8ffcc1c"),
    gemessen: (w) => t("wk.t.veroeffentlicht", { periode: formatMonthDe(w.published.unemployment.period), datum: formatDateDe(w.published.unemployment.publishedOn) }),
    prognose: "unemployment", vergleichId: "arbeitslosigkeit",
    treiber: (w) => {
      const e = w.economy;
      return {
        kopf: t("wk.507b355"),
        zeilen: [
          tr(t("wk.t.natuerlich", { quote: nf(PARAMS.naturalUnemployment) }), 0.03 * (PARAMS.naturalUnemployment - e.unemployment), "Punkte je Monat", t("wk.t.natuerlichText")),
          tr(t("wk.e2692a5"), -PARAMS.okun * (e.growth - potential(e)), "Punkte je Monat", t("wk.448231d")),
        ],
      };
    },
    handlungen: [
      { label: t("wk.53f2dd0"), ziel: "haushalt", posten: "investitionen", stufe: 1 },
      { label: t("wk.db731de"), ziel: "zentralbank", abschnitt: "sitzung" },
    ],
  },
  netzKennzahl("realeinkommen", "Wirtschaft und Arbeit", "hoch", [
    { label: t("wk.07f972a"), ziel: "haushalt", posten: "einkommensteuer", stufe: -1 },
    { label: t("wk.269dfd4"), ziel: "zentralbank", abschnitt: "sitzung" },
  ], t("wk.dde32f3")),
  netzKennzahl("investitionen", "Wirtschaft und Arbeit", "hoch", [
    { label: t("wk.01de968"), ziel: "haushalt", posten: "investitionen", stufe: 1 },
    { label: t("wk.683fb16"), ziel: "haushalt", posten: "unternehmensteuer", stufe: -1 },
  ]),
  netzKennzahl("kredite", "Wirtschaft und Arbeit", "hoch", [{ label: t("wk.eee6546"), ziel: "zentralbank", abschnitt: "sitzung" }]),
  netzKennzahl("export", "Wirtschaft und Arbeit", "hoch", [{ label: t("wk.92ab07f"), ziel: "zentralbank", abschnitt: "sitzung" }]),
  {
    id: "defizit", name: t("wk.204fd06"), gruppe: "Staat und Märkte", einheit: "% des BIP", stellen: 1, gut: "niedrig",
    erklaerung: t("wk.a32e1d4"),
    gemessen: () => t("wk.993d135"),
    prognose: "defizit",
    linien: () => [{ wert: 3, text: t("wk.a74b219"), art: "grenze" }],
    treiber: (w) => {
      const e = w.economy;
      return {
        kopf: t("wk.t.defizitKopf", { wert: nf(defizitJetzt(w)) }),
        zeilen: [
          tr(t("wk.0dc0333"), e.deficit, "% des BIP", t("wk.c7493a6")),
          tr(t("wk.2530cf9"), e.fiscalImpulse, "% des BIP", t("wk.3a89504")),
          tr(t("wk.d92a6aa"), e.policyCost, "% des BIP", t("wk.1ec3e24")),
          tr(t("wk.2672f2b"), e.zinsMehrlast ?? 0, "% des BIP", t("wk.8daf19a")),
        ],
      };
    },
    handlungen: [
      { label: t("wk.ff09b4a"), ziel: "haushalt" },
      { label: t("wk.0ed2181"), ziel: "haushalt", posten: "personal", stufe: -1 },
      { label: t("wk.6509078"), ziel: "haushalt", posten: "verbrauchsteuern", stufe: 1 },
    ],
  },
  {
    id: "schulden", name: t("wk.b845c55"), gruppe: "Staat und Märkte", einheit: "% des BIP", stellen: 1, gut: "niedrig",
    erklaerung: t("wk.d2da496"),
    gemessen: () => t("wk.a97302f"),
    prognose: "debtRatio", vergleichId: "schulden",
    linien: () => [{ wert: 60, text: t("wk.3bb76d9"), art: "grenze" }],
    treiber: (w) => {
      const e = w.economy;
      const wachstum = (e.growth + e.inflation) / 100;
      const flow = defizitJetzt(w) - e.debtRatio * wachstum;
      return {
        kopf: t("wk.t.schuldenKopf", { wert: `${flow >= 0 ? "+" : ""}${nf(flow)}` }),
        zeilen: [
          tr(t("wk.ffa2726"), defizitJetzt(w), "Punkte im Jahr", t("wk.7731a2d")),
          tr(t("wk.fb293aa"), -e.debtRatio * wachstum, "Punkte im Jahr", t("wk.5ec59b7")),
        ],
      };
    },
    handlungen: [
      { label: t("wk.ff09b4a"), ziel: "haushalt" },
      { label: t("wk.a07288f"), ziel: "zentralbank", abschnitt: "sitzung" },
    ],
  },
  {
    id: "zinsausgaben", name: t("wk.7dfc496"), gruppe: "Staat und Märkte", einheit: "% des BIP", stellen: 1, gut: "niedrig",
    erklaerung: t("wk.181a88e"),
    gemessen: () => t("wk.114f028"),
    prognose: "zinsausgaben",
    treiber: (w) => {
      const z = haushaltZustand(w);
      return {
        kopf: t("wk.t.zinsKopf", { zins: nf(z.zinssatz), start: nf(ZINSSATZ_START) }),
        zeilen: [
          tr(t("wk.d97fee1"), (w.economy.debtRatio * ZINSSATZ_START) / 100, "% des BIP", t("wk.cb0a5ad")),
          tr(t("wk.a0daf42"), w.economy.zinsMehrlast ?? 0, "% des BIP", t("wk.fee011d")),
        ],
      };
    },
    handlungen: [
      { label: t("wk.7821c3b"), ziel: "zentralbank", abschnitt: "sitzung" },
      { label: t("wk.95a930c"), ziel: "haushalt" },
    ],
  },
  {
    id: "risiko", name: t("wk.16cdef9"), gruppe: "Staat und Märkte", einheit: "Basispunkte", stellen: 0, gut: "niedrig",
    erklaerung: t("wk.3bbfe0f"),
    gemessen: () => t("wk.50526b2"),
    prognose: "riskPremium",
    treiber: (w) => {
      const e = w.economy;
      // Die Zeilen spiegeln die Fundamentalformel von dailyRiskPremium (Z8 in economy.ts)
      const zeilen = [
        tr(t("wk.1046a01"), 150, "Basispunkte", t("wk.16e7925")),
        tr(t("wk.aa04b74"), 2.5 * Math.max(0, e.expectedInflation - 10), "Basispunkte", t("wk.6c080c8")),
        tr(t("wk.8d5f211"), 2 * Math.max(0, e.debtRatio - 40), "Basispunkte", t("wk.54f0d6c")),
        tr(t("wk.4da2d4a"), 200 * (1 - e.credibility), "Basispunkte", t("wk.a820cfe")),
        tr(t("wk.c910b9b"), PARAMS.politiklastAufRisiko * Math.max(0, e.policyCost - 2), "Basispunkte", t("wk.116fb7c")),
        tr(t("wk.7d08ba6"), PARAMS.cdsReservenDruckMax * (e.reservenDruck ?? 0), "Basispunkte", t("wk.438af1b")),
        tr(t("wk.15b8248"), AUSSEN.weltzinsAufRisiko * ((e.weltzins ?? 100) - 100), "Basispunkte", t("wk.f74b9c3")),
      ];
      const grund = zeilen.reduce((a, z) => a + z.wirkung, 0);
      return { kopf: t("wk.t.risikoKopf", { grund: nf(grund, 0), jetzt: nf(e.riskPremium, 0) }), zeilen };
    },
    handlungen: [
      { label: t("wk.3b246f1"), ziel: "zentralbank", abschnitt: "stufe" },
      { label: t("wk.29c2714"), ziel: "haushalt" },
    ],
  },
  // WIR-2: Die Devisen-Lage als eigene Kennzahlengruppe — Devisen lassen sich nicht drucken.
  {
    id: "leistungsbilanz", name: t("wk.7c9c707"), gruppe: "Staat und Märkte", einheit: "% des BIP", stellen: 1, gut: "hoch",
    erklaerung: t("wk.9590242"),
    gemessen: () => t("wk.d2db497"),
    treiber: (w) => {
      const z = leistungsbilanzZerlegung(w);
      return {
        kopf: t("wk.t.lbKopf", { tempo: nf(DEVISEN.lbTempo * 100, 0), ziel: nf(z.ziel) }),
        zeilen: z.zeilen.map((x) => tr(x.name, x.wert, "% des BIP je Jahr", x.text)),
      };
    },
    handlungen: [
      { label: t("wk.b5af6a0"), ziel: "zentralbank", abschnitt: "devisen" },
      { label: t("wk.8406a78"), ziel: "zentralbank", abschnitt: "sitzung" },
    ],
  },
  {
    id: "reservenNetto", name: t("wk.44f16be"), gruppe: "Staat und Märkte", einheit: "Mrd. US-Dollar", stellen: 1, gut: "hoch",
    erklaerung: t("wk.b210b29"),
    gemessen: () => t("wk.212c6a1"),
    linien: () => [
      { wert: DEVISEN.druckAn, text: t("wk.t.zuschlagAb", { n: DEVISEN.druckAn }), art: "grenze" },
      { wert: DEVISEN.kriseAn, text: t("wk.t.kriseAb", { n: DEVISEN.kriseAn }), art: "grenze" },
    ],
    treiber: (w) => {
      const lb = leistungsbilanzZerlegung(w);
      const fl = kapitalflussZerlegung(w);
      const e = w.economy;
      const monat = (((e.leistungsbilanzPctBip ?? 0) + fl.ziel) / 100 / 12) * (((e.bipTryTn ?? 84) * 1000) / Math.max(1, e.usdTry));
      return {
        kopf: t("wk.t.reservenKopf", { wert: nf(monat) }),
        zeilen: [
          tr(t("wk.0cd560f"), e.leistungsbilanzPctBip ?? 0, "% des BIP je Jahr", t("wk.b2fd8c3")),
          ...fl.zeilen.map((x) => tr(x.name, x.wert, "% des BIP je Jahr", x.text)),
          tr(t("wk.795226c"), (e.reservenDruck ?? 0) * 100, "%", t("wk.47e6d22")),
        ],
      };
    },
    handlungen: [
      { label: t("wk.fafbdcd"), ziel: "zentralbank", abschnitt: "devisen" },
      { label: t("wk.0b04e01"), ziel: "zentralbank", abschnitt: "sitzung" },
    ],
  },
  {
    id: "reservenBrutto", name: t("wk.1accb2c"), gruppe: "Staat und Märkte", einheit: "Mrd. US-Dollar", stellen: 1, gut: "hoch",
    erklaerung: t("wk.ac5a079"),
    gemessen: () => t("wk.212c6a1"),
    treiber: (w) => ({
      kopf: t("wk.7d738a2"),
      zeilen: [
        tr(t("wk.ca3c698"), (w.economy.reservenNettoUsdMrd ?? 0) - (w.economy.reservenBruttoUsdMrd ?? 0), "Mrd. US-Dollar", t("wk.b360e12")),
        tr(t("wk.2f9f96f"), (w.economy.reservenBruttoUsdMrd ?? 0) - (w.economy.reservenNettoUsdMrd ?? 0), "Mrd. US-Dollar", t("wk.d9b189f")),
      ],
    }),
    handlungen: [{ label: t("wk.55a4d96"), ziel: "zentralbank", abschnitt: "devisen" }],
  },
  netzKennzahl("vertrauen_maerkte", "Staat und Märkte", "hoch", [
    { label: t("wk.29c2714"), ziel: "haushalt" },
    { label: t("wk.3b246f1"), ziel: "zentralbank", abschnitt: "stufe" },
  ]),
  netzKennzahl("lebenshaltung", "Alltag der Menschen", "niedrig", [
    { label: t("wk.75714cf"), ziel: "haushalt", posten: "subventionen", stufe: 1 },
    { label: t("wk.4028786"), ziel: "haushalt", posten: "verbrauchsteuern", stufe: -1 },
    { label: t("wk.269dfd4"), ziel: "zentralbank", abschnitt: "sitzung" },
  ], t("wk.8804d22")),
  netzKennzahl("armut", "Alltag der Menschen", "niedrig", [
    { label: t("wk.9aafbba"), ziel: "haushalt", posten: "soziales", stufe: 1 },
    { label: t("wk.75714cf"), ziel: "haushalt", posten: "subventionen", stufe: 1 },
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
