// Baustein „Rad“ (PLAN_OBERFLAECHE_DETAIL Teil 1, Q3): ein Ring aus Stücken, optional ein zweiter innen, eine Mitte und je Ring eine
// Legende. Ein Klick auf ein Stück oder seine Legendenzeile ruft `onStueck` (Drill-down: Haushalt → Ministerium → Behörde). Das Rad
// rechnet nichts; die Stücke und ihre Beträge kommen fertig vom Aufrufer. Erste Nutzung: das Haushaltsrad (ui/wirtschaft).
// Farben: Der Aufrufer wählt sie (Palette geprüft mit dem Palettenprüfer); jede Farbe trägt in der Legende Namen und Betrag, damit
// keine Größe allein an der Farbe hängt.

import { useId, useState, type ReactNode } from "react";
import { zahl } from "../../i18n";
import "./rad.css";

export interface RadStueck {
  id: string;
  name: string;
  /** Betrag in der Einheit des Aufrufers (etwa Mrd. Lira) */
  wert: number;
  farbe: string;
  schraffiert?: boolean;
  /** Ob ein Klick etwas tut */
  klickbar?: boolean;
  /** Im Ring, in der Legende aber abgesetzt unter einem Strich und ohne Anteil (etwa die Lücke „auf Kredit“: keine Einnahme) */
  abgesetzt?: boolean;
}

export interface RadRing {
  stuecke: RadStueck[];
  /** Bezugsgröße für die Anteile; fehlt sie, gilt die Summe der Stücke */
  summe?: number;
  /** Überschrift der Legende und der Gesamtbetrag daneben */
  titel: string;
  gesamt: number;
  /** Bezug der Anteile in der Legende; fehlt er, gilt die Bezugsgröße des Rings */
  anteilVon?: number;
}

/** Bogenstück eines Rings von Winkel a bis b (Bogenmaß, 0 oben, im Uhrzeigersinn). */
export function bogen(cx: number, cy: number, r0: number, r1: number, a: number, b: number): string {
  const p = (r: number, w: number) => `${(cx + r * Math.sin(w)).toFixed(2)} ${(cy - r * Math.cos(w)).toFixed(2)}`;
  const gross = b - a > Math.PI ? 1 : 0;
  return `M ${p(r1, a)} A ${r1} ${r1} 0 ${gross} 1 ${p(r1, b)} L ${p(r0, b)} A ${r0} ${r0} 0 ${gross} 0 ${p(r0, a)} Z`;
}

/** Winkelbereiche der Stücke (für Tests und für Beschriftungen). Die Summe der Anteile ist 1, wenn `summe` der Stücksumme gleicht. */
export function radWinkel(stuecke: RadStueck[], summe?: number): { id: string; von: number; bis: number; anteil: number }[] {
  const s = summe ?? stuecke.reduce((x, y) => x + y.wert, 0);
  let a = 0;
  return stuecke.map((x) => {
    const anteil = s > 0 ? x.wert / s : 0;
    const von = a;
    a += anteil * Math.PI * 2;
    return { id: x.id, von, bis: a, anteil };
  });
}

export function Rad({
  aussen,
  innen,
  wertText,
  mitte,
  aria,
  fuss,
  onStueck,
}: {
  aussen: RadRing;
  innen?: RadRing;
  /** Wie ein Betrag erscheint (etwa „4,0 Bio. ₺“) */
  wertText: (x: number) => string;
  /** Text in der Mitte, solange nichts hervorgehoben ist */
  mitte: { titel: string; wert: string; klein?: string };
  aria: string;
  fuss?: ReactNode;
  onStueck?: (id: string) => void;
}) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<string | null>(null);
  const summe = (r: RadRing) => r.summe ?? r.stuecke.reduce((s, x) => s + x.wert, 0);
  const prozent = (x: number, von: number) => `${zahl(von > 0 ? (x / von) * 100 : 0, 0)} %`;
  const ring = (r: RadRing, r0: number, r1: number) => {
    const s = summe(r);
    const luecke = 0.012; // 2 px Abstand zwischen den Stücken
    return radWinkel(r.stuecke, s).map((w, i) => {
      const st = r.stuecke[i]!;
      const pfad = bogen(130, 130, r0, r1, w.von + luecke / 2, Math.max(w.von + luecke / 2 + 0.001, w.bis - luecke / 2));
      const aktiv = hover === st.id;
      return (
        <path
          key={st.id}
          d={pfad}
          fill={st.schraffiert ? `url(#${id}-schraffur)` : st.farbe}
          stroke={st.schraffiert ? st.farbe : "none"}
          strokeWidth={st.schraffiert ? 1.5 : 0}
          opacity={hover && !aktiv ? 0.45 : 1}
          className={st.klickbar && onStueck ? "hr-klickbar" : undefined}
          onMouseEnter={() => setHover(st.id)}
          onMouseLeave={() => setHover(null)}
          onClick={() => st.klickbar && onStueck?.(st.id)}
        >
          <title>{`${st.name}: ${wertText(st.wert)} (${prozent(st.wert, s)})`}</title>
        </path>
      );
    });
  };
  const zeile = (r: RadRing, st: RadStueck) => (
    <li key={st.id} className={hover === st.id ? "on" : undefined} onMouseEnter={() => setHover(st.id)} onMouseLeave={() => setHover(null)}>
      <button type="button" disabled={!st.klickbar || !onStueck} onClick={() => st.klickbar && onStueck?.(st.id)}>
        <i aria-hidden className={st.schraffiert ? "schraffiert" : undefined} style={{ background: st.schraffiert ? undefined : st.farbe }} />
        <span>{st.name}</span>
        <span className="hr-wert">{wertText(st.wert)}</span>
        <span className="hr-anteil">{st.abgesetzt ? "" : prozent(st.wert, r.anteilVon ?? summe(r))}</span>
      </button>
    </li>
  );
  const legende = (r: RadRing) => {
    const abgesetzt = r.stuecke.filter((st) => st.abgesetzt);
    return (
      <section className="hr-legende" aria-label={r.titel}>
        <h3>
          {r.titel} <b>{wertText(r.gesamt)}</b>
        </h3>
        <ul>{r.stuecke.filter((st) => !st.abgesetzt).map((st) => zeile(r, st))}</ul>
        {abgesetzt.length > 0 && <ul className="hr-abgesetzt">{abgesetzt.map((st) => zeile(r, st))}</ul>}
      </section>
    );
  };
  const aktiv = [...aussen.stuecke, ...(innen?.stuecke ?? [])].find((s) => s.id === hover);
  return (
    <div className={`hr${innen ? "" : " hr-einzeln"}`}>
      {legende(aussen)}
      <figure className="hr-figur">
        <svg viewBox="0 0 260 260" role="img" aria-label={aria}>
          <defs>
            <pattern id={`${id}-schraffur`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#f6e3d6" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#8c2b1f" strokeWidth="2.4" />
            </pattern>
          </defs>
          {ring(aussen, innen ? 92 : 78, 126)}
          {innen && ring(innen, 62, 86)}
          <text x="130" y="122" textAnchor="middle" className="hr-mitte-titel">
            {aktiv ? (aktiv.name.length > 18 ? `${aktiv.name.slice(0, 17)}…` : aktiv.name) : mitte.titel}
          </text>
          <text x="130" y="146" textAnchor="middle" className="hr-mitte-wert">
            {aktiv ? wertText(aktiv.wert) : mitte.wert}
          </text>
          <text x="130" y="163" textAnchor="middle" className="hr-mitte-klein">
            {aktiv ? "" : (mitte.klein ?? "")}
          </text>
        </svg>
        {fuss && <figcaption>{fuss}</figcaption>}
      </figure>
      {innen && legende(innen)}
    </div>
  );
}
