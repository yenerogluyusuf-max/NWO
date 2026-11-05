# Regler in echten Einheiten: Startwerte 2026 je Maßnahme

Stand: 06.11.2026 (Nachtarbeit). Grundlage: befund-B.md Abschnitt 5, `game/src/data/politiknetz.ts`, `game/src/data/skalen.ts`. Keine Änderung am Spielcode; nur Daten.

Maschinenlesbar: [regler_einheiten.json](regler_einheiten.json) (Liste von Objekten `{id, name, einheit:{de,en,tr}, start, startwert, rundung, proportional, quelle:{url,titel,datum,zitat}, sicherheit, hinweis, zustaende?, startzustand?}`; `startwert` ist die Zahl in der Einheit der Vorlage, `null` bei Zuständen und Lücken; `einheit` ist `null` bei reinen Zustandsreglern).

## Wie lesen

- **Einheit** ist eine Vorlage mit `{x}`. Der Regler zeigt `{x} = Startwert × (Stufe ÷ Startpegel)`, wenn **proportional = ja**. Beispiel: Kindergeld 5.000 Lira, Regler auf 150 % ergibt „7.500 Lira je Kind und Monat ab dem dritten Kind“.
- **proportional = nein**: Die Größe skaliert nicht verhältnisgleich (Alter, Projekte, Verträge). Dann stehen benannte Zustände mit Startzustand dabei, oder der Hinweis beschreibt eine nichtlineare Abbildung.
- **ja, mit Deckel**: verhältnisgleich bis zu einer natürlichen Grenze (z. B. 100 % einer Quote).
- **Sicherheit**: *belegt* = Primärquelle oder mindestens zwei übereinstimmende Quellen mit Rechtsgrundlage; *plausibel-prüfen* = eine Sekundärquelle oder abgeleitet, vor Übernahme an der genannten Primärquelle prüfen; *Lücke* = kein tragfähiger Wert, Suchhinweis im Hinweisfeld.
- Zitate stammen überwiegend aus Such-Auszügen (Volltext der Amtsseiten war aus dieser Sitzung meist gesperrt, HTTP 403). Wo „(Suchauszug)“ steht, ist der Wortlaut am Original zu prüfen.
- Ausgeschlossen (eigener Auftrag): Mehrwertsteuer, Einkommensteuer, Körperschaftsteuer, Ausnahmezustand.

**Zählung:** 81 Maßnahmen; belegt 26, plausibel-prüfen 43, Lücke 12. Davon als benannte Zustände vorgeschlagen: 9.

## Auffällige Funde

1. **Spieltext widerspricht Startwert:** `m_richterstellen` nennt „heute 17 je 100.000“, die aktuellen Zahlen (18.167 Richter, Sept. 2026) ergeben ≈ 21 Richter bzw. ≈ 31 Richter und Staatsanwälte je 100.000. `m_unigruendungen` „Universitäten in jeder Provinz“ ist längst erreicht (129 staatliche Universitäten); sinnvoll skaliert nur die Zahl der Studienplätze (602.117).
2. **Keine Mengen, sondern Vorhaben/Verträge (benannte Zustände statt Prozent):** `m_sakarya_phase3` (zweite Förderanlage seit Sept. 2025 im Bau, Kiellegung 25.10.2026), `m_akkuyu_ppa` (12,35 US-Cent/kWh), `m_preiswahrheit` (Gas-Staffeltarif seit 04.04.2026 ist schon der heutige Zustand), `m_fruehwarnsystem`, `m_verwaltungsdigital`, `m_digitale_oeffentlichkeit`, zusätzlich `m_fruehrente` (Alter skaliert nicht), `m_heimische_kohle` (ein einziges +688-MW-Projekt) und `m_baukredite` (Zinsprogramm „İlk Evim“ angekündigt, nicht gestartet).
3. **Umgekehrt proportional:** `m_haftvermeidung` (U-Haft-Anteil 15,0 % sinkt, wenn der Regler steigt) und `m_handelssysteme` (Abfertigungsstunden). Anzeige x = Start × Startpegel ÷ Stufe.
4. **Kapazitätsgrenzen:** `m_gasfoerderung` kann nicht über die Förderanlagen steigen (9,5 → 20 → ~45 Mio. m³/Tag je Phase); `m_gashub` wächst nur in ganzen Pipelinesträngen (~15,75 Mrd. m³).
5. **Größenordnungen im Netz prüfen (B-11):** Verteidigung liegt schon bei 2,33 % des BIP (NATO), Sozialhilfe bei ~917 Mrd. Lira, Garantie- und Mietzahlungen an Betreiber bei ~239 Mrd. Lira 2026, BOTAŞ-Energiestützung bei ~950 Mrd. Lira. Die Spielkosten (z. B. „ganze Spanne 1 % BIP“) sind daran zu messen.
6. **Kraftstoffsteuer schwankt 2026 stark** (Eşel-mobil-System): Regelsatz Benzin 14,8277 Lira/l, im Oktober 2026 nur 7,90 Lira/l. Für den Start den Regelsatz nehmen.
7. **Programm passt nicht zum Namen:** `m_gebaeudeverstaerkung` – das reale Programm („Yarısı Bizden“, 875.000 Lira Zuschuss je Wohnung) fördert Abriss und Neubau, nicht Ertüchtigung.
8. **Doppelte Regler bestätigt (B-6):** Sonne/Wind ↔ YEKA, Gasförderung ↔ Sakarya Phase 3, Energiesubventionen ↔ Preiswahrheit, Ausbildung ↔ Fachkräfte ↔ Berufsschulen, Krankenhausbau ↔ Medizintechnik, Netzausbau ↔ Speicher, Polizei ↔ Polizeitechnik.
9. **Lücken (12):** Berufsausbildung, Fachkräfte, Tourismuswerbung (nur Wert 2022), Bildungstechnik, Intelligente Infrastruktur, Instandhaltung, Zollsysteme, Saatgut, Agrarforschung, Industrieller Wohnungsbau, Polizeitechnik, Flugstunden. Je ein Suchhinweis steht bei der Maßnahme.
10. **Grenze der Belege:** Amtsseiten (resmigazete, sbb, hmb, tbmm, PwC u. a.) antworteten mit 403; fast alle Zitate stammen aus Such-Auszügen von Presse und Fachportalen. „belegt“ heißt hier: Rechtsgrundlage oder amtliche Meldung genannt und mehrere Quellen übereinstimmend; der Wortlaut ist vor Übernahme an der Primärquelle zu prüfen.

## Tabelle

| id | Maßnahme | Einheit (de) | Startwert 2026 | Rundung | prop. | Sicherheit | Quelle |
|---|---|---|---|---|---|---|---|
| `m_mindestlohn` | Mindestlohn | {x} Lira netto je Monat | 28.075,50 Lira netto (brutto 33.030 Lira), gültig 01.01.–31.12.2026 | auf 50 Lira | ja | belegt | [Q1](#q1) |
| `m_renten` | Rentenerhöhungen | Mindestrente {x} Lira je Monat | 20.000 Lira je Monat ab Januar 2026 (vorher 16.881); Juli 2026 laut einer Quelle 23.552 Lira (Gesetz Nr. 7590, prüfen) | auf 100 Lira | ja | belegt | [Q2](#q2) |
| `m_fruehrente` | Frühverrentung | benannte Zustände | Zustand: Altersgrenze gilt (Frauen 58 / Männer 60 für Ersteintritt 1999–2008, steigend bis 65 ab 2048); EYT-Öffnung 2023 für Eintritt vor 09.09.1999 ohne Altersgrenze | – | nein | belegt | [Q3](#q3) |
| `m_kindergeld` | Kindergeld und Familienhilfe | {x} Lira je Kind und Monat ab dem dritten Kind | 5.000 Lira je Monat ab dem 3. Kind (bis 5 Jahre); 2. Kind 1.500 Lira je Monat; 1. Kind einmalig 5.000 Lira (Stand 2026) | auf 50 Lira | ja | plausibel-prüfen | [Q4](#q4) |
| `m_sozialhilfe` | Sozialhilfe | {x} Mrd. Lira Sozialhilfe je Jahr | 917 Mrd. Lira Sozialhilfebudget 2026 (alle Träger; davon ~388 Mrd. Familienministerium); 3.991.766 Haushalte 2025 | auf 1 Mrd. Lira | ja | plausibel-prüfen | [Q5](#q5) |
| `m_arbeitslosengeld` | Arbeitslosengeld | {x} % des letzten Bruttolohns | 40 % des Bruttolohns der letzten 4 Monate; höchstens 80 % des Brutto-Mindestlohns (2026: 26.424 Lira), mindestens 13.212 Lira brutto; Dauer 180–300 Tage | ganze Prozent | ja | belegt | [Q6](#q6) |
| `m_kinderbetreuung` | Kinderbetreuung | {x} % der 3- bis 5-Jährigen in Kita oder Vorschule | 49 % (Nettobetreuungsquote 3–5 Jahre, Schuljahr 2024/25); 5-Jährige 84,14 % (2025/26) | ganze Prozent | ja, mit Deckel 100 % | plausibel-prüfen | [Q7](#q7) |
| `m_ausbildung` | Berufsausbildungsprogramme | {x} Teilnehmer an İŞKUR-Kursen und Betriebsausbildung je Jahr | Lücke: Jahressumme 2025 nicht sicher; Jan.–Mai 2025: 27.803 in İşbaşı-Programmen + 5.892 in Kursen | auf 1.000 | ja | Lücke | [Q8](#q8) |
| `m_fachkraefteprogramm` | Fachkräfte und Weiterbildung | {x} Teilnehmer an Weiterbildung je Jahr | Lücke (wie m_ausbildung; Größen nicht trennbar) | auf 1.000 | ja | Lücke | [Q9](#q9) |
| `m_zuzahlungen` | Zuzahlungen der Patienten | {x} Lira je Arztbesuch im staatlichen Krankenhaus | 50 Lira je Besuch (staatl. Krankenhaus, seit 01.07.2026; vorher 26); Lehrkrankenhaus 90, privat 100; Hausarzt 0 | auf 1 Lira | ja | belegt | [Q10](#q10) |
| `m_steuerfahndung` | Steuerfahndung | {x} % der Steuerpflichtigen jährlich geprüft | 6,72 % (2025; 2024: 2,91 %); Prüfer: rund 7.300 besetzte Stellen | eine Nachkommastelle | ja | plausibel-prüfen | [Q11](#q11) |
| `m_kraftstoffsteuer` | Steuer auf Kraftstoff | {x} Lira Verbrauchsteuer (ÖTV) je Liter Benzin | 14,8277 Lira je Liter Benzin 95 Oktan (ab 01.01.2026; vorher 13,8642); Diesel 2027 13,9006 Lira. Wegen Eşel-mobil-System 2026 zeitweise gesenkt (Okt. 7,90 Lira) | zwei Nachkommastellen | ja | belegt | [Q12](#q12) |
| `m_immobiliensteuer` | Steuer auf Immobilien und Vermögen | Grundsteuer {x} ‰ des Steuerwerts (Wohnung in Großstadt) | 2 ‰ (Wohnung in Großstadt; sonst 1 ‰); Steuer auf teure Wohnungen 3/6/10 ‰ ab 17.711.000 Lira Wert (2026) | eine Nachkommastelle | ja | belegt | [Q13](#q13) |
| `m_exportfoerderung` | Exportförderung | {x} Mrd. Dollar Exportkredite und -versicherungen der Eximbank je Jahr | 54 Mrd. Dollar (2025); 48,7 Mrd. Dollar (2024) | auf 0,5 Mrd. Dollar | ja | plausibel-prüfen | [Q14](#q14) |
| `m_investitionsanreize` | Investitionsanreize | {x} Mrd. Lira geförderte Investitionen je Jahr | rund 980 Mrd. Lira je Jahr (abgeleitet: 897,5 Mrd. Lira in 4.500 Förderbescheiden Juni 2025–April 2026, 11 Monate) | auf 10 Mrd. Lira | ja | plausibel-prüfen | [Q15](#q15) |
| `m_kreditgarantien` | Staatliche Kreditgarantien | {x} Mrd. Lira staatlich verbürgter Kreditrahmen | 201,6 Mrd. Lira Kreditrahmen der Hazine-Pakete (Stand 27.03.2026; davon 129,9 Mrd. genutzt) | auf 1 Mrd. Lira | ja | plausibel-prüfen | [Q16](#q16) |
| `m_tourismuswerbung` | Tourismuswerbung | {x} Mio. Dollar Werbebudget im Ausland je Jahr | Lücke für 2025/26; letzter Ministerwert 140 Mio. Dollar (Plan 2022; 2021: 110 Mio.) | auf 5 Mio. Dollar | ja | Lücke | [Q17](#q17) |
| `m_kmu` | Mittelstandsförderung | {x} Mrd. Lira KOSGEB-Förderung je Jahr | 34,8 Mrd. Lira an 57.437 Betriebe (2025) | auf 0,5 Mrd. Lira | ja | belegt | [Q18](#q18) |
| `m_zoelle` | Einfuhrzölle | {x} % durchschnittlicher Zollsatz | 17,5 % (einfacher Durchschnitt der MFN-Zölle, alle Waren, 2024; handelsgewichtet 10,7 %) | eine Nachkommastelle | ja | belegt | [Q19](#q19) |
| `m_industrie_modernisierung` | Industrielle Modernisierung | {x} Mrd. Dollar Hightech-Förderprogramm (HIT-30) bis 2030 | 30 Mrd. Dollar Förderrahmen (Steuervorteile und Zuschüsse) bis 2030, angekündigt Juli 2024 | auf 1 Mrd. Dollar | ja | plausibel-prüfen | [Q20](#q20) |
| `m_krankenhausbau` | Krankenhausbau | {x} Krankenhausbetten je 1.000 Einwohner | 3,1 Betten je 1.000 Einwohner (268.359 Betten Ende 2023; OECD-Mittel 4,2) | eine Nachkommastelle | ja | plausibel-prüfen | [Q21](#q21) |
| `m_aerztegehalt` | Gehälter im Gesundheitswesen | {x} Lira netto je Monat für Ärztinnen und Ärzte im Berufseinstieg | rund 65.000 Lira garantiertes Netto (Allgemeinarzt, Gesundheitsministerium, Juli 2026; mit Zulagen und Diensten 80.000–125.000) | auf 500 Lira | ja | plausibel-prüfen | [Q22](#q22) |
| `m_lehrergehaelter` | Lehrergehälter | {x} Lira netto je Monat für neu eingestellte Lehrkräfte | rund 64.000 Lira netto (Juli–Dez. 2026, je nach Steuerstufe 63.998–68.236) | auf 500 Lira | ja | plausibel-prüfen | [Q23](#q23) |
| `m_schulbau` | Schulbau | {x} neue Klassenräume je Jahr | rund 8.900 Klassenräume netto mehr im Schuljahr 2025/26 (abgeleitet: 753.571 auf 762.434); Schüler je Klassenraum: Grundschule 19, Mittelschule 25, Oberstufe 21 | auf 100 | ja | plausibel-prüfen | [Q24](#q24) |
| `m_berufsschulen` | Berufsschulen | {x} % der Oberstufenschüler in Berufs- und Fachschulen | 39,51 % (2025/26; 2024/25: 37,56 %) | eine Nachkommastelle | ja, mit Deckel 100 % | belegt | [Q25](#q25) |
| `m_unigruendungen` | Neue Universitäten | {x} Studienplätze an staatlichen Hochschulen je Jahr | 602.117 Studienplätze an staatlichen Hochschulen (YKS 2026; insgesamt 805.747); 129 staatliche Universitäten (Jan. 2025) | auf 1.000 | ja | belegt | [Q26](#q26) |
| `m_stipendien` | Stipendien | {x} Lira KYK-Stipendium je Monat (Bachelor) | 4.000 Lira je Monat ab 06.01.2026 (vorher 3.000); Master 8.000, Promotion 12.000 | auf 50 Lira | ja | plausibel-prüfen | [Q27](#q27) |
| `m_forschung` | Forschungsförderung | {x} % des BIP für Forschung und Entwicklung | 1,55 % des BIP (2025; 980,4 Mrd. Lira; 2024: 1,46 %) | zwei Nachkommastellen | ja | belegt | [Q28](#q28) |
| `m_bildungstechnik` | Bildungstechnik und digitales Lernen | {x} Mrd. Lira für Bildungstechnik je Jahr | Lücke: kein aktueller Betrag gefunden (FATİH-Projekt zuletzt 2013 mit 1,4 Mrd. Lira im Haushalt) | auf 0,5 Mrd. Lira | ja | Lücke | [Q29](#q29) |
| `m_medizintechnik` | Medizintechnik und Krankenhausmodernisierung | {x} Mrd. Lira Investitionen des Gesundheitsministeriums je Jahr | 146,9 Mrd. Lira (Investitionsprogramm 2026; Sektor Gesundheit 173,5 Mrd.) | auf 1 Mrd. Lira | ja | plausibel-prüfen | [Q30](#q30) |
| `m_autobahnen` | Autobahn- und Brückenbau | {x} km neue Autobahn je Jahr | 157 km geplant für 2026 (Netz 3.796 km Ende 2025 auf 3.953 km Ende 2026); 2025 kein Nettozuwachs | auf 5 km | ja | plausibel-prüfen | [Q31](#q31) |
| `m_oepp_garantien` | Garantien für Betreiberprojekte | {x} Mrd. Lira Garantie- und Mietzahlungen an private Betreiber je Jahr | rund 239 Mrd. Lira 2026 (Brücken/Autobahnen 103,2 Mrd. erwartet, 2025: 85,1 Mrd.; Stadtkliniken 136,1 Mrd. Haushaltsansatz) | auf 1 Mrd. Lira | ja | plausibel-prüfen | [Q32](#q32) |
| `m_bahn` | Bahnausbau | {x} Mrd. Lira Bahninvestitionen je Jahr | 145,6 Mrd. Lira (Investitionsprogramm 2026); Netz 2.251 km Schnellfahrstrecke, 3.776 km im Bau | auf 1 Mrd. Lira | ja | plausibel-prüfen | [Q33](#q33) |
| `m_nahverkehr` | Nahverkehr | {x} km städtische Schienenstrecken im Bau | 220,85 km im Bau in neun Provinzen (Ministeriumsprojekte); Bestand 1.054,7 km städtische Schiene (2026) | auf 5 km | ja | plausibel-prüfen | [Q34](#q34) |
| `m_breitband` | Breitbandausbau | {x} Mio. Glasfaseranschlüsse | 10,7 Mio. Glasfaserkunden (2. Quartal 2026; davon bis in die Wohnung 9,15 Mio. im 1. Quartal); Glasfasernetz 720.012 km | eine Nachkommastelle | ja | plausibel-prüfen | [Q35](#q35) |
| `m_regionalfoerderung` | Regionalförderung | {x} Mrd. Lira für die Entwicklungsagenturen je Jahr | 2,75 Mrd. Lira Transfermittel 2026 (Präsidialbeschluss Nr. 11067) | auf 0,05 Mrd. Lira | ja | belegt | [Q36](#q36) |
| `m_smart_infrastruktur` | Intelligente Infrastruktur | {x} Mrd. Lira für Verkehrsleit- und Sensortechnik je Jahr | Lücke | auf 0,5 Mrd. Lira | ja | Lücke | [Q37](#q37) |
| `m_instandhaltung` | Instandhaltung der Infrastruktur | {x} Mrd. Lira für Erhaltung von Straßen und Schienen je Jahr | Lücke | auf 1 Mrd. Lira | ja | Lücke | [Q38](#q38) |
| `m_handelssysteme` | Moderne Zoll- und Handelssysteme | {x} Stunden Zollabfertigung bei der Einfuhr | Lücke (letzter belastbarer internationaler Wert ist der Doing-Business-Bericht 2020) | ganze Stunden | nein (umgekehrt: mehr Ausbau = weniger Stunden) | Lücke | [Q39](#q39) |
| `m_verwaltungsdigital` | Digitale Verwaltung und Steuertechnik | benannte Zustände | Zustand: E-Rechnung Pflicht für Betriebe ab 3 Mio. Lira Umsatz (ab 01.07.2026; Handel online, Immobilien, Kfz ab 0,5 Mio.); e-Devlet mit 9.170 Diensten und 68,2 Mio. Nutzern (2025) | – | nein | plausibel-prüfen | [Q40](#q40) |
| `m_digitale_oeffentlichkeit` | Digitale Öffentlichkeit und Beteiligung | benannte Zustände | Zustand: Behördengänge online (e-Devlet, 69,8 Mio. Nutzer Sept. 2026) und Beschwerdestelle des Präsidialamts (CİMER); kein nationales Portal für offene Daten (veri.gov.tr angekündigt), keine Online-Anhörung zu Gesetzentwürfen | – | nein | plausibel-prüfen | [Q41](#q41) |
| `m_solar_wind` | Ausbau von Sonne und Wind | {x} GW neue Wind- und Solarleistung je Jahr | 6,5 GW Zubau 2025 (Rekord; Solar 4,7 GW, Wind 1,9–2,1 GW); Bestand Ende 2025 rund 39,9 GW | eine Nachkommastelle | ja | belegt | [Q42](#q42) |
| `m_yeka_serie` | YEKA-Ausschreibungsserie | {x} GW ausgeschriebene YEKA-Leistung je Jahr | 2,4 GW (YEKA 2026: 21 Ausschreibungen, 1,5 GW Wind + 0,9 GW Solar; 2025: 3,8 GW) | eine Nachkommastelle | ja | belegt | [Q43](#q43) |
| `m_gasfoerderung` | Heimische Gasförderung | {x} Mio. m³ Gas je Tag aus dem Schwarzen Meer | 9,5 Mio. m³ je Tag (Sakarya Phase 1, 12 Bohrungen, Stand Okt. 2026); Phase 2 mit FPU Osman Gazi auf 20 Mio. m³ ab Anfang 2027 | eine Nachkommastelle | ja, mit Deckel durch die Förderanlagen (9,5 → 20 → 45 Mio. m³) | belegt | [Q44](#q44) |
| `m_sakarya_phase3` | Sakarya Phase 3 (zweite FPU) | benannte Zustände | Zustand: zweite Förderanlage im Bau (EPCIC-Vertrag Wison/TPAO Sept. 2025, Aufbauten seit Mai 2026, Kiellegung 25.10.2026; Inbetriebnahme Ende 2027 bis Mitte 2028) | – | nein | belegt | [Q45](#q45) |
| `m_akkuyu_ppa` | Akkuyu-Vertrag nachverhandeln | benannte Zustände | Zustand: Vertrag gilt unverändert – Abnahmegarantie 12,35 US-Cent je kWh für 15 Jahre (70 % der Erzeugung Blöcke 1–2, 30 % Blöcke 3–4); Block 1 erste Stromerzeugung Ziel Ende 2026 | – | nein | belegt | [Q46](#q46) |
| `m_heimische_kohle` | Heimische Kohle (Afşin-Elbistan) | benannte Zustände | Zustand: Erweiterung um 688 MW (2 Blöcke) geplant, nichts im Bau; Afşin-Elbistan A 1.360 MW in Betrieb | – | nein | plausibel-prüfen | [Q47](#q47) |
| `m_energieeffizienz` | Effizienz, Wärmepumpen, E-Mobilität | {x} neu zugelassene Elektroautos je Jahr | 191.960 Elektroautos verkauft 2025 (17,7 % Marktanteil, +82 %) | auf 1.000 | ja | belegt | [Q48](#q48) |
| `m_preiswahrheit` | Preiswahrheit bei Energie | benannte Zustände | Zustand: Staffeltarif für Gas seit 04.04.2026 (Stufe 1: 10,625 Lira/m³, Stufe 2: 18 Lira/m³ ab Verbrauch über der Provinzgrenze); BOTAŞ-Stützung 2026 rund 950 Mrd. Lira | – | nein | belegt | [Q49](#q49) |
| `m_gashub` | Gas-Hub und Transit-Ausbau | {x} Mrd. m³ Pipeline-Kapazität über TurkStream und TANAP je Jahr | 47,5 Mrd. m³ je Jahr (TurkStream 2 × 15,75 + TANAP 16) | auf 0,5 Mrd. m³ | ja, in Stufen (ein Strang ≈ 15,75 Mrd. m³) | plausibel-prüfen | [Q50](#q50) |
| `m_lng_vertraege` | LNG-Langzeitverträge | {x} Mrd. m³ Flüssiggas unter Langzeitvertrag je Jahr | rund 9,7 Mrd. m³ je Jahr (abgeleitet: Algerien 4,4 + Nigeria 1,3 + Mercuria/USA 4,0 ab 2026; dazu befristete Verträge 2026–28) | auf 0,5 Mrd. m³ | ja | plausibel-prüfen | [Q51](#q51) |
| `m_regas_ausbau` | FSRU- und Regasifizierungs-Ausbau | {x} Mio. m³ LNG-Anlandekapazität je Tag | rund 161 Mio. m³ je Tag (5 Anlagen: 2 an Land, 3 FSRU; Atlantic Council: ~150) | auf 5 Mio. m³ | ja | plausibel-prüfen | [Q52](#q52) |
| `m_gasspeicher` | Gasspeicher-Ausbau | {x} Mrd. m³ Gasspeicher | 6,3 Mrd. m³ (Silivri 4,6 + Tuz Gölü; Nov. 2025); Ziel 14,4 Mrd. m³ bis 2028 | eine Nachkommastelle | ja | plausibel-prüfen | [Q53](#q53) |
| `m_netzausbau` | Stromnetzausbau | {x} Mrd. Lira Investitionen ins Übertragungsnetz je Jahr | rund 72 Mrd. Lira je Jahr (abgeleitet: TEİAŞ-Investitionsprogramm 362 Mrd. Lira für 2024–2028) | auf 1 Mrd. Lira | ja | plausibel-prüfen | [Q54](#q54) |
| `m_speicher_smartgrid` | Netzmodernisierung und Speicher | {x} MW Batteriespeicher am Netz | 208 MW (Speicher-Wind-/Solarprojekte in Betrieb, Feb. 2026); 2026 erwartet +1.500–2.000 MW; 33 GW in Vorbereitung | auf 10 MW | ja | belegt | [Q55](#q55) |
| `m_agrarsubventionen` | Agrarsubventionen | {x} Mrd. Lira Agrarförderung je Jahr | 167,6 Mrd. Lira (2026; 2,9 Mio. geförderte Landwirte; 1. Halbjahr 2026 ausgezahlt 106,0 Mrd.) | auf 1 Mrd. Lira | ja | belegt | [Q56](#q56) |
| `m_bewaesserung` | Moderne Bewässerung | {x} % der Bewässerungsfläche mit Tropfbewässerung | 17,5 % (2023; 2018: 17,4 %); Rohrleitungsnetze insgesamt 33,7 % (2023) | eine Nachkommastelle | ja, mit Deckel 100 % | plausibel-prüfen | [Q57](#q57) |
| `m_staudaemme` | Staudämme und Speicher | {x} Mio. m³ neues Speichervolumen je Jahr | 512 Mio. m³ (Plan 2025: 52 neue Talsperren und Teiche); Gesamtspeicher rund 183 Mrd. m³ (Jan. 2024) | auf 10 Mio. m³ | ja | plausibel-prüfen | [Q58](#q58) |
| `m_wasserleitungen` | Wasserleitungen und Kläranlagen | {x} % der Gemeindebevölkerung an Kläranlagen | 76,9 % (2024); Kanalnetz 92,8 %, Trinkwassernetz 98,8 %; Leitungsverluste 47,9 % (2023) | eine Nachkommastelle | ja, mit Deckel 100 % | belegt | [Q59](#q59) |
| `m_saatgut` | Saatgut- und Erzeugerprogramme | {x} Tonnen zertifiziertes Saatgut je Jahr | Lücke | auf 10.000 t | ja | Lücke | [Q60](#q60) |
| `m_mechanisierung` | Landwirtschaftliche Mechanisierung | {x} Traktoren im Bestand | 2.315.504 Traktoren (Ende 2025); 2.321.253 (Ende März 2026) | auf 1.000 | ja | plausibel-prüfen | [Q61](#q61) |
| `m_agrarforschung` | Agrarforschung und Hochtechnologie | {x} Mio. Lira für Agrarforschung je Jahr | Lücke (TAGEM mit 49 Instituten; Betrag 2026 nicht gefunden) | auf 10 Mio. Lira | ja | Lücke | [Q62](#q62) |
| `m_bauindustrie` | Industrieller Wohnungsbau | {x} Fertigteil- und Modulwohnungen je Jahr | Lücke | auf 1.000 | ja | Lücke | [Q63](#q63) |
| `m_sozialwohnungen` | Staatlicher Wohnungsbau | {x} fertiggestellte TOKİ-Sozialwohnungen je Jahr | 83.503 Sozialwohnungen fertig (Programm '250.000 Sozialwohnungen', Stand 10.10.2026); im Erdbebengebiet 455.357 Einheiten bis 27.12.2025 übergeben | auf 1.000 | ja | plausibel-prüfen | [Q64](#q64) |
| `m_stadterneuerung` | Erdbebensichere Stadterneuerung | {x} erneuerte Wohnungen je Jahr | rund 197.000 je Jahr (abgeleitet: 2.761.000 Einheiten seit 2012 im Programm, 14 Jahre); Regierungsziel 300.000 je Jahr | auf 5.000 | ja | plausibel-prüfen | [Q65](#q65) |
| `m_gebaeudeverstaerkung` | Gebäude-Verstärkungsprogramm | {x} Lira Zuschuss je Wohnung für erdbebensicheren Ersatz | 875.000 Lira Zuschuss je Wohnung (dazu 875.000 Lira Kredit und 125.000 Lira Umzugshilfe; Programm 'Yarısı Bizden', Istanbul, bis 31.12.2027) | auf 5.000 Lira | ja | plausibel-prüfen | [Q66](#q66) |
| `m_versicherungspflicht` | Katastrophen-Pflichtversicherung | {x} % der Wohnungen mit Pflicht-Erdbebenversicherung | 58 % (11.628.088 von 20.032.000 Wohnungen; 2020: 53,8 %) | ganze Prozent | ja, mit Deckel 100 % | plausibel-prüfen | [Q67](#q67) |
| `m_baukredite` | Günstige Baukredite | benannte Zustände | Zustand: keine breite staatliche Zinsverbilligung; Marktzins ~3,5 % je Monat (Ø 30.10.2026); Programm 'İlk Evim' (1,20 % je Monat, 180 Monate) angekündigt, nicht gestartet (Stand April 2026) | – | nein | plausibel-prüfen | [Q68](#q68) |
| `m_fruehwarnsystem` | Frühwarnsystem | benannte Zustände | Zustand: Unwetterwarnungen auf Handys (AFAD 'Hayati Uyarı', nicht bei allen Netzbetreibern); Erdbebenwarnung nur privat (Android) und regional (Izmir, 12 Messpunkte); landesweites System mit ASELSAN vertraglich in Entwicklung | – | nein | plausibel-prüfen | [Q69](#q69) |
| `m_afad_ausbau` | Ausbau der Katastrophenbehörde (AFAD) | {x} Beschäftigte der Katastrophenbehörde | 8.541 Beschäftigte, davon 3.529 Such- und Rettungskräfte (Datum der Meldung unklar, 2025); 1,6 Mio. Freiwillige | auf 100 | ja | plausibel-prüfen | [Q70](#q70) |
| `m_polizei` | Polizei und Gendarmerie | {x} Beschäftigte der Polizei | rund 350.000 Beschäftigte der Polizei (EGM, alle Laufbahnen); Gendarmerie: Lücke; Personalausgaben 2026: Polizei 412,3 Mrd., Gendarmerie 287,1 Mrd. Lira (Entwurf) | auf 1.000 | ja | plausibel-prüfen | [Q71](#q71) |
| `m_polizeitechnik` | Moderne Sicherheitsverwaltung | {x} Mrd. Lira für Forensik und digitale Polizeitechnik je Jahr | Lücke | auf 0,5 Mrd. Lira | ja | Lücke | [Q72](#q72) |
| `m_verteidigung` | Verteidigungsausgaben | {x} % des BIP für Verteidigung | 2,33 % des BIP (NATO-Schätzung 2025; SIPRI: 1,9 % bzw. 30,0 Mrd. Dollar); Haushalt 2026: 1.202 Mrd. Lira für Verteidigung und Sicherheit, Ministerium 822,9 Mrd. | zwei Nachkommastellen | ja | plausibel-prüfen | [Q73](#q73) |
| `m_ruestungsindustrie` | Heimische Rüstungsindustrie | {x} Mrd. Dollar Rüstungs- und Luftfahrtexporte je Jahr | 10,05 Mrd. Dollar (2025; 2024: 7,15 Mrd.); neue Verträge 2025: 17,8 Mrd. Dollar | eine Nachkommastelle | ja | belegt | [Q74](#q74) |
| `m_uebungen` | Ausbildung und Übungen | {x} Flugstunden je Kampfpilot und Jahr | Lücke (nicht öffentlich) | auf 5 Stunden | ja | Lücke | [Q75](#q75) |
| `m_religionsbehoerde` | Budget der Religionsbehörde | {x} Mrd. Lira Haushalt der Religionsbehörde je Jahr | 174,389 Mrd. Lira (Haushalt 2026; davon Personal 148,8 Mrd.) | auf 1 Mrd. Lira | ja | belegt | [Q76](#q76) |
| `m_richterstellen` | Richter- und Staatsanwaltsstellen | {x} Richterinnen, Richter und Staatsanwälte je 100.000 Einwohner | rund 31 je 100.000 (abgeleitet: 26.642 Richter und Staatsanwälte am 23.09.2026, davon 18.167 Richter, ÷ 86,09 Mio. Einwohner); nur Richter ≈ 21 | ganze Zahl | ja | plausibel-prüfen | [Q77](#q77) |
| `m_haftvermeidung` | Haftvermeidung und Bewährung | {x} % der Gefangenen in Untersuchungshaft | 15,0 % (65.227 von 433.520 Gefangenen, 03.08.2026; 402 Anstalten für 304.956 Plätze) | eine Nachkommastelle | nein (umgekehrt: mehr Haftvermeidung = niedrigerer Anteil) | belegt | [Q78](#q78) |
| `m_denkmalschutz` | Denkmalschutz und Restaurierung | {x} restaurierte Stiftungsbaudenkmäler je Jahr | rund 100 je Jahr (abgeleitet: 201 Baudenkmäler in zwei Jahren laut Minister); 2025 davon 73 im Erdbebengebiet | auf 5 | ja | plausibel-prüfen | [Q79](#q79) |
| `m_kulturfoerderung` | Kunst- und Kulturförderung | {x} Mio. Lira Film- und Theaterförderung je Jahr | rund 414 Mio. Lira (Film 316,7 Mio. 2025 + private Theater 97,2 Mio. Saison 2025/26) | auf 5 Mio. Lira | ja | plausibel-prüfen | [Q80](#q80) |
| `m_archaeologie` | Ausgrabungen und Museen | {x} Ausgrabungen und Forschungsgrabungen je Jahr | rund 780 (2025, Ministerangabe; 776 laut Habertürk) | auf 10 | ja | plausibel-prüfen | [Q81](#q81) |

## Einheiten dreisprachig

| id | de | en | tr |
|---|---|---|---|
| `m_mindestlohn` | {x} Lira netto je Monat | {x} lira net per month | aylık net {x} lira |
| `m_renten` | Mindestrente {x} Lira je Monat | minimum pension {x} lira per month | en düşük emekli aylığı {x} lira |
| `m_kindergeld` | {x} Lira je Kind und Monat ab dem dritten Kind | {x} lira per child per month from the third child | üçüncü çocuktan itibaren çocuk başına aylık {x} lira |
| `m_sozialhilfe` | {x} Mrd. Lira Sozialhilfe je Jahr | {x} bn lira social assistance per year | yılda {x} milyar lira sosyal yardım |
| `m_arbeitslosengeld` | {x} % des letzten Bruttolohns | {x} % of last gross wage | son brüt ücretin %{x}'i |
| `m_kinderbetreuung` | {x} % der 3- bis 5-Jährigen in Kita oder Vorschule | {x} % of 3- to 5-year-olds in pre-school | 3-5 yaş okullaşma oranı %{x} |
| `m_ausbildung` | {x} Teilnehmer an İŞKUR-Kursen und Betriebsausbildung je Jahr | {x} participants in İŞKUR courses and on-the-job training per year | yılda {x} İŞKUR kurs ve işbaşı eğitim katılımcısı |
| `m_fachkraefteprogramm` | {x} Teilnehmer an Weiterbildung je Jahr | {x} participants in further training per year | yılda {x} mesleki gelişim katılımcısı |
| `m_zuzahlungen` | {x} Lira je Arztbesuch im staatlichen Krankenhaus | {x} lira per visit at a state hospital | devlet hastanesinde muayene başına {x} lira |
| `m_steuerfahndung` | {x} % der Steuerpflichtigen jährlich geprüft | {x} % of taxpayers audited per year | mükelleflerin yıllık %{x}'i incelendi |
| `m_kraftstoffsteuer` | {x} Lira Verbrauchsteuer (ÖTV) je Liter Benzin | {x} lira excise tax (ÖTV) per litre of petrol | benzinde litre başına {x} lira ÖTV |
| `m_immobiliensteuer` | Grundsteuer {x} ‰ des Steuerwerts (Wohnung in Großstadt) | property tax {x} ‰ of assessed value (dwelling in metropolitan city) | büyükşehirde konut emlak vergisi binde {x} |
| `m_exportfoerderung` | {x} Mrd. Dollar Exportkredite und -versicherungen der Eximbank je Jahr | {x} bn dollars of Eximbank export credit and insurance per year | Eximbank'tan yılda {x} milyar dolar ihracat kredisi ve sigortası |
| `m_investitionsanreize` | {x} Mrd. Lira geförderte Investitionen je Jahr | {x} bn lira of incentivised investment per year | yılda {x} milyar lira teşvikli yatırım |
| `m_kreditgarantien` | {x} Mrd. Lira staatlich verbürgter Kreditrahmen | {x} bn lira of state-guaranteed credit line | {x} milyar lira Hazine destekli kefalet kredi limiti |
| `m_tourismuswerbung` | {x} Mio. Dollar Werbebudget im Ausland je Jahr | {x} m dollars foreign tourism advertising per year | yılda {x} milyon dolar yurt dışı tanıtım bütçesi |
| `m_kmu` | {x} Mrd. Lira KOSGEB-Förderung je Jahr | {x} bn lira KOSGEB SME support per year | yılda {x} milyar lira KOSGEB desteği |
| `m_zoelle` | {x} % durchschnittlicher Zollsatz | {x} % average tariff | ortalama gümrük vergisi %{x} |
| `m_industrie_modernisierung` | {x} Mrd. Dollar Hightech-Förderprogramm (HIT-30) bis 2030 | {x} bn dollars high-tech incentive programme (HIT-30) to 2030 | 2030'a kadar {x} milyar dolarlık HIT-30 yüksek teknoloji desteği |
| `m_krankenhausbau` | {x} Krankenhausbetten je 1.000 Einwohner | {x} hospital beds per 1,000 inhabitants | 1.000 kişi başına {x} hastane yatağı |
| `m_aerztegehalt` | {x} Lira netto je Monat für Ärztinnen und Ärzte im Berufseinstieg | {x} lira net per month for entry-level doctors | mesleğe yeni başlayan hekime aylık net {x} lira |
| `m_lehrergehaelter` | {x} Lira netto je Monat für neu eingestellte Lehrkräfte | {x} lira net per month for newly appointed teachers | yeni atanan öğretmene aylık net {x} lira |
| `m_schulbau` | {x} neue Klassenräume je Jahr | {x} new classrooms per year | yılda {x} yeni derslik |
| `m_berufsschulen` | {x} % der Oberstufenschüler in Berufs- und Fachschulen | {x} % of upper-secondary pupils in vocational schools | ortaöğretim öğrencilerinin %{x}'i mesleki ve teknik eğitimde |
| `m_unigruendungen` | {x} Studienplätze an staatlichen Hochschulen je Jahr | {x} first-year places at state universities per year | devlet üniversitelerinde yılda {x} kontenjan |
| `m_stipendien` | {x} Lira KYK-Stipendium je Monat (Bachelor) | {x} lira KYK grant per month (bachelor) | lisans öğrencisine aylık {x} lira KYK bursu |
| `m_forschung` | {x} % des BIP für Forschung und Entwicklung | {x} % of GDP for research and development | GSYH'nin %{x}'i Ar-Ge harcaması |
| `m_bildungstechnik` | {x} Mrd. Lira für Bildungstechnik je Jahr | {x} bn lira for education technology per year | yılda {x} milyar lira eğitim teknolojisi harcaması |
| `m_medizintechnik` | {x} Mrd. Lira Investitionen des Gesundheitsministeriums je Jahr | {x} bn lira health ministry investment per year | Sağlık Bakanlığı'nın yılda {x} milyar lira yatırımı |
| `m_autobahnen` | {x} km neue Autobahn je Jahr | {x} km of new motorway per year | yılda {x} km yeni otoyol |
| `m_oepp_garantien` | {x} Mrd. Lira Garantie- und Mietzahlungen an private Betreiber je Jahr | {x} bn lira guarantee and lease payments to private operators per year | özel işletmecilere yılda {x} milyar lira garanti ve kira ödemesi |
| `m_bahn` | {x} Mrd. Lira Bahninvestitionen je Jahr | {x} bn lira rail investment per year | yılda {x} milyar lira demiryolu yatırımı |
| `m_nahverkehr` | {x} km städtische Schienenstrecken im Bau | {x} km of urban rail under construction | yapımı süren {x} km kent içi raylı sistem |
| `m_breitband` | {x} Mio. Glasfaseranschlüsse | {x} m fibre subscriptions | {x} milyon fiber abone |
| `m_regionalfoerderung` | {x} Mrd. Lira für die Entwicklungsagenturen je Jahr | {x} bn lira for regional development agencies per year | kalkınma ajanslarına yılda {x} milyar lira |
| `m_smart_infrastruktur` | {x} Mrd. Lira für Verkehrsleit- und Sensortechnik je Jahr | {x} bn lira for traffic management and sensor systems per year | akıllı ulaşım sistemlerine yılda {x} milyar lira |
| `m_instandhaltung` | {x} Mrd. Lira für Erhaltung von Straßen und Schienen je Jahr | {x} bn lira for road and rail maintenance per year | yol ve demiryolu bakımına yılda {x} milyar lira |
| `m_handelssysteme` | {x} Stunden Zollabfertigung bei der Einfuhr | {x} hours import customs clearance | ithalatta {x} saat gümrük işlemi |
| `m_solar_wind` | {x} GW neue Wind- und Solarleistung je Jahr | {x} GW of new wind and solar capacity per year | yılda {x} GW yeni rüzgâr ve güneş kapasitesi |
| `m_yeka_serie` | {x} GW ausgeschriebene YEKA-Leistung je Jahr | {x} GW of YEKA capacity tendered per year | yılda {x} GW YEKA ihalesi |
| `m_gasfoerderung` | {x} Mio. m³ Gas je Tag aus dem Schwarzen Meer | {x} m cubic metres of Black Sea gas per day | Karadeniz'den günde {x} milyon m³ gaz |
| `m_energieeffizienz` | {x} neu zugelassene Elektroautos je Jahr | {x} new electric cars registered per year | yılda {x} yeni elektrikli otomobil |
| `m_gashub` | {x} Mrd. m³ Pipeline-Kapazität über TurkStream und TANAP je Jahr | {x} bn cubic metres pipeline capacity via TurkStream and TANAP per year | TürkAkım ve TANAP üzerinden yılda {x} milyar m³ boru hattı kapasitesi |
| `m_lng_vertraege` | {x} Mrd. m³ Flüssiggas unter Langzeitvertrag je Jahr | {x} bn cubic metres of LNG under long-term contract per year | uzun vadeli sözleşmeyle yılda {x} milyar m³ LNG |
| `m_regas_ausbau` | {x} Mio. m³ LNG-Anlandekapazität je Tag | {x} m cubic metres LNG regasification capacity per day | günde {x} milyon m³ LNG gazlaştırma kapasitesi |
| `m_gasspeicher` | {x} Mrd. m³ Gasspeicher | {x} bn cubic metres of gas storage | {x} milyar m³ gaz depolama |
| `m_netzausbau` | {x} Mrd. Lira Investitionen ins Übertragungsnetz je Jahr | {x} bn lira transmission grid investment per year | iletim şebekesine yılda {x} milyar lira yatırım |
| `m_speicher_smartgrid` | {x} MW Batteriespeicher am Netz | {x} MW of battery storage on the grid | şebekede {x} MW batarya depolama |
| `m_agrarsubventionen` | {x} Mrd. Lira Agrarförderung je Jahr | {x} bn lira agricultural support per year | yılda {x} milyar lira tarımsal destek |
| `m_bewaesserung` | {x} % der Bewässerungsfläche mit Tropfbewässerung | {x} % of irrigated area under drip irrigation | sulanan alanın %{x}'i damla sulama |
| `m_staudaemme` | {x} Mio. m³ neues Speichervolumen je Jahr | {x} m cubic metres of new storage per year | yılda {x} milyon m³ yeni depolama hacmi |
| `m_wasserleitungen` | {x} % der Gemeindebevölkerung an Kläranlagen | {x} % of municipal population served by wastewater treatment | belediye nüfusunun %{x}'i atıksu arıtma hizmetinde |
| `m_saatgut` | {x} Tonnen zertifiziertes Saatgut je Jahr | {x} tonnes of certified seed per year | yılda {x} ton sertifikalı tohum |
| `m_mechanisierung` | {x} Traktoren im Bestand | {x} tractors in use | {x} traktör |
| `m_agrarforschung` | {x} Mio. Lira für Agrarforschung je Jahr | {x} m lira for agricultural research per year | yılda {x} milyon lira tarımsal araştırma |
| `m_bauindustrie` | {x} Fertigteil- und Modulwohnungen je Jahr | {x} prefabricated and modular homes per year | yılda {x} prefabrik ve modüler konut |
| `m_sozialwohnungen` | {x} fertiggestellte TOKİ-Sozialwohnungen je Jahr | {x} TOKİ social homes completed per year | yılda {x} TOKİ sosyal konutu tamamlandı |
| `m_stadterneuerung` | {x} erneuerte Wohnungen je Jahr | {x} homes rebuilt per year | yılda {x} konut dönüştürüldü |
| `m_gebaeudeverstaerkung` | {x} Lira Zuschuss je Wohnung für erdbebensicheren Ersatz | {x} lira grant per home for earthquake-safe replacement | deprem dönüşümünde konut başına {x} lira hibe |
| `m_versicherungspflicht` | {x} % der Wohnungen mit Pflicht-Erdbebenversicherung | {x} % of homes with compulsory earthquake insurance | konutların %{x}'i zorunlu deprem sigortalı |
| `m_afad_ausbau` | {x} Beschäftigte der Katastrophenbehörde | {x} disaster agency staff | {x} AFAD personeli |
| `m_polizei` | {x} Beschäftigte der Polizei | {x} police staff | {x} emniyet personeli |
| `m_polizeitechnik` | {x} Mrd. Lira für Forensik und digitale Polizeitechnik je Jahr | {x} bn lira for forensics and police IT per year | adli bilişim ve emniyet teknolojisine yılda {x} milyar lira |
| `m_verteidigung` | {x} % des BIP für Verteidigung | {x} % of GDP on defence | GSYH'nin %{x}'i savunma harcaması |
| `m_ruestungsindustrie` | {x} Mrd. Dollar Rüstungs- und Luftfahrtexporte je Jahr | {x} bn dollars defence and aerospace exports per year | yılda {x} milyar dolar savunma ve havacılık ihracatı |
| `m_uebungen` | {x} Flugstunden je Kampfpilot und Jahr | {x} flight hours per combat pilot per year | muharip pilot başına yılda {x} uçuş saati |
| `m_religionsbehoerde` | {x} Mrd. Lira Haushalt der Religionsbehörde je Jahr | {x} bn lira religious affairs budget per year | Diyanet'e yılda {x} milyar lira bütçe |
| `m_richterstellen` | {x} Richterinnen, Richter und Staatsanwälte je 100.000 Einwohner | {x} judges and prosecutors per 100,000 inhabitants | 100.000 kişiye {x} hâkim ve savcı |
| `m_haftvermeidung` | {x} % der Gefangenen in Untersuchungshaft | {x} % of prisoners in pre-trial detention | hükümlü ve tutukluların %{x}'i tutuklu |
| `m_denkmalschutz` | {x} restaurierte Stiftungsbaudenkmäler je Jahr | {x} restored foundation monuments per year | yılda {x} vakıf eseri restore edildi |
| `m_kulturfoerderung` | {x} Mio. Lira Film- und Theaterförderung je Jahr | {x} m lira film and theatre support per year | yılda {x} milyon lira sinema ve tiyatro desteği |
| `m_archaeologie` | {x} Ausgrabungen und Forschungsgrabungen je Jahr | {x} excavations and archaeological surveys per year | yılda {x} kazı ve yüzey araştırması |

## Benannte Zustände

### `m_fruehrente` – Frühverrentung

Startzustand 2026: **Wie heute: Altersgrenze 58/60, ab 2036 schrittweise bis 65**

| # | de | en | tr |
|---|---|---|---|
| 1 | Altersgrenzen verschärfen: 65 für alle ab 2030 | Tighten age limits: 65 for all from 2030 | Yaş sınırını sıkılaştır: 2030'dan itibaren herkes için 65 |
| 2 | Wie heute: Altersgrenze 58/60, ab 2036 schrittweise bis 65 | As today: age 58/60, rising to 65 from 2036 | Bugünkü gibi: 58/60 yaş, 2036'dan itibaren kademeli 65 |
| 3 | Stufenrente für Eintritt 1999–2008 (Kademeli emeklilik) | Phased early retirement for entrants 1999–2008 | 1999–2008 girişliler için kademeli emeklilik |
| 4 | Zweite EYT-Welle: Eintritt bis 2008 ohne Altersgrenze | Second EYT wave: entrants up to 2008 without age limit | İkinci EYT: 2008'e kadar girişlilere yaş şartı yok |

### `m_verwaltungsdigital` – Digitale Verwaltung und Steuertechnik

Startzustand 2026: **E-Rechnung Pflicht für größere Betriebe (wie heute)**

| # | de | en | tr |
|---|---|---|---|
| 1 | Papierakten | Paper files | Kâğıt dosyalar |
| 2 | Portal für Bürger (e-Devlet), Belege auf Papier | Citizen portal (e-Devlet), paper receipts | Vatandaş portalı (e-Devlet), kâğıt belgeler |
| 3 | E-Rechnung Pflicht für größere Betriebe (wie heute) | E-invoicing mandatory for larger firms (as today) | Büyük işletmelere e-fatura zorunlu (bugünkü gibi) |
| 4 | E-Rechnung für alle, Datenabgleich zwischen Behörden | E-invoicing for all, data matching between agencies | Herkese e-fatura, kurumlar arası veri eşleştirme |
| 5 | Vollständig vernetzt: Belege in Echtzeit, vorausgefüllte Erklärungen | Fully connected: real-time receipts, pre-filled returns | Tam entegre: anlık belge, hazır beyanname |

### `m_digitale_oeffentlichkeit` – Digitale Öffentlichkeit und Beteiligung

Startzustand 2026: **Portal und Beschwerdestelle mit Antwortpflicht (wie heute)**

| # | de | en | tr |
|---|---|---|---|
| 1 | Nur Behördengänge online | Online services only | Yalnızca çevrim içi kamu hizmetleri |
| 2 | Portal und Beschwerdestelle mit Antwortpflicht (wie heute) | Portal and complaints office with duty to respond (as today) | Portal ve yanıt yükümlü şikâyet merkezi (bugünkü gibi) |
| 3 | Offene Daten und Online-Anhörung zu Gesetzentwürfen | Open data and online consultation on draft laws | Açık veri ve kanun taslaklarına çevrim içi görüş |
| 4 | Bürgerhaushalt und Volksbegehren online mit verbindlicher Antwort | Participatory budget and online petitions with binding reply | Katılımcı bütçe ve bağlayıcı yanıtlı çevrim içi dilekçe |

### `m_sakarya_phase3` – Sakarya Phase 3 (zweite FPU)

Startzustand 2026: **Vertrag vergeben, Anlage im Bau (2026)**

| # | de | en | tr |
|---|---|---|---|
| 1 | Nicht begonnen | Not started | Başlanmadı |
| 2 | Vertrag vergeben, Anlage im Bau (2026) | Contract awarded, unit under construction (2026) | Sözleşme imzalandı, platform inşa hâlinde (2026) |
| 3 | Anlage installiert, Bohrungen angeschlossen | Unit installed, wells tied in | Platform yerleştirildi, kuyular bağlandı |
| 4 | In Betrieb: rund 40 Mio. m³ je Tag | In operation: about 40 m cubic metres per day | Üretimde: günde yaklaşık 40 milyon m³ |

### `m_akkuyu_ppa` – Akkuyu-Vertrag nachverhandeln

Startzustand 2026: **Vertrag halten (12,35 US-Cent je kWh)**

| # | de | en | tr |
|---|---|---|---|
| 1 | Vertrag halten (12,35 US-Cent je kWh) | Keep the contract (12.35 US cents per kWh) | Sözleşmeye bağlı kal (kWh başına 12,35 sent) |
| 2 | Nachverhandlung anbieten (Laufzeit gegen Preis) | Offer renegotiation (term for price) | Yeniden müzakere öner (süre karşılığı fiyat) |
| 3 | Nachverhandlung erzwingen (Genehmigungen als Druckmittel) | Force renegotiation (permits as leverage) | Yeniden müzakereyi dayat (izinler baskı aracı) |
| 4 | Abnahme verweigern und Schiedsgericht riskieren | Refuse offtake and risk arbitration | Alımı reddet, tahkimi göze al |

### `m_heimische_kohle` – Heimische Kohle (Afşin-Elbistan)

Startzustand 2026: **Wie heute: +688 MW geplant, kein Bau**

| # | de | en | tr |
|---|---|---|---|
| 1 | Kohle zurückfahren: Altblöcke stilllegen | Scale back coal: retire old units | Kömürü azalt: eski üniteleri kapat |
| 2 | Wie heute: +688 MW geplant, kein Bau | As today: +688 MW planned, no construction | Bugünkü gibi: +688 MW planlı, inşaat yok |
| 3 | Bau der zwei Blöcke (+688 MW) | Build the two units (+688 MW) | İki üniteyi inşa et (+688 MW) |
| 4 | Großausbau des Reviers (weitere Kraftwerke) | Major expansion of the coalfield (further plants) | Havzada büyük genişleme (yeni santraller) |

### `m_preiswahrheit` – Preiswahrheit bei Energie

Startzustand 2026: **Staffeltarif: Vielverbraucher zahlen mehr (wie heute)**

| # | de | en | tr |
|---|---|---|---|
| 1 | Deckel für alle | Price cap for everyone | Herkese fiyat tavanı |
| 2 | Staffeltarif: Vielverbraucher zahlen mehr (wie heute) | Tiered tariff: heavy users pay more (as today) | Kademeli tarife: çok tüketen fazla öder (bugünkü gibi) |
| 3 | Marktpreis mit Sozialtarif für Bedürftige | Market price with social tariff for the needy | İhtiyaç sahiplerine sosyal tarifeli piyasa fiyatı |
| 4 | Volle Marktpreise ohne Stützung | Full market prices without support | Desteksiz tam piyasa fiyatı |

### `m_baukredite` – Günstige Baukredite

Startzustand 2026: **Einzelaktionen der Staatsbanken (wie heute)**

| # | de | en | tr |
|---|---|---|---|
| 1 | Keine Förderung, Marktzins | No support, market rate | Destek yok, piyasa faizi |
| 2 | Einzelaktionen der Staatsbanken (wie heute) | Ad-hoc state-bank campaigns (as today) | Kamu bankalarının dönemsel kampanyaları (bugünkü gibi) |
| 3 | Programm für Erstkäufer: 1,20 % je Monat, 15 Jahre | First-buyer programme: 1.20 % per month, 15 years | İlk ev programı: aylık %1,20, 15 yıl |
| 4 | Breite Zinssubvention für alle Käufer | Broad interest subsidy for all buyers | Tüm alıcılara geniş faiz desteği |

### `m_fruehwarnsystem` – Frühwarnsystem

Startzustand 2026: **Unwetterwarnung aufs Handy, Bebenwarnung nur regional (wie heute)**

| # | de | en | tr |
|---|---|---|---|
| 1 | Kein Warnsystem | No warning system | Uyarı sistemi yok |
| 2 | Unwetterwarnung aufs Handy, Bebenwarnung nur regional (wie heute) | Storm alerts to phones, quake alerts only regional (as today) | Telefona hava uyarısı, deprem uyarısı yalnız bölgesel (bugünkü gibi) |
| 3 | Landesweite Sirenen und Bebenwarnung in Ballungsräumen | Nationwide sirens and quake alerts in metro areas | Ülke çapında siren ve büyükşehirlerde deprem uyarısı |
| 4 | Beben und Sturzflut landesweit auf allen Telefonen in Sekunden | Quakes and flash floods nationwide on all phones within seconds | Deprem ve ani sel uyarısı saniyeler içinde tüm telefonlarda |

## Quellen und Hinweise je Maßnahme

<a id="q1"></a>**Q1 `m_mindestlohn` – Mindestlohn** (belegt)  
Quelle: [KPMG Vergi: 2026 Yılı Asgari Ücreti Açıklandı](https://kpmgvergi.com/yayinlar/mali-bultenler/sosyal-guvenlik/2026-yili-asgari-ucreti-aciklandi/3342), Dez. 2025  
Beleg: „2026 asgari ücreti brüt 33.030 TL, net 28.075,50 TL; Resmî Gazete 26.12.2025; artış %27,01 (Suchauszug, mehrere Quellen übereinstimmend)“  
Hinweis: Satz-Maßnahme. Zweitanzeige brutto = netto × 33.030/28.075,50 (1,1765). Kein Zwischenschritt Juli 2026.

<a id="q2"></a>**Q2 `m_renten` – Rentenerhöhungen** (belegt)  
Quelle: [KPMG Vergi: Asgari Ücret Desteği ve En Düşük Emekli Aylığı (Gesetz Nr. 7573, RG 29.01.2026 Nr. 33152)](https://kpmgvergi.com/Content//FinancialBulletins/AsgariÜcretDestegiveEnDusukEmekliAyligiHk._29012026_0343295334351.pdf), 29.01.2026  
Beleg: „5510 sayılı Kanunun ek 19'uncu maddesinde düzenlenen en düşük emekli aylığı tutarı 16.881 TL'den 20.000 TL'ye yükseltilmiş“  
Hinweis: Betrifft ~4,9 Mio. Rentner. Juliwert 23.552 nur aus e-yasamrehberi.com (Stand 07.10.2026) – vor Übernahme an RG prüfen. Für den Spielstart 2028 den Wert Januar 2026 als 100 % nehmen.

<a id="q3"></a>**Q3 `m_fruehrente` – Frühverrentung** (belegt)  
Quelle: [Gesetz Nr. 5510 (Sosyal Sigortalar ve GSS Kanunu) Art. 28, Gesetz Nr. 7438 (EYT), RG 03.03.2023](https://hukukcularevi.com/sgk-emeklilik-yasi-sigortalilik-suresi-5510/), 03.03.2023  
Beleg: „3 Mart 2023 tarihli Resmi Gazete'de yayımlanan 7438 sayılı Kanun ile bu sigortalılar için yaş şartı kaldırılmıştır; 1/1/2048 tarihinden itibaren ise kadın ve erkek için 65“  
Hinweis: Ein Renteneintrittsalter skaliert nicht verhältnisgleich (150 % von 60 Jahren = 90 Jahre ist Unsinn). Benannte Zustände; Kosten je Stufe über die Zahl der begünstigten Jahrgänge (EYT: ~12,5 Mio. Anträge, RECHERCHE_GLM_1).

<a id="q4"></a>**Q4 `m_kindergeld` – Kindergeld und Familienhilfe** (plausibel-prüfen)  
Quelle: [Dünya: Devletten 15 ayrı ödeme (dazu gazetebirlik.com, Doğum yardımı 2026 Temmuz)](https://www.dunya.com/foto-galeri/ekonomi/devletten-15-ayri-odeme-kimler-alabiliyor-ne-kadar-yatiyor-galeri-839345), 2026  
Beleg: „1. çocuk: tek seferlik 5.000 TL; 2. çocuk: aylık 1.500 TL; 3. ve sonraki çocuklar: aylık 5.000 TL, 5 yaşına kadar (Suchauszug)“  
Hinweis: Alle drei Beträge skalieren gemeinsam (1. Kind = 1,0 ×, 2. Kind = 0,3 ×, 3. Kind = 1,0 × des Anzeigewerts). Laut Ministerium 788.573 Kinder mit laufender Zahlung (Sept. 2026). Primärquelle: Präsidialbeschluss zur Geburtenhilfe in der RG; aile.gov.tr.

<a id="q5"></a>**Q5 `m_sozialhilfe` – Sozialhilfe** (plausibel-prüfen)  
Quelle: [Aile ve Sosyal Hizmetler Bakanlığı: 2026 yılı bütçesi TBMM Genel Kurulunda kabul edildi (Betrag laut Cevdet Yılmaz, Presse)](https://aile.gov.tr/sgbd/haberler/bakanligimizin-2026-yili-butcesi-tbmm-genel-kurulunda-kabul-edildi/), Dez. 2025  
Beleg: „2026 yılı için sosyal yardım bütçesinin 917 milyar liraya çıkarılacağını açıkladı; 2025 yılında 3 milyon 991 bin 766 hane sosyal yardımlardan yararlandırıldı (Suchauszug)“  
Hinweis: Alternative Anzeige: Empfängerhaushalte (3,99 Mio., 2025). 917 Mrd. ist eine Ankündigung, nicht der Haushaltsansatz – an 'Rakamlarla Türkiye'de Sosyal Yardım' und Bütçe-Sunum prüfen.

<a id="q6"></a>**Q6 `m_arbeitslosengeld` – Arbeitslosengeld** (belegt)  
Quelle: [Habertürk: 2026 işsizlik maaşı ne kadar oldu? (Gesetz Nr. 4447 Art. 50)](https://www.haberturk.com/2026-issizlik-maasi-ne-kadar-oldu-zamli-issizlik-maasi-kac-tl-ye-yukseldi-en-dusuk-ve-en-yuksek-issizlik-odenegi-ne-kadar-3849742), Jan. 2026  
Beleg: „Brüt asgari ücretin %80'i işsizlik ödeneğinin tavan değerini oluşturur. 2026'da bu tutar 33.030 × %80 = 26.424 TL'dir“  
Hinweis: Ersatzquote skaliert verhältnisgleich (150 % = 60 % des Lohns). Die Deckelung (80 % des Brutto-Mindestlohns) sollte mitwachsen, sonst wirkt die Erhöhung nur unten. Dauer separat (180/240/300 Tage).

<a id="q7"></a>**Q7 `m_kinderbetreuung` – Kinderbetreuung** (plausibel-prüfen)  
Quelle: [ARTI Eğitim Dergisi Nisan 2026 (nach MEB-Statistik); dazu MEB: 2025-2026 Örgün Eğitim İstatistikleri](https://www.egitimtercihi.com/uploads/pdf/ARTI_EGITIM_DERGISI_NISAN_2026.pdf), April 2026  
Beleg: „Net okullaşma oranı 3-5 yaş aralığında %49, 4-5 yaş aralığında %60,8, 5 yaşta ise %82,5 (Suchauszug)“  
Hinweis: Primärquelle: MEB 'Millî Eğitim İstatistikleri – Örgün Eğitim 2025/'26', Tabelle Net okullaşma oranı. Unter 3 Jahren gibt es kaum öffentliche Krippen; die Quote ist die tragfähige Größe.

<a id="q8"></a>**Q8 `m_ausbildung` – Berufsausbildungsprogramme** (Lücke)  
Quelle: [Alomaliye: Kayıtlı işsiz 2 161 561 kişi (İŞKUR-Bulletin Mai 2025)](https://www.alomaliye.com/2025/06/16/kayitli-issiz-2-161-561-kisi/), 16.06.2025  
Beleg: „5.815 İşbaşı Eğitim Programına 27.803 kişi katılmış; 253 Mesleki Eğitim Kursuna 5.892 kişi katılmıştır“  
Hinweis: Suchhinweis: İŞKUR 2025 Yılı Faaliyet Raporu (iskur.gov.tr/medya/wmthqzsj/2025-yılı-faaliyet-raporu.pdf), Tabelle 'Aktif İşgücü Programları – yararlanıcı sayısı'. Dreifach mit m_berufsschulen und m_fachkraefteprogramm (B-6).

<a id="q9"></a>**Q9 `m_fachkraefteprogramm` – Fachkräfte und Weiterbildung** (Lücke)  
Quelle: [İŞKUR 2025 Yılı Faaliyet Raporu](https://www.iskur.gov.tr/medya/wmthqzsj/2025-yılı-faaliyet-raporu.pdf), 2026  
Beleg: „– (Bericht im Suchauszug nur Titelseite)“  
Hinweis: Empfehlung: mit m_ausbildung zusammenlegen (B-6). Alternative Größe: MEB-Meisterausbildung (Mesleki Eğitim Merkezi, 'çırak ve kalfa' Schülerzahl) – Suchhinweis MEB MESEM öğrenci sayısı 2025-2026.

<a id="q10"></a>**Q10 `m_zuzahlungen` – Zuzahlungen der Patienten** (belegt)  
Quelle: [Alomaliye: Hastane muayene katılım payları yeniden belirlendi (SUT-Änderung, RG 01.07.2026 Nr. 33297)](https://www.alomaliye.com/2026/07/01/hastane-muayene-katilim-paylari-yeniden-belirlendi/), 01.07.2026  
Beleg: „İkinci basamak resmi sağlık hizmeti sunucularında (devlet hastaneleri) katılım payı 26 TL'den 50 TL'ye çıkarıldı“  
Hinweis: Satz-Maßnahme. Die anderen Stufen (90/100 Lira) skalieren mit; Hausarzt bleibt 0. Medikamentenzuzahlung (3,76 Lira bis 3 Packungen) als Nebenangabe.

<a id="q11"></a>**Q11 `m_steuerfahndung` – Steuerfahndung** (plausibel-prüfen)  
Quelle: [Ekonomi Gazetesi: Vergi Denetim Kurulu faaliyet raporundan 2025'e dair veriler](https://www.ekonomigazetesi.com/kose-yazisi/vergi-denetim-kurulu-faaliyet-raporundan-2025e-dair-veriler-76528), 2026  
Beleg: „İnceleme oranı 2024'te toplam mükelleflerin %2,91'i iken 2025'te %6,72'ye çıktı (Suchauszug)“  
Hinweis: Primärquelle: VDK 2025 Yılı Faaliyet Raporu (ms.hmb.gov.tr/uploads/sites/17/2026/03/VDK-2025-Yili-Faaliyet-Raporu-7ed50b67d73e89eb.pdf). Prüferzahl (7.295 von 17.882 Planstellen) nur aus Presse.

<a id="q12"></a>**Q12 `m_kraftstoffsteuer` – Steuer auf Kraftstoff** (belegt)  
Quelle: [PwC KDV ve ÖTV Bülteni 2026/1 (Präsidialbeschluss Nr. 10799, RG 31.12.2025 Nr. 33124, 5. Mükerrer)](https://www.pwc.com.tr/tr/Hizmetlerimiz/vergi/dolayli-vergi/bultenler/kdv-ötv-bültenleri/2026/petrol-urunleri-ile-tutun-mamulleri-ve-alkollu-iceceklerde-maktu-otv-artisi.pdf), Jan. 2026  
Beleg: „95 oktan için 13,8642 TL'den 14,8277 TL'ye; maktu ÖTV tutarları %6,95 artırıldı (Suchauszug)“  
Hinweis: Satz-Maßnahme. Diesel (Motorin) skaliert mit: Regelwert laut Beschluss vom 13.08.2026 ab 01.01.2027 13,9006 Lira/l. Real per Präsidialbeschluss (B-4).

<a id="q13"></a>**Q13 `m_immobiliensteuer` – Steuer auf Immobilien und Vermögen** (belegt)  
Quelle: [Alomaliye: Emlak Vergisi Kanunu Genel Tebliği (Seri No: 88/89) – 2026 Değerli Konut Vergisi, RG 31.12.2025](https://www.alomaliye.com/2025/12/31/emlak-vergisi-kanunu-genel-tebligi-seri-no-88-2026-degerli-konut-vergisi/), 31.12.2025  
Beleg: „değerli konut vergisine tabi olma eşiği 17.711.000 TL; tarife binde 3, binde 6 ve binde 10; konutta binde 1, büyükşehirde binde 2 (Suchauszug)“  
Hinweis: Satz-Maßnahme; alle Sätze (1/2 ‰ und 3/6/10 ‰) skalieren gemeinsam. Rechtsgrundlage Gesetz Nr. 1319 Art. 8 (Satz verdoppelt in Großstädten).

<a id="q14"></a>**Q14 `m_exportfoerderung` – Exportförderung** (plausibel-prüfen)  
Quelle: [Bengütürk: Türk sanayiinden tarihi ihracat rekoru](https://www.benguturk.com/ekonomi/turk-sanayiinden-tarihi-ihracat-rekoru-254304h), Jan. 2026  
Beleg: „Eximbank üzerinden 2025'te ihracatçılara 54 milyar dolar ihracat finansman desteği sağlandı (Suchauszug)“  
Hinweis: 2024-Wert 48,7 Mrd. vom Handelsministerium (ticaret.gov.tr) belegt. 2025: Primärquelle Türk Eximbank Faaliyet Raporu 2025.

<a id="q15"></a>**Q15 `m_investitionsanreize` – Investitionsanreize** (plausibel-prüfen)  
Quelle: [Alomaliye: Nisan ayında 81 milyar TL'lik yatırım teşvik belgesi düzenlendi (Bülten Sanayi ve Teknoloji Bakanlığı)](https://www.alomaliye.com/2026/05/22/nisan-ayinda-81-milyar-tllik-yatirim-tesvik-belgesi-duzenlendi/), 22.05.2026  
Beleg: „2025 Haziran–2026 Nisan döneminde, 2025/9903 sayılı Karar kapsamında toplam sabit yatırım tutarı 897,5 milyar TL olan 4 bin 500 yatırım teşvik belgesi düzenlendi“  
Hinweis: Zeigt das geförderte Investitionsvolumen, nicht den Steuerverzicht. Den Steuerverzicht (vergi harcaması) liefert der Vergi Harcamaları Raporu im Haushaltsentwurf (Lücke).

<a id="q16"></a>**Q16 `m_kreditgarantien` – Staatliche Kreditgarantien** (plausibel-prüfen)  
Quelle: [Ekonomi Gazetesi: 70 milyar liralık finansmana ilgi az](https://www.ekonomigazetesi.com/ekonomi/70-milyar-liralik-finansmana-ilgi-az-76861), März 2026  
Beleg: „27 Mart 2026 itibarıyla destek paketlerinin toplam kredi limiti 201.6 milyar liraya ulaştı. Bu limitin 129.9 milyar lirası kullanılmış (Suchauszug)“  
Hinweis: Eine spätere Meldung nennt 321,5 Mrd. Lira (Datum unklar). Primärquelle: KGF Faaliyet Raporu / Hazine-Pressemitteilungen.

<a id="q17"></a>**Q17 `m_tourismuswerbung` – Tourismuswerbung** (Lücke)  
Quelle: [Ekonomim: 'Tanıtıma 140 milyon dolar harcadık, turizm 37 milyar dolarla rekor kıracak'](https://www.ekonomim.com/ekonomi/tanitima-140-milyon-dolar-harcadik-turizm-37-milyar-dolarla-rekor-kiracak-haberi-664881), 2022  
Beleg: „TGA 2021'de Türkiye'nin tanıtımı için 110 milyon dolar harcadı, bu yıl bu rakam 140 milyon dolara ulaşacak (Suchauszug)“  
Hinweis: Wert ist veraltet. Suchhinweis: TGA (Türkiye Turizm Tanıtım ve Geliştirme Ajansı) Faaliyet Raporu 2025; TGA finanziert sich zu ~19 % aus dem Staat, Rest aus Abgabe der Betriebe.

<a id="q18"></a>**Q18 `m_kmu` – Mittelstandsförderung** (belegt)  
Quelle: [KOSGEB 2025 Yılı Faaliyet Raporu](https://webdosya.kosgeb.gov.tr/Content/Upload/Dosya/Kurumsal/2026/KOSGEB_2025_Y%C4%B1l%C4%B1_Faaliyet_Raporu.pdf), 2026  
Beleg: „yıl içinde 57.437 işletmeye toplam 34,8 milyar TL finansman sağladık“  
Hinweis: 1. Halbjahr 2026: 27,08 Mrd. Lira an 24.424 Betriebe (Presse) – Größenordnung 2026 eher ~55 Mrd. Für den Start Jahreswert 2025 nehmen.

<a id="q19"></a>**Q19 `m_zoelle` – Einfuhrzölle** (belegt)  
Quelle: [WTO Tariff & Trade Data: Türkiye profile](https://ttd.wto.org/en/profiles/turkiye), 2025  
Beleg: „simple average MFN applied tariff 17.5 % (2024); trade-weighted 10.7 % (Suchauszug)“  
Hinweis: Satz-Maßnahme. Achtung: Der Spieltext meint 'außerhalb der Zollunion' – EU-Waren zollfrei, also wirkt der Durchschnitt nur auf Drittländer. 2019 lag er bei 9,4 % (Zusatzzölle seit 2020).

<a id="q20"></a>**Q20 `m_industrie_modernisierung` – Industrielle Modernisierung** (plausibel-prüfen)  
Quelle: [İMMİB: HIT-30 High Tech Türkiye Yatırım Programı](https://immib.org.tr/TR/hit-30-high-tech-turkiye-yatirim-programi), Juli 2024  
Beleg: „vergi teşvikleri ve hibe desteklerinden oluşan toplam 30 milyar dolarlık kaynak yüksek teknoloji yatırımlarına yönlendirilecek (Suchauszug)“  
Hinweis: Rahmen über sechs Jahre, kein Jahresbudget (≈5 Mrd. Dollar je Jahr abgeleitet). Alternativ als Jahreswert anzeigen: '{x} Mrd. Dollar je Jahr', Start 5.

<a id="q21"></a>**Q21 `m_krankenhausbau` – Krankenhausbau** (plausibel-prüfen)  
Quelle: [BirGün: Özel hastaneler pastanın kremasını sıyırıyor (nach Sağlık İstatistikleri Yıllığı 2024 Haber Bülteni); dazu TTB](https://www.birgun.net/makale/ozel-hastaneler-pastanin-kremasini-siyiriyor-660367), 2025  
Beleg: „Türkiye'de 2024 yılı itibarıyla 1.562 hastane mevcut. Geçtiğimiz yıl sonu itibarıyla 268.359 olan hastane yatak sayısının beşte biri de özel sektörde“  
Hinweis: Bestandsgröße: Der Regler sagt, wohin der Bestand über die Umsetzungszeit läuft, nicht den Zubau eines Jahres. Primärquelle: Sağlık Bakanlığı, Sağlık İstatistikleri Yıllığı 2024, Tabelle 'Yatak sayısı ve 10.000 kişiye düşen yatak'. Doppelt mit m_medizintechnik (B-6).

<a id="q22"></a>**Q22 `m_aerztegehalt` – Gehälter im Gesundheitswesen** (plausibel-prüfen)  
Quelle: [Tahancı Hukuk: Doktor Maaşları 2026 (Juli 2026)](https://www.tahanci.av.tr/doktor-maaslari/), Juli 2026  
Beleg: „Pratisyen ≈ 65.000 TL, uzman 75.000–85.000 TL, asistan ≈ 65.500 TL (garantili net, Suchauszug)“  
Hinweis: Quellen streuen stark (65.000 bis 125.000 Lira), weil Zulagen (döner sermaye, nöbet) mal ein-, mal ausgerechnet werden. Amtlich belegt sind nur die Beamtenkoeffizienten Juli–Dez. 2026: Monatsfaktor 1,575512, Grundfaktor 25,794915 (HMB-Rundschreiben). Pflege als Nebenangabe (~81.600 Lira netto, Lizenz 8/1).

<a id="q23"></a>**Q23 `m_lehrergehaelter` – Lehrergehälter** (plausibel-prüfen)  
Quelle: [Harbiye Hukuk: Öğretmen Maaşları 2026](https://www.harbiyehukuk.com/?p=12179), Juli 2026  
Beleg: „Yeni atanan kadrolu öğretmenin Temmuz-Aralık 2026 net maaşının vergi dilimine göre 63.998 TL ile 68.236 TL arasında (Suchauszug)“  
Hinweis: Primärquelle: HMB 'Mali ve Sosyal Haklar Genelgesi' Juli 2026 und MEB-Besoldungstabelle. Gehaltserhöhung Juli 2026: 13,52 % (Tarif 7 % + Inflationsausgleich).

<a id="q24"></a>**Q24 `m_schulbau` – Schulbau** (plausibel-prüfen)  
Quelle: [Dünya: MEB eğitimde 25 yıllık gelişimi açıkladı; dazu MEB: 2025-2026 Örgün Eğitim İstatistikleri](https://www.dunya.com/egitim/meb-egitimde-25-yillik-gelisimi-acikladi-haberi-836266), 2026  
Beleg: „2002-2003 eğitim öğretim yılında 367 bin 145 olan derslik sayısının 2025-2026 eğitim öğretim yılında 762 bin 434'e yükseldiği bildiriliyor (Suchauszug); 2024-2025: 753 bin 571“  
Hinweis: Differenz zweier MEB-Jahreswerte, also Nettozuwachs (Neubau minus Abriss), keine Bauzahl. MEB nennt zugleich 769.933 Klassenräume (mit Privatschulen) – Umfang klären. Nebenangabe 'Schüler je Klassenraum' läuft umgekehrt (mehr Bau = weniger Schüler je Raum).

<a id="q25"></a>**Q25 `m_berufsschulen` – Berufsschulen** (belegt)  
Quelle: [MEB: 2025-2026 Örgün Eğitim İstatistikleri Açıklandı](https://www.meb.gov.tr/20252026orgunegitimistatistikleriaciklandi/haber/42058/tr), 2026  
Beleg: „Mesleki ve teknik eğitimin örgün ortaöğretimdeki payı yüzde 37,56'dan yüzde 39,51'e yükseldi (Suchauszug der MEB-Meldung)“  
Hinweis: Anteil ist ein Ergebnis, kein Budget; ein Regler auf 150 % ergäbe 59 %. Plausible Obergrenze im Spiel ~60 %. Dreifach mit m_ausbildung/m_fachkraefteprogramm (B-6).

<a id="q26"></a>**Q26 `m_unigruendungen` – Neue Universitäten** (belegt)  
Quelle: [Dünya: YKS'de 805 bin 747 kontenjan adayları bekliyor (ÖSYM-Tercih Kılavuzu 2026)](https://www.dunya.com/egitim/yksde-805-bin-747-kontenjan-adaylari-bekliyor-haberi-833687), Juli 2026  
Beleg: „toplam 805 bin 747 kontenjan var; bunun 602 bin 117'si devlet, 184 bin 914'ü vakıf, 18 bin 716'sı KKTC üniversitelerine ait (Suchauszug)“  
Hinweis: Jede Provinz hat bereits eine Universität (YÖK: 129 staatliche, 75 Stiftungs-Universitäten, Jan. 2025); der Spieltext 'Universitäten in jeder Provinz' ist erreicht. Die Zahl der Universitäten skaliert nicht sinnvoll, die Studienplätze schon. Vorschlag: Maßnahme in 'Studienplätze' umbenennen.

<a id="q27"></a>**Q27 `m_stipendien` – Stipendien** (plausibel-prüfen)  
Quelle: [Gzt: KYK bursu ne kadar oldu 2026-2027](https://www.gzt.com/gundem/kyk-bursu-ne-kadar-oldu-2026-2027-kyk-burs-ve-kredi-fiyati-4251273), Sept. 2026  
Beleg: „Gençlik ve Spor Bakanlığı, 5 Ocak 2026 tarihinde burs ve öğrenim kredisi tutarlarının yüzde 33 artırıldığını duyurdu. Yeni tutarlar 6 Ocak 2026 itibarıyla uygulanmaya başladı (Suchauszug)“  
Hinweis: Mehrere Quellen übereinstimmend, Ministeriumsmeldung (gsb.gov.tr) nicht selbst gelesen. Zahl der Geförderten: Lücke (Suchhinweis KYK Faaliyet Raporu 2025, 'burs ve kredi alan öğrenci sayısı').

<a id="q28"></a>**Q28 `m_forschung` – Forschungsförderung** (belegt)  
Quelle: [Alomaliye: Araştırma-Geliştirme Faaliyetleri Araştırması 2025 (TÜİK-Meldung)](https://www.alomaliye.com/2026/10/30/ar-ge-harcamalari-980-milyar-lirayi-asti-2025/), 30.10.2026  
Beleg: „Ar-Ge harcamaları 2025 yılında 328 milyar 607 milyon TL artarak 980 milyar 428 milyon TL; GSYH'ye oranı %1,55 (Suchauszug)“  
Hinweis: Achtung: Gesamtausgaben (65 % Unternehmen). Der Staatsanteil im Zentralhaushalt beträgt 0,40 % des BIP (253,5 Mrd. Lira, 2025); 2026 ist im Haushalt 308,6 Mrd. Lira FuE-Mittel angesetzt. Wenn der Regler nur Staatsgeld meint, diese Größe nehmen.

<a id="q29"></a>**Q29 `m_bildungstechnik` – Bildungstechnik und digitales Lernen** (Lücke)  
Quelle: [DMO: FATİH-Katalog Tablet-Rahmenvertrag](https://www.dmo.gov.tr/Eng/Home/EngIcerik/3813), 28.02.2023  
Beleg: „– (kein Betrag 2025/26 im Suchauszug)“  
Hinweis: Suchhinweis: MEB 2026 Performans Programı, Programm 'Eğitimde Dijital Dönüşüm' bzw. YEĞİTEK-Ansatz; Investitionsprogramm 2026 (sbb.gov.tr), Sektor Bildung 160,5 Mrd. Lira gesamt.

<a id="q30"></a>**Q30 `m_medizintechnik` – Medizintechnik und Krankenhausmodernisierung** (plausibel-prüfen)  
Quelle: [RECHERCHE_HAUSHALT_MINISTERIEN_2026.md Abschnitt 2 (Investitionsprogramm 2026, SBB), Suchauszüge](https://www.sbb.gov.tr/wp-content/uploads/2025/12/1-2026-Yili-Merkezi-Yonetim-Butce-Kanunu.pdf), 05.11.2026  
Beleg: „Gesundheitsministerium 146,9 Mrd., von 173,5 im Sektor Gesundheit (Projektnotiz nach Such-Auszügen der SBB-Unterlagen)“  
Hinweis: Enthält auch Neubauten (Überschneidung mit m_krankenhausbau). Primärquelle: 2026 Yılı Yatırım Programı (sbb.gov.tr), Kapitel Sağlık.

<a id="q31"></a>**Q31 `m_autobahnen` – Autobahn- und Brückenbau** (plausibel-prüfen)  
Quelle: [KGM: Karayolu Ulaşım İstatistikleri 2025; Planwerte nach sanayigazetesi.com.tr](https://www.kgm.gov.tr/SiteCollectionDocuments/KGMdocuments/Yayinlar/YayinPdf/KarayoluUlasimIstatistikleri2025.pdf), 2026  
Beleg: „2025 yıl sonunda otoyol uzunluğu 3.796 km; otoyol uzunluğunun 2025'te 3 bin 796, 2026'da 3 bin 953 ve 2027'de 4 bin 262 kilometreye ulaşması öngörülmüştü (Suchauszug)“  
Hinweis: Jährlicher Zubau schwankt stark (2025: 0 km, 2027 geplant +309 km). Für die Anzeige den Mittelwert 2026–2027 (~230 km) erwägen. Alternative Geldgröße: Verkehrsministerium Investitionsvorschlag 562,7 Mrd. Lira (2026).

<a id="q32"></a>**Q32 `m_oepp_garantien` – Garantien für Betreiberprojekte** (plausibel-prüfen)  
Quelle: [Nefes: Köprü, otoyol ve şehir hastanesi bilançosu (nach KGM-Bericht und Sağlık Bakanlığı Performans Programı 2026)](https://www.nefes.com.tr/kopru-otoyol-ve-sehir-hastanesi-bilancosu-6-ayda-120-milyar-lira-gitti-143152), 2026  
Beleg: „ilk altı ayda geçiş garantisi kapsamında 49,6 milyar TL ödendi ve yıl sonunda 103,2 milyar TL'ye ulaşması bekleniyor; 2026 yılı için şehir hastanelerine ödenecek tutar 136 milyar 148 milyon TL (Suchauszug)“  
Hinweis: Summe aus zwei Posten, Flughäfen nicht enthalten. Achtung: Die Zahlungen sind vertraglich fest; ein Regler 'Garantien senken' wirkt nur auf neue Verträge. Für bestehende Verträge besser nichtlinear: Senkung nur über Rückkauf/Neuverhandlung.

<a id="q33"></a>**Q33 `m_bahn` – Bahnausbau** (plausibel-prüfen)  
Quelle: [Ensonhaber: Uraloğlu – Hızlı tren hat uzunluğu 3 yılda katlanacak; Betrag aus RECHERCHE_HAUSHALT_MINISTERIEN_2026.md (Investitionsprogramm 2026)](https://www.ensonhaber.com/gundem/abdulkadir-uraloglu-duyurdu-hizli-tren-hat-uzunlugu-3-yilda-katlanacak), 2025/2026  
Beleg: „YHT hat uzunluğunun 2 bin 251 kilometreye ulaştığını, yeni hatların yapım çalışmalarının ise sürdüğünü bildirdi; Eisenbahn 145,6 (Mrd. Lira, Projektansatz 2026)“  
Hinweis: Geldgröße skaliert sauber; Kilometer als Nebenangabe ('2.251 km in Betrieb'). Primärquelle Betrag: 2026 Yılı Yatırım Programı, Sektor Ulaştırma – Demiryolu.

<a id="q34"></a>**Q34 `m_nahverkehr` – Nahverkehr** (plausibel-prüfen)  
Quelle: [DHA: Bakan Uraloğlu – 452 kilometrelik kent içi raylı sistem hattını hizmete sunduk](https://www.dha.com.tr/gundem/bakan-uraloglu-452-kilometrelik-kent-ici-rayli-sistem-hattini-hizmete-sunduk-2958129), 2026  
Beleg: „Dokuz ilde 220,85 kilometrelik hattın yapımı sürüyor (Suchauszug); toplam 2026 yılında 1.054,7 kilometreye ulaştı“  
Hinweis: Nur Bauten des Ministeriums; Kommunen (Istanbul, Ankara, Izmir) bauen zusätzlich. Bestand 2024 laut Karar: Metro 387, Tram 369, Leichtbahn 296 km.

<a id="q35"></a>**Q35 `m_breitband` – Breitbandausbau** (plausibel-prüfen)  
Quelle: [CNBC-e: BTK açıkladı – Türkiye'de 2 milyon yeni abone fiber internetle tanıştı](https://www.cnbce.com/teknoloji/btk-acikladi-turkiyede-2-milyon-yeni-abone-fiber-internetle-tanisti-h32577), 2026  
Beleg: „2026 yılının ikinci çeyreğinde fiber internet abone sayımız geçen yılın aynı dönemine göre yüzde 22 artarak 10,7 milyona ulaştı (Suchauszug)“  
Hinweis: Bestandsgröße. Primärquelle: BTK Üç Aylık Pazar Verileri Raporu 2026/2. Alternativ Quote: Anschlüsse ÷ Haushalte (TÜİK ~26 Mio. Haushalte, prüfen).

<a id="q36"></a>**Q36 `m_regionalfoerderung` – Regionalförderung** (belegt)  
Quelle: [Alomaliye: 2026 yılında kalkınma ajanslarına kullandırılacak transfer ödenekleri (Karar Sayısı 11067, RG 17.03.2026)](https://www.alomaliye.com/2026/03/17/2026-yilinda-kalkinma-ajanslarina-kullandirilacak-transfer-odenekleri-karar-sayisi-11067/), 17.03.2026  
Beleg: „Kalkınma ajansları 2026 yılı transfer ödeneği 2.750.000.000 TL olarak öngörülmüş (Suchauszug)“  
Hinweis: Nur der kleinste, aber sauber belegte Topf. Die regionale Investitionsförderung (Teşvik-Regionen 1–6) läuft über m_investitionsanreize; Doppelzählung vermeiden. 2025: 1.155 Projekte, 2,8 Mrd. Lira.

<a id="q37"></a>**Q37 `m_smart_infrastruktur` – Intelligente Infrastruktur** (Lücke)  
Quelle: [Ulaştırma ve Altyapı Bakanlığı (Akıllı Ulaşım Sistemleri Strateji Belgesi 2020–2023 und Nachfolger)](https://www.uab.gov.tr/), –  
Beleg: „– (kein Betrag gefunden)“  
Hinweis: Suchhinweis: 'Ulusal Akıllı Ulaşım Sistemleri Strateji Belgesi ve Eylem Planı' (UAB), KGM 'AUS yatırımları' im Investitionsprogramm 2026. Ehrlicher wäre ein Zustandsregler (keine / Pilotstädte / Autobahnen voll / landesweit).

<a id="q38"></a>**Q38 `m_instandhaltung` – Instandhaltung der Infrastruktur** (Lücke)  
Quelle: [KGM-Veröffentlichungen (Faaliyet Raporu)](https://www.kgm.gov.tr/SiteCollectionDocuments/KGMdocuments/Yayinlar/YayinPdf/KarayoluUlasimIstatistikleri2025.pdf), –  
Beleg: „– (kein Betrag gefunden)“  
Hinweis: Suchhinweis: KGM 2025 Faaliyet Raporu, Posten 'bakım-onarım' bzw. 'yol bakım ve işletme'; TCDD 'yol yenileme'. Netz 68.517 km Staats- und Provinzstraßen (KGM 2025).

<a id="q39"></a>**Q39 `m_handelssysteme` – Moderne Zoll- und Handelssysteme** (Lücke)  
Quelle: [Weltbank Logistics Performance Index 2023 (Teilindex Zoll)](https://lpi.worldbank.org/international/global), 2023  
Beleg: „– (Wert im Suchauszug nicht enthalten)“  
Hinweis: Wenn Stunden: Anzeige x = Start × Startpegel ÷ Stufe (umgekehrt proportional). Ehrlicher: benannte Zustände (Papierzoll / elektronische Anmeldung / Einziges Fenster für alle Behörden / Vorabfreigabe mit Risikoprofil). Suchhinweis: Ticaret Bakanlığı 'Tek Pencere' und 'ortalama gümrük işlem süresi'.

<a id="q40"></a>**Q40 `m_verwaltungsdigital` – Digitale Verwaltung und Steuertechnik** (plausibel-prüfen)  
Quelle: [Sovos: Taslak Tebliğ – elektronik belgelerin kapsamı genişleyecek; dazu turkiye.gov.tr Resmî İstatistik 2025](https://sovos.com/tr/blog/kdv/taslak-teblig-yayimlandi-elektronik-belgelerin-kapsaminin-genisleyecegi-ongoruluyor/), Mai 2026  
Beleg: „2025 hesap döneminde brüt satış hasılatı 3 milyon TL ve üzerinde olan KDV mükellefleri 1 Temmuz 2026 tarihine kadar e-fatura sistemine geçmek zorundadır (Suchauszug); e-Devlet kullanıcı sayısı 68.193.133, hizmet sayısı 9.170 (2025)“  
Hinweis: Text der Maßnahme beschreibt selbst Stufen. Die Grenze 3 Mio. Lira stammt aus Fachblogs; amtlich: VUK Genel Tebliği Sıra No. 509 und Änderungen (GİB). Ein Entwurf 2026 senkt die Grenze auf 0,5 Mio. Lira.

<a id="q41"></a>**Q41 `m_digitale_oeffentlichkeit` – Digitale Öffentlichkeit und Beteiligung** (plausibel-prüfen)  
Quelle: [TRT Haber: e-Devlet'te kullanıcı sayısının 2026'da 70 milyona ulaşması hedefleniyor; dazu Gazete Vatan: Kamudaki datalar veri adresiyle vatandaşa açılacak](https://www.trthaber.com/haber/ekonomi/e-devlette-kullanici-sayisinin-2026da-70-milyona-ulasmasi-hedefleniyor-925089.html), 2026  
Beleg: „Eylül 2026 itibarıyla kayıtlı kullanıcı sayısının 69,8 milyona ulaştığı ... bildiriliyor; toplanan bütün kamudaki dataları veri.gov.tr adında halkımıza açacaklarını (Suchauszug)“  
Hinweis: Startzustand 'Portal und Beschwerdestelle' ist gut belegt; dass es kein nationales Open-Data-Portal gibt, beruht auf der Ankündigung (veri.gov.tr) – vor Übernahme prüfen, ob veri.gov.tr inzwischen online ist. CİMER-Antwortpflicht: Gesetz Nr. 3071 (Dilekçe Hakkı) Art. 7, 30 Tage.

<a id="q42"></a>**Q42 `m_solar_wind` – Ausbau von Sonne und Wind** (belegt)  
Quelle: [Ember: Türkiye Elektrik Görünümü 2026 – Rüzgar ve Güneş](https://ember-energy.org/tr/analizler/turkiye-elektrik-gorunumu-2026/ruzgar-ve-gunes), 2026  
Beleg: „2025 yılında Türkiye'de rüzgar ve güneş birlikte 6,5 GW'lık yeni kapasiteye ulaşarak rekor seviyede kurulum gerçekleştirilmiştir (Suchauszug)“  
Hinweis: TEİAŞ bestätigt Solar 4.694 MW Zubau 2025. Ziel 2035: 120 GW Wind+Solar ⇒ ~8 GW je Jahr nötig. Doppelt mit m_yeka_serie (B-6): YEKA ist nur der ausgeschriebene Teil.

<a id="q43"></a>**Q43 `m_yeka_serie` – YEKA-Ausschreibungsserie** (belegt)  
Quelle: [Mercom India: Türkiye Floats 21 Renewable Energy Tenders for 2.4 GW Capacity](https://www.mercomindia.com/turkiye-floats-21-renewable-energy-tenders-for-2-4-gw-capacity), Juli 2026  
Beleg: „The Ministry of Energy launched 21 solar and wind tenders totaling 2.4 GW of grid connection capacity (Suchauszug); YEKA tenders have reached 7.8 GW to date, including 3.8 GW in 2025 (Hürriyet Daily News)“  
Hinweis: Gebotsschluss 13.10.2026. Ministerium sagt 'mindestens 2 GW je Jahr'. Höchstpreise widersprüchlich (3,2/3,25/3,5 €-ct oder 5,5 €-ct/kWh) – nicht für die Anzeige nötig.

<a id="q44"></a>**Q44 `m_gasfoerderung` – Heimische Gasförderung** (belegt)  
Quelle: [Alomaliye: Osman Gazi Karadeniz'e açılıyor](https://www.alomaliye.com/2026/10/15/osman-gazi-karadenize-aciliyor/), 15.10.2026  
Beleg: „12 üretim kuyusundan doğal gaz üretimi gerçekleştiriliyor. Günlük üretimin yaklaşık 9,5 milyon metreküp seviyesine ulaştığı (Suchauszug)“  
Hinweis: Ein Regler darf die Förderung nicht über die Anlagenkapazität heben: Anzeige x = min(Start × Stufe/Startpegel, Kapazität der erreichten Phase). Doppelt mit m_sakarya_phase3 (B-6) – Vorschlag: Phase 3 als Zustand, Förderung als Ergebnis.

<a id="q45"></a>**Q45 `m_sakarya_phase3` – Sakarya Phase 3 (zweite FPU)** (belegt)  
Quelle: [Offshore Technology: Wison New Energies secures Sakarya FPU EPCIC contract with TPAO; dazu chemxplore: Keel laying for Sakarya Phase 3 FPU](https://www.offshore-technology.com/news/wison-sakarya-fpu-epcic-tpao/), Sept. 2025 / Okt. 2026  
Beleg: „In September 2025, Wison New Energies received an EPCIC contract for the FPU in Phase 3 of the project; designed for a gas export rate of 25 MM std cu m/d (Suchauszug)“  
Hinweis: Ein Projekt, kein Mengenregler (B-16). Kapazität der zweiten FPU 25 Mio. m³/Tag; Phase 3 zusammen ~40–45 Mio. m³/Tag. Termin widersprüchlich (Inbetriebnahme Ende 2027 oder Mitte 2028, kommerziell 2030). Für Spielbeginn 2028: Zustand 'Anlage wird installiert'.

<a id="q46"></a>**Q46 `m_akkuyu_ppa` – Akkuyu-Vertrag nachverhandeln** (belegt)  
Quelle: [Wikipedia: Akkuyu Nuclear Power Plant (nach Abkommen Türkei–Russland 12.05.2010, Gesetz Nr. 6007); dazu World Nuclear Association, Nuclear Power in Turkey](https://en.wikipedia.org/wiki/Akkuyu_Nuclear_Power_Plant), Stand 2026  
Beleg: „electricity will be purchased at a price of 12.35 US cents per kW·h and the remaining power will be sold in the open market by the producer; guaranteed the purchase of 70% power generated from the first two units and 30% from the third and fourth units over a 15-year power purchase agreement“  
Hinweis: Preis 12,35 US-Cent übereinstimmend; Anteil teils als '50 %' berichtet (Sözcü, Eurasia Review) – Vertragstext (Gesetz Nr. 6007, RG 21.07.2010) entscheidet. Als Mengenregler sinnlos (B-16). Nebenangabe für Zustände: Preis in US-Cent je kWh.

<a id="q47"></a>**Q47 `m_heimische_kohle` – Heimische Kohle (Afşin-Elbistan)** (plausibel-prüfen)  
Quelle: [Ember (14.04.2025) nach RECHERCHE_ENERGIE.md Abschnitt 4.3](https://ember-energy.org/latest-insights/), 14.04.2025  
Beleg: „Kraftwerk Afsin-Elbistan A 1.360 MW, Erweiterung +688 MW (2 Blöcke) geplant; kein Kohle-Neubau im Bau, aber Projekte offen (Projektnotiz nach Ember)“  
Hinweis: Der Text nennt genau ein Projekt (+688 MW) – das ist ein Vorhaben, keine Menge. Benannte Zustände; Leistung als Nebenangabe. Exakte Ember-URL nicht im Projekt hinterlegt (Suchhinweis: Ember 'Türkiye coal' April 2025, EÜAŞ Afşin-Elbistan).

<a id="q48"></a>**Q48 `m_energieeffizienz` – Effizienz, Wärmepumpen, E-Mobilität** (belegt)  
Quelle: [CNBC-e: Türkiye'de 2025'te yaklaşık 200 bin elektrikli araç satıldı (ODMD-Zahlen)](https://www.cnbce.com/otomotiv/turkiyede-2025te-yaklasik-200-bin-elektrikli-arac-satildi-h22676), Jan. 2026  
Beleg: „Ocak–Aralık 2025 döneminde Türkiye'de elektrikli otomobil satışları yüzde 82 artarak 191.960 adet olarak gerçekleşti. Böylece elektrikli otomobillerin toplam pazardaki payı yüzde 17,7'ye çıktı“  
Hinweis: Die Maßnahme bündelt drei Dinge (Effizienz, Wärmepumpen, E-Autos); nur die E-Auto-Zahl ist belegt. Wärmepumpen: Lücke. Der Text rechnet mit '1 Mio. E-Autos' als Bestand – Bestand Ende 2025 rund 0,4 Mio. (Lücke, TÜİK Motorlu Kara Taşıtları).

<a id="q49"></a>**Q49 `m_preiswahrheit` – Preiswahrheit bei Energie** (belegt)  
Quelle: [Evrensel: Doğal gazda zam, kademeli sistem (BOTAŞ-Tarif ab 04.04.2026)](https://www.evrensel.net/haber/5978166/dogal-gazda-zam-kademeli-sistem-milyonlarca-abone-etkilenecek), 04.04.2026  
Beleg: „BOTAŞ'ın 4 Nisan 2026'dan itibaren geçerli toptan satış tarifesinde konutlar için Kademe-1 fiyatı 10,625 TL/Sm³, Kademe-2 fiyatı ise 18 TL/Sm³ (Suchauszug)“  
Hinweis: Doppelregler zu m_energiesubventionen (B-6): Empfehlung zusammenlegen. 2,5–3 Mio. Haushalte (~12 %) zahlen Stufe 2. Subventionsbetrag 950 Mrd. Lira laut Minister (Forbes, 04.04.2026; RECHERCHE_ENERGIE 2.4).

<a id="q50"></a>**Q50 `m_gashub` – Gas-Hub und Transit-Ausbau** (plausibel-prüfen)  
Quelle: [RECHERCHE_ENERGIE.md Abschnitt 2.2 (Energy News Beat 01.06.2026; eualive.net 2026)](https://www.botas.gov.tr/), 2026  
Beleg: „TurkStream-Transit: 2 × 15,75 Mrd. m³/J; Aserbaidschan (TANAP, Gesamtkap. 16 Mrd. m³/J) (Projektnotiz)“  
Hinweis: Nennkapazitäten sind technische Daten (Gazprom/TANAP) und gut bekannt, hier aber nur aus der Projektnotiz übernommen. Ausbau geschieht in ganzen Strängen: Anzeige auf ganze Stränge runden.

<a id="q51"></a>**Q51 `m_lng_vertraege` – LNG-Langzeitverträge** (plausibel-prüfen)  
Quelle: [RECHERCHE_ENERGIE.md Abschnitt 2.2 (Turkish Minute 24.09.2025 und 04.12.2025; AIIB-Projektunterlage)](https://www.turkishminute.com/), 2025  
Beleg: „Algerien (LNG, Sonatrach) 4,4 Mrd. m³/J; Nigeria (LNG) ~1,3 Mrd. m³/J; USA/Mercuria ~4 Mrd. m³/J, 20 Jahre, ab 2026 (Projektnotiz)“  
Hinweis: Summe selbst gebildet; kurzfristige Verträge (BP 4,8, Shell 2,4, ENI 1,5 Mrd. m³ für 2026–28) nicht eingerechnet. Text der Maßnahme meint 'zusätzliche' 2–4 Mrd. m³ – dann wäre der Startpegel 0 und der Regler zeigte nur den Zuschlag.

<a id="q52"></a>**Q52 `m_regas_ausbau` – FSRU- und Regasifizierungs-Ausbau** (plausibel-prüfen)  
Quelle: [RECHERCHE_ENERGIE.md Abschnitt 2.3 (Bayraktar via Turkish Minute, 04.12.2025; BOTAŞ GM Fidan 06.12.2025)](https://www.turkishminute.com/), Dez. 2025  
Beleg: „Regas-Kapazität ~161 Mio. m³/Tag — Verfünffachung seit ~2017/18 (Projektnotiz)“  
Hinweis: Engpass ist laut Notiz nicht Regas, sondern Verträge und Preis – ein Ausbau über 100 % hat kaum Wirkung. FSRU Ertuğrul Gazi 2025 an Ägypten verliehen.

<a id="q53"></a>**Q53 `m_gasspeicher` – Gasspeicher-Ausbau** (plausibel-prüfen)  
Quelle: [RECHERCHE_ENERGIE.md Abschnitt 2.6 (Bayraktar via X, 11/2025; Hürriyet Daily News 10.09.2025)](https://www.hurriyetdailynews.com/), Nov. 2025  
Beleg: „Summe 6,3 Mrd. m³ (11/2025, winterbereit voll); 14,4 Mrd. m³ bis 2028 (Projektnotiz)“  
Hinweis: Bestandsgröße; Kosten-Maßstab aus dem Spieltext: Tuz Gölü 2,7 Mrd. Dollar für 4,2 Mrd. m³. Primärquelle: BOTAŞ Faaliyet Raporu 2025.

<a id="q54"></a>**Q54 `m_netzausbau` – Stromnetzausbau** (plausibel-prüfen)  
Quelle: [RECHERCHE_ENERGIE.md Abschnitt 1.5 (TEİAŞ-Strategieplan nach Grokipedia, 13.03.2026, Vorbehalt)](https://www.teias.gov.tr/), 2026  
Beleg: „TEİAŞ-Investitionsprogramm 2024–2028: 362 Mrd. TL (~10,6 Mrd. USD), davon 74 % für Erneuerung/Verstärkung/Neubau (Projektnotiz)“  
Hinweis: Quelle ist eine Sekundärzusammenfassung. Primärquelle: TEİAŞ Stratejik Plan 2024–2028 und Yatırım Programı 2026 (Sektor Enerji, TEİAŞ). Doppelt mit m_speicher_smartgrid (B-6).

<a id="q55"></a>**Q55 `m_speicher_smartgrid` – Netzmodernisierung und Speicher** (belegt)  
Quelle: [Ember: Türkiye Elektrik Görünümü 2026 – Depolama](https://ember-energy.org/tr/analizler/turkiye-elektrik-gorunumu-2026/depolama), 2026  
Beleg: „Şubat 2026 itibariyle Türkiye'de depolamalı rüzgar ve güneş santrali projelerinden 208 MW'ı devreye alınmıştır“  
Hinweis: Startwert klein, Zubau 2026 sprunghaft – Spielbeginn 2028 dürfte bei ~2 GW liegen. Für den Start mit Spielbeginn neu messen. Ziel 2035: 7,5–8 GW.

<a id="q56"></a>**Q56 `m_agrarsubventionen` – Agrarsubventionen** (belegt)  
Quelle: [Tarım ve Orman Bakanlığı: 2026 Yılı Bütçesi TBMM Plan ve Bütçe Komisyonunda Kabul Edildi; dazu Alomaliye 12.08.2026](https://www.tarimorman.gov.tr/SGB/Haber/196/2026-Yili-Butcesi-Tbmm-Plan-Ve-Butce-Komisyonunda-Kabul-Edildi), Nov. 2025 / Aug. 2026  
Beleg: „Tarımsal Destekler 2026 (Milyar ₺) 167,6; 2026'nın ilk yarısında 106 milyar 22 milyon TL tarımsal destek ödemesi yapıldı (Suchauszug)“  
Hinweis: Für 2027 sind 235 Mrd. Lira angekündigt (Ekonomi Gazetesi). Nebenangabe je Fläche (Lira je Dekar) wäre möglich, aber die Sätze unterscheiden sich je Produkt.

<a id="q57"></a>**Q57 `m_bewaesserung` – Moderne Bewässerung** (plausibel-prüfen)  
Quelle: [DSİ Haber Bülteni Aralık 2024](https://cdniys.tarimorman.gov.tr/api/File/GetGaleriFile/425/DosyaGaleri/8848/haber_bulteni_aralik_2024.docx), Dez. 2024  
Beleg: „2018 yılında Borulu Sistem kullanımı % 26,6 iken 2023 yılında % 33,7 olmuştur; 2018 yılında Damla Sulama Yöntemiyle Sulanan Alan % 17,4 iken 2023 yılında % 17,5 olmuştur“  
Hinweis: Bezug ist vermutlich nur die DSİ-Bewässerungsfläche, nicht alle Felder. Primärquelle: DSİ 'Sulama Oranı ve Sulama Randımanı' bzw. DSİ Faaliyet Raporu 2025. Doppelt mit m_agrarforschung (Tropfbewässerung).

<a id="q58"></a>**Q58 `m_staudaemme` – Staudämme und Speicher** (plausibel-prüfen)  
Quelle: [Bengütürk: Bakan Yumaklı – 2025'te 52 yeni baraj ve gölet inşa ederek 512 milyon metreküp suyu depolayacağız](https://www.benguturk.com/ekonomi/bakan-yumakli-2025te-52-yeni-baraj-ve-golet-insa-ederek-512-milyon-metrekup-175128h), Jan. 2025  
Beleg: „2025'te 52 yeni baraj ve gölet inşa ederek, 512 milyon metreküp suyu depolayacağız“  
Hinweis: Planwert, kein Ist. Ist 2025 laut DSİ-Faaliyet-Raporu-Auszug evtl. 22 Talsperren + 7 Teiche (unklar). Primärquelle: DSİ 2025 Faaliyet Raporu (cdniys.tarimorman.gov.tr/.../dsi2025faaliyetraporu.pdf).

<a id="q59"></a>**Q59 `m_wasserleitungen` – Wasserleitungen und Kläranlagen** (belegt)  
Quelle: [Alomaliye: Su ve Atıksu İstatistikleri – 2024 (TÜİK-Meldung)](https://www.alomaliye.com/2025/12/09/su-ve-atiksu-istatistikleri-2024/), 09.12.2025  
Beleg: „Atıksu arıtma tesisi hizmeti verilen nüfus oranı ise yüzde 76,9 olarak belirlendi“  
Hinweis: Nebenangabe Leitungsverluste (umgekehrt: mehr Ausbau = weniger Verlust); 47,9 % nur aus einem Kommentar, an TÜİK 'Belediye Su İstatistikleri' prüfen.

<a id="q60"></a>**Q60 `m_saatgut` – Saatgut- und Erzeugerprogramme** (Lücke)  
Quelle: [Tarım ve Orman Bakanlığı, BÜGEM Tohumculuk İstatistikleri](https://www.tarimorman.gov.tr/BUGEM), –  
Beleg: „– (kein Wert gefunden)“  
Hinweis: Suchhinweis: BÜGEM 'sertifikalı tohum üretimi ve kullanımı' Jahrestabelle; TÜRKTOB Jahresbericht 2025. Doppelt mit m_agrarforschung.

<a id="q61"></a>**Q61 `m_mechanisierung` – Landwirtschaftliche Mechanisierung** (plausibel-prüfen)  
Quelle: [Türkiye Gazetesi: 78 ilde arttı, 3 ilde azaldı – traktör sayısı (TÜİK Motorlu Kara Taşıtları)](https://www.turkiyegazetesi.com.tr/ekonomi/78-ilde-artti-3-ilde-azaldi-tarimin-lokomotif-sehirlerine-sel-darbesi-traktor-sayisi-1785088), 2026  
Beleg: „2 milyon 315 bin 504 olan toplam traktör sayısı, bu yılın ilk üç ayında 5 bin 749 adet artarak mart sonu itibarıyla 2 milyon 321 bin 253'e ulaştı (Suchauszug)“  
Hinweis: Bestandsgröße, wächst langsam (+0,25 % je Quartal); ein Regler auf 150 % ist weit jenseits jeder realen Entwicklung. Besser: Zuschuss für Maschinenkauf (Lücke) oder Zustände 'Handarbeit / Traktor / Präzisionstechnik'. Primärquelle: TÜİK Motorlu Kara Taşıtları, Dez. 2025.

<a id="q62"></a>**Q62 `m_agrarforschung` – Agrarforschung und Hochtechnologie** (Lücke)  
Quelle: [Para Dergi: Tarımsal Ar-Ge'nin kalbi TAGEM'de atıyor](https://www.paradergi.com.tr/sektorler/2025/08/25/tarimsal-ar-genin-kalbi-tagemde-atiyor), 25.08.2025  
Beleg: „TAGEM, 49 araştırma enstitüsü ile faaliyet gösteriyor (Suchauszug)“  
Hinweis: Suchhinweis: 2026 Merkezi Yönetim Bütçe Kanunu, Cetvel A, Tarım ve Orman Bakanlığı – Programm 'Tarımsal Araştırma'; TAGEM 2026 Performans Programı.

<a id="q63"></a>**Q63 `m_bauindustrie` – Industrieller Wohnungsbau** (Lücke)  
Quelle: [Ekonomi Gazetesi: Prefabrik Yapı A.Ş. 36'ncı yılını kutluyor (Branchenstimme)](https://www.ekonomigazetesi.com/sirket-haberleri/prefabrik-yapi-as-36nci-yilini-kutluyor-53618), –  
Beleg: „Türkiye'de yaklaşık 1 milyon yeni konutun deprem bölgelerinde halkın kullanımına sunulduğunu ancak halen değişimi ya da güçlendirilmesi gereken 6,5 milyon konut bulunduğunu söyledi (Suchauszug, Firmenangabe)“  
Hinweis: Keine amtliche Statistik zu Fertigteilwohnungen gefunden. Suchhinweis: TÜİK Yapı İzin İstatistikleri nach 'taşıyıcı sistem' (prefabrik/çelik), Türkiye Prefabrik Birliği Jahresbericht.

<a id="q64"></a>**Q64 `m_sozialwohnungen` – Staatlicher Wohnungsbau** (plausibel-prüfen)  
Quelle: [Yeni Asır: TOKİ 83 bin 503 sosyal konutun inşasını tamamladı](https://yeniasir.com.tr/ekonomi/2026/10/10/toki-83-bin-503-sosyal-konutun-insasini-tamamladi), 10.10.2026  
Beleg: „TOKİ 83 bin 503 sosyal konutun inşasını tamamladı (Überschrift)“  
Hinweis: Kein sauberer Jahreswert: 83.503 sind kumuliert seit Programmstart (2025). Ausschreibungen 2024: 205.729 Wohnungen (TOKİ-Präsident). Primärquelle: TOKİ Faaliyet Raporu 2025.

<a id="q65"></a>**Q65 `m_stadterneuerung` – Erdbebensichere Stadterneuerung** (plausibel-prüfen)  
Quelle: [Alomaliye: İstanbul'da dönüşüm 1 milyonu aştı](https://www.alomaliye.com/2026/08/17/istanbulda-donusum-1-milyonu-asti/), 17.08.2026  
Beleg: „2012'den bu yana 81 ilde 2 milyon 761 bin bağımsız bölüm dönüşüm kapsamına alındı (Suchauszug)“  
Hinweis: 'Im Programm' heißt nicht 'fertig'. Ziel 300.000/Jahr (davon 30.000 durch das Ministerium) laut Minister Kurum. Primärquelle: ÇŞİDB Kentsel Dönüşüm istatistikleri.

<a id="q66"></a>**Q66 `m_gebaeudeverstaerkung` – Gebäude-Verstärkungsprogramm** (plausibel-prüfen)  
Quelle: [Alomaliye: İstanbul'da Yarısı Bizden desteği 2027'ye uzatıldı](https://www.alomaliye.com/2026/10/20/istanbulda-yarisi-bizden-destegi-2027ye-uzatildi/), 20.10.2026  
Beleg: „875 bin TL hibe, 875 bin TL kredi ve 125 bin TL taşınma desteği (Suchauszug, mehrere Quellen übereinstimmend)“  
Hinweis: Achtung: Das Programm fördert Abriss und Neubau, nicht Ertüchtigung im Bestand. Eine echte Verstärkungsförderung gibt es nicht (Lücke). Vorher 700.000 + 700.000 + 100.000 Lira.

<a id="q67"></a>**Q67 `m_versicherungspflicht` – Katastrophen-Pflichtversicherung** (plausibel-prüfen)  
Quelle: [Capital: DASK'lı konut sayısı arttı ancak 8,4 milyon konut hâlâ sigortasız](https://www.capital.com.tr/finans/sigorta/daskli-konut-sayisi-artti-ancak-84-milyon-konut-hala-sigortasiz), 2026  
Beleg: „20 milyon 32 bin konutun 11 milyon 628 bin 88'inde poliçe bulunduğu ve oranın yüzde 58'e yükseldiği (Suchauszug)“  
Hinweis: Milliyet nennt 11.700.223 Policen. Primärquelle: DASK Bölgesel Sigortalılık Oranları (dask.gov.tr). Ein Umbau zur Pflicht-Katastrophenversicherung (auch Flut) ist in Vorbereitung.

<a id="q68"></a>**Q68 `m_baukredite` – Günstige Baukredite** (plausibel-prüfen)  
Quelle: [Hesapkurdu: Konut kredisi faiz oranları (Stand 30.10.2026); dazu Milliyet Uzmanpara 30.04.2026 zu 'İlk Evim'](https://www.hesapkurdu.com/konut-kredisi), Okt. 2026  
Beleg: „konut kredisi faiz/kâr payı ortalaması %3,52 (30.10.2026, Suchauszug); aylık yaklaşık yüzde 1,20 seviyesinde planlanan sabit faiz ve 180 ay vade“  
Hinweis: Ein Zinsvorteil wirkt nicht verhältnisgleich (50 % mehr Subvention ≠ 50 % mehr Wohnungen). Zustände; Nebenangabe Zins je Monat. Prüfen, ob 'İlk Evim' bis zum Spielstart gestartet ist.

<a id="q69"></a>**Q69 `m_fruehwarnsystem` – Frühwarnsystem** (plausibel-prüfen)  
Quelle: [ShiftDelete: AFAD ve ASELSAN – Ulusal Erken Uyarı Sistemi (Sirenen und Architektur)](https://shiftdelete.net/?p=240964), 2025/2026  
Beleg: „Ülke genelinde kurulması planlanan bir Ulusal Erken Uyarı Sistemi mimarisi de ortaklaşa geliştirilecek; hücre yayını, toplu SMS, radyo, televizyon ve sosyal medya kanalları incelenecek (Suchauszug)“  
Hinweis: Ein Vorhaben, kein Mengenregler (B-16). Startzustand aus mehreren Auszügen zusammengesetzt; ob Cell Broadcast 2026 landesweit läuft, ist unbelegt – an afad.gov.tr prüfen.

<a id="q70"></a>**Q70 `m_afad_ausbau` – Ausbau der Katastrophenbehörde (AFAD)** (plausibel-prüfen)  
Quelle: [Yeni Şafak: AFAD gönüllü ordusu 1,6 milyonu aştı](https://www.yenisafak.com/gundem/afad-gonullu-ordusu-16-milyonu-asti-4749031), 2025  
Beleg: „AFAD'ın kendi personel sayısı 8 bin 541'e, doğrudan arama-kurtarma kadrosu ise 3 bin 529'a yükseldi (Suchauszug)“  
Hinweis: Haushalt 2026 laut Presse 373 Mrd. Lira – enthält Wiederaufbau im Erdbebengebiet, daher als Reglergröße ungeeignet. Primärquelle Personal: Sayıştay Denetim Raporu AFAD 2024, Tabelle Personal.

<a id="q71"></a>**Q71 `m_polizei` – Polizei und Gendarmerie** (plausibel-prüfen)  
Quelle: [TRT Haber: Emniyet Genel Müdürlüğü başkanlık oluyor](https://www.trthaber.com/haber/gundem/emniyet-genel-mudurlugu-baskanlik-oluyor-929068.html), 2026  
Beleg: „Emniyet Genel Müdürlüğü'nün 350 bin personeli bünyesinde barındırdığını (Suchauszug)“  
Hinweis: Gerundete Zahl inkl. Verwaltung. 10.102 neue Planstellen im März 2026. Alternative Geldgröße (sauberer belegbar): Personalausgaben Polizei + Gendarmerie 699,3 Mrd. Lira (RECHERCHE_HAUSHALT_MINISTERIEN_2026.md). Gendarmerie-Personal: Suchhinweis JGK Faaliyet Raporu.

<a id="q72"></a>**Q72 `m_polizeitechnik` – Moderne Sicherheitsverwaltung** (Lücke)  
Quelle: [EGM 2025 Performans Programı](https://www.egm.gov.tr/kurumlar/egm.gov.tr/IcSite/strateji/MaliDurum/2025_Performans_Programi.pdf), 2025  
Beleg: „– (Betrag im Suchauszug nicht enthalten)“  
Hinweis: Suchhinweis: EGM Performans Programı 2026, Programm 'Kamu Düzeni ve Güvenliği', Ausgaben für Bilgi Teknolojileri und Kriminal Polis Laboratuvarları. Doppelt mit m_polizei (B-6).

<a id="q73"></a>**Q73 `m_verteidigung` – Verteidigungsausgaben** (plausibel-prüfen)  
Quelle: [Daily Sabah: NATO defense spending – how allies stand ahead of key Ankara summit](https://www.dailysabah.com/business/defense/nato-defense-spending-how-allies-stand-ahead-of-key-ankara-summit/amp), 2026  
Beleg: „Türkiye 2.33% (Tabelle nach NATO-Schätzung 2025, Suchauszug)“  
Hinweis: NATO zählt Gendarmerie und Küstenwache mit, SIPRI anders – im Spiel eine Definition festlegen. Primärquelle: NATO 'Defence Expenditure of NATO Countries (2014–2025)'. NATO-Ziel 5 % bis 2035, von der Türkei unterstützt.

<a id="q74"></a>**Q74 `m_ruestungsindustrie` – Heimische Rüstungsindustrie** (belegt)  
Quelle: [Borsa Gündem: Savunma ve havacılık ihracatı 10 milyar dolar eşiğini aştı (SSB-Präsident Görgün)](https://www.borsagundem.com.tr/savunma-ve-havacilik-ihracati-10-milyar-dolar-esigini-asti), Jan. 2026  
Beleg: „9 milyar 870 milyon dolar mal ve 184 milyon dolar hizmet olmak üzere 10 milyar 54 milyon dolara ulaştığını (Suchauszug)“  
Hinweis: Export ist ein Ergebnis, kein Förderbetrag; als Anzeige aber verständlich. Fördergröße (Rüstungsfonds SSDF) ist außerhalb des Haushalts und nicht belegt (RECHERCHE_HAUSHALT_MINISTERIEN, Lücke).

<a id="q75"></a>**Q75 `m_uebungen` – Ausbildung und Übungen** (Lücke)  
Quelle: [NATO-Richtwert (nicht türkische Angabe)](https://www.nato.int/), –  
Beleg: „– (kein türkischer Wert öffentlich)“  
Hinweis: Türkische Flugstunden sind nicht veröffentlicht. Ehrlicher: benannte Zustände (Mindestbetrieb / wie heute: jährliche Großmanöver wie EFES und Denizkurdu / NATO-Standard / Kriegsbereitschaft). Suchhinweis: MSB Faaliyet Raporu, Tatbikat-Kalender.

<a id="q76"></a>**Q76 `m_religionsbehoerde` – Budget der Religionsbehörde** (belegt)  
Quelle: [Diken: 2026 bütçesi – Diyanet'e 174 milyar lira, MİT'e 39 milyar lira ayrıldı](https://www.diken.com.tr/?p=1662584), Okt. 2025  
Beleg: „Cumhurbaşkanı Yardımcısı Cevdet Yılmaz 2026'da Diyanet'e 174 milyar 389 milyon lira ... bütçe ayrıldığını duyurdu“  
Hinweis: Wert des Entwurfs; im Ausschuss wurde laut Projektnotiz nur das Finanzministerium geändert. Birgün nennt 373,5 Mrd. Lira mit Nebenhaushalten (Stiftung) – nicht dieselbe Größe.

<a id="q77"></a>**Q77 `m_richterstellen` – Richter- und Staatsanwaltsstellen** (plausibel-prüfen)  
Quelle: [Haberhürriyeti: Bir hâkim ortalama 800 davaya bakıyor (dazu Suchauszug mit Stand 23.09.2026)](https://www.haberhurriyeti.com/haber/27185619/bir-hakim-ortalama-800-davaya-bakiyor-karar-bekleyen-12-milyon-dosya-var), 2026  
Beleg: „hakim ve savcı sayısı ise 26 bin 803; 23 Eylül 2026 itibarıyla hakim sayısı 18 bin 167, cumhuriyet savcısı sayısı ise 8 bin 475 (Suchauszug)“  
Hinweis: Widerspruch zum Spieltext ('heute 17, Europa 22'): Mit 18.167 Richtern ergibt sich ≈ 21 Richter je 100.000. Der Wert 17 stammt vermutlich aus CEPEJ 2022. Vor Übernahme Text und Startwert angleichen. Primärquelle: HSK/Adalet Bakanlığı 'Adli İstatistikler 2025'.

<a id="q78"></a>**Q78 `m_haftvermeidung` – Haftvermeidung und Bewährung** (belegt)  
Quelle: [İstiklal: Adalet Bakanlığı verileri – Cezaevlerinde 433 bin 520 kişi bulunuyor (CTE 03.08.2026)](https://www.istiklal.com.tr/genel/adalet-bakanligi-verileri-cezaevlerinde-433-bin-520-kisi-bulunuyor-1101767h), Aug. 2026  
Beleg: „402 ceza infaz kurumunda toplam 433 bin 520 kişi bulunuyor. Tutuklu sayısı ise 65 bin 227 olarak kaydedildi“  
Hinweis: Anzeige umgekehrt proportional: x = Start × Startpegel ÷ Stufe (Regler 150 % ⇒ 10,0 %). Auffällig: Juli- und Augustzahlen identisch (Yeniçağ) – an cte.adalet.gov.tr prüfen. Dazu 494.000 Personen in Bewährungsaufsicht.

<a id="q79"></a>**Q79 `m_denkmalschutz` – Denkmalschutz und Restaurierung** (plausibel-prüfen)  
Quelle: [Ensonhaber: Mehmet Nuri Ersoy – Son 2 yılda 201 vakıf eserinin restorasyonu tamamlandı](https://www.ensonhaber.com/gundem/mehmet-nuri-ersoy-son-2-yilda-201-vakif-eserinin-restorasyonu-tamamlandi), 2025  
Beleg: „Son 2 yılda 201 vakıf eserinin restorasyonu tamamlandı (Überschrift)“  
Hinweis: Nur Vakıflar Genel Müdürlüğü; Restaurierungen des Kulturministeriums und der Kommunen fehlen. Geldgröße Lücke (Suchhinweis: VGM 2026 Performans Programı, 'restorasyon ödeneği').

<a id="q80"></a>**Q80 `m_kulturfoerderung` – Kunst- und Kulturförderung** (plausibel-prüfen)  
Quelle: [DHA: Bakan Ersoy – 2025'te sinema alanında 316,6 milyon TL destek sağladık; dazu Türkgün zu 97,216 Mio. Theaterförderung](https://www.dha.com.tr/kultur-sanat/bakan-ersoy-2025te-sinema-alaninda-316-6-milyon-tl-destek-sagladik-2787672), Jan. 2026  
Beleg: „Sinema Genel Müdürlüğü 150 projeyi toplam 316 milyon 674 bin TL ile destekledi; özel tiyatrolara 97 milyon 216 bin lira (Suchauszug)“  
Hinweis: Andere Meldungen nennen 359,4 Mio. Lira Filmförderung 2025 (anderer Umfang). Staatstheater, Opern, Festivals nicht enthalten – Gesamtgröße wäre der Etat des Kulturministeriums (~70 Mrd. Lira mit Tourismus, nicht trennbar).

<a id="q81"></a>**Q81 `m_archaeologie` – Ausgrabungen und Museen** (plausibel-prüfen)  
Quelle: [NTV: Bakan Ersoy TBMM'de 2026 bütçesini anlattı](https://www.ntv.com.tr/ntvpara/bakan-ersoy-tbmmde-2026-butcesini-anlatti-1696503), Nov. 2025  
Beleg: „2025 yılı sonuna kadar gerçekleştirilen tüm kazı ve araştırma çalışmalarının sayısı yılda 780'e ulaşacak (Suchauszug)“  
Hinweis: Prognose für Jahresende 2025, keine Endzahl. Grabungen hängen an Genehmigungen und Fachkräften; ein Regler auf 150 % (1.170) ist nur mit Personal plausibel.

