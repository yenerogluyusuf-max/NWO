// Gemalte Wahrzeichen als Silhouetten im Stil des Spiels: warmer Himmel, Sonne, ferne Hügel, ein dunkles Motiv mit goldenem Saum.
// Drei Zustände: „fertig“ (gemalt), „bau“ (Gerüst und Kran, das Bauwerk wächst mit dem Fortschritt) und „entwurf“ (Bauplan, mit heller Tusche auf dunklem Leder; früher blau, ENTSCHEIDUNGEN T).
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
    // ---------------------------------------------------------------------------
    // Nacht N6 (Befund F-26): eigene Motive statt 19 geteilter (der Panzer Altay war ein Turm, der Drohnenverbund ein Kampfjet,
    // die Ordnung im Nahen Osten eine Moschee). Dieselbe Bildsprache: dunkle Silhouette mit goldenem Saum vor Abendhimmel.
    case "panzer":
      return (
        <g>
          <path d="M56 132 L70 116 H248 L264 132 Z" />
          <path d="M74 116 L84 104 H232 L244 116 Z" />
          <path d="M118 104 Q120 86 148 84 H190 Q206 86 208 104 Z" />
          <rect x="204" y="91" width="86" height="5" rx="1.5" />
          <rect x="286" y="89" width="8" height="9" rx="1" />
          <rect x="150" y="76" width="18" height="9" rx="2" />
          <line x1="176" y1="84" x2="182" y2="62" stroke={TINTE} strokeWidth="1.6" />
          {Array.from({ length: 7 }, (_, i) => (
            <circle key={i} cx={86 + i * 26} cy="125" r="6" fill="#efe4cb" opacity="0.55" />
          ))}
          <path d="M60 132 H260" stroke="#efe4cb" strokeWidth="1" opacity="0.5" />
        </g>
      );
    case "drohne":
      return (
        <g>
          <ellipse cx="160" cy="62" rx="54" ry="7" />
          <path d="M150 62 L142 24 H156 L162 62 Z" />
          <path d="M150 62 L142 100 H156 L162 62 Z" />
          <path d="M204 62 L220 50 L224 52 L212 62 L224 72 L220 74 Z" />
          <circle cx="226" cy="62" r="3" />
          <path d="M108 62 Q104 62 102 60" stroke={TINTE} strokeWidth="2" fill="none" />
          <path d="M160 70 L160 74" stroke={TINTE} strokeWidth="3" />
          <rect x="250" y="112" width="30" height="20" />
          <path d="M264 112 V96 M256 96 Q264 84 272 96" stroke={TINTE} strokeWidth="2" fill="none" />
          <path d="M168 74 Q220 92 262 96" stroke={GOLD} strokeWidth="1" strokeDasharray="3 4" fill="none" opacity="0.8" />
        </g>
      );
    case "rakete":
      return (
        <g>
          <rect x="150" y="44" width="20" height="82" rx="3" />
          <path d="M150 46 Q160 14 170 46 Z" />
          <path d="M150 110 L136 128 H150 Z M170 110 L184 128 H170 Z" />
          <rect x="112" y="30" width="10" height="102" />
          <path d={Array.from({ length: 8 }, (_, i) => `M112 ${132 - i * 12}L122 ${120 - i * 12}M122 ${132 - i * 12}L112 ${120 - i * 12}`).join("")} stroke="#efe4cb" strokeWidth="0.7" opacity="0.6" />
          <path d="M122 56 H150 M122 88 H150" stroke={TINTE} strokeWidth="2.4" />
          <circle cx="146" cy="134" r="10" fill="#efe4cb" opacity="0.55" />
          <circle cx="174" cy="134" r="12" fill="#efe4cb" opacity="0.5" />
          <circle cx="160" cy="138" r="9" fill="#efe4cb" opacity="0.65" />
          <rect x="148" y="132" width="24" height="6" />
        </g>
      );
    case "satellit":
      return (
        <g>
          <path d="M40 120 Q160 30 290 98" stroke={GOLD} strokeWidth="1" strokeDasharray="4 5" fill="none" opacity="0.8" />
          <rect x="146" y="54" width="28" height="28" rx="2" />
          <rect x="88" y="60" width="52" height="16" />
          <rect x="180" y="60" width="52" height="16" />
          <path d="M101 60 V76 M114 60 V76 M127 60 V76 M193 60 V76 M206 60 V76 M219 60 V76" stroke="#efe4cb" strokeWidth="0.8" opacity="0.7" />
          <path d="M140 68 H146 M174 68 H180" stroke={TINTE} strokeWidth="2" />
          <path d="M150 82 Q160 98 170 82" fill="none" stroke={TINTE} strokeWidth="2.4" />
          <line x1="160" y1="92" x2="160" y2="100" stroke={TINTE} strokeWidth="1.4" />
          <path d="M240 132 L250 112 L260 132 Z" />
          <path d="M236 112 Q250 92 266 106 Z" />
        </g>
      );
    case "rechenzentrum":
      return (
        <g>
          <rect x="44" y="94" width="232" height="38" />
          <rect x="70" y="76" width="70" height="18" />
          <rect x="176" y="80" width="80" height="14" />
          {Array.from({ length: 3 }, (_, r) => Array.from({ length: 14 }, (_, i) => (
            <rect key={`${r}-${i}`} x={54 + i * 16} y={100 + r * 10} width="10" height="5" fill="#efe4cb" opacity={((i + r) % 3 === 0) ? 0.85 : 0.45} />
          )))}
          {[84, 110, 190, 220].map((x) => (
            <g key={x}>
              <circle cx={x} cy={x < 150 ? 70 : 74} r="7" />
              <path d={`M${x - 5} ${x < 150 ? 70 : 74} H${x + 5} M${x} ${(x < 150 ? 70 : 74) - 5} V${(x < 150 ? 70 : 74) + 5}`} stroke="#efe4cb" strokeWidth="0.8" />
            </g>
          ))}
          <path d="M276 116 H300 V60" stroke={TINTE} strokeWidth="2" fill="none" />
          <circle cx="300" cy="56" r="4" fill={GOLD} opacity="0.9" />
        </g>
      );
    case "chip":
      return (
        <g>
          <path d="M40 132 V96 L70 80 V96 L100 80 V96 L130 80 V96 L160 80 V132 Z" />
          <rect x="160" y="70" width="120" height="62" />
          <rect x="196" y="82" width="48" height="40" rx="3" fill="#efe4cb" opacity="0.9" />
          <rect x="206" y="92" width="28" height="20" rx="2" />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${202 + i * 11} 82 V76 M${202 + i * 11} 122 V128 M196 ${88 + i * 9} H190 M244 ${88 + i * 9} H250`} stroke="#efe4cb" strokeWidth="1.6" />
          ))}
          <rect x="262" y="40" width="10" height="30" />
          <circle cx="267" cy="34" r="6" fill="#efe4cb" opacity="0.45" />
        </g>
      );
    case "klinik":
      return (
        <g>
          <rect x="60" y="92" width="200" height="40" />
          <rect x="110" y="62" width="100" height="30" />
          <rect x="146" y="30" width="28" height="28" rx="3" />
          <path d="M160 35 V53 M151 44 H169" stroke="#efe4cb" strokeWidth="5" />
          {Array.from({ length: 2 }, (_, r) => Array.from({ length: 10 }, (_, i) => (
            <rect key={`${r}-${i}`} x={68 + i * 19} y={98 + r * 14} width="10" height="7" fill="#efe4cb" opacity="0.7" />
          )))}
          {Array.from({ length: 5 }, (_, i) => <rect key={i} x={118 + i * 19} y="68" width="10" height="8" fill="#efe4cb" opacity="0.7" />)}
          <path d="M146 132 V116 H174 V132" fill="#efe4cb" opacity="0.5" />
          <path d="M24 132 V118 H52 L58 126 V132 Z" />
          <circle cx="32" cy="132" r="3" fill="#efe4cb" /><circle cx="50" cy="132" r="3" fill="#efe4cb" />
        </g>
      );
    case "schule":
      return (
        <g>
          <rect x="70" y="92" width="180" height="40" />
          <polygon points="64,92 160,62 256,92" />
          <rect x="146" y="34" width="28" height="40" />
          <polygon points="142,34 160,18 178,34" />
          <circle cx="160" cy="50" r="7" fill="#efe4cb" opacity="0.85" />
          <path d="M160 45 V50 H164" stroke={TINTE} strokeWidth="1.2" fill="none" />
          {Array.from({ length: 8 }, (_, i) => (i === 3 || i === 4 ? null : <path key={i} d={`M${82 + i * 20} 124 V106 A5 5 0 0 1 ${92 + i * 20} 106 V124 Z`} fill="#efe4cb" opacity="0.75" />))}
          <path d="M148 132 V110 A12 12 0 0 1 172 110 V132 Z" fill="#efe4cb" opacity="0.5" />
          <line x1="276" y1="132" x2="276" y2="54" stroke={TINTE} strokeWidth="2" />
          <path d="M277 55 Q290 50 302 56 V70 Q290 64 277 69 Z" />
        </g>
      );
    case "mast":
      return (
        <g>
          {[{ x: 92, h: 104, b: 26 }, { x: 236, h: 70, b: 16 }].map(({ x, h, b }) => (
            <g key={x}>
              <path d={`M${x - b} 132 L${x - 3} ${132 - h} H${x + 3} L${x + b} 132 Z`} fill="none" stroke={TINTE} strokeWidth="3" />
              <path d={Array.from({ length: 5 }, (_, i) => { const y0 = 132 - (i * h) / 5, y1 = 132 - ((i + 1) * h) / 5, w0 = b - (i * (b - 3)) / 5, w1 = b - ((i + 1) * (b - 3)) / 5; return `M${x - w0} ${y0}L${x + w1} ${y1}M${x + w0} ${y0}L${x - w1} ${y1}`; }).join("")} stroke={TINTE} strokeWidth="1.2" fill="none" />
              <path d={`M${x - b * 1.4} ${132 - h * 0.78} H${x + b * 1.4} M${x - b} ${132 - h * 0.56} H${x + b}`} stroke={TINTE} strokeWidth="2.4" />
            </g>
          ))}
          <path d="M56 51 Q164 78 214 77 M20 74 Q60 70 56 51 M128 51 Q190 74 258 77 M128 51 Q140 40 320 80" stroke={TINTE} strokeWidth="1" fill="none" />
          <path d="M66 74 Q164 100 222 93 M118 74 Q190 96 250 93" stroke={TINTE} strokeWidth="1" fill="none" />
        </g>
      );
    case "hafen":
      return (
        <g>
          <rect x="0" y="122" width="320" height="18" fill="#4c7c86" />
          <rect x="0" y="116" width="170" height="8" />
          <path d="M70 116 V44 H80 V116 M110 116 V44 H120 V116" stroke={TINTE} strokeWidth="6" fill="none" />
          <rect x="60" y="40" width="190" height="8" />
          <path d="M70 48 L110 44 M80 44 L120 48" stroke={TINTE} strokeWidth="1.4" />
          <rect x="196" y="48" width="14" height="10" />
          <line x1="203" y1="58" x2="203" y2="84" stroke={TINTE} strokeWidth="1" />
          <rect x="196" y="84" width="14" height="8" fill={GOLD} opacity="0.85" />
          <path d="M178 122 L184 132 H300 L312 110 H178 Z" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={186 + i * 22} y={i % 2 ? 94 : 100} width="20" height={i % 2 ? 16 : 10} />
          ))}
          {[0, 1, 2].map((i) => <rect key={i} x={16 + i * 16} y={100 - (i % 2) * 8} width="14" height={16 + (i % 2) * 8} />)}
          <path d="M186 104 H296" stroke="#efe4cb" strokeWidth="0.8" opacity="0.6" />
        </g>
      );
    case "konferenz":
      return (
        <g>
          <path d="M70 132 V86 Q160 62 250 86 V132 Z" />
          <path d="M84 132 V96 Q160 76 236 96 V132" fill="none" stroke="#efe4cb" strokeWidth="0.8" opacity="0.5" />
          {Array.from({ length: 9 }, (_, i) => <rect key={i} x={92 + i * 16} y="98" width="9" height="26" fill="#efe4cb" opacity="0.55" />)}
          <rect x="60" y="132" width="200" height="4" />
          {Array.from({ length: 7 }, (_, i) => {
            const x = 40 + i * 40;
            return (
              <g key={i}>
                <line x1={x} y1="138" x2={x} y2="42" stroke={TINTE} strokeWidth="2" />
                <path d={`M${x + 1} 43 Q${x + 9} 39 ${x + 18} 44 Q${x + 9} ${i % 2 ? 50 : 48} ${x + 1} 54 Z`} />
              </g>
            );
          })}
        </g>
      );
    case "wind":
      return (
        <g>
          <rect x="0" y="122" width="320" height="18" fill="#4c7c86" />
          {[{ x: 92, h: 92, r: 38 }, { x: 196, h: 66, r: 27 }, { x: 268, h: 46, r: 19 }].map(({ x, h, r }, i) => {
            const top = 124 - h;
            const a = 20 + i * 37;
            const bl = (k: number) => {
              const w = ((a + k * 120) * Math.PI) / 180;
              return `M${x} ${top} L${(x + Math.cos(w) * r).toFixed(1)} ${(top + Math.sin(w) * r).toFixed(1)}`;
            };
            return (
              <g key={x}>
                <path d={`M${x - 2.5} 124 L${x - 1.2} ${top} H${x + 1.2} L${x + 2.5} 124 Z`} />
                <path d={`${bl(0)}${bl(1)}${bl(2)}`} stroke={TINTE} strokeWidth={i === 0 ? 3.2 : 2.4} strokeLinecap="round" />
                <circle cx={x} cy={top} r={i === 0 ? 4 : 3} />
              </g>
            );
          })}
          <path d="M0 128 Q20 124 40 128 T80 128 T120 128 T160 128 T200 128 T240 128 T280 128 T320 128" fill="none" stroke="#efe4cb" strokeWidth="1" opacity="0.6" />
        </g>
      );
    case "labor":
      return (
        <g>
          <rect x="40" y="104" width="150" height="28" />
          {Array.from({ length: 7 }, (_, i) => <rect key={i} x={48 + i * 20} y="110" width="12" height="8" fill="#efe4cb" opacity="0.7" />)}
          <path d="M92 104 V56 H104 V104 Z" />
          <path d="M84 56 H112" stroke={TINTE} strokeWidth="3" />
          <path d="M120 104 L132 72 V52 H144 V72 L156 104 Z" />
          <path d="M126 96 L150 96 L154 104 H122 Z" fill={GOLD} opacity="0.85" />
          <circle cx="138" cy="44" r="3" fill="#efe4cb" opacity="0.6" /><circle cx="143" cy="34" r="2.2" fill="#efe4cb" opacity="0.5" />
          {Array.from({ length: 12 }, (_, i) => {
            const y = 26 + i * 9;
            const dx = Math.sin(i * 0.8) * 18;
            return (
              <g key={i}>
                <line x1={240 - dx} y1={y} x2={240 + dx} y2={y} stroke={GOLD} strokeWidth="1.4" opacity="0.8" />
                <circle cx={240 + dx} cy={y} r="3" />
                <circle cx={240 - dx} cy={y} r="3" />
              </g>
            );
          })}
        </g>
      );
    case "uboot":
      return (
        <g>
          <path d="M36 112 Q36 100 70 100 H246 Q290 100 296 112 Q290 124 246 124 H70 Q36 124 36 112 Z" />
          <path d="M140 100 L146 78 H186 L192 100 Z" />
          <path d="M160 78 V58 M170 78 V64 M160 58 H166" stroke={TINTE} strokeWidth="2" fill="none" />
          <path d="M296 112 L310 100 V124 Z" />
          <rect x="0" y="114" width="320" height="26" fill="#4c7c86" opacity="0.92" />
          <path d="M0 116 Q20 112 40 116 T80 116 T120 116 T160 116 T200 116 T240 116 T280 116 T320 116" fill="none" stroke="#efe4cb" strokeWidth="1.2" opacity="0.7" />
        </g>
      );
    case "wohnblock":
      return (
        <g>
          {([[44, 66, 40, 66], [92, 44, 44, 88], [144, 78, 38, 54], [190, 52, 46, 80], [244, 84, 36, 48]] as [number, number, number, number][]).map(([x, y, w, h], i) => (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} />
              {Array.from({ length: Math.floor((h - 10) / 11) }, (_, r) => Array.from({ length: Math.floor(w / 11) }, (_, c) => (
                <rect key={`${r}-${c}`} x={x + 4 + c * 11} y={y + 6 + r * 11} width="6" height="5" fill="#efe4cb" opacity={(r + c + i) % 4 === 0 ? 0.85 : 0.4} />
              )))}
            </g>
          ))}
          <path d="M282 132 V30 M287 132 V30" stroke={TINTE} strokeWidth="1.4" />
          <path d="M240 30 H306 L286 22 Z" />
          <line x1="254" y1="30" x2="254" y2="52" stroke={TINTE} strokeWidth="0.9" />
        </g>
      );
    case "strasse":
      return (
        <g>
          <path d="M96 138 L152 92 H168 L224 138 Z" />
          <path d="M160 136 V128 M160 120 V114 M160 108 V104 M160 100 V97" stroke={GOLD} strokeWidth="2" opacity="0.9" />
          <path d="M20 104 H300" stroke={TINTE} strokeWidth="5" />
          {[50, 110, 210, 270].map((x) => <rect key={x} x={x - 4} y="104" width="8" height="34" />)}
          <path d="M126 70 H194 V82 H126 Z" />
          <path d="M132 70 V104 M188 70 V104" stroke={TINTE} strokeWidth="3" />
          <path d="M138 76 H156 M164 76 H182" stroke="#efe4cb" strokeWidth="2" opacity="0.8" />
          <path d="M20 100 H300" stroke="#efe4cb" strokeWidth="0.8" opacity="0.5" />
        </g>
      );
    case "museum":
      return (
        <g>
          <path d="M120 132 V84 L228 70 V132 Z" />
          <path d="M132 128 V90 L216 79 V128 Z" fill="#efe4cb" opacity="0.4" />
          {[150, 168, 186, 204].map((x) => <line key={x} x1={x} y1="128" x2={x} y2={88 - (x - 132) * 0.13} stroke={TINTE} strokeWidth="1.4" />)}
          {[{ x: 50, h: 54 }, { x: 72, h: 38 }, { x: 94, h: 62 }].map(({ x, h }) => (
            <g key={x}>
              <rect x={x} y={132 - h} width="11" height={h} />
              <path d={`M${x - 2} ${132 - h} L${x + 13} ${132 - h + 3}`} stroke={TINTE} strokeWidth="3" />
              <path d={`M${x + 3} ${130} V${136 - h} M${x + 8} ${130} V${136 - h}`} stroke="#efe4cb" strokeWidth="0.6" opacity="0.5" />
            </g>
          ))}
          <rect x="40" y="128" width="72" height="6" />
          <path d="M250 132 Q262 120 276 132" />
        </g>
      );
    case "feld":
      return (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M0 ${140 - i * 4} Q160 ${116 - i * 6} 320 ${136 - i * 3}`} fill="none" stroke={TINTE} strokeWidth="3" opacity={0.9 - i * 0.12} />
          ))}
          {[226, 252].map((x, i) => (
            <g key={x}>
              <rect x={x} y={i ? 70 : 60} width="22" height={i ? 58 : 68} />
              <path d={`M${x} ${i ? 70 : 60} Q${x + 11} ${i ? 56 : 46} ${x + 22} ${i ? 70 : 60} Z`} />
            </g>
          ))}
          <path d="M210 128 V84 H226" stroke={TINTE} strokeWidth="2" fill="none" />
          {Array.from({ length: 9 }, (_, i) => {
            const x = 40 + i * 18;
            const y = 112 - (i % 3) * 4;
            return (
              <g key={i}>
                <line x1={x} y1={y + 20} x2={x + 2} y2={y - 6} stroke={TINTE} strokeWidth="1.2" />
                <ellipse cx={x + 2} cy={y - 8} rx="2.6" ry="6" fill={GOLD} opacity="0.85" />
              </g>
            );
          })}
        </g>
      );
    case "mond":
      return (
        <g>
          <circle cx="110" cy="62" r="40" fill="#efe4cb" opacity="0.92" />
          <circle cx="96" cy="50" r="8" fill={TINTE} opacity="0.18" /><circle cx="124" cy="74" r="11" fill={TINTE} opacity="0.15" /><circle cx="118" cy="42" r="4" fill={TINTE} opacity="0.2" />
          <path d="M20 132 Q90 116 160 126 T320 122 V138 H20 Z" />
          <path d="M214 132 L222 112 H250 L258 132" fill="none" stroke={TINTE} strokeWidth="2.6" />
          <rect x="220" y="96" width="32" height="16" rx="3" />
          <path d="M228 96 L236 84 L244 96" />
          <path d="M236 84 V72 M232 72 H240" stroke={TINTE} strokeWidth="1.6" />
          <path d="M170 128 Q190 110 210 128 Z" />
        </g>
      );
    case "quanten":
      return (
        <g>
          <rect x="120" y="22" width="80" height="8" />
          {[{ y: 46, w: 70 }, { y: 70, w: 56 }, { y: 92, w: 42 }, { y: 110, w: 28 }].map(({ y, w }, i) => (
            <g key={y}>
              <rect x={160 - w / 2} y={y} width={w} height="6" rx="2" fill={i % 2 ? TINTE : GOLD} />
              {[-0.35, 0, 0.35].map((k) => <line key={k} x1={160 + k * w} y1={y - (i === 0 ? 16 : 18)} x2={160 + k * w * 0.8} y2={y} stroke={TINTE} strokeWidth="1.6" />)}
            </g>
          ))}
          <path d="M146 116 H174 L168 128 H152 Z" />
          <path d="M150 30 Q140 80 156 116 M170 30 Q182 80 164 116" stroke={GOLD} strokeWidth="0.9" fill="none" opacity="0.8" />
          <rect x="132" y="128" width="56" height="4" />
          <circle cx="160" cy="124" r="2" fill="#efe4cb" />
        </g>
      );
    case "netzwerk": {
      const lagen = [[46, 86, 126], [30, 62, 94, 126], [46, 86, 126], [66, 106]];
      const xs = [92, 148, 204, 254];
      const punkte = lagen.map((ys, i) => ys.map((y) => [xs[i]!, y - 14] as [number, number]));
      return (
        <g>
          {punkte.slice(0, -1).map((a, i) => a.map(([x1, y1]) => punkte[i + 1]!.map(([x2, y2]) => <line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={GOLD} strokeWidth="0.8" opacity="0.65" />)))}
          {punkte.flat().map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="6.5" />)}
          {punkte.flat().map(([x, y], i) => (i % 3 === 0 ? <circle key={`g${x}-${y}`} cx={x} cy={y} r="2.2" fill={GOLD} /> : null))}
          <rect x="40" y="122" width="240" height="10" />
          {Array.from({ length: 12 }, (_, i) => <rect key={i} x={46 + i * 19.5} y="124" width="11" height="4" fill="#efe4cb" opacity="0.6" />)}
        </g>
      );
    }
    case "fabrik":
      return (
        <g>
          <path d="M30 132 V92 L66 72 V92 L102 72 V92 L138 72 V92 L174 72 V92 L210 72 V132 Z" />
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${36 + i * 36} 90 L${62 + i * 36} 76`} stroke="#efe4cb" strokeWidth="2" opacity="0.6" />)}
          <rect x="222" y="40" width="12" height="92" />
          <rect x="246" y="58" width="10" height="74" />
          <rect x="210" y="104" width="80" height="28" />
          {Array.from({ length: 6 }, (_, i) => <rect key={i} x={40 + i * 28} y="104" width="16" height="10" fill="#efe4cb" opacity="0.6" />)}
          <circle cx="232" cy="30" r="9" fill="#efe4cb" opacity="0.45" />
          <circle cx="246" cy="20" r="7" fill="#efe4cb" opacity="0.35" />
          <circle cx="254" cy="48" r="6" fill="#efe4cb" opacity="0.35" />
        </g>
      );
    case "roboter":
      return (
        <g>
          <rect x="70" y="118" width="60" height="14" rx="2" />
          <rect x="88" y="104" width="24" height="16" />
          <path d="M100 104 L132 56" stroke={TINTE} strokeWidth="14" strokeLinecap="round" />
          <path d="M132 56 L196 70" stroke={TINTE} strokeWidth="11" strokeLinecap="round" />
          <circle cx="100" cy="104" r="10" /><circle cx="132" cy="56" r="9" />
          <circle cx="100" cy="104" r="4" fill="#efe4cb" opacity="0.7" /><circle cx="132" cy="56" r="3.5" fill="#efe4cb" opacity="0.7" />
          <path d="M196 70 L206 66 M196 70 L204 80 M206 66 L214 70 M204 80 L212 82" stroke={TINTE} strokeWidth="4" strokeLinecap="round" />
          <rect x="180" y="112" width="120" height="8" />
          {[194, 228, 262].map((x) => <rect key={x} x={x} y="98" width="22" height="14" />)}
          <circle cx="210" cy="76" r="3" fill={GOLD} />
          <path d="M184 120 V132 M296 120 V132" stroke={TINTE} strokeWidth="4" />
        </g>
      );
    case "leitung":
      return (
        <g>
          <path d="M0 104 H230" stroke={TINTE} strokeWidth="12" />
          <path d="M0 100 H230" stroke="#efe4cb" strokeWidth="1.2" opacity="0.5" />
          {[30, 82, 134, 186].map((x) => (
            <g key={x}>
              <path d={`M${x - 8} 132 L${x} 110 L${x + 8} 132`} fill="none" stroke={TINTE} strokeWidth="3" />
              <rect x={x - 10} y="96" width="20" height="16" rx="2" />
            </g>
          ))}
          <rect x="228" y="70" width="58" height="62" rx="4" />
          <ellipse cx="257" cy="70" rx="29" ry="7" />
          <path d="M236 84 H278 M236 100 H278 M236 116 H278" stroke="#efe4cb" strokeWidth="0.8" opacity="0.5" />
          <path d="M296 132 V52 H304 V132" />
          <path d="M290 96 Q298 112 306 96 Q298 80 290 96 Z" fill="#4c7c86" />
        </g>
      );
    case "bohrinsel":
      return (
        <g>
          <rect x="0" y="122" width="320" height="18" fill="#4c7c86" />
          {[104, 136, 184, 216].map((x) => <rect key={x} x={x - 3} y="96" width="6" height="40" />)}
          <path d="M100 112 L140 100 M140 112 L100 100 M180 112 L220 100 M220 112 L180 100" stroke={TINTE} strokeWidth="1.4" />
          <rect x="88" y="84" width="144" height="12" />
          <rect x="96" y="66" width="44" height="18" />
          <path d="M170 84 L182 26 H190 L202 84" fill="none" stroke={TINTE} strokeWidth="3" />
          <path d={Array.from({ length: 5 }, (_, i) => `M${172 + i * 2.4} ${84 - i * 11.6}L${200 - i * 2.4} ${72.4 - i * 11.6}`).join("")} stroke={TINTE} strokeWidth="1" fill="none" />
          <path d="M232 76 L276 52" stroke={TINTE} strokeWidth="3" />
          <path d="M276 52 q6 -10 2 -18 q8 6 4 18 Z" fill={GOLD} opacity="0.9" />
          <rect x="108" y="72" width="8" height="6" fill="#efe4cb" opacity="0.7" /><rect x="122" y="72" width="8" height="6" fill="#efe4cb" opacity="0.7" />
          <path d="M0 126 Q20 122 40 126 T80 126 T120 126 T160 126 T200 126 T240 126 T280 126 T320 126" fill="none" stroke="#efe4cb" strokeWidth="1" opacity="0.6" />
        </g>
      );
    case "triebwerk":
      return (
        <g>
          <circle cx="160" cy="82" r="52" />
          <circle cx="160" cy="82" r="42" fill="#efe4cb" opacity="0.25" />
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2;
            const b = a + 0.32;
            return <path key={i} d={`M${(160 + Math.cos(a) * 10).toFixed(1)} ${(82 + Math.sin(a) * 10).toFixed(1)} L${(160 + Math.cos(b) * 41).toFixed(1)} ${(82 + Math.sin(b) * 41).toFixed(1)}`} stroke={TINTE} strokeWidth="5" strokeLinecap="round" />;
          })}
          <circle cx="160" cy="82" r="11" />
          <path d="M156 78 Q160 74 164 78 Q160 86 156 78 Z" fill={GOLD} />
          <path d="M108 82 A52 52 0 0 1 212 82" fill="none" stroke={GOLD} strokeWidth="1.2" opacity="0.8" />
          <path d="M140 134 L150 132 V124 H170 V132 L180 134 Z" />
        </g>
      );
    case "tunnel":
      return (
        <g>
          <path d="M0 132 V92 Q60 50 130 62 Q200 40 260 70 Q300 82 320 78 V132 Z" />
          <path d="M120 132 V104 A40 40 0 0 1 200 104 V132 Z" fill="#1a120c" />
          <path d="M112 132 V104 A48 48 0 0 1 208 104 V132" fill="none" stroke="#efe4cb" strokeWidth="3" opacity="0.55" />
          <path d="M140 132 L152 112 H168 L180 132 Z" fill={GOLD} opacity="0.35" />
          <path d="M160 132 V126 M160 120 V116" stroke={GOLD} strokeWidth="1.6" />
          {[134, 186].map((x) => <circle key={x} cx={x} cy="96" r="2.4" fill={GOLD} />)}
        </g>
      );
    case "bank":
      return (
        <g>
          <rect x="66" y="78" width="150" height="54" />
          <polygon points="60,78 141,48 222,78" />
          <circle cx="141" cy="106" r="20" fill="#efe4cb" opacity="0.35" />
          <circle cx="141" cy="106" r="20" fill="none" stroke={GOLD} strokeWidth="1.6" />
          {Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return <line key={i} x1={141} y1={106} x2={(141 + Math.cos(a) * 16).toFixed(1)} y2={(106 + Math.sin(a) * 16).toFixed(1)} stroke={TINTE} strokeWidth="1.6" />; })}
          {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx="262" cy={128 - i * 7} rx="20" ry="5" stroke={GOLD} strokeWidth="0.8" />)}
          {[0, 1, 2].map((i) => <ellipse key={i} cx="236" cy={128 - i * 7} rx="16" ry="4.5" stroke={GOLD} strokeWidth="0.8" />)}
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
          <stop offset="0" stopColor="#3a2418" />
          <stop offset="1" stopColor="#5a3a24" />
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
        <path d="M0 122 Q40 96 84 116 T170 108 T260 118 T320 104 V180 H0 Z" fill={entwurf ? "#6b4a2c" : "#7d6247"} opacity={entwurf ? 0.6 : 0.7} />
        <path d="M0 132 Q60 112 120 128 T240 124 T320 130 V180 H0 Z" fill={entwurf ? "#4a3020" : "#4a3826"} opacity="0.9" />
        <rect y="136" width="320" height="44" fill={entwurf ? "#38231a" : `url(#boden${id})`} />
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
