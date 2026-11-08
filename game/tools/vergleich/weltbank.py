#!/usr/bin/env python3
"""Internationale Vergleichsdaten aus der Weltbank-Datenbank (Projektregel: Quelle oder Lücke).

Holt für jeden Indikator den jeweils letzten vorhandenen Wert aller Länder, bestimmt den Platz der Türkei
und legt die Werte einer Vergleichsgruppe ab. Jeder Wert trägt sein Jahr.
Ergebnis: src/data/vergleich.json

Quelle: World Bank, World Development Indicators und Worldwide Governance Indicators, Lizenz CC BY 4.0
        https://data.worldbank.org  (Schnittstelle: https://api.worldbank.org/v2)
Aufruf: python3 tools/vergleich/weltbank.py
"""
import json
import os
import statistics
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "src", "data", "vergleich.json")

LAENDER = {
    "TUR": "Türkei", "DEU": "Deutschland", "FRA": "Frankreich", "ITA": "Italien", "ESP": "Spanien", "POL": "Polen",
    "GRC": "Griechenland", "ROU": "Rumänien", "BGR": "Bulgarien", "HUN": "Ungarn", "GBR": "Vereinigtes Königreich",
    "USA": "USA", "BRA": "Brasilien", "MEX": "Mexiko", "IDN": "Indonesien", "IND": "Indien", "ZAF": "Südafrika",
    "KOR": "Südkorea", "CHN": "China", "RUS": "Russland", "IRN": "Iran", "EGY": "Ägypten", "SAU": "Saudi-Arabien",
    "ISR": "Israel", "GEO": "Georgien", "AZE": "Aserbaidschan",
    "UKR": "Ukraine", "IRQ": "Irak", "ARM": "Armenien", "SYR": "Syrien",
}
GRUPPEN = {
    "Europa": ["DEU", "FRA", "ITA", "ESP", "POL", "GRC", "ROU", "BGR", "HUN", "GBR"],
    "Große Schwellenländer": ["BRA", "MEX", "IDN", "IND", "ZAF", "KOR", "CHN"],
    "Nachbarn und Region": ["RUS", "IRN", "EGY", "SAU", "ISR", "GEO", "AZE", "UKR", "IRQ", "ARM", "SYR"],
    "Zum Vergleich": ["USA"],
}
AGGREGATE = {"EUU": "Europäische Union", "OED": "OECD-Länder", "WLD": "Welt", "UMC": "Länder mit oberem mittlerem Einkommen (wie die Türkei)"}

# code, Name, Einheit, günstiger, Thema
INDIKATOREN = [
    ("FP.CPI.TOTL.ZG", "Inflation", "% zum Vorjahr", "niedriger", "wirtschaft"),
    ("SL.UEM.TOTL.ZS", "Arbeitslosigkeit", "% der Erwerbspersonen", "niedriger", "wirtschaft"),
    ("NY.GDP.MKTP.KD.ZG", "Wirtschaftswachstum", "% zum Vorjahr", "höher", "wirtschaft"),
    ("GC.DOD.TOTL.GD.ZS", "Staatsschulden (Zentralstaat)", "% des BIP", "niedriger", "haushalt"),
    ("GC.NLD.TOTL.GD.ZS", "Haushaltssaldo (Überschuss +, Defizit −)", "% des BIP", "höher", "haushalt"),
    ("GC.XPN.INTP.RV.ZS", "Zinsausgaben des Staates", "% der Staatseinnahmen", "niedriger", "haushalt"),
    ("GC.TAX.TOTL.GD.ZS", "Steuereinnahmen", "% des BIP", None, "haushalt"),
    ("NE.EXP.GNFS.ZS", "Exporte", "% des BIP", "höher", "wirtschaft"),
    ("NE.GDI.FTOT.ZS", "Investitionen in Anlagen", "% des BIP", "höher", "wirtschaft"),
    ("BX.KLT.DINV.WD.GD.ZS", "Ausländische Direktinvestitionen", "% des BIP", "höher", "wirtschaft"),
    ("FS.AST.PRVT.GD.ZS", "Kredite an Unternehmen und Haushalte", "% des BIP", None, "wirtschaft"),
    ("SL.GDP.PCAP.EM.KD", "Produktivität (Wirtschaftsleistung je Erwerbstätigem)", "US-Dollar (konstante Preise)", "höher", "wirtschaft"),
    ("NY.GNP.PCAP.PP.CD", "Einkommen je Einwohner (kaufkraftbereinigt)", "internationale Dollar", "höher", "wirtschaft"),
    ("SI.POV.GINI", "Ungleichheit (Gini-Index)", "0 bis 100", "niedriger", "arbeit"),
    ("SI.POV.UMIC", "Armutsquote (Grenze für Länder mit oberem mittlerem Einkommen)", "% der Bevölkerung", "niedriger", "arbeit"),
    ("SL.UEM.1524.ZS", "Jugendarbeitslosigkeit", "% der 15- bis 24-Jährigen", "niedriger", "arbeit"),
    ("SL.TLF.CACT.FE.ZS", "Frauenerwerbstätigkeit", "% der Frauen ab 15", "höher", "arbeit"),
    ("SP.DYN.LE00.IN", "Lebenserwartung", "Jahre", "höher", "gesundheit"),
    ("SP.DYN.TFRT.IN", "Geburtenrate", "Kinder je Frau", None, "gesellschaft"),
    ("SH.MED.PHYS.ZS", "Ärztinnen und Ärzte", "je 1.000 Einwohner", "höher", "gesundheit"),
    ("SH.MED.BEDS.ZS", "Krankenhausbetten", "je 1.000 Einwohner", "höher", "gesundheit"),
    ("SE.XPD.TOTL.GD.ZS", "Staatliche Bildungsausgaben", "% des BIP", "höher", "bildung"),
    ("SE.TER.ENRR", "Studierendenquote", "% (brutto)", "höher", "bildung"),
    ("GB.XPD.RSDV.GD.ZS", "Forschungsausgaben", "% des BIP", "höher", "bildung"),
    ("IT.NET.USER.ZS", "Internetnutzung", "% der Bevölkerung", "höher", "infrastruktur"),
    ("LP.LPI.INFR.XQ", "Qualität der Verkehrs- und Handelsinfrastruktur", "1 (schlecht) bis 5 (gut)", "höher", "infrastruktur"),
    ("LP.LPI.OVRL.XQ", "Logistikleistung insgesamt", "1 (schlecht) bis 5 (gut)", "höher", "infrastruktur"),
    ("EG.ELC.RNEW.ZS", "Erneuerbarer Strom", "% der Stromerzeugung", "höher", "energie"),
    ("EG.IMP.CONS.ZS", "Energieimporte (netto)", "% des Energieverbrauchs", "niedriger", "energie"),
    ("EN.ATM.PM25.MC.M3", "Feinstaubbelastung (PM2,5)", "Mikrogramm je Kubikmeter", "niedriger", "energie"),
    ("EN.GHG.CO2.PC.CE.AR5", "CO₂-Ausstoß", "Tonnen je Einwohner", "niedriger", "energie"),
    ("SH.H2O.SMDW.ZS", "Sicheres Trinkwasser", "% der Bevölkerung", "höher", "landwirtschaft"),
    ("AG.YLD.CREL.KG", "Getreideertrag", "Kilogramm je Hektar", "höher", "landwirtschaft"),
    ("ST.INT.RCPT.XP.ZS", "Tourismuseinnahmen", "% der Exporte", None, "wirtschaft"),
    ("VC.IHR.PSRC.P5", "Tötungsdelikte", "je 100.000 Einwohner", "niedriger", "sicherheit"),
    ("MS.MIL.XPND.GD.ZS", "Militärausgaben", "% des BIP", None, "sicherheit"),
    ("GOV_WGI_CC.EST", "Kontrolle der Korruption", "−2,5 (schwach) bis +2,5 (stark)", "höher", "sicherheit"),
    ("GOV_WGI_RL.EST", "Rechtsstaatlichkeit", "−2,5 (schwach) bis +2,5 (stark)", "höher", "sicherheit"),
    ("GOV_WGI_VA.EST", "Mitsprache und Rechenschaft (Freiheit der Bürger)", "−2,5 (schwach) bis +2,5 (stark)", "höher", "gesellschaft"),
    ("GOV_WGI_GE.EST", "Wirksamkeit der Regierung", "−2,5 (schwach) bis +2,5 (stark)", "höher", "gesellschaft"),
]


def get(url: str):
    for versuch in range(4):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return json.loads(r.read())
        except Exception as e:  # noqa: BLE001
            if versuch == 3:
                print("FEHLER", url, e, file=sys.stderr)
                return None
    return None


meta = get("https://api.worldbank.org/v2/country?format=json&per_page=400")
echte = {c["id"] for c in meta[1] if c["region"]["value"] != "Aggregates"}
print(len(echte), "Länder")


def hole(ind):
    code, name, einheit, besser, thema = ind
    d = get(f"https://api.worldbank.org/v2/country/all/indicator/{code}?format=json&mrnev=1&per_page=1000")
    if not d or len(d) < 2 or not d[1]:
        print("keine Daten:", code, file=sys.stderr)
        return None
    werte = {}
    for e in d[1]:
        iso = e.get("countryiso3code") or ""
        if e["value"] is None or not iso:
            continue
        werte[iso] = (float(e["value"]), int(e["date"]))
    tur = werte.get("TUR")
    echt = {k: v for k, v in werte.items() if k in echte}
    if not tur or len(echt) < 30:
        print("zu wenig Daten:", code, len(echt), file=sys.stderr)
        return None
    rang = 1 + sum(1 for k, v in echt.items() if v[0] > tur[0])
    med = statistics.median(v[0] for v in echt.values())
    eintrag = {
        "name": name,
        "einheit": einheit,
        "besser": besser,
        "thema": thema,
        "tur": {"wert": round(tur[0], 3), "jahr": tur[1], "rang": rang, "von": len(echt)},
        "median": round(med, 3),
        "laender": {k: [round(v[0], 3), v[1]] for k, v in werte.items() if k in LAENDER and k != "TUR"},
        "aggregate": {k: [round(v[0], 3), v[1]] for k, v in werte.items() if k in AGGREGATE},
    }
    return code, eintrag


def abwertung():
    """Wertverlust der Landeswährung gegenüber dem US-Dollar im letzten Jahr, aus den Jahresdurchschnittskursen."""
    d = get("https://api.worldbank.org/v2/country/all/indicator/PA.NUS.FCRF?format=json&mrv=3&per_page=2000")
    if not d:
        return None
    reihen = {}
    for e in d[1]:
        iso = e.get("countryiso3code") or ""
        if e["value"] is None or iso not in echte:
            continue
        reihen.setdefault(iso, []).append((int(e["date"]), float(e["value"])))
    werte = {}
    for iso, r in reihen.items():
        r.sort()
        if len(r) >= 2 and r[-2][1] > 0:
            werte[iso] = ((r[-1][1] / r[-2][1] - 1) * 100, r[-1][0])
    tur = werte.get("TUR")
    if not tur:
        return None
    rang = 1 + sum(1 for k, v in werte.items() if v[0] > tur[0])
    return "PA.NUS.FCRF.ABW", {
        "name": "Abwertung der Währung gegenüber dem US-Dollar",
        "einheit": "% im Jahresdurchschnitt gegenüber dem Vorjahr",
        "besser": "niedriger",
        "thema": "wirtschaft",
        "tur": {"wert": round(tur[0], 3), "jahr": tur[1], "rang": rang, "von": len(werte)},
        "median": round(statistics.median(v[0] for v in werte.values()), 3),
        "laender": {k: [round(v[0], 3), v[1]] for k, v in werte.items() if k in LAENDER and k != "TUR"},
        "aggregate": {},
    }


with ThreadPoolExecutor(8) as ex:
    ergebnisse = list(ex.map(hole, INDIKATOREN))
ind = {c: e for c, e in (r for r in ergebnisse if r)}
a = abwertung()
if a:
    ind[a[0]] = a[1]

ausgabe = {
    "quelle": "Weltbank: World Development Indicators und Worldwide Governance Indicators (CC BY 4.0), https://data.worldbank.org",
    "abgerufen": date.today().isoformat(),
    "hinweis": "Jeder Wert ist der jeweils letzte vorhandene Wert des Landes; das Jahr steht dabei. Platz 1 = höchster Wert der Welt.",
    "laender": LAENDER,
    "gruppen": GRUPPEN,
    "aggregate": AGGREGATE,
    "indikatoren": ind,
}
with open(OUT, "w") as f:
    json.dump(ausgabe, f, ensure_ascii=False, separators=(",", ":"))
print(len(ind), "von", len(INDIKATOREN) + 1, "Indikatoren;", round(os.path.getsize(OUT) / 1024), "KB")
for code, e in ind.items():
    t = e["tur"]
    print(f"{code:26} {e['name'][:44]:44} Türkei {t['wert']:>10} ({t['jahr']}) Platz {t['rang']:>3} von {t['von']}")
