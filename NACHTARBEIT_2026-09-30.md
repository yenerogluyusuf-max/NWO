# Nachtarbeit 30.09.2026: Fachbereiche, Länder, Karte

Stand: 30. September 2026. Fortsetzung von [NACHTARBEIT_2026-09-29.md](NACHTARBEIT_2026-09-29.md). Aufträge des Projektinhabers am 30.09. (wörtlich zusammengefasst):

1. „Überarbeite und spiele das Spiel nochmal. Verhandele mit Ländern. Man muss auf Länder tippen können. Die Map muss viel genauer, präziser und schöner werden.“
2. „Es gibt keine Vorteile, kein Inventar. Es müssen die Konkurrenzspiele konkret in Bereichen analysiert werden: Wie funktioniert das Geld? Das Rechtssystem, und Änderungen dort ohne Geld, mit Folgen wie Stärke der Justiz? Das Militär? Der Ausbau der Infrastruktur? Jeder Bereich einzeln für sich und auf die Besonderheiten der Menschen zugeschnitten. Auch Kultur ist sehr wichtig, und die historischen Städte der Türkei. Bei Civilization kann man Wunder bauen: hier Riesenprojekte oder der Ausbau von Kulturwundern (Beispiel: die sieben Kirchen der Offenbarung liegen alle in der Türkei), Ausbau- oder Kulturerhaltungsprojekte.“
3. „Auch die anderen Länder müssen viel besser aussehen.“
4. „Das Parlament kann man noch schöner machen. Auch schönere Animationen bei Wundern, beim Parlament.“

## Blöcke und Reihenfolge

| Block | Inhalt | Stand |
|---|---|---|
| N0 | Recherche der Konkurrenzspiele je Bereich (Geld, Recht, Militär, Infrastruktur, Kultur und Wunder, Diplomatie) mit Übertrag auf Staatsräson; Erbekatalog der Türkei | fertig (Recherche in `RECHERCHE_KONKURRENZ_FACHBEREICHE.md`) |
| N1 | Konzeptdatei `FACHBEREICHE.md`: je Bereich eigene Größen, Bestand (Inventar), Projekte und Wunder, Vorteile, Zielkonflikte, Ereignisse | fertig |
| N2 | Simulation `reich.ts`: Fachbereichswerte, Bestand, Projekte mit Bauzeit, Vorteile (Doktrinen und Reformen), Unterhalt und Verfall; Tests | fertig |
| N3 | Oberfläche: Fenster „Reich“ mit Reitern Recht, Militär, Infrastruktur, Kultur und Erbe, Haushalt; Projektkarten; Wundermarken auf der Karte; Fertigstellungs-Animation | fertig |
| N4 | Anbindung: Ereignisse, Programme, Bilanz, Gespräch, Mentorin; Vorschau „Was folgt daraus?“ zeigt Fachbereichsgrößen statt Geld | fertig |
| O | Länder: antippbar in jeder Kartenebene, Hover, Länderkarte; Verhandlungstisch mit Klauseln und Abkommen; Flaggen und schöneres Länderfenster; weitere Länder | fertig (`VERHANDLUNGSTISCH.md`); offen: Rundflaggen als Pins |
| P | Karte 2: Küste und Grenzen aus OSM/geoBoundaries in voller Auflösung, Küstenverlauf als Distanzfeld im Shader, Nachbarländer mit Städten und Namen, Beschriftungsregeln, Maßstab | fertig (DEM z9 offen) |
| Q | Parlament schöner (Halbrund mit Sitzen, Abstimmung animiert), Wunder-Animation | fertig |
| R | Wieder wie ein Nutzer spielen, Fehler beheben, Doku, Gedächtnis | Durchlauf und Doku fertig; Kalibrierung nach jedem Block wiederholen |

Regeln unverändert: Deutsch mit echten Umlauten, keine Emojis, keine erfundenen Zahlen (Quelle oder Lücke), Härte des echten Lebens, Tests grün, nichts committen, vor bezahlten Läufen fragen (Sprachmodell nur nach Freigabe).


## Nachtrag 30.09. nachmittags

Zusätzlich auf Zuruf des Projektinhabers: KI mit mehreren Anbietern (nicht nur Claude), Gespräch neu gestaltet, Personen und Zusagen, Wähler wie in Democracy 4, Wirtschaft mit anklickbaren Kennzahlen und echten Folgen bei Zentralbank und Haushalt, Politik nach Bereichen, neuer Schreibtisch, 3D-Häuser von der Karte entfernt, Kapital-Überziehung. Ergebnis: [ENTSCHEIDUNGEN.md, Block M](ENTSCHEIDUNGEN.md). Die Blöcke liefen parallel als getrennte Stränge; die Balance wurde danach neu justiert (klugerBot: leicht 100 %, normal 75 %, hart 25 %).
