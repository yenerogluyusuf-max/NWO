# NWO — Ausgearbeitetes Spieldesign

Version 0.4, 28. September 2026. Aufbauend auf [Projektplan](PROJEKTPLAN.md) und [Referenzanalyse](REFERENZANALYSE.md).

Alle Mengen, Zeitziele und Beispielwerte dieses Dokuments sind Vorschläge für die Entwicklung. Sie sind keine recherchierten Kennzahlen zur heutigen Türkei oder zu einem anderen Land.

**Neu in Version 0.4:** Man soll aus NWO lernen, wie ein Staat funktioniert (siebte Säule, [Lernkonzept](LERNKONZEPT.md)), und es gibt kein vorgegebenes Szenario: Die Welt beginnt ohne eingebautes Problem, Krisen entstehen aus den Systemen.

**Neu in Version 0.3:** Spielspaß ist das oberste Designziel. Realismus ist das Mittel, nicht der Zweck. Jede Mechanik muss beide Fragen bestehen: Ist sie glaubwürdig? Und macht sie das Spiel spannender? Wenn eine Mechanik nur die erste Frage besteht, wird sie vereinfacht, delegiert oder gestrichen.

## 0. Warum man NWO spielen will

### Das Versprechen in einem Satz

Du regierst ein Land mit deinen eigenen Worten, und jede Entscheidung hat einen Preis, der dich später wieder einholt.

### Sieben Säulen des Spielspaßes

**1. Dilemmas statt Optimierung.** Wichtige Entscheidungen haben keine richtige Lösung. Jede Option nützt jemandem und schadet jemand anderem. Wenn Spieler nach drei Durchgängen eine beste Strategie gefunden haben, ist der Konflikt schlecht gebaut. Das Wirkungsmodell dient dazu, echte Zielkonflikte zu erzeugen, nicht dazu, eine optimale Antwort ausrechenbar zu machen.

**2. Figuren, an denen man hängt.** Der Spieler soll nach einer Stunde mindestens drei Personen beim Namen kennen und eine Meinung über sie haben. Dafür braucht jede Hauptfigur ein erkennbares Ziel, eine Schwäche, eine eigene Stimme und eine Beziehung zum Spieler, die sich verändern kann: der Minister, der ständig widerspricht und oft recht hat; die loyale Vertraute mit einem Geheimnis; der Rivale in der eigenen Partei. Figuren handeln nicht nur als Funktion ihres Amts, sondern auch aus Stolz, Angst, Ehrgeiz und Dankbarkeit.

**3. Die Vergangenheit kommt zurück.** Der stärkste Moment des Spiels ist, wenn eine frühere Entscheidung unerwartet wieder auftaucht: „Sie haben mir vor zwei Jahren versprochen …“. Gespeicherte Zusagen, Kränkungen, Gefallen und Geheimnisse werden deshalb aktiv wieder ins Spiel gebracht, nicht nur protokolliert. Das Ereignissystem sucht gezielt nach offenen Fäden, die sich plausibel wieder aufnehmen lassen.

**4. Druck und Rhythmus.** Es gibt immer etwas, das näher rückt: eine Wahl, eine Haushaltsabstimmung, ein Ultimatum, eine eskalierende Krise. Ruhige Phasen sind erlaubt, aber sie sind Atempausen zwischen Stürmen. Jede Spielsitzung von 30 bis 60 Minuten hat einen spürbaren Spannungsbogen: Problem, Zuspitzung, Entscheidung, erste Folge.

**5. Macht mit Preis statt Verbot.** Der Spieler darf fast alles versuchen, auch das Hässliche. Das Spiel sagt selten einfach „das geht nicht“, sondern zeigt, welche Wege es gibt und was sie kosten: wen man überzeugen, unter Druck setzen oder umgehen müsste, welches Risiko entsteht und wer davon erfahren könnte. Realismus zeigt sich vor allem als Konsequenz, nicht als Blockade. Jede Ablehnung enthält mindestens einen möglichen anderen Weg.

**6. Geschichten, die man weitererzählt.** Der Maßstab für eine gelungene Partie ist, dass der Spieler am nächsten Tag jemandem davon erzählen will: „Ich habe meinen Finanzminister entlassen, er ist zur Opposition gewechselt und hat mich bei der Wahl geschlagen.“ Das System wird darauf geprüft, ob es solche Geschichten aus seinen Regeln erzeugt.

**7. Verstehen, was man tut.** Der Spieler begreift nach und nach, wie Wirtschaft, Zentralbank, Institutionen und Medien funktionieren, weil er ihre Reaktionen selbst ausgelöst hat. Eine neutrale Mentorin erklärt im Moment der Neugier, ohne zu sagen, was richtig ist. Verstehen macht das Spiel besser: Wer die Zusammenhänge durchschaut, trifft mutigere Entscheidungen und erkennt, wenn ein Berater ihn täuscht. Einzelheiten im [Lernkonzept](LERNKONZEPT.md).

### Was Spaß tötet und deshalb vermieden wird

- **Aktenarbeit ohne Entscheidung.** Jede Information, die der Spieler lesen muss, führt zu einer Wahl oder erklärt eine Folge. Reine Pflichtlektüre wird zusammengefasst oder delegiert.
- **Folgen, die man nicht versteht.** Wenn etwas passiert, muss der Spieler den Zusammenhang zu seinen eigenen Entscheidungen erkennen können, zumindest im Nachhinein. Sonst fühlt sich Tiefe wie Zufall an.
- **Endlose Blockaden.** Mehr als zwei Ablehnungen hintereinander für dasselbe Ziel ohne neuen Weg sind ein Designfehler.
- **Belanglose Gespräche.** Jedes Gespräch verändert etwas: eine Beziehung, einen Wissensstand, einen Vorgang oder eine Zusage.
- **Wartezeit ohne Spannung.** Vorspulen endet immer bei etwas Interessantem.

### Der Spielspaß wird gemessen, nicht angenommen

Die sieben Säulen sind Prüfkriterien für jeden Spieltest (siehe [Entwicklungsplan](ENTWICKLUNGSPLAN.md), Stufe S0 und S1). Eine Mechanik, die konsistent, aber nicht spannend ist, gilt nicht als fertig.

## 1. Das konkrete Produkt

Ein Einzelspieler-Strategiespiel für den Desktop mit pausierbarer Zeit, realer Geografie und einer persönlichen politischen Rolle. Der Spieler beginnt mit einem belegten Länderzustand. Ab diesem Zeitpunkt läuft eine eigenständige Simulation.

Der wichtigste Unterschied zu einem reinen Gesprächsspiel: Ein Dialog kann nur Handlungen anstoßen, die in einem gemeinsamen Weltmodell existieren. Der wichtigste Unterschied zu einem abstrakten Länderstrategiespiel: Der Spieler muss innerhalb seines Amts und durch andere Personen handeln.

Die Kamera ist frei zwischen Welt und lokalen Gebieten beweglich. Die Bedienelemente bleiben über alle Maßstäbe hinweg konsistent. Ein Regierungschef darf einen Stadtbezirk untersuchen, ohne dadurch automatisch kommunale Entscheidungsrechte zu erhalten.

## 2. Drei Zeithorizonte schaffen Spielspannung

| Horizont | Typische Tätigkeit | Was eine Entscheidung interessant macht |
|---|---|---|
| Tage | Briefings, Gespräche, Reaktion auf neue Informationen | Zeitdruck und unvollständiges Wissen |
| Wochen und Monate | Umsetzung, Haushalt, Verhandlungen, Personalführung | Abhängigkeiten und Zielkonflikte |
| Jahre | Wahlen, Infrastruktur, institutionelle Entwicklung | Dauerhafte Folgen und politische Erinnerung |

Der Spieler kann bis zum nächsten wichtigen Vorgang vorspulen. Pausengründe sind Fristen, neue Entscheidungsvorlagen und vom Spieler gewählte Warnbedingungen. Routine erzeugt zusammengefasste Meldungen.

Die Simulation nutzt zunächst einen festen Tagesschritt. Ein Krieg oder eine Krise kann pro Tag mehr relevante Vorgänge erzeugen, ohne die Wirtschaft auf ein völlig anderes Zeitmodell umzustellen. Ob später feinere militärische Zeitschritte nötig sind, wird anhand des Prototyps entschieden.

Ein erstes Ziel für Nutzertests: Innerhalb einer Sitzung von ungefähr 30 bis 60 Minuten einen Konflikt verstehen, mehrere zusammenhängende Entscheidungen treffen und eine erste Rückmeldung erleben. Das ist ein Prüfziel, kein bereits gemessener Wert.

## 3. Einstieg und erste 30 Minuten

### Startkonfiguration

1. Land wählen (zuerst die Türkei, mit belegtem Datenstichtag; weitere Länder folgen). Es gibt kein Szenario auszuwählen: Die Welt startet in einem leicht variierten Zustand ohne eingebautes Problem.
2. Rolle wählen: im ersten Prototyp Regierung; Opposition folgt vor der ersten vollständigen Veröffentlichung.
3. Öffentliche Ausgangslage, Datenlücken und wichtige institutionelle Grenzen ansehen.
4. Persönliche politische Ziele formulieren oder Vorschläge auswählen.
5. Informationshilfen, Lernstufe der Mentorin (begleitet, Standard, allein), Delegation und Pausen einstellen.

Der Spieler übernimmt ein echtes Amt innerhalb eines realen Ausgangsszenarios. Der Übergang zur gespielten alternativen Geschichte wird ausdrücklich benannt. Reale öffentliche Biografien und simulierte persönliche Eigenschaften bleiben unterscheidbar.

### Erster Spielkontakt

- **Ankunft:** Eine kurze Amtsübergabe nennt Befugnisse und drei wichtige Probleme.
- **Orientierung:** Der Spieler öffnet eine Region und eine dazugehörige Akte.
- **Erster Auftrag:** Er fragt einen Berater nach Alternativen. Daraus entsteht eine sichtbare Prüfaufgabe.
- **Erste Entscheidung:** Eine kleine, überschaubare Vorlage verlangt einen echten Zielkonflikt.
- **Erste Folge:** Nach Zeitfortschritt trifft eine Rückmeldung ein; der Spieler kann ihre Verbindung zum Auftrag untersuchen.

Das Tutorial erklärt Begriffe im konkreten Vorgang. Fachbegriffe bleiben nachschlagbar. Fortgeschrittene Spieler können die Einführung überspringen.

## 4. Oberfläche: Ein Objekt, eine Heimat, ein Zustand

Die Oberfläche ist bei NWO das eigentliche Spiel: Der Spieler erlebt die Simulation nur durch sie. Eine tiefe, aber unlesbare Simulation wirkt wie Zufall. Deshalb wird die Oberfläche von Anfang an mitentwickelt und im ersten Spieltest geprüft.

### Das zentrale Objekt: der Vorgang

Alles, was im Spiel geschieht, ist ein Vorgang: ein Bericht, ein Angebot, ein Projekt, eine Krise, ein Streit im Kabinett. Ein Vorgang hat Beteiligte, einen Zustand, eine Frist und eine Geschichte. Karte, Personen und Gespräche sind unterschiedliche Blicke auf Vorgänge. Wer dieses eine Bild verstanden hat, versteht das ganze Spiel.

### Der Schreibtisch ist die Heimat

| Ansicht | Rolle | Hauptfrage |
|---|---|---|
| Schreibtisch | Heimat, hier beginnt und endet jeder Spieltag | Was verlangt heute meine Aufmerksamkeit? |
| Gespräch | Wird aus einem Vorgang oder einer Person heraus geöffnet | Was will ich erfahren, verhandeln oder anordnen? |
| Beziehungen | Werkzeug, bei Bedarf aufgerufen | Mit wem kann ich etwas erreichen, wer ist gegen mich? |
| Karte | Werkzeug, wenn die Frage räumlich ist | Wo wirkt sich etwas aus? |

Die vier Ansichten sind nicht gleichrangig. Es gibt keinen Zustand mit vielen gleichzeitig geöffneten Fenstern. Der Spieler kehrt immer zum Schreibtisch zurück.

### Absicht, Beschluss, Wirkung auf einen Blick

Die wichtigste Unterscheidung des Spiels bekommt eine feste, überall gleiche Bildsprache:

- **Absicht** (angekündigt, beauftragt, in Prüfung): gestrichelter Rand.
- **Beschluss** (entschieden, finanziert, unterschrieben): durchgezogener Rand.
- **Wirkung** (tatsächlich eingetreten, gemessen): gefüllte Fläche.

Zusätzlich trägt jeder Zustand ein Wort und ein Symbol, damit die Unterscheidung nicht allein von der Form abhängt.

### Gespräche hinterlassen sichtbare Karten

Jeder Satz mit Wirkung erzeugt direkt im Gesprächsverlauf eine kleine Karte, etwa „Prüfauftrag an den Innenminister, Frist 14 Tage“ oder „Zusage an die Bürgermeisterin: Finanzierung bis Jahresende“. Die Karte wandert in den Schreibtisch und in die Akte des Vorgangs. Zusagen und Drohungen werden ebenso sichtbar gespeichert. So geht nichts in einem langen Chatverlauf verloren, und der Spieler sieht sofort, dass seine Worte etwas ausgelöst haben.

### Jede Zahl beantwortet „Warum?“

Die Oberfläche bleibt ruhig; Tiefe liegt einen Klick entfernt. Jeder Wert und jede Behauptung lässt sich öffnen und zeigt verschachtelt: woher der Wert kommt, was ihn zuletzt verändert hat, wer das weiß und wie sicher es ist. Aus der Erklärung führt ein Klick zur verantwortlichen Person oder zum auslösenden Vorgang.

### Aufmerksamkeit ist knapp und sichtbar

Das tägliche Briefing zeigt höchstens drei bis fünf Punkte, geordnet nach Dringlichkeit und Tragweite. Alles andere wird delegiert und als Zusammenfassung gemeldet. Die Auswahl, womit sich der Spieler selbst befasst, ist eine Spielentscheidung: Was er nicht selbst ansieht, erledigen andere nach ihren eigenen Vorstellungen.

### Designsystem

Wenige Farben mit fester Bedeutung, eine Schrift für Akten und eine für Gespräche, feste Symbole für Personen, Institutionen, Geld, Fristen und Geheimnisse. Kein Element bekommt eine Sonderdarstellung, nur weil es neu ist. Farben werden immer durch Symbole und Beschriftungen ergänzt; Schriftgrößen und Kontraste sind anpassbar.

### Informationshierarchie

Oben stehen Datum, Pausensteuerung und wenige selbst gewählte Lageindikatoren. Die Hauptfläche zeigt Schreibtisch, Akte oder Gespräch. Ein dauerhaft erreichbares Vorgangsfeld enthält wichtige Fristen und neue Informationen. Eine Meldung führt direkt zur zuständigen Akte; der Spieler muss eine Geschichte nicht aus verstreuten Menüs zusammensuchen.

### Prüfkriterium der Oberfläche

Eine Testperson kann nach 15 Minuten ohne Hilfe sagen, welche drei Vorgänge gerade am wichtigsten sind, was davon nur beabsichtigt und was bereits beschlossen ist, und warum sich ein angezeigter Wert zuletzt verändert hat.

## 5. Politische Macht als konkrete Handlungsmöglichkeit

Ein allgemeiner Machtwert würde wichtige Unterschiede verdecken. NWO unterscheidet:

- **Rechtliche Befugnisse:** Welche Entscheidungen darf das Amt treffen?
- **Politische Unterstützung:** Welche Akteure tragen den konkreten Vorschlag mit?
- **Administrative Kapazität:** Wer kann ihn bearbeiten und umsetzen?
- **Finanzielle Mittel:** Welche laufenden und künftigen Verpflichtungen sind tragbar?
- **Zeit und Aufmerksamkeit:** Welche Konflikte kann die Führung selbst bearbeiten?
- **Vertrauen und Glaubwürdigkeit:** Welche Zusagen halten andere für belastbar?

Diese Faktoren können übersichtlich zusammengefasst werden, bleiben aber einzeln untersuchbar. Hohe Beliebtheit ersetzt keine fehlende Zuständigkeit. Ausreichendes Geld ersetzt nicht sofort fehlendes Personal.

Ein Reformprogramm ist ein Netz konkreter Vorhaben mit Voraussetzungen, Verantwortlichen und Meilensteinen. Wahlversprechen können darin verankert werden. Es gibt keine vorbestimmte politische Zukunft, die allein durch das Abarbeiten eines Baums freigeschaltet wird.

### Wege statt Verbote

Fehlt eine Voraussetzung, zeigt das Spiel keine bloße Ablehnung, sondern die möglichen Wege zum Ziel. Jeder Weg nennt, wen er braucht, was er kostet und welches Risiko er birgt. Beispiel für eine Maßnahme ohne eigene Zuständigkeit:

- **Offizieller Weg:** Gesetzesvorlage einbringen; dauert Wochen, braucht eine Mehrheit, ist öffentlich.
- **Über Personen:** einen zuständigen Amtsträger überzeugen; kostet einen Gefallen oder eine Zusage.
- **Unter Druck:** einen zuständigen Amtsträger drängen oder ersetzen; schnell, aber es gibt Zeugen, Widerstand und die Gefahr, dass es bekannt wird.
- **Verzichten oder umformulieren:** das eigentliche Ziel mit einem anderen, erlaubten Mittel verfolgen.

Der Spieler wählt, das System rechnet die Folgen. Spannend ist nicht, ob etwas möglich ist, sondern was es ihn kostet.

## 6. Vom Satz zum Staatsvorgang

### Unterstützte Handlungstypen

Der erste vollständige Handlungskatalog enthält Informationsanfrage, Prüfung, Konsultation, Delegation, Personalentscheidung, Haushaltspriorität, Vorbereitung eines Gesetzes, zulässige Verwaltungsanordnung, diplomatisches Angebot, Vertragsentwurf, Beschaffungsauftrag und strategische Sicherheitsentscheidung.

Neue Handlungen müssen Zuständigkeit, Ressourcen und beobachtbare Folgen besitzen. Ein beliebiger Text kann nicht automatisch jede denkbare Funktion des Spiels erzeugen.

### Verarbeitungsfolge

1. Absicht und angesprochene Person erkennen.
2. Personen, Gebiete, Termine und Vorhaben eindeutig zuordnen.
3. Zulässige Interpretation mit dem tatsächlichen Rollenwissen verbinden.
4. Bei wesentlicher Mehrdeutigkeit nachfragen.
5. Befugnisse, notwendige Verfahren und Ressourcen prüfen.
6. Den Auftrag in verständlicher Sprache zusammenfassen.
7. Einen verbindlichen Vorgang erzeugen oder eine begründete Ablehnung liefern, die immer mindestens einen anderen möglichen Weg nennt.
8. Später über Status und Folgen berichten.

Normale Gesprächsbeiträge erzeugen keine zusätzlichen Bestätigungsdialoge. Eine notwendige Unterschrift oder formale Entscheidung wird als Teil der Spielhandlung gezeigt.

### Zustände eines Vorgangs

**Entwurf → Prüfung → Entscheidung ausstehend → beschlossen → Umsetzung → abgeschlossen.**

Weitere mögliche Zustände sind blockiert, abgelehnt, ausgesetzt, zurückgezogen und gescheitert. Ein Vorgang darf mehrere Teilverfahren haben. Der Status sagt stets, ob eine Absicht, ein Beschluss oder eine tatsächliche Wirkung gemeint ist.

Der Spieler kann nachfragen: „Was blockiert das?“, „Wer ist zuständig?“, „Was geschieht bei einer Verschiebung?“ oder „Welche meiner Zusagen betrifft das?“

## 7. Personen und institutionelle Konflikte

Personen haben getrennte Werte beziehungsweise Einschätzungen für Fachwissen, Umsetzung, Verhandlung, Integrität und politische Beziehungen. Beobachtbare Biografie und verborgene Eigenschaften werden getrennt gespeichert.

Die Persönlichkeit beeinflusst, welche Informationen jemand hervorhebt, wie er widerspricht und welche Kompromisse akzeptabel sind. Fachliche Schlussfolgerungen müssen trotzdem auf vorhandenen Informationen beruhen.

### Die Mentorin

Neben den parteiischen Beratern gibt es eine neutrale Mentorin (Arbeitstitel Prof. Dr. Defne Arslan, fiktive Figur, frühere Ökonomin der Zentralbank). Sie erklärt Begriffe, Zusammenhänge und Folgen, sagt aber nie, was richtig ist. Der Kontrast ist gewollt: Der Spieler lernt nebenbei, dass politische Berater selten neutral sind. Einzelheiten im [Lernkonzept](LERNKONZEPT.md), Abschnitt 4.

### Hauptfiguren brauchen eine Seele

Jede Hauptfigur erhält neben den Fachwerten ein erkennbares persönliches Ziel, eine Schwäche, eine eigene Sprechweise und eine sich verändernde Beziehung zum Spieler. Figuren erinnern sich an Kränkungen, Gefallen und gebrochene Zusagen und handeln auch aus Stolz, Angst, Ehrgeiz oder Dankbarkeit. Sie können dem Spieler gefallen, ihn enttäuschen, verraten oder überraschend retten. Ein Rivale gewinnt manchmal, ein unbequemer Berater hat manchmal recht.

Im ersten Prototyp sind wenige Figuren wichtiger als viele: Lieber sechs Personen, die man kennt, als zwanzig, die man verwechselt.

Institutionen besitzen ein Mandat, Zuständigkeiten, Ressourcen, Führung, Verfahren und interne Interessen. Persönliche Einflussnahme kann Verhalten verändern, ersetzt aber keine vollständige Simulation durch einen Loyalitätsregler.

Auch autoritäre Entwicklungen werden als Veränderungen konkreter Institutionen, Abhängigkeiten und Informationswege modelliert. Das Spiel darf weder automatische totale Kontrolle noch eine universelle, sofortige Gegenreaktion der Gesellschaft annehmen.

## 8. Gesellschaft, Geschichte und Wahlen

Die grundlegende Bevölkerungseinheit ist eine gewichtete Gruppe in einer Region. Das Modell verfolgt wirtschaftliche Lage, Prioritäten, Bindungen, Vertrauen und politische Teilnahme. Überschneidende Eigenschaften dürfen nicht zu mehrfach gezählter Bevölkerung führen.

Parteien organisieren Kandidaten, regionale Netzwerke und Positionen. Eine Wahl wird durch das landesspezifische Verfahren ausgewertet. Stimmen, Sitze und tatsächliche Regierungsbildung sind unterschiedliche Schritte.

Politische Vorgeschichte wird in Ereignissen und veränderten Erwartungen gespeichert. Erinnerungen können an Bedeutung verlieren, aber durch neue Ereignisse wieder relevant werden. Unterschiedliche Gruppen erinnern dieselbe Amtszeit unterschiedlich.

Opposition erhält eigene Handlungen: Anfragen, parlamentarische Initiativen, Bündnisgespräche, Kandidatenaufbau, Wahlkampf und gegebenenfalls Verantwortung auf regionaler Ebene. Die Regierung anderer Parteien folgt denselben institutionellen Regeln.

## 9. Wirtschaft und Politikfolgen

Für den ersten Prototyp werden wenige nachvollziehbare Wirtschaftsbereiche gewählt: öffentlicher Haushalt, Einkommen und Beschäftigung, Energie, eine wichtige Produktionsbranche sowie Investitionen. Später kommen weitere Branchen und detailliertere Finanzbeziehungen hinzu.

Bestände und Ströme bleiben getrennt: Vermögen und Schulden sind Bestände; Einnahmen, Ausgaben und Finanzierung sind Vorgänge über einen Zeitraum. Nominale und reale Werte erhalten eindeutige Einheiten. Ein fehlender Datenwert wird nicht zu null.

Eine Maßnahme benötigt einen Umsetzungsgrad. Erst der umgesetzte Anteil erzeugt die entsprechende Leistungswirkung; Erwartungen können schon früher reagieren. Rückkopplungen und Verzögerungen werden ausdrücklich dokumentiert.

Eine wirtschaftliche Veränderung wird nicht pauschal einer einzigen politischen Handlung zugerechnet. Die Akte nennt beobachtete Auslöser und alternative Erklärungen. Entwickler können im Debugmodus genaue interne Beiträge untersuchen; normale Berater kennen nur ihre Informationslage.

## 10. Regionen, Infrastruktur und Umwelt

Verwaltungsgebiete bilden die politische Karte, Infrastruktur bildet ein verbundenes Netz. Häfen, Straßen, Bahnverbindungen, Stromversorgung und andere Einrichtungen werden in der ersten Version nur so detailliert simuliert, wie es für die Kernentscheidungen notwendig ist.

Regionale Spezialisierung entsteht aus bestehenden Voraussetzungen und Entscheidungen. Ein Förderprogramm garantiert keine erfolgreiche Ansiedlung. Fachkräfte, Nachfrage, Versorgung und Erreichbarkeit können fehlen.

Katastrophenrisiken bestehen aus Gefahr, Exposition und Verwundbarkeit. Vorsorge verändert die Folgen. Der Wiederaufbau konkurriert mit anderen Vorhaben um Haushalt, Personal und Material.

Auf Stadtbezirksebene zeigt die Karte vorhandene Daten und ihre Unsicherheit. Wenn nur Daten für eine größere Region vorliegen, wird diese räumliche Grenze kenntlich gemacht. Eine feinere Karte bedeutet nicht automatisch feinere Statistik.

## 11. Diplomatie und Vertragsverhandlungen

Ein diplomatisches Gespräch beginnt mit Interessen und einem Verhandlungsmandat. Angebote bestehen aus konkreten Klauseln. Parteien können einzelne Klauseln ändern, Bedingungen hinzufügen oder Gegengeschäfte vorschlagen.

Ein Vertragsdatensatz enthält Parteien, Vertretungsbefugnis, Verpflichtungen, Fristen, Bedingungen, Öffentlichkeit, Zustimmungserfordernisse, Erfüllungsstand und Beendigungsmöglichkeiten.

Öffentliche und vertrauliche Teile sind technisch getrennt. Jeder Akteur erhält nur die ihm bekannten Teile. Eine Veröffentlichung muss auf einen nachvollziehbaren Informationsvorgang zurückgehen und darf nicht bei Bedarf durch den Erzähler erfunden werden.

Bei einem Regierungswechsel wird geprüft, ob sich politischer Wille, Rechtslage oder eine vertragliche Bedingung verändert haben. Verträge verschwinden nicht automatisch mit ihren Unterzeichnern.

Internationale Organisationen erhalten spezialisierte Verfahren. Ein Verteidigungsbündnis, ein Gericht und eine Handelsorganisation verwenden keine gemeinsame universelle Zustimmungsmechanik.

## 12. Beschaffung und militärische Fähigkeiten

### Ein vollständiger Rüstungsvorgang

**Bedarf → Haushaltsrahmen → Angebote → Prüfung → Vertrag → Produktion/Lieferung → Ausbildung und Integration → Einsatzbereitschaft → laufender Betrieb.**

Die Angebotsansicht vergleicht Leistungsprofil, Verfügbarkeit, Preisbasis, Folgekosten, Finanzierung und politische Bedingungen. Wo reale Details nicht öffentlich bekannt sind, werden breite Kategorien und gekennzeichnete Spielannahmen verwendet.

Ein Liefervertrag reserviert Kapazitäten beim Anbieter und bindet Ressourcen beim Käufer. Ein Embargo, ein politischer Streit oder eine Produktionsstörung kann den Verlauf verändern. Der Spieler bekommt eine Ursache und mögliche Handlungsoptionen.

Militärische Fähigkeiten werden zunächst als Verbände und Unterstützungsstrukturen modelliert. Personal, einsatzfähiges Material, Ausbildung, Versorgung und Führung begrenzen ihre Nutzbarkeit. Eine exakte Echtzeitabbildung jedes Waffensystems ist kein Anspruch des ersten Modells.

## 13. Krieg und Frieden als zusammenhängende Politik

Der Spieler setzt politische Ziele, priorisiert Ressourcen und wählt zwischen strategischen Vorschlägen. Militärische Lagebilder zeigen bekannte Informationen, vermutete Entwicklungen und Unsicherheiten getrennt.

Front- und Konfliktverläufe werden zunächst auf aggregierter Ebene simuliert. Reale operative Anleitungen sind dafür nicht erforderlich. Das Spiel bewertet Kräfte, Vorbereitung, Versorgung, Gelände und politische Grenzen innerhalb seines eigenen abstrakten Modells.

Die Bevölkerung reagiert auf Ziele, wahrgenommene Bedrohung, Verlauf, Belastungen und Berichterstattung. Unterstützung für einen Krieg ist nicht identisch mit Unterstützung für die Regierung.

Partner prüfen ihre konkreten Verpflichtungen und tatsächlichen Fähigkeiten. Kriegsführung verändert Handel, Haushalt, zivile Versorgung und Beziehungen. Besetzung, Kontrolle und internationale Anerkennung werden getrennt betrachtet.

Frieden kann schrittweise entstehen: Gespräche, Waffenruhe, Kontrolle der Vereinbarung und politische Regelung. Auch nach militärischem Erfolg bleiben Kosten, zerstörte Infrastruktur und ungelöste Konflikte bestehen.

## 14. Geschichten aus dem Spielzustand

Es gibt drei Arten von Inhalt:

- **Feste Ausgangsinformation:** belegter Szenariozustand und öffentliche Vorgeschichte.
- **Vorgang aus Regeln:** ein Projekt stockt, eine Vertragsfrist wird verpasst, eine Wahl steht an.
- **Plausibles Zufallsereignis:** eine Störung tritt unter dokumentierten Voraussetzungen ein.

Szenenvorlagen gestalten die Präsentation. Sie dürfen passende Personen zusammenführen und einen Konflikt erläutern, aber keine Ressourcen oder bereits entschiedenen Ergebnisse verändern.

Ein Ereignismanager begrenzt Wiederholungen und bündelt zusammengehörige Meldungen. Er darf fehlende Voraussetzungen nicht übergehen, nur um Spannung zu erzeugen. Eine ruhige Phase ist erlaubt und ermöglicht langfristige Planung.

## 15. Drei Testfälle für die Entwicklung

Das Spiel hat kein vorgegebenes Szenario. Die drei folgenden Fälle sind Ereignisvorlagen: Sie können in einer Partie entstehen, wenn ihre Voraussetzungen in der Welt vorliegen, und sie dienen der Entwicklung als reproduzierbare Prüffälle. Kein Spieler wird in einen dieser Fälle hineingesetzt.

Diese Fälle sind fiktiv und keine Aussagen über gegenwärtige Vorgänge in der Türkei. Im echten Startpaket entstehen vergleichbare Konflikte aus überprüften Ausgangsdaten und anschließender Simulation.

### A. Der Bericht und die Regierungskrise

**Ausgangslage:** Eine Journalistin berichtet über mögliche Unregelmäßigkeiten bei einem öffentlichen Projekt. Die Beweislage ist teilweise unbekannt. Zuständige Akteure haben unterschiedliche Informationen.

**Spielraum:** Der Spieler kann Informationen anfordern, eine Untersuchung im zulässigen Verfahren veranlassen, öffentlich reagieren oder Personalfragen aufwerfen. Andere Anweisungen werden ebenfalls anhand des institutionellen Modells geprüft.

**Verlauf:** Neue Informationen ändern die Haltung von Ministern, Parteien und Öffentlichkeit. Folgen hängen von tatsächlichem Geschehen, Bekanntwerden, Verfahren und politischer Vorgeschichte ab.

**Spätere Entscheidung:** Eine Untersuchung betrifft einen Verbündeten. Der Spieler muss auf ein konkretes Ergebnis reagieren, das nicht allein nach seiner gewünschten Erzählung erzeugt wird.

**Prüfkriterium:** Mindestens drei unterschiedliche, konsistente Verläufe. Protest und wirtschaftliche Reaktionen dürfen nicht automatisch nach jeder identischen Formulierung auftreten.

**Spaßkriterium:** Die Testperson ringt mindestens einmal hörbar mit einer Entscheidung, etwa zwischen der Loyalität zu einem Verbündeten und dem eigenen Ruf. Der harte Weg (Druck auf die Journalistin) ist möglich und verlockend, aber seine Folgen kommen später zurück.

### B. Das Angebot und die geheime Bedingung

**Ausgangslage:** Die Regierung prüft ein Rüstungsgeschäft. Ein ausländischer Partner bietet Finanzierung und erwartet zusätzliche langfristige Zusammenarbeit. Ein Teil des Vorschlags ist vertraulich.

**Spielraum:** Angebote vergleichen, Bedarf ändern, Gegenvorschläge machen, Haushaltsmittel vorbereiten, Bedingungen ablehnen oder den Vertrag auf dem erforderlichen Weg abschließen.

**Verlauf:** Verhandlungen binden Diplomaten, Finanzierung beeinflusst den Haushalt, Lieferungen hängen von Produktionskapazität ab. Partner reagieren auf die ihnen bekannten Informationen.

**Spätere Entscheidung:** Eine Lieferverzögerung oder eine politische Veränderung stellt das Vorhaben infrage. Die ursprünglichen Klauseln bestimmen, welche Optionen bestehen.

**Prüfkriterium:** Vertragsakte, Haushalt, Wissensstände, Lieferplan und Einsatzbereitschaft bleiben konsistent. Eine vertrauliche Klausel ist ohne Informationsereignis nicht öffentlich bekannt.

**Spaßkriterium:** Das Geheimnis erzeugt Spannung: Der Spieler weiß, dass es herauskommen könnte, und muss abwägen, wem er es anvertraut. Das Angebot ist so gebaut, dass Annehmen und Ablehnen beide gute Gründe haben.

### C. Die Region und der internationale Schock

**Ausgangslage:** Eine exportabhängige Region benötigt bessere Infrastruktur. Gleichzeitig verändert ein Ereignis bei einem Handelspartner die Nachfrage oder Versorgung.

**Spielraum:** Investitionen priorisieren, Finanzierung verändern, Unternehmen und örtliche Verwaltung konsultieren, internationale Alternativen verhandeln.

**Verlauf:** Ein Vorhaben kann wirtschaftlich sinnvoll bleiben, obwohl es kurzfristig keine Entlastung bringt. Verschiedene Bezirke und Beschäftigtengruppen reagieren unterschiedlich.

**Spätere Entscheidung:** Vor einer Wahl muss der Spieler zwischen rascher Unterstützung und einem langfristig wirksamen Projekt abwägen.

**Prüfkriterium:** Karte, wirtschaftlicher Verlauf und politische Reaktion beruhen auf derselben regionalen Struktur. Ein internationaler Schock wird nur einmal berechnet.

**Spaßkriterium:** Die Wahl zwischen schneller Hilfe und langfristigem Projekt fühlt sich als echtes Dilemma an, weil die Menschen der Region ein Gesicht haben, etwa eine Bürgermeisterin und ein Unternehmer, die Unterschiedliches brauchen.

## 16. Kampagnenende, Niederlagen und Wiederspielbarkeit

Eine Amtszeit endet mit einer politischen Bilanz: Ziele, tatsächliche Maßnahmen, Verteilung der Ergebnisse, gebrochene und erfüllte Zusagen sowie Entwicklungen außerhalb der eigenen Kontrolle.

Im Karrieremodus kann eine Wahlniederlage in die Opposition führen. Der Tod oder dauerhafte politische Rückzug der gespielten Figur beendet ihre persönliche Laufbahn; eine spätere Organisationskampagne könnte die Fortsetzung mit einer anderen Figur ermöglichen.

Wiederspielbarkeit entsteht durch unterschiedliche Ziele, Personenbeziehungen, Unsicherheit und eigenständige Akteure. Für Vergleichbarkeit kann dieselbe Zufallsgrundlage erneut verwendet werden. Die Rekonstruktion eines gespeicherten Verlaufs verwendet protokollierte Ereignisse und Sprachentscheidungen; ein identischer Zufallswert allein garantiert keine identischen neuen Modellantworten.

Schwierigkeitsoptionen betreffen Informationshilfen, Delegation und die Ausgangslage. Verdeckte Ressourcenboni der Gegenseite sind nicht als Standard geplant.

## 17. Grenzen des ersten Produkts

Das vollständige Ziel bleibt eine breite geopolitische Simulation. Die erste Version konzentriert sich auf ein gründlich modelliertes spielbares Land mit einer eigenständig handelnden Außenwelt.

Nicht für den ersten Umfang vorgesehen sind jede Straße, individuell simulierte Millionenbürger, weltweite Detailgleichheit, Echtzeitsynchronisierung mit Nachrichten, taktische Einzelgefechte und Mehrspieler.

Diese Abgrenzung reduziert den Entwicklungsumfang. Sie entfernt keine der Kernideen: freie Anweisungen, institutionelle Reaktionen, regionale Folgen, Personen, wirtschaftliche Wechselwirkungen, Diplomatie, Waffenhandel und strategische Konflikte werden früh gemeinsam geprüft.
