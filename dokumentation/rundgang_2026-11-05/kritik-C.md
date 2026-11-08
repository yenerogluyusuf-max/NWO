# Kritik C: Land (034–042) und Forschung & Ziele (043–050)

Grundlage: Bildschirmfotos 1440×900 (Stand 3. Februar 2030), seiten.json, Code unter game/src/ui (akte/Bereiche.tsx, akte/Bildkarten.tsx, katastrophe/Lage.tsx, behoerden/Behoerde.tsx, fokus/Fokusbaum.tsx, wissen/Wissensbaum.tsx, grosseziele/GrosseZiele.tsx).

Gilt für alle Seiten beider Akten: Der Aktenkopf (Titel, Datum, drei Kennzahlen) und zwei Reiterzeilen belegen etwa 230 px, also gut ein Viertel der sichtbaren Höhe, noch bevor Inhalt kommt. Bei Land stehen 9 Reiter in zwei Zeilen (6 + 3), bei Forschung 8 Reiter. Die Karte, das eigentliche Bild des Landes, liegt verdeckt hinter der Akte.

---

### Land › Lage der Regionen (034.png)
- **Frage des Spielers:** Wo im Land brennt es, welche Region braucht mich, und was kann ich jetzt bauen?
- **Urteil:** missverständlich, doppelt, sinnlos (als Titel)
- **Befund:**
  - Der Reiter heißt „Lage der Regionen“, aber auf der Seite steht keine einzige Region: keine Karte, keine Provinzliste, kein Ost-West-Gefälle. Die Frage „wo?“ bleibt unbeantwortet.
  - Das Urteil „Lage: ruhig – Keine der Kernzahlen steht im roten Bereich“ widerspricht dem Rest der Akte: In Netze stehen Engpässe von 109 % (İstanbul) und 118 % (Burdur), in Infrastruktur steht Bahnnetz 35 und Wasserversorgung 49 im roten Balken.
  - Vier Bildkarten (Wiederaufbau, Kanal Istanbul, Ost-West-Stromachse, Bahn Kars–Tiflis) zeigen Preise als Ikonen mit nackten Zahlen (12, 3.200, 60 Mon., +0,9 Pp., 3). Ohne Darüberfahren weiß man nicht, welche Ikone Kapital, Baupunkte oder Verwaltungskraft ist. „GEO: Vertrauen +3“, „AZE“, „RUS“, „UKR“ sind Länderkürzel ohne Erklärung.
  - Die Karten sind abgeschnitten (die Kehrseiten-Zeile „Ein zweites Gleis für Personen bindet…“ bricht am Rand ab). Seite 1.191 px bei 4 Karten.
  - Der Wiederaufbau im Erdbebengebiet steht hier als Großprojekt „im Bau“ mit „Versprechen gegen Lieferung“, der Reiter „Bau & Umsetzung“ meldet aber „Noch keine Vorgänge“ (siehe 042). Derselbe Wiederaufbau steht zusätzlich in Programme (047) und unter Katastrophen › Versprechen.
- **Klicks:**
  - „Infrastruktur und Bau öffnen“ (oben rechts): springt in den Reiter 035. Doppelt mit dem Reiter direkt darüber. Weg.
  - „Baustelle ansehen →“, „Prüfen“, „Weg dahin“ auf jeder Karte: laut Code (Bildkarten.tsx, `oeffnen`) landen ALLE vier Knöpfe im selben Reiter „Infrastruktur und Bau“, nicht beim gewählten Vorhaben. Der Spieler muss es dort in „Neue Vorhaben (20)“ wieder suchen. Besser: Klick öffnet das Vorhaben direkt (WunderFenster) und zeigt es auf der Karte.
  - Sechs Knöpfe insgesamt, keiner davon handelt.
- **Vorschlag:** Diese Seite wird die Kartenseite des Landes: Türkei-Karte mit 81 Provinzen, eingefärbt nach einem wählbaren Wert (Infrastruktur, Wasser, Wohnungsnot, Gefährdung), darauf die Baustellen als animierte Kräne und die möglichen Großprojekte als gestrichelte Umrisse am echten Ort (Kanal westlich von İstanbul, Trasse Kars–Tiflis). Klick auf Provinz → Provinzkarte mit ihren Werten und den Vorhaben dort. Klick auf Umriss → Vorhaben mit Preis und Knopf „Bauen“. Rechts eine schmale Spalte „Drei schwächste Provinzen“ statt des Urteils „ruhig“. Kein Weiterleitungsknopf.

### Land › Infrastruktur und Bau (035.png, 035b.png)
- **Frage des Spielers:** Was baue ich gerade, was kostet mich die Kapazität, und was baue ich als Nächstes?
- **Urteil:** zu lang, zu kompliziert, doppelt, missverständlich
- **Befund:**
  - 2.213 px, 591 Wörter, 20 Knöpfe, dazu drei Unterreiter (Lage / Bauwerke pflegen 8 / Neue Vorhaben 20). Damit ist es eine Akte in der Akte: Bereichsreiter → Unterreiter → lange Seite.
  - Acht Balken (Straßen 60, Bahnnetz 35, Stau 61, Logistik 62, Breitband 54, Strom 62▼, Wasser 49, Zustand der Anlagen 55) ohne Richtung: Bei „Stau in den Städten 61“ ist hoch schlecht, bei allen anderen gut; der Balken ist rot, sagt aber nicht warum. Welcher davon die Kopfzahl „Infrastruktur 60“ ergibt, steht nirgends.
  - Die Baureihenfolge enthält F-16 Block 70, „Stahlkuppel: mehrschichtige Luftverteidigung“ und Kampfpanzer Altay T1. Rüstungsbeschaffung in der Akte Land unter „Infrastruktur und Bau“ ist für den Spieler unverständlich, auch wenn es dieselbe Baukapazität ist. Das muss mindestens markiert (Ikone „Rüstung“) oder mit Sicherheit verknüpft sein.
  - Jede Zeile trägt denselben gelben Stempel „TRANSPARENTE AUSSCHREIBUNG“: viermal identisch, keine Information. Die Zeilen sind falsch gebaut: Positionsziffer ganz links, Name und Text rechtsbündig, dazwischen 500 px Leere.
  - „Was den Bau beschleunigt“ ist zugeklappt, obwohl genau das die Frage zur Baukapazität beantwortet (99 von 133 verplant).
  - „Vorteile“ (Drehkreuz zwischen Europa und Asien, Land der großen Bauten, Raumfahrtnation) stehen hier und ein zweites Mal mit anderem Inhalt unter Kultur (037b). Raumfahrtnation unter „Infrastruktur“ ist falsch einsortiert.
- **Klicks:**
  - Unterreiter „Lage“, „Bauwerke pflegen 8“, „Neue Vorhaben 20“: drei Unterseiten. „Lage“ wiederholt 034 in anderer Form. Besser: keine Unterreiter, eine Liste mit Filterchips.
  - „Instandsetzen“ (je Bauwerk): nötig, Preis steht daneben (2 Kapital · 150 Baupunkte · 8 Monate), gut. Aber die Wirkungszeilen (Wasserversorgung +2,6 in 8 Provinzen (heute 39)…) sind lang; vier Chips pro Bauwerk.
  - ▲ / ▼ je Zeile der Baureihenfolge: nötig, aber der Preis „10 Verwaltungskraft je Position“ steht nur in der Überschrift, nicht am Knopf.
  - „Pausieren“ je Zeile: nötig, Folge (Kosten? Verfall?) steht nicht da.
- **Vorschlag:** Eine Bauleiste, wie die Produktionsschlange in Civilization: oben ein Balken „Baukapazität 133“, aufgeteilt in farbige Blöcke je laufendem Vorhaben (Wiederaufbau 36, Stahlkuppel 25, F-16 20, Altay 18, frei 34). Blöcke ziehen = Reihenfolge ändern, Preis erscheint beim Ziehen. Darunter die acht Netzwerte als eine Zeile Ikonen mit Ampelfarbe und Pfeil (gut ist oben). Pflegen und Neue Vorhaben gehören auf die Karte (034): Bauwerk auf der Karte anklicken → Instandsetzen. Vorteile als drei kleine Siegel mit Fortschritt („2 von 5 Großprojekten“), nicht als lange Kästen.

### Land › Netze (036.png)
- **Frage des Spielers:** Wo ist das Land überlastet, und was kostet der Ausbau?
- **Urteil:** missverständlich, unschön, doppelt
- **Befund:**
  - Neun Kacheln mit Auslastung (Straßen 74 %, Bahn 70 %, Seehäfen 80 %, Flughäfen 73 %, Strom 76 %, Wasser 71 %, Internet 69 %, Wohnungen 83 %, Kliniken 75 %). Oben steht „0 Netze überlastet“, in den Kacheln stehen aber Engpässe von 109 %, 118 % und 104 %. Der Landesschnitt verdeckt die Überlast; der Spieler liest „alles gut“ und „es brennt“ gleichzeitig.
  - „Finanzierung aus dem Posten ‚Öffentliche Investitionen‘ (Stufe 0)“: Stufe 0 heißt, es gibt kein Geld für Ausbau, das ist die wichtigste Nachricht der Seite und steht als graue Fußnote. Kein Verweis zum Haushalt.
  - „0 Ausbauten laufen“, der Kopf meldet „Bauvorhaben im Bau 4“. Zwei Bauarten (Netzausbau und Bauvorhaben) laufen nebeneinander, ohne dass der Unterschied erklärt wird.
  - Dieselben Größen heißen in 035 anders: „Straßen und Autobahnen 60“ (Zustand) gegen „74 % Auslastung“ hier gegen „Autobahn- und Brückenbau Stufe 55“ in Programme (047b). Drei Zahlen für Straßen auf drei Seiten.
  - 0 Knöpfe, 0 Regler: reine Anzeige. „Großinvestitionsprogramme“ liegt unter dem Rand, ohne dass man es sieht. Kacheln sind halb leer (Seehäfen ohne Engpasszeile), die neunte Kachel „Kliniken“ hängt allein in einer Reihe.
- **Klicks:** Keine. Weder Kachel noch Engpass-Provinz ist anklickbar. Besser: Kachel → Karte mit diesem Netz als Ebene; Engpass „İstanbul (109 %)“ → Provinz auf der Karte.
- **Vorschlag:** Als eigene Seite streichen. Die Netze werden Kartenebenen in der Kartenseite (034): Ebene „Bahn“ zeigt Strecken, rot wo über 100 %. Die Auslastung je Netz als ein Balkendiagramm (neun Balken, Linie bei 100 %, Engpass-Provinz als Marke darüber). Die Finanzierung als Regler-Zeile „Öffentliche Investitionen: Stufe 0“ mit Preis und Wirkung, wie im Haushalt.

### Land › Kultur und Erbe (037.png, 037b.png)
- **Frage des Spielers:** Welches Erbe verfällt, und was bringt mir Restaurieren?
- **Urteil:** doppelt, zu lang, missverständlich
- **Befund:**
  - Gleiches Gerüst wie 035: dieselben Unterreiter (Lage / Stätten pflegen 9 / Neue Vorhaben 16), derselbe Block Verwaltungskraft 99 / Baukapazität 133, derselbe zugeklappte Kasten „Was den Bau beschleunigt“, dieselbe Baureihenfolge mit Wiederaufbau, F-16 Block 70, Stahlkuppel und Altay T1. Kampfjets unter „Kultur und Erbe“ sind absurd.
  - „Am schlechtesten erhalten“: Hasankeyf (Zustand 14), Antakya (21) mit langen Texten. Der Text „Hasankeyf: 2020 vom Ilısu-Stausee überflutet“ wiederholt den Namen. Restaurieren Zustand 14 → 40 bringt „Nationale Identität +0,3 in 1 Provinz“: Der Spieler sieht sofort, dass es kaum etwas bringt, warum dann 2 Kapital und 100 Baupunkte? Die eigentliche Begründung (Tourismus, Ansehen) fehlt in der Wirkung.
  - Fünf Balken (Erhaltung 62, Identität 56, Vielfalt 40, Tourismus 68, Ansehen 46), davon zwei, die eigentlich zur Gesellschaft bzw. zum Außen gehören.
  - 1.956 px, 18 Knöpfe.
- **Klicks:**
  - Unterreiter wie 035, gleiche Kritik.
  - „Restaurieren“ je Stätte: nötig, Preis steht da, gut.
  - ▲ / ▼ / „Pausieren“ in der Baureihenfolge: doppelt mit 035; hier wegnehmen.
- **Vorschlag:** Kein eigener Reiter. Kulturstätten sind Orte: auf der Karte als Säulen-Ikone mit Zustandsfarbe (Hasankeyf rot). Klick → kleine Karte mit Zustandsbalken, Preis, „Restaurieren“. In der Bauleiste (siehe 035) erscheinen Restaurierungen als Blöcke. Die Vorteile „Kulturnation“ und „Land der Vielfalt“ als Siegel in derselben Siegelreihe wie in 035.

### Land › Katastrophen und Wiederaufbau (038.png, 038b.png)
- **Frage des Spielers:** Wie gut bin ich auf das nächste Beben vorbereitet, und was mache ich, wenn es kommt?
- **Urteil:** zu lang, unschön (Darstellungsfehler), zu kompliziert, doppelt
- **Befund:**
  - 3.596 px, längste Seite der Akte, 735 Wörter, eigene zweite Reiterleiste (Lage und Vorsorge / Laufende Fälle / Versprechen / Chronik) in dunklem Kasten, dazu drei Kennzahl-Pillen (Bereitschaft 45, Laufende Fälle 0, Politisches Kapital 113), die zum Teil den Aktenkopf wiederholen (Offene Katastrophenfälle 0).
  - Darstellungsfehler: Im ersten Bild (038) ist die linke Spalte ein leerer weißer Kasten, die Mitte zeigt nur „Gefährdung des Landes“ ohne Inhalt. In 038b überlappt der Text der linken Spalte („Bei einer schweren Katastrophe sterben nach Modellrechnung etwa 20,3 P…“) die mittlere Spalte und wird mitten im Wort abgeschnitten. Drei schmale Spalten mit sehr unterschiedlich langem Inhalt: das Layout bricht.
  - Die Vorsorge-Hebel (AFAD-Ausbau Stufe 40, Gebäude-Verstärkung Stufe 23) haben einen Balken ohne Füllung mit einem beigen Kästchen darauf: Er sieht wie ein kaputter Regler aus, man kann ihn aber nicht ziehen. Gestellt wird erst über „Als Gesetz einbringen 9 Kapital“.
  - AFAD gibt es doppelt: als Maßnahme „Ausbau der Katastrophenbehörde (AFAD), Stufe 40 → 60“ hier und als Behörde mit Personal/Technik/Reichweite in 039. Zwei verschiedene Ausbausysteme für dieselbe Behörde.
  - Gefährdungen als hohe Karten mit Prozent (Westanatolische Grabensysteme etwa 7,0 %, Sturzflut am Schwarzen Meer etwa 22 %, Großbrand etwa 22 %) und langen Provinzlisten („İzmir, Antalya, Manisa, Aydın, Muğla und 12 weitere“), die nach einer Karte schreien.
- **Klicks:**
  - Innere Reiter „Lage und Vorsorge“, „Laufende Fälle“, „Versprechen“, „Chronik“: vierte Navigationsebene. „Laufende Fälle“ ist bei 0 Fällen leer; „Versprechen“ doppelt mit „Bau & Umsetzung“ (042).
  - „Als Gesetz einbringen 9 Kapital“: nötig, aber geht in den Gesetzgebungsweg, ohne dass die Dauer bis zur Wirkung hier zusammengerechnet wird (Parlament + 12 Monate Verzug).
  - „Im Politikfenster ansehen“: springt in die Politik-Maßnahmentafel. Doppelt; der Regler sollte hier liegen und dieselbe Maßnahme sein.
  - Szenario „Was wäre, wenn …“ (3 Regler laut seiten.json): ganz unten nach 3.000 px, wo es niemand findet; dabei ist es das Spielerischste der Seite.
- **Vorschlag:** Oben ein Bild: Türkei-Karte mit den Verwerfungen als rote Linien und Flut-/Brand-/Dürregebieten als Flächen, Wahrscheinlichkeit als Farbstärke. Daneben ein Halbrund „Bereitschaft 45 / 100“ mit Marke „Referenz 20“. Darunter die fünf Vorsorge-Hebel als echte Reglerzeilen (Stufe, Preis in Kapital und % des BIP, Monate bis Wirkung), wie in Politik. Das Szenario als Knopf „Beben simulieren“ direkt an der Karte: Verwerfung anklicken, Stärke ziehen, Tote/Schaden erscheinen. Laufende Fälle erscheinen nur, wenn es welche gibt, als rote Marke auf der Karte und im Schreibtisch. Versprechen und Chronik als Reiter unten. Ziel: höchstens 1.200 px.

### Land › Behörden (039.png)
- **Frage des Spielers:** Kann meine Verwaltung das leisten, und wo muss ich nachlegen?
- **Urteil:** fast leer, doppelt, missverständlich
- **Befund:**
  - Eine einzige Karte (AFAD) auf einer Seite von 623 px; der Rest ist leer. Oben ein Kasten nur für den Satz „Ausbau kostet Kapital, Geld und Zeit…“ und die Zahlen „0 im Ausbau, 1 Etat knapp“.
  - „Etat ohne Spielraum“ als kleine Pille, kein Hinweis, was das bedeutet oder wo man es ändert.
  - Personal/Technik/Reichweite als je fünf Punkte ohne Zahl.
  - Doppelt zu 038 (AFAD-Ausbau als Maßnahme). Andere Behörden der Bauverwaltung (TOKİ, Straßenbau, DSİ) fehlen, obwohl es um Bau geht. Datenlücke: Ob diese Behörden im Modell existieren, ist aus der Oberfläche nicht zu erkennen.
- **Klicks:** Die Karte ist laut Code anklickbar (öffnet eine Detailleiste mit „Ausbauen“ und „Kürzen“), sieht aber nicht so aus: kein Pfeil, kein Knopf. seiten.json zählt 0 Knöpfe. Besser: sichtbarer Knopf „Ausbauen“ mit Preis an der Karte.
- **Vorschlag:** Reiter streichen. AFAD wandert als Zeile in die Vorsorge der Katastrophenseite (dort ist der Ausbau ohnehin), mit Regler und Preis. Für alle Behörden des Spiels eine Übersicht in Kabinett & Verwaltung; im Bereich nur ein Satz „AFAD: Etat knapp → Haushalt“.

### Land › Entwicklung des Landes (040.png)
- **Frage des Spielers:** Wird das Land besser oder schlechter?
- **Urteil:** sinnlos, doppelt, missverständlich
- **Befund:**
  - Das einzige Diagramm ist „Zustimmung 52 → 50 %“, also die landesweite Zustimmung zur Regierung, nicht die Entwicklung des Landes. Laut Code (verlaufsReihen) zeigt jeder Bereich außer Gesellschaft und Medien genau diese Kurve: dieselbe Kurve steht auf 049 und vermutlich in vier weiteren Akten.
  - Die y-Achse reicht nur von 50 bis 52: ein Rückgang um 2 Punkte sieht aus wie ein Absturz. Irreführend.
  - Wirkungsberichte: zweimal „Gebäude-Verstärkungsprogramm … noch keine Wirkung messbar“, gleicher Text im Abstand von 6 Monaten. Rauschen.
  - Infrastruktur 60, Netzauslastung, Kulturerbe 63, Bereitschaft 45 als Verlauf fehlen völlig, obwohl genau das die Frage beantworten würde. Datenlücke, falls diese Werte nicht monatlich gespeichert werden.
- **Klicks:** Keine.
- **Vorschlag:** Als eigener Reiter streichen. In die Kartenseite einen Zeitregler „2028 ↔ heute“ einbauen, der die Provinzfarben zurückspult (wenn Verlaufsdaten je Provinz vorliegen; sonst Datenlücke). Ersatzweise ein kleines Kurvenbündel (Infrastruktur, Wasser, Kulturerbe, Bereitschaft) mit Nullachse unten. Wirkungsberichte als Reiter „Verlauf“ unten, gleiche Meldungen zusammenfassen.

### Land › Zuständige Minister (041.png)
- **Frage des Spielers:** Wer setzt das für mich um, und zieht er mit?
- **Urteil:** fast leer, missverständlich
- **Befund:**
  - Zwei Karten: Selin Koçak (Innenministerin, distanziert 48) und Murat Erdem (Wirtschaftsminister, distanziert 40). Für Bau, Netze, Kultur und Katastrophen ist keiner der beiden das naheliegende Ressort; ein Bau-, Verkehrs- oder Kulturminister fehlt. Laut Code fest verdrahtet (BEREICH_AEMTER: land = inneres, wirtschaft).
  - Murat Erdem erscheint identisch auch im Forschungskabinett (050).
  - Was „distanziert (48)“ für den Bau bedeutet (Verzögerung? Widerstand?), steht nicht da.
  - 33 Wörter, 0 Knöpfe, zwei Drittel der Seite leer.
- **Klicks:** Keine. Porträt führt nicht zur Person.
- **Vorschlag:** Reiter streichen. Die zuständige Person als kleines Porträt in den Aktenkopf (wie ein Berater in Civilization), Klick → Personenakte. Wenn Haltung die Bauzeit beeinflusst: am Vorhaben „Koçak bremst: +2 Monate“. Sonst weg.

### Land › Bau & Umsetzung (042.png)
- **Frage des Spielers:** Was habe ich versprochen, und halte ich es ein?
- **Urteil:** fast leer, missverständlich, doppelt
- **Befund:**
  - Ein Satz („Noch keine Vorgänge. Sie entstehen aus Wahlversprechen, Zusagen nach Katastrophen oder eigenen Beschlüssen.“), 13 Wörter, 90 % der Seite leer.
  - Widerspruch: Der Kopf zeigt „Bauvorhaben im Bau 4“, die Lage zeigt den Wiederaufbau mit „Versprechen gegen Lieferung“, und hier heißt es „keine Vorgänge“. Der Spieler kann nicht verstehen, dass „Vorgang“ etwas anderes ist als „Bauvorhaben“.
  - Doppelt mit Katastrophen › Versprechen und mit der Baureihenfolge.
- **Klicks:** Keine.
- **Vorschlag:** Reiter streichen. Vorgänge (Wohnungsbau aus Zusagen) werden Blöcke in der Bauleiste mit einem Siegel „versprochen bis …“ und erscheinen im Schreibtisch, wenn eine Frist droht. Leere Reiter grundsätzlich nicht anzeigen.

### Forschung & Ziele › Stand der Agenda (043.png)
- **Frage des Spielers:** Woran arbeite ich gerade, und was sollte ich als Nächstes anstoßen?
- **Urteil:** doppelt, missverständlich, unschön
- **Befund:**
  - „Lage: gemischt – Auffällig: Foki vollendet: 0 · Hochschulen: 44“ wiederholt wörtlich zwei der drei Kopfzahlen.
  - Vier Abschnitte nur als Text-Kacheln: Fokus („Kein Fokus läuft: 7 Wege sind jetzt offen“, ohne die 7 Wege zu nennen), Wissensbaum (Hürjet, Triebwerk, KAAN, TF-2000 jeweils nur „Möglich“), Ziele der Amtszeit, Programme („Keine Einträge in Programmschritte in Arbeit“, am Rand abgeschnitten, sprachlich kaputt).
  - Zweierlei „Ziele“: Hier „Ziele der Amtszeit“ (Inflation unter 15 %, Wohnungsnot, Verlässliche Partner), im Kopf „Ziele erreicht 1 / 3“, im Reiter „Große Ziele“ (Union der Turkstaaten …, „0 verfolgt“). Welche „1“ erreicht ist, sieht man nirgends.
  - Der „Wissensbaum“ zeigt ausschließlich Rüstung (Hürjet, KAAN, Zerstörer). Für einen Bereich „Forschung“ falsches Signal.
- **Klicks:**
  - „Fokusbaum öffnen“: springt in den Reiter 044, doppelt mit dem Reiter. Weg.
  - „Woher die Zahlen kommen“: aufklappen, wiederholt Kopfhinweise. Weg.
  - Kacheln Hürjet usw.: nicht anklickbar (1 Knopf auf der Seite). Besser: Klick öffnet den Knoten im Baum.
  - „2 weitere Einträge“: Aufklapper für zwei Kacheln. Unnötig.
- **Vorschlag:** Streichen und durch einen Startbildschirm ersetzen, der wie die Civ-Leiste „Forschung / Ausrichtung“ funktioniert: drei große Felder nebeneinander: „Fokus“ (Rad mit Restzeit oder „Wähle einen Fokus“ blinkend), „Forschung“ (Ikone des laufenden Projekts, Ring mit Monaten), „Programm“ (zwei Plätze). Jedes Feld führt direkt in seinen Baum. Die Ziele der Amtszeit gehören auf den Schreibtisch oder in den Kopf, nicht hierher.

### Forschung & Ziele › Fokusbaum (044.png)
- **Frage des Spielers:** Welchen Weg schlage ich ein, und was verbaue ich mir damit?
- **Urteil:** zu kompliziert, unschön (unlesbar), richtige Idee
- **Befund:**
  - Gute Grundidee (Hearts-of-Iron-Fokusbaum, 102 Foki in 7 Ästen, rote gekreuzte Linien für Gegenwege). Aber in der Ansicht „Ganzer Baum“ sind die Knotenbeschriftungen etwa 5 px groß und abgeschnitten („Rückkehr zur geldpol…“, „Magnet für Auslandsinvest…“). Man kann nichts lesen, ohne zu zoomen.
  - 113 Knöpfe auf einer Fläche von etwa 950 × 440 px. Alle Knoten sehen gleich aus (beige Kästchen), egal ob möglich, gesperrt oder durch Gegenweg ausgeschlossen. „7 jetzt möglich“ muss man suchen.
  - Keine Ikonen, keine Farben je Ast außer der kleinen Kopfzeile; die sieben Äste haben gleiches Gewicht, obwohl der Spieler zu Beginn nur 7 Knoten wählen kann.
  - Die Legende „Linie: Vorgänger · gekreuzte rote Linie: Gegenwege schließen sich aus“ steht klein unten.
- **Klicks:**
  - „+“ / „−“ / „Ganzer Baum“ / „Vollbild“: nötig für einen großen Baum, aber Vollbild sollte Standard sein: In der Akte hat der Baum nur gut die Hälfte des Bildschirms.
  - Ast-Kopf (z. B. „WIRTSCHAFTSORDNUNG“): zoomt auf den Ast. Gut.
  - Knoten: öffnet Detail mit „Beginnen“, Gegenwegen, Verweisen in Politik und Parlament. Gut, aber nur nach Zoom treffbar.
- **Vorschlag:** Startansicht nicht „Ganzer Baum“, sondern die sieben Äste als sieben große Ikonen-Säulen (Waage, Globus, Säule, Menschen, Schild, Brücke, Atom), darin nur die jeweils nächste wählbare Stufe groß und hell, alles Spätere klein und blass. Mögliche Knoten golden leuchten lassen, ausgeschlossene grau mit Schloss. Beim Darüberfahren die Gegenwege rot aufleuchten lassen (wie Democracy-4-Verbindungen). Vollbild ohne Aktenkopf als Standard.

### Forschung & Ziele › Große Ziele (045.png, 045b.png)
- **Frage des Spielers:** Welches große Vermächtnis will ich erreichen, und wie groß ist meine Chance?
- **Urteil:** zu lang, doppelt
- **Befund:**
  - Zehn große Karten à etwa 460 px Höhe in drei Spalten, 2.264 px, 537 Wörter. Jede Karte: Strichzeichnung, Titel, drei Zeilen Text, „Nächste Stufe“, Aussichtsbalken mit Prozentspanne, Dafür/Dagegen, „Voraussetzungen“ zum Aufklappen, Knopf.
  - Die Strichzeichnungen sind schön, aber gleichförmig (gelbe Linien auf Braun); die drei Punkte „○○○“ (Stufen) sind winzig und ohne Beschriftung.
  - Spannen wie „etwa 34–54 %“ sind für eine Entscheidung zu ungenau, und „aussichtsreich“ bei 34–54 % ist missverständlich.
  - Überschneidung mit Fokusbaum und Programmen: „Energieunabhängigkeit“ (Gas aus Sakarya, Akkuyu) gegen Programm „Wasser und Energie der Zukunft“ gegen Fokusast „Land, Regionen & Megaprojekte“; „Versöhnung im Innern“ gegen Programm „Rechtsstaat und Vertrauen“. Drei Systeme für langfristige Ziele.
  - „Höchstens 3 Ziele gleichzeitig (0 verfolgt)“, im Kopf aber „Ziele erreicht 1 / 3“: andere Ziele, gleiches Wort.
- **Klicks:**
  - „Als Ziel verfolgen →“ (10×): nötig. Pfeil suggeriert einen Sprung, es ist aber ein Schalter.
  - „Voraussetzungen“ (10× aufklappen): nötig, aber besser als Ikonenreihe sichtbar (grün/rot), nicht zugeklappt.
- **Vorschlag:** Mit Programmen zusammenlegen zu „Vermächtnis“: ein Bildschirm mit zehn Wappen/Monumenten im Kreis oder als Reihe (wie Civilization-Siegtypen), jede mit Stufenring (Stufe 0/3) und Chancenzahl. Klick öffnet die Karte rechts. Höchstens drei aktiv, als drei Sockel oben, auf die man ein Ziel zieht. Dafür/Dagegen als grüne/rote Ikonen. Ziel 1 Bildschirm Höhe.

### Forschung & Ziele › Wissensbaum (046.png)
- **Frage des Spielers:** Was wird gerade erforscht, wie schnell, und was kommt als Nächstes?
- **Urteil:** passt (als Kurzansicht), aber doppelt und missverständlich
- **Befund:**
  - Kompakt und lesbar: Forschungstempo ×1,0, zwei laufende Projekte mit Balken (Kampfpanzer Altay in 25 Monaten, Stahlkuppel in 31 Monaten), drei nächste mit Preis (Hürjet 3 Kapital · etwa 20 Monate…). Das ist die beste Seite der Akte.
  - Der Baum selbst ist hinter „Baum öffnen“ versteckt; der Reiter heißt „Wissensbaum“, zeigt aber keinen Baum.
  - Altay und Stahlkuppel stehen hier als Forschung „in Arbeit“ und gleichzeitig in der Baureihenfolge der Akte Land (035b, 037b) mit anderen Restzeiten (Altay: 25 Monate hier, „fertig in etwa 25 Monaten“ dort; Stahlkuppel 31). Ist das Forschung oder Bau? Für den Spieler unklar.
  - Der Hauptsatz „10 Technologien warten auf mehr Ingenieure: Bildung und Hochschulen öffnen den Baum, mit Jahren Verzug“ nennt die Lösung, aber ohne Knopf dorthin. „Forschungsetat 0,4 % des BIP, Innovationsgrenze 0,7 %“: kein Regler, obwohl das die Stellgröße ist.
  - Untere 40 % der Seite leer.
- **Klicks:**
  - „Baum öffnen“: öffnet das Baumfenster (Civ-6-Vorbild). Nötig, sollte aber die Seite selbst sein.
  - Einträge Altay, Stahlkuppel, Hürjet …: öffnen den Baum mit dem Knoten. Gut.
  - „und 1 weitere“: kein Knopf, toter Text.
- **Vorschlag:** Der Reiter zeigt den Baum direkt (Civilization-Technologiebaum, Ikonen statt Kästen, Zeitachse links nach rechts). Oben eine Zeile mit Regler „Forschungsetat 0,4 % des BIP“ und Wirkung auf das Tempo. Die laufenden Projekte als leuchtende Knoten mit Ring. Fokusbaum und Wissensbaum als zwei Ansichten desselben Bildschirms (Umschalter „Politik-Fokus / Technik“) statt zwei Reitern plus Agenda.

### Forschung & Ziele › Programme (047.png, 047b.png)
- **Frage des Spielers:** Welches Mehrjahresprogramm treibe ich voran, und was fehlt für den nächsten Schritt?
- **Urteil:** zu lang, zu kompliziert, doppelt
- **Befund:**
  - 2.657 px, 604 Wörter, acht Programmkarten à etwa 560 px. Oben ein großer Titel „Pläne für Jahre“ mit drei Zeilen Erklärung, drei Kennzahlkästen (0 von 2 Plätzen belegt, 2 Schritte bereit, 0/8 Programme erfüllt) und zwei leere gestrichelte Kästen „PLATZ FREI – Ein bereiter Schritt kann hier laufen“. Bevor das erste Programm erscheint, sind 300 px verbraucht.
  - Jede Karte: Ikone, Titel, Status-Pille („Schritt bereit“, „Noch nicht begonnen“), 0/5, zwei Zeilen Text, Stufenleiste 1–5, Kasten „Als Nächstes / Nächste Station“ mit Voraussetzung, Verweis, „Danach“-Wirkung, Preis, „Alle 5 Schritte ansehen“. Sehr viel Text für eine Entscheidung.
  - Die Voraussetzungen widersprechen den Zahlen anderer Seiten: „Autobahn- und Brückenbau mindestens auf Stufe 60 (jetzt 55)“, in 035 steht „Straßen und Autobahnen 60“. Der Spieler hält 60 für erfüllt.
  - „Wiederaufbau und Erdbebenschutz“ ist das vierte Mal Erdbeben in zwei Akten (Land Lage, Katastrophen, Bau & Umsetzung, hier).
  - Das System (Programmschritte belegen 2 Plätze) überschneidet sich mit Fokus (1 Platz) und Großen Zielen (3 Plätze). Drei Arten von Plätzen für langfristige Politik.
- **Klicks:**
  - „ausbauen: Autobahn- und Brückenbau“, „ausweiten: Hausarztsystem“ usw. (rote Verweise): springen zur Maßnahme in Politik. Nötig, gut. Besser: Regler gleich hier.
  - „Alle 5 Schritte ansehen“: klappt die Leiste auf. Die Stufenleiste 1–5 darüber könnte das selbst (Klick auf Stufe).
  - Knopf zum Starten eines bereiten Schritts: liegt unterhalb des sichtbaren Teils; auf dem ersten Bild ist kein einziger Handlungsknopf zu sehen.
- **Vorschlag:** Mit Großen Zielen zu „Vermächtnis“ zusammenlegen, oder die Programme als Ketten direkt in den Fokusbaum hängen (ein Programmschritt = ein Knoten mit Bedingung). Wenn eigene Seite: acht Zeilen statt acht Karten, je Zeile Ikone, Name, fünf Stufenpunkte, nächster Schritt mit grünem/rotem Häkchen, Knopf „Starten“. Die zwei Plätze als zwei Sockel oben, auf die man eine Zeile zieht. Unter 900 px.

### Forschung & Ziele › Behörden (048.png)
- **Frage des Spielers:** Reichen Hochschulen und Bildungsverwaltung für mehr Forschung?
- **Urteil:** fast leer, doppelt
- **Befund:**
  - Wie 039: eine Karte (Bildungsverwaltung, Ebru Akın, „Etat ohne Spielraum“), ein Erklärsatz, „0 im Ausbau, 1 Etat knapp“. 32 Wörter.
  - Die Bildungsverwaltung gehört auch zur Gesellschaft (Bildung). Ebru Akın leitet die Behörde, fehlt aber im Forschungskabinett (050).
  - Was ist „Hochschulen 44“ im Kopf, und hängt es an dieser Behörde? Kein Zusammenhang sichtbar.
- **Klicks:** Karte anklickbar (Detail), aber nicht als Knopf erkennbar; seiten.json zählt 0 Knöpfe.
- **Vorschlag:** Reiter streichen. Im Wissensbaum oben eine Zeile „Hochschulen 44 / Bildungsverwaltung: Etat knapp → Haushalt“ mit Regler. Behördenausbau zentral in Kabinett & Verwaltung.

### Forschung & Ziele › Fortschritt (049.png)
- **Frage des Spielers:** Hat sich meine Forschungs- und Zielpolitik ausgezahlt?
- **Urteil:** sinnlos, doppelt
- **Befund:**
  - Exakt dasselbe Diagramm wie 040: „Zustimmung 52 → 50 %“ mit gestauchter Achse 50–52. Mit Forschung hat es nichts zu tun.
  - „Noch keine Wirkungsberichte in diesem Bereich.“ 16 Wörter.
  - Was fehlt: Forschungstempo über Zeit, Hochschulen 44 über Zeit, Zahl fertiger Technologien. Datenlücke, falls nicht gespeichert.
- **Klicks:** Keine.
- **Vorschlag:** Streichen. Fortschritt zeigt sich im Baum selbst (fertige Knoten leuchten, Jahreszahl daran). Wenn ein Verlauf nötig ist: eine Zeitleiste „Durchbrüche“ unter dem Wissensbaum.

### Forschung & Ziele › Forschungskabinett (050.png)
- **Frage des Spielers:** Wer im Kabinett treibt Forschung, wer bremst?
- **Urteil:** fast leer, missverständlich, doppelt
- **Befund:**
  - Zeynep Karaca (Chefin des Präsidialamts, verlässlich 55) und Murat Erdem (Wirtschaftsminister, distanziert 40). Kein Bildungs-, Wissenschafts- oder Industrieminister. Laut Code fest: wissen = stab, wirtschaft.
  - Murat Erdem steht identisch in 041. Ziele der Personen („Dass der Präsident seine Amtszeit übersteht…“) haben keinen Bezug zur Forschung.
  - Der Name „Forschungskabinett“ verspricht ein Gremium, das es nicht gibt.
  - 36 Wörter, 0 Knöpfe, Seite zu zwei Dritteln leer.
- **Klicks:** Keine.
- **Vorschlag:** Streichen. Zuständige Person als Porträt im Kopf (wie Land). Wenn das Modell keinen Forschungsminister kennt, ist das eine Lücke im Kabinettsmodell, keine Seite wert.

---

### Querschnitt C

**Wiederkehrende Muster**
1. **Reiterflut statt Bild.** Land hat 9 Reiter plus 3 Unterreiter in 035 und 037 plus 4 innere Reiter in 038, also bis zu vier Navigationsebenen. Forschung hat 8 Reiter. Davon sind in Land 4 und in Forschung 3 Seiten fast leer oder reine Wiederholung (Behörden, Entwicklung/Fortschritt, Minister/Kabinett, Bau & Umsetzung).
2. **Die Karte fehlt ausgerechnet in der Akte „Land“.** Regionen, Netze, Engpass-Provinzen, Kulturstätten, Verwerfungen und Baustellen sind alles Orte, werden aber als Listen und Kacheln gezeigt, während die Karte verdeckt hinter der Akte liegt.
3. **Dasselbe in mehreren Formen.** Erdbeben/Wiederaufbau an 4 Stellen; AFAD als Maßnahme (038) und als Behörde (039); Straßen mit drei verschiedenen Zahlen (60 / 74 % / Stufe 55); Baureihenfolge mit Kampfjets identisch in Infrastruktur und Kultur; Altay und Stahlkuppel als Forschung und als Bau; „Ziele“ in drei Bedeutungen (Kopf 1/3, Ziele der Amtszeit, Große Ziele); drei Platzsysteme für Langfristiges (1 Fokus, 2 Programmschritte, 3 Große Ziele).
4. **Generische Rahmenreiter ohne Inhalt.** „Entwicklung/Fortschritt“ zeigt überall die globale Zustimmungskurve mit gestauchter Achse 50–52 (Code: verlaufsReihen gibt für land und wissen nur `zustimmung` zurück). „Minister/Kabinett“ ist fest verdrahtet und nennt Ressorts ohne Bezug.
5. **Weiterleitungsknöpfe, die nur den Nachbarreiter öffnen.** „Infrastruktur und Bau öffnen“, „Fokusbaum öffnen“, alle vier Bildkarten-Knöpfe (landen im selben Reiter, nicht beim Vorhaben).
6. **Widersprüchliche Urteile.** „Lage: ruhig“ / „0 Netze überlastet“ neben 118 % Engpass und Investitionsstufe 0; „Bauvorhaben im Bau 4“ neben „Noch keine Vorgänge“ und „0 Ausbauten laufen“.
7. **Stellgrößen ohne Regler.** Investitionsstufe, Forschungsetat 0,4 % BIP, AFAD-Stufe, Gebäude-Verstärkung: Alles wird als Text oder Scheinbalken gezeigt; gestellt wird woanders (Gesetz, Politikfenster). Das widerspricht ENTSCHEIDUNGEN V („Preis und Wirkung dort, wo man stellt“).
8. **Darstellungsfehler** in 038/038b (leere Spalte, überlappender und abgeschnittener Text), abgeschnittene Texte in 034 und 043, unlesbare Knoten in 044.

**Vorgeschlagene Struktur Land (aus 9 Reitern werden 3)**
1. **Karte** (Startseite, ersetzt Lage der Regionen, Netze, Kultur und Erbe, Entwicklung): Türkei-Karte bildschirmfüllend, Ebenenwahl als Ikonenreihe (Infrastruktur, Bahn, Strom, Wasser, Internet, Wohnungen, Kliniken, Kulturerbe, Gefährdung). Baustellen animiert, mögliche Großprojekte als Umrisse, Kulturstätten als Säulen. Klick auf Ort → Seitenkarte mit Zustand, Preis, „Bauen / Instandsetzen / Restaurieren“. Unten eine Zeile mit den zwei Reglern „Öffentliche Investitionen“ und „Verwaltungskraft für Bau“.
2. **Bauleiste** (ersetzt Infrastruktur und Bau, Bau & Umsetzung, Baureihenfolge in Kultur): ein Kapazitätsbalken 133 mit farbigen Blöcken je Vorhaben (Rüstung, Netze, Kultur, Wiederaufbau, Versprechen jeweils mit eigener Ikone), Ziehen = Reihenfolge, Preis beim Ziehen, Fristen als Siegel. Darunter die Vorteile als Siegelreihe.
3. **Katastrophen** (gekürzt auf etwa 1.200 px): Gefährdungskarte + Halbrund Bereitschaft + fünf Vorsorge-Regler (inkl. AFAD, damit entfällt Behörden) + Knopf „Beben simulieren“. Laufende Fälle nur bei Bedarf.
- Unten als Reiter: Verlauf (Wirkungsberichte, Chronik, Versprechen).
- Fliegt raus: Behörden (→ Katastrophen bzw. Kabinett & Verwaltung), Zuständige Minister (→ Porträt im Kopf), Entwicklung des Landes (→ Zeitregler auf der Karte, falls Daten vorhanden).

**Vorgeschlagene Struktur Forschung & Ziele (aus 8 Reitern werden 2)**
1. **Bäume** (ersetzt Stand der Agenda, Fokusbaum, Wissensbaum, Behörden): oben eine Leiste mit drei Feldern wie in Civilization (laufender Fokus mit Ring, laufende Forschung mit Ring, Forschungsetat-Regler mit Tempo ×1,0 und Hochschulen 44). Darunter umschaltbar „Fokusbaum“ / „Technologiebaum“, beide als Ikonenbaum im Vollbild, mögliche Knoten leuchten, Gegenwege beim Darüberfahren rot.
2. **Vermächtnis** (ersetzt Große Ziele und Programme): zehn Große Ziele und acht Programme als Monumente bzw. Zeilen mit Stufenpunkten, oben die Sockel (3 Ziele, 2 Programmschritte) zum Belegen. Klick → Detail rechts mit Chance, Dafür/Dagegen als Ikonen, Voraussetzungen als Häkchen mit Sprung zum Regler.
- Fliegt raus: Fortschritt (globale Zustimmungskurve), Forschungskabinett (fest verdrahtete, fachfremde Personen), Behörden (eine Karte).
- Klären (Entscheidung nötig): Ob Rüstungsprojekte (Altay, Stahlkuppel, F-16, KAAN) Forschung, Bau oder Sicherheit sind, und ob „Ziele der Amtszeit“ in den Schreibtisch wandern. Ob Programme als eigenes System neben Fokus und Großen Zielen bleiben oder in den Fokusbaum aufgehen.

**Datenlücken, die beim Umbau offen bleiben:** Verlauf je Provinz für Infrastruktur und Netze (für einen Zeitregler), Verlauf von Forschungstempo und Hochschulen, ein Bau-/Verkehrs- und ein Bildungs-/Wissenschaftsressort im Kabinettsmodell, eine echte Zuordnung der Behörden für Bau (TOKİ, DSİ, Straßenbau) – alle aus der Oberfläche nicht ableitbar.
