# Bäume wie in Civ 6 und HOI4, Krieg wie in HOI4: Machbarkeit und Konzept (05.10.2026)

Anlass: Der Nutzer wünscht „richtig gute Animationen wie bei Civ 6“, einen Krieg „wie bei HOI4“ und fragt, ob sich Ziele und Wissenschaft aus diesen Spielen integrieren lassen: Civ 6 hat den Wissenschaftsbaum (und den Kulturbaum), HOI4 hat mehrere Bäume (Fokus, Forschung, Doktrinen, Industrie). Antwort: **Ja, und ein großer Teil der Grundlage liegt schon im Projekt.** Aussagen über die Vorbildspiele stammen aus Spielwissen und der Recherche `RECHERCHE_VERTIEFUNG_WISSENSCHAFT_KULTUR.md` (dort als „unverifiziert“ markierte Zahlen übernehme ich nicht).

## 1. Bestand: Was schon wie ein Baum gebaut ist

| Baustein | Stand | Nähe zum Vorbild |
|---|---|---|
| Technologie- und Zukunftskatalog (`data/reich/technologie.ts`, `zukunft.ts`) | Ausgewertet: mindestens 62 Vorhaben mit Feld, Stufe und Vorgängern (`voraus: bestand`). Felder u. a. Meer, Luft, Bio, Chips, Energietechnik, Quanten, Robotik, Nano, Raumfahrt, KI. Ketten bis Tiefe 7 (Mondsonde, Orbit, Mondbasis, Mars). Laufzeiten 8 bis 480 Monate (Median 60). Durchbrüche mit Misserfolgswahrscheinlichkeit, Überzug, Kehrseite, Verlierer, Konkurrenz | ein Technologiebaum ohne Baumansicht |
| Programme (`sim/programme.ts`) | 4 Ketten aus Schritten mit Bedingung, Kosten, Dauer, Dauerwirkung | Keimzelle des Fokusbaums |
| Ziele (`sim/ziele.ts`) | 10 messbare Ziele, 3 gewählt, Prüfung am Ende | Civ-6-„Dedication“ ohne Folgen |
| Doktrin (`sim/krieg.ts`, `doktrinPassung`) | eine Passung Doktrin gegen Mobilisierung | HOI4-Doktrinen im Keim |
| Pakte, Koalitionen, Drittkriege | fertig (Fork C, `PAKTE_KRIEGE.md`) | HOI4-Fraktionen und Kriegsbeteiligung |
| Weltkarte mit 253 Ländern, Besitzerwechsel vorbereitet | fertig (Fork B) | Voraussetzung für Regionen und Annexion |
| Recherche Wissen und Kultur | 12.000 Wörter: sechs Archetypen, „Schichtenlösung“, Top-15-Übernahmen (Eureka, Innovations-Cap, Reform-Deck, Traditionsbäume, Brain Drain als Leck, Vorlauf-Malus, Institutionen-Level) | Bauplan |

Was fehlt: eine **Baumansicht**, **Forschungsplätze und Forschungsrate**, **Eureka-Boosts**, ein **Fokusbaum mit Zeit und Ausschlüssen**, **Doktrin- und Ausrüstungsbäume**, und die **Verbindung zum Krieg**.

## 2. Was die Vorbilder tatsächlich bieten

- **Civ 6:** Technologiebaum mit Eureka (Kosten sinken, wenn man in der Welt etwas Bestimmtes getan hat); Kulturbaum mit Inspiration, schaltet Regierungsformen und Politikkarten in Plätzen frei; große Persönlichkeiten; Forschungsabkommen; Zitate beim Abschluss.
- **HOI4:** Nationaler Fokusbaum (je Nation, Ausschlüsse, Zeit, Voraussetzungen, Ideologie-Äste); Forschung mit Plätzen und „Vorlauf-Malus“; Doktrinen (Land, Luft, See) als Pfade; Industrie und Fertigungslinien; nationale Ideen und Berater; Spionage und Tech-Raub; Kriegsführung über Frontabschnitte, Armeegruppen, Schlachtpläne, Nachschub, Luftherrschaft, Seeblockade, Generäle, Besatzung, Kriegsziele und Friedenskonferenz.

## 3. Abbildung auf Staatsräson: drei Bäume und eine Fertigung

**B1 Fokusbaum „Agenda“ (Politik).** HOI4-Fokus plus Civ-6-Kulturbaum.
- Äste: Wirtschaftsordnung, Sicherheit und Armee, Gesellschaft und Religion, Außen und Bündnisse, Staat und Recht, Land und Regionen, Wissen. Rund 80 bis 120 Foki.
- Jeder Fokus: Dauer (60 bis 180 Tage, Spielparameter), 1 bis 3 gleichzeitige Plätze (mehr durch Verwaltungskraft und Kabinettsleistung), Vorbedingungen aus der Wirklichkeit (Maßnahmenstufen, Größen, Bestände), **Ausschlüsse** (Marktöffnung gegen Staatswirtschaft, Laizismus gegen religiöse Ordnung, Zentralstaat gegen Föderalismus), Preis in Kapital und Aufmerksamkeit, Dauerwirkung als **Bestand**, nicht als Stoß.
- **Parteilinie als Preis:** Die gewählte Parteilinie (Welle 5) macht Äste billig, teuer oder gesperrt, ohne eine Richtung zu verbieten.
- **Verknüpfungen:** Die 4 Programme werden Äste; Ziele werden „Leitlinie je Amtszeit“ mit Fokus-Ergebnissen; Wahlversprechen sind Foki mit Frist; die Kabinettsleitung eines Fokus zählt (Fähigkeit und Loyalität der Ministerin); Weltereignisse öffnen **Gelegenheitsfenster** (Fokus billiger oder neu); ein Regimewechsel sperrt Äste.
- **Ansicht:** Politik, Reiter „Agenda“: waagerechtes Tableau mit Ästen, Fortschrittsringen, „Warum gesperrt?“ und Vorschau der Folgen.

**B2 Forschungsbaum „Wissen“ (Reich).** Civ-6-Technologiebaum plus HOI4-Plätze, auf der vorhandenen Vorhaben-Kette aufgebaut.
- Zwei Stufen: **Wissen** (Technologie, wird erforscht, schaltet frei und verbessert Faktoren) und **Anwendung** (Vorhaben, wird gebaut, wie heute). Die vorhandenen Ketten werden auf diese Stufen verteilt.
- **Forschungsplätze** (2 bis 4, wachsen mit Hochschulen und Verwaltung) und **Forschungsrate** aus Haushalt Forschung, Hochschule, Fachkräfte, Abkommen und Ausland; **Innovations-Cap** aus dem Bildungsbestand (Recherche, Rang 1).
- **Eureka:** Einmalige Boosts, wenn der Spieler in der Wirklichkeit etwas tut (Impfstoffwerk gebaut, Beben überstanden, Krieg geführt, Abkommen geschlossen), rund 40 % Zeitersparnis (Recherchewert, Spielparameter).
- **Gegenkräfte:** Brain Drain (Abfluss benannter Fachkräfte; Rate aus Lohngefälle, Rechtsstaat, Pressefreiheit), Vorlauf-Malus für Sprünge ohne Basis, Embargo und Lizenzen (Sanktionsrisiko), Spionage und Tech-Raub durch andere Staaten, Misserfolg bei Utopien (vorhanden).
- **Ansicht:** Reich, Reiter „Wissen“: Baum in Epochenspalten wie Civ 6, Eureka-Hinweis, Platz- und Ratenleiste, Zitatkarte bei Abschluss.

**B3 Doktrinen und Ausrüstung (Streitkräfte).** HOI4-Doktrinen und Ausrüstungsgenerationen.
- Pfade Land, Luft, See, Drohnen, Cyber, Abschreckung; Doktrin gegen Gegnerdoktrin; Ausrüstungsgenerationen aus B2 mit Beschaffungszeit.
- Wirkt im Krieg (Kampfwerte, Nachschubbedarf, Verluste), in Rüstungsexport und -import (Abkommen, Sanktionen), auf Offiziersvertrauen.

**B4 Fertigung (Wirtschaft und Krieg).** Fertigungslinien für Heer, Luft, See, Drohnen und Munition aus der Rüstungsindustrie; Rohstoffe und Importe; Kriegswirtschaft mit Mobilisierungsleiter (heute 3 Stufen, Plan 4 bis 5). Details im Kriegsteil.

## 4. Krieg wie HOI4

**Entscheidungswechsel:** `ENTSCHEIDUNGEN.md` sagt bisher „Verlauf abstrakt“ (und `krieg-typen.ts`: „kein Taktikspiel“). Der Nutzer will HOI4. Ich lese das als: **operative Führungsebene** (Fronten, Armeen, Pläne, Nachschub), keine Gefechtsmikrosteuerung einzelner Einheiten. Der Präsident bleibt Oberbefehlshaber mit Delegationsstufen („Generalstab führt nach Doktrin“ bis „Ich plane selbst“).

1. **Schauplätze mit Regionen:** Verwaltungsgebiete der Gegner (Natural Earth Stufe 1, Machbarkeit gemeldet: Syrien 15, Irak 18, Griechenland 14, Zypern 5, Armenien 11, Georgien 12, Iran 31; Aserbaidschan vorher zusammenfassen); Frontlinien laufen über das Relief der Karte.
2. **Verbände:** Armeen, Luftflotten, Flotten mit Stärke, Ausrüstung, Erfahrung und Organisation; Kapazität aus den Streitkräften und der Mobilisierung.
3. **Befehle je Frontabschnitt:** Angriff auf eine Region, Linie halten, hinhaltender Rückzug, Besetzung sichern; Planungszeit; Wochenschritt; Kampfrechnung aus Angriff gegen Verteidigung, Gelände (aus dem Relief), Befestigung, Nachschub, Luftherrschaft und Führung.
4. **Nachschub:** an Bahn, Straße und Häfen der Reich-Infrastruktur gebunden; lange Linien kosten.
5. **Luft und See:** Luftherrschaft (Jagd, Bomber, Aufklärung, Drohnen), Seeblockade und Meerengen (Montreux als Hebel).
6. **Generäle aus den Figuren:** Fähigkeiten, Merkmale, Rivalitäten, Beförderung; Ehrgeiz gegen Putschrisiko (heute nur Gerücht).
7. **Kriegsziele und Kriegsgründe:** Regionen, Reparationen, Regimewechsel; Rechtfertigung braucht Zeit; Weltspannung; Rahmung (vorhanden) bestimmt Preise.
8. **Koalitionen:** Pakte und Beistand (fertig) werden zu gemeinsamen Plänen, Expeditionskorps, Lieferungen.
9. **Besatzung und Annexion:** Besatzungspolitik (Härte oder Integration), Widerstand, Erträge; Annexion macht die Region türkisch (Besitzerwechsel, Provinzblatt, Integrationsphase, Ansehen).
10. **Frieden:** Konferenz mit Kriegspunkten nach Beitrag, Teilfrieden mit Koalitionspartnern.
11. **Heimatfront:** Kriegsmüdigkeit, Verluste, Wirtschaft, Zensur, Wehrpflicht, Kriegsrecht, Wahlen im Krieg.
12. **Ansicht und Animation:** Kriegs-Linse (Fronten, Besitz, Nachschub), Kriegsakte (Tableau mit Fronten, Verbänden, Produktion), wandernde Frontpfeile, Marker für Kämpfe, Schlachtberichte, Besitzerwechsel mit Tinten-Animation.

## 5. Animationen wie Civ 6 (Ergänzung zu `KARTE_KONZEPT_2026-10-04.md`)

- **Abschlussszenen:** Fokus und Technologie schließen mit einer Karte (Zitat, Bild, kurzer Ton), wie die vorhandene Wunder-Szene (`reich/WunderFenster.tsx`). Zitate: eigene Texte oder gemeinfreie mit Quelle; keine Übernahme fremder Spieltexte.
- **Baumbewegung:** Knoten füllen sich als Fortschrittsring, Verbindungen leuchten auf, Eureka blitzt, Kamera schwenkt weich.
- **Diplomatieszenen:** animiertes Porträt der Gegenseite am Verhandlungstisch mit Mimik und Untertitel (Civ-6-Anführer), statt statischer Karte.
- **Gemeinsame Bewegungssprache:** Easing, Dauern, Staffelung, „Bewegung reduzieren“, Bildratenbudget.

## 6. Machbarkeit, Aufwand, Risiken

| Teil | Machbarkeit | Aufwand | Wichtigste Risiken |
|---|---|---|---|
| B1 Fokusbaum | hoch: Programme-Engine, Bedingungen und Kosten vorhanden | L (Inhalt: 80 bis 120 Foki) | Balance, Neutralität der Äste, Überfrachtung |
| B2 Forschungsbaum | hoch: Ketten und Kosten vorhanden, Eureka über Ereignis-Haken | L | Golden Path, Kalibrierung gegen die Wirtschaft |
| B3 Doktrinen | mittel | M bis L | hängt am Krieg |
| Krieg wie HOI4 | mittel: Regionen-Daten machbar, viel neue Simulation | XL | Komplexität für den Spieler, Rechenlast, Balance (Falkenprobe: 10 von 10 Kriegen verloren) |
| Animationen | hoch | fortlaufend | Rechenlast; Lag-Beschwerde vom 04.10. |

Gemeinsam: Sprachen (alle Texte über `t()`), Spielstand-Migration, Messung mit Bots je Pol, Tests. **Urheberrecht:** Mechaniken sind frei, Namen, Texte, Bilder und Zitate der Vorbildspiele werden nicht übernommen.

## 7. Einordnung in den Wellenplan

Nach „Wahl und Neuanfang“ (Welle 2) und „Das Netz atmet“ (Welle 3):
- **Welle F „Agenda und Wissen“:** B1 und B2 mit Baumansichten und Abschlussszenen (gibt dem Spiel Richtung und Rückblick).
- **Welle K „Krieg“:** Regionen, Verbände, Fronten, Nachschub, Besatzung, Annexion, Friedenskonferenz, B3 und B4; Kriegs-Linse und Akte.
- **Welle A „Animationen“:** läuft mit F und K; zuerst die Karte (Hover, Auswahl, Überblendung), dann Abschlussszenen und Diplomatie.
