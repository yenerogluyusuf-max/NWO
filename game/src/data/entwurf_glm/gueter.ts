// Datenentwurf GLM: Güter, Autarkie, Ressourcen (zu RECHERCHE_GLM_3, Thema 3).
// Diese Datei wird NICHT vom Spiel geladen; der Güter-/Markt-Strang übernimmt die Ausgangszahlen
// als Vorgabewerte und die Funktionen als Rechenanker. Reine Funktionen ohne Importe aus sim/.
// Belegte Zahlen stehen mit Quelle; ohne Quelle sind Werte ausdrücklich Spielparameter.
// Vorkommen-Koordinaten sind Regionalangaben (Provinzauflösung genügt der Karte; vor Feinzoom MTA prüfen).

// ---------------------------------------------------------------------------
// Typen

export interface Lieferant {
  /** Land-Kürzel wie in sim/laender.ts (z. B. "RUS", "AZE", "IRN", "DEU", "CHN", "USA") */
  land: string;
  /** Anteil an der Einfuhr des Guts in Prozent (belegt oder Spielparameter) */
  anteilProzent: number;
  quelle?: string;
}

export interface Vorkommen {
  /** Provinzname (data/politiknetz.ts / sim/regional.ts) */
  provinz: string;
  plaka: number;
  /** Regionalkoordinaten für die Kartenmarke */
  lat: number;
  lon: number;
  /** Art des Vorkommens (Erz, Feld, Park, Anbauregion) */
  art: string;
  /** Größe in Worten (Weltspitze / groß / mittel) — Zahlen nur mit Quelle */
  groesse: string;
  quelle?: string;
}

export interface Gut {
  id: string;
  name: string;
  kategorie: "energie" | "metall" | "landwirtschaft" | "industrie" | "nahrung";
  /** Jahresverbrauch in natürlicher Einheit (Einheit nennen) */
  verbrauchJeJahr: number;
  einheit: string;
  /** Heimische Jahreserzeugung (gleiche Einheit) */
  heimischeErzeugung: number;
  einfuhrJeJahr?: number;
  ausfuhrJeJahr?: number;
  /** Lagerstand in Tagesverbrauch (belegt oder Spielparameter) */
  lagerTage: number;
  lagerQuelle?: string;
  lieferanten: Lieferant[];
  /** Auf der Karte sichtbare Vorkommen */
  vorkommen?: Vorkommen[];
  /** Jahres-Einfuhrrechnung in Mrd. $ (belegt, wo vorhanden) */
  einfuhrMrdDollar?: number;
  einfuhrQuelle?: string;
}

// ---------------------------------------------------------------------------
// Belegte Ausgangszahlen (2024/2025; siehe RECHERCHE_GLM_3 Abschnitt 2)

export const GUETER: Gut[] = [
  {
    id: "erdgas",
    name: "Erdgas",
    kategorie: "energie",
    verbrauchJeJahr: 56.39, // Mrd. m³, 2024
    einheit: "Mrd. m³",
    heimischeErzeugung: 1.2, // Spielparameter: BOTAŞ-Heimmenge nicht belegt
    einfuhrJeJahr: 55.2,
    lagerTage: 30, // Spielparameter: Silivri/Tuz Gölü-Kapazität nicht belegt
    lieferanten: [
      { land: "RUS", anteilProzent: 35, quelle: "TÇE-Auswertung 2024" },
      { land: "AZE", anteilProzent: 21, quelle: "TÇE; 7,3 Mrd. m³ in 9M2024 (turkic.world)" },
      { land: "IRN", anteilProzent: 13, quelle: "TÇE-Auswertung 2024" },
      { land: "LNG", anteilProzent: 31, quelle: "Rest: USA, Katar, Nigeria, Algerien (Aufteilung Lücke)" },
    ],
    vorkommen: [{ provinz: "Şırnak", plaka: 73, lat: 37.35, lon: 42.3, art: "Gasfeld (Schwarzes Meer zusätzlich)", groesse: "wachsend" }],
  },
  {
    id: "erdoel",
    name: "Erdöl",
    kategorie: "energie",
    verbrauchJeJahr: 404, // Mio. Barrel (1,107 Mio./Tag, 2024)
    einheit: "Mio. Barrel",
    heimischeErzeugung: 40, // ~104–132 Tsd. Barrel/Tag; Gabar 61 Tsd./Tag (Presse)
    lagerTage: 10, // schwach belegt (worldometers) — gegen EPDK prüfen
    lagerQuelle: "worldometers 2024; EPDK-Prüfpflicht",
    lieferanten: [
      { land: "RUS", anteilProzent: 30, quelle: "Spielparameter" },
      { land: "IRQ", anteilProzent: 20, quelle: "Spielparameter" },
      { land: "IRN", anteilProzent: 15, quelle: "Spielparameter" },
      { land: "SAU", anteilProzent: 15, quelle: "Spielparameter" },
      { land: "REST", anteilProzent: 20 },
    ],
    vorkommen: [{ provinz: "Şırnak", plaka: 73, lat: 37.35, lon: 42.3, art: "Ölfeld Gabar", groesse: "61 Tsd. Barrel/Tag (Presse)" }],
  },
  {
    id: "strom",
    name: "Strom",
    kategorie: "energie",
    verbrauchJeJahr: 348.9, // TWh Erzeugung 2024 (TEİAŞ; EMO zählt 341,8)
    einheit: "TWh",
    heimischeErzeugung: 348.9,
    lagerTage: 0,
    lieferanten: [{ land: "RUS", anteilProzent: 0, quelle: "Brennstoffe indirekt: Kohle 35,2 %, Gas 18,9 % des Mixes" }],
  },
  {
    id: "weizen",
    name: "Weizen",
    kategorie: "landwirtschaft",
    verbrauchJeJahr: 29.8, // Spielparameter: Ernte + typische Einfuhr
    einheit: "Mio. t",
    heimischeErzeugung: 20.8, // TÜİK 2024 (−5,5 %)
    einfuhrJeJahr: 9.0, // TOBB, Vorjahresaison
    lagerTage: 60, // Spielparameter: TMO-Bestand Lücke
    lieferanten: [
      { land: "RUS", anteilProzent: 60, quelle: "Spielparameter: Russland als Hauptlieferant verbreitet berichtet" },
      { land: "UKR", anteilProzent: 20, quelle: "Spielparameter" },
      { land: "REST", anteilProzent: 20 },
    ],
  },
  {
    id: "banane",
    name: "Bananen",
    kategorie: "landwirtschaft",
    verbrauchJeJahr: 1.114, // Tsd. t (Ernte + Einfuhr 2024)
    einheit: "Tsd. t",
    heimischeErzeugung: 875, // 2024; Anamur/Bozyazı/Alanya/Manavgat
    einfuhrJeJahr: 238.8, // 2024 (evrensel 6.7.2026)
    lagerTage: 20, // Spielparameter (Früchte)
    lieferanten: [{ land: "ECU", anteilProzent: 70, quelle: "Spielparameter: Ecuador als Hauptlieferant verbreitet" }],
    vorkommen: [
      { provinz: "Mersin", plaka: 33, lat: 36.07, lon: 32.83, art: "Bananenanbau Anamur/Bozyazı", groesse: "Kernregion" },
      { provinz: "Antalya", plaka: 7, lat: 36.54, lon: 32.0, art: "Bananenanbau Alanya/Manavgat", groesse: "Kernregion" },
    ],
  },
  {
    id: "zucker",
    name: "Zucker",
    kategorie: "landwirtschaft",
    verbrauchJeJahr: 3.3,
    einheit: "Mio. t",
    heimischeErzeugung: 3.3, // 2023/24 aus 23 Mio. t Rübe (TBMM-Vorlage)
    lagerTage: 90, // Spielparameter
    lieferanten: [],
  },
  {
    id: "stahl",
    name: "Rohstahl",
    kategorie: "metall",
    verbrauchJeJahr: 38.1, // Mio. t Erzeugung 2025 (Welt 7.)
    einheit: "Mio. t",
    heimischeErzeugung: 38.1,
    lagerTage: 45, // Spielparameter
    lieferanten: [{ land: "RUS", anteilProzent: 0, quelle: "Einsatzstoffe (Schrott, Erz) importiert — Größen Lücke" }],
  },
  {
    id: "bor",
    name: "Bor",
    kategorie: "metall",
    verbrauchJeJahr: 0.8, // Spielparameter (heimischer Einsatz)
    einheit: "Mio. t",
    heimischeErzeugung: 2.5, // Spielparameter: Eti Maden-Menge nicht belegt
    ausfuhrJeJahr: 1.7,
    lagerTage: 180,
    lieferanten: [],
    vorkommen: [
      { provinz: "Kütahya", plaka: 43, lat: 39.32, lon: 29.4, art: "Bor Emet", groesse: "Weltspitze (72 % der Weltreserven im Land)" },
      { provinz: "Eskişehir", plaka: 26, lat: 39.2, lon: 31.5, art: "Bor Kırka", groesse: "groß" },
      { provinz: "Balıkesir", plaka: 10, lat: 39.4, lon: 28.14, art: "Bor Bigadiç", groesse: "groß" },
      { provinz: "Balıkesir", plaka: 10, lat: 40.35, lon: 27.97, art: "Verhüttung Bandırma", groesse: "Verarbeitungszentrum" },
    ],
  },
  {
    id: "seltene_erden",
    name: "Seltene Erden",
    kategorie: "metall",
    verbrauchJeJahr: 0.01,
    einheit: "Mio. t",
    heimischeErzeugung: 0,
    lagerTage: 0,
    lieferanten: [{ land: "CHN", anteilProzent: 90, quelle: "Spielparameter: Weltmarkt dominiert von China" }],
    vorkommen: [{ provinz: "Eskişehir", plaka: 26, lat: 39.55, lon: 31.2, art: "Beylikova (694 Mio. t Erz, umstritten)", groesse: "potentiell zweitgrößtes Vorkommen" }],
  },
  {
    id: "medikamente",
    name: "Medikamente",
    kategorie: "industrie",
    verbrauchJeJahr: 9.5, // Mrd. $ Bedarf (Spielparameter aus Import + Export)
    einheit: "Mrd. $",
    heimischeErzeugung: 2.3, // ~37 % Deckungsgrad (İEİS 2024)
    einfuhrJeJahr: 6.22,
    einfuhrMrdDollar: 6.22,
    einfuhrQuelle: "İEİS/TEİS 2024; 2025: 7,3 Mrd. $ (+17,4 %)",
    lagerTage: 60, // Spielparameter
    lieferanten: [
      { land: "DEU", anteilProzent: 17, quelle: "1,04 Mrd. $ (İEİS 2024)" },
      { land: "USA", anteilProzent: 16, quelle: "984 Mio. $" },
      { land: "CHN", anteilProzent: 9, quelle: "540 Mio. $" },
      { land: "EU-REST", anteilProzent: 38, quelle: "Europa gesamt 64,4 %" },
      { land: "REST", anteilProzent: 20 },
    ],
  },
  {
    id: "chips",
    name: "Chips",
    kategorie: "industrie",
    verbrauchJeJahr: 12, // Spielparameter (Elektronikimporte)
    einheit: "Mrd. $",
    heimischeErzeugung: 0,
    lagerTage: 45, // Spielparameter
    lieferanten: [
      { land: "CHN", anteilProzent: 40, quelle: "Spielparameter" },
      { land: "TWN", anteilProzent: 20, quelle: "Spielparameter" },
      { land: "REST", anteilProzent: 40 },
    ],
  },
  {
    id: "duenger",
    name: "Dünger",
    kategorie: "landwirtschaft",
    verbrauchJeJahr: 3.5, // Mrd. $ Bedarf (Spielparameter; nur Russland-Anteil belegt)
    einheit: "Mrd. $",
    heimischeErzeugung: 1.4, // Spielparameter
    einfuhrJeJahr: 2.1,
    lagerTage: 90, // Spielparameter
    lieferanten: [
      { land: "RUS", anteilProzent: 30, quelle: "124 Mio. $ (2024); H1/2025 188,2 Mio. $ (+118 %, Comtrade)" },
      { land: "REST", anteilProzent: 70, quelle: "Gesamtimporte Lücke (TÜİK GTIP 31)" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Reine Rechnungen

/** Autarkiegrad eines Guts in Prozent (0–100+; >100 heißt Exporteur). */
export function autarkieGrad(g: Gut): number {
  if (g.verbrauchJeJahr <= 0) return 0;
  return Math.round((g.heimischeErzeugung / g.verbrauchJeJahr) * 100);
}

/** Wie viele Tage reicht das Lager ohne Einfuhr (mit Drosselung auf 70 % des Verbrauchs, Spielparameter). */
export function verbrauchsTageOhneImport(g: Gut): number {
  if (g.lagerTage <= 0) return 0;
  return Math.round(g.lagerTage / 0.7);
}

/**
 * Schock durch Ausfall eines Lieferanten: Reichweitenverlust in Tagen und Preisanstoß in Worten.
 * Der Marktstrang (sim/maerkte.ts) übersetzt den Preisanstoß in Marktschocks.
 */
export function lieferantenSchock(g: Gut, land: string): { reichweiteTage: number; preisanstoß: "keiner" | "spürbar" | "hart" | "Krise"; text: string } | null {
  const l = g.lieferanten.find((x) => x.land === land);
  if (!l || l.anteilProzent <= 0) return null;
  const reichweite = Math.round(g.lagerTage * (1 - l.anteilProzent / 100) * 0.8);
  const a = l.anteilProzent;
  const preisanstoß = a >= 35 ? "Krise" : a >= 20 ? "hart" : a >= 10 ? "spürbar" : "keiner";
  return {
    reichweiteTage: reichweite,
    preisanstoß,
    text: `${g.name}: Ausfall von ${land} (${a} % der Einfuhr) lässt ${reichweite} Tage Reserve und löst einen ${preisanstoß}en Preisanstoß aus.`,
  };
}

/** Beschaffungsrichtlinie: wirkt auf die Lieferantenstruktur des nächsten Jahres (Spielparameter-Wirkungen). */
export type Beschaffungslinie = "diversifizieren" | "billigster" | "verbündeter" | "autarkie";

export function beschaffungswirkung(g: Gut, linie: Beschaffungslinie): { text: string; kostenFaktor: number; anfaelligkeit: number } {
  switch (linie) {
    case "diversifizieren":
      return { text: "Kein Lieferant über 20 %; Preis leicht höher, Schocks flacher.", kostenFaktor: 1.06, anfaelligkeit: 0.5 };
    case "billigster":
      return { text: "Billigster Lieferant maximiert; Preise niedrig, Schocks voll.", kostenFaktor: 0.97, anfaelligkeit: 1.0 };
    case "verbündeter":
      return { text: "Lieferung aus Verbündeten; Koppelgeschäft mit Außenpolitik.", kostenFaktor: 1.03, anfaelligkeit: 0.7 };
    case "autarkie":
      return { text: "Heimische Erzeugung gefördert; teuer, aber Resilienz wächst mit Jahren.", kostenFaktor: 1.15, anfaelligkeit: 0.4 };
  }
}

/** Weltkarte der Bor-Situation: Marktanteil ausbauen oder schweigen (Vorschlag 5.2, belegte Ausgangslage). */
export const BOR_AUSGANGSLAGE = {
  weltreservenProzent: 72, // TMMOB Maden Mühendisleri Odası
  weltmarktanteilProzent: 25, // ebenda
  notiz: "Der Unterschied zwischen Reserve- und Marktanteil ist der ausgespielte oder schweigende Hebel.",
};
