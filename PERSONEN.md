# Personen und Zusagen (Block S, 30.09.2026)

Anlass: Der Nutzer fand „Personen und Zusagen“ sinnlos: nur „Gespräch führen“ und „Entlassen“, ohne Folgen. Grundsatz seither: **Jede Ansicht führt zu einer Entscheidung, jede Entscheidung hat sichtbare Folgen, die später wiederkehren.**

## Wer im Umfeld ist

Zehn Menschen (fiktiv): Regierung (Präsidialamt, Finanzen, Wirtschaft, Inneres, Äußeres, Justiz, Generalstab), Zentralbank, Bündnispartner, Opposition. Justiz, Generalstab und Wirtschaft sind neu; ältere Spielstände ergänzen sie beim Laden (`ergaenzeFiguren`, eigener Zufallsstrom, damit alte Partien gleich bleiben).

Jede Figur hat ein **Profil** (`FigurEigen`, wird beim ersten Zugriff aus Spielstand und Namen abgeleitet): Stil (nüchtern, eitel, streng, loyal, vorsichtig, machtbewusst), Fähigkeit, Ehrgeiz, **Groll** (aufgestauter Ärger), Lager (Vertraute, Partei, Sicherheitsapparat, Märkte, Diplomatie, Justiz, Streitkräfte), Erinnerung, Auftrag. Was eine Person umtreibt (`sorgeText`) und weiß, wird aus dem Weltzustand gerechnet, nicht erzählt.

## Ressort: Die Person wirkt

Jedes Regierungsressort bewegt jeden Monat seine Größen: bei Leistung über 0,5 zum Guten, darunter zum Schlechten. Leistung = 60 % Fähigkeit + 40 % Loyalität, mal 1,25 mit Zusatzmitteln, 1,15 unter Druck, 0,75 in der Einarbeitung, 0,8 bei kommissarischer Leitung. Die Oberfläche zeigt die Verschiebung „auf Dauer“ in Punkten.

## Gespräche (`sim/gespraeche.ts`)

Ein Gespräch ist eine Szene: **Thema** (Sorge, die zwei schwächsten Größen des Ressorts, offene Ereignisse, Zusagen, die Person selbst) und **Ansatz**. Vorschau und Ausführung rechnen dieselben Zahlen (`planeGespraech`).

| Ansatz | Kosten | Wirkung |
|---|---|---|
| Vertrauen aufbauen | 1 | Loyalität +7 (Stil), Groll −8 (bei Groll ≥ 40 halb, Groll −18) |
| Um Rat bitten | 0 | Konkrete Schritte aus dem Politiknetz (Kosten, Mehrheitsaussicht); ab Loyalität 60 vertrauliche Zahlen; bei Loyalität < 30 verweigert |
| Auftrag mit Frist | 2 | Messbares Ziel (3 Punkte in 6 Monaten); die Person arbeitet monatlich mit; am Stichtag erfüllt (Loyalität +8) oder verfehlt (−5, Groll +8) |
| Kritik üben | 0 | Loyalität −5, Groll +12, 60 Tage unter Druck (Leistung +15 %); Risiko einer Durchstecherei |
| Anerkennung und Mittel | 2 | Loyalität +10, Zusatzmittel 6 Monate, Neid bei den anderen (Groll +3), Finanzminister ärgert sich |
| Rückendeckung | 1 | Loyalität +9, Groll −15, Vertrauen in die Regierung −0,1 |
| Machtfrage | 0 | Ultimatum: fügt sie sich (Loyalität +6) oder tritt zurück (kommissarische Leitung, Ehemalige) |

Zeit ist knapp: höchstens **4 Gespräche in 30 Tagen**, je Person alle **21 Tage** einmal.

## Wechsel im Amt (`sim/nachfolge.ts`)

Entlassen ist ein Prozess: Folgen sehen, drei Kandidaten mit Profil vergleichen (fachlich stark / vertraut / ehrgeizig; Stärke, Schwäche, Märkte), ernennen oder nur kommissarisch besetzen. Folgen: Ehemaliger mit Groll (kann später aussagen: Vertrauen −1, Legitimität −0,8), Lager der Person −4 Loyalität, Vertrauen −0,4, Märkte (Finanzen: Risikoaufschlag +30, plus Marktreaktion des Kandidaten), zwei Monate Einarbeitung. Die Zentralbankführung tauscht man weiter unter Zentralbank und Haushalt.

## Ereignisse (`sim/ereignisse-personen.ts`)

Rücktrittsdrohung (Loyalität < 25, Groll ≥ 30), Skandal, Intrige (Ehrgeiz ≥ 75, Loyalität < 55), Durchstecherei (Groll ≥ 60). Wer sein Umfeld pflegt, sieht sie selten. Jede Vorlage hat eine kostenlose Antwort. Rücktritt bei Loyalität < 12 gilt jetzt für alle Regierungsmitglieder (40 % je Monat).

## Zusagen (`sim/zusagen.ts`)

Übersicht: Bezug (Person, Fraktion, Land), Frist mit Dringlichkeit, **Fortschritt** der verlangten Maßnahme (Start- und Zielstufe festgehalten), Folgen von Halten und Brechen, Vertrösten mit Preis (1 Kapital, höchstens zweimal, Geduld −8). Halten und Brechen wirken über die Akteure hinaus als **Glaubwürdigkeit** (Legitimität, Vertrauen; bei Ländern das Vertrauen des Landes). Unter 40 sinkt die Legitimität monatlich, ab 80 steigt sie langsam. Zusagen, die andere Teile des Spiels erfüllen (Gesetz beschlossen), werden monatlich nachgebucht.

## Schnittstellen für die KI und andere Ansichten

- `personKontext(w, id)`, `umfeldKontext(w)`: Textblock für das Sprachmodell.
- `themenFuer`, `ansaetzeFuer`, `fuehreGespraech`, `wendeGespraechsergebnisAn`: Auswahl aus dem festen Katalog; das Sprachmodell erzählt, der Kern rechnet.
- `personenHinweise(w)`: Alarme für Schreibtisch und Leiste (Rücktrittsgefahr, auslaufende Aufträge, fällige Zusagen).
- `ratZuEreignis(w, ereignisId)`: Einschätzung der betroffenen Ressorts in einem Ereignisfenster.

## Neue Zustandsfelder (alle optional, ältere Spielstände laufen weiter)

`Figur.eigen`, `SpielZustand.termine`, `SpielZustand.ehemalige`, `Zusage.stufeStart/stufeZiel/abgeschlossen`.

Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung).
