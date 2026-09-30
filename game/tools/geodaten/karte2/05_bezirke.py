"""Schritt 5: Bezirke (geoBoundaries ADM2) als Unterteilung der Provinzzellen: an der Provinzgrenze beschnitten, Lücken zugeschlagen.
Ausgabe: bezirke_zellen.pkl  {index: MultiPolygon}  (Index = Reihenfolge in bezirke_info.json; Schlüssel (Kfz-Kennziffer, Name))
         bezirke_info.json  Kennzahlen je Bezirk (aus dem früheren Auszug public/data/osm/bezirke.json, ohne Geometrie)
"""
# Projektordner (game/): zwei Ebenen über tools/geodaten/karte2/
import os as _os
GAME = _os.environ.get("KARTE_GAME") or _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", "..", ".."))
import json, pickle, time
from shapely import STRtree
from shapely.geometry import shape, MultiPolygon
from shapely.ops import unary_union
from shapely.validation import make_valid

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

cells = pickle.load(open("zellen.pkl", "rb"))
prov = {int(k[1:]): g for k, g in cells.items() if len(k) == 3 and k[0] == "P" and k[1:].isdigit()}
alt = json.load(open(f"{GAME}/public/data/osm/bezirke.json"))["bezirke"]
index = {(b["plaka"], b["name"]): i for i, b in enumerate(alt)}
info = [{k: v for k, v in b.items() if k != "rings"} for b in alt]

adm2 = json.load(open("tur_adm2.geojson"))["features"]
plist = sorted(prov)
ptree = STRtree([prov[p] for p in plist])
je_prov = {p: [] for p in plist}
fehlt = 0
benutzt = set()
for f in adm2:
    g = shape(f["geometry"])
    if not g.is_valid:
        g = make_valid(g)
    g = flaechen(g)
    if g.is_empty:
        continue
    rp = g.representative_point()
    hit = ptree.query(rp, predicate="within")
    if len(hit) == 0:
        # größte Überdeckung
        cand = ptree.query(g)
        if len(cand) == 0:
            fehlt += 1
            continue
        hit = [max(cand, key=lambda i: prov[plist[i]].intersection(g).area)]
    p = plist[int(hit[0])]
    name = f["properties"]["shapeName"]
    if (p, name) in index:
        i = index[(p, name)]
    else:
        # der frühere Auszug hat den Bezirk einer Nachbarprovinz zugeschlagen: über den Namen finden
        gleich = [j for (pl, nm), j in index.items() if nm == name and j not in benutzt]
        if not gleich:
            fehlt += 1
            continue
        i = gleich[0]
    benutzt.add(i)
    if info[i]["plaka"] != p:
        info[i]["plaka"] = p
    je_prov[p].append((i, g))
log("Bezirke zugeordnet, ohne Kennzahlen:", fehlt, "Provinz geändert:", sum(1 for i, b in enumerate(info) if b["plaka"] != alt[i]["plaka"]))
json.dump(info, open("bezirke_info.json", "w"), ensure_ascii=False, separators=(",", ":"))

ergebnis = {}
for p in plist:
    P = prov[p]
    liste = sorted(je_prov[p], key=lambda x: x[1].area)
    belegt = None
    teile = {}
    for i, g in liste:
        dd = flaechen(g.intersection(P))
        if belegt is not None and not dd.is_empty:
            dd = flaechen(dd.difference(belegt))
        teile[i] = dd
        belegt = dd if belegt is None else unary_union([belegt, dd])
    rest = flaechen(P.difference(belegt)) if belegt is not None else P
    stuecke = list(rest.geoms)
    if stuecke:
        keys = [i for i in teile if not teile[i].is_empty]
        tree = STRtree([teile[i] for i in keys])
        for s in stuecke:
            idx = tree.query(s.buffer(1e-5), predicate="intersects")
            if len(idx):
                best = max(idx, key=lambda j: teile[keys[int(j)]].boundary.intersection(s.buffer(1e-5)).length)
            else:
                best = int(tree.query_nearest(s)[0])
            teile[keys[int(best)]] = flaechen(unary_union([teile[keys[int(best)]], s]))
    for i, g in teile.items():
        ergebnis[i] = flaechen(g.buffer(0))
    a_p = P.area * K
    a_b = sum(g.area for i, g in teile.items()) * K
    if abs(a_p - a_b) > 1:
        log("Abweichung Provinz", p, round(a_p), round(a_b))
log("Bezirkszellen:", len(ergebnis), "von", len(alt))
leer = [i for i in range(len(alt)) if i not in ergebnis or ergebnis[i].is_empty]
log("ohne Fläche:", len(leer), [alt[i]["name"] for i in leer][:10])
pickle.dump(ergebnis, open("bezirke_zellen.pkl", "wb"))
