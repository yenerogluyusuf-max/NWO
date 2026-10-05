# Spielen auf Deutsch, Türkisch und Englisch (Konzept, 04.10.2026)

Anforderung: Das ganze Spiel muss auf Türkisch und auf Englisch spielbar sein, nicht nur die Menüs. Deutsch bleibt Quellsprache und Standard.

## 1. Befund (gemessen im Code am 04.10.2026)

| Bereich | Umfang |
|---|---|
| Sätze und Phrasen in Quelldateien (`src/sim`) | etwa 42.600 Wörter |
| Daten (`src/data`, darunter `politiknetz.ts` 8.600, `abkommen.ts` 2.800, `reich/zukunft.ts` 2.700, `zeitung_texte.ts` 2.600) | etwa 26.300 Wörter |
| Oberfläche (`src/ui`, Sätze in Literalen) | etwa 5.400 Wörter, dazu 3.700 Wörter Text zwischen JSX-Marken |
| KI-Anbindung (`src/ki`) | etwa 2.200 Wörter |
| JSON-Daten mit Text (Provinzdaten, Katastrophenrisiko, Szenario u. a.) | etwa 6.000 Wörter |
| Einwort-Beschriftungen | bis zu 1.800 |
| **Zusammen** | **rund 100.000 deutsche Wörter** |

Das ist nicht das Hauptproblem. Die Struktur ist es:

1. **Zusammengesetzte Sätze:** 2.669 von 2.725 Textvorlagen setzen Werte ein, 424 davon drei oder mehr. Ein Satz lässt sich nicht übersetzen, indem man Wörter austauscht, besonders nicht ins Türkische (Endungen hängen am Namen: „mit Deutschland“ → „Almanya ile“, „nach Irak“ → „Irak’a“).
2. **Deutsche Fallformen im Code:** 89 Stellen nutzen `.dat` und `.akk` der Länder. Türkisch braucht sieben Fälle, Englisch keinen.
3. **Der Spielstand speichert fertige deutsche Sätze:** Protokoll (`LogEntry.text`), Chronik und Zeitungsarchiv. Nach einem Sprachwechsel bliebe die Geschichte deutsch.
4. **Zahlen und Daten:** 160 Aufrufe von `formatDateDe`, 111 Stellen mit `de-DE`.
5. **Freitext-Befehle:** Die Chat-Befehle (`sim/befehle.ts`, 99 Wortlistenstellen) erkennen deutsche Stichwörter.
6. **Karte:** Namen von Meeren, Gebirgen, Ländern und Hauptstädten sind deutsch hinterlegt.
7. **Oberfläche:** Türkische Großschreibung (i ↔ İ, ı ↔ I) bricht `text-transform: uppercase` ohne Sprachangabe im Dokument; Schriften und Platz müssen für ı, İ, ş, ğ, ç geprüft werden.

## 2. Entscheidungen der Architektur

**Katalog statt Literal.** Jeder sichtbare Text bekommt einen Schlüssel. Die Kataloge liegen als flache JSON-Tabellen unter `src/i18n/katalog/<sprache>/<bereich>.json`. Deutsch ist die Quelle, Türkisch und Englisch laden beim Start der gewählten Sprache nach. Fehlt ein Schlüssel, gilt Englisch, dann Deutsch; in der Entwicklung erscheint ein auffälliges `⟦schluessel⟧`.

**Meldungsformat** (gebaut, `src/i18n/format.ts`): Einsatzwerte `{n}`, Zahlen, Prozent, Daten, Uhrzeit, Aufzählungen, Mehrzahl `{n, plural, one {…} other {…}}`, Auswahl `{x, select, …}`, Fälle `{land|dat}`. Sprachregeln kommen aus `Intl` (Mehrzahl, Datum, Zahl, Liste), nicht aus eigenem Code.

**Türkische Fälle** (gebaut, `src/i18n/tuerkisch.ts`, 57 Testfälle): Vokalharmonie, Pufferlaute, Apostroph, Verhärtung nach harten Konsonanten, Abkürzungen (ABD’ye, TBMM’nin). Länder mit besonderer Aussprache stehen in einer kleinen Ausnahmetabelle, die ein Muttersprachler prüfen muss.

**Meldungen im Spielstand.** Protokoll, Chronik und Zeitungsarchiv speichern künftig `Msg` (Schlüssel + JSON-Werte). Beim Anzeigen entsteht der Text in der aktuellen Sprache. Alte Spielstände bleiben lesbar (`rendere` akzeptiert auch fertige Texte). Der Spielstand von Mai 2030 läuft weiter.

**Sprachwechsel = Sichern + Neuladen.** Viele Module bilden Texte schon beim Laden (Kataloge, Beschriftungen). Ein Live-Wechsel würde sie nie erreichen. Darum: Stand sichern, Sprache merken, Oberfläche neu laden (ein bis zwei Sekunden). `main.tsx` lädt die Kataloge, bevor die App eingelesen wird.

**Deterministische Simulation.** Ohne Fenster (Tests, Werkzeuge, Worker) gilt immer Deutsch. Die Simulation hängt nie von Geräteeinstellungen ab, und alle bestehenden Tests prüfen weiter den deutschen Text.

**Eingabe.** Der Befehlsparser bekommt Wortlisten je Sprache (türkische Stämme passen zur bestehenden Präfixerkennung, weil Endungen hinten hängen); Zahlen und Namen sind sprachneutral. Die KI bekommt die Sprache im Systemauftrag und antwortet in ihr.

**Karte.** Namen kommen aus Natural Earth (`name_de`, `name_tr`, `name_en` sind enthalten, gemeinfrei); Meere und Gebirge als kleine Tabelle mit Quelle.

## 3. Vorgehen je Modul (Fließband mit Sicherungsnetz)

1. **Extrahieren:** Literale und Vorlagen in Schlüssel und `de`-Katalog überführen, Code ruft `t()` oder `msg()`.
2. **Golden-Test:** Vor der Umstellung wird die deutsche Ausgabe des Moduls festgehalten (Läufe über mehrere Seeds, alle Ereignisse, Zeitungsausgaben, Berichte). Nach der Umstellung muss sie Zeichen für Zeichen gleich sein. Die vorhandenen 1.083 Tests laufen weiter.
3. **Übersetzen:** Türkisch und Englisch mit festem Glossar (Abschnitt 4), je Satz mit Kontext (Quelltext, Platzhalter, wo der Text erscheint).
4. **Automatische Prüfung:** Dieselben Platzhalter in allen Sprachen, keine deutschen Reste (Wortlisten und Umlaute), Längenverhältnis, Glossar-Treue, Klammern und Mehrzahlformen gültig.
5. **Sichtprüfung:** Bildschirmfotos pro Sprache bei 2000×1300, 1512×850, 1280×720; Überläufe und abgeschnittene Texte beheben.
6. **Schranke gegen Rückfall:** Test, der in `src/ui` und `src/sim` neue deutsche Literale außerhalb einer Ausnahmeliste meldet. Neue Texte laufen ab jetzt immer über den Katalog.

## 4. Glossar und Ton

Vor jeder Übersetzung entsteht ein Glossar der etwa 150 Kernbegriffe (Kapital, Zustimmung, Staatsoberhaupt, Ministerrat, Verfassungsgericht, Zentralbank, Leitzins, Politiknetz, Wirkungsbericht …) mit türkischer und englischer Entsprechung, das ein Muttersprachler vorab durchsieht. Anrede: förmlich („siz“ bzw. „you“). Eigennamen (Personen, Parteien des Spiels) bleiben. Institutionen tragen ihre türkischen Namen und gebräuchlichen Abkürzungen (TBMM, AYM, TCMB, MİT).

## 5. Reihenfolge

| Stufe | Inhalt | Stand |
|---|---|---|
| S0 Fundament | Kern, Format, türkische Fälle, Katalog-Ladung, Sprachwahl, Datumsformat, Titelbild vollständig dreisprachig, Tests | fertig |
| S1 Oberfläche | Menüs, Knöpfe, Legenden, Tooltips, Dossiers (≈ 9.000 Wörter), Sprachwahl im Spiel | nach Welle 1 (Stage.tsx und Atlas sind in Arbeit) |
| S2 Daten | `data/*`: Politiknetz, Verträge, Reich-Katalog, Länder-Dossiers, Zeitungstexte, JSON | kann mit eigenen Dateien sofort beginnen |
| S3 Erzeugte Texte | `sim/*`: Ereignisse, Berichte, Gespräche, Zeitung, Krieg, EU; Spielstand speichert `Msg` | sofort für Dateien, die Welle 1 nicht anfasst |
| S4 Eingabe und KI | Befehlsparser, KI-Anweisungen | nach S3 |
| S5 Karte | Namen aus Natural Earth, Meere und Gebirge | nach Welle 1 B (Karte) |
| S6 Qualität | Glossarprüfung, Länge und Layout, Rückübersetzungsprobe, Durchsicht durch Muttersprachler | laufend, Abnahme am Ende |

Aufwand: Das ist die größte einzelne Arbeit im Projekt, vergleichbar mit der gesamten bisherigen Textproduktion. Der reine Übersetzungsanteil ist machbar (etwa 100.000 Wörter je Sprache); die Zeit steckt im Umbau der zusammengesetzten Sätze und in der Prüfung, nicht im Übersetzen.

## 6. Offene Entscheidungen (mit Vorgabe)

- **Spielname:** Türkisch „Devlet Aklı“, Englisch „Raison d’État“; die App-Datei heißt weiter „Staatsräson“. Vorgabe gilt, bis anders entschieden.
- **Währung:** Türkisch „TL“, Englisch „lira“ (nicht „TRY“).
- **Prüfung durch Muttersprachler:** Türkisch sollte jemand mit Fachsprache (Politik, Recht) durchsehen, zuerst das Glossar, später Stichproben. Bis dahin sind alle türkischen Texte „Entwurf, maschinell erzeugt“ und im Katalog so gekennzeichnet.
- **Zeitungsnamen:** Die Blätter des Spiels (Markenwelt) bleiben, Rubrikennamen werden übersetzt.
