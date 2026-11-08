# Nachtarbeit 29./30.09.2026: Was macht Democracy 4, HOI4 und Civilization aus, und was fehlt Staatsräson?

Auftrag des Projektinhabers: die ganze Nacht durcharbeiten; Logik und Spielfluss prüfen, sich in Spieler hineinversetzen, massiv verbessern, vor allem Design und die übrigen Länder.

## 1. Was Spaß macht (und warum)

**Democracy 4** – Das Netz aus Ursache und Wirkung ist sichtbar und *verstehbar*; Wählergruppen haben Laune, Forderungen und Gründe („Wer hasst mich und warum?“); jeder Eingriff hat Gewinner und Verlierer; Dilemmata statt Multiple Choice; man „knackt“ das System und wird vom System überrascht.
**HOI4** – Ein *Plan mit Zeitachse* (Fokusbaum: Schritte, Dauer, Freischaltungen); die Karte ist die Bühne (Fronten, Projekte, Krisenherde); Entscheidungen mit langem Schatten; ein Land mit Charakter und „Was wäre wenn“; Benachrichtigungen mit Ort.
**Civilization** – „Noch eine Runde“: Ziele auf drei Zeitskalen (jetzt, bald, Vermächtnis); ständige Freischaltungen; andere Führer mit Persönlichkeit und Anliegen, Diplomatie mit *Gründen*; jederzeit ein klarer nächster Schritt; sichtbares Wachstum.

## 2. Was Staatsräson fehlt (ehrliche Bestandsaufnahme)

| Lücke | Wirkung auf den Spaß | Maßnahme |
|---|---|---|
| Kein langfristiger Plan; alle 90 Maßnahmen von Anfang an, ohne Ziel dazwischen | kein „noch ein Monat“, keine Freischaltungen | **Regierungsprogramme** (Fokusbaum): Ketten von Schritten mit Dauer, Bedingung, Erfolg, Freischaltung |
| Wählergruppen unsichtbar | fehlt der Kern von Democracy 4 | **Wählerkoalition**: Gruppen mit Laune, Trend, Gründen, Forderungen, Wahlprognose |
| Keine Rückmeldung, ob ein Gesetz gewirkt hat | kein Lernen, kein Stolz | **Wirkungsberichte** nach 6/12 Monaten |
| Übrige Länder sind nur sieben Zahlen | Diplomatie ohne Gegenüber | **Länder als Akteure**: Steckbrief, Anliegen, Haltung, Handlungen, Karte |
| Ereignisse nur als Fenster | Karte ist nicht die Bühne | **Ereignis- und Krisenmarken auf der Karte** |
| Zusagen wiederholen sich, Kapital knapp, viele leere Entscheidungen | Frust | Zusage-Dauerfeuer beheben, Preise sichtbar, Kapital erklärt |
| Kein Einstieg | Spieler weiß nicht, was er tun soll | „Nächster Schritt“ und Aufgaben |
| Design uneinheitlich, Überschneidungen | wirkt unfertig | Designdurchgang, Überschneidungsprüfung automatisiert |

## 3. Nachtplan (in dieser Reihenfolge; Stand am Ende jedes Blocks hier eintragen)

1. [x] Zusage-Dauerfeuer beheben (Vertrösten begrenzen auf zweimal, drei Monate).
2. [x] Wählerkoalition (Fenster „Wähler“: Wahlbarometer, Zustimmungsrechnung, acht Gruppen mit Laune, Trend, Gründen, Forderungen).
3. [x] Regierungsprogramme (8 Programme, 36 Schritte mit Bedingung, Dauer, Belohnung, Rabatt, Schutz; Reiter „Programme“, „Nächster Schritt“ auf dem Schreibtisch, Hinweis-Kapsel).
4. [x] Wirkungsberichte (nach 6 und 12 Monaten, im Reiter „Umsetzung“ und in der Chronik).
5. [x] Länder als Akteure (12 Länder: Steckbrief, vier Beziehungsdimensionen, Anliegen, sechs Handlungen mit Folgen; Fenster „Die Welt“; Kartenebene „Beziehungen“ mit Klick auf ein Nachbarland; Weltbank-Vergleich je Land).
6. [x] Ereignismarken auf der Karte (rot: offenes Ereignis, orange: Frist in höchstens fünf Tagen; Klick öffnet es). Kartenebene „Beziehungen“ färbt Nachbarländer nach Verhältnis.
7. [x] Einstieg: „Nächster Schritt“ auf dem Schreibtisch, Hinweis-Kapsel, Text der Amtsübergabe aus dem echten Zustand, Chat kennt Länder, Wähler und Programme; jedes Ereignis hat immer eine kostenlose Antwort („Abwarten“).
8. [~] Designdurchgang und echte Spielsitzungen: laufend. Erledigt: Kopfleiste, Menü mit Beschriftung, Reiter, Auswahlkarten, Marken, Überschneidungsprüfung (0 Treffer bei 1000×570, 1280×720, 1512×982), geschlechtsrichtige Namen und Porträts, Parlament-Grafik mit dem echten Lager. Offen: Gesamtdurchlauf bis zur Wahl lesen, Ton, gemalte Porträts.
9. [x] „Man kann nichts tun, und alles wird mit Geld gemessen“ (Rückmeldung 30.09., Seite „Inflation“): Handlungsfeld für Größen, Probleme und Gruppen (Hebel mit „wirkt stark/spürbar/schwach“, „Einstellen“-Knopf, direkte Eingriffe bei Wirtschaftsgrößen); Vorschau „Was folgt daraus?“ mit Folgen, Profitierenden, Verlierenden, Kabinettsreaktion, Dauer und Haushalt zuletzt; Kapital mit Siegel statt Münze; 231 neue Verbindungen im Politiknetz (jede Maßnahme mindestens drei Folgen); Balance nachgezogen (Müdigkeit 0,28, „Hart“ Faktor 1,25; Entspannt/Normal/Hart 8/7/2 von 8).
10. [x] Wiederholungen im langen Lauf (79 Monate, 0 Klick- und Konsolenfehler): Vergabeaffäre 5-mal und „Damaskus verliert die Geduld“ 4-mal → vier Affären-Varianten (am längsten nicht erzählte zuerst), Sperrzeit 420 Tage, Länder-Forderung je Land neun Monate gesperrt.

Regeln: Deutsch mit echten Umlauten, keine Emojis, keine erfundenen Zahlen (Quelle oder Lücke), Härte des echten Lebens, Tests grün, nichts committen.


## 4. Befunde aus Spielsitzungen wie ein echter Nutzer (`scratchpad/spieler.mjs`, 39 Spielmonate ohne Konsolenfehler)

- Gipfeltreffen waren eine Dauerschleife (Vertrauen 40 auf 100 in zwei Jahren) → abnehmender Ertrag, Abkühlzeit 120 Tage, Sperre ab Vertrauen 82.
- Der Problemlöser schlug dieselbe Maßnahme auf 55, 75 und 95 vor → Vielfalt (Abschlag für kürzlich Beschlossenes), Obergrenze 80, Grenzen auch für benannte Zustände (Mietstopp).
- Riesenfraktion im Lager (556 von 600) machte die Abstimmungen bedeutungslos → Partnerwahl meidet Riesen, wenn es ohne geht; sonst brüchige Loyalität.
- Zusagen wiederholten sich, Kapital war nach neun Monaten leer → Vertrösten höchstens zweimal, Kapital im Tooltip erklärt.
- Maßnahmenseiten zeigten fast nur den Haushalt als Folge (53 von 90 Maßnahmen hatten höchstens zwei ausgehende Verbindungen; Medienaufsicht nur „Pressefreiheit sinkt“) → politische Folgen ergänzt, Geld steht zuletzt.

## 5. Was ehrlich noch fehlt (Stand Ende der Nachtarbeit)

| Lücke | Warum sie zählt | Aufwand |
|---|---|---|
| **Sprachmodell** für Gespräch und Mentorin | Ohne es kennt das Gespräch nur, was vorhergesehen wurde; mit ihm „versteht das Spiel, wie es helfen soll“ (Frage des Projektinhabers) | mittel; braucht Schlüssel und Kostenfreigabe |
| **Krieg, Militär, Verträge mit Klauseln, Vermittlung** (AUSSENPOLITIK 4 bis 6) | HOI4-Tiefe; die Länder handeln bisher über Anliegen, Angebote und Streit, nicht über Truppen | groß |
| **Freie Großprojekte** (ENTSCHEIDUNGEN I) | „Man soll alles machen können“ | groß |
| **Weitere Länder spielbar** (Länderpaket) | falls „übrige Länder“ das meint: Deutschland, USA u. a. als Spielländer | sehr groß |
| **Szenarien und Schwierigkeitsgrade** | Civilization: „noch eine Runde“ und Wiederspielwert | mittel |
| **Ton und Musik**, gemalte Porträts | Stimmung; Zeichnung ist bisher Scherenschnitt | mittel |
| **Kalibrierung an echten Spielern** | Die Zahlen (Kapital, Stimmen, Wirkungen) sind Platzhalter; die Bots zeigen nur die Richtung | fortlaufend |

**Frage an den Projektinhaber:** Mit „die übrigen Länder“ waren die *anderen Staaten der Welt als Gegenüber* gemeint (so umgesetzt) oder *weitere spielbare Länder*?
