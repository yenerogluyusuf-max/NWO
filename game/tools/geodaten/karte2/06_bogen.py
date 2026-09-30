"""Schritt 6: Aus der Landzerlegung (zellen.pkl) und der Bezirksunterteilung (bezirke_zellen.pkl) entstehen gemeinsame Grenzbögen (Arcs),
ihre Vereinfachung in drei Detailstufen und daraus je Stufe die Flächen (per polygonize). Grenzen werden nur einmal vereinfacht und
bleiben deshalb zwischen Nachbarn deckungsgleich, auch zwischen Provinz- und Bezirksgrenzen.

Ausgabe:  bogen_L{k}.pkl  {"arcs": [(typ, coords)], "faces": [(owner, MultiPolygon)]}      k = 0, 1, 2   (Provinzen und Länder)
          bogen_B{k}.pkl  {"arcs": [(6, coords)], "faces": [(bezirksindex, MultiPolygon)]}   k = 1, 2      (Bezirke)
Typen der Bögen:  0 Küste der Türkei, 1 Küste anderer Länder, 2 Provinzgrenze, 3 Regionsgrenze, 4 Landesgrenze der Türkei,
                  5 Grenze zwischen anderen Ländern, 6 Bezirksgrenze innerhalb einer Provinz,
                  7 Ufer eines Binnensees in der Türkei (wird nicht ausgegeben)
"""
# Projektordner (game/): zwei Ebenen über tools/geodaten/karte2/
import os as _os
GAME = _os.environ.get("KARTE_GAME") or _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", "..", ".."))
def ist_prov(k):
    return len(k) == 3 and k[0] == 'P' and k[1:].isdigit()

import json, pickle, sys, time
import numpy as np
import shapely
from shapely import STRtree
from shapely.geometry import Point, MultiPolygon, Polygon, LineString
from shapely.ops import unary_union, linemerge, polygonize

t0 = time.time()
def log(*a):
    print(f"[{time.time() - t0:6.0f}s]", *a, flush=True)

cells = pickle.load(open("zellen.pkl", "rb"))
bcells = pickle.load(open("bezirke_zellen.pkl", "rb"))
keys = sorted(cells)
region = {f"P{p['plaka']:02d}": p["region"] for p in json.load(open(GAME + "/src/data/provinzdaten.json"))["provinzen"]}

# --- Bögen: alle Zellgrenzen (Provinzen, Länder, Bezirke) einmal vernoden und zwischen Verzweigungen zusammenfassen
ringe = []
for k in keys:
    b = cells[k].boundary
    ringe.extend(b.geoms if hasattr(b, "geoms") else [b])
for i in sorted(bcells):
    b = bcells[i].boundary
    ringe.extend(b.geoms if hasattr(b, "geoms") else [b])
log("Randlinien:", len(ringe), "Punkte:", sum(len(r.coords) for r in ringe))
vernodet = unary_union(ringe)
log("vernodet:", len(vernodet.geoms))
bogen = linemerge(vernodet)
bogen = list(bogen.geoms) if hasattr(bogen, "geoms") else [bogen]
log("Bögen:", len(bogen), "Punkte:", sum(len(b.coords) for b in bogen))

# --- Bögen einer Zelle zuordnen
polys = []
poly_key = []
for k in keys:
    for p in cells[k].geoms:
        polys.append(p)
        poly_key.append(k)
baum = STRtree(polys)
polys_rand = [p.boundary for p in polys]

def anlieger(arc):
    """Zellen, an deren Rand der Bogen liegt (leer: der Bogen liegt im Inneren einer Zelle, also eine Bezirksgrenze)."""
    c = arc.coords
    n = len(c)
    idx = sorted({1, n // 2, n - 2}) if n > 3 else [n // 2]
    mengen = []
    for i in idx:
        p = Point(c[max(0, min(n - 1, i))])
        hit = baum.query(p.buffer(4e-7), predicate="intersects")
        mengen.append({poly_key[int(j)] for j in hit if polys_rand[int(j)].distance(p) < 1.5e-6})
    m = set.intersection(*mengen) if mengen else set()
    return m if m else max(mengen, key=len)

# Binnenseen als Löcher der Türkei: Küstenbögen um sie gehören nicht zum Landesumriss (Typ 7)
tur = unary_union([cells[k] for k in cells if ist_prov(k)])
loecher = [LineString(r.coords) for poly in (tur.geoms if hasattr(tur, "geoms") else [tur]) for r in poly.interiors]
loch_rand = unary_union(loecher) if loecher else None
aussen = unary_union([LineString(p.exterior.coords) for p in (tur.geoms if hasattr(tur, "geoms") else [tur])])
log("Löcher in der Türkei (Binnengewässer):", len(loecher))

typen = []
for a in bogen:
    m = anlieger(a)
    prov_ = [x for x in m if ist_prov(x)]
    land_ = [x for x in m if not ist_prov(x)]
    if not m:
        t = 6
    elif len(m) == 1:
        t = 0 if prov_ else 1
    elif prov_ and land_:
        t = 4
    elif len(prov_) >= 2:
        t = 2 if len({region[x] for x in prov_}) == 1 else 3
    else:
        t = 5
    if t == 0:
        # Küstenbögen fern vom Außenrand der Türkei sind Ufer von Binnengewässern und kleine Lücken (Typ 7)
        c = a.coords
        mitte = Point(c[len(c) // 2])
        if aussen.distance(mitte) > 1e-4 or (loch_rand is not None and loch_rand.distance(mitte) < 1.5e-6):
            t = 7
    typen.append(t)
from collections import Counter
log("Typen:", Counter(typen))

# Bezirksflächen zuordnen
bpolys = []
bkey = []
for i in sorted(bcells):
    for p in bcells[i].geoms:
        bpolys.append(p)
        bkey.append(i)
bbaum = STRtree(bpolys)

# --- Detailstufen
STUFEN = [(2, 0.0007), (1, 0.0025), (0, 0.008)]   # Stufe, Toleranz in Grad
K = 111.0 * 111.0 * 0.78
for stufe, tol in STUFEN:
    vereinfacht = shapely.simplify(np.array(bogen, dtype=object), tol, preserve_topology=True)
    arcs = []
    lines_prov = []
    lines_alle = []
    arcs_b = []
    for a, t in zip(vereinfacht, typen):
        geschlossen = a.is_closed
        minx, miny, maxx, maxy = a.bounds
        if geschlossen and max(maxx - minx, maxy - miny) < 2.2 * tol:
            continue  # winzige Insel
        lines_alle.append(a)   # auch kurze Verbindungsstücke: sonst schließen sich Flächen nicht
        if t != 6:
            lines_prov.append(a)
        if t == 1 or t == 7 or a.length < tol:
            continue  # Küsten anderer Länder und Binnenseen zeichnet die Küstenlinie im Shader
        arr = np.round(np.array(a.coords) * 1e5).astype(np.int32)
        if t == 6:
            arcs_b.append((6, arr))
        else:
            arcs.append((t, arr))
    log(f"L{stufe} tol={tol}: Bögen {len(arcs)}, Bezirksbögen {len(arcs_b)}, Punkte {sum(len(c) for _, c in arcs)}")
    flaechen = list(polygonize(unary_union(lines_prov)))
    faces = []
    ohne = 0
    verloren = 0.0
    for f in flaechen:
        rp = f.representative_point()
        hit = baum.query(rp, predicate="within")
        if len(hit) == 0:
            verloren += f.area * K
            ohne += 1
            continue
        faces.append((poly_key[int(hit[0])], f))
    log(f"L{stufe}: Flächen {len(faces)}, verworfen {ohne} ({verloren:.1f} km²), Landfläche {sum(f.area for _, f in faces) * K:.0f} km² (Soll {sum(g.area for g in cells.values()) * K:.0f})")
    pickle.dump({"arcs": arcs, "faces": faces, "tol": tol}, open(f"bogen_L{stufe}.pkl", "wb"))
    if stufe >= 1:
        fb = []
        for f in polygonize(unary_union(lines_alle)):
            rp = f.representative_point()
            hit = bbaum.query(rp, predicate="within")
            if len(hit) == 0:
                continue
            fb.append((bkey[int(hit[0])], f))
        ta = sum(g.area for g in bcells.values()) * K
        log(f"B{stufe}: Bezirksflächen {len(fb)}, {sum(f.area for _, f in fb) * K:.0f} km² (Soll {ta:.0f})")
        pickle.dump({"arcs": arcs_b, "faces": fb, "tol": tol}, open(f"bogen_B{stufe}.pkl", "wb"))
