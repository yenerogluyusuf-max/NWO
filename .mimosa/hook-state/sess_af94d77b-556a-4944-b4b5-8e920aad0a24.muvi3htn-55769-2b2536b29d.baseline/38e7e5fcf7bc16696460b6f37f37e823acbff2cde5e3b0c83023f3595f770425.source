#!/usr/bin/env python3
"""Basisrelief und Küstenfeld der ganzen Welt für die Spielkarte (Welt-Rahmen, Web-Mercator).

Der Welt-Rahmen reicht über alle Längen und über die Kachelzeilen 4 bis 22 bei Zoom 5 (Breite etwa 79,2° N bis 61,9° S).
Das Gelände der Türkei (Kern, public/data/relief-z8.bin) bleibt unverändert und liegt als feinere Stufe darüber.

Ausgabe in public/data/karte/ (oder dem Ordner nach --aus):
  welt-hoehe.bin.gz    8 Bit je Punkt, Höhe über dem Meer in der Wurzelkodierung  byte = round(255 * sqrt(clip(h, 0, 8900) / 8900)),
                       Meer = 0 (die Meerestiefe liefert im Spiel das Küstenfeld; Tiefenwerte werden nicht gespeichert)
  welt-kueste.bin.gz   8 Bit je Punkt, Abstand zur Küste in Punkten (positiv an Land), byte = round(128 + 4 * Abstand), also ±32 Punkte
  welt.json            Maße, Rahmen, Quellen

Quellen: AWS Terrain Tiles (Terrarium, Zoom 5; aus SRTM, GMTED, ETOPO1 u. a.; https://registry.opendata.aws/terrain-tiles/);
Küste: Natural Earth 10m Länder und Seen (gemeinfrei). Der Küstenabstand wird mit Teilpunktgenauigkeit aus den Polygonen gerechnet
(nur in Küstennähe, sonst gilt der Abstand zum nächsten Küstenpunkt).

Aufruf: python3 welt_gelaende.py --ne <ne_10m_admin_0_countries.geojson> --seen <ne_10m_lakes.geojson> [--zoom 5] [--aus <Ordner>]
"""
import argparse
import gzip
import io
import json
import math
import os
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.spatial import cKDTree
from shapely.geometry import box, shape
from shapely.ops import unary_union
from shapely.validation import make_valid

ap = argparse.ArgumentParser()
ap.add_argument("--ne", required=True)
ap.add_argument("--seen", required=True)
ap.add_argument("--zoom", type=int, default=5)
ap.add_argument("--aus", default=os.path.join(os.path.dirname(__file__), "..", "..", "public", "data", "karte"))
args = ap.parse_args()
Z = args.zoom
N = 2**Z
TY0, TY1 = 4 * 2 ** (Z - 5), 23 * 2 ** (Z - 5)  # Kachelzeilen [TY0, TY1)
CACHE = os.path.expanduser(f"~/.cache/staatsraeson-geodaten/terrarium-z{Z}")
os.makedirs(CACHE, exist_ok=True)
os.makedirs(args.aus, exist_ok=True)
t0 = time.time()


def log(*a):
    print(f"[{time.time() - t0:5.0f}s]", *a, flush=True)


def lat_von_zeile(y: float) -> float:
    return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / N))))


LAT1, LAT0 = lat_von_zeile(TY0), lat_von_zeile(TY1)
W, H = N * 256, (TY1 - TY0) * 256
log(f"Zoom {Z}: {W} x {H} Punkte, Breite {LAT0:.3f} .. {LAT1:.3f}")


def fetch(xy):
    x, y = xy
    path = os.path.join(CACHE, f"{x}_{y}.png")
    if not os.path.exists(path):
        url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{x}/{y}.png"
        for versuch in range(5):
            try:
                with urllib.request.urlopen(url, timeout=40) as r:
                    data = r.read()
                with open(path, "wb") as f:
                    f.write(data)
                break
            except Exception as e:  # noqa: BLE001
                if versuch == 4:
                    raise RuntimeError(f"Kachel {url}: {e}")
    return xy, np.array(Image.open(path).convert("RGB"), dtype=np.int32)


kacheln = [(x, y) for y in range(TY0, TY1) for x in range(N)]
with ThreadPoolExecutor(12) as ex:
    got = dict(ex.map(fetch, kacheln))
log("Kacheln geladen:", len(got))
hoehe = np.zeros((H, W), dtype=np.int16)
for (x, y), rgb in got.items():
    e = rgb[..., 0] * 256 + rgb[..., 1] + rgb[..., 2] / 256.0 - 32768.0
    hoehe[(y - TY0) * 256 : (y - TY0 + 1) * 256, x * 256 : (x + 1) * 256] = np.round(e).astype(np.int16)
del got
log("Höhe", int(hoehe.min()), "..", int(hoehe.max()), "m")

# --- Land aus Natural Earth, Seen abgezogen
rahmen = box(-180, LAT0, 180, LAT1)


def gueltig(g):
    return g if g.is_valid else make_valid(g)


laender = [gueltig(shape(f["geometry"])) for f in json.load(open(args.ne))["features"]]
land = unary_union(laender).intersection(rahmen)
seen = []
for f in json.load(open(args.seen))["features"]:
    g = gueltig(shape(f["geometry"]))
    if g.area > 0.12:  # nur große Seen (Quadratgrad)
        seen.append(g)
if seen:
    land = land.difference(unary_union(seen))
log("Land vereinigt, Flächen:", len(getattr(land, "geoms", [land])))


def merc_y(lat):
    r = np.radians(lat)
    return np.log(np.tan(r) + 1.0 / np.cos(r))


def zu_pixel(xs, ys):
    px = (np.asarray(xs) + 180.0) / 360.0 * W
    py = (1 - merc_y(np.asarray(ys)) / math.pi) / 2 * (N * 256) - TY0 * 256
    return px, py


maske_img = Image.new("L", (W, H), 0)
zeichner = ImageDraw.Draw(maske_img)
ringe_px = []
for poly in getattr(land, "geoms", [land]):
    if poly.geom_type != "Polygon":
        continue
    px, py = zu_pixel(*np.array(poly.exterior.coords).T)
    zeichner.polygon(list(zip(px, py)), fill=1)
    ringe_px.append(np.stack([px, py], 1))
    for r in poly.interiors:
        qx, qy = zu_pixel(*np.array(r.coords).T)
        zeichner.polygon(list(zip(qx, qy)), fill=0)
        ringe_px.append(np.stack([qx, qy], 1))
maske = np.array(maske_img, dtype=bool)
del maske_img
log("Maske:", f"{maske.mean() * 100:.1f} % Land")

# --- Küstenabstand: grob aus der Abstandstransformation, nahe der Küste exakt aus den Polygonlinien
innen = ndimage.distance_transform_edt(maske).astype(np.float32)
aussen = ndimage.distance_transform_edt(~maske).astype(np.float32)
sd = np.where(maske, innen - 0.5, -(aussen - 0.5)).astype(np.float32)
del innen, aussen
punkte = []
for r in ringe_px:
    a = r[:-1]
    b = r[1:]
    seg = np.hypot(*(b - a).T)
    for i in np.nonzero(seg > 0)[0]:
        n = max(1, int(math.ceil(seg[i] / 0.4)))
        t = (np.arange(n) / n)[:, None]
        punkte.append(a[i] + t * (b[i] - a[i]))
punkte = np.concatenate(punkte)
baum = cKDTree(punkte)
log("Küstenpunkte:", len(punkte))
nah = np.abs(sd) < 3.5
ys, xs = np.nonzero(nah)
d, _ = baum.query(np.stack([xs + 0.5, ys + 0.5], 1), workers=-1)
sd[ys, xs] = np.where(maske[ys, xs], d, -d).astype(np.float32)
log("Genaue Küstenabstände:", len(xs))
kb = np.clip(np.round(128 + 4 * sd), 0, 255).astype(np.uint8)
del sd, nah

# --- Höhe, Wurzelkodierung; Meer null
h = np.clip(hoehe, 0, 8900).astype(np.float32)
hb = np.round(255 * np.sqrt(h / 8900.0)).astype(np.uint8)
hb[~maske] = 0
del h


def gz(pfad, arr):
    with gzip.open(pfad, "wb", compresslevel=9) as f:
        f.write(arr.tobytes())
    log(os.path.basename(pfad), f"{os.path.getsize(pfad) / 1e6:.2f} MB (roh {arr.nbytes / 1e6:.1f} MB)")


gz(os.path.join(args.aus, "welt-hoehe.bin.gz"), hb)
gz(os.path.join(args.aus, "welt-kueste.bin.gz"), kb)
meta = {
    "width": int(W),
    "height": int(H),
    "lon0": -180.0,
    "lon1": 180.0,
    "lat0": LAT0,
    "lat1": LAT1,
    "projection": "web-mercator",
    "zoom": Z,
    "hoehe": "8 Bit, byte = round(255 * sqrt(clip(h, 0, 8900) / 8900)); Meer = 0",
    "kueste": "8 Bit, byte = round(128 + 4 * Abstand in Punkten), positiv an Land",
    "quelle": "Gelände: AWS Terrain Tiles (Terrarium, Zoom %d), aus SRTM, GMTED, ETOPO1 u. a.; https://registry.opendata.aws/terrain-tiles/. Küste: Natural Earth 10m (gemeinfrei)" % Z,
}
with open(os.path.join(args.aus, "welt.json"), "w") as f:
    json.dump(meta, f, indent=1, ensure_ascii=False)
log("fertig")
