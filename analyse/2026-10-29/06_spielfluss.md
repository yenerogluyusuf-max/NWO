# 06 — Spielfluss: Wie spielt sich „Staatsräson“ tatsächlich?

Stand: 29.10.2026. Geprüft wurde der Stand **W4** (Commit `09a14ff`, `/home/user/nwo-w4/game`, vom Entwicklungsserver auf `localhost:5199` ausgeliefert). Der ältere Stand (`/home/user/nwo-analyse/game`) diente nur zum Vergleich; was nur dort galt, ist als **„in W4 behoben“** markiert. Am Code und an den Dokumenten wurde nichts geändert; alle Mess-Tests lagen nur während des Laufs als `game/test/zz-sf-*.test.ts` im Spielordner und wurden danach gelöscht (Quellen im Scratchpad, siehe Abschnitt 11).

Alle Zahlen in diesem Bericht sind **Messwerte aus diesen Läufen** (Bots, Seeds, Spieltage) oder **Code-Konstanten mit Fundstelle**. Wo nichts gemessen wurde, steht das dabei. Die Bots sind grobe Stellvertreter für Spielweisen, keine Menschen; ihre Ergebnisse zeigen Tendenzen der Regeln, nicht das Erleben.

---

## 0. Kurzfassung

1. **Das Grundgerüst trägt inzwischen.** In W4 verliert Nichtstun (0 von 8 Wahlen), „alles auf 100“ verliert (1 von 8), kluges Regieren gewinnt (7 von 8 bis 16 von 16), „hart“ ist gewinnbar (13 von 16 erste Wahlen). Die drei Befunde aus dem alten Stand („alles hochdrehen ist beste Strategie“, „hart nicht gewinnbar“, „zu viele Ereignisse“) sind **in W4 behoben** bzw. neu kalibriert (Abschnitt 4.1; die Befunde des alten Stands stammen aus dem Auftrag und `spielbarkeit.test.ts` dort, sie wurden im alten Stand nicht erneut gemessen).
2. **Was fehlt, ist nicht Masse, sondern Gewicht.** Die Hälfte aller Ereignisentscheidungen ist für die Zustimmung, die Wirtschaft und die Mehrheit binnen 180 Tagen praktisch folgenlos (Spannweite zwischen den Antworten unter 0,5 Punkten in 60 % der Fälle). Echte Zwickmühlen machen rund ein Drittel aus (Abschnitt 5). Nur Ereignisse zu beantworten, gewinnt nie (0 von 14 Partien); gewonnen wird über Gesetze.
3. **Die strategische Ebene ist gebaut, aber nicht verbunden.** Fokusbaum, Wissensbaum, Programme und Ziele existieren. Langfristig zu investieren wird belohnt (Investor 4/6, Investor + späte Wahlgeschenke 6/6, nur späte Wahlgeschenke 0/6). Aber: **die Ziele der Amtszeit haben keine Spielwirkung**, 6 von 19 Zielen sind beim Start schon erfüllt, „Frieden“ scheitert an bloßen Spannungen, und wer nichts tut, erfüllt „Inflation unter 15 %“ in 6 von 6 Partien (Abschnitt 6).
4. **Rückmeldung ist reich, aber ohne Höhepunkt.** Ereignisfenster, Tagesbriefing mit „Drei Fragen“, Wirkungsberichte und Zeitung sind gut. Es fehlt der Belohnungsmoment (Fokus fertig, Programm erfüllt, Ziel erreicht feiern), und die Wirkungspfeile werten falsch (grünes ▲ für steigende Korruption).
5. **Funktionsfehler mit Spielwirkung** stehen gesammelt in Abschnitt 1, an erster Stelle: Die Unterschriftenmappe empfiehlt Optionen, die beim Klick scheitern (in 2 Spieljahren 77 von 479 empfohlenen Vorlagen tatsächlich ausführbar), und die „So regieren Sie“-Hilfe verweist auf Menüs, die es in W4 nicht mehr gibt.

---

## 1. Was nicht sauber funktioniert

Funktionsbefunde zuerst, nach Schwere sortiert. „Neu in W4“ heißt: im alten Stand nicht vorhanden oder dort noch korrekt.

| # | Befund | Beleg (Datei:Zeile, Messung) | Folge für das Spiel | Status |
|---|---|---|---|---|
| F1 | **Mappe empfiehlt Unausführbares.** Die Option „Ziel setzen: … verbessern“ ist fest als `moeglich: true` gebaut, ohne zu prüfen, ob schon ein Auftrag läuft oder das Kapital reicht. Klick ergibt „Es läuft schon ein Auftrag: …“ oder „Dafür fehlen 2 Kapital“. Die Vorlage kommt danach jede Woche wieder. | `src/sim/ministerfluss.ts:427`; Fehlertext aus `src/sim/gespraeche.ts:368` bzw. `src/sim/minister-befehle.ts:233`. Messung (Seed 2, 2 Jahre, Mappe wöchentlich, immer „Empfehlung annehmen“): 479 Mappe-Einträge gesehen, 77 erfolgreich; häufigste Fehlschläge „Polarisierung … Es läuft schon ein Auftrag“ 38×, „Haftanstalten …“ 21×, „Justiz …“ 12+11× | Der Knopf „Empfehlung annehmen“ verliert Vertrauen; die Mappe verstopft mit Untoten | neu in W4 |
| F2 | **Mappe-Einträge ohne Rat, die monatelang liegen bleiben.** In den Abnicker-Läufen hatten im Mittel 900 von 1.278 gesichteten Mappe-Einträgen je Partie keine Empfehlung (Zählung je wöchentlicher Sichtung, Wiederholungen eingeschlossen). Teils gewollt („Minister … legt nichts mehr vor“ als Signal), teils nicht: „Luftverschmutzung: Umweltauflagen“ lag in 2 Jahren bei 54 von 103 wöchentlichen Sichtungen ohne Empfehlung oben in der Mappe; am Tag 500 stand „Wohnungsnot: Industrieller Wohnungsbau“ mit leerem Grund darin | `zz-sf-verlauf` (Bot „abnicker“, 4 Seeds); `zz-sf-empf` (Seed 2, Liste „OHNE“); `zz-sf-mappe` | Die Mappe zeigt Stillstand statt Lage; der Spieler sieht wochenlang dieselben Zeilen | neu in W4 |
| F3 | **Starthilfe verweist auf alte Menüs.** „Unter ‚Politik‘ …“, „‚Wähler‘ …, ‚Die Welt‘ … und ‚Programme‘“ — das Menü in W4 heißt Schreibtisch, Wirtschaft, Gesellschaft, Parlament, Regierung, Sicherheit, Außen, Land, Agenda, Medien. Der Text ist außerdem fest deutsch (nicht über `t()`) | `src/sim/spiel.ts:233–242`; Browser-Protokoll `w3.log` | Der erste Hinweis nach der Zielwahl führt ins Leere — genau an der Stelle, an der Suzerain 42 % der Spieler verliert (RECHERCHE_SPIELFLUSS_UX.md, 2.2) | neu in W4 (im alten Stand passten die Namen) |
| F4 | **Ziel „Frieden an den Grenzen“ scheitert ohne Krieg.** Die Prüfung zählt `aktiveKriege`, und das sind alle Vorgänge außer „frieden/beendet“, also auch „spannung“ und „drohkulisse“. In passiven Partien entstehen Spannungen mit Zypern und Israel von selbst | `src/sim/ziele.ts:161–170`, `src/sim/krieg.ts:178–180`; Messung: Seeds 1–3 passiv, Monat 59: „CYP:spannung, ISR:spannung“; Ziel erfüllt bei passiv 1/6, klug 0/6, Investor 0/6 | Ein „haltendes“ Ziel ist praktisch unerreichbar; die Bilanz meldet Krieg, wo keiner war | neu in W4 |
| F5 | **Drei Ziele sind beim Start erfüllt.** „Schuldenquote unter 30 %“ (Start 23,8 %), „Keine abgehängte Provinz“, „Verlässliche Partner“ sind nicht als `haltend` markiert, aber in 18 von 18 Starts schon erfüllt; „Inflation unter 15 %“ erreicht der passive Bot in 6 von 6 Partien, weil die Inflation von selbst fällt | `src/sim/ziele.ts:62–67, 109–117, 151–160`; `zz-sf-ziele` (18 Partien, Tabelle 6.1) | Wer diese drei wählt, hat die Bilanz geschenkt; Ziele belohnen Nichtstun | besteht seit dem alten Stand (schulden30), erweitert in W4 |
| F6 | **Wirkungspfeile werten falsch.** Chips im Ereignisfenster färben nur die Richtung: grünes ▲ für „Korruption +1,5“ und „Schulden +0,40“, rotes ▼ für „Wohnungsnot −0,8“ | `src/ui/EreignisFenster.tsx:150–156`, `src/ui/ereignis.css:64–65`; Screenshot `shots_w4/04-ereignis.png` | Die Vorschau sagt optisch das Gegenteil dessen, was sie meint | neu in W4 (alter Stand ohne Pfeile) |
| F7 | **Meldeleiste liegt über der Zielwahl.** Die Kapseln „3 Entscheidungen · 10 akute Probleme · …“ (`z-index: 120`) verdecken die Überschrift „Was soll von dieser Amtszeit bleiben?“ | `src/ui/styles.css:184`; Screenshot `shots_w4/02-zielwahl.png` | Der wichtigste Satz des ersten Tages ist nicht lesbar | neu in W4 |
| F8 | **Pausen ohne Entscheidung.** „Straße von Hormus geschlossen“ und „Gastland diskutiert Verbot der Ülkücü-Bewegung“ halten die Zeit an, bieten aber nur „Verstanden“; ebenso „Vorwarnung: Oppositionsbewegung“ („wie die Regierung jetzt antwortet, entscheidet, ob daraus eine Massenbewegung wird“ — ohne Antwortknopf), zweimal in neun Monaten | Browser-Lauf 2, 3. August 2028 (`w4.log`); erzeugt als `aussen-hormus-*` und `aussen-diaspora-*` (`src/sim/diplomatie.ts:253, 365`), Präfix `aussen-` fehlt in `HINWEIS_KLASSEN`, deshalb Standard „B“ = Halt; `gesellschaft-warn-` ist ausdrücklich „B“ (`src/ui/autostopp.ts:49–67`) | Bricht die eigene Regel „keine Pause ohne Entscheidung“ (RECHERCHE_SPIELFLUSS_UX.md 7.5) | neu in W4 |
| F9 | **Sprachmischung.** Im englischen Modus erscheinen deutsche Ereignistitel und Satzteile („Der erste Haushaltsentwurf“, „Die DEM Parti erwartet more freedom …“); `welt_machtwechsel` und die Starthilfe sind fest deutsch im Simulationscode | Browser mit Systemsprache Englisch (`w1.log`); `src/sim/welt-ereignisse.ts:47–110` | Bei Englisch/Türkisch bricht die Immersion an den häufigsten Stellen | neu in W4 (Dreisprachigkeit ist neu) |
| F10 | **Mappe-Rechnung ist teuer.** `schreibtischMappe` brauchte im Testlauf 434 bis 2.249 ms je Aufruf (unter hoher Rechnerlast gemessen, Lastmittel 16–22; ohne Last nicht gemessen) | `zz-sf-mappe` | Öffnen des Schreibtischs kann spürbar hängen; Bots mit Mappe brauchten 2–10 min je Amtszeit statt 10–20 s | neu in W4 |
| F11 | **Kleinigkeiten.** „Zustimmung 50 % — Wahlanteil beim Amtsantritt“ steht auch nach Monaten als Untertitel; Kabinettsfragen der Mappe bleiben unverändert oben, bis man sie entscheidet (Tag 0 bis Tag 500 dieselben zwei: „Haushaltskurs“, „Sicherheitsdoktrin“); der Agenda-Überblick „Kein Fokus läuft: 7 Wege sind jetzt offen“ ist kein Link zum Fokusbaum (zwei Klicks über „Zu den Ansichten …“) | Screenshots `shots_w4/07-stopp-2.png`, `05-agenda.png`; `zz-sf-mappe` | Kleine Reibung, summiert spürbar | neu in W4 |
| F12 | **Zwei Zustimmungen.** Die Kopfleiste zeigte am 14. Oktober 2028 49 %, das Ereignis „Rentner fordern Ausgleich“ im Kasten „Worum es geht“ „Zustimmung (Umfragen) 41 %“, das nächste Ereignis am 8. November „50 %“ | Browser-Lauf 2 (`w4.log`, Läufe 7 und 9); Ereigniskasten nutzt `angezeigteZustimmung` = letzte veröffentlichte Institutsumfrage mit Verzerrung (`src/ui/ereignis/kontext.ts:113–116`, `src/sim/medien.ts:863`); die Kopfleiste zeigt einen anderen Wert. Die Mechanik ist gewollt (Medien), die Anzeige nennt aber weder Institut noch Stand | Der Spieler sieht binnen Wochen 41, 49 und 50 % und weiß nicht, welche Zahl zählt | neu in W4 |
| F13 | **„Rat aus dem Ressort“ passt nicht zum Ereignis.** Über Ereignisfenstern steht ein Ministerrat, der mit dem Fall nichts zu tun hat und sich wiederholt: Steuerfahndung über dem Haushaltsfenster, „Investitionsanreize“ über dem Mindestlohn (6.12.) und über der Streikwelle (2.1.), „Rechte religiöser und sprachlicher Minderheiten von 35 auf 15“ gegen Polarisierung über den Kommunalwahlen | Browser-Lauf 2 (`w4.log`, Läufe 6, 10, 11, 13) | Der Rat wirkt beliebig; Spieler lernen, ihn zu überlesen | neu in W4 |
| F14 | **Veraltete Beschriftung.** Wirtschaftsakte im Oktober 2028 zeigt die Kachel „Haushaltsplan 2026“ | Screenshot `shots_w4/07-stopp-7.png` | Kleinigkeit, stört die Glaubwürdigkeit der Zahlen | neu in W4 |

**Keine Abstürze** im Browser (keine `pageerror`-Meldung in allen W4-Sitzungen) und keine Testabbrüche in den Messläufen. Der einzige rote Test in `spielbarkeit.test.ts` (W4) war eine Zeitüberschreitung (60 s) unter Last, kein Logikfehler.

**Nicht als Spielfehler gewertet:** Neuladen der Seite während der ersten Browserläufe (Ursache: Umstellung des Servers auf W4 und Hot-Reload; durch Abschalten der Vite-Verbindung im Testbrowser umgangen); Rücktritte in zwei kontrafaktischen Läufen (der Mess-Bot wählte bei „Rücktrittsforderung“ die kostenlose Antwort „Zurücktreten“).

---

## 2. Methode

| Teil | Vorgehen | Umfang |
|---|---|---|
| Spieltest im Browser | Playwright/Chromium mit Software-WebGL, Fenster 1280 × 800, Sprache Deutsch; Klicks per DOM, Zustand über `window.__welt` (nur im Entwicklungsmodus) | alter Stand: Start, Zielwahl, drei Startereignisse; W4: Start, Zielwahl, Startereignisse, Agenda, Schreibtisch, 14 Läufe „Bis zum nächsten Ereignis“ (5. Juni 2028 bis 6. März 2029); zweite Sitzung: Fokusbaum, drei Mappe-Entscheidungen |
| Verlauf über eine Amtszeit | Tag-für-Tag-Simulation, fünf Bot-Typen, Öffnungen jedes Ereignisses mit Tag, Monatswerte | 32 Partien à bis zu 62 Monate (`zz-sf-verlauf`) |
| Gewicht einer Entscheidung | Für jedes geöffnete Ereignis jede bezahlbare Antwort auf einer Kopie der Welt wählen und 180 Tage weiterrechnen | 279 Ereignisse aus 5 Partien (`zz-sf-kontrafakt`) |
| Strategie gegen Reaktion | Fünf Spielpläne (nur reagieren, früh investieren, früh verteilen, spät verteilen, früh investieren + spät verteilen) | 30 Partien (`zz-sf-investition`) |
| Ziele | Alle 19 Ziele am Start und in Monat 59 prüfen | 18 Partien (`zz-sf-ziele`) |
| Unterschriftenmappe | Inhalt, Empfehlungen, Laufzeit, Ausführbarkeit | 2 Spieljahre wöchentlich (`zz-sf-mappe`, `zz-sf-empf`) |
| Bestandstest | `test/spielbarkeit.test.ts` in W4 | 8 von 9 Prüfungen grün |

Bot-Typen: **passiv** (tut nichts), **reaktiv** (beantwortet jedes Ereignis mit der ersten bezahlbaren Antwort), **klug** (reaktiv + ein Gesetz im Monat aus einer festen Liste, wie in `spielbarkeit.test.ts`), **abnicker** (nimmt jede Woche die Empfehlungen der Unterschriftenmappe an), **planer** (abnicker + Fokus, Programmschritt, Wissensknoten, ein Gesetz im Monat).

Einschränkung: Die Rechner waren während der Messung stark ausgelastet (Lastmittel bis 22 auf 4 Kernen, mehrere Analysen parallel). Zeitangaben aus dem Browser (Sekunden je Klick oder je Lauf) sind deshalb **nicht** als Spielgeschwindigkeit zu lesen.

---

## 3. Spieltest im Browser (erste Spielstunde)

### 3.1 Protokoll W4

| Schritt | Was ich tue | Was ich sehe und fühle | Beleg |
|---|---|---|---|
| Amtsübergabe | „An die Arbeit“ | Gute Szene, klare Lage: Lager 313–342 Sitze (bei jedem Start anders), Inflation 31,5 %, Wahl in fünf Jahren. Kein Zweifel, wer ich bin | `shots_w4/01-start.png` (englisch), `w2.log` |
| Zielwahl | „Inflation unter 15“, „Erdbebensicher bauen“, „Wort halten“, Normal | 18 Ziele in vier Gruppen. **Kein Stand, keine Schwierigkeit, keine Belohnung** sichtbar („Zum Start steht die ganze Liste zur Wahl“, `src/ui/ZielWahl.tsx:2,26`). Die Wahl fühlt sich beliebig an; die Überschrift ist verdeckt (F7) | `shots_w4/02-zielwahl.png` |
| Starthilfe | lesen | verweist auf „Politik“, „Wähler“, „Die Welt“, „Programme“ — gibt es nicht (F3) | `w3.log` |
| Drei Startereignisse | Sparkurs; „Ein Ministerium jetzt, eins später“; „Zur Chefsache machen“ | Das Ereignisfenster ist stark: Porträt der Ministerin, „Worum es geht“ mit vier Kennzahlen, drei Wege mit Preis und Vorschau. Die Pfeile werten falsch (F6). Nach drei Klicks ist der erste Tag vorbei, ohne dass ich etwas Eigenes getan habe | `shots_w4/04-ereignis.png` |
| Agenda | „Wissen und Agenda“ öffnen | Überblick nennt „Kein Fokus läuft: 7 Wege sind jetzt offen“, Wissensbaum mit Hürjet, KAAN, TF-2000 zuerst (bei einer Ökonomin mit Inflationsziel). Der Fokusbaum ist von hier nicht direkt erreichbar (F11) | `shots_w4/05-agenda.png` |
| Schreibtisch | öffnen | Bestes Stück des Spiels: Tagesbriefing, Kapital „+10,3 im Monat (davon −1,1 Altlasten)“, **„Drei Fragen“** (Wovon hängt meine Regierung ab? Welches Versprechen wird zuerst fällig? Was kann ich liegen lassen?), Aufmerksamkeit/Belastung, Unterschriftenmappe mit „Empfehlung annehmen“, Fristen (Zinssitzung, Wahl in Iran, UNESCO, NATO-Gipfel), Warnung „Hasankeyf verfällt“ | `shots_w4/06-schreibtisch.png`, `w4.log` Z. 131–280 |
| Fokusbaum (zweite Sitzung) | Agenda → „Zu den Ansichten und Handlungen dieses Bereichs“ → Reiter „Fokusbaum“; „Nationale Wirtschaftsstrategie“ beginnen | Schöner, lesbarer Baum (sieben Äste, 102 Foki, „7 jetzt möglich“), Karte mit Kosten, Restzeit und „Wer reagiert“. **Ernüchternd:** 60 Tage und 4 Kapital für „Vertrauen der Märkte +0,7, Kapital +2“ (`src/data/fokus/wirtschaft.ts`, Wurzel: `tage: 60`, `kapital: 5`, `sofortKapital: 2`, `vertrauen_maerkte: 2` × Skala 0,35). Kein Hinweis, welchem meiner Ziele ein Fokus dient | `shots_w4/09-fokusbaum.png`, `10-fokus-begonnen.png`, `w5.log` |
| Mappe abarbeiten (zweite Sitzung) | dreimal „Empfehlung annehmen“ | **Sehr gute Rückmeldung:** „Der Ministerrat hat getagt: ‚Strikter Sparkurs‘ … Onur Turan +12 Loyalität; Burak Aksoy und Cengiz Akın −8 Loyalität, +10 Groll; Marktvertrauen +3; Preis: die Nachfrage bremst“ — und bei Gesetzen „Abstimmung in 21 Tagen; Umsetzung etwa 24 (bzw. 48) Monate; erwartet 512 Ja-Stimmen“. So sollte jede Entscheidung antworten | `w5.log`, `shots_w4/11-mappe-nach-annahme.png` |
| Zeit laufen lassen | 14× „Bis zum nächsten Ereignis“, mittlere Antworten | 5. Juni → 3. Juli: **vier Wochen ohne Halt** direkt nach dem ersten Tag. Dann Fabrikschließung (Marmara Giyim) mit „Rat aus dem Ressort“, Streit Verfassungsgericht gegen Kassationshof (echte Zwickmühle: Urteil durchsetzen kostet 4 und verärgert das Lager), Hormus-Sperre und Diaspora-Meldung als Pausen ohne Entscheidung (F8) | `w4.log`, `shots_w4/07-stopp-2.png` |

Die folgenden neun Monate mit allen Halten stehen in Abschnitt 12.

### 3.2 Spielgefühl in einem Satz je Moment

- **Erster Tag:** gute Inszenierung, aber man *reagiert* dreimal und *gestaltet* nichts. Der Plan („Was will ich in fünf Jahren?“) wird abgefragt, bevor man das Land kennt, und danach nie wieder gezeigt — außer in der Agenda-Kachel „Ziele erreicht 0/3“.
- **Erste Woche:** Der Schreibtisch ist voll (5 Mappe-Einträge, 8 weitere im Posteingang), aber alles ist gleich wichtig formuliert („der Weg, den Sie am leichtesten vertreten können“, „der sichere Weg mit dem geringsten Preis“). Es gibt keinen *Faden*: Keine Mappe-Vorlage knüpft an meine drei Ziele an.
- **Erster Monat:** Die Zeit springt vier Wochen ohne Halt. Das ist ruhig, aber nicht *gewählt* ruhig; es läuft kein sichtbarer Countdown außer den Fristen.
- **Erste Krise:** Das Kassationshof-Ereignis ist der beste Moment: Lager gegen Rechtsstaat, Preis und Gegenwirkung sichtbar. Davon braucht das Spiel mehr, und es braucht danach eine *Folge*, die ich sehe.

### 3.3 Vergleich mit dem alten Stand (Browser)

| Moment | alter Stand | W4 |
|---|---|---|
| Zielwahl | 10 Ziele, kein Stand | 18 Ziele in Gruppen, kein Stand; Überschrift verdeckt |
| Starthilfe | Menünamen stimmten | Menünamen veraltet (F3) |
| Ereignisfenster | Text, Antworten, Vorschau als Zeilen | Porträt, Kennzahlen, Chips mit Pfeilen (besser, aber F6) |
| Schreibtisch | Tagesbriefing (Block T2) | zusätzlich Drei Fragen, Mappe mit Empfehlung, Aufmerksamkeit |
| Menü | 12 Punkte (Zeitung, Gespräch, Politik, Wähler, Welt …) | 10 Bereiche mit Unterreitern |

---

## 4. Messung über eine volle Amtszeit

### 4.1 Wer gewinnt? (erste Wahl)

| Spielweise | Siege | Zustimmung Monat 12 / 24 / 36 / 48 / 58 (Mittel) | Quelle |
|---|---|---|---|
| passiv | 0 von 8 | 42,3 / 39,2 / 38,5 / 39,7 / 39,0 | `verlauf_a` |
| reaktiv (nur Ereignisse) | 0 von 8 | 47,6 / 44,9 / 44,8 / 45,6 / 44,6 | `verlauf_a` |
| klug (Ereignisse + 1 Gesetz/Monat) | 7 von 8 | 47,7 / 45,3 / 47,9 / 51,3 / 52,7 | `verlauf_a` |
| abnicker (Mappe-Empfehlungen) | 2 von 4 | 46,4 / 39,0 / 43,1 / 49,5 / 52,6 | `verlauf_b` |
| planer (Mappe + Fokus + Programme + Wissen + Gesetz) | 3 von 4 | 47,3 / 43,5 / 48,5 / 53,4 / 55,4 | `verlauf_b` |
| Bestandstest blind („alles auf 100“) | 1 von 8 | Monat 58: 38,2–51,6 | `w4_spielbarkeit.txt` |
| Bestandstest klug normal / hart | 16 von 16 / 13 von 16 | Monat 58: 50,3–58,4 / 45,9–54,6 | `w4_spielbarkeit.txt` |

**In W4 behoben** gegenüber dem alten Stand: „Alles hochdrehen“ gewinnt nicht mehr (1/8), „hart“ ist gewinnbar (13/16 erste Wahl), die Ereignisgrenze im Test wurde mit Begründung auf 16 je Jahr angehoben (`test/spielbarkeit.test.ts`, Kommentar zu „Obergrenze“). Die Bots „passiv“ und „reaktiv“ verlieren immer.

Zwei Muster fallen auf:

- **Jede Kurve hat ein Mittelzeittal.** Bei allen aktiven Spielweisen sinkt die Zustimmung bis Monat 24 und steigt dann bis zur Wahl (klug −2,4, abnicker −7,4, planer −3,8 Punkte gegenüber Monat 12). Das ist ein guter Spannungsbogen (Absturzgefahr in der Mitte, Aufholjagd am Ende), aber er entsteht für jede Strategie ähnlich, also vermutlich aus dem System (Regierungsmüdigkeit, Verzug zwischen Gesetz und Wirkung; Ursache nicht zerlegt), nicht aus Entscheidungen.
- **Die Kurve ist flach.** Die mittlere Änderung der Zustimmung von Monat zu Monat liegt bei 0,32 bis 0,61 Punkten. Große Ausschläge gibt es kaum; das tiefste Tal eines aktiven Laufs lag bei 36,5 %, das höchste Hoch bei 60,2 %.

### 4.2 Takt, Leerlauf und Wiederholung

| Kennzahl | passiv | reaktiv | klug | abnicker | planer |
|---|---|---|---|---|---|
| neue Entscheidungsereignisse je Jahr (ohne Startvorgänge) | 11,5 | 12,4 | 12,2 | 12,1 | 11,1 |
| Anteil Monate ohne neues Ereignis | 36 % | 30 % | 34 % | 34 % | 41 % |
| längste Lücke zwischen zwei Ereignissen, Mittel (Max) | 136 (155) Tage | 112 (121) | 135 (170) | 143 (167) | 132 (169) |
| Anteil Ereignisse, deren Vorlage im selben Lauf schon kam | 42 % | 44 % | 44 % | 39 % | 40 % |

- **Routine dominiert:** 28,6 % aller 1.933 Öffnungen sind Haushaltsjahr, Mindestlohn, Machtwechsel im Ausland oder Weltkrise; 7,1 % sind Saisonereignisse. `welt_machtwechsel` kommt in den Mappe-Läufen 5,5- bis 5,75-mal je Amtszeit und war in 13 von 13 Prüfungen folgenlos (Abschnitt 5).
- **Ungleicher Kalender:** Über 32 Partien öffneten im Oktober 281 und im Dezember 266 Ereignisse, im Januar 117, im Februar 107, im November 110 (Summen). Der Befund von Prüfer 10 („Januar bis Juni dünn, Oktober und Dezember dicht“, SPIEL_DURCHDACHT_2026-10-05.md, 6) gilt in W4 abgeschwächt weiter.
- **Wiederspielwert der Ereignisse:** Zwei Partien teilen im Mittel die Hälfte ihrer Vorlagen (Jaccard 0,48–0,50); je Partie kommen 30 bis 45 verschiedene Vorlagen vor. Das erste Jahr unterscheidet sich zwischen Seeds deutlich (z. B. Seed 1: Korruptionsaffäre, Militärrat, Flüchtlingswelle, Großbeben; Seed 2: Mietproteste, Lieferverzug F-16, Bergwerksunglück, Streikwelle). Gut.
- **Zwischen den Ereignissen** liegt im Spiel die Unterschriftenmappe (Ministervorlagen ohne Frist). Sie füllt die Lücken grundsätzlich, wiederholt aber dieselben Fragen über Monate (F11), sodass „etwas zu tun“ nicht „etwas Neues“ bedeutet.

### 4.3 Kapital als Engpass

| | passiv | reaktiv | klug | abnicker | planer |
|---|---|---|---|---|---|
| Monate mit Kapital ≥ 100 | 95 % | 89 % | 3 % | 2 % | 0 % |

Kapital ist für aktive Spielweisen knapp und für passive nutzlos. Das ist richtig gebaut (Verfall über 100, `src/sim/takt.ts`, `GEGENKRAFT`). Im Bestandstest endet der kluge Bot nach zehn Jahren trotzdem mit 101 bis 133 Kapital (alle Schwierigkeitsgrade, `w4_spielbarkeit.txt`): Für einen Spieler, der ein Gesetz im Monat einbringt, ist Kapital auf Dauer kein Engpass. Wann genau der Engpass endet, wurde nicht gemessen.

### 4.4 Wie oft echte Zwickmühlen?

Siehe Abschnitt 5: rund **ein Drittel** der Ereignisse (32 % bzw. 30 % in den zwei Messreihen) hat keine dominante Antwort und spürbare Unterschiede. Bei rund einem Ereignis im Monat heißt das: **etwa vier echte Zwickmühlen im Jahr aus Ereignissen** (gerechnet aus 12 Ereignissen/Jahr × 32 %; Mappe und Gesetze kommen dazu, sind aber nicht kontrafaktisch gemessen).

---

## 5. Gewicht einer Entscheidung (kontrafaktisch)

Für jedes Ereignis wurde jede bezahlbare Antwort auf einer Kopie der Welt gewählt und 180 Tage ohne weitere Eingriffe weitergerechnet (gleiche Zufallszahlen). Verglichen wurden Zustimmung, Kapital, Schulden, Inflation, Vertrauen, akute Probleme, Sitze des Lagers und mittlere Loyalität (zweite Reihe zusätzlich Auslandsvertrauen, Justiz, Legitimität, Protestdruck).

| Einordnung | Reihe 1 (Seeds 1–3, 179 Ereignisse) | Reihe 2 (Seeds 4–5, 100 Ereignisse) |
|---|---|---|
| **folgenlos** (Zustimmung < 0,5, Vertrauen < 1, Schulden/Inflation < 0,3, gleiche Probleme und Sitze, Loyalität < 3) | 90 (50 %) | 49 (49 %) |
| **eine Antwort dominiert** (in allen Größen mindestens gleich gut) | 32 (18 %) | 21 (21 %) |
| **Zwickmühle** (kein Sieger, spürbarer Unterschied) | 57 (32 %) | 30 (30 %) |
| Spannweite der Zustimmung zwischen den Antworten, Median (Max) | 0,32 (5,55) Punkte | 0,35 (4,65) Punkte |
| Anteil mit Spannweite unter 0,5 / 1 / 2 Punkten | 61 % / 78 % / 91 % | 60 % / 84 % / 93 % |
| teuerste Antwort ist auch die beste für die Zustimmung | 101 von 179 | 56 von 100 |

Lesart:

- **Die Hälfte der Ereignisantworten bewegt die Spielwerte nicht.** Ganz folgenlos waren u. a. `welt_machtwechsel` (13 von 13), `haushaltsjahr` (12 von 12; der eigentliche Haushalt wird in der Haushaltsakte gemacht, das Ereignis ist nur die Tür), `recht_egmr`, `fabrikschliessungen`, `land_fordert`, `land_angebot`, `welt_krise` (je 4 von 4), `recht_ernennung`, `mil_militaerrat`, `kreis_rivalitaet` (je 3 von 3). Vorsicht bei Außen- und Justizfragen: Wirkungen auf einzelne Länder oder Gerichtssitze, die nicht in Zustimmung, Mehrheit oder Wirtschaft durchschlagen, erfasst die Messung nicht. Genau das ist aber der Punkt: **Für das, woran der Spieler gemessen wird, sind diese Entscheidungen Dekoration.**
- **Echte Zwickmühlen** sind Zusagen (9 von 9 in Reihe 1), Studentenproteste, Korruptionsaffären, IWF-Angebot, Koalitionsangebot, Energiepreisschock und die drei Startvorgänge. Hier lohnt das Spiel das Nachdenken.
- **Bezahlen lohnt meist:** In 56 % der Fälle (beide Reihen) ist die teuerste Antwort auch die beste für die Zustimmung. Die kostenlose Antwort dominierte nur 2-mal. Das Kapital ist damit eine *Kaufkraft für Zustimmung*, kein Dilemma.
- **Das Ende kommt als normales Ereignis:** „Rücktrittsforderung“ bietet „Durchhalten (3 Kapital)“ und „Zurücktreten (kostenlos)“; „Neuwahlforderung“ führte in allen drei Antworten binnen 180 Tagen zur Abwahl (Reihe 1, Seed 1). Für das dramatischste Ereignis der Partie ist das Fenster zu klein.

---

## 6. Fehlt die strategische Ebene?

### 6.1 Ziele der Amtszeit

Erfüllt am Start (18 Partien) und in Monat 59 (je 6 Partien):

| Ziel | am Start | passiv | klug | Investor + Geschenke |
|---|---|---|---|---|
| Inflation unter 15 % | 0/18 | **6/6** | 5/6 | 5/6 |
| Arbeitslosigkeit unter 8 % | 0/18 | 0/6 | 2/6 | 3/6 |
| Schuldenquote unter 30 % | **18/18** | 6/6 | 6/6 | 6/6 |
| Wasser und Strom | 0/18 | 0/6 | 6/6 | 6/6 |
| Erdbebensicher bauen | 0/18 | 0/6 | 0/6 | 0/6 |
| Wohnungsnot beenden | 0/18 | 0/6 | 0/6 | 0/6 |
| Ärzte für alle Provinzen | 0/18 | 3/6 | 6/6 | 6/6 |
| Keine abgehängte Provinz | **18/18** | 6/6 | 6/6 | 6/6 |
| Regierungsmehrheit (haltend) | 18/18 | 5/6 | 6/6 | 6/6 |
| Vertrauen gewinnen | 0/18 | 0/6 | 6/6 | 6/6 |
| Verlässliche Partner | **18/18** | 6/6 | 6/6 | 6/6 |
| Frieden (haltend) | 18/18 | 1/6 | 0/6 | 0/6 |
| Verträge, die halten | 0/18 | 0/6 | 4/6 | 5/6 |
| Ansehen in der Welt | 0/18 | 0/6 | 5/6 | 2/6 |
| Unabhängige Gerichte | 0/18 | 0/6 | 0/6 | 0/6 |
| Ruhe und Ordnung (haltend) | 0/18 | 0/6 | 0/6 | 0/6 |
| Wort halten (haltend) | 0/18 | 0/6 | 1/6 | 1/6 |
| Geschlossenes Kabinett (haltend) | 18/18 | 0/6 | 1/6 | 0/6 |

(Quelle `ziele.json`; „klug“ ist hier ein Bot, der 58 Monate lang je Monat ein Gesetz aus einer gemischten Lang- und Kurzfristliste einbringt.)

Befund:

- **Ziele sind kein Spielsystem.** `zielStand` wird nur angezeigt (Schreibtisch, Agenda, Bilanz, Vermächtnis, KI-Kontext) und bei der Wiederwahl archiviert (`src/sim/amtszeit.ts:174–182`). Kein Ziel verändert Kapital, Zustimmung, Mappe, Empfehlungen oder Ereignisse. AGENDA.md 4 verlangt genau das (Briefings, Empfehlungen, Minister, Mentorin, Erinnerung richten sich nach der Agenda); gebaut ist es nicht.
- **Zielwahl ohne Information:** Kein Stand, keine Richtung, keine Schwierigkeit (F5, `src/ui/ZielWahl.tsx:26`).
- **Fünf Ziele erreichte in fünf Jahren kein Bot** (Erdbeben, Wohnungsnot, Gerichte, Ordnung, sowie Frieden wegen F4). Das kann gewollte Härte sein, ist aber ungemessen: Es gibt keinen Test, der zeigt, dass jedes Ziel mit gezieltem Spiel erreichbar ist.

### 6.2 Investition gegen Wahlgeschenk (Belohnt das Spiel einen Plan?)

| Plan (je 6 Seeds) | Siege | Zust. M12 / M24 / M36 / M48 / M58 | Inflation M58 | Vertrauen M58 | akute Probleme M58 |
|---|---|---|---|---|---|
| nur reagieren | 0/6 | 47,3 / 44,4 / 44,7 / 45,2 / 43,9 | 11,2 | 55,1 | 7,5 |
| Investor (Monate 0–23 langfristige Gesetze: Schulen, Universitäten, Forschung, Krankenhäuser, Wasser, Netze, Wohnungsbau, Gebäudeverstärkung …) | 4/6 | 47,9 / 45,6 / 48,8 / 51,7 / 52,5 | 10,1 | 65,5 | 6,0 |
| Populist (Monate 0–23 Renten, Mindestlohn, Energiesubventionen, Kindergeld, Mietdeckel, Preisdeckel …) | 3/6 | 48,8 / 50,2 / **54,5** / 54,2 / 51,9 | **18,4** | 75,0 | 6,3 |
| Wahlgeschenke (Monate 34–57 kurzfristige Gesetze) | 0/6 | 47,3 / 44,4 / 44,7 / 46,0 / 48,9 | 11,3 | 65,2 | 7,5 |
| Investor, dann Wahlgeschenke | **6/6** | 47,9 / 45,6 / 48,8 / 52,7 / 55,4 | 12,1 | 74,8 | 6,0 |

Das ist der erfreulichste Befund der Analyse: **Zeitliche Strategie wird belohnt.** Wer früh langfristig baut, liegt im zweiten Jahr hinten (J-Kurve: 45,6 gegen 50,2 beim Populisten) und am Ende vorn; der Populist hat sein Hoch in Monat 36 und verliert es mit steigender Inflation (18,4 %). Späte Geschenke allein retten niemanden.

Aber der Spieler **sieht das nicht**: Keine Anzeige sagt „Ihre Investitionen wirken ab 2031“, keine Mappe-Vorlage unterscheidet „wirkt in 24 Monaten“ von „wirkt sofort“ als strategische Wahl. Die Verzögerung steht als Monatszahl im Kleingedruckten der Maßnahme (z. B. Krankenhausbau 24, Gebäudeverstärkung 48 Monate, `src/data/politiknetz.ts`).

### 6.3 Fokusbaum, Wissensbaum, Programme

- **Fokusbaum** (HOI4-Vorbild, `src/sim/fokus.ts`; erreichbar über Agenda → „Zu den Ansichten …“ → Reiter „Fokusbaum“): 102 Foki in sieben Ästen (Wirtschaft 17, Gesellschaft 16, Sicherheit 15, Regionen 14, Wissen 14, Außen 13, Staat 13), Dauer 60 bis 180 Tage (Median 110), einer zur Zeit, mit Ausschlüssen (Orthodoxie gegen Niedrigzins), dauerhaftem Bestand im Netz (höchstens 9 Punkte je Knoten, `src/data/fokusbaum.ts:19–44`) und Abschluss-Hinweis. Der Planer vollendete 2 bis 6 Foki je Amtszeit.
- **Lohn je Wartezeit:** Die Wurzel „Nationale Wirtschaftsstrategie“ kostet 4 Kapital und 60 Tage und bringt „Vertrauen der Märkte +0,7, Kapital +2“ (Browser, Fokuskarte). Die Wirkung eines Fokus auf einen Knoten ist auf 5, der Gesamtbestand auf 9 Punkte gedeckelt (`src/data/fokusbaum.ts:19–25`). HOI4-Spieler nennen solche Fokusse „slog“ (RECHERCHE_SPIELFLUSS_UX.md 5.1); der Abschluss braucht einen spürbaren Effekt oder eine Entscheidung.
- **Programme**: Der Planer schaffte 4 bis 5 Schritte.
- **Wirkung auf den Ausgang:** Planer 3/4 gegen klug 7/8 und abnicker 2/4. Bei so wenigen Läufen lässt sich nicht sagen, ob der Baum den Ausgang verbessert; die Zustimmung des Planers lag in Monat 58 im Mittel am höchsten (55,4). Messbar ist: **Der Baum ist kein Hebel, den man spürt** — er läuft neben der Mappe her, und seine Wirkungen (je Knoten höchstens 5, zusammen höchstens 9 Punkte) gehen im Netz auf.
- **Keine Verbindung zu den Zielen.** Fokus „Rückkehr zur geldpolitischen Orthodoxie“ dient dem Ziel „Inflation unter 15 %“, aber weder Zielwahl noch Fokusbaum sagen das.

### 6.4 Pfadabhängigkeit und Spielstile

| Element | vorhanden | spürbar? |
|---|---|---|
| Ausschließende Foki (Markt/Staat, NATO/Eurasien, Dekret/Parlament) | ja | als Sperre im Baum, nicht als Identität der Regierung |
| Zusagen mit Fristen, Glaubwürdigkeit („Wort halten“) | ja | ja, über Zusage-Ereignisse (echte Zwickmühlen) |
| Investitionen mit Verzögerung | ja | im Ergebnis ja (6.2), in der Anzeige nein |
| Bestand statt Stoß (Gewöhnung, Fokusbestand) | teilweise (Welle 3) | kaum |
| Unterschiedliche Spielstile führen zu unterschiedlichen Ländern | teilweise: Populist hat am Ende 18 % Inflation, Investor 10 % | ja, aber nur in Zahlen, nicht in Ereignissen oder Figuren |
| Ende und Bilanz | Wahl mit Stichwahl, Wiederwahl, Vermächtnis-Kapitel, sieben Endarten (`EndeArt`) | Endarten ja; Bilanz misst Ziele, die keine Spielwirkung hatten |

### 6.5 Wiederspielwert

- Start: Parlament und Partner wechseln je Start (313, 329, 332, 342 Sitze des Lagers in vier W4-Browserstarts); Ereignisfolge des ersten Jahres unterscheidet sich je Seed deutlich (4.2).
- Mitte: Rund 30 % Routine-Ereignisse und 40–44 % Wiederholungen je Partie nivellieren das.
- Ende: Der Kluge gewinnt in `spielbarkeit.test.ts` beide Wahlen in 16 von 16 Partien (normal). Die zweite Amtszeit ist für einen soliden Spieler offenbar keine Bedrohung mehr; gleichzeitig ist sie die Phase, in der laut Prüfer 10 am wenigsten geschieht (SPIEL_DURCHDACHT 6).

---

## 7. Rückmeldung und Belohnung

| Frage | Antwort | Beleg |
|---|---|---|
| Versteht man, *warum* etwas passiert? | Teilweise sehr gut: „Warum“-Satz in jedem Ereignis, Schreibtisch-Reiter „Warum ist das passiert?“, Wirkungsberichte nach 6 und 12 Monaten mit ehrlichem „noch nicht fällig“ (`src/sim/berichte.ts:1–12`), Kapital-Aufschlüsselung. | Browser; Code |
| Versteht man es *im Moment*? | Nein: Die Vorschau-Pfeile werten falsch (F6); nach einer Entscheidung sieht man die Wirkung nicht an derselben Stelle; die Zustimmung bewegt sich im Mittel 0,3–0,6 Punkte im Monat. | 4.1, F6 |
| Gibt es Belohnungsmomente? | Wenige und leise: Fokus vollendet = Hinweis mit Zitat (Klasse B); Wunder-Feier (Reich); Wahlabend (Klasse A). **Kein** Moment für „Ziel erreicht“, „Programm erfüllt“ als Szene, „Problem in Provinz gelöst“, „Gesetz in Kraft“. | `src/sim/fokus.ts` (vollende), `src/ui/autostopp.ts` |
| Mentorin | im Schreibtisch („Mentorin“-Bereich vorhanden); im getesteten Ablauf nicht in Erscheinung getreten | Schreibtisch-Text |
| Zeitung | monatlich, Klasse C (hält nicht an), 60 Ausgaben je Amtszeit | `verlauf` Hinweiszählung |
| Hinweisflut | je Amtszeit rund 15–17 „Großdemo der Opposition“ (C), 7–11 „Warnung Opposition“ (B), 5 EU-Berichte (B), 2–5 Vermittlungsmeldungen (C) | `auswertung_a.txt`, `auswertung_b.txt` |

Positiv: Die Antwort auf „Empfehlung annehmen“ in der Mappe nennt Gewinner, Verlierer, Preis, Abstimmungstermin und Umsetzungsdauer (`w5.log`) — das ist die Vorlage für alle anderen Entscheidungen. Insgesamt bekommt der Spieler aber **viel Information und wenig Bestätigung**. Es fehlen die Momente, in denen das Spiel sagt: „Das haben *Sie* geschafft.“

---

## 8. Vergleich mit den Kernschleifen der Vorbilder

| Spiel | Kernschleife (Kurzform) | Was Staatsräson davon hat | Was fehlt / Übernahme |
|---|---|---|---|
| **Civilization 6** | mehrere überlappende Countdowns („fertig in 4 Runden“), Wunder als Belohnung mit Film, Siegpfade sichtbar | Bauvorhaben mit Fortschritt, Wunder-Feier, Fokus mit Restzeit | **Countdown-Leiste** für alles Laufende (Fokus, Programmschritt, Gesetze, Bau, Investitionen „wirkt ab“); **Siegpfad-Anzeige**: Ziele als sichtbare Fortschrittsbalken mit Prognose |
| **HOI4** | immer genau ein Fokus läuft, Abschluss ist Ereignis mit Effekt; National Spirits zeigen Dauerzustände | Fokusbaum mit einem aktiven Fokus, Krisen-Blocker | Fokus-Abschluss als **eigenes Ereignis mit Entscheidung** (nicht nur Hinweis); Fokus-Zweige an Ziele knüpfen; **Leerlauf-Mahnung** „Kein Fokus läuft“ im Kopf |
| **Suzerain** | wenige, schwere, unumkehrbare Entscheidungen je Kapitel; Zeitung; Figuren merken sich alles | Zwickmühlen bei Zusagen und Justiz, Zeitung, Gedächtnis der Minister (`merke`) | **Weniger, dafür schwerere Ereignisse**: folgenlose Routine (Machtwechsel, Haushaltstür) zu Meldungen herabstufen; Kapitelstruktur (Halbzeit, Wahljahr) als **Phasen mit eigenem Ziel** |
| **Democracy 4** | Kapital je Runde, Regler mit Verzögerung, Wählergruppen; Wahl als Abrechnung | fast alles davon | **Verzögerung sichtbar machen** („wirkt in 24 Monaten“ als Strich in der Kurve); Wählergruppen-Prognose bis zur Wahl |
| **Victoria 3** | Interessengruppen mit Legitimität, Gesetzesvorhaben dauern und können scheitern | Gesetzes-Engine mit Fassungen und Verfassungsgericht (W4) | Fraktionen und Gruppen reagieren auf den **Kurs** (Fokusrichtung), nicht nur auf Einzelgesetze |
| **Frostpunk** | ein Leitsatz („Die Stadt muss überleben“), Gesetzesbuch mit unumkehrbaren Entscheidungen, Hoffnung/Unzufriedenheit als zwei Leisten | Belastung/Aufmerksamkeit, Zusagen | **Zwei sichtbare Druckleisten** statt einer Zahl (z. B. Straße und Märkte); **ein Leitsatz** für die Amtszeit aus der Zielwahl |
| **CK3** | Figuren mit Zielen und Haken; immer brennt etwas („one more crisis“) | Machtkreis (Geheimnisse, Rivalitäten), Minister-Groll | Figuren, die **eigene Pläne** verfolgen und sie ankündigen („Der Innenminister will in sechs Monaten …“) |

Kernunterschied: In allen Vorbildern ist **der langfristige Plan das, worauf man täglich schaut** (Siegpfad, Fokus, Kapitel-Ziel). In Staatsräson schaut man täglich auf die Mappe, und der Plan steht in einer anderen Akte.

---

## 9. Was dem Spiel „ein bisschen fehlt“ — Diagnose

1. **Ein roter Faden.** Ziele, Fokus, Programme und Mappe sind vier getrennte Systeme. Der Spieler hat keinen Ort, an dem er sieht: „Mein Plan, wie weit er ist, was als Nächstes dafür zu tun ist, was dagegen arbeitet.“
2. **Gewicht statt Menge.** Die Hälfte der Ereignisse ist für die Siegbedingung folgenlos; die Mappe wiederholt sich. Der Spieler lernt: Klicken ist billig.
3. **Sichtbare Zeit.** Die besten strategischen Effekte (J-Kurve der Investition, Populismus-Hoch mit Inflationskater) sind real, aber unsichtbar. Ohne Countdown und Prognose fühlt sich Strategie wie Glück an.
4. **Abschlussmomente.** Es gibt kaum „geschafft“-Szenen außerhalb von Wahlabend und Wunder.
5. **Eine Siegbedingung, die man spielen kann.** Gewonnen wird die Wahl; die Ziele zählen nicht. Damit ist das eigentliche Spiel „Zustimmung über 50 % am Wahltag“, und dafür gibt es eine einfache Formel (ein Gesetz im Monat).

---

## 10. Katalog fehlender Elemente

P0 = vor allem anderen, P1 = danach, P2 = später. Aufwand S < 1 Tag, M 1–3 Tage, L > 3 Tage (Konvention aus VERBESSERUNGSPLAN_2026-09-30.md).

| # | Element | Warum (Befund) | P | Aufwand |
|---|---|---|---|---|
| 1 | **Mappe reparieren**: Befehls-Optionen mit echter Prüfung (`befehlVorschau`) statt `moeglich: true`; Vorlagen mit laufendem Auftrag ausblenden; Einträge ohne Empfehlung nicht als „Empfehlung annehmen“ anbieten | F1, F2 | P0 | S |
| 2 | **Starthilfe neu schreiben** (aktuelle Menünamen, über `t()`), Meldeleiste unter Dialoge legen, Pfeilfarbe nach „gut/schlecht“ der Größe (`HOCH_SCHLECHT` existiert) | F3, F6, F7 | P0 | S |
| 3 | **Ziele korrigieren**: „Frieden“ nur echte Kriegsphasen zählen; beim Start erfüllte Ziele als `haltend` kennzeichnen oder Schwelle anheben; in der Zielwahl Stand, Richtung und eine grobe Einschätzung zeigen; Test „jedes Ziel ist mit gezieltem Spiel erreichbar“ | F4, F5, 6.1 | P0 | S–M |
| 4 | **Ziele mit Spielwirkung (Agenda light)**: Mappe und Empfehlungen gewichten Vorlagen, die einem gewählten Ziel dienen, und sagen es („dient Ihrem Ziel Inflation“); Fokus- und Programmschritte zeigen ihr Ziel; erreichte Ziele geben einmalig Kapital oder Legitimität, verfehlte kosten im Wahlkampf | 6.1, AGENDA.md 4 | P0 | M |
| 5 | **Plan-Leiste im Kopf** (Civ-Countdowns): laufender Fokus, nächster Programmschritt, Gesetze in Umsetzung, „Investitionen wirken ab …“, Ziele als Balken mit Prognose bis zur Wahl | 4.1, 6.2, 9.3 | P1 | M |
| 6 | **Folgenlose Routine abstufen**: `welt_machtwechsel`, `haushaltsjahr` (Tür zur Akte), `recht_egmr`, `land_angebot/fordert`, `welt_krise` zu Meldungen oder zu Mappe-Vorlagen ohne Halt; frei werdende Slots für schwere Vorgänge | Abschnitt 5 | P1 | S–M |
| 7 | **Gewicht der Antworten erhöhen**: Antworten mit Langzeitfolge (Bestand, Gedächtnis einer Figur, Folgeereignis nach 6–12 Monaten) statt kleiner Stoß; Messkriterium „höchstens 25 % folgenlos“ als Regressionstest mit dem kontrafaktischen Verfahren | Abschnitt 5 | P1 | M–L |
| 8 | **Abschlussmomente**: Fokus vollendet, Programm erfüllt, Ziel erreicht, Problem in Provinz gelöst als kurze Szene (Klasse B) mit Bild und einem Satz, wer davon profitiert | Abschnitt 7 | P1 | M |
| 9 | **Pausen nur mit Entscheidung**: Hinweise ohne Option (Hormus, Diaspora-Vorfall) als Klasse C oder mit Antworten ausstatten; Test über alle Hinweis-Präfixe | F8 | P1 | S |
| 10 | **Phasen der Amtszeit** (Suzerain-Kapitel): Halbzeitbilanz mit Zwischenzeugnis der Ziele, Wahljahr mit eigenem Takt; das Mittelzeittal (Monat 24) als erzählte Krise statt als stille Kurve | 4.1, U4 in SPIEL_DURCHDACHT | P1 | M |
| 11 | **Sichtbare Verzögerung**: in Vorschau und Mappe „wirkt sofort / in 12 Monaten / in 24 Monaten“ als Merkmal, damit Investor und Populist als Stile wählbar werden | 6.2 | P1 | S–M |
| 12 | **Kalender füllen**: Januar bis Juni mit Terminen (Haushaltsbericht, Parteitag, Gipfel) statt Zufallsereignissen; die Mappe darf neue Themen bringen, nicht dieselben | 4.2 | P2 | M |
| 13 | **Zweite Amtszeit schärfen**: Kluger gewinnt Wahl 2 in 16 von 16; eigene Gegenkräfte (Nachfolgekampf, Abnutzung, neue Ziele mit höherer Messlatte) | 6.5 | P2 | M |
| 14 | **Mappe schneller** rechnen (Vorschau nur für die oberen drei, Rest auf Abruf; Worker) | F10 | P2 | M |
| 15 | **Sprachreste** in Simulationstexten (`welt-ereignisse.ts`, Starthilfe) über die Übersetzungsschicht | F9 | P2 | S–M |
| 16 | **Anzeige-Ehrlichkeit**: „Rat aus dem Ressort“ nur zeigen, wenn er die Ereignisgröße betrifft; Umfragewert im Ereignis mit Institut und Datum beschriften; Kachel „Haushaltsplan“ mit aktuellem Jahr | F12, F13, F14 | P1 | S |
| 17 | **Folgefäden für Krisen**: Anschlag → Ermittlung/Täter; Streik → Tarifrunde; Fabrikschließung → Ansiedlung oder Abwanderung nach 6–12 Monaten; damit die Säule „Die Vergangenheit kommt zurück“ nicht nur bei Zusagen greift | Abschnitt 12 | P1 | M |
| 18 | **Druck auf Horten**: Ein Halt (Klasse A) mit Vorschlag, wenn Kapital über 100 liegt und kein Fokus läuft („Ihr Stab hat drei Vorhaben vorbereitet“) | Abschnitt 12, 4.3 | P2 | S |

---

## 11. Dateien und Rohdaten

Alle unter `/tmp/claude-0/-home-user-NWO/d4866be2-bd79-588d-ab46-992dad67ab93/scratchpad/analyse/spielfluss/`:

| Datei | Inhalt |
|---|---|
| `tests/zz-sf-verlauf.test.ts`, `verlauf_a.json`, `verlauf_b.json`, `auswertung_a.txt`, `auswertung_b.txt`, `auswerten_verlauf.py` | Verlauf über eine Amtszeit, fünf Bots |
| `tests/zz-sf-kontrafakt.test.ts`, `kontrafakt.json`, `kontrafakt2.json`, `auswertung_kontra.txt`, `auswerten_kontra.py` | Gewicht der Ereignisantworten |
| `tests/zz-sf-investition.test.ts`, `investition.json` | Investition gegen Wahlgeschenk |
| `tests/zz-sf-ziele.test.ts`, `ziele.json` | Ziele am Start und in Monat 59 |
| `tests/zz-sf-mappe.test.ts`, `mappe.txt`, `tests/zz-sf-empf.test.ts`, `empf.log` | Unterschriftenmappe |
| `tests/zz-sf-krieg.test.ts` | Spannungsphasen in passiven Läufen |
| `w4_spielbarkeit.txt`, `w4_spielbarkeit_vitest.txt` | Bestandstest W4 |
| `hilfe.mjs`, `w1.mjs` … `w5.mjs`, `w1.log` … `w5.log` | Browser-Skripte und Protokolle (W4); `p1.mjs` … `p4.mjs`, `p2.log` … `p4.log` alter Stand |
| `tests/zz-sf-foki.test.ts`, `tests/zz-sf-tempo.test.ts` | Größe des Fokusbaums; Rechenzeit (1 Spieljahr täglich 827 ms, Weltkopie 81 ms, Spielstand 2,77 MB JSON) |
| `shots/` (alter Stand), `shots_w4/` (W4) | Screenshots |

Screenshots W4: `shots_w4/01-start.png` (Amtsübergabe, englische Systemsprache), `02-zielwahl.png` (verdeckte Überschrift), `04-ereignis.png` (Ereignisfenster, Pfeilfarben), `05-agenda.png` und `05-fokusbaum.png` (Agenda-Überblick; der Klick auf „Kein Fokus läuft“ öffnet nichts), `06-schreibtisch.png` (Tagesbriefing), `07-stopp-2.png` (Schreibtisch im August), `07-stopp-7.png` (Haushaltsakte, „Haushaltsplan 2026“), `08-schreibtisch-spaet.png` (März 2029, gleiche Mappe), `09-fokusbaum.png` und `10-fokus-begonnen.png` (Fokusbaum), `11-mappe-nach-annahme.png`. Alter Stand: `shots/01-start.png`, `02-zielwahl.png`, `03-nach-zielwahl.png`.

---

## 12. Nachtrag: neun Monate „Bis zum nächsten Ereignis“ im Browser

Spielweise: jede Entscheidung mit der mittleren (jeder dritten: der teuersten) bezahlbaren Antwort, keine eigenen Gesetze außer dem, das die DEM-Zusage anbot, Mappe nicht angefasst. 14 Läufe vom 5. Juni 2028 bis 6. März 2029 (`w4.log`).

| Lauf | Halt am | Grund des Halts | Meine Wahl | Zustimmung (Kopf) | Kapital |
|---|---|---|---|---|---|
| 0 | 7. Juli | Marmara Giyim schließt Werke (Uşak, Tekirdağ) | Umschulung und Ansiedlungen (4) | 50,4 | 68,3 |
| 1 | 13. Juli | Verfassungsgericht gegen Kassationshof | Kassationshof stützen (0) | 50,4 | 68,3 |
| 2 | 3. August | Hormus geschlossen; Diaspora-Vorfall (nur „Verstanden“) | — | 50,2 | 78,6 |
| 3 | 11. August | Oberster Militärrat | nach Leistung befördern (3) | 50,2 | 75,6 |
| 4 | 2. September | Vorwarnung Oppositionsbewegung (nur „Verstanden“) | — | 49,7 | 86,1 |
| 5 | 7. September | Zusage fällig: YENİ (zwei Ministerien) | vertrösten (1) | 49,7 | 85,1 |
| 6 | 4. Oktober | Zusage fällig: DEM (Regionalförderung); Haushaltsfenster | Gesetz einbringen (5); Entwurf selbst vorbereiten (öffnet die Haushaltsakte) | 49,1 | 90,6 |
| 7 | 14. Oktober | Rentner fordern Ausgleich | Einmalzahlung (2) | 49,1 | 88,6 |
| 8 | 2. November | EU-Fortschrittsbericht (nur „Verstanden“) | — | 48,6 | 99,0 |
| 9 | 8. November | Anschlag in Adana | Sicherheitspaket (4) | 48,6 | 95,0 |
| 10 | 6. Dezember | Mindestlohn; Zusage YENİ (letzte Vertröstung) | Preisanstieg ausgleichen (1); vertrösten (1) | 48,1 | 101,8 |
| 11 | 2. Januar | Vorwarnung Opposition (nur „Verstanden“); Streikwelle | Lohnzugeständnis (3) | 47,4 | 105,5 |
| 12 | 13. Januar | Studierende besetzen Hörsäle | Dialog und Stipendien (3) | 47,4 | 102,5 |
| 13 | 6. März | Kommunalwahlen; Zusage YENİ | lokale Projekte vorziehen (3); Zusage brechen (0) | 46,5 | 110,4 |

Beobachtungen:

- **Rhythmus:** 14 Halte in 9 Monaten, davon 4 ohne Entscheidung. Die längsten Strecken ohne Halt: 5. Juni → 7. Juli und 13. Januar → 6. März (52 Tage). Im Spiel fühlt sich das an wie „Vorspulen, eine Frage, Vorspulen“.
- **Abwärtsdrift ohne Gegenmittel:** Wer nur antwortet, verliert in neun Monaten 4 Punkte (50,6 → 46,5) und sammelt 110 Kapital, die ab 100 verfallen („über 100 verfallen etwa 3 im Monat“ steht ehrlich im Briefing). Das Spiel sagt mir *dass* ich verliere, aber kein Halt fordert mich auf, das Kapital in einen Plan zu stecken.
- **Aufmerksamkeit 100, Belastung 0** in allen neun Monaten: Das Belastungssystem (`src/sim/aufmerksamkeit.ts`) übt auf diese Spielweise keinen Druck aus.
- **Die Mappe bleibt stehen:** Am 6. März 2029 stehen auf den Plätzen 1 bis 4 dieselben Vorlagen wie am 5. Juni 2028 (Haushaltskurs, Sicherheitsdoktrin, Industrieller Wohnungsbau, Gebäude-Verstärkung); neu ist nur der Hinweis „Tolga Akın ist distanziert (Loyalität 52); die Empfehlung kann Eigeninteresse sein“ — ein schönes Detail.
- **Die Vergangenheit kommt zurück:** Die YENİ-Zusage kam dreimal (September, Dezember „letzte Vertröstung“, März), bis ich sie brach. Das ist die stärkste Kette dieser Sitzung und genau die Säule 3 aus SPIELDESIGN.md.
- **Eine Krise im engeren Sinn** (Anschlag in Adana, Streikwelle) wurde jeweils mit einem Klick beantwortet; ein Folgefaden („Die Ermittlungen ergeben …“, „Die Gewerkschaft droht erneut …“) erschien in diesen neun Monaten nicht.

Screenshots: `shots_w4/07-stopp-2.png` (Schreibtisch im August), `07-stopp-7.png` (Haushaltsakte nach „Entwurf selbst vorbereiten“), `08-schreibtisch-spaet.png` (März 2029).
