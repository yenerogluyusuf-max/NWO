// Baustein „Tacho“ (PLAN_OBERFLAECHE_DETAIL Teil 1, Q3): ein Halbkreis mit Zielband und Zeiger, für Größen mit einem Sollbereich
// (Inflation, Wachstum, Arbeitslosigkeit, Lira). Der Zeiger steht außerhalb des Bands rot (rot heißt schlechter), im Band dunkel.
// Nur Anzeige; ein Klick führt über `onKlick` zum Verlauf.

import { t } from "../../i18n";
import { bogen } from "./Rad";
import "./bausteine.css";

export interface TachoProps {
  titel: string;
  wert: number;
  /** Anzeige des Werts (etwa „34,9 %“) */
  text: string;
  min: number;
  max: number;
  /** Zielband [von, bis] in der Einheit des Werts */
  band?: [number, number];
  bandText?: [string, string];
  onKlick?: () => void;
}

/** Winkel auf dem Halbkreis: min links (−90°), max rechts (+90°), Werte außerhalb an den Rand geklemmt. */
export function tachoWinkel(wert: number, min: number, max: number): number {
  const a = max > min ? (Math.min(max, Math.max(min, wert)) - min) / (max - min) : 0.5;
  return -Math.PI / 2 + a * Math.PI;
}

export const imBand = (wert: number, band?: [number, number]): boolean => !band || (wert >= band[0] && wert <= band[1]);

export function Tacho(p: TachoProps) {
  const w = tachoWinkel(p.wert, p.min, p.max);
  const gut = imBand(p.wert, p.band);
  const zx = 100 + 74 * Math.sin(w);
  const zy = 100 - 74 * Math.cos(w);
  const inhalt = (
    <svg viewBox="0 0 200 118" role="img" aria-label={p.band ? t("bs.tacho.aria", { titel: p.titel, wert: p.text, von: p.bandText?.[0] ?? String(p.band[0]), bis: p.bandText?.[1] ?? String(p.band[1]) }) : `${p.titel}: ${p.text}`}>
      <path d={bogen(100, 100, 70, 86, -Math.PI / 2, Math.PI / 2)} className="bs-tacho-skala" />
      {p.band && <path d={bogen(100, 100, 70, 86, tachoWinkel(p.band[0], p.min, p.max), tachoWinkel(p.band[1], p.min, p.max))} className="bs-tacho-band" />}
      <line x1="100" y1="100" x2={zx.toFixed(1)} y2={zy.toFixed(1)} className={`bs-tacho-zeiger${gut ? "" : " schlecht"}`} />
      <circle cx="100" cy="100" r="5" className={`bs-tacho-nabe${gut ? "" : " schlecht"}`} />
    </svg>
  );
  const kopf = (
    <>
      <span className="bs-tacho-titel">{p.titel}</span>
      <b className={`bs-tacho-wert${gut ? "" : " schlecht"}`}>{p.text}</b>
      {p.band && <small>{t("bs.tacho.ziel", { von: p.bandText?.[0] ?? String(p.band[0]), bis: p.bandText?.[1] ?? String(p.band[1]) })}</small>}
    </>
  );
  return p.onKlick ? (
    <button type="button" className="bs-tacho" onClick={p.onKlick}>
      {inhalt}
      {kopf}
    </button>
  ) : (
    <figure className="bs-tacho">
      {inhalt}
      <figcaption>{kopf}</figcaption>
    </figure>
  );
}
