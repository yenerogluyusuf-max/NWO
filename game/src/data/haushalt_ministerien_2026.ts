// Haushalt 2026 nach Einrichtungen (kurumsal sınıflandırma): die 17 Ministerien, das Präsidialamt und ausgewählte Behörden.
// Milliarden Lira. Arbeitspaket 2 aus PLAN_OBERFLAECHE_DETAIL_2026-11-05.md (Q1). Recherchenotiz: RECHERCHE_HAUSHALT_MINISTERIEN_2026.md.
// Noch nirgends importiert; Einbau erst in AP 3/AP 11.
//
// Stand der Recherche: 05.11.2026 (Abrufdatum aller Quellen).
//
// WICHTIG ZUR QUALITÄT DER BELEGE
// - Die amtlichen Tabellen selbst (Cetvel A/B/C des Gesetzes Nr. 7567, Resmî Gazete 31.12.2025 Nr. 33124 (1. Mükerrer); die SBB-Tabelle
//   „2026 Yılı Genel Bütçeli İdareler Ekonomik Kod İcmali“) konnten in dieser Sitzung NICHT geöffnet werden: resmigazete.gov.tr, sbb.gov.tr,
//   tbmm.gov.tr, hmb.gov.tr und auch Presseseiten waren aus der Sitzung gesperrt (Netzrichtlinie). Alle Werte stammen aus Such-Auszügen
//   der genannten Seiten. Jede Zahl ist deshalb vor dem Einbau an Cetvel A bzw. am Ekonomik Kod İcmali zu prüfen.
// - Jeder Beleg beginnt mit einem Kürzel:
//     [Gesetz]    Betrag laut Haushaltsgesetz bzw. „kabul edildi“/„başlangıç ödeneği“ (beschlossener Stand)
//     [Entwurf]   Betrag aus dem Gesetzentwurf (Teklif, Oktober/November 2025). Die Kommission hat danach nur den Etat des
//                 Finanzministeriums geändert (+50 Mrd. Lira, TBMM 01.12.2025); für die übrigen Einrichtungen ist Entwurf = Gesetz
//                 wahrscheinlich, aber nicht geprüft.
//     amtlich     Quelle ist eine Behörde oder die TBMM selbst (Ministeriumsbericht, TBMM-Meldung, Rede im Plan- und Haushaltsausschuss)
//     Presse      Quelle ist eine Zeitung oder Agentur (meist Auswertung der Anadolu Ajansı)
//   und nennt den UMFANG (nur Zentralorganisation oder mit nachgeordneten Behörden). Die Umfänge sind NICHT einheitlich, die Werte also
//   nicht ohne Weiteres addierbar (siehe Summenabgleich in der Recherchenotiz).
//
// AUFTEILUNG NACH AUSGABEARTEN
// - Belegt ist fast nur das Personal (01 Personel giderleri) aus der AA-Auswertung des Entwurfs. Sozialbeiträge (02), Sachausgaben (03),
//   laufende Transfers (05), Investitionen (06) und Kapitaltransfers (07) je Einrichtung sind LÜCKE für alle Einträge. Quelle, die sie
//   enthält: SBB, „2026 Yılı Genel Bütçeli İdareler Ekonomik Kod İcmali ile 2027-2028 Gider Tahminleri“,
//   https://www.sbb.gov.tr/wp-content/uploads/2025/12/2a-2026-Yili-Genel-Butceli-Idareler-Ekonomik-Kod-Icmali-ile-2027-2028-Gider-Tahminleri.pdf
//   (Spalten: Personel giderleri, Sos. Güv. Dev. Primi, Mal ve hizmet alımları, Faiz, Cari transferler, Sermaye giderleri,
//   Sermaye transferleri, Borç verme, Yedek ödenekler) – in der nächsten Sitzung mit freigegebenem Netz übernehmen.
//
// QUELLEN (alle abgerufen 05.11.2026, als Such-Auszug)
//  Q1  Gesetz Nr. 7567, Art. 1 (Ödenekler), Resmî Gazete 31.12.2025 Nr. 33124 (1. Mükerrer), Fassung auf sbb.gov.tr:
//      https://www.sbb.gov.tr/wp-content/uploads/2025/12/1-2026-Yili-Merkezi-Yonetim-Butce-Kanunu.pdf
//  Q2  TBMM-Meldung „Plan ve Bütçe Komisyonunda 2026 Yılı Merkezi Yönetim Bütçe Kanunu Teklifi kabul edildi“ (+50 Mrd. an HMB):
//      https://www.tbmm.gov.tr/Haber/Detay?Id=5e8513f3-91b1-46ba-97b9-019adc662f36
//  Q3  TBMM-Meldungen zu den Ressortberatungen im Plan- und Haushaltsausschuss (Haber/Detay, je Ministerium, URL beim Eintrag)
//  Q4  Cevdet Yılmaz, Haushaltsrede 2026 vor dem Ausschuss (SBB-PDF):
//      https://www.sbb.gov.tr/wp-content/uploads/2025/10/Cumhurbaskani-Yardimcisi-Sayin-Cevdet-Yilmazin-2026-Yili-Butce-Sunus-Konusmasi.pdf
//  Q5  TBMM-Meldung „Cumhurbaşkanlığının 2026 yılı bütçesi TBMM Plan ve Bütçe Komisyonunda“ (Präsidialamt, MİT, İletişim, SSB):
//      https://www.tbmm.gov.tr/Haber/Detay?Id=f056d09b-cad9-4605-91c7-019ad98d7694
//  Q6  AA-Auswertung Personalausgaben je Einrichtung (Entwurf), u. a. CNN Türk:
//      https://www.cnnturk.com/ekonomi/2026-butcesinde-kamu-personeline-4-9-trilyon-tl-en-buyuk-pay-milli-egitime-2348924
//      und Karşı Medya: https://karsimedya.com/2026-yilinda-kamuda-hangi-kurumlar-ne-kadar-personel-demesi-alacak-h5759.html
//  Q7  Yeni Ankara, „Hangi kuruma ne kadar bütçe ayrıldı? 2026’nın en yüksek ödenekli kurumları“:
//      https://www.yeniankara.com.tr/guncel/hangi-kuruma-ne-kadar-butce-ayrildi-2026nin-en-yuksek-odenekli-kurumlari-182977
//  Q8  MEB Strateji Geliştirme, Statistik 2026, Tabelle 7.2 (Haushalt MEB nach ökonomischer Gliederung):
//      https://sgb.meb.gov.tr/istatistik_2026/70.pdf
//  Q9  SBB, „2026 Yılı Kamu Yatırım Programı yayımlandı“: https://www.sbb.gov.tr/2026-yili-kamu-yatirim-programi-yayimlandi/
//  Weitere Einzelquellen stehen beim jeweiligen Eintrag.

export interface MinisteriumHaushalt {
  /** id nach Q1 in PLAN_OBERFLAECHE_DETAIL_2026-11-05.md bzw. eigene id für Behörden */
  id: string;
  name: string;
  /** Gesamtausgaben (Ödenek) in Mrd. Lira; Umfang steht im Beleg */
  gesamtMrd: number;
  /** 01 Personel giderleri */
  personalMrd?: number;
  /** 02 Sosyal güvenlik kurumlarına devlet primi giderleri */
  sozialbeitraegeMrd?: number;
  /** 03 Mal ve hizmet alım giderleri */
  sachMrd?: number;
  /** 05 Cari transferler */
  transferMrd?: number;
  /** 06 Sermaye giderleri */
  investitionMrd?: number;
  /** 07 Sermaye transferleri */
  kapitaltransferMrd?: number;
  beleg: string;
}

const LUECKE_ARTEN = "Ausgabearten 02/03/05/06/07: Lücke (SBB Ekonomik Kod İcmali 2026 nicht geöffnet)";
const LUECKE_ARTEN_MIT_PERSONAL = "Ausgabearten 01/02/03/05/06/07: Lücke (SBB Ekonomik Kod İcmali 2026 nicht geöffnet)";

export const MINISTERIEN_HAUSHALT_2026: MinisteriumHaushalt[] = [
  // 1 Justiz – Umfang: Ministerium (Adalet Bakanlığı). Personal: AA-Auswertung des Entwurfs.
  {
    id: "justiz",
    name: "Justizministerium (Adalet Bakanlığı)",
    gesamtMrd: 389.560,
    personalMrd: 245.799,
    beleg:
      "[Gesetz] amtlich: Adalet Bakanlığı, 2026 Yılı Kurumsal Mali Durum ve Beklentiler Raporu (Juli 2026), für 2026 verfügbare Mittel 389.560.443.000 TL, https://sgb.adalet.gov.tr/Resimler/Dokuman/202607301001260162026%20Y%C4%B1l%C4%B1%20Kurumsal%20Mali%20Durum%20ve%20Beklentiler%20Raporu%20.pdf (ob Anfangsansatz oder inkl. Zuführungen: zu prüfen); Personal [Entwurf] Presse Q6. " +
      LUECKE_ARTEN,
  },
  // 2 Familie und Soziales – Umfang: Ministerium. Darunter Programm „Yoksullukla mücadele ve sosyal yardımlaşma“ 284,470 Mrd.
  {
    id: "familie",
    name: "Ministerium für Familie und Soziales (Aile ve Sosyal Hizmetler Bakanlığı)",
    gesamtMrd: 531.905,
    personalMrd: 73.473,
    beleg:
      "[Entwurf/Gesetz unklar] Presse: Haberhürriyeti, „2026 bütçesinin yüzde 54’ü fakirliğe ayrıldı“, 531.905.396.000 TL, davon Programm Armutsbekämpfung 284.470.466.000 TL, https://www.haberhurriyeti.com/amp/haber/27037236/2026-butcesinin-yuzde-54u-fakirlige-ayrildi ; amtliche Gegenprobe: aile.gov.tr Haushaltsvortrag https://aile.gov.tr/media/257863/2026-butce-sunus.pdf (nicht geöffnet); Personal [Entwurf] Presse Q6. " +
      LUECKE_ARTEN,
  },
  // 3 Arbeit und Sozialversicherung – Umfang: Ministerium laut Ausschussvortrag. Der SGK-Zuschuss (2.329 Mrd., haushaltsplan.ts) liegt
  // überwiegend beim Finanzministerium, nicht hier (zu prüfen).
  {
    id: "arbeit",
    name: "Ministerium für Arbeit und Sozialversicherung (Çalışma ve Sosyal Güvenlik Bakanlığı)",
    gesamtMrd: 447.903,
    beleg:
      "[Entwurf] amtlich: TBMM-Meldung zur Ausschussberatung, „toplam bütçe teklifi 447.903.261 bin TL“, https://www.tbmm.gov.tr/Haber/Detay?Id=a12c2276-0686-4efc-91fc-019a724f17b7 ; Gliederung amtlich vorhanden, nicht geöffnet: https://www.csgb.gov.tr/Media/3lslklov/10-b%C3%BCt%C3%A7e-giderleri-ve-%C3%B6denekler-tablosu.pdf . " +
      LUECKE_ARTEN_MIT_PERSONAL,
  },
  // 4 Umwelt, Städtebau und Klima – Umfang: nur Ministerium. Daneben (nachgeordnet, eigene Etats): Kentsel Dönüşüm Başkanlığı 111,125 Mrd.,
  // Tapu ve Kadastro GM 15,962 Mrd. (gleiche Quelle). TOKİ steht nicht im Zentralhaushalt (siehe Recherchenotiz).
  {
    id: "umwelt",
    name: "Ministerium für Umwelt, Städtebau und Klimawandel (Çevre, Şehircilik ve İklim Değişikliği Bakanlığı)",
    gesamtMrd: 275.011,
    beleg:
      "[Entwurf] Presse über Ausschussrede des Abg. Baki Ersoy (MHP): Ministerium 275.011 Mio. TL, Kentsel Dönüşüm Başkanlığı 111.125 Mio., TKGM 15.962 Mio., Türkgün https://www.turkgun.com/siyaset/kayseriye-dev-yatirim-mujdesi-mhpli-baki-ersoy-detaylari-acikladi/342272 . " +
      LUECKE_ARTEN_MIT_PERSONAL,
  },
  // 5 Äußeres – Umfang: Ministerium.
  {
    id: "aussen",
    name: "Außenministerium (Dışişleri Bakanlığı)",
    gesamtMrd: 46.8,
    beleg:
      "[Entwurf] Presse (DHA) über Ausschussvortrag Hakan Fidan 18.11.2025: 46,8 Mrd. TL (2025: 39 Mrd.), TimeTürk https://www.timeturk.com/gundem/bakan-fidan-plan-ve-butce-komisyonunda-konustu-haber-1824813 ; genauer Betrag: Lücke. " +
      LUECKE_ARTEN_MIT_PERSONAL,
  },
  // 6 Energie – Umfang: nur Zentralorganisation (Merkez Teşkilatı). Mit MTA (10,302) und MAPEG (2,598) 48,997 Mrd.; mit TENMAK, EPDK und NDK
  // laut Ministervortrag 58,4 Mrd. Die Energiestützung von 400 Mrd. (Strom-/Gaszuschüsse) liegt NICHT in diesem Etat (Ort: Lücke).
  {
    id: "energie",
    name: "Ministerium für Energie und Rohstoffe (Enerji ve Tabii Kaynaklar Bakanlığı)",
    gesamtMrd: 36.098,
    beleg:
      "[Entwurf] Presse (AA Enerji Terminali): Ministerium 36.097,8 Mio. TL, MTA 10.301,5 Mio., MAPEG 2.597,9 Mio., zusammen 48.997,2 Mio., https://www.aa.com.tr/tr/enerjiterminali/genel/turkiye-enerji-verimliligi-ve-kaynak-aramasina-2026-icin-49-milyar-liralik-butce-ayirdi/52406 . " +
      LUECKE_ARTEN_MIT_PERSONAL,
  },
  // 7 Jugend und Sport – Umfang laut TBMM: Ministerium (enthält vermutlich Stipendien und Kredite für Studierende, KYK; zu prüfen).
  {
    id: "jugend",
    name: "Ministerium für Jugend und Sport (Gençlik ve Spor Bakanlığı)",
    gesamtMrd: 300.302,
    beleg:
      "[Entwurf] amtlich: TBMM-Meldung zur Ausschussberatung, 300.302.192 bin TL, https://tbmm.gov.tr/Haber/Detay?Id=83c6d390-1757-4866-8172-019a7c3b682d . " +
      LUECKE_ARTEN_MIT_PERSONAL,
  },
  // 8 Finanzen – Umfang: Ministerium; enthält die Zinsen (rund 2,74 Bio., „faiz hariç 6,1 Bio.“), Zuschüsse an die Sozialversicherung und
  // die Haushaltszuschüsse (Hazine yardımı) an Einrichtungen mit Sonderhaushalt. Ob 8.840,3 vor oder nach den +50 Mrd. der Kommission
  // gilt: Lücke.
  {
    id: "finanzen",
    name: "Ministerium für Finanzen und Schatz (Hazine ve Maliye Bakanlığı)",
    gesamtMrd: 8840.323,
    beleg:
      "[Entwurf] amtlich: TBMM-Meldung zur Ausschussberatung, „toplam 8,84 trilyon, faiz hariç 6,1 trilyon“, https://www.tbmm.gov.tr/Haber/Detay?Id=8bee1616-61e9-4e32-bd51-019a583dee98 ; genauer Betrag 8.840.323 Mio. TL Presse Q7; Kommission +50 Mrd. für HMB (Q2), Endstand nicht geprüft. " +
      LUECKE_ARTEN_MIT_PERSONAL,
  },
  // 9 Inneres – Umfang: Ministerium MIT nachgeordneten Behörden (91,91 % des Betrags; Emniyet, Jandarma, Sahil Güvenlik, Göç İdaresi,
  // vermutlich AFAD). Personal der Zentralorganisation allein 70,142 Mrd.; Emniyet GM 412,250, Jandarma GK 287,090 (Q6). Weil der
  // Gesamtbetrag die Behörden einschließt, steht hier kein Personalwert (Sahil Güvenlik, Göç, AFAD: Lücke).
  {
    id: "inneres",
    name: "Innenministerium mit nachgeordneten Behörden (İçişleri Bakanlığı)",
    gesamtMrd: 1476.729,
    beleg:
      "[Entwurf] amtlich: TBMM-Meldung zur Ausschussberatung, „toplam ödenek teklifleri 1.476.729.363 bin TL“, 91,91 % bei bağlı kuruluşlar, https://tbmm.gov.tr/Haber/Detay?Id=088c0de9-e288-4f7d-a6d4-019a9178004f . " +
      LUECKE_ARTEN_MIT_PERSONAL,
  },
  // 10 Kultur und Tourismus – Umfang: mit nachgeordneten und verbundenen Einrichtungen.
  {
    id: "kultur",
    name: "Ministerium für Kultur und Tourismus mit nachgeordneten Einrichtungen (Kültür ve Turizm Bakanlığı)",
    gesamtMrd: 69.999818,
    beleg:
      "[Entwurf] amtlich: TBMM-Meldung zur Ausschussberatung, „bağlı ve ilgili kuruluşlarla birlikte 69.999.818 bin TL“, https://www.tbmm.gov.tr/Haber/Detay?Id=9f0646c0-15b6-49ba-b06a-019a81d668d3 . " +
      LUECKE_ARTEN_MIT_PERSONAL,
  },
  // 11 Bildung – Umfang: Ministerium (ohne Hochschulen). Die Debattenzahl 1,944 Bio. ist amtlich bestätigt (MEB-Statistik, 1.943.965.746.000 TL;
  // 2025: 1.451.715.540.000 TL, +33,91 %). Personal 1.435,648 Mrd. nur aus der AA-Auswertung des Entwurfs; an Q8 nicht prüfbar
  // (Tabellenzeilen im Such-Auszug unlesbar).
  {
    id: "bildung",
    name: "Bildungsministerium (Millî Eğitim Bakanlığı)",
    gesamtMrd: 1943.966,
    personalMrd: 1435.648,
    beleg:
      "[Gesetz] amtlich: MEB Strateji Geliştirme, İstatistik 2026, Tabelle 7.2: 1.943.965.746.000 TL, https://sgb.meb.gov.tr/istatistik_2026/70.pdf ; übereinstimmend Yılmaz-Rede (Q4) „1 trilyon 944 milyar“; Personal [Entwurf] Presse Q6 (1.435.648 Mio. TL). " +
      LUECKE_ARTEN,
  },
  // 12 Verteidigung – Umfang: Ministerium. Rüstungsprojekte laufen überwiegend über den Fonds der Verteidigungsindustrie (SSDF), nicht
  // über diesen Etat (Q5). Die Regierung nennt für „Verteidigung“ funktional 1.202 Mrd. (Presse) – anderer Umfang.
  {
    id: "verteidigung",
    name: "Verteidigungsministerium (Millî Savunma Bakanlığı)",
    gesamtMrd: 822.930,
    personalMrd: 395.725,
    beleg:
      "[Gesetz] Presse: „822.930.177 bin TL olarak kabul edildi“, Yeni Ankara Q7; Ausschussberatung 26.11.2025, TBMM-Protokoll https://tbmm.gov.tr/Tutanaklar/TutanakGoster/5308 (nicht geöffnet); Personal [Entwurf] Presse Q6. " +
      LUECKE_ARTEN,
  },
  // 13 Gesundheit – Umfang: Ministerium. Funktional „Gesundheitsdienste“ 1.594 Mrd. (Yılmaz, Q4) – anderer Umfang.
  {
    id: "gesundheit",
    name: "Gesundheitsministerium (Sağlık Bakanlığı)",
    gesamtMrd: 1474.948,
    personalMrd: 863.557,
    beleg:
      "[Entwurf] Presse: bianet, „Sağlık Bakanlığı 2026 yılı bütçe teklifi“, 1.474.947.780 bin TL, https://bianet.org/yazi/saglik-bakanligi-2026-yili-butce-teklifi-312981 ; gleicher Betrag Yeni Ankara Q7; Personal [Entwurf] Presse Q6. " +
      LUECKE_ARTEN,
  },
  // 14 Industrie und Technologie – Umfang: Ministerium (Anfangsansatz). TÜBİTAK, KOSGEB, TÜRKPATENT haben eigene Etats (Lücke).
  {
    id: "industrie",
    name: "Ministerium für Industrie und Technologie (Sanayi ve Teknoloji Bakanlığı)",
    gesamtMrd: 176.967,
    beleg:
      "[Gesetz] Presse: CNBC-e (Bericht zum Entwurf 2027), Anfangsansatz 2026 „176 milyar 966 milyon 775 bin lira“, https://www.cnbce.com/haberler/sanayi-ve-teknoloji-bakanligina-uc-yil-icin-8812-milyar-liralik-kaynak-h40209 ; BirGün nennt abweichend 176.976 Mio. " +
      LUECKE_ARTEN_MIT_PERSONAL,
  },
  // 15 Landwirtschaft und Forst – Umfang: Ministerium; darin Agrarförderung 168 Mrd. Mit DSİ, Forst-GM, Naturschutz-GM u. a.: Minister
  // 938 Mrd. bzw. Opposition 888,2 Mrd. (anderer Umfang, Presse).
  {
    id: "landwirtschaft",
    name: "Ministerium für Landwirtschaft und Forst (Tarım ve Orman Bakanlığı)",
    gesamtMrd: 541.8,
    personalMrd: 72.881,
    beleg:
      "[Entwurf] amtlich: TBMM-Meldung zur Ausschussberatung (Minister Yumaklı: „542 milyar lira“), https://www.tbmm.gov.tr/Haber/Detay?Id=99d302b4-c396-4bc2-9555-019ab5725e1a ; 541,8 Mrd. und Agrarförderung 168 Mrd. Presse (Sözcü https://www.sozcu.com.tr/2026-butcesinde-tarima-168-milyar-lira-kaynak-p249164); Personal [Entwurf] Presse Q6. " +
      LUECKE_ARTEN,
  },
  // 16 Handel – Umfang: Ministerium.
  {
    id: "handel",
    name: "Handelsministerium (Ticaret Bakanlığı)",
    gesamtMrd: 76.251,
    beleg:
      "[Entwurf] amtlich: TBMM-Meldung zur Ausschussberatung, 76.251.159 bin TL, https://www.tbmm.gov.tr/Haber/Detay?Id=44ce051d-c7e2-41da-b1cf-019a537b5e48 . " +
      LUECKE_ARTEN_MIT_PERSONAL,
  },
  // 17 Verkehr und Infrastruktur – Umfang: Ministerium + SHGM + Karayolları GM (Sonderhaushalt) + BTK (Regulierungsbehörde, Cetvel III).
  // Ministerium allein: Lücke. Davon zu trennen: Investitionsvorschlag „fünf Sektoren“ 562,7 Mrd. (siehe INVESTITIONSPROGRAMM_2026).
  {
    id: "verkehr",
    name: "Ministerium für Verkehr und Infrastruktur mit SHGM, KGM und BTK (Ulaştırma ve Altyapı Bakanlığı)",
    gesamtMrd: 605,
    beleg:
      "[Entwurf] Presse über Ausschussvortrag Uraloğlu: „Ulaşıma 605 milyar TL’lik bütçe“ (Ministerium, SHGM, KGM, BTK zusammen), Posta https://www.posta.com.tr/gundem/ulasima-605-milyar-tllik-butce-bakan-uraloglu-2026-demiryolu-yili-olacak-2935631 ; Einzelbeträge: Lücke. " +
      LUECKE_ARTEN_MIT_PERSONAL,
  },
  // Präsidialamt – Umfang: Cumhurbaşkanlığı Genel Sekreterliği (ohne MİT, İletişim, SSB, Diyanet, SBB usw.).
  {
    id: "stab",
    name: "Präsidialamt (Cumhurbaşkanlığı, Generalsekretariat)",
    gesamtMrd: 21.287,
    personalMrd: 4.502,
    beleg:
      "[Entwurf] amtlich: TBMM-Meldung Q5 / Yılmaz im Ausschuss, „Cumhurbaşkanlığı Genel Sekreterliği … 21 milyar 287 milyon lira“, https://www.tbmm.gov.tr/Haber/Detay?Id=f056d09b-cad9-4605-91c7-019ad98d7694 ; Personal 4.502 Mio. Presse: Cumhuriyet https://www.cumhuriyet.com.tr/ekonomi/iktidar-2026-butcesi-ni-tbmm-ye-sundu-butcede-oncelik-yine-saray-ve-diyanet-e-2444677 . " +
      LUECKE_ARTEN,
  },
  // Religionsbehörde – Umfang: Diyanet İşleri Başkanlığı (Präsidialamt zugeordnet).
  {
    id: "diyanet",
    name: "Präsidium für Religionsangelegenheiten (Diyanet İşleri Başkanlığı)",
    gesamtMrd: 174.389,
    personalMrd: 148.8,
    beleg:
      "[Gesetz] Presse: „174.389.341 bin TL olarak kabul edildi“; Diken, „2026 bütçesi: Diyanet’e 174 milyar lira, MİT’e 39 milyar lira ayrıldı“, https://www.diken.com.tr/2026-butcesi-diyanete-174-milyar-lira-mite-39-milyar-lira-ayrildi/ ; Personal [Entwurf] Presse Q6 (148,8 Mrd.). " +
      LUECKE_ARTEN,
  },
  // Nachrichtendienst – Umfang: MİT Başkanlığı (2025: 28,896 Mrd.).
  {
    id: "mit",
    name: "Nationaler Nachrichtendienst (Millî İstihbarat Teşkilatı Başkanlığı)",
    gesamtMrd: 39.496,
    beleg:
      "[Entwurf] amtlich: Yılmaz im Ausschuss (TBMM-Meldung Q5), „MİT Başkanlığı … 39 milyar 496 milyon lira“; Presse Diken (wie diyanet). " +
      LUECKE_ARTEN_MIT_PERSONAL,
  },
  // Kommunikationsdirektion – Umfang: İletişim Başkanlığı (2025: 6,155 Mrd.).
  {
    id: "kommunikation",
    name: "Kommunikationsdirektion (Cumhurbaşkanlığı İletişim Başkanlığı)",
    gesamtMrd: 7.564,
    beleg:
      "[Entwurf] amtlich: Yılmaz im Ausschuss (TBMM-Meldung Q5), „İletişim Başkanlığı … 7 milyar 564 milyon lira“; Presse ANKA https://ankahaber.net/haber/detay/2026_butcesi_plan_ve_butce_komisyonunda_askin_genc_kriz_buyudukce_iletisim_baskanligi_butcesi_de_buyuyor_276915 . " +
      LUECKE_ARTEN_MIT_PERSONAL,
  },
  // Rüstungsbehörde – Umfang: nur der Eigenetat der SSB (2025: 1,138 Mrd.). Die Projekte laufen über den Savunma Sanayii Destekleme Fonu
  // außerhalb des Haushalts (Yılmaz, Q5); dessen Volumen 2026: Lücke.
  {
    id: "ssb",
    name: "Präsidium der Verteidigungsindustrie (Savunma Sanayii Başkanlığı), nur Eigenetat",
    gesamtMrd: 1.547,
    beleg:
      "[Entwurf] amtlich: Yılmaz im Ausschuss (TBMM-Meldung Q5), „Savunma Sanayii Başkanlığı … 1 milyar 547 milyon lira“, mit Hinweis auf Finanzierung der Projekte aus dem Fonds; Presse haberler.com https://www.haberler.com/guncel/2026-butcesi-plan-ve-butce-komisyonu-nda-cevdet-19310294-haberi/ . " +
      LUECKE_ARTEN_MIT_PERSONAL,
  },
  // Katastrophenschutz – Umfang: AFAD (dem Innenministerium nachgeordnet; vermutlich in den 1.476,7 Mrd. von „inneres“ enthalten, also
  // nicht zusätzlich addieren). Erdbebenmittel insgesamt 653 Mrd. (gleiche Quelle; anderer Umfang).
  {
    id: "afad",
    name: "Behörde für Katastrophen- und Notfallmanagement (AFAD)",
    gesamtMrd: 373,
    beleg:
      "[Entwurf] Presse: Medyascope 17.10.2025, „AFAD’a 373 milyar lira“, Erdbebenmittel gesamt 653 Mrd., https://medyascope.tv/2025/10/17/2026-butcesi-mecliste-butce-acigina-denk-faiz-odemesi-35-trilyonluk-vergi-istisnasi-dolayli-vergilerle-butce-geliri/ ; genauer Betrag: Lücke; eine Quelle (Nefes) nennt abweichend 227,951 Mio. (vermutlich Einheitenfehler). " +
      LUECKE_ARTEN_MIT_PERSONAL,
  },
  // Hochschulen – Umfang: alle staatlichen Hochschulen und YÖK (Sonderhaushalte, Cetvel B; überwiegend aus Zuschüssen des Zentralhaushalts
  // finanziert, also nicht einfach zu den Ministerien addieren). 2025: 488,405 Mrd. YÖK allein 2026: Lücke.
  {
    id: "hochschulen",
    name: "Hochschulen gesamt (Yükseköğretim kurumları, mit YÖK)",
    gesamtMrd: 651.020,
    beleg:
      "[Entwurf] amtlich: Yılmaz-Rede Q4 „yükseköğretim kurumlarına 651 milyar lira“; genauer Betrag 651.020 Mio. TL Presse/Gewerkschaft: Eğitim-Sen, Yükseköğretim Yıl Sonu Değerlendirme Raporu 2025–2026, https://egitimsen.org.tr/wp-content/uploads/2026/07/2025-2026-YUKSEKOGRETIM-YIL-SONU-DEGERLENDIRME-RAPORU.docx . " +
      LUECKE_ARTEN_MIT_PERSONAL,
  },
];

/** Rahmen aus Art. 1 des Gesetzes Nr. 7567 (Q1) und dem Ausschussbeschluss (Q2), Mrd. Lira. */
export const HAUSHALT_2026_RAHMEN = {
  /** Cetvel (I): Einrichtungen des allgemeinen Haushalts (Ministerien, Präsidialamt, Diyanet, MİT …), nach +50 Mrd. für HMB */
  allgemeinerHaushaltMrd: 18801.515,
  /** Cetvel (II): Einrichtungen mit Sonderhaushalt (Hochschulen, KGM, DSİ, TÜBİTAK, Orman GM …) */
  sonderhaushalteMrd: 1637.332,
  /** Cetvel (III): Regulierungs- und Aufsichtsbehörden (BTK, RTÜK, EPDK, BDDK …) */
  regulierungsbehoerdenMrd: 87.140,
  /** Konsolidierte Ausgaben des Zentralhaushalts laut Entwurf (= PLAN_2026.ausgabenGesamt); die Summe der drei Cetvel ist größer,
   *  weil die Zuschüsse an die Sonderhaushalte doppelt gezählt würden. */
  konsolidiertEntwurfMrd: 18928.815,
  /** Konsolidiert nach Ausschuss: abgeleitet 18.928,8 + 50 = 18.978,8; eine Presseanalyse nennt „18,979 trilyon“ (Suchauszug, Quelle
   *  nicht eindeutig) – amtlich zu prüfen. */
  konsolidiertGesetzMrdAbgeleitet: 18978.815,
  /** Personalausgaben aller Einrichtungen (Entwurf, AA-Auswertung Q6) und Sozialbeiträge des Staates */
  personalGesamtMrd: 4907,
  sozialbeitraegeGesamtMrd: 599.7,
  beleg:
    "Art. 1 Gesetz Nr. 7567, Resmî Gazete 31.12.2025 Nr. 33124 (1. Mükerrer): 18.801.514.833.000 / 1.637.331.680.000 / 87.139.973.000 TL (Such-Auszug von https://www.sbb.gov.tr/wp-content/uploads/2025/12/1-2026-Yili-Merkezi-Yonetim-Butce-Kanunu.pdf und https://www.lexpera.com.tr/resmi-gazete/metin/2026-yili-merkezi-yonetim-butce-kanunu); Entwurf 18.928.815.484 bin TL und Personal 4.907 Mrd., Sozialbeiträge 599,7 Mrd. nach AA (Q6); +50 Mrd. TBMM Q2.",
} as const;

/** Personalausgaben (01) weiterer Einrichtungen ohne eigenen Eintrag oben, Entwurf, AA-Auswertung (Q6), Mrd. Lira. */
export const PERSONAL_WEITERE_EINRICHTUNGEN_2026: { id: string; name: string; personalMrd: number; gehoertZu: string }[] = [
  { id: "emniyet", name: "Generaldirektion Sicherheit / Polizei (Emniyet Genel Müdürlüğü)", personalMrd: 412.25, gehoertZu: "inneres" },
  { id: "jandarma", name: "Generalkommando der Gendarmerie (Jandarma Genel Komutanlığı)", personalMrd: 287.09, gehoertZu: "inneres" },
  { id: "inneres_zentrale", name: "Innenministerium, Zentralorganisation", personalMrd: 70.142, gehoertZu: "inneres" },
  { id: "regulierer", name: "Regulierungs- und Aufsichtsbehörden zusammen", personalMrd: 13.641, gehoertZu: "verschiedene" },
];

/** Investitionsprogramm 2026 (Kamu Yatırım Programı), Mrd. Lira. Projektansätze, NICHT identisch mit den Sermaye giderleri (06) in
 *  Cetvel A; enthält auch Staatsunternehmen (KİT). Je Ministerium nur Einzelwerte belegt, der Rest ist Lücke. */
export const INVESTITIONSPROGRAMM_2026 = {
  gesamtMrd: 1920.8,
  projekte: 13887,
  /** Anteil der Einrichtungen des Zentralhaushalts in %, Rest u. a. KİT 35,4 % */
  anteilZentralhaushaltProzent: 62.8,
  anteilKitProzent: 35.4,
  /** Sektoranteile in % (nicht Ministerien) */
  sektorProzent: { verkehrKommunikation: 26.5, landwirtschaft: 10, gesundheit: 9 },
  je: [
    { id: "bildung", mrd: 160.5, beleg: "Presse: İstiklal, „2026 Yılı Yatırım Programı Resmi Gazete’de“, https://www.istiklal.com.tr/ekonomi/2026-yili-yatirim-programi-resmi-gazetede-1081276h" },
    { id: "gesundheit", mrd: 146.9, beleg: "Presse: Ekonomim (Sektor Gesundheit 173,5 Mrd., davon Sağlık Bakanlığı 146,9), https://www.ekonomim.com/gundem/kamu-yatirimlarinda-zirve-degismedi-iste-butceden-en-buyuk-payi-alan-sektor-haberi-869196" },
    { id: "landwirtschaft", mrd: 202, beleg: "[Entwurf] Minister Yumaklı im Ausschuss: Investitionsprojekte mit nachgeordneten Behörden (DSİ u. a.) 202 Mrd. (Suchauszug TBMM/tarimorman.gov.tr); Sektor Landwirtschaft im Programm 191,7 Mrd. (Ekonomim)" },
    { id: "verkehr", mrd: 562.7, beleg: "[Entwurf] Minister Uraloğlu: Investitionsvorschlag „beş sektörde 562,7 milyar“, ensonhaber https://www.ensonhaber.com/abdulkadir-uraloglu-5627-milyar-liralik-yatirim-teklifiyle-altyapida-buyumeyi-surduruyoruz-h1488601" },
  ],
  /** Einzelposten */
  gapBewaesserungMrd: 34.1,
  eisenbahnMrd: 145.6,
  erdbebenProjekteMrd: 697,
  beleg:
    "amtlich: SBB, „2026 Yılı Kamu Yatırım Programı yayımlandı“, https://www.sbb.gov.tr/2026-yili-kamu-yatirim-programi-yayimlandi/ (1.920,8 Mrd., 13.887 Projekte, Verkehr 26,5 %, Erdbeben 697 Mrd.); Anteile Zentralhaushalt/KİT Presse TRT Haber https://www.trthaber.com/haber/ekonomi/kamu-yatirimlari-icin-19-trilyon-lira-odenek-tahsis-edildi-931718.html ; Eisenbahn 145,6 Mrd. Presse Merceknet. Je Ministerium übrige: Lücke.",
} as const;
