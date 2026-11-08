// Zustand eines Konfliktvorgangs (MIL-1 „Krieg als Vorgang“).
// Der Präsident bestellt und verantwortet, er kommandiert nicht: Es gibt keine Taktik, nur
// Vorbereitung, Beschlüsse, eine abstrakte Frontlage, eine Erschöpfungsuhr und den Preis des Friedens.
// Alles reines JSON, damit Speichern und Laden wie beim übrigen Weltzustand funktionieren.
// Alle Zahlen dieser Schicht sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import type { OperationsFormId, VerbuendeteId } from "../data/operationen";

/** Die sechs Zustände des Vorgangs (Suzerain-Ableitung, RECHERCHE_SUZERAIN_KRIEGSMATRIX.md §9.1). */
export type KriegPhase = "spannung" | "drohkulisse" | "beschluss" | "krieg" | "waffenruhe" | "frieden" | "beendet";

/**
 * Die Kriegs-Rahmung (Civ6-Prinzip, RECHERCHE_VERTIEFUNG_KRIEG.md §4.1): Die deklarierte Begründung
 * legt die Preise der Folgehandlungen fest — Parlament, Weltöffentlichkeit und Wähler rechnen danach ab.
 *   verteidigung — Selbstverteidigung nach Zwischenfall (billigste, braucht hohe Eskalation als Beleg)
 *   schutz       — Schutz von Minderheiten (mittlerer Preis)
 *   beistand     — vertragliche Beistandspflicht (braucht einen laufenden Vertrag als Beleg)
 *   revision     — offene Revision (ungerahmter Angriff: innen billig, außen sehr teuer)
 */
export type KriegsRahmung = "verteidigung" | "schutz" | "beistand" | "revision";

/** Mobilisierungsstufen: keine, teilweise, voll (Vic3: Hochfahren kostet, Runterfahren kostet noch einmal). */
export type Mobilmachung = 0 | 1 | 2;

export type KriegsAusgang = "sieg" | "niederlage" | "rueckzug" | "weisser_frieden" | "frieden" | "eingefroren" | "nachgegeben" | "abgeklungen";

/** Ein eingebrachter Einsatzbeschluss, der auf die Abstimmung wartet (Weg „parlament“) oder sofort galt („erlass“). */
export interface KriegBeschluss {
  /** „vollmacht“: Einsatz auf eine stehende Rahmenvollmacht der Großen Nationalversammlung (sim/krieg-recht.ts), ohne neue Abstimmung */
  weg: "parlament" | "erlass" | "vollmacht";
  /** Tag der Abstimmung (nur Weg „parlament“) */
  abstimmung: number;
  rahmung: KriegsRahmung;
}

/**
 * Wer an der Seite der Türkei oder des Gegners kämpft (sim/pakte.ts): Die Koalition ersetzt die frühere Pauschale
 * „Beistands-Klausel gibt höchstens +15 Prozent“. Pflicht entsteht nur aus Pakten (Klausel „kollektiv“ oder „beistand“) und nur, wenn ein
 * Mitglied ANGEGRIFFEN wird; wer selbst angreift, löst keinen Bündnisfall aus (und sitzt der Pakt mit beiden Streitparteien am Tisch,
 * spaltet der Krieg den Pakt, statt ihn zu verpflichten). Alle Zahlen sind Spielparameter.
 */
export interface KoalitionsPartner {
  /** Akteur-Kennung (Hauptakteur oder weiterer Staat) */
  id: string;
  seite: "eigen" | "gegner";
  /** Tag des Beitritts */
  seit: number;
  /** Warum er mitmacht, in einem Satz */
  grund: string;
  /** Pakt, aus dem die Pflicht stammt (Institutions-Kennung oder „bilateral-<Land>“) */
  pakt?: string;
  /** Ob eine Beistandspflicht bestand (sonst reines Eigeninteresse) */
  pflicht: boolean;
  /** Verbleibende Kampfkraft 0 bis 1; sinkt, wenn die Seite verliert, der Partner steigt bei 0 aus */
  rest: number;
  /** Einsatzgrad 0,4 bis 1: wie voll der Partner mitmacht */
  einsatz: number;
}

export interface KoalitionsAbwesender {
  id: string;
  seite: "eigen" | "gegner";
  /** Ob eine Pflicht bestand und nicht erfüllt wurde (kostet die Türkei Vertrauen, falls sie die Seite ist) */
  pflicht: boolean;
  grund: string;
  /** Punkte der letzten Bewertung (für die Anzeige „zögert“: zwischen Zögerschwelle und Beitrittsschwelle) */
  punkte: number;
  /** Ob er noch zögert (wird weiter geprüft) oder endgültig draußen bleibt */
  zoegert: boolean;
  /** Kämpft auf dieser Seite grundsätzlich nicht (enger Verbündeter des Gegners, EU gegen EU; sim/pakte.ts kampfSperre) */
  gesperrt?: boolean;
}

export interface KriegKoalition {
  /** Wer zuerst angriff: die Türkei (Beschluss, Erlass) oder der Gegner (Schlag aus der Drohkulisse) */
  aggressor: "tuerkei" | "gegner";
  partner: KoalitionsPartner[];
  abwesend: KoalitionsAbwesender[];
  /** Pakt, der durch den Krieg zwischen zwei Mitgliedern gespalten wurde (keine automatische Pflicht) */
  spaltung?: string;
  /** EU-Staaten, die statt eines Kriegseintritts ihre Rüstungsausfuhr in die Türkei stoppen, solange der Krieg läuft */
  exportstopp?: string[];
  /** Tag der letzten Bewertung und der letzten Bitte um Beistand (Abkühlung) */
  bewertet: number;
  gerufen?: number;
}

/** Kriegs-Klauseln des Friedenspakets (schrittweiser Frieden, RECHERCHE_SUZERAIN_KRIEGSMATRIX.md §9.1 Zustand 5/6). */
export interface FriedensPaket {
  /** 1 = Pufferzone unter türkischer Kontrolle (Sieglage, kein Besitzerwechsel), −1 = Grenzzugeständnisse der Türkei (Niederlage), 0 = Status quo */
  gebiet: -1 | 0 | 1;
  /** 1 = Reparationen an die Türkei, −1 = Reparationen von der Türkei, 0 = keine */
  reparation: -1 | 0 | 1;
  /** Sicherheitsgarantien / Entmilitarisierung der Grenze */
  garantien: boolean;
  /** Gegenseitiger Truppenrückzug (weißer Frieden) */
  rueckzug: boolean;
  /**
   * Forderungen je Region (Welle 3, K1; Schritt 7 baut den Friedenstisch darauf): „halten“ bleibt unter türkischer Kontrolle, „rueckgabe“
   * geht zurück. Fehlt das Feld, gilt die alte Regel: Bei `gebiet` = 1 hält die Türkei, was die Front hält.
   */
  forderungen?: Record<string, RegionForderung>;
  /** Welle 3, K4 (krieg.md Schritt 7): das Paket vom Friedenstisch mit Forderungen je Region (sim/friedenstisch.ts). Fehlt es, gilt das feste Bündel. */
  tisch?: FriedensTisch;
}

export type RegionForderung = "halten" | "rueckgabe";

/**
 * Welle 3, K4: Was der Friedenstisch je Region verlangt. „zone“ Sicherheitszone unter türkischer Kontrolle (Sotschi 22.10.2019, Pkt. 3),
 * „satellit“ Sonderstatus unter türkischem Schutz (Moskauer Abkommen über Transnistrien, 21.07.1992), „annexion“ Abtretung per Vertrag
 * (Hatay, Vertrag vom 23.06.1939), „zivil“ Zivilverwaltung über die Grenzprovinzen (Gouverneure von Hatay, Kilis, Gaziantep, Şanlıurfa;
 * HRW 29.02.2024), „rueckgabe“ Übergabe an den Gegner mit Frist (Bergkarabach-Erklärung vom 09./10.11.2020). Die vier ersten sind die
 * Formen von K5 (`BesatzungsGebiet.form`); der Tisch übergibt sie als `formen` an besatzungNachFrieden.
 */
export type TischForm = "zone" | "zivil" | "satellit" | "annexion" | "rueckgabe";

/** Der Entwurf am Friedenstisch (Welle 3, K4): je gehaltener oder umkämpfter Region eine Form, dazu die Auflagen des Vertrags. */
export interface FriedensTisch {
  regionen: Record<string, TischForm>;
  /** Der Gegner zieht seine Kräfte so viele Kilometer hinter die Linie zurück (Sotschi Pkt. 5: 30 km binnen 150 Stunden) */
  rueckzugKm: 0 | 10 | 30;
  /** Gemeinsame Patrouillen mit dem Vermittler (Sotschi Pkt. 5: 10 km tief) */
  patrouillen: boolean;
  /** Rückkehr von Geflüchteten in die Zone (Sotschi Pkt. 8; Bergkarabach Pkt. 7 unter Aufsicht des UNHCR) */
  rueckkehr: boolean;
  /** Reparationen an die Türkei */
  reparation: boolean;
  /** Sicherheitsgarantien und Entmilitarisierung der Grenze (Adana-Abkommen, in Sotschi Pkt. 4 bekräftigt) */
  garantien: boolean;
  /** Wer das Paket geschnürt hat: der Präsident, der Gegner (Gegenangebot) oder ein Vermittler */
  von?: "eigen" | "gegner" | "USA" | "RUS";
}

/** Ziele eines Fernkonflikts ohne gemeinsame Grenze (sim/fernkonflikt.ts): kein Gebiet, sondern ein Ergebnis am Verhandlungstisch. */
export type FernZiel = "abschreckung" | "zugestaendnisse" | "waffenstillstand";

export interface KriegVorgang {
  id: string;
  /** Länder-Kennung aus sim/laender.ts */
  land: string;
  phase: KriegPhase;
  /** Tag des Eintritts in die aktuelle Phase */
  seit: number;
  /** Treiber der Eskalation (0–100), folgt träge der Konflikt-Dimension des Landes */
  eskalation: number;
  mobilmachung: Mobilmachung;
  /** Stärkefaktor der Mobilmachung im Augenblick der letzten Anordnung und Tag der Anordnung: Die neue Stufe wächst über
   * KRIEG.mobilTage zur vollen Stärke an. Ältere Spielstände haben die Felder nicht; dann gilt die Stufe sofort voll. */
  mobilVon?: number;
  mobilSeit?: number;
  /**
   * Tag des letzten Anlasses, der die Spannung nährt: Entstehung, Zwischenfall, Sprung im Konfliktwert (Druck, Machtwechsel zum
   * härteren Kurs, Ereignisse), Bereitschaft, Kriegsziel, Mobilmachung, gescheitertes Ultimatum, offene Drohung des Gegners.
   * Ohne neuen Anlass klingt die Eskalation nach KRIEG.naehrFrist ab (sim/krieg.ts, eskalationsZiel). Ältere Spielstände haben das
   * Feld nicht; dann gilt beim ersten Tagesschritt der Beginn der Phase.
   */
  genaehrt?: number;
  /** Konfliktwert des Landes am Vortag, um Sprünge (neue Anlässe) zu erkennen */
  konfliktStand?: number;
  /** Der Gegner selbst hat offen gedroht (Länder-Eigeninitiative „Drohkulisse“): Die Mindestdauer der Spannung entfällt */
  gegnerDroht?: boolean;
  /** „Truppen in Bereitschaft“ wurde angeordnet (kleiner, einmaliger Schub) */
  bereit?: boolean;
  rahmung?: KriegsRahmung;
  kriegszielDeklariert?: boolean;
  /** Gewählter Zielraum (data/streitkraefte.ts ZIELRAEUME); Vorstufe der Regionen mit Besitzerwechsel */
  zielraum?: string;
  /**
   * Welle 3, K6: eigene Auswahl der Zielregionen (auf der Karte gesetzt, sim/zielwahl.ts), in der Reihenfolge der Front. Fehlt das Feld,
   * gelten die Regionen des Zielraums. `zielraum` nennt dann den kleinsten festen Zielraum, der die Auswahl enthält (Gegenwehr, Bedeutung).
   */
  zielRegionen?: string[];
  beschluss?: KriegBeschluss;
  /** Abstrakte Frontlage 0–100: 100 = die Türkei siegt, 0 = Zusammenbruch (kein Taktikspiel) */
  front: number;
  /** Stand der Vorwoche, für die Trendanzeige */
  frontVorher: number;
  /** Erschöpfungsuhr der eigenen Heimatfront (Start 100; Vic3-War-Support) */
  uhr: number;
  /** Erschöpfungsuhr des Gegners */
  uhrGegner: number;
  /** Verstrichene Kriegswochen */
  woche: number;
  /** Kumulierte Verluste (0–100, treibt die Uhr und die Wähler) */
  verluste: number;
  /** Einmaliger Front-Schub aus der Handlung „Verstärkung“, wird in der nächsten Woche verrechnet */
  frontSchub?: number;
  /** Letzter Tag der Verstärkung (Abkühlung) */
  verstaerkungZuletzt?: number;
  /** Letzter Tag eines Abschreckungs-Signals (Abkühlung) */
  signalZuletzt?: number;
  /** Der Gegner hat Waffenruhe angeboten (liegt als Ereignis auf dem Tisch) */
  gegnerAngebot?: boolean;
  /** „Verteidigung“ erklärt, bevor ein Angriff unmittelbar bevorstand: zählt wie „Schutz“ (UN-Charta Art. 51 verlangt einen Angriff) */
  rahmungDuenn?: boolean;
  /** Ein Ultimatum wurde gestellt (je Vorgang nur eines) */
  ultimatum?: boolean;
  /** Friedenspaket, das der Gegner in der Waffenruhe selbst angeboten hat (er nimmt es sicher an) */
  angebotPaket?: string;
  /** Waffenruhe-Wochen ohne nennenswerte Bewegung (für Angebote und Stagnationsfolgen) */
  stagnation?: number;
  /** Demobilisierung läuft bis zu diesem Tag (Vic3: 90 Tage Auslauf mit vollen Kosten) */
  demobBis?: number;
  /** Bis zu diesem Tag ist eine erneute Mobilisierung gesperrt */
  demobSperreBis?: number;
  /** Welle 4, K7: Reservisten unter Waffen, als die Demobilisierung begann (sie kehren über KRIEG.demobTage in die Betriebe zurück) */
  demobVon?: number;
  /** Welle 4, K7: Fraktionen, denen der Präsident für das Mandat dieses Einsatzes eine Zusage gab (sim/mandat.ts) */
  mandatZusagen?: string[];
  /** Welle 4, K7: Kritik am Einsatz wird bis zu diesem Tag unterdrückt (Festnahmen, Ermittlungen; Vorbild Oktober 2019) */
  kritikBis?: number;
  /** Innenpreis des Friedens, schon verrechnet (für Chronik und Bilanz) */
  friedenspreis?: number;
  ausgang?: KriegsAusgang;
  /** Putsch-Risiko-Ereignis wurde nach einer Niederlage bereits ausgelöst */
  putsch?: boolean;
  /** Koalitionen beider Seiten (sim/pakte.ts); ältere Spielstände haben das Feld nicht, es entsteht beim ersten Zugriff */
  koalition?: KriegKoalition;
  /** Der Vorgang entstand aus einem Beistandsruf eines Pakt-Partners (Pakt und Partner, für Anzeige und Beleg der Rahmung „beistand“) */
  beistandFuer?: { partner: string; pakt: string };
  /**
   * Schauplatz (sim/kriegsschauplatz.ts, data/schauplaetze.ts): Einsatzart und Tempo als die zwei Entscheidungen der Kriegsführung,
   * Lage jeder Region, Bestand des Gegners und die Verluste der letzten Woche. Ältere Spielstände haben die Felder nicht: Dann gilt
   * „gemischt“ und „normal“ (alle Faktoren 1), der Gegnerbestand entsteht beim ersten Zugriff mit Stand 2026.
   */
  einsatz?: EinsatzWahl;
  /** Tag der letzten Umstellung der Einsatzart (Abkühlung) */
  einsatzSeit?: number;
  tempo?: KriegsTempoWahl;
  regionen?: Record<string, RegionLage>;
  gegnerBestand?: Record<GegnerGattungId, { menge: number; generation: number }>;
  /** Verluste der letzten Kriegswoche in Prozent des jeweiligen Bestands (Anzeige). Welle 3, K2: im Landkrieg mit Zielraum dazu die
   * Gefechtslast (Gefallene vor dem Faktor der gegnerischen Stärke, sim/kriegspreis.ts) und die Fläche des Vorstoßes in km² */
  letzteWoche?: { eigen: number; gegner: number; region?: string; last?: number; km2?: number };
  /** Türkische Grenzprovinzen (Plaka), auf die der Gegner gerade vorstößt */
  bedroht?: number[];
  /** Gefallene bisher (sim/kriegspreis.ts); ältere Spielstände haben das Feld nicht und zählen ab der nächsten Woche */
  gefallene?: number;
  /** Welle 3, K2: Sanktionsdrohung des Westens an den Märkten (sim/kriegspreis.ts): Tag, Sprung des Kurses (Anteil), ob er sich erholt hat */
  marktDrohung?: { tag: number; sprung: number; erholt?: boolean };
  /**
   * Sockel der Eskalation aus eigenen Schritten (Welle 3, K1; krieg.md Schritt 1): Krise, Drohkulisse, Kriegsziel, Bereitschaft,
   * Mobilmachung und ein abgelehntes Ultimatum heben ihn auf den Stand nach dem Schritt. Die Eskalation fällt nicht darunter. Ist das
   * Kriegsziel erklärt, hält er bis zur Entspannung (Beruhigen, Vermittlung), sonst klingt er nach der Nährfrist ab wie die Eskalation.
   * Ältere Spielstände haben das Feld nicht: Dann gilt kein Sockel.
   */
  sockel?: number;
  /** Tag, an dem das Kriegsziel erreicht war (alle Zielregionen genommen oder das Fernziel erfüllt); der Gegner ist ab da verhandlungsbereit */
  zielErreicht?: number;
  /** Der Gegner ist erschöpft und hat den Rückzug angetreten (Waffenruhe aus seiner Erschöpfung) */
  rueckzugGegner?: boolean;
  /** Tag des letzten Waffenruhe-Angebots des Gegners (Abstand zwischen zwei Angeboten) */
  angebotZuletzt?: number;
  /** Ziel eines Fernkonflikts (sim/fernkonflikt.ts); ohne Wahl gilt „abschreckung“ */
  fernZiel?: FernZiel;
  /**
   * Welle 3, K3 (krieg.md Schritt 6): die Operationsform (data/operationen.ts) und wer am Boden mitkämpft. Ältere Spielstände haben die
   * Felder nicht: Dann führt der Generalstab „gemischt“ wie bisher, ohne Faktoren der Form.
   */
  operation?: OperationsFormId;
  verbuendete?: VerbuendeteId;
  /** Tag und Kriegswoche der letzten Wahl der Operationsform (Abkühlung der Umstellung, Ende einer Schlagwelle) */
  operationSeit?: number;
  operationWoche?: number;
  /** Wendepunkte dieses Krieges (sim/ereignisse-wendepunkte.ts): Kennung → Kriegswoche, in der er kam. Keiner kommt zweimal. */
  wendepunkte?: Record<string, number>;
  /** Welle 3, K4: der Entwurf des Präsidenten am Friedenstisch (fehlt, solange er nichts verändert hat; dann gilt der Vorschlag der Lage) */
  tisch?: FriedensTisch;
  /** Welle 3, K4: Tag der letzten Ablehnung am Friedenstisch und das Gegenangebot des Gegners, das er dann vorlegt */
  tischAbgelehnt?: { tag: number; gegen: FriedensTisch };
}

export type EinsatzWahl = "luft" | "boden" | "see" | "stellvertreter" | "cyber";
export type KriegsTempoWahl = "vorsichtig" | "normal" | "hart";
export type GegnerGattungId = "heer" | "luft" | "luftabwehr" | "see" | "drohnen";
/** Lage einer Region im Krieg: beim Gegner, umkämpft (die Front steht dort) oder unter türkischer Kontrolle */
export type RegionLage = "gegner" | "umkaempft" | "eigen";

/**
 * Eine besetzte Region nach dem Frieden (sim/besatzung.ts): Form, Widerstand, Kosten. Welle 3, K5: vier Formen nach Vorbild
 * („zone“ Sicherheitszone, „zivil“ Zivilverwaltung, „satellit“ Satellitenstaat, „annexion“; data/besatzung.ts). Ältere Spielstände mit
 * „pufferzone“ und „verwaltung“ werden beim Laden umbenannt.
 */
export interface BesatzungsGebiet {
  region: string;
  land: string;
  seit: number;
  /** Welle 3, K5: zone, zivil, satellit, annexion (data/besatzung.ts); der Friedenstisch (K4) setzt sie über besatzungNachFrieden */
  form: import("../data/besatzung").BesatzungsForm;
  /** 0 bis 100 */
  widerstand: number;
  /** Monate in Folge über der Aufstandsschwelle */
  aufstand: number;
  /**
   * Rechtsgrund der Kontrolle (Welle 3, K1): „vertrag“ aus einem Friedenspaket, „linie“ als De-facto-Kontrolle an einer eingefrorenen
   * Waffenstillstandslinie ohne Vertrag (Vorbild Zypern 1974). Ältere Einträge haben das Feld nicht und gelten als „vertrag“.
   */
  grundlage?: "vertrag" | "linie";
  /**
   * Welle 3, K4: Auflagen des Friedensvertrags für diese Region (nur bei Einträgen vom Friedenstisch): Rückzug des Gegners in km, Patrouillen
   * mit dem Vermittler, Rückkehr von Geflüchteten, Abtretung mit Zustimmung (Hatay-Weg) und bei einer Rückgabe der Tag der Übergabe (bis dahin bleibt
   * die Region besetzt, sim/besatzung.ts uebergabenTag).
   */
  vertrag?: { tag: number; rueckzugKm: number; patrouillen?: "USA" | "RUS"; rueckkehr?: boolean; abtretung?: boolean; uebergabe?: number };
  /** Welle 3, K5: Tag des letzten Formwechsels (fehlt: seit der Besetzung) */
  formSeit?: number;
  /** Welle 3, K5: zurückgekehrte Geflüchtete in diese Region, Personen (fehlt: 0) */
  rueckkehr?: number;
  /** Welle 3, K5: Kfz-Kennziffer der Provinz, wenn die Region annektiert ist */
  plaka?: number;
}

/**
 * Eine neue türkische Provinz aus einer annektierten Region (Welle 3, K5; ENTSCHEIDUNGEN AA 1): nächste freie Kennziffer ab 82, Einwohner,
 * Steuern, Wahlberechtigte; Sitze erst nach der nächsten Parlamentswahl (sim/provinzen-neu.ts).
 */
export interface NeueProvinz {
  plaka: number;
  region: string;
  land: string;
  /** Tag des Beschlusses */
  seit: number;
  /** Einwohner beim Beschluss (Daten der Region, data/schauplaetze.ts) */
  einwohner: number;
  /** Anteil, der die Staatsangehörigkeit ablehnt (Vorbild Krim 2014: Frist von einem Monat; Spielparameter aus dem Widerstand) */
  ablehnung: number;
  /** Ende der Eingliederung (Tag) */
  eingliederungBis: number;
  /** Abtretung per Vertrag (Hatay-Weg) */
  vertrag?: true;
  /** Sitze in der TBMM; erst ab der nächsten Parlamentswahl gesetzt */
  sitze?: number;
  /** Tag, an dem die Provinz verloren ging (Rückeroberung, Rückgabe, Aufstand); bleibt für die Kennziffer stehen */
  verloren?: number;
}

/** Abstimmung in einem UN-Organ. */
export interface UnAbstimmung {
  tag: number;
  ja: number;
  nein: number;
  enth: number;
  abwesend?: number;
  /** Sicherheitsrat: ständige Mitglieder mit Veto */
  veto?: string[];
  angenommen: boolean;
}

/** Die internationale Reaktion auf eine Annexion oder einen Satellitenstaat (sim/annexion.ts). */
export interface AnnexionsVorgang {
  id: string;
  land: string;
  regionen: string[];
  art: "annexion" | "satellit";
  seit: number;
  /** Abtretung per Friedensvertrag (Hatay-Weg) */
  vertrag?: true;
  /** Die Türkei hatte den Krieg begonnen (erzwungener Vertrag nach Art. 52 WVK nichtig) */
  angriff?: true;
  sr?: UnAbstimmung;
  gv?: UnAbstimmung;
  /** Erreichte Sanktionsstufe (0 bis 4) und die Träger (EU, USA) mit ihrem Anteil */
  stufe: number;
  traeger?: Record<string, number>;
  /** Höchste Stufe dieses Vorgangs */
  stufeMax: number;
}

// Gebietsübertragung (Welle 2, noch nicht gebaut): Der Hebel liegt in sim/krieg.ts, Funktion `friedenSchliessen`: Dort steht heute
// `p.gebiet` (+1 Pufferzone unter türkischer Kontrolle, −1 Grenzzugeständnisse) und ändert nur Beziehungswerte und Stimmung;
// die Texte sagen das ehrlich (kein Besitzerwechsel, Katalog `wort.krieg.*`, Stand 05.10.2026). Sobald Regionen anderer Länder als Daten existieren,
// ersetzt das Paket das Feld `gebiet` durch eine Liste der Regionen (Kriegsziele, die der Vorgang vorher festlegt); `friedenSchliessen`
// überträgt dann den Besitzer jeder Region und startet die Integrationsphase. Diese Typen und `paketAnnahme` (Härte des Pakets)
// bleiben die Schnittstelle; die Koalitionspartner (`koalition`) verhandeln am Friedenstisch mit und dürfen eigene Regionen als Ziel haben.
