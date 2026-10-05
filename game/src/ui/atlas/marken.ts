// Marken der Reich-Akten auf der Karte: Bauvorhaben, fertige Wunder und Großprojekte, Kulturerbe-Stätten. Jede Marke trägt alles, was die Tafel
// beim Überfahren braucht: Art in Worten, Name, Ort, Zustand oder Fortschritt, Restdauer, nächste Entscheidung und wohin ein Klick führt.
// Rein und ohne Browser prüfbar (die Texte kommen aus der Übersetzungsschicht, Katalog „karte“).

import { ERBE } from "../../data/erbe";
import { t } from "../../i18n";
import { kartenOrte, reichZustand, vorhabenDef } from "../../sim/reich";
import type { Vorhaben } from "../../sim/reich-typen";
import type { World } from "../../sim/types";
import type { Kartenebene } from "../ebenen";
import type { KartenOrt } from "./AtlasMap";

export type MarkenLage = "imBau" | "pausiert" | "fertig" | "verfallen" | "gefahr";

/** Schwellen des Zustands (0 bis 100) für fertige Stücke: darunter „verfällt“, darunter „in Gefahr“ (Spielparameter, wie die bisherige Grenze 40 der Stätten) */
export const ZUSTAND_VERFALL = 60;
export const ZUSTAND_GEFAHR = 40;

/** Lage einer Marke: im Bau (oder pausiert), fertig, verfällt oder in Gefahr. */
export function lageVon(art: "bau" | "wunder" | "erbe", zustand: number | undefined, pausiert = false): MarkenLage {
  if (art === "bau") return pausiert ? "pausiert" : "imBau";
  const z = zustand ?? 100;
  if (z < ZUSTAND_GEFAHR) return "gefahr";
  if (z < ZUSTAND_VERFALL) return "verfallen";
  return "fertig";
}

/** Rang bei Gedränge: Wer Aufmerksamkeit braucht, bleibt sichtbar, wenn Marken weit weg zusammenrücken. */
export function rangVon(art: "bau" | "wunder" | "erbe", lage: MarkenLage): number {
  if (lage === "gefahr") return 4;
  if (lage === "verfallen" || art === "bau") return 3;
  return art === "wunder" ? 2 : 1;
}

const klemme = (x: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, x));

/** Bereiche, in denen die Akte einen Reiter „Pflegen“ hat (siehe ui/Reich.tsx, Reiter „bestand“) */
const MIT_PFLEGE = new Set(["kultur", "infrastruktur", "militaer"]);

interface Eingabe {
  id: string;
  art: "bau" | "wunder" | "erbe";
  lon: number;
  lat: number;
  name: string;
  ortName?: string;
  zustand?: number;
  fortschritt?: number;
  restMonate?: number;
  vergabeTage?: number;
  pausiert?: boolean;
  bereich: string;
  dmax?: number;
}

function bauen(e: Eingabe): KartenOrt {
  const lage = lageVon(e.art, e.zustand, !!e.pausiert);
  const artText = t(`marken.art.${e.art}`);
  const lageText = t(e.art === "erbe" && lage === "fertig" ? "marken.lage.erhalten" : `marken.lage.${lage}`);
  const mitPflege = MIT_PFLEGE.has(e.bereich);
  let zeile: string;
  let rest: string | undefined;
  let naechste: string;
  let klickPflege = false;
  if (e.art === "bau") {
    zeile = `${lageText}: ${t("marken.fortschritt", { p: Math.round((e.fortschritt ?? 0) * 100) })}`;
    if (e.restMonate !== undefined) rest = t("marken.rest", { m: e.restMonate });
    naechste = e.pausiert ? t("marken.naechste.bau_pausiert") : e.vergabeTage && e.vergabeTage > 0 ? t("marken.naechste.bau_vergabe", { tage: e.vergabeTage }) : t("marken.naechste.bau_laeuft");
  } else {
    zeile = `${lageText}: ${t("marken.zustand", { z: Math.round(e.zustand ?? 0) })}`;
    if (lage === "gefahr") naechste = t("marken.naechste.restaurieren");
    else if (lage === "verfallen") naechste = t("marken.naechste.pflegen");
    else naechste = t(e.art === "erbe" ? "marken.naechste.erbe_ok" : "marken.naechste.fertig_ok");
    klickPflege = mitPflege && lage !== "fertig";
  }
  const klick = t(klickPflege ? "marken.klick.pflegen" : "marken.klick.lage");
  const beschreibung = t("marken.beschreibung", { art: artText, name: e.name, zeile: zeile + (rest ? `, ${rest}` : ""), naechste });
  return {
    id: e.id,
    lon: e.lon,
    lat: e.lat,
    art: e.art,
    text: beschreibung,
    ...(e.zustand !== undefined ? { zustand: e.zustand } : {}),
    ...(e.dmax !== undefined ? { dmax: e.dmax } : {}),
    name: e.name,
    ...(e.ortName ? { ortName: e.ortName } : {}),
    lage,
    artText,
    lageText,
    ...(e.art === "bau" ? { fortschritt: klemme(e.fortschritt ?? 0) } : {}),
    zeile,
    ...(rest ? { rest } : {}),
    naechste,
    klick,
    klickTab: klickPflege ? "bestand" : "lage",
    rang: rangVon(e.art, lage),
  };
}

/** Alle Marken der Reich-Akten: Stätten (in der Ebene „Kulturerbe“), Baustellen und fertige Wunder. */
export function reichMarken(w: World, ebene: Kartenebene): KartenOrt[] {
  if (!w.spiel) return [];
  // legt den Zustand des Reiches beim ersten Zugriff an (wie die Reich-Akte), damit auch ein frischer Stand Marken hat
  const z = reichZustand(w);
  const out: KartenOrt[] = [];
  if (ebene === "erbe") {
    for (const e of ERBE) {
      const zustand = z.staetten[e.id]?.zustand ?? 0;
      out.push(bauen({ id: `erbe:${e.id}`, art: "erbe", lon: e.lon, lat: e.lat, name: e.name, ortName: e.ort, zustand, bereich: "kultur", dmax: 15 }));
    }
  }
  // Katalog, freie Großprojekte und die für Provinzen angelegten Vorhaben mit Ort (sim/reich.ts)
  for (const o of kartenOrte(w)) {
    const id = o.id.startsWith("v:") ? o.id.slice(2) : o.id;
    const def: Vorhaben | undefined = vorhabenDef(id) ?? z.regional?.[id]?.def ?? z.frei?.[id]?.def;
    const name = def?.name ?? o.text.replace(/\s*\((fertig|im Bau)\)\s*$/, "");
    const bereich = def?.bereich ?? "infrastruktur";
    const ortName = def?.ort?.name;
    const laeuft = z.laufend.find((l) => l.id === id);
    if (o.art === "bau" || laeuft) {
      const gesamt = Math.max(1, laeuft?.bau ?? def?.kosten.bau ?? 1);
      const p = klemme((laeuft?.fortschritt ?? 0) / gesamt);
      const monate = laeuft?.monate ?? def?.kosten.monate;
      out.push(
        bauen({
          id: o.id,
          art: "bau",
          lon: o.lon,
          lat: o.lat,
          name,
          ...(ortName ? { ortName } : {}),
          fortschritt: p,
          ...(monate !== undefined ? { restMonate: Math.max(0, Math.ceil(monate * (1 - p))) } : {}),
          ...(laeuft?.vergabeBis !== undefined ? { vergabeTage: Math.max(0, laeuft.vergabeBis - w.day) } : {}),
          pausiert: !!laeuft?.pausiert,
          bereich,
        }),
      );
    } else {
      out.push(bauen({ id: o.id, art: "wunder", lon: o.lon, lat: o.lat, name, ...(ortName ? { ortName } : {}), zustand: z.bestand[id]?.zustand ?? 100, bereich }));
    }
  }
  return out;
}

/** Text einer Ereignis- oder Fristmarke (Titel, Frist in Tagen) über die Übersetzungsschicht. */
export const ereignisMarkenText = (titel: string, tage: number): string => t("marken.ereignis.text", { titel, tage });
