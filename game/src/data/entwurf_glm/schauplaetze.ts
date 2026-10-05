// Datenentwurf GLM: Kriegsschauplätze (zu RECHERCHE_GLM_10, Thema 10).
// Diese Datei wird NICHT vom Spiel geladen; der Kriegsstrang (Welle K, data/krieg-daten.ts Abschnitt
// Schauplätze) übernimmt die Theater als Vorgabe. Reine Funktionen ohne Importe aus sim/.
// Kontrolle und Lage sind datierte Zustände (Stichtag Sept. 2026), keine Konstanten.

// ---------------------------------------------------------------------------
// Typen

export interface TheaterAkteur {
  name: string;
  /** Kontrolle in Wortstufen (keine Prozent-Pseudo-Präzision) */
  kontrolle: "dominant" | "stark" | "geteilt" | "schwach" | "abwesend";
  ziel: string;
}

export interface Schauplatz {
  id: string;
  name: string;
  /** Verwaltungsgliederung (belegt, siehe RECHERCHE_KRIEGSSCHAUPAETZE) */
  gliederung: string;
  /** Gelände als Kriegswert */
  gelände: string;
  /** Infrastruktur, die den Theaterwert trägt (Zustand im Spiel veränderbar) */
  infrastruktur: { name: string; zustand: string }[];
  ressourcen: string[];
  akteure: TheaterAkteur[];
  /** Die dringendste datierte Frage des Theaters (Terminkalender-Muster) */
  frage: { text: string; frist?: string };
  /** Kopplung an bestehende Spielkanten */
  kopplungen: string[];
}

// ---------------------------------------------------------------------------
// Die fünf Theater (Stand datiert 2025/26)

export const SCHAUPLAETZE: Schauplatz[] = [
  {
    id: "nordsyrien",
    name: "Nordsyrien",
    gliederung: "14 Gouvernements (OCHA: 14→62→272); Kernzonen: Afrin–Azaz–Jarabulus (SNA), Kobani–Qamishli-Band (SDF), Idlib",
    gelände: "Euphrat-Tal flach (Panzerland), Küsten- und Qalamun-Gebirge, M4 als Operationsachse",
    infrastruktur: [
      { name: "M4-Highway", zustand: "teilweise offen, Kontrollpunkte" },
      { name: "Alouk-Wasserstation (Hassakeh)", zustand: "strittig, Ausfälle dokumentiert" },
      { name: "Tabqa-Staudamm", zustand: "beschädigt, funktionsfähig" },
      { name: "Rmeilan-Ölfelder", zustand: "SDF-Kontrolle, einfache Verarbeitung" },
    ],
    ressourcen: ["Öl (Nordost)", "Wasser (Euphrat — Zustromkante GLM_7)", "Weizenböden", "Flüchtlingslager"],
    akteure: [
      { name: "Şara-Übergangsstaat", kontrolle: "stark", ziel: "Staat wieder aufbauen, SDF integrieren, Isolation beenden" },
      { name: "SDF (Kobani-Legion)", kontrolle: "geteilt", ziel: "Autonomie erhalten, Integration auf eigenen Bedingungen" },
      { name: "SNA (türkisch gestützt)", kontrolle: "stark", ziel: "Zonen halten, Einfluss in Damaskus sichern" },
      { name: "Türkiye", kontrolle: "stark", ziel: "SDF-Frage lösen, Grenzsicherheit, Rückkehr ermöglichen" },
      { name: "USA", kontrolle: "schwach", ziel: "ISIL-Absicherung, SDF als Partner, Vermittlung" },
    ],
    frage: { text: "SDF-Integrationsweg (10.3.2025, 13 Punkte) nach Fristablauf — Damaskus rückt nach. Unterstützen, Pfand halten, abwarten?", frist: "Lage seit 1/2026 aktiv" },
    kopplungen: ["g_friedensprozess", "g_rueckkehr", "fok_sich_grenzkorridor", "sim/diplomatie.ts (Terror: is/pkk)"],
  },
  {
    id: "nordirak",
    name: "Nordirak",
    gliederung: "18 (+Halabja=19) Gouvernements; KRG: Erbil, Sulaymaniyah, Dohuk (+Halabja)",
    gelände: "Qandil/Metina/Zap: Hochgebirge 1.500–3.000 m (Bergkrieg); Sinjar-Ebene; Mossul-Ebene",
    infrastruktur: [
      { name: "Kirkuk–Ceyhan-Pipeline", zustand: "still seit März 2023 (ICC-Schiedsspruch); Neustartverhandlungen 2025; 58-Mrd.-TL-Debatte 8/2025" },
      { name: "Erbil-Flughafen", zustand: "operativ" },
      { name: "KRG-Ölfelder", zustand: "produzierend, Export blockiert" },
    ],
    ressourcen: ["Öl (KRG/Kirkuk)", "Wasser (Großer Zab/Tigris)", "Grenzhandel"],
    akteure: [
      { name: "Bagdad", kontrolle: "stark", ziel: "Ölhoheit durchsetzen, KRG einbinden" },
      { name: "KRG (Erbil)", kontrolle: "stark", ziel: "Export wieder öffnen, Autonomie sichern" },
      { name: "PKK (Qandil)", kontrolle: "geteilt", ziel: "Basis halten, Verhandlungsdruck" },
      { name: "Türkiye", kontrolle: "stark", ziel: "Qandil-Druck, Pipeline-Neustart, Grenzsicherheit" },
      { name: "PMF-Einheiten", kontrolle: "schwach", ziel: "Regionale Machtinselfrage" },
    ],
    frage: { text: "Pipeline-Neustart: Deal mit Bagdad oder KRG-Duldung durch Bagdad?", frist: "Verhandlungen 2025 laufend" },
    kopplungen: ["GLM_7 Vorschlag 5.2", "sim/diplomatie.ts (PKK-Täter)", "g_polizei (Grenzschutz)"],
  },
  {
    id: "aegaeis",
    name: "Ägäis",
    gliederung: "Kein administratives Theater — Luftraum (Athens-FIR), Inselkette, Festlandsockelansprüche",
    gelände: "Inselkette mit engen Passagen; Marine-/Luftraum-Theater, kein Bodenkrieg",
    infrastruktur: [
      { name: "Luftraumüberwachung (beide Seiten)", zustand: "Hochbetrieb, Zwischenfälle als Kette" },
      { name: "Seismik-Kampagnen", zustand: "saisonal, streitbesetzt" },
    ],
    ressourcen: ["Fischerei", "Forschungs-/Bohrpotentiale (disputiert)", "Tourismus (Sommerlast)"],
    akteure: [
      { name: "Griechenland", kontrolle: "stark", ziel: "Festlandsockel sichern, F-35-Zulauf (40 genehmigt/20 kontraktiert)" },
      { name: "Türkiye", kontrolle: "stark", ziel: "Mavi Vatan verteidigen, 12-Meilen-Rote Linie, Viper/KAAN" },
      { name: "NATO", kontrolle: "schwach", ziel: "Dekontaktierung, Deeskalationsmechanismen" },
    ],
    frage: { text: "Krisenleiter-Modus dieses Sommers (Tourismuslast gegen Luftraumkrisen)?" },
    kopplungen: ["GLM_4 Nachbarreaktion (GRC)", "Tourismus-Güterkante (GLM_6)", "g_versammlungsfreiheit indirekt (Straßendruck)"],
  },
  {
    id: "zypern",
    name: "Zypern",
    gliederung: "6+6 Distrikte (belegt); Grüne Linie 1974, UN-Pufferzone ~180 km",
    gelände: "Kyrenia-Kette (Nord), Mesaoria-Ebene, Troodos (Süd); kleines, eingefrorenes Theater",
    infrastruktur: [
      { name: "Gasblöcke 1–13 (Südost)", zustand: "Bohrdispute, EU-Sanktionsdrohungen" },
      { name: "Britische Souveränitätsbasen (Akrotiri, Dhekelia)", zustand: "unverändert (Vertrag 1960)" },
    ],
    ressourcen: ["Offshore-Gas (disputiert)", "Transit- und Überwachungswert der Basen"],
    akteure: [
      { name: "Republik Zypern", kontrolle: "dominant", ziel: "Gas erschließen, EU-Hebel nutzen" },
      { name: "TRNC", kontrolle: "geteilt", ziel: "Anerkennung und Wirtschaftssicherung" },
      { name: "Türkiye", kontrolle: "stark", ziel: "Gleichbehandlung erzwingen, Gasblöcke blockieren" },
      { name: "Großbritannien", kontrolle: "schwach", ziel: "Basen neutral halten" },
      { name: "EU", kontrolle: "schwach", ziel: "Beitrittskohärenz (Blocker gebaut)" },
    ],
    frage: { text: "Gasblock-Bohrkampagne dieser Saison — Bohren, protestieren, verhandeln?" },
    kopplungen: ["sim/eu.ts (Beitrittsblocker gebaut)", "GLM_7 2.6", "fok_aus_zollunion2"],
  },
  {
    id: "suedkaukasus",
    name: "Südkaukasus",
    gliederung: "Armenien 11 Marz; Aserbaidschan zentral verwaltet; Georgien 12 Einheiten (belegt)",
    gelände: "Sjunik/Zangezur: Bergland 2.000–3.900 m (Korridorkapazität hängt an Pässen/Tunneln); Aras-Tal",
    infrastruktur: [
      { name: "Zangezur-Korridor („Trump Road“)", zustand: "8.8.2025 Washington-Vereinbarung; 99 Jahre US-Pacht; Ausbau geplant (Straße/Bahn/Pipeline)" },
      { name: "BTK-Bahn (Baku–Tiflis–Kars)", zustand: "operativ; Mittlerer Korridor" },
      { name: "Anaklia-Hafen (Georgien)", zustand: "Tenderlage zu prüfen" },
    ],
    ressourcen: ["Kaspisches Öl/Gas (Transit)", "Transitgebühren", "Aras-Tal-Landwirtschaft"],
    akteure: [
      { name: "Aserbaidschan", kontrolle: "dominant", ziel: "Korridor realisieren, Friedensdividende sichern" },
      { name: "Armenien", kontrolle: "geteilt", ziel: "Souveränität wahren, Westanbindung" },
      { name: "USA", kontrolle: "stark", ziel: "Pachtbetrieb „Trump Road“, Russland raus halten" },
      { name: "Iran", kontrolle: "schwach", ziel: "Korridor-Nordrand abwehren (Aras-Frage)" },
      { name: "Russland", kontrolle: "abwesend", ziel: "Fuß wiedergewinnen ( Friedenstruppe ab 2024 weg)" },
      { name: "Türkiye", kontrolle: "stark", ziel: "Normalisierung mit Armenien, BTK-Ausbau, Mitnutzung verhandeln" },
    ],
    frage: { text: "Mitnutzung des US-Korridors verhandeln, BTK als Eigenweg ausbauen oder Iran-Kanalisierung (Sanktionsrisiko)?" },
    kopplungen: ["fok_aus_zangezur (Neutext mit US-Pacht)", "fok2_aus_kaspische_pipeline", "welt_korridor_* (zukunft.ts)", "GLM_7 Vorschlag 5.4"],
  },
];

// ---------------------------------------------------------------------------
// Reine Rechnungen

/** Theaterwert: Kontrolle + Infrastruktur + Gelände als Wortskala für die Kriegsrechnung (Welle K). */
export function theaterWert(s: Schauplatz, eigeneKontrolle: number): { wert: number; text: string } {
  const infra = s.infrastruktur.length;
  const wert = Math.max(0, Math.min(100, Math.round(eigeneKontrolle * 0.6 + infra * 8)));
  return {
    wert,
    text: wert >= 70
      ? `${s.name}: das Theater trägt Operationen (Infrastruktur und Kontrolle vorhanden).`
      : `${s.name}: das Theater trägt begrenzte Operationen; Infrastruktur schränkt ein.`,
  };
}

/** Datierte Frage ans Terminkalender-Muster (Schreibtisch): Fristen erzeugen Entscheidungsdruck. */
export function theaterFrage(s: Schauplatz): { titel: string; frist?: string; kopplungen: string[] } {
  return { titel: `${s.name}: ${s.frage.text}`, frist: s.frage.frist, kopplungen: s.kopplungen };
}
