# Recherche: Provinz-Profile — Schema, Quellen, Cluster, Übertrag ins Politiknetz

Stand: 30. September 2026. Auftrag: Das Politiknetz startet bislang in allen 81 Provinzen gleich
([POLITIKNETZ.md](POLITIKNETZ.md), Abschnitt „Stand und Grenzen"). Dieses Dokument begründet das
Provinz-Profil-Schema, dokumentiert Quellen und Abdeckungsgrad, leitet acht Provinz-Archätypen aus
den Daten ab und schlägt vor, wie diese Archätypen die Netz-Startwerte differenzieren — ohne dass
81 Einzelkalibrierungen nötig werden.

**Artefakte:**
- `kalibrierung/provinz_profile.csv` — 81 Zeilen × 28 Spalten (Datendictionary unten, Abschnitt 6)
- `kalibrierung/quellen/` — Rohquellen (SEGE-2025-PDF, OSBÜK-HTML, KTB-XLSX, abgeleitete JSONs)
- `kalibrierung/baue_profil.py`, `kalibrierung/baue_cluster.py` — reproduzierbarer Bau

---

## 1. Schema-Entwurf: Welche Größen machen Provinzen spielerisch verschieden?

Aus dem Vorschlag (Sektoren, SEGE, Export, OSB, Agrar, Tourismus, Energie, Wasser, Brain-Drain,
Deprem, Grenz-/Küstenlage) wurden zwölf Größen übernommen bzw. verschärft. Kriterien: (a) Wirkung
auf vorhandene Netz-Knoten, (b) freie Datenlage für möglichst alle 81 Provinzen, (c) geringe
Korrelation untereinander.

| # | Größe | Spielerische Funktion (Netz-Knoten) |
|---|-------|--------------------------------------|
| 1 | **SEGE-2025 Rang/Skor/Kademe** | Meta-Anker für alles, was keine eigene Spalte hat (Gesundheit, Bildung, Verwaltung, Lebensqualität) |
| 2 | **Export 2025** (Wert wo belegt, Klasse 0–5 für alle, ≥1-Mrd-Marke) | `export`, `logistik`, `industrie` |
| 3 | **OSB-Anzahl** (gesamt/in Betrieb) | `industrie`, `arbeitsplaetze_industrie`, `mittelstand` |
| 4 | **Übernachtungen 2025** (absolut + pro Kopf) | `tourismus`, `tourismus`-Kostenpfad, Küsten-Mieten |
| 5 | **Netto-Migration ‰** (belegt/geschätzt) | `abwanderung`, `p_abwanderung`, `p_landflucht`, `mieten` |
| 6 | **Hauptprodukte** (Text) | `landwirtschaft_einkommen`, Ernteschock-Ereignisse, Wasser-Politik |
| 7 | **Wasserstress-Klasse 1–5** (Havza-basiert) | `p_wassermangel`, `wasserversorgung`, Bewässerungs-Konflikte |
| 8 | **Deprem-Risiko 1–5** (AFAD-basiert) | `p_erdbebengefahr`, `erdbebenvorsorge`, Katastrophen-Ereignisse |
| 9 | **Strom-Bilanz −2…+2** (Erzeugung vs. Verbrauch, abgeleitet) | `stromversorgung`, `p_stromausfaelle`, `energiepreise` |
| 10 | **Küste / Grenzland** (deterministisch) | `logistik`, Schmuggel-/Grenz-Ereignisse, `p_migrationsdruck` |
| 11 | **Hauptsektor** (M/T/I/A/E/L/S, abgeleitet) | Sektorale Schock-Anfälligkeit (Tourismus-Crash vs. Industriezyklus vs. Dürre) |
| 12 | **Cluster (Archätyp)** | Träger der Startwert-Deltas (Abschnitt 3–4) |

**Bewusst weggelassen:** Provinz-Mieten (keine freie amtliche il-bazlı-Serie; TÜİK-CPI ist nur
regional), GSYH-Sektoranteile je Provinz komplett (TÜİK veröffentlicht sie, aber nicht frei
maschinenlesbar — Anker siehe Lückenliste), Arbeitslosigkeit (existiert bereits in
`provinzdaten.json` und fließt als Eingangsgröße ins Netz).

---

## 2. Datenbeschaffung: Quellen und Abdeckungsgrad je Größe

### Vollständig mit echten Werten (81/81)

**SEGE-2025 (Rang, Skor, Kademe 1–6).** Sanayi ve Teknoloji Bakanlığı, Kalkınma Ajansları Genel
Müdürlüğü: „İllerin ve Bölgelerin Sosyo-Ekonomik Gelişmişlik Sıralaması Araştırması SEGE-2025",
Ankara, Ekim 2025 — die **neueste Auflage** (Nachfolger von İl SEGE-2017), 52 Variablen in acht
Dimensionen, Datenjahre 2020–2025. Tablo 12 liefert alle 81 Ränge/Skore/Kademen; PDF liegt unter
`quellen/sege2025.pdf`. Spitze: İstanbul 4,419 … Ende: Ağrı −1,826 (Rang 81), Muş 80, Şanlıurfa 79.
Kademen-Verteilung: 8 / 13 / 17 / 11 / 15 / 17 Provinzen.
**Auffällig:** Hatay nach dem Beben 2023 auf Rang 50 (Kademe 5) abgestürzt; Kahramanmaraş 63,
Adıyaman 69. Quelle: kalkinmakutuphanesi.gov.tr/assets/upload/dosyalar/l-sege-2025.pdf

**OSB-Anzahl.** OSBÜK (Organize Sanayi Bölgeleri Üst Kuruluşu), Live-Liste `osbuk.org`
(Abruf 30.09.2026): 419 Einträge, davon 302 „İŞLETMEDE (FAALİYETTE)". Plausibilitätsabgleich mit
OSBÜK-Präsident Kütükcü (AA, 10.01.2026): 416 OSB Ende 2025 (371 Sanayi + 45 Tarım),
>68.000 Fabriken, >2,7 Mio. Beschäftigte. Spitze: Bursa 17/17, Kocaeli 14/14, İstanbul 9/8,
Ankara 15/13, Konya 12/8, Gaziantep 8/5 (gesamt/faaliyet).

**Übernachtungen (geceleme) 2025.** Kültür ve Turizm Bakanlığı (YİGM), „Konaklama Yıllık Bülten
2025" (XLSX, Blatt „İl İlçe"): Ankünfte und Übernachtungen je Provinz, aufgeteilt yabancı/yerli;
Türkiye-Summe 252.323.483 Übernachtungen — die extrahierte Provinzsumme stimmt **exakt** überein
(Iğdır 82.732 und Kilis 23.217 aus dem Türkiye Turizm Veri Atlası ergänzt; der Rest ergab sich aus
der Summendifferenz). Spitze: Antalya 111,3 Mio (44 % des Landes), İstanbul 40,1 Mio, Muğla 24,7 Mio,
İzmir ~11 Mio, Nevşehir 4,1 Mio. Quelle: yigm.ktb.gov.tr (Eklenti 145670).

**Küste (28) / Grenzland (26).** Deterministisch aus Geographie; belegt durch die bestehende
Karten-Topologie (`game/src/data/provinzen.json`, `nachbarn.json`). Keine Quellenflag nötig.

### Klassifiziert aus offizieller Quelle (81/81, Einzelfälle unsicher)

**Deprem-Risiko 1–5.** AFAD, Türkiye Deprem Tehlike Haritası (TDTH 2018, PGA-basiert), übernommen
aus den Sekundärlisten von NTV (15.05.2025), CNN Türk (30.07.2026) und Türkiye Gazetesi
(27.01.2026; MTA: 45 Provinzen, 110 Landkreise auf aktiven Verwerfungen). Mapping: 1. derece → 5
(31 Provinzen, darunter İzmir, Kocaeli, Hatay, Erzincan, Bingöl), 2. derece → 4 (u. a. İstanbul,
Tekirdağ, Kahramanmaraş, Van, Malatya, Adana-Tendenz), 3. derece → 3, 4./5. derece → 2/1 (Sinop,
Giresun, Trabzon, Rize, Artvin, Kırklareli, Nevşehir, Niğde, Aksaray, Konya, Karaman).
**Unsicher:** Burdur (nicht gelistet → 4, Grabentektonik SW-Anatolien), Adana (Listenkonflikt 2
vs. 4/5 → 3), Kırşehir (NTV 1. derece vs. „neue Kartierung sicher" → 5 nach NTV), Siirt
(NTV 1. derece vs. Lokalquelle 4 → 5 nach NTV). *Hinweis: Das offizielle 5-Zonen-System stammt aus
der Karte von 1996; TDTH 2018 nutzt Spektralbeschleunigung — die Nachrichtenlisten mischen beide
Logiken. Für das Spiel ist die Richtung robust.*

**Wasserstress 1–5.** Havza-basierte redaktionelle Zuordnung, gestützt auf: WWF/DSİ-Havza-Listen
(Marmara, Gediz, Küçük Menderes, Susurluk, Asi, Akarçay, Burdur < 1.000 m³/Kopf; Meriç-Ergene,
Yeşilırmak, Kızılırmak, Büyük Menderes, Konya Kapalı, Van Gölü, Seyhan im Stress), BBC Türkçe
(25.07.2025: Türkiye im Schnitt ~1.330 m³/Kopf, „Su fakiri"-Schwelle 1.000 bereits in vielen
Havzalar unterschritten), DSİ-Barajdoluluk 2025 (Ankara 18,8 %, Konya 17 %, Marmara 38 %),
ÇMO/Türkiye Sağlıklı Kentler Birliği (10/2025: Doğu Karadeniz reich, Konya Kapalı + Burdur kritisch).
Stärkste Spiel-These: **Konya-Becken (Konya, Aksaray, Karaman, Niğde) + Göller (Burdur, Isparta) = 5**;
Marmara-Verbrauchsmetropolen İstanbul 5 / Kocaeli 4.

**Export ≥1 Mrd USD (0/1).** Ticaret Bakanlığı, PM 13.01.2026: 2025 haben 33 Provinzen >1 Mrd USD
exportiert (2024: 31; neu Bolu und Giresun). Die 31er-Liste 2024 liegt namentlich vor
(PM 06.01.2025) → 33er-Menge 2025 = Liste 2024 + {Bolu, Giresun}.

### Teilbelegt mit abgeleitetem Rest

**Export 2025 (Mio USD).** Belegt (12/81): İstanbul 57.758 und Kocaeli 35.086 (faaliyet-Methode;
KOSANO unter Berufung auf Ticaret Bakanlığı, 07/2026), Mersin 3.630, Hatay 3.471, Adana 3.044,
Osmaniye 155 (TİM; AA 08.01.2026), Denizli 4.700 (DENİB/TİM), Burdur 239 (BUTSO/TİM),
Kastamonu 463 (TİM; faaliyet-Methode 132), Gaziantep ~10.400 (GAİB, Jan 817,4 hochgerechnet
[unverifiziert]), Isparta ~490, Antalya ~2.100 (TİM Oca–Kas + Dezember-Schätzung).
Rest: ordinale **Export-Klasse 0–5** aus Monatswerten des Ticaret-Bakanlığı-Bulletins Dezember 2025
(Top 15), der 33er-Liste und TİM-Regionalberichten. **Methodenbruch beachten:** faaliyet
(Produktionsort) vs. TİM (Firmensitz) weicht bis Faktor 2 ab (Fall Manisa: 5,5 Mrd vs. 3,8 Mrd
Oca–Eyl 2025) — deshalb bewusst keine gemischte Vollspalte.

**Netto-Migration ‰.** Belegt (27/81), TÜİK „İç Göç İstatistikleri" 2024 (Bülten 14.07.2025) und
2025 (Bülten 14.07.2026), via Dünya (Naki Bakır), İHA, AA:
- 2024 Spitze+: Yalova +15,59, Tekirdağ +13,09, Muğla +11,64, Tokat +10,4, Antalya +9,1,
  Ankara +8,91; İzmir +3,5, Samsun +2,60, İstanbul +1,7.
- 2024 Boden−: Gümüşhane −42,80, Bayburt −35,16, Siirt −33,96, Ağrı −32,6, Çankırı −27,7,
  Muş −27,3, Kars −25,3, Tunceli −24,3, Sivas −21,1, Ardahan −20,3, Çorum −12,82 (Rang 60),
  Amasya ≈ −1,8; Netto-Personen belegt: Van −22.605, Şanlıurfa −19.154, Erzurum −11.908.
- 2025: Ankara +31.172 (Netto-Spitze), Antalya +28.378, Kocaeli +15.078; İstanbul −41.346
  (−2,62 ‰, erstmals wieder Netto-Verlierer), Van −20.238, Şanlıurfa −15.625; Raten: Yalova +20,5,
  Tekirdağ +11, Muğla +10,9, Ağrı −27.
Rest (54): Schätzung per linearer Regression auf den SEGE-Skor (rate = 8,63·skor − 11,35; n = 27),
begrenzt auf [−45; +21] und mit `migration_flag = geschaetzt` markiert. 2024: 30 Provinzen
Netto-Gewinner, 51 Verlierer (TÜİK).

### Abgeleitet / redaktionell

**Strom-Bilanz −2…+2.** Aus Kraftwerks-Geographie (EÜAŞ/TEİAŞ-Strukturwissen, OSM-`kraftwerke`-
Zählung in `provinz_infra.json` als Gegenprobe): starke Überschusse Şanlıurfa (Atatürk), Diyarbakır
(Karakaya), Elazığ (Keban), Artvin (Çoruh-Kaskade), Zonguldak (ZETES), Kahramanmaraş
(Afşin-Elbistan), Hatay (Erzin-CCPP); klare Defizite İstanbul, Kocaeli, Tekirdağ, Yalova, Düzce.
Kontrollanker TEDAŞ 2024 (Bericht 06/2025): Pro-Kopf-Verbrauch 2023 Spitze Bilecik 9.871 kWh,
Kocaeli 8.007, Karabük 7.667; Boden Ağrı 1.026, Muş 1.076, Hakkari 1.079 kWh. [unverifiziert in
der Einzelzuordnung]

**Hauptprodukte.** Redaktionelles Agrar-Strukturwissen, belegte Anker: Fındık 88,4 % aus Ordu,
Samsun, Sakarya, Giresun, Düzce, Trabzon (Rekabet Kurumu 2024); Malatya 80–90 % der
Trockenaprikose (TÜİK, 2025); Manisa ~90 % Sultaniye-Tafeltrauben; Konya größter
Tarım-GSYH-Anteil der Türkei (5,6 %, TÜİK İl GSYH 2024); Şanlıurfa/Adana Baumwolle (GAP);
Rize Tee. Zum Donnerjahr 2025 (zirai don): Kayısı −65 %, Antep fıstığı −55 %, Fındık −38,5 %,
Kiraz −56 % (TÜİK 1. Schätzung 2025) — als Ereignis-Pool nutzbar.

**Hauptsektor** (M/T/I/A/S): Regelwerk aus Metropol-Status, geceleme/Kopf ≥ 4, OSB+Export-Klasse,
Rest Agrar (Datendictionary Abschnitt 6).

### Abdeckungsgrad (Kompakt)

| Größe | Echt belegt | Klassifiziert/abgeleitet | Flag |
|---|---|---|---|
| SEGE Rang/Skor/Kademe | **81/81** | — | belegt (STB 2025) |
| OSB gesamt/faaliyet | **81/81** | — | belegt (OSBÜK 2026) |
| Übernachtungen 2025 | **81/81** | — | belegt (KTB 2025) |
| Küste/Grenzland | **81/81** | — | deterministisch |
| Deprem-Risiko | 77/81 Listenlage | 4 (Burdur u. Konfliktfälle) | belegt/unsicher gemischt |
| Wasserstress | — | **81/81** Havza-Klassen | abgeleitet (DSİ/WWF) |
| Export ≥1 Mrd (33er) | **81/81** (Menge) | — | belegt (Bakanlık 2026) |
| Export Mio USD | 12/81 | 69 Klasse 0–5 | gemischt |
| Netto-Migration | 27/81 | 54 SEGE-Regression | belegt/geschaetzt |
| Strom-Bilanz | 7 Kontrollanker | **81/81** | abgeleitet [unverifiziert] |
| Hauptprodukte | 6 Ankerprodukte | **81/81** redaktionell | gemischt |

---

## 3. Cluster-Analyse: Acht Provinz-Archätypen

**Methode.** k-means (numpy, 30 Restarts, beste SSE) über standardisierte Merkmale: SEGE-Skor,
Export-Klasse, log(OSB faaliyet), log(Übernachtungen/Kopf), Netto-Migration, Wasserstress, Küste,
Grenzland. k = 8 schlägt k = 7 (SSE 187 vs. 218) und trennt die beiden empirisch klar
unterscheidbaren Peripherie-Typen (Südost/GAP vs. fernöstliche Peripherie). Zwei redaktionelle
Prüfungen: Gaziantep/Kahramanmaraş bleiben trotz Industrie im Südost-Cluster (Datenlage: SEGE 30/63,
Grenze, Beben — industrielle Zentren *innerhalb* des Clusters); Çankırı bleibt trotz Binnenlage bei
„Ost peripher" (SEGE 53, Migration −27,7 ‰ — „innere Peripherie").

| # | Archätyp | n | Mitglieder | Profil (Cluster-Mittel) |
|---|----------|---|------------|--------------------------|
| 1 | **Metropol-Industrie-Kern** | 6 | İstanbul, Ankara, İzmir, Kocaeli, Bursa, Tekirdağ | SEGE +2,18 · Mig +5,8 ‰ · OSB 13,0 · ExportK 4,3 · Strom −1,5 |
| 2 | **Industrie- und Hafen-Gürtel (2. Reihe)** | 12 | Adana, Mersin, Sakarya, Düzce, Yalova, Balıkesir, Çanakkale, Edirne, Kırklareli, Zonguldak, Samsun, Hatay | SEGE +0,45 · Mig −5,0 ‰ · OSB 4,2 · Deprem 4,1 |
| 3 | **Tourismus-Küste** | 4 | Antalya, Muğla, Aydın, Nevşehir | Gec/Kopf 20,4 · Mig +3,6 ‰ · SEGE +0,89 · Strom +0,5 |
| 4 | **Anatolische Mittelstädte / Tiger** | 17 | Denizli, Eskişehir, Kayseri, Çorum, Osmaniye, Karabük, Bilecik, Bolu, Kırıkkale, Kırşehir, Yozgat, Sivas, Tokat, Amasya, Kastamonu, Erzurum, Erzincan | SEGE +0,07 · Mig −8,8 ‰ · OSB 3,2 |
| 5 | **Agrar-Steppe İç Ege / Zentralanatolien** | 10 | Konya, Manisa, Uşak, Kütahya, Afyonkarahisar, Burdur, Isparta, Karaman, Aksaray, Niğde | Wasser 4,6 (trockenster) · Mig −10,3 ‰ · OSB 4,2 |
| 6 | **Karadeniz-Fındık-Peripherie** | 7 | Ordu, Giresun, Trabzon, Rize, Artvin, Sinop, Bartın | Wasser 1,7 (feuchtester) · Mig −12,5 ‰ · OSB 1,7 |
| 7 | **Südost/GAP: Grenz-Industrie & Trockenlandwirtschaft** | 14 | Gaziantep, Şanlıurfa, Kahramanmaraş, Malatya, Elazığ, Diyarbakır, Adıyaman, Mardin, Batman, Kilis, Şırnak, Van, Iğdır, Kars | SEGE −0,83 · Mig −18,4 ‰ · Grenzland 11/14 |
| 8 | **Ost-Anatolien peripher** | 11 | Ağrı, Muş, Bitlis, Bingöl, Hakkari, Siirt, Tunceli, Ardahan, Bayburt, Gümüşhane, Çankırı | SEGE −1,07 · Mig −28,3 ‰ · ExportK 0,0 · OSB 1,1 |

**Befunde hinter den Clustern:**
- Cluster 1 trägt ~53 % des GSYH (İstanbul 29,2 % + Ankara 10,5 % + İzmir 5,7 % …; TÜİK 2024) und
  ist der einzige mit Netto-Fachkräfte-Zustrom — aber intern gespalten: İstanbul verlor 2025
  erstmals wieder Netto-Einwohner (−41.346), während der Speckgürtel (Yalova +20,5 ‰, Tekirdağ
  +11 ‰) zieht.
- Cluster 3 ist eine eigene Welt: 20,4 Übernachtungen pro Kopf (Landesschnitt 2,9) — ein
  Tourismus-Schock trifft hier 20-mal so hart wie den Durchschnitt.
- Cluster 5 ist das Wasser-Krisengebiet (Konya-Becken: Grundwasser-Obruklar, Barjen 17–19 %).
- Cluster 8 ist demografisch im freien Fall: alle 11 Provinzen mit Netto-Migration < −20 ‰
  (belegt: Ağrı −32,6, Muş −27,3, Gümüşhane −42,8, Bayburt −35,2, Siirt −34,0, Tunceli −24,3,
  Kars −25,3, Ardahan −20,3, Çankırı −27,7; geschätzt: Bitlis, Bingöl, Hakkari in derselben Größenordnung).
- Cluster 7 vereint die ärmsten Provinzen (Şanlıurfa 188.144 TL, Ağrı 194.660 TL, Van 203.049 TL
  Pro-Kopf-GSYH 2024 — die drei letzten Plätze, TÜİK) mit zwei Industrie-Export-Zentren
  (Gaziantep ~10 Mrd USD, Kahramanmaraş >1 Mrd USD).

---

## 4. Übertrag ins Spiel: Archätypen → Netz-Startwerte

**Prinzip — zwei Schichten, keine 81 Kalibrierungen:**
1. **Echtdaten-Schicht** (schon vorhanden): Bevölkerung, BIP/Kopf, Arbeitslosigkeit, Wahl-/Bürgermeister-Daten aus `provinzdaten.json` + Infrastruktur aus `provinz_infra.json`.
2. **Archätyp-Schicht** (dieser Vorschlag): additive Deltas auf die Katalog-Startwerte aus
   `politiknetz.ts`, **nur für Knoten ohne Echtdaten-Beleg**: `start[prov][knoten] =
   clamp(start_katalog + delta_cluster[knoten], 0, 100)`. Wer eine Provinz genauer sehen will, legt
   optional pro Cluster 2–3 Ausreißer-Overrides über die CSV-Spalten (z. B. Gaziantep-Industrie
   zusätzlich +3, İstanbul-Miete zusätzlich +5) — die Daten dafür stehen in
   `provinz_profile.csv`, müssen aber nicht genutzt werden.

**Vorschlag Deltas** (Punkte auf der 0–100-Skala; Richtung durch die Cluster-Statistiken oben
begründet; Magnituden sind Spielparameter, grob auf die Verteilung kalibriert):

| Knoten (Katalog-ID) | C1 Metro | C2 Gürtel | C3 Tourismus | C4 Tiger | C5 Steppe | C6 Karadeniz | C7 Südost | C8 Ost |
|---|---|---|---|---|---|---|---|---|
| `mieten` | +15 | +4 | +8 | +2 | 0 | −2 | −4 | −10 |
| `p_wohnungsnot` | +12 | +4 | +6 | +2 | 0 | −2 | −2 | −8 |
| `lebenshaltung` | +8 | +3 | +4 | 0 | 0 | 0 | +3 | +3 |
| `abwanderung` | −5 | 0 | 0 | +3 | +8 | +10 | +8 | +12 |
| `p_abwanderung` | −8 | −2 | −2 | +2 | +8 | +10 | +8 | +15 |
| `landflucht` / `p_landflucht` | −15/−20 | −5 | −3 | +2 | +8 | +10 | +8 | +15 |
| `p_wassermangel` | +8 | +2 | +5 | 0 | +15 | −10 | +5 | 0 |
| `wasserversorgung` | −5 | 0 | −3 | 0 | −10 | +5 | −5 | 0 |
| `industrie` | +5 | +8 | −3 | +5 | +2 | −5 | +2 | −10 |
| `export` | +5 | +8 | +2 | +3 | 0 | −5 | +2 | −10 |
| `logistik` | +10 | +8 | +3 | +2 | 0 | −3 | +2 | −8 |
| `tourismus` | +5 | +2 | +20 | 0 | −3 | +3 | 0 | −5 |
| `landwirtschaft_einkommen` | −5 | +2 | +3 | +2 | +5 | +5 | +5 | 0 |
| `arbeitslosigkeit` (Eingang)* | −2 | 0 | 0 | −3 | 0 | +3 | +10 | +10 |
| `jugendarbeitslosigkeit` / `p_jugendarbeitslosigkeit` | +3 | 0 | +3 | 0 | +3 | +5 | +15 | +10 |
| `p_armut` | −3 | −2 | −2 | 0 | +3 | +5 | +10 | +12 |
| `schattenwirtschaft` | 0 | 0 | +5 | +2 | +3 | +5 | +10 | +8 |
| `p_migrationsdruck` | +3 | +2 | +3 | 0 | 0 | 0 | +15 | +3 |
| `p_erdbebengefahr` | +5 | +8 | +5 | +3 | −8 | −3 | +8 | +3 |
| `erdbebenvorsorge` | +3 | 0 | 0 | 0 | 0 | 0 | −8 | −3 |
| `stromversorgung` | −5 | 0 | +2 | 0 | 0 | +2 | 0 | −3 |
| `p_aerztemangel` | −8 | −3 | 0 | 0 | +3 | +5 | +8 | +10 |
| `ungleichheit` | +10 | +3 | +3 | 0 | 0 | 0 | +5 | +3 |
| `terrorgefahr` | 0 | 0 | 0 | 0 | 0 | 0 | +10 | +5 |
| `p_luftverschmutzung` | +10 | +6 | −3 | +2 | 0 | −3 | +2 | −3 |

\* `arbeitslosigkeit` ist Eingangsgröße mit echten Provinzwerten; das Delta käme nur als
Modifikator der nationalen Projektion infrage — **Empfehlung: dort nicht anfassen**, echte Werte
stehen schon in `provinzdaten.json`.

**Umsetzung im Code (Vorschlag):** eine Datei `game/src/data/provinz_archetypen.ts` mit der
8-Zeilen-Delta-Matrix plus `provinz → cluster_id` aus `provinz_profile.csv`; der Sim-Start
(`netz.ts`) addiert die Deltas einmalig. Testbar wie die bisherigen Netz-Prüfungen: Start-Ruhe
bleibt gegeben (Deltas verändern nur Startpunkte), akute Probleme je Region unterschiedlich
(Osten startet mit `p_abwanderung`/`p_landflucht` nahe/über Schwelle 60 → frühe Ereignisse;
Konya mit `p_wassermangel` ~55 kurz vor Schwelle → Wasserpolitik wird dort belohnt; Metropolen
mit `p_wohnungsnot` ~67 akut → Mietpolitik wird in İstanbul/Ankara/İzmir belohnt).

---

## 5. Lückenliste (offen, mit nächstem Zugriffspfad)

1. **Export Volltabelle 2025 (12/81 belegt).** Ticaret Bakanlığı „illere göre dağılım listesi"
   (monatlich, XLS hinter JS-Seite) und TÜİK-Veriportal (API blockiert „Erişim engellendi").
   Nächster Pfad: TİM-Jahres-CD/Bibliothek oder Bilgi Edinme-Anfrage; alternativ 12 Monatsbulletins
   einzeln (je Top 15 + Rest-Schätzung).
2. **Migration Volltabelle (27/81 belegt).** TÜİK-NIP-Portal lädt per JS; Presse-XLS nicht direkt
   erreichbar. Nächster Pfad: TÜİK-Bilgi-Edinme oder NIP-Export im Browser.
3. **GSYH-Sektoranteile je Provinz.** TÜİK İl GSYH 2024 (11.12.2025) enthält sie; frei sichtbar
   nur Anker (Konya Tarım-Spitze 5,6 %; İstanbul Ticaret 33,9 %/Sanayi 15,1 %; Adıyaman +31,4 %
   Wachstum — Wiederaufbau). Nächster Pfad: TÜİK-Berichtstabelle anfordern.
4. **Elektrik Erzeugung/Verbrauch je Provinz.** TEDAŞ-Bericht 2024 hat Verbrauch je Provinz
   (2023); Erzeugung je Provinz nur über ETKB-Enerji-Atlanten (enatlas.enerji.gov.tr) interaktiv.
   Nächster Pfad: TEDAŞ-PDF Volltabelle extrahieren + TEİAŞ santral-Liste.
5. **Mieten je Provinz.** Keine amtliche il-bazlı-Serie (TÜİK-CPI nur regional); kommerzielle
   Indizes (Endeksa/Hepsiemlak) lizenzpflichtig. Falls gewünscht: Anker İstanbul/Ankara/İzmir/
   Antalya aus Presseberichten + Deltas.
6. **Wasserstress amtlich je Provinz.** DSİ veröffentlicht Havza-, nicht Provinz-Werte; die
   Havza→Provinz-Zuordnung hier ist redaktionell.
7. **Tarım-Fläche/Produktionswert je Provinz vollständig.** TÜİK bitkisel üretim il tabloları
   existieren, sind aber nur summarisch frei; ÇKS (Çiftçi Kayıt Sistemi) nicht öffentlich.

## 6. Datendictionary `kalibrierung/provinz_profile.csv`

| Spalte | Bedeutung | Quelle/Jahr |
|---|---|---|
| plaka, name, region, nuts2, bevoelkerung | Stammdaten | provinzdaten.json (TÜİK 2024) |
| sege_rang / sege_skor / sege_kademe | Entwicklungsrang 1–81, Skor, Kademe 1–6 | STB, SEGE-2025 (Ekim 2025) |
| export_2025_mio_usd / export_quelle | Export Mio USD (nur Belegte) + Methodenkürzel | Ticaret/TİM/Verbände 2025 |
| export_klasse_0_5 / export_flag | Ordinale Exportstärke + Herkunft | abgeleitet |
| export_ueber_1mrd_2025 | 1 = unter den 33 Provinzen > 1 Mrd | Ticaret Bakanlığı, PM 13.01.2026 |
| osb_gesamt / osb_faaliyet | Organisierte Industriezonen gesamt / in Betrieb | OSBÜK, Abruf 30.09.2026 |
| geceleme_2025 / geceleme_pro_kopf | Hotelübernachtungen gesamt / pro Kopf | KTB YİGM, Jahresbülten 2025 |
| migration_pro1000 / migration_flag | Netto-Migration ‰ + belegt2024/belegt2025/geschaetzt | TÜİK İç Göç 2024/2025; Regression |
| hauptprodukte | 2–3 Leitprodukte (Text) | redaktionell, TÜİK-Anker |
| strom_bilanz | −2 starkes Defizit … +2 starker Überschuss | abgeleitet [unverifiziert] |
| wasserstress_1_5 | 1 reich … 5 kritisch | Havza-basiert (DSİ/WWF) |
| deprem_risiko_1_5 | 1 niedrig … 5 hoch | AFAD TDTH via NTV/CNN 2025/26 |
| kueste / grenzland | 0/1 | deterministisch |
| hauptsektor | M Metro · T Tourismus · I Industrie · A Agrar · S sonst | Regelwerk |
| cluster_id / cluster_name | Archätyp 1–8 | k-means (diese Arbeit) |

## Quellen (Hauptnachweise)

- STB Kalkınma: İl SEGE-2025 (PDF, Ekim 2025) — kalkinmakutuphanesi.gov.tr/assets/upload/dosyalar/l-sege-2025.pdf
- OSBÜK: Sayılarla OSB'ler (Abruf 30.09.2026) — osbuk.org/view/sayilarlaosb/osbliste.php; AA 10.01.2026 (416 OSB, >2,7 Mio. Beschäftigte)
- KTB YİGM: Konaklama Yıllık Bülten 2025 (XLSX) — yigm.ktb.gov.tr; Türkiye Turizm Veri Atlası (Iğdır/Kilis) — turizmveri.com
- Ticaret Bakanlığı: PM 06.01.2025 (2024: 31 il > 1 Mrd), PM 13.01.2026 (2025: 33 il), Bülten Aralık 2025 (Monats-Top-15) — ticaret.gov.tr
- TİM/Verbände 2025: AA 08.01.2026 (Mersin/Hatay/Adana/Osmaniye), DENİB (Denizli 4,7 Mrd), BUTSO (Burdur 239 Mio), KOSANO (İstanbul 57,758 / Kocaeli 35,086 Mrd), GAİB (Gaziantep Jan 817,4 Mio)
- TÜİK İç Göç 2024 (Bülten 14.07.2025) & 2025 (Bülten 14.07.2026), via Dünya (Naki Bakır, 15.07.2025/2026), İHA-Samsun, Çorum Haber, 12punto, Enstitü Sosyal
- TÜİK İl GSYH 2024 (11.12.2025): İstanbul 29,2 %, Konya Tarım-Spitze, Pro-Kopf-Endplätze Şanlıurfa/Ağrı/Van
- AFAD TDTH 2018 via NTV 15.05.2025, CNN Türk 30.07.2026, Türkiye Gazetesi 27.01.2026 (MTA: 45 il, 110 ilçe auf Diri Fay)
- Wasser: BBC Türkçe 25.07.2025 (~1.330 m³/Kopf), DSİ-Barjen 2025 (Ankara 18,8 %/Konya 17 %/Marmara 38 %), WWF/DSİ Havza-Listen (Konya Kapalı, Burdur, Marmara, Gediz u. a. kritisch), Gazete Oksijen 27.08.2025
- Strom: TEDAŞ Elektrik Dağıtım Sektörü Raporu 2024 (Pro-Kopf-Verbrauch 2023: Bilecik 9.871 … Ağrı 1.026 kWh); TEİAŞ Monatsberichte
- Agrar: Rekabet Kurumu 2024 (Fındık 88,4 % aus 6 il), TÜİK Bitkisel Üretim 1. Tahmin 2025 (Donverluste), TEPGE Sert Kabuklu Raporu 2025
