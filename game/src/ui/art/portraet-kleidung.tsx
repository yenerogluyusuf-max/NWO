// Kleidung und Hintergründe der gezeichneten Porträts. Kleidung: Anzug mit Kragen, Revers und Krawatte, Bluse mit Jackett, Uniform für den
// Generalstab, Robe mit Beffchen für die Justiz. Hintergründe je Rolle, gedämpft, damit das Gesicht vorn bleibt (Finanzen: Banknotenmuster,
// Justiz: Bücherregal, Generalstab: Karte mit Fahne, Äußeres: Globus, Inneres: dunkel, Präsidialamt: Palastfenster).

import type { ReactNode } from "react";
import { dunkler, f, hash, heller, mische, type Auswahl } from "./portraet-kern";

export type Kleidungsart = "anzug" | "uniform" | "robe";

export function kleidungsart(rolle: string | undefined): Kleidungsart {
  return rolle === "generalstab" ? "uniform" : rolle === "justiz" ? "robe" : "anzug";
}

export interface KleidungsTeile {
  /** Körper (Jackett, Robe, Uniform): vor dem Hals gezeichnet */
  unten: ReactNode;
  /** Hemd, Kragen, Krawatte, Beffchen: nach dem Hals, vor dem Gesicht */
  oben: ReactNode;
}

const GOLD = "#d2a94a";

export function kleidung(a: Auswahl, rolle: string | undefined, tint: string, uid: string): KleidungsTeile {
  const { rs } = a;
  const art = kleidungsart(rolle);
  const nh = rs.halsBreite / 2;
  const sh = rs.schulterBreite / 2;
  const y0 = rs.kinnY + 7;
  const farbe =
    art === "uniform" ? mische("#4a5230", tint, 0.18) : art === "robe" ? "#241f26" : a.geschlecht === "f" ? dunkler(mische(tint, "#4a3d36", 0.45), 0.08) : dunkler(mische(tint, "#3a342f", 0.55), 0.12);
  const lichtF = heller(farbe, 0.18);
  const dunkelF = dunkler(farbe, 0.4);
  const koerper = `M${f(50 - sh * 1.15)} 150 L${f(50 - sh * 1.0)} ${f(y0 + 25)} C${f(50 - sh * 0.82)} ${f(y0 + 10)} ${f(50 - sh * 0.5)} ${f(y0 + 3)} ${f(50 - nh - 3)} ${f(y0 - 1)} L${f(50 + nh + 3)} ${f(y0 - 1)} C${f(50 + sh * 0.5)} ${f(y0 + 3)} ${f(50 + sh * 0.82)} ${f(y0 + 10)} ${f(50 + sh * 1.0)} ${f(y0 + 25)} L${f(50 + sh * 1.15)} 150 Z`;
  const gid = `kl${uid}`;
  const unten = (
    <g>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor={lichtF} />
          <stop offset="0.5" stopColor={farbe} />
          <stop offset="1" stopColor={dunkelF} />
        </linearGradient>
      </defs>
      <path d={koerper} fill={`url(#${gid})`} />
      {/* Falten und Randlicht der Schulter */}
      <path d={`M${f(50 - sh * 0.92)} ${f(y0 + 18)} C${f(50 - sh * 0.7)} ${f(y0 + 8)} ${f(50 - sh * 0.5)} ${f(y0 + 3)} ${f(50 - nh - 3)} ${f(y0)}`} fill="none" stroke={heller(farbe, 0.4)} strokeOpacity="0.5" strokeWidth="1.1" strokeLinecap="round" />
      <path d={`M${f(50 + sh * 0.5)} ${f(y0 + 3)} C${f(50 + sh * 0.72)} ${f(y0 + 9)} ${f(50 + sh * 0.9)} ${f(y0 + 18)} ${f(50 + sh * 0.98)} ${f(y0 + 30)}`} fill="none" stroke={dunkler(farbe, 0.5)} strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
    </g>
  );

  let oben: ReactNode;
  if (art === "uniform") {
    // hoher Stehkragen mit Kragenspiegeln, Epauletten, Knopfleiste
    oben = (
      <g>
        <path d={`M${f(50 - nh - 4)} ${f(y0 - 6)} L${f(50 - nh - 5)} ${f(y0 + 8)} L${f(50 - 3)} ${f(y0 + 11)} L${f(50 - 2)} ${f(y0 - 2)} Z M${f(50 + nh + 4)} ${f(y0 - 6)} L${f(50 + nh + 5)} ${f(y0 + 8)} L${f(50 + 3)} ${f(y0 + 11)} L${f(50 + 2)} ${f(y0 - 2)} Z`} fill={dunkler(farbe, 0.15)} />
        <path d={`M${f(50 - nh - 4)} ${f(y0 - 6)} L${f(50 - 2)} ${f(y0 - 2)} M${f(50 + nh + 4)} ${f(y0 - 6)} L${f(50 + 2)} ${f(y0 - 2)}`} stroke={GOLD} strokeWidth="1.3" strokeOpacity="0.9" />
        <path d={`M${f(50 - nh - 1)} ${f(y0 + 1)} l7 2 l-1 5 l-7 -2 Z M${f(50 + nh + 1)} ${f(y0 + 1)} l-7 2 l1 5 l7 -2 Z`} fill="#a02a22" stroke={GOLD} strokeWidth="0.8" />
        <path d={`M50 ${f(y0 + 11)} L50 150`} stroke={dunkler(farbe, 0.5)} strokeWidth="1.2" strokeOpacity="0.7" />
        {[16, 26, 36].map((d) => (
          <circle key={d} cx="50" cy={f(y0 + d)} r="1.5" fill={GOLD} />
        ))}
        <path d={`M${f(50 - sh * 0.92)} ${f(y0 + 17)} l16 -8 l5 9 l-16 8 Z M${f(50 + sh * 0.92)} ${f(y0 + 17)} l-16 -8 l-5 9 l16 8 Z`} fill={dunkler(farbe, 0.2)} stroke={GOLD} strokeWidth="1.2" />
        <path d={`M${f(50 - sh * 0.8)} ${f(y0 + 17.5)} l11 -5.5 M${f(50 + sh * 0.8)} ${f(y0 + 17.5)} l-11 -5.5`} stroke={GOLD} strokeWidth="0.9" strokeOpacity="0.8" />
      </g>
    );
  } else if (art === "robe") {
    // schwarze Robe mit weißem Beffchen und farbiger Paspel
    oben = (
      <g>
        <path d={`M${f(50 - nh - 3)} ${f(y0 - 2)} L50 ${f(y0 + 24)} L${f(50 + nh + 3)} ${f(y0 - 2)} L${f(50 + nh - 2)} ${f(y0 - 4)} L50 ${f(y0 + 8)} L${f(50 - nh + 2)} ${f(y0 - 4)} Z`} fill="#18141a" />
        <path d={`M${f(50 - nh - 3)} ${f(y0 - 2)} L50 ${f(y0 + 24)} L${f(50 + nh + 3)} ${f(y0 - 2)}`} fill="none" stroke="#7a2d4a" strokeWidth="1.6" strokeOpacity="0.9" />
        <path d={`M${f(50 - 7)} ${f(y0 - 3)} L${f(50 - 2)} ${f(y0 + 22)} L${f(50 - 0.5)} ${f(y0 + 22)} L${f(50 - 0.5)} ${f(y0 - 2)} Z M${f(50 + 7)} ${f(y0 - 3)} L${f(50 + 2)} ${f(y0 + 22)} L${f(50 + 0.5)} ${f(y0 + 22)} L${f(50 + 0.5)} ${f(y0 - 2)} Z`} fill="#f3eee2" stroke="#cfc6b2" strokeWidth="0.5" />
      </g>
    );
  } else if (a.geschlecht === "f") {
    // Jackett mit Revers über einer Bluse, dazu eine feine Kette
    const bluse = heller(mische(a.stoff, tint, 0.4), 0.55);
    oben = (
      <g>
        <path d={`M${f(50 - nh - 2)} ${f(y0 - 2)} C${f(50 - nh * 0.6)} ${f(y0 + 15)} ${f(50 + nh * 0.6)} ${f(y0 + 15)} ${f(50 + nh + 2)} ${f(y0 - 2)} L${f(50 + nh + 8)} ${f(y0 + 8)} L50 ${f(y0 + 30)} L${f(50 - nh - 8)} ${f(y0 + 8)} Z`} fill={bluse} />
        <path d={`M${f(50 - nh - 8)} ${f(y0 + 8)} L${f(50 - nh - 2)} ${f(y0 - 3)} L${f(50 - 4)} ${f(y0 + 28)} L50 ${f(y0 + 36)} L${f(50 - nh - 14)} ${f(y0 + 36)} Z`} fill={dunkler(farbe, 0.1)} />
        <path d={`M${f(50 + nh + 8)} ${f(y0 + 8)} L${f(50 + nh + 2)} ${f(y0 - 3)} L${f(50 + 4)} ${f(y0 + 28)} L50 ${f(y0 + 36)} L${f(50 + nh + 14)} ${f(y0 + 36)} Z`} fill={dunkler(farbe, 0.28)} />
        <path d={`M${f(50 - nh + 1)} ${f(y0 + 1)} Q50 ${f(y0 + 16)} ${f(50 + nh - 1)} ${f(y0 + 1)}`} fill="none" stroke={GOLD} strokeWidth="0.7" strokeOpacity="0.8" />
        <circle cx="50" cy={f(y0 + 13)} r="1.2" fill={GOLD} />
      </g>
    );
  } else {
    // Hemd mit Kragen, Krawatte mit Knoten, Revers
    const krawattenFarbe = a.krawatte ? mische(tint, rolle === "aussen" ? "#2c4a7a" : "#8c2b1f", 0.55) : null;
    oben = (
      <g>
        <path d={`M${f(50 - nh - 1)} ${f(y0 - 3)} L50 ${f(y0 + 24)} L${f(50 + nh + 1)} ${f(y0 - 3)} L${f(50 + nh - 2)} ${f(y0 - 5)} L50 ${f(y0 + 6)} L${f(50 - nh + 2)} ${f(y0 - 5)} Z`} fill="#f1e9d6" />
        <path d={`M${f(50 - nh - 1)} ${f(y0 - 3)} L${f(50 - 2)} ${f(y0 + 6)} L${f(50 - nh * 0.3)} ${f(y0 - 6)} Z M${f(50 + nh + 1)} ${f(y0 - 3)} L${f(50 + 2)} ${f(y0 + 6)} L${f(50 + nh * 0.3)} ${f(y0 - 6)} Z`} fill="#fbf5e6" stroke="#cfc4a8" strokeWidth="0.5" />
        {krawattenFarbe && (
          <g>
            <path d={`M${f(50 - 3.2)} ${f(y0 + 4)} L${f(50 + 3.2)} ${f(y0 + 4)} L${f(50 + 2.6)} ${f(y0 + 9)} L${f(50 - 2.6)} ${f(y0 + 9)} Z`} fill={dunkler(krawattenFarbe, 0.15)} />
            <path d={`M${f(50 - 2.6)} ${f(y0 + 9)} L${f(50 + 2.6)} ${f(y0 + 9)} L${f(50 + 4.8)} ${f(y0 + 36)} L50 ${f(y0 + 40)} L${f(50 - 4.8)} ${f(y0 + 36)} Z`} fill={krawattenFarbe} />
            <path d={`M${f(50 - 0.4)} ${f(y0 + 10)} L${f(50 - 1.6)} ${f(y0 + 36)}`} stroke={heller(krawattenFarbe, 0.4)} strokeWidth="0.8" strokeOpacity="0.5" />
          </g>
        )}
        <path d={`M${f(50 - nh - 4)} ${f(y0 - 3)} L${f(50 - 1)} ${f(y0 + 30)} L${f(50 - nh - 16)} ${f(y0 + 38)} L${f(50 - nh - 8)} ${f(y0 + 8)} Z`} fill={dunkler(farbe, 0.1)} />
        <path d={`M${f(50 + nh + 4)} ${f(y0 - 3)} L${f(50 + 1)} ${f(y0 + 30)} L${f(50 + nh + 16)} ${f(y0 + 38)} L${f(50 + nh + 8)} ${f(y0 + 8)} Z`} fill={dunkler(farbe, 0.32)} />
        {rolle === "aussen" && <path d={`M${f(50 + sh * 0.5)} ${f(y0 + 24)} l5 -2 l1 4 l-5 1 Z`} fill="#f4efe2" />}
      </g>
    );
  }
  return { unten, oben };
}

// ---------------------------------------------------------------------------
// Hintergründe

const n = f;
const wellenband = (y: number, phase: number): string => `M-8 ${n(y)} q8 ${n(-5 + phase)} 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0`;

function Buecher({ tint }: { tint: string }): ReactNode {
  const farben = ["#6b3b2a", "#2f5a3e", "#7a2d2d", "#2c3f66", "#8a6a2a", "#4a3a5c", "#5a4a32", "#3a5a5a"];
  const regale = [22, 52, 82, 112];
  return (
    <g opacity="0.78">
      {regale.map((y, ri) => {
        let x = -6;
        const buecher: ReactNode[] = [];
        let i = 0;
        while (x < 108) {
          const hh = hash(`b${ri}-${i}`);
          const w = 4 + (hh % 4);
          const h = 14 + ((hh >>> 3) % 9);
          buecher.push(<rect key={i} x={n(x)} y={n(y - h)} width={n(w - 0.4)} height={n(h)} fill={mische(farben[(hh >>> 6) % farben.length]!, tint, 0.18)} />);
          buecher.push(<rect key={`g${i}`} x={n(x + 0.5)} y={n(y - h + 3)} width={n(w - 1.4)} height="0.9" fill={GOLD} opacity="0.5" />);
          x += w;
          i++;
        }
        return (
          <g key={ri}>
            {buecher}
            <rect x="-8" y={n(y)} width="116" height="3" fill="#3a2a1c" />
          </g>
        );
      })}
    </g>
  );
}

export function Hintergrund({ rolle, tint, uid }: { rolle: string | undefined; tint: string; uid: string }): ReactNode {
  const grund = (hell: string, dunkel: string): ReactNode => (
    <>
      <defs>
        <radialGradient id={`bg${uid}`} cx="50%" cy="38%" r="75%">
          <stop offset="0" stopColor={hell} />
          <stop offset="1" stopColor={dunkel} />
        </radialGradient>
      </defs>
      <rect x="-10" y="-10" width="120" height="150" fill={`url(#bg${uid})`} />
    </>
  );
  let motiv: ReactNode;
  let g: ReactNode;
  switch (rolle) {
    case "finanzen": {
      g = grund("#e3ecd2", "#7f9a6e");
      motiv = (
        <g fill="none" stroke="#2f6b45" strokeOpacity="0.2" strokeWidth="0.7">
          {Array.from({ length: 13 }, (_, i) => (
            <path key={i} d={wellenband(i * 11 - 4, (i % 3) - 1)} />
          ))}
          {[22, 16, 10, 5].map((r) => (
            <circle key={r} cx="84" cy="30" r={r} />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <circle key={`m${i}`} cx="14" cy={n(100 + i * 4)} r={n(14 - i * 3)} />
          ))}
        </g>
      );
      break;
    }
    case "justiz": {
      g = grund("#cbb597", "#4c3a2a");
      motiv = <Buecher tint={tint} />;
      break;
    }
    case "generalstab": {
      g = grund("#d8cba5", "#5f6440");
      motiv = (
        <g>
          <g fill="none" stroke="#5a4a2a" strokeOpacity="0.3" strokeWidth="0.6">
            {Array.from({ length: 6 }, (_, i) => (
              <path key={i} d={`M-5 ${n(18 + i * 22)} H105 M${n(8 + i * 20)} -5 V135`} />
            ))}
            <path d="M-5 60 C20 40 40 80 60 55 S95 70 110 45" />
            <path d="M-5 90 C25 70 45 105 70 85 S100 95 110 78" />
            <ellipse cx="80" cy="34" rx="20" ry="11" />
            <ellipse cx="80" cy="34" rx="12" ry="6" />
          </g>
          <path d="M-5 100 C20 90 40 108 60 96 S90 98 110 90" fill="none" stroke="#a02a22" strokeOpacity="0.55" strokeWidth="1.1" strokeDasharray="3 2.5" />
          {/* Fahne links */}
          <path d="M9 118 V18" stroke="#3a2a1c" strokeWidth="1.6" />
          <circle cx="9" cy="17" r="1.8" fill={GOLD} />
          <path d="M10 20 C20 17 26 25 36 22 V44 C26 47 20 39 10 42 Z" fill="#b02a22" />
          <circle cx="21" cy="32" r="5.4" fill="#f4efe2" />
          <circle cx="22.8" cy="32" r="4.4" fill="#b02a22" />
          <path d="M27 32 l1.2 -3.4 l1.2 3.4 l3.4 0.1 l-2.7 2.1 l1 3.3 l-2.9 -2 l-2.9 2 l1 -3.3 l-2.7 -2.1 Z" fill="#f4efe2" transform="translate(-1 0) scale(0.9)" />
        </g>
      );
      break;
    }
    case "aussen": {
      g = grund("#dde6ec", "#42607e");
      motiv = (
        <g>
          <circle cx="76" cy="46" r="32" fill="#7ea4c4" opacity="0.5" />
          <g fill="none" stroke="#2c4a7a" strokeOpacity="0.4" strokeWidth="0.7">
            <circle cx="76" cy="46" r="32" />
            <ellipse cx="76" cy="46" rx="14" ry="32" />
            <ellipse cx="76" cy="46" rx="26" ry="32" />
            <path d="M44 46 H108 M48 30 H104 M48 62 H104" />
          </g>
          <path d="M62 30 c6 -4 12 -2 14 3 c-2 5 -8 4 -12 8 c-4 -2 -6 -6 -2 -11 Z M80 52 c5 -2 9 1 8 6 c-3 3 -8 2 -10 -2 Z" fill="#6a8a54" opacity="0.5" />
          <path d="M44 78 c10 10 36 10 64 -4" fill="none" stroke="#8a6a2a" strokeOpacity="0.5" strokeWidth="2" />
        </g>
      );
      break;
    }
    case "inneres": {
      g = grund("#5a606a", "#1f242b");
      motiv = (
        <g fill="none" stroke="#c9d2dc" strokeOpacity="0.1" strokeWidth="0.8">
          {Array.from({ length: 14 }, (_, i) => (
            <path key={i} d={`M${n(i * 9 - 4)} -5 V135`} />
          ))}
          <path d="M72 14 l16 6 v16 c0 10 -8 16 -16 20 c-8 -4 -16 -10 -16 -20 v-16 Z" strokeOpacity="0.2" />
          <circle cx="72" cy="34" r="5" strokeOpacity="0.2" />
        </g>
      );
      break;
    }
    case "stab": {
      g = grund("#f0dfc0", "#6a4a3a");
      motiv = (
        <g>
          <path d="M60 112 V40 C60 20 98 20 98 40 V112 Z" fill="#dfeaf2" opacity="0.85" />
          <path d="M60 112 V40 C60 20 98 20 98 40 V112 Z M79 20 V112 M60 66 H98" fill="none" stroke="#6a5030" strokeWidth="1.3" strokeOpacity="0.7" />
          <path d="M-6 10 C8 30 8 80 -6 120 Z M2 0 C16 28 16 84 4 126 L26 126 C34 80 30 30 18 0 Z" fill="#8a2a2a" opacity="0.85" />
          <path d="M8 10 C16 38 16 80 8 120" fill="none" stroke="#c0524a" strokeOpacity="0.5" strokeWidth="1.4" />
          <path d="M104 4 C96 28 96 80 106 124 L112 124 L112 4 Z" fill="#8a2a2a" opacity="0.8" />
        </g>
      );
      break;
    }
    case "zentralbank": {
      g = grund("#efe2c6", "#7a6644");
      motiv = (
        <g opacity="0.7">
          {[8, 90].map((x) => (
            <g key={x}>
              <rect x={x - 6} y="10" width="16" height="6" fill="#d9c9a2" />
              <rect x={x - 4} y="16" width="12" height="94" fill="#e6d8b6" />
              {[0, 1, 2].map((i) => (
                <path key={i} d={`M${x - 1 + i * 3} 16 V110`} stroke="#b8a67c" strokeWidth="0.6" />
              ))}
              <rect x={x - 6} y="110" width="16" height="6" fill="#d9c9a2" />
            </g>
          ))}
          <circle cx="50" cy="20" r="12" fill="none" stroke={GOLD} strokeOpacity="0.5" strokeWidth="1" />
        </g>
      );
      break;
    }
    case "wirtschaft": {
      g = grund("#dbe8e6", "#496867");
      motiv = (
        <g>
          {Array.from({ length: 10 }, (_, i) => {
            const hh = hash(`w${i}`);
            const h = 28 + (hh % 54);
            return <rect key={i} x={n(i * 12 - 4)} y={n(124 - h)} width="9" height={n(h)} fill="#2f5d62" opacity="0.28" />;
          })}
          <path d="M-4 96 L18 82 L36 90 L58 62 L80 70 L108 36" fill="none" stroke="#a8732b" strokeOpacity="0.55" strokeWidth="1.4" />
        </g>
      );
      break;
    }
    case "partner": {
      g = grund(heller(tint, 0.7), dunkler(tint, 0.35));
      motiv = (
        <g opacity="0.25">
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={`M${n(i * 18 - 40)} 140 L${n(i * 18 + 20)} -10`} stroke={i % 2 ? "#fff" : tint} strokeWidth="6" />
          ))}
        </g>
      );
      break;
    }
    case "opposition": {
      g = grund("#e1ddd2", "#5b5850");
      motiv = (
        <g fill="none" stroke="#3a3830" strokeOpacity="0.14" strokeWidth="0.9">
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={`M-5 ${n(i * 18)} L105 ${n(i * 18 - 14)}`} />
          ))}
        </g>
      );
      break;
    }
    default: {
      g = grund("#f3e8cc", mische(tint, "#4a3a28", 0.5));
      motiv = (
        <g fill="none" stroke="#6b4a2a" strokeOpacity="0.1" strokeWidth="0.6">
          {Array.from({ length: 20 }, (_, i) => (
            <path key={i} d={`M${n(i * 7 - 20)} 140 L${n(i * 7 + 20)} -10`} />
          ))}
        </g>
      );
    }
  }
  return (
    <g>
      {g}
      {motiv}
      {/* Schleier: der Hintergrund tritt hinter das Gesicht zurück */}
      <defs>
        <radialGradient id={`vg${uid}`} cx="50%" cy="42%" r="62%">
          <stop offset="0.35" stopColor="#fff6e0" stopOpacity="0.22" />
          <stop offset="1" stopColor="#1a110b" stopOpacity="0.34" />
        </radialGradient>
      </defs>
      <rect x="-10" y="-10" width="120" height="150" fill={`url(#vg${uid})`} />
    </g>
  );
}
