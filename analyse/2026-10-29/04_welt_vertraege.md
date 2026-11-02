# 04 — Die anderen Länder als Akteure, Außenpolitik und Verträge

Stand: 29.10.2026. Erstanalyse an der Analysekopie `/home/user/nwo-analyse/game`; **Nachprüfung am Stand W4** (`/home/user/nwo-w4/game`, Commit 09a14ff) in Abschnitt 0. Die Abschnitte 1–7 beschreiben den Stand vor W4; wo W4 etwas ändert, steht ein Vermerk **[W4]**. Code und Dokumente wurden nicht verändert. Auftrag des Projektinhabers: „Die anderen Länder sollen ja auch vom Computer gespielt werden, das fehlt viel. Geh die ganzen Verträge durch.“

Keine externe Recherche: Realwelt-Fakten stammen nur aus den Projektdokumenten; mit „extern“ markierte Angaben sind unbelegt und als Lücke zu behandeln. Pfadangaben `datei:zeile` beziehen sich auf `game/src/…`. Messdaten und Hilfsdateien liegen unter `scratchpad/analyse/welt/` (`welt-messung.test.ts`, `welt-kandidaten.test.ts`, `welt-bewertung.test.ts`, `messung.json`, `kandidaten.json`, `auswerten.mjs`).

---

## 0. Was nicht sauber funktioniert — Nachprüfung am Stand W4 (Commit 09a14ff)

**Geprüft am Stand:** `/home/user/nwo-w4/game`, Commit `09a14ff` „W4“, mit Stufen 1–7 vom 05./06.10. Pfadangaben in diesem Abschnitt beziehen sich auf `nwo-w4/game/src/…`.

**Messung wiederholt:** gleiche 3 Profile × 3 Seeds × 4 Jahre, Kandidaten- und Driftzerlegung, Paketbewertung. Neu hinzu kam eine Stabilitäts- und Machtwechsel-Zählung über 5 Seeds. Dateien: `scratchpad/analyse/welt/w4/` (`welt-messung-w4.test.ts`, `messung-w4.json`, `auswerten-w4.mjs`, `kandidaten-w4.json`, `welt-stab.test.ts`, `stab.json`).

**Was sich gegenüber der Analysekopie geändert hat:**

| Neues Teilsystem | Inhalt | Datei |
|---|---|---|
| Weltmodell | 41 Akteure mit Eigenzustand: Wachstum, Inflation, Schulden, Stabilität, Rückhalt, Rüstung, Regierungsform, Wahltermin, Kurs zur Türkei; Paarwerte für Bündnis, Handel und Spannung | `sim/welt-modell.ts:509-666` |
| Wahlen und Machtwechsel | Herausforderer, neuer „Kurs“ der Führung | `welt-modell.ts:725-790` |
| Eigenes Handeln der Staaten **untereinander** | Gipfel, Handelspakt, Hilfe, Rüstung, Druck, Sanktion, Bündnis, Entspannung, Repression | `welt-modell.ts:862-998` |
| Kriege zwischen Dritten, Pakte, Beistandsrufe | Koalitionen im Krieg der Türkei | `sim/pakte.ts` |
| Konflikt-Anker | Verträge, Kurs, Sanktionen und abberufene Botschafter verschieben den Ruhewert des Konflikts | `sim/diplomatie.ts:175-183`, gelesen in `laender.ts:549` |
| Außenlage | Flucht, Energie-Lieferanteile, Sanktionen CAATSA/EU, Instrumente wie Staatsbesuch oder Botschafter | `sim/diplomatie.ts` |
| Weltereignisse | Vorlagen `welt_machtwechsel`, `welt_krise`, `welt_einfluss`, `krieg_beistandsruf` | `sim/welt-ereignisse.ts`, `pakte.ts:969-1040` |
| Exportseite in der Leistungsbilanz | Branchenindex fließt ein | `sim/devisen.ts:44, 164` |

**Unverändert:** `sim/initiative.ts`, `sim/abkommen.ts`, `data/abkommen.ts` und `sim/vermittlung.ts`. Die Eigeninitiative, die gesamte Vertragslogik und die Klauselwerte sind also auf dem alten Stand.

### 0.1 Status jedes Befunds

**A** = falsches Spielergebnis oder Sackgasse, **B** = irreführend, **C** = kosmetisch.

| # | Befund (Kurzform) | Schwere | Status W4 | Beleg W4 |
|---|---|---|---|---|
| H1 | „Spannung“ mit Zypern endet nie, belegt einen von 2 Kriegsplätzen | A | **besteht weiter.** Die Endbedingung ist unverändert. Passiv Seeds 3 und 7: Spannung seit Tag 818 bzw. 1091 bis Partieende. **Neu, schlimmer:** Nach einem Machtwechsel in Nikosia mit härterem Kurs hebt der Anker den Konflikt auf 80. In Seed 21 kippt die Spannung dann **ohne Zutun des Spielers in eine Drohkulisse**, die ebenfalls nie endet: Angriff erst ab Eskalation 95, Auflösung erst unter 45. | `krieg.ts:1090` (Ende), `:1096-1104` (Drohkulisse), `diplomatie.ts:182` (Kurs-Anker) |
| H2 | Waffenruhe ohne Zeitablauf | A | **besteht weiter.** Falke: Waffenruhe mit Zypern ab Tag 488 bis zum Partieende in allen 3 Seeds. | `krieg.ts:471-481` (nur Spieleraktionen), `kriegTag` (`krieg.ts:1073-1118`) ohne `waffenruhe`-Fall |
| H3 | Zypern provoziert in Dauerschleife | B | **besteht weiter.** 1–2 Provokationen in jeder Partie, solange der Kurs Zyperns nicht auf +1 wechselt. | `initiative.ts:65, 216-218`; `laender.ts:549` |
| H4 | Verlängerungsangebot trotz Verstoß; Kapital wird abgebucht, die Verlängerung scheitert | A | **besteht weiter** (Code unverändert) | `initiative.ts:221-233, 578-592`; `abkommen.ts:456`; `ereignisse.ts` (`entscheide` zahlt vorab) |
| H5 | Entspannung verpufft, Konflikt federt auf den Startwert zurück | A | **teilweise behoben.** Laufende Verträge senken den Anker um je 6 (höchstens 18); Kurs und Sanktionen verschieben ihn. **Weiter offen:** Einmal-Klauseln wie `v_casus` (−12), Gipfel und „Konflikt entschärfen“ federen auf den Anker zurück. Die **Vermittlungs-Einigung** steht nicht im Anker und wirkt weiter netto null (−1 durch die Vermittlung, +1 durch `weltMonat` im selben Monat). | `diplomatie.ts:175-183`; `laender.ts:549-550`; `vermittlung.ts:537-542`; Reihenfolge `spiel.ts:340-343` |
| H6 | Drittkonflikte stehen still | B | **teilweise behoben.** Es gibt jetzt Kriege zwischen Dritten: Iran–Golf in Seed 3 mit Ende durch Erschöpfung, Israel–Syrien in Seed 21. Die Paarspannungen bewegen sich. **Die Indizes der vier Vermittlungskonflikte stehen aber nach 4 Jahren weiter exakt auf 80/75/45/55.** Die Kriege Russland–Ukraine und Israel–Iran („Ausgangslage“) laufen deshalb ohne Spieler unverändert durch. | `vermittlung.ts:551-553`; `welt-modell.ts:693` (liest den Index nur) |
| U1 | Kleinstaaten greifen die Türkei an | A | **besteht weiter, mit neuer Folgewirkung.** Der Angriff kommt weiter ab Eskalation 95 ohne Rationalitätsprüfung. Weil der Gegner als Angreifer gilt, ziehen nun **10 Staaten an der Seite der Türkei gegen Zypern** in den Krieg, darunter **7 EU-Mitglieder** (ESP, ITA, POL, ROU, HUN, BGR, DEU je nach Seed). Gegen Israel kämpfen Deutschland, Großbritannien, Italien und andere. | `krieg.ts:1096-1100`; `pakte.ts:463-485` (Koalition bei `aggressor = gegner`) |
| U2 | Krieg gegen NATO- oder EU-Mitglied ohne Bündnisfolgen | A | **teilweise behoben.** Die Koalitionslogik gibt es jetzt: Spaltung der NATO, wenn beide Seiten Mitglied sind, und Ansehensverlust für den Angreifer im Pakt (`paktFolgenAngriff`). Eine CAATSA- und EU-Sanktionsregel nach Konfliktwert existiert. **In keinem der 9 Läufe kam eine Sanktion**, auch nicht nach Kriegen gegen Griechenland und Zypern (EU-Konflikt 60–61). | `pakte.ts:487-501`; `diplomatie.ts:315-317` |
| U3 | Untätigkeit macht bei allen Blöcken beliebt (Drift) | A | **besteht weiter, verschärft.** Passiv, 48 Monate: USA 52→**100** (Versatz 7→60, Obergrenze), Ukraine 62→100, Irak 45→94, Libyen 58→96–100, Ägypten 50→87–99, Russland 45→78–85 zugleich. Die Knoten bewegen sich in 4 Jahren < 1 Punkt; die Drift ist **vollständig** Anliegen-Versatz. Zusätzlich +0,3 im Monat bei einem Kurs von +1. | `laender.ts:551-554`; `diplomatie.ts:203-204` |
| U4 | F-35 ohne S-400 | A | **besteht weiter.** Nach 36 passiven Monaten: „Rüstungskauf ↔ F-35“ **Zustimmung 10,7/5,05**, ganz ohne S-400. Positiv neu: Die USA bieten jetzt selbst das Paket `s400 ↔ w_ruestung` an (Initiative in 2 Läufen). Der kürzere Weg ohne S-400 bleibt aber offen. | `data/abkommen.ts:302-307, 530-535` (unverändert) |
| U5 | Beistand nie fällig, wirkt nur als Kriegsbonus | B | **in W4 behoben.** Drittkriege lösen einen Beistandsruf aus (Iran greift Golfstaaten an, `krieg_beistandsruf` in 2 Läufen). Schweigen oder Verweigern wirkt als Vertragsverstoß nach der Zwei-Verstöße-Logik (passiv Seed 3: Mekka-Vertrag mit 1 Verstoß). Der Stärkebonus kommt jetzt aus der Koalition. | `pakte.ts:969-1040`; `krieg.ts:294` |
| U6 | EU-„Reformzusage“ als Falle | B | **besteht weiter** (nachgiebig Seed 7: Vertrag gebrochen) | `initiative.ts:460-465`; `data/abkommen.ts:154-162` |
| U7 | Israel und Iran am gemeinsamen Knoten `beziehungen_nahost` | B | **besteht weiter** | `laender.ts:103, 169, 452` |
| U8 | Option „Gasvertrag nur kurz verlängern“ ohne Wirkung | C | **besteht weiter**; die beiden anderen Optionen verschieben jetzt die Lieferanteile | `ereignisse-aussen.ts:246-288` (Option `kurz`) |
| U9 | „Eine Zusage machen“ legt keine Zusage an | C | **besteht weiter** | `initiative.ts:433-447` |
| K1 | `w_swap` füllt die Reserven nicht | B | **besteht weiter**; kein Code liest den Swap | `data/abkommen.ts:331-338` |
| K2 | Gasverträge ohne Wirkung auf die Importrechnung | B | **teilweise geändert, mit Vorzeichenproblem.** Die Importrechnung skaliert jetzt mit `energieFaktor`, der aus `energieimporte` folgt. `gas_kauf` **erhöht** `energieimporte` (+1,5) und **verstärkt damit den Ölpreisschlag**; der „billige“ Gasvertrag macht die Türkei empfindlicher. Am Tisch geschlossene Gasverträge verschieben die Lieferanteile der Außenlage nicht. Das tut nur das Ereignis `gasvertrag`. | `maerkte.ts:229`; `devisen.ts:158`; `data/abkommen.ts:132`; `diplomatie.ts:630` |
| K3 | Exportklauseln erreichen die Leistungsbilanz nicht | B | **in W4 behoben** (Branchenindex fließt ein) | `devisen.ts:44, 164` |
| K4 | `meerengen` nur Zahl | B | **besteht weiter** | `data/abkommen.ts:56-63` |
| K5 | `vermittlung_zusage` nicht mit der Vermittlung verbunden | B | **besteht weiter** | `data/abkommen.ts:119-127` |
| K6 | `s400` schaltet nichts frei | A | **besteht weiter** (siehe U4) | — |
| K7 | `beistand` nie fällig | B | **in W4 behoben** (U5) | `pakte.ts:1014-1035` |
| K8 | `reform_zusage` wird vom EU-Vorgang nicht gelesen | B | **teilweise behoben.** Das Visa-Kriterium „Rücknahme“ liest jetzt den Vertrag `migration_zusage`. `reform_zusage` bleibt ungelesen. | `eu.ts:630` |
| K9 | Zollunion und Visa doppelt modelliert | B | **besteht weiter** | `eu.ts:523, 628-650` vs. `data/abkommen.ts:287-300` |
| K10 | Transit und Pipeline ohne Einnahmen; `w_transit` als Füllwert in allen 18 Profilen | B | **besteht weiter** | `data/abkommen.ts` PROFILE |
| K11 | Nur 5 von 54 Klauseln haben eine Pflicht | B | **teilweise.** `beistand` wird über den Ruf geprüft; die übrigen nicht. | `abkommen.ts:370-396` |
| K12 | `bohrung` ohne die angekündigte Ausstrahlung | C | **besteht weiter** | `data/abkommen.ts:270-276, 493-509` |
| K13 | Partner liefert still nur 40 % und kann nie brechen | B | **besteht weiter** | `abkommen.ts:361-363, 412` |
| L1 | Grenzzwischenfall erreicht das genannte Land nicht | B | **besteht weiter** (kein `landAendern`/`beziehungAendern`); der Kommentar in `krieg.ts` ist weiter falsch | `ereignisse-aussen.ts:23-71`; Kommentar in `kriegMonat` |
| L2 | NATO-Ratifizierung ändert das Vertrauen der Beitrittsländer nicht | B | **besteht weiter** | `ereignisse-aussen.ts:199-244` |
| L3 | Ereignis „Gasvertrag läuft aus“ ist vom Verhandlungstisch getrennt | B | **besteht weiter** (verschiebt jetzt Lieferanteile, ohne Vertrag am Tisch) | `ereignisse-aussen.ts:246-288` |
| L4 | Globale Abkühlung je Ereignisart; die meisten Länder handeln nie gegenüber der Türkei | A | **besteht weiter.** W4: 27 Initiativen in rund 32 Spieljahren, also **0,84 pro Jahr**. 7 von 18 Ländern melden sich (EU, Zypern, USA, Aserbaidschan, Libyen, Ukraine, Griechenland). Jeden Monat haben 10 bis 16 Länder einen Anlass. **Neu daneben:** 4–8 Weltereignisse je Partie und rund 160–200 Weltnachrichten in 4 Jahren. Die Welt lebt also im Hintergrund, klopft bei der Türkei aber selten an. | `ereignisse.ts:1295, 1325`; `initiative.ts:398, 495` |
| L5 | Handel und Sicherheit eines Landes wirken auf nichts | B | **in W4 weitgehend behoben.** Handel wirkt auf den Export (`diplomatie.ts` Monatsschritt 2), Sicherheit auf die Koalitionsbereitschaft (`pakte.ts:286`). | — |
| D1 | Die Geste „Handelsabkommen“ erscheint als Abkommen ohne Vertrag | B | **besteht weiter** | `laender.ts:486-489` |
| D2 | Teil-Lieferung des Partners nicht angezeigt | B | **besteht weiter**; kein UI-Element liest `partnerVerlaesslich` | — |
| D3 | Vertrauen 100 ohne erklärende Erinnerung | B | **besteht weiter** (USA jetzt 100) | `laender.ts:553` schreibt keine Erinnerung |
| D4 | Kein Verlängern-Knopf | B | **besteht weiter**; `Vertraege.tsx:79` bietet nur „kündigen“ | — |
| D5 | EU-Akte führt Visa/Zollunion offen, obwohl am Tisch vereinbart | B | **besteht weiter** (K9) | — |
| D6 | Hängende Spannung oder Waffenruhe ohne Hinweis | B | **besteht weiter, nun auch Drohkulisse** (H1) | — |

**Bilanz:** behoben 5 (U5, K3, K7, L5 weitgehend, K8 teilweise), teilweise behoben 4 (H5, H6, U2, K11), unverändert 25, K2 in veränderter Form.

### 0.2 Neue Befunde aus den W4-Teilen

| # | Befund | Beleg | Schwere |
|---|---|---|---|
| N1 | **Waffenruhe-Angebote als Dauerfeuer, mit Todesspirale.** Lehnt der Spieler ab, darf der Gegner in der nächsten Kriegswoche wieder anbieten (Chance 50 %, Vorlage-Abkühlung 1 Tag). Jede Ablehnung kostet die eigene Erschöpfungsuhr −3, ebenso das Liegenlassen. Falke: **17 bzw. 20 Angebote Griechenlands in 10 Monaten.** Alle drei Falken-Partien enden mit **Sturz** (Tag 818, 1030, 1121). | `ereignisse-krieg.ts:59-90` (`abkuehlung: 1`, `gegnerAngebot = false`, `uhr − 3`); `krieg.ts:1056-1058` | A |
| N2 | **Absurde Koalitionen als Folge von U1.** Gilt Zypern als Angreifer, verpflichtet der NATO-Bündnisfall Spanien, Italien, Polen und andere, **gegen das EU-Mitglied Zypern** an der Seite der Türkei zu kämpfen. Die EU-Beistandsklausel greift nicht, weil sie nur das Opfer schützt. Der Fehler liegt in der Angreiferzuschreibung, nicht in der Koalitionslogik: Die Eskalation, die der Spieler mit „Druck“ selbst treibt, wird dem Gegner als Angriff zugerechnet. | `krieg.ts:1096-1100` (`rahmung = "verteidigung"`); `pakte.ts:463-485` | A |
| N3 | **Weltmodell treibt Iran und Russland systematisch in den Zusammenbruch.** In 5 von 5 Seeds fällt die Stabilität Irans auf 0–8 und die Russlands auf 1–18 (Start 21 bzw. 28). Russland hat in 4 von 5 Seeds innerhalb von 4 Jahren einen Machtwechsel, in Seed 42 **dreimal**. China wechselt in Seed 99. Insgesamt 12–20 Machtwechsel unter 41 Akteuren in 4 Jahren. Ursache ist eine Rückkopplung: Kriegslast, Sanktionslast, Inflation und Stabilitätsabschlag verstärken sich gegenseitig, ohne Erholungsboden. | `welt-modell.ts:533-575` (Stabilität, Wachstum), `:725-765` (Machtwechsel); Messung `w4/stab.json` | A (Kalibrierung) |
| N4 | **Kurs-Rauschen statt Interessen beim Machtwechsel.** Die neue Führung bekommt ihren Kurs zur Türkei per Würfel (30 % härter, 35 % gleich, 35 % näher), sofern kein Herausforderer bekannt ist. Sie wirkt dann dauerhaft +0,3 Vertrauen im Monat (bei Kurs +1) und ±8 Konfliktanker. So kann Zypern ohne Anlass zur Drohkulisse werden (H1, Seed 21). | `welt-modell.ts:767-772`; `diplomatie.ts:182, 203-204` | B |
| N5 | **Machtwechsel bei der „EU“.** Die Union ist ein Akteur mit Wahl und „Führung“. Ein Machtwechsel der EU erscheint als Ereignis für den Spieler (Seeds 3, 42), daneben laufen eigene Machtwechsel der Mitgliedstaaten. Das ist doppelt und missverständlich. | Messung: `welt_machtwechsel:EU` 2029-07 | C |
| N6 | **Initiative und Weltmodell sind nicht verbunden.** Ein Machtwechsel mit Kurs +1 bei den USA führt nicht zu einem Angebot, Kurs −1 nicht zu einer Forderung. Die Länder-Initiativen hängen weiter nur an den alten sechs Treibern; das neue Weltmodell erreicht den Verhandlungstisch nur über Vertrauen und Konflikt. | `initiative.ts:189-290` (liest keine Weltmodell-Größe) | B |
| N7 | **Der Gas-Vertrag am Tisch erhöht die Ölpreis-Empfindlichkeit** (siehe K2): Wer Moskaus Gasvertrag verlängert, bekommt einen höheren `energieFaktor`. Das ist entgegengesetzt zum Text „billiges Gas“. | `data/abkommen.ts:132`; `maerkte.ts:229` | B |

### 0.3 Schnellste Reparaturen am Stand W4 (je ≤1 Tag)

1. **Waffenruhe-Angebot (N1):** Abkühlung je Krieg (z. B. 60 Tage); Ablehnen nicht zusätzlich mit Uhr −3 bestrafen, wenn es Serien gibt.
2. **Angriff des Gegners (U1, N2):** nur nach Prüfung des Stärkeverhältnisses inklusive Koalitionsvorschau. Wer die Eskalation durch eigenen „Druck“ getrieben hat, gilt nicht als Opfer.
3. **Hängende Vorgänge (H1, H2, D6):** Zeitablauf für Spannung, Drohkulisse und Waffenruhe; der Gegner bietet nach X Monaten selbst Frieden an.
4. **Drift (U3, D3):** Anliegen-Versatz begrenzen und mit Verfall versehen; Vertrauen nicht als Anliegen zählen.
5. **Abkühlung je Land (L4):** zusätzlich Weltmodell-Kurs und Machtwechsel als Treiber in `initiative.ts` (N6).
6. **Vermittlungs-Einigung in den Konflikt-Anker** aufnehmen; Index der Vermittlungskonflikte an Drittkriege und Paarspannung koppeln (H5, H6).
7. **Exklusivität S-400 ↔ F-35/CAATSA** (U4, K6).
8. **Erholungsboden im Weltmodell** (Stabilität, Kriegslast), damit Iran und Russland nicht regelmäßig kollabieren (N3).
9. Kleinkram: Verlängerung nur ohne Verstoß, Kapital erst nach Erfolg (H4); Option `kurz` (U8); `w_swap` (K1); Vorzeichen von `gas_kauf` (K2, N7).

### 0.4 Befundliste der Analysekopie (vor W4), zum Nachlesen

Die ursprünglichen Tabellen mit Begründung stehen unverändert darunter (0.4.1–0.4.5). Ihre Datei:Zeile-Angaben beziehen sich auf die Analysekopie; den aktuellen Stand gibt Tabelle 0.1.


Dieser Abschnitt sammelt Funktionsfehler: Wege, die hängen bleiben oder unsinnige Ergebnisse liefern, Klauseln ohne Wirkung, Länderaktionen, die beim Land nicht ankommen, und Anzeigen, die nicht zum Zustand passen. Jede Zeile hat einen Codebeleg oder einen Messbeleg aus der Headless-Partie (§1, §3). Schwere: **A** = falsches Spielergebnis oder Sackgasse, **B** = irreführend, **C** = kosmetisch.

#### 0.4.1 Wege, die hängen bleiben

| # | Befund | Beleg | Schwere |
|---|---|---|---|
| H1 | **Ein Kriegsvorgang „Spannung“ mit Zypern endet nie.** Er entsteht in jeder passiven Partie: Eine unbeantwortete Provokation hebt den Konflikt von 72 auf 76, das liegt über der Anlageschwelle 73. Danach federt der Konflikt auf 72 zurück. Der Vorgang endet aber nur bei Eskalation ≤22 **und** Konflikt <45, und das ist bei Startwert 72 unerreichbar. Die Spannung blockiert damit dauerhaft einen der 2 Kriegsplätze (`maxAktiv`). | `krieg.ts:37, 39, 961-963`; `laender.ts:537`; Messung: alle 9 Läufe haben einen CYP-Vorgang, passiv bis Partieende in „Spannung“ | A |
| H2 | **Eine Waffenruhe ohne Spieleraktion dauert ewig.** Die Phase `waffenruhe` hat keinen Zeitablauf, und der Gegner schlägt nie selbst Frieden vor. Nur die Friedenspakete des Spielers beenden sie. | `krieg.ts:433-442`, `kriegTag` ohne `case "waffenruhe"` (`:944-999`); Messung Falke: Waffenruhe mit Zypern von Tag 516 bis Tag 1440 in allen 3 Seeds | A |
| H3 | **Zypern provoziert in Dauerschleife.** Der Startkonflikt 72 liegt über der Provokationsschwelle 70 und federt immer dorthin zurück. Darum kommt „Nikosia sucht den Streit“ etwa alle 8–12 Monate bis zum Ende jeder Partie, egal was der Spieler tut. Ausnahme ist nur eine dauerhafte Entspannung, und die gibt es nicht (H5). | `initiative.ts:65, 216-218`; `laender.ts:246, 537`; Messung: 1–2 CYP-Provokationen in jeder Partie | B |
| H4 | **Verlängerungsangebot für einen Vertrag mit Verstoß.** Der Treiber prüft Verstöße nicht und bietet die Verlängerung trotzdem an. Der Text sagt selbst „fraglich“. `verlaengere` lehnt dann ab, das Kapital (1–5 PK) ist aber schon abgebucht, weil `entscheide` vor der Wirkung zahlt. | `initiative.ts:221-233, 566, 578-592`; `abkommen.ts:456`; `ereignisse.ts:1452` | A |
| H5 | **Entspannung verpufft.** Der Konflikt federt jeden Monat um 1 auf den Startwert zurück. Darum wirken `v_casus` (−12), `verzicht_bohrung`, `grenzoeffnung`, „Konflikt entschärfen“ und gelungene Vermittlungen nur 6–12 Monate. Nach einer Vermittlungs-Einigung senkt `vermittlungMonat` den Länderkonflikt um 1, `weltMonat` hebt ihn im selben Monat um 1 zurück. Netto null. | `laender.ts:537`; `vermittlung.ts:537-542`; Reihenfolge `spiel.ts:304-307` | A |
| H6 | **Die Drittkonflikte stehen still.** Nach 4 Jahren liegen alle Indizes exakt auf dem Startwert (80/75/45/55). Spoiler gibt es nur, wenn Ankara beteiligt ist. Ohne Spieler passiert in der Welt nichts. | `vermittlung.ts:551-553, 574-576`; Messung §3.3 | B |

#### 0.4.2 Wege, die Unsinn ergeben

| # | Befund | Beleg | Schwere |
|---|---|---|---|
| U1 | **Kleinstaaten greifen die Türkei an.** Ab Eskalation 95 heißt es „Zypern schlägt zu“ (Gegnerstärke 14), ebenso für Griechenland (NATO-Partner) und Israel, 6–7 Kriegsvorgänge in 4 Jahren beim Falken. Stärkeverhältnis, Bündnisse und Kosten werden nicht geprüft. | `krieg.ts:49, 133-137, 966-970`; Messung §3.4 | A |
| U2 | **Krieg gegen ein NATO- oder EU-Mitglied bleibt ohne Bündnisfolgen.** Das USA-Vertrauen liegt nach zwei Kriegen gegen Griechenland bei 85–86, passiv bei 89. Es gibt keine Sanktion, kein Embargo und keine Reaktion der EU. | `krieg.ts:701-707` | A |
| U3 | **Untätigkeit macht beliebt, und zwar bei allen Blöcken.** Ohne jede Außenpolitik steigen USA 52→89 und Russland 45→85 gleichzeitig, die Ukraine auf 100. EU, Iran und Zypern sinken. Ursache ist der Anliegen-Versatz von +0,8 im Monat ohne Grenze, und Vertrauen ist selbst ein Anliegen. Der Spieler sieht dafür keinen Grund. | `laender.ts:538-541`; Messung §3.2 | A |
| U4 | **F-35 ohne S-400.** Nach 36 passiven Monaten stimmen die USA „Rüstungskauf ↔ F-35/F110 freigeben“ zu. Der Klauseltext selbst nennt die S-400-Bedingung (NDAA §1245). Eine Exklusivität gibt es nicht. VERBESSERUNGSPLAN AUS-6 behauptet fälschlich, sie sei „schon gebaut“. | `data/abkommen.ts:302-307, 530-535`; Messung §3.2 | A |
| U5 | **Die Beistandspflicht wird nie fällig, wirkt aber als Kriegsbonus.** Der Mekka-Pakt gibt +6 % Stärke, auch im Krieg gegen Griechenland. Saudi-Arabien kann nie angegriffen werden, weil es keine Drittkriege gibt. Die Pflicht wird nie geprüft. | `krieg.ts:260-276`; `laender.ts:318-327` | B |
| U6 | **Die EU-Forderung „Reformzusage“ ist eine Falle.** Die erste Antwort „erfüllen“ schließt einen Vertrag mit der Pflicht Justizreform ≥55. Ohne Reform ist der Vertrag nach zwei Jahrsprüfungen automatisch gebrochen (Vertrauen −12, Ansehen −2). Die Vorschau warnt nicht, dass die Pflicht heute verfehlt würde. | `initiative.ts:460-465`; `data/abkommen.ts:154-162`; Messung nachgiebig Seed 21 | B |
| U7 | **Eine Geste an Israel hebt das Vertrauen Irans.** Beide hängen am gemeinsamen Knoten `beziehungen_nahost`, ebenso Golf, Syrien, Irak, Ägypten und Libyen. | `laender.ts:102, 168, 449` | B |
| U8 | **Option „Gasvertrag nur kurz verlängern“ ohne Wirkung.** Sie kostet 1 PK und ändert nichts. | `ereignisse-aussen.ts` (Vorlage `gasvertrag`, Option `kurz`) | C |
| U9 | **„Eine Zusage machen“ ohne Zusage.** Bei Forderungen aus Rote-Linie- oder Ausstrahlungs-Anlass gibt es keine Maßnahme. Die Option kostet 3 PK und legt keine einforderbare Zusage an. | `initiative.ts:433-447` | C |

#### 0.4.3 Vertragsklauseln ohne (oder mit falscher) Wirkung

| # | Klausel | Was der Text verspricht | Was der Code tut | Beleg |
|---|---|---|---|---|
| K1 | `w_swap` | „die Reserven der Zentralbank steigen“ | nur Risikoaufschlag −12, Schulden +0,1, Netzknoten; **Reserven unverändert** | `data/abkommen.ts:331-338`; `devisen.ts` liest keine Verträge |
| K2 | `gas_kauf`, `w_preis` | Gas billiger, Abhängigkeit | Knoten `energiepreise`; **die Energie-Importrechnung der Leistungsbilanz (Öl-Index) bleibt unberührt** | `devisen.ts:154-155` |
| K3 | `zoll`, `w_zoll`, `w_zollunion`, `w_handelsziel`, `w_defizit` | mehr Export | Knoten `export`; **der fließt nicht in die Leistungsbilanz** (nur EU-Nachfrage, Öl, Tourismus, J-Kurve) | `devisen.ts:149-175` |
| K4 | `meerengen` | Montreux-Zusage | nur Ansehen und Beziehung; keine Wirkung auf Krieg, Vermittlung Ukraine–Russland oder Gebühren | `data/abkommen.ts:56-63` |
| K5 | `vermittlung_zusage` | „Ankara vermittelt“ | nur Ansehen; **keine Verbindung zum Vermittlungsmodul** (Reife, ZOPA) | `data/abkommen.ts:119-127`, `vermittlung.ts` |
| K6 | `s400` | „Voraussetzung für … F-35“ | schaltet nichts frei (U4) | `data/abkommen.ts:181-189` |
| K7 | `beistand` | „Hilfe im Ernstfall“ | nie fällig, nie geprüft (U5) | — |
| K8 | `reform_zusage` | „Brüssel prüft“ | Jahresprüfung ja, aber der EU-Beitrittsvorgang liest den Vertrag nicht | `eu.ts` (nur `hafen_oeffnung` gelesen, `:359`) |
| K9 | `w_zollunion`, `w_visa` | Zollunion bzw. Visafreiheit | **doppelt modelliert**: zusätzlich EU-Zwischenziel und Visa-Mini-Track, beide unverbunden; man kann Visafreiheit am Tisch „bekommen“, während der EU-Vorgang sie als offen führt | `eu.ts:512-547, 617-665` |
| K10 | `transit`, `w_pipeline`, `w_transit` | Korridor, Pipeline | keine Transit- oder Durchleitungseinnahmen; `w_transit` steckt als Füllwert in allen 18 Profilen (auch USA, Zypern) | `data/abkommen.ts` PROFILE |
| K11 | `sanktionen_umgehung`, `wasser`, `gas_kauf`, `meerengen`, `beistand` | binden Ankara | **keine Pflicht**, werden nie geprüft; nur 5 von 54 Klauseln haben eine Pflicht | `abkommen.ts:370-396` |
| K12 | `bohrung` | Kehrseite „Streit mit Ägypten und Griechenland“ | kein `AUSSTRAHLUNG`-Eintrag, also kein Streit | `data/abkommen.ts:270-276, 493-509` |
| K13 | alle Leistungen des Partners (`will`) | Partner liefert | Ist der Partner unzuverlässig, liefert er still nur 40 %. Das wird **nie gemeldet**, und der Partner kann nie brechen oder kündigen. | `abkommen.ts:361-363, 412` |

#### 0.4.4 Länderaktionen, die nicht ankommen

| # | Befund | Beleg |
|---|---|---|
| L1 | **Der Grenzzwischenfall** nennt Syrien, Irak, Iran, Armenien oder Georgien, ändert aber deren Konflikt nicht. Er wirkt nur auf `terrorgefahr` und `beziehungen_nahost`. Die Code-Notiz in `krieg.ts`, Grenzzwischenfälle trieben den Konflikt, stimmt nicht. Auch eine „Vergeltung“ erreicht das Land nicht. | `ereignisse-aussen.ts:17-65`; `krieg.ts:1011` (Kommentar) |
| L2 | **Bei der NATO-Ratifizierung** ändern Zustimmung oder Blockade gegenüber Ukraine oder Georgien deren Vertrauen nicht. Es wirkt nur auf die Knoten der USA, der EU und Russlands. | `ereignisse-aussen.ts:190-235` |
| L3 | **Das Ereignis „Gasvertrag läuft aus“** ist vom Verhandlungstisch getrennt. Es kann für Russland kommen, obwohl am Tisch ein `gas_kauf`-Vertrag läuft. Es kommt auch für Iran, dessen Vertrag laut Profiltext schon ausgelaufen ist. Seine Wirkung trifft nur Netzknoten und erzeugt keinen Vertrag. | `ereignisse-aussen.ts:237-275`; `data/abkommen.ts:574` |
| L4 | **12 von 18 Ländern handeln in 36 Spieljahren nie** (USA, Russland, China, Golf, Iran …), obwohl sie in bis zu 25 von 48 Monaten einen Anlass hätten. Grund ist die Abkühlung je Ereignisart, die global über alle Länder gilt. Eine Forderung der EU sperrt Forderungen aller anderen Länder für 240 Tage. | `ereignisse.ts:1183, 1212`; `initiative.ts:398, 495`; Messung §3.1 |
| L5 | **Handel und Sicherheit** eines Landes beeinflussen nichts außer Sperren. Sie ändern sich nie von selbst, und ein Handelsindex gegenüber Russland von 72 hat keinen Einfluss auf Export oder Gas. | Suche: einzige Fremdnutzung `befehle.ts:780` |

#### 0.4.5 Anzeigen, die nicht zum Zustand passen

| # | Befund | Beleg |
|---|---|---|
| D1 | Die Länderakte zeigt unter „Abkommen“ Einträge wie „Handelsabkommen 2029“ aus der Geste „Handelsabkommen“. Das ist **kein Vertrag**: ohne Laufzeit, ohne Prüfung, wiederholbar alle 180 Tage. Daneben stehen echte Verträge des Tisches. Es gibt also zwei Abkommensbegriffe in einer Liste. | `laender.ts:486`; `ui/Welt.tsx:280-286` |
| D2 | Die Vertragsanzeige zeigt nicht, dass ein Partner nur zu 40 % liefert (K13). Kein UI-Element liest `partnerVerlaesslich`. | Suche in `ui/` ohne Treffer |
| D3 | **Vertrauen 100** (Ukraine) und „enger Partner“ zu USA und Russland gleichzeitig, ohne dass der Spieler etwas getan hat. Die Akte erklärt diese Drift nicht, die Erinnerung bleibt leer. | Messung §3.2; `laender.ts:540` schreibt keine Erinnerung |
| D4 | Das Verlängerungs-Ereignis kann einen Vertrag mit Verstoß anbieten, der Text sagt „fraglich“ (H4). Einen eigenen „Verlängern“-Knopf in `Vertraege.tsx` gibt es nicht. Die Verlängerung hängt allein an einer Initiative mit 15 % Monatschance. | `ui/welt/Vertraege.tsx` (nur `kuendige`) |
| D5 | Die EU-Akte führt Visa und Zollunion als offene Ziele, auch wenn sie am Tisch per Vertrag vereinbart wurden (K9). | `eu.ts:617-665` vs. `data/abkommen.ts:287-300` |
| D6 | Krieg-Dossier: Eine Waffenruhe (H2) oder Spannung (H1) bleibt jahrelang offen und belegt einen Platz, ohne Hinweis, dass sie ohne Spieler nie endet. | `krieg.ts` |

#### 0.4.6 Schnellste Reparaturen (je ≤1 Tag)

1. Abkühlung je **Land** und Vorlage (L4).
2. Den Konflikt-Basiswert dauerhaft verschiebbar machen (H1, H3, H5).
3. Den Anliegen-Versatz begrenzen und Vertrauen nicht als Anliegen zählen (U3, D3).
4. Zeitablauf für Waffenruhe und Spannung; der Gegner bietet Frieden an (H2).
5. Vor einem Angriff Stärke und Bündnisse prüfen (U1).
6. `schliesstAus`/`voraussetzung` an Klauseln, beginnend mit S-400 ↔ F-35 (U4, K6).
7. Verlängerung nur ohne Verstoß anbieten; Kapital erst nach Erfolg abbuchen (H4).
8. Klauseltexte an die tatsächliche Wirkung anpassen oder die Wirkung nachziehen (K1–K3, K12).

---

## 0b. Kurzfazit (Stand W4)

1. **Die Länder leben jetzt im Hintergrund [W4].** 41 Akteure haben Wirtschaft, Stabilität, Wahlen und einen Kurs zur Türkei. Sie handeln untereinander (Gipfel, Sanktionen, Bündnisse, Repression), führen Kriege gegeneinander und rufen die Türkei über Pakte zu Hilfe. Das erzeugt rund 160–200 Weltnachrichten und 4–8 Weltereignisse je 4-Jahres-Partie. Die zentrale Lücke der Erstanalyse („Länder handeln nicht untereinander“) ist damit **im Kern geschlossen**.
2. **Gegenüber der Türkei handeln die Länder weiter kaum.** 0,84 Initiativen pro Spieljahr, 7 von 18 Ländern. Die globale Abkühlung je Ereignisart besteht weiter, und das neue Weltmodell speist die Initiative nicht (N6). Ein Machtwechsel in Washington erzeugt kein Angebot.
3. **Die Beziehungen driften weiter falsch, sogar stärker.** Ohne Außenpolitik steigt das Vertrauen der USA auf 100; Russland liegt zugleich bei 78–85. Ursache ist allein der Anliegen-Versatz.
4. **Konflikte haben jetzt einen Anker [W4].** Laufende Verträge entspannen dauerhaft. Einmal-Gesten und die Vermittlungs-Einigung federn aber weiter zurück. Die vier Vermittlungskonflikte stehen weiter auf ihren Startwerten.
5. **Die Kriegswege haken weiter:**
   - Spannung, Drohkulisse und Waffenruhe hängen ohne Spieler ewig.
   - Kleinstaaten „greifen an“, und jetzt kämpfen EU-Staaten an der Seite der Türkei gegen Zypern.
   - Neu kommen Waffenruhe-Angebote im Wochentakt, mit einer Abwärtsspirale bis zum Sturz.
6. **Neue Kalibrierungsbaustelle im Weltmodell:** Iran und Russland kollabieren in jedem Seed; Russland erlebt in 4 von 5 Seeds einen Machtwechsel.
7. **Verträge: Logik und Klauselwerte unverändert.**
   - Behoben: Der Export erreicht jetzt die Leistungsbilanz; Beistand wird fällig.
   - Weiter offen: F-35 ohne S-400; `w_swap` ohne Reservenwirkung; kein Partnerbruch; kein Verlängern-Knopf; Exklusivitäten fehlen; Pflichten sind dünn.
   - Neu: `gas_kauf` erhöht die Ölpreis-Empfindlichkeit.

<details><summary>Kurzfazit der Erstanalyse (vor W4)</summary>

1. **Ein anderes Land ist heute ein Beziehungsdatensatz mit vier Zahlen und keine Regierung.** Es hat keinen Führer, keine Wirtschaft, keine Innenpolitik, keine Wahlen, kein Militär (außer einer festen Stärkezahl für den Kriegsfall), keine eigenen Ziele jenseits von zwei festen „Anliegen“ an die Türkei und keine Beziehungen zu anderen Ländern. Alles, was ein Land „tut“, richtet sich an die Türkei.
2. **Die Eigeninitiative (AUS-1) gibt es, aber man sieht sie kaum.** Gemessen über 9 Partien zu je 4 Jahren: **im Mittel 1,0 Initiative pro Spieljahr**, obwohl jeden Monat 10 bis 16 Länder einen Anlass hätten. **12 der 18 Länder handeln in 36 Spieljahren kein einziges Mal** (darunter USA, Russland, China, Golf, Iran). Der Engpass ist eine **globale Abkühlung je Ereignisart** (240–300 Tage). Sie gilt für alle Länder zusammen: Fordert die EU etwas, kann Moskau acht Monate lang nichts fordern.
3. **Die Welt driftet von selbst, und zwar falsch.** Ohne jede Außenpolitik steigen in 4 Jahren USA 52→89, Russland 45→85, Ukraine 62→100, Ägypten 50→88 und Libyen 58→96. Gleichzeitig fallen EU 40→23, Iran 40→26 und Zypern 24→10. Ursache ist eine Rückkopplung ohne Obergrenze: Erfüllte Anliegen geben +0,8 Vertrauen im Monat, und Vertrauen ist selbst ein Anliegen (`laender.ts:532-543`). USA und Russland werden gleichzeitig „enge Partner“, denn es gibt keine Blocklogik.
4. **Konflikte federn immer auf den Startwert zurück, um 1 Punkt im Monat** (`laender.ts:537`). Darum wirkt jede Entspannung, ob per Klausel, Gipfel oder Vermittlung, nur vorübergehend. Die vier Drittkonflikte (Ukraine–Russland, Israel–Iran, Armenien–Aserbaidschan, Libyen) stehen nach 4 Jahren exakt auf ihren Startwerten.
5. **Krieg ist die einzige Stelle, an der ein Land wirklich „entscheidet“, und dort ist es nicht rational.** Im Falken-Profil greifen **Zypern, Griechenland und Israel die Türkei 6- bis 7-mal in 4 Jahren von sich aus an** („Zypern schlägt zu“). Auslöser ist allein die Eskalationsschwelle 95 (`krieg.ts:49, 966-970`), ohne Blick auf Stärkeverhältnis, Bündnisse oder die NATO-Mitgliedschaft beider Seiten. Washington verliert nach zwei Kriegen gegen den NATO-Partner Griechenland nur rund 3 Vertrauenspunkte gegenüber der passiven Partie.
6. **Die Verträge sind das stärkste Teilsystem:** 54 Klauseln, 18 Länderprofile, Bewertung mit Gründen, Gegenangebote, Veto, Jahresprüfung, Bruch mit Erinnerung. Ihre Wirkung läuft aber fast nur über Knoten des Politiknetzes. **Zoll- und Marktzugangsklauseln erreichen die Leistungsbilanz nicht**, ein **Swap füllt keine Reserven**, und **Gasverträge ändern die Energie-Importrechnung nicht**. Nur die Türkei kann Verträge brechen. Der Partner erfüllt schlimmstenfalls still zu 40 %. Verlängern kann der Spieler nicht von sich aus. Exklusivitäten fehlen: Die USA geben nach passiver Drift F-35 und Triebwerke für einen bloßen Rüstungskauf frei, **ohne S-400-Lösung**. Das widerspricht dem eigenen Klauseltext (NDAA §1245).
7. **Fehlende Vertragsarten** (Auswahl): Montreux als echtes Regime, NATO-Pflichten und Bündnisfall, Investitionsschutz und Doppelbesteuerung, Rückführung mit EU-Geld, Transit- und Durchleitungsgebühren, Wasser mit Mengen- und Dürrebezug, Freihandelsabkommen als eigener Typ, multilaterale Verträge (NATO, OTS, UN) und Friedensverträge als Verträge.

</details>

**Empfehlung in einem Satz:** Jedes Land bekommt eine kleine **Agenda-KI**: Regierung mit Persönlichkeit, Termine (Wahlen), Druck (Wirtschaft, Innenpolitik), 2–4 gewichtete Ziele, Block und Rivalen, Meinungsmodifikatoren mit Verfall. Dazu kommt ein **Weltlage-Kanal**, in dem Länder auch untereinander handeln, ohne dass der Spieler jedes Mal entscheiden muss. Den Anfang machen die P0-Reparaturen an Drift, Rückfederung, Kriegsrationalität und Vertragslogik (Abschnitt 6).

---

## 1. Methode

| Schritt | Umfang |
|---|---|
| Code gelesen | `sim/laender.ts`, `initiative.ts`, `abkommen.ts`, `abkommen-typen.ts`, `krieg.ts` (Kern), `eu.ts` (Kern), `vermittlung.ts` (Monat, Zustand), `ereignisse-aussen.ts`, `ereignisse.ts` (Wettbewerb), `devisen.ts` (Kanäle), `aussenwelt.ts`, `spiel.ts` (Monatsreihenfolge); Daten `data/abkommen.ts` (vollständig), `data/konflikte.ts`, `data/diaspora.ts`; Oberfläche `ui/welt/*` per Suche nach Aufrufen (`kuendige`, `verlaengere`, `verhandle`) |
| Dokumente | ENTSCHEIDUNGEN.md, AUSSENPOLITIK.md, VERHANDLUNGSTISCH.md, VERBESSERUNGSPLAN_2026-09-30.md (AUS-/MIL-Zeilen), RECHERCHE_KONKURRENZ_FACHBEREICHE.md §6, RECHERCHE_VERTIEFUNG_KRIEG.md §2–4, RECHERCHE_REALWELT_* (Belege für Fakten) |
| Messung 1 | Headless, 3 Spielerprofile × 3 Seeds (3, 7, 21) × 1.440 Tage (4 Jahre), Tagesschritte; alle neu geöffneten Ereignisse, Antworten, Verträge, Kriegsvorgänge, Beziehungen monatlich |
| Messung 2 | Passive Partie (Seed 7), 48 Monate: latente Initiative-Kandidaten je Monat (`initiativeKandidaten`), Zerlegung der Vertrauensdrift in Netzknoten und Versatz |
| Messung 3 | Bewertung von 9 typischen Vertragspaketen am Start und nach 36 Monaten ohne Außenpolitik |
| Messung 4 | Erreichbarkeit der Klausel-Knoten zu den Makro-Kopplungen (Kostendruck, Produktivität, Tourismus, Auslandskapital, Regierungsvertrauen) über ≤2 Kanten |

Profile: **passiv** = keine Antwort, alle Fristen laufen ab. **Nachgiebig** = jeweils die erste bezahlbare Option, wie `standardAntwort`. **Falke** = bei Länder- und Kriegsvorgängen die härteste Option (ablehnen, kontern, standhalten), dazu alle 61 Tage „öffentlich Druck“ auf Zypern, Griechenland und Israel.

Eine Grenze der Messung: Die Profile sind Bots und keine Menschen. Die Häufigkeiten sind belastbar, das „Gefühl“ ist abgeleitet.

---

## 2. Wie „lebt“ ein anderes Land heute?

### 2.1 Zustand eines Landes

| Bereich | Vorhanden? | Beleg |
|---|---|---|
| Steckbrief (Name, Gruppe, Text, ISO) | ja, statisch | `laender.ts:33-51`, 18 Länder `:55-253` |
| Beziehung zur Türkei | 4 Dimensionen: Handel, Sicherheit, Konflikt (eigene Zahl), Vertrauen (Netzknoten `beziehungen_*`/`ansehen` + Versatz je Land) | `laender.ts:279-310`, `:365-369` |
| Erinnerung | 6 Textzeilen, ohne Gewicht und ohne Verfall | `laender.ts:451-454` |
| Gedächtnis für Verträge | `bruch` (−0,15/Monat), `gehalten` (Zähler), Sperrfrist nach Veto | `laender.ts:293-298`, `abkommen.ts:403` |
| Anliegen an die Türkei | je 2–3 feste Bedingungen (Maßnahmenstufe oder eigene Dimension) | `laender.ts:26-31` |
| Verhandlungsprofil | Hebel, Rote Linien, Klauselwerte (5–12 je Land) | `data/abkommen.ts:511-706` |
| Kriegsstärke | eine feste Zahl je Land | `krieg.ts:133-137` |
| **Regierung, Staatsoberhaupt, Persönlichkeit** | **nein** — [W4] Regierungsform, Rückhalt, Kurs zur Türkei, Wahltermin (`welt-modell.ts:75-111`); keine Persönlichkeit | — |
| **Innenpolitik, Wahlen, Regimestabilität** | **nein** — [W4] ja: Stabilität, Wahlen, Machtwechsel, Krisen (`welt-modell.ts:725-850`) | — |
| **Wirtschaft (BIP, Inflation, Energie, Budget)** | **nein** (WDI-Kürzel nur für die Vergleichsanzeige) — [W4] ja: Wachstum, Inflation, Schulden, Defizit, Rüstung (`welt-modell.ts:526-575`) | `laender.ts:43` |
| **Eigene Ziele / Agenda** | **nein**, nur die Anliegen an die Türkei | — |
| **Beziehungen zu Dritten** | **nein**, es gibt keine Länder-Länder-Matrix — [W4] ja: Paare Bündnis/Handel/Spannung (`welt-modell.ts:418-431`) | — |
| **Bündnis- und Blockzugehörigkeit** | **nein**; NATO, EU, OVKS und Golf-Kooperationsrat sind nicht als Daten modelliert — [W4] ja: Institutionen und Pakte mit Klausel (`data/welt-institutionen.ts`, `pakte.ts:88-175`) | — |

Handel und Sicherheit wirken außerhalb von `laender.ts` nur auf Sperren und Anzeige. Sie verändern sich nie von selbst und sind an keine Wirtschaftsgröße gekoppelt (Suche: einzige Fremdnutzung ist die Textausgabe in `befehle.ts:780`). Ein Handelsindex von 72 mit Russland hat also keinen Einfluss auf Exporte oder Gas.

### 2.2 Welche Entscheidungen ein Land selbst trifft (Treiber in `initiative.ts`)

| # | Treiber | Bedingung | Vorlage | Beleg |
|---|---|---|---|---|
| 1 | Rote Linie bedroht | Veto am Tisch (<365 Tage) oder Druck aus Ankara (<60 Tage) | `land_fordert` | `initiative.ts:195-211` |
| 2 | Konflikt hoch | ≥85 Drohkulisse, ≥70 Provokation | `land_drohkulisse`, `land_provokation` | `:213-218` |
| 3 | Vertrag läuft aus | Restlaufzeit 30–360 Tage | `vertrag_verlaengerung` | `:220-234` |
| 4 | Offene Maßnahmen-Anliegen | kein Gipfel in 150 Tagen | `land_fordert` | `:236-250` |
| 5 | Hohes Vertrauen | ≥70 und Konflikt <60, Paket wäre zustimmungsfähig | `land_angebot` | `:252-264` |
| 6 | Ausstrahlung eines Drittvertrags | frischer Vertrag der Türkei (<120 Tage) mit Eintrag in `AUSSTRAHLUNG` | `land_fordert` / `land_angebot` | `:266-288` |

Dämpfung, von innen nach außen:
- 90 Tage Ruhe je Land und kein zweiter offener Vorgang desselben Landes (`initiative.ts:296-308`).
- Startsperre bis Tag 200 (`:51`).
- **Monatschance 0,15 je Vorlage** (`:63`).
- **Abkühlung je Vorlage, global über alle Länder:** `land_fordert` 240 Tage, `land_angebot` 300, `land_provokation` 240, `land_drohkulisse` 120, `vertrag_verlaengerung` 60 (`:398, 495, 551, 612, 671`). Geprüft wird das in `ereignisse.ts:1212`, gesetzt beim Öffnen in `ereignisse.ts:1183`.
- **Höchstens eine Initiative im Monat** (`ereignisse.ts:1225-1250`).
- Wettbewerb um 2–3 Präsentationsplätze und die Dichtebremse ab 6 Ereignissen im Jahr (`ereignisse.ts:64-78, 1063`), dazu höchstens 3 offene Vorgänge (`ereignisse.ts:1152`).

Die Logik ist rein regelbasiert. Es gibt keinen Nutzenvergleich, keine Persönlichkeit und kein Gedächtnis darüber, wer schon was bekommen hat. Jede Initiative ist ein Entscheidungsereignis für den Spieler (`initiative.ts:14-16`). Ein Land kann also nur handeln, indem es den Spieler zu einer Entscheidung zwingt.

### 2.3 Was sich jeden Monat von selbst bewegt

| Mechanik | Wirkung | Beleg |
|---|---|---|
| Konflikt-Rückfederung | ±1 im Monat zurück auf den **Startwert** | `laender.ts:537` |
| Anliegen-Versatz | alle Anliegen erfüllt: +0,8 Vertrauen im Monat; keines erfüllt: −0,3; ohne Ober- und Untergrenze bis ±60 | `laender.ts:538-541` |
| Vertrags-Dauerwirkungen | monatlich auf Netzknoten; die Leistung des Partners nur zu 40 %, wenn er „unzuverlässig“ ist | `abkommen.ts:399-425` |
| Außenwelt | 3 Indizes (Öl, EU-Nachfrage, Weltzins) mit Rauschen und Schocks, ohne Länderbezug | `aussenwelt.ts:27-58` |
| Drittkonflikte | Reife schwankt (Hash-Rauschen), Konfliktindex federt auf den Startwert zurück | `vermittlung.ts:540-553` |
| EU-Vorgang | Screening, Kapitel, Veto von Griechenland und Zypern ab Konflikt 70/60, Zollunion und Visa | `eu.ts:356-381, 757-850` |
| Kriegsvorgang | entsteht ab Konflikt 73, Gegner greift ab Eskalation 95 an | `krieg.ts:39, 49, 1001-1043, 966-970` |

### 2.4 Handeln Länder untereinander?

**[W4] Ja, im Weltmodell:** Gipfel, Handelspakte, Hilfe, Rüstung, Druck, Sanktionen, Bündnisse, Entspannung und Repression (`welt-modell.ts:862-998`). Dazu kommen Kriege zwischen Dritten mit Paktbeitritten und Beistandsrufen an die Türkei (`pakte.ts:761-1040`). Die folgende Beschreibung gilt für den Stand vor W4.

**Vor W4: Nein.** Kontakte zwischen Dritten gibt es nur als Nebenwirkung türkischer Handlungen:

| Kanal | Was passiert | Beleg |
|---|---|---|
| `AUSSTRAHLUNG` | 15 Einträge: ein Vertrag der Türkei mit A senkt das Vertrauen von B **zur Türkei** | `data/abkommen.ts:493-509`, angewandt `abkommen.ts:283` |
| `GEGENSPIELER` | ein Rüstungsgeschäft der Türkei mit A: −6 Vertrauen bei As Rivalen | `laender.ts:457, 502` |
| `AUSSTRAHLUNG_RIVALEN` | Krieg der Türkei mit A: As Rivalen rücken **an die Türkei** heran | `krieg.ts:141-143, 701` |
| Gemeinsame Netzknoten | Griechenland und Zypern hängen an `beziehungen_eu`. Iran, Syrien, Irak, Aserbaidschan, Golf, Israel, Ägypten und Libyen hängen gemeinsam an `beziehungen_nahost`. Eine Geste an Israel hebt deshalb ein wenig das Vertrauen Irans. Das Vorzeichen ist falsch. | `laender.ts:449`, Knotenzuordnung `:57-247` |
| Drittkonflikte | 4 Paare mit Reife und Index, **aber ohne eigene Eskalation, ohne Krieg, ohne Waffenruhe ohne die Türkei.** Spoiler gibt es nur, wenn Ankara beteiligt ist. | `vermittlung.ts:522-597`, `:574-576` |

Es fehlen: Kriege und Bündnisse zwischen Dritten, Sanktionen Dritter (etwa USA gegen Iran) als Zustand, Wahlen und Regierungswechsel. Der Mekka-Beistandspakt (`laender.ts:318-327`) bindet die Türkei an Saudi-Arabien, aber Saudi-Arabien kann nie angegriffen werden. Die Pflicht wird nie fällig. Sie erhöht nur die eigene Kriegsstärke um 6 % je Beistandsvertrag (`krieg.ts:260-276`), auch im Krieg gegen Griechenland.

### 2.5 Reagieren Länder nur auf die Türkei?

Ja. Jede der sechs Initiative-Arten richtet sich an Ankara, ebenso jede Ausstrahlung und jede Kriegsreaktion. Die Dokumente versprechen mehr:
- ENTSCHEIDUNGEN.md:28: „Welt vereinfacht, aber **eigenständig handelnd**“.
- AUSSENPOLITIK.md, Grundsatz: „Andere Staaten haben eigene Interessen und **handeln ohne den Spieler**“.
- AUSSENPOLITIK.md §7.1: Akteurseigenschaften wie „Regime-Logik, interne Fraktionen, Zeitdruck“.
- AUSSENPOLITIK.md §7.3: „Regimewechsel … berechnet“.
- AUSSENPOLITIK.md §11: „Vertragsbruch durch einen Partner … ein Wendepunkt“.

Keiner dieser Punkte ist umgesetzt.

---

## 3. Messung: Wie oft tut ein Land etwas, und fühlt sich die Welt lebendig an?

### 3.1 Initiativen über 4 Jahre

| Profil | Seed | Ereignisse gesamt | Initiativen | Was | Neue Verträge | Kriegsvorgänge |
|---|---|---|---|---|---|---|
| passiv | 3 | 43 | 3 | Angebot AZE; Provokation CYP ×2 | 0 | 1 (CYP, Dauer-„Spannung“) |
| passiv | 7 | 44 | 3 | Forderung EU; Provokation CYP ×2 | 0 | 1 (CYP) |
| passiv | 21 | 39 | 5 | Provokation CYP ×2; Angebot AZE ×2; Forderung EU | 0 | 1 (CYP) |
| nachgiebig | 3 | 41 | 5 | Provokation CYP ×2; Angebot UKR ×2; Forderung EU | 3 | 1 (CYP) |
| nachgiebig | 7 | 43 | 3 | Forderung EU ×2; Provokation CYP | 2 | 1 (CYP) |
| nachgiebig | 21 | 41 | 4 | Angebot AZE; Forderung EU ×2; Provokation CYP | 3 (1 gebrochen) | 1 (CYP) |
| Falke | 3 | 51 | 4 | Provokation GRC, ISR; Angebot UKR; Forderung EU | 0 | 7 |
| Falke | 7 | 51 | 3 | Forderung EU; Provokation GRC; Drohkulisse CYP | 0 | 6 |
| Falke | 21 | 52 | 6 | Angebot AZE; Forderung EU ×2; Drohkulisse CYP ×2; Provokation GRC | 0 | 6 |

**Ergebnis:** 36 Initiativen in 36 Spieljahren, also **1,0 pro Jahr**. Das entspricht genau der Kalibrierungsabsicht (`initiative.ts:57-62`: „etwa einen im Jahr“). Für eine Welt mit 18 Akteuren ist das zu wenig.

| Kennzahl | Wert |
|---|---|
| Länder mit mindestens einer Initiative (alle 9 Läufe) | **6 von 18**: Zypern, EU, Aserbaidschan, Ukraine, Griechenland, Israel |
| Länder ohne jede Initiative | **12**: USA, Russland, China, Golf, Iran, Irak, Syrien, Armenien, Georgien, Ägypten, Libyen, Kasachstan |
| Typen | Provokation Zypern dominiert (passiv), Forderung EU „Reformzusage“ fast in jeder Partie |
| Latente Kandidaten je Monat (Messung 2) | ab Monat 7: **10 bis 16**. USA-Angebot in 25 von 48 Monaten, Russland-Angebot in 19, ohne jede Präsentation |
| Anteil Außenpolitik an allen Ereignissen | Initiativen 7–12 %; mit den übrigen Außenereignissen (IWF, NATO, Gas, Grenze) 10–15 % |

Ursache: Die Treiber feuern reichlich. Gebremst wird an drei Stellen. Erstens wirkt die Abkühlung je Vorlage über alle Länder hinweg, also global statt je Land. Zweitens kommt höchstens eine Initiative im Monat zum Zug. Drittens konkurriert jede Initiative mit Inlandsereignissen, deren Häufigkeit die Dichtebremse kappt.

### 3.2 Beziehungsverläufe ohne Außenpolitik (passiv, Seed 7, 48 Monate)

| Land | Vertrauen Start → Ende | Versatz Start → Ende | Anliegen am Start |
|---|---|---|---|
| USA | 52 → 89 | 7 → 44 | beide erfüllt |
| Russland | 45 → 85 | −10 → 29 | beide erfüllt |
| Ukraine | 62 → **100** | 17 → 55 | beide erfüllt |
| Ägypten | 50 → 88 | 5 → 43 | beide erfüllt |
| Libyen | 58 → 96 | 13 → 51 | beide erfüllt |
| Irak | 45 → 83 | 0 → 38 | beide erfüllt |
| EU | 40 → 23 | 0 → −17 | keines erfüllt |
| Iran | 40 → 26 | −5 → −19 | keines erfüllt |
| Armenien | 36 → 24 | −9 → −23 | keines erfüllt |
| Israel | 25 → 11 | −20 → −34 | keines erfüllt |
| Zypern | 24 → 10 | −16 → −30 | keines erfüllt |
| Griechenland, Syrien, Aserbaidschan, China, Golf, Georgien, Kasachstan | ±0–3 | unverändert | gemischt |

Die Netzknoten `beziehungen_usa/eu/russland/nahost` bewegen sich in 4 Jahren um weniger als 1,1 Punkte. **Die gesamte Drift stammt also aus dem Anliegen-Versatz.** Der Konflikt steht für alle 18 Länder am Ende exakt auf dem Startwert. Handel und Sicherheit bleiben unverändert.

Folge für das Spiel (Messung 3, Bewertung am Tisch nach 36 passiven Monaten):

| Paket | Start | Nach 36 Monaten |
|---|---|---|
| USA: Rüstungskauf ↔ **F-35/F110 freigeben** (5 J.) | Gegenangebot | **Zustimmung**, ohne S-400 |
| Russland: Gas kaufen ↔ Preisnachlass (10 J.) | Gegenangebot | **Zustimmung** |
| Irak: Wasser ↔ Pipeline + PKK (10 J.) | Gegenangebot | **Zustimmung** |
| EU: Zölle ↔ Visafreiheit | Ablehnung | Ablehnung (Vertrauen gefallen) |

Die Welt belohnt also Untätigkeit mit West- **und** Ostnähe zugleich. Das ist weder hart noch glaubwürdig.

### 3.3 Drittkonflikte

| Konflikt | Start Index | Nach 4 Jahren (alle 9 Läufe) |
|---|---|---|
| Ukraine–Russland | 80 | 80 |
| Israel–Iran (Hormus) | 75 | 75 |
| Armenien–Aserbaidschan | 45 | 45 |
| Libyen | 55 | 55 |

Kein Konflikt eskaliert, keiner endet ohne die Türkei. Die Reife schwankt leicht durch Rauschen (`vermittlung.ts:545-549`). In der Umsetzungsphase einer Einigung senkt `vermittlungMonat` den Länderkonflikt um 1, `weltMonat` hebt ihn im selben Monat um 1 zurück zum Startwert (Reihenfolge `spiel.ts:304-307`). Unter dem Strich bleibt die Wirkung null.

### 3.4 Kriegsverhalten der Gegner (Falke)

- 6–7 Kriegsvorgänge je Partie. Kriegsbeginn ist jedes Mal „**X schlägt zu**“: Zypern (Stärke 14), Griechenland und Israel greifen die Türkei an, sobald die Eskalation 95 erreicht (`krieg.ts:966-970`).
- Es gibt keine Prüfung von Stärkeverhältnis, Bündnisrückhalt oder Kosten. Die Gegnerstärke ist eine feste Zahl (`krieg.ts:133-137, 281-286`).
- Reaktion Dritter beim Kriegsbeginn: −1 bis −2 Vertrauen bei allen Ländern und kleine Pluspunkte bei Rivalen (`krieg.ts:701-707`). USA-Vertrauen nach zwei Kriegen gegen den NATO-Partner Griechenland: 85–86 (passiv 89). EU: 4–28.
- Nicht modelliert: NATO-Bündnisfall, Beistandsklausel der EU, Sanktionen oder Waffenembargo, Vermittlungsangebote Dritter.

### 3.5 Fühlt sich die Welt lebendig an?

**[W4] Im Hintergrund ja, gegenüber der Türkei kaum** (Messung in 0.1, L4, und 3.6). Vor W4: **Nein.** Ein Spieler sieht in vier Jahren etwa vier Länderanfragen, fast immer von denselben drei Absendern (Zypern, EU, Aserbaidschan). Die Großmächte schweigen. Nachrichten über die Welt selbst gibt es keine: keine Wahl in Washington, keinen Machtwechsel, keine Eskalation im Kaukasus, keinen Gaspreisstreit zwischen Moskau und Brüssel. Stattdessen verbessern sich Beziehungen ohne Zutun, und der Spieler kann diese Drift nicht nachvollziehen. Die Welt ist ein **Kulissenhintergrund mit gelegentlichem Anklopfen**.

---

### 3.6 [W4] Wiederholte Messung am Stand 09a14ff

| Profil | Seed | Ende | Ereignisse | Initiativen (Länder) | Weltereignisse | Waffenruhe-Angebote | Kriegsvorgänge | Drittkriege | Verträge |
|---|---|---|---|---|---|---|---|---|---|
| passiv | 3 | — | 51 | 5 (EU, CYP, USA) | 8 | 0 | 1 (CYP Spannung) | 3 (u. a. Iran–Golf, beendet) | 1 |
| passiv | 7 | — | 47 | 2 (CYP, EU) | 6 | 0 | 1 (CYP Spannung) | 2 | 1 |
| passiv | 21 | — | 50 | 6 (CYP, AZE, EU, LBY) | 4 | 0 | 1 (**CYP Drohkulisse**) | 2 | 1 |
| nachgiebig | 3 | — | 45 | 4 (CYP, USA, EU) | 7 | 0 | 2 (CYP, IRN mit SAU als Partner) | 3 | 4 |
| nachgiebig | 7 | — | 55 | 3 (EU, CYP) | 6 | 0 | 1 | 2 | 2 (1 gebrochen) |
| nachgiebig | 21 | — | 48 | 3 (UKR, EU) | 5 | 0 | 1 (CYP Drohkulisse) | 3 (u. a. Israel–Syrien) | 4 |
| Falke | 3 | **Sturz Tag 818** | 38 | 0 | 4 | 4 | 3 | 3 | 1 |
| Falke | 7 | **Sturz Tag 1030** | 62 | 2 (CYP, GRC) | 4 | **17** | 4 | 2 | 1 |
| Falke | 21 | **Sturz Tag 1121** | 80 | 2 (GRC, UKR) | 4 | **20** | 4 | 3 | 1 |

Weltmodell über 5 Seeds (passiv, 48 Monate; `w4/stab.json`):
- 12–20 Machtwechsel, 20–25 Wahlen und 55–72 Gipfel unter Dritten.
- 0–1 neue Drittkriege.
- Stabilität am Ende: Iran 0–8 (Start 21), Russland 1–18 (Start 28), Syrien 0–19 (Start 33).

Bewertung nach 36 passiven Monaten:
- USA „Rüstungskauf ↔ F-35“: Zustimmung 10,7/5,05.
- USA „S-400 ↔ F-35 + CAATSA“: Zustimmung 7,7.
- Irak „Wasser ↔ Pipeline + PKK“: Zustimmung 11,0.
- Golf „Rüstung ↔ Swap + Einlagen“: jetzt Zustimmung.

---

## 4. Verträge: alle Klauseln, ihre Kanäle, Bruch, Erneuerung

### 4.1 Lebenszyklus eines Vertrags

| Phase | Regel | Beleg | Bewertung |
|---|---|---|---|
| Angebot | Punkte = Klauselwerte + (V−45)/5 − (K−40)/8 + Hebel − Bruch + gehalten + 2 bei Gegenseitigkeit; Schwelle 4 + (J−2)·0,35 | `abkommen.ts:135-172, 131` | gut lesbar, Gründe sichtbar |
| Gegenangebot | eine Änderung (kürzer, ein weiteres Angebot, Verzicht), höchstens drei | `abkommen.ts:184-218` | gut |
| Veto | eine Rote Linie bringt 45 Tage Sperre und setzt den Rote-Linie-Treiber | `abkommen.ts:328-333` | gut; nur 3 Rote Linien insgesamt (GRC, ARM, CYP) |
| Abschluss | Abschlusswirkungen, Wirkung auf die Beziehung, Ausstrahlung auf Dritte | `abkommen.ts:259-288` | gut |
| Laufzeit | Dauerwirkung × Laufzeitfaktor 0,8/1/1,25 | `abkommen.ts:26, 404-414` | ok |
| Jahresprüfung | nur **5 von 54** Klauseln haben eine Pflicht (`zoll`, `investitionen_oeffnen`, `reform_zusage`, `migration_zusage`, `verzicht_bohrung`). Zwei Verstöße bedeuten Bruch. | `abkommen.ts:370-396` | zu dünn: Montreux, Beistand, Sanktionsumgehung, Wasser und Gas werden nie geprüft |
| Pflichten des Partners | **keine.** Der Partner liefert bei Vertrauen <25 oder Konflikt ≥85 nur 40 %, still und ohne Meldung | `abkommen.ts:361-363, 412` | Partnerbruch fehlt, obwohl AUSSENPOLITIK §11 ihn fordert |
| Ablauf | gehaltene Verträge zählen | `abkommen.ts:415-421` | ok |
| Verlängerung | **nur** als Initiative des Partners (`vertrag_verlaengerung`, Chance 0,15). Der Spieler hat keinen Knopf, weder in der Oberfläche noch per Befehl (Suche: `verlaengere` nur in `initiative.ts:579-592`) | `abkommen.ts:451-468` | Lücke |
| Kündigung | ab einem Drittel der Laufzeit ordentlich (−4), vorher Bruch | `abkommen.ts:428-446` | ok |
| Nachverhandlung | **gibt es nicht** (keine Änderung laufender Klauseln, keine Anpassungsklausel, kein Schiedsverfahren) | — | Lücke |
| Exklusivität | **gibt es nicht.** VERBESSERUNGSPLAN AUS-6 behauptet, S-400 gegen F-35 sei „schon als `sperre` gebaut“. Im Code ist nur die Israel-Handelssperre ein Sperrmechanismus (`data/abkommen.ts:490`) | — | Fehler im Plan **und** im Code |

Eine Falle für den Spieler: Die EU-Forderung „Reformzusage“ kommt in fast jeder Partie. Die naheliegende Antwort „erfüllen“ schließt einen Vertrag mit der Pflicht Justizreform ≥55. Wer die Reform nicht betreibt, bricht den Vertrag automatisch nach zwei Jahren (Messung: nachgiebig Seed 21, `gebrochen`). Die Folgen sind Vertrauen −12 und Ansehen −2. Die Vorschau nennt die Jahresprüfung, aber nicht, dass die Pflicht beim aktuellen Stand sicher verfehlt wird.

### 4.2 Kanäle der Klauselwirkung

Klauselwirkungen gehen als Effekt `knoten`, `schulden` oder `risiko` ein (`reich.ts:347-379`). Ins Wirtschaftsmodell zurück wirken vom Politiknetz nur wenige Knoten:
- `kostendruck` und `produktivitaet` (`world.ts:150-162`),
- `tourismus` über die Leistungsbilanz und `auslandskapital` über die Kapitalflüsse (`devisen.ts:149-190`),
- dazu die Wählergruppen und `vertrauen_regierung`.

Die **Leistungsbilanz** hängt an EU-Nachfrage, Öl-Index, Tourismus und J-Kurve (`devisen.ts:149-175`). Der Knoten `export` gehört nicht dazu.

Legende:
- **M** = direkte Makrogröße (Schulden, Risikoaufschlag).
- **N→M** = Knoten mit Kopplung an Wirtschaft oder Devisen.
- **N→W** = Knoten mit Wirkung auf Wähler oder Regierungsvertrauen.
- **N** = Knoten ohne Kopplung im Umkreis von zwei Kanten.
- **K** = Kriegsmodul.
- **E** = EU-Vorgang.
- **B** = nur die Beziehungszahl.

**Die Türkei gibt (27 Klauseln):**

| Klausel | Länder | Kanal | Pflicht | Befund |
|---|---|---|---|---|
| `zoll` Zölle senken | 9 | N→W (Unternehmer, Lebenshaltung), N (Export, Industrie) | ja | Exportplus erreicht die Leistungsbilanz nicht |
| `transit` Korridor | 7 | N→M (Logistik→Produktivität) | — | **keine Transitgebühren** als Einnahme |
| `meerengen` Montreux-Zusage | 2 | N→M (Ansehen→Tourismus), B | — | **nur Zahl**: keine Wirkung auf Kriegsschiffe, die Flotte Russlands, Krieg oder Vermittlung |
| `militaerzugang` | 3 | N→W (Abschreckung) | — | keine Stationierung als Zustand |
| `ruestung_koop` | 8 | N/N→W (Export, Industrie, Rüstungsautarkie) | — | keine Lieferungen oder Bestände |
| `ruestung_kauf` | 1 | M (Schulden +0,3), N→W | — | „bestellt ≠ einsatzbereit“ (AUSSENPOLITIK §5) fehlt |
| `bauauftraege` | 7 | M, N | — | ok |
| `visa` | 4 | N→M (Tourismus→Leistungsbilanz) | — | wirkt |
| `grenzoeffnung` | 1 | N→W regional (Kars, Iğdır, Ardahan) | — | wirkt |
| `vermittlung_zusage` | 8 | N→M (Ansehen) | — | **keine Verbindung zum Vermittlungsmodul** (Reife, ZOPA) |
| `gas_kauf` | 4 | N→M (Energiepreise→Kostendruck) | — | **ändert weder Öl-Index noch Importrechnung**; keine Mengen |
| `investitionen_oeffnen` | 8 | N→M (Auslandskapital) | ja | wirkt |
| `kredit_hilfe` | 2 | M | — | nur Abschluss, keine Rückzahlung oder Ausfall |
| `reform_zusage` | 1 | N→M (Vertrauen der Märkte) | ja | **kein Bezug zum EU-Vorgang** (`eu.ts` liest den Vertrag nicht) |
| `sanktionen_umgehung` | 2 | N | — | ungeprüft, die Pflicht fehlt |
| `migration_zusage` | 2 | N→W (Geflüchtete) | ja | **kein EU-Geld** als Gegenleistung |
| `s400` | 1 | N→W, Beziehung Russland | — | **schaltet nichts frei** (F-35 und CAATSA unabhängig) |
| `zahlungsweg` | 2 | M (Risiko +8) | — | Sekundärsanktionen nur als Text |
| `ende_sperre` | 1 | Zustand (hebt die Sperre auf) | — | wirkt mechanisch |
| `v_casus` | 1 | B (Konflikt −12) | — | **federt in 12 Monaten zurück** |
| `verzicht_bohrung` | 2 | N | ja | Konflikt federt zurück |
| `hafen_oeffnung` | 1 | E (Zypern-Bewegung), N→M | — | **eine der wenigen Querverbindungen**, gut |
| `wasser` | 1 | N→W regional (Südost) | — | keine Menge (m³/s), keine Kopplung an Dürre (`duerre`-Knoten existiert) |
| `energie_lieferung` | 1 | N | — | ok |
| `beistand` | 2 | K (+6 % Stärke), N→W | — | **nie fällig**, ungeprüft |
| `seesicherheit` | 1 | N→W, N→M | — | ok |
| `bohrung` | 1 | N→M | — | Ausstrahlung auf GRC und EGY fehlt, obwohl der Text sie nennt |

**Die Türkei will (27 Klauseln):**

| Klausel | Länder | Kanal | Befund |
|---|---|---|---|
| `w_zoll`, `w_handelsziel`, `w_defizit` | 2/1/1 | N (Export, Industrie) | erreichen die Leistungsbilanz nicht |
| `w_zollunion` | 3 | N→M (Investitionen→Produktivität) | **doppelt modelliert**: auch als EU-Zwischenziel (`eu.ts:512-547`), beide unverbunden |
| `w_visa` | 1 | N→W (einmalig) | **doppelt**: Visa-Mini-Track `eu.ts:617-665` |
| `w_ruestung` | 2 | K (Luftbereitschaft), N→W | wirkt im Krieg; **keine S-400-Kopplung** |
| `w_sanktion` | 1 | N→M | ok |
| `w_preis`, `w_aufschub` | 3/1 | N→M, M | keine Wirkung auf die Importrechnung |
| `w_swap` | 2 | M (Risiko −12), N→M | **Text sagt „Reserven steigen“** (`data/abkommen.ts:333`), Reserven bleiben unberührt |
| `w_pkk`, `w_rueckkehr` | 3/1 | N→W | wirkt |
| `w_stuetzpunkt`, `w_hafen`, `w_transit`, `w_pipeline`, `w_luftraum` | 2/1/18/1/1 | N→M (Logistik) | `w_transit` steckt in **allen** 18 Profilen als Füllwert; die Pipeline bringt keine Durchleitungseinnahme |
| `w_werk`, `w_investition_zusage` | 1/2 | N→M | `arbeitsplaetze_industrie` hat 0 ausgehende Kanten |
| `w_akkuyu` | 1 | N | ok |
| `w_getreide` | 2 | N→M (Lebensmittelpreise→Kostendruck) | keine Verbindung zum Konflikt Ukraine–Russland |
| `w_libyen` | 1 | N | keine Verbindung zum Libyen-Konflikt |
| `w_seegrenze`, `w_direkthandel` | 4/1 | N→W | — |
| `w_1915`, `w_inseln`, `w_trnc` | je 1 | N→W | **Rote Linien**: in der Praxis nie erreichbar (Absicht) |

**Zusammengefasst:**
- Alle 54 Klauseln wirken irgendwo, keine ist toter Code. Jedes Profil nutzt mindestens eine (Messung 4).
- **Nur drei Klauseln greifen in ein anderes Modul ein:** `hafen_oeffnung` in den EU-Vorgang, `beistand` und `w_ruestung` in den Krieg. `ende_sperre` ändert zusätzlich einen Zustand.
- **Zahlungsbilanz, Energie und Reserven**, also die härtesten Größen der Türkei 2026, sind von Verträgen fast abgekoppelt.
- **Entspannungsklauseln wirken nur vorübergehend**, weil der Konflikt auf den Startwert zurückfedert.

### 4.3 Fehlende reale Vertragsarten

| Vertragsart | Realer Bezug (Quelle) | Im Spiel | Vorschlag |
|---|---|---|---|
| **Montreux-Regime** (Meerengen) | Kriegszeit-Klauseln seit 27.02.2022 aktiv; Transitgebühr ab 01.07.2026 6,70 USD je Nettotonne, Einnahmen etwa 254 Mio. USD 2025/26 (RECHERCHE_REALWELT_UKRAINE_RUSSLAND.md §5.1) | nur `meerengen` als Zusage; Anliegen der Ukraine `m_verteidigung≥50` (`laender.ts:195`) | Zustand „Meerengen offen / für Kriegsparteien geschlossen“ mit Wirkung auf Russland, die Ukraine, die NATO und Gebühreneinnahmen |
| **NATO-Pflichten / Bündnisfall** | Art. 5 Nordatlantikvertrag (1949) [extern, im Projekt nicht belegt = Lücke]; Verteidigungsbudget 2,33 % des BIP (RECHERCHE_INNENPOLITIK.md:74); Incirlik, Kürecik (RECHERCHE_KONKURRENZ_FACHBEREICHE.md:69) | nur Anliegen der USA und `nato_ratifizierung`-Ereignis (`ereignisse-aussen.ts:190-235`) | multilateraler Vertrag „NATO“ mit Lastenteilung (Prüfung), Art.-4/5-Ereignissen, Stützpunktfrage |
| **EU-Beistand** | Art. 42 Abs. 7 EUV [extern, im Projekt nicht belegt = Lücke] — Griechenland und Zypern sind EU-Mitglieder | fehlt; Krieg gegen Griechenland kostet die EU nur Vertrauen | EU-Sanktionen oder Embargo als Reaktion |
| **Zollunion-Modernisierung** | Beschluss 1/95 des Assoziationsrats EG–Türkei [extern, Fundstelle prüfen]; blockiert durch Rechtsstaat und das Veto von GR/CY (RECHERCHE_REALWELT_TUERKEI_2026.md:427) | doppelt (Klausel und EU-Zwischenziel) | **ein** Weg: EU-Vorgang führt, die Klausel entfällt oder verweist darauf |
| **Visaliberalisierung** | 66 von 72 Kriterien laut Ankara (RECHERCHE_REALWELT_TUERKEI_2026.md:427) | doppelt (Klausel `w_visa` und Mini-Track) | vereinheitlichen |
| **Rückübernahme / Migrationsdeal mit Geld** | EU–TR-Rückübernahmeabkommen (2013/2014) und EU-Türkei-Erklärung 18.03.2016 [extern, im Projekt nicht hinterlegt — **Lücke**: Beträge und Daten belegen] | `migration_zusage` ohne Gegenleistung | Klausel mit Tranchen (Geld gegen Rücknahmequote), Prüfung je Jahr |
| **Gas-Langfristverträge mit Mengen** | Russland 22 Mrd. m³/J, verlängert bis 31.12.2026 (RECHERCHE_ENERGIE.md:112); Iran 9,6 Mrd. m³ ausgelaufen 07/2026 (Profiltext); Turkmen-Swap ausgesetzt (RECHERCHE_REALWELT_NAHOST.md:391) | `gas_kauf` ohne Menge; Ereignis `gasvertrag` (`ereignisse-aussen.ts:237-275`) **unverbunden** mit dem Tisch, Option „kurz“ ohne jede Wirkung | Vertrag mit Menge, Preis und Take-or-Pay; Kopplung an Öl- und Gasrechnung in `devisen.ts` |
| **Pipeline- und Durchleitungsverträge** | Kirkuk–Ceyhan-Protokoll bis 01.08.2027 (RECHERCHE_REALWELT_SYNTHESE.md:21); TurkStream-Transit (RECHERCHE_ENERGIE.md:128) | `w_pipeline`, `transit` ohne Einnahmen | Transitgebühr als Haushaltseinnahme; Unterbrechungsereignisse |
| **Wasser Euphrat/Tigris** | Protokoll 1987: 500 m³/s Euphrat an Syrien (RECHERCHE_REALWELT_NAHOST.md:274) | `wasser` ohne Menge und Dürrebezug, nur gegenüber dem Irak | Mengenklausel, Prüfung gegen `duerre`/`wasserversorgung`, auch gegenüber Syrien |
| **Rüstungskooperation / Beschaffung** | F-35/F110/CAATSA hängen an S-400 nach NDAA §1245 (Profiltext USA, RECHERCHE_KONKURRENZ_FACHBEREICHE.md §6) | ohne Exklusivität, ohne Lieferzeiten | Voraussetzung `s400` für `w_ruestung@USA`; Lieferplan als Vorgang |
| **Swap-Linien / Einlagen** | Swap-Verbindlichkeiten 16,5 Mrd. USD (11.09.2026), netto ohne Swaps 29,1 Mrd. (RECHERCHE_REALWELT_TUERKEI_2026.md:103-105) | `w_swap` ohne Reservenwirkung | Swap erhöht Brutto-, nicht Nettoreserven; Laufzeit und Rückabwicklung |
| **Investitionsschutz (BIT)** | **Lücke**: Zahl und Stand der türkischen BITs nicht im Projekt belegt | nur `investitionen_oeffnen` | eigener Typ: senkt Risikoaufschlag für Investoren eines Landes, Schiedsfall als Ereignis |
| **Doppelbesteuerungsabkommen** | **Lücke**: Bestand nicht belegt | fehlt | kleiner Dauereffekt auf Investitionen und Diaspora-Unternehmer |
| **Freihandelsabkommen (FTA) als Typ** | Ukraine-FTA-Entwurf 02/2026 (RECHERCHE_REALWELT_LAENDERDOSSIERS.md:129); UK-FTA-Wunsch (ebd. :296) | `zoll` + `w_zoll` als Paar | ok als Paket, aber Zollunion-Recht (EU-Außenzoll) als Grenze fehlt |
| **Auslieferung / Rechtshilfe** | **Lücke** (z. B. PKK- und Gülen-Auslieferungsforderungen gegenüber EU-Staaten belegen) | nur `w_pkk` | Klausel mit EGMR-Konfliktpotenzial |
| **Sozialversicherung / Diaspora** | 3,08 Mio. Menschen türkischer Herkunft in Deutschland (AUSSENPOLITIK §10, Destatis 2025) | `diaspora.ts` hat keinen Länderbezug | Abkommen mit DE/NL/AT (Renten, Doppelpass): Wirkung auf Auslandswähler |
| **Waffenstillstand / Friedensvertrag** | — | eigenes Paket im Kriegsmodul (`krieg-typen.ts` FriedensPaket), **kein Vertrag am Tisch** | Frieden als Vertrag mit Pflichten und Bruch, wie RECHERCHE_VERTIEFUNG_KRIEG §2 empfiehlt |
| **Multilaterale Foren** | OTS (Kasachstan-Text), UN, G20, BRICS/SOZ | fehlt; alles ist bilateral | Forumsvorgänge (vgl. Weltkongress in Civ 6) |
| **Zypern-Garantievertrag 1960** | Rote Linie 4 der Republik Zypern (RECHERCHE_REALWELT_LAENDERDOSSIERS.md:257) | fehlt | Teil des Zypern-Dossiers |

---

## 5. Vergleich mit Referenzspielen und was eine glaubwürdige Länder-KI hier braucht

### 5.1 Referenzmechaniken

Quellen: im Projekt belegt in RECHERCHE_KONKURRENZ_FACHBEREICHE.md §6 und RECHERCHE_VERTIEFUNG_KRIEG.md §2–4. Mit [extern, im Projekt nicht belegt = Lücke] markierte Punkte stehen nicht im Projekt und müssten belegt werden.

| Spiel | Mechanik | Was NWO davon hat | Was fehlt |
|---|---|---|---|
| **HOI4** | KI-Strategien je Land (antagonize, befriend, protect, conquer) mit Gewichten [extern, nicht belegt: hoi4.paradoxwikis.com/AI_modding]; Fraktionen; Weltspannung schaltet Aktionen frei; Kriegsziel-Rechtfertigung als sichtbarer Vorgang | Rahmung des Krieges (`krieg.ts:94-131`) | gewichtete Strategien je Land, Fraktionen, eine Weltspannung als globale Größe |
| **Civ 6** | Agenden der Anführer (eine bekannte, eine verborgene), Beziehung als Liste grüner und roter Gründe, **Grievances** als bilaterales Konto mit Verfall, Weltkongress | Gründeliste am Verhandlungstisch | Agenden, Grievance-Konto mit Verfall, Forum |
| **Victoria 3** | Interessen in Regionen, Verträge aus Artikeln mit Bewertung (das Vorbild des Tisches), **diplomatische Spiele** mit Eskalationsuhr und Sway (Dritte kaufen), schwerer und leichter Bruch auch durch die KI | Klauselvertrag, Bewertung, Gegenangebot | Bruch durch die KI, Sway und Drittbeteiligung, Interessensphären |
| **EU4 / Stellaris** | Meinungsmodifikatoren mit Höhe und Verfall; **Rivalen** (bis 3), Aggressive Expansion → Koalitionen [extern, nicht belegt: eu4.paradoxwikis.com/Rival, /Aggressive_expansion]; Stellaris: Haltung (kooperativ, feindselig) | Erinnerung als Textliste, Bruchpunkte mit Verfall | strukturierte Modifikatoren, Rivalitäten zwischen Dritten, Koalitionsbildung gegen Aggressoren |
| **CK3** | Annahme als Faktorenliste, Haken (Hooks) | Gründeliste | Hebel und Erpressung als handelbares Gut |
| **Suzerain** | Länder mit eigener Innenpolitik in Ereignisketten; Deals als Köder; Rivalitäten bestimmen kompatible Bündnisse (RECHERCHE_SUZERAIN_KRIEGSMATRIX.md:99) | Kriegsmatrix übernommen | Länderinnenpolitik, die Angebote verändert |

### 5.2 Was eine glaubwürdige Länder-KI konkret braucht

**Datenmodell je Land** (Erweiterung von `LandDef`/`LandZustand`):

| Feld | Inhalt | Beispiel (Spielparameter, Fakten nur mit Quelle) |
|---|---|---|
| `regierung` | Typ (Demokratie, Hybrid, autoritär), Führungsfigur (erfundener Name nach ENTSCHEIDUNGEN, Bild gezeichnet), **Persönlichkeit** 3 Achsen: Risiko, Pragmatismus, Ideologie | Moskau: Risiko hoch, Pragmatismus mittel |
| `termine` | nächste Wahl oder Machtprüfung, Regimestabilität 0–100 | USA: Präsidentschaftswahl **07.11.2028** (Dienstag nach dem ersten Montag im November, 3 U.S.C. §1 [extern, im Projekt nicht belegt = Lücke]), also 5 Monate nach Spielstart; übrige Wahltermine **Lücke** |
| `druck` | Wirtschaft (Wachstum, Inflation, Energieabhängigkeit), Innenpolitik (Proteste, Koalition), Krieg | Iran: Krieg seit 02/2026, Gasexport weggebrochen (Profiltext) |
| `agenda` | 2–4 Ziele mit Gewicht und Bedingung, ersetzt die festen Anliegen; Ziele können an Dritte gerichtet sein | Russland: TurkStream halten, Montreux streng gegen NATO, Sanktionsumgehung |
| `block` / `rivalen` | Zugehörigkeit (West, Russland, China, Golf, blockfrei), 0–3 Rivalen; **Nullsummen-Kopplung**: Nähe der Türkei zu Block A kostet bei Block B | USA ↔ RUS, ISR ↔ IRN, ARM ↔ AZE, GRC/CYP ↔ TR |
| `meinung[]` | Modifikatoren {Grund, Wert, Verfall/Monat}, ersetzt den Versatz-Automatismus | „Gipfel 2029: +8, −0,5/Monat“ |
| `beziehungen` (sparse) | ~20 relevante Paare unter Dritten (USA–RUS, USA–IRN, RUS–UKR, ISR–IRN, ARM–AZE, GRC–CYP–EU, SAU–IRN, EGY–LBY …) | Startwerte als Spielparameter |

**Entscheidungsschritt je Land und Monat** (Nutzen-KI statt fester Treiber):
1. Lage lesen: Ziele, Druck, Termine, Meinung zur Türkei, Lage der Rivalen.
2. Handlungen bewerten (Nutzen × Persönlichkeit). Handlungen gegenüber der Türkei: fordern, anbieten, verlängern, nachverhandeln, kündigen, Vertrag brechen, provozieren, sanktionieren. **Handlungen gegenüber Dritten:** Sanktion, Bündnis, Eskalation oder Waffenruhe in einem Drittkonflikt, Wahlkampfrhetorik.
3. Ausführen. Nur Handlungen, die die Türkei betreffen und eine Antwort verlangen, werden Entscheidungsereignisse. **Alles andere läuft in einen Weltlage-Kanal** (Zeitung, Lagebericht des Außenamts), also ohne Entscheidungspflicht und ohne Dichtebremse.
4. Kriegsentscheidung erst nach einer Prüfung: Stärkeverhältnis inklusive Verbündeter, Kosten, Persönlichkeit. Ein Kleinstaat greift keine Großmacht an. Ein NATO-Staat greift einen NATO-Staat nur unter Extrembedingungen an.

**Was das am heutigen Code ändert:** Die sechs Treiber aus `initiative.ts` bleiben als Bausteine des Nutzens. Die globale Abkühlung je Vorlage wird durch eine Abkühlung je Land und Vorlage ersetzt. Die Monatsobergrenze gilt nur noch für Entscheidungsereignisse.

---

## 6. Katalog fehlender Elemente

Priorität: P0 = Glaubwürdigkeit jetzt beschädigt, P1 = Kern der Länder-KI, P2 = Ausbau. Aufwand: S ≤1 Tag, M einige Tage, L ≥1–2 Wochen.

### P0 — Fehler und Fehlanreize

| # | Element | Befund | Vorschlag | Aufwand |
|---|---|---|---|---|
| P0-1 | **Anliegen-Drift begrenzen** [W4: besteht, verschärft] | +0,8 im Monat ohne Grenze; USA und Russland gleichzeitig ~85–89 ohne Handlung (§3.2) | Versatz zieht zu einem Gleichgewicht (z. B. Ziel ±15), statt linear zu wachsen; Vertrauen nicht als eigenes Anliegen zählen; Blockkopplung (P1-3) | S |
| P0-2 | **Konflikt-Rückfederung auf den Startwert** [W4: teilweise behoben durch Anker] | Entspannung (Klauseln, Gipfel, Vermittlung) verpufft; die Vermittlungs-Einigung wirkt netto null (§3.3) | Basiswert je Land als Zustand, den Verträge und Einigungen dauerhaft verschieben | S |
| P0-3 | **Gegner-Angriff ohne Rationalität** [W4: besteht, mit Koalitionsfolgen N2] | Zypern, Griechenland und Israel greifen von selbst an, sobald die Eskalation ≥95 erreicht (§3.4) | Angriffsprüfung: Stärkeverhältnis inklusive Bündnisse, Persönlichkeit, NATO-intern fast ausgeschlossen; sonst Drohkulisse halten oder Ultimatum stellen | S–M |
| P0-4 | **Reaktion von NATO, EU und USA auf Kriege** [W4: teilweise, Koalitionen da, Sanktionen nie ausgelöst] | Krieg gegen ein NATO- oder EU-Mitglied kostet wenige Punkte | Bündnisreaktion: EU-Sanktionen, US-Waffenstopp, Vermittlungsangebot Dritter, Ansehensverlust nach Rahmung | M |
| P0-5 | **Exklusivitäten der Klauseln** [W4: besteht] | F-35 ohne S-400 möglich (§3.2); AUS-6 im Plan als „schon gebaut“ falsch | `voraussetzung`/`schliesstAus` in `KlauselDef`; zuerst `s400`→`w_ruestung/w_sanktion@USA`, `gas_kauf@RUS` vs. `sanktionen_umgehung` | S |
| P0-6 | **Abkühlung je Land statt je Vorlage** [W4: besteht; dazu Weltmodell als Treiber, N6] | 12 von 18 Ländern handeln nie (§3.1) | `spiel.zuletzt["land_fordert#USA"]`; Monatsobergrenze nur für Entscheidungsereignisse | S |
| P0-7 | **Textwahrheit der Klauseln** [W4: besteht; neu `gas_kauf`-Vorzeichen N7] | `w_swap` „Reserven steigen“ ohne Reservenwirkung; `bohrung`-Kehrseite ohne Ausstrahlung; Option `gasvertrag` „kurz“ ohne jede Wirkung | Wirkung nachziehen oder Text ändern | S |

### P1 — Länder als Akteure

| # | Element | Vorschlag | Aufwand |
|---|---|---|---|
| P1-1 | **Regierung, Persönlichkeit und Termine je Land** [W4: Regierung und Termine gebaut, Persönlichkeit fehlt] | Datenfelder §5.2; erfundene Namen nach ENTSCHEIDUNGEN Block B | M |
| P1-2 | **Agenda statt fester Anliegen** | 2–4 gewichtete Ziele, auch an Dritte gerichtet | M |
| P1-3 | **Blöcke und Rivalen** (USA/EU, Russland, China, Golf) [W4: Paare und Institutionen gebaut; Nullsummen-Kopplung zur Türkei fehlt] | Nullsummen-Kopplung, Ausstrahlung aus Daten statt 15 Einzeleinträgen; Korrektur des Knotens `beziehungen_nahost` (Israel und Iran mit gleichem Vorzeichen) | M |
| P1-4 | **Weltlage-Kanal** [W4: gebaut — Weltnachrichten, WeltLage.tsx] | Ereignisse zwischen Dritten ohne Entscheidungspflicht (Zeitung, Lagebericht), nicht in der Dichtebremse | M |
| P1-5 | **Wahlen und Regierungswechsel** [W4: gebaut; Kalibrierung N3, N4] | USA 07.11.2028 als erster fester Termin; Machtwechsel ändern Profilwerte und Rote Linien; „Warten als Strategie“ (AUSSENPOLITIK §7.3) wird spielbar | M |
| P1-6 | **Dynamische Drittkonflikte** [W4: Drittkriege gebaut; Vermittlungsindizes weiter statisch] | Ukraine–Russland, Israel–Iran, Armenien–Aserbaidschan und Libyen eskalieren oder beruhigen sich selbst; Ausstrahlung auf Öl-Index, Flüchtlinge, Meerengen und Gaspreis | M |
| P1-7 | **Partner bricht Verträge** | Ab niedrigem Vertrauen oder unter Druck: Lieferstopp als Ereignis, Kündigung, Nachverhandlungsforderung („Wendepunkt“, AUSSENPOLITIK §11) | M |
| P1-8 | **Spieler kann verlängern und nachverhandeln** | Knopf in `Vertraege.tsx`; Nachverhandlung = laufender Vertrag als Angebot am Tisch | S–M |
| P1-9 | **Makro-Kopplung der Verträge** | Gas-Verträge→Energierechnung in `devisen.ts`; Swap→Bruttoreserven; Zoll/Marktzugang→Leistungsbilanz; Transit und Meerengen→Gebühren; Migration→EU-Tranchen | M |
| P1-10 | **Pflichten erweitern** | Jahresprüfung für `meerengen`, `beistand`, `sanktionen_umgehung`, `wasser`, `gas_kauf` (Abnahme) | S |
| P1-11 | **Bündnisfall Beistand** [W4: gebaut] | Angriff auf Saudi-Arabien oder Aserbaidschan als Weltlage-Ereignis mit Pflicht (Mekka-Pakt) | M |
| P1-12 | **Meinungsmodifikatoren mit Verfall** | ersetzt Textliste und Versatz-Automatik; Gründe sichtbar wie am Tisch | S–M |
| P1-13 | **EU-Wege vereinheitlichen** | `w_zollunion` und `w_visa` an den EU-Vorgang binden; `reform_zusage` zählt im Fortschrittsbericht | S |

### P2 — Ausbau

| # | Element | Vorschlag | Aufwand |
|---|---|---|---|
| P2-1 | Multilaterale Foren (NATO-Gipfel, UN-Generalversammlung, OTS, G20) | Abstimmungen als Mini-Verhandlung (AUS-5) | L |
| P2-2 | Fehlende Vertragsarten (§4.3) | BIT, Doppelbesteuerung, Sozialversicherung/Diaspora, Auslieferung, Montreux als Zustand, Friedensvertrag als Vertrag | M–L |
| P2-3 | Kurzmodell Länderwirtschaft | BIP-Trend, Inflation und Energie aus WDI-Startwerten, damit Druck und Hebel sich bewegen | M |
| P2-4 | Diplomatische Spiele / Sway | Drohkulisse mit Drittbeteiligung (RECHERCHE_VERTIEFUNG_KRIEG §3.1–3.2) | L |
| P2-5 | Geheimdienst und dunkle Wege (MIL-5) | nach P1-6, weil Blowback an Drittkonflikte andockt | L |
| P2-6 | KI-Text für Länder (AUS-3) | Begründungen in der Stimme der Führungsfigur, Regeln bleiben führend | M |
| P2-7 | Weitere Länder | Katar und VAE einzeln, Deutschland und UK getrennt von der EU, Pakistan (Mekka-Pakt) | M |

### Offene Faktenlücken (vor Übernahme belegen)

- Wahltermine 2028–2033 für Griechenland, Zypern, Israel, Deutschland, Russland, Aserbaidschan, Armenien.
- Bestand der türkischen Investitionsschutz- und Doppelbesteuerungsabkommen.
- Beträge und Laufzeiten aus der EU-Türkei-Erklärung 2016 und der Fazilität für Flüchtlinge.
- Wortlaut und Fundstelle des Assoziationsratsbeschlusses 1/95.
- Montreux: Wortlaut der Art. 19/21 (Kriegszeit), falls im Spiel zitiert.

---

## 7. Kurzantworten auf die Auftragsfragen

| Frage | Antwort |
|---|---|
| Welchen Zustand hat ein Land? | Vier Beziehungszahlen zur Türkei, Anliegen, Verhandlungsprofil, feste Kriegsstärke. Keine Regierung, Wirtschaft, Innenpolitik, Führerpersönlichkeit oder eigene Ziele. |
| Welche Entscheidungen trifft es selbst? | Sechs regelbasierte Treiber, die alle auf die Türkei zielen (fordern, anbieten, verlängern, provozieren, drohen); dazu Angriff ab Eskalation 95. |
| Handeln Länder untereinander? | Nein. Dritte werden nur über Ausstrahlung türkischer Handlungen berührt; Drittkonflikte sind eingefroren. |
| Wie oft handelt ein Land? | ~1 Initiative pro Spieljahr insgesamt; 12 von 18 Ländern nie in 36 Spieljahren. |
| Lebendig? | Nein. Kulisse mit seltenem Anklopfen; dazu eine stille, unplausible Drift der Beziehungen. |
| Verträge | Gutes Gerüst (Bewertung, Gegenangebot, Veto, Bruch), aber Wirkung fast nur im Politiknetz; Partner bricht nie; Spieler kann nicht verlängern; keine Exklusivität; wichtige Vertragsarten fehlen. |

**[W4] Nachtrag zu den Kurzantworten.** Seit W4 haben Länder Wirtschaft, Stabilität, Wahlen und einen Kurs zur Türkei. Sie handeln untereinander und führen Kriege gegeneinander, und die Türkei bekommt Beistandsrufe. Gegenüber der Türkei bleibt es bei rund 0,8 Initiativen pro Jahr. Die Vertragslogik ist unverändert. Die Funktionsbefunde mit Status stehen in Abschnitt 0.1, die neuen Befunde in 0.2.
