// Gezeichnete Stadtfiguren im Stil der Karte (Tinte und Papier): Hauptstadt (Kuppelhalle mit Fahne), Großstadt (Hochhäuser, Minarette), Provinzstadt
// (Häuser mit Minarett). Die Figuren stehen über dem Banner, ab mittlerer Zoomstufe; auf Distanz bleibt der Punkt.

import type { StadtArt } from "./staedte";

const PAPIER = "#efe2c1";
const PAPIER2 = "#d9c79d";
const TINTE = "#2a1c10";
const DACH = "#9c4a34";
const KUPPEL = "#7f9a96";

export function StadtFigur({ art }: { art: StadtArt }) {
  return (
    <svg className={`city-figur-svg figur-${art}`} viewBox="0 0 64 48" aria-hidden focusable="false">
      <ellipse cx="32" cy="44.5" rx="26" ry="3.2" fill="rgba(30,18,8,0.28)" />
      {art === "hauptstadt" && (
        <g stroke={TINTE} strokeWidth="1.3" strokeLinejoin="round">
          {/* Flügelbauten */}
          <path d="M5 42 V30 H17 V42 Z" fill={PAPIER} />
          <path d="M47 42 V30 H59 V42 Z" fill={PAPIER} />
          <path d="M5 30 L11 25 L17 30 Z" fill={DACH} />
          <path d="M47 30 L53 25 L59 30 Z" fill={DACH} />
          {/* Mittelbau mit Säulenhalle und Kuppel */}
          <path d="M16 42 V25 H48 V42 Z" fill={PAPIER} />
          <path d="M16 25 L32 18.5 L48 25 Z" fill={PAPIER2} />
          <path d="M23 25 V16 A9 9 0 0 1 41 16 V25 Z" fill={KUPPEL} />
          <path d="M23 25 H41" fill="none" />
          {/* Fahne */}
          <path d="M32 7.2 V2.2" fill="none" />
          <path d="M32 2.4 H39 L36.8 4.6 L39 6.8 H32 Z" fill="#b3302a" strokeWidth="0.9" />
          {/* Säulen und Tür */}
          <path d="M20.5 42 V28 M26 42 V28 M38 42 V28 M43.5 42 V28" fill="none" strokeWidth="1.5" />
          <path d="M29.2 42 V34.5 A2.8 2.8 0 0 1 34.8 34.5 V42 Z" fill={TINTE} />
        </g>
      )}
      {art === "metropole" && (
        <g stroke={TINTE} strokeWidth="1.25" strokeLinejoin="round">
          <path d="M3 42 V32 H11 V42 Z" fill={PAPIER2} />
          <path d="M53 42 V30 H61 V42 Z" fill={PAPIER2} />
          <path d="M10 42 V19 H21 V42 Z" fill={PAPIER} />
          <path d="M10 19 L15.5 15.5 L21 19 Z" fill={DACH} />
          <path d="M22 42 V10 H33 V42 Z" fill={PAPIER} />
          <path d="M22 10 H33" fill="none" />
          <path d="M27.5 10 V4" fill="none" />
          <path d="M34 42 V22 H46 V42 Z" fill={PAPIER2} />
          <path d="M34 22 H46" fill="none" />
          {/* Minarette */}
          <path d="M47.5 42 V15 L49.8 10 L52.1 15 V42 Z" fill={PAPIER} />
          <path d="M1.6 42 V26 L3.6 21.5 L5.6 26 V42 Z" fill={PAPIER} />
          {/* Fenster */}
          <path d="M13 24 H18 M13 29 H18 M13 34 H18 M25 15 H30 M25 21 H30 M25 27 H30 M25 33 H30 M37.5 27 H42.5 M37.5 33 H42.5" fill="none" strokeWidth="0.9" />
        </g>
      )}
      {art === "stadt" && (
        <g stroke={TINTE} strokeWidth="1.25" strokeLinejoin="round">
          <path d="M6 42 V32 H18 V42 Z" fill={PAPIER} />
          <path d="M4.5 32 L12 26 L19.5 32 Z" fill={DACH} />
          <path d="M20 42 V28 H32 V42 Z" fill={PAPIER2} />
          <path d="M18.5 28 L26 22.5 L33.5 28 Z" fill={DACH} />
          {/* Moschee mit Kuppel und Minarett */}
          <path d="M35 42 V32 H50 V42 Z" fill={PAPIER} />
          <path d="M37.5 32 A5 5 0 0 1 47.5 32 Z" fill={KUPPEL} />
          <path d="M52 42 V20 L54 15.5 L56 20 V42 Z" fill={PAPIER} />
          <path d="M9.5 38 H14.5 M23 36 H29" fill="none" strokeWidth="0.9" />
          <path d="M41 42 V37.5 A1.7 1.7 0 0 1 44.4 37.5 V42" fill={TINTE} />
        </g>
      )}
    </svg>
  );
}
