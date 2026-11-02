# Versorgung verbindet Wirtschaft, Handel und Krieg

Stand: 29. Oktober 2026. Implementiert auf W4 im lokalen Zweig `codex/spiel-konsistenz`.

## Was sich im Spiel verändert

Eine gemeinsame Monatsbilanz führt für jede Warengruppe Anfangsbestand, Produktion, tatsächliche Einfuhr, zivile Verwendung, militärischen Treibstoff, Ausfuhr und Endbestand. Dieselben Mengen tragen die Vorräte, die Handelszahlungen und die Versorgung der Streitkräfte. Ein Monatsabschluss kann nicht doppelt abgerechnet werden.

- Krieg und Sanktionen unterbrechen Lieferbeziehungen. CAATSA betrifft Elektronik und Rüstung, kein pauschales Lebensmittelembargo. Hormus und die vorhandene Hafenkapazität begrenzen tatsächlich eintreffende Mengen. Häfen begrenzen auch Exporte.
- Lager überbrücken fehlende Lieferungen. Nicht gedeckte Nachfrage wirkt auf die bestehenden Preis-, Versorgungs- und Wirtschaftsknoten. Ausfälle verschwinden nicht mehr automatisch nach einigen Monaten.
- Gas und Kohle begrenzen die Stromproduktion; Gas und Strom begrenzen Dünger und Industrie; Wasser und Dünger wirken auf die Landwirtschaft. Die Versorgung des abgerechneten Monats begrenzt die Produktion des Folgemonats.
- Krieg benötigt zusätzliches Öl. Bei Knappheit verteilt die gewählte Priorität den vorhandenen Bestand zwischen ziviler Wirtschaft und Streitkräften. Fehlender Einsatztreibstoff senkt die tatsächliche Kampfstärke. Material- und Energiemangel verzögert Beschaffung und Modernisierung.
- Tatsächlich gelieferte Importe und Exporte verändern die Leistungsbilanz und damit den Devisenbedarf. Es wird die Abweichung gegenüber dem bereits im Ausgangsszenario enthaltenen Warenhandel gebucht; die bestehenden Preis-, Tourismus- und Kapitalflusskanäle bleiben erhalten.
- Reservekäufe sind Lieferaufträge mit mindestens 30 Tagen Vorlauf. Freie Einfuhrkapazität bestimmt Teillieferungen. Ein offener Auftrag kann nicht erneut gekauft werden. Lieferantenwechsel braucht ebenfalls Vorlauf und verursacht einen Aufpreis. Eine Senkung des Reservebedarfs verändert künftige Nachkäufe, vernichtet aber keine Ware.

## Bedienung

**Wirtschaft und Haushalt → Instrumente → Versorgung & Handel** zeigt die letzte Abrechnung, ungedeckte Warengruppen, Einsatztreibstoff und den Warenhandel gegenüber der Ausgangslage. Drei Schaltflächen setzen die Verteilungspriorität für den nächsten Abschluss.

Jede Ware zeigt eine nachvollziehbare Mengenrechnung für den nächsten Monat, Einfuhrkosten, Ausfuhrerlöse, Lieferhindernisse und offene Aufträge. Die letzte tatsächliche Abrechnung bleibt zusätzlich einsehbar. Das Kriegsdossier verwendet dieselbe Versorgungsanzeige. Laufende Rüstungsvorhaben zeigen angesammelte Versorgungsverzögerungen.

Die Texte stehen auf Deutsch, Englisch und Türkisch zur Verfügung. Eine bestehende globale CSS-Kollision zwischen Kabinettsumbildung und Übersichtskarten wurde beseitigt, damit die Warenkarten korrekt angeordnet werden. Der Größenbeobachter der Karte ignoriert nach dem Abbau der Ansicht verspätete Meldungen, statt auf ein fehlendes Element zuzugreifen.

## Modellgrenzen dieser ersten Umsetzung

Die nationale Versorgungskette wurde inzwischen um regionale Korridore, Lager und Frontdepots ergänzt; siehe [Regionale Versorgung](REGIONALE_VERSORGUNG_2026-10-29.md). Einzelne Konvois und taktische Fahrzeuge bleiben außerhalb des Modells. Industrien werden durch die Deckung ihrer Vorprodukte begrenzt; es gibt noch keine Stücklisten und gesonderten Materialkonten je Fabrik. Der bestehende Munitionsbestand und Verteidigungshaushalt bleiben eigene, bereits vorhandene Systeme.

Referenzpreise, Transportanteile, Produktionsgewichte, Importspielräume und militärischer Mehrverbrauch sind ausdrücklich Spielparameter. Langfristige Spielbalance und vollständige Feldzugslogistik sind damit noch nicht abgeschlossen. Alte Spielstände behalten ihre vorhandenen Vorräte und erhalten die neuen optionalen Felder erst bei Bedarf.

## Prüfung

Automatisierte Prüfungen decken Mengenerhaltung, einmalige Abrechnung, Lieferzeiten, Teilmengen, Hafenschäden, Ausfuhrbegrenzung, Vorprodukte, Priorisierung, militärische Folgen, Devisenbuchung, Speicherung und Wiederherstellung sowie die Erholung nach einer aufgehobenen Blockade ab. Die neuen Ansichten werden in allen drei Sprachen geprüft.

Die Gesamtprüfung mit anschließenden gezielten Nachprüfungen umfasst 1.983 bestandene und einen bereits vorhandenen übersprungenen Test. Das genaue Vorgehen steht in `PRUEFUNG_VERSORGUNG_2026-10-29.md`. TypeScript-Prüfung und Produktionsbuild sind erfolgreich. Im Browser wurden die Übersicht, die Verteilungspriorität sowie ein Reserveauftrag mit unverändertem Lager, Liefertermin und gesperrtem Doppelkauf geprüft. Ein Monatsabschluss sowie Speichern und Laden wurden auch über die Oberfläche durchgespielt.

Der vorhandene Test `test/_extrakt.test.ts` ist im großen Prüflauf ausgeschlossen: Er liest eine nicht mehr vorhandene externe Claude-Scratchpad-Datei und scheiterte bereits vor dieser Änderung. Das ist keine übersprungene Prüfung der Versorgungskette.

## Einstieg in den Code

- `game/src/sim/gueter.ts`: gemeinsame Mengenrechnung und Spielerhandlungen.
- `game/src/sim/versorgung.ts`: gespeicherte Bilanz, Vorproduktabhängigkeiten, militärische Ableitungen und Referenzpreise.
- `game/src/sim/devisen.ts`: einmalige finanzielle Abrechnung der Liefermengen.
- `game/src/sim/krieg.ts`, `streitkraefte.ts`: Kampfstärke und Beschaffungsverzug.
- `game/src/ui/gueter/VersorgungsLage.tsx`, `Inventar.tsx`: Übersicht und Ursachenanzeige.
- `game/test/versorgung.test.tsx`: zusammenhängende Szenario- und Regressionstests.

Lokal starten: im Ordner `game` die Abhängigkeiten mit `npm ci` installieren und `npm run dev` ausführen. Für die bereits gebaute Fassung: `npm exec -- vite preview --host 127.0.0.1 --port 5188`.
