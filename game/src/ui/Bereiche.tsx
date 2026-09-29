// Die Bereiche: Alle zwölf Themenfelder auf einen Blick — was akut ist,
// was wirkt, wohin es geht. Der Einstieg in jedes Feld.

import type { World } from "../sim/types";
import { NET } from "../sim/world";
import { activeProvinces, nationalAverage, startAverage } from "../sim/netz";
import { THEME_NAMES, type Theme } from "../data/politiknetz";

const nf = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

const ORDER: Theme[] = [
  "wirtschaft",
  "haushalt",
  "arbeit",
  "bildung",
  "gesundheit",
  "landwirtschaft",
  "energie",
  "infrastruktur",
  "wohnen",
  "sicherheit",
  "gesellschaft",
  "aussen",
];

export function Bereiche({ world, onOpenTheme }: { world: World; onOpenTheme: (t: Theme) => void }) {
  return (
    <div className="bereiche-grid">
      {ORDER.map((theme) => {
        const nodes = NET.nodes.filter((n) => n.theme === theme);
        const problems = nodes.filter((n) => n.kind === "problem");
        const akut = problems.filter((p) => activeProvinces(NET, world.net, p.id).length > 0);
        const massnahmen = nodes.filter((n) => n.kind === "massnahme");
        const groessen = nodes.filter((n) => n.kind === "groesse" && !n.input);
        // Drei repräsentative Größen: stärkste Abweichung vom Start zuerst
        const signale = groessen
          .map((n) => {
            const now = nationalAverage(NET, world.net, n.id);
            const start = startAverage(NET, world.net, n.id);
            return { name: n.name, now, delta: now - start };
          })
          .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
          .slice(0, 3);
        return (
          <button key={theme} className="bereiche-karte" onClick={() => onOpenTheme(theme)}>
            <h3>{THEME_NAMES[theme]}</h3>
            <p className="subtitle">
              {massnahmen.length} Maßnahmen · {problems.length} Problem{problems.length === 1 ? "" : "e"}
            </p>
            {akut.length > 0 && (
              <p className="bereiche-akut">
                <strong>{akut.length} akut:</strong> {akut.slice(0, 2).map((p) => p.name).join(", ")}
                {akut.length > 2 ? " …" : ""}
              </p>
            )}
            <ul className="bereiche-signale">
              {signale.map((s) => (
                <li key={s.name}>
                  <span>{s.name}</span>
                  <strong>
                    {nf(s.now)}
                    <em className={s.delta > 0.5 ? "plus" : s.delta < -0.5 ? "minus" : ""}>
                      {s.delta > 0.5 ? " ↑" : s.delta < -0.5 ? " ↓" : ""}
                    </em>
                  </strong>
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}
