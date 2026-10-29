// Gezeichnete Symbole des Wissensbaums: einfache Strichzeichnungen im 24er-Raster (Strich in currentColor), je Knoten oder Art.
// Kein Emoji, keine Schriftzeichen: jedes Symbol ist ein kleiner Pfadsatz.

import type { ReactNode } from "react";
import type { ZweigId } from "../../data/wissensbaum";

const P = (d: string) => <path d={d} />;

const SYMBOLE: Record<string, ReactNode> = {
  chip: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <rect x="10" y="10" width="4" height="4" />
      {P("M9.5 7V4M14.5 7V4M9.5 20v-3M14.5 20v-3M7 9.5H4M7 14.5H4M20 9.5h-3M20 14.5h-3")}
    </>
  ),
  netz: (
    <>
      <circle cx="6" cy="7" r="2" />
      <circle cx="18" cy="7" r="2" />
      <circle cx="12" cy="17" r="2.2" />
      <circle cx="12" cy="9.5" r="1.4" />
      {P("M7.8 7.6l2.9 1.4M16.2 7.6l-2.9 1.4M12 11v3.8M7.2 8.8l3.6 6.6M16.8 8.8l-3.6 6.6")}
    </>
  ),
  server: (
    <>
      <rect x="5" y="4" width="14" height="5" rx="1" />
      <rect x="5" y="10" width="14" height="5" rx="1" />
      <rect x="5" y="16" width="14" height="4" rx="1" />
      {P("M8 6.5h.01M8 12.5h.01M8 18h.01M12 6.5h4M12 12.5h4")}
    </>
  ),
  atom: (
    <>
      <circle cx="12" cy="12" r="1.6" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" />
    </>
  ),
  sprache: (
    <>
      {P("M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 12.5z")}
      {P("M8 9.5h8M8 12h5")}
    </>
  ),
  linse: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3.5" />
      {P("M12 2v3M12 19v3M2 12h3M19 12h3")}
    </>
  ),
  gehirn: (
    <>
      {P("M12 5.5c-1-1.6-3.6-1.9-5-.4-1.3 1.3-1.2 3-.6 3.9-1.8.7-2.4 2.8-1.4 4.3-.9 1.6-.1 3.6 1.7 4 .5 1.7 2.6 2.4 4 1.6.6.5 1 .6 1.3.6")}
      {P("M12 5.5c1-1.6 3.6-1.9 5-.4 1.3 1.3 1.2 3 .6 3.9 1.8.7 2.4 2.8 1.4 4.3.9 1.6.1 3.6-1.7 4-.5 1.7-2.6 2.4-4 1.6-.6.5-1 .6-1.3.6")}
      {P("M12 5.5v14M9 9.5c1 .3 1.8 1 2 2M15 13.5c-1-.2-2 .3-2.5 1")}
    </>
  ),
  batterie: (
    <>
      <rect x="4" y="7.5" width="14.5" height="9" rx="1.5" />
      {P("M20.5 10.5v3M7 10.5v3M10 10.5v3M13 10.5v3")}
    </>
  ),
  sonne: (
    <>
      <circle cx="12" cy="12" r="4" />
      {P("M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8")}
    </>
  ),
  wind: (
    <>
      {P("M12 11v10M9.5 21h5")}
      <circle cx="12" cy="9.5" r="1.3" />
      {P("M12 8.2c-.4-2.6.1-4.8 1.4-6 .7 2 .3 4-1.4 6zM13.2 10.2c2.4.9 4 2.5 4.4 4.2-2.1-.1-3.7-1.4-4.4-4.2zM10.8 10.2c-2 1.7-4.2 2.4-5.9 2 1.1-1.8 3.1-2.6 5.9-2z")}
    </>
  ),
  wasserstoff: (
    <>
      {P("M12 3c3.5 4.2 5.5 7.3 5.5 10a5.5 5.5 0 0 1-11 0C6.5 10.3 8.5 7.2 12 3z")}
      {P("M10 11.5v5M14 11.5v5M10 14h4")}
    </>
  ),
  reaktor: (
    <>
      {P("M6 20c1.2-3.5 1.2-8.5 0-13h6c-1.2 4.5-1.2 9.5 0 13zM13.5 20c1-2.8 1-6.2 0-9h4.5c-1 2.8-1 6.2 0 9z")}
      {P("M3.5 20h17M8 4.5c.6-.8 1.6-1 2.4-.4M15 8.5c.5-.7 1.4-.9 2.1-.4")}
    </>
  ),
  kreislauf: (
    <>
      {P("M18.5 9A7 7 0 0 0 6 7.5M5.5 15a7 7 0 0 0 12.5 1.5")}
      {P("M6 3.5v4h4M18 20.5v-4h-4")}
      <circle cx="12" cy="12" r="1.8" />
    </>
  ),
  triebwerk: (
    <>
      <ellipse cx="7" cy="12" rx="3" ry="6.5" />
      {P("M7 5.5h9l4 3.5v6l-4 3.5H7")}
      {P("M7 9l-1.5 3L7 15M7 12h12")}
    </>
  ),
  stern: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      {P("M12 6.5l1.5 3.6 3.9.3-3 2.5.9 3.8L12 14.7l-3.3 2 .9-3.8-3-2.5 3.9-.3z")}
    </>
  ),
  satellit: (
    <>
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.8" transform="rotate(45 12 12)" />
      {P("M8.2 8.2L4.5 4.5M3 7.5l4.5-4.5M15.8 15.8l3.7 3.7M16.5 21l4.5-4.5")}
      {P("M15 6.5a3.5 3.5 0 0 1 2.5 2.5M15.5 3.5a6.5 6.5 0 0 1 5 5")}
    </>
  ),
  flugzeug: P("M21 15.5l-7.5-4V6a1.5 1.5 0 0 0-3 0v5.5L3 15.5v2l7.5-2v3.7L8.5 20.5v1.5L12 21l3.5 1v-1.5l-2-1.3v-3.7l7.5 2z"),
  rotor: (
    <>
      <rect x="9" y="11" width="6" height="4" rx="1.5" />
      {P("M12 11V8M5 8h14M9 15l-1.5 3M15 15l1.5 3M6.5 18h11")}
    </>
  ),
  rakete: (
    <>
      {P("M12 2.5c3 2.4 4.3 6 4 10.5l-1.6 3.5H9.6L8 13c-.3-4.5 1-8.1 4-10.5z")}
      <circle cx="12" cy="9" r="1.6" />
      {P("M8.3 13.5L5.5 16v3l3.6-2M15.7 13.5l2.8 2.5v3l-3.6-2M10.5 18.5L12 21.5l1.5-3")}
    </>
  ),
  mond: P("M15.5 3.5a8.5 8.5 0 1 0 5 13.5 7 7 0 0 1-5-13.5z"),
  orbit: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(-20 12 12)" />
      <circle cx="19.6" cy="8.6" r="1.2" />
    </>
  ),
  planet: (
    <>
      <circle cx="12" cy="12" r="6" />
      {P("M2.5 15.5c2.5 1.6 8.8.6 14-2.4s8.2-6.3 5.6-7.4M9 9.5h.01M14 14.5h.01M13.5 8.5h.01")}
    </>
  ),
  aufzug: (
    <>
      {P("M12 2v20M9.5 22h5")}
      <rect x="9.5" y="8" width="5" height="5" rx="1" />
      <circle cx="12" cy="3.5" r="1.5" />
    </>
  ),
  drohne: (
    <>
      {P("M12 9.5l-7 2.5v1.5l7-1 7 1V12z")}
      {P("M12 6v12M9.5 18.5h5M12 6l-1 3M12 6l1 3")}
    </>
  ),
  jet: P("M12 2.5l1.6 6 6.9 4.5v2l-6.9-2.2-.5 4.7 2.4 1.8v1.5L12 20l-3.5.8v-1.5l2.4-1.8-.5-4.7-6.9 2.2v-2l6.9-4.5z"),
  panzer: (
    <>
      <rect x="3.5" y="13" width="17" height="5" rx="2.5" />
      {P("M6.5 13l1.5-3.5h7l1.5 3.5M12 9.5V8h9")}
      <circle cx="7.5" cy="15.5" r="1" />
      <circle cx="12" cy="15.5" r="1" />
      <circle cx="16.5" cy="15.5" r="1" />
    </>
  ),
  schild: (
    <>
      {P("M12 3l7.5 3v5.5c0 4.6-3.2 8-7.5 9.5-4.3-1.5-7.5-4.9-7.5-9.5V6z")}
      {P("M8 12.5a4 4 0 0 1 8 0")}
    </>
  ),
  ziel: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3" />
      {P("M12 2v4M12 18v4M2 12h4M18 12h4")}
    </>
  ),
  schiff: (
    <>
      {P("M3 15h18l-2.5 4.5H5.5z")}
      {P("M6 15v-3h9v3M8.5 12V9h4v3M10.5 9V5.5M10.5 6.5h3")}
    </>
  ),
  uboot: (
    <>
      {P("M3 14.5c0-2 2-3.5 4.5-3.5h9c2.5 0 4.5 1.5 4.5 3.5s-2 3.5-4.5 3.5h-9C5 18 3 16.5 3 14.5z")}
      {P("M10 11V7.5h3.5V11M12 7.5V5.5h2")}
    </>
  ),
  welle: (
    <>
      {P("M2.5 9c1.6-1.4 3.2-1.4 4.8 0s3.2 1.4 4.8 0 3.2-1.4 4.8 0 3.2 1.4 4.8 0")}
      {P("M2.5 14c1.6-1.4 3.2-1.4 4.8 0s3.2 1.4 4.8 0 3.2-1.4 4.8 0 3.2 1.4 4.8 0")}
      {P("M2.5 19c1.6-1.4 3.2-1.4 4.8 0s3.2 1.4 4.8 0 3.2-1.4 4.8 0 3.2 1.4 4.8 0")}
    </>
  ),
  dna: (
    <>
      {P("M7 3c0 4.5 10 4.5 10 9s-10 4.5-10 9M17 3c0 4.5-10 4.5-10 9s10 4.5 10 9")}
      {P("M8.5 6h7M8.5 18h7M10 9.5h4M10 14.5h4")}
    </>
  ),
  spritze: (
    <>
      {P("M14.5 3.5l6 6M17.5 6.5L8 16l-2.5.5L5 19l-2 2M18.5 7.5l-2-2M12 9l1.5 1.5M10 11l1.5 1.5")}
      {P("M8 16l-.5-3 7-7 3 3-7 7z")}
    </>
  ),
  spross: (
    <>
      {P("M12 21v-9")}
      {P("M12 12c0-4 2.5-6.5 7-6.5 0 4.5-2.8 6.5-7 6.5zM12 14.5c0-3-2-5-5.5-5 0 3.4 2.2 5 5.5 5z")}
      {P("M7.5 21h9")}
    </>
  ),
  puls: (
    <>
      {P("M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z")}
      {P("M5.5 12.5h3.5l1.5-2.5 2 4.5 1.5-2h4.5")}
    </>
  ),
  waben: (
    <>
      {P("M12 3l4 2.3v4.6l-4 2.3-4-2.3V5.3z")}
      {P("M8 12.2l4 2.3v4.6l-4 2.3-4-2.3v-4.6zM16 12.2l4 2.3v4.6l-4 2.3-4-2.3v-4.6z")}
    </>
  ),
  roboter: (
    <>
      {P("M5 20h8M9 20v-3.5")}
      <circle cx="9" cy="15" r="1.6" />
      {P("M10.2 13.8l3.6-5.4M14.6 8.6l3.4 1.4M18 10l1.5 2.5M18 10l2.2-1")}
      <circle cx="14.2" cy="7.8" r="1.3" />
    </>
  ),
  anker: (
    <>
      <circle cx="12" cy="5" r="2" />
      {P("M12 7v14M8 10.5h8M4.5 13.5c0 4.2 3.4 7.5 7.5 7.5s7.5-3.3 7.5-7.5M4.5 13.5l-1.5 1.5M19.5 13.5l1.5 1.5")}
    </>
  ),
  bohrturm: (
    <>
      {P("M9 21L12 3l3 18M10.2 14h3.6M10.8 10h2.4M9.5 18h5")}
      {P("M3 21h18M15.5 21v-3h4v3")}
    </>
  ),
  hacke: (
    <>
      {P("M4.5 9.5C7.5 5.5 13 4 18.5 5.5c-4-1.5-9.5 0-14 4z")}
      {P("M12.5 6.5L20 20.5")}
    </>
  ),
  // Freischalt-Symbole
  werk: (
    <>
      {P("M3 20.5V11l5 3V11l5 3V11l5 3V4.5h3v16z")}
      {P("M6.5 17.5h2M11.5 17.5h2M16.5 17.5h2")}
    </>
  ),
  ware: (
    <>
      {P("M12 3l8 4v10l-8 4-8-4V7z")}
      {P("M4 7l8 4 8-4M12 11v10")}
    </>
  ),
  gattung: (
    <>
      {P("M12 3l7.5 3v5.5c0 4.6-3.2 8-7.5 9.5-4.3-1.5-7.5-4.9-7.5-9.5V6z")}
      {P("M12 7.5l1.2 2.8 3 .2-2.3 2 .7 3L12 14l-2.6 1.5.7-3-2.3-2 3-.2z")}
    </>
  ),
  weiter: P("M4 12h13M13 7l5 5-5 5"),
  heureka: P("M13 2.5L5 13.5h6l-1 8 8-11h-6z"),
};

/** Symbol je Knoten (Kennung des Vorhabens). */
const VON_KNOTEN: Record<string, string> = {
  chips_design: "chip", ki_strategie: "netz", ki_rechenzentren: "server", quanten_zentrum: "atom", ki_sprachmodell: "sprache",
  ki_chipfab: "chip", quanten_computer: "atom", chips_euv: "linse", ki_agi: "gehirn",
  batt_zellfabrik: "batterie", energie_fusion_forschung: "sonne", meer_offshore_wind: "wind", h2_elektrolyse: "wasserstoff",
  energie_smr: "reaktor", energie_brennstoffkreislauf: "kreislauf", energie_fusion_testreaktor: "sonne", energie_fusion_kraftwerk: "sonne",
  luft_triebwerke: "triebwerk", raum_agentur: "stern", raum_satelliten: "satellit", luft_regionalflugzeug: "flugzeug", luft_flugtaxi: "rotor",
  raum_bahnhof: "rakete", raum_traeger: "rakete", raum_mondsonde: "mond", raum_orbit_bemannt: "orbit", raum_mondbasis: "mond",
  raum_mars: "planet", raum_aufzug: "aufzug",
  mil_drohnen: "drohne", mil_huerjet: "jet", mil_altay: "panzer", mil_kaan_motor: "triebwerk", mil_stahlkuppel: "schild",
  ki_militaer: "ziel", meer_uwdrohnen: "welle", mil_kaan: "jet", mil_tf2000: "schiff", meer_uboote: "uboot",
  bio_genomik: "dna", bio_impfstoffwerk: "spritze", bio_saatgut: "spross", bio_medizintechnik: "puls", bio_gentherapie: "dna",
  nano_zentrum: "waben", robotik_offensive: "roboter", meer_institut: "welle", meer_hafenautomatisierung: "anker",
  meer_tiefsee_gas: "bohrturm", meer_tiefseebergbau: "hacke",
};

const VON_ZWEIG: Record<ZweigId, string> = { digital: "chip", energie: "sonne", luftraum: "rakete", ruestung: "schild", bio: "dna", werkstoff: "waben" };

/** Ein Symbol im 24er-Raster. */
export function Symbol({ name, gross = 24, klasse }: { name: string; gross?: number; klasse?: string }) {
  return (
    <svg className={klasse} width={gross} height={gross} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      {SYMBOLE[name] ?? SYMBOLE.stern}
    </svg>
  );
}

export const knotenSymbol = (id: string, zweig: ZweigId): string => VON_KNOTEN[id] ?? VON_ZWEIG[zweig];
export const zweigSymbol = (zweig: ZweigId): string => VON_ZWEIG[zweig];
