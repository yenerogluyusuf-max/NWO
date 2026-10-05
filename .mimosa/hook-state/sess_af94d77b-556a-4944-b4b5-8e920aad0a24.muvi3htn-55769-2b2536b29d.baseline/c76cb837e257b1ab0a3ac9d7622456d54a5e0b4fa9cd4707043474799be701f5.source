// Gemalte Wahrzeichen als Silhouetten im Stil des Spiels: warmer Himmel, Sonne, ferne Hügel, ein dunkles Motiv mit goldenem Saum.
// Drei Zustände: „fertig“ (gemalt), „bau“ (Gerüst und Kran, das Bauwerk wächst mit dem Fortschritt) und „entwurf“ (Bauplan auf blauem Grund).
// Mit `animiert` läuft die Fertigstellung als Zeitraffer: Morgendämmerung, Gerüst und Kran, das Bauwerk wächst Stein für Stein, das Gerüst fällt,
// ein Lichtstreif läuft über den Stein, Strahlen, Funken und Vögel. Alles in SVG und CSS (wunder.css); mit prefers-reduced-motion steht das fertige Bild sofort.

import { useId } from "react";
import type { WunderBild as Bild } from "../../sim/reich-typen";
import "./wunder.css";

export type BildZustand = "fertig" | "bau" | "entwurf";

const TINTE = "#2a1d14";
const GOLD = "#e9c46a";

function saeulen(x0: number, n: number, abstand: number, y0: number, y1: number, breite = 8) {
  return Array.from({ length: n }, (_, i) => {
    const x = x0 + i * abstand;
    return (
      <g key={i}>
        <rect x={x} y={y0} width={breite} height={y1 - y0} />
        <rect x={x - 2} y={y0 - 4} width={breite + 4} height={4} />
        <rect x={x - 2} y={y1} width={breite + 4} height={3} />
      </g>
    );
  });
}

function motiv(art: Bild): React.ReactNode {
  switch (art) {
    case "tempel":
      return (
        <g>
          <rect x="66" y="132" width="188" height="6" />
          <rect x="72" y="126" width="176" height="6" />
          {saeulen(84, 7, 26, 84, 126)}
          <rect x="72" y="72" width="176" height="8" />
          <polygon points="66,72 160,38 254,72" />
          <circle cx="160" cy="58" r="6" fill="#efe4cb" />
        </g>
      );
    case "kuppel":
      return (
        <g>
          <path d="M104 132 V106 A56 56 0 0 1 216 106 V132 Z" />
          <path d="M84 132 V124 A22 22 0 0 1 128 124 V132 Z" />
          <path d="M192 132 V124 A22 22 0 0 1 236 124 V132 Z" />
          <rect x="158" y="34" width="4" height="14" />
          <circle cx="160" cy="32" r="3.2" />
          {[62, 258].map((x) => (
            <g key={x}>
              <rect x={x - 4} y="40" width="8" height="92" />
              <rect x={x - 7} y="62" width="14" height="4" />
              <polygon points={`${x - 5},40 ${x},18 ${x + 5},40`} />
            </g>
          ))}
          <rect x="70" y="132" width="180" height="6" />
        </g>
      );
    case "bruecke": {
      const y = (x: number) => {
        const t = (x - 114) / 100;
        return 52 + 96 * t * (1 - t);
      };
      const haenger = Array.from({ length: 9 }, (_, i) => 124 + i * 10);
      return (
        <g>
          <rect x="110" y="46" width="8" height="86" />
          <rect x="210" y="46" width="8" height="86" />
          <rect x="24" y="112" width="272" height="5" />
          <path d="M114 52 Q164 100 214 52" fill="none" stroke={TINTE} strokeWidth="2.4" />
          <path d="M24 108 L114 52 M214 52 L296 108" fill="none" stroke={TINTE} strokeWidth="2" />
          {haenger.map((x) => (
            <line key={x} x1={x} y1={y(x)} x2={x} y2="112" stroke={TINTE} strokeWidth="1" />
          ))}
          <rect x="106" y="130" width="16" height="8" />
          <rect x="206" y="130" width="16" height="8" />
        </g>
      );
    }
    case "turm":
      return (
        <g>
          <polygon points="160,24 188,132 132,132" />
          {[52, 76, 100, 120].map((y) => (
            <line key={y} x1={160 - (y - 24) * 0.26} y1={y} x2={160 + (y - 24) * 0.26} y2={y} stroke="#efe4cb" strokeWidth="1.2" />
          ))}
          <path d="M108 62 L212 62 M116 84 L204 84" stroke={TINTE} strokeWidth="2" fill="none" />
          <path d="M52 132 L108 62 M268 132 L212 62" stroke={TINTE} strokeWidth="1" fill="none" />
        </g>
      );
    case "tor":
      return (
        <g>
          <path fillRule="evenodd" d="M62 132 V84 H258 V132 Z M130 132 V102 A30 30 0 0 1 190 102 V132 Z" />
          <rect x="62" y="56" width="42" height="76" />
          <rect x="216" y="56" width="42" height="76" />
          {Array.from({ length: 5 }, (_, i) => (
            <rect key={i} x={62 + i * 9} y="50" width="6" height="6" />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <rect key={i} x={216 + i * 9} y="50" width="6" height="6" />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={106 + i * 9} y="78" width="5" height="6" />
          ))}
        </g>
      );
    case "fels":
      return (
        <g>
          <path d="M40 132 Q80 108 120 132 Z" />
          <path d="M100 132 L122 62 L144 132 Z" />
          <path d="M112 66 h20 l-10 -16 z" />
          <path d="M150 132 L170 82 L190 132 Z" />
          <path d="M162 86 h16 l-8 -14 z" />
          <path d="M196 132 L218 56 L240 132 Z" />
          <path d="M207 60 h22 l-11 -18 z" />
          <path d="M228 132 Q262 112 292 132 Z" />
        </g>
      );
    case "damm":
      return (
        <g>
          <polygon points="60,132 262,132 250,68 72,68" />
          <rect x="120" y="52" width="80" height="16" />
          <rect x="146" y="42" width="28" height="10" />
          {[96, 124, 152, 180, 208, 236].map((x) => (
            <line key={x} x1={x} y1="72" x2={x - 2} y2="130" stroke="#efe4cb" strokeWidth="1.2" strokeDasharray="4 4" />
          ))}
          <path d="M0 96 Q20 90 40 96 T72 96 V132 H0 Z" fill="#4c7c86" />
          <path d="M262 132 Q290 118 320 132 Z" />
        </g>
      );
    case "bahn":
      return (
        <g>
          <rect x="16" y="104" width="288" height="6" />
          {Array.from({ length: 7 }, (_, i) => (
            <path key={i} d={`M${28 + i * 40} 132 V122 A14 14 0 0 1 ${56 + i * 40} 122 V132`} fill="none" stroke={TINTE} strokeWidth="6" />
          ))}
          <rect x="18" y="130" width="284" height="8" />
          <path d="M84 100 H214 Q232 100 238 90 L246 90 Q248 100 226 104 H84 Z" />
          <rect x="84" y="82" width="140" height="18" rx="4" />
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={92 + i * 15} y="86" width="9" height="6" fill="#efe4cb" />
          ))}
          <path d="M224 82 Q238 82 246 92 L224 100 Z" />
        </g>
      );
    case "flughafen":
      return (
        <g>
          <path d="M40 132 V112 Q160 74 280 112 V132 Z" />
          <rect x="250" y="62" width="10" height="70" />
          <rect x="244" y="52" width="22" height="12" />
          <path d="M244 52 L255 44 L266 52" />
          <rect x="90" y="46" width="100" height="7" rx="3" />
          <polygon points="128,46 146,22 154,22 144,46" />
          <polygon points="128,53 146,77 154,77 144,53" />
          <polygon points="94,46 88,34 96,34 104,46" />
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={60 + i * 26} y="116" width="16" height="8" fill="#efe4cb" />
          ))}
        </g>
      );
    case "schiff":
      return (
        <g>
          <path d="M40 116 L282 116 L260 136 L64 136 Z" />
          <rect x="122" y="90" width="80" height="26" />
          <rect x="140" y="76" width="44" height="14" />
          <line x1="162" y1="46" x2="162" y2="76" stroke={TINTE} strokeWidth="2.4" />
          <rect x="208" y="108" width="62" height="8" />
          <rect x="88" y="100" width="20" height="16" />
          <path d="M20 140 Q40 134 60 140 T100 140 T140 140 T180 140 T220 140 T260 140 T300 140" fill="none" stroke="#efe4cb" strokeWidth="1.4" opacity="0.7" />
        </g>
      );
    case "kirche":
      return (
        <g>
          <rect x="92" y="88" width="136" height="44" />
          <polygon points="84,88 160,58 236,88" />
          <path d="M228 132 V104 A22 22 0 0 1 250 104 V132 Z" transform="translate(-6,0)" />
          <rect x="56" y="60" width="26" height="72" />
          <polygon points="52,60 69,30 86,60" />
          <line x1="69" y1="30" x2="69" y2="18" stroke={TINTE} strokeWidth="2" />
          <line x1="64" y1="23" x2="74" y2="23" stroke={TINTE} strokeWidth="2" />
          <line x1="160" y1="58" x2="160" y2="44" stroke={TINTE} strokeWidth="2.4" />
          <line x1="154" y1="50" x2="166" y2="50" stroke={TINTE} strokeWidth="2.4" />
          {[110, 136, 162, 188].map((x) => (
            <path key={x} d={`M${x} 124 V108 A6 6 0 0 1 ${x + 12} 108 V124 Z`} fill="#efe4cb" />
          ))}
          <path d="M64 124 V110 A5 5 0 0 1 74 110 V124 Z" fill="#efe4cb" />
        </g>
      );
    case "reaktor":
      return (
        <g>
          <path d="M112 132 Q130 84 124 40 L196 40 Q190 84 208 132 Z" />
          <path d="M36 132 V110 A26 26 0 0 1 88 110 V132 Z" />
          <rect x="232" y="46" width="9" height="86" />
          <rect x="248" y="72" width="7" height="60" />
          <circle cx="150" cy="30" r="12" fill="#efe4cb" opacity="0.65" />
          <circle cx="172" cy="22" r="9" fill="#efe4cb" opacity="0.5" />
          <circle cx="194" cy="14" r="6" fill="#efe4cb" opacity="0.4" />
        </g>
      );
    case "stadt":
      return (
        <g>
          <path d="M20 132 Q90 100 160 108 T300 118 V132 Z" opacity="0.9" />
          {(
            [
              [40, 100, 26, 32],
              [74, 92, 30, 40],
              [110, 98, 28, 34],
              [188, 96, 30, 36],
              [224, 90, 28, 42],
              [258, 102, 26, 30],
            ] as [number, number, number, number][]
          ).map(([x, y, w, h], i) => (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} />
              <polygon points={`${x - 3},${y} ${x + w / 2},${y - 12} ${x + w + 3},${y}`} />
            </g>
          ))}
          <rect x="150" y="54" width="8" height="78" />
          <polygon points="146,54 154,32 162,54" />
          <path d="M138 132 V112 A16 16 0 0 1 170 112 V132 Z" />
          <line x1="154" y1="32" x2="154" y2="22" stroke={TINTE} strokeWidth="2" />
        </g>
      );
    case "kanal":
      return (
        <g>
          <polygon points="0,140 0,90 118,118 138,140" />
          <polygon points="320,140 320,90 202,118 182,140" />
          <polygon points="138,140 118,118 202,118 182,140" fill="#4c7c86" />
          <path d="M148 128 L172 128 L166 134 L154 134 Z" fill={TINTE} />
          <rect x="156" y="120" width="8" height="8" fill={TINTE} />
          <path d="M0 90 Q60 70 118 118 M320 90 Q260 70 202 118" fill="none" stroke={TINTE} strokeWidth="1.6" />
          <rect x="20" y="78" width="16" height="16" />
          <rect x="284" y="78" width="16" height="16" />
        </g>
      );
    case "gericht":
      return (
        <g>
          <rect x="66" y="132" width="188" height="6" />
          <rect x="72" y="126" width="176" height="6" />
          {saeulen(92, 6, 28, 76, 122)}
          <rect x="80" y="70" width="160" height="6" />
          <polygon points="76,70 160,40 244,70" />
          <line x1="160" y1="18" x2="160" y2="40" stroke={TINTE} strokeWidth="2" />
          <line x1="138" y1="24" x2="182" y2="24" stroke={TINTE} strokeWidth="2" />
          <path d="M132 24 L138 34 H126 Z M188 24 L194 34 H182 Z" />
        </g>
      );
    case "jet":
      return (
        <g transform="translate(0,-6)">
          <polygon points="160,26 170,74 232,116 174,106 168,136 152,136 146,106 88,116 150,74" />
          <polygon points="160,32 164,60 156,60" fill="#efe4cb" opacity="0.7" />
          <path d="M150 138 Q160 170 160 178 M170 138 Q160 170 160 178" fill="none" stroke="#efe4cb" strokeWidth="1.4" opacity="0.7" />
        </g>
      );
    case "kuppelschirm":
      return (
        <g>
          <path d="M120 132 V112 A40 40 0 0 1 200 112 V132 Z" />
          <rect x="128" y="132" width="64" height="6" />
          {[100, 78, 56].map((r, i) => (
            <path key={r} d={`M${160 - r} 112 A${r} ${r} 0 0 1 ${160 + r} 112`} fill="none" stroke={GOLD} strokeWidth="1.6" strokeDasharray={i === 0 ? "0" : "5 5"} opacity={0.9 - i * 0.2} />
          ))}
          <path d="M220 132 L240 96 L252 100 L236 132 Z" />
          <path d="M84 132 L68 96 L80 92 L96 132 Z" />
        </g>
      );
  }
}

/** Baugerüst: Stangen, Riegel und Kreuzstreben über die ganze Breite des Bildes. */
const GERUEST = (() => {
  const xs = Array.from({ length: 9 }, (_, i) => 30 + i * 32);
  let d = "";
  for (const x of xs) d += `M${x} 138V20`;
  for (let k = 0; k <= 7; k++) d += `M30 ${138 - k * 16}H286`;
  for (let i = 0; i < 8; i++) {
    for (let k = 0; k < 7; k++) {
      const y0 = 138 - k * 16;
      const y1 = y0 - 16;
      d += (i + k) % 2 === 0 ? `M${xs[i]} ${y0}L${xs[i + 1]} ${y1}` : `M${xs[i + 1]} ${y0}L${xs[i]} ${y1}`;
    }
  }
  return d;
})();

function Kran() {
  return (
    <g className="wunder-a-kran">
      <path d="M296 138V38M301 138V38" stroke={TINTE} strokeWidth="1.4" fill="none" />
      <path d={Array.from({ length: 12 }, (_, i) => `M296 ${138 - i * 8.4}L301 ${138 - (i + 1) * 8.4}M301 ${138 - i * 8.4}L296 ${138 - (i + 1) * 8.4}`).join("")} stroke={TINTE} strokeWidth="0.7" fill="none" />
      <g className="wunder-a-ausleger">
        <path d="M206 38H316L298.5 28Z" fill={TINTE} stroke={GOLD} strokeWidth="0.6" strokeOpacity="0.7" />
        <rect x="304" y="38" width="12" height="9" fill={TINTE} />
        <g className="wunder-a-haken">
          <line x1="220" y1="38" x2="220" y2="66" stroke={TINTE} strokeWidth="0.9" />
          <path d="M217 66h6l-1.5 5h-3z" fill={GOLD} />
        </g>
      </g>
    </g>
  );
}

const STERNE = Array.from({ length: 22 }, (_, i) => ({ x: (i * 53 + 17) % 310, y: 6 + ((i * 29) % 70), r: 0.5 + (i % 3) * 0.35 }));
const VOEGEL = [
  { y: 34, delay: 3.6, dauer: 15 },
  { y: 48, delay: 5.4, dauer: 18 },
  { y: 26, delay: 8.2, dauer: 17 },
];

export function WunderBild({
  art,
  animiert = false,
  klasse = "",
  zustand = "fertig",
  fortschritt = 0,
}: {
  art: Bild;
  animiert?: boolean;
  klasse?: string;
  zustand?: BildZustand;
  /** 0 bis 1: wie weit das Bauwerk im Zustand „bau“ gediehen ist */
  fortschritt?: number;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const bau = zustand === "bau";
  const entwurf = zustand === "entwurf";
  const baustelle = bau || (animiert && !entwurf);
  const f = Math.max(0.03, Math.min(1, fortschritt));
  // Die Bauhöhe: Oberkante der sichtbaren Fläche; das Gerüst läuft dem Stein ein Stück voraus
  const front = bau ? 140 - 128 * f : 0;
  const geruestFront = bau ? Math.max(6, front - 22) : 0;
  const beschreibung = entwurf ? "Bauplan des Bauwerks" : bau ? `Baustelle, ${Math.round(f * 100)} Prozent fertig` : "Gemalte Ansicht des Bauwerks";
  return (
    <svg
      className={`wunder-bild${animiert ? " animiert" : ""}${bau ? " bau" : ""}${entwurf ? " entwurf" : ""}${klasse ? ` ${klasse}` : ""}`}
      viewBox="0 0 320 180"
      role="img"
      aria-label={beschreibung}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`himmel${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3c5a78" />
          <stop offset="0.5" stopColor="#d9a25e" />
          <stop offset="1" stopColor="#f2d59a" />
        </linearGradient>
        <linearGradient id={`blau${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f3a55" />
          <stop offset="1" stopColor="#35597a" />
        </linearGradient>
        <radialGradient id={`sonne${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff2c8" stopOpacity="1" />
          <stop offset="0.45" stopColor="#ffe6a0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffe6a0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`strahl${id}`} cx="236" cy="82" r="240" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff0bd" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff0bd" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`boden${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b4630" />
          <stop offset="1" stopColor="#2a1d14" />
        </linearGradient>
        <linearGradient id={`glanz${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff3cc" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff3cc" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff3cc" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`vignette${id}`} cx="0.5" cy="0.55" r="0.75">
          <stop offset="0.55" stopColor="#0c0703" stopOpacity="0" />
          <stop offset="1" stopColor="#0c0703" stopOpacity="0.5" />
        </radialGradient>
        <pattern id={`gitter${id}`} width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke="#bcd3e6" strokeWidth="0.35" strokeOpacity="0.28" />
        </pattern>
        <clipPath id={`bau${id}`}>
          <rect className="wunder-a-hoch" x="0" y="0" width="320" height="180" style={bau ? { transform: `translateY(${front}px)` } : undefined} />
        </clipPath>
        <clipPath id={`geruest${id}`}>
          <rect className="wunder-a-hoch-geruest" x="0" y="0" width="320" height="180" style={bau ? { transform: `translateY(${geruestFront}px)` } : undefined} />
        </clipPath>
        <mask id={`maske${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="320" height="180">
          <g fill="#fff">{motiv(art)}</g>
        </mask>
      </defs>

      <g className="wunder-a-kamera">
        <rect width="320" height="180" fill={`url(#${entwurf ? "blau" : "himmel"}${id})`} />
        {entwurf && <rect width="320" height="180" fill={`url(#gitter${id})`} />}
        {!entwurf && (
          <g className="wunder-a-sonne">
            <circle cx="236" cy="82" r="46" fill={`url(#sonne${id})`} />
            <circle cx="236" cy="82" r="13" fill="#fff4d2" />
          </g>
        )}
        {!entwurf && !bau && (
          <g className="wunder-a-strahlen" fill={`url(#strahl${id})`}>
            {Array.from({ length: 9 }, (_, i) => {
              const a = (i / 9) * Math.PI * 2;
              const w = 0.07;
              const p = (ang: number) => `${(236 + Math.cos(ang) * 320).toFixed(1)},${(82 + Math.sin(ang) * 320).toFixed(1)}`;
              return <polygon key={i} points={`236,82 ${p(a - w)} ${p(a + w)}`} />;
            })}
          </g>
        )}
        <path d="M0 122 Q40 96 84 116 T170 108 T260 118 T320 104 V180 H0 Z" fill={entwurf ? "#2b4a68" : "#7d6247"} opacity={entwurf ? 0.6 : 0.7} />
        <path d="M0 132 Q60 112 120 128 T240 124 T320 130 V180 H0 Z" fill={entwurf ? "#20394f" : "#4a3826"} opacity="0.9" />
        <rect y="136" width="320" height="44" fill={entwurf ? "#1a3046" : `url(#boden${id})`} />
        <g clipPath={`url(#bau${id})`}>
          <g fill={TINTE} stroke={GOLD} strokeWidth="0.8" strokeOpacity="0.55" className="wunder-a-motiv">
            {motiv(art)}
          </g>
        </g>
        {baustelle && (
          <g clipPath={`url(#geruest${id})`}>
            <path className="wunder-a-geruest" d={GERUEST} fill="none" stroke="#e4c07a" strokeWidth="0.9" strokeLinecap="square" />
          </g>
        )}
        {baustelle && <Kran />}
        {!entwurf && !bau && (
          <g mask={`url(#maske${id})`}>
            <rect className="wunder-a-glanz" x="-70" y="0" width="56" height="180" fill={`url(#glanz${id})`} />
          </g>
        )}
        {animiert && !entwurf && (
          <>
            <g className="wunder-a-funken" fill={GOLD}>
              {Array.from({ length: 24 }, (_, i) => (
                <circle
                  key={i}
                  cx={26 + ((i * 47) % 270)}
                  cy={148 - ((i * 23) % 70)}
                  r={0.9 + (i % 3) * 0.45}
                  style={{ animationDelay: `${3.2 + (i % 8) * 0.3}s`, animationDuration: `${3 + (i % 5) * 0.5}s`, ["--dx" as string]: `${((i % 7) - 3) * 5}px` }}
                />
              ))}
            </g>
            <g className="wunder-a-voegel" fill="none" stroke={TINTE} strokeWidth="0.9" strokeLinecap="round">
              {VOEGEL.map((v, i) => (
                <path key={i} d="M0 0q3-3.4 6 0q3-3.4 6 0" style={{ transform: `translateY(${v.y}px)`, animationDelay: `${v.delay}s`, animationDuration: `${v.dauer}s` }} />
              ))}
            </g>
          </>
        )}
      </g>
      {animiert && !entwurf && <rect className="wunder-a-nacht" width="320" height="180" fill="#0b1524" />}
      {animiert && !entwurf && (
        <g className="wunder-a-sterne" fill="#fff6dc">
          {STERNE.map((st, i) => (
            <circle key={i} cx={st.x} cy={st.y} r={st.r} />
          ))}
        </g>
      )}
      <rect width="320" height="180" fill={`url(#vignette${id})`} pointerEvents="none" />
    </svg>
  );
}
