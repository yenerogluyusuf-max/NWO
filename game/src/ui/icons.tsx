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
  | "feder"
  | "netz"
  | "siegel"
  | "akte";

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
  haende: "M3 13 L7 9 L10.5 10.5 L14 8.5 L21 13 M7 9 L3.5 5.5 M17 10.5 L20.5 7 M9 14 L11.5 16.5 M11.5 13 L14 15.5 M14 11.5 L16.5 14",
};

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
