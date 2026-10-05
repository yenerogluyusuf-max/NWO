# KI als Projektplaner, gebaute Infrastruktur auf der Karte, Fortschritt im Vergleich (05.10.2026)

Wünsche des Projektinhabers (wörtlich eingeordnet):

1. **Geografisch-optische Veränderungen:** Was man baut, wächst sichtbar auf der Karte — „man kann ja bis ins Detail zoomen, zum Beispiel bei Autobahnen".
2. **KI schlägt kluge Projekte vor:** „Lass uns eine Verbindung zwischen der Autobahn Ankara–İstanbul und der von İstanbul–İzmir machen, in der Mitte" — zusammengesetzte Projekte mit Sinn (Neuer Hafen in Trabzon, Schiffsrouten im Schwarzen Meer, mehr Handel), im Spiel angezeigt, und beim Umsetzen werden die Effekte direkt berechnet. Mehrere Projekte gleichzeitig.
3. **Fortschritt wie bei Civ:** sichtbar, wie viel Geld das Land verdient, ein Wissenschaftsstrang, und wo man im internationalen Vergleich steht.

Zahlen in „Soll" sind Spielparameter (Kalibrierung), keine Tatsachenbehauptungen. Aussagen über die Wirklichkeit sind „zu prüfen", bis sie im Quellenregister belegt sind.

---

## 1. Was schon da ist (Belege)

| Baustein | Stand | Ort |
|---|---|---|
| Echte Straßen auf der Karte | Autobahn (Klasse 0) bis Nebenstraße aus OSM-Daten werden gezeichnet, dazu Punkte für Hafen, Flughafen, Kraftwerk, Staudamm, Krankenhaus | `ui/atlas/vector.ts:63,856,895` |
| Bau-Marken | Vorhaben je Provinz erscheinen als Baustellen-Marke am Stadt-Banner | `ui/atlas/staedte.ts:97,106`, `ui/atlas/marken.ts:20` |
| Freie Großprojekte | Freie Eingabe → regelbasierter Interpreter (Typ, Ort/Strecke, Maßstab) → Schätzung in drei Ebenen → Entwurf → Beginn mit Vergabe → Zweitrundeneffekte; Grenzübertritt wird Verhandlungsserie | `sim/grossprojekt.ts:1-15,232,471,665,690` |
| KI-Aktion „großprojekt" | Das Sprachmodell kann im Chat bereits einen freien Projektentwurf anstoßen (Aktionstyp existiert, Prüfpfad vorhanden) | `ki/aktionen.ts:20,100,240` |
| Verwaltungskraft | Bestand im Reich, begrenzt gleichzeitige Vorhaben | `sim/reich.ts`, `data/reich/index.ts` |
| Weltbank-Vergleich | Ländervergleich je Land in der Welt-Akte; Vergleichsdaten als JSON | `sim/laender.ts`, `data/vergleich.json` |
| Tinten-Animation | Besitzerwechsel färbt Gebiete weich über (API gebaut, für Krieg) | `ui/atlas/tinte.ts` |

**Die Lücke:** Die Karte zeigt den *Startbestand* (statisch) und *dass* irgendwo gebaut wird (Marke) — aber nicht *was* entsteht, nicht *wohin es wächst*, und nicht den *Vergleich*, wie das Land durch das Neugebaute besser wird. Und die KI schlägt nur vor, wenn der Spieler sie im Chat fragt — sie planert nicht von sich aus.

## 2. Baustein A — Gebaute Infrastruktur als Kartenobjekte

**Grundsatz:** Alles, was der Staat baut, bekommt ein eigenes Kartenobjekt mit Fortschritt. Der OSM-Bestand bleibt der Untergrund; das Spiel zeichnet *darauf* das Neugebaute.

- **Datenmodell:** Jedes Vorhaben mit Strecke bekommt eine Route aus Provinzknoten (Provinzhauptstadt zu Provinzhauptstadt, später geglättet über die OSM-Autobahn-Knoten der Provinzen). Hafen, Flughafen, Kraftwerk, Staudamm, Brücke sind Punkte am Ort; Bahn und Autobahn sind Linien; Schiffsrouten sind Linien auf Wasser.
- **Zustand als Sichtbarkeit:** Das Objekt beginnt als **gestrichelte Planlinie** (Entwurf), wird zur **gestrichelten Baustelle mit Kran-Marken** an den Teilstücken und füllt sich mit dem Baufortschritt von Ende zu Ende (Autobahn wächst von Ankara Richtung İzmir, nicht überall gleichzeitig). Bei Eröffnung: kurze Szene (wie die Wunder-Szene) mit Kamerafahrt und Zitatzeile. Verspätung und Kostenüberschreitung aus der Vergabe (`Vergabe` in `grossprojekt.ts`) zeigen sich sichtbar: langsames Wachsen, Kran steht still bei Finanzierungslücke.
- **Zoomstaffelung:** Weit (Weltkarte) — Häfen und Großprojekte als Punkte, Korridore als dicke Linien; Mittel (Türkei) — Autobahnen und Bahnen klar unterscheidbar, Namensbanner beim Hover; Nah (Provinz) — das Einzelobjekt mit Baustellen-Details (Fortschrittsring, Firma, Frist). Die Zoomstufen der Karte (`scene.ts`) schalten die Objektebenen schon heute um; das Neubaunetz reiht sich ein.
- **Härte des echten Lebens:** Die Firma in der Vergabe entscheidet das Tempo (Freihändig = schneller, aber Korruptionsrisiko, das als sichtbare Makel am Objekt enden kann); Einweihung vor der Wahl ist möglich, aber das Objekt bleibt im Zustand „halb" und fällt in der Kritik der Presse auf. Verlierer (Anrainer, verdrängte Betriebe) stehen am Objekt, nicht nur im Bericht.
- **Wo es hängt:** `ui/atlas/` bekommt eine neue Objektebene `neubau` (Datenquelle: laufende `FreiEintrag`- und Reich-Vorhaben im `World`), `marken.ts` bleibt für Punkte, die Linien-Ebene zeichnet selbst.

## 3. Baustein B — KI als Projektplaner (proaktiv, geprüft)

**Grundsatz (unverändert gültig):** Die KI erfindet **keine Zahlen und keine Wirkungen**. Sie schlägt Vorhaben als *Text* vor; der regelbasierte Interpreter (`interpretiere` + `schaetze`) rechnet Typ, Ort, Kosten, Dauer, Gewinner, Verlierer. Der Spieler sieht immer die Sim-Rechnung, nie eine Modellbehauptung.

**Neuer Kanal „Projektvorschläge":**
- **Auslöser:** Am Monatsersten (und auf Anfrage im Chat) prüft das Spiel Kontext und baut daraus den Planungsauftrag: bestehendes Netz (welche Provinzen haben keine Autobahn-Anbindung, wo fehlt ein Hafen, welche Küsten liegen brach), die gewählte Agenda/Ziele, Haushalts- und Verwaltungsspielraum, laufende Projekte, offene Verhandlungsserien.
- **Ausgabe:** Höchstens drei Entwürfe als `FreiEintrag`-Texte („Verbindung der Autobahnen Ankara–İstanbul und İstanbul–İzmir über Bursa: Nord-Süd-Autobahn durch Zentralanatolien"). Jeder wird sofort durch `interpretiere()` und `schaetze()` gerechnet und erscheint als **Vorschlagskarte**: Name, Strecke (auf der Karte als gestrichelte Planlinie mit Kamerafahrt), Kostenband, Dauer, Gewinner/Verlierer, Zweitrundeneffekte, Passung zur Agenda.
- **Entscheidung:** Übernehmen (→ `beginneFrei` mit Wahl der Vergabe), Verwerfen, Später (bleibt im Posteingang mit Frist). Mehrere Projekte parallel sind erlaubt — die Grenze ist die **Verwaltungskraft**, nicht die Technik.
- **Ohne KI-Schlüssel:** Ein regelbasierter Vorschlaggeber füllt denselben Kanal (Lücken-Heuristik: Küstenprovinz ohne Hafen, Provinz ohne Autobahnanschluss, Korridor-Kandidaten aus Distanz und Wirtschaftskraft). Die KI verbessert die *Formulierungen und Kombinationen*, die Rechnung kommt immer aus der Sim. So bleibt der Kanal offline funktionsfähig (Entscheidung: ohne Schlüssel eingeschränkt spielbar).
- **Härte:** Vorschläge sind nicht gut, weil sie von einer KI kommen — sie können Verkehrsillusion sein (25–60 % der Prognose), sich mit laufenden Projekten beißen (Arbeitskräfte, Haushalt) oder an der Grenzverhandlung scheitern. Ein verworfener Vorschlag kommt nicht sofort wieder; das Spiel merkt sich Ablehnungen als Haltung der Planungsbehörde (Kurs-Kapitel im Wirkungsbericht).
- **Wo es hängt:** `ki/aktionen.ts` hat den Typ schon; neu ist der **proaktive** Aufrufpfad (Schreibtisch/Posteingang statt Chat) und die Kontextbaustein-Funktion in `ki/kontext.ts`. Vorschlagskarten ins `ui/schreibtisch/`, Planlinien nach Baustein A.

## 4. Baustein C — Fortschritt und internationaler Vergleich

- **Rangliste statt Einzelvergleich:** Aus `data/vergleich.json` und den Ländersichten wird eine dauerhafte **Ansicht „Rang und Fortschritt"**: BIP je Kopf, Wachstum, Inflation, Handelsvolumen, Tourismus, Ausgaben Forschung, Infrastruktur-Dichte (aus Baustein A: km Autobahn/Bahn je Einwohner), jeweils eigener Wert, Wert vor drei Jahren, Platz unter den Vergleichsländern und Abstand zum EU-Durchschnitt als Zielbalken. Einmal im Jahr zieht das Spiel eine **Bilanzzeile** („Sie haben Platz 5 um zwei Plätze verloren") in den Wirkungsbericht.
- **„Wie viel Geld macht das Land":** Die Haushalts- und Handelszahlen der Wirtschaftsakte bekommen auf dem Schreibtisch eine Kachel mit dem Monatsergebnis und dem Verlauf — ohne neue Rechnung, nur Sichtbarkeit der vorhandenen Größen.
- **Wissenschaftsstrang:** Das ist Welle F (Forschungsbaum `data/forschung/` liegt als tote Dateninsel). Der Rang „Forschung" in der Vergleichsansicht bekommt seinen Wert erst aus der Verdrahtung von Welle F; bis dahin zeigt die Rangliste den Haushaltsanteil Forschung.
- **Wo es hängt:** Erweiterung von `Welt.tsx` (Modus „Rang") oder eigene Akte unter Wirtschaft; Datenquelle `data/vergleich.json` um Jahresreihen ergänzt (Quellen: Weltbank CC BY 4.0, Belegregel).

## 5. Beispiele, durchgerechnet als Muster

1. **„Verbindung Ankara–İstanbul mit İstanbul–İzmir, in der Mitte."** Interpreter: Typ Autobahn, Strecke Ankara–(Bursa/Kütahya)–İzmir, Maßstab Korridor, Zweitrundeneffekte Agglomeration in den Durchgangsprovinzen, Verkehrsillusion gegen die Prognose, Verlierer: Fernbusunternehmen, Provinzen ohne Anschluss. Realer Anker: Die Autobahnen Ankara–İstanbul, İstanbul–İzmir und Ankara–İzmir existieren in Teilen (Stand und Fertigstellungsgrad gegen Primärquelle zu prüfen); das Spiel rechnet mit seinem Startbestand, nicht mit der Realwelt — die Lücke ergibt sich aus den Kartendaten, nicht aus der Enzyklopädie.
2. **„Neuer Hafen in Trabzon."** Interpreter: Typ Hafen, Küstenprüfung (Trabzon liegt im Küstenset `KUESTE`), Rivale in derselben Küstenregion (Samsun), Zweitrundeneffekt Export in der Region, Gegenreaktion der Nachbarhäfen. 
3. **„Schiffsrouten im Schwarzen Meer."** Typ Verkehr/Handel mit Wasser-Linie; Mehrhandel wirkt auf Export und Tourismus, aber die Meerengen (Montreux) und die Kriegslage im Schwarzen Meer bestimmen das Risiko — verknüpft mit der Außenlage (gebaut 05.10.) und den Konfliktankern. Realer Anker zu Ro-Ro-Linien und Kriegseinwirkung auf die Schifffahrt: zu prüfen.

## 6. Verhältnis zum Vision-Dokument (`VISION_IM_DETAIL_2026-10-05.md`)

- Baustein A gehört zu **0.2 Navigation (Karte als Ebene 1)** und **Abschnitt 8 Land** („Großprojekte … mit Bau auf der Karte" steht dort schon — dieser Baustein konkretisiert es mit Datenmodell und Wachstumsanimation).
- Baustein B gehört zu **Abschnitt 10 Spielfluss (Posteingang)** und ergänzt die KI-Grundsätze aus `ENTSCHEIDUNGEN.md` Block M (Katalog nur geprüfter Aktionen — hier um den proaktiven Pfad erweitert).
- Baustein C gehört zu **Abschnitt 5 Wirtschaft** und **9 Wissen** (Rang „Forschung" wartet auf Welle F).
- Kein Widerspruch zur Reihenfolge 1–8; einzubauen bei 1 (Navigation, Karte), 3 (Ressourcen/Posteingang) und 4–5 (Krieg/Bäume) nach Bedarf.

## 7. Aufwand und Risiken

| Teil | Aufwand | Wichtigste Risiken |
|---|---|---|
| A Kartenobjekte | M: Objektebene + Routen aus Provinzknoten; Animations-API vorhanden | Rechenlast auf der Karte (Lag-Beschwerde vom 04.10.): Objekte nur in den Zoomstufen zeichnen, die sie brauchen |
| B KI-Vorschläge | M: Kontextbaustein, Kanal, Vorschlagskarten; Interpreter und Rechnung stehen | Vorschlagsflut (Bremse wie bei Ereignissen); kalibrierte Plausibilität der Lücken-Heuristik; Kostenkontrolle der Sprachmodell-Aufrufe (ein Aufruf je Monatsersten, Budget-Warnung) |
| C Rangliste | S–M: Ansicht + Jahresreihen in `vergleich.json` | Quellenpflege der Reihen (Weltbank-Zitierformel, Stand datieren) |

Gemeinsam: Texte über `t()` ab Tag 1, Spielstand-Migration (neue Objektlisten bekommen Vorgabewerte beim Laden), Tests (Interpreter- und Karten-Tests erweitern), Messung mit dem Bot.

---

# Zweiter Teil: Der Gedanke weitergedacht — Belastung, Bitten, Berater (05.10., Abends)

Ergänzung des Projektinhabers (sinngemäß): Die KI sieht und analysiert die Daten — Straßen, Wirtschaft, alles — und wirkt wie ein Berater. Das Autobahn-Beispiel steht nur für ein Muster: Irgendwann ist die Autobahn überlastet, und es kommt die Bitte, sie zu erweitern oder eine neue zu bauen, um sie zu entlasten. „Das für alles weiterdenken."

## 8. Das Grundmuster: Nutzung → Überlast → Bitte → Entscheidung

Ein Staat hört nie auf, Baudenkmäler zu brauchen, weil jeder Erfolg die nächste Klemme erzeugt. Aus der Regel:

1. **Nutzung wächst aus dem Spielverlauf.** Wirtschaftswachstum, Handel, Tourismus, Bevölkerung und Bewegungen laden die Bestände: Autobahn, Bahn, Häfen, Flughäfen, Kraftwerkspark, Stromnetz, Staudämme und Wasser, Klinikbetten, Schulplätze, Universitäten, Gerichte, Verwaltung, Wohnung, Breitband. Auslastung ist eine Bestandsgröße je Objekt und je Region, keine Konstante (heute sind Einwohner und BIP je Provinz Konstanten — siehe Abschnitt 8 des Vision-Dokuments; die Auslastung hängt an denselben Anschlüssen).
2. **Überlast erzeugt Reibung im Netz.** Eine Autobahn bei 95 % bremst die Industrieknoten an ihren Anschlüssen, erhöht Unfall- und Abgasgrößen, verteuert den Export; ein überlaufender Hafen schiebt Schiffe vor Anker; ein Gerichts-Backlog frisst Rechtssicherheit; ein Stromnetz an der Grenze macht die Versorgungssicherheit zur Warnung (das Modul dafür ist seit 05.10. da). Die Reibung läuft über die bestehenden Kanten ins Politiknetz — die Konsequenz ist im Spiel zu sehen, nicht nur im Bericht.
3. **Es kommt die Bitte.** Wer den Mangel fühlt, kommt an den Tisch: der Verkehrsminister mit der Vorlage, der Gouverneur der Provinz, die Industrie- und Handelskammer, der Bürgermeister, der Logistikverband, der Tourismusverband — jede mit eigener Forderung und eigenem Eigennutz. Die Bitten sind Vorlagen des Ministerflusses (er wird bereits aus dem Weltzustand abgeleitet, mit Optionen, Nutzen-Zeilen „jetzt/ohne/mit", Für und Wider, `sim/ministerfluss-typen.ts:1-60`). Die Bitte ist im Spiel zu lesen, wer sie stellt und warum.
4. **Bitten widersprechen sich.** Der Logistikverband will die Autobahn breiter; die Anrainer wollen die Umgehung; der Umweltverband will die Bahn; der Finanzminister will nichts. Der Berater stellt den Konflikt dar, er löst ihn nicht.
5. **Die Entscheidung hat ihre Folge — und die nächste Klemme.** Erweitern lädt sich wieder voll (Induzierte Nachfrage: die Prognose der eigenen Schätzung enthält bereits Verkehrsillusion 25–60 %, `sim/grossprojekt.ts`); der Neubau entlastet die alte Strecke, aber kostet Kapital, Verwaltung und Zeit; Steuern auf die Nutzung (Maut) entlastet ohne Bau, kostet Zustimmung; nichts tun ist eine Wahl mit Reibung als Preis. Nach dem Bau kommt der Wirkungsbericht (gebaut für Beschlüsse, `sim/berichte.ts`), und der Berater meldet nach, ob er richtig lag.

Das ist der Motor, der die Partie nie enden lässt: **Jeder gelöste Mangel schafft Nutzung; jede Nutzung schafft den nächsten Mangel.** Nichtstun bleibt möglich, aber es wird sichtbar teuer — genau die Härte, die das Spiel will.

## 9. Indikatoren je Feld (Anwendung auf alles)

Das Muster einmal durch alle Bereiche; Lastquelle heißt: was die Auslastung im Spiel treibt. Zahlen sind Spielparameter.

| Feld | Auslastung zeigt | Lastquelle | Wer kommt mit der Bitte | Beispiel-Entscheidung |
|---|---|---|---|---|
| Verkehr (Autobahn, Bahn) | Fahrt je Trassenkapazität | Wachstum, Handel, Tourismus | Verkehrsminister, Gouverneur, Logistikverbände, Anrainer | Erweiterung, Umgehung, Parallelstrecke, Maut, Bahn statt Straße |
| Hafen | Container und Schiffe je Kaikapazität | Export, Import, Nachbarn | Hafenverwaltung, Reeder, Küstenregion | Neubau (Trabzon), Erweiterung, Schiffsrouten, Konkurrenz zur Nachbarstadt |
| Flughafen | Passagiere je Kapazität | Tourismus, Geschäftsverkehr | Flughafenbetreiber, Tourismusverband | Neuer Terminal, zweite Landebahn, Slots verknappen |
| Energie (Netz, Erzeugung) | Spitzenlast gegen Erzeugung und Leitungskapazität | Industrie, Klimaanlagen, E-Mobilität | Verteilnetzbetreiber, MB, Industrie | Kraftwerk, Speicher, Leitungen, Effizienz, Import über Nachbarn |
| Wasser, Staudämme | Füllstand gegen Bedarf | Bevölkerung, Landwirtschaft, Dürre | Provinzen, Bauernverbände, Hydraulikbehörde | Staudamm, Bewässerung, Entsalzung, Einsparung |
| Gesundheit | Betten und Personal je 1.000 Einwohner | Alterung, Pandemie, Migration | Gesundheitsminister, Ärztekammer, Provinz | Klinikbau, Personalrekrutierung, Privatisierung, Wartelisten |
| Bildung | Klassengröße, Hochschulplätze | Bevölkerung, Zuwanderung | Bildungsminister, Eltern, Hochschulen | Schulbau, Lehrereinstellung, Universitätsstandorte |
| Justiz | Verfahren je Richter (Backlog) | Kriminalität, Investitionen, Reformen | Justizminister, Anwaltskammer, Wirtschaft | Neue Gerichte, Richtereinstellungen, Digitalisierung, Schnellverfahren |
| Verwaltung | Vorgänge je Beamter | Regulierungstiefe, Bauvorhaben, E-Government | Alle Ressorts zugleich (Verwaltungskraft ist gebaut) | Einstellungen, Digitalisierung, Aufgaben streichen |
| Wohnen | Leerstand gegen Nachfrage, Mieten | Landflucht, Migration, Zins | Städte, Mieterverbände, Bauwirtschaft | Wohnungsbau, Sanierung, Erdbebensanierung, Mietdeckel |
| Landwirtschaft | Wasserrechte, Bodenpreise | Dürre, Export, Subventionen | Bauernverbände, Provinz | Bewässerung, Umstellung, Subvention umbauen |
| Umwelt | Abwasser, Müll, Luftwerte | Urbanisierung, Industrie, Tourismus | Kommunen, Umweltverbände, Anrainerstaaten | Kläranlage, Recycling, Grenzwerte |
| Digital | Breitbandabdeckung, Rechenleistung | Wirtschaft, Staat, Kultur | Technologiebranche, Universitäten | Glasfaser, Rechenzentrum, 5G, Satellit |
| Militär | Ausrüstungsgeneration, Bereitschaft | Bedrohungsgefühl, Bündnisse, Krieg | Generalstab, Rüstungsindustrie | Beschaffung, Modernisierung, Doktrin (Welle K) |
| Tourismus | Bettenkapazität, Saisonauslastung | Auslandsnachfrage, Wechselkurs | Region, Hotelverbände, Flughäfen | Resort-Infrastruktur, Natur schützen, Saisonausgleich |

Diese Tabelle ist die Lücken-Heuristik aus Baustein B in ausgebaute Form: Der regelbasierte Vorschlaggeber liest dieselben Auslastungsstände; die KI formuliert und kombiniert daraus die Bitten und Entwürfe.

## 10. Die Beraterrolle: ein Amt, kein Werkzeug

**Abgrenzung zur Mentorin.** Die Mentorin erklärt (Lernschicht, Regelwerk, `ui/mentor.ts`); sie ist neutral und weiß alles. Der Berater ist eine **Spielfigur der Strategie**: Er liest den Zustand, priorisiert, hat Interesse und wird an seinem Rat gemessen. Er ist die Rollenfassung der Idee „KI wirkt wie ein Berater".

- **Was er sieht:** derselbe Zustand wie die Sim — Auslastungen und Trends der Abschnitte 8–9, Netzlage, Haushalt, Agenda, laufende Vorhaben, Bitten der Institutionen. Der Kontext-Baustein für das Sprachmodell (`ki/kontext.ts`) wird um die Auslastungs- und Bitten-Zeilen erweitert; ohne Schlüssel liest der regelbasierte Briefing-Aufbau (Fachstab, `ui/schreibtisch/briefing.ts`) dieselben Daten.
- **Was er liefert:** ein monatliches **Berater-Briefing** (fester Punkt im Posteingang): die drei bis fünf Dinge, die zählen, mit Begründung in Worten („die O-4 läuft bei 96 %, das bremst die Industrialisierung der Provinz Bursa; wenn nichts passiert, verlieren wir nächstes Jahr…" — *Begründung als Text, Zahl als Sim-Ausgabe*), jeder Punkt als Karte mit Vorschau und Weg. Er gewichtet gegen die Agenda des Spielers und sagt offen, wenn zwei Ziele sich beißen.
- **Ehrlichkeit eingebaut:** Er kann von **nicht bauen** abraten (Verkehrsillusion, Haushaltslage, Alternative günstiger), und sein Rat unterliegt dem Wirkungsbericht: Der Berater bekommt ein **Lagerbuch** — richtig gelagene Punkte stärken sein Gewicht, Fehleinschätzungen schwächen es (Spielparameter). Der Spieler kann ihm folgen, ihn ignorieren oder entlassen; ein enttäuschter Berater geht mit Abrechnung (Figurensystem, Abschnitt 2 des Vision-Dokuments).
- **Mehr als einer, später:** Wirtschaftsberater, Sicherheitsberater, Innenberater mit eigenen Gewichten und leichten Eigeninteressen (der Sicherheitsberater sieht Sicherheitsprobleme auch, wenn sie klein sind). Im ersten Bau: einer.
- **Kosten:** Ein Sprachmodell-Aufruf je Monatsersten (derselbe Rhythmus wie die Projektvorschläge aus Baustein B), Budget-Warnung, Offline-Ausweichpfad über das Regelwerk. Der Rat ist nie ein simulated Resultat: Was der Berater behauptet, prüft sich über Vorschau und Wirkungsbericht gegen die Rechnung der Sim.

## 11. Was das für Reihenfolge und Baustufen heißt

- Baustein A (Kartenobjekte) bekommt eine zweite Datenrolle: jedes Objekt trägt seine **Auslastung**, und die Karte bekommt die Linse „Belastung" (grün über gelb nach rot auf Straßen, Bahnen, Häfen) — die Karte wird zur Diagnosefläche, nicht nur zur Bühne.
- Baustein B (Projektvorschläge) und Abschnitt 10 (Berater) sind **eine Baustufe**: derselbe Kanal, derselbe Rhythmus, dieselbe Prüfkette — die Vorschlagskarte ist der Beraterratschlag mit Entwurf; die reine Priorisierung ohne Entwurf ist der Rest des Briefings.
- Die Bitten hängen an den **Ministerfluss** (er existiert und leitet bereits Vorlagen aus dem Zustand ab): neue Vorlagenquellen „belastung" und „institution"; die Auslastungsgrößen hängen an die vorhandenen Netzanschlüsse (Wirtschaft, Tourismus, Bevölkerung) statt an neue Simulationen.
- Keine neue Monatsrechnung nötig: Die Auslastung folgt denselben Treibern, die die Wirtschaft schon rechnet (Wachstum, Handel, Tourismus, Bevölkerungsbewegung); sie ist ein Ausdruck des Weltzustands, kein zweites Modell daneben.

## 12. Härte, die dadurch entsteht

- **Erfolg erzeugt Kosten.** Wer die Wirtschaft ankurbelt, überlastet Straßen, Netze, Gerichte — die Rechnung des Wachstums kommt mit ein bis drei Jahren Verzug als Bitten und Reibung. Das löst das Audit-Problem „Erfolg ohne Gegenkraft" (Sättigung auf 100) auf mechanischem Weg.
- **Induzierte Nachfrage ist ehrlich.** Die Schätzung warnt vor der Illusion, aber der Spieler darf sie trotzdem bauen; die Vollfahrten kommen trotzdem — und dann die Bitte um die nächste Erweiterung. Wer die Falle kennt, weicht auf Bahn, Maut oder Regionalpolitik aus; Wege statt Verbote.
- **Der Berater ist kein Orakel.** Sein Buch hat Richtig und Falsch; ein Berater, der nur Recht behält, wäre ein Spielausweis. Kalibriert wird er an derselben Messung wie die Bot-Läufe.
