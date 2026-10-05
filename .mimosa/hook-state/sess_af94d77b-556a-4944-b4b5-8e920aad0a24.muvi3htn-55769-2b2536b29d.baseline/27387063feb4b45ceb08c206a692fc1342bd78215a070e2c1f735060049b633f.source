// Kennzahlen eines Fachbereichs als Balken mit Trend: was der Bereich ist, ohne dass es Geld sein muss.

import { NET } from "../../sim/modell";
import { nationalAverage } from "../../sim/netz";
import { vorMonaten } from "../../sim/waehler";
import type { World } from "../../sim/types";

export interface GroesseDef {
  id: string;
  /** Höherer Wert ist schlechter (Überfüllung, Ausnahmerecht) */
  invers?: boolean;
  /** Kurzer Zusatz zum Namen, etwa der Anker aus der Wirklichkeit */
  zusatz?: string;
}

export function Groessen({ world, liste }: { world: World; liste: GroesseDef[] }) {
  return (
    <ul className="rr-groessen">
      {liste.map((g) => {
        const node = NET.nodes[NET.index.get(g.id) ?? -1];
        if (!node) return null;
        const jetzt = nationalAverage(NET, world.net, g.id);
        const frueher = vorMonaten(world, g.id, 3);
        const trend = frueher === null ? 0 : jetzt - frueher;
        const gut = g.invers ? jetzt < 50 : jetzt >= 50;
        const trendGut = g.invers ? trend < 0 : trend > 0;
        return (
          <li key={g.id} className={`rr-groesse ${gut ? "rr-ok" : "rr-mies"}`} title={node.text}>
            <span className="rr-groesse-name">{node.name}</span>
            <span className="rr-balken" aria-hidden>
              <i style={{ width: `${Math.max(2, Math.min(100, jetzt))}%` }} />
              <b style={{ left: "50%" }} />
            </span>
            <span className="rr-groesse-wert">
              {Math.round(jetzt)}
              {Math.abs(trend) >= 0.5 && (
                <em className={trendGut ? "hoch" : "runter"} title="Veränderung seit drei Monaten">
                  {trend > 0 ? "▲" : "▼"}
                </em>
              )}
            </span>
            {g.zusatz && <span className="rr-groesse-zusatz">{g.zusatz}</span>}
          </li>
        );
      })}
    </ul>
  );
}
