// Gezeichnete Symbole im Tintenstil: runde Linienenden, leicht unregelmäßig.

export type IconName =
  | "berg"
  | "urne"
  | "fabrik"
  | "koffer"
  | "warnung"
  | "preis"
  | "lira"
  | "bank"
  | "parlament"
  | "haende"
  | "tempel"
  | "kuppel"
  | "kran"
  | "feder"
  | "netz"
  | "siegel"
  | "akte"
  | "sprechblase"
  | "person"
  | "ziel"
  | "buch"
  | "muenze"
  | "waage"
  | "strasse"
  | "krankenhaus"
  | "tropfen"
  | "haus"
  | "menge";

const PATHS: Record<IconName, string> = {
  berg: "M3 20 L9.5 8 L13 14 L15.5 10.5 L21 20 Z M8 10.8 L9.5 8 L11 10.6",
  urne: "M5 11 H19 V20 H5 Z M8 11 V6.5 L13.5 5 L15 10.8 M9 15 H15",
  fabrik: "M3 20 V11 L8 14 V11 L13 14 V6 H16 V14 H21 V20 Z M6.5 17 H8.5 M11.5 17 H13.5 M16.5 17 H18.5",
  koffer: "M4 9 H20 V19 H4 Z M9 9 V6.5 H15 V9 M4 13.5 H20",
  warnung: "M12 4 L21 19.5 H3 Z M12 10 V14.5 M12 17 V17.2",
  preis: "M4 13 L11.5 5.5 H19 V13 L11.5 20.5 Z M15.3 9.2 A0.9 0.9 0 1 0 15.31 9.2",
  lira: "M9 4 V19 C13 19 17 17 17 12.5 M6 11 L13 8.5 M6 14.5 L13 12",
  bank: "M3.5 9 L12 4 L20.5 9 Z M5.5 9.5 V17 M9.5 9.5 V17 M14.5 9.5 V17 M18.5 9.5 V17 M3.5 19.5 H20.5",
  parlament: "M4 19 H20 M5 19 V13 A7 6 0 0 1 19 13 V19 M9 19 V14 M12 19 V13 M15 19 V14 M12 7 V4.5",
  feder: "M19 4 C12 5 7 10 6 18 L5 20 M6 18 C10 17 14 14 16 10 M9.5 14.5 L13 11 M19 4 C19 8 17 12 13.5 14.5",
  netz: "M6 6 L12 10 L18 6 M12 10 V16 M6 6 L6 16 L12 16 L18 16 L18 6 M6 16 L12 10 M18 16 L12 10 M4.5 6 A1.5 1.5 0 1 0 7.5 6 A1.5 1.5 0 1 0 4.5 6 M16.5 6 A1.5 1.5 0 1 0 19.5 6 A1.5 1.5 0 1 0 16.5 6 M10.5 10 A1.5 1.5 0 1 0 13.5 10 A1.5 1.5 0 1 0 10.5 10",
  siegel: "M12 3.5 A5.5 5.5 0 1 0 12.01 3.5 M12 14.5 L8 20.5 L10.5 19.8 L11.5 22 M12 14.5 L16 20.5 L13.5 19.8 L12.5 22 M12 6.5 L13 8.6 L15.3 8.8 L13.6 10.3 L14.1 12.5 L12 11.3 L9.9 12.5 L10.4 10.3 L8.7 8.8 L11 8.6 Z",
  akte: "M4 6 H10 L12 8 H20 V19 H4 Z M4 11 H20 M8 14.5 H16",
  sprechblase: "M4 5 H20 V15 H12 L7 19.5 V15 H4 Z M8 9 H16 M8 12 H13",
  menge: "M12 7.5 A2.8 2.8 0 1 0 12.01 7.5 M7 9.5 A2.2 2.2 0 1 0 7.01 9.5 M17 9.5 A2.2 2.2 0 1 0 17.01 9.5 M8 20 C8.3 16 9.6 14.6 12 14.6 C14.4 14.6 15.7 16 16 20 M3.5 18.5 C3.8 15.5 5 14.4 7 14.4 M20.5 18.5 C20.2 15.5 19 14.4 17 14.4",
  person: "M12 8 A3.6 3.6 0 1 0 12.01 8 M4.5 20 C5 15.5 8 14 12 14 C16 14 19 15.5 19.5 20",
  ziel: "M12 3.5 A8.5 8.5 0 1 0 12.01 3.5 M12 7.5 A4.5 4.5 0 1 0 12.01 7.5 M12 11.6 A0.6 0.6 0 1 0 12.01 11.6",
  buch: "M4.5 5 C8 4 10.5 4.5 12 6 C13.5 4.5 16 4 19.5 5 V18.5 C16 17.5 13.5 18 12 19.5 C10.5 18 8 17.5 4.5 18.5 Z M12 6 V19.5",
  muenze: "M12 4 A8 8 0 1 0 12.01 4 M12 8 V16 M9.5 10 C9.5 8.2 14.5 8.2 14.5 10 C14.5 12 9.5 12 9.5 14 C9.5 15.8 14.5 15.8 14.5 14",
  waage: "M12 4 V19 M6 19 H18 M5 8 H19 M5 8 L2.8 14 H7.2 Z M19 8 L16.8 14 H21.2 Z",
  strasse: "M9 4 L5.5 20 M15 4 L18.5 20 M12 5 V8 M12 11 V14 M12 17 V19",
  krankenhaus: "M5 20 V8 H19 V20 Z M12 10.5 V16.5 M9 13.5 H15 M10 8 V5 H14 V8",
  tropfen: "M12 4 C8 9 6.5 12 6.5 14.5 A5.5 5.5 0 0 0 17.5 14.5 C17.5 12 16 9 12 4 Z",
  haus: "M4 11 L12 4.5 L20 11 M6 10 V20 H18 V10 M10 20 V14 H14 V20",
  tempel: "M3.5 9.5 L12 4.5 L20.5 9.5 Z M5.5 10.5 V17.5 M9.5 10.5 V17.5 M14.5 10.5 V17.5 M18.5 10.5 V17.5 M3.5 19.5 H20.5 M4.5 17.8 H19.5",
  kuppel: "M4.5 19.5 V13 A7.5 7.5 0 0 1 19.5 13 V19.5 M2.8 19.5 H21.2 M12 5.5 V3 M10.8 3.6 H13.2 M9.5 19.5 V15.5 A2.5 2.5 0 0 1 14.5 15.5 V19.5",
  kran: "M6 20 V6 L18 4 M6 6 L14 5 M18 4 V9 M17 9 H19 V12 H17 Z M4 20 H10",
  haende: "M3 13 L7 9 L10.5 10.5 L14 8.5 L21 13 M7 9 L3.5 5.5 M17 10.5 L20.5 7 M9 14 L11.5 16.5 M11.5 13 L14 15.5 M14 11.5 L16.5 14",
};

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
