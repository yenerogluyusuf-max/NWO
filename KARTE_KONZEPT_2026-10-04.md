# Karte als Bühne: Konzept (04.10.2026)

Auslöser: Rückmeldung zu Kartenebenen-Leiste und Kartengröße, Wunsch nach Animationen wie in Civilization VI, dazu die Lücke bei Krieg, Bündnissen und Ländern (HOI4-Vorbild). Alle Zahlen, die hier als Ziel stehen, sind Zielwerte (Spielparameter), keine Tatsachenbehauptungen.

## 1. Befund (aus Screenshot vom 04.10. und Code)

**Karte zu klein.** Das Gelände ist hart begrenzt: `public/data/relief.json` und `relief-z8.json` decken Länge 19,5° bis 50,5° und Breite 31° bis 46° ab. Das ist die Türkei mit schmalem Rand. Westeuropa, Russland, die Golfstaaten, Nordafrika und Zentralasien liegen außerhalb. Rechts endet die Fläche sichtbar an einer schrägen Kante (Kaspisches Meer abgeschnitten), links verschwinden Namen unter der Menüleiste. Die 41 Akteure des Weltmodells haben dadurch zu zwei Dritteln keinen Ort auf der Karte.

**Ebenen-Leiste (`Stage.tsx` ab Zeile 858, `ebenen.ts`).** Elf gleich aussehende Rundknöpfe ohne Beschriftung in einer breiten Pille, die den unteren Kartenrand verdeckt (Syrien, Israel). Befunde:
- Zwei identische Warndreiecke: „Akute Probleme“ und „Katastrophenrisiko“ nutzen beide `warnung`.
- „Regionen“ und „Politiknetz“ teilen sich das Symbol `netz`.
- Der Name „Wahl 2028“ ist fest eingetragen, das Spiel steht aber im Jahr 2030.
- Man sieht erst nach dem Anklicken, was eine Ebene zeigt.
- Zwei Beschriftungsstufen konkurrieren: Hauptstädte der Nachbarn (Pristina, Skopje, Tirana) stehen fett und groß, türkische Provinznamen klein. Die Rangordnung ist verkehrt herum.

**Animation heute.** Wasserwellen im Gelände-Shader (`scene.ts`), ein Kameraflug (`flight` in `AtlasMap.tsx`), CSS-Puls an Ereignismarken. Sonst steht die Karte still: kein Hover-Effekt auf Provinzen, keine Überblendung beim Ebenenwechsel, keine Bewegung bei Bau, Krieg, Katastrophe oder Wahlkampf.

**Kernproblem.** Die Karte ist Kulisse. In Civ 6 und HOI4 ist die Karte das Spiel: Jede Entscheidung hat dort einen Ort und eine sichtbare Folge.

## 2. Leitbild

1. **Die Karte ist die Bühne, Akten sind Fenster darüber.** Karte immer groß; Akten decken sie nicht dauerhaft zu.
2. **Jede Entscheidung hat einen Ort und eine sichtbare Folge:** Bauvorhaben wachsen, Grenzen verschieben sich, Krisen pulsieren, Truppen bewegen sich, Verträge spannen Linien.
3. **Semantischer Zoom** (Civ-6-Strategieansicht): ganz weit sieht man Blöcke und Kriege, auf Länderebene Staaten und Fronten, auf Landesebene die 81 Provinzen, ganz nah Bezirke und Bauten.
4. **Ruhig im Leerlauf, lebendig bei Anlass.** Keine Dauerlast: Die Karte darf den Rechner nicht auslasten (Lag-Beschwerde vom 04.10.). Ambiente läuft mit wenigen Bildern pro Sekunde, volle Bildrate nur bei Eingabe oder Ereignis.

## 3. Umfang der Karte (drei Stufen)

| Stufe | Raum | Auflösung | Zweck |
|---|---|---|---|
| Kern | Türkei samt Rand (heutiges Relief, Zoom 8) | wie heute | Provinzen, Bezirke, Bau, Katastrophen |
| Umfeld | etwa Westeuropa bis Zentralasien, Nordafrika bis Russland (Zielraum, in der Umsetzung zu prüfen) | mittel | Nachbarn, EU-Staaten, Golf, Kaukasus, Fronten |
| Welt | ganze Welt, flach | grob | BRICS, USA, China, Blöcke; Vorbild Strategieansicht |

Technik (Zielvorgabe): Zwei Höhentexturen im Gelände-Shader (grobes Basisrelief für die Welt, hoch aufgelöster Kern oben drauf), Netz mit Entfernungsstufen, Ränder weich in Nebel und Meer auslaufend, nie eine harte Kante. Neues Datenvolumen begrenzt (Ziel: höchstens etwa 40 MB zusätzlich, gzip wo möglich), Quellen wie bisher: AWS Terrain Tiles (Gelände), Natural Earth 10m (gemeinfrei; Länder und, für Kriegsschauplätze, Verwaltungsgebiete der Stufe 1).

Regionen anderer Länder gibt es nur für **Kriegsschauplätze** (zunächst Syrien, Irak, Ägäis mit Zypern, Südkaukasus), nicht für alle 41 Akteure. Grund: jede Region braucht eine Quelle, und nur dort braucht das Spiel Teilgebiete (Kriegsziele, Besatzung, Annexion).

## 4. Linsen statt Leiste

Aus der Rundknopf-Reihe wird eine **Linsenwahl** nach Civ-6-Vorbild:
- Ein einziger Knopf unten links zeigt die aktive Linse mit Name; Klick öffnet eine Tafel nach oben mit **beschrifteten Kacheln in Gruppen**: Land (Politisch, Regionen, Wahl und Lager, Rückhalt), Wirtschaft (Wirtschaftskraft, Arbeitslosigkeit, Infrastruktur), Krisen (Akute Probleme, Katastrophenrisiko), Kultur (Kulturerbe), Welt (Beziehungen).
- Tastenkürzel 1 bis 9, Esc schließt.
- **Linsen erscheinen nur, wenn sie etwas zeigen:** „Front und Besatzung“ bei einem Krieg, „Bündnisse“ sobald Pakte existieren, „Wahlkampf“ in der Kampagnenphase, „Lage nach Beben“ bei einem Fall.
- Legende klappt an der Tafel auf; im Leerlauf bleibt nur der Knopf.
- Jede Kachel zeigt eine Vorschau (kleiner Farbstreifen der Legende), eindeutiges Symbol, Kurzsatz „Was zeigt das?“.
- Der Name „Wahl 2028“ wird dynamisch (nächste Wahl bzw. letzte Wahl).

Gleichzeitig wird die Rahmung der Karte freier: schmalere Kopfleiste, kleineres Wappenschild „Türkiye“, Meldungs-Chips nicht über Kartentexten, Beschriftungs-Rangordnung (eigenes Land vor Nachbarn, Hauptstädte klein).

## 5. Animationssprache (Civ-6-Vorbild)

Gruppiert nach Wirkung; jede Gruppe wird mit einer Bildraten-Obergrenze und einem Schalter „Effekte: Hoch, Mittel, Aus“ gebaut (Systemeinstellung „Bewegung reduzieren“ wird respektiert).

**Kamera.** Geglättete Flüge mit Beschleunigung und Abbremsen, Bogen (kurz herauszoomen, dann hinein), Trägheit beim Ziehen und Zoomen, weiches Anstoßen am Kartenrand. Ereigniskamera: bei Beben, Anschlag, Kriegsausbruch fliegt die Kamera hin (abschaltbar), bei Beben kurzes Zittern.

**Gelände.** Schaumsaum an Küsten, Wolkenschatten, die langsam ziehen, Jahreszeit nach Spieldatum (Schnee auf Höhen im Winter, frisches Grün im Frühling), leichter Tageston. Wasser wie heute, aber mit Strömungsrichtung.

**Grenzen und Flächen.** Beim Ebenenwechsel Überblendung der Farben (etwa 400 ms) statt Sprung. Grenzen werden wie mit Tinte gezogen, wenn sie sich ändern (Annexion, Besatzung). Auswahl und Hover: Provinz hebt sich leicht, Randlicht, goldener Umriss, der atmet. Front als lebende Linie (Strichlauf).

**Marken und Bauten.** Einblenden mit kleiner Federung, leises Schweben an Bannern, Bauvorhaben mit Gerüst und Kran, Fertigstellung mit Funken und Ring. Banner der Städte zeigen Fortschritt (Bau, Krise) als Füllstand.

**Weltgeschehen.** Konvois und Schiffe auf Handelsrouten, Flugzeuge auf Diplomatenreisen, Truppenpfeile an der Front, Wahlkampfreise der Präsidentenmaschine mit Kundgebungsmarken, verdeckte Operationen als dünne Linien, nur in der Dienst-Linse sichtbar.

**Fenster und Zahlen.** Akten öffnen wie entfaltetes Papier, Zahlen zählen hoch, Entscheidungen werden gestempelt, der Monatswechsel bekommt eine kurze Blende.

**Ton** (später, Audio fehlt heute vollständig): Klicks, Papier, Ambient je Linse, Stinger bei Großereignissen.

## 6. Spielsysteme auf der Karte (Wechselwirkungen)

- **Krieg:** Frontzahl pro Gegner wird Front je Region, Truppenpfeile, Besatzungsstatus; Friedenskonferenz verteilt Regionen.
- **Annexion:** Besitzer einer Fläche wird änderbar; die Karte färbt nach der Tinten-Animation um. Folgen: Integrationsphase (Kosten, Unruhe, Wähler), Ansehensverlust, Sanktionsrisiko.
- **Bündnisse:** Pakte als Objekte (Mitglieder, Klausel, Auslöser); die Bündnis-Linse färbt Blöcke und zieht Linien. Kriegseintritt der Partner hängt an Bündniswert, Vertrauen und Rahmung; Beistandsruf an die Türkei ist eine Entscheidung mit Preis auf beiden Seiten.
- **Drittkriege:** Kriege zwischen anderen Staaten entstehen im Weltmodell, ziehen Pakte hinein, wirken auf Preise, Flüchtlinge und Vermittlung.
- **Katastrophen, Bau, Wahlkampf, Dienst:** je mit Ort und Bewegung (siehe 5).
- **Alles bleibt speicherkompatibel:** neue Zustandsfelder immer mit Vorgabewert beim Laden (`??=`), damit bestehende Spielstände weiterlaufen.

## 7. Phasenplan

**Welle 1 (parallel, ohne gemeinsame Dateien)**
- A. Linsenwahl, Beschriftungsrang, Rahmung (Besitz: `Stage.tsx`, `ebenen.ts`, Symbole, Legende, `styles.css`-Teile).
- B. Weltkarte: Datenaufbereitung, Mehrstufen-Gelände, weiche Ränder, Pins und Flächen für alle 41 Akteure (Besitz: `tools/geodaten`, `public/data/*`, `atlas/*`).
- C. Pakte und Drittkriege in der Simulation (Besitz: `sim/pakte*.ts`, `sim/krieg*.ts`, `sim/welt-*.ts`, Tests).

**Welle 2** (baut auf Welle 1): Animationssprache (Gruppen aus Abschnitt 5), Regionen und Annexion, Front-, Besatzungs- und Bündnislinse, Krieg als eigener Reiter mit Friedenskonferenz.

**Welle 3:** Weltgeschehen auf der Karte (Konvois, Reisen, Truppen), Ton, Feinschliff der Fenster.

Abnahmekriterien Welle 1:
- Keine harte Kartenkante bei jedem erlaubten Zoom und Schwenk.
- Mindestens die 41 Akteure des Weltmodells haben Fläche und Pin.
- Alle 12 Ebenen weiter funktionsfähig.
- Linsenwahl: keine doppelten Symbole, jede Kachel beschriftet, Kürzel gehen.
- Alte Spielstände laden weiter (Test mit `~/Downloads/staatsraeson_2029-11-20.json` als Lesezugriff in isoliertem Profil).
- Gesamte Testsuite grün, `tsc` ohne Fehler.
- Leerlauf-Last der Karte nicht höher als heute.

## 8. Risiken

- **Rechenlast:** Mehr Fläche und mehr Bewegung können den Lag verschlimmern. Gegenmittel: Bildraten-Obergrenzen, Rendern nur bei Bedarf, Qualität sinkt automatisch.
- **Datenmenge:** Gelände für die Welt kann groß werden. Gegenmittel: grobes Basisrelief, Kernausschnitt nur wie heute, gzip.
- **iCloud:** Das Projekt liegt im synchronisierten Schreibtisch; große neue Dateien können zu Platzhaltern werden. Verschieben nach `~/Projekte` bleibt empfohlen.
- **Laufende App:** Die installierte App enthält den alten Stand. Neubau erst, wenn die App geschlossen ist (sie sichert beim Beenden), und nur auf Anweisung.
