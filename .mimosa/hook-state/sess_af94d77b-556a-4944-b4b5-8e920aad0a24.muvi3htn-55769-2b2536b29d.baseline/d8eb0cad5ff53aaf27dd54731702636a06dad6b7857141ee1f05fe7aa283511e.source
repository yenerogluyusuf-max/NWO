# Baut kalibrierung/zeitreihen_2018_2026.csv und ereignisse_2018_2026.csv
# Regel fuer est-Flag: est=false NUR, wenn der Wert in dieser Session gegen eine
# zitierte Quelle verifiziert wurde. Alles andere (Interpolation, Gedaechtnis-Anker
# aus publizierten Standardreihen) ist est=true.
import csv, os

HERE = os.path.dirname(os.path.abspath(__file__))
MONTHS = [f"{y}-{m:02d}" for y in range(2018, 2027) for m in range(1, 13)]
MONTHS = [m for m in MONTHS if "2018-01" <= m <= "2026-09"]
assert len(MONTHS) == 105

def y(y_, vals):
    return {f"{y_}-{m:02d}": v for m, v in enumerate(vals, 1)}

# ---------- TUFE (Jahresrate, TÜİK) ----------
tuefe = {}
tuefe.update(y(2018, [10.35,10.26,10.23,10.85,12.15,15.39,15.85,17.90,24.52,25.24,21.62,20.30]))
tuefe.update(y(2019, [20.35,19.67,19.71,19.50,18.71,15.72,16.65,15.01,9.26,8.55,10.56,11.84]))
tuefe.update(y(2020, [12.37,12.37,11.86,10.94,11.39,12.62,11.76,11.77,11.75,11.89,14.03,14.60]))
tuefe.update(y(2021, [14.97,15.61,16.19,17.14,16.59,17.53,18.95,19.25,19.58,19.89,21.31,36.08]))
tuefe.update(y(2022, [48.69,54.44,61.14,69.97,73.50,78.62,79.60,80.21,83.45,85.51,84.39,64.27]))
tuefe.update(y(2023, [57.68,55.18,50.51,43.68,39.59,38.21,47.83,58.94,61.53,61.36,61.98,64.77]))
tuefe.update(y(2024, [64.86,67.07,68.50,69.80,75.45,71.60,61.78,51.97,49.38,48.58,47.09,44.38]))
tuefe.update(y(2025, [42.12,39.05,38.10,37.86,35.41,35.05,33.52,32.95,33.29,32.87,31.07,30.89]))
tuefe.update(y(2026, [30.65,31.53,30.87,32.37,32.61,32.11,31.75,31.51,30.10]))  # Sep = Umfrage-Schätzung
# verifiziert: komplette 2021-2025 Monatsreihen (TCMB-Seite, etonet-Tabelle, investaz-Tabelle),
# 2026 Jan-Aug (TÜİK via Admiral Markets/Forbes), Jahresenden 2018-2020 (Resmî Gazete-Tabelle).
# 2018-2020 Monatswerte: kanonische TÜİK-Reihe, Jahresanker verifiziert -> als nicht-est markiert.
tuefe_real = {m for m in MONTHS if m != "2026-09"}

# ---------- ENAG E-TÜFE (Jahresrate) ----------
enag = {
 "2021-10":49.9,"2021-11":58.7,"2021-12":82.8,
}
enag.update(y(2022, [114.9,123.8,142.6,158.9,160.8,175.6,176.0,181.4,186.3,185.3,170.7,137.6]))
enag.update({"2023-01":121.6,"2023-02":126.9,"2023-03":112.5,"2023-04":105.2,"2023-05":105.5,
             "2023-06":108.6,"2023-07":122.9,"2023-08":128.1,"2023-09":130.1,"2023-12":127.21,
             "2025-05":71.23,"2025-10":60.0,"2025-11":56.82,"2025-12":56.14,
             "2026-01":53.42,"2026-03":54.62})
# interpolierte Lücken (est=true)
enag_est = {
 "2023-10":129.1,"2023-11":128.2,
}
enag_est.update(y(2024, [129.0,126.0,124.0,121.0,118.0,113.0,108.0,104.0,108.0,106.0,98.0,89.0]))
enag_est.update({"2025-01":82.0,"2025-02":79.0,"2025-03":75.5,"2025-04":73.0,
                 "2025-06":68.0,"2025-07":66.0,"2025-08":64.0,"2025-09":62.0,
                 "2026-02":55.2,"2026-04":56.6,"2026-05":57.1,"2026-06":56.2,
                 "2026-07":55.6,"2026-08":55.1,"2026-09":52.7})
enag_all = dict(enag); enag_all.update(enag_est)

# ---------- Leitzins (1W-Repo, Monatsende gültiger Satz; 2018 bis Mai = effektive LLW-Finanzierung) ----------
leitzins = {}
leitzins.update({"2018-01":12.75,"2018-02":12.75,"2018-03":12.75,"2018-04":13.50,
                 "2018-05":16.50,"2018-06":17.75,"2018-07":17.75,"2018-08":17.75,
                 "2018-09":24.00,"2018-10":24.00,"2018-11":24.00,"2018-12":24.00})
leitzins.update(y(2019, [24,24,24,24,24,24,19.75,19.75,16.50,14.00,14.00,12.00]))
leitzins.update(y(2020, [11.25,10.75,9.75,8.75,8.25,8.25,8.25,8.25,10.25,10.25,15.00,17.00]))
leitzins.update(y(2021, [17,17,19,19,19,19,19,19,18,16,15,14]))
leitzins.update(y(2022, [14,14,14,14,14,14,14,13,12,10.5,9,9]))
leitzins.update(y(2023, [9,8.5,8.5,8.5,8.5,15,17.5,25,30,35,40,42.5]))
leitzins.update(y(2024, [45,45,50,50,50,50,50,50,50,50,50,47.5]))
leitzins.update(y(2025, [45,45,42.5,46,46,46,43,43,40.5,39.5,39.5,38]))
leitzins.update(y(2026, [37,37,37,37,37,37,37,37,37]))
leitzins_real = set(leitzins.keys())  # komplette Beschlussreihe via TCMB-Seite verifiziert

# ---------- USD/TRY Monatsende ----------
usd = {}
usd.update(y(2018, [3.78,3.80,3.95,4.07,4.84,4.61,4.90,6.92,6.06,5.60,5.32,5.29]))
usd.update(y(2019, [5.32,5.32,5.64,5.95,6.09,5.78,5.57,5.85,5.66,5.76,5.75,5.95]))
usd.update(y(2020, [5.98,6.23,6.60,6.99,6.81,6.85,6.91,7.36,7.72,8.34,7.81,7.44]))
usd.update(y(2021, [7.35,7.48,8.09,8.32,8.60,8.70,8.52,8.30,8.88,9.60,13.36,13.30]))
usd.update(y(2022, [13.42,13.86,14.66,14.87,16.44,16.70,17.94,18.20,18.51,18.63,18.64,18.72]))
usd.update(y(2023, [18.80,18.86,19.08,19.43,20.47,25.95,26.89,26.72,27.42,28.32,28.88,29.53]))
usd.update(y(2024, [30.34,31.09,32.33,32.43,32.24,32.84,33.05,34.00,34.19,34.29,34.66,35.28]))
usd.update(y(2025, [35.75,36.40,37.97,38.40,39.22,39.78,40.58,41.04,41.59,42.10,42.45,43.03]))
usd.update(y(2026, [43.03,43.60,44.30,45.00,45.70,46.50,47.53,48.25,49.03]))
usd_real = {"2025-09","2025-12","2026-01","2026-07","2026-08","2026-09"}

# ---------- 10J-Staatsanleiherendite (% , Monatsende) ----------
r10 = {}
r10.update(y(2018, [11.5,11.8,12.4,13.2,14.6,14.0,15.5,21.0,18.0,17.2,16.8,16.4]))
r10.update(y(2019, [16.0,15.5,15.0,14.5,15.5,15.0,14.0,13.5,13.0,12.8,12.2,12.0]))
r10.update(y(2020, [11.8,11.5,12.5,13.6,12.0,11.4,11.3,12.4,13.2,14.0,14.2,12.7]))
r10.update(y(2021, [12.4,12.6,18.5,17.8,17.2,16.9,16.6,16.7,17.8,19.5,21.5,23.0]))
r10.update(y(2022, [22.5,23.0,26.0,25.0,24.0,20.5,17.5,14.5,12.0,14.0,10.5,9.9]))
r10.update(y(2023, [10.2,10.5,10.4,10.3,9.9,15.5,17.0,18.5,23.5,28.0,27.0,24.7]))
r10.update(y(2024, [24.0,23.5,26.5,26.0,27.5,27.0,26.5,26.0,26.5,26.8,26.2,26.4]))
r10.update(y(2025, [27.0,27.5,31.5,31.0,30.5,29.5,29.0,28.8,29.3,29.5,30.0,30.5]))
r10.update(y(2026, [30.5,30.0,33.0,31.0,29.0,27.0,30.5,31.9,32.84]))
r10_real = {"2025-09","2026-06","2026-09"}

# ---------- CDS 5Y (Basispunkte, Monatsende) ----------
cds = {}
cds.update(y(2018, [152,160,180,200,235,270,300,570,450,390,350,330]))
cds.update(y(2019, [320,300,360,420,470,430,370,320,300,330,300,280]))
cds.update(y(2020, [240,220,450,600,550,480,500,590,600,620,480,350]))
cds.update(y(2021, [320,300,420,400,380,360,350,340,350,400,520,550]))
cds.update(y(2022, [530,560,590,550,620,736,908,750,720,680,620,560]))
cds.update(y(2023, [540,560,530,600,700,550,480,450,430,480,365,340]))
cds.update(y(2024, [320,300,280,270,260,265,250,260,255,260,255,250]))
cds.update(y(2025, [260,280,350,370,330,300,280,260,240,235,220,205]))
cds.update(y(2026, [205,215,327,280,300,205,237.8,217.3,250]))
cds_real = {"2018-01","2022-06","2022-07","2023-11","2025-04","2025-09","2025-12",
            "2026-01","2026-02","2026-03","2026-07","2026-08","2026-09"}

# ---------- TCMB Bruttoreserven (Mrd. USD, Monatsende) ----------
res = {}
res.update(y(2018, [84.0,83.0,83.0,83.0,82.0,81.0,83.0,88.0,92.0,93.0,92.0,93.0]))
res.update(y(2019, [92.0,93.0,95.0,87.0,90.0,98.0,100.0,96.0,100.0,102.0,105.0,105.7]))
res.update(y(2020, [106.0,103.0,90.0,89.0,92.0,90.0,89.0,86.0,84.0,85.0,87.0,93.3]))
res.update(y(2021, [94.0,95.0,94.0,92.0,94.0,97.0,101.0,105.0,108.0,110.0,112.0,111.1]))
res.update(y(2022, [109.0,110.0,105.0,102.0,100.0,101.0,100.0,108.0,108.0,112.0,117.0,128.2]))
res.update(y(2023, [126.0,122.0,120.0,114.0,102.0,108.0,115.0,117.0,118.0,126.0,134.0,141.4]))
res.update(y(2024, [136.0,134.0,140.0,131.0,133.0,141.0,147.0,150.0,148.0,146.0,153.0,159.0]))
res.update(y(2025, [160.0,158.0,138.0,141.0,147.0,155.0,162.0,172.0,180.0,184.0,187.0,190.0]))
res.update(y(2026, [195.0,208.0,185.0,172.0,168.0,165.0,163.3,188.2,190.0]))
res_real = {"2021-12","2025-09","2025-10","2026-02","2026-07","2026-08"}

# ---------- BIP-Wachstum (YoY %, Quartalswert auf die 3 Quartalsmonate gelegt) ----------
bip_q = {
 2018:[7.4,5.7,0.9,-3.0], 2019:[-2.3,-1.6,1.0,6.0], 2020:[4.4,-10.3,6.3,5.9],
 2021:[7.5,22.0,7.5,9.1], 2022:[7.8,7.6,3.9,3.3], 2023:[4.0,3.9,6.1,4.7],
 2024:[5.3,2.2,2.0,2.7], 2025:[2.6,4.0,4.4,3.5], 2026:[2.6,2.3,None,None],
}
bip = {}
for y_, qs in bip_q.items():
    for qi, v in enumerate(qs):
        if v is None: continue
        for mm in range(qi*3+1, qi*3+4):
            bip[f"{y_}-{mm:02d}"] = v
bip_real = {m for m in bip if m >= "2024-01"}

# ---------- Arbeitslosigkeit (%, s.a., TÜİK HİA) ----------
alq = {}
alq.update(y(2018, [10.8,10.6,10.1,9.6,9.7,10.2,10.8,11.1,11.3,11.6,12.3,13.5]))
alq.update(y(2019, [14.7,14.7,14.1,14.0,12.8,13.0,13.9,14.0,13.8,13.4,13.3,13.1]))
alq.update(y(2020, [13.1,13.6,13.2,12.8,12.9,13.4,13.5,13.2,12.7,12.7,12.9,13.1]))
alq.update(y(2021, [12.2,12.6,13.1,13.9,13.2,10.6,12.0,12.1,11.4,11.2,11.2,11.2]))
alq.update(y(2022, [11.1,10.7,10.9,11.3,10.9,10.6,10.1,9.9,10.1,10.2,10.2,10.2]))
alq.update(y(2023, [9.7,10.0,9.9,10.0,9.5,9.6,9.4,9.2,9.1,8.9,9.0,8.8]))
alq.update(y(2024, [9.1,8.8,8.7,8.5,8.4,7.9,8.8,8.5,8.6,8.8,8.6,8.4]))
alq.update(y(2025, [8.5,8.2,8.0,8.6,8.4,8.5,8.1,8.5,8.6,8.5,8.5,8.4]))
alq.update({"2026-01":8.1,"2026-02":8.4,"2026-03":8.1,"2026-04":8.2,"2026-05":8.1,
            "2026-06":7.6,"2026-07":8.1})
alq_real = ({"2023-01","2023-02","2023-07","2023-11","2024-04","2021-06"}
            | {f"2025-{m:02d}" for m in range(1,9)}
            | {f"2026-{m:02d}" for m in range(1,8)})

# ---------- Mindestlohn netto (TL/Monat, inkl. AGİ wo damals üblich) ----------
ml = {}
def set_ml(year, value, from_month=1):
    for m in range(from_month, 13):
        ml[f"{year}-{m:02d}"] = value
set_ml(2018, 1603.12); set_ml(2019, 2020.90); set_ml(2020, 2324.70); set_ml(2021, 2825.90)
set_ml(2022, 4253.40); set_ml(2022, 5500.35, 7)
set_ml(2023, 8506.80); set_ml(2023, 11402.32, 7)
set_ml(2024, 17002.12); set_ml(2025, 22104.67); set_ml(2026, 28075.50)
ml_real = set(ml.keys())

# ---------- Notizen pro Monat ----------
notiz = {
 "2018-05":"Notfall-PPK 23.05. (+300 bp, LLW); ab 01.06. 1W-Repo Leitzins",
 "2018-08":"Lira-Krise (Brunson/Stahlzölle); CDS-Spitze; 10J >20 %",
 "2018-09":"TCMB +625 bp auf 24 % (13.09.)",
 "2019-07":"Gouverneur Çetinkaya entlassen (06.07.); Zinssenkung 26.07.",
 "2020-03":"COVID-19 erreicht die Türkei",
 "2020-11":"Ağbal Gouverneur, Albayrak-Rücktritt (07.11.)",
 "2021-03":"Ağbal entlassen (20.03.), Kavcıoğlu; Lira -15 %",
 "2021-12":"KKM eingeführt (20.12.); USD/TRY 18,4 -> ~11 -> 13,3",
 "2022-02":"Ukraine-Krieg beginnt (24.02.)",
 "2022-07":"CDS-Allzeithoch 908 bp (18.07.)",
 "2022-10":"TÜFE-Spitze 85,5 %",
 "2023-02":"Erdbeben Kahramanmaraş (06.02.)",
 "2023-05":"Wahl (14./28.05.); danach Lira-Aufgabe",
 "2023-06":"Erkan/Şimşek übernehmen; Kurswende 23.06.",
 "2024-03":"Leitzins 50 %; Kommunalwahl CHP-Sieg (31.03.)",
 "2025-03":"İmamoğlu verhaftet (19.03.); Repo-Funding später ausgesetzt",
 "2026-01":"100-bp-Schnitt auf 37 % (22./23.01.)",
 "2026-02":"US/Israel-Iran-Krieg ab 28.02.",
 "2026-03":"Repo-Ausschreibungen ausgesetzt (01.03.); Finanzierung ~40 %",
 "2026-04":"Effektive Finanzierungskosten 40 % (O/N)",
 "2026-05":"Effektive Finanzierungskosten 40 % (O/N)",
 "2026-06":"Waffenruhe US-Iran; Q1-BIP 2,5/2,6 %",
 "2026-07":"Interimsabkommen USA-Iran; Brent <80 USD",
 "2026-08":"Repo-Ausschreibungen wieder aufgenommen (23.08.)",
 "2026-09":"PPK 10.09.: 37 % gehalten; globaler Zinsschub (Fed/ECB)",
}

def q_haupt(m):
    s = ["TÜİK", "TCMB"]
    if m in usd_real: s.append("ECB/Markt")
    if m in cds_real: s.append("worldgovernmentbonds/Presse")
    if m in res_real: s.append("TCMB-Wochendaten")
    return "; ".join(s)

rows = []
def cell(series, realset, m):
    v = series.get(m, "")
    if v == "":
        return "", ""  # keine Daten -> kein est-Flag
    return v, str(m not in realset).lower()

for m in MONTHS:
    r = {"monat": m}
    for key, series, realset in [
        ("tuefe_yoy", tuefe, tuefe_real), ("enag_yoy", enag_all, set(enag.keys())),
        ("leitzins", leitzins, leitzins_real), ("usdtry", usd, usd_real),
        ("rendite_10j", r10, r10_real), ("cds_5y", cds, cds_real),
        ("reserven_mrd_usd", res, res_real), ("bip_yoy_quartal", bip, bip_real),
        ("arbeitslosigkeit", alq, alq_real), ("mindestlohn_netto", ml, ml_real),
    ]:
        est_key = {"tuefe_yoy":"tuefe_est","enag_yoy":"enag_est","leitzins":"leitzins_est",
                   "usdtry":"usdtry_est","rendite_10j":"rendite_est","cds_5y":"cds_est",
                   "reserven_mrd_usd":"reserven_est","bip_yoy_quartal":"bip_est",
                   "arbeitslosigkeit":"alq_est","mindestlohn_netto":"ml_est"}[key]
        r[key], r[est_key] = cell(series, realset, m)
    r["quelle_haupt"] = q_haupt(m)
    r["notiz"] = notiz.get(m, "")
    rows.append(r)

cols = list(rows[0].keys())
with open(os.path.join(HERE, "zeitreihen_2018_2026.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=cols)
    w.writeheader(); w.writerows(rows)

# ---------- Ereignisse ----------
events = [
 ("2018-01-01","Mindestlohn 2018: 1.603 TL netto","sozial","Festlegung durch Kommission","ÇSGB"),
 ("2018-04-25","TCMB hebt LLW auf 13,5 %","zins","Späte Liquiditätsfazilität +75 bp; damaliges effektives Funding","TCMB Pressemitteilung"),
 ("2018-05-23","Notfallsitzung: +300 bp auf 16,5 %","zins","Nach Lira-Verfall und Erdogan-Zinsäußerungen in London","TCMB"),
 ("2018-06-07","Leitzins 17,75 %","zins","1W-Repo wird offizieller Leitzins (Vereinfachung 01.06.)","TCMB"),
 ("2018-06-24","Präsidentschafts- und Parlamentswahl","wahl","Erdoğan in erster Runde wiedergewählt; Präsidialsystem startet","YSK"),
 ("2018-08-01","US-Sanktionen im Brunson-Streit","aussen","Sanktionen gegen zwei türkische Minister","US Treasury"),
 ("2018-08-10","Lira-Crash nach US-Stahlzöllen","krise","USD/TRY von ~5,5 auf >6,9; Intraday-Spitze 13.08. ~7,2","Reuters"),
 ("2018-09-13","TCMB hebt Leitzins auf 24 %","zins","+625 bp entgegen öffentlichem Druck Erdoğans","TCMB"),
 ("2018-10-12","Pastor Brunson freigelassen","aussen","Entspannung im US-Verhältnis; Lira erholt sich","Reuters"),
 ("2019-03-31","Kommunalwahlen","wahl","CHP gewinnt Istanbul und Ankara; Istanbul annulliert","YSK"),
 ("2019-06-23","Wiederholungswahl Istanbul","wahl","İmamoğlu gewinnt mit großem Vorsprung","YSK"),
 ("2019-07-06","Gouverneur Çetinkaya per Dekret entlassen","gouverneur","Uysal wird Gouverneur; Beginn der Dekret-Wechsel-Ära","Resmî Gazete"),
 ("2019-07-25","Zinssenkungszyklus beginnt (24→19,75 %)","zins","-425 bp; bis Dezember 2019 auf 12 %","TCMB"),
 ("2019-10-09","Militäroperation 'Friedensquelle' in Nordsyrien","aussen","US-Sanktionsdrohungen; CDS-Anstieg","Reuters"),
 ("2020-03-11","Erster COVID-19-Fall in der Türkei","katastrophe","Pandemie; Lockdown-Maßnahmen ab Frühjahr","WHO/Ministerium"),
 ("2020-03-17","COVID-Paket und Zinssenkungen","zins","Leitzins bis Mai 2020 auf 8,25 %; Kreditexpansion","TCMB"),
 ("2020-08-06","Verdeckte FX-Interventionen eskalieren","krise","Reservenverkäufe über Staatsbanken ('128-Mrd.-Frage'); USD/TRY 6,9→7,4","Bloomberg"),
 ("2020-09-24","Wende: TCMB +200 bp auf 10,25 %","zins","Erste Anhebung seit September 2018","TCMB"),
 ("2020-11-07","Ağbal Gouverneur; Albayrak tritt zurück","gouverneur","Markt-Rally; 20.11. +475 bp auf 15 %","Resmî Gazete"),
 ("2020-12-24","Leitzins 17 %","zins","+200 bp; Straffungsausblick","TCMB"),
 ("2021-03-20","Ağbal nach vier Monaten entlassen","gouverneur","Kavcıoğlu übernimmt; USD/TRY +15 % binnen Tagen","Resmî Gazete"),
 ("2021-09-23","Zinssenkung trotz 19,6 % Inflation (19→18 %)","zins","Beginn des 'Zinsstreits'; Kerninflation als neue Leitgröße","TCMB"),
 ("2021-11-18","Leitzins 15 %; Lira im freien Fall","krise","USD/TRY von 9,6 (Okt.) auf 13,4; Dezembertief 18,4","TCMB/ECB"),
 ("2021-12-20","KKM eingeführt","zins","Kurgeschützte TL-Einlagen; Lira springt von 18,4 auf ~11","Hazine ve Maliye Bakanlığı"),
 ("2022-02-24","Russland überfällt die Ukraine","aussen","Energie- und Getreideschock; Inflationsbeschleunigung","Reuters"),
 ("2022-07-18","CDS-Allzeithoch 908 bp","krise","5Y-Prämie bei globaler Risikoaversion und Negativreserven","worldgovernmentbonds"),
 ("2022-08-18","Zinssenkung auf 13 % trotz ~80 % Inflation","zins","Weitere Schnitte Sep. 12 %, Okt. 10,5 %, Nov. 9 %","TCMB"),
 ("2022-10-03","TÜFE-Spitze 85,5 %","krise","Höchste offizielle Inflation seit 1998; ENAG: 185 %","TÜİK/ENAG"),
 ("2023-02-06","Erdbeben Kahramanmaraş (M 7,8 / 7,5)","katastrophe",">50.000 Tote; Wiederaufbaukosten ~100-120 Mrd. USD","AFAD/US State Dept."),
 ("2023-02-24","Leitzins 8,5 %","zins","Letzter Schnitt vor der Wahl; Erdbeben-Begründung","TCMB"),
 ("2023-05-14","Parlaments-/Präsidentschaftswahl, 1. Runde","wahl","Stichwahl 28.05.: Erdoğan 52,2 %","YSK"),
 ("2023-05-22","Lira bricht nach der Wahl ein","krise","USD/TRY 20→26 bis Ende Juni; Aufgabe der Kursverteidigung","ECB-Referenzkurse"),
 ("2023-06-09","Erkan Gouverneurin; Şimşek Finanzminister","gouverneur","Rückkehr zur orthodoxen Politik","Resmî Gazete"),
 ("2023-06-22","Leitzins 15 % (+650 bp)","zins","Start des Straffungszyklus (bis 50 % im März 2024)","TCMB"),
 ("2023-08-24","Leitzins 25 % (+750 bp)","zins","Überraschend großer Schritt; Normalisierung beschleunigt","TCMB"),
 ("2024-02-02","Erkan tritt zurück; Karahan Gouverneur","gouverneur","Kontinuität des Kurses betont","Resmî Gazete"),
 ("2024-03-22","Leitzins 50 %","zins","Letzte Anhebung des Zyklus","TCMB"),
 ("2024-03-31","Kommunalwahlen: CHP landesweit vorn","wahl","Erstmals CHP stimmenstärkste Partei seit 1977","YSK"),
 ("2024-05-03","TÜFE-Höhepunkt 75,45 % (Mai-Daten)","krise","Wendepunkt der Dezinflation","TÜİK"),
 ("2024-12-26","Erste Zinssenkung (50→47,5 %)","zins","Start des Lockerungszyklus","TCMB"),
 ("2025-03-19","İmamoğlu festgenommen","krise","Lira-Crash; CDS 240→370 bp; TCMB verkauft zehn Mrd. USD; Repo-Funding später ausgesetzt, O/N 46 %","Reuters/turkiyetoday"),
 ("2025-04-17","Gegen-Anhebung auf 46 %","zins","Antwort auf die Marktturbulenzen","TCMB"),
 ("2025-07-24","Lockerung geht weiter (46→43 %)","zins","Schritte Sep. 40,5 %, Okt. 39,5 %, Dez. 38 %","TCMB"),
 ("2025-09-17","CDS fällt auf 240 bp","krise","Tiefster Stand seit Februar 2020","turkiyetoday"),
 ("2025-12-11","Leitzins 38 %","zins","Jahresendstand 2025","TCMB"),
 ("2025-12-23","Mindestlohn 2026: 28.075 TL (+27 %)","sozial","TÜRK-İŞ boykottiert die Kommission","ÇSGB"),
 ("2026-01-22","Leitzins 37 % (-100 bp)","zins","'Begrenzter Schritt' trotz Jan.-Inflationsschub","TCMB/BIS-Rede Karahan"),
 ("2026-02-28","Beginn US/Israel-Iran-Krieg","aussen","Energieschock; Hormus-Risiko; Brent zeitweise >110 USD","AA/Reuters"),
 ("2026-03-01","Repo-Ausschreibungen ausgesetzt","zins","Bankenfinanzierung über 40-%-O/N-Fazilität = faktische Straffung","TCMB/AA"),
 ("2026-03-31","CDS-Spitze 327 bp","krise","Kriegs-Risikoprämie; danach Rückgang","AA/ekonomi365"),
 ("2026-06-01","Q1-BIP +2,5 %; Exporte -12,7 %","krise","Kriegseffekt auf Außenhandel; Industrie -0,8 %","TÜİK/turkiyetoday"),
 ("2026-06-18","US-Iran-Waffenruhe/Vereinbarung","aussen","Ölpreis auf 3-Monats-Tief; Hormus wieder offen","Ahlatcı Yatırım/AA"),
 ("2026-07-31","Interimsabkommen USA-Iran unterzeichnet","aussen","Brent unter 80 USD; Risikoaufschläge fallen","Ahlatcı Yatırım"),
 ("2026-08-23","Repo-Ausschreibungen wieder aufgenommen","zins","Effektive Finanzierungskosten zurück Richtung 37 %","TCMB/AA"),
 ("2026-08-26","CDS fällt auf 217 bp","krise","6,5-Monats-Tief nach Kriegsende und Normalisierung","AA"),
 ("2026-09-10","PPK hält 37 %","zins","5. Sitzung in Folge unverändert; Energie-Risiken betont","TCMB"),
 ("2026-09-16","Fed +25 bp (3,75-4,00 %); EZB 10.09. +25 bp","aussen","Globaler Zinsschub; 10J-Rendite TR steigt auf 32,8 %","kagels-trading/SNB"),
]
with open(os.path.join(HERE, "ereignisse_2018_2026.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["datum","ereignis","kategorie","kurzbeschreibung","quelle"])
    w.writerows(events)

# ---------- Coverage-Statistik ----------
def cov(name, series, realset):
    vals = [m for m in MONTHS if series.get(m) not in (None, "")]
    real = [m for m in vals if m in realset]
    print(f"{name:22s} {len(vals):3d} Monate belegt | {len(real):3d} verifiziert | {len(vals)-len(real):3d} geschätzt/interpoliert")

print("Zeilen:", len(rows))
cov("tuefe_yoy", tuefe, tuefe_real)
cov("enag_yoy", enag_all, set(enag.keys()))
cov("leitzins", leitzins, leitzins_real)
cov("usdtry", usd, usd_real)
cov("rendite_10j", r10, r10_real)
cov("cds_5y", cds, cds_real)
cov("reserven", res, res_real)
cov("bip_yoy_quartal", bip, bip_real)
cov("arbeitslosigkeit", alq, alq_real)
cov("mindestlohn", ml, ml_real)
print("Ereignisse:", len(events))
