# Befund I – Sprache und Übersetzung quer über das ganze Spiel

Prüfer I · 5. November 2026 · alle drei Sprachen, alle 108 Kataloge je Sprache, Mechanik `i18n/*.ts`, Code unter `game/src`, eigener Rundgang in Deutsch, Englisch und Türkisch.
Werkzeuge und Rohdaten: `/private/tmp/claude-501/-Users-yusufyeneroglu/904f44f4-7b5f-44c2-9447-c69e44ab880b/scratchpad/analyse-I/` (Python-Skripte `s1`–`s8` mit `python3 -I`, Playwright-Rundgang `kriech.cjs`, Ergebnis `kriech_{de,en,tr}.json`). Lange Listen: [befund-I-anhang.md](befund-I-anhang.md).
Für die Ereignistexte habe ich zusätzlich den Ausdruck aller 109 Ereignisvorlagen in Englisch und Türkisch ausgewertet, den Prüfer A erzeugt hat (`scratchpad/analyse-A/dump_{en,tr}.json`).

## 0. Zahlen zuerst

| Messgröße | Deutsch | Englisch | Türkisch |
|---|---|---|---|
| Katalogdateien | 108 | 108 | 108 |
| Schlüssel | 15.438 | 15.438 | 15.438 |
| Schlüssel, die gegenüber Deutsch fehlen | – | **0** | **0** |
| Schlüssel nur in dieser Sprache | – | 0 | 0 |
| Leere Werte | 2 | 2 | 2 |
| Formatfehler (Klammern, plural/select ohne „other“) | 0 | 0 | 0 |
| Werte wortgleich mit Deutsch | – | 213 (davon 11 echte deutsche Reste) | 119 (davon 11 echte Reste) |
| Platzhalter mit anderem Namen als im Deutschen | – | 22 (alle harmlos) | 40 (alle harmlos) |
| Pluralform nur in einer Sprache | – | 6 (davon 2 echte Fehler) | 77 (sprachlich richtig) |
| **Deutsche Texte in der laufenden Oberfläche** (Rundgang, 44 Ansichten) | – | **rund 100 verschiedene Texte aus über 50 Code-Stellen** | ebenso |
| **Ereignisvorlagen mit deutschen Sätzen** (109 Vorlagen) | – | **64 Vorlagen, 315 Texte** | **64 Vorlagen, 365 Texte** |
| Kanten des Politiknetzes ohne Übersetzung | – | 24 von 1.057 | 24 von 1.057 |
| Stellen mit festem `toLocaleString("de-DE")` | 79 | betrifft alle Sprachen | betrifft alle Sprachen |
| Stichprobe 150 Schlüssel (Samen 20261105) | – | 133 richtig · 12 holprig · 4 falsch · 1 maschinell | 139 richtig · 7 holprig · 3 falsch · 1 maschinell |

| Code und Katalog | Anzahl |
|---|---|
| Schlüssel, die der Code aufruft, die im Katalog aber fehlen | **0** (wörtliche Aufrufe und alle Muster `` `präfix.${…}` ``) |
| Wörtlich benutzte Schlüssel | 8.235 |
| Über Muster benutzte Schlüssel | 5.412 |
| Über Präfix-Literal benutzt | 1.087 |
| **Vermutlich tote Schlüssel** | **704** (4,6 %; am meisten in `buehne` 225, `oberflaeche2` 61, `simtexte3` 43, `haushalt` 41, `gesetze` 40) |
| Schlüssel mit Hash-Namen (`ui2.ui.Reich.5950cd8`) | 2.771 (18 %) |
| Satzbruchstücke, die der Code zusammensetzt (lebend) | 212 (108 in `oberflaeche2`) |

| Deutsche Sprachregeln (lebende Schlüssel) | Funde |
|---|---|
| Emojis | 0 echte Emojis; 4 Zierzeichen (✓ ✗ ⚔ ➔) |
| „ae/oe/ue“ statt Umlaut | 0 |
| **„du“ statt „Sie“** | **63** (fast alle im Prolog, dazu Mentor und Weltvergleich) |
| Interne Kürzel und Codenamen | 34 im Katalog (Z1–Z9, WIR-1, WIR-2, B2, „Dossier 1/13“, AP), dazu „Spielschleife“ 13×, „Reich“ als Bereichsname 11× |
| Kommazahl bei Indizes | im Katalog 0, in der Oberfläche 4 Muster (siehe I-12) |
| Doppelte Leerzeichen | 0 |
| Gerade Anführungszeichen | 2 (`ui2.ui.welt.Vermittlung.40284ec`, `sim2.sim.zeitung.065f3a1`) |
| Doppelte Wörter | 0 Fehler (3× „die die“ ist grammatisch richtig) |
| Sätze über 30 Wörter | 30 (Liste im Anhang A8) |
| Amtsdeutsch-Marker | 4 (erfolgt, seitens, bezüglich: 0) |
| Englische Reste in Deutsch | 20 (Slot, Update, Bias, Hub, Briefing, Spoiler, ZOPA, Deconfliction, Exit-Preis, Review) |
| „Stufe“ als Einheit im sichtbaren Text | 128 Schlüssel (Regel 5) |
| Feste Zahl ohne Pluralform („{jahre} Jahre“) | 297 Schlüssel; echte Fehler, wo die Zahl 1 sein kann |
| Tippfehler | 2 sicher: „Archätyp“, „enden“ statt „beenden“ |

**Gutes, das bleiben soll:** Die Katalogmechanik ist sauber gebaut. Kein Schlüssel fehlt, keine Vorlage ist kaputt. Die Formatierung (Fälle im Türkischen mit Vokalharmonie, Plural, Prozent je Sprache, Ländernamen mit Artikel im Deutschen) ist durchdacht. Der deutsche Katalog hält „Sie“, Umlaute und Anführungszeichen fast fehlerlos ein und hat kaum Amtsdeutsch. Die englischen und türkischen Katalogtexte sind überwiegend gut und idiomatisch, das Türkische benutzt die Höflichkeitsform und die Sonderzeichen ı/İ/ş/ğ/ç/ö/ü durchgängig korrekt (0 ASCII-Ersatzschreibungen gefunden).

**Das Hauptproblem liegt nicht im Katalog, sondern daneben.** Ein großer Teil der sichtbaren Texte entsteht im Code (Ereignisse, Verfassungsvarianten, Zentralbank-Optionen, Länderhaltungen, Programmstatus, Chat, Wirkungsnetz) und geht gar nicht durch den Katalog. Wer auf Englisch oder Türkisch spielt, liest deshalb in fast jeder zweiten Entscheidung Deutsch. Regel 11 ist damit klar verfehlt.

## 1. Ansichten

Mein Bereich ist quer: Ich bewerte die drei Sprachfassungen als Ganzes und den Prolog, weil er als einziger Teil eine andere Anrede hat.

**Deutsche Fassung (alle Ansichten, Rundgang 001–041)**
- Frage der Seite: Verstehe ich in klaren, kurzen Sätzen, was hier geschieht?
- Antwort: ja, meistens
- Länge: –
- Noten: Schönheit 2 · Verständlichkeit 2 · Sinn 2 · Spielgefühl 3
- Urteil: Sauberes Deutsch mit „Sie“, aber durchsetzt von Interna („Spielschleife“, „Reich“, „Z4“, „3-Ebenen-Modell“, „Bänder“), „Stufe“ als Pseudo-Einheit und zusammengesetzten Satzbruchstücken.

**Englische Fassung (Rundgang EN, 44 Ansichten)**
- Frage der Seite: Kann ich das Spiel auf Englisch spielen?
- Antwort: teilweise
- Länge: –
- Noten: Schönheit 3 · Verständlichkeit 4 · Sinn 4 · Spielgefühl 4
- Urteil: Der Katalog ist gut, aber Ereignisse, Verfassungsvarianten, Programmstatus, Länderhaltungen, das Wirkungsnetz und der Chat erscheinen auf Deutsch, dazu deutsche Zahlenformate („+2,4“, „37,0 %“).

**Türkische Fassung (Rundgang TR, 44 Ansichten)**
- Frage der Seite: Kann ich das Spiel auf Türkisch spielen, mit den Begriffen der türkischen Politik?
- Antwort: teilweise
- Länge: –
- Noten: Schönheit 3 · Verständlichkeit 4 · Sinn 4 · Spielgefühl 4
- Urteil: Dieselben deutschen Reste wie im Englischen. Dazu kommen Begriffe aus der Zeit vor 2018 („Bakanlar Kurulu“ als Reitername, „tasarı“ für Gesetzentwürfe) und gemischte Anführungszeichen.

**Prolog und Parteigründung (Start eines neuen Spiels)**
- Frage der Seite: Wer bin ich?
- Antwort: ja
- Länge: –
- Noten: Schönheit 2 · Verständlichkeit 2 · Sinn 2 · Spielgefühl 2
- Urteil: Erzählerisch das Beste im Spiel, aber auf Deutsch durchgehend „du“ (54 Schlüssel). Das bricht die feste Regel „Sie“, und das Türkische (`sizi`) ist hier höflicher als die Quelle.

## 2. Befunde

| ID | Ort | Art | Befund | Warum es stört | Vorschlag | Schwere | Aufwand |
|---|---|---|---|---|---|---|---|
| I-1 | Alle Ereignisse › Text, Warum, Antworten · `sim/ereignisse.ts:121`, `:578`, `:913`, `:988` und weitere (182 deutsche Literale in der Datei), `sim/ereignisse-reich.ts` (132), `sim/ereignisse-personen.ts` (70), `-katastrophe` (41), `-verfassung` (37), `-krieg` (35) | Übersetzung | In 64 von 109 Ereignisvorlagen stehen deutsche Sätze, auch in EN/TR: „Ein Erdbeben der Stärke 6,3 erschüttert Adıyaman …“, „Kostet 0,3 % des BIP und 8 Kapital …“, „Der Staat reagiert zu spät …“. Nur die Ämter sind übersetzt: „Interior Minister Nazlı Özgür bittet um Ihre Anweisungen.“ | Die wichtigste Spielschleife, die Entscheidung, ist auf Englisch und Türkisch unlesbar, sogar halb übersetzt im selben Satz. | Alle Ereignistexte in Kataloge `ereignisse_*.json` verlegen (das Muster `evi.*`/`eva.*` gibt es schon). Ein Test lädt EN und TR, öffnet jede Vorlage und prüft auf deutsche Funktionswörter. | 1 | groß |
| I-2 | Kabinett › Gespräch (Chat) · `ui/Chat.tsx:29`, `:30`, `:33`, `:95`, `:112`, `:120`, `:142`, Katalog `sim2.sim.befehle.*` | Übersetzung / Sinn | Das Regelwerk versteht nur deutsche Befehle. EN sagt offen: „Write what you want to do (in German)“. Beispielknöpfe „Was soll ich als Nächstes tun?“, „Gipfeltreffen mit der EU“ und der Status „Regelwerk · KI nicht eingerichtet“ bleiben deutsch. | Eine ganze Ansicht ist für zwei von drei Sprachen nutzlos. | Entweder Befehlswörter je Sprache in den Katalog (Synonymlisten `befehl.<sprache>.*`) oder die Ansicht in EN/TR ausblenden, bis sie übersetzt ist. Beispiele und Status sofort über `t()`. | 1 | groß |
| I-3 | Parlament › Verfassung · `sim/verfassung.ts:131`, `:141`, `:153`, `:192`, `:307`, `:320`, `:330`, `:351` | Übersetzung | Varianten „Wie bisher“, „Weitere Wiederwahl“, „Keine Begrenzung“, „Vier Jahre“, „Sieben Jahre“, „Eng begrenzt“, „Weit gefasst“ erscheinen in EN und TR deutsch. | Der Regler mit benannten Zuständen, sonst vorbildlich, ist in EN/TR ohne Sinn. | Namen über `datenTexte("verfassung", …)` anmelden; die Mechanik dafür steht in `i18n/daten.ts`. | 1 | klein |
| I-4 | Wirtschaft › Zentralbank · `sim/zentralbank.ts:46`, `:371`, `:373`, `:374` | Übersetzung | „Nicht einmischen“, „Vertraulich zur Festigkeit raten“, „Risikoaufschlag +10“, Glaubwürdigkeit „mäßig“, Kosten „keine“ stehen fest im Code. | Entscheidungsoptionen ohne Sprache | Über `t()` mit neuen Schlüsseln `zb.opt.*`, `zb.glaub.*`. | 1 | klein |
| I-5 | Außen › Länder · `sim/welt-sicht.ts:21`, `:26`, `:70`–`:74`, `sim/laender.ts:394`–`:398`, `sim/personen-typen.ts:10`, `ui/ebenen.ts:390`ff. (`LAENDERNAMEN`), `ui/Welt.tsx:35`–`:45`, `:236`, `:353` | Übersetzung | Gruppen „Nachbarn“, „EU-Staaten“, „Golf“, „Turkstaaten“, Haltungen „enger Partner“, „nüchtern“, „kühl“, „feindselig“, Ländernamen „Brasilien“, „Vereinigtes Königreich“, Dimensionen „Handel/Sicherheit/Vertrauen/Konflikt“ und ihre Erklärungen, „★ Beitritt“, Vergleichsreihen „Arbeitslosigkeit“, „Verteidigungsausgaben … % des BIP“ sind in EN/TR deutsch. `LAENDERNAMEN_TR`/`_EN` gibt es in `ui/ebenen.ts`, die Länderliste nutzt sie aber nicht. | Die Außenakte, die meistbesuchte Akte im Krieg und in der Diplomatie, wirkt in EN/TR kaputt. | Haltungswörter und Gruppen über Katalog; die Länderliste immer über die vorhandenen sprachabhängigen Namen ziehen. | 1 | mittel |
| I-6 | Politik › Wirkungsnetz · `ui/NetNavigator.tsx:14`–`:16`, `:34`, `:83`, `ui/NetGraph.tsx:37`, `:85`, `:139`, `ui/NetView.tsx:226`, `data/politiknetz.ts` (24 Kanten ohne Katalogeintrag, etwa `netz.kante.m_mindestlohn.realeinkommen`, `…m_mindestlohn.schattenwirtschaft`) | Übersetzung | Filter „Alle / Maßnahmen / Größen / Probleme“, „nach 3 Mon.“, „erhöht/senkt“ im Tooltip, „Im Kabinett“, „ruhig“, dazu deutsche Begründungen: „Ein höherer Mindestlohn hebt die unteren Einkommen.“ und „Exit-Preis: Das Zurücknehmen kostet …“. | Gerade „Ursache und Wirkung beim Darüberfahren“ (Vorbild Democracy 4) ist in EN/TR gemischtsprachig. | Literale über `t()`; die 24 fehlenden Kanten ergänzen (alle Funktionen `ef`/`eef`; vermutlich nachträglich eingefügt). Der Test `datentexte.test.ts` sollte auch das Netz prüfen. | 1 | klein |
| I-7 | Forschung › Programme · `ui/politik/ProgrammeAkte.tsx:26`–`:39`, `:66`, `:227` | Übersetzung | Status „wartet auf einen früheren Schritt“, „Voraussetzung fehlt“, „Schritt bereit“, „noch nicht begonnen“, „Läuft gerade“, „Als Nächstes“, „Monat/Monate“ fest im Code; im Rundgang in EN/TR 40-mal sichtbar. | Die Stempel der Programmleiste sind in EN/TR deutsch. | Schlüssel `prog.status.*`, Monate über `ub.preis.monate`. | 2 | klein |
| I-8 | Weitere fest verdrahtete Stellen, alle im Rundgang EN/TR gesehen | Übersetzung | `sim/spiel.ts:102`–`:104` (Schwierigkeitsgrade „Entspannt/Normal/Hart“ samt Beschreibung auf dem Startbildschirm), `sim/spiel.ts:196` und `sim/prolog.ts:255`, `:558` (Zusagen „Der YENİ Parti wurden zwei Ministerien zugesagt“, „Die AKP erwartet für ihre Duldung …“), `sim/ereignisse.ts:913`, `:988` (Kopfleisten-Meldungen „YENİ meldet sich“, „Der Wiederaufbau im Erdbebengebiet“), `sim/fraktionen.ts:97`–`:100` (Profil „national-konservativ, bisherige Regierungspartei“), `ui/Parliament.tsx:30`, `ui/parlament/ParlamentKopf.tsx:132` („Regierungsmehrheit“, „es fehlen …“, „mit Duldung …“), `ui/Reich.tsx:352`, `:546` („reformorientiert“, „…: Ansicht“), `ui/Personen.tsx:69` („niemand“), `ui/Erklaerung.tsx:98` und `ui/wirtschaft/Folgen.tsx:10` („steigt/sinkt“), `ui/wirtschaft/Diagramm.tsx:161` („von … im … auf …“), `ui/reich/WunderBild.tsx:344` („Baustelle, 75 Prozent fertig“, „Gemalte Ansicht des Bauwerks“), `ui/reich/Pflege.tsx:56`–`:57`, `sim/katastrophe.ts:148` und `ui/atlas/karten-features.ts:36` („Erdbeben: Nordanatolische Verwerfung“), `sim/grossprojekt.ts:319`, `:546` und `sim/reich.ts:1204` („in 8 Provinzen“, „Russland: Vertrauen −6“), `sim/handeln.ts:435` („Dafür braucht der Präsident ein Gesetz …“), `data/streitkraefte.ts:59`, `:62` („Triebwerk“, „Stahlkuppel“), `data/medien.ts:59`, `:88` („Staatlicher Rundfunkverbund“), `ui/Wahlkampf.tsx:175`, `:225`–`:226` („TV-Duell“, „Umfrage-Ticker“), `ui/Zeitung.tsx:313`, `:483` („Befragte“, „Methode“, „EIL“), `ui/ProvinceCard.tsx:89`, `:152` („je km²“, „Im Bau“), `ui/politik/UmsetzungAkte.tsx:90` und `ui/reich/Regional.tsx:68` („% BIP“), `ui/parlament/AbstimmungsKarte.tsx:143` („Nein“), `ui/welt/EuDossier.tsx:68` („Zypern-Kopplung“), `ui/gueter/TransportKarte.tsx:94` („Mio. t“), `ui/personen/GespraechSzene.tsx:51`–`:52` („1 Thema“, „2 Ansatz“; Schritt 3 steht dagegen im Katalog), `ui/SpeicherDossier.tsx:73`, `:84`, `:88`, `:117`, `ui/speicher.ts:245`, `:368` (Fehlermeldungen beim Laden) | Wo Englisch oder Türkisch gewählt ist, steht mitten im Satz Deutsch. | Je Datei die Literale in den Katalog des Bereichs ziehen. Als Wache: Ein Test rendert jede Akte in EN und TR (wie mein `kriech.cjs`) und schlägt bei deutschen Funktionswörtern oder ä/ö/ü/ß außerhalb von Eigennamen fehl. | 1 | mittel |
| I-9 | Zahlenformat · 79 Stellen `toLocaleString("de-DE")`, etwa `ui/Zeitung.tsx:38`, `ui/Welt.tsx:50`, `ui/NetView.tsx:38`, `ui/ProvinceCard.tsx:23`, `:67`, `ui/politik/Politik.tsx:24`, `ui/EreignisFenster.tsx:70`, `ui/SpeicherDossier.tsx:46`, `sim/ereignisse.ts:121` | Übersetzung | Englisch zeigt „Water supply +2,4 … (today 39)“, „3,7 % (2025)“, „Policy rate: von 37,0 % im Jun 2027“. Uhrzeiten und Daten im Speicherdialog sind fest deutsch („… Uhr“). | Englische Spieler lesen Kommazahlen als Tausender; „+2,4“ wirkt wie ein Fehler. | Überall `zahl()` und `datum()` aus `i18n/index.ts` nehmen; `toLocaleString("de-DE")` per Lint-Regel verbieten. | 2 | mittel |
| I-10 | Prolog, Start, Mentor · 63 Schlüssel `prolog.*`, `biografie.*`, `start.*`, `mentor.ruhig.*`, `ui2.ui.Erklaerung.22265ed` | Sprache | Durchgehend „du“: „Wer bist du?“, „Womit hast du dein Geld verdient?“, „Klicke eine Zahl … wenn du etwas wissen willst“, „er ändert sich mit deinem Spielstand nicht“. | Feste Regel 10 („Sie“). Der Wechsel von „du“ im Prolog zu „Sie“ im Amt wirkt wie zwei Spiele. | Auf „Sie“ umstellen, siehe Wortprüfung. Bewusst einen Erzählton halten: „Wo sind Sie aufgewachsen?“ | 2 | mittel |
| I-11 | Interne Begriffe im sichtbaren Text · `ui.Reich.186589c`, `ui.Waehler.847ba01`, `ui.Welt.4f623c0`, `ui.Zeitung.b1ebc59` und 9 weitere „Ohne Spielschleife …“; `sk.e.k.knopf` „Zum Reich“, `marken.klick.lage` „Akte Reich öffnen“, `ui2.ui.katastrophe.Faelle.1adca3c` „Baureihenfolge im Reich“; `sim2.sim.folgen.*` „Z1“–„Z9“; `wk.6c080c8` „Kalibrierung WIR-1“; `wk.2e24491` „(WIR-2)“; `sim2.data.welt-institutionen.5b2f90d` „(Dossier B2)“; `sim2.sim.pakte.cbf299c` „(Dossier 1/13)“; `ui.reich.Schaetzblatt.6cf7fa3` „Interpreter“; `…8d30067` „3-Ebenen-Modell“; `…61033b9` „Bagdadbahn-Regel“; Wahlkampf „AP“ (`wahlreise.start`, `ui2.ui.Wahlkampf.2651068`); `ui.VergleichBalken.fbd262a` und `ui2.ui.Erklaerung.7eb3571` „(Lücke)“ | Sprache | Codenamen, Arbeitspakete und Recherche-Kennungen stehen in der Oberfläche. „Reich“ ist der Werkname der Kultur- und Bauansicht, im Deutschen zudem belastet. | Regel 10 (keine internen Kürzel). Spieler verstehen „Z4“ nicht und lesen „Reich“ falsch. | „Reich“ überall durch „Kultur und Bau“ ersetzen, Z-Kennungen und WIR-Nummern streichen, „AP“ ausschreiben („Aktionspunkte“), „Spielschleife“-Sätze durch einen neutralen Leerzustand ersetzen. | 2 | klein |
| I-12 | Kommazahlen bei Indizes · Rundgang 005, 007; `ui/NetView.tsx` (Index-Satz), Parlament „Stufe 30,0“, Infrastruktur „+2,4 in 8 Provinzen (heute 39)“, Zentralbank „Glaubwürdigkeit −3,0 Punkte“, Wählerkoalition „+9,5 bis zur Wahl“ | Zahl | Im Wirkungsnetz steht „(Index 0–100; beim Amtsantritt 50,0)“, im Parlament „Stufe 30,0“. | Regel 10: Indizes ohne Kommastelle. Eine Nachkommastelle täuscht Genauigkeit vor. | Index-Werte und -Veränderungen auf ganze Zahlen runden; Prozentpunkte behalten eine Stelle. | 3 | klein |
| I-13 | Englisch: Plural und Auswahl · `sdd.willkommen`, `sdd.amtszeit`, `ini.paket.laufzeit` (de), `akte.b.lage.vertragMeta` (de), `akte.fragen.zuerst` (de) | Logik / Sprache | EN `sdd.willkommen` hat nur `other {in # months}`: Bei einem Monat steht „in 1 months“. EN `sdd.amtszeit` nutzt `#` in `select`, das dort nicht ersetzt wird (`format.ts` ersetzt `#` nur in `plural`): Bei der 3. Amtszeit steht „#th Term“. Deutsch „Laufzeit {jahre} Jahre“ und „fällig in {tage} Tagen“ ohne Pluralform. | Sichtbare Grammatikfehler an Stellen, die jeder sieht (Begrüßung, Schreibtischkopf). | EN `=1 {in 1 month}` ergänzen; `sdd.amtszeit` als `{amtszeit, plural, one {#st} two {#nd} few {#rd} other {#th}}` mit `selectordinal` oder als feste Wörter; Deutsch mit `plural`. | 2 | klein |
| I-14 | Englisch/Türkisch: freie Umdichtung statt Übersetzung · `fokus.f.fok_wis_ki_zentrum.text`, `fokus.f.fok_wis_halbleiter.text`, `fokus.f.fok_ges_versoehnung.titel` (Stichprobe #11, #17, #29) | Übersetzung | DE „Herstellung eigener Silizium- und Galliumnitrid-Chips beendet die Abhängigkeit …“ → TR „… Gebze ve Ankara'daki temiz odalarda seri üretime geçer“ (erfundene Orte), EN „ensures strategic supply chain immunity“. | Inhalte weichen je Sprache ab; die Türkisch-Fassung erfindet Fakten (Regel 6). | `fokus.json` (49 KB) in EN und TR vollständig gegen Deutsch neu abgleichen; Vermutung: Diese Datei wurde mit einem anderen Werkzeug übersetzt als der Rest. | 2 | mittel |
| I-15 | Türkisch: Begriffe der Verfassung nach 2017 · `buehne.tab.personen`, `vorlage.quelle.kabinett`, `ui2.ui.Personen.7a193e6` = „Bakanlar Kurulu“ (Rundgang TR: Reiter „Kabine ve idare › Bakanlar Kurulu“); „tasarı“ 89 Schlüssel gegen „kanun teklifi“ 4; „gensoru“ 1; „KHK“ 1 | Übersetzung | Seit 2018 gibt es keinen „Bakanlar Kurulu“ mehr, sondern das „Cumhurbaşkanlığı Kabinesi“. Gesetzentwürfe heißen seit 2017 nur noch „kanun teklifi“, weil nur Abgeordnete sie einbringen; „tasarı“ ist der alte Regierungsentwurf. KHK sind abgeschafft (heute CBK). Das Glossar führt „Bakanlar Kurulu“ und „Gensoru“ noch als gültig. | Türkische Spieler sehen sofort, dass das Spiel die geltende Verfassung nicht kennt. | „Kabine“ oder „Cumhurbaşkanlığı Kabinesi“; „kanun teklifi“ statt „tasarı“; „Cumhurbaşkanlığı Kararnamesi (CBK)“; Glossar Abschnitt 1 berichtigen. | 2 | klein |
| I-16 | Türkisch: Anführungszeichen und Anrede · 145 TR-Werte mit „…“, 117 mit “…”; informelle Imperative in ganzen Sätzen: `kg.finanzierung` „bütçeyi incele“, `rp.veraltet` „kontrol et“, `rn.anliegen.erledigt` „ölçümlere bak“, `wv.nachfolgerGebucht` „sana ait“, `ra.sprecher.ich` „Sen:“ | Übersetzung | Deutsche Anführungszeichen im Türkischen; vereinzelt „sen“ statt „siz“. | Uneinheitlich, wirkt maschinell. | Im Türkischen nur “…”; ganze Sätze mit „-in/-ın“ („inceleyin“, „kontrol edin“). Kurze Knopftexte im bloßen Imperativ („Kaydet“) dürfen bleiben. | 3 | klein |
| I-17 | Englisch: Türkiye/Turkey und Rechtschreibung · 48 Werte „Turkey“, 128 „Türkiye“; `ui.Kartenlegende.88f5f1e` zeigt im Deutschen „Türkiye“, sonst „Türkei“; „per cent“ 72 gegen „percent“ 105; „-ise“ 172 gegen „-ize“ 30 | Konsistenz | Zwei Namen für das eigene Land, zwei Schreibweisen für Prozent, britisch und amerikanisch gemischt (Locale ist en-GB). | „Gleiches muss gleich aussehen“, auch in der Sprache. | Englisch: „Türkiye“ (offizieller UN-Name, Glossar ergänzen), „per cent“, „-ise“. Deutsch: überall „Türkei“. | 3 | klein |
| I-18 | Uneinheitliche Begriffe im Deutschen (lebende Schlüssel gezählt) | Konsistenz | „Kapital“ 345 / „Politisches Kapital“ 58, zugleich „Kapital kehrt zurück“, „Kapitalverkehr“, „Kapitaleinkommen“ für Geldkapital; „Akte“ 26 / „Dossier“ 13 / „Mappe“ 4; „Ressort“ 123 / „Ministerium“ 33; „Lager“ 144 / „Koalition“ 66 / „Bündnis“ 68; „Zustimmung“ 79 / „Rückhalt“ 79 / „Ansehen“ 71; „Präsidialamt“ 15 / „Kanzlei“ 3 / „Palast“ 10; „Erlass“ 25 / „Dekret“ 5; „Sichern“ / „Speichern“ / „Slot“ / „Speicherplatz“; „Wählerkoalition“ / „Koalition der Wähler“ (`ui.Waehler.64eb6ca` / `.8ac7f95`); „Verdeckte Operationen“ / „Verdeckte Optionen“ (`ui2.ui.Welt.8edbc59`) | Konsistenz | Für dieselbe Sache stehen mehrere Wörter, und dasselbe Wort steht für zwei Sachen (Kapital). | Spieler fragen sich, ob „Rückhalt“ und „Zustimmung“ zwei Werte sind, und ob „Kapital kehrt zurück“ ihr politisches Kapital meint. | Regeln siehe unten; Glossar um einen Abschnitt „Spielbegriffe“ erweitern. | 2 | mittel |
| I-19 | Akten-Reiter · `aktennavigation.json` `akneu.*.personen` und `akneu.*.vorgaenge` | Konsistenz | Derselbe Reiterplatz heißt je Bereich anders: „Verantwortliche“, „Wirtschaftskabinett“, „Politische Akteure“, „Führung & Zuständigkeit“, „Diplomatie & Dienste“, „Zuständige Minister“, „Forschungskabinett“, „Zuständige Akteure“; ebenso „Laufende Vorhaben“ / „Bau & Umsetzung“ / „Regierungsvorhaben“ / „Gesellschaftliche Vorhaben“. | Gleiche Reiter sehen verschieden aus, die Orientierung leidet. | Überall „Lage · Entwicklung · Personen · Vorhaben“; der Bereich steht schon im Aktentitel. | 2 | klein |
| I-20 | Satzbruchstücke · 212 lebende Schlüssel, etwa `ui2.ui.Beschlussbuch.d2be9ba` „Ihr Lager hat“ + `…e711bb3` „von 600 Sitzen (…). Für ein Gesetz braucht es {p1}. Bei einer Abstimmung werden etwa“ + `…aeef1bf` „Ja-Stimmen erwartet …“; `ui2.ui.personen.Umfeld.3bd0592` „gerade umtreibt“; `ui2.ui.Welt.e54b787` „ und ein Stück auch auf das zu {p0}“; `ui2.ui.minister.Posteingang.5efa51c` „Das {p0}ressort …“ | Übersetzung | Sätze werden im Code aus Stücken gebaut. Die Wortstellung ist dann deutsch, im Türkischen (Verb am Ende) wird sie falsch. | Übersetzer können keine natürlichen Sätze schreiben; das Türkische klingt dadurch maschinell. | Je Satz ein Schlüssel mit Platzhaltern; JSX-Hervorhebungen über ein Markup im Text („<b>{n}</b>“) statt durch Zerschneiden. | 2 | mittel |
| I-21 | Hash-Schlüssel · 2.771 Schlüssel wie `ui2.ui.Reich.5950cd8`, `sim2.sim.befehle.1ddce1b` | Konsistenz | Der Schlüssel verrät nicht, wo und was der Text ist. Gleiche Texte haben je Datei eigene Schlüssel (`…28d438e` „Kapital“ 7-mal). | Wartung und Übersetzung werden teuer; tote Schlüssel lassen sich schwer erkennen. | Schrittweise auf sprechende Schlüssel umstellen (`reich.position`, `befehl.hilfe.verstanden`); gemeinsame Wörter einmal in `bausteine.json`. | 3 | groß |
| I-22 | Tote Schlüssel · 704 (Anhang A5), darunter `buehne.menu.*` (16), `gesetz.ui.*` (40), `haushalt.ui.*` (38), `akte.reiter.*`, `nav.mehrheit.*` | Konsistenz | Vermutlich Reste früherer Oberflächen. Vorsicht: Bei Schlüsseln, die über Variablen aus Daten entstehen, kann die Erkennung irren. | Ballast verteuert jede Übersetzungsrunde (rund 5 % aller Texte in drei Sprachen). | Nach Gegenprobe mit `grep -rn "<schlüssel-ende>"` löschen; einen Test „jeder Schlüssel wird benutzt“ mit Erlaubnisliste für Datenschlüssel einführen. | 3 | mittel |
| I-23 | Tippfehler · `ui2.ui.Wahlkampf.af38990`, `sk.w.sturz.warum` | Sprache | „was den Archätyp der Provinz prägt“; „Nach {m} Monaten in Folge enden Massenproteste die Amtszeit.“ | Fehler in sichtbaren Hinweisen | „Archetyp“; „… beenden Massenproteste die Amtszeit.“ | 2 | klein |
| I-24 | Englische Reste im Deutschen · Anhang A9; dazu `ui2.ui.welt.Vermittlung.63606da` „ZOPA“, `…6821fd1` „Spoiler“, `sim2.sim.laender.d1748a4` „Deconfliction-Gespräche“, `ui2.ui.NetView.c707cb1` „Exit-Preis“, `ui.wirtschaft.Zentralbank.88e14cd` „Reviews“ | Sprache | „Slot“, „Update“, „Bias“, „Hub“, „Briefing“, „ZOPA“ stehen in der deutschen Fassung. | Regel 10 (keine englischen Reste). | „Speicherplatz“, „Modernisierung“, „Verzerrung“, „Drehkreuz“, „Lagebericht“, „Einigungsspielraum“, „Störer“, „Abstimmungsgespräche“, „Ausstiegspreis“, „Überprüfungen“. | 3 | klein |
| I-25 | Zierzeichen · `buehne.gesichert` „Gesichert ✓“, `wd.prefPlus` „✓ …“, `wd.prefMinus` „✗ …“, `ui2.ui.Meldungen.36da8f4` „➔“, `ui2.ui.Welt.34760b0` „⚔ … — zum Dossier“ | Sprache | Keine echten Emojis, aber Dingbats aus anderen Schriften. | Uneinheitlich zu den gezeichneten Ikonen (`ui/icons.tsx`). | ✓/✗ als Ikone `haken`/`kreuz`, „➔“ als „→“ wie sonst, „⚔“ durch die Ikone „Krieg“ und „zur Akte“. | 3 | klein |
| I-26 | Glossar · `game/src/i18n/glossar.md` | Konsistenz | Das Glossar deckt nur Staats- und Fachbegriffe ab, nicht die Spielbegriffe (Kapital, Akte, Lager, Duldung, Zusage, Vorlage, Erlass, Aufmerksamkeit, Belastung, Verwaltungskraft, Baupunkte). Es führt veraltete Türkisch-Begriffe (siehe I-15) und widerspricht der Praxis: Glossar „Raison d'État“ / „Devlet Aklı“ als Titel, Katalog `rn.marke` in EN und TR „Staatsräson“. | Ohne verbindliche Spielbegriffe entstehen die Doppelungen aus I-18 und I-19. | Abschnitt 7 „Spielbegriffe“ mit je einer DE/EN/TR-Form; Spieltitel festlegen (Vorschlag: überall „Staatsräson“ als Marke, Untertitel übersetzt). | 2 | klein |
| I-27 | Kodierte Zahl „301“ · `ui2.ui.Beschlussbuch.086dccd` „301: Mehrheit“, `ui2.ui.NetView.7ce9899` „nötig 301“, `eo.gesetzStimmen` „{n} / 301“ | Logik | Die Mehrheit steht fest im Text, sonst kommt sie als `{schwelle}`/`REGELN.mehrheit`. | Ändert sich die Regel (Verfassungsreform, Sitzzahl), stimmt der Text nicht mehr (Regel 7). | Immer `{schwelle}` einsetzen. | 3 | klein |
| I-28 | Desktop-Spiel sagt „Tippen“ · `ui.reich.WunderFenster.05f104d`, `…cd0618a`, `ui2.ui.parlament.AbstimmungsKarte.0d2974b` | Sprache | „Tippen überspringt die Bewegung“ | Auf dem Rechner klickt man. | „Klicken überspringt die Animation.“ | 3 | klein |

### Regel für einheitliche Begriffe (Vorschlag, mit Glossar abgleichen)

| Sache | Deutsch | Englisch | Türkisch | Nicht mehr |
|---|---|---|---|---|
| Ressource für Handlungen | **Politisches Kapital**, kurz am Preisschild **Kapital** | Political capital / capital | Siyasi sermaye / sermaye | „PK“, „PC“, „SS“, „Kapitaleinkommen“; Geldkapital heißt „Geld“, „Investitionen“, „Anlegergeld“ |
| Bereichsfenster | **Akte** | file | dosya | „Dossier“, „Fenster“, „Politikfenster“, „Parlament-Fenster“, „Reich“ |
| Was man einstellt | **Maßnahme**; beschlossen als **Gesetz** oder **Erlass** | measure; law / decree | önlem; kanun / Cumhurbaşkanlığı kararnamesi | „Politik“ als Zählwort, „Dekret“, „Vorhaben“ für Maßnahmen (Vorhaben nur für Bauprojekte) |
| Fachministerium | **Ministerium**, Leitung **Minister/Ministerin**; „Ressort“ nur in festen Wendungen („Ressortsorge“) | ministry | bakanlık | Wechsel im selben Satz |
| Staatsoberhaupt | **Präsident/Präsidentin** | President | Cumhurbaşkanı | „Staatsoberhaupt“ (`ui2.ui.SpeicherDossier.2529e52`), „Devlet Başkanı“ (TR, 4×) |
| Eigene Mehrheit | **Regierungslager** (mit Partnern und Duldung) | governing bloc | hükümet cephesi / iktidar bloku | „Koalition“ für das Lager; „Koalition“ nur für den förmlichen Vertrag |
| Stimmung der Bevölkerung | **Zustimmung** (Prozent) | approval | onay | „Rückhalt“ als Synonym; „Rückhalt“ nur für Partner und Fraktionen |
| Amtssitz | **Präsidialamt** | Presidency | Cumhurbaşkanlığı | „Kanzlei“, „Palast“ als Synonym |
| Spielstand | **sichern**, **Speicherplatz** | save, slot | kaydet, kayıt yuvası | „Slot“, „Schnellspeichern“ neben „Sichern“ |
| Land | **Türkei** | Türkiye | Türkiye | DE „Türkiye“, EN „Turkey“ |

## 3. Wortprüfung (Deutsch, Schlüssel: alt → neu)

Vollständig gelesen: `navigation`, `kopf`, `titel`, `schreibtisch`, `oberflaeche`, `oberflaeche2`, `bausteine`, `akte`, `aktennavigation`, `uebersicht`. Dazu die Funde der Werkzeuge aus allen Katalogen.

**Navigation, Kopf, Titel**
- `nav.rechtTitel`: „Parlament & Gesetze · Mehrheiten, Gesetze & Recht“ → „Parlament und Gesetze · Mehrheiten und Recht“ („Gesetze“ doppelt)
- `nav.regierungTitel`: „Kabinett & Verwaltung · Regierung, Zusagen & Behörden“ → „Kabinett und Verwaltung · Minister, Zusagen, Behörden“
- `nav.wissenTitel`: „Forschung & Ziele · Fokus, Wissen & Programme“ → „Forschung und Ziele · Schwerpunkte, Wissen, Programme“
- alle `nav.*` und `akneu.*`: „&“ und „und“ gemischt → einheitlich „und“ (oder überall „&“)
- `kopf.menue.werteHinweis`: „Zustimmung, Kapital und Parlament stehen immer dort; dazu höchstens zwei weitere.“ → „Zustimmung, Kapital und Parlament stehen immer in der Kopfleiste. Sie können zwei weitere Werte dazunehmen.“
- `kopf.menue.werteVoll`: „Schon zwei weitere gewählt: erst einen abwählen.“ → „Sie haben schon zwei weitere Werte gewählt. Wählen Sie zuerst einen ab.“
- `titel.fehler_letzter`: „… eine Spielstanddatei oder einen Slot.“ → „… eine Spielstanddatei oder einen Speicherplatz.“
- `titel.weitester`: „Weitester Stand“ → „Am weitesten gespielter Stand“
- `titel.frueher_hinweis`: „Das Spiel hebt den weitesten Stand und die letzten Sicherungen auf, damit ein Ladevorgang nie Fortschritt kostet.“ → „Das Spiel bewahrt den am weitesten gespielten Stand und die letzten Sicherungen auf. So verlieren Sie beim Laden nie Fortschritt.“

**Akte, Aktennavigation, Übersicht, Bausteine**
- `akneu.*.personen`: acht verschiedene Namen → „Personen“
- `akneu.*.vorgaenge`: vier verschiedene Namen → „Vorhaben“
- `akte.b.kern.bereitschaft`: „Bereitschaft Heer“ → „Einsatzbereitschaft des Heeres“
- `akte.b.reihe.groll`: „Groll der Milieus (Mittel)“ → „Groll der Milieus (Durchschnitt)“
- `akte.b.lage.vertragMeta`: „Laufzeit {jahre} Jahre“ → „Laufzeit {jahre, plural, one {# Jahr} other {# Jahre}}“
- `akte.b.lage.konfliktMeta`: „{phase} · Frontlage {front}“ → „{phase} · Front {front} von 100“
- `akte.b.lage.zuInstrumenten`: „Zu den Ansichten und Handlungen dieses Bereichs“ → „Was Sie hier tun können“
- `akte.fragen.zuerst`: „fällig in {tage} Tagen“ → „fällig in {tage, plural, one {# Tag} other {# Tagen}}“
- `akte.kapital.erklaerung`: „bis 20 ins Minus geht es auf Pump“ → „Bis 20 Punkte ins Minus können Sie es vorstrecken.“
- `akte.kapital.grund` und `ui2.ui.Reich.4183cf9`: „Grundeinkommen“ → „Grundzufluss“ (Grundeinkommen ist eine Sozialpolitik)
- `akte.vorgaenge.platzhalter`: „Hier stehen bald die Vorgänge dieses Bereichs …“ → Reiter ausblenden, bis er Inhalt hat (Versprechen ohne Wirkung, Regel 7)
- `ub.preis.bip`: „{bip, number, 3} % BIP“ → „{bip, number, 1} % des BIP“ (drei Stellen täuschen Genauigkeit vor)
- `ub.behoerde.baut`: „Ausbau {achse}, noch {monate} Mon.“ → „Ausbau {achse}, noch {monate, plural, one {# Monat} other {# Monate}}“

**Schreibtisch**
- `sk.w.sturz.warum`: „Nach {m} Monaten in Folge enden Massenproteste die Amtszeit.“ → „Nach {m} Monaten in Folge beenden Massenproteste die Amtszeit.“
- `sk.w.angespannt.warum`: „Die Vorschau der Stimmen streut breiter, und manche Einbringung verzögert sich. Weniger parallel, mehr Luft: …“ → „Ihre Stimmenschätzungen werden ungenauer, und manche Gesetze kommen später ins Parlament. Nehmen Sie sich weniger auf einmal vor; die Aufmerksamkeit lädt sich täglich auf.“
- `sk.w.inflation.text`: „… {d, number, 1} Punkte über …“ → „… {d, number, 1} Prozentpunkte über …“
- `sk.w.putsch.text`: „Unruhe im Offizierskorps (Stufe {stufe} von 3).“ → benannte Zustände: „Gerüchte“ / „Verschwörung“ / „Putsch droht“
- `sk.e.v.titelStufe`: „{name}: Stufe {jetzt} auf {ziel}“ → echte Einheit aus den Skalen („{name}: {jetzt_wort} → {ziel_wort}“)
- `sk.e.v.kosten`: „{bip, prozent, 2} BIP im Jahr“ → „{bip, prozent, 2} des BIP im Jahr“
- `sk.e.n.text`: „{k} Kapital liegen brach; Kapital, das nicht arbeitet, bringt nichts. … Kapitaleinkommen.“ → „Sie haben {k} Kapital übrig. {name} stärkt das Vertrauen in die Regierung und damit Zustimmung und den monatlichen Kapitalzufluss.“
- `sk.e.k.knopf`: „Zum Reich“ → „Zu Kultur und Bau“
- `sk.ui.vfText`: „… Entscheidung im Reich …“ → „… Entscheidung über Bauvorhaben …“
- `sk.ui.keinBriefing`: „Ohne Spielschleife gibt es kein Briefing.“ → „Das Tagesbriefing erscheint, sobald Ihre Amtszeit läuft.“
- `mf.nutzen.kaum`: Leerzeichen am Ende entfernen
- `mf.knopf.kenntnis`: „Zur Kenntnis“ → „Zur Kenntnis nehmen“

**Oberfläche (ui.*)**
- `ui.Reich.186589c`, `ui.Waehler.847ba01`, `ui.Welt.4f623c0`, `ui.Zeitung.b1ebc59`, `ui.minister.BefehlBlatt.128d3df`, `ui.politik.ProgrammeAkte.d7b492f`, `aussen.grund.ohne_spiel`, `infra.fehler.kein_spiel`, `medien.ui.ohne_spiel`, `mfl.x.kein_spiel`: „Ohne Spielschleife gibt es kein …“ → „Diese Ansicht steht bereit, sobald Ihre Amtszeit begonnen hat.“
- `ui.NetView.2ab5dc0`: „0 gibt es nicht“ → „0 = abgeschafft“
- `ui.NetView.ab3b29f`: „100 so viel wie möglich“ → „100 = voll ausgebaut“
- `ui.NetView.6b26667`: „Kommt aus dem Wirtschaftsmodell.“ → „Diese Größe berechnet die Wirtschaft selbst; Sie wirken über ihre Ursachen.“
- `ui.Reich.9e48137`: „Wer sitzt, prägt die Unabhängigkeit“ → „Wer in den Gerichten sitzt, bestimmt ihre Unabhängigkeit“
- `ui.Reich.119c095`: „… verdrängt ehrlich das überholte Vorhaben.“ → „… schiebt das überholte Vorhaben nach hinten.“
- `ui.Reich.aaa550c`: „Man liest sie an den Größen ab, die sie prägen“ → „Ihre Wirkung zeigt sich in den Werten, die sie verändern“
- `ui.Waehler.8ac7f95`: „Ihre Koalition der Wähler“ → „Ihre Wählerkoalition“ (wie `.64eb6ca`)
- `ui.Waehler.c2c1ff6`: „Jede Maßnahme, rauf oder runter, um 20 Stufen durchgerechnet, …“ → „Für jede Maßnahme ist durchgerechnet, was ein deutlicher Schritt nach oben oder unten bewirkt. Die Wirtschaft ist dabei nicht berücksichtigt; die Vorschau rechnet sie mit.“
- `ui.Wahlkampf.be569cb`, `ui2.ui.Wahlkampf.1663da3`: „Haus-Effekt“ → „Hauseffekt“
- `ui.Verfassung.73d21b7`: „Ein Nein kostet schweres Vertrauen …“ → „Ein Nein kostet viel Vertrauen …“
- `ui.Verfassung.f354624`: „… Erst nach einer Wiederwahl trägt das Land eine neue Frage.“ → „… Eine neue Verfassungsfrage ist erst nach einer Wiederwahl möglich.“
- `ui.Handlungsfeld.14f0951`: „… stehen schon weit ausgebaut.“ → „… sind schon weit ausgebaut.“
- `ui.KiEinstellungen.6bc1728`: „Nimmt, was eingerichtet ist“ → „Nutzt den eingerichteten Anbieter“
- `ui.KiEinstellungen.a01ed8b`: „… den der Entwicklungsserver kennt …“ → „Automatisch nutzt zuerst einen Schlüssel auf dem Rechner, dann einen, den Sie unten eingetragen haben.“
- `ui.personen.NachfolgeAuswahl.61ae3ec`: „Gesinnung Ihnen gegenüber“ → „Haltung zu Ihnen“
- `ui.Personen.8c5dcf6`: „In dieser Partie gibt es kein Umfeld.“ → „Noch ist niemand in Ihrem Umfeld.“
- `ui.reich.Schaetzblatt.753fd68`: „Bei der Annahme fallen die Würfe: Wirkungen und Verkehre werden im Band verwirklicht …“ → „Mit der Annahme steht fest, wie stark das Vorhaben wirkt. Ob es teurer wird, zeigt sich erst beim Bau.“
- `ui.reich.Schaetzblatt.8d30067`, `ui.reich.VorhabenKarte.ecf3030`: „… Schätzungen aus dem 3-Ebenen-Modell …“ → „… Schätzungen …“
- `ui.reich.Schaetzblatt.6cf7fa3`: „Vom Interpreter ergänzter Korridor, nicht von Ihnen genannt“ → „Vom Stab ergänzte Strecke, nicht von Ihnen genannt“
- `ui.reich.Schaetzblatt.61033b9`: „… (Bagdadbahn-Regel).“ → Klammer streichen
- `ui.reich.Schaetzblatt.73cad39`: „(aus der Mitte der Bänder)“ → „(mittlere Schätzung)“
- `ui.welt.Vermittlung.a018877`: „Kein Konkurrenzspiel lässt einen Staat zwischen zwei Dritten vermitteln. …“ → „Ankara kann zwischen zwei Streitparteien vermitteln, weil es zu beiden einen Draht hat. Die Lage muss reif sein, Störer arbeiten dagegen, und eine Einigung hält nur, wenn jemand sie garantiert.“
- `ui.welt.Dienst.3515c0b`: „Verdeckte Operationen sind Spielmechanik: …“ → „Verdeckte Operationen kosten Kapital …“
- `ui.welt.KriegDossier.c4f3a82`: „Treiber der Eskalation; folgt der Konflikt-Dimension“ → „Treibt die Eskalation; steigt mit dem Konflikt zum Land“
- `ui.welt.KriegDossier.fb1d897`: „… (Erschöpfungsuhr) …“ → Klammer streichen
- `ui.wirtschaft.Diagramm.b2a60be`, `ui.wirtschaft.Wirkung.b2a60be`: „Die Kanzlei rechnet …“ → „Das Präsidialamt rechnet …“
- `ui.wirtschaft.Zentralbank.88e14cd`: „… nach drei Reviews …“ → „… nach drei Überprüfungen …“
- `ui.Kartenlegende.88f5f1e`: „Türkiye“ → „Türkei“
- `ui.VergleichBalken.fbd262a`: „… hinterlegt (Lücke).“ → „… hinterlegt.“

**Oberfläche 2 (ui2.ui.*)**
- `ui2.ui.Erklaerung.22265ed`: „… er ändert sich mit deinem Spielstand nicht.“ → „… er ändert sich mit Ihrem Spielstand nicht.“
- `ui2.ui.Erklaerung.7eb3571`: „… keinen internationalen Vergleich (Lücke).“ → „… keinen internationalen Vergleich.“
- `ui2.ui.Wahlkampf.af38990`: „… was den Archätyp der Provinz prägt, trägt weiter.“ → „Was den Charakter der Provinz trifft, wirkt stärker.“
- `ui2.ui.Wahlkampf.b55036a`: „Bias {p0}“ → „Verzerrung {p0}“
- `ui2.ui.Wahlkampf.2651068`, `.8851220`, `.db02503`, `wahlreise.start`: „AP“ → „Aktionspunkte“
- `ui2.ui.Wahlkampf.fdf71b5`: „… den Bruch-Preis des Zusagen-Systems.“ → „… den Preis für ein gebrochenes Versprechen.“
- `ui2.ui.Wahlkampf.75f5f5c`: Punkt am Satzende ergänzen
- `ui2.ui.SpeicherDossier.030022f`, `.1d688ae`, `.217e0b1`, `.34c2a77`, `.82249a5`: „Slot“ → „Speicherplatz“
- `ui2.ui.SpeicherDossier.94873ec`: „Schnellspeichern“ → „Schnell sichern“
- `ui2.ui.SpeicherDossier.2529e52`: „Staatsoberhaupt“ → „Präsident“
- `ui2.ui.Welt.34760b0`: „⚔ {p0} mit {p1} — zum Dossier“ → „{p0} mit {p1}: zur Akte“
- `ui2.ui.Welt.8edbc59`, `.d9c8900`, `ui2.ui.welt.WeltLage.55a2100`: „Verdeckte Optionen“ → „Verdeckte Operationen“
- `ui2.ui.Meldungen.36da8f4`: „Akte & Entwicklungen ansehen ➔“ → „Akte und Entwicklung ansehen →“
- `ui2.ui.NetView.c707cb1`: „(Exit-Preis: das {p0}-Fache)“ → „(Zurücknehmen kostet das {p0}-Fache)“
- `ui2.ui.NetView.2a6f5fd`: „Einführen (+10 Stufen) kostet …“ → „Ein Schritt nach oben kostet {p0} Kapital, ein Schritt zurück {p1}“
- `ui2.ui.welt.Vermittlung.63606da`: „Reif {p0} · Konflikt {p1} · ZOPA {p2}“ → „Reife {p0} · Konflikt {p1} · Einigungsspielraum {p2}“
- `ui2.ui.welt.Vermittlung.6821fd1`: „… Spoiler können alles zurückwerfen.“ → „… Störer können alles zurückwerfen.“
- `ui.welt.Vermittlung.d0f5707`: „Reif-Verlauf der letzten Monate“ → „Wie reif die Lage zuletzt war“
- `ui2.ui.welt.Vermittlung.40284ec`: „ (mit Garantie „{p0}")“ → „ (mit Garantie „{p0}“)“
- `ui2.ui.welt.EuDossier.f7bcef9`, `sim2.sim.eu.2406223`, `.396ea89`, `.3beaade`: „Update der Zollunion“ → „Modernisierung der Zollunion“
- `ui2.ui.welt.EuDossier.6b8bfa2`: „… steht bei {p0} von nötig 55.“ → „… steht bei {p0}; nötig sind 55.“
- `ui2.ui.welt.EuDossier.4e56431`: „(… die übrigen laufen als Binnenmarkt-Technik im Hintergrund mit)“ → „(die übrigen folgen von selbst)“
- `ui2.ui.welt.Vertraege.9d1b9b4`: „· {p0} Verstoß“ → „· {p0, plural, one {# Verstoß} other {# Verstöße}}“
- `ui2.ui.katastrophe.Faelle.1adca3c`, `ui2.ui.katastrophe.Versprechen.267bcfb`: „Baureihenfolge im Reich“ → „Baureihenfolge unter Kultur und Bau“
- `ui2.ui.katastrophe.Faelle.b355043`: „Gegenüber der Referenz 20 verhindert das …“ → „Gegenüber einem kaum vorbereiteten Land (Bereitschaft 20) verhindert das …“
- `ui2.ui.katastrophe.Lage.d4cfbbf`: „Im Politikfenster ansehen“ → „In der Politik-Akte ansehen“
- `ui2.ui.politik.UmsetzungAkte.0f41c01`: „… Die Werkstatt und alle Schritte stehen im Parlament-Fenster, Reiter „Verfassung“.“ → „… Alle Schritte stehen in der Parlamentsakte, Reiter „Verfassung“.“
- `ui2.ui.minister.Posteingang.5efa51c`: „Das {p0}ressort hat …“ → „{p0}: Das Ministerium hat im Moment nichts vorzulegen.“
- `ui2.ui.Beschlussbuch.086dccd`: „301: Mehrheit“ → „{schwelle}: Mehrheit“
- `ui2.ui.parlament.AbstimmungsKarte.0d2974b`, `ui.reich.WunderFenster.05f104d`: „Tippen überspringt …“ → „Klicken überspringt …“
- `ui2.ui.reich.VorhabenKarte.35b2f5c`: „({p0} Voraussetzung“ → ganzer Satz mit Plural und schließender Klammer
- `ui2.ui.reich.Pflege.26e1a92`, `.cd3f30b`, `.65af42d`, `.bdac2ad`: „Stück/Stücke“ für Kulturerbe → „Stätte/Stätten“
- `ui2.ui.KiEinstellungen.85bec72`: „Prüfe …“ → „Wird geprüft …“
- `ui2.ui.personen.GespraechSzene.4a994ef`: „3 Ergebnis“ ist übersetzt, „1 Thema“ und „2 Ansatz“ nicht (`ui/personen/GespraechSzene.tsx:51`–`:52`) → alle drei in den Katalog

**Andere Kataloge (Werkzeugfunde)**
- `prolog.wer`: „Wer bist du?“ → „Wer sind Sie?“
- `prolog.st.kindheit.question`: „Wo bist du aufgewachsen?“ → „Wo sind Sie aufgewachsen?“
- `prolog.st.beruf.question`: „Womit hast du dein Geld verdient?“ → „Womit haben Sie Ihr Geld verdient?“
- `prolog.st.wahlnacht.knapp.text`: „Die Hälfte des Landes hat dich nicht gewollt …“ → „Die Hälfte des Landes hat Sie nicht gewollt …“
- `mentor.ruhig.kurz`: „… Klicke eine Zahl in der Wirtschaftsakte an, wenn du etwas wissen willst.“ → „… Klicken Sie eine Zahl in der Wirtschaftsakte an, wenn Sie etwas wissen wollen.“
- `biografie.*` (17 Schlüssel): „dich/dir/du“ → „Sie/Ihnen“ (Liste im Anhang A6)
- `sim2.sim.folgen.*` (13 Schlüssel): „Z1:“ bis „Z9:“ am Satzanfang → streichen
- `wk.6c080c8`: „(Z8, Kalibrierung WIR-1)“ → streichen; `wk.2e24491`, `wk.7d08ba6`: „(WIR-2)“ → streichen
- `sim2.data.welt-institutionen.5b2f90d`, `.f461d57`, `sim2.sim.pakte.cbf299c`: „(Dossier B2)“, „(Dossier 1)“, „(Dossier 1/13)“ → streichen
- `sim2.sim.laender.d1748a4`: „Deconfliction-Gespräche“ → „technische Abstimmungsgespräche“
- `sk.ui.keinBriefing`, `ui.reich.Schaetzblatt`: siehe oben
- `ini.paket.laufzeit`: „Laufzeit {jahre} Jahre.“ → „Laufzeit {jahre, plural, one {# Jahr} other {# Jahre}}.“
- `sim2.sim.zeitung.065f3a1`: „„X" mit Mehrheit“ → „„X“ mit Mehrheit“

**Englisch und Türkisch (Auswahl; vollständige Stichprobe im Anhang A1)**
- en `sdd.willkommen`: „other {in # months}“ → „=1 {in 1 month} other {in # months}“
- en `sdd.amtszeit`: „{amtszeit, select, 1 {1st} 2 {2nd} other {#th}} Term“ → „{amtszeit, select, 1 {1st} 2 {2nd} 3 {3rd} other {{amtszeit}th}} term“
- en `transport.alleRouten`: „Select any route“ → „Select all routes“
- en `nachfolge.ereignis.text1`: „… in the cabinet the elbows are sharpening.“ → „… in the cabinet the knives are out.“
- tr `nachfolge.ereignis.text1`: „… kabinede ise dirsekler keskinleşiyor.“ → „… kabinede ise koltuk kavgası kızışıyor.“
- en `militaer.ui.lieferland`: „Rest from: {land}“ → „Remainder from {land}“
- en `briefing.faellig.duldung_laeuft_aus`: „Tolerance by {partei} expiring“ → „{partei}'s support deal is expiring“
- en `vh.koal.label`: „Bring into the camp“ → „Bring into the governing bloc“
- en `ziel.partner5.beschreibung`: „… trust Turkey …“ → „… trust Türkiye …“
- en/tr `vn.gebucht`: „PC“ / „SS“ → „political capital“ / „siyasi sermaye“
- en `fokus.f.fok_wis_ki_zentrum.text`: „Constructing sovereign high-performance computing centers to train native models for public and industrial use.“ → „Building a data centre to develop Turkish AI models for administration, medicine and engineering.“
- tr `fokus.f.fok_wis_halbleiter.text`: „Savunma ve sanayi için kritik çip tasarımları Gebze ve Ankara'daki temiz odalarda seri üretime geçer.“ → „Yerli silisyum ve galyum nitrür çip üretimi küresel tedarik zincirlerine bağımlılığı sona erdirir.“
- tr `kg.finanzierung`: „… bütçeyi incele.“ → „… bütçeyi inceleyin.“
- tr `rp.veraltet`: „Güncel önizlemeyi kontrol et.“ → „Güncel önizlemeyi kontrol edin.“
- tr `buehne.tab.personen`, `vorlage.quelle.kabinett`, `ui2.ui.Personen.7a193e6`: „Bakanlar Kurulu“ → „Kabine“
- tr `ui2.ui.katastrophe.Lage.4a67db6`: „Meclis'te bir tasarı bekliyor.“ → „Meclis'te bir kanun teklifi bekliyor.“ (dasselbe für alle 89 „tasarı“)
- tr `sim2.sim.zeitung.8701375`: „Hükümet cephesine 600 sandalyenin {p0} kadarı kalıyor{p1}“ → „Hükümet cephesinin 600 sandalyeden {p0} sandalyesi kalıyor{p1}“
- tr `medien.vorschau.ausweichen`: „Okurlar sosyal ağlara … yönelir“ → „Kamuoyu sosyal medyaya ve dolambaçlı yollara yönelir“
- en/tr `sim2.sim.befehle.8fa88b4`, `.af99023`, `.d84d976`, `.db2f401`, `.e1a95a8`, `.1648119`, `.7e5061d`, `.9e2af70`, `.a663a5a`: deutsche Beispielbefehle → übersetzen, sobald der Befehlsleser die Sprache versteht (I-2)

## 4. Die fünf wichtigsten Verbesserungen

**1. Alle Ereignis- und Entscheidungstexte in den Katalog (I-1, I-3, I-4).** Die Entscheidung ist das Herz des Spiels; in EN/TR ist sie heute halb deutsch.
Skizze: `sim/ereignisse*.ts` liefern nur noch Schlüssel und Werte (`msg("evi.erdbeben.text1", { mag, provinz, einwohner })`). Die Vorlagen gibt es als `ereignisse_innen.json` schon. Ein Test öffnet jede der 109 Vorlagen in EN und TR und prüft die Texte auf deutsche Funktionswörter.
```
EN vorher:  Interior Minister Nazlı Özgür bittet um Ihre Anweisungen.
EN nachher: Interior Minister Nazlı Özgür asks for your instructions.
```

**2. Eine Sprachwache für die Oberfläche (I-5 bis I-9).** Statt Stellen einzeln zu suchen: Ein kopfloser Rundgang in EN und TR, wie mein `kriech.cjs`, besucht alle Akten, alle Reiter und die Titelleisten. Er schlägt fehl bei deutschen Funktionswörtern, bei ä/ö/ü/ß außerhalb der Ortsnamenliste, bei „⟦“ und bei Kommazahlen im englischen Text. Dazu eine Lint-Regel gegen `toLocaleString("de-DE")` und gegen deutsche Wörter in JSX-Text.
Wirkung: Die über 50 Stellen aus I-8 werden einmal behoben und bleiben behoben; „Gleiches muss gleich aussehen“ gilt dann auch für die Sprache.

**3. Den Chat ehrlich machen (I-2).** Entweder versteht das Regelwerk Befehle in allen drei Sprachen, über Synonymlisten im Katalog (`befehl.de.erhoehen = ["erhöhe","heb … an"]`, `befehl.tr.erhoehen = ["artır","yükselt"]`), oder die Ansicht zeigt in EN/TR nur die KI-Variante und blendet das Regelwerk aus.
```
┌ Präsidialamt ─────────────────────────────┐
│ The floor is yours.                       │
│ [What should I do next?] [EU summit]      │   ← Beispiele im Katalog, je Sprache
│ Rules engine · understands English        │
└───────────────────────────────────────────┘
```

**4. Ein Wortschatz, ein Glossar (I-18, I-19, I-26).** Glossar Abschnitt 7 „Spielbegriffe“ mit den zehn Zeilen der Regeltabelle oben. Dann ein Durchgang „Suchen und Ersetzen“: „Reich“ wird zu „Kultur und Bau“, „Dossier“ zu „Akte“, „Slot“ zu „Speicherplatz“, „Kanzlei“ zu „Präsidialamt“. Die Aktenreiter heißen überall „Lage · Entwicklung · Personen · Vorhaben“. Im Türkischen: „Kabine“, „kanun teklifi“, „Cumhurbaşkanlığı Kararnamesi“.
Wirkung: Der Spieler lernt jedes Wort einmal und findet es überall wieder; die Akten sehen gleich aus.

**5. Prolog in „Sie“ und Interna raus (I-10, I-11, I-23, I-24).** Den Prolog behutsam auf „Sie“ umstellen, ohne den Erzählton zu verlieren („Mit siebzehn hatten Sie zu allem eine Meinung und von nichts Erfahrung.“). Alle „Z1–Z9“, „WIR-x“, „Dossier B2“, „3-Ebenen-Modell“, „Interpreter“, „Spielschleife“, „ZOPA“, „Bias“ aus dem sichtbaren Text streichen. „Stufe“ dort, wo es eine echte Größe gibt, durch die Einheit oder den benannten Zustand ersetzen (128 Stellen, Anhang A10).
Wirkung: Das Spiel spricht durchgehend in einer Stimme mit dem Spieler und nie mehr mit dem Entwickler.
