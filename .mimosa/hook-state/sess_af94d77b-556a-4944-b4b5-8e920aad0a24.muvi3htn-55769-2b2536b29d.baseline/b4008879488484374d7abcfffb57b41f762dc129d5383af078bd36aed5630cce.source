// Die weiteren Staaten der Welt (zweite Ebene neben den 18 Hauptakteuren aus sim/laender.ts): die EU-Mitgliedstaaten als eigene Akteure,
// die BRICS-Staaten, Golf, Turkstaaten und weitere Partner. Sie haben eine eigene Wirtschaft, Politik und Beziehung zur Türkei,
// schlanke Gesten, einen Platz in den Blöcken (data/welt-institutionen.ts) und wirken im EU-Rat mit. Einen Verhandlungstisch mit
// Klauselverträgen haben nur die Hauptakteure.
//
// Regel des Projekts: Quelle oder Lücke. Texte nennen nur Tatsachen aus den Dossiers (RECHERCHE_REALWELT_LAENDERDOSSIERS.md, Teil II „Bonus“,
// Teil VI) oder breit bekannte Tatsachen; die Startwerte der Beziehung zur Türkei sind qualitative Spielparameter (hoch, mittel, niedrig),
// keine Messwerte. Namen von Amtsinhabern kommen nicht vor.

import type { Lager, Regierungsform, Streuklasse, Wahl } from "./welt-daten";

export type EuThema = "rechtsstaat" | "migration" | "handel" | "sicherheit" | "erweiterung" | "region";

export interface WeitereDef {
  id: string;
  name: string;
  /** Dativ und Akkusativ mit Artikel für Fließtexte („mit Deutschland“, „für die Niederlande“) */
  dat: string;
  akk: string;
  kurz: string;
  iso: string;
  text: string;
  form: Regierungsform;
  klasse: Streuklasse;
  lager: Lager;
  energie: -1 | 0 | 1;
  sitz: string;
  regierung: string;
  inLand: string;
  wahlen: Wahl[];
  krieg0: number;
  amtsMonate0: number;
  /** Beziehung zur Türkei bei Spielbeginn (Spielparameter, qualitativ) */
  tr: { handel: number; sicherheit: number; vertrauen: number; konflikt: number };
  /** Der Hauptakteur, dessen Verhältnis zur Türkei dieses Land mitträgt (z. B. die EU für ihre Mitglieder), und wie stark (0–1) */
  anker?: { id: string; kopplung: number };
  /** Nur EU-Mitglieder: Gewicht der Themen für das Land im Rat (0–1) und die Haltung zur Türkei als Grundneigung (−1 bremst, +1 fördert) */
  eu?: { gewicht: Partial<Record<EuThema, number>>; neigung: number };
}

const D = (datum: string, art: string): Wahl => ({ datum, art });

export const WEITERE: WeitereDef[] = [
  // --- EU-Mitgliedstaaten -------------------------------------------------------------------------------------------------------
  { id: "DEU", name: "Deutschland", dat: "Deutschland", akk: "Deutschland", kurz: "DE", iso: "DEU",
    text: "Größter europäischer Einzelpartner der Türkei: Handel 2025 rund 52 Milliarden Dollar, etwa drei Millionen Menschen mit türkischem Hintergrund. Berlin hält den pragmatischen Kurs (Eurofighter, Migration), solange die Menschenrechtslage nicht eskaliert.",
    form: "demokratie", klasse: "fortgeschritten", lager: "west", energie: -1, sitz: "Berlin", regierung: "die Bundesregierung", inLand: "in Deutschland",
    wahlen: [D("2029-02-25", "Bundestagswahl")], krieg0: 0, amtsMonate0: 38,
    tr: { handel: 85, sicherheit: 55, vertrauen: 45, konflikt: 28 }, anker: { id: "EU", kopplung: 0.3 },
    eu: { gewicht: { rechtsstaat: 0.8, migration: 0.9, handel: 0.9, sicherheit: 0.7, erweiterung: 0.5, region: 0.3 }, neigung: 0.1 } },
  { id: "FRA", name: "Frankreich", dat: "Frankreich", akk: "Frankreich", kurz: "FR", iso: "FRA",
    text: "Mittelmeermacht und Rüstungsexporteur: skeptisch gegenüber einem EU-Beitritt der Türkei, im Streit um Libyen und das östliche Mittelmeer, zugleich bei Rüstungsfragen ein Partner, ohne den nichts geht.",
    form: "demokratie", klasse: "fortgeschritten", lager: "west", energie: -1, sitz: "Paris", regierung: "die französische Regierung", inLand: "in Frankreich",
    wahlen: [D("2032-04-10", "Präsidentenwahl")], krieg0: 0, amtsMonate0: 12,
    tr: { handel: 70, sicherheit: 50, vertrauen: 32, konflikt: 45 }, anker: { id: "EU", kopplung: 0.3 },
    eu: { gewicht: { rechtsstaat: 0.5, migration: 0.6, handel: 0.6, sicherheit: 0.9, erweiterung: 0.8, region: 0.9 }, neigung: -0.35 } },
  { id: "ITA", name: "Italien", dat: "Italien", akk: "Italien", kurz: "IT", iso: "ITA",
    text: "Enger Handels- und Energiepartner im Mittelmeer; Rüstungskooperation (Baykar–Leonardo) und gemeinsames Interesse an einer geordneten Migration über das Mittelmeer.",
    form: "demokratie", klasse: "fortgeschritten", lager: "west", energie: -1, sitz: "Rom", regierung: "die italienische Regierung", inLand: "in Italien",
    wahlen: [D("2032-09-25", "Parlamentswahl")], krieg0: 0, amtsMonate0: 20,
    tr: { handel: 75, sicherheit: 55, vertrauen: 50, konflikt: 18 }, anker: { id: "EU", kopplung: 0.3 },
    eu: { gewicht: { rechtsstaat: 0.3, migration: 0.9, handel: 0.6, sicherheit: 0.6, erweiterung: 0.3, region: 0.7 }, neigung: 0.2 } },
  { id: "ESP", name: "Spanien", dat: "Spanien", akk: "Spanien", kurz: "ES", iso: "ESP",
    text: "Wirtschaftlich eng verflochten (Bau, Autoindustrie) und im EU-Rat meist Fürsprecher der Zusammenarbeit mit Ankara; Anrainer des Mittelmeers mit eigenem Interesse an Migrationssteuerung.",
    form: "demokratie", klasse: "fortgeschritten", lager: "west", energie: -1, sitz: "Madrid", regierung: "die spanische Regierung", inLand: "in Spanien",
    wahlen: [D("2031-07-23", "Parlamentswahl")], krieg0: 0, amtsMonate0: 12,
    tr: { handel: 70, sicherheit: 55, vertrauen: 52, konflikt: 12 }, anker: { id: "EU", kopplung: 0.3 },
    eu: { gewicht: { rechtsstaat: 0.4, migration: 0.7, handel: 0.6, sicherheit: 0.4, erweiterung: 0.3, region: 0.4 }, neigung: 0.3 } },
  { id: "POL", name: "Polen", dat: "Polen", akk: "Polen", kurz: "PL", iso: "POL",
    text: "Starker NATO-Partner an der Ostflanke und Käufer türkischer Drohnen: Warschau sieht die Türkei als Sicherheitspartner gegenüber Russland und trägt Sanktionen gegen Ankara nicht mit.",
    form: "demokratie", klasse: "aufstrebend", lager: "west", energie: -1, sitz: "Warschau", regierung: "die polnische Regierung", inLand: "in Polen",
    wahlen: [D("2030-05-12", "Präsidentenwahl"), D("2031-10-12", "Parlamentswahl")], krieg0: 5, amtsMonate0: 12,
    tr: { handel: 60, sicherheit: 62, vertrauen: 55, konflikt: 12 }, anker: { id: "EU", kopplung: 0.25 },
    eu: { gewicht: { rechtsstaat: 0.3, migration: 0.7, handel: 0.4, sicherheit: 0.8, erweiterung: 0.4, region: 0.2 }, neigung: 0.3 } },
  { id: "NLD", name: "Niederlande", dat: "den Niederlanden", akk: "die Niederlande", kurz: "NL", iso: "NLD",
    text: "Wichtiger Handelspartner und im EU-Rat strenger Wächter von Rechtsstaat und Menschenrechten: Ohne sichtbare Reformen gibt Den Haag kein Mandat und keine Eröffnung frei.",
    form: "demokratie", klasse: "fortgeschritten", lager: "west", energie: -1, sitz: "Den Haag", regierung: "die niederländische Regierung", inLand: "in den Niederlanden",
    wahlen: [D("2029-10-29", "Parlamentswahl")], krieg0: 0, amtsMonate0: 8,
    tr: { handel: 70, sicherheit: 50, vertrauen: 36, konflikt: 28 }, anker: { id: "EU", kopplung: 0.3 },
    eu: { gewicht: { rechtsstaat: 1.0, migration: 0.7, handel: 0.8, sicherheit: 0.4, erweiterung: 0.7, region: 0.2 }, neigung: -0.25 } },
  { id: "BGR", name: "Bulgarien", dat: "Bulgarien", akk: "Bulgarien", kurz: "BG", iso: "BGR",
    text: "Grenznachbar und Transitland für Handel, Energie und Migration; arbeitet mit der Türkei und Rumänien bei der Minenabwehr im Schwarzen Meer zusammen und ist empfindlich bei Grenzschutz und Migration.",
    form: "demokratie", klasse: "aufstrebend", lager: "west", energie: -1, sitz: "Sofia", regierung: "die bulgarische Regierung", inLand: "in Bulgarien",
    wahlen: [D("2030-04-14", "Parlamentswahl")], krieg0: 0, amtsMonate0: 12,
    tr: { handel: 70, sicherheit: 55, vertrauen: 50, konflikt: 22 }, anker: { id: "EU", kopplung: 0.25 },
    eu: { gewicht: { rechtsstaat: 0.2, migration: 0.9, handel: 0.5, sicherheit: 0.5, erweiterung: 0.3, region: 0.4 }, neigung: 0.2 } },
  { id: "HUN", name: "Ungarn", dat: "Ungarn", akk: "Ungarn", kurz: "HU", iso: "HUN",
    text: "Beobachter in der Organisation der Turkstaaten und im EU-Rat häufig Fürsprecher engerer Beziehungen zu Ankara; bremst Sanktionen und Kritik an Rechtsstaatsfragen.",
    form: "hybrid", klasse: "aufstrebend", lager: "west", energie: -1, sitz: "Budapest", regierung: "die ungarische Regierung", inLand: "in Ungarn",
    wahlen: [D("2030-04-08", "Parlamentswahl")], krieg0: 0, amtsMonate0: 24,
    tr: { handel: 60, sicherheit: 55, vertrauen: 62, konflikt: 8 }, anker: { id: "EU", kopplung: 0.15 },
    eu: { gewicht: { rechtsstaat: 0.1, migration: 0.8, handel: 0.4, sicherheit: 0.4, erweiterung: 0.2, region: 0.1 }, neigung: 0.6 } },
  { id: "ROU", name: "Rumänien", dat: "Rumänien", akk: "Rumänien", kurz: "RO", iso: "ROU",
    text: "Schwarzmeer-Anrainer und NATO-Partner mit enger Wirtschaftsverflechtung; Zusammenarbeit bei der Minenabwehr und im Handel über die Häfen am Schwarzen Meer.",
    form: "demokratie", klasse: "aufstrebend", lager: "west", energie: -1, sitz: "Bukarest", regierung: "die rumänische Regierung", inLand: "in Rumänien",
    wahlen: [D("2028-12-10", "Parlamentswahl")], krieg0: 3, amtsMonate0: 24,
    tr: { handel: 65, sicherheit: 60, vertrauen: 58, konflikt: 8 }, anker: { id: "EU", kopplung: 0.25 },
    eu: { gewicht: { rechtsstaat: 0.3, migration: 0.5, handel: 0.5, sicherheit: 0.7, erweiterung: 0.2, region: 0.1 }, neigung: 0.35 } },
  { id: "AUT", name: "Österreich", dat: "Österreich", akk: "Österreich", kurz: "AT", iso: "AUT",
    text: "Im EU-Rat der schärfste Gegner eines Beitritts der Türkei, mit einer großen türkischen Gemeinde im Land; Wien verlangt eine „Partnerschaft statt Mitgliedschaft“.",
    form: "demokratie", klasse: "fortgeschritten", lager: "west", energie: -1, sitz: "Wien", regierung: "die österreichische Regierung", inLand: "in Österreich",
    wahlen: [D("2029-09-29", "Nationalratswahl")], krieg0: 0, amtsMonate0: 18,
    tr: { handel: 60, sicherheit: 40, vertrauen: 28, konflikt: 40 }, anker: { id: "EU", kopplung: 0.2 },
    eu: { gewicht: { rechtsstaat: 0.8, migration: 1.0, handel: 0.4, sicherheit: 0.3, erweiterung: 1.0, region: 0.1 }, neigung: -0.8 } },
  { id: "SWE", name: "Schweden", dat: "Schweden", akk: "Schweden", kurz: "SE", iso: "SWE",
    text: "Seit 2024 NATO-Mitglied, nachdem die Türkei dem Beitritt zugestimmt hat; hält eine strenge Linie bei Menschenrechten und Pressefreiheit, ist aber ein verlässlicher Rüstungs- und Handelspartner.",
    form: "demokratie", klasse: "fortgeschritten", lager: "west", energie: -1, sitz: "Stockholm", regierung: "die schwedische Regierung", inLand: "in Schweden",
    wahlen: [D("2030-09-15", "Reichstagswahl")], krieg0: 0, amtsMonate0: 20,
    tr: { handel: 55, sicherheit: 48, vertrauen: 38, konflikt: 22 }, anker: { id: "EU", kopplung: 0.25 },
    eu: { gewicht: { rechtsstaat: 0.9, migration: 0.5, handel: 0.5, sicherheit: 0.6, erweiterung: 0.5, region: 0.1 }, neigung: -0.1 } },

  // --- BRICS und weitere Partner ----------------------------------------------------------------------------------------------
  { id: "BRA", name: "Brasilien", dat: "Brasilien", akk: "Brasilien", kurz: "BR", iso: "BRA",
    text: "Gründungsmitglied der BRICS und Agrarmacht; wachsender Handel mit der Türkei (Nahrungsmittel, Stahl), im Verhältnis zu Ankara pragmatisch und blockfrei.",
    form: "demokratie", klasse: "aufstrebend", lager: "mitte", energie: 1, sitz: "Brasília", regierung: "die brasilianische Regierung", inLand: "in Brasilien",
    wahlen: [D("2030-10-06", "Präsidentenwahl")], krieg0: 0, amtsMonate0: 36,
    tr: { handel: 50, sicherheit: 25, vertrauen: 52, konflikt: 8 } },
  { id: "IND", name: "Indien", dat: "Indien", akk: "Indien", kurz: "IN", iso: "IND",
    text: "Bevölkerungsreichster Staat, Mitglied der BRICS und der Schanghaier Organisation: wichtiger Handelspartner, doch belastet durch die türkische Nähe zu Pakistan und die Kaschmir-Frage.",
    form: "demokratie", klasse: "aufstrebend", lager: "mitte", energie: -1, sitz: "Neu-Delhi", regierung: "die indische Regierung", inLand: "in Indien",
    wahlen: [D("2029-05-15", "Parlamentswahl")], krieg0: 5, amtsMonate0: 48,
    tr: { handel: 55, sicherheit: 22, vertrauen: 36, konflikt: 35 } },
  { id: "ZAF", name: "Südafrika", dat: "Südafrika", akk: "Südafrika", kurz: "ZA", iso: "ZAF",
    text: "BRICS- und G20-Mitglied und wirtschaftlicher Schwerpunkt Afrikas; diplomatisch ausgleichend, bei Gaza und im Globalen Süden häufig auf der Seite der Türkei.",
    form: "demokratie", klasse: "aufstrebend", lager: "mitte", energie: 0, sitz: "Pretoria", regierung: "die südafrikanische Regierung", inLand: "in Südafrika",
    wahlen: [D("2029-05-27", "Parlamentswahl")], krieg0: 0, amtsMonate0: 24,
    tr: { handel: 45, sicherheit: 25, vertrauen: 55, konflikt: 8 } },
  { id: "ETH", name: "Äthiopien", dat: "Äthiopien", akk: "Äthiopien", kurz: "ET", iso: "ETH",
    text: "Seit 2024 BRICS-Mitglied; die Türkei liefert Drohnen und bildet Soldaten aus, und Ankara vermittelte Ende 2024 im Streit mit Somalia um den Zugang zum Meer.",
    form: "hybrid", klasse: "fragil", lager: "mitte", energie: -1, sitz: "Addis Abeba", regierung: "die äthiopische Regierung", inLand: "in Äthiopien",
    wahlen: [D("2031-06-21", "Parlamentswahl")], krieg0: 20, amtsMonate0: 36,
    tr: { handel: 45, sicherheit: 55, vertrauen: 60, konflikt: 10 } },
  { id: "ARE", name: "Vereinigte Arabische Emirate", dat: "den Vereinigten Arabischen Emiraten", akk: "die Vereinigten Arabischen Emirate", kurz: "AE", iso: "ARE",
    text: "Wichtiger Investor und Handelspartner (rund 28 Milliarden Dollar Handel) und BRICS-Mitglied seit 2024; im Bruch mit Saudi-Arabien, sodass Ankara beide Kanäle gleichzeitig pflegen muss.",
    form: "monarchie", klasse: "aufstrebend", lager: "golf", energie: 1, sitz: "Abu Dhabi", regierung: "Abu Dhabi", inLand: "in den Emiraten",
    wahlen: [], krieg0: 8, amtsMonate0: 100,
    tr: { handel: 70, sicherheit: 50, vertrauen: 58, konflikt: 15 }, anker: { id: "SAU", kopplung: 0.1 } },
  { id: "IDN", name: "Indonesien", dat: "Indonesien", akk: "Indonesien", kurz: "ID", iso: "IDN",
    text: "Seit 2025 BRICS-Mitglied und größtes muslimisches Land der Welt; Rüstungskooperation mit der Türkei (Drohnen, Schiffe) und wachsender Handel.",
    form: "demokratie", klasse: "aufstrebend", lager: "mitte", energie: 1, sitz: "Jakarta", regierung: "die indonesische Regierung", inLand: "in Indonesien",
    wahlen: [D("2029-02-14", "Präsidentenwahl")], krieg0: 0, amtsMonate0: 20,
    tr: { handel: 50, sicherheit: 40, vertrauen: 62, konflikt: 8 } },
  { id: "QAT", name: "Katar", dat: "Katar", akk: "Katar", kurz: "QA", iso: "QAT",
    text: "Engster Golf-Partner Ankaras: türkische Militärbasis in Doha, gemeinsame Gaza-Vermittlung, Investitionen des Staatsfonds in der Türkei und Eurofighter-Abgabe an die Türkei; die Wirtschaft leidet unter dem Kriegsschaden an den Gasanlagen.",
    form: "monarchie", klasse: "aufstrebend", lager: "golf", energie: 1, sitz: "Doha", regierung: "Doha", inLand: "in Katar",
    wahlen: [], krieg0: 15, amtsMonate0: 100,
    tr: { handel: 60, sicherheit: 80, vertrauen: 80, konflikt: 5 }, anker: { id: "SAU", kopplung: 0.1 } },
  { id: "GBR", name: "Vereinigtes Königreich", dat: "dem Vereinigten Königreich", akk: "das Vereinigte Königreich", kurz: "GB", iso: "GBR",
    text: "Zweitgrößter Exportmarkt der Türkei und Pate des Eurofighter-Verkaufs; das erweiterte Freihandelsabkommen soll in der zweiten Jahreshälfte 2026 in Kraft treten. Garantiemacht für Zypern.",
    form: "demokratie", klasse: "fortgeschritten", lager: "west", energie: 0, sitz: "London", regierung: "die britische Regierung", inLand: "im Vereinigten Königreich",
    wahlen: [D("2029-07-05", "Unterhauswahl")], krieg0: 0, amtsMonate0: 24,
    tr: { handel: 70, sicherheit: 65, vertrauen: 55, konflikt: 15 }, anker: { id: "EU", kopplung: 0.15 } },
  { id: "PAK", name: "Pakistan", dat: "Pakistan", akk: "Pakistan", kurz: "PK", iso: "PAK",
    text: "Dritter im Beistandspakt von Mekka (August 2026, mit Saudi-Arabien und der Türkei); enge militärische Zusammenarbeit, Mitglied der Schanghaier Organisation.",
    form: "hybrid", klasse: "fragil", lager: "golf", energie: -1, sitz: "Islamabad", regierung: "die pakistanische Führung", inLand: "in Pakistan",
    wahlen: [D("2029-02-08", "Parlamentswahl")], krieg0: 25, amtsMonate0: 28,
    tr: { handel: 45, sicherheit: 80, vertrauen: 85, konflikt: 5 }, anker: { id: "SAU", kopplung: 0.2 } },
  { id: "UZB", name: "Usbekistan", dat: "Usbekistan", akk: "Usbekistan", kurz: "UZ", iso: "UZB",
    text: "Mitglied der Organisation der Turkstaaten und der Schanghaier Organisation: wachsender Handel mit der Türkei und Teil des Mittleren Korridors nach Zentralasien.",
    form: "autokratie", klasse: "aufstrebend", lager: "turk", energie: 0, sitz: "Taschkent", regierung: "die usbekische Führung", inLand: "in Usbekistan",
    wahlen: [D("2030-10-27", "Präsidentenwahl")], krieg0: 0, amtsMonate0: 100,
    tr: { handel: 55, sicherheit: 50, vertrauen: 70, konflikt: 6 }, anker: { id: "KAZ", kopplung: 0.35 } },
  { id: "KGZ", name: "Kirgisistan", dat: "Kirgisistan", akk: "Kirgisistan", kurz: "KG", iso: "KGZ",
    text: "Mitglied der Organisation der Turkstaaten; kauft türkische Drohnen und wird von türkischen Firmen mit Investitionen und Bauaufträgen bedacht.",
    form: "autokratie", klasse: "fragil", lager: "turk", energie: -1, sitz: "Bischkek", regierung: "die kirgisische Führung", inLand: "in Kirgisistan",
    wahlen: [D("2033-01-10", "Präsidentenwahl")], krieg0: 3, amtsMonate0: 70,
    tr: { handel: 45, sicherheit: 55, vertrauen: 70, konflikt: 6 }, anker: { id: "KAZ", kopplung: 0.35 } },
  { id: "TKM", name: "Turkmenistan", dat: "Turkmenistan", akk: "Turkmenistan", kurz: "TM", iso: "TKM",
    text: "Beobachter der Organisation der Turkstaaten und großer Erdgas-Lieferant; hält an seiner Neutralität fest und bleibt in Entscheidungen zurückhaltend.",
    form: "autokratie", klasse: "aufstrebend", lager: "turk", energie: 1, sitz: "Aschgabat", regierung: "die turkmenische Führung", inLand: "in Turkmenistan",
    wahlen: [], krieg0: 0, amtsMonate0: 100,
    tr: { handel: 45, sicherheit: 35, vertrauen: 55, konflikt: 10 }, anker: { id: "KAZ", kopplung: 0.2 } },
];

export const WEITERE_NACH_ID = new Map(WEITERE.map((d) => [d.id, d]));

/** Ersatzwerte der Startgrößen für Staaten ohne jungen Weltbank-Wert. Spielparameter: Größenordnungen, im Spiel nicht neu belegt. */
export const ERSATZ_WEITERE: Record<string, { wachstum?: number; inflation?: number; schulden?: number; ruestung?: number; defizit?: number }> = {
  NLD: { wachstum: 1.0, inflation: 3.0, schulden: 45, ruestung: 2.0, defizit: -2 },
  AUT: { wachstum: 0.5, inflation: 3.0, schulden: 78, ruestung: 0.9, defizit: -4 },
  SWE: { wachstum: 1.5, inflation: 2.0, schulden: 33, ruestung: 2.1, defizit: -1 },
  FRA: { schulden: 112 },
  ITA: { schulden: 137 },
  POL: { schulden: 55 },
  BGR: { schulden: 24 },
  ROU: { schulden: 55 },
  DEU: { schulden: 64 },
  IDN: { schulden: 40 },
  ETH: { wachstum: 6.5, inflation: 15, schulden: 40, ruestung: 0.6, defizit: -3 },
  ARE: { wachstum: 4.5, inflation: 2.0, schulden: 30, ruestung: 5, defizit: 2 },
  QAT: { wachstum: 2.5, inflation: 1.0, schulden: 40, ruestung: 7, defizit: 3 },
  PAK: { wachstum: 3.0, inflation: 6.0, schulden: 70, ruestung: 2.8, defizit: -6 },
  UZB: { wachstum: 6.0, inflation: 9.0, schulden: 35, ruestung: 1.5, defizit: -3 },
  KGZ: { wachstum: 6.5, inflation: 8.0, schulden: 45, ruestung: 3.0, defizit: -3 },
  TKM: { wachstum: 6.0, inflation: 6.0, schulden: 6, ruestung: 2.0, defizit: 0 },
};
