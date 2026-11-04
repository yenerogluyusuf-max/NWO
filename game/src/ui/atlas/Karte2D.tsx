// Einfache 2D-Karte für Geräte ohne WebGL (Vorgabe S: die Karte darf nie leer bleiben). Zeichnet die echten Provinzgrenzen und die
// Nachbarländer als SVG, färbt nach der aktiven Kartenebene (dieselben Farben wie die 3D-Karte) und lässt Provinzen und Länder
// anklicken. Kein Relief, keine Marken: Das ist der Ersatz, nicht die Bühne.

import { useMemo } from "react";
import { PROVINCE_FC, ringsOf } from "./overlay";
import nachbarn from "../../data/nachbarn.json";
import { t } from "../../i18n";
import "./karte2d.css";

const LON0 = 25.4, LAT0 = 42.4, K = 40, KY = K * 1.27;
const px = (lon: number, lat: number): [number, number] => [(lon - LON0) * K, (LAT0 - lat) * KY];
const pfad = (ringe: number[][][]): string => ringe.map((r) => r.map(([lo, la], i) => { const [x, y] = px(lo!, la!); return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`; }).join("") + "Z").join("");
const BREITE = (45.0 - LON0) * K, HOEHE = (LAT0 - 35.7) * KY;

const PROV = PROVINCE_FC.features.map((f) => ({ plaka: f.properties.plaka, name: f.properties.name, d: pfad(ringsOf(f) as number[][][]) }));
const LAENDER = (nachbarn as unknown as { countries: { iso: string; name: string; rings: number[][][] }[] }).countries.map((c) => ({ iso: c.iso, name: c.name, d: pfad(c.rings) }));

export function Karte2D({ fill, fillAlpha = 0.85, selected, onSelect, laenderFarben, onLand }: {
  fill?: Record<number, string>; fillAlpha?: number; selected?: number; onSelect?: (plaka: number) => void;
  laenderFarben?: Record<string, string>; onLand?: (iso: string, pos?: { x: number; y: number }) => void;
}) {
  const provinzen = useMemo(() => PROV, []);
  return (
    <div className="karte2d" role="region" aria-label={t("karte2d.aria")}>
      <svg viewBox={`-30 -20 ${BREITE + 60} ${HOEHE + 40}`} preserveAspectRatio="xMidYMid meet">
        <rect x={-400} y={-400} width={BREITE + 800} height={HOEHE + 800} className="karte2d-meer" />
        <g className="karte2d-laender">
          {LAENDER.map((l) => (
            <path key={l.iso} d={l.d} style={laenderFarben?.[l.iso] ? { fill: laenderFarben[l.iso] } : undefined}
              onClick={(e) => onLand?.(l.iso, { x: e.clientX, y: e.clientY })}><title>{l.name}</title></path>
          ))}
        </g>
        {/* Grund: Land in Pergament, darüber die Farbe der Ebene (Provinzen ohne Wert bleiben Land, nicht Meer) */}
        <g className="karte2d-grund" aria-hidden>{provinzen.map((p) => <path key={p.plaka} d={p.d} />)}</g>
        <g className="karte2d-provinzen">
          {provinzen.map((p) => (
            <path key={p.plaka} d={p.d} className={p.plaka === selected ? "gewaehlt" : undefined}
              style={fill?.[p.plaka] ? { fill: fill[p.plaka], fillOpacity: fillAlpha } : undefined}
              onClick={() => onSelect?.(p.plaka)}><title>{p.name}</title></path>
          ))}
        </g>
      </svg>
      <p className="karte2d-hinweis">{t("karte2d.hinweis")}</p>
    </div>
  );
}
