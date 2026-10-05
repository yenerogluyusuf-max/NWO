"""Schritt 12: Flüsse und Seen (Natural Earth 10m, gemeinfrei) -> public/data/karte/wasser.json"""
# Projektordner (game/): zwei Ebenen über tools/geodaten/karte2/
import os as _os
GAME = _os.environ.get("KARTE_GAME") or _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", "..", ".."))
import json, os
from shapely.geometry import shape, box, LineString
B = box(19.4, 30.9, 50.6, 46.1)
fl = []
seen_ids = set()
def linien(g):
    if g.is_empty: return []
    if g.geom_type == "LineString": return [g]
    return [x for x in getattr(g, "geoms", []) if x.geom_type == "LineString"]
for fn, extra in (("ne_10m_rivers_lake_centerlines.geojson", 0), ("ne_10m_rivers_europe.geojson", 0)):
    for f in json.load(open(fn))["features"]:
        p = f["properties"]
        if p.get("featurecla") not in ("River", "Intermittent River", "Lake Centerline"):
            continue
        g = shape(f["geometry"]).intersection(B)
        for l in linien(g):
            l = l.simplify(0.0015, preserve_topology=False)
            if len(l.coords) < 2 or l.length < 0.15:
                continue
            c = [round(v, 4) for xy in l.coords for v in xy]
            fl.append({"r": int(p.get("scalerank") or 9), "i": 1 if p.get("featurecla") == "Intermittent River" else 0, "p": c})
sn = []
for fn in ("ne_10m_lakes.geojson", "ne_10m_lakes_europe.geojson"):
    for f in json.load(open(fn))["features"]:
        g = shape(f["geometry"]).intersection(B)
        if g.is_empty or g.area < 0.00025:
            continue
        for poly in (g.geoms if hasattr(g, "geoms") else [g]):
            if poly.geom_type != "Polygon" or poly.area < 0.00025:
                continue
            poly = poly.simplify(0.0012, preserve_topology=True)
            if poly.is_empty or poly.geom_type != "Polygon":
                continue
            sn.append({"p": [round(v, 4) for xy in poly.exterior.coords for v in xy]})
json.dump({"quelle": "Natural Earth 1:10m Rivers and Lake Centerlines, Lakes (gemeinfrei)", "fluesse": fl, "seen": sn}, open(f"{GAME}/public/data/karte/wasser.json", "w"), separators=(",", ":"))
print(len(fl), "Flussstücke", len(sn), "Seen", os.path.getsize(f"{GAME}/public/data/karte/wasser.json") // 1024, "KB")
