# H4b: Druckkreislauf der Ressorts

Befund aus dem Spiel des Inhabers (August 2043 bis Juni 2045): 40 Mal „Ece Öztürk meldet: Keine deutliche Erholung“, 34 Mal „AKP verlangt Aufklärung …“, 24 Mal „AKP verlangt … messbare Ergebnisse“ und 15 Mal „Unbearbeiteter Rückstand“. Die Unabhängigkeit der Justiz stand bei 0,4.

## Ursache im Code

1. **Der Hebel lief schon.** Die Justizreform lief im Spielstand von 2043 noch etwa zwei Jahre in der Umsetzung (Umsetzungsstand 64, Schritt 0,13 je Monat). Die Krise „Justiz im Umbau“ sperrte deshalb jede andere Justizmaßnahme. Die Ministerin schlug trotzdem alle sechs Wochen genau diese Reform vor, weil `ressortArbeitet` nur ein Gesetz im Parlament als Arbeit zählte.
2. **Die Nachbeobachtung umging jede Pause.** Nach einer früheren Entscheidung meldet sich das Ressort alle 14 Tage. War die Lage kritisch, legte die Meldung über `legeRessortAnliegenAn` sofort eine neue Anfrage an, ohne die 30 Tage Ruhe und ohne den Abstand von 18 Tagen im Kabinett. Der Zyklus sah so aus: Anfrage, 14 Tage, Stillstand mit −1,5 Punkten, Vorfall, 30 Tage Verjährung, neue Anfrage. Das ergab 15 Stillstände in 22 Monaten.
3. **Kein Boden.** Jeder Stillstand zog 1,5 Punkte ab, auch bei 0,4 und auch ohne einen Weg, der die Größe hätte bewegen können.
4. **Logbuch.** Jede Meldung (alle 14 Tage je beobachtetem Ressort), jedes Urteil der Partei darüber und jeder Vorfall schrieb eine eigene Zeile.

## Umgesetzt

- **Läuft der Hebel schon, wartet das Ressort** (`hebelUnterwegs`):
  - Ist die vorgeschlagene Maßnahme noch unterwegs (sie nähert sich ihrem Ziel, oder ihre Umsetzung läuft), entsteht keine Anfrage.
  - Eine offene Anfrage gilt dann als bearbeitet, es gibt also keinen Stillstand.
  - Bewusst zählt nur der eigene Hebel, nicht jede laufende Maßnahme des Ressorts. In einer ersten Fassung zählte jede laufende Maßnahme. Das verschob die Partien des klugen Testspielers stark, weil er fast immer etwas umsetzt: Auf „hart“ verlor er 11 statt 7 von 16 ersten Wahlen.
- **Pause je Ressort und Größe** (`RESSORT_ANLIEGEN.pause` = 90 Tage, Spielparameter):
  - Nach einer Antwort (Umsetzen), nach Erledigung oder nach Verfall hakt die Nachbeobachtung so lange nicht wieder zu derselben Größe nach.
  - Reagiert der Präsident auf einen Vorfall (stützen, zurückpfeifen, entlassen), endet die Pause, und die Nachbeobachtung darf nachfragen. So ist es vorgesehen.
  - Der Tageslauf behält seine eigene Ruhe von 30 Tagen ab Antwort oder Verfall und den Abstand im Kabinett. Eine zusätzliche Pause dort verschob nur, welches Ressort zuerst fragt: Der untätige Testspieler in `spielbarkeit` kam auf 16,05 statt 15,89 Ereignisse im Jahr, je Samen um bis zu ±2 in beide Richtungen. Die Grenze liegt bei 16. Ohne diese Pause im Tageslauf ist der Wert wieder genau 15,89.
  - Gespeichert ist die Pause in `ministerfluss.ressortPause`, optional, ohne Migration.
- **Boden und Hebel:**
  - Liegenlassen drückt eine Größe nie unter einen Rest von 5 von 100 (`RESSORT_STILLSTAND.boden`, Spielparameter).
  - Ohne Vorschlag, also ohne Hebel, sinkt sie durch Liegenlassen gar nicht. Loyalität und Regierungsvertrauen leiden weiter.
- **Die Anfrage nennt ihren Hebel** (`ressortHebel`):
  - Gesetz mit Stufe von → auf, oder Etat, oder „gesperrt: Grund“ (dieselbe Prüfung wie beim Einbringen), oder „kein offener Hebel: Grund der Sperre“.
  - Die Zeile steht im Logbuch („Hebel: Stipendien auf 55.“).
  - Auf dem Schreibtisch steht sie als eigene Zeile mit Sprung zur Maßnahme oder zum Haushalt, auch in den Zeilen des Stillstand-Bündels.
- **Monatszeile je Ressort** (`sim/ressortlog.ts`):
  - Meldungen des Ministers, Ergebnisforderungen, Aufklärungsforderungen und nachlassende Kritik der Parteien stehen als eine Zeile je Monat und Ressort. Die Zeile wird im Monat fortgeschrieben, etwa: „Justiz, April 2045: 3 Meldungen von Ece Öztürk, Unabhängigkeit der Justiz 15,7 → 16,5 (Keine deutliche Erholung); AKP verlangt messbare Ergebnisse.“
  - Eine ruhige Meldung nach einer ruhigen schreibt nichts.
  - Die Einzelheiten bleiben in der Ressortakte, und die Züge der Opposition stehen weiter einzeln in ihrer Akte.
  - Einzeln im Logbuch bleibt, was der Spieler entscheidet oder versäumt hat: neue Anfrage, Stillstand, Reaktionen auf Vorfälle.
- **Nebenbei:** „In 1 Tagen“ heißt jetzt „Morgen“ (de, en, tr).

## Messung

Der Stand von 2043 (`scratchpad/spielstand/s2043.json`) lief 22 Monate ohne Eingriff des Spielers. Das Skript liegt in `scratchpad/welle/h4b-mess/_h4b_mess.test.tsx`.

| | vorher | nachher |
|---|---|---|
| Logbuchzeilen gesamt (neu) | 707 | 430 |
| „… meldet: …“ einzeln | 217 (davon 62 „Keine deutliche Erholung“) | 0 (53 Monatszeilen) |
| „verlangt Aufklärung über den Ressortvorfall“ | 35 | 0 einzeln |
| „verlangt … messbare Ergebnisse“ | 53 | 0 einzeln |
| „Unbearbeiteter Rückstand“ (Stillstände) | 30 (Justiz 15) | 19 (Justiz 5, erst ab November 2044, jeweils mit offenem Hebel „Besetzung des Richterrats“) |
| neue Ressortanfragen | 36 | 24, jede mit Hebel |
| Unabhängigkeit der Justiz | pendelt 0,0 bis 1,7, Ende 0,4 | steigt bis 12,7 (Ende der Reform), Ende 10,0 |
| Vorgänge auf dem Tisch je Monat | 5 bis 9, Mittel 6,8 | 6 bis 9, Mittel 7,0 |

Gemessen ohne jede Antwort. Ab November 2044 ist die Reform umgesetzt. Danach fragt die Ministerin wieder, nennt jetzt aber einen offenen Hebel, die Besetzung des Richterrats. Wer ihn liegen lässt, verliert 1,5 Punkte, nie unter den Boden.

## Tests

- **Neu:** `test/ressortkreislauf.test.tsx`
  - Läuft der vorgeschlagene Hebel schon, entsteht keine Anfrage.
  - Pause nach Verfall.
  - Boden, und ohne Hebel kein Absinken.
  - Die Anfrage nennt ihren Hebel.
  - Monatszeile je Ressort.
- **Angepasst, mit Kommentar:** `ressortnachsorge.test.tsx`. Nach „Umsetzen“ und einem zurückgezogenen Gesetz hakt die Nachbeobachtung erst nach der Pause wieder nach.
- **Ergebnis:** 50 Testdateien mit ressort, schreibtisch, arbeitsplatz oder ministerfluss: 811 bestanden. `spielbarkeit`: 9 von 9 bestanden.
- **Untätiger Spieler:** Seine Zeilen sind bis auf Zehntel der Zustimmung gleich, die Ereignisdichte bleibt 15,89.
- **Kluger Spieler:** Er verliert 1 statt 4 von 16 ersten Wahlen, auf „hart“ 5 statt 7, mit „min“ 11 statt 12 von 24.
- **Weitere Prüfungen:** `linsen` bestanden, `tsc` ohne Fehler.
- **`schau-antworten`** überschreitet die Zeitgrenze von 600 s, auf dem Ausgangsstand `welle/ein3` genauso: beide 1.454 s, im Parallellauf gemessen. Es ist keine inhaltliche Abweichung, die Laufzeit ist dieselbe.

## Zur Bestätigung durch den Inhaber

- Pause 90 Tage je Ressort und Größe, Boden 5 von 100.
- Ohne Hebel sinkt eine Größe durch Liegenlassen nicht.
- Läuft der vorgeschlagene Hebel schon, fragt das Ressort nicht. Das macht das kluge Spiel etwas leichter, siehe die Zahlen oben. Ein Balance-Lauf über mehr Samen wäre vor einer Veröffentlichung sinnvoll.
- Ruhige Folgemeldungen erscheinen nicht mehr im Logbuch.

## Bild

`dokumentation/analyse_2026-11-05/welle/bilder/h4b-hebel-2043.png`: der Schreibtisch im Stand von 2043 mit „Hebel: Stipendien von 35 auf 55“ und dem Sprung zur Maßnahme.
