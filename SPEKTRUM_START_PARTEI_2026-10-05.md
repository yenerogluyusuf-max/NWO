# Spektrum, Startpartei und Linie als Preis (05.10.2026)

Stand der Umsetzung (Fork SPEKTRUM, Runde 2). Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

## Achsen
Fünf Achsen von −100 bis +100: Wirtschaft (Umverteilung … Markt), Gesellschaft (libertär … autoritär), Nation (supranational … national), Religion (säkular … religiös), Staatsaufbau (föderal … zentralistisch). Parteien (8), Wählergruppen (11), Maßnahmen (alle 117) und die eigene Partei liegen auf diesen Achsen (`data/linien.ts`). Nähe, Partner, Gegner und Stimmenquellen werden aus dem Abstand gerechnet (`sim/linie.ts`); nur die vier klassischen Muster (AP, PG, PW, PR) behalten ihre von Hand gesetzten Tabellen.

## Linie als Preis (`sim/linie.ts`, `sim/handeln.ts`)
- Kapitalkosten: mit der Linie bis 12 % billiger, gegen sie bis 45 % teurer.
- Stimmverhalten: Lagerfraktionen stimmen nach Übereinstimmung mit ihrer Linie; die eigene Partei hält mehr Disziplin; Oppositionsparteien stimmen mit, wenn das Gesetz zu ihnen passt.
- Partnerloyalität: Jede beschlossene Änderung hebt oder senkt die Loyalität der Partner nach ihrer Linie.
- Stammwählerschaft: Linientreue hebt die Zustimmung dauerhaft (Saldo ±10 Punkte), Bruch der Linie senkt sie. Der Zuschlag steigt mit der Unpopularität der Maßnahme (`preisFaktor`, Netzanalyse `zustimmungsEinfluss`), für jede Linie dieselbe Regel.
- Gruppennähe verschiebt dauerhaft `world.net.start`.
- Kurswechsel (`kurswechsel`): möglich, kostet Kapital (8 + 60 · Abstand), Glaubwürdigkeit und Partnerloyalität. Eine Oberfläche dafür fehlt noch.

## Prolog
Parteikonfigurator (15 Voreinstellungen von Rand zu Rand, fünf Regler mit Wortmarken, Wappen live, Vorschau mit Partnern, Gegnern, billigen und teuren Maßnahmen), vier Startszenarien (Neugründung, Regierungspartei, Übergangsregierung nach der Krise; Opposition gesperrt), Biografie mit Vorteil und Preis je Antwort (`sim/biografie.ts`), Wahlnacht ohne dominante Antwort. Das Lebenslauf-Buch (Szene je Station, Porträt, Band, Wappenkarten, Zettel mit Folgen) steht in `ui/Prologue.tsx` und `ui/prolog/`.

## Neutralität (`test/neutralitaet.test.ts`)
Schnell (Standard): passiver Bot, die Zustimmung nach 58 Monaten streut über die Linien höchstens 14 Punkte. Voll (`NEUTRALITAET=1`): linientreuer Bot, 20 Zufallswerte je Linie, Schwierigkeit „hart“; Korridor Siegquote Wahl 1 etwa 20 bis 90 %. Ergebnis und offene Punkte: siehe Bericht und `scratchpad/neutral_*.txt`.

Offene Ursache der beiden Ausreißer: Die Maßnahmen der Partei der Werte kosten viel Kapital (18 von 22 Versuchen des Bots scheitern am Kapital), die der Sozialistischen Linken sind im Politiknetz billig und beliebt. Das liegt in der Kostenstruktur des Netzes, nicht in der Linie als Preis.
