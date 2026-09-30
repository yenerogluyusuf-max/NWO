# Nachtarbeit 30.09.2026: Fachbereiche, Länder, Karte

Stand: 30. September 2026. Fortsetzung von [NACHTARBEIT_2026-09-29.md](NACHTARBEIT_2026-09-29.md). Aufträge des Projektinhabers am 30.09. (wörtlich zusammengefasst):

1. „Überarbeite und spiele das Spiel nochmal. Verhandele mit Ländern. Man muss auf Länder tippen können. Die Map muss viel genauer, präziser und schöner werden.“
2. „Es gibt keine Vorteile, kein Inventar. Es müssen die Konkurrenzspiele konkret in Bereichen analysiert werden: Wie funktioniert das Geld? Das Rechtssystem, und Änderungen dort ohne Geld, mit Folgen wie Stärke der Justiz? Das Militär? Der Ausbau der Infrastruktur? Jeder Bereich einzeln für sich und auf die Besonderheiten der Menschen zugeschnitten. Auch Kultur ist sehr wichtig, und die historischen Städte der Türkei. Bei Civilization kann man Wunder bauen: hier Riesenprojekte oder der Ausbau von Kulturwundern (Beispiel: die sieben Kirchen der Offenbarung liegen alle in der Türkei), Ausbau- oder Kulturerhaltungsprojekte.“
3. „Auch die anderen Länder müssen viel besser aussehen.“
4. „Das Parlament kann man noch schöner machen. Auch schönere Animationen bei Wundern, beim Parlament.“

## Blöcke und Reihenfolge

| Block | Inhalt | Stand |
|---|---|---|
| N0 | Recherche der Konkurrenzspiele je Bereich (Geld, Recht, Militär, Infrastruktur, Kultur und Wunder, Diplomatie) mit Übertrag auf Staatsräson; Erbekatalog der Türkei | läuft |
| N1 | Konzeptdatei `FACHBEREICHE.md`: je Bereich eigene Größen, Bestand (Inventar), Projekte und Wunder, Vorteile, Zielkonflikte, Ereignisse | offen |
| N2 | Simulation `reich.ts`: Fachbereichswerte, Bestand, Projekte mit Bauzeit, Vorteile (Doktrinen und Reformen), Unterhalt und Verfall; Tests | offen |
| N3 | Oberfläche: Fenster „Reich“ mit Reitern Recht, Militär, Infrastruktur, Kultur und Erbe, Haushalt; Projektkarten; Wundermarken auf der Karte; Fertigstellungs-Animation | offen |
| N4 | Anbindung: Ereignisse, Programme, Bilanz, Gespräch, Mentorin; Vorschau „Was folgt daraus?“ zeigt Fachbereichsgrößen statt Geld | offen |
| O | Länder: antippbar in jeder Kartenebene, Hover, Länderkarte; Verhandlungstisch mit Klauseln und Abkommen; Flaggen und schöneres Länderfenster; weitere Länder | offen |
| P | Karte 2: Küste und Grenzen aus OSM/geoBoundaries in voller Auflösung, Küstenverlauf als Distanzfeld im Shader, Nachbarländer mit Städten und Namen, Beschriftungsregeln, Maßstab | Datenaufbereitung läuft |
| Q | Parlament schöner (Halbrund mit Sitzen, Abstimmung animiert), Wunder-Animation | offen |
| R | Wieder wie ein Nutzer spielen, Fehler beheben, Doku, Gedächtnis | offen |

Regeln unverändert: Deutsch mit echten Umlauten, keine Emojis, keine erfundenen Zahlen (Quelle oder Lücke), Härte des echten Lebens, Tests grün, nichts committen, vor bezahlten Läufen fragen (Sprachmodell nur nach Freigabe).
