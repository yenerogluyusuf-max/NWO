// Themenübersicht des Politiknetzes: nach Themen gegliedert, darin nach Art (Maßnahmen, Größen, Probleme, Wählergruppen),
// mit Suche und einem Blick auf den Stand jeder Zeile.

import { useMemo, useState } from "react";
import { NET } from "../sim/modell";
import { activeProvinces, nationalAverage, startAverage } from "../sim/netz";
import { THEME_NAMES, type NodeSpec, type Theme } from "../data/politiknetz";
import type { World } from "../sim/types";

const ARTEN: { id: NodeSpec["kind"]; titel: string }[] = [
  { id: "massnahme", titel: "Maßnahmen" },
  { id: "groesse", titel: "Größen" },
  { id: "problem", titel: "Probleme" },
  { id: "gruppe", titel: "Wählergruppen" },
];

const THEMEN_ORDNUNG: Theme[] = ["wirtschaft", "haushalt", "arbeit", "gesundheit", "bildung", "infrastruktur", "energie", "landwirtschaft", "wohnen", "sicherheit", "recht", "militaer", "kultur", "gesellschaft", "aussen", "gruppen"];

function Zeile({ node, world, gewaehlt, onSelect }: { node: NodeSpec; world: World; gewaehlt: boolean; onSelect: (id: string) => void }) {
  const jetzt = nationalAverage(NET, world.net, node.id);
  const start = startAverage(NET, world.net, node.id);
  const d = jetzt - start;
  const akut = node.kind === "problem" ? activeProvinces(NET, world.net, node.id).length : 0;
  const ziel = node.kind === "massnahme" ? world.net.targets[node.id] : undefined;
  const laeuft = ziel !== undefined && Math.abs(jetzt - ziel) > 1;
  return (
    <button className={`nav-row kind-${node.kind}${gewaehlt ? " selected" : ""}${akut ? " acute" : ""}`} onClick={() => onSelect(node.id)} title={node.text}>
      <span className="nav-name">{node.name}</span>
      <span className="nav-wert">
        {node.kind === "problem" ? (
          akut > 0 ? <b className="akut">{akut} akut</b> : <em>ruhig</em>
        ) : node.input ? (
          <em>Modell</em>
        ) : (
          <>
            {laeuft && <i className="unterwegs" title={`Umsetzung läuft auf Stufe ${Math.round(ziel!)}`}>→ {Math.round(ziel!)}</i>}
            {Math.round(jetzt)}
            {Math.abs(d) >= 0.5 && <span className={d > 0 ? "auf" : "ab"}>{d > 0 ? "▲" : "▼"}</span>}
          </>
        )}
      </span>
    </button>
  );
}

export function NetNavigator({ world, selectedId, onSelect }: { world: World; selectedId: string; onSelect: (id: string) => void }) {
  const gewaehlt = NET.nodes[NET.index.get(selectedId)!]!;
  const [offen, setOffen] = useState<Set<Theme>>(() => new Set([gewaehlt.theme]));
  const [suche, setSuche] = useState("");
  const [art, setArt] = useState<NodeSpec["kind"] | "alle">("alle");

  const nachThema = useMemo(() => {
    const map = new Map<Theme, NodeSpec[]>();
    for (const n of NET.nodes) {
      if (!map.has(n.theme)) map.set(n.theme, []);
      map.get(n.theme)!.push(n);
    }
    return map;
  }, []);

  const q = suche.trim().toLocaleLowerCase("de");
  const treffer = q ? NET.nodes.filter((n) => (art === "alle" || n.kind === art) && (n.name.toLocaleLowerCase("de").includes(q) || n.text.toLocaleLowerCase("de").includes(q))) : [];

  const umschalten = (t: Theme) =>
    setOffen((o) => {
      const n = new Set(o);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });

  return (
    <nav className="paper net-nav" aria-label="Themen des Politiknetzes">
      <h2>Themen</h2>
      <p className="subtitle">
        {NET.nodes.length} Knoten · {NET.edges.length} Verbindungen
      </p>
      <input className="nav-suche" type="search" value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="Suchen: Wasser, Miete, Zins …" aria-label="Im Politiknetz suchen" />
      <div className="nav-art" role="group" aria-label="Art filtern">
        {[{ id: "alle" as const, titel: "Alle" }, ...ARTEN.slice(0, 3)].map((a) => (
          <button key={a.id} className={art === a.id ? "on" : ""} onClick={() => setArt(a.id)}>
            {a.titel}
          </button>
        ))}
      </div>

      {q ? (
        <div className="nav-treffer">
          <h4>
            {treffer.length} {treffer.length === 1 ? "Treffer" : "Treffer"}
          </h4>
          {treffer.length === 0 && <p className="subtitle">Nichts gefunden. Versuche ein anderes Wort.</p>}
          {ARTEN.map((a) => {
            const liste = treffer.filter((n) => n.kind === a.id);
            if (!liste.length) return null;
            return (
              <div key={a.id} className="nav-gruppe">
                <h5>{a.titel}</h5>
                {liste.map((n) => (
                  <Zeile key={n.id} node={n} world={world} gewaehlt={n.id === selectedId} onSelect={onSelect} />
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        THEMEN_ORDNUNG.map((t) => {
          const knoten = (nachThema.get(t) ?? []).filter((n) => art === "alle" || n.kind === art);
          if (!knoten.length) return null;
          const akut = knoten.filter((n) => n.kind === "problem" && activeProvinces(NET, world.net, n.id).length > 0).length;
          const istOffen = offen.has(t);
          return (
            <section key={t} className={`nav-thema${istOffen ? " offen" : ""}`}>
              <button className="nav-thema-kopf" onClick={() => umschalten(t)} aria-expanded={istOffen}>
                <span className="pfeil" aria-hidden>
                  {istOffen ? "▾" : "▸"}
                </span>
                <span className="nav-thema-name">{THEME_NAMES[t]}</span>
                {akut > 0 && <span className="badge">{akut} akut</span>}
                <span className="nav-anzahl">{knoten.length}</span>
              </button>
              {istOffen &&
                ARTEN.map((a) => {
                  const liste = knoten.filter((n) => n.kind === a.id);
                  if (!liste.length) return null;
                  return (
                    <div key={a.id} className="nav-gruppe">
                      <h5>{a.titel}</h5>
                      {liste.map((n) => (
                        <Zeile key={n.id} node={n} world={world} gewaehlt={n.id === selectedId} onSelect={onSelect} />
                      ))}
                    </div>
                  );
                })}
            </section>
          );
        })
      )}
    </nav>
  );
}
