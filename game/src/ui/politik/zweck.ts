// Wozu dient welche Akte? Ein Satz unter dem Titel jedes Fensters, damit man den Unterschied zwischen den Ansichten versteht
// (ENTSCHEIDUNGEN.md, „Aufbau der Ansichten“). Schlüssel: der Kurzname im Menü und die Kennung des Reiters.

export const AKTEN_ZWECK: Record<string, string> = {
  Schreibtisch: "Das Tagesgeschäft: was heute fällig ist, wovor das Spiel warnt und was Ihr Stab rät.",
  Gespräch: "Freie Sprache: Sie fragen, das Spiel erklärt und schlägt Schritte vor, die Sie bestätigen.",
  Politik: "Was Sie im Land ändern: Maßnahmen nach Bereichen, Vorhaben mit Zielen und der Stand der Umsetzung.",
  Wähler: "Wer Sie trägt und wer nicht: elf Gruppen mit Stimmung, Gründen und Forderungen.",
  Welt: "Die übrigen Länder: Beziehung, Anliegen und Verhandlungen.",
  Reich: "Was Sie bauen und im Bestand halten: Großprojekte, Wunder, Erbe, Justiz, Streitkräfte und Verwaltung.",
  Parlament: "Wo Gesetze Mehrheiten brauchen: Fraktionen, Gespräche, Bündnisse und Abstimmungen.",
  Wirtschaft: "Die Zahlen des Landes und die großen Hebel: Zentralbank und Haushalt.",
  Personen: "Wer mit Ihnen regiert: Kabinett, Partner, Zusagen und ihre Fristen.",
  Chronik: "Das Gedächtnis der Amtszeit: Beschlüsse, Ereignisse, Umfragen und Wirkungsberichte.",
};

/** Reiter, die etwas Eigenes zu sagen haben (sonst gilt der Satz der Akte). */
export const TAB_ZWECK: Record<string, string> = {
  politik: "Politik nach Bereichen: Wählen Sie einen Bereich, dann sehen Sie Lage, akute Probleme und jede Maßnahme, die Sie dort ergreifen können.",
  bereiche: "Was heute den größten Hebel hat: Vorhaben, die das Spiel aus Ihren akuten Problemen berechnet.",
  programme: "Regierungsprogramme: Ziele über mehrere Schritte, und jeder Schritt verlangt echte Politik.",
  beschluesse: "Was beschlossen ist und gerade umgesetzt wird: Zeitplan, Kosten und Beschlussbuch.",
  netz: "Der ganze Wirkungszusammenhang: jede Größe, jedes Problem und ihre Verbindungen, mit Suche.",
};

export function zweckVon(dossier: string | null, kurz: string | undefined): string | undefined {
  return (dossier ? TAB_ZWECK[dossier] : undefined) ?? (kurz ? AKTEN_ZWECK[kurz] : undefined);
}
