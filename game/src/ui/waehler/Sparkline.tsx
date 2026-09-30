// Verlaufslinie der Stimmung: Ruhelinie bei 50, Marken für Beschlüsse, letzter Wert hervorgehoben, Pfeil zum Gleichgewicht.
// Gezeichnet in echten Pixeln der gemessenen Breite, damit nichts verzerrt.

import { useEffect, useId, useRef, useState } from "react";
import type { Marke } from "../../sim/waehler-verlauf";
import { monatText, nf } from "./format";

export interface SparkProps {
  monate: string[];
  werte: (number | null)[];
  marken?: Marke[];
  /** Wohin die Größe bei heutigen Verhältnissen strebt (Pfeil am rechten Ende) */
  ziel?: number;
  hoehe?: number;
  beschriftung: string;
  einheit?: string;
}

function useBreite(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [b, setB] = useState(320);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const messen = () => setB(Math.max(120, Math.round(el.getBoundingClientRect().width)));
    messen();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(messen);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, b];
}

export function Sparkline({ monate, werte, marken = [], ziel, hoehe = 76, beschriftung, einheit = "" }: SparkProps) {
  const id = useId();
  const [ref, B] = useBreite();
  const H = hoehe;
  const rand = { l: 3, r: 10, o: 10, u: 4 };
  const gueltig = werte.filter((v): v is number => v !== null && Number.isFinite(v));
  if (gueltig.length < 2) {
    return (
      <div ref={ref}>
        <p className="wa-spark-leer" role="img" aria-label={beschriftung}>
          Noch zu wenig Verlauf: Die Linie entsteht, sobald ein paar Monate vergangen sind.
        </p>
      </div>
    );
  }
  const unten = Math.min(35, Math.floor(Math.min(...gueltig, ziel ?? 99) - 3));
  const oben = Math.max(65, Math.ceil(Math.max(...gueltig, ziel ?? 0) + 3));
  const n = werte.length;
  const x = (i: number) => rand.l + (i / Math.max(1, n - 1)) * (B - rand.l - rand.r);
  const y = (v: number) => rand.o + (1 - (v - unten) / (oben - unten)) * (H - rand.o - rand.u);
  const pfad: string[] = [];
  let offen = false;
  werte.forEach((v, i) => {
    if (v === null || !Number.isFinite(v)) {
      offen = false;
      return;
    }
    pfad.push(`${offen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    offen = true;
  });
  const letzter = n - 1;
  const lv = werte[letzter];
  const erster = werte.findIndex((v) => v !== null);
  const flaeche = `${pfad.join(" ")} L${x(letzter).toFixed(1)},${y(50).toFixed(1)} L${x(erster).toFixed(1)},${y(50).toFixed(1)} Z`;
  const mark = marken.map((m) => ({ ...m, i: monate.indexOf(m.monat) })).filter((m) => m.i >= 0);
  return (
    <div ref={ref} className="wa-spark-box">
      <svg className="wa-spark" width={B} height={H} viewBox={`0 0 ${B} ${H}`} role="img" aria-label={beschriftung}>
        <defs>
          <clipPath id={`${id}-o`}>
            <rect x="0" y="0" width={B} height={y(50)} />
          </clipPath>
          <clipPath id={`${id}-u`}>
            <rect x="0" y={y(50)} width={B} height={H - y(50)} />
          </clipPath>
        </defs>
        <line x1={rand.l} x2={B - rand.r} y1={y(50)} y2={y(50)} className="wa-spark-ruhe" />
        <path d={flaeche} className="wa-spark-plus" clipPath={`url(#${id}-o)`} />
        <path d={flaeche} className="wa-spark-minus" clipPath={`url(#${id}-u)`} />
        {mark.map((m) => (
          <g key={`${m.monat}-${m.text}`} className="wa-spark-marke">
            <line x1={x(m.i)} x2={x(m.i)} y1={rand.o - 3} y2={H - rand.u} />
            <circle cx={x(m.i)} cy={rand.o - 3} r="3" />
            <title>{`${monatText(m.monat)}: ${m.text} beschlossen`}</title>
          </g>
        ))}
        <path d={pfad.join(" ")} className="wa-spark-linie" />
        {ziel !== undefined && lv !== null && lv !== undefined && Math.abs(ziel - lv) >= 1.5 && (
          <g className="wa-spark-ziel">
            <line x1={x(letzter)} y1={y(lv)} x2={x(letzter)} y2={y(ziel)} />
            <path d={`M${x(letzter) - 4},${y(ziel)} L${x(letzter) + 4},${y(ziel)} L${x(letzter)},${y(ziel) + (ziel < lv ? 6 : -6)} Z`} />
            <title>{`Strebt bei heutigen Verhältnissen nach ${nf(ziel, 0)}${einheit}`}</title>
          </g>
        )}
        {lv !== null && lv !== undefined && <circle cx={x(letzter)} cy={y(lv)} r="3.6" className="wa-spark-punkt" />}
      </svg>
      <div className="wa-spark-achse">
        <span>{monatText(monate[0]!)}</span>
        <span>{monatText(monate[letzter]!)}</span>
      </div>
    </div>
  );
}
