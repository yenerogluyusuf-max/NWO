# Erzeugt die Kataloge fokus.json (de, tr, en) aus den Fokusdaten (data/fokus/*, Export nach /tmp/foki.json) und den Texten hier.
# Aufruf: npx tsx (Export, siehe Kopf von data/fokusbaum.ts) und dann python3 tools/fokus/baue_katalog.py
# Die Oberflächentexte und die Übersetzungen der Leitsprüche stehen hier; Titel, Untertitel und Beschreibung kommen aus den Daten.
import json, os

HIER = os.path.dirname(os.path.abspath(__file__))
KAT = os.path.join(HIER, "..", "..", "src", "i18n", "katalog")
d = json.load(open("/tmp/foki.json"))

# Leitsprüche: [de, tr, en] und Urheber [de, tr, en]. Atatürk-Zitate in überlieferter türkischer Fassung.
Z = {
 "fok_wirt_auftakt": ["Politische Unabhängigkeit verlangt wirtschaftliche Unabhängigkeit.", "Siyasi bağımsızlık, ekonomik bağımsızlık ister.", "Political independence demands economic independence."],
 "fok_wirt_orthodoxie": ["Vertrauen ist die härteste Währung der Welt.", "Güven, dünyanın en sağlam parasıdır.", "Trust is the hardest currency in the world."],
 "fok_wirt_niedrigzins": ["Produktion und Arbeitsplätze dürfen nicht dem Zins geopfert werden.", "Üretim ve istihdam faize kurban edilemez.", "Production and jobs must not be sacrificed to interest rates."],
 "fok_sich_doktrin": ["Wer den Frieden will, bereite den Krieg vor, mit eigener Hand und eigenem Verstand.", "Barış isteyen savaşa hazırlansın; kendi eliyle ve kendi aklıyla.", "Who wants peace, prepare for war, with one's own hands and one's own mind."],
 "fok_ges_pakt": ["Einigkeit im Fundament, Vielfalt im Ausdruck.", "Temelde birlik, ifadede çeşitlilik.", "Unity in the foundation, diversity in expression."],
 "fok_ges_laizismus": ["Die Republik Türkei kann kein Land der Scheichs, Derwische und Jünger sein.", "Türkiye Cumhuriyeti şeyhler, dervişler, müritler memleketi olamaz.", "The Republic of Türkiye cannot be a land of sheikhs, dervishes and disciples."],
 "fok_ges_religioes": ["Ein Volk ohne geistige Wurzeln gleicht einem Baum ohne Wurzeln im Sturm.", "Manevi kökleri olmayan bir millet, fırtınada köksüz bir ağaca benzer.", "A people without spiritual roots is like a rootless tree in a storm."],
 "fok_ges_versoehnung": ["Wo das freie Wort Frieden stiften kann, soll keine Waffe mehr sprechen.", "Özgür sözün barış kurabildiği yerde artık silah konuşmasın.", "Where free speech can make peace, let no weapon speak again."],
 "fok_aus_doktrin": ["Frieden im Land, Frieden in der Welt.", "Yurtta sulh, cihanda sulh.", "Peace at home, peace in the world."],
 "fok_staat_verfassung": ["Die Souveränität gehört bedingungslos der Nation.", "Egemenlik kayıtsız şartsız milletindir.", "Sovereignty belongs unconditionally to the nation."],
 "fok_reg_masterplan": ["Ein Land wächst nicht an einem Ort, sondern im Gleichklang all seiner Provinzen.", "Bir ülke tek bir yerde değil, bütün illerinin uyumu içinde büyür.", "A country does not grow in one place but in step across all its provinces."],
 "fok_reg_erdbebenfestung": ["Nicht das Erdbeben tötet Menschen, sondern schlechte Bausubstanz.", "İnsanları deprem değil, kötü yapı öldürür.", "Earthquakes do not kill people; bad buildings do."],
 "fok_wis_auftakt": ["Der wahrhaftigste Wegweiser im Leben ist die Wissenschaft.", "Hayatta en hakiki mürşit ilimdir.", "The truest guide in life is science."],
 "fok2_wirt_preiswahrheit": ["Ein Deckel ohne Datum ist eine Hypothek ohne Fälligkeit.", "Tarihsiz bir tavan, vadesi belirsiz bir ipotektir.", "A cap without a date is a mortgage without a due date."],
 "fok2_wirt_formalisierung": ["Wenn alle zahlen, zahlt jeder weniger; nur diese Steuermoral hält.", "Herkes öderse herkes daha az öder; ayakta kalan tek vergi ahlakı budur.", "If everyone pays, everyone pays less; that is the only tax morale that lasts."],
 "fok2_wirt_mikrofinanz": ["Die kürzeste Kreditlehre der Welt: Vertrauen ist der Titel, der Zins die Klausel.", "Dünyanın en kısa kredi dersi: Güven başlıktır, faiz dipnot.", "The shortest lesson in credit: trust is the title, interest the clause."],
 "fok2_wirt_wirkstoff": ["Ein Land, das seine Tabletten nicht selbst macht, verhandelt jeden Winter neu.", "İlacını kendi yapmayan ülke her kış yeniden pazarlık eder.", "A country that does not make its own pills renegotiates every winter."],
 "fok2_wirt_fachkraefte_rueckholung": ["Abwanderung ist ein Sparvertrag ohne Rückzahlung, bis der Staat ihn kündigt.", "Göç, devlet feshedene kadar geri ödemesiz bir tasarruf sözleşmesidir.", "Emigration is a savings plan with no payout, until the state cancels it."],
 "fok2_wirt_wasserstoff": ["Der Wind der Ägäis war immer Exportware; jetzt hat er eine Leitung.", "Ege'nin rüzgârı hep ihraç malıydı; şimdi bir boru hattı var.", "The Aegean wind was always an export; now it has a pipeline."],
 "fok2_wirt_kohle_schutz": ["Wer die Grube schließt, muss zuerst sagen, wer danach in der Stadt arbeitet.", "Ocağı kapatan, önce şehirde sonra kimin çalışacağını söylemeli.", "Whoever closes the pit must first say who will work in the town afterwards."],
 "fok2_sich_raketen": ["Abschreckung ist die einzige Sprache, die jeder Nachbar ohne Übersetzung versteht.", "Caydırıcılık, her komşunun tercümesiz anladığı tek dildir.", "Deterrence is the only language every neighbour understands without translation."],
 "fok2_sich_grenze_digital": ["Eine Grenze, die sieht, muss weniger schießen.", "Gören bir sınır daha az ateş eder.", "A border that can see needs to shoot less."],
 "fok2_sich_reserve": ["Die Wehrpflicht hat Millionen Namen; die Reserve muss sie wieder rufen können.", "Askerlik milyonlarca isim bıraktı; yedek kuvvet onları yeniden çağırabilmeli.", "Conscription left millions of names; the reserve must be able to call them again."],
 "fok2_sich_zivilschutz": ["Nach dem Beben zählen nicht die Waffen, sondern die Bagger.", "Depremden sonra silahlar değil, kepçeler sayılır.", "After the quake it is not the weapons that count but the diggers."],
 "fok2_ges_jugendgarantie": ["Ein Land, das seiner Jugend nichts bietet, überlässt sie der Straße.", "Gençlerine hiçbir şey sunmayan ülke onları sokağa bırakır.", "A country that offers its young nothing leaves them to the street."],
 "fok2_ges_pflege": ["Jede Gesellschaft wird daran gemessen, wer ihre Alten pflegt.", "Her toplum, yaşlılarına kimin baktığıyla ölçülür.", "Every society is measured by who cares for its old."],
 "fok2_ges_kulturstrassen": ["Kultur, die nur in drei Städten wohnt, ist ein Zertifikat, keine Kultur.", "Yalnızca üç şehirde yaşayan kültür, kültür değil bir sertifikadır.", "Culture that lives in only three cities is a certificate, not culture."],
 "fok2_ges_diyanet_transparenz": ["Wer für den Glauben zahlt, darf auch fragen, wofür.", "İnanç için ödeyen, neye ödediğini de sorabilir.", "Whoever pays for faith may also ask what for."],
 "fok2_ges_diyanet_ausbau": ["Ein Land, das seine Gebetshäuser baut, baut auch seine Nachbarschaften.", "İbadethanelerini inşa eden ülke mahallelerini de inşa eder.", "A country that builds its houses of prayer also builds its neighbourhoods."],
 "fok2_ges_gedenkpolitik": ["Eine Erinnerung, die niemand teilt, teilt das Land.", "Kimsenin paylaşmadığı bir hatıra ülkeyi böler.", "A memory no one shares divides the country."],
 "fok2_ges_heldenkanon": ["Wer seine Helden nicht kennt, erfindet welche, meist schlimmere.", "Kahramanlarını bilmeyen kendine kahraman uydurur; çoğu zaman daha kötülerini.", "Those who do not know their heroes invent some, usually worse ones."],
 "fok2_aus_afrika": ["Wer in zwanzig Hauptstädten angerufen wird, ist nicht mehr zu überhören.", "Yirmi başkentte aranan artık duyulmadan geçilemez.", "Whoever gets calls in twenty capitals can no longer be ignored."],
 "fok2_aus_zollunion2": ["Ein Vertrag aus dem letzten Jahrhundert ist kein Rahmen, sondern eine Fessel.", "Geçen yüzyıldan kalma bir anlaşma çerçeve değil, prangadır.", "A treaty from the last century is not a framework but a shackle."],
 "fok2_aus_vermittlerzentrum": ["Der Vermittler gehört niemandem; das ist sein einziges Eigentum.", "Arabulucu kimseye ait değildir; tek mülkü budur.", "The mediator belongs to no one; that is his only property."],
 "fok2_aus_turkstaaten_schulen": ["Grenzen, die man nicht verschieben kann, verlängert man durch Klassenzimmer.", "Değiştirilemeyen sınırlar sınıflarla uzatılır.", "Borders that cannot be moved are extended through classrooms."],
 "fok2_aus_sicherheitsrat": ["Der Sicherheitsrat wählt nicht Macht, er wählt Nützlichkeit.", "Güvenlik Konseyi gücü değil, işe yararlığı seçer.", "The Security Council does not elect power; it elects usefulness."],
 "fok2_aus_kaspische_pipeline": ["Gas, das nicht durch eigene Rohre fließt, ist das Gas eines anderen.", "Kendi borusundan akmayan gaz başkasının gazıdır.", "Gas that does not flow through your own pipes is someone else's gas."],
 "fok2_staat_egovernment": ["Ein Staat, der in zwei Tagen antwortet, muss niemanden mehr überzeugen, dass es ihn gibt.", "İki günde cevap veren devlet, var olduğuna kimseyi ikna etmek zorunda kalmaz.", "A state that answers in two days no longer has to convince anyone that it exists."],
 "fok2_staat_ombudsstelle": ["Jede Beschwerde, die eine Antwort bekommt, ist eine Stimme, die nicht verloren geht.", "Cevap alan her şikâyet kaybedilmeyen bir oydur.", "Every complaint that gets an answer is a vote that is not lost."],
 "fok2_staat_hsk_gewichtung": ["Wer die Richter wählt, entscheidet über jedes Urteil, das noch nicht gesprochen ist.", "Hâkimleri seçen, henüz verilmemiş her kararı belirler.", "Whoever chooses the judges decides every verdict not yet spoken."],
 "fok2_staat_notstandshygiene": ["Der Ausnahmezustand ist der liebste Mantel der Dauerherrschaft; gebt ihm Ärmel aus Gesetz.", "Olağanüstü hâl, kalıcı iktidarın en sevdiği paltodur; ona kanundan kollar dikin.", "The state of emergency is permanent rule's favourite coat; give it sleeves made of law."],
 "fok2_staat_lokalautonomie": ["Ob die Straße Wasser hat, entscheidet sich im Bezirk, nicht in der Hauptstadt.", "Sokağın suyu başkentte değil, ilçede karara bağlanır.", "Whether a street has water is decided in the district, not in the capital."],
 "fok2_staat_gouverneure": ["In der Krise muss jemand gehorchen, wenn gerufen wird, und das ist ein Name, kein Ausschuss.", "Krizde biri çağırınca birinin itaat etmesi gerekir; bu bir isimdir, bir komite değil.", "In a crisis someone must obey when called, and that is a name, not a committee."],
 "fok2_reg_hafentrio": ["Ein Land mit drei Meeren kann sich keinen Hafen als Flaschenhals leisten.", "Üç denizi olan bir ülke hiçbir limanın darboğaz olmasına izin veremez.", "A country with three seas cannot afford a single port as a bottleneck."],
 "fok2_reg_korridor_mitte": ["Zwei Autobahnen ohne Verbindung sind wie zwei Telefone ohne Netz.", "Birbirine bağlanmayan iki otoyol, şebekesiz iki telefon gibidir.", "Two motorways without a link are like two phones without a network."],
 "fok2_reg_gap_wasser": ["Ein gestauter Fluss ist ein Versprechen; ein bewässertes Feld ist die Erfüllung.", "Baraj bir sözdür; sulanan tarla o sözün yerine gelmesidir.", "A dammed river is a promise; an irrigated field is its fulfilment."],
 "fok2_reg_karadeniz_kueste": ["Die Wolken gehören der Küste; die Gäste folgen der Straße.", "Bulutlar kıyınındır; misafirler yolu izler.", "The clouds belong to the coast; the guests follow the road."],
 "fok2_reg_waldbrand": ["Der Sommer kommt jedes Jahr; die Löschteiche dürfen nicht jedes Jahr neu gebaut werden.", "Yaz her yıl gelir; yangın havuzları her yıl yeniden yapılamaz.", "Summer comes every year; the fire ponds cannot be rebuilt every year."],
 "fok2_reg_verwaltungscampus": ["Heute liegt zwischen zwei Ministerien eine Stadt; auf dem Campus ein Flur.", "Bugün iki bakanlık arasında bir şehir var; kampüste bir koridor.", "Today a city lies between two ministries; on the campus, a corridor."],
 "fok2_reg_grossstadt_bezirke": ["Der Bezirk kennt seine Schlaglöcher mit Hausnummer; das Zentrum kennt sie als Statistik.", "İlçe çukurlarını kapı numarasıyla bilir; merkez onları istatistik olarak bilir.", "The district knows its potholes by house number; the centre knows them as statistics."],
 "fok2_wis_chips_28": ["Wer Chips einführt, leiht sich jede Krise vom Ausland.", "Çip ithal eden, her krizi yurt dışından ödünç alır.", "Whoever imports chips borrows every crisis from abroad."],
 "fok2_wis_offene_modelle": ["Ein Modell, das niemand prüfen kann, ist kein Staatsmodell, sondern ein Glaube.", "Kimsenin denetleyemediği bir model devlet modeli değil, bir inançtır.", "A model no one can audit is not a state model but a belief."],
 "fok2_wis_impfstoffwerk": ["Der Impfstoff ist die einzige Waffe, deren Fabrik man im Frieden bauen muss.", "Aşı, fabrikası barışta kurulması gereken tek silahtır.", "Vaccine is the only weapon whose factory must be built in peacetime."],
 "fok2_wis_zellen": ["Sonne ohne Speicher ist ein Versprechen am hellen Mittag.", "Depolamasız güneş, öğle vaktinde verilmiş bir sözdür.", "Sun without storage is a promise made at noon."],
 "fok2_wis_supercomputer": ["Rechenzeit ist das neue Land: Wer sie nicht hat, baut auf fremdem Boden.", "İşlem gücü yeni topraktır: Ona sahip olmayan başkasının arsasına inşa eder.", "Computing time is the new land: whoever lacks it builds on someone else's ground."],
 "fok2_wis_weltraumwetter": ["Die Sonne warnt die Börse nicht vor; das muss unsere Leitstelle tun.", "Güneş borsayı önceden uyarmaz; bunu bizim merkezimiz yapmalı.", "The sun gives the markets no warning; our control centre must."],
 "fok2_wis_rueckkehrstipendien": ["Die teuerste Ausfuhr des Landes ist eine Doktorarbeit, die man nie wiedersieht.", "Ülkenin en pahalı ihracatı, bir daha görülmeyen bir doktora tezidir.", "The country's most expensive export is a doctorate it never sees again."],
}
U = {
 "İzmir Wirtschaftskongress, 1923": ["İzmir Wirtschaftskongress, 1923", "İzmir İktisat Kongresi, 1923", "İzmir Economic Congress, 1923"],
 "Mustafa Kemal Atatürk, 1925": ["Mustafa Kemal Atatürk, Kastamonu 1925", "Mustafa Kemal Atatürk, Kastamonu 1925", "Mustafa Kemal Atatürk, Kastamonu 1925"],
 "Mustafa Kemal Atatürk, 1931": ["Mustafa Kemal Atatürk, 1931", "Mustafa Kemal Atatürk, 1931", "Mustafa Kemal Atatürk, 1931"],
 "Mustafa Kemal Atatürk, 1924": ["Mustafa Kemal Atatürk, 1924", "Mustafa Kemal Atatürk, 1924", "Mustafa Kemal Atatürk, 1924"],
 "Große Nationalversammlung der Türkei": ["Inschrift im Plenarsaal der Großen Nationalversammlung", "TBMM Genel Kurul salonundaki yazı", "Inscription in the plenary hall of the Grand National Assembly"],
}
# Urheber ohne eigene Zeile: einfache Wortliste
UW = {
 "Zentralbank-Memorandum": ["Merkez Bankası muhtırası", "Central bank memorandum"],
 "Regierungsmanifest": ["Hükümet bildirgesi", "Government manifesto"],
 "Militärakademie Ankara": ["Kara Harp Okulu, Ankara", "Military Academy, Ankara"],
 "Gesellschaftsforum": ["Toplum Forumu", "Society Forum"],
 "Kulturkonferenz": ["Kültür Konferansı", "Culture conference"],
 "Friedensappell von Diyarbakır": ["Diyarbakır barış çağrısı", "Diyarbakır peace appeal"],
 "Raumordnungsbericht": ["Mekânsal planlama raporu", "Spatial planning report"],
 "Katastrophenforschungszentrum": ["Afet araştırma merkezi", "Disaster research centre"],
 "Haushaltsausschuss, Sitzungsprotokoll": ["Plan ve Bütçe Komisyonu, tutanak", "Budget committee, minutes"],
 "Steuerberaterkammer, Rundschreiben": ["Mali müşavirler odası, genelge", "Chamber of tax advisers, circular"],
 "Mikrofinanz-Workshop Konya": ["Mikrofinans çalıştayı, Konya", "Microfinance workshop, Konya"],
 "Pharma-Industrieausschuss": ["İlaç sanayi komitesi", "Pharmaceutical industry committee"],
 "Ingenieurkammer, Jahresbericht": ["Mühendisler odası, yıllık rapor", "Chamber of engineers, annual report"],
 "Energieforum İzmir": ["Enerji forumu, İzmir", "Energy forum, İzmir"],
 "Bergbau-Verband, Stellungnahme": ["Madencilik derneği, görüş", "Mining association, statement"],
 "Generalstab, Vorlesungsreihe": ["Genelkurmay, ders dizisi", "General Staff, lecture series"],
 "Grenzgendarmerie, Ausbildungshandbuch": ["Sınır jandarması, eğitim el kitabı", "Border gendarmerie, training manual"],
 "Heeresinspektion, Prüfbericht": ["Kara kuvvetleri teftiş raporu", "Army inspectorate, audit report"],
 "Katastrophenkommission, Abschlussbericht": ["Afet komisyonu, nihai rapor", "Disaster commission, final report"],
 "Jugendtag Ankara, Abschlussdeklaration": ["Ankara gençlik günü, sonuç bildirgesi", "Ankara youth day, final declaration"],
 "Sozialministerium, Projektstudie": ["Aile ve Sosyal Hizmetler Bakanlığı, proje çalışması", "Ministry of social affairs, project study"],
 "Provinzkulturrat, Eröffnungsrede": ["İl kültür kurulu, açılış konuşması", "Provincial culture council, opening speech"],
 "Parlamentsanfrage, Antwortvermerk": ["Meclis soru önergesi, cevap notu", "Parliamentary question, reply note"],
 "Mukhtar-Versammlung, Grußwort": ["Muhtarlar toplantısı, selamlama", "Assembly of muhtars, greeting"],
 "Historikerkommission, Protokoll": ["Tarihçiler komisyonu, tutanak", "Historians' commission, minutes"],
 "Lehrplankommission, Minderheitsvotum": ["Müfredat komisyonu, karşı oy", "Curriculum commission, dissenting opinion"],
 "Außenministerium, Planungsstab": ["Dışişleri Bakanlığı, planlama birimi", "Foreign ministry, policy planning staff"],
 "Gemeinsame Parlamentskommission": ["Karma parlamento komisyonu", "Joint parliamentary committee"],
 "Mediationszentrum, Gründungsdeklaration": ["Arabuluculuk merkezi, kuruluş bildirgesi", "Mediation centre, founding declaration"],
 "Organisationsgipfel, Abschlusserklärung": ["Teşkilat zirvesi, sonuç bildirgesi", "Organisation summit, final declaration"],
 "UN-Korrespondent, Analysebrief": ["BM muhabiri, analiz mektubu", "UN correspondent, analysis letter"],
 "Energie-Planungsstab, Lagepapier": ["Enerji planlama birimi, durum raporu", "Energy planning staff, situation paper"],
 "Digitalisierungsrat, Gründungsnotiz": ["Dijitalleşme kurulu, kuruluş notu", "Digitalisation council, founding note"],
 "Ombudsbericht, Vorwort": ["Kamu denetçiliği raporu, önsöz", "Ombudsman report, foreword"],
 "Verfassungsausschuss, Berichterstatter": ["Anayasa komisyonu, raportör", "Constitutional committee, rapporteur"],
 "Verfassungsausschuss, Anhörung": ["Anayasa komisyonu, oturum", "Constitutional committee, hearing"],
 "Kommunalversammlung, Beschlussvorlage": ["Belediye meclisi, karar taslağı", "Municipal assembly, draft resolution"],
 "Innenministerium, Krisenübung": ["İçişleri Bakanlığı, kriz tatbikatı", "Interior ministry, crisis exercise"],
 "Hafenverwaltung, Masterplan": ["Liman idaresi, ana plan", "Port authority, master plan"],
 "Verkehrsplanung, Korridorstudie": ["Ulaştırma planlaması, koridor çalışması", "Transport planning, corridor study"],
 "Wasserwerke, Jahreskonferenz": ["Su işleri, yıllık konferans", "Water works, annual conference"],
 "Küstenkammer, Werbekonzept": ["Kıyı odası, tanıtım planı", "Coastal chamber, promotion plan"],
 "Forstverwaltung, Risikobericht": ["Orman idaresi, risk raporu", "Forestry service, risk report"],
 "Baukommission, Standortbeschluss": ["İnşaat komisyonu, yer kararı", "Building commission, site decision"],
 "Bezirksbürgermeisterkonferenz": ["İlçe belediye başkanları toplantısı", "Conference of district mayors"],
 "Halbleiter-Konsortium, Gründungsakt": ["Yarı iletken konsorsiyumu, kuruluş senedi", "Semiconductor consortium, founding charter"],
 "Informatikfakultät, offener Brief": ["Bilgisayar fakültesi, açık mektup", "Faculty of computing, open letter"],
 "Seuchenrat, Nachbetrachtung": ["Salgın kurulu, değerlendirme", "Epidemic council, review"],
 "Energiewende-Rat, Sitzungsprotokoll": ["Enerji dönüşümü kurulu, tutanak", "Energy transition council, minutes"],
 "Rechenzentrum, Eröffnungsrede": ["Veri merkezi, açılış konuşması", "Data centre, opening speech"],
 "Weltraumagentur, Aufbauplan": ["Uzay ajansı, kuruluş planı", "Space agency, build-up plan"],
 "Hochschulrat, Jahresbericht": ["Yükseköğretim kurulu, yıllık rapor", "Higher education council, annual report"],
}
# Inhaltliche Korrekturen der Daten (KORREKTUR_GLM_WELTBEFUNDE_2026-10-06.md: TRIPP statt Pacht)
UEBER = {
 "fok_aus_zangezur": {
  "titel": ["Mittlerer Korridor über Südarmenien", "Güney Ermenistan üzerinden Orta Koridor", "Middle Corridor via southern Armenia"],
  "unter": ["Anschluss an die TRIPP-Route nach Baku und Zentralasien", "TRIPP güzergâhıyla Bakü ve Orta Asya'ya bağlantı", "Linking up with the TRIPP route to Baku and Central Asia"],
  "text": ["Die Türkei schließt ihre Bahn- und Straßennetze an die Route durch Südarmenien an, die unter armenischem Recht und mit Entwicklungsrechten der USA entsteht; Baku und Zentralasien rücken ohne Umweg über Russland oder Iran näher.",
           "Türkiye demiryolu ve karayolu ağlarını, Ermenistan hukukuna tabi olan ve ABD'nin geliştirme haklarına sahip olduğu Güney Ermenistan güzergâhına bağlar; Bakü ve Orta Asya, Rusya ya da İran üzerinden dolaşmadan yakınlaşır.",
           "Türkiye links its rail and road networks to the route through southern Armenia, built under Armenian law with US development rights; Baku and Central Asia come closer without a detour via Russia or Iran."]},
}
FIX = {"bilansosu": "bilançosu"}

AST_SATZ = {
 "wirtschaft": ["Markt oder Staat, Zinsdisziplin oder Kreditlenkung, Export oder Autarkie.", "Piyasa mı devlet mi, faiz disiplini mi kredi yönlendirmesi mi, ihracat mı kendine yeterlilik mi.", "Market or state, rate discipline or directed credit, exports or self-sufficiency."],
 "aussen": ["Europa, die Türkische Welt oder ein eigener Weg zwischen den Blöcken.", "Avrupa, Türk Dünyası ya da bloklar arasında kendi yolu.", "Europe, the Turkic world or a path of its own between the blocs."],
 "staat": ["Präsidiale Durchgriffsmacht oder ein starkes Parlament mit unabhängigen Gerichten.", "Cumhurbaşkanlığının doğrudan gücü ya da bağımsız mahkemeleriyle güçlü bir meclis.", "Presidential reach or a strong parliament with independent courts."],
 "gesellschaft": ["Laizismus oder religiöse Ordnung, Freiheitsrechte oder traditionelle Familie, Anerkennung oder Einheit.", "Laiklik mi dinî düzen mi, özgürlükler mi geleneksel aile mi, tanınma mı birlik mi.", "Secularism or religious order, liberties or the traditional family, recognition or unity."],
 "sicherheit": ["NATO oder eurasische Achse, Drohnen, Flotte, Luftabwehr und Grenze.", "NATO mu Avrasya ekseni mi; insansız hava araçları, donanma, hava savunması ve sınır.", "NATO or a Eurasian axis; drones, fleet, air defence and the border."],
 "regionen": ["Megaprojekte oder Schutz, Erdbebenfestigkeit, Bahn, Wasser und Häfen.", "Mega projeler mi koruma mı; depreme dayanıklılık, demiryolu, su ve limanlar.", "Mega-projects or protection; earthquake safety, rail, water and ports."],
 "wissen": ["Künstliche Intelligenz, Chips, Raumfahrt, Impfstoffe und die Rückkehr der Köpfe.", "Yapay zekâ, çipler, uzay, aşılar ve beyinlerin geri dönüşü.", "Artificial intelligence, chips, space, vaccines and the return of talent."],
}

UI = {
 "fokus.tab": ["Fokusbaum", "Odak ağacı", "Focus tree"],
 "fokus.ui.kopf": ["Die Agenda der Regierung: immer ein Fokus zur Zeit. Wer einen Weg geht, verschließt den Gegenweg.", "Hükümetin gündemi: her seferinde tek bir odak. Bir yolu seçen karşı yolu kapatır.", "The government's agenda: one focus at a time. Choosing a path closes the opposite one."],
 "fokus.ui.aktiv": ["Laufender Fokus", "Süren odak", "Current focus"],
 "fokus.ui.keiner": ["Kein Fokus läuft. Wählen Sie den nächsten Kurs.", "Süren bir odak yok. Sıradaki rotayı seçin.", "No focus is running. Choose the next course."],
 "fokus.ui.rest": ["noch {tage} Tage", "{tage} gün kaldı", "{tage} days left"],
 "fokus.ui.abbrechen": ["Abbrechen", "Vazgeç", "Cancel"],
 "fokus.ui.abbrechenHinweis": ["Ein Viertel des Kapitals kommt zurück, die Zeit ist verloren.", "Sermayenin dörtte biri geri gelir, zaman kaybolur.", "A quarter of the capital comes back; the time is lost."],
 "fokus.ui.beginnen": ["Fokus beginnen", "Odağı başlat", "Start focus"],
 "fokus.ui.kosten": ["{pk} Kapital · {monate, plural, one {# Monat} other {# Monate}}", "{pk} sermaye · {monate} ay", "{pk} capital · {monate, plural, one {# month} other {# months}}"],
 "fokus.ui.status.fertig": ["vollendet", "tamamlandı", "completed"],
 "fokus.ui.status.laeuft": ["läuft", "sürüyor", "running"],
 "fokus.ui.status.moeglich": ["möglich", "mümkün", "available"],
 "fokus.ui.status.ausgeschlossen": ["ausgeschlossen", "kapandı", "excluded"],
 "fokus.ui.status.gesperrt": ["gesperrt", "kilitli", "locked"],
 "fokus.ui.folgen": ["Folgen beim Abschluss", "Tamamlanınca etkileri", "Effects on completion"],
 "fokus.ui.dauer": ["Die Wirkung im Land bleibt dauerhaft bestehen.", "Ülkedeki etki kalıcıdır.", "The effect in the country is permanent."],
 "fokus.ui.reaktion": ["Wer reagiert", "Kim tepki verir", "Who reacts"],
 "fokus.ui.dafuer": ["dafür", "lehte", "in favour"],
 "fokus.ui.dagegen": ["dagegen", "aleyhte", "against"],
 "fokus.ui.partner": ["Partner {partei}: Loyalität {d}", "Ortak {partei}: sadakat {d}", "Partner {partei}: loyalty {d}"],
 "fokus.ui.keineReaktion": ["Kein Lager fühlt sich herausgefordert.", "Hiçbir kesim kendini hedef alınmış hissetmiyor.", "No camp feels challenged."],
 "fokus.ui.oeffnet": ["Bereitet vor", "Hazırlar", "Prepares"],
 "fokus.ui.gesetz": ["Gesetzesvorhaben „{name}“: Vorlage abgestimmt, mehr Ja-Stimmen", "“{name}” yasa tasarısı: metin uzlaşıldı, daha çok evet oyu", "Bill “{name}”: draft agreed, more yes votes"],
 "fokus.ui.wissen": ["Wissensbaum „{name}“: schneller", "Bilgi ağacı “{name}”: daha hızlı", "Knowledge tree “{name}”: faster"],
 "fokus.ui.forschung": ["Forschung im ganzen Wissensbaum etwas schneller", "Bilgi ağacının tamamında araştırma biraz daha hızlı", "Research across the knowledge tree somewhat faster"],
 "fokus.ui.aussen": ["Außenwirkung", "Dış etki", "Foreign effect"],
 "fokus.ui.dim.handel": ["Handel", "ticaret", "trade"],
 "fokus.ui.dim.sicherheit": ["Sicherheit", "güvenlik", "security"],
 "fokus.ui.dim.vertrauen": ["Vertrauen", "güven", "trust"],
 "fokus.ui.dim.konflikt": ["Konflikt", "gerginlik", "conflict"],
 "fokus.ui.rabatt": ["Maßnahmen zum Thema {thema}: {anteil} % weniger Kapital", "{thema} konusundaki önlemler: %{anteil} daha az sermaye", "Measures on {thema}: {anteil} % less capital"],
 "fokus.ui.sofortKapital": ["Kapital {n}", "Sermaye {n}", "Capital {n}"],
 "fokus.ui.sofortVertrauen": ["Vertrauen in die Regierung {n}", "Hükümete güven {n}", "Trust in the government {n}"],
 "fokus.ui.bedingungen": ["Voraussetzungen", "Ön koşullar", "Requirements"],
 "fokus.ui.vorgaenger": ["Vorgänger", "Öncekiler", "Prerequisites"],
 "fokus.ui.gegenweg": ["Schließt aus", "Şunu kapatır", "Excludes"],
 "fokus.ui.stempel": ["Vollendet", "Tamamlandı", "Completed"],
 "fokus.ui.schliessen": ["Schließen", "Kapat", "Close"],
 "fokus.ui.zaehler": ["{fertig} von {gesamt} vollendet · {moeglich} jetzt möglich", "{gesamt} odaktan {fertig} tamamlandı · şu an {moeglich} mümkün", "{fertig} of {gesamt} completed · {moeglich} available now"],
 "fokus.ui.legende": ["Linie: Vorgänger · gekreuzte rote Linie: Gegenwege schließen sich aus", "Çizgi: önceki odak · çarpılı kırmızı çizgi: karşı yollar birbirini kapatır", "Line: prerequisite · crossed red line: opposite paths exclude each other"],
 "fokus.ui.vollendetAm": ["vollendet am {datum}", "{datum} tarihinde tamamlandı", "completed on {datum}"],
 "fokus.ui.linie": ["Zu Ihrer Linie: {wert}", "Çizginize göre: {wert}", "Fit with your line: {wert}"],
 "fokus.ui.linie.passt": ["passt, daher günstiger", "uyuyor, bu yüzden daha ucuz", "fits, hence cheaper"],
 "fokus.ui.linie.bricht": ["bricht sie, daher teurer", "ona aykırı, bu yüzden daha pahalı", "breaks it, hence dearer"],
 "fokus.ui.linie.neutral": ["neutral", "nötr", "neutral"],
 "fokus.ui.zurStelle": ["Zur Stelle", "İlgili yere git", "Go there"],
 "fokus.ui.direkt": ["Als Gesetz auf {stufe}: {pk} Kapital", "Yasayla {stufe} düzeyine: {pk} sermaye", "As a bill to {stufe}: {pk} capital"],
 "fokus.ui.naeher": ["Näher heran", "Yakınlaştır", "Zoom in"],
 "fokus.ui.weiter": ["Weiter weg", "Uzaklaştır", "Zoom out"],
 "fokus.ui.ganz": ["Ganzer Baum", "Bütün ağaç", "Whole tree"],
 "fokus.ui.voll": ["Vollbild", "Tam ekran", "Full screen"],
 "fokus.ui.vollAus": ["Vollbild schließen", "Tam ekrandan çık", "Exit full screen"],
 "fokus.kern": ["Foki vollendet", "Tamamlanan odaklar", "Foci completed"],
 "fokus.kern.laeuft": ["läuft: {name}", "sürüyor: {name}", "running: {name}"],
 "fokus.kern.keiner": ["Kein Fokus läuft", "Süren odak yok", "No focus running"],
 "fokus.lage": ["Fokus", "Odak", "Focus"],
 "fokus.bed.min": ["{name} mindestens {min} (jetzt {jetzt})", "{name} en az {min} (şu an {jetzt})", "{name} at least {min} (now {jetzt})"],
 "fokus.bed.max": ["{name} höchstens {max} (jetzt {jetzt})", "{name} en çok {max} (şu an {jetzt})", "{name} at most {max} (now {jetzt})"],
 "fokus.bed.zwischen": ["{name} zwischen {min} und {max} (jetzt {jetzt})", "{name} {min} ile {max} arasında (şu an {jetzt})", "{name} between {min} and {max} (now {jetzt})"],
 "fokus.bed.jahr": ["ab {jahr}", "{jahr} yılından itibaren", "from {jahr}"],
 "fokus.bed.krieg": ["nur im Krieg", "yalnızca savaşta", "only at war"],
 "fokus.bed.frieden": ["nur ohne Krieg", "yalnızca savaş yokken", "only without war"],
 "fokus.bed.linie": ["passende Linie bei {achse}", "{achse} ekseninde uygun çizgi", "a matching line on {achse}"],
 "fokus.grund.ausgeschlossen": ["Ausgeschlossen: Der Gegenweg „{name}“ ist gewählt.", "Kapandı: Karşı yol “{name}” seçildi.", "Excluded: the opposite path “{name}” was chosen."],
 "fokus.grund.vorgaenger": ["Erst vollenden: {liste}.", "Önce tamamlanmalı: {liste}.", "Complete first: {liste}."],
 "fokus.grund.bedingung": ["Die Lage passt noch nicht: {liste}.", "Koşullar henüz uygun değil: {liste}.", "The situation is not ready: {liste}."],
 "fokus.grund.ende": ["Die Amtszeit ist vorbei.", "Görev süresi sona erdi.", "The term is over."],
 "fokus.grund.belegt": ["Es läuft schon ein Fokus: „{name}“.", "Zaten bir odak sürüyor: “{name}”.", "A focus is already running: “{name}”."],
 "fokus.grund.kapital": ["Zu wenig Kapital: {noetig} nötig, {da} vorhanden.", "Sermaye yetersiz: {noetig} gerekli, {da} mevcut.", "Not enough capital: {noetig} needed, {da} available."],
 "fokus.grund.unbekannt": ["Diesen Fokus gibt es nicht.", "Böyle bir odak yok.", "No such focus."],
 "fokus.grund.keinAktiver": ["Es läuft kein Fokus.", "Süren bir odak yok.", "No focus is running."],
 "fokus.satz.aktiv": ["Die Regierung verfolgt „{name}“, noch etwa {monate, plural, one {# Monat} other {# Monate}}.", "Hükümet “{name}” odağını sürdürüyor; yaklaşık {monate} ay kaldı.", "The government is pursuing “{name}”, about {monate, plural, one {# month} other {# months}} to go."],
 "fokus.satz.frei": ["Kein Fokus läuft: {n, plural, one {# Weg ist} other {# Wege sind}} jetzt offen.", "Süren odak yok: şu an {n} yol açık.", "No focus is running: {n, plural, one {# path is} other {# paths are}} open now."],
 "fokus.satz.nichts": ["Kein Fokus ist gerade möglich.", "Şu an mümkün bir odak yok.", "No focus is possible right now."],
 "fokus.log.beginnt": ["Fokus begonnen: {name}.", "Odak başladı: {name}.", "Focus started: {name}."],
 "fokus.log.kostet": ["{pk} Kapital, etwa {monate} Monate bis zum Abschluss.", "{pk} sermaye, tamamlanmasına yaklaşık {monate} ay.", "{pk} capital, about {monate} months to completion."],
 "fokus.log.abgebrochen": ["Fokus abgebrochen: {name}. {pk} Kapital zurück.", "Odaktan vazgeçildi: {name}. {pk} sermaye geri geldi.", "Focus cancelled: {name}. {pk} capital returned."],
 "fokus.log.vollendet": ["Fokus vollendet: {name}", "Odak tamamlandı: {name}", "Focus completed: {name}"],
 "fokus.partner.plus": ["Die Partei sieht sich im Fokus „{name}“ bestätigt.", "Parti “{name}” odağında kendini haklı görüyor.", "The party feels vindicated by the focus “{name}”."],
 "fokus.partner.minus": ["Die Partei sieht ihre Linie im Fokus „{name}“ verlassen.", "Parti “{name}” odağında çizgisinden sapıldığını düşünüyor.", "The party sees its line abandoned in the focus “{name}”."],
 "fokus.zitat": ["„{text}“ ({von})", "“{text}” ({von})", "“{text}” ({von})"],
}

SPR = ["de", "tr", "en"]
out = {s: {} for s in SPR}
for i, s in enumerate(SPR):
    for k, v in UI.items(): out[s][k] = v[i]
    for a, meta in d["aeste"].items():
        out[s][f"fokus.ast.{a}.name"] = [meta["titel"], meta["titelTr"], meta["titelEn"]][i]
        out[s][f"fokus.ast.{a}.satz"] = AST_SATZ[a][i]
    for f in d["foki"]:
        fid = f["id"]; ue = UEBER.get(fid, {})
        tx = {"titel": f["t"][i], "unter": f["u"][i], "text": f["b"][i]}
        for k in tx:
            if k in ue: tx[k] = ue[k][i]
            for a, b in FIX.items(): tx[k] = tx[k].replace(a, b)
            out[s][f"fokus.f.{fid}.{k}"] = tx[k]
        if f["z"]:
            out[s][f"fokus.f.{fid}.zitat"] = Z[fid][i]
            u = f["z"]["urheber"]
            out[s][f"fokus.f.{fid}.urheber"] = U[u][i] if u in U else (u if i == 0 else UW[u][i - 1])
for s in SPR:
    p = os.path.join(KAT, s, "fokus.json")
    open(p, "w").write(json.dumps(out[s], ensure_ascii=False, indent=1) + "\n")
    print(s, len(out[s]))
