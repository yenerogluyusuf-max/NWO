#!/usr/bin/env python3
"""Höhenmodell der Spielkarte aus den AWS Terrain Tiles (Terrarium).

Die alte Datei war auf 1800 x 1120 heruntergerechnet (etwa 1,5 km je Punkt).
Hier wird der Ausschnitt in Web-Mercator bei Zoom 8 (etwa 475 m je Punkt auf 39 Grad Nord)
ohne Verlust zusammengesetzt. Ergebnis: public/data/relief-z8.bin (Int16, Meter, little-endian,
Zeilen von Nord nach Süd) und public/data/relief-z8.json (Metadaten wie relief.json).

Quelle: AWS Terrain Tiles, https://registry.opendata.aws/terrain-tiles/ (SRTM, GMTED, ETOPO1 u. a.).
Aufruf: python3 tools/geodaten/relief.py [zoom]
"""
import io
import json
import math
import os
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from PIL import Image

LON0, LON1, LAT0, LAT1 = 19.5, 50.5, 31.0, 46.0
Z = int(sys.argv[1]) if len(sys.argv) > 1 else 8
N = 2**Z
CACHE = os.path.expanduser(f"~/.cache/staatsraeson-geodaten/terrarium-z{Z}")
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "data")
os.makedirs(CACHE, exist_ok=True)


def tile_x(lon: float) -> float:
    return (lon + 180.0) / 360.0 * N


def tile_y(lat: float) -> float:
    r = math.radians(lat)
    return (1.0 - math.log(math.tan(r) + 1.0 / math.cos(r)) / math.pi) / 2.0 * N


x0f, x1f = tile_x(LON0), tile_x(LON1)
y0f, y1f = tile_y(LAT1), tile_y(LAT0)  # y wächst nach Süden
tx0, tx1 = int(math.floor(x0f)), int(math.floor(x1f))
ty0, ty1 = int(math.floor(y0f)), int(math.floor(y1f))
print(f"Zoom {Z}: Kacheln x {tx0}..{tx1}, y {ty0}..{ty1} = {(tx1 - tx0 + 1) * (ty1 - ty0 + 1)} Stück")


def fetch(xy):
    x, y = xy
    path = os.path.join(CACHE, f"{x}_{y}.png")
    if not os.path.exists(path):
        url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{x}/{y}.png"
        for attempt in range(4):
            try:
                with urllib.request.urlopen(url, timeout=30) as r:
                    data = r.read()
                with open(path, "wb") as f:
                    f.write(data)
                break
            except Exception as e:  # noqa: BLE001
                if attempt == 3:
                    raise RuntimeError(f"Kachel {url}: {e}")
    return xy, np.array(Image.open(path).convert("RGB"), dtype=np.int32)


tiles = [(x, y) for y in range(ty0, ty1 + 1) for x in range(tx0, tx1 + 1)]
with ThreadPoolExecutor(12) as ex:
    got = dict(ex.map(fetch, tiles))

W = (tx1 - tx0 + 1) * 256
H = (ty1 - ty0 + 1) * 256
mosaic = np.zeros((H, W), dtype=np.int16)
for (x, y), rgb in got.items():
    elev = rgb[..., 0] * 256 + rgb[..., 1] + rgb[..., 2] / 256.0 - 32768.0
    mosaic[(y - ty0) * 256 : (y - ty0 + 1) * 256, (x - tx0) * 256 : (x - tx0 + 1) * 256] = np.round(elev).astype(np.int16)

# auf das Kartenrechteck zuschneiden
px0 = int(round((x0f - tx0) * 256))
px1 = int(round((x1f - tx0) * 256))
py0 = int(round((y0f - ty0) * 256))
py1 = int(round((y1f - ty0) * 256))
crop = mosaic[py0:py1, px0:px1]
h, w = crop.shape
print(f"Ausschnitt {w} x {h} Punkte, Höhe {int(crop.min())} .. {int(crop.max())} m")

os.makedirs(OUT, exist_ok=True)
crop.astype("<i2").tofile(os.path.join(OUT, f"relief-z{Z}.bin"))
meta = {
    "width": int(w),
    "height": int(h),
    "lon0": LON0,
    "lon1": LON1,
    "lat0": LAT0,
    "lat1": LAT1,
    "projection": "web-mercator",
    "einheit": "Meter, Int16 little-endian, Zeilen von Nord nach Süd",
    "quelle": f"AWS Terrain Tiles (Terrarium, Zoom {Z}), aus SRTM, GMTED, ETOPO1 u. a.; https://registry.opendata.aws/terrain-tiles/",
    "zoom": Z,
}
with open(os.path.join(OUT, f"relief-z{Z}.json"), "w") as f:
    json.dump(meta, f, indent=1, ensure_ascii=False)
print("geschrieben:", os.path.join(OUT, f"relief-z{Z}.bin"), f"{os.path.getsize(os.path.join(OUT, f'relief-z{Z}.bin')) / 1e6:.1f} MB")
