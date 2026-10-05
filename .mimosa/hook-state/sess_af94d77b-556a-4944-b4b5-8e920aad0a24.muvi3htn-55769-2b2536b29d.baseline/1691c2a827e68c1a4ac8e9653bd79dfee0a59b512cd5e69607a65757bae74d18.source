"""Schritt 10: Orte (Städte, Kleinstädte, Inseln) und Berggipfel aus dem OSM-Auszug der Türkei (Geofabrik; ODbL)."""
# Projektordner (game/): zwei Ebenen über tools/geodaten/karte2/
import os as _os
GAME = _os.environ.get("KARTE_GAME") or _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", "..", ".."))
import json, time, os
import osmium
t0 = time.time()
PBF = os.path.expanduser("~/.cache/staatsraeson-geodaten/turkey.osm.pbf")
fp = osmium.FileProcessor(PBF, osmium.osm.NODE).with_filter(osmium.filter.KeyFilter("place", "natural"))
orte, gipfel = [], []
for o in fp:
    t = o.tags
    if "place" in t and t["place"] in ("city", "town", "island"):
        name = t.get("name:tr") or t.get("name")
        if not name or not o.location.valid():
            continue
        pop = 0
        try:
            pop = int(str(t.get("population", "0")).replace(".", "").replace(",", "").split()[0])
        except Exception:
            pop = 0
        orte.append({"n": name, "de": t.get("name:de"), "lon": round(o.location.lon, 4), "lat": round(o.location.lat, 4), "art": t["place"], "pop": pop, "cap": t.get("capital")})
    elif t.get("natural") == "peak" and "name" in t and "ele" in t:
        try:
            ele = float(str(t["ele"]).replace(",", ".").split()[0])
        except Exception:
            continue
        if ele >= 1900 and o.location.valid():
            gipfel.append({"n": t.get("name:tr") or t["name"], "de": t.get("name:de"), "lon": round(o.location.lon, 4), "lat": round(o.location.lat, 4), "ele": round(ele)})
print(f"[{time.time()-t0:.0f}s] Orte {len(orte)} Gipfel {len(gipfel)}")
json.dump({"orte": orte, "gipfel": gipfel}, open("osm_orte.json", "w"), ensure_ascii=False)
