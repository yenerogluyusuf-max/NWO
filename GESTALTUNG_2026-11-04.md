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

## 6. Umsetzung im Spiel (Pilot, 4. November)

Nach Zustimmung des Projektinhabers zu den Beispielen sind G1 bis G3 im Spiel umgesetzt, als Vorlage für die übrigen Ansichten.

| Stufe | Umgesetzt | Wo |
|---|---|---|
| G1 Rahmen | Alle Fachakten tragen den Leder- und Goldrahmen mit Goldecken wie Schreibtisch und Ereignisse; die flache hellgraue Kopfzeile ist entfallen. Der Aktenkopf zeigt eine Kupferstich-Zeichnung des Bereichs in ihrem echten Seitenverhältnis, Kennzahlen aus dem Politiknetz (Skala 0–100) mit Messring. Leere Lageabschnitte stehen nur noch in einer Zeile statt je als Überschrift mit „Derzeit nichts.“ | `ui/akte/Akte.tsx`, `akte.css`, `Stage.tsx`, `art/Vignette.tsx` (neues Motiv „Küste“) |
| G2 Zeichen | Neun Ressourcen mit festem Symbol und fester Farbe; Preis-Baustein mit Vorlesetext; fehlendes Kapital oder Verwaltungskraft wird rot umrandet. | `ui/akte/Zeichen.tsx`, `zeichen.css` |
| G3 Bildkarten | Sicherheit (Rüstung) und Land (Infrastruktur) zeigen bis zu vier Vorhaben als Bildkarten aus dem **echten** Zustand der Simulation: im Bau mit Restmonaten, sofort möglich, oder mit fehlender Voraussetzung im Wortlaut der Simulation. Der Knopf springt in die bestehende Vorhabenkarte; Beginnen, Vergabe und Reihenfolge bleiben dort, die Spielregeln sind unverändert. | `ui/akte/Bildkarten.tsx`, `Bereiche.tsx` |

Neue Texte stehen dreisprachig in `i18n/katalog/*/gestaltung.json`. Tests: `test/akte-bildkarten.test.tsx` (Auswahl und Reihenfolge gegen die Simulation, keine Instandsetzungen, drei Sprachen ohne kaputte Platzhalter, nur lesend, leere Abschnitte). Bilder: `reports/Gestaltung-Umsetzung-2026-11-04/`.

**Noch offen:**

- Eigene Motive für Gesellschaft, Medien, Regierung und Wissen (heute zwischenzeitlich Istanbul, Parlament und Anatolien).
- Bildkarten für Kultur, Recht und Wissensbaum.
- G4 (Entscheidungskarten entschlacken), G5 (Karte als Bühne) und G6 (Momente).
- Die Klassennamen der Vorhaben („Wunder“, „Großprojekt“) sind bisher nur deutsch; das ist eine vorhandene Übersetzungslücke.

## 7. Regelwerk „Kabinettstisch“ (verbindlich ab 4. November)

Anlass: Der Projektinhaber sah ein Spiel, das wirkt, als hätten mehrere Leute ihre Entwürfe zusammengeworfen, und verlangte, jede Änderung am Gesamtbild zu messen (ENTSCHEIDUNGEN T). Dieses Regelwerk gilt für jede Ansicht; Abweichungen brauchen einen Grund (etwa die Zeitung als eigenes Druckbild, die Karte, Parteifarben).

| Regel | Festlegung | Wo |
|---|---|---|
| Farben | Leder (#3a2418 bis #5a3722), Messing (#7c5823, #c69a4a, #f1d58f), Pergament (#efe4cb bis #fffdf7), Tinte (#2a1f18), Siegelrot (#8e2a22) als einziger Akzent. Kein Grün, kein Blau für Flächen; Signalfarben nur klein. | `styles.css` (Variablen), `akte.css` |
| Schrift | vier Rollen: Lesetext und Daten EB Garamond (Ziffern gleich breit), Titel und große Zahlen Fraunces, Beschriftungen, Knöpfe, Reiter und Leisten Marcellus SC (Kapitälchen), Aktenvermerke Courier Prime. Keine serifenlose Schrift. | `--sans`, `--serif`, `--display`, `--kapitaelchen`, `--maschine` |
| Größen | Stufenleiter 11,5 · 12,5 · 14 · 15 · 16,5 · 18 · 21 · 24 · 28 · 32 · 40 · 48 px | alle Stylesheets |
| Navigation | höchstens zwei Ebenen sichtbar: Leiste links (Bereiche), Aktenreiter über dem Blatt (Unterseiten; Arbeit links, Einordnung rechts). Auf dem Handy eine wischbare Reiterzeile. | `navigation.css`, `akte.css` |
| Knöpfe | drei Stufen: Haupt (Leder mit Messingkante), Normal (Pergament mit Messingrand), Leise (Schrift) | `akte/bauteile.css` |
| Titel im Blatt | Kapitälchen in Siegelrot mit Messinglinie | `akte/bauteile.css` |
| Prüfung | Jede Gestaltungsänderung läuft durch `game/e2e/gesamtbild.mjs` (28 Bildschirmarten, Breite 1440 und 390) mit Messung von Schriften, Größen, Knöpfen, Flächen, Rundungen | `game/e2e/gesamtbild*.{mjs,py}` |

**Messung im Gesamtbild (28 Bildschirmarten, 1440 px):**

| Größe | vorher | nachher |
|---|---|---|
| Schriftfamilien | 5 (Inter, Garamond, Fraunces, Marcellus, Courier gemischt) | 4, jede mit einer Aufgabe |
| Schriftgrößen | 41 | 24 (Rest: Diagramme und Sonderfälle) |
| Knopf-Erscheinungsbilder | 81 | 73 (davon die meisten Kartenmarken; Akten, Fenster und Unterreiter folgen den drei Stufen) |
| Rundungen | 14 | 6 (4, 6 und 10 px, dazu rund und Pille) |

**Zweite Runde (4. November):**
- **Unterreiter** (dritte Ebene in Außen, Kabinett, Medien, Personen, Erklärung): leise Kapitälchen auf einer Messinglinie, offener Reiter mit siegelrotem Strich, statt Kacheln, Pillen und Karteikarten.
- **Fenster:** Leder ist der Hauptknopf, Messing der zweite; ein einzelner Knopf ist immer Haupt (vorher war „Zur Akte“ golden und „Verstanden“ gleichwertig).
- **Politik:** Die Bereichsliste ist ein Register im Blatt (offener Bereich Pergament mit rotem Strich, nicht mehr goldene Kachel); die Ampelringe tragen Palettenfarben (ruhig neutral, Achtung Messing, angespannt Siegelrot).
- **Farben:** mittlere Grüntöne auf ein Signalgrün, mittlere Blautöne auf Tinte; Rundungen auf 4, 6 und 10 px.
- **Fehler aus dem Gesamtbild:** Die Zielwahl am ersten Amtstag lag hinter dem Schreibtisch und war nicht bedienbar; Fenster liegen jetzt immer über Akten und Leiste.

**Dritte Runde: die Karte (4. November):** geprüft an der echten Karte mit Software-Grafik (`game/e2e/karte-mit-grafik.mjs`) und bei sechs Bildschirmgrößen (`game/e2e/leiste-hoehen.mjs`).
- Die Legende „Marken auf der Karte“ ist zu, bis man sie öffnet (die Wahl wird gemerkt); offen verdeckte sie den Osten mit der Front.
- Der Knopf „Kartenebene“ hat einen festen Platz unter der Leiste; bei 800 px Höhe lag er dahinter.
- Die Leiste wird bei niedrigen Bildschirmen dichter: Bei 1024×768 bis 1920×1080 sind alle elf Bereiche ohne Scrollen sichtbar.
- Die Meldung „Die Karte konnte nicht geladen werden“ steht in der Mitte statt unter der Kartusche.

**Noch offen:** Kartenmarken (die meisten verbleibenden Knopfbilder), die Zeitung als eigenes Druckbild bewusst ausgenommen, Parteifarben im Halbrund bleiben.
