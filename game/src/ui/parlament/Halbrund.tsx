// Das Halbrund: ein Punkt je Sitz, Fraktionen als Keile, auf Wunsch mit Mehrheitslinie, erwartetem Abstimmungsverhalten oder laufender Abstimmung.

import { memo, useCallback, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { baueSitzplan, belege, grenzWinkel, type Sitzplan as Plan } from "./geometrie";
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

interface Kern {
  plan: Plan;
  partei: string[];
  farbe: Record<string, string>;
  modus: "partei" | "erwartung" | "abstimmung";
  zustand: Zustand[] | undefined;
  votum: boolean[] | undefined;
  sichtbar: number;
  hervor: string | null;
  farben: SitzFarben;
  linie: { von: { x: number; y: number }; bis: { x: number; y: number }; text: { x: number; y: number } } | null;
  aria: string;
  zeiger: (e: PointerEvent<SVGSVGElement>, weg: boolean) => void;
}

const gleicheListe = <T,>(a: T[] | undefined, b: T[] | undefined) => a === b || (!!a && !!b && a.length === b.length && a.every((x, i) => x === b[i]));

/** Der gezeichnete Teil: 600 Kreise. Wird nur neu berechnet, wenn sich etwas an den Sitzen ändert, nicht bei jedem Zeittakt der Bühne. */
const SitzKern = memo(
  function SitzKern({ plan, partei, farbe, modus, zustand, votum, sichtbar, hervor, farben, linie, aria, zeiger }: Kern) {
    return (
      <svg
        className="par-svg"
        viewBox={`0 0 ${plan.breite} ${plan.hoehe}`}
        role="img"
        aria-label={aria}
        onPointerMove={(e) => zeiger(e, false)}
        onPointerDown={(e) => zeiger(e, false)}
        onPointerLeave={(e) => zeiger(e, true)}
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
            fill = s.i < sichtbar ? (votum?.[s.i] ? farben.ja : farben.nein) : farben.leer;
            stroke = c;
            breit = 1.7;
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
    );
  },
  (a, b) =>
    a.plan === b.plan &&
    a.modus === b.modus &&
    a.sichtbar === b.sichtbar &&
    a.hervor === b.hervor &&
    a.farben === b.farben &&
    a.aria === b.aria &&
    a.linie === b.linie &&
    a.zeiger === b.zeiger &&
    gleicheListe(a.partei, b.partei) &&
    gleicheListe(a.zustand, b.zustand) &&
    gleicheListe(a.votum, b.votum) &&
    Object.keys(a.farbe).length === Object.keys(b.farbe).length &&
    Object.entries(a.farbe).every(([k, v]) => b.farbe[k] === v),
);

function SitzplanRaw({ lage, modus = "partei", zustand, votum, sichtbar = 0, hervor = null, mehrheitslinie = true, farben = FARBEN_PAPIER, className, aria, mitte, onHover }: SitzplanProps) {
  const plan = useMemo(() => baueSitzplan(lage.gesamt), [lage.gesamt]);
  // Die Fraktionen kommen bei jeder Zeichnung als neues Objekt an; entscheidend ist ihr Inhalt
  const signatur = lage.fraktionen.map((f) => `${f.partei}:${f.sitze}:${f.farbe}:${f.rolle}`).join("|");
  const fraktionen = useMemo(() => lage.fraktionen, [signatur]); // eslint-disable-line react-hooks/exhaustive-deps
  const partei = useMemo(() => belege(plan, fraktionen.map((f) => ({ partei: f.partei, sitze: f.sitze }))), [plan, fraktionen]);
  const farbe = useMemo(() => Object.fromEntries(fraktionen.map((f) => [f.partei, f.farbe])), [fraktionen]);
  const info = useMemo(() => Object.fromEntries(fraktionen.map((f) => [f.partei, f])), [fraktionen]);
  const [tipp, setTipp] = useState<{ i: number; x: number; y: number; b: number } | null>(null);

  const linie = useMemo(() => {
    if (!mehrheitslinie) return null;
    const a = grenzWinkel(plan, 300);
    const p = (r: number) => ({ x: plan.mitte.x + r * Math.cos(a), y: plan.mitte.y - r * Math.sin(a) });
    return { von: p(plan.innen - 12), bis: p(plan.aussen + 14), text: p(plan.aussen + 30) };
  }, [plan, mehrheitslinie]);

  // Die Zeigerfunktion bleibt dieselbe, damit der gezeichnete Teil nicht neu gebaut wird
  const neu = useRef({ partei, onHover });
  neu.current = { partei, onHover };
  const zeiger = useCallback((e: PointerEvent<SVGSVGElement>, weg: boolean) => {
    if (weg) {
      // Auf Touchgeräten löst das Loslassen „leave“ aus: Dort bleibt die Auskunft stehen, bis man woanders tippt
      if (e.pointerType !== "mouse") return;
      setTipp(null);
      neu.current.onHover?.(null);
      return;
    }
    const i = (e.target as SVGElement).dataset?.i;
    if (i === undefined) {
      setTipp(null);
      neu.current.onHover?.(null);
      return;
    }
    const box = e.currentTarget.getBoundingClientRect();
    const n = Number(i);
    setTipp({ i: n, x: e.clientX - box.left, y: e.clientY - box.top, b: box.width });
    neu.current.onHover?.(neu.current.partei[n] ?? null);
  }, []);

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
      <SitzKern plan={plan} partei={partei} farbe={farbe} modus={modus} zustand={zustand} votum={votum} sichtbar={sichtbar} hervor={hervor} farben={farben} linie={linie} aria={aria} zeiger={zeiger} />
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

export const Sitzplan = SitzplanRaw;
