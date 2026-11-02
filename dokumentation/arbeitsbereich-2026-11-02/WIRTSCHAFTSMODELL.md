# NWO — Wirtschaftsmodell und Zentralbank

Version 0.4, 28. September 2026. Ergänzung zu [Lernkonzept](LERNKONZEPT.md) und [Spieldesign](SPIELDESIGN.md).

**Status:** Entwurf. Alle Mechanismen sind aus anerkanntem Lehrbuchwissen abgeleitet; die Quellen in Abschnitt 8 sind Kandidaten und werden vor der Umsetzung einzeln geprüft. Zahlenwerte (Verzögerungen, Stärken) sind Platzhalter für die Kalibrierung, keine Messwerte.

## 1. Anspruch

Das Modell soll nicht die Zukunft eines echten Landes vorhersagen. Es soll die **wichtigsten, gut belegten Zusammenhänge** so abbilden, dass

- Entscheidungen plausible Folgen haben, mit realistischen Verzögerungen und Unsicherheit,
- der Spieler diese Folgen mithilfe der Mentorin verstehen kann,
- es echte Zielkonflikte gibt und keine Strategie immer gewinnt.

**Leitsatz:** Lieber zehn Zusammenhänge, die stimmen und die man versteht, als hundert, die niemand prüfen kann.

## 2. Zeitmodell

- **Die Realwirtschaft** (Produktion, Beschäftigung, Preise, Löhne) wird **monatlich** fortgeschrieben. Der Spieler erlebt Tage, die Wirtschaft reagiert träge, wie im echten Leben.
- **Finanzmärkte** (Wechselkurs, Anleihezinsen, Stimmung der Anleger) reagieren **täglich** auf Nachrichten und Entscheidungen. Eine Rede kann die Währung am selben Tag bewegen.
- **Statistiken** erscheinen mit Verzögerung: Die Inflation für März wird Mitte April gemeldet. Der Spieler steuert also immer mit Blick in den Rückspiegel, auch das ist echt.

## 3. Die Kerngrößen

| Größe | Einheit | Was sie bedeutet | Sieht der Spieler |
|---|---|---|---|
| Leitzins | % | Zins, zu dem sich Banken bei der Zentralbank Geld leihen | ja |
| Inflation | % zum Vorjahr | Wie schnell die Preise steigen | ja, verzögert |
| Inflationserwartung | % | Was Haushalte und Firmen künftig erwarten | als Umfrage, ungenau |
| Glaubwürdigkeit der Zentralbank | intern | Wie sehr man ihr zutraut, die Inflation zu senken | nur indirekt (über Erwartungen und Märkte) |
| Wachstum | % | Wie stark die Wirtschaftsleistung zunimmt | ja, verzögert |
| Auslastung | intern | Läuft die Wirtschaft über oder unter ihren Möglichkeiten? | als Einschätzung der Mentorin |
| Arbeitslosenquote | % | Anteil der Arbeitsuchenden | ja, verzögert |
| Löhne und Reallöhne | % | Lohnanstieg, und ob er die Preise übertrifft | ja |
| Wechselkurs | Estra je Euro | Außenwert der eigenen Währung | ja, täglich |
| Staatsdefizit und Schuldenstand | % der Wirtschaftsleistung | Neue Schulden pro Jahr und Gesamtschulden | ja |
| Zinslast des Staates | % der Ausgaben | Wie viel des Haushalts an Zinsen geht | ja |
| Risikoaufschlag | Prozentpunkte | Aufpreis, den Anleger für Staatsanleihen verlangen | ja, täglich |
| Wahrgenommene Teuerung | intern je Wählergruppe | Wie teuer sich der Alltag anfühlt (Lebensmittel, Energie, Miete) | über Umfragen und Stimmen |

## 4. Die Zusammenhänge

Jeder Zusammenhang hat: Wirkung, typische Verzögerung, Spielregel, Vereinfachung. Die Verzögerungen sind Größenordnungen aus der Lehrbuchliteratur und werden bei der Kalibrierung festgelegt.

**Z1 — Leitzins wirkt auf die Nachfrage.** Höhere Zinsen verteuern Kredite und belohnen Sparen; Investitionen, Bau und Konsum auf Pump gehen zurück. *Verzögerung:* mehrere Quartale bis über ein Jahr. *Vereinfachung:* Banken, Kreditvergabe und Vermögenspreise werden zusammengefasst.

**Z2 — Auslastung wirkt auf die Inflation.** Läuft die Wirtschaft über ihren Möglichkeiten, steigen Preise und Löhne schneller; bei Unterauslastung langsamer. Wie stark, hängt von den Erwartungen ab. *Verzögerung:* Quartale. *Vereinfachung:* eine Inflation statt vieler Preisindizes, aber mit getrennten Komponenten für Energie und Lebensmittel, weil Wähler diese besonders spüren.

**Z3 — Erwartungen und Glaubwürdigkeit.** Wenn Haushalte und Firmen der Zentralbank zutrauen, die Inflation zu senken, bleiben die Erwartungen verankert, und die Inflation lässt sich leichter senken. Verliert die Zentralbank Glaubwürdigkeit, steigen die Erwartungen, Löhne und Preise werden vorsorglich erhöht, und die Inflation verfestigt sich. *Das ist der zentrale Lernmechanismus der Zentralbankfrage.* Glaubwürdigkeit baut sich langsam auf und kann schnell verloren gehen.

**Z4 — Zinsen und Vertrauen wirken auf den Wechselkurs.** Sinken die Zinsen im Vergleich zum Ausland oder sinkt das Vertrauen (politischer Eingriff, Schuldenangst), fließt Kapital ab und die Währung verliert. *Verzögerung:* Tage. *Vereinfachung:* ein Leitwechselkurs gegenüber dem wichtigsten Handelsraum.

**Z5 — Der Wechselkurs wirkt auf die Preise.** Eine schwächere Währung verteuert Importe, vor allem Energie, und treibt die Inflation. Exporteure profitieren. *Verzögerung:* Wochen bis Monate. *Das verbindet Zentralbank, Außenwirtschaft und den Alltag der Wähler.*

**Z6 — Staatsausgaben und Steuern wirken auf die Nachfrage.** Mehr Ausgaben oder niedrigere Steuern erhöhen die Nachfrage. Die Wirkung ist größer bei Unterauslastung und kleiner, wenn die Zentralbank gegensteuert oder die Wirtschaft schon ausgelastet ist. *Vereinfachung:* ein Multiplikator, abhängig von Auslastung und Geldpolitik.

**Z7 — Defizite werden zu Schulden, Schulden zu Zinslast.** Wie tragfähig Schulden sind, hängt am Verhältnis von Zins und Wachstum: Wächst die Wirtschaft schneller, als die Zinsen steigen, schrumpft die Schuldenquote leichter. *Verzögerung:* Jahre, aber Anleger reagieren sofort auf Erwartungen.

**Z8 — Risikoaufschlag.** Hohe Schulden, hohe Inflation und politische Unsicherheit lassen Anleger mehr Zinsen verlangen. Das verteuert neue Schulden und kann sich selbst verstärken. *Verzögerung:* Tage.

**Z9 — Wachstum wirkt auf die Beschäftigung.** Wächst die Wirtschaft kräftig, sinkt die Arbeitslosigkeit, bei Schwäche steigt sie. *Verzögerung:* Quartale. Löhne folgen der Lage am Arbeitsmarkt und den Inflationserwartungen; ob Reallöhne steigen, entscheidet über die Stimmung.

**Z10 — Wer gewinnt, wer verliert.** Jede Maßnahme trifft Gruppen unterschiedlich:

| Gruppe | Hohe Zinsen | Hohe Inflation | Schwache Währung |
|---|---|---|---|
| Sparer und Rentner | profitieren | verlieren | verlieren (Importe teurer) |
| Kreditnehmer, Häuslebauer | verlieren | profitieren teilweise (Schuld entwertet) | – |
| Beschäftigte mit festen Löhnen | Jobs gefährdet | verlieren Kaufkraft | verlieren Kaufkraft |
| Exportunternehmen | Finanzierung teurer | gemischt | profitieren |
| Importabhängige Betriebe | Finanzierung teurer | verlieren | verlieren |

Diese Gruppen sind zugleich Wählergruppen. So wird aus Wirtschaft Politik.

**Z11 — Gefühlte statt gemessener Lage.** Wähler beurteilen die Wirtschaft nach Preisen, die sie oft sehen (Lebensmittel, Benzin, Miete), nach der Sicherheit ihres Jobs und nach Nachrichten, nicht nach der amtlichen Statistik. Umfragen reagieren deshalb auf gefühlte Teuerung.

## 5. Die Zentralbank im Detail

### Figuren und Mandat

Die Zentralbank ist eine Institution mit eigener Führung, keine Schaltfläche. Die **Gouverneurin** ist eine Figur mit Überzeugungen, Ruf und Karriere. Ihr **Mandat** ist in der Startwelt Preisstabilität; eine Mandatsänderung ist eine Gesetzesfrage.

Die Gouverneurin entscheidet nach einer nachvollziehbaren Regel: Liegt die Inflation über dem Ziel oder läuft die Wirtschaft heiß, erhöht sie eher; im umgekehrten Fall senkt sie eher. Ihre Persönlichkeit verschiebt die Regel: eine vorsichtige Gouverneurin reagiert früher auf Inflation, eine konjunkturorientierte eher auf Arbeitslosigkeit. Sie begründet jede Entscheidung öffentlich, und der Spieler kann die Begründung lesen und sich von der Mentorin erklären lassen.

### Drei Stufen der Unabhängigkeit

Die Stufe ist Teil des Weltzustands (und später jedes Länderpakets). Der Spieler kann sie im Spiel verändern, zu einem Preis.

| Stufe | Rechtslage | Was der Spieler tun kann |
|---|---|---|
| **A — Unabhängig** | Gesetzlich geschützte Amtszeit, Absetzung nur bei schwerem Fehlverhalten, keine Weisungen | Öffentlich Druck machen, im Gespräch überzeugen, bei Amtsende eine Nachfolge vorschlagen, das Gesetz ändern (Parlament, eventuell Verfassung) |
| **B — Formell unabhängig** | Regierung ernennt und kann unter Bedingungen entlassen | Zusätzlich: Gouverneurin entlassen und eine gefügige Person einsetzen |
| **C — Weisungsgebunden** | Regierung bestimmt die Geldpolitik | Den Leitzins selbst festlegen |

### Wege statt Verbote: Was ein Eingriff kostet

| Weg | Sofortige Folgen | Spätere Folgen |
|---|---|---|
| Öffentliche Kritik an der Zentralbank | Währung und Anleihen reagieren leicht, Glaubwürdigkeit sinkt etwas | Wiederholte Kritik verstärkt die Wirkung |
| Vertrauliches Gespräch mit der Gouverneurin | keine, wenn es vertraulich bleibt | Wird es bekannt, wirkt es wie öffentlicher Druck, dazu eine Spur |
| Gouverneurin entlassen (Stufe B) | Währung fällt, Risikoaufschlag steigt, internationale Kritik | Glaubwürdigkeit stark beschädigt, Erwartungen lösen sich, Inflation verfestigt sich |
| Gesetz ändern (Stufe A zu B oder C) | Parlamentsstreit, Koalitionsfrage, Märkte reagieren schon auf die Ankündigung | wie oben, dauerhaft |
| Zinsen selbst senken (Stufe C) | Kredite billiger, Stimmung besser, Währung fällt | Aufschwung nach Quartalen, Inflation danach, oft stärker als der Aufschwung |

**Der Kern des Dilemmas:** Die angenehmen Folgen einer Zinssenkung (billige Kredite, Aufschwung, Jobs) kommen oft rechtzeitig vor einer Wahl. Die unangenehmen (Inflation, Währungsverfall, teurere Importe) kommen häufig danach, bei einem Vertrauensverlust aber auch schon davor. Der Spieler wettet also auf die Zeit und auf das Vertrauen der Märkte. Er kann gewinnen, und genau deshalb ist die Versuchung echt.

### Lernmomente

- **Beim ersten Streit mit der Gouverneurin** erklärt die Mentorin, warum Zentralbanken oft unabhängig gestellt werden: Politiker haben vor Wahlen einen Anreiz zu billigem Geld, und wenn alle das wissen, rechnen sie mit Inflation. Unabhängigkeit ist ein Versprechen, dieser Versuchung nicht nachzugeben.
- **Nach einem Eingriff** zeigt sie, wie Erwartungen, Währung und Preise reagiert haben, und in welcher Reihenfolge.
- **In der Nachbesprechung** vergleicht sie den tatsächlichen Verlauf mit einem Verlauf ohne Eingriff, ausdrücklich als Modellrechnung und nicht als Gewissheit.

### Die Türkei als erstes Land

Das erste Land ist die Türkei ([Länderpaket Türkei](LAENDERPAKET_TUERKEI.md)). Die Startwerte aller Kerngrößen kommen dort aus TÜİK, der Zentralbank TCMB und dem Finanzministerium. Die Unabhängigkeitsstufe der Zentralbank wird aus dem geltenden Zentralbankgesetz und den Ernennungsregeln abgeleitet (voraussichtlich Stufe B, zu belegen). Die Entwicklungen ab 2019 dienen als Prüfstein: Das Modell muss die Richtung und Reihenfolge der damaligen Folgen plausibel wiedergeben können, ohne sie exakt nachzurechnen.

### Wo Fachleute streiten

Die Mentorin stellt diese Punkte als offene Fragen dar:

- **Die Mehrheitsmeinung:** Unabhängige Zentralbanken gehen im Durchschnitt mit niedrigerer Inflation einher. Wie stark und in welchen Ländern, ist Gegenstand der Forschung.
- **Kritik an der Unabhängigkeit:** Sie entzieht wichtige Entscheidungen der demokratischen Wahl, und Zinsentscheidungen haben starke Verteilungswirkungen.
- **Abweichende Thesen:** Die Behauptung, hohe Zinsen würden die Inflation antreiben statt bremsen, wird von einzelnen Politikern und Ökonomen vertreten. Eine Figur im Spiel darf sie vertreten; die Mentorin erklärt, warum die große Mehrheit der Forschung zu einem anderen Schluss kommt, ohne die Figur lächerlich zu machen.

## 6. Was der Spieler sieht

- **Wirtschaftsakte auf dem Schreibtisch:** wenige Kennzahlen mit Verlauf. Jede Zahl ist anklickbar („Was heißt das?“, „Warum hat sie sich verändert?“, „Wann wurde sie gemessen?“).
- **Stimmen der Wirtschaft:** Unternehmer, Gewerkschaft und Verbraucher als kurze Zitate, damit Zahlen Gesichter bekommen.
- **Prognosen mit Bandbreite:** Die Zentralbank und das Finanzministerium veröffentlichen Prognosen. Sie sind unsicher und können sich widersprechen.
- **Vorhersage-Moment:** Vor großen Entscheidungen kann der Spieler selbst tippen. Das Spiel vergleicht später.
- **Das Notizbuch:** Jeder neue Begriff wird mit dem Moment gespeichert, in dem er zum ersten Mal wichtig war.

## 7. Prüfung des Modells

- **Stilisierte Fakten:** Das Modell muss bekannte Muster reproduzieren, bevor es als plausibel gilt. Eine Zinserhöhung dämpft die Inflation mit Verzögerung. Eine Abwertung hebt die Importpreise. Ein Vertrauensverlust erhöht den Risikoaufschlag. Wahlgeschenke bei Vollauslastung wirken vor allem auf die Preise.
- **Sensitivität:** Jeder Parameter wird in einer plausiblen Bandbreite variiert; kein Extremwert darf absurde Kettenreaktionen auslösen.
- **Keine sichere Strategie:** Automatisierte Testläufe mit vielen Strategien prüfen, dass keine Strategie immer gewinnt.
- **Fachliche Prüfung:** Ein Volkswirt prüft Modell und Erklärungstexte vor jedem öffentlichen Test.

## 8. Quellenkandidaten (vor Übernahme einzeln prüfen)

- Europäische Zentralbank: Darstellung des geldpolitischen Transmissionsmechanismus (ecb.europa.eu).
- Deutsche Bundesbank: „Geld und Geldpolitik“, Lehrbuch für Schule und Selbststudium (bundesbank.de). Besonders geeignet als Maßstab für verständliche Erklärungen.
- Olivier Blanchard: *Macroeconomics* (Lehrbuch), für IS-, Phillips- und Zinsparitätszusammenhänge.
- Kydland und Prescott (1977) sowie Barro und Gordon (1983): Zeitinkonsistenz und Glaubwürdigkeit der Geldpolitik.
- Alesina und Summers (1993): Zentralbankunabhängigkeit und gesamtwirtschaftliche Entwicklung.
- Cukierman, Webb und Neyapti (1992): Messung der Zentralbankunabhängigkeit.
- Taylor (1993): Regelgebundene Zinspolitik, als Grundlage der Reaktionsregel der Gouverneurin.
- Nordhaus (1975): Politischer Konjunkturzyklus.
- Okun (1962): Zusammenhang von Wachstum und Arbeitslosigkeit.
- Internationaler Währungsfonds: Länderberichte (Artikel-IV-Konsultationen) und World Economic Outlook, für echte Fallbeispiele und Länderpakete.
- Für spätere echte Länderpakete: die jeweilige Zentralbank und das nationale Statistikamt als Primärquellen.
