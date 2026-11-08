# Ministerfluss — Lückenanalyse und Aufbau (04.10.2026)

Nutzerwunsch: Die Minister arbeiten wie eine Rückfrage mit Optionen. Sie legen Vorlagen vor (Frage, zwei bis vier Optionen mit Folgen,
eine Empfehlung), der Präsident entscheidet; er kann Befehle erteilen, und die Minister kommen mit Fragen zu ihm. Auf dem Schreibtisch
liegt nur das Wichtigste und Aktuellste.

## 1. Was es schon gab (und wo es verstreut lag)

| Baustein | Wo | Was fehlte zum Bild des Nutzers |
|---|---|---|
| Ereignisse mit Antwortoptionen, Frist, Vorschau der Folgen | `sim/ereignisse*.ts`, Modalfenster der Bühne | anonym; kein Minister legt vor, keine Empfehlung |
| Beschlussvorlagen des Ministerrats (Haushaltskurs, Sicherheitsdoktrin, Kabinettskrise) | `sim/kabinett.ts`, `ui/personen/MinisterratSaal.tsx` | nur dort sichtbar; Folgen als feste Sätze; nicht Teil der Rangfolge |
| „Rat“ der Ressorts: Schritte gegen die schwächste Größe mit Kosten und Mehrheitsaussicht | `sim/gespraeche.ts` (`schritteFuer`, nur im Gespräch) | nur auf Nachfrage im Gespräch; keine Vorlage |
| Vorhaben gegen akute Probleme („Heute“) | `sim/vorschlaege.ts`, `ui/Bereiche.tsx` | kein erwarteter Nutzen in Zahlen, kein Ort, keine Zuständigkeit, kein Dafür/Dagegen |
| Beraterstab des Schreibtischs | `ui/schreibtisch/briefing.ts` (`empfehlungen`) | anonyme „Rolle“, unabhängig von Fähigkeit und Loyalität der echten Minister |
| Aufträge mit Frist, Gespräche mit Ansätzen, Zusagen einlösen/vertrösten/brechen | `sim/gespraeche.ts`, `sim/zusagen.ts` | nur über die Personenansicht erreichbar, nicht als „Befehl“ |
| Schreibtisch | `ui/schreibtisch/Schreibtisch.tsx` | elf Abschnitte (6 Kennzahlen, 2 Balken, Fällig, Stab, Warnungen, Termine, Ziele, Mentorin, Zeitung, Umlauf, Log, 9 Türen) |

Kernbefund: Fast alles, was der Nutzer beschreibt, gab es als Einzelstück. Es fehlte das gemeinsame Vorlagenmodell, die Zuordnung zu einem
Minister mit Gesicht, die Abhängigkeit von Fähigkeit/Stil/Loyalität, der Nutzen in Zahlen, die Rangfolge und ein Befehlsweg, der Aufmerksamkeit spart.

## 2. Was jetzt gebaut ist

**Ein Vorlagenmodell** (`sim/ministerfluss-typen.ts`, `sim/ministerfluss.ts`). Eine Vorlage ist abgeleitet, nicht gespeichert: Sie wird aus dem
Weltzustand gerechnet. Sieben Quellen speisen sie: offene Ereignisse, die Beschlussthemen des Ministerrats, die Schritte eines Ressorts gegen
seine schwächste Größe, die Vorhaben gegen akute Probleme („Heute“), dringende Zusagen, Aussprachen mit Ministern (Groll, Schweigen) und
Rückmeldungen (Befehle, abgeschlossene Aufträge). Jede Vorlage hat: vorlegenden Minister, Titel, Anlass, Optionen (Kosten in Kapital und
Aufmerksamkeit, Folgen in Worten, Nutzen in Zahlen, Dafür/Dagegen/Verlierer), Empfehlung mit Begründung, Rang mit Begründung.

**Entschieden wird über die Kernfunktionen**, nie über eine Parallel-Logik: `entscheide` (Ereignisse), `halteKabinettssitzungAb` (Ministerrat),
`bringeEin` (Gesetze), `loeseEin`/`vertroesteFrei`/`brecheFrei` (Zusagen), `fuehreGespraech` (Aussprachen), `erteileBefehl` (Befehle).

**Rang** (`prioritaet`, 0 bis 100) = 50 % Dringlichkeit (Frist) + 35 % Tragweite + 15 % Aktualität; der Grund steht in Worten an der Karte
(„Frist in 5 Tagen · große Tragweite · neu auf dem Tisch“).

**Die Qualität hängt am Minister.**
- Fähigkeit: Fähige Minister bringen drei statt zwei Schritte; das Rauschen bei der Wahl der Empfehlung wächst mit schwacher Fähigkeit.
- Stil: vorsichtig empfiehlt den billigen Weg und rät beim teuren Vorhaben zum Warten; machtbewusst die kräftigste Antwort; eitel, was das eigene Ressort stärkt.
  Der Stab merkt an: „Auffällig: Die Empfehlung stärkt vor allem das eigene Ressort.“ (bei Eitelkeit oder Ehrgeiz ab 65), „fachlich schwach: Rechnen Sie nach.“
- Ministerrat: Der Leitminister empfiehlt die Seite, auf der er steht (Beschlussthemen nennen Befürworter und Gegner).
- Loyalität: Unter 55 weist die Karte auf mögliches Eigeninteresse hin; unter 40 gibt es keine Empfehlung („hält sich zurück“); unter 35 legt der
  Minister nichts mehr vor — die Karte „legt nichts mehr vor“ ersetzt seine Lagevorlagen und bietet die Aussprache an.
- Der Präsident wirkt zurück: Wer der Empfehlung folgt, stärkt den Rückhalt (+1); wer sie übergeht, kränkt den Ehrgeizigen (Groll +1,5).

**Nutzen in Zahlen** (`sim/ministerfluss-vorschau.ts`). Das Politiknetz wird auf einer Kopie ohne und mit dem Eingriff fortgeschrieben (Horizont 12 bis
36 Monate je nach Bauzeit der Maßnahme, dieselben Schritte wie das Spiel: Umsetzungsrampe und Netzschritt). Angezeigt: Stand heute, ohne, mit.
Grenze, offen genannt: Die Wirtschaft bleibt dabei unverändert; der Satz steht an der Tabelle. Dauert die Rechnung (≈ 20 ms je Maßnahme), wird sie 15 Tage lang gemerkt.

**Befehle** (`sim/minister-befehle.ts`): Ziel setzen (der vorhandene Auftrag mit Frist), Vorhaben vorbereiten (der Minister bereitet das Gesetz vor und bringt es ein;
Aufmerksamkeit 3 statt 10, das Kapital wird erst bei der Einbringung fällig; Dauer und Chance aus Fähigkeit/Leistung), Verhandeln lassen (Außenressort führt Gipfel,
Entspannung, Handel, Hilfe; halbe Aufmerksamkeit). Weigerung unter Loyalität 55 (Wahrscheinlichkeit bis 90 %), Rücktrittsdrohung bei Loyalität < 25 und Groll ≥ 50.
Höchstens vier Befehle zugleich, einer je Minister. Rückmeldung als Vorlage (Erfolg, Teilerfolg mit „Gesetz nachholen“, Scheitern, Weigerung).

**Schreibtisch** (`ui/schreibtisch/Schreibtisch.tsx`): vier Zahlen, ein Zustandsband, die Unterschriftenmappe (höchstens fünf Karten, höchstens zwei je Minister, eine je Problem),
Fristen und Termine, zwei Warnungen, eine Zeile der Mentorin. Alles Übrige (Ziele, weitere Warnungen, Zeitung, Umlauf, Chronik) in „Weiteres“.
Der Rest der Vorlagen liegt im Posteingang des Ministerrats; nicht entschiedene Vorlagen verfallen sichtbar (`pflegeVorlagen`).

**„Heute“** (`ui/Bereiche.tsx`): dieselbe Karte, nummeriert nach Rang, mit Minister, Empfehlung, „Wie schlimm und wo“ (Provinzen, Anteil, die fünf größten), Folgen in Zahlen, Dafür/Dagegen.

## 3. Bewusste Grenzen

- Bei Ereignissen wertet die Empfehlung die Vorschauzeilen grob nach Vorzeichen und Größe aus, nicht nach einem Gesamtmaß des Wohlergehens.
- Das Politiknetz wird ohne Wirtschaftsrückkopplung fortgeschrieben (siehe oben); die Zahlen sind Richtung und Größenordnung, keine Prognose.
- Befehle als freier Text („Finanzminister, senke die Mehrwertsteuer“): nicht angebunden; das wäre eine Änderung in `sim/befehle.ts` (Gemini).
- „Untersuchung anordnen“ und „Krisenstab leiten“ fehlen: Beide bräuchten verborgenen Zustand, den das Spiel noch nicht hat.
- Alle Zahlen (Kosten der Befehle, Chancen, Rang-Gewichte, Weigerungsgrenze) sind Spielparameter, nicht gemessen.
