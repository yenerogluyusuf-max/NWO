# Recherche: Haushalt 2026 nach Ministerien und Behördenzuordnung (Arbeitspaket 2)

Stand: 05.11.2026. Gehört zu [PLAN_OBERFLAECHE_DETAIL_2026-11-05.md](PLAN_OBERFLAECHE_DETAIL_2026-11-05.md), Q1 und Arbeitspaket 2. Die Daten stehen in [`game/src/data/haushalt_ministerien_2026.ts`](game/src/data/haushalt_ministerien_2026.ts), Beleg je Zahl. Diese Notiz ist eine eigene Datei, weil es `RECHERCHE_NOTIZEN.md` nicht gibt. `RECHERCHE_NOTIZEN/` ist ein Ordner mit anderen Themen.

## 1. Wie recherchiert wurde, und die Grenze dabei

- **Die amtlichen Tabellen ließen sich nicht öffnen.** Aus dieser Sitzung waren resmigazete.gov.tr, sbb.gov.tr, tbmm.gov.tr, hmb.gov.tr, mevzuat.gov.tr und auch Presseseiten (z. B. forbes.com.tr) gesperrt. Der Proxy antwortete mit 403, die Namensauflösung schlug fehl. Erreichbar war nur die Websuche. Alle Werte stammen deshalb aus **Such-Auszügen** der genannten Seiten. Ich habe keine Tabelle selbst gelesen. Bevor eine Zahl eingebaut wird, muss sie an der amtlichen Tabelle geprüft werden.
- Damit die Prüfung schnell geht, sind die beiden amtlichen Dateien gefunden, die alles enthalten:
  1. Gesetzestext mit Cetvel A, B und C: <https://www.sbb.gov.tr/wp-content/uploads/2025/12/1-2026-Yili-Merkezi-Yonetim-Butce-Kanunu.pdf> (Gesetz Nr. 7567, Resmî Gazete 31.12.2025 Nr. 33124, 1. Mükerrer)
  2. Ausgaben je Einrichtung und Ausgabeart (Personal, Sozialbeiträge, Sachausgaben, Zinsen, laufende Transfers, Investitionen, Kapitaltransfers, Darlehen, Reserve): <https://www.sbb.gov.tr/wp-content/uploads/2025/12/2a-2026-Yili-Genel-Butceli-Idareler-Ekonomik-Kod-Icmali-ile-2027-2028-Gider-Tahminleri.pdf> (auch als XLS auf <https://www.sbb.gov.tr/merkezi-yonetim-butce-kanunlari/>)
- Kennzeichnung in der Datei: **[Gesetz]** heißt beschlossener Betrag, **[Entwurf]** heißt Betrag aus dem Gesetzentwurf vom Oktober/November 2025. Außerdem steht dabei, ob die Quelle **amtlich** ist (TBMM-Meldung, Ministerium, Rede im Ausschuss) oder aus der **Presse** stammt. Für alle Einrichtungen außer dem Finanzministerium dürfte der Entwurf dem Gesetz entsprechen. Im Ausschuss wurde nur dessen Etat geändert, um +50 Mrd. (TBMM, 01.12.2025). Geprüft ist das nicht.

## 2. Was gefunden wurde (Mrd. Lira)

| id | Einrichtung | gesamt | Umfang | Stand und Art des Belegs | Personal (01) |
|---|---|---|---|---|---|
| justiz | Adalet | 389,560 | Ministerium | Gesetz, amtlich (Bericht des Ministeriums zur Finanzlage, Juli 2026) | 245,799 (Entwurf, Presse/AA) |
| familie | Aile ve Sosyal Hizmetler | 531,905 | Ministerium | unklar, Presse | 73,473 |
| arbeit | Çalışma ve Sosyal Güvenlik | 447,903 | Ministerium | Entwurf, amtlich (TBMM) | Lücke |
| umwelt | Çevre, Şehircilik ve İklim | 275,011 | nur Ministerium (dazu Kentsel Dönüşüm 111,125, TKGM 15,962) | Entwurf, Rede eines Abgeordneten im Ausschuss (Presse) | Lücke |
| aussen | Dışişleri | 46,8 | Ministerium | Entwurf, Presse (DHA) | Lücke |
| energie | Enerji ve Tabii Kaynaklar | 36,098 | nur Zentralorganisation (mit MTA und MAPEG 48,997, mit TENMAK, EPDK und NDK 58,4) | Entwurf, Presse (AA) | Lücke |
| jugend | Gençlik ve Spor | 300,302 | Ministerium | Entwurf, amtlich (TBMM) | Lücke |
| finanzen | Hazine ve Maliye | 8.840,323 | Ministerium, enthält Zinsen (ohne Zinsen 6,1 Bio.) | Entwurf, amtlich (TBMM) und Presse | Lücke |
| inneres | İçişleri | 1.476,729 | **mit** nachgeordneten Behörden (91,91 %) | Entwurf, amtlich (TBMM) | Zentrale 70,142; Polizei 412,250; Gendarmerie 287,090 |
| kultur | Kültür ve Turizm | 69,9998 | **mit** nachgeordneten Einrichtungen | Entwurf, amtlich (TBMM) | Lücke |
| bildung | Millî Eğitim | 1.943,966 | Ministerium | **Gesetz, amtlich (MEB-Statistik, Tab. 7.2)** | 1.435,648 (Entwurf, Presse/AA) |
| verteidigung | Millî Savunma | 822,930 | Ministerium | Gesetz, Presse | 395,725 |
| gesundheit | Sağlık | 1.474,948 | Ministerium | Entwurf, Presse | 863,557 |
| industrie | Sanayi ve Teknoloji | 176,967 | Ministerium (Anfangsansatz) | Gesetz, Presse | Lücke |
| landwirtschaft | Tarım ve Orman | 541,8 | Ministerium (mit DSİ u. a. laut Minister 938, laut Opposition 888,2) | Entwurf, amtlich (TBMM) | 72,881 |
| handel | Ticaret | 76,251 | Ministerium | Entwurf, amtlich (TBMM) | Lücke |
| verkehr | Ulaştırma ve Altyapı | 605 | **mit** SHGM, KGM (Sonderhaushalt) und BTK (Regulierer) | Entwurf, Presse | Lücke |
| stab | Präsidialamt (Generalsekretariat) | 21,287 | nur Generalsekretariat | Entwurf, amtlich (Yılmaz im Ausschuss) | 4,502 (Presse) |
| diyanet | Diyanet İşleri | 174,389 | Behörde | Gesetz, Presse | 148,8 |
| mit | MİT | 39,496 | Behörde | Entwurf, amtlich (Yılmaz) | Lücke |
| kommunikation | İletişim Başkanlığı | 7,564 | Behörde | Entwurf, amtlich (Yılmaz) | Lücke |
| ssb | Savunma Sanayii Başkanlığı | 1,547 | **nur Eigenetat**, die Projekte laufen über den Rüstungsfonds SSDF außerhalb des Haushalts | Entwurf, amtlich (Yılmaz) | Lücke |
| afad | AFAD | 373 | Behörde (vermutlich in „inneres“ enthalten) | Entwurf, Presse | Lücke |
| hochschulen | Hochschulen gesamt | 651,020 | alle staatlichen Hochschulen (Sonderhaushalte) | Entwurf, amtlich (Yılmaz) und Gewerkschaft (Eğitim-Sen) | Lücke |

**Prüfung des Beispiels aus der Haushaltsdebatte:** Für das Bildungsministerium nennt die Debatte 1,944 Bio. Diese Zahl bestätigt die amtliche MEB-Statistik: 1.943.965.746.000 TL, nach 1.451.715.540.000 TL im Jahr 2025, also +33,91 %. Die Personalzahl von 1,436 Bio. (genau 1.435.648 Mio.) findet sich nur in der AA-Auswertung des **Entwurfs**. An der Tabelle prüfen ließ sie sich nicht, weil die MEB-Tabelle im Such-Auszug unlesbar war.

**Haushaltsrahmen laut Art. 1 des Gesetzes:** Der allgemeine Haushalt (Cetvel I) umfasst 18.801,515 Mrd., die Sonderhaushalte (Cetvel II) 1.637,332 Mrd. und die Regulierungsbehörden (Cetvel III) 87,140 Mrd.

**Investitionsprogramm 2026:** Es umfasst insgesamt 1.920,8 Mrd. für 13.887 Projekte. Davon entfallen 62,8 % auf Einrichtungen des Zentralhaushalts und 35,4 % auf Staatsunternehmen (KİT). Nach Sektoren: Verkehr und Kommunikation 26,5 %, Landwirtschaft 10 %, Gesundheit 9 %. Für einzelne Ministerien sind nur diese Werte belegt:

| Ministerium | Mrd. | Anmerkung |
|---|---|---|
| Bildung | 160,5 | |
| Gesundheitsministerium | 146,9 | von 173,5 im Sektor Gesundheit |
| Landwirtschaft | 202 | mit nachgeordneten Behörden, laut Minister |
| Verkehr | 562,7 | Investitionsvorschlag in fünf Sektoren, laut Minister |

Einzelposten: GAP-Bewässerung 34,1, Eisenbahn 145,6, Erdbebenprojekte 697. Diese Projektansätze sind **nicht** dasselbe wie die Investitionsausgaben (06) in Cetvel A, denn sie enthalten auch die KİT. Abgeleitet: 62,8 % von 1.920,8 ergeben rund 1.206 Mrd. für den Zentralhaushalt. `AUSGABEN_2026.investitionen` nennt 1.312 Mrd. (Forbes). Die Differenz ist ungeklärt; vermutlich sind die Umfänge verschieden.

## 3. Summenabgleich gegen den Gesamthaushalt

`PLAN_2026.ausgabenGesamt` = 18.929 Mrd. ist der konsolidierte Betrag des **Entwurfs** (AA: 18.928.815.484 bin TL).

1. **Gesamtbetrag nach dem Ausschuss:** 18.929 + 50 = rund **18.979 Mrd.** (abgeleitet). Eine Analyse nennt „18,979 Bio.“ (Such-Auszug; die Quelle ließ sich nicht eindeutig zuordnen). **Empfehlung:** `PLAN_2026.ausgabenGesamt` auf den Gesetzesstand bringen, sobald der Wert amtlich geprüft ist. Das ist eine Entscheidung für ENTSCHEIDUNGEN; hier ist nichts geändert.
2. **Die drei Cetvel ergeben zusammen 20.526 Mrd.** Das sind 1.547 Mrd. mehr als konsolidiert (abgeleitet). Der Grund: Der allgemeine Haushalt, vor allem das Finanzministerium, zahlt den Sonderhaushalten Zuschüsse (Hazine yardımı). Diese Zuschüsse würden beim Addieren doppelt gezählt. **Folge:** Ministerien und Hochschulen (651 Mrd., Sonderhaushalt) lassen sich nicht einfach addieren.
3. **Die 17 Ministerien ergeben zusammen 18.056,5 Mrd.** (Umfänge gemischt). Mit Präsidialamt, Diyanet, MİT, Kommunikation und SSB sind es **18.300,8 Mrd.** Bis 18.929 bleiben **628,2 Mrd.**, bis zum allgemeinen Haushalt (18.801,5) **500,7 Mrd.** Darin stecken Einrichtungen ohne eigenen Eintrag, zum Beispiel:
   - Parlament, Rechnungshof, oberste Gerichte, SBB, Steuerverwaltung, TÜİK, Generaldirektion für Wetter und Klima
   - Kentsel Dönüşüm 111,1 und TKGM 16,0
   - MTA, MAPEG und weitere
   
   Einzeln belegt ist der Rest nicht (**Lücke**).
4. **Wo die Summe nicht aufgeht oder nur scheinbar aufgeht:**
   - **inneres** (1.476,7) enthält Polizei, Gendarmerie, Küstenwache und Migrationsbehörde, vermutlich auch AFAD. AFAD (373) darf deshalb **nicht** zusätzlich gezählt werden.
   - **verkehr** (605) enthält KGM (Sonderhaushalt) und BTK (Cetvel III), liegt also teils außerhalb des allgemeinen Haushalts.
   - **kultur** ist mit nachgeordneten Einrichtungen angegeben, **umwelt**, **energie** und **landwirtschaft** ohne sie.
   - **finanzen** (8.840,3) ist vermutlich der Stand des Entwurfs. Ob die +50 Mrd. aus dem Ausschuss schon enthalten sind, ist offen.
   - Die Reserve (375 Mrd. in `AUSGABEN_2026`) liegt ebenfalls beim Finanzministerium (zu prüfen).
5. **Personal:** Die belegten Personalwerte ergeben zusammen 4.009,9 Mrd., das sind 81,7 % der 4.907 Mrd. Personalausgaben aller Einrichtungen. Gegenprobe: 4.907 Personal und 599,7 Sozialbeiträge ergeben **5.506,7 Mrd.** Das passt zu `AUSGABEN_2026.personal` = 5.507 Mrd. Die Zeile „Personal“ in haushaltsplan.ts umfasst also Personal **und** Sozialbeiträge.
6. **Andere Gliederung, nicht verwechseln:** Laut Regierung entfallen auf die Funktion „Verteidigung“ 1.202 Mrd. und auf „Innere Sicherheit“ 953 Mrd. Für „Gesundheitsdienste“ nennt Yılmaz 1.594 Mrd., für Bildung samt Hochschulen 2.896 Mrd. Das sind Beträge nach **Aufgaben** (funktionale Gliederung), nicht nach Einrichtungen. Für den Bildungsbetrag gilt 1.944 + 651 = 2.595 Mrd.; die übrigen 301 Mrd. stecken in anderen Einrichtungen (Lücke).

## 4. Zuordnung der Behörden nach den Präsidialerlassen

Präsidialerlass Nr. 1 vom 10.07.2018 (Resmî Gazete Nr. 30474) regelt das Präsidialamt. Präsidialerlass Nr. 4 vom 15.07.2018 (Resmî Gazete Nr. 30479) regelt die Behörden, die den Ministerien nachgeordnet (bağlı), zugeordnet (ilgili) oder verbunden (ilişkili) sind. Beide wurden seither mehrfach geändert. Nach einer Quelle stammt die letzte Änderung von Nr. 4 vom 19.02.2026 (hukukegitim.com). Die geltenden Fassungen auf mevzuat.gov.tr waren nicht erreichbar.

| Behörde | Zuordnung | Beleg | Sicherheit |
|---|---|---|---|
| DSİ | Tarım ve Orman, nachgeordnet (bağlı), Sonderhaushalt | Erlass Nr. 4 Art. 120 laut Such-Auszug (mevzuattakip.com.tr, Fassung auf csb.gov.tr) | belegt |
| KGM (Karayolları) | Ulaştırma ve Altyapı | Erlass Nr. 4 hat einen eigenen Abschnitt KGM (Such-Auszug); KGM wurde im Ausschuss zusammen mit dem Verkehrsministerium beraten (TBMM-Protokoll 5298); Teil der 605 Mrd. | belegt (die Art der Zuordnung ist nicht wörtlich geprüft) |
| TOKİ | Çevre, Şehircilik ve İklim, nachgeordnet | Rechnungshof (Sayıştay): seit 09.07.2018 durch **Rechtsverordnung (KHK) Nr. 703** dem Ministerium zugeordnet, also **nicht** durch Erlass Nr. 1 oder Nr. 4; der Rechnungshofbericht 2024 zählt TOKİ zu den nachgeordneten Behörden | belegt. **TOKİ steht nicht im Zentralhaushalt.** Die Rechnungen werden im KİT-Ausschuss der TBMM beraten (AA, 20.10.2026). Haushaltsbetrag: entfällt |
| GAP-Regionalentwicklung (GAP BKİ) | **Lücke**: in dieser Recherche nicht belegt; vermutet: Sanayi ve Teknoloji | – | zu prüfen in Erlass Nr. 4 |
| SSB | Präsidialamt, unmittelbar dem Präsidenten unterstellt | eigener **Präsidialerlass Nr. 7** (Savunma Sanayii Başkanlığı), nicht Nr. 1 oder 4 (lexpera, alomaliye 15.07.2018) | belegt |
| TÜBİTAK | Sanayi ve Teknoloji, zugeordnet (ilgili), Sonderhaushalt | Auszug aus Erlass Nr. 4 auf tubitak.gov.tr; TÜBİTAK-Selbstbeschreibung | belegt |
| YÖK | **Lücke**: in dieser Recherche nicht belegt. YÖK ist im Verfassungsartikel 131 und im Gesetz Nr. 2547 geregelt und gehört zu keinem Ministerium (Allgemeinwissen, zu prüfen) | – | zu prüfen |
| BTK | Ulaştırma ve Altyapı, verbunden (ilişkili) | indirekt: wurde im Ausschuss mit dem Verkehrsministerium beraten und ist Teil der 605 Mrd. (Presse); Cetvel III | indirekt belegt |
| RTÜK | Kültür ve Turizm, verbunden (ilişkili) | Rechnungshofbericht RTÜK: festgelegt durch das **Präsidialrundschreiben 2018/2** auf Grundlage von Art. 19/A Gesetz Nr. 3046, nicht durch Erlass Nr. 1 oder 4 | belegt |
| Diyanet | Präsidialamt (bağlı) | Liste der dem Präsidialamt unterstellten Einrichtungen nach Erlass Nr. 1 (Dünya, 10.07.2018) | belegt |
| MİT | Präsidialamt | in dieser Recherche nicht belegt (Lücke). Allgemeinwissen: seit der KHK Nr. 694 (2017) dem Präsidenten unterstellt | zu prüfen |
| İletişim Başkanlığı | Präsidialamt | eigener **Präsidialerlass Nr. 14** | belegt |
| AFAD | im Erlass Nr. 4 geregelt (belegt); die Zuordnung zum Innenministerium ist in dieser Recherche nicht wörtlich belegt (Q1 im Plan nimmt „inneres“ an) | Diyanet Haber, Liste der Einrichtungen nach Erlass Nr. 4 | teilweise |

**Folge für Q1 und F13:** SSB und İletişim gehören zum Präsidialamt (`stab`), nicht zu einem Ministerium. TOKİ gehört fachlich zu `umwelt`. Weil es keinen Haushaltsbetrag gibt, kann TOKİ dort nur als Behörde erscheinen, nicht als Haushaltsposten. RTÜK gehört zu `kultur`, BTK zu `verkehr`, TÜBİTAK zu `industrie`, DSİ zu `landwirtschaft` und KGM zu `verkehr`.

## 5. Lücken

1. **Aufteilung nach Ausgabeart je Einrichtung:** Für alle Einträge fehlen Sozialbeiträge (02), Sachausgaben (03), laufende Transfers (05), Investitionen (06) und Kapitaltransfers (07). Quelle: SBB Ekonomik Kod İcmali 2026 (Link oben).
2. **Personal (01)** fehlt für arbeit, umwelt, aussen, energie, jugend, finanzen, kultur, industrie, handel, verkehr, mit, kommunikation, ssb, afad und hochschulen. Bei inneres fehlen Küstenwache, Migrationsbehörde und AFAD.
3. **Der Gesetzesstand ist nicht geprüft** für alle Werte mit [Entwurf], vor allem für finanzen (+50 Mrd.?).
4. **Einheitliche Umfänge fehlen:**
   - verkehr: Ministerium allein, KGM, SHGM und BTK einzeln
   - inneres: Polizei, Gendarmerie, Küstenwache, Migrationsbehörde und AFAD einzeln
   - kultur: Ministerium allein
   - landwirtschaft: DSİ, Forstverwaltung und Naturschutz einzeln
   - energie: Ort der Energiestützung von 400 Mrd.
5. **Genauere Beträge:** Für aussen (46,8), afad (373) und verkehr (605) gibt es nur gerundete Werte. Für industrie weichen die Quellen ab (176,967 oder 176,976).
6. **Fehlende Einzelbeträge:** YÖK allein, TÜBİTAK, KOSGEB, DSİ, GAP BKİ und Rüstungsfonds SSDF für 2026.
7. **Rest von 628 Mrd.:** Die Einrichtungen ohne eigenen Eintrag sind nicht einzeln belegt.
8. **Investitionsprogramm je Ministerium:** Außer Bildung, Gesundheit, Landwirtschaft und Verkehr fehlt alles. Die Differenz 1.206 (abgeleitet) gegen 1.312 Mrd. ist ungeklärt.
9. **Zuordnungen:** GAP BKİ, YÖK und MİT sind unbelegt, AFAD ist nicht wörtlich belegt. Die geltende Fassung von Erlass Nr. 4 ist ungeprüft.
10. **Netz:** Für die Prüfung müssen in den Netzwerkeinstellungen der Sitzung mindestens sbb.gov.tr, resmigazete.gov.tr, tbmm.gov.tr und mevzuat.gov.tr freigegeben sein.

## 6. Nächste Schritte

- Mit freigegebenem Netz das XLS des Ekonomik Kod İcmali 2026 laden und die Ausgabearten für alle 24 Einträge füllen. Dann [Entwurf] gegen Cetvel A prüfen und den Gesamtbetrag 18.979 bestätigen.
- Entscheiden (ENTSCHEIDUNGEN), ob das Spiel den Entwurfsstand (18.929) oder den Gesetzesstand (rund 18.979) als Start nimmt.
- Für das Gesamtrad in AP 11 zwei Ebenen trennen, sonst ergibt der Außenring nicht genau die Ausgaben:
  - nach Einrichtungen: allgemeiner Haushalt, Zuschüsse an Sonderhaushalte nur einmal
  - nach Arten: `AUSGABEN_2026`
