// Das Politiknetz als Zeichnung: links, was den Knoten treibt, rechts, was er bewirkt.
// Grüne bzw. blaue Pfeile erhöhen, rote senken; gestrichelt heißt, die Wirkung kommt verzögert („nach 3 Monaten“).
// Mit der Maus über einer Linie erscheint die Begründung.

import { NET } from "../sim/world";
import type { NodeSpec, EdgeSpec } from "../data/politiknetz";
import { wann } from "./lernen";

import { t } from "../i18n";
import { t as tx } from "../i18n";
// Die Zeichnung hat etwa die Breite der Spalte (W rund 550 bis 620 bei rund 460 px), damit die Schrift nach dem Verkleinern lesbar
// bleibt (vorher W = 820 in einer 400-px-Spalte: 8 px Schrift). Die Kästen stehen je Spalte nach ihrer Höhe gestapelt, nicht in
// festen Zeilen; ohne Ursachen ist die linke Spalte nur so breit wie das Siegel.
const BOX_W = 156;
const MAX = 8;
/** Breite der linken Spalte: Kästen der Ursachen oder, ohne Ursachen, nur das Siegel „Beschluss der Regierung“ */
const LINKS_KAESTEN = BOX_W + 12;
const LINKS_SIEGEL = 116;
/** Lücken zwischen den Spalten; rechts steht darin die Verzögerung („3 Mon.“) */
const LUECKE_L = 48;
/** Mit Ursachen steht auch links eine Verzögerung in der Lücke */
const LUECKE_L_MIT = 62;
const LUECKE_R = 70;
/** Zeichen je Zeile in den Kästen und im mittleren Kasten */
const ZEICHEN = 17;
const ZEICHEN_MITTE = 13;
/** Zeilenhöhe der Beschriftung, Innenabstand und Abstand zwischen den Kästen */
const ZEILE = 18;
const ZEILE_MITTE = 19;
const RAND = 10;
const LUECKE = 6;
const KOPF = 26;
/** Halbe Breite des mittleren Kastens (Pfeile enden und beginnen an seinem Rand) */
const MITTE_HALB = 66;

/** Bricht einen Namen in bis zu drei Zeilen; nichts wird abgeschnitten. */
function lines(name: string, max = ZEICHEN): string[] {
  if (name.length <= max) return [name];
  const words = name.split(" ");
  const out = [""];
  for (const w of words) {
    const cur = out[out.length - 1]!;
    if ((cur + " " + w).trim().length > max && cur) out.push(w);
    else out[out.length - 1] = (cur + " " + w).trim();
  }
  // Mehr als drei Zeilen: den Rest an die dritte hängen, damit kein Wort fehlt
  return out.length <= 3 ? out : [out[0]!, out[1]!, out.slice(2).join(" ")];
}

const hoehe = (name: string, main?: boolean) => lines(name, main ? ZEICHEN_MITTE : ZEICHEN).length * (main ? ZEILE_MITTE : ZEILE) + RAND * (main ? 1.6 : 1);

/** Mittelpunkte gestapelter Kästen, um cy zentriert */
function stapel(hs: number[], cy: number): number[] {
  const gesamt = hs.reduce((s, h) => s + h, 0) + LUECKE * Math.max(0, hs.length - 1);
  let y = cy - gesamt / 2;
  return hs.map((h) => {
    const m = y + h / 2;
    y += h + LUECKE;
    return m;
  });
}

/** Kurzform für die Zeichnung („3 Mon.“, passt in die Lücke vor dem Kasten); die Langform steht im Tooltip der Linie. */
const kurzWann = (lag: number) => t("t2.ng.mon", { n: lag });

function NodeBox({ node, x, y, main, onClick }: { node: NodeSpec; x: number; y: number; main?: boolean; onClick?: () => void }) {
  const ls = lines(node.name, main ? ZEICHEN_MITTE : ZEICHEN);
  const w = main ? MITTE_HALB * 2 : BOX_W;
  const h = hoehe(node.name, main);
  const zeile = main ? ZEILE_MITTE : ZEILE;
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
      {node.kind === "problem" && <path d={`M${w - 16} 5 l7 12 h-14 Z`} fill="#8e2a22" />}
      {ls.map((l, i) => (
        <text key={i} x={w / 2} y={h / 2 + (i - (ls.length - 1) / 2) * zeile + (main ? 7 : 6)} textAnchor="middle" className="ng-label">
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
  const get = (id: string) => NET.nodes[NET.index.get(id)!]!;
  // Ohne Ursachen ist die linke Spalte nur das Siegel: Die Zeichnung wird schmaler und damit größer dargestellt
  const siegelText = lines(node.input ? tx("ui2.ui.NetGraph.ea70511") : tx("ui2.ui.NetGraph.daad2ce"), 14);
  // Die Unterschrift des Siegels darf nicht über den linken Rand ragen (ein langes Wort wie „Wirtschaftsmodell“ bricht nicht um)
  const siegelBreite = Math.max(LINKS_SIEGEL, Math.max(...siegelText.map((l) => l.length)) * 7.6 + 10);
  const links = causes.length ? LINKS_KAESTEN : siegelBreite;
  const COL_L = causes.length ? 6 + BOX_W / 2 : siegelBreite / 2;
  const MITTE = links + (causes.length ? LUECKE_L_MIT : LUECKE_L) + MITTE_HALB;
  const COL_R = MITTE + MITTE_HALB + LUECKE_R + BOX_W / 2;
  const W = COL_R + BOX_W / 2 + 6;
  const hUrsache = causes.map((e) => hoehe(get(e.from).name));
  const hWirkung = effects.map((e) => hoehe(get(e.to).name));
  const spalte = (hs: number[]) => hs.reduce((s, h) => s + h, 0) + LUECKE * Math.max(0, hs.length - 1);
  // Ohne Ursachen braucht das Siegel samt Unterschrift Platz (Kreis 34, Unterschrift ab 56 unter der Mitte, je Zeile 18)
  const siegelHoehe = causes.length ? 0 : 2 * (56 + siegelText.length * 18);
  const H = Math.max(spalte(hUrsache), spalte(hWirkung), hoehe(node.name, true), siegelHoehe, 150) + KOPF + 8;
  const cy = KOPF + (H - KOPF) / 2;
  const yUrsache = stapel(hUrsache, cy);
  const yWirkung = stapel(hWirkung, cy);
  /** Linie mit Verzögerungsangabe. Die Angabe steht am Ende, an dem die Linien auseinanderlaufen (dort überdecken sie sich nicht). */
  const arrow = (x1: number, y1: number, x2: number, y2: number, e: EdgeSpec, key: string, labelBei: "start" | "ende") => {
    const { weight, lag } = e;
    const mx = (x1 + x2) / 2;
    const color = weight > 0 ? "#265a62" : "#8e2a22";
    const width = 0.8 + Math.min(2.2, Math.abs(weight) * 4);
    const d = `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
    const lx = labelBei === "ende" ? x2 - 8 : x1 + 6;
    const ly = (labelBei === "ende" ? y2 : y1) - 6;
    return (
      <g key={key} className="ng-kante">
        <title>{tx(weight > 0 ? "n4.nv.kanteHoch" : "n4.nv.kanteRunter", { von: get(e.from).name, nach: get(e.to).name, wann: wann(lag), warum: e.why })}</title>
        <path d={d} fill="none" stroke="transparent" strokeWidth="14" />
        <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={lag > 0 ? "6 4" : undefined} markerEnd={`url(#ng-${weight > 0 ? "plus" : "minus"})`} />
        {lag > 0 && (
          <text x={lx} y={ly} textAnchor={labelBei === "ende" ? "end" : "start"} className="ng-lag">
            {kurzWann(lag)}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="netgraph-block">
    <svg className="netgraph" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: W }} role="img" aria-label={tx("ui2.ui.NetGraph.68b1b53", { p0: node.name })}>
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
      <text x={COL_L} y="18" textAnchor="middle" className="ng-head">{tx("ui2.ui.NetGraph.7757ec0")}</text>
      <text x={COL_R} y="18" textAnchor="middle" className="ng-head">{tx("ui2.ui.NetGraph.1fac6b5")}</text>
      {causes.map((e, i) => arrow(COL_L + BOX_W / 2, yUrsache[i]!, MITTE - MITTE_HALB, cy, e, `c${e.from}`, "start"))}
      {effects.map((e, i) => arrow(MITTE + MITTE_HALB, cy, COL_R - BOX_W / 2 - 2, yWirkung[i]!, e, `e${e.to}`, "ende"))}
      {causes.map((e, i) => (
        <NodeBox key={e.from} node={get(e.from)} x={COL_L} y={yUrsache[i]!} onClick={() => onSelect(e.from)} />
      ))}
      {effects.map((e, i) => (
        <NodeBox key={e.to} node={get(e.to)} x={COL_R} y={yWirkung[i]!} onClick={() => onSelect(e.to)} />
      ))}
      {causes.length === 0 && (
        <g>
          <path d={`M${COL_L + 40} ${cy} C${(COL_L + MITTE - MITTE_HALB) / 2} ${cy} ${(COL_L + MITTE - MITTE_HALB) / 2} ${cy} ${MITTE - MITTE_HALB} ${cy}`} fill="none" stroke="#2a1f18" strokeWidth="1.5" strokeDasharray={node.input ? "5 3" : undefined} markerEnd="url(#ng-ink)" />
          <circle cx={COL_L} cy={cy} r="34" fill={node.input ? "#265a62" : "#8e2a22"} stroke="#2a1f18" />
          <circle cx={COL_L} cy={cy} r="27" fill="none" stroke="#f6dcc2" strokeOpacity="0.5" strokeDasharray="1 2" />
          <text x={COL_L} y={cy + 7} textAnchor="middle" className="ng-seal">{node.input ? "₺" : "§"}</text>
          {siegelText.map((l, i) => (
            <text key={i} x={COL_L} y={cy + 56 + i * 18} textAnchor="middle" className="ng-empty">
              {l}
            </text>
          ))}
        </g>
      )}
      <NodeBox node={node} x={MITTE} y={cy} main />
    </svg>
    <ul className="ng-legende" aria-label={t("ui.NetGraph.315742a")}>
      <li>
        <svg width="24" height="10" aria-hidden><line x1="0" y1="5" x2="20" y2="5" stroke="#265a62" strokeWidth="2" /><path d="M16 1 L23 5 L16 9 Z" fill="#265a62" /></svg>
        <span>{t("ui.NetGraph.588d242")}</span>
      </li>
      <li>
        <svg width="24" height="10" aria-hidden><line x1="0" y1="5" x2="20" y2="5" stroke="#8e2a22" strokeWidth="2" /><path d="M16 1 L23 5 L16 9 Z" fill="#8e2a22" /></svg>
        <span>{t("n4.nv.senkt")}</span>
      </li>
      <li>
        <svg width="24" height="10" aria-hidden><line x1="0" y1="5" x2="24" y2="5" stroke="#2a1f18" strokeWidth="2" /></svg>
        <span>{t("t2.ng.sofort")}</span>
      </li>
      <li>
        <svg width="24" height="10" aria-hidden><line x1="0" y1="5" x2="24" y2="5" stroke="#2a1f18" strokeWidth="2" strokeDasharray="5 3" /></svg>
        <span>{t("t2.ng.verzoegert")}</span>
      </li>
      <li className="hinweis">{t("ui.NetGraph.927ad78")}</li>
    </ul>
    </div>
  );
}
