// Einfache 2D-Karte für Geräte ohne WebGL (Vorgabe S: die Karte darf nie leer bleiben). Zeichnet die echten Provinzgrenzen und die
// Nachbarländer als SVG, färbt nach der aktiven Kartenebene (dieselben Farben wie die 3D-Karte) und lässt Provinzen und Länder
// anklicken. Kein Relief, keine Marken: Das ist der Ersatz, nicht die Bühne.
//
// Welle 3, K6 (krieg.md Schritt 10): Die Kriegsregionen sind echte Flächen (data/schauplatz-flaechen.json) statt Kreise, die Front verläuft
// entlang der Regionsgrenzen wie in der 3D-Karte (ui/atlas/front.ts), die Verbände stehen an derselben Stelle. Die Ortswahl (ortswahl.ts)
// färbt die wählbaren Regionen nach Bewertung, ein Klick wählt sie; die Karte zeigt dann den Ausschnitt um die Wahl (`fokus`).

import { useMemo } from "react";
import { PROVINCE_FC, ringsOf } from "./overlay";
import nachbarn from "../../data/nachbarn.json";
import { t } from "../../i18n";
import { landName } from "../ebenen";
import type { KriegsKarte } from "../../sim/kriegsschauplatz";
import { SCHAUPLATZ_FLAECHEN, type KriegsLage } from "./front";
import type { Bewertung } from "./ortswahl";
import "./karte2d.css";

const LON0 = 25.4, LAT0 = 42.4, K = 40, KY = K * 1.27;
const px = (lon: number, lat: number): [number, number] => [(lon - LON0) * K, (LAT0 - lat) * KY];
const pfad = (ringe: number[][][]): string => ringe.map((r) => r.map(([lo, la], i) => { const [x, y] = px(lo!, la!); return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`; }).join("") + "Z").join("");
export const BREITE = (45.0 - LON0) * K, HOEHE = (LAT0 - 35.7) * KY;

/** Provinzflächen als SVG-Pfade (auch für kleine Karten in den Akten) */
export const PROV = PROVINCE_FC.features.map((f) => ({ plaka: f.properties.plaka, name: f.properties.name, d: pfad(ringsOf(f) as number[][][]) }));
// Die Länderdaten enden an einem Rechteck (17,5–52,5° O, 29–48° N); an diesen Rändern blenden die Masken weich aus
const [RX0, RY0] = px(17.5, 48), [RX1, RY1] = px(52.5, 29);
const LAENDER = (nachbarn as unknown as { countries: { iso: string; name: string; rings: number[][][] }[] }).countries.map((c) => ({ iso: c.iso, name: c.name, d: pfad(c.rings) }));

/** Fläche einer Kriegsregion als SVG-Pfad */
const regionPfad = (id: string): string | undefined => {
  const fl = SCHAUPLATZ_FLAECHEN[id];
  return fl ? pfad(fl as unknown as number[][][]) : undefined;
};

/** Mitte des größten Rings (für den Namen) */
function regionMitte(id: string, lon: number, lat: number): [number, number] {
  const fl = SCHAUPLATZ_FLAECHEN[id];
  const gross = fl ? [...fl].sort((a, b) => b.length - a.length)[0] : undefined;
  if (!gross) return px(lon, lat);
  return px(gross.reduce((s, p) => s + p[0], 0) / gross.length, gross.reduce((s, p) => s + p[1], 0) / gross.length);
}

/** Frontlinie entlang der Regionsgrenzen (front.ts) als Pfad, dazu die Zähne zur Seite des Gegners in gleichen Abständen. */
function linienPfade(l: KriegsLage["linien"][number], e: number): { linie: string; zaehne: string } {
  const pts = l.punkte.map(([lo, la]) => px(lo, la));
  const linie = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  if (l.art !== "front") return { linie, zaehne: "" };
  // In Bildschirmpixeln gedacht (e = Einheiten des Blatts je Pixel): alle 14 px ein Zahn von 5 px
  const abstand = 14 * e, g = 5 * e;
  let zaehne = "";
  let rest = abstand / 2;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i]!, [bx, by] = pts[i + 1]!;
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 0.01) continue;
    const ux = (bx - ax) / len, uy = (by - ay) / len;
    // Richtung zum Gegner auf dem Blatt: Länge nach rechts, Breite nach oben (darum das Vorzeichen der Breite umkehren)
    const [fx, fy] = l.feind[i]!;
    let nx = -uy, ny = ux;
    if (fx * K * nx + -fy * KY * ny < 0) { nx = -nx; ny = -ny; }
    let s = rest;
    while (s < len) {
      const x = ax + ux * s, y = ay + uy * s;
      zaehne += `M${(x - ux * g * 0.6).toFixed(1)},${(y - uy * g * 0.6).toFixed(1)}L${(x + nx * g).toFixed(1)},${(y + ny * g).toFixed(1)}L${(x + ux * g * 0.6).toFixed(1)},${(y + uy * g * 0.6).toFixed(1)}Z`;
      s += abstand;
    }
    rest = s - len;
  }
  return { linie, zaehne };
}

/** Frontlinie als Zackenlinie quer zur Stoßrichtung, die Zacken zeigen zum Gegner (HOI-Bild; N7, Befund G-1). */
function frontPfad(punkt: [number, number], richtung: [number, number]): string {
  const [x, y] = px(punkt[0], punkt[1]);
  const [x2, y2] = px(punkt[0] + richtung[0] * 0.1, punkt[1] + richtung[1] * 0.1);
  const l = Math.hypot(x2 - x, y2 - y) || 1;
  const ux = (x2 - x) / l, uy = (y2 - y) / l;
  const qx = -uy, qy = ux;
  const halb = 36, zacken = 8;
  let d = "";
  for (let i = 0; i <= zacken; i++) {
    const q = -halb + (2 * halb * i) / zacken;
    d += `${i ? "L" : "M"}${(x + qx * q).toFixed(1)},${(y + qy * q).toFixed(1)}`;
    if (i < zacken) { const m = q + halb / zacken; d += `L${(x + qx * m + ux * 5).toFixed(1)},${(y + qy * m + uy * 5).toFixed(1)}`; }
  }
  return d;
}

/** Zeichen der Teilstreitkraft in der Marke (vereinfacht nach den taktischen Zeichen der NATO) */
function Zeichen({ art }: { art: "heer" | "luft" | "see" }) {
  if (art === "heer") return <path d="M-9,-5 L9,5 M-9,5 L9,-5" />;
  if (art === "luft") return <path d="M-8,1 Q-4,-6 0,1 Q4,8 8,1" />;
  return <path d="M-8,2 Q-4,-4 0,2 T8,2" />;
}

/** Vorstoß als leicht gebogene Linie (wie in der 3D-Karte, kriegsfx.ts) */
function bogen(von: [number, number], nach: [number, number]): string {
  const [x1, y1] = px(von[0], von[1]), [x2, y2] = px(nach[0], nach[1]);
  const mx = (x1 + x2) / 2 - (y2 - y1) * 0.18, my = (y1 + y2) / 2 + (x2 - x1) * 0.18;
  return `M${x1.toFixed(1)},${y1.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
}

export function Karte2D({ fill, fillAlpha = 0.85, selected, onSelect, laenderFarben, onLand, krieg, front, ortswahl, onOrtswahl, fokus, randRechts = 0 }: {
  fill?: Record<number, string>; fillAlpha?: number; selected?: number; onSelect?: (plaka: number) => void;
  laenderFarben?: Record<string, string>; onLand?: (iso: string, pos?: { x: number; y: number }) => void;
  /** Kriegslage (sim/kriegsschauplatz.ts kriegsKarte): Regionen, Vorstöße und bedrohte Provinzen wie in der 3D-Karte */
  krieg?: KriegsKarte | null;
  /** Front entlang der Regionsgrenzen, Zielraum und Verbände an der Front (front.ts), wie in der 3D-Karte */
  front?: Pick<KriegsLage, "linien" | "ziel" | "verbaende">;
  /** Ortswahl (ortswahl.ts): wählbare Regionen mit Stil; ein Klick ruft `onOrtswahl` */
  ortswahl?: { ziele: { ziel: string; name: string; stil: Bewertung | "gewaehlt" }[] } | null;
  onOrtswahl?: (ziel: string) => void;
  /** Ausschnitt wie die Kamera der 3D-Karte (Länge, Breite, Abstand); ohne Angabe die ganze Türkei samt Schauplatz */
  fokus?: { lon: number; lat: number; d: number };
  /** Rechts verdeckte Breite in Pixeln (Seitenfenster): Der Ausschnitt rückt nach links */
  randRechts?: number;
}) {
  const provinzen = useMemo(() => PROV, []);
  const bedroht = useMemo(() => new Set(krieg?.bedroht ?? []), [krieg]);
  const ziel = useMemo(() => new Set(front?.ziel ?? []), [front]);
  const mitLinie = useMemo(() => new Set((front?.linien ?? []).filter((l) => l.art !== "linie").map((l) => l.land)), [front]);
  const verbaende = front?.verbaende ?? krieg?.verbaende ?? [];
  const ortZiele = useMemo(() => (ortswahl?.ziele ?? []).filter((z) => z.ziel.startsWith("r:")), [ortswahl]);
  // In der Ortswahl wählen Provinz und Land nur, wenn sie in der Liste stehen; sonst geschieht nichts (keine Provinzkarte)
  const waehle = (ziel: string): void => {
    if (ortswahl?.ziele.some((z) => z.ziel === ziel)) onOrtswahl?.(ziel);
  };
  // Liegt der Schauplatz außerhalb des Ausschnitts (Syrien, Irak, Kaukasus), wächst der Ausschnitt mit; mit Fokus zeigt er die Umgebung
  // des Ziels in der Breite, die der Abstand der 3D-Kamera ungefähr zeigt (Spielparameter der Darstellung: 1,8 Längengrade je Einheit, wie die 3D-Karte bei 1440 px)
  const { rahmen, e } = useMemo(() => {
    const breiteFenster = typeof window === "undefined" ? 1440 : window.innerWidth || 1440;
    if (fokus) {
      const b = fokus.d * 1.8 * K;
      const h = b * 0.62;
      const [cx, cy] = px(fokus.lon, fokus.lat);
      const rechts = b * (randRechts / Math.max(1, typeof window === "undefined" ? 1440 : window.innerWidth));
      return { rahmen: `${(cx - b / 2 + rechts / 2).toFixed(0)} ${(cy - h / 2).toFixed(0)} ${b.toFixed(0)} ${h.toFixed(0)}`, e: b / breiteFenster };
    }
    let x0 = -30, y0 = -20, x1 = BREITE + 30, y1 = HOEHE + 20;
    for (const r of krieg?.regionen ?? []) { const [x, y] = px(r.lon, r.lat); x0 = Math.min(x0, x - 40); y0 = Math.min(y0, y - 40); x1 = Math.max(x1, x + 40); y1 = Math.max(y1, y + 40); }
    return { rahmen: `${x0} ${y0} ${x1 - x0} ${y1 - y0}`, e: (x1 - x0) / breiteFenster };
  }, [krieg, fokus?.lon, fokus?.lat, fokus?.d, randRechts]);
  return (
    <div className="karte2d" role="region" aria-label={t("karte2d.aria")}>
      <svg viewBox={rahmen} preserveAspectRatio="xMidYMid meet" style={{ ["--e" as string]: e.toFixed(4) }}>
        <defs>
          <pattern id="k2d-schraffur" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" /><line x1="0" y1="0" x2="0" y2="4" /></pattern>
          <marker id="k2d-spitze-eigen" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth={(14 * e).toFixed(2)} markerHeight={(14 * e).toFixed(2)} orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" className="eigen" /></marker>
          <marker id="k2d-spitze-gegner" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth={(14 * e).toFixed(2)} markerHeight={(14 * e).toFixed(2)} orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" className="gegner" /></marker>
          <linearGradient id="k2d-senk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" /><stop offset="0.08" stopColor="#fff" /><stop offset="0.92" stopColor="#fff" /><stop offset="1" stopColor="#000" /></linearGradient>
          <linearGradient id="k2d-waag" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" /><stop offset="0.06" stopColor="#fff" /><stop offset="0.94" stopColor="#fff" /><stop offset="1" stopColor="#000" /></linearGradient>
          <mask id="k2d-rand-senk" maskUnits="userSpaceOnUse" x={RX0} y={RY0} width={RX1 - RX0} height={RY1 - RY0}><rect x={RX0} y={RY0} width={RX1 - RX0} height={RY1 - RY0} fill="url(#k2d-senk)" /></mask>
          <mask id="k2d-rand-waag" maskUnits="userSpaceOnUse" x={RX0} y={RY0} width={RX1 - RX0} height={RY1 - RY0}><rect x={RX0} y={RY0} width={RX1 - RX0} height={RY1 - RY0} fill="url(#k2d-waag)" /></mask>
        </defs>
        <rect x={-400} y={-400} width={BREITE + 800} height={HOEHE + 800} className="karte2d-meer" />
        <g mask="url(#k2d-rand-waag)"><g className="karte2d-laender" mask="url(#k2d-rand-senk)">
          {LAENDER.map((l) => (
            <path key={l.iso} d={l.d} style={laenderFarben?.[l.iso] ? { fill: laenderFarben[l.iso] } : undefined}
              onClick={(e) => (ortswahl ? waehle(`l:${l.iso}`) : onLand?.(l.iso, { x: e.clientX, y: e.clientY }))}><title>{landName(l.iso) ?? l.name}</title></path>
          ))}
        </g></g>
        {/* Grund: Land in Pergament, darüber die Farbe der Ebene (Provinzen ohne Wert bleiben Land, nicht Meer) */}
        <g className="karte2d-grund" aria-hidden>{provinzen.map((p) => <path key={p.plaka} d={p.d} />)}</g>
        <g className="karte2d-provinzen">
          {provinzen.map((p) => (
            <path key={p.plaka} d={p.d} className={[p.plaka === selected ? "gewaehlt" : "", bedroht.has(p.plaka) ? "bedroht" : ""].filter(Boolean).join(" ") || undefined}
              style={fill?.[p.plaka] ? { fill: fill[p.plaka], fillOpacity: fillAlpha } : undefined}
              onClick={() => (ortswahl ? waehle(`p:${p.plaka}`) : onSelect?.(p.plaka))}><title>{p.name}</title></path>
          ))}
        </g>
        {krieg && (
          <g className={`karte2d-krieg${krieg.aktiv ? " aktiv" : ""}`} aria-label={t("karte2d.krieg")}>
            {/* Regionen als echte Flächen: gehalten bündig in der Farbe der Türkei, umkämpft in Ocker, Zielregionen beim Gegner gestrichelt */}
            {krieg.regionen.map((r) => {
              const d = regionPfad(r.id);
              const cls = `region ${r.lage}${r.lage === "gegner" && ziel.has(r.id) ? " ziel" : ""}${r.form === "annexion" ? " annexion" : ""}`;
              if (!d) { const [x, y] = px(r.lon, r.lat); return <circle key={r.id} cx={x} cy={y} r={11} className={cls}><title>{t(`karte2d.lage.${r.lage}`)}</title></circle>; }
              return <path key={r.id} d={d} className={cls}><title>{`${t(`krieg.region.${r.id}`)} · ${t(`karte2d.lage.${r.lage}`)}`}</title></path>;
            })}
            {(front?.linien ?? []).map((l, i) => {
              const { linie, zaehne } = linienPfade(l, e);
              return (
                <g key={`l-${i}`} className={`frontlinie ${l.art}`}>
                  <path d={linie} className="grund" />
                  <path d={linie} className="strich" />
                  {zaehne && <path d={zaehne} className="zaehne" />}
                </g>
              );
            })}
            {krieg.pfeile.map((f, i) => <path key={i} d={bogen(f.von, f.nach)} className={`pfeil ${f.seite}`} markerEnd={`url(#k2d-spitze-${f.seite})`} />)}
            {(krieg.fronten ?? []).filter((f) => !mitLinie.has(f.land)).map((f) => (
              <g key={`front-${f.land}`} className="front">
                <path d={frontPfad(f.punkt, f.richtung)} className="front-halo" />
                <path d={frontPfad(f.punkt, f.richtung)} className="front-linie"><title>{t("nacht_n7.karte.front", { front: f.front })}</title></path>
              </g>
            ))}
            {verbaende.map((v, i) => {
              const [x, y] = px(v.lon, v.lat);
              return (
                <g key={`vb-${i}`} className={`verband ${v.seite}`} transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${(e * 1.15).toFixed(3)})`}>
                  <title>{t(v.seite === "eigen" ? "nacht_n7.karte.verband" : "nacht_n7.karte.gegner", { teil: t(`militaer.ui.teil.${v.art}`), p: v.staerke })}</title>
                  <rect x={-13} y={-9} width={26} height={18} rx={2} />
                  <Zeichen art={v.seite === "eigen" ? v.art : "heer"} />
                  <text y={21}>{t("nacht_n7.karte.prozent", { p: v.staerke })}</text>
                </g>
              );
            })}
            {/* Namen zuletzt; ein Name unter einer Marke rückt über sie (Marke 30 × 21 px samt Zahl darunter, in Einheiten des Blatts) */}
            {krieg.regionen.filter((r) => r.lage !== "gegner" || ziel.has(r.id)).map((r) => {
              const [x, y0] = regionMitte(r.id, r.lon, r.lat);
              const name = t(`krieg.region.${r.id}`);
              const hb = name.length * 4.2 * e, hh = 8 * e;
              let y = y0;
              for (const v of verbaende) {
                const [vx, vy] = px(v.lon, v.lat);
                const mb = 17 * e * 1.15, mo = 11 * e * 1.15, mu = 26 * e * 1.15;
                if (x + hb > vx - mb && x - hb < vx + mb && y + hh > vy - mo && y - hh < vy + mu) y = vy - mo - hh - 2 * e;
              }
              return <text key={`n-${r.id}`} x={x} y={y} className={`regionname ${r.lage}`}>{name}</text>;
            })}
          </g>
        )}
        {ortZiele.length > 0 && (
          <g className="karte2d-ortswahl">
            {ortZiele.map((z) => {
              const d = regionPfad(z.ziel.slice(2));
              return d ? <path key={z.ziel} d={d} className={z.stil} onClick={() => onOrtswahl?.(z.ziel)}><title>{z.name}</title></path> : null;
            })}
            {ortZiele.map((z) => {
              const id = z.ziel.slice(2);
              const fl = SCHAUPLATZ_FLAECHEN[id];
              if (!fl) return null;
              const [x, y] = regionMitte(id, fl[0]![0]![0], fl[0]![0]![1]);
              return <text key={`n-${z.ziel}`} x={x} y={y} className={`ortname ${z.stil}`}>{z.name}</text>;
            })}
          </g>
        )}
      </svg>
      <p className="karte2d-hinweis">{t("karte2d.hinweis")}</p>
    </div>
  );
}
