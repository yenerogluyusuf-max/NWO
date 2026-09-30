"""Schritt 7: Detailstufen als kompakte Binärdateien und Besitzertabelle nach public/data/karte/ schreiben.

karte-L{0,1,2}.bin  (Int32, little-endian)
  [0] Magic 0x4B32   [1] Version 1   [2] Anzahl Flächen   [3] Anzahl Bögen
  je Fläche:  Besitzerindex, Anzahl Ringe, je Ring: Punktzahl n, dann n Paare (Länge, Breite) mal 1e5 (Ring offen, ohne Wiederholung)
  je Bogen:   Typ, Punktzahl n, dann n Paare
  Bogentypen: 0 Küste der Türkei, 2 Provinzgrenze, 3 Regionsgrenze, 4 Landesgrenze der Türkei, 5 Grenze zwischen anderen Ländern
karte.json  Besitzertabelle: erst die 81 Provinzen (Index = Kfz-Kennziffer − 1), dann die Länder mit Namen und Beschriftungspunkt
"""
# Projektordner (game/): zwei Ebenen über tools/geodaten/karte2/
import os as _os
GAME = _os.environ.get("KARTE_GAME") or _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", "..", ".."))
def ist_prov(k):
    return len(k) == 3 and k[0] == 'P' and k[1:].isdigit()

import json, os, pickle, struct, sys
import numpy as np
from shapely.geometry import box, MultiPolygon
from shapely.ops import polylabel, unary_union

OUT = GAME + "/public/data/karte"
os.makedirs(OUT, exist_ok=True)
K = 111.0 * 111.0 * 0.78
cells = pickle.load(open("zellen.pkl", "rb"))
zellen_vor = pickle.load(open("zellen_vor.pkl", "rb"))
namen = zellen_vor["namen"]

LAND_KURZ = {
    "CYP": "Zypern", "CYN": "Nordzypern", "BIH": "Bosnien und Herzegowina", "MKD": "Nordmazedonien", "MDA": "Moldau",
    "PSX": "Palästina", "SAU": "Saudi-Arabien", "KOS": "Kosovo", "ISR": "Israel", "IRQ": "Irak", "IRN": "Iran",
}
BBOX = box(19.5, 31.0, 50.5, 46.0)

owners = []
index = {}
for p in range(1, 82):
    index[f"P{p:02d}"] = len(owners)
    owners.append({"k": "p", "plaka": p})
land_keys = sorted(k for k in cells if not ist_prov(k))
for iso in land_keys:
    g = cells[iso]
    sicht = g.intersection(BBOX)
    if sicht.is_empty:
        continue
    teile = sorted(sicht.geoms if hasattr(sicht, "geoms") else [sicht], key=lambda x: -x.area)
    a = teile[0]
    try:
        pt = polylabel(a, 0.02)
        lon, lat = pt.x, pt.y
    except Exception:
        pt = a.representative_point(); lon, lat = pt.x, pt.y
    n = namen.get(iso, {"de": iso, "tr": iso, "en": iso, "labelrank": 8, "pop": 0})
    name = LAND_KURZ.get(iso, n["de"])
    index[iso] = len(owners)
    owners.append({
        "k": "l", "iso": iso, "name": name, "lon": round(lon, 3), "lat": round(lat, 3),
        "flaeche": round(sicht.area * K), "rang": n["labelrank"], "einwohner": n["pop"],
    })

# Sammelbesitzer „Türkei“: Vereinigung der Provinzen (nur Außenring), z. B. als Clip für den Farbsaum der Landesgrenze
tur_idx = len(owners)
owners.append({"k": "t", "iso": "TUR", "name": "Türkiye"})
index["TUR"] = tur_idx

for stufe in (0, 1, 2):
    d = pickle.load(open(f"bogen_L{stufe}.pkl", "rb"))
    buf = bytearray()
    faces = [(k, f) for k, f in d["faces"] if k in index]
    arcs = d["arcs"]
    parts = []
    for k, f in faces:
        for p in (f.geoms if hasattr(f, "geoms") else [f]):
            ringe = [p.exterior] + list(p.interiors)
            parts.append((index[k], ringe))
    tur = unary_union([f for k, f in faces if ist_prov(k)])
    for p in (tur.geoms if hasattr(tur, "geoms") else [tur]):
        parts.append((tur_idx, [p.exterior] + list(p.interiors)))
    header = struct.pack("<4i", 0x4B32, 1, len(parts), len(arcs))
    buf += header
    for owner, ringe in parts:
        buf += struct.pack("<2i", owner, len(ringe))
        for r in ringe:
            c = np.round(np.array(r.coords)[:-1] * 1e5).astype("<i4")
            buf += struct.pack("<i", len(c)) + c.tobytes()
    for t, c in arcs:
        buf += struct.pack("<2i", t, len(c)) + c.astype("<i4").tobytes()
    open(f"{OUT}/karte-L{stufe}.bin", "wb").write(buf)
    print(f"L{stufe}: {len(parts)} Flächenstücke, {len(arcs)} Bögen, {len(buf) / 1e6:.2f} MB")

# Beschriftungsanker: innere Punkte mit Abstand zur Grenze (Grad), damit Namen dem sichtbaren Teil eines Landes folgen können
from shapely.prepared import prep
from shapely.geometry import Point
from shapely.ops import unary_union
def anker(g, schritt=0.25, mind=0.10, n=48):
    g = g.intersection(BBOX)
    if g.is_empty:
        return []
    pg = prep(g)
    rand = g.boundary
    x0, y0, x1, y1 = g.bounds
    kand = []
    y = y0 + schritt / 2
    while y < y1:
        x = x0 + schritt / 2
        while x < x1:
            p = Point(x, y)
            if pg.contains(p):
                d = rand.distance(p)
                if d >= mind:
                    kand.append((d, x, y))
            x += schritt
        y += schritt
    kand.sort(reverse=True)
    out = []
    for d, x, y in kand:
        if all((x - a) ** 2 + (y - b) ** 2 > 0.36 for _, a, b in out):
            out.append((d, x, y))
        if len(out) >= n:
            break
    return [v for d, x, y in out for v in (round(x, 2), round(y, 2), round(d, 2))]
ank = {iso: anker(cells[iso]) for iso in land_keys if iso in cells}
ank["TUR"] = anker(unary_union([cells[k] for k in cells if ist_prov(k)]), schritt=0.3, mind=0.15, n=60)

meta = {
    "anker": ank,
    "quelle": "Küste: OpenStreetMap-Landpolygone (ODbL); Provinzen: geoBoundaries gbOpen TUR ADM1 (CC BY 4.0, aus OSM); Länder: Natural Earth 10m (gemeinfrei)",
    "besitzer": owners,
    "stufen": [
        {"datei": "karte-L0.bin", "bis": 60, "tol": 0.008},
        {"datei": "karte-L1.bin", "bis": 200, "tol": 0.0025},
        {"datei": "karte-L2.bin", "bis": 1e9, "tol": 0.0007},
    ],
}
json.dump(meta, open(f"{OUT}/karte.json", "w"), ensure_ascii=False, separators=(",", ":"))
print("Besitzer:", len(owners), "Länder:", len(owners) - 81)
