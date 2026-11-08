# Spezifikation D: Außen, Sicherheit, Medien und die Karte (5. November 2026)

## Grundlage und Geltung

- **Grundlage:** Kritik D (`kritik-D.md`, Bilder 051–065, k00–k-v, m01, p01), PLAN_OBERFLAECHE_2026-11-05.md (Abschnitte 2 und 3) und ENTSCHEIDUNGEN W:
  - 17 Ministerien.
  - Ein Weg zum Gesetz (die Maßnahme).
  - Karte als Bühne für Land, Außen und Sicherheit.
- **Pfade:** Alle Pfade gelten relativ zu `/home/user/NWO/game/src`, außer `test/…` (relativ zu `/home/user/NWO/game`).
- **Richtwerte:** 1440×900 px, Kopfleiste 56 px.

**Was ENTSCHEIDUNGEN W für diesen Teil heißt:**

| Entscheidung | Folge hier |
|---|---|
| 17 Ministerien | Außen gehört zum **Ministerium des Äußeren** (Figur-Amt `aussen`). Sicherheit hat zwei Ressorts: **Verteidigung** (neues Amt, siehe Simulationsbedarf) und **Inneres** (Polizei und Gendarmerie, Grenzschutz). MİT und Cyberabwehr stehen in `data/behoerden.ts` heute unter `ressort: "praesidialamt"`. Sie bleiben dort, weil sie kein Ministerium sind; die Anzeige lautet „untersteht dem Präsidenten“. Medien haben kein Ministerium. Zuständig sind Präsidialamt (Amt `stab`) und Inneres. Die Rundfunkaufsicht ist keine Figur (offene Frage 4). |
| Ein Weg zum Gesetz | Jeder Regler in diesen Ansichten ist eine **Maßnahme** aus `data/politiknetz.ts`. Gestellt wird über dieselbe Zeile wie in der Maßnahmentafel (`ui/politik/MassnahmenTafel.tsx` mit `pruefeVorhaben`, `bringeEin` in `sim/handeln.ts`). Es gibt keinen eigenen Gesetzesweg und keine Sonderregler. |
| Karte als Bühne | Außen, Sicherheit (und Land, Teil C) öffnen als **Seitenakte rechts neben der lebenden Karte** (Ansicht 1). Medien bleiben eine Papierakte über der Karte, weil sie kein Ort sind. |

**Ansichten dieses Teils:** 1 Bühne › Seitenakte (Architektur) · 2 Außen › Welt · 3 Außen › Länderkarte (Drill-down) · 4 Sicherheit › Lagekarte · 5 Sicherheit › Streitkräfte & Bau · 6 Medien › Medien · 7 Karte › Acht Linsen · 8 Karte › Tasten, Zeit, Pause · 9 Karte › Provinzkarte · 10 Karte › Ebenenordnung. Danach folgen Fehlerliste und offene Fragen.

---

#### Bühne › Seitenakte (Architektur, gilt für Außen, Sicherheit und Land)

1. **Frage und Erfolg**
   - **Frage:** „Wo auf der Karte passiert das, worüber ich gerade entscheide?“
   - **Erfolg:** Bei offener Akte Außen oder Sicherheit bleibt ein zusammenhängendes Kartenfeld von mindestens 760 × 740 px sichtbar und bedienbar (klicken, ziehen, zoomen). Jede Auswahl in der Akte bewegt die Karte und umgekehrt, ohne dass die Akte schließt.

2. **Aufbau (Zonen) bei 1440×900**

   | Zone | Lage | Größe | Inhalt |
   |---|---|---|---|
   | K | oben | 0–56 px | Kopfleiste (unverändert) |
   | M | unter der Kopfleiste | 60–96 px | Meldungschips, links ab x = 80 |
   | N | links | x 12–64 | Navigation als **Symbolleiste** (48-px-Knöpfe, Namen beim Darüberfahren). Sie klappt automatisch ein, solange eine Seitenakte offen ist. Die heutige Breite 200 px gilt nur ohne Seitenakte. |
   | B | Mitte | x 76–864, y 60–900 | **Bühne**: die Karte mit der Linse der Akte |
   | L | unten in der Bühne | x 76–864, y 836–888 | Linsenleiste (Ansicht 7) |
   | S | rechts | x 872–1428, y 64–888 | **Seitenakte**, 556 px breit, eigener Bildlauf |

   - **Breiten:** Zwischen 1100 und 1365 px Fensterbreite ist S 40 vw breit (mindestens 440 px). Unter 900 px wird S ein Bodenblatt mit 55 % der Höhe; die Karte bleibt darüber sichtbar (heutiges Handy-Verhalten der `.dossier`, nur von unten).
   - **Erste Bildschirmhöhe von S:** Aktenkopf mit Titel, 3 Kennzahlen und Porträt (≤ 96 px), danach der Inhalt der Ansicht. Die Seitenakte hat keine Reiter. Die Zugänge der Akte (heute `zugaenge` in `ui/akte/Akte.tsx`) stehen als 2–3 Umschalter im Kopf.

3. **Inhalte je Zone und Technik**
   - **Stage:** `ui/Stage.tsx` Zeile 902–1140 rendert heute jede Akte als `<section className="dossier frame …">` über der Karte (`styles.css` Zeile 241: `left: 86px`, `z-index: 50`, `.wide` = `min(1160px, 100vw − 110px)`). Neu:
     - Eine Tabelle `BUEHNEN: Partial<Record<BereichId, BuehnenDef>>` in einer neuen Datei `ui/buehne/buehnen.ts`.
     - Eintrag `aussen` → Linse `welt`, Kamera „Weltausschnitt“.
     - Eintrag `sicherheit` → Linse `lage` (neu, Ansicht 7), Kamera „Schauplatz des schwersten Konflikts“ aus `SCHAUPLATZ_NACH_LAND` (data/schauplaetze.ts) oder, ohne Konflikt, die Türkei (`START_D = 15`, ui/atlas/AtlasMap.tsx Zeile 140).
     - Eintrag `land` → Linse `bau` (Teil C).
     - Ist `gruppe.akte` in `BUEHNEN`, rendert Stage statt `<section className="dossier">` ein `<aside className="seitenakte">` mit demselben Kind (`BereichsAkte` aus `ui/akte/Bereiche.tsx` im Modus `seite`).
   - **Linse beim Öffnen und Schließen:** `oeffneDossier` (Stage.tsx Zeile 666) merkt sich vor dem Öffnen die laufende Linse (`ebeneVorher`) und setzt `setEbene(BUEHNEN[b].ebene)`. Beim Schließen setzt es `ebeneVorher` zurück.
   - **Karte bleibt lebendig:** `AtlasMap` bekommt `sparsam={!!dossier && !istBuehne}` (heute Stage.tsx Zeile 810: `sparsam={!!dossier}`).
   - **Sichtrand:** Neue Eigenschaft `sichtRand={{ links, oben, rechts, unten }}` an `AtlasMap` und `Karte2D`. Damit zentriert `starteFlug` (AtlasMap.tsx Zeile 512) auf die Mitte des freien Feldes statt auf die Fenstermitte. Heute wird das von Hand verschoben (Stage.tsx `waehleTransport`: `lon + 2`); diese Verschiebung entfällt. `UI_SPERREN` (AtlasMap.tsx Zeile 144) bekommt `.seitenakte`, damit Beschriftungen ausweichen.
   - **Klicks auf der Karte bei offener Seitenakte:**
     - Provinzklick öffnet die Provinzkarte in Zone B (Ansicht 9).
     - Länderklick (`onLand`) öffnet bei Außen die Länderkarte **in S** statt des schwebenden `LandPopover` (Stage.tsx Zeile 1295). Bei anderen Akten bleibt das Popover.
     - Klick auf eine Konflikt- oder Zielraumfläche wählt bei Sicherheit den Konflikt in S.
   - **2D-Ersatzkarte:** `ui/atlas/Karte2D.tsx` bekommt heute nur `fill`, `selected`, `laenderFarben`, `onLand` und `krieg` (AtlasMap.tsx Zeile 1335). Für die Bühne braucht sie zusätzlich:
     - `labels` (Provinznamen ab der Breite, die das freie Feld erlaubt).
     - `laenderPins` (LAND_PINS, ui/ebenen.ts Zeile 459).
     - `linien`, `ringe` und `sichtRand`.
     - `rahmen` für den Weltausschnitt. Datenlücke: `data/nachbarn.json` endet bei 17,5–52,5° O und 29–48° N (Karte2D.tsx Zeile 19). Für den Weltausschnitt in 2D fehlen Ländergrenzen. Mögliche Quelle: dieselbe Weltgeometrie wie die 3D-Karte (`public/data/karte/karte-W0.bin`/`W1.bin`, Format prüfen) oder Natural Earth 1:110m (gemeinfrei). Bis dahin zeigt 2D ferne Mächte nur als Flaggenleiste (Ansicht 2, Zone B3).

4. **Zustände**
   - **Ohne Spiel** (`!w.spiel`): Es gibt keine Seitenakte, die Navigation zeigt die Bereiche gesperrt (wie heute).
   - **Normal:** wie oben.
   - **Ereignisfenster offen:** Die Seitenakte bleibt stehen, das Fenster liegt darüber (Ebene 80, Ansicht 10).
   - **Krieg:** Die Sicherheit öffnet direkt im Kriegsplan (Ansicht 4, Zustand Krieg).
   - **Handy:** Bodenblatt; die Karte reagiert über dem Blatt.

5. **Klicks**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Navigation: Außen, Sicherheit, Land | Klick | Seitenakte öffnet; Linse und Kamera wechseln; Zeit hält an (wie heute `beendeZeit` in `oeffneDossier`) | S + B |
   | Navigation: anderer Bereich | Klick | Seitenakte schließt; Papierakte öffnet | Vollakte |
   | × in der Seitenakte / Esc | Klick / Taste | schließt; Linse kehrt zu `ebeneVorher` zurück | Karte |
   | Karte ziehen oder zoomen | Maus | Die Karte bewegt sich, die Akte bleibt | B |
   | Eintrag in S, der einen Ort hat | Klick | Die Kamera fliegt hin (`setKamera`), der Ort pulsiert 2 s | B |

6. **Übernommen / gelöscht**
   - **Umgebaut:** `ui/Stage.tsx` (Dossier-Block Zeile 902–1140, `oeffneDossier`, Linsenwechsel), `ui/akte/Akte.tsx` (Modus `seite`: kein Reiterband, Kopf ≤ 96 px), `ui/navigation/RegierungsNavigation.tsx` (Modus `eng`).
   - **Neu:** `ui/buehne/buehnen.ts` und `ui/buehne/seitenakte.css`.
   - **Gelöscht für die Bühnen-Akten:** die Pflichtreiter `lage`, `verlauf`, `personen` (`BereichsAkte`, Bereiche.tsx Zeile 433–451). Für die übrigen Bereiche regelt das Teil A/B.

7. **Simulationsbedarf:** keiner (rein Oberfläche).

8. **Texte**
   - Neu: „Zur Karte“ (Handy-Umschalter).
   - Entfallen: „Lage“, „Bilanz & Hintergrund“ und „Diplomatie & Dienste“ als Reiternamen.

9. **Abnahme**
   - Mit offener Seitenakte bei 1440×900 sind ≥ 760 × 740 px Karte frei und klickbar.
   - Der Provinzklick funktioniert (Test: ein neuer `test/seitenakte.test.tsx` prüft, dass `onSelect` bei offener Akte `aussen` die Provinzkarte rendert und `.seitenakte` nicht über der Karte liegt).
   - `test/aktennavigation.test.tsx` und `test/regierungsnavigation.test.tsx` werden an den Modus `eng` angepasst.
   - `test/karte2d.test.tsx` prüft die neuen Eigenschaften `labels`, `laenderPins` und `linien`.

10. **Aufwand und Abhängigkeiten:** **M**. Vorbedingung für die Ansichten 2–5 und Teil C (Land). Keine Recherche nötig außer der Weltgeometrie für 2D.

---

#### Außen › Welt

1. **Frage und Erfolg**
   - **Frage:** „Wer ist mir gut, wer ist mir feind, und wo muss ich jetzt handeln?“
   - **Erfolg:** In 5 Sekunden nennt der Spieler die zwei Länder mit dem größten Konflikt und das Land mit der dringendsten Forderung. Beides ist auf der Karte farbig markiert und steht oben in der Seitenakte.

2. **Aufbau (Zonen)**

   | Zone | Ort | Größe | Inhalt |
   |---|---|---|---|
   | B1 | Bühne | ganzes freies Feld | Weltausschnitt (Lissabon bis Kasachstan, Moskau bis Rotes Meer) |
   | B2 | Bühne | Linien über der Karte | Beziehungsnetz |
   | B3 | Bühne, oben am rechten Rand vor S | 72 px breit | Leiste „Ferne Mächte“: USA, China, Indien, Brasilien, Indonesien, Südafrika, Äthiopien |
   | B4 | Bühne, unten links über der Linsenleiste | ≤ 300 × 90 px | Legende |
   | S1 | Seitenakte | 96 px | Aktenkopf |
   | S2 | Seitenakte | 40 px | Ticker „Vorwarnungen“ |
   | S3 | Seitenakte | ≈ 330 px | **Brennpunkte**: höchstens 5 Zeilen |
   | S4 | Seitenakte | ≈ 260 px | **Stellgrößen**: 4 Zeilen mit Regler |
   | S5 | Seitenakte, zugeklappt | — | „Blöcke und Vermittlung“, „Energie und Flucht“ |

   In der ersten Bildschirmhöhe stehen S1–S4 vollständig. Mit gewähltem Land ersetzt die Länderkarte (Ansicht 3) S2–S5.

3. **Inhalte je Zone**
   - **B1 Weltausschnitt:**
     - Kamera-Abstand zwischen `START_D = 15` und `MAX_D = 220` (AtlasMap.tsx Zeile 140–143). Den Wert in der Umsetzung so kalibrieren, dass Brüssel (LAND_PINS `EU` 4,3° O) und Aserbaidschan (49,9° O) im freien Feld liegen.
     - Färbung: `laenderFarben(w)` (ui/ebenen.ts Zeile 438) mit `beziehungsFarbe(vertrauen, konflikt)` aus `beziehungZurTuerkei(w, id)` (sim/welt-modell.ts Zeile 434).
     - Die Türkei selbst bleibt neutral, nur die Grenze wird betont.
     - Flaggen: `laenderPins` (Stage.tsx Zeile 368, `LAND_PINS`, 41 Akteure) mit `ton` nach Vertrauen (≥ 55 gut, ≥ 35 mittel, sonst schlecht). Diese Schwellen sind heute in Stage.tsx fest verdrahtet; in `ui/ebenen.ts` neben `BEZIEHUNG_FARBEN` zusammenführen.
   - **B2 Beziehungsnetz:** neue Eigenschaft `linien` an AtlasMap, gezeichnet in der Effektschicht `ui/atlas/fx.ts` wie `kriegsfx.ts`, also gebogene Linien zwischen LAND_PINS und Ankara.
     - **Vertrag:** Goldlinie, Strichstärke 2 px. Quelle `alleLaufenden(w)` (sim/abkommen.ts Zeile 59), Feld `land`.
     - **Konflikt:** rote Linie, Stärke 1–5 px. Zuerst `kriegMit(w, id)?.eskalation` (sim/krieg.ts Zeile 193), sonst `weltZustand(w)[id].konflikt` (sim/laender.ts Zeile 358), angezeigt ab `ANGESPANNT_AB = 50` (ui/akte/Konfliktlage.tsx Zeile 10; die Konstante wandert nach `sim/krieg.ts` neben `KRISE_AB = 55`, damit Karte und Liste dieselbe Schwelle haben).
     - **Sanktion gegen die Türkei:** rote Strichlinie mit Schloss-Symbol. Quelle `aussenZustand(w).sanktionen` (sim/diplomatie.ts Zeile 70, Feld `von`); `breiteSanktionVon` aus sim/sanktion-art.ts entscheidet „breit“ oder „gezielt“.
     - **Eigene Sanktion:** graue Strichlinie. Quelle `aussenZustand(w).eigeneSanktionen`.
     - **Fremdkonflikt** (Ukraine–Russland, Israel–Iran): graue gekreuzte Klingen zwischen den beiden Hauptstädten mit Zahl „Intensität 80“. Quelle `vermittlungen(w)` (sim/abkommen.ts Zeile 547) aus `KONFLIKTE` (data/konflikte.ts). Ein Klick öffnet die Vermittlung in S.
     - **Initiative eines Landes:** pulsierender Ring um die Flagge. Quelle `initiativeGegen(w, id)` (sim/initiative.ts Zeile 348).
   - **B3 Ferne Mächte:** Flaggen der LAND_PINS mit Längengrad < −10° oder > 60°, je mit Vertrauen als Ring und der Zahl. Ein Klick wählt das Land, als würde man es auf der Karte anklicken.
   - **B4 Legende:** Farbstufen aus `BEZIEHUNG_FARBEN` (Partner, Nüchtern, Kühl/Angespannt, Feindselig) und vier Linienarten. Sie folgt aus `farbenFuerEbene(w, "welt")` und erscheint automatisch mit der Linse (heute nur hinter „Marken auf der Karte ?“).
   - **S1 Aktenkopf:**
     - **Ansehen:** `knotenKern(w, "ansehen")` als ganze Zahl mit Sparkline über 12 Monate. Datenlücke: Für Knoten gibt es keine Monatsreihe im Spielstand (`verlaufsReihen` in Bereiche.tsx liefert nur die Zustimmung). Neu: `w.spiel.verlauf.knoten[id]` als Monatsreihe (Simulationsbedarf).
     - **Vertrauen der EU:** `vertrauenZu(w, "EU")` (sim/laender.ts Zeile 373).
     - **Laufende Verträge:** `alleLaufenden(w).length`.
     - **Porträt Ministerium des Äußeren:** `sp.figuren.find(f => f.amt === "aussen" && f.imAmt)` mit Loyalitätsring. Ein Klick öffnet die Ministerakte (Teil B, Kabinettstisch).
   - **S2 Ticker:** `vorwarnungen(w)` (sim/diplomatie.ts Zeile 741) und `weltNachrichten(w, seitTag, 6)` (sim/welt-modell.ts Zeile 1107). Er läuft als eine Zeile; ein Klick auf eine Meldung mit Land wählt das Land. Hormus mit Preis: „Hormus geschlossen · LNG-Anteil 38 % · Versorgung 100“ aus `aussenZustand(w).energie` (`hormus`, `anteile.LNG`, `versorgung`). Den Preisaufschlag in Lira gibt es im Zustand nicht. Datenlücke: Ein Gaspreis-Aufschlag müsste aus sim/wirtschaft-*.ts kommen; bis dahin kein Lira-Betrag.
   - **S3 Brennpunkte:** höchstens 5 Zeilen, sortiert nach Dringlichkeit = max(Konflikt, offene Initiative mit Frist, unerfülltes Anliegen mit Frist).
     - Je Zeile: Flagge, Name (`akteurName`), `haltungWortAlle(w, id)` (sim/welt-sicht.ts Zeile 67), „Vertrauen 28 · Konflikt 53“ als ganze Zahlen aus `beziehungZurTuerkei`.
     - Dazu ein Symbol für den Grund: Schwert = Konflikt, Brief = Initiative, Haken = Anliegen.
     - Rechts eine Zahl der offenen Anliegen (`anliegenStand(w, id).filter(a => !a.erfuellt).length`, sim/laender.ts Zeile 408).
     - Bei laufendem Konfliktvorgang zusätzlich die Phase als Stempel (`PHASEN_NAME[k.phase]`).
   - **S4 Stellgrößen:** 4 Zeilen, jede als `MassnahmeZeile` aus `ui/politik/MassnahmenTafel.tsx` (Regler, Stufenname, Preis aus `pruefeVorhaben`, Wirkung, Knopf „Einbringen“ über `bringeEin` mit Weg Gesetz oder Erlass).
     1. `m_eu_annaeherung` „Annäherung an die EU“ (data/politiknetz.ts Zeile 935). Marke am Regler: die EU-Forderung „mindestens 55“, wenn ein EU-Anliegen mit `art: "massnahme"` darauf zeigt (aus `anliegenStand(w, "EU")`).
     2. `m_grenzschutz` „Grenzschutz“ (Zeile 934).
     3. `m_rueckkehr` „Rückkehrprogramm für Geflüchtete“ (Zeile 932). Neben dem Regler stehen „Geflüchtete 2,20 Mio. · Kosten 0,55 % des BIP im Jahr“ aus `aussenZustand(w).flucht.bestand` und `.kostenJahr`, als Mio. mit zwei Nachkommastellen bzw. % des BIP mit zwei.
     4. **Diplomatischer Dienst** (Behörde `diplomatie`, data/behoerden.ts Zeile 150): drei Punktbalken (Personal, Technik, Reichweite) aus `stand(w, "diplomatie")` (sim/behoerden.ts Zeile 67). Dazu die Knöpfe „Ausbauen“ und „Kürzen“ mit Preis aus `vorschau(w, id, achse)` (Zeile 204) bzw. `KuerzVorschau` (Zeile 245). Der Etat-Spielraum kommt aus `etatSpielraum(w, "aussen")` (Zeile 123). Datenlücke: der Etat des Dienstes in Lira, siehe PLAN Abschnitt 4 (Zentralhaushalt 2026, Tabelle A).
   - **S5 aufklappbar:**
     - „Blöcke“: `institutionenVon("TUR")` und `institutionSicht(w, id)` (sim/welt-bloecke.ts Zeile 151/251). Die Mitgliederzahl ist `mitglieder.length + weitereMitglieder` (data/welt-institutionen.ts, z. B. NATO 14 + 18 = 32).
     - „Vermittlung“: Liste aus `vermittlungen(w)` mit Knopf `vermittle` (Preis aus der Sicht).
     - „Energie und Flucht“: Lieferanteile als Kreis aus `energie.anteile` (Russland, Aserbaidschan, LNG, Iran, Heimisch) und Fluchtzahlen.

4. **Zustände**
   - **Leer** (Spielbeginn ohne Konflikt ≥ 50): S3 zeigt „Keine Spannung über 50“ und darunter die drei Länder mit dem geringsten Vertrauen.
   - **Krise** (Hormus geschlossen, Sanktion neu): Der Ticker steht rot, die betroffene Linie pulsiert.
   - **Krieg:** Die Konfliktlinie zum Gegner wird zur Frontlinie (Ansicht 4). S3 zeigt den Krieg als erste Zeile mit dem Knopf „Zur Lagekarte“, der zur Sicherheit wechselt.
   - **Vor der EU-Wahl oder einer Wahl im Partnerland:** Das Land bekommt eine Wahlurne an der Flagge (`wahlSicht(w, id)`, sim/welt-sicht.ts Zeile 93), aber nur ≤ 6 Monate vor dem Termin (heute steht die Europawahl 53 Monate vorher als großer Kasten).
   - **0 Kapital:** Regler und Knöpfe bleiben sichtbar. Der Preis steht rot mit Grund aus `pruefeVorhaben` bzw. `aktionenFuer` („Kapital fehlt“); es gibt keinen ausgegrauten Knopf ohne Grund.

5. **Klicks**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Land auf der Karte / Flagge / Ferne-Mächte-Leiste | Klick | Land gewählt, Kamera fliegt hin, Länderkarte | S (Ansicht 3) |
   | Land | Darüberfahren | Kärtchen: Name, Haltung, Vertrauen, Konflikt, Verträge | B |
   | Konfliktlinie | Klick | Länderkarte im Abschnitt Konflikt | S |
   | Fremdkonflikt-Klingen | Klick | Vermittlung dieses Konflikts aufgeklappt | S5 |
   | Brennpunkt-Zeile | Klick | wie Land | S |
   | Ticker-Meldung | Klick | Land wählen oder, ohne Land, Meldung aufklappen | S |
   | Regler S4 | Ziehen | Vorschau von Preis und Wirkung (`pruefeVorhaben`) | S4 |
   | „Einbringen“ | Klick | `bringeEin`; die Meldung erscheint im Eingang | Schreibtisch-Eingang (Teil A) |
   | Ausbauen / Kürzen (Dienst) | Klick | `baueAus` / Kürzung mit Preis | S4 |
   | Porträt Außenminister | Klick | Ministerakte | Kabinett (Teil B) |
   | Esc | Taste | erst die Länderwahl lösen, dann die Akte schließen | — |

6. **Übernommen / gelöscht**
   - **Übernommen:** `laenderFarben`, `LAND_PINS` und `beziehungsFarbe` (ui/ebenen.ts), `ui/welt/Block.tsx` (als S5-Inhalt), `ui/welt/Vermittlung.tsx` (S5), `MassnahmeZeile` (ui/politik/MassnahmenTafel.tsx).
   - **Umgebaut:** `ui/Welt.tsx` wird zur Steuerung der Seitenakte. Liste, Filterchips und Suchfeld entfallen; die Suche bleibt als Tastatur-Schnellwahl `/` in S1.
   - **Gelöscht:**
     - Der Reiter „Weltlage“ mit Kacheln (Bild 051): `ui/welt/Aussenlage.tsx` in eingebetteter Form und `WeltLage.tsx` als eigener Reiter. Was bleibt, wandert nach S2/S5.
     - „Behörden“ (053), „Diplomatische Bilanz“ (054), „Diplomatie & Dienste“ (055).
     - Die Unterreiter „Staaten / Blöcke / Dienst / Vermittlung“ (052).
     - Der Knopf „Länder und Diplomatie öffnen“.
   - **Wandert nach Sicherheit:** Terror (`aussenZustand.terror`) und Friedensprozess (`friedens`, Maßnahme `m_friedensprozess`, Zeile 835).

7. **Simulationsbedarf**
   - Monatsreihe der Knoten `ansehen` und EU-Vertrauen im Spielstand (z. B. `sp.verlauf.knoten: Record<string, number[]>`, je 36 Monate). Ohne sie gibt es keine Sparkline.
   - Eine Funktion `brennpunkte(w): { id; grund: "konflikt" | "initiative" | "anliegen"; dringlichkeit: number }[]` in `sim/welt-sicht.ts` (rein lesend). Die Rangregel ist neu: Sie ordnet nur die Anzeige und ändert keine Spielregel.
   - `ANGESPANNT_AB` nach `sim/krieg.ts` verlegen (heute in ui/akte/Konfliktlage.tsx).
   - Zuordnung zu den 17 Ministerien: Maßnahmen `m_eu_annaeherung` und `m_handelssysteme` → Äußeres bzw. Handel; `m_grenzschutz` → Inneres; `m_rueckkehr` und `m_integration` → Inneres (Präsidium für Migration). Diese Zuordnung als Feld `ministerium` an `m(...)` in data/politiknetz.ts führt Teil B ein. Hier wird sie nur gelesen, für das Porträt neben dem Regler.

8. **Texte**
   - Neu: „Welt“ (Ansichtsname), „Brennpunkte“, „Ferne Mächte“, „Stellgrößen“.
   - Entfallen: „Lage: angespannt“ und „Auffällig: …“; „Die Staatsführungen“ (stattdessen Porträt in der Länderkarte); „Instrumente“ als Wort.
   - Zahlen: Vertrauen und Konflikt als ganze Zahlen ohne „/ 100“; Geflüchtete in Mio. mit zwei Stellen; Anteile in ganzen Prozent.

9. **Abnahme**
   - S1–S4 passen ohne Bildlauf in 824 px.
   - Kein Wert steht zweimal (Ansehen und EU-Vertrauen nur im Kopf).
   - Jeder Regler zeigt Preis und Wirkung.
   - NATO zeigt 32 Mitglieder.
   - Klick auf USA in der Ferne-Mächte-Leiste öffnet die Länderkarte USA.
   - Tests: `test/aussenlage-ui.test.tsx` wird auf die neue S-Struktur umgeschrieben; `test/karte-welt.test.ts` prüft `linien` (Vertrag, Konflikt, Sanktion); neuer Test „Brennpunkte sortiert, höchstens 5“.

10. **Aufwand und Abhängigkeiten:** **L**. Vorbedingung: Ansicht 1 (Seitenakte), `linien` in fx.ts und Karte2D, Teil B (Feld `ministerium`) nur für die Porträts. Recherche: Weltgeometrie 2D (Ansicht 1).

---

#### Außen › Länderkarte (Drill-down aus Welt)

1. **Frage und Erfolg**
   - **Frage:** „Was will dieses Land von mir, was kann ich ihm geben, und was kostet mich das daheim?“
   - **Erfolg:** In 5 Sekunden sieht der Spieler die offenen Forderungen mit Ist und Soll und einen Regler je Forderung, ohne die Seite zu wechseln.

2. **Aufbau (Zonen, in S, 556 px breit, ≤ 1,3 Bildschirmhöhen)**

   | Zone | Höhe | Inhalt |
   |---|---|---|
   | L1 Kopf | 110 px | Flagge, Name, Haltung, Porträt der Führung, 3 Zahlen: Vertrauen, Handel, Konflikt |
   | L2 „Was sie wollen“ | ≈ 260 px | höchstens 4 Forderungen |
   | L3 „Was wir anbieten“ | ≈ 300 px | der Verhandlungstisch, direkt in der Karte |
   | L4 „Gesten“ | 1 Zeile, 6 Knöpfe | Gipfel, Handel, Rüstung, Druck, Entspannen, Hilfe |
   | L5 aufklappbar | — | „Konflikt“ (falls vorhanden), „Verdeckt (MİT)“, „Verträge“, „Hintergrund“ |

3. **Inhalte je Zone**
   - **L1 Kopf:**
     - `land(id)` (sim/laender.ts Zeile 262) für Name und Gruppe, `Flagge` (ui/art/Flaggen).
     - Haltung: `haltungWortAlle(w, id)`.
     - Zahlen: `beziehungZurTuerkei(w, id)` (`vertrauen`, `handel`, `konflikt`) als ganze Zahlen mit Pfeil gegen den Vormonat. Datenlücke: Für den Vormonat fehlt eine Reihe. `LandZustand.erinnerung` speichert nur Texte; ergänzen um `verlauf: {monat, v, k}[]` (Simulationsbedarf).
     - Porträt der Staatsführung: heute im Raster „Die Staatsführungen“ (Bild 051b), Quelle `lage(w, id)` (sim/welt-modell.ts Zeile 1063). Dazu Stabilität und Führung als Wort (`stabilitaetWort`, `haltungFuehrung`).
   - **L2 „Was sie wollen“:** `anliegenStand(w, id)` (sim/laender.ts Zeile 408). Je Anliegen eine Zeile mit Titel (`anliegen.titel`), Ist/Soll-Balken (`fortschritt`) und dem Text (`text`).
     - Hat die Bedingung `art: "massnahme"` oder `"massnahme-max"` (Typ `Bedingung` in sim/programme.ts Zeile 16), erscheint **darunter die Maßnahmenzeile dieser Maßnahme** mit Regler (Muster wie Welt S4).
       - Die Soll-Marke liegt auf dem Regler („EU will mindestens 55“).
       - Der Inlandspreis steht am Regler (aus `pruefeVorhaben`), die betroffenen Wählergruppen aus `betroffene(massnahmeId, richtung)` (sim/wege.ts Zeile 43) als Kreise mit Plus oder Minus.
       - Beispiele aus Bild 052b: Justizreform 35 → 55, Medienaufsicht 65 → höchstens 50, Annäherung an die EU 35 → 55.
     - Hat die Bedingung `art: "land"` (eine Dimension), erscheint nur der Balken mit dem Hinweis, welche Geste ihn hebt (aus `AKTIONEN`).
     - Datenlücke: keine. Die Bedingungen stehen in `LAENDER[].anliegen`.
   - **L3 „Was wir anbieten“:** `ui/welt/Verhandlungstisch.tsx` (Zeile 84), umgebaut zu einer einspaltigen Form für 556 px:
     - Oben die Stimmung der Gegenseite (`bewerte(w, angebot)` mit `STIMMUNG_WORT`, sim/abkommen.ts Zeile 127/225) als Halbrund-Zeiger mit 5 Stufen.
     - Darunter „Wir geben“ und „Wir verlangen“ als zwei Spalten mit Klauselchips (`klauselnFuer(w, landId)`, Zeile 65). Jeder Chip zeigt die Heimwirkung aus `heimWirkung(def)` (Zeile 90) beim Darüberfahren.
     - Laufzeit 2, 5 oder 10 Jahre (`VERTRAGSLAUFZEITEN`).
     - Knopf „Angebot unterbreiten · x Kapital“ (`pkFuer(a)`, Zeile 130; `verhandle`, Zeile 323). Gegenangebote werden mit „Annehmen“ übernommen (`nimmGegenangebot`, Zeile 355).
     - Sperre: `sperreRest(w, landId)` als „wieder möglich in x Tagen“.
     - Liegt ein Vorschlag des Partners vor (`vorschlagVomPartner`, Zeile 488), steht er vorausgefüllt da.
   - **L4 Gesten:** `aktionenFuer(w, id)` (sim/laender.ts Zeile 428) für Hauptakteure, `gestenFuerWeitere(w, id)` (sim/welt-modell.ts Zeile 1128) für weitere Staaten. Knopf mit Kapitalpreis (`AKTIONEN[a].pk`) und Grund als Hinweis.
   - **L5 aufklappbar:**
     - **Konflikt:** Phase, Eskalation, Front und drei Haupthandlungen aus `handlungenFuer(w, k.id)` (sim/krieg.ts Zeile 448), dazu „Zur Lagekarte →“ (Sicherheit). Das ist der einzige Querweg; das Konfliktdossier lebt in der Lagekarte.
     - **Verdeckt (MİT):** `opsOptionen(w, ziel)` (sim/welt-dienst.ts Zeile 249) mit `aussicht` (Zeile 197) und `ordneAn` (Zeile 277). Heute Unterreiter „Dienst“ und Knopf „Verdeckte Optionen“.
     - **Verträge:** `ui/welt/Vertraege.tsx` (laufende mit Kündigen und Verlängern, `VERLAENGERUNG_PK`).
     - **Hintergrund:** Wirtschaftszahlen (`lage(w, id)`), Wahlen (`wahlSicht`, `letzteWahl`), letzte Nachrichten (`jungeNachrichten(w, id, 4)`). Die Vergleichstabelle aus `data/vergleich.json` (Stand 2025) entfällt: Ihre Türkei-Spalte widerspricht dem laufenden Spiel (Inflation 34,9 % gegen 19,2 %).
     - Für die EU zusätzlich `ui/welt/EuDossier.tsx` (Ratsstimmen `ratStimmen`, Beitrittskapitel) als eigener Aufklapper „Beitritt“.

4. **Zustände**
   - **Weiterer Staat ohne Verhandlungstisch** (`!istHauptakteur(id)`): L3 entfällt, an seiner Stelle steht der Satz aus `SONDERTEXTE` bzw. „Kein eigener Verhandlungstisch“ (ui/welt/LandPopover.tsx Zeile 24).
   - **Handelssperre** (Israel): Die Geste „Handel“ ist gesperrt mit Grund (sim/laender.ts Zeile 437).
   - **Krieg mit dem Land:** L1 rot, L3 ersetzt durch die Friedenspakete `PAKETE` (sim/krieg.ts Zeile 366) mit `paketAnnahme`.
   - **0 Kapital:** Knöpfe mit rotem Preis und Grund.

5. **Klicks**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Regler einer Forderung | Ziehen / Einbringen | wie Maßnahmentafel; die Soll-Marke färbt sich grün, wenn erreicht | L2 |
   | Klauselchip | Klick | in das Angebot oder heraus; die Stimmung aktualisiert sich ohne Kosten (Prüfen ist frei) | L3 |
   | „Angebot unterbreiten“ | Klick | `verhandle`; Ergebnis als Satz in L3 und im Eingang | L3 |
   | Geste | Klick | `fuehreAktionAus` / `fuehreGesteAus` | L4 |
   | „Zur Lagekarte →“ | Klick | Sicherheit öffnet mit diesem Konflikt | Ansicht 4 |
   | Verdeckte Operation | Klick | `ordneAn` mit Aussicht und Preis | L5 |
   | ← Zurück / Esc / Klick auf leeres Meer | Klick | zurück zur Welt-Übersicht | Ansicht 2 |

6. **Übernommen / gelöscht**
   - **Übernommen und umgebaut:** `ui/welt/Verhandlungstisch.tsx`, `Vertraege.tsx`, `EuDossier.tsx`, `Dienst.tsx` (nur Teil Ziel), `KriegDossier.tsx` (nur Kopf und drei Handlungen).
   - **`LandPopover.tsx`:** bleibt für Klicks auf Länder außerhalb der Akte Außen, zeigt aber nur L1 und „In der Akte Welt öffnen“.
   - **Gelöscht:** die Unterreiter „Überblick / Verhandlungstisch / Verträge / Gesten / ★ Beitritt“ (052); die BIP-Kacheln der Gegenseite; der doppelte Text „Letzte Wahl“; die Knöpfe „Zum Verhandlungstisch“, „Verdeckte Optionen“ und „Zum EU-Rat“.

7. **Simulationsbedarf:** `LandZustand.verlauf` (Vertrauen und Konflikt je Monat, 24 Einträge) für die Pfeile im Kopf. Sonst nichts; alle Funktionen gibt es schon.

8. **Texte**
   - Neu: „Was sie wollen“, „Was wir anbieten“, „Gesten“, „Verdeckt“.
   - Entfallen: „Überblick“, „Verhandlungstisch“ als Reitername, „Zum Vergleich (letzter Wert)“.

9. **Abnahme**
   - Die Länderkarte der EU ist ≤ 1,3 Bildschirmhöhen hoch, solange L5 zugeklappt ist.
   - Jede Forderung vom Typ Maßnahme hat einen Regler mit Soll-Marke und Preis.
   - Kein Wert aus `data/vergleich.json` erscheint.
   - Tests: neuer Test „Länderkarte EU: drei Forderungen mit Regler (m_justizreform, m_medienaufsicht, m_eu_annaeherung)“; `test/verhandlung.test.ts` und `test/abkommen.test.ts` bleiben unverändert.

10. **Aufwand und Abhängigkeiten:** **L**. Vorbedingung: Ansichten 1 und 2 sowie die Maßnahmenzeile als wiederverwendbares Bauteil (Teil A, Politik).

---

#### Sicherheit › Lagekarte

1. **Frage und Erfolg**
   - **Frage:** „Droht Krieg, wo steht die Front, und was befehle ich?“
   - **Erfolg:**
     - Ohne Krieg: In 5 Sekunden sieht man jeden Konflikt als Ring auf der Karte mit Eskalationszahl und Phase.
     - Im Krieg: Front, Zielräume und die eigene Erfolgsaussicht stehen auf der Karte, Einsatzart und Tempo sind mit einem Klick stellbar.

2. **Aufbau (Zonen)**

   | Zone | Ort | Inhalt |
   |---|---|---|
   | B1 | Bühne | Linse `lage` (neu): die Türkei und ihre Nachbarn, die Kamera auf dem schwersten Konflikt |
   | B2 | Bühne | Konfliktringe (Frieden bis Beschluss) bzw. Kriegslage (Krieg, Waffenruhe) |
   | B3 | Bühne, nur im Krieg | **Kriegsleiste** unten über der Linsenleiste, 788 × 120 px: Einsatzart (4 große Symbole), Tempo (3er-Schalter), Erfolgsbalken |
   | S1 | Seitenakte | Kopf (96 px): Konflikte, Spannung, Abschreckung, Bereitschaft; Porträts Generalstab, Verteidigung, Inneres |
   | S2 | Seitenakte | **Konfliktliste**, eine Zeile je Konflikt (höchstens 6) |
   | S3 | Seitenakte | **Gewählter Konflikt**: Phase als Leiter, Handlungen mit Preis |
   | S4 | Seitenakte | Innere Sicherheit: 3 Zeilen mit Regler (Polizei, Friedensprozess, Terror-Lage) |

   In der ersten Bildschirmhöhe stehen S1, S2 und der Kopf von S3. Der Umschalter im Kopf „Lagekarte · Streitkräfte & Bau“ ersetzt die heutigen Reiter.

3. **Inhalte je Zone**
   - **B1 Kamera:**
     - Ohne Konflikt: die Türkei (`START_D`).
     - Mit Konflikt: `SCHAUPLATZ_NACH_LAND[land]` (data/schauplaetze.ts Zeile 62, Felder `lon` und `lat`) des Vorgangs mit der höchsten `eskalation`.
     - Israel hat keinen Schauplatz (`ZWISCHENFALL_ORT` „fern“, sim/krieg.ts Zeile 1342/1350). Es erscheint in der Ferne-Leiste wie in Ansicht 2.
     - Die Grenzprovinzen des gewählten Schauplatzes (`grenzprovinzen`) bekommen einen dünnen Rand.
   - **B2 Konfliktringe:** neue Eigenschaft `ringe` an AtlasMap, Zeichnung in `ui/atlas/fx.ts` neben `zeichneKrieg` (kriegsfx.ts).
     - **Laufende Vorgänge:** für jeden Vorgang aus `aktiveKriege(w)` (sim/krieg.ts Zeile 189) mit Phase `spannung`, `drohkulisse` oder `beschluss` ein Ring um den Schauplatzmittelpunkt.
       - Radius nach `eskalation` (0–100).
       - Farbe: Ocker bei Spannung, Rot gestrichelt bei Drohkulisse, Rot voll bei Beschluss.
       - Daneben eine Zahlplakette „72“ und der Phasenname (`PHASEN_NAME`).
       - Ab `KRISE_AB = 55` (Zeile 1290) ein kleines Ausrufezeichen „Krise möglich“, aber nur wenn `kriseGrund(w, land)` (Zeile 1294) leer ist, die Krise also eröffnet werden kann.
     - **Angespannt ohne Vorgang:** `weltZustand(w)[id].konflikt ≥ ANGESPANNT_AB` mit `!ohneKriegsvorgang(id)` als dünner, gestrichelter Ring ohne Zahl. Die EU (`ohneKriegsvorgang("EU")` ist wahr) bekommt **keinen** Ring. Ihre Spannung 53 gehört in Außen, nicht in die Lagekarte.
     - **Krieg und Waffenruhe:** `kriegsKarte(w, kriege(w), provinceLonLat)` (sim/kriegsschauplatz.ts Zeile 568, heute schon in Stage.tsx Zeile 851) wird wie heute von `zeichneKrieg` gezeichnet:
       - Regionen eigen, umkämpft, beim Gegner oder besetzt.
       - Pfeile eigen und gegnerisch.
       - Bedrohte Grenzprovinzen (`bedroht`) blinken rot auf der türkischen Seite.
     - **Zielräume** (nur Phasen Drohkulisse, Beschluss und Krieg): Je Zielraum aus `zielraeumeFuer(land)` (sim/krieg.ts Zeile 1370, Daten `ZIELRAEUME` in data/streitkraefte.ts Zeile 74) eine schraffierte, anklickbare Fläche aus den Regionen `ZIELRAUM_REGIONEN[zielId]` (data/schauplaetze.ts Zeile 116), Flächen aus `data/schauplatz-flaechen.json`.
       - Beschriftung: Name (`militaer.zielraum.<id>`), Schwierigkeit als 1–3 Schilde (aus `schwierigkeit`) und Bedeutung als 1–3 Sterne (`bedeutung`).
       - Der gewählte Zielraum (`k.zielraum`) ist voll umrandet.
   - **B3 Kriegsleiste** (nur Phase `krieg`, bei `beschluss` als Vorplanung ohne Kosten):
     - **Einsatzart:** 4 Symbole aus `einsatzSichten(w, k)` (sim/kriegsschauplatz.ts Zeile 253): Luft, Boden, See, Stellvertreter. Je Symbol: Eignung für das Gelände der umkämpften Region (`eignung`, als „gut / schwer / kaum“ mit drei Stufen statt Zahl), eigene Kraft (`kraft`, ganze Zahl × 100) und ein Grund, falls gesperrt (`grund`: Küste, Stellvertreter, Abkühlung, Kapital). Im Krieg kostet die Umstellung `SCHAUPLATZ.einsatzPk` Kapital und 1 Truppenmoral; das steht am Symbol.
     - **Tempo:** Vorsichtig, Normal, Hart aus `TEMPO` (data/schauplaetze.ts Zeile 185). Die Wirkung steht als drei kleine Pfeile (Front, Verluste, Munition) aus den Faktoren `front`, `verlust` und `munition`.
     - **Erfolgsbalken:** links „eigene Stärke 37“ (`eigenStaerke(w, k)`, sim/krieg.ts Zeile 299), rechts „Gegenwehr 14“ (`gegnerStaerke(w, land)`, Zeile 316), als zwei gegeneinander laufende Balken.
     - Darunter eine Zeile: Front `k.front` (0–100) mit Trend gegen `k.frontVorher`, Heimatfront `k.uhr`, Gegner `k.uhrGegner`, Gefallene `k.gefallene`, Munition in Tagen (`streitkraefteSicht(w).gattungen` Gattung `munition`).
     - Lagebild: `lagebild(w)` (Zeile 328) als Wort („bekannt / vermutet / unsicher“), das die Gegnerzahl abschwächt („≈ 14, vermutet“).
   - **S1 Kopf:**
     - **Konflikte:** zwei Zahlen statt einer, damit Kopf und Liste übereinstimmen: „Konflikte 2 · Spannung 5“. Erste Zahl = Vorgänge (`aktiveKriege(w).length`), zweite = angespannte Länder ohne Vorgang (dieselbe Filterregel wie die Ringe).
     - **Abschreckung** und **Bereitschaft Heer:** `knotenKern(w, "abschreckung" | "bereitschaft_heer")` (ui/akte/Bereiche.tsx Zeile 111–115).
     - **Porträts:** Generalstab (`amt === "generalstab"`), Ministerium für Verteidigung (neues Amt, Simulationsbedarf) und Ministerium des Inneren (`amt === "inneres"`), je mit Loyalitätsring. Datenlücke: Eine Putschneigung des Generalstabs gibt es als `putsch` nur am Kriegsvorgang (krieg-typen.ts). Eine dauernde Anzeige braucht eine Sim-Größe (offene Frage 3).
   - **S2 Konfliktliste:** dieselbe Menge wie die Ringe (eine gemeinsame Funktion `konfliktLage(w)`, siehe Simulationsbedarf).
     - Je Zeile: Flagge, Land, Phase als Stempel, Eskalation bzw. Front als ganze Zahl, kleiner Trendpfeil.
     - Die ganze Zeile ist der Klick. Der Knopf „Konfliktdossier öffnen →“ (7-mal in Bild 056) entfällt.
     - Heute steht die Liste in `ui/akte/Konfliktlage.tsx` (Zeile 13–47), sortiert nach Konfliktwert, höchstens 6.
   - **S3 Gewählter Konflikt:**
     - Phasenleiter Spannung → Drohkulisse → Beschluss → Krieg → Waffenruhe → Frieden als 6 Punkte, der aktuelle groß.
     - Darunter die Handlungen der Phase aus `handlungenFuer(w, k.id)` (sim/krieg.ts Zeile 448): `label`, Kapitalpreis `pk`, `hinweis`, `grund`. Knopf „Ausführen“ ruft `fuehreKriegHandlungAus` (Zeile 543).
     - Rahmung (Verteidigung, Schutz, Beistand, Revision) als vier Karten mit Preisschild aus `RAHMUNG` (Zeile 131): Stimmen, Ansehen, Uhr, Nationalisten.
     - Ohne Vorgang (nur angespannt): „Krise eröffnen · x Kapital“ (`kriseEroeffnen`, Zeile 1311, Preis `KRISE_PK = 4`), sofern `kriseGrund` leer ist.
     - Koalition: `k.koalition` mit Partnern (`koalition_rufen`).
   - **S4 Innere Sicherheit** (aus Außen hierher):
     - **`m_polizei`** (data/politiknetz.ts Zeile 832) als Maßnahmenzeile. Dazu die Behörde `polizei` als drei Punktbalken mit Ausbauen und Kürzen (sim/behoerden.ts).
     - **`m_friedensprozess`** (Zeile 835) als Maßnahmenzeile. Daneben die Phase des Prozesses aus `aussenZustand(w).friedens.phase` als 6-Punkte-Leiter (Stufen wie in Bild 051b), `fortschritt` als Balken.
     - **Terror-Lage:** `aussenZustand(w).terror` (IS, PKK, Links) als drei Balken, nur lesend. Dazu die MİT-Inlandsaufträge aus `inlandOptionen(w)` (sim/welt-dienst.ts Zeile 574) mit `ordneInlandAn`.

4. **Zustände**
   - **Ruhe** (keine Spannung ≥ 50): Die Karte zeigt die Türkei ohne Ringe. S2 sagt „Keine Spannung über 50“ (`gz.konflikt.ruhig`). S3 entfällt; S4 rückt nach oben.
   - **Spannung / Drohkulisse:** Ringe; Zielräume ab Drohkulisse.
   - **Beschluss:** Zielräume wählbar ohne Kosten; die Kriegsleiste erscheint in der Vorplanung ohne Preis.
   - **Krieg:** Die Kamera fliegt zum Schauplatz. Die Kriegsleiste ist aktiv, Vorstöße laufen als Animation (Effekte „aus“ hält still), bedrohte Provinzen blinken.
   - **Waffenruhe:** Die Frontlinie steht gestrichelt; S3 zeigt die Friedenspakete (`PAKETE`, `paketAnnahme`), `waffenruheFuerAngebot`.
   - **Besatzung nach dem Frieden:** `besatzungsSicht(w)` (sim/kriegsschauplatz.ts Zeile 460) als schraffierte Fläche. S3 zeigt je Gebiet Form, Widerstand und `aendereBesatzung` (heute `ui/krieg/Besatzung.tsx`).
   - **0 Kapital:** Einsatzwechsel und Zielraumwechsel im Krieg (4 Kapital, sim/krieg.ts Zeile 1388) sind gesperrt, mit rotem Grund am Symbol.

5. **Klicks**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Konfliktring / Land / Zeile in S2 | Klick | Konflikt gewählt, Kamera auf den Schauplatz | S3 + B |
   | Zielraumfläche | Klick | `waehleZielraum(w, k.id, zielId)`; im Krieg mit Bestätigung „4 Kapital, −2 Moral“ | B (Umrandung) |
   | Zielraumfläche | Darüberfahren | Schwierigkeit, Bedeutung, Regionen, wer gereizt wird (`Region.reizt`) | B |
   | Einsatzsymbol | Klick | `waehleEinsatz` | B3 |
   | Temposchalter | Klick | `waehleTempo` | B3 |
   | Handlung in S3 | Klick | `fuehreKriegHandlungAus`; Ergebnis als Satz und im Eingang | S3 |
   | Region im Krieg | Darüberfahren | Name, Gelände, Lage, Ressource (`Region.ressource`) | B |
   | Bedrohte Provinz | Klick | Provinzkarte mit „Bedroht von …“ | Ansicht 9 |
   | Porträt | Klick | Ministerakte bzw. Gespräch | Kabinett (Teil B) |
   | Umschalter „Streitkräfte & Bau“ | Klick | Ansicht 5 in derselben Seitenakte; die Karte bleibt | S |
   | Esc | Taste | Konfliktwahl lösen, dann die Akte schließen | — |

6. **Übernommen / gelöscht**
   - **Übernommen:** `ui/atlas/kriegsfx.ts` und `sim/kriegsschauplatz.ts` `kriegsKarte` (unverändert). `ui/welt/KriegDossier.tsx` wird in S3 zerlegt (Kopf, Handlungen, Pakete). `ui/krieg/Schauplatz.tsx` wird zur Kriegsleiste B3. `ui/krieg/Besatzung.tsx` wird S3 im Zustand Besatzung. `ui/akte/Konfliktlage.tsx` wird S2 (ohne Knöpfe).
   - **Gelöscht:**
     - Die Schublade „Zielräume“ in `ui/militaer/Streitkraefte.tsx` (Funktion `Zielraeume`, Zeile 79–112, Bild 057).
     - Der Kasten „Lage: angespannt · Streitkräfte öffnen“ (056).
     - „Bündnisse der Türkei“ als Kacheln (056b). Die Bündnisse gehören nach Außen S5 bzw. werden auf der Karte als Umschalter gezeigt.
     - Die Reiter „Sicherheitsbilanz“ (060) und „Führung & Zuständigkeit“ (061).

7. **Simulationsbedarf**
   - `konfliktLage(w): { land; vorgang?: KriegVorgang; wert: number; art: "vorgang" | "angespannt" }[]` in `sim/krieg.ts` (lesend). Kopf, Liste und Ringe nutzen sie. Behebt „Laufende Konflikte 2“ gegen 7 Zeilen.
   - `ANGESPANNT_AB` nach `sim/krieg.ts` (siehe Ansicht 2).
   - Neues Figur-Amt `verteidigung` (Ministerium für Verteidigung) in `sim/figuren.ts` / `sim/personen-typen.ts` und in `BEREICH_AEMTER.sicherheit` (Bereiche.tsx Zeile 367). Das ist Teil des 17-Ministerien-Umbaus (Teil B); hier nur der Bedarf.
   - Für Israel ist kein Schauplatz vorhanden (`SCHAUPLAETZE`, data/schauplaetze.ts Zeile 53). Das bleibt so; die Lagekarte zeigt Israel ohne Zielräume („nur das allgemeine Ziel“, wie heute). Es wird nichts erfunden.

8. **Texte**
   - Neu: „Lagekarte“, „Spannung“ (als Zähler im Kopf), „Gegenwehr“, „Erfolgsaussicht“.
   - Geändert: Die Marke „Krieg läuft“ erscheint nur in Phase `krieg` (siehe Fehlerliste).
   - Gelöscht: „Konfliktdossier öffnen →“, „Was Sie jetzt in Auftrag geben können“ (wandert nach Ansicht 5).
   - Grammatik: „Das Kriegsziel umfasst 1 Region“ (Pluralform im Katalog `militaer.*`).
   - Zahlen: Eskalation und Front als ganze Zahlen ohne „/ 100“; Eignung als Wort.

9. **Abnahme**
   - Die Kopfzahl „Konflikte“ und die Zeilen von S2 stammen aus derselben Funktion (Test in `test/krieg.test.ts`: `konfliktLage(w).filter(art==="vorgang").length === aktiveKriege(w).length`).
   - Ohne Phase `krieg` erscheint kein „Krieg läuft“ (Test in `test/streitkraefte-ansicht.test.tsx` anpassen).
   - Die EU hat keinen Ring.
   - Ein Zielraumklick ruft `waehleZielraum` (UI-Test).
   - Kriegsleiste und Ringe erscheinen auch in Karte2D (`test/karte2d.test.tsx`).
   - `test/kriegsschauplatz.test.ts` und `test/krieg-*.test.ts` bleiben grün.
   - Erste Bildschirmhöhe ohne Bildlauf bis Ende S2.

10. **Aufwand und Abhängigkeiten:** **L**. Vorbedingung: Ansicht 1, `ringe` in fx.ts und Karte2D, Linse `lage` (Ansicht 7), Teil B (Amt Verteidigung) nur für das Porträt.

---

#### Sicherheit › Streitkräfte & Bau

1. **Frage und Erfolg**
   - **Frage:** „Wie stark bin ich, wo bin ich schwach, was wird gebaut, und was kostet mehr?“
   - **Erfolg:** In 5 Sekunden sieht der Spieler die schwächste Teilstreitkraft (Radar), das nächste fertige Vorhaben (Bauliste oben) und den Verteidigungsetat als Regler.

2. **Aufbau (Zonen, in S, Karte bleibt links)**

   | Zone | Höhe | Inhalt |
   |---|---|---|
   | T1 Kopf | 96 px | wie die Lagekarte, Umschalter „Lagekarte · Streitkräfte & Bau“ |
   | T2 Radar | 220 px | 3 Achsen (Heer, Luft, See) mit zwei Flächen: Kampfkraft und Bereitschaft |
   | T3 Stellgrößen | ≈ 280 px | 5 Zeilen mit Regler |
   | T4 Bauliste | ≈ 300 px | eine Liste aller laufenden Vorhaben (militärisch und zivil), Kapazitätsbalken oben |
   | T5 aufklappbar | — | „Neu beginnen“, „Instand setzen“, „Gattungen im Einzelnen“, „Behörden“ |

   In der ersten Bildschirmhöhe stehen T1–T3 und der Kopf von T4.

   Auf der Karte (B) zeigt die Linse `lage` zusätzlich Stützpunkte und Baustellen der Rüstung als Marken (`reichMarken(w, ebene)`, Stage.tsx Zeile 391). Ein Klick auf eine Marke wählt das Vorhaben in T4.

3. **Inhalte je Zone**
   - **T2 Radar:**
     - Kampfkraft je Teil: `streitkraefteSicht(w).teile` (sim/streitkraefte.ts Zeile 514) für `heer`, `luft` und `see` (1,0 = Stand 2026), Anzeige × 100 als ganze Zahl.
     - Bereitschaft je Teil: Knoten `bereitschaft_heer`, `bereitschaft_luft`, `bereitschaft_marine` (die Namen in 058 lauten „Einsatzbereitschaft des Heeres / der Luftwaffe / der Marine“). Die genauen Knoten-IDs in `data/politiknetz.ts` prüfen; `bereitschaft_heer` und `bereitschaft_luft` sind belegt (Bereiche.tsx Zeile 112, data/reich/militaer.ts Zeile 297).
     - Mitte: Gesamtwert `streitkraefteSicht(w).index` (`kampfkraftIndex`: Heer 45 %, Luft 35 %, See 20 %).
     - Am Rand: Modernisierung (Knoten) und Autarkie (`autarkie(z)`, Zeile 198) als zwei kleine Zahlen.
     - Raketen und Cyber sind keine Teilstreitkraft: `Teilstreitkraft` = heer | luft | see (data/streitkraefte.ts). Raketen zählen zu See (`raketen.teil = "see"`). Fünf Achsen wie in Kritik D vorgeschlagen sind deshalb **nicht** möglich, ohne die Sim zu ändern. Es bleiben 3 Achsen.
     - Zahlen nur dort, wo sie vom Stand 2026 abweichen. Bei 100 steht „wie 2026“.
   - **T3 Stellgrößen** (Maßnahmenzeilen, Ministerium Verteidigung):
     1. `m_verteidigung` „Verteidigungsausgaben“ (data/politiknetz.ts Zeile 838). Daneben der Etatfaktor `etatFaktor(w)` (sim/streitkraefte.ts Zeile 108) als „Etat 100 % von 2026“ und `verteidigungsEtat(w)` (sim/haushalt.ts Zeile 212) in % des BIP. Datenlücke: Ein Lira-Betrag fehlt; er kommt mit dem Ministeriumsrad (PLAN Abschnitt 4). Warnung, wenn `unterdeckung > 0` (Erhalt unter `erhaltSchwelle 0,8`): „Ältestes Gerät wird ausgemustert in x Monaten“.
     2. `m_wehrdienst` „Wehrdienst“ (Zeile 1373). **Achtung:** Zusätzlich gibt es `setzeWehrdienst(w, 0|6|12|18)` (sim/streitkraefte.ts Zeile 381) mit eigenem Feld `wehrdienst`. Zwei Hebel für dieselbe Sache. Vor dem Umbau auf einen Hebel festlegen (offene Frage 2). Bis dahin zeigt die Zeile die Maßnahme und die Monate aus `streitkraefteSicht(w).wehrdienst` lesend.
     3. `m_ruestungsindustrie` „Heimische Rüstungsindustrie“ (Zeile 839), dazu Autarkie in Prozent.
     4. `m_uebungen` „Ausbildung und Übungen“ (Zeile 1374).
     5. `m_offiziersauswahl` „Beförderung im Obersten Militärrat“ (Zeile 1375), mit dem Termin im August als Hinweis.
   - **T4 Bauliste:**
     - Eine einzige Liste aus `warteschlange(w)` (sim/reich.ts Zeile 862), gefiltert auf das Ministerium (Bereich `militaer`) und darüber hinaus alle Vorhaben, die dieselbe Baukapazität nutzen, ausgegraut mit „zivil“.
     - Je Zeile: Bild (`WunderBild`), Name, Fortschrittsbalken, „fertig in etwa x Monaten“ (aus `bauplan(w)`, Zeile 377), Vergabe als kleines Etikett (`laufVergabe`, einmal statt 4-mal gelb), Griff zum Umordnen (`verschiebe(w, id, ±1)`, Zeile 817, Preis `VORZIEHEN_VERWALTUNG = 10` am Griff) und **einmal** Pausieren (`pausiere`, Zeile 797).
     - Oben ein gestapelter Balken „Baukapazität 99 / 133“ (`bauKapazitaet(w)`, Zeile 186; die Anteile je Vorhaben aus `bauplan`), militärische Stücke dunkel, zivile hell. Daneben „Verwaltungskraft 99 · +2,4 im Monat“ (`verwaltungBilanz(w)`, Zeile 203).
     - **Zwei Modelle für dasselbe Gerät:** Altay T1, Stahlkuppel, F-16 Block 70, Eurofighter und KAAN stehen zweimal in der Sim:
       - als Reich-Vorhaben `mil_altay`, `mil_stahlkuppel`, `mil_f16`, `mil_eurofighter`, `mil_kaan` (data/reich/militaer.ts)
       - und als Beschaffung in `START_BESCHAFFUNGEN` (data/streitkraefte.ts) mit eigenem `fertig`-Tag.

       Daher „Altay noch 11 Monate“ (Beschaffung, 30 Monate ab 2026) gegen „fertig in etwa 25 Monaten“ (Reich-Baupunkte). Die Bauliste darf nur **ein** Datum zeigen. Festlegung (Simulationsbedarf): Das Reich-Vorhaben ist führend; die Beschaffung übernimmt `fertig` aus dem Vorhaben.
   - **T5 aufklappbar:**
     - **Neu beginnen:** `kartenAuswahl(w, "militaer")` (ui/akte/Bildkarten.tsx Zeile 29) **nur** Zustand `moeglich` und `verlangt`, ohne `bau`.
       - Kosten beschriftet: „Kapital 8 · Bau 2.000 · 48 Monate · Haushalt +0,7 Pp. · Verwaltung 2,5“. Die Bedeutung der fünf heutigen Symbolchips des KAAN steht in `vergabeAngebot(v, vergabe)` (sim/reich.ts Zeile 126: `pk`, `bau`, `monate`, `vorlauf`). Die Zuordnung „+0,7 Pp.“ und „2,5“ in der Umsetzung aus `VorhabenSicht` (Zeile 330) prüfen und beschriften.
       - Knopf „Prüfen und beginnen“ mit Vergabeart (`beginne(w, id, vergabe)`, Zeile 724).
       - Dazu Beschaffung je Gattung aus `vorschauAusbau(w, gattung, art)` (sim/streitkraefte.ts Zeile 293) und `beginneAusbau` (Zeile 338): Kauf, Produktion, Entwicklung, Modernisierung mit Preis in % des BIP je Monat (`bipMonat`), Lieferland und Risiko (`scheitert`).
     - **Instand setzen:** `pflegeStand(w, id)` (sim/reich.ts Zeile 628), wie in Bild 058 („Hier lohnt sich Pflege“). Das Muster bleibt unverändert.
     - **Gattungen im Einzelnen:** Tabelle aus `streitkraefteSicht(w).gattungen`: Menge (nur bei `einheit: "stueck"`, sonst „wie 2026“ oder ± x %), Generation als Ziffer 1–5 statt Punkte, heimisch in Prozent, Lieferland mit Flagge. „Generation“ entfällt bei `personal` und `munition`.
     - **Behörden:** MİT, Polizei und Gendarmerie, Grenzschutz und Küstenwache, Cyberabwehr (data/behoerden.ts) als 4 Zeilen: drei Punktbalken, Ressort (Präsidialamt bzw. Inneres aus `ressort`), Etat-Spielraum (`etatSpielraum`), Ausbauen und Kürzen mit Preis (`vorschau`, `baueAus`, Kürzung). Ein Klick auf den Ressortnamen öffnet das Ministeriumsrad (PLAN Abschnitt 4, Teil B).

4. **Zustände**
   - **Leer** (keine Bauten): T4 zeigt „Nichts im Bau“ und klappt T5 „Neu beginnen“ auf.
   - **Krieg:** Das Radar zeigt die Verluste der letzten Woche als rote Kerbe (`k.letzteWoche.eigen`). Die Munition steht rot unter 20 Tagen. Ausmustern (`mustereAus`) ist gesperrt; die Demobilisierungssperre (`demobSperreBis`) steht im Kopf.
   - **Lieferstopp** (Sanktion, z. B. CAATSA): Betroffene Vorhaben tragen ein Schloss mit Lieferland und Grund (`gestoppt`, `versorgungsVerzug`).
   - **0 Kapital:** Preise rot, der Griff zum Umordnen ist gesperrt, wenn die Verwaltungskraft unter 10 liegt.

5. **Klicks**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Radarachse | Klick | „Gattungen im Einzelnen“ öffnet gefiltert auf diesen Teil | T5 |
   | Regler T3 | Ziehen / Einbringen | Maßnahme | T3 / Eingang |
   | Zeile Bauliste | Klick | Kamera auf den Bauort (falls vorhanden), Details aufgeklappt | T4 + B |
   | Griff ▲▼ / Ziehen | Klick / Ziehen | `verschiebe` mit Preis 10 Verwaltungskraft je Platz | T4 |
   | Pausieren | Klick | `pausiere` | T4 |
   | „Prüfen und beginnen“ | Klick | `beginne` / `beginneAusbau` | T4 (neue Zeile) |
   | Instand setzen | Klick | Pflege | T5 |
   | Behörde Ausbauen / Kürzen | Klick | `baueAus` / Kürzung | T5 |
   | Ressortname | Klick | Ministeriumsrad | Wirtschaft › Haushalt (Teil B) |

6. **Übernommen / gelöscht**
   - **Umgebaut:** `ui/militaer/Streitkraefte.tsx` (Radar und Gattungstabelle; Zielräume entfernt). Die Reich-Akte Militär (`reich_militaer`, Bauliste und Pflege aus `ui/reich/*`). `ui/akte/Bildkarten.tsx` (nur mögliche Vorhaben).
   - **Gelöscht:**
     - Die Kacheln „Index 100“ (057).
     - Die doppelte Liste „Im Bau“ plus „Baureihenfolge“ (058b wird eine Liste).
     - Die 8 Kennzahlbalken in „Rüstung › Lage“ (058) und die Unterreiter „Lage / Rüstung pflegen / Beschaffung und Doktrinen“.
     - „Behörden“ als eigener Reiter (059).
     - Die Vorteilskarten „Noch nicht erreicht“. Vorteile (`aktiveVorteile`, sim/reich.ts Zeile 915) erscheinen erst, wenn sie erreicht sind, als Abzeichen im Kopf.
   - **Doktrinen** (`doktrin_*` in data/reich/militaer.ts) bleiben als „Neu beginnen“-Karten.

7. **Simulationsbedarf**
   - **Ein Datum je Gerät:** `START_BESCHAFFUNGEN` und die Reich-Vorhaben `mil_*` koppeln (Feld `vorhaben?: string` an `Beschaffung`; `fertig` folgt `bauplan`). Das ändert Lieferzeiten. Die Abweichung zwischen beiden Modellen dokumentieren und in ENTSCHEIDUNGEN eintragen, nicht stillschweigend.
   - **Wehrdienst:** einen der beiden Hebel streichen oder koppeln (`m_wehrdienst`-Stufe ↔ `setzeWehrdienst`-Monate).
   - **Zuordnung zu den Ministerien:** `m_verteidigung`, `m_ruestungsindustrie`, `m_uebungen`, `m_offiziersauswahl` und `m_wehrdienst` → Verteidigung. Die Rüstungsindustrie ist umstritten (Präsidium der Verteidigungsindustrie SSB untersteht dem Präsidenten, Zuordnung prüfen). `m_polizei` → Inneres.

8. **Texte**
   - Neu: „Streitkräfte & Bau“, „wie 2026“, „Baukapazität“, „zivil“.
   - Entfallen: „Index“, „Kampfkraft 100“ als Kachel, „Transparente Ausschreibung“ in Großbuchstaben (stattdessen das Etikett „Ausschreibung“), „Wunder“ für Rüstungsgüter (Klasse `wunder` im Katalog umbenennen: „Großvorhaben“).
   - Generation als Ziffer „Gen. 4“.

9. **Abnahme**
   - Kein Vorhaben steht zweimal.
   - Jedes Gerät hat genau ein Fertigdatum in allen Ansichten (Test: Altay in Bauliste, Gattungstabelle und Zeitung gleich).
   - Keine Kachel mit unverändertem Wert 100.
   - T1–T3 passen in die erste Bildschirmhöhe, die ganze Ansicht ohne T5 ≤ 1,3 Bildschirme.
   - Tests: `test/streitkraefte-ansicht.test.tsx`, `test/reich-ui.test.tsx` und `test/akte-bildkarten.test.tsx` anpassen; `test/streitkraefte.test.ts` und `test/reich.test.ts` für die Kopplung erweitern.

10. **Aufwand und Abhängigkeiten:** **L**. Vorbedingung: Ansicht 1, Entscheidung zu Wehrdienst und Datumskopplung, Teil B (Ministeriumsrad) nur für den Drill-down.

---

#### Medien › Medien

1. **Frage und Erfolg**
   - **Frage:** „Was schreiben sie über mich, wer schreibt es, und wie viel Kontrolle kaufe ich mir zu welchem Preis?“
   - **Erfolg:** In 5 Sekunden sieht man dieselbe Nachricht in zwei Schlagzeilen (regierungsnah gegen oppositionell), den Anteil der regierungsnahen Reichweite im Ring und den Pressefreiheitswert mit Rang.

2. **Aufbau (Zonen, Papierakte über der Karte, `.dossier.wide` 1160 × 790 px)**

   | Zone | Ort | Größe | Inhalt |
   |---|---|---|---|
   | M1 Kopf | oben | 1160 × 80 | Pressefreiheit (Wert und Rang, Sparkline), veröffentlichte Umfrage gegen eigene Kenntnis, Ausweichen in soziale Netze; Porträts Präsidialamt und Inneres |
   | M2 Titelseiten | links | 720 × 560 | zwei Titelseiten nebeneinander, je 350 px; in Monaten mit drittem Blatt (digital) ein schmaler Streifen darunter |
   | M3 Ring | rechts oben | 400 × 300 | Medienmarkt als Ring aus 7 Gruppen |
   | M4 Regler | rechts unten | 400 × 260 | 3 Maßnahmenzeilen |
   | M5 | unten über die volle Breite | 1160 × 60 | „Nicht in dieser Ausgabe“ (durchgestrichen) und Archiv als Zeitleiste der letzten 12 Ausgaben |

   Alles steht in der ersten Bildschirmhöhe. Der Artikeltext jeder Titelseite klappt beim Klick auf.

3. **Inhalte je Zone**
   - **M1 Kopf:**
     - **Pressefreiheit:** `rsfSicht(w)` (sim/medien.ts Zeile 727): `score` mit einer Stelle (29,4), `rang` („Rang 159“), Sparkline aus `verlauf`.
     - **Umfrage:**
       - Veröffentlicht: `angezeigteZustimmung(w)` (Zeile 863), Wert, Institut und Streuung („Ekran 54,2 % ± 2,0“).
       - Wahr: `sp.umfrage.zustimmung`, die die Kopfleiste heute zeigt (Stage.tsx Zeile 429).
       - Beide nebeneinander und benannt: „Ihre Zahl 50 % · veröffentlicht 54,2 % (Ekran)“. Wie viel der Spieler wissen darf, ist offene Frage 1.
     - **Ausweichen:** `medienVon(w).ausweich` (0–100) nur, wenn > 0. „Gesperrte Medien 0“ entfällt bei 0 und erscheint als rote Zahl, sobald `lizenzVon(w, id) === "gesperrt"` für ein Blatt gilt.
     - **Porträts:** Präsidialamt (`amt === "stab"`) und Inneres (`amt === "inneres"`), wie `BEREICH_AEMTER.medien`.
   - **M2 Titelseiten:** die neueste Monatsausgabe `zeitungVon(w).archiv.at(-1)` (sim/zeitung.ts Zeile 617).
     - Links das regierungsnahe, rechts das oppositionelle Blatt (`ausgabe.blaetter`, Auswahl `blattAuswahl` Zeile 454: ein regierungsnahes, ein oppositionelles, in geraden Monaten zusätzlich `digital_frei`).
     - Je Seite die Komponente `Frontseite` aus `ui/Zeitung.tsx` (Zeile 337) in Schmalform: Masthead, Aufmacher (`artikel[0]`), Einordnung, Kommentar (`kommentar`).
     - Gleiche Vorgänge stehen auf gleicher Höhe, damit der Kontrast sichtbar wird (Zuordnung über die Vorgangs-ID im Artikel).
     - Fehlt ein Blatt, weil es gesperrt ist (`ausgabe.gesperrt`), steht an seiner Stelle eine graue Seite „Erscheint nicht · Lizenzentzug bis …“.
     - „Zahlen des Monats“ (`ausgabe.zahlen`) entfällt in M2; die Zahlen stehen in der Kopfleiste und in M1.
   - **M3 Ring:** 7 Segmente aus `MEDIEN_CLUSTER` (data/medien.ts).
     - **Segmentgröße = Reichweite jetzt.** `reichweiteJetzt(w, id)` (sim/medien.ts Zeile 263) ist ein Faktor (1 = Start). Die Grundreichweite je Gruppe steht in `reichweiteSegmente` (Anteil je Wählersegment: ländlich-konservativ, urban-alt, urban-jung, kurdisch, akademisch).
       - Datenlücke: Für eine Gesamtreichweite fehlt der Bevölkerungsanteil je Medien-Segment. Die Kommentare in data/medien.ts ordnen die Segmente den Wählergruppen zu („≈ GRUPPEN konservative, landwirte, rentner“ …). Deren Größen stehen in `sim/gruppen.ts`.
       - Vorschlag: Gewicht je Segment = Summe der zugeordneten Gruppenanteile, als neue Tabelle `SEGMENT_GEWICHT` mit genau diesen Kommentaren als Beleg.
       - Bis zur Festlegung zeigt der Ring gleich große Segmente und sagt sichtbar: „Größe nach Reichweite folgt“.
     - **Farbe** nach wirksamer Ausrichtung `wirksamerCluster(w, c).ausrichtung` (Zeile 286), von staatlich (dunkelrot) bis unabhängig-digital (blau). Ein gekipptes opportunistisches Blatt (`gekippt`) wechselt sichtbar die Farbe.
     - **Innenring:** Selbstzensur (`ClusterZustand.selbstzensur`, 0–100) als Füllhöhe. Ein Schloss bei Lizenz `gedraengt`, ein Kreuz bei `gesperrt` (`lizenzVon`).
     - **Mitte:** Anteil der regierungsnahen Reichweite in Prozent (aus denselben Segmentgrößen; erst nach Schließen der Datenlücke, vorher „—“).
   - **M4 Regler** (die drei Dauerkanäle laut sim/medien.ts Zeile 15):
     1. `m_medienaufsicht` „Medienaufsicht“ (data/politiknetz.ts Zeile 888, Start 65).
        - Marken auf dem Regler aus `reglerLizenz` (sim/medien.ts Zeile 231): 65 = Rundfunk unter Druck, 90 = Opposition gesperrt.
        - Dazu die EU-Forderung „höchstens 50“, falls im EU-Anliegen vorhanden (`anliegenStand(w, "EU")`).
     2. `m_internetsperren` „Internetsperren“ (Zeile 891, Start 60). Marken: 60 = digital unter Druck, 90 = digital gesperrt.
     3. `m_staatsmedien` „Staatliche Medien und Werbung“ (Zeile 892, Start 60). Marke 60: Darüber steigt die Abhängigkeit der Regierungsnahen (sim/medien.ts Zeile 775–777).

     Je Zeile Preis und Wirkung aus `pruefeVorhaben`. Zusätzlich ein Satz: „Pressefreiheit sinkt (Kante −0,05 je Monat, Verzug 3 Monate)“, aus den Kanten `e(...)` in data/politiknetz.ts Zeile 899–904.
   - **Eingriffe am Segment (Drill-down M3):** `medienAktionen(w)` (sim/medien.ts Zeile 503) gefiltert auf `clusterAktion` für das gewählte Cluster: Eigentümerdruck, Staatsanzeigen, Anzeigenstopp, Aufsichtsstrafe, Blackout, Lizenzentzug, Verfahren, Kontosperrung, Übernahme, Interview.
     - Preis: Kapital und Aufmerksamkeit (`AKTIONEN[id].kapital`, `.aufmerksamkeit`); Pressefreiheitsverlust aus `REGULIERUNG_PREISE[preis].rsfMalus` bzw. `rsf`; Märtyrer-Effekt `maertyrer`.
     - Ausführen: `fuehreMedienAktionAus(w, aktionId, clusterId)` (Zeile 586).
     - „Pressekonferenz“ (keine Clusteraktion) und „Rohdaten kaufen“ (`rohdatenKaufen`, Zeile 902, 3 Kapital) stehen in M1 als Knöpfe.
   - **M5:**
     - „Nicht in dieser Ausgabe“ aus `ZeitungBlatt.verschwiegen` des regierungsnahen Blatts, als durchgestrichene rote Zeilen. Ein Klick führt zum Vorgang (`handlungFuer`, sim/zeitung.ts Zeile 344).
     - Archiv: 12 Ausgaben (`ARCHIV_MAX = 12`, Zeile 253) als Punkte auf einer Zeitleiste. Beim Darüberfahren erscheint die Schlagzeile.

4. **Zustände**
   - **Keine Ausgabe** (erster Monat): M2 zeigt „Die erste Ausgabe erscheint am 1. des Monats“. Ring und Regler sind da.
   - **Publikationsverbot vor der Wahl** (`publikationsverbot(w)`, Zeile 852): M1 zeigt „Keine neuen Umfragen bis zur Wahl“ und die letzte Zahl grau.
   - **Pressekrise** (Sperre oder Lizenzentzug): Das Segment ist durchgekreuzt, die gesperrte Titelseite grau.
   - **Eilmeldung** (`anlass: "eilmeldung"`): Sie ersetzt die linke Titelseite, mit Banner.
   - **0 Kapital:** Eingriffe mit rotem Preis.

5. **Klicks**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Ringsegment | Klick | Eingriffe dieses Clusters, Eigentümer (`eigentuemer`), Abhängigkeit, Selbstzensur | M3 als Aufklapper |
   | Artikel | Klick | Volltext klappt auf; „Zur …“ führt zum Vorgang (`Handlung`, Zeitung.tsx Zeile 44) | Ziel-Akte |
   | Regler | Ziehen / Einbringen | Maßnahme | M4 / Eingang |
   | „Nicht in dieser Ausgabe“-Zeile | Klick | Vorgang | Ziel-Akte |
   | Archivpunkt | Klick | Ausgabe ersetzt M2 (Kopf „Ausgabe Nr. 17 · 1. September 2029 · zurück zur neuesten“) | M2 |
   | Rohdaten kaufen | Klick | `rohdatenKaufen` | M1 |
   | Porträt | Klick | Ministerakte | Kabinett (Teil B) |

6. **Übernommen / gelöscht**
   - **Übernommen:** `ui/Zeitung.tsx` (`Frontseite`, `Masthead`, `Artikel`, `Kommentar`, `Einordnung`). `ui/MedienAkte.tsx` (Eingriffe) wird zum Segment-Aufklapper.
   - **Gelöscht:**
     - „Medienlage“ (062) mit dem Kasten „Lage: angespannt“ und „Zeitung öffnen“.
     - „Pressebilanz“ (064), „Zuständige Akteure“ (065).
     - Die Unterreiter „Ausgaben / Medien“ und „Der Staatsbote / Der Widerspruch“ (063).
     - „Zahlen des Monats“, „Parlament“ und „Lage im Land“ als Kästen der Zeitung. Sie wiederholen Kopfleiste, Parlament und Land; bleiben darf je ein Satz im Artikel.
   - **Sidebar-Zähler** „Medien 22“ (`umlauf: spiel.zeitung.ungelesen`, Stage.tsx Zeile 598): nur noch ein ruhiger Punkt ohne Zahl, bei neuer Ausgabe.

7. **Simulationsbedarf**
   - `SEGMENT_GEWICHT: Record<MedienSegment, number>` (Datenlücke, siehe M3) für Ringgröße und Mittelzahl. Recherche: Anteile der Segmente an der Wahlbevölkerung oder Ableitung aus `sim/gruppen.ts` mit Beleg.
   - Eine Lesefunktion `medienMarkt(w): { id; reichweite; ausrichtung; selbstzensur; lizenz }[]` in sim/medien.ts.
   - Keine Regeländerung.

8. **Texte**
   - Neu: „Ihre Zahl“, „veröffentlicht“, „Erscheint nicht“, „Nicht in dieser Ausgabe“ (bleibt).
   - Entfallen: „Medien nach Gruppen“, „Gesperrte Medien 0“ bei 0, „3 weitere Einträge“.
   - Zahlen: Pressefreiheit mit einer Nachkommastelle (Format der Quelle RSF), alle übrigen als ganze Zahlen.

9. **Abnahme**
   - Die ganze Ansicht ohne Aufklapper ist ≤ 1 Bildschirmhöhe.
   - Die regierungsnahe und die oppositionelle Titelseite stehen gleichzeitig sichtbar.
   - Kein Wert der Kopfleiste steht in der Zeitung noch einmal mit anderem Wert ohne Benennung (Test: Wenn `angezeigteZustimmung.wert ≠ umfrage.zustimmung`, tragen beide Werte ihr Etikett).
   - Jeder Regler hat Schwellenmarken aus `reglerLizenz`.
   - Tests: `test/zeitung.test.ts` und `test/zeitung-inhalt.test.ts` bleiben; `test/medien.test.ts` für `medienMarkt`; neuer UI-Test „zwei Titelseiten nebeneinander“.

10. **Aufwand und Abhängigkeiten:** **M**. Vorbedingung: Maßnahmenzeile als Bauteil (Teil A); offene Frage 1 (Umfrage gegen Wahrheit); Recherche `SEGMENT_GEWICHT`.

---

#### Karte › Acht Linsen

1. **Frage und Erfolg**
   - **Frage:** „Welche Sicht auf mein Land brauche ich gerade?“
   - **Erfolg:** Jede Linse ist mit einem Klick oder einer Taste erreichbar und an Farbe und Symbol eindeutig erkennbar. Keine zwei Linsen nutzen dieselbe Farbskala.

2. **Aufbau**
   - **Linsenleiste** unten in der Bühne: 8 runde Symbole zu je 44 px mit Tastenziffer darunter (≈ 420 × 64 px), links ab x = 76 (rechts der eingeklappten Navigation) bzw. x = 224 (ausgeklappt).
   - Über dem aktiven Symbol eine **Unterleiste** mit 2–5 Umschaltern, falls die Linse Teile hat.
   - **Legende:** rechts neben der Leiste, immer sichtbar, solange die Linse eine Färbung hat.
   - Die heutige Tafel mit 15 Kacheln und Beschreibungen (`ui/linsen/LinsenWahl.tsx`, Bild k01) entfällt. Die Beschreibung (`kurz`) erscheint beim Darüberfahren.

3. **Inhalte: aus 15 werden 8**

   | Taste | Linse (neu) | aus heutigen Ebenen (`Kartenebene`, ui/ebenen.ts Zeile 26) | Unterleiste | Farbfamilie | Darstellung |
   |---|---|---|---|---|---|
   | 1 | **Rückhalt** (Grundlinse) | `rueckhalt`, `wahl` | Rückhalt · Wahl 2028 (`ebeneName("wahl", w)`) | Purpur ↔ Grün (Rückhalt), Parteifarben (Wahl) | Fläche |
   | 2 | **Wirtschaft** | `wirtschaft`, `arbeitslosigkeit` | Leistung je Kopf · Arbeitslosigkeit | Blau/Türkis | Fläche |
   | 3 | **Netze** | `infrastruktur`, `belastung`, `versorgung` | Straße · Bahn · Belastung · Warenwege · Gas | Grün ↔ Gelb ↔ Rot nur für Belastung; Linien für Straße, Bahn und Wege | Linien und Symbole |
   | 4 | **Krisen** | `probleme`, `risiko` | Akute Probleme · Beben · Flut · Brand | Rot (einzige Rotfamilie) | Problemsymbole je Provinz; Risiko als 5 Stufen |
   | 5 | **Rohstoffe & Orte** | `ressourcen`, `strategie` | Rohstoffe · Strategische Orte | ohne Fläche | Symbole an echten Orten (`ressourcenMarken()`, `strategieMarken()`, Stage.tsx Zeile 397) |
   | 6 | **Bauen** (Bühne der Akte Land, Teil C) | `erbe` und Bau-Marken (`reichMarken`) | Baustellen · Kulturerbe | Ocker | Marken und Großprojekt-Umrisse |
   | 7 | **Welt** (Bühne der Akte Außen) | `welt` | Beziehungen · Bündnisse | `BEZIEHUNG_FARBEN` | Länderfläche, Linien, Flaggen |
   | 8 | **Lage** (Bühne der Akte Sicherheit, neu) | — (neu, aus `kriegsKarte` und `konfliktLage`) | Konflikte · Stützpunkte | Ocker/Rot für Ringe, kriegsfx-Farben | Ringe, Front, Zielräume |

   - **Entfallen:**
     - `gelaende` („Politisch“, ohne Färbung) als Linse. Grenzen, Städte und Namen liegen in jeder Linse. Wer gar keine Färbung will, schaltet die aktive Linse durch erneuten Druck auf ihre Taste aus.
     - `regionen` wird eine dauernde Grenzlinie der 7 Großregionen (dünn, ab mittlerem Zoom), keine Linse.
   - **Politiknetz (`netz`):** bleibt ohne Taste und ohne Platz in der Leiste (wie heute, `gruppe` undefiniert).
   - **Datenquellen der Färbung:** unverändert `farbenFuerEbene(w, id, …)` (ui/ebenen.ts). Neu ist nur die Zuordnung Linse → Teil-Ebene. Netze in der 3D-Karte: `versorgung` (`transportKartenDaten`) zeichnet schon Linien. In Karte2D fehlen sie; das ist dort nachzubauen.
   - **Belastung je Netz:** `belastungZeilen(w, p)` (Stage.tsx `hoverZeilen`) liefert die Netze je Provinz. Das Symbol des höchsten Netzes steht in der Provinz.

4. **Zustände**
   - Eine Linse ohne Daten fehlt nicht. Sie ist ausgegraut mit Grund beim Darüberfahren (die Regeln in `ui/linsen/linsen.ts` Zeile 14 bleiben; `lage` ist ohne Konflikt verfügbar und zeigt die Stützpunkte).
   - Bei offener Bühnen-Akte ist die Linse der Akte gesetzt. Ein Wechsel ist möglich; beim Schließen gilt `ebeneVorher`.

5. **Klicks**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Linsensymbol / Taste 1–8 | Klick / Taste | Linse wechselt; ein zweiter Druck schaltet die Färbung aus | B |
   | Unterleisten-Umschalter | Klick | Teil-Ebene | B |
   | Legende | Darüberfahren über einen Eintrag | gleichfarbige Provinzen leuchten auf | B |
   | Problemsymbol (Krisen) | Klick | Provinzkarte mit diesem Problem oben | Ansicht 9 |
   | Chip „10 akute Probleme“ | Klick | Linse Krisen | B |

6. **Übernommen / gelöscht**
   - **Umgebaut:** `ui/linsen/linsen.ts` (neue Tabelle der 8 Linsen mit Teilen; `TASTE`, Zeile 33; `LINSEN_TASTEN = "12345678"`), `ui/linsen/LinsenWahl.tsx` (Leiste statt Tafel), `ui/ebenen.ts` (`LINSEN_GRUPPEN` entfällt, `KARTENEBENEN` behält die Teil-Ebenen).
   - **Gelöscht:** die Tafel (k01), der Kasten „Marken auf der Karte ?“ (`MarkenLegende` geht in die Legende über), `Plakette` („TÜRKİYE · 81 Provinzen“, Stage.tsx Zeile 1155), `Effekte` auf der Karte (Stage.tsx Zeile 1159; bleibt im Hauptmenü).

7. **Simulationsbedarf:** Für „Lage“ siehe `konfliktLage`. Für Risiko „Flut und Brand“: Prüfen, ob `data/katastrophe_risiko.json` diese Arten enthält. Wenn nicht, ist das eine Datenlücke, und die Umschalter entfallen.

8. **Texte**
   - Neu: „Rückhalt“ als Grundlinse, „Netze“, „Krisen“, „Rohstoffe & Orte“, „Bauen“, „Lage“.
   - Entfallen: „Kartenebene“, „Politisch“, „Belastung“ und „Versorgungswege“ als eigene Namen (werden Unterleiste).

9. **Abnahme**
   - Genau 8 Linsen.
   - Keine zwei Linsen mit gleicher Verlaufsfarbe (Test in `test/linsen.test.tsx`: `streifenFuer` je Linse paarweise verschieden).
   - Taste 1–8 wählt je eine Linse.
   - Grundlinse beim Spielstart ist `rueckhalt`.
   - `test/linsen.test.tsx` (Zeile 66–78 erwartet heute `"1" → gelaende`, `"0" → probleme`, `r`, `k`, `b`, `s`) wird neu geschrieben; `test/karte-marken.test.tsx` anpassen.

10. **Aufwand und Abhängigkeiten:** **M**. Vorbedingung: Linse `lage` (Ansicht 4), Linien in Karte2D.

---

#### Karte › Tasten, Zeit und Pause

1. **Frage und Erfolg**
   - **Frage:** „Ich drücke eine Taste, um etwas anzusehen. Läuft dabei die Zeit weiter?“
   - **Erfolg:** Keine Taste hat zwei Bedeutungen. Ansehen (Linse, Menü, Akte) lässt die Zeit nie anlaufen.

2. **Aufbau: Belegung**

   | Taste | Neu | Heute |
   |---|---|---|
   | Leertaste | Pause / Weiter (letztes Tempo) | Pause ↔ Tempo 1 (Stage.tsx Zeile 329–338) |
   | `+` / `=` und `−` | Tempo hoch / runter (1 → 2 → 3 → „bis zum nächsten Ereignis“) | — |
   | 1–8 | Linsen | 1–4 Tempo (`useTempoTasten`, ui/kopf/Kopfleiste.tsx Zeile 112–128) **und** 1–9 Linsen (`LinsenWahl.tsx` Zeile 100–113) |
   | 9, 0, R, K, B, S, V | frei (keine Belegung) | Linsen |
   | Esc | schließt die oberste Ebene (Ansicht 10) | je Fenster einzeln |
   | ⌘S / Strg+S | sichern (unverändert) | ebenso |
   | `/` | in Außen: Land suchen | — |

   Im Rundgang (k-1 bis k-4) griff nur das Tempo. Beide Listener hängen an `window`, und die Linsenwahl bricht ab, solange `gesperrt` wahr ist (Stage.tsx Zeile 1151: offenes Ereignis, Hinweis, Land-Popover …). `useTempoTasten` kennt keine Sperre. Folge: Zwei Spielmonate liefen, eine Entscheidung verfiel.

3. **Regeln für Zeit und Pause**
   - **Akte öffnen** hält an (heute `oeffneDossier` → `beendeZeit`, unverändert).
   - **Hauptmenü öffnen** hält an und merkt sich das Tempo. Schließen setzt das gemerkte Tempo fort, sofern der Spieler im Menü nichts am Tempo änderte. Technik: `Kopfleiste` bekommt `onMenue?: (offen: boolean) => void` (Zustand `offen`, Kopfleiste.tsx Zeile 183). Stage hält `tempoVorMenue`.
   - **Linsenwechsel** hält an (Vorgabe des Inhabers) und zeigt 2 s „Angehalten · Leertaste: weiter“. Abschaltbar im Menü unter „Beim Kartenwechsel anhalten“ (Standard an). Technik: In `onEbene` (Stage.tsx Zeile 1148) vor `setEbene` `setSpeed(0)`, wenn die Einstellung an ist.
   - **Tempo per Taste** ist gesperrt, solange ein Textfeld Fokus hat (wie heute) oder ein modales Fenster offen ist (Ereignis, Wahlabend, Umbildung). Neu ist, dass dieselbe Sperrfunktion für beide gilt: `tasteDarfWaehlen` (ui/linsen/linsen.ts Zeile 100) wird nach `ui/tasten.ts` verlegt und von Kopfleiste und Linsenwahl benutzt.
   - **Tempowechsel** zeigt 1,5 s eine Einblendung „Tempo 2“ an der Datumsanzeige.

4. **Zustände**
   - Mit Text im Fokus wirkt keine Taste außer Esc.
   - Bei modalem Fenster wirken nur Esc und ⌘S.
   - Ohne Spiel (Titel) keine.

5. **Klicks / Tasten:** siehe Tabelle unter 2. Zusätzlich zeigen die Tempo-Knöpfe der Kopfleiste die Tastenhilfe als Tooltip („Weiter: Leertaste · schneller: +“).

6. **Übernommen / gelöscht**
   - **Umgebaut:** `ui/kopf/Kopfleiste.tsx` (`useTempoTasten` auf `+`/`−`; `onMenue`), `ui/Stage.tsx` (Leertaste setzt das letzte Tempo fort; Pause bei Menü und Linse), `ui/linsen/LinsenWahl.tsx` (1–8).
   - **Gelöscht:** die Ziffern 1–4 als Tempo; die Tasten 9, 0, R, K, B, S und V für Linsen.

7. **Simulationsbedarf:** keiner. Die Einstellung „Beim Kartenwechsel anhalten“ liegt in den Oberflächen-Einstellungen (wie `Effekte`).

8. **Texte**
   - Neu: „Angehalten · Leertaste: weiter“, „Tempo 1/2/3/bis zum nächsten Ereignis“ (bestehend `st.tempo.*`), „Beim Kartenwechsel anhalten“.
   - Die Kopfzeile der Linsentafel „Tasten 1 bis 9, 0 und B“ entfällt mit der Tafel.

9. **Abnahme**
   - `test/kopfleiste.test.tsx`: Taste „2“ ändert das Tempo **nicht**, „+“ erhöht es.
   - `test/linsen.test.tsx`: „2“ wählt Linse 2 auch dann, wenn die Kopfleiste montiert ist (ein gemeinsamer Test mit beiden Listenern).
   - Neuer Test: Öffnen des Hauptmenüs setzt das Tempo auf 0, Schließen stellt es wieder her.
   - Neuer Test: Ein Linsenwechsel setzt bei aktiver Einstellung das Tempo auf 0.

10. **Aufwand und Abhängigkeiten:** **S**. Keine Vorbedingung; kann sofort umgesetzt werden (PLAN Abschnitt 6).

---

#### Karte › Provinzkarte

1. **Frage und Erfolg**
   - **Frage:** „Was ist in dieser Provinz los, und was kann ich hier tun?“
   - **Erfolg:** Ein Klick auf eine Provinz zeigt immer eine Karte, ohne dass sie die Provinz verdeckt. In der ersten Zeile steht der Wert der aktiven Linse, darunter mindestens eine Handlung.

2. **Aufbau**
   - Schwebende Karte, 320 × höchstens 420 px.
   - Sie dockt an der Seite der Provinz an, die zur Mitte des freien Feldes zeigt, mit 16 px Abstand zum Umriss. Liegt der Umriss nahe am rechten Rand der Bühne, öffnet sie links davon.
   - Sie liegt nie über der Seitenakte und nie über der Navigation.

   | Zone | Höhe | Inhalt |
   |---|---|---|
   | P1 | 56 px | Name, Region, Nr. (Plaka), × |
   | P2 | 48 px | **Linsenwert**, z. B. „Rückhalt 41“, „Arbeitslosigkeit 10,7 % (geschätzt)“, „Belastung: Wohnungen überlastet“ |
   | P3 | ≤ 120 px | **Probleme hier** als Symbole mit Namen (je Klick zur Maßnahme) |
   | P4 | ≤ 80 px | **Hier im Bau** und Vorgänge |
   | P5 | 48 px | Handlungen: „Bauen“, „Problem angehen“, ggf. „Besuch“ (offene Frage 5) |
   | P6 | — | „Daten ▸“ (aufklappbar): Einwohner, Wirtschaftskraft, Arbeitslosigkeit, Rathaus, Abgeordnete, Infrastruktur, Lage-Balken |

3. **Inhalte**
   - **Daten:** wie heute in `ui/ProvinceCard.tsx`:
     - `PROVINZEN[plaka − 1]` (sim/regional.ts): `bevoelkerung`, `bipProKopf`, `arbeitslosigkeit`, `arbeitslosigkeitHerkunft`, `buergermeister2024`, `grossstadt`, `sitze`.
     - Infrastruktur: `data/provinz_infra.json`.
     - Werte: `world.net.values` je `WERTE`.
     - Sitze: `world.parliament.byProvince[plaka]`.
     - Probleme: Knoten `kind === "problem"` über `threshold`.
     - Bau: `world.net.ziele`.
     - Vorgänge: `vorgaengeIn(world, plaka)`.
   - **P2 Linsenwert:** derselbe Wert, mit dem `farbenFuerEbene(w, ebene, …)` (ui/ebenen.ts) die Provinz einfärbt. Neue Hilfsfunktion `linsenWert(w, ebene, plaka): { text: string; ton } | null` in `ui/ebenen.ts`, damit Farbe und Zahl eine Quelle haben.
   - **P3:** Jedes Problem führt mit `gehe({ art: "politik", massnahme, theme })` (Stage.tsx `gehe`) zur passenden Maßnahme. Die Zuordnung Problem → Maßnahme stammt aus `handlungsHebel` (sim/wege.ts Zeile 108), der stärkste Hebel zuerst.
   - **P5:**
     - „Bauen“ = `onBauen(plaka)` (heute ganz unten, nur nach Bildlauf erreichbar; Bild p01 zeigt ihn nicht).
     - „Problem angehen“ = Sprung wie P3 für das schwerste Problem.
     - Im Krieg bei bedrohter Provinz zusätzlich „Zur Lagekarte“.

4. **Zustände**
   - **Ohne Probleme:** P3 entfällt.
   - **In der Linse Netze:** P2 zeigt das Netz mit der höchsten Auslastung (`belastungZeilen`).
   - **Bei offener Seitenakte:** Die Karte liegt im freien Feld.
   - **Handy:** Bodenblatt über der Linsenleiste.

5. **Klicks**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Provinz | Klick | Provinzkarte (immer, in jeder Linse, auch bei offener Transporttafel) | Ansicht 9 |
   | Andere Provinz | Klick | Die Karte wandert | Ansicht 9 |
   | Problemsymbol | Klick | Maßnahme in der Politik | Politik (Teil A) |
   | Bauen | Klick | Netzansicht mit Ort (`setNetOrt([p])`, `setDossier("netz")`) | Land / Netze |
   | Vorgang | Klick | `zeigeVorgang(id)` | Land › Vorgänge |
   | Daten ▸ | Klick | aufklappen | Ansicht 9 |
   | × / Esc / Klick ins Meer | — | schließt | Karte |

6. **Übernommen / gelöscht:** `ui/ProvinceCard.tsx` wird umgebaut (Reihenfolge, Andocken, `linsenWert`). Die feste Lage `right: 22px; top: 84px; z-index: 4` (styles.css Zeile 259) entfällt.

7. **Simulationsbedarf:** keiner.

8. **Texte:** „Probleme hier“, „Hier im Bau“, „Daten“, „Problem angehen“. Zahlen wie in der Quelle (Einwohner mit Punkt, Prozent mit einer Stelle).

9. **Abnahme**
   - Die Karte verdeckt den Umriss der gewählten Provinz nicht (Test: Begrenzungsrechteck der Provinz und der Karte schneiden sich nicht, bei drei Testprovinzen am Rand: Edirne 22, Hakkari 30, Hatay 31).
   - Ein Provinzklick bei offener Transporttafel zeigt die Karte (Behebung von p01).
   - „Bauen“ steht ohne Bildlauf.

10. **Aufwand und Abhängigkeiten:** **M**. Vorbedingung: Ebenenordnung (Ansicht 10).

---

#### Karte › Ebenenordnung (z-order) und Überdeckung

1. **Frage und Erfolg**
   - **Frage:** „Warum verdeckt das eine das andere?“
   - **Erfolg:** Kein Bedienelement liegt über einem anderen, das gleichzeitig gebraucht wird. Jede Ebene hat eine feste Zahl, und Esc schließt immer die oberste.

2. **Aufbau: feste Ebenen** (neue CSS-Variablen in `ui/styles.css`, `--z-…`)

   | Ebene | z | Elemente (heutiger Wert) |
   |---|---|---|
   | Karte | 0 | `AtlasMap`, `Karte2D` |
   | Kartenschichten | 5 | `.atlas-transport` (5), Effektschicht |
   | Kartenwerkzeuge | 10 | Linsenleiste (`.linsen`, heute 8), Legende, `.karten-werkzeuge` (6) |
   | Schwebende Kartenkarten | 20 | Provinzkarte (`.province-card-float`, heute **4**), Land-Popover, Hover-Kärtchen |
   | Seitenakte | 30 | `.seitenakte` (neu); die Transporttafel `.tr-tafel` (heute 9) wird Inhalt der Linse Netze und rückt als Teil der Bühne auf 30 |
   | Navigation | 40 | `.regierungs-navigation` (heute 100) |
   | Papierakte | 50 | `.dossier` (heute 50, Handy 8) |
   | Kopfleiste | 60 | `.hud.kf` (heute 160 mit offenem Menü) |
   | Tafeln | 70 | Hauptmenü, Werte-Tafel (`.hud-wahl-tafel` 60) |
   | Modale Fenster | 80 | Ereignis, Wahlabend, Umbildung, Wunderfenster |
   | Meldungen | 90 | Chips und Toasts (heute 120) |

3. **Regeln**
   - **R1:** Eine Tafel öffnet nie unter der Navigation. Die Linsenleiste beginnt rechts der Navigation (`left` = Breite der Navigation + 12 px). Heute: `.linsen { left: 96px; z-index: 8 }` (ui/linsen/linsen.css Zeile 5) unter der Navigation (z 100, Breite 200), daher ist die erste Spalte verdeckt (Bild k01).
   - **R2:** Höchstens eine schwebende Kartenkarte zugleich (Provinzkarte **oder** Land-Popover). Die neue schließt die alte.
   - **R3:** Eine schwebende Karte verdeckt nie ihren eigenen Gegenstand (Ansicht 9).
   - **R4:** Die Seitenakte und die Papierakte schließen sich gegenseitig aus.
   - **R5:** Kartenwerkzeuge weichen der Seitenakte aus. Ihr rechter Rand ist der linke Rand der Seitenakte.
   - **R6:** Esc schließt in dieser Reihenfolge: Tafel → modales Fenster (nur wenn es schließbar ist) → schwebende Karte → Länder- oder Konfliktwahl in der Seitenakte → Seitenakte oder Papierakte.
   - **R7:** `UI_SPERREN` (AtlasMap.tsx Zeile 144) enthält alle Ebenen ab 10, damit Kartenbeschriftungen ausweichen.

4. **Zustände:** Handy (≤ 720 px). Die Navigation ist Schalter plus Blatt (heute z 150, navigation.css Zeile 10); sie liegt auf Ebene 40 und unter modalen Fenstern (die Kommentarzeile in navigation.css Zeile 11 beschreibt genau diesen Fehler).

5. **Klicks:** keine eigenen; siehe R6 für Esc.

6. **Übernommen / gelöscht:** Die verstreuten `z-index`-Werte in `styles.css` (Zeile 223, 241, 259, 1741), `navigation/navigation.css`, `linsen/linsen.css`, `atlas/marken.css` (Zeile 105), `gueter/transport.css` (Zeile 15) und `kopf/kopf.css` (Zeile 8) ersetzt die Variablentabelle.

7. **Simulationsbedarf:** keiner.

8. **Texte:** keine.

9. **Abnahme**
   - Neuer Test `test/ebenen-ordnung.test.ts` liest die CSS-Dateien und prüft, dass jeder `z-index` eine der Variablen ist.
   - UI-Test: Linsenleiste und Navigation überschneiden sich nicht (Begrenzungsrechtecke, 1440×900).
   - Provinzkarte und `.karten-werkzeuge` überschneiden sich nicht.

10. **Aufwand und Abhängigkeiten:** **S**. Sofort umsetzbar; Vorbedingung für die Ansichten 1 und 9.

---

## Fehlerliste (aus Kritik D, mit Ort und Behebung)

| # | Fehler | Ort | Behebung |
|---|---|---|---|
| 1 | „Krieg läuft“ schon in Phase Spannung | `ui/militaer/Streitkraefte.tsx` Zeile 179: `...(kriege.length ? { …marke: krieg_laeuft } : {})` | Marke nur bei `kriege.some(k => k.phase === "krieg")`. Sonst `PHASEN_NAME[k.phase]` des schwersten Vorgangs als Marke. |
| 2 | Kopf „Laufende Konflikte 2“, Liste 7 Zeilen | `ui/akte/Bereiche.tsx` Zeile 111–115 (Kopf `aktiveKriege(w).length`) gegen `ui/akte/Konfliktlage.tsx` Zeile 13–21 (Vorgänge plus angespannte) | Beide aus `konfliktLage(w)`. Kopf „Konflikte 2 · Spannung 5“. |
| 3 | EU als Konfliktgegner in der Sicherheitslage | `ui/akte/Konfliktlage.tsx` Zeile 16 | Filter `!ohneKriegsvorgang(l.id)` (sim/krieg.ts Zeile 1350) auch für die Liste der angespannten Länder. Die EU-Spannung bleibt in Außen. |
| 4 | NATO „14 Mitglieder“ statt 32 | `ui/akte/Bereiche.tsx` Zeile 205: `t("akte.b.lage.paktMitglieder", { n: p.mitglieder.length })` | `n = p.mitglieder.length + (institution.weitereMitglieder ?? 0)` aus `data/welt-institutionen.ts` (Zeile 47: NATO `weitereMitglieder: 18`). Gleiches für G20. |
| 5 | Altay „noch 11 Monate“ gegen „fertig in 25 Monaten“ | doppeltes Modell `START_BESCHAFFUNGEN` (data/streitkraefte.ts) gegen Reich-Vorhaben `mil_altay` (data/reich/militaer.ts Zeile 95) | Kopplung (Ansicht 5, Simulationsbedarf). Bis dahin zeigt die Streitkräfte-Karte das Datum aus `bauplan`. |
| 6 | „Was Sie jetzt in Auftrag geben können“ zeigt Vorhaben im Bau | `ui/akte/Bildkarten.tsx` Zeile 29–32 (`rang: bau 0, moeglich 1, verlangt 2`) | Für diesen Block `z !== "bau"` filtern. Die Zahl in „Alle 16 Vorhaben“ (Zeile 81) muss dieselbe Zählweise wie das Unterreiter-Abzeichen haben (heute 16 gegen 8). |
| 7 | KAAN-Kosten als unbeschriftete Symbole (8 · 2.000 · 48 · +0,7 · 2,5) | `ui/akte/Bildkarten.tsx` (Kostenchips) | Jedes Symbol mit Wort: Kapital, Bau, Monate, Haushalt, Verwaltung. |
| 8 | Tasten 1–4 doppelt (Tempo und Linse); die Linse ist bei offenem Ereignis gesperrt, das Tempo nie | `ui/kopf/Kopfleiste.tsx` Zeile 112–128; `ui/linsen/linsen.ts` Zeile 32–33; `ui/Stage.tsx` Zeile 1151 | Tempo auf `+`/`−`/Leertaste; Linsen 1–8; eine gemeinsame Sperrfunktion (Ansicht 8). |
| 9 | Hauptmenü und Linsenwechsel halten die Zeit nicht an | `ui/kopf/Kopfleiste.tsx` Zeile 183 (`offen` ohne Rückmeldung); Stage.tsx `onEbene` Zeile 1148 | `onMenue` mit Pause und Fortsetzen; Pause bei Linsenwechsel (Ansicht 8). |
| 10 | Linsentafel unter der Navigation | `ui/linsen/linsen.css` Zeile 5 (`left: 96px; z-index: 8`) gegen `navigation.css` Zeile 3 (`z-index: 100`, Breite 200) | Ebenenordnung R1. |
| 11 | Provinzklick bei offener Versorgungstafel zeigt nichts | `.province-card-float` z 4 (styles.css Zeile 259) unter `.tr-tafel` z 9 (gueter/transport.css Zeile 15), gleiche Ecke rechts oben | Ebenenordnung und Andocken an der Provinz (Ansicht 9). |
| 12 | Provinzkarte verdeckt die gewählte Provinz (Mardin) und wird von „Marken auf der Karte“ überdeckt | `.province-card-float` (rechts fest) und `.karten-werkzeuge` z 6 (atlas/marken.css Zeile 105) | Andocken (Ansicht 9), Ebene 20 über den Werkzeugen. |
| 13 | 2D-Karte: keine Namen, keine Flaggen, keine Warenwege, kein Weltausschnitt | `ui/atlas/AtlasMap.tsx` Zeile 1335 reicht nur 6 Eigenschaften an `Karte2D` durch; `data/nachbarn.json` endet bei 17,5–52,5° O | `labels`, `laenderPins`, `linien`, `ringe`, `versorgung` und `sichtRand` an Karte2D. Weltgeometrie als Datenlücke (Ansicht 1). Im Rundgang war die 2D-Karte aktiv („Vereinfachte Karte“); viele Befunde in k00–k-v gehen darauf zurück. |
| 14 | Kopfleiste zeigt die wahre Zustimmung (50 %), die Zeitung die veröffentlichte (54,2 %) | `ui/Stage.tsx` Zeile 429 (`spiel.umfrage.zustimmung`) gegen `angezeigteZustimmung(w)` (sim/medien.ts Zeile 863, „Was die Oberfläche als Zustimmung zeigt“) | Entscheidung nötig (offene Frage 1). Bis dahin beide Werte benennen. |
| 15 | „Zum Vergleich“ mit Türkei-Werten von 2025 (Inflation 34,9 %) | `ui/Welt.tsx` (`daten from "../data/vergleich.json"`) | Die Türkei-Spalte entfällt oder nimmt die Spielwerte (Kopfleiste); die Gegenseite bleibt mit Jahresangabe unter „Hintergrund“. |
| 16 | Wiederholter Text „Letzte Wahl“ = „Was sich zuletzt geändert hat“ | `ui/welt/WeltLage.tsx` (`letzteWahl` und `jungeNachrichten` zeigen denselben Machtwechsel) | Den Eintrag aus `jungeNachrichten` mit `art: "machtwechsel"` nicht zeigen, wenn `letzteWahl` denselben Tag hat. |
| 17 | Bilanzkurven zeigen in Außen und Sicherheit nur die Zustimmung, Achse 50–52 | `ui/akte/Bereiche.tsx` `verlaufsReihen` (Zeile 374–392) | Reiter entfällt (Ansicht 1). Bis dahin beginnt die y-Achse bei 0 oder trägt das Etikett „Ausschnitt“. |
| 18 | Zwei Wehrdienst-Hebel | `m_wehrdienst` (data/politiknetz.ts Zeile 1373) und `setzeWehrdienst` (sim/streitkraefte.ts Zeile 381) | Auf einen festlegen (offene Frage 2). |
| 19 | „Das Kriegsziel umfasst 1 Regionen“ | Katalog `militaer.*` (i18n/katalog/de/militaer.json) | Pluralform (`_one`/`_other` bzw. Zahlwort). |
| 20 | Sidebar-Zähler Medien zählt jede ungelesene Ausgabe (22, 24 …) | `ui/Stage.tsx` Zeile 598 (`umlauf: spiel.zeitung.ungelesen`) | ruhiger Punkt ohne Zahl. |
| 21 | Linsen Arbeitslosigkeit, Akute Probleme und Katastrophenrisiko gleich rot | `ui/ebenen.ts` `farbenFuerEbene` (Verläufe) | Farbfamilien je Linse (Ansicht 7), Test auf Verschiedenheit. |
| 22 | Versorgungswege: „24 Korridore“, aber keine Linie (2D) | Karte2D ohne `versorgung` | siehe 13. |

## Offene Fragen (höchstens fünf)

1. **Zustimmung in der Kopfleiste.** Die Sim unterscheidet bewusst zwischen der wahren Zustimmung (`umfrage.zustimmung`) und der veröffentlichten (`angezeigteZustimmung`, mit Institut, Streuung und gekauften Rohdaten). Die Kopfleiste zeigt heute die wahre Zahl und macht damit die Mechanik „Rohdaten kaufen“ wertlos. Soll die Kopfleiste die veröffentlichte Zahl zeigen (mit Institut) und die wahre nur nach dem Kauf der Rohdaten?
2. **Wehrdienst.** Gilt die Maßnahme `m_wehrdienst` (Stufe 0–100) oder `setzeWehrdienst` (0, 6, 12 oder 18 Monate)? Vorschlag: Die Maßnahme ist führend, die Stufen werden auf die vier Monatswerte abgebildet.
3. **Putschneigung des Generalstabs.** Soll sie als dauernde Zahl im Kopf der Sicherheit stehen? Heute gibt es sie nur als `putsch`-Ereignis nach einer Niederlage (krieg-typen.ts). Eine Dauergröße wäre eine neue Spielregel.
4. **Rundfunkaufsicht (RTÜK) und Kommunikationsdirektion** als Personen? Beide sind keine Ministerien. Ohne Figur bleiben in den Medien nur Präsidialamt und Inneres als Porträts.
5. **„Besuch“ in der Provinzkarte.** Soll es einen Provinzbesuch des Präsidenten geben (heute nur im Wahlkampf, `test/wahlkampf-reisen.test.tsx`)? Wenn nicht, hat die Provinzkarte nur „Bauen“ und „Problem angehen“.
