// Benannte Zustände statt „100 %“ (Befund G-12): Bestände ohne offene Stückzahl erscheinen als Abweichung vom Stand 2026, und die drei
// Teilstreitkräfte als Radar mit dem Stand 2026 als Bezug. Rechnet nichts selbst: Anteile kommen aus sim/streitkraefte.ts.

import { t, zahl } from "../../i18n";

/** „wie 2026“, „+12 % gegenüber 2026“ oder „−8 % gegenüber 2026“ für einen Anteil am Stand 2026 (1 = gleich). */
export function gegenueber2026(anteil: number): string {
  const p = Math.round((anteil - 1) * 100);
  if (p === 0) return t("nacht_n7.zustand.wie2026");
  return t("nacht_n7.zustand.abweichung", { p: `${p > 0 ? "+" : "−"}${zahl(Math.abs(p), 0)}` });
}

/** Ton einer Abweichung: Schwund ist schlecht, Zuwachs gut, Gleichstand neutral. */
export const abweichungsTon = (anteil: number): "gut" | "schlecht" | "neutral" => (anteil >= 1.02 ? "gut" : anteil <= 0.98 ? "schlecht" : "neutral");

export type Achse = { name: string; kampfkraft: number; bereitschaft: number };

/**
 * Radar mit drei Achsen (Heer, Luftwaffe, Marine): gestrichelt der Stand 2026, gefüllt die Kampfkraft aus Bestand und Technik, als Linie
 * die Einsatzbereitschaft (beide relativ zu 2026). Der äußere Ring ist das Anderthalbfache des Stands 2026.
 */
export function StreitkraefteRadar({ achsen }: { achsen: Achse[] }) {
  const R = 62;
  const MAX = 1.5;
  const mitte = { x: 130, y: 84 };
  const punkt = (i: number, wert: number) => {
    const w = -Math.PI / 2 + (i * 2 * Math.PI) / achsen.length;
    const r = (Math.max(0, Math.min(MAX, wert)) / MAX) * R;
    return { x: mitte.x + Math.cos(w) * r, y: mitte.y + Math.sin(w) * r };
  };
  const zug = (werte: number[]) => werte.map((v, i) => { const p = punkt(i, v); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ");
  return (
    <figure className="sk-radar" aria-label={t("nacht_n7.radar.aria")}>
      <svg viewBox="0 0 260 168" role="img">
        {[0.5, 1, 1.5].map((s) => (
          <polygon key={s} points={zug(achsen.map(() => s))} className={s === 1 ? "bezug" : "ring"} />
        ))}
        {achsen.map((_, i) => { const p = punkt(i, MAX); return <line key={i} x1={mitte.x} y1={mitte.y} x2={p.x} y2={p.y} className="achse" />; })}
        <polygon points={zug(achsen.map((a) => a.kampfkraft))} className="kraft" />
        <polygon points={zug(achsen.map((a) => a.bereitschaft))} className="bereit" />
        {achsen.map((a, i) => {
          const p = punkt(i, MAX * 1.12);
          return (
            <text key={a.name} x={p.x} y={p.y + (i === 0 ? -4 : 10)} textAnchor="middle" className="name">
              {a.name}
            </text>
          );
        })}
      </svg>
    </figure>
  );
}

/** Legende des Radars, als eigene Zeile neben dem Bild */
export function RadarLegende() {
  return (
    <p className="sk-radar-legende">
      <span className="kraft">{t("nacht_n7.radar.kraft")}</span>
      <span className="bereit">{t("nacht_n7.radar.bereit")}</span>
      <span className="bezug">{t("nacht_n7.radar.bezug")}</span>
    </p>
  );
}
