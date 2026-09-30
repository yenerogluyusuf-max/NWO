// Flaggen als SVG (keine Bilddateien, keine Emojis): vereinfachte, aber erkennbare Zeichnungen der offiziellen Flaggen.
// Sie stehen für die Länder des Spiels (Kennung wie in sim/laender.ts) und die Türkei; unbekannte Kennungen zeigen ein neutrales Schild.

import type { ReactNode } from "react";

/** Regelmäßiger fünfzackiger Stern. */
function Stern({ cx, cy, r, fill, rot = 0 }: { cx: number; cy: number; r: number; fill: string; rot?: number }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const w = ((rot + i * 36 - 90) * Math.PI) / 180;
    const rr = i % 2 === 0 ? r : r * 0.382;
    pts.push(`${(cx + rr * Math.cos(w)).toFixed(2)},${(cy + rr * Math.sin(w)).toFixed(2)}`);
  }
  return <polygon points={pts.join(" ")} fill={fill} />;
}

/** Sechszackiger Stern (Davidstern) als zwei Dreiecke. */
function Davidstern({ cx, cy, r, stroke, breite }: { cx: number; cy: number; r: number; stroke: string; breite: number }) {
  const dreieck = (rot: number) => {
    const pts = [0, 1, 2].map((i) => {
      const w = ((rot + i * 120 - 90) * Math.PI) / 180;
      return `${(cx + r * Math.cos(w)).toFixed(2)},${(cy + r * Math.sin(w)).toFixed(2)}`;
    });
    return pts.join(" ");
  };
  return (
    <>
      <polygon points={dreieck(0)} fill="none" stroke={stroke} strokeWidth={breite} strokeLinejoin="round" />
      <polygon points={dreieck(180)} fill="none" stroke={stroke} strokeWidth={breite} strokeLinejoin="round" />
    </>
  );
}

const Mond = ({ cx, cy, r, fill, bg, versatz = 0.35 }: { cx: number; cy: number; r: number; fill: string; bg: string; versatz?: number }) => (
  <>
    <circle cx={cx} cy={cy} r={r} fill={fill} />
    <circle cx={cx + r * versatz} cy={cy} r={r * 0.8} fill={bg} />
  </>
);

const streifen = (farben: string[], senkrecht = false): ReactNode =>
  farben.map((f, i) => (senkrecht ? <rect key={i} x={(60 / farben.length) * i} y={0} width={60 / farben.length + 0.2} height={40} fill={f} /> : <rect key={i} x={0} y={(40 / farben.length) * i} width={60} height={40 / farben.length + 0.2} fill={f} />));

function usa(): ReactNode {
  const sterne: ReactNode[] = [];
  for (let z = 0; z < 9; z++) {
    const n = z % 2 === 0 ? 6 : 5;
    for (let s = 0; s < n; s++) sterne.push(<circle key={`${z}-${s}`} cx={(z % 2 === 0 ? 2.1 : 4.1) + s * 4} cy={2.1 + z * 2.3} r={0.85} fill="#fff" />);
  }
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} x={0} y={(40 / 13) * i} width={60} height={40 / 13 + 0.15} fill={i % 2 === 0 ? "#B22234" : "#fff"} />
      ))}
      <rect width={25} height={21.5} fill="#3C3B6E" />
      {sterne}
    </>
  );
}

function eu(): ReactNode {
  return (
    <>
      <rect width={60} height={40} fill="#003399" />
      {Array.from({ length: 12 }, (_, i) => {
        const w = (i * 30 * Math.PI) / 180;
        return <Stern key={i} cx={30 + 11.5 * Math.sin(w)} cy={20 - 11.5 * Math.cos(w)} r={2.3} fill="#FFCC00" />;
      })}
    </>
  );
}

function griechenland(): ReactNode {
  return (
    <>
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={0} y={(40 / 9) * i} width={60} height={40 / 9 + 0.15} fill={i % 2 === 0 ? "#0D5EAF" : "#fff"} />
      ))}
      <rect width={22.2} height={22.3} fill="#0D5EAF" />
      <rect x={8.9} y={0} width={4.4} height={22.3} fill="#fff" />
      <rect x={0} y={8.95} width={22.2} height={4.4} fill="#fff" />
    </>
  );
}

function iran(): ReactNode {
  return (
    <>
      {streifen(["#239F40", "#fff", "#DA0000"])}
      <g fill="none" stroke="#DA0000" strokeWidth={1.4} strokeLinecap="round">
        <path d="M30 14.5 V25.5" />
        <path d="M25.5 20 C25.5 15.5 28 15 30 17.5 C32 15 34.5 15.5 34.5 20" />
        <path d="M24.5 22 C25.5 27 34.5 27 35.5 22" />
      </g>
    </>
  );
}

function syrien(): ReactNode {
  return (
    <>
      {streifen(["#007A3D", "#fff", "#000"])}
      <Stern cx={22} cy={20} r={3.6} fill="#CE1126" />
      <Stern cx={30} cy={20} r={3.6} fill="#CE1126" />
      <Stern cx={38} cy={20} r={3.6} fill="#CE1126" />
    </>
  );
}

function irak(): ReactNode {
  return (
    <>
      {streifen(["#CE1126", "#fff", "#000"])}
      <g fill="none" stroke="#007A3D" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21.5 C21 17.5 23 17.5 24 21.5 M26 17 V21.5 M28.5 21.5 C29 17.5 31.5 17.5 32 21.5 M35 17 V21.5 M37.5 20 C38.5 17.5 40 17.5 41 20" />
        <path d="M19 23.5 H41" />
      </g>
    </>
  );
}

function aserbaidschan(): ReactNode {
  return (
    <>
      {streifen(["#00B5E2", "#EF3340", "#509E2F"])}
      <Mond cx={28.5} cy={20} r={5} fill="#fff" bg="#EF3340" versatz={0.4} />
      <Stern cx={35.5} cy={20} r={2.5} fill="#fff" rot={90} />
    </>
  );
}

function armenien(): ReactNode {
  return streifen(["#D90012", "#0033A0", "#F2A800"]);
}

function saudiarabien(): ReactNode {
  return (
    <>
      <rect width={60} height={40} fill="#006C35" />
      <g fill="none" stroke="#fff" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 14.5 C19 12 22 15 24 12.5 C26 15 29 12 31 14.5 C33 12 36 15 38 12.5 C40 14.5 42 13 43 14.5" />
        <path d="M15 27 H45" />
        <path d="M18 29.5 H42 M45 27 V29.5" />
      </g>
      <path d="M17 24.5 H43" stroke="#fff" strokeWidth={1.1} strokeLinecap="round" />
    </>
  );
}

function israel(): ReactNode {
  return (
    <>
      <rect width={60} height={40} fill="#fff" />
      <rect y={4.3} width={60} height={4.6} fill="#0038B8" />
      <rect y={31.1} width={60} height={4.6} fill="#0038B8" />
      <Davidstern cx={30} cy={20} r={6.3} stroke="#0038B8" breite={1.3} />
    </>
  );
}

function china(): ReactNode {
  return (
    <>
      <rect width={60} height={40} fill="#DE2910" />
      <Stern cx={10} cy={10} r={5.4} fill="#FFDE00" />
      <Stern cx={20} cy={4.2} r={1.7} fill="#FFDE00" rot={-25} />
      <Stern cx={24} cy={9} r={1.7} fill="#FFDE00" rot={-5} />
      <Stern cx={24} cy={15} r={1.7} fill="#FFDE00" rot={-25} />
      <Stern cx={20} cy={19.5} r={1.7} fill="#FFDE00" rot={-45} />
    </>
  );
}

function ukraine(): ReactNode {
  return streifen(["#0057B7", "#FFD700"]);
}

function georgien(): ReactNode {
  const kreuz = (x: number, y: number, l: number, b: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x - b / 2} y={y - l / 2} width={b} height={l} fill="#FF0000" />
      <rect x={x - l / 2} y={y - b / 2} width={l} height={b} fill="#FF0000" />
    </g>
  );
  return (
    <>
      <rect width={60} height={40} fill="#fff" />
      {kreuz(30, 20, 40, 5.6)}
      {kreuz(15, 10, 7.5, 2)}
      {kreuz(45, 10, 7.5, 2)}
      {kreuz(15, 30, 7.5, 2)}
      {kreuz(45, 30, 7.5, 2)}
    </>
  );
}

function aegypten(): ReactNode {
  return (
    <>
      {streifen(["#CE1126", "#fff", "#000"])}
      <g fill="#C09300">
        <path d="M30 14.5 C27 14.5 26 17 26.5 19 L24.5 20.5 L26.5 21.5 L26 25 H34 L33.5 21.5 L35.5 20.5 L33.5 19 C34 17 33 14.5 30 14.5 Z" />
        <rect x={27.3} y={25.6} width={5.4} height={0.9} />
      </g>
    </>
  );
}

function libyen(): ReactNode {
  return (
    <>
      <rect width={60} height={10} fill="#E70013" />
      <rect y={10} width={60} height={20} fill="#000" />
      <rect y={30} width={60} height={10} fill="#239E46" />
      <Mond cx={29} cy={20} r={5.6} fill="#fff" bg="#000" versatz={0.4} />
      <Stern cx={36} cy={20} r={2.6} fill="#fff" rot={90} />
    </>
  );
}

function kasachstan(): ReactNode {
  const strahlen = Array.from({ length: 16 }, (_, i) => {
    const w = (i * 22.5 * Math.PI) / 180;
    return <line key={i} x1={33 + 6 * Math.cos(w)} y1={15 + 6 * Math.sin(w)} x2={33 + 8.6 * Math.cos(w)} y2={15 + 8.6 * Math.sin(w)} stroke="#FEC50C" strokeWidth={1.1} strokeLinecap="round" />;
  });
  return (
    <>
      <rect width={60} height={40} fill="#00AFCA" />
      <circle cx={33} cy={15} r={5.2} fill="#FEC50C" />
      {strahlen}
      <path d="M22 26 C26 23 30 26 33 24 C36 26 40 23 44 26 C41 28 37 27 33 28.5 C29 27 25 28 22 26 Z" fill="#FEC50C" />
      <g fill="none" stroke="#FEC50C" strokeWidth={1}>
        <path d="M5 2 V38" />
        <path d="M5 6 C1.5 9 8.5 11 5 14 C1.5 17 8.5 19 5 22 C1.5 25 8.5 27 5 30 C1.5 33 8.5 35 5 38" />
      </g>
    </>
  );
}

function zypern(): ReactNode {
  return (
    <>
      <rect width={60} height={40} fill="#fff" />
      <path d="M15 21 C18 17.5 22 19 26 17 C29 15 31 17 34 16 C38 15 43 18 45 21 C42 23 38 22.5 35 24.5 C31 26.5 27 24 23 25.5 C20 26.5 17 24.5 15 21 Z" fill="#D57800" />
      <g fill="none" stroke="#4E5B31" strokeWidth={1.4} strokeLinecap="round">
        <path d="M20 31 C26 35.5 34 35.5 40 31" />
        <path d="M22 32.4 C24.5 30 27 31 28 32.6 M25 34 C27.5 32 30 33 31 34.4 M34 34 C33 32 35.5 31 37.5 32.6" />
      </g>
    </>
  );
}

function tuerkei(): ReactNode {
  return (
    <>
      <rect width={60} height={40} fill="#E30A17" />
      <Mond cx={23.5} cy={20} r={8.4} fill="#fff" bg="#E30A17" versatz={0.28} />
      <Stern cx={32.5} cy={20} r={4.2} fill="#fff" rot={90} />
    </>
  );
}

function russland(): ReactNode {
  return streifen(["#fff", "#0039A6", "#D52B1E"]);
}

const FLAGGEN: Record<string, () => ReactNode> = {
  USA: usa, EU: eu, RUS: russland, GRC: griechenland, IRN: iran, SYR: syrien, IRQ: irak, AZE: aserbaidschan, ARM: armenien, SAU: saudiarabien, ISR: israel,
  CHN: china, UKR: ukraine, GEO: georgien, EGY: aegypten, LBY: libyen, KAZ: kasachstan, CYP: zypern, TUR: tuerkei,
};

/** Ob es für die Kennung eine gezeichnete Flagge gibt. */
export const hatFlagge = (id: string): boolean => id in FLAGGEN;

/**
 * Die Flagge eines Landes. `rund` zeigt sie als Medaille (Kartenpin), sonst als Rechteck mit feinem Rand.
 * `titel` ist der zugängliche Name; ohne ihn ist die Flagge reine Dekoration.
 */
export function Flagge({ id, breite = 36, rund = false, titel, className }: { id: string; breite?: number; rund?: boolean; titel?: string; className?: string }) {
  const zeichne = FLAGGEN[id];
  const hoehe = rund ? breite : Math.round((breite * 2) / 3);
  const a11y = titel ? { role: "img", "aria-label": titel } : { "aria-hidden": true as const };
  const klip = `flagge-klip-${id}-${rund ? "r" : "e"}`;
  return (
    <svg className={`flagge${rund ? " rund" : ""}${className ? ` ${className}` : ""}`} width={breite} height={hoehe} viewBox={rund ? "10 0 40 40" : "0 0 60 40"} {...a11y}>
      {titel && <title>{titel}</title>}
      <defs>
        <clipPath id={klip}>{rund ? <circle cx={30} cy={20} r={19.4} /> : <rect width={60} height={40} rx={2.2} />}</clipPath>
      </defs>
      <g clipPath={`url(#${klip})`}>{zeichne ? zeichne() : <><rect width={60} height={40} fill="#8c7d69" /><text x={30} y={26} textAnchor="middle" fontSize={16} fontFamily="serif" fill="#f3e6c6">{id.slice(0, 3)}</text></>}</g>
      {rund ? <circle cx={30} cy={20} r={19.4} fill="none" stroke="rgba(30,20,10,0.55)" strokeWidth={1.2} /> : <rect x={0.5} y={0.5} width={59} height={39} rx={2} fill="none" stroke="rgba(30,20,10,0.45)" strokeWidth={1} />}
    </svg>
  );
}

/** Die beiden Hauptfarben einer Flagge, für Kopfstreifen und Farbsäume. */
export const FLAGGENFARBEN: Record<string, [string, string]> = {
  TUR: ["#E30A17", "#ffffff"], USA: ["#3C3B6E", "#B22234"], EU: ["#003399", "#FFCC00"], RUS: ["#0039A6", "#D52B1E"], GRC: ["#0D5EAF", "#ffffff"],
  IRN: ["#239F40", "#DA0000"], SYR: ["#007A3D", "#CE1126"], IRQ: ["#CE1126", "#007A3D"], AZE: ["#00B5E2", "#EF3340"], ARM: ["#D90012", "#0033A0"],
  SAU: ["#006C35", "#ffffff"], ISR: ["#0038B8", "#ffffff"], CHN: ["#DE2910", "#FFDE00"], UKR: ["#0057B7", "#FFD700"], GEO: ["#FF0000", "#ffffff"],
  EGY: ["#CE1126", "#000000"], LBY: ["#E70013", "#239E46"], KAZ: ["#00AFCA", "#FEC50C"], CYP: ["#D57800", "#4E5B31"],
};

export const flaggenFarben = (id: string): [string, string] => FLAGGENFARBEN[id] ?? ["#8c7d69", "#f3e6c6"];
