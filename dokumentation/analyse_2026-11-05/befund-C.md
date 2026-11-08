# Befund C: Kabinett & Verwaltung und alle Personen

Prüfer C, 5. November 2026. Maßstab: `AUFTRAG.md`.

**Grundlage**
- Rundgangbilder 012 bis 015, jedes selbst angesehen.
- Eigene Aufnahmen mit kopflosem Playwright gegen `http://localhost:5173/?schnellstart`, in Deutsch, Englisch und Türkisch. Die Skripte `c1.cjs` bis `c3.cjs`, die Bilder und die Textauszüge `texte1.json`, `texte2.json`, `texte-en.json` und `texte-tr.json` liegen unter `/private/tmp/claude-501/-Users-yusufyeneroglu/904f44f4-7b5f-44c2-9447-c69e44ab880b/scratchpad/analyse-C/`.
- Code gelesen:
  - Oberfläche: `ui/Personen.tsx`, `ui/personen/*` (Kabinettstisch, Umfeld, Gesprächsszene, Nachfolge, Machtkreis, Zusagen), `ui/minister/*`, `ui/behoerden/*`, `ui/Chat.tsx`, `ui/akte/Akte.tsx`, `ui/akte/Bereiche.tsx`, `ui/art/Portraet*`, `ui/art/portraet-*`.
  - Simulation: `sim/kabinett.ts`, `sim/personen.ts`, `sim/personen-monat.ts`, `sim/figuren.ts`, `sim/gespraeche.ts`, `sim/nachfolge.ts`, `sim/ministerfluss*.ts`, `sim/zusagen*.ts`, `sim/ressortvergabe.ts`, `sim/amtszeit.ts`, `sim/behoerden.ts`, `sim/ereignisse-personen.ts`, `sim/befehle.ts`, `sim/minister-befehle.ts`, `data/ministerien.ts`.
  - Kataloge: alle Kataloge des Bereichs in de, en und tr.

**Hinweis zu den Namen:** Die Namen der Figuren wechseln mit jedem Schnellstart. Rundgang und eigene Aufnahmen zeigen deshalb verschiedene Personen auf denselben Ämtern.

---

## 1. Ansichten

Noten von 1 (sehr gut) bis 5. Sie stehen in dieser Reihenfolge: Möglichkeiten · Logik · Erklärung · Bild/Artwork · Schrift · Gestaltung · Sprache · Spielgefühl.

### C-V1 Kopf der Akte „Kabinett & Verwaltung“ (012 bis 015, oben)
- **Frage der Seite:** Steht meine Regierung hinter mir?
- **Antwort:** teilweise. Drei Zahlen (Loyalität 59, Zusagen 2, Kapital +4,6) ohne Bild. Die Kopfzeichnung „amtssitz“ schimmert verwaschen hinter und zwischen den Karten durch.
- **Länge:** fester Kopf, etwa 0,2 Schirme.
- **Noten:** 3 · 2 · 3 · 4 · 2 · 3 · 2 · 3
- **Urteil:** Ordentlich gesetzt. Die drei Zahlen stehen aber wenige Zentimeter tiefer noch zweimal.

### C-V2 Ministerrat › Kabinettstisch (012, eigene Aufnahme `tisch.png`)
- **Frage der Seite:** Wer am Tisch macht mir Ärger, und wer braucht eine Entscheidung?
- **Antwort:** teilweise. Der ovale Tisch mit Stimmungsringen und Abzeichen ist das richtige Bild. Beim Öffnen sieht man aber nur seine obere Hälfte, weil drei Kennzahlzeilen darüber stehen. Die Beschriftungen überlappen sich, und der Ring unterscheidet sich zwischen „loyal“ und „skeptisch“ kaum.
- **Länge:** 1,5 Schirme.
- **Noten:** 3 · 2 · 3 · 3 · 3 · 3 · 3 · 3
- **Urteil:** Die beste Idee des Bereichs, aber noch nicht fertig: Sie ist eng, abgeschnitten und hinter Zahlen versteckt.

### C-V3 Ministerakte (Platz gewählt, `akte1.png`, `akteFin-unten.png`)
- **Frage der Seite:** Was ist mit diesem Minister, und was kann ich mit ihm tun?
- **Antwort:** ja, für die Werte (Loyalität, Leistung, Ehrgeiz, Ertrag, Sorge). Die Vorlagen und Befehle stehen in einer eigenen Spalte, die man innen scrollen muss: 1695 zu 680 Pixel, also rund 2,5 Spalten-Schirme.
- **Länge:** 1,5 Schirme, dazu der innere Bildlauf.
- **Noten:** 3 · 2 · 3 · 3 · 2 · 3 · 3 · 3
- **Urteil:** Eine klare Karte. Sie verspricht aber eine „Leistung im Ressort“, die bei 12 von 17 Ministerien nichts bewirkt (C-4).

### C-V4 Gespräche & Umfeld, Liste (`umfeld-0.png`, `umfeld-1.png`)
- **Frage der Seite:** Mit wem sollte ich reden?
- **Antwort:** nein. Es ist eine zweite Liste derselben 19 Personen wie am Tisch. Alle stehen beim Start auf „verlässlich“ mit fast gleichem Balken, und die Liste hat einen eigenen Bildlauf.
- **Länge:** 1,5 Schirme.
- **Noten:** 4 · 3 · 3 · 3 · 2 · 3 · 3 · 4
- **Urteil:** Doppelt zum Tisch, und sie hebt niemanden hervor.

### C-V5 Gespräch mit einer Person (`gesprPerson-0.png`, `gesprPerson-1.png`)
- **Frage der Seite:** Was kann ich in diesem Gespräch erreichen?
- **Antwort:** ja. Großes Porträt und die drei Schritte Thema → Ansatz → Ergebnis, mit Folgen in Zahlen.
- **Länge:** 1,4 Schirme.
- **Noten:** 2 · 2 · 2 · 3 · 2 · 2 · 3 · 2
- **Urteil:** Hier zeigt sich Suzerain am deutlichsten. Der Text spricht aber jeden Mann mit „sie“ an, und in Englisch und Türkisch steht Deutsch (C-3).

### C-V6 Umbilden › Entlassung und Nachfolge (`umbilden-0.png`, `umbilden-1.png`)
- **Frage der Seite:** Wen setze ich an diese Stelle, und was kostet mich das?
- **Antwort:** ja. Folgen der Entlassung als Liste, drei Kandidaten mit Fähigkeit, Ehrgeiz, Gesinnung, Stärke, Schwäche, Marktreaktion und Preis.
- **Länge:** etwa 2 Schirme.
- **Noten:** 2 · 2 · 2 · 3 · 3 · 4 · 3 · 2
- **Urteil:** Inhaltlich vorbildlich mit echtem Zielkonflikt. Gestalterisch kaputt, weil das Porträt Name und Herkunft der Kandidaten verdeckt.

### C-V7 Machtkreis (`machtkreis-0.png`, `machtkreis-1.png`)
- **Frage der Seite:** Wer verbündet sich mit wem gegen mich, und wer will mein Erbe?
- **Antwort:** teilweise. Das Netz mit Linien ist das richtige Bild. Namen und Rollen sind vom Porträt verdeckt („K[Gesicht]n“, „Präsi…amt“), und die Mitte „SIE“ ist überzeichnet.
- **Länge:** 1,3 Schirme. Der Kopfkommentar verspricht „ohne Scrollen“.
- **Noten:** 2 · 2 · 3 · 4 · 4 · 4 · 3 · 3
- **Urteil:** Starke Mechanik in einer zerbrochenen Darstellung.

### C-V8 Zusagen (`zusagen-0.png`, `zusagen-1.png`)
- **Frage der Seite:** Was habe ich wem versprochen, und was passiert, wenn ich es halte oder breche?
- **Antwort:** ja. Glaubwürdigkeit mit Balken und je Zusage die Spalten „Wenn gehalten“ und „Wenn gebrochen“.
- **Länge:** 1,7 Schirme.
- **Noten:** 2 · 3 · 2 · 3 · 2 · 2 · 3 · 2
- **Urteil:** Klar und fair. Beim Einlösen von „zwei Ministerien“ verschweigt sie aber, wer dafür gehen muss (C-7).

### C-V9 Gespräch, der Chat mit dem Präsidialamt (013, `chat-*.png`)
- **Frage der Seite:** Was kann ich hier frei eingeben?
- **Antwort:** teilweise. Ein Eingabefeld und Vorschlagschips ohne Bezug zum Kabinett („Gipfeltreffen mit der EU“). Fragen zu Personen versteht der Chat nicht.
- **Länge:** 1 Schirm.
- **Noten:** 3 · 1* · 3 · 4 · 3 · 3 · 3 · 3
- **Urteil:** Die Befehlszeile steht am falschen Ort, und sie bricht ihr eigenes Versprechen (C-2). \*Die Logiknote 1 bedeutet hier: Die Logik ist schwer beschädigt.

### C-V10 Verwaltung › Lage (014)
- **Frage der Seite:** Reicht meine Verwaltung für das, was ich vorhabe?
- **Antwort:** teilweise. Zwei Balken (Verwaltungskraft, Baukapazität), danach drei Zahlenspalten.
- **Länge:** 1,4 Schirme.
- **Noten:** 3 · 3 · 3 · 4 · 3 · 3 · 3 · 4
- **Urteil:** Eine Buchhaltung ohne Bild. Die Zahl „+4,6 Ertrag des Kabinetts“ steht hier zum dritten Mal.

### C-V11 Verwaltung › Sonderrechte und Vorhaben (`sonder-0.png`)
- **Frage der Seite:** Welche schnellen Werkzeuge habe ich, und was kosten sie?
- **Antwort:** ja. Die Karten zeigen Preis, Dauer und Wirkung.
- **Länge:** 1,4 Schirme.
- **Noten:** 2 · 3 · 3 · 4 · 2 · 2 · 2 · 3
- **Urteil:** Brauchbar. „Voraussetzung fehlt“ nennt auf der Karte nicht, welche Voraussetzung fehlt.

### C-V12 Handlungsfähigkeit, also Lage und Behörden (015, `hf-0.png`, `hf-1.png`)
- **Frage der Seite:** Kann meine Regierung handeln?
- **Antwort:** nein. „Lage: gemischt“ und ein Satz, der den Kopf wiederholt. Danach folgen Porträt-Chips von 7 Ämtern und den Parteivorsitzenden (die 12 neuen Minister fehlen), dann die Zusagen ein zweites Mal und zwei Behörden des Finanzministeriums.
- **Länge:** 1,3 Schirme.
- **Noten:** 4 · 3 · 4 · 3 · 2 · 3 · 3 · 4
- **Urteil:** Eine Restseite ohne eigene Frage.

### C-V13 Porträts über alle Ansichten (`koepfe.png`: alle 19 Köpfe)
- **Frage:** Erkenne ich die Menschen wieder, und wirken sie wie Menschen?
- **Antwort:** nein. Alle 19 sind prozedurale Vektorgesichter mit gleicher Kopfform, gleichen Augen und gleicher Miene. 10 tragen denselben olivgrünen Anzug (Lager „Parteibasis“). Die beiden Frauen mit Kopftuch tragen dasselbe Magenta. Gemalte Bilder gibt es keine (C-14).
- **Noten:** Artwork 4, Einheitlichkeit 2 (gleich sind sie, nur leider zu gleich), Spielgefühl 4.
- **Urteil:** Sauber gezeichnet, aber puppenhaft. Für ein Spiel, das von Personen lebt, ist das der größte Schönheitsmangel des Bereichs.

---

## 2. Befunde

Schwere: 1 = bricht Sinn oder Spiel, 2 = deutlich störend, 3 = Feinschliff.

### Schwere 1

**C-1 · Logik · Aufwand klein**
- **Ort:** Ministerakte und Schreibtisch › Kabinettsvorlagen. `sim/kabinett.ts:291` (investieren, `kostenPk: 2`), `:427` (Ressortkonflikt „mittel“, `kostenPk: 3`), `:530-560` (`halteKabinettssitzungAb`), `sim/ministerfluss.ts:731-734`
- **Befund:** Die Karte zeigt „Wachstumsimpuls und Rüstungsmodernisierung · 2 Kapital“ und beim Ressortkonflikt „Mittel bereitstellen · 3 Kapital“. Abgebucht wird nichts. `halteKabinettssitzungAb` prüft nur, ob das Kapital reicht (`+ 20 < kostenPk`). Allein das Ressort-Paket zieht selbst 5 ab (`:519`).
- **Warum es stört:** Die teure Option ist in Wahrheit kostenlos. Regel 7 ist gebrochen, und der Spieler lernt, dass Preise lügen.
- **Vorschlag:** In `halteKabinettssitzungAb` nach `opt.ausfuehren(w)` allgemein `w.spiel.kapital -= opt.kostenPk ?? 0` buchen und den Eigenabzug im Paket streichen.

**C-2 · Funktion/Sinn · Aufwand klein bis mittel**
- **Ort:** Gespräch (Chat). `sim/befehle.ts:923-934`, `sim/nachfolge.ts:225-229`, `ui/Chat.tsx:33`, Hinweis unter dem Eingabefeld
- **Befund:** Die Eingabe „Entlasse den Finanzminister“ führt die Entlassung sofort aus: „Finanzminister Cengiz Bozkurt ist entlassen, Finanzminister Selim Yavuz übernimmt. Kosten 3 Kapital.“ Der Nachfolger ist ein Zufallskandidat, hier der fachlich schwächste (Fähigkeit 53, Märkte +30 Punkte). Darunter steht: „Was Kapital kostet, wird nie ohne Ihr Zeichen ausgeführt.“
- **Warum es stört:** Die wichtigste Personalentscheidung fällt ohne Folgenvorschau und ohne Wahl. Der Chat bricht sein eigenes Versprechen.
- **Vorschlag:** Der Chat antwortet mit einer Vorschlagskarte „Entlassung vorbereiten“. Ein Klick öffnet die Nachfolgeauswahl (C-V6). Nie sofort ausführen.

**C-3 · Übersetzung · Aufwand groß**
- **Ort:** Gesprächsszene, Nachfolge, Befehle, Personenereignisse
  - `sim/gespraeche.ts` importiert kein i18n (Ansätze `:62-68`, Themen `:129-150`, alle Folgen- und Grundtexte)
  - `sim/nachfolge.ts` (Herkunft, Stärke und Schwäche der Kandidaten, Rückmeldungen)
  - `sim/minister-befehle.ts:23-25, 100, 134-150`
  - `sim/ereignisse-personen.ts` (Rücktrittsdrohung, Skandal, Intrige, Leck)
  - `sim/personen-monat.ts:43-50`
- **Befund:** Englisch und Türkisch zeigen Deutsch. In der englischen Fassung erscheinen „1 THEMA 2 ANSATZ“, „Was sie gerade umtreibt“, „Lage: Crime — Crime: mittelmäßig, 45 von 100 (hoch ist schlecht)“ und „Die Person selbst …“ (`texte-en.json`). Die türkische Fassung zeigt dasselbe (`texte-tr.json`).
- **Warum es stört:** Der Kern des Personenspiels ist für zwei von drei Sprachen unlesbar. Regel 11 ist gebrochen.
- **Vorschlag:** Alle Texte in den Katalog `gespraech.json` überführen, wie es `mfl.ansatz.*` für die Ansätze schon vormacht (Doppelung). Danach den Prüfer, der deutsche Literale außerhalb der Kataloge findet, auf `sim/` ausweiten.

**C-4 · Logik/Sinn · Aufwand mittel**
- **Ort:** Ministerkarte › „Leistung im Ressort“. `sim/personen.ts:46-53` und `:118-129` (`ressort(...)` mit `wirkung: []`), `sim/personen-monat.ts:20` (`if (!d.wirkung.length) return;`)
- **Befund:** 12 der 17 Ministerien bewegen im Monat nichts im Land: Familie, Arbeit, Umwelt, Energie, Jugend, Kultur, Bildung, Verteidigung, Gesundheit, Landwirtschaft, Handel und Verkehr. Trotzdem steht auf jeder Karte „Leistung im Ressort 76 · gut“. Das Gespräch „Anerkennung und Mittel“ verspricht „Zusatzmittel für Gesundheit: Leistung +25 %“ (`gespraeche.ts:430`). Wirksam bleibt davon nur ein Kapitalbeitrag von rund 0,08 im Monat.
- **Warum es stört:** Ob eine fähige oder eine unfähige Gesundheitsministerin im Amt ist, ändert an der Versorgung nichts. Das ist Schau und verstößt gegen „hinter jeder Entscheidung muss etwas stecken“.
- **Vorschlag:** Jedem Ressort ein bis zwei Leitgrößen mit kleiner Monatswirkung geben, als Spielparameter wie bei Finanzen (`d: 0.06` bis `0.12`). Bis dahin ehrlich beschriften: „Leistung wirkt derzeit nur auf Ihr Kapital.“

**C-5 · Logik/Sprache · Aufwand klein**
- **Ort:** Vorlagen der neuen Ressorts. `i18n/katalog/de/ministerfluss.json:132-133` (`mfl.p.groll.titel` und `mfl.lage.titel` per `select` mit `other {Präsidialamt}`), `:121-131` (`mfl.ressort.*` nur für 10 Ämter), `sim/ministerfluss.ts:54, 296, 804`
- **Befund:**
  - Lagevorlagen der zwölf neuen Ressorts heißen „Präsidialamt: … im schlechten Bereich“. Im englischen Schreibtisch steht „Presidential Office: Felt cost of living is in poor shape“, obwohl die gefühlte Teuerung beim Handel liegt.
  - `ressort(amt)` findet keinen Schlüssel für die neuen Ämter. In „Was im Ressort {ressort} geschieht, erfahren Sie nur noch aus der Zeitung“ erscheint dann der rohe Schlüssel „mfl.ressort.gesundheit“.
  - Industrie heißt dort „Wirtschaft“.
- **Warum es stört:** Der Absender ist falsch, und manche Sätze sind kaputt.
- **Vorschlag:** In allen drei Fällen `t(\`daten.amt.${amt}.ressort\`)` verwenden und die `select`-Listen sowie die `mfl.ressort.*`-Schlüssel streichen.

**C-6 · Sinn · Aufwand mittel**
- **Ort:** Zusagen › „Der YENİ Parti wurden zwei Ministerien zugesagt“ › „Jetzt einlösen“. `sim/zusagen.ts:91-107` (Folgen), `:235-239`, `sim/ressortvergabe.ts:19, 46-50`, `ui/personen/ZusagenAnsicht.tsx:136-138`
- **Befund:**
  - Beim Einlösen gibt das Spiel ohne Wahl die ersten zwei Ressorts der festen Liste `["wirtschaft","justiz",…]` ab. Industrie- und Justizminister werden ersetzt.
  - Unter „Wenn gehalten“ steht davon nichts, nur „Glaubwürdigkeit … steigen leicht · Loyalität +12 · Bereitschaft +10“.
  - Der Knopf zeigt keinen Preis. Abgebucht werden 4 Kapital (`zusagen.ts:290-293`), auf dem Schreibtisch steht „4 Kapital“.
- **Warum es stört:** Der Spieler entlässt unwissentlich zwei Minister. Koalitionsproporz ist eine der stärksten Entscheidungen echter Kabinettspolitik und hier verschenkt.
- **Vorschlag:** „Einlösen“ öffnet eine Auswahl „Welche zwei Ministerien gehen an die YENİ?“. Am Tisch leuchten die wählbaren Plätze auf, und je Platz steht „Wer geht, wer kommt (Fähigkeit, Loyalität)“. Der Knopf heißt „Einlösen · 4 Kapital“.

### Schwere 2

**C-7 · Logik · Aufwand klein**
- **Ort:** Ministerkarte › Ressortsorge. `sim/kabinett.ts:133`
- **Befund:** `sorgeAusFach` nutzt eine eigene Liste mit 7 Größen, bei denen hoch schlecht ist, statt `HOCH_SCHLECHT` (rund 30 Größen). Am Tisch stehen deshalb „Arbeitsminister · Streikbereitschaft (35 Pkt.)“, „Bildung · Schulabbruch (42 Pkt.)“ und „Gesundheit · Wartezeiten (45 Pkt.)“. Ein niedriger Wert ist dort gut, wird aber als Sorge gelesen. Das Gespräch nennt für dieselbe Person eine andere Sorge (`schlechtesteGroesse`).
- **Warum es stört:** Die Sorge ist falsch, und zwei Ansichten widersprechen sich.
- **Vorschlag:** `sorgeAusFach` durch `schlechtesteGroesse(w, f)` ersetzen.

**C-8 · Möglichkeiten · Aufwand mittel bis groß**
- **Ort:** Ministerkarte › „Umbilden“. `ui/personen/MinisterratSaal.tsx:105`, `sim/amtszeit.ts:148` (`MINISTER` hat 7 Ämter), `:355-410`
- **Befund:**
  - Der Knopf „Umbilden“ führt nur zu „entlassen“.
  - Versetzen, Tauschen („Hierher tauschen ({pk} Kapital)“, `gesichter.json`) und Ressortvergabe an Partner gibt es nur im Fenster nach einer Wahl und nur für die 7 alten Ämter.
  - Es fehlen der Ressortzuschnitt (zwei Ressorts zusammenlegen oder trennen) und der Vizepräsident. Die Verfassung sieht ihn vor (Art. 104 und 106), `sim/amtszeit.ts:3` nennt ihn, aber er sitzt nicht am Tisch.
- **Warum es stört:** Eine echte Kabinettsumbildung ist mehr als „feuern“. Begonnenes lässt sich nicht ändern, nur beenden.
- **Vorschlag:** „Umbilden“ öffnet ein Menü mit Entlassen · Versetzen (2 Kapital, Fähigkeitsabschlag 12) · An Partner geben (2 Kapital) · Kommissarisch besetzen, jederzeit und für alle 19 Plätze. Im Fenster nach der Wahl kostet es die Hälfte (`kostenAnteil` gibt es schon).

**C-9 · Design · Aufwand mittel**
- **Ort:** Kabinettstisch. `ui/personen/kabinettstisch.css:5,24`, `ui/personen/MinisterratSaal.tsx:147-150`
- **Befund:**
  - Abzeichen überdecken Ressortnamen („Arbeit und Sozialv[5]“, „[1]Äußeres“).
  - Namen sind abgeschnitten („Landwirtschaft und…“, „Industrie und Tech…“, „Kultur und Touris…“).
  - Ein Nachbar schneidet „…ergie und Rohst…“ an.
  - 19 Plätze haben auf einer Ellipse von 46 zu 44 % Platz, bei 660 Pixeln Höhe.
  - Der Generalstab sitzt laut Kommentar „als Gast unten“, tatsächlich aber oben neben dem Präsidialamt. Finanzen und Inneres sitzen am Fuß des Tisches.
- **Warum es stört:** Der Tisch wirkt unaufgeräumt und ist beim Überfliegen nicht lesbar.
- **Vorschlag:** Breiteres Oval, Kurznamen („Landwirtschaft“, „Industrie“, „Umwelt“), Abzeichen am Porträtrand oben rechts. Finanzen, Inneres und Äußeres sitzen dem Präsidialamt gegenüber oder daneben, der Generalstab wirklich unten.

**C-10 · Konsistenz/Design · Aufwand klein**
- **Ort:** Ministerrat. `ui/akte/Bereiche.tsx:102-111`, `ui/Personen.tsx:46-73`, `MinisterratSaal.tsx:156-161`, Handlungsfähigkeit (`lageUrteil`), Verwaltung
- **Befund:** Vor dem Tisch stehen drei Kennzahlzeilen:
  - der Kopf (Loyalität 59 · Zusagen 2 · Kapital +4,6)
  - die Chips (Termine · Glaubwürdigkeit · Aufträge · Rücktrittsgefahr)
  - die Tischzeile („GEORDNET · Kapital aus dem Kabinett: +4,6 · Loyalität im Schnitt: 59 · beschlussfähig“)

  Loyalität und Kapital stehen damit dreimal da, mit der Handlungsfähigkeit („Auffällig: Loyalität im Kabinett: 59“) und der Verwaltung („Ertrag des Kabinetts +4,6“) sogar vier- bis fünfmal.
- **Warum es stört:** Regel 8 ist gebrochen, und der Tisch rutscht unter den ersten Bildschirm.
- **Vorschlag:** Tischzeile und Chipzeile streichen. Ihre Werte kommen in die Tischmitte: Disziplinwort, darunter „Nächste Sitzung in 12 Tagen“, „Rücktritt droht: …“ und „Termine 4 frei“.

**C-11 · Übersetzung/Konsistenz · Aufwand klein**
- **Ort:** fest verdrahtetes Deutsch in der Oberfläche
  - `MinisterratSaal.tsx:157` `status.disziplin.toUpperCase()`
  - `:88` „Kapital/Monat“
  - `Personen.tsx:69` „niemand“
  - `ZusagenAnsicht.tsx:14` „in Ruhe / bald fällig / dringend / überfällig“
  - `Umfeld.tsx:26-28` „Regierung / Bündnis und Institutionen / Gegenspieler“
  - `Umfeld.tsx:197, 201, 220` und `GespraechSzene.tsx:129` („sie“/„er“ und „will“)
  - `Chat.tsx:29-33`
- **Befund:** Englisch und Türkisch zeigen „GEORDNET“, „niemand“ und „+0,3 Kapital/Monat“ (`texte-en.json`, `texte-tr.json`). Auch im Deutschen ist „GEORDNET“ eine interne Kennung in Großbuchstaben.
- **Warum es stört:** Regel 11, und ein Codewort erscheint in der Oberfläche.
- **Vorschlag:** Schlüssel `kab.disziplin.wort.{geordnet,…}` mit „geordnet“, „geschlossen“, „gespalten“, „in Aufruhr“. Die übrigen Wörter in die Kataloge überführen, das Pronomen per `{g, select, f {sie} other {er}}`.

**C-12 · Design · Aufwand klein (Vermutung zur Ursache)**
- **Ort:** Machtkreis › Netz. `ui/personen/machtkreis.css:20-30`, `ui/personen/Machtkreis.tsx:126-146`
- **Befund:** In jedem Knoten liegt das Porträt mitten auf Name und Rolle („K[Gesicht]n“, „Präsi…amt“). Die Mitte „SIE“ ist von einem zweiten Gesicht überzeichnet. Rechts wird die Hebelkarte („Befördern 2 Kapital … Mehr Gewicht in Partei und Öffentlichkeit:“) mitten im Satz abgeschnitten. Gedacht ist ein senkrechtes Raster. Vermutung: Eine allgemeine Knopfregel der Akte überschreibt `display: grid`, denn `!important` steht nur bei `padding`, `border` und `background`.
- **Warum es stört:** Die wichtigste Beziehungsansicht ist unlesbar.
- **Vorschlag:** `.mk-person { display: grid !important; }` oder den Knopf in ein `div` mit Rolle setzen. Danach Rundgangbild 012 bis 015 und Machtkreis erneut prüfen.

**C-13 · Design · Aufwand klein**
- **Ort:** Umbilden › Kandidatenkarten. `ui/personen/NachfolgeAuswahl.tsx` mit `personen.css` (Kartenkopf)
- **Befund:** Das Porträt liegt über Name und Herkunft: „Orh[Bild]n Bilgin · Lang[Bild]ähriger Haushaltsdirektor“, „Sel[Bild]m Yavuz · Ba[Bild]nternehmer“ (`umbilden-1.png`).
- **Warum es stört:** Man kann die Wahl nicht lesen.
- **Vorschlag:** Kartenkopf als Raster `[Porträt 80px] [Name / Herkunft]` aufbauen, wie in der Ministerkarte.

**C-14 · Artwork · Aufwand groß**
- **Ort:** alle Porträts. `game/public/ui/portraits/portraits.json` (`"bilder": []`), `ui/art/portraet-bilder.ts`, `ui/art/portraet-kleidung.tsx:11, 30`, `ui/personen/bausteine.tsx:13-22`, `sim/personen.ts:118-129`, `PORTRAETS_PROMPTLISTE.md`
- **Befund:**
  - Der Weg für gemalte Bilder ist gebaut, das Manifest aber leer. Die 60 vorbereiteten Prompts sind nicht umgesetzt.
  - Die gezeichneten Gesichter sind puppenhaft: gleiche Kopfform, gleiche Augen, gleiche Miene.
  - Die Anzugfarbe ist die Lagerfarbe. Weil zehn der neuen Ressorts das Lager „partei“ tragen, haben 10 von 19 denselben olivgrünen Anzug mit Krawatte.
  - Die beiden Frauen mit Kopftuch tragen dasselbe Magenta.
  - Die Justizministerin trägt eine Richterrobe (`rolle === "justiz" ? "robe"`), obwohl eine Ministerin keine Richterin ist.
  - Der Messingrahmen wie bei einem Ölgemälde passt nicht zum flachen Vektorgesicht darin.
- **Warum es stört:** „ES IST EIN SPIEL DAS AUCH GUT AUSSEHEN MUSS“. Personen sind bei Suzerain das Spiel.
- **Vorschlag:**
  1. Stufe 1 der Promptliste (60 Bilder) erzeugen und einbinden. Der Code ist fertig.
  2. Bis dahin die Kleidung von der Lagerfarbe lösen: Anzugfarbe aus dem Samen (Anthrazit, Marine, Braun, Grau), die Lagerfarbe nur als schmaler Ring.
  3. Robe nur für Richter, nicht für das Justizministerium.
  4. Kopftuchfarbe aus dem Samen.

**C-15 · Konsistenz · Aufwand klein**
- **Ort:** Kabinettstisch gegen Ministerkarte. `MinisterratSaal.tsx:182` (`<Zeichnung … rahmen="keiner">` ohne `tint` und `stimmung`), `bausteine.tsx:29-35` (`Portraet` mit Lagerfarbe und Stimmung)
- **Befund:** Dieselbe Person hat am Tisch einen anderen Hintergrund und keine Miene, in Karte und Umfeld dagegen Lagerfarbe und Stimmung. Der Präsident ist oben links eine schwarze Silhouette, im Machtkreis ein gezeichnetes Gesicht.
- **Warum es stört:** Gleiches sieht verschieden aus.
- **Vorschlag:** Am Tisch ebenfalls `<Portraet w f size={46} />` verwenden. Für den Präsidenten ein Gesicht an allen Stellen.

**C-16 · Sinn · Aufwand mittel**
- **Ort:** Figuren beim Start. `sim/figuren.ts:39-51, 59-62`
- **Befund:**
  - Alle 19 starten mit einer Loyalität von 52 bis 62 und heißen im Umfeld „verlässlich“.
  - Das Geschlecht ist je Amt fest: Innen, Justiz, Präsidialamt und Zentralbank immer Frauen, Finanzen, Äußeres, Generalstab und Industrie immer Männer.
  - Stil und Lager stehen nur klein als Marke.
  - Ein Werdegang fehlt, außer bei Kandidaten („Langjähriger Haushaltsdirektor der Zentralbank“).
- **Warum es stört:**
  - 19 Personen ohne Unterschied sind Aktenarbeit, keine Erzählung.
  - Beim zweiten Spiel ist die Innenministerin wieder eine Frau.
  - Der Maßstab Suzerain verlangt erkennbare Menschen mit Geschichte.
- **Vorschlag:**
  - Vier bis fünf Schlüsselfiguren mit Werdegang, Eigenheit und einem Satz in eigener Stimme hervorheben: Präsidialamt, Finanzen, Inneres, Äußeres und der Kronprinz.
  - Die übrigen 14 bleiben kompakt.
  - Startloyalität streuen (35 bis 85), Geschlecht aus dem Samen.
  - Am Tisch tragen Schlüsselfiguren einen größeren Platz.

**C-17 · Sinn/Erklärung · Aufwand mittel**
- **Ort:** Navigation. `ui/Stage.tsx:555-565`, `ui/Personen.tsx:76-92`, `ui/minister/MinisterPult.tsx`
- **Befund:** Es gibt vier Ebenen: Akte-Reiter (Ministerrat & Kabinett · Gespräch · Verwaltung · Handlungsfähigkeit) → Unterreiter (Ministerrat · Gespräche & Umfeld · Machtkreis · Zusagen) → Reiter der Ministerakte (Vorlagen der Minister · Befehle erteilen) → Thema, Ansatz, Ergebnis. „Gespräch“ heißt dreimal etwas anderes:
  - Akte-Reiter: Chat mit dem Präsidialamt
  - Unterreiter: Umfeld
  - Knopf auf der Ministerkarte: Szene im Umfeld
- **Warum es stört:** Regel 3 (zwei Ebenen). „Wo finde ich …“
- **Vorschlag:** Akte-Reiter Kabinett · Zusagen · Machtkreis · Verwaltung. Das Umfeld als Liste entfällt, weil es der Tisch schon ist. Das Gespräch öffnet sich als Szene über dem Tisch. Der Chat gehört auf den Schreibtisch.

**C-18 · Gestaltung · Aufwand klein**
- **Ort:** Gespräche & Umfeld, Ministerakte. `ui/personen/Umfeld.tsx`, `kabinettstisch.css:33` (`.kt-akte { max-height; overflow-y:auto }`)
- **Befund:** Das Umfeld wiederholt die 19 Personen des Tisches als Kartenliste mit eigenem Bildlauf. Die Ministerakte scrollt innen (1695 zu 680 Pixel), die Akte außen noch einmal.
- **Warum es stört:** Doppelter Inhalt und doppelter Bildlauf.
- **Vorschlag:** Die Liste streichen und Vorlagen und Befehle in der Ministerakte zuklappen: eine Zeile je Vorlage, Klick öffnet sie.

**C-19 · Logik/Sprache · Aufwand klein**
- **Ort:** Kabinettssitzung. `sim/kabinett.ts:228-400, 476-526`, `kabinett.json:78-81`
- **Befund:**
  - Die festen Themen kennen nur die 7 alten Ämter (Finanzen gegen Industrie und Generalstab, Inneres gegen Justiz).
  - „Alle 7 Kabinettsminister gewinnen +8 Loyalität“, tatsächlich trifft es 19.
  - „Groll aller Minister sinkt um -15 Punkte“ ist eine doppelte Verneinung.
  - „Kostet 5 Politisches Kapital“ steht in Text, Wirkung und Preischip, also dreimal.
  - Die Schlüssel für eine Sitzungsszene sind angelegt, aber nicht genutzt („Kabinettssitzung“, „Regulärer Zyklus“, „Beschlussvorlagen liegen unten vor“).
- **Warum es stört:** Die Zahl ist falsch, und die Ministerratssitzung ist keine Szene, nur verstreute Vorlagen.
- **Vorschlag:** Texte korrigieren: „Alle Minister: Loyalität +8“ und „Groll aller Minister −15“. Mittelfristig eine Sitzungsszene am Tisch: alle 45 Tage zwei Themen, Befürworter und Gegner leuchten am Tisch auf.

**C-20 · Logik · Aufwand klein**
- **Ort:** Gespräch › „Anerkennung und Mittel“. `sim/gespraeche.ts:748-751`
- **Befund:** „Neid im Kabinett: Groll der anderen +3“ trifft jetzt 18 statt 6 Personen. Machtwort und Paket treffen ebenfalls alle 19. Die übrigen Schwellen wurden nach F3 angepasst (ENTSCHEIDUNGEN, Nachtrag W), diese nicht.
- **Warum es stört:** Loben ist dreimal so teuer wie geplant.
- **Vorschlag:** Neid nur für Ämter im selben Lager oder Haushaltsbereich buchen, oder `3 × 6/18` rechnen.

**C-21 · Logik · Aufwand klein**
- **Ort:** Zuordnung der Kabinettsvorlagen. `sim/ministerfluss.ts:194-198` (`AMT_VON_RESSORT`), `MinisterratSaal.tsx:52-56` (`leitministerVon`)
- **Befund:** Das Amt wird aus dem übersetzten Ressorttext gelesen, getrennt an „&“ oder „und“. Beim Ressortkonflikt ist `ressort = f.rolle` („Finanzminister“) und trifft nie. In Englisch und Türkisch trifft keines (dort steht nicht „und“). Die Vorlagen landen dann beim Präsidialamt: Abzeichen 4 bzw. 6 am Platz Präsidialamt.
- **Warum es stört:** Der falsche Minister legt vor, und die Abzeichen am Tisch lügen.
- **Vorschlag:** `KabinettThema` bekommt ein Feld `amt`. Kein Text wird mehr gelesen.

**C-22 · Möglichkeiten · Aufwand mittel**
- **Ort:** Behörden. `ui/akte/Bereiche.tsx:398-409`, `sim/behoerden.ts:52-64`
- **Befund:** Die Steuerverwaltung und das Statistikamt TÜİK gehören zum Finanzministerium. Erreichbar sind sie nur über Handlungsfähigkeit › „Behörden des Bereichs (2) ansehen und ausbauen“, nicht über den Finanzminister. Die Behördenleiter („İlker Kalkan“, „Alper Arslan“) sind nur Namen ohne Figur. PLANERWEITERUNG AP 6 nennt „Behörden in die Ministerakte (AP 10)“ als offen.
- **Warum es stört:** Regel 9 („jeder Hinweis führt zur zuständigen Stelle“). Die Verwaltung des Ministers ist von ihm getrennt.
- **Vorschlag:** In der Ministerakte ein dritter Reiter oder eine Zeile „Behörden“ mit den Ausbauknöpfen.

**C-23 · Sprache · Aufwand mittel**
- **Ort:** Ressortflüsse: `ressortanliegen.json`, `ressortrueckhalt.json`, `ressortforderungswege.json`, `ressortnachsorge.json`, `zusagenwache.json`, `zusagendruck.json`
- **Befund:** Amtsdeutsch und Fachjargon ohne Erklärung, etwa „Ressortgröße“, „Ergebnisforderung“, „Beziehungspreis“, „Bruchschwelle“, „Monatsprüfung“, „Tagesprüfung“, „Entwarnungsbereich“, „Die bestehende Zusagenaktion führt die Gegenleistung aus“. Neufassungen in Abschnitt 3.
- **Warum es stört:** Ein neuer Spieler versteht die Folgen nicht.
- **Vorschlag:** Siehe Abschnitt 3.

**C-24 · Sprache · Aufwand klein**
- **Ort:** `rn.schritt.warteschlange` (de, tr)
- **Befund:** „Bearbeite sie zuerst“ ist Du-Form. Im Türkischen steht „Önce onları ele al“.
- **Warum es stört:** Regel 10 verlangt „Sie“.
- **Vorschlag:** „Drei Anliegen sind schon offen. Beantworten Sie diese zuerst; der Minister meldet sich beim nächsten Bericht wieder.“ Türkisch: „Önce onları ele alın.“

**C-25 · Sprache · Aufwand klein**
- **Ort:** Geschlecht in Personentexten: `sim/gespraeche.ts:63-67, 129`, Schlüssel `ui2.ui.personen.MinisterratSaal.8ef008c` und `NachfolgeAuswahl.8ef008c`, `sim/personen-monat.ts:50`, `sim/ereignisse-personen.ts` (Skandal), `sim/personen.ts:276-316`
- **Befund:**
  - Beim Finanzminister Cengiz Bozkurt steht „Was sie gerade umtreibt“, der Satz darunter sagt „er will“.
  - „Sie nennt Zahlen und Schritte aus ihrem Ressort“ steht für jeden.
  - „Gefährlich, wenn er übergangen wird“ steht auch bei Frauen.
  - „Sie kann darauf hinweisen, dass Sie sie nicht unterstützt haben“.
  - „ist etwas dran, geht sie; wenn nicht, ist sie rehabilitiert“ steht beim Skandal für Männer.
  - `sorgeText` nimmt ohne Angabe für Inneres, Zentralbank, Präsidialamt und Justiz „f“ an, für die übrigen „m“.
- **Warum es stört:** Die Personen wirken zusammengewürfelt.
- **Vorschlag:** Durchgängig `{g, select, f {…} other {…}}` verwenden. Überschrift „Was {g, select, f {sie} other {ihn}} umtreibt“.

**C-26 · Zahl/Konsistenz · Aufwand klein**
- **Ort:** Termine. `ui/Personen.tsx:50-55` („4 von 4 frei“), `GespraechSzene.f1372d0` („Termine in 30 Tagen: 0 von 4“)
- **Befund:** Dieselbe Größe steht einmal als freie, einmal als belegte Termine da.
- **Warum es stört:** „0 von 4“ liest sich wie „keiner frei“.
- **Vorschlag:** Überall „Termine frei: 4 von 4“.

**C-27 · Konsistenz/Sprache · Aufwand klein**
- **Ort:** Begriffe des Bereichs
- **Befund:** Mehrere Namen für dieselbe Sache:
  - Loyalität / „Gesinnung Ihnen gegenüber“ (Nachfolge) / „Sadakat“
  - „Jetzt einlösen“ / „Einlösen“ / „Zusage erfüllen“ / „Zusage jetzt erfüllen“ / „Fulfil the promise now“
  - „Umbilden“ (Knopf) führt zu „… entlassen“
  - Ministerrat / Kabinett / Ministerrat & Kabinett
  - „Äußeres“ statt Außenministerium
  - „Streitkräfte“ (Ressort) / „Chef des Generalstabs“
  - „Wirtschaft“ / „Industrie und Technologie“
  - „(hoch = schlecht)“ / „(hoch ist schlecht)“
- **Warum es stört:** Gleiches heißt verschieden.
- **Vorschlag:** Ein Wort je Sache, festgehalten in `i18n/glossar.md`. Siehe Abschnitt 3.

**C-28 · Konsistenz · Aufwand klein**
- **Ort:** Leistung. `ui/personen/Umfeld.tsx:193` (`d.wirkung.length > 0 &&`) gegen `MinisterratSaal.tsx:81` (immer)
- **Befund:** Bei den 12 neuen Ministern zeigt das Umfeld keine Leistung, die Ministerkarte schon.
- **Warum es stört:** Eine Zahl ist in einer Ansicht da und in der anderen nicht.
- **Vorschlag:** Nach C-4 überall zeigen, mit Wirkung.

**C-29 · Zahl · Aufwand klein**
- **Ort:** Kopf › „Kabinett: Kapital je Monat“. `ui/akte/Bereiche.tsx:110`
- **Befund:** `wert: \`+${nf(...)}\`` setzt immer ein Plus. Bei einem negativen Kabinettsertrag, also in einer Krise, steht dort „+-1,2“. „Loyalität im Kabinett“ (`:104`) zählt die Zentralbank mit, der Schnitt am Tisch (`sim/kabinett.ts:198`) nicht.
- **Warum es stört:** Falsche Zahl in der Krise, und zwei Schnitte weichen voneinander ab.
- **Vorschlag:** `mitVorzeichen` aus `MinisterratSaal.tsx` verwenden und denselben Schnitt `kabinettStatus().schnittLoyalitaet` nehmen.

**C-30 · Recht/Glaubwürdigkeit · Aufwand klein**
- **Ort:** Namensvorrat. `sim/figuren.ts:17, 23`. ENTSCHEIDUNGEN, Nachtrag W 374: „ohne Nachnamen amtierender Kabinettsmitglieder“
- **Befund:**
  - Die Liste enthält „Tunç“ und „Güler“. Nach meinem Wissensstand (2025) heißen so der Justizminister Yılmaz Tunç und der Verteidigungsminister Yaşar Güler. Im Spiel erschienen „Orhan Tunç, Chef des Generalstabs“ und „Zeynep Güler, Justizministerin“ (Rundgang 015).
  - Die Figuren des Amtsantritts dürfen Vornamen doppelt tragen (`alt`, `:73`): „Orhan Koçak“ und „Orhan Tunç“ am selben Tisch.
  - Echte Parteien (MHP, DEM Parti) haben erfundene Vorsitzende. Vermutung: Das gehört zur rechtlichen Figurenfrage aus PLANERWEITERUNG 1.
- **Warum es stört:** Die Figuren lassen sich auf reale Personen beziehen, und Verwechslungen am Tisch drohen.
- **Vorschlag:** „Tunç“ und „Güler“ aus der Liste nehmen, dabei die Stabilität alter Spielstände über `ALT` beachten. Den aktuellen Stand des Kabinetts vor jeder Veröffentlichung neu prüfen. Doppelte Vornamen auch für `alt` meiden, oder die Figur nur in der Anzeige umbenennen.

**C-31 · Sinn · Aufwand klein**
- **Ort:** Gespräch (Chat) in der Kabinettsakte. `ui/Chat.tsx:29`, `sim/befehle.ts:931-934`, `simtexte3.json:109`
- **Befund:**
  - „Wie loyal ist mein Innenminister?“ beantwortet der Chat mit „Das habe ich nicht als Auftrag verstanden“.
  - Entlassen lassen sich nur Finanz-, Innen- und Außenminister.
  - Die Vorschläge haben keinen Kabinettsbezug.
  - Die Antwort nennt eine interne Quelle: „(Entwicklungsplan, Abschnitt 7)“.
- **Warum es stört:** Der Chat steht im falschen Bereich, kann dort nichts Bereichseigenes, und ein interner Verweis wird sichtbar.
- **Vorschlag:** Den Chat auf den Schreibtisch verlegen und die Klammer streichen. Wenn er im Kabinett bleibt: Fragen nach Personen mit `kabinettStatus` beantworten.

**C-32 · Logik · Aufwand klein**
- **Ort:** Skandal. `sim/ereignisse-personen.ts:140-152`
- **Befund:** „Untersuchung zulassen: Klärung in zwei Wochen“, aber das Ergebnis steht sofort fest, im selben Klick.
- **Warum es stört:** Der Text verspricht eine Verzögerung, die es nicht gibt. Es fehlt die spannende Wartezeit.
- **Vorschlag:** Das Ergebnis als Folgeereignis nach 14 Tagen buchen, oder den Text zu „Klärung sofort“ ändern. Sonst bleibt nur „Von Präsidenten fallen gelassen“ zu korrigieren: richtig ist „Vom Präsidenten …“.

### Schwere 3

**C-33 · Logik · Aufwand klein**
- **Ort:** Rücktrittsgefahr. `sim/ereignisse-personen.ts:33-36`, `MinisterratSaal.tsx:72, 98`
- **Befund:** Die Drohung setzt Loyalität unter 25 und Groll ab 30 voraus. Gewählt wird aber der Loyalitätsschwächste, auch ohne Groll. Die Marke „Rücktrittsgefahr“ erscheint schon bei Loyalität unter 25, auch wenn der Groll unter 30 liegt und keine Drohung möglich ist.
- **Warum es stört:** Die Warnung und die tatsächliche Wahl passen nicht zusammen.
- **Vorschlag:** Bedingung und Auswahl gleichziehen, die Marke mit Groll ab 30 zeigen.

**C-34 · Regel 5/Sprache · Aufwand klein**
- **Ort:** Zusagen und Befehle. `zusage.gesetz.offen.text`, `ui2.ui.personen.ZusagenAnsicht.c5c02b7`, `sim/minister-befehle.ts:100`
- **Befund:** „Gewerkschaftsrechte landesweit auf Stufe 60“, „von 35 auf volles Streikrecht (jetzt 35)“, „Vorbereiten: Bankenaufsicht, Stufe 55 auf 75“.
- **Warum es stört:** „Stufe“ ist kein Zustand, den man sich vorstellen kann.
- **Vorschlag:** Den benannten Zustand nutzen (`zielName` gibt es schon): „Gewerkschaftsrechte: von ‚eingeschränkt‘ auf ‚volles Streikrecht‘“.

**C-35 · Design · Aufwand klein**
- **Ort:** Kopf. `ui/akte/Akte.tsx:111`, `KOPFBILD.regierung = "amtssitz"`
- **Befund:** Die Zeichnung schimmert verwaschen zwischen und hinter den Kennzahlkarten durch (Ausschnitt `kopf_crop.png`). Die Wertfarben sind uneinheitlich: 59 und 2 in Gold, +4,6 in Schwarz.
- **Warum es stört:** Das sieht nach Fleck aus, nicht nach Bild.
- **Vorschlag:** Die Zeichnung links neben den Titel stellen, voll deckend, und ein Ton für alle Werte.

**C-36 · Zahl/Sprache · Aufwand klein**
- **Ort:** Verwaltung und Entlassung (`hh`- bzw. `reich`-Kataloge sowie `sim/nachfolge.ts`)
- **Befund:**
  - „Im monatlichen Verwaltungszufluss enthalten: 0,0 Punkte aus dem bereits wirksamen Personaletat.“
  - „Glaubwürdigkeit −0,03“
  - „faction willingness +10.0“
  - „+1,8 im Monat“ bei einem ganzzahligen Index
  - Minuszeichen gemischt: „-25 Punkte“ neben „−4“
- **Warum es stört:** Nachkommastellen ohne Aussage und uneinheitliche Zeichen.
- **Vorschlag:** Die Zeile bei 0 ausblenden, Kleinstwerte unter 0,1 weglassen, Indizes ganzzahlig, überall „−“.

**C-37 · Sprache · Aufwand klein**
- **Ort:** Tischzeile „beschlussfähig“ (`MinisterratSaal.25b5b98`), Befürworter „Präsidialamt (Stab)“ (`kab.fb.stab`)
- **Befund:** Fachwort und internes Kürzel.
- **Warum es stört:** Es ist unklar, dass eine Sitzung möglich ist.
- **Vorschlag:** „Sitzung möglich“ / „Nächste Sitzung in {n} Tagen“, „Präsidialamt“.

**C-38 · Sinn · Aufwand klein**
- **Ort:** Handlungsfähigkeit. `ui/akte/Bereiche.tsx:373-382` (`BEREICH_AEMTER.regierung`), `:173-185`
- **Befund:** Die „Zuständigen“ zeigen 7 alte Ämter und die Parteivorsitzenden, die 12 neuen Minister fehlen. „Offene Zusagen nach Frist“ wiederholt den Reiter Zusagen.
- **Warum es stört:** Eine Seite ohne eigene Frage.
- **Vorschlag:** Die Seite auflösen. Die Behörden kommen in die Ministerakte (C-22), die Zusagen bleiben im Reiter.

**C-39 · Regel 5 · Aufwand mittel**
- **Ort:** Behörden: Personal, Technik und Reichweite in Stufen 1 bis 5 (`behoerden.ui.stufe`)
- **Befund:** Personal ist als Punktreihe dargestellt.
- **Warum es stört:** Personal hat eine echte Einheit: Beschäftigte.
- **Vorschlag:** Wo belegt, Beschäftigte angeben, sonst benannte Stufen („dünn besetzt … voll besetzt“).

**C-40 · Logik · Aufwand klein**
- **Ort:** Befehle › „Vorhaben vorbereiten“. `sim/minister-befehle.ts:90-102`
- **Befund:** Der Finanzminister bietet „Preiswahrheit bei Energie“ an, eine Maßnahme des Energieressorts (`data/ministerien.ts`), ohne Hinweis.
- **Warum es stört:** Die Zuständigkeit verschwimmt.
- **Vorschlag:** Die Marke „fremdes Ressort · Energie stimmt mit“ ergänzen (der Merker `eigenesRessort` existiert schon) oder nur eigene Maßnahmen anbieten.

**Zählung:** Schwere 1: 6 · Schwere 2: 26 · Schwere 3: 8 · zusammen 40.

---

## 3. Wortprüfung („Schlüssel: alt → neu“)

**Kabinett**
- `kab.kr.paket.e1`: „Alle 7 Kabinettsminister gewinnen +8 Loyalität“ → „Alle Minister: Loyalität +8“ (en: „All ministers: loyalty +8“; tr: „Tüm bakanlar: sadakat +8“)
- `kab.kr.paket.e2`: „Groll aller Minister sinkt um -15 Punkte“ → „Groll aller Minister −15“
- `kab.kr.paket.text`: „Kostet 5 Politisches Kapital. Der Präsident stellt …“ → „Der Präsident gibt allen Ministerien zusätzliche Mittel, um die Gemüter zu beruhigen.“ (der Preis steht schon am Chip)
- `kab.kr.paket.e3`: „Kostet 5 Politisches Kapital“ → streichen (doppelt)
- `kab.hh.sparen.e2`, `kab.hh.invest.e2`, `kab.si.haerte.e2`, `kab.si.recht.e2`, `kab.si.haerte.e3`, `kab.kr.machtwort.e2`: „-8“ und „-12“ mit Bindestrich → „−8“ und „−12“
- `kab.sorge`: „{name} ({wert} Pkt.)“ → „{name}: {wert} von 100“
- `kab.fb.stab`: „Präsidialamt (Stab)“ → „Präsidialamt“
- `kab.fb.innenministerin` und `kab.fb.justizministerin`: fest weiblich → nach Geschlecht der Figur oder „Innenministerium“ und „Justizministerium“
- `kab.disziplin.rebellisch`: „Offene Meuterei im Kabinett: Mehrere Minister drohen mit geschlossenem Rücktritt.“ → in Ordnung
- `kab.disziplin.gespalten`: „Tiefe Gräben im Ministerrat: Ressortstreitigkeiten lähmen den Reformkurs.“ → „Tiefe Gräben im Kabinett: Die Ressorts arbeiten gegeneinander.“
- `kab.hh.ressort`: „Finanzen und Wirtschaft“ → „Finanzen und Industrie“
- `MinisterratSaal.tsx:157` `GEORDNET` → neue Schlüssel `kab.disziplin.wort.*`: „geschlossen“, „geordnet“, „gespalten“, „in Aufruhr“
- `ui2.ui.personen.MinisterratSaal.25b5b98`: „beschlussfähig“ → „Sitzung möglich“
- `ui2.ui.personen.MinisterratSaal.8f17473`: „Umbilden“ → „Entlassen …“ (solange nur Entlassen möglich ist) bzw. „Umbilden“ erst mit Menü (C-8)
- `ui2.ui.personen.MinisterratSaal.8ef008c`: „Gefährlich, wenn er übergangen wird.“ → „Gefährlich, wenn {g, select, f {sie} other {er}} übergangen wird.“
- `MinisterratSaal.tsx:88` „Kapital/Monat“ → Schlüssel `kab.kapitalMonat`: „{n} Kapital im Monat“

**Ressortnamen**
- `daten.amt.aussen.ressort`, `mfl.ressort.aussen`: „Äußeres“ → „Auswärtiges“
- `mfl.ressort.wirtschaft`: „Wirtschaft“ → „Industrie und Technologie“ (oder Schlüssel streichen, C-5)

**Vorlagen**
- `mfl.lage.titel` und `mfl.p.groll.titel`: `select` ohne neue Ressorts → „{ressort}: {groesse} im schlechten Bereich“ mit `ressort = t(daten.amt.*.ressort)`
- `mfl.p.schweigt.anlass`: „Was im Ressort {ressort} geschieht, erfahren Sie nur noch aus der Zeitung.“ → Satz in Ordnung, Platzhalter reparieren (C-5)
- `mfl.lage.anlassHoch`: „(hoch ist schlecht)“ → einheitlich mit `Umfeld.tsx` „(hoch = schlecht)“ auf „(je niedriger, desto besser)“

**Personen und Gespräche**
- `gespraeche.ts:129` „Was sie gerade umtreibt“ → neuer Schlüssel „Was {g, select, f {sie} other {ihn}} gerade umtreibt“
- `gespraeche.ts:63` „Sie nennt Zahlen und Schritte aus ihrem Ressort.“ → `mfl.ansatz.rat.kurz` verwenden: „Zahlen und Schritte aus dem Ressort.“
- `gespraeche.ts:67` „Öffentlich hinter ihr stehen, wenn sie unter Druck ist.“ → `mfl.ansatz.rueckendeckung.kurz`
- `gespraeche.ts:140` „{name}: mittelmäßig, 45 von 100“ → „{name}: 45 von 100, mittelmäßig“ (die Zahl zuerst, als Schlüssel)
- `personen-monat.ts:50` „Sie kann darauf hinweisen, dass Sie sie nicht unterstützt haben.“ → „Wer ein Ziel verfehlt, sucht die Schuld gern beim Präsidenten.“
- `ereignisse-personen.ts` „Von Präsidenten fallen gelassen“ → „Vom Präsidenten fallen gelassen“
- `ereignisse-personen.ts` Skandal „ist etwas dran, geht sie; wenn nicht, ist sie rehabilitiert“ → „Ist etwas dran, muss {er} gehen; wenn nicht, ist {er} entlastet.“ (`{er}` steht für das Pronomen nach Geschlecht)
- `ui2.ui.personen.NachfolgeAuswahl.*` „Gesinnung Ihnen gegenüber“ → „Loyalität“
- `ui2.ui.personen.GespraechSzene.f1372d0`: „Termine in 30 Tagen: {p0} von {p1}“ → „Termine frei: {frei} von {max}“
- `ui.Personen.c98699e`: „Personen und Zusagen“ → in Ordnung
- `ui/Personen.tsx:69` „niemand“ → Schlüssel `ui.Personen.niemand`
- `ui2.ui.Personen.224907b` + `8d35745` (zusammengesetzt: „Eine Zusage ist“ + „bald fällig oder überfällig.“) → ein Schlüssel mit Plural: „{n, plural, one {Eine Zusage ist} other {# Zusagen sind}} bald fällig oder überfällig.“
- `ZusagenAnsicht.tsx:14` „in Ruhe“ → Schlüssel; „in Ruhe“ → „Zeit genug“

**Ressortflüsse**
- `rn.schritt.warteschlange`: „Drei Ressortanliegen sind bereits offen. Bearbeite sie zuerst; dieser Minister prüft den Handlungsbedarf beim nächsten Bericht erneut.“ → „Drei Anliegen sind schon offen. Beantworten Sie diese zuerst; der Minister meldet sich beim nächsten Bericht wieder.“
- tr `rn.schritt.warteschlange`: „Önce onları ele al“ → „Önce onları ele alın“
- `ra.intro`: „Bleibt ein kritisches Ressort 30 Tage ohne neue fachliche Schritte oder Gespräch, meldet sich der zuständige Minister. Bis zu drei Anliegen liegen gleichzeitig vor. Lesen allein gilt nicht als Entscheidung.“ → „Läuft ein Ressort schlecht und hören Sie 30 Tage nichts von sich, meldet sich der Minister. Höchstens drei Anliegen warten gleichzeitig.“
- `ra.fristRegel`: „… kostet der Fristablauf zusätzlich 2 Loyalität und bringt 3 Groll. Nach ausdrücklicher Ablehnung wird dieser Beziehungspreis nicht nochmals gebucht …“ → „Lassen Sie die Frist verstreichen, kostet das 2 Loyalität und bringt 3 Groll. Haben Sie schon abgelehnt, fällt das nicht noch einmal an.“
- `ra.ohneEigenGut`: „… Ressortgröße 1,2 Punkte besser, einmalig 0,01 % des BIP, Legitimität −0,3 …“ → „Antworten Sie nicht, handelt der Minister allein: {groesse} +1, Legitimität −0,3.“ (die 0,01 % BIP weglassen)
- `ra.folgenGrenze`: „Diese Belege zeigen die jeweils tatsächlich gebuchten Schritte …“ → „Hier steht nur, was wirklich gebucht wurde. Andere Krisen wirken zusätzlich.“
- `rr.erklaerung.fortschritt`: „Ein zuvor kritischer Ressortwert liegt mindestens einen Punkt besser als sein bisher anerkannter Bestwert …“ → „Der Wert hat sich um mindestens einen Punkt verbessert, und nichts anderes ist schlechter geworden.“
- `rr.erklaerung.druckpause`: „… Seit der letzten Druckreaktion sind noch keine 28 Tage vergangen; deshalb entsteht heute kein weiterer Abzug.“ → „Die Fraktionen haben vor weniger als vier Wochen schon Druck gemacht; heute nicht noch einmal.“
- `rr.keineZusage`: „Politische Ergebnisforderungen, keine automatisch angenommenen Zusagen …“ → „Das sind Erwartungen der Fraktionen, keine Zusagen von Ihnen.“
- `rh.ohneVotum`: „Dieser Nachtrag verwendet die bestehende unmittelbare Haushaltsbefugnis: kein zusätzliches Votum, aber ein Legitimitätspreis …“ → „Geht ohne Abstimmung im Parlament, kostet aber Legitimität. Während der Haushaltsberatung gesperrt.“
- `rh.bedingt`: „Bedingte Rechnung mit heutiger politischer Lage. Keine Vorhersage künftiger Krisen …“ → „Gerechnet mit der heutigen Lage; Krisen und Wechsel können alles ändern.“
- `zw.einloesenText`: „Die bestehende Zusagenaktion führt die Gegenleistung aus. Unten stehen die tatsächlichen sofortigen Kosten und Personenfolgen.“ → „Sie lösen die Zusage ein. Darunter stehen Preis und Folgen für die Beteiligten.“
- `zw.pruefung`: „Monatsprüfung am {datum}: Ein aktiver Parteivorsitz unter 20 Loyalität lässt die Partei austreten …“ → „Am {datum} wird abgerechnet: Fällt die Loyalität der Parteispitze unter 20, verlässt die Partei die Koalition, und Sie verlieren {sitze} Sitze.“
- `zd.grenze`: (fünf Zeilen Vorbehalt) → „Gerechnet mit den heute offenen Erinnerungen; was noch kommt, ist nicht enthalten.“
- `rn.wechsel`: „Die Werte beschreiben dasselbe Ressort, nicht die persönliche Leistung einer einzigen Person.“ → „Die Werte gelten für das Ressort, nicht nur für die neue Leitung.“

**Zusagen, Chat und Fachwörter**
- Einheitlich für dieselbe Handlung: `mfl.z.einloesen.label` „Einlösen“, `zw.einloesen` „Zusage jetzt erfüllen“, `ze.erfuellen` „Zusage erfüllen“, `ui.personen.ZusagenAnsicht.104b3fd` „Jetzt einlösen“ → überall „Einlösen“ mit Preis („Einlösen · 4 Kapital“)
- `zw.vertroesten`: „Zeit gewinnen · mit politischem Preis“ und `zw.verschieben` „Mit diesen Folgen vertrösten“ → überall „Vertrösten“
- `zusage.gesetz.offen.text`: „Zugesagt: {name} landesweit auf Stufe {ziel}.“ → „Zugesagt: {name} auf „{zielName}“.“
- `sim2.sim.befehle.9c310e0`: „… (Entwicklungsplan, Abschnitt 7).“ → Klammer streichen
- Fachwörter ohne Erklärung (je eine ⓘ-Erklärung oder ein Ersatzwort): „Ressortgröße“ → „Leitwert des Ressorts“; „Ergebnisforderung“ → „Erwartung der Fraktion“; „Beziehungspreis“ → „Preis an Loyalität“; „Bruchschwelle“ → „Grenze, ab der die Partei geht“; „Entwarnungsbereich“ → „unkritischer Bereich“; „Tagesprüfung“ und „Monatsprüfung“ → „Abrechnung am {datum}“

**Übersetzung**
- Gesamte Gesprächsszene, Nachfolge, Befehle und Personenereignisse in en und tr: deutsche Literale (C-3)
- Chat-Beispiele in en und tr: deutsch (`Chat.tsx:29-33`)
- tr `kab.fb.stab`: „Cumhurbaşkanlığı (ekip)“ → „Cumhurbaşkanlığı İdari İşler“ bzw. „Cumhurbaşkanlığı“
- en `kab.disziplin.*` und `kt.*`: geprüft, natürlich formuliert. Die türkischen Ressortnamen folgen den amtlichen Bezeichnungen („Millî Eğitim“, „Sanayi ve Teknoloji“), das ist gut.

---

## 4. Die fünf wichtigsten Verbesserungen

### 1. Gemalte Porträts und unterscheidbare Menschen (C-14, C-15, C-16)
Wirkung: Schönheit und Suzerain-Gefühl. Die 60 Bilder der Promptliste erzeugen; der Weg im Code ist fertig. Bis dahin Kleidung aus dem Samen statt aus dem Lager, das Lager als dünner Farbring. Fünf Schlüsselfiguren bekommen Werdegang, Eigenheit und eine Stimme.

```
 ┌───────────── Kabinettstisch ─────────────┐
 │   [Präsidialamt  GROSS]  [Finanzen GROSS] │   Schlüsselfiguren: 72 px, gemalt,
 │ [klein] [klein] [klein]   [Inneres GROSS] │   Name + 1 Zeile Werdegang darunter
 │ [klein]      ( Tisch: „geordnet“ )  [klein]│
 │ [klein]  „Nächste Sitzung in 12 Tagen“    │   Mitte: Disziplin, Sitzung, Rücktritt
 │ [klein] [klein] [Äußeres GROSS] [klein]   │
 └───────────────────────────────────────────┘
 Klick auf ein Gesicht: Akte rechts, oben Porträt 160 px, darunter ein Satz in eigener Stimme
 („Die Märkte glauben uns nur, solange der Haushalt hält.“), dann die Werte.
```

### 2. Ein Bildschirm für das Kabinett, ohne Zahlenwände und Doppelungen (C-9, C-10, C-17, C-18, C-38)
Wirkung: Übersicht und „hinterfrag jeden Klick“. Die Tischzeile, die Chipzeile, die Umfeld-Liste und die Handlungsfähigkeit entfallen. Der Tisch steht direkt unter dem Kopf und passt ganz auf den ersten Schirm. Beschriftungen in Kurzform, Abzeichen am Porträtrand. Zwei Ebenen: Akte-Reiter (Kabinett · Zusagen · Machtkreis · Verwaltung), im Kabinett ein Klick auf eine Person öffnet die Ministerakte, ein Klick auf „Gespräch“ öffnet die Szene als Fenster über dem Tisch. Der Chat zieht auf den Schreibtisch.

### 3. Jede Zahl stimmt: Preise abbuchen, Wirkungen echt machen (C-1, C-4, C-6, C-7, C-21)
Wirkung: „keine Schau“.
- Kabinettsbeschlüsse buchen ihr Kapital.
- Jedes der 17 Ressorts bewegt seine Leitgrößen nach Leistung. Die Ministerkarte zeigt die Wirkung als Zeile: „Wirkt im Monat: Wartezeiten −0,4, Ärzte +0,3“.
- Die Ressortsorge rechnet mit `schlechtesteGroesse`.
- Kabinettsthemen tragen ihr Amt als Feld.
- Das Einlösen der Ministerien-Zusage zeigt, wer geht.

### 4. Kabinettspolitik als echte Möglichkeit: Umbilden, Proporz, Sitzung (C-6, C-8, C-19)
Wirkung: Möglichkeiten und Abwägungen. „Umbilden“ öffnet ein Menü:

```
 Umbilden: Finanzminister Cengiz Bozkurt
  ( ) Entlassen und Nachfolger wählen ........ 3–5 Kapital, Märkte ±
  ( ) Versetzen nach … [Auswahl am Tisch] ..... 2 Kapital, Fähigkeit −12 im neuen Amt
  ( ) An Partner geben (YENİ: 1 von 2 offen) .. 2 Kapital, Zusage rückt vor
  ( ) Kommissarisch besetzen .................. 2 Kapital, Leistung −20 %
```

Alle 45 Tage tagt der Ministerrat als Szene am Tisch: zwei Themen, Befürworter leuchten grün, Gegner rot, der Beschluss verändert sichtbar die Ringe. Optional wird der Vizepräsident der 20. Platz und zugleich der Nachfolgekandidat.

### 5. Ein Personenspiel in drei Sprachen und mit richtigem Geschlecht (C-3, C-11, C-24, C-25, C-27)
Wirkung: Sprache und Glaubwürdigkeit. Alle Texte aus `gespraeche.ts`, `nachfolge.ts`, `minister-befehle.ts`, `ereignisse-personen.ts` und `personen-monat.ts` kommen in Kataloge, mit `{g, select, f {…} other {…}}` für das Pronomen. Dazu ein Glossar mit je einem Wort für Loyalität, Einlösen und Vertrösten sowie eine Durchsicht der Ressortflüsse auf kurze Sie-Sätze (Abschnitt 3). Danach in Englisch und Türkisch je ein Gespräch, eine Entlassung und einen Skandal durchspielen.

---

## Gutes, das bleiben soll

- **Nachfolgeauswahl:** drei Kandidaten mit echtem Zielkonflikt (Fachmann mit wenig Rückhalt, treuer Weggefährte mit Marktabschlag, ehrgeiziger Parteimann), Folgen der Entlassung als Liste und der Weg „nur entlassen, kommissarisch besetzen“.
- **Gesprächsszene:** Thema → Ansatz → Ergebnis, Gründe für gesperrte Ansätze („Ohne konkreten Anlass ist Kritik nur Streit“), Folgen in Zahlen und Abkühlzeiten.
- **Zusagen:** „Wenn gehalten“ und „Wenn gebrochen“ nebeneinander, zwei Vertröstungen als harte Grenze.
- **Skandal:** Die Wahrheit ist verborgen (45 %), und Stützen, Prüfen oder Fallenlassen haben je ihren Preis. Das ist Suzerain im besten Sinn.
- **Ministerkarte:** gleicher Aufbau für alle 19 Personen und lesbare Balken.
- **Türkische Fassung:** Sie nutzt die amtlichen Ressortnamen.

## Was ich nicht prüfen konnte

- Den Ablauf über Monate: Rücktrittsdrohung, Intrige, Leck, Machtkreisereignisse und das Umbildungsfenster nach einer Wahl. Ich habe nur den Code gelesen, keine Langpartie gespielt.
- Die KI-Variante des Chats. „KI einrichten“ würde eine bezahlte Schnittstelle brauchen, deshalb nicht angefasst.
- Die Ausbaubestätigung der Behörden. Ich habe keinen Ausbau ausgelöst, nur gelesen.
- Ob „Tunç“ und „Güler“ im November 2026 noch Minister sind (mein Wissensstand: 2025).
- Die Ursache des Machtkreis-Überdeckens ist eine Vermutung (C-12).
- Die Ressortnachsorge- und Rückhaltkarten habe ich nur aus Code und Katalog geprüft, nicht im Bild, weil sie erst nach Ressortvorfällen erscheinen.
