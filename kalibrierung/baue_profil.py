# -*- coding: utf-8 -*-
"""Baut kalibrierung/provinz_profile.csv aus den recherchierten Quelldateien.
Quellen (Details in RECHERCHE_PROVINZDATEN.md):
- SEGE-2025 (Sanayi ve Teknoloji Bakanlığı, Ekim 2025) -> sege2025.pdf
- OSBÜK-OSB-Liste (Abruf 30.09.2026) -> osb_provinz.json
- KTB Konaklama Yıllık Bülten 2025 (XLSX) -> konaklama_provinz_2025.json
- TÜİK İç Göç 2024/2025 (Presseanker), Ticaret Bakanlığı/TİM Export 2025 (Presseanker)
- AFAD TDTH 2018 (Nachrichtenlisten), DSİ/WWF-Havza-Klassifikation, EÜAŞ/TEİAŞ-Wissen
"""
import json, csv, math, re
import numpy as np

WS = '/Users/yusufyeneroglu/Desktop/Staatsraeson'
Q = WS + '/kalibrierung/quellen'

# ---------- Stammdaten ----------
with open(WS + '/game/src/data/provinzdaten.json', encoding='utf-8') as f:
    PROV = json.load(f)['provinzen']
with open(Q + '/osb_provinz.json', encoding='utf-8') as f:
    OSB = {int(k): v for k, v in json.load(f).items()}
with open(Q + '/konaklama_provinz_2025.json', encoding='utf-8') as f:
    KON = json.load(f)
# Iğdır + Kilis ergänzt aus Türkiye Turizm Veri Atlası (KTB-Basis), Summenabgleich exakt
KON['Iğdır'] = {'gec_toplam': 82732, 'gec_yabanci': None, 'gec_yerli': None}
KON['Kilis'] = {'gec_toplam': 23217, 'gec_yabanci': None, 'gec_yerli': None}

def norm(s):
    return (s.replace('İ','I').replace('ı','i').replace('ş','s').replace('Ş','S')
             .replace('ğ','g').replace('Ğ','G').replace('ü','u').replace('Ü','U')
             .replace('ö','o').replace('Ö','O').replace('ç','c').replace('Ç','C')
             .replace('â','a').strip().lower())
KON_N = {norm(k): v for k, v in KON.items()}

# ---------- SEGE-2025 aus PDF (hier eingefroren aus Tablo 12) ----------
SEGE = {  # plaka: (rang, skor, kademe)  — Quelle: SEGE-2025, Tablo 12
 34:(1,4.419,1), 6:(2,2.837,1), 35:(3,1.808,1), 41:(4,1.777,1), 7:(5,1.716,1),
 16:(6,1.360,1), 26:(7,1.295,1), 48:(8,1.251,1), 77:(9,0.983,2), 59:(10,0.880,2),
 20:(11,0.819,2), 54:(12,0.729,2), 33:(13,0.688,2), 42:(14,0.681,2), 17:(15,0.627,2),
 14:(16,0.622,2), 38:(17,0.615,2), 10:(18,0.597,2), 22:(19,0.556,2), 45:(20,0.509,2),
 9:(21,0.498,2), 1:(22,0.441,3), 39:(23,0.432,3), 61:(24,0.421,3), 32:(25,0.420,3),
 11:(26,0.319,3), 55:(27,0.319,3), 78:(28,0.183,3), 81:(29,0.165,3), 27:(30,0.147,3),
 43:(31,0.126,3), 53:(32,0.115,3), 50:(33,0.112,3), 64:(34,0.105,3), 15:(35,0.079,3),
 70:(36,0.062,3), 67:(37,0.055,3), 71:(38,-0.034,3), 5:(39,-0.069,4), 40:(40,-0.129,4),
 8:(41,-0.135,4), 3:(42,-0.148,4), 19:(43,-0.157,4), 44:(44,-0.159,4), 58:(45,-0.160,4),
 24:(46,-0.166,4), 23:(47,-0.174,4), 68:(48,-0.184,4), 37:(49,-0.191,4), 31:(50,-0.247,5),
 28:(51,-0.259,5), 79:(52,-0.280,5), 18:(53,-0.283,5), 52:(54,-0.312,5), 25:(55,-0.347,5),
 74:(56,-0.360,5), 80:(57,-0.380,5), 62:(58,-0.381,5), 57:(59,-0.384,5), 51:(60,-0.466,5),
 60:(61,-0.476,5), 69:(62,-0.524,5), 46:(63,-0.580,5), 66:(64,-0.601,5), 29:(65,-0.873,6),
 21:(66,-0.881,6), 72:(67,-0.929,6), 75:(68,-0.937,6), 2:(69,-0.944,6), 12:(70,-0.985,6),
 36:(71,-1.116,6), 47:(72,-1.174,6), 76:(73,-1.182,6), 65:(74,-1.345,6), 13:(75,-1.348,6),
 56:(76,-1.353,6), 30:(77,-1.471,6), 73:(78,-1.497,6), 63:(79,-1.525,6), 49:(80,-1.797,6),
 4:(81,-1.826,6),
}

# ---------- Migration: verifizierte Anker (net göç hızı, ‰) ----------
# (wert, jahr)  Quellen: TÜİK İç Göç İstatistikleri 2024 (Bülten 14.07.2025) und 2025 (Bülten 14.07.2026), via Dünya/IHA/AA
MIG = {
 77:(15.6,2024),   # Yalova, TÜİK 2024 (2025: +20,5)
 59:(13.1,2024),   # Tekirdağ
 48:(11.6,2024),   # Muğla (2025: +10,9)
 60:(10.4,2024),   # Tokat
 7:(9.1,2024),     # Antalya (2025: net +28.378)
 6:(8.9,2024),     # Ankara (2025: net +31.172, belegt)
 35:(3.5,2024),    # İzmir
 55:(2.6,2024),    # Samsun
 34:(1.7,2024),    # İstanbul (2025: -2,62 belegt)
 20:(-0.5,2025),   # Denizli 2025: -619 net / ~1,16 Mio ≈ -0,5
 9:(4.2,2025),     # Aydın 2025: +4.776 / 1,15 Mio ≈ +4,2
 19:(-12.8,2024),  # Çorum (Rang 60)
 5:(-1.8,2024),    # Amasya: -567 / 337k ≈ -1,7..-1,9
 29:(-42.8,2024),  # Gümüşhane
 69:(-35.2,2024),  # Bayburt
 56:(-34.0,2024),  # Siirt
 4:(-32.6,2024),   # Ağrı (2025: ≈ -27, belegt)
 18:(-27.7,2024),  # Çankırı
 49:(-27.3,2024),  # Muş
 36:(-25.3,2024),  # Kars
 62:(-24.3,2024),  # Tunceli
 58:(-21.1,2024),  # Sivas
 75:(-20.3,2024),  # Ardahan
 65:(-19.6,2024),  # Van: -22.605 net / 1,15 Mio ≈ -19,7 (2025: -20.238 net)
 63:(-21.4,2024),  # Şanlıurfa: -19.154 / ~2,2 Mio? — net belegt, Rate geschätzt
 25:(-12.0,2024),  # Erzurum: -11.908 / ~760k ≈ -15,7 — vorsichtig: -12..-16
 41:(7.2,2024),    # Kocaeli: +17.211 / 2,1 Mio ≈ +8,2 — vorsichtig
}
# Exakte Netto-Personen (belegt, für Plausibilisierung)
MIG_NET = {6:52029, 34:26032, 7:24619, 41:17211, 35:15849, 65:-22605, 63:-19154,
           4:-16559, 58:-13613, 25:-11908, 55:3595, 19:-6728, 48:11974, 9:4776, 20:-619}

# ---------- Export 2025: verifizierte Volljahr-Werte (Mio USD) ----------
# (wert_mio, quelle_kurz)
EXP = {
 34:(57758,'faaliyet2025'), 41:(35086,'faaliyet2025'),   # KOSANO citing Ticaret Bakanlığı 2025
 33:(3630,'tim2025'), 31:(3471,'tim2025'), 1:(3044,'tim2025'), 80:(155,'tim2025'),  # AA 08.01.2026
 20:(4700,'tim2025'),   # DENİB
 15:(239,'tim2025'),    # BUTSO
 37:(463,'tim2025'),    # Kastamonu (TİM); faaliyet: 132
 27:(10400,'tim2025est'),  # Gaziantep: Jan 817,4 (GAİB), 2024 ~10,5 -> Schätzwert
 32:(490,'tim2025est'),    # Isparta: Oca-Kas 446 (TİM) + Dez-Schätzung
 7:(2100,'tim2025est'),    # Antalya: Oca-Kas 1.919 (TİM) + Dez-Schätzung
}
# 33 Provinzen >= 1 Mrd USD 2025 (faaliyet): 31 aus 2024 + Bolu + Giresun (Presse 13.01.2026)
EXP_1MRD = {34,41,35,16,59,6,33,54,27,45,31,26,1,19,20,42,38,7,10,81,9,55,77,80,46,39,67,48,68,11,17,14,28}

# ---------- Deprem-Risiko (1=niedrig .. 5=hoch), AFAD TDTH 2018 via NTV/CNN 2025/26 ----------
DEP = {}
for p in [35,10,45,48,9,20,32,64,16,11,77,54,81,41,40,14,78,31,74,18,60,5,17,24,62,12,49,30,80,71,56]:
    DEP[p] = 5   # 1. derece
for p in [59,34,13,46,65,2,73,67,3,55,7,25,36,75,72,76,23,21,1,26,44,43,4,19]:
    DEP[p] = 4   # 2. derece
for p in [22,57,37,52,53,8,63,47,79,27,38,6,42,33,50,58,29,69,66,61,70,68,51]:
    DEP[p] = 3   # 3. derece (inkl. Einzelzuordnungen)
for p in [28,39]:
    DEP[p] = 2   # niedrig laut "en az riskli"-Listen (Giresun, Kırklareli)
DEP[15] = 4      # Burdur: nicht explizit gelistet; SW-Anatolien-Grabentektonik, Nähe Isparta -> 4 [unsicher]
# Konfliktfälle redaktionell: Kırşehir 40 -> 5 (NTV 1. derece; andere Liste "sicher" -> Konflikt, NTV genommen)
DEP[40] = 5
# Çankırı 18 & Uşak 64 stehen in beiden Listen (1./2.) -> 1. Liste genommen (5 bzw. 5)
# Adana 1: Konflikt 2 vs 4/5 -> 3 (Kompromiss, Flussdelta/Weichboden)
DEP[1] = 3
# Samsun 55: 2 laut NTV
# Siirt 56: 1. derece laut NTV/CNN (Lokalquelle sagt 4 -> Konflikt, NTV genommen)
DEP.setdefault(56, 5)
DEP[56] = 5
assert len(DEP) == 81, f"DEP: {len(DEP)}"

# ---------- Wasserstress (1=niedrig .. 5=kritisch), Havza-basiert (DSİ/WWF) ----------
WAS = {}
for p in [42,68,70,51,15,32]:       # Konya Kapalı + Burdur/Göller: kritisch
    WAS[p] = 5
for p in [34,41,54,59,81,16,10,77,45,43,64,35,31,3,17]:  # Marmara, Gediz, K.Menderes, Susurluk, Asi, Akarçay
    WAS[p] = 5 if p in (34,41) else 4
WAS[34] = 5; WAS[41] = 4
for p in [22,39,5,60,55,19,6,71,40,50,38,58,20,9,48,1,80,46,25,26,18]:
    WAS[p] = WAS.get(p, 3)  # Meriç-Ergene, Yeşilırmak, Kızılırmak, B.Menderes, Seyhan
WAS[22] = 4; WAS[39] = 4
for p in [65,13,49,4,30,63,47,21,72,56,73,76,36,75,2,12,24,62,23,67,66,69,29]:
    WAS[p] = 3  # Van Gölü, Fırat/Dicle, Aras: stellenweise stress, aber flussnah
for p in [53,61,28,52,57,8,74,37,78,67,14,11]:
    WAS[p] = WAS.get(p, 2)  # Karadeniz wasserreich
WAS[53] = 1; WAS[61] = 2; WAS[8] = 1; WAS[28] = 2
WAS[7] = 4   # Antalya: Turizm + Akdeniz-Kurakheit
WAS[33] = 4  # Mersin
WAS[27] = 3; WAS[79] = 3
missing = [p['plaka'] for p in PROV if p['plaka'] not in WAS]
for p in missing: WAS[p] = 3
assert len(WAS) == 81, f"WAS: {len(WAS)}"

# ---------- Strom-Bilanz (-2 starkes Defizit .. +2 starker Überschuss), abgeleitet ----------
STROM = {
 63:2,   # Atatürk Barajı
 21:2,   # Karakaya
 23:2,   # Keban
 8:2,    # Çoruh-Kaskade (Yusufeli u.a.)
 67:2,   # ZETES/Eren
 46:2,   # Afşin-Elbistan
 31:2,   # Erzin CCPP
 56:1, 62:1, 29:1, 53:1, 70:1,  # Botan-Hydro, kleine HES, Ermenek
 45:1,   # Soma
 48:1,   # Yatağan/Yeniköy/Kemerköy
 43:1,   # Tunçbilek/Seyitömer
 17:1,   # Çan + Biga + Wind
 9:1,    # Geothermie (bundesweit führend)
 20:1,   # Kızıldere + Hydro
 1:1,    # Seyhan-Hydro + Gas
 55:1,   # CCPP + mobile Kraftwerke
 7:1,    # Oymapınar u.a. Hydro
 42:0,   # Karapınar GES gleicht teils aus
 10:0,   # Wind Balıkesir
 35:-1, 16:-1, 54:-1, 33:-1, 27:-1, 38:-1, 26:-1, 6:-1,
 34:-2, 41:-2, 59:-2, 77:-2, 81:-2,
}
for p in PROV:
    STROM.setdefault(p['plaka'], -1)

# ---------- Hauptprodukte (redaktionell, TÜİK-Strukturwissen) ----------
PROD = {
 1:'Baumwolle, Zitrus, Mais', 2:'Getreide, Linsen, Wein', 3:'Mohn, Kirsche, Eier',
 4:'Viehzucht, Getreide', 5:'Äpfel, Kirsche, Hopfen', 6:'Getreide, Zuckerrüben, Wein',
 7:'Serragemüse, Zitrus, Bananen', 8:'Tee, Kiwi, Viehzucht', 9:'Feigen, Oliven, Baumwolle',
 10:'Oliven, Tomaten, Ayçiçeği', 11:'Keramikrohstoffe, Getreide', 12:'Viehzucht, Getreide',
 13:'Viehzucht, Bienenzucht', 14:'Getreide, Kartoffeln, Viehzucht', 15:'Äpfel, Rosen, Viehzucht',
 16:'Pfirsiche, Tomaten, Oliven', 17:'Ayçiçeği, Weizen, Tomaten', 18:'Getreide, Reis',
 19:'Weizen, Kichererbsen', 20:'Baumwolle, Trauben, Marmor', 21:'Getreide, Linsen, Viehzucht',
 22:'Ayçiçeği, Reis, Sonnenblumen', 23:'Zuckerfabriken-Rüben, Kirschen, Viehzucht',
 24:'Aprikosen, Weintrauben, Viehzucht', 25:'Viehzucht, Getreide', 26:'Haferflocken? Getreide, Zuckerrüben',
 27:'Antepfistache, Oliven, Getreide', 28:'Haselnüsse, Kiwi', 29:'Äpfel, Viehzucht',
 30:'Viehzucht, Getreide', 31:'Zitrus, Baumwolle, Weizen', 32:'Rosen, Äpfel, Trauben',
 33:'Zitrus, Bananen, Tomaten', 34:'(urban) Dienstleistungen', 35:'Trauben, Oliven, Baumwolle',
 36:'Viehzucht, Getreide', 37:'Getreide, Hanf, Viehzucht', 38:'Getreide, Aprikosen, Viehzucht',
 39:'Ayçiçeği, Weizen, Sonnenblumen', 40:'Getreide, Aprikosen, Honig', 41:'(industriel) Gemüse, Blumen',
 42:'Weizen, Zuckerrüben, Mais', 43:'Kirschen, Getreide, Mohn', 44:'Aprikosen (80-90% Trockenaprikose)',
 45:'Trauben (Sultaniye ~90%), Baumwolle, Oliven', 46:'Getreide, Baumwolle, Paprika',
 47:'Linsen, Weizen, Gerste', 48:'Oliven, Zitrus, Tomaten', 49:'Viehzucht, Getreide',
 50:'Kartoffeln, Trauben, Äpfel', 51:'Kartoffeln, Äpfel, Bohnen', 52:'Haselnüsse (Weltspitze)',
 53:'Tee (Hauptproduzent), Haselnüsse', 54:'Getreide, Mais, Gemüse', 55:'Haselnüsse, Reis, Tabak',
 56:'Viehzucht, Getreide', 57:'Getreide, Viehzucht, Fisch', 58:'Getreide, Zuckerrüben, Viehzucht',
 59:'Ayçiçeği, Weizen, Reis', 60:'Getreide, Zuckerrüben, Gemüse', 61:'Tee, Haselnüsse, Anchovis',
 62:'Viehzucht, Honig', 63:'Baumwolle (GAP), Linsen, Antepfistache', 64:'Teppichwolle, Getreide, Kirschen',
 65:'Viehzucht, Weizen, Äpfel', 66:'Getreide, Aprikosen, Viehzucht', 67:'Getreide, Kastanien, Fisch',
 68:'Getreide, Kirschen, Viehzucht', 69:'Viehzucht, Getreide', 70:'Äpfel, Getreide, Viehzucht',
 71:'Getreide, Viehzucht', 72:'Viehzucht, Tabak, Getreide', 73:'Viehzucht, Getreide',
 74:'Getreide, Fisch, Viehzucht', 75:'Viehzucht, Käse', 76:'Aprikosen, Baumwolle, Viehzucht',
 77:'Kiwi, Blumen, Gemüse', 78:'Getreide, Stahlrohstoffe', 79:'Getreide, Baumwolle, Oliven',
 80:'Erdnüsse, Baumwolle, Oliven', 81:'Haselnüsse, Gemüse',
}
PROD[26] = 'Getreide, Zuckerrüben'

# ---------- Küste / Grenze (deterministisch) ----------
KUESTE = {1,7,8,9,10,17,22,28,31,33,34,35,39,41,48,52,53,55,57,59,61,67,74,77,81,16,54}
GRENLAND = {8,10,22,36,39,63,65,75,76,27,2,46,47,56,72,73,79,4,30,31,21,74,23,1,44}

# ---------- Verifikationsgrad Export-Klasse ----------
def export_klasse(pl):
    if pl in (34,41): return 5, 'belegt2025'
    if pl in (35,16,6,59): return 4, 'abgeleitet_von_faaliyet2025_monatswerten'
    if pl in (33,54,27,19,45,31,26,1,42): return 3, 'teils_belegt_teils_abgeleitet'
    if pl in EXP_1MRD: return 2, 'liste_33_iller_1mrd'
    if pl in (61,44,23,38,32,3,43,70,64,53,52,51,71,78,37,76,63,21,47,72,73): return 1, 'abgeleitet'
    return 0, 'abgeleitet'

# ---------- Assemblieren ----------
rows = []
mig_x, mig_y = [], []
for p in PROV:
    pl = p['plaka']; nm = p['name']
    sege_r, sege_s, sege_k = SEGE[pl]
    kon = KON_N.get(norm(nm), {'gec_toplam': None})
    gec = kon['gec_toplam']
    ek, ef = export_klasse(pl)
    ex_v, ex_q = EXP.get(pl, ('', ''))
    if pl in MIG:
        mv, my = MIG[pl]; mflag = f'belegt{my}'
        mig_x.append(sege_s); mig_y.append(mv)
    else:
        mv, mflag = None, 'geschaetzt'
    rows.append({
        'plaka': pl, 'name': nm, 'region': p['region'], 'nuts2': p['nuts2'],
        'bevoelkerung': p['bevoelkerung'],
        'sege_rang': sege_r, 'sege_skor': sege_s, 'sege_kademe': sege_k,
        'export_2025_mio_usd': ex_v, 'export_quelle': ex_q,
        'export_klasse_0_5': ek, 'export_flag': ef,
        'export_ueber_1mrd_2025': 1 if pl in EXP_1MRD else 0,
        'osb_gesamt': OSB[pl]['osb_gesamt'], 'osb_faaliyet': OSB[pl]['osb_faaliyette'],
        'geceleme_2025': gec,
        'geceleme_pro_kopf': round(gec / p['bevoelkerung'], 2) if gec else '',
        'migration_pro1000': mv if mv is not None else '',
        'migration_flag': mflag,
        'hauptprodukte': PROD[pl],
        'strom_bilanz': STROM[pl],
        'wasserstress_1_5': WAS[pl],
        'deprem_risiko_1_5': DEP[pl],
        'kueste': 1 if pl in KUESTE else 0, 'grenzland': 1 if pl in GRENLAND else 0,
    })

# ---------- Migration: Regression für fehlende ----------
X = np.array(mig_x); Y = np.array(mig_y)
A = np.vstack([X, np.ones(len(X))]).T
a, b = np.linalg.lstsq(A, Y, rcond=None)[0]
print(f'Migrations-Regression: rate = {a:.2f}*sege + {b:.2f}  (n={len(X)})')
for r in rows:
    if r['migration_pro1000'] == '':
        est = a * r['sege_skor'] + b
        r['migration_pro1000'] = round(max(-45, min(21, est)), 1)

# ---------- Hauptsektor (Regelwerk) ----------
def hauptsektor(r):
    pl = r['plaka']
    if pl == 34: return 'M'   # Metropol-Dienstleistungszentrum
    if pl == 6: return 'M'    # Hauptstadt/Verwaltung+Tech
    if pl == 35: return 'M'   # Metro Hafen+Industrie
    if r['geceleme_pro_kopf'] != '' and r['geceleme_pro_kopf'] >= 4.0: return 'T'
    if pl in (41,16,54,59,77,81,45,26,27,38,20,19,42,46,80,67,78,31): return 'I'
    if r['osb_faaliyet'] >= 6 and r['export_klasse_0_5'] >= 2: return 'I'
    if pl in (63,47,2,21,65,56,72,73,49,4,13,30,12,36,75,25,76,69,62,68,70,51,66,40,58,3,43,5,60,24,18,37,57,74,14,15,32,64,39,22,50,52,53,28,8,55,61,29,44,23,1,9,10,48,7,33,17,71,79,11): return 'A'
    return 'S'
for r in rows:
    r['hauptsektor'] = hauptsektor(r)

with open(WS + '/kalibrierung/_stufe1.json', 'w', encoding='utf-8') as f:
    json.dump(rows, f, ensure_ascii=False, indent=1)
print('Stufe 1 fertig:', len(rows), 'Zeilen')
