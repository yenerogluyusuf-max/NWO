# Nachtarbeit 4./5. November 2026 – Bericht für den Morgen

Auftrag: die Nacht durch prüfen, verbessern, vergleichen, über alle Bereiche, und überlegen, was das Spiel sein soll und was andere Spiele lehren. Leitbild und Vergleich: [LEITBILD_UND_VORBILDER_2026-11-05.md](LEITBILD_UND_VORBILDER_2026-11-05.md). Vollsuite am Ende der Nacht (dritter Durchlauf, 7 Uhr): 207 Testdateien, 2993 Tests bestanden, 8 übersprungen, keine Fehler (vorher 25 Folgefehler, alle behoben). Rund 45 Commits, alle auf `claude/blissful-galileo-llka15`, `claude/weiter-b91y4u` und `codex/spiel-konsistenz`.

## 1. Das Wichtigste in fünf Punkten

1. **Kluges Regieren gewinnt wieder.** Seit den Ministeranliegen (2. November) verlor der kluge Testspieler die meisten Wahlen. Jetzt gewinnt er 8 von 8 ersten Wahlen, Nichtstun verliert 7 von 8, blindes Hochdrehen 8 von 8. Die Schwierigkeitsstufen sind klar getrennt (Zustimmung nach 58 Monaten 63 / 54 / 47, Siege 15 / 16 / 11 von 16).
2. **Dieselbe Partie in jeder Sprache.** Ein echter Fehler: Auf Englisch lief das Spiel anders als auf Deutsch, weil die Ereignisdichte deutsche Titel las. Chronik und Protokoll tragen jetzt Merkmale statt Textsuche (ENTSCHEIDUNGEN U); ein neuer Test prüft de, en und tr.
3. **Neue Mechaniken nach Vorbildern:** Amtszeit-Epochen und Beobachter-Kränkungen (Civilization 6), Zynismus bei Kehrtwenden (Democracy 4), das Urteil der Geschichte am Wahlabend (Tropico), Minister, die sich an Ihre Antworten erinnern (Suzerain).
4. **Mehr Karte (Vorgabe S):** Ohne 3D-Grafik zeigt jetzt eine 2D-Karte die echten Provinzen und Nachbarn, auch die Kriegslage mit Front und Vorstößen.
5. **Gesamtbild (Vorgabe T):** Außenpolitik hat eine Lage statt zwei; fünf neue Kopfbilder, damit nicht drei Bereiche dasselbe Istanbul zeigen; eine Anrede („Sie“); Zahlen, die sich widersprachen, stimmen überein; auf dem Handy steht das Dringende zuerst.

## 2. Gefundene und behobene Fehler

| Befund | Ursache | Behebung |
|---|---|---|
| Englische Partie weicht ab Tag 210 ab | Ereignisdichte erkannte Termine am deutschen Titel | Merkmale `art`, `vorlage`, `ohneEntscheidung`, `presse` (sim/chronik.ts) |
| Wahlabend unsichtbar nach „Zum Schreibtisch“ | Ebene 12 unter der Akte (50) | Wahlabend, Umbildung, Bilanz auf Ebene 105 |
| Kabinett: „Vorlagen 15“, darunter „Alle 17“ | zwei Zählungen | eine gemeinsame Funktion |
| Abstimmungen auf Englisch nicht erkannt | Oberfläche las „Das Parlament nimmt …“ | strukturiertes Feld `abstimmung` |
| Krisenbanner, Statistik, Verträge, Wahlkampf nur deutsch | feste Texte in der Simulation | Kataloge `krisen.json`, `protokoll.json`, `reichtypen.json` |
| Spielbarkeitstest überschritt die Zeitgrenze | Tageszählung im Test | Zählung aus der Chronik, dreimal schneller |
| Präsident mit 74,5 % Zustimmung verurteilt | Enthebung zählte jeden Sitz außerhalb des Lagers | Scheu vor den Wählern über 55 % (ENTSCHEIDUNGEN U) |
| Laden veränderte neue Spielstände | Migration markierte Kommunalwahlen nachträglich | Merkmal beim Entstehen, Migration nur für alte Stände |
| Zwei neue Großprojekte ohne Übersetzung | Datenkatalog fehlte | Deutsch, Englisch, Türkisch ergänzt |

## 3. Was sich für den Spieler ändert

- **Schreibtisch:** „Jetzt wichtig“ steht im ersten Blick; die Fristenleiste kündigt den Wahlkampf an (ohne Vorbereitung kosten Angriffe der Opposition bis zu sechs Punkte).
- **Wahlabend:** nach der Auszählung das Urteil über die Amtszeit (golden, normal, dunkel, heroisch) mit den drei größten Momenten.
- **Minister:** Die nächste Anliegen-Karte nennt, woran sich der Minister erinnert („Mein Anliegen zu Kriminalität wurde zurückgewiesen“).
- **Außenpolitik:** Der Reiter „Weltlage“ zeigt die echte Lage (Vorwarnungen, Instrumente, Verlauf); die Unterleiste heißt Staaten, Blöcke, Dienst, Vermittlung.
- **Kopfbilder:** Welt (Globus und Fahnen), Platz mit Uhrturm (Gesellschaft), Sendeturm (Medien), Sternwarte und Rakete (Forschung), Amtssitz (Kabinett).

## 4. Offen und für Sie zu entscheiden

- **Müdigkeit 0,10 je Monat** liegt über der Untergrenze des Belegs (2,25 Punkte je Wahlperiode). Bitte prüfen, ob das Spiel damit hart genug bleibt; „hart“ behält die alte Müdigkeit.
- **Übersetzung:** Protokoll, Verträge, Initiativen anderer Staaten, Ländernamen und Ereignispreise kommen jetzt aus Katalogen; die englische Oberfläche zeigt in der Stichprobe keine deutschen Reste mehr. Offen sind einzelne Texte aus Datenmodulen (Länderprofile, Rote-Linien-Sätze).
- **Mentorin und Prolog duzen** bewusst; alle Systemtexte siezen. Wenn auch die Mentorin siezen soll, ist das ein kurzer Schritt.
- Nächste Schritte stehen in [PLANERWEITERUNG.md](PLANERWEITERUNG.md) §10: Befehle auf der Karte, endogene Gruppengröße (Democracy 4), Besatzungsverwaltung (HOI4).

## 5. Nachtrag am Vormittag: gespielt wie ein Neuling

Auf Ihre Frage hin habe ich das Spiel im Browser durchgeklickt, ohne Wissen über die Innereien: Prolog, Amtsantritt, Ziele, rund siebzig Ereignisse, ein Gesetz über „Politik“ bis zur Umsetzung, Parlament, Haushalt, Außen- und Sicherheitslage, Kommunalwahl, Wahlkampf mit TV-Duell und die Wiederwahl im Dezember 2030 (52 % Zustimmung, zweite Amtszeit). Was auffiel und behoben ist:

| Auffällig | Behebung |
|---|---|
| Man erfährt nicht, was ohne Antwort geschieht | Abschnitt „Ohne Antwort“ mit Standardfolge, Wirkungen und Preis des Schweigens |
| Justizministerin rät bei der Verfassungsrichterwahl zu Gefängnissen | Rat nach der Größe des Ereignisses |
| Rentenzusage zeigt Justiz und Pressefreiheit | Kennzahlen nach dem Thema der Zusage |
| „Druck aus Straßburg −2“ rot | Farbe nach Wertung, Pfeil nach Richtung |
| 47 % im Fenster, 50 % in der Leiste | Umfrage mit Institut und Alter |
| EU 40 im Kopf, 38 in der Weltlage | eine Zahl: Vertrauen der EU |
| „Gasversorgung fehlt“ bei Versorgung 100 | Warnung nach echter Versorgung |
| „Mehrheit 328“ ohne Bezug | „Lager …, geduldet …, Mehrheit ab 301“ unter der Zahl |
| Drei Minister namens Erdem | keine doppelten Nachnamen |
| Zwischenfall „an der Grenze“ mit den USA | Ort nach Geografie |
| Gesetz beschlossen, aber nirgends gemeldet nach dem Laden | „Stand der Dinge“ nennt die Abstimmungen |
| „stehen unter Heute“, Reiter heißt „Vorschläge“ | Verweis nennt den Reiter |
| Kommunalwahl lief als kurze Meldung vorbei | Hinweis mit Ergebnis und Folge, das Spiel hält an |
| „Währungskrise im Iran. Währungskrise im Iran.“ | erster Satz wiederholt den Titel nicht |
| Länderereignis zeigt EU-Vertrauen | Vertrauen des betroffenen Landes |
| Spannung mit den USA auf dem Weg zum Kriegsvorgang | kein militärischer Vorgang mit fernen Großmächten und der EU (ENTSCHEIDUNGEN, Nachtrag zu U) |
| „Beziehungen zur EU steht bei 39“ | „Beziehungen zur EU: 39 von 100“ |
| „Haushaltsplan 2026“ im Jahr 2030 | „Ausgangslage: Haushaltsgesetz 2026“ |
| TV-Duell unter dem Banner WAHLNACHT | Bild des Fernsehstudios |
| Innenministerin trägt das Rücktrittsgesuch der Justizministerin vor | die Person spricht selbst |
| Schreibtisch mit 121 neuen Meldungen, obwohl offen | gilt bei offenem Schreibtisch als gelesen; „99+“ |

Offen aus dem Durchlauf: Die Texte der Ereignisvorlagen sind noch fest deutsch (Übersetzung von `ereignisse-innen.ts` und `ereignisse-aussen.ts` läuft); die Weltereignisse hängen an deutschen Kasusformen der Länderdaten.

