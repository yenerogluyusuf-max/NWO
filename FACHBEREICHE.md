# Fachbereiche: Recht, Militär, Infrastruktur, Kultur, Haushalt

Stand: 30. September 2026. Antwort auf die Kritik des Projektinhabers: „Es gibt keine Vorteile, kein Inventar. Jeder Bereich einzeln, wie bei den Konkurrenzspielen, zugeschnitten auf die Besonderheiten der Menschen. Folgen sollen nicht nur mit Geld gemessen werden. Auch Kultur, historische Städte, Wunder wie in Civilization.“ Grundlage: [RECHERCHE_KONKURRENZ_FACHBEREICHE.md](RECHERCHE_KONKURRENZ_FACHBEREICHE.md). Diese Datei nennt die Entscheidungen; sie gehen nach ENTSCHEIDUNGEN.md (Block M), sobald sie umgesetzt sind.

## 1. Bauprinzipien

1. **Jeder Bereich hat eigene Größen.** Reformen und Projekte bewegen diese Größen, nicht (nur) den Haushalt. Beispiel: Eine Reform des Richterrats hebt „Unabhängigkeit der Justiz“ und „Rechtssicherheit“ und kostet Politisches Kapital, Stimmen und Zeit, aber kein Geld.
2. **Jeder Bereich hat einen Bestand.** Was gebaut, beschafft, beschlossen oder erhalten wird, steht als Karte mit Zustand im Inventar und wirkt weiter (Wahrzeichen, Anlagen, Programme, Institutionen mit besetzten Sitzen).
3. **Jeder Bereich hat Vorteile.** Meilensteine schalten Dauervorteile frei (Landesgeister nach dem Muster der Nationalen Ziele in Hearts of Iron IV und der Wunder in Tropico), immer mit Kehrseite.
4. **Wunder sind Riesenprojekte.** Einmalig, ortsgebunden, mehrjährig, mit Voraussetzungen und einer Fertigstellung, die man sieht (Animation, Karte, Zitat).
5. **Knappe Größen neben Geld und Politischem Kapital:** Verwaltungskraft, Baukapazität, Legitimität. Jedes Vorhaben nennt mindestens zwei Ressourcen und einen Verlierer.
6. **Zugeschnitten auf die Türkei:** Institutionen, Programme, Stätten und Projekte sind die echten (mit Quelle) oder als Spielvorhaben gekennzeichnet; Zahlen sind Spielparameter, wo keine Quelle steht.

## 2. Zwei Ebenen: Maßnahmen und Vorhaben

- **Maßnahmen** (bisher 90, das Politiknetz) sind laufende Stellschrauben mit einer Stufe. Sie bekommen neue Größen der Fachbereiche als Ziel ihrer Wirkung. Damit zeigt die Vorschau „Was folgt daraus?“ und das Handlungsfeld die Fachbereichsgrößen automatisch.
- **Vorhaben** sind einzelne, abzuschließende Dinge: Projekt, Wunder, Reform, Beschaffung, Institution, Doktrin, Sonderrecht. Sie haben Voraussetzungen, Kosten (in mehreren Währungen), Dauer, Baufortschritt und nach Abschluss einen Eintrag im Bestand mit Dauerwirkung.

## 3. Neue Größen im Politiknetz

Alle sind Indizes 0 bis 100 („mehr davon“), regional geführt, mit Trägheit. Startwerte sind Spielparameter; wo eine Zahl belegt ist, steht sie in der Beschreibung.

**Recht** (neues Thema „Recht und Justiz“): Unabhängigkeit der Justiz; Kapazität der Gerichte (Anker: 17 Richter je 100.000 Einwohner, Schnitt 22); Effizienz der Verfahren (Anker: Strafgerichte 228 Tage, Zivilgerichte 231); Befolgung von Urteilen des Verfassungsgerichts und Straßburgs; Überfüllung der Haftanstalten (Anker: etwa 142 %, 433.520 Häftlinge bei 304.956 Plätzen); Ausnahmerecht; Autonomie der Anwaltschaft; Druck aus Straßburg. Vorhanden: Vertrauen in die Justiz, Rechtssicherheit, Korruption, Pressefreiheit, Zivilgesellschaft, Kriminalität.

**Militär** (neues Thema „Streitkräfte“): Einsatzbereitschaft Heer, Luftwaffe, Marine; Modernisierung der Ausrüstung; Rüstungsautarkie; Truppenmoral; Vertrauen in die Offiziersführung (Anker: nach 2016 Entlassung von 40 % bis zwei Dritteln der Generäle, Quellen weichen ab); Abschreckung (abgeleitet). Vorhanden: Streitkräfte (Gesamtstärke).

**Kultur** (neues Thema „Kultur und Erbe“): Erhaltungszustand des Kulturerbes (wird monatlich aus dem Bestand der Stätten je Provinz gesetzt); Nationale Identität und Zusammenhalt; Akzeptanz kultureller und religiöser Vielfalt. Vorhanden: Tourismus, Ansehen, Zivilgesellschaft, Polarisierung, Religiosität.

**Infrastruktur:** Zustand der Anlagen (Wartung). Vorhanden: Straßennetz, Bahnnetz, Stau, Logistik, Internet, Stromversorgung, Wasserversorgung.

**Neue Maßnahmen** (Stellschrauben, nicht Bauvorhaben): Richter- und Staatsanwaltsstellen; Richterrat mit Kollegenwahl; Haftvermeidung und Bewährung; Ausnahmezustand und Sonderbefugnisse; Denkmalschutz und Restaurierung; Kunst- und Kulturförderung; Ausgrabungen und Museen; Rechte religiöser und sprachlicher Minderheiten; Wehrdienstdauer; Ausbildung und Übungen der Streitkräfte; Instandhaltung der Infrastruktur.

## 4. Die drei knappen Größen

| Größe | Quelle | Verbrauch | Defizit |
|---|---|---|---|
| **Verwaltungskraft** (0 bis 100, Vorrat) | Grundeinkommen, Verwaltungsdigitalisierung, Institutionen | laufender Unterhalt je Vorhaben im Bau und je Institution | Bauten kommen nur zur Hälfte voran, Legitimität sinkt |
| **Baukapazität** (Baupunkte je Monat) | Bauindustrie, Industriemodernisierung, Auslandspartner | Baufortschritt und Instandhaltung; Warteschlange mit Priorität; Pausieren kostet keinen Fortschritt | Bauten kommen später voran |
| **Legitimität** (0 bis 100) | Justiz-Unabhängigkeit, Rechtssicherheit, Vertrauen, fertige Wunder | Ausnahmerecht, Willkürereignisse, Bruch von Zusagen | verändert das Politische Kapital je Monat (±1) und bei Werten unter 25 die Kosten von Erlassen |

## 5. Vorhaben

Ein Vorhaben besteht aus: Kennung, Bereich, Klasse (Wunder, Großprojekt, Serie, Restaurierung, Reform, Beschaffung, Institution, Doktrin, Sonderrecht), Name, Text, optional Ort (Breite, Länge, Provinzen), Voraussetzungen (Bedingungen des Programm-Systems, dazu Bestand und Fachbereichswerte), Kosten (Politisches Kapital, Baupunkte, Verwaltungsunterhalt, Haushalt in Prozent des BIP, Mindestmonate), Wirkung bei Abschluss, Dauerwirkung im Bestand (monatlich, nach Zustand skaliert), Kehrseite, Verlierer (Wählergruppe oder Akteur), Astkennung für ausschließende Reformen und Doktrinen, Quelle.

Lebenszyklus: verfügbar, im Bau (Fortschritt), fertig (Bestand mit Zustand), gestört, stillgelegt. Bei Beschaffungen zusätzlich: Vertrag, Fertigung, Lieferung, Einführung, einsatzbereit; Sonderzustände blockiert, eingelagert, verzögert, storniert.

## 6. Die fünf Fachbereiche

### 6.1 Kultur und Erbe (Vorlage: Civilization VI, Victoria 3, Democracy 4)

Bestand: die 53 Stätten der Türkei (`game/src/data/erbe.ts`), je mit Zustand 0 bis 100, Nutzungsmodus und Besucherdruck. Bedrohungen: Verfall, Erdbeben (Antakya), Raubgrabung, Massentourismus (Pamukkale), Nutzungsstreit (Hagia Sophia), Großbau (Hasankeyf). Projekte: Restaurierung, Ausbau (Besucherzentrum, Museum), Ausgrabung, **Serien** mit Set-Bonus und **Wunder**.

Beispiele Wunder und Serien (Wirkungen sind Spielparameter):
- **Kirchenroute der Sieben** (Serie): Ephesos, Smyrna, Pergamon, Thyatira, Sardes, Philadelphia, Laodikeia; Voraussetzung: alle sieben mindestens Zustand 55, die Route gebaut, Ansehen ausreichend; Wirkung: Tourismus, Ansehen, Akzeptanz der Vielfalt; Kehrseite: Konservative.
- **Ephesos-Gesamtplan** (Wunder, vorbildhaft nach dem Programm „Geleceğe Miras“).
- **Wiederaufbau Antakya** (Wunder): Altstadt und Mosaikmuseum; Voraussetzung: Erdbebenvorsorge und Baukapazität.
- **Göbekli-Tepe-Besucherzentrum und Taş-Tepeler-Route** (Wunder und Serie).
- **Ani öffnen** (Wunder): braucht Diplomatie mit Armenien.
- **Seldschukenroute** (Konya, Divriği, Beyşehir, Ahlat), **Sinan-Route** (Süleymaniye, Selimiye).
- **Hagia Sophia: Nutzungsmodus** (Entscheidung mit Folgen für Vielfalt, Ansehen, Konservative), keine Baustelle.

Größen: Erhaltung, Tourismus, Identität und Zusammenhalt, Ansehen, Akzeptanz der Vielfalt. Kopplungen: Zustand hebt Kulturtourismus; Besucherdruck senkt den Zustand; Vielfalt hebt Zusammenhalt und Ansehen und sinkt bei Nutzungsstreit. Ereignisse: UNESCO-Komitee im Juli, Erdbebenschaden, Raubgrabung, Fund, Nutzungsstreit, Pilgerwelle.

### 6.2 Recht und Justiz (Vorlage: Suzerain, Victoria 3, Crusader Kings 3)

Bestand: Institutionen mit besetzten Sitzen (Verfassungsgericht 15 Sitze: 12 Präsident, 3 Parlament; Richterrat HSK 13 Sitze; Kassationshof; Staatsrat; Anwaltskammern; Vollzug) mit Lager und Amtszeit. Reformen kosten Politisches Kapital, Stimmen, Umsetzungszeit und Verwaltungskraft, nie Geld als Hauptkosten. Beispiele: Zielfristen und Leistungsdruck (Effizienz +, Unabhängigkeit −), Richterrat mit Kollegenwahl (Unabhängigkeit +, Steuerbarkeit −), Ausnahmezustand (Durchgriff +, Rechtssicherheit −, Straßburg-Druck +, Legitimität −), mehrere Anwaltskammern (Anwaltsautonomie −, Konfliktereignis), Digitale Justiz (Effizienz +, Verwaltungskraft), Haftvermeidung (Überfüllung −), Umsetzung von Straßburger Urteilen (Befolgung +, Freiheit +, Durchgriff −). Ereignisse: Verfassungsgericht gegen Kassationshof, Straßburg-Urteil, Venedig-Gutachten, Anwaltsmarsch, Haftüberfüllung, Notstandsverlängerung. **Zielkonflikt: Durchgriff gegen Freiheit.**

### 6.3 Streitkräfte (Vorlage: Hearts of Iron IV, Victoria 3)

Bestand: Programme mit Lebenszyklus (KAAN, Eurofighter, F-16 Block 70, F-35 blockiert, S-400 eingelagert, Stahlkuppel, Altay, Drohnenverbund, Anadolu, Fregatten), Einsatzbereitschaft und Modernisierung je Teilstreitkraft, Wehrdienstregler, Personalrunde des Obersten Militärrats (Loyalität gegen Kompetenz), Einsätze im Ausland (Erfahrung, Einfluss gegen Bereitschaft). Doktrinen (drei Äste, ausschließend): Drohnenverbund, mehrschichtige Luftverteidigung, strategische Autonomie gegen Bündnisintegration. Bündnisbindung: Lieferanten (USA, EU, Russland) erwarten etwas; ein Programm kann blockiert, verzögert oder storniert werden. Der Präsident bestellt und verantwortet; er kommandiert nicht.

### 6.4 Infrastruktur und Großprojekte (Vorlage: Victoria 3, Hearts of Iron IV, Tropico, Civilization VI)

Bestand: Marmaray, Osmangazi-Brücke, Istanbuler Flughafen, Hochgeschwindigkeitsbahn (Ankara–Istanbul, –Konya, –Sivas), 1915-Çanakkale-Brücke, Atatürk-Damm und GAP, Bahn Baku–Tiflis–Kars, Stromnetz. Im Bau oder offen: Akkuyu (in Kalttests), Erdbebenwiederaufbau (Versprechensschuld), Kanal Istanbul (umstritten, Aushub nicht begonnen), Ankara–İzmir-Bahn. Netze je Provinz mit Kapazität und Nutzung; Engpass wirkt auf Erreichbarkeit und Versorgung. Wartungszustand sinkt; Instandhaltung bindet Baukapazität. Wunder haben politische Dauerwirkung statt Geldzuschlag (Reisezeit Ost–West, Versorgungssicherheit, Bewässerung, Transitrolle, Ansehen) und belegte Zielkonflikte (Kanal gegen Trinkwasser und Montreux; Ilısu gegen Hasankeyf; BOT-Garantien gegen Handlungsspielraum).

### 6.5 Haushalt und Verwaltung (Vorlage: Democracy 4, Victoria 3, Tropico)

Zeigt die drei knappen Größen (Verwaltungskraft, Baukapazität, Legitimität) mit Quellen und Verbrauch, dazu die Kennzahlen des Haushalts (Schulden, Zins, Lira, Risikoaufschlag) und den Bestand an Sonderrechten und Instrumenten (Preisdeckel bei BOTAŞ, Kreditgarantiefonds, Wohnungsprogramm TOKİ) mit Kehrseite. Kader: die Ministerposten mit Loyalität (schon vorhanden).

## 7. Oberfläche

Neues Fenster **„Reich“** mit Reitern Kultur und Erbe, Recht, Streitkräfte, Infrastruktur, Haushalt und Verwaltung. Jeder Reiter: Kopf mit den Größen (Balken, Trend, woher die Veränderung kommt), Bestand als Kartenraster mit Zustand, Vorhaben mit Kostenchips (Kapital, Verwaltung, Bau, Zeit), Voraussetzungen als Häkchenliste, Wirkung und Kehrseite mit Verlierer, „Beginnen“; im Bau: Fortschritt, Priorität, Pause; Vorteile mit Fortschritt zur Freischaltung. Kulturstätten und Wunder erscheinen als Marken auf der Karte (Kartenebene „Kulturerbe“). **Fertigstellungs-Animation** für Wunder: Vollbildkarte mit gemaltem Wahrzeichen (Silhouette in Bildsprache des Spiels), Zeitraffer des Baufortschritts, Zitat, Datum, Wirkungsliste.

## 8. Anbindung

Ereignisse je Bereich (Vorlagen im bestehenden Motor); Vorschau „Was folgt daraus?“ zeigt Fachbereichsgrößen; Gespräch und KI kennen den Bestand und die Vorhaben (Kontext und Aktionsart „vorhaben“); Bilanz nennt Wunder, Institutionen und Doktrinen; Programme können Vorhaben verlangen.

## 9. Was bewusst vereinfacht ist

- **Gesetzesmehrheit:** Im Spiel braucht ein Gesetz 301 von 600 Stimmen. In der Türkei gilt 301 nur für die Wiederannahme nach Präsidentenveto (Art. 89); sonst genügt die einfache Mehrheit der Anwesenden, mindestens 151 (Art. 96). Die Vereinfachung ist gewollt (lesbare Mehrheitsrechnung), wird aber ausdrücklich genannt.
- **Startzustände** der Stätten, Programme und Institutionen sind Spielparameter, keine Messwerte.
- **Politisch heikle Programme** (Einsätze, Ausnahmezustand) sind als Spielentscheidungen mit ehrlichen Folgen modelliert, nicht als Bewertung.
