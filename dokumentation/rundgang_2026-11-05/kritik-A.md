# Kritik A – Einstieg, Schreibtisch, Politik, Parlament & Gesetze, Kabinett & Verwaltung

Grundlage: Bildschirmfotos 1440×900 (Stand 3. Februar 2030, 1. Amtszeit), Kennzahlen aus `seiten.json`, gezielter Blick in `game/src/ui` (Stage.tsx, akte/Bereiche.tsx, gesetze/Gesetzesvorhaben.tsx) und `game/src/sim/haushalt.ts`. Höhenangaben in px sind die gemessene Seitenhöhe, nicht die Fensterhöhe (Sichtfenster ≈ 750 px).

---

### Einstieg › Titelbild (t01-titel.png)
- **Frage des Spielers:** Weiterspielen oder neu anfangen?
- **Urteil:** passt (mit Kleinigkeiten)
- **Befund:**
  - Klare Hierarchie: goldener Knopf „Neues Spiel“, darunter „Fortsetzen · 3. Februar 2030“. Gut.
  - „Frühere Sicherungen (3)“ und „Spielstand aus Datei laden“ stehen hier **und** im Schreibtisch-Reiter „Spielstand“ (s4) – doppelt.
  - Die Fußzeile mit Daten- und Lizenzangaben („Wirtschaftsdaten vom 25. September 2026 · Karte nach Natural Earth …“) gehört hierher, nicht in den Schreibtisch (siehe s5).
  - Beim Fortsetzen fehlt jede Spannung: kein Porträt, keine Zustimmungszahl, kein „Wahl in 10 Monaten“. Der Knopf ist nur ein Datum.
- **Klicks:**
  - Sprachwahl Deutsch/Türkçe/English: nötig.
  - „Neues Spiel“ führt zum Prolog: nötig.
  - „Fortsetzen“ führt zu „Stand der Dinge“ (t02): nötig. Besser: im Knopf eine Zeile wie „50 % · Wahl in 10 Monaten“.
  - „Frühere Sicherungen“ klappt eine Liste auf: nötig, aber nur hier. Im Schreibtisch kann es wegfallen.
  - „Spielstand aus Datei laden“: kann unter „Frühere Sicherungen“ wandern.
- **Vorschlag:** So lassen. Im Fortsetzen-Knopf Mini-Porträt und Zustimmung zeigen. Hier liegt die einzige Stelle für Laden, Datei und Quellen („Über das Spiel“). Diese drei Reiter fliegen aus dem Schreibtisch.

### Einstieg › Stand der Dinge (t02-standderdinge.png)
- **Frage des Spielers:** Wo stand ich, was brennt?
- **Urteil:** missverständlich, sinnlos (in dieser Form)
- **Befund:**
  - Die drei Kacheln Zustimmung 50,2 %, Inflation 19,2 %, Kapital 113 zeigen jeweils „± 0 zuletzt 50,2“. Verglichen wird mit dem Beginn der *letzten Sitzung*, und das ist derselbe Tag. Die Spalte ist darum immer ±0 und sagt nichts.
  - Dieselben drei Zahlen stehen schon in der oberen Leiste, dort sogar mit Trend (▼0,2). Die Kacheln sind doppelt.
  - „Laufende Vorgänge“ nennt nur Bauten (F-16, Wiederaufbau, Altay). Die akute Ministerin (Nazlı Turan, „Dringend“) fehlt. Unter „Probleme“ steht nur „Hasankeyf verfällt (Zustand 14)“, obwohl die Politik-Akte 10 akute Probleme zählt.
  - „Dringendste Frist: Nikosia sucht den Streit — in 12 Tagen“ ist das Wichtigste, steht aber klein in der vorletzten Zeile.
  - Hinter dem Fenster steht ein Hinweis „Vereinfachte Karte: Dieses Gerät zeigt keine 3D-Grafik“. Das ist Technikjargon im Spielbild.
- **Klicks:**
  - „Zum Schreibtisch“ ist der einzige Knopf und nötig. Danach springt aber sofort das Ereignis auf (t03). Der Knopf landet also gar nicht am Schreibtisch.
  - Besser: ein Knopf „Weiter: Nikosia sucht den Streit (12 Tage)“, der direkt zur dringendsten Sache führt.
- **Vorschlag:** Den Vergleich nicht mit der letzten Sitzung, sondern mit vor 30 Spieltagen ziehen (Pfeile ▲▼ mit Wert) oder die Kacheln ganz streichen. Stattdessen „Drei Dinge, die warten“ in Dringlichkeitsfolge mit Porträt (Erdem: Zypern, Turan: Haftanstalten, Wahl in 10 Monaten als Fortschrittsbalken). Das ist eine Karte, kein Bericht.

### Einstieg › Ereignis „Nikosia sucht den Streit“ (t03-ereignis-oder-schreibtisch.png)
- **Frage des Spielers:** Was passiert, was kann ich tun, was kostet es?
- **Urteil:** passt (bester Bildschirm dieses Teils), aber unschön und abgeschnitten
- **Befund:**
  - Das Muster ist gut, wie bei Suzerain: Kopfbild, Porträt des Außenministers, ein Satz Lage, drei Optionen mit Preisschild.
  - Die dritte Option „Internationale Vermittlung rufen · 4 Kapital“ ist unten abgeschnitten. Man sieht nicht, dass es mehr gibt, und muss im Fenster scrollen.
  - Die Folgen sind in Fachsprache geschrieben: „Schulden +0,05 Prozentpunkte“, „0,05 % des BIP“, „Einsatzbereitschaft der Streitkräfte +1,0“. Keine Wirkung ist in Lira oder in Sitzen spürbar.
  - Zwei Zustimmungswerte nebeneinander: „Zustimmung (Umfragen) 54 % · Ekran Onlinepanel“ im Fenster und 50 % in der oberen Leiste. Das wird nicht erklärt und verwirrt.
  - „Rat aus dem Ressort“ steckt voller Spiellogik: „‚Annäherung an die EU‘ von Stufe 35 auf 55; das kostet 9 Kapital, die Mehrheit im Parlament steht.“ Das ist kein Rat, sondern eine Rechnung.
  - Kopfbild: Ein Globus und vier leere Fahnen sind Platzhalter. Für Zypern wäre eine Karte der Insel mit Manöverzone das passende Bild.
- **Klicks:**
  - Drei Optionskarten: nötig.
  - „Mehr dazu“ klappt Text auf: kann bleiben.
  - „Später entscheiden“: nötig.
  - × oben rechts: doppelt mit „Später entscheiden“, kann wegfallen.
- **Vorschlag:** Die drei Optionen nebeneinander in eine Zeile, ohne Scrollen. Folgen als Ikonen mit Pfeil (Waage für Schulden, Moschee für religiös-konservative Wähler, Panzer für die Streitkräfte) statt „+1,0“. Umfragewert und Spielwert vereinheitlichen oder beschriften („Umfrage ≠ Wahlergebnis“). Den Ratgebertext auf einen Satz in Personenstimme kürzen.

### Schreibtisch › Schreibtisch (s1.png, s1b.png)
- **Frage des Spielers:** Was muss ich heute entscheiden?
- **Urteil:** zu lang, zu kompliziert, doppelt
- **Befund:**
  - Der Kopf zeigt Zustimmung 50 %, Kapital 113, Mehrheit 328 Sitze, Inflation 19,2 %. Das sind genau die Werte der oberen Leiste: vier doppelte Kacheln.
  - „Auf dem Tisch 8“ öffnet den ersten Fall (Nazlı Turan) sofort. Dieser eine Fall füllt mehr als 1,5 Bildschirme (s1 und s1b).
  - Dieselbe Größe steht in drei Schreibweisen: „Überfüllung der Haftanstalten: 86 → 88“, im Zitat „stehen wir bei 87,3“, in der Justiz-Akte „87▲“ und „87 von 100“. Dazu kommen Nachkommastellen im Zitat einer Ministerin.
  - Mehrere Textwände voller Fachjargon: „kostet der Fristablauf zusätzlich 2 Loyalität und bringt 3 Groll. Nach ausdrücklicher Ablehnung wird dieser Beziehungspreis nicht nochmals gebucht; Eigeninitiative bringt außerdem 1 Groll.“ Begriffe wie „Groll“, „Beziehungspreis“, „Ressortgröße“ und „Aufmerksamkeit“ werden nirgends erklärt.
  - Der Ablauf hat zwei Stufen: erst eine von drei Karten (01/02/03, „1,0 Kapital · 4 Aufmerksamkeit“) mit „+“ wählen, dann „Antworten und Folgen vergleichen“. Der Satz „Erst vergleichen, dann entscheiden. Die Auswahl öffnet eine Vorschau und kostet nichts.“ erklärt nur die Bedienung. „1,0 Kapital“ trägt eine sinnlose Nachkommastelle.
  - Derselbe Fall Turan steht auch in Parlament › Fraktionen (007) und in Kabinett › Ministerrat (015): dreifach.
  - Rechte Spalte „Fristen und Termine“: Termine wie „Wahl in Ägypten“ oder „Wahl in Russland“ stehen gleichrangig neben eigenen Pflichten. Darunter steht „Ihr Handlungsspielraum: ruhig · Aufmerksamkeit 100“ ohne Erklärung.
- **Klicks:**
  - Reiter Schreibtisch/Chronik/Berichte/Spielstand/Quellen: Spielstand und Quellen gehören ins Hauptmenü. Chronik und Berichte sind dieselbe Sache (siehe unten).
  - Zeilen „Auf dem Tisch“ (aufklappen ▾/▸): nötig. Es sollte aber nur eine Zeile offen sein, und die geöffnete Zeile sollte höchstens einen halben Bildschirm füllen.
  - Optionskarten 01–03 mit „+“: nötig, besser mit direktem „Entscheiden“ auf jeder Karte, und die Vorschau erscheint beim Darüberfahren.
  - „Antworten und Folgen vergleichen“: ein zusätzlicher Schritt, kann entfallen.
  - „Ressort und Person öffnen →“ führt zur Kabinett-Akte (Personen): nötig, aber als Klick auf das Porträt.
  - „Minister: Handeln und Unterlassen im Rückblick“ (aufklappen): kann in die Personenakte.
  - Fristen-Pfeile ↗ springen in die jeweilige Akte: nötig.
  - „Alle Vorlagen und Befehle ↗“ führt zu Kabinett › Ministerrat (015). „Heute: Was jetzt ansteht ↗“ führt zu Politik › Vorschläge (003). Beide verweisen auf dieselben Vorlagen an anderer Stelle. Sie sind doppelt und können wegfallen, wenn der Schreibtisch selbst die Liste ist.
- **Vorschlag:** Der Schreibtisch ist die **eine** Eingangsliste für alles, was eine Entscheidung braucht (Ereignisse, Ministerfälle, Vorschläge, Gesetzesfristen). Jede Zeile besteht aus Porträt, einem Satz, einem Fristbalken und zwei bis drei Knöpfen mit Preis. Die Kopfkacheln entfallen, die Leiste reicht. Rechts steht ein Kalenderstreifen (30 Tage als Zeitstrahl mit Symbolen), keine Textliste. Alle Erklärsätze zu Groll und Fristen gehören in einen Tooltip am Preisschild.

### Schreibtisch › Chronik (s2.png, s2b.png)
- **Frage des Spielers:** Was ist bisher passiert?
- **Urteil:** zu lang, unschön, doppelt
- **Befund:**
  - Eine endlose Textliste ohne Bild, Filter oder Ikone. Jeder Eintrag hat Datum, fette Überschrift und kursive Zeile.
  - Der Text wiederholt den Titel: „Wirkungsbericht: Rentner fordern Ausgleich: Die Mindestrente kräftig erhöhen“, darunter „Rentner fordern Ausgleich: Die Mindestrente kräftig erhöhen, 12 Monate danach: Gemischte Bilanz…“. Bei „Marmara Giyim schließt Werke“ steht „Kurzarbeitergeld. Kurzarbeitergeld überbrückt die Auftragslücke.“, also ein Wort doppelt.
  - Mehr als die Hälfte der Einträge sind „Wirkungsbericht:“. Sie stehen ein zweites Mal unter Berichte (s3) und ein drittes Mal unter Parlament › Umsetzung (008).
  - Fast jeder Bericht endet mit „Gemischte Bilanz“. Das Urteil unterscheidet nichts.
- **Klicks:** Keine sichtbaren Knöpfe. Die Einträge sind nicht klickbar. Ein Klick auf einen Wirkungsbericht sollte den Bericht öffnen.
- **Vorschlag:** Mit Berichte zusammenlegen zu „Verlauf“. Oben eine Zustimmungskurve über die ganze Amtszeit, auf der die Ereignisse als Punkte sitzen, wie in Tropico: ein Almanach als Zeitleiste. Filter mit Ikonen (Ereignis, Gesetz, Bericht, Wirtschaft). Wirkungsberichte erscheinen nur als Punkt mit Farbe (wirkt / gemischt / Preis), Klick öffnet den Bericht.

### Schreibtisch › Berichte (s3.png)
- **Frage des Spielers:** Hat meine Entscheidung gewirkt?
- **Urteil:** zu kompliziert, doppelt
- **Befund:**
  - Der Titel „Währungskrise im Iran: Finanzhilfe und Beistand anbieten“ steht dreimal: als Überschrift, als kursive Unterzeile und im Kasten „Gemischte Bilanz“.
  - Die linke Liste hat Großbuchstaben-Überschriften, die abgeschnitten werden („DER MINDESTLOHN FÜR DAS …“). Fast alle Einträge sind „GEMISCHT“, einer „WIRKT“.
  - Zahlen mit Nachkommastellen: „von 45,6 auf 47,4“, „42,6 → 40,9 −1,7 Punkte“.
  - Der Abschnitt „Was der Bericht nicht sagen kann“ ist eine methodische Entschuldigung (vier Zeilen), die bei jedem Bericht gleich bleibt.
  - Gut: Die zwei Karten „wie beabsichtigt“ und „Preis eingetreten“ sind der Kern und gut lesbar.
- **Klicks:**
  - Linke Liste (Bericht wählen): nötig.
  - „Maßnahme ansehen und nachjustieren“ führt zum Politik-Wirkungsnetz (004): nötig und richtig, das ist der einzige spielerische Knopf.
- **Vorschlag:** Pro Bericht ein Vorher/Nachher-Balkenpaar je Größe (grün und rot), ganze Zahlen, ein Satz. Die Methodenzeile wird zu einem ⓘ. Wird mit Chronik zur Zeitleiste zusammengelegt (siehe dort).

### Schreibtisch › Spielstand (s4.png)
- **Frage des Spielers:** Wie sichere oder lade ich?
- **Urteil:** doppelt, missverständlich
- **Befund:**
  - Funktioniert, ist aber Verwaltung und kein Schreibtisch des Präsidenten. Laden steht schon auf dem Titelbild.
  - „Weitester Stand · 3. März 2029“, obwohl man gerade am 3. Februar 2030 steht. „Weitester“ stimmt also nicht oder meint etwas anderes. Das ist missverständlich.
  - Fünf feste Slots mit Notizfeld nehmen den halben Bildschirm ein, alle „Leer“.
  - Drei Knöpfe oben: „Schnellspeichern“, „Als Datei sichern (.json)“, „Datei laden“. „.json“ ist Technikjargon.
- **Klicks:**
  - „Schnellspeichern“: nötig, aber besser als Tastenkürzel und im Menü ≡.
  - „Als Datei sichern“ und „Datei laden“: ins Menü.
  - „Laden“ (3×) und „Sichern“ (5×): nötig, aber im Menü.
- **Vorschlag:** Den Reiter streichen. Alles kommt in das Menü ≡ oben rechts (wie bei Civilization: Spiel speichern, laden) und auf das Titelbild.

### Schreibtisch › Quellen (s5.png, s5b.png)
- **Frage des Spielers:** Woher kommen die Daten? (Fragt beim Spielen fast niemand.)
- **Urteil:** sinnlos (an dieser Stelle), unschön
- **Befund:**
  - Die Schrift ist kaum lesbar: blasses Beige auf Beige (Überschriften wie „OpenStreetMap-Mitwirkende“, „Statistikamt (TÜİK)“ sind nahezu unsichtbar). Das ist ein Kontrastfehler.
  - Eine lange Lizenzliste (ODbL, CC BY 4.0, ISO 3166-2 …) im Arbeitszimmer des Präsidenten.
  - Der Satz „Die Behörden im Spiel tragen deutsche Namen (MB statt TCMB u. a.)“ wirft eine Frage auf, die der Spieler nicht hatte.
- **Klicks:**
  - „Attributionstext kopieren“: nötig für die Lizenz, aber im Menü.
  - Quellenlinks (→): nötig für die Lizenz, aber im Menü.
- **Vorschlag:** In Hauptmenü › „Über das Spiel / Quellen“ verschieben und den Kontrast reparieren. Im Schreibtisch bleiben dann nur „Schreibtisch“ und „Verlauf“, also zwei Reiter statt fünf.

---

### Politik › Bereiche (002.png, 002b.png)
- **Frage des Spielers:** Wo brennt es im Land, und was kann ich dagegen tun?
- **Urteil:** zu lang, doppelt, missverständlich
- **Befund:**
  - Die Seite ist 2576 px hoch und hat 0 Regler. Laut ENTSCHEIDUNGEN V ist Politik zur „Maßnahmentafel“ umgebaut, auf dem Bild ist aber keine Tafel mit Reglern zu sehen, sondern 15 Bereichskarten untereinander.
  - Die 15 Bereiche stehen zweimal: links als Liste (mit roten Zählern 2, 1, 1, 2 …), rechts als Karten.
  - Es gibt eine zweite Ordnung des Landes neben der linken Hauptleiste: Die Leiste hat Wirtschaft, Gesellschaft, Land, Sicherheit, Außen. Politik hat 15 Bereiche, darunter wieder „Wirtschaft“, „Streitkräfte“, „Außenpolitik und Migration“. Zwei Taxonomien für dasselbe Land.
  - Die Balken pro Karte (Mieten 74 ▼, Wohnungsbau 52 ▲, Frauenerwerbstätigkeit 35, Lage der Sozialversicherung 38 ▼) haben keine Richtung. Ist hoch gut oder schlecht? Mieten 74 sind rot, Frauenerwerbstätigkeit 35 ist auch rot. ▼ heißt mal „wird besser“, mal „wird schlechter“.
  - Die vier Zählkacheln „7 angespannt / 4 Achtung / 4 ruhig / 10 akute Probleme“ sind Statistik, kein Bild.
  - Das rote Kriegsgefahr-Band („Endet, wenn kein Konflikt mit einem Nachbarn mehr über 65 steht“) ist eine Spielregel im Klartext.
- **Klicks:**
  - Linke Liste (16 Einträge): führt zur Bereichsansicht. Doppelt mit den Karten, eins von beiden kann weg.
  - Unterstrichene Links „Wohnen, Bau und Erdbeben“ usw. im Einleitungssatz: dreifach (Satz, Liste, Karte).
  - „Vorschläge“ im Satz: doppelt mit dem Reiter.
  - Reiter Bereiche/Vorschläge/Wirkungsnetz: siehe unten. Wirkungsnetz gehört nicht als gleichrangiger Reiter hierher.
- **Vorschlag:** Wie Democracy 4 auf **einen** Bildschirm: 15 Bereichs-Ikonen als Kreise, Größe = Zahl der Betroffenen, Farbe = Zustand, rote Ringe für akute Probleme. Ein Klick auf den Kreis öffnet rechts die Maßnahmen des Bereichs als Zeilen mit Regler, Preis (Kapital, % BIP) und Wirkungspfeilen. Die Zählkacheln und die linke Liste entfallen. Die Taxonomie muss mit der Hauptleiste abgeglichen werden (entweder 15 Bereiche oder 11 Akten, nicht beides).

### Politik › Vorschläge (003.png, 003b.png)
- **Frage des Spielers:** Was schlagen mir meine Leute vor?
- **Urteil:** zu lang, doppelt, missverständlich
- **Befund:**
  - Die Seite ist 3159 px hoch für 6 Vorlagen; jede Karte ist etwa 470 px hoch.
  - Platz 1, „Erdbebensichere Stadterneuerung“, zeigt „Empfehlung: Warten“ und als Wirkung „Erdbebengefahr 20 → 20 in 36 Monaten · ohne Eingriff 20“. Das heißt null Wirkung bei 5 Kapital, und trotzdem steht der Vorschlag auf Rang 1. Widersinnig.
  - Alle sichtbaren Vorlagen stammen von Murat Erdem (Wirtschaft · Loyalität 40), auch Luftverschmutzung, Bahn in Burdur und Integration von Geflüchteten. Ursache: Das Kabinett hat nur 7 Ressorts (Präsidialamt, Finanzen, Inneres, Äußeres, Justiz, Streitkräfte, Wirtschaft). Für 15 Politikbereiche fehlen Minister für Bildung, Gesundheit, Soziales und Umwelt. Das wirkt unglaubwürdig.
  - „Frist in 666 Tagen“ ist eine sinnlose Genauigkeit. Besser „in 22 Monaten“.
  - Jede Karte hat sieben Klickziele: Auf der Karte ansehen, Rechnung zeigen, Als Gesetz einbringen, Einstellen und ansehen, Im Politiknetz ansehen, Später, Nicht tun.
  - Dieselben Karten stehen in Kabinett › Ministerrat › Vorlagen der Minister (015b: Mietpreisbremse, Umweltauflagen …): doppelt. Zusätzlich stehen „Mietpreisbremse“ und „Mindestlohn“ als fertige Gesetze in Parlament › Gesetzesvorhaben (006): dreifach mit anderem Mechanismus.
- **Klicks:**
  - „Auf der Karte ansehen“ schaltet die Problemebene der Karte ein: nützlich, aber besser als kleine Karte direkt in der Zeile.
  - „Als Gesetz einbringen“: nötig (Hauptaktion).
  - „Einstellen und ansehen“ und „Im Politiknetz ansehen“ führen beide ins Wirkungsnetz (004). Das sind zwei Links zum selben Ziel, einer reicht.
  - „Rechnung zeigen“: kann in einen Tooltip.
  - „Später“ und „Nicht tun“: nötig, aber als kleine Symbole.
- **Vorschlag:** Den Reiter auflösen. Vorschläge von Ministern landen im Schreibtisch (Eingang). In der Bereichsansicht (siehe 002) bekommt die vorgeschlagene Maßnahme nur eine Markierung „Minister rät: auf 60“ am Regler. Vorschläge ohne messbare Wirkung gar nicht erst zeigen.

### Politik › Wirkungsnetz (004.png, 004b.png)
- **Frage des Spielers:** Was bewirkt diese Maßnahme, und was kostet sie?
- **Urteil:** zu kompliziert, unschön (Layout kaputt), zu lang
- **Befund:**
  - Drei Spalten: links ein Themenbaum („262 Knoten · 1.022 Verbindungen“ ist Entwicklersprache), Mitte die Maßnahme, rechts der Regler-Assistent. 83 Knöpfe auf einer Seite.
  - Hier steht der eigentliche Regler, den ENTSCHEIDUNGEN V „überall“ will. Er liegt aber im dritten Reiter und in einem Drei-Schritt-Formular (1 Wo soll es gelten? → 2 Auf welchen Satz? → 3 Auf welchem Weg?).
  - Der Satzwähler zeigt „Jetzt Stufe 80 → Neu Stufe 80“, wenn nichts geändert ist. Darunter „Landesdurchschnitt 80,0 (Index 0–100; beim Amtsantritt 50,0)“ mit Nachkommastelle und Indexjargon.
  - Der Block „Was folgt daraus?“ ist kaputt (004b). In der linken Spalte überdrucken sich Beschriftungen („Reallöhne“ liegt über „nach 1 Monat“, „Kostendruck“ ebenso, „Ungleichheit“ über „3 Monaten“). In der Spalte „Preis und Gegenspieler“ steht ein Wort pro Zeile („Kosten / heute 0,48 / % des BIP, / bei dieser / Wahl 0,48 / %.“).
  - Die Wirkungen stehen doppelt: als Liste „Wirkungen im Land“ in der Mitte und als Liste „Wirkungen“ rechts (Reallöhne ↑ nach 1 Monat …).
  - „Die Mentorin erklärt“ hat noch einmal drei Unterreiter (Erklärt / Weltvergleich / Was tun?). Das Netzbild darunter ist eine winzige Vorschau mit unlesbarer Schrift.
- **Klicks:**
  - Suchfeld und Filter Alle/Maßnahmen/Größen/Probleme: zu viel, ein Suchfeld reicht.
  - Themenbaum-Einträge: nötig, aber nur als Bereichsliste.
  - Wo soll es gelten? (Ganzes Land / Wo es akut ist 45 / Region ▾ / Provinzen ▾): nötig, besser als Karte zum Anklicken.
  - Stufenknöpfe (Deutlich senken / Senken / Unverändert / Anheben) und „Genauer einstellen“: zwei Bedienwege für denselben Wert. Ein Regler genügt.
  - Gesetz/Erlass: nötig.
  - Mentor-Reiter und „Mehr erklären“: in einen Tooltip.
  - Wirkungs-Links (Reallöhne usw.) springen zum Knoten: nützlich, wie bei Democracy 4 beim Darüberfahren.
- **Vorschlag:** Kein eigener Reiter mehr. Ein Klick auf eine Maßnahmenzeile in der Bereichsansicht klappt **eine** Karte auf: links der Regler mit Preis am Griff, rechts ein Pfeilbild Ursache → Maßnahme → Wirkungen (grün und rot, Pfeildicke = Stärke, Uhr-Symbol = Verzögerung). Darunter „Wer ist dagegen“ als Porträts. Das volle Netz bleibt als Vollbild-Option für Neugierige. Der Layoutfehler in „Was folgt daraus?“ muss sofort behoben werden.

---

### Parlament & Gesetze › Mehrheitslage (005.png)
- **Frage des Spielers:** Habe ich eine Mehrheit?
- **Urteil:** fast leer, sinnlos, missverständlich
- **Befund:**
  - Die Seite hat 21 Wörter. Eine Karte sagt „Lage: angespannt · Auffällig: Unabhängige Justiz: 33“. Die Lage des Parlaments wird also mit der Justiz begründet, während die Mehrheit (328 von 301) steht. Missverständlich.
  - „Keine Einträge in Gesetze im Verfahren · Beim Verfassungsgericht.“ ist ein maschineller Satz.
  - Der Kopf hat drei Kacheln: „Mehrheit (mit Duldung) 328 · Lager 328, geduldet 0, Mehrheit ab 301“, „Gesetze im Verfahren 0“, „Unabhängige Justiz 33/100“. 328 steht auch in der oberen Leiste.
  - Neun Reiter in zwei Reihen, wobei „Gesetzesbilanz“ und „Politische Akteure“ rechts in eine zweite Zeile umbrechen. Dieser Kopf sieht anders aus als bei Politik und Schreibtisch (dort sitzen die Reiter in der Titelleiste). Uneinheitlich.
  - Das schönste Bild des Bereichs, das Halbrund, versteckt sich im dritten Reiter (007).
- **Klicks:**
  - „Gesetzesvorhaben öffnen“: doppelt mit dem Reiter daneben.
  - „Woher die Zahlen kommen“: kann ins ⓘ.
  - Neun Reiter: zu viele (siehe Querschnitt).
- **Vorschlag:** Seite streichen. Die Startansicht des Bereichs wird das Halbrund aus 007 mit der 301-Linie, daneben die Liste „Auf dem Tisch“.

### Parlament & Gesetze › Gesetzesvorhaben (006.png, 006b.png)
- **Frage des Spielers:** Welches Gesetz kann ich durchbringen, und was bringt es?
- **Urteil:** zu lang, sinnlos (Kachelinhalt), doppelt
- **Befund:**
  - Über 24 Kacheln, und **jede** sagt in großer Schrift „Mehrheit steht“. Eine Aussage, die auf allen Kacheln gleich ist, unterscheidet nichts. Darunter „373 / 389 / 354 … Ja-Stimmen erwartet, nötig 301“.
  - Die Kachel zeigt weder Kosten (Kapital, % BIP) noch Wirkung oder Gegner. Gerade das braucht man zum Wählen. Stattdessen steht dort ein Feuilletonsatz („Die Kasse klingelt, die Ingenieure warnen vor dem nächsten Beben.“).
  - Die Markierung „Ihre Linie“ wird nicht erklärt.
  - Die Kacheln sind nicht nach Bereich geordnet, nur „Auf dem Tisch“ und „Weitere Vorhaben“.
  - Die zwei großen Nullen „0 im Parlament / 0 beim Verfassungsgericht“ nehmen die erste Zeile ein.
  - Die Zahlen widersprechen sich: Die Kacheln erwarten 373 Ja-Stimmen, Fraktionen (007) sagt „etwa 362 Ja-Stimmen (Spanne 349–375)“.
  - Zwei Gesetzgebungswege laufen parallel: Politik-Maßnahmen „Als Gesetz einbringen“ (003/004) und dieser Katalog (Mindestlohngesetz, Mietpreisbremse, Wohnungsbauoffensive). Der Spieler weiß nicht, welcher Weg gilt.
- **Klicks:**
  - Kachel öffnet das Detail (laut `gesetze/Gesetzesvorhaben.tsx`: Dafür/Dagegen, Fassung wählen, „Als Gesetz“/„Als Erlass“): nötig. Das Wichtige steht aber erst hinter dem Klick.
  - Suchfeld: bei 24 Kacheln entbehrlich, wenn nach Bereich gruppiert.
- **Vorschlag:** Mit Politik zusammenlegen: Ein Gesetz ist eine Maßnahme mit Weg „Gesetz“. Im Parlament bleibt nur die **Tagesordnung**, also das, was eingebracht ist und abgestimmt wird. Jede Zeile zeigt einen Balken mit den erwarteten Ja-Stimmen, die 301-Linie und die Abstimmung in X Tagen. Den Text „Mehrheit steht“ streichen, nur bei „knapp“ oder „fehlt“ eine Warnfarbe zeigen.

### Parlament & Gesetze › Fraktionen und Abstimmung (007.png, 007b.png)
- **Frage des Spielers:** Wer stimmt mit mir, wen muss ich gewinnen?
- **Urteil:** zu lang, doppelt (das Halbrund passt)
- **Befund:**
  - Das Halbrund mit 600 Punkten, 301-Marke und „328 Regierungsmehrheit“ ist die beste Grafik des Teils. Daneben stehen die Parteizeilen AKP 296 / 35,7 %, MHP 32 / 7 %, YENİ 201 / 26 %, DEM 71 / 10,4 %. Die Prozente sind Stimmanteile, keine Sitzanteile, das ist unbeschriftet. Dazu kommen uneinheitliche Nachkommastellen (35,7 % neben 7 %).
  - Die Seite ist 3833 px hoch. Unter dem Halbrund folgen die Ministerfälle „Nazlı Turan · Justiz“ und „Zeynep Karaca · Präsidialamt“, dieselben wie im Schreibtisch und im Ministerrat. Im Parlament sind sie fehl am Platz.
  - „Versorgung auf der Tagesordnung – Hier verhandeln Sie dieselben Vorlagen wie in der Wirtschaftsakte.“ Die Seite gibt die Dopplung selbst zu.
  - „Duldung vereinbaren“ und „Koalition schließen“ stehen je zweimal (laut Überschriftenliste).
  - Viel Fließtext: „Was Ihre Entscheidungen bewirken“, „Ihre Entscheidungen im Vergleich“, „Warum die Parteien reagieren“, „Was diese Entscheidung nicht ändert“, „Politische Folgen der Ministervorfälle“.
  - Die Verfassungs-Werkstatt (009) nennt CHP, İYİ Parti, Yeniden Refah und Zafer Partisi. Im Halbrund kommen sie nicht vor. Hat das Parlament vier Parteien oder acht?
- **Klicks:**
  - „Ansehen“ bei letzten Abstimmungen: nötig.
  - „Koalition und Fraktionen verhandeln →“ führt zur selben Seite weiter unten. Die Sprungmarke ist überflüssig.
  - „Nachfolge und Ressort bearbeiten →“ führt zu Kabinett: falscher Bereich.
  - Aufklapper (Monatsbericht 2030-02, Bereits ausgelöste Reaktionen …): zu viele.
  - Duldung/Koalition (doppelt): einmal pro Partei genügt.
- **Vorschlag:** Das Halbrund wird die Startseite des Bereichs. Ein Klick auf einen Parteiblock öffnet die Parteikarte mit Vorsitzendem (Porträt), Haltung als Ring, „will: …“ und den Knöpfen Duldung oder Koalition mit Preis. Ministerfälle, Versorgung und Monatsbericht fliegen raus. Die Prozentangaben auf Sitze umstellen oder als „Umfrage“ beschriften.

### Parlament & Gesetze › Umsetzung (008.png, 008b.png)
- **Frage des Spielers:** Wirken meine Gesetze schon?
- **Urteil:** doppelt, missverständlich
- **Befund:**
  - Die Kachel „0,44 % BIP laufende Kosten im Jahr, davon 0,44 % wirksam“ sagt dieselbe Zahl zweimal.
  - „57 Beschlüsse seit dem Amtsantritt“, aber „1 Umsetzung läuft“. Wo sind die anderen 56? Das bleibt unklar.
  - Die einzige Umsetzungskarte („Gebäude-Verstärkungsprogramm in 20 Provinzen · Heute 26 → Ziel 40 · noch etwa 48 Monate“) ist gut lesbar. Der Link „stoppen“ daneben ist destruktiv und ohne sichtbare Rückfrage.
  - „Was die Beschlüsse bewirkt haben“ zeigt Wirkungsberichtskarten, die auch in Schreibtisch › Berichte und in der Chronik stehen. Die Seite sagt selbst: „Weitere 17 Berichte stehen im Reiter ‚Berichte‘“, und schickt den Spieler damit in einen anderen Bereich.
  - Die Liste „Beschlüsse“ mischt Zentralbank-Zinsentscheide, Justizverfahren und den Aserbaidschan-Vertrag. Das ist keine Gesetzesumsetzung, sondern eine zweite Chronik.
  - „Machtwechsel in den USA: Gratulieren und einladen“ unter Parlament › Umsetzung ist ein falscher Ort.
- **Klicks:**
  - „stoppen“: nötig, aber mit Bestätigung und Preis.
  - „Bericht und Verlauf ansehen“ (viermal sichtbar) öffnet den Wirkungsbericht: doppelt mit Schreibtisch › Berichte.
- **Vorschlag:** Den Reiter auflösen. Laufende Umsetzungen kommen als Fortschrittsbalken direkt an die Maßnahmenzeile (Politik) oder in die Tagesordnung. Berichte und Beschlüsse kommen in den einen „Verlauf“ (Zeitleiste).

### Parlament & Gesetze › Verfassung (009.png, 009b.png)
- **Frage des Spielers:** Kann ich die Verfassung ändern, und bekomme ich 360 oder 400 Stimmen?
- **Urteil:** zu lang, zu kompliziert
- **Befund:**
  - Die Seite ist 4270 px hoch, mit sechs Artikeln (Amtszeit und Wiederwahl, Länge der Amtszeit, Wahlhürde, Besetzung des Verfassungsgerichts, Notstandsartikel, Immunität) zu je drei großen Radiokarten, also 18 Wahlschalter.
  - Die entscheidende Zahl ist versteckt: „Mit dieser Variante stünde das Paket erwartet bei etwa 464 Ja-Stimmen (+55)“ steht in kleiner Schrift in der Karte. Das Ergebnis („Das Paket“) liegt ganz unten, etwa 4000 px tiefer.
  - Jede Bestandskarte wiederholt „Der bisherige Stand.“
  - Parteinamen, die im Halbrund fehlen (CHP, İYİ, Yeniden Refah, Zafer), siehe 007.
  - Das Werkzeug ist für eine Frage pro Amtszeit gedacht, belegt aber einen festen Reiter.
- **Klicks:** 18 Radioknöpfe: nötig, aber zu groß. Der Paket-Knopf zum Einbringen steht erst am Seitenende.
- **Vorschlag:** Eine kompakte Tafel: Zeilen = Artikel, je drei Segmentknöpfe nebeneinander (bisher / Variante A / Variante B). Rechts ein fest stehendes Mini-Halbrund mit Live-Zählung der erwarteten Ja-Stimmen gegen die Linien 360 und 400, darunter „Einbringen“ mit Preis. Das passt auf einen Bildschirm. Der Reiter wird zum Knopf „Verfassungsänderung vorbereiten“ in der Parlamentsansicht.

### Parlament & Gesetze › Justiz (010.png, 010b.png)
- **Frage des Spielers:** Wie unabhängig und leistungsfähig ist die Justiz, und was kann ich ändern?
- **Urteil:** zu kompliziert, doppelt, missverständlich
- **Befund:**
  - Der Unterreiter „Lage / Reformen und Vorhaben 4“ ist eine dritte Reiterebene.
  - Oben stehen „Verwaltungskraft 99, +2,4 im Monat“ und „Baukapazität 133, 99 von 133 je Monat verplant“. Das sind globale Ressourcen, nicht Justiz. Derselbe Block steht in Kabinett › Verwaltung (017): doppelt.
  - Zehn Balken mit Zahlen, die Richtung bleibt unklar: „Überfüllung der Haftanstalten 87 ▲“ (hoch = schlecht), „Unabhängigkeit 33“ (niedrig = schlecht), beide rot. „Ausnahmerecht 10“ ist ohne Erklärung. Echte Größen sind eingestreut (17 Richter je 100.000 Einwohner, Schnitt 22; Strafgerichte 228 Tage (2024); etwa 142 % Belegung), das ist gut, steht aber in Kleinschrift.
  - „Besetzung der Gerichte“ mit farbigen Punkten (10 loyal / 3 reformorientiert / 2 unabhängig) ist ein gutes Bild.
  - Die Baureihenfolge im Justizreiter zeigt Wiederaufbau im Erdbebengebiet, F-16 Block 70, Stahlkuppel und Kampfpanzer Altay T1. Militärprojekte in der Justiz sind ein falscher Ort, und die Liste ist identisch mit 017.
  - Die Einrichtungen (HSK, Strafvollzug, Anwaltskammern) mit „Was das ist“ und „Verwaltungskraft 0,3 im Monat“ wiederholen Behörden (011).
- **Klicks:**
  - Unterreiter: kann wegfallen.
  - „Was den Bau beschleunigt“: ein Aufklapper zu einer globalen Mechanik, falscher Ort.
  - ▲ ▼ und „Pausieren“ je Bauvorhaben (zwölf Knöpfe): nötig, aber nur an einer Stelle im Spiel (Land oder Verwaltung).
  - „Was das ist“ (dreimal): ins ⓘ.
- **Vorschlag:** Justiz als eine Ansicht: oben das Punktebild der Gerichte (klickbar: Richter ernennen), darunter vier bis fünf Kerngrößen als Zeilen mit Regler oder Reform-Knopf und Preis (Richterstellen, Haftplätze, Unabhängigkeit). Baureihenfolge und Verwaltungskraft raus. Behörde „Justiz und Gerichte“ hier hinein (siehe 011).

### Parlament & Gesetze › Behörden (011.png)
- **Frage des Spielers:** Wie gut ist mein Justizapparat ausgestattet?
- **Urteil:** fast leer, doppelt
- **Befund:**
  - Eine einzige Karte „Justiz und Gerichte“ mit drei Punktbalken (Personal, Technik, Fachwissen), dazu „Etat ohne Spielraum“ und der Leiter Taner Polat. Insgesamt 34 Wörter.
  - „0 im Ausbau / 1 Etat knapp“: zwei Zähler für eine Karte.
  - Inhaltlich gehört sie zu Justiz › Einrichtungen (010).
  - Bei der Behörde „Behörden“ im Parlament denkt man an die Parlamentsverwaltung, gemeint ist das Justizressort. Missverständlich.
- **Klicks:** Die Karte öffnet vermutlich das Behördeninstrument (Ausbau/Kürzen). Das ist nötig, aber nicht auf eigener Seite.
- **Vorschlag:** In die Justiz-Ansicht als eine Zeile „Gerichtsapparat: Personal ●●○○○ · Ausbau (Preis)“ einfügen. Den Reiter streichen.

### Parlament & Gesetze › Gesetzesbilanz (012.png)
- **Frage des Spielers:** Was haben meine Gesetze gebracht?
- **Urteil:** sinnlos, doppelt, missverständlich
- **Befund:**
  - Zu sehen ist nur die allgemeine Zustimmungskurve 2028-07 bis 2030-02. Die y-Achse reicht von 50 bis 52, so wirkt ein Rückgang um 2 Punkte wie ein Absturz. Das ist irreführend.
  - Die Kurve hat nichts mit Gesetzen zu tun und ist pixelgleich mit Kabinett › Regierungsbilanz (019).
  - „Wirkungsberichte: Noch keine Wirkungsberichte in diesem Bereich.“ Zwei Reiter weiter (008) stehen vier Wirkungsberichte plus „weitere 17“. Das ist ein Widerspruch.
- **Klicks:** keine.
- **Vorschlag:** Den Reiter streichen. Eine Zustimmungskurve gibt es einmal, im Verlauf, mit Ereignispunkten und einer Achse ab 0 oder mit deutlich markiertem Achsenbruch.

### Parlament & Gesetze › Politische Akteure (013.png)
- **Frage des Spielers:** Wer sind die Köpfe, mit denen ich verhandeln muss?
- **Urteil:** fast leer, missverständlich, doppelt
- **Befund:**
  - Drei Karten: Cem Arıkan (Oppositionsführer, „Haltung: abtrünnig (24)“), Cem Duran (Vorsitz der MHP, „verlässlich (53)“) und Nazlı Turan (Justizministerin, „abtrünnig (29)“).
  - „Abtrünnig“ passt nicht zum Oppositionsführer. Wovon soll er abtrünnig sein? Die Haltungsskala ist für Minister gemacht.
  - Die Justizministerin und der MHP-Vorsitzende stehen auch unter Kabinett › Verantwortliche (020): doppelt.
  - Die Vornamen kollidieren: Cem Korkmaz (Spieler), Cem Arıkan, Cem Duran, und in 020 kommt Levent Duran dazu. Siehe Querschnitt.
  - Die Karten haben keine Knöpfe und sind nicht klickbar (seiten.json: 0 Knöpfe). Man kann mit niemandem reden.
- **Klicks:** keine. Das ist hier ein Mangel, denn genau hier gehört „Gespräch suchen“ hin.
- **Vorschlag:** Die Personen kommen an die Parteiblöcke im Halbrund (007). Ein Klick auf einen Block öffnet den Kopf der Partei mit Gesprächs- oder Verhandlungsknopf. Den Reiter streichen.

---

### Kabinett & Verwaltung › Handlungsfähigkeit (014.png)
- **Frage des Spielers:** Steht meine Regierung hinter mir?
- **Urteil:** fast leer, sinnlos
- **Befund:**
  - 26 Wörter: „Lage: gemischt · Auffällig: Loyalität im Kabinett: 49 · Offene Zusagen: 0“. Beide Werte stehen schon im Kopf direkt darüber („Loyalität im Kabinett 49“, „Offene Zusagen 0 · keine überfällig“): doppelt.
  - „Keine Einträge in Offene Zusagen nach Frist.“ ist ein maschineller Satz.
  - Die Kopfkachel „Kabinett: Kapital je Monat +3,7“ hat eine Nachkommastelle und keine Erklärung, woher das kommt.
- **Klicks:**
  - „Ministerrat & Kabinett öffnen“: doppelt mit dem Reiter direkt daneben.
  - „Woher die Zahlen kommen“: ins ⓘ.
- **Vorschlag:** Seite streichen. Die Startansicht des Bereichs wird der Kabinettstisch (siehe 015).

### Kabinett & Verwaltung › Ministerrat & Kabinett (015.png, 015b.png)
- **Frage des Spielers:** Wer in meinem Kabinett macht Ärger, und was wollen meine Minister von mir?
- **Urteil:** zu lang (12.783 px, 2.258 Wörter, 106 Knöpfe), zu kompliziert, doppelt
- **Befund:**
  - Vier Ebenen von Reitern übereinander: Akte-Reiter (7) → Unterreiter Ministerrat / Gespräche & Umfeld / Machtkreis / Zusagen → Vorlagen der Minister 18 / Befehle erteilen → Ressort-Filter (Alle 18, Präsidialamt 3, Finanzen 1, Inneres 1, Äußeres 2, Justiz 3, Streitkräfte 0, Wirtschaft 8).
  - Drei Reihen Zählkacheln: Termine „0 von 4 · Ihre Zeit ist knapp“ (0 genutzt, und doch knapp? Widerspruch), Glaubwürdigkeit 76, Aufträge 0, Rücktrittsgefahr 0. Dann Kapital-Ertrag +3,7 (wie im Kopf), Schnitt Loyalität 49 % (im Kopf „49“ ohne %), Kabinettssitzung „beschlussfähig“.
  - Die 18 Vorlagen sind je etwa 500 px hoch. Darunter sind: Nazlı Turan und Zeynep Karaca (wie im Schreibtisch und in Parlament 007), „Nikosia sucht den Streit“ (das Ereignis aus t03), Erdbebengefahr, Industrieller Wohnungsbau, Mietpreisbremse, Umweltauflagen, Bahn in Burdur, Migration (alle wie in Politik › Vorschläge 003). Fast die ganze Seite ist doppelt.
  - Widerspruch zwischen gleichen Karten: Hier steht unter der Mietpreisbremse der rote Hinweis „Murat Erdem ist distanziert (Loyalität 40); die Empfehlung kann Eigeninteresse sein“. Dieselbe Karte in Politik zeigt diesen Hinweis nicht.
  - Acht von 18 Vorlagen kommen aus der Wirtschaft. Das zeigt wieder die fehlenden Fachressorts (Bildung, Gesundheit, Soziales, Umwelt).
  - Den Kabinettstisch als Bild gibt es nicht: Die Minister erscheinen nur als Mini-Porträts in Filter-Chips.
- **Klicks:**
  - Unterreiter (4) und Vorlagen/Befehle (2): zu viele Ebenen.
  - Ressort-Chips: nützlich als Klick auf das Porträt am Tisch.
  - Pro Vorlage: Auf der Karte ansehen, Rechnung zeigen, Als Gesetz einbringen, Im Politiknetz ansehen, Später, Nicht tun. Das ist dieselbe Siebenerreihe wie in 003, doppelt.
  - „Befehle erteilen“: nötig, gehört aber in die Akte des einzelnen Ministers.
- **Vorschlag:** **Kabinettstisch als Bild**: ein ovaler Tisch mit acht Porträts. Der Ring um das Porträt zeigt die Loyalität (grün, gelb, rot), ein Abzeichen die Zahl offener Vorlagen, ein Blitz die Rücktrittsgefahr. Ein Klick auf einen Minister öffnet seine Akte mit seinen Vorlagen, Befehlen, Zusagen und seinem **Ressortbudget als Kreisdiagramm**, wie vom Projektinhaber gewünscht. Die Daten dafür gibt es teilweise: In `sim/haushalt.ts` hat jeder Haushaltsposten ein `amt` (Wirtschaft: Forschung, Investitionen, Wohnen, Landwirtschaft, Umwelt/Energie, Subventionen; Justiz: Justiz; Generalstab: Verteidigung; Inneres: Innere Sicherheit; Außen: Diplomatie; Finanzen: Personal). Ein Tortenstück pro Posten mit Kürzen-Regler ist also machbar. **Datenlücke:** Die Aufteilung *innerhalb* eines Postens (z. B. was im Verteidigungsetat Personal, Beschaffung oder Betrieb ist) gibt es nicht, und sie darf nicht erfunden werden. Auffällig: Renten, Sozialhilfe, Gesundheit, Bildung und Kultur hängen am Amt `stab` (Präsidialamt), weil diese Ministerien fehlen. Das Präsidialamts-Tortendiagramm wäre so der größte Block und damit unglaubwürdig. Die Vorlagen selbst wandern ausschließlich in den Schreibtisch.

### Kabinett & Verwaltung › Gespräch (016.png)
- **Frage des Spielers:** Kann ich einfach sagen, was ich will?
- **Urteil:** missverständlich, fast leer
- **Befund:**
  - Gezeigt werden ein Chatfeld „Präsidialamt“ mit dem Hinweis „Regelwerk · KI nicht eingerichtet“ und ein Knopf „KI einrichten“. Der Spieler erfährt nicht, was ohne KI geht und was mit KI anders wäre.
  - Sechs Vorschlagschips: „Was soll ich als Nächstes tun?“, „Wie stehen die Rentner zu mir?“, „Wie ist das Verhältnis zu Russland?“, „Gipfeltreffen mit der EU“, „Wie verhandle ich mit der Opposition?“, „Hilfe“. Das sind Fragen aus allen Bereichen, nicht aus dem Kabinett.
  - Der Satz „Enter sendet, Umschalt und Enter macht eine neue Zeile“ ist Technikhinweis-Text.
  - Gespräche mit Ministern, die man hier erwarten würde, stecken im Unterreiter „Gespräche & Umfeld“ von 015. Dort heißt es ebenfalls „Gespräch“: zwei Orte, ein Begriff.
- **Klicks:**
  - „KI einrichten“: führt in die Einstellungen, gehört ins Menü ≡.
  - Chips und Senden: nötig, wenn das Feature bleibt.
- **Vorschlag:** Das Chatfeld als schwebenden „Berater“-Knopf (Porträt Zeynep Karaca) überall im Spiel anbieten, nicht als Reiter im Kabinett. Den Hinweis auf die KI-Einrichtung nur im Menü zeigen.

### Kabinett & Verwaltung › Verwaltung (017.png, 017b.png)
- **Frage des Spielers:** Warum geht nichts schneller, und wo ist mein Engpass?
- **Urteil:** zu kompliziert, doppelt
- **Befund:**
  - Dieselben Kopfbalken wie in Justiz (Verwaltungskraft 99, +2,4 im Monat; Baukapazität 133, 99 von 133 verplant) und dieselbe Baureihenfolge mit vier Projekten und zwölf Knöpfen: doppelt mit 010.
  - Drei Tabellen nebeneinander („Verwaltungskraft je Monat“: +19,5 / −7,6 / −9,5 / Saldo +2,4; „Politisches Kapital je Monat“: 3,5 / 2,0 / 1,5 / −0,0 / Summe 9,6; „Haushalt und Märkte“: Staatsschulden 23,0 % des BIP, Leitzins 23,5 %, Lira je Dollar 65,0, Risikoaufschlag 260 Punkte). Das ist eine Bilanzwand mit Nachkommastellen, „−0,0“ ist ein Darstellungsfehler.
  - Widerspruch: Der Kopf sagt „Kabinett: Kapital je Monat +3,7“, die Tabelle „Politisches Kapital je Monat Summe 9,6“, und „Kabinett“ taucht in der Tabelle gar nicht auf.
  - „Im monatlichen Verwaltungszufluss enthalten: 0,0 Punkte aus dem bereits wirksamen Personaletat.“ ist ein unverständlicher Satz über null.
  - „Haushalt und Märkte“ gehört in die Haushalts- und Wirtschaftsakte und ist auch dort schon vorhanden.
  - Der Unterreiter „Sonderrechte und Vorhaben 5“ ist eine weitere Ebene.
  - Gut: „Vorteile · Solide Verwaltung · noch nicht erreicht · Der Preis: …“ ist ein klarer Zielbaustein.
- **Klicks:**
  - Unterreiter: kann wegfallen.
  - „Was den Bau beschleunigt“: ins ⓘ.
  - ▲ ▼ Pausieren (zwölf): nötig, aber nur hier und nicht zusätzlich in Justiz.
- **Vorschlag:** Zwei Flussbilder statt Tabellen: „Verwaltungskraft“ und „Politisches Kapital“ als Zu- und Abflussbalken (Wasserfall), ganze Zahlen. Darunter die Bauwarteschlange als Gantt-Streifen mit Ziehen zum Umsortieren (Preis 10 Verwaltungskraft am Griff). Den Block „Haushalt und Märkte“ streichen. Die Kapitalrechnung einmal und widerspruchsfrei zeigen (Kopf und Tabelle müssen dieselbe Zahl haben).

### Kabinett & Verwaltung › Behörden (018.png)
- **Frage des Spielers:** Sind Steuerverwaltung und Statistikamt stark genug?
- **Urteil:** fast leer, doppelt (im Muster)
- **Befund:**
  - Zwei Karten (Steuerverwaltung, Statistikamt TÜİK) mit Punktbalken und „Etat ohne Spielraum“, dazu „0 im Ausbau / 2 Etat knapp“. Insgesamt 42 Wörter.
  - Das Muster ist dasselbe wie bei Parlament › Behörden (011). Behörden sind über die Akten verstreut, jede Akte hat ein bis zwei Karten.
  - Unter der TÜİK-Karte steht der Leiter „Volkan Akın“ in einer eigenen Zeile, das Layout ist uneinheitlich zur linken Karte.
  - Es ist nicht zu sehen, was eine schwache Steuerverwaltung kostet (z. B. entgangene Einnahmen). Gerade das wäre die Frage.
- **Klicks:** Karten öffnen das Behördeninstrument (Ausbau/Kürzen): nötig.
- **Vorschlag:** Entweder **eine** Behördenübersicht im ganzen Spiel (alle Behörden als Gebäude-Ikonen auf einem Bild, Farbe = Ausstattung) oder jede Behörde als Zeile in der Akte ihres Ministers (Steuerverwaltung beim Finanzminister). Hier gilt Letzteres, mit Wirkung am Regler: „Ausbau +1 Stufe: Preis … → Steuereinnahmen …“ (nur wenn im Modell vorhanden, sonst als Lücke benennen).

### Kabinett & Verwaltung › Regierungsbilanz (019.png)
- **Frage des Spielers:** Wie steht meine Regierung im Verlauf?
- **Urteil:** sinnlos, doppelt, missverständlich
- **Befund:**
  - Die Seite ist pixelgleich mit Gesetzesbilanz (012): dieselbe Zustimmungskurve, dieselbe Achse 50–52, die einen Rückgang um 2 Punkte dramatisch wirken lässt.
  - „Noch keine Wirkungsberichte in diesem Bereich“ steht, obwohl es Dutzende Berichte gibt. Sie sind nur anders verschlagwortet.
  - Kabinettsspezifische Verläufe fehlen: Loyalität je Minister, Rücktritte, Kapital je Monat.
- **Klicks:** keine.
- **Vorschlag:** Den Reiter streichen. Falls ein Verlauf bleibt, dann die Loyalität je Minister als kleine Linie unter jedem Porträt am Kabinettstisch.

### Kabinett & Verwaltung › Verantwortliche (020.png)
- **Frage des Spielers:** Wer sitzt in meiner Regierung, und wie loyal sind sie?
- **Urteil:** doppelt, missverständlich (aber das einzige Personenbild des Bereichs)
- **Befund:**
  - Acht Porträtkarten (Orhan Erdem, Selin Koçak, Taner Erdem, Zeynep Karaca, Cem Duran, Nazlı Turan, Levent Duran, Murat Erdem) mit „Haltung: verlässlich (61)“ usw. und einem Satz „will …“. Gute Porträts, aber nicht klickbar (0 Knöpfe).
  - Die Namen kollidieren: **drei Erdems** (Finanzen, Außen, Wirtschaft), **zwei Durans** (MHP-Vorsitz, Generalstab) und dreimal der Vorname Cem (Spieler, Oppositionsführer, MHP-Vorsitz). Brüder? Zufall? Das wird nicht erklärt, man verwechselt sie ständig. Murat Erdem (Wirtschaft) und Orhan Erdem (Finanzen) werden in Texten verwechselbar.
  - Cem Duran (MHP) ist kein Regierungsmitglied, steht aber unter „Verantwortliche“ im Kabinett **und** unter „Politische Akteure“ im Parlament.
  - Die Haltungswörter verlässlich, distanziert und abtrünnig stehen mit Zahl in Klammern. Grenzen und Folgen werden nicht erklärt. Loyalität 40 heißt hier „distanziert“, in 015 wird bei 40 vor „Eigeninteresse“ gewarnt, in 003 nicht.
- **Klicks:** keine. Gerade hier fehlt der Klick auf das Porträt, der zur Ministerakte führt.
- **Vorschlag:** Diese Karten **sind** der Kabinettstisch aus 015, nur als Kreis angeordnet und klickbar. Die Namensgenerierung muss Nachnamen-Dopplungen im Kabinett verhindern. Parteiführer gehören zum Parlament.

---

### Querschnitt A

**Wiederkehrende Muster**
1. **Leere Lage-Seiten als erster Reiter.** Mehrheitslage (005) und Handlungsfähigkeit (014) haben 21 bzw. 26 Wörter. Sie wiederholen Kopfkennzahlen, haben einen Knopf, der auf den Nachbarreiter verweist, und einen maschinellen Satz („Keine Einträge in …“). Das ist die erste Seite des Bereichs, und sie sagt nichts.
2. **Zu viele Reiterebenen.** Parlament hat 9 Reiter in zwei Zeilen, Kabinett 7. Dazu kommen Unterreiter (Lage/Reformen, Lage/Sonderrechte, Ministerrat/Gespräche/Machtkreis/Zusagen) und Unter-Unterreiter (Vorlagen/Befehle, Mentor Erklärt/Weltvergleich/Was tun?). Das sind bis zu vier Ebenen. Civilization hat eine.
3. **Dieselben Inhalte an drei bis vier Orten.**
   - Ministerfall Nazlı Turan: Schreibtisch, Parlament › Fraktionen, Kabinett › Ministerrat.
   - Ministervorschläge: Politik › Vorschläge, Kabinett › Vorlagen, Schreibtisch-Link „Heute: Was jetzt ansteht“.
   - Wirkungsberichte: Chronik, Berichte, Parlament › Umsetzung; dazu zweimal die falsche Meldung „noch keine Wirkungsberichte“.
   - Baureihenfolge und Verwaltungskraft: Justiz und Verwaltung.
   - Zustimmungskurve: Gesetzesbilanz = Regierungsbilanz.
   - Personen: Politische Akteure ∩ Verantwortliche.
   - Kopfkennzahlen: obere Leiste, Schreibtisch-Kopf, Stand der Dinge, Aktenkopf.
4. **Zwei Gesetzgebungssysteme nebeneinander.** Maßnahmen mit Stufen (Politik, „Als Gesetz einbringen“) und ein Gesetzeskatalog (Parlament › Gesetzesvorhaben: Mindestlohngesetz, Mietpreisbremse …). Der Spieler kann nicht wissen, welches gilt.
5. **Zwei Landesordnungen.** Die linke Hauptleiste hat 11 Akten, Politik 15 Bereiche. Dem stehen 7 Kabinettsressorts gegenüber, ohne Bildung, Gesundheit, Soziales und Umwelt. Folge: Der Wirtschaftsminister schlägt Migration und Luftreinhaltung vor, und das Präsidialamt „besitzt“ Renten- und Gesundheitsetat.
6. **Informationslose Etiketten.** „Mehrheit steht“ auf jeder Gesetzeskachel, „Gemischte Bilanz“ auf fast jedem Bericht, „± 0 zuletzt“ auf jeder Stand-Kachel, „Der bisherige Stand.“ auf jeder Verfassungskarte.
7. **Fachjargon und Nachkommastellen.** Groll, Beziehungspreis, Aufmerksamkeit, Verwaltungskraft, Baupunkte, Stufe 80 → 80, 262 Knoten, 1,0 Kapital, 87,3, 0,05 Prozentpunkte, −0,0, 666 Tage.
8. **Richtungslose Balken.** Bei Politik-Bereichen, Justiz und Verwaltung erkennt man nicht, ob hoch gut oder schlecht ist. ▲▼ bedeutet einmal den Trend, einmal die Bewertung.
9. **Layout- und Lesbarkeitsfehler.** Überdruckte Beschriftungen und ein Wort pro Zeile im Wirkungsnetz (004b), unlesbarer Kontrast in Quellen (s5), abgeschnittene dritte Ereignisoption (t03), umbrechende Reiterzeile (005), irreführende y-Achse 50–52 (012/019).
10. **Gute Bilder werden versteckt.** Das Halbrund liegt im dritten Reiter, die Gerichtsbesetzung als Punkte unter zehn Balken, die Porträts im letzten Reiter und ohne Klick.
11. **Widersprüche zwischen Seiten.** 373 vs. 362 erwartete Ja-Stimmen; 4 Parteien im Halbrund vs. 8 in der Verfassung; Kapital +3,7 vs. 9,6; Haftanstalten 86/87/87,3/88; „Weitester Stand“ liegt vor dem aktuellen.

**Vorgeschlagene Struktur (lieber zusammenlegen als neu bauen)**

| Bereich | Heute (Reiter) | Neu | Bild zuerst |
|---|---|---|---|
| **Schreibtisch** | Schreibtisch, Chronik, Berichte, Spielstand, Quellen (5) | **Eingang** (alle Entscheidungen: Ereignisse, Ministerfälle, Vorschläge, Fristen) · **Verlauf** (Chronik + Berichte + Beschlüsse als eine Zeitleiste) | Fristbalken je Zeile; Zustimmungskurve mit Ereignispunkten |
| Hauptmenü ≡ / Titel | – | Spielstand, Datei, Quellen/Lizenzen, KI-Einstellung | – |
| **Politik** | Bereiche, Vorschläge, Wirkungsnetz (3) | **eine Seite**: Bereichskreise (Democracy 4) → Klick → Maßnahmenzeilen mit Regler, Preis und Wirkungspfeilen; Aufklappen = Wirkungsbild; Vollnetz nur als Knopf. Gesetzeskatalog (006) hier einordnen, als Maßnahme mit Weg „Gesetz“ | 15 Kreise nach Größe und Zustand |
| **Parlament** | 9 Reiter | **Halbrund** (Start; Parteiblock klickbar → Parteikopf, Duldung/Koalition) · **Tagesordnung** (eingebrachte Gesetze mit Ja-Balken an der 301-Linie, laufende Umsetzung als Fortschritt) · **Justiz** (Gerichtspunkte + 4–5 Reglerzeilen + Gerichtsbehörde) · Knopf „Verfassungsänderung vorbereiten“ → kompakte Tafel mit Live-Halbrund | Halbrund |
| entfällt | Mehrheitslage, Gesetzesvorhaben (als Katalog), Umsetzung, Behörden, Gesetzesbilanz, Politische Akteure | in Halbrund, Tagesordnung, Politik oder Verlauf aufgegangen | – |
| **Kabinett** | 7 Reiter | **Kabinettstisch** (Start; 8 Porträts, Loyalitätsring, Vorlagen-Abzeichen) → Klick → **Ministerakte** (Befehle, Zusagen, Behörden des Ressorts, Ressortbudget als Kreisdiagramm aus `haushalt.ts`-Posten mit `amt`, Kürzen-Regler; Unteraufteilung je Posten = Datenlücke) · **Verwaltung** (Wasserfall Verwaltungskraft/Kapital + Bauwarteschlange, einmal im Spiel) | Kabinettstisch |
| entfällt | Handlungsfähigkeit, Ministerrat-Vorlagenliste, Gespräch (→ schwebender Berater), Behörden (→ Ministerakte), Regierungsbilanz, Verantwortliche (→ Tisch) | – | – |

Ergebnis: aus **27 Seiten** (5 + 3 + 9 + 7 + 3 Einstieg) werden **8 Hauptansichten**: Eingang, Verlauf, Politik, Halbrund, Tagesordnung, Justiz, Kabinettstisch/Ministerakte, Verwaltung. Dazu kommt die Verfassungstafel als seltener Dialog. Vorbedingungen, die vor dem Umbau entschieden werden müssen (ENTSCHEIDUNGEN): (a) eine Gesetzgebungsmechanik statt zwei, (b) eine Landesordnung (Politikbereiche ↔ Akten ↔ Ressorts), (c) fehlende Fachressorts (Bildung, Gesundheit, Soziales, Umwelt) ergänzen oder Bereiche bestehenden Ministern zuordnen, (d) Namensgenerator ohne doppelte Nachnamen im Kabinett.
