# Verhandlungstisch: Verträge mit anderen Ländern

Stand 30.09.2026. Umsetzung: `game/src/sim/abkommen.ts`, Daten `game/src/data/abkommen.ts`, Oberfläche `game/src/ui/welt/`, Tests `game/test/abkommen.test.ts`.
Vorbilder (belegt in `RECHERCHE_KONKURRENZ_FACHBEREICHE.md`, Abschnitt 6): Victoria 3 (Vertrag aus Klauseln, die KI bewertet das ganze Paket), Crusader Kings 3 (Faktorenliste), Civilization VI (Gründeliste in Grün und Rot), Hearts of Iron IV (Kosten und Sperrfristen).

## Grundsatz

Ein Vertrag ist kein Knopf, sondern ein Paket. Die Türkei **bietet** (gibt, leistet, öffnet, verspricht) und **verlangt** (erhält). Jede Klausel wirkt im eigenen Land (Größen des Politiknetzes, Gruppen, Kapital, Schulden, Risiko) und auf das Verhältnis zum Partner. Nichts davon ist nur Geld: Wirkung und Kehrseite stehen an jeder Klausel.

## Bewertung durch die Gegenseite

Punkte des Partners = Summe der Klauselwerte + Vertrauen + Streit + Hebel + Erinnerung + Gegenseitigkeit.

| Beitrag | Rechnung |
|---|---|
| Klauselwert | Wert für den Partner (Profil des Landes): positiv bei Angeboten, negativ bei Forderungen |
| Vertrauen | (Vertrauen − 45) / 5 |
| Streit | −(Konflikt − 40) / 8 |
| Hebel | Abhängigkeit des Partners (+) oder Übergewicht (−), je Land |
| Erinnerung | −Bruchpunkte (klingen mit 0,15 je Monat ab); +1,5 je gehaltenem Vertrag, höchstens +3 |
| Gegenseitigkeit | +2, wenn Angebote und Forderungen im Paket stehen |

Schwelle: `4 + (Laufzeit − 2) · 0,35` (2 Jahre: 4; 5 Jahre: 5,05; 10 Jahre: 6,8). Darüber: **Zustimmung**. Bis 6 Punkte darunter: **Gegenangebot** mit genau einer Änderung (kürzere Laufzeit, ein weiteres Angebot oder Verzicht auf eine Forderung; nach Preis für die Türkei geordnet, höchstens drei). Weiter darunter: **Ablehnung**. Eine **Rote Linie** im Paket ist ein **Veto**.

Stimmung in fünf Stufen: Ablehnend, Skeptisch, Zögernd, Geneigt, Einverstanden. Die Gründe stehen in Grün und Rot mit Gewichtspunkten; die Zahlen selbst bleiben verborgen.

Prüfen kostet nichts, das Angebot selbst kostet `2 + ⌈n/2⌉ + Σ Preis der Klauseln im eigenen Land` Kapital (auch auf Pump, siehe Überziehung). Ein Gegenangebot anzunehmen kostet nur noch den politischen Preis der Klauseln. Nach Ablehnung 15 Tage, nach einem Veto 45 Tage Sperre und ein kleiner Verlust an Vertrauen.

## Laufende Verträge

- **Dauerwirkungen** monatlich, skaliert mit der Laufzeit (2 Jahre 0,8; 5 Jahre 1,0; 10 Jahre 1,25). Was der Partner liefert (Forderungen der Türkei), ruht zu 60 %, solange er unzuverlässig ist (Vertrauen unter 25 oder Konflikt über 85).
- **Jahresprüfung**: Klauseln mit Pflicht (Zölle niedrig, Justizreform, Grenzschutz, Investitionsklima, keine Bohrungen) werden gegen das Politiknetz geprüft. Bestanden: Vertrauen +2. Verfehlt: Vertrauen −6, Konflikt +3, ein Verstoß. Zwei Verstöße: **Bruch** (Vertrauen −12, Konflikt +6, Ansehen −2, Bruchpunkte +6).
- **Ablauf**: gehaltene Verträge zählen bei der nächsten Verhandlung.
- **Kündigen**: nach einem Drittel der Laufzeit ordentlich (Vertrauen −4), früher gilt es als Bruch.
- **Ausstrahlung auf Dritte**: Ein Rüstungsgeschäft mit Baku verärgert Erevan, Gas aus Moskau verärgert Washington und Brüssel usw. (Tabelle `AUSSTRAHLUNG`).

## Vermittlung zwischen Dritten

Eine Lücke, die kein Konkurrenzspiel besetzt: Ankara vermittelt zwischen Ukraine und Russland (Gefangenenaustausch, Meerengen, Getreidekorridor) und zwischen Armenien und Aserbaidschan (Transit gegen Grenzöffnung). Beide Seiten müssen der Türkei als Vermittler vertrauen; Aussicht aus Vertrauen, Streit und Ansehen (8 bis 85 Prozent); Erfolg stärkt das Ansehen, Scheitern kostet Kapital und etwas Ansehen.

## Länder

18 Länder mit Profil: USA, EU, Russland, Griechenland, Iran, Syrien, Irak, Aserbaidschan, Armenien, Saudi-Arabien und Golf, Israel, China, Ukraine, Georgien, Ägypten, Libyen, Kasachstan, Zypern. Mitglieder der EU teilen sich die Beziehung zur Union (Griechenland und Zypern verhandeln zusätzlich für sich). Rote Linien: Griechenland (Entmilitarisierung der Inseln), Armenien (Verzicht auf die Anerkennung von 1915), Zypern (Gleichberechtigung Nordzyperns).

Tatsachen im Text der Klauseln stammen aus der Recherche mit Quellen (u. a. Iran-Gasvertrag 9,6 Mrd. m³ und Ablauf Ende Juli 2026, Kirkuk–Ceyhan, BTK-Bahn seit 2. Juni 2026, Handelsdefizit mit China 46,3 Mrd. US-Dollar 2025, Beistandspakt Saudi-Arabien–Pakistan–Türkei vom 7. August 2026). Alle Klauselwerte, Schwellen und Wirkungen sind **Spielparameter** (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

## Oberfläche

Karte: Tippen auf ein Land (in jeder Kartenebene) öffnet eine kleine Karte mit Flagge, Haltung, Werten und den Wegen „Verhandeln“ und „Länderakte“. Welt: Länderliste mit Flaggen (SVG), Akte mit Überblick, Verhandlungstisch, Verträgen und Gesten; beim Verhandeln schrumpft die Liste zur Flaggenleiste. Der Tisch zeigt oben die Stimmung mit Gründen, in zwei Spalten die Klauseln mit Wirkung und Kehrseite, unten fest die Leiste mit Laufzeit, Kosten und Angebot. Die Antwort erscheint mit Stempel oben; ein Gegenangebot lässt sich annehmen oder in den Tisch übernehmen.

Gespräch mit der KI: Vorschläge der Art `abkommen`, `vorhaben` und `vermittlung` laufen durch dieselben Prüfungen wie die Bedienung von Hand; bestätigt werden sie vom Spieler.

## Offen

- Eigene Initiativen der Partner (Angebote an die Türkei, Ultimaten), Ereignisse zu Verträgen (Prüfung, Verlängerung).
- Rundflaggen als Pins an den Hauptstädten auf der Karte.
- Weitere Länder (Levante, Westbalkan, Golfstaaten einzeln).
