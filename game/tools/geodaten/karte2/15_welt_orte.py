"""Schritt 15: Regierungssitze der Weltakteure außerhalb des Ausschnitts als Hauptstadt-Einträge in orte.json.

Die Namen sind die deutschen Namen der Regierungssitze aus dem Spiel selbst (src/data/welt-daten.ts und welt-weitere.ts, Feld `sitz`);
die Koordinaten stammen aus Natural Earth 10m Populated Places (gemeinfrei). Orte innerhalb des Ausschnitts (Athen, Damaskus, Bagdad, Baku, Eriwan, Tiflis,
Jerusalem, Nikosia, Sofia, Bukarest) stehen schon in orte.json (Schritt 11).
Aufruf: python3 15_welt_orte.py <Ordner mit ne_10m_populated_places_simple.geojson> <orte.json>
"""
import json
import sys

# (Kennung des Landes im Kartendatensatz, deutscher Name des Sitzes, Name in Natural Earth, ADM0-Kürzel in Natural Earth)
SITZE = [
    ("USA", "Washington", "Washington,  D.C.", "USA"), ("BEL", "Brüssel", "Brussels", "BEL"), ("RUS", "Moskau", "Moscow", "RUS"),
    ("IRN", "Teheran", "Tehran", "IRN"), ("SAU", "Riad", "Riyadh", "SAU"), ("CHN", "Peking", "Beijing", "CHN"),
    ("UKR", "Kiew", "Kyiv", "UKR"), ("LBY", "Tripolis", "Tripoli", "LBY"), ("KAZ", "Astana", "Nur-Sultan", "KAZ"),
    ("EGY", "Kairo", "Cairo", "EGY"), ("DEU", "Berlin", "Berlin", "DEU"), ("FRA", "Paris", "Paris", "FRA"),
    ("ITA", "Rom", "Rome", "ITA"), ("ESP", "Madrid", "Madrid", "ESP"), ("POL", "Warschau", "Warsaw", "POL"),
    ("NLD", "Den Haag", "The Hague", "NLD"), ("HUN", "Budapest", "Budapest", "HUN"), ("AUT", "Wien", "Vienna", "AUT"),
    ("SWE", "Stockholm", "Stockholm", "SWE"), ("BRA", "Brasília", "Brasília", "BRA"), ("IND", "Neu-Delhi", "New Delhi", "IND"),
    ("ZAF", "Pretoria", "Pretoria", "ZAF"), ("ETH", "Addis Abeba", "Addis Ababa", "ETH"), ("ARE", "Abu Dhabi", "Abu Dhabi", "ARE"),
    ("IDN", "Jakarta", "Jakarta", "IDN"), ("QAT", "Doha", "Doha", "QAT"), ("GBR", "London", "London", "GBR"),
    ("PAK", "Islamabad", "Islamabad", "PAK"), ("UZB", "Taschkent", "Tashkent", "UZB"), ("KGZ", "Bischkek", "Bishkek", "KGZ"),
    ("TKM", "Aschgabat", "Ashgabat", "TKM"),
]
orte_dir, orte_datei = sys.argv[1], sys.argv[2]
ne = json.load(open(f"{orte_dir}/ne_10m_populated_places_simple.geojson"))["features"]
gefunden = {}
for f in ne:
    p = f["properties"]
    schluessel = (p["name"], p["adm0_a3"])
    if schluessel in {(s[2], s[3]) for s in SITZE} and p["featurecla"].startswith("Admin-0 capital"):
        gefunden[schluessel] = (f["geometry"]["coordinates"], p["pop_max"])
d = json.load(open(orte_datei))
vorhanden = {o["n"] for o in d["orte"]}
neu = 0
for iso, name, ne_name, adm in SITZE:
    if (ne_name, adm) not in gefunden:
        print("fehlt in Natural Earth:", ne_name, adm)
        continue
    if name in vorhanden:
        continue
    (lon, lat), pop = gefunden[(ne_name, adm)]
    d["orte"].append({"n": name, "lon": round(lon, 3), "lat": round(lat, 3), "pop": int(pop), "k": "h", "mz": 24, "l": iso})
    neu += 1
json.dump(d, open(orte_datei, "w"), ensure_ascii=False, separators=(",", ":"))
print("neue Hauptstädte:", neu, "insgesamt Orte:", len(d["orte"]))
