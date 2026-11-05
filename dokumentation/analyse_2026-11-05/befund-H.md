# Befund H: Gestaltungssystem über das ganze Spiel (Schrift, Farbe, Artwork, Bausteine, Bewegung)

Prüfer H (Gestaltung), 5. November 2026. Grundlage:
- alle 41 Bilder unter `rundgang/` selbst angesehen;
- eigene Aufnahmen mit kopflosem Playwright (Titel, Prolog, Amtsantritt, Ereignisfenster, 2D- und 3D-Karte, Kunst- und Musterseite) unter `/private/tmp/claude-501/-Users-yusufyeneroglu/904f44f4-7b5f-44c2-9447-c69e44ab880b/scratchpad/analyse-H/`;
- Zählung über alle 80 Stylesheets unter `game/src/ui` (ohne die Musterseite `muster/identitaet.css`) mit dem Skript `analyse-H/css_zaehlen.py` im selben Scratchpad-Ordner;
- Abgleich mit dem eigenen Regelwerk „Kabinettstisch“ in `GESTALTUNG_2026-11-04.md` §7, das seit dem 4. November verbindlich ist.

Kurzurteil: Das Spiel hat eine starke Grundidee (Leder, Messing, Pergament, Tusche, Siegelrot), und an drei Stellen sieht es wirklich aus wie ein Spiel: die 3D-Karte, das Titelbild und die Bildkarten der Vorhaben. Dazwischen liegen Akten, die gleich gerahmt sind, innen aber aus fünf Reitersorten, drei Kennzahlkacheln, vier Ringen, zwei Bildstilen und 1.374 verschiedenen Farbwerten bestehen. Daher kommt „sieht wieder alles verschieden aus“. Die Ursache liegt nicht an einzelnen Ansichten. Es fehlt eine Schicht aus Bausteinen, die alle Ansichten benutzen müssen. Heute wird Einheitlichkeit nachträglich über Klassenlisten mit `!important` erzwungen (454 Stellen).

---

## 0. Zählung (die harten Zahlen)

| Größe | Ist | Regelwerk §7 | Bewertung |
|---|---|---|---|
| Geladene Schriftfamilien im Spiel | 5 (`main.tsx:3–11`: Fraunces, EB Garamond, Inter, Marcellus SC, Courier Prime) | 4, „keine serifenlose Schrift“ | Inter wird geladen, ist aber laut `styles.css:23–25` „aus dem Spiel“; toter Ballast |
| Zusätzlich fest verdrahtet | Georgia (`gueter/transport.css:22,25,38,57,80`), „Inter“ als SVG-Schrift (`art/Portraet.tsx:766`, passt nicht einmal zum geladenen Namen „Inter Variable“) | – | Abweichung |
| Verschiedene Schriftgrößen in CSS | 65 Werte bei 2.837 Angaben | Leiter mit 12 Stufen | 94 % liegen auf der Leiter (gut). 177 Angaben mit 51 Fremdwerten (12, 13, 13,5, 15,5, 17, 20, 22, 30 px, em-Werte, clamp) |
| Anteil Text unter 14 px | 875 von 2.837 Angaben (11,5 px: 368 Mal, 12,5 px: 507 Mal) | – | **zu klein für Garamond** (kleine x-Höhe), siehe H-03 |
| Schriftschnitte | 400, 500, 550, 600, 650, 700, 750, 800 | – | 8 Stufen; 650, 550 und 750 sind Zufallswerte |
| Laufweiten (letter-spacing) | 58 verschiedene Werte | – | ungeregelt |
| Großbuchstaben per `text-transform` | 266 Regeln | – | zu viele VERSALIEN (Chips, Kicker, Kachelköpfe) |
| Farbwerte als Hex | **1.374 verschiedene** bei 3.652 Angaben | 5 Familien | ungeregelt |
| Farbwerte als rgba | 611 verschiedene | – | ungeregelt |
| Hex-Farben direkt im TSX | 478 verschiedene, 952 Stellen; 272 `style={{…}}` | – | Farbe am Stylesheet vorbei |
| Globale Farb-Tokens | 13 in `styles.css:7–32`, dazu 17 `--pd-*`, 6 `--tr-*`, 6 `--sd-*`, 5 `--ba-*`, 4 `--ak-*` je Ansicht | ein Satz | jede Ansicht hat ihre eigene Palette |
| Farben für „gut“ | 23 verschiedene Werte (von Braun `#5d4231` bis Grün `#2f6b45`, `#8fd49a`) | – | „gut“ ist meist braun wie der Text, also unsichtbar, siehe H-08 |
| Farben für „schlecht“ | 16 verschiedene Werte | Siegelrot | uneinheitlich, aber immer rot (gut) |
| Rundungen | 38 Werte, 88 von 972 Angaben außerhalb 4/6/10/rund/Pille | 4, 6, 10 px | nahezu eingehalten |
| Schatten (box-shadow) | 301 verschiedene | – | ungeregelt |
| Innenabstände (padding) | 437 verschiedene | – | ungeregelt, kein Raster |
| `!important` | 454 | – | Zeichen eines Kaskadenkriegs |
| `<button>`-Elemente / verschiedene Erstklassen | 521 / **138** | 3 Knopfstufen | 3 Stufen, aber per Klassenliste (`akte/bauteile.css:6,17`) über 19 Klassen gestülpt; der Rest bleibt eigen |
| Komponenten namens `…Karte` | über 35, darunter zwei verschiedene `VorlageKarte` (`minister/VorlageKarte.tsx:228`, `reich/Regional.tsx:16`) | eine Karte | siehe H-13 |
| Gemeinsame Bausteine in `ui/bausteine/` | 7; benutzt: `Rad` (1 Datei), `ReglerZeile` (2), `PersonChip` (1); **unbenutzt: `Tacho`, `Seitenfenster`, `Kreisfeld`, `Erklaer`** | – | der Baukasten ist angelegt, aber nicht angeschlossen |
| Preis-Baustein `Preis` (`akte/Zeichen.tsx:42`) | in 2 Dateien benutzt; über 20 Dateien zeigen Kosten auf eigene Art | „ein gemeinsamer Baustein Preis für alle Entscheidungskarten“ (§3 G2) | siehe H-12 |
| `:active` (Druckrückmeldung) | 9 Regeln (bei 217 `:hover`) | – | Klicks fühlen sich kaum an |
| Bilddateien in `public/ui` | 8 PNG, davon 4 unbenutzt (`plakette.png`, `rahmen-portraet.png`, `medaillon-rot.png`, `medaillon-blau.png`) | – | |
| Gemalte Porträts | Manifest `public/ui/portraits/portraits.json` ist leer (`"bilder": []`) | – | alle Gesichter sind der gezeichnete Rückfall |
| Klänge | 4 Sinustöne für Meldungen (`ton/ton.ts:69–88`), kein Klickton, keine Musik, kein Feierklang | – | siehe H-22 |

---

## 1. Ansichten

### 1a. Karten der Ansichten, die nur H sieht (quer über das Spiel)

**Titelbild** (eigene Aufnahme `titel_de.png`)
- Frage der Seite: Was ist das für ein Spiel, und wie fange ich an?
- Antwort: ja. Großer Fraunces-Titel, Siegel mit Halbmond, Leder auf der Karte.
- Länge: 1 Bildschirm
- Noten: Schönheit 2, Verständlichkeit 1, Sinn 1, Spielgefühl 2
- Urteil: Der stärkste Einzelbildschirm. Es fehlt nur Bewegung: keine Musik, keine langsame Kamerafahrt über die 3D-Karte dahinter, die Karte dahinter ist die flache 2D-Fassung.

**Prolog, Figurenbau und Lebenslauf** (`prolog1.png`, `prolog3.png`)
- Frage: Wer bin ich?
- Antwort: ja. Porträt im Messingoval vor einer Strichlandschaft, Stationenband, Bildkarten für die Herkunft.
- Länge: 1 Bildschirm
- Noten: Schönheit 2, Verständlichkeit 2, Sinn 2, Spielgefühl 2
- Urteil: Das Blatt ist schön. Die linke Bildschirmhälfte zeigt aber nur leere, cremefarbene Provinzflächen, und das gebaute Gesicht taucht später in der Kopfleiste nicht auf (H-17).

**Amtsantritt mit Zielwahl** (`antritt_de.png`)
- Frage: Was soll von dieser Amtszeit bleiben?
- Antwort: teilweise. Das Halbrund beantwortet die Mehrheitsfrage, nicht die Zielfrage.
- Länge: 1 Bildschirm
- Noten: Schönheit 2, Verständlichkeit 2, Sinn 2, Spielgefühl 2
- Urteil: Ein würdiger Moment, aber 18 gleich gebaute Zielkacheln wirken wie ein Formular. Ziele verdienen Bildzeichen in der Größe von Civ-Siegtypen.

**Ereignisfenster** (`fenster0.png`)
- Frage: Was ist passiert, und was tue ich?
- Antwort: ja. Person links, drei Antworten mit Preis und Folgen.
- Länge: 1 Bildschirm
- Noten: Schönheit 3, Verständlichkeit 2, Sinn 2, Spielgefühl 2
- Urteil: Der Aufbau ist gut, nah an Suzerain. Das Kopfbild (Waage, Säulen, Bücherstapel als flache Rechtecke) ist der schwächste Bildstil im Spiel. Das Porträt mit hellen, pupillenlosen Augen wirkt leblos.

**Bühne mit 3D-Karte** (`karte3d.png`, Software-Grafik)
- Frage: Wie steht mein Land da, und wo brennt es?
- Antwort: ja. Relief, Provinzfarben, Stadtsilhouetten, Werte und Warnzeichen je Provinz, Nachbarflaggen.
- Länge: 1 Bildschirm
- Noten: Schönheit 2, Verständlichkeit 3, Sinn 2, Spielgefühl 1
- Urteil: Hier sieht das Spiel nach Hearts of Iron aus. Fast jede Provinz trägt ein gelbes Warndreieck; wenn alles warnt, warnt nichts.

**Bühne mit 2D-Ersatzkarte** (`karte_de.png`, ohne 3D-Grafik)
- Frage: wie oben
- Antwort: nein. Leere, gleichfarbige Polygone, keine Städte, keine Werte.
- Länge: 1 Bildschirm
- Noten: Schönheit 4, Verständlichkeit 4, Sinn 3, Spielgefühl 4
- Urteil: Der Rückfall ist eine Landkarte aus dem Atlas, kein Spielbrett. Der ganze Rundgang der anderen Prüfer lief vor dieser Fassung; ihre Bilder unterschätzen die echte Bühne.

**Kunstseite und Musterseite** (`kunst.html`, `muster.html`)
- Frage: Wie sollen die Bausteine aussehen?
- Antwort: ja. Die Musterseite zeigt Preis-Baustein, Ressourcenzeichen und Bildkarten.
- Noten: Schönheit 2, Verständlichkeit 2, Sinn 2, Spielgefühl –
- Urteil: Die Musterseite ist der beste Gestaltungsleitfaden, den das Projekt hat, nur gilt sie im Spiel kaum (H-12).

### 1b. Alle 41 Rundgangsbilder im Vergleich

Spalten: Schönheit, Verständlichkeit, Sinn, Spielgefühl (1 bis 5); „Bild oben“ heißt: Beantwortet ein Bild die Frage der Seite?

| Nr | Ansicht | Schirme | Bild oben | S | V | Si | Sp | Urteil in einem Satz |
|---|---|---|---|---|---|---|---|---|
| 001 | Schreibtisch | 2,55 | nein | 3 | 2 | 2 | 3 | Ordentliche Akte; Zusagekarten als Textlisten, das Porträt der YENİ ist 20 px klein. |
| 002 | Schreibtisch › Verlauf | 1 | nein | 5 | 3 | 3 | 5 | Leeres Pergament mit drei kursiven Sätzen, ohne Kopf; sieht aus wie ein Platzhalter. |
| 003 | Politik › Bereiche | 1,04 | ja (Ringe) | 2 | 2 | 2 | 2 | Gute Ringübersicht; Liste links und Ringe rechts zeigen dasselbe doppelt. |
| 004 | Politik › Vorschläge | 1,6 | nein | 3 | 2 | 2 | 3 | Vier gleiche Karten mit demselben Minister; wirkt wie ein Posteingang, nicht wie ein Kabinettstisch. |
| 005 | Politik › Wirkungsnetz | 3,15 | teilweise | 3 | 3 | 3 | 3 | Drei Spalten, alle kleinteilig; „100 % des Ausgangs“ als Riesenzahl ist hässlich und regelwidrig. |
| 006 | Parlament › Tagesordnung | 1 | nein | 4 | 2 | 3 | 5 | Ein Satz und ein Knopf in einem großen leeren Kasten. |
| 007 | Parlament › Fraktionen | 3,01 | ja (Halbrund) | 2 | 2 | 2 | 2 | Das Halbrund ist eines der schönsten Bilder des Spiels. |
| 008 | Parlament › Umsetzung | 1,14 | nein | 4 | 2 | 3 | 4 | Drei Überschriften über drei Leersätzen. |
| 009 | Parlament › Verfassung | 1,83 | ja (Waage, Halbrund) | 2 | 3 | 2 | 2 | Waage und Artikelregler haben Charakter; kleine rote „−22 Ja“-Plaketten. |
| 010 | Parlament › Justiz | 2,01 | teilweise (Punkte) | 3 | 3 | 2 | 3 | Elf Balken in drei Spalten wie ein Kontrollpanel; die Richterpunkte sind gut. |
| 011 | Parlament › Mehrheitslage | 1 | nein | 4 | 3 | 3 | 4 | Lageschablone (siehe 015). |
| 012 | Kabinett › Ministerrat | 1,5 | ja (Tisch) | 3 | 3 | 2 | 2 | Gute Idee Tisch; Namen und Ämter überlappen sich („erkehr und Infrast…“), der Tisch ist abgeschnitten. |
| 013 | Kabinett › Gespräch | 1 | nein | 3 | 2 | 2 | 3 | Ein Chatfenster mit Pillenknöpfen; wirkt wie ein Hilfecenter. |
| 014 | Kabinett › Verwaltung | 1,4 | nein | 3 | 3 | 3 | 4 | Buchhaltungsseite mit drei Spalten Zahlen. |
| 015 | Kabinett › Handlungsfähigkeit | 1 | nein | 3 | 2 | 3 | 3 | Lageschablone mit neun Porträts; gleich gebaut wie alle Lage-Reiter (gut), aber ohne eigenes Bild. |
| 016 | Wirtschaft › Krisenrat | 1,68 | nein | 3 | 3 | 3 | 3 | Dunkler Lederblock im Papier: ein vierter Kopfstil. |
| 017 | Wirtschaft › Haushalt | 2,82 | ja (Rad) | 3 | 2 | 2 | 2 | Das Rad beantwortet die Frage; seine Farben (Türkis, Violett, Blau, Grün) stammen aus einer Tabellenkalkulation. |
| 018 | Wirtschaft › Versorgung | 1,58 | nein | 4 | 3 | 3 | 4 | Dunkler Kopfblock, dann drei Kennzahlen mit „—“; leer und unfertig. |
| 019 | Wirtschaft › Zentralbank | 1,99 | ja (Zinsband) | 2 | 2 | 2 | 2 | Das Zinsband ist ein gutes Bild; die Unterreiter sind hier Kastenknöpfe (fünfte Reitersorte). |
| 020 | Wirtschaft › Wirtschaftslage | 2,81 | ja (Kurve) | 2 | 2 | 2 | 3 | Saubere Kurve mit Prognoseband; Liste links mit Minikurven. |
| 021 | Wirtschaft › Bilanz | 1 | teilweise | 4 | 3 | 3 | 4 | Sechs flache rote Linien mit Achsen in 8 px; „WIRKUNGSBERICHTE“ als riesige rote Versalien. |
| 022 | Gesellschaft › Wählerkoalition | 2,03 | ja (Leisten) | 2 | 2 | 2 | 2 | Wählergruppen auf Leisten sind ein gutes Bild; Zahlen in den Knöpfen sind 11 px klein. |
| 023 | Gesellschaft › Opposition & Straße | 1 | nein | 5 | 3 | 3 | 5 | Fast leer; dazu fette graue Kastenreiter, ein weiterer Reiterstil. |
| 024 | Gesellschaft › Stimmung | 1 | nein | 3 | 2 | 3 | 3 | Lageschablone. |
| 025 | Land › Infrastruktur | 2,72 | teilweise | 3 | 3 | 2 | 3 | Bauleiste in acht Regenbogenfarben; die Bauvorschaubilder sind gut. |
| 026 | Land › Netze | 1,23 | ja (Tachos, Karte) | 2 | 2 | 2 | 2 | Tachos und Provinzkarte sind gut; alles in Grün entgegen dem eigenen Regelwerk. |
| 027 | Land › Kultur | 1,7 | nein | 3 | 3 | 2 | 3 | Stätten ohne ein einziges Bild, obwohl Hasankeyf und Antakya danach rufen. |
| 028 | Land › Katastrophen | 2,53 | ja (Ringe, Karte) | 2 | 2 | 2 | 2 | Gefahrenringe und Karte sind gut; drei Reiterebenen übereinander. |
| 029 | Land › Lage der Regionen | 1,7 | ja (Bildkarten) | 1 | 2 | 2 | 1 | Die Vorhabenkarten mit Sonnenuntergang sind das schönste Akteninnere. |
| 030 | Forschung › Fokusbaum | 1,06 | ja, unlesbar | 5 | 5 | 3 | 4 | Abgeschnittene Knotentitel („Gezielte K…“), Linien kreuz und quer; das hässlichste Bild des Spiels. |
| 031 | Forschung › Große Ziele | 3,01 | ja (Baupläne) | 2 | 2 | 2 | 2 | Bauplanbilder auf Leder; kräftig und spielhaft. |
| 032 | Forschung › Wissensbaum | 1 | nein | 3 | 2 | 3 | 3 | Ein Baum, der als Liste erscheint; der Baum selbst liegt hinter einem Knopf. |
| 033 | Forschung › Programme | 3,5 | teilweise | 2 | 2 | 2 | 3 | Stufenband 1–5 ist klar; viel zu lang. |
| 034 | Forschung › Stand der Agenda | 1,1 | nein | 3 | 2 | 3 | 3 | Lageschablone. |
| 035 | Außen › Länder | 1,75 | teilweise (Flaggen) | 2 | 3 | 2 | 2 | Flaggen machen die Liste lebendig; die Kennzahlkacheln sind ein dritter Kachelstil. |
| 036 | Außen › Weltlage | 2,51 | nein | 3 | 3 | 3 | 3 | Sechs Großkacheln mit viel Leerraum unten. |
| 037 | Sicherheit › Streitkräfte | 1,34 | nein | 3 | 3 | 3 | 4 | Kein Bild einer Einheit, kein Kartenbezug; für den Hearts-of-Iron-Teil ein Tabellenblatt. |
| 038 | Sicherheit › Rüstung | 2,18 | teilweise | 3 | 3 | 2 | 3 | Dieselbe Regenbogen-Bauleiste wie 025. |
| 039 | Sicherheit › Lage | 2,11 | nein | 3 | 2 | 3 | 3 | Konfliktliste mit vier gleichen Knöpfen „Konfliktdossier öffnen“. |
| 040 | Medien › Zeitung | 1 | nein | 5 | 3 | 3 | 5 | Ein kursiver Satz in einem leeren Kasten. Wo die Zeitung sein soll, ist nichts. |
| 041 | Medien › Lage | 1 | nein | 3 | 2 | 3 | 3 | Lageschablone; „Pressefreiheit 29,4“ verstößt gegen „Indizes ohne Komma“. |

### 1c. Die drei schönsten Ansichten

1. **Die 3D-Karte** (`karte3d.png`): Relief, gemalte Meeresnamen in Sperrschrift, Stadtsilhouetten, Flaggenmedaillen der Nachbarn. Eine Welt, eine Bühne.
2. **Das Titelbild** (`titel_de.png`): große Titelschrift, Siegel, Leder mit Goldecken, sofort klar, was man drückt.
3. **Bildkarten der Vorhaben** (029, Musterseite): Motiv im Gegenlicht, Zustand als Stempel („MÖGLICH“, „IM BAU“, „VORAUSSETZUNG FEHLT“), Preis als Ressourcenzeichen, Wirkung als Pfeilzeilen. So sollte jede Möglichkeit im Spiel aussehen. Knapp dahinter: das Halbrund (007) und die Baupläne der Großen Ziele (031).

### 1d. Die zehn hässlichsten Ansichten

1. **Fokusbaum (030):** Knoten zu schmal, jeder Titel abgeschnitten, Linien verlaufen durch Knoten. Hearts of Iron lebt von seinem Fokusbaum; hier ist er Datenmüll.
2. **Medien › Zeitung (040):** leerer Kasten mit einem Satz. Die Zeitung ist das Druckbild des Spiels und hätte ihren eigenen Auftritt verdient.
3. **Opposition & Straße (023):** leer, dazu ein eigener, fetter Kastenreiter.
4. **Schreibtisch › Verlauf (002):** drei Überschriften, kursiver Kleindruck, kein Kopf, kein Bild; anders gebaut als jede andere Akte.
5. **Parlament › Tagesordnung (006):** ein Satz, ein Knopf, 300 px Leere.
6. **Haushaltsrad (017):** sieben bunte Tabellenfarben (`wirtschaft/HaushaltsRad.tsx:15`: `#00938f`, `#6e55a8`, `#2f6fb5` …) in einer Ledermappe.
7. **Bauleiste „Im Bau“ (025, 038):** acht Regenbogenfarben (`Reich.tsx:139`) über einer Liste mit Pfeil- und Pausenknöpfen.
8. **Streitkräfte (037):** Kacheln mit „100 %“ und Punktreihen, kein Panzer, kein Schiff, keine Front.
9. **Bilanz & Entwicklung (021):** flache Linien, Achsenbeschriftung in Kleinstschrift, darunter eine schreiende Versalienüberschrift.
10. **Kabinettstisch (012):** Beschriftungen überdecken einander, der Tisch ragt unten aus dem Bild. Die Idee ist gut, die Ausführung nicht.

Was wie eine Behördenseite wirkt: alle Lage-Reiter (011, 015, 024, 034, 036, 039, 041) mit „Lage: gemischt“, Knopf „… öffnen“, zwei Porträts und vier Textkacheln. Sie sind einheitlich (gut), aber sie sind Formulare. Was wie ein Spiel wirkt: Karte, Titel, Halbrund, Bildkarten, Baupläne, Zinsband, Gefahrenringe.

---

## 2. Befunde

Schwere: 1 = bricht Sinn oder Spiel, 2 = deutlich störend, 3 = Feinschliff.

| ID | Ort | Art | Befund | Warum es stört | Vorschlag | Schwere | Aufwand |
|---|---|---|---|---|---|---|---|
| H-01 | Alle Akten › Farben; `styles.css:7–32` und alle Stylesheets | Konsistenz | 1.374 verschiedene Hex-Werte und 611 rgba-Werte; 13 globale Tokens, daneben eigene Paletten je Ansicht (`--pd-*` 17, `--tr-*`, `--sd-*`, `--ba-*`, `--ak-*`). Allein die zehn häufigsten Brauntöne (`#5d4231`, `#5a4a38`, `#2e2118`, `#6b5338`, `#553828` …) sind kaum unterscheidbar. | Gleiches Papier und gleiche Tinte sehen in jeder Akte eine Spur anders aus; das Auge merkt es als „zusammengewürfelt“. | Ein Token-Satz (Abschnitt 5) in `styles.css`; Werkzeug, das Hex-Werte außerhalb `:root` meldet; Ansichtspaletten auf Tokens umbiegen. | 1 | groß |
| H-02 | Kaskade; `styles.css:61–67` (`.paper button, .dossier button {…}`), `akte/bauteile.css:6,17` | Konsistenz | Jeder Knopf in einer Akte bekommt global Verlauf, 4-px-Ecke und Schatten. Die drei Knopfstufen werden danach über eine Liste von 19 Klassennamen wieder darübergelegt. 454 `!important` halten das zusammen. Daher kamen auch die eckigen Kreise. | Jeder neue Knopf sieht zuerst falsch aus; jede Korrektur bricht anderswo etwas. | Globale `button`-Regel auf ein Zurücksetzen beschränken (`all: unset` plus Fokusring). Knopfaussehen nur über `<Knopf stufe="haupt|normal|leise|symbol">` mit eigener Klasse. Die Klassenlisten in `bauteile.css` entfallen dann. | 1 | mittel |
| H-03 | Schrift › Kleingrößen; 368× `11.5px`, 507× `12.5px` | Design | Rund 31 % aller Schriftangaben liegen unter 14 px, und das in EB Garamond, einer Buchschrift mit kleiner x-Höhe, die erst ab 15 bis 16 px gut liest. Der Rundgang meldet 11-px-Text in 022, 025 und 038. | Kleindruck auf Pergament ist mühsam; die Seiten wirken amtlich („Fußnotenstil“) und dicht. | Untergrenze 13 px für Zahlen und Einheiten, 15 px für jeden Satz. Die Leiter auf 7 Stufen kürzen (Abschnitt 5). | 2 | mittel |
| H-04 | Schrift › Familien; `main.tsx:5`, `styles.css:23–25`, `gueter/transport.css:22,25,38`, `art/Portraet.tsx:766` | Konsistenz | Inter wird geladen, obwohl „aus dem Spiel“; `--sans` ist nur noch ein zweiter Name für Garamond, sodass `var(--sans, Inter, sans-serif)` an 5 Stellen in die Irre führt. Transport setzt Georgia fest. Im Porträt-SVG steht „Inter“, ein Name, der gar nicht geladen ist. | Unnötige Ladezeit; Leser des Codes glauben an eine serifenlose Schrift, die nicht kommt; Transport hat eine fremde Schrift. | Inter-Import entfernen, `--sans` streichen, Georgia ersetzen durch `var(--serif)`, die SVG-Schrift durch `var(--kapitaelchen)`. | 3 | klein |
| H-05 | Akte › Kopf (z. B. 007, 012, 016) | Design | Ein Aktenkopf mischt fünf Stimmen: Titelleiste in Marcellus SC, Kicker in roter Courier Prime mit weiter Laufweite („GESETZGEBUNG & PARLAMENTARISCHE KONTROLLE“), Titel in Fraunces, Kachelköpfe in Marcellus, Untertext in Garamond kursiv. Dazu kommt der Datumsstempel „5. JUNI 2028“ in Schreibmaschine, und das Datum steht drei Mal auf dem Schirm. | Unruhig. Courier wirkt wie eine Behördenakte, nicht wie ein Staatsspiel. | Courier Prime nur für die Zeitung und echte Stempel. Kicker in Marcellus SC 13 px Siegelrot, Datum aus dem Aktenkopf streichen (es steht in der Kopfleiste). | 2 | klein |
| H-06 | Navigation › Reiter (003, 007, 019, 023, 028) | Konsistenz | Fünf Reitersorten: (a) Titelleistenreiter in Schreibtisch und Politik, (b) Lederaktenreiter mit „Einordnung rechts“ in allen Fachakten, (c) leise Kapitälchen-Unterreiter (Justiz, Verwaltung), (d) Kastenknöpfe als Unterreiter (Zentralbank: „Nächste Zinssitzung | Führung und Gesetz …“), (e) fette graue Kastenreiter (Opposition: „Lage | Opposition | Straße | Rathäuser“) und (f) große Serifenreiter in Katastrophen („Lage und Vorsorge | Laufende Fälle …“). In 028 stehen drei Reiterebenen übereinander. | Der Spieler weiß nicht, auf welcher Ebene er ist; Regel 3 „zwei Navigationsebenen“ ist gebrochen. | Genau zwei Reitersorten: Aktenreiter (Leder) und Unterreiter (Kapitälchen auf Messinglinie). Schreibtisch und Politik auf denselben Aktenrahmen. Katastrophen, Opposition und Zentralbank auf den Unterreiter; vierte Ebenen werden Drill-down. | 1 | mittel |
| H-07 | Kennzahlen (007, 012, 016, 029, 036) | Konsistenz | Drei Kachelsorten für dieselbe Aufgabe „Zahl mit Beschriftung“: Kopfkachel (Marcellus, mit Messring), Rahmenkachel mit VERSALIEN-Kopf („TERMINE (30 TAGE)“, 012), Großkachel mit Linie links (016 „Armutsbelastung 43 / 100“), dazu die Weltlage-Großkacheln (036). Indizes erscheinen als „43 / 100“, „42,7 / 100“, „29,4“ und „32 /100“ mit Ring. | Gleiches sieht verschieden aus; „/ 100“ in drei Formen. | Ein Baustein `Kennzahl` (Wert, Einheit, Beschriftung, optional Ring, optional Veränderung). Indizes immer als ganze Zahl mit kleinem „/100“ und Ring. | 2 | mittel |
| H-08 | Farbbedeutung „gut“; Klassen `.gut`, `.plus`, `.ok` | Logik | „Gut“ hat 23 Farbwerte; die meisten sind Brauntöne wie der Lesetext (`#5d4231`, `#674a3a`), weil `--teal` zu Braun umgedeutet wurde (`styles.css:15`, Kommentar oben nennt noch „Petrol = Gemessenes“). Gleichzeitig sind Netze (026), Tachos und Kartenebenen in Grün, und Lagebalken in Braun. | Ein Spieler erkennt Schlechtes (rot), aber nie Gutes; Fortschritt fühlt sich nicht nach Erfolg an. Grün bedeutet in 026 „Reserve“ und im Parlament (007) „eigene Partei“. | Zwei Signalfarben fest: Siegelrot = schlecht oder knapp, Lorbeergrün `#4f6b3a` (heute schon 49 Mal da) = gut. Braun bleibt neutral. Parteifarben bekommen eigene Tokens und dürfen nie Signal sein. `--teal` umbenennen in `--tinte-weich`. | 1 | mittel |
| H-09 | Haushaltsrad 017; `wirtschaft/HaushaltsRad.tsx:15` | Design | Ausgabenfarben `#b23a26, #00938f, #d4a02a, #6e55a8, #e07b3c, #2f6fb5, #5f9b3a`: gesättigte Tabellenfarben, entgegen §7 „kein Grün, kein Blau für Flächen“. | Das zentrale Bild der Wirtschaft sieht aus wie ein Bürodiagramm. | Erdpalette in acht Tönen mit gleicher Helligkeitsstufe: Siegelrot, Ocker, Messing, Oliv, Schiefer, Pflaume, Terrakotta, Sand. | 2 | klein |
| H-10 | Bauleiste 025/038; `Reich.tsx:139` | Design | `BAU_FARBEN` mit Türkis, Grün und Violett, je Rang eine Farbe; die Farbe trägt keine Bedeutung. | Bunt ohne Sinn („nur Schau“). | Ein Ton (Messing) mit Abstufung nach Rang, oder Farbe nach Bereich (Militär, Infrastruktur, Kultur) mit Legende. | 2 | klein |
| H-11 | Akte › Kopfbild; `akte/akte.css:210`, `akte/Akte.tsx:114` | Design | Die Kupferstich-Zeichnung des Bereichs liegt mit Deckkraft 0,55 hinter den Kennzahlkacheln und ist fast ganz verdeckt (in jedem Rundgangsbild nur als Geisterbild, etwa die Flagge über „Unabhängige Justiz“). | Das einzige Bild der Akte ist Dekoration, die man nicht sieht. | Entweder Kopfbild links groß zeigen und Kennzahlen darunter, oder streichen. Vorschlag: Kopf 160 px hoch, Bild rechts frei, Kennzahlen als Leiste darunter. | 2 | klein |
| H-12 | Preise; `akte/Zeichen.tsx:42` (nur in `GrosseZiele.tsx`, `Bildkarten.tsx` benutzt) | Konsistenz | Kosten erscheinen in mindestens vier Formen: Ressourcenzeichen mit Zahl (029), Messingchip „4 Kapital“ (001), rote Pille „4 Kapital“ (Ereignis), Text „2,1 Kapital · 28 Monate“ (026), Pillen „2 Kapital | 100 Baupunkte | 8 Monate“ (027). Über 20 Dateien bauen Kosten selbst. | Regel 4 „Preis am Regler“ verlangt, dass der Preis auf einen Blick lesbar ist; vier Formen verhindern das. | `Preis` überall: Schreibtisch, Ereignis, Kultur, Netze, Politik, Vorlagen, Wissen. | 1 | mittel |
| H-13 | Karten (Vorhaben, Vorlagen, Zusagen, Hilfen, Programme) | Konsistenz | Über 35 `…Karte`-Komponenten, zwei davon heißen gleich (`VorlageKarte` in `minister/` und `reich/`). Jede hat eigene Abstände, Kopfzeilen und Knöpfe. | „Sieht wieder alles verschieden aus“: Die wichtigste Einheit des Spiels, die Entscheidungskarte, hat keine feste Form. | Ein Baustein `Entscheidungskarte` mit Fächern: Bild (optional), Kicker, Titel, Zustand, Preis, Wirkung (Pfeilzeilen), Kehrseite (eine Zeile), Aktionen. `entscheidungen/EntscheidungsKarte.tsx` gibt es schon als Keim. | 1 | groß |
| H-14 | `ui/bausteine/` | Konsistenz | Vier fertige Bausteine sind unbenutzt (`Tacho.tsx`, `Seitenfenster.tsx`, `Kreisfeld.tsx`, `Erklaer.tsx`). Daneben gibt es eigene Ringe in `akte/Akte.tsx:43` (Messring), `katastrophe/Lage.tsx:108` und `infrastruktur/Netze.tsx:29`, eigene Halbrunde in `wahl/Wahlabend.tsx:52` neben `parlament/Halbrund.tsx`. | Vier Ringe, die sich in Strichstärke und Beschriftung unterscheiden (vgl. 026 gegen 028 gegen Kopfkacheln). | Ein `Ring` (Anteil, Ton, Mitte) und ein `Halbrund`; die örtlichen Fassungen löschen. Tacho und Seitenfenster einsetzen oder löschen. | 2 | mittel |
| H-15 | Akteninneres › Kopfblöcke (016, 018, 033) | Konsistenz | Vier Kopfstile innerhalb des Blatts: dunkler Lederblock (Krisenrat, Versorgung), Kicker plus Fraunces-Titel (Umsetzung, Programme), Kapitälchenüberschrift mit Linie (Konfliktlage), Fraunces-Versalien in Rot („WIRKUNGSBERICHTE“, 021). | Unruhe; Lederblöcke im Papier wirken wie eingeklebte Fremdseiten. | Eine Blattüberschrift: Kicker (Marcellus 13 px Siegelrot) plus Titel (Fraunces 28 px Tinte), darunter höchstens ein Satz. Leder nur außen. | 2 | klein |
| H-16 | Bildsprache quer | Design | Sieben Bildstile: (1) Tuschezeichnung `art/Vignette.tsx` (Wahlabend, Aktenkopf), (2) flache Geometrie `ereignis/Szenen.tsx` (Ereigniskopf), (3) Prolog-Landschaften `prolog/Szenen.tsx`, (4) gemalte Silhouetten im Gegenlicht `reich/WunderBild.tsx` mit Baustelle und Bauplan, (5) glänzende 3D-Renderbilder `public/ui/*.png` (Kompass, Medaillons, Siegel), (6) Vektorporträts `art/Portraet.tsx`, (7) Scherenschnitte `art/Cameo.tsx`. Die Strichikonen (`icons.tsx`, `politik/embleme.tsx`, `akte/Zeichen.tsx`, `wissen/symbole.tsx`) sind dagegen einheitlich (24er-Raster, Strich 1,55 bis 1,8): gut, bleibt so. | Das Auge springt zwischen Kupferstich, Clip-Art und 3D-Glanz. | Zwei Stile festlegen. Szenen: Tusche auf Pergament (Stil 1 und 3), Ereignisköpfe darin neu zeichnen. Bauwerke: WunderBild (Entwurf, Bau, fertig), das hat eine klare Logik. Die 3D-PNG durch flache SVG-Medaillons in Messing ersetzen. | 2 | groß |
| H-17 | Kopfleiste › Präsident; `kopf/Kopfleiste.tsx:68` | Design | Der Präsident erscheint als schwarzer Scherenschnitt (`Cameo`), obwohl der Spieler im Prolog sein Gesicht gebaut hat („So sieht dich das Land: Das Gesicht erscheint später im Amt“). Die Mentorin ist ebenfalls Scherenschnitt (005). Alle anderen Figuren tragen gezeichnete Gesichter. | Die wichtigste Figur des Spiels ist die einzige ohne Gesicht; das Prolog-Versprechen wird nicht gehalten. | In der Kopfleiste das `Portraet` des Spielers mit seinen Prolog-Merkmalen zeigen; `Cameo` nur noch für Unbekannte oder ganz streichen. | 1 | klein |
| H-18 | Porträts; `public/ui/portraits/portraits.json` | Design | Das Manifest für gemalte Bildnisse ist leer, alle Figuren nutzen den gezeichneten Rückfall. Die Gesichter sind sich sehr ähnlich (Topfschnitt, dieselbe Kopfform, rosige Haut), die Augen wirken oft leer (Ereignis `fenster0.png`). Vermutung: Bei „Orhan Yalçın“ (männlicher Vorname) zeigt das Ereignisfenster ein eher weibliches Gesicht mit Pagenschnitt; Geschlecht prüfen. | Suzerain lebt von Gesichtern; hier erkennt man Minister nur am Namen. | Kurzfristig: Mienen stärker spreizen, Augen mit Glanzpunkt, Hautton und Kopfform stärker streuen. Langfristig: 20 bis 40 gemalte Bildnisse für Hauptfiguren (Weg ist vorbereitet, `art/portraet-bilder.ts`). | 2 | mittel |
| H-19 | Ereigniskopf; `ereignis/Szenen.tsx:1–11` | Design | Flache Rechtecke und Dreiecke (Waage, Säulen, Bücherstapel) in Ocker und Tinte, dazu ein Türkis `#2f5d62`. | Der Moment, in dem das Spiel erzählt, hat sein einfachstes Bild. | Ereignisköpfe im Stil von `Vignette.tsx` (Schraffur, Linienstärken, Himmel) neu zeichnen; je Thema ein Motiv. | 2 | groß |
| H-20 | Leere Zustände (002, 006, 008, 018, 023, 040) | Sinn | Leere Kästen mit einem kursiven Satz; in 018 drei Kennzahlen mit „—“. | Eine Akte, die nichts zeigt, sieht kaputt aus. | Leerer Zustand als Baustein: kleine Zeichnung, ein Satz, ein Knopf zur zuständigen Stelle. Kennzahlen ohne Wert ausblenden statt „—“. | 2 | klein |
| H-21 | Fokusbaum 030 | Design | Knoten 70 px breit, Titel werden mitten im Wort abgeschnitten, Verbindungslinien laufen durch Knoten, Bereichsbänder ragen rechts aus dem Bild. | Unlesbar, wirkt kaputt. | Knoten 160 px mit zwei Zeilen und Symbol (`wissen/symbole.tsx`), Spalten je Bereich mit Kopf, rechtwinklige Linien; Zoom auf einen Bereich als Standard. | 1 | mittel |
| H-22 | Ton; `ton/ton.ts:69–88`, `Stage.tsx:209` | Design | Nur vier Sinustöne für Meldungen. Kein Klickton, kein Ton beim Beschluss (Stempel), keine Musik, kein Klang bei Wahlsieg oder fertigem Wunder. | Ein Spiel ohne Klang wirkt wie eine Anwendung. | Fünf kurze Klänge (Klick, Stempel, Seite, Fanfare, Glocke) und eine ruhige Musikschleife fürs Titelbild und den Wahlabend, beides abschaltbar. Freie Lizenzen (CC0) oder synthetisch wie heute. | 2 | mittel |
| H-23 | Rückmeldung beim Klick | Design | 9 `:active`-Regeln bei 217 `:hover`. Nur die Haupt- und Normalknöpfe heben sich beim Darüberfahren (`akte/bauteile.css:11,21`). | Klicks fühlen sich taub an. | Gemeinsamer Druckzustand: `transform: translateY(1px)`, Schatten weg, 80 ms. Beim Beschluss ein Siegelabdruck (es gibt schon die Stempel-Animation `umb-stempel`, `wahl/wahl.css:187`). | 3 | klein |
| H-24 | Feiern | Design | Gut gelöst: Wunderfeier mit Kamera, Sonne, Glanz und Funken (`reich/wunder.css:7–91`); Umbildung mit Stempel (`wahl/wahl.css:186–189`). Es fehlen: Gesetz beschlossen, Fokus fertig, Technologie fertig, Ziel erreicht. | Nur ein Moment je Amtszeit wird gefeiert. | Ein kleiner gemeinsamer Moment (Stempel plus Klang, 1,2 s) für jede Fertigstellung; das große Fenster bleibt den Wundern und Wahlen. | 2 | mittel |
| H-25 | 3D-Karte › Marken (`karte3d.png`) | Design | Fast jede Provinz trägt ein gelbes Warndreieck und eine Zahl; die Beschriftungen überdecken sich mit den Meeresnamen („PONTISCHES GEBIRGE“ läuft durch Trabzon). | Warnungen ohne Rangfolge sind Rauschen. | Warnzeichen nur für die drei dringendsten Provinzen; Zahlen erst ab einer Zoomstufe; Gebirgsnamen unter die Marken legen. | 2 | mittel |
| H-26 | 2D-Ersatzkarte (`karte_de.png`) | Design | Gleichfarbige Polygone ohne Städte, Werte oder Relief; großer, leerer Raum. | Auf Geräten ohne 3D-Grafik wirkt das Spiel unfertig; der Rundgang lief vollständig vor dieser Fassung. | Provinzen nach Kartenebene färben, Hauptstädte als Punkte mit Namen, eine Schraffur fürs Gelände. | 2 | mittel |
| H-27 | Großbuchstaben und Laufweite | Design | 266 `text-transform: uppercase`, 58 Laufweiten. Chips „TRANSPARENTE AUSSCHREIBUNG“, „FRIST IN 45 TAGEN“, Kachelköpfe „GLAUBWÜRDIGKEIT“ schreien in VERSALIEN neben Kapitälchen von Marcellus. | Zwei Arten von Großschrift nebeneinander; Versalien in Garamond mit Laufweite sehen gebastelt aus. | Großschrift nur über Marcellus SC (echte Kapitälchen), nie per `uppercase` auf Garamond. Laufweite in drei Werten: 0, 0,04 em, 0,1 em. | 3 | klein |
| H-28 | Zeilenlänge (016, 017, 001) | Design | Absätze laufen über die ganze Blattbreite, bis etwa 160 Zeichen je Zeile („Politischer Tiefstand: 0 von 6 Monaten. Unter 25 % …“). Nur 25 Regeln begrenzen auf `ch`. | Lange Zeilen ermüden; das Auge findet den Zeilenanfang nicht. | Jeder Fließtext `max-width: 68ch`. | 3 | klein |
| H-29 | Ungenutzte Bilddateien; `public/ui/` | Funktion | `plakette.png`, `rahmen-portraet.png`, `medaillon-rot.png`, `medaillon-blau.png` sind nirgends verwendet. | Ballast; deutet auf abgebrochene Bildlinie. | Löschen oder (besser) durch SVG ersetzen, siehe H-16. | 3 | klein |
| H-30 | Kabinettstisch 012 | Design | Namen und Ämter überlappen sich („Burak Aydın / erkehr und Infrast…“, „Hakan Gök / Arbeit und Sozialp…“), der Tisch ist nach unten abgeschnitten. | Die Idee des runden Tisches geht in Beschriftungssalat unter. | Ämter als Symbol am Porträt, Name darunter in 13 px, Halbkreis höher setzen, Tisch ganz im Bild. | 2 | mittel |
| H-31 | Militär 037 | Sinn | Streitkräfte ohne ein Bild einer Waffengattung und ohne Kartenbezug; nur Zahlen, Punktreihen, Pfeile. | Vorbild Hearts of Iron: Die Karte ist die Bühne des Militärs; hier ist es ein Tabellenblatt. | Je Gattung ein Bildmotiv im WunderBild-Stil (Panzer, Jet, Fregatte, Rakete) und ein Knopf „Auf der Karte zeigen“ mit Standorten. | 2 | groß |
| H-32 | Kultur 027 | Sinn | Kulturstätten ohne jedes Bild, obwohl Hasankeyf, Antakya und Thyatira stark bebilderbar sind. | Kulturerbe ohne Anblick erzeugt keinen Wunsch, es zu retten. | `WunderBild`-Silhouette je Stätte, Zustand als Verfall (Risse, fehlende Kuppel) gezeichnet. | 2 | mittel |
| H-33 | Fest verdrahtete Wörter in der Oberfläche | Übersetzung | `sim/spiel.ts:103` („Normal“, „Das Spiel, wie es gemeint ist.“, im englischen Amtsantritt sichtbar), `reich/Neues.tsx:18–20` („Wunder“, „Großprojekte“ …), `reich/Schaetzblatt.tsx:42–43` („Noch nicht verhandelt“, „Veto“ …), `reich/WunderBild.tsx:344` („Bauplan des Bauwerks“, „Baustelle, … Prozent fertig“), `wahl/Wahlabend.tsx:294` („ja“/„nein“ in einen übersetzten Satz). | Englisch und Türkisch zeigen deutsche Reste. | In Kataloge verlegen (siehe Wortprüfung). | 2 | klein |

---

## 3. Wortprüfung (nur Funde mit Gestaltungsbezug; Bereichsprüfer prüfen die Texte im Einzelnen)

- `kp.lead` (`i18n/katalog/de/krisenpaket.json:4`): „Entlaste Haushalte, benenne die Finanzierung und organisiere die Stimmen.“ → „Entlasten Sie die Haushalte, nennen Sie die Finanzierung und sichern Sie die Stimmen.“ (Du-Rest; Prolog und Mentorin duzen laut ENTSCHEIDUNGEN U bewusst, dieser Text nicht.)
- Schwierigkeitsgrade in `sim/spiel.ts:103`: „Entspannt / Normal / Hart“ und „Das Spiel, wie es gemeint ist.“ → Katalogschlüssel `spiel.stufe.normal.name` und `spiel.stufe.normal.text` mit en „Normal / The game as intended.“ und tr „Normal / Oyunun tasarlandığı gibi.“
- `reich/Neues.tsx:18`: „Wunder“, „Großprojekte“, „Themenrouten“ und ihre Sätze → Katalog `reich.arten.*` (dreisprachig).
- `reich/Schaetzblatt.tsx:42–43`: „offen / zugesagt / Veto / Umweg“ und die Titel → Katalog `reich.transit.*`.
- `reich/WunderBild.tsx:344`: „Bauplan des Bauwerks“, „Baustelle, {n} Prozent fertig“, „Gemalte Ansicht des Bauwerks“ → Katalog `reich.bild.*` (Vorlesetexte).
- `wahl/Wahlabend.tsx:294`: `gewonnen: ergebnis.gewonnen ? "ja" : "nein"` → zwei Schlüssel `wahl.ui.urteil_text_sieg` und `wahl.ui.urteil_text_niederlage`.
- 005 „100 % des Ausgangs“ (Riesenzahl im Wirkungsnetz) → benannter Zustand „Unverändert“ als Titelzahl, die Prozentangabe klein darunter (Regel 5; die Wortwahl liegt bei Prüfer Politik).
- 019 „Stufe B · Formell unabhängig“ → „Formell unabhängig“ (internes Kürzel „Stufe B“ weg).
- 041 und Medienkopf „Pressefreiheit 29,4“ → „29“ (Indizes ohne Komma); ebenso 016 „42,7 / 100“, „44,2 / 100“, „74,3 / 100“ → „43“, „44“, „74“.
- 021 „WIRKUNGSBERICHTE“ (per `uppercase`) → „Wirkungsberichte“ in normaler Blattüberschrift.
- 007 „Lager, Mehrheit steht“ und „Lager 347, geduldet 0, Mehrheit ab 301“: drei Wörter für dieselbe Zahl („Lager“, „Regierungsmehrheit“, „Mehrheit (mit Duldung)“) → überall „Regierungslager“.

---

## 4. Die fünf wichtigsten Verbesserungen

### 1. Eine Bausteinschicht, die alle benutzen müssen (löst H-02, H-06, H-07, H-12, H-13, H-14, H-15)

Heute wird Einheitlichkeit nachträglich mit Klassenlisten und `!important` erzwungen. Besser: `ui/bausteine/` wird die einzige Quelle für Knopf, Reiter, Kennzahl, Ring, Halbrund, Preis, Chip, Entscheidungskarte, Leerzustand und Blattkopf. Ansichten dürfen Layout bestimmen, aber keine eigene Farbe, Schrift oder Rundung. Eine Prüfung im Test (wie `e2e/gesamtbild.mjs`) zählt Hex-Werte und Schriftgrößen außerhalb der Tokens und schlägt fehl, wenn die Zahl steigt.

```
Entscheidungskarte (ein Baustein für Vorlage, Vorhaben, Zusage, Hilfe, Ereignisantwort)
+--------------------------------------------------+
| [Bild 16:6, optional]              [ZUSTAND]     |
| KICKER (Marcellus 13, Siegelrot)                 |
| Titel (Fraunces 21)                              |
| [Kapital 4] [Bau 300] [Zeit 20 Mon.]  <- Preis   |
| ▲ Wirkung +1,5      ▲ Wirkung +0,5               |
| ▼ Kehrseite in einer Zeile                       |
| [ Hauptknopf ]  Leiser Knopf                     |
+--------------------------------------------------+
```

### 2. Farbe mit Bedeutung: zwei Signale, eine Erdpalette (H-01, H-08, H-09, H-10)

Siegelrot heißt schlecht oder knapp, Lorbeergrün heißt gut, Messing heißt Achtung, Braun ist neutral. Diagramme bekommen eine Erdpalette mit acht Tönen. Parteifarben stehen getrennt und tauchen nie als Signal auf. Wirkung: Der Spieler sieht Erfolge auf einen Blick, und Haushaltsrad und Bauleiste gehören zur selben Welt wie das Pergament.

```
Lagebalken heute:   [████░░░] braun   [██░░░░░] rot
Lagebalken künftig: [████░░░] grün    [██░░░░░] rot   [███░░░░] messing
```

### 3. Jede Möglichkeit bekommt ein Bild (H-16, H-19, H-31, H-32, H-21)

Der Bildkartenstil (029, 031) wird zur Regel für Vorhaben, Kulturstätten, Waffengattungen, Fokusknoten und Technologien. Szenen und Ereignisköpfe werden als Tusche auf Pergament neu gezeichnet; die glänzenden 3D-PNG fallen weg. Wirkung: Civ-Gefühl („ich will das haben“), und die Akten hören auf, Tabellen zu sein.

```
Kultur heute:    Hasankeyf | Zustand ███░░ 15 | [Restaurieren]
Kultur künftig:  [Silhouette Hasankeyf, halb im Wasser, Risse]
                 Hasankeyf  VERFÄLLT   [Kapital 2][Bau 100][8 Mon.]
                 ▲ Nationale Identität +0,3      [ Restaurieren ]
```

### 4. Der Präsident hat ein Gesicht, und die Gesichter leben (H-17, H-18)

Das im Prolog gebaute Porträt steht in der Kopfleiste. Die Mienen ändern sich mit der Lage (Zustimmung unter 35: „besorgt“, Wahlsieg: „lächelnd“; die Mienen gibt es schon in `art/Portraet.tsx`). Die Hauptfiguren bekommen gemalte Bildnisse über das vorhandene Manifest. Wirkung: Suzerain-Gefühl, Personen statt Namen.

### 5. Klang und Momente (H-22, H-23, H-24)

Fünf Klänge: Klick (Papier), Beschluss (Stempel), Reiterwechsel (Seite), Fertigstellung (kurze Fanfare), Ereignis (Glocke). Dazu kommt eine Musikschleife für Titel und Wahlabend. Jede Fertigstellung (Gesetz, Fokus, Technologie, Ziel) bekommt einen Stempelmoment von 1,2 s auf der Karte an ihrem Ort. Wirkung: Jeder Klick hat Gewicht, die Simulation fühlt sich an.

---

## 5. Gestaltungsleitfaden (Vorschlag, an den alle Ansichten angeglichen werden)

### Schrift: drei Familien, sieben Größen

| Rolle | Familie | Größen | Schnitt | Regeln |
|---|---|---|---|---|
| Titel, große Zahlen | Fraunces Variable | 21 · 28 · 36 · 56 | 500 (Titel), 600 (Zahlen) | Ziffern `lnum tnum`; nie Versalien |
| Lesetext, Tabellen, Werte | EB Garamond Variable | 15 · 17 | 400, 600 für Hervorhebung | Fließtext 17 px, Zeilenhöhe 1,5, `max-width: 68ch`; Tabellenziffern `tnum` (heute global gesetzt, `styles.css:8`: gut) |
| Beschriftungen, Reiter, Knöpfe, Kicker | Marcellus SC | 13 · 15 | 400 (nur diesen Schnitt laden und benutzen) | einzige Großschrift; Laufweite 0,04 em, Kicker 0,1 em |
| entfällt | Courier Prime | – | – | nur Zeitung und Siegelstempel |
| entfällt | Inter, Georgia | – | – | Import löschen |

Untergrenze: 13 px nur für Zahlen, Einheiten und Achsen; jeder Satz mindestens 15 px. Schnitte nur 400, 500 und 600.

Vorbildvergleich: Suzerain und Democracy 4 setzen Fließtext in 16 bis 18 px; Civ 6 nutzt eine kräftige Titelschrift und eine klare Textschrift. Fraunces plus Garamond trägt den Charakter eines Staatsarchivs. Das passt, solange Garamond nie unter 15 px läuft.

### Farben (Tokens in `styles.css`, sonst nirgends ein Hex-Wert)

| Token | Wert | Bedeutung |
|---|---|---|
| `--papier-1/2/3` | `#fffdf7` · `#f7f0de` · `#efe4cb` | Karte · Blatt · Schatten im Blatt |
| `--linie` | `#dccdab` | Kanten, Trenner |
| `--tinte-1/2/3` | `#2a1f18` · `#5a4a38` · `#7d6b55` | Text · Nebentext · leise (Kontrast ≥ 4,5:1 auf Papier prüfen) |
| `--leder-1/2` | `#3a2418` · `#5a3722` | Rahmen, Hauptknopf |
| `--messing-1/2/3` | `#f1d58f` · `#c69a4a` · `#7c5823` | Kanten, Achtung, Auszeichnung |
| `--siegel` | `#8e2a22` | schlecht, knapp, Beschluss, aktiver Reiter |
| `--lorbeer` | `#4f6b3a` | gut, Fortschritt, erfüllt |
| `--daten-1…8` | Siegelrot, Ocker `#b8893a`, Oliv `#6f7a3a`, Schiefer `#4a5a6a`, Pflaume `#6b4a6a`, Terrakotta `#b0704a`, Sand `#cdb48a`, Tinte `#5a4a38` | Diagramme ohne Wertung (Haushalt, Bau) |
| `--partei-*` | je Partei ein Wert | nur Halbrund, Chips, Karte |

Dunkle Flächen (Leder) nur als Rahmen, Kopfleiste, Seitenleiste und Titelbild, nie als Block im Blatt. So passen Pergament und Leder zusammen: Leder fasst, Papier trägt.

### Abstände, Rundungen, Schatten

- Raster 4 px. Abstände 4 · 8 · 12 · 16 · 24 · 32 · 48.
- Rundungen: 4 px für Knopf und Chip, 10 px für Karte, rund für Ring und Porträt, Pille für Filterchips.
- Drei Schatten: `--schatten-flach` (Karte im Blatt), `--schatten-hoch` (Karte beim Darüberfahren), `--schatten-fenster` (Akte, Ereignis).

### Bausteine (je einer, alle in `ui/bausteine/`)

| Baustein | Form | ersetzt |
|---|---|---|
| `Knopf` | haupt (Leder), normal (Pergament mit Messingrand), leise (Schrift), symbol (rund 32 px), schließen (rotes Rund) | 138 Knopfklassen |
| `Reiter` | Aktenreiter (Leder) und Unterreiter (Kapitälchen auf Messinglinie); keine dritte Sorte | 6 Reitersorten |
| `Blattkopf` | Kicker plus Titel plus ein Satz | Lederblöcke, Versalienüberschriften |
| `Kennzahl` | Wert, Einheit, Beschriftung, optional Ring und Veränderung | 3 Kachelsorten |
| `Ring`, `Halbrund`, `Tacho`, `Lageleiste` | je einer | 4 Ringe, 2 Halbrunde |
| `Preis` | Ressourcenzeichen plus Zahl (heute `akte/Zeichen.tsx`) | 4 Kostenformen |
| `Zustand` | Stempel: möglich, gesperrt, im Bau, fertig, verfällt | Versalienchips |
| `Entscheidungskarte` | siehe Abschnitt 4.1 | über 35 Karten |
| `Leerzustand` | Zeichnung, Satz, Knopf zur zuständigen Stelle | leere Kästen |
| `PersonChip` | Porträt 40 px, Name, Amt; Klick öffnet die Person | lose Porträtreihen |

### Bildsprache

- **Szenen** (Ereignis, Aktenkopf, Wahlabend, Prolog): Tusche auf Pergament mit Schraffur, warmer Himmel, Siegelrot nur als Akzent (Flagge, Siegel). Grundlage `art/Vignette.tsx`.
- **Dinge** (Vorhaben, Wunder, Stätten, Waffen, Technologien): WunderBild-Silhouette im Gegenlicht mit drei Zuständen (Bauplan, Baustelle, fertig). Für Verfall ein vierter Zustand.
- **Personen**: Porträt im Messingoval, Mienen nach Lage; Scherenschnitt entfällt.
- **Zeichen**: Strichikonen im 24er-Raster mit Strich 1,6 (bleibt).
- **Verboten**: glänzende 3D-Renderbilder, gesättigte Bürofarben, Fotos.

### Bewegung und Klang

- Darüberfahren 150 ms Anheben, Drücken 80 ms Absenken, Reiterwechsel 200 ms Überblenden.
- Fertigstellung: Stempel 1,2 s mit Klang; Wunder und Wahl: großes Fenster (gibt es schon).
- Effektstufen Hoch, Mittel, Aus bleiben (`anim/effekte.ts`: gut gelöst, achtet auf „Bewegung reduzieren“).

---

## 6. Was gut ist und bleiben soll

- Die Grundidee „Leder fasst, Papier trägt, Siegelrot entscheidet“ (`styles.css:1–5`).
- Die 3D-Karte, das Titelbild, die Bildkarten der Vorhaben, das Halbrund, die Baupläne der Großen Ziele, die Wunderfeier.
- Tabellenziffern global (`styles.css:8`); Schriftgrößen liegen zu 94 % auf der beschlossenen Leiter.
- Einheitliche Strichikonen über vier Dateien.
- Die Lage-Reiter sind wenigstens gleich gebaut; ihnen fehlt nur ein Bild.
- Die Musterseite `muster.html` als lebender Leitfaden.

## 7. Was ich nicht prüfen konnte

- Die 3D-Karte nur mit Software-Grafik (SwiftShader) und nur in einer Aufnahme; eine Aufnahme mit Klick auf eine Provinz lief in eine Zeitüberschreitung. Leistung, Animationen der Karte und Jahreszeiten habe ich nicht gesehen.
- Wahlabend, Wunderfeier, Kriegsansicht und Zeitung mit Ausgabe nur im Code, nicht im laufenden Spiel (erreichbar erst nach Monaten Spielzeit).
- Klang nicht gehört (kopfloser Browser); nur der Code ist geprüft.
- Kontrastwerte habe ich nicht selbst gemessen; ich verlasse mich auf die Messung in `rundgang/bericht.md` (nur ein Fund unter 4,5:1).
- Handybreite (390 px) nicht geprüft.
- Die Zählungen erfassen CSS-Dateien und Hex-Werte im TSX, nicht berechnete Farben in Canvas oder WebGL.
