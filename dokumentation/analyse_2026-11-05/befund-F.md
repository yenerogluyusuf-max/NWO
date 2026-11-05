# Befund F: Land und Regionen, Forschung & Ziele

Prüfer F, 5. November 2026. Grundlage sind die Rundgangbilder 025 bis 034, eigene kopflose Aufnahmen aller Unterreiter (Ordner `scratchpad/analyse-F/bilder/`, Schnellstart, 1440 × 900, Deutsch und einmal Englisch), eine Messung der Startwelt im Browser (`scratchpad/analyse-F/sim.cjs`) und der Code unter `game/src/ui/{Reich.tsx, reich/, infrastruktur/, katastrophe/, Katastrophe.tsx, akte/Bereiche.tsx, akte/Bildkarten.tsx, fokus/, wissen/, grosseziele/, politik/ProgrammeAkte.tsx, ProvinceCard.tsx, OrtWahl.tsx}` sowie `sim/{reich, infrastruktur, katastrophe, fokus, programme, grosseziele, handeln}.ts`.

Wichtig vorab: Der Rundgang misst je Akte nur den ersten Unterreiter. Die längsten Seiten meines Bereichs hat er deshalb nicht gesehen. Eigene Messung (Höhe in Bildschirmen / Wörter): **Infrastruktur › Neue Vorhaben 15,9 / 3.466**, **Kultur › Stätten pflegen 9,4 / 2.306**, Kultur › Neue Vorhaben 4,5 / 696, Infrastruktur › Bauwerke pflegen 2,9 / 900.

Was gut ist und bleiben soll:
- Die **Netze** (026) sind das beste Beispiel für „eine Frage, ein Bild“: Ringe mit Marken bei 85 und 100 %, Karte nach Auslastung, rechts der Ort mit „115 % → 88 %“, Preis und Bauen.
- Die **Katastrophen-Vorsorge** (028) beantwortet die Frage „Was richtet ein Fall an, und was bringt Vorsorge?“ mit Gefahrenringen, Karte und dem Vergleich „Ohne Vorsorge / Heute / Bei Bereitschaft 80“. Das ist echte Ursache und Wirkung.
- Die **Baustelle** mit ehrlicher Reihenfolge, Schätzung „fertig in etwa 15 Monaten“ und dem wachsenden Gerüst im WunderBild.
- Das **Fokus-Blatt** mit Voraussetzung, Sprung und Direktknopf („Voraussetzungen verlinken“ ist hier vorbildlich umgesetzt).
- Die **Großen Ziele** zeigen die Chance als Band mit „Dafür“ und „Dagegen“.
- Fast jedes Vorhaben nennt „Der Preis“ und „Es verliert“.

---

## 1. Ansichten

**Land › Infrastruktur und Bau › Lage (025)**
- Frage: Was wird gebaut, und reicht meine Baukapazität?
- Antwort: teilweise. Die Kapazitätsleiste zeigt nur Farbblöcke mit den Ziffern 1 bis 5. Namen stehen nur im Tooltip, und die Farben bedeuten nichts außer der Position.
- Länge: 2,7 Bildschirme.
- Noten: Schönheit 3, Verständlichkeit 3, Sinn 3, Spielgefühl 3.
- Urteil: Gute Produktionsschlange mit Bild, aber darunter folgen Pflege, Vorteile und ein Hinweisblock. Kampfjets und Panzer stehen in der Baustelle des Landes.

**Land › Infrastruktur und Bau › Bauwerke pflegen (eigene Aufnahme)**
- Frage: Was verfällt, und wo lohnt Instandsetzen?
- Antwort: nein, es gibt kein Bild oben, nur zwei Spalten großer Karten.
- Länge: 2,9 Bildschirme.
- Noten: 3, 3, 3, 4.
- Urteil: Jede der acht Karten wiederholt dieselben zwei Sätze. Die Instandsetzung selbst ist sinnvoll beschrieben.

**Land › Infrastruktur und Bau › Neue Vorhaben (eigene Aufnahme)**
- Frage: Was kann ich jetzt in Auftrag geben?
- Antwort: nein. Voreingestellt ist „Alles 77“, die zwölf „Programme für Regionen“ stehen voll aufgeklappt untereinander, und das Detailfeld rechts bleibt leer.
- Länge: 15,9 Bildschirme.
- Noten: 3, 4, 3, 4.
- Urteil: Der Katalog hat die Substanz eines Civ-6-Bauamts, liest sich aber wie ein Aktenordner.

**Land › Netze (026)**
- Frage: Wo sind meine Netze überlastet, und was hilft?
- Antwort: ja.
- Länge: 1,23 Bildschirme.
- Noten: 2, 2, 2, 2.
- Urteil: Die stärkste Ansicht des Bereichs. Sie wird getrübt durch „Stufe 0“, „18.5“ und drei weitere Arten von „Programm“.

**Land › Kultur und Erbe › Lage (027)**
- Frage: Wie steht es um das Erbe, und was ist in Gefahr?
- Antwort: teilweise. Es fehlt eine Karte der Stätten, und es stehen zwei verschiedene Erhaltungszahlen da (55 und 64).
- Länge: 1,7 Bildschirme.
- Noten: 3, 3, 4, 4.
- Urteil: Die drei schlechtesten Stätten sind gut gewählt. Ihre Wirkung, „+0,3 in 1 Provinz“, ist aber so klein, dass der Knopf fast nur Schau ist.

**Land › Kultur und Erbe › Stätten pflegen (eigene Aufnahme)**
- Frage: Welche Stätte restauriere ich?
- Antwort: nein.
- Länge: 9,4 Bildschirme (53 Karten offen).
- Noten: 3, 3, 4, 4.
- Urteil: Das ist eine Liste, keine Übersicht. Jede Karte sagt „Kulturerbe in dieser Provinz: 55 von 100“, in jeder Provinz derselbe Wert.

**Land › Kultur und Erbe › Neue Vorhaben (eigene Aufnahme)**
- Frage: Welches Kulturprojekt beginne ich?
- Antwort: teilweise.
- Länge: 4,5 Bildschirme.
- Noten: 3, 3, 3, 3.
- Urteil: Wunder, Routen und Ausbauten haben keine Bilder. Die Kacheln zeigen „0 % BIP“ auch bei echter Schuld.

**Land › Katastrophen und Wiederaufbau › Lage und Vorsorge (028)**
- Frage: Was droht, und was bringt Vorsorge?
- Antwort: ja.
- Länge: 2,5 Bildschirme.
- Noten: 2, 2, 2, 2.
- Urteil: Ein gutes Bild mit echter Modellrechnung. Darunter stehen fünf Vorsorgekarten mit Schein-Reglern und „Stufe 40“.

**Katastrophen › Laufende Fälle / Versprechen / Chronik (eigene Aufnahmen)**
- Frage: Was ist zu tun? Was habe ich zugesagt?
- Antwort: Ohne Fall nur ein Leerzustand mit Rücksprung. Das ist ordentlich.
- Länge: je 1,0 Bildschirm.
- Noten: 3, 2, –, 3.
- Urteil: Diese Ebene ist die dritte und vierte Navigationsebene. Die Fallabwicklung selbst konnte ich nicht prüfen.

**Land › Lage der Regionen (029)**
- Frage: Wie steht es um die Regionen?
- Antwort: nein. Es gibt weder eine Region noch eine Karte noch eine Provinzrangliste.
- Länge: 1,7 Bildschirme.
- Noten: 3, 4, 4, 4.
- Urteil: Die Seite wiederholt Neue Vorhaben (Bildkarten) und die Baustelle („seit Spielbeginn“ viermal). Ihr Knopf führt zur zuletzt offenen Ansicht statt zur Ursache.

**Karte › Provinzblatt (eigene Aufnahme, Adıyaman)**
- Frage: Wie steht diese Provinz da, und was kann ich hier tun?
- Antwort: teilweise.
- Länge: Spalte mit Scrollbalken.
- Noten: 3, 3, 4, 4.
- Urteil: Echte Daten (km, Kliniken, Rathaus) stehen neben flachen Spielwerten. „Hier bauen oder fördern …“ führt ins Wirkungsnetz der Politik statt in die Land-Akte.

**Forschung & Ziele › Fokusbaum (030)**
- Frage: Welchen Weg schlägt meine Regierung ein?
- Antwort: nein. Die Namen sind in jeder Zoomstufe abgeschnitten („Gezielte K…“, „Gesellschaf Pakt“), und die Startansicht schneidet Äste ab.
- Länge: 1,06 Bildschirme.
- Noten: 4, 4, 2, 3.
- Urteil: Gute Mechanik mit Gegenwegen, Voraussetzungen und Abbruch. In der Darstellung ist der Baum aber nicht lesbar.

**Fokusbaum › Blatt (eigene Aufnahme)**
- Frage: Was kostet und bringt dieser Fokus?
- Antwort: ja.
- Noten: 2, 2, 3, 3.
- Urteil: Klar aufgebaut. Der Knopf „Fokus beginnen“ ist aber blass und kaum lesbar, und die ersten Foki haben keinen Verlierer.

**Forschung & Ziele › Große Ziele (031)**
- Frage: Welches Fernziel verfolge ich, und wie gut stehen die Chancen?
- Antwort: ja, je Karte.
- Länge: 3,0 Bildschirme (13 große Karten).
- Noten: 2, 3, 2, 3.
- Urteil: Schöne Blaupausen und ehrliche Chancen. Es fehlt die Übersicht auf einem Bildschirm, und „Aussicht aussichtsreich“ ist eine Tautologie.

**Forschung & Ziele › Wissensbaum (032) und Baumfenster**
- Frage: Was wird erforscht, was kommt als Nächstes?
- Antwort: ja.
- Länge: 1,0 Bildschirm.
- Noten: 3, 2, 3, 3. Für das Baumfenster: Schönheit 3, weil es eine völlig andere, dunkle Bildsprache hat.
- Urteil: Die kompakte Lage gefällt. Unter „Forschung“ laufen aber Kampfpanzer und Luftabwehr, die zugleich in der Baustelle stehen.

**Forschung & Ziele › Programme (033)**
- Frage: Welcher Mehrjahresplan ist als Nächstes dran?
- Antwort: teilweise. Die Zähler oben stimmen, aber die acht Karten stehen offen untereinander.
- Länge: 3,5 Bildschirme.
- Noten: 3, 3, 3, 4.
- Urteil: Gut lesbare Schritte, doch es ist das dritte Ding namens „Programm“. Der erste Schritt „Haushaltsdisziplin verkünden“ ist eine Gratisgabe.

**Forschung & Ziele › Stand der Agenda (034)**
- Frage: Woran arbeitet meine Regierung?
- Antwort: teilweise.
- Länge: 1,1 Bildschirme.
- Noten: 4, 4, 4, 4.
- Urteil: Die Seite wiederholt nur, was die vier Reiter zeigen. Am ersten Tag nennt sie „Foki vollendet: 0“ einen auffälligen Mangel.

---

## 2. Befunde

Schwere: 1 = bricht Sinn oder Spiel, 2 = deutlich störend, 3 = Feinschliff.

**F-1 · Neue Vorhaben ist 16 Bildschirme lang**
- Ort: Land › Infrastruktur und Bau › Neue Vorhaben. `ui/reich/Neues.tsx:136-140` (Vorlagen als volle `VorlageKarte`, Rest als Kachel), `:157-166` (Standard „alle“).
- Art: Design
- Befund: Es sind 15,9 Bildschirme und 3.466 Wörter. Standard ist „Alles 77“. Die zwölf „Programme für Regionen“ stehen mit Ortswahl, Kosten, Wirkung und Kehrseite ganz offen da. Rechts steht dauerhaft „Wählen Sie links ein Vorhaben: Hier stehen dann Wirkung, Voraussetzungen, Vergabe und der Knopf zum Beginnen.“
- Warum es stört: Der Spieler sucht ein Bauwerk und scrollt durch eine Akte. Das ist das Gegenteil der Civ-6-Bauliste.
- Vorschlag: Standard ist „Jetzt bereit“, getrennt nach Thema. Auch die Vorlagen werden Kacheln, die volle Karte steht nur rechts. Ziel sind höchstens 1,5 Bildschirme (siehe Verbesserung 1).
- Schwere: 1
- Aufwand: mittel

**F-2 · Fokusbaum ist unlesbar**
- Ort: Forschung › Fokusbaum. `ui/fokus/Fokusbaum.tsx:20-21` (Karte 120 × 52), `:309` (`FOKUS_MIN_MASSSTAB = 0.6`)
- Art: Design
- Befund: In Startansicht, „Ganzer Baum“ und „Vollbild“ sind fast alle Namen abgeschnitten: „Nationale Wirtschafts…“, „Rückkehr zur…“, „Gesellschaf Pakt“. Die Startansicht schneidet links „…LLSCHAFT & KULTUR“ und rechts „WISSENSCHAFT & ZUK…“ ab. Der Mindestmaßstab verhindert, dass der ganze Baum passt, und der Text passt trotzdem nicht in die Karte.
- Warum es stört: Der Spieler kann die Hauptansicht der Agenda nicht lesen, ohne jede Karte einzeln anzufahren.
- Vorschlag: Karten 168 × 64 mit zwei Zeilen und Ikone. Im fernen Maßstab nur Ast-Medaillen mit Zähler zeigen, ein Klick zoomt auf den Ast. „Ganzer Baum“ zeigt die sieben Äste als Kacheln (siehe Verbesserung 2).
- Schwere: 1
- Aufwand: mittel

**F-3 · Neue Aufträge springen gratis an die Spitze**
- Ort: Baustelle. `sim/reich.ts:768` (`z.laufend.unshift` mit dem Kommentar „Was der Präsident eben beschlossen hat, kommt an die Spitze“), dazu `:814` und `:831-833` (Vorziehen kostet 10 Verwaltungskraft je Platz)
- Art: Logik
- Befund: Ein neues Vorhaben verdrängt kostenlos alle laufenden, auch das Kernkraftwerk Akkuyu kurz vor Fertigstellung. Wer dagegen ein laufendes Vorhaben um einen Platz vorzieht, zahlt 10 Verwaltungskraft.
- Warum es stört: Der Preis am Knopf ▲ lässt sich umgehen. Die angezeigte Schätzung „fertig in etwa 15 Monaten“ wird durch jeden neuen Auftrag still falsch.
- Vorschlag: Neue Aufträge kommen ans Ende. Am Knopf „Beginnen“ steht als Wahl „ans Ende“ (frei) oder „an die Spitze (−N Verwaltungskraft, verdrängt: Akkuyu)“.
- Schwere: 1
- Aufwand: klein

**F-4 · Begonnenes lässt sich nicht beenden, Pausieren ist gratis**
- Ort: Baustelle und Kartenmarke. `sim/reich.ts:806-811` (`pausiere` ohne Folgen). Es gibt keine Funktion zum Abbrechen in `sim/reich.ts` oder `ui/reich/`. Katalog `karte.json` › `marken.naechste.bau_pausiert`: „Der Bau ruht: In der Akte fortsetzen oder aufgeben.“
- Art: Funktion
- Befund: Der Text verspricht „aufgeben“, aber dafür gibt es keinen Knopf. Pausieren kostet weder Kapital noch Unterhalt noch Fortschritt. `balance.baupause` sagt das sogar ausdrücklich: „ohne neuen Kapitalpreis. Fortschritt bleibt erhalten“.
- Warum es stört: Es verletzt Regel 7 und die Rückmeldung „fortsetzen, ändern, beenden“. Ein Stopp ohne Preis ist keine Entscheidung. GROSSPROJEKTE.md §5 verlangt ausdrücklich: „Ein Projekt kann … versenkt werden — mit bereits ausgegebenen Planungskosten.“
- Vorschlag: Neuer Knopf „Aufgeben“. Er kostet die bisherigen Schulden und eine Vertragsstrafe (Spielparameter), der Fortschritt verfällt, und die Unternehmer verlieren Vertrauen. Pausieren kostet je Monat ein Zehntel der Verwaltungskosten und 0,2 Zustand. Die Vergabe ist bisher fest (`reich.ts:756`). Ein Wechsel könnte gegen eine Neuausschreibung mit 3 Monaten Verzug möglich sein.
- Schwere: 1
- Aufwand: mittel

**F-5 · Die Regionen sind flach: Scheinregionalität**
- Ort: Provinzblatt „Lage im Spiel“ (`ui/ProvinceCard.tsx:25-31` und `:121-137`), Stätten (`ui/Reich.tsx:273, 293`), Stadtmarke (`ui/atlas/staedte.ts:112-116`), Restaurierungswirkung
- Art: Sinn / Zahl
- Befund: Eigene Messung der Startwelt ergab, dass **214 von 262 Netzknoten in allen 81 Provinzen denselben Wert haben**. Das betrifft auch Straßen und Autobahnen (60), Bahnnetz (35), Kulturerbe (55), nationale Identität (55) und das Vertrauen in die Regierung (45). Folgen davon:
  - Jede Stätte meldet „Kulturerbe in dieser Provinz: 55 von 100“.
  - Jede Stadtmarke meldet „Zustimmung vor Ort: 45 %“ (in Ankara wie in Bingöl).
  - Adıyaman hat laut Provinzblatt 52 km Bahn und dennoch „Bahnnetz 35“ wie Istanbul.
- Warum es stört: Der Spieler soll „wo es akut ist“ wählen, aber die Zahlen sind überall gleich. Die regionale Wirkung „+0,3 in 1 Provinz (heute 55)“ ist dann Schau.
- Vorschlag: Startwerte je Provinz aus vorhandenen Daten setzen: `provinz_infra.json` (Straßendichte, Schiene, Kliniken), `katastrophe_risiko.json`, Wahlergebnis 2024 für die Zustimmung und die Zahl der Stätten je Provinz für das Kulturerbe. Bis dahin sollte die Oberfläche keine Provinzwerte zeigen, die keine sind.
- Schwere: 1
- Aufwand: groß

**F-6 · Ein Plan, fünf Systeme**
- Ort: Forschung & Ziele und Land insgesamt: `data/fokusbaum.ts`, `sim/programme.ts`, `sim/grosseziele.ts`, `data/reich/*`, `ui/katastrophe/Lage.tsx`
- Art: Sinn / Konsistenz
- Befund: Dasselbe Vorhaben erscheint als Fokus, als Programm, als Großes Ziel, als Bauvorhaben und als Vorteil.
  - Erdbeben: Fokus „Erdbebenfeste Türkei“, Programm „Wiederaufbau und Erdbebenschutz“, Vorsorgekarten „Gebäude-Verstärkungsprogramm“ und „Bauaufsicht“, Vorhaben „Wiederaufbau und Erdbebenertüchtigung“.
  - Mittlerer Korridor: Fokus „Mittlerer Korridor über …“, Großes Ziel „Logistikdrehscheibe Eurasien“ mit der Stufe „Mittlerer Korridor in Betrieb“, die Vorhaben „Transitabkommen“, „Autobahn bis China“ und „Hochgeschwindigkeitsbahn bis China“, dazu der Vorteil „Drehscheibe Mittlerer Korridor“.
  - Das Konzept (FOKUS_FORSCHUNG_KRIEG_KONZEPT §3) wollte: „Die 4 Programme werden Äste; Ziele werden ‚Leitlinie je Amtszeit‘“. Das ist nicht umgesetzt.
- Warum es stört: Der Spieler muss fünf Akten führen, um einen Plan zu verfolgen. Was wofür zählt, bleibt unklar. Das ist genau die „Aktenarbeit“, die der Inhaber ablehnt.
- Vorschlag: Programme werden Äste des Fokusbaums, Große Ziele dessen Gipfel. Bauvorhaben hängen als „Anwendung“ am Fokus. Jede Karte zeigt „gehört zu: …“ mit Sprung.
- Schwere: 1
- Aufwand: groß

**F-7 · Fest verdrahtetes Deutsch in Englisch und Türkisch**
- Ort:
  - `ui/reich/Neues.tsx:17-34` (Arten, Utopiesatz, Status) und `:128-131` (Chips „Alles“, „Weitere Vorhaben“, „Unrealistisch“)
  - `ui/Reich.tsx:225-234` (Serien „Alle 53“, „Sieben Kirchen“ …), `:352` („reformorientiert“), `:546` („: Ansicht“)
  - `ui/reich/Regional.tsx:31-41, 52` („Wo?“), `:68` („% BIP“), `:95` („Es verliert:“)
  - `ui/reich/VorhabenKarte.tsx:27-29, 71`
  - `ui/reich/WunderFenster.tsx:15, 60-61, 78`
  - `ui/reich/WunderBild.tsx:344`
  - `ui/reich/Pflege.tsx:55-58`
  - `ui/politik/ProgrammeAkte.tsx:25-41, 66, 227`
  - `ui/ProvinceCard.tsx:25-31, 152` („Im Bau“) sowie `"de-DE"` an 8 Stellen
  - `ui/grosseziele/GrosseZiele.tsx:82, 90` („Kapital“)
  - `sim/reich.ts:745, 801`, `:287` (Länderbedingung)
  - `sim/katastrophe.ts:145-149, 158`
- Art: Übersetzung
- Befund: Im englischen Lauf erscheinen „WO?“, „· Schulden ×0,65“, „in 39 Provinzen“, „0,523 % BIP“, „Es verliert: Provinzen ohne Programm.“, „Alles 77“, „Weitere Vorhaben 11“ und „Unrealistisch 15“. Dazu kommen deutsche Zahlen („7,7 Capital“, „2.746 Building points“).
- Warum es stört: Es verletzt Regel 11. Für englische und türkische Spieler ist die Bauakte halb deutsch.
- Vorschlag: Alle genannten Texte in die Kataloge `reich`/`vorhabenkachel` überführen und `aktuelleLocale()` statt `"de-DE"` verwenden.
- Schwere: 1
- Aufwand: mittel

**F-8 · Interne Länderkürzel**
- Ort: Vorhaben-Detail, Voraussetzungen. `sim/reich.ts:287` (`p1: v.land`)
- Art: Sprache
- Befund: Dort steht „✓ Vertrauen zu GEO mindestens 60 (jetzt 65)“, „AZE“, „KAZ“, „Handel zu CHN“. Der Satzteil „Handel“/„Vertrauen“ ist in `:286` fest auf Deutsch.
- Warum es stört: Es sind interne Codes (Regel 10).
- Vorschlag: „Vertrauen Georgiens mindestens 60 (jetzt 65)“ mit `akteurName(v.land)` und einem Katalogschlüssel.
- Schwere: 2
- Aufwand: klein

**F-9 · Dasselbe Vorhaben steht bis zu fünfmal**
- Ort:
  - Baustelle (Infrastruktur › Lage)
  - Lage der Regionen „Bauvorhaben im Bau“ (`ui/akte/Bereiche.tsx:219-225`)
  - Wissensbaum „In Arbeit“
  - Stand der Agenda › Wissensbaum
  - Bildkarten „Was Sie jetzt in Auftrag geben können“, also eine Wiederholung von Neue Vorhaben (`ui/akte/Bildkarten.tsx`)
- Art: Konsistenz
- Befund: „Kampfpanzer Altay … in 45 Monaten“ steht in der Baustelle, im Wissensbaum und in Sicherheit › Rüstung, denn es ist dieselbe Kennung `mil_altay` (`data/wissensbaum.ts:23`). „Kanal Istanbul“ steht als Bildkarte in der Lage und als Kachel unter Neue Vorhaben. In der Lage der Regionen steht viermal „seit Spielbeginn“.
- Warum es stört: Es verletzt Regel 8. Der Spieler weiß nicht, wo er handeln soll.
- Vorschlag: Jedes Vorhaben hat einen Ort zum Handeln: die Baustelle in der Land-Akte. Andere Ansichten zeigen höchstens eine Zeile mit Sprung. Die Lage der Regionen wird eine Regionenkarte (siehe F-12).
- Schwere: 2
- Aufwand: mittel

**F-10 · Dreimal „Programm“**
- Ort:
  - Netze „Großinvestitionsprogramme“ (`ui/infrastruktur/Netze.tsx:200-215`): Bahnoffensive, Wohnungsoffensive, Klinikoffensive
  - Neue Vorhaben „Programme für Regionen“: Bahnausbau, Wohnungsbauprogramm, Krankenhausbauprogramm
  - Forschung › Programme (Regierungsprogramme)
  - Dazu Netze „Bahnstrecke ertüchtigen“ und Bestand „Hochgeschwindigkeitsbahn“
- Art: Sinn / Konsistenz
- Befund: Drei Kataloge bieten für dieselbe Sache drei Wege mit verschiedenen Preisen: „Bahnoffensive 18,5 Kapital“, „Bahnausbau“ mit Ortswahl, „Bahnstrecke ertüchtigen 2,1 Kapital“. Vermutung: Die Wirkungen addieren sich. Ich habe das nicht durchgerechnet.
- Warum es stört: Der Spieler kann nicht erkennen, welcher Knopf der richtige ist. „Gleiches muss gleich aussehen“ gilt hier auch für gleiche Dinge an gleichem Ort.
- Vorschlag: Ein Ausbaukatalog je Netz in den Netzen, mit Umfang Ort / Region / Land über die Ortswahl. Die Pakete sind dann die Stufe „ganzes Land“. „Programme“ heißen nur noch die Mehrjahrespläne.
- Schwere: 2
- Aufwand: mittel

**F-11 · „Ziele erreicht“ meint andere Ziele**
- Ort: Kopf der Akte Forschung & Ziele (`ui/akte/Bereiche.tsx:142-146`, `zielStand` aus `sim/ziele.ts`), Katalog `akte.b.kern.keineZiele`. Gewählt werden kann nur am ersten Amtstag (`ui/Stage.tsx:641`).
- Art: Sinn / Funktion
- Befund: Der Kopf zeigt „Ziele erreicht 0 · Noch keine Ziele gewählt: Die Agenda gibt…“, abgeschnitten. Gezählt werden die Amtsziele, nicht die „Großen Ziele“ im Reiter daneben. Es gibt keinen Weg, die Amtsziele nachträglich zu wählen, und keinen Sprung.
- Warum es stört: Es entsteht eine Namensverwechslung, und der Hinweis führt nirgendwohin (Regel 9).
- Vorschlag: Den Kopfwert umbenennen in „Amtsziele“ mit dem Knopf „Amtsziele wählen“, oder die Amtsziele mit den Großen Zielen zusammenlegen (siehe F-6).
- Schwere: 2
- Aufwand: klein

**F-12 · „Lage der Regionen“ zeigt keine Regionen und springt falsch**
- Ort: `ui/akte/Bereiche.tsx:318-366` (LageAnsicht), `:437` (`ziel` = zuletzt aktiver Zugang)
- Art: Sinn / Funktion
- Befund: Die Seite heißt „Lage der Regionen“, enthält aber Urteil, zwei Porträts, Bildkarten und Bauliste. Das Urteil sagt „Auffällig: Netze mit Überlast: 2“, der Knopf darunter heißt „Katastrophen und Wiederaufbau öffnen“, weil das die zuletzt geöffnete Ansicht war.
- Warum es stört: Der Knopf passt nicht zur Begründung, und die Seite beantwortet ihre eigene Frage nicht.
- Vorschlag: Oben eine Karte mit Provinzfarbe nach dem schlechtesten Netz oder der größten Not, daneben „die fünf Provinzen mit dem größten Handlungsbedarf“ mit Sprung. Der Knopf folgt dem auffälligen Kernwert, also „Netze öffnen“.
- Schwere: 2
- Aufwand: mittel

**F-13 · „Prüfen und beginnen →“ landet nicht beim Vorhaben**
- Ort: Bildkarten (`ui/akte/Bildkarten.tsx:69`, `oeffnen` in `ui/akte/Bereiche.tsx:433-434`)
- Art: Funktion
- Befund: Der Knopf unter „Kanal Istanbul“ öffnet Infrastruktur und Bau › Lage, nicht Neue Vorhaben mit gewähltem Kanal. Der Spieler sucht ihn dann unter 77 Einträgen.
- Warum es stört: Es verletzt Regel 9 („Jeder Hinweis führt direkt zur zuständigen Stelle“).
- Vorschlag: `startTab: "neu"` übergeben und `gewaehlt` auf die Kennung setzen.
- Schwere: 2
- Aufwand: klein

**F-14 · Provinzblatt: „Hier bauen“ führt in die Politik**
- Ort: `ui/Stage.tsx:1207-1210` (`setDossier("netz")`), `ui/ProvinceCard.tsx:143-150` (nur `net.ziele`, keine Reich-Vorhaben)
- Art: Funktion
- Befund: „Hier bauen oder fördern …“ öffnet „Politik · Maßnahmen nach Bereichen“. Das Blatt nennt keine laufenden Bauvorhaben der Provinz. Das Rathaus ist nur ein Parteikürzel („CHP“).
- Warum es stört: Der Spieler erwartet die Bauakte mit vorgewähltem Ort.
- Vorschlag: Den Knopf „Vorhaben in Adıyaman“ öffnen lassen: Land › Neue Vorhaben mit Ortswahl Adıyaman, dazu die Netze mit vorgewählter Provinz. Im Blatt eine Zeile „Im Bau hier: …“ aus `kartenOrte`.
- Schwere: 2
- Aufwand: klein

**F-15 · „Wo es akut ist“ beim Restaurierungsprogramm wählt Großstädte**
- Ort: `sim/handeln.ts:775-786` (`akuteOrte` über Problemknoten zwei Kanten entfernt), `ui/reich/Regional.tsx:19`
- Art: Logik
- Befund: Für die Restaurierung und für den Wohnungsbau wählt „Wo es akut ist (8)“ dieselben Provinzen: Adana, Ankara, Antalya, Bursa, İstanbul, İzmir, Kocaeli, Konya. Hasankeyf (Batman, Zustand 15) und Antakya (Hatay, Zustand 22) fehlen.
- Warum es stört: Der Vorschlag widerspricht dem Bild, das der Spieler eben gesehen hat.
- Vorschlag: Bei Vorlagen mit `nach: "staetten"` als „akut“ die Provinzen mit Stätten unter Zustand 45 nehmen, bei Netz-Vorlagen die Provinzen mit Überlast.
- Schwere: 2
- Aufwand: klein

**F-16 · Kaufverträge und Abkommen verbrauchen Baukapazität**
- Ort: `data/reich/militaer.ts` (`mil_f16`: `bau: 800`), „Transitabkommen für den Mittleren Korridor“ (40 Baupunkte), Baustelle in der Land-Akte
- Art: Logik
- Befund: Die in den USA gekaufte „F-16 Block 70“ belegt 20 Baupunkte im Monat der heimischen Baukapazität, Platz 3 vor Straßen und Kliniken. Ein Vertragspaket braucht „40 Baupunkte“.
- Warum es stört: Das ist unplausibel. Der Spieler stellt Kampfjets gegen Schulen in eine Reihe, obwohl beides real um andere Mittel konkurriert (Devisen und Rüstungsindustrie gegen Bauwirtschaft).
- Vorschlag: Beschaffung und Abkommen bekommen eigene Engpässe: Rüstungsfertigung in Sicherheit, Verhandlungskapital in Außen. Baupunkte nur für Bauwerke im Land.
- Schwere: 2
- Aufwand: mittel

**F-17 · Zahlenformate falsch oder irreführend**
- Ort: `ui/infrastruktur/Netze.tsx:211` (`{an.pk}`), `ui/reich/Pflege.tsx:136`, `ui/reich/VorhabenKachel.tsx:35`, Fokus-Folgen (`Fokusbaum.tsx:73`), Katastrophenringe
- Art: Zahl
- Befund:
  - Der Knopf heißt „Programm beschließen 18.5“, daneben steht „18,5 Kapital“.
  - „0.6 Verwaltung/Monat“ steht mit Punkt.
  - Kacheln zeigen „0 % BIP“ bei echter Schuld (Sinan-Route, Seldschukenroute), weil auf eine Stelle gerundet wird.
  - „1,044 % BIP“ und „0,523 % BIP“ haben drei Nachkommastellen.
  - Fokus „Vertrauen der Märkte +0,7“ ist ein Index mit Komma.
  - Der Ring „7,0 %“ steht neben ganzzahligen Ringen.
- Warum es stört: Es verletzt Regel 10 (Indizes ohne Komma) und wirkt unfertig.
- Vorschlag: Überall `zahl()` mit Gebietsschema verwenden. BIP-Anteil mit einer gültigen Stelle („0,03 %“ oder „< 0,1 %“). Indizes ganzzahlig. Ringe ganzzahlig („7 %“).
- Schwere: 2
- Aufwand: klein

**F-18 · „Stufe“ als Einheit**
- Ort: Netze (`infra.ui.etat.*`: „Finanzierung aus dem Posten „Öffentliche Investitionen“ (Stufe 0).“), Vorsorgekarten (`ui/katastrophe/Lage.tsx:30, 42`: „Stufe 40“, „Nächster Schritt: Stufe 40 → 60“), Programme („mindestens auf Stufe 60 (jetzt 55)“)
- Art: Sprache / Sinn
- Befund: Es wird keine echte Größe genannt.
- Warum es stört: Es verletzt Regel 5. „Stufe 0“ liest sich wie „kein Geld“.
- Vorschlag: Benannte Zustände („Etat wie geplant“, „Frühwarnung in Ballungsräumen“ → „landesweit“) oder echte Einheiten („AFAD: 40 Stützpunkte → 60“, sofern belegt, sonst als Lücke kennzeichnen).
- Schwere: 2
- Aufwand: mittel

**F-19 · Schein-Regler auf den Vorsorgekarten**
- Ort: `ui/katastrophe/Lage.tsx:33-35` (`kr-hebel-stufen`, `aria-hidden`)
- Art: Design
- Befund: Ein Balken mit Griff sieht aus wie ein Regler, lässt sich aber nicht ziehen. Gehandelt wird über „Als Gesetz einbringen“.
- Warum es stört: Der Balken verspricht eine Bedienung, die es nicht gibt.
- Vorschlag: Fortschrittsband ohne Griff mit zwei Marken (jetzt / Ziel), oder ein echter Regler, der den Preis live zeigt.
- Schwere: 2
- Aufwand: klein

**F-20 · Vier Ebenen und zwei Reiterstile**
- Ort: Land: Aktenreiter „Lage der Regionen“/Instrumente › Zugang (Infrastruktur / Netze / Kultur / Katastrophen) › Unterreiter (Lage / Bauwerke pflegen / Neue Vorhaben, bzw. Lage und Vorsorge / Laufende Fälle / Versprechen / Chronik) › Filterchips. `ui/Reich.tsx:545-554` (`rr-tabs`, kleine Kapitälchen), `ui/Katastrophe.tsx:61` (`kr-tabs`, große rote Serife)
- Art: Konsistenz / Design
- Befund: Es gibt vier Navigationsebenen, und die dritte sieht in jedem Zugang anders aus (vergleiche Bilder 025 und 028). Die Katastrophe hat zusätzlich eigene Kennzahl-Chips („Bereitschaft 45 · Laufende Fälle 0 · Politisches Kapital 71“). Sie wiederholen den Kopf („Offene Katastrophenfälle 0“) und die Kopfleiste („71 Kapital“).
- Warum es stört: Es verletzt Regel 3 und Regel 8. „Sieht wieder alles verschieden aus“.
- Vorschlag: Eine Unterreiter-Komponente für alle Zugänge. Fälle, Versprechen und Chronik werden aufklappbare Zeilen unter der Lage. Die Chips entfallen.
- Schwere: 2
- Aufwand: mittel

**F-21 · Vier Namen für eine Akte**
- Ort: Fenstertitel „Land und Regionen“, Kopf „Land & Infrastruktur“ (`akneu.land.titel`), Leiste „Land“, Reiter „Lage der Regionen“. Kartenmarke `karte.json` › `marken.klick.lage`: „Klick: Akte Reich öffnen, Reiter Lage“ (englisch: „open the Realm file“).
- Art: Sprache
- Befund: Die „Akte Reich“ gibt es in der Oberfläche nicht mehr. Der Reiter „Pflegen“ heißt „Bauwerke pflegen“.
- Warum es stört: „Wo finde ich diese Akten?“
- Vorschlag: Einheitlich „Land“: Fenster „Land“, Kopf „Land & Infrastruktur“, Marke „Klick: Akte Land öffnen, Infrastruktur und Bau“.
- Schwere: 2
- Aufwand: klein

**F-22 · Pflege-Karten reden gleich**
- Ort: Bauwerke pflegen (`ui/reich/Pflege.tsx:55-58` und Katalog)
- Art: Design / Sprache
- Befund: Achtmal steht „Was es heute gegenüber dem Spielbeginn bringt: Genau so viel wie zum Spielbeginn; das steckt schon in den Startwerten des Landes.“ und achtmal „Der Preis: Bindet Baukapazität, die dann für Neubauten fehlt.“ Dazu kommt der Kopfsatz „Der Strich im Balken zeigt den Zustand zum Spielbeginn…“.
- Warum es stört: Es entsteht Länge ohne Information (2,9 Bildschirme).
- Vorschlag: Eine Tabelle mit je einer Zeile pro Bauwerk: Name, Balken, „in 5 Jahren 71“, Instandsetzungspreis und Knopf. Die Erklärung steht einmal im Kopf, die Folgen auf Klick.
- Schwere: 3
- Aufwand: klein

**F-23 · Zwei Zahlen für „Erhaltung“, drei für „Zustand“**
- Ort: Kultur › Lage: Größe „Erhaltung des Kulturerbes 55“ und Überschrift „Erhaltung insgesamt 64“ (`ui/Reich.tsx:248`, `erhaltung()`). Infrastruktur › Lage: „Zustand der Anlagen 55“, während die Bestandsstücke 66 bis 86 haben.
- Art: Konsistenz / Zahl
- Befund: Für dieselbe Frage stehen verschiedene Zahlen auf einem Bildschirm.
- Warum es stört: Der Spieler weiß nicht, welche Zahl zählt.
- Vorschlag: Eine Größe je Frage. Wenn es zwei bleiben müssen, mit verschiedenen Namen („Zustand der Stätten 64“, „Wert des Erbes für das Land 55“).
- Schwere: 2
- Aufwand: klein

**F-24 · Kulturrestaurierung fast ohne Wirkung, Hasankeyf unplausibel**
- Ort: Stätten (`ui/Reich.tsx:240-244, 301-314`), `data/erbe.ts:77`
- Art: Sinn / Logik
- Befund: Jede Restaurierung bringt „Nationale Identität und Zusammenhalt +0,3 in 1 Provinz (heute 55)“ für 2 bis 3 Kapital, 100 bis 260 Baupunkte und 8 bis 10 Monate. Hasankeyf („2020 vom Ilısu-Stausee überflutet, Teile versetzt“) lässt sich von Zustand 15 auf 41 restaurieren.
- Warum es stört: Es gibt keine echte Abwägung, und ein versunkener Ort lässt sich nicht restaurieren.
- Vorschlag: Die Wirkung an Tourismus und Ansehen der Provinz und an die Routenvorteile koppeln und sichtbar machen. Hasankeyf als „versetzte Bauten im Kulturpark“ führen oder aus der Restaurierung nehmen.
- Schwere: 2
- Aufwand: mittel

**F-25 · Wo entschieden wird, fehlt der knappe Faktor**
- Ort: Netze „Bauen“ (`infra.ui.preis`: „{pk} Kapital · {monate} Monate“), Kacheln (`ui/reich/VorhabenKachel.tsx:32-36`), Bildkarten zeigen „Bau“ abgekürzt
- Art: Funktion
- Befund: Ausbauten aus den Netzen belegen dieselbe Baukapazität, zeigen aber keine Baupunkte und keine Verwaltungskraft. Die Kacheln zeigen Kapital und Monate, aber keine Baupunkte.
- Warum es stört: Es verletzt Regel 4. Die Baukapazität ist mit 133 von 133 verplant, und der Spieler sieht das nicht dort, wo er klickt.
- Vorschlag: Ein Preisschild für alle: Kapital · Baupunkte · Monate, dazu „verdrängt: …“, wenn die Kapazität voll ist.
- Schwere: 2
- Aufwand: klein

**F-26 · Artwork: 19 Motive für etwa 100 Vorhaben, Fehlgriffe**
- Ort: `ui/reich/WunderBild.tsx` (Motive), Zuordnung in `data/reich/*.ts`, `sim/grosseziele.ts` (`bild`)
- Art: Design
- Befund:
  - Häufigkeit: 13 Vorhaben teilen den „turm“, 11 die „bahn“, 9 den „jet“, 9 die „stadt“.
  - „Kampfpanzer Altay T1“ wird als Turm gezeigt, „Drohnenverbund (Bayraktar TB2, Akıncı, TB3)“ als Kampfjet. Alle Raumfahrtstufen sind Türme.
  - Das Große Ziel „Ordnung im Nahen Osten“ (Sicherheitsordnung nach KSZE-Vorbild) zeigt eine Moschee mit zwei Minaretten.
  - Jedes Bild hat dieselbe Abendsonne an derselben Stelle.
  - Die Kacheln in Neue Vorhaben haben gar kein Bild.
- Warum es stört: Das Spiel muss gut aussehen. Gleiche Bilder für verschiedene Dinge entwerten das Wunder.
- Vorschlag: Mindestens Motive für Panzer, Drohne, Rakete/Startplatz, Satellit, Rechenzentrum, Hafenkran, Staudamm mit Kanal, Klinik, Schule, Stromtrasse und Konferenzsaal. Sonnenstand und Tageszeit je Bereich variieren. Ein Kleinbild auch auf der Kachel.
- Schwere: 2
- Aufwand: mittel

**F-27 · Drei Bäume, drei Bildsprachen**
- Ort: Fokusbaum (hell, Skizzenpapier, `fokus.css`), Wissensbaum-Fenster (dunkles Rotbraun, Rundikonen, `wissensbaum.css`), Große Ziele (dunkle Blaupause), Programme (Medaille, Pergament)
- Art: Konsistenz / Design
- Befund: Die Bilder `fz_fokus_vollbild.png` und `fz_wissen_baum.png` wirken wie zwei Spiele.
- Warum es stört: „Sieht wieder alles verschieden aus“.
- Vorschlag: Ein Baumgerüst für Fokus und Wissen: Pergament, Ast-Farbbänder, Rundikone, Fortschrittsring. Das dunkle Fenster nur als Vollbildmodus für beide.
- Schwere: 2
- Aufwand: mittel

**F-28 · Fokuskarte ohne Ikone, Preis und Status, blasser Knopf**
- Ort: `ui/fokus/Fokusbaum.tsx:407-424` (Knoten nur mit Name), `fk-ja`
- Art: Design
- Befund: Die Knoten zeigen nur den abgeschnittenen Namen. Möglich und gesperrt unterscheiden sich nur durch Blässe. „Fokus beginnen“ steht in Hellgold auf Hell und ist kaum lesbar (Bild `fz_fokus_blatt1.png`).
- Warum es stört: HOI4 lebt von Ikonen und klaren Zuständen.
- Vorschlag: Ikone links, Dauer und Kapital rechts unten, Rahmen in Ast-Farbe. Möglich wird gold umrandet, gesperrt bekommt ein Schloss. Der Knopf erhält vollen Kontrast.
- Schwere: 2
- Aufwand: klein

**F-29 · Erste Foki sind Gratisgaben**
- Ort: Fokus „Nationale Wirtschaftsstrategie“ und „Gesellschaftlicher Pakt“ (`data/fokusbaum.ts`)
- Art: Sinn
- Befund: Das Blatt nennt „4 Kapital · 2 Monate“, als Folge „Vertrauen der Märkte +0,7, Kapital +2,0“, dazu „Kein Lager fühlt sich herausgefordert.“ Netto kostet das 2 Kapital und hat keinen Verlierer.
- Warum es stört: Es gibt nur eine richtige Antwort und keine Abwägung.
- Vorschlag: Schon der Wurzel-Fokus legt eine Richtung fest (Markt gegen Staat), kostet Aufmerksamkeit und verärgert ein Lager. Oder er wird ohne Wahl automatisch vergeben.
- Schwere: 2
- Aufwand: mittel

**F-30 · Programme: Gratisschritt, kein Abbruch, 3,5 Bildschirme**
- Ort: `sim/programme.ts:75` (`preise1`: `bedingung: kein`, 3 Kapital, 30 Tage → `vertrauen_maerkte +3`, `riskPremium −15`), `ui/politik/ProgrammeAkte.tsx` (kein Abbrechen)
- Art: Sinn / Funktion
- Befund: „Haushaltsdisziplin verkünden: Der Präsident legt sich öffentlich auf einen soliden Haushalt fest. Danach Vertrauen der Märkte +3, Risikoaufschlag −15“. Es gibt keine Bedingung und keine Folge, wenn man das Versprechen später bricht. „−15“ steht ohne Einheit (gemeint sind Basispunkte). Ein laufender Schritt lässt sich nicht abbrechen. Die acht Karten stehen offen untereinander.
- Warum es stört: Ein Versprechen ohne Haftung ist keine Entscheidung. Die Länge widerspricht Regel 2.
- Vorschlag: Der Schritt wird zur Zusage: Steigt das Defizit innerhalb von 12 Monaten, gibt es „Wortbruch“ mit Rückbuchung. Einheit „Basispunkte“. Programme als Raster mit 8 Medaillen und Pfad, Detail auf Klick.
- Schwere: 2
- Aufwand: mittel

**F-31 · Große Ziele: 13 große Karten, Tautologie**
- Ort: `ui/grosseziele/GrosseZiele.tsx:107-121`, Katalog `gz2.ui.chance` mit `gz2.wort.aussichtsreich`
- Art: Design / Sprache
- Befund: Es sind 3,0 Bildschirme. Auf den Karten steht „Aussicht aussichtsreich (etwa 33–53 %)“. Die drei Stufenpunkte im Bild sind winzig. Der Knopf „Ausbauen · 2 Kapital“ ist auf Deutsch fest verdrahtet.
- Warum es stört: Die Übersicht fehlt, und die Sprache holpert.
- Vorschlag: Raster aus 13 kleinen Bildkacheln (Bild, Titel, Chance als Wort) auf einem Bildschirm. Die volle Karte auf Klick. „Chance: gut (etwa 33–53 %)“.
- Schwere: 2
- Aufwand: mittel

**F-32 · Gemischte Kartenarten in einer Ansicht, Filterleiste überdeckt**
- Ort: Neue Vorhaben (`vk-katalog`, Filter `rr-themen`)
- Art: Design
- Befund: In derselben Ansicht stehen große Vorlagenkarten mit Kopfzeile „PROGRAMM FÜR REGIONEN“ und kleine Kacheln mit „Wunder · Stufe I“. Die schwebende Filterleiste hat keinen deckenden Hintergrund: Ortschips („Adana ✕ Ankara ✕“) und Karteninhalte scheinen ober- und unterhalb durch (Bild `land_infra_neu_1.png`).
- Warum es stört: Es sieht unaufgeräumt aus.
- Vorschlag: Eine Kartenart. Die Leiste bekommt einen deckenden Papierhintergrund mit Schatten.
- Schwere: 2
- Aufwand: klein

**F-33 · Rechenwerk in der Oberfläche**
- Ort: Vorlagenkarte (`vor.preisschild`, `ui/reich/Regional.tsx:61-63`)
- Art: Sprache
- Befund: „betrifft 65 Prozent der Bevölkerung · Kapital ×0,77 · Baupunkte ×0,65 · Dauer ×0,88 · Schulden ×0,65“.
- Warum es stört: Das sind Multiplikatoren aus dem Modell, keine Spielsprache. Die echten Kosten stehen ohnehin darunter.
- Vorschlag: „Gilt für 65 % der Bevölkerung, etwa ein Drittel günstiger als landesweit.“
- Schwere: 3
- Aufwand: klein

**F-34 · Lage-Urteil am ersten Tag**
- Ort: `ui/akte/Bereiche.tsx` (`lageUrteil`, Kernwerte mit `ton: "mittel"` für 0 Foki und 0 Ziele)
- Art: Logik / Sprache
- Befund: „Lage: gemischt · Auffällig: Foki vollendet: 0 · Ziele erreicht: 0 · Hochschulen: 44“ am 5. Juni 2028, dem ersten Amtstag.
- Warum es stört: Ein Startzustand wird als Mangel gemeldet.
- Vorschlag: Zählwerte ohne Ton. Das Urteil nur aus Zustandsgrößen (Hochschulen, Forschungstempo, freie Plätze). Satz: „Kein Fokus läuft. Sieben Wege sind offen.“
- Schwere: 3
- Aufwand: klein

**F-35 · Kapazitätsleiste ohne Namen und ohne Farbbedeutung**
- Ort: `ui/Reich.tsx:139, 165-172` (`BAU_FARBEN` nach Position)
- Art: Design
- Befund: Blöcke „1 2 3 4 5“ in Ocker, Petrol, Rot, Grün und Violett. Rot (Platz 3) ist zufällig und heißt nicht „Gefahr“. Der Name steht nur im Tooltip. Die militärische Herkunft steht klein in grauen Kapitälchen „STREITKRÄFTE“ (11 px, Rundgang).
- Warum es stört: Das Bild beantwortet „Was frisst meine Kapazität?“ nur zur Hälfte.
- Vorschlag: Blöcke mit Kurzname und Bereichsfarbe (Land, Kultur, Sicherheit). Rot nur für „wartet“. Freie Kapazität schraffiert.
- Schwere: 3
- Aufwand: klein

**F-36 · Bürgermeister und Rathäuser ohne Handlung**
- Ort: Provinzblatt (`ui/ProvinceCard.tsx:75-79`), Stadtmarke
- Art: Sinn (fehlende Möglichkeit)
- Befund: „Rathaus seit 2024: CHP“. Es gibt keine Person und keine Handlung: Zusammenarbeit, Mittelzuweisung, Zwangsverwalter (kayyum), Streit um Bauprojekte der Stadt.
- Warum es stört: In der Türkei ist das Verhältnis zwischen Präsident und Oppositionsrathäusern (Istanbul, Ankara, die DEM-Städte im Südosten) eine der härtesten realen Abwägungen. Hier ist es reine Anzeige.
- Vorschlag: Je Großstadt ein Bürgermeister als Figur mit Haltung. Regionalprogramme in Oppositionsstädten brauchen Zusammenarbeit oder kosten Kapital. Ein „Kayyum“ als Sonderrecht mit hohem Preis.
- Schwere: 2
- Aufwand: groß

**F-37 · Fokus und Technologie ohne Abschlussszene**
- Ort: `ui/fokus/Fokusbaum.tsx:423` (nur `fk-stempel`), Wissensbaum
- Art: Sinn / Design
- Befund: Das Konzept (FOKUS_FORSCHUNG_KRIEG_KONZEPT §5) verlangt Abschlusskarten „wie die vorhandene Wunder-Szene“. Umgesetzt ist nur ein Stempel. Die Wunderszene selbst (`WunderFenster.tsx`) gibt es und ist gut.
- Warum es stört: Das Civ-6-Gefühl („Fertig!“) fehlt bei 102 Foki und 50 Technologien.
- Vorschlag: Eine kleine Abschlusskarte mit Ast-Bild, Zitat, zwei Wirkungen und „Weiter“, im Takt der Wunderszene.
- Schwere: 2
- Aufwand: mittel

**F-38 · Katastrophen-Wahrscheinlichkeit hoch (Vermutung)**
- Ort: `sim/katastrophe.ts:40-42` (`bebenChance: { kaf: 0.011, daf: 0.0095, baf: 0.006 }` je Monat)
- Art: Zahl
- Befund: Das ergibt etwa 12 %, 11 % und 7 % im Jahr. Zusammen sind das rund 27 % für ein Großbeben im Jahr, in fünf Jahren rund 80 %. Die Werte sind als Spielparameter gekennzeichnet (gut). Vermutung: Für Großbeben mit vielen Toten liegt das über der Wirklichkeit. In der Türkei treten Beben ab Stärke 7 etwa alle 5 bis 10 Jahre auf. Ich habe das nicht recherchiert.
- Warum es stört: Ein Beben pro Amtszeit wird fast sicher und damit vorhersehbar.
- Vorschlag: Gegen den AFAD-Katalog kalibrieren und den Beleg in die Kommentarzeile schreiben.
- Schwere: 3
- Aufwand: klein

**F-39 · Englisch und Türkisch: Plural und Anrede**
- Ort: `ui2.ui.Reich.d335b73` / `ui2.ui.reich.Neues.d335b73` (beide Zweige von `n === 1 ? … : …` nutzen denselben Schlüssel, `ui/Reich.tsx:597`, `ui/reich/Neues.tsx:116, 147`), `balance.baupause` (tr), `reich.tab.bauwerke` (en), `gz2.ui.chance` (en)
- Art: Übersetzung
- Befund: Im Englischen steht „1 Projects“, im Türkischen „1 Projeler“. Türkisch `balance.baupause` duzt („duraklatabilirsin“), anderswo wird gesiezt („Tıklayın“). Englisch „Maintain Works“, „Chance promising“, „open the Realm file“.
- Warum es stört: Es klingt maschinell (Regel 11).
- Vorschlag: ICU-Plural `{n, plural, one {# project} other {# projects}}`. Türkisch „duraklatabilirsiniz“. Englisch „Maintenance“, „Outlook: good“, „open the Country file“.
- Schwere: 3
- Aufwand: klein

**F-40 · Hinweistext der Baustelle verklebt**
- Ort: `ui/Reich.tsx:215` (`ui2.ui.Reich.90f1a97` + `ui.Reich.119c095`)
- Art: Sprache
- Befund: „öffentlich: Position 1 baut zuerst; vorziehen kostet 10 Verwaltungskraft je Position Die Schätzungen gelten …“. Der Text beginnt klein, ein Punkt fehlt, und „ehrlich“ steht als Selbstlob im Spieltext.
- Warum es stört: Das wirkt unfertig.
- Vorschlag: Siehe Wortprüfung.
- Schwere: 3
- Aufwand: klein

**F-41 · Utopien mitten im Katalog**
- Ort: `ui/reich/Neues.tsx:31, 130` (Chip „Unrealistisch 15“), Thema „Verkehr und Welt“ zeigt „Brücke oder Tunnel nach Zypern“ (Wunder, 45 Kapital, 22 Jahre) neben dem Megahafen
- Art: Sprache / Design
- Befund: Das Wort „Unrealistisch“ wertet die eigenen Angebote ab. Weltraumaufzug und Unterwasserstadt stehen unter demselben Filter wie Hafenausbauten.
- Warum es stört: Es bricht die Stimmung und verlängert die Liste.
- Vorschlag: Ein eigener Reiter oder eine Galerie „Visionen“ mit dunkler Blaupause, ausgeblendet bis eine Vorstufe steht.
- Schwere: 3
- Aufwand: klein

**F-42 · Kartenmarke „Wunder“ für jeden fertigen Bau**
- Ort: `ui/atlas/marken.ts` (Art `wunder` für fertige Großprojekte), Klick-Ziel
- Art: Konsistenz
- Befund: Marmaray, Osmangazi-Brücke und das Übertragungsnetz TEİAŞ heißen auf der Karte „Wunder“. Der Klick öffnet Infrastruktur › Lage, nicht das Bauwerk.
- Warum es stört: Das Wort „Wunder“ verliert an Wert, und der Sprung führt nicht ans Ziel.
- Vorschlag: Art aus `klasse` ableiten („Großprojekt“, „Wunder“). Der Klick öffnet Bauwerke pflegen mit dem Stück markiert.
- Schwere: 3
- Aufwand: klein

**F-43 · Quellenähnliche Zeile im Vorhaben**
- Ort: Vorhaben-Detail „Maßstab: Das Vorbild ist die Transkaspische Route, die seit 2022 stark an Bedeutung gewann.“ (Feld `anker`)
- Art: Sprache
- Befund: Vermutung: Diese Zeile ist als Beleg gedacht. Regel 6 verbietet Quellenangaben in der Oberfläche.
- Warum es stört: Der Grenzfall wirkt wie Fußnote.
- Vorschlag: Als erzählender Satz in den Text („Die Route über das Kaspische Meer wächst seit 2022.“) oder in den Almanach.
- Schwere: 3
- Aufwand: klein

**F-44 · Drei Darstellungen der Straßen ohne Verbindung**
- Ort: Infrastruktur › Lage „Straßen und Autobahnen 60“ (Netzknoten, flach), Netze „Straßen und Autobahnen 72 % Auslastung, Engpass İstanbul 107 %“ (`sim/infrastruktur.ts`), Provinzblatt „7.440 km“ (`provinz_infra.json`), Kartenebene „Versorgungswege“ (REGIONALE_VERSORGUNG)
- Art: Konsistenz
- Befund: Es gibt vier Maße für dasselbe Netz, und keine Ansicht verweist auf die andere.
- Warum es stört: Der Spieler weiß nicht, welche Zahl er verbessern soll.
- Vorschlag: In der Infrastruktur-Lage die Netzringe aus den Netzen zeigen statt der Indexbalken. Die Indexwerte nur im Wirkungsnetz. Ein Verweis „Versorgungswege auf der Karte (V)“.
- Schwere: 2
- Aufwand: mittel

Zählung: Schwere 1: 7 (F-1 bis F-7). Schwere 2: 27. Schwere 3: 10.

---

## 3. Wortprüfung

Schlüssel: alt → neu (Deutsch, sofern nicht anders angegeben)

- `ui2.ui.Reich.90f1a97`: „öffentlich: Position 1 baut zuerst; vorziehen kostet {p0} Verwaltungskraft je Position“ → „Position 1 baut zuerst. Wer ein Vorhaben vorzieht, zahlt {p0} Verwaltungskraft je Platz.“
- `ui.Reich.119c095`: „Die Schätzungen gelten, solange Kapazität und Reihenfolge bleiben, wie sie sind. Vorziehen ist eine Entscheidung mit Preis: Es kostet Verwaltungskraft und verdrängt ehrlich das überholte Vorhaben.“ → „Die Schätzungen gelten, solange Kapazität und Reihenfolge gleich bleiben. Das überholte Vorhaben wartet dann länger.“
- `balance.baulage`: „… Die Bilanz wird vor dem nächsten Bauschritt gebucht.“ → den letzten Satz streichen (interne Buchungslogik).
- `balance.personal`: „Im monatlichen Verwaltungszufluss enthalten: {wert} Punkte aus dem bereits wirksamen Personaletat.“ → „Davon kommen {wert} Punkte im Monat aus dem Personaletat.“
- `balance.baupause`: „Parallelprojekte zurückstellen: Die Baureihenfolge erlaubt Pausen ohne neuen Kapitalpreis. …“ → „Vorhaben pausieren: Der Fortschritt bleibt, die Wirkung kommt später.“ (Ist F-4 umgesetzt: mit Preis nennen.)
- `marken.naechste.bau_pausiert`: „Der Bau ruht: In der Akte fortsetzen oder aufgeben.“ → „Der Bau ruht. In der Akte Land können Sie ihn fortsetzen.“ (bis „Aufgeben“ existiert)
- `marken.klick.lage`: „Klick: Akte Reich öffnen, Reiter Lage“ → „Klick: Akte Land öffnen, Infrastruktur und Bau“
- `marken.klick.pflegen`: „Klick: Akte Reich öffnen, Reiter Pflegen“ → „Klick: Akte Land öffnen, Bauwerke pflegen“
- `akneu.land.lage`: „Lage der Regionen“ → „Lage im Land“ (solange keine Regionen gezeigt werden)
- `akte.b.kern.keineZiele`: „Noch keine Ziele gewählt: Die Agenda gibt der Amtszeit eine Richtung.“ → „Keine Amtsziele gewählt.“ (mit Knopf „Wählen“)
- `akte.b.urteil.weil`: „Auffällig: {gruende}“ → „Auffällig sind {gruende}.“ (Ergebnis „Lage: angespannt. Auffällig sind zwei überlastete Netze.“ statt „Auffällig: Netze mit Überlast: 2“ mit doppeltem Doppelpunkt)
- `gz.lage.ruhig`: „Derzeit nichts bei: {abschnitte}.“ → „Derzeit ruhig: {abschnitte}.“ (Ergebnis „Derzeit nichts bei: Offene Katastrophenfälle.“ ist kein Deutsch.)
- `infra.ui.etat.haushalt` / `infra.ui.etat.*`: „Finanzierung aus dem Posten „Öffentliche Investitionen“ (Stufe {stufe}).“ → „Bezahlt aus dem Etat für öffentliche Investitionen: {zustand}.“ mit benannten Zuständen „wie geplant“, „gekürzt“, „aufgestockt“
- `infra.ui.leer`: „Leere Kapazität kostet Unterhalt: etwa {x} Punkte Schuldenquote im Jahr.“ → „Ungenutzte Netze kosten Unterhalt: etwa {x} Prozentpunkte Schuldenquote im Jahr.“
- `gz.einheit.pp`: „Pp.“ → „Prozentpunkte“ (Bildkarte „+0,9 Pp. Schulden“ → „+0,9 Prozentpunkte Schulden“)
- `gz.einheit.monate`: „Mon.“ → „Monate“
- `gz2.wort.gering` / `moeglich` / `aussichtsreich` mit `gz2.ui.chance` „Aussicht {wort} (etwa …)“ → „Chance: gering / offen / gut (etwa {von}–{bis} %)“
- `ui2.ui.Reich.4bc0142` + `ui2.ui.Reich.97a6c71`: „Kulturerbe in dieser Provinz: 55 von 100.“ → entfernen, bis die Provinzwerte verschieden sind (F-5)
- Pflegeblock (Pflege-Katalog): „Was es heute gegenüber dem Spielbeginn bringt: Genau so viel wie zum Spielbeginn; das steckt schon in den Startwerten des Landes.“ → „Wirkt wie zu Spielbeginn.“ (einmal je Karte, ohne Überschrift)
- `reich.tab.bauwerke`: „Bauwerke pflegen“ → „Instandhaltung“ (en „Maintain Works“ → „Maintenance“; tr „Yapıları Onar“ → „Bakım“)
- Vorlagen-Preisschild (`regionalVorschau`): „betrifft 65 Prozent der Bevölkerung · Kapital ×0,77 · Baupunkte ×0,65 · Dauer ×0,88 · Schulden ×0,65“ → „Gilt für 65 % der Bevölkerung, etwa ein Drittel günstiger als landesweit.“
- `sim/reich.ts:287` (Länderbedingung): „Vertrauen zu GEO mindestens 60 (jetzt 65)“ → „Vertrauen Georgiens mindestens 60 (jetzt 65)“
- `ui/reich/Neues.tsx` Chip „Unrealistisch“ / Überschrift „Unrealistisch, aber möglich“ → „Visionen“ / „Visionen: möglich, aber kaum zu schaffen“
- `ui/reich/Neues.tsx` UTOPIE_SATZ: „Möglich, aber extrem schwierig und sehr teuer: Jahrzehnte Bauzeit, riesige Schulden, Voraussetzungen, die erst Vorstufen schaffen, Mehrkosten, die eher die Regel sind, und Widerstand, der nicht nachlässt. Der Gegenwert ist Ansehen, keine Abkürzung zum Sieg.“ → „Möglich, aber kaum zu bezahlen: Jahrzehnte Bauzeit, hohe Schulden, Mehrkosten als Regel und Widerstand ohne Ende. Der Lohn ist Ansehen, kein schneller Sieg.“
- `ui/reich/Neues.tsx` ARTEN „Brücken, Bahnen, Kraftwerke, Programme: lange Bauzeit, dauerhafte Leistung, Schulden und Widerstand.“ → „Brücken, Bahnen, Kraftwerke: lange Bauzeit, dauerhafter Nutzen, Schulden und Widerstand.“ (ohne „Programme“, siehe F-10)
- `wissen.ui.etat`: „Forschungsetat 0,4 % des BIP, Innovationsgrenze 0,7 %“ → „Forschung: 0,4 % des BIP. Mehr als 0,7 % kann das Land derzeit nicht nutzen.“
- Programme-Kopf (`ui2.ui.politik.ProgrammeAkte.b9bd96c`): „Jeder Schritt verlangt echte Politik (eine Maßnahme auf einer Stufe, ein gelöstes Problem), kostet Kapital und Zeit und wirkt danach dauerhaft. Höchstens 2 Schritte laufen gleichzeitig.“ → „Jeder Schritt verlangt zuerst eine Politik, dann Kapital und Zeit. Danach wirkt er dauerhaft. Zwei Schritte können gleichzeitig laufen.“
- `sim/programme.ts:75` ergebnis „Vertrauen der Märkte +3, Risikoaufschlag −15“ → „Vertrauen der Märkte +3, Risikoaufschlag −15 Basispunkte“ (ebenso `:77` „−25“)
- Fokusblatt `fokus.ui.keineReaktion`: „Kein Lager fühlt sich herausgefordert.“ → „Niemand ist dagegen.“ (besser F-29 umsetzen)
- Katastrophe Vorsorge: „Stufe 40“ / „Nächster Schritt: Stufe 40 → 60“ → benannter Zustand, etwa „Frühwarnung: Großstädte → landesweit“
- `ui.ProvinceCard.ed845b0`: „Hier bauen oder fördern …“ → „Vorhaben in {provinz} …“
- `ui/ProvinceCard.tsx:152` „Im Bau“ (fest verdrahtet) → Katalogschlüssel `reich.bau.titel`
- Kat-Chips „Politisches Kapital 71“ → entfällt (steht in der Kopfleiste)
- Lage der Regionen: „Derzeit nichts bei: Offene Katastrophenfälle.“ → „Keine offenen Katastrophenfälle.“
- Stand der Agenda: „Derzeit nichts bei: Programmschritte in Arbeit · Ziele der Amtszeit.“ → „Kein Programmschritt läuft, kein Amtsziel gewählt.“
- en `ui2.ui.Reich.d335b73` / `ui2.ui.reich.Neues.d335b73`: „Projects“ für n = 1 → ICU-Plural „{n, plural, one {# project} other {# projects}}“ (tr ebenso: „1 proje“)
- en `marken.klick.lage`: „open the Realm file, Overview tab“ → „open the Country file, Infrastructure“
- en `gz2.ui.chance` + `gz2.wort.aussichtsreich`: „Chance promising“ → „Outlook: good (about …)“
- tr `balance.baupause`: „duraklatabilirsin“ → „duraklatabilirsiniz“ (Sie-Form wie sonst)
- Uneinheitliche Begriffe: „Bauvorhaben / Vorhaben / Projekt / Großprojekt / Wunder / Ausbau / Programm“ für dasselbe. Vorschlag: „Vorhaben“ als Oberbegriff, „Wunder“ nur für Einmaliges mit Feier, „Programm“ nur für Mehrjahrespläne.
- Uneinheitlich: „Verwaltungskraft“ (Lage) / „Verwaltung/Monat“ (Chips) / „Verwaltungspunkte“ (`balance.bauprioritaet`) → überall „Verwaltungskraft“.
- Uneinheitlich: „Kapital“ / „Politisches Kapital“ → überall „Kapital“.

---

## 4. Die fünf wichtigsten Verbesserungen

**1. Ein Bauamt wie in Civ 6 statt drei Kataloge und 16 Bildschirme (F-1, F-10, F-25, F-32)**

```
┌ Land › Bauen ────────────────────────────────────────────────────────────┐
│ KAPAZITÄT  [Akkuyu 37][Wiederaufbau 36][F-16 20][Kuppel 25][Altay 15]   │
│            133 von 133 belegt · nächster frei: in 15 Monaten             │
├─ Jetzt bereit (19) │ Netze │ Städte │ Energie │ Kultur │ Visionen ───────┤
│ [Bild] Megahafen   [Bild] Transit-   [Bild] Schul-     │ DETAIL           │
│ Mersin             abkommen          bauprogramm       │ Bild (Entwurf)   │
│ 11 K · 900 BP ·6 J 6 K · 40 BP ·8 M  7,7 K · 2.746 BP  │ Wo? Land|akut|…  │
│ +3 Logistik        +3 Georgien       +4 Bildung        │ Preis, Wirkung,  │
│                                                        │ Verlierer        │
│                                                        │ [Ans Ende] [Vor] │
└──────────────────────────────────────────────────────────────────────────┘
```

So funktioniert es:
- Ein Klick auf eine Kachel füllt das Detail rechts.
- „Ans Ende“ ist frei, „Vor“ kostet Verwaltungskraft und nennt, wen es verdrängt.
- Netzausbau, Regionalprogramme und Großinvestitionen sind dieselben Kacheln, nur mit einem anderen Umfang in der Ortswahl.
- Ergebnis: ein Bildschirm statt 15,9, und für jeden Bau gibt es genau einen Knopf.

**2. Den Fokusbaum lesbar machen und ihn zum Stamm der Agenda erklären (F-2, F-6, F-11, F-27, F-28, F-37)**

```
 Ferne:   (Wirtschaft 0/16) (Außen 0/14) (Staat 0/12) (Gesellschaft 0/15) …   ← Medaillen
 Klick:   ┌──────────────────────┐   ┌──────────────────────┐
          │ ◉ Nationale          │──▶│ ◉ Exportoffensive    │
          │   Wirtschaftsstrategie│   │   Europa & Nahost    │
          │   4 K · 2 Mon   [▶]  │   │   5 K · 4 Mon   🔒   │
          └──────────────────────┘   └──────────────────────┘
          Gipfel des Asts: Großes Ziel „Logistikdrehscheibe Eurasien“ (Chance 34–54 %)
          Programmschritte hängen als Perlen am Ast; Bauvorhaben als „Anwendung“
```

So funktioniert es:
- Karten 168 × 64 mit Ikone, zweizeiligem Namen und Preis. In der Ferne erscheinen nur Ast-Medaillen.
- Programme werden Äste, Große Ziele die Gipfel, Amtsziele die „Leitlinie“ oben.
- Fokus und Technologie schließen mit einer kleinen Abschlussszene im Takt der Wunderszene.
- Ein Baumstil (Pergament) für Fokus und Wissen.

**3. Regionen echt machen (F-5, F-12, F-14, F-15, F-36, F-44)**

```
┌ Lage im Land ─────────────────────────────────────────────┐
│  [Karte: Provinzfarbe = größter Mangel]   HANDLUNGSBEDARF │
│                                           1 Hatay  Wohnen 38│
│                                           2 Burdur Bahn 115%│
│                                           3 Batman Erbe 15 │
│  Ebene: Netze | Erbe | Risiko | Rathaus   [Vorhaben hier →]│
└───────────────────────────────────────────────────────────┘
```

So funktioniert es:
- Startwerte je Provinz kommen aus `provinz_infra.json`, `katastrophe_risiko.json`, dem Wahlergebnis 2024 und dem Stättenkatalog.
- „Wo es akut ist“ folgt dem Thema.
- Das Provinzblatt führt in die Bauakte mit vorgewähltem Ort.
- Großstadt-Bürgermeister werden Figuren: Programme in Oppositionsstädten brauchen Zusammenarbeit oder kosten Kapital.

**4. Die Baureihenfolge ehrlich machen: beginnen, umstellen, pausieren, aufgeben (F-3, F-4, F-16)**

```
 3  F-16 Block 70   40 % · 20 BP/Monat · fertig in 24 Monaten
    [▲ −10 VK]  [▼]  [Pausieren: −0,1 VK/Monat]  [Aufgeben: −2 K, Strafe, Fortschritt weg]
```

So funktioniert es:
- Neue Aufträge kommen ans Ende.
- Aufgeben kostet die versunkenen Kosten und Vertrauen bei den Unternehmern.
- Die Vergabe lässt sich gegen eine Neuausschreibung (Verzug) wechseln.
- Kaufverträge und Abkommen verlassen die Baukapazität und bekommen eigene Engpässe (Rüstungsfertigung, Verhandlung).
- Erst dann haben ▲ und Pausieren einen echten Preis, und „fortsetzen, ändern, beenden“ gilt.

**5. Eine Bildsprache für Bauwerke, Ziele und Bäume, mit genug Motiven (F-26, F-27, F-35, F-42)**

So funktioniert es:
- Die WunderBild-Reihe wird von 19 auf etwa 35 Motive erweitert: Panzer, Drohne, Satellit, Startplatz, Rechenzentrum, Klinik, Schule, Trasse, Hafenkran, Konferenzsaal.
- Je Bereich eine Tageszeit: Land am Morgen, Sicherheit in der Dämmerung, Kultur am Abend, Wissen in der Nacht mit Sternen.
- Ein Kleinbild auf jeder Kachel und jedem Baustellenblock. Fertige Bauten erscheinen auf der Karte als ihr eigenes Motiv statt eines Einheitstempels.
- Die Blaupause bleibt dem Entwurf vorbehalten, so wie heute bei den Großen Zielen.
- Ergebnis: Der Spieler erkennt ein Vorhaben am Bild, bevor er liest. Das ist der wichtigste Schritt von „Akte“ zu „Spiel“.

---

## Nicht prüfen konnte ich

- **Laufende Katastrophenfälle, Versprechen und Hilfskette mit echtem Fall.** In der Startwelt gibt es keinen Fall; ich habe keinen ausgelöst.
- **Fertigstellungsszene eines Wunders** (`WunderFenster`) im Lauf. Ich habe nur den Code gelesen und nicht vorgespult.
- **Ein laufender Programmschritt, ein Großes Ziel im Verfolgen** (Wege, Vertretungen, Versuch) und ein vollendeter Fokus.
- **Die 3D-Karte.** Der kopflose Lauf zeigt nur die vereinfachte 2D-Karte („Dieses Gerät zeigt keine 3D-Grafik“).
- **Ob Netzausbau, Großinvestition und Regionalprogramm für dieselbe Sache ihre Wirkungen addieren** (F-10, Vermutung).
- **Die Türkischfassung**: nur Stichproben, keine vollständige Lesung.
- **Sicherheit › Rüstung.** Das ist der Bereich eines anderen Prüfers. Die Dopplung mit der Baustelle (F-9) habe ich am Code belegt.
