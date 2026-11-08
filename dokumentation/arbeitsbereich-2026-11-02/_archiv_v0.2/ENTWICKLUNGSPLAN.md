# NWO — Entwicklungsplan und überprüfbare Meilensteine

Version 0.2, 28. September 2026. Zusammen mit [Spieldesign](SPIELDESIGN.md) und [Referenzanalyse](REFERENZANALYSE.md) lesen.

## 1. Arbeitsumfang und Planungsannahmen

Der erste technische Nachweis ist eine 90 Spieltage umfassende Regierungssimulation. Es ist ein Entwicklungsprototyp und kein vorweggenommenes vollständiges Türkei-Szenario.

Vorgeschlagene Größenordnung für diesen Prototyp:

- Ein spielbares Land und ein festgeschriebener Datenstichtag.
- Eine besonders detaillierte Region, weitere Gebiete aggregiert.
- Ungefähr 20 wichtige Personen und sechs vertieft behandelte ausländische Partner.
- Acht funktionale Zuständigkeitsbereiche; dies ist eine Entwicklungsabstraktion, keine Behauptung über die tatsächliche Ressortzahl des gewählten Landes.
- Zwölf sorgfältig modellierte politische Maßnahmen statt eines großen oberflächlichen Katalogs.
- Drei zusammenhängende Testkonflikte aus dem Spieldesign.
- Ein durchgängiges Beschaffungsgeschäft, ein verhandelbarer Vertrag und ein abstrakter sicherheitspolitischer Konflikt.

Die Mengen werden anhand der ersten Messungen angepasst. Entscheidend ist ein konsistenter Ablauf, nicht das Erreichen einer beliebigen Anzahl von Figuren.

## 2. Reihenfolge nach Abhängigkeiten

**Szenariodaten und Regeln → Weltzustand und Zeit → Aufträge und Ressourcen → Auswirkungen → Akteure → Gespräche und Oberfläche → lange Kampagne.**

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

**Fertig, wenn:** Drei unterschiedliche Strategien konsistente Verläufe erzeugen und der Spieler wesentliche Folgen anhand der Akten erklären kann. Untätigkeit ist ebenfalls eine ausgewertete Strategie.

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
| DATA-01 | P0 | Quellen- und Schätzungsregister | Szenarioauswahl | Jeder Startwert hat Herkunft und Bezugszeit |
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

## 8. Personal, Aufwand und Budgetplanung

Benötigte Fähigkeiten sind Spieldesign, Simulationsprogrammierung, Datenaufbereitung, UI/Kartendarstellung, narrative Gestaltung und Qualitätssicherung. Eine Person kann mehrere Rollen übernehmen; fachliche Prüfung der Länderregeln und ökonomischen Annahmen muss trotzdem stattfinden.

Verlässliche Kalender- und Budgetzahlen folgen nach M2, wenn Kartenleistung, Simulationsaufwand und Gesprächskosten messbar sind. Vorher würden konkrete Produktionsversprechen eine Genauigkeit vortäuschen, die noch nicht vorhanden ist.

Die Kostenschätzung trennt einmalige Entwicklung, laufende Szenariopflege, Sprachdienstkosten pro Spielsitzung und Inhaltserstellung. Ein möglicher Onlinedienst wird nicht vorausgesetzt, bevor sein Nutzen und seine Kosten gemessen wurden.

## 9. Abgeschlossene und noch offene Planungsentscheidungen

**Als Arbeitshypothese festgelegt:** Gegenwartsstart mit Stichtag, Einzelspieler, pausierbare Tageszeit, persönliche Rolle, Türkei als erster Kandidat, Karte/Akte/Chat als verbundene Oberfläche, frühe Integration von Diplomatie und Verteidigung.

**Vor M0 zu konkretisieren:** Erster tatsächlicher Datenstichtag, verfügbare räumliche Auflösung und die kleinste belastbare institutionelle Abbildung.

**Durch Versuche zu entscheiden:** Engine und Technologie, Anzahl der Bevölkerungsgruppen, Detailtiefe militärischer Berechnung, benötigtes Sprachmodell und Kostenrahmen.

**Vor einer Veröffentlichung zu entscheiden:** Plattformumfang, Vertrieb, Datenaktualisierungen, Support und Freigabe von Erweiterungswerkzeugen.

Diese offenen Punkte verhindern die aktuelle Konzeptarbeit nicht. Sie besitzen jeweils einen klaren Zeitpunkt, an dem die entsprechende Entscheidung belastbar getroffen werden kann.
