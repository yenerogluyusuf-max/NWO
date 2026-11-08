"""Schritt 8: Bezirksflächen (karte-B1/B2.bin, gleiches Format wie karte-L*.bin, Besitzer = Bezirksindex) und Kennzahlen (bezirke.json)."""
# Projektordner (game/): zwei Ebenen über tools/geodaten/karte2/
import os as _os
GAME = _os.environ.get("KARTE_GAME") or _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", "..", ".."))
import json, os, pickle, shutil, struct
import numpy as np
OUT = GAME + "/public/data/karte"
for stufe in (1, 2):
    d = pickle.load(open(f"bogen_B{stufe}.pkl", "rb"))
    parts = []
    for i, f in d["faces"]:
        for p in (f.geoms if hasattr(f, "geoms") else [f]):
            parts.append((i, [p.exterior] + list(p.interiors)))
    buf = bytearray(struct.pack("<4i", 0x4B32, 1, len(parts), len(d["arcs"])))
    for owner, ringe in parts:
        buf += struct.pack("<2i", int(owner), len(ringe))
        for r in ringe:
            c = np.round(np.array(r.coords)[:-1] * 1e5).astype("<i4")
            buf += struct.pack("<i", len(c)) + c.tobytes()
    for t, c in d["arcs"]:
        buf += struct.pack("<2i", t, len(c)) + c.astype("<i4").tobytes()
    open(f"{OUT}/karte-B{stufe}.bin", "wb").write(buf)
    print(f"B{stufe}: {len(parts)} Flächenstücke, {len(d['arcs'])} Bögen, {len(buf) / 1e6:.2f} MB")
shutil.copy("bezirke_info.json", f"{OUT}/bezirke.json")
print("bezirke.json", os.path.getsize(f"{OUT}/bezirke.json") // 1024, "KB")
