// Legende der Kartenebene: sagt, was die Farben bedeuten, und lässt bei „Akute Probleme“ das Problem wählen.

import { NET } from "../sim/world";
import { PROVINCES } from "../sim/netz";
import type { World } from "../sim/types";
import type { Kartenebene, Legende } from "./ebenen";

export function Kartenlegende({ world, ebene, legende, problemId, onProblem }: { world: World; ebene: Kartenebene; legende: Legende | undefined; problemId: string | null; onProblem: (id: string | null) => void }) {
  if (!legende && ebene === "gelaende") {
    return (
      <aside className="cartouche" aria-hidden>
        <div className="cartouche-title" lang="tr">Türkiye</div>
        <div className="cartouche-sub">81 Provinzen · Stand {world.date.slice(0, 4)}</div>
      </aside>
    );
  }
  const probleme =
    ebene === "probleme"
      ? NET.nodes
          .filter((n) => n.kind === "problem")
          .map((n) => {
            let c = 0;
            const i = NET.index.get(n.id)!;
            for (let p = 0; p < PROVINCES; p++) if (world.net.values[i * PROVINCES + p]! >= n.threshold!) c++;
            return { id: n.id, name: n.name, c };
          })
          .filter((x) => x.c > 0)
          .sort((a, b) => b.c - a.c)
      : [];
  return (
    <aside className="cartouche legend" aria-label={`Legende ${legende?.titel ?? ""}`}>
      <div className="cartouche-title small">{legende?.titel}</div>
      {legende?.untertitel && <div className="cartouche-sub">{legende.untertitel}</div>}
      {legende?.eintraege && (
        <ul>
          {legende.eintraege.map((e) => (
            <li key={e.text}>
              <span className="swatch" style={{ background: e.farbe }} />
              <span>{e.text}</span>
            </li>
          ))}
        </ul>
      )}
      {legende?.verlauf && (
        <div className="legend-scale">
          <span className="legend-bar" style={{ background: `linear-gradient(90deg, ${legende.verlauf.von}, ${legende.verlauf.mitte ? `${legende.verlauf.mitte}, ` : ""}${legende.verlauf.bis})` }} />
          <span className="legend-ends">
            <em>{legende.verlauf.vonText}</em>
            <em>{legende.verlauf.bisText}</em>
          </span>
        </div>
      )}
      {ebene === "probleme" && (
        <ul className="legend-problems">
          <li>
            <button className={problemId === null ? "on" : ""} onClick={() => onProblem(null)}>
              Alle zusammen
            </button>
          </li>
          {probleme.map((p) => (
            <li key={p.id}>
              <button className={problemId === p.id ? "on" : ""} onClick={() => onProblem(p.id)}>
                {p.name} <b>{p.c}</b>
              </button>
            </li>
          ))}
        </ul>
      )}
      {legende?.hinweis && <p className="legend-note">{legende.hinweis}</p>}
    </aside>
  );
}
