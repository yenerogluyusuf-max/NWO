// Porträt als Scherenschnitt im Messingoval, wie auf alten Medaillen.
// Bis es gemalte Bildnisse gibt, entsteht jede Figur aus einem Samen:
// Frisur, Brille und Farbe des Grundes wechseln.

import { useId } from "react";

export interface CameoProps {
  seed: string;
  size?: number;
  /** Farbe des Grundes, etwa die Parteifarbe */
  tint?: string;
  /** Frau oder Mann; fehlt es, entscheidet der Samen */
  figure?: "f" | "m";
  glasses?: boolean;
  ring?: "messing" | "tinte";
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// Kopf im Profil nach rechts, Schultern im Anzug. Koordinaten 0–100 × 0–120.
const HEAD =
  "M6 124 C8 106 22 98 38 95 C40 89 39 83 36 78 C28 70 26 54 31 41 C37 27 52 20 64 23 " +
  "C72 26 77 33 77.5 42 C77.8 45 78.5 47 78.5 49.5 C77.5 51 77 52.5 78 54 L86.5 60.5 " +
  "C87 62 85 62.8 82.5 62.8 C82 64 82.5 65.5 82 66.5 C82.5 67.5 81.5 68.5 80.5 69 " +
  "C81.5 70.2 81 71.8 80 72.5 C81 74.5 81 78 77.5 79.5 C72 81 67.5 81.5 65.5 85 " +
  "C64.5 88.5 65.5 92 67.5 94 C78 97 91 104 95 124 Z";

const HAIR_M = [
  // kurz, gescheitelt
  "M29 41 C33 27 50 18 64 22 C71 24 76 29 77 36 C70 30 62 30 56 33 C50 30 44 32 40 38 C38 44 38 52 40 58 C35 60 32 64 33 70 C27 64 25 52 29 41 Z",
  // zurückgekämmt, etwas voller
  "M28 44 C30 28 46 16 62 19 C73 21 79 29 78 38 C72 33 64 31 57 32 C48 33 42 38 40 46 C39 52 40 58 41 62 C36 62 33 66 33 72 C26 64 26 54 28 44 Z",
  // licht, Halbglatze
  "M30 48 C31 42 34 38 38 36 C36 42 37 50 40 57 C36 59 33 63 33 69 C29 63 29 55 30 48 Z",
];

const HAIR_F = [
  // Dutt
  "M27 44 C30 27 47 17 63 20 C73 22 79 30 78 39 C71 32 62 31 55 34 C47 36 42 42 41 50 C40 57 42 63 44 67 C38 70 33 72 31 76 C24 68 24 55 27 44 Z M22 38 C16 34 16 24 23 21 C30 18 35 24 33 31 C31 35 26 39 22 38 Z",
  // schulterlang
  "M26 46 C28 27 46 15 63 19 C74 21 80 30 78 40 C72 33 63 31 56 34 C48 37 43 44 42 52 C41 62 45 72 50 80 C44 88 34 92 26 92 C30 84 30 76 27 70 C23 62 24 54 26 46 Z",
];

const GLASSES = "M70 47 C71 44 78 44 79.5 47 C79 51 72 52 70 47 Z M70 47 L50 45";

export function Cameo({ seed, size = 64, tint = "#8e2a22", figure, glasses, ring = "messing" }: CameoProps) {
  const id = useId().replace(/:/g, "");
  const h = hash(seed);
  const fig = figure ?? (h % 2 === 0 ? "m" : "f");
  const hairs = fig === "m" ? HAIR_M : HAIR_F;
  const hair = hairs[(h >>> 3) % hairs.length]!;
  const withGlasses = glasses ?? (h >>> 7) % 4 === 0;

  return (
    <svg className="cameo" width={size} height={size * 1.18} viewBox="-12 -8 124 144" aria-hidden>
      <defs>
        <radialGradient id={`g${id}`} cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#fbf3dc" />
          <stop offset="0.55" stopColor="#ecdcb4" />
          <stop offset="1" stopColor={tint} stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e2a4" />
          <stop offset="0.45" stopColor="#c69a4a" />
          <stop offset="1" stopColor="#6e4b1c" />
        </linearGradient>
        <pattern id={`h${id}`} width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="3.2" stroke="#6b4a2a" strokeWidth="0.5" strokeOpacity="0.28" />
        </pattern>
        <clipPath id={`c${id}`}>
          <ellipse cx="50" cy="64" rx="50" ry="64" />
        </clipPath>
      </defs>
      {ring === "messing" ? (
        <>
          <ellipse cx="50" cy="64" rx="60" ry="74" fill="#1a1410" />
          <ellipse cx="50" cy="64" rx="57.5" ry="71.5" fill={`url(#b${id})`} />
          <ellipse cx="50" cy="64" rx="53.5" ry="67.5" fill="none" stroke="#3a2812" strokeWidth="1.2" />
          <ellipse cx="50" cy="64" rx="55.5" ry="69.5" fill="none" stroke="#fff3c8" strokeWidth="0.8" strokeDasharray="0.1 3.4" strokeLinecap="round" />
        </>
      ) : (
        <ellipse cx="50" cy="64" rx="54" ry="68" fill="none" stroke="#2a1f18" strokeWidth="2" />
      )}
      <g clipPath={`url(#c${id})`}>
        <rect x="-10" y="-10" width="120" height="150" fill={`url(#g${id})`} />
        <rect x="-10" y="-10" width="120" height="150" fill={`url(#h${id})`} />
        <path d={HEAD} fill="#231913" />
        <path d={hair} fill="#0f0a07" />
        {/* Lichtkante an Stirn und Nase, damit es nicht flach wirkt */}
        <path d="M64 23 C72 26 77 33 77 42 C77 45 78 47 79 49 L85 58" fill="none" stroke="#e9d6ac" strokeWidth="0.9" strokeOpacity="0.55" strokeLinecap="round" />
        {fig === "m" ? (
          <>
            <path d="M66.5 94 L72 108 L78 97.5 Z" fill="#efe2c2" />
            <path d="M70.6 98.5 L73.4 98.8 L74.6 106 L72.6 110 L71 106 Z" fill={tint} stroke="#231913" strokeWidth="0.5" />
            <path d="M66.5 94 L60 106 M78 97.5 L84 110" stroke="#4a3a2c" strokeWidth="1.1" />
          </>
        ) : (
          <path d="M65.5 90 C66 97 71 101 78 99" fill="none" stroke="#e9d6ac" strokeWidth="1.4" strokeDasharray="0.1 2.4" strokeLinecap="round" />
        )}
        {withGlasses && <path d={GLASSES} fill="none" stroke="#e9d6ac" strokeWidth="1.1" strokeOpacity="0.85" />}
      </g>
    </svg>
  );
}
