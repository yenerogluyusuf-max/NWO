// Wozu dient welche Akte? Ein Satz unter dem Titel jedes Fensters, damit man den Unterschied zwischen den Ansichten versteht
// (ENTSCHEIDUNGEN.md, „Aufbau der Ansichten“). Jeder Reiter hat seinen eigenen Satz (Schlüssel: die Kennung des Reiters);
// der Satz der Gruppe (Kurzname im Menü) gilt nur, wenn ein Reiter keinen eigenen hat.

export const AKTEN_ZWECK: Record<string, string> = {
  Kanzlei: "Ihr Amtssitz: Tagesgeschäft, Presse, Berater, Team und Spielstand.",
  Politik: "Was Sie im Land ändern: Maßnahmen nach Bereichen, Vorhaben mit Zielen und der Stand der Umsetzung.",
  Parlament: "Wo Gesetze Mehrheiten brauchen: Fraktionen, Verfassung und Justiz.",
  Wähler: "Wer Sie trägt und wer nicht: elf Gruppen mit Stimmung, Gründen und Forderungen.",
  Wirtschaft: "Die Zahlen des Landes, die großen Hebel Zentralbank und Haushalt, und die Verwaltung.",
  Reich: "Was Sie bauen und im Bestand halten: Großprojekte, Wunder, Erbe und Streitkräfte.",
  Krisen: "Wenn die Erde bebt oder das Wasser steigt: Lage, Nothilfe und Wiederaufbau.",
  Welt: "Die übrigen Länder: Beziehung, Anliegen und Verhandlungen.",
};

/** Der Satz zum einzelnen Reiter. */
export const TAB_ZWECK: Record<string, string> = {
  schreibtisch: "Das Tagesgeschäft: was heute fällig ist, wovor das Spiel warnt und was Ihr Stab rät.",
  zeitung: "Das Land in Schlagzeilen: dieselbe Wirklichkeit in verschiedenen Framings — und die Umfrage des Monats.",
  gespraech: "Freie Sprache: Sie fragen, das Spiel erklärt und schlägt Schritte vor, die Sie bestätigen.",
  personen: "Wer mit Ihnen regiert: Kabinett, Partner, Zusagen und ihre Fristen.",
  chronik: "Das Gedächtnis der Amtszeit: Beschlüsse, Ereignisse und Umfragen.",
  speicher: "Ihr Spielstand: sichern, in Plätzen ablegen, als Datei exportieren oder aus einer Datei wiederherstellen.",
  politik: "Politik nach Bereichen: Wählen Sie einen Bereich, dann sehen Sie Lage, akute Probleme und jede Maßnahme, die Sie dort ergreifen können.",
  bereiche: "Was heute den größten Hebel hat: Vorhaben, die das Spiel aus Ihren akuten Problemen berechnet.",
  programme: "Regierungsprogramme: Ziele über mehrere Schritte, und jeder Schritt verlangt echte Politik.",
  beschluesse: "Was beschlossen ist und gerade umgesetzt wird: Zeitplan, Kosten und Beschlussbuch.",
  wirkungsbericht: "Was Ihre Beschlüsse bewirkt haben: sechs und zwölf Monate danach, mit Verlauf, Regionen und Nebenwirkungen.",
  netz: "Der ganze Wirkungszusammenhang: jede Größe, jedes Problem und ihre Verbindungen, mit Suche.",
  parlament: "Wo Gesetze Mehrheiten brauchen: Fraktionen, Gespräche, Bündnisse und Abstimmungen.",
  verfassung: "Änderungen an den Spielregeln des Staates: Pakete, Mehrheiten, Verfassungsgericht und Volksabstimmung.",
  reich_recht: "Justiz und Recht: Unabhängigkeit, Kapazität der Gerichte und Befolgung von Urteilen. Reformen kosten Kapital, Stimmen und Zeit, nicht Geld.",
  waehler: "Wer Sie trägt und wer nicht: elf Gruppen mit Stimmung, Gründen und Forderungen.",
  wahlkampf: "Die acht Wochen vor der Wahl: Reisen ins Land, Versprechen mit Preis, die Diaspora, das TV-Duell — und eine Opposition, die zuschlägt, wo es brennt.",
  wirtschaft: "Die Zahlen des Landes und die großen Hebel: Zentralbank und Haushalt.",
  reich_haushalt: "Haushalt und Verwaltung: Verwaltungskraft, Baukapazität und Legitimität sind knapp. Sonderrechte wirken schnell und haben Kehrseiten.",
  reich_infra: "Was gebaut ist, braucht Pflege; was gebaut wird, teilt sich die Baukapazität. Große Projekte sind Wunder mit dauerhaften Vorteilen und mit Gegnern.",
  reich_kultur: "53 Stätten des Erbes verfallen ohne Pflege. Wunder, Routen und Restaurierungen kosten Kapital, Bau und Verwaltung, kaum Geld.",
  reich_militaer: "Der Präsident bestellt und verantwortet, er kommandiert nicht: Programme laufen vom Vertrag bis zur Einsatzbereitschaft, Doktrinen schließen einander aus.",
  katastrophe: "Wenn die Erde bebt oder das Wasser steigt: Lage, Nothilfe und Wiederaufbau.",
  welt: "Die übrigen Länder: Beziehung, Anliegen und Verhandlungen.",
};

export function zweckVon(dossier: string | null, kurz: string | undefined): string | undefined {
  return (dossier ? TAB_ZWECK[dossier] : undefined) ?? (kurz ? AKTEN_ZWECK[kurz] : undefined);
}
