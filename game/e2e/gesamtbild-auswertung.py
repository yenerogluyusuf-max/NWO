import json, collections, sys
d = json.load(open(sys.argv[1]))
ges = {k: collections.Counter() for k in ["knoepfe", "schriften", "groessen", "flaechen", "radien"]}
for seite, m in d.items():
    for k in ges: ges[k].update(m[k])
for k, c in ges.items():
    print(f"== {k}: {len(c)} verschiedene")
    for v, n in c.most_common(12 if k != "knoepfe" else 15): print(f"   {n:5d}  {v}")
print("== Schriften je Seite")
for seite, m in d.items(): print(f"   {seite[:46]:46s} {dict(collections.Counter(m['schriften']).most_common(4))}")
