"""Schritt 3: Landzerlegung. Aus OSM-Küste, geoBoundaries-Provinzen (prov_neu.pkl) und Natural-Earth-Ländern entsteht eine
lückenlose, überlappungsfreie Zerlegung des Landes in 81 Provinzen und die Nachbarländer.

Regeln
  - Die Provinzen (aus s2_provinzen.py) sind maßgeblich für die Türkei, auch an der Landesgrenze.
  - Der Rest des OSM-Landes (Küste in voller Auflösung) wird auf die Länder verteilt: zuerst nach den Natural-Earth-Flächen,
    dann werden Lücken (Küstenunterschied, Grenzstreifen zur Türkei, Inselchen) dem nächsten Land zugeschlagen; Streifen zwischen
    mehreren Ländern werden nach dem nächstgelegenen Grenzpunkt aufgeteilt (Voronoi).
Ausgabe: zellen.pkl  {"prov": {plaka: MultiPolygon}, "land": {iso: MultiPolygon}}
"""
# Projektordner (game/): zwei Ebenen über tools/geodaten/karte2/
import os as _os
GAME = _os.environ.get("KARTE_GAME") or _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", "..", ".."))
import json, pickle, sys, time
import numpy as np
import shapely
from shapely import STRtree
from shapely.geometry import shape, box, MultiPolygon, Polygon, MultiPoint, Point
from shapely.ops import unary_union
from shapely.validation import make_valid

t0 = time.time()
def log(*a):
    print(f"[{time.time() - t0:6.0f}s]", *a, flush=True)

ROI = box(19.4, 30.9, 50.6, 46.1)          # Höhenmodell 19,5–50,5 E, 31–46 N, mit kleinem Rand
GRAD_KM2 = 111.0 * 111.0 * 0.78

def flaechen(g):
    """Nur die Flächenteile eines Ergebnisses als MultiPolygon."""
    if g is None or g.is_empty:
        return MultiPolygon()
    if g.geom_type == "Polygon":
        return MultiPolygon([g])
    if g.geom_type == "MultiPolygon":
        return g
    teile = []
    for t in getattr(g, "geoms", []):
        if t.geom_type == "Polygon": teile.append(t)
        elif t.geom_type == "MultiPolygon": teile.extend(t.geoms)
    return MultiPolygon(teile)

def km2(g):
    return g.area * GRAD_KM2

land = pickle.load(open("land_full.pkl", "rb"))
land = flaechen(land.intersection(ROI))
log("Land in der Region:", len(land.geoms), "Flächen,", round(km2(land)), "km²")
prov = pickle.load(open("prov_neu.pkl", "rb"))
T = unary_union(list(prov.values()))
log("Türkei:", round(km2(T)), "km²")

# --- Natural-Earth-Länder
ne = json.load(open("ne_10m_admin_0_countries.geojson"))["features"]
TAUSCH = {"CNM": "CYP", "ESB": "CYP", "WSB": "CYP"}
laender = {}
namen = {}
for f in ne:
    p = f["properties"]
    iso = p["ADM0_A3"]
    if iso == "TUR":
        continue
    iso = TAUSCH.get(iso, iso)
    g = shape(f["geometry"])
    if not g.is_valid:
        g = make_valid(g)
    g = flaechen(g.intersection(ROI))
    if g.is_empty:
        continue
    laender[iso] = flaechen(unary_union([laender[iso], g])) if iso in laender else g
    namen.setdefault(iso, {"de": p["NAME_DE"], "en": p["NAME_EN"], "tr": p["NAME_TR"], "label": [p["LABEL_X"], p["LABEL_Y"]], "labelrank": p["LABELRANK"], "pop": p["POP_EST"], "min_label": p["MIN_LABEL"]})
log("Länder im Ausschnitt:", len(laender), sorted(laender))

# --- Rest des Landes
R = flaechen(land.difference(T))
log("Rest ohne Türkei:", round(km2(R)), "km²")

# --- Zuteilung nach NE-Flächen (Überschneidungen: das größere Land zuerst, Rest fällt an das nächste)
reihe = sorted(laender, key=lambda k: -laender[k].area)
A = {}
belegt = MultiPolygon()
belegt_u = None
for iso in reihe:
    a = flaechen(R.intersection(laender[iso]))
    if belegt_u is not None:
        a = flaechen(a.difference(belegt_u))
    A[iso] = a
    belegt_u = a if belegt_u is None else unary_union([belegt_u, a])
    log(iso, round(km2(a), 1), "km²")
U = flaechen(R.difference(belegt_u))
teile = list(U.geoms)
log("Lücken:", len(teile), "Stücke,", round(km2(U), 1), "km²")
gross = sorted(teile, key=lambda x: -x.area)[:25]
for x in gross:
    log("  Lücke", round(km2(x), 1), "km² bei", [round(v, 2) for v in x.representative_point().coords[0]])

pickle.dump({"prov": prov, "A": A, "U": teile, "namen": namen, "T": T}, open("zellen_vor.pkl", "wb"))
