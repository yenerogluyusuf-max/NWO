// Embleme der Politik-Akten: gezeichnete Symbole im Tintenstil von ui/icons.tsx (24 × 24, runde Linienenden),
// eines je Themenbereich und je Regierungsprogramm. Die Medaille fasst das Symbol in Leder und Messing.

import type { ReactNode } from "react";

export type EmblemName =
  // Themenbereiche der Politik
  | "wirtschaft"
  | "haushalt"
  | "arbeit"
  | "gesundheit"
  | "bildung"
  | "wohnen"
  | "energie"
  | "landwirtschaft"
  | "infrastruktur"
  | "sicherheit"
  | "recht"
  | "militaer"
  | "kultur"
  | "gesellschaft"
  | "aussen"
  // Regierungsprogramme
  | "wiederaufbau"
  | "preise"
  | "regionen"
  | "wasser"
  | "frieden"
  | "welt";

const PFADE: Record<EmblemName, string> = {
  wirtschaft: "M4 20 H20 M6.5 20 V13 M11 20 V8 M15.5 20 V11.5 M20 20 V5 M17.5 7.5 L20 5 L22 7",
  haushalt: "M12 4 A8 8 0 1 0 12.01 4 M12 7.5 V16.5 M9.4 10 C9.4 8 14.6 8 14.6 10 C14.6 12.2 9.4 12 9.4 14.2 C9.4 16.4 14.6 16.4 14.6 14.2",
  arbeit: "M4 9 H20 V19 H4 Z M9 9 V6.5 H15 V9 M4 13.5 H20 M11 13.5 V15.5 H13 V13.5",
  gesundheit: "M12 3.5 A8.5 8.5 0 1 0 12.01 3.5 M12 7.8 V16.2 M7.8 12 H16.2",
  bildung: "M2.5 9 L12 4.5 L21.5 9 L12 13.5 Z M6.5 11 V15.5 C8.5 17.8 15.5 17.8 17.5 15.5 V11 M21.5 9 V14.5",
  wohnen: "M3.8 11 L12 4.2 L20.2 11 M6 9.6 V20 H18 V9.6 M10 20 V14 H14 V20",
  energie: "M13.2 3 L5.6 13.4 H11 L10 21 L18.4 9.6 H13 Z",
  landwirtschaft: "M12 21 V8.5 M12 8.5 C9.6 8 8.6 6 9 4 C11 4.4 12 6 12 8.5 M12 8.5 C14.4 8 15.4 6 15 4 C13 4.4 12 6 12 8.5 M12 13.5 C9.6 13 8.6 11 9 9 M12 13.5 C14.4 13 15.4 11 15 9 M12 18.5 C9.6 18 8.6 16 9 14 M12 18.5 C14.4 18 15.4 16 15 14",
  infrastruktur: "M3 17.5 H21 M5 17.5 V12.5 M19 17.5 V12.5 M5 12.5 C8 6.5 16 6.5 19 12.5 M9 17.5 V9 M12 17.5 V7.8 M15 17.5 V9",
  sicherheit: "M12 3.5 L19 6 V12 C19 16.4 15.8 19.6 12 20.8 C8.2 19.6 5 16.4 5 12 V6 Z M9 12 L11.2 14.3 L15.3 9.8",
  recht: "M12 4 V19 M6 19 H18 M5 8 H19 M5 8 L2.8 14 H7.2 Z M19 8 L16.8 14 H21.2 Z",
  militaer: "M12 3 L14.4 9 L21 9.6 L16 13.8 L17.6 20.2 L12 16.8 L6.4 20.2 L8 13.8 L3 9.6 L9.6 9 Z",
  kultur: "M3.5 9 L12 4 L20.5 9 Z M5.5 9.8 V17 M9.5 9.8 V17 M14.5 9.8 V17 M18.5 9.8 V17 M3.5 19.5 H20.5",
  gesellschaft: "M12 7.5 A2.8 2.8 0 1 0 12.01 7.5 M7 9.5 A2.2 2.2 0 1 0 7.01 9.5 M17 9.5 A2.2 2.2 0 1 0 17.01 9.5 M8 20 C8.3 16 9.6 14.6 12 14.6 C14.4 14.6 15.7 16 16 20 M3.5 18.5 C3.8 15.5 5 14.4 7 14.4 M20.5 18.5 C20.2 15.5 19 14.4 17 14.4",
  aussen: "M12 3.5 A8.5 8.5 0 1 0 12.01 3.5 M3.6 12 H20.4 M12 3.5 C8.8 7.2 8.8 16.8 12 20.5 M12 3.5 C15.2 7.2 15.2 16.8 12 20.5",
  wiederaufbau: "M4 11.5 L12 4.5 L20 11.5 M6 10 V20 H18 V10 M12.2 10 L10.4 13.2 L13.2 15.2 L11.2 20",
  preise: "M9 4 V19 C13 19 17 17 17 12.5 M6 11 L13 8.5 M6 14.5 L13 12",
  regionen: "M9 4 L5.5 20 M15 4 L18.5 20 M12 5 V8 M12 11 V14 M12 17 V19",
  wasser: "M12 3.8 C8 9 6.5 12 6.5 14.6 A5.5 5.5 0 0 0 17.5 14.6 C17.5 12 16 9 12 3.8 Z M9.6 15 C9.8 16.4 10.8 17.2 12 17.4",
  frieden: "M5 15 C5 11 8 9.5 10.5 9.5 L13 9.5 C15.2 9.5 16 10.8 16 12 C16 13.2 15 14 14 14 H11.5 M10 17.5 L14 20 L19.5 14.5 L16 11 M5 15 L8.5 19 M3.5 13 L6.5 16.5",
  welt: "M12 3.5 A8.5 8.5 0 1 0 12.01 3.5 M3.6 12 H20.4 M12 3.5 C8.8 7.2 8.8 16.8 12 20.5 M12 3.5 C15.2 7.2 15.2 16.8 12 20.5",
};

/** Alle Embleme (für Prüfungen) */
export const EMBLEM_NAMEN = Object.keys(PFADE) as EmblemName[];

/** Das gezeichnete Symbol allein (erbt die Farbe vom Text). */
export function Emblem({ name, size = 22 }: { name: EmblemName; size?: number }) {
  return (
    <svg className="pd-emblem" width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d={PFADE[name]} fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Das Symbol in einer Medaille aus Leder und Messing. */
export function Medaille({ name, groesse = "mittel", children }: { name: EmblemName; groesse?: "klein" | "mittel" | "gross"; children?: ReactNode }) {
  const px = groesse === "klein" ? 17 : groesse === "gross" ? 32 : 24;
  return (
    <span className={`pd-medaille ${groesse}`} aria-hidden>
      <Emblem name={name} size={px} />
      {children}
    </span>
  );
}

/** Welches Emblem zu welchem Themenbereich gehört. */
export function embleme(theme: string): EmblemName {
  return (theme in PFADE ? theme : "gesellschaft") as EmblemName;
}
