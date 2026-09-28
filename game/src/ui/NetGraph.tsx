// Das Politiknetz als Zeichnung: links, was den Knoten treibt, rechts, was er bewirkt.
// Blaue Pfeile erhöhen, rote senken; gestrichelt heißt, die Wirkung kommt verzögert.

import { NET } from "../sim/world";
import type { NodeSpec } from "../data/politiknetz";

const W = 640;
const COL_L = 96;
const COL_R = W - 96;
const BOX_W = 150;
const ROW = 46;
const MAX = 7;

function lines(name: string): string[] {
  if (name.length <= 19) return [name];
  const words = name.split(" ");
  const out = [""];
  for (const w of words) {
    const cur = out[out.length - 1]!;
    if ((cur + " " + w).trim().length > 19 && cur) out.push(w);
    else out[out.length - 1] = (cur + " " + w).trim();
  }
  return out.slice(0, 2);
}

function NodeBox({ node, x, y, main, onClick }: { node: NodeSpec; x: number; y: number; main?: boolean; onClick?: () => void }) {
  const w = main ? 176 : BOX_W;
  const h = main ? 56 : 36;
  const ls = lines(node.name);
  const stroke = node.kind === "problem" ? "#8e2a22" : "#2a1f18";
  return (
    <g className={`ng-node kind-${node.kind}${main ? " main" : ""}`} transform={`translate(${x - w / 2} ${y - h / 2})`} onClick={onClick} role={onClick ? "button" : undefined}>
      <title>{node.name}</title>
      {node.kind === "gruppe" ? (
        <rect width={w} height={h} rx={h / 2} fill="#e9efe9" stroke={stroke} />
      ) : (
        <rect width={w} height={h} rx="2" fill={main ? "#fbf3dc" : node.kind === "massnahme" ? "#f6ebcf" : "#fbf7ea"} stroke={stroke} strokeWidth={main ? 1.6 : 1} />
      )}
      {node.kind === "massnahme" && <rect x="3" y="3" width={w - 6} height={h - 6} rx="1" fill="none" stroke={stroke} strokeOpacity="0.45" />}
      {node.kind === "problem" && <path d={`M${w - 14} 4 l6 10 h-12 Z`} fill="#8e2a22" />}
      {ls.map((l, i) => (
        <text key={i} x={w / 2} y={h / 2 + (i - (ls.length - 1) / 2) * (main ? 17 : 13) + (main ? 6 : 4.5)} textAnchor="middle" className="ng-label">
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

  const arrow = (x1: number, y1: number, x2: number, y2: number, weight: number, lag: number, key: string, labelAt: number) => {
    const mx = (x1 + x2) / 2;
    // Punkt auf der Kurve, an dem die Verzögerung steht: weg vom gemeinsamen Mittelknoten
    const t = labelAt;
    const bx = x1 * (1 - t) ** 3 + 3 * mx * (1 - t) ** 2 * t + 3 * mx * (1 - t) * t ** 2 + x2 * t ** 3;
    const by = y1 + (y2 - y1) * (3 * t * t - 2 * t * t * t);
    const color = weight > 0 ? "#265a62" : "#8e2a22";
    const width = 0.8 + Math.min(2.2, Math.abs(weight) * 4);
    return (
      <g key={key}>
        <path d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={width} strokeDasharray={lag > 0 ? "5 3" : undefined} markerEnd={`url(#ng-${weight > 0 ? "plus" : "minus"})`} />
        {lag > 0 && (
          <text x={bx} y={by - 4} textAnchor="middle" className="ng-lag">
            {lag} Mon.
          </text>
        )}
      </g>
    );
  };

  return (
    <svg className="netgraph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Ursachen und Wirkungen von ${node.name}`}>
      <defs>
        <marker id="ng-plus" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="#265a62" />
        </marker>
        <marker id="ng-minus" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill="#8e2a22" />
        </marker>
      </defs>
      <text x={COL_L} y="14" textAnchor="middle" className="ng-head">Ursachen</text>
      <text x={COL_R} y="14" textAnchor="middle" className="ng-head">Wirkungen</text>
      {causes.map((e, i) => arrow(COL_L + BOX_W / 2, yAt(i, causes.length), W / 2 - 90, cy, e.weight, e.lag, `c${e.from}`, 0.3))}
      {effects.map((e, i) => arrow(W / 2 + 90, cy, COL_R - BOX_W / 2 - 2, yAt(i, effects.length), e.weight, e.lag, `e${e.to}`, 0.72))}
      {causes.map((e, i) => (
        <NodeBox key={e.from} node={get(e.from)} x={COL_L} y={yAt(i, causes.length)} onClick={() => onSelect(e.from)} />
      ))}
      {effects.map((e, i) => (
        <NodeBox key={e.to} node={get(e.to)} x={COL_R} y={yAt(i, effects.length)} onClick={() => onSelect(e.to)} />
      ))}
      {causes.length === 0 && (
        <text x={COL_L} y={cy + 4} textAnchor="middle" className="ng-empty">{node.input ? "aus dem Wirtschaftsmodell" : "wird entschieden"}</text>
      )}
      <NodeBox node={node} x={W / 2} y={cy} main />
    </svg>
  );
}
