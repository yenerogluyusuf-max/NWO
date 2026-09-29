# Technik-Stack NWO: Engine, Karte, Blender-Pipeline, Simulation (Recherche-Stand 28.09.2026)

Hinweis zur Quellenlage: Recherche via WebFetch (DuckDuckGo/Bing-Suche + Primärquellen). PDX/Clausewitz-Map-Modding war via paradoxwikis.com nicht abrufbar (JS-Challenge). Mehrere „Tauri vs. Electron 2026"-Vergleichsseiten aus den Suchergebnissen sind offensichtliche SEO-/KI-Blogs mit uneinheitlichen Benchmark-Zahlen — Aussagen daraus sind als solche markiert und nicht als belastbar behandelt.

## Key Question 1: Engine/Desktop-Shell (Electron/Tauri/Web vs. Godot vs. Unity vs. nativ)

### Takeaway
Vergleichbare politische Strategie-/Simulations-Spiele sind mehrheitlich Unity (Suzerain, Old World) oder Eigenbau-C++ (Democracy 4); für Einzelentwicklung mit KI ist die Wahl stark davon abhängig, ob Karte+UI als Web-Stack (Tauri/Electron + MapLibre) oder als klassische Engine gebaut werden soll. Tauri liefert Win/Mac/Linux-Packaging, signierte Auto-Updates und Distribution-Ziele (AppImage, DMG, MSI/NSIS, Flatpak, Stores) out of the box.

### Cited Findings
- Old World (4X-Strategie, Mohawk Games/Hooded Horse) läuft auf Unity; Plattformen Windows, macOS, Linux — [Wikipedia: Old World](https://en.wikipedia.org/wiki/Old_World_(video_game))
- Democracy 4 (Positech, politische Simulation) nutzt eine eigene, in C++ geschriebene Engine (Visual Studio), mit Middleware für Sound, Vektor-Rendering und Unicode-Fonts; die Spiellogik ist stark datengetrieben und in CSV-Dateien editierbar (Modding) — [Wikipedia: Democracy](https://en.wikipedia.org/wiki/Democracy_(video_game)) (Abschnitt Democracy 4 + Modding, gestützt auf [Positech-FAQ](https://www.positech.co.uk/democracy4/faq.html))
- Suzerain (Torpor Games, Berlin, textbasierte Regierungssimulation) wird mit Unity entwickelt; das Studio betont ein externes Scene-Testing-Tool, das Szenen „ohne Start der Unity-Game-Engine" darstellt — [Torpor Games: 2025 Broadcasts](https://www.torporgames.com/2025-broadcasts). Erstveröffentlichung Windows/macOS 2020, Ports für Konsolen/Mobil bis 2025 — [Wikipedia: Suzerain](https://en.wikipedia.org/wiki/Suzerain_(video_game))
- Suzerain nutzt articy:draft als Autoren-/Skripting-Werkzeug für die große Text- und Verzweigungsmasse (Hersteller-Case-Study; Iterationsgewinn-„3x" ist Marketing-Angabe) — [articy: Suzerain Showcase](https://www.articy.com/en/showcase/suzerain/)
- Century of Steam (Studio 346, physic-basierter Eisenbahn-Strategie-Mix) bewirbt einen eigenen Dev-vlog zur Map-UI; die konkrete Engine wurde in den gefundenen Quellen nicht offengelegt — [Studio 346: Century of Steam](https://www.studio346.net/centuryofsteam.html); [Studio 346 Home (Dev-Vlog-Hinweis)](https://www.studio346.net/index.html)
- Tauri v2: Updater-Plugin mit Pflicht-Signatur (Public Key in tauri.conf.json, Signatur-Dateien .sig), Update-Endpunkte als statisches JSON (z. B. GitHub-Releases via tauri-action) oder dynamischer Server (204 = kein Update, 200 + JSON = Update), TLS in Produktion erzwungen; Windows-Installationsmodi passive/basicUi/quiet — [Tauri Docs: Updater](https://v2.tauri.app/plugin/updater/)
- Tauri deckt Distribution-Ziele ab: Windows Installer (MSI/NSIS), macOS Bundle/DMG, Linux AppImage/Debian/RPM/Flatpak/Snap/AUR, dazu App-Stores und CI-Pipelines (GitHub, CrabNebula Cloud) — [Tauri Docs: Distribute](https://v2.tauri.app/distribute/) (Navigations-/Doku-Übersicht)
- Unity ist laut einer Statistik-Aggregator-Seite in ~51 % der Steam-Spiele enthalten, Godot habe 2020–2025 stark an Marktanteil gewonnen (Zahlen nicht primär belegt; Sekundärquelle mit Vorsicht) — [LEVVVEL: Game Engine Market Share](https://levvvel.com/statistics/game-engine-market-share/)

### Inferences
- Das Vergleichsfeld zeigt zwei funktionierende Pfade für NWO-Ähnliches: (a) Unity mit datengetriebener Logik (Old World, Suzerain) — bringt Editor, UI-Toolkit, Multi-Plattform-Builds und die meisten KI-Trainingsdaten/Beispiele für Unity-C#; (b) kompletter Eigenbau (Democracy 4) — maximaler Kontrollgewinn, aber volle Eigenverantwortung für Rendering/Save/Packaging.
- Für eine Einzelperson mit KI-Unterstützung ist Unity der pfadabhängigste „Spiel"-Weg (C#-Code wird von KI-Modellen sehr gut erzeugt/reviewt), Tauri+Web der pfadabhängigste „Karte+Akten-UI"-Weg, weil MapLibre/deck.gl dort nativ laufen und die HOI4-nahe stilisierte Karte dort am günstigsten ist.
- Tauris signierter Auto-Update-Flow und die statische latest.json-Variante über GitHub-Releases sind für Einzelspieler-Distribution (auch ohne eigenen Server) ausreichend und reduzieren Wartung.
- Die Web-Stack-Option (Tauri/Electron) erfordert eine eigene Simulations-Runtime (Rust-Sidecar, Node oder WASM), da die Simulation deterministisch und ohne LLM laufen muss — das ist machbar, aber Architekturarbeit, die Unity kostenlos mitliefert (Spiel-Loop, Szenen, Save-Systeme als Konvention).
- Electron ist für dieses Projekt voraussichtlich die schlechtere Shell gegenüber Tauri: gleiche Frontend-Ökonomie, aber größeres Bundle/RAM (Zahlen der Vergleichsblogs widersprechend: „96 % kleiner/75 % weniger RAM" bis „20–50x kleiner"; ohne belastbare Primärbenchmarks nicht als Fakt verwendbar — siehe Gaps).

### Gaps
- Belastbare, gemessene Bundle-/RAM-Vergleiche Tauri vs. Electron aus Primärquellen (offizielle Benchmarks fehlen; nur SEO-Blogs).
- Engine von Century of Steam (wahrscheinlich Unity oder Unreal, nicht bestätigt).
- Godot-spezifische Referenzspiele im politischen Strategiesegment (keine gefunden, die dem Anforderungsprofil NWO entsprechen).
- Konkrete Unity-Lizenzkosten (Personal/Pro-Schwellen) zum Recherche-Zeitpunkt nicht geprüft.
- Keine Quelle gefunden, die Electron-WebGL-Performance für kartenlastige Strategiespiele direkt misst.

## Key Question 2: Kartendarstellung im HOI4-Stil (Relief, Provinz-Highlighting, Zoom bis Bezirk)

### Takeaway
Für eine stilisierte Länder-/Provinzkarte mit Relief ist MapLibre GL JS (WebGL, Vector Tiles, Hillshade/Color-Relief/3D-Terrain-Layer, Feature-Picking via queryRenderedFeatures, feature-state-Hover) der reifste Web-Pfad; wie Paradox/Clausewitz ihre Karte intern rendert, ließ sich aus belastbaren Quellen nicht belegen (Fan-Wissen, Lücken siehe unten).

### Cited Findings
- MapLibre GL JS ist eine TypeScript-Bibliothek, die interaktive Karten aus Vector Tiles per WebGL rendert; Darstellung wird über ein Style-Dokument (MapLibre Style Spec) gesteuert; Schwesterprojekt MapLibre Native existiert für Native-Plattformen — [MapLibre GL JS: Introduction](https://maplibre.org/maplibre-gl-js/docs/)
- Relevante, offiziell dokumentierte Beispiele: „Add a hillshade layer", „Add a multidirectional hillshade layer", „Add a color relief layer", „Add 3D terrain from quantized-mesh tiles", „Create a hover effect", „Get features under the mouse pointer", „Update GeoJSON polygons", „Show polygon information on click", PMTiles-Source/Protocol, Custom Style Layer, deck.gl-Layer-Integration — [MapLibre GL JS: Examples](https://maplibre.org/maplibre-gl-js/docs/examples/)
- MapLibre liefert einen eigenen Leitfaden „Optimising MapLibre Performance: Tips for Large GeoJSON Datasets" — [MapLibre Guide: Large Data](https://maplibre.org/maplibre-gl-js/docs/guides/large-data/)
- Tippecanoe baut Vector-Tilesets aus GeoJSON/FlatGeobuf/CSV; für durchgehende Polygon-Features („states and provinces") empfiehlt das offizielle Cookbook `--coalesce-densest-as-needed` (Verschmelzen statt Verwerfen bei zu großen Tiles), `--drop-densest-as-needed` für Punkte; Ausgabe als .mbtiles oder .pmtiles — [felt/tippecanoe README](https://github.com/felt/tippecanoe)
- Zoom-stufige Layer (Länder niedrig, Provinzen hoch) sind dokumentiert: getrennte Tilesets mit `-z3` bzw. `-Z4` und Zusammenführung via `tile-join` — [felt/tippecanoe README, Cookbook „Show countries at low zoom levels but states at higher zoom levels"](https://github.com/felt/tippecanoe)
- Tippecanoe rechnet intern in 32-Bit-Tile-Koordinaten (Auflösung ~1 cm auf Erdoberfläche); Detail/Simplifizierung über `-d`, `-D`, `-zg` (Auto-Maxzoom) steuerbar — [felt/tippecanoe README](https://github.com/felt/tippecanoe)
- mapshaper ediert Shapefile/GeoJSON/TopoJSON/GeoTIFF/CSV mit Simplify, Clip, Erase, Dissolve, Filter; topologiebewusste Vereinfachung; CLI (`mapshaper`, `mapshaper-xl` für große Dateien) und Browser-GUI; Lizenz MPL-2.0 — [mbloch/mapshaper README](https://github.com/mbloch/mapshaper)

### Inferences
- Ein HOI4-artiger Look ist im Web-Stack realisierbar als Kombination aus: (1) vorgerendertem stilisiertem Relief (Raster-Tiles oder Raster-DEMTiles/Hillshade aus Blender/GDAL erzeugt), (2) Provinz-/Bezirks-Polygone als Vector Tiles (Tippecanoe/PMTiles) mit fill/line-Layern, (3) feature-state für Hover/Selektions-Highlighting („Create a hover effect"-Muster), (4) `queryRenderedFeatures` für Provinz-Picking unter dem Mauszeiger — alles offiziell dokumentierte MapLibre-Muster.
- Zoom-Stufen von 81 Provinzen bis ~900 İlçe lassen sich über getrennte Layer/Tilesets mit minzoom/maxzoom (Tippecanoe `-Z`/`-z` + tile-join) sauber entkoppeln: Provinz-Layer immer sichtbar, İlçe-Layer erst ab Zoom ~8–9; Bezirks-Polygone müssen dann nur auf hohen Zooms in Tiles liegen.
- Der Kombination aus Karten-Canvas und Akten-/Panel-UI steht im Web-Stack nichts im Weg (HTML/CSS-Panels neben/nach MapLibre-Canvas; Popups/Marker in MapLibre); in Godot/Unity müsste man diese UI-Sprache mit den Bordmitteln nachbauen (Unity Toolkit/Godot Control-Nodes), was für tabellenlastige „Akten"-Oberflächen mehr Aufwand ist als HTML.
- HOI4/Clausewitz rendert nach Community-Verständnis eine texturierte Karte mit separaten Definitions-/Provinz-Maps (Pixel-Color-Coding) — das ist hier nicht ausreichend belegt und daher bewusst nur als Arbeitshypothese behandelt (siehe Gaps).

### Gaps
- Offizielle/verlässliche Dokumentation der Clausewitz-Karten-Pipeline (Provinz-BMPs, Terrain-Shader, Border-Rendering): paradoxwikis.com/Map_modding war per JS-Challenge blockiert; keine zweite belastbare Quelle gefunden. Fan-/Modding-Wissen gilt nur als Hinweis, nicht als Quelle.
- Konkrete Shader-/Shading-Rezepte für „stilisiertes Relief" (Papier-/Messing-Look wie HOI4) in MapLibre — Style-Spec kann Hillshade/Color-Relief, aber ein handgemalter Painterly-Look fehlt als Rezept.
- deck.gl wurde nicht vertieft geprüft (nur als MapLibre-Kompatibilitätshinweis in den Examples sichtbar).
- Karten-Performance-Benchmarks (fps) für ~1000 Polygone mit Highlighting in MapLibre auf Low-End-Desktops fehlen.

## Key Question 3: Geodaten-Pipeline (GADM/OSM → spielbare Polygone)

### Takeaway
Der dokumentierte Industrie-Pfad ist: Quelldaten (Shapefile/GeoJSON) → Topologie-Bereinigung/Simplifizierung (mapshaper, QGIS/ogr2ogr) → Vector Tiles (Tippecanoe, mbtiles/pmtiles); für ~900 Bezirke plus 81 Provinzen ist das eine kleine Datenmenge, die problemlos lokal in die App eingebettet werden kann.

### Cited Findings
- Tippecanoe-Cookbooks zeigen den vollständigen Workflow mit `ogr2ogr` (Shapefile → GeoJSON) als Vorstufe, inklusive Natural-Earth- und TIGER/US-Census-Beispieldaten — [felt/tippecanoe README, Cookbook](https://github.com/felt/tippecanoe)
- mapshaper unterstützt Simplify (topologieerhaltend), Dissolve (z. B. Bezirke → Provinzen aggregieren), Filter, Clip und Datei-Konvertierung zwischen Shapefile/GeoJSON/TopoJSON; dokumentiert sind harte CLI-Limits (2 GB pro Ausgabedatei, `mapshaper-xl` mit 8 GB Heap) — [mbloch/mapshaper README](https://github.com/mbloch/mapshaper)
- mapshaper stellt eine maschinenlesbare Doku bereit (`mapshaper.org/llms.txt`, Seiten als `.md`), was die Nutzung durch KI-Assistenten in der Pipeline explizit unterstützt — [mbloch/mapshaper README](https://github.com/mbloch/mapshaper)
- Für stufenweise Detaillierung (Welt/Land → Provinz → Bezirk) empfiehlt Tippecanoe `-zg` (Maxzoom automatisch aus Feature-Dichte) und `--extend-zooms-if-still-dropping` — [felt/tippecanoe README](https://github.com/felt/tippecanoe)

### Inferences
- Praktische Pipeline für NWO: offizielle Türkei-Grenzen (Provinz-/Ilçe-Ebene, z. B. GADM oder OSM-Abgeleitete) in QGIS/ogr2ogr nach GeoJSON → mapshaper (`-simplify`, `clean`, `dissolve` für Hierarchie) → tippecanoe zu einer lokalen .pmtiles-Datei, die in Tauri/Electron als Asset ausgeliefert wird (PMTiles-Protokoll ist in MapLibre unterstützt, kein Tile-Server nötig).
- Topologie-Bereinigung ist der kritische Schritt für Highlighting und Nachbarschaftslogik: mapshapers TopoJSON-Modell teilt Kanten zwischen Polygonen, wodurch keine Risse/Überlappungen zwischen Provinz- und Bezirksebene entstehen — wichtig, wenn beide Ebenen gleichzeitig gerendert und per Picking abgefragt werden.
- Mit ~81 + ~900 Polygonen ist „Performance" ein Nicht-Problem der Rohdaten; der Aufwand liegt in der Ästhetik (Vereinfachungsgrad so wählen, dass Grenzen bei max. Zoom nicht „aufgezogen" wirken) und in stabilen IDs (Provinz-/Bezirkscodes als Feature-Properties für Simulationskopplung).
- Bezirksdaten müssen eine stabile ID-Tabelle (il/ilçe-Codes, Namen TR/DE, Metadaten) neben der Geometrie führen; tippecanoe erlaubt Attribut-Filter (`-y`/`-x`) und Typ-Coercion, sodass nur die spielrelevanten Felder in den Tiles landen.

### Gaps
- Konkrete, lizenzsaubere Quelle für offizielle türkische Provinz-/Ilçe-Grenzen (GADM-Abdeckung/Genauigkeit für İlçe, OSM-Abdeckungsqualität in der Türkei, ODbL-Pflichten) — nicht geprüft.
- Keine Zahlen zu typischen Tile-Größen/Ladezeiten für dieses kleine Dataset (unwichtig, aber nicht gemessen).
- Behandlung von Sonderfällen (Seen, Grenzgebiete, ilçes über mehrere Polygone) in den Quelldaten nicht untersucht.

## Key Question 4: Blender-Render-Pipeline (3D → 2D-Sprites/„Messing"-Assets)

### Takeaway
Blender bietet mit der Python-API (bpy) und dem Render-Operator-Set alles für automatisiertes Batch-Rendering (u. a. headless über die Kommandozeile, „Blender as a Python Module"); eine konsistente Material-/Beleuchtungs-Pipeline für „Messing"-Optik lässt sich als .blend-Template mit fester Kamera/World festschreiben und über Skripte pro Asset durchlaufen.

### Cited Findings
- Die offizielle Blender-Python-API dokumentiert Render-Operatoren (`bpy.ops.render`) als Teil von `bpy.ops` — [Blender Python API: Render Operators](https://docs.blender.org/api/current/bpy.ops.render.html)
- Blender kann als Python-Modul eingebunden werden (offizielles Advanced-Thema „Blender as a Python Module"), was headless Batch-Rendering außerhalb der UI ermöglicht — [Blender Python API: Blender as a Python Module](https://docs.blender.org/api/current/info_advanced_blender_as_bpy.html)
- Die API-Doku umfasst u. a. Material-, Shader-Node- und Export-Operatoren (`bpy.ops.export_scene`, u. a. glTF als `IO_FH_gltf2`-File-Handler sichtbar), also sowohl Sprite-Export als auch 3D-Export in Engines — [Blender Python API: Application Modules](https://docs.blender.org/api/current/bpy.ops.html)

### Inferences
- Empfohlene Pipeline für NWO: ein „Master"-.blend mit (a) fester Kamera/Ortho- oder Perspektive je Assetklasse, (b) gemeinsamer World-/Licht-Setup für den einheitlichen Look, (c) Material-Library für „Messing" (Principled BSDF: hohe Metallic-Werte, gesteuerte Roughness, warme Farbtemperatur über Licht); Assets werden als Varianten (Objekt tauschen/Collection pro Asset) eingesetzt und per `blender -b master.blend --python render_assets.py` gerendert (`bpy.ops.render.render(write_still=True)` pro Asset).
- Konsistenz ist durch Template + Skript besser erreichbar als durch manuelle Einzelrenderings; Änderungen am Look sind ein Commit im .blend/Script und betreffen alle Assets gleichzeitig — das skaliert auf hunderte Stadtfiguren/„Messingteile".
- Exportformate: für 2D-Sprites PNG (ggf. mit Alpha/Transparent-Film und Benennungskonvention pro Zoomstufe), für ggf. spätere 3D-Nutzung glTF (in der API als File-Handler vorhanden); Sprite-Sheets/Atlanten müssen ggf. als Post-Processing-Schritt (ImageMagick o. Ä.) erzeugt werden — das ist hier nicht belegt, sondern Arbeitshypothese.
- Aufwand für eine Einzelperson: Das Setup (Template-Scene, Materialien, Render-Skript) ist einmalige Arbeit von wenigen Tagen; pro Asset danach nur noch Modellierung + ein Skriptlauf.

### Gaps
- Konkrete Eevee- vs. Cycles-Empfehlung für Sprite-Rendering (Geschwindigkeit/Qualität) wurde nicht aus Dokumentation belegt; Eevee-Next-Perf. in Blender 4.x/5.x nicht geprüft.
- Keine belegten Benchmarks für Renderzeiten pro Asset.
- Behandlung von Transparenz/Alpha-Kanten („Fringe"-Problem) und konsistenter Skalierung über Assets hinweg nicht recherchiert.
- Das vorhandene Projekt-Blender-Skript (Prototyp) wurde nicht mit diesen Erkenntnissen abgeglichen.

## Key Question 5: Simulationsarchitektur (Deterministische Ticks, Save, Datenformate, Regelsprachen, Testing)

### Takeaway
Der klassische, gut belegte Weg zu exakt reproduzierbarer Tick-Simulation ist: fester Zeitschritt (fixed dt) mit Akkumulator, entkoppelt vom Rendering, mit optionaler Interpolation — Variable Delta Times zerstören laut Fachliteratur die exakte Wiederholbarkeit bereits durch Fließkomma-Ungenauigkeit; datengetriebene Regeln (CSV/JSON/DSL) haben mit Democracy 4 einen prominenten Vorläufer im Strategiesegment.

### Cited Findings
- Glenn Fiedler („Fix Your Timestep!"): Variable Delta Time macht Simulationsverhalten framerate-abhängig; für exakte Reproduzierbarkeit „from one run to the next given the same inputs" (u. a. für deterministic lockstep) ist ein vollständig fixer Zeitschritt nötig, da schon semi-fixed Steps durch begrenzte Fließkomma-Präzision nicht identisch sind; empfohlenes Muster: Renderer „produziert" Zeit, Simulation „konsumiert" sie in fixen dt-Schritten über einen Akkumulator, Rendering-Zustand per Interpolation aus vorherigem/aktuellem Sim-Status; Warnung vor „spiral of death" bei aufholender Simulation, Gegenmittel: Headroom bzw. Clamp der Steps pro Frame — [Gaffer On Games: Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/)
- Democracy 4: Spiellogik bewusst datengetrieben in CSV editierbar (Neural-Network-artiger Kern lt. Entwickler), was Modding und Testbarkeit von Regeländerungen ohne Neubau ermöglicht — [Wikipedia: Democracy](https://en.wikipedia.org/wiki/Democracy_(video_game))
- Suzerain: große narrative/regelhafte Inhaltsmenge wird in externem Tool (articy:draft) statt im Code verwaltet — [articy: Suzerain Showcase](https://www.articy.com/en/showcase/suzerain/)

### Inferences
- Für NWO (pausierbare Tage) ist der Tagesschritt trivial deterministisch: Die Simulation muss nur einen Befehl „nächster Tag" kennen; kein Echtzeit-Akkumulator nötig. Das Fixed-dt-Muster ist trotzdem die richtige Referenz, sobald Animations-/Interpolationsschichten dazukommen, und die Regel „nur ganzzahlige Ticks in der Simulation" beugt Float-Drift vor.
- Determinismus-Anforderungen an den Sim-Kern: keine Float-Abhängigkeit von Hash-Iteration/Reihenfolge, explizite RNG-Seeds pro Tick (Seed + Tick-Nummer als Save-Teil), keine Uhr-/OS-Zufälle, festgelegte Ausführungsreihenfolge der Subsysteme (Wirtschaft → Politiknetz → Wahl …). Event-Sourcing (Befehls-/Event-Log + Snapshots) macht Saves reproduzierbar („Spieler Aktion an Tag N → identischer Zustand"), was für Golden-Szenario-Tests und Bug-Reports per Save-Datei ideal ist; Snapshot+Log ist der übliche Kompromiss (Spielstand = Snapshot + letzte Events).
- ECS vs. klassisches Objektmodell: Für 81 Provinzen + ~900 Bezirke + Akteure ist die Entity-Zahl klein; ein klares, getestetes Domänenmodell (Datenstrukturen + pure Functions pro Tick) ist für Einzelentwicklung wartbarer als ein volles ECS-Framework. ECS lohnt primär bei zehntausenden Entities (Einheiten/Units) — hier nicht der Fall.
- Datenformate: JSON (regel-/inhaltsschicht, diffierbar, KI-freundlich) + SQLite (Save/Savegames, Metadaten, Test-Fixtures, da transaktional und plattformunabhängig) ist ein pragmatisches Paar; Parquet nur für Analyse-/Export-Zwecke. Regelsprache: Prolog eignet sich für institutionelle Verfahren (Ableitbarkeit/Nachweisbarkeit: „Warum gilt Beschluss X?"), hat aber Ökosystem-/Tooling-Kosten; eine kleine deklarative Datenregel-Schicht (Wenn-Dann mit Prioritäten, testbar wie Prolog-Queries) erreicht 80 % des Nutzens mit vollem Debugger-Zugriff. Golden-Szenarien (feste Seeds, erwartete Zustände nach N Tagen) sind bei deterministischem Kern trivial zu implementieren.
- LLM-Schnittstelle gehört konsequent aus dem Sim-Kern herausgehalten: Das LLM erzeugt geprüfte Aktionen (siehe Key Question 6), die Kernel-validiert und dann wie jede andere Spieler-Aktion ins Event-Log geschrieben werden — dadurch bleibt Offline-Betrieb und Determinismus unberührt.

### Gaps
- Keine Primärquellen zu Event-Sourcing im Spielekontext oder ECS-Vergleichen recherchiert (Aussagen oben sind begründete Inferenzen aus allgemeinem Software-Wissen + den zitierten deterministischen Mustern).
- Prolog-Integration in Desktop-Stacks (SWI-Prolog-Bindings für Rust/JS/Python) nicht geprüft.
- Serialisierungsformat für Savegames (binär vs. JSON-Snapshot) nicht mit Leistungsdaten belegt.
- Wahl-/Prolog-Regelwerk des bestehenden Prototyps wurde nicht gesichtet.

## Key Question 6: LLM-Anbindung aus der Desktop-App (Function Calling, Schema, Offline-Fallback, Streaming)

### Takeaway
Tool/Function-Calling mit JSON-Schema (`input_schema`) ist der dokumentierte Standardweg, freie Sprachbefehle in strukturierte Aktionen zu übersetzen; mit `strict: true` können Aufrufe schema-konform erzwungen werden, und die Client-Tool-Architektur (App führt Tool aus, schickt `tool_result` zurück) hält die Aktionsausführung vollständig in der deterministischen Simulation.

### Cited Findings
- Anthropic Tool Use: Client Tools werden mit `input_schema` definiert; das Modell antwortet mit `tool_use`-Blöcken, die Anwendung führt aus und sendet `tool_result` zurück (Round-Trip dokumentiert inkl. Beispielen); `tool_choice` steuert Erzwungung von Aufrufen — [Anthropic Docs: Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- Mit `strict: true` in Tool-Definitionen ist garantiert, dass Tool-Aufrufe exakt dem Schema entsprechen („Guarantee schema conformance with strict tool use") — [Anthropic Docs: Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) (Hinweis auf [Strict tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use))
- Bei fehlenden Pflichtparametern verhalten sich Modelle unterschiedlich (Opus fragt eher nach, kleinere Modelle raten ggf.) — der Tool-Handler muss Parameter validieren, nicht auf Vollständigkeit vertrauen — [Anthropic Docs: Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- Tool Use verursacht Zusatz-Token (Schema + tool_use/tool_result-Blöcke; modellspezifische System-Prompt-Overheads in der Doku tabelliert), ist aber wie normale API-Aufrufe bepreist — [Anthropic Docs: Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- MCP-Connector existiert, falls externe Werkzeuge angebunden werden sollen (Referenz im selben Doku-Set) — [Anthropic Docs: MCP connector](https://platform.claude.com/docs/en/agents-and-tools/tool-use/mcp-connector)

### Inferences
- Architektur-Empfehlung: definiere eine kleine, feste Aktions-API als Tool-Schema (z. B. `set_policy`, `appoint`, `start_investigation`, `advance_to_day`), validiere jedes `tool_use.input` zusätzlich im Sim-Kern gegen die Spielregeln (Berechtigungen, Ressourcen, Tag), lehne ungültiges ab und gib die Ablehnung als `tool_result`-Fehler an das Model zurück — so kann kein LLM-Ausgabeformat die Simulation brechen.
- Offline/Fallback: da die Simulation Aktionen nur als geprüfte strukturierte Befehle entgegennimmt, kann dieselbe Aktions-API auch aus klassischer UI (Buttons/Formulare) und einer Kommando-Parser-Fallback-Ebene ohne LLM bedient werden; das LLM ist eine Eingabemodalität, nicht Teil des Kernels.
- Streaming-UI für Dialoge ist eine reine Frontend-Angelegenheit (Token-Streams des Providers in den Chat-Panel rendern) und koppelt nicht an die Simulation; die Aktionsausführung selbst ist asynchron und wird dem Spieler vor Ausführung zur Bestätigung angezeigt (Human-in-the-loop als Regelwerksschicht).
- `strict`-Schema-Nutzung + eigene Validierung sind doppelt abgesichert; besonders wichtig bei Aufzählungsparametern (Provinz-/Personen-IDs), die als Strings ankommen und gegen die Sim-Datenbank aufgelöst werden müssen.

### Gaps
- Streaming-API-Details (SSE, SDK-Unterstützung) nicht in dieser Recherche belegt (nur allgemein bekannt).
- Konkrete Schema-Beispiele für Strategiespiel-Aktionen (Kombination aus Function Calling + JSON Schema in einer Desktop-App) nicht aus Produktionssystemen recherchiert.
- Kosten-/Latenz-Messwerte für Dialog-Last im Spielbetrieb fehlen.
- OpenAI-/andere Provider-Tool-Formate nicht vergleichend geprüft (nur Anthropic-Doku als Referenz).

## Key Question 7: Leistung (81 Provinzen + ~900 İlçe + Layer + Tageslogik)

### Takeaway
Die Last ist bescheiden: ~1000 Polygone sind für WebGL-Kartenrenderer (MapLibre) und für eine Tagessimulation über ~1000 Datensätze unkritisch; die echten Engpässe liegen im Tile-/Style-Aufbau, in der UI-Update-Frequenz pro Tick und in der Gefahr, die Karte bei jedem Tick komplett neu zu laden.

### Cited Findings
- MapLibre stellt einen dedizierten Performance-Leitfaden für große GeoJSON-Datensätze bereit (Empfehlungen dort u. a. Richtung Vector Tiles statt rohem GeoJSON) — [MapLibre Guide: Large Data](https://maplibre.org/maplibre-gl-js/docs/guides/large-data/)
- Tippecanoe-Optionen (`--drop-densest-as-needed`, `--coalesce-densest-as-needed`, Attribut-Filter `-x`/`-y`) existieren explizit, um Tile-Größen und Feature-Mengen pro Zoom zu kontrollieren — [felt/tippecanoe README](https://github.com/felt/tippecanoe)
- „Spiral of death" (Sim fällt zurück, holt auf, fällt weiter zurück) ist das dokumentierte typische Simulations-Engpass-Muster bei Echtzeitschleifen; Abhilfe: Headroom bzw. Clamp der Steps pro Frame — [Gaffer On Games: Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/)
- Tauri-IPC und Plugin-Permissios-Modell sind dokumentiert (Aufruf Rust↔Frontend über Commands/Channels), relevant, wenn Simulation im Rust-Backend läuft und die Karte im WebView — [Tauri Docs: Calling Rust from the Frontend](https://v2.tauri.app/develop/calling-rust/); [Tauri Docs: Calling the Frontend from Rust](https://v2.tauri.app/develop/calling-frontend/)

### Inferences
- Rechenbudget pro Tagesschritt: ~1000 Regionen × einige Dutzend Attribute sind ~10⁴–10⁵ einfache Operationen — im Millisekundenbereich, auch in JS/Python; die Tagessimulation wird nie der Engpass sein. Engpässe entstehen erst durch schlechte Kopplung (z. B. pro Tick alle Geometrien neu setzen statt Attribut-Updates, oder pro Tick Savegame-Neuberechnung der gesamten Historie).
- Karten-Updates pro Tick sollten als Daten-Update erfolgen (MapLibre `update-a-feature-in-realtime`-Muster / feature-state / GeoJSON-Source-Diff), nicht als Neuaufbau des Styles; Highlighting (Hover/Selektion) ist ein feature-state-Flag, kein Re-Render der Geometrie.
- Tile-Strategie: Provinz- und İlçe-Ebenen in getrennte Layer mit minzoom/maxzoom (siehe Key Question 2/3), damit bei Übersichtszooms nur 81 statt ~900 Features gezeichnet werden; Relief als Raster-Layer (vorberechnet), nicht als Live-Hillshade über riesige DEMs, wenn flüssiges Zoomen Priorität hat.
- UI-Seitig: Panel-/Akten-Updates nur für die sichtbare Auswahl („faul" rendern), Chat/LLM-Streams asynchron; Speichern/Laden als Snapshot in SQLite mit schmalem Zeilenvolumen (nur Delta seit letztem Snapshot) hält Save-Operationen ebenfalls im ms-Bereich.

### Gaps
- Keine gemessenen fps-/Ladezeit-Benchmarks für genau diese Konstellation (nur qualitative Belege + Größenordnungsargumente).
- Leistungsverhalten von WebView-MapLibre (Tauri/Electron) vs. nativem MapLibre Native auf Low-End-Desktops nicht gemessen.
- Verhalten bei Langzeit-Spielen (Historienwachstum über hunderte Tage, Speicher des Event-Logs) nicht quantifiziert.

---

## Quellenliste (kompakt)

- https://en.wikipedia.org/wiki/Old_World_(video_game)
- https://en.wikipedia.org/wiki/Democracy_(video_game)
- https://en.wikipedia.org/wiki/Suzerain_(video_game)
- https://www.torporgames.com/2025-broadcasts
- https://www.articy.com/en/showcase/suzerain/
- https://www.studio346.net/centuryofsteam.html ; https://www.studio346.net/index.html
- https://v2.tauri.app/plugin/updater/ ; https://v2.tauri.app/distribute/ ; https://v2.tauri.app/develop/calling-rust/ ; https://v2.tauri.app/develop/calling-frontend/
- https://levvvel.com/statistics/game-engine-market-share/ (Sekundärquelle, Vorsicht)
- https://maplibre.org/maplibre-gl-js/docs/ (+ /examples/ ; /guides/large-data/)
- https://github.com/felt/tippecanoe
- https://github.com/mbloch/mapshaper
- https://docs.blender.org/api/current/bpy.ops.render.html ; https://docs.blender.org/api/current/info_advanced_blender_as_bpy.html ; https://docs.blender.org/api/current/bpy.ops.html
- https://gafferongames.com/post/fix_your_timestep/
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview

Nicht abrufbar/gesperrt während der Recherche: hoi4.paradoxwikis.com/Map_modding (JS-Challenge). DuckDuckGo zeitweise mit CAPTCHA; Ausweich über Bing und Direkt-URLs.
