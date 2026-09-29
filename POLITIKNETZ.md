# Politiknetz

Stand: 28. September 2026. Umsetzung der Entscheidung „Eingabe wie Democracy 4, realistisch und regional“ ([Spieldesign](SPIELDESIGN.md), Abschnitt 5). Der Katalog steht in [`game/src/data/politiknetz.ts`](game/src/data/politiknetz.ts), der Rechenkern in [`game/src/sim/netz.ts`](game/src/sim/netz.ts).

## Umfang

| Art | Anzahl | Beispiel |
|---|---|---|
| Maßnahmen | 77 | Mindestlohn, Mehrwertsteuer, Wasserleitungen, Friedensprozess, Internetsperren |
| Größen | 79 | Gefühlte Teuerung, Wasserversorgung, Abwanderung von Fachkräften, Pressefreiheit |
| Eingänge aus dem Wirtschaftsmodell | 7 | Inflation, Arbeitslosigkeit, Wachstum, Leitzins, Abwertung, Defizit, Schulden |
| Probleme | 15 | Wassermangel, Wohnungsnot, Ärztemangel, Abwanderung von Fachkräften, Korruptionsskandale |
| Wählergruppen | 8 | Rentner, Beschäftigte, Unternehmer, Landwirte, Junge, Staatsbedienstete, Religiös-Konservative, Säkulare Städter |
| **Knoten gesamt** | **189** | in 12 Themenfeldern plus Wählergruppen; darunter die Modernisierungsleiter (Mechanisierung, Agrarforschung, Industrielle Modernisierung) nach Victoria 3/Anno |
| **Verbindungen** | **374** | jede mit Stärke, Verzögerung und einem Satz Begründung |

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
