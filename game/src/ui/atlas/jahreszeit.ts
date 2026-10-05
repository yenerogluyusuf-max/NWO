// Jahreszeit der Karte aus dem Spieldatum: Winterschnee, Frühlingsgrün, Wärme des Lichts, Richtung der Strömung. Rein und ohne Browser prüfbar.
// Alle Verläufe sind Gestaltungswerte, keine Messdaten (Schnee im Winter, Grün im Frühling: nach dem Eindruck, nicht nach einem Klimamodell).

import type { Effektstufe } from "../anim/effekte";
import { klemme } from "../anim/easing";
import type { AtlasEffekt } from "./scene";

/** Tag im Jahr (1 bis 366) aus einem ISO-Datum; unlesbar: 1. Juli (Sommermitte) */
export function tagImJahr(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return 182;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const j0 = Date.UTC(Number(m[1]), 0, 1);
  return Math.round((t - j0) / 86_400_000) + 1;
}

export interface JahreszeitWerte {
  /** 0 bis 1: Schneegrenze sinkt (Höhepunkt Mitte Januar, Dezember bis Februar kräftig) */
  winter: number;
  /** 0 bis 1: frisches Grün (Höhepunkt Ende April) */
  fruehling: number;
  /** −1 (Winter, kühles Licht) bis 1 (Sommer, warmes Licht) */
  waerme: number;
  /** Richtung der Strömung im Wasser in Bogenmaß; wechselt langsam mit dem Jahr */
  stroemung: number;
}

export function jahreszeit(iso: string): JahreszeitWerte {
  const d = tagImJahr(iso);
  const phase = (2 * Math.PI * (d - 15)) / 365;
  const winter = klemme(1.5 * Math.cos(phase) - 0.25);
  const fruehling = Math.exp(-(((d - 118) / 32) ** 2));
  return { winter, fruehling, waerme: -Math.cos(phase), stroemung: 0.6 + 0.55 * Math.sin((2 * Math.PI * d) / 365) };
}

/** Werte für den Gelände-Shader zu einer Effektstufe und einem Datum. */
export function effektFuer(stufe: Effektstufe, datum: string): AtlasEffekt {
  if (stufe === "aus") return { stufe: 0, winter: 0, fruehling: 0, waerme: 0, wolken: 0, stroemung: 0.6 };
  const j = jahreszeit(datum);
  return {
    stufe: stufe === "hoch" ? 2 : 1,
    winter: j.winter,
    fruehling: j.fruehling,
    waerme: stufe === "hoch" ? j.waerme : 0,
    wolken: stufe === "hoch" ? 1 : 0,
    stroemung: j.stroemung,
  };
}
