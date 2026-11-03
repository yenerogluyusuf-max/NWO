# Sozialer Krisenkurs und Regierungsarbeitsplatz – Nacht 2./3. November 2026

Ausgangsstand: `d8f47129b3c52d685aebfa07cd351108db0e59ee` auf beiden veröffentlichten Arbeitszweigen. Auftrag: politisch gescheiterte Krisenverläufe angehen, soziale Folgen abfedern, Mehrheiten organisieren und die Navigation nach legislativer und exekutiver Arbeit verständlicher gestalten.

## Im Spiel

Der **Krisenrat** ist direkt am Regierungsschreibtisch aufklappbar und als eigener Zugang in **Wirtschaft & Versorgung** erreichbar. Er unterscheidet drei Aufgaben: Entlastung finanzieren, parlamentarische Mehrheit verhandeln, Zusagen und Ergebnisse prüfen. Er zeigt Armutsbelastung, öffentliche Zustimmung, Regierungssitze und den tatsächlichen politischen Tiefstand. Eine Parlamentsmehrheit schützt nicht automatisch vor Massenprotesten oder einer verlorenen Wahl.

Drei ausführbare Pakete verwenden die vorhandenen Ressortansätze und deren tatsächliche Wirtschafts- und Gruppenwirkungen:

| Paket | Entlastung | Finanzierung und Preis |
| --- | --- | --- |
| Gezielte Kaufkrafthilfe | Sozialhilfe mindestens +4; Verbrauchsteuern höchstens −1 | Zusätzliche Unternehmenssteuer bis zur bestehenden Grenze; belastet Unternehmer, Investitionen und Auslandszuflüsse. |
| Hilfen gezielt umschichten | Sozialhilfe mindestens +4 | Breite Subventionen höchstens −1; Rest aus Unternehmenssteuern. Energie und Lebensmittel können teurer werden, Landwirte und Beschäftigte verlieren Subventionsvorteile. |
| Soziales Netz schützen | Sozialhilfe mindestens +3; Gesundheit und Rentenniveau mindestens +2 | Unternehmenssteuern bis zur Grenze; ungedeckter Rest bleibt als zusätzliches Defizit sichtbar. Gesundheit wirkt langsamer. |

Höhere bereits geltende Sozialansätze werden nicht zurückgeschnitten. Gegenfinanzierung bezieht sich auf den zusätzlichen Bedarf gegenüber dem heutigen Haushalt. Ausgeschöpfte Steuergrenzen werden respektiert. Angezeigt werden Postenänderungen, jährlicher Geldbetrag bei heutigem BIP, Defizitbeitrag, Wirkungsaufbau und tatsächliche begrenzte Gruppenreaktionen. Die Paketstufen, 4 PK Einbringpreis, 10 Aufmerksamkeit und 30 Tage Wiederanlauf nach Ablehnung sind **Spielparameter**, keine behaupteten realwirtschaftlichen Schätzwerte.

Ein Paket wird als **parlamentarischer Sozialnachtrag** eingebracht. Es gilt der bestehende Haushaltsweg: 21 Tage Beratung, 301 Stimmen, reale Abstimmungsstreuung, erst danach Ansatzänderung. Einbringen allein bucht keine Entlastung und keinen Umfragebonus. Absprachen, Duldung und Koalitionsverträge mit ihren echten Kosten, Fristen und neuen Zusagen stehen im laufenden Krisenrat zur Verfügung. Bestehende Koalitionsrisiken und ablaufende Zusagenerinnerungen bleiben sichtbar. Die Pakete ersetzen nicht automatisch gesetzliche Fraktionszusagen.

Der Oktoberzyklus und ein vorbereiteter Jahreshaushalt bleiben erhalten; der Sozialnachtrag kann auch außerhalb des Oktoberfensters beraten werden. Ein laufendes Haushaltsgesetz sperrt einen zweiten Nachtrag. Wiederholungen erfüllter Paketziele sowie veraltete oder unbezahlbare Aktionen buchen nichts. Niedrige Aufmerksamkeit und politisches Kapital auf Kredit werden vor dem Klick erklärt. Alte Spielstände ohne neue Felder bleiben lesbar.

## Bericht und Gestaltung

Der bestehende Haushaltsabschluss und Monatsbericht speichern den Paketnamen, tatsächliche Ansätze, Abkommen, Verpflichtungen und monatliche soziale Indizes. Armut, Lebenshaltungskosten und Realeinkommen werden mit dem Stand vor dem Beschluss verglichen. Diese Beobachtung wird ausdrücklich nicht als isolierte Paketwirkung ausgegeben: Inflation, weitere Entscheidungen und äußere Ereignisse wirken ebenfalls. Der vorhandene Vergleich des nächsten Reifungsschritts bleibt separat erhalten.

Die linke Leiste ist neu gegliedert:

- **Regieren:** Regierungsschreibtisch, **Legislative Arbeit**, **Exekutive Arbeit**.
- **Land gestalten:** Wirtschaft, Gesellschaft, Land/Infrastruktur, Wissen.
- **Welt & Öffentlichkeit:** Außenpolitik, Sicherheit, Medien.

Alle zehn bisherigen Einstiegspunkte und internen Sprungkennungen bleiben erhalten. Eine durchgehende dunkle Leiste, helle aktive Fläche, lesbare Beschriftungen, Gruppenüberschriften und getrennte Vorgangszahlen ersetzen die bisherigen einzelnen Plaketten. Hohe Leisten sind scrollbar. Mittlere Fenster erhalten eine kompakte Variante; schmale Fenster eine Bereichsauswahl, die auch bei offener Akte erreichbar bleibt. Escape schließt diese Auswahl. Legislative und Exekutive tragen eigene Funktionszeilen. Krisenpakete werden einzeln geöffnet; der Fokus folgt der bewussten Auswahl. Texte und neue Bedienelemente liegen in DE/EN/TR vor.

## Prüfung und Grenzen

- 141 gezielte Tests in acht betroffenen Testdateien bestanden: Paketfinanzierung, neutraler Entwurf, Annahme/Ablehnung, Doppelbuchung, Sperren, Fraktionsvertrag, feste neue Zusage, Duldungsende, Jahreszyklus, Speicherung/Altbelege, echter Monatslauf, Navigation und bestehende Haushalts-/Schreibtischwege. Davon 24 neue Paket-/Navigationstests.
- Nach den letzten Text- und Fokusänderungen bestanden 122 Tests der vier UI-/Sprachdateien. Diese überschneiden sich mit der vorherigen Auswahl und werden nicht addiert.
- Ein zusätzlicher Regressionstest prüft, dass der Testspieler bei 200 eigenen und 120 Partnersitzen keine unnötige weitere Koalition schließt.
- TypeScript und Produktionsbuild erfolgreich. Bestehende Buildhinweise bleiben: optionaler, nicht exportierter `infrastrukturEtat` und große Ausgabepakete.
- Browserprüfung und aktuelle Screenshots bleiben offen. SSR-, Simulations- und CSS-Prüfungen sind keine visuelle Abnahme.

### Testspieler-Korrektur

Die erste Vorprüfung ergab einen Fehler im Szenariofahrer, nicht in der Sitzanzeige des Spiels: Beim Prüfen, ob ein weiteres Bündnis nötig ist, zählte er nur Partnersitze. Jetzt verwenden Messung und Bündnissuche dieselbe vollständige Sitzrechnung wie das Spiel. Außerdem respektieren Gespräche mit Ministern die ausdrücklich gewählte Regierungsagenda; gegensätzliche Gesetzesvorschläge werden besprochen, statt still die eigene Strategie umzukehren. Kosten und normale Spielregeln gelten weiterhin.

Die vorläufigen Läufe bleiben in `reports/Vorpruefung-Krisenpakete-*.json` erhalten und sind ausdrücklich als solche markiert. Die abschließende Vergleichsmatrix verwendet den korrigierten Testspieler: bisheriger abgestimmter Stabilisierungskurs und drei Sozialpakete, jeweils Startzufall 5 und 17, bis 5,1 Jahre oder zum tatsächlichen politischen Spielende. Keine geschenkten Stimmen, kein gesetzter Wahlsieg, keine künstliche Zustimmung.

| Kurs | Startzufall | Tage bis Ende | Ende | Inflation | Zustimmung | Armut (Index) |
| --- | ---: | ---: | --- | ---: | ---: | ---: |
| Bisheriger Stabilisierungskurs | 5 | 1826 | Abwahl | 12.43 % | 33.99 % | 24.42 |
| Bisheriger Stabilisierungskurs | 17 | 726 | Massenproteste | 38.93 % | 21.41 % | 53.38 |
| Gezielte Kaufkrafthilfe | 5 | 1826 | Abwahl | 12.22 % | 45.42 % | 14.35 |
| Gezielte Kaufkrafthilfe | 17 | 848 | Massenproteste | 39.94 % | 20.37 % | 45.43 |
| Gezielt umschichten | 5 | 1826 | Abwahl | 12.05 % | 41.71 % | 18.76 |
| Gezielt umschichten | 17 | 879 | Massenproteste | 36.30 % | 20.40 % | 45.90 |
| Soziales Netz | 5 | 971 | Massenproteste | 29.76 % | 22.24 % | 43.77 |
| Soziales Netz | 17 | 879 | Massenproteste | 35.92 % | 21.97 % | 45.27 |

Die acht abschließenden Läufe umfassen **26,80 tatsächlich gespielte Jahre und 822 erfolgreiche Bedienaktionen**. Alle Prüfungen auf Finanzsaldo, Schuldenfortschreibung, Warenbilanz und endliche Zustände bestanden. Die Sitzkorrektur des Testspielers änderte die gerundeten Endergebnisse dieser konkreten acht Läufe nicht; der zusätzliche Regressionstest belegt den Fehler in einer verhandlungsfähigen Lage.

Die gezielte Kaufkrafthilfe erreicht beim Startzufall 5 vor der Wahl 45,42 % Zustimmung statt 33,99 %, Armut 14,35 statt 24,42 und Lebenshaltungskosten 69,72 statt 89,99. Die Wahl wird trotzdem verloren (34,9 % statt 20,6 % Kandidatenstimmen). Beim Startzufall 17 verschiebt sich der Sturz von Tag 726 auf 848 beziehungsweise 879, bleibt aber bestehen. Das langsamere Dienstepaket verhindert den politischen Zusammenbruch in keinem der beiden Läufe. **Kein Paket ist eine Sieg-Garantie.**

Diese Werte vergleichen vollständige Kampagnen einschließlich wechselnder Ministerentscheidungen und Folgeereignisse; sie isolieren nicht den volkswirtschaftlichen Effekt einzelner Posten. Die Kampagnen hatten für die Sozialnachträge bereits genügend erwartete Stimmen. Zusätzliche bezahlte Mehrheitsverhandlungen und ihre neuen Fraktionszusagen wurden deshalb separat in einem Testparlament mit auslaufender Duldung geprüft. Die bestehenden Wahlsysteme und die Protestschwelle wurden nicht zugunsten dieser Ergebnisse verändert.

Nachweise: [Kampagnen](reports/Krisenpakete-Kampagnen-2026-11-03.json), [Prüfübersicht](reports/Krisenpakete-Pruefung-2026-11-03.json). Die Vorprüfungen dokumentieren den anfänglichen 5-Jahreslauf und die anschließende Verlängerung bis zum tatsächlichen Wahltermin; die abschließende Matrix geht von vornherein bis zu 5,1 Jahren.


## Weiterarbeit

Die Nachtarbeit war bis **3. November 2026, 08:00 Uhr Europe/Berlin** beauftragt. Die abgelaufene Automation wurde am Vormittag beendet; die anschließende Arbeit erfolgt auf das neue direkte „weiter“ des Nutzers. Sinnvolle nächste Prüfungen: im härteren Inflationsszenario Beschäftigung, Realeinkommen und widersprüchliche Minister-/Ereignisentscheidungen gezielt auswerten; vorhandene Wahlkampfmöglichkeiten separat von der parlamentarischen Mehrheit testen; soziale Gegenmaßnahmen mit bezahlbarer Finanzierung vergleichen. Keine allgemeine Sieg-Garantie einbauen und erledigte Prüfungen nicht ohne neuen Anlass wiederholen. Die neue Navigation benötigt noch die tatsächliche visuelle Abnahme, sobald der freigegebene Zugriff technisch wieder möglich ist.

## Anschluss: Lebenshaltung und gesetzliche Gegenmaßnahmen (3. November, 01:45 Uhr)

Die Auswertung der schweren Verläufe zeigt, warum eine vorhandene Parlamentsmehrheit und ein Sozialnachtrag allein nicht genügen: Im harten Start sinken die Realeinkommen über viele Monate, während die Belastung durch Lebenshaltungskosten hoch bleibt. Der Krisenrat zeigt nun Lebenshaltung, Realeinkommen und Armut mit tatsächlichem Dreimonatsvergleich sowie Arbeitslosigkeit und Inflation. Die Indizes sind klar als Beobachtungen eingeordnet. Eine sinkende, weiterhin positive Inflationsrate bedeutet weiter steigende Preise; eine Verbesserung einzelner Indizes ist kein garantierter Wiederwahl-Erfolg.

### Ausführbare Gesetzeswege

Drei vorhandene Gesetze sind direkt erreichbar und einbringbar: Mindestlohn, Arbeitslosengeld und Berufsausbildung. Die Auswahl bietet zehn oder zwanzig zusätzliche Stufen (Grenze 100) und führt auf Wunsch in die freie Gesetzesbearbeitung. Die Karte zeigt den echten Einbringpreis, Aufmerksamkeit, zusätzliche jährliche Modellkosten in BIP-Anteilen und Geldbetrag, fehlende automatische Gegenfinanzierung und die Umsetzung nach Annahme. Bereits laufende Beratung zeigt ausschließlich den tatsächlich eingebrachten regionalen oder landesweiten Entwurf. Ein noch nicht umgesetztes Landesziel wird nicht durch wiederholte neue Hilfsentwürfe übersprungen oder zurückgesetzt.

Die Vorschau führt die vorhandene Einbringhandlung auf einer Kopie aus. Dadurch sind Terminverschiebungen unter Belastung, zum Votum auslaufende Duldungen und verlängerte Zusagenfristen dieselben wie im Spiel. Bei Annahme erfüllbare Zusagen sowie tatsächliche persönliche Loyalitätsänderungen werden unter heutigen Bedingungen erklärt. Ein vorher drohender Monatsbruch wird getrennt gezeigt. Links führen zu parlamentarischen Absprachen, Haushalt und Zusagen. Veraltete Angebote, fehlendes Kapital, Erholungspause, Spielende und ausgeschöpfte Ziele buchen nichts. Erst das tatsächliche Votum entscheidet über Annahme und Umsetzung; die Vorschau ersetzt keine künftigen Ereignisse oder Monate.

Die Kehrseiten stammen aus dem bestehenden Modell: Lohnerhöhungen können Kosten-/Preisdruck, Schattenwirtschaft und Jugend-Arbeitslosigkeit verstärken; Arbeitslosengeld entlastet Betroffene, belastet aber Sozialkassen und schafft keine Stellen; Berufsausbildung hat zusätzlich zur Umsetzung neun Monate Verzögerung bis zum Arbeitsmarkteffekt und zwölf bis zum Fachkräfteeffekt. Die Simulation, Zustimmungsformel und Niederlagenschwellen wurden hierfür nicht abgeschwächt.

Die Gestaltung verwendet eine gemeinsame kompakte Kennzahlenfläche, drei auswählbare Handlungskarten und nur einen geöffneten Detailbereich. Kleinere Gesetzesschritte sind bewusst auswählbar; Fortschritts- und Beratungsstände ersetzen das Angebot, sobald es bereits läuft. Fokusführung, Radiogruppen, Schaltflächenzustände und Containerlayouts sind berücksichtigt. Texte liegen in DE/EN/TR vor.

### Nachweise

66 unterschiedliche gezielte Tests in vier Dateien bestanden, darunter 24 neue: 23 Gesetzes-/Vorschautests und ein Test des Szenariofahrers. Gezählt wird jeweils der jüngste Stand je Datei, nicht die Summe wiederholter Läufe. Zusätzlich bestehen zwei parametrisierte Kampagnentests mit vier vollständigen Tageskampagnen bis 5,1 Jahre oder tatsächlichem Regierungsende. TypeScript und Produktionsbuild bestanden. Die ersten Ablehnungs-Fixtures verwendeten versehentlich eine Fraktion, die den Mindestlohn inhaltlich unterstützt; korrigiert wurde der Testaufbau, nicht die demokratische Abstimmung.

| Kurs | Startzufall | Tage | Ende | Inflation % | Zustimmung % | Armut | Realeinkommen |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: |
| Lohnkurs | 5 | 1826 | abwahl | 8.77 | 42.12 | 12.72 | 86.18 |
| Lohnkurs | 17 | 726 | sturz | 42.24 | 18.64 | 48.02 | 37.50 |
| Arbeitsmarktkurs | 5 | 1826 | abwahl | 11.15 | 36.97 | 12.70 | 71.24 |
| Arbeitsmarktkurs | 17 | 787 | sturz | 36.15 | 20.67 | 43.73 | 27.33 |

Die abschließenden vier Läufe umfassen 14.15 tatsächlich gespielte Jahre und 436 erfolgreiche Aktionen. Finanz-, Schulden- und Warenbilanz sowie endliche Zustände sind geprüft. Die bestehende Kaufkrafthilfe bei Startzufall 5 endete bei Armut 14,35, Realeinkommen 74,21 und Zustimmung 45,42; der neue Lohnkurs verbessert Armut/Einkommen auf 12,72/86,18, erreicht aber nur 42,12 Zustimmung und verliert ebenfalls die Wahl. Der harte Start endet im Lohnkurs bereits an Tag 726 und im Arbeitsmarktkurs an Tag 787, gegenüber 848 mit Kaufkrafthilfe allein. Mehr Gesetze sind kein allgemeines Erfolgsrezept: Finanzierung, politische Aufmerksamkeit und andere Krisenhandlungen konkurrieren miteinander.

Dies sind ganze Regierungsläufe, keine isolierte Schätzung einer einzelnen Gesetzeswirkung. Eine erste Sondierung brachte dieselben Maßnahmen zusätzlich über die allgemeine Gesetzesagenda ein. Sie ist als Vorprüfung erhalten. Der endgültige Fahrer trennt die Ministerleitlinie von der normalen Gesetzesagenda; die zusätzlichen Gesetze werden ausschließlich über den neuen Krisenratsweg eingebracht. Minister können weiterhin eigenständig handeln. Vorhandene Wahlkampfaktionen wurden in diesen Läufen noch nicht aktiv getestet.

Nachweise: `reports/Krisengesetze-Kampagnen-2026-11-03.json`, `Krisengesetze-Pruefung-2026-11-03.json`, letzte UI-Prüfung `Krisengesetze-UI-Abschluss-2026-11-03.json`, Build `Krisengesetze-Build-2026-11-03.log`. Vorprüfungen bleiben erhalten. Die bekannten Buildhinweise zu großen Paketen und dem optionalen Infrastruktur-Export bestehen weiter. Browserprüfung, aktuelle Screenshots und visuelle Abnahme bleiben offen.

## Anschluss: Wahlkampf nach der Krise (3. November, 02:45 Uhr)

Der bestehende Wahlkampf wurde nun tatsächlich eingesetzt. Vorher wurden drei Fehlerfälle reproduziert: Bei der zweiten Tour nach Deutschland blieben der inländische Vertrauensgewinn bei +1,2 und der Nationalisten-Effekt bei +1,0, obwohl die Mobilisierung im Ausland bereits halbiert wurde. In einer Provinz mit sehr vielen akuten Problemen zeigte die Risikorechnung sogar 175 Prozent. Der Nachweis der zunächst fehlgeschlagenen Prüfungen ist erhalten.

### Änderung im Spiel

- Die vorhandene Halbierung je Wiederholung gilt nun auch für den heimischen Fernseheffekt und die zusätzliche Mobilisierung nach einem Auftrittsverbot. Verschiedene Länder haben weiterhin eigene Besuchszähler. Das diplomatische Risiko bleibt bestehen. Bereits gespeicherte Wirkungen werden nicht rückwirkend verändert.
- Das Reiserisiko ist auf 100 Prozent begrenzt. Dies ändert bei zuvor über 100 Prozent liegendem Risiko nicht den tatsächlichen Ausgang, sondern macht die Wahrscheinlichkeit korrekt darstellbar.
- Die Provinzliste mit 81 unmittelbaren Aktionsknöpfen wurde durch eine nach Regionen gruppierte Auswahl und einen sichtbaren Reiseplan ersetzt. Vor der Buchung stehen Kosten, Erfolgschance, Rückschlag, tatsächliche begrenzte Vertrauensänderung, betroffene lokale Gruppe und akute Probleme. Nachfolger-Übertrag und Wiederholungen sind eingerechnet. Die Karte bleibt als Reiseübersicht erhalten.
- Auslandstouren zeigen ihre tatsächlichen begrenzten Inlandseffekte, den zusätzlichen Diaspora-Beitrag und die Beteiligungsänderung. Die Bereiche unterscheiden den Verlauf mit und ohne Auftrittsverbot und berücksichtigen die vorhandene Beteiligungsobergrenze. Die Rechnung gilt bei heutiger Zustimmung, nicht als garantierte Wahlprognose. EU-Vertrauensverlust und Konfliktfolgen sind vor dem Klick aufklappbar; das Risiko selbst steht sichtbar an der Karte.
- Klare Trennung von lokalen Indexpunkten und landesweiten Wahlprozentpunkten. Ein Besuch beseitigt keine Ressortkrise. Kosten bleiben die bestehenden wöchentlichen Kampagnen-Aktionspunkte; keine neuen Staatsausgaben oder Mehrheiten werden erfunden.
- Gemeinsamer Aktionszufall für UI und Simulationsfahrer, keine Zufallsverwendung durch Vorschauen. DE/EN/TR, native Auswahl, Fokusmarkierungen, umbrechende Aktionsknöpfe und Containerlayouts auch für schmale Akten. Keine Browserprüfung, neuen Screenshots oder visuelle Abnahme.

### Tatsächlicher Vergleich

Ein vollständiger Kaufkrafthilfe-Kurs mit Startzufall 5 wurde bis Tag 1826 gespielt. Der erste reguläre Regierungstermin während des Wahlkampfs, Tag 1771, wurde gespeichert und für drei Varianten identisch geladen. Alle Varianten behalten denselben Regierungskurs bei; sie verändern nur die echten Wahlkampfhandlungen. Die Kontrollvariante erreicht exakt denselben Endzustand wie der ungeteilte Lauf.

| Wahlkampf ab Tag 1771 | Erfolgreiche Kampagnenaktionen | Zustimmung vor Ende | Kandidatenstimmen | Ausgang |
| --- | ---: | ---: | ---: | --- |
| Keine aktiven Handlungen | 0 | 45,42 % | 34,9 % | Abwahl, Tag 1826 |
| Regionale Reisen + Duellvorbereitung | 61 | 45,50 % | 40,3 % | Abwahl, Tag 1826 |
| Gemischt: regionale Reisen, Auslandstouren, Duellvorbereitung | 51 | 47,03 % | 39,0 % | Abwahl, Tag 1826 |

Regionale Ziele werden nach sichtbaren Chancen, Wirkungen, Kosten und Bevölkerungsgewicht ausgewählt; der Fahrer liest keine künftigen Zufallswerte. Der gemischte Kurs nutzt höchstens eine Auslandstour pro Woche. Zwei Auftrittsverbote treten tatsächlich ein. Es werden in diesem Vergleich keine neuen Wahlversprechen gegeben. Der schwere Startzufall 17 wurde nicht erneut bis zum bereits bekannten Sturz vor der Kampagnenphase durchgespielt.

Der Vorlauf umfasst 1826 Tage; die drei Fortsetzungen jeweils 55 Tage. Es wurden 151 erfolgreiche Regierungsaktionen im Vorlauf und insgesamt 121 erfolgreiche Handlungen in den Fortsetzungen ausgeführt, davon 112 Wahlkampfhandlungen. Der Kontrolllauf ist bewusst wiederholt, um die Speicher-/Fortsetzungsidentität zu prüfen. Finanzsaldo, Schuldenfortschreibung, Warenbilanzen und nichtnegative Kampagnenpunkte sind geprüft. Die unterschiedlichen zusätzlichen Handlungen verändern auch spätere Zufallspfade; der Vergleich isoliert daher nicht den Effekt einzelner Reisen oder des Duells. Keiner dieser Kurse garantiert eine Wiederwahl. Zustimmungsformel und Niederlagenschwellen wurden unverändert gelassen.

### Prüfung und offene Anschlussfragen

45 unterschiedliche gezielte Tests bestanden: 18 neue Reise-/Vorschau-/SSR-Tests, 20 bestehende Wahlkampftests, sechs gezielt ausgewählte Nachfolgertests und ein neuer tatsächlicher Kampagnenvergleich. Die übrigen 18 Tests der Nachfolgerdatei wurden bewusst übersprungen. TypeScript und Produktionsbuild bestanden; bekannte Hinweise zu großen Paketen und optionalem Infrastruktur-Export bleiben bestehen.

Nachweise: `reports/Wahlkampf-Reisen-Vorpruefung-2026-11-03.json`, `Wahlkampf-Reisen-Pruefung-2026-11-03.json`, `Wahlkampf-Nachfolger-Regression-2026-11-03.json`, `Wahlkampf-Krisenlauf-2026-11-03.json`, `Wahlkampf-Krisenlauf-Pruefung-2026-11-03.json`, `Wahlkampf-Reisen-Build-2026-11-03.log`.

Möglicher nächster gezielter Prüfpunkt aus der Codeinspektion, hier ausdrücklich noch nicht verändert: Wahlversprechen verwenden über mehrere Wahlkämpfe feste Zusagenkennungen (`z-wahl-…`), und die Angebotskarten erklären Zielstufe und Frist noch nicht vor dem Klick. Prüfen, ob ein erneut versprochenes Thema alte und neue Verpflichtungen verwechselt oder ein bereits ausgeschöpftes Ziel neuen Beifall auslöst. Keine Ausweitung um zusätzliche Versprechen nötig. Alternativ bleibt der harte Krisenverlauf vor der Wahl ein sinnvoller Prüfpunkt.


## Anschluss: Verbindliche Wahlversprechen über mehrere Amtszeiten (3. November, vormittags)

Drei Fehler wurden vor der Korrektur reproduziert: Dasselbe Thema erzeugte in einer späteren Kampagne wieder dieselbe Zusagenkennung; eine bereits ausgeschöpfte Politikstufe gab erneut Beifall; ein bereits beschlossener Fortschritt wurde beim neuen Ziel nicht berücksichtigt. Beispiel: Bei wirksamer Rente 50 und beschlossenem Ziel 80 versprach der alte Weg nur 70. Das neue Angebot baut auf dem weiter fortgeschrittenen wirksamen oder beschlossenen Stand auf und verlangt hier Ziel 100.

### Verpflichtung und spätere Wirkung

- Neue Zusagen speichern Thema, ursprünglichen Wahltag und Amtszeit. Eine erneute Verpflichtung erhält eine freie, eigene Kennung. Historischer Bruch, Erinnerung und neuer Beschluss bleiben getrennt. Bereits gespeicherte Kennungen und auch mehrdeutige alte Doppelbelege werden nicht rückwirkend umbenannt oder gelöscht. Wohnungsbauvorgänge erkennen sowohl alte als auch neue Kennungen und behalten ihre eigene Zuordnung.
- Ein früheres noch offenes Thema kann nicht erneut für zusätzlichen Beifall versprochen werden. Erfüllte oder gebrochene Altzusagen verhindern einen neuen, weiterführenden Auftrag nicht. Bereits ausgeschöpfte Ziele sind gesperrt; fallende Ziele berücksichtigen die beschlossene Absenkung ebenso wie steigende Ziele den beschlossenen Ausbau.
- Die Auswahl der zwölf vorhandenen Themen öffnet eine konkrete Verpflichtungskarte: wirksamer Stand, beschlossener Stand, festes Landesziel, Erfüllungsfrist und unmittelbare begrenzte Vertrauens-/Gruppenreaktionen. Dies sind Indexpunkte, keine garantierten Wahlstimmen.
- Eine getrennte Gesetzesrechnung zeigt tatsächliches politisches Kapital, Aufmerksamkeit, jährliche Mehrbelastung bzw. Mindereinnahmen in BIP-Anteilen und Mrd. TRY, fehlende automatische Gegenfinanzierung und Umsetzungsdauer. Einbringung wird zur Vorschau auf einer Kopie ausgeführt. Daher stimmen Termin, bekannte Duldungsfristen, Stimmenlücke und gegebenenfalls verlängerte Beratungsfrist mit der echten Handlung überein.
- Ein vorhandener Entwurf zeigt seine tatsächliche Fassung, Region und Stimmenprognose. Ein unzureichender oder regionaler Entwurf wird nicht als Erfüllung ausgewiesen. Ist Einbringung heute unmöglich, stehen der echte Grund und heutige Stimmen da; ein künftiger Abstimmungstermin wird nicht erfunden.
- Persönliche Reaktionen auf den späteren Zielbeschluss werden unter heutigen Bedingungen gezeigt. Heutige akute Koalitionsgefahr und eine mögliche Gefahr nach Annahme haben getrennte Prüfungstermine. Eine Teilvorlage liefert keinen erfundenen Termin für die spätere Erfüllung. Die Vorschau nimmt keine späteren Monats- oder Ereignisfolgen vorweg.
- Gesetzesbearbeitung, Parlament, Haushalt und Zusagenakte sind direkt verlinkt. Die Rede selbst bucht nur die bisherigen Kampagnenpunkte und politischen Reaktionen, kein Gesetz, keine zusätzliche Haushaltsausgabe und keine vorzeitige Loyalitätsbelohnung. Veraltete Angebote buchen nichts.
- Die bestehende Nachfolgerrolle bleibt erhalten: Werbung erzeugt keine neue persönliche Verpflichtung in der endenden Amtszeit. Anzeige und Buchungsmeldung benennen diese Grenze nun ausdrücklich.

Die neue Oberfläche verwendet eine Themenauswahl mit einer ausführlichen Karte, umbrechenden Links und Knöpfen, Fokusmarkierung und Containerlayouts (drei, zwei oder eine Spalte). Neue Texte und gespeicherte Zusagen sind in DE/EN/TR geprüft. Es fand keine Browserprüfung statt; aktuelle Screenshots und visuelle Abnahme bleiben offen.

### Prüfung und belastbare Grenzen

**83 unterschiedliche gezielte Tests bestanden, davon 23 neue**, ohne überlappende Durchläufe doppelt zu zählen: 23 Zusagenprüfungen, 20 bestehende Wahlkampftests, 21 bestehende Gesetzeszusagenprüfungen, 18 Reise-/Oberflächentests und eine gezielte Wohnungsbau-Regression. Die lesende Vorschau wurde zusätzlich gegen den vorher gespeicherten Zustand geprüft. TypeScript und Produktionsbuild bestanden. Bekannte Hinweise zu großen Paketen und optionalem Infrastruktur-Export bleiben bestehen.

Ein echter Tageslauf bringt das neu versprochene Rentenziel ein und läuft durch die normale Spielschleife bis zum tatsächlichen Votum: Die neue Zusage wird am Abstimmungstag erfüllt, der alte Bruch bleibt unverändert. Für diesen gezielten Test wurden die spätere Amtszeit, ausreichendes Kapital und ein Parlament mit 600 eigenen Sitzen als Ausgangsfall gesetzt; das ist keine natürlich erspielte Mehrheit und kein neuer mehrjähriger Wahlkampfvergleich. Erinnerungsantworten, Speicherung, alte und neue Wohnungsbauvorgänge, Zielgrenzen, offene Altzusagen, Teil-/Regionalentwürfe, mangelndes Kapital und veraltete Angebote sind getrennt geprüft.

Nachweise: `reports/Wahlversprechen-Stand-2026-11-03.json` fasst die jüngsten Ergebnisse samt Quellenprüfsummen zusammen. Die drei ursprünglich scheiternden Fehlerfälle bleiben in `Wahlversprechen-Vorpruefung-2026-11-03.json` erhalten. Ein späterer Testfehler verwendete eine numerische Vergleichsassertion für ein ISO-Datum; er wurde korrigiert, und die betroffene Datei ist vollständig bestanden. Dieser Zwischenstand ist ausdrücklich als `Wahlversprechen-Datumsassertion-*` erhalten. Erfolgreicher Build: `Wahlversprechen-Build-2026-11-03.log`.

Der zuvor offene Prüfpunkt zu wiederholten Wahlversprechen ist damit bearbeitet. Der harte Inflationsverlauf vor der Wahl bleibt eine getrennte Balancefrage. Die neuen Karten schaffen weder zusätzliche Zustimmungsboni noch eine Wiederwahlgarantie.
