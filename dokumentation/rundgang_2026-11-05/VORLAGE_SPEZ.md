# Vorlage für die Detailspezifikation je Ansicht

Entscheidungen des Projektinhabers (ENTSCHEIDUNGEN W, 5. November): (1) Kabinett mit den 17 Ministerien der Türkei seit 2018 (Justiz; Familie und Soziales; Arbeit und Sozialversicherung; Umwelt, Städtebau und Klima; Äußeres; Energie und Rohstoffe; Jugend und Sport; Finanzen; Inneres; Kultur und Tourismus; Bildung; Verteidigung; Gesundheit; Industrie und Technologie; Landwirtschaft und Forst; Handel; Verkehr und Infrastruktur). (2) Ein Weg zum Gesetz: die Maßnahme (Gesetzeskatalog wird zu benannten Fassungen an Maßnahmen; Parlament zeigt die Tagesordnung). (3) Karte als Bühne für Land, Außen, Sicherheit (Akte wird Seitenfenster neben der Karte). Grundplan: /home/user/NWO/PLAN_OBERFLAECHE_2026-11-05.md (Abschnitt 3 Struktur, 2 Leitsätze). Richtwert Bildschirm: 1440×900, Akteninhalt ca. 1150×750 px.

Für JEDE neue Ansicht deines Bereichs genau diese Gliederung (Markdown, Deutsch):

#### <Bereich › Ansicht>
1. **Frage und Erfolg:** die Frage des Spielers; woran man erkennt, dass die Ansicht sie in 5 Sekunden beantwortet.
2. **Aufbau (Zonen):** Zone für Zone von oben nach unten / links nach rechts mit ungefährer Größe in px oder Anteil; was in der ersten Bildschirmhöhe stehen muss.
3. **Inhalte je Zone:** jedes Element mit Datenquelle im Code (Funktion/Feld und Datei unter /home/user/NWO/game/src, z. B. `staatsfinanzen(w).einnahmenMrd` in sim/staatsfinanzen.ts), Darstellung (Diagrammtyp, Zahlenformat, Farbe/Wertung), und was fehlt (Datenlücke mit möglicher Quelle; nichts erfinden).
4. **Zustände:** wie die Ansicht aussieht ohne Daten/leer, im Normalfall, in einer Krise, im Krieg, vor der Wahl, mit 0 Kapital (nur die zutreffenden).
5. **Klicks:** Tabelle `Element | Aktion (Klick/Hover/Taste) | Ergebnis | landet in`. Jeder Klick der Ansicht, auch zurück und Drill-down.
6. **Übernommen / gelöscht:** welche bestehenden Komponenten (Dateipfade unter src/ui) wiederverwendet, umgebaut oder gelöscht werden; welche heutigen Reiter/Seiten hier aufgehen (mit den Bildnummern aus dem Rundgang).
7. **Simulationsbedarf:** was in src/sim fehlt oder geändert werden muss (neue Felder, neue Funktionen, Zuordnungen zu den 17 Ministerien), ohne Spielregeln stillschweigend zu ändern.
8. **Texte:** neue/umbenannte Begriffe, was entfällt (Jargon), Zahlenformat (ganze Zahlen, Einheiten).
9. **Abnahme:** messbare Kriterien (z. B. Höhe ≤ 1,3 Bildschirme, kein Wert doppelt, alle Regler mit Preis, keine Nachkommastelle bei Indizes, Test X in test/…), und welche bestehenden Tests angepasst werden müssen.
10. **Aufwand und Abhängigkeiten:** S/M/L, Vorbedingungen (andere Ansichten, Entscheidungen, Recherche).

Danach für deinen Teil: **Fehlerliste** (aus deiner Kritik, je Fehler Datei/Zeile wenn bekannt und die genaue Behebung) und **offene Fragen** (höchstens fünf).
