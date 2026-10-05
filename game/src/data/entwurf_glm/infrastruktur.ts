// Datenentwurf GLM: Infrastruktur und Belastung (zu RECHERCHE_GLM_6, Thema 6).
// Diese Datei wird NICHT vom Spiel geladen; der Infrastruktur-/Belastungs-Strang übernimmt die
// Netzobjekte als Vorgabe. Reine Funktionen ohne Importe aus sim/.
// Bestände belegt mit Quelle; Last-Startwerte sind ausdrücklich Spielparameter (die Belastungslogik
// entsteht im Spiel aus Wachstum, Handel, Tourismus und Bevölkerung — KI_PROJEKTE_UND_KARTE Abschnitt 8).

// ---------------------------------------------------------------------------
// Typen

export type NetzId = "strasse" | "bahn" | "luft" | "see" | "strom" | "wohnen" | "kliniken" | "wasser";

export interface Netz {
  id: NetzId;
  name: string;
  /** Belegter Bestand mit Einheit und Quelle */
  bestand: { wert: number; einheit: string; quelle?: string };
  /** Kapazität in natürlicher Einheit (Spielparameter, wo Lücke) */
  kapazität: number;
  /** Startlast 0–100 (Spielparameter) */
  lastStart: number;
  /** Lastquelle-Worte für die Bitten-Mechanik (wer kommt, wenn die Last steigt) */
  lastQuellen: string[];
  /** Ausbauoptionen: Name, Kapazitätsgewinn, Monate Vorlauf (Spielparameter) */
  ausbauten: { name: string; gewinn: number; monate: number }[];
  /** Maßnahmen-Hebel im Netz */
  hebelIds: string[];
}

// ---------------------------------------------------------------------------
// Belegte Netze (Bestand 2024/2025)

export const NETZE: Netz[] = [
  {
    id: "strasse",
    name: "Straße (Autobahn und getrennte Fahrbahnen)",
    bestand: { wert: 3796, einheit: "km Otoyol (+29.730 km getrennt)", quelle: "KGM Nov. 2024; 2002: 1.714 km" },
    kapazität: 100,
    lastStart: 62,
    lastQuellen: ["Logistikverbände", "Exportindustrie", "Kommunale Straßenbehörden"],
    ausbauten: [
      { name: "Korridor fertigstellen (z. B. Mitte)", gewinn: 8, monate: 36 },
      { name: "Seriensanierung", gewinn: 5, monate: 24 },
      { name: "Umgehungen für Großstädte", gewinn: 6, monate: 30 },
    ],
    hebelIds: ["m_autobahnen", "m_instandhaltung", "m_oepp_garantien"],
  },
  {
    id: "bahn",
    name: "Bahn (Gesamt und Hochgeschwindigkeit)",
    bestand: { wert: 13919, einheit: "km (davon YHT 2.251 km)", quelle: "TCDD Taşımacılık Strategieplan 2024–2028; Ziel 2028: YHT 5.343 km" },
    kapazität: 100,
    lastStart: 40,
    lastQuellen: ["Güterkunden", "Regionalverwaltungen", "Fahrgastverbände"],
    ausbauten: [
      { name: "YHT-Erweiterung", gewinn: 10, monate: 60 },
      { name: "Güterterminals", gewinn: 8, monate: 36 },
      { name: "Signalisierung/Elektrifizierung", gewinn: 6, monate: 48 },
    ],
    hebelIds: ["m_bahn", "m_nahverkehr"],
  },
  {
    id: "luft",
    name: "Luft (Flughäfen)",
    bestand: { wert: 214, einheit: "Mio. Passagiere 2024 (İstanbul 80 → 84,4 Mio. 2025)", quelle: "DHMİ 10.12.2024; haber.aero 16.7.2026" },
    kapazität: 100,
    lastStart: 70,
    lastQuellen: ["Tourismusbranche", "Fluggesellschaften", "Provinzflughäfen"],
    ausbauten: [
      { name: "İstanbul-Terminalerweiterung", gewinn: 10, monate: 36 },
      { name: "Provinzflughafenserie", gewinn: 6, monate: 30 },
      { name: "Flugverkehrslenkung modernisieren", gewinn: 5, monate: 24 },
    ],
    hebelIds: ["m_oepp_garantien"],
  },
  {
    id: "see",
    name: "See (Häfen)",
    bestand: { wert: 13.5, einheit: "Mio. TEU (Gesamtfracht 531,7 Mio. t)", quelle: "TÜRKLİM/Weltbank 2024" },
    kapazität: 100,
    lastStart: 66,
    lastQuellen: ["Reeder", "Exportverbände", "Küstenkammern"],
    ausbauten: [
      { name: "Hafentrio Trabzon/Samsun/Mersin", gewinn: 12, monate: 48 },
      { name: "Containerterminal-Automatisierung", gewinn: 6, monate: 30 },
      { name: "Filiyos/Çandarlı planen", gewinn: 9, monate: 72 },
    ],
    hebelIds: ["m_oepp_garantien", "m_handelssysteme"],
  },
  {
    id: "strom",
    name: "Stromnetz",
    bestand: { wert: 348.9, einheit: "TWh Erzeugung 2024 (installierte Leistung Lücke)", quelle: "TEİAŞ; GLM_3" },
    kapazität: 100,
    lastStart: 68,
    lastQuellen: ["Industrie", "Verteilnetzbetreiber", "Haushalte im Sommer"],
    ausbauten: [
      { name: "Netzausbau und Speicher", gewinn: 10, monate: 42 },
      { name: "Smart Grid", gewinn: 7, monate: 30 },
      { name: "Interconnectors (Nachbarn)", gewinn: 5, monate: 36 },
    ],
    hebelIds: ["m_netzausbau", "m_speicher_smartgrid"],
  },
  {
    id: "wohnen",
    name: "Wohnen",
    bestand: { wert: 42, einheit: "Mio. Wohnungen (TÜİK-Sensus-Basis auswerten; ~904 Tsd. warten unverkauft)", quelle: "Portal-Auswertung 2024/25 — Primär: TÜİK-Binazensus" },
    kapazität: 100,
    lastStart: 75,
    lastQuellen: ["Mietvereinigungen", "Städte", "Bauwirtschaft"],
    ausbauten: [
      { name: "Sozialwohnungsserie (TOKİ, Ziel 500 Tsd.)", gewinn: 10, monate: 48 },
      { name: "Stadterneuerungsfahrplan", gewinn: 8, monate: 60 },
      { name: "Baukredite für Erstmarkt", gewinn: 6, monate: 24 },
    ],
    hebelIds: ["m_sozialwohnungen", "m_stadterneuerung", "m_baukredite", "m_gebaeudeverstaerkung"],
  },
  {
    id: "kliniken",
    name: "Kliniken",
    bestand: { wert: 270829, einheit: "Betten (~3,1 je 1.000; OECD-Abgrenzung ~2,7)", quelle: "Sağlık-Yıllığı-Auswertung 2025" },
    kapazität: 100,
    lastStart: 64,
    lastQuellen: ["Ärztekammer", "Provinzverwaltungen", "Patientenmilieus"],
    ausbauten: [
      { name: "Provinzklinik-Serie", gewinn: 8, monate: 36 },
      { name: "Metropol-Erweiterungen", gewinn: 6, monate: 30 },
      { name: "Ärztebindungsprogramm", gewinn: 5, monate: 24 },
    ],
    hebelIds: ["m_krankenhausbau", "m_aerztegehalt"],
  },
  {
    id: "wasser",
    name: "Wasser (Staudämme und Versorgung)",
    bestand: { wert: 1300, einheit: "m³ je Kopf je Jahr (zu prüfen; Stress-Schwelle nahe)", quelle: "gewöhnlich zitiert — TÜİK/DSİ prüfen" },
    kapazität: 100,
    lastStart: 60,
    lastQuellen: ["Bauernverbände", "Provinzwasserwerke", "DSİ"],
    ausbauten: [
      { name: "Staudamm- und Speicher-Serie", gewinn: 9, monate: 54 },
      { name: "Bewässerungsmodernisierung (GAP)", gewinn: 8, monate: 48 },
      { name: "Entsalzung für Küstenstädte", gewinn: 5, monate: 36 },
    ],
    hebelIds: ["m_staudaemme", "m_bewaesserung", "m_wasserleitungen"],
  },
];

// ---------------------------------------------------------------------------
// Reine Rechnungen

/** Last steigt mit den Treibern; Kapazität senkt sie (Belastungsmuster aus KI_PROJEKTE_UND_KARTE Abschnitt 8). */
export function netzLast(netz: Netz, treiberIndex: number, fertigAusbaute: number): number {
  // treiberIndex: Wirtschaft+Handel+Tourismus+Bevölkerung gemittelt (Amtsantritt = 100)
  const last = netz.lastStart * (treiberIndex / 100) - fertigAusbaute * 3;
  return Math.round(Math.max(0, Math.min(120, last)));
}

/** Bitte-Trigger: ab welcher Last kommt die Bitte ans Desk (Ministerfluss). */
export function bitteSchwelle(netz: Netz): { last: number; wer: string[]; text: string } {
  const last = netzLast(netz, 100, 0);
  const stufe = last >= 90 ? "Krise" : last >= 75 ? "Akut" : last >= 60 ? "Anlaufend" : "Ruhig";
  return {
    last,
    wer: netz.lastQuellen,
    text: `Netz ${netz.name}: Last ${last} — ${stufe}. Ab Akut kommen ${netz.lastQuellen[0]} mit einer Bitte.`,
  };
}

/** PPP-Modelle (Vorschlag 5.2; Kalibrierfall Çanakkale-Garantien). */
export type PppArt = "etatbau" | "schattenmaut" | "konzession";

export function pppWirkung(art: PppArt, erwarteteNutzung: number): { startMonate: number; garantierisiko: string; text: string } {
  switch (art) {
    case "etatbau":
      return { startMonate: 6, garantierisiko: "keines", text: "Langsam und teuer in Kapital, aber keine Garantiezeile im Haushalt." };
    case "schattenmaut":
      return {
        startMonate: 1,
        garantierisiko: erwarteteNutzung < 70 ? "hoch: Der Staat zahlt die Differenz — Çanakkale-Fall" : "niedrig",
        text: erwarteteNutzung < 70
          ? "Schneller Start; wenn die Nutzung hinter der Schätzung bleibt, wandert die Garantie in den Haushalt."
          : "Schneller Start; Nutzung trägt die Konzession.",
      };
    case "konzession":
      return { startMonate: 3, garantierisiko: "mittel (Einnahmenteilung)", text: "Konzessioniert; Erträge geteilt, Kontrolle geteilt." };
  }
}

/** Bebenrisiko des Wohnbestands (Vorschlag 5.3): Sanierung senkt Verluste, Anamnestie senkt Qualität. */
export function wohnungsrisiko(saniertProzent: number, amnestiePfad: boolean): { erwarteteVerluste: string; text: string } {
  const basis = 100 - saniertProzent;
  if (amnestiePfad) {
    return { erwarteteVerluste: basis >= 70 ? "hoch" : "mittel", text: `Amnestiepfad bei ${Math.round(saniertProzent)} % Sanierung: billiger heute, riskanter am Bebentag.` };
  }
  return {
    erwarteteVerluste: basis <= 40 ? "gering" : basis <= 70 ? "mittel" : "hoch",
    text: basis <= 40
      ? "Der Bestand ist mehrheitlich saniert; die Katastrophenkette trifft gedämpft."
      : `Noch ${Math.round(basis)} % des Bestands unsaniert; jede Erdbebensaison ist ein Spiel mit Kalender.`,
  };
}
