"""Schritt 1: Vollständige OSM-Landpolygone (EPSG:4326, geteilt) für die Kartenregion lesen, vereinigen, speichern."""
# Projektordner (game/): zwei Ebenen über tools/geodaten/karte2/
import os as _os
GAME = _os.environ.get("KARTE_GAME") or _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", "..", ".."))
import pickle, shapefile, zipfile, os, time
from shapely.geometry import shape, box
from shapely.ops import unary_union

t0 = time.time()
z = zipfile.ZipFile("land_full.zip")
namen = [n for n in z.namelist() if n.endswith(("land_polygons.shp", "land_polygons.shx", "land_polygons.dbf"))]
print(namen)
for n in namen:
    if not os.path.exists(os.path.basename(n)):
        with z.open(n) as src, open(os.path.basename(n), "wb") as dst:
            while True:
                b = src.read(1 << 24)
                if not b: break
                dst.write(b)
print("entpackt", round(time.time() - t0), "s")

LON0, LON1, LAT0, LAT1 = 17.0, 53.0, 28.0, 49.0
sf = shapefile.Reader("land_polygons.shp")
print("Datensätze:", len(sf))
teile = []
punkte = 0
gesehen = 0
for s in sf.iterShapes():
    gesehen += 1
    x0, y0, x1, y1 = s.bbox
    if x1 < LON0 or x0 > LON1 or y1 < LAT0 or y0 > LAT1:
        continue
    g = shape(s.__geo_interface__)
    if not g.is_valid:
        g = g.buffer(0)
    teile.append(g)
    punkte += len(s.points)
print("gelesen", gesehen, "Polygone in Region", len(teile), "Punkte", punkte, round(time.time() - t0), "s")
land = unary_union(teile)
land = land.intersection(box(LON0, LAT0, LON1, LAT1))
geoms = list(land.geoms) if hasattr(land, "geoms") else [land]
n = sum(len(p.exterior.coords) + sum(len(i.coords) for i in p.interiors) for p in geoms)
print("vereinigt:", len(geoms), "Flächenstücke,", n, "Punkte", round(time.time() - t0), "s")
pickle.dump(land, open("land_full.pkl", "wb"))
