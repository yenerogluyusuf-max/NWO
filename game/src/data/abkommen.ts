// Der Klauselkatalog des Verhandlungstisches und die Profile der Länder (RECHERCHE_KONKURRENZ_FACHBEREICHE.md, Abschnitt 6).
// Ein Vertrag besteht aus Klauseln: Die Türkei „gibt“ (leistet, öffnet, verspricht) oder „will“ (verlangt, erhält). Jede Klausel wirkt
// im Land selbst (Größen des Politiknetzes, Gruppen, Kapital) und auf das Verhältnis zum Partner. Die Gegenseite bewertet das ganze
// Paket nach ihrem Profil: was ihr eine Klausel wert ist oder kostet, plus Vertrauen, Streit, Abhängigkeit und Erinnerung an frühere Brüche.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen; Tatsachen stehen nur im Text und sind
// in der Recherche belegt.

import type { Dimension } from "../sim/laender";
import type { Effekt } from "../sim/reich-typen";
import type { Bedingung } from "../sim/programme";
import { stoss, stuetze } from "./reich/bau";

export interface KlauselDef {
  id: string;
  /** gibt: die Türkei leistet; will: die Türkei erhält */
  seite: "gibt" | "will";
  label: string;
  text: string;
  /** Politischer Preis im eigenen Land, in Kapital, beim Abschluss */
  pk?: number;
  /** Einmalig beim Abschluss (Türkei) */
  abschluss?: Effekt[];
  /** Jeden Monat, solange der Vertrag läuft; skaliert mit der Laufzeit (Türkei) */
  dauer?: Effekt[];
  /** Was der Vertrag am Verhältnis zum Partner ändert, einmalig beim Abschluss */
  land?: Partial<Record<Dimension, number>>;
  kehrseite: string;
  /** Was die Türkei einhalten muss; wird jedes Jahr geprüft */
  pflicht?: Bedingung;
  pflichtText?: string;
  /** Damit die Gegenseite die Klausel überhaupt in Betracht zieht */
  mindestens?: { dim: Dimension; wert: number; text: string };
}

const SUEDOST = [63, 21, 47, 27, 2];

export const KLAUSELN: KlauselDef[] = [
  // ------------------------------------------------------------------ Türkei gibt
  {
    id: "zoll", seite: "gibt", label: "Zölle senken, Marktzugang öffnen",
    text: "Türkische Zölle fallen für die Waren des Partners; heimische Hersteller müssen sich dem Wettbewerb stellen.",
    abschluss: [stoss("unternehmer", -2)],
    dauer: [stuetze("export", 2), stuetze("industrie", -1.2), stuetze("mittelstand", -1.5), stuetze("lebenshaltung", -1)],
    land: { handel: 12, vertrauen: 2 },
    kehrseite: "Heimische Hersteller geraten unter Preisdruck, vor allem im Mittelstand.",
    pflicht: { art: "massnahme-max", id: "m_zoelle", max: 50 }, pflichtText: "Einfuhrzölle bleiben niedrig.",
    mindestens: { dim: "vertrauen", wert: 35, text: "Ohne Grundvertrauen öffnet niemand seinen Markt." },
  },
  {
    id: "transit", seite: "gibt", label: "Transit- und Korridorrechte",
    text: "Bahn, Straße und Leitungen des Partners dürfen durch türkisches Gebiet und die türkischen Häfen laufen.",
    dauer: [stuetze("logistik", 1.5), stuetze("wachstum_regional", 0.5)],
    land: { handel: 6, vertrauen: 3 },
    kehrseite: "Durchleitung bindet Anlagen und macht abhängig vom Nachbarn.",
  },
  {
    id: "meerengen", seite: "gibt", label: "Zusage zu den Meerengen (Montreux)",
    text: "Ankara bekräftigt, Bosporus und Dardanellen nach dem Vertrag von Montreux zu regeln und keine Kriegsschiffe der Kriegsparteien durchzulassen.",
    dauer: [stuetze("ansehen", 1.5)],
    land: { vertrauen: 6, sicherheit: 4 },
    kehrseite: "Bindet die Handlungsfreiheit am Bosporus; eine Seite fühlt sich immer benachteiligt.",
    mindestens: { dim: "vertrauen", wert: 40, text: "Für eine solche Zusage braucht der Partner erst Vertrauen." },
  },
  {
    id: "militaerzugang", seite: "gibt", label: "Militärzugang und Ausbildung",
    text: "Ausbilder, Hafenbesuche und der Zugang zu Stützpunkten für die Streitkräfte des Partners.",
    pk: 2,
    abschluss: [stoss("konservative", -0.5)],
    dauer: [stuetze("abschreckung", 1.5)],
    land: { sicherheit: 10, vertrauen: 3 },
    kehrseite: "Fremde Truppen und Ausbilder im eigenen Land; Dritte reagieren darauf.",
    mindestens: { dim: "sicherheit", wert: 40, text: "Militärische Nähe setzt eine belastbare Sicherheitszusammenarbeit voraus." },
  },
  {
    id: "ruestung_koop", seite: "gibt", label: "Rüstungskooperation und Lieferungen",
    text: "Gemeinsame Entwicklung und Lieferungen türkischer Systeme wie Drohnen, Schiffe und Panzer.",
    pk: 2,
    abschluss: [stoss("ansehen", -0.5)],
    dauer: [stuetze("export", 1), stuetze("industrie", 0.8), stuetze("ruestungsautarkie", 1)],
    land: { sicherheit: 12, vertrauen: 4 },
    kehrseite: "Lieferungen an Krisenparteien kosten Ansehen und ziehen Gegenspieler an.",
    mindestens: { dim: "sicherheit", wert: 35, text: "Für Rüstungsgeschäfte ist die Zusammenarbeit noch zu dünn." },
  },
  {
    id: "ruestung_kauf", seite: "gibt", label: "Rüstungskäufe beim Partner",
    text: "Die Türkei kauft Flugzeuge, Triebwerke und Ersatzteile; Ankara zahlt, der Partner liefert.",
    pk: 1,
    abschluss: [{ t: "schulden", d: 0.3 }],
    dauer: [stuetze("modernisierung", 2), stuetze("abschreckung", 1)],
    land: { sicherheit: 8, handel: 6, vertrauen: 3 },
    kehrseite: "Bestellungen im Ausland belasten die Zahlungsbilanz und die heimische Rüstungsindustrie.",
  },
  {
    id: "bauauftraege", seite: "gibt", label: "Bauaufträge und Wiederaufbau",
    text: "Türkische Baufirmen bauen Straßen, Kraftwerke und Wohnungen; der Staat bürgt und finanziert mit.",
    pk: 1,
    abschluss: [{ t: "schulden", d: 0.1 }],
    dauer: [stuetze("bauwirtschaft", 2), stuetze("export", 0.5)],
    land: { handel: 6, vertrauen: 4 },
    kehrseite: "Türkische Baufirmen verdienen, der Staat trägt die Risiken mit.",
  },
  {
    id: "visa", seite: "gibt", label: "Visaerleichterung",
    text: "Kurzzeitvisa und Geschäftsreisen werden leichter; Reisende und Händler kommen ohne lange Wege.",
    dauer: [stuetze("tourismus", 1.5)],
    land: { vertrauen: 4, handel: 3 },
    kehrseite: "Mehr Reisende bedeuten mehr Kontrolle und, in Grenzstädten, mehr Spannung.",
  },
  {
    id: "grenzoeffnung", seite: "gibt", label: "Grenzöffnung und diplomatische Beziehungen",
    text: "Die geschlossene Grenze wird geöffnet, Botschafter werden ausgetauscht; Bahn und Handel können folgen.",
    pk: 4,
    abschluss: [stoss("konservative", -2), stoss("ansehen", 1.5)],
    dauer: [stuetze("tourismus", 0.6, [36, 76, 75]), stuetze("wachstum_regional", 0.6, [36, 76, 75])],
    land: { vertrauen: 10, konflikt: -10 },
    kehrseite: "Nationalisten und der engste Partner Baku sehen Verrat; die Grenzprovinzen Kars, Iğdır und Ardahan tragen die Last.",
    mindestens: { dim: "vertrauen", wert: 30, text: "Ohne erste Zeichen des Vertrauens gibt es keine Grenzöffnung." },
  },
  {
    id: "vermittlung_zusage", seite: "gibt", label: "Ankara vermittelt im Streit",
    text: "Die Türkei bietet sich als Vermittler an: Istanbul als Ort, Erdoğans Draht zu beiden Seiten als Werkzeug.",
    pk: 1,
    abschluss: [stoss("ansehen", 1.5)],
    dauer: [stuetze("ansehen", 0.5)],
    land: { vertrauen: 5 },
    kehrseite: "Wer vermittelt, wird von beiden Seiten am Ergebnis gemessen.",
  },
  {
    id: "gas_kauf", seite: "gibt", label: "Langfristiger Gaskaufvertrag",
    text: "Ankara verpflichtet sich zur Abnahme von Erdgas über mehrere Jahre; der Preis ist vereinbart.",
    pk: 1,
    dauer: [stuetze("stromversorgung", 1), stuetze("energieimporte", 1.5), stuetze("energiepreise", -0.8)],
    land: { handel: 10, vertrauen: 2 },
    kehrseite: "Bindung an einen Lieferanten; wer sein Gas kauft, verhandelt nie ganz frei, und Dritte drohen mit Sanktionen.",
  },
  {
    id: "investitionen_oeffnen", seite: "gibt", label: "Türen für Investitionen öffnen",
    text: "Investoren des Partners bekommen Zugang zu Industrie, Infrastruktur und Häfen, mit Rechtsschutz.",
    abschluss: [stoss("unternehmer", -0.5)],
    dauer: [stuetze("auslandskapital", 2), stuetze("investitionen", 1)],
    land: { handel: 5, vertrauen: 3 },
    kehrseite: "Politischer Einfluss kommt mit dem Kapital.",
    pflicht: { art: "massnahme", id: "m_investitionsanreize", min: 40 }, pflichtText: "Ein verlässliches Investitionsklima.",
  },
  {
    id: "kredit_hilfe", seite: "gibt", label: "Kredit und Wirtschaftshilfe",
    text: "Ankara gibt Kredite, Wiederaufbauhilfe und Zuschüsse an den Partner.",
    pk: 1,
    abschluss: [{ t: "schulden", d: 0.2 }, stoss("ansehen", 1)],
    land: { vertrauen: 8, handel: 4 },
    kehrseite: "Kredite an Schwächere kommen selten zurück, und Wähler fragen, warum das Geld nicht zu Hause bleibt.",
  },
  {
    id: "reform_zusage", seite: "gibt", label: "Reformzusage: Justiz und Rechtsstaat",
    text: "Ankara sagt zu, die Justiz unabhängiger zu machen und Urteile zu befolgen; Brüssel prüft jedes Jahr.",
    pk: 3,
    abschluss: [stoss("konservative", -1)],
    dauer: [stuetze("vertrauen_maerkte", 1)],
    land: { vertrauen: 8 },
    kehrseite: "Ein Versprechen, das Ankara innenpolitisch einhalten müsste; wer es bricht, verliert Glaubwürdigkeit.",
    pflicht: { art: "massnahme", id: "m_justizreform", min: 55 }, pflichtText: "Justizreform auf mindestens Stufe 55.",
  },
  {
    id: "sanktionen_umgehung", seite: "gibt", label: "Umgehung der Russland-Sanktionen unterbinden",
    text: "Türkische Firmen liefern keine Güter mehr über Umwege nach Russland; Banken prüfen strenger.",
    pk: 2,
    abschluss: [stoss("beziehungen_russland", -4)],
    dauer: [stuetze("export", -1.2)],
    land: { vertrauen: 6 },
    kehrseite: "Der Handel mit Russland und die Nebenverdienste der Exporteure schrumpfen.",
  },
  {
    id: "migration_zusage", seite: "gibt", label: "Migrations- und Rücknahmeabkommen",
    text: "Die Türkei sichert die Grenzen und nimmt irreguläre Migranten zurück.",
    pk: 2,
    dauer: [stuetze("gefluechtete", 1)],
    land: { vertrauen: 6 },
    kehrseite: "Wer zurückgenommen wird, bleibt zunächst im Land; der Druck auf Grenzprovinzen wächst.",
    pflicht: { art: "massnahme", id: "m_grenzschutz", min: 60 }, pflichtText: "Grenzschutz auf mindestens Stufe 60.",
  },
  {
    id: "s400", seite: "gibt", label: "S-400 stilllegen oder einlagern",
    text: "Das russische Luftabwehrsystem wird nicht mehr betrieben: Voraussetzung für ein Ende der US-Sanktionen und den Weg zurück zum F-35.",
    pk: 4,
    abschluss: [stoss("konservative", -2.5), stoss("beziehungen_russland", -4), stoss("abschreckung", -1.5)],
    dauer: [stuetze("modernisierung", 1)],
    land: { vertrauen: 10, sicherheit: 6 },
    kehrseite: "Moskau verliert einen Großkunden, und im Land gilt es als Kniefall vor Washington.",
  },
  {
    id: "zahlungsweg", seite: "gibt", label: "Zahlungsweg über türkische Banken",
    text: "Türkische Banken wickeln Zahlungen ab, die anderswo an Sanktionen scheitern.",
    pk: 4,
    abschluss: [stoss("beziehungen_usa", -3), { t: "risiko", d: 8 }],
    dauer: [stuetze("vertrauen_maerkte", -1.5), stuetze("export", 0.8)],
    land: { handel: 8, vertrauen: 4 },
    kehrseite: "Sekundärsanktionen: Wer die Sanktionen des Westens umgeht, wird selbst zum Ziel.",
  },
  {
    id: "ende_sperre", seite: "gibt", label: "Handels- und Häfensperre aufheben",
    text: "Die Sperre für Handel und Schiffe wird beendet; der Luftraum bleibt ein Thema für sich.",
    pk: 5,
    abschluss: [stoss("konservative", -3), stoss("ansehen", -1)],
    dauer: [stuetze("export", 1.5)],
    land: { handel: 12, konflikt: -8 },
    kehrseite: "Für viele Wählerinnen und Wähler ein Bruch mit der Gaza-Haltung.",
  },
  {
    id: "v_casus", seite: "gibt", label: "Kriegsdrohung von 1995 ruhen lassen",
    text: "Der Parlamentsbeschluss von 1995, eine Ausweitung der griechischen Hoheitsgewässer auf zwölf Seemeilen als Kriegsgrund zu betrachten, wird nicht mehr bekräftigt.",
    pk: 4,
    abschluss: [stoss("konservative", -2), stoss("abschreckung", -1)],
    land: { konflikt: -12, vertrauen: 6 },
    kehrseite: "Ein Druckmittel weniger in der Ägäis; Nationalisten sprechen von Ausverkauf.",
  },
  {
    id: "verzicht_bohrung", seite: "gibt", label: "Keine Erkundungsbohrungen in umstrittenen Gewässern",
    text: "Bohrschiffe bleiben aus Gewässern fern, in denen der Partner Rechte beansprucht.",
    pk: 3,
    abschluss: [stoss("konservative", -1)],
    dauer: [stuetze("energieimporte", 1)],
    land: { konflikt: -8, vertrauen: 5 },
    kehrseite: "Gasfelder im Mittelmeer bleiben ungenutzt, solange die Grenzen ungeklärt sind.",
    pflicht: { art: "massnahme-max", id: "m_gasfoerderung", max: 55 }, pflichtText: "Keine Ausweitung der Gasförderung über Stufe 55.",
  },
  {
    id: "hafen_oeffnung", seite: "gibt", label: "Häfen und Flughäfen für zyprische Schiffe und Flugzeuge öffnen",
    text: "Türkische Häfen und Flughäfen stehen Schiffen und Flugzeugen der Republik Zypern offen, wie es das Ankara-Protokoll zur Zollunion verlangt.",
    pk: 3,
    abschluss: [stoss("konservative", -2), stoss("ansehen", 1.5)],
    dauer: [stuetze("logistik", 0.5), stuetze("tourismus", 0.4)],
    land: { vertrauen: 8, konflikt: -6 },
    kehrseite: "Nationalisten sehen darin eine Anerkennung Zyperns ohne Gegenleistung.",
  },
  {
    id: "wasser", seite: "gibt", label: "Wassermengen aus Euphrat und Tigris zusagen",
    text: "Die Staudämme im Südosten geben verlässlich Wasser nach Süden ab, auch wenn es knapp wird.",
    pk: 2,
    abschluss: [stoss("landwirte", -2)],
    dauer: [stuetze("wasserversorgung", -1.5, SUEDOST), stuetze("landwirtschaft_einkommen", -0.8, SUEDOST)],
    land: { vertrauen: 8, konflikt: -6 },
    kehrseite: "Jeder Kubikmeter flussabwärts fehlt im Südosten, besonders in Dürrejahren.",
  },
  {
    id: "energie_lieferung", seite: "gibt", label: "Strom und Gas ins Nachbarland liefern",
    text: "Leitungen und Netze werden verbunden; die Türkei liefert Strom und Gas.",
    dauer: [stuetze("stromversorgung", -0.6), stuetze("export", 0.5)],
    land: { handel: 8, vertrauen: 4 },
    kehrseite: "Was das Nachbarland bekommt, fehlt im Notfall zu Hause.",
  },
  {
    id: "beistand", seite: "gibt", label: "Beistandsverpflichtung",
    text: "Ein Angriff auf einen Partner gilt als Angriff auf alle; Ankara verpflichtet sich zu Hilfe im Ernstfall.",
    pk: 3,
    abschluss: [stoss("abschreckung", 2), stoss("beziehungen_usa", -1)],
    dauer: [stuetze("abschreckung", 2)],
    land: { sicherheit: 12, vertrauen: 6 },
    kehrseite: "Beistand heißt: im Ernstfall Truppen. Ein Vertrag, den man nur einmal bricht.",
    mindestens: { dim: "vertrauen", wert: 55, text: "Beistand versprechen nur enge Partner." },
  },
  {
    id: "seesicherheit", seite: "gibt", label: "Minenräumung und Seesicherheit im Schwarzen Meer",
    text: "Gemeinsame Kräfte räumen Minen und sichern Schifffahrtswege im Schwarzen Meer.",
    pk: 1,
    dauer: [stuetze("abschreckung", 0.8), stuetze("logistik", 0.6)],
    land: { sicherheit: 6, vertrauen: 4 },
    kehrseite: "Türkische Schiffe im Krisengebiet: ein Zwischenfall reicht für eine Krise mit Moskau.",
  },
  {
    id: "bohrung", seite: "gibt", label: "Türkische Erkundung und Förderung",
    text: "Türkische Firmen erkunden und fördern Öl und Gas auf dem Gebiet des Partners.",
    pk: 1,
    dauer: [stuetze("energieimporte", -1), stuetze("energiepreise", -0.5)],
    land: { handel: 6, vertrauen: 2 },
    kehrseite: "Streit mit Ägypten und Griechenland um Seegrenzen und Hoheitsrechte.",
  },

  // ------------------------------------------------------------------ Türkei will
  {
    id: "w_zoll", seite: "will", label: "Marktzugang für türkische Waren",
    text: "Türkische Hersteller dürfen zu gleichen Bedingungen liefern; Handelshürden fallen.",
    dauer: [stuetze("export", 2.5), stuetze("industrie", 1.5)],
    land: {},
    kehrseite: "Für den Partner ein Preis: Seine Hersteller haben das Nachsehen.",
  },
  {
    id: "w_zollunion", seite: "will", label: "Zollunion modernisieren",
    text: "Die Zollunion von 1995 wird auf Dienstleistungen, Landwirtschaft und öffentliche Aufträge ausgeweitet.",
    abschluss: [stoss("ansehen", 1)],
    dauer: [stuetze("export", 3), stuetze("industrie", 2), stuetze("investitionen", 1.5)],
    land: {},
    kehrseite: "Griechenland und Zypern blockieren seit Jahren; jede Bewegung dort kostet die anderen etwas.",
  },
  {
    id: "w_visa", seite: "will", label: "Visafreiheit für Türkinnen und Türken",
    text: "Kurzaufenthalte im Schengenraum ohne Visum: der Kern dessen, was viele Türken von Europa erwarten.",
    abschluss: [stoss("staedtische_saekulare", 3), stoss("junge", 3), stoss("ansehen", 1.5)],
    land: {},
    kehrseite: "Brüssel verlangt dafür Gegenleistungen, die im eigenen Land wehtun.",
  },
  {
    id: "w_ruestung", seite: "will", label: "Zugang zu Rüstungstechnik",
    text: "Kampfflugzeuge, Triebwerke und Ersatzteile: Der Partner gibt frei, was heute gesperrt ist.",
    dauer: [stuetze("modernisierung", 3), stuetze("abschreckung", 1.5), stuetze("bereitschaft_luft", 2)],
    land: {},
    kehrseite: "Abhängigkeit vom Lieferanten: Wer liefert, kann auch wieder sperren.",
  },
  {
    id: "w_sanktion", seite: "will", label: "Sanktionen aufheben",
    text: "Die Sanktionen gegen die türkische Rüstungsbehörde und ihre Lieferketten entfallen.",
    abschluss: [stoss("ansehen", 1)],
    dauer: [stuetze("investitionen", 1), stuetze("vertrauen_maerkte", 1.5), stuetze("auslandskapital", 1)],
    land: {},
    kehrseite: "Der Partner verlangt dafür, dass Ankara Position bezieht.",
  },
  {
    id: "w_preis", seite: "will", label: "Preisnachlass beim Gas",
    text: "Der Lieferant senkt den Preis; für die Türkei ein Hebel gegen hohe Energiepreise.",
    dauer: [stuetze("energiepreise", -2), stuetze("lebenshaltung", -1)],
    land: {},
    kehrseite: "Ein Nachlass wird beim nächsten Mal zurückverlangt.",
  },
  {
    id: "w_aufschub", seite: "will", label: "Zahlungsaufschub für Gasrechnungen",
    text: "Rechnungen für Gaslieferungen werden gestundet; der Haushalt gewinnt Luft.",
    abschluss: [{ t: "schulden", d: -0.15 }],
    dauer: [stuetze("vertrauen_maerkte", 0.5)],
    land: {},
    kehrseite: "Gestundetes Geld ist nicht gespart; die Schuld wächst leise.",
  },
  {
    id: "w_swap", seite: "will", label: "Kredit oder Währungsswap",
    text: "Der Partner stellt Devisen oder einen Swap bereit; die Reserven der Zentralbank steigen.",
    abschluss: [{ t: "risiko", d: -12 }, { t: "schulden", d: 0.1 }],
    dauer: [stuetze("vertrauen_maerkte", 2), stuetze("auslandskapital", 1.5)],
    land: {},
    kehrseite: "Geldgeber stellen Bedingungen; das Geld ist nie umsonst.",
  },
  {
    id: "w_pkk", seite: "will", label: "Vorgehen gegen PKK und ihre Ableger",
    text: "Der Partner geht gegen bewaffnete Gruppen auf seinem Gebiet vor und stimmt Grenzoperationen ab.",
    abschluss: [stoss("konservative", 1.5)],
    dauer: [stuetze("terrorgefahr", -2)],
    land: {},
    kehrseite: "Ein Versprechen, das nur zählt, wenn es gehalten wird; die Türkei trägt sonst wieder allein.",
  },
  {
    id: "w_rueckkehr", seite: "will", label: "Rückkehr von Geflüchteten aufnehmen",
    text: "Der Partner nimmt Geflüchtete zurück, die freiwillig heimkehren wollen; die Türkei begleitet die Rückkehr.",
    abschluss: [stoss("konservative", 1)],
    dauer: [stuetze("gefluechtete", -3)],
    land: {},
    kehrseite: "Rückkehr ohne Wiederaufbau bleibt ein Wort; ohne Sicherheit kehren nur wenige zurück.",
  },
  {
    id: "w_stuetzpunkt", seite: "will", label: "Stützpunkte und Zugang",
    text: "Türkische Streitkräfte erhalten Zugang zu Häfen, Flugplätzen und Ausbildungsplätzen.",
    abschluss: [stoss("ansehen", -0.5)],
    dauer: [stuetze("abschreckung", 1.5)],
    land: {},
    kehrseite: "Ein Stützpunkt im Ausland kostet Geld und macht zum Ziel.",
  },
  {
    id: "w_pipeline", seite: "will", label: "Öl- und Gasleitung nutzen",
    text: "Die Leitung zum türkischen Hafen wird verlässlich betrieben; Ceyhan bleibt Ausfuhrpunkt.",
    dauer: [stuetze("logistik", 1), stuetze("energieimporte", -1)],
    land: {},
    kehrseite: "Ein Bagdader Streit um Öleinnahmen wird schnell zum türkischen Problem.",
  },
  {
    id: "w_transit", seite: "will", label: "Transit für türkische Güter und Leitungen",
    text: "Türkische Waren, Leitungen und Bahnen dürfen den Nachbarn queren.",
    dauer: [stuetze("logistik", 1.5), stuetze("export", 0.6)],
    land: {},
    kehrseite: "Abhängig ist, wer durch fremdes Land liefern muss.",
  },
  {
    id: "w_hafen", seite: "will", label: "Hafen- und Standortrechte",
    text: "Türkische Betreiber bekommen Konzessionen für Häfen und Logistikzentren.",
    dauer: [stuetze("logistik", 1.2), stuetze("investitionen", 0.5)],
    land: {},
    kehrseite: "Konzessionen im Ausland hängen an der Laune der Regierung dort.",
  },
  {
    id: "w_werk", seite: "will", label: "Fabrikansiedlung in der Türkei",
    text: "Ein Hersteller baut ein Werk in der Türkei: Arbeitsplätze und Technik statt Einfuhr.",
    dauer: [stuetze("industrie", 2), stuetze("arbeitsplaetze_industrie", 1.5), stuetze("investitionen", 1)],
    land: {},
    kehrseite: "Ein Werk kommt mit Auflagen und Zulieferern, die nicht türkisch sind.",
  },
  {
    id: "w_1915", seite: "will", label: "Verzicht auf die Anerkennungskampagne von 1915",
    text: "Der Partner beendet die Kampagne, die Ereignisse von 1915 international als Völkermord anerkennen zu lassen.",
    abschluss: [stoss("konservative", 3), stoss("ansehen", 1)],
    land: {},
    kehrseite: "Eine Forderung, die den Partner im Kern seiner Erinnerung trifft.",
  },
  {
    id: "w_inseln", seite: "will", label: "Entmilitarisierung der Inseln",
    text: "Die Ägäisinseln mit entmilitarisiertem Status werden nicht bewaffnet, wie es die Verträge von Lausanne und Paris vorsehen.",
    abschluss: [stoss("konservative", 2), stoss("abschreckung", 1)],
    land: {},
    kehrseite: "Für Athen eine Rote Linie: Es sieht in der Bewaffnung sein Recht auf Selbstverteidigung.",
  },
  {
    id: "w_seegrenze", seite: "will", label: "Ausgleich bei Seegrenzen und Festlandsockel",
    text: "Seegrenzen, Festlandsockel und Gasfelder werden verhandelt, nicht einseitig erklärt.",
    abschluss: [stoss("konservative", 1.5)],
    dauer: [stuetze("energieimporte", -1.2), stuetze("abschreckung", 0.5)],
    land: {},
    kehrseite: "Jeder Kompromiss auf See sieht im Inneren nach Nachgeben aus.",
  },
  {
    id: "w_trnc", seite: "will", label: "Gleichberechtigung Nordzyperns",
    text: "Die Republik Zypern erkennt die Gleichberechtigung der Volksgruppen an; Ankaras Ziel ist eine Lösung mit zwei Staaten.",
    abschluss: [stoss("konservative", 3), stoss("ansehen", -1)],
    land: {},
    kehrseite: "Eine Rote Linie der Republik Zypern; sie erklärt jede Anerkennung Nordzyperns zum Verstoß gegen UN-Beschlüsse.",
  },
  {
    id: "w_direkthandel", seite: "will", label: "Direkthandel mit Nordzypern",
    text: "Waren und Reisende aus dem Norden der Insel dürfen ohne Umweg in die EU.",
    abschluss: [stoss("konservative", 1.5)],
    dauer: [stuetze("tourismus", 0.5)],
    land: {},
    kehrseite: "Nikosia wertet jeden Direkthandel als Aufwertung der Teilung.",
  },
  {
    id: "w_libyen", seite: "will", label: "Gemeinsame Linie in Libyen",
    text: "Abstimmung statt Stellvertreterkonkurrenz: Beide Seiten sprechen mit denselben Partnern in Libyen.",
    abschluss: [stoss("ansehen", 1)],
    dauer: [stuetze("abschreckung", 0.5)],
    land: {},
    kehrseite: "Wer sich abstimmt, muss auf den eigenen Vorteil im Land verzichten.",
  },
  {
    id: "w_getreide", seite: "will", label: "Getreide- und Handelskorridor",
    text: "Getreide und Düngemittel fahren durch das Schwarze Meer; Häfen und Versicherer arbeiten wieder.",
    dauer: [stuetze("lebensmittelpreise", -1.5), stuetze("export", 0.5)],
    land: {},
    kehrseite: "Ein Korridor hält nur, solange beide Seiten still halten.",
  },
  {
    id: "w_luftraum", seite: "will", label: "Überflug und Luftraum öffnen",
    text: "Flüge dürfen wieder über das Gebiet des Partners führen; Fluglinien und Fracht profitieren.",
    dauer: [stuetze("tourismus", 0.6), stuetze("logistik", 0.4)],
    land: {},
    kehrseite: "Ein Zugeständnis im Luftraum wird zu Hause als Schwäche gelesen.",
  },
  {
    id: "w_investition_zusage", seite: "will", label: "Investitionszusagen und Einlagen",
    text: "Staatsfonds und Banken des Partners legen Geld in der Türkei an.",
    dauer: [stuetze("auslandskapital", 2.5), stuetze("investitionen", 1.5)],
    land: {},
    kehrseite: "Geld aus dem Ausland folgt Bedingungen; wer zahlt, will mitreden.",
  },
  {
    id: "w_akkuyu", seite: "will", label: "Akkuyu vollenden: Zahlungsweg und Fertigstellung",
    text: "Das erste Kernkraftwerk geht ans Netz; der Zahlungsweg wird gesichert, gestundete Gelder werden freigegeben.",
    dauer: [stuetze("stromversorgung", 1.5), stuetze("energieimporte", -1)],
    land: {},
    kehrseite: "Ein Kraftwerk in russischer Hand: Wer den Brennstoff liefert, hat das letzte Wort.",
  },
  {
    id: "w_handelsziel", seite: "will", label: "Handelsziel und Rüstungsproduktion",
    text: "Der Handel wächst auf ein gemeinsames Ziel, dazu gemeinsame Rüstungsproduktion.",
    dauer: [stuetze("export", 2), stuetze("industrie", 1)],
    land: {},
    kehrseite: "Handelsziele sind nur Wünsche, solange die Zölle nicht fallen.",
  },
  {
    id: "w_defizit", seite: "will", label: "Ausgleich des Handelsdefizits",
    text: "Ein Teil der Einfuhren wird durch türkische Lieferungen ausgeglichen; das Defizit sinkt.",
    dauer: [stuetze("export", 2), stuetze("kostendruck", -0.5)],
    land: {},
    kehrseite: "Der Partner verlangt im Gegenzug Zugeständnisse bei Investitionen.",
  },
];

export const KLAUSEL_NACH_ID: Record<string, KlauselDef> = Object.fromEntries(KLAUSELN.map((k) => [k.id, k]));

/** Ausstrahlung auf Dritte: Wer mit dem einen paktiert, verärgert den anderen (Klausel oder Land → betroffene Länder). */
export const AUSSTRAHLUNG: Record<string, { land: string; dim: Dimension; d: number; text: string }[]> = {
  "ruestung_koop@AZE": [{ land: "ARM", dim: "vertrauen", d: -6, text: "Erevan sieht die Aufrüstung Bakus mit Sorge." }],
  "ruestung_koop@UKR": [{ land: "RUS", dim: "vertrauen", d: -6, text: "Moskau wertet Drohnenlieferungen an Kiew als Parteinahme." }],
  "ruestung_koop@LBY": [{ land: "EGY", dim: "vertrauen", d: -5, text: "Kairo sieht Ankaras Rolle in Libyen als Gegenspiel." }, { land: "GRC", dim: "vertrauen", d: -4, text: "Athen sieht die türkische Präsenz in Libyen und das Seegrenz-Memorandum mit Sorge." }],
  "ruestung_koop@SYR": [{ land: "ISR", dim: "vertrauen", d: -4, text: "Jerusalem wertet türkische Rüstungszusammenarbeit mit Damaskus als Bedrohung." }],
  "ruestung_koop@SAU": [{ land: "IRN", dim: "vertrauen", d: -4, text: "Teheran beobachtet den Rüstungsbund am Golf." }],
  "gas_kauf@RUS": [{ land: "USA", dim: "vertrauen", d: -4, text: "Washington sieht jeden Gasvertrag mit Moskau kritisch." }, { land: "EU", dim: "vertrauen", d: -3, text: "Brüssel will Russlands Energieeinnahmen austrocknen." }],
  "gas_kauf@IRN": [{ land: "USA", dim: "vertrauen", d: -5, text: "Washington droht mit Sekundärsanktionen." }],
  "grenzoeffnung@ARM": [{ land: "AZE", dim: "vertrauen", d: -6, text: "Baku verlangt zuerst einen Friedensvertrag mit Armenien." }],
  "s400@USA": [{ land: "RUS", dim: "vertrauen", d: -8, text: "Moskau verliert einen Großkunden und sieht die Türkei im westlichen Lager." }],
  "ende_sperre@ISR": [{ land: "SAU", dim: "vertrauen", d: -2, text: "Manche arabische Partner lesen die Öffnung als Signal an Jerusalem." }],
  "beistand@SAU": [{ land: "IRN", dim: "vertrauen", d: -5, text: "Teheran liest den Pakt als Bündnis gegen sich." }],
  "w_seegrenze@EGY": [{ land: "GRC", dim: "vertrauen", d: -3, text: "Athen fürchtet eine Absprache über den Kopf Griechenlands." }],
  "transit@KAZ": [{ land: "RUS", dim: "vertrauen", d: -2, text: "Moskau sieht die Umgehung seines Transitnetzes." }],
};

export interface LandProfil {
  /** Wie sehr der Partner die Türkei braucht (+) oder umgekehrt (−); verschiebt die Bewertung */
  hebel: number;
  /** Klauseln, die der Partner nie annimmt */
  rot: string[];
  /** Was jede Klausel dem Partner wert ist (+) oder kostet (−), in Punkten der Bewertung */
  werte: Record<string, number>;
  /** Landesspezifische Fassung des Klauseltextes, mit belegten Tatsachen */
  texte?: Record<string, { label?: string; text?: string }>;
  /** Warum der Partner so verhandelt: ein Satz zum Hebel */
  hebelText: string;
  /** Rote-Linien-Begründung je Klausel */
  rotText?: Record<string, string>;
}

export const PROFILE: Record<string, LandProfil> = {
  USA: {
    hebel: -2, rot: [],
    hebelText: "Washington sitzt am längeren Hebel: Es liefert die Technik, die Ankara braucht.",
    werte: { s400: 9, ruestung_kauf: 6, militaerzugang: 4, sanktionen_umgehung: 6, vermittlung_zusage: 2, gas_kauf: 5, investitionen_oeffnen: 2, w_ruestung: -5, w_sanktion: -6 },
    texte: {
      w_ruestung: { label: "F-35, F110-Triebwerke und Ersatzteile freigeben", text: "Washington gibt die gesperrte Technik frei: F-35-Kampfjets (die Türkei will 40), F110-Triebwerke für das Kampfflugzeug KAAN, Ersatzteile für die F-16." },
      w_sanktion: { label: "CAATSA-Sanktionen aufheben", text: "Die Sanktionen gegen die türkische Rüstungsbehörde wegen des Kaufs der S-400 entfallen." },
      s400: { text: "Das russische Luftabwehrsystem S-400 wird eingelagert oder stillgelegt; das Gesetz zur Verteidigung der USA (NDAA §1245) knüpft den Weg zurück an genau diese Bedingung." },
      gas_kauf: { label: "Amerikanisches Flüssiggas kaufen", text: "Langfristige Lieferverträge über US-LNG: ein Teil des Gases kommt nicht mehr aus Moskau." },
    },
  },
  EU: {
    hebel: 0, rot: [],
    hebelText: "Brüssel ist der größte Handelspartner, aber ein Bündnis von 27: Jede Bewegung braucht Einstimmigkeit.",
    werte: { reform_zusage: 9, zoll: 5, sanktionen_umgehung: 6, migration_zusage: 7, investitionen_oeffnen: 2, vermittlung_zusage: 1, w_zollunion: -5, w_visa: -7, w_ruestung: -4 },
    texte: {
      w_zollunion: { text: "Die Zollunion von 1995 wird modernisiert; Griechenland und Zypern blockieren bisher." },
      w_ruestung: { label: "SAFE-Teilnahme (europäische Rüstungsprogramme)", text: "Die Türkei darf an den gemeinsamen Rüstungsprogrammen der EU teilnehmen." },
      w_visa: { text: "Visafreiheit für Kurzaufenthalte im Schengenraum; Brüssel knüpft sie an Reformen bei Rechtsstaat und Terrorgesetzen." },
    },
  },
  RUS: {
    hebel: 0, rot: [],
    hebelText: "Moskau braucht die Türkei als Tor nach Westen; Ankara braucht Moskaus Gas und Akkuyu.",
    werte: { gas_kauf: 8, zoll: 3, meerengen: 4, vermittlung_zusage: 3, investitionen_oeffnen: 2, zahlungsweg: 7, transit: 5, w_preis: -6, w_aufschub: -4, w_akkuyu: -3, w_getreide: -2 },
    texte: {
      gas_kauf: { label: "Gasverträge verlängern", text: "Die Gasverträge mit Russland laufen Ende 2026 aus; es geht um rund 22 Milliarden Kubikmeter im Jahr." },
      w_akkuyu: { text: "Akkuyu wird fertig; rund 2 Milliarden US-Dollar stecken wegen der Sanktionen fest, ein Zahlungsweg muss her." },
      transit: { label: "Türkei als Gas-Drehkreuz", text: "Russisches Gas geht über türkisches Gebiet weiter nach Südeuropa." },
    },
  },
  GRC: {
    hebel: -1, rot: ["w_inseln"],
    hebelText: "Athen hat als EU- und NATO-Mitglied Rückhalt, den es im Streit mit Ankara nutzt.",
    werte: { v_casus: 7, verzicht_bohrung: 6, migration_zusage: 6, vermittlung_zusage: 1, w_inseln: -99, w_seegrenze: -8, w_zollunion: -3 },
    rotText: { w_inseln: "Athen erklärt die Bewaffnung der Inseln zum Recht auf Selbstverteidigung; über den Status spricht es nicht." },
    texte: {
      v_casus: { text: "Der Parlamentsbeschluss von 1995 (Kriegsgrund bei zwölf Seemeilen) wird nicht mehr bekräftigt; Athen nennt das seit Jahren als Bedingung für Gespräche über die Seegrenzen." },
      w_seegrenze: { label: "Zwölf-Meilen-Zone und Festlandsockel verhandeln", text: "Seegrenzen und Festlandsockel werden verhandelt, nicht einseitig erklärt; das Kabelprojekt Great Sea Interconnector hängt daran." },
    },
  },
  IRN: {
    hebel: 0, rot: [],
    hebelText: "Beide brauchen einander: Teheran den Markt, Ankara das Gas.",
    werte: { gas_kauf: 8, zoll: 4, visa: 3, vermittlung_zusage: 3, transit: 2, zahlungsweg: 8, w_pkk: -4, w_preis: -5 },
    texte: {
      gas_kauf: { label: "Gasvertrag verlängern", text: "Der Vertrag über etwa 9,6 Milliarden Kubikmeter im Jahr lief Ende Juli 2026 aus; ehemalige BOTAŞ-Manager halten eine automatische Verlängerung um fünf Jahre für möglich." },
      w_pkk: { label: "Vorgehen gegen PJAK", text: "Teheran geht gegen die kurdische Gruppe PJAK an der Grenze vor." },
      vermittlung_zusage: { text: "Ankara vermittelt bei einer Waffenruhe und bei Fragen wie der Straße von Hormus." },
    },
  },
  SYR: {
    hebel: 4, rot: [],
    hebelText: "Damaskus ist auf Ankara angewiesen: Wiederaufbau, Strom und Sicherheit hängen an der Türkei.",
    werte: { bauauftraege: 8, ruestung_koop: 7, energie_lieferung: 6, kredit_hilfe: 6, visa: 2, w_rueckkehr: -5, w_pkk: -3, w_stuetzpunkt: -3 },
    texte: {
      ruestung_koop: { label: "Ausbildungs- und Rüstungsabkommen", text: "Türkische Ausbilder und Systeme für die syrischen Streitkräfte." },
      energie_lieferung: { label: "Strom und Gas über die Kilis–Aleppo-Leitung", text: "Die Kilis–Aleppo-Leitung und Stromnetze werden ausgebaut; der Wiederaufbau braucht beides." },
      w_pkk: { label: "SDF in den Staat integrieren", text: "Die kurdisch geführten SDF werden in die syrischen Streitkräfte eingegliedert; Ankara will keine eigenständige Kraft an der Grenze." },
      w_stuetzpunkt: { text: "Türkische Stützpunkte im Norden Syriens bleiben; Damaskus muss zustimmen." },
    },
  },
  IRQ: {
    hebel: 0, rot: [],
    hebelText: "Bagdad braucht Wasser aus der Türkei; Ankara braucht Ruhe an der Grenze und die Pipeline.",
    werte: { wasser: 8, bauauftraege: 6, zoll: 3, transit: 4, kredit_hilfe: 3, w_pipeline: -3, w_pkk: -6 },
    texte: {
      w_pipeline: { label: "Kirkuk–Ceyhan-Leitung", text: "Der Einjahresvertrag vom August 2026 wird verlängert; Ziel sind eine Million Barrel am Tag." },
      transit: { label: "Entwicklungsstraße", text: "Die geplante Entwicklungsstraße von Basra zur türkischen Grenze verbindet Golf und Europa." },
      wasser: { text: "Bagdad verlangt feste Abflussmengen aus den türkischen Staudämmen; bisher gibt es Projekte ohne zugesagte Wassermenge." },
      w_pkk: { text: "Bagdad koordiniert das Vorgehen gegen die PKK auf irakischem Gebiet, statt Militäreinsätze zu dulden." },
    },
  },
  AZE: {
    hebel: 1, rot: [],
    hebelText: "Baku und Ankara sind eng verbunden, aber Baku hat das Gas und den Korridor nach Osten.",
    werte: { ruestung_koop: 7, gas_kauf: 7, beistand: 8, investitionen_oeffnen: 3, w_transit: -2, w_preis: -3 },
    texte: {
      gas_kauf: { text: "Gas über die Pipelines TANAP und TAP; die Leitung Iğdır–Nachitschewan von 2025 ist der Anfang." },
      w_transit: { label: "Nachitschewan-Bahn und Leitung", text: "Die Bahn Kars–Nachitschewan und die Verbindung über TRIPP verbinden die Türkei mit Baku." },
    },
  },
  ARM: {
    hebel: 0, rot: ["w_1915"],
    hebelText: "Erevan will die Grenze und die Bahn, aber nicht um den Preis seiner Erinnerung.",
    werte: { grenzoeffnung: 9, transit: 5, zoll: 3, w_transit: -6, w_1915: -99 },
    rotText: { w_1915: "Erevan verlangt die Anerkennung von 1915; auf sie zu verzichten, hieße, seine Erinnerung zu verkaufen." },
    texte: {
      grenzoeffnung: { text: "Grenzöffnung für Drittstaatler und Diplomaten ist vereinbart, aber nicht umgesetzt; Direktflüge gibt es seit 2026." },
      transit: { label: "Bahn Gjumri–Kars", text: "Die Bahn zwischen Gjumri und Kars verbindet beide Länder." },
      w_transit: { label: "Transit über den Sangesur-Korridor (TRIPP)", text: "Die Verbindung nach Nachitschewan und Baku führt über armenisches Gebiet; Transit gegen Grenzöffnung ist der Kern eines Ausgleichs." },
    },
  },
  SAU: {
    hebel: -2, rot: [],
    hebelText: "Die Golfstaaten haben das Geld; Ankara braucht ihre Einlagen und Aufträge.",
    werte: { ruestung_koop: 8, bauauftraege: 5, militaerzugang: 4, beistand: 7, w_swap: -4, w_investition_zusage: -5 },
    texte: {
      beistand: { label: "Beistandspakt ausbauen", text: "Am 7. August 2026 unterzeichneten Saudi-Arabien, Pakistan und die Türkei einen Beistandspakt; er wird jetzt mit Leben gefüllt." },
      ruestung_koop: { label: "KAAN und Luftabwehr", text: "Das Kampfflugzeug KAAN ist in Endverhandlung; dazu kommt Luftabwehr." },
    },
  },
  ISR: {
    hebel: 0, rot: [],
    hebelText: "Handel läuft trotz Streit; die Sperre ist das Druckmittel beider Seiten.",
    werte: { ende_sperre: 9, zoll: 4, vermittlung_zusage: 3, w_luftraum: -2, w_zoll: -2 },
    texte: {
      ende_sperre: { text: "Die Handels- und Häfensperre beendet die Verbindungen; ein Ende ist der Preis für alles Weitere." },
      vermittlung_zusage: { label: "Türkei im Friedensrat für Gaza", text: "Die Türkei ist Mitglied im Friedensrat für Gaza; Jerusalem will sie dort zurückhaltend sehen." },
    },
  },
  CHN: {
    hebel: 0, rot: [],
    hebelText: "China ist der größere Markt, die Türkei der Tor zum Westen: ein Handel unter Gleichen mit Schlagseite.",
    werte: { investitionen_oeffnen: 6, transit: 5, zoll: 4, bauauftraege: 2, w_defizit: -5, w_werk: -5, w_swap: -4 },
    texte: {
      w_defizit: { label: "Handelsdefizit ausgleichen", text: "Das Handelsdefizit betrug 2025 rund 46,3 Milliarden US-Dollar; Ankara verlangt Ausgleich über Zölle, Quoten und Investitionen." },
      w_werk: { label: "Werk in der Türkei (BYD)", text: "Ein BYD-Werk in der Türkei wurde abgesagt; Ankara will eine neue Zusage." },
      w_swap: { label: "RMB-Clearing und Swap", text: "Seit November 2025 gibt es eine Abrechnung in Renminbi; ein größerer Swap würde die Reserven stützen." },
      transit: { label: "Mittlerer Korridor", text: "Bahn und Häfen als Landbrücke zwischen China und Europa, an Russland vorbei." },
    },
  },
  UKR: {
    hebel: 0, rot: [],
    hebelText: "Kiew braucht Ankaras Meerengen und Drohnen, Ankara braucht Kiews Vertrauen.",
    werte: { ruestung_koop: 8, meerengen: 7, bauauftraege: 6, vermittlung_zusage: 4, seesicherheit: 4, w_getreide: -3, w_zoll: -3 },
    texte: {
      seesicherheit: { label: "Minenräumung im Schwarzen Meer (Maritime Component Command)", text: "Im April 2026 wurde ein gemeinsames Seekommando eingerichtet; die Minenräumung ist sein erster Auftrag." },
      vermittlung_zusage: { label: "Vermittlung: Gefangenenaustausch in Istanbul", text: "Ankara richtet Gespräche und den Austausch von Gefangenen in Istanbul aus." },
    },
  },
  GEO: {
    hebel: 2, rot: [],
    hebelText: "Tiflis braucht die Türkei als Absatzmarkt und Tor nach Westen.",
    werte: { transit: 6, zoll: 3, visa: 3, ruestung_koop: 2, investitionen_oeffnen: 3, w_transit: -2, w_hafen: -4 },
    texte: {
      transit: { label: "Bahn Baku–Tiflis–Kars (BTK)", text: "Die Bahn ist seit dem 2. Juni 2026 im Volllastbetrieb; der Ausbau geht weiter." },
      w_hafen: { label: "Hafen Anaklia", text: "Türkische Betreiber wollen den Tiefseehafen Anaklia am Schwarzen Meer mit betreiben." },
    },
  },
  EGY: {
    hebel: 0, rot: [],
    hebelText: "Kairo war lange Gegenspieler; die Annäherung seit Februar 2026 trägt, aber Libyen und die Seegrenzen belasten.",
    werte: { ruestung_koop: 7, zoll: 5, investitionen_oeffnen: 3, w_handelsziel: -4, w_libyen: -6, w_seegrenze: -5 },
    texte: {
      w_handelsziel: { label: "Handel von 8 auf 15 Milliarden Dollar", text: "Die Strategische Partnerschaft vom Februar 2026 sieht vor, den Handel von 8 auf 15 Milliarden US-Dollar zu steigern, dazu gemeinsame Rüstungsproduktion." },
    },
  },
  LBY: {
    hebel: 2, rot: [],
    hebelText: "Tripolis lehnt sich an Ankara an: Truppen, Ausbildung und Aufträge stützen die Regierung dort.",
    werte: { ruestung_koop: 7, militaerzugang: 5, bauauftraege: 6, bohrung: 4, w_seegrenze: -2, w_stuetzpunkt: -3 },
    texte: {
      w_seegrenze: { label: "Seegrenz-Memorandum von 2019 bekräftigen", text: "Das Abkommen von 2019 über die Seegrenzen im östlichen Mittelmeer wird bekräftigt; Griechenland, Ägypten und Zypern lehnen es ab." },
    },
  },
  KAZ: {
    hebel: 0, rot: [],
    hebelText: "Astana verhandelt ohne Eile: Es hat mehrere Partner und lässt sich keinem ganz.",
    werte: { transit: 6, bauauftraege: 5, ruestung_koop: 4, investitionen_oeffnen: 3, visa: 2, w_transit: -3, w_investition_zusage: -3 },
    texte: {
      transit: { label: "Mittlerer Korridor über das Kaspische Meer", text: "Bahn, Häfen und Schiffe an der Trans-Kaspischen Route, an Russland vorbei." },
    },
  },
  CYP: {
    hebel: -1, rot: ["w_trnc"],
    hebelText: "Nikosia ist EU-Mitglied und nutzt den Rückhalt: Ohne Bewegung der Türkei gibt es keine Gefälligkeit.",
    werte: { hafen_oeffnung: 9, verzicht_bohrung: 7, vermittlung_zusage: 3, w_direkthandel: -8, w_seegrenze: -6, w_trnc: -99, w_zollunion: -3 },
    rotText: { w_trnc: "Nikosia erkennt Nordzypern nicht an; jede Zwei-Staaten-Lösung verstößt aus seiner Sicht gegen die UN-Beschlüsse." },
    texte: {
      verzicht_bohrung: { label: "Keine Bohrungen in der zyprischen Wirtschaftszone", text: "Bohrschiffe bleiben aus dem Gebiet, das Zypern als seine ausschließliche Wirtschaftszone beansprucht." },
    },
  },
};

export const VERTRAGSLAUFZEITEN = [2, 5, 10] as const;
export type Laufzeit = (typeof VERTRAGSLAUFZEITEN)[number];
