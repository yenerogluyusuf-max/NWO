# Die Wirtschaftsakte (Block R)

Stand: 30. September 2026. Anlass: Der Projektinhaber kritisiert, dass die Wirtschaftsansicht nur Zahlen ohne Verlauf zeigte und dass Zentralbank und Haushalt „draufdrücken“ ohne Folgen waren. Grundsatz: **Jede Ansicht führt zu einer Entscheidung, jede Entscheidung zeigt vorher und nachher ihre Folgen und wirkt auf alles, was danach kommt.**

Alle Zahlen dieser Schicht sind Spielparameter (Platzhalter der Kalibrierung). Tatsachen stehen mit Quelle in `game/src/data/haushaltsplan.ts`.

## Aufbau

| Ansicht | Inhalt |
|---|---|
| **Lage** | 19 Kennzahlen in vier Gruppen, jede anklickbar: Verlauf seit Spielbeginn, Prognoseband für zwölf Monate, Marken (Zinsentscheid, Haushalt, Eingriff, Ereignis), Schwellenlinien, „Was bewegt diese Zahl?“ (Treiber aus den Formeln des Modells und den Verbindungen des Netzes), Vergleich mit anderen Ländern, „Was Sie tun können“ (führt in Zentralbank oder Haushalt; bei Haushaltsposten mit „Was wäre, wenn?“ im Diagramm) |
| **Zentralbank** | Die Bank (Gouverneurin, Haltung, Stufe der Unabhängigkeit, Glaubwürdigkeit), die nächste Zinssitzung mit Wahl der Wege, die Führung, das Zentralbankgesetz, die bisherigen Sitzungen mit Begründung und Folgen |
| **Haushalt** | Kennziffern, der Haushaltsplan 2026 mit belegten Zahlen, neun Regler des Nachtragshaushalts mit Vorschau, das Haushaltsjahr im Oktober, bisherige Änderungen |

Code: `game/src/ui/wirtschaft/` (Akte, Lage, Zentralbank, Haushalt, Diagramm, Folgen, Wirkung, Bestaetigung, prognose.ts, wirtschaft.css), Simulation: `game/src/sim/{wirtschaft,wirtschaft-typen,wirtschaft-kennzahlen,wirtschaft-tick,zentralbank,haushalt,folgen}.ts`.

## Zentralbank (WIRTSCHAFTSMODELL.md, Abschnitt 5)

Der Präsident setzt den Leitzins nicht selbst, solange die Bank unabhängig ist. Die Bank folgt ihrer Regel (`ppkDecision`: die halbe Strecke zum Zielzins, höchstens fünf Punkte). Der Präsident hat Wege, jeder mit Preis:

- **Vertrauliches Gespräch** (1 Kapital, alle 30 Tage): Druck 0,6.
- **Öffentliche Rede**: Druck 1,2; kostet Glaubwürdigkeit, Lira, Risikoaufschlag; **wiederholte Kritik wirkt bis zu 1,5fach, 2fach …** (Kritik der letzten zwölf Monate zählt).
- **Rückendeckung für die strenge Linie** (Gespräch oder Rede): Märkte atmen auf, Unternehmer und Junge murren.
- Der Druck verschiebt den Beschluss um `Richtung × Stärke × Empfänglichkeit × 3` Prozentpunkte (Empfänglichkeit: streng 0,3, ausgewogen 0,6, gefügig 1; bei Stufe A halbiert). Er darf über die Höchstschrittweite hinausgehen. Der Beschluss weicht von der Regel ab: Glaubwürdigkeit −0,02 je Punkt, Risikoaufschlag +6 je Punkt, Lira +0,4 % je Punkt, Vertrauen der Märkte, Loyalität der Gouverneurin.
- **Führung neu besetzen** (streng, ausgewogen, gefügig; alle 120 Tage): gefügig kostet Glaubwürdigkeit und Lira, streng gibt einen Teil des Vertrauens zurück.
- **Zentralbankgesetz** (Stufen A unabhängig, B formell unabhängig, C weisungsgebunden; braucht die Mehrheit im Lager, Kapital 2 bis 8, alle 180 Tage): B nach C setzt Glaubwürdigkeit −0,18, Risikoaufschlag +70, Lira +4 %; in C legt der Präsident den Zins selbst fest (Regler), jede Abweichung von der Regel sehen die Märkte. Stufe A schützt die Führung auf **allen** Wegen (auch Chat und Befehl).
- Jede Zinssitzung wird mit Begründung, Abweichung von der Regel und der **Folgekette** (`folgen.ts`) festgehalten und erscheint als Marke in den Diagrammen.

## Haushalt

Neun Regler mit fünf Stufen (−2 bis +2): Renten und Soziales, Gehälter, Investitionen, Gesundheit und Bildung, Sicherheit, Subventionen (Ausgaben; eine Stufe = 0,4 % des BIP) sowie Einkommensteuer, Verbrauchsteuern, Körperschaftsteuer (Einnahmen; eine Stufe = 0,3 % des BIP). Jede Änderung:

- kostet Kapital (eine Stufe 1, in die unbeliebte Richtung 2),
- ändert den Ausgabenimpuls (Nachfrage, Defizit, Schulden über das Wirtschaftsmodell),
- bewegt einmalig die betroffenen Wählergruppen,
- verschiebt **dauerhaft** Größen des Politiknetzes (Gleichgewichtsverschiebung wie bei den Vorhaben des Reiches),
- zeigt vorher Gewinner, Verlierer, Kehrseite, Folgekette und die Prognose für Defizit, Schulden, Wachstum, Inflation, Arbeitslosigkeit und Risikoaufschlag.

Das Haushaltsjahr (Ereignis im Oktober) setzt Pakete aus mehreren Reglern (`konsolidieren`, `investieren`).

**Zinsdienst:** Der Durchschnittszins auf die Staatsschuld (Start: 3,5 % des BIP Zinsen geteilt durch 23,8 % Schuldenquote = 14,7 %) folgt dem Marktzins (Leitzins plus Risikoaufschlag) nur zu einem Viertel und nur langsam (6 % je Monat). Der Mehr- oder Minderzins geht in Defizit, Schulden und den Eingang `defizit` des Netzes ein: Ein Zinsentscheid kommt beim Staat erst über Jahre an.

## Quellen des Haushaltsplans 2026

Ausgaben nach Arten (Forbes Türkiye), Steuern nach Arten und SGK-Übertragungen (Tez-Koop-İş), Steuereinnahmen, Zinsen und Defizit (Daily Sabah); Summe 18,9 Billionen Lira; Zinsausgaben rund 3,5 % des BIP, Defizit rund 3,5 % des BIP. Die Quellen weichen bei einzelnen Summen leicht ab (etwa Personalausgaben 4,9 oder 5,5 Billionen); genommen sind die Zahlen, die sich zur Gesamtsumme addieren. Wie viel des BIP eine Milliarde Lira ist (1 % des BIP ≈ 783 Mrd. Lira), ist aus den Zinsausgaben **abgeleitet** und nur eine Größenordnung.

## Verlauf und Migration

`world.history` (Monatswerte des Wirtschaftsmodells) reicht für Inflation, Wachstum, Arbeitslosigkeit, Kurse, Zins, Risikoaufschlag und Schulden. Weitere Kennzahlen (Defizit, Zinsausgaben, Erwartung, Realzins, Netzknoten) zeichnet `spiel.wirtschaft.reihen` monatlich auf (höchstens 120 Monate, zwölf Monate Ruhelage als Vorgeschichte). `spiel.wirtschaft` ist optional und wird beim ersten Zugriff angelegt: Ältere Spielstände laufen weiter (Test `wirtschaft.test.ts`).

## Vorschau

`prognoseReihen` (forecast.ts) rechnet mehrere Zufallsläufe Monat für Monat, einmal ohne und einmal mit einer Handlung (`Aktion`: `zinsdruck`, `zinsvorgabe`, `stufe`, `gouverneur`, `posten`, `paket`). Die Oberfläche rechnet im Web Worker (`wirtschaft.worker.ts`), der neueste Auftrag zählt, das Band wird über drei Monate geglättet.

## Offen

- Der Hinweis „Zinssitzung in N Tagen“ im Meldungsstreifen der Bühne ist noch nicht anklickbar (soll die Zentralbank öffnen).
- Die Schreibbefehle des Gesprächs und die KI-Aktionen `haushalt` setzen noch den Gesamtimpuls (`setFiscalImpulse`) statt der Regler.
- Weitere Außenwirtschaftsansichten (Handel, Zahlungsbilanz, Reserven) fehlen mangels Modellgrößen.
