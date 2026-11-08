# Warnliste Politiksimulationen: Kernbefunde für NWO

**Datenstand:** 20.10.2026. Reviewzahlen: Steam-API (alle Sprachen); SteamSpy nur als Schätzung. **[Wertung]** = Einschätzung, **[Unsicher]** = Zweifel.

**Kurzbefund.** Die Fälle scheitern an drei Dingen: einem Scope, der beim Bau schrumpft; Zahlen ohne nachvollziehbare Ursache; einem Launch ohne Stabilität. NWO hat mit „ein Land, eine Amtszeit, 81 Provinzen“ den richtigen Scope — gefährdet durch die LLM-Schicht und durch Content-Versprechen.

## 1. Fälle

| Titel | Preis/Release | Ergebnis |
|---|---|---|
| Realpolitiks 1+2 | 14,99/24,99 €, 2017/2021 | 1.251 Reviews, 62 %; 669 Reviews, 46 %; beide „Mixed“ |
| Realpolitiks 3 | 24,99 €, 24.04.2025 | 308 Reviews, 36 %, „Mostly Negative“; Tech-Gaming 37/100 |
| Power & Revolution 2023 | 49,99 €, 17.07.2023 | 651 Reviews, 58 %, „Mixed“ |
| Geo-Political Simulator 5 | 59,99 €, 22.10.2024 | 718 Reviews, 33 %, „Mostly Negative“; 2026 Edition erneut 59,99 € |
| Secret Government | 19,99 €, 15.04.2021 | 300 Reviews, 52 %, „Mixed“; letzte eigene News 22.12.2022 |
| Crisis in the Kremlin | 4,99 €, 20.03.2017 | 1.467 Reviews, 84 %, „Very Positive“ |
| Republic / Hidden Agenda | 2003 / 1988 | Metacritic 62, Eurogamer 6/10, ca. 400.000 Einheiten; Dragon 4/5, Bias-Kritik |

## 2. Fünf Muster des Scheiterns

**a) Scope, der schrumpft.** Republic wurde 1998 mit „hunderten Städten“, „tausenden Fraktionen“ und „einer Million Bürger“ beworben; erschienen ist eine Stadt, zehn Fraktionen, ca. 150.000 Bürger ([4Gamer, 26.03.2004](https://www.4gamer.net/games/010/G001029/20040326173255/)). Realpolitiks 3 verspricht 195 Länder plus Sonnensystem. **[Wertung]** Sichtbare Scope-Halbierung zerstört die selbst aufgebaute Erwartung.

**b) Zahlen ohne Modell.** In Realpolitiks 3 zeigt ein Tooltip „+0,5 Verschmutzung“, tatsächlich steigt der Wert „um 4 oder mehr“; Unruhe über 50 hat „keine Auswirkungen“; NATO-Mitglieder verlassen das Bündnis ohne Begründung (Nutzerrezensionen, [Steam](https://store.steampowered.com/app/2298690/)). Tech-Gaming nennt das „dodgy causality“ und gibt 37/100 ([01.05.2025](https://www.tech-gaming.com/realpolitiks-3/)). **[Wertung]** Der gefährlichste Fehler für NWO: Eine LLM-Schicht erzeugt leicht plausible Zahlen ohne Funktion im Modell.

**c) Akten ohne Entscheidung.** Hidden Agenda erlaubt nur die Wahl zwischen Ministervorschlägen; Macworld kritisierte, dass man keine eigenen Vorlagen einbringen kann und Vorschläge sich wiederholen ([Wikipedia](https://en.wikipedia.org/wiki/Hidden_Agenda_(1988_video_game))). Zugleich wurde „extremer Bias“ kritisiert — es zwinge den Spieler, als Sandinista zu überleben (Chuck Moss, CGW 1992, ebd.). **[Wertung]** Ein LLM, das nur drei Optionen anbietet, ist Hidden Agenda mit Chatfenster.

**d) Unfertigkeit.** Realpolitiks 3 hatte einen Save-Corruption-Bug; Patches folgten am 09.05., 30.06. und 09.09.2025 ([Steam-News](https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=2298690&count=15)); eine Rezension berichtet von 14 GB Save-Daten nach 6,5 Stunden. GPS 5 wird mit Abstürzen und Memory Leaks beschrieben. **[Wertung]** Save-Integrität ist bei einer Ein-Personen-Produktion Existenzbedingung, kein „Polish“.

**e) Schweigen und Abkassieren.** Secret Government ist seit Dezember 2022 ohne eigene Ankündigung, weiter für 19,99 €. Eversim verkauft jährlich eine Edition für 59,99 € („scam business model“ in Rezensionen). Realpolitiks 3: keine Steam-News seit 09.09.2025. **[Unsicher]** Keine News heißt nicht kein Update — aber Support ist unsichtbar.

## 3. Gegenbeweis und Markt

Crisis in the Kremlin (4,99 €, ein Land, sieben Jahre, klare Ideologiepfade) hat 84 % bei 1.467 Reviews. Suzerain (18,99 €, ein Land, eine Amtszeit, über eine Mio. Wörter, Metacritic 81) hat 92 % bei 12.001 Reviews ([Steam](https://store.steampowered.com/app/1207650/)). Democracy 4 (28,99 €) hat 82 % bei 6.430 Reviews und schreibt selbst, es wolle „no implied bias“ sein ([Steam](https://store.steampowered.com/app/1410710/)). HOI4 (49,99 €): 90 % bei 360.611 Reviews, zehn Jahre DLC.

SteamSpy-Schätzungen, keine Verkaufszahlen: RP3 20.000–50.000; GPS 5 0–20.000; Suzerain 500.000–1.000.000; Crisis 200.000–500.000; HOI4 5–10 Mio. ([SteamSpy](https://steamspy.com/api.php?request=appdetails&appid=1207650)). **[Unsicher]** Geschätzt, veraltet, enthält Bundles/Keys. Die Größenordnung genügt: „ganze Welt“ verkauft sich schlechter als „ein Land, eine Amtszeit“.

## 4. Fünf Fehler, die NWO vermeiden muss

1. **Weltversprechen.** Store-Text nennt genau: Türkei, eine Amtszeit, 81 Provinzen, keine anderen Länder, kein Mehrspieler, kein Weltraum. Jedes weitere Land ist eine DLC-Entscheidung mit eigenem Budget.
2. **LLM als Orakel.** Die Schicht bildet Absichten nur auf einen geprüften Aktionskatalog ab (Vorschlag: 150–250 Aktionen) mit Pflichtfeldern: Zuständigkeit, Rechtsgrundlage, Finanzierung, Umsetzungsdauer, Gewinner/Verlierer, Datenquelle, Konfidenz. Kein Treffer → „nicht abbildbar“ plus zwei Alternativen.
3. **Zahlen ohne Quelle.** Jede angezeigte Zahl kommt aus derselben Funktion, die sie anwendet. Ein Wirkungsinspektor zeigt Formel, Eingaben, Quelle, Datum, Unsicherheit. Fehlende Daten bleiben Lücke, nicht Null.
4. **Unfertiger Launch.** Versioniertes Save-Format, deterministischer Seed, Replay-Log; 10.000 Save/Load-Zyklen, 20-Jahres-Soak, 99,5 % crash-freie Sessions, Tick unter 100 ms bei 81 Provinzen.
5. **Schweigen.** Sechs Wochen Patch-Kadenz für zwölf Monate, öffentliche Known-Issues-Liste, kein Geld für Bugfixes, keine Jahres-Edition.

## 5. Erwartungen aktiv managen

**Store:** Kasten „Was ihr bekommt / Was ihr nicht bekommt“; ehrliche Spielzeit; „Die KI übersetzt Absichten in geprüfte Aktionen — sie erfindet keine Fakten“; „Simulation, keine Aussage über reale Personen oder Parteien“. **[Wertung]** NWO sollte nicht „realistisch“ versprechen, sondern „dokumentierte Annahmen“.

**Demo/Next Fest:** zwölf Züge, volle 81-Provinz-Karte, eine Krise (Erdbeben plus Inflation), Speichern aktiv. Messen: Können 60 % der Testspieler erklären, warum die Inflation stieg? Wenn nicht, ist die UI schuld.

**Early Access:** nur bei stabilem Kern; EA ist kein QA-Budget. Realpolitiks 3 war sechs Monate im EA und launchte mit Save-Corruption. Wenn EA: neun bis zwölf Monate, 19,99 €, kein Preisanstieg zu 1.0, drei datierte Roadmap-Punkte — „Jetzt / Als Nächstes / Nicht geplant“ (andere Länder, Mehrspieler, Weltraum, Mods).

## 6. Konsequenzen (Vorschläge, keine Erfahrungswerte)

- **Scope:** Türkei only bis 1.0; 81 Provinzen × 10 Indikatoren; eine Amtszeit = 20 Quartale/60–80 Züge; keine Systeme ohne sichtbare Wirkung.
- **QA-Gates:** Content-Lock acht Wochen vor Launch; danach nur Bugs; ein externer Tester; 20 Testspieler; 500-Kommando-Red-Team; jede Aktion mit Ablehnungsgrund.
- **Preis:** 19,99 €, 10 % Launch-Rabatt; 24,99 € nur bei 12+ Stunden und drei Szenarien; kein 29,99 €; zwölf Monate keine paid DLC.
- **Bug-Budget:** 30 % der Entwicklungszeit ab Monat 1; acht Wochen Bug-only; Save-Bug = Launch-Blocker.
- **Kill-Kriterien:** Demo-Verständnis unter 60 % → verschieben. LLM-Mapping unter 90 % oder unsichere Aktionen über 1 % → kein Launch. Save-Corruption oder Crash-frei unter 99 % → kein Launch. Wishlist unter 7.000 und Demo-Conversion unter 10 % vier Wochen vorher → drei Monate verschieben. Nach zwei Wochen unter 70 % → Features einfrieren; unter 60 % und Refunds über 15 % → Relaunch/Preissenkung prüfen.

## 7. Quellen

1. RP3: https://store.steampowered.com/app/2298690/ (24.04.2025)
2. RP3-News: https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=2298690&count=15 (09.09.2025)
3. Tech-Gaming: https://www.tech-gaming.com/realpolitiks-3/ (01.05.2025)
4. RP1/RP2: https://store.steampowered.com/app/553260/ · https://store.steampowered.com/app/1248060/
5. P&R 2023 / GPS 5: https://store.steampowered.com/app/2392520/ · https://store.steampowered.com/app/3107770/
6. Secret Government: https://store.steampowered.com/app/946990/ · News: https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=946990&count=5 (22.12.2022)
7. Crisis: https://store.steampowered.com/app/599750/ (20.03.2017)
8. Suzerain/Democracy 4/HOI4: https://store.steampowered.com/app/1207650/ · https://store.steampowered.com/app/1410710/ · https://store.steampowered.com/app/394360/
9. SteamSpy: https://steamspy.com/api.php?request=appdetails&appid=1207650 (20.10.2026)
10. 4Gamer Republic: https://www.4gamer.net/games/010/G001029/20040326173255/ (26.03.2004)
11. Wikipedia Republic: https://en.wikipedia.org/wiki/Republic:_The_Revolution
12. Wikipedia Hidden Agenda: https://en.wikipedia.org/wiki/Hidden_Agenda_(1988_video_game)
13. Eurogamer Republic: https://www.eurogamer.net/r-republic-pc (29.08.2003)

## 8. Unsicherheit

API-Zahlen weichen von Store-Zählern ab (RP3: 308 vs. 260). SteamSpy ist eine Schätzung, keine Verkaufszahl. „Letzte News“ belegt kein Update; Nutzerrezensionen sind nicht repräsentativ. Republics 400.000 stammen aus einer zeitgenössischen Reportage. Kontroversen sind dokumentiert, nicht quantifiziert. Keine Rechtsberatung; Turkey-Risiken (Armenien, Kurden, Laizismus, Zypern) brauchen eigene Prüfung.
