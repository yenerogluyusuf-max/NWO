# -*- coding: utf-8 -*-
"""Stufe 2: Cluster-Zuordnung + finale provinz_profile.csv + Cluster-Statistiken."""
import json, csv

WS = '/Users/yusufyeneroglu/Desktop/Staatsraeson'
rows = json.load(open(WS + '/kalibrierung/_stufe1.json', encoding='utf-8'))

CLUSTER = {
 1: ('Metropol-Industrie-Kern', [34, 6, 35, 41, 16, 59]),
 2: ('Industrie- und Hafen-Gürtel (2. Reihe)', [1, 33, 54, 81, 77, 10, 17, 22, 39, 67, 55, 31]),
 3: ('Tourismus-Küste', [7, 48, 9, 50]),
 4: ('Anatolische Mittelstädte / Tiger', [20, 26, 38, 19, 80, 78, 11, 14, 71, 40, 66, 58, 60, 5, 37, 25, 24]),
 5: ('Agrar-Steppe İç Ege/Zentralanatolien', [42, 45, 64, 43, 3, 15, 32, 70, 68, 51]),
 6: ('Karadeniz-Fındık-Peripherie', [52, 28, 61, 53, 8, 57, 74]),
 7: ('Südost/GAP: Grenz-Industrie & Trockenlandwirtschaft', [27, 63, 46, 44, 23, 21, 2, 47, 72, 79, 73, 65, 76, 36]),
 8: ('Ost-Anatolien peripher', [4, 49, 13, 12, 30, 56, 62, 75, 69, 29, 18]),
}
P2C = {}
for cid, (cname, members) in CLUSTER.items():
    for m in members:
        P2C[m] = (cid, cname)
assert len(P2C) == 81

# Cluster-Statistiken (Begründung im Bericht)
import statistics as st
print('=== Cluster-Profile (Mittelwerte) ===')
for cid, (cname, members) in CLUSTER.items():
    sel = [r for r in rows if r['plaka'] in members]
    sege = st.mean(r['sege_skor'] for r in sel)
    mig = st.mean(r['migration_pro1000'] for r in sel)
    gec_pc = st.mean(r['geceleme_pro_kopf'] if r['geceleme_pro_kopf'] != '' else 0 for r in sel)
    osb = st.mean(r['osb_faaliyet'] for r in sel)
    was = st.mean(r['wasserstress_1_5'] for r in sel)
    dep = st.mean(r['deprem_risiko_1_5'] for r in sel)
    ek = st.mean(r['export_klasse_0_5'] for r in sel)
    strom = st.mean(r['strom_bilanz'] for r in sel)
    print(f'C{cid} {cname[:38]:40s} n={len(sel):2d} SEGE {sege:+.2f} Mig {mig:+5.1f}‰ Gec/K {gec_pc:4.1f} OSB {osb:3.1f} Was {was:.1f} Dep {dep:.1f} ExpK {ek:.1f} Strom {strom:+.1f}')

for r in rows:
    cid, cname = P2C[r['plaka']]
    r['cluster_id'] = cid
    r['cluster_name'] = cname

cols = ['plaka', 'name', 'region', 'nuts2', 'bevoelkerung',
        'sege_rang', 'sege_skor', 'sege_kademe',
        'export_2025_mio_usd', 'export_quelle', 'export_klasse_0_5', 'export_flag', 'export_ueber_1mrd_2025',
        'osb_gesamt', 'osb_faaliyet',
        'geceleme_2025', 'geceleme_pro_kopf',
        'migration_pro1000', 'migration_flag',
        'hauptprodukte', 'strom_bilanz', 'wasserstress_1_5', 'deprem_risiko_1_5',
        'kueste', 'grenzland', 'hauptsektor', 'cluster_id', 'cluster_name']

with open(WS + '/kalibrierung/provinz_profile.csv', 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=cols, extrasaction='ignore')
    w.writeheader()
    for r in sorted(rows, key=lambda x: x['plaka']):
        w.writerow(r)
print('\nCSV geschrieben:', WS + '/kalibrierung/provinz_profile.csv')

# Abdeckungs-Check
n_exp = sum(1 for r in rows if r['export_2025_mio_usd'] != '')
n_mig_belegt = sum(1 for r in rows if r['migration_flag'].startswith('belegt'))
print(f'Export belegt: {n_exp}/81 | Migration belegt: {n_mig_belegt}/81 | SEGE/OSB/Tourismus/Deprem/Wasser: 81/81')
