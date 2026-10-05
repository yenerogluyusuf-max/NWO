// Städte als Kartenobjekte: Für jede der 81 Provinzen ein Banner mit Name, Größenzeichen, Streifen in der Farbe der Bürgermeisterpartei,
// Statussymbolen (Ereignis, Frist, Krise, Bau) und der Tafel beim Überfahren (Einwohner, Rathaus, wichtigste akute Lage, Zustimmung vor Ort,
// offene Vorhaben). Dieses Modul rechnet alles aus dem Spielstand und liefert fertig übersetzte Texte; gezeichnet wird in AtlasMap.tsx.
// Rein und ohne Browser prüfbar.

import { t, zahl } from "../../i18n";
import { NET } from "../../sim/world";
import { PROVINCES } from "../../sim/netz";
import { PROVINZEN } from "../../sim/regional";
import { PARTEI_NAME } from "../../sim/fraktionen";
import { reichZustand, vorhabenDef } from "../../sim/reich";
import type { World } from "../../sim/types";
import { PARTY_COLORS } from "../Parliament";

export type StadtArt = "hauptstadt" | "metropole" | "stadt";

/** Ab dieser Einwohnerzahl zeigt die Karte die Provinz als Großstadt (Spielparameter: Größenklassen der Figuren) */
export const METROPOLE_AB = 1_800_000;

export interface StadtStatus {
  ereignis: boolean;
  frist: boolean;
  krise: boolean;
  bau: boolean;
}

export interface StadtInfo {
  plaka: number;
  name: string;
  art: StadtArt;
  einwohner: number;
  /** Einwohner in Millionen mit einer Nachkommastelle, in der Schreibweise der Sprache: das Größenzeichen im Banner */
  groesse: string;
  partei: string;
  parteiFarbe: string;
  /** Rang bei Gedränge: größere und wichtigere Städte bleiben sichtbar */
  rang: number;
  status: StadtStatus;
  /** Fertig übersetzte Zeilen der Tafel */
  artText: string;
  einwohnerText: string;
  rathausText: string;
  lageText: string;
  zustimmungText?: string;
  vorhabenText: string;
  klick: string;
  /** Satz für Screenreader */
  beschreibung: string;
}

export function stadtArt(plaka: number): StadtArt {
  if (plaka === 6) return "hauptstadt";
  return (PROVINZEN[plaka - 1]?.bevoelkerung ?? 0) >= METROPOLE_AB ? "metropole" : "stadt";
}

const klemme = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

/** Vorhaben, die gerade in dieser Provinz laufen (Katalog, Regionalprogramme und freie Großprojekte) */
function vorhabenJeProvinz(w: World): number[] {
  const z = reichZustand(w);
  const n = new Array<number>(PROVINCES).fill(0);
  for (const l of z.laufend) {
    const def = vorhabenDef(l.id) ?? z.regional?.[l.id]?.def ?? z.frei?.[l.id]?.def;
    const orte = new Set<number>([...(def?.provinzen ?? []), ...(def?.ort ? [def.ort.plaka] : [])]);
    for (const p of orte) if (p >= 1 && p <= PROVINCES) n[p - 1]!++;
  }
  return n;
}

/** Alle 81 Stadtobjekte; `marken` sind die Ereignis-, Frist- und Krisenmarken der Karte (Stage.tsx). */
export function stadtInfos(w: World, marken: { plaka: number; art: string }[] = []): Record<number, StadtInfo> {
  const ev = new Set<number>();
  const frist = new Set<number>();
  for (const m of marken) {
    if (m.art === "frist") frist.add(m.plaka);
    else if (m.art === "ereignis") ev.add(m.plaka);
  }
  // Wichtigste akute Lage je Provinz: das Problem mit dem größten Abstand über seiner Schwelle
  const top: ({ name: string; mehr: number } | null)[] = new Array(PROVINCES).fill(null);
  const exzess: number[] = new Array(PROVINCES).fill(-Infinity);
  const anzahl: number[] = new Array(PROVINCES).fill(0);
  for (const n of NET.nodes) {
    if (n.kind !== "problem" || !n.threshold) continue;
    const i = NET.index.get(n.id)!;
    for (let p = 0; p < PROVINCES; p++) {
      const v = w.net.values[i * PROVINCES + p]!;
      if (v < n.threshold) continue;
      anzahl[p]!++;
      const e = (v - n.threshold) / Math.max(1, 100 - n.threshold);
      if (e > exzess[p]!) {
        exzess[p] = e;
        top[p] = { name: n.name, mehr: 0 };
      }
    }
  }
  const vi = NET.index.get("vertrauen_regierung");
  const bau = vorhabenJeProvinz(w);
  const out: Record<number, StadtInfo> = {};
  for (let plaka = 1; plaka <= PROVINCES; plaka++) {
    const d = PROVINZEN[plaka - 1]!;
    const art = stadtArt(plaka);
    const p = plaka - 1;
    const parteiKurz = d.buergermeister2024;
    const partei = PARTEI_NAME[parteiKurz] ?? parteiKurz;
    const lage = top[p];
    const status: StadtStatus = { ereignis: ev.has(plaka), frist: frist.has(plaka), krise: anzahl[p]! > 0, bau: bau[p]! > 0 };
    const lageText = lage
      ? anzahl[p]! > 1
        ? t("stadt.lage_mehr", { problem: lage.name, n: anzahl[p]! - 1 })
        : t("stadt.lage", { problem: lage.name })
      : t("stadt.lage_keine");
    const zust = vi !== undefined ? klemme(w.net.values[vi * PROVINCES + p]!, 0, 100) : undefined;
    const artText = t(`stadt.art.${art}`);
    const einwohnerText = t("stadt.einwohner", { n: d.bevoelkerung });
    const rathausText = t("stadt.rathaus", { partei });
    const zustimmungText = zust !== undefined ? t("stadt.zustimmung", { z: Math.round(zust) }) : undefined;
    const vorhabenText = t("stadt.vorhaben", { n: bau[p]! });
    // Rang: Hauptstadt vor allem, dann Provinzen mit offenen Entscheidungen, dann nach Einwohnern
    const rang = d.bevoelkerung / 1000 + (plaka === 6 ? 1e7 : 0) + (status.frist ? 4e5 : 0) + (status.ereignis ? 2e5 : 0);
    out[plaka] = {
      plaka,
      name: d.name,
      art,
      einwohner: d.bevoelkerung,
      groesse: zahl(d.bevoelkerung / 1_000_000, 1),
      partei: parteiKurz,
      parteiFarbe: PARTY_COLORS[parteiKurz] ?? "#8a7a64",
      rang,
      status,
      artText,
      einwohnerText,
      rathausText,
      lageText,
      ...(zustimmungText ? { zustimmungText } : {}),
      vorhabenText,
      klick: t("stadt.klick"),
      beschreibung: t("stadt.beschreibung", {
        name: d.name,
        art: artText,
        einwohner: einwohnerText,
        rathaus: rathausText,
        lage: lageText,
        zustimmung: zustimmungText ?? "",
        vorhaben: vorhabenText,
      }),
    };
  }
  return out;
}
