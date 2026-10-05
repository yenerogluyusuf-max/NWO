// Geheimdienst- und Spezialoperationsdaten (Milli İstihbarat Teşkilatı - MİT).
// Verdeckte Aufklärung, elektronische Kampfführung, Anti-Terror-Schläge und Gegenspionage.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

export type MitOperationsKategorie =
  | "grenzaufklaerung"     // Taktische Aufklärung von Truppenbewegungen
  | "elektronische_stoerung"// SIGINT, Radar-Jamming und Cyberangriffe
  | "sabotage"             // Zerschlagung gegnerischer Munitions- und Nachschubknoten
  | "spionageabwehr"       // Schutz heimischer Rüstungsprojekte (KAAN, Çelik Kubbe)
  | "einflussnahme"        // Diplomatische und mediale Einflussoperationen
  | "extraktion";          // Befreiung und gezielter Zugriff im Ausland

export interface MitOperationDef {
  id: string;
  kategorie: MitOperationsKategorie;
  titel: string;
  titelTr: string;
  titelEn: string;
  beschreibung: string;
  beschreibungTr: string;
  beschreibungEn: string;
  schauplatz?: "syrien" | "irak" | "aegaeis" | "zypern" | "kaukasus" | "inland";
  tage: number;
  kapital: number;
  aufmerksamkeit: number;
  erfolgsBasis: number; // 0.0 bis 1.0 (z.B. 0.75)
  entdeckungsRisiko: number; // 0.0 bis 1.0 (z.B. 0.20)
  wirkungErfolg: {
    aufklaerungsBonus?: number;
    kampfkraftGegnerMod?: number; // z.B. -0.15 (senkt gegnerische Kampfkraft)
    nachschubGegnerMod?: number;
    spionageSchutz?: number;
    metriken?: Record<string, number>;
  };
  wirkungEntdeckung: {
    skandalGefahr: number;
    diplomatischeSpannung: number;
    ansehenDelta: number;
  };
}

export const MIT_OPERATIONEN: MitOperationDef[] = [
  {
    id: "mit_grenz_drohnen_sigint",
    kategorie: "grenzaufklaerung",
    titel: "Grenz-SIGINT & Drohnenaufklärung",
    titelTr: "Sınır Boyu SIGINT ve SİHA Keşfi",
    titelEn: "Border SIGINT & Tactical Drone Recon",
    beschreibung: "Lückenlose Überwachung elektromagnetischer Signaturen und Fahrzeugbewegungen an der Südgrenze.",
    beschreibungTr: "Suriye ve Irak sınır hattında telsiz dinlemesi ve 24 saat kesintisiz elektro-optik gözetleme.",
    beschreibungEn: "Continuous electronic signals interception and persistent tactical drone surveillance along southern frontiers.",
    schauplatz: "syrien",
    tage: 45,
    kapital: 4,
    aufmerksamkeit: 1,
    erfolgsBasis: 0.85,
    entdeckungsRisiko: 0.05,
    wirkungErfolg: {
      aufklaerungsBonus: 25,
      kampfkraftGegnerMod: -0.08,
      metriken: { grenzsicherheit: 6 },
    },
    wirkungEntdeckung: {
      skandalGefahr: 0.1,
      diplomatischeSpannung: 2,
      ansehenDelta: -1,
    },
  },
  {
    id: "mit_radar_jamming",
    kategorie: "elektronische_stoerung",
    titel: "Koral-Störsender & Cyber-Jamming",
    titelTr: "Koral Elektronik Harp ve Radar Karartma",
    titelEn: "Koral Electronic Warfare & Radar Jamming",
    beschreibung: "Gezielte Blindmachung feindlicher Luftraumüberwachungs- und Kommunikationsrelais vor einer Offensive.",
    beschreibungTr: "Harekât öncesinde düşman erken uyarı radarları ve telsiz linkleri Koral sistemiyle kör edilir.",
    beschreibungEn: "Blinding hostile early-warning search radars and command relays prior to offensive thrusts.",
    schauplatz: "syrien",
    tage: 30,
    kapital: 6,
    aufmerksamkeit: 1,
    erfolgsBasis: 0.80,
    entdeckungsRisiko: 0.15,
    wirkungErfolg: {
      kampfkraftGegnerMod: -0.20,
      nachschubGegnerMod: -0.15,
    },
    wirkungEntdeckung: {
      skandalGefahr: 0.2,
      diplomatischeSpannung: 4,
      ansehenDelta: -2,
    },
  },
  {
    id: "mit_nachschub_sabotage",
    kategorie: "sabotage",
    titel: "Präzisionsschlag auf Waffendepots",
    titelTr: "Mühimmat Depolarına Nokta Operasyon",
    titelEn: "Precision Interdiction of Arms Caches",
    beschreibung: "Infiltrierte Spezialeinheiten sprengen versteckte Raketenlager und Treibstoffdepots im Hinterland.",
    beschreibungTr: "Düşman lojistik hatlarındaki gizli mühimmat depoları ve yakıt tankerleri imha edilir.",
    beschreibungEn: "Special covert teams neutralize concealed munitions and rocket caches deep within hostile territory.",
    schauplatz: "irak",
    tage: 60,
    kapital: 8,
    aufmerksamkeit: 1,
    erfolgsBasis: 0.70,
    entdeckungsRisiko: 0.25,
    wirkungErfolg: {
      nachschubGegnerMod: -0.30,
      kampfkraftGegnerMod: -0.15,
      metriken: { terror_bedrohung: -8 },
    },
    wirkungEntdeckung: {
      skandalGefahr: 0.35,
      diplomatischeSpannung: 8,
      ansehenDelta: -4,
    },
  },
  {
    id: "mit_gegenspionage_kaan",
    kategorie: "spionageabwehr",
    titel: "Schutzschild Nationale Hochtechnologie",
    titelTr: "Milli Savunma Sanayii İstihbarata Karşı Koyma",
    titelEn: "Defense Industry Counter-Intelligence Shield",
    beschreibung: "Zerschlagung ausländischer Agentennetzwerke, die Baupläne von KAAN, Altay und Raketentechnik abgreifen wollen.",
    beschreibungTr: "TUSAŞ, ASELSAN ve Roketsan tesislerinde yabancı ajan sızıntılarını önleyici tam güvenlik çemberi.",
    beschreibungEn: "Neutralizing foreign espionage rings attempting to siphon stealth avionics blueprints and missile telemetry.",
    schauplatz: "inland",
    tage: 90,
    kapital: 7,
    aufmerksamkeit: 1,
    erfolgsBasis: 0.80,
    entdeckungsRisiko: 0.10,
    wirkungErfolg: {
      spionageSchutz: 40,
      metriken: { staatsgeheimnis_schutz: 12, vertrauen_generalstab: 8 },
    },
    wirkungEntdeckung: {
      skandalGefahr: 0.15,
      diplomatischeSpannung: 3,
      ansehenDelta: 0,
    },
  },
  {
    id: "mit_sonderextraktion",
    kategorie: "extraktion",
    titel: "Gezielte Festnahme von Rädelsführern",
    titelTr: "Sınır Ötesi Paketleme ve Nokta Operasyon",
    titelEn: "Cross-Border High-Value Target Apprehension",
    beschreibung: "Führungskader feindlicher Gruppierungen werden im Ausland festgesetzt und gerichtsverwertbar überstellt.",
    beschreibungTr: "Terör örgütü tepe yöneticileri üçüncü ülkelerde yakalanarak Türkiye'ye yargı önüne getirilir.",
    beschreibungEn: "High-value hostile commanders are intercepted and extradited for civilian prosecution in Ankara.",
    schauplatz: "syrien",
    tage: 45,
    kapital: 9,
    aufmerksamkeit: 2,
    erfolgsBasis: 0.65,
    entdeckungsRisiko: 0.30,
    wirkungErfolg: {
      metriken: { fuehrung_terror: -20, nationalstolz: 10, oeffentliche_ordnung: 6 },
    },
    wirkungEntdeckung: {
      skandalGefahr: 0.40,
      diplomatischeSpannung: 10,
      ansehenDelta: -5,
    },
  },
];

export const MIT_OPERATIONEN_NACH_ID = Object.fromEntries(
  MIT_OPERATIONEN.map((op) => [op.id, op])
);
