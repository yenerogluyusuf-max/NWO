# Politiknetz

Stand: 28. September 2026. Umsetzung der Entscheidung „Eingabe wie Democracy 4, realistisch und regional“ ([Spieldesign](SPIELDESIGN.md), Abschnitt 5). Der Katalog steht in [`game/src/data/politiknetz.ts`](game/src/data/politiknetz.ts), der Rechenkern in [`game/src/sim/netz.ts`](game/src/sim/netz.ts).

## Umfang

| Art | Anzahl | Beispiel |
|---|---|---|
| Maßnahmen | 90 | Mindestlohn, Mehrwertsteuer, Wasserleitungen, Friedensprozess, Internetsperren |
| Größen | 79 | Gefühlte Teuerung, Wasserversorgung, Abwanderung von Fachkräften, Pressefreiheit |
| Eingänge aus dem Wirtschaftsmodell | 7 | Inflation, Arbeitslosigkeit, Wachstum, Leitzins, Abwertung, Defizit, Schulden |
| Probleme | 15 | Wassermangel, Wohnungsnot, Ärztemangel, Abwanderung von Fachkräften, Korruptionsskandale |
| Wählergruppen | 8 | Rentner, Beschäftigte, Unternehmer, Landwirte, Junge, Staatsbedienstete, Religiös-Konservative, Säkulare Städter |
| **Knoten gesamt** | **199** | in 12 Themenfeldern plus Wählergruppen; je Feld eine Modernisierungsleiter (Mechanisierung, Agrarforschung, Industrie, Verwaltung, Fachkräfte, Bildungstechnik, Medizintechnik, Smarte Infrastruktur, Speicher/Smart Grid, Industrieller Wohnungsbau, Sicherheitsverwaltung, Digitale Öffentlichkeit, Handelssysteme) nach Victoria 3/Anno |
| **Verbindungen** | **643** | jede mit Stärke, Verzögerung und einem Satz Begründung (Stand 30. September: 412 plus 231 politische Folgen, siehe unten) |

## Wie es rechnet

- **Jeder Knoten hat einen Wert je Provinz** (Index 0 bis 100, „mehr davon“ ist höher). Die Eingänge behalten ihre Einheit.
- **Eine Verbindung gibt monatlich einen Anteil der Abweichung ihres Ausgangsknotens vom Startwert weiter**, mit 0 bis 12 Monaten Verzögerung. Beim Start ist das Netz deshalb in Ruhe. Bewegung entsteht aus Entscheidungen, aus dem Wirtschaftsmodell, aus regionalen Unterschieden und später aus Zufallsereignissen.
- **Jeder Knoten kehrt langsam zu seinem Startwert zurück** (Trägheit). Wählergruppen gewöhnen sich schneller an eine neue Lage als Größen wie die Wasserversorgung.
- **Maßnahmen werden schrittweise umgesetzt:** Eine Änderung braucht so viele Monate, wie im Katalog steht (Mindestlohn 1, Schulbau 24, Bahnausbau 48). Erst der umgesetzte Anteil wirkt.
- **Probleme sind akut**, wenn ihr Wert in einer Provinz die Schwelle überschreitet (meist 60). Akute Probleme haben eigene Folgen, etwa für Vertrauen und Wählergruppen.
- **Kopplung ans Wirtschaftsmodell:**
  - Die Kosten aller Maßnahmen gegenüber dem Start (Steuern als negative Kosten) fließen in Nachfrage und Schulden.
  - Der Kostendruck der Betriebe wirkt auf die Inflation.
  - Die Produktivität verschiebt das Potenzialwachstum.

## Politische Folgen (30. September)

Vorher hingen viele Maßnahmen nur an ihrem Hauptziel (53 von 90 hatten höchstens zwei ausgehende Verbindungen), und in der Vorschau blieb deshalb fast nur der Haushalt als Folge. Jetzt trägt jede Maßnahme zusätzlich die Folgen, die ein Land tatsächlich spürt: Wählergruppen (wer profitiert, wer verliert), Ansehen im Ausland und Beziehung zur EU, Nebenwirkungen auf Größen wie Pressefreiheit, Polarisierung, Rechtssicherheit oder Landflucht. Beispiele: Medienaufsicht senkt Pressefreiheit, Ansehen und die Beziehung zur EU und verärgert Städter und Junge; die Rentenerhöhung freut Rentner und belastet Junge und Beschäftigte, die die Beiträge zahlen; Bauamnestie stützt Hausbesitzer, schwächt aber Erdbebenvorsorge und Rechtssicherheit.

- Die Verbindungen stehen am Ende von `politiknetz.ts` in zwei Blöcken („Politische Folgen“, „Politische Folgen II“) und laufen über `ee(...)`: Was schon eine Verbindung zwischen denselben Knoten hat, bleibt unverändert.
- Stärken 0,01 bis 0,05, damit sie im Größenbereich der übrigen Kanten liegen; Wählergruppen reagieren schnell (Verzögerung 0 bis 3 Monate), Größen langsam (6 bis 12).
- Auch diese Werte sind Spielparameter, keine Messwerte. Jede Verbindung hat einen Begründungssatz.
- Wirkung auf die Balance: Der kluge Bot im Spielbarkeitstest gewann danach leichter. Zur Nachjustierung stieg die Regierungsmüdigkeit von 0,25 auf 0,28 je Monat, „Hart“ hat jetzt den Faktor 1,25 (vorher 1,4). Messung mit dem klugen Bot (8 Seeds): Entspannt 8, Normal 7, Hart 2 Siege von 8.

Danach hat jede der 90 Maßnahmen mindestens drei Folgen (vorher: 53 mit höchstens zwei). Am dünnsten bleibt die Gruppe der Staatsbediensteten mit fünf eingehenden Verbindungen; dort fehlen noch Folgen etwa für Verwaltungsdigitalisierung und Sicherheitsverwaltung.

## Prüfungen (automatisch)

- Alle Verbindungen zeigen auf bekannte Knoten, jeder Knoten ist verbunden, jede Verbindung hat eine Begründung.
- Ohne Anstoß bleibt das Netz in Ruhe; Störungen klingen ab, statt sich aufzuschaukeln.
- Ein höherer Mindestlohn bringt höhere Reallöhne, zufriedenere Beschäftigte und mehr Kostendruck.
- Wasserleitungen senken nach einigen Jahren den Wassermangel.
- Maßnahmen kosten Geld und erhöhen die Schulden.
- Zehn Spieljahre mit dem vollen Netz rechnen in etwa 45 Millisekunden.

## Stand und Grenzen

- **Stärken und Verzögerungen sind grob geschätzt.** Sie folgen den Richtungen aus dem [Wirtschaftsmodell](WIRTSCHAFTSMODELL.md) und allgemeinem Lehrbuchwissen, sind aber nicht kalibriert. Die Kalibrierung folgt mit automatisierten Testläufen, wie im Wirtschaftsmodell, Abschnitt 7, beschrieben.
- **Regionale Unterschiede fehlen noch.** Alle Provinzen starten gleich, bis die Provinzdaten eingearbeitet sind (Bevölkerung, Einkommen, Arbeitslosigkeit, Wahlergebnisse).
- **Heikle Themen** (Friedensprozess, religiöse Schulen, Medienaufsicht, Migration) sind drin, mit Begründungen, die beide Seiten nennen. Vor einer Veröffentlichung liest eine Person mit Landeskenntnis gegen ([Länderpaket Türkei](LAENDERPAKET_TUERKEI.md), Abschnitt 5).
- **Die Wählergruppen** sind vorerst sozioökonomisch und weltanschaulich gegliedert. Ob und wie weitere Gruppen abgebildet werden, entscheidet der Projektinhaber nach dem Gegenlesen.
