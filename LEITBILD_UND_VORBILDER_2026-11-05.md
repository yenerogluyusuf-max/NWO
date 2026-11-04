# Leitbild und Vorbilder – was Staatsräson sein soll (Nachtarbeit 4./5. November 2026)

Anlass: Auftrag des Projektinhabers, die Nacht durch zu prüfen, zu vergleichen und zu verbessern: „denke nach, was das Spiel sein soll, was man anderen Spielen entnehmen kann“. Dieses Dokument ordnet die Arbeit; es ersetzt keine Entscheidung in [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md).

## 1. Was das Spiel sein soll (in drei Sätzen)

1. **Die Fantasie:** Man regiert die Türkei ab 2028 als Präsident und spürt das Gewicht jeder Entscheidung: Preise, Verlierer, Verzögerungen, Menschen mit Gedächtnis.
2. **Die Bühne:** Die Karte zeigt das Land und die Nachbarschaft; die Akten auf dem Kabinettstisch sind das Werkzeug (Vorgaben P, S, T).
3. **Der Bogen:** Jede Amtszeit erzählt eine Geschichte mit Anfang, Krise und Urteil; Ziele bis zur Utopie geben die Richtung (Vorgabe Q), die Epoche das Urteil der Geschichte.

## 2. Was gute Partien liefern müssen (Prüfkriterien)

| Kriterium | Messung | Stand 5. November |
|---|---|---|
| Kluges Regieren gewinnt meistens, Nichtstun verliert | Testspieler über 8 Seeds (`test/spielbarkeit.test.ts`) | klug 7/8, passiv 1/8 nach Müdigkeit 0,15 und Antworten auf Ministeranliegen |
| Jede Amtszeit hat ein Urteil | Epochenbewertung bei der Wiederwahl (`sim/epoche.ts`) | neu |
| Ein Bild, eine Sprache | Gesamtbild über 28 Bildschirmarten (`e2e/gesamtbild.mjs`) | 4 Schriften, 24 Größen, 6 Rundungen |
| Die Welt erinnert sich | Länder merken sich Kränkungen und Brüche; Dritte sehen zu | Gedächtnis je Land teilweise, Beobachter fehlen |
| Kein Stillstand im Takt | 2 bis 12 Ereignisse im Jahr | rund 17 bis 19: zu viele (offen) |

## 3. Was andere Spiele lehren und was davon hier steht

| Vorbild | Lehre | In Staatsräson | Nächster Schritt |
|---|---|---|---|
| **Civilization 6** | Karte als Bühne; Epochen golden, dunkel, heroisch; Kränkungen mit Beobachtern | Karte, Wunder, Epochen (neu) | Beobachter-Kränkungen (Abschnitt 4) |
| **Democracy 4** | Wirkungsnetz sichtbar; Gruppen mit Zynismus; Wahlbeteiligung endogen | Netz, Gruppen, Vorschau | Zynismus bei Richtungswechseln und Wahlgeschenken |
| **Suzerain** | Personen mit Gedächtnis, Gespräche statt Menüs, Entscheidungen mit späten Folgen | Ministerfluss, Gespräch, Machtkreis, Zusagen | Erinnerung der Minister an frühere Antworten sichtbar machen |
| **Victoria 3** | Interessengruppen mit Einfluss und Legitimität; „Journal“ für laufende Vorhaben | Fraktionen, Vorgänge | Vorgänge als ein Journal auf dem Schreibtisch bündeln |
| **Hearts of Iron 4** | Fokusbaum, Fronten auf der Karte, Nationalgeist | Fokusbaum, Krieg mit Front, Schauplätze | Front und Befehle auf der Karte (Vorgabe S) |
| **Frostpunk** | Wenige Kerngrößen (Hoffnung, Unmut), Gesetzbuch mit Preis | Zustimmung, Kapital, viele Größen | Kopfleiste bleibt bei wenigen Werten (umgesetzt: wählbar, höchstens zwei Zusatzwerte) |
| **Tropico** | Charakter und Humor, Wahltag als Theater, Fraktionsforderungen | Wahlabend, Forderungen der Partner | Wahlabend mit Epochenurteil verbinden |
| **Crusader Kings 3** | Geheimnisse, Druckmittel, Intrigen | Machtkreis, Putschzirkel | – |

## 4. Arbeitsplan dieser Nacht (Reihenfolge)

1. **Balance** (erledigt): Müdigkeit mit Beleg, Testspieler beantworten Ministeranliegen.
2. **Epochen** (erledigt): historische Momente, Urteil bei der Wiederwahl, Schreibtisch, Chronik, Bilanz.
3. **Beobachter-Kränkungen:** Greift die Türkei ein Land an oder sanktioniert sie es, verlieren auch dessen Schutzmächte Vertrauen; die Kränkung klingt langsam ab.
4. **Ereignisdichte:** von rund 18 auf das Ziel von höchstens 16 im Jahr (Testkriterium), ohne die Härte zu nehmen.
5. **Zynismus** (Democracy 4): Richtungswechsel und Wahlgeschenke kurz vor der Wahl kosten Glaubwürdigkeit.
6. **Gesamtbild nach jeder Stufe**, Vollsuite, Bericht für den Morgen.
