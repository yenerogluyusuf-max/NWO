// Zeitreihen-Diagramm der Wirtschaftsakte: Verlauf seit Spielbeginn, Prognoseband (ohne und mit einer Handlung), Schwellenlinien und
// Marken für Zinsentscheide, Haushaltsänderungen, Eingriffe und Ereignisse. Reines SVG, keine Bibliothek.

import { useEffect, useMemo, useRef, useState } from "react";
import type { Punkt } from "../../sim/wirtschaft";
import type { Marke } from "../../sim/wirtschaft-typen";
import type { Linie } from "../../sim/wirtschaft-kennzahlen";
import type { Band } from "../../sim/forecast";
import "./wirtschaft.css";

export interface DiagrammBand {
  ohne: Band[];
  mit?: Band[];
  mitName?: string;
}

interface Props {
  punkte: Punkt[];
  startMonat: string;
  jetztMonat: string;
  band?: DiagrammBand | undefined;
  linien?: Linie[] | undefined;
  marken?: Marke[] | undefined;
  stellen: number;
  einheit: string;
  name: string;
  /** Die Prognose wird noch gerechnet */
  rechnet?: boolean | undefined;
}

const MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const mi = (m: string) => Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1;
const kurz = (i: number) => `${MONATE[i % 12]} ${String(Math.floor(i / 12)).slice(2)}`;
const lang = (i: number) => `${MONATE[i % 12]} ${Math.floor(i / 12)}`;

function niceTicks(min: number, max: number, n = 5): number[] {
  const span = max - min || 1;
  const roh = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(roh)));
  const norm = roh / mag;
  const schritt = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(min / schritt) * schritt; v <= max + 1e-9; v += schritt) out.push(Math.round(v / schritt) * schritt);
  return out;
}

const ARTEN: Record<Marke["art"], string> = { zins: "Zinsentscheid", haushalt: "Haushalt", eingriff: "Eingriff", ereignis: "Ereignis" };

function Symbol({ art, x, y }: { art: Marke["art"]; x: number; y: number }) {
  switch (art) {
    case "zins":
      return <rect x={x - 3.5} y={y - 3.5} width={7} height={7} className="wi-marke wi-m-zins" />;
    case "haushalt":
      return <path d={`M${x} ${y - 4.5} L${x + 4.5} ${y} L${x} ${y + 4.5} L${x - 4.5} ${y} Z`} className="wi-marke wi-m-haushalt" />;
    case "eingriff":
      return <circle cx={x} cy={y} r={3.6} className="wi-marke wi-m-eingriff" />;
    default:
      return <path d={`M${x} ${y - 4.5} L${x + 4.2} ${y + 3.5} L${x - 4.2} ${y + 3.5} Z`} className="wi-marke wi-m-ereignis" />;
  }
}

export function Diagramm({ punkte, startMonat, jetztMonat, band, linien = [], marken = [], stellen, einheit, name, rechnet }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [breite, setBreite] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const messen = () => setBreite(Math.max(260, Math.round(el.clientWidth)));
    messen();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(messen);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const nf = (x: number, d = stellen) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });

  const g = useMemo(() => {
    const hoehe = breite < 480 ? 230 : 290;
    const rand = { l: breite < 480 ? 40 : 50, r: 14, t: 18, b: 30 + (marken.length ? 18 : 0) };
    const jetztI = mi(jetztMonat);
    const bandLaenge = band?.ohne.length ?? 0;
    const startI = punkte.length ? mi(punkte[0]!.monat) : jetztI;
    const endI = Math.max(punkte.length ? mi(punkte[punkte.length - 1]!.monat) : jetztI, jetztI + bandLaenge);
    let lo = Infinity;
    let hi = -Infinity;
    const nimm = (v: number) => {
      if (!Number.isFinite(v)) return;
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    };
    punkte.forEach((p) => nimm(p.wert));
    band?.ohne.forEach((b) => (nimm(b.low), nimm(b.high)));
    band?.mit?.forEach((b) => (nimm(b.low), nimm(b.high)));
    const spanDaten = hi - lo || Math.abs(hi) * 0.1 || 1;
    // Linien zählen nur mit, wenn sie nah an den Daten liegen; sonst würden sie den Ausschnitt sprengen
    const sichtbareLinien = linien.filter((l) => l.wert >= lo - spanDaten * 0.6 && l.wert <= hi + spanDaten * 0.6);
    sichtbareLinien.forEach((l) => nimm(l.wert));
    const span = hi - lo || 1;
    lo -= span * 0.08;
    hi += span * 0.08;
    const iw = breite - rand.l - rand.r;
    const ih = hoehe - rand.t - rand.b;
    const x = (i: number) => rand.l + ((i - startI) / Math.max(1, endI - startI)) * iw;
    const y = (v: number) => rand.t + ih - ((v - lo) / (hi - lo)) * ih;
    const ticksY = niceTicks(lo, hi, breite < 480 ? 4 : 5);
    const gesamt = endI - startI;
    const proTick = Math.max(1, Math.floor(gesamt / Math.max(2, Math.floor(iw / 70))));
    const schritt = [1, 2, 3, 6, 12, 24].find((s) => s >= proTick) ?? 24;
    const ticksX: number[] = [];
    for (let i = Math.ceil(startI / schritt) * schritt; i <= endI; i += schritt) ticksX.push(i);
    return { hoehe, rand, jetztI, startI, endI, lo, hi, iw, ih, x, y, ticksY, ticksX, sichtbareLinien, bandLaenge };
  }, [breite, punkte, band, linien, marken.length, jetztMonat]);

  const linie = punkte.map((p) => `${g.x(mi(p.monat)).toFixed(1)},${g.y(p.wert).toFixed(1)}`).join(" ");
  const letzter = punkte[punkte.length - 1];

  const bandPfad = (b: Band[]) => {
    const oben = b.map((v, k) => `${g.x(g.jetztI + 1 + k).toFixed(1)},${g.y(v.high).toFixed(1)}`);
    const unten = b.map((v, k) => `${g.x(g.jetztI + 1 + k).toFixed(1)},${g.y(v.low).toFixed(1)}`).reverse();
    return `M${oben.join(" L")} L${unten.join(" L")} Z`;
  };
  const medianPfad = (b: Band[]) => {
    const start = letzter ? `${g.x(mi(letzter.monat)).toFixed(1)},${g.y(letzter.wert).toFixed(1)} ` : "";
    return `${start}${b.map((v, k) => `${g.x(g.jetztI + 1 + k).toFixed(1)},${g.y(v.mid).toFixed(1)}`).join(" ")}`;
  };

  const markenNachMonat = useMemo(() => {
    const m = new Map<number, Marke[]>();
    for (const k of marken) {
      const i = mi(k.monat);
      if (i < g.startI || i > g.endI) continue;
      m.set(i, [...(m.get(i) ?? []), k]);
    }
    return m;
  }, [marken, g.startI, g.endI]);

  const vorhandeneArten = useMemo(() => new Set(Array.from(markenNachMonat.values()).flat().map((k) => k.art)), [markenNachMonat]);

  function bewege(e: React.PointerEvent<SVGRectElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left + g.rand.l;
    const i = Math.round(g.startI + ((px - g.rand.l) / g.iw) * (g.endI - g.startI));
    setHover(Math.max(g.startI, Math.min(g.endI, i)));
  }

  // Tooltip: Wert des Verlaufs oder Band der Prognose an diesem Monat
  const tip = useMemo(() => {
    if (hover === null) return null;
    const p = punkte.find((q) => mi(q.monat) === hover);
    const k = hover - g.jetztI - 1;
    const b = band && k >= 0 && k < band.ohne.length ? band.ohne[k]! : null;
    const bm = band?.mit && k >= 0 && k < band.mit.length ? band.mit[k]! : null;
    const ms = markenNachMonat.get(hover) ?? [];
    return { p, b, bm, ms };
  }, [hover, punkte, band, g.jetztI, markenNachMonat]);

  const beschreibung = punkte.length ? `${name}: von ${nf(punkte[0]!.wert)} ${einheit} im ${lang(mi(punkte[0]!.monat))} auf ${nf(letzter!.wert)} ${einheit} im ${lang(mi(letzter!.monat))}.` : `${name}: noch keine Werte.`;

  return (
    <div className="wi-diagramm" ref={box}>
      <svg width={breite} height={g.hoehe} viewBox={`0 0 ${breite} ${g.hoehe}`} role="img" aria-label={beschreibung}>
        {/* Gitter und Achsen */}
        {g.ticksY.map((v) => (
          <g key={v}>
            <line x1={g.rand.l} x2={breite - g.rand.r} y1={g.y(v)} y2={g.y(v)} className="wi-gitter" />
            <text x={g.rand.l - 6} y={g.y(v) + 3.5} textAnchor="end" className="wi-achse">
              {nf(v, Math.abs(v) >= 100 || Number.isInteger(v) ? 0 : Math.min(stellen, 1))}
            </text>
          </g>
        ))}
        {g.ticksX.map((i) => (
          <text key={i} x={g.x(i)} y={g.hoehe - g.rand.b + 16} textAnchor="middle" className="wi-achse">
            {kurz(i)}
          </text>
        ))}

        {/* Prognose */}
        {band && band.ohne.length > 0 && <path d={bandPfad(band.ohne)} className="wi-band" />}
        {band?.mit && band.mit.length > 0 && <path d={bandPfad(band.mit)} className="wi-band wi-band-mit" />}

        {/* Schwellen */}
        {g.sichtbareLinien.map((l) => (
          <g key={l.text}>
            <line x1={g.rand.l} x2={breite - g.rand.r} y1={g.y(l.wert)} y2={g.y(l.wert)} className={`wi-linie wi-linie-${l.art}`} />
            <text x={breite - g.rand.r - 2} y={g.y(l.wert) - 4} textAnchor="end" className="wi-linien-text">
              {l.text}
            </text>
          </g>
        ))}

        {/* Amtsantritt und heute */}
        {mi(startMonat) > g.startI && mi(startMonat) < g.endI && (
          <g>
            <line x1={g.x(mi(startMonat))} x2={g.x(mi(startMonat))} y1={g.rand.t} y2={g.hoehe - g.rand.b} className="wi-start" />
            <text x={g.x(mi(startMonat)) + 4} y={g.rand.t + 9} className="wi-start-text">
              Amtsantritt
            </text>
          </g>
        )}
        {g.bandLaenge > 0 && (
          <g>
            <line x1={g.x(g.jetztI)} x2={g.x(g.jetztI)} y1={g.rand.t} y2={g.hoehe - g.rand.b} className="wi-jetzt" />
            <text x={g.x(g.jetztI) + 4} y={g.hoehe - g.rand.b - 5} className="wi-start-text">
              heute
            </text>
          </g>
        )}

        {/* Verlauf */}
        {punkte.length > 1 && <polyline points={linie} className="wi-verlauf" />}
        {band && band.ohne.length > 0 && <polyline points={medianPfad(band.ohne)} className="wi-median" />}
        {band?.mit && band.mit.length > 0 && <polyline points={medianPfad(band.mit)} className="wi-median wi-median-mit" />}
        {letzter && (
          <g>
            <circle cx={g.x(mi(letzter.monat))} cy={g.y(letzter.wert)} r={4} className="wi-punkt" />
            <text x={g.x(mi(letzter.monat))} y={g.y(letzter.wert) - 9} textAnchor={mi(letzter.monat) >= g.endI - 2 ? "end" : "middle"} className="wi-wert">
              {nf(letzter.wert)}
            </text>
          </g>
        )}

        {/* Marken */}
        {Array.from(markenNachMonat.entries()).map(([i, liste]) => {
          const zeigen = liste.slice(0, 3);
          return zeigen.map((k, n) => <Symbol key={`${i}-${n}`} art={k.art} x={g.x(i) + (n - (zeigen.length - 1) / 2) * 9} y={g.hoehe - 10} />);
        })}

        {/* Fadenkreuz */}
        {hover !== null && <line x1={g.x(hover)} x2={g.x(hover)} y1={g.rand.t} y2={g.hoehe - g.rand.b} className="wi-kreuz" />}
        <rect x={g.rand.l} y={g.rand.t} width={g.iw} height={g.ih + (marken.length ? 30 : 12)} fill="transparent" onPointerMove={bewege} onPointerDown={bewege} onPointerLeave={() => setHover(null)} />
      </svg>

      {tip && hover !== null && (tip.p || tip.b || tip.ms.length > 0) && (
        <div className="wi-tip" style={{ left: Math.max(4, Math.min(g.x(hover) + 10, breite - 230)), top: 6 }} role="status">
          <b>{lang(hover)}</b>
          {tip.p && (
            <span>
              {tip.p.jetzt ? "Heute" : "Verlauf"}: {nf(tip.p.wert)} {einheit}
            </span>
          )}
          {tip.b && (
            <span>
              Prognose: {nf(tip.b.low)} bis {nf(tip.b.high)} {einheit}
            </span>
          )}
          {tip.bm && (
            <span className="wi-tip-mit">
              {band?.mitName ?? "Mit Vorhaben"}: {nf(tip.bm.low)} bis {nf(tip.bm.high)}
            </span>
          )}
          {tip.ms.slice(0, 3).map((k, n) => (
            <em key={n}>
              {ARTEN[k.art]}: {k.text}
            </em>
          ))}
        </div>
      )}

      <div className="wi-legende">
        <span>
          <i className="wi-leg-verlauf" /> Verlauf
        </span>
        {band && band.ohne.length > 0 && (
          <span>
            <i className="wi-leg-band" /> Prognose ohne Änderung
          </span>
        )}
        {band?.mit && band.mit.length > 0 && (
          <span>
            <i className="wi-leg-band wi-leg-mit" /> {band.mitName ?? "Mit Ihrem Vorhaben"}
          </span>
        )}
        {rechnet && <span className="wi-rechnet">Die Kanzlei rechnet die nächsten zwölf Monate durch …</span>}
        {Array.from(vorhandeneArten).map((art) => (
          <span key={art}>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <Symbol art={art} x={6} y={6} />
            </svg>{" "}
            {ARTEN[art]}
          </span>
        ))}
      </div>
    </div>
  );
}
