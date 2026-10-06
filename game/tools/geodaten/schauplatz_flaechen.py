"""Flächen der Kriegsregionen (data/schauplaetze.ts) für die Karte: aus den Landesflächen der Karte selbst, ohne neue Rohdaten.

Jede Region bekommt das Gebiet ihres Landes, das ihrem Ort näher liegt als jedem anderen Ort desselben Schauplatzes (Voronoi-Zelle),
geschnitten an Landesgrenze und Küste (public/data/karte/karte-L1.bin, Natural Earth und OpenStreetMap wie die übrige Karte); eine Insel
zählt ganz, sonst ist das Gebiet auf einen Umkreis um den Ort begrenzt (Städte enger, Land weiter). Das ist keine Verwaltungsgrenze (für die Nachbarländer liegen im
Projekt keine Verwaltungsgebiete vor), sondern das Gebiet, das an diesem Ort hängt; die Karte zeigt damit, welches Land den Besitzer wechselt.

Ausgabe: src/data/schauplatz-flaechen.json  {region: [[[lon, lat], ...], ...]}  (Ringe, außen; drei Nachkommastellen)
Aufruf: python3 tools/geodaten/schauplatz_flaechen.py   (aus dem Ordner game/)
"""
import json
import re
import struct

import numpy as np
from shapely.geometry import MultiPoint, Point, Polygon
from shapely.ops import unary_union, voronoi_diagram

KARTE = "public/data/karte/karte.json"
BIN = "public/data/karte/karte-L1.bin"
DATEN = "src/data/schauplaetze.ts"
AUS = "src/data/schauplatz-flaechen.json"

# Umkreis je Gelände in Grad (Spielparameter der Darstellung)
UMKREIS = {"stadt": 0.5, "kueste": 0.6, "ebene": 0.8, "berge": 0.75}

text = open(DATEN, encoding="utf-8").read()
schauplaetze = {m[0]: m[1] for m in re.findall(r'\{ id: "(\w+)", land: "(\w+)", lon:', text)}
regionen = [
    {"id": m[0], "schauplatz": m[1], "lon": float(m[2]), "lat": float(m[3]), "gelaende": m[4]}
    for m in re.findall(r'\{ id: "(\w+)", schauplatz: "(\w+)", lon: ([\d.]+), lat: ([\d.]+), gelaende: "(\w+)"', text)
]
assert regionen and schauplaetze, "Daten nicht gefunden"

besitzer = json.load(open(KARTE, encoding="utf-8"))["besitzer"]
index = {b.get("iso"): i for i, b in enumerate(besitzer) if b.get("k") == "l"}

# karte-L1.bin lesen: Kopf [0x4B32, 1, Flächen, Bögen], je Fläche [Besitzer, Ringe], je Ring [Punkte, (lon·1e5, lat·1e5) …]
roh = np.fromfile(BIN, dtype="<i4")
assert roh[0] == 0x4B32
n_fl = int(roh[2])
pos = 4
flaechen = {}
for _ in range(n_fl):
    owner, n_ring = int(roh[pos]), int(roh[pos + 1])
    pos += 2
    ringe = []
    for _r in range(n_ring):
        n = int(roh[pos])
        pos += 1
        pts = roh[pos : pos + 2 * n].reshape(-1, 2) / 1e5
        pos += 2 * n
        ringe.append(pts)
    if len(ringe[0]) >= 3:
        poly = Polygon(ringe[0], [r for r in ringe[1:] if len(r) >= 3]).buffer(0)
        flaechen.setdefault(owner, []).append(poly)

aus = {}
for sid, iso in schauplaetze.items():
    land = unary_union(flaechen[index[iso]])
    orte = [r for r in regionen if r["schauplatz"] == sid]
    punkte = MultiPoint([(r["lon"], r["lat"]) for r in orte])
    zellen = voronoi_diagram(punkte, envelope=land.envelope.buffer(2))
    for r in orte:
        p = Point(r["lon"], r["lat"])
        zelle = next(z for z in zellen.geoms if z.contains(p))
        gebiet = zelle.intersection(land)
        # Eine Insel ganz (der Ort liegt oft an ihrer Küste), sonst auf den Umkreis begrenzt
        if r["gelaende"] != "insel":
            gebiet = gebiet.intersection(p.buffer(UMKREIS[r["gelaende"]], 24))
        teile = [g for g in getattr(gebiet, "geoms", [gebiet]) if g.geom_type == "Polygon" and not g.is_empty]
        # Nur Teile nahe am Ort (die eigene Insel, die eigene Küste), keine fernen Splitter
        teile = [g for g in teile if g.distance(p) <= 0.12]
        ringe = []
        for g in teile:
            g = g.simplify(0.006, preserve_topology=True)
            if g.area < 0.0004:
                continue
            ringe.append([[round(x, 3), round(y, 3)] for x, y in list(g.exterior.coords)[:-1]])
        assert ringe, f"keine Fläche für {r['id']}"
        aus[r["id"]] = ringe

json.dump(aus, open(AUS, "w", encoding="utf-8"), separators=(",", ":"))
print(len(aus), "Regionen,", sum(len(v) for v in aus.values()), "Ringe,", round(len(json.dumps(aus, separators=(',', ':'))) / 1024), "KB")
