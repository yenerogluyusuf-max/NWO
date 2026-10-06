// Die Mentorin erklärt jede Größe des Politiknetzes: was sie ist, wo das Land steht, was sie treibt, was sie bewirkt
// und was der Spieler tun kann (Lernkonzept, Abschnitt 4). Alle Zahlen kommen aus dem Weltzustand; Texte erfinden nichts.

import { NET } from "../sim/modell";
import { nationalAverage, PROVINCES, startAverage } from "../sim/netz";
import { PROVINZEN } from "../sim/regional";
import { hebel, MAKRO_WEGE } from "../sim/wege";
import type { World } from "../sim/types";
import type { NodeSpec } from "../data/politiknetz";

import { t } from "../i18n";

export interface Verbindung {
  id: string;
  name: string;
  erhoeht: boolean;
  /** Verzögerung in Monaten (0 = sofort) */
  lag: number;
  /** „sofort“ oder „nach 3 Monaten“ */
  wann: string;
  warum: string;
}

export interface Begriff {
  begriff: string;
  text: string;
}

export interface Erklaerung {
  /** Was ist das? */
  was: string[];
  /** Wo steht das Land? */
  stand: string[];
  /** Ausreißer nach Provinzen */
  orte?: { hoch: { name: string; wert: number }[]; tief: { name: string; wert: number }[] };
  wirkungen: Verbindung[];
  treiber: Verbindung[];
  hebel: { text: string; warum: string }[];
  hebelHinweis?: string;
  begriffe: Begriff[];
}

export function wann(lag: number): string {
  return t("lernen.wann", { n: lag });
}

const KIND_ERKLAERT = (kind: NodeSpec["kind"]): string => t(`lernen.art.${kind}`);

const BEGRIFF_IDS = ["index", "durchschnitt", "verzoegerung", "akut", "traegheit", "umsetzung", "realzins"] as const;
const begriff = (id: string): Begriff => ({ begriff: t(`lernen.begriff.${id}.name`), text: t(`lernen.begriff.${id}.text`) });

interface EingangInfo {
  /** Zahl der Absätze unter „Was ist das?“ (Schlüssel lernen.e.<id>.was1 …) */
  was: number;
  stand: (w: World) => string[];
  begriffe?: string[];
}

const r1 = (x: number): number => Math.round(x * 10) / 10;

/** Die Größen des Wirtschaftsmodells behalten ihre eigene Einheit; sie haben eigene Erklärungen. */
const EINGANG: Record<string, EingangInfo> = {
  inflation: {
    was: 2,
    stand: (w) => [
      t("lernen.e.inflation.stand", { wert: r1(w.published.inflation.value), periode: w.published.inflation.period, ziel: r1(w.economy.inflationTarget), erwartet: r1(w.economy.expectedInflation) }),
      t("lernen.e.inflation.stand2"),
    ],
    begriffe: ["realzins"],
  },
  arbeitslosigkeit: {
    was: 2,
    stand: (w) => [t("lernen.e.arbeitslosigkeit.stand", { wert: r1(w.published.unemployment.value), periode: w.published.unemployment.period, lang: 9 })],
  },
  wachstum: {
    was: 2,
    stand: (w) => [t("lernen.e.wachstum.stand", { wert: r1(w.published.growth.value), periode: w.published.growth.period, potenzial: r1(w.economy.potentialGrowth) })],
  },
  leitzins: {
    was: 2,
    stand: (w) => [t("lernen.e.leitzins.stand", { zins: r1(w.economy.policyRate), real: r1(w.economy.policyRate - w.economy.expectedInflation) })],
    begriffe: ["realzins"],
  },
  abwertung: {
    was: 2,
    stand: (w) => {
      const x = w.economy.fxChange12;
      const verlust = (1 - 1 / (1 + x / 100)) * 100;
      return [t("lernen.e.abwertung.stand", { x: r1(x), kurs: r1(w.economy.usdTry), verlust: r1(verlust) })];
    },
  },
  defizit: {
    was: 2,
    stand: (w) => [t("lernen.e.defizit.stand", { gesamt: r1(w.economy.deficit + w.economy.fiscalImpulse + w.economy.policyCost), grund: r1(w.economy.deficit), programm: r1(w.economy.fiscalImpulse), kosten: r1(w.economy.policyCost) })],
  },
  schulden: {
    was: 2,
    stand: (w) => [t("lernen.e.schulden.stand", { quote: r1(w.economy.debtRatio), aufschlag: Math.round(w.economy.riskPremium) })],
  },
};

function verbindungen(id: string, richtung: "in" | "out", n = 3): Verbindung[] {
  const kanten = NET.edges.filter((e) => (richtung === "in" ? e.to === id : e.from === id)).sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, n);
  return kanten.map((e) => {
    const andere = richtung === "in" ? e.from : e.to;
    return { id: andere, name: NET.nodes[NET.index.get(andere)!]!.name, erhoeht: e.weight > 0, lag: e.lag, wann: wann(e.lag), warum: e.why };
  });
}

function provinzWerte(w: World, id: string): { name: string; wert: number }[] {
  const i = NET.index.get(id)!;
  return Array.from({ length: PROVINCES }, (_, p) => ({ name: PROVINZEN[p]!.name, wert: w.net.values[i * PROVINCES + p]! })).sort((a, b) => b.wert - a.wert);
}

export function erklaere(node: NodeSpec, w: World): Erklaerung {
  const jetzt = nationalAverage(NET, w.net, node.id);
  const start = startAverage(NET, w.net, node.id);
  const begriffe: Begriff[] = [];
  const genommen = new Set<string>();
  const nimm = (...ids: string[]) =>
    ids.forEach((k) => {
      if (!(BEGRIFF_IDS as readonly string[]).includes(k) || genommen.has(k)) return;
      genommen.add(k);
      begriffe.push(begriff(k));
    });

  const wirkungen = verbindungen(node.id, "out");
  const treiber = verbindungen(node.id, "in");
  if ([...wirkungen, ...treiber].some((v) => v.lag > 0)) nimm("verzoegerung");

  // Größen des Wirtschaftsmodells
  if (node.input) {
    const info = EINGANG[node.input]!;
    nimm("durchschnitt", ...(info.begriffe ?? []));
    return {
      was: [...Array.from({ length: info.was }, (_, i) => t(`lernen.e.${node.input}.was${i + 1}`)), t(`lernen.e.${node.input}.wichtig`)],
      stand: info.stand(w),
      wirkungen,
      treiber,
      hebel: [],
      hebelHinweis: MAKRO_WEGE[node.input]?.wege.runter,
      begriffe,
    };
  }

  const was: string[] = [node.text, KIND_ERKLAERT(node.kind)];
  const stand: string[] = [];
  let orte: Erklaerung["orte"];
  const werte = node.kind === "massnahme" ? [] : provinzWerte(w, node.id);

  if (node.kind === "massnahme") {
    nimm("umsetzung", "index");
    const kosten = node.cost ?? 0;
    was.push(
      kosten === 0
        ? t("lernen.m.kostenlos")
        : t(kosten < 0 ? "lernen.m.bringt" : "lernen.m.kostet", { p: Math.round(Math.abs(kosten) * 100) / 100, monate: node.months ?? 1 }),
    );
    stand.push(t("lernen.m.stand", { jetzt: Math.round(jetzt), start: Math.round(start) }));
    const ziel = w.net.targets[node.id];
    if (ziel !== undefined && Math.abs(jetzt - ziel) > 1) stand.push(t("lernen.m.beschlossen", { ziel: Math.round(ziel) }));
  } else {
    nimm("index", "durchschnitt", "traegheit");
    const d = jetzt - start;
    stand.push(
      `${t("lernen.g.stand", { jetzt: r1(jetzt), start: r1(start) })} ${Math.abs(d) < 0.3 ? t("lernen.g.kaum") : d > 0 ? t("lernen.g.gestiegen", { d: r1(d) }) : t("lernen.g.gesunken", { d: r1(-d) })}`,
    );
    if (node.kind === "problem") {
      nimm("akut");
      const akut = werte.filter((x) => x.wert >= (node.threshold ?? 60));
      stand.push(akut.length === 0 ? t("lernen.p.keine", { schwelle: node.threshold ?? 60 }) : t("lernen.p.akut", { n: akut.length, schwelle: node.threshold ?? 60, orte: akut.slice(0, 3).map((x) => x.name) }));
    }
    orte = { hoch: werte.slice(0, 3), tief: werte.slice(-3).reverse() };
  }

  // Was du tun kannst
  const hebelListe: Erklaerung["hebel"] = [];
  let hebelHinweis: string | undefined;
  if (node.kind === "massnahme") {
    hebelHinweis = t("lernen.h.regler");
  } else {
    const gewuenscht: 1 | -1 = node.kind === "problem" ? -1 : 1;
    for (const h of hebel(node.id, gewuenscht, 4)) {
      const kante = NET.edges.find((e) => e.from === h.node.id && e.to === node.id) ?? NET.edges.find((e) => e.from === h.node.id);
      hebelListe.push({ text: t(h.richtung > 0 ? "lernen.h.erhoehen" : "lernen.h.senken", { name: h.node.name }), warum: kante?.why ?? h.node.text });
    }
    if (!hebelListe.length) hebelHinweis = t("lernen.h.keiner");
  }

  return {
    was,
    stand,
    ...(orte ? { orte } : {}),
    wirkungen,
    treiber,
    hebel: hebelListe,
    ...(hebelHinweis ? { hebelHinweis } : {}),
    begriffe,
  };
}
