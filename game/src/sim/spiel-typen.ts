// Zustand der Spielschleife: Kapital, Gesetze, Ereignisse, Figuren, Umfragen, Ziele, Ende.
// Alles reines JSON, damit Speichern und Laden wie beim übrigen Weltzustand funktionieren.
// Alle Zahlen dieser Schicht sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

export type Weg = "gesetz" | "erlass";

/** Ein Vorhaben auf dem Weg durch das Parlament. */
export interface Gesetz {
  id: string;
  massnahme: string;
  name: string;
  stufe: number;
  /** Kfz-Kennziffern; null = ganzes Land */
  provinzen: number[] | null;
  eingebracht: number;
  abstimmung: number;
  /** Beim Einbringen gezahltes Politisches Kapital */
  pk: number;
  /** Gekaufte Stimmen (Absprachen mit Fraktionen) */
  absprachen: number;
  /** +1 erhöht, −1 senkt die Maßnahme; Fraktionen stimmen für das, was sie wollen */
  richtung?: number;
  /** Gesetzesvorhaben (data/gesetzesvorhaben.ts), aus dem der Entwurf stammt; ältere Spielstände und freie Entwürfe haben es nicht */
  vorhaben?: string;
  fassung?: import("../data/gesetzesvorhaben").FassungId;
  /** Ja-Stimmen, die die Fassung zusätzlich holt (Kompromiss) oder kostet (scharf) */
  stimmenBonus?: number;
}

export interface Figur {
  id: string;
  name: string;
  rolle: string;
  amt: "finanzen" | "inneres" | "aussen" | "zentralbank" | "opposition" | "partner" | "stab" | "justiz" | "generalstab" | "wirtschaft";
  /** Was die Figur will; bestimmt, wie sie auf Entscheidungen reagiert */
  ziel: string;
  /** 0 bis 100 */
  loyalitaet: number;
  imAmt: boolean;
  partei?: string;
  /** Geschlecht der Figur für Name und Porträt */
  weiblich?: boolean;
  /** Letzter Tag eines Gesprächs mit dem Präsidenten (Abkühlzeit) */
  gespraech?: number;
  /** Profil, Aufträge und Erinnerung; ältere Spielstände legen es beim ersten Zugriff an (sim/personen.ts) */
  eigen?: import("./personen-typen").FigurEigen;
}

export interface Zusage {
  id: string;
  von: string;
  text: string;
  faellig: number;
  /** Fordert eine Maßnahme in eine Richtung */
  massnahme?: string;
  richtung?: number;
  erfuellt: boolean;
  gebrochen: boolean;
  /** Wie oft die Zusage schon vertröstet wurde; nach zweimal ist Schluss */
  vertroestet?: number;
  /** Stufe der geforderten Maßnahme, als die Zusage gegeben wurde (für den Fortschritt) */
  stufeStart?: number;
  /** Zielstufe der Maßnahme, festgehalten, damit der Fortschritt eine feste Messlatte hat */
  stufeZiel?: number;
  /** Tag, an dem sie erfüllt oder gebrochen wurde */
  abgeschlossen?: number;
}

/** Ein Ereignis, das auf eine Entscheidung wartet. */
export interface OffenesEreignis {
  id: string;
  vorlage: string;
  tag: number;
  /** An diesem Tag greift die Standardfolge, wenn nichts entschieden wurde */
  frist: number;
  provinzen: number[];
  /** 0 bis 1 */
  staerke: number;
  daten?: Record<string, number | string>;
}

export interface ChronikEintrag {
  tag: number;
  datum: string;
  titel: string;
  ausgang: string;
}

export interface Umfrage {
  /** Zustimmung zum Präsidenten, 0 bis 100 */
  zustimmung: number;
  verlauf: { monat: string; wert: number }[];
}

/** Wie eine Laufbahn endet (sim/enden.ts, sim/wahl.ts, sim/spiel.ts). */
export type EndeArt = "abwahl" | "sturz" | "amtszeitende" | "ruecktritt" | "putsch" | "amtsenthebung" | "tod";

export interface Ende {
  tag: number;
  datum: string;
  art: EndeArt;
  titel: string;
  text: string;
  anteil?: number;
  /** Nur in der letzten Amtszeit: Ob der Nachfolger des Lagers die Wahl gewann (sim/wahl.ts) */
  nachfolge?: "sieg" | "niederlage";
}

/** Eine aktive Krise (Krisen-Blocker, MIL-3): Der Zustand selbst wird aus der Welt abgeleitet, gespeichert ist nur, was gerade aktiv ist und seit wann (Hysterese). Die Regeln stehen in sim/krisen.ts. */
export interface AktiveKrise {
  id: string;
  /** Tag (seit Spielbeginn), an dem die Krise aktiv wurde */
  seit: number;
}

/** Meldung an die Oberfläche (Wahlabend, Warnung, Ende); die Oberfläche quittiert sie. */
export interface Hinweis {
  id: string;
  titel: string;
  text: string[];
  szene: "istanbul" | "parlament" | "bank" | "anatolien" | "wahlnacht";
}

/** Phase eines laufenden Verfassungsvorgangs (sim/verfassung.ts). */
export type VerfassungsPhase = "parlament" | "aym" | "kampagne";

// ---------------------------------------------------------------------------
// Der Wahlkampf (INN-5): Handlungsphase ab acht Wochen vor der Präsidentschaftswahl.
// Die Regeln und Spielparameter stehen in sim/wahlkampf.ts.

/** Eine Kampagnenreise in eine Provinz (Ortsbezug über die Provinz-Daten). */
export interface WahlkampfReise {
  /** Kfz-Kennziffer der Provinz */
  plaka: number;
  tag: number;
  /** Gebuchte Wirkung auf das lokale Vertrauen (nach Abnutzung, vor Ort in Punkten) */
  effekt: number;
  /** Ob der Besuch missglückte (brennende Probleme vor Ort = Risiko) */
  missglueckt: boolean;
}

/** Eine Auslandstour zur Diaspora (nur bei nationalen Wahlen wirksam). */
export interface AuslandsTour {
  land: "deutschland" | "belgien" | "frankreich" | "niederlande";
  tag: number;
  /** Mobilisierung des Diaspora-Blocks: Prozentpunkte auf Beteiligung und Lager-Anteil */
  beteiligungPlus: number;
  lagerPlus: number;
  /** Einreise-/Auftrittsverbot des Gastlands (2017-Muster: Belagerungs-Narrativ) */
  verbot: boolean;
}

/** Das TV-Duell mit dem Oppositions-Kandidaten. */
export interface DuellZustand {
  /** Ob die Vorbereitung bezahlt wurde (2 Aktionspunkte) */
  vorbereitet: number;
  /** Tag des Duells, sobald es ausgetragen ist */
  tag?: number;
  /** Ausgang in Prozentpunkten auf die Wechselwähler (±) */
  effekt?: number;
  /** Regelbasiert erzeugte Szenen-Zeile für Fenster und Chronik */
  szene?: string;
}

/** Eine Messung im wöchentlichen Umfrage-Ticker des Wahlkampfs. */
export interface TickerMessung {
  tag: number;
  institutId: string;
  institut: string;
  wert: number;
  /** Haus-Bias des Instituts in Prozentpunkten (für die Anzeige: das Haus misst systematisch daneben) */
  hausBias: number;
}

/** Ein Angriff der Gegenseite, der bei einer echten Schwachstelle traf. */
export interface GegnerAngriff {
  tag: number;
  /** Name der angegriffenen Schwachstelle (akutes Problem) */
  thema: string;
  /** Stärke des Treffers in Prozentpunkten (positiv gebucht, wirkt negativ) */
  staerke: number;
}

export interface WahlkampfZustand {
  /** Nummer der Amtszeit, zu der dieser Wahlkampf gehört */
  amtszeit: number;
  /** Aktionspunkte der laufenden Kampagnenwoche */
  ap: number;
  /** Tag des Phasenbeginns */
  beginn: number;
  /** Tag des letzten Wochenwechsels (AP-Reset, Gegner-Angriff, Umfrage-Ticker) */
  woche: number;
  /** Besuche je Provinz (Kfz-Kennziffer als Schlüssel) — abnehmender Ertrag bei Wiederholung */
  besuche: Record<string, number>;
  reisen: WahlkampfReise[];
  touren: AuslandsTour[];
  /** Kennungen der gegebenen Wahlversprechen (Katalog in sim/wahlkampf.ts) */
  versprechen: string[];
  duell: DuellZustand;
  /** Summe der Gegner-Angriffe in Prozentpunkten (negativ, gedeckelt) */
  angriffe: number;
  angriffeLog: GegnerAngriff[];
  /** Wöchentliche Umfrage-Messungen mit Instituts-Bias */
  ticker: TickerMessung[];
  /** Wer kämpft: der Präsident für sich („amt“) oder für den Nachfolger des Lagers in der letzten Amtszeit (fehlt in alten Ständen: „amt“) */
  rolle?: "amt" | "nachfolger";
  /** Auftritte für den Nachfolger (gemeinsam mit dem Präsidenten, allein) und ihre Summe in Prozentpunkten */
  nachfolgerAuftritte?: { gemeinsam: number; allein: number; punkte: number };
}

/** Ein Verfassungspaket auf seinem Weg: Parlament, Verfassungsgericht, gegebenenfalls Volksabstimmung. */
export interface VerfassungsVorgang {
  id: string;
  /** Artikel-Kennung → Varianten-Kennung (sim/verfassung.ts, ARTIKEL) */
  paket: Record<string, string>;
  phase: VerfassungsPhase;
  eingebracht: number;
  /** Tag der Parlamentsabstimmung */
  abstimmung: number;
  /** Gekaufte Stimmen (Absprachen, teurer als bei Gesetzen) */
  absprachen: number;
  /** Beim Einbringen gezahltes Politisches Kapital */
  pk: number;
  /** Ergebnis der Parlamentsabstimmung (Ja-Stimmen), nach der Abstimmung */
  ja?: number;
  /** Ob die Opposition das Paket vor das Verfassungsgericht gezogen hat */
  aymAngefochten?: boolean;
  /** Tag der Entscheidung des Verfassungsgerichts */
  aymTag?: number;
  /** Tag der Volksabstimmung (nur bei 301 bis 359 Ja-Stimmen) */
  referendumTag?: number;
  /** In die Kampagne investiertes Kapital */
  kampagnenPk?: number;
  /** Letzter Tag eines Kampagnen-Impulses (Abkühlzeit) */
  kampagneZuletzt?: number;
  /** Für welche Phase das Entscheidungs-Ereignis schon geöffnet wurde */
  phaseGeoeffnet?: string;
}

/** Stand der Verfassungsfrage in dieser Partie; ältere Spielstände legen ihn beim ersten Zugriff an. */
export interface VerfassungsZustand {
  laufend?: VerfassungsVorgang;
  /** Nummer der Amtszeit, in der bereits ein Vorgang lief (harte Regel: einer je Amtszeit) */
  amtszeitBelegt: number;
  /** Artikel-Kennung → Tag, ab dem der Artikel wieder eingebracht werden kann (12 Monate nach einem Scheitern) */
  sperren: Record<string, number>;
  /** Beschlossene Verfassungsänderungen: Artikel-Kennung → Varianten-Kennung (nur Abweichungen vom bisherigen Recht) */
  aktiv: Record<string, string>;
  /** Abgeschlossene Vorgänge für Chronik und Anzeige */
  historie: { tag: number; datum: string; ausgang: string; artikel: string[] }[];
}

/** Katastrophen (INF-5): Art der Lage, mit der ein Fall ins Spiel kommt. */
export type KatastrophenArt = "erdbeben" | "flut" | "waldbrand" | "duerre";

/** Stufe der Schadensaufklärung (Nebel der ersten Tage): unsicher → vermutet → bekannt. */
export type NebelStufe = "unsicher" | "vermutet" | "bekannt";

/** Ein eingetretener Katastrophenfall mit Schadenslage, Hilfskette, Zusage und Wiederaufbau. */
export interface KatastropheFall {
  id: string;
  art: KatastrophenArt;
  /** Kfz-Kennziffern der betroffenen Provinzen */
  provinzen: number[];
  tag: number;
  datum: string;
  /** 0 bis 1 */
  staerke: number;
  /** Schadenslage (Spielparameter, respektvoll skaliert — Anker: 53.537 Tote beim Doppelbeben 2023) */
  tote: number;
  verletzte: number;
  obdachlos: number;
  /** Zerstörte oder unbewohnbare Wohnungen */
  wohnungen: number;
  /** Katastrophenschutz-Stand beim Eintreten (0 bis 100) */
  bereitschaft: number;
  /** Was die vorhandene Bereitschaft nach Modellrechnung verhindert hat (gegenüber Bereitschaft 20) */
  verhindert: { tote: number; wohnungen: number };
  /** Hilfskette: Soforthilfe geleistet, Übergangsversorgung läuft bis zu diesem Tag */
  hilfe: { soforthilfe: boolean; uebergangBis?: number };
  /** Öffentliche Wohnungs-Zusage (Versprechensschuld): versprochene und gelieferte Wohnungen */
  zusage?: { wohnungen: number; geliefert: number };
  /** Privat erholter Bestand (Wohnungen, ohne Staatsprogramm) */
  privatGeliefert: number;
  /** Angemeldetes Wohnungsbau-Programm (dynamisches Reich-Vorhaben) */
  wohnbau?: { id: string; bedarf: number; bau: number; monate: number; schulden: number; vergabe: string };
  /** Tag, an dem die Lage als bewältigt gilt */
  bewaeltigt?: number;
}

/** Stand des Katastrophen-Moduls; ältere Spielstände legen ihn beim ersten Zugriff an. */
export interface KatastrophenZustand {
  faelle: KatastropheFall[];
}

// ---------------------------------------------------------------------------
// Wahlen und Amtszeiten (sim/wahl.ts, sim/amtszeit.ts). Texte, die ein Sprachwechsel treffen soll, liegen als Msg (Schlüssel + Werte) im Spielstand.

type WahlMsg = import("../i18n/typen").Msg;

export type WahlKandidatId = "amt" | "gegner" | "dritte";

/** Ein Kandidat der Präsidentschaftswahl. In der letzten Amtszeit tritt für das Lager der Nachfolger an. */
export interface WahlKandidat {
  id: WahlKandidatId;
  name: string;
  /** Parteikürzel */
  partei: string;
  parteiName: string;
  nachfolger?: boolean;
}

/** Ein Wahlgang der Präsidentschaftswahl. */
export interface WahlRunde {
  nr: 1 | 2;
  tag: number;
  datum: string;
  /** Stimmenanteile je Kandidat in Prozent der gültigen Stimmen; der Rest sind kleinere Bewerber */
  anteile: Partial<Record<WahlKandidatId, number>>;
  /** Beteiligung in Prozent der Wahlberechtigten */
  beteiligung: number;
}

/** Die Parlamentswahl am selben Tag (Artikel 77 der Verfassung): Stimmen, Hürde und Sitze vorher und nachher. */
export interface WahlParlament {
  anteile: Record<string, number>;
  sitzeVorher: Record<string, number>;
  sitzeNachher: Record<string, number>;
  huerde: number;
  unterHuerde: string[];
  lagerVorher: string[];
  lagerNachher: string[];
  lagerSitzeVorher: number;
  lagerSitzeNachher: number;
}

export interface WahlReaktion {
  wer: "opposition" | "ausland" | "maerkte" | "partei" | "wahlrat";
  text: WahlMsg;
  /** Für den Präsidenten: −1 schlecht, 0 neutral, +1 gut */
  wertung: -1 | 0 | 1;
}

export type WahlRede = "einend" | "triumph" | "bescheiden";

/** Eine abgeschlossene Wahl mit allem, was die Wahlabend-Ansicht und die Chronik zeigen. */
export interface WahlErgebnis {
  id: string;
  /** Wievielte Wahl der Partie (1 = die erste nach dem Start) */
  nummer: number;
  /** Amtszeit, in der gewählt wurde */
  amtszeit: number;
  tag: number;
  datum: string;
  kandidaten: WahlKandidat[];
  runden: WahlRunde[];
  sieger: WahlKandidatId;
  /** Ob der Präsident (bzw. in der letzten Amtszeit sein Nachfolger) gewonnen hat */
  gewonnen: boolean;
  /** Abstand des Siegers zum Zweiten im letzten Wahlgang in Prozentpunkten */
  marge: number;
  /** Anteil des Amtsinhabers (bzw. des Lagers) und des Gegners je Provinz (Kfz-Kennziffer) im letzten Wahlgang */
  provinzen: Record<string, { amt: number; gegner: number }>;
  parlament: WahlParlament;
  reaktionen: WahlReaktion[];
  rede?: WahlRede;
  /** Einflüsse des Wahlkampfs und der Lage auf das Ergebnis des Amtsinhabers, in Prozentpunkten */
  einfluesse?: { name: string; punkte: number }[];
  /** Ob die Opposition ein knappes Ergebnis anficht; der Hohe Wahlrat entscheidet endgültig (kein Rechtsmittel, AY 79) */
  anfechtung?: "keine" | "laufend" | "abgewiesen";
  /** Die Wahl der letzten Amtszeit: Der Präsident tritt nicht mehr an */
  letzteWahl: boolean;
  /**
   * Nachgetragene Parlamentswahl (ältere Spielstände, in denen die Wahl ohne neue Sitzverteilung lief, sim/wahl.ts: parlamentNachtragAntwort):
   * Die Präsidentschaftswahl ist längst entschieden, die Wahlabend-Ansicht zeigt nur die Parlamentswahl (Stimmenanteile, Karte, Sitze, Reaktionen).
   */
  nachgetragen?: boolean;
}

/** Zwischen den Wahlgängen: Die Stichwahl steht an (14 Tage nach dem ersten Wahlgang). */
export interface StichwahlVorgang {
  tag: number;
  runde1: WahlRunde;
  kandidaten: WahlKandidat[];
  /** Wer in die Stichwahl einzieht (nur der Amtsinhaber oder das Lager gegen den Gegner) */
  basis: { amt: number; gegner: number; dritte: number };
  /** Anteil der Wähler des Dritten, die zum Amtsinhaber wechseln (Spielparameter, bis zur Entscheidung vorläufig) */
  uebertrag: number;
  /** Zusätzliche Mobilisierung der eigenen Anhänger in Prozentpunkten */
  mobilisierung: number;
  entscheidung?: "werben" | "mobilisieren" | "abwarten";
  /** Die Parlamentswahl ist am ersten Wahltag schon entschieden */
  parlament: WahlParlament;
  einfluesse: { name: string; punkte: number }[];
  provinzen1: Record<string, { amt: number; gegner: number }>;
  /** Hochburgen-Muster des Lagers je Provinz (Abweichung vom Landesschnitt in Prozentpunkten), aus der Parlamentswahl; für die Stichwahl-Provinzen */
  muster?: number[];
  reaktionen: WahlReaktion[];
}

/** Die einmalige Frage nach einer nachträglichen Parlamentswahl in einem älteren Spielstand (Merker: Sie wird nie ein zweites Mal gestellt). */
export interface NachtragZustand {
  /** „frage“: Das Fenster wartet auf die Antwort; „nein“: Das Parlament bleibt, die Frage kommt nie wieder; „ja“: Die Wahl ist nachgetragen */
  status: "frage" | "nein" | "ja";
  /** Wahltag (Spieltag) und Datum der Wahl, um die es geht */
  tag: number;
  datum: string;
  /** Spieltag, an dem die Frage gestellt wurde */
  seit: number;
  /** Kennung des nachgetragenen Ergebnisses in der Historie (nur bei „ja“) */
  ergebnis?: string;
}

export interface WahlZustand {
  historie: WahlErgebnis[];
  /** Nachträgliche Parlamentswahl für ältere Stände (fehlt in neuen und beantworteten Partien nicht, sondern entsteht beim ersten Fall) */
  nachtrag?: NachtragZustand;
  stichwahl?: StichwahlVorgang;
  /** Kennung des Ergebnisses, das die Oberfläche als Wahlabend zeigen soll, bis der Spieler es quittiert */
  abend?: string;
}

/** Ein Amtszeitbeginn: Der Müdigkeitszähler, die Zwischenbilanz und die Ziele der Amtszeit hängen daran. */
export interface AmtszeitStart {
  nr: number;
  tag: number;
  datum: string;
  zustimmung: number;
  start: SpielZustand["start"];
}

/** Das Umbildungsfenster nach der Wiederwahl: Jedes Regierungsmitglied wird bestätigt, versetzt oder ersetzt. */
export interface UmbildungZustand {
  seit: number;
  /** Bis zu diesem Tag gelten die gesenkten Kosten */
  bis: number;
  anlass: "wiederwahl" | "nachgereicht";
  /** Amt → was entschieden wurde */
  entschieden: Record<string, "behalten" | "ersetzt" | "versetzt" | "entlassen">;
  /** Ministerien, die an Partnerparteien im Lager vergeben wurden (Parteikürzel → Anzahl) */
  partnerVergeben?: Record<string, number>;
  abgeschlossen?: boolean;
}

/** Ein Anwärter auf die Nachfolge in der letzten Amtszeit (Kronprinzen-Tableau). */
export interface Aspirant {
  amt: Figur["amt"];
  name: string;
  weiblich?: boolean;
  /** Strahlkraft als Kandidat, 0 bis 100 (Fähigkeit, Rückhalt, Auftritt) */
  staerke: number;
  ehrgeiz: number;
  rolle: string;
}

/** Warnstufen und Verfahren, die eine Laufbahn vorzeitig beenden können (sim/enden.ts). Alle Felder entstehen beim ersten Zugriff. */
export interface EndenZustand {
  putsch: { risiko: number; stufe: 0 | 1 | 2 | 3; warnTag?: number; versuche: number; letzterVersuch?: number; geschuetztBis?: number };
  amtsenthebung: { stufe: 0 | 1 | 2 | 3; seit?: number; gegenSitze: number; schutzBis?: number; verfahrenTag?: number };
  gesundheit: { zustand: "gesund" | "krank" | "verschwiegen"; seit?: number };
  ruecktritt: { gefordertTag?: number };
  /** Alter der Spielfigur beim Amtsantritt (aus dem Seed; fehlt in älteren Ständen und wird beim ersten Zugriff abgeleitet) */
  startAlter?: number;
  /** Wie viele Altersstufen (65, 70, 75, 80) schon gemeldet sind */
  alterStufe?: number;
}

export interface NachfolgeZustand {
  aspiranten: Aspirant[];
  /** Amt des gekürten Nachfolgers oder „offen“ (die Partei entscheidet) */
  gekuert?: Figur["amt"] | "offen";
  nachfolger?: Aspirant;
  /** Ein übergangener Anwärter tritt gegen das Lager an */
  abtruenniger?: Aspirant;
  tag?: number;
}

/** Eingefrorenes Ergebnis der Ziele einer früheren Amtszeit. */
export interface ZielArchiv {
  amtszeit: number;
  ziele: { titel: string; erreicht: boolean; stand: string }[];
}

/** Verhältnis zu einer Fraktion des Parlaments. */
export interface Fraktion {
  /** Wie offen sie für den Präsidenten ist, 0 bis 100 */
  bereitschaft: number;
  /** Bis zu diesem Tag stimmt sie bei Gesetzen mit, ohne im Lager zu sein */
  duldungBis?: number;
  /** Letzter Tag eines Gesprächs bzw. Zugeständnisses (Abkühlzeit) */
  gespraech?: number;
  zugestaendnis?: number;
  /** Woran die Fraktion ihre Unterstützung gerade knüpft; wechselt mit der Zeit und der Lage */
  forderung?: { massnahme: string; text: string; seit: number };
}

export interface SpielZustand {
  /** Politisches Kapital: knapp, wächst mit Vertrauen und Mehrheit */
  kapital: number;
  gesetze: Gesetz[];
  ereignisse: OffenesEreignis[];
  /** Letzter Tag je Ereignisvorlage (Abkühlzeit gegen Wiederholung) */
  zuletzt: Record<string, number>;
  /** ZEI-1: Eskalationsstufe gärender Vorgänge je Ereignisvorlage — nicht präsentiert, sie kommen dringlicher zurück; ältere Spielstände legen es beim ersten Bedarf an */
  eskalation?: Record<string, number>;
  figuren: Figur[];
  zusagen: Zusage[];
  /** Politische Vorgänge vom Versprechen bis zur Rechenschaft (sim/vorgaenge.ts); ältere Spielstände legen sie beim ersten Monat an */
  vorgaenge?: import("./vorgaenge").Vorgang[];
  umfrage: Umfrage;
  /** Kennungen der gewählten Ziele */
  ziele: string[];
  /** Ob der erste Spieltag (Zielwahl und drei Vorgänge) abgeschlossen ist */
  ersterTagErledigt: boolean;
  /** Tag der nächsten Präsidentschaftswahl */
  wahltag: number;
  /** 1 oder 2: Wiederwahl ist einmal möglich */
  amtszeit: number;
  /** Partner im Regierungslager außer der eigenen Partei (Parteikürzel) */
  lager: string[];
  /** Verhältnis zu den Fraktionen (Parteikürzel); ältere Spielstände haben es noch nicht */
  fraktionen?: Record<string, Fraktion>;
  /** Tage der letzten Gespräche mit Personen des Umfelds (begrenzte Termine) */
  termine?: number[];
  /** Minister-Vorlagen, Befehle und Rückmeldungen (sim/ministerfluss.ts); ältere Spielstände legen den Zustand beim ersten Zugriff an */
  ministerfluss?: import("./ministerfluss-typen").MinisterFlussZustand;
  /** Wer im Streit aus dem Umfeld gegangen ist (und was er mitnimmt) */
  ehemalige?: import("./personen-typen").Ehemalige[];
  /** Das Verhältnis zu den übrigen Ländern */
  welt?: Record<string, import("./laender").LandZustand>;
  /** Das Weltmodell: Eigenzustand der Staaten, Beziehungen untereinander und Institutionen (sim/welt-modell.ts); ältere Spielstände legen es beim ersten Zugriff an */
  weltmodell?: import("./welt-modell").WeltModell;
  /** Beschlüsse, deren Wirkung beobachtet wird, und die daraus entstandenen Berichte */
  beobachtungen?: import("./berichte").Beobachtung[];
  berichte?: import("./berichte").Bericht[];
  /** Takt (sim/ereignisse.ts): Im Monatswettbewerb gewonnene Vorgänge, die erst an einem gewürfelten Tag öffnen */
  geplant?: { vorlage: string; tag: number; provinzen: number[]; staerke: number; daten?: Record<string, number | string>; verschoben?: number }[];
  /** Folgehaken aus Antworten (Vorlage.folgen): Ereignisse, die nach Wochen oder Monaten zurückkommen */
  folgen?: { vorlage: string; tag: number; aus: string; antwort: string }[];
  /** Rückblicke auf Entscheidungen, die kein Gesetz sind: Ereignisantworten, Programmschritte, Verträge (sim/berichte.ts) */
  rueckblicke?: import("./berichte").Rueckblick[];
  /** Gegenkräfte (sim/takt.ts): Zähler, damit Hinweise nicht jeden Monat wiederkehren */
  gegenkraft?: { neuwahlTag?: number; hortHinweis?: number; schwachMonate?: number; rueckblickBasis?: true; zusageTag?: number };
  /** Regierungsprogramme: fertige und laufende Schritte */
  programm?: import("./programme").ProgrammZustand;
  /** Verlauf der Wählerstimmung je Gruppe, Monat für Monat; ältere Spielstände füllen ihn beim ersten Aufruf aus dem Netzgedächtnis */
  waehler?: import("./waehler-verlauf").WaehlerVerlauf;
  /** Das Reich: Bestand, Vorhaben und Vorteile der Fachbereiche; ältere Spielstände legen es beim ersten Zugriff an */
  reich?: import("./reich-typen").ReichZustand;
  /** Letzter Tag je Vermittlung zwischen zwei Ländern (Verhandlungstisch) */
  vermittelt?: Record<string, number>;
  /** AUS-4: Vermittlung zwischen Drittstaaten — Reifegrad, Konflikt-Index und Garantien je Konfliktpaar (sim/vermittlung.ts); ältere Spielstände legen ihn beim ersten Zugriff an */
  vermittlung?: Record<string, import("./vermittlung-typen").KonfliktZustand>;
  /** Die Wirtschaftsakte: Zentralbank, Haushalt, Kennzahlen-Verlauf; ältere Spielstände legen sie beim ersten Zugriff an */
  wirtschaft?: import("./wirtschaft-typen").WirtschaftZustand;
  /** Dauerhafte Vorteile aus Programmen: „rabatt:<Thema>“ (Anteil), „schutz:<Ereignis>“ (Faktor) */
  modifikatoren?: Record<string, number>;
  /** Schwierigkeit dieser Partie; ältere Spielstände spielen auf „normal“ */
  schwierigkeit?: "entspannt" | "normal" | "hart";
  /** Aufmerksamkeit und Belastung des Präsidenten; ältere Spielstände laden mit den Startwerten (sim/aufmerksamkeit.ts) */
  verfassung?: import("./aufmerksamkeit").Verfassung;
  /** Die Verfassungsfrage (REC-1): Paket, Hürden, Gericht, Volksabstimmung; ältere Spielstände legen ihn beim ersten Zugriff an (sim/verfassung.ts) */
  verfassungsvorgang?: VerfassungsZustand;
  /** Zufallssalz dieser Partie (für Wechsel der Forderungen); ältere Spielstände legen es beim ersten Bedarf an */
  salz?: number;
  /** Monate in Folge mit sehr niedriger Zustimmung (Sturzgefahr) */
  tiefstand: number;
  chronik: ChronikEintrag[];
  hinweise: Hinweis[];
  /** Aktive Krisen-Blocker (MIL-3); ältere Spielstände haben das Feld noch nicht, es wird beim ersten Tick gefüllt */
  krisen?: AktiveKrise[];
  /** Konfliktvorgänge (MIL-1 „Krieg als Vorgang“); ältere Spielstände haben das Feld nicht — kein Krieg-Feld = kein Konflikt, es wird beim ersten Zugriff angelegt */
  kriege?: import("./krieg-typen").KriegVorgang[];
  /** Bestand der Streitkräfte (sim/streitkraefte.ts); ältere Spielstände legen ihn passend zu ihren Bereitschaftswerten beim ersten Zugriff an */
  streitkraefte?: import("./streitkraefte").StreitkraefteZustand;
  /** Netze mit Kapazität und Auslastung (sim/infrastruktur.ts); ältere Spielstände legen sie beim ersten Zugriff an */
  infrastruktur?: import("./infrastruktur").InfrastrukturZustand;
  /** Ausbaustufen der Behörden (sim/behoerden.ts); ältere Spielstände legen sie beim ersten Zugriff mit den Startstufen an */
  behoerden?: import("./behoerden").BehoerdenZustand;
  /** Gesetzesvorhaben: Ruhezeiten, Beschlüsse, Prüfungen des Verfassungsgerichts (sim/gesetzgebung.ts); ältere Spielstände legen es beim ersten Zugriff an */
  gesetzgebung?: import("./gesetzgebung").GesetzgebungZustand;
  /** Der EU-Beitrittsvorgang (AUS-2); ältere Spielstände legen ihn beim ersten Zugriff an (sim/eu.ts) */
  eu?: import("./eu").EuZustand;
  /** Die Zeitung (UI-1): Archiv, Warteschlange und Badge-Zähler; ältere Spielstände legen es beim ersten Monatsschritt an (sim/zeitung.ts) */
  zeitung?: import("./zeitung").ZeitungZustand;
  /** Der Wahlkampf (INN-5); ältere Spielstände haben das Feld nicht — die Phase beginnt beim ersten Tick im Zeitfenster vor der Wahl (sim/wahlkampf.ts) */
  wahlkampf?: WahlkampfZustand;
  /** Katastrophen-Lagen (INF-5); ältere Spielstände legen das Feld beim ersten Zugriff an (sim/katastrophe.ts) */
  katastrophen?: KatastrophenZustand;
  /** Die Wahlen dieser Partie, die laufende Stichwahl und der Wahlabend, den die Oberfläche zeigen soll (sim/wahl.ts); ältere Spielstände legen es beim ersten Zugriff an */
  wahl?: WahlZustand;
  /** Die Medien: Zustand je Cluster, Eingriffe, Pressefreiheitswert, Rohdaten (sim/medien.ts); ältere Spielstände legen es beim ersten Zugriff an */
  medien?: import("./medien").MedienZustand;
  /** Gesellschaft: Milieus, Opposition als Akteur, Bewegungen, Rathäuser (sim/gesellschaft.ts); ältere Spielstände legen es beim ersten Zugriff an */
  gesellschaft?: import("./gesellschaft-typen").GesellschaftZustand;
  /** Beginn jeder Amtszeit; die Müdigkeit zählt ab dem letzten Beginn (sim/amtszeit.ts); ältere Spielstände haben nur die erste Amtszeit ab Tag 0 */
  amtszeiten?: AmtszeitStart[];
  /** Das Umbildungsfenster nach der Wiederwahl (sim/amtszeit.ts) */
  umbildung?: UmbildungZustand;
  /** Nachfolge in der letzten Amtszeit (sim/amtszeit.ts) */
  nachfolge?: NachfolgeZustand;
  /** Putschrisiko, Amtsenthebungsverfahren, Gesundheit, Rücktrittsforderung (sim/enden.ts) */
  enden?: EndenZustand;
  /** Ziele früherer Amtszeiten, eingefroren zum Ende der jeweiligen Amtszeit */
  zielArchiv?: ZielArchiv[];
  /** Die Oberfläche soll die Zielwahl der neuen Amtszeit zeigen, bis sie beantwortet ist */
  zielwahl?: { amtszeit: number; offen: boolean };
  /** Verschiebung, die die Zustimmung beim Start auf den Wahlanteil setzt */
  kalibrierung: number;
  /** Ausgangswerte für die Bilanz */
  start: { inflation: number; arbeitslosigkeit: number; wachstum: number; schulden: number; vertrauen: number; akut: number; datum: string };
  ende?: Ende;
}
