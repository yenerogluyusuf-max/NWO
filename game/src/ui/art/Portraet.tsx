// Porträt als gemalte Gouache-Illustration (SVG): weiche Verläufe und Schatten statt Konturlinien, Augen mit Weiß, Iris und Glanzlicht,
// farbige Lippen, Haare als Massen mit Glanzlichtern, Kleidung und Hintergrund je Rolle, Messingoval mit Namensschild.
// Jede Person entsteht deterministisch aus Samen und Angaben; Geschlecht und Alter der Eingabe gelten strikt (portraet-kern.ts: waehleAus).
// Alle Maße stammen aus portraet-proportionen.ts (Kopf 0,72 H breit, Augenlinie 0,50 H, Nasenspitze 0,68 H, Mundlinie 0,80 H usw.).
// Als zweiter Weg zeigt das Porträt gemalte Rasterbilder aus public/ui/portraits/, wenn das Manifest passende kennt (portraet-bilder.ts).
// Bewegung (Blinzeln, leichte Kopfneigung) steht nur im Stil und folgt der Effektstufe (ui/anim/effekte.ts) und „Bewegung reduzieren“.

import { useId, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import "../anim/effekte"; // setzt `data-effekte` am Dokument
import "./portraet.css";
import { Hintergrund, kleidung, kleidungsart } from "./portraet-kleidung";
import { haarFarben, haartracht, ANZAHL_STILE, type Ids } from "./portraet-haare";
import { altersgruppe, useManifest, waehleBild } from "./portraet-bilder";
import {
  MIENEN,
  STIMMUNGEN,
  dunkler,
  f,
  glatt,
  heller,
  hash,
  klemme,
  mische,
  stimmungAus,
  waehleAus,
  zufall,
  HAUT_TON,
  type Auswahl,
  type Bartform,
  type Brillenform,
  type P,
  type PortraetProps,
  type Stimmung,
} from "./portraet-kern";
import { OVAL, SOLL, type Raster } from "./portraet-proportionen";

export type { Bartform, Brillenform, PortraetProps, Stimmung };
export { STIMMUNGEN, stimmungAus };
/** Anzahl der Frisuren (je Geschlecht zehn) */
export const ANZAHL_FRISUREN = ANZAHL_STILE;

/** Ressortfarben für Kleidung und Grund (gleiche Tönung wie in den Ministeransichten). */
export const RESSORT_FARBE: Record<string, string> = {
  finanzen: "#2f6b45",
  inneres: "#8c2b1f",
  aussen: "#2c4a7a",
  zentralbank: "#a8732b",
  stab: "#5c4a86",
  opposition: "#6b6b6b",
  justiz: "#4a5a6e",
  generalstab: "#5a6232",
  wirtschaft: "#2f5d62",
  partner: "#8a3a5e",
};

const GOLD = "#d2a94a";

// ---------------------------------------------------------------------------
// Umriss des Gesichts aus dem Raster (Haut, ohne Haare)

function gesichtPunkte(a: Auswahl): P[] {
  const { rs } = a;
  const A = rs.halbBreite;
  const kf = rs.kopfform;
  const o = rs.oben;
  const H = rs.H;
  const kieferF = rs.geschlecht === "f" ? kf.kiefer * 0.9 : kf.kiefer;
  const rechts: P[] = [
    [50 + A * 0.58, o + 0.068 * H],
    [50 + A * 0.9, o + 0.17 * H],
    [50 + A * 1.0, o + 0.34 * H],
    [50 + A * 0.99, o + 0.5 * H],
    [50 + A * 0.93 * kf.wange, o + 0.66 * H],
    [50 + A * (0.62 + 0.26 * kieferF), o + 0.8 * H],
    [50 + A * kf.kinn * 1.2, o + 0.925 * H],
  ];
  const links = rechts.map(([x, y]) => [100 - x, y] as P).reverse();
  return [[50, o + 0.035 * H], ...rechts, [50, rs.kinnY], ...links];
}
const gesichtPfad = (a: Auswahl): string => glatt(gesichtPunkte(a), true, 0.2);

// ---------------------------------------------------------------------------
// Mundlinien aus Stichproben

function proben(n: number, fn: (t: number) => P): P[] {
  return Array.from({ length: n }, (_, i) => fn(i / (n - 1)));
}

// ---------------------------------------------------------------------------

export function Portraet(props: PortraetProps) {
  const { seed, size = 96, tint = "#8e2a22", stimmung = "neutral", rahmen = "messing", lebendig = true, titel, className, rolle, namensschild, hilfslinien = false, raster: rasterAn = true } = props;
  const uid = useId().replace(/:/g, "");
  const a = useMemo(() => waehleAus(props), [props.seed, props.geschlecht, props.alter, props.brille, props.kopftuch, props.bart, props.haare, props.kopfform]); // eslint-disable-line react-hooks/exhaustive-deps
  const manifest = useManifest();
  const [bildFehler, setBildFehler] = useState<string | null>(null);

  const kleidArt = kleidungsart(rolle);
  const bild = rasterAn
    ? waehleBild(manifest, {
        seed,
        geschlecht: a.geschlecht,
        alter: a.alter,
        ton: HAUT_TON[a.tonIdx]!,
        kopftuch: a.kopftuch,
        brille: !!a.brille,
        bart: a.bart !== "keiner",
        uniform: kleidArt === "uniform",
        robe: kleidArt === "robe",
      })
    : null;

  const rahmenNodes = Rahmen({ uid, rahmen });
  const plakette = namensschild && size >= 190 ? Namensschild({ name: namensschild }) : null;
  const svgProps = {
    className: `portraet${className ? ` ${className}` : ""}`,
    width: size,
    height: size * 1.18,
    viewBox: "-12 -8 124 144",
    role: titel ? "img" : undefined,
    "aria-label": titel,
    "aria-hidden": titel ? undefined : (true as const),
  };

  // Zweiter Weg: gemaltes Rasterbild im Messingoval
  if (bild && bildFehler !== bild.datei) {
    return (
      <svg {...svgProps}>
        <defs>
          <clipPath id={`c${uid}`}>
            <ellipse cx={OVAL.cx} cy={OVAL.cy} rx={OVAL.rx} ry={OVAL.ry} />
          </clipPath>
          <radialGradient id={`rv${uid}`} cx="50%" cy="46%" r="60%">
            <stop offset="0.72" stopColor="#1a110b" stopOpacity="0" />
            <stop offset="1" stopColor="#1a110b" stopOpacity="0.32" />
          </radialGradient>
        </defs>
        {rahmenNodes}
        <g clipPath={`url(#c${uid})`}>
          <rect x="-10" y="-10" width="120" height="150" fill={mische(tint, "#efe3c8", 0.7)} />
          <image href={`/ui/portraits/${bild.datei}`} x="-4" y="-4" width="108" height="136" preserveAspectRatio="xMidYMid slice" onError={() => setBildFehler(bild.datei)} />
          <rect x="-10" y="-10" width="120" height="150" fill={`url(#rv${uid})`} />
        </g>
        {plakette}
      </svg>
    );
  }
  return <GezeichnetesPortraet svgProps={svgProps} props={props} a={a} uid={uid} rahmenNodes={rahmenNodes} plakette={plakette} stimmung={stimmung} tint={tint} size={size} lebendig={lebendig} hilfslinien={hilfslinien} />;
}

// ---------------------------------------------------------------------------
// Rahmen und Namensschild

function Rahmen({ uid, rahmen }: { uid: string; rahmen: "messing" | "tinte" | "keiner" }): ReactNode {
  if (rahmen === "keiner") return null;
  if (rahmen === "tinte") return <ellipse cx="50" cy="64" rx="54" ry="68" fill="none" stroke="#2a1f18" strokeWidth="2" />;
  return (
    <g>
      <defs>
        <linearGradient id={`b${uid}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#fbeab0" />
          <stop offset="0.3" stopColor="#d3a652" />
          <stop offset="0.62" stopColor="#a67a32" />
          <stop offset="1" stopColor="#5e3f16" />
        </linearGradient>
        <linearGradient id={`b2${uid}`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a5522" />
          <stop offset="0.5" stopColor="#e8c878" />
          <stop offset="1" stopColor="#8a6228" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="64" rx="61.5" ry="75.5" fill="#150f0a" opacity="0.5" />
      <ellipse cx="50" cy="64" rx="60" ry="74" fill="#1a1410" />
      <ellipse cx="50" cy="64" rx="58" ry="72" fill={`url(#b${uid})`} />
      <ellipse cx="50" cy="64" rx="54.6" ry="68.6" fill="none" stroke="#2e1f0c" strokeWidth="1.1" />
      <ellipse cx="50" cy="64" rx="56.4" ry="70.4" fill="none" stroke={`url(#b2${uid})`} strokeWidth="2.4" />
      <ellipse cx="50" cy="64" rx="57.4" ry="71.4" fill="none" stroke="#fff3c8" strokeWidth="0.7" strokeDasharray="0.1 3" strokeLinecap="round" />
      {[0, 90, 180, 270].map((deg) => {
        const w = (deg * Math.PI) / 180;
        return <circle key={deg} cx={f(50 + Math.cos(w) * 57.2)} cy={f(64 + Math.sin(w) * 71.2)} r="1.7" fill="#f6dd9a" stroke="#5e3f16" strokeWidth="0.5" />;
      })}
      <ellipse cx="50" cy="64" rx="52.6" ry="66.6" fill="none" stroke="#000" strokeOpacity="0.28" strokeWidth="2.4" />
    </g>
  );
}

function Namensschild({ name }: { name: string }): ReactNode {
  const w = 62;
  return (
    <g>
      <rect x={f(50 - w / 2)} y="119.5" width={w} height="12.4" rx="1.6" fill="#2a1f14" />
      <rect x={f(50 - w / 2 + 0.7)} y="120.2" width={w - 1.4} height="11" rx="1.2" fill="#e9d29a" stroke="#8a6228" strokeWidth="0.5" />
      <text x="50" y="128.4" textAnchor="middle" fontSize="8" fontFamily="'EB Garamond', Georgia, serif" fontWeight="600" fill="#2b1e12" textLength={Math.min(w - 5, name.length * 4.4)} lengthAdjust="spacingAndGlyphs">
        {name}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Das gezeichnete Porträt

interface GProps {
  svgProps: Record<string, unknown>;
  props: PortraetProps;
  a: Auswahl;
  uid: string;
  rahmenNodes: ReactNode;
  plakette: ReactNode;
  stimmung: Stimmung;
  tint: string;
  size: number;
  lebendig: boolean;
  hilfslinien: boolean;
}

function GezeichnetesPortraet({ svgProps, props, a, uid, rahmenNodes, plakette, stimmung, tint, size, lebendig, hilfslinien }: GProps) {
  const { rs } = a;
  const m = MIENEN[stimmung];
  const r = useMemo(() => zufall(props.seed + "|pinsel"), [props.seed]);
  const A = rs.halbBreite;
  const H = rs.H;
  const fein = size >= 64;
  const bewegt = lebendig && size >= 40;
  const ids: Ids = { hg: `hg${uid}`, hc: `hc${uid}`, soft: `so${uid}`, haarClip: `hk${uid}`, grau: `gs${uid}` };
  const fc = haarFarben(a);
  const tracht = haartracht(a, ids, fc, r);
  const mitHintergrund = props.hintergrund ?? size >= 56;
  const kl = kleidung(a, props.rolle, tint, uid);
  const tinte = dunkler(a.hautS, 0.5);
  const faltenFarbe = dunkler(a.hautS, 0.4);
  const clipFace = `kf${uid}`;
  const stil: CSSProperties = { ["--pt-d" as string]: `-${(a.tempo * 6).toFixed(2)}s` };

  // ---- Gesicht: Lagen
  const gesicht = gesichtPfad(a);
  const ey = rs.ey;
  const ex = rs.ex;
  const ew = rs.augenBreite;
  const nw = (rs.augenLuecke / 2) * a.nasenBreite * 1.02;
  const nb = rs.nasenbasisY;
  const tip = rs.nasenspitzeY;
  const my = rs.mundY;
  const mw = rs.mundBreite / 2;
  const kinnY = rs.kinnY;
  const kinnF = (x: number) => rs.oben + x * H;

  const skinG = (
    <>
      <linearGradient id={`sk${uid}`} x1="0" y1="0" x2="1" y2="0.15">
        <stop offset="0" stopColor={mische(a.hautL, a.haut, 0.35)} />
        <stop offset="0.45" stopColor={a.haut} />
        <stop offset="1" stopColor={mische(a.haut, a.hautS, 0.55)} />
      </linearGradient>
      <linearGradient id={`sn${uid}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={mische(a.haut, a.hautS, 0.4)} />
        <stop offset="1" stopColor={mische(a.hautS, "#3a2012", 0.35)} />
      </linearGradient>
      <radialGradient id={`sh${uid}`}>
        <stop offset="0" stopColor={mische(a.hautS, "#2a1408", 0.4)} stopOpacity="0.7" />
        <stop offset="1" stopColor={mische(a.hautS, "#2a1408", 0.4)} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`hl${uid}`}>
        <stop offset="0" stopColor="#fff2d8" stopOpacity="0.62" />
        <stop offset="1" stopColor="#fff2d8" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`wm${uid}`}>
        <stop offset="0" stopColor={a.hautW} stopOpacity="0.55" />
        <stop offset="1" stopColor={a.hautW} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`ls${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4a2a1a" stopOpacity="0.5" />
        <stop offset="0.5" stopColor="#4a2a1a" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={ids.hg} x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0" stopColor={fc.c2} />
        <stop offset="0.5" stopColor={fc.c} />
        <stop offset="1" stopColor={fc.c0} />
      </linearGradient>
      <radialGradient id={ids.hc} cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor={fc.c3} />
        <stop offset="0.45" stopColor={fc.c2} />
        <stop offset="1" stopColor={fc.c0} />
      </radialGradient>
      <radialGradient id={ids.grau}>
        <stop offset="0" stopColor={fc.grauTon} stopOpacity="0.95" />
        <stop offset="1" stopColor={fc.grauTon} stopOpacity="0" />
      </radialGradient>
      <filter id={ids.soft} x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="0.7" />
      </filter>
      <clipPath id={clipFace}>
        <path d={gesicht} />
      </clipPath>
      <clipPath id={`c${uid}`}>
        <ellipse cx={OVAL.cx} cy={OVAL.cy} rx={OVAL.rx} ry={OVAL.ry} />
      </clipPath>
      <pattern id={`gr${uid}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
        <circle cx="0.8" cy="1" r="0.34" fill="#6b4a2a" opacity="0.5" />
        <circle cx="2.7" cy="3" r="0.28" fill="#fff6df" opacity="0.5" />
        <path d="M0 2.4 L4 2.6" stroke="#6b4a2a" strokeWidth="0.22" opacity="0.25" />
      </pattern>
      <pattern id={`st${uid}`} width="1.7" height="1.7" patternUnits="userSpaceOnUse" patternTransform="rotate(17)">
        <circle cx="0.4" cy="0.5" r="0.2" fill={fc.c0} />
        <circle cx="1.3" cy="1.2" r="0.17" fill={fc.c0} />
      </pattern>
    </>
  );

  // ---- Hals mit Schatten unter dem Kinn
  const nh = rs.halsBreite / 2;
  const halsPfad = `M${f(50 - nh)} ${f(kinnF(0.76))} C${f(50 - nh * 1.02)} ${f(kinnY + 4)} ${f(50 - nh * 1.06)} ${f(kinnY + 9)} ${f(50 - nh * 1.12)} ${f(kinnY + 16)} L${f(50 + nh * 1.12)} ${f(kinnY + 16)} C${f(50 + nh * 1.06)} ${f(kinnY + 9)} ${f(50 + nh * 1.02)} ${f(kinnY + 4)} ${f(50 + nh)} ${f(kinnF(0.76))} Z`;
  const hals = a.kopftuch ? null : (
    <g>
      <path d={halsPfad} fill={`url(#sn${uid})`} />
      <ellipse cx="50" cy={f(kinnY + 1.5)} rx={f(nh * 1.0)} ry="7.5" fill={`url(#sh${uid})`} clipPath={`url(#hh${uid})`} opacity="0.95" />
      <clipPath id={`hh${uid}`}>
        <path d={halsPfad} />
      </clipPath>
      <path d={`M${f(50 - nh * 0.55)} ${f(kinnY + 12)} Q50 ${f(kinnY + 16)} ${f(50 + nh * 0.55)} ${f(kinnY + 12)}`} fill="none" stroke={faltenFarbe} strokeOpacity={0.12 + a.falten * 0.35} strokeWidth="0.6" />
    </g>
  );

  // ---- Ohren
  const ohrY = (rs.ohrenOben + rs.ohrenUnten) / 2;
  const ohrRy = ((rs.ohrenUnten - rs.ohrenOben) / 2) * 0.98;
  const ohrRx = 3.5 * a.ohr;
  const ohren = a.kopftuch ? null : (
    <g>
      {([-1, 1] as const).map((s) => (
        <g key={s}>
          <ellipse cx={f(50 + s * (rs.ohrX + 0.5))} cy={f(ohrY)} rx={f(ohrRx)} ry={f(ohrRy)} fill={s < 0 ? mische(a.haut, a.hautS, 0.25) : mische(a.haut, a.hautS, 0.62)} />
          <path d={`M${f(50 + s * (rs.ohrX + 0.9))} ${f(ohrY - ohrRy * 0.55)} C${f(50 + s * (rs.ohrX + ohrRx * 1.2))} ${f(ohrY - ohrRy * 0.3)} ${f(50 + s * (rs.ohrX + ohrRx * 1.2))} ${f(ohrY + ohrRy * 0.4)} ${f(50 + s * (rs.ohrX + 0.8))} ${f(ohrY + ohrRy * 0.6)}`} fill="none" stroke={faltenFarbe} strokeOpacity="0.4" strokeWidth="0.7" strokeLinecap="round" />
          <ellipse cx={f(50 + s * (rs.ohrX + 0.7))} cy={f(ohrY + ohrRy * 0.15)} rx={f(ohrRx * 0.4)} ry={f(ohrRy * 0.45)} fill={dunkler(a.hautW, 0.25)} opacity="0.35" />
        </g>
      ))}
    </g>
  );

  // ---- Schattierung des Gesichts
  const sat = (cx: number, cy: number, rx: number, ry: number, op: number, rot = 0, art: "sh" | "hl" | "wm" = "sh") => (
    <ellipse cx={f(cx)} cy={f(cy)} rx={f(rx)} ry={f(ry)} fill={`url(#${art}${uid})`} opacity={op} transform={rot ? `rotate(${rot} ${f(cx)} ${f(cy)})` : undefined} />
  );
  const aelter = a.falten;
  const schattierung = (
    <g clipPath={`url(#${clipFace})`}>
      <rect x="0" y="0" width="100" height="140" fill={`url(#sk${uid})`} />
      {/* Licht von links oben, Schatten rechts */}
      <rect x={f(50 + A * 0.28)} y={f(rs.oben)} width={f(A * 0.9)} height={f(H + 4)} fill={`url(#shr${uid})`} />
      <linearGradient id={`shr${uid}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={a.hautS} stopOpacity="0" />
        <stop offset="1" stopColor={mische(a.hautS, "#3a2012", 0.4)} stopOpacity="0.5" />
      </linearGradient>
      {sat(50 - A * 0.3, kinnF(0.14), A * 0.5, H * 0.075, 0.9, 0, "hl")}
      {sat(50 - A * 0.55, ey + H * 0.09, A * 0.26, H * 0.06, 0.8, -12, "hl")}
      {sat(50 + A * 0.55, ey + H * 0.09, A * 0.2, H * 0.05, 0.4, 12, "hl")}
      {sat(50 - A * 0.62, ey + H * 0.17, A * 0.3, H * 0.09, (a.geschlecht === "f" ? 0.5 : 0.34) * (1 - a.tonIdx * 0.09), 0, "wm")}
      {sat(50 + A * 0.62, ey + H * 0.17, A * 0.3, H * 0.09, (a.geschlecht === "f" ? 0.45 : 0.3) * (1 - a.tonIdx * 0.09), 0, "wm")}
      {/* Wangenhöhlen und Schläfen modellieren das Gesicht (stärker im Alter und bei Männern) */}
      {sat(50 - A * 0.74, ey + H * 0.21, A * 0.2, H * 0.1, 0.18 + aelter * 0.3 + (a.geschlecht === "m" ? 0.08 : 0))}
      {sat(50 + A * 0.74, ey + H * 0.21, A * 0.2, H * 0.1, 0.3 + aelter * 0.3 + (a.geschlecht === "m" ? 0.1 : 0))}
      {sat(50 - A * 0.96, ey - H * 0.06, A * 0.2, H * 0.17, 0.35)}
      {sat(50 + A * 0.98, ey - H * 0.04, A * 0.24, H * 0.22, 0.6)}
      {/* Augenhöhlen */}
      {([-1, 1] as const).map((s) => sat(50 + s * ex, ey - 0.6, ew * 0.85, ew * 0.46, 0.42 + (s > 0 ? 0.08 : 0)))}
      {/* Nasenschatten rechts, unter der Nase, unter der Unterlippe */}
      {sat(50 + nw * 0.95, ey + H * 0.1, 2.4, H * 0.1, 0.55, 8)}
      {sat(50, nb + 1.6, nw * 0.85, 1.7, 0.75)}
      {sat(50, my + H * 0.075, 8, 2.6, 0.55)}
      {/* Schatten des Haars auf der Stirn */}
      {sat(50, rs.haaransatzY + 1.5, A * 0.95, 3.4, a.glatze ? 0 : 0.5)}
      {/* Kinn: Licht, Kieferschatten */}
      {sat(50 - 1, kinnY - H * 0.06, 6.5, 3.2, 0.55, 0, "hl")}
      {sat(50 + A * 0.6, kinnY - H * 0.1, A * 0.46, H * 0.07, 0.4, -24)}
    </g>
  );

  // ---- Falten und Linien (Alter und Miene)
  const flo = (k: number) => klemme(k, 0, 1);
  const falten = fein ? (
    <g fill="none" stroke={faltenFarbe} strokeLinecap="round" strokeWidth="0.65" clipPath={`url(#${clipFace})`}>
      {[0, 1, 2].map((i) => {
        const y = rs.haaransatzY + 4.5 + i * 3.6;
        const op = flo(aelter * (0.5 - i * 0.1) + m.stirn * (0.5 - i * 0.12) - 0.04);
        return op > 0.04 ? <path key={i} d={`M${f(50 - A * 0.6)} ${f(y)} q${f(A * 0.6)} -1.8 ${f(A * 1.2)} 0`} opacity={f(op)} /> : null;
      })}
      {(m.zorn > 0.05 || aelter > 0.45) && <path d={`M${f(50 - 1.6)} ${f(rs.braueY - 1)} v4.6 M${f(50 + 1.6)} ${f(rs.braueY - 1)} v4.4`} opacity={f(flo(m.zorn * 0.6 + (aelter - 0.4) * 0.5))} />}
      {([-1, 1] as const).map((s) => {
        const op = flo(aelter * 0.65 + m.lach * 0.55 - 0.05);
        const x = 50 + s * (ex + ew / 2 + 1.3);
        return op > 0.04 ? <path key={s} d={`M${f(x)} ${f(ey - 0.4)} l${f(s * 2.2)} -1 M${f(x)} ${f(ey + 0.6)} l${f(s * 2.5)} 0.5 M${f(x)} ${f(ey + 1.6)} l${f(s * 2)} 1.7`} opacity={f(op * 0.8)} /> : null;
      })}
      {([-1, 1] as const).map((s) => {
        const op = flo(m.taschen * 0.6 + aelter * 0.45 - 0.05);
        return op > 0.04 ? <path key={`t${s}`} d={`M${f(50 + s * (ex - ew * 0.4))} ${f(ey + 4.4)} Q${f(50 + s * ex)} ${f(ey + 7)} ${f(50 + s * (ex + ew * 0.5))} ${f(ey + 4.6)}`} opacity={f(op)} /> : null;
      })}
      {([-1, 1] as const).map((s) => {
        const op = flo(aelter * 0.6 + m.lach * 0.6 + 0.1);
        return (
          <path key={`n${s}`} d={`M${f(50 + s * (nw * 1.05))} ${f(nb - 1.4)} C${f(50 + s * (nw * 1.55))} ${f(nb + 3)} ${f(50 + s * (mw * 0.95))} ${f(my - 6)} ${f(50 + s * (mw * 1.12))} ${f(my + 0.2 + (s < 0 ? m.mundL : m.mundR))}`} opacity={f(op * 0.8)} />
        );
      })}
      {aelter > 0.5 &&
        ([-1, 1] as const).map((s) => <path key={`m${s}`} d={`M${f(50 + s * (mw * 1.08))} ${f(my + 1.2)} C${f(50 + s * (mw * 1.05))} ${f(my + 7)} ${f(50 + s * (mw * 0.8))} ${f(my + 11)} ${f(50 + s * (mw * 0.6))} ${f(my + 14)}`} opacity={f((aelter - 0.45) * 0.9)} />)}
    </g>
  ) : null;

  // ---- Augen
  const lidFarbe = dunkler(a.hautS, 0.62);
  const augen = (
    <g>
      {([-1, 1] as const).map((s) => {
        const xi = 50 + s * (ex - ew / 2);
        const xo = 50 + s * (ex + ew / 2);
        const dx = xo - xi;
        const tilt = (a.neigung - 0.35) * 1.1 + (a.geschlecht === "f" ? 0.25 : 0);
        const yi = ey + 0.35;
        const yo = ey - tilt;
        const lid = m.lid;
        const hu = ew * 0.27 * lid * (0.92 + a.augenform * 0.07);
        const hl = ew * 0.19 * (1 - 0.55 * m.unterlid) * (0.95 + a.augenform * 0.03);
        const oben = `M${f(xi)} ${f(yi)} C${f(xi + dx * 0.2)} ${f(yi - hu * 1.05)} ${f(xi + dx * 0.72)} ${f(yo - hu)} ${f(xo)} ${f(yo)}`;
        const mandel = `${oben} C${f(xi + dx * 0.72)} ${f(yo + hl)} ${f(xi + dx * 0.28)} ${f(yi + hl)} ${f(xi)} ${f(yi)} Z`;
        const cx = (xi + xo) / 2 + s * 0.15;
        const ri = ew * 0.255;
        const cy = ey - 0.05 + (lid > 1.2 ? 0.2 : 0);
        const cid = `ea${uid}${s > 0 ? "r" : "l"}`;
        return (
          <g key={s}>
            <clipPath id={cid}>
              <path d={mandel} />
            </clipPath>
            <path d={mandel} fill="#f4eee0" />
            <g clipPath={`url(#${cid})`}>
              <circle cx={f(cx)} cy={f(cy)} r={f(ri)} fill={a.iris} />
              <circle cx={f(cx)} cy={f(cy)} r={f(ri)} fill="none" stroke={dunkler(a.iris, 0.6)} strokeWidth="0.9" strokeOpacity="0.8" />
              <circle cx={f(cx)} cy={f(cy + ri * 0.28)} r={f(ri * 0.7)} fill={heller(a.iris, 0.38)} opacity="0.55" />
              <circle cx={f(cx)} cy={f(cy)} r={f(ri * 0.42)} fill="#120a06" />
              <circle cx={f(cx - ri * 0.38)} cy={f(cy - ri * 0.4)} r={f(ri * 0.2)} fill="#fff" opacity="0.95" />
              <circle cx={f(cx + ri * 0.36)} cy={f(cy + ri * 0.42)} r={f(ri * 0.09)} fill="#fff" opacity="0.5" />
              <path d={mandel} fill={`url(#ls${uid})`} />
              <path d={mandel} fill="none" stroke="#4a2a1a" strokeOpacity="0.28" strokeWidth="1.6" />
            </g>
            <path d={oben} fill="none" stroke={lidFarbe} strokeWidth={f(1.05 + (a.geschlecht === "f" ? 0.3 : 0.1))} strokeLinecap="round" />
            <path d={`M${f(xo)} ${f(yo)} l${f(s * 1.7)} ${f(-0.9)}`} stroke={lidFarbe} strokeWidth={a.geschlecht === "f" ? 0.9 : 0.6} strokeLinecap="round" fill="none" />
            {fein && (
              <>
                <path d={`M${f(xi + dx * 0.1)} ${f(yi - hu * 0.85 - 2.2)} Q${f(xi + dx * 0.5)} ${f(yo - hu * 1.5 - 2.4 - a.lidfalte * 1.2)} ${f(xo - dx * 0.04)} ${f(yo - 1.4)}`} fill="none" stroke={faltenFarbe} strokeOpacity={f(0.3 + a.lidfalte * 0.2)} strokeWidth="0.7" strokeLinecap="round" />
                <path d={`M${f(xi + dx * 0.18)} ${f(yi + hl * 0.82)} Q${f(xi + dx * 0.5)} ${f(yi + hl * 1.12)} ${f(xo - dx * 0.12)} ${f(yo + hl * 0.5)}`} fill="none" stroke={faltenFarbe} strokeOpacity="0.38" strokeWidth="0.55" strokeLinecap="round" />
                <circle cx={f(xi - s * 0.2)} cy={f(yi + 0.2)} r="0.8" fill="#c4766a" opacity="0.7" />
              </>
            )}
            <path className="pt-lid" d={mandel} fill={mische(a.haut, a.hautS, 0.18)} stroke={lidFarbe} strokeWidth="0.9" strokeOpacity="0.6" />
          </g>
        );
      })}
    </g>
  );

  // ---- Brauen (gemalte Form mit Haarstrichen)
  const brauFarbe = mische(fc.c0, fc.c, 0.55);
  const brauen = (
    <g>
      {([-1, 1] as const).map((s) => {
        const xi = 50 + s * (ex - ew * 0.5 - 0.6);
        const xo = 50 + s * (ex + ew * 0.5 + 2.6);
        const extra = s < 0 ? m.einseitig : 0;
        const yi = rs.braueY + 0.4 + m.brauI + extra;
        const yo = rs.braueY + 1.2 + m.brauA + extra;
        const bogenF = [0.8, 1.05, 1.35][a.brauForm]! * m.bogen;
        const xp = xi + (xo - xi) * 0.6;
        const yp = Math.min(yi, yo) - 1.5 * bogenF;
        const t = (1.0 + a.brauDick * 1.1) * m.dick * (a.geschlecht === "f" ? 0.78 : 1.12);
        const d = `M${f(xi)} ${f(yi - t * 0.35)} Q${f(xp)} ${f(yp - t * 0.5)} ${f(xo)} ${f(yo - 0.2)} Q${f(xp + s * 0.5)} ${f(yp + t * 0.6)} ${f(xi)} ${f(yi + t * 0.75)} Z`;
        return (
          <g key={s}>
            <path d={d} fill={brauFarbe} opacity="0.92" />
            {fein &&
              [0.15, 0.35, 0.55, 0.75].map((u, i) => (
                <path key={i} d={`M${f(xi + (xo - xi) * u)} ${f(yi + (yo - yi) * u + 0.5 - (1 - Math.abs(u - 0.5) * 2) * 1.2)} l${f(s * 1.5)} -0.9`} stroke={heller(fc.c, 0.3)} strokeOpacity="0.4" strokeWidth="0.4" strokeLinecap="round" />
              ))}
          </g>
        );
      })}
    </g>
  );

  // ---- Nase
  const spitzeGr = 1.5 + a.spitze * 0.7;
  const nase = (
    <g>
      <path d={`M${f(50 + 2.6)} ${f(ey + 1)} C${f(50 + 3.6)} ${f(ey + 9)} ${f(50 + nw * 0.8)} ${f(nb - 7)} ${f(50 + nw * 1.08)} ${f(nb - 1.8)} L${f(50 + nw * 0.62)} ${f(nb - 0.4)} C${f(50 + nw * 0.42)} ${f(nb - 6.5)} ${f(50 + 3.2)} ${f(ey + 8)} ${f(50 + 1.9)} ${f(ey + 1)} Z`} fill={mische(a.hautS, "#3a2012", 0.3)} opacity={f(0.2 + a.nasenRuecken * 0.2)} />
      <path d={`M${f(50 - 1.1)} ${f(ey + 1)} C${f(50 - 1.6)} ${f(ey + 8)} ${f(50 - 2.2)} ${f(nb - 8)} ${f(50 - 2.4)} ${f(tip - 3)}`} fill="none" stroke="#fff2d8" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
      {sat(50 - 0.4, tip - 1.3, spitzeGr + 0.7, spitzeGr, 1, 0, "hl")}
      {sat(50, tip + 1.4, nw * 0.62, 1.8, 0.4)}
      {([-1, 1] as const).map((s) => (
        <g key={s}>
          <path d={`M${f(50 + s * nw * 0.42)} ${f(tip - 2.4)} Q${f(50 + s * nw * 1.2)} ${f(tip - 3.2)} ${f(50 + s * nw * 1.05)} ${f(nb + 0.3)} Q${f(50 + s * nw * 0.8)} ${f(nb + 1.2)} ${f(50 + s * nw * 0.38)} ${f(nb + 0.7)}`} fill="none" stroke={faltenFarbe} strokeOpacity="0.5" strokeWidth="0.75" strokeLinecap="round" />
          <ellipse cx={f(50 + s * nw * 0.5)} cy={f(nb - 0.2)} rx={f(1.6 + m.nasenfl * 0.4)} ry="0.85" fill={dunkler(a.hautS, 0.6)} opacity="0.78" />
          {sat(50 + s * nw * 0.82, nb - 2.4, nw * 0.3, 2, s < 0 ? 0.5 : 0.2, 0, "hl")}
        </g>
      ))}
    </g>
  );

  // ---- Mund
  const lippeBasis = a.geschlecht === "f" ? mische(a.haut, "#b0404c", 0.58) : mische(a.haut, "#a04e46", 0.4);
  const lippeOben = dunkler(lippeBasis, 0.16);
  const lippeUnten = heller(lippeBasis, 0.08);
  const o = m.oeffnung * 0.8;
  const tu = H * 0.02 * (0.85 + a.lippen * 0.5) * (1 - 0.5 * m.duenn) * (a.geschlecht === "f" ? 1.12 : 1);
  const tl = H * 0.03 * (0.85 + a.lippen * 0.5) * (1 - 0.5 * m.duenn) * (a.geschlecht === "f" ? 1.12 : 1);
  const Lm = (t: number): P => [50 - mw + 2 * mw * t, my + m.mundL * (1 - t) + m.mundR * t + m.wolbung * 0.9 * Math.sin(Math.PI * t)];
  const sn = (t: number) => Math.sin(Math.PI * t);
  const Lu = (t: number): P => {
    const [x, y] = Lm(t);
    return [x, y - o * 0.38 * sn(t)];
  };
  const Ll = (t: number): P => {
    const [x, y] = Lm(t);
    return [x, y + o * 0.62 * sn(t)];
  };
  const bogen = (t: number) => 1 - 0.34 * Math.exp(-Math.pow((t - 0.5) / 0.09, 2)) + 0.28 * Math.exp(-Math.pow((t - 0.35) / 0.07, 2)) + 0.28 * Math.exp(-Math.pow((t - 0.65) / 0.07, 2));
  const U = (t: number): P => {
    const [x, y] = Lu(t);
    return [x, y - tu * Math.pow(sn(t), 0.8) * bogen(t)];
  };
  const D = (t: number): P => {
    const [x, y] = Ll(t);
    return [x, y + tl * Math.pow(sn(t), 0.75)];
  };
  const N = 15;
  const obenLippe = glatt([...proben(N, U), ...proben(N, Lu).reverse()], true, 0.15);
  const untenLippe = glatt([...proben(N, Ll), ...proben(N, D).reverse()], true, 0.15);
  const innen = o > 0.4 ? glatt([...proben(N, Lu), ...proben(N, Ll).reverse()], true, 0.15) : null;
  const mundLinie = glatt(proben(N, Lm), false, 0.15);
  const zahnId = `zn${uid}`;
  const mund = (
    <g>
      <defs>
        <linearGradient id={`lo${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dunkler(lippeOben, 0.1)} />
          <stop offset="1" stopColor={lippeOben} />
        </linearGradient>
        <linearGradient id={`lu${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lippeUnten} />
          <stop offset="1" stopColor={dunkler(lippeBasis, 0.12)} />
        </linearGradient>
        {innen && (
          <clipPath id={zahnId}>
            <path d={innen} />
          </clipPath>
        )}
      </defs>
      {innen && (
        <g>
          <path d={innen} fill="#3a1612" />
          <g clipPath={`url(#${zahnId})`}>
            {m.zaehne && (
              <>
                <rect x={f(50 - mw)} y={f(my - 2 - o)} width={f(mw * 2)} height={f(o * 0.62 + 2)} fill="#f6efdf" />
                <rect x={f(50 - mw)} y={f(my - 2 - o)} width={f(mw * 2)} height={f(1.4)} fill="#d9cdb5" opacity="0.6" />
                {Array.from({ length: 7 }, (_, i) => (
                  <path key={i} d={`M${f(50 - mw * 0.75 + (i * mw * 1.5) / 6)} ${f(my - 2.4 - o)} v${f(o * 0.62 + 2.2)}`} stroke="#bba98c" strokeWidth="0.35" opacity="0.7" />
                ))}
              </>
            )}
            <ellipse cx="50" cy={f(my + o * 0.5 + 0.6)} rx={f(mw * 0.5)} ry={f(o * 0.28 + 0.4)} fill="#a8504a" opacity="0.8" />
          </g>
        </g>
      )}
      <path d={untenLippe} fill={`url(#lu${uid})`} />
      <path d={obenLippe} fill={`url(#lo${uid})`} />
      {/* Glanzlicht der Unterlippe, Mundwinkel */}
      <ellipse cx="50" cy={f(Ll(0.5)[1] + tl * 0.4)} rx={f(mw * 0.3)} ry="0.9" fill="#fff2e0" opacity="0.5" />
      {!innen && <path d={mundLinie} fill="none" stroke={dunkler(lippeBasis, 0.55)} strokeWidth="0.85" strokeLinecap="round" strokeOpacity="0.85" />}
      {([0, 1] as const).map((t) => (
        <circle key={t} cx={f(Lm(t)[0] + (t ? 0.4 : -0.4))} cy={f(Lm(t)[1])} r="0.7" fill={dunkler(lippeBasis, 0.6)} opacity="0.6" />
      ))}
      {fein && <path d={`M${f(50 - 1.5)} ${f(nb + 1.8)} L${f(50 - mw * 0.22)} ${f(U(0.35)[1] - 0.5)} M${f(50 + 1.5)} ${f(nb + 1.8)} L${f(50 + mw * 0.22)} ${f(U(0.65)[1] - 0.5)}`} stroke={faltenFarbe} strokeOpacity="0.16" strokeWidth="0.55" fill="none" />}
    </g>
  );

  // ---- Bart und Stoppeln
  const bartFarbe = mische(fc.c, fc.grauTon, klemme(a.grau * 0.25, 0, 0.3));
  const bartGr = (
    <linearGradient id={`bd${uid}`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={heller(bartFarbe, 0.1)} />
      <stop offset="1" stopColor={dunkler(bartFarbe, 0.3)} />
    </linearGradient>
  );
  const unterKiefer: P[] = [
    [50 - A * 0.99, rs.oben + 0.52 * H],
    [50 - A * 0.93 * a.rs.kopfform.wange, rs.oben + 0.68 * H],
    [50 - A * 0.62, kinnY - 0.07 * H],
    [50 - A * a.rs.kopfform.kinn * 1.2, kinnY + 0.5],
    [50, kinnY + 3],
    [50 + A * a.rs.kopfform.kinn * 1.2, kinnY + 0.5],
    [50 + A * 0.62, kinnY - 0.07 * H],
    [50 + A * 0.93 * a.rs.kopfform.wange, rs.oben + 0.68 * H],
    [50 + A * 0.99, rs.oben + 0.52 * H],
  ];
  const schnurrPfad = glatt(
    [
      [50 - mw * 1.12, my - 1.5],
      [50 - mw * 0.6, my - tu - 4.2],
      [50 - 1.2, my - tu - 2.6],
      [50 + 1.2, my - tu - 2.6],
      [50 + mw * 0.6, my - tu - 4.2],
      [50 + mw * 1.12, my - 1.5],
      [50 + mw * 0.55, my - tu - 0.8],
      [50, my - tu - 0.4],
      [50 - mw * 0.55, my - tu - 0.8],
    ],
    true,
    0.18,
  );
  const bartHaare = (pfadId: string, n: number): ReactNode => (
    <g clipPath={`url(#${pfadId})`}>
      {Array.from({ length: n }, (_, i) => {
        const x = 50 - A * 0.95 + r() * A * 1.9;
        const y = rs.oben + 0.5 * H + r() * (kinnY + 4 - (rs.oben + 0.5 * H));
        return <path key={i} d={`M${f(x)} ${f(y)} q${f((r() - 0.5) * 2)} ${f(2 + r() * 2)} ${f((r() - 0.5) * 2.4)} ${f(3 + r() * 2)}`} stroke={r() > 0.5 ? heller(bartFarbe, 0.28) : dunkler(bartFarbe, 0.45)} strokeOpacity="0.38" strokeWidth="0.45" fill="none" strokeLinecap="round" />;
      })}
    </g>
  );
  let bart: ReactNode = null;
  if (a.bart === "stoppel") {
    const zone = glatt([...unterKiefer, [50 + mw * 1.4, my - 3], [50, nb + 3.2], [50 - mw * 1.4, my - 3]], true, 0.16);
    bart = (
      <g>
        <clipPath id={`bz${uid}`}>
          <path d={zone} />
        </clipPath>
        <g clipPath={`url(#${clipFace})`}>
          <path d={zone} fill={fc.c0} opacity="0.2" />
          <path d={zone} fill={`url(#st${uid})`} opacity="0.4" />
        </g>
      </g>
    );
  } else if (a.bart === "schnurr" || a.bart === "kinn" || a.bart === "voll") {
    const kinnbart = glatt(
      [
        [50 - 7.5, my + tl + 2],
        [50 - 6, kinnY - 2],
        [50, kinnY + 2.6],
        [50 + 6, kinnY - 2],
        [50 + 7.5, my + tl + 2],
        [50, my + tl + 0.8],
      ],
      true,
      0.18,
    );
    const voll = glatt([...unterKiefer, [50 + A * 0.55, my + tl + 5], [50 + mw * 1.1, my - 2], [50, my - tu - 2], [50 - mw * 1.1, my - 2], [50 - A * 0.55, my + tl + 5]], true, 0.17);
    bart = (
      <g>
        {bartGr}
        {a.bart === "voll" && (
          <>
            <clipPath id={`bv${uid}`}>
              <path d={voll} />
            </clipPath>
            <path d={voll} fill={`url(#bd${uid})`} />
            {fein && bartHaare(`bv${uid}`, 60)}
          </>
        )}
        {a.bart === "kinn" && <path d={kinnbart} fill={`url(#bd${uid})`} />}
        <path d={schnurrPfad} fill={`url(#bd${uid})`} />
      </g>
    );
  }

  // ---- Brille: Gläser auf den Augen, Steg über der Nase, Bügel bis zu den Ohren
  const dicke = H * 0.018;
  const brillenFarbe = a.geschlecht === "f" ? mische("#7a5a2a", "#2a1f18", 0.35) : "#2a2018";
  const brille = a.brille ? (
    <g>
      {([-1, 1] as const).map((s) => {
        const cx = 50 + s * ex;
        const br = ew * 0.82;
        const ho = ew * (a.brille === "rund" ? 0.82 : a.brille === "oval" ? 0.62 : 0.58);
        const form =
          a.brille === "eckig"
            ? `M${f(cx - br)} ${f(ey - ho)} h${f(br * 2)} v${f(ho * 2)} h${f(-br * 2)} Z`
            : a.brille === "halb"
              ? `M${f(cx - br)} ${f(ey - ho * 0.9)} h${f(br * 2)}`
              : `M${f(cx - br)} ${f(ey)} a${f(br)} ${f(ho)} 0 1 0 ${f(br * 2)} 0 a${f(br)} ${f(ho)} 0 1 0 ${f(-br * 2)} 0 Z`;
        return (
          <g key={s}>
            {a.brille !== "halb" && <path d={form} fill="#bfd4e0" fillOpacity="0.12" />}
            <path d={form} fill="none" stroke={brillenFarbe} strokeWidth={f(dicke * (a.brille === "halb" ? 1.1 : 1))} strokeLinejoin="round" strokeLinecap="round" />
            {a.brille === "halb" && <path d={`M${f(cx - br)} ${f(ey - ho * 0.9)} Q${f(cx)} ${f(ey + ho * 1.3)} ${f(cx + br)} ${f(ey - ho * 0.9)}`} fill="#bfd4e0" fillOpacity="0.1" stroke={brillenFarbe} strokeOpacity="0.5" strokeWidth="0.5" />}
            <path d={`M${f(cx - br * 0.55)} ${f(ey - ho * 0.55)} l${f(br * 0.55)} ${f(-ho * 0.2)} M${f(cx - br * 0.7)} ${f(ey - ho * 0.1)} l${f(br * 0.3)} ${f(-ho * 0.1)}`} stroke="#fff" strokeOpacity="0.5" strokeWidth="0.9" strokeLinecap="round" />
            <path d={`M${f(cx + s * br)} ${f(ey - ho * 0.7)} L${f(50 + s * (rs.ohrX + 0.5))} ${f(rs.ohrenOben + 3)}`} stroke={brillenFarbe} strokeWidth={f(dicke * 0.8)} strokeLinecap="round" fill="none" />
          </g>
        );
      })}
      <path d={`M${f(50 - ex + ew * 0.82)} ${f(ey - 1)} Q50 ${f(ey - 3)} ${f(50 + ex - ew * 0.82)} ${f(ey - 1)}`} fill="none" stroke={brillenFarbe} strokeWidth={f(dicke * 0.9)} strokeLinecap="round" />
    </g>
  ) : null;

  // ---- Kopftuch: Stoff mit Falten, rahmt das Gesicht
  const stoffC = a.stoff;
  const schalGr = (
    <linearGradient id={`sc${uid}`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={heller(stoffC, 0.22)} />
      <stop offset="0.55" stopColor={stoffC} />
      <stop offset="1" stopColor={dunkler(stoffC, 0.35)} />
    </linearGradient>
  );
  const aussen = glatt(
    [
      [50, rs.oben - 2],
      [50 + A + 9, rs.oben + 0.2 * H],
      [50 + A + 13, rs.oben + 0.55 * H],
      [50 + A + 17, kinnY + 12],
      [50 + 14, kinnY + 18],
      [50, kinnY + 20],
      [50 - 14, kinnY + 18],
      [50 - A - 17, kinnY + 12],
      [50 - A - 13, rs.oben + 0.55 * H],
      [50 - A - 9, rs.oben + 0.2 * H],
    ],
    true,
    0.2,
  );
  const oeffnung = glatt(
    [
      [50, rs.haaransatzY + 1],
      [50 + A * 0.7, rs.oben + 0.22 * H],
      [50 + A * 0.93, rs.oben + 0.42 * H],
      [50 + A * 0.9, rs.oben + 0.66 * H],
      [50 + A * 0.58, kinnY - 0.05 * H],
      [50, kinnY + 3],
      [50 - A * 0.58, kinnY - 0.05 * H],
      [50 - A * 0.9, rs.oben + 0.66 * H],
      [50 - A * 0.93, rs.oben + 0.42 * H],
      [50 - A * 0.7, rs.oben + 0.22 * H],
    ],
    true,
    0.2,
  );
  const schalHinten = a.kopftuch ? (
    <g>
      {schalGr}
      <path d={aussen} fill={`url(#sc${uid})`} />
    </g>
  ) : null;
  const schalVorn = a.kopftuch ? (
    <g>
      <path d={`${aussen} ${oeffnung}`} fillRule="evenodd" fill={`url(#sc${uid})`} />
      {/* Stofffalten und Lichtkante entlang des Gesichts */}
      <path d={oeffnung} fill="none" stroke={dunkler(stoffC, 0.5)} strokeOpacity="0.45" strokeWidth="1.6" />
      <path d={glatt([[50 - A * 0.6, rs.oben + 0.19 * H], [50, rs.haaransatzY - 0.5], [50 + A * 0.6, rs.oben + 0.19 * H]], false)} fill="none" stroke={heller(stoffC, 0.55)} strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" />
      {[-1, 1].map((s) =>
        [0.3, 0.55, 0.8].map((u, i) => (
          <path key={`${s}${i}`} d={`M${f(50 + s * (A + 2 + i * 3))} ${f(rs.oben + 0.12 * H + i * 4)} C${f(50 + s * (A + 10 + i * 2))} ${f(rs.oben + 0.4 * H)} ${f(50 + s * (A + 12 + i * 2))} ${f(kinnY - 4)} ${f(50 + s * (A + 6 + i * 3))} ${f(kinnY + 14)}`} fill="none" stroke={s > 0 ? dunkler(stoffC, 0.5) : heller(stoffC, 0.4)} strokeOpacity={0.3 - i * 0.05} strokeWidth="1.1" strokeLinecap="round" />
        )),
      )}
      <path d={`M${f(50 - 12)} ${f(kinnY + 6)} C${f(50 - 4)} ${f(kinnY + 11)} ${f(50 + 6)} ${f(kinnY + 9)} ${f(50 + 14)} ${f(kinnY + 4)}`} fill="none" stroke={dunkler(stoffC, 0.5)} strokeOpacity="0.4" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  ) : null;

  // ---- Hilfslinien des Proportionsrasters (Prüfbild)
  const hilfe = hilfslinien ? (
    <g fontFamily="Inter, sans-serif" fontSize="3.4" strokeWidth="0.35" fill="none">
      <path d="M50 0 V140" stroke="#d02020" />
      {[
        [rs.oben, "#777", "Scheitel"],
        [rs.haaransatzY, "#8a6a2a", "Ansatz 0,18"],
        [rs.braueY, "#2060b0", "Brauen"],
        [rs.ey, "#d02020", "Augen 0,50"],
        [rs.nasenspitzeY, "#188040", "Nase 0,68"],
        [rs.mundY, "#b02090", "Mund 0,80"],
        [rs.kinnY, "#777", "Kinn 1,0"],
      ].map(([y, c, t]) => (
        <g key={String(t)} stroke={String(c)}>
          <path d={`M-6 ${f(Number(y))} H106`} />
          <text x="-5" y={f(Number(y) - 0.8)} fill={String(c)} stroke="none">
            {String(t)}
          </text>
        </g>
      ))}
      <path d={`M${f(50 - A)} ${f(rs.oben)} V${f(rs.kinnY)} M${f(50 + A)} ${f(rs.oben)} V${f(rs.kinnY)}`} stroke="#d09020" strokeDasharray="1 1" />
      <path d={`M${f(50 - ex - ew / 2)} ${f(rs.ey - 4)} V${f(rs.ey + 4)} M${f(50 - ex + ew / 2)} ${f(rs.ey - 4)} V${f(rs.ey + 4)} M${f(50 + ex - ew / 2)} ${f(rs.ey - 4)} V${f(rs.ey + 4)} M${f(50 + ex + ew / 2)} ${f(rs.ey - 4)} V${f(rs.ey + 4)}`} stroke="#d02020" />
      <path d={`M${f(50 - mw)} ${f(rs.mundY - 3)} V${f(rs.mundY + 3)} M${f(50 + mw)} ${f(rs.mundY - 3)} V${f(rs.mundY + 3)}`} stroke="#b02090" />
    </g>
  ) : null;

  // ---- Randlicht rechts (zweite, kühle Lichtquelle)
  const randlicht = (
    <path d={glatt(gesichtPunkte(a).slice(0, 9), false, 0.2)} fill="none" stroke="#fff4dc" strokeOpacity="0.25" strokeWidth="1.1" strokeLinecap="round" transform="translate(0.9 0.2)" clipPath={`url(#${clipFace})`} />
  );

  const kopf = (
    <g className={bewegt ? "pt-kopf" : undefined}>
      {!a.kopftuch && tracht.hinten}
      {schalHinten}
      {hals}
      {kl.oben}
      {ohren}
      <path d={gesicht} fill={a.haut} />
      {schattierung}
      {falten}
      {randlicht}
      {augen}
      {brauen}
      {nase}
      {bart}
      {mund}
      {!a.kopftuch && tracht.vorn}
      {schalVorn}
      {brille}
    </g>
  );

  return (
    <svg {...(svgProps as object)} style={stil}>
      <defs>{skinG}</defs>
      {rahmenNodes}
      <g clipPath={`url(#c${uid})`}>
        {mitHintergrund ? <Hintergrund rolle={props.rolle} tint={tint} uid={uid} /> : <rect x="-10" y="-10" width="120" height="150" fill={mische(tint, "#efe3c8", 0.72)} />}
        {kl.unten}
        {kopf}
        {size >= 96 && <rect x="-10" y="-10" width="120" height="150" fill={`url(#gr${uid})`} opacity="0.1" />}
        {hilfe}
      </g>
      {plakette}
    </svg>
  );
}

/** Die Raster-Maße des gezeichneten Kopfes, so wie der Renderer sie benutzt (für Prüfungen und Hilfslinien) */
export function rasterVon(p: PortraetProps): Raster {
  return waehleAus(p).rs;
}

export { SOLL, altersgruppe, hash };
