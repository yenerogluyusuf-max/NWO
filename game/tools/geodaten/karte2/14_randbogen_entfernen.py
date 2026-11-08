"""Schritt 14: Grenzbögen entfernen, die nur am Rand des Ausschnitts (ROI) liegen.

Die Landzerlegung ist auf das Rechteck ROI (19,4 bis 50,6 Grad Ost, 30,9 bis 46,1 Grad Nord) zugeschnitten. Kurze Bögen entlang dieses Rechtecks
berühren mit ihren Endpunkten ein Nachbarland und wurden deshalb als Landesgrenze (Typ 5) eingeordnet. Auf der früheren Karte lag der Rand an der
Kante der Karte und blieb unsichtbar; im Welt-Rahmen zeichneten sie ein Rechteck mitten ins Land. Dieses Skript schreibt die Dateien
karte-L*.bin und karte-W*.bin ohne diese Bögen neu (Flächen unverändert).
Aufruf: python3 14_randbogen_entfernen.py <Ordner mit den .bin-Dateien>
"""
import glob
import os
import struct
import sys

import numpy as np

ROI = (19.4, 30.9, 50.6, 46.1)  # lon0, lat0, lon1, lat1
TOL = 2e-3


def auf_rand(c: np.ndarray) -> bool:
    lon, lat = c[:, 0] / 1e5, c[:, 1] / 1e5
    for kol, v in ((lon, ROI[0]), (lon, ROI[2]), (lat, ROI[1]), (lat, ROI[3])):
        if (np.abs(kol - v) < TOL).all():
            return True
    return False


ordner = sys.argv[1]
for pfad in sorted(glob.glob(os.path.join(ordner, "karte-[LW][0-9].bin"))):
    a = np.fromfile(pfad, dtype="<i4")
    n_fl, n_b = int(a[2]), int(a[3])
    p = 4
    for _ in range(n_fl):
        nr = int(a[p + 1])
        p += 2
        for _ in range(nr):
            p += 1 + 2 * int(a[p])
    kopf_flaechen = a[4:p]
    bogen = []
    entfernt = 0
    for _ in range(n_b):
        t, n = int(a[p]), int(a[p + 1])
        c = a[p + 2 : p + 2 + 2 * n].reshape(-1, 2)
        p += 2 + 2 * n
        if t == 5 and auf_rand(c):
            entfernt += 1
            continue
        bogen.append((t, c))
    assert p == len(a), (pfad, p, len(a))
    out = [np.array([a[0], a[1], n_fl, len(bogen)], dtype="<i4"), kopf_flaechen.astype("<i4")]
    for t, c in bogen:
        out.append(np.array([t, len(c)], dtype="<i4"))
        out.append(c.astype("<i4").ravel())
    np.concatenate(out).astype("<i4").tofile(pfad)
    print(f"{os.path.basename(pfad)}: {entfernt} Randbögen entfernt, {len(bogen)} Bögen bleiben")
