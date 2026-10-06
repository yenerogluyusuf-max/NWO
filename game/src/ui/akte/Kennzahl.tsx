// Bausteine des Akten-Gerüsts: kleine Verlaufslinie, Kennzahlkarte mit Verlauf, Verlaufsdiagramm.

import { aktuelleLocale, t } from "../../i18n";

/** Kleine Verlaufslinie ohne Achsen. */
export function Funke({ werte, breite = 120, hoehe = 28 }: { werte: number[]; breite?: number; hoehe?: number }) {
  if (werte.length < 2) return null;
  const min = Math.min(...werte);
  const max = Math.max(...werte);
  const span = max - min || 1;
  const pts = werte.map((v, i) => `${((i / (werte.length - 1)) * breite).toFixed(1)},${(hoehe - 2 - ((v - min) / span) * (hoehe - 4)).toFixed(1)}`).join(" ");
  return (
    <svg className="ak-funke" width={breite} height={hoehe} viewBox={`0 0 ${breite} ${hoehe}`} aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export interface VerlaufsReihe {
  id: string;
  name: string;
  einheit: string;
  /** Werte je Monat, älteste zuerst */
  werte: number[];
  monate: string[];
  stellen?: number;
}

const nf = (x: number, d = 1) => x.toLocaleString(aktuelleLocale(), { minimumFractionDigits: d, maximumFractionDigits: d });

/** Ein Verlaufsdiagramm mit Achsen, erstem und letztem Wert und Spanne. */
export function VerlaufsDiagramm({ reihe }: { reihe: VerlaufsReihe }) {
  const B = 420;
  const H = 120;
  const w = reihe.werte;
  if (w.length < 2) return <p className="ak-leer">{t("akte.verlauf.zuWenig", { name: reihe.name })}</p>;
  const min = Math.min(...w);
  const max = Math.max(...w);
  const span = max - min || 1;
  const x = (i: number) => 34 + (i / (w.length - 1)) * (B - 44);
  const y = (v: number) => 8 + (1 - (v - min) / span) * (H - 28);
  const pts = w.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const d = reihe.stellen ?? 1;
  return (
    <figure className="ak-diagramm">
      <figcaption>
        <b>{reihe.name}</b>
        <span>
          {nf(w[0]!, d)} → <strong>{nf(w[w.length - 1]!, d)}</strong> {reihe.einheit}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${B} ${H}`} role="img" aria-label={t("ui2.ui.akte.Kennzahl.7939c78", { p0: reihe.name, p1: nf(w[0]!, d), p2: nf(w[w.length - 1]!, d), p3: reihe.einheit })}>
        <line x1={34} x2={B - 10} y1={y(max)} y2={y(max)} className="ak-gitter" />
        <line x1={34} x2={B - 10} y1={y(min)} y2={y(min)} className="ak-gitter" />
        <text x={30} y={y(max) + 4} textAnchor="end" className="ak-achse">{nf(max, d)}</text>
        <text x={30} y={y(min) + 4} textAnchor="end" className="ak-achse">{nf(min, d)}</text>
        <polyline points={pts} className="ak-linie" />
        <text x={34} y={H - 4} className="ak-achse">{reihe.monate[0]}</text>
        <text x={B - 10} y={H - 4} textAnchor="end" className="ak-achse">{reihe.monate[reihe.monate.length - 1]}</text>
      </svg>
    </figure>
  );
}
