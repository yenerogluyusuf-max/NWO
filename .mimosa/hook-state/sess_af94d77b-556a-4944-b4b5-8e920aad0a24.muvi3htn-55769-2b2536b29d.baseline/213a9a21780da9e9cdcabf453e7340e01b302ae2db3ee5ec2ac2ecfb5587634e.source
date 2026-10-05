// Kopfbilder der Ereignisfenster je Thema: flache Tuschezeichnungen auf Pergament, im Stil der Karte.
// Jede Szene ist ein SVG mit festem Seitenverhältnis (760 × 190), das den Kopf füllt.

import { useId, type ReactElement } from "react";
import type { Thema } from "./kontext";

const TINTE = "#3b2a1c";
const PAPIER = "#f2e6c9";
const OCKER = "#c9a25a";
const ROT = "#8c2b1f";
const TEAL = "#2f5d62";

function Grund({ id, oben, unten }: { id: string; oben: string; unten: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={oben} />
          <stop offset="1" stopColor={unten} />
        </linearGradient>
        <pattern id={`${id}-schraffur`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={TINTE} strokeWidth="0.6" opacity="0.18" />
        </pattern>
      </defs>
      <rect width="760" height="190" fill={`url(#${id}-g)`} />
    </>
  );
}

function Haushalt({ id }: { id: string }) {
  // Kassenbücher, Münzstapel, Waage und eine Kurve auf Millimeterpapier
  return (
    <>
      <Grund id={id} oben="#f6ecd2" unten="#e7d6ae" />
      <g opacity="0.35" stroke={TINTE} strokeWidth="0.5">
        {Array.from({ length: 19 }, (_, i) => <line key={`v${i}`} x1={40 * i} y1="0" x2={40 * i} y2="190" />)}
        {Array.from({ length: 6 }, (_, i) => <line key={`h${i}`} x1="0" y1={32 * i} x2="760" y2={32 * i} />)}
      </g>
      <polyline points="40,140 120,128 190,134 260,110 330,118 400,92 470,100 540,76" fill="none" stroke={ROT} strokeWidth="2.4" strokeDasharray="7 5" />
      <g transform="translate(560 58)" stroke={TINTE} strokeWidth="1.6">
        <rect x="0" y="62" width="120" height="22" fill="#7d4a2c" />
        <rect x="8" y="40" width="112" height="22" fill={TEAL} />
        <rect x="-4" y="18" width="116" height="22" fill="#8a2d22" />
        <line x1="10" y1="73" x2="110" y2="73" stroke={OCKER} />
        <line x1="18" y1="51" x2="112" y2="51" stroke={OCKER} />
        <line x1="6" y1="29" x2="104" y2="29" stroke={OCKER} />
      </g>
      <g transform="translate(470 92)" stroke={TINTE} strokeWidth="1.3" fill={OCKER}>
        {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx="0" cy={44 - i * 7} rx="18" ry="5" />)}
        {[0, 1, 2].map((i) => <ellipse key={`b${i}`} cx="40" cy={44 - i * 7} rx="18" ry="5" />)}
      </g>
      <g transform="translate(110 40)" stroke={TINTE} strokeWidth="1.6" fill="none">
        <line x1="60" y1="0" x2="60" y2="96" />
        <line x1="10" y1="18" x2="110" y2="10" />
        <path d="M10 18 L0 50 L20 50 Z M110 10 L100 42 L120 42 Z" fill={PAPIER} />
        <path d="M40 96 L80 96" strokeWidth="3" />
      </g>
      <rect width="760" height="190" fill={`url(#${id}-schraffur)`} opacity="0.5" />
    </>
  );
}

function Wirtschaft({ id }: { id: string }) {
  // Werkhallen mit Schornsteinen, Kräne, ein Containerschiff
  return (
    <>
      <Grund id={id} oben="#f4e7c8" unten="#dcc79b" />
      <circle cx="640" cy="54" r="26" fill="#efcf86" opacity="0.8" />
      <g stroke={TINTE} strokeWidth="1.6" fill="#d9c49a">
        <path d="M40 150 L40 100 L80 80 L80 100 L120 80 L120 100 L160 80 L160 150 Z" />
        <rect x="170" y="70" width="14" height="80" />
        <rect x="196" y="56" width="14" height="94" />
        <path d="M240 150 L240 96 L330 96 L330 150 Z" fill="#cdb183" />
      </g>
      <g stroke={TINTE} strokeWidth="1" fill="none" opacity="0.6">
        <path d="M177 64 q8 -14 -2 -26 q-8 -12 4 -24" />
        <path d="M203 50 q10 -14 0 -28 q-8 -12 4 -22" />
      </g>
      <g stroke={TINTE} strokeWidth="1.8" fill="none">
        <path d="M420 150 L420 40 L520 40 M420 58 L470 40 M500 40 L500 80" />
        <rect x="490" y="80" width="22" height="16" fill={ROT} />
      </g>
      <path d="M540 150 L560 172 L740 172 L752 150 Z" fill={TEAL} stroke={TINTE} strokeWidth="1.6" />
      <g stroke={TINTE} strokeWidth="1">
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={566 + i * 28} y="128" width="24" height="22" fill={i % 2 ? OCKER : ROT} />)}
      </g>
      <rect y="168" width="760" height="22" fill="#9db7b3" opacity="0.6" />
      <rect width="760" height="190" fill={`url(#${id}-schraffur)`} opacity="0.4" />
    </>
  );
}

function Aussen({ id }: { id: string }) {
  // Globus mit Längengraden, ein Verhandlungstisch mit Fahnen
  return (
    <>
      <Grund id={id} oben="#f3e8cf" unten="#e0cfa6" />
      <g transform="translate(140 95)" stroke={TINTE} strokeWidth="1.5" fill="none">
        <circle r="70" fill="#d9e2d4" />
        <ellipse rx="30" ry="70" />
        <ellipse rx="58" ry="70" />
        <line x1="-70" y1="0" x2="70" y2="0" />
        <path d="M-64 -28 Q0 -36 64 -28 M-64 28 Q0 36 64 28" />
        <path d="M-30 -40 q20 10 40 -2 q14 18 -6 30 q-24 -4 -34 -28Z" fill={OCKER} opacity="0.7" />
      </g>
      <g stroke={TINTE} strokeWidth="1.6">
        <rect x="340" y="120" width="360" height="16" fill="#7d4a2c" />
        <line x1="360" y1="136" x2="360" y2="176" />
        <line x1="680" y1="136" x2="680" y2="176" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${390 + i * 90} 40)`}>
            <line x1="0" y1="0" x2="0" y2="80" />
            <path d="M0 0 L46 6 L40 20 L46 34 L0 30 Z" fill={[ROT, TEAL, OCKER, "#5b4a7a"][i]} />
          </g>
        ))}
      </g>
      <rect width="760" height="190" fill={`url(#${id}-schraffur)`} opacity="0.4" />
    </>
  );
}

function Sicherheit({ id }: { id: string }) {
  // Grenzposten, Stacheldraht, ein Schild mit Halbmond
  return (
    <>
      <Grund id={id} oben="#e9dfc6" unten="#c9b58a" />
      <path d="M0 150 Q190 120 380 146 T760 136 L760 190 L0 190 Z" fill="#b59c6c" stroke={TINTE} strokeWidth="1.4" />
      <g stroke={TINTE} strokeWidth="1.8" fill="#d6c39b">
        <path d="M120 150 L120 60 L170 60 L170 150" />
        <rect x="110" y="40" width="70" height="22" fill="#8a6a46" />
        <path d="M104 40 L145 18 L186 40 Z" fill={ROT} />
        <rect x="132" y="70" width="26" height="18" fill={PAPIER} />
      </g>
      <g stroke={TINTE} strokeWidth="1.2" fill="none">
        {Array.from({ length: 9 }, (_, i) => <line key={i} x1={240 + i * 60} y1="112" x2={240 + i * 60} y2="150" strokeWidth="2" />)}
        <path d="M240 118 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4 l10 4 l10 -4" />
        <path d="M240 134 h480" strokeDasharray="4 4" />
      </g>
      <g transform="translate(640 30)" stroke={TINTE} strokeWidth="1.8">
        <path d="M0 0 L60 0 L60 40 Q60 74 30 88 Q0 74 0 40 Z" fill={ROT} />
        <circle cx="26" cy="38" r="15" fill={PAPIER} stroke="none" />
        <circle cx="31" cy="38" r="12" fill={ROT} stroke="none" />
        <path d="M44 32 l3 6 l6 1 l-5 4 l1 6 l-5 -3 l-5 3 l1 -6 l-5 -4 l6 -1 Z" fill={PAPIER} stroke="none" />
      </g>
      <rect width="760" height="190" fill={`url(#${id}-schraffur)`} opacity="0.4" />
    </>
  );
}

function Gesellschaft({ id }: { id: string }) {
  // Platz mit Menschenmenge, Transparente, Häuserzeile
  return (
    <>
      <Grund id={id} oben="#f2e5c6" unten="#dac393" />
      <g stroke={TINTE} strokeWidth="1.4" fill="#d8c59b">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect key={i} x={20 + i * 92} y={60 + (i % 3) * 12} width="80" height={100 - (i % 3) * 12} />
        ))}
      </g>
      <g fill={PAPIER} stroke={TINTE} strokeWidth="0.8" opacity="0.8">
        {Array.from({ length: 24 }, (_, i) => <rect key={i} x={32 + (i % 8) * 92 + (i > 7 ? 30 : 0)} y={76 + Math.floor(i / 8) * 22} width="12" height="14" />)}
      </g>
      <g fill={TINTE}>
        {Array.from({ length: 46 }, (_, i) => {
          const x = 12 + i * 16.5;
          const y = 160 + ((i * 7) % 11);
          return (
            <g key={i}>
              <circle cx={x} cy={y - 14} r="5.5" />
              <path d={`M${x - 8} ${y + 20} Q${x} ${y - 10} ${x + 8} ${y + 20} Z`} />
            </g>
          );
        })}
      </g>
      <g stroke={TINTE} strokeWidth="1.4">
        <line x1="210" y1="150" x2="210" y2="96" />
        <line x1="300" y1="150" x2="300" y2="96" />
        <rect x="210" y="96" width="90" height="26" fill={ROT} />
        <line x1="520" y1="150" x2="520" y2="102" />
        <rect x="520" y="102" width="70" height="22" fill={TEAL} />
      </g>
      <rect width="760" height="190" fill={`url(#${id}-schraffur)`} opacity="0.35" />
    </>
  );
}

function Katastrophe({ id }: { id: string }) {
  // Geknickte Häuser, Riss im Boden, Zelte der Hilfe
  return (
    <>
      <Grund id={id} oben="#e6dcc6" unten="#bfa678" />
      <path d="M0 140 L760 140 L760 190 L0 190 Z" fill="#a98d5c" stroke={TINTE} strokeWidth="1.4" />
      <path d="M300 140 l14 12 l-8 10 l18 10 l-6 18" fill="none" stroke={TINTE} strokeWidth="2.4" />
      <g stroke={TINTE} strokeWidth="1.6" fill="#cdb78d">
        <path d="M60 140 L60 70 L130 60 L136 140 Z" transform="rotate(-4 98 140)" />
        <path d="M150 140 L156 84 L220 92 L214 140 Z" transform="rotate(6 186 140)" />
        <path d="M228 140 L236 108 L280 118 L288 140 Z" />
      </g>
      <g stroke={TINTE} strokeWidth="1.4">
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${440 + i * 90} 140 L${480 + i * 90} 96 L${520 + i * 90} 140 Z`} fill={i === 1 ? ROT : PAPIER} />
        ))}
        <rect x="690" y="90" width="12" height="50" fill={PAPIER} />
        <path d="M684 100 h24 M696 88 v24" stroke={ROT} strokeWidth="5" />
      </g>
      <g fill="none" stroke={TINTE} strokeWidth="1" opacity="0.5">
        <path d="M80 56 q10 -18 -4 -30 q-10 -12 6 -24" />
        <path d="M190 80 q12 -16 0 -30" />
      </g>
      <rect width="760" height="190" fill={`url(#${id}-schraffur)`} opacity="0.4" />
    </>
  );
}

function Recht({ id }: { id: string }) {
  // Säulenhalle, Waage, Aktenstapel
  return (
    <>
      <Grund id={id} oben="#f3e8cf" unten="#dfcda2" />
      <g transform="translate(250 24)" stroke={TINTE} strokeWidth="1.6" fill="#e9dcb8">
        <path d="M0 40 L130 0 L260 40 Z" fill="#d8c59b" />
        <rect x="0" y="40" width="260" height="12" />
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={14 + i * 42} y="52" width="16" height="86" />)}
        <rect x="-10" y="138" width="280" height="14" />
      </g>
      <g transform="translate(90 40)" stroke={TINTE} strokeWidth="1.6" fill="none">
        <line x1="50" y1="0" x2="50" y2="110" />
        <line x1="0" y1="20" x2="100" y2="20" />
        <path d="M0 20 L-12 56 L12 56 Z M100 20 L88 56 L112 56 Z" fill={OCKER} />
        <path d="M30 110 h40" strokeWidth="3" />
      </g>
      <g transform="translate(590 70)" stroke={TINTE} strokeWidth="1.3">
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={(i % 2) * 6} y={80 - i * 16} width="110" height="16" fill={[PAPIER, "#e3d2a8", PAPIER, "#d9c497", PAPIER][i]} />)}
        <rect x="14" y="0" width="30" height="8" fill={ROT} />
      </g>
      <rect width="760" height="190" fill={`url(#${id}-schraffur)`} opacity="0.4" />
    </>
  );
}

const SZENEN: Record<Thema, (p: { id: string }) => ReactElement> = {
  haushalt: Haushalt,
  wirtschaft: Wirtschaft,
  aussen: Aussen,
  sicherheit: Sicherheit,
  gesellschaft: Gesellschaft,
  katastrophe: Katastrophe,
  recht: Recht,
};

export function EreignisSzene({ thema }: { thema: Thema }) {
  const id = useId().replace(/:/g, "");
  const Szene = SZENEN[thema];
  return (
    <svg className={`ev2-szene ev2-szene-${thema}`} viewBox="0 0 760 190" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden>
      <Szene id={id} />
    </svg>
  );
}
