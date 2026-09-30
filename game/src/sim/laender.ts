// Die übrigen Länder als Akteure: Jedes hat einen Steckbrief, vier Beziehungsdimensionen (Handel, Sicherheit, Vertrauen, Konflikt),
// eigene Anliegen an die Türkei und Handlungen, die der Präsident ihm gegenüber wählen kann (AUSSENPOLITIK.md, Abschnitte 1 bis 4).
// Das Vertrauen ist keine eigene Zahl, sondern das Vertrauen im Politiknetz (beziehungen_*) plus ein Versatz für dieses Land, damit
// Maßnahmen wie „Annäherung an die EU“ und Handlungen gegenüber einem Land dieselbe Wirklichkeit bewegen. Die Startwerte sind
// Spielparameter aus der qualitativen Matrix des Konzepts (hoch, mittel, niedrig), keine gemessenen Zahlen.

import { NET } from "./modell";
import { nationalAverage, startAverage } from "./netz";
import { wirke, vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { pruefeBedingung, type Bedingung } from "./programme";
import { zusageAnlegen } from "./ereignis-hilfen";
import type { World } from "./types";
import { kannZahlen } from "./kapital";
import type { Vertrag } from "./abkommen-typen";

export type Dimension = "handel" | "sicherheit" | "vertrauen" | "konflikt";
export type AktionId = "gipfel" | "handel" | "ruestung" | "druck" | "entspannen" | "hilfe";

export type LandBedingung = Bedingung | { art: "land"; dim: Dimension; min?: number; max?: number };

export interface Anliegen {
  id: string;
  titel: string;
  text: string;
  bedingung: LandBedingung;
}

export interface LandDef {
  id: string;
  name: string;
  /** „mit …“, „zu …“ (Dativ) und „auf …“, „für …“ (Akkusativ) mit Artikel */
  dat: string;
  akk: string;
  kurz: string;
  gruppe: "Große Mächte" | "Verbündete und Partner" | "Nachbarn";
  /** ISO-Kürzel für Weltbank-Daten und Karte (die EU steht für Deutschland als Maßstab) */
  iso: string;
  wdi?: string;
  text: string;
  knoten: string;
  /** Wie stark eine Handlung gegenüber diesem Land den Knoten bewegt (0 bis 1) */
  anteil: number;
  start: Record<Dimension, number>;
  anliegen: Anliegen[];
  aktionen: AktionId[];
}

const A = (id: string, titel: string, text: string, bedingung: LandBedingung): Anliegen => ({ id, titel, text, bedingung });

export const LAENDER: LandDef[] = [
  {
    id: "USA", dat: "den Vereinigten Staaten", akk: "die Vereinigten Staaten", name: "Vereinigte Staaten", kurz: "US", gruppe: "Große Mächte", iso: "USA", wdi: "USA", knoten: "beziehungen_usa", anteil: 1,
    text: "NATO-Verbündeter mit Stützpunkt in Incirlik und wichtigster Rüstungslieferant, zugleich im Streit um das russische Luftabwehrsystem S-400 und den Ausschluss der Türkei vom F-35-Programm.",
    start: { handel: 70, sicherheit: 65, vertrauen: 45, konflikt: 55 },
    anliegen: [
      A("usa-nato", "Ein fairer Anteil in der NATO", "Washington erwartet, dass die Türkei ihren Beitrag zur Verteidigung leistet.", { art: "massnahme", id: "m_verteidigung", min: 55 }),
      A("usa-grenze", "Sichere Südgrenze", "Kontrolle über die Grenze zu Syrien und den Kampf gegen Terrornetzwerke.", { art: "massnahme", id: "m_grenzschutz", min: 60 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "druck", "entspannen"],
  },
  {
    id: "EU", dat: "der Europäischen Union", akk: "die Europäische Union", name: "Europäische Union", kurz: "EU", gruppe: "Große Mächte", iso: "DEU", wdi: "DEU", knoten: "beziehungen_eu", anteil: 1,
    text: "Größter Handelspartner und Zollunionspartner der Türkei; die Beitrittsgespräche liegen seit Jahren auf Eis. Brüssel verlangt Fortschritte bei Rechtsstaat und Grundrechten, Ankara Visafreiheit und eine modernisierte Zollunion.",
    start: { handel: 90, sicherheit: 55, vertrauen: 40, konflikt: 45 },
    anliegen: [
      A("eu-recht", "Unabhängige Justiz", "Ein Richterrat, der nicht der Regierung untersteht, ist die Vorbedingung für alles Weitere.", { art: "massnahme", id: "m_justizreform", min: 55 }),
      A("eu-medien", "Freie Medien", "Die Medienaufsicht soll nur bei Straftaten eingreifen.", { art: "massnahme-max", id: "m_medienaufsicht", max: 50 }),
      A("eu-annaeherung", "Ernsthafte Annäherung", "Reformen für Visafreiheit und eine modernisierte Zollunion.", { art: "massnahme", id: "m_eu_annaeherung", min: 55 }),
    ],
    aktionen: ["gipfel", "handel", "druck", "entspannen"],
  },
  {
    id: "RUS", dat: "Russland", akk: "Russland", name: "Russland", kurz: "RU", gruppe: "Große Mächte", iso: "RUS", wdi: "RUS", knoten: "beziehungen_russland", anteil: 1,
    text: "Wichtiger Lieferant von Erdgas, Bauherr des ersten Kernkraftwerks Akkuyu und größter Touristenlieferant; zugleich Gegenspieler in Syrien, im Schwarzen Meer und im Krieg gegen die Ukraine, den Ankara zu vermitteln versucht.",
    start: { handel: 75, sicherheit: 40, vertrauen: 45, konflikt: 50 },
    anliegen: [
      A("rus-akkuyu", "Akkuyu vollenden", "Das Kernkraftwerk soll ans Netz gehen und weitere Vorhaben folgen.", { art: "massnahme", id: "m_kernkraft", min: 50 }),
      A("rus-handel", "Offene Märkte", "Handel und Tourismus ohne neue Hürden, vor allem keine höheren Zölle.", { art: "massnahme-max", id: "m_zoelle", max: 45 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "druck", "entspannen"],
  },
  {
    id: "GRC", dat: "Griechenland", akk: "Griechenland", name: "Griechenland", kurz: "GR", gruppe: "Nachbarn", iso: "GRC", wdi: "GRC", knoten: "beziehungen_eu", anteil: 0.4,
    text: "NATO-Verbündeter und Nachbar in der Ägäis; Streit um Seegrenzen, Luftraum, Inselstatus und Zypern, dazu Migration über die Ägäis. Zwischen den Krisen bestehen Deeskalationskanäle.",
    start: { handel: 40, sicherheit: 30, vertrauen: 30, konflikt: 65 },
    anliegen: [
      A("grc-aegaeis", "Ruhe in der Ägäis", "Keine Provokationen zu Wasser und in der Luft; Gespräche über die Seegrenzen.", { art: "land", dim: "konflikt", max: 50 }),
      A("grc-migration", "Kontrollierte Migration", "Die Türkei soll den Weg über die Ägäis besser sichern.", { art: "massnahme", id: "m_grenzschutz", min: 60 }),
    ],
    aktionen: ["gipfel", "druck", "entspannen"],
  },
  {
    id: "IRN", dat: "dem Iran", akk: "den Iran", name: "Iran", kurz: "IR", gruppe: "Nachbarn", iso: "IRN", wdi: "IRN", knoten: "beziehungen_nahost", anteil: 0.3,
    text: "Große Nachbarmacht im Osten: Handelspartner und Gaslieferant, Konkurrent um Einfluss im Irak und in Syrien, mit gemeinsamen Interessen gegen kurdische Aufstände.",
    start: { handel: 55, sicherheit: 40, vertrauen: 40, konflikt: 45 },
    anliegen: [
      A("irn-handel", "Handel trotz Sanktionen", "Teheran will, dass Ankara den Handel nicht den Sanktionen opfert.", { art: "land", dim: "handel", min: 55 }),
      A("irn-gas", "Gas und Wasser", "Verlässliche Lieferungen und ein sachlicher Umgang mit Grenzflüssen.", { art: "land", dim: "vertrauen", min: 45 }),
    ],
    aktionen: ["gipfel", "handel", "druck", "entspannen"],
  },
  {
    id: "SYR", dat: "Syrien", akk: "Syrien", name: "Syrien", kurz: "SY", gruppe: "Nachbarn", iso: "SYR", wdi: "SYR", knoten: "beziehungen_nahost", anteil: 0.3,
    text: "Nachbar im Süden nach Jahren des Krieges: Sicherheitsfragen an der Grenze, Millionen Geflüchtete in der Türkei, Einfluss im Norden des Landes und die Frage der Rückkehr.",
    start: { handel: 35, sicherheit: 20, vertrauen: 25, konflikt: 75 },
    anliegen: [
      A("syr-rueckkehr", "Rückkehr ermöglichen", "Ein Programm für die Rückkehr von Geflüchteten mit Wiederaufbauhilfe.", { art: "massnahme", id: "m_rueckkehr", min: 55 }),
      A("syr-grenze", "Ruhe an der Grenze", "Keine Eskalation im Grenzgebiet.", { art: "land", dim: "konflikt", max: 60 }),
    ],
    aktionen: ["gipfel", "hilfe", "druck", "entspannen"],
  },
  {
    id: "IRQ", dat: "dem Irak", akk: "den Irak", name: "Irak", kurz: "IQ", gruppe: "Nachbarn", iso: "IRQ", wdi: "IRQ", knoten: "beziehungen_nahost", anteil: 0.3,
    text: "Nachbar im Südosten: Öl-Pipeline nach Ceyhan, Streit um das Wasser von Euphrat und Tigris, türkische Militäreinsätze im Norden gegen die PKK und ein wichtiger Markt für Bauunternehmen.",
    start: { handel: 60, sicherheit: 35, vertrauen: 40, konflikt: 55 },
    anliegen: [
      A("irq-wasser", "Mehr Wasser flussabwärts", "Bagdad verlangt Abflussmengen aus den türkischen Staudämmen.", { art: "land", dim: "vertrauen", min: 45 }),
      A("irq-souveraenitaet", "Achtung der Grenzen", "Weniger Militäreinsätze auf irakischem Gebiet.", { art: "land", dim: "konflikt", max: 50 }),
    ],
    aktionen: ["gipfel", "handel", "hilfe", "entspannen"],
  },
  {
    id: "AZE", dat: "Aserbaidschan", akk: "Aserbaidschan", name: "Aserbaidschan", kurz: "AZ", gruppe: "Verbündete und Partner", iso: "AZE", wdi: "AZE", knoten: "beziehungen_nahost", anteil: 0.2,
    text: "Engster Partner im Kaukasus, „eine Nation, zwei Staaten“: Gas über die Pipelines TANAP und TAP, Rüstungszusammenarbeit und ein Korridor nach Zentralasien.",
    start: { handel: 75, sicherheit: 85, vertrauen: 85, konflikt: 15 },
    anliegen: [
      A("aze-korridor", "Der Korridor nach Osten", "Verkehrswege und Bahn nach Zentralasien.", { art: "massnahme", id: "m_bahn", min: 50 }),
      A("aze-gas", "Gasabnahme", "Verlässliche Abnahme aserbaidschanischen Gases.", { art: "land", dim: "handel", min: 70 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "hilfe"],
  },
  {
    id: "ARM", dat: "Armenien", akk: "Armenien", name: "Armenien", kurz: "AM", gruppe: "Nachbarn", iso: "ARM", wdi: "ARM", knoten: "ansehen", anteil: 0.2,
    text: "Nachbar im Osten, dessen Grenze zur Türkei seit Langem geschlossen ist; Normalisierungsgespräche laufen, belastet vom Karabach-Konflikt und dem Streit um die Bewertung von 1915.",
    start: { handel: 20, sicherheit: 25, vertrauen: 30, konflikt: 55 },
    anliegen: [
      A("arm-grenze", "Die Grenze öffnen", "Diplomatische Beziehungen und ein offener Übergang.", { art: "land", dim: "vertrauen", min: 45 }),
      A("arm-frieden", "Frieden im Kaukasus", "Keine einseitige Parteinahme im Streit mit Aserbaidschan.", { art: "land", dim: "konflikt", max: 45 }),
    ],
    aktionen: ["gipfel", "entspannen", "hilfe"],
  },
  {
    id: "SAU", dat: "Saudi-Arabien und den Golfstaaten", akk: "Saudi-Arabien und die Golfstaaten", name: "Saudi-Arabien und Golfstaaten", kurz: "GO", gruppe: "Verbündete und Partner", iso: "SAU", wdi: "SAU", knoten: "beziehungen_nahost", anteil: 0.5,
    text: "Wichtige Geldgeber und Investoren: nach Jahren der Spannung (Katar-Blockade, Khashoggi) wieder eng, mit Krediten, Einlagen und Bauaufträgen.",
    start: { handel: 55, sicherheit: 50, vertrauen: 55, konflikt: 30 },
    anliegen: [
      A("sau-invest", "Ein verlässliches Investitionsklima", "Rechtssicherheit für Geld aus dem Golf.", { art: "massnahme", id: "m_justizreform", min: 45 }),
      A("sau-partner", "Partnerschaft statt Konkurrenz", "Abstimmung in der Region.", { art: "land", dim: "vertrauen", min: 60 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "hilfe"],
  },
  {
    id: "ISR", dat: "Israel", akk: "Israel", name: "Israel", kurz: "IL", gruppe: "Nachbarn", iso: "ISR", wdi: "ISR", knoten: "beziehungen_nahost", anteil: 0.3,
    text: "Handelspartner mit belasteten politischen Beziehungen: Der Krieg in Gaza, die Frage der Palästinenser und Streit um Einfluss in der Region bestimmen den Ton.",
    start: { handel: 50, sicherheit: 25, vertrauen: 30, konflikt: 60 },
    anliegen: [
      A("isr-handel", "Wirtschaft von Politik trennen", "Handel und Energie sollen vom politischen Streit unberührt bleiben.", { art: "land", dim: "handel", min: 50 }),
      A("isr-ruhe", "Weniger Schärfe", "Ein gemäßigterer Ton.", { art: "land", dim: "konflikt", max: 55 }),
    ],
    aktionen: ["gipfel", "handel", "druck", "entspannen"],
  },
  {
    id: "CHN", dat: "China", akk: "China", name: "China", kurz: "CN", gruppe: "Große Mächte", iso: "CHN", wdi: "CHN", knoten: "ansehen", anteil: 0.3,
    text: "Wichtiger Lieferant von Vorprodukten und Investor („Neue Seidenstraße“, Mittlerer Korridor); die Handelsbilanz ist stark einseitig, und die Lage der Uiguren belastet das Verhältnis.",
    start: { handel: 75, sicherheit: 30, vertrauen: 45, konflikt: 30 },
    anliegen: [
      A("chn-invest", "Offene Türen für Investitionen", "Chinesische Firmen in Infrastruktur und Industrie.", { art: "massnahme", id: "m_investitionsanreize", min: 45 }),
      A("chn-korridor", "Der Mittlere Korridor", "Bahn und Häfen als Landbrücke.", { art: "massnahme", id: "m_bahn", min: 50 }),
    ],
    aktionen: ["gipfel", "handel", "druck"],
  },
  {
    id: "UKR", dat: "der Ukraine", akk: "die Ukraine", name: "Ukraine", kurz: "UA", gruppe: "Nachbarn", iso: "UKR", wdi: "UKR", knoten: "ansehen", anteil: 0.25,
    text: "Nachbar über das Schwarze Meer, seit dem russischen Angriff im Krieg: Ankara liefert Drohnen, hält die Meerengen und vermittelte das Getreideabkommen, pflegt aber zugleich enge Beziehungen zu Moskau und sanktioniert es nicht.",
    start: { handel: 55, sicherheit: 60, vertrauen: 60, konflikt: 15 },
    anliegen: [
      A("ukr-meerengen", "Die Meerengen geschlossen halten", "Keine Kriegsschiffe durch Bosporus und Dardanellen, wie der Vertrag von Montreux es erlaubt.", { art: "massnahme", id: "m_verteidigung", min: 50 }),
      A("ukr-vermittlung", "Ein ehrlicher Vermittler", "Ankara soll sich nicht auf die Seite Moskaus schlagen.", { art: "land", dim: "vertrauen", min: 55 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "hilfe"],
  },
  {
    id: "GEO", dat: "Georgien", akk: "Georgien", name: "Georgien", kurz: "GE", gruppe: "Nachbarn", iso: "GEO", wdi: "GEO", knoten: "ansehen", anteil: 0.15,
    text: "Kleiner Nachbar im Nordosten: Transitland für Erdgas und Öl (Baku-Tiflis-Ceyhan), Bahnstrecke nach Baku, mit russischen Truppen in Abchasien und Südossetien und einem Streit über den Weg nach Westen.",
    start: { handel: 65, sicherheit: 60, vertrauen: 65, konflikt: 20 },
    anliegen: [
      A("geo-transit", "Verlässlicher Transit", "Pipelines und die Bahn nach Baku bleiben offen und werden ausgebaut.", { art: "massnahme", id: "m_bahn", min: 50 }),
      A("geo-westen", "Rückhalt auf dem Weg nach Westen", "Georgien will Unterstützung, nicht Belehrung.", { art: "land", dim: "vertrauen", min: 60 }),
    ],
    aktionen: ["gipfel", "handel", "hilfe"],
  },
  {
    id: "EGY", dat: "Ägypten", akk: "Ägypten", name: "Ägypten", kurz: "EG", gruppe: "Verbündete und Partner", iso: "EGY", wdi: "EGY", knoten: "beziehungen_nahost", anteil: 0.25,
    text: "Große arabische Macht am südöstlichen Mittelmeer: nach Jahren der Entfremdung (Sturz der Muslimbrüder 2013) im Gespräch über Normalisierung, im Streit um Seegrenzen und Gasfelder, im Wettbewerb um Einfluss in Libyen und Gaza.",
    start: { handel: 55, sicherheit: 35, vertrauen: 40, konflikt: 45 },
    anliegen: [
      A("egy-gas", "Ein Ausgleich im Mittelmeer", "Seegrenzen und Gasfelder ohne Konfrontation.", { art: "land", dim: "konflikt", max: 40 }),
      A("egy-libyen", "Gemeinsame Linie in Libyen", "Abstimmung statt Stellvertreterkonkurrenz.", { art: "land", dim: "vertrauen", min: 50 }),
    ],
    aktionen: ["gipfel", "handel", "entspannen", "druck"],
  },
  {
    id: "LBY", dat: "Libyen", akk: "Libyen", name: "Libyen", kurz: "LY", gruppe: "Verbündete und Partner", iso: "LBY", knoten: "beziehungen_nahost", anteil: 0.15,
    text: "Seit 2011 ein geteiltes Land: Ankara stützt die Regierung in Tripolis mit Ausbildern und Drohnen und schloss 2019 ein Memorandum über Seegrenzen im östlichen Mittelmeer, das Griechenland, Ägypten und Zypern ablehnen.",
    start: { handel: 45, sicherheit: 55, vertrauen: 55, konflikt: 35 },
    anliegen: [
      A("lby-seegrenze", "Das Seegrenz-Memorandum halten", "Tripolis will, dass Ankara zu dem Abkommen von 2019 steht.", { art: "land", dim: "vertrauen", min: 50 }),
      A("lby-truppen", "Ausbildung und Drohnen", "Militärische Hilfe für die Streitkräfte in Tripolis.", { art: "land", dim: "sicherheit", min: 50 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "hilfe"],
  },
  {
    id: "KAZ", dat: "Kasachstan", akk: "Kasachstan", name: "Kasachstan", kurz: "KZ", gruppe: "Verbündete und Partner", iso: "KAZ", knoten: "ansehen", anteil: 0.1,
    text: "Größter Staat Zentralasiens und Mitglied der Organisation der Turkstaaten: Transitland am Mittleren Korridor zwischen China und Europa, Öl- und Gasexporteur, mit türkischen Bauunternehmen im Land; zugleich eng an Moskau und Peking gebunden.",
    start: { handel: 55, sicherheit: 40, vertrauen: 65, konflikt: 10 },
    anliegen: [
      A("kaz-korridor", "Der Mittlere Korridor", "Bahn und Häfen als Landbrücke nach Europa, an Russland vorbei.", { art: "massnahme", id: "m_bahn", min: 50 }),
      A("kaz-partner", "Partnerschaft unter Turkstaaten", "Verlässliche Abstimmung im Kreis der Turkstaaten.", { art: "land", dim: "vertrauen", min: 55 }),
    ],
    aktionen: ["gipfel", "handel", "hilfe"],
  },
  {
    id: "CYP", dat: "Zypern", akk: "Zypern", name: "Zypern", kurz: "CY", gruppe: "Nachbarn", iso: "CYP", knoten: "beziehungen_eu", anteil: 0.2,
    text: "EU-Mitglied und geteilte Insel: Im Norden besteht die nur von der Türkei anerkannte Türkische Republik Nordzypern. Strittig sind Seegrenzen und Gasfelder, Häfen und Flughäfen, Varosha und die Frage von zwei Staaten oder einer Föderation.",
    start: { handel: 15, sicherheit: 15, vertrauen: 20, konflikt: 75 },
    anliegen: [
      A("cyp-hafen", "Häfen und Flughäfen öffnen", "Schiffe und Flugzeuge der Republik Zypern sollen türkische Häfen und Flughäfen nutzen dürfen.", { art: "land", dim: "vertrauen", min: 45 }),
      A("cyp-ruhe", "Keine Bohrschiffe, keine Provokation", "Ruhe in den Gewässern rund um die Insel.", { art: "land", dim: "konflikt", max: 55 }),
    ],
    aktionen: ["gipfel", "entspannen", "druck"],
  },
];

const LAND = new Map(LAENDER.map((l) => [l.id, l]));
export const land = (id: string): LandDef => {
  const l = LAND.get(id);
  if (!l) throw new Error(`Unbekanntes Land: ${id}`);
  return l;
};

export interface AktionDef {
  id: AktionId;
  label: string;
  hinweis: string;
  pk: number;
  abkuehlung: number;
}

export const AKTIONEN: Record<AktionId, AktionDef> = {
  gipfel: { id: "gipfel", label: "Gipfeltreffen", hinweis: "Ein Treffen auf höchster Ebene schafft Vertrauen und öffnet Türen; je besser das Verhältnis schon ist, desto weniger bringt es.", pk: 3, abkuehlung: 120 },
  handel: { id: "handel", label: "Handelsabkommen", hinweis: "Zölle sinken, Lieferketten werden verlässlicher; oft verlangt die Gegenseite dafür etwas.", pk: 5, abkuehlung: 180 },
  ruestung: { id: "ruestung", label: "Rüstungsgeschäft", hinweis: "Sicherheitspartnerschaft und Aufträge; andere Mächte sehen es genau.", pk: 4, abkuehlung: 150 },
  druck: { id: "druck", label: "Öffentlich Druck machen", hinweis: "Beifall zu Hause, Ärger im Ausland.", pk: 2, abkuehlung: 60 },
  entspannen: { id: "entspannen", label: "Konflikt entschärfen", hinweis: "Gespräche über Streitpunkte; das Land will dafür ein Zeichen des Entgegenkommens.", pk: 4, abkuehlung: 120 },
  hilfe: { id: "hilfe", label: "Wirtschaftshilfe und Wiederaufbau", hinweis: "Investitionen und Aufbauhilfe binden ein Land enger an die Türkei.", pk: 4, abkuehlung: 150 },
};

export interface LandZustand {
  handel: number;
  sicherheit: number;
  konflikt: number;
  /** Versatz zum Vertrauen im Politiknetz für dieses Land */
  versatz: number;
  /** Letzter Tag je Handlung (Abkühlzeit) */
  zuletzt: Partial<Record<AktionId, number>>;
  /** Kurze Erinnerung an das, was zwischen den Ländern geschah, neueste zuletzt */
  erinnerung: string[];
  /** Abgeschlossene Abkommen */
  abkommen: string[];
  /** Verträge des Verhandlungstisches (laufende und beendete) */
  vertraege?: Vertrag[];
  /** Erinnerung an gebrochene Verträge: drückt die Bewertung späterer Angebote, klingt langsam ab */
  bruch?: number;
  /** Wie viele Verträge bis zum Ende gehalten wurden */
  gehalten?: number;
  /** Bis zu diesem Tag verhandelt das Land nicht mit der Türkei (nach einer Zurückweisung) */
  sperreBis?: number;
}

export function weltZustand(w: World): Record<string, LandZustand> {
  const spiel = w.spiel!;
  if (!spiel.welt) {
    spiel.welt = {};
    for (const l of LAENDER) {
      const knoten = startAverage(NET, w.net, l.knoten);
      spiel.welt[l.id] = { handel: l.start.handel, sicherheit: l.start.sicherheit, konflikt: l.start.konflikt, versatz: clamp(l.start.vertrauen - knoten, -45, 45), zuletzt: {}, erinnerung: [], abkommen: [] };
    }
  }
  for (const l of LAENDER) spiel.welt[l.id] ??= { handel: l.start.handel, sicherheit: l.start.sicherheit, konflikt: l.start.konflikt, versatz: 0, zuletzt: {}, erinnerung: [], abkommen: [] };
  return spiel.welt;
}

/** Das Vertrauen eines Landes: das Vertrauen im Politiknetz plus der Versatz für dieses Land. */
export function vertrauenZu(w: World, id: string): number {
  const l = land(id);
  const z = weltZustand(w)[id]!;
  return clamp(nationalAverage(NET, w.net, l.knoten) + z.versatz, 0, 100);
}

export function dimensionZu(w: World, id: string, dim: Dimension): number {
  const z = weltZustand(w)[id]!;
  return dim === "vertrauen" ? vertrauenZu(w, id) : z[dim];
}

export function haltungWort(w: World, id: string): string {
  const v = vertrauenZu(w, id);
  const k = weltZustand(w)[id]!.konflikt;
  if (v >= 75) return "enger Partner";
  if (v >= 55 && k < 50) return "Partner";
  if (v >= 40) return k >= 60 ? "angespannt" : "nüchtern";
  if (v >= 25) return "kühl";
  return "feindselig";
}

export interface AnliegenStand {
  anliegen: Anliegen;
  erfuellt: boolean;
  text: string;
  fortschritt: number;
}

export function anliegenStand(w: World, id: string): AnliegenStand[] {
  return land(id).anliegen.map((a) => {
    const b = a.bedingung;
    if (b.art === "land") {
      const jetzt = dimensionZu(w, id, b.dim);
      const namen: Record<Dimension, string> = { handel: "Handel", sicherheit: "Sicherheit", vertrauen: "Vertrauen", konflikt: "Konflikt" };
      const ok = (b.min === undefined || jetzt >= b.min) && (b.max === undefined || jetzt <= b.max);
      return { anliegen: a, erfuellt: ok, text: `${namen[b.dim]} ${b.min !== undefined ? `mindestens ${b.min}` : `höchstens ${b.max}`} (jetzt ${Math.round(jetzt)})`, fortschritt: ok ? 1 : 0.4 };
    }
    const s = pruefeBedingung(w, b);
    return { anliegen: a, erfuellt: s.erfuellt, text: s.text, fortschritt: s.fortschritt };
  });
}

export interface AktionSicht {
  aktion: AktionDef;
  moeglich: boolean;
  grund?: string;
}

export function aktionenFuer(w: World, id: string): AktionSicht[] {
  const l = land(id);
  const z = weltZustand(w)[id]!;
  const spiel = w.spiel!;
  return l.aktionen.map((a) => {
    const def = AKTIONEN[a];
    const rest = (z.zuletzt[a] ?? -1e9) + def.abkuehlung - w.day;
    let grund: string | undefined;
    if (rest > 0) grund = `Wieder möglich in ${rest} Tagen.`;
    else if (!kannZahlen(spiel.kapital, def.pk)) grund = "Dafür fehlt Kapital.";
    else if (a === "handel" && vertrauenZu(w, id) < 40) grund = "Dafür ist das Vertrauen noch zu gering.";
    else if (a === "ruestung" && z.sicherheit < 35) grund = "Dafür ist die Sicherheitszusammenarbeit zu dünn.";
    else if (a === "entspannen" && z.konflikt < 30) grund = "Es gibt keinen Streit, der entschärft werden müsste.";
    else if (a === "gipfel" && z.konflikt >= 80) grund = "Solange der Konflikt so heftig ist, kommt kein Treffen zustande.";
    else if (a === "gipfel" && vertrauenZu(w, id) >= 82) grund = "Das Verhältnis ist so gut, wie es allein durch Treffen wird; jetzt zählen Taten.";
    else if (a === "hilfe" && z.handel >= 88 && vertrauenZu(w, id) >= 82) grund = "Mehr Hilfe würde das Verhältnis nicht mehr verbessern.";
    return { aktion: def, moeglich: !grund, ...(grund ? { grund } : {}) };
  });
}

/** Wirkung auf ein Land: Dimension und Netzknoten zugleich, damit beides eine Wirklichkeit bleibt. */
export function landAendern(w: World, id: string, delta: Partial<Record<Dimension, number>>, notiz?: string): void {
  const l = land(id);
  const z = weltZustand(w)[id]!;
  // Abnehmender Ertrag: Wer schon nah an 100 ist, gewinnt mit jeder Geste weniger; Verluste kommen ungebremst
  const ertrag = (dim: Dimension, d: number): number => (d > 0 ? d * clamp((100 - dimensionZu(w, id, dim)) / 55, 0.1, 1.2) : d);
  if (delta.handel) delta = { ...delta, handel: ertrag("handel", delta.handel) };
  if (delta.sicherheit) delta = { ...delta, sicherheit: ertrag("sicherheit", delta.sicherheit) };
  if (delta.vertrauen) delta = { ...delta, vertrauen: ertrag("vertrauen", delta.vertrauen) };
  if (delta.handel) z.handel = clamp(z.handel + delta.handel, 0, 100);
  if (delta.sicherheit) z.sicherheit = clamp(z.sicherheit + delta.sicherheit, 0, 100);
  if (delta.konflikt) z.konflikt = clamp(z.konflikt + delta.konflikt, 0, 100);
  if (delta.vertrauen) {
    z.versatz = clamp(z.versatz + delta.vertrauen * 0.6, -60, 60);
    wirke(w, l.knoten, delta.vertrauen * 0.4 * l.anteil);
  }
    if (notiz) {
    z.erinnerung.push(`${w.date}: ${notiz}`);
    if (z.erinnerung.length > 6) z.erinnerung.shift();
  }
}

const GEGENSPIELER: Record<string, string[]> = { USA: ["RUS", "CHN"], RUS: ["USA", "UKR"], CHN: ["USA"], GRC: ["EU"], ARM: ["AZE"], AZE: ["ARM"], UKR: ["RUS"] };

export function fuehreAktionAus(w: World, id: string, aktion: AktionId): { ok: boolean; text: string; why?: string } {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: "Ohne Spielschleife gibt es keine Außenpolitik." };
  const l = land(id);
  const sicht = aktionenFuer(w, id).find((x) => x.aktion.id === aktion);
  if (!sicht) return { ok: false, text: "Diese Handlung gibt es diesem Land gegenüber nicht." };
  if (!sicht.moeglich) return { ok: false, text: sicht.grund ?? "Das geht gerade nicht." };
  const def = sicht.aktion;
  const z = weltZustand(w)[id]!;
  spiel.kapital -= def.pk;
  z.zuletzt[aktion] = w.day;
  let text = "";
  let why = "";
  switch (aktion) {
    case "gipfel":
      landAendern(w, id, { vertrauen: 8, konflikt: -3 }, "Gipfeltreffen");
      wirke(w, "ansehen", 1);
      text = `Gipfeltreffen mit ${l.dat}: Das Verhältnis wird wärmer (Vertrauen ${Math.round(vertrauenZu(w, id))}).`;
      why = `Kostet ${def.pk} Kapital. Fotos und Zusagen kosten nichts, gehalten werden müssen sie trotzdem.`;
      break;
    case "handel": {
      landAendern(w, id, { handel: 12, vertrauen: 3 }, "Handelsabkommen");
      wirke(w, "export", 2);
      wirke(w, "auslandskapital", 1);
      z.abkommen.push(`Handelsabkommen ${w.date.slice(0, 4)}`);
      text = `Handelsabkommen mit ${l.dat}: Der Handel wächst (Handel ${Math.round(z.handel)}).`;
      why = `Kostet ${def.pk} Kapital.`;
      if (id === "EU") {
        zusageAnlegen(w, { von: "EU-Kommission", text: "Der EU wurde Fortschritt bei der Justizreform zugesagt", tage: 240, massnahme: "m_justizreform" });
        why += " Brüssel erwartet als Gegenleistung Fortschritte bei der Justizreform (Zusage in acht Monaten).";
      } else if (id === "USA") {
        zusageAnlegen(w, { von: "US-Regierung", text: "Den USA wurde ein größerer Beitrag zur NATO zugesagt", tage: 240, massnahme: "m_verteidigung" });
        why += " Washington erwartet einen größeren Beitrag zur NATO (Zusage in acht Monaten).";
      }
      break;
    }
    case "ruestung":
      landAendern(w, id, { sicherheit: 12, vertrauen: 4 }, "Rüstungsgeschäft");
      wirke(w, "militaer", 2);
      w.economy.debtRatio += 0.1;
      for (const g of GEGENSPIELER[id] ?? []) landAendern(w, g, { vertrauen: -6 }, `Türkisches Rüstungsgeschäft mit ${l.dat}`);
      text = `Rüstungsgeschäft mit ${l.dat}: Die Zusammenarbeit wächst (Sicherheit ${Math.round(z.sicherheit)}).`;
      why = `Kostet ${def.pk} Kapital und etwa 0,1 % des BIP.${(GEGENSPIELER[id] ?? []).length ? ` ${(GEGENSPIELER[id] ?? []).map((g) => land(g).name).join(" und ")} sieht das mit Sorge.` : ""}`;
      break;
    case "druck":
      landAendern(w, id, { vertrauen: -8, konflikt: 6 }, "Öffentlicher Druck aus Ankara");
      wirke(w, "konservative", 1);
      vertrauenAendern(w, 0.5);
      text = `Ankara macht öffentlich Druck auf ${l.akk}: Zu Hause gibt es Beifall, im Ausland Ärger.`;
      why = `Kostet ${def.pk} Kapital.`;
      break;
    case "entspannen":
      landAendern(w, id, { konflikt: -12, vertrauen: 4 }, "Gespräche über Streitpunkte");
      wirke(w, "konservative", -0.5);
      text = `Gespräche mit ${l.dat} entschärfen den Streit (Konflikt ${Math.round(z.konflikt)}).`;
      why = `Kostet ${def.pk} Kapital. Nationalisten zu Hause sehen darin Schwäche.`;
      break;
    case "hilfe":
      landAendern(w, id, { vertrauen: 6, handel: 8, konflikt: -4 }, "Wirtschaftshilfe und Wiederaufbau");
      w.economy.debtRatio += 0.1;
      wirke(w, "bauwirtschaft", 1);
      text = `Wirtschaftshilfe für ${l.akk}: Das Land rückt näher (Vertrauen ${Math.round(vertrauenZu(w, id))}).`;
      why = `Kostet ${def.pk} Kapital und etwa 0,1 % des BIP; türkische Bauunternehmen bekommen Aufträge.`;
      break;
  }
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Einmal im Monat: Konflikte kühlen ab oder schwelen; zufriedene Länder werden warm. */
export function weltMonat(w: World): void {
  if (!w.spiel) return;
  const z = weltZustand(w);
  for (const l of LAENDER) {
    const s = z[l.id]!;
    s.konflikt = clamp(s.konflikt + Math.sign(l.start.konflikt - s.konflikt) * Math.min(1, Math.abs(l.start.konflikt - s.konflikt)), 0, 100);
    const stand = anliegenStand(w, l.id);
    const erfuellt = stand.filter((x) => x.erfuellt).length;
    if (erfuellt === stand.length) s.versatz = clamp(s.versatz + 0.8, -60, 60);
    else if (erfuellt === 0) s.versatz = clamp(s.versatz - 0.3, -60, 60);
  }
}
