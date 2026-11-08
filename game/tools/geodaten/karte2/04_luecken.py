"""Schritt 4: Lücken den Zellen zuschlagen (Fortsetzung von 03_laender.py). Ausgabe: zellen.pkl {owner: MultiPolygon}.
Zellenschlüssel: "P06" (Provinz mit Kfz-Kennziffer) oder ISO-A3 des Landes."""
# Projektordner (game/): zwei Ebenen über tools/geodaten/karte2/
import os as _os
GAME = _os.environ.get("KARTE_GAME") or _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", "..", ".."))
def ist_prov(k):
    return len(k) == 3 and k[0] == 'P' and k[1:].isdigit()

import pickle, time
from shapely import STRtree
from shapely.geometry import MultiPolygon
from shapely.ops import unary_union

t0 = time.time()
def log(*a):
    print(f"[{time.time() - t0:6.0f}s]", *a, flush=True)
K = 111.0 * 111.0 * 0.78

def flaechen(g):
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

d = pickle.load(open("zellen_vor.pkl", "rb"))
prov, A, U = d["prov"], d["A"], d["U"]
cells = {f"P{p:02d}": g for p, g in prov.items()}
for iso, g in A.items():
    if not g.is_empty:
        cells[iso] = g
keys = list(cells)
tree = STRtree([cells[k] for k in keys])
zuschlag = {k: [] for k in keys}
laender = [i for i, k in enumerate(keys) if not ist_prov(k)]
prov_i = [i for i, k in enumerate(keys) if ist_prov(k)]
n = {"nur_L": 0, "T_L": 0, "L_L": 0, "keins": 0, "nur_T": 0}
for piece in U:
    idx = [int(i) for i in tree.query(piece.buffer(1e-5), predicate="intersects")]
    ls = [i for i in idx if i in laender]
    ps = [i for i in idx if i in prov_i]
    if ls:
        # das Land mit der längsten gemeinsamen Grenze (bei einem Land: dieses)
        if len(ls) == 1:
            best = ls[0]; n["nur_L" if not ps else "T_L"] += 1
        else:
            b = piece.buffer(1e-5)
            best = max(ls, key=lambda i: cells[keys[i]].boundary.intersection(b).length)
            n["L_L"] += 1
    elif ps:
        best = ps[0] if len(ps) == 1 else max(ps, key=lambda i: cells[keys[i]].boundary.intersection(piece.buffer(1e-5)).length)
        n["nur_T"] += 1
    else:
        best = int(tree.query_nearest(piece)[0])
        n["keins"] += 1
    zuschlag[keys[best]].append(piece)
log("Zuschläge:", n)
out = {}
for k in keys:
    g = cells[k]
    if zuschlag[k]:
        g = flaechen(unary_union([g, *zuschlag[k]]))
    g = flaechen(g.buffer(0))
    out[k] = g
log("Zellen:", len(out))
# Prüfung: Fläche und Überlappung
land_area = sum(g.area for g in out.values())
print("Gesamtfläche km²:", round(land_area * K))
u = unary_union(list(out.values()))
print("Vereinigung km²:", round(u.area * K), "(gleich, wenn keine Überlappung)")
pickle.dump(out, open("zellen.pkl", "wb"))
for k in sorted(out, key=lambda k: -out[k].area)[:12]:
    print(k, round(out[k].area * K))
