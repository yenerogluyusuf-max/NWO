# Rundgang 2026-11-05

Stand nach Arbeitspaket 3 (17 Ministerien in der Simulation). Gegenüber AP 6 unverändert 28 Verstöße: AP 3 baut keine Ansicht um.
Länger geworden ist „Ministerrat & Kabinett“ (13,4 → 20,5 Bildschirme), weil dort jetzt 19 statt 7 Ministerkarten stehen; das löst
AP 10 mit dem Kabinettstisch. Das Werkzeug schließt jetzt auch die Zielwahl des ersten Amtstags („Ohne Ziele beginnen“); vorher lag
sie über allen Bildern (die Messwerte waren davon nicht betroffen). Bilder: `node scripts/rundgang.mjs` erzeugt sie neu.

50 Ansichten, 28 mit Schwellenverletzung (Höhe ≤ 1.5 Bildschirme, ≥ 60 Wörter oder ein Knopf, Schrift ≥ 11.5 px, Kontrast ≥ 4.5:1, Indizes ganzzahlig).

| Nr | Ansicht | Bildschirme | Wörter | Knöpfe | Verstöße |
|---|---|---|---|---|---|
| 1 | Schreibtisch › Schreibtisch | 2.65 | 418 | 26 | zu lang: 2.7 Bildschirme |
| 2 | Schreibtisch › Chronik | 1 | 36 | 0 | fast leer: 36 Wörter, kein Knopf |
| 3 | Schreibtisch › Berichte | 1 | 39 | 0 | fast leer: 39 Wörter, kein Knopf |
| 4 | Politik › Bereiche | 3.31 | 416 | 35 | zu lang: 3.3 Bildschirme |
| 5 | Politik › Vorschläge | 4.03 | 533 | 37 | zu lang: 4.0 Bildschirme |
| 6 | Politik › Wirkungsnetz | 3.09 | 775 | 93 | zu lang: 3.1 Bildschirme |
| 7 | Parlament & Gesetze › Gesetzesvorhaben | 2.44 | 639 | 27 | zu lang: 2.4 Bildschirme |
| 8 | Parlament & Gesetze › Fraktionen und Abstimmung | 3.01 | 351 | 8 | zu lang: 3.0 Bildschirme |
| 9 | Parlament & Gesetze › Umsetzung | 1.14 | 95 | 0 | – |
| 10 | Parlament & Gesetze › Verfassung | 5.36 | 744 | 18 | zu lang: 5.4 Bildschirme |
| 11 | Parlament & Gesetze › Justiz | 2.14 | 308 | 2 | zu lang: 2.1 Bildschirme |
| 12 | Parlament & Gesetze › Behörden | 1 | 34 | 1 | – |
| 13 | Parlament & Gesetze › Mehrheitslage | 1 | 43 | 1 | – |
| 14 | Kabinett & Verwaltung › Ministerrat & Kabinett | 20.46 | 2681 | 174 | zu lang: 20.5 Bildschirme; Kontrast unter 4.5:1: 1 |
| 15 | Kabinett & Verwaltung › Gespräch | 1 | 95 | 8 | – |
| 16 | Kabinett & Verwaltung › Verwaltung | 1.4 | 174 | 2 | – |
| 17 | Kabinett & Verwaltung › Behörden | 1 | 42 | 2 | – |
| 18 | Kabinett & Verwaltung › Handlungsfähigkeit | 1.04 | 98 | 1 | – |
| 19 | Wirtschaft › Krisenrat | 1.68 | 239 | 9 | zu lang: 1.7 Bildschirme |
| 20 | Wirtschaft › Haushalt | 2.82 | 484 | 98 | zu lang: 2.8 Bildschirme |
| 21 | Wirtschaft › Versorgung & Handel | 1.58 | 193 | 27 | zu lang: 1.6 Bildschirme |
| 22 | Wirtschaft › Zentralbank und Devisen | 5.2 | 908 | 19 | zu lang: 5.2 Bildschirme |
| 23 | Wirtschaft › Wirtschaftslage | 2.81 | 384 | 27 | zu lang: 2.8 Bildschirme |
| 24 | Wirtschaft › Bilanz & Entwicklung | 1 | 67 | 0 | – |
| 25 | Gesellschaft › Wählerkoalition | 4.48 | 626 | 43 | zu lang: 4.5 Bildschirme |
| 26 | Gesellschaft › Wahlkampf | 1 | 76 | 0 | – |
| 27 | Gesellschaft › Behörden | 1 | 32 | 1 | – |
| 28 | Gesellschaft › Stimmung im Land | 1 | 41 | 1 | – |
| 29 | Land › Infrastruktur und Bau | 3.02 | 611 | 24 | zu lang: 3.0 Bildschirme |
| 30 | Land › Netze | 1.26 | 123 | 12 | – |
| 31 | Land › Kultur und Erbe | 1.9 | 293 | 6 | zu lang: 1.9 Bildschirme |
| 32 | Land › Katastrophen und Wiederaufbau | 3.24 | 725 | 17 | zu lang: 3.2 Bildschirme |
| 33 | Land › Behörden | 1 | 33 | 1 | – |
| 34 | Land › Lage der Regionen | 1.72 | 241 | 6 | zu lang: 1.7 Bildschirme |
| 35 | Land › Bau & Umsetzung | 1 | 13 | 0 | fast leer: 13 Wörter, kein Knopf |
| 36 | Forschung & Ziele › Fokusbaum | 1.06 | 392 | 113 | – |
| 37 | Forschung & Ziele › Große Ziele | 3.01 | 530 | 10 | zu lang: 3.0 Bildschirme |
| 38 | Forschung & Ziele › Wissensbaum | 1 | 73 | 6 | – |
| 39 | Forschung & Ziele › Programme | 3.5 | 604 | 16 | zu lang: 3.5 Bildschirme |
| 40 | Forschung & Ziele › Behörden | 1 | 32 | 1 | – |
| 41 | Forschung & Ziele › Stand der Agenda | 1.07 | 61 | 1 | – |
| 42 | Außen › Länder und Diplomatie | 1.75 | 398 | 67 | zu lang: 1.7 Bildschirme |
| 43 | Außen › Behörden | 1 | 33 | 1 | – |
| 44 | Außen › Weltlage | 2.48 | 225 | 4 | zu lang: 2.5 Bildschirme |
| 45 | Sicherheit › Streitkräfte | 1.34 | 113 | 11 | – |
| 46 | Sicherheit › Rüstung und Beschaffung | 2.69 | 422 | 24 | zu lang: 2.7 Bildschirme |
| 47 | Sicherheit › Behörden | 1 | 64 | 4 | – |
| 48 | Sicherheit › Sicherheitslage | 2.07 | 295 | 11 | zu lang: 2.1 Bildschirme |
| 49 | Medien › Zeitung | 1 | 18 | 2 | – |
| 50 | Medien › Medienlage | 1 | 51 | 1 | – |

