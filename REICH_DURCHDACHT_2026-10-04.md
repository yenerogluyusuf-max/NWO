# Das Reich durchdacht — 04.10.2026

Anlass (Nutzer, 04.10.): „auch bei Großprojekte ist immer alles gemischt … Sanieren: warum soll ich das machen, wenn es keinen Effekt hat … Restaurieren (gut), da sieht man ja, wie schlecht es einem Kulturerbe geht“; „es muss alles am richtigen Ort sein und Sinn ergeben“; „Raumfahrt, KI, Autobahn bis China, selbst Unrealistisches … unrealistisch realistisch“; „sehr große Investitionen in Technologien, Meerestechnologien, Luftraum, Biologie“; „Projekte in einzelnen Regionen“.

Dateien: `game/src/sim/reich.ts`, `reich-typen.ts`, `game/src/data/reich/*`, `game/src/ui/Reich.tsx`, `game/src/ui/reich/*`, Tests `game/test/reich*.test.ts`.

## 1. Audit (Stand vor der Arbeit: 137 Vorhaben)

| Befund | Ursache | Folge |
|---|---|---|
| 8 „Sanierungen“ (Infrastruktur) ohne sichtbaren Effekt | Sie hoben nur den internen Zustand (+26). Der Zustand wirkte über `zustandsSkala` auf die Dauerwirkung, aber nichts zeigte das; die Karte nannte „Bauwerk: Zustand +26“. Zusätzlich stand die Sanierung als Karte mitten unter den Großprojekten. | Jetzt **Instandsetzung**: Vorher-Zustand, Folge des Verfalls, Wirkung nach der Arbeit in Zahlen (Abschnitt 2). |
| 4 Einrichtungen (Verfassungsgericht, Richterrat, Strafvollzug, Anwaltskammern) ohne jede Wirkung, aber mit Unterhalt (zusammen 1,3 Verwaltungskraft im Monat) und im Reich unsichtbar | Zustand ohne Dauerwirkung | Neues Feld `zeigt`: Sie werden an den Größen abgelesen, die sie prägen (Unabhängigkeit der Justiz, Überfüllung der Haftanstalten …), mit Unterhalt in „Lage“. |
| Rüstungsbestand verfiel ohne Gegenmittel | Keine Pflege für Militär | Instandsetzung auch für Drohnenverbund und Anadolu. |
| Später Gebautes hatte keine Pflege | Nur der Startbestand bekam eine Sanierung | Jedes gebaute Stück mit Wirkung (auch Katalog, Technologie, Regionalprojekte) lässt sich instand setzen. |
| Eine lange Seite je Bereich, alles gemischt | `Reich.tsx` rechnete und zeigte alles in einem Raster | Reiter je Akte (Abschnitt 3). |
| Überlauf, Doppelungen | Überschrift und Einleitungssatz standen doppelt (Stage zeigt den Hinweissatz schon) | entfernt. |
| iCloud-Platzhalter | 5 Straßen-/Schienendateien in `public/data/osm` hatten nur die Größe, keinen Inhalt (Ursache für `ERR_CONTENT_LENGTH_MISMATCH`) | aus dem letzten Commit byte-genau wiederhergestellt. |

**Zustand und Wirkung (Formel, eine Stelle: `zustandsSkala` in `sim/reich.ts`).** Der Startbestand wirkt nur gegenüber dem Spielbeginn: `skala = clamp((Zustand − Bezug) / 30, −1, 1)`; neue Bauten wirken nach `Zustand / 100`. Die Dauerwirkung wird mit der Skala multipliziert (Gleichgewicht der Größe, nicht Monatsstoß). Verfall: 0,09 (Infrastruktur), 0,10 (Rüstung), 0,06 (übrige) Punkte je Monat mal Pflegefaktor `1,25 − 0,6 × Instandhaltung/100`. **Ehrlich gesagt:** Der Verfall ist in einer Amtszeit klein (etwa 5 Punkte), die Pflege lohnt vor allem als Aufbesserung über den Bezug hinaus (bis +0,7 Skala). Die Oberfläche sagt das („Das spürt man in dieser Amtszeit kaum“ / „bringt kaum etwas Messbares“) und nennt Wirkungen unter 0,3 Punkten nicht.

## 2. Pflege: Zustand sichtbar, Eingriff, Wirkung

- Ein Wort je Handlung: **Restaurieren** (Stätten), **Instandsetzen** (Bauwerke, Rüstung). „Sanieren“ kommt nicht mehr vor (Test).
- `pflegeStand(welt, id)`: Zustand, Bezug (Strich im Balken), Wirkung heute gegenüber dem Spielbeginn, Zustand und Verlust in fünf Jahren ohne Pflege, Zustand und Gewinn nach der Instandsetzung, Nutzen (Summe der bewegten Punkte), Dringlichkeit.
- Instandsetzung hebt Zustand um 26 (Rüstung 22), kostet 2 Kapital und Baukapazität, hebt bei Infrastruktur zusätzlich den „Zustand der Anlagen“ (`wartungszustand`) in den betroffenen Provinzen. Voraussetzung: Zustand höchstens 88 (sonst „Nicht nötig“).
- Alte Kennungen (`sanierung_…`) bleiben, damit laufende Instandsetzungen in älteren Spielständen weiterlaufen.
- **Vorher/Nachher** für alle Eingriffe: Ausgangslage der bewegten Größen wird beim Beginn festgehalten; bei der Fertigstellung entsteht ein Eintrag im `verlauf` des Reiches (Vorher · bei Fertigstellung · heute), bei Pflege mit Zustand vorher → nachher.

## 3. Gliederung der Akten

Jede Akte hat Reiter: **Lage** (Größen, Ressourcen, das Dringendste bzw. „Hier lohnt sich Pflege“, Im Bau, Baureihenfolge, Zuletzt fertig, Vorteile, Meldungen), **… pflegen** (Kultur: Stätten; Infrastruktur und Rüstung: Bestand), **Neue Vorhaben**.

„Neue Vorhaben“ hat eine Themenleiste: Alles · Programme für Regionen · Verkehr und Welt · Energie und Wasser · Städte · Raumfahrt · Künstliche Intelligenz · Technologie (mit Feldern) · Weitere Vorhaben (nach Art) · Unrealistisch. Ketten zeigen ihren „Weg der Stufen“ (fertig / im Bau / bereit / Voraussetzung fehlt).

## 4. Programme für Regionen

Vorlagen (`vorlage`, Werte für das GANZE LAND) lassen sich für eine Provinz, mehrere Provinzen, eine Region oder das Land anlegen (`regionalVorschau`, `beginneRegional`; Ortswahl = `ui/OrtWahl.tsx`, unverändert). Der Umfang ist der Bevölkerungsanteil der Provinzen; Skalierung (Spielparameter, eine Stelle: `regionalFaktoren`):

| Größe | Faktor |
|---|---|
| Politisches Kapital | `umfangFaktor(Anteil)` aus `sim/handeln.ts` (wie in der Politik) |
| Verwaltungskraft | `umfangFaktor(Anteil)` |
| Baupunkte | `max(0,025; Anteil)` (Sockel: mindestens 40 Baupunkte) |
| Bauzeit | `0,35 + 0,65 × √Anteil` (mindestens 3 Monate) |
| Schulden | `Anteil` |
| Unterhalt, Kapazität | `Anteil^0,8` bzw. `Anteil` |
| Wirkung auf Größen (Abschluss, Dauer, Bauwirkung) | nur in den gewählten Provinzen, mit der Stärke der Vorlage |

Das Preisschild nennt den Umfang: „betrifft 12 Prozent der Bevölkerung · Kapital ×0,45 · Baupunkte ×0,12 · Dauer ×0,7 · Schulden ×0,12“. Dasselbe Vorhaben am selben Ort gibt es nur einmal: Überschneidungen werden vor dem Anlegen benannt. Mehrere Projekte sind durch den Namen mit Ort unterscheidbar („Wohnungsbauprogramm: Hatay“). Die Definitionen stehen im Spielstand (`ReichZustand.regional`), ältere Spielstände laden weiter. Auch Katalog-Großprojekte lassen sich regional anlegen, soweit sie als Vorlage geführt werden; die festen Einzelobjekte (Marmaray, Akkuyu …) bleiben fest.

Das Restaurierungsprogramm (Kultur) skaliert nach der Zahl der Stätten in den gewählten Provinzen (+20 Zustand je Stätte).

## 5. Zukunftskatalog und Technologie

Prinzip „unrealistisch realistisch“: Jede Zahl ist ein Spielparameter; als Maßstab steht eine Analogie aus der Wirklichkeit im Feld `anker`, nie erfundene Genauigkeit. Mechanik:

- **Preis in mehreren Währungen:** Kapital, Baupunkte (belegen Baukapazität über Jahre), Verwaltungskraft je Monat, Schulden in % BIP über die Bauzeit.
- **Voraussetzungen** aus Bildung (Hochschulen), Fachkräften, Energie, Partnerstaaten und Lizenzen (Beziehung zu USA/EU, Rüstungsautarkie), Vorstufen (`bestand`).
- **Während des Baus** wirken `bauwirkung` (Aufträge, Aufbruch, aber auch Lasten wie Vertrauen der Märkte).
- **Kostenüberschreitung** (`ueberzug`): Wahrscheinlichkeit, Größe und Marken des Baufortschritts; gewürfelt wird aus Spielstand und Vorhaben (`hashZahl`), ohne den Zufallsstrom des Spiels zu berühren. Trifft sie, steigen Baupunkte und Bauzeit, und die Schulden wachsen mit.
- **Ungewisser Durchbruch** (`scheitern`): Bei einer Marke fällt ein Wurf; Scheitern heißt: Geld und Baupunkte verloren, Ansehen und Legitimität sinken, Neubeginn bei null.
- **Konkurrenz und Spionage** (`konkurrenz`) als Text je Vorhaben; **Kehrseite** und **Verlierer** je Vorhaben.
- **Unrealistisch** (15 Vorhaben): mindestens 9.000 Baupunkte, 12,5 Jahre, 5 % BIP Schulden, 30 Kapital, 80 % Überschreitung, mindestens drei Voraussetzungen, Ansehen als Gegenwert; keine ist am Anfang beginnbar. Sie sind Langzeit- und Prestigeprojekte, keine Abkürzung zum Sieg.

#### Verkehr und Welt (7)

Wege nach Zentralasien und China, Häfen und Megaverbindungen: Jede Stufe verlangt die vorige und Partner entlang der Strecke.

| Stufe | Kennung | Name | Art | Kapital | Baupunkte | Dauer | Verw./Monat | Schulden (% BIP) | Scheitern | Mehrkosten |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `welt_korridor_abkommen` | Transitabkommen für den Mittleren Korridor | reform | 6 | 40 | 8 M. | 1 | – | – | – |
| 1 | `welt_megahafen` | Megahafen Mersin | grossprojekt | 11 | 4.200 | 6 J. | 2.6 | 1.4 | – | 55 % |
| 1 | `welt_bruecke_zypern` | Brücke oder Tunnel nach Zypern | wunder (unrealistisch) | 45 | 22.000 | 22 J. | 6 | 11 | – | 90 % |
| 2 | `welt_korridor_terminals` | Terminals, Fähren und Güterbahn am Kaspischen Meer | ausbau | 5 | 700 | 2,5 J. | 1.4 | 0.3 | – | 50 % |
| 2 | `welt_maglev` | Magnetschwebebahn Istanbul–Ankara | wunder (unrealistisch) | 40 | 18.000 | 20 J. | 6 | 9 | – | 90 % |
| 3 | `welt_autobahn_china` | Autobahn bis China (Mittlerer Korridor) | grossprojekt | 14 | 5.600 | 8 J. | 3.5 | 2.2 | – | 70 % |
| 3 | `welt_hsr_china` | Hochgeschwindigkeitsbahn bis China (Mittlerer Korridor) | grossprojekt | 20 | 9.500 | 11 J. | 4.5 | 4.2 | – | 80 % |

#### Energie und Wasser (9)

Stromverbund, Atom, Fusion und Wasserumleitungen: erst Forschung und Verträge, dann Anlagen.

| Stufe | Kennung | Name | Art | Kapital | Baupunkte | Dauer | Verw./Monat | Schulden (% BIP) | Scheitern | Mehrkosten |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `energie_hvdc_europa` | Stromverbund nach Europa (Gleichstromkabel) | grossprojekt | 7 | 1.900 | 3,5 J. | 1.8 | 0.5 | – | – |
| 1 | `energie_fusion_forschung` | Fusionsforschungsprogramm | ausbau | 6 | 650 | 4 J. | 1.5 | 0.2 | – | – |
| 1 | `wasser_konya` | Wasserüberleitung ins Konya-Becken | grossprojekt | 11 | 3.800 | 6 J. | 2.4 | 1.2 | – | 60 % |
| 1 | `wasser_entsalzung` | Meerwasserentsalzung an der Südküste | grossprojekt | 7 | 1.600 | 3,5 J. | 1.8 | 0.5 | – | 45 % |
| 1 | `wasser_friedensleitung` | Friedensleitung: Wasser für den Nahen Osten | grossprojekt | 22 | 7.500 | 10 J. | 4 | 3 | – | 80 % |
| 2 | `energie_smr` | Flotte kleiner modularer Reaktoren | grossprojekt | 10 | 2.600 | 5,5 J. | 2.4 | 1 | – | 70 % |
| 2 | `energie_fusion_testreaktor` | Fusions-Testreaktor | wunder (unrealistisch) | 40 | 15.000 | 18 J. | 5.5 | 8 | 35 % | 90 % |
| 3 | `energie_brennstoffkreislauf` | Eigener Brennstoffkreislauf (Anreicherung) | grossprojekt | 15 | 3.800 | 7 J. | 3.2 | 1.6 | – | 75 % |
| 3 | `energie_fusion_kraftwerk` | Fusionskraftwerk am Netz | wunder (unrealistisch) | 65 | 42.000 | 35 J. | 8 | 15 | 40 % | 90 % |

#### Städte (3)

Von neuen Stadtteilen bis zur neuen Hauptstadt: Wohnraum schaffen kostet Wald, Wasser und Vertrauen.

| Stufe | Kennung | Name | Art | Kapital | Baupunkte | Dauer | Verw./Monat | Schulden (% BIP) | Scheitern | Mehrkosten |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `stadt_satellit_ost` | Satellitenstadt Istanbul-Ost | grossprojekt | 9 | 3.200 | 4,5 J. | 2.5 | 0.9 | – | 50 % |
| 2 | `stadt_hauptstadt_neu` | Neue Hauptstadt in Zentralanatolien | wunder (unrealistisch) | 38 | 16.000 | 15 J. | 6 | 8.5 | – | 90 % |
| 3 | `stadt_unterwasser` | Unterwasserstadt im Marmarameer | wunder (unrealistisch) | 60 | 40.000 | 30 J. | 8 | 16 | 30 % | 90 % |

#### Raumfahrt (9)

Von der Behörde bis zum Mars: Jede Stufe baut auf der vorigen auf, und keine ist billig.

| Stufe | Kennung | Name | Art | Kapital | Baupunkte | Dauer | Verw./Monat | Schulden (% BIP) | Scheitern | Mehrkosten |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `raum_agentur` | Raumfahrtbehörde ausbauen | ausbau | 4 | 180 | 18 M. | 1.2 | – | – | – |
| 2 | `raum_satelliten` | Satellitenprogramm (Erdbeobachtung, Funk, Navigation) | grossprojekt | 7 | 900 | 3 J. | 1.8 | 0.35 | – | 50 % |
| 3 | `raum_bahnhof` | Weltraumbahnhof an der Südküste | grossprojekt | 10 | 2.600 | 5 J. | 2.4 | 1 | – | 60 % |
| 4 | `raum_traeger` | Eigene Trägerrakete für den Orbit | grossprojekt | 14 | 4.200 | 7 J. | 3.2 | 1.6 | – | 80 % |
| 5 | `raum_mondsonde` | Mondmission (unbemannt, weiche Landung) | wunder | 12 | 3.200 | 5,5 J. | 2.6 | 0.8 | – | 60 % |
| 6 | `raum_orbit_bemannt` | Bemannte Mission in den Orbit | wunder | 18 | 6.500 | 8 J. | 3.6 | 2.4 | – | 75 % |
| 7 | `raum_mondbasis` | Mondbasis | wunder (unrealistisch) | 45 | 28.000 | 25 J. | 6.5 | 11 | 25 % | 90 % |
| 8 | `raum_mars` | Marsmission (bemannt) | wunder (unrealistisch) | 70 | 60.000 | 35 J. | 9 | 18 | 30 % | 90 % |
| 8 | `raum_aufzug` | Weltraumaufzug | wunder (unrealistisch) | 70 | 80.000 | 40 J. | 10 | 22 | 40 % | 90 % |

#### Künstliche Intelligenz (8)

Strategie, Rechenzentren, Chips und Anwendungen: abhängig von Strom, Köpfen und Lieferanten.

| Stufe | Kennung | Name | Art | Kapital | Baupunkte | Dauer | Verw./Monat | Schulden (% BIP) | Scheitern | Mehrkosten |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `ki_strategie` | Nationale KI-Strategie und Rechtsrahmen | ausbau | 4 | 80 | 12 M. | 1 | – | – | – |
| 2 | `ki_rechenzentren` | Nationales Rechenzentrumsnetz für KI | grossprojekt | 8 | 1.400 | 3 J. | 2 | 0.5 | – | 50 % |
| 3 | `ki_chipfab` | Chipfabrik (Halbleiterfertigung) | grossprojekt | 16 | 4.800 | 7 J. | 3.4 | 2 | – | 80 % |
| 3 | `ki_sprachmodell` | Eigenes türkisches Sprachmodell | grossprojekt | 8 | 700 | 2,5 J. | 1.6 | 0.3 | – | 60 % |
| 3 | `ki_verwaltung` | KI in der Verwaltung | ausbau | 8 | 700 | 2,5 J. | 1.5 | 0.2 | – | – |
| 4 | `ki_justiz` | KI-gestützte Justiz | ausbau | 6 | 600 | 2,5 J. | 1.4 | 0.1 | – | – |
| 4 | `ki_militaer` | KI-Gefechtsführung und Drohnenschwärme | grossprojekt | 9 | 1.800 | 4 J. | 2.2 | 0.7 | – | 50 % |
| 5 | `ki_agi` | Allgemeine Künstliche Intelligenz (nationales Großprogramm) | wunder (unrealistisch) | 55 | 40.000 | 25 J. | 8 | 14 | 35 % | 90 % |

#### Technologie (23)

Sehr große Investitionen in Meer, Luft, Biologie, Chips, Batterien, Quanten, Robotik und Werkstoffe: lange Laufzeit, ungewisse Durchbrüche, Konkurrenz und Spionage, später Ertrag mit Nebenwirkungen.

**Meerestechnologie**

| Stufe | Kennung | Name | Art | Kapital | Baupunkte | Dauer | Verw./Monat | Schulden (% BIP) | Scheitern | Mehrkosten |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `meer_institut` | Meeresforschungsinstitut und Forschungsschiffe | ausbau | 5 | 420 | 3 J. | 1.4 | 0.15 | – | 60 % |
| 1 | `meer_hafenautomatisierung` | Hafenautomatisierung (Containerterminals) | grossprojekt | 8 | 2.200 | 4 J. | 1.8 | 0.7 | – | 60 % |
| 2 | `meer_offshore_wind` | Offshore-Windparks (Ägäis und Schwarzes Meer) | grossprojekt | 10 | 3.400 | 5 J. | 2.4 | 1.1 | – | 60 % |
| 2 | `meer_tiefsee_gas` | Tiefseegas: Sakarya-Feld Ausbau und neue Bohrungen | grossprojekt | 12 | 4.000 | 6 J. | 2.8 | 1.8 | 20 % | 60 % |
| 2 | `meer_uwdrohnen` | Unterwasserdrohnen und Überwachung des Meeresbodens | grossprojekt | 8 | 1.700 | 3,5 J. | 2 | 0.6 | 15 % | 60 % |
| 3 | `meer_uboote` | Nationale U-Boot-Flotte | beschaffung | 14 | 4.600 | 8 J. | 3.4 | 1.9 | 15 % | 75 % |
| 3 | `meer_tiefseebergbau` | Tiefseebergbau (Manganknollen und Metalle) | wunder (unrealistisch) | 38 | 14.000 | 15 J. | 5.5 | 7 | 35 % | 90 % |

**Luftfahrttechnik**

| Stufe | Kennung | Name | Art | Kapital | Baupunkte | Dauer | Verw./Monat | Schulden (% BIP) | Scheitern | Mehrkosten |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `luft_triebwerke` | Triebwerksentwicklung (zivil und militärisch) | forschung | 9 | 2.200 | 5 J. | 2.4 | 0.8 | 25 % | 70 % |
| 2 | `luft_regionalflugzeug` | Nationales Regionalflugzeug | grossprojekt | 11 | 3.600 | 7 J. | 2.8 | 1.4 | 25 % | 75 % |
| 2 | `luft_flugtaxi` | Flugtaxi-Netz für Großstädte | wunder (unrealistisch) | 30 | 9.000 | 12,5 J. | 4 | 5 | 35 % | 90 % |

**Biotechnologie**

| Stufe | Kennung | Name | Art | Kapital | Baupunkte | Dauer | Verw./Monat | Schulden (% BIP) | Scheitern | Mehrkosten |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `bio_genomik` | Nationales Genomprogramm (Genomzentrum) | ausbau | 6 | 700 | 4 J. | 1.5 | 0.2 | – | 60 % |
| 2 | `bio_impfstoffwerk` | Impfstoff- und Wirkstoffwerk | grossprojekt | 9 | 2.800 | 5 J. | 2.2 | 0.9 | 20 % | 60 % |
| 2 | `bio_saatgut` | Saatgut und Agrarbiotechnologie | forschung | 7 | 1.600 | 4,5 J. | 1.8 | 0.4 | 20 % | 60 % |
| 3 | `bio_medizintechnik` | Medizintechnik-Cluster | grossprojekt | 9 | 2.400 | 5 J. | 2 | 0.8 | – | 50 % |
| 4 | `bio_gentherapie` | Nationales Gentherapie-Programm für seltene Krankheiten | wunder (unrealistisch) | 38 | 15.000 | 16,7 J. | 5 | 7 | 35 % | 90 % |

**Halbleiter und Chips**

| Stufe | Kennung | Name | Art | Kapital | Baupunkte | Dauer | Verw./Monat | Schulden (% BIP) | Scheitern | Mehrkosten |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `chips_design` | Chip-Entwurfszentrum | ausbau | 6 | 600 | 3,5 J. | 1.4 | 0.2 | – | 60 % |
| 3 | `chips_euv` | Eigene Lithografie-Maschinen (EUV) | wunder (unrealistisch) | 55 | 38.000 | 25 J. | 7 | 12 | 40 % | 90 % |

**Batterien und Wasserstoff**

| Stufe | Kennung | Name | Art | Kapital | Baupunkte | Dauer | Verw./Monat | Schulden (% BIP) | Scheitern | Mehrkosten |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `batt_zellfabrik` | Batteriezellfabrik | grossprojekt | 9 | 2.600 | 4 J. | 2 | 1 | 15 % | 60 % |
| 2 | `h2_elektrolyse` | Grüner Wasserstoff: Elektrolysepark | grossprojekt | 10 | 3.400 | 5 J. | 2.4 | 1.3 | – | 70 % |

**Quantentechnologie**

| Stufe | Kennung | Name | Art | Kapital | Baupunkte | Dauer | Verw./Monat | Schulden (% BIP) | Scheitern | Mehrkosten |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `quanten_zentrum` | Quantentechnologie-Zentrum | ausbau | 7 | 800 | 4 J. | 1.6 | 0.25 | – | 60 % |
| 2 | `quanten_computer` | Nationaler Quantencomputer | wunder (unrealistisch) | 34 | 12.000 | 15 J. | 5 | 6 | 35 % | 90 % |

**Robotik**

| Stufe | Kennung | Name | Art | Kapital | Baupunkte | Dauer | Verw./Monat | Schulden (% BIP) | Scheitern | Mehrkosten |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `robotik_offensive` | Robotik- und Automatisierungsoffensive | grossprojekt | 9 | 3.000 | 4,5 J. | 2.2 | 1 | – | 60 % |

**Nanomaterialien**

| Stufe | Kennung | Name | Art | Kapital | Baupunkte | Dauer | Verw./Monat | Schulden (% BIP) | Scheitern | Mehrkosten |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `nano_zentrum` | Nanomaterialien-Zentrum (Graphen und Verbundwerkstoffe) | ausbau | 7 | 900 | 4,5 J. | 1.6 | 0.3 | 20 % | 60 % |

#### Programme für Regionen (13, Werte für das ganze Land)

| Kennung | Name | Kapital | Baupunkte | Dauer | Verw./Monat | Schulden | Maßnahme der Ortswahl |
|---|---|---|---|---|---|---|---|
| `reg_wohnungsbau` | Wohnungsbauprogramm | 14 | 7.200 | 60 M. | 3 | 1.6 | `m_sozialwohnungen` |
| `reg_schulbau` | Schulbauprogramm | 10 | 4.200 | 42 M. | 2 | 0.8 | `m_schulbau` |
| `reg_krankenhaus` | Krankenhausbauprogramm | 12 | 5.200 | 48 M. | 2.4 | 1.1 | `m_krankenhausbau` |
| `reg_wasser` | Wasserleitungen, Speicher und Kläranlagen | 11 | 4.600 | 48 M. | 2.2 | 0.9 | `m_wasserleitungen` |
| `reg_damm` | Staudämme und Bewässerung | 15 | 6.400 | 66 M. | 3 | 1.5 | `m_wasserleitungen` |
| `reg_strassen` | Straßen- und Brückenbau | 12 | 5.600 | 48 M. | 2.2 | 1.3 | `m_autobahnen` |
| `reg_bahn` | Bahnausbau | 14 | 6.800 | 60 M. | 2.6 | 1.6 | `m_bahn` |
| `reg_strom` | Stromnetzausbau | 9 | 3.600 | 36 M. | 1.8 | 0.7 | `m_netzausbau` |
| `reg_breitband` | Breitband und Mobilfunk | 8 | 2.800 | 30 M. | 1.4 | 0.5 | `m_breitband` |
| `reg_foerderung` | Regionalförderung | 10 | 2.600 | 36 M. | 2 | 0.9 | `m_regionalfoerderung` |
| `reg_wiederaufbau` | Wiederaufbau und Erdbebenertüchtigung | 14 | 7.600 | 60 M. | 3 | 1.8 | `m_stadterneuerung` |
| `reg_stadterneuerung` | Stadterneuerung: Wohnviertel und Altstädte | 11 | 4.400 | 48 M. | 2.2 | 1 | `m_stadterneuerung` |
| `reg_kultur` | Restaurierungsprogramm für Stätten | 24 | 5.300 | 48 M. | 4 | 0.4 | `m_denkmalschutz` |

## 6. Anschlüsse

**Stage.tsx (nicht geändert):** Die Karte liest `VORHABEN` (feste Orte, nur wunder/grossprojekt/serie). Anzuschließen: `kartenOrte(world)` aus `sim/reich.ts` liefert alle Baustellen und fertigen Projekte mit Ort (Katalog, freie Großprojekte, Regionalprojekte), Form `{ id: "v:…", lon, lat, art: "bau" | "wunder", text }`; die Schleife in `orte` kann durch `...kartenOrte(w)` ersetzt werden.

**Gemini, `sim/grossprojekt.ts` und `sim/befehle.ts` (nicht geändert):** `katalogFuerEingabe(text)` aus `data/reich/katalog.ts` ordnet die freie Eingabe dem Katalog zu und liefert `{ id, name, vorlage, grund }` oder `null`. Vorschlag für die Reihenfolge im Befehlsrouter: erst `katalogFuerEingabe`; bei `vorlage: false` `beginne(welt, id)` aufrufen (Voraussetzungen und Preise prüft der Kern) und `grund` ausgeben; bei `vorlage: true` die Ortswahl öffnen oder den Ort aus dem Text lesen (`provinzenText`/`ortAusText`) und `beginneRegional(welt, id, provinzen)` aufrufen; sonst wie bisher `interpretiere`. Der Stubtext in `befehle.ts` („Freie Großprojekte gibt es noch nicht“) kann entfallen.

**ki/kontext.ts:** Die Vorhabenliste im Prompt umfasst jetzt 271 Einträge, davon 70 Instandsetzungen; sie lassen sich über `v.pflegt` herausfiltern.

## 7. Tests

`test/reich.test.ts` (21, ein Katalogtest angepasst: die Vorlage „Restaurierungsprogramm“ ist keine einzelne Restaurierung), `reich-ui.test.tsx` (3), `reich-wirkung.test.ts` (21), `reich-katalog.test.ts` (38), `reich-regional.test.ts` (17). Vollsuite: 1073 von 1074 grün; ein Test (`ereignisse-texte`, Währungsrutsch) lief unter Last in den 5-Sekunden-Timeout und besteht allein.

## 8. Offen

- Die Skala der Pflege ist klein im Verhältnis zur Amtszeit; wer „Pflege lohnt sich“ stärker spürbar will, erhöht `verfallSatz` oder die Stärke der Dauerwirkungen (dann Balance mit `spielbarkeit.test.ts` neu messen).
- Die Zahlen des Katalogs sind Spielparameter, die Analogien aus der Erinnerung geschrieben und nicht einzeln gegen Quellen geprüft (Kennzeichnung „Spielparameter, Analogie zu …“ im Text); vor einer Veröffentlichung prüfen.
- Mobile/Handy: Karten sind bei 880 px und 1000 px Breite ohne Überlauf geprüft, nicht darunter.
