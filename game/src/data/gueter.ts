// Güterbilanz der Türkei: 16 Warengruppen statt hunderter Einzelgüter (Leitsatz: Realismus verpackt in ein Spiel, nichts überkompliziert).
//
// Je Gruppe: Jahresproduktion, Jahresverbrauch, Lager zu Spielbeginn, Hauptlieferanten und Hauptkunden (Länder aus dem Weltmodell).
// Herkunft der Zahlen: Größenordnungen der Jahre 2023 bis 2025 aus den genannten Statistiken (TÜİK, FAO, USGS, MTA, Eti Maden, DSİ,
// EPDK, Ember, IEA, TEİAŞ, Türkçelik) und aus RECHERCHE_ENERGIE.md im Projekt. Sie sind gerundet und als „zu prüfen“ markiert, wo die
// Quelle hier nicht im Wortlaut vorliegt. Lager und Anteile der Partner sind Spielparameter, wo die Quelle fehlt.

export type GutId =
  | "getreide"
  | "obst_gemuese"
  | "fleisch_milch"
  | "zucker_oele"
  | "wasser"
  | "strom"
  | "erdgas"
  | "erdoel"
  | "kohle"
  | "stahl"
  | "bor"
  | "erze"
  | "elektronik"
  | "medikamente"
  | "duenger"
  | "ruestung";

export type GutArt = "nahrung" | "wasser" | "energie" | "rohstoff" | "industrie" | "ruestung";

/** Wohin ein Engpass im Politiknetz schlägt (Knoten, Stärke je Prozentpunkt Fehlmenge am Verbrauch; Spielparameter) */
export interface EngpassWirkung {
  knoten: string;
  jeProzent: number;
}

export interface GutDef {
  id: GutId;
  art: GutArt;
  einheit: string;
  /** Produktion je Jahr in der Einheit */
  produktion: number;
  /** Verbrauch je Jahr in der Einheit */
  verbrauch: number;
  /** Ausfuhr je Jahr in der Einheit (auch bei Eigenbedarf: Weiterverarbeitung, Mehlausfuhr usw.) */
  ausfuhr: number;
  /** Lager zu Spielbeginn in Monaten des Verbrauchs (Spielparameter, wo keine Quelle) */
  lagerMonate: number;
  /** Hauptlieferanten der Einfuhr: Länderkennung aus dem Weltmodell und Anteil in Prozent (Rest: übrige Welt) */
  lieferanten: { land: string; anteil: number }[];
  /** Hauptkunden der Ausfuhr */
  kunden: string[];
  /** Was Produktion bzw. Verbrauch im Spiel bewegt: Netzknoten, deren Abweichung vom Start die Menge verändert */
  produktionTreiber?: { knoten: string; elastizitaet: number }[];
  verbrauchTreiber?: { knoten: string; elastizitaet: number }[];
  /** Wohin ein Engpass schlägt */
  engpass: EngpassWirkung[];
  /** Läuft die Einfuhr durch Hormus (Anteil der Einfuhr) */
  hormusAnteil?: number;
  /** Quelle der Zahlen in einem Satz */
  quelle: string;
  /** Quelle hier nicht im Wortlaut geprüft */
  pruefen?: boolean;
  /** Beispiel für die Anzeige (z. B. Bananen bei Obst und Gemüse) */
  beispiel?: { name: string; produktion: number; verbrauch: number; einheit: string; orte: string };
}

export const GUETER: GutDef[] = [
  {
    id: "getreide", art: "nahrung", einheit: "Mio. t",
    produktion: 40, verbrauch: 37, ausfuhr: 7, lagerMonate: 3,
    lieferanten: [{ land: "RUS", anteil: 65 }, { land: "UKR", anteil: 20 }, { land: "KAZ", anteil: 5 }],
    kunden: ["IRQ", "SYR", "LBY"],
    produktionTreiber: [{ knoten: "ernte", elastizitaet: 1 }],
    engpass: [{ knoten: "lebensmittelpreise", jeProzent: 0.35 }],
    quelle: "TÜİK/FAO 2023: Weizen rund 22, Mais rund 9, Gerste rund 9 Mio. t; TÜİK 2024: Weizen 20,8 Mio. t (minus 5,5 %). Weizeneinfuhr überwiegend aus Russland, rund 9 Mio. t je Saison (TOBB, schwach belegt; TÜİK-Außenhandel und TMO prüfen), Mehlausfuhr in den Irak und nach Afrika. TMO-Lagerbestand: Lücke.",
    pruefen: true,
  },
  {
    id: "obst_gemuese", art: "nahrung", einheit: "Mio. t",
    produktion: 56, verbrauch: 50, ausfuhr: 7, lagerMonate: 0.5,
    lieferanten: [{ land: "EGY", anteil: 15 }],
    kunden: ["RUS", "DEU", "IRQ"],
    produktionTreiber: [{ knoten: "ernte", elastizitaet: 0.8 }],
    engpass: [{ knoten: "lebensmittelpreise", jeProzent: 0.15 }],
    quelle: "TÜİK 2023: Obst rund 25, Gemüse rund 31 Mio. t; die Türkei ist Nettoausfuhrland (Zitrus, Tomaten, Haselnüsse).",
    pruefen: true,
    // Bananen 2024: rund 875 Tsd. t Ernte, 238,8 Tsd. t Einfuhr (vor allem Ecuador); schwach belegt (Presseauswertung evrensel 6.7.2026, TÜİK-Pflanzenproduktion prüfen)
    beispiel: { name: "Bananen", produktion: 0.875, verbrauch: 1.11, einheit: "Mio. t", orte: "Anamur und Bozyazı (Mersin), Alanya und Manavgat (Antalya), unter Folie" },
  },
  {
    id: "fleisch_milch", art: "nahrung", einheit: "Mio. t",
    produktion: 25, verbrauch: 24.5, ausfuhr: 0.8, lagerMonate: 0.5,
    lieferanten: [{ land: "BRA", anteil: 30 }],
    kunden: ["IRQ", "SAU"],
    produktionTreiber: [{ knoten: "landwirtschaft_einkommen", elastizitaet: 0.4 }],
    engpass: [{ knoten: "lebensmittelpreise", jeProzent: 0.2 }],
    quelle: "TÜİK 2023: Milch rund 21,5 Mio. t, Geflügel rund 2,4 und rotes Fleisch rund 1,5 Mio. t; Lebendvieh-Einfuhr schwankt.",
    pruefen: true,
  },
  {
    id: "zucker_oele", art: "nahrung", einheit: "Mio. t",
    produktion: 4.5, verbrauch: 5.5, ausfuhr: 0.3, lagerMonate: 2,
    lieferanten: [{ land: "RUS", anteil: 55 }, { land: "UKR", anteil: 25 }],
    kunden: ["IRQ"],
    produktionTreiber: [{ knoten: "ernte", elastizitaet: 0.7 }],
    engpass: [{ knoten: "lebensmittelpreise", jeProzent: 0.25 }],
    quelle: "TBMM-Haushaltsvorlage Landwirtschaft: Zucker 2023/24 rund 3,3 Mio. t aus rund 23 Mio. t Rüben (TÜİK 2024: Rübe minus 8,9 %), Zucker damit praktisch autark; Sonnenblumenkerne und -öl zu großen Teilen aus Russland und der Ukraine (Menge zu prüfen, TÜİK-Außenhandel).",
    pruefen: true,
  },
  {
    id: "wasser", art: "wasser", einheit: "km³",
    produktion: 57, verbrauch: 57, ausfuhr: 0, lagerMonate: 6,
    lieferanten: [],
    kunden: ["IRQ", "SYR"],
    produktionTreiber: [{ knoten: "wasserversorgung", elastizitaet: 1 }, { knoten: "duerre", elastizitaet: -0.6 }],
    verbrauchTreiber: [{ knoten: "landwirtschaft_einkommen", elastizitaet: 0.3 }],
    engpass: [{ knoten: "wasserversorgung", jeProzent: -0.4 }, { knoten: "ernte", jeProzent: -0.3 }],
    quelle: "DSİ: Entnahme rund 57 km³ je Jahr bei rund 112 km³ nutzbarem Potenzial, rund drei Viertel für die Bewässerung; „Ausfuhr“ meint den Abfluss von Euphrat und Tigris, der vertraglich nicht fest geregelt ist.",
    pruefen: true,
  },
  {
    id: "strom", art: "energie", einheit: "TWh",
    produktion: 349, verbrauch: 347, ausfuhr: 3, lagerMonate: 0,
    lieferanten: [{ land: "GEO", anteil: 40 }, { land: "BGR", anteil: 40 }],
    kunden: ["IRQ", "GEO", "BGR"],
    produktionTreiber: [{ knoten: "stromversorgung", elastizitaet: 1 }],
    verbrauchTreiber: [{ knoten: "industrie", elastizitaet: 0.6 }],
    engpass: [{ knoten: "stromversorgung", jeProzent: -0.6 }, { knoten: "industrie", jeProzent: -0.2 }],
    quelle: "TEİAŞ 2024: Erzeugung 348,9 TWh (EMO zählt 341,8 TWh); Mix laut Ember: Kohle 35,2, Wasser 21,5, Gas 18,9, Wind 10,5, Sonne 7,5, Geothermie 3,2 %. Außenhandel gering (wenige TWh). Erzeugung ist autark, ihre Brennstoffe sind es nicht (siehe Erdgas und Kohle).",
    pruefen: true,
  },
  {
    id: "erdgas", art: "energie", einheit: "Mrd. m³",
    produktion: 3.5, verbrauch: 56.4, ausfuhr: 1, lagerMonate: 1.5,
    // Die Lieferanteile führt sim/diplomatie.ts (Energie); hier nur die Zuordnung für die Anzeige
    lieferanten: [{ land: "RUS", anteil: 36 }, { land: "AZE", anteil: 20 }, { land: "USA", anteil: 16 }, { land: "IRN", anteil: 13 }],
    kunden: ["GEO", "BGR"],
    produktionTreiber: [{ knoten: "sakarya_gas", elastizitaet: 1 }],
    verbrauchTreiber: [{ knoten: "industrie", elastizitaet: 0.4 }],
    engpass: [{ knoten: "energiepreise", jeProzent: 0.4 }, { knoten: "energieversorgung", jeProzent: -0.4 }],
    hormusAnteil: 0.1,
    quelle: "BOTAŞ: Verbrauch 2024 56,39 Mrd. m³ (plus 9,5 %; über Presse, gegen EPDK-Sektorbericht prüfen), 2025 Rekord rund 60 Mrd. m³ (RECHERCHE_ENERGIE.md); Lagerkapazität Silivri und Tuz Gölü: Lücke; Lieferanten 2025 Russland 36, Aserbaidschan 20, USA 16, Iran 13, Algerien 8 Prozent (Ember; Algerien fehlt im Weltmodell und zählt zur übrigen Welt); Sakarya-Feld in der ersten Phase.",
  },
  {
    id: "erdoel", art: "energie", einheit: "Mio. t",
    produktion: 5, verbrauch: 50, ausfuhr: 8, lagerMonate: 3,
    lieferanten: [{ land: "RUS", anteil: 55 }, { land: "IRQ", anteil: 15 }, { land: "KAZ", anteil: 10 }],
    kunden: ["EU"],
    produktionTreiber: [{ knoten: "energieversorgung", elastizitaet: 0.2 }],
    verbrauchTreiber: [{ knoten: "industrie", elastizitaet: 0.3 }],
    engpass: [{ knoten: "energiepreise", jeProzent: 0.35 }, { knoten: "lebenshaltung", jeProzent: 0.1 }],
    hormusAnteil: 0.15,
    quelle: "EPDK/IEA: Bedarf rund eine Million Barrel je Tag; eigene Förderung (Batman, Şırnak-Gabar) rund ein Zehntel; Rohöl 2024 zu über der Hälfte aus Russland; Raffinerieprodukte werden auch ausgeführt. Lager: Pflichtvorrat nach IEA-Regel 90 Tage Nettoeinfuhr (Türkei ist IEA-Mitglied); die Angabe „rund 10 Tage“ (worldometers) ist schwach belegt und nicht übernommen.",
    pruefen: true,
  },
  {
    id: "kohle", art: "energie", einheit: "Mio. t",
    produktion: 90, verbrauch: 130, ausfuhr: 0, lagerMonate: 2,
    lieferanten: [{ land: "RUS", anteil: 65 }],
    kunden: [],
    produktionTreiber: [{ knoten: "energieversorgung", elastizitaet: 0.2 }],
    engpass: [{ knoten: "strompreis", jeProzent: 0.2 }, { knoten: "industrie", jeProzent: -0.1 }],
    quelle: "Ember/TÜİK: Braunkohle eigen (Afşin-Elbistan, Soma) rund 90 Mio. t, Steinkohle rund 40 Mio. t eingeführt, überwiegend aus Russland.",
    pruefen: true,
  },
  {
    id: "stahl", art: "industrie", einheit: "Mio. t",
    produktion: 36.9, verbrauch: 37, ausfuhr: 11, lagerMonate: 1,
    lieferanten: [{ land: "USA", anteil: 20 }, { land: "EU", anteil: 30 }, { land: "RUS", anteil: 15 }],
    kunden: ["EU", "USA", "ISR"],
    produktionTreiber: [{ knoten: "industrie", elastizitaet: 0.8 }, { knoten: "energiepreise", elastizitaet: -0.3 }],
    verbrauchTreiber: [{ knoten: "bauwirtschaft", elastizitaet: 0.7 }],
    engpass: [{ knoten: "bauwirtschaft", jeProzent: -0.25 }, { knoten: "industrie", jeProzent: -0.15 }],
    quelle: "worldsteel/TÇÜD 2024: Rohstahl 36,9 Mio. t (2025 rund 38,1 Mio. t, Platz 7 der Welt; Presse, schwach belegt), überwiegend im Elektroofen aus Schrott (rund 20 Mio. t Schrotteinfuhr aus USA und EU).",
    pruefen: true,
  },
  {
    id: "bor", art: "rohstoff", einheit: "Mio. t",
    produktion: 2.5, verbrauch: 0.3, ausfuhr: 2.2, lagerMonate: 2,
    lieferanten: [],
    kunden: ["CHN", "USA", "EU"],
    produktionTreiber: [{ knoten: "industrie", elastizitaet: 0.3 }],
    engpass: [],
    quelle: "Eti Maden/USGS: rund drei Viertel der bekannten Borvorkommen der Welt liegen in der Türkei (Eskişehir, Balıkesir, Kütahya, Bursa); Ausfuhr vor allem nach China. Seltene Erden (Beylikova, Eskişehir) sind erschlossen, aber noch ohne nennenswerte Förderung.",
    pruefen: true,
  },
  {
    id: "erze", art: "rohstoff", einheit: "Mio. t",
    produktion: 3, verbrauch: 1.2, ausfuhr: 2.3, lagerMonate: 1,
    lieferanten: [{ land: "CHN", anteil: 20 }],
    kunden: ["CHN"],
    produktionTreiber: [{ knoten: "industrie", elastizitaet: 0.3 }],
    engpass: [{ knoten: "industrie", jeProzent: -0.05 }],
    quelle: "USGS/MTA: Chromerz (Elazığ, Muğla, Eskişehir) rund 2 bis 3 Mio. t, die Türkei gehört zu den größten Förderländern; Kupfer (Artvin, Elazığ, Kastamonu) deckt den Bedarf nicht.",
    pruefen: true,
  },
  {
    id: "elektronik", art: "industrie", einheit: "Mrd. $",
    produktion: 4, verbrauch: 24, ausfuhr: 5, lagerMonate: 1,
    lieferanten: [{ land: "CHN", anteil: 55 }, { land: "EU", anteil: 15 }, { land: "USA", anteil: 5 }],
    kunden: ["EU"],
    produktionTreiber: [{ knoten: "industrie", elastizitaet: 0.5 }],
    engpass: [{ knoten: "industrie", jeProzent: -0.15 }, { knoten: "internet", jeProzent: -0.05 }],
    quelle: "Spielparameter: Chips und Bauteile werden fast vollständig eingeführt, Endgeräte (Fernseher, weiße Ware) teils im Land montiert; Wert der Einfuhr zu prüfen (TÜİK Außenhandel nach Warengruppen).",
    pruefen: true,
  },
  {
    id: "medikamente", art: "industrie", einheit: "Mrd. $",
    produktion: 5, verbrauch: 8.9, ausfuhr: 2.3, lagerMonate: 3,
    lieferanten: [{ land: "EU", anteil: 47 }, { land: "DEU", anteil: 17 }, { land: "USA", anteil: 16 }, { land: "CHN", anteil: 9 }],
    kunden: ["IRQ"],
    produktionTreiber: [{ knoten: "industrie", elastizitaet: 0.3 }],
    engpass: [{ knoten: "medikamente", jeProzent: -0.5 }, { knoten: "gesundheitsversorgung", jeProzent: -0.2 }],
    quelle: "İEİS/TEİS 2024: Einfuhr 6,22 Mrd. $ (plus 8,5 %; 2025: 7,3 Mrd. $), die Ausfuhr deckt 37 % davon; 64,4 % der Einfuhr aus Europa (Deutschland 1,04 Mrd. $), USA 984 Mio. $, China 540 Mio. $. Heimische Erzeugung in Dollar ist Spielparameter (der Großteil der Packungen wird im Land hergestellt, Wirkstoffe kommen von außen).",
    pruefen: true,
  },
  {
    id: "duenger", art: "nahrung", einheit: "Mio. t",
    produktion: 3.5, verbrauch: 6.5, ausfuhr: 0.2, lagerMonate: 2,
    lieferanten: [{ land: "RUS", anteil: 40 }, { land: "EGY", anteil: 15 }],
    kunden: [],
    produktionTreiber: [{ knoten: "industrie", elastizitaet: 0.4 }, { knoten: "energiepreise", elastizitaet: -0.3 }],
    engpass: [{ knoten: "ernte", jeProzent: -0.2 }, { knoten: "landwirtschaft_einkommen", jeProzent: -0.2 }],
    quelle: "Spielparameter nach Branchenangaben: Stickstoffdünger hängt am Gaspreis, ein großer Teil wird eingeführt; zu prüfen (Tarım ve Orman Bakanlığı, TÜGSAŞ).",
    pruefen: true,
  },
  {
    id: "ruestung", art: "ruestung", einheit: "Index",
    produktion: 0, verbrauch: 0, ausfuhr: 0, lagerMonate: 0,
    lieferanten: [{ land: "USA", anteil: 40 }, { land: "EU", anteil: 40 }],
    kunden: ["AZE", "UKR", "SAU"],
    engpass: [],
    quelle: "Autarkie aus dem Netzknoten „Rüstungsautarkie“ (Spielwert); das Militär-Inventar mit Beständen führt ein eigenes Modul.",
  },
];

export const GUT_NACH_ID = new Map(GUETER.map((g) => [g.id, g]));

/** Was eine strategische Reserve je Monat Verbrauch kostet, in Prozent des BIP (Spielparameter) */
export const RESERVE_KOSTEN: Partial<Record<GutId, number>> = {
  getreide: 0.03,
  zucker_oele: 0.01,
  erdgas: 0.05,
  erdoel: 0.06,
  kohle: 0.01,
  medikamente: 0.02,
  duenger: 0.01,
  wasser: 0.04,
};
