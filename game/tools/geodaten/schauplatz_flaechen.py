"""Flächen der Kriegsregionen (data/schauplaetze.ts) aus echten Verwaltungsgrenzen (Welle 3, K2; krieg.md Schritt 4).

Jede Region ist genau eine Verwaltungseinheit (oder, in Griechenland, die Gemeinden einer Regionaleinheit). Die Umrisse kommen aus freien
Quellen und werden für die Karte vereinfacht; die Fläche rechnet das Skript aus der unvereinfachten Grenze nach (flächentreue Projektion auf
der Kugel mit dem authalischen Erdradius) und vergleicht sie mit dem Flächenfeld der Quelle, wo es eines gibt.

Quellen (Abruf 08.11.2026; die Rohdaten werden nicht eingecheckt, sie liegen nach dem Herunterladen in einem Ordner ROH):
  Syrien    OCHA COD-AB „Syrian Arab Republic – Subnational Administrative Boundaries“, Ebene 2 (Distrikte), Stand 17.12.2020, v02,
            UNCS/OCHA, Lizenz CC BY 3.0 IGO. https://data.humdata.org/dataset/cod-ab-syr  → ROH/syr/syr_admin2.geojson
  Irak      OCHA COD-AB „Iraq – Subnational Administrative Boundaries“, Ebene 2 (Distrikte), Stand 03.06.2019, v01, Iraq Central
            Statistics Office, Lizenz CC BY 3.0 IGO. https://data.humdata.org/dataset/cod-ab-irq  → ROH/irq/irq_admin2.geojson
  Iran      OCHA COD-AB „Iran (Islamic Republic of) – Subnational Administrative Boundaries“, Ebene 2 (Schahrestan), Stand 14.05.2019, v01,
            UNHCR, Lizenz CC BY 3.0 IGO. https://data.humdata.org/dataset/cod-ab-irn  → ROH/irn/irn_admin2.geojson
  Armenien  OCHA COD-AB „Armenia – Subnational Administrative Boundaries“, Ebene 1 (Marz und Eriwan), Stand 02.10.2023, v01, Regierung
            Armeniens, Lizenz CC BY 3.0 IGO. https://data.humdata.org/dataset/cod-ab-arm  → ROH/arm/arm_admin1.geojson
  Griechenland  geoBoundaries gbOpen GRC ADM3 (Gemeinden nach dem Kallikratis-Gesetz 3852/2010), Stand 2010, Wikimedia Commons, Lizenz CC0 1.0.
            https://www.geoboundaries.org/api/current/gbOpen/GRC/ADM3/  → ROH/grc_adm3.geojson
            Die Regionaleinheiten (περιφερειακές ενότητες) entstehen als Vereinigung ihrer Gemeinden, Zuordnung nach Gesetz 3852/2010.
  Zypern    geoBoundaries gbOpen CYP ADM1 (Bezirke), Stand 2017, OpenStreetMap/Wambacher, Lizenz ODbL 1.0 (© OpenStreetMap-Mitwirkende).
            https://www.geoboundaries.org/api/current/gbOpen/CYP/ADM1/  → ROH/cyp_adm1.geojson
            Geschnitten mit der Landesfläche der Republik Zypern aus der Spielkarte (Natural Earth 10m, gemeinfrei; ohne Nordzypern):
            Der Schauplatz umfasst nur das Gebiet unter Kontrolle der Regierung.

Ausgabe: src/data/schauplatz-flaechen.json  {region: [[[lon, lat], ...], ...]}  (nur Außenringe, drei Nachkommastellen; Format wie bisher)
Aufruf:  python3 tools/geodaten/schauplatz_flaechen.py ROH   (aus dem Ordner game/; druckt die Flächen für data/schauplaetze.ts)
"""
import json
import math
import sys

import numpy as np
from shapely.geometry import MultiPolygon, Polygon, shape
from shapely.ops import transform, unary_union

ROH = sys.argv[1] if len(sys.argv) > 1 else "roh"
KARTE = "public/data/karte/karte.json"
BIN = "public/data/karte/karte-L1.bin"
AUS = "src/data/schauplatz-flaechen.json"

# Vereinfachung für die Karte in Grad (etwa 600 m) und kleinste Teilfläche, die gezeichnet wird (Grad², etwa 2 km²)
TOLERANZ = 0.006
MIN_TEIL = 0.0002

# Region → Quelle und Einheit. Syrien, Irak, Iran, Armenien über den P-Code der OCHA, Griechenland über die Gemeindenamen, Zypern über den Bezirk.
EINHEITEN = {
    "syr_asas": ("syr", "SY0204"), "syr_manbidsch": ("syr", "SY0205"), "syr_qamischli": ("syr", "SY0802"),
    "syr_idlib": ("syr", "SY0700"), "syr_tabqa": ("syr", "SY1103"), "syr_rakka": ("syr", "SY1101"),
    "syr_hasaka": ("syr", "SY0800"), "syr_aleppo": ("syr", "SY0200"), "syr_deir": ("syr", "SY0901"),
    "irq_zaxo": ("irq", "IQG09Q04"), "irq_dohuk": ("irq", "IQG09Q02"), "irq_tallafar": ("irq", "IQG15Q08"),
    "irq_mossul": ("irq", "IQG15Q05"), "irq_erbil": ("irq", "IQG11Q02"), "irq_kirkuk": ("irq", "IQG13Q04"),
    "irq_sulaimaniya": ("irq", "IQG06Q01"),
    "grc_mytilini": ("grc", ["Lesbos"]),
    "grc_chios": ("grc", ["Chios", "Oinousses", "Psara"]),
    "grc_kos": ("grc", ["Kos", "Nisyros"]),
    "grc_rhodos": ("grc", ["Rhodes", "Halki", "Kastellorizo", "Symi", "Tilos"]),
    "grc_alexandroupoli": ("grc", ["Alexandroupolis", "Didymoteichou", "Orestiadas", "Soufliou", "Samothrakis"]),
    "grc_komotini": ("grc", ["Komotinis", "Maronias-Sapon", "Arrianon", "Iasmou"]),
    "grc_xanthi": ("grc", ["Xanthis", "Avdiron", "Mykis", "Topirou"]),
    "grc_kavala": ("grc", ["Kavalas", "Nestou", "Pangeou"]),
    "grc_thessaloniki": ("grc", ["Thessaloniki", "Kalamaria", "Neapoli-Sykies", "Pavlos Melas", "Kordelio-Evosmos", "Ampelokipoi-Menemeni",
                                 "Pylaia-Chortiatis", "Thermi", "Thermaikos", "Delta", "Chalkidona", "Lagkadas", "Volvi", "Oraiokastro"]),
    "cyp_nikosia": ("cyp", "Nicosia"), "cyp_larnaka": ("cyp", "Larnaca"), "cyp_limassol": ("cyp", "Limassol"), "cyp_paphos": ("cyp", "Paphos"),
    "arm_gjumri": ("arm", "AM08"), "arm_kapan": ("arm", "AM09"), "arm_jeghegnadsor": ("arm", "AM10"), "arm_artaschat": ("arm", "AM03"),
    "arm_eriwan": ("arm", "AM01"),
    "irn_choi": ("irn", "IR029005"), "irn_urmia": ("irn", "IR029017"), "irn_mahabad": ("irn", "IR029006"), "irn_taebris": ("irn", "IR005019"),
    "irn_ardabil": ("irn", "IR002001"), "irn_sandschan": ("irn", "IR031008"),
}
DATEI = {"syr": ("syr/syr_admin2.geojson", "adm2"), "irq": ("irq/irq_admin2.geojson", "adm2"), "irn": ("irn/irn_admin2.geojson", "adm2"),
         "arm": ("arm/arm_admin1.geojson", "adm1"), "grc": ("grc_adm3.geojson", None), "cyp": ("cyp_adm1.geojson", None)}

R_AUTHALISCH = 6371.0072  # km, authalischer Radius des WGS84-Ellipsoids


def flaeche_km2(geom) -> float:
    """Fläche in km² über eine flächentreue azimutale Lambert-Projektion um den Schwerpunkt (Kugel mit authalischem Radius)."""
    c = geom.centroid
    l0, p0 = math.radians(c.x), math.radians(c.y)

    def proj(x, y, z=None):
        lam, phi = np.radians(x) - l0, np.radians(y)
        k = np.sqrt(2 / (1 + math.sin(p0) * np.sin(phi) + math.cos(p0) * np.cos(phi) * np.cos(lam)))
        return (R_AUTHALISCH * k * np.cos(phi) * np.sin(lam),
                R_AUTHALISCH * k * (math.cos(p0) * np.sin(phi) - math.sin(p0) * np.cos(phi) * np.cos(lam)))

    return transform(proj, geom).area


def lade(art):
    pfad, ebene = DATEI[art]
    d = json.load(open(f"{ROH}/{pfad}", encoding="utf-8"))
    out = {}
    for f in d["features"]:
        p = f["properties"]
        key = p[f"{ebene}_pcode"] if ebene else p["shapeName"]
        out.setdefault(key, []).append((shape(f["geometry"]).buffer(0), p))
    return out


def zypern_regierungsgebiet():
    """Landesfläche der Republik Zypern aus der Spielkarte (karte-L1.bin, ohne Nordzypern, das dort eigener Besitzer ist)."""
    besitzer = json.load(open(KARTE, encoding="utf-8"))["besitzer"]
    idx = next(i for i, b in enumerate(besitzer) if b.get("k") == "l" and b.get("iso") == "CYP")
    roh = np.fromfile(BIN, dtype="<i4")
    assert roh[0] == 0x4B32
    pos, teile = 4, []
    for _ in range(int(roh[2])):
        owner, n_ring = int(roh[pos]), int(roh[pos + 1])
        pos += 2
        ringe = []
        for _r in range(n_ring):
            n = int(roh[pos])
            pos += 1
            ringe.append(roh[pos: pos + 2 * n].reshape(-1, 2) / 1e5)
            pos += 2 * n
        if owner == idx and len(ringe[0]) >= 3:
            teile.append(Polygon(ringe[0], [r for r in ringe[1:] if len(r) >= 3]).buffer(0))
    return unary_union(teile)


quellen = {art: lade(art) for art in DATEI}
cyp_land = zypern_regierungsgebiet()

aus, tabelle, gezeichnet = {}, [], []
for rid, (art, schluessel) in EINHEITEN.items():
    namen = schluessel if isinstance(schluessel, list) else [schluessel]
    stuecke = []
    for n in namen:
        assert n in quellen[art], f"{rid}: Einheit {n} fehlt in {art}"
        # geoBoundaries GRC ADM3 führt Oraiokastro doppelt; beide Teile gehören zur Gemeinde
        stuecke += [g for g, _ in quellen[art][n]]
    geom = unary_union(stuecke)
    quelle_km2 = None
    props = quellen[art][namen[0]][0][1]
    if art in ("syr", "irq", "irn", "arm"):
        quelle_km2 = props.get("area_sqkm")
    if art == "cyp":
        geom = geom.intersection(cyp_land)
    km2 = flaeche_km2(geom)
    name = props.get("adm2_name") or props.get("adm1_name") or "+".join(namen)
    tabelle.append((rid, name, round(km2), round(quelle_km2) if quelle_km2 else None))
    # Für die Karte: vereinfachen, nichts überlappen lassen (bereits gezeichnete Nachbarn abziehen), Splitter weglassen
    einfach = geom.simplify(TOLERANZ, preserve_topology=True).buffer(0)
    for g in gezeichnet:
        if einfach.intersects(g):
            einfach = einfach.difference(g).buffer(0)
    gezeichnet.append(einfach)
    teile = [g for g in getattr(einfach, "geoms", [einfach]) if g.geom_type == "Polygon" and g.area >= MIN_TEIL]
    teile.sort(key=lambda g: -g.area)
    ringe = [[[round(x, 3), round(y, 3)] for x, y in list(g.exterior.coords)[:-1]] for g in teile]
    assert ringe, f"keine Fläche für {rid}"
    aus[rid] = ringe

json.dump(aus, open(AUS, "w", encoding="utf-8"), separators=(",", ":"))
for z in tabelle:
    print(*z, sep="\t")
print(len(aus), "Regionen,", sum(len(v) for v in aus.values()), "Ringe,", sum(len(r) for v in aus.values() for r in v), "Punkte,",
      round(len(json.dumps(aus, separators=(",", ":"))) / 1024), "KB")
