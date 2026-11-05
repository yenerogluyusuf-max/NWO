// Einfache 2D-Karte für Geräte ohne WebGL (Vorgabe S: die Karte darf nie leer bleiben). Zeichnet die echten Provinzgrenzen und die
// Nachbarländer als SVG, färbt nach der aktiven Kartenebene (dieselben Farben wie die 3D-Karte) und lässt Provinzen und Länder
// anklicken. Kein Relief, keine Marken: Das ist der Ersatz, nicht die Bühne.

import { useMemo } from "react";
import { PROVINCE_FC, ringsOf } from "./overlay";
import nachbarn from "../../data/nachbarn.json";
import { t } from "../../i18n";
import { landName } from "../ebenen";
import type { KriegsKarte } from "../../sim/kriegsschauplatz";
import "./karte2d.css";

const LON0 = 25.4, LAT0 = 42.4, K = 40, KY = K * 1.27;
const px = (lon: number, lat: number): [number, number] => [(lon - LON0) * K, (LAT0 - lat) * KY];
const pfad = (ringe: number[][][]): string => ringe.map((r) => r.map(([lo, la], i) => { const [x, y] = px(lo!, la!); return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`; }).join("") + "Z").join("");
const BREITE = (45.0 - LON0) * K, HOEHE = (LAT0 - 35.7) * KY;

const PROV = PROVINCE_FC.features.map((f) => ({ plaka: f.properties.plaka, name: f.properties.name, d: pfad(ringsOf(f) as number[][][]) }));
const LAENDER = (nachbarn as unknown as { countries: { iso: string; name: string; rings: number[][][] }[] }).countries.map((c) => ({ iso: c.iso, name: c.name, d: pfad(c.rings) }));

/** Vorstoß als leicht gebogene Linie (wie in der 3D-Karte, kriegsfx.ts) */
function bogen(von: [number, number], nach: [number, number]): string {
  const [x1, y1] = px(von[0], von[1]), [x2, y2] = px(nach[0], nach[1]);
  const mx = (x1 + x2) / 2 - (y2 - y1) * 0.18, my = (y1 + y2) / 2 + (x2 - x1) * 0.18;
  return `M${x1.toFixed(1)},${y1.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
}

export function Karte2D({ fill, fillAlpha = 0.85, selected, onSelect, laenderFarben, onLand, krieg }: {
  fill?: Record<number, string>; fillAlpha?: number; selected?: number; onSelect?: (plaka: number) => void;
  laenderFarben?: Record<string, string>; onLand?: (iso: string, pos?: { x: number; y: number }) => void;
  /** Kriegslage (sim/kriegsschauplatz.ts kriegsKarte): Regionen, Vorstöße und bedrohte Provinzen wie in der 3D-Karte */
  krieg?: KriegsKarte | null;
}) {
  const provinzen = useMemo(() => PROV, []);
  const bedroht = useMemo(() => new Set(krieg?.bedroht ?? []), [krieg]);
  // Liegt der Schauplatz außerhalb des Ausschnitts (Syrien, Irak, Kaukasus), wächst der Ausschnitt mit
  const rahmen = useMemo(() => {
    let x0 = -30, y0 = -20, x1 = BREITE + 30, y1 = HOEHE + 20;
    for (const r of krieg?.regionen ?? []) { const [x, y] = px(r.lon, r.lat); x0 = Math.min(x0, x - 40); y0 = Math.min(y0, y - 40); x1 = Math.max(x1, x + 40); y1 = Math.max(y1, y + 40); }
    return `${x0} ${y0} ${x1 - x0} ${y1 - y0}`;
  }, [krieg]);
  return (
    <div className="karte2d" role="region" aria-label={t("karte2d.aria")}>
      <svg viewBox={rahmen} preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="k2d-schraffur" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" /></pattern>
          <marker id="k2d-spitze-eigen" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" className="eigen" /></marker>
          <marker id="k2d-spitze-gegner" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" className="gegner" /></marker>
        </defs>
        <rect x={-400} y={-400} width={BREITE + 800} height={HOEHE + 800} className="karte2d-meer" />
        <g className="karte2d-laender">
          {LAENDER.map((l) => (
            <path key={l.iso} d={l.d} style={laenderFarben?.[l.iso] ? { fill: laenderFarben[l.iso] } : undefined}
              onClick={(e) => onLand?.(l.iso, { x: e.clientX, y: e.clientY })}><title>{landName(l.iso) ?? l.name}</title></path>
          ))}
        </g>
        {/* Grund: Land in Pergament, darüber die Farbe der Ebene (Provinzen ohne Wert bleiben Land, nicht Meer) */}
        <g className="karte2d-grund" aria-hidden>{provinzen.map((p) => <path key={p.plaka} d={p.d} />)}</g>
        <g className="karte2d-provinzen">
          {provinzen.map((p) => (
            <path key={p.plaka} d={p.d} className={[p.plaka === selected ? "gewaehlt" : "", bedroht.has(p.plaka) ? "bedroht" : ""].filter(Boolean).join(" ") || undefined}
              style={fill?.[p.plaka] ? { fill: fill[p.plaka], fillOpacity: fillAlpha } : undefined}
              onClick={() => onSelect?.(p.plaka)}><title>{p.name}</title></path>
          ))}
        </g>
        {krieg && (
          <g className={`karte2d-krieg${krieg.aktiv ? " aktiv" : ""}`} aria-label={t("karte2d.krieg")}>
            {krieg.regionen.map((r) => { const [x, y] = px(r.lon, r.lat); return <circle key={r.id} cx={x} cy={y} r={11} className={r.lage}><title>{t(`karte2d.lage.${r.lage}`)}</title></circle>; })}
            {krieg.pfeile.map((f, i) => <path key={i} d={bogen(f.von, f.nach)} className={`pfeil ${f.seite}`} markerEnd={`url(#k2d-spitze-${f.seite})`} />)}
          </g>
        )}
      </svg>
      <p className="karte2d-hinweis">{t("karte2d.hinweis")}</p>
    </div>
  );
}
