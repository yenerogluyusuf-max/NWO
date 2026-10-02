// Die übrigen Länder als Akteure: Jedes hat einen Steckbrief, vier Beziehungsdimensionen (Handel, Sicherheit, Vertrauen, Konflikt),
// eigene Anliegen an die Türkei und Handlungen, die der Präsident ihm gegenüber wählen kann (AUSSENPOLITIK.md, Abschnitte 1 bis 4).
// Das Vertrauen ist keine eigene Zahl, sondern das Vertrauen im Politiknetz (beziehungen_*) plus ein Versatz für dieses Land, damit
// Maßnahmen wie „Annäherung an die EU“ und Handlungen gegenüber einem Land dieselbe Wirklichkeit bewegen. Die Startwerte sind
// Spielparameter aus der qualitativen Matrix des Konzepts (hoch, mittel, niedrig), keine gemessenen Zahlen.
// Kalibrierung Stand 30.09.2026: RECHERCHE_REALWELT_LAENDERDOSSIERS.md, Teil III „Beziehungsmatrix 2026“ (Handel/Sicherheit/Vertrauen/
// Konflikt, jeweils 0–100); der Quellen-Kommentar steht direkt am Startwert des Landes, der alte Wert in Klammern dahinter.

import { NET } from "./modell";
import { nationalAverage, startAverage } from "./netz";
import { wirke, vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { pruefeBedingung, type Bedingung } from "./programme";
import { zusageAnlegen } from "./ereignis-hilfen";
import type { World } from "./types";
import { kannZahlen } from "./kapital";
import { AUFMERKSAMKEIT_KOSTEN, neuanfangGrund, verbrauche } from "./aufmerksamkeit";
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
    // Teil III: V↑ nach dem Trump-Reset, K↓ nach der CAATSA-Wende 07/2026, S↓ minimal (Iran-Krieg belastet die Incirlik-Logik); alt 70/65/45/55
    start: { handel: 70, sicherheit: 60, vertrauen: 52, konflikt: 45 },
    anliegen: [
      A("usa-nato", "Ein fairer Anteil in der NATO", "Washington erwartet, dass die Türkei ihren Beitrag zur Verteidigung leistet.", { art: "massnahme", id: "m_verteidigung", min: 55 }),
      A("usa-grenze", "Sichere Südgrenze", "Kontrolle über die Grenze zu Syrien und den Kampf gegen Terrornetzwerke.", { art: "massnahme", id: "m_grenzschutz", min: 60 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "druck", "entspannen"],
  },
  {
    id: "EU", dat: "der Europäischen Union", akk: "die Europäische Union", name: "Europäische Union", kurz: "EU", gruppe: "Große Mächte", iso: "DEU", wdi: "DEU", knoten: "beziehungen_eu", anteil: 1,
    text: "Größter Handelspartner und Zollunionspartner der Türkei; die Beitrittsgespräche liegen seit Jahren auf Eis. Seit 2026 läuft die Kooperation im Two-Track weiter: Sicherheit, Energie und Migration ja, Visafreiheit und modernisierte Zollunion nur gegen Reformen bei Rechtsstaat und Grundrechten.",
    // Teil III: Code passt zum Two-Track-Stand (90/55/40/45 unverändert)
    start: { handel: 90, sicherheit: 55, vertrauen: 40, konflikt: 45 },
    anliegen: [
      A("eu-recht", "Unabhängige Justiz", "Ein Richterrat, der nicht der Regierung untersteht, und die Umsetzung der Urteile des Europäischen Gerichtshofs für Menschenrechte sind die Vorbedingung für alles Weitere.", { art: "massnahme", id: "m_justizreform", min: 55 }),
      A("eu-medien", "Freie Medien", "Die Medienaufsicht soll nur bei Straftaten eingreifen.", { art: "massnahme-max", id: "m_medienaufsicht", max: 50 }),
      A("eu-annaeherung", "Ernsthafte Annäherung", "Reformen für Visafreiheit und eine modernisierte Zollunion; die sektorale Kooperation (Two-Track seit 06/2026) ersetzt das nicht.", { art: "massnahme", id: "m_eu_annaeherung", min: 55 }),
    ],
    aktionen: ["gipfel", "handel", "druck", "entspannen"],
  },
  {
    id: "RUS", dat: "Russland", akk: "Russland", name: "Russland", kurz: "RU", gruppe: "Große Mächte", iso: "RUS", wdi: "RUS", knoten: "beziehungen_russland", anteil: 1,
    text: "Wichtiger Lieferant von Erdgas, Bauherr des ersten Kernkraftwerks Akkuyu und größter Touristenlieferant; zugleich Gegenspieler in Syrien, im Schwarzen Meer und im Krieg gegen die Ukraine, den Ankara zu vermitteln versucht.",
    // Teil III: H↓ leicht (Türkei senkt Russland-Öl, große Gasverträge laufen Ende 2026 aus); alt 75/40/45/50
    start: { handel: 72, sicherheit: 38, vertrauen: 45, konflikt: 52 },
    anliegen: [
      A("rus-akkuyu", "Akkuyu vollenden", "Das Kernkraftwerk soll ans Netz gehen und weitere Vorhaben folgen.", { art: "massnahme", id: "m_kernkraft", min: 50 }),
      A("rus-handel", "Offene Märkte", "Handel und Tourismus ohne neue Hürden, vor allem keine höheren Zölle.", { art: "massnahme-max", id: "m_zoelle", max: 45 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "druck", "entspannen"],
  },
  {
    id: "GRC", dat: "Griechenland", akk: "Griechenland", name: "Griechenland", kurz: "GR", gruppe: "Nachbarn", iso: "GRC", wdi: "GRC", knoten: "beziehungen_eu", anteil: 0.4,
    text: "NATO-Verbündeter und Nachbar in der Ägäis; Streit um Seegrenzen, Luftraum, Inselstatus und Zypern, dazu Migration über die Ägäis. Zwischen den Krisen bestehen Deeskalationskanäle.",
    // Teil III: K↓↓ (Dialogphase seit 2023, Hochrangiger Kooperationsrat 02/2026), V↑, H/S minimal ↑; alt 40/30/30/65
    start: { handel: 42, sicherheit: 32, vertrauen: 35, konflikt: 55 },
    anliegen: [
      A("grc-aegaeis", "Ruhe in der Ägäis", "Keine Provokationen zu Wasser und in der Luft; Gespräche über die Seegrenzen.", { art: "land", dim: "konflikt", max: 50 }),
      A("grc-migration", "Kontrollierte Migration", "Die Türkei soll den Weg über die Ägäis besser sichern.", { art: "massnahme", id: "m_grenzschutz", min: 60 }),
    ],
    aktionen: ["gipfel", "druck", "entspannen"],
  },
  {
    id: "IRN", dat: "dem Iran", akk: "den Iran", name: "Iran", kurz: "IR", gruppe: "Nachbarn", iso: "IRN", wdi: "IRN", knoten: "beziehungen_nahost", anteil: 0.3,
    text: "Große Nachbarmacht im Osten, seit Februar 2026 im Krieg mit den USA und Israel: Der Gasvertrag ist im Juli 2026 ausgelaufen, der Handel bricht unter Sanktionen und Blockade ein; dazu Konkurrenz um Einfluss im Irak und in Syrien und Vermittlungsbedarf bei der Straße von Hormus.",
    // Teil III: H↓↓ (Krieg, Snapback-Sanktionen, Gasvertrag ausgelaufen 07/2026), S↓ (Eskalationsrisiko Ostgrenze), K↑ (Hormus-Spillover); alt 55/40/40/45
    start: { handel: 42, sicherheit: 30, vertrauen: 40, konflikt: 55 },
    anliegen: [
      A("irn-handel", "Handel trotz Sanktionen", "Teheran will, dass Ankara den Handel nicht den Sanktionen opfert.", { art: "land", dim: "handel", min: 55 }),
      A("irn-gas", "Gas und Wasser", "Verlässliche Lieferungen und ein sachlicher Umgang mit Grenzflüssen.", { art: "land", dim: "vertrauen", min: 45 }),
    ],
    aktionen: ["gipfel", "handel", "druck", "entspannen"],
  },
  {
    id: "SYR", dat: "Syrien", akk: "Syrien", name: "Syrien", kurz: "SY", gruppe: "Nachbarn", iso: "SYR", wdi: "SYR", knoten: "beziehungen_nahost", anteil: 0.3,
    text: "Nachbar im Süden nach dem Sturz des Assad-Regimes (12/2024); die Übergangsregierung in Damaskus hängt an Ankara: Wiederaufbauverträge, Energie über die Kilis–Aleppo-Leitung und die Ausbildung der neuen Armee laufen über die Türkei, die SDF sind seit August 2026 in den Staat überführt und die Sanktionen weltweit aufgehoben.",
    // Teil III (größte Korrektur): Assad-/Frontstaat-Ära ersetzt — Klientelpartnerschaft, SDF 08/2026 aufgelöst, Sanktionen aufgehoben, Handel +40 % 2025; alt 35/20/25/75
    start: { handel: 45, sicherheit: 55, vertrauen: 68, konflikt: 20 },
    anliegen: [
      A("syr-rueckkehr", "Rückkehr ermöglichen", "Damaskus braucht ein finanziertes Programm für die Rückkehr der rund drei Millionen Syrer aus der Türkei, verbunden mit Wiederaufbauhilfe.", { art: "massnahme", id: "m_rueckkehr", min: 55 }),
      A("syr-grenze", "Ruhe an der Grenze", "Die SDF sind in der Armee aufgegangen; Damaskus will, dass keine eigenständige bewaffnete Kraft an der Grenze zurückkehrt und die Ruhe hält.", { art: "land", dim: "konflikt", max: 45 }),
    ],
    aktionen: ["gipfel", "hilfe", "druck", "entspannen"],
  },
  {
    id: "IRQ", dat: "dem Irak", akk: "den Irak", name: "Irak", kurz: "IQ", gruppe: "Nachbarn", iso: "IRQ", wdi: "IRQ", knoten: "beziehungen_nahost", anteil: 0.3,
    text: "Nachbar im Südosten: die Öl-Pipeline Kirkuk–Ceyhan läuft seit Juli 2026 wieder (Zwölfmonats-Protokoll), dazu Streit um das Wasser von Euphrat und Tigris, türkische Militäreinsätze im Norden gegen die PKK und ein wichtiger Markt für Bauunternehmen.",
    // Teil III: K↓ (Pipeline-Protokoll 07/2026, Kurs der Regierung Zaidi), S↑ leicht, H↑ minimal; alt 60/35/40/55
    start: { handel: 62, sicherheit: 40, vertrauen: 45, konflikt: 42 },
    anliegen: [
      A("irq-wasser", "Mehr Wasser flussabwärts", "Bagdad verlangt Abflussmengen aus den türkischen Staudämmen.", { art: "land", dim: "vertrauen", min: 45 }),
      A("irq-souveraenitaet", "Achtung der Grenzen", "Weniger Militäreinsätze auf irakischem Gebiet.", { art: "land", dim: "konflikt", max: 50 }),
    ],
    aktionen: ["gipfel", "handel", "hilfe", "entspannen"],
  },
  {
    id: "AZE", dat: "Aserbaidschan", akk: "Aserbaidschan", name: "Aserbaidschan", kurz: "AZ", gruppe: "Verbündete und Partner", iso: "AZE", wdi: "AZE", knoten: "beziehungen_nahost", anteil: 0.2,
    text: "Engster Partner im Kaukasus, „eine Nation, zwei Staaten“: Gas über die Pipelines TANAP und TAP, Rüstungszusammenarbeit und ein Korridor nach Zentralasien.",
    // Teil III: Code ok — engste Beziehung der Türkei (75/85/85/15 unverändert)
    start: { handel: 75, sicherheit: 85, vertrauen: 85, konflikt: 15 },
    anliegen: [
      A("aze-korridor", "Der Korridor nach Osten", "Die Bahn Kars–Nachitschewan und die TRIPP-Verbindung über armenisches Gebiet sollen die Türkei mit Baku und Zentralasien verbinden.", { art: "massnahme", id: "m_bahn", min: 50 }),
      A("aze-gas", "Gasabnahme", "Verlässliche Abnahme aserbaidschanischen Gases; der Ausbau von TANAP Richtung 20 Milliarden Kubikmeter ist das Ziel.", { art: "land", dim: "handel", min: 70 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "hilfe"],
  },
  {
    id: "ARM", dat: "Armenien", akk: "Armenien", name: "Armenien", kurz: "AM", gruppe: "Nachbarn", iso: "ARM", wdi: "ARM", knoten: "ansehen", anteil: 0.2,
    text: "Nachbar im Osten: Direktflüge und Direkthandel laufen seit 2026, doch die Grenze bleibt geschlossen, weil Ankara die Öffnung an die Signatur des parafierten Friedensvertrags mit Aserbaidschan koppelt; belastet wirkt weiter der Streit um die Bewertung von 1915.",
    // Teil III: V↑ (THY-Direktflüge 03/2026, Direkthandel registriert 05/2026), K↓ (Wiederwahl Paschinjans 06/2026, Normalisierungskanal); alt 20/25/30/55
    start: { handel: 18, sicherheit: 28, vertrauen: 36, konflikt: 48 },
    anliegen: [
      A("arm-grenze", "Die Grenze öffnen", "Direktflüge und Direkthandel laufen; die Grenze bleibt zu, bis der Friedensvertrag mit Baku signiert ist.", { art: "land", dim: "vertrauen", min: 45 }),
      A("arm-frieden", "Frieden im Kaukasus", "Der Friedensvertrag ist parafiert, aber nicht signiert; Erevan will keine einseitige Parteinahme Ankaras für Baku.", { art: "land", dim: "konflikt", max: 45 }),
    ],
    aktionen: ["gipfel", "entspannen", "hilfe"],
  },
  {
    id: "SAU", dat: "Saudi-Arabien und den Golfstaaten", akk: "Saudi-Arabien und die Golfstaaten", name: "Saudi-Arabien und Golfstaaten", kurz: "GO", gruppe: "Verbündete und Partner", iso: "SAU", wdi: "SAU", knoten: "beziehungen_nahost", anteil: 0.5,
    text: "Wichtige Geldgeber und Investoren: nach Jahren der Spannung (Katar-Blockade, Khashoggi) wieder eng, mit Krediten, Einlagen und Bauaufträgen; seit dem Beistandspakt von Mekka (August 2026, mit Pakistan) auch Bündnispartner mit Kollektivklausel.",
    // Teil III: S↑↑ (Mekka-Beistandspakt 07.08.2026 mit Kollektivklausel, siehe START_VERTRAEGE unten), V↑; alt 55/50/55/30
    start: { handel: 55, sicherheit: 66, vertrauen: 62, konflikt: 28 },
    anliegen: [
      A("sau-invest", "Ein verlässliches Investitionsklima", "Rechtssicherheit für Geld aus dem Golf.", { art: "massnahme", id: "m_justizreform", min: 45 }),
      A("sau-partner", "Partnerschaft statt Konkurrenz", "Abstimmung in der Region.", { art: "land", dim: "vertrauen", min: 60 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "hilfe"],
  },
  {
    id: "ISR", dat: "Israel", akk: "Israel", name: "Israel", kurz: "IL", gruppe: "Nachbarn", iso: "ISR", wdi: "ISR", knoten: "beziehungen_nahost", anteil: 0.3,
    text: "Kalte Konfrontation mit Sicherheits-Feuerwehr: Seit Mai 2024 hält die Türkei eine vollständige Handels-, Hafen- und Luftraumsperre aufrecht (verschärft Februar 2026); dazu Haftbefehle aus Ankara, der Streit um Gaza und die türkische Rolle in Syrien — gehalten wird die Lage nur durch technische Deconfliction-Gespräche.",
    // Teil III (gravierende Korrektur): H↓↓ — die Handelssperre seit 05/2024 hat den Handel auf null gedrückt; K↑ (Haftbefehle 07/2026, Bombardierung eines für türkische Truppen vorgesehenen Stützpunkts 08/2026); alt 50/25/30/60.
    // Die Sperre selbst ist als Zustand abgebildet: handelssperre blockiert Handelsaktionen und -klauseln, bis die Klausel „ende_sperre“ vereinbart ist.
    start: { handel: 10, sicherheit: 22, vertrauen: 25, konflikt: 70 },
    anliegen: [
      A("isr-handel", "Wirtschaft von Politik trennen", "Jerusalem will das Ende der Handels-, Hafen- und Luftraumsperre; solange sie gilt, bleibt der Handel faktisch null.", { art: "land", dim: "handel", min: 50 }),
      A("isr-ruhe", "Weniger Schärfe", "Deconfliction in Syrien und ein gemäßigterer Ton statt Haftbefehle und Kriegsrhetorik.", { art: "land", dim: "konflikt", max: 55 }),
    ],
    aktionen: ["gipfel", "handel", "druck", "entspannen"],
  },
  {
    id: "CHN", dat: "China", akk: "China", name: "China", kurz: "CN", gruppe: "Große Mächte", iso: "CHN", wdi: "CHN", knoten: "ansehen", anteil: 0.3,
    text: "Wichtiger Lieferant von Vorprodukten und Investor („Neue Seidenstraße“, Mittlerer Korridor); die Handelsbilanz ist stark einseitig, und die Lage der Uiguren belastet das Verhältnis.",
    start: { handel: 75, sicherheit: 30, vertrauen: 45, konflikt: 30 }, // nicht Teil der Beziehungsmatrix 2026 (kein Akteur der Recherche), Werte unverändert
    anliegen: [
      A("chn-invest", "Offene Türen für Investitionen", "Chinesische Firmen in Infrastruktur und Industrie.", { art: "massnahme", id: "m_investitionsanreize", min: 45 }),
      A("chn-korridor", "Der Mittlere Korridor", "Bahn und Häfen als Landbrücke.", { art: "massnahme", id: "m_bahn", min: 50 }),
    ],
    aktionen: ["gipfel", "handel", "druck"],
  },
  {
    id: "UKR", dat: "der Ukraine", akk: "die Ukraine", name: "Ukraine", kurz: "UA", gruppe: "Nachbarn", iso: "UKR", wdi: "UKR", knoten: "ansehen", anteil: 0.25,
    text: "Nachbar über das Schwarze Meer, seit dem russischen Angriff im Krieg: Ankara liefert Drohnen, hält die Meerengen und vermittelte das Getreideabkommen, pflegt aber zugleich enge Beziehungen zu Moskau und sanktioniert es nicht.",
    // Teil III: Code ok; H minimal ↑ (FTA-Entwurf 02/2026), S/V minimal ↑ (Türkei führt seit 07/2026 die maritime Komponente der Sicherheitsgarantien); alt 55/60/60/15
    start: { handel: 58, sicherheit: 62, vertrauen: 62, konflikt: 15 },
    anliegen: [
      A("ukr-meerengen", "Die Meerengen geschlossen halten", "Keine Kriegsschiffe durch Bosporus und Dardanellen, wie der Vertrag von Montreux es erlaubt.", { art: "massnahme", id: "m_verteidigung", min: 50 }),
      A("ukr-vermittlung", "Ein ehrlicher Vermittler", "Ankara soll sich nicht auf die Seite Moskaus schlagen.", { art: "land", dim: "vertrauen", min: 55 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "hilfe"],
  },
  {
    id: "GEO", dat: "Georgien", akk: "Georgien", name: "Georgien", kurz: "GE", gruppe: "Nachbarn", iso: "GEO", wdi: "GEO", knoten: "ansehen", anteil: 0.15,
    text: "Kleiner Nachbar im Nordosten: Transitland für Erdgas und Öl (Baku-Tiflis-Ceyhan), Bahnstrecke nach Baku, mit russischen Truppen in Abchasien und Südossetien und einem Streit über den Weg nach Westen.",
    start: { handel: 65, sicherheit: 60, vertrauen: 65, konflikt: 20 }, // Teil III: Code ok (BTK-Volllast seit 06/2026 stützt die Werte), unverändert
    anliegen: [
      A("geo-transit", "Verlässlicher Transit", "Pipelines und die Bahn nach Baku bleiben offen und werden ausgebaut.", { art: "massnahme", id: "m_bahn", min: 50 }),
      A("geo-westen", "Rückhalt auf dem Weg nach Westen", "Georgien will Unterstützung, nicht Belehrung.", { art: "land", dim: "vertrauen", min: 60 }),
    ],
    aktionen: ["gipfel", "handel", "hilfe"],
  },
  {
    id: "EGY", dat: "Ägypten", akk: "Ägypten", name: "Ägypten", kurz: "EG", gruppe: "Verbündete und Partner", iso: "EGY", wdi: "EGY", knoten: "beziehungen_nahost", anteil: 0.25,
    text: "Große arabische Macht am südöstlichen Mittelmeer: nach Jahren der Entfremdung (Sturz der Muslimbrüder 2013) seit Februar 2026 durch eine Strategische Partnerschaft mit Verteidigungskooperation verbunden; ungelöst bleiben die Seegrenzen und das Türkei-Libyen-Memorandum, dazu Wettbewerb um Einfluss in Libyen.",
    // Teil III: alles ↑ (Strategische Partnerschaft 04.02.2026, Verteidigungs-MoU, FSRU-Deal, Handelsziel 15 Mrd. bis 2028); alt 55/35/40/45
    start: { handel: 60, sicherheit: 45, vertrauen: 50, konflikt: 35 },
    anliegen: [
      A("egy-gas", "Ein Ausgleich im Mittelmeer", "Seegrenzen und Gasfelder ohne Konfrontation.", { art: "land", dim: "konflikt", max: 40 }),
      A("egy-libyen", "Gemeinsame Linie in Libyen", "Abstimmung statt Stellvertreterkonkurrenz.", { art: "land", dim: "vertrauen", min: 50 }),
    ],
    aktionen: ["gipfel", "handel", "entspannen", "druck"],
  },
  {
    id: "LBY", dat: "Libyen", akk: "Libyen", name: "Libyen", kurz: "LY", gruppe: "Verbündete und Partner", iso: "LBY", knoten: "beziehungen_nahost", anteil: 0.15,
    text: "Seit 2011 ein geteiltes Land: Ankara stützt die Regierung in Tripolis mit Ausbildern und Drohnen und schloss 2019 ein Memorandum über Seegrenzen im östlichen Mittelmeer, das Griechenland, Ägypten und Zypern ablehnen.",
    // Teil III: H↑ (Türkei ist Libyens größte Importquelle 2025), S/V leicht ↑ (Annäherung an beide Lager, West und Ost); alt 45/55/55/35
    start: { handel: 50, sicherheit: 58, vertrauen: 58, konflikt: 32 },
    anliegen: [
      A("lby-seegrenze", "Das Seegrenz-Memorandum halten", "Tripolis will, dass Ankara zu dem Abkommen von 2019 steht.", { art: "land", dim: "vertrauen", min: 50 }),
      A("lby-truppen", "Ausbildung und Drohnen", "Militärische Hilfe für die Streitkräfte in Tripolis.", { art: "land", dim: "sicherheit", min: 50 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "hilfe"],
  },
  {
    id: "KAZ", dat: "Kasachstan", akk: "Kasachstan", name: "Kasachstan", kurz: "KZ", gruppe: "Verbündete und Partner", iso: "KAZ", knoten: "ansehen", anteil: 0.1,
    text: "Größter Staat Zentralasiens und Mitglied der Organisation der Turkstaaten: Transitland am Mittleren Korridor zwischen China und Europa, Öl- und Gasexporteur, mit türkischen Bauunternehmen im Land; zugleich eng an Moskau und Peking gebunden.",
    start: { handel: 55, sicherheit: 42, vertrauen: 65, konflikt: 10 }, // Teil III: Code ok, S minimal ↑ (alt 55/40/65/10)
    anliegen: [
      A("kaz-korridor", "Der Mittlere Korridor", "Bahn und Häfen als Landbrücke nach Europa, an Russland vorbei.", { art: "massnahme", id: "m_bahn", min: 50 }),
      A("kaz-partner", "Partnerschaft unter Turkstaaten", "Verlässliche Abstimmung im Kreis der Turkstaaten.", { art: "land", dim: "vertrauen", min: 55 }),
    ],
    aktionen: ["gipfel", "handel", "hilfe"],
  },
  {
    id: "CYP", dat: "Zypern", akk: "Zypern", name: "Zypern", kurz: "CY", gruppe: "Nachbarn", iso: "CYP", knoten: "beziehungen_eu", anteil: 0.2,
    text: "EU-Mitglied und geteilte Insel: Im Norden besteht die nur von der Türkei anerkannte Türkische Republik Nordzypern. Das UN-Verhandlungsfenster um 2026 (5+1-Format) und ein föderationsorientierter Norden haben erstmals seit Jahren Bewegung gebracht; strittig bleiben Seegrenzen und Gasfelder, Häfen und Flughäfen, Varosha und die Grundfrage Föderation oder zwei Staaten.",
    // Teil III: V↑ minimal (Erhürman-Fenster: Norden seit 10/2025 föderationsorientiert, 5+1-Initiative bis 12/2026); alt 15/15/20/75
    start: { handel: 12, sicherheit: 15, vertrauen: 24, konflikt: 72 },
    anliegen: [
      A("cyp-hafen", "Häfen und Flughäfen öffnen", "Das Ankara-Protokoll bleibt unerfüllt: Schiffe und Flugzeuge der Republik Zypern sollen türkische Häfen und Flughäfen nutzen dürfen.", { art: "land", dim: "vertrauen", min: 45 }),
      A("cyp-ruhe", "Keine Bohrschiffe, keine Provokation", "Ruhe in den Gewässern rund um die Insel; Nikosia knüpft jeden EU-Schritt Richtung Ankara an Bewegung in der Zypernfrage.", { art: "land", dim: "konflikt", max: 55 }),
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
  /**
   * Vollständige Handels-/Hafen-/Luftraumsperre der Türkei gegen dieses Land: blockiert die Handlung „Handelsabkommen“
   * und die Handels-Klauseln am Verhandlungstisch (SPERRE_KLAUSELN in data/abkommen.ts), bis ein Vertrag mit der Klausel
   * „ende_sperre“ geschlossen wird. Stand 30.09.2026 nur Israel (Sperre seit 02.05.2024, verschärft 02/2026;
   * RECHERCHE_REALWELT_LAENDERDOSSIERS.md, Dossier 13 und Teil V §5.1 Nr. 2).
   */
  handelssperre?: boolean;
  /** Tag der letzten Eigeninitiative dieses Landes (Abkühlung, sim/initiative.ts); fehlt in älteren Spielständen */
  initiativeZuletzt?: number;
  /** Tag, an dem eine Rote Linie dieses Landes zuletzt bedroht wurde (Veto am Verhandlungstisch, sim/abkommen.ts); fehlt in älteren Spielständen */
  rotBedroht?: number;
}

/**
 * Zum Spielstart (Tag 0 = 05.06.2028) bereits bestehende Verträge des Verhandlungstisches.
 * Mekka-Beistandspakt vom 07.08.2026 (Saudi-Arabien + Türkei + Pakistan, mit Kollektivverteidigungsklausel):
 * die Klausel „beistand“ läuft bei SAU bereits und wird am Verhandlungstisch nicht doppelt angeboten
 * (klauselnFuer sperrt Klauseln aus laufenden Verträgen). (RECHERCHE_REALWELT_LAENDERDOSSIERS.md, Dossier 12, Teil V §5.1 Nr. 3)
 */
const MEKKA_PAKT_SEIT = -668; // 07.08.2026 relativ zum Spielstart 05.06.2028
const START_VERTRAEGE: Record<string, (tag: number) => Vertrag[]> = {
  SAU: (tag) => [
    {
      id: "v-SAU-mekka-2026", land: "SAU", gibt: ["beistand"], will: [], jahre: 10,
      seit: tag + MEKKA_PAKT_SEIT, ablauf: tag + MEKKA_PAKT_SEIT + 3653, status: "laeuft",
      verstoesse: 0, letztePruefung: tag + MEKKA_PAKT_SEIT,
    },
  ],
};

/** Abkommen-Einträge, die zum Spielstart bereits bestehen (Anzeige im Ländersteckbrief). */
const START_ABKOMMEN: Record<string, string[]> = {
  SAU: ["Mekka-Beistandspakt 2026 (mit Pakistan)"],
};

/** Die Felder eines Landes zu Spielstart, inklusive der bereits bestehenden Fakten (Quellen je Kommentar oben). */
function startFelder(w: World, l: LandDef): Omit<LandZustand, "versatz"> {
  const vertraege = START_VERTRAEGE[l.id]?.(w.day);
  return {
    handel: l.start.handel,
    sicherheit: l.start.sicherheit,
    konflikt: l.start.konflikt,
    zuletzt: {},
    erinnerung: [],
    abkommen: [...(START_ABKOMMEN[l.id] ?? [])],
    // Israel: Handels-, Hafen- und Luftraumsperre seit 02.05.2024 in Kraft (verschärft 02/2026) — Quelle s. Feld oben
    ...(l.id === "ISR" ? { handelssperre: true } : {}),
    ...(vertraege ? { vertraege } : {}),
  };
}

export function weltZustand(w: World): Record<string, LandZustand> {
  const spiel = w.spiel!;
  if (!spiel.welt) {
    spiel.welt = {};
    for (const l of LAENDER) {
      const knoten = startAverage(NET, w.net, l.knoten);
      spiel.welt[l.id] = { ...startFelder(w, l), versatz: clamp(l.start.vertrauen - knoten, -45, 45) };
    }
  }
  // Fehlt ein Land in einem älteren Spielstand ganz, wird es mit den Startwerten ergänzt (Fakten zum Spielstart inbegriffen)
  for (const l of LAENDER) spiel.welt[l.id] ??= { ...startFelder(w, l), versatz: 0 };
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
    // Solange eine Handelssperre gilt (Stand 30.09.2026: Israel), ist ein Handelsabkommen erst nach ihrem Ende per Vertrag möglich
    else if (a === "handel" && z.handelssperre) grund = "Die Handels-, Hafen- und Luftraumsperre muss zuerst per Vertrag enden (am Verhandlungstisch).";
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
  const pause = neuanfangGrund(w);
  if (pause) return { ok: false, text: pause };
  const def = sicht.aktion;
  const z = weltZustand(w)[id]!;
  spiel.kapital -= def.pk;
  verbrauche(w, AUFMERKSAMKEIT_KOSTEN.landAktion[aktion], `${def.label}: ${l.name}`);
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
