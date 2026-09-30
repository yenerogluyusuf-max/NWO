// Ziele des Präsidenten (Agenda): Am ersten Tag werden drei gewählt, die Bilanz misst sie am Ende.
// Jedes Ziel ist messbar und nennt seinen aktuellen Stand.

import { NET } from "./modell";
import { nationalAverage, PROVINCES } from "./netz";
import { stimmenSicht } from "./handeln";
import type { World } from "./types";

export interface ZielDef {
  id: string;
  titel: string;
  beschreibung: string;
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
    titel: "Inflation unter 15 Prozent",
    beschreibung: "Die veröffentlichte Inflation liegt zum Ende der Amtszeit unter 15 %.",
    pruefe: (w) => ({ erreicht: w.published.inflation.value < 15, stand: `jetzt ${nf(w.published.inflation.value)} %` }),
  },
  {
    id: "arbeit8",
    titel: "Arbeitslosigkeit unter 8 Prozent",
    beschreibung: "Die Arbeitslosenquote liegt zum Ende unter 8 %.",
    pruefe: (w) => ({ erreicht: w.economy.unemployment < 8, stand: `jetzt ${nf(w.economy.unemployment)} %` }),
  },
  {
    id: "schulden30",
    titel: "Schuldenquote unter 30 Prozent",
    beschreibung: "Die Staatsschulden liegen zum Ende unter 30 % des BIP.",
    pruefe: (w) => ({ erreicht: w.economy.debtRatio < 30, stand: `jetzt ${nf(w.economy.debtRatio)} %` }),
  },
  {
    id: "wasserstrom",
    titel: "Wasser und Strom sichern",
    beschreibung: "Kein akuter Wassermangel und keine akuten Stromausfälle in irgendeiner Provinz.",
    pruefe: (w) => {
      const n = akutAnzahl(w, "p_wassermangel") + akutAnzahl(w, "p_stromausfaelle");
      return { erreicht: n === 0, stand: n === 0 ? "in keiner Provinz akut" : `noch in ${n} Fällen akut` };
    },
  },
  {
    id: "erdbeben",
    titel: "Erdbebensicher bauen",
    beschreibung: "Die Erdbebengefahr ist in höchstens 5 Provinzen akut.",
    pruefe: (w) => {
      const n = akutAnzahl(w, "p_erdbebengefahr");
      return { erreicht: n <= 5, stand: `akut in ${n} Provinzen` };
    },
  },
  {
    id: "wohnen",
    titel: "Wohnungsnot beenden",
    beschreibung: "Die Wohnungsnot ist in keiner Provinz akut.",
    pruefe: (w) => {
      const n = akutAnzahl(w, "p_wohnungsnot");
      return { erreicht: n === 0, stand: n === 0 ? "in keiner Provinz akut" : `akut in ${n} Provinzen` };
    },
  },
  {
    id: "aerzte",
    titel: "Ärzte für alle Provinzen",
    beschreibung: "Der Ärztemangel ist in keiner Provinz akut.",
    pruefe: (w) => {
      const n = akutAnzahl(w, "p_aerztemangel");
      return { erreicht: n === 0, stand: n === 0 ? "in keiner Provinz akut" : `akut in ${n} Provinzen` };
    },
  },
  {
    id: "strassen",
    titel: "Keine abgehängte Provinz",
    beschreibung: "Das Straßennetz liegt in jeder Provinz mindestens auf Stufe 45.",
    pruefe: (w) => {
      const m = minimum(w, "verkehrsnetz");
      return { erreicht: m >= 45, stand: `schwächste Provinz: Stufe ${nf(m)}` };
    },
  },
  {
    id: "mehrheit",
    titel: "Regierungsmehrheit halten",
    beschreibung: "Das Regierungslager hat am Ende mindestens 301 Sitze.",
    pruefe: (w) => {
      const s = stimmenSicht(w);
      return { erreicht: s.lager >= 301, stand: `${s.lager} von 600 Sitzen` };
    },
  },
  {
    id: "vertrauen60",
    titel: "Vertrauen gewinnen",
    beschreibung: "Das mittlere Vertrauen in die Regierung liegt am Ende bei mindestens 60.",
    pruefe: (w) => {
      const v = nationalAverage(NET, w.net, "vertrauen_regierung");
      return { erreicht: v >= 60, stand: `jetzt ${nf(v)}` };
    },
  },
];

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
