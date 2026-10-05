# GLM-Recherche 9: Menschen statt Indizes (05.10.2026)

Auftrag: GLM_AUFTRAG_RECHERCHE.md, Thema 9. Besonderheit: Der Datenbestand zu diesem Thema existiert bereits — `game/src/data/haushalte.ts` (sieben Haushalte mit Ausgabenkorb und Textbausteinen, in dieser Sitzung angelegt) plus die belegten TÜİK-Anker. Diese Datei schließt die Lücken, die der Datenbestand offen lässt, und schlägt die Einbindung vor. Primärquelle: TÜİK (Hanehalkı Bütçe Araştırması / Konsumausgaben). Stand: 05.10.2026.

## 1. Kurzfassung

Sieben wiederkehrende Haushalte übersetzen die Kennzahlen der Simulation in erfahrbare Sätze: die Konyaer Rentnerin, die Istanbul Doppelverdienerfamilie, der Denizler Exportbetrieb, die Hatayer Wiederaufbaufamilie, die Karapınarer Bäuerin, die Ankaraer Studentin, die Trabzoner Fischerfamilie. Belegt sind die großen Anker (Konsumausgaben je Haushalt 64.104 Lira 2025 nach TÜİK, Mindestlohn 28.075,50 Lira netto, Inflation 31,51 % August 2026); die Einkommen der Einzelhaushalte sind Spielparameter, weil TÜİK keine nach Familienform aufgelösten Einkommensreihen als offene Tabelle liefert. Für das Spiel reicht das: Die Haushalte sind Erzählgeräte, keine Stichprobe. Der Spieltest entscheidet, ob sie zurückkommen.

## 2. Befund: was belegt ist

| Größe | Wert | Quelle |
|---|---|---|
| Konsumausgaben je Haushalt 2025 | 64.104 Lira/Monat (2024: 45.344) | TÜİK „Hanehalkı Tüketim Harcaması 2025", veröffentlicht 2.6.2026; Auswertung Dünya 3.6.2026 |
| Mindestlohn netto | 28.075,50 Lira/Monat (seit 1.1.2026) | Arbeitsministerium, Amtsblatt; tuerkei/STARTDATEN.md |
| Inflation August 2026 | 31,51 % Vorjahr; Lebensmittel 33,79 %; Wohnen/Energie 39,77 % | TÜİK, 3.9.2026; STARTDATEN.md |
| Einpersonenhaushalte 2025: Wohnung+Miete+Nahrung-Anteil | 41 % der Ausgaben | TÜİK 2025 (Presseauswertung, grobe Lesart — **Primärcheck offen**) |
| Einkommen je Haushaltstyp (Rentnerin, Familie, Studentin …) | **nicht gefunden als offizielle Tabelle** — TÜİK Einkommens- und Lebensbedingungen-Umfrage liefert Quintil-Reihen, keine Typenauflösung | — |

**Widerspruch, offen gelegt:** Die Haushaltseinkommen in `data/haushalte.ts` (14.000–62.000 Lira) sind Spielparameter und plausibel gegen die TÜİK-Durchschnitte kalibriert (Konsum 64.104 ≠ Einkommen; Median unter Durchschnitt). Sie dürfen nicht als Tatsachen erscheinen; die Textbausteine nennen sie bewusst nicht als Zahl, sondern als Verhältnis („weniger leisten als bei Amtsantritt").

## 3. Zusammenhänge

| Kante | Richtung | Verzug | Beleg |
|---|---|---|---|
| Inflation → Haushaltskaufkraft | − | sofort | TÜİK-Reihe; Spielkante realeinkommen vorhanden |
| Mindestlohnrunde → untere Haushalte | + | sofort; Kostenrückkopplung 3–9 Monate | Netz: m_mindestlohn → realeinkommen/kostendruck/schattenwirtschaft (politiknetz.ts:210-215) |
| Mietdeckel/Sozialwohnungen → Miet-Haushalte | + | 2–12 Monate | Gesetzesbaustein g_mietdeckel (data/gesetze/kern1.ts) |
| Energiepreise → alle Haushalte, Höchstgewicht bei kleinen Einkommen | − | sofort | TÜİK: Wohnen/Energie 39,77 % im Korb |
| Wechselkurs → Exportbetrieb, Fischer (Einkauf), Bauer (Dünger) | ± | sofort | Haushaltsprofil wechselkurs-Felder |
| Wiederaufbau-Zusagen → Hatay-Haushalt | + | fristgebunden | Zustandensystem (sim/zusagen.ts, Katastrophenkette) |

## 4. Anschluss im Code

- `data/haushalte.ts`: Typen, sieben Haushalte, `haushaltSaetze()`, `haushaltKurzzeile()` — fertig, keine Änderung nötig.
- `sim/waehler.ts`, `sim/gruppen.ts`: Die Haushalte sind die Personifikation der Gruppen; die Engine reicht dieselben Spielwerte an beide.
- `sim/berichte.ts` (Wirkungsberichte): Ein Haushaltsabsatz je Bericht („Was das bei der Fischerfamilie bedeutet") — Rein-Text, kein neuer Zustand.
- `ui/`: Wähler-Dossier oder Wirtschaftsakte bekommt einen Haushaltsreiter; Anzeige über `haushaltSaetze` mit den Spielwerten als `HaushaltZahlen`.

## 5. Integrationsvorschlag (einer, weil der Rest steht)

**Der Haushaltsbrief je Wirkungsbericht.** Jeder Wirkungsbericht (6/12/24 Monate, sim/berichte.ts) bekommt am Ende zwei bis drei Sätze aus `haushaltSaetze()` für zwei fest gewürfelte Haushalte (ein arbeitsnahes, ein renten-/landnahes). Keine neue Entscheidung, keine neue Anzeige — der Bericht, den es gibt, gewinnt ein Gesicht.

- **Entscheidung:** keine (Berichtsteil).
- **Folgen:** keine direkten; indirekt spiegelt er die Etats-/Preisentscheidungen des Spielers zurück.
- **Gegenspieler:** keiner (die Sätze sind Folgenspiegel).
- **Anzeige:** Im bestehenden Wirkungsbericht; Langform im Wähler-Dossier.
- **Daten:** Vorhanden (`haushalte.ts`); Engine-Aufruf mit `HaushaltZahlen` aus Netzgrößen.
- **Aufwand:** klein.
- **Spieltest:** Spaß, wenn Spieler den Bericht lesen statt wegklicken (gemessen: Öffnungsquote im Spieltest) und Sätze zitieren; Misserfolgssignal: Sätze klingen generisch — dann braucht der Korb je Haushalt einen Haussatz (Rentnerin: Heizung; Fischer: Diesel).

## 6. Verworfen

- **Vollständige Haushaltsstichprobe (Quintile, TÜİK-getreu):** Statistik statt Erzählung; sieben Typen decken die Konflikte ab.
- **Haushalte als Simulationsagenten mit eigenem Monatsbudget:** Victoria-3-Tiefe ohne Entscheidung für den Spieler; die Haushalte sind Spiegel, keine Akteure.
- **Eigene Haushaltsansicht ohne Berichtskontext:** Ein Reiter mehr ohne neuen Entscheid; die Sätze gehören dorthin, wo die Entscheidung geprüft wird.

## 7. Vorbilder

- **Civ 6:** City-Panel mit Zufriedenheits- und Ertragszeilen — die Idee „aus Aggregaten wird eine Stadtgeschichte" übernommen.
- **Suzerain:** Atmosphärische Alltagsszenen (Radio, Briefe) — der Haushaltsbrief ist die sachliche Version.
- **Democracy 4:** Milieus mit Begründungen — die Haushalte liefern denselben Text auf Personenebene.
- **Victoria 3:** Bevölkerungsschichten mit Bedarf — verworfen (siehe 6).

## 8. Unsicher oder unbelegt

1. Einkommen je Haushaltstyp: keine offizielle Tabelle gefunden; Spielparameter, im Quellenmenü so kennzeichnen.
2. Die 41-%-Lesart der Einpersonenhaushalte (Wohnen+Miete+Nahrung) aus Presseauswertung — gegen die TÜİK-Tabelle prüfen.
3. Ausgabenkorb-Anteile je Haushalt in `data/haushalte.ts`: als Spielparameter markiert, orientiert an TÜİK-Hauptgruppen; echte Gewichte (z. B. Rentnerin mit Heizöl-Anteil) sind nicht belegt.
4. Mietniveau je Bezirk (für die Istanbul-Familie): in dieser Recherche nicht erhoben (TÜİK Mietindex-Reihe beschaffen, wenn die Mietkante in den Vordergrund rückt).
