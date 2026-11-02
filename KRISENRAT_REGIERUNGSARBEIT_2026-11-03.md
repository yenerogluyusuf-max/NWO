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

Die Nachtarbeit ist bis **3. November 2026, 08:00 Uhr Europe/Berlin** aktiviert. Sinnvolle nächste Prüfungen: im härteren Inflationsszenario Beschäftigung, Realeinkommen und widersprüchliche Minister-/Ereignisentscheidungen gezielt auswerten; vorhandene Wahlkampfmöglichkeiten separat von der parlamentarischen Mehrheit testen; soziale Gegenmaßnahmen mit bezahlbarer Finanzierung vergleichen. Keine allgemeine Sieg-Garantie einbauen und erledigte Prüfungen nicht ohne neuen Anlass wiederholen. Die neue Navigation benötigt noch die tatsächliche visuelle Abnahme, sobald der freigegebene Zugriff technisch wieder möglich ist.
