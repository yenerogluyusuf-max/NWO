"""Schritt 9: Küsten-Distanzfeld (Signed Distance Field) auf dem Raster des Höhenmodells.

Das Land (OSM-Küste in voller Auflösung, aus zellen.pkl) wird mit doppelter Auflösung gerastert, tuchweise mit einer exakten
euklidischen Distanztransformation in ein vorzeichenbehaftetes Feld verwandelt (positiv an Land, negativ auf See), auf die
Auflösung des Höhenmodells verkleinert und in 8 Bit gespeichert:  wert = 128 + 5 · Abstand in Höhenmodellpunkten
(± 25 Punkte, etwa ± 12 km; Auflösung 0,2 Punkte).
Die Datei ist die rohe Bytefolge (Zeilen von Nord nach Süd), gzip-gepackt (kueste-sdf.bin.gz). Der Shader liest das Feld linear und zeichnet daraus die Küstenlinie scharf bei jeder Vergrößerung.
"""
# Projektordner (game/): zwei Ebenen über tools/geodaten/karte2/
import os as _os
GAME = _os.environ.get("KARTE_GAME") or _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", "..", ".."))
import json, math, pickle, time
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

Image.MAX_IMAGE_PIXELS = None
t0 = time.time()
def log(*a):
    print(f"[{time.time() - t0:6.0f}s]", *a, flush=True)

meta = json.load(open(f"{GAME}/public/data/relief-z8.json"))
W, H = meta["width"], meta["height"]
lon0, lon1, lat0, lat1 = meta["lon0"], meta["lon1"], meta["lat0"], meta["lat1"]
S = 2
W2, H2 = W * S, H * S
merc = lambda lat: math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
my1, my0 = merc(lat1), merc(lat0)

def xy(coords):
    c = np.asarray(coords)
    x = (c[:, 0] - lon0) / (lon1 - lon0) * W2 - 0.5
    lat = np.radians(c[:, 1])
    m = np.log(np.tan(np.pi / 4 + lat / 2))
    y = (my1 - m) / (my1 - my0) * H2 - 0.5
    return list(zip(x.tolist(), y.tolist()))

cells = pickle.load(open("zellen.pkl", "rb"))
img = Image.new("L", (W2, H2), 0)
dr = ImageDraw.Draw(img)
n = 0
for g in cells.values():
    for p in g.geoms:
        dr.polygon(xy(p.exterior.coords), fill=255)
        for i in p.interiors:
            dr.polygon(xy(i.coords), fill=0)
        n += 1
log("gerastert:", n, "Polygone", img.size)
mask = np.asarray(img) > 127
del img, dr

CAP = 52.0       # Zellen bei doppelter Auflösung (26 Punkte)
PAD = 64
TILE = 1536
sd = np.zeros((H2, W2), dtype=np.float32)
for y in range(0, H2, TILE):
    for x in range(0, W2, TILE):
        y0, y1 = max(0, y - PAD), min(H2, y + TILE + PAD)
        x0, x1 = max(0, x - PAD), min(W2, x + TILE + PAD)
        m = mask[y0:y1, x0:x1]
        if m.all():
            v = np.full(m.shape, CAP, dtype=np.float32)
        elif not m.any():
            v = np.full(m.shape, -CAP, dtype=np.float32)
        else:
            din = ndi.distance_transform_edt(m).astype(np.float32)
            dout = ndi.distance_transform_edt(~m).astype(np.float32)
            v = np.where(m, din - 0.5, -(dout - 0.5))
        v = np.clip(v, -CAP, CAP)
        sd[y:y + TILE, x:x + TILE] = v[y - y0:y - y0 + min(TILE, H2 - y), x - x0:x - x0 + min(TILE, W2 - x)]
log("Distanzfeld berechnet")
del mask
# auf die Auflösung des Höhenmodells verkleinern; Abstand in Höhenmodellpunkten
klein = sd.reshape(H, S, W, S).mean(axis=(1, 3)) / S
q = np.clip(np.round(128 + klein * 5.0), 0, 255).astype(np.uint8)
import gzip
with gzip.open(f"{GAME}/public/data/karte/kueste-sdf.bin.gz", "wb", compresslevel=9) as f:
    f.write(q.tobytes())
open(f"{GAME}/public/data/karte/kueste-sdf.json", "w").write(json.dumps({"width": W, "height": H, "skala": 5.0, "null": 128, "einheit": "Höhenmodellpunkte"}))
log("gespeichert", q.shape)
