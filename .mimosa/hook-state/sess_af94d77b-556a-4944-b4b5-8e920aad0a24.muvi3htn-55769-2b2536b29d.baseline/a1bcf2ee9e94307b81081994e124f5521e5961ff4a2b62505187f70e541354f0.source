// Legende der Kartenebene: sagt, was die Farben bedeuten, und lässt bei „Akute Probleme“ das Problem wählen.
// Die Legende sitzt klein neben dem Knopf der Linsenwahl (ui/linsen); die Plakette „Türkiye“ ist reiner Schmuck der Grundkarte.

import { useState } from "react";
import { NET } from "../sim/world";
import { PROVINCES } from "../sim/netz";
import type { World } from "../sim/types";
import type { Kartenebene, Legende } from "./ebenen";
import { Icon } from "./icons";
import { aktuelleSprache } from "../i18n";

/** Schmuckplakette der Grundkarte; bei jeder eingefärbten Ebene übernimmt die Legende neben der Linsenwahl. */
export function Plakette({ world, ebene }: { world: World; ebene: Kartenebene }) {
  if (ebene !== "gelaende") return null;
  const s = aktuelleSprache();
  const sub = s === "tr" ? `81 İl · ${world.date.slice(0, 4)}` : s === "en" ? `81 Provinces · ${world.date.slice(0, 4)}` : `81 Provinzen · Stand ${world.date.slice(0, 4)}`;
  return (
    <aside className="cartouche" aria-hidden>
      <div className="cartouche-title" lang="tr">Türkiye</div>
      <div className="cartouche-sub">{sub}</div>
    </aside>
  );
}

/** Alle Probleme, die irgendwo über der Schwelle liegen, mit der Zahl der betroffenen Provinzen (größte zuerst) */
function problemeListe(world: World): { id: string; name: string; c: number }[] {
  return NET.nodes
    .filter((n) => n.kind === "problem")
    .map((n) => {
      let c = 0;
      const i = NET.index.get(n.id)!;
      for (let p = 0; p < PROVINCES; p++) if (world.net.values[i * PROVINCES + p]! >= n.threshold!) c++;
      return { id: n.id, name: n.name, c };
    })
    .filter((x) => x.c > 0)
    .sort((a, b) => b.c - a.c);
}

/**
 * Kleine Legende: im Leerlauf Titel und Farbstreifen, auf Wunsch aufgeklappt mit allen Einträgen, Hinweis und (bei „Akute Probleme“) der Problemwahl.
 * `mehrStart` ist für den Test des aufgeklappten Zustands ohne Browser.
 */
export function LegendeKompakt({ world, ebene, legende, problemId, onProblem, mehrStart = false }: { world: World; ebene: Kartenebene; legende: Legende | undefined; problemId: string | null; onProblem: (id: string | null) => void; mehrStart?: boolean }) {
  const [mehr, setMehr] = useState(mehrStart);
  if (!legende) return null;
  const probleme = ebene === "probleme" ? problemeListe(world) : [];
  const gewaehltesProblem = problemId ? probleme.find((p) => p.id === problemId) : undefined;
  const hatDetails = !!legende.hinweis || probleme.length > 0 || (!!legende.eintraege && legende.eintraege.length > 4);
  const eintraege = legende.eintraege ?? [];
  return (
    <aside className={`linsen-legende${mehr ? " mehr" : ""}`} aria-label={`Legende ${legende.titel}`}>
      <div className="linsen-legende-kopf">
        <div className="linsen-legende-titel">
          <strong>{legende.titel}</strong>
          {legende.untertitel && <span>{legende.untertitel}</span>}
        </div>
        {hatDetails && (
          <button type="button" className="linsen-legende-mehr" onClick={() => setMehr((m) => !m)} aria-expanded={mehr} aria-label={mehr ? "Legende einklappen" : "Legende ausklappen"} title={mehr ? "Einklappen" : "Mehr zur Legende"}>
            <Icon name="chevron" size={16} />
          </button>
        )}
      </div>
      {legende.verlauf && (
        <div className="legend-scale">
          <span className="legend-bar" style={{ background: `linear-gradient(90deg, ${legende.verlauf.von}, ${legende.verlauf.mitte ? `${legende.verlauf.mitte}, ` : ""}${legende.verlauf.bis})` }} />
          <span className="legend-ends">
            <em>{legende.verlauf.vonText}</em>
            <em>{legende.verlauf.bisText}</em>
          </span>
        </div>
      )}
      {eintraege.length > 0 && !mehr && (
        <ul className="linsen-legende-reihe">
          {eintraege.slice(0, 4).map((e) => (
            <li key={e.text}>
              <span className="swatch" style={{ background: e.farbe }} />
              <span>{e.text}</span>
            </li>
          ))}
          {eintraege.length > 4 && <li className="rest">+{eintraege.length - 4}</li>}
        </ul>
      )}
      {eintraege.length > 0 && mehr && (
        <ul className="linsen-legende-liste">
          {eintraege.map((e) => (
            <li key={e.text}>
              <span className="swatch" style={{ background: e.farbe }} />
              <span>{e.text}</span>
            </li>
          ))}
        </ul>
      )}
      {ebene === "probleme" && (
        <div className="linsen-legende-problem">
          {gewaehltesProblem ? (
            <button type="button" className="on" onClick={() => onProblem(null)} title="Auswahl aufheben">
              {gewaehltesProblem.name} <b>{gewaehltesProblem.c}</b> <span aria-hidden>×</span>
            </button>
          ) : (
            !mehr && probleme.length > 0 && <span className="hinweis">Aufklappen, um ein Problem zu wählen</span>
          )}
        </div>
      )}
      {ebene === "probleme" && mehr && (
        <ul className="legend-problems">
          <li>
            <button type="button" className={problemId === null ? "on" : ""} onClick={() => onProblem(null)}>
              Alle zusammen
            </button>
          </li>
          {probleme.map((p) => (
            <li key={p.id}>
              <button type="button" className={problemId === p.id ? "on" : ""} onClick={() => onProblem(p.id)}>
                {p.name} <b>{p.c}</b>
              </button>
            </li>
          ))}
        </ul>
      )}
      {legende.hinweis && mehr && <p className="legend-note">{legende.hinweis}</p>}
    </aside>
  );
}
