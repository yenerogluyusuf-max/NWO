# Regierungs- und Finanzkampagnen – 2. November 2026

## Ergebnis und Umfang

**22 Kampagnen in elf Szenarien, zusammen 97,78 simulierte Spieljahre und 2.776 erfolgreich ausgeführte Regierungshandlungen.** Jede Kampagne lief bis fünf Jahre oder bis zum tatsächlichen politischen Spielende. 17 erreichten fünf Jahre; fünf endeten vorher mit dem Sturz der Regierung. Die Fehlschläge wurden nicht durch zusätzliche Punkte, erzwungene Mehrheiten oder abgeschaltete Spielenden beseitigt.

Die Szenarien nutzen den echten Tageslauf und vorhandene Aktionen: Gesetzeseinbringung, Stimmenabsprachen, Haushaltsgesetz und zulässige Nachträge, Ministerantworten, Krisenantworten, Koalitionsgespräche, Infrastruktur, Forschung, Zentralbank und Krieg. Es sind automatisierte Simulationskampagnen, **keine Bedienung im Browser**. Die automatisierte Regierungsstrategie ist bewusst begrenzt und keine nachgewiesene optimale Spielweise.

Sieben Fehler wurden vor der Korrektur mit fehlgeschlagenen Regressionstests nachgewiesen. Korrigiert sind die Finanzierung von Überschüssen und Einmalausgaben, die Versorgung neuer und zusätzlicher Fronten sowie Bauprognosen bei Forschung, Warteschlangen und Pausen. Ergänzend wurde die Rundung beim prognostizierten Bauabschluss an den tatsächlichen Monatslauf angeglichen.

## Versuchsaufbau

- Ausgangsstand: Commit `dedfa53abebe5e52c2416b73c53545d35e70014f`, Türkei, Regierungsbeginn am 5. Juni 2028 nach der Wahl, Bündnis mit YENİ. Zwei Zufallsstände je Szenario: 5 und 17.
- Die Regierung handelt im Wochenrhythmus; Reformen, Haushaltskorrekturen und Fraktionspflege erfolgen überwiegend alle 28 Tage. Gesetze gehen in Schritten von höchstens 20 Punkten durch das vorhandene Verfahren. Eine Einbringung ist kein angenommener Beschluss.
- Stimmenpuffer, Gespräche, Vorhaben und Maßnahmen bezahlen ihre echten Preise. Verfügbarkeit, Kapital, Mehrheit, Fristen und Umsetzung bleiben wirksam. Ministervorschläge dürfen die ausdrücklich gewählte Rechtsstaatsagenda nicht stillschweigend umkehren.
- Rezession: vorgegebener Schock mit Produktionslücke −7, Jahreswachstum −4 und EU-Nachfrage 65. Inflationskrise: Anfangsinflation 90 %, Erwartungen 85, Zentralbankglaubwürdigkeit 0,25. Diese Werte sind Testbedingungen, keine historischen Behauptungen.
- Krieg: vorgegebene äußere Eskalation mit Syrien am Tag 364; der vorhandene Kriegskern erzeugt und berechnet den Konflikt. Die Regierung mobilisiert, sucht nach zwölf Wochen einen Waffenstillstand und anschließend einen weißen Frieden. Die Ergebnisse bleiben vom Spiel abhängig.
- „Passiv“ führt überhaupt keine Regierungsaktion aus. „Bildungsstau“ betreibt Industriepolitik, senkt aber Bildung und Forschung und verfolgt deren Reformen nicht. „Fabrikoffensive“ reserviert politischen Handlungsspielraum für konkrete Werke; sie schenkt ihnen keine Baukapazität.
- Täglich werden Finanzzustände und endliche Werte geprüft. Monatlich werden Finanzidentität, BIP-Fortschreibung, Schuldenabschluss und Gütermengen abgeglichen. Messwerte und sämtliche Aktionsversuche stehen in den JSON-Berichten.

## Was die unterschiedlichen Regierungsweisen bewirken

Die Wertepaare stehen für Zufallsstand 5 / 17. Wachstum und Inflation sind die jeweiligen **Jahresraten am Ende**, keine kumulierten Fünfjahresänderungen. Fachwerte sind Spielindizes von 0 bis 100. Unterschiedliche Politik verändert später auch Ereignisse und Zufallsfolgen; die Zahlen sind Kampagnenvergleiche, keine isolierten Kausalkoeffizienten.

| Szenario | Gespielte Tage | Wachstum am Ende | Inflation am Ende | Konkreter Befund |
|---|---:|---:|---:|---|
| Aktive Referenzregierung | 1.825 / 1.825 | 6,01 / 6,07 % | 8,72 / 13,41 % | Rechtssicherheit 60,9 / 59,3; Fachkräfte 77,9 / 77,5. |
| Nicht handeln | 1.825 / 1.791 | 5,20 / 5,07 % | 7,53 / 12,06 % | Rechtssicherheit nur 36,0 / 37,3; Fachkräfte 53,4 / 43,7. Ein Regierungssturz. |
| Rechtsstaat aufbauen | 1.825 / 1.825 | 4,83 / 6,00 % | 9,33 / 10,03 % | Rechtssicherheit 95,1 / 87,6; jeweils 16 Agenda-Gesetze eingebracht. |
| Rechtsstaat abbauen | 1.825 / 1.825 | 4,18 / 3,67 % | 14,63 / 14,03 % | Rechtssicherheit 12,5 / 11,0; Fachkräfte etwa 45. Parlament und Umsetzung verhindern teilweise die vollständigen Extremziele. |
| Industrie mit Bildung/Forschung | 1.825 / 1.825 | 9,15 / 8,85 % | 9,51 / 13,82 % | Industrie 81,3 / 80,4; Produktivität 100,0 / 89,5; Fachkräfte 89,8 / 71,9. |
| Industrie bei Bildungsstau | 1.825 / 1.825 | 5,79 / 6,71 % | 8,27 / 12,98 % | Fachkräfte 58,8 / 46,3; Forschungstempo 0,769 statt 1,231. Chipentwurf bleibt an Hochschulen gesperrt. |
| Rezession bewältigen | 1.825 / 1.825 | 6,22 / 6,14 % | 14,57 / 17,29 % | Wachstum erholt sich, aber Inflation und Schuldenquote bleiben höher als in der Referenz. |
| Schwere Inflationskrise | 695 / 665 | 2,70 / 3,93 % | 110,98 / 135,81 % | Beide Regierungen stürzen. Routine-Krisenbearbeitung reicht nicht. |
| Inflationskrise mit Stabilisierung | 787 / 726 | 0,91 / 0,31 % | 61,38 / 79,83 % | Vorsichtige und unabhängigere Zentralbank dämpft die Inflation; Wachstum und Rückhalt leiden. Beide Regierungen stürzen später trotzdem. |
| Krieg und Friedensschluss | 1.825 / 1.825 | 5,12 / 6,49 % | 9,17 / 15,40 % | Zwölf tatsächliche Kriegswochen, dann weißer Frieden; 345 / 308 Gefallene im Modell. |
| Konkrete Fabrikoffensive | 1.825 / 1.825 | 7,38 / 7,85 % | siehe Rohbericht | Batteriezellen, Chipentwurf und Robotik tatsächlich begonnen; konkurrierende Vorhaben und Verwaltung begrenzen den Fortschritt. |

**Unterlassen wirkt, aber nicht überall als sofortiger Absturz:** Die Wirtschaft besitzt bereits Kapital, Infrastruktur und laufende Aktivitäten. Das passive Land wächst noch, während Institutionen und Fachkräfte schwächer werden. Umgekehrt liefert mehr Industrie allein keine gesunde Gesamtlage. Beim Bildungsstau liegt ein Industrieindex sogar geringfügig über dem Vergleich, während Fachkräfte, Produktivität und Forschung schlechter ausfallen. Deshalb wird kein pauschaler „alles wird schlechter“-Bonus eingebaut.

**Extrempolitik bleibt ein politischer Versuch:** Die Kampagnen streben Justiz/Antikorruption 100 bzw. 0 sowie gegensätzliche Medien- und Freiheitsregeln an. Eingebrachte Gesetze, tatsächlich beschlossene Ziele und gereifte Wirkungen werden getrennt gespeichert. Der Test setzt nicht sämtliche Rechtsstaatsregler sofort auf den gewünschten Endpunkt.

## Behobene Fehler und sichtbare Verbesserungen

### 1. Staatskasse statt verschwundener Überschüsse und negativer Schulden

Vorher konnte eine Einnahme von 0,6 % des BIP bei 0,1 % Bruttoschulden den Schuldenstand auf −0,5 % senken. Monatliche Überschüsse nach vollständiger Tilgung wurden zwar ausgewiesen, standen aber später nicht zur Verfügung.

Jetzt gibt es einen gespeicherten nominalen Kassenbestand. Einnahmen tilgen zuerst Schulden, darüber hinausgehende Beträge bleiben in der Kasse. Ausgaben nutzen zuerst vorhandene Kasse und nehmen nur für den Rest neue Kredite auf. Derselbe Buchungskern gilt für Krisen, Katastrophen, Bau, Diplomatie, Ressortentscheidungen und sonstige einmalige Finanzierungen. Politisches Kapital und die Nachfrage-/Vertrauensfolgen der jeweiligen Aktion bleiben getrennt.

Der Monatsabschluss zeigt Anfangs- und Endbestand der Kasse, Entnahme, Defizit einschließlich Zinsen, Wechselkursbewertung und Schulden. Finanzübersicht und Ereignisvorschau nennen die tatsächlich verwendete Kasse. Vorschauen aktualisieren sich bei einer veränderten Finanzierung auch am selben Tag. Alte Abschlüsse ohne Kassenkonto bleiben historische Belege und erhalten kein rückwirkend erfundenes Guthaben.

Zusätzlich zu den Kampagnen sind drei kontrollierte Zehnjahresrechnungen mit Wachstum, Rezession, hoher Inflation, Defiziten/Überschüssen, Auf-/Abwertung und Einzelkosten geprüft. Die maximale auf das BIP normierte Schuldenabweichung in den 22 Kampagnen beträgt rund `5,7e-17`; die jährliche Finanzidentität weicht höchstens um `1,1e-16` ab. Das sind Rundungsreste, kein verlorener Bestand.

Die Trennung von Defizitfluss, Schuldenstock und Wechselkursbewertung orientiert sich am [IWF-Arbeitspapier zu Schuldenpfaden in lokaler und fremder Währung](https://www.imf.org/-/media/files/publications/tnm/2021/english/tnmea2021005.pdf). Die Kasse ist eine ausgewiesene Spielregel, unverzinst und nominal; die Quelle kalibriert weder unsere Kosten noch einen optimalen Kassenbestand.

### 2. Tatsächlicher Nachschub für jede Front

Vorher konnte eine neue Front die friedliche Monatsbilanz als vollständige Versorgung lesen. Eine zweite Front ohne Beleg wurde beim Durchschnitt teilweise ganz ausgelassen. Nach einem erneuten Krieg mit demselben Land konnte außerdem der alte Einsatzbeleg weiter gelten.

Jetzt zählt der tatsächliche Verbrauch je aktivem Einsatz. Eine noch nicht versorgte Front trägt ihren Bedarf mit null gebuchtem Verbrauch bei. Neue Belege sind an die konkrete Kriegskennung gebunden. Waffenstillstände verwenden ihren geringeren Bedarf; beendete Fronten verschwinden aus der aktiven Kartenanzeige. Alte Depotbestände bleiben erhalten und werden nicht gelöscht.

Bis zur ersten echten Monatslieferung gilt der bestehende Mindestfaktor von 25 % der sonst verfügbaren Kampfstärke. Die Karte erklärt diesen Zustand und zeigt ihn nicht als grüne Vollversorgung. Die Lieferrechnung bleibt monatlich; es wurde keine zusätzliche tägliche Logistiksteuerung eingeführt.

Der Vergleich gegen denselben Kampagnenstart zeigt den praktischen Unterschied: Im ersten Kriegsverlauf standen zuvor 235 Gefallene und ein Frontwert von 87,0, danach 345 und 68,8. Im zweiten standen zuvor 227 und 99,9, danach 308 und 72,8. Das ist ein Nachweis der wirksamen Versorgungsanbindung, **kein Beleg, dass sämtliche Kriegsfälle schon gut ausbalanciert sind**. Mehrere Fronten, Waffenruhe und Belegwechsel sind zusätzlich gezielt geprüft. Die maximale Abweichung der Gütererhaltung beträgt `2,9e-14` in den jeweiligen Mengeneinheiten.

### 3. Ehrliche Termine für Forschung und Industrie

Vorher fehlte das Forschungstempo in der simulierten Baureihenfolge. Einzelkarten berechneten ihre Restdauer teilweise ohne den Kapazitätsverbrauch davorliegender Projekte. Pausierte Vorhaben versprachen weiter eine Fertigstellung.

Baureihenfolge und Projektkarte verwenden jetzt dieselbe monatliche Kapazitätsrechnung mit dem heutigen Forschungstempo. Fertige Vorgänger geben Kapazität frei; Pausen und nicht bestimmbare Termine werden ausdrücklich angezeigt. Die Abschlussgrenze entspricht dem tatsächlichen Monatslauf. Der Wissensbaum erklärt, dass Termine bei heutigem Etat, Tempo, Verwaltung und Baukapazität geschätzt sind; spätere Krisen und Baurisiken sind nicht vorherbestimmt. Texte sind in DE/EN/TR vorhanden.

Ein isolierter echter Bauablauf bestätigt den Termin: Ein Projekt mit zehn Monaten Grunddauer braucht bei halbem Forschungstempo genau zwanzig Monatsfortschreibungen. Ein langes vorrangiges Vorhaben erzeugte vorher fälschlich zehn statt 235 prognostizierte Monate. Ein gereifter Forschungsbudgetwechsel aktualisiert die Schätzung sofort, ohne Baufortschritt zu schenken.

Die anschließende Fabrikkampagne behält exakt dieselben Aktionen, Monatszustände und Endwerte wie vor dieser Anzeigekorrektur. Nur die falschen Prognosen ändern sich. Nach fünf Jahren liegen die drei gezielt begonnenen Vorhaben bei:

| Vorhaben | Fortschritt, Zufallsstand 5 / 17 | Jetzt korrekt geschätzte Restmonate |
|---|---:|---:|
| Chip-Entwurfszentrum | 59,2 / 44,3 % | 58 / 80 |
| Batteriezellfabrik | 39,5 / 34,4 % | 102 / 112 |
| Robotikoffensive | 46,9 / 55,9 % | 71 / 63 |

Die Fabriken wurden also **nicht** in fünf Jahren fertiggestellt. Sie beginnen erst im Verlauf der Amtszeit, konkurrieren mit anderen Vorhaben und leiden unter begrenzter Verwaltung. Die neuen Termine machen dieses Problem sichtbar, beheben aber nicht automatisch jede Kapazitäts- oder Priorisierungsentscheidung. Die vorhandene Vorziehfunktion kostet Verwaltung und verdrängt andere Projekte; sie wurde in diesen Kampagnen nicht als zusätzliche Strategie eingesetzt.

## Prüfung und Reproduktion

**406 unterschiedliche gezielte Tests bestanden, davon 40 neu. TypeScript und Produktionsbuild bestanden.** Wiederholte Läufe werden nicht mehrfach addiert. Die 22 Kampagnen bilden elf parametrisierte Tests; zehn Szenarien stehen im allgemeinen Kampagnenbericht, die spätere Fabrikoffensive separat. Hinzu kommen die gezielten Finanz-, Behörden-, Versorgungs-, Kriegs-, Haushalts-, Ereignis- und Bauprüfungen. Die früheren fehlgeschlagenen Läufe bleiben als Zwischenstände erhalten.

Aus `game/`:

```sh
REGIERUNGS_STRESS_AUS=../reports/Regierung-Wiederholung.json npm test -- test/regierungs-stresstest.test.ts
npm test -- test/langzeit-regression.test.tsx test/industrie-termine.test.tsx
npm run build
```

Optional begrenzen `REGIERUNGS_STRESS_SZENARIEN=krieg,industrie` und `REGIERUNGS_STRESS_SEEDS=5` den gezielten Lauf. Vollkampagnen werden nicht standardmäßig erneut ausgeführt, wenn nur eine kleine Anzeige geprüft werden muss.

Nachweise:

- `reports/Regierung-Langzeit-Basis-2026-11-02.json`: korrigierte, vergleichbare Ausgangskampagnen vor den Produktionsänderungen, zehn Szenarien mit beiden Zufallsständen.
- `reports/Regierung-Langzeit-Nachher-2026-11-02.json`: dieselben 20 Kampagnen nach Finanz-/Versorgungskorrektur. Die damaligen Bau-Restschätzungen sind durch den späteren Terminfix überholt; Zustände und Aktionen bleiben gültige Messungen.
- `reports/Industrie-Aufbau-Nachher-2026-11-02.json`: zwei zusätzliche Kampagnen mit gezielten Werken und abschließend korrigierten Restterminen.
- `reports/Langzeit-Fehler-Vorher-2026-11-02.json` und `Industrie-Termine-Vorher-2026-11-02.json`: sieben vor der Korrektur reproduzierte Fehler.
- `reports/Langzeit-Korrekturen-Pruefung-2026-11-02.json`, `Langzeit-Regression-Final-2026-11-02.json`, `Industrie-Termine-Abschluss-2026-11-02.json`: jüngste gezielte Ergebnisse pro betroffener Testdatei. Die beiden Kampagnen-Prüfberichte ergänzen die elf Szenariotests.
- `reports/Regierung-Langzeit-Stand-2026-11-02.json`: zusammengeführte Zahlen, eindeutige Testzählung und Prüfsummen der geprüften Quellen und Berichte.
- `reports/Regierung-Langzeit-Build-Abschluss-2026-11-02.log`: erfolgreicher letzter TypeScript-/Produktionsbuild.

`Regierung-Langzeit-Vorher` und `Ersttest` sind frühe explorative Läufe mit einem weniger vollständigen Regierungsbot. Sie werden nicht mit dem korrigierten Basislauf vermischt. Zwischenzeitliche Fixture-Fehler (unter anderem ein falscher Ereignisbezeichner und eine Prüfung vor tatsächlicher Behördenfertigstellung) sind in den nachfolgenden erfolgreichen Läufen korrigiert.

## Verbleibende, durch die Läufe begründete Aufgaben

1. **Schwere Inflation:** Die geprüfte Zentralbankstrategie senkt Inflation und verlängert die Amtszeit, rettet die Regierung aber nicht. Als nächster Balancevergleich fehlen koordinierte soziale Entlastung, glaubwürdiger Fiskalkurs und Koalitionssicherung gegen dieselben Anfangsschocks. Eine garantierte Rettung wäre keine sinnvolle Fehlerkorrektur.
2. **Industrie und Verwaltung:** Die langfristigen Werke brauchen eine besser sichtbare Priorisierung gegen bereits laufende Bauprogramme. Ein Folgeversuch sollte das bestehende Vorziehen, Verwaltungsausbau und selektives Pausieren vergleichen, bevor Baukosten oder Dauern pauschal gesenkt werden.
3. **Langfristiges Wachstum:** Der Industriepfad erreicht knapp 9 % Jahreswachstum und einmal den oberen Produktivitätsindex. Ob dies über längere Zeit zu leicht eskaliert, ist mit fünf Jahren und zwei Zufallsständen nicht entschieden. Eine längere Kalibrierung gehört vor pauschale zusätzliche Industriebuchungen.
4. **Krieg:** Geprüft sind ein regionaler Konflikt, Mobilisierung, Nachschub und Friedensschluss, plus vorhandene gezielte Kriegsfälle. Große Bündniskriege, jahrelange Besatzung, Seekrieg und alle Friedensbedingungen sind hier nicht vollständig als Kampagnen abgenommen. Der Monatsrhythmus der Versorgung bleibt eine Vereinfachung.
5. **Bedienbarkeit:** Die geänderten Texte und Komponenten sind serverseitig geprüft, nicht visuell im Browser. Es gibt keine neuen Screenshots. Die bestehende Zugriffssperre wurde nicht erneut geprüft oder umgangen.

Die bestehenden Build-Warnungen zum optionalen Infrastruktur-Export und zu großen Paketen bleiben offen. Die Prüfung ist eine konkrete Erweiterung der Abdeckung, keine Behauptung, dass das gesamte Spiel fertig oder vollständig historisch kalibriert sei. Lokaler Arbeitszweig und GitHub-Standardzweig werden auf ausdrücklichen Nutzerauftrag ohne Umschreiben der Historie synchronisiert.
