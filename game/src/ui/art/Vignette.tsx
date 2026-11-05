// Kupferstich-Vignetten für Ereignisse und Prolog. Reine Vektorzeichnung:
// Tinte auf Papier, Schatten als Schraffur, der Himmel als Lasur.

import { useId, type ReactNode } from "react";

export type Scene = "istanbul" | "parlament" | "bank" | "anatolien" | "wahlnacht" | "kueste" | "welt" | "platz" | "presse" | "wissen" | "amtssitz";

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

/** Küste mit Leuchtturm, Radar, Zerstörer und Strahlflugzeug: Kopf der Akte Sicherheit & Verteidigung. */
function Kueste({ id }: { id: string }) {
  const meer = 176;
  return (
    <g>
      {/* Berge im Dunst */}
      <path d={`M380 ${meer} L430 128 L452 142 L498 96 L540 132 L566 118 L640 ${meer} Z`} fill={`url(#dots${id})`} stroke={INK} strokeWidth="0.9" strokeOpacity="0.6" />
      <path d="M498 96 l-9 13 l7 -2 l5 7 l6 -9" fill={PAPER} stroke={INK} strokeWidth="0.9" />
      {/* Steilküste */}
      <path d={`M0 ${meer} L0 132 C34 126 62 118 96 122 C128 126 150 140 176 150 L198 ${meer} Z`} fill={PAPER} stroke={INK} strokeWidth="1.1" />
      <path d={`M10 ${meer} L18 140 M40 ${meer} L52 132 M72 ${meer} L84 128 M110 ${meer} L120 134 M146 ${meer} L156 146`} stroke={INK} strokeWidth="0.7" strokeOpacity="0.5" />
      <path d={`M120 ${meer} C140 160 160 152 184 158 L198 ${meer} Z`} fill={`url(#hatch${id})`} />
      {/* Leuchtturm */}
      <path d="M58 122 L61 78 L71 78 L74 122 Z" fill={PAPER} stroke={INK} strokeWidth="1" />
      <path d="M61 96 h10 M60 108 h12" stroke={INK} strokeWidth="2.4" strokeOpacity="0.75" />
      <rect x="59" y="70" width="14" height="8" fill="#f1d58f" stroke={INK} strokeWidth="0.9" />
      <path d="M57 70 L66 62 L75 70 Z" fill={INK} />
      <path d="M73 74 L116 64 M73 74 L116 84" stroke="#c69a4a" strokeWidth="0.8" strokeOpacity="0.7" />
      {/* Radar */}
      <path d="M120 128 v-18 M108 104 a12 7 0 0 1 24 0 Z" fill={PAPER} stroke={INK} strokeWidth="1" />
      {/* Meer */}
      <rect y={meer} width={W} height={H - meer} fill={PAPER} />
      <Waves y0={meer} y1={H} seed={7} />
      {/* Zerstörer */}
      <g stroke={INK} strokeWidth="1.1">
        <path d={`M262 ${meer - 4} L486 ${meer - 4} L470 ${meer + 9} L280 ${meer + 9} Z`} fill={`url(#hatch2${id})`} />
        <path d={`M262 ${meer - 4} L486 ${meer - 4} L470 ${meer + 9} L280 ${meer + 9} Z`} fill="none" />
        <path d={`M300 ${meer - 4} v-12 h54 v-9 h30 v21 M398 ${meer - 4} v-26 h20 v26`} fill={PAPER} />
        <path d={`M368 ${meer - 25} v-20 M356 ${meer - 45} h24 M408 ${meer - 30} l7 -15 M440 ${meer - 4} v-8 h16 v8`} fill="none" />
        <path d={`M318 ${meer - 10} h12 M384 ${meer - 12} h8`} strokeWidth="0.8" />
      </g>
      <path d={`M262 ${meer + 2} q-14 2 -26 0 M486 ${meer} q12 3 22 1`} fill="none" stroke={INK} strokeWidth="0.7" strokeOpacity="0.5" />
      {/* Strahlflugzeug mit Kondensstreifen */}
      <path d="M210 70 C300 58 380 52 452 44" fill="none" stroke={INK} strokeWidth="0.8" strokeDasharray="2 5" strokeOpacity="0.5" />
      <g stroke={INK} strokeWidth="1" fill={PAPER} strokeLinejoin="round">
        <path d="M452 44 l34 -3 l7 2.5 l-7 2.5 l-34 1.5 Z" />
        <path d="M468 43 l-9 -11 h5 l14 10 M468 45.5 l-7 9 h5 l12 -8 M454 44 l-5 -6 h4 l5 5" />
      </g>
      <circle cx="560" cy="58" r="20" fill="#f1d58f" fillOpacity="0.55" />
    </g>
  );
}


/** Fahnenmast mit Wimpel (Welt, Amtssitz) */
function Fahne({ x, base, h, rot = false, id }: { x: number; base: number; h: number; rot?: boolean; id: string }) {
  return (
    <g>
      <line x1={x} y1={base} x2={x} y2={base - h} stroke={INK} strokeWidth="1.2" />
      <circle cx={x} cy={base - h - 1.5} r="1.6" fill={INK} />
      <path d={`M${x} ${base - h + 2} q10 -4 20 1 q6 3 12 0 v13 q-6 3 -12 0 q-10 -5 -20 -1 Z`} fill={rot ? "#8e2a22" : PAPER} stroke={INK} strokeWidth="0.9" />
      {!rot && <path d={`M${x} ${base - h + 9} q10 -4 20 1 q6 3 12 0 v6 q-6 3 -12 0 q-10 -5 -20 -1 Z`} fill={`url(#hatch2${id})`} />}
    </g>
  );
}

/** Außenpolitik: Globus auf dem Ständer zwischen den Fahnen der Welt, ein Schiff auf dem Meer */
function Welt({ id }: { id: string }) {
  const base = 196, cx = 330, cy = 102, r = 58;
  return (
    <>
      <Clouds />
      <Birds x={520} y={58} />
      {/* Meer und Schiff */}
      <rect y={base} width={W} height={H - base} fill={PAPER} />
      <Waves y0={base} y1={H} seed={3} />
      <g stroke={INK} strokeWidth="1" fill={PAPER}>
        <path d={`M470 ${base - 2} h120 l-12 12 h-98 Z`} fill={`url(#hatch2${id})`} />
        <path d={`M470 ${base - 2} h120 l-12 12 h-98 Z`} fill="none" />
        <path d={`M496 ${base - 2} v-16 h44 v16 M548 ${base - 2} v-10 h20 v10`} />
        <path d={`M512 ${base - 18} v-14 h10 v14`} />
      </g>
      {/* Kai mit Fahnen */}
      <rect x="0" y={base - 6} width="300" height="6" fill={PAPER} stroke={INK} strokeWidth="0.9" />
      {[22, 62, 102, 142, 182, 222].map((x, i) => <Fahne key={x} x={x} base={base - 6} h={70 - (i % 2) * 8} rot={i === 2} id={id} />)}
      {/* Globus */}
      <path d={`M${cx - 26} ${base - 6} h52 l-8 -10 h-36 Z`} fill={PAPER} stroke={INK} />
      <line x1={cx} y1={base - 16} x2={cx} y2={cy + r} stroke={INK} strokeWidth="2.4" />
      <path d={`M${cx - r - 8} ${cy} a${r + 8} ${r + 8} 0 0 0 ${2 * r + 16} 0`} fill="none" stroke={INK} strokeWidth="2" />
      <circle cx={cx} cy={cy} r={r} fill={PAPER} stroke={INK} strokeWidth="1.3" />
      <path d={`M${cx} ${cy - r} a${r} ${r} 0 0 1 0 ${2 * r} a${r * 0.45} ${r} 0 0 0 0 ${-2 * r}`} fill={`url(#hatch${id})`} />
      {[0.35, 0.7].map((k) => <ellipse key={k} cx={cx} cy={cy} rx={r * k} ry={r} fill="none" stroke={INK} strokeWidth="0.7" strokeOpacity="0.7" />)}
      {[-0.5, 0, 0.5].map((k) => <ellipse key={k} cx={cx} cy={cy + k * r} rx={r * Math.sqrt(1 - k * k)} ry={r * 0.12} fill="none" stroke={INK} strokeWidth="0.7" strokeOpacity="0.7" />)}
      {/* Anatolien als Fleck in der Mitte des Globus */}
      <path d={`M${cx - 20} ${cy - 6} q10 -8 24 -4 q12 -2 18 4 q-6 8 -20 8 q-14 2 -22 -8 Z`} fill="#c69a4a" fillOpacity="0.75" stroke={INK} strokeWidth="0.8" />
    </>
  );
}

/** Gesellschaft: Platz mit Uhrturm, Menge und Spruchbändern */
function Platz({ id }: { id: string }) {
  const base = 200;
  const koepfe: ReactNode[] = [];
  let k = 11;
  for (let x = 6; x < W; x += 9 + (k % 5)) {
    k = (k * 9301 + 49297) % 233280;
    const y = base + 10 + (k % 18);
    koepfe.push(<g key={x}><circle cx={x} cy={y - 9} r="4" fill={k % 4 ? PAPER : `url(#hatch2${id})`} stroke={INK} strokeWidth="0.8" /><path d={`M${x - 7} ${y + 8} q0 -12 7 -12 q7 0 7 12`} fill={PAPER} stroke={INK} strokeWidth="0.8" /></g>);
  }
  return (
    <>
      <Clouds />
      <Houses x0={10} x1={250} base={base} seed={13} id={id} />
      <Houses x0={410} x1={630} base={base} seed={21} id={id} />
      {/* Uhrturm */}
      <path d={`M310 ${base} v-118 h40 v118`} fill={PAPER} stroke={INK} />
      <rect x="333" y={base - 118} width="17" height="118" fill={`url(#hatch${id})`} />
      <rect x="304" y={base - 126} width="52" height="8" fill={PAPER} stroke={INK} />
      <circle cx="330" cy={base - 100} r="13" fill={PAPER} stroke={INK} strokeWidth="1.2" />
      <path d="M330 87 v-8 M330 87 l6 4" stroke={INK} strokeWidth="1.2" transform={`translate(0 ${base - 187})`} />
      <path d={`M306 ${base - 126} L330 ${base - 160} L354 ${base - 126} Z`} fill={PAPER} stroke={INK} />
      <path d={`M330 ${base - 160} v-10`} stroke={INK} strokeWidth="1.2" />
      {Array.from({ length: 3 }, (_, i) => <path key={i} d={`M318 ${base - 70 + i * 22} v-10 a4 4 0 0 1 8 0 v10`} fill="none" stroke={INK} strokeWidth="0.8" />)}
      {/* Spruchbänder über der Menge */}
      <path d={`M150 ${base - 2} v-38 M232 ${base - 2} v-40 M150 ${base - 38} q41 6 82 -2 v16 q-41 8 -82 2 Z`} fill="#efe4cb" stroke={INK} strokeWidth="0.9" />
      <path d={`M430 ${base - 2} v-36 M500 ${base - 2} v-34 M430 ${base - 36} q35 -6 70 2 v15 q-35 -7 -70 -2 Z`} fill="#8e2a22" fillOpacity="0.8" stroke={INK} strokeWidth="0.9" />
      <rect x="0" y={base} width={W} height={H - base} fill="#eadcae" />
      {koepfe}
    </>
  );
}

/** Medien: Sendeturm mit Funkwellen, fliegende Zeitungsblätter über der Stadt */
function Presse({ id }: { id: string }) {
  const base = 204, x = 330;
  const blatt = (bx: number, by: number, rot: number) => (
    <g key={`${bx}-${by}`} transform={`rotate(${rot} ${bx} ${by})`}>
      <rect x={bx - 22} y={by - 15} width="44" height="30" fill={PAPER} stroke={INK} strokeWidth="0.9" />
      <rect x={bx - 18} y={by - 11} width="36" height="5" fill={INK} fillOpacity="0.8" />
      {[0, 1, 2, 3].map((i) => <line key={i} x1={bx - 18} y1={by - 2 + i * 4} x2={bx + (i % 2 ? 6 : 18)} y2={by - 2 + i * 4} stroke={INK} strokeWidth="0.6" strokeOpacity="0.7" />)}
      <rect x={bx + 9} y={by - 3} width="9" height="11" fill={`url(#hatch2${id})`} />
    </g>
  );
  return (
    <>
      <Clouds />
      {/* Funkwellen */}
      {/* Funkwellen zu beiden Seiten der Antenne */}
      {[12, 22, 32].map((rr) => [-1, 1].map((d) => <path key={`${rr}${d}`} d={`M${x + d * rr * 0.55} ${base - 178 - rr * 0.8} a${rr} ${rr} 0 0 ${d > 0 ? 1 : 0} 0 ${rr * 1.6}`} fill="none" stroke="#8e2a22" strokeOpacity={0.7 - rr / 80} strokeWidth="1.3" />))}
      {/* Sendeturm */}
      <path d={`M${x - 26} ${base} L${x - 5} ${base - 150} L${x + 5} ${base - 150} L${x + 26} ${base} Z`} fill={PAPER} stroke={INK} />
      <path d={`M${x} ${base - 150} L${x + 5} ${base - 150} L${x + 26} ${base} L${x + 8} ${base} Z`} fill={`url(#hatch${id})`} />
      {Array.from({ length: 6 }, (_, i) => { const y = base - 20 - i * 22, b = 22 - i * 3; return <path key={i} d={`M${x - b} ${y} L${x + b - 4} ${y - 20} M${x + b} ${y} L${x - b + 4} ${y - 20}`} stroke={INK} strokeWidth="0.7" strokeOpacity="0.7" />; })}
      <rect x={x - 12} y={base - 112} width="24" height="10" fill={PAPER} stroke={INK} />
      <line x1={x} y1={base - 150} x2={x} y2={base - 176} stroke={INK} strokeWidth="1.4" />
      <circle cx={x} cy={base - 178} r="2.4" fill="#8e2a22" />
      <Houses x0={20} x1={290} base={base} seed={17} id={id} />
      <Houses x0={370} x1={630} base={base} seed={29} id={id} />
      {blatt(170, 92, -12)}{blatt(480, 70, 9)}{blatt(560, 120, -6)}{blatt(96, 140, 7)}
      <rect x="0" y={base} width={W} height={H - base} fill={`url(#dots${id})`} />
      <line x1="0" y1={base} x2={W} y2={base} stroke={INK} strokeWidth="1.2" />
    </>
  );
}

/** Forschung: Sternwarte mit geöffneter Kuppel, Rakete am Startturm, Umlaufbahn im Himmel */
function Wissen({ id }: { id: string }) {
  const base = 200;
  return (
    <>
      {[[60, 40], [120, 70], [210, 30], [470, 36], [590, 60], [540, 24], [380, 50]].map(([sx, sy]) => <path key={`${sx}`} d={`M${sx} ${sy! - 4} v8 M${sx! - 4} ${sy} h8`} stroke={INK} strokeWidth="0.8" strokeOpacity="0.6" />)}
      <ellipse cx="330" cy="70" rx="260" ry="34" fill="none" stroke="#8e2a22" strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="5 4" transform="rotate(-6 330 70)" />
      <circle cx="560" cy="54" r="5" fill={INK} />
      <path d={`M0 ${base - 20} C140 ${base - 34} 300 ${base - 24} 420 ${base - 30} S560 ${base - 40} 640 ${base - 26} V${base} H0 Z`} fill={`url(#dots${id})`} stroke={INK} strokeOpacity="0.35" />
      {/* Sternwarte */}
      <rect x="190" y={base - 70} width="140" height="70" fill={PAPER} stroke={INK} />
      {Array.from({ length: 5 }, (_, i) => <path key={i} d={`M${204 + i * 26} ${base - 12} v-24 a6 6 0 0 1 12 0 v24`} fill="none" stroke={INK} strokeWidth="0.8" />)}
      <rect x="290" y={base - 70} width="40" height="70" fill={`url(#hatch${id})`} />
      <path d={`M214 ${base - 70} a46 44 0 0 1 92 0 Z`} fill={PAPER} stroke={INK} />
      <path d={`M262 ${base - 70} a46 44 0 0 1 44 0 Z`} fill={`url(#hatch2${id})`} />
      <path d={`M252 ${base - 112} l10 0 l0 42 l-10 0 Z`} fill={INK} fillOpacity="0.85" />
      <path d={`M256 ${base - 104} L226 ${base - 140}`} stroke={INK} strokeWidth="5" strokeLinecap="round" />
      {/* Startturm und Rakete */}
      <path d={`M452 ${base} V${base - 150} h18 V${base}`} fill="none" stroke={INK} strokeWidth="1.2" />
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M452 ${base - i * 18} l18 -18 M470 ${base - i * 18} l-18 -18`} stroke={INK} strokeWidth="0.6" strokeOpacity="0.7" />)}
      <path d={`M470 ${base - 120} h12 M470 ${base - 70} h12`} stroke={INK} strokeWidth="1.2" />
      <g stroke={INK} strokeWidth="1.1">
        <path d={`M484 ${base - 6} V${base - 128} q8 -26 16 0 V${base - 6} Z`} fill={PAPER} />
        <path d={`M492 ${base - 154} q8 0 8 26 V${base - 6} h-8 Z`} fill={`url(#hatch${id})`} />
        <path d={`M484 ${base - 40} l-10 34 h10 M500 ${base - 40} l10 34 h-10`} fill={PAPER} />
        <rect x="486" y={base - 108} width="12" height="5" fill="#8e2a22" />
      </g>
      <rect x="0" y={base} width={W} height={H - base} fill={`url(#dots${id})`} />
      <line x1="0" y1={base} x2={W} y2={base} stroke={INK} strokeWidth="1.2" />
    </>
  );
}

/** Kabinett und Verwaltung: Amtssitz mit Mittelturm, großer Fahne, Freitreppe und Bäumen */
function Amtssitz({ id }: { id: string }) {
  const base = 200;
  return (
    <>
      <Clouds />
      <Fahne x={330} base={base - 128} h={44} rot id={id} />
      {/* Flügel */}
      <rect x="180" y={base - 62} width="300" height="62" fill={PAPER} stroke={INK} />
      <rect x="400" y={base - 62} width="80" height="62" fill={`url(#hatch${id})`} />
      {Array.from({ length: 11 }, (_, i) => i === 5 ? null : <rect key={i} x={192 + i * 26} y={base - 48} width="10" height="16" fill={INK} fillOpacity="0.75" />)}
      {Array.from({ length: 11 }, (_, i) => i === 5 ? null : <rect key={`u${i}`} x={192 + i * 26} y={base - 24} width="10" height="16" fill={INK} fillOpacity="0.75" />)}
      <rect x="176" y={base - 68} width="308" height="6" fill={PAPER} stroke={INK} />
      {/* Mittelbau mit Turm */}
      <rect x="300" y={base - 104} width="60" height="104" fill={PAPER} stroke={INK} />
      <rect x="340" y={base - 104} width="20" height="104" fill={`url(#hatch2${id})`} />
      <path d={`M314 ${base} v-32 a16 16 0 0 1 32 0 v32`} fill={INK} fillOpacity="0.85" />
      <rect x="296" y={base - 112} width="68" height="8" fill={PAPER} stroke={INK} />
      <path d={`M306 ${base - 112} v-16 h48 v16`} fill={PAPER} stroke={INK} />
      {/* Freitreppe */}
      {[0, 1, 2].map((i) => <rect key={i} x={290 - i * 10} y={base + i * 4} width={80 + i * 20} height="4" fill={PAPER} stroke={INK} strokeWidth="0.8" />)}
      {/* Bäume */}
      {[120, 146, 520, 546].map((x) => (
        <g key={x}>
          <line x1={x} y1={base} x2={x} y2={base - 26} stroke={INK} strokeWidth="1.4" />
          <circle cx={x} cy={base - 38} r="16" fill={PAPER} stroke={INK} />
          <path d={`M${x} ${base - 54} a16 16 0 0 1 0 32 Z`} fill={`url(#hatch${id})`} />
        </g>
      ))}
      <rect x="0" y={base + 12} width={W} height={H - base} fill={`url(#dots${id})`} />
      <line x1="0" y1={base + 12} x2={W} y2={base + 12} stroke={INK} strokeWidth="1.2" />
    </>
  );
}

const SKY: Record<Scene, [string, string]> = {
  istanbul: ["#f1dcb2", "#f6ead0"],
  parlament: ["#e9dcc0", "#f5ecd4"],
  bank: ["#e6dcc6", "#f4ecd8"],
  anatolien: ["#efd6a4", "#f6e9cb"],
  wahlnacht: ["#1d2330", "#3b3a3f"],
  kueste: ["#e4dcc4", "#f4ecd6"],
  welt: ["#e2dcc8", "#f4ecd8"],
  platz: ["#f0d9ac", "#f6ead0"],
  presse: ["#e6dcc4", "#f4ecd6"],
  wissen: ["#d9d4c6", "#f1e8d2"],
  amtssitz: ["#ebdcbc", "#f5ecd4"],
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
        {scene === "kueste" && <Kueste id={id} />}
        {scene === "welt" && <Welt id={id} />}
        {scene === "platz" && <Platz id={id} />}
        {scene === "presse" && <Presse id={id} />}
        {scene === "wissen" && <Wissen id={id} />}
        {scene === "amtssitz" && <Amtssitz id={id} />}
      </g>
      <rect width={W} height={H} fill={`url(#vig${id})`} />
    </svg>
  );
}
