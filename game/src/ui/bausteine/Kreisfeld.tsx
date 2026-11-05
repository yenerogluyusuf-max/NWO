// Baustein „Kreisfeld“ (PLAN_OBERFLAECHE_DETAIL Teil 1, Q3, Vorbild Democracy 4): Gruppen als Kreise auf einer Achse von 0 bis 100
// (etwa Zustimmung), die Fläche nach ihrem Anteil. Kreise, die sich überdecken würden, weichen nach oben und unten aus. Ein Klick
// öffnet die Gruppe. Nur Anzeige; Werte und Anteile kommen vom Aufrufer.

import { t, zahl } from "../../i18n";
import "./bausteine.css";

export interface Kreis {
  id: string;
  name: string;
  /** Lage auf der Achse, 0 bis 100 */
  wert: number;
  /** Anteil an der Bevölkerung (0 bis 1); bestimmt die Fläche */
  anteil: number;
  farbe?: string;
}

const B = 640;
const H = 220;
const RMAX = 46;

/** Lage der Kreise: x aus dem Wert, Radius aus der Wurzel des Anteils, y so, dass sich keine zwei Kreise überdecken. */
export function kreisLage(kreise: Kreis[]): { id: string; x: number; y: number; r: number }[] {
  const maxAnteil = Math.max(0.0001, ...kreise.map((k) => k.anteil));
  const liste = [...kreise]
    .sort((a, b) => b.anteil - a.anteil)
    .map((k) => ({ id: k.id, x: 24 + (Math.min(100, Math.max(0, k.wert)) / 100) * (B - 48), r: Math.max(8, RMAX * Math.sqrt(k.anteil / maxAnteil)), y: H / 2 }));
  const gesetzt: typeof liste = [];
  for (const k of liste) {
    // abwechselnd oben und unten ausweichen, bis nichts mehr überlappt (das Feld wächst dafür in der Höhe)
    for (let schritt = 0; schritt < 400; schritt++) {
      const y = H / 2 + (schritt % 2 ? 1 : -1) * Math.ceil(schritt / 2) * 3;
      if (gesetzt.every((g) => Math.hypot(g.x - k.x, g.y - y) >= g.r + k.r + 2)) {
        k.y = y;
        break;
      }
    }
    gesetzt.push(k);
  }
  return gesetzt;
}

export function Kreisfeld({ kreise, titel, links, rechts, onKreis }: { kreise: Kreis[]; titel: string; links?: string; rechts?: string; onKreis?: (id: string) => void }) {
  const liste = kreisLage(kreise);
  const lage = new Map(liste.map((l) => [l.id, l]));
  // Höhe nach den Kreisen: mindestens H, sonst so weit, wie sie nach oben und unten ausgewichen sind
  const oben = Math.min(0, ...liste.map((l) => l.y - l.r - 4));
  const unten = Math.max(H, ...liste.map((l) => l.y + l.r + 4));
  return (
    <figure className="bs-kreisfeld">
      <svg viewBox={`0 ${oben} ${B} ${unten - oben + 22}`} role="img" aria-label={titel}>
        <line x1="24" x2={B - 24} y1={H / 2} y2={H / 2} className="bs-kreis-achse" />
        <line x1={B / 2} x2={B / 2} y1={oben + 8} y2={unten - 8} className="bs-kreis-mitte" />
        <text x="24" y={unten + 16} className="bs-kreis-rand">{links ?? t("bs.kreis.links")}</text>
        <text x={B - 24} y={unten + 16} textAnchor="end" className="bs-kreis-rand">{rechts ?? t("bs.kreis.rechts")}</text>
        {kreise.map((k) => {
          const l = lage.get(k.id)!;
          return (
            <g key={k.id} className={onKreis ? "bs-kreis klickbar" : "bs-kreis"} onClick={() => onKreis?.(k.id)} role={onKreis ? "button" : undefined} tabIndex={onKreis ? 0 : undefined} onKeyDown={(e) => { if (onKreis && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onKreis(k.id); } }}>
              <circle cx={l.x} cy={l.y} r={l.r} fill={k.farbe ?? "#7c5823"} />
              <title>{t("bs.kreis.aria", { name: k.name, wert: zahl(Math.round(k.wert), 0), anteil: `${zahl(k.anteil * 100, 0)} %` })}</title>
              {l.r >= 20 && <text x={l.x} y={l.y + 4} textAnchor="middle" className="bs-kreis-name">{k.name.length > 12 ? `${k.name.slice(0, 11)}…` : k.name}</text>}
            </g>
          );
        })}
      </svg>
      <figcaption>{titel}</figcaption>
    </figure>
  );
}
