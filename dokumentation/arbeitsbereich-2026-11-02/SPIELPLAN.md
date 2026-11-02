# NWO — Der Spielplan: Ein Ausschnitt des bestehenden Spiels, kein neues

Stand: 20. Oktober 2026. Korrigierte Fassung nach dem Einwand: **Das Spiel wird nicht neu erfunden.** Der erste Build ist ein Ausschnitt aus NWO, mit denselben Grundfestlegungen: echte Türkei, 81 Provinzen, pausierbare Tage, zwölf Politikfelder im Modell, freie Sprache, Institutionen, Diplomatie und Beschaffung. Begrenzt wird die **Tiefe und Content-Menge**, nicht die Identität.

**Grundsatz:** Das Spiel ist fertig, wenn die Schleife funktioniert — nicht, wenn alle Dokumente vollständig sind. Aber die Schleife muss die echte NWO-Schleife sein, nicht die eines kleineren anderen Spiels.

## 0. Was bleibt — und was nur temporär begrenzt wird

| Bereich | Bleibt | Temporär begrenzt |
|---|---|---|
| Land | Türkei, echter Stichtag | ein Jahr statt offener Karriere |
| Karte | 81 Provinzen, 7 Regionen, Istanbul detailliert | 80 Provinzen mit Basisdaten, eine Region mit Tiefe |
| Zeit | pausierbare Tage, 365-Tage-Simulation | Entscheidungen an 24–36 Tagen; dazwischen läuft die Zeit |
| Politik | 12 Felder im Datenmodell und in der UI | 4 Felder mit echten Entscheidungsketten, 8 mit Baselines |
| Wirtschaft | 11 Zusammenhänge, Haushalt, Zentralbank | 5 Primärkennzahlen in der UI, Rest per Drill-down |
| Gesellschaft | 7 Wählergruppen, Parteien, Koalition, Medien | 7 Gruppen, einfache Wahlformel, eine Wahl |
| Diplomatie | Beziehungsmatrix, Klauselverhandlungen | ein Faden: EU-Zollunion oder Getreideabkommen, 3 Runden |
| Militär | Beschaffung, Lieferung, Ausbildung, Einsatzbereitschaft | ein Beschaffungsfaden, kein Krieg |
| Figuren | 8 Figuren mit Ziel, Stimme, Gedächtnis | 5 mit vollem Arc, 3 unterstützend |
| Krisen | Ereignissystem, 19 Vorlagen | 3 Krisen im Slice |
| Projekte | freie Eingabe, Wirkungsmodell | 3 Archetypen + ein freies Projekt |
| Sprache | Freitext → geprüfte Aktion | 12 Aktionsklassen, 150–250 Kommandos, LLM optional |
| Kunst | gezeichneter, realistischer Stil | funktionale Platzhalter; Art-Pass in Alpha |

**Das ist der Unterschied zur vorherigen Fassung:** Keine Monatszüge statt Tage, keine 7 Regionen statt 81 Provinzen, keine 5 Kennzahlen statt Wirtschaftsmodell, kein Wegfall von Diplomatie und Militär. Nur die **Content-Tiefe** ist begrenzt.

## 1. Das Spiel im Ausschnitt

> **Ein Jahr Türkei. 365 Tage. 81 Provinzen. 12 Felder. Drei Krisen. Acht Figuren. Eine Wahl.**

Der Spieler ist Staatspräsident. Er kann jederzeit pausieren, Akten öffnen, Karte und Provinzen untersuchen, mit Figuren sprechen, Entscheidungen treffen und die Zeit bis zum nächsten Entscheidungspunkt laufen lassen. Nach 365 Tagen steht die Wahl.

**Eine Sitzung dauert 75–90 Minuten.** Der Spieler trifft 24–36 echte Entscheidungen; dazwischen laufen Projekte, Verfahren und Krisen weiter. Das ist die echte NWO-Schleife, nur mit begrenztem Content.

### 1.1 Was „funktionsfähig" konkret heißt

Ein Build ist fertig, wenn **alle** folgenden Punkte erfüllt sind:

1. **Start:** Neues Spiel → Türkei, fester Stichtag, Präsident, Amtsübergabe.
2. **Zeit:** 365 Tage, pausierbar, Entscheidungen an 24–36 Tagen; kein Monatszug-Modell.
3. **Karte:** 81 Provinzen sichtbar, 7 Regionen, Istanbul-Detail; Karte und Akte verweisen auf dieselben Objekte.
4. **Politik:** 12 Felder sichtbar, 4 mit echten Ketten, 8 mit Baselines; 7 Gruppen, Parteien, Koalition, Medien.
5. **Wirtschaft:** 11 Zusammenhänge im Modell, 5 Primärkennzahlen in der UI, Drill-down auf Zins, Schulden, Wechselkurs, Glaubwürdigkeit.
6. **Diplomatie:** ein vollständiger Verhandlungsfaden mit 3 Runden, 3 Klauseln, Ratifikation und Umsetzung.
7. **Militär:** ein Beschaffungsfaden von Bedarf bis Einsatzbereitschaft, ohne Krieg.
8. **Figuren:** 8 Figuren, 5 mit vollem Arc, Gedächtnis für Zusagen.
9. **Krisen/Projekte:** 3 Krisen, 3 + 1 Projekte, jede Entscheidung mit Gewinnern und Verlierern.
10. **Freitext:** 40 von 50 typischen Anweisungen korrekt auf 12 Aktionsklassen abgebildet; Rest mit Rückfrage/Ablehnung; ohne LLM voll spielbar.
11. **Systemnetz:** Jede der acht Domänen hat mindestens eine eingehende und eine ausgehende Kante; jede Aktion erzeugt ein Event und mindestens eine Reaktion innerhalb von 30 Tagen; keine Inselsysteme.
12. **Fünf Pflichtketten:** Mindestlohn, EU-Beziehung, Erdbeben, Korruptionsskandal, Rüstungsdeal sind von der Aktion bis zur politischen Reaktion durchspielbar (siehe [SYSTEMMODELL.md](SYSTEMMODELL.md)).
13. **Erklärung:** Jede angezeigte Wirkung ist in höchstens fünf Gliedern erklärbar; 80 % der Testpersonen benennen nach einer Krise die drei Haupttreiber.
14. **Stabilität:** 90 Minuten ohne Crash; 10 Save/Load-Zyklen ohne Fehler; keine unendlichen Werte.
15. **Spielspaß:** 3 von 5 Testpersonen wollen ein weiteres Jahr spielen; 4 von 5 können eine Ursache-Wirkungs-Kette erklären.

Wenn Punkt 15 scheitert, wird die Schleife geändert — **nicht** der Umfang erhöht und nicht das Design ersetzt.

## 2. Die Schleife

```
Tag läuft / pausiert
   ↓
Briefing (3–5 Karten) oder Ereignis
   ↓
Karte/Provinz, Akte, Gespräch
   ↓
1–2 Entscheidungen (Menü oder Freitext)
   ↓
Zeit läuft → Folgen (sofort / Tage / Monate)
   ↓
nächstes Briefing → … → Wahl → Bilanz
```

**Wichtig:** Die Zeit ist nicht in Monatszüge zerlegt. Der Spieler erlebt Tage, kann pausieren und bis zum nächsten Entscheidungspunkt vorspulen. Die Simulation läuft täglich; Entscheidungen werden an 24–36 Tagen fällig. Das ist die Festlegung aus [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md).

## 3. Der Ausschnitt im Detail

### 3.1 Karte und Provinzen

- **81 Provinzen** als SVG-Karte, jede mit Name, Bevölkerung, Zustimmung und einer Basiskennzahl.
- **7 Regionen** als Aggregationsebene: Marmara, Ägäis, Mittelmeer, Zentralanatolien, Schwarzmeer, Ostanatolien, Südostanatolien.
- **Istanbul** als Detailregion mit drei Bezirken (Wohnen, Medien, Finanzplatz).
- Die anderen 80 Provinzen sind **nicht** detailliert simuliert, aber sie existieren, haben Daten und reagieren auf nationale Politik. Das ist ein LOD-Modell, keine Designänderung.

### 3.2 Die zwölf Politikfelder

Alle zwölf Felder sind im Datenmodell und in der UI sichtbar:

1. Arbeit und Einkommen
2. Steuern und Haushalt
3. Bildung
4. Gesundheit
5. Sicherheit, Justiz, Gefängnisse
6. Drogen
7. Wohnen und Städte
8. Umwelt und Energie
9. Landwirtschaft und Ernährung
10. Migration und Integration
11. Medien und Öffentlichkeit
12. Katastrophenschutz und Resilienz

**Vier Felder haben im Slice echte Entscheidungsketten:**

- **Steuern und Haushalt** (Ausgaben, Steuern, Defizit, Zentralbank)
- **Wohnen und Städte** (Mieten, Sozialwohnungen, Bauland)
- **Sicherheit und Justiz** (Korruptionsaffäre, Medien, Rechtsstaat)
- **Arbeit und Einkommen** (Mindestlohn, Jobs, Inflation)

Die anderen acht Felder haben Startwerte, passive Effekte und je eine Maßnahme. Sie sind sichtbar, aber noch nicht tief. Das ist die Content-Grenze, nicht die Design-Grenze.

### 3.3 Wirtschaft

Das [Wirtschaftsmodell](WIRTSCHAFTSMODELL.md) bleibt die Grundlage: Z1–Z11, Haushalt, Zentralbank, Wechselkurs, Inflation, Erwartungen, Schulden, Risikoaufschlag, Gewinner/Verlierer.

**In der UI sichtbar:** Inflation, Arbeitslosigkeit, Haushaltssaldo, Zustimmung, Koalitionsstabilität. **Per Drill-down:** alle 11 Zusammenhänge, Zinslast, Schuldenquote, Wechselkurs, Glaubwürdigkeit, regionale Wirkung.

Der Slice implementiert eine **minimal schließende Version** des Modells, nicht ein neues 5-Kennzahlen-Modell. Fehlende Daten werden als Lücke markiert, nicht als Null.

### 3.4 Politik und Wahl

- **7 Wählergruppen** aus [INNENPOLITIK.md](INNENPOLITIK.md): städtische säkulare Mittelschicht, religiös-konservative Kleinunternehmer, industrielle Exportarbeiter, ländliche Landbevölkerung, junge Arbeitslose, Rentner/Sparer, Industrie-/Finanzelite.
- **Parteien:** Regierungspartei, Koalitionspartner, zwei Oppositionsparteien; Flügel und Führung als einfache Werte.
- **Medien:** eine Zeitung, eine Journalistin, Social-Media-Kanal; Reichweite und Glaubwürdigkeit.
- **Wahl:** eine Wahl am Ende des Jahres; Gruppen, Turnout, Parteibindung, Salienzen, einfaches Sitzmodell.
- **12 Felder** fließen in die Gruppen ein; die vier aktiven Felder haben die größten Effekte.

### 3.5 Diplomatie: ein Faden

Ein einziger, aber vollständiger Verhandlungsfaden: **EU-Zollunion-Modernisierung** (oder alternativ Getreideabkommen). Drei Runden, drei Klauseln, ein Partner, ein Spoiler, Ratifikation, Umsetzung.

Der Faden testet:

- Beziehungsmatrix (Handel, Sicherheit, Vertrauen, Konflikt),
- ZOPA/Reservationspreise,
- Paketgeschäfte,
- innenpolitische Kosten,
- Ratifikation und Umsetzung.

Kein volles Außenpolitik-System, aber die echte Mechanik an einem Fall.

### 3.6 Militär: ein Beschaffungsfaden

Ein Beschaffungsvorgang, z. B. **Eurofighter-Bestellung** oder **S-400-Abtransfer**:

**Bedarf → Haushaltsrahmen → Angebot → Prüfung → Vertrag → Lieferung → Ausbildung → Einsatzbereitschaft.**

Der Faden testet: Bestellung ist nicht Einsatzbereitschaft; Lieferverzug, politische Bedingungen, Wartung, Ausbildung. Kein Krieg, keine Front, keine taktische Simulation.

### 3.7 Figuren

Acht Figuren, fünf mit vollem Arc:

1. Der Spieler (Präsident)
2. Finanzminister (loyal, ehrgeizig)
3. Zentralbankgouverneurin (unabhängig, stolz)
4. Journalistin (investigativ)
5. Mentorin (neutral)
6. Koalitionspartner (fordert)
7. Verteidigungsminister/General (Beschaffung)
8. EU-Diplomat/Verhandlungsführer (Diplomatie)

Jede Figur hat Ziel, Angst, Stimme, Beziehung und ein Gedächtnis für Zusagen. Die Mentorin erklärt, entscheidet nicht.

### 3.8 Krisen und Projekte

**Drei Krisen:** Währungsschock, Korruptionsaffäre, Mietproteste. Jede mit drei Stufen und mindestens zwei Wegen.

**Drei Projekte:** Sozialwohnungen, Metro-Linie, Industriepark. Dazu **ein freies Projekt** aus Freitext, um die Pipeline zu testen.

**Ein Ereignissystem**, das mehr als die drei Krisen tragen kann; der Slice nutzt drei.

### 3.9 Freitext und LLM

- **12 Aktionsklassen** (Informationsfrage, Prüfung, Konsultation, Delegation, Personal, Haushalt, Gesetz, Verwaltung, Diplomatie, Vertrag, Beschaffung, Sicherheit).
- **150–250 konkrete Kommandos** daraus.
- **LLM optional:** Das Spiel ist vollständig ohne LLM spielbar; der LLM parst Freitext, die Simulation validiert und rechnet.
- **Fallback:** Menüs, Vorlagen, Rückfragen, „nicht abbildbar" mit zwei Alternativen.

## 4. Was ausdrücklich nicht gebaut wird

| Nicht im ersten Build | Warum |
|---|---|
| Offene Karriere über mehrere Amtszeiten | ein Jahr reicht für den Beweis |
| 19 Szenarien | drei Krisen + Ereignissystem reichen |
| Volle zwölf Felder mit Entscheidungsketten | vier aktive, acht Baselines |
| Krieg, Fronten, taktische Gefechte | Beschaffungsfaden reicht für „Militär" |
| Volle Weltpolitik, 10 Partner | ein Verhandlungsfaden |
| 900 Bezirke, 3D-Karte | 81 Provinzen + Istanbul-Detail |
| Endgültige Art, Audio, Lokalisierung | Alpha |
| Vollständiges Quellenregister, alle Lizenzen | 20 Kernreihen + Provinzdaten |
| Steam, Demo, Marketing, USK | Launch |
| Modding, Mehrspieler, Achievements | später |

**Regel:** Kein System wird durch ein anderes ersetzt. Es wird nur **weniger Content** hineingebaut. 81 Provinzen bleiben 81 Provinzen; Tage bleiben Tage; zwölf Felder bleiben zwölf Felder.

## 5. Die 20 Wochen

**Annahme:** eine Person, 15–20 Stunden pro Woche, KI-Unterstützung. Bei 8–10 Stunden: 26–30 Wochen. **20 Wochen sind die aggressive Untergrenze; realistisch sind 24–28 Wochen**, sobald Review, Bugfixing und Alltag dazukommen. Das ist eine Schätzung, keine Zusage. Die längere Dauer ist der Preis dafür, dass der Slice originaltreu bleibt.

| Woche | Ziel | Deliverable | Fertig, wenn |
|---|---|---|---|
| **1** | Spiel- und System-Lock | Ein-Seiten-Design + State-Schema + Graph-Datei v0 mit 20 Pflichtkanten: 365 Tage, 81 Provinzen, 12 Felder, 4 aktive Felder, 8 Figuren, 3 Krisen, 1 Diplomatie-, 1 Beschaffungsfaden | Jede Entscheidung hat eine sichtbare Folge; Graph-Datei ist lesbar; Streichliste steht |
| **2** | Klickprototyp | 6 Screens + „Warum?"-Inspector: Schreibtisch, Karte/Provinz, Akte, Gespräch, Budget, Bilanz | 3 Testpersonen verstehen die Schleife in 30 Minuten |
| **3** | Simulationskern I | Tages-Tick, State, Haushalt, 11 Wirtschaftsvariablen, Zentralbank, Event-Log, erste Graph-Kanten | 365 Tage im Konsolenlauf, reproduzierbar; mindestens 5 Kanten feuern |
| **4** | Karte/Provinzen | 81 Provinzen als SVG, 7 Regionen, Istanbul-Detail, Provinzdaten | Karte und Akte verweisen auf dieselben Objekte |
| **5** | Politik I | 7 Gruppen, Parteien, Koalition, Medien, 12 Felder als Baselines; Kette Wirtschaft → Zufriedenheit → Zustimmung | Kette 1 (Mindestlohn) läuft von Aktion bis Reaktion |
| **6** | Figuren/Dialog | 8 Figuren, 25 Szenen, Gedächtnis-Ledger; Reaktionen auf Aktionen | Jede Figur hat Ziel, Stimme, Konflikt; Zusage wird erinnert |
| **7** | Krisen | 3 Krisen × 3 Stufen, Ereignissystem; jede Krise erzeugt Reaktionen | Jede Krise hat zwei Wege, Verlierer, Nachspiel |
| **8** | Projekte | 3 Archetypen + freies Projekt, Kosten/Dauer/Verlierer; Projekt → Zufriedenheit/Umwelt/Haushalt | Ein Projekt ist von der Idee bis zur Wirkung spielbar; Kette 3 (Erdbeben) läuft |
| **9** | Diplomatie | Ein Verhandlungsfaden, 3 Runden, 3 Klauseln, Ratifikation; Beziehung → Vertrag → Handel | Kette 2 (EU-Beziehung) läuft; ein Deal kann scheitern |
| **10** | Beschaffung | Ein Beschaffungsfaden, Lieferung, Ausbildung, Readiness; Beschaffung → Sicherheit → Beziehung | Kette 5 (Rüstungsdeal) läuft; Bestellung ist nicht Einsatzbereitschaft |
| **11** | Freitext | 12 Aktionsklassen, 150–250 Kommandos, Parser, Fallback; Aktion → Event → Reaktion | 40 von 50 Testanweisungen korrekt; jede Aktion erzeugt ein Event |
| **12** | Wahl/Ende | Wahlmodell, Bilanz, Neustart, „Was ist passiert?"; alle Ketten fließen in die Wahl | Ein Jahr von Start bis Ende spielbar |
| **13** | Speichern/Stabilität | JSON-Save, Autosave, Load, Versionierung; Event-Log replaybar | 10 Save/Load-Zyklen ohne Fehler |
| **14** | Integration + Graph-Tests | Alle Screens verbunden; fünf Pflichtketten; Konnektivität; keine Inselsysteme | Alle 5 Ketten grün; ein kompletter Monat ohne Entwicklerhilfe spielbar |
| **15** | Test 1 | 5 Testpersonen, 90 Minuten, Beobachtung; Graph-/Erklärungs-Test | Spaß-Tor, Verständnis-Tor und Ketten-Test gemessen |
| **16** | Fix I | Die drei größten Probleme beheben | Kein Tester scheitert an Bedienung, Kette oder Crash |
| **17** | Test 2 | 5 neue Testpersonen; fünf Ketten und Erklärung | 3/5 wollen weiter; 4/5 erklären eine Kette |
| **18** | Content-Lock | Keine neuen Features; Text, Balance, Bugs; Graph-Tests bleiben grün | Alle 3 Krisen, 8 Figuren, 3+1 Projekte, 2 Fäden erlebbar |
| **19** | Puffer | Bugs, Performance, Accessibility-Basics; 20-Jahres-Soak | 90 Minuten ohne Crash; Save stabil; keine Runaway-Werte |
| **20** | Go/No-Go | Build + Testbericht + Graph-Testbericht + Entscheidung | Go für Alpha oder Konzeptänderung |

**Wichtig:** Woche 15 und 17 sind keine „Nice-to-have"-Tests. Wenn sie ausfallen, ist der Plan gescheitert. S0 kann in Woche 2 parallel als Papierprobe laufen; der Klickprototyp ist der eigentliche Schleifen-Test.

## 6. Systemintegration: Der eigentliche Beweis

Der Build ist **nicht** fertig, wenn alle Systeme einzeln existieren. Er ist fertig, wenn sie sich gegenseitig bewegen. Die verbindliche Verkabelung steht in [SYSTEMMODELL.md](SYSTEMMODELL.md); hier steht, wie sie gebaut und geprüft wird.

### 6.1 Die drei technischen Pflichtstücke

1. **Graph-Datei:** Knoten (State-Variablen), Kanten (Wirkungen), Delay, Quelle, Unsicherheit. Jede Kante ist maschinenlesbar; keine Wirkung nur im Code versteckt.
2. **Event-Log:** Jede Aktion und jede Zustandsänderung ist ein Event mit `tag`, `source`, `target`, `value`, `reason`. Kein direkter State-Mutation ohne Event.
3. **Reaktions-Engine:** Akteure reagieren auf Events nach Interesse, Information, Beziehung und Macht. Jede Aktion erzeugt mindestens eine Reaktion.

### 6.2 Die fünf Pflichtketten

Diese fünf Ketten werden **jede Woche** als Integrationstest gespielt. Wenn eine Kette bricht, ist die Woche nicht fertig.

| Kette | Startaktion | Muss durchlaufen | Endreaktion |
|---|---|---|---|
| **Mindestlohn** | Mindestlohn erhöhen | Lohnkosten → Preise → gefühlte Teuerung → Zufriedenheit → Zustimmung | Koalitionsdruck, Protest oder Wahlverlust |
| **EU-Beziehung** | Beziehung verbessern, Zollunion verhandeln | Vertrauen → Angebot → Verhandlung → Ratifikation → Handel → Wachstum | Zustimmung, Verlierer in Sektoren, Beziehungsänderung |
| **Erdbeben** | Katastrophe + Wiederaufbau | Haushalt → Schulden → Risikoaufschlag → Lira → Inflation | Zufriedenheit, Protest, Wahl |
| **Korruption** | Skandal untersuchen/decken | Medien → Vertrauen → Zustimmung → Koalition | Rücktritt, Neuwahl, Trust-Erholung |
| **Rüstungsdeal** | Beschaffung starten | Budget → Lieferung → Ausbildung → Readiness → Bedrohung | Beziehung zum Ally, Zustimmung, Haushalt |

### 6.3 Graph-Tests

- **Konnektivität:** Jede Domäne hat mindestens eine eingehende und eine ausgehende Kante.
- **Aktion-Reaktion:** Jede Aktion erzeugt ein Event und mindestens eine Reaktion innerhalb von 30 Tagen.
- **Erklärung:** Jede angezeigte Wirkung hat höchstens fünf Glieder; danach „Sonstige".
- **Keine Inselsysteme:** Kein UI-Element, keine Kennzahl, kein System ohne Eingang und Ausgang.
- **Keine Runaway-Werte:** 20-Jahres-Soak; keine Unendlichkeit, kein Null-Kollaps.
- **Keine dominante Strategie:** 100 automatisierte Läufe; keine Strategie gewinnt immer.

### 6.4 UI-Inspector

Jede Zahl bekommt einen „Warum?"-Inspector:

```
Inflation 32 %
  ← Wechselkurs (Lira −8 %)
  ← Zentralbank-Zinsentscheidung (gestern)
  ← Importpreise Energie (+12 %)
  ← politischer Druck (Wahl in 4 Monaten)
```

Der Inspector zeigt **maximal fünf Glieder**, die Quelle, den Zeitpunkt und die Unsicherheit. Der Rest steht in der Akte. So bleibt das Netz tief, ohne zur Spaghetti-Oberfläche zu werden.

### 6.5 Wöchentliche Integrationsdemo

Jede Woche endet mit einer 10-Minuten-Demo:

- eine Aktion,
- eine Kette,
- eine Reaktion,
- eine Erklärung.

Wenn die Demo nicht läuft, wird kein neues Feature begonnen.

## 7. Technik für den Ausschnitt

**Empfehlung: Web-Stack, kein Engine-Lock-in.**

- **TypeScript + React + Vite** für die Oberfläche.
- **SVG-Karte** mit 81 Provinzen; später MapLibre.
- **Zustand/Reducer** für den Spielzustand.
- **Vitest** für Simulation und Golden Runs.
- **JSON** für Daten und Spielstände; Versionfeld im Save.
- **Kein Backend.** Optionaler LLM-Aufruf per `fetch`; ohne Key läuft alles über Menüs.
- **Tauri** erst nach dem Slice; keine Engine-Entscheidung vor dem Beweis.

**Simulationsregeln:**

- Fester Tagestick, feste Reihenfolge: Politik → Wirtschaft → Gesellschaft → Medien → Ereignisse → Projekte → Diplomatie → Beschaffung → Wahl.
- Ein Seed pro Spielstand; alle Zufallswürfe protokolliert.
- Jede Änderung als Event loggen: `{tag, source, target, value, reason}`.
- Keine LLM-Zahl im State; das Modell rechnet, der LLM parst nur.
- Der Spieler kann pausieren und bis zum nächsten Entscheidungspunkt springen; die Simulation läuft dazwischen weiter.

## 8. Inhaltsbudget

| Inhalt | Menge | Umfang |
|---|---|---|
| Monats-/Wochen-Briefings | 12 Kapitel × 3 Karten | 36 Texte |
| Krisen | 3 × 3 Stufen | 9 Szenen |
| Figuren | 8 × 3 Szenen | 24 Szenen |
| Diplomatie | 3 Runden | 6–9 Szenen |
| Beschaffung | 4 Stufen | 4–6 Szenen |
| Projekte | 3 + 1 frei | 4 Entscheidungen + Folgen |
| Wahl/Bilanz | 2 | 2–3 Seiten |
| **Gesamt** | | **~30.000–40.000 Wörter** |

Das ist mehr als die vorherige 15.000–25.000-Fassung, weil 8 Figuren, 12 Felder und zwei Fäden dazukommen. Es ist weiterhin weit unter Suzerain (1 Mio.+ Wörter).

## 9. Datenbudget

- **20 Kernreihen** mit Quelle, Stichtag, Einheit, Lizenzstatus.
- **81 Provinzen** mit Bevölkerung, Zustimmung, einer Basiskennzahl.
- **7 Regionen** als Aggregation.
- **Istanbul** mit drei Bezirken.
- Fehlende Daten werden als Lücke markiert, nicht geschätzt und nicht als Null ausgegeben.
- Das vollständige Quellenregister ist Alpha, nicht Slice.

## 10. Testplan

**Rekrutierung:** 5 Testpersonen, die Strategiespiele mögen, aber NWO nicht kennen. Keine Freunde, die das Design schon kennen.

**Ablauf:** 90 Minuten, unbeobachtet spielen, Think-Aloud, danach 15 Minuten Interview.

**Messungen:**

- Zeit bis zur ersten Entscheidung (< 5 Min.).
- Anzahl echter Entscheidungen pro Monat (2–3).
- Kann die Person nach 45 Minuten die drei wichtigsten Vorgänge nennen?
- Kann sie nach 90 Minuten eine Kette erklären: „Ich habe X getan, deshalb Y, und das hat Z gekostet"?
- Will sie ein weiteres Jahr spielen?
- Welche Figur erinnert sie? Welche Szene?
- Versteht sie den Unterschied zwischen Absicht, Beschluss und Wirkung?
- Wo hat sie gelangweilt, verwirrt oder geärgert?

**Go-Kriterien:**

- 3/5 wollen weiter.
- 4/5 erklären eine Kette.
- 3/5 nennen drei Figuren.
- 4/5 verstehen Absicht/Beschluss/Wirkung.
- Kein Tester scheitert an der Bedienung.
- Kein Crash, kein Save-Verlust.

**No-Go:** Wenn die Schleife nicht trägt, wird sie geändert — nicht das Content-Volumen erhöht und nicht das Design ersetzt.

## 11. Danach: Alpha, Beta, Launch

Grobe Richtung, keine Zusage:

- **Alpha (Monate 6–9):** alle 12 Felder mit Entscheidungsketten, 10–12 Figuren, 10–12 Krisen, 10+ Projekte, mehrere Diplomatie-/Beschaffungsfäden, echte Daten für 20 Kernreihen, Art-Pass.
- **Beta (Monate 10–12):** Content-Lock, Balancing, Lokalisierung, Rechts-/Datenfreigaben, Performance, Demo, Steam-Seite.
- **Launch (Monate 13–15):** Demo/Next Fest, Store, Marketing, Release; danach Patch-Kadenz.

**Regel:** Kein Feature nach Alpha, das nicht die Kernschleife verbessert.

## 12. Die erste Woche, Tag für Tag

**Tag 1:** Ein-Seiten-Design: 365 Tage, 81 Provinzen, 12 Felder, 4 aktive Felder, 8 Figuren, 3 Krisen, 1 Diplomatie-, 1 Beschaffungsfaden. Streichliste daneben.

**Tag 2:** Papierprototyp: 12 Kapitel, 3 Krisen, 8 Figuren, eine Diplomatie-Runde, eine Beschaffungsstufe; eine Stunde selbst spielen.

**Tag 3:** Klickprototyp in HTML/Figma: Schreibtisch, Karte/Provinz, Akte, Gespräch, Budget, Bilanz. Keine Logik, nur Klicks.

**Tag 4:** Mit zwei Personen testen: Verstehen sie die Schleife? Wo hängen sie?

**Tag 5:** Schneiden. Alles, was nicht zur Schleife gehört, aus dem Prototyp entfernen. Abnahmekriterien für Woche 20 aufschreiben.

**Tag 6–7:** Simulationskern beginnen: State, Tagestick, Haushalt, 11 Wirtschaftsvariablen, Zentralbank.

## 13. Die drei Regeln, die den Plan zusammenhalten

1. **Das Spiel ist die Schleife, nicht das Modell.** Jede Woche muss ein spielbarer Tag/Monat entstehen; keine Woche nur Daten oder Architektur.
2. **Jede Entscheidung braucht eine sichtbare Folge.** Wenn eine Folge nicht in fünf Gliedern erklärbar ist, ist sie zu kompliziert oder zu flach.
3. **Testen schlägt Bauen.** Nach Woche 15 und 17 wird entschieden, nicht nach Gefühl.

**Kurz:** NWO wird gebaut wie ein Spiel, nicht wie eine Simulation. Aber es bleibt NWO: 81 Provinzen, Tage, zwölf Felder, freie Sprache, Diplomatie, Beschaffung. Zuerst der eine Tag, der funktioniert; dann das Jahr; dann die Türkei; dann die Welt.
