# Provinzdaten Türkei: Quellen und Prüfungen

Stand: 28.09.2026. Gehört zu `provinzen.csv`: 81 Zeilen, sortiert nach Kfz-Kennziffer, Trennzeichen Semikolon, UTF-8, Dezimalpunkt. Im Feld `hinweis` trennt „ | “ mehrere Angaben.

**Zugriff:** WebFetch und fast alle Nachrichtenseiten waren durch den Egress-Proxy gesperrt. Erreichbar waren nur GitHub (git clone, raw.githubusercontent.com) und die WebSearch. Die Kernzahlen stammen deshalb aus GitHub-Datensätzen, die ihre Quelle nennen. Die Angaben zu späteren Übertritten stammen aus Suchauszügen; die Artikel selbst wurden nicht gelesen. Aus dem Gedächtnis wurde nichts ergänzt.

## Quellen je Spalte

| Spalte | Quelle | Primärquelle laut Datensatz | Prüfung |
|---|---|---|---|
| plaka, name, region, nuts2, bevoelkerung_2025, bip_pro_kopf_tl | [brkunver/turkiye-provinces-dataset](https://github.com/brkunver/turkiye-provinces-dataset), `data/provinces.csv`, v1.0.0 vom 13.09.2026, CC-BY-4.0 | TÜİK ADNKS 2025 (Bulletin 53899); TÜİK „İl Bazında GSYH 2024“ (Bulletin vom 11.12.2025); NUTS 2021 | Bevölkerung: alle 81 Werte identisch mit [ubeydeozdmr/turkiye-api](https://github.com/ubeydeozdmr/turkiye-api), `datasets/provinces.json` (Quelle TÜİK MEDAS, Stand 21.05.2026). Ankerwerte aus der Presse stimmen: İstanbul 15.754.053, Ankara 5.910.320, İzmir 4.504.185, Bayburt 82.836. BIP pro Kopf ebenfalls: İstanbul 802.669, Kocaeli 788.873, Ankara 788.859, Tunceli 478.675, Çankırı 430.386, Şanlıurfa 188.144 (Suchauszüge AA und Capital). |
| region | wie oben, englische Namen ins Türkische übertragen | – | **Abweichung:** turkiye-api ordnet Çankırı der Region Marmara und Hakkari der Region Güneydoğu Anadolu zu. Übernommen wurden İç Anadolu bzw. Doğu Anadolu (brkunver). |
| gross_stadt | turkiye-api, Feld `isMetropolitan` | – | Ergibt 30 Provinzen. Deckt sich mit den fett markierten Großstädten der Wikipedia-Liste (siehe Bürgermeister). |
| abgeordnete_2023 | [bumincetin/TurkishElection2023](https://github.com/bumincetin/TurkishElection2023), `info.csv`, Spalte `total_parliamentarians` | YSK | Alle 81 Werte gleich der Auszählung der 28. Wahlperiode in [mesely/PoliEcoTRNetSci](https://github.com/mesely/PoliEcoTRNetSci), `Data/milletvekilleri.csv` (aus TBMM-Listen). Deckt sich mit den Presseangaben: İstanbul 98, Ankara 36, İzmir 28, Bursa 20, Antalya 17, Kocaeli 14; je +1 für Antalya, Kocaeli, Sakarya, Tekirdağ und je −1 für Denizli, Eskişehir, Muş, Tunceli gegenüber 2018 (Hürriyet). |
| stimmen_2023_* | [toUpperCase78/secim-2023-sonuclar](https://github.com/toUpperCase78/secim-2023-sonuclar), Datei `…Milletvekili_Genel_Secimi_Iller.csv` | YSK, sonuc.ysk.gov.tr | Stimmen je Partei identisch mit [ozancanozdemir/turkeyelections](https://github.com/ozancanozdemir/turkeyelections) (`genel_secim_2023_il`, auch auf CRAN). Anteil = Parteistimmen ÷ gültige Stimmen der Provinz. İstanbul (3 Wahlkreise), Ankara (3), İzmir (2) und Bursa (2): Stimmen der Wahlkreise summiert, der Anteil ist also bevölkerungsgewichtet. ysp = Yeşil Sol Parti. |
| buergermeister_2024 | Wikipedia (en) „2024 Turkish local elections“, Tabelle „Full list“, als Kopie in [jhellingsdata/RADataHub](https://github.com/jhellingsdata/RADataHub) (`Chart Packs/elections_inflation/Election_md_dump/2024_Turkish_local_elections.md`) | YSK | Verglichen mit [polituk/adaletsizlik-haritasi](https://github.com/polituk/adaletsizlik-haritasi), `assets/js/data.js` (Stand Juli 2025): 80 von 81 stimmen überein. Einzige Abweichung ist **Tokat** (Wikipedia: MHP, Karte: AKP). Übernommen wurde MHP, vermerkt in `hinweis`. Summe CHP 35, AKP 24, DEM 10, MHP 8, YRP 2, İYİ 1, BBP 1 wie in `recherche/startdaten.md`. |
| hinweis | Suchauszüge (siehe unten), dazu Status laut adaletsizlik-haritasi (Juli 2025) | – | Nicht vollständig, siehe Lücken. |
| arbeitslosenquote | Suchauszüge: TR82 4,6 % für 2024 ([sondakika](https://www.sondakika.com/ekonomi/haber-cankiri-kastamonu-ve-sinop-illeri-issizligin-en-du-16979999/), TÜİK-Regionalbüro, „niedrigste der 26 Regionen“); TR33 6,4 % für 2024 (Auszug aus dem Sozioökonomie-Bericht der Kalkınma Ajansı zu Manisa) | TÜİK, Erhebung zur Erwerbstätigkeit | Nur 2 von 26 Regionen belegt, alle übrigen „?“. |

## Summenprüfungen

- **Bevölkerung:** Summe 86.092.168. Das entspricht genau der TÜİK-Gesamtzahl für den 31.12.2025. Alle Werte stammen aus 2025 (`quelle_jahr` = 2025).
- **Abgeordnete:** Summe 600, in zwei Quellen gleich.
- **Großstädte:** 30.
- **Regionen:** Marmara 11, Ege 8, Akdeniz 8, İç Anadolu 13, Karadeniz 18, Doğu Anadolu 14, Güneydoğu Anadolu 9. **NUTS-2:** 26 verschiedene Codes.
- **Stimmen 2023, Inlandssumme:** 52.628.178 gültige Stimmen; AKP 34,93 %, CHP 25,18 %, MHP 9,92 %, İYİ 9,81 %, YSP 8,78 %. Das amtliche Gesamtergebnis (AKP 35,62, CHP 25,35, MHP 10,07, İYİ 9,69, YSP 8,82) enthält zusätzlich die Stimmen aus dem Ausland und von den Grenzübergängen. Diese sind keiner Provinz zugeordnet und fehlen deshalb hier.
- **Plausibilität der Sitzzahlen:** Eine vereinfachte D'Hondt-Nachrechnung je Partei mit diesen Sitzen und Stimmen ergibt AKP 263, CHP 169, MHP 51, İYİ 46, YSP 62, YRP 5, TİP 4, zusammen 600. Amtlich: AKP 268, CHP 169, MHP 50, İYİ 43, YSP 61, YRP 5, TİP 4. Die Nachrechnung bildet die Bündnisregeln nicht genau ab; sie zeigt nur, dass die Größenordnung stimmt.

## Besonderheiten

- **CHP 0,00 %** in Aksaray, Bayburt, Bitlis, Çankırı, Gümüşhane, Muş und Yozgat: Die CHP hatte dort 2023 keine eigene Liste. Ebenso hat İYİ in 9 Provinzen 0 Stimmen (Adıyaman, Bartın, Batman, Çorum, Düzce, Erzincan, Hakkari, Rize, Van). Das ist kein Datenfehler.
- **Hinweis-Spalte, Quellen der Suchauszüge:**
  - Aydın, Çerçioğlu zur AKP (14.08.2025), und Afyonkarahisar, Köksal zur AKP (12.05.2026): [Hürriyet](https://www.hurriyet.com.tr/gundem/son-dakika-afyonkarahisar-belediye-baskani-burcu-koksal-ak-partide-43171877), [yenisafak](https://www.yenisafak.com/foto-galeri/ozgun/ak-partiye-katilan-belediye-baskanlari-kimler-hangi-belediyeler-ak-partiye-gecti-4835531).
  - Ankara, Yavaş tritt aus der CHP aus (23.09.2026): [Euronews](https://tr.euronews.com/2026/09/23/mansur-yavas-chpden-istifa-etti-bagimsiz-olarak-devam-edecek), [Cumhuriyet](https://www.cumhuriyet.com.tr/siyaset/son-dakika-mansur-yavas-chp-den-istifa-etti-2540256).
  - İzmir, Tugay tritt aus (18.06.2026), und İstanbul unter einem Stellvertreter: [halktv](https://halktv.com.tr/siyaset/iki-buyuksehir-belediyesi-partisiz-biri-de-baskansiz-kaldi-1056958h).
  - Denizli, Eskişehir und Tekirdağ zu YENİ, mit Daten: Suchauszug zur Frage „welche Großstadt-Bürgermeister zu YENİ“ ([antalyagundem](https://www.antalyagundem.com.tr/fena-savruldular-14-buyuksehir-belediye-baskaninin-3u-tutuklu-biri-vefat-etti-biri-acikta-ucu-yeni-partide-biri-ak-partide-ikisi-bosta)).
  - Çanakkale, Manisa, Kırşehir, Bilecik, Burdur, Artvin und Kastamonu zu YENİ: [bianet](https://bianet.org/haber/yeni-parti-ye-gecen-chp-li-belediye-baskanlari-321925), [abcgazetesi](https://abcgazetesi.com.tr/politika/canakkale-belediye-baskani-muharrem-erkek-chpden-ayrildi-yeni-yolumuz-acik-olsun-869259), [kastamonuistiklal](https://www.kastamonuistiklal.com/kastamonunun-da-bulundugu-44-kisilik-liste-belli-oldu).
  - Edirne und Zonguldak zu YENİ: nur ein Suchauszug, als ungeprüft markiert.
  - Bursa, Stellvertreter Şahin Biba (AKP): [haberler.com](https://www.haberler.com/politika/bir-buyuksehir-daha-ak-partiye-gecti-iste-yerel-19732648-haberi/).
  - Zwangsverwalter (kayyum) in Hakkari, Mardin, Batman, Siirt, Tunceli und Van: [Doğruluk Payı](https://www.dogrulukpayi.com/bulten/2024-yerel-secimlerinden-bu-yana-turkiye-de-belediye-yonetimlerinin-degisimi), [imarhaber](https://www.imarhaber.com/kayyum-atanan-belediyelerin-tam-listesi/).
  - Karalar und Seçer bleiben in der CHP: [birgun](https://www.birgun.net/haber/zeydan-karalar-dan-yeni-parti-aciklamasi-chp-de-kalacagim-725006), [Sözcü](https://www.sozcu.com.tr/chp-de-mi-kalacak-yeni-parti-ye-mi-gececek-vahap-secer-tarafini-secti-p351749).

## Bekannte Lücken

1. **Arbeitslosenquote nach NUTS-2:** 24 von 26 Regionen fehlen („?“). Die TÜİK-Tabellen und die Presseartikel waren nicht abrufbar, und die Suchauszüge widersprachen sich. TÜİK veröffentlicht inzwischen auch **Werte je Provinz**. Laut Suchauszug ([Doğruhaber](https://dogruhaber.com.tr/tuik-verileriyle-issizlik-oraninin-zirvede-oldugu-20-il), [turkhavadis](https://www.turkhavadis.com/tuik-acikladi-issizlikte-en-dusuk-il-ardahan-en-yuksek-hakkari)) lauten die Werte für 2025: Türkei 8,3 %; Hakkari 13,8, Van 12,7, Yalova 11,8, Muş 11,7, Adana 11,6, Osmaniye 11,6, Karabük 11,3, Kırıkkale 10,0, Kahramanmaraş 9,9, Batman 9,9, Erzincan 9,9, Iğdır 9,8, Şanlıurfa 9,8, Hatay 9,7, Bingöl 9,6, Antalya 5,8, Ardahan 4,0 (niedrigster Wert). Diese Werte stehen nicht in der CSV, weil sie Provinzwerte sind und nur einen Teil der Provinzen abdecken. Vorschlag: die Tabelle „İşgücü İstatistikleri 2025“ direkt bei TÜİK holen.
2. **Übertritte von Bürgermeistern:** Laut Suchauszug sind 17 Provinz-Bürgermeister zu YENİ gewechselt. Namentlich belegt sind hier nur 8 (davon 2 ungeprüft), dazu 4 Großstädte. Die Wechsel von YRP- und İYİ-Bürgermeistern zur AKP (laut Doğruluk Payı 20 bzw. 5 Bürgermeister) sind nicht nach Provinzen aufgeschlüsselt. Die Spalte `hinweis` ist also **nicht vollständig**. Daten zu Absetzungen (İstanbul, Bolu, Bursa) sind nur aus Suchauszügen belegt.
3. **Tokat:** Die Quellen widersprechen sich (MHP oder AKP), siehe oben.
4. **Unabhängigkeit der Wahlquellen:** Die beiden Datensätze zur Wahl 2023 stimmen Stimme für Stimme überein, beide nennen die YSK. Ob sie wirklich unabhängig erhoben wurden, ist nicht geprüft.
