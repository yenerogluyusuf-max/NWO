"""Schritt 2: Provinzen aus geoBoundaries ADM1 (volle Auflösung): topologisch vereinfachen, an der OSM-Küste beschneiden."""
# Projektordner (game/): zwei Ebenen über tools/geodaten/karte2/
import os as _os
GAME = _os.environ.get("KARTE_GAME") or _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", "..", ".."))
import json, pickle, time, sys
from shapely.geometry import shape, Polygon, MultiPolygon, LineString, MultiLineString, box
from shapely.ops import unary_union, linemerge, polygonize
from shapely import STRtree
import shapely

t0 = time.time()
TOL = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0003   # Grad; 0.0003 ≈ 33 m in der Breite
land = pickle.load(open("land_full.pkl", "rb"))

d = json.load(open("tur_adm1.geojson"))
prov = {}
for f in d["features"]:
    plaka = int(f["properties"]["shapeISO"].split("-")[1])
    g = shape(f["geometry"])
    if not g.is_valid:
        g = g.buffer(0)
    prov[plaka] = g
print("Provinzen gelesen", len(prov), round(time.time() - t0), "s")

# --- topologisch konsistent vereinfachen: gemeinsame Grenzlinien einmal aufnehmen, einmal vereinfachen
grenzen = unary_union([g.boundary for g in prov.values()])
linien = linemerge(grenzen)
teile = list(linien.geoms) if hasattr(linien, "geoms") else [linien]
einfach = [t.simplify(TOL, preserve_topology=False) for t in teile]
print("Linien", len(teile), "Punkte vorher", sum(len(t.coords) for t in teile), "nachher", sum(len(t.coords) for t in einfach), round(time.time() - t0), "s")
flaechen = list(polygonize(unary_union(einfach)))
print("Flächen", len(flaechen))

# jeder Fläche die Provinz zuordnen, in der ihr innerer Punkt liegt
provListe = list(prov.items())
baum = STRtree([g for _, g in provListe])
zuordnung = {p: [] for p in prov}
verwaist = 0
for f in flaechen:
    pt = f.representative_point()
    hits = baum.query(pt, predicate="within")
    if len(hits) == 0:
        verwaist += 1
        continue
    zuordnung[provListe[hits[0]][0]].append(f)
print("verwaiste Flächen (Wasser/Nachbarn):", verwaist)
neu = {p: unary_union(fl) for p, fl in zuordnung.items() if fl}
print("Provinzen nach Neuaufbau:", len(neu))

# --- an der Küste beschneiden
gesamt = unary_union(list(neu.values()))
# Land vorab auf die Umgebung der Türkei beschneiden, sonst rechnen alle Verschneidungen mit dem ganzen Kartenrand
land = land.intersection(box(*gesamt.buffer(0.05).bounds))
print("Land in der Umgebung:", len(land.geoms) if hasattr(land, "geoms") else 1, "Flächen", round(time.time() - t0), "s", flush=True)
print("Gesamtfläche vor Beschneiden (km² ≈):", round(gesamt.area * 111 * 111 * 0.78))
def nur_flaechen(g):
    """Aus einem Verschneidungsergebnis nur die Flächenteile behalten."""
    if g.is_empty:
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

beschnitten = {}
for p, g in neu.items():
    beschnitten[p] = nur_flaechen(g.intersection(land))
gesamt2 = unary_union(list(beschnitten.values()))
print("Gesamtfläche nach Beschneiden (km² ≈):", round(gesamt2.area * 111 * 111 * 0.78), round(time.time() - t0), "s")

# --- Lücken an der Küste (Land, das keine Provinz abdeckt) der nächstgelegenen Provinz zuschlagen
puffer = gesamt.buffer(0.004)  # ≈ 400 m
luecke = nur_flaechen(land.intersection(puffer).difference(gesamt2))
stuecke = list(luecke.geoms)
print("Lückenstücke:", len(stuecke), "Fläche km²:", round(sum(x.area for x in stuecke) * 111 * 111 * 0.78, 1), flush=True)
keys = list(beschnitten.keys())
pb = STRtree([beschnitten[k] for k in keys])
sammler = {k: [] for k in keys}
uebrig = 0
for s_ in stuecke:
    if s_.area * 111 * 111 * 0.78 > 3.0:  # größer als 3 km²: kein Küstensaum, sondern Nachbarland oder Insel
        uebrig += 1
        continue
    i = pb.query_nearest(s_, max_distance=0.001)
    if len(i):
        sammler[keys[int(i[0])]].append(s_)
zugeschlagen = 0
for k, teile in sammler.items():
    if teile:
        beschnitten[k] = nur_flaechen(unary_union([beschnitten[k], *teile]))
        zugeschlagen += len(teile)
print("Lücken zugeschlagen:", zugeschlagen, "größere Reste:", uebrig, flush=True)

# Ergebnis säubern und speichern
out = {}
for p, g in beschnitten.items():
    g = nur_flaechen(g.buffer(0))
    # winzige Splitter entfernen (unter 0,05 km²)
    teile = [t for t in g.geoms if t.area * 111 * 111 * 0.78 >= 0.05]
    out[p] = MultiPolygon(teile)
punkte = sum(len(t.exterior.coords) + sum(len(i.coords) for i in t.interiors) for g in out.values() for t in g.geoms)
print("Ergebnis:", len(out), "Provinzen,", punkte, "Punkte", round(time.time() - t0), "s")
pickle.dump(out, open("prov_neu.pkl", "wb"))
