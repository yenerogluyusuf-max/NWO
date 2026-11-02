# NWO — Entwicklungsplan und überprüfbare Meilensteine

Version 0.4, 28. September 2026. Zusammen mit [Spieldesign](SPIELDESIGN.md), [Lernkonzept](LERNKONZEPT.md), [Wirtschaftsmodell](WIRTSCHAFTSMODELL.md) und [Referenzanalyse](REFERENZANALYSE.md) lesen.

**Neu in Version 0.4:** S1 ist kein festes Szenario mehr, sondern eine kleine lebendige Welt, in der Wirtschaft, Zentralbank, Politik und Medien gekoppelt sind. Neben dem Spaß-Tor gilt ein Lern-Tor. Der Papiertest S0 bleibt ein optionales, günstiges Werkzeug.

## 0. Neu in Version 0.3: Erst Spielspaß, dann Umfang

Version 0.2 prüfte vor allem, ob die Simulation korrekt ist. Das größte Risiko ist aber ein korrektes, langweiliges Spiel. Deshalb stehen vor dem technischen Prototyp zwei kleine Stufen, die nur eine Frage beantworten: **Will man weiterspielen?**

Die Reihenfolge lautet jetzt:

**(optional S0 Papiertest) → S1 kleine lebendige Welt → Spaß-Tor und Lern-Tor → M0 bis M6.**

Kein großer Datenaufbau und keine Engine-Entscheidung, bevor S1 das Spaß-Tor bestanden hat. Wenn S0 oder S1 scheitern, wird das Konzept geändert, nicht der Umfang vergrößert.

### S0 — Papiertest mit einem Menschen als Simulation

**Status:** optional. Der Papiertest prüft Figuren, Dilemmas und „Wege statt Verbote“ für wenige Euro. Er nutzt eine feste Ereignisvorlage und widerspricht damit nicht dem Grundsatz „kein vorgegebenes Szenario“, weil er nur ein Entwicklungswerkzeug ist.

**Aufwand:** ein bis zwei Abende, praktisch keine Kosten.

**Aufbau:** Szenario A aus dem [Spieldesign](SPIELDESIGN.md) (der Bericht und die Regierungskrise), eine Woche Spielzeit. Ein von Hand gepflegter Weltzustand als einfache Datei: sechs Figuren mit Ziel, Schwäche, Sprechweise und Beziehung zum Spieler, ein Dutzend Werte (Umfragen, Parteirückhalt, Haushaltsspielraum, Medienlage) und eine kurze Liste der Befugnisse. Ein Sprachmodell spricht die Figuren. Eine Spielleitung führt den Weltzustand von Hand nach und entscheidet Folgen nach einfachen, vorher notierten Regeln.

**Geprüft wird:** Entstehen echte Dilemmas? Merken sich Testpersonen die Figuren? Fühlt sich „Wege statt Verbote“ gut an? Wo wird es zäh?

**Bestanden, wenn:** mindestens drei von fünf Testpersonen nach 45 Minuten freiwillig weiterspielen wollen und hinterher eine Geschichte aus ihrer Partie erzählen können.

**Material:** vollständig vorbereitet im Ordner [S0_PAPIERTEST](S0_PAPIERTEST/00_ANLEITUNG.md) („Die Klinikum-Affäre“, fiktive Republik Estravia; nur als Werkzeug, das Spiel selbst beginnt mit der Türkei).

### S1 — Eine kleine lebendige Welt

**Umfang:** die **Türkei** zu einem belegten Stichtag, der Spieler als Staatspräsident, ein Jahr Spielzeit, kein vorgegebenes Szenario. Voraussetzung ist das geprüfte Startpaket aus dem [Länderpaket Türkei](LAENDERPAKET_TUERKEI.md). Gekoppelte Systeme im Kleinen:

- **Wirtschaft und Zentralbank** nach dem [Wirtschaftsmodell](WIRTSCHAFTSMODELL.md): Leitzins, Inflation, Erwartungen, Wechselkurs, Wachstum, Arbeitslosigkeit, Haushalt, Schulden, Risikoaufschlag; Zentralbank auf Stufe B (formell unabhängig), damit Eingriff und Verzicht beide möglich sind.
- **Politik:** Koalition, eigene Partei, Opposition, fünf Wählergruppen mit unterschiedlichen Interessen, Umfragen, die Wahl am Ende.
- **Medien und Justiz:** eine Zeitung mit recherchierender Journalistin, eine unabhängige Staatsanwaltschaft.
- **Figuren:** etwa acht, darunter Stabschefin, Finanzminister des Koalitionspartners, Innenminister, Gouverneurin der Zentralbank, Journalistin, Unternehmer, Generalstaatsanwältin und die Mentorin.
- **Ereignisvorlagen:** etwa zehn, die aus dem Weltzustand entstehen können (zum Beispiel Vergabeaffäre, Energiepreisschock, Streik, Streit mit der Zentralbank, Koalitionskrise, Rating-Herabstufung). Welche davon entstehen, hängt von Zufall und Entscheidungen ab.

Keine Karte, keine Außenpolitik, kein Militär. Echte Oberfläche mit Schreibtisch, Vorgangsakte, Wirtschaftsakte, Gespräch, Auftragskarten, Notizbuch und Mentorin. Echter Simulationskern im Kleinen; das Sprachmodell spricht Figuren und schlägt Handlungen vor, entscheidet aber nichts.

**Ziel:** beweisen, dass das Kernerlebnis ohne menschliche Spielleitung trägt: frei formulieren, auf Widerstand stoßen, einen Preis wählen, die Folge später wiedersehen und verstehen, warum sie eingetreten ist.

**Das Spaß-Tor (Abnahme von S1):**

- Mindestens 60 Prozent der Testpersonen wollen nach der Sitzung weiterspielen.
- Testpersonen nennen ohne Hilfe mindestens drei Figuren beim Namen und haben eine Meinung über sie.
- Jede Testperson hat mindestens einmal länger als eine Minute mit einer Entscheidung gerungen.
- In drei Durchgängen findet keine Testperson eine eindeutig beste Strategie.
- Mindestens eine frühere Entscheidung kehrt in jeder Partie spürbar zurück.
- Keine Testperson beschreibt das Spiel als „Akten lesen“ oder „Verwaltung“.
- Das Prüfkriterium der Oberfläche aus dem Spieldesign (Abschnitt 4) ist erfüllt.

**Das Lern-Tor (zusätzlich):** die Kriterien aus dem [Lernkonzept](LERNKONZEPT.md), Abschnitt 7. Insbesondere erklären mindestens 60 Prozent der Testpersonen nach einer Partie einen wirtschaftlichen Zusammenhang richtig in eigenen Worten, und ein Volkswirt findet in den Erklärungen keine sachlichen Fehler.

**Vorarbeit für S1:** die Quellen des Wirtschaftsmodells prüfen, die elf Zusammenhänge als Rechenregeln festlegen und in automatisierten Testläufen kalibrieren (stilisierte Fakten, keine sichere Strategie), bevor Oberfläche und Figuren darauf aufsetzen.

Erst danach wird der Umfang erweitert. Jede spätere Erweiterung muss Spaß-Tor und Lern-Tor erneut bestehen.

## 1. Arbeitsumfang und Planungsannahmen

Der erste technische Nachweis nach dem Spaß-Tor ist eine 90 Spieltage umfassende Regierungssimulation. Es ist ein Entwicklungsprototyp und kein vorweggenommenes vollständiges Türkei-Szenario.

Vorgeschlagene Größenordnung für diesen Prototyp:

- Ein spielbares Land und ein festgeschriebener Datenstichtag.
- Eine besonders detaillierte Region, weitere Gebiete aggregiert.
- Ungefähr zwölf wichtige Personen mit ausgearbeiteter Persönlichkeit und drei vertieft behandelte ausländische Partner; weitere Figuren nur, wenn Spieltests sie verlangen.
- Acht funktionale Zuständigkeitsbereiche; dies ist eine Entwicklungsabstraktion, keine Behauptung über die tatsächliche Ressortzahl des gewählten Landes.
- Acht sorgfältig modellierte politische Maßnahmen, jede mit einem echten Zielkonflikt, statt eines großen oberflächlichen Katalogs.
- Drei zusammenhängende Testkonflikte aus dem Spieldesign.
- Ein durchgängiges Beschaffungsgeschäft, ein verhandelbarer Vertrag und ein abstrakter sicherheitspolitischer Konflikt.

Die Mengen werden anhand der ersten Messungen angepasst. Entscheidend sind ein konsistenter und ein spannender Ablauf, nicht das Erreichen einer beliebigen Anzahl von Figuren.

## 2. Reihenfolge nach Abhängigkeiten

**Spaß-Tor (S0, S1) → Szenariodaten und Regeln → Weltzustand und Zeit → Aufträge und Ressourcen → Auswirkungen → Akteure → Gespräche und Oberfläche → lange Kampagne.**

Die sichtbare Oberfläche wird früh mit einem kleinen Szenario entwickelt. Sie darf jedoch nicht als unabhängiger Prototyp eine zweite, widersprüchliche Spielwelt besitzen.

### M0 — Szenario und Regeln belegbar machen

**Lieferumfang:** Auswahl des ersten Lands und Stichtags, Quellenregister, Datenlücken, institutionelle Zuständigkeiten, Verwaltungsgeografie und initiale Modellannahmen.

**Fertig, wenn:** Jeder kritische Startwert eine Quelle oder eine gekennzeichnete Schätzung hat. Kein Startereignis setzt Wissen voraus, das am Stichtag noch nicht vorlag. Benötigte Nutzungsrechte sind für die geplante Verwendung geklärt.

**Wenn das nicht gelingt:** Räumliche Auflösung oder den Umfang des ersten Szenarios reduzieren; keine fehlenden Fakten durch überzeugend klingende Texte ersetzen.

### M1 — Eine Welt, die ohne Gespräche funktioniert

**Lieferumfang:** Zeitfortschritt, eindeutige Objekte, Haushalt, Aufträge, Projektstatus, Ereignisprotokoll, Speichern und Laden. Eine einfache Entwickleransicht darf zunächst Knöpfe statt freier Sprache verwenden.

**Fertig, wenn:** Derselbe protokollierte Ablauf reproduzierbar ist, Buchungen zusammenpassen und ein gespeichertes Spiel unverändert fortgesetzt werden kann.

### M2 — Absichten korrekt in Handlungen übersetzen

**Lieferumfang:** Handlungskatalog, Erkennung von Referenzen und Fristen, Prüfung der Befugnisse, verständliche Auftragsbestätigung, Rückfragen und Ablehnungen. Vorlagen sichern Grundfunktionen bei einem Ausfall des Sprachdienstes.

**Fertig, wenn:** Prüfauftrag, Verhandlung und verbindliche Entscheidung sauber unterschieden werden. Es gibt keine tatsächliche Zustandsänderung nur aufgrund einer unbelegten Aussage des Sprachmodells.

### M3 — Politische und regionale Folgen erleben

**Lieferumfang:** Bevölkerung, Parteien, Ministerbeziehungen, Medien, eine regionale Projektkarte und wirtschaftliche Wirkungen mit Verzögerung. Der Journalismus-Testfall und das regionale Wirtschaftsszenario sind durchspielbar.

**Fertig, wenn:** Drei unterschiedliche Strategien konsistente Verläufe erzeugen und der Spieler wesentliche Folgen anhand der Akten erklären kann. Untätigkeit ist ebenfalls eine ausgewertete Strategie. Das Spaß-Tor wird mit dem erweiterten Umfang erneut bestanden.

### M4 — Außenpolitik, Verträge und Verteidigung verbinden

**Lieferumfang:** Diplomatische Angebote, Vertragsklauseln, Wissensstände, Haushaltsverpflichtungen, Beschaffung, Lieferung und aggregierte militärische Einsatzbereitschaft. Ein Konflikt kann durch Diplomatie oder eine strategische Eskalation weiterlaufen.

**Fertig, wenn:** Der Beschaffungstest vom ersten Gespräch bis zur Lieferung funktioniert und Frieden, Lieferstörung oder Vertragsbruch mit denselben Regeln verarbeitet werden. Geheime Informationen werden nur bei einem entsprechenden Informationsereignis weitergegeben.

M1 bis M4 bilden zusammen den durchgängigen 90-Tage-Prototyp. Sicherheits- und Außenpolitik werden somit früh überprüft.

### M5 — Eine vollständige politische Kampagne

**Lieferumfang:** Wahlen, Regierungsbildung, Opposition als Einstieg, mehrere Jahre, institutionelle Reformen, ausführlichere Branchen und Langzeitentwicklung von Personen.

**Fertig, wenn:** Eine Amtsperiode samt Wahl und anschließendem Regierungs- oder Oppositionsspiel konsistent funktioniert. Langfristige Schulden, Verträge und Projekte überstehen den Amtswechsel.

### M6 — Übertragbarkeit und Veröffentlichung

**Lieferumfang:** Ein zweites Land als Prüfung der Länderarchitektur, bessere Zugänglichkeit, Datenaktualisierung, Leistungsoptimierung und ein dokumentiertes Szenarioformat.

**Fertig, wenn:** Der zweite institutionelle Rahmen neue Verfahren nutzt, ohne große Teile des Simulationskerns zu duplizieren. Veröffentlichungsvorbereitung erfolgt nach überprüften Spieltests und geklärten Inhaltsrechten.

## 3. Konkreter Aufgabenbestand

P0 bedeutet Voraussetzung für den durchgängigen Prototyp. P1 folgt für die erste vollständige Kampagne. P2 bezeichnet späteren Ausbau.

| ID | Priorität | Arbeitspaket | Abhängigkeit | Sichtbarer Abschluss |
|---|---|---|---|---|
| FUN-00 | P2 | Papiertest (S0), optional | keine | Drei von fünf Testpersonen wollen weiterspielen |
| TR-00 | P0 | Länderpaket Türkei: Institutionen, Startdaten, Quellenregister | keine | Jeder Startwert belegt, Stichtag festgelegt |
| ECO-00 | P0 | Wirtschaftsmodell: Quellen prüfen, Rechenregeln, Kalibrierung auf türkische Startdaten | TR-00 | Stilisierte Fakten reproduziert, keine sichere Strategie |
| CB-01 | P0 | Zentralbank mit Gouverneurin und Unabhängigkeitsstufen | ECO-00 | Eingriff und Verzicht haben nachvollziehbare Folgen |
| MENTOR-01 | P0 | Mentorin, „Was heißt das?“, Nachbesprechung, Notizbuch | ECO-00 | Lern-Tor bestanden |
| EVT-00 | P0 | Ereignisvorlagen mit Voraussetzungen statt Drehbuch | ECO-00 | Verschiedene Partien erzeugen verschiedene Krisen |
| FUN-01 | P0 | Kleine lebendige Welt (S1) | ECO-00, CB-01, MENTOR-01, EVT-00 | Spaß-Tor und Lern-Tor bestanden |
| CHAR-01 | P0 | Figuren mit Ziel, Schwäche, Stimme, Gedächtnis | keine | Testpersonen kennen Figuren beim Namen |
| UI-00 | P0 | Schreibtisch, Vorgangsakte, Auftragskarten | keine | Prüfkriterium der Oberfläche erfüllt |
| DATA-01 | P0 | Quellen- und Schätzungsregister | Spaß-Tor, Szenarioauswahl | Jeder Startwert hat Herkunft und Bezugszeit |
| RULE-01 | P0 | Ämter, Verfahren, Zuständigkeiten | DATA-01 | Identische Anweisung wird je nach Rolle korrekt verarbeitet |
| SIM-01 | P0 | Weltzustand, Zeit, Protokoll | DATA-01 | Spielstand lässt sich reproduzierbar laden |
| ECO-01 | P0 | Haushalt und Verpflichtungen | SIM-01 | Beschlüsse, Zahlungen und Bestand passen zusammen |
| ACT-01 | P0 | Aufträge und Zustandswechsel | RULE-01, SIM-01 | Blockade, Abbruch und Abschluss funktionieren |
| GEO-01 | P0 | Regionale Karte und Zuordnung | DATA-01, SIM-01 | Karte und Akte verweisen auf dieselben Objekte |
| POP-01 | P0 | Gewichtete Bevölkerungsgruppen | DATA-01, SIM-01 | Summen stimmen, Gruppen überschneiden sich kontrolliert |
| PER-01 | P0 | Personen, Beziehungen, Wissen | SIM-01 | Aussagen entsprechen dem bekannten Informationsstand |
| EFF-01 | P0 | Wirkungen und Verzögerungen | ECO-01, POP-01, ACT-01 | Maßnahmen wirken entsprechend ihrem Umsetzungsgrad |
| CHAT-01 | P0 | Sprache in geprüfte Aktionen übersetzen | ACT-01, PER-01 | Mehrdeutigkeit führt nicht zu ungewollter Ausführung |
| UI-01 | P0 | Briefing, Akte, Karte und Gespräch | ACT-01, GEO-01, CHAT-01 | Ein Vorgang ist ohne Informationsverlust verfolgbar |
| EVT-01 | P0 | Medien- und Krisenvorgänge | EFF-01, PER-01 | Neue Erkenntnisse verändern laufende Vorgänge |
| DIP-01 | P0 | Interessen und Gegenangebote | PER-01, ACT-01 | Auslandsakteure können begründet ablehnen |
| TR-01 | P0 | Klauseln und vertrauliche Teile | DIP-01, ECO-01 | Verpflichtungen und Wissen sind getrennt gespeichert |
| DEF-01 | P0 | Beschaffung und Einsatzbereitschaft | TR-01, EFF-01 | Bestellung wird nicht als einsatzbereite Fähigkeit verbucht |
| WAR-01 | P0 | Abstrakter Konflikt und Friedensweg | DEF-01, DIP-01, POP-01 | Konfliktverlauf erzeugt materielle und politische Folgen |
| QA-01 | P0 | Reproduzierbare Beispielszenarien | M1 bis M4 | Drei Fälle bestehen fachliche und spielerische Prüfung |
| ELE-01 | P1 | Wahlen und Regierungsbildung | RULE-01, POP-01, PER-01 | Stimmen, Sitze und Ämter bleiben unterscheidbar |
| OPP-01 | P1 | Opposition und politische Karriere | ELE-01 | Machtverlust führt in einen spielbaren Zustand |
| LONG-01 | P1 | Mehrjährige Entwicklung | M4, ELE-01 | Langfristige Verpflichtungen bestehen korrekt fort |
| COUNTRY-02 | P1 | Zweites Länderregelwerk | M5 | Institutionelle Unterschiede erzeugen andere Spielabläufe |
| MOD-01 | P2 | Dokumentierte Erweiterungspakete | Stabile Datenformate | Neue Inhalte lassen sich prüfen und laden |

## 4. Fachliches Datenmodell

| Objekt | Benötigte Informationen |
|---|---|
| Szenario | Stichtag, Versionsstand, Quellen, Annahmen, Lizenzstatus |
| Gebiet | Grenze, übergeordnete Region, Datenauflösung, Infrastrukturbezüge |
| Institution | Mandat, Befugnisse, Verfahren, Ressourcen, Führung |
| Person | Öffentliche Biografie, Rolle, Beziehungen, simulierter Zustand |
| Wissenseintrag | Inhalt, Quelle, Zeitpunkt, Zuverlässigkeit, bekannte Empfänger |
| Bevölkerungsgruppe | Region, Gewicht, Merkmale, wirtschaftliche Lage, politische Zustände |
| Maßnahme | Ziel, Zuständigkeit, Finanzierung, Umsetzung, Wirkungsannahmen |
| Auftrag | Auftraggeber, Empfänger, Frist, Status, Voraussetzungen, Vorgeschichte |
| Vertrag | Parteien, Klauseln, Bedingungen, Zustimmung, Sichtbarkeit, Erfüllung |
| Beschaffung | Bedarf, Angebote, Zahlungen, Lieferungen, Integration, Folgekosten |
| Fähigkeit | Material, Personal, Ausbildung, Versorgung, Zustand |
| Ereignis | Auslöser, Zeitpunkt, beteiligte Objekte, tatsächliche Zustandsänderung |

Objekte besitzen stabile Kennungen. Eine Umbenennung einer Person oder eines Gebiets darf historische Verweise nicht zerstören. Berichte werden mit ihrem damaligen Wissensstand gespeichert; ein später korrigierter Wert überschreibt keine alte Aussage unbemerkt.

## 5. Datenqualität und institutionelle Genauigkeit

Das Quellenregister enthält mindestens Herausgeber, URL, Bezugszeitraum, Veröffentlichungsdatum, Abrufdatum, Maßeinheit, räumliche Ebene, Lizenz und Transformation. Veröffentlichungsdatum und Bezugszeitraum sind nicht austauschbar.

Startwerte werden als belegt, abgeleitet oder geschätzt markiert. Die Umrechnung zwischen Verwaltungsgrenzen verschiedener Jahre muss ausdrücklich dokumentiert werden. Fehlende Bezirkswerte werden nicht einfach anhand nationaler Mittelwerte als echte lokale Werte ausgegeben.

Für institutionelle Regeln werden Zuständigkeit, Rechtsgrundlage, Gültigkeitszeitraum und eine Beschreibung des Spielmodells festgehalten. Vereinfachungen werden dokumentiert. Die KI entwirft nicht während des Spiels neue Befugnisse aus allgemeinem Länderwissen.

Ein Szenario erhält einen unveränderlichen Versionsstand. Aktualisierte Daten erzeugen ein neues Szenario. Gespeicherte Spiele bleiben an ihrem Daten- und Regelstand gebunden oder werden ausdrücklich migriert.

## 6. Technische Entscheidungen und frühe Versuche

Bereits festgelegt sind die Trennung zwischen Weltmodell und Darstellung, ein festes Zeitmodell, strukturierte Aktionen, versionierte Daten sowie das Protokollieren aller verbindlichen Zustandsänderungen.

Die konkrete Engine, Programmiersprache und Datenbank werden nach drei kleinen Versuchen gewählt:

1. **Kartenversuch:** Eine nationale Karte und eine detaillierte Region flüssig öffnen, auswählen und mit Akten verbinden.
2. **Simulationsversuch:** 90 Spieltage reproduzierbar berechnen, speichern und laden; Last und Wartezeit messen.
3. **Sprachversuch:** Typische Anweisungen einschließlich Mehrdeutigkeit korrekt auf einen begrenzten Handlungskatalog abbilden.

Bewertet werden Entwicklungsaufwand, Desktop-Unterstützung, Darstellung realer Geografie, Testbarkeit, Speicherverhalten und laufende Sprachmodellkosten. Ein webbasiertes Desktop-Interface und eine Spiele-Engine bleiben bis dahin Kandidaten; keine Technologie wird allein wegen ihrer Popularität ausgewählt.

Die Grundsimulation soll ohne ständigen Sprachdienst fortlaufen können. Ein Dienstausfall hält neue modellgestützte Gespräche an oder nutzt dokumentierte Vorlagen; er erzeugt keine ersatzweise erfundenen Entscheidungen.

## 7. Prüfplan

### Regel- und Konsistenzprüfungen

- Ein Prüfauftrag gibt keine Haushaltsmittel aus und ordnet keine Festnahme an.
- Eine fehlende Befugnis erzeugt das passende Verfahren oder eine Ablehnung.
- Ein doppelter Auftrag verursacht keine unbemerkte doppelte Zahlung.
- Ein abgebrochenes Projekt verliert bereits entstandene Kosten nicht aus der Buchführung.
- Lieferung, Ausbildung und Einsatzbereitschaft bleiben getrennt.
- Ein Berater kennt keine geheimen Vertragsklauseln ohne Zugangsgrundlage.
- Karte, Bericht und Zahlenansicht verwenden denselben Zeitpunkt beziehungsweise kennzeichnen Abweichungen.
- Zeitbeschleunigung überspringt keine erforderliche Spielerentscheidung.

### Verhaltensprüfungen

Ein festes Paket aus zunächst 50 natürlich formulierten Anweisungen prüft Informationsfragen, hypothetische Aussagen, Negationen, Fristen, unklare Referenzen und verbindliche Entscheidungen. Es wird durch im Spiel beobachtete Fehlinterpretationen erweitert.

Ungültige oder nicht unterstützte Handlungen müssen nachvollziehbar erklärt werden. Bei kritischen Fällen ist eine falsche Ausführung schwerwiegender als eine notwendige Rückfrage.

### Fachliche Plausibilität

Für jede zentrale Wirkungsannahme werden Sensitivität, zeitlicher Verlauf und alternative plausible Parametrisierungen untersucht. Extremwerte dürfen nicht unbemerkt unrealistische Kettenreaktionen erzeugen. Historische Vergleichsfälle dienen zur Prüfung und nicht als Garantie korrekter Zukunftsprognosen.

### Spieltests

Beobachtet werden Orientierung, Informationslast, sinnvolle Delegation und das Verständnis der Folgen. Testpersonen sollen nach einer Sitzung erklären können, was sie entschieden haben, wer reagiert hat und was noch unsicher ist. Ein besonders langer Dialog ist kein eigener Qualitätsnachweis.

Gleichrangig wird der Spielspaß beobachtet: Wo lehnen sich Testpersonen vor, wo lehnen sie sich zurück? Wann greifen sie zum Handy? Welche Geschichte erzählen sie hinterher? Nach jeder Sitzung gibt es drei feste Fragen: Willst du weiterspielen? Welche Figur ist dir im Kopf geblieben? Welcher Moment war der beste und welcher der zäheste? Zähe Stellen werden vor neuen Funktionen behoben.

## 8. Personal, Aufwand und Budgetplanung

Benötigte Fähigkeiten sind Spieldesign, Simulationsprogrammierung, Datenaufbereitung, UI/Kartendarstellung, narrative Gestaltung und Qualitätssicherung. Eine Person kann mehrere Rollen übernehmen; fachliche Prüfung der Länderregeln und ökonomischen Annahmen muss trotzdem stattfinden.

Verlässliche Kalender- und Budgetzahlen folgen nach M2, wenn Kartenleistung, Simulationsaufwand und Gesprächskosten messbar sind. Vorher würden konkrete Produktionsversprechen eine Genauigkeit vortäuschen, die noch nicht vorhanden ist.

Die Kostenschätzung trennt einmalige Entwicklung, laufende Szenariopflege, Sprachdienstkosten pro Spielsitzung und Inhaltserstellung. Ein möglicher Onlinedienst wird nicht vorausgesetzt, bevor sein Nutzen und seine Kosten gemessen wurden.

## 9. Abgeschlossene und noch offene Planungsentscheidungen

**Als Arbeitshypothese festgelegt:** Spielspaß als oberstes Ziel mit Spaß-Tor vor dem Ausbau, Gegenwartsstart mit Stichtag, Einzelspieler, pausierbare Tageszeit, persönliche Rolle, Türkei als erster Kandidat für ein echtes Länderpaket (nach Spaß-Tor und rechtlicher Prüfung), Schreibtisch als Heimat einer verbundenen Oberfläche aus Akte, Gespräch, Beziehungen und Karte, frühe Integration von Diplomatie und Verteidigung.

**Vor jeder öffentlichen Nennung zu entscheiden:**

- **Name.** „New World Order“ ist ein verbreiteter Begriff aus Verschwörungserzählungen, teils mit antisemitischem Unterton. Das belastet Shop-Freigaben, Presse, Werbung und Auffindbarkeit und hat mit dem Spiel nichts zu tun. „NWO“ bleibt interner Arbeitsname; ein endgültiger Name wird vor der ersten Veröffentlichung gewählt.
- **Echtes Land: entschieden (28.09.2026).** Das erste Land ist die Türkei, von Anfang an. Offen ist noch, wie echte Personen behandelt werden (Empfehlung und Begründung im [Länderpaket Türkei](LAENDERPAKET_TUERKEI.md), Abschnitt 4), und vor einer Veröffentlichung braucht es eine rechtliche Prüfung zu Persönlichkeitsrechten und Marktzugang.

**Vor M0 zu konkretisieren:** Erster tatsächlicher Datenstichtag, verfügbare räumliche Auflösung und die kleinste belastbare institutionelle Abbildung.

**Durch Versuche zu entscheiden:** Engine und Technologie, Anzahl der Bevölkerungsgruppen, Detailtiefe militärischer Berechnung, benötigtes Sprachmodell und Kostenrahmen.

**Vor einer Veröffentlichung zu entscheiden:** Plattformumfang, Vertrieb, Datenaktualisierungen, Support und Freigabe von Erweiterungswerkzeugen.

Diese offenen Punkte verhindern die aktuelle Konzeptarbeit nicht. Sie besitzen jeweils einen klaren Zeitpunkt, an dem die entsprechende Entscheidung belastbar getroffen werden kann.
