import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import { NET, setPolicy } from "../sim/world";
import { activeProvinces, nationalAverage, startAverage } from "../sim/netz";
import { outlookMany, type Metric, type Outlook } from "../sim/forecast";
import { NetGraph } from "./NetGraph";
import { THEME_NAMES, type NodeSpec, type Theme } from "../data/politiknetz";

const KIND_LABEL: Record<NodeSpec["kind"], string> = {
  massnahme: "Maßnahme",
  groesse: "Größe",
  problem: "Problem",
  gruppe: "Wählergruppe",
};

const DIRECTION: Record<Outlook["direction"], string> = {
  hoeher: "eher höher",
  niedriger: "eher niedriger",
  unklar: "kaum Unterschied",
};

const nf = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

export function NetView({ world, onDecided, onShowOnMap, initialTheme }: { world: World; onDecided: () => void; onShowOnMap?: (id: string) => void; initialTheme?: Theme }) {
  const [openTheme, setOpenTheme] = useState<Theme | null>(initialTheme ?? "wirtschaft");
  const [selectedId, setSelectedId] = useState<string>("m_mindestlohn");
  const [level, setLevel] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ level: number; rows: { label: string; o: Outlook }[] } | null>(null);

  const themes = useMemo(() => {
    const map = new Map<Theme, NodeSpec[]>();
    for (const n of NET.nodes) {
      if (!map.has(n.theme)) map.set(n.theme, []);
      map.get(n.theme)!.push(n);
    }
    return [...map.entries()];
  }, []);

  const node = NET.nodes[NET.index.get(selectedId)!]!;
  const now = nationalAverage(NET, world.net, node.id);
  const start = startAverage(NET, world.net, node.id);
  const causes = NET.edges.filter((e) => e.to === node.id);
  const effects = NET.edges.filter((e) => e.from === node.id);
  const nameOf = (id: string) => NET.nodes[NET.index.get(id)!]!.name;
  const currentTarget = world.net.targets[node.id] ?? Math.round(now);
  const sliderValue = level ?? currentTarget;

  function select(id: string) {
    setSelectedId(id);
    if (!NET.nodes[NET.index.get(id)!]!.input && NET.nodes[NET.index.get(id)!]!.kind !== "massnahme") onShowOnMap?.(id);
    setLevel(null);
    setPreview(null);
  }

  function runPreview() {
    const target = sliderValue;
    const metrics: { label: string; m: Metric }[] = [
      { label: "Inflation", m: "inflation" },
      { label: "Wachstum", m: "growth" },
      ...effects.slice(0, 4).map((e) => ({ label: nameOf(e.to), m: `net:${e.to}` as Metric })),
    ];
    const outs = outlookMany(world, (w) => setPolicy(w, node.id, target), metrics.map((x) => x.m), 12, 10);
    setPreview({ level: target, rows: metrics.map((x, k) => ({ label: x.label, o: outs[k]! })) });
  }

  return (
    <div className="netview">
      <nav className="paper net-themes" aria-label="Themenfelder">
        <h2>Themen</h2>
        <p className="subtitle">{NET.nodes.length} Knoten · {NET.edges.length} Verbindungen</p>
        {themes.map(([theme, nodes]) => {
          const problems = nodes.filter((n) => n.kind === "problem" && activeProvinces(NET, world.net, n.id).length > 0);
          return (
            <div key={theme} className="theme">
              <button className="theme-head" onClick={() => setOpenTheme(openTheme === theme ? null : theme)}>
                <span>{THEME_NAMES[theme]}</span>
                {problems.length > 0 && <span className="badge">{problems.length} akut</span>}
              </button>
              {openTheme === theme && (
                <ul className="chips">
                  {nodes.map((n) => {
                    const active = n.kind === "problem" ? activeProvinces(NET, world.net, n.id).length : 0;
                    return (
                      <li key={n.id}>
                        <button
                          className={`chip kind-${n.kind}${n.id === selectedId ? " selected" : ""}${active ? " acute" : ""}`}
                          onClick={() => select(n.id)}
                        >
                          {n.name}
                          {active > 0 && <span className="count">{active}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <section className="paper net-detail">
        <div className="net-main">
        <p className="kind-label">{KIND_LABEL[node.kind]} · {THEME_NAMES[node.theme]}</p>
        <h2>{node.name}</h2>
        <p>{node.text}</p>
        <p className="valueline">
          Landesdurchschnitt <strong>{nf(now)}</strong>
          {!node.input && <span className="subtitle"> (Index 0–100; beim Amtsantritt {nf(start)})</span>}
          {node.kind === "problem" && (
            <span className="subtitle">
              {" "}
              · akut ab {node.threshold} · in {activeProvinces(NET, world.net, node.id).length} Provinzen akut
            </span>
          )}
        </p>

        <NetGraph nodeId={node.id} onSelect={select} />
        </div>
        <aside className="net-side">
        {node.kind === "massnahme" && (
          <div className="policy">
            <label>
              Stufe: <strong>{sliderValue}</strong>
              {world.net.targets[node.id] !== undefined && Math.round(now) !== world.net.targets[node.id] && (
                <span className="subtitle"> · in Umsetzung, derzeit {Math.round(now)}</span>
              )}
              <input
                type="range"
                min={0}
                max={100}
                value={sliderValue}
                onChange={(ev) => {
                  setLevel(Number(ev.target.value));
                  setPreview(null);
                }}
              />
            </label>
            <div className="impl-bar" aria-hidden="true">
              <div className="impl-now" style={{ width: `${Math.max(0, Math.min(100, now))}%` }} />
              <div className="impl-target" style={{ left: `${Math.max(0, Math.min(100, sliderValue))}%` }} />
            </div>
            <div className="costbox">
              <div>
                <span>Kosten heute</span>
                <strong>
                  {nf(((node.cost ?? 0) * now) / 100)} % BIP/Jahr
                </strong>
              </div>
              <div>
                <span>Bei Stufe {sliderValue}</span>
                <strong>
                  {nf(((node.cost ?? 0) * sliderValue) / 100)} % BIP/Jahr
                </strong>
              </div>
              <div>
                <span>Änderung</span>
                <strong className={sliderValue * (node.cost ?? 0) > now * (node.cost ?? 0) ? "minus" : "plus"}>
                  {nf((((node.cost ?? 0) * (sliderValue - now)) / 100))} % BIP/Jahr
                </strong>
              </div>
              <div>
                <span>Umsetzung</span>
                <strong>~{node.months} Monat{node.months === 1 ? "" : "e"}</strong>
              </div>
            </div>
            <div className="confirm">
              <button onClick={runPreview} disabled={sliderValue === currentTarget}>
                Vorschau
              </button>
              {preview && preview.level === sliderValue && (
                <button
                  className="primary"
                  onClick={() => {
                    setPolicy(world, node.id, sliderValue);
                    setPreview(null);
                    setLevel(null);
                    onDecided();
                  }}
                >
                  Beschließen
                </button>
              )}
            </div>
            {preview && (
              <>
                <p className="preview-kosten">
                  Kosten der Änderung: <strong>{nf(((node.cost ?? 0) * (sliderValue - currentTarget)) / 100)} % des BIP pro Jahr</strong> — sofort im Haushalt, Wirkung dauert {node.months} Monat{node.months === 1 ? "" : "e"}.
                </p>
                <table className="preview">
                  <caption>In zwölf Monaten, verglichen mit „nichts ändern“</caption>
                <tbody>
                  {preview.rows.map(({ label, o }) => (
                    <tr key={label}>
                      <th>{label}</th>
                      <td>{DIRECTION[o.direction]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            )}
          </div>
        )}

        <div className="links">
          <div>
            <h3>Ursachen</h3>
            {node.input && <p className="subtitle">Kommt aus dem Wirtschaftsmodell.</p>}
            {causes.length === 0 && !node.input && <p className="subtitle">Wird direkt entschieden.</p>}
            <ul>
              {causes.map((e) => (
                <li key={e.from}>
                  <button className="link" onClick={() => select(e.from)}>{nameOf(e.from)}</button>{" "}
                  <span className={e.weight > 0 ? "plus" : "minus"}>{e.weight > 0 ? "↑ erhöht" : "↓ senkt"}</span>
                  {e.lag > 0 && <span className="subtitle"> · nach {e.lag} Mon.</span>}
                  <div className="why">{e.why}</div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Wirkungen</h3>
            <ul>
              {effects.map((e) => (
                <li key={e.to}>
                  <button className="link" onClick={() => select(e.to)}>{nameOf(e.to)}</button>{" "}
                  <span className={e.weight > 0 ? "plus" : "minus"}>{e.weight > 0 ? "↑ erhöht" : "↓ senkt"}</span>
                  {e.lag > 0 && <span className="subtitle"> · nach {e.lag} Mon.</span>}
                  <div className="why">{e.why}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        </aside>
      </section>


    </div>
  );
}
