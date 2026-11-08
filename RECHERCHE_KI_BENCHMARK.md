# Recherche: KI-Benchmark & Jev-Testbatterie

Stand: 30. September 2026 · Autor: Arbeitslauf „KI-Benchmark" · Code: `game/scripts/`

## 1. Ausgangslage und Schlüssel-Status

Das Spiel hat 9 LLM-Anbieter (`src/ki/anbieterliste.ts`), ein JSON-Aktionsprotokoll
(`src/ki/gespraech.ts`, `src/ki/aktionen.ts`) und den regelbasierten Fallback-Parser
(`src/sim/befehle.ts`). Neu kommt die Frage hinzu, welche Aufgaben TypeSafes System-One-Modell
**Jev** (typisierte Urteile: Choice / Score / Noul) den generativen LLMs abnehmen kann.

**Gefundene Schlüssel:** keine. Es gibt weder `game/.env.local` noch einschlägige
Umgebungsvariablen (geprüft: `TYPESAFE_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
`GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `MIMO_API_KEY`, `OPENROUTER_API_KEY`, `MISTRAL_API_KEY`),
und das Repo enthält keine TypeSafe-Doku oder -Konfiguration. **Ollama** ist installiert und der
Dienst läuft (`localhost:11434`), hatte aber kein Modell geladen; für den Testlauf wurde
`qwen3:1.7b` nachgeladen (~1 GB).

Konsequenz: Beide Suiten sind vollständig gebaut; ausgeführt wurde, was ohne Cloud-Schlüssel
möglich ist (kompletter Benchmark gegen das lokale Ollama-Modell, Selbsttest der Jev-Fälle).

## 2. Gemeinsames Fundament: der Spielkern bündelt sich selbst

Damit die Skripte keine Kopien der Spiel-Logik pflegen müssen, bündelt
`scripts/runner.ts` per rolldown (schon in `node_modules`, ~30 ms) den echten Kern zu
`scripts/.build/runner.mjs`:

- `runner.mjs katalog` → `scripts/katalog.json`: **103 Maßnahmen, 18 Länder, 9 Haushaltsposten,
  137 Reichs-Vorhaben, 54 Vertragsklauseln** sowie der komplette Systemprompt
  (`systemText()` aus `src/ki/kontext.ts`, ~19.000 Zeichen).
- `runner.mjs zustand` → Beispiel-`zustandsText()` aus einer frisch erzeugten Partie
  (`createWorld(turkey2026, 42042)` + `startAfterElection(schnellProfil())`, deterministisch).
- `runner.mjs benchmark <konfig.json>` → führt den Anbieter-Benchmark aus; Antworten werden mit
  `leseAntwort()` gelesen und jede vorgeschlagene Aktion mit `vorschau()` geprüft — also exakt
  denselben Funktionen, denen das Spiel vertraut (Kapital, Mehrheit, Abkühlzeiten eingerechnet).

Beide Skripte bauen das Bundle bei Bedarf selbst neu (wenn `runner.ts` neuer ist).

## 3. Suite 1: Jev-Testbatterie

**Dateien:** `game/scripts/jev-test.mjs`, `game/scripts/jev-testfaelle.json`,
Ausgabe (nach Lauf): `game/scripts/jev-test-ergebnis.md`.

**Umfang: 40 Fälle.**

- **30 Choice-Fälle** (15 deutsch / 15 türkisch): freie Spieler-Eingaben wie „Senk die
  Mehrwertsteuer", „Bau einen Hafen in Trabzon", „Faizleri düşür", „Was macht mein
  Finanzminister?". Jev beantwortet **drei Fragen in einer Anfrage** (speculative fan-out):
  Intent (Choice über 10 Klassen: Maßnahme ändern, Lage-Frage, Land-Aktion, Fraktion
  verhandeln, Figur-Eingriff, Haushalt, Zeit, Ereignis, nicht möglich, unklar), Ziel-Maßnahme
  (Choice über den echten Katalog: 103 Maßnahmen + „keine"), Ziel-Land (18 + „keins").
- **5 Noul-Fälle**: Rote-Linie-Prüfung von Vertragsangeboten, an die echten Profile aus
  `src/data/abkommen.ts` angelehnt (GRC→`w_inseln`, ARM→`w_1915`, CYP→`w_trnc`; zwei
  Negativfälle ohne Rote Linie).
- **5 Score-Fälle**: Dringlichkeit von Ereignissen auf vier Stufen (niedrig … kritisch),
  Soll mit Toleranz ±1 Stufe.

**Metriken:** Intent- und Ziel-Trefferquote, Noul-/Score-Trefferquote, durchschnittliche
Confidence, Anteil und Güte dessen, was ein **Confidence-Gate** (Standard 0,7, per `--gate=`
einstellbar) automatisch routen würde, Latenz je Anfrage, Token-Verbrauch, Kosten (falls
`TYPESAFE_PREIS_EIN/AUS` gesetzt). Fehlerfälle: 429/529 mit exponentiellem Backoff.

**Ausführstatus: Selbsttest bestanden, Batterie nicht ausgeführt (kein Schlüssel).**
Der Selbsttest verifiziert die Testdatei gegen den echten Katalog: alle Soll-Maßnahmen und
Soll-Länder existieren, Fallzahlen stimmen (15/15/5/5). Ausführen:

```bash
export TYPESAFE_API_KEY=ts-...
node game/scripts/jev-test.mjs                 # volle Batterie
node game/scripts/jev-test.mjs --nur=de01,tr02 # einzelne Fälle
node game/scripts/jev-test.mjs --gate=0.8      # strengeres Gate
```

## 4. Suite 2: KI-Benchmark der 9 Anbieter

**Dateien:** `game/scripts/ki-benchmark.mjs`, Ausgabe `game/scripts/ki-benchmark-ergebnis.md`
(+ `ki-benchmark-roh.json`).

**Design: 21 Aufgaben aus dem echten Spielbetrieb**, jede aus demselben deterministischen
Ausgangszustand, mit dem echten Systemprompt und dem echten Zustandstext (so sieht das Modell
exakt das, was es im Spiel sähe):

- **15 Befehle**: Maßnahmen (Mindestlohn, Wasserleitungen mit Orten, MwSt. relativ), Länder
  (EU-Gipfel, Handel mit AZE), Fraktionen (CHP-Gespräch, MHP-Duldung), Figur (Finanzminister
  entlassen), Zentralbank-Kritik, Programmschritt, Zeit, Konjunkturprogramm, Reichs-Vorhaben
  (`ausbau_kappadokien`), Vertragsangebot an Armenien mit echten Klausel-IDs, türkische
  Eingabe („Asgari ücreti yüzde 25 artır.").
- **1 Ereignis-Rat**: die `fragKiRat`-Frage aus `gespraech.ts` an das erste offene Ereignis
  (der Runner spult dafür bis zu 240 Tage vor).
- **3 Lage-Fragen** (Umfragen/Wähler, nächster Programmschritt, Verhältnis zu Russland) —
  erwartet wird bewusst **keine** Aktion.
- **2 Ehrlichkeits-Proben** (Hafen in Trabzon, Krieg mit Griechenland) — erwartet wird eine
  ehrliche Absage ohne erfundene Aktion.

**Bewertungsraster:** JSON-Valide-Quote (`leseAntwort().gelesen`), Befehls-Korrektheit
(erwartete Aktion dabei **und** `vorschau()` ohne Problem), Keine-Aktion-Korrektheit,
Ausführbar-Quote aller Vorschläge, Halluzinations-Quote (erfundene Maßnahmen-/Länder-/
Klausel-IDs oder Handlungen — wird vor der Spielprüfung gegen den Katalog gezählt), Latenz,
Kosten je Aufgabe und hochgerechnet auf eine Sitzung mit 50 Aufrufen. Anbieter werden aus
Umgebungsvariablen erkannt (inkl. Ollama-Modelle und dem lokalen Server auf `127.0.0.1:18127`);
Fortsetzen-Modus: schon gemessene Anbieter×Aufgabe-Paare werden übersprungen.

**Ausführstatus: vollständig gelaufen für `ollama:qwen3:1.7b`** (21/21 Aufgaben);
Cloud-Anbieter nicht ausgeführt (keine Schlüssel).

### Erste Ergebnisse (lokal, qwen3:1.7b)

| Metrik | Wert |
| --- | --- |
| JSON valide | **0 %** (0/21) |
| Befehl korrekt | **0 %** (0/15) |
| Keine-Aktion korrekt | 100 % (5/5) — trivial, da nie eine Aktion geparst wurde |
| Halluzinationen | 0 geparste Aktionen, also keine zählbaren |
| Ø Latenz | ~17 s (900 Ausgabe-Token werden fast immer voll ausgeschöpft) |
| Kosten | 0 USD (lokal) |

Das 1,7B-Modell ignoriert den JSON-Zwang komplett und schreibt Markdown-Strategieessays
(Beispiele in `ki-benchmark-ergebnis.md`). Lehren daraus:

1. **Kleine lokale Modelle brauchen erzwungenes Format** (Ollama: `format: "json"` /
   `response_format`), sonst ist das Aktionsprotokoll tot. Die wichtigste
   Benchmark-Erkenntnis: die JSON-Valide-Quote ist die dominante Metrik — vor ihr zählt
   nichts anderes.
2. Der Fallback-Parser (`befehle.ts`) bleibt für lokale Modelle der tragfähige Weg; die
   ehrlichen Absagen funktionieren auch ohne KI.
3. 900 Ausgabe-Token sind für Essays zu wenig — ein Modell, das das Format verfehlt,
   verliert zusätzlich die Antwort durch Abschneiden.

Ausführen (sobald Schlüssel vorhanden):

```bash
export ANTHROPIC_API_KEY=sk-ant-...        # deckt Sonnet 5.5 + Haiku 4.5 ab
export DEEPSEEK_API_KEY=...
export GEMINI_API_KEY=... GEMINI_MODELL=gemini-3-flash
node game/scripts/ki-benchmark.mjs                          # alle gefundenen
node game/scripts/ki-benchmark.mjs --anbieter=anthropic-haiku,deepseek
node game/scripts/ki-benchmark.mjs --aufgaben=b01,b04,v01   # Teilmenge
```

## 5. Empfehlung: welcher Anbieter für welche Aufgabe

Vorbehalt: Nur der lokale Lauf ist gemessen; die Cloud-Reihenfolge folgt aus Preis,
Prompt-Caching und bekanntem Formatverhalten und **muss mit Schlüsseln verifiziert werden**.
Preise unten sind Schätzwerte (Skript-Konstanten, per `PREIS_<ID>_EIN/AUS` überschreibbar).

Kostenrahmen je Aufruf (gemessen am echten Prompt): Systemprompt ~5.500 Token (cachebar,
fix) + Zustand ~2.000 Token (pro Zug neu) + Ausgabe ≤ 900 Token (Schnitt eher 250–400).

| Aufgabe | Empfehlung | Begründung |
| --- | --- | --- |
| Befehle ausführen (JSON, enger Katalog) | **DeepSeek V4 Flash** oder **MiMo V2.6 Flash** (~0,3/1,0–1,2 USD je Mio.) | Formatdisziplin genügt meist; Denken abschaltbar (MiMo) spart Latenz; ~0,003 USD/Aufruf |
| Rat zu Ereignis, Verhandlungsvorschlag, Vertrag | **Claude Sonnet 5.5** mit Prompt-Caching | nuancierte Begründung, Preis/Nebenwirkung; Caching drückt den Fixteil auf ~1/10 |
| Budget-Variante Rat | **Claude Haiku 4.5** mit Caching | ~0,005 USD/Aufruf gecacht; prüfen, ob Begründungsqualität reicht |
| Lokal / Datenschutz | Ollama ab ~7–8B **nur mit** `response_format: json` | 1,7B ist unbrauchbar (0 % JSON); 7B+ muss der Benchmark erst beweisen |
| Türkisch | Gemini / DeepSeek (mehrsprachig stark) | t01-Fall gehört in jeden Vergleichslauf |

**Kosten je Sitzung (50 Aufrufe, Schätzung):** DeepSeek/MiMo-Flash ~0,10–0,15 USD;
Haiku gecacht ~0,25 USD; Sonnet gecacht ~0,50–0,75 USD (ungecacht >1 USD).
Das Ziel **< 0,30 USD je Sitzung** ist demnach mit einem Flash-Modell als Standard und
Caching beim festen Prompt erreichbar — nicht mit Sonnet als Alleinmodell.
Konkrete Stellschraube: der feste Teil (Regeln + Katalog, ~5.500 Token) ist schon jetzt
für Anthropic als `cache_control: ephemeral` markiert; OpenAI/Gemini cachen automatisch
ab Schwellen, DeepSeek/MiMo sind auch ungecacht günstig genug.

## 6. Wo Jev die LLMs ersetzen oder entlasten sollte

Konzeptioneller Vergleich (Jev-Werte: Doku-Größenordnung, vor Lauf zu verifizieren):

| | LLM (Flash-Klasse) | Jev (jev-latest) |
| --- | --- | --- |
| Eingabe je Routing-Entscheid | ~7.500–8.000 Token (System+Zustand) | ~300–400 Token (Eingabe + Katalogkriterien) |
| Ausgabe | 250–900 Token Freitext/JSON | ~20–35 Token (typisierte Antwort) |
| Latenz | 2–20 s (gemessen lokal 17 s; Cloud-Flash eher 2–5 s) | Zielgröße < 1 s, eine Anfrage deckt mehrere Fragen (fan-out) |
| Ergebnis | prosa + muss geparst werden (Risiko: 0 % valide siehe oben) | typisiert mit Wahrscheinlichkeiten + Confidence |
| Kann erklären/begründen? | ja | **nein** — Jev urteilt nur |

Daraus folgt eine **Routing-first-Architektur**:

1. **Intent-Routing freier Befehle (Jev, Choice + Gate):** Jev klassifiziert in einer Anfrage
   Intent, Ziel-Maßnahme und Ziel-Land (Katalog: 103 Maßnahmen / 18 Länder). Bei Confidence
   ≥ Gate führt der Kern direkt aus (wie `befehle.ts`, aber ohne Wortlisten-Pflege, und
   zweisprachig); darunter geht es an den LLM oder die Rückfrage. Ersetzt ~die Hälfte der
   LLM-Aufrufe zu <5 % deren Tokenkosten und mit Sub-Sekunden-Latenz.
2. **Großprojekt-Parsing (Jev, Choice/Score):** „Hafen in Trabzon" → Jev mappt auf das
   nächstliegende Vorhaben/Maßnahmen oder bestätigt „gibt es nicht" — heute harte
   Wortliste in `nichtVorhanden()`.
3. **Rote-Linie-Prüfung (Jev, Noul):** Veto-Risiko eines Vertragsangebots als Wahrscheinlichkeit,
   bevor die Bewertung läuft; unsichere Bandbreite (0,3–0,7) an den Verhandlungstext.
4. **Auto-Stopp-Qualität (Jev, Noul):** „Lohnt es, die Zeit anzuhalten?" je Logeintrag —
   billiger Filter vor dem LLM.

**Nicht** ersetzen sollte Jev: den Erklärtext (`antwort`), Ereignis-Rat und Verhandlungslogik —
dafür bleibt ein LLM nötig. Realistische Zielstruktur: Jev routet und filtert (~0,001 USD/Entscheidung),
ein Flash-LLM formuliert (~0,003 USD), Sonnet nur für Rat/Verhandlung — Sitzung landet bei
~0,10–0,20 USD, innerhalb des 0,30-USD-Ziels.

## 7. Offene Punkte / nächste Schritte

1. `TYPESAFE_API_KEY` setzen → `node game/scripts/jev-test.mjs` (40 Fälle, wenige Minuten).
2. Cloud-Schlüssel setzen → `node game/scripts/ki-benchmark.mjs` (21 Aufgaben je Anbieter;
   Fortsetzen-Modus erlaubt anbieterweise Nachmessung).
3. Ollama mit größerem Modell (`qwen3:8b`) **und** JSON-Zwang wiederholen; ggf. im Skript
   für lokale Anbieter `response_format` setzen.
4. Preise in den Skript-Konstanten gegen die Abrechnungsseiten der Anbieter verifizieren
   (Schätzwerte, Stand 30.09.2026).
5. Bei Erfolg: Jev-Routing als Modul `src/ki/routing.ts` vor `befehle.ts` hängen
   (Gate-Wert aus dem Batterielauf, Kandidat 0,7–0,8).
