"""Schritt 13: Länder der ganzen Welt für den Welt-Rahmen (zusätzlich zur Landzerlegung der Türkei und ihrer Nachbarn).

Die Zerlegung aus den Schritten 1 bis 7 (81 Provinzen und 30 Länder, Küste aus OpenStreetMap) bleibt unverändert und gilt innerhalb des
Rechtecks ROI (19,4 bis 50,6 Grad Ost, 30,9 bis 46,1 Grad Nord). Hier kommen alle übrigen Länder dazu: Natural Earth 10m (gemeinfrei),
auf den Welt-Rahmen zugeschnitten und um das ROI vermindert. Länder, die über das ROI hinausreichen (Russland, Bulgarien, Ägypten,
Saudi-Arabien, Iran, Kasachstan, Griechenland, Ukraine, Rumänien, Libyen u. a.), bekommen ihren äußeren Teil unter demselben Besitzerindex.

Ausgabe (Ordner `--aus`):
  karte-W0.bin, karte-W1.bin   gleiches Format wie karte-L*.bin (siehe 07_ausgabe.py), nur Flächen und Grenzbögen (Typ 5) außerhalb des ROI.
                               Die Welt-Stufe k gehört zur Detailstufe L(k); Stufe L2 benutzt W1 (jenseits des Kerns ist feiner nicht nötig).
  karte.json                   Besitzertabelle erweitert (neue Länder hinten angehängt, die Indizes der bisherigen bleiben), Beschriftungspunkte
                               und Flächen der Länder jetzt über das ganze Land statt nur über den sichtbaren Teil des Höhenmodells.
Eingabe im Arbeitsordner: zellen.pkl, ne_10m_admin_0_countries.geojson, karte.json (bisherige Fassung) und welt.json (Rahmen).
Aufruf: python3 13_welt_laender.py <Arbeitsordner mit den Eingaben> <Ausgabeordner>
"""
import json
import math
import os
import pickle
import struct
import sys
import time

import numpy as np
import shapely
from shapely import STRtree
from shapely.geometry import MultiPolygon, Point, box, shape
from shapely.ops import linemerge, polygonize, polylabel, unary_union
from shapely.prepared import prep
from shapely.validation import make_valid

arbeit, aus = sys.argv[1], sys.argv[2]
os.makedirs(aus, exist_ok=True)
t0 = time.time()


def log(*a):
    print(f"[{time.time() - t0:6.0f}s]", *a, flush=True)


def ist_prov(k):
    return len(k) == 3 and k[0] == "P" and k[1:].isdigit()


def flaechen(g):
    if g is None or g.is_empty:
        return MultiPolygon()
    if g.geom_type == "Polygon":
        return MultiPolygon([g])
    if g.geom_type == "MultiPolygon":
        return g
    teile = []
    for t in getattr(g, "geoms", []):
        if t.geom_type == "Polygon":
            teile.append(t)
        elif t.geom_type == "MultiPolygon":
            teile.extend(t.geoms)
    return MultiPolygon(teile)


meta_welt = json.load(open(f"{arbeit}/welt.json"))
RAHMEN = box(-180, meta_welt["lat0"], 180, meta_welt["lat1"])
ROI = box(19.4, 30.9, 50.6, 46.1)
KM_GRAD = 111.0

alt = json.load(open(f"{arbeit}/karte.json"))
# zellen.pkl schreibt Schritt 4 selbst (README: Zwischenergebnisse stammen nie aus fremder Quelle), daher ist pickle hier unbedenklich
innen = pickle.load(open(f"{arbeit}/zellen.pkl", "rb"))
index = {}
for i, b in enumerate(alt["besitzer"]):
    if b["k"] == "l":
        index[b["iso"]] = i
    elif b["k"] == "t":
        tur_idx = i
log("bisherige Besitzer:", len(alt["besitzer"]), "Länder:", len(index))

# --- Natural Earth: außerhalb des ROI
TAUSCH = {"CNM": "CYP", "ESB": "CYP", "WSB": "CYP"}
LAND_KURZ = {
    "CYP": "Zypern", "CYN": "Nordzypern", "BIH": "Bosnien und Herzegowina", "MKD": "Nordmazedonien", "MDA": "Moldau",
    "PSX": "Palästina", "SAU": "Saudi-Arabien", "KOS": "Kosovo", "ISR": "Israel", "IRQ": "Irak", "IRN": "Iran",
    "CHN": "China", "COD": "DR Kongo", "COG": "Rep. Kongo", "CAF": "Zentralafrika", "ARE": "Emirate", "GBR": "Großbritannien",
    "USA": "Vereinigte Staaten", "PRK": "Nordkorea", "KOR": "Südkorea", "TLS": "Osttimor", "CIV": "Elfenbeinküste",
    "SDS": "Südsudan", "SWZ": "Eswatini", "LKA": "Sri Lanka", "PNG": "Papua-Neuguinea", "DOM": "Dominikan. Rep.",
}
ne = json.load(open(f"{arbeit}/ne_10m_admin_0_countries.geojson"))["features"]
aussen = {}
namen = {}
for f in ne:
    p = f["properties"]
    iso = p["ADM0_A3"]
    if iso in ("TUR", "ATA"):
        continue
    iso = TAUSCH.get(iso, iso)
    g = shape(f["geometry"])
    if not g.is_valid:
        g = make_valid(g)
    g = flaechen(g.intersection(RAHMEN))
    if g.is_empty:
        continue
    teil = flaechen(g.difference(ROI))
    voll = g
    if iso in aussen or iso in namen:
        voll = flaechen(unary_union([namen[iso]["voll"], g]))
        teil = flaechen(unary_union([aussen.get(iso, MultiPolygon()), teil]))
    if not teil.is_empty:
        aussen[iso] = teil
    namen[iso] = {"voll": voll, "de": p["NAME_DE"], "en": p["NAME_EN"], "rang": p["LABELRANK"], "pop": p["POP_EST"]}
log("Länder im Rahmen:", len(namen), "davon mit Teil außerhalb des ROI:", len(aussen))

# neue Besitzer hinten anhängen, in fester Reihenfolge
neu = sorted(iso for iso in aussen if iso not in index)
besitzer = list(alt["besitzer"])
for iso in neu:
    index[iso] = len(besitzer)
    besitzer.append({"k": "l", "iso": iso})
log("neue Länder:", len(neu))

# --- Bögen: alle Ränder der äußeren Zellen vernoden, Typ nach Anliegern
polys, schluessel = [], []
for iso, g in aussen.items():
    for p in g.geoms:
        polys.append(p)
        schluessel.append(iso)
baum = STRtree(polys)
rand_geoms = [p.boundary for p in polys]
ringe = []
for r in rand_geoms:
    ringe.extend(r.geoms if hasattr(r, "geoms") else [r])
log("Randlinien:", len(ringe), "Punkte:", sum(len(r.coords) for r in ringe))
vernodet = unary_union(ringe)
bogen = linemerge(vernodet)
bogen = list(bogen.geoms) if hasattr(bogen, "geoms") else [bogen]
log("Bögen:", len(bogen))


def anlieger(arc):
    c = arc.coords
    n = len(c)
    # Kurze Bögen über ihren Mittelpunkt einordnen (siehe 06_bogen.py)
    proben = [Point(c[i]) for i in sorted({1, n // 2, n - 2})] if n > 3 else [arc.interpolate(0.5, normalized=True)]
    mengen = []
    for pt in proben:
        treffer = baum.query(pt.buffer(4e-7), predicate="intersects")
        mengen.append({schluessel[int(j)] for j in treffer if rand_geoms[int(j)].distance(pt) < 1.5e-6})
    m = set.intersection(*mengen) if mengen else set()
    return m if m else max(mengen, key=len)


typen = [5 if len(anlieger(a)) >= 2 else 1 for a in bogen]
log("Grenzbögen (Typ 5):", sum(1 for t in typen if t == 5), "Küsten und Rand (Typ 1):", sum(1 for t in typen if t == 1))

STUFEN = [(0, 0.06), (1, 0.02)]  # Welt-Stufe, Toleranz in Grad
MAGIC = 0x4B32
for stufe, tol in STUFEN:
    vereinfacht = shapely.simplify(np.array(bogen, dtype=object), tol, preserve_topology=True)
    arcs, alle = [], []
    for a, t in zip(vereinfacht, typen):
        minx, miny, maxx, maxy = a.bounds
        if a.is_closed and max(maxx - minx, maxy - miny) < 2.2 * tol:
            continue  # winzige Insel
        alle.append(a)
        if t == 5 and a.length >= tol:
            arcs.append((5, np.round(np.array(a.coords) * 1e5).astype(np.int32)))
    gesicht = []
    verloren = 0
    for f in polygonize(unary_union(alle)):
        rp = f.representative_point()
        hit = baum.query(rp, predicate="within")
        if len(hit) == 0:
            verloren += 1
            continue
        gesicht.append((schluessel[int(hit[0])], f))
    buf = bytearray()
    teile = []
    for iso, f in gesicht:
        teile.append((index[iso], [f.exterior] + list(f.interiors)))
    buf += struct.pack("<4i", MAGIC, 1, len(teile), len(arcs))
    for owner, rs in teile:
        buf += struct.pack("<2i", owner, len(rs))
        for r in rs:
            c = np.round(np.array(r.coords)[:-1] * 1e5).astype("<i4")
            buf += struct.pack("<i", len(c)) + c.tobytes()
    for t, c in arcs:
        buf += struct.pack("<2i", t, len(c)) + c.astype("<i4").tobytes()
    open(f"{aus}/karte-W{stufe}.bin", "wb").write(buf)
    log(f"W{stufe} tol={tol}: {len(teile)} Flächenstücke (verworfen {verloren}), {len(arcs)} Bögen, {len(buf) / 1e6:.2f} MB")

# --- Besitzerangaben und Beschriftungspunkte über das ganze Land
def anker(g, mind=0.10, n=48):
    g = g.simplify(0.03, preserve_topology=True)
    if g.is_empty:
        return []
    ausdehnung = math.sqrt(g.area)
    schritt = max(0.25, min(1.0, ausdehnung / 40.0))
    sep2 = max(0.36, (schritt * 1.6) ** 2)
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
        if all((x - a) ** 2 + (y - b) ** 2 > sep2 for _, a, b in out):
            out.append((d, x, y))
        if len(out) >= n:
            break
    return [v for d, x, y in out for v in (round(x, 2), round(y, 2), round(d, 2))]


ank = dict(alt.get("anker", {}))
for iso, info in namen.items():
    voll = flaechen(info["voll"])
    teile = sorted(voll.geoms, key=lambda x: -x.area)
    if not teile:
        continue
    try:
        pt = polylabel(teile[0], 0.02)
        lon, lat = pt.x, pt.y
    except Exception:  # noqa: BLE001
        pt = teile[0].representative_point()
        lon, lat = pt.x, pt.y
    # Für Länder im ROI bleiben die bisherigen Zellen (OSM-Küste) maßgeblich; sie werden mit dem äußeren Teil vereinigt
    if iso in innen and iso in aussen:
        voll = flaechen(unary_union([innen[iso], aussen[iso]]))
    elif iso in innen:
        voll = innen[iso]
    kl = lat
    flaeche = voll.area * KM_GRAD**2 * math.cos(math.radians(kl))
    name = LAND_KURZ.get(iso, info["de"])
    eintrag = {"k": "l", "iso": iso, "name": name, "lon": round(lon, 3), "lat": round(lat, 3), "flaeche": round(flaeche), "rang": info["rang"], "einwohner": info["pop"]}
    if iso in index:
        besitzer[index[iso]] = eintrag
    if iso == "TUR":
        continue
    # Beschriftungspunkte nur für Länder ab einer sinnvollen Größe
    if flaeche > 400:
        ank[iso] = anker(voll)
for iso in innen:
    if not ist_prov(iso) and iso not in namen:
        log("Hinweis: Zelle ohne Natural-Earth-Land:", iso)

meta = dict(alt)
meta["besitzer"] = besitzer
meta["anker"] = ank
meta["quelle"] = alt["quelle"] + "; Welt-Rahmen: Länder Natural Earth 10m (gemeinfrei), Gelände AWS Terrain Tiles (Terrarium, Zoom 5; SRTM, GMTED, ETOPO1 u. a.)"
meta["welt"] = {"stufen": ["karte-W0.bin", "karte-W1.bin", "karte-W1.bin"]}
json.dump(meta, open(f"{aus}/karte.json", "w"), ensure_ascii=False, separators=(",", ":"))
log("Besitzer gesamt:", len(besitzer), "(Länder:", sum(1 for b in besitzer if b["k"] == "l"), ")")
