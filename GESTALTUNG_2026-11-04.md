# Gestaltung – Bestandsaufnahme und Plan (4. November 2026)

Anlass: Vorgabe P in [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md): Das Spiel soll „viel schöner“ werden; die Möglichkeiten sind groß, aber „nicht gut ausgearbeitet“. Vorbild für die Anmutung ist Civilization. Grundlage dieses Dokuments ist ein Rundgang durch alle zehn Hauptbereiche bei 1512×982 (Bilder: `reports/Gestaltung-Bestand-2026-11-04/bogen1–4.webp`). Die 3D-Karte konnte in der Cloud-Umgebung ohne Grafikkarte nicht gezeichnet werden und ist hier **nicht** bewertet.

## 1. Befund

| Nr. | Befund | Beispiel |
|---|---|---|
| B1 | **Zwei Bildsprachen.** Titel, Ereignisfenster, Stand der Dinge und Schreibtisch nutzen Pergament, Tinte, Goldecken und Leder (spielhaft). Die neun Fachakten nutzen eine flache hellgraue Kopfzeile, Pastellflächen und kleine Kacheln (wie eine Büro-App). Wer vom Schreibtisch in die Gesellschaft wechselt, wechselt das Spiel. | Bogen 1 rechts unten gegen Bogen 3 |
| B2 | **Alle Akten sehen gleich aus.** Kopf mit drei Zahlen, „Lage: angespannt/ruhig/gemischt“, ein Knopf „… öffnen“, darunter Textkacheln. Nur die Farbe des Menüs unterscheidet Sicherheit von Medien. Kein Bereich hat ein eigenes Bild oder Gefühl. | Bogen 2–4 |
| B3 | **Möglichkeiten sind Text, keine Gegenstände.** Kampfjet KAAN, Zerstörer TF-2000, Nordatlantikpakt, Kernkraftwerk Akkuyu, Alewiten: alles als zweizeilige Textkachel („Möglich“, „14 Mitglieder“, „seit Spielbeginn“). In Civilization hat jede Einheit, jedes Gebäude und jedes Wunder ein Bild, und man *will* es haben. | Agenda, Land, Sicherheit |
| B4 | **Leere Abschnitte nehmen Platz.** „Derzeit nichts.“ steht drei- bis viermal je Akte als eigene Überschrift. | Legislative, Agenda, Sicherheit |
| B5 | **Ein Klick zu viel bis zur Handlung.** Die Übersicht zeigt die Lage; handeln kann man erst nach „Gesetzesvorhaben öffnen“, „Fokusbaum öffnen“ usw. | alle Akten |
| B6 | **Zahlen ohne Bildsprache.** Polarisierung 76, Abschreckung 55, Pressefreiheit 29,4 sind nackte Zahlen. Es gibt keine feste Farbe und kein festes Symbol je Größe, wie Civilization sie für seine Erträge hat. Kosten erscheinen mal als „4 PK“, mal als „1 AP“, mal als Fließtext. | Kopfzeilen, Kostenangaben |
| B7 | **Textwände in Entscheidungskarten.** Die Wahlversprechen-Karte erklärt in acht Absätzen, was nicht gebucht wird. Inhaltlich richtig (Härte-Regel), aber das Wichtigste (Preis, Wirkung, Frist) geht unter. Bis zu vier Schriftfamilien stehen in einer Karte nebeneinander. | Wahlkampf, Krisengesetze |
| B8 | **Die Akte verdeckt das Land.** Jede Akte legt sich über fast den ganzen Bildschirm; die Karte, die bei Civilization die Bühne ist, sieht man beim Regieren kaum. | alle Akten |

Was schon trägt: die Ereignisfenster mit Tuschezeichnung (Straße von Hormus), der Titel, die Porträts, die Goldknöpfe und die fünf Strichzeichnungen in `ui/art/Vignette.tsx`. Davon gibt es nur fünf Motive, und sie stehen nur in Ereignissen und am Wahlabend.

## 2. Was Civilization schön macht (Prinzipien, keine Vorlage)

Übernommen werden Prinzipien, keine Grafik, keine Namen und keine Optik eines fremden Spiels.

1. **Eine Welt, eine Bildsprache:** Jede Tafel gehört sichtbar zur selben Welt wie die Karte.
2. **Dinge statt Zeilen:** Was man bauen, erforschen oder schließen kann, hat ein Bild und eine Form; das Freischalten ist ein Moment.
3. **Feste Zeichen für Ressourcen:** Eine Farbe und ein Symbol je Größe, überall gleich, damit man Kosten liest, ohne zu lesen.
4. **Ruhe vor Vollständigkeit:** Erst Bild, Name, Preis, Wirkung; die Herleitung auf Abruf.
5. **Die Karte bleibt die Bühne:** Tafeln legen sich an den Rand, nicht über alles.

## 3. Plan in Stufen

| Stufe | Inhalt | Löst |
|---|---|---|
| G1 | **Gemeinsamer Aktenrahmen** in der Sprache der Ereignisfenster: Pergamentkopf mit Strichzeichnung je Bereich (zehn neue Motive im Stil von `Vignette.tsx`), Goldecken, eine Titelschrift und eine Textschrift. Leere Abschnitte fallen weg oder werden zu einer Zeile. | B1, B2, B4 |
| G2 | **Zeichensprache für Ressourcen:** feste Symbole und Farben für Politisches Kapital, Staatsgeld (Mrd. TRY / % BIP), Aufmerksamkeit, Wahlkampf-AP, Zustimmung und Zeit; ein gemeinsamer Baustein „Preis“ für alle Entscheidungskarten. | B6, Teil B7 |
| G3 | **Möglichkeiten als Bildkarten:** Vorhaben, Wissensbaum, Fokus, Bündnisse, Bauten und Milieus erhalten Motiv, Zustand (möglich, gesperrt, im Bau, fertig) und Preis-Baustein; Handlung direkt auf der Karte statt hinter „… öffnen“. | B3, B5 |
| G4 | **Entscheidungskarten entschlacken:** Kopf mit Preis, Wirkung, Frist; die Begründungen bleiben vollständig, aber aufklappbar (Härte-Regel bleibt). | B7 |
| G5 | **Karte als Bühne:** Akten auf breiten Fenstern als Seitentafel neben der sichtbaren Karte; Ortsbezug (Provinz, Baustelle) leuchtet auf der Karte auf. | B8 |
| G6 | **Momente:** Beschluss, Fertigstellung, Freischaltung mit kurzer Szene (siehe Abschnitt N in ENTSCHEIDUNGEN, „Animationen wie bei Civ 6“). | B3 |

Jede Stufe wird mit `e2e/wahlkampf-oberflaeche-pruef.mjs` als Muster im Browser in vier Fenstergrößen geprüft, mit Vorher-Nachher-Bildern.

## 4. Offene Fragen an den Projektinhaber

- Welche Stufe zuerst? Empfehlung: G1+G2 an einer Pilotakte, weil alle späteren Stufen auf Rahmen und Zeichensprache aufbauen.
- Wie wirkt die 3D-Karte auf dem eigenen Rechner? Ein Bildschirmfoto von dort würde die Bewertung von B8 und G5 ermöglichen.

## 5. Beispiele (Musterseite)

Auf Wunsch des Projektinhabers gibt es Beispiele zum Anschauen: `game/muster.html` (Dev-Server starten, dann `http://localhost:5173/muster.html`). Die Seite gehört nicht zum Spiel. Sie nutzt die echten Zeichnungen (`WunderBild`, Ornamente, Symbole) und liest Kosten, Wirkung, Kehrseite und Voraussetzungen der Vorhaben aus den Spieldaten. Kennzahlen stammen aus den geprüften Spielständen vom 6. Juni und 4. August 2028.

1. **Aktenrahmen (G1+G3)** am Beispiel Sicherheit & Verteidigung: neue Strichzeichnung (Küste, Schiff, Strahlflugzeug), Kennzahlen als Messringe, Lage als Stempel, Möglichkeiten als Bildkarten (Hürjet, KAAN Block 10, TF-2000, Akkuyu im Bau) mit Preis-Baustein, Wirkung, Kehrseite und fehlender Voraussetzung samt „Weg dorthin zeigen“.
2. **Zeichensprache (G2):** neun Ressourcen mit festem Symbol und fester Farbe.
3. **Entscheidungskarte (G4):** Wahlversprechen „Renten erhöhen“ mit Zielbalken, Frist, Preis, Mehrheit oben; Herleitung aufklappbar.

Vorher-Nachher-Bilder: `reports/Gestaltung-Beispiele-2026-11-04/`. Die Seite ist bei 1440 px und 390 px geprüft (kein seitliches Überlaufen).
