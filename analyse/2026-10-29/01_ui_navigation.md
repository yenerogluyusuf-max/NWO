# 01 · Informationsarchitektur, linke Leiste und alle Ansichten

Stand der Prüfung: **W4** (Commit `09a14ff`, Code unter `/home/user/nwo-w4/game`, Server `http://localhost:5199/`), Prüfdatum 29.10.2026.
Der alte Stand (`/home/user/nwo-analyse/game`, zwölf Einträge links) dient nur noch zum Vergleich (Abschnitt 10). Befunde, die nur dort galten, sind als **„in W4 behoben“** markiert.

Pfadkürzel: `ui/…` = `/home/user/nwo-w4/game/src/ui/…`, `sim/…` = `/home/user/nwo-w4/game/src/sim/…`, `i18n/…` = `/home/user/nwo-w4/game/src/i18n/…`.
Screenshots: `SP/…` = `/tmp/claude-0/-home-user-NWO/d4866be2-bd79-588d-ab46-992dad67ab93/scratchpad/analyse/ui/…`

- `SP/w4/` – Start und Hauptbildschirm mit WebGL-Karte (1600×900)
- `SP/w4v/` – alle Ansichten mit allen Reitern (1600×900, **ohne WebGL**, damit die Aufnahmen in vertretbarer Zeit liefen; die Karte fehlt dort im Hintergrund, unten rechts steht deshalb „Die Karte konnte …“, das ist ein Artefakt der Messung)
- `SP/w4k/` – Klickwege, Zeitlauf, 1366×768 (`klein_*`) und 390×844 (`handy_*`)
- `SP/shots/` – alter Stand (nur Vergleich)
- Kennzahlen je Ansicht (Wörter, Zahlen, Knöpfe, Scrollhöhe): `SP/w4v/text/metriken.json`; Klickprotokoll: `SP/w4k/text/klick.json`

Methode: Playwright, `?schnellstart`, Sprache Deutsch (`locale: de-DE`), jede Ansicht und jeder Reiter einmal geöffnet und abfotografiert, dazu ein Durchlauf, der jeden Knopf am Schreibtisch, jede Hinweis-Kapsel, jede Kopfleisten-Zahl und die Verweise in den Ereignisfenstern anklickt und das Ergebnis protokolliert, dann viermal „Bis zum nächsten Ereignis“. Jede Partie hat einen anderen Zufallsstart; deshalb schwanken die Sitzzahlen zwischen den Screenshots (320, 340, 346, 358, 546). Das ist kein Fehler.

---

## 1. Was nicht sauber funktioniert

Funktionsbefunde, nach Priorität. „Beleg“ nennt Screenshot und Codezeile.

| # | P | Befund | Beleg | Vorschlag |
|---|---|---|---|---|
| F1 | **P0** | **Die linke Leiste ist bei 1366×768 abgeschnitten.** Der letzte Eintrag „Medien“ reicht bis y = 787 und liegt damit unter dem Fensterrand (768). Die Ausweichregel greift erst ab einer Höhe von höchstens 760 px. 1366×768 ist eine häufige Laptop-Auflösung. (Bei 1600×900 passen die zehn Einträge in W4; im alten Stand war dort „Chronik“ abgeschnitten, **in W4 behoben**.) | `SP/w4k/klein_03_haupt.png`; Messung `SP/w4k/text/klein.json` (Medien 725–787); `ui/styles.css:1229` (`@media (max-height: 760px)`), `ui/styles.css:1162` | Grenze auf `max-height: 820px` heben oder die Leiste `overflow-y:auto` machen. Besser: Einträge auf neun senken (Abschnitt 8), dann passt es bis 740 px ohne Sonderregel. |
| F2 | **P1** | **Die Amtsübergabe widerspricht der Kopfleiste.** Der Text sagt „Mit YENİ Parti (100) steht das Regierungslager bei 234 Sitzen: eine Mehrheit fehlt noch“, die Kopfleiste zeigt im selben Moment 546/600 mit „Mehrheit steht“. Der Starttext zählt nur das Lager, die Kopfleiste das Lager plus die geduldeten Sitze. | Text `SP/w4/text/00_start_0.txt`, Kopfleiste `SP/w4/03_hauptbildschirm.png`; `ui/Stage.tsx:1463` (`sicht.lager >= 301` ohne `duldungSitze`) | Im Starttext dieselbe Rechnung wie in `ui/akte/lage.ts:22` (`mehrheitsSicht`) nutzen und die Duldung nennen („… 234 Sitze, mit der Duldung der X 546“). |
| F3 | **P1** | **„So regieren Sie“ verweist auf Menüpunkte, die es nicht mehr gibt:** „Politik“, „Wähler“, „Die Welt“, „Programme“. In W4 heißen sie Schreibtisch › Probleme im Land/Heute, Gesellschaft, Außen, Agenda › Programme. Der neue Spieler sucht die Namen in der Leiste und findet sie nicht. Der Text ist außerdem fest auf Deutsch, nicht übersetzt. | `SP/w4/text/00_start_3.txt`; `sim/spiel.ts:234–235` | Text aus dem Menü-Katalog erzeugen (`t("nav.…")`), damit er nie wieder veraltet; ins i18n übernehmen. |
| F4 | **P1** | **Die Kacheln des Übersicht-Musters sind gestaucht.** In Wirtschaft › Instrumente › Haushalt stehen die Titel abgeschnitten („R…“, „Was Sie beschlosse…“, „Nächstes Haushaltsf…“), die Werte brechen senkrecht um („60 / % / des / Lohns“), dazu verirrte Klammern „] ]“. In Inventar und Streitkräfte ist es milder: die Kacheltexte stehen zentriert und die Werte brechen um („Index / 100“, „60 / Tage“). Die Lagezeile und das Raster lassen rechts etwa 150 px leer. Betroffen ist also das neue gemeinsame Muster, nicht eine einzelne Ansicht. Ausgerechnet der Haushalt, das wichtigste Instrument, ist so kaum lesbar. | `SP/w4v/20_Wirtschaft_und_Haushalt__Instrumente__Haushalt_Plan_Regler_Nachtrag.png`, `SP/w4v/21_…Inventar….png`, `SP/w4v/50_Sicherheit_und_Militär__Instrumente__Streitkräfte.png`; `ui/akte/uebersicht.css:1–40`, Verwendung `ui/wirtschaft/Haushalt.tsx:575`, `ui/gueter/Inventar.tsx:120`, `ui/militaer/Streitkraefte.tsx:246` | Vermutlich überschreibt eine allgemeine Knopfregel (zentrierter Text, Raster) `.ub-kachel`. Den Selektor schärfen (`.ub .ub-kachel`) und `.ub-wert { white-space: nowrap }` setzen. Eine Prüfung im Browser bei drei Breiten anlegen, wie es sie schon für die Kopfleiste gibt. |
| F5 | **P1** | **Der Verweis im Ereignisfenster führt in eine Akte, die sofort wieder verdeckt wird.** „Haushaltsakte öffnen“ öffnet Wirtschaft › Haushalt, gleich darauf legt sich das nächste wartende Ereignis („YENİ meldet sich“) als Fenster darüber. Man kann sich die Akte, die man ansehen wollte, nicht ansehen. | `SP/w4k/k_fensterlink_0.png` (Kopfleiste abgedunkelt, Akte darunter); Protokoll `klick.json` „Klick Haushaltsakte öffnen … fenster: YENİ meldet sich“; Bedingung `ui/Stage.tsx:1252` (Fenster erscheint, sobald irgendein Ereignis offen ist, auch bei offener Akte) | Nach einem Sprung aus dem Ereignisfenster alle offenen Ereignisse zurückstellen, bis die Akte geschlossen wird (oder bis zum nächsten Tageswechsel). Die Kapsel „n Entscheidungen“ zeigt ja weiter, dass etwas wartet. |
| F6 | P2 | **Datum erscheint roh als „2033-06-05“** in der Wählerkoalition („Die Wahl ist am 2033-06-05“). | `SP/w4v/26_Gesellschaft_und_Opposition__Instrumente__Wählerkoalition.png`; `ui/Waehler.tsx:35–38` übergibt `bilanz.wahlDatum` (ISO-Text aus `sim/waehler.ts:169`) ohne `formatDateDe` | `datum(bilanz.wahlDatum)` aus `i18n` verwenden. |
| F7 | P2 | **Jahreszahl mit Tausenderpunkt:** In den Tooltips der Kopfleiste steht bei Inflation und Lira „Stand 2.025“. | `SP/w4v/text/03_hud.json`; `ui/vergleich.ts:198` übergibt `jahr` als Zahl, die Übersetzungsschicht formatiert Zahlen mit Tausendertrennung | `jahr: String(ind.tur.jahr)`. |
| F8 | P2 | **Dieselbe Meldung dreimal:** Nach dem Zeitlauf stehen drei gleiche Karten „4 Meldungen im Umlauf“ untereinander. Der Zähler wird erst beim Öffnen des Schreibtischs zurückgesetzt, jede Pause meldet ihn neu. | `SP/w4k/k_zeit_1.png`; Protokoll „ZEIT 1“; `ui/Stage.tsx:254` | Die Umlauf-Meldung ersetzen statt anhängen (feste `id`). |
| F9 | P2 | **Der aktive Leisten-Knopf schneidet seine Beschriftung ab:** „Schreibtiscl“, „Gesellschaf“. | `SP/w4v/10_…Schreibtisch.png`, `SP/w4v/25_…Lage.png` | Beschriftung kürzen („Kanzlei“/„Volk“) oder `font-size` im aktiven Zustand nicht vergrößern. |
| F10 | P2 | **Sprungziele, die nicht zur Sache passen:** (a) Termin „Zinssitzung der Zentralbank“ führt zu Wirtschaft › **Lage**, nicht zu Zentralbank/Zinssitzung; (b) Ereignis „Wiederaufbau im Erdbebengebiet“ bietet „**Wählerkoalition** öffnen“, nicht Land › Lage und Wiederaufbau; (c) Warnungen „Präsident überlastet/angespannt/ruhige Tage“ führen in die **Chronik**, die die Belastung gar nicht zeigt (wie im alten Stand, nicht behoben); (d) Termin „Welterbekomitee der UNESCO“ ist ein deaktivierter Knopf ohne Ziel, obwohl Kultur und Erbe existiert. | Protokoll `SP/w4k/text/klick.json` (SK 18, SK 20, FENSTER 2); `ui/schreibtisch/briefing.ts:430` (Zins → `wirtschaft`), `briefing.ts:346–350` (→ `chronik`) | Zins → `{ akte: "entscheidungen" }` (öffnet die Zentralbank); Wiederaufbau → `katastrophe`; Belastung → Schreibtisch-Zeile „Aufmerksamkeit/Belastung“ aufklappen; UNESCO → `reich_kultur`. |
| F11 | P2 | **Dieselbe Zahl führt an verschiedene Orte:** Kapital in der Kopfleiste → Schreibtisch; Kapital-Karte am Schreibtisch → Reiter „Heute“. Kapsel „Zusagen“ → Schreibtisch, obwohl es Regierung › Zusagen gibt. | `klick.json` (KOPF KAPITAL, SK 1, CHIP Offene Zusagen) | Eine Regel: jede Zahl führt dorthin, wo man sie ändert. Kapital → eine kleine Aufschlüsselung (Einnahmen/Ausgaben je Monat), Zusagen → Regierung › Zusagen. |
| F12 | P2 | **Das Abzeichen „5“ an „Land“ zählt Rüstungsprojekte mit** (F-16 Block 70, Stahlkuppel, Kernkraftwerk, Wiederaufbau, …). Land › Lage listet „F-16 Block 70“ unter „Bauvorhaben im Bau“. Militärische Vorhaben gehören zu Sicherheit. | `SP/w4v/text/62_Land_und_Regionen__Lage.txt`; `ui/Stage.tsx:555` (`reich.laufend.length` über alle Bereiche) | Abzeichen je Akte nach `vorhabenDef(id).bereich` filtern. |
| F13 | P2 | **Personen widersprechen sich im selben Fenster:** „YENİ meldet sich“ wird von Justizministerin *Gizem Ateş* vorgelegt, die Antwort nennt als Justizministerin *Ilgın Yücel*. | `SP/w4/text/00_start_5.txt` | Vorleger und Wirkungszeilen aus derselben Figurenliste ziehen; ungeprüft, ob die Antwort einen Wechsel meint („neue Minister aus ihren Reihen“). Dann muss das im Text stehen. |
| F14 | P2 | **Doppelte Achsenbeschriftung** im Inflationsdiagramm: „31,6 / 31,5 / 31,5“. | `SP/w4v/18_Wirtschaft_und_Haushalt__Lage.png` | Bei kleiner Spannweite Achse auf mindestens ±1 Punkt spreizen oder Nachkommastelle erhöhen. |
| F15 | P2 | **Sprache folgt der Browsersprache, ohne Rückfrage.** Mit englischem Browser startet das Spiel auf Englisch („Assume Office“), auch für einen deutschen Spieler. | erster W4-Lauf; `i18n/index.ts:55` | Beim ersten Start einmal fragen (die Sprachwahl gibt es im Titelbild schon). |
| F16 | P2 | **Handy (390 px): Die acht Reiter des Schreibtischs sind unsichtbar** (Reiterzeile 10 px breit bei 716 px Inhalt); die Hinweis-Kapseln liegen über dem Aktentitel; die Kartenebenen-Plakette liegt über dem Inhalt. | `SP/w4k/handy_1_Schreibtisch.png`; `SP/w4k/text/handy.json` (`tabsSicht: 10`) | Siehe Abschnitt 9. |

**Konsolenfehler:** In allen Läufen ohne WebGL gab es keine Seitenfehler und keine React-Warnungen. Die einzigen Fehler waren die erwarteten WebGL-Meldungen, weil WebGL abgeschaltet war (`SP/w4v/text/fehler.json`). Den Lauf mit WebGL habe ich wegen der Rechenzeit (gut 2 Minuten je Bild) nach dem Hauptbildschirm abgebrochen; Konsolenfehler im WebGL-Pfad sind deshalb **ungeprüft**.

**Geprüft und in Ordnung:** Ein zweiter Klick auf den aktiven Leisten-Eintrag schließt die Akte. Jede Kopfleisten-Zahl öffnet eine Akte (Zustimmung → Wählerkoalition, Parlament → Fraktionen, Inflation/Lira → Wirtschaft › Lage). Kapsel „Programmschritt bereit“ → Agenda › Programme, Kapsel „akute Probleme“ → Schreibtisch › Heute plus Kartenebene „Akute Probleme“. Warnung „Hasankeyf verfällt“ → Land › Kultur und Erbe. „Später“ in der Unterschriftenmappe gibt die Rückmeldung „Wiedervorlage in 30 Tagen“. Zurückgestellte Ereignisse laufen nach 30 Tagen mit Standardfolge und Meldung ab (`k_zeit_2`).

---

## 2. Die neue Struktur in W4, wie sie wirklich ist

`ui/Stage.tsx:474–577` (Menü), `ui/akte/Bereiche.tsx:380–440` (Aktengerüst), `ui/akte/Akte.tsx`.

```
Kopfleiste: Wer │ Wann (Datum, 5 Tempi) │ Zustimmung · Kapital · Parlament · +2 wählbar │ ☰ (Sichern, Spielstände, Ton, Sprache, Werte, Effekte, Hauptmenü)
Hinweis-Kapseln (bis 4+) · Meldungen rechts · Legende „Marken auf der Karte“ (offen) · Effekte-Knopf · Kartenebene (Ausklappliste, Tasten 1–9, 0, B)

Leiste (10):
1 Schreibtisch ──── Reiter oben: Schreibtisch · Heute · Probleme im Land · Chronik · Berichte · Warum ist das passiert? · Spielstand · Quellen   (8)
2 Wirtschaft ────── Reiter oben: Wirtschaft · Verwaltung
                    └ in „Wirtschaft“ zusätzlich: Lage · Instrumente(Zentralbank und Devisen · Haushalt · Inventar) · Verlauf · Personen · Vorgänge
3 Gesellschaft ──── Lage · Instrumente(Wählerkoalition[Wählerkoalition · Gesellschaft, Opposition, Straße] · Wahlkampf · Behörden) · Verlauf · Personen · Vorgänge
4 Parlament ─────── Lage · Instrumente(Gesetzesvorhaben · Fraktionen und Abstimmung · Umsetzung · Verfassung · Justiz · Behörden) · Verlauf · Personen · Vorgänge
5 Regierung ─────── Lage · Instrumente(Ministerrat & Kabinett[Ministerrat · Gespräche & Umfeld · Machtkreis · Zusagen][Vorlagen der Minister · Befehle erteilen][Filter je Ressort] · Gespräch · Behörden) · Verlauf · Personen · Vorgänge
6 Sicherheit ────── Lage · Instrumente(Streitkräfte · Rüstung und Beschaffung[Lage · Rüstung pflegen · Beschaffung und Doktrinen] · Behörden) · Verlauf · Personen · Vorgänge
7 Außen ─────────── Lage · Instrumente(Länder und Diplomatie[Außenlage · Staaten · Blöcke · Dienst · Vermittlung][je Land: Überblick · Verhandlungstisch · Verträge · Gesten · Beitritt] · Behörden) · Verlauf · Personen · Vorgänge
8 Land ──────────── Lage · Instrumente(Infrastruktur und Bau[Lage · Bauwerke pflegen · Neue Vorhaben] · Netze · Kultur und Erbe · Lage und Wiederaufbau · Behörden) · Verlauf · Personen · Vorgänge
9 Agenda ────────── Lage · Instrumente(Fokusbaum · Wissensbaum · Programme · Behörden) · Verlauf · Personen · Vorgänge
10 Medien ───────── Lage · Instrumente([Ausgaben · Medien]) · Verlauf · Personen · Vorgänge
```

**Messwerte (aus `SP/w4v/text/metriken.json`, 1600×900):**

| Größe | Wert |
|---|---|
| Erreichbare Ansichten (Reiter-Endpunkte, ohne Länder-/Figurenreiter) | 74 |
| Navigationsebenen bis zum Inhalt, tiefster Fall | 6: Leiste › Instrumente › Ministerrat & Kabinett › Ministerrat › Vorlagen der Minister › Ressortfilter (`SP/w4v/43_…Ministerrat_Kabinett.png`) |
| Reiterzeilen übereinander auf einem Bildschirm | bis 4 (Akte-Reiter, Unterreiter, Innenreiter, Filter), `SP/w4v/26_…`, `SP/w4v/43_…` |
| Wo der eigentliche Inhalt beginnt | bei y ≈ 400 von 900 (Wählerkoalition), y ≈ 475 (Ministerrat), y ≈ 740 (erste Vorlage im Ministerrat). Zwischen 40 % und über 80 % der Fensterhöhe sind Kopf, Zweckzeile, Kernwerte und Reiter. |
| Leere oder fast leere Seiten am ersten Tag | 40 von 74 Seiten haben weniger als 90 Wörter (einschließlich der rund 50 Wörter des Aktenkopfs, also praktisch ohne eigenen Inhalt), darunter alle Reiter „Verlauf“ und „Vorgänge“ der neun Akten („Für diesen Bereich liegen noch keine Monatsdaten vor“, „Noch keine Vorgänge“), Chronik, Berichte, Medien › Instrumente (nur „Die erste Ausgabe erscheint am Monatsersten“). |
| Längste Seiten | Ministerrat 8.966 px Scrollhöhe (etwa 12 Bildschirme, 1.690 Wörter, 114 Knöpfe); Verfassung 3.853 px; Zentralbank 3.772 px; Wählerkoalition 3.109 px; Heute 3.016 px |

**Urteil:** W4 hat die richtige Idee umgesetzt (VISION_IM_DETAIL 0.2: Karte, Schreibtisch, Akten nach einem Muster), aber in zwei Punkten das Gegenteil des Ziels erreicht:

1. **Der Schreibtisch ist zum Sammelbecken geworden.** Laut Vision zeigt er „höchstens 5 Dinge, die heute zählen“. Tatsächlich hat er acht Reiter, darunter das komplette alte Politik-Dossier (15 Bereiche mit allen Maßnahmen: „Probleme im Land“), das Expertennetz („Warum ist das passiert?“) und zwei Verwaltungsseiten (Spielstand, Quellen), die ins ☰-Menü gehören. Das, was die Vision unter „Was weg muss“ nennt („das Politik-Dossier mit sechs überlappenden Reitern“), ist nicht weg, sondern umgezogen.
2. **Das Aktengerüst wurde um die alten Ansichten herumgebaut, nicht an ihre Stelle.** Laut Code-Kommentar (`ui/akte/Bereiche.tsx:1–3`) liegen „die bisherigen Ansichten des Bereichs unverändert im Reiter ‚Instrumente‘“. Jede alte Ansicht bringt ihre eigenen Reiter mit. Dadurch entstehen vier bis sechs Ebenen.

---

## 3. Bewertung jeder Ansicht

Spalten: **Zweck** (welche Frage sie beantwortet), **Entscheidung** (was man dort tut), **Zu viel / doppelt**, **Fehlt / widerspricht**, **Klicks** (vom Hauptbildschirm bis zur ersten Entscheidung, gezählt mit dem Weg über die Leiste).

### 3.1 Schreibtisch (8 Reiter)

| Reiter | Zweck | Entscheidung | Zu viel / doppelt | Fehlt / widerspricht | Klicks |
|---|---|---|---|---|---|
| **Schreibtisch** (`SP/w4v/10_…`, 498 Wörter, 2,5 Bildschirme) | Was ist heute zu tun? | Empfehlung annehmen, später, alle Optionen | Vier Kennzahlen wiederholen die Kopfleiste (Zustimmung, Kapital, Mehrheit, Inflation). Das Datum steht in der Kopfleiste und groß als Überschrift. Die Unterschriftenmappe zeigt dieselben Vorgänge wie „Heute“ und der Ministerrat (Abschnitt 4). | „Zustimmung 51 % – Wahlanteil beim Amtsantritt“ sieht aus wie ein Vergleich, ist aber derselbe Wert. „Was kann ich liegen lassen? – Keines“ ist am ersten Tag keine Hilfe. | 1 (Leiste) + 1 |
| **Heute** (`11_…`, 4 Bildschirme) | Was hat den größten Hebel? | Gesetz einbringen | Gleiche Vorlagen wie Mappe und Ministerrat. „ausbauen von Stufe 25 auf 45“: die Vision verlangt „das Feld ‚Stufe‘ in allen Texten“ zu entfernen. | Warum schlägt der Wirtschaftsminister den Wohnungsbau vor? (ungeprüft, ob Absicht) | 2 + 1 |
| **Probleme im Land** (`12_…`) | Politik nach 15 Bereichen | jede Maßnahme | **Doppelt zu den Akten:** Wirtschaft, Haushalt und Steuern, Recht und Justiz, Streitkräfte, Kultur und Erbe, Infrastruktur, Außenpolitik gibt es hier und als Akte, mit anderen Instrumenten | Der Reitername sagt „Probleme“, der Inhalt ist „alle Politikfelder“. | 2 + 2 |
| **Chronik** (`13_…`, 44 Wörter) | Was geschah? | keine | – | am ersten Tag leer | – |
| **Berichte** (`14_…`, 54 Wörter) | Wirkt das Beschlossene? | keine | Wirkungsberichte stehen zusätzlich in jedem Akten-Reiter „Verlauf“ | am ersten Tag leer | – |
| **Warum ist das passiert?** (`15_…`) | Das ganze Politiknetz | jede Maßnahme mit Stufen | Dritter Weg zu denselben Maßnahmen (neben „Probleme im Land“ und den Akten) | **Der Name lügt:** Es ist kein Erklärfenster, sondern die Expertenansicht mit Reglern (Mindestlohn „Stufe 50“). | 2 + 2 |
| **Spielstand** (`16_…`) | Speichern | Sichern, Export | doppelt zum ☰-Menü („Spielstand sichern“, „Spielstände“) | gehört nicht auf den Schreibtisch | – |
| **Quellen** (`17_…`) | Lizenzen und Quellen | keine | – | gehört ins ☰-Menü oder ins Titelbild | – |

### 3.2 Wirtschaft und Haushalt

| Reiter | Bewertung |
|---|---|
| Kopf: „Wirtschaft · Verwaltung“ **plus** Aktengerüst darunter (`18_…`) | **Einzige Akte mit zwei Reiterleisten übereinander.** „Verwaltung“ (Verwaltungskraft, Baukapazität, Sonderrechte) ist keine Wirtschaftsfrage; der Kopf heißt „Wirtschaft und Haushalt“, der Reiter „Verwaltung“ zeigt `reich_haushalt`. Die Bezeichnungen widersprechen sich (Haushalt ist ein Unterreiter von Instrumente, „Verwaltung“ ein Kopfreiter). |
| Lage (`18_…`) | Gut: Kennzahlenliste links, Diagramm mit Erklärung rechts. Doppelte Achsenbeschriftung (F14). Inflation steht an dieser Stelle fünfmal: Kopfleiste, Kernwert, Liste, Überschrift, Diagramm. |
| Instrumente › Zentralbank und Devisen (`19_…`, 3.772 px) | inhaltlich reich, sehr lang |
| Instrumente › Haushalt (`20_…`) | **Kacheln gestaucht (F4).** Der Haushalt ist die wichtigste Stellschraube und kaum lesbar. |
| Instrumente › Inventar (`21_…`) | Kacheln zentriert und umbrochen (F4); Detailleiste rechts gut |
| Verlauf · Personen · Vorgänge (`22–24`) | am ersten Tag dünn |
| **Klicks bis „Haushalt ändern“** | 3 (Leiste › Instrumente › Haushalt); über die Leiste landet man zuerst auf „Lage“ (`ui/Stage.tsx:629–635`). |

### 3.3 Gesellschaft und Opposition

| Reiter | Bewertung |
|---|---|
| Lage (`25_…`, 80 Wörter) | Vier Milieu-Karten mit „Stimmung/Groll“; zwei Drittel der Fläche leer. Der Knopf „Zu den Ansichten und Handlungen dieses Bereichs“ ist ein zusätzlicher Klick, den man sich sparen könnte. |
| Instrumente › Wählerkoalition (`26_…`) | **Vier Reiterzeilen übereinander.** 51 % steht dreimal auf einem Bildschirm (Kopfleiste, Kernwert, „Wenn heute gewählt würde“). Rohes ISO-Datum (F6). Inhalt danach gut (Träger/Schwankend/Abgewandt). |
| Instrumente › Wahlkampf (`27_…`, 118 Wörter) | Vier Jahre und zehn Monate lang nur ein Countdown. Sollte erst in der Wahlkampfphase erscheinen (oder als Termin am Schreibtisch). |
| Instrumente › Behörden (`28_…`) | dünn; Behörden gibt es in jeder Akte als eigenen Unterreiter (neun Mal) |
| **Medien** fehlt hier, obwohl die Zweckzeile von Medien („Wie das Land von Ihrer Politik erfährt“) und die Zeitung mit der „Umfrage des Monats“ genau hierher gehören. |

### 3.4 Parlament und Recht

| Reiter | Bewertung |
|---|---|
| Lage (`32_…`) | „Gesetze im Verfahren: derzeit nichts“, „Beim Verfassungsgericht: derzeit nichts“. Ehrlich, aber leer. |
| Gesetzesvorhaben (`33_…`) | Herzstück der Gesetzes-Engine; gut, dass es vorn steht |
| Fraktionen und Abstimmung (`34_…`) | Ziel der Kopfleisten-Zahl „Parlament“, richtig |
| Umsetzung (`35_…`) | Beschlussbuch. Doppelt zu Schreibtisch › Berichte und Verlauf. |
| Verfassung (`36_…`, 3.853 px) | lang; passt in diese Akte |
| Justiz (`37_…`) | passt. Im alten Stand lag die Justiz im „Reich“, **in W4 behoben**. |
| Gruppierung | gut: Parlament, Verfassung, Justiz gehören zusammen |

### 3.5 Regierung und Partei

| Reiter | Bewertung |
|---|---|
| Instrumente › Ministerrat & Kabinett (`43_…`) | **Die tiefste und längste Seite des Spiels:** 6 Ebenen, 12 Bildschirme, 114 Knöpfe. „Vorlagen der Minister (16)“ ist dieselbe Liste wie Schreibtisch › Unterschriftenmappe und Heute. Zwei Loyalitätswerte auf einem Bildschirm: Kernwert „Loyalität im Kabinett 58“ und „Schnitt Loyalität 59 %“ (verschiedene Rechnungen, `ui/akte/Bereiche.tsx` Kernwert „regierung“ ohne Partner, Ministerrat mit sieben Ressorts). „Termine (30 Tage) 0 von 4 / Ihre Zeit ist knapp“ wirkt widersprüchlich. |
| Instrumente › Gespräch (`44_…`) | Freie Eingabe. Gut, dass es zur Regierung gehört (das Präsidialamt antwortet), aber für neue Spieler kaum auffindbar. Im alten Stand stand es in der Leiste. |
| Machtkreis, Zusagen | nur als Innenreiter des Ministerrats erreichbar. Die Kapsel „Zusagen“ führt nicht dorthin (F11). |

### 3.6 Sicherheit und Militär

| Reiter | Bewertung |
|---|---|
| Streitkräfte (`50_…`) | Kacheln gestaucht (F4). „Index 100“ bei fast jeder Waffengattung, dazu „Kampfkraft 100“: am Start alle 100, also eine **Zahl ohne Bedeutung** für den Spieler (relativer Index ohne Bezug). |
| Rüstung und Beschaffung (`51_…`) | Verwaltungskraft und Baukapazität stehen wie in Land › Infrastruktur noch einmal oben |
| Gruppierung | Zwei Unterreiter für dieselbe Sache (Truppen ↔ ihre Ausrüstung). Zusammenlegen: „Streitkräfte“ mit Abschnitten Bestand · Beschaffung · Doktrin. |

### 3.7 Außenpolitik

`57_…`: Länderliste links mit Gruppenfiltern, rechts das Land mit fünf Reitern (Überblick, Verhandlungstisch, Verträge, Gesten, Beitritt), darüber noch eine Fünferwahl (Außenlage, Staaten, Blöcke, Dienst, Vermittlung). Inhaltlich die reichste Ansicht, navigatorisch fünf Ebenen. Die Karte (Klick auf eine Flagge öffnet das Land) ist der bessere Einstieg; im Spiel ist sie vorhanden (`ui/welt/LandPopover.tsx`).

### 3.8 Land und Regionen

| Reiter | Bewertung |
|---|---|
| Lage (`62_…`) | Listet Rüstungsprojekte als „Bauvorhaben im Bau“ (F12). |
| Infrastruktur und Bau (`63_…`) | gut lesbar, mit klarer Handlung („Instandsetzen – 2 Kapital · 150 Baupunkte · 8 Monate“). **Vorbild für die anderen Instrumente.** |
| Netze, Kultur und Erbe, Lage und Wiederaufbau | passen zusammen. Katastrophen als eigener Leisten-Eintrag (alter Stand) ist **in W4 behoben**. |

### 3.9 Agenda (Wissen und Agenda)

| Reiter | Bewertung |
|---|---|
| Fokusbaum (`72_…`) | In der Übersicht ist die Schrift der Knoten zu klein zum Lesen (Lupe nötig). Ein Klick auf „+“ oder „Vollbild“ ist Pflicht. |
| Wissensbaum, Programme | Programme und Fokusbaum beantworten dieselbe Frage („Woran arbeite ich über Jahre?“). Für Spieler ist der Unterschied nicht erklärt. |
| Name | Leiste „Agenda“, Titel „Wissen und Agenda“, Kernwert „Hochschulen 44“: drei verschiedene Begriffe für eine Akte. |

### 3.10 Medien und Öffentlichkeit

`79–83`: Lage mit Pressefreiheit 29,4; **Instrumente zeigt am ersten Tag nichts** außer „Die erste Ausgabe erscheint am Monatsersten“ (Reiter „Ausgaben“). Die eigentlichen Hebel liegen im Innenreiter „Medien“ (`SP/w4k/k_medien_medien.png`). Eine ganze Akte für einen Bereich, der vier Wochen lang leer ist und dessen Kernaussage (die Umfrage) zur Gesellschaft gehört. **Mit Gesellschaft zusammenlegen.**

### 3.11 Kopfleiste, Kapseln, Karte

| Element | Bewertung |
|---|---|
| Kopfleiste (drei Zonen) | Gut und ruhig. Werte sind klickbar, die Auswahl der zwei Zusatzwerte steht im ☰-Menü. Schwächen: „Stand 2.025“ (F7); kein Datum der nächsten Kapitalgutschrift außer im Tooltip. |
| Hinweis-Kapseln | Sinnvoll (HOI4-Vorbild). „3 Entscheidungen“ öffnet das erste Ereignisfenster, „akute Probleme“ den Reiter Heute. Die Kapsel „Zusagen“ führt zum falschen Ort (F11). |
| Ereignisfenster am Start | Drei Fenster hintereinander, bevor man das Spiel sieht (Abschnitt 7). |
| Karte (`SP/w4/03_hauptbildschirm.png`) | Neben fast jeder Provinz ein Warndreieck und eine Zahl ohne Einheit („15,8 İstanbul“, „5,9 Ankara“; vermutlich Einwohner in Millionen, ungeprüft). Die Legende „Marken auf der Karte“ ist dauerhaft offen und verdeckt den Osten. Bei 1366×768 lag in einem Lauf ohne WebGL ein Provinzschild über dem Namen des Spielers (`klein_03_haupt.png`); mit WebGL ungeprüft. |
| ☰-Menü (`k_zeit_1.png`) | „Effekte Mittel“ steht im Menü **und** als eigener Knopf unten rechts (doppelte Steuerung). |
| Symbole | „Außen“ trägt ein Berg-Symbol; „Wirtschaft“ dasselbe Bank-Symbol wie der Leitzins; „Land“ (Karte) und „Agenda“ (Buch) sind in der Leiste kaum zu unterscheiden (`SP/w4/03_hauptbildschirm.png`). |

---

## 4. Wo dieselbe Information mehrfach steht

| Information | Orte in W4 | Urteil |
|---|---|---|
| Wartende Ereignisse / Vorlagen | Ereignisfenster · Kapsel „3 Entscheidungen“ · Leisten-Abzeichen · Schreibtisch › Unterschriftenmappe · Schreibtisch › Heute · Regierung › Ministerrat › Vorlagen der Minister · Kartenmarken | **7 Orte**. Ein Ort (Mappe) und Verweise genügen. |
| Politische Maßnahmen | Schreibtisch › Probleme im Land (15 Bereiche) · Schreibtisch › Warum ist das passiert? (Netz) · Schreibtisch › Heute · die neun Akten (eigene Instrumente) · Wählerkoalition (Hebel) · Ereignis „Ursache angehen“ | drei vollständige Wege zum selben Regler |
| Zustimmung | Kopfleiste · Schreibtisch-Karte · Gesellschaft-Kernwert · Wählerkoalition (groß) · Chronik-Kurve · Zeitung (Umfrage des Monats) | Kopfleiste plus ein Ort für die Herleitung |
| Kapital | Kopfleiste (mit Aufschlüsselung im Tooltip) · Schreibtisch-Karte (mit anderer Aufschlüsselung) · jede Handlung | in Ordnung, wenn beide Aufschlüsselungen dieselben Teile nennen |
| Verwaltungskraft / Baukapazität | Wirtschaft › Verwaltung · Land › Infrastruktur · Sicherheit › Rüstung · Parlament › Justiz · Land › Kultur | geteilte Ressource. Einmal oben (Kopfleiste oder Ressourcenzeile) zeigen statt fünfmal. |
| Wirkungsberichte | Schreibtisch › Berichte · Parlament › Umsetzung · jeder Akten-Reiter „Verlauf“ | je Akte filtern ist richtig, der Sammelreiter kann in die Chronik |
| Behörden | eigener Unterreiter in acht Akten | richtig dezentral, aber am ersten Tag dünn |
| Spielstand | ☰-Menü und Schreibtisch-Reiter | nur ☰ |

---

## 5. Warum der Spieler „manchmal zu viel, manchmal zu wenig, manchmal keinen Sinn“ empfindet

Die drei Sätze des Projektinhabers lassen sich im Messbefund wiederfinden:

- **Zu viel:** Seiten mit 4 bis 12 Bildschirmen Länge (Ministerrat, Verfassung, Zentralbank, Wählerkoalition, Heute), bis zu vier Reiterzeilen übereinander, dieselben Vorlagen an drei Orten.
- **Zu wenig:** 40 von 74 Seiten haben am ersten Tag weniger als 90 Wörter. In jeder Akte sind drei von fünf Reitern (Verlauf, Personen, Vorgänge) anfangs fast leer. Medien › Instrumente und Gesellschaft › Wahlkampf sind leer oder nur ein Countdown. Über die Leiste landet man immer zuerst auf „Lage“, und die ist bei sieben von neun Akten eine dünne Zusammenfassung mit dem Knopf „Zu den Ansichten und Handlungen“.
- **Keinen Sinn:** Politikfelder liegen auf dem Schreibtisch statt in den Akten, „Warum ist das passiert?“ ist ein Regler, „Verwaltung“ steht in der Wirtschaft, Rüstungsprojekte zählen als Bauvorhaben im Land, „So regieren Sie“ nennt Menüpunkte, die es nicht gibt, und die Starttexte widersprechen der Kopfleiste.

---

## 6. Vergleich mit den Vorbildern

Beschreibung der Muster nach `RECHERCHE_SPIELFLUSS_UX.md` (Abschnitt 3.2–3.4) und allgemeiner Kenntnis der Spiele; Zahlen nur, wo die Recherche sie belegt.

| Spiel | Navigationsmuster | Was davon fehlt oder falsch übernommen ist |
|---|---|---|
| **Civilization VI** | Oberleiste mit Ressourcen; links oben wenige große Knöpfe (Forschung, Ausrichtung, Regierung, Religion …), jeder öffnet **genau eine** Bildschirmseite; Linsen schalten sich **im Moment der Entscheidung** selbst ein (Recherche 3.2); Meldungsstapel rechts unten | Bei uns öffnet ein Leisten-Knopf ein Gerüst mit weiteren Reitern statt einer Seite. Die Kartenebenen schalten sich nur bei „akute Probleme“ selbst um, sonst nicht (z. B. nicht „Katastrophenrisiko“ beim Wiederaufbau oder „Beziehungen“ beim Außenamt). |
| **Hearts of Iron IV** | Eine Zeile Fachknöpfe oben (Politik, Forschung, Diplomatie, Handel, Bau, Produktion …), **eine Ebene**, jedes Fenster eine Seite; Warnsymbole in einer Reihe darunter (Recherche 3.2) | Kapseln sind gut übernommen. Die Fachfenster haben bei uns zwei bis fünf Ebenen. |
| **Suzerain** | Schreibtisch mit Akten, Zeitung als „Soft-Dashboard“; wenig Navigation, die Geschichte kommt zum Spieler (VERBESSERUNGSPLAN 3.9) | Unser Schreibtisch trägt acht Reiter; die Zeitung ist in einer eigenen Akte versteckt und am ersten Monat leer. |
| **Democracy 4** | Ein Bildschirm: Politikfelder als Symbole nach Themen, Wählergruppen drumherum, Wirkungslinien; man sieht sofort, was man sich leisten kann (Recherche 3.4) | Unser „Probleme im Land“ ist dieser Bildschirm, nur liegt er als dritter Reiter des Schreibtischs und dupliziert die Akten. |
| **Victoria 3** | Linke Leiste nach Themen, jedes Thema öffnet eine Ausklappleiste mit wenigen Reitern; Linsen als Handlungsmodus; **Outliner** rechts mit angehefteten Vorgängen (Recherche 3.2); Negativ-Lehre: Meldungsflut (Recherche 3.3) | Am nächsten an unserem W4. Es fehlt der **Outliner** (laufende Gesetze, Bauten, Fristen dauerhaft sichtbar), stattdessen die offene Markenlegende rechts. |

Gemeinsames Muster aller fünf: **ein Klick in der Leiste öffnet eine Seite, auf der man handeln kann; Zusammenhänge kommen über Tooltips und Kartenebenen, nicht über weitere Reiter.**

---

## 7. Die ersten zehn Minuten eines neuen Spielers (W4, gemessen)

| Minute (geschätzt) | Was er sieht | Was er nicht versteht / wo er hängen bleibt | P |
|---|---|---|---|
| 0 | Amtsübergabe (Text `SP/w4/text/00_start_0.txt`; das Bild dieses Fensters scheiterte an der Rechenzeit, im alten Stand `SP/shots/00_start_amtsuebergabe.png`) | „Eine Mehrheit fehlt noch“, aber oben 546/600 (F2). | P1 |
| 1 | Zielwahl mit **18 Zielen** in vier Gruppen und drei Schwierigkeiten (`SP/w4/00_start_1.png`, `00_start_2.png`) | Ziele messen Größen, die er noch nie gesehen hat („Straßennetz Stufe 45“, „Glaubwürdigkeit 70“). | P2 |
| 2 | „So regieren Sie“ (`SP/w4/00_start_3.png`) | Verweist auf „Politik“, „Wähler“, „Die Welt“, „Programme“, die in der Leiste nicht vorkommen (F3). | P1 |
| 2–5 | **Drei Ereignisfenster nacheinander** (Haushalt, YENİ, Wiederaufbau), je drei Antworten mit Wirkungszeilen, „Worum es geht“ mit vier Kennzahlen, Verweisknopf (`SP/w4/00_start_4.png` bis `00_start_6.png`) | Er muss dreimal entscheiden, bevor er das Land gesehen hat. Folgt er dem Verweis („Haushaltsakte öffnen“), verdeckt das nächste Fenster die Akte (F5). Wählt er „Später“, kommt es nach 30 Tagen mit Standardfolge zurück. | P1 |
| 5 | Hauptbildschirm (`SP/w4/03_hauptbildschirm.png`): Karte mit Dutzenden Zahlen und Warndreiecken, 4 Kapseln, 10 Leisten-Einträge, Kartenebenen-Plakette, offene Legende, Effekte-Knopf | Wohin zuerst? Die Leiste hat zehn gleich gewichtete Einträge; die Kapseln sind der einzige Hinweis. | P1 |
| 6–8 | Schreibtisch: acht Reiter, vier Kennzahlen, drei Fragen, Aufmerksamkeit/Belastung, Unterschriftenmappe mit **denselben drei Ereignissen** noch einmal | „Habe ich das nicht gerade gesehen?“; der Unterschied zwischen Schreibtisch, Heute und Probleme im Land ist nicht ersichtlich. | P1 |
| 8–10 | Klick auf eine Akte, z. B. Gesellschaft → landet auf „Lage“ mit vier Milieu-Karten und viel Leerraum | Ein weiterer Klick auf „Instrumente“, dann auf einen Unterreiter, dann evtl. ein Innenreiter. Verlauf/Personen/Vorgänge sind leer. | P1 |

Gegen das Prüfkriterium aus `SPIELDESIGN.md` (Abschnitt „Prüfkriterium der Oberfläche“: nach 15 Minuten die drei wichtigsten Vorgänge nennen können): Die drei wichtigsten Vorgänge **sind** benannt (Kapseln, Mappe). Das Hindernis ist nicht fehlende Information, sondern dass sie an sieben Orten steht und die Struktur vom Handeln ablenkt.

**Vorschläge für den Einstieg (P1):** Amtsübergabe und Zielwahl zusammenlegen (Ziele erst nach dem ersten Monat oder mit höchstens sechs Vorschlägen nach Partei); die drei Startereignisse **nicht** als Fenster, sondern als die ersten drei Einträge der Unterschriftenmappe, mit einer einmaligen Kurzführung („Das ist Ihre Mappe. Beginnen Sie hier.“); „So regieren Sie“ als Zeile am Schreibtisch statt als Fenster, mit Verweisen auf die echten Leisten-Einträge.

---

## 8. Vorschlag: neue Struktur

Grundsatz (aus ENTSCHEIDUNGEN T2 und VISION 0.2, konsequent angewandt): **Leiste = Ort, an dem man handelt. Ein Klick in der Leiste öffnet eine Seite mit Handlungen. Höchstens eine Reiterzeile je Fenster. Netz, Erklärungen und Verlauf sind Werkzeuge, die man von jeder Zahl aus aufruft, keine Orte.**

### 8.1 Leiste: 9 Einträge in drei Gruppen (mit Trennstrich)

| Gruppe | Eintrag | Reiter (eine Zeile) | Was hineinwandert | Was herausfällt |
|---|---|---|---|---|
| **Tag** | 1 **Kanzlei** (Schreibtisch) | Mappe · Kalender · Chronik | Unterschriftenmappe = einzige Liste aller Vorlagen und Ereignisse (Heute, Vorlagen der Minister und Ereignisse zusammengeführt, nach Rang); Kalender = Fristen und Termine; Chronik = Ereignisse **und** Wirkungsberichte | „Probleme im Land“ → in die Akten (8.2); „Warum ist das passiert?“ → Werkzeug (8.3); Spielstand, Quellen → ☰; die vier Kennzahlen → entfallen (stehen in der Kopfleiste) |
| **Felder** | 2 **Wirtschaft** | Lage · Zentralbank · Haushalt · Handel & Inventar · Maßnahmen | Bereiche Wirtschaft, Haushalt und Steuern, Arbeit und Soziales | „Verwaltung“ → Regierung |
| | 3 **Gesellschaft & Medien** | Wähler · Milieus & Straße · Medien & Zeitung · Maßnahmen · (Wahlkampf nur in der Wahlkampfphase) | Akte Medien, Bereiche Gesundheit, Bildung, Medien und Gesellschaft, Wählergruppen | eigener Leisten-Eintrag Medien |
| | 4 **Parlament & Recht** | Gesetze · Fraktionen · Verfassung · Justiz · Maßnahmen | Bereich Recht und Justiz; „Umsetzung“ → Chronik | – |
| | 5 **Regierung** | Kabinett · Machtkreis · Zusagen · Verwaltung · Gespräch | „Verwaltung“ (Verwaltungskraft, Sonderrechte), Gespräch als Reiter | „Vorlagen der Minister“ → Mappe (hier nur je Minister verlinkt) |
| | 6 **Sicherheit** | Streitkräfte (Bestand, Beschaffung, Doktrin als Abschnitte) · Innere Sicherheit · Maßnahmen | Bereiche Streitkräfte, Innere Sicherheit und Frieden | zwei getrennte Unterreiter Streitkräfte/Rüstung |
| | 7 **Außen** | Länder · Blöcke · Verträge · Vermittlung · Maßnahmen | Bereich Außenpolitik und Migration | Fünfer-Vorwahl über der Länderliste |
| | 8 **Land** | Bauen · Netze · Erbe · Katastrophen · Maßnahmen | Bereiche Infrastruktur, Energie, Landwirtschaft und Wasser, Wohnen/Bau/Erdbeben, Kultur und Erbe | Rüstungsprojekte (→ Sicherheit) |
| **Jahre** | 9 **Agenda** | Programme · Fokusbaum · Wissensbaum · Ziele | Ziele der Amtszeit (heute nur Kernwert) | – |

Neun Einträge × 69 px + 108 px Kopf = 729 px: passt bis 768 Höhe ohne Sonderregel (F1).

### 8.2 Aufbau jeder Akte (ersetzt Lage/Instrumente/Verlauf/Personen/Vorgänge)

- **Kopf (eine Zeile):** Zweck als Tooltip am Titel statt als Absatz; drei Kernwerte klein rechts; jeder Kernwert öffnet seine Herleitung (Tooltip-in-Tooltip nach CK3, Recherche 3.1).
- **Eine Reiterzeile** mit den Handlungsorten (Tabelle 8.1). Die Akte öffnet **auf dem Reiter mit dem dringendsten offenen Vorgang**, sonst auf dem ersten. Kein Pflichtumweg über „Lage“.
- **Lage, Verlauf, Personen, Vorgänge** werden zu einer **rechten Seitenspalte** innerhalb jedes Reiters (wie die Detailleiste im Inventar, `SP/w4v/21_…`): oben Lage in drei Zeilen, darunter „Wer zuständig ist“ (Gesichter), darunter laufende Vorgänge. Leere Teile werden ausgeblendet statt als leerer Reiter gezeigt.
- **Behörden** als Abschnitt im passenden Reiter (z. B. MIT unter Sicherheit › Innere Sicherheit), nicht als neunfacher Unterreiter.
- **„Maßnahmen“** = die Politiknetz-Bereiche dieser Akte in der heutigen Bereichsansicht (`ui/politik/Politik.tsx`) ohne die linke 15er-Liste. Damit gibt es genau einen Ort je Thema.

### 8.3 Werkzeuge statt Orte

- **Politiknetz** („Warum ist das passiert?“): Aufruf über das Symbol „Warum?“ an jeder Zahl und über eine Taste, öffnet als Vollbild-Ebene über der Akte, Zurück führt zur Akte. Name: „Wirkungsnetz“ oder „Politiknetz (Expertenansicht)“.
- **Kartenebenen schalten sich selbst** passend zur offenen Akte (Land → Infrastruktur, Außen → Beziehungen, Katastrophen → Risiko, Gesellschaft → Rückhalt). Civ-Muster, Recherche 3.2.
- **Outliner rechts** (Vic3): laufende Gesetze mit Abstimmungstag, Bauten mit Fortschritt, Fristen ≤ 7 Tage. Ersetzt die dauerhaft offene Markenlegende (die nur beim ersten Start offen sein sollte).
- **☰-Menü:** Sichern, Spielstände, Quellen, Sprache, Ton, Werte, Effekte (den Effekte-Knopf unten rechts entfernen).

### 8.4 Zeitung

Die Zeitung bleibt eine Frontseite, erscheint aber zum Monatsersten **als Fenster** (wie in Suzerain), danach im Archiv unter Gesellschaft & Medien. Der Schreibtisch zeigt die Schlagzeile als Teaser (gibt es schon).

### 8.5 Klicks bis zur Entscheidung, vorher und nachher

| Handlung | W4 heute | Vorschlag |
|---|---|---|
| Haushalt ändern | Leiste › Instrumente › Haushalt (3) | Leiste › Haushalt (2) |
| Vorlage eines Ministers entscheiden | Leiste › Instrumente › Ministerrat & Kabinett › Ministerrat › Vorlagen (5), oder Schreibtisch › Mappe (1–2) | Kanzlei › Mappe (1) |
| Wählergruppe ansehen | Leiste › Instrumente › Wählerkoalition (3) | Leiste › Wähler (1–2) |
| Mindestlohn ändern | Schreibtisch › Probleme im Land › Arbeit und Soziales › Mindestlohn (4) **oder** Schreibtisch › Warum ist das passiert? › Suche (3+) | Wirtschaft › Maßnahmen › Mindestlohn (3) |
| Zusage einlösen | Leiste › Instrumente › Ministerrat & Kabinett › Zusagen (4) | Regierung › Zusagen (2) |

---

## 9. Handy (390×844, kurz geprüft)

`SP/w4k/handy_01_intro.png` … `handy_1_Regierung.png`, Messung `SP/w4k/text/handy.json`.

| Befund | P | Vorschlag |
|---|---|---|
| Kein seitliches Überlaufen der Seite (`scrollWidth` = 390), die Kopfleiste ist zweizeilig und lesbar. Gut. | – | – |
| Die acht Reiter des Schreibtischs sind auf 10 px zusammengedrückt, also unsichtbar. | P2 | Reiter als waagerecht wischbare Leiste oder als Auswahlliste; mit 8.1 sinkt die Zahl auf drei. |
| Die Hinweis-Kapseln liegen über dem Aktentitel. | P2 | Kapseln bei offener Akte ausblenden (als Zahl am Schreibtisch-Eintrag zeigen). |
| Die Kartenebenen-Plakette liegt unten über dem Akteninhalt. | P2 | bei offener Akte ausblenden. |
| Die Leiste verschwindet bei offener Akte (`ui/styles.css:1801`, gewollt). Ein Wechsel zwischen Akten braucht deshalb immer Schließen + Öffnen. | P2 | Unterer Tab-Balken mit vier Haupteinträgen (Kanzlei, Felder, Karte, ☰). |

---

## 10. Vergleich alter Stand → W4

| Befund im alten Stand (`/home/user/nwo-analyse`) | W4 |
|---|---|
| 12 Leisten-Einträge; bei 1600×900 ist „Chronik“ unter dem Fensterrand (`SP/shots/03_hauptbildschirm.png`; 128 + 12·62 + 11·7 = 949 px) | **in W4 behoben** für 900 px (10 Einträge). Bei 768 px weiter abgeschnitten (F1). |
| „Das Reich“ als Sammelbegriff (Kultur, Recht, Streitkräfte, Infrastruktur, Verwaltung) | **in W4 behoben** (auf Parlament, Sicherheit, Land, Wirtschaft verteilt). |
| „Katastrophen“ als eigener Leisten-Eintrag | **in W4 behoben** (Land › Lage und Wiederaufbau). |
| Zweckzeile der Chronik versprach Wirkungsberichte, die dort nicht standen (`nwo-analyse/game/src/ui/politik/zweck.ts`, `Chronik.tsx`) | **in W4 behoben** (eigener Reiter „Berichte“, Zweckzeile angepasst). |
| Politik mit fünf überlappenden Reitern (Bereiche, Heute, Programme, Umsetzung, Netz), Codekennungen vertauscht (`politik` = „Bereiche“, `bereiche` = „Heute“) | **nur verschoben**: Bereiche, Heute, Netz liegen jetzt im Schreibtisch, Programme in Agenda, Umsetzung im Parlament; die vertauschten Kennungen bestehen weiter (`ui/Stage.tsx:479ff`). |
| Warnungen „überlastet“ führen in die Chronik | **weiterhin** (F10c). |
| „So regieren Sie“ nannte „Politik“ als Ort für akute Probleme (im alten Stand lag dort aber zuerst „Bereiche“ statt „Heute“) | **schlechter**: nennt jetzt vier Einträge, die es nicht mehr gibt (F3). |
| Kapsel „Zusagen“ führt zum Schreibtisch statt zu „Personen und Zusagen“ | **weiterhin** (F11). |
| Schreibtisch-Knopf mit zwei Abzeichen übereinander (rot Entscheidungen, grau Umlauf) | **weiterhin** (`SP/w4k/k_zeit_1.png`). |
| Elf Kartenebenen als reine Symbolknöpfe, zwei gleiche Warnsymbole | **in W4 behoben** (Ausklappliste mit Namen und Tasten). |
| `ENTSCHEIDUNGEN.md` beschreibt „sieben Punkte mit Beschriftung“ (Zeile 175) und die Tabelle T2 mit „Politik › Bereiche“ usw. | **weiterhin veraltet** (auch in `/home/user/nwo-w4/ENTSCHEIDUNGEN.md`). Die W4-Navigation (zehn Einträge, Aktengerüst) ist dort nicht als Entscheidung eingetragen; sie steht nur in `VISION_IM_DETAIL_2026-10-05.md` 0.2 und im Commit „Stufe 1 Navigation“. |

---

## 11. Nicht geprüft

- Konsolenfehler im WebGL-Pfad (siehe Abschnitt 1); Lage der Provinzschilder über der Kopfleiste mit WebGL.
- Inhalte der Länderreiter (Verhandlungstisch, Verträge, Beitritt), Machtkreis, Wissensbaum im Detail, Wahlabend, Umbildung, Bilanz am Ende.
- Ob die Karte beim Öffnen einer Akte die Kartenebene wechselt (außer bei „akute Probleme“): ohne WebGL nicht sichtbar.
- Escape schließt das ☰-Menü: im Lauf blieb das Menü offen, das kann aber am zweiten Klick des Skripts liegen.
- Längeres Spiel (über Juli 2028 hinaus): Wie voll Mappe, Chronik und Berichte nach Jahren werden.
- Tastaturbedienung und Bildschirmleser jenseits der vorhandenen `aria`-Bezeichnungen.

---

## 12. Prioritätenliste

| P | Nr. | Maßnahme |
|---|---|---|
| **P0** | F1 | Leiste bei 768 px Höhe vollständig sichtbar machen |
| P1 | F2, F3 | Starttexte an den Spielzustand und an die echte Leiste binden |
| P1 | F4 | Übersicht-Kacheln reparieren (Haushalt zuerst) und Browserprüfung anlegen |
| P1 | F5 | Nach Sprung aus dem Ereignisfenster keine weiteren Fenster über die Akte legen |
| P1 | 8.1 | „Probleme im Land“ und „Warum ist das passiert?“ aus dem Schreibtisch nehmen; Bereiche als Reiter „Maßnahmen“ in die Akten verteilen |
| P1 | 8.2 | Höchstens eine Reiterzeile je Akte; Lage/Verlauf/Personen/Vorgänge als Seitenspalte; leere Teile ausblenden; Akte öffnet beim Handeln, nicht bei der Lage |
| P1 | 4 | Vorlagen nur noch in der Mappe (Ministerrat und Heute verlinken dorthin) |
| P1 | 7 | Start: Ereignisse in die Mappe statt drei Fenster, Kurzführung an der Mappe |
| P2 | 8.1 | Medien in Gesellschaft; Verwaltung in Regierung; Spielstand/Quellen ins ☰ |
| P2 | F6–F16 | Datum, Jahreszahl, Meldungsdreifach, Sprungziele, Abzeichen, Symbole, Diagrammachse, Handy |
| P2 | 10 | `ENTSCHEIDUNGEN.md`: Navigation W4 als Entscheidung eintragen, Zeilen 151/175 und Tabelle T2 als überholt markieren |
