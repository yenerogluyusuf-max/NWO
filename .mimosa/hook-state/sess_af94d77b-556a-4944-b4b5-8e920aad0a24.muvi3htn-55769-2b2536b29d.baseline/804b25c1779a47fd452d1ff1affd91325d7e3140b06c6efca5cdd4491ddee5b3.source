// Ziele des Präsidenten (Agenda): Am ersten Tag werden drei gewählt, die Bilanz misst sie am Ende.
// Jedes Ziel ist messbar und nennt seinen aktuellen Stand.

import { NET } from "./modell";
import { nationalAverage, PROVINCES } from "./netz";
import { stimmenSicht } from "./handeln";
import { LAENDER, vertrauenZu } from "./laender";
import { alleLaufenden } from "./abkommen";
import { aktiveKriege } from "./krieg";
import { zusagenBilanz } from "./zusagen";
import { t } from "../i18n";
import type { World } from "./types";

export interface ZielDef {
  id: string;
  titel: string;
  beschreibung: string;
  /** Wo das Ziel wirkt, für die Gruppierung in der Zielwahl */
  bereich?: "wirtschaft" | "land" | "staat" | "aussen";
  /** Nur in der letzten Amtszeit sinnvoll (Vermächtnis) */
  nurLetzte?: boolean;
  /** Ein Ziel, das etwas bewahren soll (Frieden, Mehrheit, Wort halten): Es darf auch angeboten werden, wenn es schon erfüllt ist */
  haltend?: boolean;
  pruefe: (w: World) => { erreicht: boolean; stand: string };
}

function akutAnzahl(w: World, id: string): number {
  const i = NET.index.get(id);
  const node = i === undefined ? undefined : NET.nodes[i];
  if (i === undefined || !node?.threshold) return 0;
  let n = 0;
  for (let p = 0; p < PROVINCES; p++) if (w.net.values[i * PROVINCES + p]! >= node.threshold) n++;
  return n;
}

function minimum(w: World, id: string): number {
  const i = NET.index.get(id);
  if (i === undefined) return NaN;
  let m = 100;
  for (let p = 0; p < PROVINCES; p++) m = Math.min(m, w.net.values[i * PROVINCES + p]!);
  return m;
}

const nf = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

export const ZIELE: ZielDef[] = [
  {
    id: "inflation15",
    titel: t("ziel.inflation15.titel"),
    beschreibung: t("ziel.inflation15.beschreibung"),
    bereich: "wirtschaft",
    pruefe: (w) => ({ erreicht: w.published.inflation.value < 15, stand: `jetzt ${nf(w.published.inflation.value)} %` }),
  },
  {
    id: "arbeit8",
    titel: t("ziel.arbeit8.titel"),
    beschreibung: t("ziel.arbeit8.beschreibung"),
    bereich: "wirtschaft",
    pruefe: (w) => ({ erreicht: w.economy.unemployment < 8, stand: `jetzt ${nf(w.economy.unemployment)} %` }),
  },
  {
    id: "schulden30",
    titel: t("ziel.schulden30.titel"),
    beschreibung: t("ziel.schulden30.beschreibung"),
    bereich: "wirtschaft",
    pruefe: (w) => ({ erreicht: w.economy.debtRatio < 30, stand: `jetzt ${nf(w.economy.debtRatio)} %` }),
  },
  {
    id: "wasserstrom",
    titel: t("ziel.wasserstrom.titel"),
    beschreibung: t("ziel.wasserstrom.beschreibung"),
    bereich: "land",
    pruefe: (w) => {
      const n = akutAnzahl(w, "p_wassermangel") + akutAnzahl(w, "p_stromausfaelle");
      return { erreicht: n === 0, stand: n === 0 ? "in keiner Provinz akut" : `noch in ${n} Fällen akut` };
    },
  },
  {
    id: "erdbeben",
    titel: t("ziel.erdbeben.titel"),
    beschreibung: t("ziel.erdbeben.beschreibung"),
    bereich: "land",
    pruefe: (w) => {
      const n = akutAnzahl(w, "p_erdbebengefahr");
      return { erreicht: n <= 5, stand: `akut in ${n} Provinzen` };
    },
  },
  {
    id: "wohnen",
    titel: t("ziel.wohnen.titel"),
    beschreibung: t("ziel.wohnen.beschreibung"),
    bereich: "land",
    pruefe: (w) => {
      const n = akutAnzahl(w, "p_wohnungsnot");
      return { erreicht: n === 0, stand: n === 0 ? "in keiner Provinz akut" : `akut in ${n} Provinzen` };
    },
  },
  {
    id: "aerzte",
    titel: t("ziel.aerzte.titel"),
    beschreibung: t("ziel.aerzte.beschreibung"),
    bereich: "land",
    pruefe: (w) => {
      const n = akutAnzahl(w, "p_aerztemangel");
      return { erreicht: n === 0, stand: n === 0 ? "in keiner Provinz akut" : `akut in ${n} Provinzen` };
    },
  },
  {
    id: "strassen",
    titel: t("ziel.strassen.titel"),
    beschreibung: t("ziel.strassen.beschreibung"),
    bereich: "land",
    pruefe: (w) => {
      const m = minimum(w, "verkehrsnetz");
      return { erreicht: m >= 45, stand: `schwächste Provinz: Stufe ${nf(m)}` };
    },
  },
  {
    id: "mehrheit",
    haltend: true,
    titel: t("ziel.mehrheit.titel"),
    beschreibung: t("ziel.mehrheit.beschreibung"),
    bereich: "staat",
    pruefe: (w) => {
      const s = stimmenSicht(w);
      return { erreicht: s.lager >= 301, stand: `${s.lager} von 600 Sitzen` };
    },
  },
  {
    id: "vertrauen60",
    titel: t("ziel.vertrauen60.titel"),
    beschreibung: t("ziel.vertrauen60.beschreibung"),
    bereich: "staat",
    pruefe: (w) => {
      const v = nationalAverage(NET, w.net, "vertrauen_regierung");
      return { erreicht: v >= 60, stand: `jetzt ${nf(v)}` };
    },
  },
];


// ---------------------------------------------------------------------------
// Weitere Ziele (Welle 2): Außenpolitik, Staat und Ordnung. Jedes hat ein Gegenstück in der anderen Richtung, damit keine politische Linie
// bevorzugt wird: wer den Rechtsstaat stärken will, wählt „Unabhängige Gerichte“, wer auf Durchsetzung setzt, „Ruhe und Ordnung“.
// Die Schwellen sind Spielparameter (Platzhalter der Kalibrierung).

const KNOTEN = (w: World, id: string): number => nationalAverage(NET, w.net, id);

ZIELE.push(
  {
    id: "partner5",
    titel: t("ziel.partner5.titel"),
    beschreibung: t("ziel.partner5.beschreibung"),
    bereich: "aussen",
    pruefe: (w) => {
      const n = LAENDER.filter((l) => vertrauenZu(w, l.id) >= 55).length;
      return { erreicht: n >= 5, stand: t("ziel.partner5.stand", { n }) };
    },
  },
  {
    id: "frieden",
    haltend: true,
    titel: t("ziel.frieden.titel"),
    beschreibung: t("ziel.frieden.beschreibung"),
    bereich: "aussen",
    pruefe: (w) => {
      const n = aktiveKriege(w).length;
      return { erreicht: n === 0, stand: n === 0 ? t("ziel.frieden.stand_ruhe") : t("ziel.frieden.stand_krieg", { n }) };
    },
  },
  {
    id: "vertraege3",
    titel: t("ziel.vertraege3.titel"),
    beschreibung: t("ziel.vertraege3.beschreibung"),
    bereich: "aussen",
    pruefe: (w) => {
      const n = alleLaufenden(w).length;
      return { erreicht: n >= 3, stand: t("ziel.vertraege3.stand", { n }) };
    },
  },
  {
    id: "ansehen60",
    titel: t("ziel.ansehen60.titel"),
    beschreibung: t("ziel.ansehen60.beschreibung"),
    bereich: "aussen",
    pruefe: (w) => {
      const v = KNOTEN(w, "ansehen");
      return { erreicht: v >= 60, stand: t("ziel.stand_jetzt", { wert: Math.round(v) }) };
    },
  },
  {
    id: "rechtsstaat60",
    titel: t("ziel.rechtsstaat60.titel"),
    beschreibung: t("ziel.rechtsstaat60.beschreibung"),
    bereich: "staat",
    pruefe: (w) => {
      const v = KNOTEN(w, "justiz_unabhaengigkeit");
      return { erreicht: v >= 60, stand: t("ziel.stand_jetzt", { wert: Math.round(v) }) };
    },
  },
  {
    id: "ordnung",
    haltend: true,
    titel: t("ziel.ordnung.titel"),
    beschreibung: t("ziel.ordnung.beschreibung"),
    bereich: "staat",
    pruefe: (w) => {
      const terror = KNOTEN(w, "terrorgefahr");
      const krim = KNOTEN(w, "kriminalitaet");
      return { erreicht: terror <= 35 && krim <= 45, stand: t("ziel.ordnung.stand", { terror: Math.round(terror), krim: Math.round(krim) }) };
    },
  },
  {
    id: "wort",
    haltend: true,
    titel: t("ziel.wort.titel"),
    beschreibung: t("ziel.wort.beschreibung"),
    bereich: "staat",
    pruefe: (w) => {
      const g = zusagenBilanz(w).glaubwuerdigkeit;
      return { erreicht: g >= 70, stand: t("ziel.stand_jetzt", { wert: Math.round(g) }) };
    },
  },
  {
    id: "kabinett",
    haltend: true,
    titel: t("ziel.kabinett.titel"),
    beschreibung: t("ziel.kabinett.beschreibung"),
    bereich: "staat",
    pruefe: (w) => {
      const schwach = (w.spiel?.figuren ?? []).filter((f) => f.imAmt && f.loyalitaet < 30 && f.amt !== "opposition" && f.amt !== "partner" && f.amt !== "zentralbank").length;
      return { erreicht: schwach === 0, stand: schwach === 0 ? t("ziel.kabinett.stand_ok") : t("ziel.kabinett.stand_schwach", { n: schwach }) };
    },
  },
  {
    id: "nachfolge",
    titel: t("ziel.nachfolge.titel"),
    beschreibung: t("ziel.nachfolge.beschreibung"),
    bereich: "staat",
    nurLetzte: true,
    pruefe: (w) => {
      const n = w.spiel?.ende?.nachfolge;
      return { erreicht: n === "sieg", stand: n === "sieg" ? t("ziel.nachfolge.stand_sieg") : n === "niederlage" ? t("ziel.nachfolge.stand_niederlage") : t("ziel.nachfolge.stand_offen") };
    },
  },
);

// Bereich der ursprünglichen Ziele (für die Gruppierung in der Zielwahl)
const BEREICH_ALT: Record<string, NonNullable<ZielDef["bereich"]>> = {
  inflation15: "wirtschaft", arbeit8: "wirtschaft", schulden30: "wirtschaft",
  wasserstrom: "land", erdbeben: "land", wohnen: "land", aerzte: "land", strassen: "land",
  mehrheit: "staat", vertrauen60: "staat",
};
for (const z of ZIELE) if (!z.bereich && BEREICH_ALT[z.id]) z.bereich = BEREICH_ALT[z.id]!;

export interface ZielAngebot {
  def: ZielDef;
  /** Aktueller Stand zu Beginn (damit niemand ein Ziel wählt, das schon erreicht ist) */
  stand: string;
  erreicht: boolean;
}

/**
 * Die Ziele, die zur Wahl stehen: ohne die schon erreichten (ein Ziel, das beim Start erfüllt ist, misst nichts; Ausnahme sind Ziele, die etwas bewahren
 * sollen) und, außerhalb der letzten Amtszeit, ohne das Vermächtnis-Ziel. Mit dem Stand beim Angebot.
 */
export function zieleAngebot(w: World, letzteAmtszeit: boolean): ZielAngebot[] {
  return ZIELE.filter((z) => !z.nurLetzte || letzteAmtszeit).flatMap((def) => {
    const r = def.pruefe(w);
    return r.erreicht && !def.nurLetzte && !def.haltend ? [] : [{ def, stand: r.stand, erreicht: r.erreicht }];
  });
}

export function zielDef(id: string): ZielDef | undefined {
  return ZIELE.find((z) => z.id === id);
}

export function zielStand(w: World): { def: ZielDef; erreicht: boolean; stand: string }[] {
  return (w.spiel?.ziele ?? []).flatMap((id) => {
    const def = zielDef(id);
    if (!def) return [];
    const r = def.pruefe(w);
    return [{ def, ...r }];
  });
}
