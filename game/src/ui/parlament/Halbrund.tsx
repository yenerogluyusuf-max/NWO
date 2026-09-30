// Das Halbrund: ein Punkt je Sitz, Fraktionen als Keile, auf Wunsch mit Mehrheitslinie, erwartetem Abstimmungsverhalten oder laufender Abstimmung.

import { memo, useMemo, useState, type PointerEvent, type ReactNode } from "react";
import { baueSitzplan, belege, grenzWinkel } from "./geometrie";
import type { Parlamentslage } from "./lage";
import { ROLLEN_WORT } from "./lage";
import type { Zustand } from "./stimmen";
import "./parlament.css";

export interface SitzFarben {
  ja: string;
  zusage: string;
  wackelig: string;
  offen: string;
  nein: string;
  /** Stimmt noch nicht ab */
  leer: string;
}

/** Auf Papier (Dossier) */
export const FARBEN_PAPIER: SitzFarben = { ja: "#2f7d62", zusage: "#6fae8f", wackelig: "#d1a23a", offen: "#efe2bd", nein: "#a8443a", leer: "#e8dcc0" };
/** Auf dunklem Leder (Abstimmungskarte) */
export const FARBEN_DUNKEL: SitzFarben = { ja: "#7fd1a6", zusage: "#5aa584", wackelig: "#e0b653", offen: "#5a4a36", nein: "#e0705f", leer: "#3a2f24" };

/** Farbe eines erwarteten Zustands; feste Sitze des Lagers stimmen mit Ja. */
export const zustandFarbe = (farben: SitzFarben, z: Zustand): string => farben[z === "fest" ? "ja" : z];

export const ZUSTAND_WORT: Record<Zustand, string> = {
  fest: "stimmt mit Ja (Lager)",
  zusage: "stimmt mit Ja (Zusage oder Absprache)",
  wackelig: "könnte aus der Opposition mit Ja stimmen",
  offen: "innerhalb der Spanne, unsicher",
  nein: "stimmt mit Nein",
};

export interface SitzplanProps {
  lage: Parlamentslage;
  modus?: "partei" | "erwartung" | "abstimmung";
  /** erwartung: Zustand je Sitz von links */
  zustand?: Zustand[];
  /** abstimmung: Ja oder Nein je Sitz von links */
  votum?: boolean[];
  /** abstimmung: Wie viele Sitze (von links) schon abgestimmt haben */
  sichtbar?: number;
  hervor?: string | null;
  mehrheitslinie?: boolean;
  farben?: SitzFarben;
  className?: string;
  aria: string;
  /** Inhalt in der Mitte des Halbrunds */
  mitte?: ReactNode;
  onHover?: (partei: string | null) => void;
}

const NEUTRAL_RAND = "rgba(40, 26, 14, 0.32)";

function SitzplanRaw({ lage, modus = "partei", zustand, votum, sichtbar = 0, hervor = null, mehrheitslinie = true, farben = FARBEN_PAPIER, className, aria, mitte, onHover }: SitzplanProps) {
  const plan = useMemo(() => baueSitzplan(lage.gesamt), [lage.gesamt]);
  const gruppen = useMemo(() => lage.fraktionen.map((f) => ({ partei: f.partei, sitze: f.sitze })), [lage.fraktionen]);
  const partei = useMemo(() => belege(plan, gruppen), [plan, gruppen]);
  const farbe = useMemo(() => Object.fromEntries(lage.fraktionen.map((f) => [f.partei, f.farbe])), [lage.fraktionen]);
  const info = useMemo(() => Object.fromEntries(lage.fraktionen.map((f) => [f.partei, f])), [lage.fraktionen]);
  const [tipp, setTipp] = useState<{ i: number; x: number; y: number; b: number } | null>(null);

  const linie = useMemo(() => {
    if (!mehrheitslinie) return null;
    const a = grenzWinkel(plan, 300);
    const p = (r: number) => ({ x: plan.mitte.x + r * Math.cos(a), y: plan.mitte.y - r * Math.sin(a) });
    return { von: p(plan.innen - 12), bis: p(plan.aussen + 14), text: p(plan.aussen + 30) };
  }, [plan, mehrheitslinie]);

  function bewegt(e: PointerEvent<SVGSVGElement>) {
    const el = e.target as SVGElement;
    const i = el.dataset?.i;
    if (i === undefined) {
      if (tipp) setTipp(null);
      onHover?.(null);
      return;
    }
    const box = e.currentTarget.getBoundingClientRect();
    const n = Number(i);
    setTipp({ i: n, x: e.clientX - box.left, y: e.clientY - box.top, b: box.width });
    onHover?.(partei[n] ?? null);
  }

  const beschreibung = (i: number): string[] => {
    const f = info[partei[i] ?? ""];
    const zeilen = [f ? `${f.name} (${f.sitze} Sitze)` : "Sitz"];
    if (f) zeilen.push(ROLLEN_WORT[f.rolle]);
    if (modus === "erwartung" && zustand?.[i]) zeilen.push(ZUSTAND_WORT[zustand[i]!]);
    if (modus === "abstimmung") zeilen.push(i < sichtbar ? (votum?.[i] ? "hat mit Ja gestimmt" : "hat mit Nein gestimmt") : "hat noch nicht abgestimmt");
    return zeilen;
  };

  return (
    <div className={`par-sitzplan${className ? ` ${className}` : ""}`}>
      <svg
        className="par-svg"
        viewBox={`0 0 ${plan.breite} ${plan.hoehe}`}
        role="img"
        aria-label={aria}
        onPointerMove={bewegt}
        onPointerDown={bewegt}
        onPointerLeave={(e) => {
          // Auf Touchgeräten löst das Loslassen „leave“ aus: Dort bleibt die Auskunft stehen, bis man woanders tippt
          if (e.pointerType !== "mouse") return;
          setTipp(null);
          onHover?.(null);
        }}
      >
        {plan.sitze.map((s) => {
          const p = partei[s.i] ?? "";
          const c = farbe[p] ?? "#aaa";
          let fill = c;
          let stroke = NEUTRAL_RAND;
          let breit = 0.5;
          if (modus === "erwartung" && zustand?.[s.i]) {
            fill = zustandFarbe(farben, zustand[s.i]!);
            stroke = c;
            breit = 1.7;
          } else if (modus === "abstimmung") {
            if (s.i < sichtbar) {
              fill = votum?.[s.i] ? farben.ja : farben.nein;
              stroke = c;
              breit = 1.7;
            } else {
              fill = farben.leer;
              stroke = c;
              breit = 1.7;
            }
          }
          const gedimmt = hervor !== null && hervor !== p;
          return <circle key={s.i} className={`par-sitz${gedimmt ? " gedimmt" : ""}`} data-i={s.i} cx={s.x} cy={s.y} r={plan.sitzRadius} fill={fill} stroke={stroke} strokeWidth={breit} />;
        })}
        {linie && (
          <g className="par-mehrheit" pointerEvents="none">
            <line x1={linie.von.x} y1={linie.von.y} x2={linie.bis.x} y2={linie.bis.y} />
            <text x={linie.text.x} y={linie.text.y} textAnchor="middle">
              301
            </text>
          </g>
        )}
      </svg>
      {mitte && <div className="par-mitte">{mitte}</div>}
      {tipp && (
        <div className="par-tipp" style={{ left: Math.min(Math.max(tipp.x, 90), Math.max(90, tipp.b - 90)), top: tipp.y }} role="tooltip">
          {beschreibung(tipp.i).map((z, k) => (
            <span key={k} className={k === 0 ? "par-tipp-kopf" : ""}>
              {z}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export const Sitzplan = memo(SitzplanRaw);
