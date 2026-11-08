# Auftrag an GLM: Recherche und Integrationsvorschläge für Staatsräson

## Worum es geht

Staatsräson ist eine Politiksimulation: Man regiert die Türkei ab 2028. Leitbild des Projektinhabers: **„Das Spiel wird ein Democracy 4, HOI 4 und Civ 6 in der Realität.“**

- **Democracy 4:** Haushalt nach Ressorts, Rentenniveau, Steuern, Wählergruppen, Politik mit Folgen.
- **HOI 4:** Streitkräfte als Bestand, Ausbau, Technologie, Kriegsziele, Bündnisse.
- **Civ 6:** Karte, Ressourcen, strategische Orte, Forschungs- und Agendabaum, sichtbare Bauten.
- **Alles mit echten Daten der Türkei**, und: **Realismus verpackt in ein Spiel, nichts überkompliziert.** Wenige echte Entscheidungen mit spürbarem Einsatz statt Formulararbeit.
- **Alles hängt zusammen.** Beispiel: Massive Investition in Bildung ist Voraussetzung für technologischen Fortschritt; Fortschritt braucht Fachkräfte, Fachkräfte wandern ab ohne Perspektive, Rüstung braucht Chips und Stahl, Krieg trifft Einfuhren und Preise.

Deine Aufgabe: zu jedem Thema unten **gründlich recherchieren** und **konkrete, baubare Integrationsvorschläge** machen, die zu diesem Leitbild passen.

## Was im Spiel schon gebaut ist (nicht neu erfinden, sondern anschließen)

Code liegt in `game/src` (nur lesen). Wichtige Dateien:

| Bereich | Dateien |
|---|---|
| Wirtschaft, Makromodell | `sim/economy.ts`, `sim/wirtschaft*.ts`, `sim/devisen.ts`, `sim/zentralbank.ts`, `sim/maerkte.ts` |
| Haushalt (wird gerade auf Ressortetats umgebaut) | `sim/haushalt.ts`, `data/haushaltsplan.ts` |
| Politiknetz (Wirkungen, 262 Knoten) | `data/politiknetz.ts`, `sim/netz.ts`, `sim/synergien.ts` |
| Gesellschaft, Opposition, Rathäuser | `sim/gesellschaft.ts`, `sim/opposition.ts`, `sim/bewegungen.ts`, `sim/kommunen.ts` |
| Außenpolitik, Flucht, Energie, Terror | `sim/diplomatie.ts`, `sim/welt-modell.ts`, `sim/laender.ts`, `sim/pakte.ts` |
| Krieg | `sim/krieg.ts`, `sim/krieg-typen.ts` |
| Bauvorhaben, Technologieketten | `sim/reich.ts`, `data/reich/technologie.ts`, `data/reich/zukunft.ts`, `data/reich/infrastruktur.ts` |
| Achsen der Politik (fünf Achsen) | `data/linien.ts`, `sim/linie.ts` |
| Wahl, Amtszeit | `sim/wahl.ts`, `sim/amtszeit.ts` |

In Arbeit (bitte trotzdem lesen, falls vorhanden): `sim/streitkraefte.ts` (Militärbestand), `sim/gueter.ts` (Güterbilanz), `sim/behoerden.ts` (Ausbau von MIT und Behörden), `sim/infrastruktur.ts` (Netze mit Auslastung), `sim/wissensbasis.ts` (Bildung begrenzt Forschung), `sim/vorgaenge.ts` (politische Vorgänge).

## Regeln

1. **Nur neue Dateien.** Je Thema eine Datei `RECHERCHE_GLM_<NR>_<THEMA>.md` im Projektstamm. Optional ein Datenentwurf als `game/src/data/entwurf_glm/<thema>.ts` (wird nicht vom Spiel geladen, ich binde ihn ein). Nichts Bestehendes ändern.
2. **Jede Zahl mit Quelle:** Herausgeber, Titel, Jahr, Link oder Fundstelle. Fehlt eine Quelle: „nicht gefunden“, nie schätzen. Widersprüche nebeneinanderstellen. Stand möglichst 2024 bis 2026.
3. **Primärquellen bevorzugen:** TÜİK, Strateji ve Bütçe Başkanlığı, Hazine, TCMB, SGK, MTA, EPDK, BOTAŞ, Resmî Gazete, TBMM; international FAO, USGS, IEA, Ember, IISS, SIPRI, OECD, Weltbank, UNHCR.
4. **Keine echten lebenden Personen als Spielfiguren.** Institutionen, Parteien, Firmen und Orte dürfen real sein.
5. **Deutsch mit echten Umlauten.** Türkische Namen in korrekter Schreibung.
6. **Prüfe dich selbst:** Am Ende jeder Datei eine Liste „Unsicher oder unbelegt“.

## Aufbau jeder Datei

1. **Kurzfassung** (fünf Sätze): Was ist der Kern, was bedeutet er für das Spiel?
2. **Befund:** Tabellen mit Zahlen und Quellen.
3. **Zusammenhänge:** Welche anderen Bereiche hängen daran (mit Richtung und Verzug, z. B. „Bildungsausgaben → Fachkräfte, 3 bis 8 Jahre“)? Belege, wo möglich.
4. **Anschluss im Code:** Welche vorhandenen Dateien, Größen und Funktionen berührt das (Dateipfad, Name)?
5. **Integrationsvorschläge** (höchstens fünf), je:
   - **Entscheidung:** Was entscheidet der Spieler, welche zwei bis vier Alternativen?
   - **Folgen:** kurz (Monate) und lang (Jahre), mit Gewinnern und Verlierern.
   - **Gegenspieler:** Wer reagiert (Partei, Verband, Land, Behörde)?
   - **Anzeige:** Wo im Spiel (Akte, Karte, Linse, Ereignis) und in einem Satz wie.
   - **Daten:** Felder als TypeScript-Skizze.
   - **Aufwand:** klein, mittel, groß.
   - **Spieltest:** Woran erkennt man, dass es Spaß macht und nicht nur mehr Klicks bringt?
6. **Verworfen:** Was ausdrücklich nicht gebaut werden sollte (zu kompliziert, kein echter Unterschied für den Spieler).
7. **Vorbilder:** Wie lösen Democracy 4, HOI 4, Civ 6, Victoria 3, Suzerain das, und was davon passt?
8. **Unsicher oder unbelegt.**

## Themen, nach Priorität

1. **Haushalt nach Ressorts und Renten (Democracy 4):** Zentralhaushalt 2025 und 2026 nach Ressorts in Lira und Prozent des BIP; Rentensystem (Rentenniveau, Eintrittsalter, EYT-Regelung, Kassenlage, Zahl der Rentner, Demografie bis 2040); Wirkungen und Verzüge von Ausgaben in Bildung, Gesundheit, Forschung, Verteidigung, Infrastruktur (Studien mit Elastizitäten).
2. **Bildung, Wissen, Technologie (Civ 6 und Realität):** Bildungsausgaben, PISA, Hochschulen, Absolventen nach Fächern, Abwanderung von Fachkräften; Forschungsausgaben, TÜBİTAK, Technoparks, Patente; Schlüsseltechnologien (Chips, Batterien, Triebwerke, Drohnen, Raumfahrt, KI, Biotechnologie, Kernkraft) mit Stand, Firmen, Abhängigkeiten, Aufbauzeiten. Ziel: eine belegte Kette Bildung → Fachkräfte → Forschung → Technologie → Industrie und Militär.
3. **Güter, Autarkie, Ressourcen (Civ 6):** Produktion, Verbrauch, Einfuhr, Ausfuhr, Lager und Autarkiegrad für Getreide, Obst und Gemüse (auch Bananen), Fleisch und Milch, Zucker, Wasser, Strom, Erdgas, Erdöl, Kohle, Stahl, Bor, Chrom, Kupfer, seltene Erden, Chips, Medikamente, Dünger; Hauptlieferanten und Hauptkunden; Vorkommen je Provinz mit Koordinaten; strategische Reserven (Öl, Gas, Getreide).
4. **Streitkräfte und Rüstung (HOI 4):** Bestand je Gattung mit Typ, Zahl, Alter oder Generation, Herkunft; Rüstungsfirmen und Produkte; Beschaffungsdauern und Kosten; Abhängigkeiten (Triebwerke, Elektronik); dasselbe kompakt für Griechenland, Iran, Syrien, Irak, Israel, Armenien, Aserbaidschan, Russland.
5. **MIT und Behörden:** Aufgaben, Struktur, Personal und Haushalt des MIT (soweit öffentlich), Rechtsgrundlagen, bekannte Arten von Operationen (abstrakt), Kontrolle durch Parlament und Gerichte; dazu Polizei, Gendarmerie, Justiz (Fallzahlen, Rückstände), Steuerverwaltung, AFAD, Küstenwache: Kapazität, Engpässe, Ausbaumöglichkeiten.
6. **Infrastruktur und Belastung:** Straßen, Autobahnen, Bahn, Häfen, Flughäfen, Stromnetz, Wasser, Internet, Wohnungen, Kliniken: Kapazität und Auslastung, Engpässe nach Region, große Projekte (Kosten, Dauer, Finanzierung, Betreibermodelle).
7. **Geostrategische Orte (Civ 6 und HOI 4):** Meerengen und Montreux, Zypern und Seegebiete, Pipelines, Häfen, Stützpunkte, Staudämme an Euphrat und Tigris, Seewege (Suez, Hormus, Bab al-Mandab): Bedeutung, Kontrolle, Durchsatz, was ein Wechsel der Kontrolle bewirken würde.
8. **Gesetzgebung als Konflikt:** Weg eines Gesetzes in der TBMM, Präsidialerlasse und ihre Grenzen, Verfassungsgericht; die 20 politisch wichtigsten Gesetzesfelder mit typischen Konfliktlinien (wer will was, wer blockiert, welche Kompromisse sind üblich).
9. **Menschen statt Indizes:** typische Haushalte (Rentnerin, Familie mit zwei Einkommen, Landwirt, Exportbetrieb, Familie im Erdbebengebiet, Studentin) mit Einkommen, Ausgabenkorb, Miete, Betroffenheit von Inflation, Mindestlohn, Energiepreisen.
10. **Kriegsschauplätze:** Verwaltungsgliederung, Bevölkerung, Gelände, Infrastruktur, Akteure und Ressourcen in Nordsyrien, Nordirak, Ägäis, Zypern, Südkaukasus.

## Abgabe

Bearbeite die Themen der Reihe nach, eine Datei je Thema. Lieber ein Thema gründlich als alle oberflächlich. Melde nach jedem Thema kurz, welche Datei fertig ist.
