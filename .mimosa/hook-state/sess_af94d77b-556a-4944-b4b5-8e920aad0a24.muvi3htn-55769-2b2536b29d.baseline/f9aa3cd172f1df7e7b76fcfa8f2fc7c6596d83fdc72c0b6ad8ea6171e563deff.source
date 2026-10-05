// Kleine gezeichnete Wappen für die Antworten des Prologs (Stadt, Jugend, Beruf, Partner, Motiv, Bündnis, Wahlnacht, Szenario)
// und das Wappen der eigenen Partei (Schild mit der Linie als Fünfeck). Linien in Tinte, Grund aus Papier, Ring in der Akzentfarbe.
// Keine Zeichen aus Schriftarten, nur Striche: Die Wappen sehen in jedem Browser gleich aus.

import type { ReactNode } from "react";
import { ACHSEN_IDS, VOREINSTELLUNG_NACH_KURZ, type Achsen } from "../../data/linien";
import { PARTY_COLORS } from "../Parliament";

const G: Record<string, ReactNode> = {
  // Städte der Herkunft
  stadt_izmir: (
    <>
      <path d="M13 25V12h6v13" />
      <path d="M12 12l4-5 4 5z" />
      <circle cx="16" cy="16.500" r="2.200" />
      <path d="M11 25h10" />
      <path d="M5 28c2.500-2 4.500 2 7 0s4.500 2 7 0 4.500 2 7 0" />
    </>
  ),
  stadt_konya: (
    <>
      <path d="M12 26v-7h8v7" />
      <path d="M12 19c0-5 1.500-9 4-13 2.500 4 4 8 4 13" />
      <path d="M14.500 19c0-4 .8-8 1.500-13M17.500 19c0-4-.8-8-1.500-13" />
      <path d="M7 26V15l1.500-3L10 15v11M22 26V15l1.500-3L25 15v11" />
      <path d="M5 26h22" />
    </>
  ),
  stadt_diyarbakir: (
    <>
      <path d="M6 26V11h4v3h4v-3h4v3h4v-3h4v15z" />
      <path d="M13 26v-5a3 3 0 016 0v5" />
      <path d="M4 26h24" />
    </>
  ),
  stadt_trabzon: (
    <>
      <path d="M8 21h16l-3 4.500H11z" />
      <path d="M16 21V6" />
      <path d="M16 7c5 2 7 6.500 7 12h-7z" />
      <path d="M16 10c-3 2-5 5-5 9h5" />
      <path d="M5 28c2.500-1.500 4.500 1.500 7 0s4.500 1.500 7 0 4.500 1.500 7 0" />
    </>
  ),
  // Jugend
  jugend_studenten: (
    <>
      <path d="M6 13v6h4l9 5V8l-9 5z" />
      <path d="M23 12c2 1.500 2 6 0 8" />
      <path d="M26 9.500c3.500 3 3.500 10 0 13" />
      <path d="M9 19l1.500 6h3L12 20" />
    </>
  ),
  jugend_betrieb: (
    <>
      <path d="M5 12l2-5h18l2 5z" />
      <path d="M5 12c1 3 3 3 4.500 0 1 3 3.500 3 4.500 0 1 3 3.500 3 4.500 0 1 3 3.500 3 4.500 0" />
      <path d="M7 16v10h18V16" />
      <path d="M13 26v-6h6v6" />
    </>
  ),
  jugend_moschee: (
    <>
      <path d="M13 27V13h4v14" />
      <path d="M13 13l2-7 2 7z" />
      <path d="M12 19h6M12 23h6" />
      <path d="M26 9a4.500 4.500 0 11-4-4.500 3.500 3.500 0 100 8z" />
      <path d="M5 27h22" />
    </>
  ),
  jugend_sport: (
    <>
      <circle cx="16" cy="16" r="10" />
      <path d="M16 11l4 3-1.500 5h-5L12 14z" />
      <path d="M16 11V6.500M20 14l4.500-1.500M18.500 19l2.500 4M13.500 19L11 23M12 14l-4.500-1.500" />
    </>
  ),
  // Beruf
  beruf_anwalt: (
    <>
      <path d="M16 5v21M10 26h12" />
      <path d="M6 10h20" />
      <path d="M6 10l-3 8M6 10l3 8M26 10l-3 8M26 10l3 8" />
      <path d="M3 18a3 2.500 0 006 0zM23 18a3 2.500 0 006 0z" />
    </>
  ),
  beruf_arzt: (
    <>
      <path d="M13 5h6v8h8v6h-8v8h-6v-8H5v-6h8z" />
      <path d="M8 16h3l1.500-3 2.500 6 1.500-3h6" strokeWidth="1" />
    </>
  ),
  beruf_unternehmer: (
    <>
      <path d="M5 26V15l6 4v-4l6 4v-4l6 4V7h4v19z" />
      <path d="M4 26h24" />
      <path d="M8 22h3M14 22h3M20 22h3" />
      <path d="M25 4c1.500-1 1.500-2.500 3-3.500" />
    </>
  ),
  beruf_oekonom: (
    <>
      <path d="M6 26V6M6 26h20" />
      <path d="M10 23v-6h3v6M15 23v-10h3v10M20 23V10h3v13" />
      <path d="M9 14l5-4 4 2 8-6" />
      <path d="M23 6h3v3" />
    </>
  ),
  // Partner
  liebe_hoersaal: (
    <>
      <path d="M16 9c-3-2-7-2-11-1v16c4-1 8-1 11 1 3-2 7-2 11-1V8c-4-1-8-1-11 1z" />
      <path d="M16 9v16" />
      <path d="M8 12.500c2-.5 4-.5 5 .2M8 16c2-.5 4-.5 5 .2M19 12.700c1-.7 3-.7 5-.2M19 16.200c1-.7 3-.7 5-.2" strokeWidth="1" />
    </>
  ),
  liebe_hochzeit: (
    <>
      <circle cx="12" cy="19" r="6.500" />
      <circle cx="20" cy="19" r="6.500" />
      <path d="M13 7l3-3.500L19 7l-3 3.500z" />
    </>
  ),
  liebe_demo: (
    <>
      <path d="M7 5h15v11H7z" />
      <path d="M14.500 16v11" />
      <path d="M10 9h8M10 12.500h5" />
      <path d="M25 18c1 2.500 3 3.500 3 6a3 3 0 01-6 0c0-2.500 2-3.500 3-6z" />
    </>
  ),
  liebe_klinik: (
    <>
      <path d="M16 27C8 21 5 17 5 12.500A5.500 5.500 0 0116 10a5.500 5.500 0 0111 2.500C27 17 24 21 16 27z" />
      <path d="M16 13v7M12.500 16.500h7" />
    </>
  ),
  // Weg in die Politik
  motiv_unglueck: (
    <>
      <path d="M6 26V14l10-8 10 8v12z" />
      <path d="M16 6l-2.500 6 4.500 3.500-3.500 4.500 2 6" />
    </>
  ),
  motiv_korruption: (
    <>
      <path d="M12 8l-2-3h12l-2 3" />
      <path d="M12 8C7 12 5 17 5 21a5 5 0 005 5h12a5 5 0 005-5c0-4-2-9-7-13z" />
      <path d="M16 12.500V23M13 15.500h4.500a2 2 0 010 4H14a2 2 0 000 4h4.500" />
    </>
  ),
  motiv_mentor: (
    <>
      <path d="M16 3v3" />
      <path d="M11 9h10l1 3H10z" />
      <path d="M10 12h12v11c0 2-2 3.500-6 3.500S10 25 10 23z" />
      <path d="M13 12v14M19 12v14" />
      <path d="M16 15c2.200 2.200 2.200 4.500 0 6.500-2.200-2-2.200-4.300 0-6.500z" />
    </>
  ),
  motiv_ehrgeiz: (
    <>
      <path d="M4 27h7v-6h6v-6h6v-6h5" />
      <path d="M23 9V3l6 2.200L23 7.500" />
    </>
  ),
  // Wahlkampf
  kampf_buendnis: (
    <>
      <circle cx="12" cy="16" r="8" />
      <circle cx="20" cy="16" r="8" />
    </>
  ),
  kampf_allein_gross: (
    <>
      <circle cx="16" cy="17" r="10" />
      <path d="M16 23V11M11.500 15l4.500-4.500 4.500 4.500" />
      <path d="M12 5l4-2 4 2" />
    </>
  ),
  kampf_allein_hart: (
    <>
      <circle cx="14" cy="14" r="8" />
      <path d="M20 20l7 7" />
      <path d="M10 12.500h8M10 16h5" />
    </>
  ),
  // Wahlnacht
  nacht_knapp: (
    <>
      <path d="M16 5v21M10 26h12" />
      <path d="M5 12l22 3" />
      <path d="M5 12l-2.500 7M5 12l2.500 7M27 15l-2.500 7M27 15l2.500 7" />
      <path d="M2.500 19a2.500 2 0 005 0zM24.500 22a2.500 2 0 005 0z" />
    </>
  ),
  nacht_klar: (
    <>
      <path d="M16 27c-6.500 0-10.500-5-10.500-11.500M16 27c6.500 0 10.500-5 10.500-11.500" />
      <path d="M7 21l-3.500-1M6 16.500l-3.500-2M8 12l-2.500-3M25 21l3.500-1M26 16.500l3.500-2M24 12l2.500-3" />
      <path d="M16 8l2.200 4.800 5 .6-3.700 3.400 1 5L16 19.400 11.500 21.800l1-5L8.800 13.400l5-.6z" />
    </>
  ),
  nacht_erste: (
    <>
      <circle cx="16" cy="16" r="11.500" />
      <path d="M12 12.500l4.500-3.500V23" />
      <path d="M11.500 23.500h10" />
    </>
  ),
  // Startszenarien
  start_neugruendung: (
    <>
      <path d="M16 27V15" />
      <path d="M16 17c-6.500 0-8.500-4-8.500-8.500 6.500 0 8.500 3.500 8.500 8.500z" />
      <path d="M16 14c0-4.500 2.200-7.500 8.500-7.500 0 5.500-3 7.500-8.500 7.500z" />
      <path d="M10 27h12" />
    </>
  ),
  start_regierungspartei: (
    <>
      <path d="M4 27h24" />
      <path d="M7 27V15h18v12" />
      <path d="M5 15l11-8.500L27 15z" />
      <path d="M11 27v-8M16 27v-8M21 27v-8" />
    </>
  ),
  start_uebergang: (
    <>
      <circle cx="16" cy="16" r="10.500" />
      <path d="M16 9v7l5 3" />
      <path d="M26.500 9l-4 3.500 3.500 3-3.500 4" />
    </>
  ),
  start_opposition: (
    <>
      <rect x="7.500" y="14" width="17" height="13" rx="2" />
      <path d="M11 14v-3.500a5 5 0 0110 0V14" />
      <circle cx="16" cy="20" r="1.800" />
      <path d="M16 21.500v2.500" />
    </>
  ),
};

/** Kennungen aller gezeichneten Wappen (Tests prüfen, dass jede Antwort eines hat) */
export const WAPPEN_IDS = Object.keys(G);

/** Farbe einer Partei der Szene oder einer Voreinstellung */
export function parteiFarbe(kurz: string): string {
  return PARTY_COLORS[kurz] ?? VOREINSTELLUNG_NACH_KURZ[kurz]?.farbe ?? "#6a5a4a";
}

export interface WappenProps {
  /** Kennung aus `Answer.symbol`, etwa `stadt_izmir` oder `partei:AKP` */
  id: string;
  size?: number;
  /** Farbe des Rings und des Grundtons */
  farbe?: string;
  /** Auf der gewählten Karte: der Ring leuchtet */
  an?: boolean;
  className?: string;
}

/** Das kleine Wappen einer Antwort. */
export function Wappen({ id, size = 44, farbe, an, className }: WappenProps) {
  const partei = id.startsWith("partei:") ? id.slice(7) : null;
  const ring = farbe ?? (partei ? parteiFarbe(partei) : "#8e2a22");
  const glyph = partei ? <ParteiKurz kurz={partei} /> : (G[id] ?? <circle cx="16" cy="16" r="6" />);
  return (
    <svg className={`wappen${an ? " an" : ""}${className ? ` ${className}` : ""}`} viewBox="0 0 32 32" width={size} height={size} style={{ ["--wa" as string]: ring }} aria-hidden>
      <circle className="w-grund" cx="16" cy="16" r="15" />
      <circle className="w-ring" cx="16" cy="16" r="13.200" />
      {partei ? glyph : <g className="w-glyph">{glyph}</g>}
    </svg>
  );
}

function ParteiKurz({ kurz }: { kurz: string }) {
  const kl = kurz.length;
  return (
    <>
      <circle cx="16" cy="16" r="10.500" fill="var(--wa)" stroke="#2a1f18" strokeWidth="0.8" />
      <text x="16" y="16" textAnchor="middle" dominantBaseline="central" fontFamily="var(--display, serif)" fontWeight="700" fontSize={kl <= 2 ? 9.500 : kl === 3 ? 8 : 6.500} fill="#fff8e4" letterSpacing="0.2">
        {kurz}
      </text>
    </>
  );
}

// ---------------------------------------------------------------------------
// Das Wappen der eigenen Partei: Schild in der Parteifarbe, darin die Linie als Fünfeck über die fünf Achsen

const WINKEL = ACHSEN_IDS.map((_, i) => (-90 + i * 72) * (Math.PI / 180));
const punkt = (i: number, r: number): [number, number] => [50 + Math.cos(WINKEL[i]!) * r, 56 + Math.sin(WINKEL[i]!) * r];
const pfad = (rs: number[]): string => rs.map((r, i) => punkt(i, r).map((v) => Math.round(v * 10) / 10).join(" ")).join(" L");

export interface ParteiwappenProps {
  kurz: string;
  farbe: string;
  achsen: Achsen;
  size?: number;
  className?: string;
}

/** Schild mit der Linie: Je weiter eine Ecke außen liegt, desto weiter rechts steht die Partei auf dieser Achse (Wirtschaft: Markt, Gesellschaft: autoritär …). */
export function Parteiwappen({ kurz, farbe, achsen, size = 150, className }: ParteiwappenProps) {
  const werte = ACHSEN_IDS.map((k) => 10 + ((achsen[k] + 100) / 200) * 30);
  return (
    <svg className={`parteiwappen${className ? ` ${className}` : ""}`} viewBox="0 0 100 120" width={size} height={(size * 120) / 100} style={{ ["--wa" as string]: farbe }} role="img" aria-label={kurz}>
      <path d="M8 8h84v52c0 30-26 49-42 55C34 109 8 90 8 60z" fill={farbe} stroke="#2a1f18" strokeWidth="2.200" strokeLinejoin="round" />
      <path d="M13 13h74v47c0 26-22 42-37 48-15-6-37-22-37-48z" fill="none" stroke="#fff6dc" strokeOpacity="0.55" strokeWidth="0.9" />
      <g fill="none" stroke="#fff6dc" strokeOpacity="0.5" strokeWidth="0.7">
        <path d={`M${pfad([40, 40, 40, 40, 40])} Z`} />
        <path d={`M${pfad([25, 25, 25, 25, 25])} Z`} />
        {WINKEL.map((_, i) => (
          <path key={i} d={`M50 56L${punkt(i, 40).join(" ")}`} />
        ))}
      </g>
      <path className="pw-linie" d={`M${pfad(werte)} Z`} fill="#fff6dc" fillOpacity="0.82" stroke="#2a1f18" strokeWidth="1.500" strokeLinejoin="round" />
      {werte.map((r, i) => (
        <circle key={i} className="pw-punkt" cx={punkt(i, r)[0]} cy={punkt(i, r)[1]} r="2" fill="#2a1f18" />
      ))}
      <path d="M2 20h96l-8 14H10z" fill="#f6ecd0" stroke="#2a1f18" strokeWidth="1.600" strokeLinejoin="round" />
      <text x="50" y="27.500" textAnchor="middle" dominantBaseline="central" fontFamily="var(--display, serif)" fontWeight="700" fontSize={kurz.length <= 3 ? 12 : kurz.length === 4 ? 10 : 8.500} fill="#2a1f18" letterSpacing="0.6">
        {kurz}
      </text>
    </svg>
  );
}
