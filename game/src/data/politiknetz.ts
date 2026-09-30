// Katalog des Politiknetzes (Spieldesign, Abschnitt 5; POLITIKNETZ.md).
//
// Alle Knoten sind Indizes von 0 bis 100 („mehr davon“ = höherer Wert), außer
// den Eingangsgrößen aus dem Wirtschaftsmodell, die ihre eigene Einheit behalten.
// Jede Verbindung wirkt auf die Abweichung des Ausgangsknotens von seinem
// Startwert: Beim Start ist das Netz im Gleichgewicht, Bewegung entsteht aus
// Entscheidungen, aus dem Wirtschaftsmodell, aus regionalen Unterschieden und
// aus Zufallsereignissen. Stärken und Verzögerungen sind grob geschätzt
// („grob“) und werden kalibriert.

export type Theme =
  | "wirtschaft"
  | "haushalt"
  | "arbeit"
  | "gesundheit"
  | "bildung"
  | "infrastruktur"
  | "energie"
  | "landwirtschaft"
  | "wohnen"
  | "sicherheit"
  | "recht"
  | "militaer"
  | "kultur"
  | "gesellschaft"
  | "aussen"
  | "gruppen";

export type NodeKind = "massnahme" | "groesse" | "problem" | "gruppe";

export interface NodeSpec {
  id: string;
  name: string;
  theme: Theme;
  kind: NodeKind;
  text: string;
  /** Startwert (Index 0–100), falls nicht aus Wirtschaftsmodell oder Provinzdaten */
  start: number;
  /** Rückkehr zum Startwert pro Monat (Trägheit) */
  decay: number;
  /** Nur Maßnahmen: Kosten pro Jahr in % des BIP bei Stufe 100 gegenüber Stufe 0 (negativ = Einnahmen) */
  cost?: number;
  /** Nur Maßnahmen: Monate bis zur vollen Umsetzung einer Änderung */
  months?: number;
  /** Nur Probleme: ab diesem Wert gilt das Problem in einer Provinz als akut */
  threshold?: number;
  /** Eingangsgröße aus dem Wirtschaftsmodell */
  input?: "inflation" | "arbeitslosigkeit" | "wachstum" | "leitzins" | "abwertung" | "defizit" | "schulden";
}

export interface EdgeSpec {
  from: string;
  to: string;
  /** Anteil der Abweichung, der pro Monat weitergegeben wird */
  weight: number;
  /** Verzögerung in Monaten (0–12) */
  lag: number;
  why: string;
}

const N: NodeSpec[] = [];
const E: EdgeSpec[] = [];

function m(theme: Theme, id: string, name: string, start: number, cost: number, months: number, text: string) {
  N.push({ id, name, theme, kind: "massnahme", text, start, decay: 0, cost, months });
}
function g(theme: Theme, id: string, name: string, start: number, text: string, decay = 0.08) {
  N.push({ id, name, theme, kind: "groesse", text, start, decay });
}
function inp(theme: Theme, id: string, name: string, input: NonNullable<NodeSpec["input"]>, text: string) {
  N.push({ id, name, theme, kind: "groesse", text, start: 0, decay: 0, input });
}
function p(theme: Theme, id: string, name: string, start: number, threshold: number, text: string) {
  N.push({ id, name, theme, kind: "problem", text, start, decay: 0.1, threshold });
}
function grp(id: string, name: string, text: string) {
  // Zufriedenheit kehrt schneller zur Ruhelage zurück: Menschen gewöhnen sich an eine neue Lage.
  N.push({ id, name, theme: "gruppen", kind: "gruppe", text, start: 50, decay: 0.15 });
}
/**
 * Die Bauzeit einer Maßnahme steckt in ihrer Umsetzungsdauer (`months`). Die
 * Verzögerung einer Verbindung beschreibt nur, wie lange die Wirkung danach
 * braucht, und ist deshalb auf 12 Monate begrenzt.
 */
function e(from: string, to: string, weight: number, lag: number, why: string) {
  E.push({ from, to, weight, lag: Math.min(lag, 12), why });
}

// ---------------------------------------------------------------------------
// Eingangsgrößen aus dem Wirtschaftsmodell

inp("wirtschaft", "inflation", "Inflation", "inflation", "Jahresinflation in %, aus dem Wirtschaftsmodell.");
inp("wirtschaft", "arbeitslosigkeit", "Arbeitslosigkeit", "arbeitslosigkeit", "Arbeitslosenquote, regional unterschiedlich.");
inp("wirtschaft", "wachstum", "Wachstum", "wachstum", "Wirtschaftswachstum, als Index (50 = Potenzialwachstum).");
inp("wirtschaft", "leitzins", "Leitzins", "leitzins", "Leitzins der Zentralbank in %.");
inp("wirtschaft", "abwertung", "Abwertung der Lira", "abwertung", "Wertverlust der Lira gegenüber dem Dollar in den letzten zwölf Monaten, in %.");
inp("haushalt", "defizit", "Haushaltsdefizit", "defizit", "Defizit in % des BIP, als Index.");
inp("haushalt", "schulden", "Staatsschulden", "schulden", "Schuldenquote in % des BIP.");

// ---------------------------------------------------------------------------
// Wirtschaft

g("wirtschaft", "lebenshaltung", "Gefühlte Teuerung", 70, "Wie teuer sich der Alltag anfühlt: Lebensmittel, Miete, Energie.");
g("wirtschaft", "realeinkommen", "Reallöhne", 45, "Was die Löhne nach Abzug der Preissteigerung wert sind.");
g("wirtschaft", "investitionen", "Investitionen", 45, "Wie viel Unternehmen in Anlagen und Maschinen stecken.");
g("wirtschaft", "export", "Exportstärke", 55, "Wettbewerbsfähigkeit der Exportindustrie.");
g("wirtschaft", "tourismus", "Tourismus", 65, "Gäste und Deviseneinnahmen aus dem Tourismus.");
g("wirtschaft", "industrie", "Industrieproduktion", 55, "Leistung von Textil-, Auto-, Maschinen- und Chemieindustrie.");
g("wirtschaft", "mittelstand", "Lage des Mittelstands", 45, "Kleine und mittlere Betriebe: Aufträge, Finanzierung, Überleben.");
g("wirtschaft", "kredite", "Kreditvergabe", 40, "Wie leicht Haushalte und Firmen an Kredite kommen.");
g("wirtschaft", "auslandskapital", "Auslandskapital", 40, "Direktinvestitionen und Portfoliozuflüsse aus dem Ausland.");
g("wirtschaft", "kostendruck", "Kostendruck der Betriebe", 60, "Lohn-, Energie- und Importkosten. Wirkt auf die Inflation zurück.");
g("wirtschaft", "produktivitaet", "Produktivität", 50, "Was pro Arbeitsstunde entsteht. Wirkt auf das Potenzialwachstum zurück.");
g("wirtschaft", "ungleichheit", "Ungleichheit", 60, "Abstand zwischen hohen und niedrigen Einkommen.");
g("wirtschaft", "schattenwirtschaft", "Schattenwirtschaft", 45, "Arbeit und Umsatz ohne Steuern und Versicherung.");
g("wirtschaft", "gruendungen", "Unternehmensgründungen", 50, "Wie viele neue Firmen entstehen.");
g("wirtschaft", "dollarisierung", "Dollarisierung", 55, "Wie sehr Menschen ihr Erspartes in Dollar, Euro oder Gold halten.");

m("wirtschaft", "m_mindestlohn", "Mindestlohn", 50, 0.6, 1, "Höhe des gesetzlichen Mindestlohns im Verhältnis zum Durchschnittslohn.");
m("wirtschaft", "m_exportfoerderung", "Exportförderung", 40, 0.4, 6, "Günstige Exportkredite und Zuschüsse für Ausfuhren.");
m("wirtschaft", "m_investitionsanreize", "Investitionsanreize", 45, 0.5, 9, "Steuervorteile und Zuschüsse für Investitionen, auch in Förderregionen.");
m("wirtschaft", "m_kreditgarantien", "Staatliche Kreditgarantien", 35, 0.5, 3, "Der Staat bürgt für Kredite an Betriebe.");
m("wirtschaft", "m_preiskontrollen", "Preiskontrollen für Lebensmittel", 20, 0.1, 2, "Obergrenzen und Kontrollen bei Grundnahrungsmitteln.");
m("wirtschaft", "m_tourismuswerbung", "Tourismuswerbung", 50, 0.1, 6, "Werbung und Förderung für den Tourismus im Ausland.");
m("wirtschaft", "m_kmu", "Mittelstandsförderung", 40, 0.3, 6, "Programme für kleine und mittlere Betriebe.");
m("wirtschaft", "m_zoelle", "Einfuhrzölle", 40, -0.3, 3, "Zölle auf Importe außerhalb der Zollunion mit der EU.");
m("wirtschaft", "m_bankenaufsicht", "Bankenaufsicht", 55, 0.02, 6, "Regeln für Kreditvergabe und Eigenkapital der Banken.");

e("inflation", "lebenshaltung", 0.04, 0, "Steigende Preise machen den Alltag spürbar teurer. Auch wenn die Inflation sinkt, bleiben die Preise hoch.");
e("abwertung", "lebenshaltung", 0.03, 1, "Eine schwache Lira verteuert Importe wie Energie und Medikamente.");
e("inflation", "realeinkommen", -0.06, 0, "Wenn Preise schneller steigen als Löhne, sinkt die Kaufkraft.");
e("m_mindestlohn", "realeinkommen", 0.06, 1, "Ein höherer Mindestlohn hebt die unteren Einkommen.");
e("m_mindestlohn", "kostendruck", 0.05, 1, "Höhere Löhne sind höhere Kosten für die Betriebe.");
e("m_mindestlohn", "schattenwirtschaft", 0.03, 3, "Ist der Mindestlohn hoch, stellen manche Betriebe lieber ohne Vertrag ein.");
e("m_mindestlohn", "ungleichheit", -0.04, 3, "Der Abstand zwischen unten und oben wird kleiner.");
e("abwertung", "kostendruck", 0.04, 1, "Importierte Vorprodukte werden teurer.");
e("leitzins", "kredite", -0.05, 2, "Hohe Zinsen verteuern Kredite.");
e("leitzins", "investitionen", -0.03, 4, "Teure Finanzierung lässt Firmen Investitionen verschieben.");
e("kredite", "investitionen", 0.05, 3, "Wer an Kredite kommt, investiert eher.");
e("kredite", "mittelstand", 0.05, 2, "Kleine Betriebe hängen besonders an Bankkrediten.");
e("m_kreditgarantien", "kredite", 0.06, 2, "Staatsbürgschaften machen Kredite für Banken sicherer.");
e("m_kreditgarantien", "mittelstand", 0.04, 3, "Betriebe überbrücken Engpässe mit verbürgten Krediten.");
e("m_bankenaufsicht", "kredite", -0.03, 3, "Strenge Regeln bremsen riskante Kreditvergabe.");
e("m_bankenaufsicht", "auslandskapital", 0.02, 6, "Stabile Banken schaffen Vertrauen bei Anlegern.");
e("abwertung", "export", 0.03, 3, "Eine schwache Lira macht türkische Waren im Ausland billiger.");
e("abwertung", "tourismus", 0.03, 3, "Urlaub in der Türkei wird für Ausländer günstiger.");
e("m_exportfoerderung", "export", 0.05, 6, "Günstige Exportkredite helfen Ausfuhren.");
e("m_zoelle", "industrie", 0.02, 6, "Zölle schützen heimische Hersteller vor Konkurrenz.");
e("m_zoelle", "kostendruck", 0.03, 3, "Importierte Vorprodukte werden teurer.");
e("m_zoelle", "export", -0.02, 9, "Handelspartner reagieren, und geschützte Firmen werden träger.");
e("export", "industrie", 0.05, 2, "Exportaufträge lasten Fabriken aus.");
e("industrie", "arbeitsplaetze_industrie", 0.05, 3, "Mehr Produktion braucht mehr Beschäftigte.");
e("m_tourismuswerbung", "tourismus", 0.04, 6, "Werbung bringt mehr Gäste.");
e("m_investitionsanreize", "investitionen", 0.05, 9, "Steuervorteile senken die Kosten einer Investition.");
e("m_investitionsanreize", "auslandskapital", 0.03, 12, "Anreize ziehen auch ausländische Investoren an.");
e("m_kmu", "mittelstand", 0.05, 6, "Förderprogramme stützen kleine Betriebe.");
e("m_kmu", "gruendungen", 0.04, 6, "Wer gründen will, bekommt Starthilfe.");
e("investitionen", "produktivitaet", 0.03, 12, "Neue Maschinen machen Arbeit produktiver.");
e("auslandskapital", "investitionen", 0.04, 6, "Ausländisches Geld finanziert Fabriken und Projekte.");
e("m_preiskontrollen", "lebenshaltung", -0.04, 1, "Obergrenzen dämpfen sichtbare Preise im Supermarkt.");
e("m_preiskontrollen", "schattenwirtschaft", 0.03, 3, "Unter Preisdeckeln wandern Waren auf graue Märkte.");
e("m_preiskontrollen", "landwirtschaft_einkommen", -0.04, 6, "Niedrige Preise treffen die Erzeuger.");
e("inflation", "dollarisierung", 0.05, 1, "Bei hoher Inflation flüchten Sparer in Dollar und Gold.");
e("abwertung", "dollarisierung", 0.04, 0, "Wer eine schwache Lira erlebt, traut ihr weniger.");
e("dollarisierung", "auslandskapital", -0.02, 3, "Wenn schon Einheimische der Lira misstrauen, zögern Ausländer auch.");
e("schattenwirtschaft", "steuereinnahmen", -0.04, 3, "Schwarzarbeit zahlt keine Steuern.");
e("ungleichheit", "polarisierung", 0.02, 12, "Große Unterschiede verschärfen politische Gräben.");
e("gruendungen", "mittelstand", 0.03, 12, "Aus Gründungen wird Mittelstand.");

// ---------------------------------------------------------------------------
// Haushalt und Steuern

g("haushalt", "steuereinnahmen", "Steuereinnahmen", 50, "Was der Staat tatsächlich einnimmt.");
g("haushalt", "steuermoral", "Steuerehrlichkeit", 45, "Wie viele Steuern tatsächlich gezahlt werden.");
g("haushalt", "zinslast", "Zinslast des Staates", 45, "Anteil des Haushalts, der für Zinsen draufgeht.");
g("haushalt", "vertrauen_maerkte", "Vertrauen der Märkte", 45, "Wie Anleger die Staatsfinanzen einschätzen.");

m("haushalt", "m_einkommensteuer", "Einkommensteuer", 50, -1.5, 3, "Höhe der Einkommensteuer.");
m("haushalt", "m_mwst", "Mehrwertsteuer", 60, -2.0, 1, "Höhe der Mehrwertsteuer.");
m("haushalt", "m_koerperschaftsteuer", "Körperschaftsteuer", 50, -0.8, 3, "Steuer auf Unternehmensgewinne.");
m("haushalt", "m_kraftstoffsteuer", "Steuer auf Kraftstoff", 60, -0.8, 1, "Verbrauchsteuer auf Benzin und Diesel.");
m("haushalt", "m_immobiliensteuer", "Steuer auf Immobilien und Vermögen", 30, -0.5, 6, "Grundsteuer und Abgaben auf teure Immobilien.");
m("haushalt", "m_steueramnestie", "Steueramnestie", 20, -0.1, 2, "Wer Schulden beim Fiskus nachzahlt, bekommt Strafen erlassen.");
m("haushalt", "m_steuerfahndung", "Steuerfahndung", 45, 0.05, 6, "Mehr Prüfer und Kontrollen gegen Steuerhinterziehung.");
m("haushalt", "m_privatisierung", "Privatisierung", 30, -0.2, 12, "Verkauf staatlicher Unternehmen und Beteiligungen.");

e("m_einkommensteuer", "steuereinnahmen", 0.05, 1, "Höhere Sätze bringen mehr Einnahmen.");
e("m_einkommensteuer", "realeinkommen", -0.04, 1, "Netto bleibt weniger vom Lohn.");
e("m_einkommensteuer", "schattenwirtschaft", 0.03, 6, "Hohe Steuern machen Schwarzarbeit attraktiver.");
e("m_mwst", "steuereinnahmen", 0.07, 1, "Die Mehrwertsteuer ist die ergiebigste Steuer.");
e("m_mwst", "lebenshaltung", 0.05, 1, "Sie steckt in jedem Preis im Laden.");
e("m_mwst", "ungleichheit", 0.02, 6, "Ärmere geben einen größeren Teil ihres Einkommens für Konsum aus.");
e("m_koerperschaftsteuer", "steuereinnahmen", 0.03, 3, "Gewinnsteuern bringen Einnahmen.");
e("m_koerperschaftsteuer", "investitionen", -0.03, 9, "Höhere Steuern mindern den Ertrag einer Investition.");
e("m_koerperschaftsteuer", "auslandskapital", -0.02, 9, "Investoren vergleichen Steuersätze.");
e("m_kraftstoffsteuer", "steuereinnahmen", 0.03, 1, "Kraftstoff wird viel verkauft.");
e("m_kraftstoffsteuer", "lebenshaltung", 0.03, 0, "Benzinpreise spürt jeder sofort.");
e("m_kraftstoffsteuer", "kostendruck", 0.02, 1, "Transport wird teurer.");
e("m_kraftstoffsteuer", "luftqualitaet", 0.01, 12, "Etwas weniger Verkehr.");
e("m_immobiliensteuer", "steuereinnahmen", 0.02, 6, "Einnahmen aus Immobilien.");
e("m_immobiliensteuer", "ungleichheit", -0.03, 12, "Vermögende tragen mehr.");
e("m_immobiliensteuer", "mieten", 0.01, 12, "Ein Teil wird auf Mieter umgelegt.");
e("m_steueramnestie", "steuereinnahmen", 0.03, 1, "Nachzahlungen bringen kurzfristig Geld.");
e("m_steueramnestie", "steuermoral", -0.04, 6, "Wer brav zahlt, fühlt sich betrogen; wer nicht zahlt, wartet auf die nächste Amnestie.");
e("m_steuerfahndung", "steuermoral", 0.05, 6, "Wer kontrolliert wird, zahlt eher.");
e("m_steuerfahndung", "schattenwirtschaft", -0.04, 6, "Schwarzarbeit wird riskanter.");
e("m_steuerfahndung", "mittelstand", -0.01, 3, "Prüfungen belasten auch ehrliche Betriebe.");
e("steuermoral", "steuereinnahmen", 0.05, 3, "Ehrliche Steuerzahler füllen die Kasse.");
e("m_privatisierung", "steuereinnahmen", 0.02, 6, "Verkaufserlöse entlasten den Haushalt, aber nur einmal.");
e("m_privatisierung", "auslandskapital", 0.02, 12, "Investoren kaufen Staatsbetriebe.");
e("m_privatisierung", "korruption", 0.02, 12, "Verkäufe unter Wert an Nahestehende sind ein bekanntes Risiko.");
e("leitzins", "zinslast", 0.03, 3, "Neue Schulden werden teurer.");
e("schulden", "zinslast", 0.03, 6, "Mehr Schulden, mehr Zinsen.");
e("defizit", "vertrauen_maerkte", -0.04, 1, "Hohe Defizite machen Anleger nervös.");
e("zinslast", "vertrauen_maerkte", -0.02, 3, "Eine hohe Zinslast engt den Spielraum ein.");
e("vertrauen_maerkte", "auslandskapital", 0.04, 1, "Vertrauen zieht Kapital an.");

// ---------------------------------------------------------------------------
// Arbeit und Soziales

g("arbeit", "armut", "Armut", 40, "Anteil der Menschen, die mit dem Nötigsten nicht auskommen.");
g("arbeit", "informelle_arbeit", "Informelle Beschäftigung", 45, "Arbeit ohne Vertrag und Sozialversicherung.");
g("arbeit", "frauenerwerb", "Frauenerwerbstätigkeit", 35, "Anteil der Frauen mit bezahlter Arbeit.");
g("arbeit", "jugendarbeitslosigkeit", "Jugendarbeitslosigkeit", 55, "Arbeitslosigkeit der 15- bis 24-Jährigen.");
g("arbeit", "arbeitsplaetze_industrie", "Industriearbeitsplätze", 50, "Beschäftigung in Fabriken.");
g("arbeit", "rentenniveau", "Rentenniveau", 40, "Was Renten im Verhältnis zu den Lebenshaltungskosten wert sind.");
g("arbeit", "streikneigung", "Streikbereitschaft", 35, "Wie schnell Gewerkschaften und Beschäftigte zu Streiks greifen.");
g("arbeit", "sozialkassen", "Lage der Sozialversicherung", 45, "Beiträge gegen Ausgaben der Renten- und Krankenkasse.");

m("arbeit", "m_renten", "Rentenerhöhungen", 50, 1.2, 1, "Anpassung der Renten über die Inflation hinaus.");
m("arbeit", "m_fruehrente", "Frühverrentung", 40, 0.6, 3, "Früherer Renteneintritt für bestimmte Jahrgänge.");
m("arbeit", "m_kindergeld", "Kindergeld und Familienhilfe", 30, 0.5, 2, "Geld für Familien mit Kindern.");
m("arbeit", "m_sozialhilfe", "Sozialhilfe", 35, 0.6, 2, "Grundsicherung für bedürftige Haushalte.");
m("arbeit", "m_arbeitslosengeld", "Arbeitslosengeld", 30, 0.3, 2, "Höhe und Dauer des Arbeitslosengeldes.");
m("arbeit", "m_gewerkschaftsrechte", "Gewerkschaftsrechte", 35, 0.0, 6, "Recht auf Organisation, Tarifverhandlung und Streik.");
m("arbeit", "m_kinderbetreuung", "Kinderbetreuung", 25, 0.3, 12, "Plätze in Krippen und Kindergärten.");
m("arbeit", "m_ausbildung", "Berufsausbildungsprogramme", 40, 0.2, 9, "Kurse und Lehrstellen für Arbeitslose und Junge.");

p("arbeit", "p_armut", "Armut", 40, 60, "Viele Haushalte kommen nicht mehr über den Monat.");
p("arbeit", "p_jugendarbeitslosigkeit", "Perspektivlose Jugend", 45, 60, "Junge Menschen finden keine Arbeit und keine Ausbildung.");
p("arbeit", "p_streiks", "Streikwelle", 30, 60, "Beschäftigte legen die Arbeit nieder.");

e("arbeitslosigkeit", "armut", 0.03, 2, "Wer keine Arbeit hat, rutscht schnell in die Armut.");
e("realeinkommen", "armut", -0.05, 1, "Steigende Reallöhne heben Haushalte aus der Armut.");
e("lebenshaltung", "armut", 0.04, 1, "Teures Leben trifft die Ärmsten zuerst.");
e("m_sozialhilfe", "armut", -0.05, 2, "Grundsicherung fängt die Ärmsten auf.");
e("m_kindergeld", "armut", -0.03, 2, "Familien mit vielen Kindern sind besonders gefährdet.");
e("m_kindergeld", "geburtenrate", 0.01, 12, "Etwas mehr Familien entscheiden sich für Kinder.");
e("m_renten", "rentenniveau", 0.06, 1, "Höhere Renten gleichen die Teuerung aus.");
e("inflation", "rentenniveau", -0.04, 1, "Die Inflation frisst die Renten auf.");
e("m_renten", "sozialkassen", -0.04, 3, "Höhere Renten belasten die Kassen.");
e("m_fruehrente", "sozialkassen", -0.05, 6, "Mehr Rentner, weniger Beitragszahler.");
e("m_fruehrente", "fachkraefte", -0.02, 12, "Erfahrene Beschäftigte verlassen die Betriebe.");
e("m_arbeitslosengeld", "armut", -0.02, 2, "Arbeitslose stürzen weniger tief.");
e("m_arbeitslosengeld", "informelle_arbeit", -0.02, 6, "Wer versichert ist, hat einen Grund, es zu bleiben.");
e("m_gewerkschaftsrechte", "realeinkommen", 0.03, 9, "Gewerkschaften verhandeln höhere Löhne.");
e("m_gewerkschaftsrechte", "streikneigung", 0.04, 3, "Wer streiken darf, tut es auch.");
e("m_gewerkschaftsrechte", "kostendruck", 0.02, 9, "Tarifabschlüsse erhöhen die Lohnkosten.");
e("m_kinderbetreuung", "frauenerwerb", 0.05, 12, "Mütter können arbeiten, wenn die Kinder betreut sind.");
e("m_ausbildung", "jugendarbeitslosigkeit", -0.04, 9, "Ausbildung öffnet Türen in den Arbeitsmarkt.");
e("m_ausbildung", "fachkraefte", 0.03, 12, "Mehr ausgebildete Arbeitskräfte.");
e("arbeitslosigkeit", "jugendarbeitslosigkeit", 0.05, 1, "Junge trifft eine schwache Konjunktur zuerst.");
e("informelle_arbeit", "sozialkassen", -0.04, 6, "Informell Beschäftigte zahlen keine Beiträge.");
e("schattenwirtschaft", "informelle_arbeit", 0.05, 1, "Schwarzarbeit ist informelle Arbeit.");
e("frauenerwerb", "produktivitaet", 0.02, 12, "Mehr Arbeitskräfte, mehr Talent.");
e("frauenerwerb", "armut", -0.02, 6, "Zwei Einkommen schützen Familien.");
e("inflation", "streikneigung", 0.04, 1, "Wenn Löhne der Inflation hinterherlaufen, wächst die Wut.");
e("realeinkommen", "streikneigung", -0.04, 1, "Wer mehr in der Tasche hat, streikt seltener.");
e("streikneigung", "p_streiks", 0.08, 0, "Hohe Bereitschaft wird irgendwann zu Streiks.");
e("armut", "p_armut", 0.1, 0, "Wachsende Armut wird zum Problem.");
e("jugendarbeitslosigkeit", "p_jugendarbeitslosigkeit", 0.1, 0, "Ohne Arbeit und Ausbildung fehlen Perspektiven.");
e("p_streiks", "industrie", -0.03, 0, "Streiks legen die Produktion lahm.");
e("sozialkassen", "vertrauen_maerkte", 0.01, 6, "Löchrige Sozialkassen belasten am Ende den Haushalt.");
e("industrie", "arbeitsplaetze_industrie", 0.04, 3, "Fabriken stellen ein, wenn die Aufträge laufen.");

// ---------------------------------------------------------------------------
// Gesundheit

g("gesundheit", "gesundheitsversorgung", "Gesundheitsversorgung", 55, "Erreichbarkeit und Qualität von Ärzten und Krankenhäusern.");
g("gesundheit", "aerzte", "Ärzte im Land", 50, "Wie viele Ärztinnen und Ärzte im Land arbeiten.");
g("gesundheit", "wartezeiten", "Wartezeiten", 45, "Wie lange man auf Termine und Behandlungen wartet.");
g("gesundheit", "lebenserwartung", "Lebenserwartung", 55, "Wie alt die Menschen werden.");
g("gesundheit", "medikamente", "Versorgung mit Medikamenten", 55, "Ob Apotheken alle Medikamente vorrätig haben.");

m("gesundheit", "m_krankenhausbau", "Krankenhausbau", 45, 0.4, 24, "Neue Krankenhäuser, auch in öffentlich-privater Partnerschaft.");
m("gesundheit", "m_aerztegehalt", "Gehälter im Gesundheitswesen", 40, 0.3, 3, "Bezahlung von Ärzten und Pflegekräften im staatlichen Dienst.");
m("gesundheit", "m_hausarzt", "Hausarztsystem", 45, 0.15, 12, "Familienärzte als erste Anlaufstelle.");
m("gesundheit", "m_zuzahlungen", "Zuzahlungen der Patienten", 30, -0.2, 2, "Eigenanteil bei Arztbesuch und Medikamenten.");

p("gesundheit", "p_aerztemangel", "Ärztemangel", 40, 60, "Ärztinnen und Ärzte wandern ab, Stellen bleiben leer.");

e("m_krankenhausbau", "gesundheitsversorgung", 0.04, 24, "Neue Kliniken, sobald sie fertig sind.");
e("m_krankenhausbau", "korruption", 0.01, 24, "Große Bauaufträge bergen Vergaberisiken.");
e("m_aerztegehalt", "aerzte", 0.05, 6, "Bessere Bezahlung hält Ärzte im Land.");
e("abwertung", "aerzte", -0.02, 6, "Gehälter in Lira verlieren gegenüber dem Ausland an Wert.");
e("abwertung", "medikamente", -0.03, 2, "Importierte Medikamente werden knapp, wenn die Preise festgelegt sind.");
e("aerzte", "gesundheitsversorgung", 0.05, 3, "Ohne Ärzte keine Versorgung.");
e("aerzte", "p_aerztemangel", -0.1, 0, "Fehlende Ärzte werden zum Problem.");
e("m_hausarzt", "wartezeiten", -0.04, 12, "Hausärzte entlasten die Krankenhäuser.");
e("m_zuzahlungen", "wartezeiten", -0.02, 3, "Weniger Bagatellbesuche.");
e("m_zuzahlungen", "armut", 0.01, 3, "Ärmere verzichten auf Behandlung.");
e("gesundheitsversorgung", "wartezeiten", -0.04, 3, "Mehr Kapazität, kürzere Wartezeiten.");
e("gesundheitsversorgung", "lebenserwartung", 0.02, 12, "Gute Versorgung verlängert das Leben.");
e("medikamente", "gesundheitsversorgung", 0.03, 1, "Ohne Medikamente hilft der beste Arzt wenig.");
e("armut", "lebenserwartung", -0.02, 12, "Armut kostet Lebensjahre.");
e("luftqualitaet", "lebenserwartung", 0.02, 12, "Schlechte Luft macht krank.");

// ---------------------------------------------------------------------------
// Bildung und Fachkräfte

g("bildung", "bildungsqualitaet", "Bildungsqualität", 45, "Was Schülerinnen und Schüler tatsächlich lernen.");
g("bildung", "schulabbruch", "Schulabbruch", 40, "Wer die Schule ohne Abschluss verlässt.");
g("bildung", "hochschule", "Qualität der Hochschulen", 45, "Forschung und Lehre an Universitäten.");
g("bildung", "fachkraefte", "Fachkräfte", 45, "Gut ausgebildete Arbeitskräfte, die im Land bleiben.");
g("bildung", "abwanderung", "Abwanderung von Fachkräften", 55, "Gut Ausgebildete, die ins Ausland gehen.");
g("bildung", "geburtenrate", "Geburtenrate", 45, "Kinder pro Frau, als Index.");

m("bildung", "m_lehrergehaelter", "Lehrergehälter", 45, 0.4, 3, "Bezahlung der Lehrkräfte.");
m("bildung", "m_schulbau", "Schulbau", 45, 0.3, 24, "Neue Schulen und kleinere Klassen.");
m("bildung", "m_religioese_schulen", "Religiöse Schulen (İmam-Hatip)", 55, 0.1, 12, "Anteil staatlicher Schulen mit religiösem Schwerpunkt.");
m("bildung", "m_berufsschulen", "Berufsschulen", 45, 0.2, 12, "Berufliche Bildung mit Betrieben zusammen.");
m("bildung", "m_unigruendungen", "Neue Universitäten", 50, 0.2, 24, "Universitäten in jeder Provinz.");
m("bildung", "m_stipendien", "Stipendien", 35, 0.15, 6, "Unterstützung für Studierende aus ärmeren Familien.");
m("bildung", "m_forschung", "Forschungsförderung", 30, 0.3, 12, "Geld für Forschung und Entwicklung.");
m("bildung", "m_wissenschaftsfreiheit", "Wissenschaftsfreiheit", 40, 0.0, 12, "Unabhängigkeit der Universitäten bei Berufungen und Lehre.");

p("bildung", "p_abwanderung", "Abwanderung von Fachkräften", 55, 60, "Ärzte, Ingenieure und Forscher verlassen das Land.");

e("m_lehrergehaelter", "bildungsqualitaet", 0.03, 12, "Gut bezahlte Lehrer bleiben im Beruf.");
e("m_schulbau", "bildungsqualitaet", 0.03, 24, "Kleinere Klassen, besserer Unterricht.");
e("m_schulbau", "schulabbruch", -0.02, 24, "Eine Schule in der Nähe hält Kinder im Unterricht.");
e("m_religioese_schulen", "religioesitaet", 0.01, 24, "Religiöse Bildung prägt Werte.");
e("m_religioese_schulen", "polarisierung", 0.01, 12, "Über die Schulform wird heftig gestritten.");
e("m_berufsschulen", "fachkraefte", 0.04, 24, "Betriebe finden ausgebildete Leute.");
e("m_berufsschulen", "jugendarbeitslosigkeit", -0.02, 24, "Der Weg in den Beruf wird kürzer.");
e("m_unigruendungen", "hochschule", -0.01, 24, "Viele neue Universitäten verteilen knappe Professoren dünn.");
e("m_unigruendungen", "wachstum_regional", 0.01, 24, "Studierende beleben kleinere Städte.");
e("m_stipendien", "schulabbruch", -0.02, 12, "Ärmere Kinder bleiben länger im Bildungssystem.");
e("m_forschung", "hochschule", 0.04, 24, "Forschungsgeld hält gute Leute.");
e("m_forschung", "produktivitaet", 0.02, 24, "Neue Technik macht produktiver.");
e("m_wissenschaftsfreiheit", "hochschule", 0.04, 12, "Freie Wissenschaft zieht Talente an.");
e("m_wissenschaftsfreiheit", "abwanderung", -0.03, 12, "Wer frei forschen kann, bleibt eher.");
e("bildungsqualitaet", "fachkraefte", 0.04, 12, "Gute Schulen, gute Fachkräfte.");
e("hochschule", "fachkraefte", 0.03, 12, "Starke Universitäten bilden gut aus.");
e("fachkraefte", "produktivitaet", 0.04, 6, "Qualifizierte Arbeit ist produktiver.");
e("abwertung", "abwanderung", 0.03, 3, "Gehälter in Lira verlieren gegenüber dem Ausland.");
e("realeinkommen", "abwanderung", -0.03, 3, "Wer gut verdient, bleibt eher.");
e("pressefreiheit", "abwanderung", -0.02, 12, "Viele gehen auch wegen des politischen Klimas.");
e("polarisierung", "abwanderung", 0.02, 12, "Ein vergiftetes Klima treibt Menschen fort.");
e("abwanderung", "fachkraefte", -0.05, 3, "Wer geht, fehlt.");
e("abwanderung", "aerzte", -0.03, 3, "Auch Ärzte wandern ab.");
e("abwanderung", "p_abwanderung", 0.1, 0, "Anhaltende Abwanderung wird zum Problem.");
e("armut", "schulabbruch", 0.03, 6, "Arme Kinder müssen früher mitverdienen.");
e("schulabbruch", "jugendarbeitslosigkeit", 0.03, 12, "Ohne Abschluss kaum Arbeit.");

// ---------------------------------------------------------------------------
// Infrastruktur und Verkehr

g("infrastruktur", "verkehrsnetz", "Straßen und Autobahnen", 60, "Zustand und Dichte des Straßennetzes.");
g("infrastruktur", "bahnnetz", "Bahnnetz", 35, "Schnellzüge, Güterbahn und Nahverkehr auf der Schiene.");
g("infrastruktur", "stau", "Stau in den Städten", 60, "Wie viel Zeit Menschen im Verkehr verlieren.");
g("infrastruktur", "logistik", "Logistik und Häfen", 55, "Wie schnell Waren ins Land, durchs Land und hinaus kommen.");
g("infrastruktur", "internet", "Breitband und Mobilfunk", 55, "Schnelles Internet in Stadt und Land.");
g("infrastruktur", "wachstum_regional", "Regionale Entwicklung", 50, "Wirtschaftliche Dynamik abseits der großen Zentren.");

m("infrastruktur", "m_autobahnen", "Autobahn- und Brückenbau", 55, 0.5, 36, "Neue Autobahnen, Brücken und Tunnel.");
m("infrastruktur", "m_oepp_garantien", "Garantien für Betreiberprojekte", 50, 0.3, 12, "Der Staat garantiert privaten Betreibern Mindesteinnahmen bei Autobahnen, Flughäfen und Kliniken.");
m("infrastruktur", "m_bahn", "Bahnausbau", 40, 0.5, 48, "Schnellfahrstrecken und Güterbahn.");
m("infrastruktur", "m_nahverkehr", "Nahverkehr", 40, 0.3, 24, "U-Bahnen, Straßenbahnen und Busse in den Städten.");
m("infrastruktur", "m_breitband", "Breitbandausbau", 40, 0.2, 24, "Glasfaser und Mobilfunk bis ins Dorf.");
m("infrastruktur", "m_regionalfoerderung", "Regionalförderung", 45, 0.3, 12, "Zuschüsse für strukturschwache Provinzen.");

e("m_autobahnen", "verkehrsnetz", 0.04, 36, "Neue Straßen, sobald sie fertig sind.");
e("m_autobahnen", "bauwirtschaft", 0.03, 3, "Großbaustellen beschäftigen die Bauwirtschaft.");
e("m_autobahnen", "korruption", 0.01, 12, "Große Aufträge, große Versuchungen.");
e("m_oepp_garantien", "verkehrsnetz", 0.02, 24, "Private Betreiber bauen schneller.");
e("m_oepp_garantien", "zinslast", 0.02, 24, "Garantiezahlungen belasten künftige Haushalte.");
e("m_bahn", "bahnnetz", 0.04, 48, "Neue Strecken, sobald sie fertig sind.");
e("m_bahn", "luftqualitaet", 0.01, 48, "Mehr Güter auf der Schiene, weniger Lastwagen.");
e("m_nahverkehr", "stau", -0.04, 24, "U-Bahnen holen Autos von der Straße.");
e("m_nahverkehr", "luftqualitaet", 0.02, 24, "Weniger Abgase in den Städten.");
e("m_breitband", "internet", 0.05, 24, "Schnelles Netz, wo es vorher keines gab.");
e("m_regionalfoerderung", "wachstum_regional", 0.05, 12, "Förderung zieht Betriebe in schwächere Provinzen.");
e("m_regionalfoerderung", "landflucht", -0.02, 24, "Wer vor Ort Arbeit findet, bleibt.");
e("verkehrsnetz", "logistik", 0.04, 6, "Gute Straßen, schnelle Lieferungen.");
e("bahnnetz", "logistik", 0.03, 6, "Die Bahn bringt Container billig zum Hafen.");
e("logistik", "export", 0.03, 6, "Wer schnell liefert, gewinnt Aufträge.");
e("logistik", "produktivitaet", 0.02, 12, "Weniger Leerlauf in der Lieferkette.");
e("internet", "produktivitaet", 0.02, 12, "Digitale Arbeit braucht schnelles Netz.");
e("internet", "wachstum_regional", 0.02, 12, "Gutes Netz macht auch Kleinstädte attraktiv.");
e("stau", "produktivitaet", -0.02, 6, "Zeit im Stau ist verlorene Zeit.");
e("stau", "luftqualitaet", -0.03, 1, "Stehende Autos verpesten die Luft.");

// ---------------------------------------------------------------------------
// Energie und Umwelt

g("energie", "energiepreise", "Energiepreise", 65, "Strom-, Gas- und Kraftstoffpreise für Haushalte und Betriebe.");
g("energie", "energieimporte", "Abhängigkeit von Energieimporten", 70, "Anteil importierter Energie, vor allem Gas und Öl.");
g("energie", "stromversorgung", "Stromversorgung", 60, "Ob das Netz stabil genug für Industrie und Haushalte ist.");
g("energie", "erneuerbare", "Erneuerbare Energie", 45, "Anteil von Wasser, Wind, Sonne und Erdwärme am Strom.");
g("energie", "luftqualitaet", "Luftqualität", 45, "Wie sauber die Luft in den Städten ist.");
g("energie", "klimaschutz", "Klimaschutz", 35, "Wie stark die Emissionen sinken.");

m("energie", "m_energiesubventionen", "Energiesubventionen", 55, 1.0, 1, "Der Staat deckelt Strom- und Gaspreise und trägt die Differenz.");
m("energie", "m_solar_wind", "Ausbau von Sonne und Wind", 45, 0.2, 24, "Ausschreibungen und Einspeisevergütungen.");
m("energie", "m_kernkraft", "Kernkraft", 50, 0.2, 48, "Weitere Reaktoren neben dem ersten Kraftwerk.");
m("energie", "m_gasfoerderung", "Heimische Gasförderung", 50, 0.2, 24, "Förderung aus Feldern im Schwarzen Meer.");
m("energie", "m_umweltauflagen", "Umweltauflagen", 35, 0.05, 12, "Grenzwerte für Industrie, Kraftwerke und Verkehr.");
m("energie", "m_co2_preis", "CO₂-Preis", 10, -0.2, 12, "Ein Preis für Emissionen, wichtig für den Handel mit der EU.");
m("energie", "m_netzausbau", "Stromnetzausbau", 45, 0.2, 24, "Leitungen, Speicher und Umspannwerke.");

p("energie", "p_stromausfaelle", "Stromausfälle", 30, 60, "Das Netz hält die Last nicht.");
p("energie", "p_luftverschmutzung", "Luftverschmutzung", 50, 60, "Smog in den großen Städten.");

e("abwertung", "energiepreise", 0.05, 1, "Öl und Gas werden in Dollar bezahlt.");
e("m_energiesubventionen", "energiepreise", -0.06, 1, "Gedeckelte Preise, der Staat zahlt den Rest.");
e("m_energiesubventionen", "klimaschutz", -0.01, 12, "Billige Energie wird verschwendet.");
e("energiepreise", "lebenshaltung", 0.05, 1, "Heizen und Tanken belasten jeden Haushalt.");
e("energiepreise", "kostendruck", 0.05, 1, "Energie ist für viele Betriebe der größte Kostenblock.");
e("energiepreise", "armut", 0.02, 2, "Energiearmut: Heizen wird zum Luxus.");
e("m_solar_wind", "erneuerbare", 0.04, 24, "Neue Anlagen gehen ans Netz.");
e("m_kernkraft", "energieimporte", -0.02, 48, "Weniger Gas für Strom.");
e("m_gasfoerderung", "energieimporte", -0.03, 24, "Eigenes Gas ersetzt Importe.");
e("erneuerbare", "energieimporte", -0.04, 6, "Sonne und Wind müssen nicht importiert werden.");
e("erneuerbare", "klimaschutz", 0.04, 6, "Weniger Kohle und Gas im Strommix.");
e("energieimporte", "energiepreise", 0.03, 3, "Wer importiert, zahlt Weltmarktpreise.");
e("m_umweltauflagen", "luftqualitaet", 0.04, 12, "Filter und Grenzwerte wirken.");
e("m_umweltauflagen", "kostendruck", 0.01, 12, "Auflagen kosten die Betriebe Geld.");
e("m_co2_preis", "klimaschutz", 0.05, 12, "Emissionen bekommen einen Preis.");
e("m_co2_preis", "kostendruck", 0.02, 6, "Energieintensive Betriebe zahlen mehr.");
e("m_co2_preis", "export", 0.01, 24, "Die EU erhebt auf Importe ohne CO₂-Preis eine Grenzabgabe.");
e("m_netzausbau", "stromversorgung", 0.05, 24, "Stärkere Netze, weniger Ausfälle.");
e("wachstum", "stromversorgung", -0.02, 3, "Mehr Produktion, mehr Last.");
e("stromversorgung", "p_stromausfaelle", -0.1, 0, "Ein schwaches Netz fällt aus.");
e("p_stromausfaelle", "industrie", -0.04, 0, "Ohne Strom stehen die Maschinen.");
e("luftqualitaet", "p_luftverschmutzung", -0.1, 0, "Schlechte Luft wird zum Problem.");

// ---------------------------------------------------------------------------
// Landwirtschaft und Wasser

g("landwirtschaft", "wasserversorgung", "Wasserversorgung", 55, "Ob Städte und Felder genug sauberes Wasser haben.");
g("landwirtschaft", "duerre", "Trockenheit", 45, "Niederschlagsmangel und sinkende Grundwasserspiegel.");
g("landwirtschaft", "ernte", "Ernten", 55, "Erträge von Getreide, Obst, Gemüse und Baumwolle.");
g("landwirtschaft", "lebensmittelpreise", "Lebensmittelpreise", 65, "Preise für Brot, Gemüse, Fleisch und Milch.");
g("landwirtschaft", "landwirtschaft_einkommen", "Einkommen der Landwirte", 40, "Was Bauern nach Abzug der Kosten bleibt.");
g("landwirtschaft", "landflucht", "Landflucht", 55, "Wie viele Menschen Dörfer und Kleinstädte verlassen.");

m("landwirtschaft", "m_agrarsubventionen", "Agrarsubventionen", 45, 0.4, 6, "Zahlungen je Fläche und Produkt, Zuschüsse für Diesel und Dünger.");
m("landwirtschaft", "m_bewaesserung", "Moderne Bewässerung", 35, 0.2, 24, "Tropfbewässerung statt Überflutung der Felder.");
m("landwirtschaft", "m_staudaemme", "Staudämme und Speicher", 50, 0.3, 48, "Talsperren für Wasser und Strom.");
m("landwirtschaft", "m_wasserleitungen", "Wasserleitungen und Kläranlagen", 40, 0.3, 24, "Trinkwassernetz, weniger Leitungsverluste, Abwasserreinigung.");
m("landwirtschaft", "m_saatgut", "Saatgut- und Erzeugerprogramme", 35, 0.1, 12, "Beratung, Genossenschaften und bessere Sorten.");

// Modernisierungsleiter nach Victoria 3 (Production Methods), Anno 1800 (Traktor)
// und Workers & Resources (Maschinen als Investitionsgut): Stufen von Handarbeit
// über Maschinen zu High-Tech; die Umstellung braucht Zeit und bindet Kapital.
m("landwirtschaft", "m_mechanisierung", "Landwirtschaftliche Mechanisierung", 30, 0.5, 36, "Traktoren, Mähdrescher und Erntemaschinen: von Handarbeit über Maschinen zu High-Tech mit GPS und Drohnen. Höhere Erträge, weniger Arbeitskräfte, Dieselverbrauch und Wartungskosten.");
m("landwirtschaft", "m_agrarforschung", "Agrarforschung und Hochtechnologie", 28, 0.3, 24, "Hochleistungssaat, Präzisionslandwirtschaft, Bodensensorik und Digitalisierung der Betriebe.");
m("wirtschaft", "m_industrie_modernisierung", "Industrielle Modernisierung", 35, 0.6, 36, "Neue Maschinengenerationen und Automation. Die Umstellung dauert; alte Anlagen laufen weiter, Fachkräfte werden gebraucht.");

e("m_mechanisierung", "ernte", 0.05, 6, "Maschinen erhöhen den Ertrag pro Fläche und verkürzen die Erntezeit.");
e("m_mechanisierung", "landwirtschaft_einkommen", 0.04, 12, "Höhere Erträge und weniger Verluste erhöhen das Einkommen der Landwirte.");
e("m_mechanisierung", "lebensmittelpreise", -0.03, 6, "Günstigere Produktion dämpft die Nahrungsmittelpreise.");
e("m_mechanisierung", "landflucht", -0.02, 12, "Rentable Betriebe halten Menschen auf dem Land, doch Maschinen ersetzen auch Arbeitskräfte.");
e("m_mechanisierung", "energieimporte", 0.02, 3, "Diesel und Strom für Maschinen erhöhen den Energiebedarf.");
e("m_agrarforschung", "ernte", 0.04, 12, "Bessere Sorten und Präzisionslandwirtschaft steigern die Erträge.");
e("m_agrarforschung", "wasserversorgung", 0.02, 6, "Tropfbewässerung und Sensorik sparen Wasser.");
e("m_agrarforschung", "landwirtschaft_einkommen", 0.03, 12, "Wissen macht die Betriebe wettbewerbsfähiger.");
e("m_industrie_modernisierung", "produktivitaet", 0.05, 12, "Neue Maschinengenerationen erhöhen die Produktivität der Industrie.");
e("m_industrie_modernisierung", "investitionen", 0.03, 6, "Modernisierung bindet und lockt Kapital.");
e("m_industrie_modernisierung", "arbeitsplaetze_industrie", -0.02, 12, "Automation ersetzt einen Teil der Arbeitsplätze, schafft aber produktivere.");

// Modernisierungsleiter für alle übrigen Themenfelder (dieselbe Logik: Stufen von
// Handarbeit über Maschinen zu High-Tech, Umsetzung braucht Zeit, jede Stufe hat
// ihren Preis — Material aus Victoria 3, Anno 1800 und Workers & Resources).
m("haushalt", "m_verwaltungsdigital", "Digitale Verwaltung und Steuertechnik", 30, 0.2, 24, "E-Rechnung, Datenabgleich, digitale Behördenwege: von Papierakten zu vernetzten Verfahren.");
m("arbeit", "m_fachkraefteprogramm", "Fachkräfte und Weiterbildung", 35, 0.3, 24, "Technikerschulen, Meisterbetriebe, Umschulung: die Stufenleiter braucht Menschen, die sie bedienen.");
m("bildung", "m_bildungstechnik", "Bildungstechnik und digitales Lernen", 30, 0.2, 24, "Geräte, Lernplattformen und Fortbildung der Lehrkräfte.");
m("gesundheit", "m_medizintechnik", "Medizintechnik und Krankenhausmodernisierung", 30, 0.4, 24, "Digitale Diagnostik, moderne Geräte, vernetzte Patientenakten.");
m("infrastruktur", "m_smart_infrastruktur", "Intelligente Infrastruktur", 25, 0.3, 24, "Verkehrsleitsysteme, Sensoren, digitale Netze: mehr Kapazität ohne neue Straßen.");
m("energie", "m_speicher_smartgrid", "Netzmodernisierung und Speicher", 28, 0.35, 24, "Smart Grid, Batteriespeicher, digitale Laststeuerung.");
m("wohnen", "m_bauindustrie", "Industrieller Wohnungsbau", 25, 0.3, 24, "Modulbau und Vorfertigung: Wohnungen in Fabrikqualität, schneller und günstiger.");
m("sicherheit", "m_polizeitechnik", "Moderne Sicherheitsverwaltung", 30, 0.25, 24, "Forensik, digitale Aktenführung, bessere Koordinierung der Behörden.");
m("gesellschaft", "m_digitale_oeffentlichkeit", "Digitale Öffentlichkeit und Beteiligung", 35, 0.15, 12, "Online-Beteiligung, offene Daten, digitale Behördengänge.");
m("aussen", "m_handelssysteme", "Moderne Zoll- und Handelssysteme", 30, 0.2, 24, "Digitale Zollabfertigung, nachvollziehbare Lieferketten, Umsetzung von Handelsabkommen.");

e("m_verwaltungsdigital", "steuereinnahmen", 0.04, 6, "Bessere Erfassung hebt die realen Einnahmen.");
e("m_verwaltungsdigital", "steuermoral", 0.03, 6, "Digitale Verfahren machen Hinterziehen schwieriger.");
e("m_verwaltungsdigital", "schattenwirtschaft", -0.03, 12, "Digitale Zahlungen verkleinern den grauen Markt.");
e("m_fachkraefteprogramm", "fachkraefte", 0.04, 12, "Weiterbildung und Technikerschulen erhöhen den Fachkräftebestand.");
e("m_fachkraefteprogramm", "produktivitaet", 0.04, 12, "Gut ausgebildete Fachkräfte machen Betriebe produktiver.");
e("m_fachkraefteprogramm", "arbeitsplaetze_industrie", 0.03, 12, "Qualifizierte Arbeitskräfte ziehen bessere Industrie an.");
e("m_fachkraefteprogramm", "jugendarbeitslosigkeit", -0.03, 6, "Ausbildungsplätze halten Jugendliche im Erwerbsleben.");
e("m_fachkraefteprogramm", "abwanderung", -0.03, 12, "Perspektiven im Land halten Fachkräfte vom Auswandern ab.");
e("m_bildungstechnik", "bildungsqualitaet", 0.04, 12, "Gute Werkzeuge und geschulte Lehrkräfte heben den Unterricht.");
e("m_bildungstechnik", "hochschule", 0.03, 12, "Digitale Ausstattung stärkt Forschung und Lehre.");
e("m_bildungstechnik", "schulabbruch", -0.02, 6, "Individuelle Förderung fängt schwache Schüler auf.");
e("m_bildungstechnik", "fachkraefte", 0.02, 12, "Bessere Bildung liefert den Nachwuchs für die Modernisierung.");
e("m_medizintechnik", "gesundheitsversorgung", 0.05, 6, "Moderne Geräte verbessern die Versorgung spürbar.");
e("m_medizintechnik", "wartezeiten", -0.04, 6, "Digitale Abläufe verkürzen die Wartezeiten.");
e("m_medizintechnik", "medikamente", 0.02, 6, "Vernetzte Lieferketten sichern die Arzneimittelversorgung.");
e("m_medizintechnik", "lebenserwartung", 0.01, 24, "Bessere Diagnostik rettet Leben — langsam und wenig sichtbar.");
e("m_smart_infrastruktur", "stau", -0.04, 6, "Leitsysteme verteilen den Verkehr besser.");
e("m_smart_infrastruktur", "logistik", 0.04, 6, "Vernetzte Häfen und Terminals beschleunigen den Warenfluss.");
e("m_smart_infrastruktur", "internet", 0.03, 6, "Der Ausbau der Netze geht Hand in Hand.");
e("m_smart_infrastruktur", "verkehrsnetz", 0.02, 12, "Kapazitätsreserven heben die Auslastung der Straßen.");
e("m_speicher_smartgrid", "stromversorgung", 0.05, 6, "Speicher und Laststeuerung stabilisieren das Netz.");
e("m_speicher_smartgrid", "erneuerbare", 0.04, 6, "Ohne Speicher bleibt Wind und Sonne ungenutzt.");
e("m_speicher_smartgrid", "energiepreise", -0.03, 12, "Effiziente Netze senken die Erzeugungskosten.");
e("m_speicher_smartgrid", "energieimporte", -0.02, 12, "Mehr eigene Erneuerbare ersetzen importiertes Gas und Öl.");
e("m_bauindustrie", "wohnungsbau", 0.05, 6, "Vorfertigung beschleunigt den Bau spürbar.");
e("m_bauindustrie", "mieten", -0.04, 12, "Mehr Wohnungen zu günstigeren Kosten dämpfen die Mieten.");
e("m_bauindustrie", "bauwirtschaft", 0.03, 6, "Die Bauwirtschaft wächst mit der Serie.");
e("m_bauindustrie", "bauqualitaet", 0.02, 6, "Werkshallen und Standards sichern die Qualität.");
e("m_polizeitechnik", "kriminalitaet", -0.04, 6, "Bessere Aufklärung wirkt abschreckend.");
e("m_polizeitechnik", "justizvertrauen", 0.03, 12, "Schnelle, nachvollziehbare Verfahren stärken das Vertrauen.");
e("m_polizeitechnik", "rechtssicherheit", 0.02, 12, "Digitale Akten und klare Zuständigkeiten erhöhen die Rechtssicherheit.");
e("m_digitale_oeffentlichkeit", "zivilgesellschaft", 0.03, 6, "Digitale Beteiligung erleichtert Vereins- und Bürgerarbeit.");
e("m_digitale_oeffentlichkeit", "vertrauen_regierung", 0.02, 6, "Transparente Verfahren wirken dem Misstrauen entgegen.");
e("m_digitale_oeffentlichkeit", "polarisierung", 0.02, 12, "Digitale Räume spalten auch: mehr Öffentlichkeit bedeutet mehr Streit.");
e("m_handelssysteme", "export", 0.04, 12, "Schnelle Zölle und nachvollziehbare Lieferketten stärken die Ausfuhr.");
e("m_handelssysteme", "logistik", 0.03, 6, "Digitale Abfertigung beschleunigt die Häfen.");
e("m_handelssysteme", "tourismus", 0.02, 6, "Reibungslose Einreise und Abfertigung erleichtern den Tourismus.");
e("m_handelssysteme", "ansehen", 0.02, 12, "Ein verlässlicher Handelspartner genießt Ansehen.");

p("landwirtschaft", "p_wassermangel", "Wassermangel", 40, 60, "Die Wasserversorgung wird schlechter; in manchen Städten wird Wasser rationiert.");
p("landwirtschaft", "p_landflucht", "Verödung ländlicher Regionen", 45, 60, "Dörfer leeren sich, Schulen und Praxen schließen.");

e("duerre", "wasserversorgung", -0.05, 1, "Ohne Regen leeren sich die Speicher.");
e("duerre", "ernte", -0.06, 2, "Trockenheit vernichtet Ernten.");
e("m_bewaesserung", "wasserversorgung", 0.03, 24, "Effiziente Bewässerung spart viel Wasser.");
e("m_bewaesserung", "ernte", 0.03, 24, "Gleichmäßige Bewässerung, stabilere Erträge.");
e("m_staudaemme", "wasserversorgung", 0.04, 48, "Speicher überbrücken trockene Sommer.");
e("m_staudaemme", "erneuerbare", 0.02, 48, "Wasserkraft liefert Strom.");
e("m_staudaemme", "polarisierung", 0.01, 12, "Umsiedlungen und überflutete Kulturstätten sind umstritten.");
e("m_wasserleitungen", "wasserversorgung", 0.05, 24, "Weniger Verluste im Netz, sauberes Wasser in den Städten.");
e("wasserversorgung", "p_wassermangel", -0.1, 0, "Wo das Wasser knapp wird, wird es zum Problem.");
e("wasserversorgung", "ernte", 0.03, 3, "Felder brauchen Wasser.");
e("m_agrarsubventionen", "landwirtschaft_einkommen", 0.05, 6, "Direkte Zahlungen stützen die Höfe.");
e("m_agrarsubventionen", "ernte", 0.02, 12, "Günstiger Dünger und Diesel erhöhen die Erträge.");
e("m_saatgut", "ernte", 0.03, 12, "Bessere Sorten und Beratung.");
e("ernte", "lebensmittelpreise", -0.05, 2, "Gute Ernten drücken die Preise.");
e("abwertung", "lebensmittelpreise", 0.03, 2, "Futter, Dünger und Diesel werden importiert.");
e("energiepreise", "lebensmittelpreise", 0.03, 2, "Traktoren, Kühlhäuser und Transport brauchen Energie.");
e("lebensmittelpreise", "lebenshaltung", 0.06, 0, "Lebensmittel sind der größte Posten im Einkaufskorb.");
e("lebensmittelpreise", "kostendruck", 0.02, 1, "Auch Kantinen und Restaurants zahlen mehr.");
e("lebensmittelpreise", "landwirtschaft_einkommen", 0.03, 1, "Höhere Preise, höhere Erlöse, wenn die Kosten nicht mitsteigen.");
e("ernte", "landwirtschaft_einkommen", 0.04, 1, "Gute Ernte, gutes Jahr.");
e("landwirtschaft_einkommen", "landflucht", -0.04, 6, "Wer von der Landwirtschaft leben kann, bleibt.");
e("landflucht", "p_landflucht", 0.1, 0, "Anhaltende Abwanderung leert Dörfer.");
e("landflucht", "mieten", 0.02, 6, "Wer in die Stadt zieht, braucht eine Wohnung.");
e("landflucht", "stau", 0.01, 12, "Die Städte wachsen.");
e("wachstum_regional", "landflucht", -0.04, 6, "Arbeit vor Ort hält die Menschen.");

// ---------------------------------------------------------------------------
// Wohnen, Bau und Erdbeben

g("wohnen", "mieten", "Mieten", 70, "Mieten in den Städten im Verhältnis zum Einkommen.");
g("wohnen", "wohnungsbau", "Wohnungsbau", 50, "Wie viele Wohnungen fertig werden.");
g("wohnen", "bauwirtschaft", "Bauwirtschaft", 50, "Aufträge und Beschäftigung am Bau.");
g("wohnen", "bauqualitaet", "Bauqualität", 45, "Ob Gebäude nach Vorschrift gebaut sind.");
g("wohnen", "erdbebenvorsorge", "Erdbebenvorsorge", 40, "Wie viele Gebäude erdbebensicher sind und wie gut der Katastrophenschutz vorbereitet ist.");

m("wohnen", "m_sozialwohnungen", "Staatlicher Wohnungsbau", 50, 0.4, 24, "Wohnungen der staatlichen Wohnungsbaubehörde, günstig verkauft oder vermietet.");
m("wohnen", "m_mietdeckel", "Mietpreisbremse", 30, 0.0, 1, "Obergrenze für Mieterhöhungen.");
m("wohnen", "m_stadterneuerung", "Erdbebensichere Stadterneuerung", 40, 0.5, 36, "Abriss und Neubau gefährdeter Häuser.");
m("wohnen", "m_bauaufsicht", "Bauaufsicht", 40, 0.05, 12, "Unabhängige Prüfung von Statik und Material.");
m("wohnen", "m_baukredite", "Günstige Baukredite", 35, 0.3, 3, "Zinsverbilligte Kredite für Wohnungskäufer.");
m("wohnen", "m_bauamnestie", "Bauamnestie", 15, -0.1, 2, "Nachträgliche Legalisierung illegaler Bauten gegen Gebühr.");

p("wohnen", "p_wohnungsnot", "Wohnungsnot", 55, 60, "Mieten fressen die Einkommen, junge Familien finden keine Wohnung.");
p("wohnen", "p_erdbebengefahr", "Erdbebengefahr", 55, 60, "Viele Gebäude würden ein starkes Beben nicht überstehen.");

e("m_sozialwohnungen", "wohnungsbau", 0.05, 24, "Der Staat baut selbst.");
e("m_sozialwohnungen", "bauwirtschaft", 0.03, 6, "Aufträge für Baufirmen.");
e("m_sozialwohnungen", "korruption", 0.01, 12, "Vergaben an nahestehende Baufirmen sind ein bekanntes Risiko.");
e("m_mietdeckel", "mieten", -0.05, 1, "Bestehende Mieten steigen langsamer.");
e("m_mietdeckel", "wohnungsbau", -0.03, 12, "Vermieten lohnt weniger, weniger wird gebaut.");
e("m_mietdeckel", "polarisierung", 0.01, 6, "Streit zwischen Mietern und Vermietern.");
e("m_stadterneuerung", "erdbebenvorsorge", 0.05, 36, "Gefährdete Häuser werden ersetzt.");
e("m_stadterneuerung", "bauwirtschaft", 0.04, 6, "Großes Bauprogramm.");
e("m_stadterneuerung", "mieten", 0.02, 12, "Während des Umbaus fehlen Wohnungen.");
e("m_bauaufsicht", "bauqualitaet", 0.05, 12, "Wer geprüft wird, baut sauber.");
e("m_bauaufsicht", "wohnungsbau", -0.01, 6, "Prüfungen kosten Zeit.");
e("m_bauaufsicht", "korruption", -0.02, 12, "Unabhängige Prüfer sind schwerer zu bestechen.");
e("m_bauamnestie", "bauqualitaet", -0.05, 6, "Unsichere Bauten werden legalisiert statt ertüchtigt.");
e("m_bauamnestie", "steuereinnahmen", 0.02, 2, "Gebühren bringen schnelles Geld.");
e("m_baukredite", "wohnungsbau", 0.04, 6, "Mehr Käufer, mehr Neubau.");
e("m_baukredite", "mieten", -0.02, 12, "Wer kauft, mietet nicht.");
e("leitzins", "wohnungsbau", -0.04, 6, "Hohe Zinsen machen Baukredite teuer.");
e("wohnungsbau", "mieten", -0.04, 6, "Mehr Wohnungen, weniger Druck auf die Mieten.");
e("wohnungsbau", "bauwirtschaft", 0.04, 1, "Neubau ist Bauwirtschaft.");
e("bauwirtschaft", "arbeitsplaetze_industrie", 0.02, 3, "Der Bau beschäftigt viele Menschen.");
e("inflation", "mieten", 0.04, 1, "Vermieter gleichen die Inflation aus.");
e("mieten", "lebenshaltung", 0.05, 0, "Die Miete ist der größte Fixposten.");
e("mieten", "p_wohnungsnot", 0.1, 0, "Unbezahlbare Mieten werden zur Wohnungsnot.");
e("bauqualitaet", "erdbebenvorsorge", 0.03, 12, "Gut gebaute Häuser halten Beben stand.");
e("korruption", "bauqualitaet", -0.03, 6, "Wo geschmiert wird, wird gepfuscht.");
e("erdbebenvorsorge", "p_erdbebengefahr", -0.1, 0, "Wenig Vorsorge heißt große Gefahr.");

// ---------------------------------------------------------------------------
// Sicherheit, Justiz und Rechtsstaat

g("sicherheit", "kriminalitaet", "Kriminalität", 45, "Diebstahl, Gewalt, organisierte Kriminalität.");
g("sicherheit", "terrorgefahr", "Terrorgefahr", 40, "Gefahr von Anschlägen.");
g("sicherheit", "justizvertrauen", "Vertrauen in die Justiz", 35, "Ob Menschen glauben, vor Gericht fair behandelt zu werden.");
g("sicherheit", "korruption", "Korruption", 55, "Bestechung, Vetternwirtschaft und manipulierte Vergaben.");
g("sicherheit", "rechtssicherheit", "Rechtssicherheit", 40, "Ob Regeln für alle gleich gelten und vorhersehbar sind.");
g("sicherheit", "militaer", "Einsatzbereitschaft der Streitkräfte", 60, "Ausrüstung, Ausbildung und Moral der Armee.");

m("sicherheit", "m_polizei", "Polizei und Gendarmerie", 60, 0.3, 6, "Personal und Ausstattung der Sicherheitskräfte.");
m("recht", "m_justizreform", "Justizreform", 35, 0.1, 18, "Reformpaket der Gerichtsverfassung: Verfahrensrecht, Ausbildung, Gerichtsstruktur. Richterstellen und Richterrat sind eigene Stellschrauben.");
m("recht", "m_antikorruption", "Korruptionsbekämpfung", 35, 0.05, 12, "Unabhängige Ermittler, offene Vergaben, Vermögenserklärungen.");
m("sicherheit", "m_friedensprozess", "Friedensprozess", 55, 0.1, 12, "Politische Lösung mit Waffenabgabe und Wiedereingliederung.");
m("militaer", "m_verteidigung", "Verteidigungsausgaben", 55, 1.0, 12, "Budget für Streitkräfte und Rüstungsindustrie.");
m("militaer", "m_ruestungsindustrie", "Heimische Rüstungsindustrie", 60, 0.3, 24, "Drohnen, Panzer, Schiffe aus eigener Produktion.");

p("sicherheit", "p_korruption", "Korruptionsskandale", 45, 60, "Vergaben und Ämter werden gekauft; die Presse berichtet.");
p("sicherheit", "p_kriminalitaet", "Unsicherheit auf den Straßen", 35, 60, "Menschen fühlen sich nachts nicht mehr sicher.");

e("m_polizei", "kriminalitaet", -0.04, 6, "Mehr Streifen, weniger Straftaten.");
e("m_polizei", "terrorgefahr", -0.02, 6, "Mehr Ermittler, mehr vereitelte Anschläge.");
e("armut", "kriminalitaet", 0.03, 6, "Not treibt manche in die Kriminalität.");
e("jugendarbeitslosigkeit", "kriminalitaet", 0.02, 6, "Junge ohne Perspektive sind anfälliger.");
e("m_justizreform", "justizvertrauen", 0.04, 18, "Faire und schnelle Verfahren schaffen Vertrauen.");
e("m_justizreform", "rechtssicherheit", 0.04, 18, "Vorhersehbare Urteile.");
e("m_antikorruption", "korruption", -0.05, 12, "Wer erwischt wird, zahlt einen Preis.");
e("m_antikorruption", "p_korruption", 0.03, 3, "Ermittlungen bringen erst einmal Skandale ans Licht.");
e("korruption", "p_korruption", 0.1, 0, "Verbreitete Korruption fliegt irgendwann auf.");
e("korruption", "auslandskapital", -0.03, 6, "Investoren meiden Länder, in denen man zahlen muss.");
e("korruption", "justizvertrauen", -0.03, 6, "Wer Korruption sieht, verliert Vertrauen.");
e("rechtssicherheit", "auslandskapital", 0.04, 6, "Investoren brauchen verlässliche Regeln.");
e("rechtssicherheit", "investitionen", 0.02, 6, "Auch heimische Firmen investieren nur, wenn sie ihrem Recht vertrauen.");
e("justizvertrauen", "rechtssicherheit", 0.03, 6, "Eine vertrauenswürdige Justiz macht Regeln verlässlich.");
e("m_friedensprozess", "terrorgefahr", -0.04, 12, "Wer die Waffen niederlegt, verübt keine Anschläge.");
e("m_friedensprozess", "polarisierung", 0.02, 3, "Über den Prozess wird heftig gestritten.");
e("m_friedensprozess", "wachstum_regional", 0.02, 24, "Frieden bringt Investitionen in den Südosten.");
e("terrorgefahr", "tourismus", -0.04, 1, "Anschläge vertreiben Gäste.");
e("terrorgefahr", "investitionen", -0.02, 3, "Unsicherheit bremst Investitionen.");
e("m_verteidigung", "militaer", 0.04, 12, "Mehr Geld, bessere Ausrüstung.");
e("m_ruestungsindustrie", "militaer", 0.02, 24, "Eigene Waffen, weniger Abhängigkeit.");
e("m_ruestungsindustrie", "industrie", 0.02, 24, "Rüstungsbetriebe sind Hochtechnologie.");
e("m_ruestungsindustrie", "export", 0.01, 24, "Drohnen und Schiffe werden exportiert.");
e("kriminalitaet", "p_kriminalitaet", 0.1, 0, "Steigende Kriminalität wird spürbar.");

// ---------------------------------------------------------------------------
// Medien und Gesellschaft

g("gesellschaft", "pressefreiheit", "Pressefreiheit", 30, "Ob Journalisten frei berichten können.");
g("gesellschaft", "polarisierung", "Polarisierung", 70, "Wie tief die politischen Gräben sind.");
g("gesellschaft", "vertrauen_regierung", "Vertrauen in die Regierung", 45, "Ob die Menschen der Regierung glauben.");
g("gesellschaft", "religioesitaet", "Religiöse Prägung", 60, "Wie stark religiöse Werte den Alltag prägen.");
g("gesellschaft", "frauenrechte", "Gleichstellung", 40, "Rechte und Schutz von Frauen im Alltag.");
g("gesellschaft", "zivilgesellschaft", "Zivilgesellschaft", 40, "Vereine, Stiftungen und Initiativen, die sich einmischen.");

m("gesellschaft", "m_medienaufsicht", "Medienaufsicht", 65, 0.0, 3, "Strafen und Sendeverbote durch die Rundfunkaufsicht.");
m("gesellschaft", "m_internetsperren", "Internetsperren", 60, 0.0, 1, "Sperren von Seiten und Beiträgen, Drosselung sozialer Medien.");
m("gesellschaft", "m_staatsmedien", "Staatliche Medien und Werbung", 60, 0.1, 3, "Budget für Staatssender und staatliche Anzeigen.");
m("gesellschaft", "m_religionsbehoerde", "Budget der Religionsbehörde", 60, 0.2, 6, "Moscheen, Imame, religiöse Bildung.");
m("gesellschaft", "m_gewaltschutz", "Schutz vor Gewalt gegen Frauen", 35, 0.05, 12, "Frauenhäuser, Schutzanordnungen, Schulungen für Polizei.");
m("gesellschaft", "m_versammlungsfreiheit", "Versammlungsfreiheit", 35, 0.0, 3, "Wie frei Demonstrationen stattfinden dürfen.");

p("gesellschaft", "p_polarisierung", "Tiefe Spaltung", 65, 70, "Die Lager reden nicht mehr miteinander.");

e("m_medienaufsicht", "pressefreiheit", -0.05, 3, "Strafen schüchtern Redaktionen ein.");
e("m_internetsperren", "pressefreiheit", -0.04, 1, "Wer nicht lesen kann, erfährt nichts.");
e("m_internetsperren", "internet", -0.01, 1, "Gesperrte Dienste bremsen auch Firmen.");
e("m_staatsmedien", "vertrauen_regierung", 0.02, 3, "Freundliche Berichterstattung stützt die Regierung, bei einem Teil der Menschen.");
e("m_staatsmedien", "polarisierung", 0.02, 6, "Die anderen fühlen sich übergangen.");
e("pressefreiheit", "korruption", -0.03, 12, "Wo recherchiert wird, wird weniger geschmiert.");
e("pressefreiheit", "rechtssicherheit", 0.02, 12, "Öffentliche Kontrolle diszipliniert Behörden.");
e("pressefreiheit", "auslandskapital", 0.01, 12, "Investoren lesen auch die Berichte über Pressefreiheit.");
e("m_religionsbehoerde", "religioesitaet", 0.01, 24, "Mehr religiöse Angebote.");
e("m_gewaltschutz", "frauenrechte", 0.05, 12, "Schutz wirkt, wenn er durchgesetzt wird.");
e("frauenrechte", "frauenerwerb", 0.03, 12, "Wer sicher und gleichberechtigt ist, arbeitet eher.");
e("m_versammlungsfreiheit", "zivilgesellschaft", 0.04, 6, "Wer demonstrieren darf, organisiert sich.");
e("m_versammlungsfreiheit", "polarisierung", -0.01, 12, "Protest hat ein Ventil.");
e("zivilgesellschaft", "korruption", -0.02, 12, "Initiativen decken Missstände auf.");
e("lebenshaltung", "vertrauen_regierung", -0.04, 1, "Wem das Geld nicht reicht, der gibt der Regierung die Schuld.");
e("korruption", "vertrauen_regierung", -0.02, 3, "Skandale beschädigen das Vertrauen.");
e("polarisierung", "p_polarisierung", 0.1, 0, "Die Gräben werden unüberbrückbar.");
e("polarisierung", "vertrauen_regierung", -0.01, 3, "Die andere Hälfte vertraut grundsätzlich nicht.");

// ---------------------------------------------------------------------------
// Außenpolitik und Migration

g("aussen", "gefluechtete", "Geflüchtete im Land", 60, "Zahl der Geflüchteten, vor allem aus Syrien.");
g("aussen", "beziehungen_eu", "Beziehungen zur EU", 40, "Handel, Visafragen, Beitrittsprozess.");
g("aussen", "beziehungen_usa", "Beziehungen zu den USA", 45, "Bündnis, Rüstung, Sanktionen.");
g("aussen", "beziehungen_russland", "Beziehungen zu Russland", 55, "Energie, Tourismus, Rüstung.");
g("aussen", "beziehungen_nahost", "Beziehungen zu den Nachbarn im Nahen Osten", 45, "Syrien, Irak, Iran, Israel, Golfstaaten.");
g("aussen", "ansehen", "Internationales Ansehen", 45, "Wie das Land im Ausland wahrgenommen wird.");

m("aussen", "m_rueckkehr", "Rückkehrprogramm für Geflüchtete", 40, 0.1, 12, "Anreize und Abkommen für die Rückkehr nach Syrien.");
m("aussen", "m_integration", "Integration von Geflüchteten", 35, 0.2, 12, "Sprachkurse, Arbeitserlaubnisse, Schulplätze.");
m("aussen", "m_grenzschutz", "Grenzschutz", 60, 0.2, 12, "Mauern, Personal und Technik an den Grenzen.");
m("aussen", "m_eu_annaeherung", "Annäherung an die EU", 35, 0.0, 12, "Reformen für Visafreiheit und Zollunion.");

p("aussen", "p_migrationsdruck", "Spannungen um Migration", 55, 60, "Unmut über Geflüchtete, Konflikte in Stadtvierteln.");

e("m_rueckkehr", "gefluechtete", -0.03, 12, "Ein Teil kehrt zurück, wenn es sicher ist.");
e("m_integration", "informelle_arbeit", -0.02, 12, "Mit Arbeitserlaubnis arbeiten Geflüchtete offiziell.");
e("m_integration", "p_migrationsdruck", -0.03, 12, "Wer integriert ist, fällt weniger auf.");
e("m_grenzschutz", "gefluechtete", -0.01, 12, "Weniger neue Ankünfte.");
e("m_grenzschutz", "beziehungen_eu", 0.01, 6, "Die EU schätzt Grenzschutz, sie zahlt dafür.");
e("gefluechtete", "informelle_arbeit", 0.02, 6, "Viele Geflüchtete arbeiten ohne Vertrag.");
e("gefluechtete", "mieten", 0.01, 6, "Mehr Nachfrage nach billigen Wohnungen.");
e("gefluechtete", "p_migrationsdruck", 0.06, 0, "Viele Geflüchtete, viel Streit.");
e("arbeitslosigkeit", "p_migrationsdruck", 0.03, 1, "In schlechten Zeiten sucht man Schuldige.");
e("m_eu_annaeherung", "beziehungen_eu", 0.05, 12, "Reformen öffnen Türen in Brüssel.");
e("m_eu_annaeherung", "rechtssicherheit", 0.02, 24, "EU-Standards verlangen verlässliche Regeln.");
e("pressefreiheit", "beziehungen_eu", 0.02, 6, "Die EU achtet auf Pressefreiheit.");
e("beziehungen_eu", "export", 0.03, 12, "Die EU ist der wichtigste Absatzmarkt.");
e("beziehungen_eu", "auslandskapital", 0.03, 6, "Gute Beziehungen beruhigen Investoren.");
e("beziehungen_usa", "auslandskapital", 0.02, 6, "Sanktionsrisiken schrecken Anleger ab.");
e("beziehungen_usa", "militaer", 0.02, 24, "Ersatzteile und Rüstungsgüter aus den USA.");
e("beziehungen_russland", "energiepreise", -0.02, 6, "Gute Beziehungen, günstigeres Gas.");
e("beziehungen_russland", "tourismus", 0.02, 6, "Russische Gäste sind eine große Gruppe.");
e("beziehungen_nahost", "export", 0.02, 12, "Irak und Golfstaaten sind wichtige Märkte.");
e("beziehungen_nahost", "terrorgefahr", -0.02, 12, "Zusammenarbeit an den Grenzen.");
e("ansehen", "tourismus", 0.02, 6, "Ein gutes Bild zieht Gäste an.");
e("pressefreiheit", "ansehen", 0.02, 6, "Das Ausland schaut auf die Pressefreiheit.");

// ---------------------------------------------------------------------------
// Wählergruppen: Zufriedenheit 0–100

grp("rentner", "Rentnerinnen und Rentner", "Leben von Renten; spüren Teuerung und Gesundheitsversorgung.");
grp("arbeitnehmer", "Beschäftigte", "Angestellte und Arbeiter; achten auf Löhne, Jobs und Preise.");
grp("unternehmer", "Unternehmer und Selbständige", "Achten auf Kredite, Steuern, Kosten und verlässliche Regeln.");
grp("landwirte", "Landwirte", "Achten auf Erträge, Preise, Wasser und Subventionen.");
grp("junge", "Junge Erwachsene", "Achten auf Jobs, Wohnungen, Bildung und Freiheit.");
grp("beamte", "Staatsbedienstete", "Achten auf Gehälter und die Lage des Staates.");
grp("konservative", "Religiös-Konservative", "Achten auf Werte, Familie, Stabilität und Sicherheit.");
grp("staedtische_saekulare", "Säkulare Städter", "Achten auf Freiheit, Rechtsstaat, Bildung und Wirtschaft.");

e("rentenniveau", "rentner", 0.08, 0, "Die Rente ist ihr Einkommen.");
e("lebenshaltung", "rentner", -0.06, 0, "Jede Preiserhöhung trifft sie direkt.");
e("gesundheitsversorgung", "rentner", 0.03, 3, "Ältere brauchen Ärzte.");
e("m_fruehrente", "rentner", 0.03, 1, "Wer früher in Rente darf, ist dankbar.");
e("realeinkommen", "arbeitnehmer", 0.07, 0, "Was am Monatsende bleibt, zählt.");
e("arbeitslosigkeit", "arbeitnehmer", -0.02, 0, "Angst um den Arbeitsplatz.");
e("lebenshaltung", "arbeitnehmer", -0.04, 0, "Teures Leben frisst den Lohn.");
e("m_mindestlohn", "arbeitnehmer", 0.03, 0, "Jede Erhöhung wird gefeiert.");
e("kredite", "unternehmer", 0.04, 1, "Ohne Kredit kein Geschäft.");
e("kostendruck", "unternehmer", -0.05, 0, "Steigende Kosten fressen die Marge.");
e("rechtssicherheit", "unternehmer", 0.03, 3, "Sie brauchen verlässliche Regeln.");
e("m_koerperschaftsteuer", "unternehmer", -0.03, 1, "Niemand zahlt gern mehr Steuern.");
e("mittelstand", "unternehmer", 0.04, 1, "Geht es den Betrieben gut, sind die Inhaber zufrieden.");
e("landwirtschaft_einkommen", "landwirte", 0.08, 0, "Das Einkommen vom Hof.");
e("wasserversorgung", "landwirte", 0.03, 0, "Ohne Wasser keine Ernte.");
e("m_agrarsubventionen", "landwirte", 0.03, 0, "Subventionen sind für viele überlebenswichtig.");
e("jugendarbeitslosigkeit", "junge", -0.05, 0, "Keine Arbeit, keine Zukunft.");
e("mieten", "junge", -0.04, 0, "Die eigene Wohnung ist unerreichbar.");
e("pressefreiheit", "junge", 0.02, 3, "Viele Junge wollen frei im Netz reden.");
e("m_internetsperren", "junge", -0.03, 0, "Gesperrte Plattformen ärgern vor allem Junge.");
e("bildungsqualitaet", "junge", 0.02, 6, "Gute Bildung, gute Chancen.");
e("m_aerztegehalt", "beamte", 0.02, 0, "Auch Staatsbedienstete profitieren von Gehaltsrunden.");
e("m_lehrergehaelter", "beamte", 0.03, 0, "Lehrkräfte sind die größte Gruppe im Staatsdienst.");
e("inflation", "beamte", -0.04, 0, "Feste Gehälter verlieren an Wert.");
e("religioesitaet", "konservative", 0.02, 6, "Religiöse Werte im Alltag.");
e("m_religionsbehoerde", "konservative", 0.02, 3, "Moscheen und religiöse Bildung.");
e("m_religioese_schulen", "konservative", 0.02, 6, "Religiöse Schulen sind ihnen wichtig.");
e("kriminalitaet", "konservative", -0.02, 0, "Sicherheit und Ordnung.");
e("terrorgefahr", "konservative", -0.02, 0, "Sicherheit vor allem.");
e("lebenshaltung", "konservative", -0.03, 0, "Auch sie zahlen die Preise.");
e("pressefreiheit", "staedtische_saekulare", 0.04, 0, "Freiheit ist ihnen wichtig.");
e("rechtssicherheit", "staedtische_saekulare", 0.03, 0, "Rechtsstaat ist ihnen wichtig.");
e("m_religioese_schulen", "staedtische_saekulare", -0.02, 6, "Sie wollen weltliche Schulen.");
e("m_internetsperren", "staedtische_saekulare", -0.03, 0, "Sie ärgern sich über Sperren.");
e("frauenrechte", "staedtische_saekulare", 0.02, 0, "Gleichstellung ist ihnen wichtig.");
e("lebenshaltung", "staedtische_saekulare", -0.03, 0, "Die Städte sind besonders teuer.");

// ---------------------------------------------------------------------------
// Akute Probleme haben Folgen: für Gruppen, Vertrauen und andere Größen

e("p_armut", "vertrauen_regierung", -0.03, 1, "Wer nicht über den Monat kommt, macht die Regierung verantwortlich.");
e("p_armut", "kriminalitaet", 0.02, 6, "Not treibt manche in die Kriminalität.");
e("p_jugendarbeitslosigkeit", "junge", -0.04, 0, "Eine Generation ohne Perspektive ist wütend.");
e("p_jugendarbeitslosigkeit", "abwanderung", 0.02, 6, "Wer hier keine Zukunft sieht, geht.");
e("p_streiks", "vertrauen_regierung", -0.01, 1, "Streiks zeigen, dass die Regierung die Lage nicht im Griff hat.");
e("p_aerztemangel", "rentner", -0.03, 1, "Ältere spüren fehlende Ärzte zuerst.");
e("p_aerztemangel", "wartezeiten", 0.04, 1, "Weniger Ärzte, längere Wartezeiten.");
e("p_abwanderung", "produktivitaet", -0.01, 6, "Mit den Besten geht Wissen verloren.");
e("p_abwanderung", "staedtische_saekulare", -0.02, 1, "Viele kennen jemanden, der gegangen ist.");
e("p_stromausfaelle", "vertrauen_regierung", -0.03, 0, "Ohne Strom kippt die Stimmung schnell.");
e("p_luftverschmutzung", "lebenserwartung", -0.01, 12, "Smog macht krank.");
e("p_luftverschmutzung", "staedtische_saekulare", -0.02, 1, "Städter leiden unter der Luft.");
e("p_wassermangel", "landwirte", -0.04, 0, "Ohne Wasser verdorrt die Ernte.");
e("p_wassermangel", "vertrauen_regierung", -0.03, 1, "Wenn das Wasser rationiert wird, fragt jeder nach dem Staat.");
e("p_wassermangel", "landflucht", 0.02, 6, "Wo das Wasser fehlt, ziehen Menschen weg.");
e("p_landflucht", "landwirte", -0.02, 1, "Wenn das Dorf stirbt, stirbt auch der Hof.");
e("p_wohnungsnot", "junge", -0.04, 0, "Junge finden keine eigene Wohnung.");
e("p_wohnungsnot", "vertrauen_regierung", -0.02, 1, "Unbezahlbares Wohnen wird zum Wahlkampfthema.");
e("p_erdbebengefahr", "vertrauen_regierung", -0.01, 12, "Nach jedem kleineren Beben fragen die Menschen, ob ihr Haus hält.");
e("p_korruption", "vertrauen_regierung", -0.04, 0, "Skandale beschädigen das Vertrauen.");
e("p_korruption", "auslandskapital", -0.02, 3, "Investoren meiden Skandale.");
e("p_kriminalitaet", "konservative", -0.02, 0, "Unsicherheit ärgert die, die Ordnung wollen.");
e("p_kriminalitaet", "tourismus", -0.01, 3, "Gäste meiden unsichere Orte.");
e("p_polarisierung", "vertrauen_regierung", -0.02, 1, "In einem gespaltenen Land vertraut die Hälfte grundsätzlich nicht.");
e("p_polarisierung", "investitionen", -0.01, 6, "Politische Unsicherheit bremst Investitionen.");
e("p_migrationsdruck", "polarisierung", 0.02, 3, "Migration wird zum Streitthema.");
e("p_migrationsdruck", "vertrauen_regierung", -0.02, 1, "Viele werfen der Regierung Untätigkeit vor.");

// ---------------------------------------------------------------------------
// Politische Folgen: Was eine Maßnahme außer ihrem Hauptziel bewegt. Wählergruppen, Ansehen im Ausland, Nebenwirkungen.
// Stärken und Verzögerungen sind wie alle im Netz grob geschätzt (Spielparameter, keine Messwerte); jede trägt ihre Begründung.
// Was schon eine Verbindung zwischen denselben Knoten hat, bleibt unverändert.
function ee(from: string, to: string, weight: number, lag: number, why: string) {
  if (E.some((k) => k.from === from && k.to === to)) return;
  e(from, to, weight, lag, why);
}

ee("m_medienaufsicht", "polarisierung", 0.03, 3, "Ein gegängeltes Medienfeld macht den Streit nicht leiser, nur lauter und bitterer.");
ee("m_medienaufsicht", "beziehungen_eu", -0.03, 3, "Brüssel liest Sendeverbote als Rückschritt bei den Grundrechten.");
ee("m_medienaufsicht", "ansehen", -0.03, 3, "Das Ausland beobachtet, wer Kritiker zum Schweigen bringt.");
ee("m_medienaufsicht", "staedtische_saekulare", -0.04, 1, "Wer kritische Berichte liest, fühlt sich bevormundet.");
ee("m_medienaufsicht", "junge", -0.03, 1, "Junge Menschen holen sich ihre Nachrichten dort, wo niemand sie sperrt.");
ee("m_medienaufsicht", "konservative", 0.02, 1, "Ein Teil der Wähler will Ordnung und Anstand im Medienfeld.");
ee("m_medienaufsicht", "zivilgesellschaft", -0.03, 3, "Redaktionen und Vereine üben Selbstzensur.");
ee("m_internetsperren", "junge", -0.05, 1, "Gesperrte Plattformen treffen vor allem die, die sie täglich nutzen.");
ee("m_internetsperren", "staedtische_saekulare", -0.04, 1, "Sperren wirken wie Gängelung.");
ee("m_internetsperren", "gruendungen", -0.03, 3, "Digitale Firmen meiden ein Land, in dem Seiten gesperrt werden.");
ee("m_internetsperren", "investitionen", -0.02, 3, "Investoren fürchten Willkür im Netz.");
ee("m_internetsperren", "ansehen", -0.02, 3, "Netzsperren gelten im Ausland als Zeichen von Zensur.");
ee("m_internetsperren", "zivilgesellschaft", -0.03, 3, "Ohne freie Kanäle verstummen Initiativen.");
ee("m_internetsperren", "polarisierung", 0.02, 3, "Verbote treiben Menschen in Gegenöffentlichkeiten.");
ee("m_staatsmedien", "pressefreiheit", -0.03, 3, "Wer den Anzeigenmarkt beherrscht, beherrscht die Berichte.");
ee("m_staatsmedien", "konservative", 0.03, 1, "Regierungsnahe Sender sprechen ihre Sprache.");
ee("m_staatsmedien", "vertrauen_regierung", 0.02, 1, "Freundliche Berichte heben kurz die Stimmung.");
ee("m_staatsmedien", "polarisierung", 0.02, 3, "Zwei Öffentlichkeiten, die einander nicht mehr zuhören.");
ee("m_staatsmedien", "staedtische_saekulare", -0.02, 1, "Wer nicht mehr glaubt, was gesendet wird, wendet sich ab.");
ee("m_versammlungsfreiheit", "zivilgesellschaft", 0.04, 3, "Wer demonstrieren darf, organisiert sich.");
ee("m_versammlungsfreiheit", "pressefreiheit", 0.02, 3, "Freie Straßen und freie Berichte gehören zusammen.");
ee("m_versammlungsfreiheit", "junge", 0.03, 1, "Junge Menschen wollen sichtbar sein.");
ee("m_versammlungsfreiheit", "staedtische_saekulare", 0.03, 1, "Freiheitsrechte gehören für sie zum Kern.");
ee("m_versammlungsfreiheit", "ansehen", 0.02, 6, "Das Ausland schaut auf die Bilder von den Plätzen.");
ee("m_versammlungsfreiheit", "polarisierung", 0.02, 3, "Große Kundgebungen machen Gegensätze sichtbar.");
ee("m_versammlungsfreiheit", "konservative", -0.02, 1, "Manche fürchten Unruhe und Blockaden.");
ee("m_gewerkschaftsrechte", "streikneigung", 0.04, 1, "Wer streiken darf, streikt auch.");
ee("m_gewerkschaftsrechte", "arbeitnehmer", 0.04, 1, "Starke Tarifpartner sind das, was Beschäftigte wollen.");
ee("m_gewerkschaftsrechte", "realeinkommen", 0.02, 6, "Tarifverträge halten die Löhne mit den Preisen Schritt.");
ee("m_gewerkschaftsrechte", "unternehmer", -0.03, 1, "Arbeitgeber fürchten Streiks und höhere Abschlüsse.");
ee("m_gewerkschaftsrechte", "kostendruck", 0.02, 3, "Höhere Löhne erhöhen die Kosten der Betriebe.");
ee("m_gewerkschaftsrechte", "ungleichheit", -0.02, 6, "Tarifbindung drückt die Lohnunterschiede.");
ee("m_wissenschaftsfreiheit", "ansehen", 0.02, 6, "Freie Universitäten machen ein Land in der Welt der Wissenschaft anschlussfähig.");
ee("m_wissenschaftsfreiheit", "produktivitaet", 0.01, 12, "Freie Forschung zahlt sich über Jahre aus.");
ee("m_wissenschaftsfreiheit", "junge", 0.02, 3, "Studierende bleiben, wenn sie frei lernen dürfen.");
ee("m_wissenschaftsfreiheit", "staedtische_saekulare", 0.03, 3, "Autonome Hochschulen gehören zu ihrem Bild von einem freien Land.");
ee("m_wissenschaftsfreiheit", "konservative", -0.02, 3, "Manche sehen darin einen Verlust an Aufsicht über die Lehre.");
ee("m_wissenschaftsfreiheit", "beziehungen_eu", 0.02, 6, "Forschungsprogramme setzen Wissenschaftsfreiheit voraus.");
ee("m_antikorruption", "auslandskapital", 0.03, 6, "Investoren fordern saubere Vergaben.");
ee("m_antikorruption", "vertrauen_maerkte", 0.02, 3, "Transparente Vergaben senken das Risiko.");
ee("m_antikorruption", "beamte", -0.02, 1, "Prüfungen verunsichern die Verwaltung.");
ee("m_antikorruption", "junge", 0.02, 3, "Junge Menschen verlangen saubere Politik.");
ee("m_antikorruption", "staedtische_saekulare", 0.02, 3, "Transparenz ist ein Kernanliegen der Städter.");
ee("m_antikorruption", "rechtssicherheit", 0.02, 6, "Wer sich auf Regeln verlassen kann, plant.");
ee("m_justizreform", "auslandskapital", 0.02, 6, "Verlässliche Gerichte sind das erste, was Investoren prüfen.");
ee("m_justizreform", "beziehungen_eu", 0.03, 6, "Ohne unabhängige Justiz gibt es keine Fortschritte in Brüssel.");
ee("m_justizreform", "ansehen", 0.02, 6, "Ein Rechtsstaat wird in der Welt ernst genommen.");
ee("m_justizreform", "staedtische_saekulare", 0.02, 3, "Unabhängige Gerichte schützen vor Willkür.");
ee("m_friedensprozess", "konservative", -0.03, 1, "Manche sehen darin ein Nachgeben.");
ee("m_friedensprozess", "beziehungen_eu", 0.02, 3, "Frieden im Südosten wird in Europa begrüßt.");
ee("m_friedensprozess", "ansehen", 0.02, 6, "Wer einen Konflikt beendet, gewinnt Ansehen.");
ee("m_friedensprozess", "beziehungen_nahost", 0.02, 6, "Ein befriedeter Südosten entspannt die Region.");
ee("m_grenzschutz", "ansehen", -0.02, 3, "Mauern und Zäune gefallen dem Ausland selten.");
ee("m_grenzschutz", "beziehungen_eu", -0.02, 3, "Härte an der Grenze belastet Absprachen zur Migration.");
ee("m_grenzschutz", "konservative", 0.03, 1, "Ein Teil der Wähler will Kontrolle.");
ee("m_grenzschutz", "terrorgefahr", -0.02, 3, "Kontrollierte Grenzen erschweren Infiltration.");
ee("m_verteidigung", "konservative", 0.02, 1, "Starke Streitkräfte sind für viele ein Kern des Staates.");
ee("m_verteidigung", "beziehungen_usa", 0.02, 6, "Ein fairer Anteil in der NATO wird in Washington gesehen.");
ee("m_verteidigung", "terrorgefahr", -0.02, 6, "Bessere Fähigkeiten schrecken ab.");
ee("m_verteidigung", "beziehungen_russland", -0.01, 6, "Moskau beobachtet die Aufrüstung im Schwarzen Meer.");
ee("m_ruestungsindustrie", "export", 0.03, 6, "Drohnen und Panzer sind Exportschlager.");
ee("m_ruestungsindustrie", "arbeitsplaetze_industrie", 0.03, 6, "Rüstungsfabriken schaffen Arbeit in der Industrie.");
ee("m_ruestungsindustrie", "militaer", 0.02, 12, "Eigene Produktion macht unabhängiger von Lieferungen.");
ee("m_ruestungsindustrie", "beziehungen_eu", -0.01, 6, "Rüstungsexporte sind in Europa umstritten.");
ee("m_polizei", "konservative", 0.02, 1, "Mehr Polizei ist für viele ein Zeichen von Ordnung.");
ee("m_polizei", "terrorgefahr", -0.02, 3, "Mehr Personal erschwert Anschläge.");
ee("m_polizei", "polarisierung", 0.01, 3, "Ein starker Polizeiapparat spaltet, wenn er politisch benutzt wird.");
ee("m_polizei", "staedtische_saekulare", -0.01, 1, "Manche Städter fürchten einen Kontrollstaat.");
ee("m_religionsbehoerde", "religioesitaet", 0.03, 6, "Moscheen und Imame prägen das Land.");
ee("m_religionsbehoerde", "konservative", 0.04, 1, "Religiös-Konservative sehen ihre Werte gestärkt.");
ee("m_religionsbehoerde", "staedtische_saekulare", -0.03, 1, "Säkulare Städter fürchten eine Vermischung von Religion und Staat.");
ee("m_religionsbehoerde", "frauenrechte", -0.02, 12, "Konservative Auslegungen schränken oft Frauen ein.");
ee("m_religionsbehoerde", "polarisierung", 0.02, 3, "Kulturkampf-Thema.");
ee("m_religioese_schulen", "religioesitaet", 0.03, 12, "Wer in der Schule lernt, was Glaube heißt, bleibt ihm näher.");
ee("m_religioese_schulen", "konservative", 0.03, 1, "Ein Kernanliegen religiöser Familien.");
ee("m_religioese_schulen", "staedtische_saekulare", -0.03, 1, "Säkulare Eltern sehen ihre Kinder ungern in religiösen Schulen.");
ee("m_religioese_schulen", "bildungsqualitaet", -0.02, 12, "Ein Schwerpunkt auf Religion geht zulasten von Naturwissenschaften.");
ee("m_gewaltschutz", "staedtische_saekulare", 0.03, 1, "Ein Kernanliegen vieler Frauen und Männer in den Städten.");
ee("m_gewaltschutz", "junge", 0.02, 1, "Junge Menschen erwarten Schutz.");
ee("m_gewaltschutz", "justizvertrauen", 0.02, 6, "Wer Anzeigen ernst nimmt, gewinnt Vertrauen in die Gerichte.");
ee("m_gewaltschutz", "konservative", -0.01, 1, "Manche sehen darin einen Eingriff in die Familie.");
ee("m_eu_annaeherung", "konservative", -0.02, 1, "Nationale Kreise misstrauen Brüsseler Bedingungen.");
ee("m_eu_annaeherung", "export", 0.02, 12, "Eine modernisierte Zollunion erleichtert die Ausfuhr.");
ee("m_eu_annaeherung", "auslandskapital", 0.02, 12, "Reformen und Nähe zur EU beruhigen Investoren.");
ee("m_eu_annaeherung", "unternehmer", 0.02, 3, "Die Wirtschaft will Zugang zum Binnenmarkt.");
ee("m_eu_annaeherung", "staedtische_saekulare", 0.02, 1, "Für sie ist Europa Teil der Zukunft.");
ee("m_rueckkehr", "ansehen", -0.02, 3, "Zwangsnahe Programme werden im Ausland kritisch gesehen.");
ee("m_rueckkehr", "beziehungen_eu", -0.02, 3, "Brüssel achtet auf Freiwilligkeit.");
ee("m_rueckkehr", "konservative", 0.02, 1, "Für viele ein Zeichen, dass die Regierung handelt.");
ee("m_integration", "konservative", -0.02, 1, "Manche sehen Integration als Dauerlösung, die sie nicht wollen.");
ee("m_integration", "unternehmer", 0.02, 6, "Betriebe brauchen Arbeitskräfte.");
ee("m_integration", "arbeitnehmer", -0.01, 3, "Einfache Arbeit wird zur Konkurrenz.");
ee("m_integration", "ansehen", 0.02, 6, "Ein Land, das aufnimmt und einbindet, gewinnt Ansehen.");
ee("m_integration", "informelle_arbeit", -0.02, 6, "Mit Arbeitserlaubnis wird Schwarzarbeit weniger.");
ee("m_privatisierung", "beamte", -0.03, 1, "Verkäufe gefährden Stellen.");
ee("m_privatisierung", "arbeitnehmer", -0.02, 3, "Private Betreiber sparen an Personal.");
ee("m_privatisierung", "unternehmer", 0.03, 1, "Mehr Raum für Private.");
ee("m_privatisierung", "auslandskapital", 0.02, 6, "Ausländische Käufer bringen Kapital.");
ee("m_privatisierung", "vertrauen_maerkte", 0.02, 3, "Schuldenabbau durch Verkäufe beruhigt Märkte.");
ee("m_kernkraft", "beziehungen_russland", 0.02, 12, "Akkuyu bindet Ankara und Moskau.");
ee("m_kernkraft", "staedtische_saekulare", -0.02, 1, "Sorgen vor einem Reaktorunfall im Erdbebenland.");
ee("m_kernkraft", "klimaschutz", 0.01, 12, "Kernkraft stößt kaum CO2 aus.");
ee("m_energiesubventionen", "lebenshaltung", -0.03, 1, "Gedeckelte Preise entlasten sofort.");
ee("m_energiesubventionen", "arbeitnehmer", 0.02, 1, "Haushalte spüren die niedrigeren Rechnungen.");
ee("m_energiesubventionen", "rentner", 0.02, 1, "Rentner treffen Energiepreise besonders.");
ee("m_umweltauflagen", "industrie", -0.02, 3, "Strengere Grenzwerte verteuern die Produktion.");
ee("m_umweltauflagen", "unternehmer", -0.02, 1, "Betriebe sehen Kosten und Bürokratie.");
ee("m_umweltauflagen", "staedtische_saekulare", 0.03, 1, "Saubere Luft ist ein Stadtthema.");
ee("m_umweltauflagen", "beziehungen_eu", 0.02, 6, "Grenzwerte nach EU-Vorbild gehören zum Beitrittspfad.");
ee("m_umweltauflagen", "kostendruck", 0.02, 3, "Auflagen erhöhen die Kosten der Betriebe.");
ee("m_co2_preis", "energiepreise", 0.03, 3, "Ein Preis auf Kohlenstoff verteuert fossile Energie.");
ee("m_co2_preis", "kostendruck", 0.03, 3, "Betriebe zahlen für ihren Ausstoß.");
ee("m_co2_preis", "klimaschutz", 0.04, 6, "Ein Preis lenkt Investitionen um.");
ee("m_co2_preis", "beziehungen_eu", 0.03, 6, "Ohne eigenen CO2-Preis trifft der Grenzausgleich der EU die Ausfuhr.");
ee("m_co2_preis", "unternehmer", -0.03, 1, "Industrie und Energieversorger wehren sich.");
ee("m_co2_preis", "arbeitnehmer", -0.02, 3, "Höhere Preise treffen auch Haushalte.");
ee("m_bankenaufsicht", "unternehmer", -0.02, 1, "Strengere Kreditregeln bremsen Finanzierungen.");
ee("m_bankenaufsicht", "vertrauen_maerkte", 0.03, 3, "Solide Banken beruhigen Anleger.");
ee("m_einkommensteuer", "arbeitnehmer", -0.03, 1, "Wer mehr abgibt, hat weniger übrig.");
ee("m_einkommensteuer", "unternehmer", -0.02, 1, "Auch Selbständige zahlen mehr.");
ee("m_einkommensteuer", "ungleichheit", -0.02, 12, "Progressive Sätze drücken die Unterschiede.");
ee("m_mwst", "lebenshaltung", 0.03, 1, "Die Mehrwertsteuer steckt in jedem Preis.");
ee("m_mwst", "arbeitnehmer", -0.03, 1, "Sie trifft alle, die ihr Einkommen ausgeben.");
ee("m_mwst", "rentner", -0.03, 1, "Feste Einkommen werden entwertet.");
ee("m_mwst", "armut", 0.01, 6, "Wer wenig hat, gibt fast alles aus und zahlt darauf.");
ee("m_kraftstoffsteuer", "lebenshaltung", 0.02, 1, "Benzin und Diesel bestimmen die Fahrtkosten.");
ee("m_kraftstoffsteuer", "landwirte", -0.03, 1, "Landwirte hängen am Diesel.");
ee("m_kraftstoffsteuer", "arbeitnehmer", -0.02, 1, "Pendler zahlen mehr.");
ee("m_kraftstoffsteuer", "klimaschutz", 0.02, 12, "Höhere Preise dämpfen den Verbrauch.");
ee("m_kraftstoffsteuer", "luftqualitaet", 0.01, 12, "Weniger Verkehr, sauberere Luft.");
ee("m_immobiliensteuer", "unternehmer", -0.03, 1, "Wer viel besitzt, wehrt sich.");
ee("m_immobiliensteuer", "ungleichheit", -0.03, 12, "Vermögen wird stärker herangezogen.");
ee("m_immobiliensteuer", "mieten", 0.02, 3, "Vermieter geben die Steuer an die Mieter weiter.");
ee("m_steuerfahndung", "unternehmer", -0.02, 1, "Kontrollen belasten Betriebe.");
ee("m_steuerfahndung", "schattenwirtschaft", -0.03, 6, "Wer erwischt wird, meldet an.");
ee("m_steuerfahndung", "mittelstand", -0.01, 3, "Kleine Betriebe leiden unter dem Aufwand.");
ee("m_kindergeld", "konservative", 0.02, 1, "Familienpolitik ist ihnen wichtig.");
ee("m_kindergeld", "arbeitnehmer", 0.02, 1, "Familien mit Kindern profitieren.");
ee("m_sozialhilfe", "vertrauen_regierung", 0.01, 3, "Wer Hilfe erhält, dankt es dem Staat.");
ee("m_sozialhilfe", "arbeitnehmer", -0.01, 3, "Manche fragen, warum sie selbst so viel zahlen.");
ee("m_kinderbetreuung", "arbeitnehmer", 0.02, 3, "Eltern können arbeiten.");
ee("m_kinderbetreuung", "staedtische_saekulare", 0.02, 3, "Ein Kernanliegen berufstätiger Eltern.");
ee("m_autobahnen", "bauwirtschaft", 0.03, 3, "Große Projekte füllen die Auftragsbücher.");
ee("m_autobahnen", "luftqualitaet", -0.02, 12, "Mehr Straßen, mehr Verkehr.");
ee("m_autobahnen", "klimaschutz", -0.02, 12, "Mehr Verkehr, mehr Ausstoß.");
ee("m_solar_wind", "klimaschutz", 0.03, 6, "Erneuerbare ersetzen fossile Energie.");
ee("m_solar_wind", "energiepreise", -0.02, 12, "Sonne und Wind sind, einmal gebaut, günstig.");
ee("m_solar_wind", "luftqualitaet", 0.02, 6, "Weniger Kohle, sauberere Luft.");
ee("m_solar_wind", "staedtische_saekulare", 0.02, 1, "Ein Zukunftsthema für die Städte.");
ee("m_gasfoerderung", "klimaschutz", -0.02, 6, "Mehr fossile Energie.");
ee("m_gasfoerderung", "energiepreise", -0.02, 12, "Heimisches Gas macht unabhängiger von Weltmarktpreisen.");
ee("m_netzausbau", "erneuerbare", 0.02, 6, "Ohne Netze kommt der Strom aus Sonne und Wind nicht an.");
ee("m_mechanisierung", "landflucht", 0.02, 12, "Maschinen ersetzen Hände, die Jungen ziehen weg.");
ee("m_agrarsubventionen", "landwirte", 0.03, 1, "Direkte Hilfe sichert Einkommen.");
ee("m_preiskontrollen", "schattenwirtschaft", 0.03, 3, "Unter dem Preis verschwindet Ware in den Schwarzmarkt.");
ee("m_preiskontrollen", "landwirte", -0.03, 1, "Bauern verkaufen unter Wert.");
ee("m_preiskontrollen", "unternehmer", -0.02, 1, "Händler klagen über Verluste.");

// Politische Folgen II: dieselben Überlegungen für die Fachmaßnahmen (Gesundheit, Bildung, Verkehr, Land, Bau).
ee("m_exportfoerderung", "unternehmer", 0.03, 1, "Exporteure sehen Rückhalt vom Staat.");
ee("m_exportfoerderung", "arbeitsplaetze_industrie", 0.02, 6, "Aufträge aus dem Ausland sichern Stellen in den Fabriken.");
ee("m_exportfoerderung", "industrie", 0.02, 6, "Mehr Ausfuhr füllt die Werkhallen.");
ee("m_investitionsanreize", "unternehmer", 0.04, 1, "Wer investiert, wird belohnt.");
ee("m_investitionsanreize", "produktivitaet", 0.02, 12, "Neue Anlagen steigern die Leistung je Arbeitsstunde.");
ee("m_investitionsanreize", "arbeitsplaetze_industrie", 0.02, 9, "Neue Fabriken brauchen Leute.");
ee("m_investitionsanreize", "ungleichheit", 0.01, 12, "Steuervorteile nützen vor allem den Großen.");
ee("m_kreditgarantien", "unternehmer", 0.02, 1, "Der Staat steht für Kredite gerade.");
ee("m_kreditgarantien", "gruendungen", 0.02, 6, "Mit Bürgschaft wagen mehr Menschen den Schritt.");
ee("m_kreditgarantien", "vertrauen_maerkte", -0.01, 6, "Ausfälle belasten den Staat als Bürgen.");
ee("m_tourismuswerbung", "unternehmer", 0.02, 3, "Hotels und Gastronomie füllen sich.");
ee("m_tourismuswerbung", "ansehen", 0.01, 12, "Ein Land, das man kennt, hat es leichter.");
ee("m_tourismuswerbung", "arbeitnehmer", 0.01, 6, "Saisonarbeit an der Küste.");
ee("m_kmu", "unternehmer", 0.03, 1, "Kleine Betriebe fühlen sich gesehen.");
ee("m_kmu", "arbeitnehmer", 0.02, 6, "Kleine Betriebe stellen ein.");
ee("m_kmu", "landflucht", -0.01, 12, "Betriebe in der Provinz halten Menschen dort.");
ee("m_steueramnestie", "unternehmer", 0.03, 1, "Wer Schulden beim Fiskus hat, atmet auf.");
ee("m_steueramnestie", "schattenwirtschaft", -0.03, 6, "Wer nachzahlt, kehrt in die offizielle Wirtschaft zurück.");
ee("m_steueramnestie", "arbeitnehmer", -0.03, 1, "Wer pünktlich zahlt, empfindet es als Hohn.");
ee("m_steueramnestie", "staedtische_saekulare", -0.02, 1, "Amnestien für Vermögende wirken ungerecht.");
ee("m_steueramnestie", "justizvertrauen", -0.02, 6, "Wer Steuern hinterzieht, kommt straflos davon.");
ee("m_renten", "rentner", 0.04, 0, "Jede Erhöhung wird gefeiert.");
ee("m_renten", "junge", -0.03, 3, "Die Jüngeren zahlen die Beiträge.");
ee("m_renten", "arbeitnehmer", -0.02, 3, "Höhere Renten bedeuten höhere Beiträge.");
ee("m_renten", "armut", -0.02, 3, "Altersarmut geht zurück.");
ee("m_arbeitslosengeld", "arbeitnehmer", 0.02, 1, "Wer seine Stelle verliert, fällt weicher.");
ee("m_arbeitslosengeld", "junge", 0.02, 1, "Besonders wichtig für Berufseinsteiger.");
ee("m_arbeitslosengeld", "unternehmer", -0.02, 1, "Höhere Sozialabgaben.");
ee("m_arbeitslosengeld", "sozialkassen", -0.03, 3, "Die Ausgaben steigen.");
ee("m_ausbildung", "junge", 0.03, 3, "Ein Angebot für die, die sonst warten.");
ee("m_ausbildung", "unternehmer", 0.02, 6, "Betriebe bekommen Nachwuchs.");
ee("m_ausbildung", "arbeitnehmer", 0.01, 6, "Bessere Aussichten für die eigenen Kinder.");
ee("m_krankenhausbau", "rentner", 0.03, 6, "Für Ältere zählt die Klinik in der Nähe.");
ee("m_krankenhausbau", "arbeitnehmer", 0.02, 6, "Bessere Versorgung für die Familie.");
ee("m_krankenhausbau", "lebenserwartung", 0.02, 12, "Schnellere Hilfe rettet Leben.");
ee("m_krankenhausbau", "wartezeiten", -0.02, 12, "Mehr Betten, kürzere Wege.");
ee("m_krankenhausbau", "bauwirtschaft", 0.02, 3, "Bauaufträge für die Baubranche.");
ee("m_aerztegehalt", "gesundheitsversorgung", 0.02, 6, "Mehr Ärzte bleiben im Dienst.");
ee("m_aerztegehalt", "abwanderung", -0.02, 6, "Weniger Ärzte gehen ins Ausland.");
ee("m_aerztegehalt", "wartezeiten", -0.02, 12, "Mehr Personal, kürzere Warteschlangen.");
ee("m_hausarzt", "gesundheitsversorgung", 0.03, 12, "Der erste Ansprechpartner fehlte vielerorts.");
ee("m_hausarzt", "rentner", 0.03, 6, "Ältere brauchen jemanden in der Nähe.");
ee("m_hausarzt", "landwirte", 0.02, 6, "Auf dem Land ist der Weg zum Arzt weit.");
ee("m_hausarzt", "lebenserwartung", 0.01, 12, "Früh erkannte Krankheiten sind besser behandelbar.");
ee("m_zuzahlungen", "rentner", -0.04, 1, "Ältere gehen am häufigsten zum Arzt.");
ee("m_zuzahlungen", "arbeitnehmer", -0.03, 1, "Jeder Besuch kostet.");
ee("m_zuzahlungen", "gesundheitsversorgung", -0.02, 6, "Wer zahlen muss, geht später zum Arzt.");
ee("m_zuzahlungen", "sozialkassen", 0.02, 3, "Die Kassen werden entlastet.");
ee("m_lehrergehaelter", "staedtische_saekulare", 0.02, 6, "Bildung ist ihr Thema.");
ee("m_lehrergehaelter", "schulabbruch", -0.02, 12, "Motivierte Lehrer halten Schüler in der Schule.");
ee("m_lehrergehaelter", "abwanderung", -0.01, 12, "Wer gut bezahlt wird, geht seltener ins Ausland.");
ee("m_schulbau", "bauwirtschaft", 0.02, 3, "Bauaufträge in allen Provinzen.");
ee("m_schulbau", "junge", 0.02, 6, "Kürzere Wege, kleinere Klassen.");
ee("m_schulbau", "landflucht", -0.01, 12, "Eine Schule im Dorf hält Familien dort.");
ee("m_berufsschulen", "junge", 0.03, 6, "Ein Weg in Arbeit ohne Studium.");
ee("m_berufsschulen", "unternehmer", 0.02, 6, "Betriebe bekommen Fachleute.");
ee("m_berufsschulen", "produktivitaet", 0.01, 12, "Besser Ausgebildete leisten mehr.");
ee("m_unigruendungen", "junge", 0.03, 3, "Studienplätze in der Nähe.");
ee("m_unigruendungen", "staedtische_saekulare", 0.02, 6, "Hochschulen prägen das Umfeld.");
ee("m_unigruendungen", "landflucht", -0.02, 12, "Universitäten binden junge Menschen an die Region.");
ee("m_stipendien", "junge", 0.03, 3, "Wer nicht reiche Eltern hat, kann trotzdem studieren.");
ee("m_stipendien", "hochschule", 0.02, 12, "Mehr Begabte kommen an die Hochschule.");
ee("m_stipendien", "ungleichheit", -0.02, 12, "Bildung hängt weniger am Geldbeutel.");
ee("m_forschung", "staedtische_saekulare", 0.02, 6, "Forschung gilt ihnen als Zukunft.");
ee("m_forschung", "ansehen", 0.02, 12, "Wer forscht, wird ernst genommen.");
ee("m_forschung", "export", 0.01, 12, "Technik aus eigener Forschung lässt sich verkaufen.");
ee("m_forschung", "abwanderung", -0.01, 12, "Wer forschen kann, bleibt.");
ee("m_oepp_garantien", "bauwirtschaft", 0.03, 3, "Große Projekte füllen die Auftragsbücher.");
ee("m_oepp_garantien", "unternehmer", 0.02, 3, "Der Staat stützt die Bauherren.");
ee("m_oepp_garantien", "korruption", 0.02, 12, "Große Verträge ohne Wettbewerb laden zur Bevorzugung ein.");
ee("m_oepp_garantien", "vertrauen_maerkte", -0.02, 12, "Garantien sind Schulden im Verborgenen.");
ee("m_bahn", "bauwirtschaft", 0.03, 3, "Jahre voller Bauaufträge.");
ee("m_bahn", "logistik", 0.03, 12, "Güter kommen schneller ans Ziel.");
ee("m_bahn", "stau", -0.02, 12, "Weniger Lastwagen auf den Straßen.");
ee("m_bahn", "landflucht", -0.01, 12, "Anbindung hält Orte lebendig.");
ee("m_nahverkehr", "staedtische_saekulare", 0.03, 6, "Ein Stadtthema.");
ee("m_nahverkehr", "junge", 0.03, 6, "Junge fahren mehr mit Bus und Bahn.");
ee("m_nahverkehr", "arbeitnehmer", 0.02, 6, "Der Weg zur Arbeit wird kürzer.");
ee("m_nahverkehr", "bauwirtschaft", 0.02, 3, "Bauaufträge in den Städten.");
ee("m_breitband", "junge", 0.03, 6, "Ohne Netz kein Leben.");
ee("m_breitband", "gruendungen", 0.03, 12, "Digitale Firmen lassen sich überall nieder.");
ee("m_breitband", "landflucht", -0.02, 12, "Arbeiten aus dem Dorf wird möglich.");
ee("m_breitband", "bildungsqualitaet", 0.01, 12, "Zugang zu Lernangeboten.");
ee("m_regionalfoerderung", "landwirte", 0.03, 3, "Hilfe für die Provinz.");
ee("m_regionalfoerderung", "konservative", 0.02, 3, "Die Provinz fühlt sich gesehen.");
ee("m_regionalfoerderung", "investitionen", 0.02, 12, "Anreize ziehen Betriebe in die Regionen.");
ee("m_regionalfoerderung", "korruption", 0.01, 12, "Fördergelder ziehen Begünstigung an.");
ee("m_regionalfoerderung", "polarisierung", -0.01, 12, "Wer sich nicht vergessen fühlt, ist weniger wütend.");
ee("m_netzausbau", "industrie", 0.01, 12, "Verlässlicher Strom für die Fabriken.");
ee("m_netzausbau", "bauwirtschaft", 0.01, 3, "Aufträge für Leitungsbauer.");
ee("m_bewaesserung", "landwirte", 0.04, 3, "Bauern bekommen Wasser aufs Feld.");
ee("m_bewaesserung", "landwirtschaft_einkommen", 0.03, 6, "Sichere Ernten, sichere Einkommen.");
ee("m_bewaesserung", "duerre", -0.03, 6, "Trockene Jahre treffen weniger hart.");
ee("m_wasserleitungen", "landwirte", 0.02, 3, "Wasser im Dorf.");
ee("m_wasserleitungen", "arbeitnehmer", 0.02, 6, "Wasser im Haus.");
ee("m_wasserleitungen", "duerre", -0.02, 6, "Weniger Verluste in den Leitungen.");
ee("m_wasserleitungen", "bauwirtschaft", 0.02, 3, "Bauaufträge in allen Provinzen.");
ee("m_saatgut", "landwirte", 0.03, 3, "Bessere Erträge auf demselben Feld.");
ee("m_saatgut", "landwirtschaft_einkommen", 0.03, 6, "Höhere Erträge, höhere Einkommen.");
ee("m_saatgut", "lebensmittelpreise", -0.02, 6, "Mehr Ernte, niedrigere Preise.");
ee("m_baukredite", "bauwirtschaft", 0.04, 3, "Mehr Kredit, mehr Aufträge.");
ee("m_baukredite", "arbeitnehmer", 0.02, 3, "Der Traum vom Eigenheim rückt näher.");
ee("m_baukredite", "unternehmer", 0.02, 3, "Bauunternehmer bekommen Aufträge.");
ee("m_bauamnestie", "bauwirtschaft", 0.02, 2, "Nachträgliche Genehmigungen bringen Aufträge für Gutachter und Bauleute.");
ee("m_bauamnestie", "konservative", 0.03, 1, "Ein Wahlversprechen für Hausbesitzer.");
ee("m_bauamnestie", "arbeitnehmer", 0.02, 1, "Wer illegal gebaut hat, muss nicht mehr zittern.");
ee("m_bauamnestie", "erdbebenvorsorge", -0.04, 12, "Nicht geprüfte Häuser bleiben unsicher.");
ee("m_bauamnestie", "rechtssicherheit", -0.03, 6, "Wer Regeln bricht, wird belohnt.");


// ---------------------------------------------------------------------------
// Fachbereiche (FACHBEREICHE.md): Recht, Streitkräfte, Kultur, Instandhaltung. Jeder Bereich hat eigene Größen, damit Reformen
// nicht nur Geld bewegen, sondern etwa die Unabhängigkeit der Justiz. Startwerte sind Spielparameter; belegte Anker stehen im Text.

g("recht", "justiz_unabhaengigkeit", "Unabhängigkeit der Justiz", 32, "Ob Richter und Staatsanwälte ohne Weisung und Druck entscheiden. Der Richterrat, den Präsident und Parlament besetzen, prägt sie.", 0.03);
g("recht", "justiz_kapazitaet", "Kapazität der Gerichte", 45, "Richter, Staatsanwälte und Gerichtssäle im Verhältnis zu den Verfahren. Die Türkei hat 17 Richter je 100.000 Einwohner, der europäische Schnitt liegt bei 22.", 0.03);
g("recht", "justiz_effizienz", "Effizienz der Verfahren", 50, "Wie schnell Verfahren enden. Strafgerichte brauchten 2024 im Schnitt 228, Zivilgerichte 231 Tage, die Vollstreckung 919.", 0.05);
g("recht", "urteilsbefolgung", "Befolgung von Urteilen", 35, "Ob Behörden und Gerichte Urteile des Verfassungsgerichts und des Straßburger Gerichtshofs umsetzen. Das Verfahren im Fall Kavala läuft seit 2022 nach Artikel 46.", 0.03);
g("recht", "haftueberfuellung", "Überfüllung der Haftanstalten", 71, "Im August 2026 saßen 433.520 Menschen auf 304.956 Plätzen, etwa 142 Prozent. Ein hoher Wert heißt mehr Überfüllung.", 0.02);
g("recht", "ausnahmerecht", "Ausnahmerecht", 10, "Wie viel Staatshandeln über Notstandsbefugnisse und Sonderregeln läuft. Von 2016 bis 2018 galt ein Ausnahmezustand mit 32 Dekreten. Ein hoher Wert heißt mehr Ausnahmerecht.", 0.06);
g("recht", "anwaltsautonomie", "Autonomie der Anwaltschaft", 55, "Ob die Anwaltskammern frei sprechen und Verfahren begleiten können. Das Gesetz von 2020 erlaubt weitere Kammern in Großstädten; alle 80 Kammern lehnten es ab.", 0.03);
g("recht", "strassburg_druck", "Druck aus Straßburg", 60, "Offene Urteile und Verfahren des Europäischen Gerichtshofs für Menschenrechte, die Ankara umsetzen soll. Ein hoher Wert heißt mehr Druck.", 0.03);
g("gesellschaft", "legitimitaet", "Legitimität der Regierung", 60, "Wie sehr Bürger, Beamte und Partner die Regeln, nach denen regiert wird, für rechtmäßig halten. Sie sinkt durch Ausnahmerecht und Willkür und steigt mit unabhängiger Justiz, Rechtssicherheit und Erfolgen.", 0.03);

g("militaer", "bereitschaft_heer", "Einsatzbereitschaft des Heeres", 60, "Wie viel Gerät und Personal des Heeres tatsächlich einsatzbereit ist, mit Ausbildung und Ersatzteilen.", 0.04);
g("militaer", "bereitschaft_luft", "Einsatzbereitschaft der Luftwaffe", 55, "Einsatzbereite Flugzeuge und Luftabwehr, mit Piloten, Technikern und Ersatzteilen.", 0.04);
g("militaer", "bereitschaft_see", "Einsatzbereitschaft der Marine", 58, "Einsatzbereite Schiffe und Boote; die Marine wächst mit eigenen Fregatten und einem Hubschrauberträger.", 0.04);
g("militaer", "modernisierung", "Modernisierung der Ausrüstung", 45, "Anteil der jüngsten Systemgeneration: Drohnen, Kampfjets, Panzer, Luftabwehr.", 0.02);
g("militaer", "ruestungsautarkie", "Rüstungsautarkie", 60, "Wie viel die Streitkräfte aus eigener Industrie bekommen. Triebwerke und Elektronik bleiben Lücken; eigene Motoren stehen für Kampfjet und Panzer noch aus.", 0.02);
g("militaer", "truppenmoral", "Truppenmoral", 60, "Wie gern Soldaten dienen und wie sicher sie sich in Führung und Versorgung fühlen.", 0.04);
g("militaer", "offiziersvertrauen", "Vertrauen in die Offiziersführung", 45, "Ob Offiziere Beförderungen nach Leistung erwarten. Nach 2016 wurden Schätzungen zufolge 40 Prozent bis zwei Drittel der Generäle entlassen.", 0.03);
g("militaer", "abschreckung", "Abschreckung", 55, "Was Nachbarn und Gegner den Streitkräften zutrauen: Bereitschaft, Modernisierung, Bündnisrückhalt.", 0.03);

g("kultur", "kulturerbe", "Erhaltung des Kulturerbes", 55, "Zustand der historischen Stätten, Städte und Denkmäler; wird aus dem Bestand des Reiches je Provinz gesetzt.", 0.02);
g("kultur", "identitaet", "Nationale Identität und Zusammenhalt", 55, "Wie stark sich Menschen über Geschichte, Sprache und Symbole verbunden fühlen.", 0.03);
g("kultur", "vielfalt", "Akzeptanz kultureller und religiöser Vielfalt", 40, "Wie Mehrheit und Behörden Minderheiten und Glaubensgemeinschaften sehen: Aleviten, Armenier, Griechen, Juden, Syrer, Kurden.", 0.03);

g("infrastruktur", "wartungszustand", "Zustand der Anlagen", 55, "Wie gut Straßen, Brücken, Schienen, Leitungen und Kraftwerke gepflegt sind. Mehr Anlagen brauchen mehr Pflege.", 0.03);

m("recht", "m_richterstellen", "Richter- und Staatsanwaltsstellen", 45, 0.15, 24, "Mehr Stellen, Ausbildungsplätze und Gerichtssäle; wirkt erst nach Jahren, weil die Ausbildung dauert.");
m("recht", "m_richterrat", "Besetzung des Richterrats", 25, 0.0, 12, "Wer die Mitglieder des Richter- und Staatsanwaltsrats (HSK) bestimmt, der über Ernennung, Versetzung und Beförderung von Richtern entscheidet.");
m("recht", "m_haftvermeidung", "Haftvermeidung und Bewährung", 30, 0.02, 12, "Untersuchungshaft nur als letztes Mittel, Bewährung und elektronische Aufsicht statt Vollzug.");
m("recht", "m_notstand", "Ausnahmezustand und Sonderbefugnisse", 10, 0.0, 1, "Wie weit die Regierung mit Notstandsbefugnissen und Sonderregeln handelt, statt über Gesetze im normalen Verfahren.");
m("recht", "m_urteilsumsetzung", "Umsetzung von Gerichtsurteilen aus Straßburg und Ankara", 30, 0.0, 6, "Ob Behörden und Gerichte Urteile des Verfassungsgerichts und des Europäischen Gerichtshofs für Menschenrechte umsetzen.");
m("kultur", "m_denkmalschutz", "Denkmalschutz und Restaurierung", 40, 0.1, 12, "Personal, Mittel und Auflagen für den Erhalt historischer Stätten und Altstädte.");
m("kultur", "m_kulturfoerderung", "Kunst- und Kulturförderung", 40, 0.08, 6, "Theater, Musik, Literatur, Filmförderung und Festivals.");
m("kultur", "m_archaeologie", "Ausgrabungen und Museen", 45, 0.06, 12, "Grabungsgenehmigungen, Restaurierungswerkstätten, Museen und Nachtmuseen.");
m("kultur", "m_minderheitenrechte", "Rechte religiöser und sprachlicher Minderheiten", 35, 0.01, 12, "Schulen, Sprachen, Kirchen- und Klostereigentum, Gebetsstätten der Aleviten.");
m("militaer", "m_wehrdienst", "Wehrdienst", 30, 0.05, 6, "Dauer und Art des Wehrdienstes. Heute sechs Monate mit Freikauf gegen Gebühr.");
m("militaer", "m_uebungen", "Ausbildung und Übungen", 45, 0.15, 12, "Manöver, Flugstunden, Seetage und Ausbildungsplätze für Piloten und Techniker.");
m("militaer", "m_offiziersauswahl", "Beförderung im Obersten Militärrat", 35, 0.0, 6, "Nach welchen Kriterien der Oberste Militärrat im August Offiziere befördert und pensioniert.");
m("infrastruktur", "m_instandhaltung", "Instandhaltung der Infrastruktur", 45, 0.2, 12, "Wartung, Erneuerung und Sanierung von Straßen, Brücken, Schienen und Leitungen.");

ee("m_richterstellen", "justiz_kapazitaet", 0.06, 12, "Mehr Stellen bedeuten mehr erledigte Verfahren, sobald die Ausbildung abgeschlossen ist.");
ee("m_richterstellen", "justiz_effizienz", 0.03, 12, "Mit mehr Richtern schrumpfen die Wartezeiten.");
ee("m_richterstellen", "beamte", 0.03, 1, "Neue Stellen im Staatsdienst.");
ee("m_richterrat", "justiz_unabhaengigkeit", 0.06, 6, "Ein Rat, den Kollegen wählen, ist schwerer zu steuern als einer, den Minister und Präsident besetzen.");
ee("m_richterrat", "rechtssicherheit", 0.03, 6, "Wer sich auf unabhängige Ernennungen verlassen kann, plant mit dem Recht.");
ee("m_richterrat", "beziehungen_eu", 0.03, 6, "Die Venedig-Kommission empfiehlt, mindestens die Hälfte des Rates von Richterkollegen wählen zu lassen.");
ee("m_richterrat", "staedtische_saekulare", 0.03, 1, "Unabhängige Gerichte sind ihnen ein Kernanliegen.");
ee("m_richterrat", "beamte", -0.02, 1, "Manche Richter und Beamte verlieren den Draht nach oben.");
ee("m_haftvermeidung", "haftueberfuellung", -0.06, 6, "Weniger Untersuchungshaft entlastet die Anstalten.");
ee("m_haftvermeidung", "justizvertrauen", 0.01, 12, "Weniger Wartezeit in Haft wirkt fairer.");
ee("m_haftvermeidung", "kriminalitaet", 0.01, 12, "Ein Teil der Entlassenen wird rückfällig.");
ee("m_haftvermeidung", "konservative", -0.03, 1, "Wird als Nachgiebigkeit gegenüber Straftätern gelesen.");
ee("m_haftvermeidung", "staedtische_saekulare", 0.02, 1, "Verhältnismäßigkeit gilt ihnen als Grundsatz.");
ee("m_notstand", "ausnahmerecht", 0.1, 0, "Notstandsbefugnisse bedeuten mehr Ausnahmerecht.");
ee("m_notstand", "terrorgefahr", -0.03, 3, "Weitreichende Befugnisse erschweren Anschläge.");
ee("m_notstand", "konservative", 0.03, 1, "Ein Teil der Wähler will einen starken Staat in der Krise.");
ee("m_urteilsumsetzung", "urteilsbefolgung", 0.08, 3, "Wer Urteile umsetzt, befolgt sie.");
ee("m_urteilsumsetzung", "strassburg_druck", -0.05, 6, "Wo Urteile umgesetzt sind, verschwinden sie von der Liste des Ministerkomitees.");
ee("m_urteilsumsetzung", "beziehungen_eu", 0.03, 6, "Brüssel misst Fortschritte an der Umsetzung von Straßburger Urteilen.");
ee("m_urteilsumsetzung", "justiz_unabhaengigkeit", 0.03, 6, "Gerichte, deren Urteile befolgt werden, entscheiden freier.");
ee("m_urteilsumsetzung", "konservative", -0.03, 1, "Wird als Nachgeben gegenüber Straßburg gelesen.");
ee("m_urteilsumsetzung", "ansehen", 0.03, 6, "Ein Land, das Urteile umsetzt, wird ernster genommen.");
ee("m_justizreform", "justiz_unabhaengigkeit", 0.03, 6, "Ein Reformpaket stärkt auch die Unabhängigkeit, wenn die Ernennungen geregelt sind.");
ee("m_justizreform", "justiz_effizienz", 0.03, 12, "Besseres Verfahrensrecht und bessere Ausbildung verkürzen die Verfahren.");
ee("m_antikorruption", "justiz_unabhaengigkeit", 0.02, 6, "Unabhängige Ermittler brauchen unabhängige Gerichte.");
ee("m_verwaltungsdigital", "justiz_effizienz", 0.03, 12, "Digitale Akten und elektronische Zustellung beschleunigen die Verfahren.");
ee("justiz_unabhaengigkeit", "justizvertrauen", 0.05, 6, "Wer glaubt, dass Richter frei entscheiden, vertraut den Gerichten.");
ee("justiz_unabhaengigkeit", "rechtssicherheit", 0.04, 6, "Unabhängige Richter machen Entscheidungen berechenbar.");
ee("justiz_unabhaengigkeit", "korruption", -0.03, 12, "Unabhängige Gerichte verfolgen auch Mächtige.");
ee("justiz_unabhaengigkeit", "auslandskapital", 0.02, 12, "Investoren prüfen zuerst, ob sie ihr Recht bekommen.");
ee("justiz_unabhaengigkeit", "urteilsbefolgung", 0.03, 6, "Unabhängige Gerichte setzen ihre Urteile eher durch.");
ee("justiz_unabhaengigkeit", "legitimitaet", 0.03, 6, "Wer die Regeln für fair hält, hält die Regierung für rechtmäßig.");
ee("justiz_kapazitaet", "justiz_effizienz", 0.05, 6, "Mehr Kapazität, kürzere Verfahren.");
ee("justiz_kapazitaet", "haftueberfuellung", -0.01, 12, "Schnellere Verfahren verkürzen die Untersuchungshaft.");
ee("justiz_effizienz", "justizvertrauen", 0.03, 3, "Schnelle Verfahren wirken gerecht.");
ee("justiz_effizienz", "rechtssicherheit", 0.03, 6, "Wer schnell zu seinem Recht kommt, kann planen.");
ee("justiz_effizienz", "mittelstand", 0.02, 12, "Verträge lassen sich schneller durchsetzen.");
ee("justiz_effizienz", "investitionen", 0.01, 12, "Verlässliche Verfahren senken das Risiko.");
ee("urteilsbefolgung", "justizvertrauen", 0.03, 6, "Urteile, die befolgt werden, stärken das Vertrauen.");
ee("urteilsbefolgung", "strassburg_druck", -0.04, 6, "Was umgesetzt ist, steht nicht mehr auf der Liste.");
ee("urteilsbefolgung", "ansehen", 0.02, 6, "Ein Land, das Urteile befolgt, gewinnt Ansehen.");
ee("haftueberfuellung", "justizvertrauen", -0.02, 6, "Überfüllte Anstalten und lange Untersuchungshaft schaden dem Ruf der Justiz.");
ee("haftueberfuellung", "ansehen", -0.02, 6, "Berichte über überfüllte Haftanstalten gehen ins Ausland.");
ee("haftueberfuellung", "kriminalitaet", 0.01, 12, "In überfüllten Anstalten gibt es kaum Wiedereingliederung.");
ee("ausnahmerecht", "justiz_unabhaengigkeit", -0.05, 3, "Wer per Dekret entlässt, schüchtert Richter ein.");
ee("ausnahmerecht", "rechtssicherheit", -0.05, 1, "Ausnahmerecht macht das Recht unberechenbar.");
ee("ausnahmerecht", "strassburg_druck", 0.05, 6, "Beschwerden über Notstandsmaßnahmen landen in Straßburg.");
ee("ausnahmerecht", "ansehen", -0.04, 3, "Das Ausland sieht Notstandsdekrete kritisch.");
ee("ausnahmerecht", "pressefreiheit", -0.03, 3, "Notstandsbefugnisse treffen zuerst Redaktionen.");
ee("ausnahmerecht", "zivilgesellschaft", -0.04, 3, "Vereine werden geschlossen oder verunsichert.");
ee("ausnahmerecht", "staedtische_saekulare", -0.04, 1, "Freiheitsrechte sind ihnen wichtig.");
ee("ausnahmerecht", "beziehungen_eu", -0.03, 3, "Brüssel misst Notstandsrecht an den Kopenhagener Kriterien.");
ee("ausnahmerecht", "legitimitaet", -0.04, 3, "Wer per Ausnahmerecht regiert, verliert Rückhalt bei den Regeln.");
ee("ausnahmerecht", "konservative", 0.02, 1, "Ein Teil der Wähler mag Härte in der Krise.");
ee("anwaltsautonomie", "justizvertrauen", 0.02, 6, "Freie Anwälte gehören zu fairen Verfahren.");
ee("anwaltsautonomie", "zivilgesellschaft", 0.02, 6, "Anwaltskammern sind ein Stück Zivilgesellschaft.");
ee("strassburg_druck", "beziehungen_eu", -0.02, 6, "Offene Urteile belasten das Verhältnis zu Europa.");
ee("strassburg_druck", "ansehen", -0.02, 6, "Ein langes Verfahren nach Artikel 46 wird international beachtet.");
ee("korruption", "legitimitaet", -0.03, 6, "Korruption höhlt das Vertrauen in die Regeln aus.");
ee("rechtssicherheit", "legitimitaet", 0.03, 6, "Berechenbares Recht stützt die Legitimität.");
ee("legitimitaet", "vertrauen_regierung", 0.04, 3, "Rechtmäßig empfundene Regierungen genießen mehr Vertrauen.");
ee("legitimitaet", "vertrauen_maerkte", 0.02, 6, "Investoren schätzen berechenbare Regeln.");
ee("m_verteidigung", "bereitschaft_heer", 0.02, 6, "Mehr Mittel für Munition, Wartung und Ersatzteile.");
ee("m_verteidigung", "bereitschaft_luft", 0.02, 6, "Mehr Mittel für Flugstunden und Ersatzteile.");
ee("m_verteidigung", "bereitschaft_see", 0.02, 6, "Mehr Mittel für Seetage und Werften.");
ee("m_verteidigung", "modernisierung", 0.03, 12, "Neue Systeme kommen erst nach Jahren.");
ee("m_ruestungsindustrie", "ruestungsautarkie", 0.05, 12, "Eigene Fabriken ersetzen Importe.");
ee("m_ruestungsindustrie", "modernisierung", 0.02, 12, "Neue Systeme aus eigener Fertigung.");
ee("m_wehrdienst", "bereitschaft_heer", 0.03, 6, "Mehr Wehrpflichtige und längere Dienstzeit stärken die Masse des Heeres.");
ee("m_wehrdienst", "truppenmoral", -0.02, 3, "Wer zum Dienst gezwungen wird, dient weniger gern.");
ee("m_wehrdienst", "junge", -0.06, 1, "Junge Männer verlieren Monate an Ausbildung und Beruf.");
ee("m_wehrdienst", "arbeitnehmer", -0.02, 3, "Fehlende Arbeitskräfte und Kosten für Familien.");
ee("m_wehrdienst", "konservative", 0.03, 1, "Wehrdienst gilt als nationale Pflicht.");
ee("m_wehrdienst", "militaer", 0.02, 6, "Die Streitkräfte gewinnen an Umfang.");
ee("m_uebungen", "bereitschaft_heer", 0.05, 6, "Übungen halten Verbände einsatzfähig.");
ee("m_uebungen", "bereitschaft_luft", 0.04, 6, "Flugstunden halten Piloten in Form.");
ee("m_uebungen", "bereitschaft_see", 0.04, 6, "Seetage halten Besatzungen in Form.");
ee("m_uebungen", "truppenmoral", 0.02, 3, "Gute Ausbildung stärkt das Selbstvertrauen.");
ee("m_offiziersauswahl", "offiziersvertrauen", 0.05, 6, "Beförderung nach Leistung schafft Vertrauen in die Führung.");
ee("m_offiziersauswahl", "truppenmoral", 0.03, 6, "Gerechte Beförderung wirkt bis in die Truppe.");
ee("m_offiziersauswahl", "bereitschaft_heer", 0.02, 12, "Qualifizierte Führung verbessert die Einsatzbereitschaft.");
ee("m_offiziersauswahl", "abschreckung", 0.02, 12, "Eine kompetente Führung wird ernster genommen.");
ee("bereitschaft_heer", "abschreckung", 0.03, 3, "Einsatzbereite Verbände schrecken ab.");
ee("bereitschaft_luft", "abschreckung", 0.03, 3, "Einsatzbereite Luftwaffe schreckt ab.");
ee("bereitschaft_see", "abschreckung", 0.02, 3, "Einsatzbereite Marine schreckt ab.");
ee("bereitschaft_heer", "militaer", 0.02, 3, "Die Stärke der Streitkräfte hängt an ihrer Bereitschaft.");
ee("bereitschaft_luft", "militaer", 0.02, 3, "Die Stärke der Streitkräfte hängt an ihrer Bereitschaft.");
ee("bereitschaft_see", "militaer", 0.02, 3, "Die Stärke der Streitkräfte hängt an ihrer Bereitschaft.");
ee("modernisierung", "abschreckung", 0.04, 6, "Moderne Systeme verändern die Rechnung des Gegners.");
ee("modernisierung", "bereitschaft_heer", 0.01, 6, "Neues Gerät ist meist besser gewartet.");
ee("modernisierung", "export", 0.01, 12, "Bewährte Systeme sind Exportprodukte.");
ee("ruestungsautarkie", "export", 0.02, 12, "Eigene Industrie exportiert.");
ee("ruestungsautarkie", "abschreckung", 0.02, 12, "Wer nicht von Lieferungen abhängt, kann nicht erpresst werden.");
ee("ruestungsautarkie", "beziehungen_usa", -0.01, 12, "Weniger Abhängigkeit heißt weniger Hebel für Washington.");
ee("truppenmoral", "bereitschaft_heer", 0.03, 3, "Motivierte Soldaten sind einsatzbereiter.");
ee("truppenmoral", "abschreckung", 0.02, 6, "Ein motiviertes Heer wird ernst genommen.");
ee("offiziersvertrauen", "truppenmoral", 0.02, 6, "Vertrauen in die Führung hebt die Stimmung.");
ee("offiziersvertrauen", "bereitschaft_heer", 0.02, 6, "Eine Führung mit Vertrauen entscheidet schneller.");
ee("abschreckung", "terrorgefahr", -0.01, 6, "Starke Streitkräfte schwächen Gruppen im Grenzgebiet.");
ee("abschreckung", "konservative", 0.03, 1, "Ein Teil der Wähler will ein starkes Heer.");
ee("abschreckung", "ansehen", 0.01, 12, "Ein starker Staat wird als Partner gesucht.");
ee("abschreckung", "vertrauen_regierung", 0.01, 6, "Sicherheit stärkt das Vertrauen.");
ee("m_denkmalschutz", "kulturerbe", 0.06, 12, "Restaurierung und Pflege heben den Zustand der Stätten.");
ee("m_denkmalschutz", "tourismus", 0.02, 12, "Gepflegte Stätten ziehen Gäste an.");
ee("m_denkmalschutz", "identitaet", 0.02, 12, "Historische Orte stiften Zusammenhalt.");
ee("m_denkmalschutz", "konservative", 0.02, 1, "Das Erbe der Vorfahren zählt.");
ee("m_denkmalschutz", "staedtische_saekulare", 0.02, 1, "Erhalt historischer Städte ist ihr Anliegen.");
ee("m_denkmalschutz", "wohnungsbau", -0.01, 12, "Auflagen bremsen Neubau in Altstädten.");
ee("m_kulturfoerderung", "identitaet", 0.03, 6, "Kunst und Feste stiften Gemeinschaft.");
ee("m_kulturfoerderung", "junge", 0.02, 3, "Junge Menschen nutzen Bühnen und Festivals.");
ee("m_kulturfoerderung", "staedtische_saekulare", 0.03, 1, "Kulturförderung ist ihnen ein Kernanliegen.");
ee("m_kulturfoerderung", "zivilgesellschaft", 0.02, 6, "Kulturvereine sind ein Teil der Zivilgesellschaft.");
ee("m_kulturfoerderung", "tourismus", 0.01, 12, "Festivals bringen Gäste.");
ee("m_archaeologie", "kulturerbe", 0.02, 12, "Ausgrabungen sichern Funde vor Raubgrabung.");
ee("m_archaeologie", "tourismus", 0.03, 12, "Neue Funde und Museen ziehen Gäste an.");
ee("m_archaeologie", "identitaet", 0.02, 12, "Die Geschichte des Landes wird sichtbar.");
ee("m_archaeologie", "ansehen", 0.02, 12, "Wer forscht und zeigt, gewinnt Ansehen.");
ee("m_archaeologie", "hochschule", 0.01, 12, "Ausgrabungen binden Fakultäten und Studierende.");
ee("m_minderheitenrechte", "vielfalt", 0.08, 6, "Rechte auf Sprache, Schule und Gebetsstätten heben die Akzeptanz.");
ee("m_minderheitenrechte", "polarisierung", 0.02, 3, "Zu Beginn wächst der Streit um Zugeständnisse.");
ee("m_minderheitenrechte", "konservative", -0.04, 1, "Ein Teil der Wähler sieht die Einheit des Landes berührt.");
ee("m_minderheitenrechte", "staedtische_saekulare", 0.04, 1, "Gleiche Rechte sind ihnen wichtig.");
ee("m_minderheitenrechte", "junge", 0.02, 1, "Junge sehen es meist gelassener.");
ee("m_minderheitenrechte", "ansehen", 0.03, 6, "Minderheitenrechte werden international beachtet.");
ee("m_minderheitenrechte", "beziehungen_eu", 0.03, 6, "Kopenhagener Kriterien: Schutz von Minderheiten.");
ee("m_minderheitenrechte", "zivilgesellschaft", 0.03, 6, "Vereine der Gemeinden können frei arbeiten.");
ee("m_minderheitenrechte", "identitaet", -0.02, 3, "Manche sehen die gemeinsame Identität geschwächt.");
ee("kulturerbe", "tourismus", 0.04, 6, "Gepflegte Stätten sind das Ziel der Kulturreisenden.");
ee("kulturerbe", "ansehen", 0.02, 12, "Weltbekannte Stätten prägen das Bild des Landes.");
ee("kulturerbe", "identitaet", 0.02, 12, "Ein gepflegtes Erbe stärkt den Zusammenhalt.");
ee("tourismus", "kulturerbe", -0.01, 12, "Besucherdruck belastet Stätten wie Pamukkale und Ephesos.");
ee("identitaet", "polarisierung", -0.02, 6, "Gemeinsame Erzählungen mildern den Streit.");
ee("identitaet", "vertrauen_regierung", 0.01, 6, "Zusammenhalt stärkt das Vertrauen.");
ee("identitaet", "konservative", 0.02, 1, "Ein Teil der Wähler schätzt Symbole und Geschichte.");
ee("vielfalt", "polarisierung", -0.03, 6, "Wer sich anerkannt fühlt, streitet weniger.");
ee("vielfalt", "ansehen", 0.03, 6, "Vielfalt wird im Ausland wahrgenommen.");
ee("vielfalt", "zivilgesellschaft", 0.03, 6, "Gemeinden gründen Vereine und Stiftungen.");
ee("vielfalt", "tourismus", 0.01, 12, "Vielfalt macht Städte wie Mardin und Antakya besuchenswert.");
ee("vielfalt", "beziehungen_eu", 0.02, 6, "Minderheitenschutz gehört zum Beitrittsweg.");
ee("m_religionsbehoerde", "vielfalt", -0.03, 6, "Wer eine Auslegung bevorzugt, schwächt die Akzeptanz anderer Gemeinschaften.");
ee("m_religioese_schulen", "vielfalt", -0.02, 12, "Ein Schwerpunkt auf eine Richtung lässt weniger Raum für andere.");
ee("m_integration", "vielfalt", 0.03, 12, "Wer aufgenommen wird, gehört dazu.");
ee("erdbebenvorsorge", "kulturerbe", 0.02, 12, "Verstärkte Gebäude schützen auch Denkmäler.");
ee("m_instandhaltung", "wartungszustand", 0.06, 6, "Wartung und Erneuerung heben den Zustand.");
ee("m_instandhaltung", "verkehrsnetz", 0.02, 12, "Gepflegte Straßen sind befahrbarer.");
ee("m_instandhaltung", "stromversorgung", 0.02, 12, "Erneuerte Leitungen fallen seltener aus.");
ee("m_instandhaltung", "bauwirtschaft", 0.03, 3, "Aufträge für Bau- und Wartungsfirmen.");
ee("m_instandhaltung", "arbeitnehmer", 0.01, 3, "Sichere Arbeit im Bau.");
ee("wartungszustand", "verkehrsnetz", 0.03, 6, "Gepflegte Straßen sind schneller und sicherer.");
ee("wartungszustand", "bahnnetz", 0.02, 6, "Gepflegte Gleise erlauben höhere Geschwindigkeit.");
ee("wartungszustand", "stromversorgung", 0.03, 6, "Gepflegte Leitungen und Kraftwerke fallen seltener aus.");
ee("wartungszustand", "logistik", 0.02, 6, "Weniger Sperrungen und Ausfälle.");
ee("wartungszustand", "wasserversorgung", 0.02, 6, "Weniger Verluste in den Leitungen.");
ee("m_autobahnen", "wartungszustand", -0.01, 12, "Mehr Anlagen brauchen mehr Pflege.");
ee("m_bahn", "wartungszustand", -0.01, 12, "Mehr Gleise brauchen mehr Pflege.");
ee("m_breitband", "wartungszustand", -0.005, 12, "Mehr Netz braucht mehr Pflege.");

// ---------------------------------------------------------------------------
// Weitere Wählergruppen (Block T1): Minderheiten, Nationalisten und Sicherheitsorientierte, Menschen in Armut.
// Wie alle Wählergruppen starten sie in der Ruhelage; ihre Stimmung folgt den Verbindungen unten. Stärken und Verzögerungen sind
// Spielparameter, keine Messwerte; jede Verbindung trägt ihre Begründung. Bewusst am Ende der Knotenliste, damit ältere Spielstände
// ihre Werte beim Laden bekommen (Migration hängt neue Knoten hinten an).

grp("minderheiten", "Minderheiten", "Kurdinnen und Kurden, Aleviten, Christen und andere: achten auf Rechte, Sprache, Sicherheit und die Lage ihrer Regionen.");
grp("nationalisten", "Nationalisten und Sicherheitsorientierte", "Achten auf die Stärke des Staates, auf Grenzen, Sicherheit und den Zusammenhalt des Landes.");
grp("arme", "Menschen in Armut", "Kommen kaum über die Runden: achten auf Preise, Sozialleistungen, Wohnen und Arbeit.");

// Minderheiten
ee("m_minderheitenrechte", "minderheiten", 0.05, 1, "Sprache, Schulen und Glaubensorte sind ihnen ein Kernanliegen.");
ee("m_friedensprozess", "minderheiten", 0.04, 1, "Ein Ende der Gewalt und eine politische Lösung sind ihnen wichtig.");
ee("m_versammlungsfreiheit", "minderheiten", 0.03, 1, "Wer demonstrieren darf, wird gehört.");
ee("m_regionalfoerderung", "minderheiten", 0.03, 3, "Ihre Regionen liegen bei Einkommen und Infrastruktur oft zurück.");
ee("m_notstand", "minderheiten", -0.03, 1, "Notstandsbefugnisse trafen im Südosten über Jahre den Alltag.");
ee("m_urteilsumsetzung", "minderheiten", 0.02, 3, "Wer sich auf Urteile verlassen kann, fühlt sich sicherer.");
ee("m_internetsperren", "minderheiten", -0.02, 1, "Gesperrte Plattformen treffen auch die Medien in ihren Sprachen.");
ee("ausnahmerecht", "minderheiten", -0.03, 0, "Sonderregeln verschieben das Gleichgewicht zu ihren Lasten.");
ee("justiz_unabhaengigkeit", "minderheiten", 0.02, 3, "Faire Verfahren sind für alle wichtig, die sich sonst schutzlos fühlen.");
ee("rechtssicherheit", "minderheiten", 0.02, 3, "Verlässliche Regeln schützen die, die sonst zuerst verlieren.");
ee("pressefreiheit", "minderheiten", 0.02, 3, "Eigene Medien und freie Berichte machen sie sichtbar.");
ee("vielfalt", "minderheiten", 0.04, 3, "Ob Vielfalt anerkannt wird, spüren sie im Alltag.");
ee("polarisierung", "minderheiten", -0.02, 1, "Tiefe Spaltung trifft Minderheiten zuerst.");
ee("p_polarisierung", "minderheiten", -0.03, 0, "Wo die Gesellschaft gespalten ist, sind sie die Zielscheibe.");
ee("wachstum_regional", "minderheiten", 0.03, 3, "Arbeit und Einkommen in ihren Regionen.");
ee("arbeitslosigkeit", "minderheiten", -0.03, 0, "Im Südosten liegt die Arbeitslosigkeit über dem Durchschnitt.");
ee("lebenshaltung", "minderheiten", -0.03, 0, "Auch sie zahlen die Preise.");

// Nationalisten und Sicherheitsorientierte
ee("m_verteidigung", "nationalisten", 0.03, 1, "Starke Streitkräfte sind ihnen ein Kern des Staates.");
ee("m_grenzschutz", "nationalisten", 0.04, 1, "Kontrolle an den Grenzen ist ihre erste Forderung.");
ee("m_polizei", "nationalisten", 0.03, 1, "Mehr Polizei ist für sie ein Zeichen von Ordnung.");
ee("m_ruestungsindustrie", "nationalisten", 0.03, 3, "Eigene Waffen machen unabhängig.");
ee("m_wehrdienst", "nationalisten", 0.03, 1, "Der Wehrdienst gilt als nationale Pflicht.");
ee("m_rueckkehr", "nationalisten", 0.03, 1, "Für sie ein Zeichen, dass die Regierung handelt.");
ee("m_integration", "nationalisten", -0.03, 1, "Sie sehen darin eine Dauerlösung, die sie nicht wollen.");
ee("m_friedensprozess", "nationalisten", -0.03, 1, "Manche sehen darin ein Zugeständnis an Gewalt.");
ee("m_minderheitenrechte", "nationalisten", -0.04, 1, "Für sie berührt es die Einheit des Landes.");
ee("m_eu_annaeherung", "nationalisten", -0.02, 1, "Sie misstrauen Brüsseler Bedingungen.");
ee("m_notstand", "nationalisten", 0.02, 1, "Ein starker Staat in der Krise ist ihnen recht.");
ee("m_haftvermeidung", "nationalisten", -0.02, 1, "Wird als Nachgiebigkeit gegenüber Straftätern gelesen.");
ee("terrorgefahr", "nationalisten", -0.04, 0, "Sicherheit vor Terror steht für sie an erster Stelle.");
ee("kriminalitaet", "nationalisten", -0.03, 0, "Unsicherheit und Kriminalität empören sie.");
ee("p_kriminalitaet", "nationalisten", -0.03, 0, "Unsicherheit auf den Straßen ärgert die, die Ordnung wollen.");
ee("gefluechtete", "nationalisten", -0.03, 0, "Die Zahl der Geflüchteten im Land ist ihnen zu hoch.");
ee("p_migrationsdruck", "nationalisten", -0.04, 0, "Spannungen um Migration nähren ihre Unzufriedenheit.");
ee("abschreckung", "nationalisten", 0.03, 1, "Ein Land, dem die Nachbarn Respekt zollen.");
ee("ansehen", "nationalisten", 0.02, 3, "Sie wollen, dass das Land in der Welt gehört wird.");
ee("identitaet", "nationalisten", 0.03, 3, "Symbole, Sprache und gemeinsame Geschichte.");
ee("lebenshaltung", "nationalisten", -0.03, 0, "Auch sie zahlen die Preise.");
ee("arbeitslosigkeit", "nationalisten", -0.02, 0, "Ohne Arbeit schwindet das Vertrauen in den Staat.");

// Menschen in Armut
ee("m_sozialhilfe", "arme", 0.05, 1, "Für viele der Unterschied zwischen Auskommen und Not.");
ee("m_arbeitslosengeld", "arme", 0.04, 1, "Ein Netz, wenn die Arbeit wegfällt.");
ee("m_kindergeld", "arme", 0.03, 1, "Familien mit wenig Geld spüren jeden Zuschuss.");
ee("m_mindestlohn", "arme", 0.03, 1, "Ein höherer Lohn am unteren Ende, sofern die Arbeit bleibt.");
ee("m_sozialwohnungen", "arme", 0.04, 3, "Wer sich keine Miete leisten kann, wartet auf sie.");
ee("m_mietdeckel", "arme", 0.03, 1, "Die Miete frisst den Lohn.");
ee("m_energiesubventionen", "arme", 0.04, 1, "Strom und Heizung sind ein großer Teil der Ausgaben.");
ee("m_preiskontrollen", "arme", 0.03, 1, "Niedrigere Preise im Regal, solange sie halten.");
ee("m_zuzahlungen", "arme", -0.04, 1, "Wer wenig hat, geht später zum Arzt.");
ee("m_mwst", "arme", -0.04, 1, "Verbrauchsteuern treffen die, die alles ausgeben müssen.");
ee("m_kraftstoffsteuer", "arme", -0.02, 1, "Teurer Sprit verteuert Wege und Waren.");
ee("m_hausarzt", "arme", 0.02, 3, "Eine Praxis in der Nähe spart Wege und Geld.");
ee("lebenshaltung", "arme", -0.05, 0, "Sie spüren die Teuerung zuerst.");
ee("lebensmittelpreise", "arme", -0.04, 0, "Ein großer Teil des Einkommens geht in Lebensmittel.");
ee("energiepreise", "arme", -0.03, 0, "Strom und Heizung werden zum Luxus.");
ee("mieten", "arme", -0.04, 0, "Die Miete ist der größte Posten.");
ee("armut", "arme", -0.05, 0, "Wer arm ist, misst die Regierung an dem, was im Portemonnaie bleibt.");
ee("p_armut", "arme", -0.05, 0, "Wo Armut zum Problem wird, kippt die Stimmung.");
ee("arbeitslosigkeit", "arme", -0.04, 0, "Ohne Arbeit gibt es kaum Auskommen.");
ee("realeinkommen", "arme", 0.04, 1, "Was der Lohn wert ist, entscheidet über den Monat.");
ee("informelle_arbeit", "arme", -0.02, 3, "Arbeit ohne Vertrag heißt: ohne Schutz.");
ee("gesundheitsversorgung", "arme", 0.02, 3, "Wer wenig hat, ist auf öffentliche Gesundheit angewiesen.");
ee("ungleichheit", "arme", -0.02, 3, "Der Abstand nach oben wird wahrgenommen.");
ee("p_wohnungsnot", "arme", -0.03, 0, "Kein Dach über dem Kopf ist keine Statistik.");
ee("sozialkassen", "arme", 0.02, 3, "Solide Kassen halten die Leistungen.");

// ---------------------------------------------------------------------------
// Wirtschaftsakte: Wer von Zinsen und Währung gewinnt oder verliert (WIRTSCHAFTSMODELL.md, Z10). Kleine Stärken, damit die Zinspolitik
// spürbar in die Stimmung der Gruppen läuft, ohne den Ausgangsverlauf zu verschieben.

ee("leitzins", "unternehmer", -0.012, 2, "Teure Kredite verkleinern den Spielraum von Betrieben und Selbständigen.");
ee("leitzins", "mittelstand", -0.015, 3, "Der Mittelstand lebt von Bankkrediten.");
ee("leitzins", "bauwirtschaft", -0.02, 3, "Wer nicht finanzieren kann, baut nicht.");
ee("leitzins", "gruendungen", -0.012, 4, "Gründer bekommen kaum Kredit, wenn die Zinsen hoch sind.");
ee("leitzins", "rentner", 0.01, 1, "Sparer und Rentner profitieren von hohen Zinsen.");
ee("leitzins", "junge", -0.008, 3, "Wohnung und Ausbildung auf Kredit werden teurer.");
ee("leitzins", "arbeitnehmer", -0.005, 6, "Wenn Betriebe weniger investieren, sind Jobs gefährdet.");
ee("abwertung", "mittelstand", -0.012, 2, "Importabhängige Betriebe zahlen mehr für Vorprodukte.");
ee("zinslast", "vertrauen_maerkte", -0.015, 3, "Wer viel für Zinsen ausgibt, hat weniger Spielraum: Anleger werden nervös.");

export const NODES: NodeSpec[] = N;
export const EDGES: EdgeSpec[] = E;

export const THEME_NAMES: Record<Theme, string> = {
  wirtschaft: "Wirtschaft",
  haushalt: "Haushalt und Steuern",
  arbeit: "Arbeit und Soziales",
  gesundheit: "Gesundheit",
  bildung: "Bildung und Fachkräfte",
  infrastruktur: "Infrastruktur und Verkehr",
  energie: "Energie und Umwelt",
  landwirtschaft: "Landwirtschaft und Wasser",
  wohnen: "Wohnen, Bau und Erdbeben",
  sicherheit: "Innere Sicherheit und Frieden",
  recht: "Recht und Justiz",
  militaer: "Streitkräfte",
  kultur: "Kultur und Erbe",
  gesellschaft: "Medien und Gesellschaft",
  aussen: "Außenpolitik und Migration",
  gruppen: "Wählergruppen",
};
