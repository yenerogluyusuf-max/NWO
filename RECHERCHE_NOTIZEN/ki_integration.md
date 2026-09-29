# KI-Integration für „NWO" (Arbeitstitel) – Sprachmodelle & Bildgenerierung
## Recherche-Bestandsaufnahme, Stand: 28. September 2026

**Projektkontext:** Einzelspieler-Desktop-Strategiespiel zur politischen Simulation der Türkei. Freie Sprachbefehle an Regierung/Berater → LLM übersetzt in geprüfte strukturierte Aktionen; **die Simulation ist die Quelle aller Zahlen/Befugnisse/Ergebnisse** – das LLM darf nichts erfinden. Figuren mit Zielen, Schwächen, Stimmen, Gedächtnis. BYO-API-Key. Bildstil: gezeichnet, sehr schön, sehr realistisch. Ton: ernst mit trockenem Humor (Suzerain/Borgen).

**Methodik:** Live-Web-Recherche am 28.09.2026 (22 Abfragen: offizielle Preisseiten Anthropic/OpenAI/Google Cloud, SillyTavern-Doku, Steam-Storebeispiele, LangGraph-/Mem0-Doku, arXiv, AI Act Explorer, US Copyright Office, Midjourney-ToS, BFL, OWASP). Alle Preise/Modelle sind Stichtag 28.09.2026. Primärquellen sind verlinkt; Schlussfolgerungen sind als „Inferenz" markiert. Arbeitsnotizen: `research_notes/_ki_integration_arbeitsnotizen/`.

---

## 0. Kurzfassung (10 Kernaussagen)

1. **Modellstand 2026:** Flagships sind Claude Opus/Sonnet 5(5.1) bzw. Fable, GPT-6 (Astra/Sol/Luna) und GPT-5.6, Gemini 3.x (Flash bis 3.8, Nano Banana 2/Pro für Bilder). Mittelklasse reicht für deutsche NPC-Dialoge vollständig.
2. **Kosten pro Sitzung (30–60 min, ein Spieltag):** **0,02–0,55 USD** je nach Modell – mit Caching und Mini-/Flash-Modellen für Nebenfiguren liegt der Realwert bei **~0,15–0,35 USD** (≈ 0,13–0,30 €) pro Sitzung. Auch „Premium-Dialoge" (Sonnet-5-Klasse) kosten unter 0,50 $/Sitzung. Lokale Modelle: 0 € API-Kosten.
3. **BYO-Key ist erprobt**, aber die belegbaren Steam-Beispiele 2025/26 setzen mehrheitlich auf **lokale Modelle ohne Key** (POTUS Election Sim, Boundless AI Fantasy, FriedrichAI). SillyTavern ist die Referenz für Key-Handling (Test-Button, Modellwahl, Provider-Anleitungen, Warnungen).
4. **Anti-Halluzination ist ein Architektur-, kein Prompt-Problem:** Strukturierte Ausgaben/Tool-Use mit Strict-Schema (garantierte Schema-Konformität), stufe 2 „Vorschlag → Prüfung gegen Spielzustand → Bestätigung", Tool-Katalog mit geschlossenen Enums, Reparatur-Loops, Eval-Suite inkl. Prompt-Injection. Wichtig: Dokumentiertes Verhalten „fehlende Parameter werden **geraten**" (Anthropic-Doku) – deshalb required-Fields + Validierung + Rückfrage-Pflicht.
5. **Gedächtnis:** Kombination aus (a) strukturiertem Fakten-Ledger im Spiel (Zusagen, Kränkungen als Events mit Wahrheitsspeicher – das Spiel verwaltet, nicht das LLM), (b) Memory-Extraktion im Hintergrund (Mem0-Muster: LLM zieht Fakten aus Transkripten), (c) Retrieval zur Laufzeit. Generative-Agents-Muster (Memory Stream + Reflection) ist der Forschungsanker.
6. **Mentorin:** Als RAG-über-Spielzustand bauen, nicht als „wissendes" LLM: Antworten nur aus gelieferten Fakten-Blöcken, striktes „ich weiß es nicht"-Schema, keine Prognosen/Zahlen. Explizite Negativ-Beispiele im Systemprompt + Eval-Suite gegen Erfindungen.
7. **Bildproduktion (Einzelperson realistisch):** Kombination aus Referenz-/Character-Consistency-Features (Midjourney --cref/--sref, Nano-Banana-Referenzbilder, FLUX-Kontext-Editing) + finetuned LoRA (SDXL/FLUX) für den Leitstil; Pipeline: Stil-LoRA → Charakter-Loras/Referenzen → manuelle Auswahl. Kosten: ~10–60 $/Monat Abo bzw. Pay-per-Image (GPT-Image ~0,04–0,25 $/Bild, Nano Banana ~0,04 $/Bild, FLUX pay-as-you-go).
8. **EU AI Act Art. 50 gilt seit 2. August 2026** (Art. 113): KI-Interaktion muss erkennbar sein; generierte Bilder brauchen maschinenlesbare Markierung (Abs. 2); „Deepfakes" Offenlegungspflicht (Abs. 4) – **für offensichtlich künstlerisch/fiktive Werke abgemildert** („appropriate manner that does not hamper the display or enjoyment"). Für NWO: Hinweis in Credits/Store + maschinenlesbare Markierung wo technisch möglich; KI-Texte zu öffentlichen Angelegenheiten sind offenzulegen, sofern keine menschliche redaktionelle Verantwortung greift.
9. **Urheberrecht an KI-Bildern ist in EU/DE unsicher, in den USA weitgehend verweigert** (US Copyright Office Part 2, Jan. 2025; Thaler v. Perlmutter). Schutz entsteht bei menschlicher Gestaltung (Bearbeitung, Auswahl, Komposition) – reine Prompt-Generaten sind gefährdet. **Praxis: Assets nachbearbeiten (Overpaint, Layout) und Dokumentation der menschlichen Leistung führen.**
10. **Ähnlichkeit mit echten Politikern ist das größte Rechtsrisiko** (Persönlichkeitsrecht/Recht am eigenen Bild, §22 KUG; Midjourney verbietet Kampagnen-/Wahlbeeinflussungsnutzung). Empfehlung: **fiktive Figuren**, allenfalls stilistische Zitate ohne Namens-/Gesichtsidentität.

---

## 1. LLM-APIs, Preise, Reife (Stichtag 28.09.2026)

### 1.1 Anthropic (Quelle: [Anthropic Pricing](https://docs.anthropic.com/en/docs/about-claude/pricing), 28.09.2026)

| Modell | Input $/MTok | Output $/MTok | Cache-Hit | Batch (In/Out) | Einordnung |
|---|---|---|---|---|---|
| Claude Sonnet 5 | 2 | 10 | 0,20 | 1 / 5 | **Empfehlung Hauptdialoge** |
| Claude Haiku 4.5 | 1 | 5 | 0,10 | 0,5 / 2,5 | Nebenfiguren/Events |
| Claude Opus 5.5 | 4 | 20 | 0,20 (0,05x) | 2 / 10 | Premium, unnötig für die meisten Dialoge |
| Claude Sonnet 4.6/4.5 | 3 | 15 | 0,30 | 1,5 / 7,5 | älter, teurer als Sonnet 5 |
| Claude Fable 5(1)/Mythos | 10 | 50 | 0,25–1 | 5 / 25 | nur per Einladung (Project Glasswing) |

- **Preisanker:** Der Intro-Preis von Sonnet 5 ($2/$10) wurde dauerhaft Standard; die geplante Erhöhung auf $3/$15 zum 01.09.2026 fand nicht statt (Fußnote auf der Preisseite).
- **Prompt Caching:** 5-Min-Write 1,25x, 1h-Write 2x, Read 0,1x – lohnt sich nach 1–2 Wiederholungen; ideales Werkzeug für statische System-Prompts (Spielregeln, Tool-Katalog, Persona).
- **Batch API:** 50 % Rabatt (kombinierbar mit Caching) – brauchbar für Nacht-Zusammenfassungen/Memory-Extraktion.
- **Long Context:** Ab Claude 4.6 volles 1M-Token-Fenster zum Standardpreis.
- **Tool Use:** eigener System-Prompt-Overhead 286–675 Tokens + Schemas als Input; **`strict: true` garantiert Schema-Konformität** ([Tool-Use-Doku](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)).
- **Warnung Tokenizer:** Ab Claude 4.7 erzeugt derselbe Text ~30 % mehr Tokens (neuer Tokenizer) – Kostenmodell entsprechend anpassen.
- Streaming: nativ unterstützt (Messages API).

### 1.2 OpenAI (Quelle: [OpenAI Pricing](https://platform.openai.com/docs/pricing), 28.09.2026)

| Modell | Input $/MTok | Output $/MTok | Cached Input | Batch | Einordnung |
|---|---|---|---|---|---|
| gpt-6-astra | 10 (Long Ctx 20) | 50 (75) | 1 | 5 / 25 | Flagship |
| gpt-6-sol | 2 | 10 | 0,2 | 1 / 5 | starkes Allround |
| **gpt-6-luna** | **0,10** | **0,50** | 0,01 | 0,05 / 0,25 | **Preis-Leistungs-Schocker** |
| gpt-5.6-terra | 2 | 12 | 0,2 | 1 / 6 | solide |
| gpt-5.6-luna | 0,20 | 1,20 | 0,02 | 0,1 / 0,6 | günstig |
| gpt-5.4-mini | 0,75 | 4,50 | 0,075 | 0,375 / 2,25 | Klassiker |
| gpt-5-mini / nano | 0,25 / 0,05 | 2 / 0,40 | 0,025 / 0,005 | 50 % | Routing/Extraktion |
| gpt-4.1 | 2 | 8 | 0,5 | 1 / 4 | älter |

- **Structured Outputs:** garantiert Schema-Adhärenz (vs. JSON-Mode nur gültiges JSON); Refusals programmatisch erkennbar; Pydantic/Zod-Helpers; ab GPT-4o-mini/later ([Structured-Outputs-Guide](https://platform.openai.com/docs/guides/structured-outputs)). Empfehlung der Doku: „start with gpt-6-astra" für neue Projekte – für NWO-Kostenprofil aber Mini/Luna-Klasse suffizient testen.
- **Bildmodelle API:** gpt-image-2(.5) $8/MTok Image-Input, $30/MTok Output (Bild-Token); gpt-image-1-mini $2,5/$8 (grob ~0,04–0,25 $/Bild je nach Qualität/Größe – Inferenz aus Tokenpreisen).
- TTS für „Stimmen": gpt-4o-mini-tts $12/1M Output-Tokens, tts-1 $15/1M Zeichen – relevant falls Figurenstimmen kommen.
- Fine-Tuning-Plattform wird eingestellt (keine neuen Nutzer) – kein langfristiger Weg für Persona-Feintuning bei OpenAI.
- Data-Residency-Aufschlag +10 % für Modelle seit 05.03.2026 (für DE-Spieler-Datenschutz-Souveränität ggf. relevant, Standardrouting ist günstiger).
- Streaming: nativ (Responses/Chat Completions).

### 1.3 Google Gemini (Quelle: [Google Cloud Agent Platform Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing), 28.09.2026)

| Modell | Input $/MTok (≤200K) | Output | Hinweis |
|---|---|---|---|
| Gemini 3.8 Flash | 0,75 (Intro bis 31.12.2026) | 3,75 | ab 01.01.2027: 1,50 / 7,50 |
| Gemini 3.5 Flash | 1,50 | 9,00 | |
| Gemini 3.5 Flash-Lite | 0,30 | 2,50 | günstigster Gemini-Text |
| Gemini 3.1 Pro Preview | 2,00 (Long Ctx 4,00) | 12,00 (18,00) | Qualitätsreferenz |
| Gemini 3 Flash Preview | 0,50 | 3,00 | |
| Gemini 3.1 Flash Image (Nano Banana 2) | 0,50 Input | 3,00 Text / **30 $/MTok Bild-Output** | Bildmodell |
| Gemini 3 Pro Image (Nano Banana Pro) | 2,00 | 12 Text / **120 $/MTok Bild-Output** | Premium-Bildmodell |
| Gemini 3.1 Flash-Lite Image (Nano Banana 2 Lite) | 0,25 | 30 $/MTok Bild-Output | |

- Flex/Batch: 50 % Rabatt; Cached Input 0,1x. Non-global-Region +10 %.
- C2PA/maschinenlesbare Markierung von Bildern: Googles Bildmodelle markieren Ausgaben (Relevanz für AI-Act-Abs. 2 – siehe Kap. 6).
- Streaming: Live-API mit Session-Context-Billing (Tokens aller Vortrunde werden pro Turn neu berechnet – teuer, für NWO-Dialoge ungeeignet; normale Streaming-API bevorzugen).

### 1.4 Open-Source/lokal & Aggregatoren (Quellen: [SillyTavern API-Connections](https://docs.sillytavern.app/usage/api-connections/), [OpenRouter Models](https://openrouter.ai/models), Steam-Beispiele)

- **OpenRouter:** ein Key für viele Modelle, Pay-per-Token, „no enforced moderation, unless required by the LLM vendor" – für BYO-Key-Spiele der pragmatischste Einstieg (Spieler mit einem Key, viele Modelle). Marktpreise 2026 u. a. Qwen3.8 Max Prime $4/$12, GLM-5.3-Prime $2,80/$8,80, günstige Spezial-/Routings-Modelle (z. B. Solar Decide $0,05/MTok).
- **Lokale Runtimes** (Ollama, llama.cpp/KoboldCpp, LM Studio, TabbyAPI, OpenAI-kompatible Endpoints): kostenlos, kein Key, 5–50 GB Modell-Downloads; Steam-Beispiele 2026 zeigen das als Mainstream-Muster (Gemma 4 e2b/e4b inklusive, 6–8 GB VRAM reichen für kleine Textmodelle, CPU-Fallback).
- **Mistral (La Plateforme)**, DeepSeek (Mindestaufladung $2), Cohere (Free Tier), AI21, Perplexity, NovelAI, Mancer, DreamGen: alle in SillyTavern als BYO-Key-Ziele dokumentiert.
- **Deutschsprachige Figuren-Dialoge:** Inferenz ohne dedizierten Benchmark (Gap, s. u.): Die 2026er-Frontier- und Mittelklasse-Modelle (Claude Sonnet 5, GPT-6-Sol/5.6-Terra, Gemini 3.5/3.8 Flash) führen deutsche Idiomatik und trockenen Humor sicher; lokale 8–30B-Modelle (Qwen3.x, Gemma 4, Llama-/Mistral-Linie) liefern brauchbares Deutsch mit Tendenz zu generischen Phrasen und Instabilität bei Stimme/Humor über lange Sitzungen. Für Kernfiguren (Mentorin, Ministerin) lohnt ein stärkeres Modell, für Flavour-Zeilen ein lokales/kleines.

---

## 2. BYO-API-Key in der Praxis

### 2.1 Belegte Umsetzungsmuster

| Produkt | Muster (Quelle: Steam-Store, 28.09.2026) |
|---|---|
| **SillyTavern** (Tool, kein Steam-Spiel) | Referenz für BYO-Key: eigener Key pro Provider, „Test Message"-Button, „Bypass API status check", Modell-Dropdown via `/v1/models` oder Freitext, Connection Profiles, lokale & Cloud-Backends, Warnung „API key only once – keep it safe" ([Doku](https://docs.sillytavern.app/usage/api-connections/openai/)) |
| **POTUS Election Sim** (Aug. 2026, 10,25 €) | **Gegenmodell:** „No cloud. No subscription. No API key." On-Device-KI, Quality-Tiers bis „kein Modell lauffähig", **schriftlicher Fallback auf jedem Screen**, „nothing is ever waiting on the AI" – Mixed-Reviews 53 % |
| **Boundless AI Fantasy** (Sep. 2026) | Local AI inkl. Gemma-4-Modelle (e2b/e4b), eigene Modelle via GGUF/llama.cpp; „no API key"; 6 GB VRAM Minimum |
| **FriedrichAI: Offline AI** (2026) | Kern offline OHNE Key; optionale Online-Features brauchen „your own provider account, API key"; Demo als Kompatibilitäts-Test vor Kauf; Qwen Apache-2.0 |
| **AI Roguelite** (2023) | Frühes Steam-Beispiel externer/lokaler KI-Anbindung |

### 2.2 Dokumentierte UX-/Betriebsmuster (aus Doku & Storetexten)

- **Key-Eingabe:** lokales Speichern (nicht auf Entwicklerservern), einmalige Anzeige beim Provider erklären, Test-Button zur Verifikation, Provider-spezifische Kurzanleitungen (Wo erstelle ich den Key? Brauche ich Guthaben?).
- **Modellwahl:** Dropdown aus `/v1/models` + Fallback-Freitext; Profilwechsel (Connection Profiles) für „günstig lokal / schnell Cloud / teuer hochwertig".
- **Kostenwarnungen:** keine harten Limits im Client möglich (der Provider rechnet ab) – belegbare Näherung: Token-Zähler/„Cost per turn"-Anzeige im UI (SillyTavern-Praxis), Empfehlung kleiner Modelle als Default, Hinweis auf Batch-/Cache-Optionen. **Gap:** keine belastbare Quelle zu dokumentierten Kostenrunaway-Fällen in Spielen gefunden.
- **Offline-Fallback:** von „KI-Funktionen deaktivieren" (SillyTavern-nah) bis „jeder Screen hat schriftlichen Fallback" (POTUS Election Sim) – die Variante mit schriftlichem Fallback ist für NWO die risikoärmste (Spiel bleibt spielbar ohne Key/Internet).
- **Steam-Pflicht:** KI-Offenlegung im Store („AI Generated Content Disclosure") ist bei allen KI-Titeln Standard-Block; Beispiele differenzieren Live-Generierung (Text) vs. vorproduzierte Kunst.

### 2.3 Für NWO abgeleitete BYO-Key-Empfehlungen (Inferenz)

1. Drei Modi: **(a) eigener Key** (OpenAI/Anthropic/Google/OpenRouter), **(b) lokales Modell** (Ollama/llama.cpp-Endpoint, OpenAI-kompatibel), **(c) Offline-ohne-KI** mit vorbereiteten Standarddialogen/Fallback (mindestens für Tutorial & Kritikpfade).
2. Key niemals auf Servern des Entwicklers; lokales Speichern (OS-Keychain), Maskierung, Löschfunktion.
3. Erste Sitzung mit kostenlosen Test-Credits bewerben (jeder Provider hat Free Credits/Tiers) + ehrliche Kostenschätzung im Setup-Screen („~0,20 $ pro Spieltag mit Modell X").
4. Kostenkontrolle: Budget-Warnschwelle pro Sitzung (Token-Zählung lokal), harte Obergrenze/„Spiel pausiert KI" bei Erreichen, Default = Mini-/Flash-Modell.
5. ToS der Provider: BYO-Key ist zulässig (Nutzer zahlt direkt); OpenRouter bündelt viele Modelle für einen Key. Steam-Fragebogen „pre-generated vs. live-generated" ehrlich ausfüllen.

---

## 3. Sichere LLM-in-Simulation-Architektur (keine Halluzination von Spielzustand)

### 3.1 Gesicherte Bausteine

- **Strukturierte Ausgaben mit Strict-Schema:** OpenAI garantiert Schema-Adhärenz inkl. Enums/Required; Refusals sind programatisch erkennbar ([Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)). Anthropic: `strict: true` bei Tool-Definitions garantiert Schema-Konformität ([Tool Use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)).
- **Tool-Use-Roundtrip** ist das Grundmuster: LLM liefert `tool_use` (Aktion + Parameter), **die Anwendung führt aus** und gibt `tool_result` zurück – nie das LLM schreibt Zahlen in den Zustand. `tool_choice` erzwingt Aufruf bei Bedarf; `disable_parallel_tool_use` für kontrollierte Aktionen.
- **Dokumentierte Halluzinationsfallen:** Anthropic weist explizit darauf hin, dass Modelle **fehlende Parameter raten** (Beispiel: `location` wird ergänzt, „Sonnet might guess values you didn't supply") – deshalb: `required`-Fields, Enum-Werte nur aus dem aktuellen Spielzustand, Validierung vor Ausführung, Rückfrage-Loop statt Ratefreiheit. Bei Mehrdeutigkeit ein `clarify`-Tool ausgeben statt zu handeln.
- **Human-in-the-Loop/Ausführungs-Gate:** LangGraph `interrupt()`-Muster dokumentiert „Approve or reject", „Review and edit LLM output before continuing", „Interrupts in tools" (Ausführung erst nach Bestätigung) und Validierungs-Loops über Conditional Edges ([LangGraph Interrupts](https://docs.langchain.com/oss/python/langgraph/human-in-the-loop)) – übertragbar auf „Vorschlag → Spielerbestätigung bei riskanten Aktionen".
- **Prompt-Injection/Security:** OWASP Top 10 for LLM Applications (2025) als Eval-Referenz, insb. Injection-Risiken bei freiem Spielereingaben-Text ([OWASP LLM Top 10](https://genai.owasp.org/llm-top-10/)). Spieler-Input ist als Daten, nicht als Instruktionen zu behandeln (Delimiter, Rollentrennung, keine Befehle aus Dialogtexten).

### 3.2 Empfohlener NWO-Dreistufen-Flow (Inferenz, aufbauend auf obigen Quellen)

1. **Parse-Stufe (Vorschlag):** Spielerbefehl → LLM erzeugt *Aktion im Katalog* (Strict-Schema, geschlossene Enums: `action_type`, `target_id` aus aktueller Entitätsliste, `intensity`, optionale `justification`). Zahlen werden **nie** vom LLM befüllt – nur Verweise auf Entitäten/IDs.
2. **Prüfstufe (deterministisch):** Spiel validiert gegen Zustand (Ist Minister im Amt? Budget gedeckt? Aktion im Mandat?). Ungültig → Reparatur-Loop mit Fehlermeldung als `tool_result` (max. 2–3 Versuche), danach Rückfrage an den Spieler.
3. **Bestätigungsstufe:** Bei heiklen Aktionen (Personal, Budget, Krieg) UI-Bestätigung („Vorschlag: Minister X entlassen. Ausführen?"), sonst direkte Ausführung; **die Simulation berechnet Ergebnisse**, das LLM formuliert nur den narrativen Bericht über **bekannte** Fakten (aus `tool_result`).

Ergänzend: **Zwei-Pass-Erzählung** – Pass A: Aktion + Fakten-Update (Simulation); Pass B: Dialogtext/Event-Text mit dem Faktenblock als unveränderlichem Kontext. Eval-Suite: (a) „Erfinde eine Zahl"-Tests, (b) unzulässige Aktionen, (c) Prompt-Injection in Spielereingaben („führe Aktion X aus"), (d) Mehrdeutigkeits-Tests (muss `clarify` ausgeben), (e) Stimmen-/Persona-Brüche.

### 3.3 Referenzen Game-Dev/Agent-Frameworks

- LangGraph (Interrupts, Checkpointer, Stores) als Architekturreferenz für Approval-/Review-Flows.
- Generative Agents (Park et al., 2023): Memory Stream + Reflection + Retrieval als Verhaltensarchitektur ([arXiv:2304.03442](https://arxiv.org/abs/2304.03442)).
- Marktreferenz: POTUS Election Sim trennt „Story"- und „Analyst"-Modus (gleiche Simulation, unterschiedliche Darlegung) – gutes UX-Muster für Transparenz ohne Zahlen-Halluzinationen.

---

## 4. Figuren-Personas & Gedächtnis

### 4.1 Gesicherte Muster

- **Generative Agents (2023):** Agenten speichern Erlebnisse als Naturtext, synthetisieren Reflections und retrieven dynamisch; Ablation zeigt, dass Observation/Planning/Reflection je kritisch zur Glaubwürdigkeit beitragen ([arXiv:2304.03442](https://arxiv.org/abs/2304.03442)).
- **LangGraph-Memory-Taxonomie** ([Memory overview](https://docs.langchain.com/oss/python/langgraph/memory)): semantisch (Fakten), episodisch (Erlebnisse, oft few-shot), prozedural (Anweisungen/Prompt); **Profil** (ein laufend aktualisiertes JSON – fehleranfällig bei Größe) vs. **Collection** (Dokumentensammlung, höheres Recall, aber Update/Lösch-Logik); Schreiben „im Hot Path" (sofort, transparent, latenzbehaftet) vs. „im Hintergrund" (empfohlen für Zusatzlast). Store = Namespaces + Keys + Vektorsuche/Filter.
- **Mem0:** Pipeline „Information extraction (LLM zieht Fakten) → additives Speichern → Retrieval"; Ablaufdatum für Memories (`expiration_date`), Metadaten-Filter, IDs (user/agent/run) zur Abgrenzung; Warnung vor Doppelten bei `infer=False` ([Mem0 docs](https://docs.mem0.ai/core-concepts/memory-operations)).
- **Anthropic Memory Tool:** Dateibasiertes Speichern/Lesen über Gespräche hinweg als Client-Tool.

### 4.2 Fallstricke (belegt/Inferenz)

- **Wiederholungen & Brüche:** LangGraph-Doku weist auf „stale or off-topic content" und Qualitätsverfall über lange Kontexte hin; Collection-Updates neigen zu Over-Insert/Over-Update (Raten bei Profil-Updates). Gegenmaßnahme: strukturierter Fakten-Ledger im Spiel statt LLM-Freitext-Gedächtnis + Redundanz-Regeln („Kränkung nur eintragen, wenn neu").
- **Erinnerungstreue über Tage:** Zuverlässig nur, wenn (a) Events im Spiel persistiert sind (Zusage/Kränkung als Datensatz mit Timestamp + Status offen/gebrochen), (b) sie pro Gespräch in den Kontext injiziert werden („Top-3 relevante Memories" per Retrieval), (c) Reflections nur aus validierten Events erzeugt werden. Reines „LLM erinnert sich" skaliert nicht – bestätigt durch Mem0/LangGraph-Muster (Faktenextraktion + Retrieval, nicht Volltranskript).
- **Persona-Stabilität:** Systemprompt pro Figur (Ziele, Schwächen, Stimme, Tabus, Wissensstand aus Simulation) + Few-shot-Stimmenbeispiele; Doku-Warnung bei langen Kontexten (Qualität sinkt) → Gesprächs-Fenster begrenzen, Fakten auslagern.

### 4.3 Mentorin (neutrale Erklär-Figur mit Lernmodus)

Inferenz aus den gesicherten Mustern, konkret für NWO:

1. **Wahrheitsquelle:** Die Mentorin erhält ihre Antworten aus einem Spiel-Lieferten Faktenpaket (Regeln, Status, Historie) – nicht aus Modellwissen. Prompt: „Erkläre nur aus <facts>. Ist etwas nicht enthalten: sage wörtlich ‚Das steht nicht in den Akten.'"
2. **Kein Raten, keine Prognosen:** Ausgabe-Schema mit `answer`, `source_fact_ids`, `unknown: true|false`. `unknown=true` erzwingt Neutralformulierung. Zahlen nur, wenn in `facts` enthalten (und mit `source_fact_ids` belegt).
3. **Lernmodus:** Spieler fragt „Was heißt das?" → Mentorin erklärt Konzept X **aus einer vorbereiteten Enzyklopädie** (redaktionell verfasst, nicht generiert) oder generiert eine Erklärung streng über diese Textvorlage; Fortschritt („verstanden") ist Spielzustand.
4. **Stimme:** trockener Humor über Stilanweisungen + Few-Shots, aber niemals Fakten-Erfindung als „Witz"; Humor nur in Meta-Kommentaren, nicht in Zahlen.
5. **Eval:** Testkatalog „Mentorin darf keine Zahl nennen, die nicht in facts steht" (automatischer Abgleich generierter Zahlen gegen Faktenpaket – Zahlen-Extraktion aus Output, Abgleich, Regression bei Verstoß).

---

## 5. Bildgenerierung: konsistenter realistischer Zeichenstil

### 5.1 Dienste & Stand 2026 (Quellen verlinkt)

| Dienst | Stand/Preise (28.09.2026) | Stil-/Charakter-Konsistenz | Kommerz-Nutzung |
|---|---|---|---|
| **Midjourney** | Basic $10 / Standard $30 / Pro $60 / Mega $120 pro Monat; Jahresabo −20 %; Extra-GPU $4/h ([Pläne](https://docs.midjourney.com/hc/en-us/articles/27870484040333)) | --cref/--sref (Charakter-/Stil-Referenzen), Image Editor, Video | „You own all Assets... to the fullest extent possible under applicable law"; Firmen >1 Mio $ Umsatz brauchen Pro/Mega; Stealth nur Pro/Mega ([ToS](https://docs.midjourney.com/hc/en-us/articles/32083055291277)) |
| **Black Forest Labs (FLUX)** | FLUX 3 (Image/Video/Audio), FLUX.2 Max/2/[klein]/[dev]; API pay-as-you-go (Video ab $0,17/s), Open Weights mit Lizenzen: Builder 10k Bilder/Monat inkl. **Fine-tuning- & LoRA-Rechte**, Platform 100k, Professional/Enterprise ([Pricing](https://bfl.ai/pricing)) | FLUX Tools (Editing/Kontext), Open Weights → eigene Charakter-/Stil-Loras | API-Nutzung kommerziell; Self-Hosted Commercial License für Gewichte ([Licensing](https://bfl.ai/licensing)) |
| **OpenAI gpt-image-2(.5)** | $8/MTok In / $30/MTok Bild-Out (Mini $2,5/$8), Batch 50 % | Referenz-/Bearbeitungs-Features über API; gut für Event-Illustrationen im Batch | Ausgaben gehören dem Nutzer (OpenAI-Bedingungen); Nutzung policy-konform |
| **Google Nano Banana 2/Pro** | 30 bzw. 120 $/MTok Bild-Output (~0,04 $/kleines Bild, Inferenz) ([Google Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)) | Starke Referenz-/Bearbeitungs-Consistency („Nano Banana"-Generation), gut für Charakter-Iterationen | kommerziell über Gemini API/Vertex je Vertrag |
| **SDXL/FLUX lokal + LoRA** | Hardware-Kosten (GPU 12–24 GB VRAM), Training über Kohya o. ä. | **Beste Konsistenz:** Stil-LoRA (ein Look) + Charakter-LoRA/Referenz (Gesicht) | Gewichts-Lizenz beachten (SDXL Community License; FLUX [dev] non-commercial vs. kommerzielle Lizenz) |
| **Ideogram** | Abo-/Credit-basiert | Character-/Style-Reference-Features; stark bei Text im Bild (Karten/Zeitungen) | bezahlte Pläne kommerziell |

### 5.2 Workflow für eine Einzelperson (Inferenz aus obigen Features)

1. **Leitstil festlegen** („gezeichnet, sehr schön, sehr realistisch"): Referenzsheet malen/anlegen (Farbpalette, Linien, Rendering) → Stil-Referenz (MJ --sref bzw. FLUX-/SDXL-Stil-LoRA trainieren, 20–50 kuratierte Bilder).
2. **Charakter-Konsistenz:** pro Figur Referenzsheet (Front/Profil/Neutral/Lächeln) generieren, davon Charakter-Referenz/-LoRA ableiten; Porträts immer mit derselben Referenz + enger Prompt-Struktur (Figurname + Rollenbeschreibung + Stiltags) erzeugen; Ergebnisse kuratieren, nicht ungefiltert ins Spiel.
3. **Assets:** Karten/Events im Batch (API: gpt-image/Nano Banana/FLUX) mit fester Stilvorlage; Porträts manuell via Midjourney/FLUX-Playground mit Nachbearbeitung.
4. **Nachbearbeitung ist Pflicht** (siehe Recht): Overpaint, Komposition, Farbkorrektur in eigener Hand – dokumentiert menschliche Gestaltung und erhöht Stilkonsistenz.
5. **Monatsbudget (Inferenz):** Midjourney Standard $30 oder FLUX/API 20–50 $ + Rechenzeit/Finetuning; realistisch **30–80 $/Monat** für die Produktion eines Figuren-/Asset-Sets; Abschreibung unkritisch gegenüber Spielbudget.

---

## 6. Rechtslage generierter Bilder & KI-Transparenz

### 6.1 EU AI Act, Art. 50 (Quelle: [AI Act Explorer, Art. 50](https://artificialintelligenceact.eu/article/50/), [Art. 113](https://artificialintelligenceact.eu/article/113/))

- **Gilt seit 2. August 2026** (Art. 113).
- **Abs. 1:** Systeme, die direkt mit Menschen interagieren, müssen KI-Nutzung offenlegen (sofern nicht offensichtlich). → NWO-Dialoge/Hinweis im UI („Gespräche werden KI-generiert").
- **Abs. 2:** Provider synthetischer Inhalte müssen Ausgaben **maschinenlesbar markieren** und als künstlich erkennbar machen (wirksam, interoperabel, robust; „as far as technically feasible"). → Bei eigener Pipeline: C2PA/metadata wo möglich; bei Fremddiensten deren Markierung nicht entfernen.
- **Abs. 4 (Deepfakes):** Deployer müssen offenzulegen, wenn Bild/Audio/Video ein Deepfake ist („resembles existing persons... would falsely appear authentic"). **Einschränkung für „evidently artistic, creative, satirical, fictional" Werke:** Offenlegung nur „in an appropriate manner that does not hamper the display or enjoyment of the work" – ein fiktives Spiel fällt hierunter, aber ein **Hinweis in Credits/Storeseite ist die sichere Umsetzung**. KI-**Texte** zu öffentlichen Angelegenheiten sind offenzulegen, es sei denn, ein Mensch übernimmt redaktionelle Verantwortung (für NWO: redaktionell verfasste Inhalte vs. Live-Generierung trennen/benennen).
- **Abs. 7:** EU-Verhaltenskodizes zur Markierung („Code of Practice on transparent AI-generated content") in Vorbereitung; Stand der finalen Kodizes bei Veröffentlichung dieses Dokuments prüfen (Gap).
- **Bußgeldrahmen:** Verstöße gegen Art. 50 fallen unter Art. 99 (bis 15 Mio. € bzw. 3 % Umsatz – Detailstaffelung siehe Art. 99; hier nicht im Detail verifiziert, Gap).

### 6.2 Urheberrecht generierter Bilder

- **USA:** [US Copyright Office, Copyright and AI](https://www.copyright.gov/ai/): Teil 2 „Copyrightability" (29.01.2025) – Schutz erfordert menschliche Autorschaft; rein KI-generierte Outputs nicht schutzfähig (Registration Guidance 2023; Fälle Zarya of the Dawn, Théâtre D'opéra Spatial, SURYAST). **Thaler v. Perlmutter**: Berufungsgericht bestätigt Verweigerung (menschliche Autorin zwingend). Teil 3 (Training, Pre-Publication 09.05.2025) behandelt Fair Use der Trainingsnutzung – für Spiel-Assets nachrangig, relevant bei Modellwahl/Anbieter-Garantien.
- **EU/DE:** kein abschließender EuGH-Beschluss zur KI-Autorschaft; nationale Literatur/Gerichte uneinheitlich (deutsche Instanzgerichte hatten Einzelfälle mit erheblichem Prompt-Design diskutiert – **Gap:** keine Live-Entscheidung im Recherchefenster verifiziert). Praktische Folge: Schutz nur für die menschliche Gestaltungsschicht (Auswahl, Anordnung, Nachbearbeitung, Gesamtkomposition des Spiels).
- **Anbieterbedingungen:** Midjourney gewährt Eigentum „to the fullest extent possible under applicable law", aber **keine Garantie für Titel/Nicht-Verletzung** – das Risiko liegt beim Nutzer; MJ erhält eine **perpetuierliche Lizenz** an Inhalten/Assets; standardmäßig öffentlich/remixbar (Stealth: Pro/Mega). BFL: kommerzielle API-Nutzung + separate Open-Weights-Lizenzen (Builder/Platform/Professional mit LoRA-Rechten). OpenAI/Google: Ausgaben dem Kunden (je Vertragsstand; Google-Bedingungen konnten nicht live verifiziert werden, Gap).
- **Risiko echter Politiker-Ähnlichkeit:** Persönlichkeitsrecht/Recht am eigenen Bild (DE: §22 KUG, allgemeines Persönlichkeitsrecht); US: Right of Publicity/„Digital Replicas" (USCO Part 1 empfiehlt Bundesgesetz). Midjourney **verbietet** ausdrücklich Bilder für politische Kampagnen/Wahlbeeinflussung (Community Guidelines Nr. 4) und verlangt Rechte an abgebildeten Personen (Editor/Video-Abschnitt). **Empfehlung: nur fiktive Figuren; keine realen Amtsträger-Ähnlichkeiten; Namensvetternschaft vermeiden; Hinweis „fiktive Figuren" im Spiel.**

### 6.3 ToS-Fallstricke für eine Produktionspipeline

- Midjourney: **automatisierte Nutzung ist verboten** („You may not use automated tools to... generate Assets") → kein MJ-API-Batch; manuelle Nutzung im Web/Discord ist zulässig. Für Batch-Assets OpenAI-GPT-Image/Nano-Banana/FLUX-API nutzen.
- Keine Weitergabe von Assets als „Training Data" ohne Lizenz (BFL hat dafür ein separates „Synthetic Data"-Angebot).
- Steam: KI-Offenlegung im Store (siehe Kap. 2), analog den Beispielen „Text live generiert" + „Artwork mit generativer KI erstellt".

---

## 7. Kostenschätzung pro Spielsitzung (transparent gerechnet)

**Annahmen (Spieltag 30–60 min):** 1× Briefing, ~12 Aktion-Parses, 5 Gespräche à ~8 Runden (40 Calls), 6 Mentorin-Calls, 5 Event-Texte, ~10 Hintergrund-Extraktionen (Memory) → **~78 LLM-Calls**. Mittlere Größe: Input ~3.000 Tok/Call (Systemprompt+Persona+Zustand+Memory), Output ~340 Tok/Call → **~230k Input- (70 % Cache-Hits) / ~26k Output-Tokens** pro Sitzung. (Ohne Caching verdoppeln sich die Inputkosten; mit Sonnet-4.7±-Tokenizer +30 % Tokens.)

| Modell | Input $/MTok | Output $/MTok | Cache-Read $/MTok | Input-Kosten* | Output-Kosten | **≈ $/Sitzung** | ≈ €/Sitzung** |
|---|---|---|---|---|---|---|---|
| gpt-6-luna | 0,10 | 0,50 | 0,01 | 0,002 | 0,013 | **0,02** | 0,02 |
| Gemini 3.5 Flash-Lite | 0,30 | 2,50 | 0,03 | 0,006 | 0,066 | **0,07** | 0,06 |
| Claude Haiku 4.5 | 1 | 5 | 0,10 | 0,021 | 0,132 | **0,15** | 0,13 |
| Gemini 3.8 Flash (Intro) | 0,75 | 3,75 | 0,075 | 0,016 | 0,100 | **0,12** | 0,10 |
| gpt-5.4-mini | 0,75 | 4,50 | 0,075 | 0,016 | 0,119 | **0,14** | 0,12 |
| **Claude Sonnet 5** | 2 | 10 | 0,20 | 0,042 | 0,264 | **0,31** | 0,26 |
| gpt-5.6-terra | 2 | 12 | 0,20 | 0,042 | 0,317 | **0,36** | 0,31 |
| Gemini 3.1 Pro | 2 | 12 | 0,20 | 0,042 | 0,317 | **0,36** | 0,31 |
| Claude Opus 5.5 | 4 | 20 | 0,20 | 0,083 | 0,528 | **0,61** | 0,52 |
| Lokal (Gemma 4/Qwen klein) | – | – | – | – | – | **0** | 0 (Strom <0,10) |

\* Input-Kosten = 30 % Uncached (69k × Preis) + 70 % Cache-Reads (162k × 0,1–0,2×-Preis). \*\* Umrechnung 1 $ ≈ 0,85 € (Annahme; Tageskurs prüfen).

**Realistische Bandbreite:** 0,10–0,35 $/Sitzung im Default-Betrieb (Mini-/Flash + Haiku für Nebenfiguren, Sonnet-5-Klasse nur für Mentorin/Ministerin), **~0,3–1 $/Sitzung** bei „alles Premium", <0,05 $ bei lokalem Modell. Monatlich (20 Sitzungen): **2–20 $/Spieler** je nach Modellwahl.

**Optimierungen (Stand der Praxis):**
- Prompt Caching für Systemprompt/Tool-Katalog/Persona (Anthropic 0,1x-Reads; OpenAI Cached Input 0,1x) – größter Hebel.
- Modell-Tiering: kleines Modell für Parsing/Routing/Events, großes für Kerngespräche (die 40 Dialog-Calls bestimmen die Kosten).
- Batch API (−50 %) für Nacht-/Memory-Zusammenfassungen und vorbereitete Event-Texte.
- Output disziplinieren (max_tokens, kurze Antworten für Nebenfiguren), Gespräche kompakt halten (Qualität leidet ohnehin bei langem Kontext – siehe LangGraph-Doku).
- Tokenizer-Faktor Claude 4.7+ (~+30 %) einkalkulieren.

---

## 8. Handlungsempfehlungen für NWO (priorisiert)

1. **Architektur vor Modellwahl:** Strict-Schema-Actions + deterministische Validierung + Bestätigungs-Gate (Kap. 3) – damit ist jedes 2026er-Modell „sicher genug"; ohne diese Schicht ist jedes Modell zu gefährlich.
2. **Default-Modell:** gpt-6-luna bzw. Gemini-3.8-Flash-/Haiku-4.5-Tier für Nebenfiguren & Parsing; Sonnet 5 / gpt-6-sol / Gemini 3.1 Pro für Mentorin + 2–3 Kernfiguren. Kostenziel **< 0,30 $/Sitzung**.
3. **BYO-Key + lokaler Modus + schriftlicher Fallback** (POTUS-Muster): Das Spiel bleibt ohne KI voll spielbar; KI ist Verstärkung, nicht Voraussetzung.
4. **Gedächtnis:** strukturierter Event-/Fakten-Ledger im Spiel (Zusagen, Kränkungen, Wissensstand) + Hintergrund-Extraktion (Mem0-Muster, Batch) + Top-k-Retrieval pro Gespräch.
5. **Mentorin:** Faktenpaket + `unknown`-Schema + Enzyklopädie der Spielmechanik; Eval gegen Zahlenerfindungen.
6. **Bildproduktion:** Stil-Referenz/LoRA + Charakter-Referenzen (MJ --cref/--sref manuell, FLUX-/Nano-Banana-API für Batch), **immer Nachbearbeitung**; Budget 30–80 $/Monat.
7. **Recht:** AI-Act-Hinweis (Credits/Store/UI), C2PA-Markierung nicht entfernen, **nur fiktive Figuren** (keine realen Politiker-Ähnlichkeiten), Midjourney nur manuell (kein Automation), Nutzungsbedingungen/Ownership-Doku je Asset-Auswahl archivieren, Rechtsberatung für Endredaktion einplanen.
8. **Evals ab Tag 1:** Zahlen-Halluzination, unzulässige Aktionen, Prompt-Injection, Mehrdeutigkeit, Persona-Bruch, Mentorin-„erfundene" Fakten.

---

## 9. Gaps / nicht abschließend verifiziert

- **Deutsche Dialogqualität je Modell:** kein direkter Live-Benchmark im Recherchefenster; Einschätzung in 1.4 ist Inferenz aus Modellklasse/Community-Konsens.
- **AI Dungeon/Latitude-Dokumentation** (Privacy-Filter-Skandal 2021, Modellwechsel): nur Vorwissen, keine Live-Quelle; BYO-Key-Analyse stützt sich auf SillyTavern + Steam-Beispiele.
- **Valve-AI-Policy-Detailtext** (Fragebogen pre- vs. live-generated): nur indirekt über Store-Disclosures belegt; offizielle Steamworks-Seite zu /doc/features/ai nicht existent.
- **Gemini-Nutzungsbedingungen** (ai.google.dev/gemini-api/terms): Transportfehler bei Abfrage – Ownership-Regeln für Ausgaben vor Vertragsschluss prüfen.
- **EU-Code of Practice zur Inhaltsmarkierung** (Art. 50 Abs. 7) Finalstand Sept. 2026; **Art. 99-Bußgeldstaffelung** nicht im Detail verifiziert.
- **Deutsche Rechtsprechung zu KI-Bild-Urheberrecht** (LG/OLG-Fälle) im Recherchefenster nicht live geprüft; USCO Part 3 (Training) nur Pre-Publication.
- **BFL-Image-Preise pro Bild** (Calculator zeigte nur Video-Preis $0,17/s) – API-Dokumentation für Bildraten nachschlagen.
- Kostenrunaway-Fälle / Support-Last aus BYO-Key-Spielen: keine belastbare Dokumentation gefunden.

---

## 10. Quellen (alle abgerufen 28.09.2026)

**Preise & Modelle**
- Anthropic Pricing: https://docs.anthropic.com/en/docs/about-claude/pricing
- OpenAI Pricing: https://platform.openai.com/docs/pricing
- Google Cloud Agent Platform Pricing: https://cloud.google.com/vertex-ai/generative-ai/pricing
- OpenRouter Models: https://openrouter.ai/models
- Black Forest Labs Pricing/Licensing: https://bfl.ai/pricing ; https://bfl.ai/licensing
- Midjourney Pläne: https://docs.midjourney.com/hc/en-us/articles/27870484040333

**API-Reife / Sicherheit**
- OpenAI Structured Outputs: https://platform.openai.com/docs/guides/structured-outputs
- Anthropic Tool Use: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
- LangGraph Interrupts (HITL): https://docs.langchain.com/oss/python/langgraph/human-in-the-loop
- LangGraph Memory: https://docs.langchain.com/oss/python/langgraph/memory
- Mem0 Memory Operations: https://docs.mem0.ai/core-concepts/memory-operations
- Generative Agents (Park et al. 2023): https://arxiv.org/abs/2304.03442
- OWASP LLM Top 10 (2025): https://genai.owasp.org/llm-top-10/

**BYO-Key / Markt**
- SillyTavern API Connections: https://docs.sillytavern.app/usage/api-connections/
- SillyTavern Chat Completions/Key-Handling: https://docs.sillytavern.app/usage/api-connections/openai/
- Steam: POTUS Election Sim: https://store.steampowered.com/app/4832480/POTUS_Election_Sim/
- Steam: Boundless AI Fantasy: https://store.steampowered.com/app/3750150/Boundless_AI_Fantasy/
- Steam: FriedrichAI: Offline AI: https://store.steampowered.com/app/4111530/_FriedrichAI_Offline_AI/

**Recht**
- EU AI Act Art. 50 (Geltung ab 2.8.2026): https://artificialintelligenceact.eu/article/50/
- EU AI Act Art. 113: https://artificialintelligenceact.eu/article/113/
- US Copyright Office, Copyright and AI (Parts 1–3, Thaler, Zarya): https://www.copyright.gov/ai/
- Midjourney Terms of Service (v. 27.05.2026): https://docs.midjourney.com/hc/en-us/articles/32083055291277
