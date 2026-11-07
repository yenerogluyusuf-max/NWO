# A3: Die Außenwerkzeuge (Gesten, Vermittlung, EU, Blöcke, Instrumente)

Stand 06.11.2026 abends. Arbeitskopie auf Stand b0ce3f3, Port 5233 (beides abgeräumt). Am Projekt wurde kein Code geändert. Die Messungen liefen in zwei Wegwerf-Tests in der Arbeitskopie. Ihre Rohdaten liegen unter `mess/messung.json` und `mess/messung2.json`, die Tests und das Browserskript ebenfalls in `mess/`.

Bilder: `bilder/i*.png` zeigen den Spielstand des Inhabers (Defne Işık, 3. August 2043), `bilder/f*.png` ein frisches Spiel (Juni 2028).

---

## 1. Kurzfassung: die fünf wichtigsten Befunde

1. **Die Bereiche melden sich nie mit einer Entscheidung. Wo das Ausland auf den Schreibtisch kam, hat der Inhaber jedes Mal entschieden.**
   - Von 198 Vorlagen in 15 Jahren betrafen 36 das Ausland. Alle wurden beantwortet: Krisen im Ausland 10, Machtwechsel 12, Forderungen und Angebote von Ländern 12, EU-Gesprächsangebot 1, NATO-Beitritt Georgiens 1.
   - Aus den fünf Bereichen kam keine einzige Vorlage. Gründe:
     - Gesten haben gar keine.
     - Die Vermittlung meldet sich nur mit einem Hinweis, nicht mit einer Karte.
     - Der EU-Fortschrittsbericht ist ein Hinweis ohne Antwort.
     - Die Vorlagen für EU-Veto und Zollunion erscheinen erst nach dem Auftauen, also nie.
   - Den NATO-Gipfel, die UN-Generalversammlung, den Gipfel der Turkstaaten und die G20 zeigt der Schreibtisch jedes Jahr als Termin. Es gibt dort aber nichts zu entscheiden (`sim/diplomatie.ts:765`, `ui/schreibtisch/briefing.ts:490`).
2. **Die Wirkung kommt bei den Wählern nicht an.**
   - „Ansehen“ hat im Politiknetz nur zwei Ausgänge: Tourismus 0,02 und Nationalisten 0,02. Zum Vertrauen in die Regierung führt keine Kante (`netz-kanten.csv`).
   - Gemessen nach 12 Monaten, Mittel über 4 Welten, Veränderung der Zielzustimmung:

     | Handlung | Kosten | Zielzustimmung |
     |---|---|---|
     | Arbeitstreffen EU | 3 Kapital | +0,01 Punkte |
     | BRICS-Partnerschaft | | 0 |
     | Gelungene Vermittlung | | −0,06 (Rauschen) |
     | Gesetz Renten +10 | 4 Kapital | +0,09 |
     | Gesetz Renten +30 | | +0,29 |

   - Sichtbar bewegt sich nur der Balken „Vertrauen“ des Landes in der Länderakte. Dorthin geht man aber nur, wenn man ohnehin schaut.
3. **Der Weg in die EU hat eine versteckte Bedingung, und sein Startzustand ist falsch.**
   - Das Reformpaket lässt sich erst ankündigen, wenn die Maßnahme „Annäherung an die EU“ bei mindestens 55 steht (`sim/eu.ts:443`). Sie startet bei 35 und stand beim Inhaber nach 15 Jahren immer noch bei 35.
   - Die Oberfläche nennt die Bedingung, verlinkt aber nicht zur Maßnahme (Bild i04). Das Gesetz kostet 10 Kapital, im Erlass 20.
   - Im Spiel sind alle 10 Kapitel „zu“. Tatsächlich sind seit 2005 16 Kapitel eröffnet, Kapitel 25 ist vorläufig geschlossen. Darunter sind 4 der 10 Spielkapitel: 12 (2010), 17 (2015), 27 (2009) und 33 (2016) (ab.gov.tr).
   - Die EU kam siebenmal mit der Forderung „Reformzusage: Justiz“ auf den Schreibtisch. Der Inhaber lehnte jedes Mal ab, denn die Karte sagt nicht, was die Zusage auf dem Weg nach Europa freischaltet.
4. **Dieselbe Handlung liegt an drei Orten, und die Aufrufe haben bis zu fünf Ebenen.**
   - Den Besuch gibt es dreifach:
     - „Arbeitstreffen“ unter Gesten
     - „Staatsbesuch“ unter Weltlage › Instrumente
     - Vertrag am Verhandlungstisch
   - Das Handelsabkommen gibt es zweimal, als Geste und als Vertrag.
   - Sanktionen, Botschafter, Rückführung, Grenzsicherung und Friedensschritt stecken unter Außen › Weltlage › Instrumente, mit zwei Auswahllisten je Karte (Bild i21). Rückführung, Grenzsicherung und Friedensschritt sind Innenpolitik.
   - Textmenge: Vermittlung 404 Wörter, Weltlage 659, EU-Beitritt 364, NATO 58 ohne eine einzige Handlung.
5. **Der Inhaber hat die Bereiche öfter berührt als gedacht, aber nur, solange es wenig Aufwand war.**
   - Gesten: mindestens 8. Das Feld `zuletzt` hält je Art nur den letzten Tag: EU, Russland ×2, Iran, Armenien, Zypern, Israel.
   - Eine Vermittlung: Ukraine–Russland 2035, gelungen und seither „stabilisiert“.
   - Libyen stand 2043 bei 77 % Aussicht und wurde nie angefasst: kein Hinweis auf dem Schreibtisch und kein Preis, der lockt.
   - Instrumente: 0 (`aussen.berichte` ist leer, `besuche` ist leer).
   - BRICS und Gipfel der Turkstaaten: 0.
   - EU: Das Spiel blieb 15 Jahre in „eingefroren“, das Vertrauen der EU fiel auf 0 (Bild i02).

---

## 2. Ist-Zustand mit Bildern

### 2.1 Wo die Bereiche liegen

Der Weg zu jedem Bereich, mit der Zahl der Klicks:

| Bereich | Weg | Klicks bis zur Handlung | Wörter im Blatt |
|---|---|---|---|
| Gesten | Außen › Staaten › Land › Reiter „Gesten“ | 3 | 143 |
| Staatsbesuch, Botschafter, Sanktion | Außen › Weltlage › Instrumente › Land wählen › Agenda wählen › Ausführen | 5 bis 6 | 330 |
| Vermittlung | Außen › Vermittlung › Konflikt › nach unten scrollen › Vermitteln | 3 bis 4, mit Scrollen | 404 |
| EU | Außen › EU › Reiter „★ Beitritt“ › Knopf gesperrt › Maßnahme selbst in der Politik suchen | 3 plus Suche | 364 |
| Blöcke | Außen › Blöcke › Block › einziger Knopf (nur BRICS und Turkstaaten) | 3 | 58 bis 210 |

Bilder:
- **Spielstand des Inhabers:**
  - `i02-aussen.png`: Außen, EU vorausgewählt, Vertrauen 0, „feindselig“.
  - `i03-gesten-eu.png`: vier Gesten, eine Zeile Wirkung, keine Zahlen.
  - `i04-beitritt-eu.png` bis `i07`: der gesperrte Knopf, Zypern-Kopplung, 10 Kapitel „zu“.
  - `i13-nato.png`: NATO als Mitgliederliste ohne Handlung.
  - `i15-brics.png`, `i16-ots.png`: je ein Knopf.
  - `i17` bis `i19-vermittlung.png`: Konfliktkarten, zwei Spalten Forderungen, rote Linien, Garantien. Libyen steht bei Reife 43.
  - `i20-weltlage.png`: Lage. `i21` bis `i23-instrumente.png`: acht Karten mit Auswahllisten. `i24-verlauf.png`.
- **Frisches Spiel:**
  - `f01-schreibtisch.png`: Termin „NATO-Gipfel 15. Juli 2028“ ohne Handlung.
  - `f04-gipfel-eu-folge.png`: Rückmeldung einer Geste: ein Satz, Vertrauen 49, sonst nichts.
  - `f09-ots-gipfel.png`: Gipfel der Turkstaaten. Ein Satz Rückmeldung, Kopfleiste unverändert.
  - `f12-schreibtisch-nach.png`: Der Schreibtisch nach drei Außenhandlungen ist unverändert.

### 2.2 Was die Handlungen im Code tun

| Handlung | Preis | Wirkung (Datei:Zeile) |
|---|---|---|
| Arbeitstreffen (Geste) | 3 Kapital, 8 Aufmerksamkeit, 120 Tage Pause | Vertrauen +8, Konflikt −3, Ansehen +1 (`sim/laender.ts:507`) |
| Handelsabkommen (Geste) | 5 Kapital | Handel +12, Export +2; EU und USA verlangen eine Zusage (`sim/laender.ts:513`) |
| Staatsbesuch (Instrument) | 6 Kapital, 12 Aufmerksamkeit | Vertrauen +4, je nach Agenda Handel +8, Export +0,3 … (`sim/diplomatie.ts:640`) |
| Sanktion (Instrument) | 4 Kapital | Handel −15, Konflikt +10, Export −0,3; starke Staaten antworten mit Gegensanktion (`sim/diplomatie.ts:684`) |
| Vermitteln | 5 bis 6 Kapital | Bei Erfolg Ansehen +4, Vertrauen +1, Parteien +5; bei Scheitern Ansehen −1 (`sim/vermittlung.ts:389`, `VERMITTLUNG.erfolg` Z. 79) |
| EU-Reformpaket | 6 Kapital, nur ab „Annäherung“ 55 | Screening 365 Tage, danach Kapitel nach Kriterien, höchstens 2 parallel, je 2 bis 3 Jahre (`sim/eu.ts:47`, `:459`, `:768`) |
| Zollunion | Vorlage nach 3 geschlossenen Kapiteln | Export +4, Risikoaufschlag −40, Landwirte −3 (`sim/eu.ts:523`) |
| BRICS-Partner | 6 Kapital | 16 westliche Staaten Vertrauen −4 bis −6, Auslandskapital −1,5 (`sim/welt-bloecke.ts:211`) |
| Gipfel der Turkstaaten | 3 Kapital, 180 Tage Pause | Mitglieder Vertrauen +4, Handel +3, Export +0,6 (`sim/welt-bloecke.ts:240`) |

**Zum Vergleich der Preise:**
- Das Kapitaleinkommen beträgt 10,9 je Monat beim Start und 9,2 beim Inhaber 2043 (`kapitalEinkommen`, `sim/spiel.ts:332`).
- Ein Gesetz wie Renten +10 kostet 4 Kapital (`pruefeVorhaben`).
- Die Preise liegen also gleich auf. Den Unterschied macht allein die Wirkung.

### 2.3 Gemessene Wirkung

Gemessen wurde die Zielzustimmung (`zielZustimmung`, `sim/spiel.ts:179`). Sie ergibt sich aus 0,45 × Vertrauen in die Regierung + 0,25 × Gruppen + 0,3 × Wirtschaft. Die Werte sind Abweichungen von der Grundlinie ohne Handlung, gemittelt über die Seeds 42042, 7, 11 und 23.

| Handlung | sofort | 6 Monate | 12 Monate | 36 Monate* |
|---|---|---|---|---|
| Arbeitstreffen EU | 0,00 | 0,00 | +0,01 | +0,85 |
| Handelsabkommen USA | 0,00 | +0,01 | −0,20 | +0,64 |
| Gesetz Renten +10 | −0,03 | −0,01 | +0,09 | +0,64 |
| Gesetz Renten +30 | −0,10 | −0,03 | +0,29 | +0,56 |
| Zollunion (Antwort „annehmen“) | −0,01 | +0,03 | +0,32 | −0,28 |
| Visafreiheit (Wirkung aus `visaPruefen`) | +0,11 | +0,09 | +0,08 | +0,81 |
| Vermittlung gelungen (Armenien–Aserbaidschan) | 0,00 | 0,00 | −0,06 | −0,03 |

\* Nach 36 Monaten überdeckt das Auseinanderlaufen der Welten (Ereignisse, Zufall) die Wirkung; die Spalte ist Rauschen von etwa ±1 Punkt.

**Lesart:**
- Nach einem Jahr bewegt keine Außenhandlung die Zustimmung messbar. Ein mittleres Rentengesetz bewegt sie wenig, aber in der richtigen Richtung, und der Wirkungsbericht der Politik zeigt es den Gruppen.
- Die größte Außenwirkung haben Zollunion und Visafreiheit. Beide liegen beim heutigen Aufbau Jahre entfernt.
- Die gelungene Vermittlung bringt der eigenen Regierung nichts: Ansehen +4 erreicht die Wähler nicht.

### 2.4 Was der Inhaber getan hat (Spielstand 2043)

Gezählt aus `s2043.json`:
- **Chronik:** 896 Einträge, darunter 198 Vorlagen.
- **Länderzustand `zuletzt`:**
  - EU Arbeitstreffen am Tag 1736.
  - Russland Arbeitstreffen und Handel am Tag 57.
  - Iran Arbeitstreffen am Tag 57.
  - Armenien Arbeitstreffen am Tag 3316.
  - Zypern Arbeitstreffen am Tag 422.
  - Israel Druck am Tag 5476.
- **Vermittlung:** `vermittelt: {ukr_rus: 2648}`. In keinem der vier Konflikte wurde vorbereitet. Stand 2043:

  | Konflikt | Reife | Aussicht |
  |---|---|---|
  | Libyen | 43 | 77 % (nie genutzt) |
  | Israel–Iran | 77 | 8 %, Israel misstraut |
  | Armenien–Aserbaidschan | 19 | 8 % |

- **Weltlage:** `besuche {}`, `abberufen []`, `eigeneSanktionen []`, `berichte []`.
- **EU:**
  - Phase „eingefroren“, „Annäherung“ bei 35, Vertrauen der EU 0.
  - Acht Fortschrittsberichte nennen Kapitel 12, 27, 11 und 31 „bereit zur Eröffnung, sobald ein Verhandlungsplatz frei wird“. Der Platz wird nie frei, weil die Phase eingefroren bleibt.
- **Vorlagen aus dem Ausland, alle beantwortet:** `welt_machtwechsel` 12, `welt_krise` 10 (Hilfe oder Grenze), `land_fordert` 6 und `land_angebot` 6, `eu_angebot` 1, `nato_ratifizierung` 1 (Georgien blockiert).

### 2.5 Vergleich: Warum der Verhandlungstisch genutzt wird (18 Verträge, 7 laufen 2043)

- **Er meldet sich:**
  - Länder schicken Angebote und Forderungen als Vorlage (`land_angebot`, `land_fordert`).
  - Auslaufende Verträge erinnern (`vertrag_verlaengerung`).
- **Jede Klausel zeigt offen Preis und Wirkung** (ENTSCHEIDUNGEN Y), und die Gegenseite bewertet sie mit Gründen.
- **Die Wirkung bleibt:**
  - Ein Vertrag läuft über Jahre und wird jährlich geprüft.
  - Bruch hat ein Gedächtnis.
  - Die Kopfleiste zeigt „Laufende Verträge“.
- **Gegenprobe:** Die Gesten wirken einmal, klingen ab und hinterlassen nur eine Zeile in der Erinnerung des Landes (`sim/laender.ts:486`).

---

## 3. Ursachen, gemessen

| Mögliche Ursache | Befund | Beleg |
|---|---|---|
| Wird nicht gefunden | **teils.** Gesten, Vermittlung und Blöcke liegen sichtbar unter „Außen“. Die Instrumente (Sanktion, Botschafter, Staatsbesuch) liegen drei Ebenen tief in „Weltlage“. Die EU-Bedingung liegt in einem anderen Bereich (Politik) und ist nicht verlinkt | Bilder i02, i04, i21; `ui/Welt.tsx:44`, `ui/welt/Aussenlage.tsx:49` |
| Unklar, was es bringt | **ja.** Gesten nennen eine Richtung, aber keine Zahl. Der Gipfel der Turkstaaten meldet einen Satz zurück. Die EU-Forderung „Reformzusage“ sagt nicht, welches Kapitel oder Visa-Kriterium sie bewegt | Bilder i03, f04, f09; Chronik 7× „Ablehnen“ |
| Wirkung zu klein oder unsichtbar | **ja, Hauptursache.** Kein Weg von Ansehen oder Beziehungen zur Zustimmung. Messung: +0,01 nach 12 Monaten gegen +0,09 bis +0,29 beim Gesetz. Wirkungsberichte gibt es nur für die Instrumente, nicht für Gesten, Vermittlung, EU und Blöcke | §2.3; `sim/diplomatie.ts:456`; `netz-kanten.csv` |
| Zu viel Text | **ja**, bei Vermittlung (404 Wörter je Konflikt, zwei Spalten Forderungen und rote Linien) und Weltlage (659) | Bilder i17 bis i19, i20 |
| Zu viele Klicks | **ja**, bei den Instrumenten: 5 bis 6 mit zwei Auswahllisten. Die EU ist ohne Suche gar nicht erreichbar | §2.1 |
| Meldet sich nie | **ja, Hauptursache.** Null Vorlagen aus den fünf Bereichen in 15 Jahren. Die Gipfel stehen als Termin ohne Entscheidung im Kalender | §2.4; `sim/diplomatie.ts:765` |
| Nicht nötig, um zu gewinnen | **ja.** Der Inhaber regiert 2043 mit 61 % Zustimmung ohne diese Bereiche. Ansehen zählt nur für große Ziele (`sim/grosseziele.ts:119` ff.) und die Aussicht der Vermittlung | Spielstand |

---

## 4. Recherche: was die echte Türkei hat (mit Quellen)

Jede Zahl im Plan stammt aus dieser Liste oder heißt „Spielparameter“.

### 4.1 EU

- **Verhandlungen:**
  - Kandidat seit Helsinki im Dezember 1999. Verhandlungen eröffnet am 03.10.2005 ([Kommission, Länderseite](https://enlargement.ec.europa.eu/countries/turkiye_en)).
  - **16 von 35 Kapiteln eröffnet, Kapitel 25 vorläufig geschlossen** ([ab.gov.tr, Stand 23.01.2024](https://www.ab.gov.tr/current-situation_65_en.html); [EU-Delegation](https://www.eeas.europa.eu/delegations/t%C3%BCrkiye/current-status_en)). Die eröffneten Kapitel mit Datum:

    | Kapitel | eröffnet |
    |---|---|
    | 4 | 19.12.2008 |
    | 6 | 17.06.2008 |
    | 7 | 17.06.2008 |
    | 10 | 19.12.2008 |
    | 12 | 30.06.2010 |
    | 16 | 30.06.2009 |
    | 17 | 14.12.2015 |
    | 18 | 26.06.2007 |
    | 20 | 29.03.2007 |
    | 21 | 19.12.2007 |
    | 22 | 05.11.2013 |
    | 25 | 12.06.2006, am selben Tag vorläufig geschlossen |
    | 27 | 21.12.2009 |
    | 28 | 19.12.2007 |
    | 32 | 26.06.2007 |
    | 33 | 30.06.2016 |

- **Blockaden:**
  - Ratsbeschluss vom 11.12.2006: 8 Kapitel (1, 3, 9, 11, 13, 14, 29, 30) werden nicht eröffnet, bis die Türkei das Zusatzprotokoll auf Zypern anwendet ([Rat, Dok. 16289/06](https://data.consilium.europa.eu/doc/document/ST-16289-2006-INIT/en/pdf)).
  - Zypern blockiert 6 Kapitel: 2, 15, 23, 24, 26, 31 (ab.gov.tr).
  - Frankreich blockierte 2007 die Kapitel 11, 17, 22, 33 und 34. Dafür gibt es nur eine Sekundärquelle ([TEPAV 2011](https://www.tepav.org.tr/upload/files/haber/1299080994-8.Turkey_s_Accession_Negotiations_with_the_EU.pdf)).
- **Stillstand:**
  - Rat vom 26.06.2018, Ziffer 35: „effectively come to a standstill … no further chapters … no further work towards the modernisation of the EU-Turkey Customs Union“ ([Dok. 10555/18](https://data.consilium.europa.eu/doc/document/ST-10555-2018-INIT/en/pdf)).
  - Im Dezember 2016 gab es keine Einstimmigkeit. Der Vorsitz erklärte: keine neuen Kapitel. Das ist nur sekundär belegt ([Turkish Minute, 13.12.2016](https://turkishminute.com/2016/12/13/eu-will-not-open-new-chapters-turkey/)).
  - Das Europäische Parlament forderte am 24.11.2016 ein Einfrieren ([EUR-Lex 52016IP0450](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52016IP0450)) und empfahl am 13.03.2019 die förmliche Aussetzung ([EUR-Lex 52019IP0200](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52019IP0200)).
- **Neuere Stände:**
  - Gemeinsame Mitteilung JOIN(2023) 50 vom 29.11.2023: „progressive, proportionate and reversible“. Darin stehen die Bedingungen für die Modernisierung der Zollunion: Umgehung der Russland-Sanktionen unterbinden, Handelshemmnisse abbauen, günstiges Umfeld für Zypern-Gespräche ([Kommission](https://enlargement.ec.europa.eu/document/download/16679fa1-cb73-4481-bc02-e3620b8c6dd3_en)).
  - **Fortschrittsberichte 2025 und 2026** ([2025](https://enlargement.ec.europa.eu/turkiye-report-2025_en), [2026](https://enlargement.ec.europa.eu/turkiye-report-2026_en)):
    - Rechtsstaat, Justiz, Korruption und Medien stehen bei „early stage“, teils mit Rückschritten.
    - Die Marktwirtschaft ist „well advanced“.
    - Die Angleichung an die Außenpolitik der EU liegt bei 4 % (2026).
- **Zollunion:**
  - Beschluss 1/95, in Kraft seit 31.12.1995. Sie gilt für gewerbliche Waren, nicht für Landwirtschaft, Dienstleistungen und öffentliche Beschaffung ([EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:21996D0213(01)); [IP/16/4468](https://ec.europa.eu/commission/presscorner/detail/en/ip_16_4468)).
  - Die Türkei übernimmt die Handelspolitik der EU, ohne an deren Freihandelsabkommen beteiligt zu sein. Folgenabschätzung SWD(2016) 475, Szenario „Zollunion plus Freihandelsabkommen“: **BIP der Türkei +1,44 %, Wohlfahrt +12,5 Mrd. €** ([SWD(2016) 475](https://ec.europa.eu/smart-regulation/impact/ia_carried_out/docs/ia_2016/swd_2016_0475_en.pdf)).
  - Die Kommission bat am 21.12.2016 um ein Mandat. Der Rat hat es bis heute nicht erteilt.
  - Handel 2025: 217,6 Mrd. €. 42,7 % der türkischen Exporte gehen in die EU ([DG Trade](https://policy.trade.ec.europa.eu/eu-trade-relationships-country-and-region/countries-and-regions/turkiye_en)).
- **Visa:**
  - Der Dialog begann am 16.12.2013 und umfasst 72 Kriterien. Am 04.05.2016 waren 7 offen ([COM(2016) 278](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52016DC0278)).
  - Seit 2023 sind 6 Kriterien offen: Europol-Abkommen, Datenschutz, Korruptionsprävention (GRECO), Justizkooperation, Terrorismusrecht, Rückübernahme von Drittstaatlern (JOIN(2023) 50).
  - Bericht 2026: „no progress“.
- **Erklärung vom 18.03.2016:**
  - 1:1-Mechanismus. Fazilität 6 Mrd. € für 2016–2019, davon bis November 2023 über 5,1 Mrd. € ausgezahlt.
  - Neu angesiedelt wurden rund 40.000 Syrer, zurückgeführt nur 2.140. Rückführungen ruhen seit März 2020.
  - Seit 2011 sind insgesamt rund 12,5 Mrd. € geflossen ([COM(2016) 231](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52016DC0231); [Kommission 06.03.2026](https://enlargement.ec.europa.eu/news/eu-refugee-support-turkiye-continues-under-new-phase-facility-refugees-concludes-2026-03-06_en); Bericht 2026).
- **Was Ankara tun müsste** (Berichte 2025 und 2026, Dok. 10555/18):
  - Zusatzprotokoll auf Zypern anwenden.
  - Richterrat HSK umbauen.
  - EGMR-Urteile Kavala und Demirtaş umsetzen.
  - Anti-Terror-Gesetz angleichen.
  - Antikorruptionsstrategie mit GRECO.
  - Datenschutz, dann Europol- und Eurojust-Abkommen.
  - Rückführungen von den Inseln wieder aufnehmen.
- **Was Ankara bekäme:**
  - Mandat für die Zollunion, Visafreiheit, Kapitel erst nach Aufhebung des Beschlusses von 2018.
  - IPA III: 221 Mio. € im Jahr 2022.
  - Investitionsplattform bis 1,6 Mrd. €.
  - Möglicher Zugang zum Zahlungsraum SEPA (gemeinsame Erklärung vom 30.06.2026).
- **Dialoge:**
  - Handel: 08.07.2024, 01.07.2025, 13.10.2026.
  - Wirtschaft: April 2025, Juli 2026.
  - Der Assoziationsrat bleibt ausgesetzt.

### 4.2 Vermittlung

- **Getreideinitiative** (22.07.2022 bis 17.07.2023):
  - Koordinierungszentrum in Istanbul. 32,9 Mio. t Nahrungsmittel, 1.004 Fahrten, Lieferungen in 45 Länder ([UN](https://www.un.org/en/black-sea-grain-initiative), [UN-Bilanz 14.11.2023](https://www.un.org/fr/node/211659)).
  - Ende durch Russlands Rückzug ([Reuters/Dawn 17.07.2023](https://www.dawn.com/news/1765394)). In Sotschi am 04.09.2023 nicht wiederbelebt ([Bloomberg](https://www.bloomberg.com/news/articles/2023-09-04/erdogan-eyes-progess-on-black-sea-grain-from-putin-ahead-of-g20)).
- **Russland–Ukraine:**
  - Antalya, 10.03.2022: kein Ergebnis ([Al-Monitor](https://www.al-monitor.com/originals/2022/03/ukraine-russia-make-no-progress-cease-fire-talks-turkey)).
  - Istanbul, 29.03.2022: Istanbul-Kommuniqué mit 11 Punkten, die Türkei unter den Garanten ([Evropeiska Pravda](https://www.eurointegration.com.ua/eng/articles/2022/03/30/7136915/)).
  - Istanbul, 16.05.2025: 1.000 gegen 1.000 Gefangene ([Kyiv Independent](https://kyivindependent.com/russia-ukraine-agree-on-1-000-for-1-000-pow-exchange-in-istanbul-umerov-says/)).
  - Istanbul, 02.06.2025: je mindestens 1.200 Gefangene und je 6.000 Gefallene ([Al Jazeera](https://www.aljazeera.com/news/2025/6/2/russia-and-ukraine-agree-to-prisoner-swap-but-peace-talks-stall-in-istanbul)).
  - Istanbul, 23.07.2025: rund 40 Minuten, keine Waffenruhe ([bne IntelliNews](https://www.intellinews.com/russia-and-ukraine-agree-to-expand-prisoner-exchanges-at-third-istanbul-talks-no-progress-on-ceasefire-392452/)).
- **Gefangenenaustausch:**
  - September 2022: 215 Personen frei, 5 Asow-Kommandeure in Obhut der Türkei. Nach deren Heimkehr im Juli 2023 warf der Kreml der Türkei Wortbruch vor ([RFE/RL](https://www.rferl.org/amp/ukraine-russia-prisoner-swap-azovstal/32045591.html), [Kyiv Independent](https://kyivindependent.com/putins-spokesperson-blames-ukraine-turkey-for-violating-agreement-as-azovstal-commanders-return-home/)).
  - 01.08.2024 in Ankara, koordiniert vom MIT: 26 Personen aus 7 Ländern ([Daily Sabah](https://www.dailysabah.com/politics/diplomacy/turkiye-coordinates-historic-russia-us-prisoner-swap-in-ankara/amp)).
- **Somalia–Äthiopien:**
  - Auslöser war das Memorandum Äthiopiens mit Somaliland vom 01.01.2024.
  - Runden am 01.07. und 12.08.2024 unter Außenminister Fidan.
  - Ankara-Erklärung vom 11.12.2024: Meereszugang für Äthiopien unter somalischer Hoheit ([Al Jazeera](https://www.aljazeera.com/news/2024/12/12/somalia-ethiopia-agree-on-compromise-to-end-tension-turkish-leader-says)).
  - Technische Runde am 17.02.2025 ([allAfrica](https://allafrica.com/stories/202502190338.html)).
- **Weitere Fälle:**
  - Teheraner Erklärung vom 17.05.2010. Sicherheitsratsresolution 1929 am 09.06.2010 gegen die Stimmen der Türkei und Brasiliens ([UN](https://press.un.org/en/node/163174)).
  - Libyen: Memoranden vom 27.11.2019 ([Al Jazeera](https://www.aljazeera.com/news/2019/12/turkish-parliament-ratifies-security-deal-libya-state-media-191221145918122.html)). Annäherung an Haftar 2025 ([Defense News](https://www.defensenews.com/global/mideast-africa/2025/04/15/saddam-haftars-visit-to-ankara-marks-shift-in-turkeys-libya-policy/)).
  - Armenien: Grenzöffnung für Drittstaatler am 01.07.2022 vereinbart, nicht umgesetzt ([JAMnews](https://jam-news.net/?p=154285)).
  - Gaza: Garantieerklärung vom 13.10.2025, unterzeichnet von USA, Ägypten, Katar und Türkei ([Hürriyet Daily News](https://www.hurriyetdailynews.com/turkiye-us-egypt-qatar-sign-gaza-declaration-214643)).
  - Pakistan–Afghanistan: Waffenruhe im Oktober 2025 mit Katar. Die Istanbul-Runde ab 06.11.2025 scheiterte ([Dawn](https://www.dawn.com/news/1953698/talks-between-pakistan-afghan-taliban-are-over-khawaja-asif)).
- **Kosten und Nutzen:**
  - Kosten: Vorwurf der Parteilichkeit (Israel), Vorwurf des Wortbruchs (Kreml, Asow), Bruch mit dem Westen 2010.
  - Nutzen: Platz am Tisch, öffentliches Lob (Trump, Gaza), Einfluss in Libyen, Syrien und Somalia.
  - Geldbeträge sind nirgends beziffert. Eine ursächliche Handelswirkung ist nicht belegt (Lücke).

### 4.3 Gesten (symbolische Diplomatie)

- **Staatsbesuch mit Ertrag:**
  - Golfreise vom 17. bis 19.07.2023: Abkommen mit den VAE über 50,7 Mrd. $ (Schätzung der Agentur WAM) ([Hürriyet Daily News](https://hurriyetdailynews.com/finance-chief-heralds-50-7-billion-deals-with-uae-as-erdogan-tours-gulf-nations-184848)).
  - Weißes Haus am 25.09.2025: kein Durchbruch bei der F-35; am Tag darauf eine Boeing-Bestellung bis 225 Maschinen ([Cyprus Mail](https://cyprus-mail.com/2025/09/26/trump-erdogan-signal-closer-us-turkey-ties-amid-shifts-on-russian-oil-f-35-jets-purchase-back-on-the-table)).
- **Botschafter:**
  - Rückruf aus Israel „zu Konsultationen“ am 04.11.2023 ([MFA Pressemitteilung 283](https://jerusalem-cg.mfa.gov.tr/Mission/ShowAnnouncement/407174)).
  - Drohung, 10 Botschafter auszuweisen (23.10.2021, Kavala). Sie wurde am 25.10. nach einer Erklärung zu Art. 41 des Wiener Übereinkommens zurückgenommen ([Rudaw](https://www.rudaw.net/english/middleeast/turkey/25102021)).
- **Staatstrauer** für Raisi (Mai 2024) und Haniyeh (02.08.2024). Israel protestierte gegen die halbmast gesetzte Flagge ([Al Arabiya](https://english.alarabiya.net/News/middle-east/2024/08/01/turkey-s-erdogan-declares-aug-2-day-of-national-mourning-over-killing-of-hamas-chief)).
- **Hilfe:**
  - Somalia seit dem Besuch in Mogadischu am 19.08.2011 ([Ahram](https://english.ahram.org.eg/News/19232.aspx)).
  - Humanitäre Hilfe 2018: 8,4 Mrd. $, laut GHA-Bericht, belegt nur über einen AA-Bericht ([AA](https://aa.com.tr/en/world/turkey-continues-to-be-ranked-among-top-donor-countries/2300237)).
- **Erdbebendiplomatie 2023:**
  - Der griechische Außenminister Dendias besuchte am 12.02.2023 das Katastrophengebiet ([The New Arab](https://www.newarab.com/news/greek-foreign-minister-visits-turkey-after-deadly-earthquake)). Es folgte die Athener Erklärung vom 07.12.2023 ([To Vima](https://www.tovima.com/politics/greece-turkey-commit-to-friendly-relations-the-athens-declaration-on-friendly-relations-and-good-neighbourliness/)).
  - Der Grenzübergang Margara–Alican zu Armenien war am 11.02.2023 offen, einmalig ([Eurasianet](https://eurasianet.org/armenia-turkey-border-opens-for-earthquake-aid-delivery)).
- **Soft Power:**
  - Yunus-Emre-Institut: 92 Zentren in 68 Ländern ([Daily Sabah](https://www.dailysabah.com/turkiye/yunus-emre-institute-hosts-over-1000-cultural-events-worldwide-in-2024/news/amp)).
  - Türkiye-Stipendien: rund 5.000 im Jahr ([YTB](https://dkp.ytb.gov.tr/en/departments/international-students)).
- **Lehre für das Spiel:** Gesten wirken in der Wirklichkeit fast immer als **Antwort auf einen Anlass** (Beben, Tod, Krise, Kränkung) oder als **Besuch mit Abschlüssen**, nicht als Knopf ohne Anlass.

### 4.4 Blöcke und Sanktionen

- **NATO:**
  - Die Türkei hat Artikel 4 beantragt:
    - 2003 (Irak)
    - 2012 zweimal (Syrien; Patriot-Zusage am 04.12.2012) ([NATO 2012](https://www.nato.int/cps/en/natohq/news_88599.htm))
    - 28.07.2015 ([NATO 2015](https://www.nato.int/cps/en/natohq/news_121939.htm))
    - 28.02.2020 (Idlib, nur sekundär belegt)
  - **Veto als Hebel:**
    - Dreiseitiges Memorandum von Madrid, 28.06.2022 ([Regierung Schweden](https://www.government.se/globalassets/government/dokument/utrikesdepartementet/220628-trilat-memo.pdf)).
    - Die TBMM ratifizierte Finnland am 30.03.2023 mit 276:0 ([Al Jazeera](https://www.aljazeera.com/amp/news/2023/3/30/turkish-parliament-ratifies-finlands-nato-membership)) und Schweden am 23.01.2024 mit 287:55 ([Duvar](https://www.duvarenglish.com/turkish-parliament-votes-287-55-to-approve-swedens-nato-accession-news-63705)).
    - Danach, am 26.01.2024, gaben die USA den möglichen Verkauf von 40 F-16 und 79 Modernisierungssätzen über 23 Mrd. USD frei ([Defense Post](https://www.thedefensepost.com/2024/01/29/us-f16-sale-turkey)).
  - **Ausgabenziel:** Den Haag, 25.06.2025: 5 % des BIP bis 2035, davon 3,5 % Kernverteidigung ([OSW](https://www.osw.waw.pl/en/publikacje/osw-commentary/2025-06-26/nato-summit-hague-trumps-return-and-a-two-component-5-gdp)).
  - **Ausgaben der Türkei** nach NATO-Schätzung: 1,48 % des BIP 2023, 2,13 % 2024, 2,33 % 2025 ([NATO, 2025](https://nato.int/content/dam/nato/webready/documents/finance/def-exp-2025-en.pdf)).
  - **Gipfel in Ankara** am 07./08.07.2026 mit der Erklärung von Ankara ([AA](https://aa.com.tr/en/turkiye/turkiye-to-host-nato-summit-in-july-2026/3663813), [Daily Sabah](https://www.dailysabah.com/world/nato-reaffirms-ironclad-joint-defense-in-ankara-declaration/news)). Der Text im Spiel („Gastgeber des Gipfels im Juli 2026 in Ankara“) stimmt.
- **Organisation der Turkstaaten:**
  - Mitglieder: Türkei, Aserbaidschan, Kasachstan, Kirgisistan, Usbekistan. Beobachter: Ungarn, Turkmenistan, Nordzypern.
  - Gegründet durch das Nachitschewan-Abkommen vom 03.10.2009, umbenannt am 12.11.2021, Sekretariat in Istanbul ([MFA](https://www.mfa.gov.tr/turk-konseyi-en.en.mfa)).
  - **Investitionsfonds:** am 16.03.2023 vereinbart, 500 Mio. USD genehmigtes Kapital ([Kun.uz](https://kun.uz/en/news/2023/03/17/uzbekistan-joins-creation-of-the-ots-investment-fund-worth-500-million)).
  - **Gipfel:** Gabala am 07.10.2025 ([OTS](https://turkicstates.org/en/news/gabala-declaration-of-the-12th-summit-of-the-organization-of-turkic-states)).
  - **Grenze der Bindung:** Kasachstan, Usbekistan und Turkmenistan tauschten 2025 Botschafter mit Zypern aus, und in Samarkand bekannten sie sich zu den UN-Resolutionen 541/550 ([Turkish Minute](https://turkishminute.com/2025/04/08/ankara-faces-diplomatic-setback-as-central-asian-states-name-ambassadors-to-cyprus4/)). Ein Ziel „Anerkennung Nordzyperns“ ist darum realistisch schwer.
- **G20:**
  - Die Türkei ist Mitglied seit 1999 und richtete den Gipfel in Antalya am 15./16.11.2015 aus.
  - Die G20 stehen für rund 85 % der Weltwirtschaftsleistung (sekundär, [Wikipedia](https://en.wikipedia.org/wiki/G20)).
- **BRICS:**
  - Antrag laut Bloomberg am 02.09.2024. In Kasan im Oktober 2024 wurde der Partnerstatus angeboten. Minister Bolat sprach von einer „Übergangsphase“, eine Annahme ist nicht belegt ([VOA](https://www.voanews.com/a/brics-offered-turkey-partner-country-status-turkish-trade-minister-says-/7863488.html)).
  - Die Türkei ist nicht Mitglied der Neuen Entwicklungsbank ([NDB](https://www.ndb.int/about-ndb/members/)).
  - **Folge für das Spiel:** Die Partnerschaft ist ein Angebot von außen mit offener Antwort. Das passt zur Vorlage, nicht zum Knopf.
- **SOZ:**
  - Dialogpartner seit Juni 2012 ([MFA](https://www.mfa.gov.tr/shanghai-cooperation-organization.en.mfa)).
  - Erdoğan am 21.11.2016: SOZ statt EU ([Reuters](https://www.reuters.com/article/us-turkey-europe-erdogan-idUSKBN13F0CY)).
- **Sanktionen gegen die Türkei:**
  - **CAATSA**, wirksam ab 14.12.2020, gegen die SSB: keine US-Exportlizenzen, US-Bankkredite höchstens 10 Mio. USD je 12 Monate, Vermögenssperren gegen vier Personen ([Federal Register](https://www.federalregister.gov/documents/2021/04/07/2021-07048/notice-of-department-of-state-sanctions-actions)). Das Spiel bildet das richtig ab (ENTSCHEIDUNGEN R).
  - **Fall Brunson 2018:**
    - Sanktion gegen zwei Minister am 01.08.2018 ([US Treasury](https://home.treasury.gov/news/press-releases/sm453)).
    - 50 % Stahlzoll ab 13.08.2018 ([Proklamation](https://trumpwhitehouse.archives.gov/presidential-actions/presidential-proclamation-adjusting-imports-steel-united-states-5/)).
    - Die Lira fiel von 3,77 (02.01.) auf 6,89 TRY/USD (13.08.2018) ([TCMB](https://www.tcmb.gov.tr/kurlar/201808/13082018.xml)).
    - Gegenzölle per Präsidialbeschluss Nr. 21 ([Resmî Gazete 15.08.2018](https://www.resmigazete.gov.tr/eskiler/2018/08/20180815.htm)).
  - **Russland nach dem Abschuss der Su-24:**
    - Dekret vom 28.11.2015 ([BBC](https://www.bbc.com/news/world-europe-34954575)).
    - Russische Touristen: 3,65 Mio. 2015, 0,87 Mio. 2016 (−76 %), 4,72 Mio. 2017 (sekundär).
    - Weitgehend aufgehoben am 31.05.2017.
  - **EU, östliches Mittelmeer:** Rahmen 2019/1894 vom 11.11.2019, zwei Listungen am 27.02.2020 ([EUR-Lex](https://eur-lex.europa.eu/eli/dec/2019/1894/oj)).
- **Sanktionen der Türkei:**
  - **Israel:** Teilsperre am 09.04.2024 (54 Warengruppen), Handelsstopp am 02.05.2024 ([Hürriyet Daily News](https://www.hurriyetdailynews.com/turkiye-halts-all-trade-with-israel-over-military-actions-in-gaza-193095)). Handel 2023: 7,08 Mrd. USD (UN Comtrade).
  - **Russland-Sanktionen** trägt die Türkei nicht mit. Die Meerengen sind für Kriegsschiffe Kriegführender geschlossen seit dem 28.02.2022 (Montreux Art. 19, sekundär).
- **Wirkung von Sanktionen:** Hufbauer und andere (2007) zählen 34 % Erfolge, Pape (1997) hält davon nur rund 4 % für echt (sekundär, [Wikipedia](https://en.wikipedia.org/wiki/Economic_sanctions)). Für das Spiel heißt das: Eine Sanktion kostet sicher und wirkt selten. Genau so ist sie heute gebaut.

### 4.5 Andere Spiele

- **Victoria 3:**
  - Beziehungen verbessern kostet laufend Einfluss: 150 Einfluss, +0,03 Beziehung je Tag, höchstens +50 ([Wiki Diplomacy](https://vic3.paradoxwikis.com/Diplomacy)).
  - Ein diplomatisches Spiel ist ein Vorgang mit Eskalationsbalken und Phasen; Dritte treten bei ([Wiki Diplomatic play](https://vic3.paradoxwikis.com/Diplomatic_play)).
  - Machtblöcke haben Prinzipien und Kohäsion ([Wiki Power bloc](https://vic3.paradoxwikis.com/Power_bloc)).
- **Civilization VI:**
  - Delegation 10 Gold, Botschaft 25 Gold ([Civilopedia](https://www.civilopedia.net/en-US/gathering-storm/concepts/diplo_8/)).
  - Wer eine Bitte ignoriert, erzeugt Groll ([Civilopedia Grievances](https://www.civilopedia.net/en-US/gathering-storm/concepts/grievances/)).
  - Der Weltkongress tagt alle 30 Runden mit Resolutionen und Gefallen ([Civilopedia World Congress](https://www.civilopedia.net/en-US/gathering-storm/concepts/world_congress/)).
  - Notfälle haben Ziel, Frist, Lohn und Strafe ([Civilopedia Emergencies](https://www.civilopedia.net/en-US/gathering-storm/concepts/emergency_alliances_1/)).
- **Stellaris:**
  - Gesandte binden ein Jahr; Wirkung +0,25 Meinung je Monat, Zerfall −1 je Monat nach dem Abzug.
  - Spieler haben 6 Monate, um auf Anfragen zu antworten ([Wiki Diplomacy](https://stellaris.paradoxwikis.com/Diplomacy)).
  - Föderationen haben 5 Stufen; vor der Abstimmung sieht man, wer dafür und wer dagegen ist ([Wiki Federations](https://stellaris.paradoxwikis.com/Federations)).
- **Hearts of Iron IV:**
  - Beziehungen verbessern kostet 10 politische Macht.
  - Garantien kosten 15 politische Macht, plus 15 je bestehender Garantie ([Wiki Diplomacy](https://hoi4.paradoxwikis.com/Diplomacy)).
  - Fraktionen haben Manifeste und Ziele; ein Austritt kostet −75 Beziehung ([Wiki Faction](https://hoi4.paradoxwikis.com/Faction)).
- **Democracy 4:** Dilemmata müssen vor dem Rundenende entschieden werden ([Wikipedia](https://en.wikipedia.org/wiki/Democracy_4)).
- **Übertragbar:**
  1. Die Welt meldet sich mit Frist (Stellaris, Democracy 4, Civ-Notfälle).
  2. Wer ignoriert, erzeugt Groll (Civ).
  3. Lange Wege laufen in Etappen mit spürbarer Freischaltung (Stellaris-Föderation, Vic3-Spiel).
  4. Vor der Abstimmung sieht man, wer wohin neigt (Stellaris).
  5. Ansehen ist verrechenbar: Hilfe heute ist eine Stimme morgen (Civ-Gefallen, Vic3-Gefallen).
- **Nicht übernehmen:** Gesandte als Dauerklick (Stellaris) und Einfluss je Tag (Vic3). Das wäre die Aktenarbeit, die der Inhaber nicht will (Leitsatz „wenige echte Entscheidungen“).

### 4.6 Nicht belegt (Lücken, im Plan als Spielparameter oder nicht genutzt)

- **Geld:** Kosten einer Vermittlung, ein ursächlicher Handelsgewinn aus Vermittlung, Bauaufträge in Libyen.
- **Zahlen:** Gesamtbetrag IPA III 2021–2027, NATO-Wert 2026 in % des BIP aus erster Hand.
- **Offene Ausgänge:** ob die Türkei den BRICS-Partnerstatus angenommen hat; Ergebnis des OTS-Gipfels in Ankara am 30.10.2026.
- **Primärtexte:** Vorsitzerklärung Dezember 2016, französische Kapitelliste 2007.
- **Methode:** Das Suchkontingent der Recherche war erschöpft. Danach wurden Primärseiten direkt abgerufen; consilium.europa.eu, europarl, UNHCR, reuters.com und congress.gov sperrten den Abruf. Sekundäre Belege sind oben markiert.

---

## 5. Ziel je Bereich: eine Frage, zwei bis vier Entscheidungen

Leitlinie: Die Bereiche werden nicht größer, sondern **kommen zum Spieler** und **zahlen sichtbar aus**. Der Inhaber spielt nach dem Schreibtisch. Darum ist der Schreibtisch der Haupteingang, die Akte der Ort zum Nachschlagen und Nachsteuern.

### 5.1 EU: „Was ändere ich zu Hause, und was bekomme ich in Brüssel dafür?“

Drei Wege, wie in der Wirklichkeit getrennt (JOIN(2023) 50 behandelt Zollunion, Visa und Beitritt als eigene Schienen):

1. **Visapaket:**
   - Preis: die 6 offenen Kriterien als Maßnahmen mit Link: Datenschutz, Terrorrecht, Korruption, Europol, Justizkooperation, Rückübernahme.
   - Gewinn: Visafreiheit mit der heutigen Wirkung `visaPruefen`.
   - Je Kriterium eine Zeile mit Haken und Sprung zur Maßnahme.
2. **Zollunion modernisieren:**
   - Preis: die Bedingungen aus JOIN(2023) 50: Sanktionsumgehung unterbinden, Handelshemmnisse abbauen, Zypern-Klima.
   - Gewinn: anteilig die Folgenabschätzung, **BIP +1,44 % über mehrere Jahre**. Wie sich das auf die Jahre verteilt, ist ein Spielparameter.
   - Verlierer: Landwirte, weil Agrar dazukommt.
3. **Beitrittsrunde:**
   - Preis: Rechtsstaatspaket (HSK, Urteile Kavala und Demirtaş umsetzen) und Bewegung in der Zypernfrage.
   - Gewinn: Der Beschluss von 2018 fällt, Kapitel öffnen. Die 16 offenen stehen von Anfang an offen.
4. **Antwort auf den Fortschrittsbericht** im November, als Vorlage auf dem Schreibtisch:
   - „Reformschritt zusagen“: Zusage mit Frist, Kapital.
   - „Zurückweisen“: Nationalisten +, Vertrauen der EU −.
   - „Schweigen“.

### 5.2 Vermittlung: „Bringe ich diesen Konflikt jetzt nach Istanbul, und was setze ich ein?“

1. **Einladen:** eine Handlung statt drei Vorbereitungen. Gastgeberrolle, Kanäle und Vertrauensmaßnahmen werden ein Knopf mit einem Preis.
2. **Paket wählen:**
   - **Klein:** Gefangenenaustausch oder Getreidekorridor, nach dem Vorbild 2022 und 2025. Hohe Aussicht, kleiner Gewinn, wiederholbar.
   - **Groß:** Friedensrahmen. Niedrige Aussicht, großer Gewinn.
3. **Bürgen oder nicht:** Garantie mit laufendem Preis, wie heute.
4. **Spoiler beantworten:** Vorlage, gibt es schon (`sim/ereignisse-vermittlung.ts`).

Der Gewinn muss bei den Wählern ankommen. Vorschlag:
- „Ansehen“ wirkt über eine neue Kante auf das Vertrauen in die Regierung (Stärke: Spielparameter, **Regelfrage an den Inhaber**).
- Dazu je Konflikt ein greifbarer Ertrag aus den Daten: Getreide senkt die Lebensmittelpreise, der Korridor nach Nachitschewan (TRIPP) stärkt die Logistik.
- Ob Libyen Bauaufträge bringt, ist nicht belegt (Lücke). Ohne Quelle wäre das ein Spielparameter.

### 5.3 Gesten werden „Besuch und Signal“: „Welches Verhältnis bewege ich jetzt, und in welche Richtung?“

1. **Besuch mit Tagesordnung:**
   - Arbeitstreffen und Staatsbesuch werden eins.
   - Die Tagesordnung wählt man mit Chips statt Auswahllisten.
   - Vorbild ist die Golfreise 2023: Der Besuch bringt Abschlüsse.
2. **Protest:** Botschafter einbestellen oder zu Konsultationen zurückrufen (Vorbild Israel 2023).
3. **Druck:** Sanktion. Sie wandert aus der Weltlage in die Länderakte.
4. **Anteilnahme oder Hilfe:**
   - Nur mit Anlass: Beben, Tod eines Staatschefs, Krise.
   - Sie kommt als Vorlage auf den Schreibtisch (Vorbild Erdbebendiplomatie 2023, Athener Erklärung).
   - `welt_krise` mit 10 von 10 Antworten des Inhabers zeigt, dass das trägt.

### 5.4 Blöcke: „In welchem Lager steht die Türkei, und was holt sie dort heraus?“

1. **NATO:**
   - Konsens als Hebel bei Beitritten, Vorbild Finnland und Schweden 2022 bis 2024. Die Vorlage gibt es schon (`nato_ratifizierung`).
   - Dazu die Zusage zum Verteidigungsziel auf dem Gipfel im Juli.
2. **Turkstaaten:** Gipfel im Oktober mit Tagesordnung (Mittlerer Korridor, Investitionsfonds, Anerkennung Nordzyperns) statt eines Knopfs ohne Inhalt.
3. **BRICS:** Partnerangebot als Vorlage mit Annehmen oder Ablehnen. Vorbild Kasan, Oktober 2024. Heute ist es ein Knopf ohne Anlass.
4. **Gipfelkalender:** NATO (Juli), UN (September), Turkstaaten (Oktober), G20 (November) werden Vorlagen mit Entscheidung statt Termine.

### 5.5 Weltlage › Instrumente: aufgelöst

- Staatsbesuch, Botschafter und Sanktion gehen in die Länderakte (§5.3).
- Rückführung und Grenzsicherung gehen zu Sicherheit/Inneres, der Friedensschritt zu Recht/Politik. Diese Ressorts zeigen heute schon die Größen, auf die die Schritte wirken (Flucht, Terror, Friedensprozess).
- Die Weltlage bleibt eine Lage ohne Handlungen: Energie, Flucht, Sanktionen gegen die Türkei, Diaspora, Verlauf.

---

## 6. Umbauplan in Tagesschritten (je ein Agent, ein Tag)

Reihenfolge nach Wirkung. Die Schritte 1 bis 3 bringen die Bereiche auf den Schreibtisch, bevor die Oberfläche umgebaut wird.

Für jeden Schritt gilt:
- Neue Texte in `i18n/katalog/{de,en,tr}`.
- Alte Spielstände laden weiter, mit Migration und Test am Spielstand des Inhabers.
- Kein `Math.random` in `sim/`.
- `npx tsc --noEmit` und die Tests des Bereichs laufen grün.

| # | Schritt | Dateien | Prüfung |
|---|---|---|---|
| 1 | **Gipfelkalender wird Vorlage.** Je Termin eine Karte 14 Tage vorher (Spielparameter) mit 2 bis 3 Antworten. NATO: Verteidigungsziel zusagen / Bilaterales am Rande (wählt ein Land, Wirkung wie ein Besuch) / fernbleiben. Turkstaaten: Tagesordnung wählen. UN: Rede (Ansehen gegen ein Land). G20: Handelsrunde. Ersetzt das „Arbeitstreffen“ ohne Anlass | neu `sim/ereignisse-gipfel.ts`, `sim/diplomatie.ts:765` (Termine bleiben, verweisen auf die Vorlage), `sim/welt-bloecke.ts`, `sim/ereignisse.ts` (Registrierung), `ui/schreibtisch/briefing.ts:490` | Vorlage erscheint in 3 Seeds je Jahr viermal; `test/schau-antworten.test.ts` prüft die Plaketten |
| 2 | **Vermittlung meldet sich.** Ein Reife-Kipppunkt (40/60) öffnet eine Vorlage statt eines Hinweises: „Istanbul lädt ein“ / „Gesandten schicken“ / „Abwarten“. Aussicht und Preis stehen auf der Karte | `sim/vermittlung.ts:294` (`kippPruefen` → `oeffne`), `sim/ereignisse-vermittlung.ts`, `sim/vermittlung.ts:323` (Vorbereitungen zu einer zusammenlegen) | Spielstand des Inhabers: Libyen (77 %) erscheint innerhalb von 3 Monaten auf dem Schreibtisch |
| 3 | **EU am Schreibtisch.** Der Fortschrittsbericht im November wird Vorlage mit drei Antworten (§5.1). Die Forderung „Reformzusage“ der EU nennt, welches Kriterium oder Kapitel sie bewegt | `sim/eu.ts:707` (`fortschrittsbericht`), `sim/ereignisse-eu.ts`, `sim/abkommen.ts` (Text der Forderung) | Chronik zeigt den Bericht als `vorlage`; Wirkungsbericht nach 6 Monaten |
| 4 | **EU-Startzustand nach der Wirklichkeit.** Die Kapitel 12, 17, 27 und 33 stehen offen mit echtem Datum. Kapitel 11 ist durch den Ratsbeschluss 2006 gesperrt, 15, 23, 24 und 31 durch Zypern. Die Phase heißt „Stillstand (Rat 26.06.2018)“. Die 6 Visa-Kriterien werden die echten sechs. Migration: alte Spielstände übernehmen offene Kapitel nur, wenn sie noch „zu“ sind | `sim/eu.ts:166` (`KAPITEL`), `:628` (`VISA_KRITERIEN`), `euZustand`, `test/eu.test.ts` | Neues Spiel zeigt 4 offene Kapitel; Spielstand 2043 lädt |
| 5 | **EU-Akte in drei Wegen** (Visa, Zollunion, Beitritt) als Karten nach Vorgabe Z. Kopf mit drei Kennzahlen: offene Kapitel x/35, Visa-Kriterien x/6, Zollunion-Stand. Je Karte Preis (Maßnahmen mit Sprung in die Politik), Gewinn (Zahl), ein Knopf. Die verborgene Schwelle „Annäherung ≥ 55“ fällt weg und wird ein sichtbarer Teil des Beitrittspakets | `ui/welt/EuDossier.tsx`, `sim/eu.ts:443` (`annaeherungSicht`), `:459` (`kuendigeReformAn` → je Weg), `ui/welt/welt.css` | ≤ 1,5 Bildschirme; Wortzahl von 364 auf ≤ 150; jeder Weg mit 1 Klick |
| 6 | **Eine Handlungsleiste je Land.** Der Reiter „Gesten“ heißt „Handeln“ und hat 4 Knöpfe: Besuch (Agenda-Chips), Protest, Druck (Sanktion), Hilfe (nur mit Anlass). Die Gesten „Handelsabkommen“ und „Rüstungskooperation“ entfallen (der Verhandlungstisch kann beides). Der Staatsbesuch wandert aus den Instrumenten hierher | `ui/Welt.tsx:234` und `:388`, `sim/laender.ts:276` (`AKTIONEN`), `sim/diplomatie.ts:574` (`instrumente`), `sim/welt-modell.ts` (`gestenFuerWeitere`), Migration von `zuletzt` | Klicks zum Besuch 5–6 → 3; keine Handlung an zwei Orten |
| 7 | **Wirkung, die man spürt.** Wirkungsbericht nach 6 und 12 Monaten für jede Außenhandlung (heute nur Instrumente, `sim/diplomatie.ts:456`), als Chronik-Eintrag wie bei Gesetzen. Kante Ansehen → Vertrauen in die Regierung als Spielparameter (Regelfrage). Konkrete Erträge je Vermittlungspaket (Getreide → Lebensmittelpreise, Korridor → Logistik) | `sim/diplomatie.ts` (Berichte verallgemeinern), `sim/laender.ts:490`, `sim/vermittlung.ts:389`, `data/politiknetz.ts` (Kante), `data/konflikte.ts` (Erträge mit Quelle) | Messung wie §2.3: eine gelungene Vermittlung bewegt die Zielzustimmung nach 12 Monaten sichtbar über das Rauschen (Zielwert Spielparameter, vom Inhaber festzulegen) |
| 8 | **Vermittlungsakte verdichten.** Je Konflikt eine Karte mit drei Zahlen: Reife, Vertrauen beider Seiten, Aussicht. Dazu ein Knopf „Einladen“ und die Paketwahl klein/groß (§5.2). Forderungen, rote Linien und Hebel hinter einem Aufklapper | `ui/welt/Vermittlung.tsx`, `data/konflikte.ts` (Pakete), `sim/vermittlung.ts:166` (Aussicht je Paket) | Wortzahl von 404 auf ≤ 150 sichtbar; Test `vermittlung-ui.test.tsx` |
| 9 | **Blöcke mit Entscheidungen.** NATO: Verteidigungsziel mit echten Werten (2,33 % 2025, Ziel 3,5 % + 1,5 % bis 2035) als Zusage am Gipfel, Konsensveto bleibt Vorlage. BRICS-Partnerschaft als Vorlage (Angebot) statt als Knopf. Turkstaaten-Gipfel mit Tagesordnung (aus Schritt 1). NATO-Seite zeigt das Verteidigungsziel und offene Beitritte. Auf der Karte die Mitglieder des gewählten Blocks einfärben (Vorgabe S) | `sim/welt-bloecke.ts:177`, `ui/welt/Block.tsx`, `data/welt-institutionen.ts`, `ui/atlas/…` | Jede Blockseite hat mindestens eine Entscheidung oder einen Verweis auf die nächste Vorlage |
| 10 | **Instrumente auflösen und aufräumen.** Rückführung und Grenzsicherung zu Sicherheit, Friedensschritt zu Recht. Die Weltlage zeigt nur die Lage. Doppelte Texte und alte Schlüssel entfernen. Volle Prüfung der Sprachen (`sprachgleich`) | `ui/welt/Aussenlage.tsx`, `ui/akte/Bereiche.tsx:440`, Sicherheits- und Rechtsakte, `i18n` | Kein Instrument mehr an zwei Orten; `test/sprachgleich.test.ts` |

### Was wegfallen kann, weil es nur Schau ist

- **Gesten „Handelsabkommen“ und „Rüstungskooperation“:** Sie doppeln den Verhandlungstisch und verlangen dort dieselben Zusagen (`sim/laender.ts:520`).
- **„Arbeitstreffen“ ohne Anlass:** geht in Besuch und Gipfel auf.
- **Die Instrumentenleiste in der Weltlage:** Ihre Teile ziehen um.
- **Die Leitsätze links bei Dienst und Vermittlung:** Sie standen schon zur Hälfte nicht mehr da (`ui/Welt.tsx:142`).
- **Die Ratsstimmen je Thema bei jedem EU-Mitglied** (`ui/Welt.tsx:331`): Sie wandern hinter einen Aufklapper in der EU-Akte. Sie zählen nur, wenn ein Kapitel ansteht.
- **„Golf“ und „Mekka-Pakt“ als eigene Blockseiten ohne Handlung:** Sie bleiben als Mitgliedschaftsschild am Land, nicht als Seite.

---

## 7. Zur Bestätigung durch den Inhaber

1. Soll „Ansehen“ auf das Vertrauen in die Regierung wirken? Das wäre eine neue Kante, ihre Stärke ein Spielparameter. Ohne sie bleibt jede Außenpolitik für die Wahl wertlos.
2. Soll der EU-Start den echten Stand zeigen, also 16 Kapitel offen und Stillstand durch den Rat? Das macht das Spiel schwerer zu lesen, aber richtig.
3. Gipfel als Pflichttermin: Ist Fernbleiben eine gültige Antwort mit Preis (Groll, nach Civ)?
4. Sollen Gesten ohne Anlass ganz entfallen? Dann gibt es Besuche nur als Gipfel-Nebengespräch oder mit Tagesordnung.
