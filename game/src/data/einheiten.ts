// Echte Einheiten an den Reglern der Maßnahmen (Befund B-1): statt „120 % des Ausgangs“ die Größe selbst, etwa „33.700 Lira netto im
// Monat“, „9,5 Mio. m³ Gas am Tag“ oder ein benannter Zustand wie „Staffeltarif: Vielverbraucher zahlen mehr“.
//
// Grundlage ist die Recherche dokumentation/analyse_2026-11-05/nacht/regler_einheiten.md (und .json) vom 06.11.2026. Je Eintrag steht
// darüber die Startgröße 2026 mit Quelle (Titel, Datum, Adresse). Sicherheit:
//   belegt   Rechtsgrundlage oder amtliche Meldung genannt, mehrere Quellen stimmen überein
//   prüfen   eine Sekundärquelle oder abgeleitet; vor einer Übernahme in Texte an der Primärquelle prüfen
// Viele Zitate stammen aus Such-Auszügen, weil die Amtsseiten in der Recherche gesperrt waren (siehe dort).
//
// Nur Anzeige: Die Simulation rechnet weiter mit dem Index 0 bis 100. Die Abbildung Index → Größe ist ein Spielparameter:
//   linear     Größe = Startgröße × Stufe ÷ Startpegel (Regler auf 150 % ergibt das Anderthalbfache), höchstens `max`
//   anteil     eine Quote: unter dem Start verhältnisgleich, darüber gleichmäßig bis 100 % am Reglerende (nie über 100 %)
//   umgekehrt  mehr Maßnahme heißt weniger Größe: Größe = Startgröße × Startpegel ÷ Stufe, höchstens das Doppelte der Startgröße
//   straenge   Ausbau nur in ganzen Strängen: Startgröße + n × Strang, n gerundet und begrenzt
// Zustände sind Maßnahmen, die keine Menge sind (Vorhaben, Verträge, Stufen eines Systems); der Zustand am Startpegel ist der von 2026.
// Lücken haben keine belastbare Startgröße: Sie zeigen ehrlich das Verhältnis zu 2026 („wie 2026“, „+50 % gegenüber 2026“).
// Texte und Zustandsnamen stehen in den Katalogen nacht_n9.json (n9.e.*, n9.g.*, n9.z.*), Zahlen gehen durch den Formatierer der Sprache.
// Diese Datei wird aus der Recherche erzeugt (scratchpad n9/gen.py); Änderungen an Werten bitte in beiden nachziehen.

import { t, zahl } from "../i18n";

export type Sicherheit = "belegt" | "prüfen";

export type Form =
  | { art: "linear"; max?: number }
  | { art: "anteil" }
  | { art: "umgekehrt" }
  | { art: "straenge"; strang: number; min: number; max: number };

export interface Menge {
  art: "menge";
  /** Startgröße 2026 in der Einheit des Katalogtexts n9.e.<id> */
  wert: number;
  /** Rundung der Anzeige abseits des Startpegels */
  schritt: number;
  form?: Form;
  sicherheit: Sicherheit;
}
export interface Zustaende {
  art: "zustand";
  /** Indexwerte der benannten Zustände (aufsteigend); Namen im Katalog n9.z.<id>.<w> */
  stufen: number[];
  sicherheit: Sicherheit;
}
export interface Luecke {
  art: "luecke";
  /** mehr Maßnahme heißt weniger Größe (etwa Abfertigungsstunden) */
  umgekehrt?: boolean;
}
export type Einheit = Menge | Zustaende | Luecke;

export const EINHEITEN: Record<string, Einheit> = {
  // Mindestlohn: 28.075,50 Lira netto (brutto 33.030 Lira), gültig 01.01.–31.12.2026
  // Quelle: KPMG Vergi: 2026 Yılı Asgari Ücreti Açıklandı, Dez. 2025
  //   https://kpmgvergi.com/yayinlar/mali-bultenler/sosyal-guvenlik/2026-yili-asgari-ucreti-aciklandi/3342
  m_mindestlohn: { art: "menge", wert: 28075.5, schritt: 50, sicherheit: "belegt" },
  // Rentenerhöhungen: 20.000 Lira je Monat ab Januar 2026 (vorher 16.881); Juli 2026 laut einer Quelle 23.552 Lira (Gesetz Nr. 7590, prüfen)
  // Quelle: KPMG Vergi: Asgari Ücret Desteği ve En Düşük Emekli Aylığı (Gesetz Nr. 7573, RG 29.01.2026 Nr. 33152), 29.01.2026
  //   https://kpmgvergi.com/Content//FinancialBulletins/AsgariÜcretDestegiveEnDusukEmekliAyligiHk._29012026_0343295334351.pdf
  m_renten: { art: "menge", wert: 20_000, schritt: 100, sicherheit: "belegt" },
  // Frühverrentung: Zustand: Altersgrenze gilt (Frauen 58 / Männer 60 für Ersteintritt 1999–2008, steigend bis 65 ab 2048); EYT-Öffnung 2023 für Eintritt vor 09.09.1999 ohne Altersgrenze
  // Quelle: Gesetz Nr. 5510 (Sosyal Sigortalar ve GSS Kanunu) Art. 28, Gesetz Nr. 7438 (EYT), RG 03.03.2023, 03.03.2023
  //   https://hukukcularevi.com/sgk-emeklilik-yasi-sigortalilik-suresi-5510/
  m_fruehrente: { art: "zustand", stufen: [15, 40, 65, 90], sicherheit: "belegt" },
  // Kindergeld und Familienhilfe: 5.000 Lira je Monat ab dem 3. Kind (bis 5 Jahre); 2. Kind 1.500 Lira je Monat; 1. Kind einmalig 5.000 Lira (Stand 2026)
  // Quelle: Dünya: Devletten 15 ayrı ödeme (dazu gazetebirlik.com, Doğum yardımı 2026 Temmuz), 2026
  //   https://www.dunya.com/foto-galeri/ekonomi/devletten-15-ayri-odeme-kimler-alabiliyor-ne-kadar-yatiyor-galeri-839345
  m_kindergeld: { art: "menge", wert: 5000, schritt: 50, sicherheit: "prüfen" },
  // Sozialhilfe: 917 Mrd. Lira Sozialhilfebudget 2026 (alle Träger; davon ~388 Mrd. Familienministerium); 3.991.766 Haushalte 2025
  // Quelle: Aile ve Sosyal Hizmetler Bakanlığı: 2026 yılı bütçesi TBMM Genel Kurulunda kabul edildi (Betrag laut Cevdet Yılmaz, Presse), Dez. 2025
  //   https://aile.gov.tr/sgbd/haberler/bakanligimizin-2026-yili-butcesi-tbmm-genel-kurulunda-kabul-edildi/
  m_sozialhilfe: { art: "menge", wert: 917, schritt: 1, sicherheit: "prüfen" },
  // Arbeitslosengeld: 40 % des Bruttolohns der letzten 4 Monate; höchstens 80 % des Brutto-Mindestlohns (2026: 26.424 Lira), mindestens 13.212 Lira brutto; Dauer 180–300 Tage
  // Quelle: Habertürk: 2026 işsizlik maaşı ne kadar oldu? (Gesetz Nr. 4447 Art. 50), Jan. 2026
  //   https://www.haberturk.com/2026-issizlik-maasi-ne-kadar-oldu-zamli-issizlik-maasi-kac-tl-ye-yukseldi-en-dusuk-ve-en-yuksek-issizlik-odenegi-ne-kadar-3849742
  // Eine Ersatzquote kann 100 % des Lohns nicht übersteigen: über dem Start gleichmäßig bis 100 % am Reglerende (Spielparameter).
  m_arbeitslosengeld: { art: "menge", wert: 40, schritt: 1, form: { art: "anteil" }, sicherheit: "belegt" },
  // Kinderbetreuung: 49 % (Nettobetreuungsquote 3–5 Jahre, Schuljahr 2024/25); 5-Jährige 84,14 % (2025/26)
  // Quelle: ARTI Eğitim Dergisi Nisan 2026 (nach MEB-Statistik); dazu MEB: 2025-2026 Örgün Eğitim İstatistikleri, April 2026
  //   https://www.egitimtercihi.com/uploads/pdf/ARTI_EGITIM_DERGISI_NISAN_2026.pdf
  m_kinderbetreuung: { art: "menge", wert: 49, schritt: 1, form: { art: "anteil" }, sicherheit: "prüfen" },
  // Berufsausbildungsprogramme: Lücke: Jahressumme 2025 nicht sicher; Jan.–Mai 2025: 27.803 in İşbaşı-Programmen + 5.892 in Kursen
  // Quelle: Alomaliye: Kayıtlı işsiz 2 161 561 kişi (İŞKUR-Bulletin Mai 2025), 16.06.2025
  //   https://www.alomaliye.com/2025/06/16/kayitli-issiz-2-161-561-kisi/
  // Lücke. Hinweis der Recherche: Suchhinweis: İŞKUR 2025 Yılı Faaliyet Raporu (iskur.gov.tr/medya/wmthqzsj/2025-yılı-faaliyet-raporu.pdf), Tabelle 'Aktif İşgücü Programları – yararlanıcı sayısı'. Dreifach mit m_berufsschulen und m_fachkraefteprogramm (B-6).
  m_ausbildung: { art: "luecke" },
  // Fachkräfte und Weiterbildung: Lücke (wie m_ausbildung; Größen nicht trennbar)
  // Quelle: İŞKUR 2025 Yılı Faaliyet Raporu, 2026
  //   https://www.iskur.gov.tr/medya/wmthqzsj/2025-yılı-faaliyet-raporu.pdf
  // Lücke. Hinweis der Recherche: Empfehlung: mit m_ausbildung zusammenlegen (B-6). Alternative Größe: MEB-Meisterausbildung (Mesleki Eğitim Merkezi, 'çırak ve kalfa' Schülerzahl) – Suchhinweis MEB MESEM öğrenci sayısı 2025-2026.
  m_fachkraefteprogramm: { art: "luecke" },
  // Zuzahlungen der Patienten: 50 Lira je Besuch (staatl. Krankenhaus, seit 01.07.2026; vorher 26); Lehrkrankenhaus 90, privat 100; Hausarzt 0
  // Quelle: Alomaliye: Hastane muayene katılım payları yeniden belirlendi (SUT-Änderung, RG 01.07.2026 Nr. 33297), 01.07.2026
  //   https://www.alomaliye.com/2026/07/01/hastane-muayene-katilim-paylari-yeniden-belirlendi/
  m_zuzahlungen: { art: "menge", wert: 50, schritt: 1, sicherheit: "belegt" },
  // Steuerfahndung: 6,72 % (2025; 2024: 2,91 %); Prüfer: rund 7.300 besetzte Stellen
  // Quelle: Ekonomi Gazetesi: Vergi Denetim Kurulu faaliyet raporundan 2025'e dair veriler, 2026
  //   https://www.ekonomigazetesi.com/kose-yazisi/vergi-denetim-kurulu-faaliyet-raporundan-2025e-dair-veriler-76528
  m_steuerfahndung: { art: "menge", wert: 6.72, schritt: 0.1, sicherheit: "prüfen" },
  // Steuer auf Kraftstoff: 14,8277 Lira je Liter Benzin 95 Oktan (ab 01.01.2026; vorher 13,8642); Diesel 2027 13,9006 Lira. Wegen Eşel-mobil-System 2026 zeitweise gesenkt (Okt. 7,90 Lira)
  // Quelle: PwC KDV ve ÖTV Bülteni 2026/1 (Präsidialbeschluss Nr. 10799, RG 31.12.2025 Nr. 33124, 5. Mükerrer), Jan. 2026
  //   https://www.pwc.com.tr/tr/Hizmetlerimiz/vergi/dolayli-vergi/bultenler/kdv-ötv-bültenleri/2026/petrol-urunleri-ile-tutun-mamulleri-ve-alkollu-iceceklerde-maktu-otv-artisi.pdf
  m_kraftstoffsteuer: { art: "menge", wert: 14.8277, schritt: 0.01, sicherheit: "belegt" },
  // Steuer auf Immobilien und Vermögen: 2 ‰ (Wohnung in Großstadt; sonst 1 ‰); Steuer auf teure Wohnungen 3/6/10 ‰ ab 17.711.000 Lira Wert (2026)
  // Quelle: Alomaliye: Emlak Vergisi Kanunu Genel Tebliği (Seri No: 88/89) – 2026 Değerli Konut Vergisi, RG 31.12.2025, 31.12.2025
  //   https://www.alomaliye.com/2025/12/31/emlak-vergisi-kanunu-genel-tebligi-seri-no-88-2026-degerli-konut-vergisi/
  m_immobiliensteuer: { art: "menge", wert: 2, schritt: 0.1, sicherheit: "belegt" },
  // Exportförderung: 54 Mrd. Dollar (2025); 48,7 Mrd. Dollar (2024)
  // Quelle: Bengütürk: Türk sanayiinden tarihi ihracat rekoru, Jan. 2026
  //   https://www.benguturk.com/ekonomi/turk-sanayiinden-tarihi-ihracat-rekoru-254304h
  m_exportfoerderung: { art: "menge", wert: 54, schritt: 0.5, sicherheit: "prüfen" },
  // Investitionsanreize: rund 980 Mrd. Lira je Jahr (abgeleitet: 897,5 Mrd. Lira in 4.500 Förderbescheiden Juni 2025–April 2026, 11 Monate)
  // Quelle: Alomaliye: Nisan ayında 81 milyar TL'lik yatırım teşvik belgesi düzenlendi (Bülten Sanayi ve Teknoloji Bakanlığı), 22.05.2026
  //   https://www.alomaliye.com/2026/05/22/nisan-ayinda-81-milyar-tllik-yatirim-tesvik-belgesi-duzenlendi/
  m_investitionsanreize: { art: "menge", wert: 980, schritt: 10, sicherheit: "prüfen" },
  // Staatliche Kreditgarantien: 201,6 Mrd. Lira Kreditrahmen der Hazine-Pakete (Stand 27.03.2026; davon 129,9 Mrd. genutzt)
  // Quelle: Ekonomi Gazetesi: 70 milyar liralık finansmana ilgi az, März 2026
  //   https://www.ekonomigazetesi.com/ekonomi/70-milyar-liralik-finansmana-ilgi-az-76861
  m_kreditgarantien: { art: "menge", wert: 201.6, schritt: 1, sicherheit: "prüfen" },
  // Tourismuswerbung: Lücke für 2025/26; letzter Ministerwert 140 Mio. Dollar (Plan 2022; 2021: 110 Mio.)
  // Quelle: Ekonomim: 'Tanıtıma 140 milyon dolar harcadık, turizm 37 milyar dolarla rekor kıracak', 2022
  //   https://www.ekonomim.com/ekonomi/tanitima-140-milyon-dolar-harcadik-turizm-37-milyar-dolarla-rekor-kiracak-haberi-664881
  // Lücke. Hinweis der Recherche: Wert ist veraltet. Suchhinweis: TGA (Türkiye Turizm Tanıtım ve Geliştirme Ajansı) Faaliyet Raporu 2025; TGA finanziert sich zu ~19 % aus dem Staat, Rest aus Abgabe der Betriebe.
  m_tourismuswerbung: { art: "luecke" },
  // Mittelstandsförderung: 34,8 Mrd. Lira an 57.437 Betriebe (2025)
  // Quelle: KOSGEB 2025 Yılı Faaliyet Raporu, 2026
  //   https://webdosya.kosgeb.gov.tr/Content/Upload/Dosya/Kurumsal/2026/KOSGEB_2025_Y%C4%B1l%C4%B1_Faaliyet_Raporu.pdf
  m_kmu: { art: "menge", wert: 34.8, schritt: 0.5, sicherheit: "belegt" },
  // Einfuhrzölle: 17,5 % (einfacher Durchschnitt der MFN-Zölle, alle Waren, 2024; handelsgewichtet 10,7 %)
  // Quelle: WTO Tariff & Trade Data: Türkiye profile, 2025
  //   https://ttd.wto.org/en/profiles/turkiye
  m_zoelle: { art: "menge", wert: 17.5, schritt: 0.1, sicherheit: "belegt" },
  // Industrielle Modernisierung: 30 Mrd. Dollar Förderrahmen (Steuervorteile und Zuschüsse) bis 2030, angekündigt Juli 2024
  // Quelle: İMMİB: HIT-30 High Tech Türkiye Yatırım Programı, Juli 2024
  //   https://immib.org.tr/TR/hit-30-high-tech-turkiye-yatirim-programi
  m_industrie_modernisierung: { art: "menge", wert: 30, schritt: 1, sicherheit: "prüfen" },
  // Krankenhausbau: 3,1 Betten je 1.000 Einwohner (268.359 Betten Ende 2023; OECD-Mittel 4,2)
  // Quelle: BirGün: Özel hastaneler pastanın kremasını sıyırıyor (nach Sağlık İstatistikleri Yıllığı 2024 Haber Bülteni); dazu TTB, 2025
  //   https://www.birgun.net/makale/ozel-hastaneler-pastanin-kremasini-siyiriyor-660367
  m_krankenhausbau: { art: "menge", wert: 3.1, schritt: 0.1, sicherheit: "prüfen" },
  // Gehälter im Gesundheitswesen: rund 65.000 Lira garantiertes Netto (Allgemeinarzt, Gesundheitsministerium, Juli 2026; mit Zulagen und Diensten 80.000–125.000)
  // Quelle: Tahancı Hukuk: Doktor Maaşları 2026 (Juli 2026), Juli 2026
  //   https://www.tahanci.av.tr/doktor-maaslari/
  m_aerztegehalt: { art: "menge", wert: 65_000, schritt: 500, sicherheit: "prüfen" },
  // Lehrergehälter: rund 64.000 Lira netto (Juli–Dez. 2026, je nach Steuerstufe 63.998–68.236)
  // Quelle: Harbiye Hukuk: Öğretmen Maaşları 2026, Juli 2026
  //   https://www.harbiyehukuk.com/?p=12179
  m_lehrergehaelter: { art: "menge", wert: 64_000, schritt: 500, sicherheit: "prüfen" },
  // Schulbau: rund 8.900 Klassenräume netto mehr im Schuljahr 2025/26 (abgeleitet: 753.571 auf 762.434); Schüler je Klassenraum: Grundschule 19, Mittelschule 25, Oberstufe 21
  // Quelle: Dünya: MEB eğitimde 25 yıllık gelişimi açıkladı; dazu MEB: 2025-2026 Örgün Eğitim İstatistikleri, 2026
  //   https://www.dunya.com/egitim/meb-egitimde-25-yillik-gelisimi-acikladi-haberi-836266
  m_schulbau: { art: "menge", wert: 8900, schritt: 100, sicherheit: "prüfen" },
  // Berufsschulen: 39,51 % (2025/26; 2024/25: 37,56 %)
  // Quelle: MEB: 2025-2026 Örgün Eğitim İstatistikleri Açıklandı, 2026
  //   https://www.meb.gov.tr/20252026orgunegitimistatistikleriaciklandi/haber/42058/tr
  m_berufsschulen: { art: "menge", wert: 39.51, schritt: 0.1, form: { art: "anteil" }, sicherheit: "belegt" },
  // Neue Universitäten: 602.117 Studienplätze an staatlichen Hochschulen (YKS 2026; insgesamt 805.747); 129 staatliche Universitäten (Jan. 2025)
  // Quelle: Dünya: YKS'de 805 bin 747 kontenjan adayları bekliyor (ÖSYM-Tercih Kılavuzu 2026), Juli 2026
  //   https://www.dunya.com/egitim/yksde-805-bin-747-kontenjan-adaylari-bekliyor-haberi-833687
  m_unigruendungen: { art: "menge", wert: 602_117, schritt: 1000, sicherheit: "belegt" },
  // Stipendien: 4.000 Lira je Monat ab 06.01.2026 (vorher 3.000); Master 8.000, Promotion 12.000
  // Quelle: Gzt: KYK bursu ne kadar oldu 2026-2027, Sept. 2026
  //   https://www.gzt.com/gundem/kyk-bursu-ne-kadar-oldu-2026-2027-kyk-burs-ve-kredi-fiyati-4251273
  m_stipendien: { art: "menge", wert: 4000, schritt: 50, sicherheit: "prüfen" },
  // Forschungsförderung: 1,55 % des BIP (2025; 980,4 Mrd. Lira; 2024: 1,46 %)
  // Quelle: Alomaliye: Araştırma-Geliştirme Faaliyetleri Araştırması 2025 (TÜİK-Meldung), 30.10.2026
  //   https://www.alomaliye.com/2026/10/30/ar-ge-harcamalari-980-milyar-lirayi-asti-2025/
  m_forschung: { art: "menge", wert: 1.55, schritt: 0.01, sicherheit: "belegt" },
  // Bildungstechnik und digitales Lernen: Lücke: kein aktueller Betrag gefunden (FATİH-Projekt zuletzt 2013 mit 1,4 Mrd. Lira im Haushalt)
  // Quelle: DMO: FATİH-Katalog Tablet-Rahmenvertrag, 28.02.2023
  //   https://www.dmo.gov.tr/Eng/Home/EngIcerik/3813
  // Lücke. Hinweis der Recherche: Suchhinweis: MEB 2026 Performans Programı, Programm 'Eğitimde Dijital Dönüşüm' bzw. YEĞİTEK-Ansatz; Investitionsprogramm 2026 (sbb.gov.tr), Sektor Bildung 160,5 Mrd. Lira gesamt.
  m_bildungstechnik: { art: "luecke" },
  // Medizintechnik und Krankenhausmodernisierung: 146,9 Mrd. Lira (Investitionsprogramm 2026; Sektor Gesundheit 173,5 Mrd.)
  // Quelle: RECHERCHE_HAUSHALT_MINISTERIEN_2026.md Abschnitt 2 (Investitionsprogramm 2026, SBB), Suchauszüge, 05.11.2026
  //   https://www.sbb.gov.tr/wp-content/uploads/2025/12/1-2026-Yili-Merkezi-Yonetim-Butce-Kanunu.pdf
  m_medizintechnik: { art: "menge", wert: 146.9, schritt: 1, sicherheit: "prüfen" },
  // Autobahn- und Brückenbau: 157 km geplant für 2026 (Netz 3.796 km Ende 2025 auf 3.953 km Ende 2026); 2025 kein Nettozuwachs
  // Quelle: KGM: Karayolu Ulaşım İstatistikleri 2025; Planwerte nach sanayigazetesi.com.tr, 2026
  //   https://www.kgm.gov.tr/SiteCollectionDocuments/KGMdocuments/Yayinlar/YayinPdf/KarayoluUlasimIstatistikleri2025.pdf
  m_autobahnen: { art: "menge", wert: 157, schritt: 5, sicherheit: "prüfen" },
  // Garantien für Betreiberprojekte: rund 239 Mrd. Lira 2026 (Brücken/Autobahnen 103,2 Mrd. erwartet, 2025: 85,1 Mrd.; Stadtkliniken 136,1 Mrd. Haushaltsansatz)
  // Quelle: Nefes: Köprü, otoyol ve şehir hastanesi bilançosu (nach KGM-Bericht und Sağlık Bakanlığı Performans Programı 2026), 2026
  //   https://www.nefes.com.tr/kopru-otoyol-ve-sehir-hastanesi-bilancosu-6-ayda-120-milyar-lira-gitti-143152
  m_oepp_garantien: { art: "menge", wert: 239, schritt: 1, sicherheit: "prüfen" },
  // Bahnausbau: 145,6 Mrd. Lira (Investitionsprogramm 2026); Netz 2.251 km Schnellfahrstrecke, 3.776 km im Bau
  // Quelle: Ensonhaber: Uraloğlu – Hızlı tren hat uzunluğu 3 yılda katlanacak; Betrag aus RECHERCHE_HAUSHALT_MINISTERIEN_2026.md (Investitionsprogramm 2026), 2025/2026
  //   https://www.ensonhaber.com/gundem/abdulkadir-uraloglu-duyurdu-hizli-tren-hat-uzunlugu-3-yilda-katlanacak
  m_bahn: { art: "menge", wert: 145.6, schritt: 1, sicherheit: "prüfen" },
  // Nahverkehr: 220,85 km im Bau in neun Provinzen (Ministeriumsprojekte); Bestand 1.054,7 km städtische Schiene (2026)
  // Quelle: DHA: Bakan Uraloğlu – 452 kilometrelik kent içi raylı sistem hattını hizmete sunduk, 2026
  //   https://www.dha.com.tr/gundem/bakan-uraloglu-452-kilometrelik-kent-ici-rayli-sistem-hattini-hizmete-sunduk-2958129
  m_nahverkehr: { art: "menge", wert: 220.85, schritt: 5, sicherheit: "prüfen" },
  // Breitbandausbau: 10,7 Mio. Glasfaserkunden (2. Quartal 2026; davon bis in die Wohnung 9,15 Mio. im 1. Quartal); Glasfasernetz 720.012 km
  // Quelle: CNBC-e: BTK açıkladı – Türkiye'de 2 milyon yeni abone fiber internetle tanıştı, 2026
  //   https://www.cnbce.com/teknoloji/btk-acikladi-turkiyede-2-milyon-yeni-abone-fiber-internetle-tanisti-h32577
  m_breitband: { art: "menge", wert: 10.7, schritt: 0.1, sicherheit: "prüfen" },
  // Regionalförderung: 2,75 Mrd. Lira Transfermittel 2026 (Präsidialbeschluss Nr. 11067)
  // Quelle: Alomaliye: 2026 yılında kalkınma ajanslarına kullandırılacak transfer ödenekleri (Karar Sayısı 11067, RG 17.03.2026), 17.03.2026
  //   https://www.alomaliye.com/2026/03/17/2026-yilinda-kalkinma-ajanslarina-kullandirilacak-transfer-odenekleri-karar-sayisi-11067/
  m_regionalfoerderung: { art: "menge", wert: 2.75, schritt: 0.05, sicherheit: "belegt" },
  // Intelligente Infrastruktur: Lücke
  // Quelle: Ulaştırma ve Altyapı Bakanlığı (Akıllı Ulaşım Sistemleri Strateji Belgesi 2020–2023 und Nachfolger), –
  //   https://www.uab.gov.tr/
  // Lücke. Hinweis der Recherche: Suchhinweis: 'Ulusal Akıllı Ulaşım Sistemleri Strateji Belgesi ve Eylem Planı' (UAB), KGM 'AUS yatırımları' im Investitionsprogramm 2026. Ehrlicher wäre ein Zustandsregler (keine / Pilotstädte / Autobahnen voll / landesweit).
  m_smart_infrastruktur: { art: "luecke" },
  // Instandhaltung der Infrastruktur: Lücke
  // Quelle: KGM-Veröffentlichungen (Faaliyet Raporu), –
  //   https://www.kgm.gov.tr/SiteCollectionDocuments/KGMdocuments/Yayinlar/YayinPdf/KarayoluUlasimIstatistikleri2025.pdf
  // Lücke. Hinweis der Recherche: Suchhinweis: KGM 2025 Faaliyet Raporu, Posten 'bakım-onarım' bzw. 'yol bakım ve işletme'; TCDD 'yol yenileme'. Netz 68.517 km Staats- und Provinzstraßen (KGM 2025).
  m_instandhaltung: { art: "luecke" },
  // Moderne Zoll- und Handelssysteme: Lücke (letzter belastbarer internationaler Wert ist der Doing-Business-Bericht 2020)
  // Quelle: Weltbank Logistics Performance Index 2023 (Teilindex Zoll), 2023
  //   https://lpi.worldbank.org/international/global
  // Lücke. Hinweis der Recherche: Wenn Stunden: Anzeige x = Start × Startpegel ÷ Stufe (umgekehrt proportional). Ehrlicher: benannte Zustände (Papierzoll / elektronische Anmeldung / Einziges Fenster für alle Behörden / Vorabfreigabe mit Risikoprofil). Suchhinweis: Ticaret Bakanlığı 'Tek Pencere' und 'ortalama gümrük işlem süresi'.
  m_handelssysteme: { art: "luecke", umgekehrt: true },
  // Digitale Verwaltung und Steuertechnik: Zustand: E-Rechnung Pflicht für Betriebe ab 3 Mio. Lira Umsatz (ab 01.07.2026; Handel online, Immobilien, Kfz ab 0,5 Mio.); e-Devlet mit 9.170 Diensten und 68,2 Mio. Nutzern (2025)
  // Quelle: Sovos: Taslak Tebliğ – elektronik belgelerin kapsamı genişleyecek; dazu turkiye.gov.tr Resmî İstatistik 2025, Mai 2026
  //   https://sovos.com/tr/blog/kdv/taslak-teblig-yayimlandi-elektronik-belgelerin-kapsaminin-genisleyecegi-ongoruluyor/
  m_verwaltungsdigital: { art: "zustand", stufen: [5, 15, 30, 60, 90], sicherheit: "prüfen" },
  // Digitale Öffentlichkeit und Beteiligung: Zustand: Behördengänge online (e-Devlet, 69,8 Mio. Nutzer Sept. 2026) und Beschwerdestelle des Präsidialamts (CİMER); kein nationales Portal für offene Daten (veri.gov.tr angekündigt), keine Online-Anhörung zu Gesetzentwürfen
  // Quelle: TRT Haber: e-Devlet'te kullanıcı sayısının 2026'da 70 milyona ulaşması hedefleniyor; dazu Gazete Vatan: Kamudaki datalar veri adresiyle vatandaşa açılacak, 2026
  //   https://www.trthaber.com/haber/ekonomi/e-devlette-kullanici-sayisinin-2026da-70-milyona-ulasmasi-hedefleniyor-925089.html
  m_digitale_oeffentlichkeit: { art: "zustand", stufen: [10, 35, 65, 90], sicherheit: "prüfen" },
  // Ausbau von Sonne und Wind: 6,5 GW Zubau 2025 (Rekord; Solar 4,7 GW, Wind 1,9–2,1 GW); Bestand Ende 2025 rund 39,9 GW
  // Quelle: Ember: Türkiye Elektrik Görünümü 2026 – Rüzgar ve Güneş, 2026
  //   https://ember-energy.org/tr/analizler/turkiye-elektrik-gorunumu-2026/ruzgar-ve-gunes
  m_solar_wind: { art: "menge", wert: 6.5, schritt: 0.1, sicherheit: "belegt" },
  // YEKA-Ausschreibungsserie: 2,4 GW (YEKA 2026: 21 Ausschreibungen, 1,5 GW Wind + 0,9 GW Solar; 2025: 3,8 GW)
  // Quelle: Mercom India: Türkiye Floats 21 Renewable Energy Tenders for 2.4 GW Capacity, Juli 2026
  //   https://www.mercomindia.com/turkiye-floats-21-renewable-energy-tenders-for-2-4-gw-capacity
  m_yeka_serie: { art: "menge", wert: 2.4, schritt: 0.1, sicherheit: "belegt" },
  // Heimische Gasförderung: 9,5 Mio. m³ je Tag (Sakarya Phase 1, 12 Bohrungen, Stand Okt. 2026); Phase 2 mit FPU Osman Gazi auf 20 Mio. m³ ab Anfang 2027
  // Quelle: Alomaliye: Osman Gazi Karadeniz'e açılıyor, 15.10.2026
  //   https://www.alomaliye.com/2026/10/15/osman-gazi-karadenize-aciliyor/
  // Obergrenze ist die Förderanlage der Phase 2 (FPU Osman Gazi, 20 Mio. m³ am Tag ab Anfang 2027); Phase 3 steht als eigener Zustandsregler m_sakarya_phase3.
  m_gasfoerderung: { art: "menge", wert: 9.5, schritt: 0.1, form: { art: "linear", max: 20 }, sicherheit: "belegt" },
  // Sakarya Phase 3 (zweite FPU): Zustand: zweite Förderanlage im Bau (EPCIC-Vertrag Wison/TPAO Sept. 2025, Aufbauten seit Mai 2026, Kiellegung 25.10.2026; Inbetriebnahme Ende 2027 bis Mitte 2028)
  // Quelle: Offshore Technology: Wison New Energies secures Sakarya FPU EPCIC contract with TPAO; dazu chemxplore: Keel laying for Sakarya Phase 3 FPU, Sept. 2025 / Okt. 2026
  //   https://www.offshore-technology.com/news/wison-sakarya-fpu-epcic-tpao/
  m_sakarya_phase3: { art: "zustand", stufen: [0, 20, 55, 90], sicherheit: "belegt" },
  // Akkuyu-Vertrag nachverhandeln: Zustand: Vertrag gilt unverändert – Abnahmegarantie 12,35 US-Cent je kWh für 15 Jahre (70 % der Erzeugung Blöcke 1–2, 30 % Blöcke 3–4); Block 1 erste Stromerzeugung Ziel Ende 2026
  // Quelle: Wikipedia: Akkuyu Nuclear Power Plant (nach Abkommen Türkei–Russland 12.05.2010, Gesetz Nr. 6007); dazu World Nuclear Association, Nuclear Power in Turkey, Stand 2026
  //   https://en.wikipedia.org/wiki/Akkuyu_Nuclear_Power_Plant
  m_akkuyu_ppa: { art: "zustand", stufen: [40, 60, 80, 95], sicherheit: "belegt" },
  // Heimische Kohle (Afşin-Elbistan): Zustand: Erweiterung um 688 MW (2 Blöcke) geplant, nichts im Bau; Afşin-Elbistan A 1.360 MW in Betrieb
  // Quelle: Ember (14.04.2025) nach RECHERCHE_ENERGIE.md Abschnitt 4.3, 14.04.2025
  //   https://ember-energy.org/latest-insights/
  m_heimische_kohle: { art: "zustand", stufen: [10, 35, 65, 90], sicherheit: "prüfen" },
  // Effizienz, Wärmepumpen, E-Mobilität: 191.960 Elektroautos verkauft 2025 (17,7 % Marktanteil, +82 %)
  // Quelle: CNBC-e: Türkiye'de 2025'te yaklaşık 200 bin elektrikli araç satıldı (ODMD-Zahlen), Jan. 2026
  //   https://www.cnbce.com/otomotiv/turkiyede-2025te-yaklasik-200-bin-elektrikli-arac-satildi-h22676
  m_energieeffizienz: { art: "menge", wert: 191_960, schritt: 1000, sicherheit: "belegt" },
  // Preiswahrheit bei Energie: Zustand: Staffeltarif für Gas seit 04.04.2026 (Stufe 1: 10,625 Lira/m³, Stufe 2: 18 Lira/m³ ab Verbrauch über der Provinzgrenze); BOTAŞ-Stützung 2026 rund 950 Mrd. Lira
  // Quelle: Evrensel: Doğal gazda zam, kademeli sistem (BOTAŞ-Tarif ab 04.04.2026), 04.04.2026
  //   https://www.evrensel.net/haber/5978166/dogal-gazda-zam-kademeli-sistem-milyonlarca-abone-etkilenecek
  m_preiswahrheit: { art: "zustand", stufen: [5, 25, 60, 90], sicherheit: "belegt" },
  // Gas-Hub und Transit-Ausbau: 47,5 Mrd. m³ je Jahr (TurkStream 2 × 15,75 + TANAP 16)
  // Quelle: RECHERCHE_ENERGIE.md Abschnitt 2.2 (Energy News Beat 01.06.2026; eualive.net 2026), 2026
  //   https://www.botas.gov.tr/
  // Ausbau nur in ganzen Strängen zu 15,75 Mrd. m³ (TurkStream). Untergrenze: zwei Stränge weniger, dann bleibt TANAP mit 16 Mrd. m³. Obergrenze: zwei Stränge mehr, so viele wie TurkStream ursprünglich geplant hatte (vier Stränge; prüfen).
  m_gashub: { art: "menge", wert: 47.5, schritt: 0.5, form: { art: "straenge", strang: 15.75, min: -2, max: 2 }, sicherheit: "prüfen" },
  // LNG-Langzeitverträge: rund 9,7 Mrd. m³ je Jahr (abgeleitet: Algerien 4,4 + Nigeria 1,3 + Mercuria/USA 4,0 ab 2026; dazu befristete Verträge 2026–28)
  // Quelle: RECHERCHE_ENERGIE.md Abschnitt 2.2 (Turkish Minute 24.09.2025 und 04.12.2025; AIIB-Projektunterlage), 2025
  //   https://www.turkishminute.com/
  m_lng_vertraege: { art: "menge", wert: 9.7, schritt: 0.5, sicherheit: "prüfen" },
  // FSRU- und Regasifizierungs-Ausbau: rund 161 Mio. m³ je Tag (5 Anlagen: 2 an Land, 3 FSRU; Atlantic Council: ~150)
  // Quelle: RECHERCHE_ENERGIE.md Abschnitt 2.3 (Bayraktar via Turkish Minute, 04.12.2025; BOTAŞ GM Fidan 06.12.2025), Dez. 2025
  //   https://www.turkishminute.com/
  m_regas_ausbau: { art: "menge", wert: 161, schritt: 5, sicherheit: "prüfen" },
  // Gasspeicher-Ausbau: 6,3 Mrd. m³ (Silivri 4,6 + Tuz Gölü; Nov. 2025); Ziel 14,4 Mrd. m³ bis 2028
  // Quelle: RECHERCHE_ENERGIE.md Abschnitt 2.6 (Bayraktar via X, 11/2025; Hürriyet Daily News 10.09.2025), Nov. 2025
  //   https://www.hurriyetdailynews.com/
  m_gasspeicher: { art: "menge", wert: 6.3, schritt: 0.1, sicherheit: "prüfen" },
  // Stromnetzausbau: rund 72 Mrd. Lira je Jahr (abgeleitet: TEİAŞ-Investitionsprogramm 362 Mrd. Lira für 2024–2028)
  // Quelle: RECHERCHE_ENERGIE.md Abschnitt 1.5 (TEİAŞ-Strategieplan nach Grokipedia, 13.03.2026, Vorbehalt), 2026
  //   https://www.teias.gov.tr/
  m_netzausbau: { art: "menge", wert: 72, schritt: 1, sicherheit: "prüfen" },
  // Netzmodernisierung und Speicher: 208 MW (Speicher-Wind-/Solarprojekte in Betrieb, Feb. 2026); 2026 erwartet +1.500–2.000 MW; 33 GW in Vorbereitung
  // Quelle: Ember: Türkiye Elektrik Görünümü 2026 – Depolama, 2026
  //   https://ember-energy.org/tr/analizler/turkiye-elektrik-gorunumu-2026/depolama
  m_speicher_smartgrid: { art: "menge", wert: 208, schritt: 10, sicherheit: "belegt" },
  // Agrarsubventionen: 167,6 Mrd. Lira (2026; 2,9 Mio. geförderte Landwirte; 1. Halbjahr 2026 ausgezahlt 106,0 Mrd.)
  // Quelle: Tarım ve Orman Bakanlığı: 2026 Yılı Bütçesi TBMM Plan ve Bütçe Komisyonunda Kabul Edildi; dazu Alomaliye 12.08.2026, Nov. 2025 / Aug. 2026
  //   https://www.tarimorman.gov.tr/SGB/Haber/196/2026-Yili-Butcesi-Tbmm-Plan-Ve-Butce-Komisyonunda-Kabul-Edildi
  m_agrarsubventionen: { art: "menge", wert: 167.6, schritt: 1, sicherheit: "belegt" },
  // Moderne Bewässerung: 17,5 % (2023; 2018: 17,4 %); Rohrleitungsnetze insgesamt 33,7 % (2023)
  // Quelle: DSİ Haber Bülteni Aralık 2024, Dez. 2024
  //   https://cdniys.tarimorman.gov.tr/api/File/GetGaleriFile/425/DosyaGaleri/8848/haber_bulteni_aralik_2024.docx
  m_bewaesserung: { art: "menge", wert: 17.5, schritt: 0.1, form: { art: "anteil" }, sicherheit: "prüfen" },
  // Staudämme und Speicher: 512 Mio. m³ (Plan 2025: 52 neue Talsperren und Teiche); Gesamtspeicher rund 183 Mrd. m³ (Jan. 2024)
  // Quelle: Bengütürk: Bakan Yumaklı – 2025'te 52 yeni baraj ve gölet inşa ederek 512 milyon metreküp suyu depolayacağız, Jan. 2025
  //   https://www.benguturk.com/ekonomi/bakan-yumakli-2025te-52-yeni-baraj-ve-golet-insa-ederek-512-milyon-metrekup-175128h
  m_staudaemme: { art: "menge", wert: 512, schritt: 10, sicherheit: "prüfen" },
  // Wasserleitungen und Kläranlagen: 76,9 % (2024); Kanalnetz 92,8 %, Trinkwassernetz 98,8 %; Leitungsverluste 47,9 % (2023)
  // Quelle: Alomaliye: Su ve Atıksu İstatistikleri – 2024 (TÜİK-Meldung), 09.12.2025
  //   https://www.alomaliye.com/2025/12/09/su-ve-atiksu-istatistikleri-2024/
  m_wasserleitungen: { art: "menge", wert: 76.9, schritt: 0.1, form: { art: "anteil" }, sicherheit: "belegt" },
  // Saatgut- und Erzeugerprogramme: Lücke
  // Quelle: Tarım ve Orman Bakanlığı, BÜGEM Tohumculuk İstatistikleri, –
  //   https://www.tarimorman.gov.tr/BUGEM
  // Lücke. Hinweis der Recherche: Suchhinweis: BÜGEM 'sertifikalı tohum üretimi ve kullanımı' Jahrestabelle; TÜRKTOB Jahresbericht 2025. Doppelt mit m_agrarforschung.
  m_saatgut: { art: "luecke" },
  // Landwirtschaftliche Mechanisierung: 2.315.504 Traktoren (Ende 2025); 2.321.253 (Ende März 2026)
  // Quelle: Türkiye Gazetesi: 78 ilde arttı, 3 ilde azaldı – traktör sayısı (TÜİK Motorlu Kara Taşıtları), 2026
  //   https://www.turkiyegazetesi.com.tr/ekonomi/78-ilde-artti-3-ilde-azaldi-tarimin-lokomotif-sehirlerine-sel-darbesi-traktor-sayisi-1785088
  m_mechanisierung: { art: "menge", wert: 2_315_504, schritt: 1000, sicherheit: "prüfen" },
  // Agrarforschung und Hochtechnologie: Lücke (TAGEM mit 49 Instituten; Betrag 2026 nicht gefunden)
  // Quelle: Para Dergi: Tarımsal Ar-Ge'nin kalbi TAGEM'de atıyor, 25.08.2025
  //   https://www.paradergi.com.tr/sektorler/2025/08/25/tarimsal-ar-genin-kalbi-tagemde-atiyor
  // Lücke. Hinweis der Recherche: Suchhinweis: 2026 Merkezi Yönetim Bütçe Kanunu, Cetvel A, Tarım ve Orman Bakanlığı – Programm 'Tarımsal Araştırma'; TAGEM 2026 Performans Programı.
  m_agrarforschung: { art: "luecke" },
  // Industrieller Wohnungsbau: Lücke
  // Quelle: Ekonomi Gazetesi: Prefabrik Yapı A.Ş. 36'ncı yılını kutluyor (Branchenstimme), –
  //   https://www.ekonomigazetesi.com/sirket-haberleri/prefabrik-yapi-as-36nci-yilini-kutluyor-53618
  // Lücke. Hinweis der Recherche: Keine amtliche Statistik zu Fertigteilwohnungen gefunden. Suchhinweis: TÜİK Yapı İzin İstatistikleri nach 'taşıyıcı sistem' (prefabrik/çelik), Türkiye Prefabrik Birliği Jahresbericht.
  m_bauindustrie: { art: "luecke" },
  // Staatlicher Wohnungsbau: 83.503 Sozialwohnungen fertig (Programm '250.000 Sozialwohnungen', Stand 10.10.2026); im Erdbebengebiet 455.357 Einheiten bis 27.12.2025 übergeben
  // Quelle: Yeni Asır: TOKİ 83 bin 503 sosyal konutun inşasını tamamladı, 10.10.2026
  //   https://yeniasir.com.tr/ekonomi/2026/10/10/toki-83-bin-503-sosyal-konutun-insasini-tamamladi
  m_sozialwohnungen: { art: "menge", wert: 83_503, schritt: 1000, sicherheit: "prüfen" },
  // Erdbebensichere Stadterneuerung: rund 197.000 je Jahr (abgeleitet: 2.761.000 Einheiten seit 2012 im Programm, 14 Jahre); Regierungsziel 300.000 je Jahr
  // Quelle: Alomaliye: İstanbul'da dönüşüm 1 milyonu aştı, 17.08.2026
  //   https://www.alomaliye.com/2026/08/17/istanbulda-donusum-1-milyonu-asti/
  m_stadterneuerung: { art: "menge", wert: 197_000, schritt: 5000, sicherheit: "prüfen" },
  // Gebäude-Verstärkungsprogramm: 875.000 Lira Zuschuss je Wohnung (dazu 875.000 Lira Kredit und 125.000 Lira Umzugshilfe; Programm 'Yarısı Bizden', Istanbul, bis 31.12.2027)
  // Quelle: Alomaliye: İstanbul'da Yarısı Bizden desteği 2027'ye uzatıldı, 20.10.2026
  //   https://www.alomaliye.com/2026/10/20/istanbulda-yarisi-bizden-destegi-2027ye-uzatildi/
  m_gebaeudeverstaerkung: { art: "menge", wert: 875_000, schritt: 5000, sicherheit: "prüfen" },
  // Katastrophen-Pflichtversicherung: 58 % (11.628.088 von 20.032.000 Wohnungen; 2020: 53,8 %)
  // Quelle: Capital: DASK'lı konut sayısı arttı ancak 8,4 milyon konut hâlâ sigortasız, 2026
  //   https://www.capital.com.tr/finans/sigorta/daskli-konut-sayisi-artti-ancak-84-milyon-konut-hala-sigortasiz
  m_versicherungspflicht: { art: "menge", wert: 58, schritt: 1, form: { art: "anteil" }, sicherheit: "prüfen" },
  // Günstige Baukredite: Zustand: keine breite staatliche Zinsverbilligung; Marktzins ~3,5 % je Monat (Ø 30.10.2026); Programm 'İlk Evim' (1,20 % je Monat, 180 Monate) angekündigt, nicht gestartet (Stand April 2026)
  // Quelle: Hesapkurdu: Konut kredisi faiz oranları (Stand 30.10.2026); dazu Milliyet Uzmanpara 30.04.2026 zu 'İlk Evim', Okt. 2026
  //   https://www.hesapkurdu.com/konut-kredisi
  m_baukredite: { art: "zustand", stufen: [10, 35, 65, 90], sicherheit: "prüfen" },
  // Frühwarnsystem: Zustand: Unwetterwarnungen auf Handys (AFAD 'Hayati Uyarı', nicht bei allen Netzbetreibern); Erdbebenwarnung nur privat (Android) und regional (Izmir, 12 Messpunkte); landesweites System mit ASELSAN vertraglich in Entwicklung
  // Quelle: ShiftDelete: AFAD ve ASELSAN – Ulusal Erken Uyarı Sistemi (Sirenen und Architektur), 2025/2026
  //   https://shiftdelete.net/?p=240964
  m_fruehwarnsystem: { art: "zustand", stufen: [5, 25, 60, 90], sicherheit: "prüfen" },
  // Ausbau der Katastrophenbehörde (AFAD): 8.541 Beschäftigte, davon 3.529 Such- und Rettungskräfte (Datum der Meldung unklar, 2025); 1,6 Mio. Freiwillige
  // Quelle: Yeni Şafak: AFAD gönüllü ordusu 1,6 milyonu aştı, 2025
  //   https://www.yenisafak.com/gundem/afad-gonullu-ordusu-16-milyonu-asti-4749031
  m_afad_ausbau: { art: "menge", wert: 8541, schritt: 100, sicherheit: "prüfen" },
  // Polizei und Gendarmerie: rund 350.000 Beschäftigte der Polizei (EGM, alle Laufbahnen); Gendarmerie: Lücke; Personalausgaben 2026: Polizei 412,3 Mrd., Gendarmerie 287,1 Mrd. Lira (Entwurf)
  // Quelle: TRT Haber: Emniyet Genel Müdürlüğü başkanlık oluyor, 2026
  //   https://www.trthaber.com/haber/gundem/emniyet-genel-mudurlugu-baskanlik-oluyor-929068.html
  m_polizei: { art: "menge", wert: 350_000, schritt: 1000, sicherheit: "prüfen" },
  // Moderne Sicherheitsverwaltung: Lücke
  // Quelle: EGM 2025 Performans Programı, 2025
  //   https://www.egm.gov.tr/kurumlar/egm.gov.tr/IcSite/strateji/MaliDurum/2025_Performans_Programi.pdf
  // Lücke. Hinweis der Recherche: Suchhinweis: EGM Performans Programı 2026, Programm 'Kamu Düzeni ve Güvenliği', Ausgaben für Bilgi Teknolojileri und Kriminal Polis Laboratuvarları. Doppelt mit m_polizei (B-6).
  m_polizeitechnik: { art: "luecke" },
  // Verteidigungsausgaben: 2,33 % des BIP (NATO-Schätzung 2025; SIPRI: 1,9 % bzw. 30,0 Mrd. Dollar); Haushalt 2026: 1.202 Mrd. Lira für Verteidigung und Sicherheit, Ministerium 822,9 Mrd.
  // Quelle: Daily Sabah: NATO defense spending – how allies stand ahead of key Ankara summit, 2026
  //   https://www.dailysabah.com/business/defense/nato-defense-spending-how-allies-stand-ahead-of-key-ankara-summit/amp
  m_verteidigung: { art: "menge", wert: 2.33, schritt: 0.01, sicherheit: "prüfen" },
  // Heimische Rüstungsindustrie: 10,05 Mrd. Dollar (2025; 2024: 7,15 Mrd.); neue Verträge 2025: 17,8 Mrd. Dollar
  // Quelle: Borsa Gündem: Savunma ve havacılık ihracatı 10 milyar dolar eşiğini aştı (SSB-Präsident Görgün), Jan. 2026
  //   https://www.borsagundem.com.tr/savunma-ve-havacilik-ihracati-10-milyar-dolar-esigini-asti
  m_ruestungsindustrie: { art: "menge", wert: 10.05, schritt: 0.1, sicherheit: "belegt" },
  // Ausbildung und Übungen: Lücke (nicht öffentlich)
  // Quelle: NATO-Richtwert (nicht türkische Angabe), –
  //   https://www.nato.int/
  // Lücke. Hinweis der Recherche: Türkische Flugstunden sind nicht veröffentlicht. Ehrlicher: benannte Zustände (Mindestbetrieb / wie heute: jährliche Großmanöver wie EFES und Denizkurdu / NATO-Standard / Kriegsbereitschaft). Suchhinweis: MSB Faaliyet Raporu, Tatbikat-Kalender.
  m_uebungen: { art: "luecke" },
  // Budget der Religionsbehörde: 174,389 Mrd. Lira (Haushalt 2026; davon Personal 148,8 Mrd.)
  // Quelle: Diken: 2026 bütçesi – Diyanet'e 174 milyar lira, MİT'e 39 milyar lira ayrıldı, Okt. 2025
  //   https://www.diken.com.tr/?p=1662584
  m_religionsbehoerde: { art: "menge", wert: 174.389, schritt: 1, sicherheit: "belegt" },
  // Richter- und Staatsanwaltsstellen: rund 31 je 100.000 (abgeleitet: 26.642 Richter und Staatsanwälte am 23.09.2026, davon 18.167 Richter, ÷ 86,09 Mio. Einwohner); nur Richter ≈ 21
  // Quelle: Haberhürriyeti: Bir hâkim ortalama 800 davaya bakıyor (dazu Suchauszug mit Stand 23.09.2026), 2026
  //   https://www.haberhurriyeti.com/haber/27185619/bir-hakim-ortalama-800-davaya-bakiyor-karar-bekleyen-12-milyon-dosya-var
  m_richterstellen: { art: "menge", wert: 31, schritt: 1, sicherheit: "prüfen" },
  // Haftvermeidung und Bewährung: 15,0 % (65.227 von 433.520 Gefangenen, 03.08.2026; 402 Anstalten für 304.956 Plätze)
  // Quelle: İstiklal: Adalet Bakanlığı verileri – Cezaevlerinde 433 bin 520 kişi bulunuyor (CTE 03.08.2026), Aug. 2026
  //   https://www.istiklal.com.tr/genel/adalet-bakanligi-verileri-cezaevlerinde-433-bin-520-kisi-bulunuyor-1101767h
  // Umgekehrt: mehr Haftvermeidung heißt weniger U-Haft. Anteil = Start × Startpegel ÷ Stufe (Regler 150 % ergibt 10,0 %), höchstens das Doppelte des Startanteils (Spielparameter).
  m_haftvermeidung: { art: "menge", wert: 15, schritt: 0.1, form: { art: "umgekehrt" }, sicherheit: "belegt" },
  // Denkmalschutz und Restaurierung: rund 100 je Jahr (abgeleitet: 201 Baudenkmäler in zwei Jahren laut Minister); 2025 davon 73 im Erdbebengebiet
  // Quelle: Ensonhaber: Mehmet Nuri Ersoy – Son 2 yılda 201 vakıf eserinin restorasyonu tamamlandı, 2025
  //   https://www.ensonhaber.com/gundem/mehmet-nuri-ersoy-son-2-yilda-201-vakif-eserinin-restorasyonu-tamamlandi
  m_denkmalschutz: { art: "menge", wert: 100, schritt: 5, sicherheit: "prüfen" },
  // Kunst- und Kulturförderung: rund 414 Mio. Lira (Film 316,7 Mio. 2025 + private Theater 97,2 Mio. Saison 2025/26)
  // Quelle: DHA: Bakan Ersoy – 2025'te sinema alanında 316,6 milyon TL destek sağladık; dazu Türkgün zu 97,216 Mio. Theaterförderung, Jan. 2026
  //   https://www.dha.com.tr/kultur-sanat/bakan-ersoy-2025te-sinema-alaninda-316-6-milyon-tl-destek-sagladik-2787672
  m_kulturfoerderung: { art: "menge", wert: 414, schritt: 5, sicherheit: "prüfen" },
  // Ausgrabungen und Museen: rund 780 (2025, Ministerangabe; 776 laut Habertürk)
  // Quelle: NTV: Bakan Ersoy TBMM'de 2026 bütçesini anlattı, Nov. 2025
  //   https://www.ntv.com.tr/ntvpara/bakan-ersoy-tbmmde-2026-butcesini-anlatti-1696503
  m_archaeologie: { art: "menge", wert: 780, schritt: 10, sicherheit: "prüfen" },
};

const amStart = (w: number, start: number): boolean => Math.abs(w - start) < 0.5;

/** Nachkommastellen einer Zahl (höchstens vier) */
function stellen(x: number): number {
  if (Number.isInteger(x)) return 0;
  const s = x.toFixed(4).replace(/0+$/, "");
  return s.length - s.indexOf(".") - 1;
}

/** Rundet auf ein Vielfaches des Schritts, ohne Gleitkommareste */
function runde(x: number, schritt: number): number {
  return Number((Math.round(x / schritt) * schritt).toFixed(stellen(schritt)));
}

/** Die Größe einer Mengen-Maßnahme bei Stufe w in ihrer Einheit (ungerundet) */
export function groesse(e: Menge, w: number, start: number): number {
  if (amStart(w, start)) return e.wert;
  const f = e.form ?? { art: "linear" };
  switch (f.art) {
    case "anteil":
      return w <= start ? (e.wert * w) / start : e.wert + ((100 - e.wert) * (w - start)) / (100 - start);
    case "umgekehrt":
      return (e.wert * start) / Math.max(w, start / 2);
    case "straenge": {
      const n = Math.max(f.min, Math.min(f.max, Math.round(((e.wert * w) / start - e.wert) / f.strang)));
      return e.wert + n * f.strang;
    }
    default: {
      const x = (e.wert * w) / start;
      return f.max !== undefined ? Math.min(f.max, x) : x;
    }
  }
}

/** Zahl in der Sprache; große Beträge mit Nachkomma stets mit zwei Stellen („28.075,50“, aber „201,6“) */
function zahlText(v: number): string {
  let d = Math.min(2, stellen(v));
  if (d === 1 && v >= 1000) d = 2;
  return zahl(v, d);
}

/** Verhältnis zu 2026 in Worten, für Maßnahmen ohne belastbare Startgröße */
function verhaeltnis(id: string, r: number): string {
  const g = t(`n9.g.${id}`);
  if (r < 0.005) return t("n9.rel.null", { g });
  if (Math.abs(r - 1) < 0.005) return t("n9.rel.gleich", { g });
  if (Math.abs(r - 0.5) < 0.005) return t("n9.rel.halb", { g });
  if (Math.abs(r - 2) < 0.005) return t("n9.rel.doppelt", { g });
  return t(r > 1 ? "n9.rel.mehr" : "n9.rel.weniger", { g, p: zahl(Math.round(Math.abs(r - 1) * 100)) });
}

/** Die benannten Zustände einer Maßnahme, die keine Menge ist (sonst undefined) */
export function zustandsStufen(id: string): { w: number; name: string }[] | undefined {
  const e = EINHEITEN[id];
  if (e?.art !== "zustand") return undefined;
  return e.stufen.map((w) => ({ w, name: t(`n9.z.${id}.${w}`) }));
}

/**
 * Die Stufe w einer Maßnahme in ihrer echten Einheit, als benannter Zustand oder als Verhältnis zu 2026.
 * undefined, wenn für die Maßnahme keine Einheit hinterlegt ist (dann gilt die alte Darstellung in data/skalen.ts).
 */
export function einheitText(id: string, w: number, start: number): string | undefined {
  const e = EINHEITEN[id];
  if (!e || start <= 0) return undefined;
  if (e.art === "zustand") {
    let beste = e.stufen[0]!;
    for (const s of e.stufen) if (Math.abs(s - w) < Math.abs(beste - w)) beste = s;
    return t(`n9.z.${id}.${beste}`);
  }
  if (e.art === "luecke") return verhaeltnis(id, amStart(w, start) ? 1 : e.umgekehrt ? start / Math.max(w, start / 2) : w / start);
  const roh = groesse(e, w, start);
  const v = amStart(w, start) || e.form?.art === "straenge" ? roh : runde(roh, e.schritt);
  return t(`n9.e.${id}`, { x: zahlText(v) });
}
