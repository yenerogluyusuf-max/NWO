# Befund A: Einstieg und Schreibtisch (5. November 2026)

Prüfer A. Grundlage:
- Code und Kataloge vollständig gelesen bzw. maschinell ausgewertet: `sim/ereignisse*.ts`, `ereignis-hilfen.ts`, `welt-ereignisse.ts`, `ui/EreignisFenster.tsx`, `ui/ereignis/kontext.ts`, `ui/App.tsx`, `ui/Prologue.tsx`, `ui/ZielWahl.tsx`, `ui/Amtsantritt.tsx`, `ui/kopf/Kopfleiste.tsx`, `ui/SpeicherDossier.tsx` sowie die Kataloge titel, prolog (Stichprobe), antritt, kopf, navigation, schreibtisch, schreibtischlage, ereignis, mentor, epoche, enden, takt (Stichprobe), ereignisse_innen und ereignisse_aussen.
- **Eigene Messung aller 109 Ereignisvorlagen:** `scratchpad/analyse-A/dump.test.ts` → `dump.json` und `kompakt.txt`.
  - Jede Antwort wurde über `entscheide()` auf einer Kopie ausgeführt.
  - Gemessen wurden das abgebuchte Kapital, die Kosten in Prozent des BIP (Nettoschuld minus Kasse), der Ausgang und die Vorschau.
  - Der Lauf wurde in Englisch und Türkisch wiederholt (`dump_en.json`, `dump_tr.json`).
- **Häufigkeit:** `haeufig.test.ts` → `haeufig.json`. Ein Bot spielt vier Jahre mit den Samen 3 und 11 und wählt stets die günstigste Antwort.
- **Wächtertest:** `test/schau-antworten.test.ts` wurde mit `SCHAU_AUS` als Einzeldatei ausgeführt (→ `schau.json`). Er ist grün.
- **Eigene Bilder:** `scratchpad/analyse-A/bilder/`
  - `p00`–`p11`: Titel und Prolog
  - `q02`–`q06`: Amtsantritt, Einführung, Ereignisfenster, Karte
  - `de_t*`: Ereignis unten, Menü, Spielstand, Schreibtisch, Chip-Ziel
  - `en_t01`: Ereignis auf Englisch
- **Rundgangbilder:** 001 und 002.

Pfadkürzel: `sim/` = `game/src/sim/`, `ui/` = `game/src/ui/`, `kat/` = `game/src/i18n/katalog/de/`.

---

## 1. Ansichten

**Titelbild (p00)**
- **Frage:** Wie beginne ich oder setze fort?
- **Antwort:** ja. Siegel, Logo und drei Knöpfe auf der Karte.
- **Länge:** 1 Bildschirm.
- **Noten:** Schönheit 2, Verständlichkeit 2, Sinn 3, Spielgefühl 2.
- **Urteil:** Würdig und ruhig. Es fehlen Einstellungen und eine Anleitung, und unten steht eine Quellenzeile („Wirtschaftsdaten vom 25. September 2026 …“), die außer der Kartenlizenz nicht in die Oberfläche gehört.

**Sprachwahl (p00 oben rechts, Menü)**
- **Frage:** In welcher Sprache spiele ich?
- **Antwort:** ja.
- **Länge:** –.
- **Noten:** Schönheit 2, Verständlichkeit 1, Sinn 2, Spielgefühl 3.
- **Urteil:** Die Wahl selbst ist gut. Sie verspricht aber eine englische und türkische Partie, die es bei den Ereignissen zur Hälfte nicht gibt (A-1).

**Prolog „Wer bist du?“ (p01)**
- **Frage:** Wer ist meine Figur?
- **Antwort:** ja. Porträt, Name, Gesichtsregler.
- **Länge:** 1.
- **Noten:** Schönheit 2, Verständlichkeit 2, Sinn 2, Spielgefühl 2.
- **Urteil:** Ein schöner Buchrahmen. Die Gesichtsregler zeigen nur Nummern („Frisur 6 / 10“), und das versprochene Gesicht „im Amt“ taucht in der Kopfleiste nie auf (A-24).

**Szenario „Wie beginnt deine Geschichte?“ (p02)**
- **Frage:** Mit welchem Gepäck starte ich?
- **Antwort:** teilweise.
- **Länge:** 1.
- **Noten:** Schönheit 2, Verständlichkeit 2, Sinn 2, Spielgefühl 2.
- **Urteil:** Drei klare Karten. Was jede Wahl in Zahlen bedeutet (Sitze, Kapital, Inflation), steht nicht dabei.

**Prolog-Stationen 1–8 (p03–p10)**
- **Frage:** Was hat mich geprägt?
- **Antwort:** ja. Szene, Band der Stationen, vier Karten mit Folgechips.
- **Länge:** 1 je Seite.
- **Noten:** Schönheit 2, Verständlichkeit 2, Sinn 2, Spielgefühl 2.
- **Urteil:** Der stärkste Teil des Bereichs: erzählt, mit echtem Preis je Antwort. Die Karte links ist leer und unerklärt (rote Umrisse ohne Namen), und einzelne Texte sind kopiert (CHP und İYİ wortgleich).

**Parteikonfigurator (p08)**
- **Frage:** Wofür steht meine Partei?
- **Antwort:** teilweise.
- **Länge:** etwa 1,3.
- **Noten:** Schönheit 3, Verständlichkeit 3, Sinn 2, Spielgefühl 3.
- **Urteil:** Gute Idee (Leiste von Rand zu Rand). Die Karten werden am Rand abgeschnitten („erale Partei“, „Partei de Regione“), und der Regler zeigt nur Wörter ohne Folgen.

**Prolog-Abschluss (p11)**
- **Frage:** Wer bin ich geworden?
- **Antwort:** ja. Lebenslauf als Liste.
- **Länge:** 1.
- **Noten:** Schönheit 2, Verständlichkeit 2, Sinn 3, Spielgefühl 2.
- **Urteil:** Ein schöner Abschluss. Der Name wird gekürzt („Leyla Gü…“), und es heißt „von Beruf Anwältin oder Anwalt“ statt „Anwältin“.

**Amtsantritt mit Zielkacheln und Schwierigkeit (q02)**
- **Frage:** Wie stark starte ich, und was will ich erreichen?
- **Antwort:** ja. Halbrund und vier Zahlen.
- **Länge:** 1.
- **Noten:** Schönheit 2, Verständlichkeit 3, Sinn 2, Spielgefühl 2.
- **Urteil:** Das Halbrund ist schön. Die Oppositionsblöcke sind aber unbeschriftet, die 18 Ziele stehen als reine Textkacheln mit Fachkürzeln („Stufe 60“, „1 laufende Verträge“), und die Schwierigkeit wird ohne Zahlen erklärt.

**Einführung „So regieren Sie“ (q03)**
- **Frage:** Wie funktioniert das Spiel?
- **Antwort:** teilweise.
- **Länge:** 1.
- **Noten:** Schönheit 2, Verständlichkeit 3, Sinn 3, Spielgefühl 4.
- **Urteil:** Eine Textwand in fünf Absätzen. Kein Pfeil zeigt auf die Leiste, die Kopfzahlen oder den Schreibtisch.

**Ereignisfenster (q04, q05, de_t01b, en_t01)**
- **Frage:** Was ist passiert, was kann ich tun, was kostet es?
- **Antwort:** teilweise.
- **Länge:** 1 (das Feld „Ohne Antwort“ ist unten abgeschnitten).
- **Noten:** Schönheit 3, Verständlichkeit 2, Sinn 2, Spielgefühl 3.
- **Urteil:** Die richtige Grundform: Sprecher mit Gesicht, Zitat, „Worum es geht“, Karten mit Vorschau und eine Frist als Balken. Die Szene ist grobe Flächengrafik, Preis und Kosten stehen dreifach da, die Kennzahlen passen teils nicht zum Thema, und die Hälfte der Ereignisse ist nur deutsch.

**Hauptansicht mit Kopfleiste, Meldungschips und Leiste (q06)**
- **Frage:** Wie steht es, und wo brennt es?
- **Antwort:** teilweise.
- **Länge:** 1.
- **Noten:** Schönheit 2, Verständlichkeit 3, Sinn 3, Spielgefühl 3.
- **Urteil:** Eine klare Kopfleiste. Das Parlament steht ohne Beschriftung („344/600“), das Avatarbild ist ein Platzhalter, die Chips führen teils an die falsche Stelle, und die Karte zeigt beim Start nichts.

**Schreibtisch (001, de_t05_*)**
- **Frage:** Was muss ich heute entscheiden?
- **Antwort:** nein. Kein Bild, eine Liste unter einer doppelten Kopfzeile.
- **Länge:** 2,55 Bildschirme (Grenze 1,5).
- **Noten:** Schönheit 3, Verständlichkeit 4, Sinn 3, Spielgefühl 4.
- **Urteil:** Zu lang und zu verschachtelt. Sieben Eingangskörbe heißen verschieden („Auf dem Tisch“, „Unterschriftenmappe“, „Posteingang der Minister“, „Im Umlauf“, „Heute: Was jetzt ansteht“, „Alle Vorlagen und Befehle“, „Krisenrat“), und dieselbe Zusage steht zweimal mit zwei Knöpfen.

**Verlauf (002)**
- **Frage:** Was ist bisher geschehen?
- **Antwort:** nein.
- **Länge:** 1.
- **Noten:** Schönheit 3, Verständlichkeit 3, Sinn 3, Spielgefühl 4.
- **Urteil:** Am Anfang leer, alles grau-kursiv, kein Bild. Darin der Satz „schaut das Spiel nach“, der die Rolle verlässt.

**Hauptmenü ≡ (de_t03)**
- **Frage:** Sichern, Sprache, Einstellungen?
- **Antwort:** ja.
- **Länge:** –.
- **Noten:** Schönheit 2, Verständlichkeit 2, Sinn 3, Spielgefühl 3.
- **Urteil:** Aufgeräumt. „Effekte der Karte“ steht doppelt (im Menü und als Kartenknopf), und es gibt weder Hilfe noch Tastenkürzel.

**Spielstand (de_t04)**
- **Frage:** Wo sichere und lade ich?
- **Antwort:** ja.
- **Länge:** 1.
- **Noten:** Schönheit 3, Verständlichkeit 2, Sinn 2, Spielgefühl 4.
- **Urteil:** Ein funktionales Formular („Slot 1: Leer“, „Als Datei sichern (.json)“). Es wirkt wie eine Verwaltungsmaske, nicht wie ein Spiel.

**Spielende und Vermächtnis (nur Kataloge `kat/enden.json` geprüft)**
- **Frage:** Wie endet meine Laufbahn, was bleibt?
- **Antwort:** nicht im Bild geprüft.
- **Länge:** –.
- **Noten:** Schönheit –, Verständlichkeit 2, Sinn 2, Spielgefühl 2.
- **Urteil:** Gute Epiloge je Ende (Putsch, Tod, Sturz, Abwahl). Darin steht aber das interne Kürzel „AP“ (A-19).

**Mentorin (Schreibtisch rechts, `kat/mentor.json`)**
- **Frage:** Was hängt hier zusammen?
- **Antwort:** teilweise.
- **Länge:** –.
- **Noten:** Schönheit 3, Verständlichkeit 3, Sinn 3, Spielgefühl 3.
- **Urteil:** Die Texte sind gut erklärt, verweisen aber auf Stellen, die es nicht mehr gibt (A-23).

**Gut, das bleiben soll:**
- der Prolog als illustriertes Lebensbuch mit Preis je Antwort
- das Halbrund beim Amtsantritt
- die Frist als Balken
- die Vorschau „Was das bewirkt“, auf einer Kopie gerechnet
- der Block „Ohne Antwort“
- die Folgehaken: Antworten kommen als neue Ereignisse zurück (`sim/ereignisse.ts:1079`)
- die Variantenrotation der Affären
- die Dichte-Dämpfung: Im Bot-Lauf kamen etwa 14 Ereignisse im Jahr, also nicht zugeschüttet.

---

## 2. Befunde

**A-1 · Übersetzung · Schwere 1 · Aufwand groß**
- **Ort:** alle Ereignisse; `sim/ereignisse.ts:100–1015` und :1188, `ereignisse-reich.ts`, `-krieg.ts`, `-personen.ts`, `-verfassung.ts`, `-vermittlung.ts`, `-eu.ts`, `-katastrophe.ts`, `welt-ereignisse.ts`, `welt-dienst.ts`; `sim/spiel.ts:102–104`.
- **Befund:**
  - In Englisch und Türkisch zeigen **51 von 94 auslösbaren Ereignissen** deutsche Titel und Texte, und **154 von 292 Antworten** sind deutsch (Messung `dump_en.json` und `dump_tr.json`).
  - Betroffen sind unter anderem Erdbeben, Lira, Korruption, Streik, Mietproteste, Flucht, Anschlag, Ärztestreik, alle Erbe-, Recht-, Personen-, Krieg-, EU- und Weltereignisse sowie „YENİ meldet sich“ (en_t01: englischer Rahmen, deutscher Titel und deutsches Zitat).
  - Die Ersatzantwort „Abwarten und nichts tun“ ist fest verdrahtet (`ereignisse.ts:1188`).
  - Die Namen der Schwierigkeitsstufen erscheinen auf Englisch als „Entspannt / Normal / Hart“ (`spiel.ts:102–104`).
- **Warum es stört:** Ein englischer oder türkischer Spieler kann die Hälfte aller Entscheidungen nicht lesen. Das bricht das Spiel.
- **Vorschlag:** Alle Vorlagen auf `t("ev.<id>.…")` umstellen, nach dem Muster von `ereignisse-innen.ts`. Dazu ein Wächtertest, der `dump_en` nachbaut und jeden deutschen Funktionswortanteil in Titel, Text, Label und Beschreibung verbietet.

**A-2 · Logik/Sprache · Schwere 2 · Aufwand klein**
- **Ort:** Personenereignisse; `sim/ereignisse-personen.ts:173`, :226–229, :325–328 sowie Annehmen und Standardfolge von `person_ruecktritt`.
- **Befund:** Der Ausgangstext wird erst *nach* `ausscheiden()` erzeugt und nennt deshalb den **Nachfolger**:
  - „Chef des Generalstabs Serkan Demirci droht mit Rücktritt“ → Ausgang „Chef des Generalstabs Tarık Demir tritt zurück“.
  - „Vorwürfe gegen Finanzminister Emre Ateş“ → „Finanzminister Koray Bozkurt muss gehen“.
  - Bei Intrige und Altersabschied ebenso.
- **Warum es stört:** Der Spieler glaubt, die falsche Person sei gegangen. Chronik und Protokoll lügen.
- **Vorschlag:** `const name = wer(g)` vor `ausscheiden()` merken, wie bei `korruptionsaffaere` (`ereignisse.ts:408`).

**A-3 · Sinn/Konsistenz · Schwere 2 · Aufwand mittel**
- **Ort:** Schreibtisch › Auf dem Tisch (001 und de_t05): Zusagenwache plus Ereignis `start_partner`.
- **Befund:** Dieselbe Sache steht zweimal mit zwei Wegen:
  - als Karte „Der YENİ Parti wurden zwei Ministerien zugesagt“ mit dem Knopf „Zusage jetzt erfüllen“ (4 Kapital);
  - als Ereignis „YENİ meldet sich“ mit der Antwort „Zwei Ministerien abgeben“ (4 Kapital).
  - Hinzu kommt der Titel der Zeile, der in der Karte wörtlich wiederholt wird.
- **Warum es stört:** Der Spieler weiß nicht, ob er zweimal zahlen muss oder welcher Weg gilt. Das verletzt „Nichts doppelt“.
- **Vorschlag:** Für die Startzusage nur einen Vorgang führen, entweder das Ereignis oder die Zusagenkarte. Die andere Stelle verlinkt nur: „→ im Ereignis entscheiden“.

**A-4 · Logik/Zahl · Schwere 1 · Aufwand mittel**
- **Ort:** Ereignisantworten (gemessen, `dump.json`).
- **Befund:** Die Hinweistexte widersprechen dem Code:
  - `kanal_istanbul:bauen`: „Kostet 6 Kapital und 1,0 % des BIP“. Abgebucht werden **12 Kapital** und sofort **0 %** (`ereignisse-innen.ts:741–749`: +6, dann `beginne()`; die Kosten trägt das Bauvorhaben über die Jahre).
  - `tourismusrekord:ausbauen`: „3 Kapital und 0,2 % des BIP“. Tatsächlich **3,9 Kapital, 0 %** (`:700–712`).
  - `putsch_warnung:entlassen`: „Kostet 3 Kapital“. Tatsächlich **5**, weil `entlasse()` in `sim/enden.ts:257` nachbucht.
  - `bauernproteste:subventionen`: „0,2 % des BIP“ einmalig. Tatsächlich hebt die Antwort die Agrarsubventionen dauerhaft um 12 Stufen, also laufende Kosten (`ereignisse-innen.ts:556`).
  - `mil_militaerrat:loyalitaet`: „Kostet nichts“. Tatsächlich **+3 Kapital Gewinn**, verschwiegen (`ereignisse-reich.ts:528`).
  - `fluechtlingswelle:grenze`: „Kritik von Menschenrechtlern“ hat keine Wirkung, die EU-Beziehung *steigt* sogar um 2 (`ereignisse.ts:539–543`).
  - `fluechtlingswelle:eu`: „wenn es klappt, zahlt die EU“. Es klappt immer (`:552`).
  - `mietproteste:sozial`: „die Wirkung kommt spät“. Sie wirkt sofort (`wirke` in derselben Zeile).
- **Warum es stört:** Das verletzt Regel 7 und kostet Vertrauen in jede Preisangabe.
- **Vorschlag:**
  - Den Preis nie mehr frei schreiben, sondern aus der Messung erzeugen: `beschr()` bekommt die tatsächlichen Werte aus der Kopie.
  - Einen Wächter ergänzen, der „N Kapital“ und „X % des BIP“ im Text gegen die Abbuchung prüft (Vorlage: `scratchpad/analyse-A/pruef.py`).
  - Beim Kanal: „Startet das Bauvorhaben: 12 Kapital, Baukosten über N Jahre in der Bauakte“.

**A-5 · Zahl · Schwere 3 · Aufwand klein**
- **Ort:** `sim/ereignis-hilfen.ts:147` (`beschr`).
- **Befund:** Der Betrag 0,15 % wird als „0,2 % des BIP“ gezeigt. Betroffen sind Überschwemmung, Bankenstress, Rentner, Fabrik und Grenzzwischenfall; die Vorschau sagt dazu richtig „Schulden +0,15“.
- **Warum es stört:** Zwei Zahlen für denselben Preis in einer Karte.
- **Vorschlag:** Unter 1 % immer zwei Stellen verwenden: `nf(x, x < 1 ? 2 : 1)`.

**A-6 · Logik/Design · Schwere 2 · Aufwand klein**
- **Ort:** Ereignisfenster › „Worum es geht“ und Aktenknopf; `ui/ereignis/kontext.ts:57`.
- **Befund:**
  - Bei „AKP meldet sich“ und „YENİ meldet sich“ (q04, de_t01b) stehen „Unabhängigkeit der Justiz 32 / 100, Pressefreiheit 30 / 100“ und der Knopf „Justiz öffnen“, weil die Szene `parlament` pauschal auf `recht` abgebildet wird.
  - Beim Wiederaufbau (q05) spricht der „Umweltminister“, der Text sagt aber „Chefin des Präsidialamts … legt den Bericht vor“.
- **Warum es stört:** Die Zahlen beantworten die Frage des Ereignisses nicht, und der Knopf führt an eine falsche Stelle (verletzt Regel 9).
- **Vorschlag:**
  - Partner- und Koalitionsereignisse zeigen „Sitze des Lagers, Loyalität des Partners, offene Zusagen“ und den Knopf „Kabinett & Verwaltung › Zusagen“.
  - Thema und Sprecher werden in der Vorlage festgelegt (Feld `thema`, `sprecher`) statt per regulärem Ausdruck auf die Kennung. Die Kommentare „Spielerdurchlauf 5. November“ zeigen, dass jeder Fall einzeln geflickt wird.

**A-7 · Konsistenz · Schwere 2 · Aufwand klein**
- **Ort:** Ereignisfenster › Antwortkarte (q04, q05).
- **Befund:** Der Preis steht dreifach:
  - als Plakette „6 Kapital“;
  - im Text „Kostet 6 Kapital und 0,4 % des BIP; …“;
  - als Chip „Schulden +0,40 Prozentpunkte“.
- **Warum es stört:** Das verletzt Regel 8, die Karten werden lang, und der eigentliche Satz zur Folge rutscht nach hinten.
- **Vorschlag:**
  - Die Plakette zeigt Kapital und BIP („6 Kapital · 0,4 % BIP“).
  - Der Text enthält nur die Folge („Schneller Wiederaufbau, aber anfällig für Korruption.“).
  - Der Schuldenchip entfällt.

**A-8 · Konsistenz · Schwere 3 · Aufwand klein**
- **Ort:** Ereignisfenster › Karte „Abwarten und nichts tun“ und Block „Ohne Antwort“.
- **Befund:** Beide zeigen dieselbe Standardfolge. Der Unterschied (−0,8 Zustimmung nur beim Verstreichen) bleibt unbeziffert („Schweigen kostet zudem Zustimmung“).
- **Warum es stört:** Doppelt und ungenau.
- **Vorschlag:** Die Karte „Abwarten“ entfällt. Der Block „Ohne Antwort“ bekommt einen eigenen Knopf „Bewusst abwarten“ und die Zeile „Verstreicht die Frist: zusätzlich Zustimmung −0,8“.

**A-9 · Zahl/Design · Schwere 2 · Aufwand mittel**
- **Ort:** Vorschauchips; `kat/ereignis.json` „ereignis.vs.stufe“.
- **Befund:** Die Chips zeigen Stufen statt echter Größen:
  - „Mindestlohn: Stufe 50 auf 65“
  - „Gewerkschaftsrechte: Stufe 35 auf 10“
  - „Bauamnestie: Stufe 15 auf 45“
  - „Agrarsubventionen: Stufe 45 auf 57“
  - „Preiskontrollen: Stufe 20 auf 0“
- **Warum es stört:** Das verletzt Regel 5. Beim Mindestlohn gehören Lira hin, bei der Bauamnestie benannte Zustände.
- **Vorschlag:** Die Einheiten der Maßnahmenregler (`data/skalen`) auch in der Vorschau verwenden:
  - „Mindestlohn: 22.104 → 25.400 Lira“
  - „Bauamnestie: keine → befristete Amnestie“

**A-10 · Logik · Schwere 2 · Aufwand mittel**
- **Ort:** Vorschau zufälliger Antworten; `sim/ereignisse.ts:1519` (`new Rng(12345)`).
- **Befund:** Die Vorschau würfelt mit festem Samen und zeigt eines von mehreren möglichen Ergebnissen als sicher:
  - `kreis_parteitag:kaempfen`: Vorschau „Legitimität −5“, der Ausgang mit anderem Wurf aber „Der Parteitag bestätigt Sie“.
  - `korruptionsaffaere:opfern`: Die Vorschau nennt einen anderen Minister als den, der dann geht.
- **Warum es stört:** Die Vorschau verspricht Gewissheit, wo es Zufall gibt.
- **Vorschlag:** Antworten mit Zufall kennzeichnen und Spannen zeigen („Gewinnchance 65 %: bestätigt, Legitimität −1; verloren: −5“). Gerechnet wird dabei mit beiden Ausgängen.

**A-11 · Logik · Schwere 2 · Aufwand klein**
- **Ort:** Vorschau bei Personalwechseln; `ereignisse.ts:1580–1586`.
- **Befund:**
  - „Fallen lassen“ zeigt „Finanzminister Koray Bozkurt: weniger Rückhalt“ (den Nachfolger) und dazu sechs unbeteiligte Minister.
  - „Mit Dank verabschieden … ohne Groll“ zeigt bei sechs Ministern „weniger Rückhalt“.
  - Ursache: Die Kennung bleibt beim Austausch gleich, daher greift die Sperre `imAmt0` nicht.
- **Warum es stört:** Text und Vorschau widersprechen sich („ohne Groll“), und die Liste wird zur Wand.
- **Vorschlag:** Den Vergleich über Name und Kennung führen. Kabinettsweite Wirkungen als eine Zeile zeigen: „Kabinett: Rückhalt −3 bei 6 Ministern“.

**A-12 · Sinn · Schwere 2 · Aufwand mittel**
- **Ort:** Ereignisantworten ohne echte Abwägung (`dump.json`).
- **Befund:**
  - `anschlag:besonnen` kostet 2 Kapital und hat nur Plus (Vertrauen +1,5, Terror −1). Der Text „angreifbar“ hat keine Wirkung (`ereignisse.ts:597`).
  - `ruecktritt_forderung:durchhalten` kostet 3 Kapital und hat genau die Folgen der Standardfolge.
  - `recht_ernennung:loyal` ist gratis, mit Plus bei den Konservativen und nur −1 Justiz.
  - `saison_inflationsbericht:stuetzen` ist gratis und nur positiv.
- **Warum es stört:** Es gibt eine richtige Antwort, keinen Preis und keinen Verlierer.
- **Vorschlag:**
  - Jeder Antwort einen fühlbaren Preis geben. „Besonnen“ etwa: Nationalisten −2 und eine Chance auf einen Folgeanschlag.
  - Den Wächter um die Regel „Keine Antwort, die die Standardfolge oder eine andere Antwort in allen Größen dominiert“ erweitern.

**A-13 · Sinn · Schwere 2 · Aufwand mittel**
- **Ort:** Kleine Ereignisse (Erbe, Saison, Pilgerwelle, Raubgrabung, Machtwechsel).
- **Befund:** Die Wirkungen liegen bei ±0,4 bis ±1 auf Skalen bis 100:
  - Raubgrabung „schutz“: Ansehen +0,5;
  - Inflationsbericht: Märkte ±0,4 bis 1,2;
  - Machtwechsel „fordern“: USA +0,7.
  - Der Wächtertest zählt jede Änderung über 1e-6 als „Wirkung“.
- **Warum es stört:** Formal keine Schau, für den Spieler aber unmerklich („nur Show“).
- **Vorschlag:** Eine Mindestwirkung festlegen, etwa eine sichtbare Änderung einer Kennzahl oder einer Person um mindestens 2. Ereignisse, die das nicht tragen, als Meldung führen statt als Entscheidung.

**A-14 · Funktion · Schwere 2 · Aufwand mittel**
- **Ort:** `test/schau-antworten.test.ts`.
- **Befund:** Der Wächter ist grün, deckt aber Folgendes **nicht** ab:
  1. Die **15 Vorlagen, die in einer frischen Partie nicht erzeugbar sind**, werden übersprungen: `zusage`, `grossbeben`, `katastrophe_flut`, `_waldbrand`, `_duerre`, `land_fordert`, `land_angebot`, `vertrag_verlaengerung`, `land_provokation`, `land_drohkulisse`, `mil_lieferverzug`, `infra_bauunfall`, `kreis_seitenwechsel`, `kreis_enthuellung` und `kreis_putschzirkel`. Dazu kommen die Ausnahmen in `LAGE_NOETIG` (Krieg, Stichwahl, Nachfolge).
  2. Ob der **Hinweistext zur Wirkung passt** (Kapital, BIP, Richtung), siehe A-4.
  3. Die **Größe** der Wirkung, siehe A-13.
  4. Die **Dominanz** zwischen Antworten, siehe A-12.
  5. Ob ein **Folgehaken** wirklich öffnet: Er zählt schon als Wirkung, wenn er nur eingetragen ist.
  6. Die **Vorschau** (A-10, A-11).
  7. Die **Übersetzung** (A-1).
  8. Ausgenommene Felder wie `kapital`: Ein Kapitalgewinn bleibt unsichtbar (A-4, Militärrat).
- **Warum es stört:** Die grüne Ampel suggeriert mehr Sicherheit, als sie gibt.
- **Vorschlag:**
  - Für die 15 Vorlagen Lagen herstellen: Krieg setzen, Bauvorhaben starten, Machtkreis füllen.
  - Den Wächter um die Prüfungen 2 bis 7 erweitern. `dump.test.ts` und `pruef.py` im Scratchpad sind eine fertige Vorlage.

**A-15 · Sprache · Schwere 2 · Aufwand klein**
- **Ort:** Ereignistexte (Grammatik).
- **Befund:**
  - „Russland betreibt eine einflussversuch vor der wahl“ (`welt-ereignisse.ts:204`, `welt-dienst.ts:454/485/493`, `.toLowerCase()`)
  - „Beitritts von die Ukraine“ (`kat/ereignisse_aussen.json` eva.nato_ratifizierung.opt.blockieren.ausgang)
  - „Die Garantie „Garantie" ist gebrochen“ (`vermittlung.ts:515`)
  - „habe … einen Bekannten begünstigt zu haben“ (`ereignisse-personen.ts:93`)
  - „dass Verteidigungsminister Onur Doğan er in Hintergrundgesprächen“ (`:206`)
  - „Die Wähler von der dritte Kandidat“ (`ereignisse-wahl.ts:39/43`)
  - „Saudi-Arabien und Golfstaaten wird angegriffen / beruft sich / steht“
  - „an die Seite Saudi-Arabien und den Golfstaaten“
  - „Vereinigte Staaten verspricht“, „beobachtet den Kurs den Vereinigten Staaten“
  - „Smyrna (Agora) (İzmir)“
  - „niemand will sich das wiederholen“ (`ereignisse-reich.ts:106`)
  - „Von Präsidenten fallen gelassen“ (`ereignisse-personen.ts:173/228`)
  - „Kostet nichts; Kostet nichts, aber …“ (`:291`)
  - „Kostet nichts; kostet nichts; …“ (`ereignisse-vermittlung.ts:56`)
  - „Kostet 3 Kapital; Er lässt …“ (Großschreibung nach Semikolon)
- **Warum es stört:** Sichtbare Fehler zerstören die Erzählstimme.
- **Vorschlag:** Neufassungen stehen in Abschnitt 3. Länder- und Bündnisnamen über die Kasusformen (`akteurDat`, `akteurAkk`) setzen, nie `toLowerCase()` auf Titel anwenden.

**A-16 · Sprache · Schwere 2 · Aufwand klein**
- **Ort:** Geschlecht in Personentexten.
- **Befund:**
  - „der Chefredakteur Ece Keskin“ (`kat/ereignisse_innen.json` evi.pressekonflikt.text1)
  - „Ece Öztürk (Kronprinz der Partei)“, „Als Nachfolger benennen“, „der designierte Erbe“
  - Beim Finanzminister Emre Ateş: „ist etwas dran, geht sie; wenn nicht, ist sie rehabilitiert“ (`ereignisse-personen.ts:144`)
  - Prologabschluss „von Beruf Anwältin oder Anwalt“
- **Warum es stört:** Es wirkt maschinell und schlampig.
- **Vorschlag:** Für Rollen ein Feld nach Geschlecht verwenden (`{g, select, f {Chefredakteurin} other {Chefredakteur}}`). Die Berufsbezeichnung im Lebenslauf aus dem Geschlecht der Figur ableiten.

**A-17 · Konsistenz · Schwere 3 · Aufwand klein**
- **Ort:** Namenspool für Nebenfiguren (`sim/figuren.ts:343`).
- **Befund:** In einer Partie heißen der verhaftete Chefredakteur *und* die Bürgermeisterin von Adana „Ece Keskin“. Dazu kommt „Ece Öztürk“ als Kronprinz.
- **Warum es stört:** Der Spieler sucht einen Zusammenhang, den es nicht gibt.
- **Vorschlag:** Vergebene Namen partieweit sperren und den Pool vergrößern.

**A-18 · Sprache · Schwere 2 · Aufwand klein**
- **Ort:** Alle Ereignisse; `sim/figuren.ts:192–193` (`anrede`).
- **Befund:** Rolle und Name stehen ohne Artikel und Komma hintereinander:
  - „Chefin des Präsidialamts Melis Sarı rät …“
  - „Gouverneurin der Zentralbank Zeynep Işık warten …“
  - „Vorsitz der YENİ Volkan Aksoy drängt …“
  - Chip „Vorsitz der AKP Murat Kaplan: mehr Rückhalt“
- **Warum es stört:** Das ist Amtsdeutsch, jeder Satz stolpert.
- **Vorschlag:** `anrede()` liefert „Melis Sarı, die Chefin des Präsidialamts,“ im Satz. Chips zeigen nur „Murat Kaplan (AKP): mehr Rückhalt“. Aus „Vorsitz der YENİ“ wird „Vorsitzender der YENİ“.

**A-19 · Sprache · Schwere 2 · Aufwand klein**
- **Ort:** Entwickler- und Metasprache in der Oberfläche.
- **Befund:**
  - „Das Weltmodell lässt die Staaten nach ihren Amtszeiten wählen …“ (`welt-ereignisse.ts:65`, `:146`, `ereignisse-krieg.ts:153`)
  - „Die Eskalationsphase ist die Hauptspielfläche“ (`krieg_drohkulisse`)
  - „was aufgedeckt wird, legt das Spiel vor“
  - „Dokumentiert: Griechenland und Zypern …“ (`eu_veto`)
  - „(Uhr −3)“, „(Reif −)“, „15 Dienstkapazität“
  - „NATO-Gipfel (Termin zu prüfen, meist im Sommer)“ (`kat/aussen.json` aussen.termin.nato, sichtbar in 001)
  - „AP“ für Aktionspunkte (`kat/enden.json` enden.wk.*)
  - „Zum Reich“ und „Entscheidung im Reich“ (`kat/schreibtisch.json` sk.e.k.knopf, sk.ui.vfText)
  - „Rechnung des Politiknetzes“, „Ohne Spielschleife gibt es kein Briefing.“
  - „Standardfolge“ im Fristbalken
  - „Folgen unsicher: Das Spiel kann sie vorab nicht beziffern.“
- **Warum es stört:** Der Spieler fällt aus der Rolle. „AP“ ist ausdrücklich verboten (Regel 10).
- **Vorschlag:** Neufassungen stehen in Abschnitt 3. „Reich“ heißt überall „Land“, „Standardfolge“ heißt „was ohne Antwort geschieht“.

**A-20 · Sinn/Sprache · Schwere 2 · Aufwand mittel**
- **Ort:** Erzählstil der Ereignisse (Suzerain-Maßstab).
- **Befund:**
  - Statische Jahreszahlen und Statistik aus der Gegenwart des Jahres 2026 in einem Spiel ab 2028:
    - „Im August 2026 saßen 433.520 Menschen auf 304.956 Plätzen“ (Haftrevolte)
    - „2025 ergingen 74 Urteile gegen die Türkei … am 1. Juli 2026 anhängig“ (Straßburg)
    - „Seit 15. Januar 2024 zahlen ausländische Gäste 25 Euro“
    - „Göbekli Tepe zählte 2024 750.000 Besucher“
    - „Nach 2016 wurden Schätzungen zufolge …“
  - Diese Sätze kehren alle ein bis zwei Jahre wortgleich wieder.
  - Viele Titel sind Schlagworte („Streikwelle“, „Dürre“, „Mietproteste“, „Stromausfälle“). Die Antworten sind meist Verwaltungsvorgänge ohne Stimme einer Person.
- **Warum es stört:** Es liest sich wie ein Lexikon, nicht wie ein Moment. Bei der Wiederkehr wirkt es kopiert.
- **Vorschlag:**
  - Zahlen aus dem Spielstand ziehen („Heute sitzen {n} Menschen auf {plaetze} Plätzen“) oder streichen.
  - Jedem Ereignis eine Stimme mit Zitat und einem konkreten Detail geben. Beispiel Streikwelle: „‚Mein Lohn reicht bis zum Zwanzigsten‘, sagt eine Weberin in Denizli. Die Gewerkschaft Türk-İş droht mit dem Generalstreik.“
  - Zwei bis drei Textvarianten wie bei den Affären (`ereignisse.ts:357`).

**A-21 · Logik · Schwere 2 · Aufwand klein**
- **Ort:** Einzelne Ereignislogiken.
- **Befund:**
  - Ein Grenzzwischenfall mit **Georgien** wirkt auf „Beziehungen zu den Nachbarn im Nahen Osten“ (+2 / −5).
  - `korruptionsaffaere:opfern` wählt per Zufall den Innen- **oder den Außenminister** (`ereignisse.ts:407`), auch bei einem Bauauftrag. Der Spieler darf nicht wählen, wen er fallen lässt.
- **Warum es stört:** Die Ursache-Wirkungs-Kette ist unglaubwürdig, und eine Suzerain-Wahl fehlt.
- **Vorschlag:**
  - Die Beziehung zum betroffenen Land verwenden (`land_*`).
  - „Opfern“ als Auswahl der zuständigen Personen anbieten (Bauminister, Ressortchef, Parteifreund), jede mit eigenem Preis.

**A-22 · Logik · Schwere 3 · Aufwand klein**
- **Ort:** Positive Ereignisse; `ereignisse.ts:1465`.
- **Befund:** Wer eine Rekordsaison, einen Gasfund, einen Grabungsfund, den Kanal oder einen Gedenktag verstreichen lässt, verliert pauschal 0,8 Zustimmung.
- **Warum es stört:** Bei Angeboten ist Schweigen kein Versagen.
- **Vorschlag:** Den Abzug nur bei Krisen anwenden (`wettbewerb: "eskalieren"` oder `schwere ≥ 1,4`).

**A-23 · Funktion/Sprache · Schwere 2 · Aufwand klein**
- **Ort:** Mentorin und Lagehinweise (`kat/mentor.json`, `kat/schreibtischlage.json`, `kat/buehne.json`).
- **Befund:**
  - Die Texte verweisen auf „Unter ‚Personen und Zusagen‘“ und „im Fenster ‚Wähler‘“. Diese Stellen heißen heute „Kabinett & Verwaltung“ und „Gesellschaft › Wählerkoalition“.
  - „Sie können Stimmen kaufen (das kostet Kapital und schafft eine Zusage …)“: Stimmenkauf ist abgeschafft (`ereignisse.ts:1443`).
  - Derselbe Ruhetext steht zweimal: mit „Sie“ (`mentor.ruhig.short`) und mit „du“ (`buehne.json` mentor.ruhig.kurz).
- **Warum es stört:** Hinweise führen ins Leere (verletzt Regel 9).
- **Vorschlag:** Die Ziele als Knöpfe auf die Akte führen statt sie zu nennen. Den Satz zum Stimmenkauf streichen. Für die Mentorin eine Anredeform festlegen (laut ENTSCHEIDUNGEN U „du“) und die Doppelung entfernen.

**A-24 · Design · Schwere 2 · Aufwand klein**
- **Ort:** Kopfleiste › Spielerbild; `ui/kopf/Kopfleiste.tsx:68`.
- **Befund:** Die Kopfleiste zeigt einen generischen `Cameo` (schwarze Silhouette in 001 und q06) statt des im Prolog gebauten Porträts. Der Prolog verspricht aber: „Das Gesicht erscheint später im Amt“ (p01).
- **Warum es stört:** Die Mühe im Prolog verschwindet, und es entsteht keine Identifikation.
- **Vorschlag:** In der Kopfleiste `Portraet` mit `player.aussehen` verwenden; ein Klick öffnet den Lebenslauf.

**A-25 · Design · Schwere 3 · Aufwand klein**
- **Ort:** Kopfleiste › Parlament („344/600“ mit Balken).
- **Befund:** Als einzige Kennzahl hat sie keine Unterzeile. Die anderen haben „ZUSTIMMUNG“, „KAPITAL“ und so weiter.
- **Warum es stört:** Gleiches sieht nicht gleich aus, und die Zahl ist unverständlich.
- **Vorschlag:** Unterzeile „SITZE“; Mehrheit ab 301 als Strich im Balken.

**A-26 · Funktion · Schwere 2 · Aufwand klein**
- **Ort:** Meldungschips und Leistenzähler (q06, de_t06).
- **Befund:**
  - Der Chip „10 akute Probleme“ öffnet Politik › Vorschläge mit „6 Vorlagen nach Rang“, nicht die zehn Probleme.
  - Der Zähler am Schreibtisch zeigt „2“, der Schreibtisch selbst „Auf dem Tisch 7“.
  - Der Chip „Programmschritt bereit“ ließ sich im Test nicht anklicken (`klick` → null).
- **Warum es stört:** Die Zahl auf dem Knopf stimmt nicht mit dem überein, was sich öffnet.
- **Vorschlag:**
  - Der Chip öffnet die Problemliste (Politik › Bereiche, gefiltert auf akut).
  - Der Leistenzähler zählt dasselbe wie „Auf dem Tisch“, oder beide heißen „2 mit Frist“.

**A-27 · Design/Sinn · Schwere 2 · Aufwand groß**
- **Ort:** Schreibtisch (001, de_t05_1/2).
- **Befund:**
  - Die Ansicht ist 2,55 Bildschirme lang.
  - Die Kopfzeile wiederholt die Kopfleiste (Zustimmung, Kapital, Mehrheit, Inflation).
  - Es gibt sieben Eingangskörbe mit verschiedenen Namen, siehe Ansichtskarte.
  - Oben fehlt ein Bild.
  - Rechts steht ein bunter Gemischtwarenstapel: Fristen, Handlungsspielraum, Epoche, Mentorin, zwei Links.
- **Warum es stört:** Die eine Frage („Was muss ich heute tun?“) beantwortet die Ansicht nicht auf einen Blick. Das verletzt die Regeln 1, 2 und 8.
- **Vorschlag:** Skizze in Abschnitt 4, Nummer 2.

**A-28 · Design/Zahl · Schwere 2 · Aufwand klein**
- **Ort:** Schreibtisch › Zusagenkarten.
- **Befund:**
  - „Sofort: Fraktionsbereitschaft 0,0, Regierungsvertrauen 0,0.“ zeigt eine Nullwirkung als Text.
  - „Fraktionsbereitschaft +10,0“ und „Legitimität: -0,2“ haben Kommastellen bei Indizes und einen Bindestrich statt eines Minuszeichens.
  - Die gesperrte Karte „Öffentlich Rückendeckung geben … Für öffentliche Rückendeckung fehlt derzeit der Anlass.“ steht voll ausgeklappt da.
  - „Danach: 66 Loyalität beim schwächsten Vorsitz“ ist unklar.
- **Warum es stört:** Nullen wirken wie Schau, Kommastellen verstoßen gegen Regel 10, und eine gesperrte Möglichkeit nimmt Platz weg.
- **Vorschlag:** Nullwerte weglassen, Indizes ganzzahlig mit „−“ setzen. Die gesperrte Karte auf eine graue Zeile reduzieren. Neufassung: „Danach: Loyalität des Partners 66“.

**A-29 · Design · Schwere 3 · Aufwand klein**
- **Ort:** Schreibtisch › Kasten „EPOCHE DER AMTSZEIT 1“ (de_t05_1).
- **Befund:** Der Kasten hat einen eigenen Schriftschnitt (gesperrte rote Versalien mit breiter Laufweite) und Jargon: „Epochenwert 0 · noch 8 bis zur nächsten Stufe“, „Auf dem Weg zu: Gewöhnliche Amtszeit“.
- **Warum es stört:** Er sieht anders aus als alles daneben und ist unverständlich.
- **Vorschlag:** Den Kasten als Fortschrittsband „Wie die Geschichte diese Amtszeit sehen wird: gewöhnlich ··· golden“ gestalten, die Schrift wie die übrigen Kästen.

**A-30 · Design/Sprache · Schwere 2 · Aufwand mittel**
- **Ort:** Amtsantritt (q02, de_t03); `kat/antritt.json`, `sim/spiel.ts:102–104`.
- **Befund:**
  - Die Legende des Halbrunds nennt nur die Parteien des Lagers. Die blauen und violetten Oppositionsblöcke sind unbeschriftet.
  - Die Zielkacheln sind ohne Bild und ohne Balken.
  - Die Unterzeilen lauten „schwächste Provinz: Stufe 60“, „1 laufende Verträge“ (auch englisch „1 agreements“), „Terror 42, Kriminalität 45“ und „alle loyal genug“.
  - Der Maßstab erscheint nur beim Darüberfahren, das geht auf Tablets nicht.
  - Die Schwierigkeit erklärt nur „Das Spiel, wie es gemeint ist.“, obwohl im Code echte Faktoren stehen (Kapital ×1,25 / ×0,8, Krisen ×0,85 / ×1,25).
- **Warum es stört:** Die wichtigste Wahl des Spiels, die Ziele, wirkt wie ein Formular, und die Schwierigkeit ist eine Blindwahl.
- **Vorschlag:**
  - Jede Zielkachel bekommt einen Ist-Ziel-Balken („Inflation 31,5 % ▕██▏ Ziel 15 %“).
  - Die Schwierigkeit zeigt drei Zeilen mit echten Werten („Kapital je Monat: 100 % · Krisen: normal · Müdigkeit: normal“).
  - Die Oppositionsblöcke werden beschriftet.

**A-31 · Erklärung · Schwere 3 · Aufwand mittel**
- **Ort:** Einführung „So regieren Sie“ (q03).
- **Befund:** Fünf Absätze Fließtext. Die Begriffe „Aufmerksamkeit und Verwaltungskapazität“ fallen, ohne dass gesagt wird, wo sie stehen.
- **Warum es stört:** Neue Spieler lesen das nicht. Civilization 6 und Democracy 4 zeigen auf die Stellen.
- **Vorschlag:** Drei kurze Hinweisblasen, die auf die Kopfleiste (Kapital), die Leiste (Schreibtisch) und das erste Ereignis zeigen, je ein Satz und „Weiter“.

**A-32 · Bild · Schwere 2 · Aufwand groß**
- **Ort:** Ereignisszenen (`ui/ereignis/Szenen.tsx`; q04, q05).
- **Befund:**
  - Die Szenen sind grobe Flächenformen. Die Waage ist oben abgeschnitten, ein Säulenportal steht neben einem Bücherstapel, und schiefe Rechtecke sollen eingestürzte Häuser darstellen.
  - Alle Parlamentsereignisse teilen sich ein Bild, also zeigt auch der Koalitionspartner eine Justizwaage.
  - Die Bildsprache passt nicht zu den fein gezeichneten Skylines in Prolog und Einführung (q03).
- **Warum es stört:** Das Ereignis ist der Moment des Spiels, das Bild trägt ihn nicht (Leitbild Suzerain).
- **Vorschlag:** Je Themengruppe eine Federzeichnung im Stil der Einführungsskyline (Parlament, Bank, Straße, Grenze, Beben, Palast, Ausland). Dazu ein Vordergrundmotiv je Ereignis: Traktor, Mikrofon, Stacheldraht.

**A-33 · Design · Schwere 3 · Aufwand klein**
- **Ort:** Antwortkarten (q05).
- **Befund:** Alle drei Karten haben einen roten linken Rand. Die Folgechips sind gleich getönt, nur der Pfeil unterscheidet sie. Gut und schlecht sind auf einen Blick nicht zu trennen (Vermutung nach Bild; `wertungVon` setzt eine Klasse, sichtbar ist sie kaum).
- **Warum es stört:** Farbe ohne Bedeutung, und eine Bedeutung ohne Farbe.
- **Vorschlag:** Den Rand nach Preis färben (frei grün, teuer gold) und die Chips nach Wertung (grün, rot, grau).

**A-34 · Design/Logik · Schwere 3 · Aufwand mittel**
- **Ort:** Prolog (p01–p11).
- **Befund:**
  - Die linke Kartenhälfte ist leere Dekoration, die roten Umrisse bleiben unerklärt.
  - In der Station „Kindheit“ zeigt die Figur „20 Jahre“.
  - Die Bündnistexte für CHP und İYİ sind wortgleich.
  - Die Szenariokarte („Du übernimmst …“) duzt. Für den Lebenslauf ist das laut ENTSCHEIDUNGEN U gewollt, für eine Systemwahl wirkt es fremd.
  - Der Name im Abschlussblatt wird gekürzt.
  - Ein Hinweis zur Form: Die Szenen verwenden zwei Bildsprachen (Linie und Fläche).
- **Warum es stört:** Der beste Teil verliert Glanz an Kleinigkeiten.
- **Vorschlag:**
  - Die Heimat- oder Stationsprovinz auf der Karte beschriften („Konya · hier bist du aufgewachsen“).
  - Das Alter je Station folgerichtig setzen (Kindheit etwa 10 Jahre).
  - Die Bündnistexte je Partei schreiben.

**A-35 · Übersetzung/Design · Schwere 3 · Aufwand klein**
- **Ort:** Spielstand (de_t04); `ui/SpeicherDossier.tsx:62–120`.
- **Befund:**
  - Fest verdrahtete deutsche Statusmeldungen („Sichere in Slot … “, „Slot … geladen.“, „Fehler beim Lesen der Datei.“).
  - Die Begriffe „Slot“, „(.json)“ und „⌘S“ (auch unter Windows).
  - Zwei Namen für dasselbe: „Schnellspeichern“ hier, „Spielstand sichern“ im Menü.
  - Ein Stiftsymbol beim Knopf „Datei laden“.
  - Das Menü öffnet das Spielstand-Dossier *hinter* dem noch offenen Amtsantritt.
- **Warum es stört:** Es wirkt wie eine Verwaltungsmaske, und die Ebenen stimmen nicht.
- **Vorschlag:**
  - „Speicherplatz 1“, „Als Datei sichern“, Tastenkürzel nach Betriebssystem.
  - Ein Begriff „Sichern“.
  - Die Speicherplätze als Karteikarten mit Datum, Porträt und Zustimmung.

**A-36 · Möglichkeiten · Schwere 3 · Aufwand mittel**
- **Ort:** Hauptmenü ≡ und Titel.
- **Befund:**
  - Es fehlen Einstellungen (Lautstärke als Regler statt nur „Ton: an“), Tastenkürzel, Hilfe und Almanach sowie das Ändern der Schwierigkeit.
  - „Effekte der Karte“ steht doppelt (Menü und Kartenknopf).
  - Die Quellenzeile steht im Titelbild.
- **Warum es stört:** Diese Grundausstattung erwartet man von jedem Strategiespiel.
- **Vorschlag:** Einen Menüpunkt „Einstellungen“ mit Ton, Tempo-Tasten, Kartenwirkung und Schwierigkeit anlegen, „Effekte“ nur dort. Die Quellen nur unter „Quellen und Lizenzen“.

**A-37 · Funktion · Schwere 3 · Aufwand klein**
- **Ort:** Chronik bei Kommunalwahlen; `sim/kommunen.ts:97` plus `ereignisse.ts:1476`.
- **Befund:** Die Kommunalwahl steht zweimal am selben Tag in der Chronik (Bot-Lauf: „2029-03-07 kommunalwahl“ doppelt).
- **Warum es stört:** Verlauf und Chronik wirken unordentlich.
- **Vorschlag:** Nur einen Eintrag anlegen, das Ergebnis im Ausgang des Ereignisses.

**A-38 · Übersetzung · Schwere 2 · Aufwand klein**
- **Ort:** Zahlenformat in der Oberfläche.
- **Befund:**
  - `toLocaleString("de-DE")` ist fest verdrahtet in `ui/ereignis/kontext.ts:134`, `ui/schreibtisch/briefing.ts:136`, `ui/Zeitung.tsx:38` und `ui/EreignisFenster.tsx:70`. Daher steht auf Englisch „Government legitimacy +0,6“ (en_t01).
  - In `ui/Zeitung.tsx:313` stehen „Befragte“ und „Methode“ fest im Code.
- **Warum es stört:** Deutsche Kommas und Wörter in der englischen Fassung.
- **Vorschlag:** `zahl()` aus `i18n/index.ts` verwenden und die Wörter in den Katalog verschieben.

**A-39 · Sinn · Schwere 3 · Aufwand klein**
- **Ort:** Häufigkeit (`haeufig.json`).
- **Befund:**
  - In vier Jahren kommen 54 bis 61 Ereignisse, also angemessen.
  - Davon `fabrikschliessungen` 4-mal mit gleichem Aufbau (nur Firmenname wechselt) und `welt_machtwechsel` 4-mal.
  - `saison_inflationsbericht` hat nur 80 Tage Abkühlung und kann bis zu viermal im Jahr kommen (Vermutung, im Lauf einmal).
- **Warum es stört:** Bei der Wiederkehr fällt die Schablone auf.
- **Vorschlag:** Für Wiederkehrer je Vorkommen eine Steigerung erzählen („Zum dritten Mal in zwei Jahren schließt …“) und den Inflationsbericht nur bei Abweichung vom Ziel bringen.

**A-40 · Sinn · Schwere 2 · Aufwand mittel**
- **Ort:** Kapitalhaushalt in Ereignissen.
- **Befund:** Der Bot, der stets die günstigste Antwort nimmt, endet nach vier Jahren mit 103 bzw. 111 Kapital (Obergrenze 150). Ereignispreise liegen bei 1 bis 8 Kapital.
- **Warum es stört:** Vermutung: Bei Ereignissen fehlt der echte Verzicht, weil Kapital selten knapp ist. Die Abwägung läuft dann nur über die Folgen.
- **Vorschlag:** Mit echten Spielern messen. Gegebenenfalls Ereignispreise an das Einkommen koppeln (Anteil statt fester Zahl) oder Kapital und Zeit (Aufmerksamkeit) gemeinsam verlangen.

**A-41 · Sprache · Schwere 3 · Aufwand klein**
- **Ort:** Verlauf (002).
- **Befund:**
  - „Sechs, zwölf und vierundzwanzig Monate nach einem Beschluss schaut das Spiel nach, was sich getan hat.“
  - „Ein Gesetz ist noch keine Wirkung.“
  - Die ganze Seite ist grau-kursiv und ohne Bild.
- **Warum es stört:** Die Seite ist leer und blass und verlässt die Rolle.
- **Vorschlag:** Den leeren Zustand mit einer Zeitleiste und Platzhaltermarken („6 Monate · 12 · 24“) zeigen. Neufassung: „Nach sechs, zwölf und vierundzwanzig Monaten prüft Ihr Stab, was ein Beschluss bewirkt hat.“

**A-42 · Logik · Schwere 3 · Aufwand klein**
- **Ort:** Haushaltsfenster (`evi.haushaltsjahr.text1`).
- **Befund:** Der Text sagt „Vier Wochen lang stellen Sie die Regler …“, die Frist beträgt aber 25 Tage.
- **Warum es stört:** Die Zahl stimmt nicht.
- **Vorschlag:** „{n} Tage lang …“ aus der Frist setzen.

**A-43 · Konsistenz · Schwere 3 · Aufwand klein**
- **Ort:** Preisformeln der Antworten.
- **Befund:** Dieselbe Aussage steht in fünf Formen:
  - „Kostet nichts; …“
  - „Keine Kosten. …“
  - „Kein Preis heute; …“
  - „Auszählen lassen; …“ (ganz ohne Preis)
  - „Export +, Industrie +, Investitionen +, …“ (eu_zollunion, im Telegrammstil)
  - Dazu „Kostet 3 Kapital“ mal mit, mal ohne „etwa“ und mal „0,12 Prozent des BIP“ statt „% des BIP“.
- **Warum es stört:** Gleiches sieht nicht gleich aus.
- **Vorschlag:** Nur `beschr()` zulassen und den Preis außerhalb des Texts setzen (siehe A-7).

---

## 3. Wortprüfung (Schlüssel bzw. `datei:zeile`: alt → neu)

**Anrede und Stil**
- `sim/figuren.ts:193` anrede: „Chefin des Präsidialamts Melis Sarı rät …“ → „Melis Sarı, die Chefin des Präsidialamts, rät …“
- Rolle „Vorsitz der YENİ“ → „Vorsitzender der YENİ“ bzw. „Vorsitzende der YENİ“
- Chip `ereignis.vs.rueckhalt`: „{rolle} {name}: mehr Rückhalt“ → „{name}: mehr Rückhalt“ (die Rolle steht im Tooltip)
- `ereignis.frist`: „Ohne Entscheidung greift in # Tagen die Standardfolge.“ → „Noch # Tage. Danach geschieht, was unter ‚Ohne Antwort‘ steht.“
- `ereignis.folgenUnsicher`: „Folgen unsicher: Das Spiel kann sie vorab nicht beziffern.“ → „Die Folgen zeigen sich erst später.“
- `ereignis.standardHinweis`: „… Schweigen kostet zudem Zustimmung.“ → „… Schweigen kostet zusätzlich 0,8 Punkte Zustimmung.“
- `sim/ereignisse.ts:1188`: „Abwarten und nichts tun“ → Katalogschlüssel `ereignis.abwarten` = „Bewusst abwarten“

**Grammatik**
- `welt-ereignisse.ts:204`: „betreibt eine einflussversuch vor der wahl“ → „versucht, die Wahl in der Türkei zu beeinflussen“
- `eva.nato_ratifizierung.opt.blockieren.ausgang`: „des Beitritts von {land}“ → „des Beitritts {gen}“ (Genitiv: „der Ukraine“)
- `sim/vermittlung.ts:515`: „Die Garantie „{label}" ist gebrochen“ → „Ankaras Garantie ist gebrochen“ (ohne Bezeichnung, wenn sie gleich „Garantie“ wäre). Dazu die Anführungszeichen „…“ einheitlich setzen.
- `ereignisse-personen.ts:93`: „habe bei einer Ausschreibung … begünstigt zu haben“ → „habe bei einer Ausschreibung des Ministeriums einen Bekannten begünstigt“
- `ereignisse-personen.ts:206`: „dass {wer} {er} in Hintergrundgesprächen als die bessere Wahl …“ → „dass {wer} sich in Hintergrundgesprächen als die bessere Wahl …“
- `ereignisse-personen.ts:144`: „ist etwas dran, geht sie; wenn nicht, ist sie rehabilitiert“ → „Ist etwas dran, muss {er} gehen; wenn nicht, ist {er} entlastet.“
- `ereignisse-personen.ts:173/228`: „Von Präsidenten …“ → „Vom Präsidenten …“
- `ereignisse-personen.ts:291`: „Kostet nichts, aber die Geschichte wächst.“ (wird zu „Kostet nichts; Kostet nichts, …“) → „Die Geschichte wächst.“
- `ereignisse-vermittlung.ts:56`: „kostet nichts; die Spoiler lesen es als Freibrief (Reif −).“ → „Die Störer lesen es als Freibrief; die Lage wird unreifer.“
- `ereignisse-vermittlung.ts` daempfen: „… ohne dass jemand das Gesicht verliert — kostet Kapital.“ → „… ohne dass jemand das Gesicht verliert.“
- `ereignisse-wahl.ts:39`: dritteName „der dritte Kandidat“ → „des dritten Kandidaten“ (Genitiv), oder `wahl.ereignis.stichwahl.text2` als „Die Wähler {gen} …“
- `ereignisse-krieg.ts`: „Saudi-Arabien und Golfstaaten wird angegriffen“ → „Saudi-Arabien und die Golfstaaten werden angegriffen“; „beruft sich“ → „berufen sich“
- Pakt „Beistandspakt von Mekka“ und „Mekka-Pakt“ → einheitlich „Mekka-Pakt“
- „Die Klausel im Wortlaut: Kollektivverteidigungsklausel: …“ → „Die Klausel: Ein Angriff auf einen gilt als Angriff auf alle.“
- `welt-ereignisse.ts`: „beobachtet den Kurs den Vereinigten Staaten“ → „beobachtet den Kurs der Vereinigten Staaten“
- „Vereinigte Staaten verspricht“ → „Die Vereinigten Staaten versprechen“
- „Washington hat eine neue Führung. Die neue Führung hält …“ → „In Washington regiert eine neue Führung; sie hält …“
- `ereignisse-reich.ts:106`: „niemand will sich das wiederholen“ → „das soll sich nicht wiederholen“
- `erbe_erdbebenschaden` Titel: „Nachbeben: Schäden an Smyrna (Agora)“ → „Ein Beben beschädigt die Agora von Smyrna“
- Text „bei Smyrna (Agora) (İzmir)“ → „an der Agora von Smyrna in İzmir“
- „Stärke fünf“ → „Stärke 5“
- `kat/schreibtisch.json` sk.w.sturz.warum: „Nach {m} Monaten in Folge enden Massenproteste die Amtszeit.“ → „Nach {m} Monaten in Folge beenden Massenproteste die Amtszeit.“
- `kat/takt.json` takt.bericht.beobachtet: „{monate}-Monats-Rückblick am“ → „Rückblick nach {monate} Monaten, am {datum}“
- `enden.krankheit.offen_ausgang` im Fenster ohne Schlusspunkt („… abgeschlossen“) → Schlusspunkt setzen (der Text wird abgeschnitten; prüfen, ob die Vorlage gekürzt wird)

**Geschlecht und Plural**
- `evi.pressekonflikt.text1`: „der Chefredakteur {chef}“ → „{chef, select, f {die Chefredakteurin} other {der Chefredakteur}} {name}“
- `kat/machtkreis.json` mk.rolle.kronprinz: „Kronprinz der Partei“ → „{g, select, f {Kronprinzessin} other {Kronprinz}} der Partei“ (ebenso „Als Nachfolger benennen“, „der designierte Erbe“)
- `prolog.st.beruf.anwalt.label` im Abschlussblatt: „von Beruf Anwältin oder Anwalt“ → je nach Geschlecht „Anwältin“ bzw. „Anwalt“
- Zielkachel „1 laufende Verträge“ → „{n, plural, one {# laufender Vertrag} other {# laufende Verträge}}“ (en: „1 agreements“ → „{n, plural, one {# agreement} other {# agreements}}“)
- „Ece Keskin“ doppelt vergeben → Namen partieweit sperren (A-17)

**Interne Kürzel und Metasprache**
- `welt-ereignisse.ts:65` warum: „Das Weltmodell lässt die Staaten nach ihren Amtszeiten wählen …“ → „Auch andere Länder wählen und stürzen Regierungen; ein Wechsel verändert, was Ankara von ihnen erwarten kann.“
- `welt-ereignisse.ts:146`: „Das Weltmodell lässt Staaten bei hoher Inflation … in Krisen geraten …“ → „Hohe Inflation, Schulden und Unruhe stürzen Länder in die Krise; die Nachbarn spüren es zuerst.“
- `ereignisse-krieg.ts:153`: „… Das Weltmodell lässt Staaten gegeneinander in den Krieg gehen; …“ → „Ein Pakt wird erst im Ernstfall geprüft; jetzt ist er da.“
- krieg_drohkulisse warum: „Die Eskalationsphase ist die Hauptspielfläche: …“ → „Jetzt entscheidet sich, wer die Lage bestimmt: Wer vorbereitet ist und eine klare Linie fährt, zahlt später weniger.“
- Text „Das vollständige Dossier steht in der Welt-Ansicht.“ → Knopf „Lage mit Griechenland öffnen“
- krieg_waffenruhe ablehnen: „(Uhr −3)“ → „die Heimatfront hält es aus, aber sie wird müder“
- welt_einfluss warum: „… was aufgedeckt wird, legt das Spiel vor.“ → „… nicht alles wird entdeckt.“
- „15 Dienstkapazität“ → „bindet ein Siebtel des Nachrichtendienstes“ (oder Kapazität in Prozent)
- eu_veto warum: „Dokumentiert: Griechenland und Zypern nutzen …“ → „Griechenland und Zypern nutzen …“
- eu_zollunion warum: „Das Mandat kommt mit 3 vorläufig geschlossenen Kapiteln in Reichweite.“ → „Drei abgeschlossene Kapitel haben das Angebot möglich gemacht.“
- eu_zollunion annehmen: „Export +, Industrie +, Investitionen +, …“ → „Export, Industrie und Investitionen gewinnen, der Risikoaufschlag sinkt um 40 Punkte; die Landwirtschaft verliert ihren Zollschutz.“
- `kat/aussen.json` aussen.termin.nato: „NATO-Gipfel (Termin zu prüfen, meist im Sommer)“ → „NATO-Gipfel (Sommer)“
- `kat/enden.json` enden.wk.*: „{ap} AP“ → „{ap} Wahlkampftage“ bzw. „Aktionspunkte“ ausgeschrieben (enden.wk.auftritt.allein.log, gemeinsam.log, ui.kosten, ui.duell_text)
- `kat/schreibtisch.json` sk.e.k.knopf: „Zum Reich“ → „Zur Kulturakte“
- sk.ui.vfText: „Entscheidung im Reich“ → „Entscheidung über ein Bauvorhaben“
- `vermaechtnis.kap.reich`: „Das Reich“ → „Was gebaut wurde“
- sk.ui.keinBriefing: „Ohne Spielschleife gibt es kein Briefing.“ → „Noch keine Lage.“
- `mf.nutzen.fuss`: „Rechnung des Politiknetzes bei sonst unveränderter Wirtschaftslage.“ → „Geschätzt, wenn sonst alles gleich bleibt.“
- `ereignis.vs.stufe`: „{name}: Stufe {von} auf {auf}“ → mit der Einheit des Reglers: „{name}: {von} → {auf}“ („Mindestlohn: 22.100 → 25.400 Lira“, „Bauamnestie: keine → befristet“)
- `epoche.ui.bis`: „noch {n} bis zur nächsten Stufe“ → „noch {n} Punkte bis zu einer goldenen Amtszeit“
- Verlauf: „… schaut das Spiel nach, was sich getan hat. Ein Gesetz ist noch keine Wirkung.“ → „… prüft Ihr Stab, was ein Beschluss bewirkt hat. Ein Gesetz wirkt nicht am Tag der Abstimmung.“
- „Vereinfachte Karte: Dieses Gerät zeigt keine 3D-Grafik.“ → in Ordnung (nur ohne WebGL sichtbar)

**Verweise auf alte Stellen**
- `mentor.partner-wackelt.more`: „Unter ‚Personen und Zusagen‘ sehen Sie …“ → „Unter Kabinett & Verwaltung › Zusagen sehen Sie …“ (mit Knopf)
- `mentor.waehler-verstimmt.more`: „steht im Fenster ‚Wähler‘“ → „steht unter Gesellschaft › Wählerkoalition“
- `mentor.mehrheit.more`: „Sie können Stimmen kaufen (das kostet Kapital …)“ → „Gespräche mit Fraktionen, Duldungen und Bündnisse schaffen Stimmen; Partner melden sich mit Angeboten.“
- `sl.partner.hilfe`: „Prüfen Sie unter Personen und Zusagen …“ → „Prüfen Sie unter Kabinett & Verwaltung › Zusagen …“
- `kat/buehne.json` mentor.ruhig.kurz (du) und `mentor.ruhig.short` (Sie): eine Fassung behalten

**Ereignistexte: Lexikon statt Moment**
- recht_haftrevolte: „Im August 2026 saßen 433.520 Menschen auf 304.956 Plätzen, 65.227 davon in Untersuchungshaft.“ → „Die Gefängnisse sind zu {anteil} Prozent belegt; jeder Siebte sitzt in Untersuchungshaft.“ (aus dem Spielstand)
- recht_egmr: „2025 ergingen 74 Urteile …; 22.566 Beschwerden waren am 1. Juli 2026 anhängig.“ → „Es ist das {n}. Urteil gegen die Türkei in Ihrer Amtszeit.“
- erbe_hagia_sophia: „Seit 15. Januar 2024 zahlen ausländische Gäste 25 Euro.“ → streichen oder „Ausländische Gäste zahlen Eintritt.“
- erbe_fund: „Göbekli Tepe zählte 2024 750.000 Besucher; …“ → „Seit Göbekli Tepe weiß jeder, was ein Fund für eine Region bedeuten kann.“

**Spielstand (`ui/SpeicherDossier.tsx`)**
- `:63` „Sichere in Slot {n} …“ → Katalog `st.slot.sichert` = „Sichere auf Speicherplatz {n} …“
- `:77` „Slot {n} geladen.“ → „Speicherplatz {n} geladen.“
- `:100` „Spielstand als JSON-Datei heruntergeladen.“ → „Spielstand als Datei gesichert.“
- `:117` und `:120` in den Katalog verschieben
- Knopf „Als Datei sichern (.json)“ → „Als Datei sichern“
- Knopf „Schnellspeichern“ → „Jetzt sichern“ (gleich wie im Menü)

**Sonstiges**
- Titel `titel.quellen`: „Wirtschaftsdaten vom … · Karte nach …“ → nur „Karte: Natural Earth, AWS Terrain, OpenStreetMap · Verwerfungen: GEM (CC BY-SA 4.0)“; das Datendatum unter „Quellen und Lizenzen“
- Einführung „Gewählt wird in etwa 5 Jahren.“ → „Die nächste Wahl ist am {datum}.“
- Schreibtisch: „Zeit gewinnen · mit politischem Preis“ → „Vertrösten (kostet Vertrauen)“
- Schreibtisch: „Danach: 66 Loyalität beim schwächsten Vorsitz“ → „Danach: Loyalität des Partners 66“
- `sk.ui.mappe` „Unterschriftenmappe“, „Auf dem Tisch“, `mf.weitere` „Posteingang der Minister“, `sk.ui.umlauf` „Im Umlauf“ → ein Begriff: „Auf dem Tisch“; der Rest als Filter „mit Frist / Vorschläge / Routine“

---

## 4. Die fünf wichtigsten Verbesserungen

**1. Alle Ereignisse in den Katalog und dreisprachig (A-1, A-38).** Das ist die größte Wirkung, denn heute sieht ein englischer Spieler bei jedem zweiten Ereignis Deutsch.

```
sim/ereignisse.ts   titel: () => t("ev.erdbeben.titel", { ort })
wächter            dump_en: kein deutsches Funktionswort in Titel/Text/Label/Beschreibung
```

**2. Schreibtisch als eine Seite mit einem Bild (A-3, A-26, A-27, A-28).**

```
┌ 5. Juni 2028 ───────────── [ Tagesuhr: 3 Fristen diese Woche ] ┐
│  ○──●──○──○──○  Zeitstrahl der nächsten 30 Tage (Fristen als   │
│                 Marken, Farbe nach Dringlichkeit; Klick = Akte)│
├─────────────────────────────────────────────────────────────────┤
│ AUF DEM TISCH (7)   [mit Frist 2] [Vorschläge 4] [Routine 1]    │
│ ▸ YENİ fordert zwei Ministerien     4 Kap.   in 30 Tagen   ›   │
│ ▸ Wiederaufbau im Erdbebengebiet    0–6 Kap. in 30 Tagen   ›   │
│ ▸ Haushaltskurs                     –        ohne Frist    ›   │
└─────────────────────────────────────────────────────────────────┘
```

- Die Kopfzahlen entfallen, denn sie stehen in der Kopfleiste.
- Jede Sache steht einmal, also nicht Zusagenkarte und Ereignis nebeneinander.
- Ein Klick öffnet die Sache im Ereignisfenster.
- Handlungsspielraum, Epoche und Mentorin rücken als drei kleine Ringe in eine Zeile unter dem Zeitstrahl.
- Höchstens 1 Bildschirm.

**3. Ehrliche Preise und Folgen in den Antworten (A-4, A-5, A-7, A-9, A-10, A-12).**
- Der Preis wird gemessen statt geschrieben und als Plakette gesetzt („6 Kapital · 0,4 % BIP · startet Bauvorhaben“).
- Der Text enthält nur die Folge.
- Die Chips sind in echten Einheiten (Lira, benannte Zustände), nach Wertung gefärbt, und bei Zufall stehen Spannen („65 %: …“).
- Der Wächter bekommt die Prüfungen „Text gleich Code“ und „keine dominierte Antwort“ dazu.

```
┌ Zur Chefsache machen ─────── [6 Kapital · 0,4 % BIP] ┐
│ Schnell gebaut, anfällig für Korruption.              │
│ ▲ Wohnungsnot −1  ▲ Vertrauen +2  ▼ Korruption +2     │
└───────────────────────────────────────────────────────┘
```

**4. Ereignisse als erzählte Momente (A-2, A-15 bis A-20, A-32).**
- Je Themengruppe eine Federzeichnung im Stil der Einführungsskyline.
- Ein Sprecher, der zum Thema gehört.
- Ein Zitat mit einem konkreten Detail statt Statistik.
- Saubere Grammatik und Geschlechtsformen.
- Zwei bis drei Varianten für Wiederkehrer.
- Personalereignisse nennen die richtige Person und lassen bei „Opfern“ wählen, wen.

Beispiel:

```
[Bild: Bauarbeiter vor Rohbau, Kran]  „Wir haben noch 3.000 Container in Hatay.“
– Melis Sarı, Chefin des Präsidialamts
```

**5. Ein Einstieg, der zeigt statt erklärt (A-24, A-30, A-31, A-34).**
- Das Prologgesicht bleibt in der Kopfleiste.
- Die Zielkacheln bekommen Ist-Ziel-Balken.
- Die Schwierigkeit zeigt echte Faktoren.
- Die Oppositionsblöcke im Halbrund sind beschriftet.
- Statt der Textwand „So regieren Sie“ kommen drei Zeigeblasen: Kapital in der Kopfleiste → „Auf dem Tisch“ → erstes Ereignis.
- Im Prolog beschriftet die Karte die Heimat.

```
Inflation unter 15 %   31,5 % ▕████████▏────── 15 %
Kapital je Monat  Entspannt 125 % · Normal 100 % · Hart 80 %
```

---

**Nicht geprüft:**
- Das Bild des Spielendes und des Vermächtnisses (nur die Texte).
- Die Ereignisse in laufenden Lagen (Krieg, Stichwahl, Nachfolge) im Fenster; nur die Texte im Rückfallzustand.
- Die Karte mit 3D-Grafik: Der kopflose Browser lief ohne WebGL.
- Die türkische Fassung ist nur maschinell auf deutsche Reste geprüft, nicht auf ihre Güte.
- `lernen.ts` und `Meldungen.tsx` habe ich nicht im Detail gelesen.
- Tempo: Beim schnellsten Tempo lief in 6 Sekunden nur ein Tag. Ob das am Autostopp bei offenen Ereignissen liegt, ist nicht geklärt (Vermutung).
