# Analyse: Was fehlt und was nicht sauber funktioniert — Stand 29.10.2026

Grundlage: Stand **W4** (Commit `09a14ff`, Zweig `claude/weiter-b91y4u`), geprüft am 29.10.2026. Sechs Teilanalysen, jede mit Browser-Spieltest und/oder Headless-Läufen über mehrere Spieljahre, dazu Code-Prüfung. Schwerpunkt nach Vorgabe des Projektinhabers: **Funktionen, Spielweise und sauberes Funktionieren**, keine externe Recherche.

Die Einzelberichte mit allen Belegen (Datei:Zeile, Messwerte, Prioritäten, Aufwand) liegen in [`analyse/2026-10-29/`](analyse/2026-10-29/):

| Nr. | Bericht | Thema |
|---|---|---|
| 1 | [01_ui_navigation.md](analyse/2026-10-29/01_ui_navigation.md) | Linke Leiste, alle Ansichten, erste zehn Minuten |
| 2 | [02_karte_visuell.md](analyse/2026-10-29/02_karte_visuell.md) | Karte und sichtbare Veränderung (Vergleich Civilization) |
| 3 | [03_wirtschaft_statistik.md](analyse/2026-10-29/03_wirtschaft_statistik.md) | Wirtschaftliche Entwicklung, Statistik, Ländervergleich |
| 4 | [04_welt_vertraege.md](analyse/2026-10-29/04_welt_vertraege.md) | Andere Länder als Akteure, Außenpolitik, Verträge, Krieg |
| 5 | [05_recht_innenpolitik.md](analyse/2026-10-29/05_recht_innenpolitik.md) | Gesetzesweg, Verfassung, Gericht, Parlament, Opposition |
| 6 | [06_spielfluss.md](analyse/2026-10-29/06_spielfluss.md) | Spielschleife, Entscheidungen, Spannung, strategische Ebene |

---

## 1. Gesamturteil

W4 hat viel gebracht: Aktengerüst, Gesetzesvorhaben mit Fassungen und Verfassungsgericht, Weltmodell mit 41 Staaten, Kriegsschauplätze, Neubau-Linien, Machtkreis, Fokus- und Wissensbaum. Das Gefühl „es fehlt etwas“ hat trotzdem klare Ursachen:

1. **Neue Systeme wurden neben die alten gebaut, nicht an ihre Stelle.** Ergebnis: 74 Ansichten, bis zu 6 Ebenen tief, Vorgänge an 7 Orten, zwei Gesetzeswege mit verschiedenen Regeln, zwei Fiskalkanäle, zwei Länderdatenquellen.
2. **Anzeige und Rechnung laufen auseinander.** Karte zeigt ungebaute Bauwerke, Weltrang ist eingefroren, Defizit-Erklärung summiert falsch, Rathäuser behalten alte Farben. In einem Entscheidungsspiel untergräbt das das Vertrauen in jede Zahl.
3. **Es gibt zu wenig Widerstand.** Alle 32 Abstimmungen in ~20 Spieljahren angenommen; Nichtstun senkt die Inflation von 31,5 % auf 7,6 %; Hyperinflation kostet kein Wachstum; außenpolitisch untätig = USA-Vertrauen 100.
4. **Die Welt lebt im Hintergrund, aber nicht gegenüber dem Spieler.** 0,84 Länderinitiativen pro Jahr, 11 von 18 Ländern melden sich nie.
5. **Die Karte ist groß, zeigt aber kaum Folgen.** Nach 19 Monaten ändern sich 18 % der Bildpunkte, fast alles durch die Jahreszeit.
6. **Es fehlt ein roter Faden.** Ziele, Fokusbaum, Programme und Unterschriftenmappe sind getrennte Systeme. Die Ziele haben keine Spielwirkung, drei sind schon beim Start erfüllt. Etwa die Hälfte aller Ereignisantworten ist nach 180 Tagen folgenlos; echte Zwickmühlen gibt es rund vier pro Jahr. Langfristige Planung wird belohnt („früh investieren, spät verteilen“ gewinnt 6 von 6), aber nirgends sichtbar.

## 2. Was nicht sauber funktioniert (P0, zuerst beheben)

### 2.1 Oberfläche und Navigation
- Bei 1366×768 ist der letzte Leisten-Eintrag abgeschnitten (`ui/styles.css:1229`).
- Amtsübergabe „234 Sitze, Mehrheit fehlt“ gegen Kopfleiste 546/600 (`ui/Stage.tsx:1463`).
- „So regieren Sie“ nennt Einträge, die es nicht mehr gibt (`sim/spiel.ts:234`).
- Haushalt-Kacheln im Übersicht-Muster unlesbar (Titel abgeschnitten, Zahlen brechen senkrecht).
- Falsche Sprungziele (Zinssitzung → Lage statt Zentralbank; „Präsident überlastet“ → Chronik).

### 2.2 Karte
- Kanal Istanbul, Brücken, Atatürk-Damm stehen ab Spielbeginn auf der Karte, auch ungebaut (`ui/atlas/vector.ts:824`).
- Fertige Strecken verschwinden (`neubau.ts:29`); Katastrophenschäden verschwinden mit dem Ereignis.
- Stadtschilder lesen Parteien von 2024, nicht `kommunen.rathaus` (`staedte.ts:103`).
- Ebenen „Wirtschaftskraft“ und „Infrastruktur“ eingefroren; rote „aktive Front“ im Frieden.

### 2.3 Wirtschaft
- BIP in TL nie fortgeschrieben → BIP in USD stürzt mit jeder Abwertung (`sim/devisen.ts:134`).
- Inflation kostet kein Wachstum; Schuldenquote sinkt trotz 8 % Defizit; Disinflation auf Autopilot.
- Defizit-Erklärung, Vergleichsbalken und Weltrang passen nicht zur Kennzahl.
- Ereignisse schreiben am Haushaltsregler vorbei in den Ausgabenimpuls.

### 2.4 Recht und Parlament
- Zwei Gesetzeswege: über Regler ohne Gericht, ohne Fassungsgrenze (`handeln.ts:495`).
- Parlament ohne Gegenwind (125 von 130 schärfsten Fassungen „sicher“).
- Sperre „Justiz im Umbau“ legt den ganzen Rechtsbereich jahrelang still (`krisen.ts:197`).
- Gericht prüft praktisch nur liberale Gesetze; restriktive haben 0 % Klagerisiko (`gesetzgebung.ts:183`).
- Gesetzesvorhaben-Kacheln ohne Titel, Texte überlagern sich.

### 2.5 Außenpolitik und Krieg
- Waffenruhe-Angebote im Wochentakt mit Erschöpfungsspirale; alle Falken-Partien endeten im Sturz (`ereignisse-krieg.ts:59`).
- Absurde Koalitionen: 7 EU-Staaten kämpfen mit der Türkei gegen Zypern (eigene Eskalation wird Gegner angerechnet).
- „Spannung“ und Waffenruhe enden nie; Kleinstaaten greifen an ohne Stärkeprüfung (`krieg.ts:1090`).
- Vertrauensdrift ohne Obergrenze; F-35 ohne S-400; Iran/Russland kollabieren in fast jedem Lauf.
- Viele Klauseln ohne die versprochene Wirkung (Swap, Meerengen, Vermittlungszusage).

### 2.6 Spielfluss
- Unterschriftenmappe empfiehlt Unausführbares: von 479 empfohlenen Einträgen in zwei Spieljahren ließen sich 77 ausführen; dieselben Einträge kommen wöchentlich wieder (`ministerfluss.ts:427`).
- Mappe steht still: Plätze 1–4 im März 2029 wie am ersten Tag.
- Ziel „Frieden an den Grenzen“ scheitert ohne Krieg (Spannungsphasen entstehen von selbst); drei Ziele sind beim Start schon erfüllt; „Inflation unter 15 %“ schafft auch der passive Bot.
- Wirkungspfeile im Ereignisfenster werten falsch (steigende Korruption grün ▲) (`EreignisFenster.tsx:150`).
- Pausen ohne Entscheidung (Hormus, Diaspora, Vorwarnung Opposition) halten die Zeit an und bieten nur „Verstanden“.
- Zwei verschiedene Zustimmungswerte (Kopfleiste gegen Ereignistext).

## 3. Was fehlt (Spielweise und Funktionen)

| Bereich | Fehlt vor allem |
|---|---|
| Navigation | Ein Ort je Thema; eine einzige Vorgangsliste; Akten öffnen beim dringendsten Vorgang; Karte schaltet Ebene je Akte (Civ-Linsen) |
| Karte | „Was hat sich seit dem letzten Blick verändert“; Folgenstempel nach jedem Beschluss; Bauwerke bleiben stehen; Trümmer und Wiederaufbau; Rathausfarben; Ortsmaßnahmen sichtbar; Städtewachstum (braucht dynamische Bevölkerung) |
| Wirtschaft/Statistik | BIP-Niveau und BIP/Kopf; Zerlegung über die Amtszeit; Statistikamt-Ansicht mit Aufschlüsselung, Provinz-Ranglisten, Export; echter Strukturwandel; Güterbilanz an Leistungsbilanz |
| Ländervergleich | Vergleich auf Basis der laufenden Weltmodell-Werte statt Foto 2025; Rang, der sich bewegt; G20-Rang |
| Andere Länder | Weltmodell als Treiber der Initiativen; Abkühlung je Land; Agenda/Persönlichkeit je Führung; Partner, die Verträge brechen; Verlängern/Nachverhandeln für den Spieler |
| Spielfluss | Ziele mit Spielwirkung als roter Faden; Plan-Leiste mit Countdowns („wirkt ab 2031“); Abschlussszenen (Fokus fertig, Reform wirkt); Phasen der Amtszeit; folgenlose Routine-Ereignisse zu Meldungen herabstufen; Druck auf gehortetes Kapital |
| Recht | Ein Gesetzesweg; Gericht nach Richtung; Ausnahmezustand als Vorgang; Parteiverbot/Boykott mit Sitzfolge; gewinnbare Kommunalwahl; Gesetze der Opposition als Dilemma |

## 4. Empfohlene Reihenfolge

1. **Sofort (je ≤ 1 Tag):** die P0-Fehler aus Abschnitt 2 — falsche Anzeigen zuerst, dann hängende Kriegswege, dann Wirtschafts-Rechenfehler.
2. **Strukturbereinigung (Tage):** ein Gesetzesweg, ein Fiskalkanal, eine Länderdatenquelle, eine Vorgangsliste; Leiste auf neun Einträge in drei Gruppen (Bericht 1, Abschnitt 8).
3. **Widerstand kalibrieren:** Parlament, Inflationskosten, Vertrauensdrift, Kommunalwahl; danach Langpartie-Tests wieder als Tor.
4. **Sichtbarkeit:** Karte als Rückmeldung jeder Entscheidung; Statistik- und Vergleichsansicht.
5. **Lebendige Welt gegenüber dem Spieler:** Weltmodell → Initiativen, Länder-Agenden.
6. **Roter Faden:** Ziele mit Wirkung, Plan-Leiste, Abschlussszenen, weniger aber schwerere Ereignisse.

## 5. Offene Punkte dieser Analyse

- Testlauf am W4-Stand (ohne Last, 29.10.): **1.962 grün, 8 übersprungen, 1 rot** (148 Dateien, ~16 Min.); `tsc --noEmit` fehlerfrei. Der einzige rote Test ist `game/test/_extrakt.test.ts`: ein versehentlich eingechecktes Hilfsskript, das eine Datei im Mac-Scratchpad liest (`/private/tmp/claude-501/…/netzknoten.json`) — gehört nicht ins Repository. Die Ausfälle des ersten Laufs (`reich-katalog`, `nachtrag`, `wahl`) waren Zeitüberschreitungen unter Last.
- WebGL-Leistung auf echter Grafikkarte ungeprüft.
