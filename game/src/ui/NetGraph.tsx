// Das Politiknetz als Zeichnung: links, was den Knoten treibt, rechts, was er bewirkt.
// Grüne bzw. blaue Pfeile erhöhen, rote senken; gestrichelt heißt, die Wirkung kommt verzögert („nach 3 Monaten“).
// Mit der Maus über einer Linie erscheint die Begründung.

import { NET } from "../sim/world";
import type { NodeSpec, EdgeSpec } from "../data/politiknetz";
import { wann } from "./lernen";

const W = 1020;
const COL_L = 132;
const COL_R = W - 132;
const BOX_W = 208;
const ROW = 62;
const MAX = 8;

function lines(name: string): string[] {
  if (name.length <= 17) return [name];
  const words = name.split(" ");
  const out = [""];
  for (const w of words) {
    const cur = out[out.length - 1]!;
    if ((cur + " " + w).trim().length > 17 && cur) out.push(w);
    else out[out.length - 1] = (cur + " " + w).trim();
  }
  return out.slice(0, 2);
}

function NodeBox({ node, x, y, main, onClick }: { node: NodeSpec; x: number; y: number; main?: boolean; onClick?: () => void }) {
  const w = main ? 264 : BOX_W;
  const h = main ? 74 : 48;
  const ls = lines(node.name);
  const stroke = node.kind === "problem" ? "#8e2a22" : "#2a1f18";
  return (
    <g className={`ng-node kind-${node.kind}${main ? " main" : ""}`} transform={`translate(${x - w / 2} ${y - h / 2})`} onClick={onClick} role={onClick ? "button" : undefined}>
      <title>{node.name}</title>
      {node.kind === "gruppe" ? (
        <rect width={w} height={h} rx={h / 2} fill="#e9efe9" stroke={stroke} />
      ) : (
        <rect width={w} height={h} rx="2" fill={main ? "#fbf3dc" : node.kind === "massnahme" ? "#f6ebcf" : "#fbf7ea"} stroke={stroke} strokeWidth={main ? 1.8 : 1.1} />
      )}
      {node.kind === "massnahme" && <rect x="4" y="4" width={w - 8} height={h - 8} rx="1" fill="none" stroke={stroke} strokeOpacity="0.45" />}
      {node.kind === "problem" && <path d={`M${w - 18} 5 l8 13 h-16 Z`} fill="#8e2a22" />}
      {ls.map((l, i) => (
        <text key={i} x={w / 2} y={h / 2 + (i - (ls.length - 1) / 2) * (main ? 21 : 17) + (main ? 7 : 6)} textAnchor="middle" className="ng-label">
          {l}
        </text>
      ))}
    </g>
  );
}

export function NetGraph({ nodeId, onSelect }: { nodeId: string; onSelect: (id: string) => void }) {
  const node = NET.nodes[NET.index.get(nodeId)!]!;
  const causes = NET.edges.filter((e) => e.to === nodeId).sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, MAX);
  const effects = NET.edges.filter((e) => e.from === nodeId).sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, MAX);
  const rows = Math.max(causes.length, effects.length, 3);
  const H = rows * ROW + 40;
  const cy = H / 2;
  const yAt = (i: number, n: number) => cy + (i - (n - 1) / 2) * ROW;
  const get = (id: string) => NET.nodes[NET.index.get(id)!]!;

  const arrow = (x1: number, y1: number, x2: number, y2: number, e: EdgeSpec, key: string, labelAt: number) => {
    const { weight, lag } = e;
    const mx = (x1 + x2) / 2;
    // Punkt auf der Kurve, an dem die Verzögerung steht: weg vom gemeinsamen Mittelknoten
    const t = labelAt;
    const bx = x1 * (1 - t) ** 3 + 3 * mx * (1 - t) ** 2 * t + 3 * mx * (1 - t) * t ** 2 + x2 * t ** 3;
    const by = y1 + (y2 - y1) * (3 * t * t - 2 * t * t * t);
    const color = weight > 0 ? "#265a62" : "#8e2a22";
    const width = 0.8 + Math.min(2.2, Math.abs(weight) * 4);
    const d = `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
    return (
      <g key={key} className="ng-kante">
        <title>{`${get(e.from).name} ${weight > 0 ? "erhöht" : "senkt"} ${get(e.to).name}, ${wann(lag)}. ${e.why}`}</title>
        <path d={d} fill="none" stroke="transparent" strokeWidth="14" />
        <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={lag > 0 ? "6 4" : undefined} markerEnd={`url(#ng-${weight > 0 ? "plus" : "minus"})`} />
        {lag > 0 && (
          <text x={bx} y={by - 5} textAnchor="middle" className="ng-lag">
            {wann(lag)}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="netgraph-block">
    <svg className="netgraph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Ursachen und Wirkungen von ${node.name}`}>
      <defs>
        <marker id="ng-plus" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="#265a62" />
        </marker>
        <marker id="ng-minus" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="#8e2a22" />
        </marker>
        <marker id="ng-ink" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="#2a1f18" />
        </marker>
      </defs>
      <text x={COL_L} y="14" textAnchor="middle" className="ng-head">Ursachen</text>
      <text x={COL_R} y="14" textAnchor="middle" className="ng-head">Wirkungen</text>
      {causes.map((e, i) => arrow(COL_L + BOX_W / 2, yAt(i, causes.length), W / 2 - 132, cy, e, `c${e.from}`, 0.3))}
      {effects.map((e, i) => arrow(W / 2 + 132, cy, COL_R - BOX_W / 2 - 2, yAt(i, effects.length), e, `e${e.to}`, 0.72))}
      {causes.map((e, i) => (
        <NodeBox key={e.from} node={get(e.from)} x={COL_L} y={yAt(i, causes.length)} onClick={() => onSelect(e.from)} />
      ))}
      {effects.map((e, i) => (
        <NodeBox key={e.to} node={get(e.to)} x={COL_R} y={yAt(i, effects.length)} onClick={() => onSelect(e.to)} />
      ))}
      {causes.length === 0 && (
        <g>
          <path d={`M${COL_L + 40} ${cy} C${W / 4} ${cy} ${W / 4} ${cy} ${W / 2 - 132} ${cy}`} fill="none" stroke="#2a1f18" strokeWidth="1.5" strokeDasharray={node.input ? "5 3" : undefined} markerEnd="url(#ng-ink)" />
          <circle cx={COL_L} cy={cy} r="34" fill={node.input ? "#265a62" : "#8e2a22"} stroke="#2a1f18" />
          <circle cx={COL_L} cy={cy} r="27" fill="none" stroke="#f6dcc2" strokeOpacity="0.5" strokeDasharray="1 2" />
          <text x={COL_L} y={cy + 7} textAnchor="middle" className="ng-seal">{node.input ? "₺" : "§"}</text>
          <text x={COL_L} y={cy + 56} textAnchor="middle" className="ng-empty">{node.input ? "aus dem Wirtschaftsmodell" : "Beschluss der Regierung"}</text>
        </g>
      )}
      <NodeBox node={node} x={W / 2} y={cy} main />
    </svg>
    <ul className="ng-legende" aria-label="Legende des Bildes">
      <li>
        <svg width="34" height="10" aria-hidden><line x1="0" y1="5" x2="30" y2="5" stroke="#265a62" strokeWidth="2" /><path d="M26 1 L33 5 L26 9 Z" fill="#265a62" /></svg>
        <span>erhöht</span>
      </li>
      <li>
        <svg width="34" height="10" aria-hidden><line x1="0" y1="5" x2="30" y2="5" stroke="#8e2a22" strokeWidth="2" /><path d="M26 1 L33 5 L26 9 Z" fill="#8e2a22" /></svg>
        <span>senkt</span>
      </li>
      <li>
        <svg width="34" height="10" aria-hidden><line x1="0" y1="5" x2="30" y2="5" stroke="#2a1f18" strokeWidth="2" /></svg>
        <span>wirkt sofort</span>
      </li>
      <li>
        <svg width="34" height="10" aria-hidden><line x1="0" y1="5" x2="30" y2="5" stroke="#2a1f18" strokeWidth="2" strokeDasharray="6 4" /></svg>
        <span>wirkt verzögert: „nach 3 Monaten“ heißt, die Wirkung kommt erst drei Monate nach der Änderung an</span>
      </li>
      <li className="hinweis">Dickere Linie = stärkere Wirkung. Über eine Linie fahren zeigt die Begründung.</li>
    </ul>
    </div>
  );
}
