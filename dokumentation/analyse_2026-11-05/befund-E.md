# Befund E: Gesellschaft, Wähler, Opposition, Medien, Wahlen

Prüfer E, 5. November 2026. Maßstab: `AUFTRAG.md`.

**Grundlage:**
- **Rundgangsbilder:** 022, 023, 024, 040 und 041.
- **Eigene Bilder:** 31 Aufnahmen unter `/private/tmp/claude-501/-Users-yusufyeneroglu/904f44f4-7b5f-44c2-9447-c69e44ab880b/scratchpad/analyse-E/`.
  - Die Unterreiter Lage, Opposition und Rathäuser.
  - Die Wählerkoalition mit allen Klappen offen.
  - Die Medienakte.
  - Die Zeitung nach einem Monat (`e1.cjs` bis `e3.cjs`).
- **Eigene Messung:** `analyse-E/wahl.test.ts`, eine einzelne Testdatei, keine Suite.
  - Vier Samen, je einmal mit und einmal ohne Duellvorbereitung.
  - Die Wahl wird 70 Tage nach Amtsantritt vorgezogen, damit sie bei der Startzustimmung von etwa 51 % stattfindet.
  - Offene Ereignisse werden täglich verworfen. Außer der Duellvorbereitung gibt es keine Handlung.
  - Ergebnis in `analyse-E/wahl.json`.
- **Code und Texte, vollständig gelesen:**
  - Oberfläche: `ui/Waehler.tsx`, `ui/waehler/*`, `ui/gesellschaft/GesellschaftAkte.tsx`, `ui/MedienAkte.tsx`, `ui/Zeitung.tsx`, `ui/Wahlkampf.tsx`, `ui/Wahlversprechen.tsx`, `ui/wahl/Wahlabend.tsx`, `ui/akte/Bereiche.tsx`.
  - Simulation: `sim/wahl.ts`, `sim/wahlkampf.ts`, `sim/waehler*.ts`, `sim/medien.ts`, `sim/gesellschaft.ts`, `sim/opposition.ts`, `sim/bewegungen.ts`, `sim/kommunen.ts`, `sim/zynismus.ts`, `sim/umfrage.ts`, `sim/ereignisse-wahl.ts`.
  - Kataloge: `gesellschaft`, `medien`, `wahl`, `wahlreise`, `wahlversprechen` und `zynismus` sowie die Schlüssel `wa.`, `wd.`, `hk.`, `ui.Waehler`, `ui2.ui.Wahlkampf`, `sim2.sim.wahlkampf` und `ui2.ui.Zeitung`.
- **Englisch und Türkisch:** Alle 894 Schlüssel des Bereichs sind vorhanden. Nur `medien.chronik.blackout` ist im Englischen gleich geblieben.

**Gutes, das bleiben soll:**
- Die Ursachenkette einer Wählergruppe und die Vorschau mit acht Modellläufen und Spanne.
- Das Umfragesystem mit Instituten, Hauseffekt, Angstklima, „Schublade“ und gekauften Rohdaten. Das ist eine eigenständige und kluge Mechanik.
- Das Gedächtnis von Groll, Märtyrern und Repression.
- Die Stichwahl als Entscheidung mit Preis: Wer um die Wähler des Dritten wirbt, schuldet dessen Partei eine Zusage.
- Die Inszenierung des Wahlabends mit Hochrechnung in Stufen, Provinzkarte und zwei Halbrunden.
- Die Zwangsverwalter (Kayyum) und die Auftrittsverbote im Ausland als realitätsnahe Härten.
- Die Kommunalwahl am 25. März 2029 und die Rathausverteilung, die zum Stand von 2024 passt.

---

## 1. Ansichten

**Wählerkoalition** (022, eigene `waehler-0…4`, `rentner-*`)
- **Frage der Seite:** Gewinne ich die nächste Wahl, und um wen muss ich werben?
- **Antwort:** teilweise. Oben steht „Wenn heute gewählt würde: 51 %“, aber das ist die Zustimmung, nicht der Stimmenanteil (E-1).
- **Länge:** 2,0 Bildschirme zugeklappt, 4,0 aufgeklappt (3041 px).
- **Noten:** Schönheit 2 · Verständlichkeit 4 · Sinn 3 · Spielgefühl 3
- **Urteil:** Das reichste Werkzeug des Bereichs. Es täuscht aber über die Wahl, und seine schnellen Schätzungen widersprechen der eigenen Vorschau.

**Opposition & Straße › Straße** (023)
- **Frage der Seite:** Wer protestiert, und wie antworte ich?
- **Antwort:** nein. Bei Ruhe steht nur ein Satz auf leerer Fläche, es gibt kein Bild.
- **Länge:** 1,0 Bildschirme.
- **Noten:** Schönheit 4 · Verständlichkeit 3 · Sinn 3 · Spielgefühl 4
- **Urteil:** Es ist ein dritter Navigationsrang, der beim Start leer ist. Die Antworten auf Bewegungen haben verborgene Wirkungen (E-16).

**Opposition & Straße › Lage** (eigene `ges-Lage-*`)
- **Frage der Seite:** Wie gespalten und unruhig ist das Land?
- **Antwort:** teilweise. Sechs Kacheln zeigen Zahlen, aber jede trägt denselben Satz „Noch zu wenig Verlauf“.
- **Länge:** 1,3 Bildschirme.
- **Noten:** Schönheit 3 · Verständlichkeit 3 · Sinn 4 · Spielgefühl 4
- **Urteil:** Die Ansicht wiederholt den Kopf und „Stimmung im Land“. Unter den Milieus stehen interne Kennungen.

**Opposition & Straße › Opposition** (eigene `ges-Opposition-*`)
- **Frage der Seite:** Wie stark ist die Opposition, und was kann ich gegen sie tun?
- **Antwort:** teilweise. Porträt und Stärkebalken sind da, aber die Stärke wirkt nicht auf die Wahl (E-3).
- **Länge:** 1,4 Bildschirme.
- **Noten:** Schönheit 2 · Verständlichkeit 3 · Sinn 4 · Spielgefühl 3
- **Urteil:** Die Instrumente sind gut beschrieben und haben einen Preis. Ihr Hauptzweck verpufft jedoch vor der Wahl.

**Opposition & Straße › Rathäuser** (eigene `ges-Rathäuser-*`)
- **Frage der Seite:** Wer regiert die Städte, und wo greife ich ein?
- **Antwort:** nein. 81 gleiche Kästchen mit 71 gleichen Knöpfen, keine Karte.
- **Länge:** 2,2 Bildschirme.
- **Noten:** Schönheit 4 · Verständlichkeit 3 · Sinn 3 · Spielgefühl 4
- **Urteil:** Ein Formular statt einer Karte. Ein einziger Klick löst einen schweren Eingriff aus, ohne Rückfrage.

**Stimmung im Land** (024)
- **Frage der Seite:** Wie ist die Lage der Gesellschaft auf einen Blick?
- **Antwort:** teilweise. „Lage: angespannt · Auffällig: Polarisierung: 75“, darunter vier Milieu-Kacheln.
- **Länge:** 1,0 Bildschirme.
- **Noten:** Schönheit 3 · Verständlichkeit 3 · Sinn 3 · Spielgefühl 3
- **Urteil:** Ordentlich, aber eine Doppelung der Milieus aus „Lage“. Es fehlt ein Bild, etwa eine Karte von Groll und Protest.

**Medien › Zeitung** (040 zum Start, eigene `zeitung-*` nach einem Monat)
- **Frage der Seite:** Was schreibt die Presse über mich?
- **Antwort:** zum Start nein, die Fläche ist leer. Nach einem Monat ja.
- **Länge:** 1,0 Bildschirme (Start), 2,6 Bildschirme (Juli).
- **Noten:** Schönheit 2 · Verständlichkeit 3 · Sinn 3 · Spielgefühl 2
- **Urteil:** Gute Bühne mit Kopf, Kommentar und „Nicht in dieser Ausgabe“. Die Blätter unterscheiden sich aber kaum, und sie sprechen in Spielindizes (E-23).

**Zeitung › Medien** (Medienakte, eigene `medienakte-*`)
- **Frage der Seite:** Wie steuere ich die Medien, und was kostet es?
- **Antwort:** teilweise. Sieben Karten zeigen Balken, darunter stehen Eingriffe mit Preis.
- **Länge:** 3,1 Bildschirme.
- **Noten:** Schönheit 3 · Verständlichkeit 3 · Sinn 3 · Spielgefühl 3
- **Urteil:** Das Kernwerkzeug der Medienpolitik liegt drei Ebenen tief. Es kennt nur Druck und Zuwendung, keinen Rückweg.

**Medienlage** (041)
- **Frage der Seite:** Wie frei ist die Presse?
- **Antwort:** teilweise. „Lage: angespannt · Pressefreiheit: 29,4“.
- **Länge:** 1,0 Bildschirme.
- **Noten:** Schönheit 3 · Verständlichkeit 3 · Sinn 3 · Spielgefühl 4
- **Urteil:** Lesbar, aber ohne Bild. Die Gruppennamen weichen von den Blattnamen der Zeitung ab.

**Wahlkampf-Zentrale** (nur Code; im Bild nicht erreichbar, siehe Abschnitt „Nicht geprüft“)
- **Frage der Seite:** Was bringt mir jede Woche bis zur Wahl?
- **Antwort:** teilweise. Kopf mit Aktionspunkten und „Schlussspurt bislang“. Die Reisen fehlen in dieser Summe (E-5).
- **Länge:** nicht gemessen.
- **Noten:** Schönheit nicht gesehen · Verständlichkeit 3 · Sinn 3 · Spielgefühl 3
- **Urteil:** Die Bausteine sind vielfältig: Reisen, Touren, Duell, Versprechen. Die Wirkung bleibt aber unsichtbar, und auf Angriffe kann man nicht antworten.

**Wahlabend** (nur Code)
- **Frage der Seite:** Habe ich gewonnen, und warum?
- **Antwort:** „ob“ ja. „Warum“ nur teilweise, denn der Ausgangswert und der Zufall fehlen (E-34).
- **Länge:** nicht gemessen.
- **Noten:** Schönheit nicht gesehen · Verständlichkeit 3 · Sinn 2 · Spielgefühl 2
- **Urteil:** Starke Inszenierung. Die Rechnung von der Zustimmung zum Ergebnis ist aber nicht nachvollziehbar.

---

## 2. Befunde

**Schwere:** 1 = bricht Sinn oder Spiel, 2 = deutlich störend, 3 = Feinschliff.

### Schwere 1

**E-1 · Zahl / Logik · Schwere 1 · Aufwand mittel**
- **Ort:** Wählerkoalition › Barometer und Kopfleiste. `ui/Waehler.tsx:42-44`, Schlüssel `medien.barometer.kopf`, `medien.barometer.text_*`, `st.zustimmung.tip`, `medien.chronik.schwelle`; Rechnung in `sim/wahl.ts:204-232`.
- **Befund:** Die Ansicht sagt „Wenn heute gewählt würde 51 %“ und „nötig sind 50“. Die Kopfleiste sagt „Wie viele Wähler Sie heute wieder wählen würden … ab 50 Prozent gewinnen Sie“, die Chronik „50 Prozent: Wahlsieg“.
  - Gewählt wird aber mit Zustimmung + Wahlkampfeffekte − Versprechensschuld + Zufall (σ 2,2) + Gegnereinfluss.
  - **Messung bei rund 51 % Zustimmung ohne Vorbereitung:** 50,8 / 39,9 / 39,5 / 42,1 % der Stimmen; drei von vier Läufen verloren.
  - **Mit Duellvorbereitung:** 54,9 / 44,0 / 43,6 (Stichwahl 48,2) / 46,2 (Stichwahl 48,6); drei von vier verloren.
- **Warum es stört:** Der Spieler sieht 51 % „wenn heute gewählt würde“ und verliert mit 40 %. Das wirkt wie Betrug, nicht wie Politik.
- **Vorschlag:** Das Barometer zeigt zwei Größen:
  - die Zustimmung,
  - das „erwartete Wahlergebnis heute“ als Spanne, mit Zustimmung, Wahlkampfeffekten und Gegnereinfluss.
  - **Neufassung von `medien.barometer.kopf`:** „Zustimmung zur Regierung“.
  - **Neuer Satz:** „Erwartetes Ergebnis, wenn heute gewählt würde: {von} bis {bis} Prozent. Zum Sieg im ersten Wahlgang brauchen Sie über 50 Prozent der Stimmen, nicht der Zustimmung.“
  - **Neufassung von `st.zustimmung.tip`:** „Wie zufrieden das Land mit Ihrer Regierung ist. Die Wahl ist in {n} Monaten; was am Wahltag zählt, zeigt die Wählerkoalition.“
  - `medien.chronik.schwelle` → „50 Prozent der Stimmen: Sieg im ersten Wahlgang“.

**E-2 · Sinn / Logik · Schwere 1 · Aufwand mittel**
- **Ort:** Wahlkampf › Gegenseite. `sim/wahlkampf.ts:689-722` (`angriffWoche`), Konstanten `:86-93`, Anzeige `ui/Wahlkampf.tsx:212-222`.
- **Befund:** Die Angriffe der Opposition summieren sich jede Woche bis zur Deckelung von −6 Prozentpunkten. In allen acht Messläufen war die Deckelung nach vier Wochen erreicht.
  - Grund: Wohnungsnot ist ab Start in acht Provinzen akut und in acht Wochen nicht zu beheben.
  - Es gibt keine Gegenhandlung, weder Antwort noch Richtigstellung noch Gegenangriff. Im ganzen Code gibt es keinen Schreibzugriff auf `angriffe` außer dem Abzug.
- **Warum es stört:** Das ist ein fester Abzug ohne Entscheidung, also das Gegenteil von „hinter jeder Entscheidung muss etwas stecken“.
- **Vorschlag:** Jeder Angriff wird eine Karte mit drei Antworten:
  - **„Ortstermin im Brennpunkt“** (2 Aktionspunkte): halbiert den Angriff, hat Risiko.
  - **„Gegendarstellung in den Hausmedien“** (1 Aktionspunkt): wirkt nur bei Wählern regierungsnaher Blätter.
  - **„Gegenangriff“** (1 Aktionspunkt): +Polarisierung, kann kippen.
  - Dazu eine Vorwarnung zwei Monate vor dem Wahlkampf: „Die Opposition wird vor allem die Wohnungsnot angreifen (8 Provinzen).“

**E-3 · Logik · Schwere 1 · Aufwand klein**
- **Ort:** Opposition › Stärke und Instrumente. `sim/gesellschaft.ts:293-299` (`gesellschaftWahlDruck`), `sim/wahl.ts:179-190`.
- **Befund:** `gesellschaftWahlDruck` (Oppositionsstärke, Groll, Märtyrer) ist definiert, wird aber nirgends aufgerufen; die Suche nach Aufrufen ist leer.
  - Die Wahl kennt vom Gegner nur die Fähigkeit seines Führers und die Lagersitze.
  - „Ermittlungen gegen die Führung“ verspricht „Opposition sofort geschwächt“ und „Stärke sofort −6“. Die Stärke wirkt aber nur auf den Druck der Oppositionsbewegung (`sim/bewegungen.ts:112`).
- **Warum es stört:** Der Spieler bezahlt Kapital, Ansehen und EU-Vertrauen, um einen Gegner zu schwächen, der bei der Wahl gar nicht schwächer ist. Das ist Schau.
- **Vorschlag:**
  - `gesellschaftWahlDruck` in `ersterWahlgang` als Einfluss „Stärke der Opposition“ buchen.
  - In der Karte „Ihre Instrumente“ ergänzen: „Wirkung auf die nächste Wahl: etwa {d} Punkte“.

**E-4 · Zahl / Logik · Schwere 1 · Aufwand mittel**
- **Ort:** Wählerkoalition › „Die wirksamsten Schritte …“ und „Was jetzt helfen würde“. `sim/waehler-detail.ts:651-695` (`schritteFuerZustimmung`), `:8` und `:684` („langfristig“ = Gleichgewicht ohne Deckel), `ui/waehler/HilfeKarte.tsx:51-59`.
- **Befund:** „Ausnahmezustand und Sonderbefugnisse einschränken von 10 auf 0: Zustimmung +6,7 Punkte bis zur Wahl (nach einem Jahr −0,1, langfristig +28,8). Am meisten gewinnt Minderheiten (+12,0).“
  - Die eigene „Vorschau in zwölf Monaten“ derselben Karte rechnet: Minderheiten +1,6; Vertrauen in die Regierung ±0.
  - Die schnelle Schätzung übergeht außerdem die Dämpfung über 50 Prozent (`sim/spiel.ts:174-175`) und die Wirtschaft.
  - „+28,8 Punkte Zustimmung“ aus einem einzigen Regler ist unplausibel.
- **Warum es stört:** Zwei Zahlen auf einer Karte widersprechen sich um den Faktor 7. Der Spieler kann der Wirkungsanzeige nicht trauen.
- **Vorschlag:**
  - „langfristig“ streichen.
  - Die Schnellschätzung durch die Dämpfung aus `zielZustimmung` schicken.
  - Den Wert „bis zur Wahl“ als Spanne zeigen, oder sofort die Vorschau rechnen.
  - **Neufassung von `hk.bisWahl`:** „bis zur Wahl, grob geschätzt; die Vorschau rechnet genauer.“

**E-5 · Logik / Erklärung · Schwere 1 · Aufwand mittel**
- **Ort:** Wahlkampf › Reisen. `sim/wahlkampf.ts:250-296`, `:778-789` (`wahlEffekte`), `sim/spiel.ts:399-400`, `sim/umfrage.ts:50`.
- **Befund:** Eine Reise hebt nur das örtliche Vertrauen. Die Wahl rechnet mit `umfrage.zustimmung`, und dieser Wert folgt nur am Monatsersten zu 35 % dem Sollwert.
  - Reisen nach dem 1. Juni vor einer Wahl am 5. Juni wirken nicht mehr.
  - Frühere Reisen wirken nur teilweise.
  - In „Schlussspurt bislang“ tauchen Reisen gar nicht auf; dort stehen nur Duell, Angriffe, Diaspora und Auftritte.
  - Der Text sagt ehrlich „Das sind keine landesweiten Wahlprozentpunkte“ (`wahlreise.wirkung`), übersetzt aber nie in Stimmen.
- **Warum es stört:** Der Spieler sieht nicht, ob Wahlkampf wirkt. Die Hauptaktion mit 81 Zielen bleibt ohne sichtbare Folge.
- **Vorschlag:**
  - Jede Reise zeigt „≈ +{x} Prozentpunkte am Wahltag (Ankara hat {p} % der Wähler)“.
  - Die Summe der Reisen steht in „Schlussspurt bislang“.
  - Die Wahl rechnet mit dem aktuellen Sollwert, nicht mit dem trägen Monatswert (oder mit dem Mittel aus beiden).

### Schwere 2

**E-6 · Funktion · Schwere 2 · Aufwand klein**
- **Ort:** Medienakte und Gesellschaftsakte. `ui/Stage.tsx:954` (`<Zeitung … />` ohne `onAenderung`), `ui/Stage.tsx:1073` (`<GesellschaftAkte … />` ohne `refresh` und `sichere`).
- **Befund:** Instrumente der Opposition, Antworten auf Bewegungen, Zwangsverwalter und Medieneingriffe lösen weder Neuzeichnen der Bühne noch Sichern aus.
  - Gemessen: Kapital 71 vor und nach „Pressekonferenz anordnen“ (`analyse-E/e1.json`, `kopf`).
- **Warum es stört:** Die Kopfleiste zeigt veraltete Werte. Wird die Seite vor der nächsten automatischen Sicherung neu geladen, ist der Eingriff vermutlich verloren (Vermutung, nicht ausprobiert).
- **Vorschlag:** `onAenderung={() => { refresh(); sichere(true); }}` an Zeitung und Gesellschaftsakte durchreichen, wie bei `WahlkampfZentrale`.

**E-7 · Konsistenz / Sinn · Schwere 2 · Aufwand mittel**
- **Ort:** Navigation. `ui/Stage.tsx:528-540`, `:602-609`, `ui/gesellschaft/GesellschaftAkte.tsx:242-249`, `ui/Zeitung.tsx:415-424`.
- **Befund:** Es gibt drei Ebenen:
  - Gesellschaft › Opposition & Straße › Lage | Opposition | Straße | Rathäuser.
  - Medien › Zeitung › Ausgaben | Medien.
  - Die Medienpolitik liegt hinter dem Unterreiter „Medien“ in der Zeitung. Zum Start öffnet „Medien“ auf eine leere Seite (040).
- **Warum es stört:** Das verletzt Regel 3 und Regel 9 („wo finde ich diese Akten“). Das mächtigste Werkzeug des Bereichs ist versteckt.
- **Vorschlag:**
  - **Gesellschaft:** Reiter „Wählerkoalition | Opposition | Straße | Rathäuser“. Der Unterreiter „Lage“ entfällt (er doppelt „Stimmung im Land“).
  - **Medien:** Reiter „Zeitung | Medien steuern“.

**E-8 · Konsistenz · Schwere 2 · Aufwand klein**
- **Ort:** Mehrere Ansichten. `ui/akte/Bereiche.tsx:85-94`, `:180-186`, `ui/gesellschaft/GesellschaftAkte.tsx:32-76`, `ui/MedienAkte.tsx:126-136`.
- **Befund:** Dasselbe steht mehrfach da:
  - Die Zustimmung dreimal auf einem Bildschirm: Kopfleiste, Aktenkopf, Barometer.
  - Polarisierung und Protestdruck im Kopf und noch einmal als Kacheln in „Lage“.
  - Die Milieus in „Stimmung im Land“ und in „Opposition & Straße › Lage“.
  - In der Medienakte die Pressefreiheit „29,4“ im Kopf, in „Rang 159 · Wert 29,4“ und in „Zum Start: Rang 159, Wert 29,4“.
  - Dazu die Überschrift „Medien“ unter dem Titel „Medien & Öffentlichkeit“.
- **Warum es stört:** Das verletzt Regel 8. Die Seiten werden lang, und der Blick findet keinen Anker.
- **Vorschlag:**
  - Kopfwerte nur im Kopf.
  - Die Medienakte beginnt mit den Karten der Blätter.
  - Die Pressefreiheit steht als Ring mit Verlauf allein im Kopf.

**E-9 · Sprache · Schwere 2 · Aufwand klein**
- **Ort:** Opposition & Straße › Lage › Milieus. `ui/gesellschaft/GesellschaftAkte.tsx:69`.
- **Befund:** „Stärkste Ursachen: ausnahmerecht +8 · minderheitenrechte −3.7“ und „integration −5.3 · rueckkehr +3“.
  - Das sind interne Knotenkennungen, kleingeschrieben, mit englischem Dezimalpunkt.
  - „ausnahmerecht +8“ liest sich, als sei das Ausnahmerecht gestiegen. Gemeint ist, dass es niedrig steht und den Kurden nützt.
- **Warum es stört:** Das verletzt Regel 10. Es ist unlesbar und irreführend.
- **Vorschlag:** Den Knotennamen aus dem Netz verwenden und die Wirkung als Satz schreiben, zum Beispiel: „Hilft: wenig Ausnahmerecht (+8). Schadet: schwache Minderheitenrechte (−4).“

**E-10 · Übersetzung · Schwere 2 · Aufwand mittel**
- **Ort:** Fest verdrahtetes Deutsch. Fundstellen:
  - `ui/waehler/Kette.tsx:10-12`: „kaum verändert“, „Stufen höher als zu Beginn“, „Punkte über dem Ausgangswert“.
  - `ui/Zeitung.tsx:36` (Spartennamen), `:38` (`de-DE`), `:236` („geduldet“), `:246` („Im Parlament:“), `:313` („Befragte“, „Methode“), `:482-483` („Nr.“, „EIL“).
  - `ui/Wahlkampf.tsx:155` („AP“), `:168` („fest“), `:175` und `:225-226` („TV-Duell“, „Umfrage-Ticker“).
  - `sim/wahlkampf.ts:255` („Unbekannte Provinz.“), `:283` (Satzstück „, und weil die Lage …“), `:288` („Lokales Vertrauen“), `:611-614` („der Bilanz“, „Ohne die Proben …“), `:639` („TV-Duell: … Prozentpunkte“), `:706-707` und `:714` („greift an“, „Provinz/Provinzen“), `:742` („Der Wahlkampf beginnt“).
  - `sim/wahlkampf.ts:603` und `:609`: Der reguläre Ausdruck `/^Oppositionsführer /` greift nur im Deutschen.
- **Befund:** Englische und türkische Spieler sehen deutsche Wörter. Im Duelltext steht die Rolle im Namen.
- **Warum es stört:** Das verletzt Regel 11.
- **Vorschlag:** Alles in die Kataloge verlegen. Den Namen ohne Rolle übergeben, statt ihn mit einem regulären Ausdruck zu schneiden.

**E-11 · Sprache · Schwere 2 · Aufwand klein**
- **Ort:** Wahlkampf › Gegenseite, `ui2.ui.Wahlkampf.1963a80`.
- **Befund:** „Ihre Angriffe treffen dort, wo echte Probleme rot stehen“. Weil der Spieler mit „Sie“ angesprochen wird, heißt „Ihre“ hier „Ihre eigenen“. Gemeint sind die Angriffe der Gegenseite.
  - Englisch („Your attacks“) und Türkisch („Saldırılarınız“) übernehmen den Fehler.
- **Warum es stört:** Der Spieler glaubt, er greife an.
- **Vorschlag:** „Die Angriffe der Gegenseite treffen dort, wo echte Probleme rot stehen: bislang {p0} Prozentpunkte.“ Englisch: „The opposition's attacks …“. Türkisch: „Muhalefetin saldırıları …“.

**E-12 · Sinn · Schwere 2 · Aufwand groß**
- **Ort:** Zwei Gesellschaftsmodelle. `sim/gruppen.ts:4-21`, `sim/gesellschaft.ts:59-113`.
- **Befund:** Es gibt elf Wählergruppen mit „Laune“, darunter „Minderheiten“. Daneben gibt es fünf Milieus mit „Stimmung“ und „Groll“: „Kurdinnen und Kurden“, „Aleviten“, „Frauen“, „Geflüchtete“, „Diaspora“.
  - Beide Modelle stehen nebeneinander.
  - Frauen sind ein „Milieu“ neben der Diaspora.
  - Der Groll fehlt in der Wählerkoalition.
  - Eine Mitgliedschaft in mehreren Gruppen wie bei Democracy 4 (eine Rentnerin ist zugleich konservativ und arm) gibt es nicht. Die Gruppen sind getrennte Anteile, die zusammen 100 % ergeben.
- **Warum es stört:** Der Spieler weiß nicht, ob er um „Minderheiten“ oder um „Kurden“ werben soll. Groll und Laune widersprechen sich, etwa Kurden mit Stimmung 56 neben Minderheiten mit Laune 50.
- **Vorschlag:** Die Milieus als Untergruppen in die Wählerkoalition holen. Das Kreisfeld zeigt bei „Minderheiten“ zwei Teilkreise, Kurden und Aleviten, mit Grollring. Die Frauen werden eine Querlinse über alle Gruppen („Frauen in allen Gruppen: Stimmung 38“).

**E-13 · Zahl · Schwere 2 · Aufwand klein**
- **Ort:** Wählerkoalition › Gruppendetail. Schlüssel `wd.faktenTraegt`, `sim/gruppen.ts:4-16`.
- **Befund:** „Gewicht 11 % der Wähler“ (Junge Erwachsene), „13 %“ (Rentner). Im Code steht „Spielparameter“, in der Oberfläche eine Tatsache.
  - Nach meiner Kenntnis (Vermutung, Quelle prüfen) sind die 18- bis 29-Jährigen etwa ein Fünftel der Wahlberechtigten (YSK 2023). Rentenempfänger der SGK zählen rund 16 Millionen, also etwa ein Viertel der Wählerschaft.
- **Warum es stört:** Das verletzt Regel 6. Die Türkei 2028 wird unglaubwürdig, wenn Rentner leichter wiegen als Beschäftigte und Junge kaum zählen.
- **Vorschlag:** Mit YSK- und TÜİK-Zahlen kalibrieren oder in der Oberfläche als „Gewicht in der Zustimmung“ ohne Prozent der Wähler bezeichnen. Neufassung: „Zählt für Ihre Zustimmung: großes Gewicht.“

**E-14 · Design · Schwere 2 · Aufwand mittel**
- **Ort:** Wählerkoalition › Kreisfeld. `ui/waehler/Kreisfeld.tsx:17`, `ui/waehler/waehler.css:272`.
- **Befund:**
  - Die Kreise sind 26 bis 32 px groß. Das Gewicht ist kaum ablesbar.
  - Die Zahlen in den Kreisen sind 11 px groß (Rundgang: „Schrift unter 11,5 px: 5“).
  - Zum Start liegen zehn von elf Gruppen zwischen 50 und 56 in „schwankend“.
  - Die Legende sagt „10 % tragen Sie, 90 % schwanken, 0 % haben sich abgewandt“, während die Zustimmung 51 % beträgt.
- **Warum es stört:** Das Bild beantwortet die Frage „wer trägt mich“ nicht. Die Legende widerspricht der Zahl darüber.
- **Vorschlag:**
  - Die Kreisfläche proportional zum Gewicht wählen, von 18 bis 56 px.
  - Die Zahlen mindestens 13 px groß setzen.
  - Die Zone „schwankend“ in „neigt zu Ihnen“ (50–58) und „neigt weg“ (45–50) teilen.
  - Neben der Legende einen Satz: „Bei 51 Prozent Zustimmung tragen Sie nur wenige fest; die Wahl entscheidet sich bei den Schwankenden.“

**E-15 · Logik · Schwere 2 · Aufwand mittel**
- **Ort:** Medienakte › Eingriffe. `sim/medien.ts:552-568` (`auswirkungen`), `sim/spiel.ts:163` und `:175`.
- **Befund:** Jeder Repressionspunkt hebt `vertrauen_regierung` um 0,45 und die Konservativen um 0,3. Er senkt die Städter um 0,35 und die Jungen um 0,25.
  - Mit den Gewichten der Zustimmung (0,45 Vertrauen, 0,25 Gruppen, Dämpfung 0,65) bringt ein Blackout (Pressefreiheit −3) sofort etwa +0,4 Punkte Zustimmung. Das ist meine Rechnung aus dem Code, nicht gemessen.
  - Der Preis (Ansehen, EU, Märkte) landet nicht bei den Wählern.
  - Die Vorschau der Eingriffe nennt weder den Gewinn noch die verärgerten Gruppen.
- **Warum es stört:** Unterdrückung lohnt sich in den Umfragen. Es gibt eine „richtige Antwort“, und die heißt zensieren.
- **Vorschlag:**
  - Die Vorschau zeigt „Zustimmung kurz +0,4 · Säkulare Städter −1,1 · Junge −0,8 · Ansehen −0,8“.
  - Die Kontrollrendite kehrt nach zwei bis drei Monaten in einen Vertrauensverlust um, wenn das Ausweichen in soziale Netze über 30 steigt.

**E-16 · Logik / Funktion · Schwere 2 · Aufwand klein**
- **Ort:** Straße › Antworten auf Bewegungen. `sim/bewegungen.ts:233`, `:279-302`; Anzeige `ui/gesellschaft/GesellschaftAkte.tsx:164-171`.
- **Befund:** Die Antworten haben Wirkungen, die nirgends stehen:
  - Sie verschieben die Zustimmung direkt: Zugeständnis +0,6, Polizei −0,8, Verbot −1,5.
  - Bei Polizei oder Verbot kommt es mit 30 % Wahrscheinlichkeit zu Opfern (−1,5).
  - Ein Zugeständnis hebt eine echte Maßnahme um fünf Stufen, etwa den Mindestlohn, und belastet damit den Haushalt.
  - Die Vorschau nennt nur „Größe, Radikalität, Märtyrer“.
- **Warum es stört:** Das verletzt Regel 4 und Regel 7. Der Spieler bezahlt einen Mindestlohn, ohne es zu wissen.
- **Vorschlag:** Die Antwortkarte bekommt drei Zeilen:
  - „Zustimmung +0,6“
  - „Mindestlohn steigt um 5 Stufen (≈ {x} % des BIP)“
  - „Opferrisiko 30 %“

**E-17 · Sinn (Möglichkeiten) · Schwere 2 · Aufwand mittel**
- **Ort:** Medienakte und Rathäuser. `sim/medien.ts:364-376`, `sim/kommunen.ts:165`.
- **Befund:** Es gibt nur Druck und Zuwendung. Man kann folgendes nicht:
  - einen Blackout oder Lizenzentzug vorzeitig aufheben,
  - ein Verfahren einstellen oder Journalisten freilassen (nur im Ereignis „Pressekonflikt“),
  - die Rundfunkaufsicht reformieren,
  - die Staatsanzeigen fair verteilen,
  - den Staatsfunk öffnen.
- **Warum es stört:** „Was man begonnen hat, muss man ändern und beenden können.“ Einem liberalen Präsidenten fehlt der Spielweg.
- **Vorschlag:**
  - Je Blatt eine dritte Gruppe „Entspannung“: Lizenz zurückgeben, Verfahren einstellen, Anzeigen gerecht verteilen. Sie kostet Kapital, bringt Pressefreiheit, EU und Städter und verärgert Nationalisten und das eigene Lager.
  - Als Dauerhebel eine Reform „Unabhängige Rundfunkaufsicht“.

**E-18 · Design / Sinn · Schwere 2 · Aufwand mittel**
- **Ort:** Rathäuser. `ui/gesellschaft/GesellschaftAkte.tsx:191-227`, `sim/kommunen.ts:142-163`.
- **Befund:**
  - 81 Kästchen, 71 gleiche Knöpfe „Zwangsverwalter einsetzen“, 2,2 Bildschirme lang, keine Karte.
  - Ein Klick ohne Rückfrage bucht landesweit Polarisierung +5, Säkulare Städter −4 und EU −2, gleich ob Kilis oder İstanbul.
- **Warum es stört:** Die Ansicht wirkt wie ein Formular. Ein schwerer Eingriff ist zu leicht und zu gleichförmig.
- **Vorschlag:**
  - Oben die Provinzkarte, gefärbt nach Rathauspartei; der Klick auf eine Provinz öffnet eine Karte mit Partei, Bürgermeister, Einwohnern und Vorschau.
  - Die Wirkung richtet sich nach der Einwohnerzahl.
  - Vor dem Einsetzen fragt das Spiel nach: „Zwangsverwalter in İstanbul: 16 Mio. Einwohner, Polarisierung +8, CHP ruft zum Protest.“

**E-19 · Design · Schwere 2 · Aufwand mittel**
- **Ort:** Wahlkampf › Reisen ins Land. `ui/Wahlkampf.tsx:126-137` (`interactive={false}`, `<select>` mit 81 Einträgen, Start Ankara).
- **Befund:** Neben der Karte wählt man das Reiseziel aus einer Klappliste, obwohl die Karte daneben liegt.
- **Warum es stört:** Das ist kein Spielgefühl. Hearts of Iron und Civilization lassen auf die Karte klicken.
- **Vorschlag:**
  - Die Karte klickbar machen.
  - Darüber eine Ebene „Wo lohnt sich ein Besuch“: Wähleranteil × Unentschlossene × Probleme, als Wärmefarbe.
  - Der Klick öffnet den Reiseplan.

**E-20 · Erklärung · Schwere 2 · Aufwand mittel**
- **Ort:** Zynismus, Vertrauen und Glaubwürdigkeit. `sim/zynismus.ts:37-55`, `sim/waehler.ts:158-163`, Wahlkampftext `ui2.ui.Wahlkampf.fdf71b5`.
- **Befund:**
  - Kehrtwenden innerhalb von 540 Tagen und teure Erhöhungen in den letzten 180 Tagen vor der Wahl kosten Zynismus. Das steht nirgends am Regler; in der Oberfläche gibt es keine Fundstelle für `zynismus`.
  - Die Wählerkoalition empfiehlt sogar „Energiesubventionen ausweiten“ als Schritt bis zur Wahl, ohne die Wahlgeschenk-Strafe.
  - Daneben stehen fünf Vertrauensgrößen: Zustimmung (51), „Vertrauen in die Regierung“ (32,8, nur in der Vorschau sichtbar), Legitimität, Glaubwürdigkeit der Zusagen und Zynismus.
- **Warum es stört:** Der Spieler wird bestraft, ohne gewarnt zu werden, und findet sich in den Vertrauensgrößen nicht zurecht.
- **Vorschlag:**
  - Am Regler: „Kehrtwende: kostet etwa 0,6 Punkte Zustimmung (Zynismus).“
  - In der Hilfekarte: „Wahlgeschenk: −0,3 Punkte.“
  - Im Barometer ein Ring „Vertrauen · Glaubwürdigkeit · Zynismus“ mit je einem Satz.

**E-21 · Erklärung / Funktion · Schwere 2 · Aufwand klein**
- **Ort:** Barometer. `ui/Waehler.tsx:44-52`, Schlüssel `medien.barometer.text_institut` und `medien.barometer.leer`.
- **Befund:** Nach dem ersten Monat steht dort gleichzeitig „Zustimmung laut Anker Stiftungsinstitut …“ und „Die erste Umfrage erscheint nach einem Monat im Amt.“ (`analyse-E/e2.json`).
  - „Rohdaten gibt es im Reiter ‚Medien‘ der Zeitung“ hat keinen Knopf.
- **Warum es stört:** Ein Widerspruch, und ein Hinweis, der nicht zur Stelle führt (Regel 9).
- **Vorschlag:**
  - Bei einem Wert: „Die Linie entsteht ab der zweiten Umfrage.“
  - Ein Knopf „Rohdaten kaufen (3 Kapital)“ direkt im Barometer.

**E-22 · Logik / Sprache · Schwere 2 · Aufwand mittel**
- **Ort:** Zeitung. `ui/Zeitung.tsx:157-317`, `:337-374`; Texte aus `sim/zeitung.ts`.
- **Befund:**
  - Alle drei Blätter drucken dieselben Kästen: „Zahlen des Monats“, „Lage im Land“, „Parlament“, „Ausland“, „Umfrage“. Nur die Reihenfolge wechselt.
  - Die regierungsnahe Tagespost meldet „Nicht in dieser Ausgabe: Anker Stiftungsinstitut: 47,6 Prozent“ und druckt die Zahl zweimal.
  - Die Artikel sprechen in Spielindizes: „Die Intensität des Konflikts liegt bei 80 von 100; der Reifegrad für Verhandlungen steht bei 33 von 100“, „Spannungen mit Zypern: Konfliktwert 72 von 100“.
- **Warum es stört:** „Dieselbe Realität in drei Lesarten“ (`RECHERCHE_MEDIEN_UMFRAGEN.md` A.5.4) wird nicht spürbar. Keine Zeitung schreibt „Reifegrad 33 von 100“.
- **Vorschlag:**
  - Je Blatt nur die Kästen seiner Lesart. Was das Blatt verschweigt, druckt es wirklich nicht.
  - Indizes in Worte fassen: „Der Krieg tobt unvermindert; an Verhandlungen denkt noch niemand.“

**E-23 · Sprache / Konsistenz · Schwere 2 · Aufwand klein**
- **Ort:** Medienakte › Dauerhafte Hebel. `ui/MedienAkte.tsx:228-245`, `medien.ui.regler_*`.
- **Befund:** „Medienaufsicht (Stufe) 65 · Internetsperren (Stufe) 60 · Staatliche Medien und Werbung (Stufe) 60“. Das sind Stufen ohne Bedeutung, und es gibt keinen Weg zum Regler.
- **Warum es stört:** Das verletzt Regel 5 und Regel 9.
- **Vorschlag:** Benannte Zustände mit Sprungknopf, zum Beispiel: „Medienaufsicht: streng (kritische Sender unter Beobachtung) → Regler öffnen“.

**E-24 · Sprache · Schwere 2 · Aufwand mittel**
- **Ort:** Wählerkoalition und Hilfekarten. `ui/waehler/HilfeKarte.tsx:47`, `ui/waehler/GruppenDetail.tsx:53`, `ui/waehler/Kette.tsx:11`, Schlüssel `wd.hilfenErklaerung`, `ui.Waehler.c2c1ff6`, `wd.prefPlus`.
- **Befund:** „Ausnahmezustand … von 10 auf 0“, „Rentenerhöhungen 50“, „Jeweils ein Schritt von 20 Stufen … rechnen das Politiknetz durch“, „(+3 Stufen)“.
- **Warum es stört:** Das verletzt Regel 5. „Rentenerhöhungen 50“ sagt nichts.
- **Vorschlag:** Benannte Zustände oder echte Einheiten, zum Beispiel: „Renten: Anpassung an die Inflation → Inflation plus 5 %“. Neufassung von `wd.hilfenErklaerung`: „Je ein deutlicher Schritt, gerechnet bis zur Wahl. Grob geschätzt; die Vorschau rechnet genauer.“

**E-25 · Sinn (Möglichkeiten) · Schwere 2 · Aufwand groß**
- **Ort:** Gesamter Bereich.
- **Befund:** Es fehlen Möglichkeiten, die Democracy 4 und Suzerain bieten:
  - Radikalisierung einzelner Wählergruppen; es gibt nur Bewegungen mit „Radikalität“.
  - Attentate und Anschläge auf den Präsidenten; im Code gibt es keine Fundstelle.
  - Den Oppositionskandidaten selbst treffen: Anklage, Haft, Ausschluss von der Wahl. Das ist in der Türkei seit 2025 real. „Ermittlungen gegen die Führung“ ändert die Figur nicht.
  - Eine Ansprache an die Nation außerhalb des Wahlabends. Der Auftrag nennt einen Reiter „Ansprachen“; den gibt es nicht.
  - Kampagnenthemen setzen.
  - Wahlkampfgeld und Spenden.
  - Persönlichkeiten aus Gruppen einbinden (Suzerain).
- **Warum es stört:** Der Bereich erzählt wenig von Menschen. Die Haushalte aus `data/haushalte.ts` („Menschen statt Indizes“, `RECHERCHE_GLM_9`) werden nirgends benutzt; es gibt keine Fundstelle außerhalb der Datei.
- **Vorschlag:**
  - Ein Reiter „Rede an die Nation“ (Ton, Thema, Zielgruppe; Wirkung auf zwei Gruppen, einmal im Quartal).
  - Die Haushalte als Gesichter im Gruppendetail: „Die Konyaer Rentnerin: Heizung frisst die Rente.“
  - Ein Instrument „Anklage gegen den Kandidaten“ mit Folge für die Figur und einem großen Märtyrereffekt.

**E-26 · Erklärung · Schwere 2 · Aufwand klein**
- **Ort:** Wahlabend › Einflüsse. `ui/wahl/Wahlabend.tsx:275-287`, `sim/wahl.ts:201-221`, Schlüssel `wahl.ui.einfluesse`.
- **Befund:**
  - „Einflüsse des Wahlkampfs“ listet Duell, Angriffe, Diaspora, „Oppositionsführung“ und „Lager im Parlament“. Die letzten beiden sind kein Wahlkampf.
  - Es fehlen der Ausgangswert (Zustimmung) und der Zufall.
- **Warum es stört:** Der Spieler kann „51 → 40“ nicht nachrechnen.
- **Vorschlag:**
  - Eine Treppe „Zustimmung 51 → Angriffe −6 → Duell −1,1 → Diaspora +0,3 → Oppositionsführer −0,7 → Zufall −3,6 → 39,9 %“.
  - Überschrift „Wie Ihr Ergebnis zustande kam“.

**E-27 · Logik · Schwere 2 · Aufwand klein**
- **Ort:** Opposition › Parteiverbot. `sim/opposition.ts:163-176`, `sim/wahl.ts:135-161`.
- **Befund:** „Das Verfassungsgericht verbietet die {partei}. Ihre Abgeordneten gründen eine Nachfolgepartei.“
  - Danach bleiben Name, Sitze und Kandidatur der Partei unverändert; nur die Stärke sinkt auf 60 %.
- **Warum es stört:** Der größte Eingriff des Bereichs hat keine sichtbare Folge im Parlament oder auf dem Stimmzettel.
- **Vorschlag:** Die Partei bekommt einen Nachfolgenamen. Ein Teil der Abgeordneten wird fraktionslos, die Fähigkeit des Kandidaten sinkt, und der Märtyrereffekt fließt in die Wahl ein (siehe E-3).

### Schwere 3

**E-28 · Erklärung · Schwere 3 · Aufwand klein**
- **Ort:** Wahlkampf. `ui/Stage.tsx:537-538`, `ui/Wahlkampf.tsx:57-76`.
- **Befund:** Der Reiter „Wahlkampf“ erscheint erst 56 Tage vor der Wahl. Die Warteseite („Der Wahlkampf steht noch bevor“) ist deshalb praktisch nie erreichbar.
  - Vorbereiten, ein Programm planen oder vorab Versprechen abwägen geht nicht.
- **Vorschlag:** Den Reiter ab zwölf Monaten vor der Wahl zeigen, mit Countdown, Schwachstellen der Opposition und vorab planbaren Versprechen.

**E-29 · Konsistenz · Schwere 3 · Aufwand klein**
- **Ort:** Kopf der Medienakte. `ui/akte/Bereiche.tsx:153`, `ui/MedienAkte.tsx:30`; Zustimmung „50,6 Prozent“ in `medien.ui.wahrnehmung_start`.
- **Befund:** „Pressefreiheit 29,4“ ist ein Index mit Komma. Die Zustimmung erscheint hier als „50,6“, sonst als „51 %“.
- **Vorschlag:** Pressefreiheit als ganze Zahl („29“), die Zustimmung überall gleich gerundet.

**E-30 · Sprache / Logik · Schwere 3 · Aufwand klein**
- **Ort:** Wählerwanderung. `sim/waehler-detail.ts:407-447`, Schlüssel `wa.wanderung.text`.
- **Befund:** „Bei den heutigen Stimmungen wechselten etwa 13 % aller Wähler eher die Seite“, darunter „DEM Parti · in Ihrem Lager · 41 % der Abwanderer“. Wer zu einem Bündnispartner geht, wechselt nicht die Seite.
- **Vorschlag:** „… würden eher eine andere Partei wählen. 77 Prozent davon bleiben in Ihrem Lager, 23 Prozent gehen zur Opposition.“ Nur der Teil zur Opposition zählt als Gefahr.

**E-31 · Sprache · Schwere 3 · Aufwand klein**
- **Ort:** Gruppendetail, `wd.faktenTraegt` und `wd.faktenKostet`.
- **Befund:** „Gewicht 11 % der Wähler · trägt 0,2 Punkte Ihrer Zustimmung“ ist unverständlich.
- **Vorschlag:** „Steht diese Gruppe einen Punkt besser zu Ihnen, steigt Ihre Zustimmung um 0,03 Punkte. Heute bringt sie Ihnen 0,2 Punkte über neutral.“ Oder die Zeile ganz streichen.

**E-32 · Funktion · Schwere 3 · Aufwand klein**
- **Ort:** `ui/MedienAkte.tsx:73` und `:93`.
- **Befund:** `useMemo` steht nach einem frühen `return`. Die Reihenfolge der Hooks ist damit nicht stabil.
- **Vorschlag:** Den Hook vor den frühen Ausstieg ziehen.

**E-33 · Konsistenz · Schwere 3 · Aufwand klein**
- **Ort:** Kataloge, ungenutzte Schlüssel.
- **Befund:** Diese Schlüssel werden nirgends benutzt: `ui2.ui.Wahlkampf.e34ddf2`, `.a7fea85`, `.a781f62`, `.dfb8f52`, `ui.Waehler.617465c`, `.e984a34`, `.8fa6867`, `wa.balkenAria`, `wa.strebtNach`, `ges.umschalter*`.
- **Vorschlag:** Löschen.

**E-34 · Zahl · Schwere 3 · Aufwand klein**
- **Ort:** `sim/wahlkampf.ts:155`.
- **Befund:** Karadeniz zählt als „nahe Region“ (1 Aktionspunkt). Rize und Artvin liegen mehrere hundert Kilometer weiter von Ankara als Teile der Ägäis.
- **Vorschlag:** Die Entfernung je Provinz messen, oder den Spielparameter so kennzeichnen.

**E-35 · Design · Schwere 3 · Aufwand klein**
- **Ort:** Opposition & Straße › Lage. `ui/gesellschaft/GesellschaftAkte.tsx:44`.
- **Befund:** Sechs Kacheln tragen sechsmal „Noch zu wenig Verlauf: Die Linie entsteht, sobald ein paar Monate vergangen sind.“
- **Vorschlag:** Einmal über den Kacheln, oder statt der Linie einen Pfeil mit dem Startwert zeigen.

**E-36 · Logik · Schwere 3 · Aufwand klein**
- **Ort:** Milieu-Trend. `sim/gesellschaft.ts:253-268`.
- **Befund:** „Groll steigt“ oder „Groll sinkt“ wird aus der heutigen Stimmung geschlossen, nicht aus dem Verlauf des Grolls. Der Kommentar sagt selbst „Näherung“.
- **Vorschlag:** Den Groll monatlich speichern und den echten Trend zeigen, oder umbenennen in „Groll wächst gerade“.

**E-37 · Konsistenz · Schwere 3 · Aufwand klein**
- **Ort:** Medienlage und Zeitung. `ui/akte/Bereiche.tsx:256` gegen `ui/MedienAkte.tsx:183`.
- **Befund:**
  - Die Medienlage nennt die Gruppen „Staatlicher Rundfunkverbund“, „Bau- und Energieholding Medien“. Zeitung und Medienakte nennen sie „Der Staatsbote“, „Neue Warte“.
  - Der Staatsfunk trägt „Selbstzensur 80“, was für ein Staatsorgan eine schiefe Größe ist.
- **Vorschlag:**
  - Überall der Blattname, die Gruppe klein darunter.
  - Für staatliche Häuser „Linientreue“ statt „Selbstzensur“.

**E-38 · Sprache · Schwere 3 · Aufwand klein**
- **Ort:** Wahlkampf, `ui2.ui.Wahlkampf.af38990`.
- **Befund:** „Archätyp“ ist falsch geschrieben, richtig ist „Archetyp“. Der Begriff selbst ist Fachjargon.
- **Vorschlag:** „Was eine Provinz besonders prägt, wirkt stärker.“

**E-39 · Sprache · Schwere 3 · Aufwand klein**
- **Ort:** Anglizismen und Kürzel: „Bias {p0}“ (`ui2.ui.Wahlkampf.b55036a`), „Haus-Effekt“, „Methode F2F“ (Zeitung), „AP“ auf Knöpfen, „Blackout (zehn Tage)“, „Auslandstürken“.
- **Befund:** Englische Reste und Kürzel; „Auslandstürken“ wirkt veraltet.
- **Vorschlag:**
  - „Lage des Instituts {p0}“
  - „Methode: Befragung vor Ort“
  - „2 Aktionspunkte“
  - „Sendeverbot (zehn Tage)“
  - „Wahlberechtigte im Ausland“

**E-40 · Logik · Schwere 3 · Aufwand klein**
- **Ort:** Pressekonferenz und Interview. `sim/medien.ts:374-375`.
- **Befund:** Eine Pressekonferenz hebt den Pressefreiheitswert (+0,2), ein Interview ebenso (+0,3). Die Vorschau des Interviews verschweigt die Wirkung auf die Städter (+0,5).
- **Vorschlag:** Pressefreiheit nur über Strukturhebel bewegen. Die Vorschau nennt die Gruppenwirkung.

**E-41 · Sinn · Schwere 3 · Aufwand klein**
- **Ort:** Wahlanfechtung. `sim/ereignisse-wahl.ts:96-110`.
- **Befund:** Jede Antwort endet mit „abgewiesen“. Die Neuauszählung birgt kein Risiko.
- **Vorschlag:** Neuauszählung mit kleiner Chance auf Umkehr bei einem Abstand unter 0,5 Punkten. Das ist echte Spannung zum Preis der Legitimität.

**Zählung:**
- Schwere 1: 5 Befunde (E-1 bis E-5)
- Schwere 2: 22 Befunde (E-6 bis E-27)
- Schwere 3: 14 Befunde (E-28 bis E-41)
- Zusammen: 41 Befunde

---

## 3. Wortprüfung

- `medien.barometer.kopf`: „Wenn heute gewählt würde“ → „Zustimmung zur Regierung“
- `medien.barometer.text_start`: „Noch keine Umfrage veröffentlicht; der Wert ist der vom Amtsantritt, nötig sind 50. Die Wahl ist am {datum}.“ → „Noch keine Umfrage veröffentlicht; das ist die Zustimmung beim Amtsantritt. Gewählt wird am {datum}.“
- `medien.barometer.text_institut`: „… nötig sind 50 … Rohdaten gibt es im Reiter ‚Medien‘ der Zeitung.“ → „Zustimmung laut {institut}. Die Wahl ist am {datum}, in etwa {monate} Monaten. Umfragen irren; die wahre Zahl zeigen Rohdaten.“ Dazu ein Knopf.
- `st.zustimmung.tip`: „… ab 50 Prozent gewinnen Sie.“ → „Wie zufrieden das Land mit Ihrer Regierung ist. Wie die Wahl ausginge, zeigt die Wählerkoalition.“
- `medien.chronik.schwelle`: „50 Prozent: Wahlsieg“ → „50 Prozent der Stimmen: Sieg im ersten Wahlgang“
- `ui2.ui.Wahlkampf.1963a80`: „Ihre Angriffe treffen …“ → „Die Angriffe der Gegenseite treffen dort, wo echte Probleme rot stehen: bislang {p0} Prozentpunkte.“ (Englisch und Türkisch ebenso)
- `ui2.ui.Wahlkampf.af38990`: „… was den Archätyp der Provinz prägt, trägt weiter …“ → „{p0} von 81 Provinzen besucht. Wo Probleme brennen, ist der Besuch Risiko und Chance zugleich; wiederholte Besuche bringen weniger.“
- `ui2.ui.Wahlkampf.b55036a`: „Bias {p0}“ → „Lage des Instituts {p0}“
- `ui.Wahlkampf.be569cb`: „Haus-Effekt: Dieses Institut misst systematisch zugunsten oder zuungunsten des Regierungslagers“ → „Dieses Institut liegt meist um diesen Wert neben der Wahrheit, zugunsten oder zulasten der Regierung.“
- `ui2.ui.Wahlkampf.83246dd`: „Die Auslandstürken stimmen nur bei nationalen Wahlen ab“ → „Wahlberechtigte im Ausland stimmen nur bei nationalen Wahlen ab“
- `ui2.ui.Wahlkampf.2651068`: „Vorbereiten ({p0} AP)“ → „Vorbereiten ({p0} Aktionspunkte)“ (ebenso `wahlreise.start`, `enden.wk.ui.kosten`, `ui/Wahlkampf.tsx:155`)
- `ui2.ui.Wahlkampf.fdf71b5`: „… Wer bricht, zahlt später den Bruch-Preis des Zusagen-Systems.“ → „… Wer ein Versprechen bricht, verliert später Glaubwürdigkeit.“
- `ui2.ui.Wahlkampf.74c11fe`: „Ausgang: {p0} Prozentpunkte auf die Wechselwähler.“ → „Ergebnis des Duells: {p0} Prozentpunkte am Wahltag.“
- `wahlreise.lokal`: „lokales Vertrauen · Indexpunkte“ → „Vertrauen vor Ort“
- `wahlreise.wirkung`: „… Das sind keine landesweiten Wahlprozentpunkte; beim Nachfolger ist der geringere Übertrag bereits eingerechnet.“ → „Wirkung nach Wiederholungen: {anteil}. Am Wahltag etwa {pp} Prozentpunkte.“
- `ui.Waehler.c2c1ff6`: „Jede Maßnahme, rauf oder runter, um 20 Stufen durchgerechnet, ohne Rückwirkungen über die Wirtschaft (Preise, Schulden); wer dabei gewinnt und wer sich ärgert, steht dabei. Die Vorschau rechnet alles.“ → „Die drei Schritte, die Ihnen bis zur Wahl am meisten bringen, grob geschätzt. Die Vorschau rechnet genau.“
- `wd.hilfenErklaerung` und `wd.hilfenErklaerungIn`: „… Die Zahlen rechnen das Politiknetz durch …“ → „Je ein deutlicher Schritt, grob geschätzt bis zur Wahl in {m} Monaten. Die Vorschau rechnet genau.“
- `hk.bisWahl`: „bis zur Wahl (nach einem Jahr {j}, langfristig {l}).“ → „bis zur Wahl (nach einem Jahr {j}).“
- `wd.faktenTraegt`: „Gewicht {a} der Wähler · trägt {p} Punkte Ihrer Zustimmung“ → „Gewicht in Ihrer Zustimmung: {gewichtWort}. Heute bringt sie Ihnen {p} Punkte.“
- `wa.gewinnbar.satz`: „{name}. Läge sie bei 58, brächte das {p} Punkte Zustimmung.“ → „{name}: Gewinnen Sie diese Gruppe, steigt Ihre Zustimmung um {p} Punkte.“
- `wa.wanderung.chip`: „{p} wechselten die Seite“ → „{p} denken an eine andere Partei“
- `wa.wanderung.text`: „… wechselten etwa {p} aller Wähler eher die Seite …“ → „Etwa {p} aller Wähler würden heute eher eine andere Partei wählen, und zwar diese:“
- `wd.stufenTitel`: „Stufe {s} von 100; zu Beginn {start}“ → benannter Zustand je Maßnahme, zum Beispiel „heute: hoch; zu Beginn: mittel“
- `ges.milieu.ursachen` mit Kennungen (`GesellschaftAkte.tsx:69`): „ausnahmerecht +8 · minderheitenrechte −3.7“ → „Hilft: wenig Ausnahmerecht (+8). Schadet: schwache Minderheitenrechte (−4).“
- `ges.zweck`: „… Gesellschaft mit Gedächtnis. Groll, Märtyrer und Repression wirken über Monate nach.“ → „Wer protestiert, wer opponiert, wer die Städte regiert. Was Sie heute tun, wirkt monatelang nach.“
- `ges.kz.repression`: „Gedächtnis der Repression“ → „Erinnerte Härte“
- `ges.opp.folge.vertrauen_leicht_runter`: „Kurz unangenehme Schlagzeilen“ → „Vertrauen in die Regierung sinkt leicht“ (sagt, was die Simulation tut: −0,5)
- `ges.kom.verwalter_hinweis`: „… wird bei der nächsten Wahl abgerechnet.“ → „… und rächt sich bei der nächsten Kommunalwahl.“
- `medien.ui.regler_aufsicht` / `_internet` / `_staatsmedien`: „Medienaufsicht (Stufe)“ → „Medienaufsicht: {zustand}“
- `medien.ui.dauerkanaele_text`: „Die Regler im Politiknetz setzen die Lage dauerhaft …“ → „Diese Regler stellen Sie in der Politik; hohe Werte schließen wirklich Sender.“ Dazu ein Knopf zum Regler.
- `medien.aktion.blackout.name`: „Blackout (zehn Tage)“ → „Sendeverbot (zehn Tage)“
- `medien.ui.selbstzensur` beim Staatsfunk → „Linientreue“
- `medien.lizenz.frei`: „Lizenz frei“ → „Lizenz gültig“
- `ui2.ui.Zeitung.52a9271`: „Preis: eine Kleinigkeit“ → „Preis: 15 Lira“ (oder streichen)
- Zeitung, fest verdrahtet: „Methode {u.methode}“ mit „F2F“ → „Befragung vor Ort“ / „am Telefon“ / „im Netz“
- Zeitung, Artikeltexte aus `sim/zeitung.ts`: „Die Intensität des Konflikts liegt bei 80 von 100; der Reifegrad für Verhandlungen steht bei 33 von 100.“ → „Der Krieg tobt unvermindert; an Verhandlungen denkt noch keine Seite.“
- Zeitung › Ausland: „Spannungen mit Zypern: Konfliktwert 72 von 100“ → „Zypern: Die Lage ist gespannt.“
- `ui/waehler/Kette.tsx:11-12`: „{n} Stufen höher als zu Beginn“ / „{n} Punkte über dem Ausgangswert“ → in den Katalog, mit benanntem Zustand: „deutlich höher als zu Beginn“
- `wahl.ui.einfluesse`: „Einflüsse des Wahlkampfs“ → „Wie Ihr Ergebnis zustande kam“
- `wahl.einfluss.lager`: „Lager im Parlament“ → „Rückhalt Ihres Lagers im Parlament“
- `wahl.ui.schwelle`: „Strich bei 50 Prozent: …“ → „Die Linie markiert 50 Prozent: Wer darüber liegt, gewinnt im ersten Wahlgang.“
- `sim/wahlkampf.ts:639`, fest verdrahtet: `TV-Duell: +x Prozentpunkte` → Katalogschlüssel „TV-Duell: {d} Prozentpunkte am Wahltag“
- `sim/wahlkampf.ts:706`, fest verdrahtet: „{g.name} greift an: {thema}.“ → Katalog „{name} greift an: {thema}.“
- `ui/Wahlkampf.tsx:226`, fest verdrahtet: „Umfrage-Ticker“ → Katalog „Umfragen der Kampagnenwochen“
- `ui/Zeitung.tsx:36`, fest verdrahtet: Spartennamen „Politik, Wirtschaft, Im Land, Umsetzung, Ausland, Meinungslage“ → Katalog
- Englisch, `medien.chronik.blackout`: identisch mit dem Deutschen „Blackout: {cluster}“ → „Broadcast ban: {cluster}“

---

## 4. Die fünf wichtigsten Verbesserungen des Bereichs

**1. Ehrliches Wahlbarometer: Zustimmung und erwartetes Ergebnis getrennt (E-1, E-3, E-26).**
Oben in der Wählerkoalition steht ein Halbrund wie am Wahlabend. Links die Zustimmung, rechts die Stimmenspanne, die Treppe darunter erklärt den Abstand:

```
 Zustimmung 51 %          Erwartetes Ergebnis heute: 41–47 %   ▏50
 ─────────────────────────────────────────────────────────────────
 51  → Angriffe der Opposition −6  → Duell (noch offen) ±5
     → Oppositionsführer −0,7     → Stärke der Opposition +1,2 → Zufall ±2
```

- Ein Klick auf jede Stufe führt zur Stelle, an der man sie ändert: Angriffe → Wahlkampf, Stärke → Opposition.
- Der Wahlabend zeigt dieselbe Treppe mit dem tatsächlichen Zufall.

**2. Wahlkampf als Duell der Züge: antwortbare Angriffe, klickbare Karte, sichtbare Wirkung (E-2, E-5, E-19).**

```
 Woche 3 von 8   ●●●●●●●○○○ 7 Aktionspunkte
 ┌ Angriff: „Wohnungsnot in Ankara“ (−1,5) ─────────────┐
 │ [Ortstermin, 2 AP: halbiert, 30 % Risiko]             │
 │ [Gegendarstellung, 1 AP: −0,5 bei Lesern der Hausblätter] │
 │ [Gegenangriff, 1 AP: −1 beim Gegner, Polarisierung +1] │
 └───────────────────────────────────────────────────────┘
 Karte: Wärme = Wähler × Unentschlossene; Klick → Reiseplan „≈ +0,3 Punkte am Wahltag“
 Schlussspurt: Duell +2 · Reisen +1,4 · Angriffe −3,0 · Diaspora +0,3
```

**3. Zwei Ebenen statt drei, nichts doppelt (E-7, E-8).**
- **Gesellschaft:** Reiter „Wählerkoalition | Opposition | Straße | Rathäuser“, Hintergrund „Stimmung im Land“. Der Unterreiter „Lage“ entfällt, seine Milieus wandern als Untergruppen in die Wählerkoalition (E-12).
- **Medien:** „Zeitung | Medien steuern“.
- Kopfwerte stehen nur im Kopf.

**4. Bilder statt Listen: Rathauskarte und Straßenkarte (E-18, Ansichtskarten 023 und 024).**
- Die Provinzkarte ist nach Rathauspartei gefärbt. Laufende Bewegungen erscheinen als pulsierende Marken (die Daten liefert schon `bewegungsOrte`).
- Ein Klick auf eine Provinz öffnet eine Karte:

```
 İstanbul · CHP · 16 Mio. Einwohner · Groll vor Ort 34 · Kundgebung „Teuerung“ (Größe 22)
 [Zwangsverwalter (3 Kapital): Polarisierung +8, Städter −6, EU −3, Opfer möglich]
 [Dialog mit dem Bürgermeister]
```

- Bei Ruhe zeigt die Straße die Karte mit dem Druck je Milieu („Wo es brodelt“) statt eines einzelnen Satzes.

**5. Jeder Preis am Knopf, jede Wirkung echt (E-15, E-16, E-17, E-20, E-6).**
- Jede Antwortkarte (Medien, Bewegung, Opposition, Hilfe) bekommt eine einheitliche Fußzeile in derselben Gestalt:

```
 Zustimmung kurz +0,4 · Säkulare Städter −1,1 · Junge −0,8 · Ansehen −0,8 · Zynismus —
 Haushalt: Mindestlohn +5 Stufen ≈ 0,1 % des BIP · Risiko: Opfer 30 %
```

- Dazu je Medium eine dritte Gruppe „Entspannung“ (Lizenz zurückgeben, Verfahren einstellen, Aufsicht reformieren), damit Begonnenes beendet werden kann.
- Jede Handlung in der Gesellschafts- und Medienakte zeichnet die Kopfleiste neu und sichert.

---

## Nicht geprüft

- **Wahlkampf-Zentrale, Wahlversprechenkarte, Stichwahlereignis, Wahlabend:** nicht im Bild gesehen. Sie erscheinen erst 56 Tage vor der Wahl oder am Wahltag, und im Schnellstart ließ sich das im Browser nicht herbeiführen. Beurteilt ist nur der Code. Die Noten für Schönheit fehlen dort.
- **Laufende Bewegungen, Massenbewegung, Kommunalwahlabend, Eilmeldungen der Zeitung:** zum Prüfzeitpunkt nicht aufgetreten.
- **Gruppengrößen der Türkei (E-13):** nach eigener Kenntnis eingeordnet, nicht an YSK-, TÜİK- oder SGK-Primärquellen geprüft.
- **Mögliche Verluste durch fehlendes Sichern (E-6):** nicht durch Neuladen ausprobiert.
- **Englisch und Türkisch:** nur stichprobenweise gelesen. Die Schlüssel sind vollständig.
