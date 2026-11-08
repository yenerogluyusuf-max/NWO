# Regionale Transportwege und Frontdepots

Implementiert am 29. Oktober 2026 in `Spielentwicklung`, Zweig `codex/spiel-konsistenz`, auf der bereits implementierten gemeinsamen Warenbilanz.

## Im Spiel

Die Kartenebene **Versorgungswege** (Taste **V**, außerdem Verweis in Versorgung & Handel und im Kriegsdossier) zeigt Straßen-, Bahn- und Seekorridore sowie getrennt Gasleitungen. 17 Umschlagknoten versorgen alle 81 Provinzen. Die Karte markiert offene, eingeschränkte und gesperrte Strecken. Ausgewählte Strecken zeigen Ursache, nutzbare Kapazität, bleibenden Schaden und zuletzt transportierte Warengruppen; die angrenzenden Knoten führen zu regionaler Bedarfsdeckung oder zum Frontdepot.

Die neu gestaltete Lagekarte hat einen dunkelgrünen Kopf, eine hervorgehobene Bedarfsanzeige, kompakte Vorratskennzahlen und einen festen Maßnahmenbereich. Krisen erhalten eindeutige Statusmarkierungen; unterbrochene Korridore tragen zusätzlich Sperrsymbole. Die Detailtafel lässt sich einklappen. Auf schmalen Bildschirmen steht sie unten, damit die Karte darüber erreichbar bleibt. Die Auswahl eines Knotens oder einer Strecke führt die Kamera dorthin. Alle Angaben sind auf Deutsch, Englisch und Türkisch verfügbar.

## Wirksame Folgen

- Waren liegen in regionalen Lagern. Transporte teilen begrenzte Streckenkapazitäten über Warengruppen hinweg. Die Suche benutzt freie Alternativwege. Hinter einer vollständigen Sperre bleibt Ware liegen.
- Gegnerische Vorstöße aus der vorhandenen Kriegssimulation sperren betroffene Landkorridore; Frontkämpfe und Seekonflikte vermindern Kapazität. Schäden wachsen im Krieg und bleiben nach der Waffenruhe bestehen.
- Zivile Fehlmengen wirken auf die vorhandenen Preis- und Versorgungsknoten genau der betroffenen Provinzen. Energie und Vorprodukte begrenzen die Produktion des Folgemonats über die gemeinsame nationale Warenbilanz. Tatsächlich geroutete Exporte tragen die Außenrechnung.
- Jede aktive Front bekommt ein zunächst leeres rückwärtiges Depot. Dessen Öl wird aus den nationalen/regionalen Beständen entnommen, physisch geliefert und separat verbraucht. Ein normal gefülltes Depot hält 15 Tage bei gleichbleibendem Bedarf.
- Ist die Front abgeschnitten, puffert nur der vorhandene Depotbestand. Danach sinkt der Treibstofffaktor ausschließlich dieser Front, bis auf 25 % der sonstigen Kampfstärke. Andere Fronten behalten ihre eigene Versorgung. Dies ersetzt nicht die bestehenden Faktoren für Material, Moral, Führung und Gelände.

## Entscheidungen mit Preis und Vorlauf

| Maßnahme | Kapital | BIP-Kosten | Vorlauf | Wirkung |
|---|---:|---:|---:|---|
| Strecke reparieren | 3 | 0,030 % | 14 Tage | 65 Prozentpunkte Schaden beheben; öffnet keinen vom Gegner gesperrten Weg |
| Umleitung organisieren | 3 | 0,020 % | 7 Tage | Auf einem tatsächlich offenen Alternativpfad 50 % zusätzliche Kapazität für 90 Tage |
| Luftbrücke | 4 | 0,040 % | 7 Tage | Begrenzter Nachschub aus Ankara für 60 Tage; braucht vorhandenen Treibstoff |
| Depot ausbauen | 3 | 0,015 % | 21 Tage | Zielbestand von 15 auf 30 Tage erhöhen; die Ware muss anschließend geliefert werden |

Nach dem Vorlauf steht die Maßnahme bereit; Liefermengen und Verbräuche werden wie die übrige Warenbilanz am Monatswechsel abgerechnet. Offene Aufträge werden nicht doppelt berechnet. Umleitung und Luftbrücke laufen aus. Reparaturen werden einmal wirksam. Depotaufträge erzeugen keinen kostenlosen Bestand.

## Speicherung und Modellgrenzen

Alte Spielstände erhalten die regionale Zuordnung vorhandener Bestände ohne zusätzliche Ware. Kartenansichten kopieren den Transportzustand für die Vorschau; sie buchen keine Lieferungen. Monatsabschlüsse bleiben einmalig. Lager, Schäden, Depots und Maßnahmen werden gespeichert.

Die Linien sind strategische Spielkorridore, keine vermessenen Straßen oder Pipelines. Mengen verschiedener Warengruppen werden mittels normalisierter Transportpunkte auf gemeinsame Kapazitäten umgerechnet. Kapazitäten, Frontverbrauch und Aktionspreise sind Spielparameter. Produktion und ziviler Bedarf werden derzeit anhand der Bevölkerung auf Umschlagregionen verteilt; individuelle Fabrikstücklisten fehlen weiterhin. Strom, Wasser und Rüstung bleiben in ihren vorhandenen aggregierten Netzen. Frontdepots sind feste rückwärtige Bereitstellungslager nahe der Grenze beziehungsweise beim Ausgangshafen für Fernoperationen; bewegliche Konvois und einzelne taktische Fahrzeuge sind nicht modelliert. Vorräte beendeter Fronten bleiben im jeweiligen Depot erhalten und stehen bei einem erneuten Einsatz dort zur Verfügung.

## Prüfung

- Gesamtlauf: **1.995 bestanden, 0 fehlgeschlagen, 1 bereits vorhandener Test übersprungen**. Der bestehende `_extrakt.test.ts` wurde wie zuvor ausgeschlossen, da er eine externe, fehlende Claude-Scratchpad-Datei benötigt.
- 74 gezielte Prüfungen für Transport, Waren, Devisen, Versorgung und Kartenebenen bestanden.
- Neue Szenarien prüfen alle 81 Provinzen, Fracht-/Gas-Erreichbarkeit, Mengenerhaltung einschließlich Depotkonto, gemeinsame Kapazitäten, idempotenten Abschluss, Speicherung, regionale Preise, getrennte Frontversorgung, Depotreserve, Luftbrücken ohne kostenlose Ware, Ausbauzeiten, dauerhafte Kriegsschäden, Reparatur und echte Umleitungen.
- Nach der abschließenden gestalterischen Überarbeitung: 44 gezielte Tests bestanden, einschließlich Darstellung auf Deutsch, Englisch und Türkisch.
- TypeScript-Prüfung und Produktionsbuild erfolgreich. Vorhandene Buildwarnungen zu einem optionalen Infrastruktur-Haushaltsexport und großen Bundles bleiben bestehen.
- Neue Gestaltung im Browser bei 988 × 800 und 700 × 800 geprüft; Ein-/Ausklappen funktioniert. Die doppelte Kartenlegende entfällt in der Versorgungsebene. Screenshot: `../reports/Regionale-Versorgung-2026-10-29.png`.
- Im Browser: Krisenstand über den regulären Dateiimport geladen, rote Syrien-Zufahrten und getrennte Iran-Front angezeigt. Syrien: 0 % gedeckter Einsatzbedarf, 25 % Versorgungsfaktor. Luftbrücke beauftragt: Kapital 150 → 146, bereit ab 12. Juni, kein sofortiger Bestand, erneute Bestellung gesperrt.

## Code

- `game/src/data/transport.ts`: Graph und regionale Zuordnung.
- `game/src/sim/transport.ts`: Routen, Lager, Depotbilanz, Schäden und Maßnahmen.
- `game/src/sim/gueter.ts`: gemeinsame monatliche Abrechnung und regionale Folgen.
- `game/src/sim/versorgung.ts`, `krieg.ts`: Versorgung je Front.
- `game/src/ui/gueter/TransportKarte.tsx`, `transport.css`: Bedienung und Erklärung.
- `game/src/ui/atlas/AtlasMap.tsx`: projizierte, auswählbare Kartenlinien und Knoten.
- `game/test/transport.test.tsx`: Szenarien und Übersetzungsprüfung.
