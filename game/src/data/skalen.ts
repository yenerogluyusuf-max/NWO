// Wie eine Maßnahme eingestellt wird. Nicht alles ist eine Zahl: Eine Medienaufsicht hat Ausrichtungen, kein Prozent.
//   regime  benannte Zustände (absolute Stufen), etwa „Strenge Aufsicht mit Strafen“
//   satz    ein Satz oder Preis, der sich senken oder anheben lässt
//   menge   ein Umfang oder Budget, das sich zurückfahren oder ausbauen lässt
// Intern bleibt jede Maßnahme ein Index von 0 bis 100; die Skala übersetzt ihn in Worte. Die Zustände sind Spielmodell,
// keine Behauptung über das echte Recht; jeder Text beschreibt, was sich im Land ändert.

export type SkalenArt = "regime" | "satz" | "menge";

export interface SkalenStufe {
  /** Indexwert, auf den die Maßnahme gestellt wird */
  w: number;
  name: string;
  text?: string;
}

export interface Skala {
  art: SkalenArt;
  frage: string;
  stufen: SkalenStufe[];
}

const S = (w: number, name: string, text?: string): SkalenStufe => (text ? { w, name, text } : { w, name });

/** Benannte Zustände; genau einer liegt nahe am Startwert der Maßnahme („heute“). */
const REGIME: Record<string, SkalenStufe[]> = {
  m_wissenschaftsfreiheit: [
    S(10, "Staatlich gelenkt", "Rektoren und Berufungen bestimmt der Staat."),
    S(25, "Stark kontrolliert", "Wenig Spielraum in Lehre und Berufungen."),
    S(40, "Teilweise autonom", "Autonomie mit politischer Einflussnahme."),
    S(65, "Weitgehend autonom", "Hochschulen wählen Leitung und Personal weitgehend selbst."),
    S(90, "Volle akademische Freiheit", "Unabhängige Berufungen, freie Forschung und Lehre."),
  ],
  m_medienaufsicht: [
    S(10, "Selbstkontrolle", "Die Branche kontrolliert sich selbst."),
    S(30, "Nur bei Straftaten", "Eingriffe nur nach Gerichtsbeschluss."),
    S(50, "Regelmäßige Aufsicht", "Die Behörde prüft und rügt."),
    S(65, "Strenge Aufsicht mit Strafen", "Bußgelder und Sendeverbote sind an der Tagesordnung."),
    S(90, "Verbote und Schließungen", "Kritische Sender und Zeitungen werden geschlossen."),
  ],
  m_internetsperren: [
    S(0, "Keine Sperren", "Das Netz ist frei."),
    S(25, "Nur bei schweren Straftaten", "Sperren nach Gerichtsbeschluss."),
    S(45, "Gezielte Sperren", "Einzelne Seiten und Beiträge werden gesperrt."),
    S(60, "Umfangreiche Sperren und Drosselung", "Soziale Medien werden in Krisen gedrosselt."),
    S(90, "Plattformsperren und Zensur", "Ganze Plattformen sind gesperrt."),
  ],
  m_staatsmedien: [
    S(10, "Öffentlich-rechtlich unabhängig", "Sender mit Beitrag und unabhängiger Aufsicht."),
    S(35, "Kleines Budget", "Staatliche Sender, wenig staatliche Anzeigen."),
    S(60, "Große Staatssender", "Viel staatliche Werbung, regierungsnahe Berichte."),
    S(85, "Staatsmedien dominieren", "Andere Sender sind vom Anzeigenmarkt abgeschnitten."),
  ],
  m_versammlungsfreiheit: [
    S(10, "Verbote und harte Auflagen", "Demonstrationen werden meist untersagt."),
    S(35, "Eingeschränkt", "Genehmigungen, Sperrzonen und Auflagen."),
    S(60, "Weitgehend frei mit Anmeldung", "Anmeldung genügt, Verbote sind die Ausnahme."),
    S(85, "Volle Versammlungsfreiheit", "Kundgebungen sind frei, die Polizei schützt sie."),
  ],
  m_gewerkschaftsrechte: [
    S(10, "Streikverbote", "Streiks gelten als Gefahr für die Ordnung."),
    S(35, "Eingeschränktes Streikrecht", "Streiks sind erlaubt, aber leicht verboten."),
    S(60, "Volles Streikrecht", "Tarifverhandlung und Streik sind gesichert."),
    S(85, "Starke Tarifpartner", "Mitbestimmung und branchenweite Tarifverträge."),
  ],
  m_justizreform: [
    S(10, "Politisch gelenkt", "Ernennungen und Verfahren folgen der Regierung."),
    S(35, "Langsam und abhängig", "Überlastete Gerichte, Ernennungen unter Einfluss."),
    S(55, "Mehr Richter, schnellere Verfahren", "Mehr Personal, kürzere Verfahren."),
    S(80, "Unabhängige Ernennungen", "Ein Richterrat ernennt, nicht die Regierung."),
    S(95, "Volle Unabhängigkeit", "Unabhängige Justiz mit Kontrolle durch das Verfassungsgericht."),
  ],
  m_antikorruption: [
    S(10, "Keine Kontrolle", "Vergaben laufen ohne Prüfung."),
    S(35, "Nur Einzelverfahren", "Korruption wird verfolgt, wenn sie auffällt."),
    S(55, "Offene Vergaben", "Große Aufträge werden öffentlich ausgeschrieben."),
    S(75, "Unabhängige Ermittler", "Vermögenserklärungen und eine eigene Behörde."),
    S(95, "Lückenlose Transparenz", "Alle Vergaben und Vermögen sind einsehbar."),
  ],
  m_friedensprozess: [
    S(10, "Abbruch und Härte", "Keine Gespräche, militärische Antwort."),
    S(30, "Eingefroren", "Keine Fortschritte, keine Eskalation."),
    S(55, "Gespräche im Gang", "Vermittler arbeiten an einer Lösung."),
    S(75, "Waffenabgabe vereinbart", "Erste Schritte der Entwaffnung."),
    S(95, "Politische Lösung", "Wiedereingliederung und politische Teilhabe."),
  ],
  m_grenzschutz: [
    S(10, "Offene Grenzen", "Kaum Kontrollen."),
    S(35, "Kontrollen an Übergängen", "Übergänge werden geprüft, der Rest ist offen."),
    S(60, "Mauer und Patrouillen", "Zäune, Personal und Überwachung an den Grenzen."),
    S(85, "Militarisierte Grenze", "Ausgebaute Sperranlagen mit Technik."),
  ],
  m_privatisierung: [
    S(5, "Der Staat behält alles", "Keine Verkäufe."),
    S(30, "Wenige Verkäufe", "Einzelne Beteiligungen werden verkauft."),
    S(55, "Große Beteiligungen verkaufen", "Verkehr, Energie und Banken teilweise in Privathand."),
    S(80, "Breite Privatisierung", "Fast alle Staatsunternehmen gehen an den Markt."),
  ],
  m_kernkraft: [
    S(10, "Kein weiterer Reaktor", "Nur, was schon gebaut wird."),
    S(50, "Das erste Kraftwerk", "Ein Kraftwerk in Betrieb, kein weiterer Ausbau."),
    S(70, "Ein zweites Kraftwerk", "Bau eines weiteren Standorts."),
    S(90, "Programm mit mehreren Standorten", "Mehrere Reaktoren und eine eigene Industrie."),
  ],
  m_bauamnestie: [
    S(0, "Keine Amnestie", "Schwarzbauten werden abgerissen oder verfolgt."),
    S(15, "Kleine Einzelfälle", "Nur Härtefälle werden legalisiert."),
    S(45, "Legalisierung gegen Gebühr", "Gegen Gebühr, ohne Prüfung der Statik."),
    S(80, "Breite Amnestie", "Alle Schwarzbauten werden legalisiert."),
  ],
  m_steueramnestie: [
    S(0, "Keine Amnestie", "Steuersünder werden voll belangt."),
    S(20, "Kleine Regelung", "Für kleine Rückstände."),
    S(50, "Befristete Amnestie", "Strafen entfallen, wer nachzahlt."),
    S(80, "Umfassende Amnestie", "Großzügige Regeln für Vermögen im Ausland."),
  ],
  m_bauaufsicht: [
    S(10, "Nur formal", "Genehmigungen auf Papier."),
    S(40, "Stichproben", "Gelegentliche Kontrollen der Baustellen."),
    S(65, "Unabhängige Statikprüfung", "Externe Prüfer nehmen Statik und Material ab."),
    S(90, "Lückenlos mit Haftung", "Prüfer und Bauherren haften persönlich."),
  ],
  m_religioese_schulen: [
    S(10, "Randfach", "Religion nur als Wahlfach."),
    S(30, "Weniger religiöse Schulen", "Der Anteil wird verringert."),
    S(55, "Wie heute", "Ein deutlicher Anteil der Schulen mit religiösem Schwerpunkt."),
    S(75, "Ausbau", "Mehr Schulen und mehr Plätze."),
    S(95, "Dominierendes Modell", "Der religiöse Schwerpunkt prägt das Schulwesen."),
  ],
  m_eu_annaeherung: [
    S(5, "Abkehr", "Die Beziehungen zu Brüssel werden heruntergefahren."),
    S(35, "Distanzierte Zusammenarbeit", "Handel ja, Reformen nein."),
    S(60, "Reformen für Visafreiheit", "Gegenleistungen bei Recht und Grenzen."),
    S(85, "Beitrittsprozess", "Volle Annäherung mit umfassenden Reformen."),
  ],
  m_preiskontrollen: [
    S(0, "Freie Preise", "Der Markt bestimmt."),
    S(20, "Vereinzelte Kontrollen", "Gelegentliche Prüfungen."),
    S(45, "Höchstpreise für Grundnahrung", "Für Brot, Öl und Milch."),
    S(80, "Umfassende Preisdeckel", "Viele Waren; Schwarzmärkte wachsen."),
  ],
  m_mietdeckel: [
    S(0, "Keine Grenze", "Vermieter setzen die Miete frei."),
    S(30, "Milde Begrenzung", "Erhöhungen dürfen die Inflation nicht übersteigen."),
    S(55, "Deckel für Bestandsmieten", "Bestehende Mietverträge sind geschützt."),
    S(85, "Strenger Mietstopp", "Kaum Erhöhungen; der Neubau leidet."),
  ],
  m_energiesubventionen: [
    S(10, "Marktpreise", "Der Staat greift nicht ein."),
    S(30, "Nur für Bedürftige", "Zuschüsse für ärmere Haushalte."),
    S(55, "Preisdeckel für alle", "Der Staat deckelt Strom und Gas."),
    S(80, "Volle Übernahme", "Der Staat trägt fast die ganze Differenz."),
  ],
  m_hausarzt: [
    S(10, "Freie Arztwahl", "Patienten gehen zu jedem Arzt."),
    S(45, "Hausarzt-Pilotprojekte", "Erste Provinzen testen das System."),
    S(70, "Verbindlicher Hausarzt", "Der Hausarzt ist erste Anlaufstelle."),
    S(90, "Vollständig gesteuert", "Überweisungen nur über den Hausarzt."),
  ],
  m_umweltauflagen: [
    S(5, "Kaum Auflagen", "Grenzwerte werden nicht durchgesetzt."),
    S(35, "Basisgrenzwerte", "Grenzwerte gelten, Kontrollen sind selten."),
    S(60, "EU-nahe Grenzwerte", "Strengere Werte, regelmäßige Kontrollen."),
    S(85, "Strenge Auflagen", "Hohe Anforderungen an Industrie und Verkehr."),
  ],
  m_co2_preis: [
    S(0, "Kein Preis", "Emissionen kosten nichts."),
    S(10, "Symbolischer Preis", "Ein kleiner Preis ohne Lenkungswirkung."),
    S(35, "Handelssystem wie die EU", "Anschluss an den europäischen Handel."),
    S(65, "Hoher CO₂-Preis", "Spürbar für Industrie und Verkehr."),
    S(90, "Sehr hoher Preis", "Ein starker Anreiz zum Umbau."),
  ],
  m_bankenaufsicht: [
    S(10, "Locker", "Kaum Vorgaben."),
    S(30, "Basisregeln", "Mindestvorgaben für Eigenkapital."),
    S(55, "Streng", "Strenge Regeln für Kredite und Eigenkapital."),
    S(80, "Sehr streng", "Hohe Eigenkapitalquoten, enge Kontrolle."),
  ],
  m_gewaltschutz: [
    S(10, "Kaum Schutz", "Wenig Plätze, wenig Verfolgung."),
    S(35, "Lückenhaft", "Frauenhäuser gibt es, aber zu wenige."),
    S(60, "Frauenhäuser und Schutzanordnungen", "Schnelle Anordnungen und Plätze."),
    S(85, "Umfassend mit Polizeischulung", "Dazu geschulte Beamte und Verfahren."),
  ],
  m_rueckkehr: [
    S(5, "Kein Programm", "Rückkehr ist Sache der Betroffenen."),
    S(40, "Freiwillige Anreize", "Hilfen für Rückkehrwillige."),
    S(65, "Abkommen und Programme", "Vereinbarungen mit Herkunftsregionen."),
    S(90, "Konsequente Rückführung", "Druck und Abschiebung."),
  ],
  m_integration: [
    S(5, "Keine Integration", "Aufenthalt ohne Angebote."),
    S(35, "Grundangebote", "Schulplätze und Sprachkurse in Teilen des Landes."),
    S(60, "Sprachkurse und Arbeitserlaubnis", "Zugang zu Arbeit und Schule."),
    S(85, "Volle Perspektive", "Bleiberecht und Einbürgerung."),
  ],
  m_richterrat: [
    S(5, "Weisungsnah", "Justizminister und Präsident bestimmen Zusammensetzung und Beförderungen."),
    S(25, "Wie heute", "Der Justizminister führt den Vorsitz; der Präsident ernennt 4, das Parlament wählt 7 der 13 Mitglieder."),
    S(50, "Teilweise Kollegenwahl", "Ein Teil der Mitglieder wird von Richtern und Staatsanwälten gewählt."),
    S(75, "Mindestens die Hälfte von Kollegen gewählt", "Die Empfehlung der Venedig-Kommission."),
    S(95, "Selbstverwaltung der Justiz", "Kollegenwahl, der Minister ohne Vorsitz und ohne Erlaubnisrecht bei Untersuchungen."),
  ],
  m_notstand: [
    S(0, "Kein Sonderrecht", "Nur das reguläre Verfahren."),
    S(10, "Wie heute", "Notstandsbefugnisse ruhen; die Antiterrorgesetze gelten."),
    S(40, "Erweiterte Polizeibefugnisse per Gesetz", "Mehr Gewahrsam und Durchsuchung, weiter mit richterlicher Kontrolle."),
    S(65, "Notstandsdekrete", "Dekrete mit Gesetzeskraft für bestimmte Bereiche, vom Parlament zu bestätigen."),
    S(90, "Ausnahmezustand", "Höchstens sechs Monate, das Parlament stimmt am selben Tag zu und kann um vier Monate verlängern."),
  ],
  m_urteilsumsetzung: [
    S(5, "Urteile ignorieren", "Gerichte und Behörden folgen weder Straßburg noch dem Verfassungsgericht."),
    S(30, "Wie heute", "Nur einzelne Urteile werden umgesetzt, andere bleiben liegen."),
    S(55, "Ausgewählte Fälle umsetzen", "Klare Fälle werden umgesetzt, politisch heikle noch nicht."),
    S(80, "Alle Urteile umsetzen", "Auch in Fällen mit politischem Gewicht, etwa Kavala."),
  ],
  m_minderheitenrechte: [
    S(10, "Nur die im Vertrag von Lausanne genannten Gemeinden", "Rechte für Griechen, Armenier und Juden; andere Gemeinschaften ohne Anerkennung."),
    S(35, "Wie heute", "Rechte einzelner Gemeinden; viele Streitfragen um Schulen, Sprache und Eigentum bleiben offen."),
    S(60, "Rechte ausbauen", "Sprachunterricht, Rückgabe von Kirchen- und Klostereigentum, Gebetsstätten der Aleviten."),
    S(85, "Volle Gleichstellung und Sprachrechte", "Gleiche Rechte für alle Gemeinschaften, Unterricht in der Muttersprache."),
  ],
  m_wehrdienst: [
    S(0, "Freiwilligenarmee", "Nur Berufs- und Zeitsoldaten."),
    S(15, "Kurzer Wehrdienst (3 Monate)", "Grundausbildung für alle, danach Reserve."),
    S(30, "Wie heute: 6 Monate mit Freikauf", "Freikauf gegen Gebühr mit einem Monat Grundausbildung."),
    S(60, "12 Monate ohne Freikauf", "Mehr Masse, weniger Ausnahmen."),
    S(90, "18 Monate Dienstpflicht", "Lange Dienstzeit für alle Wehrpflichtigen."),
  ],
  m_offiziersauswahl: [
    S(10, "Loyalität entscheidet", "Beförderung folgt der Nähe zur Führung."),
    S(35, "Wie heute", "Der Oberste Militärrat unter Vorsitz des Präsidenten entscheidet im August."),
    S(65, "Leistung und Qualifikation", "Bewertungen und Prüfungen zählen, das Gremium entscheidet weiter."),
    S(90, "Unabhängiges Auswahlverfahren", "Ein Auswahlverfahren aus Leistungsdaten, ohne politischen Einfluss."),
  ],
};

/** Sätze und Preise: senken oder anheben. */
const SATZ = new Set(["m_einkommensteuer", "m_mwst", "m_koerperschaftsteuer", "m_kraftstoffsteuer", "m_immobiliensteuer", "m_zuzahlungen", "m_mindestlohn", "m_zoelle"]);

const SATZ_NAMEN = ["Deutlich senken", "Senken", "Unverändert", "Anheben", "Deutlich anheben"];
const MENGE_NAMEN = ["Stark zurückfahren", "Zurückfahren", "Wie heute", "Ausbauen", "Massiv ausbauen"];

export function skalenArt(id: string): SkalenArt {
  return REGIME[id] ? "regime" : SATZ.has(id) ? "satz" : "menge";
}

/**
 * Die wählbaren Stufen einer Maßnahme. Bei Regimen sind es die benannten Zustände; bei Sätzen und Mengen fünf Schritte um den
 * heutigen Stand (±20 und ±40 Punkte), soweit sie zwischen 0 und 100 liegen.
 */
export function skala(id: string, jetzt: number): Skala {
  const art = skalenArt(id);
  if (art === "regime") return { art, frage: "Welche Ausrichtung?", stufen: REGIME[id]! };
  const namen = art === "satz" ? SATZ_NAMEN : MENGE_NAMEN;
  const mitte = Math.round(jetzt);
  const stufen: SkalenStufe[] = [];
  for (let k = -2; k <= 2; k++) {
    const w = mitte + 20 * k;
    if (w < 0 || w > 100) continue;
    stufen.push({ w, name: namen[k + 2]!, text: k === 0 ? `Stufe ${w}` : `Stufe ${w} (${k > 0 ? "+" : "−"}${Math.abs(20 * k)})` });
  }
  return { art, frage: art === "satz" ? "Auf welchen Satz?" : "Wie viel?", stufen };
}

/** Welche Stufe entspricht dem Wert am ehesten, und wie nah ist er ihr? */
export function naechsteStufe(s: Skala, wert: number): { stufe: SkalenStufe; genau: boolean } {
  let beste = s.stufen[0]!;
  for (const st of s.stufen) if (Math.abs(st.w - wert) < Math.abs(beste.w - wert)) beste = st;
  return { stufe: beste, genau: Math.abs(beste.w - wert) <= 7 };
}

/** Das passende Verb für eine Richtung: Sätze werden erhöht oder gesenkt, Mengen ausgebaut oder zurückgefahren, Regelungen ausgeweitet oder eingeschränkt. */
export function tunWort(id: string, richtung: 1 | -1): string {
  const art = skalenArt(id);
  if (art === "satz") return richtung > 0 ? "erhöhen" : "senken";
  if (art === "menge") return richtung > 0 ? "ausbauen" : "zurückfahren";
  return richtung > 0 ? "ausweiten" : "einschränken";
}
