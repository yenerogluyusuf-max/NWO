# Datenquellen, Geodaten und Nutzungsrechte – Politisches Strategiespiel Türkei („NWO")

**Recherchestand:** 28.09.2026 (alle Web-Abrufe an diesem Tag, per WebFetch/curl)
**Projektkontext:** Einzelspieler-Desktop-Strategiespiel, Spieler ist türkischer Staatspräsident, pausierbare Tage, Sprachbefehle via LLM → geprüfte Aktionen, 81 Provinzen, Großstädte bis İlçe/Stadtbezirk, HOI4-Stil-Karte, Start mit belegten echten Stichtagsdaten, DE als erste Sprache, kommerzieller Verkauf geplant.

**Methodenhinweis:** Suchmaschinen (DuckDuckGo, Mojeek, Bing) waren im Abrufkontext blockiert bzw. lieferten unbrauchbare Treffer; recherchiert wurde daher gezielt über offizielle Behördenseiten (Direkt-URLs), deren Rechtstexte sowie Web-Archive. PDFs wurden per `pdftotext` extrahiert (modellseitiges PDF-Lesen nicht verfügbar). Aussagen sind mit URL + Abrufkontext belegt; nicht verifizierte Punkte sind als **[OFFEN]** markiert.

---

## 0. Kurzbefund Rechte-Ampel (für kommerzielle Spiel-Nutzung)

| Quelle | Rechte für kommerzielles Spiel | Ampel |
|---|---|---|
| TÜİK (Statistik) | Freie Wiederverwendung **mit Quellenangabe**, ohne Einholung einer Erlaubnis (Yasal Uyarı) | Grün |
| TCMB-Website/EVDS-Daten | Quellenangabe ok, **kommerzielle Nutzung nur mit schriftlicher TCMB-Erlaubnis** (Kullanım Şartları) | Gelb/Rot |
| Mevzuat.gov.tr (Gesetzestexte) | Zugang kostenlos, „Tüm Hakları Saklıdır"; Gesetzestexte selbst als amtliche Werke i.d.R. frei, kodifizierte Aufbereitung/Gestaltung nicht | Gelb |
| YSK-Ergebnisse | Portale vorhanden (acikveri.ysk.gov.tr, sonuc.ysk.gov.tr), Footer „Her Hakkı Saklıdır"; Lizenz der offenen Daten **[OFFEN]** | Gelb |
| Natural Earth | Public Domain, kommerziell frei, kein Attribution-Zwang | Grün |
| OSM | ODbL: Attribution + Share-Alike bei Weitergabe der DB | Grün/Gelb |
| GADM | **Nur nicht-kommerziell**, kommerzielle Nutzung nur mit Genehmigung | Rot |
| SRTM (NASA) | „openly shared, without restriction", Zitation empfohlen | Grün |
| Copernicus Land (u.a. EU-DEM) | „full, open and free access", Quellenangabe + keine EU-Endorsement-Suggestion; abgeleitete Werke gehören dem User | Grün |
| Weltbank-Datensätze | CC BY 4.0 (Attribution-Pflicht), Drittanbieter-Ausnahmen | Grün |
| Weltbank-Website-Content (Berichte) | Nicht-kommerziell; kommerziell nur mit Zustimmung | Gelb/Rot |
| IWF, OECD | Abruf blockiert; Reproduktionsregeln **[OFFEN]** – pauschal: kommerzielle Nutzung von Berichtstexten i.d.R. erlaubnispflichtig | Rot (bis geklärt) |
| Umfragen (KONDA, MetroPOLL …) | Proprietär; KONDA über Abo („Kontent"), MetroPOLL „Tüm hakları saklıdır" | Rot (bis lizenziert) |

---

## 1. TÜİK (data.tuik.gov.tr / veriportali.tuik.gov.tr / tuik.gov.tr)

### 1.1 Zugangswege und Portale
- Hauptseite (TR/EN): https://www.tuik.gov.tr/ — Abruf 28.09.2026, live und aktuell (auf der Startseite u.a. Bülten „Tüketici Güven Endeksi – Eylül 2026", „Tarımsal Girdi Fiyat Endeksi – Temmuz 2026").
- **Veri Portalı** (Nachfolger der alten „data.tuik.gov.tr"-Oberfläche, JavaScript-SPA; ohne JS nur Leermaske „JavaScript Required"): https://veriportali.tuik.gov.tr/tr — Themenübersicht: https://veriportali.tuik.gov.tr/tr/statistical-themes [Quelle: Menü tuik.gov.tr, Abruf 28.09.2026]
- Weitere Portale (aus Menü tuik.gov.tr, Abruf 28.09.2026):
  - **Coğrafi İstatistik Portalı (GIS/Themenkarten):** https://cip.tuik.gov.tr/
  - **Nüfus İstatistikleri Portalı:** https://nip.tuik.gov.tr/
  - **Resmi İstatistik Portalı:** https://www.resmiistatistik.gov.tr/
  - **SDG-Portal:** https://sdg.tuik.gov.tr/ ; Klassifikationsserver: https://siniflama.tuik.gov.tr
  - **Bölgesel İstatistikler:** https://biruni.tuik.gov.tr/bolgeselistatistik/anaSayfa.do?dil=tr
  - **İl Göstergeleri (Provinz-Indikatoren):** https://biruni.tuik.gov.tr/ilgosterge/?locale=tr
  - **Mikro-Veri-Anträge:** https://ty.tuik.gov.tr (Antrags-/Serviceportal; u.a. Mikrodaten, Stichproben, Preisanpassungsrechner)
  - **Veri/Bilgilerin Ücretlendirilmesi (Preisliste Sonderanfertigungen):** https://www.tuik.gov.tr/Kurumsal/Veri_Bilgilerin_Ucretlendirilmesi
  - **Veri Yayım Takvimi (Release-Kalender):** https://www.tuik.gov.tr/Kurumsal/Veri_Takvimi (Inhalt JS-geladen, im Abruf nur Titelzeile sichtbar)
  - **Revizionspolitik:** https://www.tuik.gov.tr/Kurumsal/Revizyon_Politikasi
  - **FAQ:** https://www.tuik.gov.tr/Kurumsal/Sikca_Sorulan_Sorular
- Bulletins (Haber Bülteni) erscheinen mit Excel-Tabellen-Anhängen (FAQ: „Haber Bültenlerinin ekindeki tablolar MS-Excel ortamında sunulmaktadır") [Quelle: TÜİK FAQ, Abruf 28.09.2026].
- Hinweis: Ob es eine formale, dokumentierte **REST-API** im Stil von EVDS gibt, konnte im Abruf nicht bestätigt werden (Veri-Portal ist eine JS-App, die interne JSON-Endpunkte nutzt). **[OFFEN]** — Empfehlung: Exportfunktionen des Veri-Portals + Bulletins/Excel als Datenpfad vorsehen; API bei TÜİK anfragen (ALO 124 / ty.tuik.gov.tr).

### 1.2 Datensätze (Granularität national / İl / İlçe)
Belegte Struktur (Portale + Metaveri-Organisation, Abruf 28.09.2026); die konkreten Tabellencodes sind im JS-Portal zu entnehmen **[OFFEN für das Dateninventar-Listing]**. Thematisch abgedeckt (aus TÜİK-Organisation/Bulletin-Übersicht der Startseite und Portalen):
- **Preise/Inflation:** TÜFE (CPI) nach Warengruppen, Yİ-ÜFE/ÜFE (Erzeuger), Yurt Dışı Üteci Fiyat Endeksi, Tarımsal Girdi Fiyat Endeksi — Startseite zeigt Veröffentlichung bis „Juli 2026" (Abruf 28.09.2026).
- **Bevölkerung:** ADNKS (jährliche Bevölkerungsfortschreibung) nach İl/İlçe, Alter, Geschlecht; Bildungsstatistik; Nüfus-Portal nip.tuik.gov.tr.
- **Arbeitsmarkt:** Arbeitslosigkeit (Haushaltsarbeitsmarkterhebung), Löhne/Gehälter (Kazanç Yapısı İstatistikleri, Lohnstrukturerhebung).
- **Konjunktur/Vertrauen:** Tüketici Güven Endeksi (monatlich), Hizmet/Perakende/İnşaat Güven Endeksleri (monatlich) — jeweils als eigene Bülten belegt (Startseite 28.09.2026).
- **Regionalstatistik:** Bölgesel İstatistikler (NUTS-ähnliche TR1–TR3-Regionen), İl Göstergeleri, Coğrafi İstatistik Portalı (Karten).
- **Granularität:** Standardmäßig national + **81 İl**; für viele Indikatoren **İlçe-Ebene** (z.B. ADNKS-Bevölkerung), aber: Geheimhaltungsregel begrenzt feine Zellen (s.u.).

### 1.3 Nutzungsrechte (zentrale Aussage)
- **Yasal Uyarı (Rechtlicher Hinweis), https://www.tuik.gov.tr/Kurumsal/Yasal_Uyari, Abruf 28.09.2026, wörtlich:**
  > „İnternet sitemizden, yayınlarımızdan veya veri tabanlarımızından elde edilen verilerin, **kaynak gösterilmek suretiyle herhangi bir izine gerek duymaksızın yeniden kullanımı mümkündür.**"
  → **Wiederverwendung der Daten (auch kommerziell, da keine Einschränkung genannt) ohne Genehmigung, aber mit Quellenangabe.** Weiter unten: „telif hakkı ve diğer her türlü hakkı TÜİK'e aittir" (Urheberrecht bleibt bei TÜİK) — d.h. Fakten/Daten sind frei nutzbar, TÜIK-Marke/-Design nicht.
- **Statistikgesetz Nr. 5429 (Türkiye İstatistik Kanunu), Text via https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5429.pdf (Abruf 28.09.2026, per pdftotext ausgewertet):**
  - Art. 12: Behörden stellen sicher, „tüm kullanıcıların kolay ve eşit şartlarda erişmesini" (gleicher, leichter Zugang aller Nutzer gemäß Veröffentlichungsplan).
  - Art. 13 (Geheimhaltung): Zellen mit **weniger als 3 statistischen Einheiten** (oder Dominanz von 1–2 Einheiten) gelten als geheim. → **Für İlçe-Detailtabellen im Spiel relevant:** manche Kreuztabellen sind auf İlçe-Ebene unterdrückt.
  - Art. 14: **Mikrodaten** nur für wissenschaftliche Forschung mit schriftlicher TÜİK-Erlaubnis; Weitergabe an Dritte verboten. → **Für ein Spiel nicht nutzbar**; nur aggregierte Werte verwenden.
- **Preisgestaltung (https://www.tuik.gov.tr/Kurumsal/Veri_Bilgilerin_Ucretlendirilmesi, Abruf 28.09.2026):** Webseiten-/Social-Media-Inhalte **kostenlos**; Daten für Behörden, Presse, Universitäten, internationale Organisationen kostenlos. **Individuelle** Datenauszüge/Anfertigungen sind kostenpflichtig (Beschluss vom 08.01.2026: Papier A4 erste Seite 130 TL, je weitere Seite 29 TL; Magnetmedium 130 TL/MB; thematische Karte digital 590 TL; Grid-Daten 2 TL/volles km²-Grid; Metadaten gratis; 50 % Rabatt für Bildung). Microdata separat (Verweis auf Mikro-Veri-Seite).
- Fazit TÜİK: **Für das Spiel unproblematischste Quelle** — veröffentlichte Bulletin-/Portaltabellen mit Quellenangabe „TÜİK, [Thema], [Periode]" einbinden; keine Sonderanfertigung nötig.

---

## 2. TCMB / EVDS (evds2.tcmb.gov.tr → evds3.tcmb.gov.tr)

### 2.1 Zugang und Stand der Systeme (Abruf 28.09.2026)
- **EVDS ist auf evds3 umgezogen:** TCMB-Menü „İstatistikler → Elektronik Veri Dağıtım Sistemi" verlinkt auf **https://evds3.tcmb.gov.tr/anasayfa** (auch: https://evds3.tcmb.gov.tr/baslicaGostergeler) [Quelle: tcmb.gov.tr Startseite/Menü, Abruf 28.09.2026]. evds2.tcmb.gov.tr liefert weiterhin eine React-SPA-Leermaske (Abruf 28.09.2026), historische API-Pfade unter evds2 antworten mit der SPA statt JSON.
- EVDS-Web-Oberfläche und API sind JS/SPA-basiert; die früher dokumentierte Web-API (Abruf per `https://evds2.tcmb.gov.tr/service/evds/...`, Serie-Codes wie `TP.DK.USD.A`, Ausgabe JSON/CSV, **kostenlose Registrierung per E-Mail + API-Key**) ist aus der Praxis bekannt, konnte im Abruf wegen SPA/Umzug nicht an einem statischen Dokument belegt werden — **[OFFEN]: aktuelle API-Doku (evds3) und Key-Vergabe prüfen.**
- **Ohne Authentifizierung sofort nutzbar (belegt): Tägliche Devisenkurse als XML:**
  - https://www.tcmb.gov.tr/kurlar/today.xml — Abruf 28.09.2026, liefert Kurse 28.09.2026 (Bülten 2026/182; USD/TL ~48,90, EUR/TL ~55,63).
  - Historische Tage: https://www.tcmb.gov.tr/kurlar/YYYYMM/DDMMYYYY.xml (übliches TCMB-Muster; Einzelpfad nicht einzeln verifiziert **[OFFEN]**).
- Weitere relevante TCMB-Zugänge (Menü „İstatistikler", Abruf 28.09.2026): Enflasyon Verileri, Ödemeler Dengesi, Parasal ve Finansal İstatistikler, Faiz-Statistiken, Piyasa Verileri, Döviz Kurları, TCMB Analitik Bilanço, **Veri Yayımlama Takvimi** (https://appg.tcmb.gov.tr/igmvytsfe-dis/tr — SPA existiert, Abruf 28.09.2026).

### 2.2 Relevante Reihen für das Spiel (Inventar aus TCMB-Struktur)
- Leitzins/PPK-Entscheidungen (Politika Faizi), Zinskorridor, Kurskorridor.
- Wechselkurse (täglich, XML frei; realer/effektiver Kurs über EVDS).
- Devisenreserven (Rezerv/İstatistikleri, wöchentlich), internationale Liquidität.
- Inflation: TCMB-eigene Inflationsdaten + Inflationserwartungen (Piyasa Katılımcıları Anketi, Eğilim Anketleri) — über EVDS/Bulletins.
- Geldmenge, Bankdaten (Bankacılık Verileri), Analitik Bilanz.

### 2.3 Nutzungsrechte — **kritisch für kommerzielles Spiel**
- **TCMB „Kullanım Şartları" (https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Bottom+Menu/Diger/Kullanim+Sartlari), Abruf 28.09.2026, wörtlich:**
  > „Sitede yer alan bilgiler, kaynak gösterilmek suretiyle yayımlanabilir; **ancak bu bilgilerin ticari amaçlarla kullanımı TCMB'nin yazılı iznine tabidir.**"
  → Veröffentlichung mit Quellenangabe erlaubt; **kommerzielle Nutzung nur mit schriftlicher TCMB-Genehmigung.** Ob EVDS-Datenreihen formell dieselben Konditionen haben (Website-AGB vs. EVDS-eigene Bedingungen), ist **[OFFEN]** — im Zweifel gilt der konservative Weg: **schriftliche Erlaubnis der TCMB einholen** (Bilgi Edinme / İletişim-Kanäle der Bank) oder EVDS-Daten nur für interne Kalibrierung nutzen und im Spiel nur eigene Ableitungen/veröffentlichte Kernzahlen mit Quellenangabe zeigen.
- Fußzeile tcmb.gov.tr: „TCMB © 2026 Tüm hakları saklıdır."
- Praxistipp: Für Kursanzeige im Spiel ist die **XML-Datei (today.xml)** der robusteste Pfad; Rechteklärung für „in-game zitierte Zahlen" (Leitzins, Reserven) bei TCMB anfragen.

---

## 3. YSK und TBMM — Wahlergebnisse, Sitzverteilung, Bündnisse

### 3.1 YSK (ysk.gov.tr) — belegte Zugänge (Abruf 28.09.2026)
- Hauptseite: https://www.ysk.gov.tr/ (Angular-SPA; Direktabruf des Root-Hosts per WebFetch scheiterte transient, `/secim-sonuc-verileri` war per WebFetch erreichbar).
- **Açık Veri Portalı (Open-Data-Portal):** https://acikveri.ysk.gov.tr/ — per curl HTTP 200, SPA (Abruf 28.09.2026). **Inhalt/Exportformate/Lizenz konnten ohne JS nicht extrahiert werden [OFFEN]** — dies ist der vielversprechendste Pfad für maschinenlesbare Ergebnisse (bis Wahllokalebene „Sandık").
- **Sandık Sonuçları ve Tutanaklar (Stimmzettel-Ergebnisse und Protokolle):** https://sonuc.ysk.gov.tr — Abruf per WebFetch/curl scheiterte transient (Transport error) **[OFFEN: Erreichbarkeit/Formate testen]**.
- **Seçim Arşivi (Wahlarchiv):** https://www.ysk.gov.tr/tr/secim-arsivi/2612 (Rückgriff auf frühere Wahlen).
- **Güncel Seçim İstatistikleri:** https://www.ysk.gov.tr/tr/secim-i̇statistikleri/78318
- **Seçmen Sorgulama (Wählerverzeichnis-Abfrage):** https://secmen.ysk.gov.tr (Personenbezogen — für das Spiel irrelevant).
- **YSK-Karar-DB (Beschlüsse, u.a. Bündnis-/Listenzulassung):** https://www.ysk.gov.tr/tr/ysk-kararlari/1524
- EN-Schnittstelle vorhanden: https://www.ysk.gov.tr/en/welcome/1788
- Rechte: Footer „Türkiye Cumhuriyeti Yüksek Seçim Kurulu Başkanlığı **Her Hakkı Saklıdır** © 2019" + ausdrücklicher Hinweis, es gebe **keine offiziellen** ysk.gov.tr-Fremdpräsenzen in sozialen Medien (Abruf 28.09.2026). Für amtliche Wahlergebnisse (reine Tatsachen) ist die Nutzung in Produkten üblich unkritisch, aber eine **schriftliche Bestätigung/Lizenz des Open-Data-Portals ist [OFFEN]** und sollte für einen kommerziellen Release eingeholt werden.

### 3.2 Was für das Spiel gebraucht wird (Elections-Modul)
- Präsidentschafts- und Parlamentswahl **2018**, Kommunalwahl **2019**, Parlaments-/Präsidentschaftswahl **2023**, Kommunalwahl **2024** — je auf **national / İl / İlçe** (ideal: Sandık für Feinkalibrierung).
- Sitzverteilung (600 Sitze), Bündnisse (Cumhur İttifakı, Millet İttifakı u.a.), Sperrklausel 7 % (seit 2023), Wahlrechtsreformen — Rechtsgrundlagen dazu über mevzuat.gov.tr (s.u.): 298 Sayılı Seçimlerin Temel Hükümleri ve Seçmen Kütükleri Hakkında Kanun, 2839 Sayılı Milletvekili Seçimi Kanunu **[Textabruf einzeln offen]**.
- **TBMM (tbmm.gov.tr):** Sitzverteilung/Abgeordnetenlisten über TBMM-Seiten (z.B. Milletvekili-DB); Abruf im Rahmen dieser Recherche nicht durchgeführt **[OFFEN]**. TBMM-Tutanak-DB für Reden/Zitate nutzbar; Rechte: amtliche Werke, Quellenangabe TBMM üblich.

### 3.3 Formate (Stand aus Portalauftritt, Abruf 28.09.2026)
- Open-Data-Portal als Web-SPA; Exportformate (CSV/XLSX/JSON) **[OFFEN]**. Historisch bot YSK Excel/PDF-Bulletins auf ysk.gov.tr und aggregierte Tabellen auf sonuc.ysk.gov.tr.
- Empfehlung: Scraping nur nach Prüfung der Nutzungsbedingungen; besser: Open-Data-Portal-Exporte + Archivkopien mit Datum.

---

## 4. mevzuat.gov.tr — Verfassung, Gesetze, Präsidialdekrete

### 4.1 Zugang und Inhalt (Abruf 28.09.2026)
- **Mevzuat Bilgi Sistemi (MBS)**, betrieben von der Hukuk ve Mevzuat Genel Müdürlüğü der Präsidentschaft: https://www.mevzuat.gov.tr/
- „Mevzuat Bilgi Sisteminden **ücretsiz** olarak yararlanabilirsiniz … ücretsiz ve herhangi bir abonelik şartı olmadan" (Hakkımızda, Abruf 28.09.2026) — Zugang ohne Registrierung; optionaler Account für Favoriten.
- Enthalten (Hakkımızda, Zahlen dort, Abruf 28.09.2026): **Anayasa**, Kanunlar (916 geltende Einzelgesetze), Cumhurbaşkanlığı Kararnameleri (33), Cumhurbaşkanlığı Yönetmelikleri (179), Cumhurbaşkanı Kararları (4.321), Genelgeler (157), KHK (63), Tüzükler (107), Bakanlar Kurulu Yönetmelikleri (148), Yönetmelikler (9.023), Tebliğler (ab 2004, 4.476) — Summe ~19.096 konsolidierte Texte; **Mülga-Mevzuat** nur teilweise.
- **Anayasa 1982 (mit Änderungen, u.a. 2017):** Abrufbar als „T.C. Anayasası"-Einstieg; konsolidierte Fassung als PDF/DOC, z.B. https://www.mevzuat.gov.tr/MevzuatMetin/1.5.2709.pdf (PDF-Link im Seitenkopf, Abruf 28.09.2026).
- Einzelgesetze als konsolidierte „Tek Metin"-Fassungen mit Änderungshistorie, Download als **PDF und DOC** (z.B. Kanun 5429: https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5429.pdf / .doc). Jahresfilter bis 2026 (Seite zeigt aktuelle Resmî-Gazete-Einträge 28.09.2026, Nr. 33384).
- **Zentralbankgesetz Nr. 1211 („1211 Sayılı Türkiye Cumhuriyet Merkez Bankası Kanunu")** — die im Auftrag genannte „Nr. 12116" ist mit hoher Wahrscheinlichkeit ein Tippfehler für **Nr. 1211**; Auffindbar über MBS-Suche „1211" bzw. https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=1211&MevzuatTur=1&MevzuatTertip=5 **[Metinabruf nicht einzeln durchgeführt]**.
- Wahlgesetze: 298, 2839 u.a. über MBS-Suche/„Kanunlar Fihristi".
- **Sprache:** ausschließlich **Türkisch**; keine offiziellen Übersetzungen in MBS. (Anayasa-Mahkemesi und einzelne Behörden bieten teils inoffizielle EN-Fassungen an; Verbindlichkeit nur Türkisch → für ein deutsches Spiel: eigene Übersetzung/Paraphrase, **keine** amtliche DE-Fassung vorhanden.) **[OFFEN: prüfen ob Anayasa-EN auf anayasa.gov.tr als offiziell deklariert gilt]**
- Rechte: Fußzeile „2020 Tüm Hakları Saklıdır. **Gizlilik, Kullanım ve Telif Hakları** bildiriminde belirtilen kurallar çerçevesinde" — die zitierte Rechtsmitteilung war im Abruf **nicht auffindbar** (Modal/verlinkte Seite). **[OFFEN]**. Grundsätzlich gilt für türkische Gesetze: amtliche Texte sind als Gesetze nicht urheberrechtlich schützbar (Regelungswerk), die **kodifizierte Aufbereitung/Website-Gestaltung** kann Schutz genießen. Pragmatisch: Gesetzeszitate (Kurzformeln, Paraphrasen) mit Quellenangabe „mevzuat.gov.tr" verwenden, keine 1:1-Textmassen ins Spiel übernehmen; Freigabe im Zweifel anfragen.

---

## 5. Geodaten

### 5.1 Verwaltungsgrenzen: 81 İl und İlçeler

| Quelle | Granularität (Türkei) | Lizenz | Befund (Abruf 28.09.2026) |
|---|---|---|---|
| **GADM** (gadm.org) | ADM1 (İl) + ADM2 (İlçe), v4.1, Download je Land | **Nur akademisch/nicht-kommerziell; „Redistribution, or commercial use is not allowed without prior permission"** | Lizenz: https://gadm.org/license.html; Daten: https://gadm.org/data.html („400,276 administrative areas", Download by country) → **für Verkaufsspiel ungeeignet ohne Genehmigung** |
| **Natural Earth** | 1:10m u.a. Provinzgrenzen („states/provinces"), İlçe nicht vollständig | **Public Domain**, kommerziell frei, kein Nennungszwang („Made with Natural Earth" empfohlen) | https://www.naturalearthdata.com/about/terms-of-use/ (Abruf 28.09.2026) |
| **OpenStreetMap** | İl + İlçe + Stadtbezirke (boundary=administrative 5/6), sehr fein | **ODbL**: Namensnennung „© OpenStreetMap contributors", Datenbank-Lizenz nennen; **Share-Alike nur bei Weitergabe der Datenbank selbst**, gerenderte Karte/„Produced Work" nur Attribution | https://www.openstreetmap.org/copyright (Abruf 28.09.2026; dort auch Hinweis: keine kommerziellen API/Tiles ohne eigene Infrastruktur) |
| **TÜİK Coğrafi İstatistik Portalı (cip.tuik.gov.tr)** | Themenkarten auf İl/İlçe | Nach TÜİK-Yasal-Uyarı: Quellenangabe genügt | https://cip.tuik.gov.tr/ (Menü tuik.gov.tr, Abruf 28.09.2026) |
| **Offiziell TR (HKMO, Harita Genel Müdürlüğü, NVİ/AdresKS, CBS)** | amtliche İl/İlçe-Grenzen, Adressregister | i.d.R. **proprietär/amtlich, teils lizenzpflichtig** | **[OFFEN]:** hkmo.org.tr im Abruf Cloudflare-blockiert (HTTP 403); hgk.msb.gov.tr, cbs.gov.tr, adres.nvi.gov.tr nicht erreichbar (HTTP 000); **https://geoportal.harita.gov.tr/** antwortet HTTP 200 (JS-SPA) — dort amtliche Geodaten inkl. Verwaltungsgrenzen, Nutzungsbedingungen prüfen |

**Empfehlung Grenzen:** HOI4-Stil-Karte mit **OSM-Abgeleiteten Grenzen (ODbL-konform: Attribution im Credits-Menü)** oder Natural Earth (fürs Rendering frei) + amtliche/Nachbar-Quellen nur zur Verifikation. Für İlçe-Vollständigkeit ist OSM die praktikabelste frei lizenzierte Quelle; GADM nur für internen Abgleich.

### 5.2 Relief/Höhe (stilisierte Karte)

| Quelle | Produkt/Auflösung | Lizenz | Befund |
|---|---|---|---|
| **SRTM (NASA/NGA)** | SRTMGL1 v003, 1 arc-second (~30 m), global 60°N–56°S, Format .HGT | „This dataset is **openly shared, without restriction**" (EOSDIS Data Use and Citation Guidance); Zitation empfohlen | https://lpdaac.usgs.gov/products/srtmgl1v003/ (Abruf 28.09.2026); DOI 10.5067/MEASURES/SRTM/SRTMGL1.003; Download via Earthdata-Login (Registrierung nötig) |
| **Copernicus Land Monitoring / EU-DEM** | EU-DEM v1.1 (25 m) u.a. CLMS-Produkte | **„full, open and free access"** (Delegierte VO (EU) 1159/2013, Rahmen VO (EU) 2021/696): Quelle nennen, Änderungen kenntlich machen, keine EU-Endorsement-Suggestion; **„the user has all intellectual property rights to the products he/she has created"** | https://land.copernicus.eu/en/data-policy (Abruf 28.09.2026) — inkl. Zitierformeln für „Generated using European Union's Copernicus Land Monitoring Service information" |
| **Copernicus Data Space / Sentinel** | Sentinel-1/2 etc. | Frei und offen (dieselbe Copernicus-Politik) | https://dataspace.copernicus.eu/ (Hinweis aus TCMB/Copernicus-Kontext; Terms-Seite einzeln **[OFFEN]**) |

**Empfehlung Relief:** SRTM oder EU-DEM als Höhenbasis, Relief-Shader im HOI4-Stil; Copernicus-Zitatformel in Credits; keine Lizenzkosten.

---

## 6. IWF, OECD, Weltbank (Gegenprobe/Zahlenzitate)

- **Weltbank — Datensätze (data.worldbank.org, Data Catalog):** „Unless specifically labeled otherwise, these Datasets are provided to you under a **Creative Commons Attribution 4.0 International License (CC BY 4.0)**" + Attribution-Format „The World Bank: Dataset name: Data source (if known)"; Mediations-/Schiedsklausel; Ausnahmen für Drittanbieter-Daten laut Metadaten. Quelle: https://www.worldbank.org/ext/en/legal/terms-conditions/datasets (Abruf 28.09.2026). → **Weltbank-Zahlen (WDI) fürs Spiel mit Quellenangabe nutzbar.**
- **Weltbank — übrige Website/Publikationen:** „you may make non-commercial uses … you may not make any derivative work or commercial use … without the prior written consent"; Marken/Logos gesperrt; „No Endorsement". Quelle: https://www.worldbank.org/en/about/legal/terms-conditions (Abruf 28.09.2026). → Berichts**texte** nicht einfach in-game zitieren; Zahlen aus Datasets bevorzugen.
- **IWF (imf.org):** Abruf blockiert (HTTP 403 Akamai, auch via curl; alte Terms-URL https://www.imf.org/external/terms.htm leitet per 301 auf eine interne redirect-URL um — Stand Wayback 27.09.2026). **[OFFEN]** — zu klären: Artikel-IV-Berichte Türkei (i.d.R. als Country Report No. 24/xx), WEO-Daten (WEO-Database, oft CC-BY-ähnlich für Datenteile), Nutzungsbedingungen unter der neuen Legal-Struktur (https://www.imf.org/en/about/legal o.ä.). Konservativ: IMF-**Texte** nur paraphrasiert mit Quellenangabe, **Zahlen** aus WEO/IFS mit Zitation; schriftliche Klarstellung fürs Release einholen.
- **OECD:** oecd.org hinter Cloudflare („Just a moment", HTTP 403 per curl; Terms-Seite https://www.oecd.org/en/about/legal/terms-conditions.html nicht abrufbar). **[OFFEN]** — OECD Economic Surveys: Turkey (Periodizität ca. alle 2 Jahre; letztes mir bekanntes Survey 2024/2025 **[Stand zu verifizieren]**), OECD.Stat/iLibrary teils mit eigenen Lizenzen. Konservativ behandeln wie IWF.

---

## 7. Umfrageinstitute

- **KONDA (konda.com.tr):** Abruf 28.09.2026: Forschungs-/Beratungsunternehmen; **„KONDA Barometresi und Kontent 2026-Abonnement"** aktiv (https://kontent.konda.com.tr/package/konda-kontent-basic); Berichte („Siyasi Tercihler", Moral-Endeksi, Enflasyon-Beklantı-Anketi etc.) liegen hinter der **Kontent-Paywall** (kontent.konda.com.tr/report/...). Interaktive Auswertung: https://interaktif.konda.com.tr. → **Proprietär; für Spiel-Nutzung Lizenz/Abo nötig (Rechteklärung direkt bei KONDA).**
- **MetroPOLL (metropoll.com.tr):** Abruf 28.09.2026: veröffentlicht monatliche Reihe **„Türkiye'nin Nabzı"** (aktuell bis **Juli 2026** sichtbar, https://metropoll.com.tr/arastirmalar/turkiyenin-nabzi-17/1950); Berichte öffentlich einsehbar; Footer: „© MetroPoll Stratejik ve Sosyal Araştırmalar. **Tüm hakları saklıdır**"; FAQ-Seite vorhanden (/kurumsal/sss-7), Methodik teils in Berichten. → **Zahlen zitieren mit Quellenangabe ist üblich, aber Rechte am Berichtsdesign bei MetroPOLL; kommerzielle Nutzung schriftlich klären.**
- **ORC, ASAL, AREA, Optimar, PİAR, SONAR u.a.:** Nicht im Abruf geprüft **[OFFEN]**. Branchenübung: Umfrageergebnisse werden als Tatsachen berichtet (Pressenutzung), Methodik muss bei Veröffentlichung angegeben werden (auch türkisches Recht, s.u.); **kommerzielle Produktnutzung der Berichte/Tabellen erfordert i.d.R. Lizenz.**
- **Rechtlicher Rahmen Türkei (relevant):** Statistikgesetz 5429 Art. 6 (und TÜİK-Yasal-Uyarı): Wer statistische Ergebnisse öffentlich macht, muss **Umfang, Stichprobenmethode, -größe, Erhebungsmethode und Zeitraum** mitveröffentlichen — gilt auch für private Institute. (Quelle: kanun_5429.pdf via mevzuat.gov.tr, Abruf 28.09.2026; TÜİK FAQ.) Für das Spiel: wenn eigene Umfrage-Simulation auf echten Methodikparametern basiert, Methodik im „Quellen"-Dokument des Spiels nennen.

---

## 8. Veröffentlichungsverzögerungen (relevant für Stichtag)

Beobachtet an TÜİK-Startseite 28.09.2026 (Abrufkontext):
- **Konjunkturvertrauen:** „Tüketici Güven Endeksi – Eylül 2026", „Hizmet/Perakende/İnşaat Güven Endeksleri – Eylül 2026" → **nahezu verzögerungsfrei im Erscheinungsmonat**.
- **Yurt Dışı Üretici Fiyat Endeksi – Ağustos 2026** → ~1 Monat Verzögerung.
- **Tarımsal Girdi Fiyat Endeksi – Temmuz 2026** → ~2 Monate.
- **Hayvancılık İstatistikleri – Haziran 2026** → ~3 Monate.
- TCMB-Wechselkurse: **täglich, gleicher Tag** (XML 28.09.2026 für 28.09.2026).
- Offizieller Release-Kalender: TÜİK „Veri Yayımlama Takvimi" (https://www.tuik.gov.tr/Kurumsal/Veri_Takvimi, Inhalt JS) und TCMB „Veri Yayımlama Takvimi" (https://appg.tcmb.gov.tr/igmvytsfe-dis/tr) — beide als maßgebliche Quelle **[Konkrete Termine pro Indikator daraus exportieren – OFFEN]**.
- **Kenntnisstand (zu verifizieren gegen die Kalender):** TÜFE i.d.R. ~3. Woche Folgemonat; Arbeitslosigkeit ~1,5 Monate; BIP (quartalsweise) ~2,5–3 Monate; ADNKS-Bevölkerung jährlich (Februar für Vorjahr); Wahlen: vorläufige YSK-Ergebnisse binnen Tagen, endgültige nach Prüfung/Beschluss (Wochen).
- **Stichtagsempfehlung:** Ein Stichtag **Ende eines Quartals mit vollständigen Jahres-/Vorjahresdaten** (z.B. 31.12. eines Jahres, sobald ADNKS + Jahresstatistik + letzte Wahl konsolidiert vorliegen). Für „heute-nah": Datenstand höchstens ~3 Monate vor Spielstart, damit die letzte Aktualisierung aller Kernreihen sicher im Datensatz ist. Konkrete Monatswahl hängt vom gewählten Startjahr ab und sollte an die Veri-Yayım-Takvimi-Termine dieses Jahres geprüft werden.

---

## 9. Beispiele: Spiele/Produkte mit amtlichen Statistikdaten

- Im Abrufkontext **keine belastbaren Web-Belege** gefunden (Suchmaschinen blockiert). **[OFFEN]** — aus Branchenkenntnis (nicht web-belegt, nur als Hypothese): politische Simulationen (z.B. Democracy-Reihe, Realpolitiks, Power & Revolution) arbeiten üblicherweise mit **modellierten/fiktionalisierten Startwerten**, oft genau um Lizenzfragen zu umgehen; Karten-Add-ons für Strategieleider nutzen bevorzugt **Natural Earth/OSM** (in Credits dokumentiert). Empfehlung: eigene Recherche bzw. Anfrage bei vergleichbaren Indies; für NWO den sicheren Weg gehen (freie Quellen + Quellenangabe + schriftliche Erlaubnisse für TCMB/YSK/Umfragen).

---

## 10. Offene Fragen / To-do-Liste

1. **TCMB:** Schriftliche Erlaubnis für kommerzielle Nutzung von EVDS-/Website-Daten anfragen; aktuelle EVDS-API-Doku (evds3) und Key-Prozess sichten (Registrierung + AGB dort).
2. **YSK:** Nutzungsbedingungen/Lizenz des Açık-Veri-Portals (acikveri.ysk.gov.tr) klären; Exportformate testen (sonuc.ysk.gov.tr Erreichbarkeit); Freigabe für kommerzielle Nutzung einholen.
3. **mevzuat.gov.tr:** Auffinden der „Gizlilik, Kullanım ve Telif Hakları"-Mitteilung; Klärung, ob Textübernahmen (Anayasa-Artikel etc.) im Spiel zulässig sind oder nur Paraphrasen.
4. **IMF/OECD:** Terms-Seiten aus Deutschland aufrufen (Abruf hier blockiert); Zitierregeln für Artikel-IV/WEO/OECD-Survey dokumentieren.
5. **Amtliche Geodaten TR:** Nutzungsbedingungen von geoportal.harita.gov.tr (Harita Genel Müdürlüğü) und NVİ/AdresKS für İl/İlçe-Grenzen prüfen; HKMO-Kontakt für Kataster-/Grenzfragen.
6. **TÜİK:** Vollständiges Dateninventar mit Tabellencodes aus veriportali.tuik.gov.tr exportieren (Excel-Bulletins); prüfen, ob eine dokumentierte API existiert.
7. **Umfragen:** KONDA (Abo/Lizenz) und MetroPOLL (schriftliche Erlaubnis) für in-game genutzte Historiewerte; Methodikangaben führen (5429 Art. 6).
8. **Beispiele Spiele:** gezielte Recherche nach „official statistics in commercial games" aus nicht blockiertem Netz.
9. **Datenschema-Schnittstelle:** Rechtsquellen-Verzeichnis im Spiel („Quellen"-Menü) mit den vorgeschriebenen Attributionstexten (OSM-ODbL, Copernicus-Zitat, „Made with Natural Earth", „The World Bank: …", „TÜİK …", ggf. TCMB-Freigabevermerk).

---

## 11. Quellenverzeichnis (Abruf alle 28.09.2026, sofern nicht anders vermerkt)

**Türkische Behörden**
- TÜİK Startseite: https://www.tuik.gov.tr/
- TÜİK Rechtshinweis (Yasal Uyarı): https://www.tuik.gov.tr/Kurumsal/Yasal_Uyari — **Kernaussage Quellenangabe-freie Wiederverwendung**
- TÜİK Preisliste: https://www.tuik.gov.tr/Kurumsal/Veri_Bilgilerin_Ucretlendirilmesi
- TÜİK FAQ: https://www.tuik.gov.tr/Kurumsal/Sikca_Sorulan_Sorular
- TÜİK Release-Kalender: https://www.tuik.gov.tr/Kurumsal/Veri_Takvimi
- TÜİK Veri-Portal: https://veriportali.tuik.gov.tr/tr ; Themen: /tr/statistical-themes
- TÜİK GIS-Portal: https://cip.tuik.gov.tr/ ; Nüfus: https://nip.tuik.gov.tr/
- TÜİK Mikrodaten/Anträge: https://ty.tuik.gov.tr
- Gesetz 5429 (PDF): https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5429.pdf
- MBS Startseite/„Hakkımızda": https://www.mevzuat.gov.tr/ bzw. /hakkimizda
- Anayasa (PDF-Link im MBS): https://www.mevzuat.gov.tr/MevzuatMetin/1.5.2709.pdf
- TCMB Kullanım Şartları: https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Bottom+Menu/Diger/Kullanim+Sartlari — **Kernaussage: kommerzielle Nutzung nur mit schriftlicher Erlaubnis**
- TCMB Startseite/Menü (EVDS-Link evds3): https://www.tcmb.gov.tr/
- Tägliche Kurse XML: https://www.tcmb.gov.tr/kurlar/today.xml (belegt 28.09.2026, Bülten 2026/182)
- TCMB Release-Kalender: https://appg.tcmb.gov.tr/igmvytsfe-dis/tr
- EVDS alt (SPA): https://evds2.tcmb.gov.tr/ ; EVDS neu: https://evds3.tcmb.gov.tr/anasayfa
- YSK: https://www.ysk.gov.tr/ ; https://www.ysk.gov.tr/secim-sonuc-verileri ; https://acikveri.ysk.gov.tr/ ; https://sonuc.ysk.gov.tr ; Archiv: /tr/secim-arsivi/2612 ; Statistiken: /tr/secim-i̇statistikleri/78318 ; Kararlar: /tr/ysk-kararlari/1524
- Harita-Geoportal (Harita Genel Müdürlüğü): https://geoportal.harita.gov.tr/ (HTTP 200, JS-SPA)

**Geodaten**
- GADM Lizenz: https://gadm.org/license.html ; Daten: https://gadm.org/data.html
- Natural Earth Terms: https://www.naturalearthdata.com/about/terms-of-use/
- OSM Copyright/ODbL: https://www.openstreetmap.org/copyright
- NASA SRTMGL1 v003: https://lpdaac.usgs.gov/products/srtmgl1v003/ (DOI 10.5067/MEASURES/SRTM/SRTMGL1.003)
- Copernicus Land Data Policy: https://land.copernicus.eu/en/data-policy

**International**
- Weltbank Dataset Terms (CC BY 4.0): https://www.worldbank.org/ext/en/legal/terms-conditions/datasets
- Weltbank General Terms (Stand 25.07.2025): https://www.worldbank.org/en/about/legal/terms-conditions
- IWF: https://www.imf.org/external/terms.htm (301/403 im Abruf; Wayback-Kontext 27.09.2026)
- OECD: https://www.oecd.org/en/about/legal/terms-conditions.html (Cloudflare-blockiert)

**Umfragen**
- KONDA: https://konda.com.tr/ ; Kontent-Abo: https://kontent.konda.com.tr/package/konda-kontent-basic
- MetroPOLL: https://metropoll.com.tr/ ; Beispielbericht: https://metropoll.com.tr/arastirmalar/turkiyenin-nabzi-17/1950 (Türkiye'nin Nabzı – Temmuz 2026)
