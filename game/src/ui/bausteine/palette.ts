// Farben für Diagramme ohne Wertung (befund-H H-09, H-10; Gestaltungsleitfaden §5). Dieselben Werte stehen als --daten-1 … --daten-8
// in styles.css; SVG-Attribute und Inline-Stile brauchen sie als Hexwerte. Erdpalette statt Tabellenfarben: kein Türkis, kein
// Violett, kein Signalgrün, damit Rad und Leisten zur Ledermappe passen und „gut“ (Lorbeer) und „schlecht“ (Siegel) Signale bleiben.

/** Acht Erdtöne in der Reihenfolge, in der Nachbarn sich gut unterscheiden (hell und dunkel im Wechsel). */
export const DATEN_FARBEN = [
  "#8e2a22", // Siegelrot
  "#b8893a", // Ocker
  "#4a5a6a", // Schiefer
  "#b0704a", // Terrakotta
  "#6b4a6a", // Pflaume
  "#6f7a3a", // Oliv
  "#cdb48a", // Sand
  "#5a4a38", // Tinte
] as const;

/** Ein Ton in acht Stufen (Messing, dunkel nach hell): für Reihenfolgen wie die Bauleiste, wo die Farbe nur den Rang zeigt. */
export const MESSING_STUFEN = ["#6e4b1c", "#7c5823", "#8f6a2e", "#a37c3c", "#b8893a", "#c69a4a", "#d4ad62", "#e2c587"] as const;
