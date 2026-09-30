# Karte 2: Landzerlegung, Küsten-Distanzfeld, Namen

Diese Skripte erzeugen alles unter `public/data/karte/`. Sie laufen in einem beliebigen Arbeitsordner, in dem die Rohdaten liegen
(Zwischenergebnisse sind Pickle-Dateien, die die Skripte selbst schreiben und wieder lesen; sie stammen nie aus fremder Quelle).

| Schritt | Skript | Eingabe | Ausgabe |
|---|---|---|---|
| 1 | `01_land_osm.py` | OSM-Landpolygone (`land-polygons-complete-4326.zip`, https://osmdata.openstreetmap.de/data/land-polygons.html, ODbL) | `land_full.pkl` |
| 2 | `02_provinzen.py` | geoBoundaries gbOpen TUR ADM1 (`tur_adm1.geojson`, CC BY 4.0, aus OSM), `land_full.pkl` | `prov_neu.pkl` |
| 3 | `03_laender.py` | Natural Earth 10m Länder (`ne_10m_admin_0_countries.geojson`, gemeinfrei) | `zellen_vor.pkl` |
| 4 | `04_luecken.py` | – | `zellen.pkl` (81 Provinzen und 30 Länder, lückenlos und überlappungsfrei) |
| 5 | `05_bezirke.py` | geoBoundaries ADM2 (`tur_adm2.geojson`), frühere Kennzahlen `public/data/osm/bezirke.json` | `bezirke_zellen.pkl`, `bezirke_info.json` |
| 6 | `06_bogen.py` | – | gemeinsame Grenzbögen, drei Detailstufen (`bogen_L0..2.pkl`, `bogen_B1..2.pkl`) |
| 7 | `07_ausgabe.py` | – | `karte.json`, `karte-L0..2.bin` |
| 8 | `08_bezirke_ausgabe.py` | – | `bezirke.json`, `karte-B1..2.bin` |
| 9 | `09_kuestenfeld.py` | `zellen.pkl`, `relief-z8.json` | `kueste-sdf.bin.gz`, `kueste-sdf.json` |
| 10 | `10_orte_osm.py` | OSM-Auszug Türkei (`turkey.osm.pbf`, Geofabrik, ODbL) | `osm_orte.json` |
| 11 | `11_orte.py` | `osm_orte.json`, Natural Earth Orte, Seen, Flüsse | `orte.json` |
| 12 | `12_wasser.py` | Natural Earth Flüsse und Seen (`ne_10m_rivers_lake_centerlines`, `ne_10m_rivers_europe`, `ne_10m_lakes`, `ne_10m_lakes_europe`) | `wasser.json` |

Die Schritte 1 bis 2 sind im Kopf der jeweiligen Datei beschrieben; Schritt 1 lädt keine Daten, die Zip-Datei wird vorher von Hand geholt.
Voraussetzungen: `pip install shapely numpy scipy pillow pyshp osmium`.

Dateiformat der `.bin`-Dateien (Int32, little-endian): Kopf `[0x4B32, 1, Anzahl Flächen, Anzahl Bögen]`, dann je Fläche `[Besitzer, Anzahl Ringe]` und je Ring
`[Punktzahl, (Länge·1e5, Breite·1e5) …]` (offen, ohne Wiederholung des ersten Punktes; erster Ring außen, weitere sind Löcher), dann je Bogen `[Typ, Punktzahl, Paare …]`.
Bogentypen: 0 Küste der Türkei, 2 Provinzgrenze, 3 Regionsgrenze, 4 Landesgrenze der Türkei, 5 Grenze zwischen anderen Ländern, 6 Bezirksgrenze.
Besitzer in `karte-L*.bin`: Index in `karte.json` → `besitzer` (0–80 Provinzen, dann Länder, zuletzt der Sammelbesitzer „Türkei“); in `karte-B*.bin`: Bezirksindex in `bezirke.json`.

Detailstufen: L0 Toleranz 0,008° (bis 60 Bildpunkte je Längengrad), L1 0,0025° (bis 200), L2 0,0007°; Bezirke B1 und B2 wie L1 und L2.
Alle Grenzen werden aus einem gemeinsamen Netz von Bögen einmal vereinfacht, deshalb schließen Nachbarn ohne Lücke aneinander;
`test/karte.test.ts` prüft Überlappungsfreiheit, bekannte Orte und das Distanzfeld.
