# RECHERCHE: GitHub-Repos & offene Datenquellen für „Staatsräson"

**Stand der Recherche: 2026-10-02 · Methode: GitHub Repository/Code-Suche + README/Lizenz-Prüfung jedes empfohlenen Repos + WebSearch für Lücken**
**Geprüfte Repos: 44 (README, ggf. LICENSE/Verzeichnislisting eingesehen). Keine ungesehene Empfehlung.**

Legende Aufwand: **S** = Datei laden / einmalig konvertieren · **M** = Scraper/API-Key/ETL nötig · **L** = laufende Pflege oder komplexe Pipeline.
Lizenz-Marker: ✅ kommerziell nutzbar · ⚠️ eingeschränkt/unklar (Details im Eintrag) · ❌ für kommerzielles Spiel ungeeignet.

---

## 1. Geodaten Türkei (Admin-Boundaries, Terrain, Netze)

| Repo | Lizenz | Aktivität | Daten & Aktualität | Nutzen für uns | Aufwand |
|---|---|---|---|---|---|
| **uyasarkocal/borders-of-turkey** — [github.com/uyasarkocal/borders-of-turkey](https://github.com/uyasarkocal/borders-of-turkey) | ✅ **CC0 1.0** (LICENSE-Datei geprüft) | 21★, zuletzt aktiv 2026-05 | 3 GeoJSON-Dateien: Staatsgrenze (lvl0, ~10 MB), Provinzen (lvl1, ~11 MB), **Landkreise/İlçe (lvl2, ~15 MB)** | Direkter Drop-in für unsere Three.js-Karte: Provinz- UND Bezirksgrenzen als fertige GeoJSONs | **S** |
| **ttezer/turkiye-harita-verisi** — [github.com/ttezer/turkiye-harita-verisi](https://github.com/ttezer/turkiye-harita-verisi) | ✅ Code MIT; Daten: HDX-Snapshot `COD-AB-TUR`, **CC BY-IGO** (Atribusyon nötig); DATA-LICENSE.md geprüft | 29★, sehr aktiv (2026 erstellt, laufend Updates) | İl, **İlçe und teilweise Mahalle**; Export in GeoJSON, TopoJSON, CSV, KML, SHP, GPKG u.v.m.; normalisierte Pipeline mit Tests | Vollständigster aktueller Türkiye-Boundary-Satz; Quelle OCHA/HDX (amtlich kuratiert). Mahalle-Ebene für Großstädte | **S/M** (Build `npm run build`) |
| **wmgeolab/geoBoundaries** — [github.com/wmgeolab/geoBoundaries](https://github.com/wmgeolab/geoBoundaries) | ✅ **CC BY 4.0 / ODbL** | 411★, sehr aktiv (2026-09) | Globale Admin-Grenzen; Türkei ADM1 (81 il) + ADM2 (ilçe) über API: `geoboundaries.org/api/current/gbOpen/TUR/ADM1|ADM2`; versionierte Releases | Referenz/Abgleich gegen türkische Quellen; saubere, zitierfähige Alternative mit API | **S** |
| **cihadturhan/tr-geojson** — [github.com/cihadturhan/tr-geojson](https://github.com/cihadturhan/tr-geojson) | ✅ **ODbL** (explizit im README; OSM-basiert) | älter (~2016er Datenstand), aber Provinzgeometrien stabil | `tr-cities-utf8.json`: 81 Provinz-Polygone, leichtgewichtig | Schnelle, kleine Provinz-Layer für UI-Karten (nicht für Terrain) | **S** |
| **izzetkalic/geojsons-of-turkey** — [github.com/izzetkalic/geojsons-of-turkey](https://github.com/izzetkalic/geojsons-of-turkey) | ⚠️ keine LICENSE-Datei im Repo; Daten stammen aus OSM/Overpass → faktisch ODbL | 65★, zuletzt 2026-09 | admin_level 2/4/6/8 als GeoJSON; Mahalle (lvl 8) lückenhaft; große Dateien via Google Drive; inkl. TKGM-Postman-Collection | OSM-Rohzugang + Dokumentation der Overpass-Queries (gut, um **aktuelle** Grenzen selbst zu ziehen) | **M** |
| **coskunomer/Turkish-Cities-Geojson-Dataset** — [github.com/coskunomer/Turkish-Cities-Geojson-Dataset](https://github.com/coskunomer/Turkish-Cities-Geojson-Dataset) | ✅ **MIT** (LICENSE geprüft) | 4★, 2025-08 | Städte + Countys GeoJSON, zusätzlich `turkey.topojson` (129 KB), React-/Python-Beispiele | TopoJSON direkt web-tauglich; kleine Datei für schnelles Rendering | **S** |
| **alpers/Turkey-Maps-GeoJSON** — [github.com/alpers/Turkey-Maps-GeoJSON](https://github.com/alpers/Turkey-Maps-GeoJSON) | ⚠️ keine Lizenzangabe | 79★, Datenstand 2017 | Provinz-Polygone + Flughäfen, Varianten mit KKTC/Zypern | Flughafen-Koordinaten als POI-Layer (Krise/Logistik) | **S** |
| **ozanyerli/istanbul-districts-geojson** — [github.com/ozanyerli/istanbul-districts-geojson](https://github.com/ozanyerli/istanbul-districts-geojson) | ⚠️ keine Lizenz; Quelle OSM | 17★, 2026-01 | Istanbul-İlçe-Polygone | Nur falls Istanbul-Detailkarte gewünscht | **S** |
| **bopen/elevation** — [github.com/bopen/elevation](https://github.com/bopen/elevation) | ✅ **Apache-2.0** (Upstreams beachten: SRTM public domain, Terrain Tiles offen) | 329★, aktiv (2026-09) | CLI/Python-Loader für SRTM 30 m/90 m DEM & AWS Terrain Tiles (Türkei abgedeckt) | Höhendaten für Terrain-Tiles der Three.js-Karte selbst erzeugen | **M** |
| **orcunkok/AWS-Dem-Downloader** — [github.com/orcunkok/AWS-Dem-Downloader](https://github.com/orcunkok/AWS-Dem-Downloader) | ⚠️ nicht im Detail geprüft (kleines Tool) | 8★, 2026-04 | Terrarium-PNG-Tiles von AWS Open Data (Mapzen Terrain Tiles), BBox/Zoom konfigurierbar | Alternative: direkter Terrain-RGB-Tile-Download ohne GDAL-Pipeline | **S/M** |

**Begleitende Nicht-GitHub-Quellen (im Repo-Kontext referenziert):**
- **HDX COD-AB Türkei** (`data.humdata.org/dataset/cod-ab-tur`, CC BY-IGO) — Quelle von ttezer; amtliche il/ilçe-Grenzen.
- **Geofabrik OSM-Export Türkei** (`download.geofabrik.de/europe/turkey.html`) — Straßen/Schienen/POI als PBF; ODbL. Für `provinz_infra.json`-Updates.
- **GADM 4.x Türkei** (`gadm.org`) — il/ilçe; **ACHTUNG: GADM verbietet kommerzielle Nutzung ohne Lizenz** — für unser Spiel NICHT direkt verwenden (nur Abgleich).
- **Overture Maps** (CDLA-Permissive) — globale Straßen/Schienen-Alternative zu reinem OSM.

---

## 2. Wahl- und Demokratiedaten (YSK, Umfragen, TÜİK)

| Repo | Lizenz | Aktivität | Daten & Aktualität | Nutzen für uns | Aufwand |
|---|---|---|---|---|---|
| **arikan/adilsecim-verileri** — [github.com/arikan/adilsecim-verileri](https://github.com/arikan/adilsecim-verileri) | ⚠️ keine LICENSE-Datei; Inhalt = amtliche Wahlergebnisse (Fakten) + Spiegel der Adil-Seçim-API; IPFS-Backup | 27★, Datenstand 2018 | **24.06.2018: CB + MV, il- UND ilçe-Ebene als JSON** (`veriler/`: cumhurbaskanligi-iller/-ilceler, genel-iller/-ilceler) | Sofort nutzbarer 2018-Baseline-Datensatz für Wahlmodul/Kalibrierung | **S** |
| **EmreYildiz448/turkey-elections-scraper** — [github.com/EmreYildiz448/turkey-elections-scraper](https://github.com/EmreYildiz448/turkey-elections-scraper) | ✅ **MIT** | 1★, aktiv 2026-06 | Scraper (Python/Selenium) für **Kommunalwahlen 2019 & 2024** von YSK-Açık-Veri + NTV; Output CSV/Excel je Wahlart (Belediye, İl Meclisi, Büyükşehir), Provinz geordnet; SEGE-2017/2022 als Zusatz | 2019/2024-Lokalwahlen maschinenlesbar — genau die fehlenden Jahre | **M** (Scrape-Lauf) |
| **cilekagaci/secimverisi** — [github.com/cilekagaci/secimverisi](https://github.com/cilekagaci/secimverisi) | ⚠️ keine Lizenz im Repo | 20★, Datenstand 2018 | **Eine CSV**: ilçe-Ebene für Genel 06/2015 + 11/2015, Referendum 2017, MV+CB 2018 (`genel25_26_referandum2017_27meclis_cb2018.csv`, 326 KB) + R-Code für Wählerwanderung (oy geçiş) | Wählerwanderungs-Kalibrierung 2015→2018 auf Bezirksebene | **S** |
| **mertnuhoglu/secim_verileri** — [github.com/mertnuhoglu/secim_verileri](https://github.com/mertnuhoglu/secim_verileri) | ⚠️ keine Lizenz; Quelle memurlar.net (Drittanbieter) | 11★, gepflegt bis 2026-09 | `genel_secim_oylar.csv` + `genel_secim_sandiklar.csv`: alle Genelwahlen ilçe-weise, Plaka-Codes | Langfristige Zeitreihe Genelwahlen für Parteistärken-Baseline | **S** |
| **ibahadirtarlaci/ysk** — [github.com/ibahadirtarlaci/ysk](https://github.com/ibahadirtarlaci/ysk) | ⚠️ keine Lizenz | 3★, 2026-05 | R-Funktionen + gescrapte YSK-Datensätze auf **Sandık (Wahlurnen)-Ebene** | Sandık-Ebene für Feinkalibrierung (falls wir unter ilçe gehen) | **M** |
| **keremciu/secim-veri-paylasimi** — [github.com/keremciu/secim-veri-paylasimi](https://github.com/keremciu/secim-veri-paylasimi) | ⚠️ keine Lizenz | 13★, 2026-03 | Oy ve Ötesi API-Spiegel: Städte/İlçe/Mahalle/Schul-Listen als JSON (`unique_school_list.json`) | YSK-Hierarchie (il→ilçe→mahalle→okul) als Stammdaten; Verknüpfung Geodaten↔Wahldaten | **S** |
| **mkozturk/secim2018** — [github.com/mkozturk/secim2018](https://github.com/mkozturk/secim2018) | ⚠️ keine Lizenz | 13★, 2025-07 | Nur Code (Selenium): lädt Sandık-Protokolle 2018 von sonuc.ysk.gov.tr | Nachbau-Rezept, falls amtliche Rohprotokolle gebraucht werden | **M/L** |

**Umfragen & TÜİK-Mirror — Lücken mit Workaround:**
- **Umfrage-Aggregator existiert auf GitHub nicht.** Bester maschinenlesbarer Weg: tr.wikipedia-Tabellen „…2023 Türkiye genel seçimleri için yapılan anketler" (komplette Ankettabellen 2019–2023 je Partei/Institut, Inhalt CC BY-SA) via Wikimedia-API; Alternativ-Archiv: politpro.eu/tr/turkiye (Jahresarchive). Aufwand **M**, kein GitHub-Repo nötig.
- **TÜİK:** siehe Kategorie 3 (orhoncan/tuik-mcp, emraher/tuikr) — das ist der praktikable „TÜİK-Mirror".
- **ViralLab/Secim2023_Dataset** (30★): bewusst verworfen — Twitter/X-Datensatz (nur Tweet-IDs, ToS-limitiert), keine Wahlergebnisse.

---

## 3. Wirtschaftszeitreihen (TCMB/EVDS, Inflation, Kurs, CDS, ENAG, Migration)

| Repo | Lizenz | Aktivität | Daten & Aktualität | Nutzen für uns | Aufwand |
|---|---|---|---|---|---|
| **fatihmete/evds** — [github.com/fatihmete/evds](https://github.com/fatihmete/evds) | ✅ **MIT** (LICENCE-Datei geprüft) | 62★, aktiv 2026-09 | `pip install evds`; kompletter EVDS-Zugang (Kategorien→Datagruppen→Serien), Frequenz-/Formel-/Aggregationsparameter; kostenloser API-Key auf evds3.tcmb.gov.tr | **Kernquelle Kalibrierung Lernfälle 2019/2021/2023**: TÜFE (`TP.FG.J0`), USD/TRY (`TP.DK.USD.A.YTL`), Politikzinssätze, Reserven, CDS-nahe Risikoindikatoren — historisch komplett | **S** |
| **kaymal/tcmb-py** — [github.com/kaymal/tcmb-py](https://github.com/kaymal/tcmb-py) | ✅ **MIT** (Badge+LICENSE) | 17★, aktiv 2026-09 | `pip install tcmb`; moderner EVDS-Client mit **Wildcard-Serienabfrage** (`TP.DK.USD.*.YTL`), Metadaten-API | Sauberere Alternative zu evds; ideal zum Bau unseres statischen Datenabzugs | **S** |
| **SermetPekin/evdspy-repo** — [github.com/SermetPekin/evdspy-repo](https://github.com/SermetPekin/evdspy-repo) | ✅ **MIT** (Disclaimer im README) | 8★, aktiv 2026-09 | `pip install evdspy`; Caching, Excel-Export, Datagruppen-Kurznamen (`bie_tukfiy4` = TÜFE); Beispiele mit Inflationserwartungen (`TP.ENFBEK.*`) | Bulk-Download ganzer Seriengruppen für unseren Data-Snapshot | **S** |
| **orhoncan/evds-mcp** — [github.com/orhoncan/evds-mcp](https://github.com/orhoncan/evds-mcp) | ✅ **MIT** | 2★, aktiv 2026-08 | MCP-Server für EVDS; **Bonus: `data/series.csv` mit 52 595 Serien + `datagroups.csv` (671 Gruppen) als statischer Katalog** | Der Serien-Katalog allein ist Gold wert (Offline-Suche nach Seriencodes); MCP optional für Agenten-Workflows | **S** |
| **orhoncan/tuik-mcp** — [github.com/orhoncan/tuik-mcp](https://github.com/orhoncan/tuik-mcp) | ✅ **MIT** | 15★, sehr aktiv 2026-09 | TÜİK **SDMX REST**: 431 Dataflows (Nüfus, İşgücü, TÜFE, Dış Ticaret, Sanayi…); `data/dataflows.csv` als Katalog; API-Key über TÜİK-Veriportalı (SMS-Verifizierung) | **Provinz-Detaildaten** aus TÜİK (soweit SDMX Kırılım zulässt) + offizielle Inflationsreihen | **M** |
| **emraher/tuikr** — [github.com/emraher/tuikr](https://github.com/emraher/tuikr) | ⚠️ keine LICENSE-Datei gefunden (Zenodo-DOI vorhanden; „academic research"-Disclaimer) | 12★, aktiv 2026-08 | R-Paket: TÜİK-Statistikportal **und** CIP-Geoportal: `geo_map(level=3)` = 81 Provinzen, `level=4` = **973 ilçe** als sf/WGS84; `geo_data()` mit 80 Provinz-Variablen (inkl. **SEGE-Scores `ses123`**, Elektrikverbrauch, Bildung) | Kombiniert Provinz-Statistik + Grenzen aus amtlicher Quelle — starker Kandidat für Provinz-Detaildaten | **M** |
| **PopulationStatistics/refugees** — [github.com/PopulationStatistics/refugees](https://github.com/PopulationStatistics/refugees) | ✅ **CC BY 4.0** | CRAN-Paket, gepflegt (UNHCR-Team) | UNHCR Refugee Data Finder: `population` (1951→heute, Herkunfts-/Asylland), Demografie, Asylanträge; Türkei als Gastland Syrien voll abgedeckt | Migrationsmodul: syrische Flüchtlinge pro Jahr; ergänzend UNHCR-API (kein Key nötig) für subnationale Daten | **S** |
| **dbnomics/rdbnomics** (+ Python-Mirror **ceschi/dbnomics-python-client**) — [github.com/dbnomics/rdbnomics](https://github.com/dbnomics/rdbnomics) | ✅ AGPL-3.0 (Client-Code; Daten = Quellenlizenzen, IWF/WEO & Weltbank frei) | 36★, aktiv | DBnomics aggregiert IWF WEO, Weltbank WDI, OECD u.a. als Zeitreihen-API | BIP, Arbeitslosigkeit, WEO-Prognosen als Rahmendaten; KEIN TCMB/EVDS in DBnomics | **S** |
| **mesdi/blog** — [github.com/mesdi/blog](https://github.com/mesdi/blog) | ⚠️ keine Lizenz; Daten vermutlich von investing.com (ToS!) — nur als Referenz/Abgleich | Daten-Repo eines türkischen Ökonomen | Enthält u.a. `cds.csv` (**Türkei 5Y CDS**), `usdtry.csv`, `fedfunds.csv`, `interest.csv`, `tcmb_funds.csv`, `housing_all.csv` | Einziger auf GitHub gefundener CDS-Zeitreihen-Abzug → zum Abgleich, NICHT zum Ausliefern | **S** |

**CDS / ENAG — Lücken mit Workaround:**
- **CDS 5Y Türkei:** keine freie GitHub-Datenquelle. Praktikabel: **worldgovernmentbonds.com/cds-historical-data/turkey/5-years** (historische Tabelle, Scraping-ToS beachten), **MacroMicro** (wöchentliche CSV, Account), investing.com (explizit redistribution-verboten ❌). Empfehlung: Werte als wenige hundert Stützstellen manuell/halbautomatisch kuratieren (Fakten, keine Datenbank-Kopie).
- **ENAG (E-TÜFE):** keine API, kein Repo gefunden — monatliche Pressemitteilungen/Tweets. Empfehlung: kleine eigene CSV (Monat, aylık, yıllık) ab 2020 pflegen (~70 Zeilen, **S**).

---

## 4. Katastrophen-, Risiko-, Infrastrukturdaten

| Repo | Lizenz | Aktivität | Daten & Aktualität | Nutzen für uns | Aufwand |
|---|---|---|---|---|---|
| **cossatot/gem-global-active-faults** — [github.com/cossatot/gem-global-active-faults](https://github.com/cossatot/gem-global-active-faults) | ✅ **CC BY-SA 4.0** (ShareAlike beachten: abgeleitete Datenlayer ebenfalls CC BY-SA) | 51★, aktiv 2026-04 | GEM Global Active Faults DB: alle aktiven Verwerfungen als GeoJSON/GeoPackage/KML/SHP mit Slip-Rate, Kinematik, letztes Beben; Türkei via EMME/SHARE-Teildatensätzen (KAF, DAF, Batı Anadolu) peer-reviewed | **AFAD-Risikokarten-Ersatz**: Fay-Layer für Erdbeben-Risiko pro Provinz + Glaubwürdigkeit der Ereignis-Engine | **S** |
| **wri/global-power-plant-database** — [github.com/wri/global-power-plant-database](https://github.com/wri/global-power-plant-database) | ✅ Daten **CC BY 4.0**, Code MIT | 379★, ⚠️ wird seit 2022 nicht mehr gepflegt (v1.3.0) | ~35 000 Kraftwerke weltweit als CSV (Name, MW, Fuel, lat/lon, Eigentümer); Türkei-Teilmenge vorhanden; Datenstand ~2019–2021 | Energie-Infrastruktur-Layer (Kraftwerke pro Provinz) | **S** |
| **open-energy-transition/global_energy_monitor_power_tracker** — [github.com/open-energy-transition/global_energy_monitor_power_tracker](https://github.com/open-energy-transition/global_energy_monitor_power_tracker) | ✅ **CC0 1.0** (LICENSE geprüft) | 1★, 2026-03 | Spiegel der **Global Energy Monitor „Global Integrated Power Tracker", Stand Feb-2025** als XLSX (24 MB): Kraftwerke inkl. Pipeline/Status, viel aktueller als WRI | Aktueller Kraftwerksbestand + Projektpipeline (Ereignis-Futter: „neues Kohlekraftwerk") | **S** |
| **emirkabal/deprem-api** — [github.com/emirkabal/deprem-api](https://github.com/emirkabal/deprem-api) | ✅ **MIT** (Code; Datenquelle AFAD/Kandilli beachten) | 32★, aktiv 2026-05 | Parser AFAD + Kandilli → JSON (Live/Archiv-Endpunkte, Vercel-Demo) | Bau eines eigenen AFAD-Feeds für dynamische Beben-Ereignisse im Spiel | **M** |
| **lterlemez/AFAD_Package** — [github.com/lterlemez/AFAD_Package](https://github.com/lterlemez/AFAD_Package) | ⚠️ keine Lizenz | 2★, 2026-09 | R-Paket für AFAD-Event-Webservice (Katalog, Filter, Haversine, Gazetteer TR); peer-reviewed (TDAD 2024) | Referenz für AFAD-API-Schema; ⚠️ AFAD-Dienst liefert laut Autor aktuell nur die **letzten 5 Tage** | **M** |
| **orhanayd/kandilli-rasathanesi-api** — [github.com/orhanayd/kandilli-rasathanesi-api](https://github.com/orhanayd/kandilli-rasathanesi-api) | ❌/⚠️ **Custom: kommerzielle Nutzung nur mit schriftlicher Genehmigung**; Kandilli-Daten ohnehin nicht-kommerziell | 178★, sehr aktiv 2026-08 | Beste türkische Erdbeben-API (AFAD+Kandilli kombiniert, GeoJSON, Städte-/Flughafen-Anreicherung, Swagger) | Für Entwicklung/Prototyping klasse; **nicht als Datenquelle im verkauften Spiel** — stattdessen AFAD direkt (emirkabal/deprem-api) | **S** (aber Lizenzrisiko) |

**Lücken (kein taugliches GitHub-Repo, beste Wege):**
- **AFAD Türkiye Deprem Tehlike Haritası (TDTH):** nur über `tdth.afad.gov.tr` mit **e-Devlet-Login**; keine offene Datei. Praktikabel: GEM-GAF (oben) + Provinz-Grobrasterung aus den öffentlich dokumentierten Riskgruppen; historischer Katalog alternativ via USGS/EMSC (offen).
- **Dämme/Stauseen:** **Global Dam Tracker (GDAT)** (Paper PMC9950439; Daten via globaldamwatch.org/Figshare, CC BY) enthält Türkei aus DSİ (>600 Dämme, georeferenziert). Kein aktives GitHub-Repo. Ergänzend OSM (`water=reservoir`, `landuse=reservoir`) aus Geofabrik-Export.
- **Pipelines/Netze:** GEM-Tracker (oben) + OSM (`man_made=pipeline`); kein eigenes taugliches Repo gefunden.

---

## 5. Militär-/Konfliktdaten

| Repo | Lizenz | Aktivität | Daten & Aktualität | Nutzen für uns | Aufwand |
|---|---|---|---|---|---|
| **dtacled/acledR** — [github.com/dtacled/acledR](https://github.com/dtacled/acledR) | ⚠️ Code frei (CRAN), **ACLED-Daten: Registrierung (myACLED), kostenlos für Forschung; kommerzielle Nutzung lizenzpflichtig** | 10★, offiziell von ACLED, aktiv 2026-06 | ACLED-API: Konflikt-/Protest-Events geocodiert (Türkei + Syrien-Grenzraum), wöchentlich aktualisiert | Ereignis-Kalibrierung (Proteste, Grenzzwischenfälle 2019–2023) — **vor kommerzieller Verwendung ACLED-Lizenz klären** | **M** |
| **chris-dworschak/acled.api** — [github.com/chris-dworschak/acled.api](https://github.com/chris-dworschak/acled.api) | ❌ Package **CC BY-NC 4.0** (Dev auf GitLab) | 10★, stable, CRAN | ACLED-API-Wrapper (R) | Nur Referenz; wegen NC-Lizenz nicht im Spiel nutzen | — |
| **datapumpernickel/milRex** — [github.com/datapumpernickel/milRex](https://github.com/datapumpernickel/milRex) | ⚠️ Code frei; **SIPRI-Copyright: Weiterverbreitung nur nicht-kommerziell bzw. <10 % eines Datensatzes** (im README dokumentiert) | 2★, 2025-02 | SIPRI Milex via POST auf sipri.org → tidy DataFrames (konst./lauf. USD, %BIP, %Staatsausgaben, pro Kopf), aktuell bis 2024 | Türkei-Militärausgaben-Zeitreihe für Haushaltsmodul abziehen; **nicht mit dem Spiel ausliefern** | **S/M** |
| **datapumpernickel/Rat.db** — [github.com/datapumpernickel/Rat.db](https://github.com/datapumpernickel/Rat.db) | ⚠️ wie oben (SIPRI-Beschränkung) | 0★, 2026-03, „under construction" | SIPRI Arms Transfer Database (TIV, Register) als R-Client mit Cache | Rüstungsimport/-export Türkei (S-400, Bayraktar-Exporte) als Ereignis-/Statistik-Kontext | **M** |
| **benryan58/sipri_arms** — [github.com/benryan58/sipri_arms](https://github.com/benryan58/sipri_arms) | ⚠️ keine Lizenz; SIPRI-Beschränkung gilt | 5★, 2026-06 | Python-Wrapper auf SIPRI-Export-Endpunkte (CSV/JSON, Trade Register + TIV) | Dasselbe für Python-Pipeline | **M** |

**Anmerkung:** IISS Military Balance hat keinerlei offenen Zugang (Paywall) — nichts auf GitHub, keine Empfehlung möglich.

---

## 6. Presse / Medien / Justiz / Demokratie-Indizes

| Repo | Lizenz | Aktivität | Daten & Aktualität | Nutzen für uns | Aufwand |
|---|---|---|---|---|---|
| **vdeminstitute/vdemdata** — [github.com/vdeminstitute/vdemdata](https://github.com/vdeminstitute/vdemdata) | ✅ Paket open source; V-Dem-Daten: frei mit Zitation (V-Dem Terms; kommerzielle Verwendung der Rohwerte unseres Erachtens unkritisch, aber Terms prüfen) | 170★, offiziell, sehr aktiv (v16, 2026) | Kompletter V-Dem Country-Year-Datensatz (31 Mio.+ Datenpunkte) + V-Party; Türkei-Zeitreihen für Polyarchie, Pressefreiheit, Justiz, Korruption 1789–heute | **Demokratie-/Institutionen-Meter** des Spiels + Kalibrierung 2018–2023 | **S** (R-Paket; CSV-Export) |
| **petzi53/pressfreedom.data** — [github.com/petzi53/pressfreedom.data](https://github.com/petzi53/pressfreedom.data) | ✅ **MIT** (Paket); Quelldaten RSF mit Quellenangabe nutzen | aktiv (2026), CRAN-Spiegel existiert | `rwb_standardized`: RSF-Pressefreiheit-Index **2002–2026**, 191 Länder, Score+Rang (Methodenbruch 2013 beachten, Dimensionen ab 2022) | Pressefreiheit-Indikator Türkei, Vergleichswerte | **S** |
| **victorhartman/CPI-CSV-dataset** — [github.com/victorhartman/CPI-CSV-dataset](https://github.com/victorhartman/CPI-CSV-dataset) | ⚠️ keine Lizenz; **TI-CPI steht unter CC BY-ND 4.0 (keine Derivate!)** | 0★, 2024-01 | CPI-Zeitreihe als bereinigte CSV (ISO3-Fix) | Korruptions-Indikator; wegen ND-Klausel nur Werte als Fakten mit Zitierung verwenden, keinen Datensatz einbetten | **S** |
| **UlmApi/echr-scraping** — [github.com/UlmApi/echr-scraping](https://github.com/UlmApi/echr-scraping) | ⚠️ keine Lizenz | 8★, alt (2016er Kern) | HUDOC-Scraper (Urteile als JSON) | Referenz, wie HUDOC abgegriffen wird; HUDOC hat inzwischen eigene API (`hudoc.echr.coe.int/app/query`) — direkt nutzen | **M** |
| **lszoszk/ECHR-Dashboard** — [github.com/lszoszk/ECHR-Dashboard](https://github.com/lszoszk/ECHR-Dashboard) | ❌ **PolyForm Noncommercial** (Code); Urteile © Europarat | aktiv 2026-08, Zenodo-DOI | 20 010 EGMR-Urteile, 3,3 Mio. Absatz-Segmente, Harvest-Pipeline | Methodisch stark, aber NC-lizenziert → nur als Blaupause ansehen, nichts übernehmen | — |
| **xmarquez/vdem** — [github.com/xmarquez/vdem](https://github.com/xmarquez/vdem) | ⚠️ (Datenstand v11.1) | 24★, veraltet | V-Dem 11.1 eingebettet | **Verworfen: ersetzt durch vdemdata (v16)** | — |

---

## 🏆 Top-12-Gesamtliste (Nutzen ÷ Aufwand)

| # | Repo | Warum | Aufwand |
|---|---|---|---|
| 1 | **uyasarkocal/borders-of-turkey** | CC0, fertige il+ilçe-GeoJSONs — sofort in die Karte | S |
| 2 | **fatihmete/evds** (oder kaymal/tcmb-py) | Gesamte türkische Makro-Historie (Inflation/Zins/Kurs) für Lernfälle 2019/2021/2023, MIT | S |
| 3 | **ttezer/turkiye-harita-verisi** | il/ilçe/mahalle, Multi-Format, gepflegte Pipeline, saubere Quellenlage (HDX) | S/M |
| 4 | **arikan/adilsecim-verileri** | 2018-Wahl il+ilçe fertig als JSON | S |
| 5 | **cossatot/gem-global-active-faults** | Peer-reviewte Fay-Geometrien (KAF/DAF/BAF) als GeoJSON → Risiko-Engine | S |
| 6 | **orhoncan/tuik-mcp** | TÜİK-SDMX (431 Dataflows) + Dataflow-Katalog → Provinz-Detaildaten | M |
| 7 | **EmreYildiz448/turkey-elections-scraper** | 2019+2024 Kommunalwahlen als CSV, MIT | M |
| 8 | **emraher/tuikr** | TÜİK-Provinzstatistiken (inkl. SEGE) + Grenzen 81/973 aus einer Hand | M |
| 9 | **cilekagaci/secimverisi** | 2015/2017/2018 ilçe-Ebene in einer CSV → Wählerwanderung | S |
| 10 | **PopulationStatistics/refugees** | UNHCR-Flucht-/Migrationsreihen (Syrien→Türkei), CC BY 4.0 | S |
| 11 | **open-energy-transition/global_energy_monitor_power_tracker** + **wri/global-power-plant-database** | Energie-Infrastruktur Layer: aktuell (GEM 02/2025, CC0) + Referenz (WRI, CC BY) | S |
| 12 | **vdeminstitute/vdemdata** | Institutionen-/Demokratie-Kalibrierung Türkei (offiziell, v16) | S |

---

## ❌ Bewusst verworfen (gefunden, aber untauglich)

| Repo | Grund |
|---|---|
| **ViralLab/Secim2023_Dataset** | Nur Twitter/X-Tweet-IDs zu #Secim2023, keine Wahlergebnisse; Rehydration nach API-Paywall praktisch tot |
| **acikyazilimagi/deprem-yardim-\*** (877★/375★ u.a.) | Krisen-Apps vom Feb-2023-Beben (Code, keine wiederverwendbaren Datensätze); Backend teils archiviert |
| **orhanayd/kandilli-rasathanesi-api** | Inhaltlich top, aber Lizenz: kommerzielle Nutzung nur mit schriftlicher Genehmigung; Kandilli-Daten nicht-kommerziell → nicht auslieferbar |
| **lszoszk/ECHR-Dashboard** | PolyForm-Noncommercial-Lizenz → für kommerzielles Spiel ungeeignet (nur Methodik-Referenz) |
| **chris-dworschak/acled.api** | Paket CC BY-NC 4.0 → NC; offizielles acledR ist der bessere Weg (Datenlizenz ohnehin klären) |
| **xmarquez/vdem** | Eingefrorenes V-Dem v11.1 — durch vdemdata (v16) ersetzt |
| **teknomavi/tcmb, tayfunulu/DovizKurlari, alisabrigok/tcmb-exchange-rates, lab2023/tcmb_currency** | Nur TCMB-Tageskurs-XML (keine Historie/EVDS), teils uralt/archiviert |
| **oztalha/YSK** | Nur 2014 Kommunalwahl; Scraper passt nicht mehr zum aktuellen YSK-Portal |
| **utkucivelek/YSKSecimSonuclari2015** | 1★, nur 2015, durch arikan/cilekagaci abgedeckt |
| **lterlemez/AFAD_Package** | Wichtiger Hinweis im README: AFAD-Event-Service liefert nur noch die letzten 5 Tage → kein historischer Katalog mehr über diesen Weg |
| **muslumyalcin-git/enflasyon-matrix** | Mini-Rechner (TÜİK/İTO/ENAG hart codiert), keine Datenquelle |
| **GADM (kein Repo, aber relevant)** | Lizenz verbietet kommerzielle Nutzung ohne gesonderte Vereinbarung → durch HDX/geoBoundaries/OSM ersetzt |
| **dopplerDistortion/turkey-geojson, roleonly/turkey-geojson, aligngl/TurkeyAutoMap, aligngl/TurkeyThesisMap, Madkhix/tr_light-pollution, Nora-Research-Lab/gem-global-active-faults** | Nicht README-geprüft bzw. Duplikate/Forks kleinerer Qualität — keine Empfehlung ohne Sichtung |
| **Enesp4rl4k/bist-trader-mcp, parttimegod/evds-mcp, denizcakiroglu322/evds-mcp-server** | Redundante EVDS-MCP-Varianten (0–7★); orhoncan/evds-mcp deckt ab |

---

## Verbleibende Lücken (außerhalb GitHub zu schließen)

1. **CDS 5Y Türkei (historisch):** worldgovernmentbonds.com (Tabelle) / MacroMicro (wöchentliche CSV); investing.com ❌ (Redistribution verboten). Empfehlung: kuratierte Stützstellen-CSV selbst pflegen. Einziger GitHub-Fund: `mesdi/blog/cds.csv` (Lizenz/Provenienz unklar — nur Abgleich).
2. **ENAG E-TÜFE:** keine API/kein Repo — monatliche Meldungen manuell in eigene CSV.
3. **Wahlumfragen:** Wikipedia-Ankettabellen (CC BY-SA) via Wikimedia-API scrapen; PolitPro-Archiv als Quervergleich.
4. **AFAD TDTH-Gefährdungskarte:** e-Devlet-Login; Ersatz: GEM-GAF + USGS/EMSC-Kataloge.
5. **Dämme:** GDAT/Global Dam Watch (CC BY, Figshare) + OSM-Reservoirs.
6. **Historischer Erdbebenkatalog (vor 5 Tagen):** USGS/EMSC fdsn-Webservices (offen, global) statt AFAD.
7. **IISS Military Balance:** keine offene Quelle — SIPRI Milex als einzige belastbare Reihe (Nutzungsbeschränkung beachten: extrahieren ja, einbetten nein).
