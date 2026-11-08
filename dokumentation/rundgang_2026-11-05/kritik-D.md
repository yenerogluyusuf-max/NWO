# Kritik D: Außen, Sicherheit, Medien, Karte und globale Oberfläche

Grundlage: Bildschirmfotos 051–065, k00, k01, k-0 … k-v, m01, p01 (1440×900), seiten.json, gezielte Blicke in den Code (`ui/akte/Bereiche.tsx`, `ui/akte/Konfliktlage.tsx`, `ui/militaer/Streitkraefte.tsx`, `ui/kopf/Kopfleiste.tsx`, `ui/linsen/linsen.ts`, `ui/Stage.tsx`, `data/welt-institutionen.ts`). Höhenangaben aus seiten.json; ein Bildschirm zeigt etwa 759 px Akteninhalt.

---

### Außen › Weltlage (051.png, 051b.png)
- **Frage des Spielers:** „Wo brennt es in der Welt, und wer ist mir gut oder böse gesinnt?“ Das sieht man auf den ersten Blick nicht. Zuerst kommt ein Textkasten „Lage: angespannt“.
- **Urteil:** zu lang, doppelt, missverständlich
- **Befund:**
  - Die Seite ist 1804 px hoch (2,4 Bildschirme). Oben steht der Kasten „Lage: angespannt · Auffällig: Vertrauen der EU: 28“ mit dem Knopf „Länder und Diplomatie öffnen“. Dieser Knopf öffnet denselben Reiter, der 80 px darüber steht.
  - Die Kopfzahlen „Ansehen 46“ und „Vertrauen der EU 28“ stehen 300 px tiefer noch einmal als Kacheln. „Diaspora 44“ steht als Kachel und in 051b noch einmal als Balken. Dieselbe Zahl erscheint also bis zu dreimal auf einer Seite.
  - Die Kachel „Sicherheitslage 56 · 100 minus Terrorgefahr“ gehört zur Sicherheit. Der „Friedensprozess“ mit Stufen-Chips von „Kein Prozess“ bis „Rückkehr und Normalisierung“ ist Innenpolitik (PKK-Prozess) und steht hier falsch.
  - „Versorgungssicherheit 100“ ist eine flache Linie, direkt unter der Vorwarnung „Hormus ist geschlossen“. Der Spieler liest das als Widerspruch. Die Erklärung („andere Lieferanten füllen die Lücke zu höheren Preisen“) steht nur in der Vorwarnung. Den Preis sieht man nirgends als Zahl.
  - Die Unterreiter „Lage / Instrumente / Verlauf“ bilden eine dritte Reiterebene unter den Aktenreitern. „Verlauf“ wiederholt „Diplomatische Bilanz“.
  - „Die Staatsführungen“: 8 Porträtkarten (darunter die EU als Mann mit Porträt) mit je zwei Balken „Vertrauen“ und „Konflikt“, aber ohne Zahl. Die Karten sind nicht als Klickziel erkennbar. Das ist ein Beziehungsnetz, das als Kachelraster verschenkt wird.
- **Klicks:**
  - „Länder und Diplomatie öffnen“ führt zum Nachbarreiter und ist unnötig. Weg damit.
  - Die Unterreiter „Lage / Instrumente / Verlauf“ sind unnötig. Besser: Instrumente als Zeilen direkt unter dem Bild, Verlauf nur in der Bilanz.
  - Friedensprozess-Chips (6 Stufen) sind hier falsch verortet und gehören nach Sicherheit/Innere.
  - Porträts: unklar, ob klickbar. Besser so: Ein Klick öffnet die Länderkarte (wie 052).
- **Vorschlag:** Diese Seite auflösen. An ihre Stelle kommt die Karte mit der Linse „Beziehungen“ als Bühne, mit Weltausschnitt (USA, EU, Russland, China als Einschub). Darüber legt sich ein Beziehungsnetz: Kreise nach Gewicht des Landes, Farbe nach Haltung, rote Linie bei Konflikt, Goldlinie bei laufendem Vertrag. Die Vorwarnungen werden ein Ticker oben. Die drei Kopfzahlen bleiben, die Kacheln fallen weg. Energie, Flucht und Sanktionen werden je eine Zeile mit Zahl und Preis, ein Klick klappt sie auf. Friedensprozess und Terror wandern nach Sicherheit.

### Außen › Länder und Diplomatie (052.png, 052b.png)
- **Frage des Spielers:** „Was will dieses Land von mir, und was kann ich ihm geben?“ Die Antwort („Was Europäische Union von der Türkei will“) steht erst auf dem zweiten Bildschirm.
- **Urteil:** zu kompliziert, zu lang, doppelt, missverständlich
- **Befund:**
  - Die Seite hat 68 Knöpfe und 9 Unterreiter in zwei Ebenen: links „Staaten / Blöcke / Dienst / Vermittlung“, rechts „Überblick / Verhandlungstisch / Verträge / Gesten / ★ Beitritt“. Zusammen mit den Aktenreitern sind das vier Reiterebenen übereinander.
  - Links steht eine Länderliste als hohe Karten (je etwa 55 px) mit 7 Filterchips und einem Suchfeld. Die Liste ersetzt eine Karte, und die Karte im Hintergrund liegt ungenutzt darunter.
  - Der „Überblick“ der EU zeigt zuerst Wachstum 1,3, Inflation 3,2, Staatsschulden 65, Haushaltssaldo −2,2 und Rüstung 1,9 % BIP. Das sind Volkswirtschaftsdaten der Gegenseite, die der Spieler nicht steuert, und sie stehen ganz oben.
  - Widersprüche:
    - „Zum Vergleich (letzter Wert)“ nennt „Türkei 34,9 (2025)“ für die Inflation. Die Kopfleiste zeigt 19,2 % (Februar 2030).
    - Die EU-Inflation steht oben als 3,2 % und unten als 2,2 % (2025).
    - Zwei unterschiedliche Zahlen zur selben Größe auf einer Seite.
  - Der Text unter „Letzte Wahl“ („Die Führung in der EU wechselt bei der Europawahl …“) wiederholt sich wörtlich direkt darunter unter „Was sich zuletzt geändert hat · 1. Juli 2029 Machtwechsel“.
  - „Europawahl am 7. Juni 2034 — in 53 Monaten“ ist ein großer Kasten für ein Ereignis in viereinhalb Jahren.
  - Gut ist: „Was EU von der Türkei will“ mit Ist und Soll („Justizreform mindestens auf Stufe 55 (jetzt 35)“) und dem Link „ausweiten: Justizreform“. Das ist der Kern des Spiels, aber er liegt bei etwa 1000 px.
- **Klicks:**
  - Die oberen Knöpfe „Spannung mit Zypern — zum Dossier“ und „Spannung mit Israel — zum Dossier“ stehen auch in Sicherheit › Sicherheitslage (056). Das ist doppelt. Besser so: Konflikte als rote Marke auf der Karte.
  - Unterreiter „Dienst“ gibt es dreimal: hier, als „Behörden“ (053) und als „Diplomatie & Dienste“ (055). Zusammenlegen.
  - „Zum Verhandlungstisch“, „Verdeckte Optionen“ und „Zum EU-Rat der Mitgliedstaaten“ wiederholen Unterreiter. „Verdeckte Optionen im Wahlkampf ansehen →“ steht dazu ein zweites Mal. Pro Ziel soll es einen Weg geben.
  - Die Links „ausweiten: Justizreform“, „einschränken: Medienaufsicht“ und „ausweiten: Annäherung an die EU“ sind richtig und nötig. Sie sollen aber direkt einen Regler zeigen (mit Preis im Inland) und nicht in eine andere Akte springen.
  - Filterchips (7) und Suchfeld werden mit einer Karte überflüssig.
- **Vorschlag:** Klick auf ein Land in der Karte öffnet eine Länderkarte (seitlich, höchstens ein Bildschirm):
  1. Kopf: Flagge, Haltung, Vertrauen und Konflikt als Zahl mit Pfeil.
  2. „Was sie wollen“: 3 Zeilen, je mit Ist/Soll-Balken und Regler, der Preis daheim steht daneben (Democracy-Muster).
  3. „Was wir anbieten“: Verhandlungstisch inline als 3–4 Karten mit Kosten.
  4. Reiter „Hintergrund“ für Wahlen, Verlauf und Vergleichszahlen.

  Die BIP-Kacheln und die Vergleichstabelle der Gegenseite fallen weg, oder sie kommen unter „Hintergrund“ und nur mit Werten aus der laufenden Simulation statt 2025. „Blöcke“ werden eine Linse der Karte (Bündnisse einfärben).

### Außen › Behörden (053.png)
- **Frage des Spielers:** „Ist mein diplomatischer Dienst stark genug, und was kostet der Ausbau?“ Die Seite beantwortet das nicht.
- **Urteil:** fast leer, sinnlos, doppelt
- **Befund:**
  - Die Seite enthält eine Karte „Diplomatischer Dienst“ mit drei Punktbalken (Personal, Technik, Reichweite), dem Chip „Etat ohne Spielraum“ und dem Namen „Murat Bozkurt“. Darüber steht der Merksatz „Ausbau kostet Kapital, Geld und Zeit …“ mit „0 im Ausbau · 1 Etat knapp“.
  - Laut seiten.json gibt es 0 Knöpfe und 0 Regler. Die Seite beschreibt einen Ausbau, der hier gar nicht auslösbar ist.
  - Kein Lira-Betrag, kein Anteil am Haushalt. Datenlücke: Ausgaben des diplomatischen Dienstes fehlen.
  - Etwa 60 % der Fläche bleiben leer.
- **Klicks:** Keine sichtbaren. Falls die Karte klickbar ist, sieht man es nicht.
- **Vorschlag:** Die Seite streichen. Der Dienst wird eine Zeile in der Länderansicht bzw. der Außenseite: „Diplomatischer Dienst · Reichweite ●●●○○ · Etat [Regler] · Ausbau: x Kapital, y Monate“. Mit „Dienst“ (052) zusammenlegen.

### Außen › Diplomatische Bilanz (054.png)
- **Frage des Spielers:** „Hat meine Außenpolitik etwas gebracht?“ Die Seite zeigt stattdessen die innenpolitische Zustimmung.
- **Urteil:** sinnlos, missverständlich, doppelt
- **Befund:**
  - Es gibt ein einziges Diagramm, „Zustimmung 52 → 50 %“. Die y-Achse reicht nur von 50 bis 52, deshalb sieht ein Rückgang um 2 Punkte wie ein Absturz aus.
  - Ansehen, EU-Vertrauen und Verträge, also die drei Kopfzahlen dieser Akte, haben keine Kurve.
  - „Wirkungsberichte: Noch keine Wirkungsberichte in diesem Bereich.“ Das sind 16 Wörter auf 706 px.
  - Das Bild ist gleich mit 060 (Sicherheitsbilanz), und das Zustimmungsdiagramm erscheint auch auf 064. Code: `verlaufsReihen` in `Bereiche.tsx` gibt für alle Bereiche außer Gesellschaft und Medien nur `zustimmung` zurück.
- **Klicks:** Keine.
- **Vorschlag:** Die Seite streichen. Die Kurven von Ansehen und EU-Vertrauen kommen als Sparkline in die Kopfzahlen, ein Klick zeigt den großen Verlauf. Die Achse beginnt bei 0 oder zeigt deutlich „Ausschnitt“.

### Außen › Diplomatie & Dienste (055.png)
- **Frage des Spielers:** „Wer macht meine Außenpolitik, und ist er loyal?“
- **Urteil:** fast leer, sinnlos
- **Befund:**
  - Die Seite zeigt eine Personenkarte: „Taner Erdem · Außenminister · Haltung: verlässlich (58) · Verlässliche Partner und ein Land, das mit allen redet.“ Das sind 15 Wörter, der Rest ist leere Fläche.
  - Der Reitername verspricht „Dienste“, die Seite zeigt aber keinen Dienst. Der Leiter des Dienstes (Murat Bozkurt, 053) fehlt.
  - Es gibt keine Handlung (Gespräch, Entlassen, Auftrag).
- **Klicks:** Keine.
- **Vorschlag:** Die Seite streichen. Das Porträt des Ministers kommt klein in den Aktenkopf (Haltung als Ring), ein Klick öffnet das Gespräch im Kabinett.

---

### Sicherheit › Sicherheitslage (056.png, 056b.png)
- **Frage des Spielers:** „Droht Krieg, und wo?“ Eine Antwort gibt es nur als Textliste, nicht auf der Karte.
- **Urteil:** zu lang, missverständlich, doppelt
- **Befund:**
  - Die Seite ist 1571 px hoch. Oben steht wieder „Lage: angespannt · Auffällig: Laufende Konflikte: 2“ mit dem Knopf „Streitkräfte öffnen“, der den Nachbarreiter öffnet.
  - Der Kopf meldet „Laufende Konflikte 2“. Die „Konfliktlage“ darunter listet aber 7 Zeilen: Zypern 72, Israel 70, USA 65, Griechenland 55, Iran 55, EU 53, Russland 52. Jede Zeile hat denselben Knopf „Konfliktdossier öffnen →“, also 7 gleiche Knöpfe. Dass die EU als Konfliktgegner neben Zypern steht, ist missverständlich.
  - Die Überschrift lautet „Was Sie jetzt in Auftrag geben können“. Von den 4 Karten darunter sind aber 3 schon „Im Bau“ (F-16, Stahlkuppel, Altay). Nur der KAAN ist „Möglich“.
  - Die KAAN-Karte trägt fünf Symbolchips ohne Beschriftung: „8“, „2.000“, „48 Mon.“, „+0,7 Pp.“, „2,5“. Der Spieler weiß nicht, was davon Kapital, Lira oder Haushaltspunkte sind. Ein Kampfjet trägt das Etikett „Wunder“.
  - Widerspruch: Die Karte Altay sagt „25 Mon. Rest“, Streitkräfte (057) sagt bei Kampfpanzer „noch 11 Monate · Altay T1“, und die Baureihenfolge (058) sagt „fertig in etwa 25 Monaten“.
  - „Bündnisse der Türkei · Nordatlantikpakt 14 Mitglieder, G20 14 Mitglieder“ ist falsch. Laut `data/welt-institutionen.ts` sind das nur die im Spiel modellierten Staaten, die NATO hat 14 + 18 = 32 Mitglieder. Die Zahl `weitereMitglieder` zeigt nur `welt/Block.tsx` an, diese Kachel nicht.
- **Klicks:**
  - „Streitkräfte öffnen“ ist doppelt zum Reiter. Weg damit.
  - 7× „Konfliktdossier öffnen →“: nötig, aber besser so: Die ganze Zeile ist der Klick, oder ein Klick auf das Land in der Karte.
  - 3× „Baustelle ansehen →“ führt nach 058 und ist doppelt mit „Alle 16 Vorhaben …“.
  - „Prüfen und beginnen →“ ist der einzige echte Auftrag und nötig.
  - „Alle 16 Vorhaben in ‚Rüstung und Beschaffung‘ →“: Der Zielreiter zeigt aber „Beschaffung und Doktrinen 8“. Die Zahlen passen nicht zusammen.
- **Vorschlag:** Die Sicherheitslage wird die Karte im Stil von Hearts of Iron:
  - Konfliktgegner als eingefärbte Länder mit Eskalationsring (72/100) und einer Spannungsnadel an der Grenze. Ein Klick öffnet das Dossier.
  - Laufende Kriege mit Frontlinie.
  - Bündnisse als Linse.
  - Unten eine Leiste „Was Sie beginnen können“ nur mit wirklich neuen Vorhaben, Kosten als beschriftete Symbole („Kapital 8 · 2.000 Mio. ₺ · 48 Monate“).
  - Was „Im Bau“ ist, gehört nur in die Bauliste.

### Sicherheit › Streitkräfte (057.png, 057b.png)
- **Frage des Spielers:** „Wie stark bin ich, und wo schwächele ich?“ Und im Krieg: „Wo greife ich an?“
- **Urteil:** missverständlich, sinnlos (Werte), zu kompliziert (Kriegsplanung)
- **Befund:**
  - Fast jede Zahl ist 100: „Heer 100 · Luftwaffe 100 · Marine und Raketen 100 · Verteidigungsetat 100 % von 2026“, „Kampfkraft 100“, und fünf Karten mit „Index 100“ (Kampfpanzer, Drohnen, Luftabwehr, Marine, Raketen).
    - Ein Index, der überall 100 ist, sagt nichts.
    - Er widerspricht dem Kopf „Bereitschaft Heer 60“ und den Balken in 058 (Einsatzbereitschaft Heer 60, Luftwaffe 55, Marine 58, Modernisierung 45).
  - Unter jeder Karte steht „Generation“ mit Punktbalken, aber ohne Wert, auch bei „Personal 481.000“ und „Munition 60 Tage“, die keine Generation haben.
  - Der „Verteidigungsetat 100 % von 2026“ steht ohne Lira-Betrag und ohne % BIP. Datenlücke: Der Etat in absoluter Höhe ist nicht sichtbar, es gibt keinen Regler.
  - Die Kriegsplanung (Zielräume, Einsatzart, Tempo, Bestand des Gegners) steckt in einer Seitenschublade mit „×“ rechts neben einer Werteliste. Darin stehen „Schutzzone Nordzypern / Ganz Zypern“, „Luftschläge und Drohnen / Bodenoffensive / Seeblockade / Verbündete Kräfte vor Ort“ und „Vorsichtig / Normal / Hart“. Das sind die wichtigsten Kriegsentscheidungen des Spiels, als Textknöpfe in einer Spalte.
  - Die Karte „Zielräume 2“ trägt die rote Marke „Krieg läuft · Zypern, Israel“. Beide Konflikte stehen laut 056 und der Zeitung (063b) aber in Phase „Spannung“. Code: `Streitkraefte.tsx` Zeile 179 setzt „Krieg läuft“, sobald `aktiveKriege` nicht leer ist, auch in der Phase Spannung. Das ist ein Bug.
  - Sprache: „Das Kriegsziel umfasst 1 Regionen“. Und „Laufende Vorhaben 5 · 0 von 4“ ist unverständlich.
  - „Wehrdienst 6 Monate“ steht als Zahl da, ohne Regler, obwohl er eine klassische Stellgröße ist.
- **Klicks:**
  - Zielraum-Knöpfe (2), Einsatzart (4, davon 1 gesperrt) und Tempo (3) sind nötig, gehören aber auf die Karte bzw. in eine Leiste darunter.
  - Das „×“ der Schublade ist unnötig, weil die Planung nur im Konfliktfall erscheinen soll.
  - Die Karte „Zielräume“ öffnet die Schublade. Besser so: Ein Klick auf das Konfliktgebiet in der Karte.
- **Vorschlag:**
  - Streitkräfte als ein Bild: ein Radar- oder Halbrund mit 5 Achsen (Heer, Luft, See, Raketen, Cyber), Bereitschaft und Modernität als zwei Flächen. Darunter 4 Zeilen mit Regler: Etat, Wehrdienst, Munitionsvorrat, heimischer Anteil, je mit Preis.
  - Der Kriegsplan wird eine Kartenansicht: Zielräume als schraffierte Flächen, Einsatzart als 4 große Symbole, Tempo als 3er-Schalter, Erfolgsaussicht als Balken „eigene 37 : Gegenwehr 14“.
  - Die Index-100-Kacheln fallen weg, oder sie zeigen nur Abweichungen.

### Sicherheit › Rüstung und Beschaffung (058.png, 058b.png)
- **Frage des Spielers:** „Was wird gebaut, wann ist es fertig, und was lohnt sich als Nächstes?“
- **Urteil:** zu lang, doppelt, unschön
- **Befund:**
  - Die Seite ist 2032 px hoch (2,7 Bildschirme), mit drei Unterreitern („Lage / Rüstung pflegen 2 / Beschaffung und Doktrinen 8“) und 21 Knöpfen.
  - „Verwaltungskraft 99 · +2,4 im Monat“ und „Baukapazität 133 · 99 von 133 verplant“ sind landesweite Ressourcen und stehen hier versteckt. Die Baureihenfolge enthält „Wiederaufbau im Erdbebengebiet“, also ein ziviles Vorhaben in der Rüstungsakte. Dass Militär und Wiederaufbau um dieselbe Kapazität konkurrieren, ist wichtig, wird aber nicht als Konflikt gezeigt.
  - 8 Kennzahlbalken (Einsatzbereitschaft ×3, Modernisierung, Rüstungsautarkie, Truppenmoral, Vertrauen in die Offiziersführung, Abschreckung) wiederholen Kopf und 057.
  - Gut: „Hier lohnt sich Pflege“ zeigt Wirkung (+2,9 Modernisierung, heute 45), Preis (2 Kapital · 120 Baupunkte · 8 Monate) und den Knopf direkt nebeneinander. Das ist das gewünschte Muster.
  - Doppelt: Dieselben 4 Vorhaben stehen zweimal untereinander, einmal als „Im Bau“ mit Bild, Fortschrittsbalken und „Pausieren“ und einmal als „Baureihenfolge“ mit ▲▼ und noch einmal „Pausieren“.
  - In der Baureihenfolge steht die Nummer ganz links, der Text klebt rechts, dazwischen sind etwa 550 px leer. Vier gleiche gelbe Banner „TRANSPARENTE AUSSCHREIBUNG“ brüllen dieselbe Information.
  - „Vorteile“ zeigt zwei Karten „Noch nicht erreicht“ (Regionale Ordnungsmacht, Rüstungsexporteur). Ohne Fortschrittsanzeige ist das totes Gewicht.
- **Klicks:**
  - Die Unterreiter (3) sind unnötig, alles passt auf eine Liste.
  - „Was den Bau beschleunigt“ (Aufklapper) ist nötig, aber als Satz neben der Baukapazität.
  - 2× „Instandsetzen“ ist nötig und bleibt.
  - „Pausieren“ steht 8× für 4 Vorhaben. Es soll einmal je Vorhaben erscheinen.
  - ▲/▼ (je 2) sind nötig. Besser so: Ziehen in einer Liste, Preis „10 Verwaltungskraft“ am Griff.
- **Vorschlag:** Eine Bauliste für alle Vorhaben (zivil und militärisch, gemeinsam mit Land). Jede Zeile hat Bild, Fortschrittsbalken, „fertig in x Monaten“, Griff zum Umordnen und einmal Pausieren. Oben ein Balken „Baukapazität 99/133“, farbig nach Vorhaben gestapelt. Pflege bleibt als zweite Liste in diesem Muster. Kennzahlbalken und Vorteilskarten fallen weg; Vorteile kommen als Meilenstein auf den Balken.

### Sicherheit › Behörden (059.png)
- **Frage des Spielers:** „Sind Geheimdienst, Polizei, Grenzschutz und Cyberabwehr gut genug ausgestattet?“
- **Urteil:** fast leer, sinnlos
- **Befund:**
  - Die Seite enthält 4 gleich gebaute Karten (MİT, Polizei und Gendarmerie, Grenzschutz und Küstenwache, Cyberabwehr). Jede hat drei Punktbalken, „Etat ohne Spielraum“ und einen Leiternamen.
  - Es gibt 0 Knöpfe und 0 Regler. „4 Etat knapp“ meldet ein Problem, gibt aber keine Möglichkeit, es zu lösen.
  - Keine Lira, keine Personalzahl. Datenlücke: Haushalte der Sicherheitsbehörden.
- **Klicks:** Keine.
- **Vorschlag:** Die Behörden werden 4 Zeilen mit Etat-Regler auf der Sicherheitsseite: Punktbalken links, Preis und Wirkung (z. B. Terrorgefahr, Grenzübertritte) rechts. Ein Klick auf eine Zeile führt (Wunsch des Inhabers) in den Haushalt dieses Postens als Kreisdiagramm, sobald die Daten da sind.

### Sicherheit › Sicherheitsbilanz (060.png)
- **Frage des Spielers:** „Bin ich sicherer geworden?“
- **Urteil:** sinnlos, doppelt
- **Befund:**
  - Das Bild ist gleich mit 054: „Zustimmung 52 → 50 %“ auf einer Achse von 50 bis 52, dazu „Noch keine Wirkungsberichte“.
  - Es gibt keine Kurve zu Bereitschaft, Abschreckung, Terrorgefahr oder Konflikten, also zu nichts aus diesem Bereich.
- **Klicks:** Keine.
- **Vorschlag:** Die Seite streichen. Kurven als Sparkline an den Kopfzahlen.

### Sicherheit › Führung & Zuständigkeit (061.png)
- **Frage des Spielers:** „Wer führt Militär und Polizei, und folgen sie mir?“
- **Urteil:** fast leer, missverständlich
- **Befund:**
  - Die Seite zeigt zwei Karten: Selin Koçak (Innenministerin, distanziert 48) und Levent Duran (Generalstab, verlässlich 52).
  - Ein Verteidigungsminister fehlt. `BEREICH_AEMTER.sicherheit` enthält nur `generalstab` und `inneres`.
  - Die MİT-Chefin bzw. der MİT-Chef (Barış Işık, 059) fehlt, obwohl gerade der Geheimdienst politisch heikel ist.
  - Selin Koçak steht noch einmal in Medien › Zuständige Akteure (065).
  - Es gibt keine Handlung: kein Gespräch, kein Austausch, keine Beförderungsfrage, obwohl der Text „Beförderungspraxis, die die Truppe versteht“ verlangt.
- **Klicks:** Keine.
- **Vorschlag:** Streichen. Zwei bis drei Porträts klein in den Aktenkopf, mit Haltungsring und Klick ins Gespräch. Putschgefahr bzw. Loyalität des Generalstabs als sichtbare Zahl im Kopf (Suzerain-Muster).

---

### Medien › Medienlage (062.png)
- **Frage des Spielers:** „Wer berichtet wie über mich, und wie viel Kontrolle habe ich?“
- **Urteil:** fast leer, missverständlich
- **Befund:**
  - Wieder steht oben „Lage: angespannt · Auffällig: Pressefreiheit: 29,4“ mit „Zeitung öffnen“, das den Nachbarreiter öffnet.
  - Kopfzahlen „Gesperrte Medien 0“ und „Ausweichen in soziale Netze 0“: Zwei von drei Kopfzahlen sind Nullen ohne Aussage.
  - „Medien nach Gruppen“ besteht aus 4 Karten plus „▶ 3 weitere Einträge“. Missverständlich:
    - „Digitale Nachrichtenkanäle · unter Druck · Selbstzensur 0“ wirkt schlechter als „Staatlicher Rundfunkverbund · Lizenz frei · Selbstzensur 80“. Für Pressefreiheit ist es aber umgekehrt.
    - Die Farbe folgt der Lizenz und nicht der Unabhängigkeit.
  - Es gibt keinen Regler. Die Stellgröße „Medienaufsicht Stufe 65“ (auf 052b als EU-Forderung „höchstens 50“ erwähnt) ist hier nicht zu sehen.
  - Etwa 45 % der Fläche bleiben leer.
- **Klicks:**
  - „Zeitung öffnen“ ist doppelt zum Reiter. Weg damit.
  - „3 weitere Einträge“ ist unnötig, bei 7 Gruppen passt alles.
- **Vorschlag:** Ein Kreis- oder Ringdiagramm des Medienmarkts aus 7 Gruppen, eingefärbt von regierungsnah bis oppositionell. Die Segmentgröße zeigt die Reichweite. Datenlücke: Reichweitenanteile je Gruppe gibt es im Bild nicht; wenn sie fehlen, gleiche Segmente und die Lücke benennen.
  - Klick auf ein Segment: Lizenz, Selbstzensur, Eigentümer und die Handlungen (Werbung zuteilen, Lizenz prüfen, Verfahren).
  - Darunter 3 Zeilen mit Regler: Medienaufsicht, Staatswerbung, Netzsperren. Jede zeigt den Preis bei Pressefreiheit, EU-Vertrauen und Ausweichen in soziale Netze.

### Medien › Zeitung (063.png, 063b.png)
- **Frage des Spielers:** „Was steht heute über mich in der Zeitung?“ Das wird beantwortet, und die Seite hat am meisten Spielgefühl.
- **Urteil:** passt (Idee), zu lang, missverständlich (Zahlen)
- **Befund:**
  - Die Zeitung „Der Staatsbote“ mit Aufmacher, Kommentar „Kurs halten“, „Zahlen des Monats“, Parlament, Ausland und Lage im Land wirkt stimmig. Daneben die Ausgabe „Der Widerspruch“ und ein Archiv mit 22 Ausgaben.
  - Widersprüche:
    - „Zustimmung (Umfrage) 54,2 %“, und im Kommentar „Zustimmung auf 54,2 Prozent gestiegen (zuvor 51,5)“. Die Kopfleiste zeigt aber 50 % ▼0,2, und die Pressebilanz zeigt 52 → 50. Zwei verschiedene „Zustimmungen“ ohne Erklärung.
    - Die Ausland-Spalte sagt „Konflikt mit Zypern: Phase ‚Spannung‘“, Streitkräfte sagt „Krieg läuft“.
  - Die Seite ist 1989 px hoch, der Kommentar folgt erst auf dem zweiten Bildschirm. Unterreiter „Ausgaben / Medien“ plus „Der Staatsbote / Der Widerspruch“: zwei Reiterebenen in einem Reiter. „Medien“ wiederholt 062.
  - Der Sidebar-Zähler „Medien 22“ (später 24) zählt laut `Stage.tsx` `zeitung.ungelesen`. Er wächst jeden Monat und wird zu Rauschen, das genauso aussieht wie die dringenden Zähler (Schreibtisch).
  - „Nicht in dieser Ausgabe: Verfahren gegen das Rathaus von Ankara · Lira gibt nach · Wohnungsnot in 7 Provinzen akut“ ist eine starke Idee (Zensur sichtbar), aber nur als grauer Kleindruck umgesetzt.
- **Klicks:**
  - „Zur Wirtschaftsakte →“ (2×), „Zum Parlament →“ und „Eingriffe und Zustand der Medien →“ sind nötig, sollen aber gleich aussehen und je Ziel einmal erscheinen.
  - Archivkarten (8 sichtbar) sind nötig. Besser so: eine Zeitleiste mit Schlagzeilen-Tooltip.
  - Die Reiter Staatsbote/Widerspruch sind nötig. Besser so: beide Titelseiten nebeneinander halb, damit der Kontrast „regierungsnah ↔ oppositionell“ zum Spiel wird.
- **Vorschlag:** Die Zeitung wird die Hauptseite der Medien. Zuerst zwei Titelseiten nebeneinander (gleiche Nachricht, zwei Schlagzeilen), darunter „Nicht in dieser Ausgabe“ als durchgestrichene rote Zeilen. Rechts das Medien-Ringdiagramm mit Reglern (siehe 062). „Zahlen des Monats“ soll exakt die Kopfleiste spiegeln. Wenn Umfrage und Zustimmung verschieden sind, beide benennen („Zustimmung 50 % · Umfrage Ekran 54,2 %“). Den Zähler nur für neue Ausgaben mit Bezug auf den Spieler setzen oder als ruhigen Punkt zeigen.

### Medien › Pressebilanz (064.png)
- **Frage des Spielers:** „Wie hat sich die Pressefreiheit entwickelt?“
- **Urteil:** fast leer, doppelt, sinnlos
- **Befund:**
  - „Pressefreiheit 29,4 → 29,4“ ist über 19 Monate eine flache Linie, das Diagramm ist zu 90 % leer.
  - Daneben „Zustimmung 52 → 50 %“, zum dritten Mal in dieser Gruppe (054, 060).
  - „Noch keine Wirkungsberichte.“
- **Klicks:** Keine.
- **Vorschlag:** Streichen. Pressefreiheit als Sparkline mit Rang („Rang 159“, steht schon in der Zeitung) im Kopf.

### Medien › Zuständige Akteure (065.png)
- **Frage des Spielers:** „Wer steuert die Medien, und mit wem muss ich reden?“
- **Urteil:** fast leer, missverständlich, doppelt
- **Befund:**
  - Die Seite zeigt Selin Koçak (Innenministerin, gleiche Karte wie 061) und Zeynep Karaca (Präsidialamt). Das sind 31 Wörter auf 623 px.
  - Die eigentlichen Medienakteure fehlen: Medienaufsicht, Eigentümer der Mediengruppen, Chefredaktion von „Der Widerspruch“, Kommunikationsdirektion.
- **Klicks:** Keine.
- **Vorschlag:** Streichen. Akteure als Porträts an den Segmenten des Medienrings (Eigentümer) und im Kopf (zuständige Ministerin).

---

### Karte › Grundansicht ohne Akte (k00-karte.png)
- **Frage des Spielers:** „Wie steht mein Land da, wo sind Probleme?“ Die Grundansicht beantwortet nichts.
- **Urteil:** fast leer, unschön
- **Befund:**
  - Die Linse „Politisch“ ist laut `ebenen.ts` „ohne Einfärbung“: 81 beige Provinzen, keine Namen, keine Städte, keine Hauptstadt, keine Nachbarnamen. Zu sehen ist nur der Hinweis „Vereinfachte Karte: Dieses Gerät zeigt keine 3D-Grafik“.
  - Die laufenden Konflikte mit Zypern (Eskalation 72) und Israel (70) sind auf der Karte unsichtbar. Es gibt keine Marke, keinen Ring, keine Front.
  - Die linke Leiste (x 12–212, y 112–665) überdeckt die Ägäisküste und Thrakien-Süd.
  - Rechts unten stapeln sich drei Kästen: „Marken auf der Karte ?“, „Effekte Mittel · Bewegung der Karte“ und „TÜRKİYE · 81 Provinzen · Stand 2030“. Der dritte ist reine Dekoration, „Effekte“ steht noch einmal im Hauptmenü (m01).
  - Oben die Chips „1 Entscheidung · 10 akute Probleme · Programmschritt bereit“. Die sind gut, aber „10 akute Probleme“ zeigt nicht, wo die Probleme liegen.
- **Klicks:**
  - Kartenebene „Politisch ⌃“ ist nötig, aber die Grundeinstellung ist falsch.
  - „Marken auf der Karte ?“ ist eine Legende, die man erst anklicken muss. Besser so: Die Legende erscheint mit der Linse.
  - „Effekte Mittel“ ist doppelt zum Menü. Weg von der Karte.
  - Der Türkiye-Kasten ist sinnlos. Weg damit.
  - „10 akute Probleme“ soll die Linse „Akute Probleme“ einschalten.
- **Vorschlag:** Als Grundlinse „Rückhalt“ oder „Akute Probleme“. Dazu dauerhaft eine Schicht „Lage“: Provinznamen ab Zoomstufe, Hauptstadt, Konfliktgegner rot schraffiert mit Eskalationszahl, Baustellen als Kran-Symbol und Problem-Symbole in den Provinzen. Die Karte soll zeigen, was sich bewegt (Civilization: Symbole auf der Karte statt Listen).

### Karte › Ebenenmenü (k01-ebenenmenue.png)
- **Frage des Spielers:** „Welche Ansicht brauche ich gerade?“
- **Urteil:** zu kompliziert, missverständlich
- **Befund:**
  - Das Menü hat 15 Linsen in 5 Gruppen (Land, Wirtschaft, Krisen, Kultur, Welt), jede Kachel mit 2–5 Zeilen Beschreibung. Das Menü belegt 640 × 690 px.
  - Die linke Navigationsleiste überdeckt die erste Spalte mit den Linsen 1–4: Politisch, Regionen, Wahlausgang, Rückhalt. Ausgerechnet die politischen Linsen sind nur als Zahlenreste („1“, „2“, „28 · 3“, „4“) erkennbar.
  - Tastenkonflikt: Das Menü verspricht „Tasten 1 bis 9, 0 und B“. 1–4 sind in `kopf/Kopfleiste.tsx` (`useTempoTasten`) aber zugleich die Tempotasten, und `linsen/LinsenWahl.tsx` belegt 1–9. Im Rundgang hat 1–4 nur das Tempo geändert (k-1 bis k-4), die Linse blieb „Politisch“. Wahlausgang und Rückhalt sind per Taste unerreichbar, und Drücken lässt die Zeit laufen.
  - Das Tastenschild „0“ neben „Akute Probleme“ sieht aus wie der Zähler „0 Probleme“, während oben „10 akute Probleme“ steht. Ebenso „R“, „K“, „B“, „S“ und „V“: In der Kopfzeile fehlen V, R, K und S.
  - Der Farbstreifen unter jeder Kachel ist hübsch, aber bei 5 Linsen fast gleich rot.
- **Klicks:**
  - 15 Kacheln; nötig sind etwa 8.
  - Zusammenlegen:
    - Infrastruktur, Belastung und Versorgungswege zu „Netze“ (Unterumschalter).
    - Akute Probleme und Katastrophenrisiko zu „Krisen“.
    - Kulturerbe in die Linse „Land“ bzw. die Akte Land.
    - Regionen in „Politisch“ als Grenzlinien.
  - Die Beschreibungen kommen in einen Tooltip.
- **Vorschlag:** Eine schmale Leiste mit 8 großen Symbolen am unteren Kartenrand (wie die Linsen in Civilization 6), Name beim Darüberfahren. Das Menü öffnet rechts der Navigationsleiste oder als Leiste unten. Das Tempo kommt auf Leertaste und +/−, oder die Linsen auf Buchstaben. Keine Doppelbelegung.

### Karte › Tasten 1–4 (k-1.png, k-2.png, k-3.png, k-4.png)
- **Frage des Spielers:** „Ich drücke 2, um die Regionen zu sehen.“ Es passiert etwas anderes.
- **Urteil:** missverständlich (Bug)
- **Befund:**
  - Die Linse bleibt auf allen vier Bildern „Politisch“.
  - Stattdessen springt das Tempo:
    - k-1: 4. Februar, Tempo 1
    - k-2: 11. Februar, ▶▶ aktiv
    - k-3: 11. März, ▶▶▶ aktiv, Schreibtisch 8, Chip „Zinssitzung in 6 Tagen“
    - k-4: 2. April, Schreibtisch 17, der Chip „1 Entscheidung“ ist verschwunden
  - Wer nur Karten anschauen wollte, hat zwei Spielmonate verloren, und die Entscheidung ist fort oder abgelaufen.
  - Das Provinzfenster „Mardin“ (Nr. 47) bleibt in allen Bildern offen und deckt den Osten von x ≈ 1085 bis 1420 ab. Mardin selbst (rote Umrandung bei x ≈ 1045–1085) verschwindet fast hinter dem eigenen Fenster. Das Fenster überdeckt den Knopf „Marken auf der Karte“ (y ≈ 747).
- **Klicks:** Tasten 1–4 müssen eindeutig sein. Das Provinzfenster soll links neben der Provinz andocken oder die Karte so verschieben, dass die Provinz frei bleibt.
- **Vorschlag:**
  - Doppelbelegung in `Kopfleiste.tsx` und `linsen.ts` auflösen.
  - Ein Druck auf eine Kartentaste darf nie die Zeit starten.
  - Wenn das Tempo sich ändert, kurz eine Einblendung „Tempo 2“ zeigen.

### Karte › Wirtschaftskraft (k-5.png)
- **Frage des Spielers:** „Wo ist das Land reich, wo arm?“ Die Linse beantwortet das gut.
- **Urteil:** passt (mit Abzügen)
- **Befund:**
  - Gut: Türkis-Verlauf und Legende „188 Tsd. ₺ … 803 Tsd. ₺ · Wirtschaftsleistung je Einwohner“.
  - Die gewählte Provinz Mardin ist beige ausgefüllt und verliert damit ihre Datenfarbe. Die Auswahl überschreibt die Information.
  - Keine Provinzwerte beim Darüberfahren sichtbar, die Zahl steht nur im Seitenfenster.
- **Klicks:** Die Legende ist nicht klickbar und braucht das auch nicht.
- **Vorschlag:** Auswahl nur als Umriss, Füllung bleibt. Wert beim Darüberfahren direkt an der Provinz.

### Karte › Arbeitslosigkeit (k-6.png)
- **Frage des Spielers:** „Wo sind die Arbeitslosen?“
- **Urteil:** passt, missverständlich (Farbe)
- **Befund:**
  - Roter Verlauf „4 % … 14 % (teils geschätzt)“. Gut, dass „geschätzt“ dasteht.
  - Derselbe Rotverlauf wird für Akute Probleme (k-0) und Katastrophenrisiko (k-r) benutzt. Drei Linsen, die man nur an der Legende unterscheidet.
- **Klicks:** Keine.
- **Vorschlag:** Eine eigene Farbfamilie je Gruppe (Wirtschaft blau/türkis, Krisen rot, Netze grün/gelb), damit man die Linse am Bild erkennt.

### Karte › Infrastruktur (k-7.png)
- **Frage des Spielers:** „Wo fehlt es an Straßen, Bahn und Kliniken?“
- **Urteil:** missverständlich, zu klein (Aussage)
- **Befund:**
  - Zu sehen ist nur der Straßennetz-Verlauf „0,4 … 5,1 km/km²“, fast gleiche Türkis-Töne wie die Wirtschaftskraft.
  - Das Menü verspricht „beim Hineinzoomen Bahn, Krankenhäuser, Flughäfen“. Auf dem Bild ist nichts davon zu sehen, also keine Linien und Punkte.
  - Das Aufklapp-Chevron in der Legende deutet eine Unterwahl an, sagt aber nicht, welche.
- **Klicks:** Chevron „⌄“: unklar wohin. Besser so: drei Umschalter „Straße · Bahn · Klinik“ sichtbar.
- **Vorschlag:** Netze als Linien und Symbole auf der Karte (Bahnlinien, Klinik-Kreuze). Mit Belastung und Versorgungswegen zu einer Linse „Netze“ zusammenlegen.

### Karte › Ressourcen (k-8.png)
- **Frage des Spielers:** „Wo liegen Bodenschätze, Öl, Wasser, Kornkammern?“
- **Urteil:** unschön, zu grob
- **Befund:**
  - Je Provinz ist nur das „bedeutendste Vorkommen“ zu sehen, die ganze Provinz wird flächig gefärbt. Etwa zwei Drittel der Provinzen bleiben beige.
  - Das Farbfeld „Kohle, Öl und Gas“ in der Legende ist fast schwarz, auf der Karte erscheint ein Graubraun.
  - Wasser und Staudämme (blaugrün) gleichen der Türkis-Skala anderer Linsen.
- **Klicks:** Chevron in der Legende.
- **Vorschlag:** Symbole statt Flächen (Bohrturm, Erzhacke, Damm, Ähre) in der Provinz, mehrere pro Provinz möglich, wie die Ressourcensymbole in Civilization.

### Karte › Belastung (k-9.png)
- **Frage des Spielers:** „Wo sind Straßen, Strom, Wasser, Wohnungen und Kliniken am Limit?“
- **Urteil:** missverständlich
- **Befund:**
  - Grün-gelb-rot „frei … überlastet“, „Höchste Auslastung je Provinz“. Der Spieler sieht aber nicht, welches der fünf Netze in einer Provinz überlastet ist (Istanbul rot: Wohnung? Verkehr?).
  - Das Menü erwähnt einen „Zeiger [, der] Kapazität und Bau“ zeigt. Er ist nicht zu sehen.
- **Klicks:** Chevron in der Legende, unklar.
- **Vorschlag:** Ein kleines Symbol des überlasteten Netzes in der roten Provinz. Teil der Linse „Netze“.

### Karte › Akute Probleme (k-0.png)
- **Frage des Spielers:** „Wo brennt es im Inland?“ Das ist die wichtigste Inlandslinse.
- **Urteil:** passt (Idee), missverständlich (Farbe, Zugang)
- **Befund:**
  - Rotverlauf „eines … sechs und mehr“. Zu sehen sind die Anzahl der Probleme je Provinz, aber nicht welche.
  - „Aufklappen, um ein Problem zu wählen“ versteckt die eigentliche Information hinter dem Chevron.
  - Das Tastenschild „0“ im Menü (k01) liest sich als „0 Probleme“.
- **Klicks:** Chevron. Besser so: Problemsymbole (Wohnung, Wasser, Luft) direkt in den Provinzen, Klick auf ein Symbol führt zum Problem.
- **Vorschlag:** Diese Linse wird die Grundlinse oder hängt am Chip „10 akute Probleme“. Mit Katastrophenrisiko als „Krisen“ zusammenlegen.

### Karte › Katastrophenrisiko (k-r.png)
- **Frage des Spielers:** „Wo droht ein Beben?“
- **Urteil:** missverständlich, zu grob
- **Befund:**
  - Fast das ganze Land ist mittel- bis dunkelrot. Die Skala „1–5“ wird als stufenloser Verlauf „gering … sehr hoch“ gezeigt, und nur wenige Provinzen heben sich ab.
  - Die Legende nennt „Erdbeben-Gefährdung“, das Menü verspricht „dazu Flut und Brand“. Beides sieht man nicht.
- **Klicks:** Chevron.
- **Vorschlag:** 5 klare Stufen statt Verlauf, Verwerfungslinien als Linie. Flut und Brand als Umschalter. Mit Akute Probleme zur Linse „Krisen“ zusammenlegen.

### Karte › Kulturerbe (k-k.png)
- **Frage des Spielers:** „Welche Stätten verfallen?“
- **Urteil:** sinnlos (als eigene Linse), unschön
- **Befund:**
  - Graugrün bis beige, nur Hatay ist rot („gefährdet … gut erhalten“).
  - Die Linse zeigt Provinzflächen, nicht die Stätten (Ephesos, Göbekli Tepe …), also nicht das, worum es geht.
- **Klicks:** Chevron.
- **Vorschlag:** Als eigene Linse streichen. Stätten als Symbole in der Akte Land bzw. in der Linse „Land“ beim Hineinzoomen.

### Karte › Beziehungen (k-b.png)
- **Frage des Spielers:** „Wie stehen die Länder zu mir?“ Das ist die Kernfrage von Außen, und sie wird hier nur für Nachbarn beantwortet.
- **Urteil:** zu klein, missverständlich
- **Befund:**
  - Im Ausschnitt sind nur Syrien (grün „Partner“), Griechenland (orange), die Republik Zypern (rot „feindselig“) und Teile des Irak zu sehen, der Osten verschwindet hinter dem Mardin-Fenster. Nordzypern bleibt beige.
  - USA, EU, Russland und China, also die vier Mächte mit den größten Werten in 052, sind in diesem Ausschnitt nicht vorhanden. Ob die 2D-Karte sich so weit herauszoomen lässt, war im Rundgang nicht sichtbar.
  - Die Legende „Klicken Sie ein Land an“ ist richtig. Konflikte (Zypern 72, Israel 70) sind aber nur als „feindselig“ eingefärbt, ohne Eskalationszahl, ohne Vertragslinie, ohne Sanktionssymbol.
  - Die Türkei selbst bleibt in Provinzbeige, dabei könnte hier Ansehen bzw. Bündnis stehen.
- **Klicks:** Klick auf ein Land öffnet das Popover (`welt/LandPopover.tsx`). Das ist nötig und gut, sollte aber der Hauptweg nach Außen sein und nicht ein versteckter.
- **Vorschlag:** Diese Linse wird die Seite „Außen“. Automatischer Weltausschnitt beim Öffnen von Außen, Einschübe für ferne Mächte (USA, China) am Rand. Linien für Verträge (gold) und Konflikte (rot, Dicke = Eskalation), Symbole für Sanktionen und Botschafter. Klick öffnet die Länderkarte (siehe 052).

### Karte › Strategische Orte (k-s.png)
- **Frage des Spielers:** „Welche Engpässe muss ich schützen?“
- **Urteil:** missverständlich, unschön
- **Befund:**
  - Gefärbt werden ganze Provinzen: Istanbul/Kocaeli, Çanakkale-Gegend, Adana/Osmaniye, Hatay-Ost und Şanlıurfa. Gemeint sind aber Punkte: Bosporus, Dardanellen, Ceyhan-Terminal, Atatürk-Damm (laut Menü: „Meerengen, Pipelines, Häfen, Dämme und Inseln“).
  - Die Legende „wichtig … entscheidend“ nennt keinen einzigen Namen.
- **Klicks:** Chevron.
- **Vorschlag:** Symbole mit Namen (Anker, Rohr, Damm) an den echten Orten, Klick zeigt Zustand und Bedrohung. In die Militär- bzw. Lagekarte integrieren statt als eigene Linse.

### Karte › Versorgungswege (k-v.png)
- **Frage des Spielers:** „Laufen Waren und Nachschub, und wo hakt es?“
- **Urteil:** missverständlich, fast leer
- **Befund:**
  - Das ganze Land ist einheitlich grün, und es ist kein einziger Korridor eingezeichnet. Das Seitenfenster meldet aber „24 Korridore · 0 Engpässe · 0 Frontdepots“ und „Wählen Sie einen Korridor oder ein Depot“. Es gibt nichts zu wählen.
  - Der Reiter heißt „Waren & Front“, trotz „Krieg läuft“ (057) sind es 0 Frontdepots. Für den Spieler widersprüchlich.
  - Das Fenster (360 × 790 px) deckt Ostanatolien ab.
  - „Regierungsentscheidungen öffnen“ und „Zur Wirtschaftsakte ↗“ sind zwei Ausgänge aus einer Karte, die selbst nichts zeigt.
- **Klicks:**
  - „Waren & Front / Gasleitungen“ ist nötig.
  - „+ Alle Strecken auswählen“ ist nötig, sollte aber standardmäßig an sein.
  - „Regierungsentscheidungen öffnen“: unklar wohin, vermutlich in die Wirtschaft. Doppelt mit „Zur Wirtschaftsakte“.
  - „Über diese Karte“ (Aufklapper): unnötig, wenn die Karte sich selbst erklärt.
- **Vorschlag:** Korridore als Linien (Dicke = Menge, Farbe = Offen/Begrenzt/Unterbrochen, die Legende dafür steht schon unten). Im Krieg die Front und Depots als HoI-Nachschublinien. Teil der Linse „Netze“.

### Globale Oberfläche › Hauptmenü (m01-hauptmenue.png)
- **Frage des Spielers:** „Speichern, Sprache, Einstellungen.“
- **Urteil:** passt, doppelt (Effekte), missverständlich (Zeit)
- **Befund:**
  - Das Menü öffnet rechts oben mit Spielstand sichern (⌘S), Spielstände, Ton, Sprache (3), Werte wählen (Inflation ✓, Lira ✓, Leitzins gesperrt), Effekte und Hauptmenü. Das ist übersichtlich.
  - Die Zeit läuft weiter, während das Menü offen ist (4. April, ▶ aktiv).
  - „Effekte der Karte · Mittel“ steht hier und noch einmal dauerhaft auf der Karte.
  - „Werte wählen: … dazu höchstens zwei weitere“ ist eine gute Idee. Die gesperrte Zeile „Leitzins“ erklärt aber nicht, dass man erst einen anderen Haken lösen muss.
- **Klicks:**
  - Alle sind nötig.
  - Der Effekte-Knopf auf der Karte ist doppelt. Weg damit.
  - „Hauptmenü“ ist richtig, mit Hinweis „Der Stand wird vorher gesichert“.
- **Vorschlag:** Beim Öffnen des Menüs pausieren. Effekte nur hier.

### Globale Oberfläche › Klick auf eine Provinz (p01-provinzklick.png)
- **Frage des Spielers:** „Was ist in dieser Provinz los, und was kann ich hier tun?“
- **Urteil:** sinnlos (in dieser Lage), zu lang (Provinzfenster)
- **Befund:**
  - Mit offener Linse „Versorgungswege“ erzeugt der Klick auf eine Provinz in Zentralanatolien nur eine rote Umrandung. Es öffnet sich kein Fenster, weil das Versorgungswege-Fenster den Platz belegt. Der Spieler bekommt nichts, und die Zeit läuft (8. April, ▶).
  - Das Provinzfenster selbst (Mardin, k-1 ff.) ist eine lange Datenliste: Einwohner, Wirtschaftskraft, Arbeitslosigkeit, Rathaus seit 2024, Abgeordnete, Straßennetz, Bahn, Krankenhäuser, Flughäfen · Kraftwerke, dann „Lage im Spiel“ mit Balken. Es muss gescrollt werden. Es gibt keinen einzigen Handlungsknopf (investieren, besuchen, Gouverneur, Problem lösen).
- **Klicks:** Provinzklick: muss immer etwas zeigen. Besser so: Ein kleines Provinzkärtchen am Mauszeiger, unabhängig von der Linse.
- **Vorschlag:** Provinzkarte in drei Blöcken: Kopfzahlen (3), „Probleme hier“ als Symbole mit Klick zum Lösen, „Hier im Bau“. Die Datenliste kommt in einen Reiter „Daten“. Das Fenster dockt so an, dass die Provinz sichtbar bleibt.

---

### Querschnitt D

**Wiederkehrende Muster**
1. **Leere Pflichtreiter.** Die zwei rechten Reiter jeder Akte („Bilanz“ und „Personen“) sind in allen drei Bereichen fast leer oder gleich. Das betrifft 6 von 15 Seiten (054, 055, 060, 061, 064, 065), also 40 %.
   - Die Bilanz zeigt überall die Zustimmung auf einer 50–52-Achse, nie die eigenen Bereichswerte.
   - Die Personen sind 1–2 Karten ohne Handlung.
   - Die Behördenseiten (053, 059) sind dieselbe Schablone ohne Knopf, Regler und Betrag.
2. **Der „Lage“-Kasten mit Sprungknopf.** „Lage: angespannt · Auffällig: … · [X öffnen]“ steht in Außen, Sicherheit und Medien. Er wiederholt eine Kopfzahl und öffnet den Reiter direkt daneben. Das kostet je etwa 110 px und einen nutzlosen Klick.
3. **Kopfzahlen doppelt und dreifach.** Ansehen, EU-Vertrauen, Diaspora, Bereitschaft und Abschreckung erscheinen im Kopf, dann als Kachel, dann als Balken.
4. **Reitertiefe bis 4.** Aktenreiter → Zugang → Unterreiter → Länderreiter (052). In der Weltlage stehen sogar „Lage / Instrumente / Verlauf“ innerhalb des Aktenreiters „Lage“.
5. **Widersprüche zwischen Seiten.** Das sind keine Geschmacksfragen, sondern Fehler, die das Vertrauen ins Spiel zerstören:
   - „Krieg läuft“ (057) gegen „Phase Spannung“ (056, 063b). Ursache ist `Streitkraefte.tsx` Zeile 179.
   - „Laufende Konflikte 2“ gegen 7 Zeilen Konfliktlage.
   - Altay mit 11 gegen 25 Monate.
   - Zustimmung 50 % (Kopfleiste) gegen 54,2 % (Zeitung).
   - Inflation Türkei 34,9 % (2025, Vergleich in 052b) gegen 19,2 % (Kopfleiste).
   - EU-Inflation 3,2 gegen 2,2.
   - NATO „14 Mitglieder“ statt 32.
   - „Was Sie jetzt in Auftrag geben können“ zeigt 3 Vorhaben, die längst im Bau sind.
6. **Werte ohne Aussage.** „Index 100“ ×5, Kampfkraft 100, Heer/Luft/Marine 100, Gesperrte Medien 0, Ausweichen 0, Pressefreiheit als flache Linie. Was immer gleich ist, gehört nicht auf den ersten Bildschirm.
7. **Unbeschriftete Kostensymbole** (KAAN: 8 · 2.000 · 48 · +0,7 · 2,5) und Punktbalken ohne Zahl (Behörden, „Generation“).
8. **Fehlende Stellgrößen.** In Außen, Sicherheit und Medien gibt es zusammen genau einen Regler (052). Verteidigungsetat, Wehrdienst, Behördenetats und Medienaufsicht sind sichtbar, aber nicht stellbar.
   - Datenlücke: Ausgaben je Behörde und Verteidigungsetat in Lira; ohne sie ist kein Kreisdiagramm „wo gibt das Ministerium aus“ möglich.
9. **Gutes, das zum Muster werden sollte:** „Was EU von der Türkei will“ (Ist/Soll und Link), „Hier lohnt sich Pflege“ (Wirkung, Preis und Knopf in einer Zeile), Zeitung mit „Nicht in dieser Ausgabe“.

**Kartenprobleme**
1. **Die Karte ist keine Bühne.** Konflikte, Fronten, Zielräume, Truppen, Baustellen, Korridore und strategische Orte sind auf der Karte unsichtbar. Der Krieg wird in einer Textschublade der Akte Sicherheit geführt (057), Hearts of Iron ist hier das Gegenteil.
2. **Die Grundlinse „Politisch“ ist leer.** Es gibt keine Namen, keine Städte, keine Einfärbung.
3. **Tastenkonflikt 1–4 (Tempo gegen Linse).** Er macht 4 Linsen per Taste unerreichbar und lässt beim Blättern die Zeit laufen. Im Rundgang sind dabei zwei Monate vergangen und eine Entscheidung ist verfallen. Auch das Hauptmenü pausiert nicht.
4. **Überdeckung:**
   - Die Navigationsleiste verdeckt die erste Spalte des Linsenmenüs und die Ägäis.
   - Das Provinzfenster verdeckt die gewählte Provinz und „Marken auf der Karte“.
   - Das Versorgungsfenster schluckt Provinzklicks.
5. **Zu viele, zu ähnliche Linsen.** Es gibt 15 Linsen, davon 5 im selben Rot und 3 im selben Türkis. Flächenfärbung wird benutzt, wo Symbole gehören (Ressourcen, Strategische Orte, Kulturerbe), und Netze werden ohne Linien gezeigt (Versorgungswege mit „24 Korridore“, aber keiner sichtbar).
6. **Beziehungen nur für Nachbarn.** Die Weltmächte fehlen im Ausschnitt. Die Linse wäre die natürliche Hauptseite von Außen, ist aber eine von 15.

**Vorgeschlagene zusammengelegte Struktur (von 15 Seiten auf 4 Bildschirme)**

1. **„Welt“ (ersetzt Außen 051–055).** Ein Bildschirm.
   - Bühne: Die Karte in der Linse Beziehungen, beim Öffnen automatisch im Weltausschnitt, mit Einschüben für ferne Mächte.
   - Länder sind nach Haltung gefärbt. Linien zeigen Verträge (gold) und Konflikte (rot, Dicke = Eskalation), Symbole zeigen Sanktionen.
   - Ticker oben: Vorwarnungen (Hormus).
   - Kopf: Ansehen, EU-Vertrauen und Verträge mit Sparkline, dazu das Porträt des Außenministers.
   - Klick auf ein Land öffnet die Länderkarte: „Was sie wollen“ als Zeilen mit Regler und Inlandspreis, „Was wir anbieten“ als Verhandlungstisch inline, Reiter „Hintergrund“.
   - Unterer Rand: 3 Zeilen mit Regler, nämlich Diplomatischer Dienst (Etat), Energieimporte und Flucht/Rückkehr.
   - Blöcke und Bündnisse werden ein Umschalter der Karte.
   - Es fallen weg: die Seiten Weltlage-Kacheln, Behörden, Bilanz und Personen sowie die Unterreiter Staaten, Blöcke, Dienst und Vermittlung (Vermittlung wird eine Karte in der Länderansicht des betroffenen Konflikts).

2. **„Verteidigung“ (ersetzt Sicherheit 056–061).** Zwei Bildschirme.
   - **a) Lagekarte im Stil von Hearts of Iron.**
     - Konfliktgegner mit Eskalationsring und Nadel an der Grenze.
     - Im Krieg: Front, Zielräume als anklickbare Flächen, Einsatzart (4 Symbole) und Tempo (3er-Schalter) in einer Leiste unten.
     - Strategische Orte als Symbole, Bündnisse als Umschalter.
     - Dazu die Konfliktdossiers, die heute doppelt in Außen und Sicherheit stecken. Die Konfliktlage-Liste fällt weg.
   - **b) Streitkräfte und Bau.**
     - Links ein Radar mit 5 Achsen (Bereitschaft gegen Modernität).
     - Darunter Zeilen mit Regler: Verteidigungsetat, Wehrdienst, Munition und die 4 Sicherheitsbehörden mit Etat. Lira-Beträge, sobald Daten da sind, sonst die Lücke benennen.
     - Rechts eine einzige Bauliste (zivil und militärisch gemeinsam, ziehbar, einmal Pausieren) mit Baukapazitäts-Balken, Pflege in derselben Zeilenform und neue Vorhaben mit beschrifteten Kosten.
   - Friedensprozess und Terror kommen aus Außen hierher (Innere Sicherheit als Zeile mit Stufenregler).
   - Porträts (Generalstab, Innenministerin, MİT, Verteidigungsminister fehlt) in den Kopf. Es fallen weg: Behörden, Bilanz und Personen als eigene Seiten.

3. **„Medien“ (ersetzt 062–065).** Ein Bildschirm.
   - Oben zwei Titelseiten nebeneinander (Staatsbote ↔ Widerspruch), darunter „Nicht in dieser Ausgabe“ als durchgestrichene Zeilen.
   - Rechts ein Ring des Medienmarkts (7 Gruppen, Farbe nach Nähe zur Regierung, Größe nach Reichweite, die Reichweite ist eine Datenlücke). Ein Klick auf ein Segment zeigt Eigentümer und Handlungen.
   - Darunter 3 Regler (Medienaufsicht, Staatswerbung, Netzsperren), jeder mit dem Preis bei Pressefreiheit, EU-Vertrauen und Abwanderung in soziale Netze.
   - Archiv als Zeitleiste. Der Zähler nur für Ausgaben, die den Spieler betreffen.
   - „Zahlen des Monats“ ist an die Kopfleiste gekoppelt.

4. **Karte (global).**
   - 8 statt 15 Linsen als Symbolleiste unten: Rückhalt (Grundlinse), Wahl, Wirtschaft, Arbeit, Netze (Straße/Bahn/Belastung/Versorgung umschaltbar, als Linien), Krisen (Probleme und Risiko, als Symbole), Ressourcen (Symbole), Welt.
   - Tempo auf Leertaste und +/−, Linsen auf 1–8. Menü und Linsenwechsel lassen die Zeit nie laufen, das Menü pausiert.
   - Ein Provinzklick zeigt immer eine kompakte Provinzkarte mit Handlungen (Problem lösen, Bauen), die neben der Provinz andockt. Die Auswahl nur als Umriss.
   - Weg von der Karte: der Kasten „TÜRKİYE · 81 Provinzen“ und der Effekte-Knopf (steht schon im Menü). Die Legende erscheint automatisch mit der Linse.
   - Sowohl „Welt“ als auch „Verteidigung“ öffnen direkt auf der Karte. Die Akte ist dann ein Seitenfenster, kein Vollbild-Papier über der Karte.
