// Die Szenen des Prologs: eine eigene Tuschezeichnung je Station (Heimat, Campus, Büro, Fähre, Platz, Gründungssaal, Kampagnenbus, Wahlnacht)
// und der Aufbruch für die ersten Blätter. Reine Vektorzeichnung im Stil der Karte: Tinte auf Papier, Schatten als Schraffur, der Himmel als Lasur.
// Jede Szene besteht aus Ebenen (fern, mittel, nah). Bei der Effektstufe „hoch“ verschieben sie sich mit dem Zeiger (Parallaxe, `--px`/`--py` am
// Buch), bei „mittel“ ziehen Wolken, Vögel und Licht langsam, bei „aus“ steht alles still (prolog/buch.css).

import { useId, type ReactNode } from "react";

export type SzenenId = "aufbruch" | "kindheit" | "jugend" | "beruf" | "liebe" | "politik" | "partei" | "wahlkampf" | "wahlnacht";

const W = 640;
const H = 260;
const INK = "#2a1f18";
const PAPIER = "#f3e7c9";

const HIMMEL: Record<SzenenId, [string, string]> = {
  aufbruch: ["#f4cf98", "#f8ecd0"],
  kindheit: ["#efc98e", "#f8e8c4"],
  jugend: ["#dfe3dc", "#f6edd6"],
  beruf: ["#252c42", "#5d5568"],
  liebe: ["#f0a97c", "#f8e3b6"],
  politik: ["#d9e0dc", "#f6edd8"],
  partei: ["#e8d4aa", "#f5e8c8"],
  wahlkampf: ["#f0d49a", "#f7ead0"],
  wahlnacht: ["#161b2a", "#3b3a44"],
};

// ---------------------------------------------------------------------------
// Bausteine

const f = (x: number) => Math.round(x * 10) / 10;

/** Zeichengrund: Himmel, Schraffuren, Leuchten, Randabdunklung */
function Grund({ id, szene, children }: { id: string; szene: SzenenId; children: ReactNode }) {
  const [a, b] = HIMMEL[szene];
  return (
    <svg className={`sz sz-${szene}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`h${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
        <pattern id={`s1${id}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
          <line x1="0" y1="0" x2="0" y2="4" stroke={INK} strokeWidth="0.9" strokeOpacity="0.5" />
        </pattern>
        <pattern id={`s2${id}`} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)">
          <line x1="0" y1="0" x2="0" y2="3" stroke={INK} strokeWidth="0.8" strokeOpacity="0.45" />
        </pattern>
        <radialGradient id={`g${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff3c4" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff3c4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`l${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff1bd" stopOpacity="0.65" />
          <stop offset="1" stopColor="#fff1bd" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`v${id}`} cx="50%" cy="45%" r="75%">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#3a2410" stopOpacity="0.38" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#h${id})`} />
      <g strokeLinejoin="round" strokeLinecap="round">{children}</g>
      <rect width={W} height={H} fill={`url(#v${id})`} />
    </svg>
  );
}

/** Eine Ebene der Parallaxe: 1 fern, 2 mittel, 3 nah */
const Ebene = ({ n, children }: { n: 1 | 2 | 3; children: ReactNode }) => <g className={`sz-e sz-e${n}`}>{children}</g>;

/** Sanfte Hügellinie als gefüllte Fläche; `schraffur` legt Tinte darüber */
function Huegel({ id, y, amp = 14, fq = 0.011, ph = 0, fill, schraffur, strichOp = 0.85, unten = H + 20 }: { id: string; y: number; amp?: number; fq?: number; ph?: number; fill: string; schraffur?: 1 | 2; strichOp?: number; unten?: number }) {
  const pts: string[] = [];
  for (let x = -16; x <= W + 16; x += 16) pts.push(`${x} ${f(y - amp * (Math.sin(x * fq + ph) + 0.45 * Math.sin(x * fq * 2.3 + ph * 1.7)))}`);
  const d = `M${pts.join(" L")} L${W + 16} ${unten} L-16 ${unten} Z`;
  return (
    <g>
      <path d={d} fill={fill} stroke={INK} strokeOpacity={strichOp} strokeWidth="1" />
      {schraffur && <path d={d} fill={`url(#s${schraffur}${id})`} opacity="0.35" />}
    </g>
  );
}

/** Berge mit Schneekappen aus Zickzack */
function Berge({ y, farbe = "#e9dcb8", hoehe = 70, n = 6, ph = 1 }: { y: number; farbe?: string; hoehe?: number; n?: number; ph?: number }) {
  const pts: string[] = [`-10 ${y}`];
  const dx = (W + 20) / n;
  for (let i = 0; i < n; i++) {
    const h = hoehe * (0.55 + 0.45 * Math.abs(Math.sin(i * 2.1 + ph)));
    pts.push(`${f(-10 + dx * (i + 0.5))} ${f(y - h)}`, `${f(-10 + dx * (i + 1))} ${f(y - h * 0.18)}`);
  }
  pts.push(`${W + 10} ${y}`);
  return <path d={`M${pts.join(" L")} Z`} fill={farbe} stroke={INK} strokeOpacity="0.7" strokeWidth="1" />;
}

function Wolke({ x, y, s = 1, klasse = "sz-wolke", dauer = 90, versatz = 0 }: { x: number; y: number; s?: number; klasse?: string; dauer?: number; versatz?: number }) {
  return (
    <g className={klasse} style={{ ["--d" as string]: `${dauer}s`, ["--v" as string]: `${versatz}s` }}>
      <g transform={`translate(${x} ${y}) scale(${s})`} fill={PAPIER} fillOpacity="0.85" stroke={INK} strokeOpacity="0.35" strokeWidth="0.9">
        <path d="M0 10c-8 0-10-9-2-11 2-8 14-8 17-1 8-4 16 3 11 10 6 2 2 8-3 7H3c-5 1-8-2-3-5z" />
      </g>
    </g>
  );
}

function Voegel({ x, y, n = 3, s = 1, dauer = 26 }: { x: number; y: number; n?: number; s?: number; dauer?: number }) {
  return (
    <g className="sz-voegel" style={{ ["--d" as string]: `${dauer}s` }}>
      {Array.from({ length: n }, (_, i) => (
        <path key={i} className="sz-vogel" style={{ ["--i" as string]: i }} d={`M${x + i * 17 * s} ${y + (i % 2) * 7 * s} q${3.5 * s} ${-4.5 * s} ${7 * s} 0 q${3.5 * s} ${-4.5 * s} ${7 * s} 0`} fill="none" stroke={INK} strokeWidth="1.1" />
      ))}
    </g>
  );
}

function Pappel({ x, y, h = 40, farbe = "#8d9a5b" }: { x: number; y: number; h?: number; farbe?: string }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - h * 0.25} stroke={INK} strokeWidth="1.4" />
      <ellipse cx={x} cy={y - h * 0.6} rx={h * 0.13} ry={h * 0.42} fill={farbe} stroke={INK} strokeWidth="1" />
      <path d={`M${x - h * 0.02} ${y - h * 0.9} q${h * 0.08} ${h * 0.4} 0 ${h * 0.6}`} fill="none" stroke={INK} strokeOpacity="0.45" strokeWidth="0.8" />
    </g>
  );
}

function Mensch({ x, y, s = 1, fill = "#3a2d24", arm }: { x: number; y: number; s?: number; fill?: string; arm?: "hoch" | "fahne" }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill} stroke={INK} strokeWidth="0.8">
      <circle cx="0" cy="-17" r="3.4" />
      <path d="M-5 0v-9c0-3.5 2.2-5 5-5s5 1.500 5 5v9z" />
      {arm === "hoch" && <path d="M4 -11l5 -9" fill="none" strokeWidth="2" />}
      {arm === "fahne" && (
        <>
          <path d="M4 -11l4 -10" fill="none" strokeWidth="1.8" />
          <line x1="8" y1="-21" x2="8" y2="-34" strokeWidth="1.2" />
          <path className="sz-fahne" d="M8 -34l11 3-11 5z" fill="#b3352b" strokeWidth="0.8" />
        </>
      )}
    </g>
  );
}

function Minarett({ x, y, h }: { x: number; y: number; h: number }) {
  const top = y - h;
  return (
    <g stroke={INK} strokeWidth="1" fill={PAPIER}>
      <rect x={x - 2.4} y={top + 12} width="4.8" height={h - 12} />
      <rect x={x - 3.8} y={y - h * 0.58} width="7.6" height="2.2" />
      <path d={`M${x - 2.4} ${top + 12} L${x} ${top} L${x + 2.4} ${top + 12} Z`} fill={INK} />
    </g>
  );
}

function Kuppel({ x, y, r, farbe = PAPIER }: { x: number; y: number; r: number; farbe?: string }) {
  return (
    <g stroke={INK} strokeWidth="1" fill={farbe}>
      <path d={`M${x - r} ${y} a${r} ${r} 0 0 1 ${2 * r} 0 z`} />
      <line x1={x} y1={y - r} x2={x} y2={y - r - 5} />
    </g>
  );
}

/** Beleuchtete Fenster eines Hauses (flackern bei Effekten) */
function Fenster({ x, y, w, h, n = 1, m = 1, an = 0.8 }: { x: number; y: number; w: number; h: number; n?: number; m?: number; an?: number }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++)
      out.push(<rect key={`${i}-${j}`} className="sz-fenster" style={{ ["--i" as string]: i * 3 + j }} x={x + i * (w + 3)} y={y + j * (h + 3)} width={w} height={h} fill="#ffd978" fillOpacity={an} stroke={INK} strokeWidth="0.6" />);
  return <g>{out}</g>;
}

function Haus({ x, y, w, h, flach = true, farbe = "#efdfb8" }: { x: number; y: number; w: number; h: number; flach?: boolean; farbe?: string }) {
  return (
    <g stroke={INK} strokeWidth="1" fill={farbe}>
      <rect x={x} y={y - h} width={w} height={h} />
      {flach ? <rect x={x - 1.5} y={y - h - 2.5} width={w + 3} height="2.5" fill={INK} fillOpacity="0.8" /> : <path d={`M${x - 2} ${y - h} L${x + w / 2} ${y - h - w * 0.35} L${x + w + 2} ${y - h} Z`} fill="#b45a3c" />}
    </g>
  );
}

function Sterne({ n = 40, hoehe = 130 }: { n?: number; hoehe?: number }) {
  const out: ReactNode[] = [];
  let k = 7;
  for (let i = 0; i < n; i++) {
    k = (k * 9301 + 49297) % 233280;
    const x = (k / 233280) * W;
    k = (k * 9301 + 49297) % 233280;
    const y = (k / 233280) * hoehe;
    out.push(<circle key={i} className="sz-stern" style={{ ["--i" as string]: i % 7 }} cx={f(x)} cy={f(y)} r={i % 5 === 0 ? 1.3 : 0.8} fill="#fdf2cf" />);
  }
  return <g>{out}</g>;
}

/** Wellen: kurze Bögen in Reihen */
function Wellen({ y0, y1, op = 0.4 }: { y0: number; y1: number; op?: number }) {
  const out: ReactNode[] = [];
  let k = 3;
  for (let y = y0 + 5; y < y1; y += 8) {
    for (let x = ((y * 13) % 37) - 20; x < W; x += 30 + ((k = (k * 9301 + 49297) % 233280) % 26)) {
      const len = 10 + (k % 14);
      out.push(<path key={`${x}-${y}`} className="sz-welle" style={{ ["--i" as string]: (x + y) % 5 }} d={`M${x} ${y} q${len / 2} -2.200 ${len} 0`} fill="none" stroke={INK} strokeOpacity={op + ((y - y0) / (y1 - y0)) * 0.25} strokeWidth="0.9" />);
    }
  }
  return <g>{out}</g>;
}

const Lichtkegel = ({ id, pts, klasse = "sz-licht" }: { id: string; pts: string; klasse?: string }) => <polygon className={klasse} points={pts} fill={`url(#l${id})`} />;

// ---------------------------------------------------------------------------
// Die Szenen

function Aufbruch({ id }: { id: string }) {
  return (
    <>
      <circle cx="420" cy="112" r="64" fill={`url(#g${id})`} className="sz-glut" />
      <circle cx="420" cy="112" r="24" fill="#fbe7a8" stroke={INK} strokeOpacity="0.5" />
      <Wolke x={80} y={46} s={1.1} dauer={110} />
      <Wolke x={300} y={30} s={0.8} dauer={140} versatz={-40} />
      <Ebene n={1}>
        <Berge y={150} hoehe={64} farbe="#eadcb8" n={7} ph={2} />
        <Huegel id={id} y={150} amp={6} fq={0.02} fill="#e5d2a0" schraffur={1} strichOp={0.5} />
      </Ebene>
      <Ebene n={2}>
        {/* Ankara in der Ferne: Anıtkabir und Kocatepe */}
        <g stroke={INK} strokeWidth="1" fill={PAPIER} opacity="0.95">
          <rect x="478" y="122" width="60" height="18" />
          <path d="M474 122h68l-4 -5h-60z" fill="#d8c496" />
          {[484, 492, 500, 508, 516, 524, 532].map((x) => (
            <line key={x} x1={x} y1="124" x2={x} y2="140" strokeOpacity="0.7" />
          ))}
          <Kuppel x={590} y={140} r={14} />
          <Minarett x={566} y={140} h={34} />
          <Minarett x={614} y={140} h={34} />
        </g>
        <Huegel id={id} y={170} amp={9} fq={0.016} ph={1.2} fill="#d9c28a" schraffur={2} />
      </Ebene>
      <Ebene n={3}>
        {/* Die Straße nach Ankara */}
        <path d="M-20 262 C120 232 250 200 330 178 C390 164 430 160 470 156 L476 160 C440 168 400 176 372 192 C300 222 170 252 120 262 Z" fill="#cdb585" stroke={INK} strokeWidth="1.1" />
        <path className="sz-strasse" d="M-6 254 C120 226 252 196 330 178 C390 166 430 162 468 158" fill="none" stroke={PAPIER} strokeWidth="2" strokeDasharray="10 12" />
        <Huegel id={id} y={236} amp={10} fq={0.014} ph={3} fill="#b79c63" schraffur={1} />
        <Pappel x={380} y={214} h={42} />
        <Pappel x={402} y={206} h={36} />
        <Pappel x={560} y={206} h={46} />
      </Ebene>
      <Voegel x={210} y={86} n={4} />
    </>
  );
}

function Kindheit({ id }: { id: string }) {
  return (
    <>
      <circle cx="470" cy="128" r="70" fill={`url(#g${id})`} className="sz-glut" />
      <circle cx="470" cy="128" r="26" fill="#ffe59c" stroke={INK} strokeOpacity="0.55" />
      <Lichtkegel id={id} pts="440,128 500,128 640,260 300,260" />
      <Wolke x={60} y={40} s={1.2} dauer={120} />
      <Wolke x={340} y={26} s={0.9} dauer={150} versatz={-60} />
      <Ebene n={1}>
        <Berge y={150} hoehe={74} farbe="#eadbb4" n={6} ph={0.4} />
      </Ebene>
      <Ebene n={2}>
        <Huegel id={id} y={164} amp={10} fq={0.013} ph={0.6} fill="#dcc690" schraffur={1} />
        {/* Das Dorf mit Minarett */}
        <Haus x={330} y={170} w={26} h={16} />
        <Haus x={360} y={170} w={20} h={22} farbe="#e9d6a8" />
        <Haus x={384} y={170} w={30} h={14} />
        <Minarett x={420} y={170} h={46} />
        <Haus x={430} y={170} w={26} h={18} farbe="#e9d6a8" />
        <Fenster x={334} y={157} w={4} h={5} n={2} an={0.7} />
        <Fenster x={364} y={152} w={4} h={5} n={2} m={2} an={0.8} />
        {[308, 462, 474, 486].map((x, i) => (
          <Pappel key={x} x={x} y={172 + (i % 2) * 2} h={34 + i * 3} />
        ))}
      </Ebene>
      <Ebene n={3}>
        <Huegel id={id} y={218} amp={12} fq={0.011} ph={2.4} fill="#c3a56a" schraffur={2} />
        {/* Das Haus der Familie, abends, mit hellem Küchenfenster */}
        <g stroke={INK} strokeWidth="1.1">
          <rect x="500" y="170" width="96" height="62" fill="#ead9ac" />
          <path d="M494 172 L548 142 L602 172 Z" fill="#a8532f" />
          <rect x="516" y="184" width="22" height="22" fill="#ffd36e" className="sz-fenster" />
          <path d="M527 184v22M516 195h22" stroke={INK} strokeWidth="0.9" fill="none" />
          <rect x="556" y="196" width="18" height="36" fill="#6a4a32" />
          <rect x="580" y="186" width="10" height="14" fill="#ffd36e" className="sz-fenster" style={{ ["--i" as string]: 3 }} />
          <rect x="574" y="148" width="9" height="20" fill="#d8c496" />
        </g>
        <g className="sz-rauch" fill="none" stroke={INK} strokeOpacity="0.4" strokeWidth="1.2">
          <path d="M578 146c-4-6 4-9 0-15" />
          <path d="M582 140c-4-6 4-9 0-15" style={{ animationDelay: "-2s" }} />
        </g>
        <Pappel x={470} y={232} h={52} farbe="#7f8d4f" />
      </Ebene>
      <Voegel x={150} y={96} n={3} dauer={30} />
    </>
  );
}

function Jugend({ id }: { id: string }) {
  return (
    <>
      <Wolke x={90} y={34} s={1} dauer={100} />
      <Wolke x={420} y={50} s={1.2} dauer={130} versatz={-50} />
      <Ebene n={1}>
        {/* Istanbul in der Ferne */}
        <g stroke={INK} strokeWidth="0.9" fill="#e6d6ae" opacity="0.95">
          <Kuppel x={110} y={140} r={22} farbe="#e6d6ae" />
          <Kuppel x={160} y={146} r={15} farbe="#e6d6ae" />
          <Minarett x={84} y={150} h={56} />
          <Minarett x={190} y={150} h={52} />
          <Kuppel x={300} y={150} r={18} farbe="#e6d6ae" />
          <Minarett x={274} y={156} h={50} />
          <Minarett x={326} y={156} h={50} />
        </g>
        <Huegel id={id} y={154} amp={4} fq={0.03} fill="#e1d0a6" />
      </Ebene>
      <Ebene n={2}>
        {/* Die Universität */}
        <g stroke={INK} strokeWidth="1.1">
          <rect x="360" y="104" width="190" height="86" fill="#f1e4c3" />
          <path d="M352 104h206l-103 -34z" fill="#e5d3a8" />
          <circle cx="455" cy="92" r="8" fill={PAPIER} />
          {[374, 396, 418, 440, 462, 484, 506, 528].map((x) => (
            <rect key={x} x={x} y="112" width="8" height="70" fill="#fbf2d8" />
          ))}
          <rect x="352" y="182" width="206" height="8" fill="#d3bd8c" />
          <rect x="344" y="190" width="222" height="7" fill="#c6ae7c" />
        </g>
        <path d="M372 190v-20a24 24 0 0148 0v20" fill="none" stroke={INK} strokeOpacity="0.4" />
        <Huegel id={id} y={206} amp={3} fq={0.02} ph={1} fill="#cfb882" schraffur={2} />
      </Ebene>
      <Ebene n={3}>
        <rect x="-20" y="214" width="700" height="60" fill="#bfa56f" stroke={INK} strokeWidth="1" />
        <rect x="-20" y="214" width="700" height="60" fill={`url(#s1${id})`} opacity="0.25" />
        {/* Studentinnen und Studenten mit Transparent und Fahne */}
        <Mensch x={250} y={236} s={1.2} arm="hoch" />
        <Mensch x={284} y={240} s={1.1} fill="#4a3426" />
        <Mensch x={318} y={238} s={1.25} arm="fahne" fill="#2e3b4a" />
        <Mensch x={540} y={238} s={1.15} fill="#51382a" />
        <Mensch x={572} y={242} s={1.2} arm="hoch" fill="#2f4a3d" />
        <g stroke={INK} strokeWidth="0.9">
          <line x1="250" y1="222" x2="250" y2="190" />
          <line x1="288" y1="222" x2="288" y2="190" />
          <path className="sz-fahne" d="M250 190h38v14h-38z" fill="#f6ecd0" />
          <path d="M255 197h28" stroke="#8e2a22" strokeWidth="2" fill="none" />
        </g>
      </Ebene>
      {/* Flugblätter */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} className="sz-blatt" style={{ ["--i" as string]: i, ["--x" as string]: `${200 + i * 66}px` }} x="0" y="0" width="9" height="12" fill="#fbf4dd" stroke={INK} strokeWidth="0.6" />
      ))}
      <Voegel x={470} y={70} n={3} dauer={34} />
    </>
  );
}

function Beruf({ id }: { id: string }) {
  const fenster: ReactNode[] = [];
  let k = 11;
  for (let b = 0; b < 12; b++) {
    k = (k * 9301 + 49297) % 233280;
    const x = 20 + b * 54;
    const h = 40 + (k % 80);
    fenster.push(
      <g key={b}>
        <rect x={x} y={214 - h} width="40" height={h} fill="#1b2033" stroke="#0d1018" strokeWidth="1" />
        {Array.from({ length: Math.floor(h / 12) }, (_, j) =>
          [0, 1, 2].map((i) => ((k >> (j + i)) % 3 !== 0 ? <rect key={`${j}-${i}`} className="sz-fenster" style={{ ["--i" as string]: (j * 3 + i + b) % 9 }} x={x + 5 + i * 12} y={214 - h + 6 + j * 12} width="7" height="6" fill="#ffd36e" fillOpacity="0.85" /> : null)),
        )}
      </g>,
    );
  }
  return (
    <>
      <Sterne n={22} hoehe={90} />
      <circle cx="560" cy="60" r="18" fill="#f6eccb" stroke={INK} strokeOpacity="0.4" />
      <circle cx="568" cy="56" r="16" fill="#252c42" />
      <Ebene n={1}>
        <rect x="-20" y="150" width="700" height="70" fill="#2d3550" opacity="0.6" />
      </Ebene>
      <Ebene n={2}>{fenster}</Ebene>
      <Ebene n={3}>
        {/* Fensterrahmen und Schreibtisch mit Lampe */}
        <rect x="-4" y="-4" width={W + 8} height={H + 8} fill="none" stroke="#1a1410" strokeWidth="14" />
        <path d="M213 0v260M426 0v260" stroke="#1a1410" strokeWidth="6" />
        <path d="M-10 230h660v40H-10z" fill="#3a2a1d" stroke={INK} />
        <path d="M-10 230h660" stroke="#8a6a3c" strokeWidth="2" />
        <g stroke="#0d0a07" strokeWidth="1">
          <rect x="420" y="214" width="46" height="16" fill="#efe3c4" />
          <rect x="426" y="208" width="46" height="12" fill="#e2d3ac" />
          <rect x="432" y="202" width="46" height="8" fill="#efe3c4" />
        </g>
        <polygon className="sz-licht" points="520,178 580,178 640,240 470,240" fill={`url(#l${id})`} />
        <g stroke="#0d0a07" strokeWidth="1.2" fill="#6b4a2a">
          <path d="M540 230v-34l22 -12" fill="none" strokeWidth="2.4" />
          <path d="M553 180l18 10-8 8z" fill="#c69a4a" />
          <ellipse cx="540" cy="231" rx="14" ry="3" />
        </g>
        <circle cx="562" cy="192" r="7" fill="#ffe7a0" className="sz-glut" />
      </Ebene>
    </>
  );
}

function Liebe({ id }: { id: string }) {
  return (
    <>
      <circle cx="330" cy="150" r="90" fill={`url(#g${id})`} className="sz-glut" />
      <circle cx="330" cy="150" r="30" fill="#ffe0a0" stroke={INK} strokeOpacity="0.5" />
      <Wolke x={70} y={50} s={1.1} dauer={110} />
      <Wolke x={460} y={36} s={0.9} dauer={140} versatz={-70} />
      <Ebene n={1}>
        {/* Das ferne Ufer mit Galata-Turm und Minaretten */}
        <path d={`M-20 164 L${W + 20} 164 L${W + 20} 176 L-20 176 Z`} fill="#d7b88a" stroke={INK} strokeOpacity="0.6" />
        <g stroke={INK} strokeWidth="0.9" fill="#e5cfa0">
          <rect x="470" y="104" width="14" height="60" />
          <path d="M466 104h22l-11 -16z" fill="#b45a3c" />
          <rect x="468" y="100" width="18" height="6" />
          <Kuppel x={560} y={164} r={22} farbe="#e5cfa0" />
          <Minarett x={532} y={164} h={62} />
          <Minarett x={590} y={164} h={58} />
          <Kuppel x={90} y={164} r={16} farbe="#e5cfa0" />
          <Minarett x={66} y={164} h={46} />
          <Minarett x={114} y={164} h={44} />
        </g>
      </Ebene>
      <Ebene n={2}>
        <rect x="-20" y="176" width="700" height="90" fill="#9fb4ab" stroke={INK} strokeWidth="1" strokeOpacity="0.6" />
        <rect x="-20" y="176" width="700" height="90" fill={`url(#s1${id})`} opacity="0.2" />
        <rect x="300" y="178" width="60" height="80" fill="#ffe4a8" opacity="0.5" />
        <Wellen y0={178} y1={262} />
        {/* Die Fähre */}
        <g className="sz-faehre" stroke={INK} strokeWidth="1.1">
          <path d="M120 196h120l-12 14h-100z" fill="#2e3b4a" />
          <rect x="140" y="178" width="76" height="18" fill="#f4e8c8" />
          <rect x="156" y="166" width="38" height="12" fill="#f4e8c8" />
          <rect x="172" y="152" width="7" height="14" fill="#a8532f" />
          {[146, 160, 174, 188, 202].map((x) => (
            <rect key={x} x={x} y="183" width="7" height="6" fill="#ffd978" />
          ))}
        </g>
      </Ebene>
      <Ebene n={3}>
        {/* Reling mit zwei Teegläsern */}
        <rect x="-20" y="228" width="700" height="40" fill="#3b2a1b" stroke={INK} />
        <path d="M-20 234h700" stroke="#c69a4a" strokeWidth="2" />
        {[0, 1].map((i) => (
          <g key={i} transform={`translate(${430 + i * 56} 0)`} stroke={INK} strokeWidth="1.2">
            <path d="M0 232c0-6 2-12 6-12h12c4 0 6 6 6 12z" fill="#fdf2d4" fillOpacity="0.9" />
            <path d="M2 228h20" stroke="#8e2a22" strokeWidth="2" />
            <ellipse cx="12" cy="234" rx="17" ry="3" fill="#e8d6a8" />
            <path className="sz-dampf" style={{ ["--i" as string]: i }} d="M10 214c-4-5 4-8 0-13M16 214c-4-5 4-8 0-13" fill="none" strokeOpacity="0.5" />
          </g>
        ))}
      </Ebene>
      <Voegel x={110} y={100} n={4} dauer={22} />
    </>
  );
}

function Politik({ id }: { id: string }) {
  const kopf: ReactNode[] = [];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 24; i++) kopf.push(<Mensch key={`${r}-${i}`} x={150 + i * 19 + (r % 2) * 9} y={246 - r * 10} s={0.55 + r * 0.05} fill={["#3a2d24", "#2f2a2e", "#4a3426", "#2e3b4a"][(i + r) % 4]!} arm={(i * 5 + r) % 11 === 0 ? "hoch" : undefined} />);
  return (
    <>
      <Wolke x={100} y={36} s={1} dauer={110} />
      <Wolke x={460} y={50} s={1.2} dauer={140} versatz={-60} />
      <Ebene n={1}>
        <Huegel id={id} y={150} amp={8} fq={0.02} ph={2} fill="#e3d4ac" schraffur={1} strichOp={0.5} />
      </Ebene>
      <Ebene n={2}>
        {/* Das Rathaus mit Uhrenturm */}
        <g stroke={INK} strokeWidth="1.1">
          <rect x="330" y="116" width="220" height="82" fill="#f1e4c3" />
          <rect x="314" y="140" width="20" height="58" fill="#e8d8b0" />
          <rect x="546" y="140" width="20" height="58" fill="#e8d8b0" />
          <rect x="414" y="64" width="52" height="56" fill="#f6ebcc" />
          <path d="M408 64h64l-32 -26z" fill="#a8532f" />
          <circle cx="440" cy="86" r="12" fill="#fbf6e2" />
          <path d="M440 86v-8M440 86l6 3" fill="none" strokeWidth="1.4" />
          {[346, 372, 398, 482, 508, 534].map((x) => (
            <rect key={x} x={x} y="134" width="14" height="22" fill="#ffd978" fillOpacity="0.55" strokeWidth="0.8" />
          ))}
          <rect x="426" y="156" width="28" height="42" fill="#6a4a32" />
          <line x1="440" y1="38" x2="440" y2="14" />
          <path className="sz-fahne" d="M440 14l16 4-16 6z" fill="#b3352b" strokeWidth="0.8" />
        </g>
      </Ebene>
      <Ebene n={3}>
        <rect x="-20" y="196" width="700" height="80" fill="#c9b27c" stroke={INK} />
        <rect x="-20" y="196" width="700" height="80" fill={`url(#s2${id})`} opacity="0.25" />
        {/* Girlanden */}
        <path d="M-10 70 Q160 110 330 78 T650 88" fill="none" stroke={INK} strokeOpacity="0.7" strokeWidth="1.2" />
        {Array.from({ length: 16 }, (_, i) => {
          const x = 8 + i * 40;
          return <path key={i} className="sz-wimpel" style={{ ["--i" as string]: i % 5 }} d={`M${x} ${80 + Math.sin(i * 0.5) * 8} l9 3 l-4 11 z`} fill={i % 2 ? "#b3352b" : "#f4e8c8"} stroke={INK} strokeWidth="0.7" />;
        })}
        {/* Rednerpult mit Lautsprechern */}
        <g stroke={INK} strokeWidth="1.1">
          <rect x="54" y="170" width="70" height="30" fill="#7b5a37" />
          <rect x="52" y="166" width="74" height="6" fill="#a4793f" />
          <path d="M78 166l8 -26 8 26z" fill="#6a4a32" />
          <path d="M70 120l30 -8v22l-30 -8z" fill="#2c2c30" />
          <path d="M100 112l12 -4v30l-12 -4z" fill="#46464c" />
          <line x1="86" y1="140" x2="86" y2="134" />
        </g>
        <Mensch x={86} y={170} s={1.4} fill="#2f4a3d" arm="hoch" />
        {kopf}
      </Ebene>
      <Voegel x={250} y={110} n={3} dauer={28} />
    </>
  );
}

function Partei({ id, farbe }: { id: string; farbe: string }) {
  const stuehle: ReactNode[] = [];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) stuehle.push(<g key={`${r}-${i}`} stroke={INK} strokeWidth="0.9" fill="#8a6a3c" transform={`translate(${150 + i * 44 + r * 18} ${232 - r * 14}) scale(${1 - r * 0.12})`}><rect x="0" y="-14" width="22" height="3" /><rect x="1" y="-11" width="3" height="11" /><rect x="18" y="-11" width="3" height="11" /><rect x="0" y="-6" width="22" height="3" /></g>);
  return (
    <>
      <rect width={W} height={H} fill="#ecd9b0" />
      <rect width={W} height="210" fill={`url(#s2${id})`} opacity="0.1" />
      <Ebene n={1}>
        {/* Hohe Fenster mit Lichtbahnen */}
        {[90, 250, 410, 570].map((x) => (
          <g key={x} stroke={INK} strokeWidth="1.1">
            <path d={`M${x - 28} 190V70a28 28 0 0156 0v120z`} fill="#f9eebf" />
            <path d={`M${x} 42v148M${x - 28} 110h56`} fill="none" strokeWidth="0.9" />
          </g>
        ))}
        <Lichtkegel id={id} pts="62,100 118,100 190,260 30,260" />
        <Lichtkegel id={id} pts="382,100 438,100 510,260 350,260" klasse="sz-licht sz-licht2" />
        {Array.from({ length: 16 }, (_, i) => (
          <circle key={i} className="sz-staub" style={{ ["--i" as string]: i }} cx={60 + ((i * 97) % 520)} cy={110 + ((i * 53) % 110)} r="1.1" fill="#fff6d0" />
        ))}
      </Ebene>
      <Ebene n={2}>
        <path d="M-10 196h660v70H-10z" fill="#9c7a48" stroke={INK} />
        <path d="M-10 196h660" stroke="#e1c27c" strokeWidth="2" />
        {/* Das Rednerpult mit der Fahne der neuen Partei */}
        <g stroke={INK} strokeWidth="1.2">
          <line x1="300" y1="196" x2="300" y2="60" strokeWidth="2.2" />
          <circle cx="300" cy="56" r="3" fill="#c69a4a" />
          <path className="sz-fahne sz-fahne-gross" d="M302 64h92c-8 14-8 26 0 40h-92z" fill={farbe} />
          <path d="M314 84h58M314 94h40" stroke="#fff6dc" strokeWidth="2" fill="none" strokeOpacity="0.85" />
          <rect x="262" y="180" width="76" height="30" fill="#6a4a32" />
          <rect x="256" y="176" width="88" height="6" fill="#8a6a3c" />
        </g>
      </Ebene>
      <Ebene n={3}>{stuehle}
        <g stroke={INK} strokeWidth="1">
          <path d="M470 232h130v10H470z" fill="#6a4a32" />
          <rect x="482" y="218" width="32" height="14" fill="#fbf4dd" />
          <rect x="520" y="222" width="28" height="10" fill="#efe3c4" />
        </g>
      </Ebene>
    </>
  );
}

function Wahlkampf({ id }: { id: string }) {
  return (
    <>
      <circle cx="500" cy="96" r="80" fill={`url(#g${id})`} className="sz-glut" />
      <g transform="translate(500 96)">
        <g className="sz-strahlen" stroke="#e3b95c" strokeOpacity="0.5" strokeWidth="2">
          {Array.from({ length: 14 }, (_, i) => (
            <line key={i} x1="34" y1="0" x2="62" y2="0" transform={`rotate(${i * (360 / 14)})`} />
          ))}
        </g>
      </g>
      <circle cx="500" cy="96" r="28" fill="#ffe59c" stroke={INK} strokeOpacity="0.5" />
      <Wolke x={70} y={40} s={1.1} dauer={110} />
      <Wolke x={300} y={60} s={0.8} dauer={150} versatz={-50} />
      <Ebene n={1}>
        <Berge y={140} hoehe={50} farbe="#eadcb8" n={8} ph={3} />
        <Huegel id={id} y={146} amp={8} fq={0.018} ph={0.3} fill="#dfc994" schraffur={1} strichOp={0.6} />
      </Ebene>
      <Ebene n={2}>
        <Huegel id={id} y={178} amp={12} fq={0.012} ph={2} fill="#cdb27a" schraffur={2} />
        {[40, 120, 200, 460, 540].map((x, i) => (
          <g key={x} stroke={INK} strokeWidth="1">
            <line x1={x} y1="186" x2={x + 3} y2="156" strokeWidth="1.4" />
            <path className="sz-wimpel" style={{ ["--i" as string]: i }} d={`M${x + 3} 156 q12 -4 22 2 v14 q-10 -4 -22 -2z`} fill={i % 2 ? "#b3352b" : "#f6ecd0"} />
          </g>
        ))}
      </Ebene>
      <Ebene n={3}>
        <path d="M-20 268 L250 196 L330 196 L690 268 Z" fill="#8f8570" stroke={INK} strokeWidth="1.2" />
        <path className="sz-strasse" d="M290 262 L290 198" stroke={PAPIER} strokeWidth="3" strokeDasharray="12 14" fill="none" transform="translate(30 0)" />
        <path d="M-20 268 L250 196" stroke="#f2e6c4" strokeWidth="2" fill="none" />
        <path d="M690 268 L330 196" stroke="#f2e6c4" strokeWidth="2" fill="none" />
        {/* Der Kampagnenbus */}
        <g className="sz-bus" stroke={INK} strokeWidth="1.3">
          <rect x="200" y="196" width="200" height="50" rx="9" fill="#f6ecd0" />
          <rect x="200" y="226" width="200" height="14" fill="#8e2a22" />
          <rect x="214" y="204" width="132" height="14" fill="#2e3b4a" />
          {[226, 252, 278, 304, 330].map((x) => (
            <path key={x} d={`M${x} 204v14`} stroke="#f6ecd0" strokeWidth="2" fill="none" />
          ))}
          <rect x="352" y="204" width="34" height="22" fill="#2e3b4a" />
          <path d="M214 232h110" stroke="#fbf4dd" strokeWidth="3" fill="none" />
          {[240, 360].map((x) => (
            <g key={x} transform={`translate(${x} 246)`}>
              <g className="sz-rad">
                <circle r="9" fill="#1a1410" />
                <circle r="3.500" fill="#c69a4a" />
                <path d="M0 -8v16M-8 0h16" stroke="#c69a4a" strokeWidth="1" />
              </g>
            </g>
          ))}
          <line x1="300" y1="196" x2="300" y2="178" />
          <path className="sz-fahne" d="M300 178l22 4-22 8z" fill="#b3352b" strokeWidth="0.8" />
        </g>
        <path className="sz-staub" style={{ ["--i" as string]: 2 }} d="M180 248c-18 0-34 4-50 10M186 240c-18 -2-36 0-54 6" fill="none" stroke={INK} strokeOpacity="0.25" strokeWidth="6" strokeLinecap="round" />
      </Ebene>
      <Voegel x={150} y={80} n={3} dauer={30} />
    </>
  );
}

function Wahlnacht({ id }: { id: string }) {
  const lichter: ReactNode[] = [];
  let k = 5;
  for (let b = 0; b < 14; b++) {
    k = (k * 9301 + 49297) % 233280;
    const x = 10 + b * 47;
    const h = 36 + (k % 70);
    lichter.push(
      <g key={b}>
        <rect x={x} y={192 - h} width="36" height={h} fill="#1e2335" stroke="#0e1119" strokeWidth="1" />
        {Array.from({ length: Math.floor(h / 11) }, (_, j) => [0, 1, 2].map((i) => ((k >> (i + j)) % 3 !== 0 ? <rect key={`${j}-${i}`} className="sz-fenster" style={{ ["--i" as string]: (j + i + b) % 8 }} x={x + 4 + i * 10} y={192 - h + 5 + j * 11} width="6" height="5" fill="#ffd36e" fillOpacity="0.8" /> : null)))}
      </g>,
    );
  }
  const feuer = [
    { x: 150, y: 70, c: "#f2c14e" },
    { x: 330, y: 52, c: "#e0553f" },
    { x: 500, y: 84, c: "#7fc4d8" },
  ];
  return (
    <>
      <Sterne n={50} hoehe={140} />
      <circle cx="560" cy="48" r="20" fill="#f6eccb" stroke={INK} strokeOpacity="0.4" />
      <circle cx="570" cy="43" r="18" fill="#161b2a" />
      {feuer.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y})`}>
          <g className="sz-feuerwerk" style={{ ["--i" as string]: i }} stroke={b.c} strokeWidth="1.8" strokeLinecap="round">
            {Array.from({ length: 12 }, (_, j) => (
              <line key={j} x1="6" y1="0" x2="26" y2="0" transform={`rotate(${j * 30})`} />
            ))}
            <circle r="3" fill={b.c} stroke="none" />
          </g>
        </g>
      ))}
      <Ebene n={1}>
        <rect x="-20" y="150" width="700" height="60" fill="#232a40" opacity="0.7" />
      </Ebene>
      <Ebene n={2}>{lichter}</Ebene>
      <Ebene n={3}>
        <rect x="-20" y="196" width="700" height="80" fill="#0f121c" stroke="#05060a" />
        <path d="M-20 196h700" stroke="#c69a4a" strokeWidth="2" />
        <circle cx="330" cy="176" r="90" fill={`url(#g${id})`} opacity="0.35" className="sz-glut" />
        {/* Die Menge mit Fahnen */}
        {Array.from({ length: 28 }, (_, i) => (
          <Mensch key={i} x={20 + i * 22 + (i % 2) * 8} y={252 + (i % 3) * 4} s={0.95 + (i % 4) * 0.08} fill="#0a0c14" arm={i % 4 === 1 ? "fahne" : i % 5 === 2 ? "hoch" : undefined} />
        ))}
      </Ebene>
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} className="sz-konfetti" style={{ ["--i" as string]: i, ["--x" as string]: `${30 + i * 44}px` }} x="0" y="0" width="5" height="3" fill={["#e0553f", "#f2c14e", "#7fc4d8", "#f4e8c8"][i % 4]} />
      ))}
    </>
  );
}

export interface SzeneProps {
  szene: SzenenId;
  /** Farbe der Partei (Fahne im Gründungssaal) */
  farbe?: string;
  className?: string;
}

/** Die Zeichnung zu einer Station; Ebenen und Bewegung steuert prolog/buch.css. */
export function Szene({ szene, farbe = "#8e2a22", className }: SzeneProps) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={`szene${className ? ` ${className}` : ""}`}>
      <Grund id={id} szene={szene}>
        {szene === "aufbruch" && <Aufbruch id={id} />}
        {szene === "kindheit" && <Kindheit id={id} />}
        {szene === "jugend" && <Jugend id={id} />}
        {szene === "beruf" && <Beruf id={id} />}
        {szene === "liebe" && <Liebe id={id} />}
        {szene === "politik" && <Politik id={id} />}
        {szene === "partei" && <Partei id={id} farbe={farbe} />}
        {szene === "wahlkampf" && <Wahlkampf id={id} />}
        {szene === "wahlnacht" && <Wahlnacht id={id} />}
      </Grund>
    </div>
  );
}
