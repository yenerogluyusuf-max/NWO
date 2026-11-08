# KI-Benchmark — Ergebnis

Datum: 2026-09-30T22:31:50.019Z · Aufgaben je Anbieter: 21 · Systemprompt und Prüfung echt aus dem Spiel (kontext.ts / aktionen.ts)
Preise: Schätzwerte aus der Skript-Konfiguration (per ENV PREIS_<ANBIETER>_EIN/AUS überschreibbar); lokale Modelle kosten 0.

## Übersicht (sortiert nach Aktions-Korrektheit)

| Anbieter | Modell | Fehler | JSON valide | Befehl korrekt* | Keine-Aktion korrekt | ausführbar** | Halluzination | Ø Latenz | Kosten/Aufgabe | Kosten/Sitzung (50 Aufrufe) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ollama lokal (qwen3:1.7b) | qwen3:1.7b | 0/21 | 0 % | 0 % (15) | 100 % (5) | 0 % | 0 % | 16794 ms | 0.0000 USD | 0.00 USD |

\* „Befehl korrekt": Anteil der Befehlsaufgaben, bei denen mindestens eine Aktion der erwarteten entspricht UND vorschau() des Spiels kein Problem meldet (Kapital, Mehrheit, Abkühlzeit eingerechnet); in Klammern die Zahl der Befehlsaufgaben. „Keine-Aktion korrekt": Anteil der Frage-/Ehrlichkeitsaufgaben ohne vorgeschlagene Aktion.
\*\* „ausführbar": Anteil aller vorgeschlagenen Aktionen, die vorschau() akzeptiert.


### Ollama lokal (qwen3:1.7b) — Einzelergebnisse

| Aufgabe | Art | JSON | Treffer | Aktionen (ausführbar) | Halluzination | ms | Kosten | Antwortanfang / Fehler |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| b01 | befehl | ✗ | ✗ | 0 (0) | — | 20431 | 0 | **AUFTRAG DES SPIELERS: Erhöhe den Mindestlohn auf 60.** **Strategie und Auswirkungen:** 1. **Ministerialreaktionen:** - **Mert Yücel (Wirts |
| b04 | befehl | ✗ | ✗ | 0 (0) | — | 17745 | 0 | **Gipfeltreffen mit der EU: Strategie für den Spieler** *Ziel: Verhandeln mit der EU, um die wirtschaftliche Stabilität, Sicherheit und öffe |
| e01 | ehrlich | ✗ | ✓ | 0 (0) | — | 17622 | 0 | **AUFTRAG DES SPIELERS: Bau einen Hafen in Trabzon** **Strategische Planung und Umsetzung** --- ### **1. Ziele und Prioritäten** - **Wirtsch |
| b02 | befehl | ✗ | ✗ | 0 (0) | — | 17609 | 0 | **AUFTRAGSBEREICH: Wasserleitungen in Hatay und Adana** **Maßnahmen- und Ressort-Verteilung:** - **m_wasserleitungen = 40** (kritisch, da es |
| b03 | befehl | ✗ | ✗ | 0 (0) | — | 15377 | 0 | **AUFTRAG DES SPIELERS: Senke die Mehrwertsteuer um 10 Punkte** **Ausführung:** 1. **Tax Adjustment:** - In der Kategorie **m_mwst** (Mehrwe |
| b05 | befehl | ✗ | ✗ | 0 (0) | — | 17527 | 0 | **AUFTRAG DES SPIELERS: Handelsabkommen mit Aserbaidschan** *Ziel: Einvernehmliche Vereinbarung mit Aserbaidschan, wobei die Interessen der  |
| b06 | befehl | ✗ | ✗ | 0 (0) | — | 15395 | 0 | **AUFTRAG DES SPIELERS: Gespräch mit der CHP** *Im Kontext der gegebenen Politiksimulation, mit Fokus auf die CHP (Cumhuriyetçi Halk Partisi |
| b07 | befehl | ✗ | ✗ | 0 (0) | — | 15360 | 0 | **AUFTRAG DES SPIELERS: DULDEN MIT DER MHP** **Ziel:** Die MHP (Mittelschicht-Partei) für eine Duldung in einem relevanten Bereich (z. B. To |
| b08 | befehl | ✗ | ✗ | 0 (0) | — | 17643 | 0 | **AUFTRAG DES SPIELERS: Entlasse den Finanzminister** **Strategie:** 1. **Loyalität gewährle |
| b09 | befehl | ✗ | ✗ | 0 (0) | — | 15649 | 0 | Die Zentralbank (Zentralbank) ist in einer schwierigen Position, da ihre politischen Maßnahmen direkt auf die wirtschaftliche Stabilität und |
| b10 | befehl | ✗ | ✗ | 0 (0) | — | 15384 | 0 | **Programmschritt: Gefährdete Gebäude erfassen** **Aktueller Status:** Bereit (3 Kapital) **Ziel:** Verträge abschließen, Gebäude bewerten u |
| b11 | befehl | ✗ | ✗ | 0 (0) | — | 17530 | 0 | ### **Monat nach dem Start: Lageübersicht und Entscheidungen** #### **1. Wirtschaftliche Situation** - **Schulden**: 23,8 % des BIP (Defizit |
| b12 | befehl | ✗ | ✗ | 0 (0) | — | 17963 | 0 | **Konjunkturprogramm: "Stabilität, Wachstum und Sicherheit"** *Ein umfassendes Programm zur Bekämpfung der Herausforderungen und zur Erreich |
| b13 | befehl | ✗ | ✗ | 0 (0) | — | 17748 | 0 |  |
| r01 | rat | ✗ | — | 0 (0) | — | 10507 | 0 | **Offenes Ereignis: [mietproteste-26-3] Mietproteste, Frist in 8 Tagen** **Was geht vor?** Es gibt Mietproteste in der Stadt, bei denen die  |
| f01 | frage | ✗ | ✓ | 0 (0) | — | 17452 | 0 |  |
| f02 | frage | ✗ | ✓ | 0 (0) | — | 17507 | 0 | Der nächste Schritt im Regierungsprogramm ist **die Gefährdete Gebäude erfassen** (bereit, 3 Kapital). Dieser Schritt ist entscheidend, da e |
| f03 | frage | ✗ | ✓ | 0 (0) | — | 17547 | 0 |  |
| e02 | ehrlich | ✗ | ✓ | 0 (0) | — | 17643 | 0 | Die aktuelle Situation in Griechenland ist von komplexen politischen, wirtschaftlichen und sicherheitsbedingten Herausforderungen geprägt. D |
| v01 | befehl | ✗ | ✗ | 0 (0) | — | 17735 | 0 | **AUFTRAG DES SPIELERS: Vertrag mit Armenien über Grenzöffnung und Bahnverbindung** **Laufzeit:** 5 Jahre **Ziel:** Gewinnung von politische |
| t01 | befehl | ✗ | ✗ | 0 (0) | — | 15303 | 0 | **AUFTRAG DES SPIELERS: Asgari Überschuss erhöhen (25 %)** **Ziel:** Die Asgari (Arbeitslosenleistungsanspruch) erhöhen, um Arbeitsplätze zu |
