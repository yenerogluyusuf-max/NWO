// Haare als gemalte Massen: eine Grundform mit Verlauf, Strähnen, ein weiches Glanzlicht und eine dunkle Unterseite; ohne Konturlinie.
// Die Haarlinie folgt dem Raster (Haaransatz 0,18 H), Geheimratsecken und Glatze hängen am Alter (portraet-kern.ts: waehleAus).

import type { ReactNode } from "react";
import { dunkler, f, glatt, heller, klemme, mische, type Auswahl, type P } from "./portraet-kern";

export interface HaarFarben {
  /** dunkel (Unterseite, Tiefe) */
  c0: string;
  /** Grundton */
  c: string;
  /** mittel */
  c2: string;
  /** Glanz */
  c3: string;
  /** Grau der Schläfen */
  grauTon: string;
}

export function haarFarben(a: Auswahl): HaarFarben {
  // Männer ergrauen eisengrau, Frauen heller bis weiß; das Alter bestimmt, wie viel
  const grauTon = a.geschlecht === "f" && a.alter > 56 ? "#d9d4cc" : "#a39e97";
  const c = mische(a.haarBasis, grauTon, a.grau * (a.haarFarbIdx > 3 ? 0.95 : 1));
  return { c0: dunkler(c, 0.42), c, c2: heller(c, 0.14), c3: heller(c, 0.5), grauTon };
}

export interface Ids {
  hg: string;
  hc: string;
  soft: string;
  haarClip: string;
  grau: string;
}

export interface Haartracht {
  hinten?: ReactNode;
  vorn: ReactNode;
  /** Pfad der Kappe (für das Grau an den Schläfen und die Schattierung der Stirn) */
  kappe?: string;
}

interface KappeOpt {
  vol: number;
  seite: number;
  tief: number;
  ecken: number;
  sch: number;
  hl?: number;
}

/** Punkte der Haarkappe: Kuppel über dem Schädel, innen die Haarlinie mit Schläfenbuchten. */
function kappePunkte(a: Auswahl, o: KappeOpt): P[] {
  const { rs } = a;
  const A = rs.halbBreite;
  const top = rs.oben - o.vol * 0.5 - 0.6;
  const yc = rs.oben + 0.3 * rs.H;
  const W = A + o.seite + 1.2;
  const hlY = rs.haaransatzY + (o.hl ?? 0);
  const tiefY = rs.oben + o.tief * rs.H;
  const pts: P[] = [[50 - W * 0.985, tiefY]];
  for (const th of [0.97, 0.85, 0.7, 0.56, 0.5, 0.44, 0.3, 0.15, 0.03]) {
    const w = Math.PI * th;
    pts.push([50 + W * Math.cos(w), yc - (yc - top) * Math.sin(w)]);
  }
  pts.push([50 + W * 0.985, tiefY]);
  const eck = o.ecken * rs.H;
  const right: P[] = [
    [A * 0.935, tiefY - 1],
    [A * 0.93, rs.oben + 0.41 * rs.H],
    [A * 0.87, hlY + 0.19 * rs.H],
    [A * 0.76, hlY + 0.105 * rs.H + eck],
    [A * 0.55, hlY + 0.045 * rs.H + eck * 0.5],
    [A * 0.3, hlY + 0.012 * rs.H + eck * 0.2],
  ];
  for (const [dx, y] of right) pts.push([50 + dx, y]);
  pts.push([50 + o.sch, hlY - 0.3]);
  for (const [dx, y] of [...right].reverse()) pts.push([50 - dx, y]);
  return pts;
}
let letzteOpt: KappeOpt | null = null;
const kappePfad = (a: Auswahl, o: KappeOpt): string => {
  letzteOpt = o;
  return glatt(kappePunkte(a, o), true, 0.17);
};

/** Die Haarlinie (innere Kante der Kappe) als offene Kurve: darauf liegt ein weicher Strich, damit die Kante nicht hart wirkt */
function haarlinie(a: Auswahl, o: KappeOpt): string {
  const pts = kappePunkte(a, o);
  const n = pts.length;
  // die innere Kante beginnt nach dem rechten unteren Außenpunkt und reicht bis vor den linken
  return glatt(pts.slice(11 + 0, n), false, 0.17);
}


/** Strähnen von der Scheitelmitte zur Haarlinie und zu den Koteletten: dunkle und helle Pinselzüge */
function straehnen(a: Auswahl, o: KappeOpt, fc: HaarFarben, r: () => number, n: number): ReactNode {
  const { rs } = a;
  const A = rs.halbBreite;
  const W = A + o.seite;
  const hlY = rs.haaransatzY + (o.hl ?? 0);
  const tiefY = rs.oben + o.tief * rs.H;
  const out: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const u = -1 + (2 * (i + 0.5)) / n;
    const au = Math.abs(u);
    const ex = 50 + u * (A * 0.95 + o.seite * 0.5);
    const ey = hlY + (tiefY - hlY) * Math.pow(au, 2.2) + (1 - au) * 0.5;
    const sx = 50 + u * A * 0.12 + o.sch * 0.5;
    const sy = rs.oben - o.vol * 0.3 + 3 + r() * 3;
    const cx = 50 + u * W * 1.1;
    const cy = sy + (ey - sy) * 0.3 - o.vol * 0.35;
    const hell = i % 3 !== 0;
    out.push(<path key={i} d={`M${f(sx)} ${f(sy)} Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}`} fill="none" stroke={hell ? fc.c3 : fc.c0} strokeWidth={f(0.5 + r() * 0.5)} strokeOpacity={hell ? 0.3 + r() * 0.2 : 0.4} strokeLinecap="round" />);
  }
  return <g>{out}</g>;
}

/** Weiches Glanzlicht oben links und dunkle Unterseite rechts */
function glanz(a: Auswahl, o: KappeOpt, fc: HaarFarben, ids: Ids): ReactNode {
  const { rs } = a;
  const W = rs.halbBreite + o.seite;
  const top = rs.oben - o.vol * 0.5;
  const yc = rs.oben + 0.3 * rs.H;
  const tiefY = rs.oben + o.tief * rs.H;
  return (
    <g filter={`url(#${ids.soft})`}>
      <path d={`M${f(50 - W * 0.78)} ${f(yc - 2)} Q${f(50 - W * 0.4)} ${f(top - 1.5)} ${f(50 + W * 0.18)} ${f(top + 2)}`} fill="none" stroke={fc.c3} strokeWidth="3.6" strokeOpacity="0.42" strokeLinecap="round" />
      <path d={`M${f(50 - W * 0.62)} ${f(yc + 3)} Q${f(50 - W * 0.3)} ${f(top + 3)} ${f(50 + W * 0.05)} ${f(top + 5)}`} fill="none" stroke={fc.c3} strokeWidth="1.6" strokeOpacity="0.3" strokeLinecap="round" />
      <path d={`M${f(50 + W * 0.55)} ${f(top + 3)} Q${f(50 + W * 1.02)} ${f(yc - 3)} ${f(50 + W * 0.95)} ${f(tiefY)}`} fill="none" stroke={fc.c0} strokeWidth="4" strokeOpacity="0.4" strokeLinecap="round" />
    </g>
  );
}

/** Graue Schläfen: zwei weiche Strähnenflecken an der Haarlinie, deckend im Maß des Alters */
function schlaefenGrau(a: Auswahl, _o: KappeOpt, fc: HaarFarben, ids: Ids): ReactNode {
  if (a.schlaefen < 0.05 || a.grau > 0.8) return null;
  const { rs } = a;
  const A = rs.halbBreite;
  const y = rs.haaransatzY + 0.09 * rs.H;
  return (
    <g clipPath={`url(#${ids.haarClip})`} opacity={klemme(a.schlaefen * 0.9, 0, 0.9)}>
      {([-1, 1] as const).map((s) => (
        <g key={s}>
          <ellipse cx={f(50 + s * A * 0.84)} cy={f(y)} rx={f(A * 0.3)} ry={f(rs.H * 0.11)} fill={`url(#${ids.grau})`} />
          <path d={`M${f(50 + s * A * 0.6)} ${f(y - 8)} q${f(s * 4)} 7 ${f(s * 3)} 17 M${f(50 + s * A * 0.74)} ${f(y - 10)} q${f(s * 3)} 8 ${f(s * 3.4)} 19`} fill="none" stroke={fc.grauTon} strokeWidth="0.9" strokeOpacity="0.6" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

/** Haarspitzen über der Stirn: kleine Büschel brechen die gerade Haarlinie auf */
function zacken(a: Auswahl, o: KappeOpt, ids: Ids, r: () => number): ReactNode {
  const { rs } = a;
  const A = rs.halbBreite;
  const hlY = rs.haaransatzY + (o.hl ?? 0);
  const out: ReactNode[] = [];
  const n = 10;
  for (let i = 0; i < n; i++) {
    const u = -0.66 + (1.32 * i) / (n - 1);
    const x = 50 + u * A + (r() - 0.5) * 1.2 + o.sch * 0.3;
    const y = hlY + 0.012 * rs.H + Math.pow(Math.abs(u), 2.4) * 0.1 * rs.H + o.ecken * rs.H * Math.abs(u);
    const len = 1.6 + r() * 2.6;
    const w = 2 + r() * 1.6;
    const dx = (r() - 0.5) * 1.2;
    out.push(<path key={i} d={`M${f(x - w / 2)} ${f(y - 1.2)} Q${f(x - w * 0.15 + dx)} ${f(y + len * 0.8)} ${f(x + dx)} ${f(y + len)} Q${f(x + w * 0.3 + dx)} ${f(y + len * 0.55)} ${f(x + w / 2)} ${f(y - 1.2)} Z`} fill={`url(#${ids.hg})`} />);
  }
  return <g>{out}</g>;
}

const MASSE = (d: string, ids: Ids, opacity = 1): ReactNode => <path d={d} fill={`url(#${ids.hg})`} opacity={opacity} />;

/** Hintere Haarmasse langer Frisuren: breit, bis `ende` herab, mit Welle oder Locke */
function hintenLang(a: Auswahl, seite: number, ende: number, ids: Ids, wellig = 0): ReactNode {
  const { rs } = a;
  const W = rs.halbBreite + seite;
  const yc = rs.oben + 0.3 * rs.H;
  const e = rs.oben + ende * rs.H;
  const w = wellig;
  const pts: P[] = [
    [50 - W * 0.95, yc],
    [50 - W * 1.12 - w, yc + (e - yc) * 0.35],
    [50 - W * 1.08 + w, yc + (e - yc) * 0.7],
    [50 - W * 0.9 - w * 0.6, e],
    [50, e + 2],
    [50 + W * 0.9 + w * 0.6, e],
    [50 + W * 1.08 - w, yc + (e - yc) * 0.7],
    [50 + W * 1.12 + w, yc + (e - yc) * 0.35],
    [50 + W * 0.95, yc],
    [50, rs.oben + 2],
  ];
  return MASSE(glatt(pts, true, 0.2), ids);
}

/** Vordere Seitenlocken: Haar fällt am Gesicht entlang über die Ohren bis `ende` */
function seitenLocken(a: Auswahl, seite: number, ende: number, ids: Ids, breite = 0.34): ReactNode {
  const { rs } = a;
  const A = rs.halbBreite;
  const W = A + seite;
  const tiefY = rs.oben + 0.34 * rs.H;
  const e = rs.oben + ende * rs.H;
  const lock = (s: 1 | -1): string => {
    const pts: P[] = [
      [50 + s * A * 0.92, tiefY - 2],
      [50 + s * (W + 0.5), tiefY + 4],
      [50 + s * (W + 1.5), tiefY + (e - tiefY) * 0.5],
      [50 + s * (A * (1 - breite) + 7), e - 1],
      [50 + s * (A * (1 - breite)), e - 3],
      [50 + s * A * 0.96, tiefY + (e - tiefY) * 0.4],
    ];
    return glatt(pts, true, 0.2);
  };
  return (
    <>
      {MASSE(lock(-1), ids)}
      {MASSE(lock(1), ids)}
    </>
  );
}

/** Locken als Kreise auf einem Bogen oder in einer Säule; gemalt mit Radialverlauf */
function lockenBogen(a: Auswahl, o: KappeOpt, ids: Ids, n: number, rad: number, innen = false): ReactNode {
  const { rs } = a;
  const W = rs.halbBreite + o.seite;
  const yc = rs.oben + 0.3 * rs.H;
  const top = rs.oben - o.vol * 0.5;
  const out: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const w = Math.PI * (0.02 + (0.96 * i) / (n - 1));
    const k = innen ? 0.78 : 1;
    out.push(<circle key={i} cx={f(50 - Math.cos(w) * W * k)} cy={f(yc - (yc - top) * Math.sin(w) * k)} r={f(rad)} fill={`url(#${ids.hc})`} />);
  }
  return <g>{out}</g>;
}
function lockenSaeule(x: number, y0: number, y1: number, rad: number, ids: Ids): ReactNode {
  const n = Math.max(2, Math.round((y1 - y0) / (rad * 1.35)));
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} cx={f(x + (i % 2 ? 1.2 : -1.2))} cy={f(y0 + ((y1 - y0) * i) / (n - 1))} r={f(rad)} fill={`url(#${ids.hc})`} />
      ))}
    </g>
  );
}

/** Ein Pony quer über die Stirn bis knapp über die Brauen */
function pony(a: Auswahl, o: KappeOpt, ids: Ids, fc: HaarFarben): ReactNode {
  const { rs } = a;
  const A = rs.halbBreite;
  const yb = rs.braueY - 5;
  const hl = rs.haaransatzY - 2;
  const pts: P[] = [
    [50 - A * 0.96, rs.oben + 0.3 * rs.H],
    [50 - A * 0.98, yb + 2],
    [50 - A * 0.55, yb - 1],
    [50, yb + 0.6],
    [50 + A * 0.55, yb - 1],
    [50 + A * 0.98, yb + 2],
    [50 + A * 0.96, rs.oben + 0.3 * rs.H],
    [50, hl - 6],
  ];
  return (
    <g>
      {MASSE(glatt(pts, true, 0.2), ids)}
      <path d={`M${f(50 - A * 0.8)} ${f(yb)} Q${f(50)} ${f(yb - 3.5)} ${f(50 + A * 0.8)} ${f(yb)}`} fill="none" stroke={fc.c0} strokeWidth="1.2" strokeOpacity="0.35" />
    </g>
  );
}

const MAENNER: ((a: Auswahl, ids: Ids, fc: HaarFarben, r: () => number) => Haartracht)[] = [
  // 0 kurz, glatt
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 2.6, seite: 1.1, tief: 0.37, ecken: 0.004, sch: -2.5 };
    const A = a.rs.halbBreite;
    const y0 = a.rs.haaransatzY;
    const fall = glatt([[50 - 2.5, y0 - 3], [50 + A * 0.25, y0 - 1.5], [50 + A * 0.55, y0 + 2], [50 + A * 0.66, y0 + 5.5], [50 + A * 0.3, y0 + 2.4], [50 - 2.5, y0 + 0.4]], true, 0.2);
    return { kappe: kappePfad(a, o), vorn: <>{MASSE(kappePfad(a, o), ids)}{MASSE(fall, ids)}{straehnen(a, o, fc, r, 17)}{glanz(a, o, fc, ids)}</> };
  },
  // 1 Seitenscheitel mit Schwung
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 3.4, seite: 1.5, tief: 0.37, ecken: 0.006, sch: -6 };
    const A = a.rs.halbBreite;
    const y0 = a.rs.haaransatzY;
    const schwung = glatt(
      [
        [50 - 6, y0 - 4],
        [50 + A * 0.2, y0 - 2.5],
        [50 + A * 0.62, y0 + 2],
        [50 + A * 0.8, y0 + 7],
        [50 + A * 0.4, y0 + 3.5],
        [50 - 6, y0 + 0.5],
      ],
      true,
      0.2,
    );
    return {
      kappe: kappePfad(a, o),
      vorn: (
        <>
          {MASSE(kappePfad(a, o), ids)}
          {MASSE(schwung, ids)}
          {straehnen(a, o, fc, r, 17)}
          <path d={`M${f(50 - 6)} ${f(y0 - 4)} Q${f(50 - 7)} ${f(y0 - 8)} ${f(50 - 4)} ${f(a.rs.oben + 1)}`} fill="none" stroke={fc.c0} strokeWidth="0.9" strokeOpacity="0.6" />
          {glanz(a, o, fc, ids)}
        </>
      ),
    };
  },
  // 2 zurückgekämmt, voll, hohe Welle
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 5.5, seite: 1.8, tief: 0.37, ecken: 0.01, sch: 0, hl: -2.5 };
    return { kappe: kappePfad(a, o), vorn: <>{MASSE(kappePfad(a, o), ids)}{straehnen(a, o, fc, r, 22)}{glanz(a, o, fc, ids)}</> };
  },
  // 3 Glatze mit Haarkranz (nur Männer ab 40)
  (a, ids, fc) => {
    const { rs } = a;
    const A = rs.halbBreite;
    const o = rs.oben;
    const H = rs.H;
    const kranz = (s: 1 | -1): string =>
      glatt(
        [
          [50 + s * A * 0.93, o + 0.3 * H],
          [50 + s * (A + 2.8), o + 0.4 * H],
          [50 + s * (A + 2.5), o + 0.52 * H],
          [50 + s * (A * 0.97), o + 0.55 * H],
          [50 + s * A * 0.9, o + 0.46 * H],
          [50 + s * A * 0.9, o + 0.37 * H],
        ],
        true,
        0.2,
      );
    return {
      vorn: (
        <>
          {MASSE(kranz(-1), ids)}
          {MASSE(kranz(1), ids)}
          <ellipse cx={f(50 - A * 0.28)} cy={f(o + 0.1 * H)} rx={f(A * 0.45)} ry={f(H * 0.065)} fill="#fff4dc" opacity="0.3" filter={`url(#${ids.soft})`} />
          <ellipse cx={f(50 - A * 0.5)} cy={f(o + 0.2 * H)} rx={f(A * 0.16)} ry={f(H * 0.04)} fill={fc.grauTon} opacity="0" />
        </>
      ),
    };
  },
  // 4 Geheimratsecken, kurz
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 2.2, seite: 1.1, tief: 0.37, ecken: 0.07, sch: 0, hl: 1 };
    return { kappe: kappePfad(a, o), vorn: <>{MASSE(kappePfad(a, o), ids)}{straehnen(a, o, fc, r, 15)}{glanz(a, o, fc, ids)}</> };
  },
  // 5 lockig
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 3.2, seite: 2.4, tief: 0.4, ecken: 0.01, sch: 0, hl: -1 };
    return {
      kappe: kappePfad(a, o),
      vorn: (
        <>
          {MASSE(kappePfad(a, o), ids)}
          {lockenBogen(a, o, ids, 13, 6.2)}
          {lockenBogen(a, o, ids, 10, 6, true)}
          {glanz(a, o, fc, ids)}
        </>
      ),
    };
  },
  // 6 Stoppelhaar
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 0.3, seite: 1.2, tief: 0.38, ecken: 0.01, sch: 0, hl: 1 };
    return { kappe: kappePfad(a, o), vorn: <>{MASSE(kappePfad(a, o), ids, 0.6)}{straehnen(a, o, fc, r, 11)}</> };
  },
  // 7 länger, nach hinten, über den Ohren
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 2.4, seite: 3.8, tief: 0.46, ecken: 0.01, sch: 0 };
    return {
      hinten: hintenLang(a, 3.2, 1.0, ids),
      kappe: kappePfad(a, o),
      vorn: <>{MASSE(kappePfad(a, o), ids)}{straehnen(a, o, fc, r, 20)}{glanz(a, o, fc, ids)}</>,
    };
  },
  // 8 hohe Stirn, kurz an den Seiten
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 1.8, seite: 1.0, tief: 0.36, ecken: 0.045, sch: 2, hl: 2.5 };
    return { kappe: kappePfad(a, o), vorn: <>{MASSE(kappePfad(a, o), ids)}{straehnen(a, o, fc, r, 15)}{glanz(a, o, fc, ids)}</> };
  },
  // 9 voller, welliger Schopf
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 6.5, seite: 4.6, tief: 0.44, ecken: 0.012, sch: -2, hl: -1.5 };
    const { rs } = a;
    const A = rs.halbBreite + o.seite;
    return {
      kappe: kappePfad(a, o),
      vorn: (
        <>
          {MASSE(kappePfad(a, o), ids)}
          {straehnen(a, o, fc, r, 22)}
          <path d={`M${f(50 - A * 0.7)} ${f(rs.oben + 4)} q4 -4 8 0 t8 0 t8 0 t8 0 t8 0`} fill="none" stroke={fc.c3} strokeWidth="1.1" strokeOpacity="0.4" strokeLinecap="round" />
          {glanz(a, o, fc, ids)}
        </>
      ),
    };
  },
];

const FRAUEN: ((a: Auswahl, ids: Ids, fc: HaarFarben, r: () => number) => Haartracht)[] = [
  // 0 lang, glatt, Mittelscheitel
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 2.2, seite: 3, tief: 0.4, ecken: 0.008, sch: 0 };
    return {
      hinten: hintenLang(a, 4, 1.34, ids),
      kappe: kappePfad(a, o),
      vorn: (
        <>
          {seitenLocken(a, 3.4, 1.28, ids)}
          {MASSE(kappePfad(a, o), ids)}
          {straehnen(a, o, fc, r, 21)}
          <path d={`M50 ${f(a.rs.oben + 1)} L50 ${f(a.rs.haaransatzY)}`} stroke={fc.c0} strokeWidth="0.9" strokeOpacity="0.55" />
          {glanz(a, o, fc, ids)}
        </>
      ),
    };
  },
  // 1 Bob, kinnlang
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 2, seite: 4.6, tief: 0.4, ecken: 0.01, sch: -3 };
    return {
      hinten: hintenLang(a, 5, 0.98, ids),
      kappe: kappePfad(a, o),
      vorn: <>{seitenLocken(a, 4.4, 0.97, ids, 0.3)}{MASSE(kappePfad(a, o), ids)}{straehnen(a, o, fc, r, 19)}{glanz(a, o, fc, ids)}</>,
    };
  },
  // 2 Dutt
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 0.8, seite: 2.4, tief: 0.42, ecken: 0.01, sch: 0 };
    return {
      hinten: (
        <>
          <circle cx="50" cy={f(a.rs.oben - 1)} r="11" fill={`url(#${ids.hc})`} />
          <path d={`M${f(40)} ${f(a.rs.oben - 3)} q10 -5 20 0`} fill="none" stroke={fc.c3} strokeWidth="1" strokeOpacity="0.4" />
        </>
      ),
      kappe: kappePfad(a, o),
      vorn: <>{MASSE(kappePfad(a, o), ids)}{straehnen(a, o, fc, r, 17)}{glanz(a, o, fc, ids)}</>,
    };
  },
  // 3 Pferdeschwanz
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 1.4, seite: 2.4, tief: 0.4, ecken: 0.008, sch: 0 };
    const { rs } = a;
    const A = rs.halbBreite;
    return {
      hinten: <path d={glatt([[50 + A * 0.4, rs.oben + 4], [50 + A + 14, rs.oben + 10], [50 + A + 17, rs.oben + 0.7 * rs.H], [50 + A + 9, rs.oben + 1.2 * rs.H], [50 + A + 6, rs.oben + 0.6 * rs.H], [50 + A * 0.8, rs.oben + 0.16 * rs.H]], true, 0.2)} fill={`url(#${ids.hg})`} />,
      kappe: kappePfad(a, o),
      vorn: <>{MASSE(kappePfad(a, o), ids)}{straehnen(a, o, fc, r, 19)}{glanz(a, o, fc, ids)}</>,
    };
  },
  // 4 Kurzhaar mit Seitenschwung
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 2.6, seite: 2.8, tief: 0.4, ecken: 0.008, sch: -5 };
    const A = a.rs.halbBreite;
    const y0 = a.rs.haaransatzY;
    const schwung = glatt([[50 - 5, y0 - 4], [50 + A * 0.3, y0 - 2], [50 + A * 0.75, y0 + 6], [50 + A * 0.92, y0 + 16], [50 + A * 0.5, y0 + 5], [50 - 5, y0 + 0.5]], true, 0.2);
    return { kappe: kappePfad(a, o), vorn: <>{MASSE(kappePfad(a, o), ids)}{MASSE(schwung, ids)}{straehnen(a, o, fc, r, 17)}{glanz(a, o, fc, ids)}</> };
  },
  // 5 lockig, lang
  (a, ids, fc) => {
    const o: KappeOpt = { vol: 3.4, seite: 3.4, tief: 0.4, ecken: 0.01, sch: 0, hl: -0.5 };
    const { rs } = a;
    const A = rs.halbBreite + 3.4;
    const y0 = rs.oben + 0.32 * rs.H;
    const y1 = rs.oben + 1.28 * rs.H;
    return {
      hinten: (
        <>
          {lockenSaeule(50 - A - 1, y0, y1, 8, ids)}
          {lockenSaeule(50 + A + 1, y0, y1, 8, ids)}
        </>
      ),
      kappe: kappePfad(a, o),
      vorn: (
        <>
          {MASSE(kappePfad(a, o), ids)}
          {lockenBogen(a, o, ids, 13, 6.4)}
          {lockenBogen(a, o, ids, 10, 6, true)}
          {glanz(a, o, fc, ids)}
        </>
      ),
    };
  },
  // 6 mittellang mit Pony
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 2, seite: 3.4, tief: 0.4, ecken: 0.006, sch: 0 };
    return {
      hinten: hintenLang(a, 4.4, 1.12, ids),
      kappe: kappePfad(a, o),
      vorn: (
        <>
          {seitenLocken(a, 3.6, 1.06, ids, 0.3)}
          {MASSE(kappePfad(a, o), ids)}
          {pony(a, o, ids, fc)}
          {straehnen(a, o, fc, r, 15)}
          {glanz(a, o, fc, ids)}
        </>
      ),
    };
  },
  // 7 Zopf über der Schulter
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 1.6, seite: 2.4, tief: 0.4, ecken: 0.008, sch: 0 };
    const { rs } = a;
    const A = rs.halbBreite;
    return {
      kappe: kappePfad(a, o),
      vorn: (
        <>
          {MASSE(kappePfad(a, o), ids)}
          {straehnen(a, o, fc, r, 19)}
          {Array.from({ length: 6 }, (_, i) => (
            <ellipse key={i} cx={f(50 - A - 5 + (i % 2) * 1.8)} cy={f(rs.oben + 0.62 * rs.H + i * 8)} rx="4.4" ry="5.6" fill={`url(#${ids.hc})`} />
          ))}
          {glanz(a, o, fc, ids)}
        </>
      ),
    };
  },
  // 8 wellig, schulterlang
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 2.6, seite: 3.8, tief: 0.4, ecken: 0.008, sch: -2 };
    return {
      hinten: hintenLang(a, 5, 1.26, ids, 2.4),
      kappe: kappePfad(a, o),
      vorn: <>{seitenLocken(a, 4, 1.2, ids, 0.32)}{MASSE(kappePfad(a, o), ids)}{straehnen(a, o, fc, r, 21)}{glanz(a, o, fc, ids)}</>,
    };
  },
  // 9 kurzer Bob, Seitenscheitel
  (a, ids, fc, r) => {
    const o: KappeOpt = { vol: 2, seite: 3.8, tief: 0.4, ecken: 0.01, sch: -5 };
    return {
      hinten: hintenLang(a, 4.4, 0.88, ids),
      kappe: kappePfad(a, o),
      vorn: (
        <>
          {seitenLocken(a, 3.6, 0.86, ids, 0.3)}
          {MASSE(kappePfad(a, o), ids)}
          {straehnen(a, o, fc, r, 17)}
          <path d={`M${f(50 - 5)} ${f(a.rs.haaransatzY - 3)} Q${f(50 - 6)} ${f(a.rs.oben + 2)} ${f(50 - 3)} ${f(a.rs.oben)}`} fill="none" stroke={fc.c0} strokeWidth="0.9" strokeOpacity="0.55" />
          {glanz(a, o, fc, ids)}
        </>
      ),
    };
  },
];

export const ANZAHL_STILE = MAENNER.length + FRAUEN.length;

/** Die Haartracht aus Auswahl, Farben und einem Zufallsstrom (für die Strähnen) */
export function haartracht(a: Auswahl, ids: Ids, fc: HaarFarben, r: () => number): Haartracht {
  const liste = a.geschlecht === "m" ? MAENNER : FRAUEN;
  letzteOpt = null;
  const t = liste[a.stil % liste.length]!(a, ids, fc, r);
  const o: KappeOpt = letzteOpt ?? { vol: 2, seite: 2.6, tief: 0.4, ecken: 0, sch: 0 };
  return {
    ...t,
    vorn: (
      <>
        {t.kappe && (
          <clipPath id={ids.haarClip}>
            <path d={t.kappe} />
          </clipPath>
        )}
        {t.vorn}
        {!a.glatze && t.kappe ? schlaefenGrau(a, o, fc, ids) : null}
        {!a.glatze && t.kappe && !(a.geschlecht === "m" ? a.stil === 6 : a.stil === 6) ? zacken(a, o, ids, r) : null}
        {!a.glatze && t.kappe ? <path d={haarlinie(a, o)} fill="none" stroke={fc.c} strokeWidth="2.4" strokeOpacity="0.45" strokeLinecap="round" filter={`url(#${ids.soft})`} /> : null}
      </>
    ),
  };
}
