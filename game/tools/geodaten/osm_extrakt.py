#!/usr/bin/env python3
"""Straßen, Bahn und Einrichtungen aus dem OSM-Auszug der Türkei, dazu die Infrastrukturlage je Bezirk und Provinz.

Eingabe (nicht im Repository, siehe README_GEODATEN.md):
  ~/.cache/staatsraeson-geodaten/turkey.osm.pbf         Geofabrik, https://download.geofabrik.de/europe/turkey-latest.osm.pbf
  ~/.cache/staatsraeson-geodaten/bezirke_adm2.geojson   geoBoundaries gbOpen TUR ADM2, vereinfacht (ODbL, aus OSM)
Ausgabe in public/data/osm/:
  strassen-0..3.bin   Linien, Int32 (Länge/Breite mal 1e5): [Anzahl, dann je Linie Punktzahl und Punktpaare]
                      0 Autobahn und Schnellstraße, 1 Hauptstraße, 2 Landstraße, 3 Nebenstraße
  schiene.bin         Eisenbahn-Hauptstrecken im selben Format
  punkte.json         Krankenhäuser, Flughäfen, Kraftwerke, Staudämme, Universitäten, Häfen
  bezirke.json        Bezirksgrenzen mit Straßenlänge und -dichte je Bezirk
  provinz_infra.json  Kennzahlen je Provinz (Kfz-Kennziffer), Eingang der Simulation
Quelle und Lizenz: © OpenStreetMap-Mitwirkende, ODbL 1.0 (Namensnennung im Quellen-Menü des Spiels).
Aufruf: python tools/geodaten/osm_extrakt.py     (benötigt: pip install osmium shapely numpy)
"""
import json
import math
import os
import struct
import sys
import time
from array import array

import numpy as np
import osmium
import shapely
from shapely.geometry import LineString, Point, shape
from shapely.strtree import STRtree

CACHE = os.path.expanduser("~/.cache/staatsraeson-geodaten")
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "public", "data", "osm")
DATA = os.path.join(HERE, "..", "..", "src", "data")
os.makedirs(OUT, exist_ok=True)

T0 = time.time()


def log(msg: str) -> None:
    print(f"[{time.time() - T0:6.0f}s] {msg}", flush=True)


# ---------------------------------------------------------------------------
# Bezirke und Provinzen laden
raw = json.load(open(os.path.join(CACHE, "bezirke_adm2.geojson")))
districts = raw["features"]
d_geoms = [shape(f["geometry"]) for f in districts]
d_names = [f["properties"]["shapeName"] for f in districts]
log(f"{len(d_geoms)} Bezirke geladen")

prov_fc = json.load(open(os.path.join(DATA, "provinzen.json")))
p_geoms = [shape(f["geometry"]) for f in prov_fc["features"]]
p_plaka = [f["properties"]["plaka"] for f in prov_fc["features"]]
p_tree = STRtree(p_geoms)

# Bezirk -> Provinz über den inneren Punkt
d_prov = []
for g in d_geoms:
    pt = g.representative_point()
    hit = p_tree.query(pt, predicate="within")
    if len(hit):
        d_prov.append(p_plaka[int(hit[0])])
    else:
        d_prov.append(p_plaka[int(p_tree.nearest(pt))])
d_tree = STRtree(d_geoms)


def area_km2(g) -> float:
    c = g.centroid
    return g.area * 111.32 * math.cos(math.radians(c.y)) * 111.0


d_area = np.array([area_km2(g) for g in d_geoms])

# ---------------------------------------------------------------------------
# OSM lesen
TIERS = {"motorway": 0, "trunk": 0, "primary": 1, "secondary": 2, "tertiary": 3}
DENSITY = {
    "motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "living_street",
    "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link",
}
lines = {0: [], 1: [], 2: [], 3: [], "rail": []}
# je Weg: Mittelpunkt, Länge in m, Art (0 befahrbar, 1 Piste, 2 Schiene)
w_lon, w_lat, w_len, w_kind = array("d"), array("d"), array("d"), array("b")
pts = {"krankenhaus": [], "flughafen": [], "kraftwerk": [], "staudamm": [], "universitaet": [], "hafen": []}


def tags_point(o, lon, lat):
    t = o.tags
    name = t.get("name", "")
    amenity = t.get("amenity")
    if amenity == "hospital":
        pts["krankenhaus"].append([round(lon, 4), round(lat, 4), name])
    elif amenity == "university":
        pts["universitaet"].append([round(lon, 4), round(lat, 4), name])
    if t.get("aeroway") == "aerodrome" and (t.get("iata") or t.get("icao")):
        pts["flughafen"].append([round(lon, 4), round(lat, 4), name, t.get("iata", ""), t.get("aerodrome:type", "")])
    if t.get("power") == "plant":
        pts["kraftwerk"].append([round(lon, 4), round(lat, 4), name, t.get("plant:source", ""), t.get("plant:output:electricity", "")])
    if t.get("waterway") == "dam" or t.get("man_made") == "dam":
        pts["staudamm"].append([round(lon, 4), round(lat, 4), name])
    if t.get("industrial") == "port" or t.get("harbour") == "yes":
        pts["hafen"].append([round(lon, 4), round(lat, 4), name])


fp = (
    osmium.FileProcessor(os.path.join(CACHE, "turkey.osm.pbf"), osmium.osm.NODE | osmium.osm.WAY)
    .with_locations()
    .with_filter(osmium.filter.KeyFilter("highway", "railway", "amenity", "aeroway", "power", "waterway", "man_made", "industrial", "harbour"))
)
n_way = n_hw = n_rail = 0
for o in fp:
    if o.is_node():
        try:
            tags_point(o, o.location.lon, o.location.lat)
        except osmium.InvalidLocationError:
            pass
        continue
    n_way += 1
    t = o.tags
    hw = t.get("highway")
    rw = t.get("railway")
    try:
        coords = [(n.lon, n.lat) for n in o.nodes]
    except osmium.InvalidLocationError:
        continue
    if len(coords) < 2:
        continue
    if hw:
        if hw not in DENSITY and hw != "track":
            continue
        n_hw += 1
        length = osmium.geom.haversine_distance(o.nodes)
        mid = coords[len(coords) // 2]
        w_lon.append(mid[0]); w_lat.append(mid[1]); w_len.append(length); w_kind.append(1 if hw == "track" else 0)
        tier = TIERS.get(hw)
        if tier is not None:
            s = LineString(coords).simplify(0.0004, preserve_topology=False)
            lines[tier].append(list(s.coords))
    elif rw == "rail" and t.get("service") not in ("yard", "siding", "spur", "crossover"):
        n_rail += 1
        length = osmium.geom.haversine_distance(o.nodes)
        mid = coords[len(coords) // 2]
        w_lon.append(mid[0]); w_lat.append(mid[1]); w_len.append(length); w_kind.append(2)
        if t.get("usage") not in ("industrial", "military", "tourism", "test"):
            s = LineString(coords).simplify(0.0004, preserve_topology=False)
            lines["rail"].append(list(s.coords))
    else:
        # Flächen (Krankenhaus, Flughafen, Kraftwerk …) über den Schwerpunkt
        if o.is_closed():
            cx = sum(c[0] for c in coords) / len(coords)
            cy = sum(c[1] for c in coords) / len(coords)
            tags_point(o, cx, cy)
log(f"gelesen: {n_way} Wege mit Relevanz, {n_hw} Straßen, {n_rail} Bahnstücke; Linien {[len(v) for v in lines.values()]}; Punkte { {k: len(v) for k, v in pts.items()} }")

# ---------------------------------------------------------------------------
# Wege den Bezirken zuordnen
mids = shapely.points(np.column_stack([np.frombuffer(w_lon, dtype="d"), np.frombuffer(w_lat, dtype="d")]))
idx_in, idx_tree = d_tree.query(mids, predicate="within")
assign = np.full(len(mids), -1, dtype=np.int32)
assign[idx_in] = idx_tree
missing = np.where(assign < 0)[0]
if len(missing):
    near, dist = d_tree.query_nearest(mids[missing], max_distance=0.02, return_distance=True)
    assign[missing[near[0]]] = near[1]
log(f"zugeordnet: {(assign >= 0).sum()} von {len(assign)} Wegen")

lens = np.frombuffer(w_len, dtype="d")
kinds = np.frombuffer(w_kind, dtype="b")
n_d = len(d_geoms)
road_km = np.zeros(n_d)
track_km = np.zeros(n_d)
rail_km = np.zeros(n_d)
for k, arr in ((0, road_km), (1, track_km), (2, rail_km)):
    sel = (kinds == k) & (assign >= 0)
    np.add.at(arr, assign[sel], lens[sel] / 1000.0)


def assign_points(items, coord=lambda p: (p[0], p[1])):
    out = np.zeros(n_d, dtype=int)
    if not items:
        return out
    pp = shapely.points(np.array([coord(p) for p in items]))
    a, b = d_tree.query(pp, predicate="within")
    np.add.at(out, b, 1)
    return out


hosp = assign_points(pts["krankenhaus"])
airp = assign_points(pts["flughafen"])
power = assign_points(pts["kraftwerk"])

# ---------------------------------------------------------------------------
# Ausgabe


def write_lines(name, ls):
    buf = array("i", [len(ls)])
    for line in ls:
        buf.append(len(line))
        for lon, lat in line:
            buf.append(int(round(lon * 1e5)))
            buf.append(int(round(lat * 1e5)))
    with open(os.path.join(OUT, name), "wb") as f:
        f.write(buf.tobytes())
    log(f"{name}: {len(ls)} Linien, {os.path.getsize(os.path.join(OUT, name)) / 1e6:.1f} MB")


for tier in range(4):
    write_lines(f"strassen-{tier}.bin", lines[tier])
write_lines("schiene.bin", lines["rail"])

json.dump(pts, open(os.path.join(OUT, "punkte.json"), "w"), ensure_ascii=False, separators=(",", ":"))


def rings_of(g):
    polys = [g] if g.geom_type == "Polygon" else list(g.geoms)
    out = []
    for p in polys:
        out.append([[round(x, 4), round(y, 4)] for x, y in p.exterior.coords])
    return out


bez = []
for i in range(n_d):
    a = float(d_area[i])
    bez.append({
        "name": d_names[i],
        "plaka": int(d_prov[i]),
        "flaeche_km2": round(a, 1),
        "strasse_km": round(float(road_km[i]), 1),
        "piste_km": round(float(track_km[i]), 1),
        "schiene_km": round(float(rail_km[i]), 1),
        "strasse_dichte": round(float(road_km[i]) / a, 3) if a > 0 else 0.0,
        "krankenhaeuser": int(hosp[i]),
        "flughaefen": int(airp[i]),
        "kraftwerke": int(power[i]),
        "rings": rings_of(d_geoms[i]),
    })
json.dump({"quelle": "geoBoundaries gbOpen TUR ADM2 (ODbL, aus OpenStreetMap); Straßenlängen: OpenStreetMap, Stand des Geofabrik-Auszugs", "bezirke": bez},
          open(os.path.join(OUT, "bezirke.json"), "w"), ensure_ascii=False, separators=(",", ":"))
log(f"bezirke.json: {os.path.getsize(os.path.join(OUT, 'bezirke.json')) / 1e6:.1f} MB")

# Kennzahlen je Provinz
prov = {}
for i in range(n_d):
    p = prov.setdefault(int(d_prov[i]), {"flaeche_km2": 0.0, "strasse_km": 0.0, "piste_km": 0.0, "schiene_km": 0.0, "krankenhaeuser": 0, "flughaefen": 0, "kraftwerke": 0, "bezirke": 0})
    p["flaeche_km2"] += float(d_area[i]); p["strasse_km"] += float(road_km[i]); p["piste_km"] += float(track_km[i])
    p["schiene_km"] += float(rail_km[i]); p["krankenhaeuser"] += int(hosp[i]); p["flughaefen"] += int(airp[i]); p["kraftwerke"] += int(power[i]); p["bezirke"] += 1
for p in prov.values():
    p["strasse_dichte"] = round(p["strasse_km"] / p["flaeche_km2"], 3) if p["flaeche_km2"] else 0.0
    for k in ("flaeche_km2", "strasse_km", "piste_km", "schiene_km"):
        p[k] = round(p[k], 1)
json.dump({"quelle": "© OpenStreetMap-Mitwirkende (ODbL), Geofabrik-Auszug Türkei; Bezirksgrenzen geoBoundaries gbOpen (ODbL). Straßen: Autobahn bis Wohnstraße ohne Pisten; Länge je Provinz, Dichte in km je km²",
           "provinzen": {str(k): v for k, v in sorted(prov.items())}},
          open(os.path.join(DATA, "provinz_infra.json"), "w"), ensure_ascii=False, indent=1)
log(f"provinz_infra.json: {len(prov)} Provinzen; Landesdichte {sum(p['strasse_km'] for p in prov.values()) / sum(p['flaeche_km2'] for p in prov.values()):.3f} km je km2")
log("fertig")
