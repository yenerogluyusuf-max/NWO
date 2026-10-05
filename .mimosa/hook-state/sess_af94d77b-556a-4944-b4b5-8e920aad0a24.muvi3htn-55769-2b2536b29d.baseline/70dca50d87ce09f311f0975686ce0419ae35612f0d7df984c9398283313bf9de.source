"""Schritt 11: Orte, Gipfel, Meere, Gebirge, Inseln, Seen und Flüsse mit Namen -> public/data/karte/orte.json
Quellen: OpenStreetMap (ODbL) für türkische Städte und Gipfel, Natural Earth 10m (gemeinfrei) für Orte der Nachbarländer, Seen, Flüsse.
Namen deutsch, soweit ein deutscher Name üblich ist; türkische Orte in türkischer Schreibung.
"""
# Projektordner (game/): zwei Ebenen über tools/geodaten/karte2/
import os as _os
GAME = _os.environ.get("KARTE_GAME") or _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", "..", ".."))
import json, math, os
from shapely.geometry import shape, box, Point, LineString, MultiLineString
from shapely.ops import linemerge

BOX = box(19.5, 31.0, 50.5, 46.0)
IN = lambda lon, lat: 19.6 <= lon <= 50.4 and 31.1 <= lat <= 45.9

DE = {
    "Athens": "Athen", "Piraeus": "Piräus", "Patra": "Patras", "Iraklio": "Heraklion", "Larissa": "Larisa", "Ioanina": "Ioannina",
    "Hania": "Chania", "Rodos": "Rhodos", "Kerkira": "Korfu", "Mitilini": "Mytilini", "Hios": "Chios", "Komatini": "Komotini",
    "Seres": "Serres", "Bucharest": "Bukarest", "Constanța": "Konstanza", "Timișoara": "Temeswar", "Brașov": "Kronstadt", "Galați": "Galatz",
    "Plovdiv": "Plowdiw", "Varna": "Warna", "Ruse": "Russe", "Belgrade": "Belgrad", "Niš": "Niš", "Shkodër": "Shkodra", "Tbilisi": "Tiflis",
    "Sukhumi": "Sochumi", "Yerevan": "Eriwan", "Gyumri": "Gjumri", "Ganca": "Gändscha", "Naxcivan": "Nachitschewan",
    "Ṭarābulus": "Tripoli", "Saida": "Sidon", "Bur Said": "Port Said", "El Mansura": "Mansura", "Dumyat": "Damiette", "Rashid": "Rosette",
    "El Arish": "Al-Arisch", "Matruh": "Marsa Matruh", "Banghazi": "Bengasi", "Tubruq": "Tobruk", "Darnah": "Derna",
    "Baghdad": "Bagdad", "Mosul": "Mossul", "Irbil": "Erbil", "As Sulaymaniyah": "Sulaimaniya", "Najaf": "Nadschaf", "Al Hillah": "Hilla",
    "Karbala": "Kerbela", "An Nasiriyah": "Nasiriyya", "Ad Diwaniyah": "Diwaniyya", "Al Amarah": "Amara", "Al Kut": "Kut", "Baqubah": "Baquba",
    "Ar Ramadi": "Ramadi", "Al Fallujah": "Falludscha", "Duhok": "Dohuk", "Zakho": "Zaxo", "Damascus": "Damaskus", "Douma": "Duma", "Hamah": "Hama",
    "Dayr az Zawr": "Deir ez-Zor", "Ar Raqqah": "Rakka", "Dar'a": "Daraa", "Al Hasakah": "Hasaka", "Al Qamishli": "Qamischli",
    "Madinat ath Thawrah": "Tabqa", "As Suwayda": "Suweida", "Tadmur": "Palmyra", "Tabriz": "Täbris", "Kermanshah": "Kermanschah",
    "Rasht": "Rascht", "Ahvaz": "Ahwas", "Sevastopol": "Sewastopol", "Kerch": "Kertsch", "Yalta": "Jalta", "Sochi": "Sotschi",
    "Makhachkala": "Machatschkala", "Grozny": "Grosny", "Vladikavkaz": "Wladikawkas", "Novorossiysk": "Noworossijsk", "Nalchik": "Naltschik",
    "Yevpatoriya": "Jewpatorija", "Pyatigorsk": "Pjatigorsk", "Maykop": "Maikop", "Nicosia": "Nikosia", "Lemosos": "Limassol", "Larnaka": "Larnaka",
    "Kyrenia": "Kyrenia", "Famagusta": "Famagusta", "Pristina": "Pristina", "Jerusalem": "Jerusalem", "Tel Aviv": "Tel Aviv",
    "Al Khalil": "Hebron", "Gaza City": "Gaza", "Az Zarqa": "Zarqa", "Irbid": "Irbid", "Alexandria": "Alexandria",
}

pp = json.load(open("ne_10m_populated_places_simple.geojson"))["features"]
orte = []
def rang_mz(pop, hauptstadt):
    if hauptstadt: return 38
    if pop >= 1_000_000: return 55
    if pop >= 500_000: return 85
    if pop >= 250_000: return 120
    if pop >= 100_000: return 170
    if pop >= 50_000: return 230
    return 300

for f in pp:
    p = f["properties"]
    lon, lat = p["longitude"], p["latitude"]
    if not IN(lon, lat) or p["adm0_a3"] == "TUR":
        continue
    pop = p["pop_max"]
    cap = bool(p["adm0cap"])
    name = DE.get(p["name"], p["name"])
    orte.append({"n": name, "lon": round(lon, 3), "lat": round(lat, 3), "pop": pop, "k": "h" if cap else "s", "mz": rang_mz(pop, cap), "l": p["adm0_a3"]})

osm = json.load(open("osm_orte.json"))
tr = []
for o in osm["orte"]:
    if o["art"] == "island" or not IN(o["lon"], o["lat"]):
        continue
    pop = o["pop"] or (9000 if o["art"] == "town" else 60000)
    cap = o["n"] == "Ankara"
    tr.append({"n": o["n"], "lon": o["lon"], "lat": o["lat"], "pop": pop, "k": "h" if cap else ("s" if o["art"] == "city" and pop >= 100000 else "o"), "mz": rang_mz(pop, cap), "l": "TUR"})
orte += tr

# Gipfel: die höchsten mit Abstand, dazu bekannte Namen
gip = sorted([g for g in osm["gipfel"] if IN(g["lon"], g["lat"])], key=lambda x: -x["ele"])
manuell = [
    {"n": "Ararat (Ağrı Dağı)", "lon": 44.298, "lat": 39.702, "ele": 5137},
    {"n": "Süphan Dağı", "lon": 42.833, "lat": 38.933, "ele": 4058},
    {"n": "Erciyes Dağı", "lon": 35.448, "lat": 38.533, "ele": 3917},
    {"n": "Kaçkar Dağı", "lon": 41.152, "lat": 40.837, "ele": 3931},
    {"n": "Hasan Dağı", "lon": 34.173, "lat": 38.133, "ele": 3268},
    {"n": "Palandöken", "lon": 41.283, "lat": 39.833, "ele": 3271},
    {"n": "Uludağ", "lon": 29.133, "lat": 40.067, "ele": 2543},
    {"n": "Nemrut Dağı", "lon": 42.230, "lat": 38.650, "ele": 2935},
    {"n": "Elbrus", "lon": 42.4375, "lat": 43.3499, "ele": 5642},
    {"n": "Kazbek", "lon": 44.5, "lat": 42.6989, "ele": 5033},
    {"n": "Olymp", "lon": 22.3583, "lat": 40.0856, "ele": 2918},
    {"n": "Musala", "lon": 23.5852, "lat": 42.1794, "ele": 2925},
    {"n": "Aragaz", "lon": 44.2, "lat": 40.5333, "ele": 4090},
    {"n": "Damavand", "lon": 52.11, "lat": 35.95, "ele": 5609},
    {"n": "Troodos (Olympos)", "lon": 32.8636, "lat": 34.9367, "ele": 1952},
]
sel = []
def frei(x, r):
    return all(math.hypot(x["lon"] - y["lon"], x["lat"] - y["lat"]) > r for y in sel)
for m in manuell:
    if IN(m["lon"], m["lat"]):
        sel.append(m)
for g in gip:
    if g["ele"] < 2800: break
    if frei(g, 0.6) and all(ord(c) < 0x250 for c in g["n"]) and not any(g["n"].lower().startswith(x) for x in ("dksk", "suppa", "samdi")):
        sel.append({"n": g["n"], "lon": g["lon"], "lat": g["lat"], "ele": g["ele"]})
    if len(sel) >= 46: break
gipfel = [{"n": g["n"], "lon": round(g["lon"], 3), "lat": round(g["lat"], 3), "ele": g["ele"], "mz": 130 if g["ele"] >= 4000 else 190 if g["ele"] >= 3300 else 260} for g in sel]

# Meere, Meerengen, Buchten, Gebirge, Inseln (Lage nach Augenmaß, Größe als Klasse: 1 groß, 2 mittel, 3 klein)
meere = [
    {"n": "Schwarzes Meer", "lon": 34.6, "lat": 43.2, "rot": 0.0, "gr": 1},
    {"n": "Mittelmeer", "lon": 27.6, "lat": 33.6, "rot": 0.0, "gr": 1},
    {"n": "Ägäis", "lon": 25.0, "lat": 38.9, "rot": -0.1, "gr": 2},
    {"n": "Marmarameer", "lon": 28.15, "lat": 40.72, "rot": 0.0, "gr": 3},
    {"n": "Levantinisches Meer", "lon": 32.8, "lat": 34.3, "rot": 0.0, "gr": 3},
    {"n": "Libysches Meer", "lon": 23.0, "lat": 32.5, "rot": 0.0, "gr": 3},
    {"n": "Kretisches Meer", "lon": 25.2, "lat": 35.75, "rot": 0.0, "gr": 3},
    {"n": "Ionisches Meer", "lon": 20.6, "lat": 37.1, "rot": 1.2, "gr": 3},
    {"n": "Kaspisches Meer", "lon": 50.0, "lat": 40.6, "rot": 1.35, "gr": 2},
    {"n": "Asowsches Meer", "lon": 36.9, "lat": 45.75, "rot": 0.0, "gr": 3},
    {"n": "Golf von Iskenderun", "lon": 36.05, "lat": 36.72, "rot": 0.9, "gr": 4},
    {"n": "Golf von Antalya", "lon": 30.9, "lat": 36.45, "rot": 0.0, "gr": 4},
    {"n": "Bosporus", "lon": 29.06, "lat": 41.12, "rot": 1.0, "gr": 5},
    {"n": "Dardanellen", "lon": 26.4, "lat": 40.15, "rot": 0.7, "gr": 5},
]
gebirge = [
    {"n": "Taurusgebirge", "lon": 33.8, "lat": 37.15, "rot": -0.33, "gr": 1},
    {"n": "Pontisches Gebirge", "lon": 37.6, "lat": 40.55, "rot": -0.1, "gr": 1},
    {"n": "Kaukasus", "lon": 43.3, "lat": 43.0, "rot": -0.28, "gr": 1},
    {"n": "Zagrosgebirge", "lon": 47.2, "lat": 34.2, "rot": -0.75, "gr": 1},
    {"n": "Antitaurus", "lon": 36.3, "lat": 37.9, "rot": -0.8, "gr": 3},
    {"n": "Rhodopen", "lon": 24.9, "lat": 41.6, "rot": 0.0, "gr": 3},
    {"n": "Balkangebirge", "lon": 24.7, "lat": 42.85, "rot": 0.05, "gr": 3},
    {"n": "Pindos", "lon": 21.2, "lat": 39.6, "rot": 1.2, "gr": 3},
    {"n": "Anatolisches Hochland", "lon": 36.5, "lat": 39.4, "rot": 0.0, "gr": 2},
    {"n": "Ostanatolien", "lon": 41.6, "lat": 39.2, "rot": 0.0, "gr": 2},
]
inseln = [
    {"n": "Kreta", "lon": 24.9, "lat": 35.22, "mz": 55}, {"n": "Rhodos", "lon": 28.0, "lat": 36.2, "mz": 95},
    {"n": "Lesbos", "lon": 26.3, "lat": 39.15, "mz": 110}, {"n": "Chios", "lon": 26.0, "lat": 38.37, "mz": 120},
    {"n": "Samos", "lon": 26.85, "lat": 37.75, "mz": 130}, {"n": "Kos", "lon": 27.15, "lat": 36.85, "mz": 160},
    {"n": "Euböa", "lon": 23.85, "lat": 38.55, "mz": 100}, {"n": "Lemnos", "lon": 25.3, "lat": 39.9, "mz": 140},
    {"n": "Thasos", "lon": 24.7, "lat": 40.7, "mz": 150}, {"n": "Korfu", "lon": 19.7, "lat": 39.6, "mz": 110},
    {"n": "Gökçeada", "lon": 25.85, "lat": 40.17, "mz": 200}, {"n": "Bozcaada", "lon": 26.03, "lat": 39.83, "mz": 240},
    {"n": "Naxos", "lon": 25.5, "lat": 37.05, "mz": 150}, {"n": "Zypern", "lon": 33.1, "lat": 35.1, "mz": 40},
]

# Seen mit Namen (Natural Earth): Beschriftungspunkt aus der Fläche
SEE_DE = {"Lake Van": "Vansee", "Lake Tuz": "Tuz-Salzsee", "Lake Urmia": "Urmiasee", "Dead Sea": "Totes Meer", "Sea of Galilee": "See Genezareth",
          "Lake Sevan": "Sewansee", "Beyşehir": "Beyşehir-See", "Ataturk Barajt": "Atatürk-Stausee", "Keban Baraji": "Keban-Stausee",
          "Buhayrat al-Assad": "Assad-Stausee", "Mingevir Reservoir": "Mingetschauer Stausee", "Eğirdir": "Eğirdir-See", "Buhayrat ath Tharthar": "Tharthar-See"}
seen = []
for fn in ("ne_10m_lakes.geojson",):
    for f in json.load(open(fn))["features"]:
        n = f["properties"].get("name")
        if n in SEE_DE:
            g = shape(f["geometry"])
            if g.intersects(BOX):
                pt = g.representative_point()
                seen.append({"n": SEE_DE[n], "lon": round(pt.x, 3), "lat": round(pt.y, 3), "mz": 90 if f["properties"]["scalerank"] <= 4 else 150})
# Türkische Seen mit türkischen Namen aus dem Europa-Datensatz
for f in json.load(open("ne_10m_lakes_europe.geojson"))["features"]:
    n = f["properties"].get("name")
    if n in ("İznik Gölü", "Bafa Gölü", "Kuş Gölü", "Burdur Gölü", "Akşehir Gölü", "Sapanca Gölü", "Çıldır", "Erçek"):
        g = shape(f["geometry"])
        pt = g.representative_point()
        seen.append({"n": n if n.endswith(("Gölü", "Çıldır", "Erçek")) else n, "lon": round(pt.x, 3), "lat": round(pt.y, 3), "mz": 220})

# Flüsse: benannte Bögen, Beschriftung in der Mitte des längsten Stücks im Ausschnitt
FLUSS = {"Euphrates": "Euphrat (Fırat)", "Firat": "Euphrat (Fırat)", "Tigris": "Tigris (Dicle)", "Dicle": "Tigris (Dicle)", "Kiz?lirmak": "Kızılırmak",
         "Kızılırmak": "Kızılırmak", "Sakarya": "Sakarya", "Aras": "Aras", "Kura": "Kura", "Evros": "Mariza (Meriç)", "Danube": "Donau", "Jordan": "Jordan",
         "Ceyhan": "Ceyhan", "Byk Menderes": "Büyük Menderes", "Büyük Menderes": "Büyük Menderes", "Gediz": "Gediz", "Murat": "Murat", "Kelkit": "Kelkit", "Çekerek": "Çekerek",
         "Volga": "Wolga", "Kuban": "Kuban", "Prut": "Pruth", "Sava": "Save"}
kand = {}
for fn in ("ne_10m_rivers_lake_centerlines.geojson", "ne_10m_rivers_europe.geojson"):
    for f in json.load(open(fn))["features"]:
        n = f["properties"].get("name")
        if n not in FLUSS or f["properties"].get("featurecla") not in ("River",):
            continue
        g = shape(f["geometry"]).intersection(BOX)
        if g.is_empty:
            continue
        gs = list(g.geoms) if hasattr(g, "geoms") else [g]
        for part in gs:
            if part.geom_type == "LineString":
                kand.setdefault(FLUSS[n], []).append(part)
fluesse = []
for de, teile in kand.items():
    best = max(teile, key=lambda l: l.length)
    if best.length < 0.6:
        continue
    a = best.interpolate(0.47, normalized=True)
    b = best.interpolate(0.53, normalized=True)
    fluesse.append({"n": de, "lon": round(a.x, 3), "lat": round(a.y, 3), "lon2": round(b.x, 3), "lat2": round(b.y, 3), "mz": 130})

out = {"quelle": "Orte, Gipfel Türkei: OpenStreetMap (ODbL); Orte anderer Länder, Seen, Flüsse: Natural Earth (gemeinfrei)",
       "orte": orte, "gipfel": gipfel, "meere": meere, "gebirge": gebirge, "inseln": inseln, "seen": seen, "fluesse": fluesse}
json.dump(out, open(f"{GAME}/public/data/karte/orte.json", "w"), ensure_ascii=False, separators=(",", ":"))
print("Orte", len(orte), "(Türkei", len(tr), ") Gipfel", len(gipfel), "Seen", len(seen), "Flüsse", len(fluesse), os.path.getsize(f"{GAME}/public/data/karte/orte.json") // 1024, "KB")
print([g["n"] for g in gipfel])
print([f["n"] for f in fluesse])
