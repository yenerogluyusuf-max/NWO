// Färbung und Marken der Linsen „Ressourcen“ und „Strategische Orte“ (data/ressourcen.ts, data/strategie-orte.ts).
// Die Marken (Punkte mit Lage) sind für die Bühne vorbereitet; die Flächenfärbung trägt ui/ebenen.ts ein.

import { VORKOMMEN, type Vorkommen } from "../../data/ressourcen";
import { STRATEGIE_ORTE, type StrategieOrt } from "../../data/strategie-orte";
import type { GutId } from "../../data/gueter";
import type { Legende } from "../ebenen";
import { akteurDef, akteurName } from "../../sim/welt-modell";
import { t } from "../../i18n";

export type RohstoffKlasse = "bodenschatz" | "energie" | "wasser" | "agrar";

const KLASSE: Partial<Record<GutId, RohstoffKlasse>> = {
  bor: "bodenschatz", erze: "bodenschatz", stahl: "bodenschatz",
  kohle: "energie", erdoel: "energie", erdgas: "energie",
  wasser: "wasser", strom: "wasser",
  getreide: "agrar", obst_gemuese: "agrar", fleisch_milch: "agrar", zucker_oele: "agrar",
};

export const KLASSEN_FARBE: Record<RohstoffKlasse, [number, number, number]> = {
  bodenschatz: [184, 134, 52],
  energie: [58, 52, 48],
  wasser: [38, 90, 98],
  agrar: [96, 128, 62],
};

const PAPER: [number, number, number] = [236, 226, 200];
const rgb = (c: number[]): string => `rgb(${c.map(Math.round).join(",")})`;
const mische = (a: number[], b: number[], k: number): string => rgb(a.map((x, i) => x + (b[i]! - x) * k));

export function klasseVon(gut: GutId): RohstoffKlasse {
  return KLASSE[gut] ?? "bodenschatz";
}

/** Je Provinz das bedeutendste Vorkommen */
export function vorkommenJeProvinz(): Map<number, Vorkommen[]> {
  const m = new Map<number, Vorkommen[]>();
  for (const v of VORKOMMEN) {
    if (v.plaka === undefined) continue;
    const l = m.get(v.plaka) ?? [];
    l.push(v);
    m.set(v.plaka, l);
  }
  for (const l of m.values()) l.sort((a, b) => b.rang - a.rang);
  return m;
}

export function ressourcenFarben(): { fill: Record<number, string>; legende: Legende } {
  const fill: Record<number, string> = {};
  for (const [plaka, l] of vorkommenJeProvinz()) {
    const top = l[0]!;
    fill[plaka] = mische(PAPER, KLASSEN_FARBE[klasseVon(top.gut)], 0.35 + 0.2 * top.rang);
  }
  const ausland = VORKOMMEN.filter((v) => v.land && v.rang === 3).map((v) => v.ort.split(":")[0]);
  return {
    fill,
    legende: {
      titel: t("gueter.linse.ressourcen.titel"),
      untertitel: t("gueter.linse.ressourcen.untertitel"),
      eintraege: (Object.keys(KLASSEN_FARBE) as RohstoffKlasse[]).map((k) => ({ farbe: rgb(KLASSEN_FARBE[k]), text: t(`gueter.klasse.${k}`) })),
      hinweis: t("gueter.linse.ressourcen.hinweis", { ausland: ausland.join(", ") }),
    },
  };
}

export function strategieFarben(): { fill: Record<number, string>; legende: Legende } {
  const fill: Record<number, string> = {};
  const rang = new Map<number, number>();
  for (const o of STRATEGIE_ORTE) if (o.plaka !== undefined) rang.set(o.plaka, Math.max(rang.get(o.plaka) ?? 0, o.rang));
  for (const [plaka, r] of rang) fill[plaka] = mische(PAPER, [150, 44, 36], 0.25 + 0.22 * r);
  const draussen = STRATEGIE_ORTE.filter((o) => o.plaka === undefined && o.rang === 3).map((o) => o.name);
  return {
    fill,
    legende: {
      titel: t("gueter.linse.strategie.titel"),
      untertitel: t("gueter.linse.strategie.untertitel"),
      verlauf: { von: mische(PAPER, [150, 44, 36], 0.47), bis: mische(PAPER, [150, 44, 36], 0.91), vonText: t("gueter.linse.strategie.wichtig"), bisText: t("gueter.linse.strategie.entscheidend") },
      hinweis: t("gueter.linse.strategie.hinweis", { orte: draussen.join(", ") }),
    },
  };
}

/** Eine Marke der Linsen „Ressourcen“ und „Strategische Orte“ für die Karte (ui/atlas/AtlasMap.tsx, Eigenschaft `fundorte`). */
export interface KartenMarke {
  id: string;
  /** Punkt (Vorkommen) oder Raute (strategischer Ort) */
  form: "punkt" | "raute";
  lon: number;
  lat: number;
  rang: 1 | 2 | 3;
  farbe: string;
  /** Zeile über dem Namen in der Tafel: Art und Bedeutung */
  artText: string;
  titel: string;
  /** Warum es zählt, in einem Satz */
  text: string;
  /** Was es im Spiel bewirkt oder wer es kontrolliert */
  zusatz?: string;
  /** Klick: Provinz im Land oder Länderkarte */
  plaka?: number;
  iso?: string;
  klick: string;
}

function landName(id: string): string {
  if (id === "TUR") return t("fundorte.ort.tuerkei");
  try {
    return akteurName(id);
  } catch {
    return id;
  }
}
function landIso(id: string): string | undefined {
  try {
    return akteurDef(id).iso;
  } catch {
    return id.length === 3 ? id : undefined;
  }
}

/** Marken für die Ressourcenlinse, im Land und bei den Nachbarn */
export function ressourcenMarken(): KartenMarke[] {
  return VORKOMMEN.map((v) => {
    const inland = v.plaka !== undefined && !v.land;
    return {
      id: `vk:${v.id}`, form: "punkt" as const, lon: v.lon, lat: v.lat, rang: v.rang,
      farbe: rgb(KLASSEN_FARBE[klasseVon(v.gut)]),
      artText: t("fundorte.vorkommen.art", { gut: t(`gueter.gut.${v.gut}`), rang: t(`fundorte.rang.${v.rang}`) }),
      titel: t(`fundorte.vorkommen.${v.id}`),
      text: inland ? t("fundorte.vorkommen.inland") : t("fundorte.vorkommen.ausland", { land: landName(v.land ?? "") }),
      ...(inland ? { plaka: v.plaka } : v.land ? { iso: landIso(v.land) } : {}),
      klick: t(inland ? "fundorte.klick.provinz" : "fundorte.klick.land"),
    };
  });
}

/** Marken für die Strategielinse: warum der Ort zählt, wer ihn hält und was er im Spiel bewirkt */
export function strategieMarken(): KartenMarke[] {
  return STRATEGIE_ORTE.map((o: StrategieOrt) => ({
    id: `so:${o.id}`, form: "raute" as const, lon: o.lon, lat: o.lat, rang: o.rang,
    farbe: o.kontrolle === "TUR" ? "rgb(150,44,36)" : "rgb(70,62,96)",
    artText: `${t(`fundorte.art.${o.art}`)} · ${t("fundorte.ort.kontrolle", { land: landName(o.kontrolle) })}`,
    titel: t(`fundorte.ort.${o.id}.name`),
    text: t(`fundorte.ort.${o.id}.warum`),
    zusatz: `${t("fundorte.ort.im_spiel")}: ${t(`fundorte.ort.${o.id}.wirkung`)}`,
    ...(o.plaka !== undefined ? { plaka: o.plaka } : { iso: landIso(o.kontrolle) }),
    klick: t(o.plaka !== undefined ? "fundorte.klick.provinz" : "fundorte.klick.land"),
  }));
}
