// Chronik und Umfragen: der Verlauf der Zustimmung und die Ereignisse, auf die Sie geantwortet (oder nicht geantwortet) haben.

import type { World } from "../sim/types";
import { formatDateDe } from "../sim/dates";

function Verlauf({ werte }: { werte: number[] }) {
  if (werte.length < 2) return <p className="subtitle">Die erste Umfrage erscheint nach einem Monat im Amt.</p>;
  const W = 520;
  const H = 120;
  const min = Math.min(...werte, 30);
  const max = Math.max(...werte, 60);
  const x = (i: number) => 12 + (i / (werte.length - 1)) * (W - 24);
  const y = (v: number) => H - 14 - ((v - min) / (max - min)) * (H - 28);
  const d = werte.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg className="verlauf" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Verlauf der Zustimmung">
      <line x1="12" x2={W - 12} y1={y(50)} y2={y(50)} className="schwelle" />
      <text x={W - 12} y={y(50) - 4} textAnchor="end" className="schwelle-text">
        50 Prozent: Wahlsieg
      </text>
      <path d={d} className="linie" />
      <circle cx={x(werte.length - 1)} cy={y(werte[werte.length - 1]!)} r="3.5" className="punkt" />
    </svg>
  );
}

export function Chronik({ world }: { world: World }) {
  const spiel = world.spiel;
  if (!spiel) return null;
  const werte = spiel.umfrage.verlauf.map((v) => v.wert);
  return (
    <div className="chronik-akte">
      <section className="paper">
        <h3>Zustimmung</h3>
        <p className="subtitle">
          Heute {Math.round(spiel.umfrage.zustimmung)} Prozent. Wahl am {formatDateDe(new Date(Date.parse(spiel.start.datum + "T00:00:00Z") + spiel.wahltag * 86_400_000).toISOString().slice(0, 10))}, Amtszeit {spiel.amtszeit} von 2.
        </p>
        <Verlauf werte={werte} />
      </section>
      <section className="paper">
        <h3>Was geschah</h3>
        {spiel.chronik.length === 0 && <p className="subtitle">Noch nichts, das eine Antwort verlangt hätte.</p>}
        <ul className="chronik">
          {[...spiel.chronik].reverse().map((c, i) => (
            <li key={i}>
              <span className="wann">{formatDateDe(c.datum)}</span>
              <strong>{c.titel}</strong>
              <em>{c.ausgang}</em>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
