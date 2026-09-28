# Regeln für die Spielleitung

Die Regeln sind absichtlich einfach. Sie sollen die SL fair und berechenbar machen, nicht jeden Fall abdecken. Fehlt eine Regel, entscheide nach Plausibilität und **notiere die Entscheidung** im Weltzustand unter „SL-Entscheidungen“. Das sind wertvolle Hinweise für das spätere Regelwerk.

## 1. Die Werte

| Wert | Start | Bereich | Bedeutung |
|---|---|---|---|
| Zustimmung | 44 | 0–100 % | Unter 38: Aster wird unruhig. Unter 32: offene Kritik in der BA. |
| Parteirückhalt | 62 | 0–100 | Unter 45: Aster greift nach dem Vorsitz. |
| Koalition | 58 | 0–100 | Unter 30: Die LM tritt aus, sofern Hale nicht gebunden ist. |
| Glaubwürdigkeit | 55 | 0–100 | Entscheidet, ob die Öffentlichkeit dem Spieler seine Version abnimmt. |
| Medienlage | 30 | 0–100 | Wie heiß die Affäre ist. Ab 50 Hales Ultimatum, ab 60 ermittelt Moor, ab 75 Rücktrittsforderungen aus der BA. |

Der Spieler sieht die Werte im Morgenbriefing nicht als exakte Zahlen, sondern in Worten (zum Beispiel „Zustimmung: 41 %, leicht gesunken“, „Koalition: sehr angespannt“). Die Zustimmung wird als Umfragewert genannt, die anderen Werte nur in Worten.

### Größen von Wirkungen

Immer eine dieser Größen verwenden, damit die SL gleichmäßig urteilt:

| Größe | Änderung | Beispiel |
|---|---|---|
| Klein | ±3 | Ein ordentliches Statement, ein freundliches Gespräch |
| Mittel | ±7 | Eine Pressekonferenz, eine Entlassung, ein aufgedeckter Fehler |
| Groß | ±12 | Eine aufgedeckte Lüge, ein Koalitionsultimatum, Teil 2 |

**Medienlage sinkt** jeden Abend um 3, wenn an diesem Tag nichts Neues bekannt wurde.

## 2. Tagesablauf

Jeder Spieltag hat drei Phasen.

### Morgens: Briefing (SL, 1 Min.)

Die SL liest höchstens **fünf Punkte** vor oder schreibt sie hin: Umfragewert, neue Meldungen, Ereignisse aus dem Ereignisplan, fällige Fristen, Rückmeldungen zu Aufträgen. Kurz halten, eine Zeile pro Punkt.

### Tagsüber: drei Termine (Spieler, 4 Min.)

- Ein Gespräch mit einer Figur, eine Pressekonferenz, ein Interview oder eine größere Entscheidung kostet **einen Termin**.
- Kurze Rückfragen an Mara Lind („Was weiß ich über X?“, „Wer ist zuständig?“) sind frei, solange es keine Beratung wird.
- Für Gespräche fügt die SL die Worte des Spielers in den Claude-Chat ein (mit Angabe der Figur und des aktuellen Tages) und gibt die Antwort weiter.
- Jede wirksame Handlung schreibt die SL als **Auftragskarte** in den Weltzustand: Wer, was, bis wann, welcher Weg.

### Abends: Welt dreht sich (SL, 1 Min., ohne Spieler zu erklären)

1. Wirkungen der Handlungen des Tages eintragen.
2. Für jede Spur würfeln (siehe Abschnitt 4).
3. Für jede Figur ihre Verhaltensregel aus `02_FIGUREN.md` prüfen: Wurde ein Auslöser erreicht?
4. Ereignisplan für den nächsten Morgen prüfen.
5. Medienlage -3, falls nichts Neues bekannt wurde.

## 3. Wege statt Verbote

Will der Spieler etwas, das er nicht direkt anordnen kann, antwortet eine Figur (meist Mara oder der Zuständige) mit den möglichen Wegen. Die SL wählt die passenden aus dieser Liste:

| Weg | Tempo | Kosten | Risiko |
|---|---|---|---|
| **Offiziell** (Gesetz, Parlament, formelles Verfahren) | langsam (mehrere Tage) | Termine, öffentliche Debatte | gering, aber jeder sieht es |
| **Über Personen** (überzeugen, bitten) | mittel | ein Gefallen oder eine Zusage (wird als offener Faden notiert) | die Person kann ablehnen oder später etwas verlangen |
| **Unter Druck** (drängen, drohen, umgehen, ersetzen) | schnell | Beziehung -1 bis -2 zur Figur | erzeugt eine **Spur** |
| **Umformulieren** | – | – | Ziel mit einem erlaubten Mittel verfolgen |

**Nie nur „Das geht nicht“.** Mehr als zwei Ablehnungen hintereinander für dasselbe Ziel ohne neuen Weg sind ein Fehler der SL.

## 4. Spuren

Jede Handlung unter Druck, jede geheime Absprache und jede Lüge erzeugt eine **Spur** mit einem Gefahrenwert:

| Spur | Gefahr |
|---|---|
| Leichte Spur (ein Anruf, ein zugesagter Gefallen) | 1 |
| Mittlere Spur (Überprüfung einer Journalistin, geheimer Deal) | 2 |
| Schwere Spur (Überwachung, Einflussnahme auf die Justiz, öffentliche Lüge) | 3 |

**Jeden Abend** für jede Spur einen W6 würfeln. Ist das Ergebnis **kleiner oder gleich dem Gefahrenwert**, kommt die Spur heraus (bei Medienlage ≥ 60 gilt Gefahr +1). Wer davon erfährt, hängt von der Spur ab: Selin, Moor, Hale oder Reyn.

Eine herausgekommene Spur ist eine **große** Wirkung: Glaubwürdigkeit -12, Medienlage +12, und die betroffene Figur reagiert.

## 5. Offene Fäden

Jede Zusage, Drohung, jeder Gefallen und jede Lüge wird unter „Offene Fäden“ im Weltzustand notiert, mit Figur und Tag.

**Die SL muss in der Woche mindestens zwei offene Fäden zurückbringen.** Beispiele: Aster fordert seinen Gefallen ein; Mara erinnert an die versprochene Rückendeckung; Selin zitiert eine frühere Aussage. Das ist der wichtigste Spaß-Mechanismus des Tests. Nicht vergessen.

## 6. Ereignisplan

Diese Ereignisse passieren, wenn die Bedingung erfüllt ist. Der Spieler kann viele davon durch frühes Handeln verändern oder verhindern.

| Tag | Ereignis | Bedingung |
|---|---|---|
| 1 morgens | **Selins Bericht Teil 1 erscheint.** Medienlage +15, Zustimmung -3. | immer |
| 2 morgens | **Reyn fordert Untersuchungsausschuss** und Rücktritt des Spielers. Medienlage +5. | immer |
| 2 | Hale bittet um ein Gespräch. | wenn der Spieler ihn an Tag 1 nicht kontaktiert hat |
| 3 | **Bell ruft an** und macht sein Angebot. | wenn der Spieler ihn noch nicht kontaktiert hat |
| 3 abends | **Aster bietet an, das Leck zu finden.** | wenn der Spieler nicht schon eine andere Linie klar vorgegeben hat |
| 4 morgens | **Hales Ultimatum**: unabhängige Prüfung bis Tag 7, sonst Koalitionsbruch. Koalition -12. | wenn Medienlage ≥ 50 und keine unabhängige Prüfung eingeleitet |
| 4 | **Wend** gibt ein Interview: „Ich habe nichts ohne das Wissen des Ministerpräsidentenbüros getan.“ Medienlage +7. | wenn Wend entlassen wurde oder öffentlich allein beschuldigt wurde |
| 5 morgens | **Selins Bericht Teil 2 erscheint**: Mara Lind hat das Treffen organisiert. Medienlage +15, Zustimmung -7. Hat der Spieler vorher bestritten, dass sein Büro beteiligt war: zusätzlich Glaubwürdigkeit -12. | wenn der Spieler Maras Rolle nicht vorher selbst öffentlich gemacht hat |
| 5 | Moor leitet Vorermittlungen ein. | wenn Medienlage ≥ 60 oder Anzeige erstattet |
| 6 morgens | **Neue Umfrage.** Zustimmung wird genannt, dazu ein Satz, wie die Bevölkerung die Affäre sieht. | immer |
| 6 | Aster fordert seinen Gefallen ein oder bringt sich als Nachfolger ins Spiel. | wenn Zustimmung < 38 oder Parteirückhalt < 45 oder der Spieler ihm etwas schuldet |
| 7 | **Regierungserklärung im Parlament.** Der Spieler hält eine kurze Rede (drei bis fünf Sätze schreiben). Danach Bilanz. | immer |

## 7. Tag 7: Bilanz

Nach der Rede bewertet die SL:

- **Rede:** Passt sie zu dem, was bekannt ist? Widerspricht sie früheren Aussagen? Wirkung klein bis groß, positiv oder negativ.
- **Letzter Spurenwurf** für alle offenen Spuren.
- **Hales Ultimatum:** erfüllt oder Koalitionsbruch.

Dann liest die SL vor:

1. **Die Schlagzeile der Woche** (von der SL in einem Satz formuliert, im Ton der Morviker Rundschau).
2. Die Endwerte in Worten und die Veränderung gegenüber Tag 1.
3. Was aus jeder der sechs Figuren geworden ist, je ein Satz (zum Beispiel „Mara Lind hat ihren Schreibtisch geräumt und nimmt keine Anrufe mehr an.“).
4. Was noch offen ist: offene Fäden und Spuren, die nicht herausgekommen sind. Die ungelösten Fäden laden zum Weiterspielen ein.

**Erst nach der Bilanz** darf die SL die verborgene Wahrheit erzählen, falls die Testperson das möchte.
