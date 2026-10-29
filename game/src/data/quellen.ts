// Das Quellenregister: Wer die Karten, Zahlen und Listen des Spiels geliefert hat, mit Lizenz und Verweis.
// Pflichtfeature (PLANERWEITERUNG, „Attribution ist Pflichtfeature"): OSM ODbL, Natural Earth, Copernicus/SRTM,
// Weltbank und die Statistikämter verlangen die Nennung des Herausgebers. Die deutschen Behördennamen im Spiel
// (MB statt TCMB u. a.) bleiben: hier stehen die echten Herausgeber, wie die Lizenzen es verlangen.
// Keine Zahlen in dieser Datei — nur Quellenangaben.

export interface Quelle {
  id: string;
  gruppe: "karte" | "statistik" | "international" | "spiel";
  name: string;
  /** Verweis (Website oder Datenportal) */
  url: string;
  /** Lizenz oder Nutzungshinweis */
  lizenz: string;
  /** Ein Satz: was genau das Spiel von hier nimmt */
  nutzung: string;
}

export const QUELLEN: Quelle[] = [
  // ---- Karte und Geodaten ----
  {
    id: "osm",
    gruppe: "karte",
    name: "OpenStreetMap-Mitwirkende",
    url: "https://www.openstreetmap.org/copyright",
    lizenz: "ODbL 1.0 (Datenbankinhalt)",
    nutzung: "Straßen, Bahnen, Gewässer, Orte und Bezirksgrenzen der Karte (Auszug Türkei über Geofabrik).",
  },
  {
    id: "geofabrik",
    gruppe: "karte",
    name: "Geofabrik",
    url: "https://download.geofabrik.de/asia/turkey.html",
    lizenz: "ODbL-Auszug (Weitergabe gleicher Lizenz)",
    nutzung: "Aufbereiteter Türkei-Auszug der OpenStreetMap-Daten.",
  },
  {
    id: "natural_earth",
    gruppe: "karte",
    name: "Natural Earth",
    url: "https://www.naturalearthdata.com/",
    lizenz: "Public Domain",
    nutzung: "Weltkarte, Landesgrenzen, Küstenlinien und Relief-Basis in der Weitsicht.",
  },
  {
    id: "geoboundaries",
    gruppe: "karte",
    name: "geoBoundaries",
    url: "https://www.geoboundaries.org/",
    lizenz: "gbOpen (CC BY 4.0 / ODbL je Datensatz)",
    nutzung: "Bezirks- und Provinzgrenzen der Karte.",
  },
  {
    id: "copernicus",
    gruppe: "karte",
    name: "Copernicus (SRTM / EU-DEM)",
    url: "https://land.copernicus.eu/",
    lizenz: "Copernicus-Nutzungsbedingungen (freie Nutzung mit Quellenangabe)",
    nutzung: "Relief-Höhen der Kartenansicht.",
  },
  // ---- Türkische Statistik ----
  {
    id: "tuik",
    gruppe: "statistik",
    name: "Statistikamt (TÜİK)",
    url: "https://www.tuik.gov.tr/",
    lizenz: "freie Nutzung mit Quellenangabe („TÜİK, Thema, Periode“)",
    nutzung: "Bevölkerung, Ernten, Preise, Arbeitsmarkt, Justiz- und Tourismuszahlen des Startzustands.",
  },
  {
    id: "dsi",
    gruppe: "statistik",
    name: "Wasserwerke (DSİ)",
    url: "https://www.dsi.gov.tr/",
    lizenz: "Veröffentlichungen der Behörde (Quellenangabe)",
    nutzung: "Staudämme, Stauseestände und Wasserpotenzial.",
  },
  {
    id: "tcmb",
    gruppe: "statistik",
    name: "Zentralbank (TCMB)",
    url: "https://evds2.tcmb.gov.tr/",
    lizenz: "EVDS-Daten für nicht-kommerzielle Nutzung; kommerziell nur mit schriftlicher Erlaubnis",
    nutzung: "Zinssätze, Wechselkursreihen und Zahlungsbilanz-Anker der Kalibrierung (im Spiel unter dem Namen „MB“).",
  },
  {
    id: "sgk",
    gruppe: "statistik",
    name: "Sozialversicherung (SGK)",
    url: "https://www.sgk.gov.tr/",
    lizenz: "Veröffentlichungen der Behörde (Quellenangabe)",
    nutzung: "Rentnerzahlen, Beiträge und Kassenlage der Rentenrechnung.",
  },
  {
    id: "mta",
    gruppe: "statistik",
    name: "Geologischer Dienst (MTA)",
    url: "https://www.mta.gov.tr/",
    lizenz: "Veröffentlichungen der Behörde (Quellenangabe)",
    nutzung: "Vorkommen von Bor, Chrom, Kupfer und seltenen Erden auf der Ressourcenkarte.",
  },
  // ---- International ----
  {
    id: "weltbank",
    gruppe: "international",
    name: "Weltbank Open Data",
    url: "https://data.worldbank.org/",
    lizenz: "CC BY 4.0",
    nutzung: "Ländervergleiche (BIP je Kopf, Hafenumschlag, Indikatoren der Rangliste).",
  },
  {
    id: "ocha",
    gruppe: "international",
    name: "UN OCHA (Humanitarian Data Exchange)",
    url: "https://data.humdata.org/",
    lizenz: "CC-BY-artige Datensatzlizenzen je Veröffentlichung",
    nutzung: "Verwaltungsgliederung und Bevölkerung der Kriegsschauplätze.",
  },
  {
    id: "unhcr",
    gruppe: "international",
    name: "UNHCR",
    url: "https://data.unhcr.org/",
    lizenz: "freie Nutzung mit Quellenangabe",
    nutzung: "Fluchtbestand und Rückkehrrechnung der Außenlage.",
  },
  {
    id: "sipri",
    gruppe: "international",
    name: "SIPRI Military Expenditure Database",
    url: "https://www.sipri.org/databases/milex",
    lizenz: "CC BY 4.0",
    nutzung: "Militärausgaben der 24 Länder des Streitkräfte-Vergleichs.",
  },
  {
    id: "ember",
    gruppe: "international",
    name: "Ember",
    url: "https://ember-energy.org/",
    lizenz: "CC BY 4.0",
    nutzung: "Strommix und Elektrizitätsjahre (Wind, Sonne, Kohle, Gas).",
  },
  {
    id: "iea",
    gruppe: "international",
    name: "IEA",
    url: "https://www.iea.org/data-and-statistics",
    lizenz: "IEA-Nutzungsbedingungen (mit Quellenangabe)",
    nutzung: "Energie-Größenordnungen der Güterbilanz (Öl, Gas, Hormus-Band).",
  },
  {
    id: "oecd",
    gruppe: "international",
    name: "OECD",
    url: "https://www.oecd.org/",
    lizenz: "OECD-Nutzungsbedingungen (mit Quellenangabe)",
    nutzung: "PISA-Anker der Bildungskette und Gesundheitsvergleiche.",
  },
  {
    id: "iso",
    gruppe: "international",
    name: "ISO 3166-2",
    url: "https://www.iso.org/standard/72482.html",
    lizenz: "ISO-Veröffentlichung (Zählung der Untergliederung)",
    nutzung: "Verwaltungseinheiten der Nachbarländer (Marz, Ostan, Regionen).",
  },
  // ---- Spiel ----
  {
    id: "werk",
    gruppe: "spiel",
    name: "Spielparameter",
    url: "https://github.com/",
    lizenz: "eigene Festlegungen (Kalibrierung)",
    nutzung: "Alle Werte ohne Beleg sind ausdrückliche Spielparameter der Kalibrierung, keine Tatsachenbehauptungen — so gekennzeichnet in den Daten und in den Recherche-Dateien des Projektordners.",
  },
];

export const QUELLEN_GRUPPEN: { id: Quelle["gruppe"]; titel: string }[] = [
  { id: "karte", titel: "Karte und Geodaten" },
  { id: "statistik", titel: "Türkische Statistik und Behörden" },
  { id: "international", titel: "Internationale Daten" },
  { id: "spiel", titel: "Das Spiel selbst" },
];

/** Der zusammengesetzte Attributionstext (für den Knopf „Alles kopieren“). */
export function quellenText(): string {
  return QUELLEN.map((q) => `${q.name} — ${q.url} — ${q.lizenz}`).join("\n");
}
