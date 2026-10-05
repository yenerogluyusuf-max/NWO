// Kupferstich-Vignetten für Ereignisse und Prolog. Reine Vektorzeichnung:
// Tinte auf Papier, Schatten als Schraffur, der Himmel als Lasur.

import { useId, type ReactNode } from "react";

export type Scene = "istanbul" | "parlament" | "bank" | "anatolien" | "wahlnacht";

const INK = "#2a1f18";
const PAPER = "#f3e7c9";
const W = 640;
const H = 240;

function Defs({ id, sky }: { id: string; sky: [string, string] }) {
  return (
    <defs>
      <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={sky[0]} />
        <stop offset="1" stopColor={sky[1]} />
      </linearGradient>
      <pattern id={`hatch${id}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
        <line x1="0" y1="0" x2="0" y2="4" stroke={INK} strokeWidth="0.9" strokeOpacity="0.55" />
      </pattern>
      <pattern id={`hatch2${id}`} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)">
        <line x1="0" y1="0" x2="0" y2="3" stroke={INK} strokeWidth="0.8" strokeOpacity="0.5" />
      </pattern>
      <pattern id={`dots${id}`} width="5" height="5" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="0.7" fill={INK} fillOpacity="0.45" />
        <circle cx="4" cy="3.8" r="0.5" fill={INK} fillOpacity="0.35" />
      </pattern>
      <radialGradient id={`vig${id}`} cx="50%" cy="45%" r="75%">
        <stop offset="0.6" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#3a2410" stopOpacity="0.35" />
      </radialGradient>
    </defs>
  );
}

/** Wellenstriche auf Wasser */
function Waves({ y0, y1, seed = 1 }: { y0: number; y1: number; seed?: number }) {
  const out: ReactNode[] = [];
  let k = seed;
  for (let y = y0 + 6; y < y1; y += 7) {
    for (let x = ((y * 13) % 37) - 20; x < W; x += 34 + ((k = (k * 9301 + 49297) % 233280) % 30)) {
      const len = 10 + (k % 14);
      out.push(<path key={`${x}-${y}`} d={`M${x} ${y} q${len / 2} -2.2 ${len} 0`} fill="none" stroke={INK} strokeOpacity={0.35 + ((y - y0) / (y1 - y0)) * 0.3} strokeWidth="0.9" />);
    }
  }
  return <g>{out}</g>;
}

function Minaret({ x, base, h }: { x: number; base: number; h: number }) {
  const top = base - h;
  return (
    <g stroke={INK} strokeWidth="1" fill={PAPER}>
      <rect x={x - 2.6} y={top + 12} width="5.2" height={h - 12} />
      <rect x={x - 4} y={base - h * 0.55} width="8" height="2.2" />
      <rect x={x - 3.8} y={base - h * 0.8} width="7.6" height="2" />
      <path d={`M${x - 2.6} ${top + 12} L${x} ${top} L${x + 2.6} ${top + 12} Z`} fill={INK} />
    </g>
  );
}

/** Moschee mit Hauptkuppel, Halbkuppeln und Minaretten */
function Mosque({ x, base, s, id, minarets = 4 }: { x: number; base: number; s: number; id: string; minarets?: 2 | 4 }) {
  const w = 90 * s;
  const bodyH = 26 * s;
  const domeR = 26 * s;
  const drumH = 8 * s;
  return (
    <g>
      {/* Baukörper */}
      <rect x={x - w / 2} y={base - bodyH} width={w} height={bodyH} fill={PAPER} stroke={INK} />
      <rect x={x + w * 0.1} y={base - bodyH} width={w * 0.4} height={bodyH} fill={`url(#hatch${id})`} />
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${x - w / 2 + 8 * s + i * 12.5 * s} ${base - 6 * s} v${-9 * s} a${3 * s} ${3 * s} 0 0 1 ${6 * s} 0 v${9 * s}`} fill="none" stroke={INK} strokeWidth="0.8" />
      ))}
      {/* Halbkuppeln */}
      {[-1, 1].map((d) => (
        <path key={d} d={`M${x + d * 34 * s - 16 * s} ${base - bodyH} a${16 * s} ${13 * s} 0 0 1 ${32 * s} 0 Z`} fill={PAPER} stroke={INK} />
      ))}
      {/* Tambour und Hauptkuppel */}
      <rect x={x - domeR} y={base - bodyH - drumH} width={domeR * 2} height={drumH} fill={PAPER} stroke={INK} />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={x - domeR + (i + 0.5) * ((domeR * 2) / 9)} y1={base - bodyH - drumH + 2 * s} x2={x - domeR + (i + 0.5) * ((domeR * 2) / 9)} y2={base - bodyH - 2 * s} stroke={INK} strokeWidth="1.2" />
      ))}
      <path d={`M${x - domeR} ${base - bodyH - drumH} a${domeR} ${domeR * 0.9} 0 0 1 ${domeR * 2} 0 Z`} fill={PAPER} stroke={INK} />
      <path d={`M${x + domeR * 0.1} ${base - bodyH - drumH - domeR * 0.88} a${domeR} ${domeR * 0.9} 0 0 1 ${domeR * 0.9} ${domeR * 0.88} L${x + domeR * 0.1} ${base - bodyH - drumH} Z`} fill={`url(#hatch${id})`} />
      <line x1={x} y1={base - bodyH - drumH - domeR * 0.9} x2={x} y2={base - bodyH - drumH - domeR * 0.9 - 9 * s} stroke={INK} strokeWidth="1.2" />
      <circle cx={x} cy={base - bodyH - drumH - domeR * 0.9 - 10 * s} r={1.6 * s} fill={INK} />
      {(minarets === 4 ? [-58, -48, 48, 58] : [-50, 50]).map((dx) => (
        <Minaret key={dx} x={x + dx * s} base={base} h={(Math.abs(dx) > 50 ? 92 : 78) * s} />
      ))}
    </g>
  );
}

function Houses({ x0, x1, base, seed, id }: { x0: number; x1: number; base: number; seed: number; id: string }) {
  const out: ReactNode[] = [];
  let k = seed;
  for (let x = x0; x < x1; ) {
    k = (k * 9301 + 49297) % 233280;
    const w = 10 + (k % 14);
    const h = 9 + ((k >> 3) % 16);
    out.push(
      <g key={x}>
        <rect x={x} y={base - h} width={w} height={h} fill={PAPER} stroke={INK} strokeWidth="0.8" />
        <path d={`M${x - 1} ${base - h} L${x + w / 2} ${base - h - 5} L${x + w + 1} ${base - h} Z`} fill={k % 3 ? `url(#hatch2${id})` : PAPER} stroke={INK} strokeWidth="0.8" />
        {w > 14 && <rect x={x + 3} y={base - h + 4} width="2.4" height="3" fill={INK} />}
        {w > 18 && <rect x={x + w - 6} y={base - h + 4} width="2.4" height="3" fill={INK} />}
      </g>,
    );
    x += w - 1;
  }
  return <g>{out}</g>;
}

function Clouds() {
  return (
    <g fill="none" stroke={INK} strokeOpacity="0.28" strokeWidth="1" strokeLinecap="round">
      <path d="M60 52 q22 -14 44 -2 q14 -10 30 0 q10 -4 18 2" />
      <path d="M78 60 h70" />
      <path d="M430 38 q18 -12 36 -1 q16 -12 34 0 q12 -5 22 2" />
      <path d="M448 46 h80 M470 52 h40" />
    </g>
  );
}

function Birds({ x, y }: { x: number; y: number }) {
  return (
    <g fill="none" stroke={INK} strokeWidth="1" strokeOpacity="0.7">
      <path d={`M${x} ${y} q4 -4 7 0 q3 -4 7 0`} />
      <path d={`M${x + 20} ${y - 8} q3 -3 5 0 q2 -3 5 0`} />
      <path d={`M${x + 12} ${y + 10} q3 -3 5 0 q2 -3 5 0`} />
    </g>
  );
}

function Istanbul({ id }: { id: string }) {
  const base = 168;
  return (
    <>
      <Clouds />
      <circle cx="520" cy="92" r="26" fill="#f7d9a0" stroke={INK} strokeOpacity="0.4" />
      <Birds x={380} y={70} />
      {/* ferne Hügel */}
      <path d={`M0 ${base - 14} C80 ${base - 30} 150 ${base - 22} 210 ${base - 26} S360 ${base - 34} 430 ${base - 20} S580 ${base - 30} 640 ${base - 18} V${base} H0 Z`} fill={`url(#dots${id})`} stroke={INK} strokeOpacity="0.35" />
      <Houses x0={0} x1={150} base={base} seed={3} id={id} />
      <Mosque x={250} base={base} s={1.05} id={id} />
      <Houses x0={330} x1={420} base={base} seed={11} id={id} />
      {/* Galataturm */}
      <g stroke={INK} fill={PAPER}>
        <rect x="440" y={base - 70} width="22" height="70" />
        <rect x="451" y={base - 70} width="11" height="70" fill={`url(#hatch${id})`} />
        <rect x="437" y={base - 78} width="28" height="8" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={441 + i * 6.5} y={base - 76} width="2.6" height="4.5" fill={INK} />
        ))}
        <path d={`M437 ${base - 78} L451 ${base - 112} L465 ${base - 78} Z`} />
        <path d={`M451 ${base - 112} L465 ${base - 78} L451 ${base - 78} Z`} fill={`url(#hatch${id})`} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="448" y={base - 58 + i * 18} width="5" height="8" fill={INK} />
        ))}
      </g>
      <Houses x0={470} x1={560} base={base} seed={21} id={id} />
      <Mosque x={600} base={base} s={0.55} id={id} minarets={2} />
      {/* Ufer und Bosporus */}
      <rect x="0" y={base} width={W} height={H - base} fill="#dfe3d0" />
      <line x1="0" y1={base} x2={W} y2={base} stroke={INK} strokeWidth="1.4" />
      <Waves y0={base} y1={H} />
      {/* Fähre */}
      <g stroke={INK} fill={PAPER} strokeWidth="1">
        <path d={`M150 ${base + 34} h64 l-6 9 h-52 Z`} />
        <rect x="160" y={base + 26} width="40" height="8" />
        <rect x="178" y={base + 16} width="6" height="10" fill={INK} />
        <path d={`M184 ${base + 14} q10 -8 22 -6 q10 -6 18 0`} fill="none" strokeOpacity="0.4" />
      </g>
    </>
  );
}

function Parlament({ id }: { id: string }) {
  const base = 196;
  const cols = 14;
  return (
    <>
      <Clouds />
      <Birds x={120} y={58} />
      {/* Hügel von Ankara */}
      <path d={`M0 ${base - 40} C100 ${base - 70} 180 ${base - 52} 260 ${base - 60} S460 ${base - 78} 640 ${base - 50} V${base} H0 Z`} fill={`url(#dots${id})`} stroke={INK} strokeOpacity="0.3" />
      {/* Treppe */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={150 - i * 8} y={base - 4 - i * 4} width={340 + i * 16} height="4" fill={PAPER} stroke={INK} strokeWidth="0.8" />
      ))}
      {/* Flügel */}
      <rect x="126" y={base - 76} width="388" height="56" fill={PAPER} stroke={INK} />
      <rect x="126" y={base - 76} width="388" height="10" fill={`url(#hatch2${id})`} stroke={INK} />
      {/* Kolonnade: hohe, eckige Pfeiler wie am Parlamentsgebäude in Ankara */}
      <rect x="220" y={base - 118} width="200" height="98" fill={PAPER} stroke={INK} />
      <rect x="214" y={base - 126} width="212" height="10" fill={PAPER} stroke={INK} />
      <rect x="220" y={base - 116} width="200" height="10" fill={`url(#hatch${id})`} />
      {Array.from({ length: cols }, (_, i) => {
        const x = 224 + i * (192 / (cols - 1));
        return <rect key={i} x={x - 3.2} y={base - 104} width="6.4" height="84" fill={PAPER} stroke={INK} strokeWidth="0.9" />;
      })}
      {Array.from({ length: cols - 1 }, (_, i) => {
        const x = 224 + (i + 0.5) * (192 / (cols - 1));
        return <rect key={i} x={x - 4.3} y={base - 104} width="8.6" height="84" fill={`url(#hatch${id})`} />;
      })}
      {/* Fenster in den Flügeln */}
      {[140, 160, 180, 200, 440, 460, 480, 500].map((x) => (
        <rect key={x} x={x - 3} y={base - 58} width="6" height="22" fill={INK} fillOpacity="0.75" />
      ))}
      {/* Fahnenmast mit Flagge */}
      <line x1="320" y1={base - 126} x2="320" y2={base - 188} stroke={INK} strokeWidth="1.6" />
      <path d={`M320 ${base - 188} q18 -4 34 2 q14 5 28 0 v26 q-14 5 -28 0 q-16 -6 -34 -2 Z`} fill="#b3352b" stroke={INK} strokeWidth="1" />
      <circle cx="342" cy={base - 174} r="7" fill="#f7efe0" />
      <circle cx="344.5" cy={base - 174} r="5.6" fill="#b3352b" />
      <path d={`M354 ${base - 178.5} l1.2 3.3 3.4 0.1 -2.7 2.1 1 3.3 -2.9 -2 -2.9 2 1 -3.3 -2.7 -2.1 3.4 -0.1 Z`} fill="#f7efe0" />
      {/* Bäume */}
      {[70, 96, 548, 578, 604].map((x, i) => (
        <g key={x}>
          <line x1={x} y1={base} x2={x} y2={base - 18} stroke={INK} strokeWidth="1.4" />
          <ellipse cx={x} cy={base - 32} rx={14 + (i % 2) * 3} ry={20} fill={PAPER} stroke={INK} />
          <ellipse cx={x + 4} cy={base - 30} rx={9} ry={15} fill={`url(#hatch2${id})`} />
        </g>
      ))}
      <rect x="0" y={base} width={W} height={H - base} fill={`url(#dots${id})`} />
      <line x1="0" y1={base} x2={W} y2={base} stroke={INK} strokeWidth="1.2" />
    </>
  );
}

function Bank({ id }: { id: string }) {
  const base = 200;
  return (
    <>
      <Clouds />
      {/* Kurve im Himmel wie auf einem Kursblatt */}
      <path d="M40 120 L90 112 L130 124 L170 96 L210 104 L250 78 L290 90" fill="none" stroke="#8e2a22" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="4 3" />
      <path d={`M0 ${base - 30} C120 ${base - 50} 240 ${base - 36} 340 ${base - 44} S540 ${base - 56} 640 ${base - 36} V${base} H0 Z`} fill={`url(#dots${id})`} stroke={INK} strokeOpacity="0.3" />
      {/* Tempelfront */}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={336 - i * 10} y={base - 5 - i * 5} width={228 + i * 20} height="5" fill={PAPER} stroke={INK} strokeWidth="0.8" />
      ))}
      <rect x="350" y={base - 124} width="200" height="104" fill={PAPER} stroke={INK} />
      {Array.from({ length: 6 }, (_, i) => {
        const x = 364 + i * 34.4;
        return (
          <g key={i}>
            <rect x={x - 6} y={base - 112} width="12" height="92" fill={PAPER} stroke={INK} />
            <rect x={x + 1} y={base - 112} width="5" height="92" fill={`url(#hatch${id})`} />
            <rect x={x - 8} y={base - 116} width="16" height="4" fill={PAPER} stroke={INK} strokeWidth="0.8" />
          </g>
        );
      })}
      <rect x="342" y={base - 134} width="216" height="12" fill={PAPER} stroke={INK} />
      <path d={`M338 ${base - 134} L450 ${base - 176} L562 ${base - 134} Z`} fill={PAPER} stroke={INK} />
      <path d={`M360 ${base - 138} L450 ${base - 170} L540 ${base - 138} Z`} fill={`url(#hatch2${id})`} />
      <text x="450" y={base - 145} textAnchor="middle" fontFamily="Fraunces Variable, serif" fontSize="15" fontWeight="700" fill={INK}>₺</text>
      {/* Stadt links */}
      <Houses x0={20} x1={300} base={base} seed={7} id={id} />
      <rect x="0" y={base} width={W} height={H - base} fill={`url(#dots${id})`} />
      <line x1="0" y1={base} x2={W} y2={base} stroke={INK} strokeWidth="1.2" />
    </>
  );
}

function Anatolien({ id }: { id: string }) {
  const base = 206;
  return (
    <>
      <Clouds />
      <circle cx="140" cy="84" r="22" fill="#f7d9a0" stroke={INK} strokeOpacity="0.35" />
      <Birds x={430} y={62} />
      {/* Bergketten mit Schraffur auf den Schattenseiten */}
      <path d="M0 150 L70 96 L110 124 L170 70 L230 130 L290 100 L350 142 L420 88 L480 124 L540 80 L600 118 L640 104 V210 H0 Z" fill={PAPER} stroke={INK} />
      <path d="M170 70 L200 100 L186 132 L230 130 Z M420 88 L444 110 L436 136 L480 124 Z M540 80 L566 104 L556 128 L600 118 Z M70 96 L88 112 L84 136 L110 124 Z" fill={`url(#hatch${id})`} />
      <path d="M170 70 L160 80 L172 78 L178 86 L184 78 Z M540 80 L532 90 L542 88 L548 94 L553 88 Z" fill="#fbf7ec" stroke={INK} strokeWidth="0.8" />
      {/* Felder */}
      <path d="M0 176 C120 160 260 170 340 158 S560 150 640 160 V210 H0 Z" fill="#eadcae" stroke={INK} strokeWidth="1" />
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d={`M${i * 44 - 20} 210 L${i * 40 + 30} 168`} stroke={INK} strokeOpacity="0.3" strokeWidth="0.9" />
      ))}
      {/* Dorf mit Minarett */}
      <Houses x0={280} x1={380} base={178} seed={5} id={id} />
      <Minaret x={330} base={178} h={46} />
      {/* Pappeln */}
      {[210, 226, 244, 420, 436].map((x) => (
        <g key={x}>
          <path d={`M${x} 184 C${x - 7} 170 ${x - 5} 150 ${x} 138 C${x + 5} 150 ${x + 7} 170 ${x} 184 Z`} fill={PAPER} stroke={INK} strokeWidth="0.9" />
          <path d={`M${x} 184 C${x + 5} 170 ${x + 5} 152 ${x} 140 Z`} fill={`url(#hatch2${id})`} />
        </g>
      ))}
      <rect x="0" y={base} width={W} height={H - base} fill={`url(#dots${id})`} />
    </>
  );
}

function Wahlnacht({ id, banner }: { id: string; banner?: string }) {
  const base = 196;
  return (
    <>
      {/* Sterne */}
      {Array.from({ length: 40 }, (_, i) => (
        <circle key={i} cx={(i * 97) % W} cy={(i * 53) % 110 + 8} r={i % 5 === 0 ? 1.4 : 0.8} fill="#f6ecd2" fillOpacity="0.85" />
      ))}
      <path d="M560 40 a18 18 0 1 0 14 30 a14 14 0 1 1 -14 -30 Z" fill="#f6ecd2" />
      {/* Menge mit Fahnen vor einem Podium */}
      {/* Scheinwerfer */}
      <path d={`M300 0 L230 ${base} L290 ${base} Z M350 0 L360 ${base} L420 ${base} Z`} fill="#f6ecd2" opacity="0.08" />
      {/* Bühne mit Transparent und Rednerin am Pult */}
      <line x1="232" y1={base - 40} x2="232" y2={base - 138} stroke="#120c08" strokeWidth="2" />
      <line x1="408" y1={base - 40} x2="408" y2={base - 138} stroke="#120c08" strokeWidth="2" />
      <rect x="226" y={base - 138} width="188" height="32" fill="#e7d7b0" stroke="#120c08" />
      <path d={`M226 ${base - 138} h188 v32 h-188 Z`} fill="none" stroke="#b3352b" strokeWidth="3" />
      <text x="320" y={base - 117} textAnchor="middle" fontFamily="Fraunces Variable, serif" fontWeight="700" fontSize="15" fill="#3a2a1e" {...((banner ?? "").length > 14 ? { textLength: 172, lengthAdjust: "spacingAndGlyphs" } : { letterSpacing: "0.04em" })}>
        {(banner ?? "Wahlnacht").toUpperCase()}
      </text>
      <rect x="236" y={base - 40} width="168" height="40" fill="#3a2a1e" stroke="#120c08" />
      <rect x="236" y={base - 40} width="168" height="6" fill="#b3352b" />
      <path d={`M311 ${base - 40} l2 -30 c1 -7 13 -7 14 0 l2 30 Z`} fill="#120c08" />
      <circle cx="320" cy={base - 80} r="7" fill="#120c08" />
      <path d={`M314 ${base - 66} l-12 -22 M326 ${base - 66} l12 -22`} stroke="#120c08" strokeWidth="4" strokeLinecap="round" />
      <path d={`M306 ${base - 40} l3 -18 h22 l3 18 Z`} fill="#5a4330" stroke="#120c08" />
      {Array.from({ length: 70 }, (_, i) => {
        const x = (i * 9.3) % W;
        const y = base + 8 + ((i * 7) % 26);
        return <path key={i} d={`M${x} ${y + 14} v-6 a5 5 0 0 1 10 0 v6 Z M${x + 5} ${y - 3} a4 4 0 1 0 0.1 0`} fill="#120c08" />;
      })}
      {[60, 140, 470, 560, 610].map((x, i) => (
        <g key={x}>
          <line x1={x} y1={base + 20} x2={x + 6} y2={base - 44} stroke="#120c08" strokeWidth="1.6" />
          <path d={`M${x + 6} ${base - 44} q16 -6 30 2 v18 q-14 -6 -30 -2 Z`} fill={i % 2 ? "#b3352b" : "#e7d7b0"} stroke="#120c08" />
        </g>
      ))}
      <rect x="0" y={base + 8} width={W} height={H} fill={`url(#hatch${id})`} opacity="0.4" />
    </>
  );
}

const SKY: Record<Scene, [string, string]> = {
  istanbul: ["#f1dcb2", "#f6ead0"],
  parlament: ["#e9dcc0", "#f5ecd4"],
  bank: ["#e6dcc6", "#f4ecd8"],
  anatolien: ["#efd6a4", "#f6e9cb"],
  wahlnacht: ["#1d2330", "#3b3a3f"],
};

export function Vignette({ scene, className, banner }: { scene: Scene; className?: string; banner?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={`vignette ${className ?? ""}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <Defs id={id} sky={SKY[scene]} />
      <rect width={W} height={H} fill={`url(#sky${id})`} />
      <g strokeLinejoin="round">
        {scene === "istanbul" && <Istanbul id={id} />}
        {scene === "parlament" && <Parlament id={id} />}
        {scene === "bank" && <Bank id={id} />}
        {scene === "anatolien" && <Anatolien id={id} />}
        {scene === "wahlnacht" && <Wahlnacht id={id} banner={banner} />}
      </g>
      <rect width={W} height={H} fill={`url(#vig${id})`} />
    </svg>
  );
}
