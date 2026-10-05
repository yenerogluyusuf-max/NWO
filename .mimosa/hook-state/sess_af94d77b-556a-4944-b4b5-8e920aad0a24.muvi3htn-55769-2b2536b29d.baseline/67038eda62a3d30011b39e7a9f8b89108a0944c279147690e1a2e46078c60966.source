// Flaggen der weiteren Staaten (data/welt-weitere.ts) als SVG: vereinfachte, aber erkennbare Zeichnungen im Stil von Flaggen.tsx.
// Eigene kleine Hilfen, damit diese Datei Flaggen.tsx nicht importieren muss (dort wird sie als Rückfall eingebunden).

import type { ReactNode } from "react";

const streifen = (farben: string[], senkrecht = false): ReactNode =>
  farben.map((f, i) => (senkrecht ? <rect key={i} x={(60 / farben.length) * i} y={0} width={60 / farben.length + 0.2} height={40} fill={f} /> : <rect key={i} x={0} y={(40 / farben.length) * i} width={60} height={40 / farben.length + 0.2} fill={f} />));

function Stern({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const w = ((i * 36 - 90) * Math.PI) / 180;
    const rr = i % 2 === 0 ? r : r * 0.382;
    pts.push(`${(cx + rr * Math.cos(w)).toFixed(2)},${(cy + rr * Math.sin(w)).toFixed(2)}`);
  }
  return <polygon points={pts.join(" ")} fill={fill} />;
}

const Mond = ({ cx, cy, r, fill, bg }: { cx: number; cy: number; r: number; fill: string; bg: string }) => (
  <>
    <circle cx={cx} cy={cy} r={r} fill={fill} />
    <circle cx={cx + r * 0.35} cy={cy} r={r * 0.8} fill={bg} />
  </>
);

function spanien(): ReactNode {
  return (
    <>
      <rect width={60} height={40} fill="#AA151B" />
      <rect y={10} width={60} height={20} fill="#F1BF00" />
    </>
  );
}

function schweden(): ReactNode {
  return (
    <>
      <rect width={60} height={40} fill="#006AA7" />
      <rect x={17} width={7} height={40} fill="#FECC00" />
      <rect y={16.5} width={60} height={7} fill="#FECC00" />
    </>
  );
}

function brasilien(): ReactNode {
  return (
    <>
      <rect width={60} height={40} fill="#009739" />
      <polygon points="30,4 56,20 30,36 4,20" fill="#FEDD00" />
      <circle cx={30} cy={20} r={8.2} fill="#012169" />
      <path d="M22.4 18.4 C27 16.4 33 17.4 37.6 22" fill="none" stroke="#fff" strokeWidth={1.3} />
    </>
  );
}

function indien(): ReactNode {
  return (
    <>
      {streifen(["#FF9933", "#fff", "#138808"])}
      <circle cx={30} cy={20} r={4.2} fill="none" stroke="#000080" strokeWidth={0.9} />
      <circle cx={30} cy={20} r={0.9} fill="#000080" />
    </>
  );
}

function suedafrika(): ReactNode {
  return (
    <>
      <rect width={60} height={20} fill="#DE3831" />
      <rect y={20} width={60} height={20} fill="#002395" />
      <path d="M0 0 L22 20 H60 M0 40 L22 20" fill="none" stroke="#fff" strokeWidth={11} />
      <path d="M0 0 L22 20 H60 M0 40 L22 20" fill="none" stroke="#007A4D" strokeWidth={6.5} />
      <polygon points="0,0 20,20 0,40" fill="#000" stroke="#FFB612" strokeWidth={2} />
    </>
  );
}

function aethiopien(): ReactNode {
  return (
    <>
      {streifen(["#078930", "#FCDD09", "#DA121A"])}
      <circle cx={30} cy={20} r={8} fill="#0F47AF" />
      <Stern cx={30} cy={20} r={5.2} fill="#FCDD09" />
    </>
  );
}

function emirate(): ReactNode {
  return (
    <>
      <rect width={60} height={40} fill="#fff" />
      <rect x={15} width={45} height={13.4} fill="#00732F" />
      <rect x={15} y={26.6} width={45} height={13.4} fill="#000" />
      <rect width={15} height={40} fill="#FF0000" />
    </>
  );
}

function indonesien(): ReactNode {
  return <>{streifen(["#FF0000", "#fff"])}</>;
}

function katar(): ReactNode {
  const pts: string[] = ["20,0", "60,0", "60,40", "20,40"];
  for (let i = 0; i < 9; i++) pts.push(`${i % 2 === 0 ? 14 : 20},${(40 - (i + 0.5) * (40 / 9)).toFixed(2)}`);
  return (
    <>
      <rect width={60} height={40} fill="#fff" />
      <polygon points={pts.join(" ")} fill="#8A1538" />
    </>
  );
}

function grossbritannien(): ReactNode {
  return (
    <>
      <rect width={60} height={40} fill="#012169" />
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" strokeWidth={8} />
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#C8102E" strokeWidth={3.2} />
      <path d="M30 0 V40 M0 20 H60" stroke="#fff" strokeWidth={12} />
      <path d="M30 0 V40 M0 20 H60" stroke="#C8102E" strokeWidth={7} />
    </>
  );
}

function pakistan(): ReactNode {
  return (
    <>
      <rect width={60} height={40} fill="#01411C" />
      <rect width={15} height={40} fill="#fff" />
      <Mond cx={38} cy={20} r={9} fill="#fff" bg="#01411C" />
      <Stern cx={45} cy={14.5} r={3.2} fill="#fff" />
    </>
  );
}

function usbekistan(): ReactNode {
  return (
    <>
      {streifen(["#0099B5", "#fff", "#1EB53A"])}
      <rect y={12.2} width={60} height={1.7} fill="#CE1126" />
      <rect y={26.1} width={60} height={1.7} fill="#CE1126" />
      <Mond cx={9} cy={6.4} r={4.2} fill="#fff" bg="#0099B5" />
      <circle cx={17} cy={4} r={0.9} fill="#fff" />
      <circle cx={20} cy={7} r={0.9} fill="#fff" />
      <circle cx={17} cy={9.5} r={0.9} fill="#fff" />
    </>
  );
}

function kirgisistan(): ReactNode {
  const strahlen = Array.from({ length: 24 }, (_, i) => {
    const w = (i * 15 * Math.PI) / 180;
    return <line key={i} x1={30 + 8 * Math.cos(w)} y1={20 + 8 * Math.sin(w)} x2={30 + 11.5 * Math.cos(w)} y2={20 + 11.5 * Math.sin(w)} stroke="#FFEF00" strokeWidth={1.1} />;
  });
  return (
    <>
      <rect width={60} height={40} fill="#E8112D" />
      {strahlen}
      <circle cx={30} cy={20} r={8} fill="#FFEF00" />
      <circle cx={30} cy={20} r={5.4} fill="#E8112D" />
      <path d="M25.5 20 H34.5 M30 15.5 V24.5" stroke="#FFEF00" strokeWidth={1} />
    </>
  );
}

function turkmenistan(): ReactNode {
  return (
    <>
      <rect width={60} height={40} fill="#00843D" />
      <rect x={7} width={10} height={40} fill="#D22630" />
      <g fill="#fff">
        <rect x={9} y={4} width={6} height={4} />
        <rect x={9} y={14} width={6} height={4} />
        <rect x={9} y={24} width={6} height={4} />
        <rect x={9} y={34} width={6} height={4} />
      </g>
      <Mond cx={26} cy={9} r={4.6} fill="#fff" bg="#00843D" />
      <Stern cx={32} cy={7} r={1.6} fill="#fff" />
      <Stern cx={34} cy={11} r={1.6} fill="#fff" />
    </>
  );
}

export const FLAGGEN_WEITERE: Record<string, () => ReactNode> = {
  DEU: () => <>{streifen(["#000000", "#DD0000", "#FFCE00"])}</>,
  FRA: () => <>{streifen(["#0055A4", "#fff", "#EF4135"], true)}</>,
  ITA: () => <>{streifen(["#009246", "#fff", "#CE2B37"], true)}</>,
  ESP: spanien,
  POL: () => <>{streifen(["#fff", "#DC143C"])}</>,
  NLD: () => <>{streifen(["#AE1C28", "#fff", "#21468B"])}</>,
  BGR: () => <>{streifen(["#fff", "#00966E", "#D62612"])}</>,
  HUN: () => <>{streifen(["#CE2939", "#fff", "#477050"])}</>,
  ROU: () => <>{streifen(["#002B7F", "#FCD116", "#CE1126"], true)}</>,
  AUT: () => <>{streifen(["#ED2939", "#fff", "#ED2939"])}</>,
  SWE: schweden,
  BRA: brasilien,
  IND: indien,
  ZAF: suedafrika,
  ETH: aethiopien,
  ARE: emirate,
  IDN: indonesien,
  QAT: katar,
  GBR: grossbritannien,
  PAK: pakistan,
  UZB: usbekistan,
  KGZ: kirgisistan,
  TKM: turkmenistan,
};

export const FARBEN_WEITERE: Record<string, [string, string]> = {
  DEU: ["#DD0000", "#FFCE00"], FRA: ["#0055A4", "#EF4135"], ITA: ["#009246", "#CE2B37"], ESP: ["#AA151B", "#F1BF00"], POL: ["#DC143C", "#ffffff"],
  NLD: ["#21468B", "#AE1C28"], BGR: ["#00966E", "#D62612"], HUN: ["#CE2939", "#477050"], ROU: ["#002B7F", "#FCD116"], AUT: ["#ED2939", "#ffffff"],
  SWE: ["#006AA7", "#FECC00"], BRA: ["#009739", "#FEDD00"], IND: ["#FF9933", "#138808"], ZAF: ["#007A4D", "#DE3831"], ETH: ["#078930", "#DA121A"],
  ARE: ["#00732F", "#FF0000"], IDN: ["#FF0000", "#ffffff"], QAT: ["#8A1538", "#ffffff"], GBR: ["#012169", "#C8102E"], PAK: ["#01411C", "#ffffff"],
  UZB: ["#0099B5", "#1EB53A"], KGZ: ["#E8112D", "#FFEF00"], TKM: ["#00843D", "#D22630"],
};
