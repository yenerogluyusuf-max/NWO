# Recherche: GitHub-Repositories für „Staatsräson"

**Datum:** 2026-09-30 · **Methode:** GitHub-Suche (Repo-Metadaten: Sterne, letzter Push) + direkte Lizenz-/README-Prüfung bei allen empfohlenen und allen unklaren Kandidaten.

**Legende:** Aufwand **S** = < 1 Tag, **M** = 1–3 Tage, **L** = > 3 Tage. **Typ:** *Dep* = npm-Dependency, *Ref* = Referenz-Lektüre (kein Code-Import). Plan-IDs beziehen sich auf VERBESSERUNGSPLAN_2026-09-30.md.

---

## 1. Karten-/Geo-Rendering (Three.js-Karte, Provinz-Layer)

### pmndrs/react-three-fiber — https://github.com/pmndrs/react-three-fiber
- **Lizenz:** MIT · **Aktivität:** 32.600 ★, täglich aktiv (Push am Stichtag) · **Reife:** sehr hoch
- **Nutzen:** Falls die Karte noch „nacktes" Three.js mit eigenem Render-Loop ist, ist R3F der Standard, um Szene/Deklaration in React zu vereinheitlichen. Ergänzt, ersetzt nichts zwingend. (Karte, allgemein)
- **Aufwand:** L (Migration) / M (nur neue Layer in R3F schreiben) · *Dep*
- **Risiko:** gering; Ökosystem-Stabilität hoch. Nur aufnehmen, wenn ein konkreter Schmerz (State-Sync React↔Three) existiert.

### pmndrs/drei — https://github.com/pmndrs/drei
- **Lizenz:** MIT · **Aktivität:** 9.900 ★, sehr aktiv · **Reife:** hoch
- **Nutzen:** Helper für R3F (Kamera-Controls, Html-Overlays für Provinz-Labels, `Line`/Billboards). Sinnvoll für Hover-Labels und UI-Anker über der Karte (UI-2, UI-4). Nur relevant bei R3F-Entscheidung.
- **Aufwand:** S–M · *Dep* · **Risiko:** gering.

### visgl/deck.gl — https://github.com/visgl/deck.gl
- **Lizenz:** MIT · **Aktivität:** 14.600 ★, sehr aktiv · **Reife:** sehr hoch
- **Nutzen:** WebGL2-Layer-Framework (GeoJsonLayer, PolygonLayer, Scatterplot). Könnte den Provinz-Layer ersetzen — aber nur, wenn man von der eigenen Three.js-Karte weg will. Als Ergänzung zu drei lohnt es nicht.
- **Aufwand:** L · *Dep oder Ref* · **Risiko:** großes Framework neben Three.js = doppelter Render-Stack, Bundle-Größe. → eher Referenz für Layer-Design.

### Turfjs/turf — https://github.com/Turfjs/turf
- **Lizenz:** MIT · **Aktivität:** 10.500 ★, aktiv · **Reife:** sehr hoch, modular (einzelne `@turf/*`-Pakete)
- **Nutzen:** **Direkt passend für die Provinz-Mechanik:** `booleanPointInPolygon` (Klick→Provinz), `centroid` (Label-Platzierung, Einheiten-Position), `area` (Provinzgröße für Wirtschaft), `booleanIntersects`/`distance` (Nachbarschaft, MIL-1 Frontverlauf), `buffer` (Einflusszonen). Arbeitet auf GeoJSON — Provinz-Polygone lassen sich als GeoJSON modellieren, auch ohne echte Erdkoordinaten.
- **Aufwand:** S · *Dep* (nur benötigte Module installieren) · **Risiko:** minimal.

### d3/d3-geo — https://github.com/d3/d3-geo · d3/d3-force — https://github.com/d3/d3-force
- **Lizenz:** ISC · **Aktivität:** 1.100 ★ / 2.000 ★, gepflegt (d3-Org) · **Reife:** sehr hoch
- **Nutzen:** d3-geo nur bei echten Geo-Projektionen (Erdkarte) — für eine fiktive Karte überdimensioniert. d3-force siehe Kategorie 2.
- **Aufwand:** S · *Dep/Ref* · **Risiko:** minimal.

### topojson/topojson (client) — https://github.com/topojson/topojson
- **Lizenz:** ISC · **Aktivität:** 4.900 ★, aktiv · **Reife:** hoch
- **Nutzen:** Topologie-kodierte Geometrien = geteilte Provinzgrenzen ohne Dopplung → kleinere Assets, exakte gemeinsame Grenzen (wichtig für Grenzverläufe/Nachbarschaftsgraph). `topojson-client` zum Dekodieren, `topojson.neighbors()` liefert Provinz-Adjazenz **gratis**.
- **Aufwand:** M (Pipeline: GeoJSON→TopoJSON im Build) · *Dep + Build-Tooling* · **Risiko:** gering.

### proj4js/proj4js — https://github.com/proj4js/proj4js
- **Lizenz:** MIT · **Aktivität:** 2.200 ★, aktiv · **Reife:** hoch
- **Nutzen:** Koordinaten-Transformationen zwischen realen Referenzsystemen. Nur relevant, falls je reale Karten (Deutschland/Europa) als Szenario kommen. Für die fiktive Karte: überflüssig.
- **Aufwand:** S · *Dep (bedarfsweise)* · **Risiko:** minimal.

### maplibre/maplibre-gl-js + visgl/react-map-gl — https://github.com/maplibre/maplibre-gl-js · https://github.com/visgl/react-map-gl
- **Lizenz:** BSD-3-Clause bzw. MIT · **Aktivität:** 11.800 ★ / 8.500 ★, beide sehr aktiv · **Reife:** sehr hoch
- **Nutzen:** Vektor-Tile-Karten mit echtem GIS-Untergrund. Passt **nicht** zur eigenen stilisierten Three.js-Karte (anderes Paradigma: Tiles statt eigener Terrain-Meshes). Verworfen als Kern, s. Abschnitt „bewusst verworfen".
- **Aufwand:** L · **Risiko:** Paradigmen-Bruch.

---

## 2. Graph-/Netzwerk-Visualisierung (Politiknetz: 103 Maßnahmen, 412 Kanten; UI-4 Wirkungslinien)

### jacomyal/sigma.js + graphology/graphology — https://github.com/jacomyal/sigma.js · https://github.com/graphology/graphology
- **Lizenz:** MIT beide · **Aktivität:** 12.200 ★ bzw. 1.750 ★, aktiv · **Reife:** sehr hoch (aus dem Gephi-Umfeld)
- **Nutzen:** **Empfehlung für das Politiknetz.** Sigma rendert WebGL-basiert problemlos tausende Knoten; graphology ist die passende Graph-Datenstruktur in TS (Traversal, Metriken, Communities). Für 103 Knoten überdimensioniert in der Leistung, aber ideal in der API: ForceAtlas2-Layout (aus demselben Ökosystem) macht Wirkungszusammenhänge sichtbar. Kombination „Datenmodell (graphology) + Renderer (sigma)" trennt sauber — das eigene Politiknetz kann graphology intern nutzen, auch ohne sigma.
- **Aufwand:** M · *Dep* · **Risiko:** gering; sigma ist Render-only, Interaktion (Hover-Tooltip mit Nested Content, UI-2) muss selbst verdrahtet werden.

### cytoscape/cytoscape.js — https://github.com/cytoscape/cytoscape.js
- **Lizenz:** MIT · **Aktivität:** 11.200 ★, sehr aktiv · **Reife:** sehr hoch
- **Nutzen:** Stärkste Alternative zu sigma: bringt **Analyse-Algorithmen** (kürzeste Pfade, Betweenness — „welche Maßnahme ist der Engpass im Politiknetz?") und viele Layout-Plugins (dagre, cose) mit. Canvas-Renderer, kein WebGL — bei 103/412 absolut ausreichend. Bessere Out-of-the-box-Interaktion als sigma.
- **Aufwand:** M · *Dep* · **Risiko:** gering; eher funktionale als ästhetische Darstellung (Atlas-Ästhetik erfordert Custom-Styling).

### xyflow/xyflow (React Flow) — https://github.com/xyflow/xyflow
- **Lizenz:** MIT · **Aktivität:** 38.600 ★, sehr aktiv · **Reife:** sehr hoch
- **Nutzen:** DOM-basierte Node-UIs in React. Ideal für einen **Editier-/Debug-Modus des Politiknetzes** (INN-1: Kantenformeln in Nodes anzeigen, Verbindungen ziehen, sofortige React-Integration, Custom Nodes = Dossier-Karten im Atlas-Stil). Für die reine Spielansicht schwerer als sigma, für Werkzeugansicht unschlagbar. Layout nicht eingebaut → mit elkjs kombinieren.
- **Aufwand:** M · *Dep* · **Risiko:** gering.

### kieler/elkjs — https://github.com/kieler/elkjs
- **Lizenz:** **EPL-2.0** (geprüft; weak copyleft — als unveränderte Dependency kommerziell nutzbar, Modifikationen an elkjs selbst müssten veröffentlicht werden) · **Aktivität:** 2.800 ★, aktiv · **Reife:** hoch (Java-ELK nach JS transpiliert)
- **Nutzen:** **Layered-Layout-Algorithmus** — genau richtig für gerichtete Wirkungsgraphen (Maßnahme → Wert → Gruppe): automatische Kantenführung, Hierarchien. Kombinierbar mit React Flow (offiziell dokumentiertes Muster) oder eigener SVG-Ausgabe für UI-4.
- **Aufwand:** M · *Dep* · **Risiko:** Bundle ~1,5 MB (wasm/js) — lazy-loaden; Lizenz im Impressum/Drittlizenzen führen.

### d3/d3-force (s. oben)
- **Nutzen:** Kleinst-Lösung für Force-Layout, wenn man Rendering komplett selbst (SVG/Canvas) macht. Weniger Aufwand als sigma/cytoscape, aber alles (Drag, Zoom, Tooltip) handgemacht. Für UI-4-Wirkungslinien auf der **Karte** (Three.js) sogar passend: d3-force liefert nur Positionen, das Rendering bleibt beim eigenen Stack.
- **Aufwand:** M · *Dep* · **Risiko:** minimal.

**Vergleichsfazit:** Spielansicht Politiknetz → **sigma.js + graphology** (oder cytoscape bei Bedarf an Analyse); Werkzeug/Editor → **React Flow + elkjs**; Wirkungslinien auf der 3D-Karte → **d3-force** als reine Layout-Quelle.

---

## 3. Grand-Strategy-/Simulations-Referenzen (Mechanik-Lektüre, kein Code-Import)

### Anuken/Mindustry — https://github.com/Anuken/Mindustry
- **Lizenz:** GPL-3.0 (nur *Ref*!) · **Aktivität:** 29.200 ★, sehr aktiv · **Reife:** produktionsreifes Spiel
- **Nutzen:** **Produktionsketten-Referenz:** klare Block-/Ressourcenmodelle, deterministische Tick-Simulation, Trennung Logik (Java-Core) ↔ Darstellung. Direkt anschaubar: wie Ressourcenflüsse balanciert und serialisiert werden (Kalibrierung, Spielstände).
- **Aufwand:** S (Lesen) · *Ref* · **Risiko:** GPL — **kein Code kopieren**, nur Konzepte.

### yairm210/Unciv — https://github.com/yairm210/Unciv
- **Lizenz:** MPL-2.0 (geprüft; file-level copyleft — als Lektüre unbedenklich) · **Aktivität:** 11.400 ★, sehr aktiv · **Reife:** hoch
- **Nutzen:** Civ-V-Klon in Kotlin: **data-driven Regeln** (JSON-definierte Gebäude/Einheiten/Policies!), Tile-System, Turn-Processing, einfache KI. Die JSON-getriebene Regeldefinition ist eine direkte Blaupause dafür, wie die 103 Maßnahmen als Daten statt Code organisiert werden können (INN-1, Kalibrierung).
- **Aufwand:** S–M · *Ref* · **Risiko:** MPL bei wörtlicher Dateiübernahme beachten; Konzepte frei.

### OpenTTD/OpenTTD — https://github.com/OpenTTD/OpenTTD
- **Lizenz:** GPL-2.0 (nur *Ref*) · **Aktivität:** 8.300 ★, sehr aktiv · **Reife:** 20+ Jahre, extrem stabil
- **Nutzen:** Wirtschaftssimulation: Warenketten, Stadt-Wachstumsmodelle, **Determinismus über RNG-Seeds + Command-Queue** (Multiplayer-Sync = gleiche Anforderung wie reproduzierbare 5-Jahre-Simulationen), NewGRF-Modding als Datenformat.
- **Aufwand:** M (große C++-Codebase, gezielt lesen: `src/economy*`, `src/town*`) · *Ref* · **Risiko:** GPL; Umfang.

### freeciv/freeciv + freeciv/freeciv-web — https://github.com/freeciv/freeciv · https://github.com/freeciv/freeciv-web
- **Lizenz:** GPL-2.0 (nur *Ref*) · **Aktivität:** 1.600 ★ / 2.200 ★, beide aktiv · **Reife:** hoch
- **Nutzen:** **Ruleset-System** (Effekte als deklarative Anforderungslisten — Vorbild für Kantenformel INN-1), zugbasierte State-Maschine; freeciv-web zeigt, wie eine solche Engine an einen Web-Client angedockt wird.
- **Aufwand:** M · *Ref* · **Risiko:** GPL.

### OpenRA/OpenRA — https://github.com/OpenRA/OpenRA
- **Lizenz:** GPL-3.0 (nur *Ref*) · **Aktivität:** 17.500 ★, sehr aktiv · **Reife:** hoch
- **Nutzen:** **Lockstep-Determinismus** (Sync-Hashes pro Tick — perfektes Vorbild für deterministische Simulations-Tests, E2E), Trait-basiertes Entitätenmodell, YAML-Mini-Modding-Sprache. Für MIL-1 (Krieg als Vorgang mit Fronten) sind die Combat-/Territory-Modelle lesenswert.
- **Aufwand:** M · *Ref* · **Risiko:** GPL.

### triplea-game/triplea — https://github.com/triplea-game/triplea
- **Lizenz:** GPL-3.0 (nur *Ref*) · **Aktivität:** 1.600 ★, aktiv · **Reife:** hoch
- **Nutzen:** Rundenbasiertes Brettspiel-Framework: **Krieg als abwickelbarer „Move"-Vorgang** mit Undo/History (MIL-1), klare Phasen-Trennung (Politik → Bewegung → Kampf → Aufstellung) — gutes Phasenmodell für den Spielzyklus.
- **Aufwand:** M · *Ref* · **Risiko:** GPL.

### widelands/widelands — https://github.com/widelands/widelands
- **Lizenz:** GPL-2.0 (nur *Ref*) · **Aktivität:** 3.100 ★, sehr aktiv · **Reife:** hoch
- **Nutzen:** Siedler-artige **Warenwirtschaft mit Verzögerungen** (Ware muss transportiert werden, bevor sie wirkt) — Referenz für zeitverzögerte Maßnahmen-Effekte und Hysterese („Wirkung baut sich auf/ab").
- **Aufwand:** M · *Ref* · **Risiko:** GPL.

### tobspr-games/shapez.io — https://github.com/tobspr-games/shapez.io
- **Lizenz:** GPL-3.0 (geprüft; nur *Ref*) · **Aktivität:** 7.000 ★, aktiv · **Reife:** hoch, **JavaScript!**
- **Nutzen:** Einzige relevante Fabrik-Sim in **plain JS** — Savegame-Versionierung, Entity-System ohne Framework, deterministische Update-Schleife. Sprachlich am nächsten an unserem Stack.
- **Aufwand:** S · *Ref* · **Risiko:** GPL.

### Democracy-4-Daten: AdeptusFreemanicus/D4-Overhaul-Expansion + ZhaoFJx/D4_Simp_Chinese
- https://github.com/AdeptusFreemanicus/D4-Overhaul-Expansion (MIT, 9 ★, aktiv) · https://github.com/ZhaoFJx/D4_Simp_Chinese (Lizenz unklar, Übersetzungsmod)
- **Nutzen:** **Direkter Volltreffer für INN-1/Kalibrierung.** Beide enthalten `data/simulation/policies.csv` im Original-D4-Format: Effektformeln wie `„GDP,-0.6*(x^2)+0.2"`, `„_effectivedebt_,+0.8*(x^2)+0.2"`, Intensitäts-Slider `0+(1.0*x)`, Frequenz-/Trägheitsparameter (die Zahlen hinter den Effekten sind Verzögerungen in Quartalen). Das ist exakt das Kantenformel-Modell, das Staatsräsons Politiknetz abbildet — inklusive **negativer Quadrat-Terme** (U-förmige Effekte) und `_prereq_`-Voraussetzungen. Als Kalibrierungs-Benchmark: eigene 412 Kanten gegen D4-Formelstreuung vergleichen.
- **Aufwand:** S (CSV lesen, ggf. kleiner Parser) · *Ref/Daten-Vergleich* · **Risiko:** Die CSV-**Inhalte** sind Positech-Games-IP — nur als Referenz/Benchmark, keine Formeltexte ins eigene Spiel übernehmen.

### rakaly/jomini + pdx-tools/pdx-tools (Clausewitz/Jomini-Parser)
- https://github.com/rakaly/jomini (MIT, geprüft · 92 ★, aktiv) · https://github.com/pdx-tools/pdx-tools (GPL, 34 KB Lizenztext · 125 ★, aktiv)
- **Nutzen:** Referenz für **deklaratives Skriptformat mit deterministischer Auswertung** (Paradox-Modell: `trigger`/`effect`-Blöcke) und für robuste Parser-Bauweise (Fuzzing-Ordner im Repo!). jomini ist MIT und zeigt, wie man ein spieldefinierendes Datenformat streaming-fähig parst — relevant, falls eigene Maßnahmen-DSL geplant ist (INN-1 langfristig). pdx.tools zusätzlich als Referenz für Save-Analyse-UI (Karten/Graphs aus Spielstand).
- **Aufwand:** M · *Ref* (jomini zur Not sogar als Rust-crate nutzbar, aber Rust im JS-Projekt = L) · **Risiko:** pdx.tools GPL; jomini keine.

---

## 4. Dialog-/Narrative-Systeme (KI-2 Personengespräche, UI-1 Zeitung)

### inkle/ink + y-lohse/inkjs — https://github.com/inkle/ink · https://github.com/y-lohse/inkjs
- **Lizenz:** MIT (beide geprüft) · **Aktivität:** ink 4.950 ★ sehr aktiv; inkjs 652 ★, aktiv (TS-Port) · **Reife:** sehr hoch (ink treibt u. a. „80 Days", „Heaven's Vault")
- **Nutzen:** **Empfehlung.** ink ist die Industriestandard-Narrative-Sprache: Choices, Variablen, Bedingungen, Knoten — und über **externe Funktionen + Variablen-Binding** direkt mit dem Spielzustand verknüpfbar (Zustimmung, Koalitionsstand in Gespräche einweben, KI-2). inkjs läuft nativ in React/TS ohne Unity. Zeitung (UI-1): Schlagzeilen als ink-Knoten mit Bedingungen wählbar. LLM-Kopplung: ink liefert Struktur/Choices, LLM füllt Flavor-Text — gutes Hybrid-Muster.
- **Aufwand:** M · *Dep (inkjs)* · **Risiko:** gering; inkjs kleiner als ink-Core, Feature-Parität gut.

### YarnSpinnerTool/YarnSpinner — https://github.com/YarnSpinnerTool/YarnSpinner
- **Lizenz:** MIT (geprüft) · **Aktivität:** 2.850 ★, aktiv · **Reife:** hoch (C#)
- **Nutzen:** Konzeptuell gleichwertig mit ink, aber der JS-Runtime-Weg ist schwach (bondage.js, 62 ★, zuletzt 2024 nennenswert aktiv). Für einen React-Stack klar hinter inkjs.
- **Aufwand:** M–L · *Ref (Konzepte: Line-Provider, Command-Dispatch)* · **Risiko:** Integration bräuchte inoffizielle JS-Ports.

### lunafromthemoon/RenJS-V2 — https://github.com/lunafromthemoon/RenJS-V2
- **Lizenz:** **unklar** (keine LICENSE-Datei im Root; README ohne Lizenzangabe — nicht kommerziell nutzbar bis geklärt) · **Aktivität:** 120 ★, mäßig · **Reife:** mittel
- **Nutzen:** Visual-Novel-Engine auf Phaser. Für Fenster-/Dossier-Dialoge im Atlas-Stil kein Fit (eigene Engine statt React-Komponenten). Verworfen.

### dialogic-godot/dialogic — https://github.com/dialogic-godot/dialogic
- **Lizenz:** MIT (geprüft) · **Aktivität:** 6.000 ★, sehr aktiv · **Reife:** hoch — **aber Godot-only**
- **Nutzen:** Nicht integrierbar (GDScript/Godot). Als Design-Referenz für Timeline-/Event-basierte Dialogeditoren lesenswert (UI-1). *Ref*, Aufwand S.

---

## 5. LLM-Tooling (KI-1/KI-2/KI-3: 9 Anbieter, JSON-Aktionsprotokoll)

### vercel/ai (AI SDK) — https://github.com/vercel/ai
- **Lizenz:** Apache-2.0 · **Aktivität:** 27.100 ★, sehr aktiv · **Reife:** sehr hoch
- **Nutzen:** **Empfehlung als einheitliche Provider-Abstraktion:** deckt OpenAI, Anthropic, Google, Mistral, Ollama u. a. ab (eigene 9-Anbieter-Schicht ggf. ersetzbar), `generateObject`/`Output.object` mit **Zod-Schema → strukturierte Ausgabe** = genau das JSON-Aktionsprotokoll, inkl. Validierung und Retry-Hooks. Provider-Failover für den regelbasierten Fallback selbst bauen, aber Schema-Pfad standardisiert (KI-1, KI-2, KI-3).
- **Aufwand:** M · *Dep* · **Risiko:** gering; Vercel-getriebenes Projekt, aber lizenz- und qualitätsseitig sauber.

### 567-labs/instructor-js — https://github.com/567-labs/instructor-js
- **Lizenz:** MIT (geprüft) · **Aktivität:** 800 ★, aktiv · **Reife:** mittel-hoch
- **Nutzen:** Zod-basierte strukturierte Extraktion mit automatischem **Retry bei Schema-Verletzung** — heilt genau das Problem „LLM liefert invalide Aktion" (KI-1). Schmaler als AI SDK (OpenAI-Fokus), gute Lektüre für das Retry-Pattern, sonst durch AI SDK abgedeckt.
- **Aufwand:** S · *Dep oder Ref* · **Risiko:** kleinere Community.

### StefanTerdell/zod-to-json-schema — https://github.com/StefanTerdell/zod-to-json-schema
- **Lizenz:** ISC (geprüft) · **Aktivität:** 1.250 ★, **aber Repo archiviert** · **Reife:** abgeschlossen
- **Nutzen:** Funktional ausgereift und weiterhin installierbar; Zod 4 bringt jedoch eine eigene JSON-Schema-Konvertierung mit, und das AI SDK deckt den Pfad ebenfalls ab. → Nur verwenden, wenn auf Zod 3 festgefahren; sonst verzichten (s. „bewusst verworfen").
- **Aufwand:** S · *Dep* · **Risiko:** keine Wartung mehr.

### openai/tiktoken — https://github.com/openai/tiktoken
- **Lizenz:** MIT · **Aktivität:** 19.400 ★, aktiv · **Reife:** sehr hoch (Python/Rust-Core; für TS die WASM-Ports `dqbd/tiktoken` oder `js-tiktoken`)
- **Nutzen:** Token-Budgeting vor dem Request: Kontextfenster der 9 Anbieter durchsetzen, KI-3-Prompts (Zeitungskorpus, Gesprächshistorie) auf Budget trimmen, Kosten schätzen. Nur für OpenAI-kompatible Tokenizer exakt; bei anderen Anbietern als konservative Schätzung nutzen.
- **Aufwand:** S · *Dep (JS-Port)* · **Risiko:** WASM-Bundle ~1 MB; tokenizer-genauigkeit anbieterabhängig.

### withcatai/node-llama-cpp — https://github.com/withcatai/node-llama-cpp
- **Lizenz:** MIT (geprüft) · **Aktivität:** 2.200 ★, sehr aktiv · **Reife:** hoch
- **Nutzen:** Lokale Modelle als **Offline-Fallback/9.+ Anbieter** ohne Server: llama.cpp-Bindings für Node, **GBNF-Grammatik-/JSON-Schema-Enforcement auf Generierungsebene** — garantiert valides Aktionsprotokoll auch von kleinen lokalen Modellen (KI-1 robust machen). Auch für reproduzierbare KI-Tests (CI ohne API-Keys) wertvoll.
- **Aufwand:** M (Native-Build, Modelldownload) · *Dep (dev/optional)* · **Risiko:** native Abhängigkeit, Plattform-Builds; in CI pinnen.

### ollama/ollama-js — https://github.com/ollama/ollama-js
- **Lizenz:** MIT · **Aktivität:** 4.400 ★, sehr aktiv · **Reife:** hoch
- **Nutzen:** Leichtgewichtiger Ollama-Client — lokale Modelle für Entwicklung und deterministischere KI-Tests (temperatur 0, festes Modell), `format: json`/Schema-Support. Leichter als node-llama-cpp, braucht aber laufenden Ollama-Server.
- **Aufwand:** S · *Dep (dev)* · **Risiko:** gering.

### promptfoo/promptfoo — https://github.com/promptfoo/promptfoo
- **Lizenz:** MIT · **Aktivität:** 25.600 ★, sehr aktiv · **Reife:** sehr hoch
- **Nutzen:** **Empfehlung für KI-3/Eval:** deklarative YAML-Testsuiten über alle 9 Anbieter — gleiche Prompts, Vergleichsmatrix (Modell × Szenario), Assertions auf JSON-Schema-Konformität des Aktionsprotokolls, Kosten-/Latenztracking, CI-Integration. Dient als „Kalibrierungs-Instrument" für die KI-Politikberater: Antwortqualität über Modellwechsel hinweg stabil halten.
- **Aufwand:** M · *Dep (dev)/CLI* · **Risiko:** gering.

---

## 6. UI-Qualität (UI-1 Zeitung, UI-2 Nested Tooltips, Fenstersystem, Atlas-Ästhetik)

### floating-ui/floating-ui — https://github.com/floating-ui/floating-ui
- **Lizenz:** MIT · **Aktivität:** 32.800 ★, sehr aktiv · **Reife:** sehr hoch (Nachfolger von Popper)
- **Nutzen:** **Empfehlung für UI-2.** Positionierungs-Engine + Interaktions-Hooks (`useHover`, `useFocus`, `FloatingPortal`, `FloatingDelayGroup`, **verschachtelte Floating-Elemente** via `FloatingTree`/`FloatingNode` — genau der Nested-Tooltip-Fall: Tooltip im Tooltip mit geteiltem Delay und Fokus-Management). Headless: Styling bleibt 100 % Atlas.
- **Aufwand:** M · *Dep* · **Risiko:** minimal.

### atomiks/tippyjs — https://github.com/atomiks/tippyjs
- **Lizenz:** MIT · **Aktivität:** 12.200 ★, **Repo archiviert** · **Reife:** eingefroren
- **Nutzen:** Lange der Standard, aber nicht mehr gewartet; floating-ui ist derselbe Autor(-kreis) in aktiv. Verworfen (s. unten).

### radix-ui/primitives + shadcn-ui/ui — https://github.com/radix-ui/primitives · https://github.com/shadcn-ui/ui
- **Lizenz:** MIT beide · **Aktivität:** 19.300 ★ / 124.900 ★, sehr aktiv · **Reife:** sehr hoch
- **Nutzen:** Radix liefert zugängliche Primitives (Popover, Tooltip, Dialog, ContextMenu) als Fundament fürs **Fenstersystem** (Fokus-Fallen, ESC-Verhalten, Screenreader). shadcn/ui ist kein npm-Paket, sondern kopierbarer Komponenten-Code auf Radix+Tailwind — als **Referenz für Kompositionsmuster** (UI-1 Zeitungs-Layout: Cards, Separator, ScrollArea) sehr nützlich, Optik wird auf Atlas angepasst. Radix-Tooltip selbst unterstützt Nesting nur begrenzt → für UI-2 floating-ui vorziehen.
- **Aufwand:** M · *Dep (Radix) / Ref (shadcn)* · **Risiko:** gering; Tailwind-Bridging prüfen, falls Projekt ohne Tailwind.

### motiondivision/motion (früher framer-motion) — https://github.com/motiondivision/motion
- **Lizenz:** MIT · **Aktivität:** 33.800 ★, sehr aktiv · **Reife:** sehr hoch
- **Nutzen:** **Passt.** Fenster öffnen/schließen/minimieren, Dossier-Übergänge, Zeitungs-Blättern (UI-1), Verhandlungstisch-Inszenierung — spring-basierte Physik wirkt hochwertig und lässt sich dezent dosieren. Layout-Animationen für das Fenstersystem (Drag, Snap) sind eingebaut.
- **Aufwand:** S–M · *Dep* · **Risiko:** ~40–100 KB je nach Nutzung (tree-shakebar); keine Grundsatzrisiken.

### emilkowalski/sonner — https://github.com/emilkowalski/sonner
- **Lizenz:** MIT (geprüft) · **Aktivität:** 13.000 ★, sehr aktiv · **Reife:** hoch
- **Nutzen:** Toast-Queue für Ereignis-Flut (Gesetz beschlossen, Kriegsereignis MIL-1, KI-Hinweise): gestapelt, swipebar, Promise-Toasts (z. B. „LLM denkt…"). Kleiner, sauberer als react-hot-toast; Styling überschreibbar auf Atlas.
- **Aufwand:** S · *Dep* · **Risiko:** minimal.

---

## 7. Testing/Qualität (E2E, Kalibrierung, 335 Vitest-Tests, 1 Playwright-Skript)

### dubzzz/fast-check — https://github.com/dubzzz/fast-check
- **Lizenz:** MIT · **Aktivität:** 5.200 ★, sehr aktiv · **Reife:** sehr hoch
- **Nutzen:** **Empfehlung für Kalibrierung/Simulations-Tests.** Property-Based Testing in TS, integriert nativ mit Vitest (`@fast-check/vitest`): Invarianten der 5-Jahre-Simulation formalisieren — „Staatshaushalt bleibt endlich", „Zustimmungswerte ∈ [0,100]", „103-Maßnahmen-Graph bleibt zusammenhängend nach Effektanwendung", „Serialisieren→Deserialisieren = identischer Zustand (Replay-Determinismus)". Shrinking liefert minimale Gegenbeispiele.
- **Aufwand:** M · *Dep (dev)* · **Risiko:** gering.

### microsoft/playwright — https://github.com/microsoft/playwright
- **Lizenz:** Apache-2.0 · **Aktivität:** 96.900 ★, sehr aktiv · **Reife:** sehr hoch
- **Nutzen:** Bestehender Stack, ausbauen (E2E): **Screenshot-Assertions** (`toHaveScreenshot`) funktionieren auch auf WebGL-Canvas — mit `animations: disabled`, festem Seeded-Game-State und `maxDiffPixelRatio`-Toleranz für Font-/AA-Flakiness. `page.mouse` für Karten-Hover (Provinz-Tooltip UI-2), Traces für Flaky-Analyse, `webgl` über SwiftShader in CI (headless) möglich — dazu Fixture: Spiel startet mit fixem Seed → deterministische Frames.
- **Aufwand:** M (Ausbau auf ~10 Kernpfade: Laden, Provinz wählen, Maßnahme beschließen, Gespräch, Zeitung) · *Dep (dev)* · **Risiko:** Canvas-Snapshots sind plattformsensitiv → Snapshots im CI-Container rendern, nicht lokal.

### vitest-dev/vitest — https://github.com/vitest-dev/vitest
- **Lizenz:** MIT · **Aktivität:** 17.200 ★, sehr aktiv · **Reife:** sehr hoch
- **Nutzen:** Bestehender Stack. Addons mit konkretem Mehrwert: `@fast-check/vitest` (s. o.), **Coverage v8** (`@vitest/coverage-v8`) mit Schwellenwerten für `game/src/simulation`, **Browser Mode** (Playwright-getrieben) für Komponententests nahe am E2E, `vi.setSystemTime` für Zeit-/Kalibrierungstests, Snapshot-Serialisierer für Spielstand-Diffs (5-Jahre-Lauf als kompakte Hash-Snapshots statt Voll-JSON).
- **Aufwand:** S · *Dep (dev)* · **Risiko:** gering.

---

## Top-15-Gesamtliste (Nutzen ÷ Aufwand)

| # | Repo | Plan-Bezug | Typ | Aufwand | Warum |
|---|------|-----------|-----|---------|-------|
| 1 | **dubzzz/fast-check** | Kalibrierung, Sim-Tests | dev-Dep | M | Invarianten der 5-Jahre-Sim beweisen statt hoffen |
| 2 | **floating-ui/floating-ui** | UI-2 | Dep | M | Nested Tooltips (FloatingTree) — exakt der Plan-Punkt |
| 3 | **vercel/ai** | KI-1/2/3 | Dep | M | Einheitliche Provider-Schicht + Zod-Structured-Output für Aktionsprotokoll |
| 4 | **promptfoo/promptfoo** | KI-3, Kalibrierung | dev-Dep | M | Modellvergleich über 9 Anbieter, CI-fähig |
| 5 | **Turfjs/turf** | Provinz-Mechanik, MIL-1 | Dep | S | Punkt-in-Polygon, Nachbarschaft, Einflusszonen |
| 6 | **y-lohse/inkjs** (+ inkle/ink) | KI-2, UI-1 | Dep | M | Narrative-Standard, React-tauglich, LLM-hybridfähig |
| 7 | **jacomyal/sigma.js + graphology** | Politiknetz, UI-4 | Dep | M | WebGL-Graph + sauberes Datenmodell |
| 8 | **xyflow/xyflow (+ kieler/elkjs)** | INN-1, UI-4 (Editor) | Dep | M | Netz-Editor/Debug-Sicht mit Auto-Layout |
| 9 | **D4-Overhaul-Expansion / D4_Simp_Chinese** | INN-1, Kalibrierung | Ref/Daten | S | Echte Democracy-4-Kantenformeln als Benchmark |
| 10 | **Anuken/Mindustry** | Produktionsketten, Spielstände | Ref | S | Tick-Sim + Serialisierung in Praxisqualität |
| 11 | **yairm210/Unciv** | INN-1, Datenorganisation | Ref | S–M | JSON-data-driven Regeln als Blaupause |
| 12 | **withcatai/node-llama-cpp** | KI-1 (Fallback), Tests | Dep (opt.) | M | Lokale Modelle mit erzwungenem JSON-Schema |
| 13 | **openai/tiktoken** (JS-Port) | KI-3 | Dep | S | Token-Budgets über 9 Anbieter |
| 14 | **motiondivision/motion** | UI-1, Fenstersystem | Dep | S–M | Hochwertige Fenster-/Zeitungs-Animation |
| 15 | **emilkowalski/sonner** | UI-1/MIL-1 Ereignisse | Dep | S | Ereignis-Toast-Queue, Atlas-stylbar |

Daneben Pflicht-Ausbau ohne neue Dependency-Richtung: **Playwright-Screenshot-Tests mit Seed-Fixturen** (E2E) und **Vitest-Coverage + Zeittest-Hooks**.

## Bewusst verworfen

| Repo | Grund |
|------|-------|
| atomiks/tippyjs (+ tippyjs-react) | Archiviert; floating-ui ist der aktiv gepflegte Nachfolger desselben Ansatzes |
| floating-ui/react-popper | Archiviert (in floating-ui aufgegangen) |
| StefanTerdell/zod-to-json-schema | Archiviert; Zod 4 bringt eigene Konvertierung, AI SDK deckt den Pfad ab |
| maplibre-gl-js + react-map-gl | Vektor-Tile-Paradigma für echte GIS-Karten — ersetzt die eigene stilisierte Three.js-Karte nicht sinnvoll; Paradigmen-Bruch, L |
| proj4js, d3-geo | Nur bei realen Erdkoordinaten nötig; fiktive Karte braucht keine Projektionen (Bedarf notiert, falls Realkarten-Szenario kommt) |
| lunafromthemoon/RenJS-V2 | Keine Lizenzangabe im Repo (kommerziell unklar), Phaser-Engine statt React |
| hylyh/bondage.js | Yarn-Runtime für JS, aber 62 ★, faktisch ungewartet → inkjs stattdessen |
| dialogic-godot/dialogic | Godot/GDScript-only, nicht integrierbar (nur Design-Referenz) |
| deck.gl (als Kern) | Zweiter WebGL-Stack neben Three.js; nur als Layer-Design-Referenz |
| cytoscape.js | Gute Alternative, sigma+graphology gewinnt durch WebGL + getrenntes Datenmodell; cytoscape notieren, falls Analyse-Algorithmen (Pfade, Zentralität) gefragt werden |
| freeciv/freeciv-web, OpenTTD, OpenRA, triplea, widelands, shapez.io (als Code) | GPL — ausschließlich Referenz-Lektüre, keine Code-/Asset-Übernahme; bleiben als Lektüre-Empfehlung in Kategorie 3 |
| rakaly/jomini als Dependency | MIT und exzellent, aber Rust — Integration in TS-Stack wäre L; nur Referenz für DSL-/Parser-Design |
| AdeptusFreemanicus-Spam-Repo „D4-cheats-god-mode-capital" u. ä. | SEO-Spam-Mods, keine Substanz |
