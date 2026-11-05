# Plan Oberfläche: jede Seite, jeder Klick (5. November 2026)

Auftrag des Projektinhabers: „Mach eine Liste mit jeder einzelnen Seite … jedem einzelnen Klick, und hinterfrag den Klick, hinterfrag die Seite, hinterfrag, wie man es besser machen kann, wie man es mehr wie ein Spiel machen kann. Und erstelle erstmal einen Plan, wo was wie hinkommt.“ Grundlage: ein Rundgang durch das laufende Spiel (3. Februar 2030, Laptop 1440×900), 123 Bildschirmfotos, gemessene Seitenlängen, vier unabhängige Prüfungen. Die Einzelkritik jeder Seite steht in [dokumentation/rundgang_2026-11-05/](dokumentation/rundgang_2026-11-05/) (kritik-A bis kritik-D, Urteilstabelle `urteile.md`). Richtung: ENTSCHEIDUNGEN V; Entscheidungen des Projektinhabers: ENTSCHEIDUNGEN W. **Der Detailplan mit jeder Ansicht, jedem Klick, Datenquellen, Arbeitspaketen und offenen Fragen: [PLAN_OBERFLAECHE_DETAIL_2026-11-05.md](PLAN_OBERFLAECHE_DETAIL_2026-11-05.md).**

## 1. Befund in Zahlen

- **88 Bildschirme beurteilt, 9 passen.** 53 sind missverständlich, 51 doppelt (stehen schon anderswo), 26 fast leer, 25 zu lang, 20 sinnlos, 17 zu kompliziert, 14 unschön.
- **65 Aktenseiten in 11 Bereichen**, bis zu vier Reiterebenen übereinander (Akte → Reiter → Unterreiter → Filter). Civilization hat eine.
- **Zu lang:** Ministerrat 12.783 px (17 Bildschirme, 106 Knöpfe), Zentralbank 4.798, Verfassung 4.270, Wählerkoalition 4.086, Fraktionen 3.833, Katastrophen 3.596, Vorschläge 3.159.
- **Fast leer:** in jedem Bereich dieselben Pflichtreiter „Lage“ (ein Satz und ein Knopf zum Nachbarreiter), „Behörden“ (eine Karte), „Bilanz“ (16 Wörter, überall dieselbe Zustimmungskurve auf einer Achse 50–52) und „Personen“ (ein bis drei Karten ohne Knopf). Rund 40 Seiten.
- **Doppelt und dreifach:** derselbe Ministerfall im Schreibtisch, im Parlament und im Ministerrat; Ministervorschläge in Politik, Ministerrat und Schreibtisch; Wirkungsberichte in Chronik, Berichte und Umsetzung; die Baureihenfolge mit Kampfjets in Justiz, Verwaltung, Infrastruktur und Kultur; Erdbeben und Wiederaufbau an vier Stellen.
- **Eine Zahl, viele Werte:** Zustimmung 50 / 50,2 / 54 / 54,2; Haftanstalten 86 / 87 / 87,3 / 88; erwartete Ja-Stimmen 373 gegen 362; laufende Konflikte 2 im Kopf, 7 in der Liste; „Krieg läuft“ bei Phase „Spannung“.
- **Zwei Ordnungen des Landes:** links 11 Akten, in der Politik 15 Bereiche, im Kabinett 7 Ressorts. Bildung, Gesundheit, Soziales und Umwelt haben keinen Minister; der Wirtschaftsminister legt Vorlagen zu Migration und Luftreinhaltung vor, das Präsidialamt „besitzt“ den Renten- und Gesundheitsetat.
- **Zwei Wege zum Gesetz:** Maßnahmen mit Stufen („Als Gesetz einbringen“ in der Politik) und ein Gesetzeskatalog im Parlament, auf dem jede Kachel „Mehrheit steht“ sagt.
- **Die Karte ist keine Bühne:** Land, Außen und Sicherheit sind Orte, werden aber als Listen hinter einer Papierakte gezeigt, die die Karte verdeckt. Der Krieg wird in einer Textschublade geführt.

## 2. Leitsätze für jede Ansicht

1. **Eine Frage, ein Bild.** Jede Ansicht beantwortet zuerst die Frage des Spielers mit einem Bild (Rad, Kreisfeld, Halbrund, Karte, Tachos, Zeitleiste), darunter die Stellgrößen als Zeilen mit Regler; Preis und Wirkung erscheinen am Regler.
2. **Höchstens zwei Ebenen:** Bereich → Ansicht (zwei bis vier je Bereich). Keine Pflichtreiter. Was nur nachgelesen wird, klappt unter dem Bild auf.
3. **Drill-down statt Weiterleitung:** Ein Klick auf ein Stück eines Bildes öffnet dessen Inneres (Rad → Ministerium → Behörde; Halbrund → Partei; Karte → Provinz oder Land). Knöpfe, die nur den Nachbarreiter öffnen, entfallen.
4. **Eine Größe, ein Wert, eine Schreibweise:** ganze Zahlen, Einheit, Richtung (rot heißt schlechter). Wo Umfrage und Wahrheit sich unterscheiden, stehen beide benannt nebeneinander.
5. **Personen als Porträts im Zusammenhang**, klickbar (Gespräch, Akte); keine Personenseiten.
6. **Preis am Knopf statt Regeltext.** Erklärungen als ⓘ, nicht als Absatz.
7. **Nur zeigen, was etwas entscheidet.** Leere Bausteine (Monatsbericht mit Nullen, Wahlkampf ohne Wahlkampf, „Index 100“ fünfmal) bleiben weg.
8. **Karte als Bühne** für Land, Außen und Sicherheit: Die Akte wird dort ein Seitenfenster neben der Karte, nicht ein Papier über ihr.

## 3. Neue Struktur: aus 65 Aktenseiten werden 24 Ansichten

| Bereich | Heute | Neu (Ansichten) | Bild zuerst | Drill-down |
|---|---|---|---|---|
| **Schreibtisch** | 5 Reiter | **Eingang** (alle Entscheidungen: Ereignisse, Ministerfälle, Vorschläge, Fristen; schon umgebaut) · **Verlauf** (Chronik, Berichte, Beschlüsse als eine Zeitleiste) | Zustimmungskurve der Amtszeit mit Ereignispunkten (Tropico-Almanach) | Punkt → Bericht → „nachjustieren“ an der Maßnahme |
| Hauptmenü ≡ / Titel | — | Spielstand, Datei, Quellen und Lizenzen, KI | — | — |
| **Politik** | 3 Reiter | **Politik** (eine Seite) | 15 Bereichskreise: Größe = Betroffene, Farbe = Zustand, roter Ring = akutes Problem (Democracy 4) | Kreis → Maßnahmentafel (schon umgebaut) → Zeile → Wirkungsbild Ursache → Maßnahme → Wirkung; Vollnetz nur als Knopf |
| **Parlament** | 9 Reiter | **Halbrund** (Start) · **Tagesordnung** · **Justiz** · Verfassung als seltener Dialog | Halbrund mit 301-Linie | Parteiblock → Parteikarte (Vorsitz, will, Duldung/Koalition mit Preis); Gesetz → Ja-Balken an der 301-Linie |
| **Kabinett** | 7 Reiter | **Kabinettstisch** (Start) · **Verwaltung** | Ovaler Tisch mit Porträts: Ring = Loyalität, Abzeichen = offene Vorlagen, Blitz = Rücktrittsgefahr | Minister → Ministerakte mit **Ressortrad** (dasselbe Rad wie Haushalt Ebene 2), Befehle, Zusagen, Behörden |
| **Wirtschaft** | 7 Reiter | **Lage** · **Haushalt** · **Geld & Lira** · **Handel** | sechs Tachos mit Zielband; Haushaltsrad; Leitzins-Halbrund und Reservetank; Lieferkarte | Tacho → große Kurve mit Ereignismarken; **Rad → Ministerium → Behörde** (siehe 4.) |
| **Gesellschaft** | 7 Reiter | **Das Volk** · **Opposition & Straße** · Wahlkampf (nur ab acht Wochen vor der Wahl) | Kreisfeld der elf Wählergruppen von „gegen mich“ bis „für mich“, Fläche = Anteil, Farbe = Stimmung (Democracy 4); Rathauskarte | Gruppe → Seitenleiste: drei Ursachen, drei Wünsche mit Regler und Preis |
| **Land** | 9 Reiter | **Karte** (Start) · **Bauleiste** · **Katastrophen** | Türkei-Karte mit Baustellen, Großprojekt-Umrissen, Kulturstätten | Ort → Seitenkarte „Bauen / Instandsetzen / Restaurieren“; Bauleiste wie die Produktionsschlange in Civilization |
| **Forschung & Ziele** | 8 Reiter | **Bäume** (Fokus- und Technologiebaum umschaltbar) · **Vermächtnis** (Große Ziele und Programme) | Ikonenbaum im Vollbild | Knoten → Detail mit Chance und Voraussetzungen |
| **Außen** | 5 Reiter + 4 Unterreiter | **Welt** | Karte in der Linse Beziehungen im Weltausschnitt, Linien für Verträge und Konflikte | Land → Länderkarte: „Was sie wollen“ als Regler mit Preis, Verhandlungstisch darin |
| **Sicherheit** | 6 Reiter | **Lagekarte** · **Streitkräfte & Bau** | Hearts-of-Iron-Lage: Konfliktringe, im Krieg Front und Zielräume auf der Karte | Konflikt → Dossier; Zielraum → Einsatzart und Tempo in einer Leiste |
| **Medien** | 4 Reiter | **Medien** | zwei Titelseiten nebeneinander, Ring des Medienmarkts | Segment → Eigentümer und Handlungen |
| **Karte (überall)** | 15 Linsen | 8 Linsen als Symbolleiste, Grundlinse „Rückhalt“ | eingefärbt, mit Namen und Städten | Provinz → kompakte Provinzkarte mit Handlungen, neben der Provinz |

Wegfallen: Lage-, Behörden-, Bilanz- und Personenreiter aller Akten; Mehrheitslage, Gesetzesvorhaben als Katalog, Umsetzung, Handlungsfähigkeit, Ministerrat als Vorlagenliste, Gespräch als Reiter (wird ein schwebender Berater), Wirtschaftskabinett, Stimmung im Land, Gesellschaft im Wandel, Entwicklung des Landes, Fortschritt, Netze und Kultur als eigene Seiten (gehen in die Landkarte), Vorschläge als eigener Reiter (gehen in den Eingang und als Marke an die Maßnahme).

## 4. Der Haushalt als Beispiel für den Drill-down

1. **Gesamtrad** (heute): außen nach Ressorts, innen nach Steuern, schraffiert die neuen Schulden. Zinsen grau („nicht kürzbar“). Personal als eigenes, ehrlich benanntes Stück „Öffentlicher Dienst“, solange seine Aufteilung auf die Ressorts nicht belegt ist (heute steckt es in „Staat und Preise“ und wird doppelt gezählt; siehe 6.).
2. **Klick auf ein Stück → Ministeriumsrad:** Das Rad zoomt in das Stück. Oben der Minister (Bild, Loyalität, Wunsch), der Etat in Lira und % des BIP. Das Rad zeigt die Ausgabenarten des Ministeriums (Personal, Betrieb, Investitionen, Programme) und seine Behörden. Je Stück eine Zeile mit Regler zum Kürzen oder Aufstocken, Preis und Wirkung; die betroffenen Wählergruppen leuchten auf.
3. **Klick auf eine Behörde → Behördenkarte** (Ausbau, Kürzung). Damit entfallen alle Behördenreiter.
4. Dasselbe Ministeriumsrad öffnet sich vom **Kabinettstisch** aus (Minister → Ressort).

**Datenlücke:** Ausgaben je Ministerium und Ministerium × Ausgabenart für 2026 stehen noch nicht im Spiel. Quelle zu prüfen: Zentralhaushaltsgesetz 2026 (Merkezi Yönetim Bütçe Kanunu), Tabelle A nach Einrichtungen; ergänzend die funktionale Gliederung (COFOG). Bis dahin teilt das Ministeriumsrad nur nach vorhandenen Posten und sagt das sichtbar („Aufteilung nach Haushaltsposten; Unterteilung nach Ausgabenart folgt mit der Quelle“). Keine erfundenen Zahlen.

## 5. Zu entscheiden, bevor umgebaut wird

1. **Eine Ordnung des Landes.** Vorschlag: Das Kabinett bekommt die 17 Ministerien, die die Türkei seit 2018 hat (Justiz; Familie und Soziales; Arbeit und Sozialversicherung; Umwelt, Städtebau und Klima; Äußeres; Energie; Jugend und Sport; Finanzen; Inneres; Kultur und Tourismus; Bildung; Verteidigung; Gesundheit; Industrie und Technologie; Landwirtschaft und Forst; Handel; Verkehr und Infrastruktur). Die 15 Politikbereiche und die Haushaltsposten werden ihnen zugeordnet; die Akten der linken Leiste bleiben die Bühnen.
2. **Ein Weg zum Gesetz.** Vorschlag: Jedes Gesetz ist eine Maßnahme mit dem Weg „Gesetz“. Die Einträge des Gesetzeskatalogs werden benannte Fassungen (Bündel von Stufen) an den Maßnahmen; das Parlament zeigt nur die Tagesordnung.
3. **Karte als Bühne:** Land, Außen und Sicherheit öffnen als Seitenfenster neben der Karte statt als Papier über ihr.
4. **Kleinere Zuordnungen:** Rüstungsprojekte (Altay, Stahlkuppel, F-16, KAAN) gehören in die Bauleiste der Sicherheit, nicht in Forschung und Kultur; Programme bleiben als eigenes System im „Vermächtnis“ oder gehen in den Fokusbaum auf.

## 6. Sofort zu beheben (unabhängig vom Umbau)

| Fehler | Ort |
|---|---|
| Haushaltsrad zählt das Personal doppelt („Staat und Preise 33 %“) | ui/wirtschaft/HaushaltsRad.tsx, Posten `personal` |
| Katastrophen: mittlere Spalte überlappt die linke, Text bricht mitten im Wort ab, leere Scheinregler | Land › Katastrophen |
| Wirkungsnetz: Beschriftungen überdrucken sich, eine Spalte zeigt ein Wort pro Zeile | Politik › Wirkungsnetz, „Was folgt daraus?“ |
| Quellen kaum lesbar (Kontrast) | Schreibtisch › Quellen |
| Dritte Antwort im Ereignisfenster abgeschnitten, ohne Hinweis | Ereignisfenster |
| Tasten 1–4 doppelt belegt (Tempo und Kartenebene); Menü und Ebenenwechsel halten die Zeit nicht an | kopf/Kopfleiste.tsx, Kartenebenen |
| Linke Leiste verdeckt die erste Spalte des Ebenenmenüs; Provinzfenster verdeckt die Provinz | Karte |
| „Krieg läuft“ schon bei Phase „Spannung“ | militaer/Streitkraefte.tsx |
| „Laufende Konflikte 2“ im Kopf, 7 Zeilen in der Liste | Sicherheit |
| NATO „14 Mitglieder“ statt 32 | Außen, Blöcke |
| Bilanzkurven mit Achse 50–52 lassen 2 Punkte wie einen Absturz aussehen | alle Bilanzreiter (entfallen ohnehin) |
| „Stand der Dinge“ vergleicht mit dem Beginn der letzten Sitzung (immer ±0) | ui/standderdinge.ts |
| „Weitester Stand“ liegt vor dem aktuellen Stand | Spielstand |
| „Frist in 666 Tagen“ statt Monaten; Nachkommastellen in Zitaten | Vorschläge, Ministerfälle |
| „Was Sie jetzt in Auftrag geben können“ zeigt Vorhaben, die schon im Bau sind | Sicherheit › Beschaffung |
| Vorschlag auf Rang 1 mit null Wirkung | Politik › Vorschläge |
| „Lage: ruhig“ und „0 Netze überlastet“ neben 118 % Engpass | Land |
| Fokusbaum mit etwa 5 px Schrift | Forschung › Fokusbaum |
| Interne Kürzel im Text („(Z5)“), Rohdaten („2030-12-05“) | Wirtschaft, Gesellschaft |
| Erwartete Ja-Stimmen 373 gegen 362 (zwei Rechnungen) | Gesetzeskatalog gegen Fraktionen |

## 7. Reihenfolge

1. **Fehler aus 6.** (ein bis zwei Tage Arbeit, kein Entscheid nötig).
2. **Gerüst:** Pflichtreiter weg, Seiten zusammenlegen, höchstens zwei Ebenen; Spielstand und Quellen ins Menü (nach Entscheid 1–3).
3. **Bilder je Bereich:** Kreisfeld der Wähler, Halbrund als Start, Kabinettstisch, Wirtschaftstachos, Bereichskreise der Politik, Verlauf als Zeitleiste.
4. **Drill-downs:** Haushalt drei Ebenen und Ressortrad am Kabinettstisch, nach der Recherche der Ministeriumshaushalte 2026.
5. **Karte als Bühne:** acht Linsen, Provinzkarte, Welt- und Lagekarte, Krieg auf der Karte.
