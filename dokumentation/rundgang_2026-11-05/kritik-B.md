# Kritik B: Wirtschaft (021–027) und Gesellschaft (028–033)

Grundlage: Bilder 021–033 (je NNN und NNNb), seiten.json, Quelltext unter game/src/ui/wirtschaft, ui/akte/Bereiche.tsx, ui/Waehler.tsx, ui/gesellschaft/GesellschaftAkte.tsx, sim/haushalt.ts, data/haushaltsplan.ts, data/behoerden.ts. Alle Zahlen stammen von den Bildschirmfotos oder aus dem Code. Wo Daten fehlen, steht „Datenlücke“.

Vorweg, weil es für alle sieben Wirtschaftsseiten gilt: Der Aktenkopf zeigt „Inflation 19,2 % · Wachstum 3,6 % · Lira je Dollar 65,0“. Zwei dieser drei Zahlen stehen schon in der oberen Leiste (19,2 %, 65,0). Die Reiterleiste bricht um: fünf Reiter links, darunter rechts eingerückt „Bilanz & Entwicklung“ und „Wirtschaftskabinett“. Dadurch sehen die beiden aus wie Unterreiter von „Zentralbank und Devisen“. Insgesamt sind es sieben Reiter in zwei Zeilen, bevor man überhaupt etwas sieht.

---

### Wirtschaft › Wirtschaftslage (021.png, 021b.png)
- **Frage des Spielers:** „Wie steht die Wirtschaft, was brennt, und was kann ich dagegen tun?“
- **Urteil:** zu lang, zu kompliziert, missverständlich
- **Befund:**
  - Links stehen etwa 26 Kennzahlen untereinander in vier Gruppen (Preise und Geld, Wirtschaft und Arbeit, Staat und Märkte, Alltag), alle gleich groß und alle mit Mini-Kurve. Prozentwerte („Inflation 19,2 %“) und Indexwerte ohne Einheit („Reallöhne 55,9“, „Investitionen 47,9“, „Kreditvergabe 43,3“) stehen in derselben Schrift nebeneinander. Was 55,9 bedeutet und ob das gut ist, sagt nichts. Es gibt keine Ampel und keine Reihenfolge nach Dringlichkeit.
  - Widerspruch auf demselben Bildschirm: Der Kopf zeigt „Wachstum 3,6 %“, die Liste „Wachstum 4,1 %“. Die Bilanz-Seite zeigt „2,3 → 3,6“ mit einer Spitze bei 4,1. Vermutlich ist das veröffentlicht gegen tatsächlich, aber die Seite erklärt es nicht.
  - Rechts steht „Was bewegt diese Zahl?“ mit Balken wie „Energiepreise +0,99 Prozentpunkte“. Im Text scheint ein interner Verweis durch: „Eine schwächere Lira verteuert Importe, vor allem Energie (Z5).“ Mit „(Z5)“ kann kein Spieler etwas anfangen.
  - Der Ländervergleich hat 16 Balken plus den Satz „Platz 7 von 193 (Platz 1 = höchster Wert der Welt) … Das ist ungünstig“, dazu eine abgeschnittene Zeile „Türkei im Spiel (zuletzt verö…“. Das füllt einen halben Bildschirm für eine Aussage, die in eine Zeile passt: „Türkei 19,2 %, Welt 3,0 %, Platz 7 von 193“.
  - Die Seite ist 2.478 px lang mit 27 Knöpfen. „Was Sie tun können“, also der eigentliche Spielinhalt, kommt erst nach Kurve, Ursachen und Weltvergleich.
- **Klicks:**
  - 26 Kennzahl-Zeilen: Sie wechseln die rechte Detailspalte. Nötig, aber 26 sind zu viele. Besser 6 große Kacheln, der Rest eingeklappt.
  - „seit Amtsantritt ▼ −11,3“ und „zum Vorjahr ▼ −6,6“: Das sind Anzeigen, sehen aber aus wie Knöpfe (Pillenform). Besser als Text.
  - Die Zeichenleiste unter der Kurve (♦ Haushalt, ▲ Ereignis, ■ Zinsentscheid) ist eine gute Idee. Unklar bleibt, ob man sie anklicken kann. Besser: Klick auf eine Marke öffnet den Wirkungsbericht.
  - „Alle Vergleichsländer zeigen“: unnötig, kann weg.
  - „Was Sie tun können“ mit Handlung und Vorschau „Was wäre wenn“: nötig. Gehört nach oben.
- **Vorschlag:** Oben sechs große Kacheln als Ampel-Tachos für die Größen, die regieren: Inflation, Arbeitslosigkeit, Wachstum, Lira, Defizit und Reserven. Jede Kachel zeigt Zielband, Tendenzpfeil und Farbe. Klick auf eine Kachel öffnet darunter genau drei Dinge: die Kurve mit Ereignismarken, die zwei bis drei stärksten Ursachen als Balken und zwei bis drei Handlungen mit Preis und Vorschau auf derselben Kurve (gestrichelte Prognose). Der Weltvergleich wird eine Zeile mit Rang. Die übrigen 20 Indizes kommen in einen Reiter „Alle Kennzahlen“, und jeder Index ohne Einheit braucht eine Lesehilfe („0–100, über 50 ist besser als 2026“). Die Seite „Bilanz & Entwicklung“ wird hier hineingelegt (Schalter „seit Amtsantritt“). Die Marke „(Z5)“ und ähnliche Verweise müssen aus den Texten.

### Wirtschaft › Krisenrat (022.png, 022b.png)
- **Frage des Spielers:** „Die Leute leiden unter den Preisen. Welches Hilfspaket kann ich schnüren, was kostet es, und bekomme ich dafür eine Mehrheit?“
- **Urteil:** doppelt, missverständlich, zu kompliziert
- **Befund:**
  - Die drei Kopfkacheln „Armutsbelastung 36,0 / 100 · Zustimmung im Land 50,2 % · Regierungssitze 328 / 301“ wiederholen Werte von anderswo: die Zustimmung aus Kopf und Leiste, die Sitze aus dem Parlament. Die Armutsbelastung steht 200 px tiefer gleich noch einmal („36,0 / 100“).
  - Dazu kommen drei verschiedene Zustimmungswerte im Spiel: Leiste 50 %, Krisenrat 50,2 %, Wählerkoalition 54 % („Ekran Onlinepanel“). Welcher zählt?
  - Falsche Unterzeile: Unter „Arbeitslosigkeit 9,7 %“ steht „Inflation: 19,2 % pro Jahr“.
  - Es gibt sechs Karten mit „Folgen prüfen →“ in zwei Stilen: drei graue im Kasten („Untere Löhne stärken“, „Arbeitslose absichern“, „Wege zurück in Arbeit“, im Code KRISENGESETZE, also Gesetze) und drei große weiße („Gezielte Kaufkrafthilfe“, „Hilfen gezielt umschichten“, „Soziales Netz schützen“, im Code KRISENPAKETE, also voreingestellte Kombinationen der Haushaltsregler Sozialhilfe, Subventionen und Verbrauchsteuer). Dass das eine ein Gesetz ist und das andere eine Haushaltsänderung, sieht man nicht.
  - Regeltext statt Bild: „Politischer Tiefstand: 0 von 6 Monaten. Unter 25 % Zustimmung steigt der Zähler; ab 25 % sinkt er schrittweise. Eine Parlamentsmehrheit allein verhindert diesen Vertrauensverlust nicht.“ Das ist bei 50 % Zustimmung bedeutungslos und sollte nur erscheinen, wenn der Zähler läuft.
  - Die Schrittleiste „01 Entlastung finanzieren · 02 Mehrheit verhandeln · 03 Zusagen & Wirkung prüfen“ ist reine Deko. Man kann die Schritte nicht anklicken.
- **Klicks:**
  - Sechs Mal „Folgen prüfen →“: Darunter klappt eine Entscheidungskarte mit Kapital, Aufmerksamkeit, Saldo, Postenliste, Gruppen, Prognose und Partnerrisiken auf. Nötig ist nur die Wahl selbst. Besser: Das Paket wird im Haushaltsrad als Vorschau eingeblendet (die Stücke wachsen und schrumpfen sichtbar), und der Knopf „Einbringen“ steht dort.
  - „Haushalt verfolgen →“ führt zum Reiter Haushalt. Fällt weg, wenn die Pakete dort liegen.
  - „Fraktionen im Parlament öffnen →“ und „Zusagen & Koalition sichern →“ führen aus der Wirtschaftsakte hinaus. Besser ist eine Mehrheitsanzeige (Halbrund 328/301 mit Ja-Prognose) direkt am Paket.
- **Vorschlag:** Den Reiter abschaffen. Die drei Krisenpakete werden im Haushalt zu „Fertige Pakete“: drei Knöpfe über den Reglern, die die Regler vorab verschieben und das Rad in der Vorschau umfärben, mit Preis und Mehrheit am Knopf. Die drei Krisengesetze (Mindestlohn, Arbeitslosengeld, Ausbildung) gehören in die Maßnahmentafel unter Politik, wo der Mindestlohn ohnehin schon steht (004: „Mindestlohn 80“). Der Kasten „Preise, Einkommen & Arbeit“ mit Lebenshaltung, Realeinkommen, Armut und Arbeitslosigkeit wird zur Kachelzeile in der Wirtschaftslage. Der Krisenrat erscheint als Ereignis oder Schreibtisch-Eintrag nur dann, wenn die Armut oder der Tiefstandszähler eine Schwelle reißt. So wird er wieder zur Krise statt zu einem Dauerreiter.

### Wirtschaft › Haushalt (023.png, 023b.png)
- **Frage des Spielers:** „Wofür gebe ich das Geld aus, woher kommt es, wo kann ich kürzen, und was kostet mich das politisch?“
- **Urteil:** Das Rad ist richtig. Die Ausführung ist missverständlich, zu lang und unschön. Der Drill-down fehlt.
- **Befund:**
  - Das größte Stück ist „Staat und Preise 10,8 Bio. ₺ · 33 %“, und das ist ein Etikettenschwindel. Im Code (HaushaltsRad.tsx, Gruppe „staat“) stecken darin Kultur (254 Mrd.), Justiz (445), Diplomatie (191), Subventionen und vor allem „Personal“. Personal steht in haushaltsplan.ts mit 5.507 Mrd. Lira = 7,0 % des BIP und dem Vermerk „überschneidet sich mit den Fachressorts“. Rechnerisch macht Personal etwa 8,9 von 10,8 Bio. aus. Das Stück, das am meisten Geld zeigt, ist also eine ökonomische Ausgabenart (Gehälter aller Ressorts), keine Aufgabe, und der Name verschweigt das. Wer hier kürzt, kürzt Lehrer, Ärzte und Polizisten, ohne es zu sehen.
  - Drei Regler zeigen exakt denselben Betrag: Sozialhilfe und Familie, Gesundheit und Innere Sicherheit stehen je bei „1.270 Mrd. Lira · 1,0 % BIP“. Das ist sichtbar ein Platzhalter (`startBip: 1`, Beleg „Spielparameter, zu prüfen“). Der Spieler merkt es sofort, und es kostet Glaubwürdigkeit.
  - Der innere Ring hat fünf Braun- und Ockertöne (Lohnsteuer, MwSt., KSt., Übrige, Gebühren) plus Schraffur. Die Töne sind kaum zu unterscheiden, und auf dem Ring steht keine Beschriftung. Die Legende sitzt links (Ausgaben) und rechts (Einnahmen) mit dem Rad dazwischen, das Auge springt dreimal. Das schraffierte Stück „Neue Schulden 3,7 Bio. · 13 %“ ist dagegen gut.
  - „Ein Klick führt zu den Reglern“: Der Klick scrollt nur zur Reglergruppe (`scrollIntoView`). Das ist kein Drill-down, und der Inhaber verlangt ausdrücklich einen.
  - Darunter folgen 20 Reglerzeilen in der linken Hälfte. Die rechte Hälfte hat nur die drei Steuerregler und ist ab etwa 45 % Seitenhöhe leer (023b: rechts eine weiße Fläche über die ganze Höhe). Gesamtlänge 2.185 px bei 77 Knöpfen.
  - „Ministerium will +1 / +2 / +3“ steht in kleiner roter Schrift unter jedem Posten. Jedes Ministerium will mehr, die Einheit (Stufen) ist nicht erklärt, und welcher Minister das will, steht nirgends. Gesundheit, Bildung, Renten und Soziales hängen im Code an `amt: "stab"`, also am Präsidialamt. Einen Gesundheits- oder Bildungsminister gibt es nicht.
  - Die Preisregel steht als Fließtext unter dem Rad („Außerhalb des Oktober-Fensters kostet jede Änderung das 2-fache an Kapital (in die unbeliebte Richtung nochmals doppelt) und etwas Legitimität“) statt als Preis am Regler. Die Leiste oben nennt das Defizit „2,9 % Haushalt“, im Rad heißt es „Defizit 2,9 % des BIP“. Gleiche Zahl, anderes Wort.
- **Klicks:**
  - Stück im Außenring oder Legendenzeile: scrollt zur Reglergruppe. Besser: öffnet das Ministeriumsrad (siehe unten).
  - Stück im Innenring: scrollt zu den Steuern. Besser: öffnet ein Einnahmenrad (MwSt., ÖTV, Einkommensteuer, Körperschaftsteuer, Bankensteuer, Zölle, Stempel, Kfz). Die Daten liegen in `STEUERN_2026` schon vor.
  - 20 × „−“, Regler, „+“ und Klick auf den Namen (öffnet die Wirkungstafel): nötig. Die Tafel soll aber neben dem Rad erscheinen, nicht in der Liste.
  - Fünf Knöpfe unter „mehr“ (Haushaltszyklus, Abschluss, Rechnung, Bisher, Plan 2026): nachlesbar, gehören als Reiter ans Seitenende. In Ordnung, nur zu viele. Zyklus und Plan zusammenlegen, Bisher und Abschluss zusammenlegen.
- **Vorschlag: Drill-down „Rad → Ministerium → kürzen“**
  1. **Ebene 1, Gesamthaushalt.** Der Außenring zeigt Ressorts statt der sechs Sammelgruppen. Jedes Stück trägt eine Ikone und den Namen auf dem Ring selbst (ab 4 % Anteil, kleinere Stücke über eine Führungslinie). Beim Darüberfahren erscheint das Ministerbild in der Mitte. „Zinsen“ wird grau und gesperrt („nicht kürzbar, folgt Schuld × Zins“). Personal kommt als eigenes, ehrlich benanntes Stück „Öffentlicher Dienst (Gehälter aller Ressorts)“ hinzu, bis die Aufteilung auf die Ressorts belegt ist. Der Innenring bleibt bei den Einnahmen, mit unterscheidbaren Farben und Beschriftung am Ring.
  2. **Ebene 2, Ministeriumsrad (Klick auf ein Stück).** Das Rad zoomt animiert in das Stück hinein. Oben steht der Minister: Bild, Name, Loyalität, Wunsch („will +2 Stufen = +0,4 % BIP“), Etat in Bio. ₺ und % BIP, Anteil am Gesamthaushalt. Das Ministeriumsrad selbst zeigt die Unterposten. Erstens nach Art: Personal, laufender Betrieb (Waren und Dienstleistungen), Investitionen, Übertragungen oder Programme. Zweitens die Behörden des Ressorts aus `data/behoerden.ts` (etwa Gesundheitswesen mit den Achsen Personal, Technik und Reichweite und deren Unterhalt in % BIP). Rechts davon je Unterposten eine Zeile mit Schere oder Regler (in 5-%-Schritten), daneben Preis (Kapital × Fensterfaktor, Legitimität, Ministerloyalität) und Wirkung (`dauer`-Größen mit Reifezeit, `sofort`-Gruppen, aus dem Katalog die Zeilen gewinner, verlierer und kehrseite). Eine Kürzung zeigt das Stück schrumpfend und die betroffenen Wählergruppen als kleine Kreise, die rot aufblinken (Verbindung zur Gesellschaftsseite).
  3. **Ebene 3 (optional).** Klick auf ein Behördenstück öffnet die vorhandene Behördenkarte (Ausbau und Kürzung). Damit entfällt der eigene Reiter „Behörden“ in den Akten. Ein Knopf „← Gesamthaushalt“ und das laufende Defizit in der Mitte bleiben immer sichtbar.
  - **Benötigte Daten und wo sie fehlen:**
    - Ausgaben je Ministerium (institutionelle Gliederung) 2026: **Datenlücke.** haushaltsplan.ts kennt nur acht ökonomische Arten (Übertragungen 6.821, Personal 5.507, Zinsen 2.742, Investitionen 1.312, Waren 1.250, Kapitaltransfers 525, Darlehen 397, Reserve 375 Mrd.). Quelle zu recherchieren: Haushaltsgesetz 2026, Tabelle (A) nach Einrichtungen (Merkezi Yönetim Bütçe Kanunu, „kurumsal sınıflandırma“, Strateji ve Bütçe Başkanlığı).
    - Kreuztabelle Ministerium × ökonomische Art (wie viel Personal, Investition und Übertragung je Ressort): **Datenlücke.** Sie wird gebraucht, um das Stück „Personal“ auf die Ressorts zu verteilen und die Doppelzählung zu beenden. Quelle zu prüfen: dieselbe Tabelle (A) und die Haushaltsabschlüsse der Muhasebat (Kamu Hesapları).
    - Funktionale Gliederung (COFOG): **Datenlücke.** Der Code nennt sie selbst als offen („zu prüfen gegen … TÜİK COFOG / Muhasebat fonksiyonel sınıflandırma“). 13 der 17 Ressortanteile sind „Spielparameter“, nur Renten (SGK-Zuschuss 2.329 Mrd.), Investitionen und Personal sind abgeleitet.
    - Programme innerhalb eines Ministeriums (für das Ministeriumsrad nach Aufgaben statt nach Art): **Datenlücke.** Zu prüfen ist, ob die Programmhaushalte des SBB eine nutzbare Gliederung je Ressort liefern.
    - Minister je Ressort: **Datenlücke im Spiel.** `Figur.amt` kennt nur finanzen, inneres, aussen, zentralbank, justiz, generalstab, wirtschaft und stab. Gesundheit, Bildung, Arbeit und Soziales, Familie, Verkehr, Umwelt und Städtebau, Landwirtschaft, Energie, Kultur und Tourismus sowie Industrie haben keine eigene Person. Der Wirtschaftsminister trägt sechs Posten (Forschung, Investitionen, Wohnen, Landwirtschaft, Umwelt und Energie, Subventionen).
    - Zuordnung Ressort → Haushaltsposten: nur teilweise vorhanden. `RESSORT_POSTEN` in data/behoerden.ts hat sieben Einträge (praesidialamt und inneres → innere_sicherheit, justiz, finanzen → personal, gesundheit, bildung, aussen → diplomatie). Für Renten, Sozialhilfe, Verteidigung, Investitionen, Wohnen, Landwirtschaft, Umwelt, Kultur, Forschung und Subventionen fehlt ein Ressort. Konsistenz prüfen: Die Rückfall-Kennung `posten: "gesundheit_bildung"` der Behörde Gesundheitswesen zeigt über `POSTEN_ALIAS` auf den Regler **Bildung**, und Polizei und Grenzschutz zeigen über `"sicherheit"` auf **Verteidigung**.
    - Wirkung je Unterposten: Bisher gibt es `sofort` und `dauer` nur je ganzem Posten. Eine Aufteilung (etwa Kürzung beim Personal wirkt auf „aerzte“, Kürzung bei Investitionen auf „gesundheitsversorgung“) wäre Spielparameter und muss so gekennzeichnet werden.
  - Was wegfällt: der Fließtext zur Preisregel (er wandert als Preis an jeden Regler), der Scroll-Klick und die leere rechte Hälfte. Die 20 Regler stehen nicht mehr alle in einer Liste, sondern jeweils fünf bis acht im Ministeriumsrad. Wer alle auf einmal will, bekommt den Reiter „Alle Posten“.

### Wirtschaft › Versorgung & Handel (024.png, 024b.png)
- **Frage des Spielers:** „Fehlt dem Land etwas, und woher kommt es?“
- **Urteil:** fast leer im Frieden, zu lang, doppelt
- **Befund:**
  - Die Antwort lautet „Ungedeckte Warengruppen: 0 · Zivile Bedarfsdeckung 100 % · Treibstoff für den Einsatz —“. Die Seite ist damit nach einer Zeile fertig, läuft aber über 2.076 px weiter.
  - „Wem geben Sie im Engpass Vorrang?“ bietet drei Karten (Anteilig, Zivile Versorgung zuerst, Streitkräfte zuerst), dazu „Kurswechsel: 3 politisches Kapital · 30 Tage Bindung“. Ohne Engpass und ohne Krieg ist das eine Entscheidung ohne Folgen. Die Karte „Streitkräfte zuerst“ verspricht „mehr Treibstoff für die Front“, wo es keine Front gibt.
  - Der Monatsbericht „Was Ihre Entscheidungen bewirken“ zeigt „Zivile Bedarfsdeckung 100,0 % · Vertrauen · Versorgungsbeitrag 0,00 · Parlamentarische Reaktion: Abwartend“, darunter „Ihre Entscheidungen im Vergleich“ und „Warum die Parteien reagieren“. Das ist derselbe Baustein wie auf der Parlamentsseite (007 hat dieselben drei Überschriften): doppelt und hier voller Nullen.
  - Der Kicker „KABINETT · VERSORGUNG & SICHERHEIT“ steht über einer Wirtschaftsseite. Wo ist man?
  - Weiter unten folgen sieben Warengruppen (Lebensmittel, Wasser, Energie, Rohstoffe, Industriegüter, Rüstung, Getreide) plus „Nächster Monat · Mengenrechnung“, „Lieferländer“ und „Abnehmer“. Das Interessante, nämlich Handel und Abhängigkeit, kommt erst nach dem Leerlauf. Getreide steht getrennt von Lebensmitteln, warum, bleibt offen.
- **Klicks:**
  - „Versorgungswege auf der Karte →“: der einzige gute Klick, denn er gehört auf die Karte. Er sollte vorn stehen.
  - Drei Vorrangkarten mit „Vorschau ansehen“: nötig nur im Engpass. Sonst ausblenden.
  - Ein Regler (Mengenrechnung): ohne Engpass bedeutungslos.
- **Vorschlag:** Den Reiter umbauen zu „Handel“. Hauptbild ist eine Weltkarte oder ein Sankey: Pfeile von den Lieferländern zur Türkei und von der Türkei zu den Abnehmern, die Dicke nach Wert, rot, wo ein Lieferant feindlich oder unsicher ist. Darunter sieben Warenikonen als Füllstände (Bedarf gegen Deckung). Die Vorrangfrage erscheint erst, wenn eine Ikone unter 100 % fällt, dann groß und mit Preis. Der Monatsbericht-Baustein fliegt raus und wird höchstens eine Zeile im Wirkungsbericht. Im Frieden steht die Versorgung als eine Ampel in der Wirtschaftslage.

### Wirtschaft › Zentralbank und Devisen (025.png, 025b.png)
- **Frage des Spielers:** „Was macht die Bank bei der nächsten Sitzung, soll ich mich einmischen, und wie viel Munition (Reserven) habe ich?“
- **Urteil:** zu lang (4.798 px, die längste Seite dieses Blocks), doppelt, missverständlich
- **Befund:**
  - Neun Abschnitte untereinander: Gouverneurin, Nächste Zinssitzung, Was danach kommt (Kurve mit fünf Unterreitern Leitzins, Inflation, Wachstum, Lira, Arbeitslosigkeit), Wer die Zinsen macht, Wie unabhängig ist die Bank, Reserven, Intervention (2, 5 oder 10 Mrd. $), IWF und Was die Bank beschlossen hat. Das sind 1.014 Wörter.
  - Die wichtigste Zeile steht im zweiten Kasten: „Ohne Ihr Zutun … senkt sie den Zins von 23,5 auf 23,0 %“, mit den Optionen Nicht einmischen, Rede halten, Gespräch führen und Vorgabe. Gut, aber erst nach einem Kopf, der vier Zahlen und einen Fremdkörper bringt: „Reformen und Haushalt benötigen zusammen zusätzlich -0,4 % des BIP pro Jahr. … Dies ist nicht das gesamte Haushaltsdefizit.“ „Benötigen zusätzlich minus 0,4“ ist unverständlich und gehört, wenn überhaupt, in den Haushalt.
  - Widerspruch zur Seite 027: Hier steht „Haltung: streng · Verhältnis zu Ihnen: distanziert“, im Wirtschaftskabinett „Sevgi Erdem … Haltung: verlässlich (50)“. Dasselbe Wort „Haltung“ meint einmal die geldpolitische Linie und einmal die Loyalität.
  - Die Kurve „Was danach kommt“ ist dieselbe wie in der Wirtschaftslage (021: Inflation mit Prognoseband und Zinsentscheid-Marken): doppelt.
  - „Wer die Zinsen macht“ zeigt drei Typenkarten (Streng, Ausgewogen, Gefügig) mit „Einsetzen“. Das ist der stärkste Spielhebel der Seite und sitzt bei etwa 45 % Seitenhöhe.
  - „Wie unabhängig ist die Bank?“ (Gesetzesstufe B) und „Was die Bank beschlossen hat“ (Verlauf) sind reiner Lesestoff.
- **Klicks:**
  - Optionen zur Zinssitzung (vier Auswahlfelder, davon mehrere mit Kapitalpreis): nötig, nach oben.
  - Fünf Kurvenreiter: doppelt zur Wirtschaftslage. Höchstens zwei behalten (Leitzins mit Inflation, Lira).
  - „Einsetzen“ für eine neue Gouverneurin (drei Karten): nötig, ins Porträt verlegen („Gouverneurin ersetzen ▾“).
  - Intervention 2, 5 oder 10 Mrd. $ mit „Verkaufen“: nötig, an die Reservenanzeige.
  - „Beim IWF anfragen“, „Kündigen“, „Unterzeichnen“: nötig, aber selten. In eine Notfallkarte, die erst bei niedrigen Reserven erscheint (die Warnschwelle `zb.warnung` gibt es schon).
  - „Gespräch führen“ und „Rede halten“: nötig, gehören direkt an die Sitzung.
- **Vorschlag:** Ein Bildschirm statt neun Kästen. Links das Porträt der Gouverneurin mit Linie (streng, ausgewogen, gefügig) und Loyalität als zwei getrennt benannte Werte, darunter „Ersetzen“. In der Mitte ein Halbrund-Tacho „Leitzins 23,5 % gegen Inflation 19,2 %“, der Abstand als Realzins 6,8 % farbig, mit einem Zeiger „Bank will 23,0 %“ und einem zweiten Zeiger „Sie wollen …“, den der Spieler zieht. Der Preis des Eingriffs (Kapital, Glaubwürdigkeit, Risikoaufschlag) steht am Zeiger. Rechts ein Tank „Netto-Reserven 23,9 Mrd. $“ (brutto 169,3 als Hinweis) mit den drei Interventionsknöpfen und der Warnmarke. IWF, Zentralbankgesetz und Beschlussverlauf kommen in Reiter darunter. Ziel: höchstens 1.200 px.

### Wirtschaft › Bilanz & Entwicklung (026.png)
- **Frage des Spielers:** „Habe ich die Wirtschaft seit Amtsantritt besser oder schlechter gemacht?“
- **Urteil:** doppelt, missverständlich
- **Befund:**
  - Sechs kleine Kurven (Inflation 31,5 → 19,2, Wachstum 2,3 → 3,6, Arbeitslosigkeit 8,1 → 9,7, Leitzins 37,0 → 23,5, Lira 38,8 → 64,9, Staatsschulden 23,8 → 23,0). Alle sind auf Minimum bis Maximum skaliert. Der Schuldenrückgang um 0,8 Punkte sieht deshalb aus wie ein Absturz, die Arbeitslosigkeit von 8,1 auf 9,7 wie eine Verdopplung. Eine Achse ab null oder ein Zielband fehlt.
  - Keine Wertung: Ist „Lira 38,8 → 64,9“ ein Erfolg oder eine Katastrophe? Gut oder schlecht wird nicht gefärbt.
  - Die Zeitachsen beginnen bei 2027-06. Die Gesellschaftskurven (032) beginnen bei 2028-07, die Zustimmung in 029 bei Apr. 2029. Drei verschiedene Anfänge für „seit Amtsantritt“.
  - Die Wirkungsberichte sind als Textzeilen aufgelistet („Mindestlohn … Gemischt: Reallöhne +8,3 Punkte, jetzt 53,2, aber Kostendruck der Betriebe +5,3“). Sie berichten über Maßnahmen aus der Politik-Akte, nicht über die Wirtschaftsseite.
  - Alle Reihen gibt es schon als große Kurve in der Wirtschaftslage.
- **Klicks:** keine (0 Knöpfe). Die Kurven sind nicht anklickbar und führen nicht zur Detailkurve.
- **Vorschlag:** Als eigener Reiter streichen. In der Wirtschaftslage bekommt jede Kachel ein „seit Amtsantritt“ mit grünem oder rotem Pfeil. Die Wirkungsberichte werden Marken auf der großen Kurve (die Zeichenleiste ♦ ▲ ■ gibt es schon), und ein Klick auf eine Marke zeigt den Bericht. Eine Bilanz über alle Bereiche gehört einmal ins Spiel (Schreibtisch oder Jahresbericht), nicht in jede Akte.

### Wirtschaft › Wirtschaftskabinett (027.png)
- **Frage des Spielers:** „Wer sind meine Leute für die Wirtschaft, und folgen sie mir?“
- **Urteil:** fast leer, doppelt, missverständlich
- **Befund:**
  - Drei Karten (Orhan Erdem, Finanzminister, „verlässlich (61)“; Sevgi Erdem, Gouverneurin, „verlässlich (50)“; Murat Erdem, Wirtschaftsminister, „distanziert (40)“) mit je einem Satz Wunsch. Darunter ist die Seite leer, 623 px mit viel weißer Fläche.
  - Alle drei heißen Erdem. Das sieht nach einem Fehler des Namensgebers aus oder nach Vetternwirtschaft, über die nie erzählt wird. In beiden Fällen ist es missverständlich.
  - „Haltung: verlässlich (50)“ steht gegen „Haltung: streng“ auf Seite 025, siehe dort.
  - 0 Knöpfe: Man kann weder ein Gespräch führen noch entlassen oder zur Person springen. Die Personen stehen außerdem ohnehin unter Kabinett & Verwaltung.
- **Klicks:** keine.
- **Vorschlag:** Den Reiter streichen. Die Personen erscheinen dort, wo sie wirken: der Finanzminister als Porträt im Haushaltsrad (Mitte oder Kopf: „Orhan Erdem warnt: Defizit über 3 %“), die Gouverneurin auf der Zentralbankseite (ist schon so), der Wirtschaftsminister in Handel und Wirtschaftslage. Klick auf ein Porträt öffnet die Personenakte im Kabinett. Den Namensgenerator auf doppelte Nachnamen im Kabinett prüfen.

---

### Gesellschaft › Stimmung im Land (028.png)
- **Frage des Spielers:** „Wie ist die Stimmung im Volk, und welche Gruppe wird mir gefährlich?“
- **Urteil:** fast leer, missverständlich, doppelt
- **Befund:**
  - Groß steht „Lage: ruhig · Keine der Kernzahlen steht im roten Bereich“. Gleichzeitig zeigen die Kurven (032) „Stärke der Opposition 55 → 65“, „Groll der Milieus 23 → 26“ und „Rathäuser des Lagers 32 → 19“. Die Regierung hat also 13 Rathäuser verloren, und die Seite sagt „ruhig“.
  - Unter „Milieus“ stehen vier Kacheln (Aleviten 42/31, Frauen 39/35, Geflüchtete 48/19, Diaspora 41/31) plus „▶ 1 weiterer Eintrag“. Ein einziger Eintrag versteckt hinter einem Aufklapper ist absurd.
  - Es gibt zwei parallele Gruppensysteme. Hier sind es Milieus mit „Stimmung · Groll“, im nächsten Reiter elf Wählergruppen (Beschäftigte, Rentner, Junge Erwachsene, Religiös-Konservative, Säkulare Städter, Menschen in Armut …) mit „Stimmung“ und Träger, schwankend oder abgewandt. Wie beide zusammenhängen (sind Frauen eine Wählergruppe? Aleviten?), erklärt keine Seite.
  - Die Kacheln sind nicht anklickbar.
  - Fast die ganze Seite unterhalb von 620 px ist leer.
- **Klicks:**
  - „Wählerkoalition öffnen“: führt zum Nachbarreiter, der einen Zentimeter darüber steht. Unnötig.
  - „▶ 1 weiterer Eintrag“: unnötig, alle fünf zeigen.
- **Vorschlag:** Mit der Wählerkoalition zu einem Hauptbild zusammenlegen (siehe Querschnitt): das Kreisfeld der Gruppen. „Lage“ wird ein Satz, der die echte Gefahr nennt („Opposition so stark wie nie seit Amtsantritt, 13 Rathäuser verloren“), und nicht ein Etikett, das nur auf drei Kopfwerte schaut.

### Gesellschaft › Wählerkoalition (029.png, 029b.png)
- **Frage des Spielers:** „Würde ich heute gewinnen, wer trägt mich, wen verliere ich, und was hilft?“
- **Urteil:** zu lang (4.086 px, 785 Wörter, 44 Knöpfe), zu kompliziert, missverständlich. Der Inhalt ist der beste der ganzen Gesellschaftsakte, aber falsch verpackt.
- **Befund:**
  - Oben steht „54 % … nötig sind 50“, im Kopf derselben Akte „Zustimmung 50 %“, in der Leiste „50 %“. Die Erklärung „Die Zahl ist eine Umfrage, keine Messung der Wahrheit: Rohdaten gibt es im Reiter ‚Medien‘ der Zeitung“ schickt den Spieler in eine andere Akte, statt die beiden Zahlen nebeneinander zu zeigen („Umfrage 54 %, Ihr Lagebild 50 %“). „Die Wahl ist am 2030-12-05“ steht im Rohformat, sonst schreibt das Spiel „5. Dezember 2030“.
  - Die Koalitionsleiste (37 % tragen, 63 % schwanken, 0 % abgewandt) ist gut und schnell lesbar.
  - „Ihre Wähler“ sind elf Gruppen als hohe Karten untereinander (Beschäftigte 58 ▲2,0, Rentner 62 ▲1,0, Junge 47, Religiös-Konservative 59, Säkulare Städter 47, Menschen in Armut …). Eine Karte ist etwa 100 px hoch, die Liste also über 1.100 px. Größe ist nur als Wort angegeben („großes Gewicht“, „mittleres Gewicht“), obwohl der Code den Anteil kennt (`g.anteil`). Genau hier gehört das Democracy-4-Kreisbild hin.
  - Die Detailspalte rechts: „Warum sie so gestimmt sind“ mit verschachtelten Ursachen („Inflation 12,3 Punkte unter dem Ausgangswert · drückt Mieten −6,1“, grüner Balken). Dass Inflation Mieten drückt und das für Junge grün ist, versteht niemand ohne Netzkenntnis.
  - „Was sie wollen und was sie stört“: zwölf Maßnahmen mit Mini-Balken und Wert. „Sie haben es gegen ihren Wunsch verändert (+20 Stufen)“ bei Rentenerhöhungen und „+30 Stufen“ bei Mindestlohn sagt nicht, was eine Stufe ist. Gut: Die Maßnahmen sind als Verweis unterstrichen.
  - Drei weitere Aufklapper (Worauf sie achten, Wohin sie wechseln würden, Was jetzt helfen würde) und „Was dazu schon auf dem Tisch liegt“.
  - Versteckt: Der zweite Unterreiter „Gesellschaft, Opposition, Straße“ öffnet noch einmal vier Reiter (Lage, Opposition, Straße, Kommunen). Dort liegen die harten Spielhebel: Verfahren gegen die Opposition, Immunität aufheben, Parteiverbot, Bewegungen auf der Straße und Zwangsverwalter in Rathäusern, jeweils mit Kapitalpreis. Das ist Akte › Reiter › Unterreiter › Unter-Unterreiter, vier Ebenen tief.
- **Klicks:**
  - Zwei Unterreiter (Wählerkoalition und Gesellschaft, Opposition, Straße): Der zweite gehört als eigener Hauptreiter nach oben.
  - „Woher die Zahl kommt, seit dem Amtsantritt“ (Aufklapper): als Hinweis an der Kurve genügt.
  - „Ansehen“ bei „Am ehesten zu gewinnen: Junge Erwachsene. Läge sie bei 58, brächte das 0,3 Punkte Zustimmung“: gut. Er sollte den Kreis hervorheben.
  - Elf Gruppenkarten (wählen die Detailspalte): nötig, als Kreise.
  - Zwölf Maßnahmenverweise: führen in die Politik. Nötig, und besser mit einem Regler gleich an Ort und Stelle (Vorschau, wie sich die Gruppe bewegt).
  - Vier Aufklapper: zu einer Kurzansicht zusammenlegen.
- **Vorschlag:** Das Hauptbild der Gesellschaft wird ein Kreisfeld wie in Democracy 4. Jede Wählergruppe ist ein Kreis: Fläche nach Anteil, Füllfarbe nach Stimmung (rot über grau nach grün), Randart nach Träger (voll), schwankend (gestrichelt) oder abgewandt (rot). Ein kleiner Pfeil zeigt die Tendenz, die Marke „wohin sie strebt“ wird ein Schatten des Kreises. Die Kreise stehen auf einer Achse von „gegen mich“ bis „für mich“, sodass man die Mehrheit als Linie sieht. Dazu „Wahl in 10 Monaten: Umfrage 54 %, nötig 50“. Beim Darüberfahren über einen Kreis leuchten die Maßnahmen und Größen auf, die ihn bewegen, wie in Democracy 4. Klick öffnet eine schmale Seitenleiste mit drei Ursachen als Balken, drei Wünschen mit Regler und Preis und „Wohin sie wechseln“ als Pfeil zur Partei. Die Milieus erscheinen als zweite Schicht (Schalter „Milieus“) mit dem Groll als roter Zacken am Kreis. Ziel: alles auf einem Bildschirm von 900 px, nicht 4.086.

### Gesellschaft › Wahlkampf (030.png)
- **Frage des Spielers:** „Wann ist Wahlkampf, und was kann ich jetzt schon vorbereiten?“
- **Urteil:** fast leer, sinnlos als eigener Reiter (vor der heißen Phase)
- **Befund:**
  - Ein Textkasten mit 76 Wörtern („Der Wahlkampf steht noch bevor … in etwa 8 Monaten … Jede Woche stehen 10 Aktionspunkte bereit“) und 0 Knöpfen. Die halbe Breite und die untere Hälfte sind leer.
  - Der Text verspricht Reisen, Versprechen, Diaspora-Touren und ein TV-Duell gegen Cem Arıkan. Nichts davon kann man ansehen oder vorbereiten (etwa Wahlversprechen entwerfen oder Provinzen vormerken).
  - Ein Reiter, der acht Monate lang dasselbe sagt, kostet jedes Mal einen Klick für nichts.
- **Klicks:** keine.
- **Vorschlag:** Den Reiter bis acht Wochen vor der Wahl ausblenden. Stattdessen ein Countdown-Band über dem Kreisfeld („Wahl am 5. Dezember 2030 · heiße Phase ab Oktober · Gegner Cem Arıkan, Stärke 65“). Ab der heißen Phase wird Wahlkampf zum Hauptbild: Karte der 81 Provinzen mit Umfrage je Provinz, 10 Aktionspunkte als Münzen, die man auf Provinzen zieht. Mehr Spiel, weniger Text.

### Gesellschaft › Behörden (031.png)
- **Frage des Spielers:** „Welche Ämter arbeiten für die Gesellschaft, und reicht ihr Geld?“
- **Urteil:** fast leer, missverständlich, falsch einsortiert
- **Befund:**
  - Eine einzige Karte, „Gesundheitswesen“ (Personal, Technik, Reichweite je drei von fünf Strichen, „Etat ohne Spielraum“, Murat Sarı), dazu ein Kopf „0 im Ausbau · 1 Etat knapp“ und der Satz „Ausbau kostet Kapital, Geld und Zeit; jede weitere Stufe bringt weniger. Kürzen spart sofort und kostet Erfahrung.“
  - Gesundheit unter „Gesellschaft und Opposition“ ist thematisch fragwürdig. Bildung liegt unter Forschung, Polizei unter Sicherheit.
  - „Etat ohne Spielraum“ sagt dem Spieler, dass er nichts tun kann, aber nicht, wo er es ändert. Laut Code (`etatSpielraum`) entsteht Spielraum nur, wenn der Haushaltsregler „Gesundheit“ über Stufe 0 steht, also in einer anderen Akte (Wirtschaft › Haushalt).
  - Murat Sarı leitet die Behörde. Ein Gesundheitsminister existiert nicht (siehe Haushalt, Datenlücke Minister je Ressort).
  - Laut seiten.json 0 Knöpfe. Ob die Karte anklickbar ist, ist auf dem Bild nicht erkennbar.
- **Klicks:** Karte Gesundheitswesen öffnet vermutlich die Ausbautafel (Personal, Technik, Reichweite). Nötig, aber am falschen Ort.
- **Vorschlag:** Den Reiter streichen. Die Behörde wird ein Stück im Ministeriumsrad „Gesundheit“ (Haushalt, Ebene 2). Ausbau und Kürzung stehen dort zusammen mit dem Etat, der sie bezahlt, und „Etat ohne Spielraum“ wird zu „Ressort-Etat +1 Stufe gibt 0,x % BIP Spielraum“ mit einem Regler daneben. Dasselbe gilt für alle Behörden-Reiter der anderen Akten.

### Gesellschaft › Gesellschaft im Wandel (032.png)
- **Frage des Spielers:** „Wird das Land unter mir ruhiger oder unruhiger?“
- **Urteil:** missverständlich, doppelt
- **Befund:**
  - Sieben Kurven: Zustimmung 52 → 50, Polarisierung 70 → 63, Protestdruck 30 → 28, Stärke der Opposition 55 → 65, Repression 4 → 2, Rathäuser des Lagers 32 → 19 und Groll der Milieus 23 → 26.
  - Die Skalierung täuscht: „Zustimmung 52 → 50“ fällt über die ganze Kästchenhöhe (Achse 50 bis 52), sieht aus wie ein Absturz und ist ein Minus von zwei Punkten. „Repression 4 → 2“ wirkt genauso dramatisch.
  - Keine Wertung: Polarisierung von 70 auf 63 ist gut, Opposition von 55 auf 65 ist schlecht. Beide Kurven sind gleich rot.
  - Die wichtigsten Nachrichten der ganzen Akte (Opposition +10, Rathäuser −13) stecken hier im Bilanzreiter und nicht auf der Hauptseite, die „Lage: ruhig“ sagt.
  - Die Wirkungsberichte nennen zweimal das „Gebäude-Verstärkungsprogramm“ („Umsetzung zu 22 Prozent, noch keine Wirkung messbar“). Dasselbe steht in Land (040). Das ist doppelt und hat mit Gesellschaft wenig zu tun (`BEREICH_THEMEN.gesellschaft` enthält „wohnen“).
  - Die Zustimmungskurve beginnt hier bei 2028-07, in 029 bei Apr. 2029.
- **Klicks:** keine.
- **Vorschlag:** Den Reiter auflösen. Opposition, Protest und Polarisierung werden drei Tachos neben dem Kreisfeld (Zielband, Pfeil seit Amtsantritt, gut oder schlecht gefärbt). Die Rathäuser werden eine Karte (Provinzen im Lager oder bei der Opposition, verlorene rot umrandet) im Reiter „Opposition & Straße“. Kurven nur auf Klick, mit fester Achse (0–100) oder Zielband. Wirkungsberichte nur aus Gesellschaftsthemen.

### Gesellschaft › Politische Akteure (033.png)
- **Frage des Spielers:** „Wer ist mein Gegner, und wer hält mir die Straße?“
- **Urteil:** fast leer, doppelt
- **Befund:**
  - Zwei Karten: Selin Koçak, Innenministerin, „distanziert (48)“, und Cem Arıkan, Oppositionsführer, „abtrünnig (24)“. Darunter rund 250 px leere Fläche und 0 Knöpfe.
  - „Haltung: abtrünnig“ beim Oppositionsführer ist schief. Er war nie loyal, abtrünnig kann nur ein Verbündeter sein. Dieselbe Loyalitätsskala für Minister und Gegner wirkt unfreiwillig komisch.
  - Die Stärke der Opposition (65), die Verfahren gegen sie und ihre Züge stehen nicht bei der Person, sondern zwei Reiter weiter im versteckten Unter-Unterreiter „Opposition“.
- **Klicks:** keine.
- **Vorschlag:** Den Reiter streichen. Arıkan erscheint als großes Porträt mit Stärketacho im Reiter „Opposition & Straße“, zusammen mit seinen Zügen und den eigenen Instrumenten samt Preisen. Koçak erscheint als kleines Porträt am Protest-Tacho („Innenministerin: Ruhe auf den Straßen“) mit Klick zur Personenakte.

---

### Querschnitt B

**Wiederkehrende Muster**
1. **Sieben Reiter, davon drei bis vier Leerlauf.** Beide Akten haben je sieben Reiter (Wirtschaft in zwei Zeilen umgebrochen). In jeder Akte sind „Bilanz“ und „Personen“ (026/027, 032/033) Pflichtreiter mit 0 Knöpfen. Wahlkampf, Behörden und Stimmung im Land sind fast leer (623 px). Dagegen tragen Zentralbank (4.798 px) und Wählerkoalition (4.086 px) zu viel. Die Masse ist falsch verteilt.
2. **Eine Zahl, mehrere Werte.** Zustimmung 50 / 50,2 / 54 / 54,2, Wachstum 3,6 / 4,1, Haltung „streng“ gegen „verlässlich (50)“. Die Leiste und der Kopf wiederholen sich (Inflation und Lira doppelt). Jede Größe braucht genau einen Wert. Wenn es Umfrage und Wahrheit gibt, stehen beide nebeneinander und sind benannt.
3. **Skalen ohne Bedeutung.** Indizes 0–100 ohne Einheit (Reallöhne 55,9, Armutsbelastung 36,0 / 100), „+20 Stufen“, „Ministerium will +3“ und auf Minimum bis Maximum gestreckte Kurven ohne gut-schlecht-Farbe. Jede Zahl braucht Einheit, Zielband und Farbe.
4. **Regeltext statt Preis am Hebel.** „Unter 25 % steigt der Zähler …“, „Außerhalb des Oktober-Fensters kostet jede Änderung das 2-fache …“, „Kurswechsel: 3 politisches Kapital · 30 Tage Bindung“: Die Regeln stehen als Absatz statt als Preisschild am Knopf.
5. **Bausteine ohne Inhalt werden trotzdem gezeigt.** Monatsbericht mit „0,00“ und „Abwartend“ (024, ebenso 007), Vorrang ohne Engpass, Wahlkampf ohne Wahlkampf, Tiefstandszähler bei 50 %. Es fehlt die Regel „nur zeigen, wenn es etwas zu entscheiden gibt“.
6. **Personen ohne Handlung, Handlungen ohne Personen.** Ministerkarten haben 0 Knöpfe, „Ministerium will +2“ hat keinen Minister, Gesundheit hängt am Präsidialamt, und der Wirtschaftsminister trägt sechs Ressorts. Drei Kabinettsmitglieder heißen Erdem.
7. **Wichtiges liegt tief, Unwichtiges oben.** Opposition, Repression, Straße und Rathäuser liegen vier Ebenen tief. „Lage: ruhig“ steht ganz oben.
8. **Interne Spuren in den Texten:** „(Z5)“, „2030-12-05“, abgeschnittene Zeile „Türkei im Spiel (zuletzt verö…“.

**Zusammengelegte Struktur Wirtschaft (sieben Reiter werden vier)**
| Neu | Hauptbild | Stellgrößen (Zeilen mit Regler oder Knopf, Preis daneben) | Reiter darunter (nachlesbar) | Ersetzt |
|---|---|---|---|---|
| **Lage** | Sechs Ampel-Tachos (Inflation, Arbeitslosigkeit, Wachstum, Lira, Defizit, Reserven), Klick öffnet große Kurve mit Ereignismarken | zwei bis drei Handlungen je Größe mit Vorschau auf der Kurve | Alle Kennzahlen · Weltvergleich (eine Zeile je Größe) · Wirkungsberichte als Marken | Wirtschaftslage, Bilanz & Entwicklung, Kasten „Preise, Einkommen & Arbeit“ aus dem Krisenrat |
| **Haushalt** | Rad, Ebene 1 Ressorts → Ebene 2 Ministeriumsrad → Ebene 3 Behörde; Finanzminister im Kopf | Regler je Unterposten mit Preis, Wirkung, Gewinner und Verlierer; „Fertige Pakete“ (die drei Krisenpakete) als Vorschaubuttons; Mehrheits-Halbrund für den Haushaltsbeschluss | Zyklus und Plan 2026 · Bisher und Abschluss · Rechnung | Haushalt, Krisenrat (Pakete), Behörden-Reiter aller Akten |
| **Geld & Lira** | Halbrund-Tacho Leitzins gegen Inflation mit Zeiger „Bank will“ und „Sie wollen“, Reserventank | Einmischung (Rede, Gespräch, Vorgabe) · Gouverneurin ersetzen · Intervention 2, 5 oder 10 Mrd. $ · IWF als Notfallkarte | Zentralbankgesetz · Beschlüsse | Zentralbank und Devisen |
| **Handel** | Welt- oder Sankey-Karte der Lieferländer und Abnehmer, sieben Warenikonen als Füllstände | Vorrang im Engpass (nur dann sichtbar) | Mengenrechnung | Versorgung & Handel |
| entfällt | – | – | – | Wirtschaftskabinett (Porträts in Haushalt, Geld & Lira, Handel), Krisengesetze (in die Politik-Maßnahmentafel) |

**Zusammengelegte Struktur Gesellschaft (sieben Reiter werden zwei, der Wahlkampf erscheint nur zeitweise)**
| Neu | Hauptbild | Stellgrößen | Reiter darunter | Ersetzt |
|---|---|---|---|---|
| **Das Volk** | Democracy-4-Kreisfeld: elf Wählergruppen als Kreise (Fläche = `anteil`, Farbe = Stimmung, Rand = Träger, schwankend oder abgewandt, Pfeil = Tendenz) auf einer Achse von „gegen mich“ bis „für mich“, Mehrheitslinie bei 50; Schalter „Milieus“ als zweite Schicht mit Groll-Zacken; Band oben: Umfrage 54 % gegen Lagebild 50 %, Wahl am 5. Dezember 2030 | Hover zeigt die Verbindungen zu Maßnahmen; Klick öffnet die Seitenleiste mit drei Ursachen, drei Wünschen mit Regler und Preis und „wechselt zu …“ | Verlauf (Kurven mit fester Achse) · Wirkungsberichte nur aus Gesellschaftsthemen | Stimmung im Land, Wählerkoalition, Gesellschaft im Wandel |
| **Opposition & Straße** | Links Porträt Cem Arıkan mit Stärketacho 65 und seinen Zügen; rechts die Provinzkarte mit Rathäusern (Lager oder Opposition, 13 verlorene rot) und laufenden Bewegungen als Brandherde; Tachos Polarisierung und Protest, Innenministerin als kleines Porträt | Instrumente gegen die Opposition (Verfahren, Immunität, Verbot) und gegen Bewegungen (Dialog, Polizei, Zugeständnis) je eine Zeile mit Kapital, Aufmerksamkeit und Vorschau (Größe, Radikalität, Märtyrer); Zwangsverwalter auf der Karte | Frühere Bewegungen · Kommunalwahl-Stand | der versteckte Unterreiter mit Lage, Opposition, Straße und Kommunen; Politische Akteure |
| **Wahlkampf** (nur ab acht Wochen vor der Wahl) | Provinzkarte mit Umfrage je Provinz | 10 Aktionspunkte als Münzen auf Provinzen oder Diaspora, TV-Duell, Versprechen | – | Wahlkampf (vorher nur Countdown-Band in „Das Volk“) |
| entfällt | – | – | – | Behörden (ins Ministeriumsrad Gesundheit), Politische Akteure (Porträts im Kontext) |

**Was zuerst fehlt (Daten):** Ausgaben je Ministerium und die Kreuztabelle Ministerium × Ausgabenart für 2026 (Haushaltsgesetz, Tabelle A nach Einrichtungen, zu recherchieren). Funktionale Gliederung (COFOG). Minister für mindestens Gesundheit, Bildung, Arbeit und Soziales, Verkehr und Infrastruktur, Landwirtschaft und Energie. Ein vollständiges `RESSORT_POSTEN` (heute sieben Einträge). Eine erklärte Beziehung zwischen den Milieus (fünf) und den Wählergruppen (elf). Ohne die ersten beiden Punkte kann das Ministeriumsrad nur nach Spielparametern teilen und muss das sichtbar sagen („Aufteilung geschätzt, Quelle offen“).
