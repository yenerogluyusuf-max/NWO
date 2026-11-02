# 03 — Wirtschaftliche Entwicklung, Statistik und Ländervergleich

## Grundlage

| | |
|---|---|
| **Geprüfter Stand** | **W4** (`/home/user/nwo-w4/game`, Commit `09a14ff`, Server `localhost:5199`) |
| Vergleichsstand | Alter Stand `/home/user/nwo-analyse/game` |
| Code und Dokumente | Nichts geändert |
| Pfadangaben | Relativ zu `game/` des W4-Stands, sofern nicht anders vermerkt |
| Messläufe | Headless mit vitest, 4 Partien zu je 48 Monaten, Start 05.06.2028, Seed 7 bzw. 99. Jeweils im alten Stand und im W4-Stand. |
| Rohdaten | `…/scratchpad/analyse/wirtschaft/w4_*.csv\|json` (W4), `lauf_*.csv\|json` (alt), `welt.txt` (Weltmodell), `posten2.txt` (Haushaltsregler) |
| Mess-Skripte | `zz-w4.test.ts` und `zz-wirtschaft-analyse.test.ts`; jeweils nur kurz in `test/` kopiert, danach gelöscht |
| Oberfläche | Playwright-Texte gegen den W4-Server; Screenshots scheitern headless an der WebGL-Karte |

Externe Datenquellen sind nur **benannt**, nicht recherchiert. Alle Zahlen im Bericht stammen aus Code, `src/data` oder Messläufen.

**Status-Spalte in den Tabellen:**

- **offen:** besteht in W4 unverändert
- **teilweise:** in W4 angegangen, aber nicht gelöst
- **in W4 behoben:** galt nur im alten Stand
- **neu (W4):** erst im W4-Stand entstanden

---

## 0. Was nicht sauber funktioniert

In keinem W4-Lauf traten NaN-Werte im laufenden Zustand auf. Die einzige Ausnahme: `sektorIndex`, `konjunkturSaldo` usw. sind bis zum ersten Monatsersten `undefined`; die Formeln fangen das mit `?? 0` ab.

Die größten Monatssprünge in den vier W4-Läufen:

- Inflation: höchstens 3,9 Pp
- CDS: höchstens 86 bp
- Defizit: höchstens 1,9 Pp
- USD: bis 61 Lira pro Monat, nur bei 107 % Inflation

### 0.1 Rechenfehler und unplausible Verläufe

| # | Befund | Beleg (W4) | Messung W4 (Ende nach 48 Monaten) | Status | Prio |
|---|---|---|---|---|---|
| F1 | **Das nominale BIP ist eingefroren.** `bipTryTn` (84 Bio. TL) wird nie fortgeschrieben. Das BIP in Dollar fällt mit jeder Abwertung. Davon hängen die Reservenflüsse in Dollar ab. | `sim/devisen.ts:134-137, 231`; `sim/wirtschaft-kennzahlen.ts:415` | BIP laut Spiel, passiv: 1.716 → 1.129 Mrd. USD. Mit Spielwachstum und Spielinflation fortgeschrieben wären es 2.358. Populist: → **123 Mrd. USD**. Je schwächer die Lira, desto kleiner erscheinen Leistungsbilanz-Defizit und Kapitalflucht in Dollar. Das ist die falsche Richtung. | offen | **P0** |
| F9 | **Inflation kostet kein Wachstum.** Wachstum = Potenzial + Δ Auslastung. Kein Kanal führt von Inflation oder Dollarisierung zu Investitionen und Output. Der neue `sektorIndex` mildert das nur indirekt. | `sim/economy.ts:206` | Populist: Inflation **107 %**, Netto-Reserven −13 Mrd., Rating auf CCC+ gefallen. Trotzdem Wachstum **6,6 %**, BIP-Realindex **114,7** (passiv 116,7). | offen | **P0** |
| F10 | **Schulden schmelzen trotz hohem Defizit.** Nominalwachstum durch Inflation drückt die Quote stärker, als das Defizit sie hebt. Der FX-Anteil von 40 % bremst nur wenig. Gleiches Muster im neuen Weltmodell: Ägypten 85 → 52 % bei 5 % Defizit. | `sim/economy.ts:217-223`; `sim/welt-modell.ts` | Populist: Defizit **8,3 %** des BIP, Schuldenquote 23,8 → **19,2 %**. Der Fehler belohnt Inflationspolitik. | offen | **P0** |
| F12 | **Disinflation läuft auf Autopilot.** Taylor-Regel, gleitendes Ziel (24 → 5) und automatischer Glaubwürdigkeitsaufbau senken die Inflation ohne jede Spielerhandlung. | `sim/economy.ts:188, 196-201` | Passiv: 31,5 → **7,6 %**, Glaubwürdigkeit 0,45 → 0,84, CDS 250 → 177, Rating B → B+. Das Amtsziel „Inflation unter 15 %“ ist ohne Handlung erreicht. | offen | **P0** |
| F5 | **Nominale Abwertung zählt als Wettbewerbsvorteil.** Der Netz-Eingang `abwertung` ist die nominale 12-Monats-Abwertung, kein realer Kurs. Über `sektorIndex` wirkt der Fehler in W4 jetzt auch auf Auslastung und Leistungsbilanz. | `data/politiknetz.ts:225-226`; `sim/maerkte.ts:225` | Populist: Export 58 → **84**, Tourismus 68 → **93**. Leistungsbilanz des Populisten am Ende **−0,9 %** und damit die *beste* aller vier Partien (passiv −1,8, Reform −1,5). | offen, Wirkung in W4 verstärkt | **P0** |
| F11 | **Disinflation hebt den Reallohn dauerhaft.** Die Kante `inflation → realeinkommen` wirkt auf die Abweichung der Inflations*rate* vom Start. Jeder Monat mit niedrigerer Inflation hebt das *Niveau* weiter. Es gibt keinen Nominallohn. | `data/politiknetz.ts:207` | Passiv ohne Handlung: Reallöhne 44 → **65**, Armut 43 → 25. | offen | P1 |
| F13 | **Index-Deckel (100) und Potenzial-Deckel (±2 Pp) sind nach 3 Jahren erreicht.** | `sim/netz.ts:510-512`; `sim/world.ts:164` | Reform: Produktivität **100**, Investitionen 94,5, Auslandskapital 92,5; `potentialShift = 2,0`, Potenzial 6,0 %. Weitere Reformen wirken nicht mehr. | offen | P1 |
| F17 | **Die Regionalwirtschaft ist eingefroren.** Die Provinzfaktoren sind konstante Multiplikatoren. | `sim/regional.ts`; `sim/netz.ts` `inputValue` | Passiv: Spanne der „Regionalen Entwicklung“ 37,2–57,4 → 37,2–57,4, nach 4 Jahren identisch. | offen | P1 |
| F14 | **Arbeitslosigkeit kriecht zur natürlichen Quote von 9,4 %**, auch bei Reformen. | `sim/economy.ts:210`, `sim/maerkte.ts:226` | W4: passiv 8,1 → 8,6, Reform → **7,4** (alt: 9,8), Populist → 10,3. `arbeitsmarktShift` wirkt. | **teilweise in W4 behoben** | P2 |
| F6 | **Die Leistungsbilanz war politikunabhängig.** | `sim/devisen.ts:154-180` (neuer Baustein „Branchen“) | W4: Die Branchen wirken, aber über F5 in die falsche Richtung. | **in W4 behoben**, ersetzt durch F5 | — |
| F7 | **Branchenknoten ohne Makrowirkung.** | `sim/maerkte.ts:216-236` (`sektorIndex` → Auslastung und LB, `steuereinnahmen` → Haushalt) | Reform: `sektorIndex` +18 → +0,22 Pp Auslastung je Monat; Konjunktursaldo +1,5 % des BIP. | **in W4 behoben** | — |
| F8 | **Keine automatischen Stabilisatoren.** | `sim/maerkte.ts:232`; `sim/wirtschaft.ts:19-28` | W4: `konjunkturSaldo` = 0,3 × Auslastung + 0,03 × Steuerbasis. | **in W4 behoben** | — |
| N5 | **Das Weltmodell erzeugt unplausible Pfade.** | `sim/welt-modell.ts` (Wirtschaftsfortschreibung) | Passive Partie, 48 Monate: Indien Inflation 2,4 → **−0,1 %**, China 0,1 → 6,5 %, Polen Wachstum 3,6 → −0,1 %, Ägypten Schulden 85 → 52 % bei −5 % Saldo, Iran 35 → 23 %. | neu (W4) | P1 |

### 0.2 Anzeigen, die nicht zum Sim-Zustand passen

| # | Befund | Beleg (W4) | Wirkung | Status | Prio |
|---|---|---|---|---|---|
| N1 | **Defizit-Treiber und Haushaltshinweis lassen den neuen Konjunktursaldo weg.** Die Zeilen ergeben nicht die Kopfzahl. | `sim/wirtschaft-kennzahlen.ts:300-309`; `ui/wirtschaft/Haushalt.tsx:412` | Reform am Ende: Kopf „Defizit 1,60 %“; die Zeilen summieren sich zu 3,08 % (Grund 3,1 + Impuls −0,17 + Maßnahmen 1,24 + Zinsen −1,09). | neu (W4) | **P0** (S) |
| N2 | **Wachstums-Treiber ohne Branchen- und Energiefaktor.** `economy.ts:166-168` addiert `sektorAufAuslastung × sektorIndex` und multipliziert den Ölterm mit `energieFaktor`. Die Treiberliste zeigt beides nicht, ebenso die Inflationsliste den Energiefaktor nicht. | `sim/wirtschaft-kennzahlen.ts:248-256, 136` | Reform: Der stärkste Treiber (+0,22 Pp/Monat aus den Branchen) fehlt in „Was bewegt diese Zahl?“. | neu (W4) | **P0** (S) |
| F2 | **Defizit im Vergleichsbalken ≠ Kennzahl.** `spielWert("defizit")` lässt `zinsMehrlast` und jetzt auch `konjunkturSaldo` weg. | `ui/vergleich.ts:157-158` vs. `sim/wirtschaft.ts:19-22` | Abweichung am Ende: passiv 1,0 Pp, Reform **2,6 Pp** (Balken 4,2 statt 1,6), Populist 3,1 Pp. | offen, in W4 größer | **P0** (S) |
| F3 | **Rang und Wertung sind statisch.** „Platz 7 von 193 … ungünstig“ kommt nur aus `ind.tur` (Weltbank 2025), auch bei 7 % oder 107 % Inflation im Spiel. | `ui/VergleichBalken.tsx:71`; `ui/vergleich.ts` `einordnung` | Rang widerspricht dem eingeblendeten Spielwert. | offen | **P0** (S) |
| N3 | **Zwei widersprüchliche Länderzahlen in einer Ansicht.** Der Überblick eines Landes zeigt oben die laufenden Werte aus dem Weltmodell (`WeltLage`) und darunter die statische Weltbank-Tabelle mit „Türkei 34,9 (2025)“. | `ui/Welt.tsx:435-438, 493`; `ui/welt/WeltLage.tsx:63-67` | Polen nach 4 Jahren: oben Inflation 1,4 % (Spiel), unten 3,8 % (2025). Die Türkei ist unten nie der Spielwert. | neu (W4) (F4 alt verschärft) | P1 (S) |
| N4 | **Kernwerte der Wirtschaftsakte mischen wahre und veröffentlichte Werte.** Inflation ist veröffentlicht, Wachstum ist der wahre (noch unveröffentlichte) Wert. Die Sparklines zeigen wahre Monatswerte. | `ui/wirtschaft/Akte.tsx:52-53` | Der Statistikverzug wird umgangen. Im selben Fenster steht in der Lage-Liste ein anderer Wachstumswert (veröffentlichtes Quartal). | neu (W4) | P1 (S) |
| N6 | **Jahreszahl mit Tausendertrennzeichen.** Der Tooltip in der Kopfleiste zeigt „as of 2,025“ (deutsch entsprechend „Stand 2.025“), weil das Jahr als Zahl durch die ICU-Formatierung läuft. | `ui/vergleich.ts` `kurzVergleich` → `t("vgl.kurz", { jahr })`; im Browser beobachtet | Sichtbar in der Kopfleiste (Inflation, Lira). | neu (W4) | P2 (S) |
| N7 | **Zwei Fiskalkanäle laufen auseinander.** Ereignisse (Sparkurs −1, Sparpaket −1,5, Rating-Fahrplan `min(impuls, 0)`, Kabinett −0,6) schreiben direkt in `fiscalImpulse`. Die Regler-Stufen bleiben dabei stehen. | `sim/ereignisse.ts:326, 920, 929`; `sim/ereignisse-aussen.ts:174`; `sim/kabinett.ts:279, 316` | Messung (`posten2.txt`): Regler +0,5 % des BIP, wirksamer Impuls nach einem Monat **−0,41**. Haushalt zeigt „Regler 0,5 / Impuls −0,4“ ohne Erklärung. Der Rating-Fahrplan löscht einen positiven Regler-Impuls stillschweigend. | offen (auch alt) | P1 |
| F15 | **Bilanz mischt veröffentlicht und wahr.** Inflation veröffentlicht, Arbeitslosigkeit und Wachstum wahr. | `sim/bilanz.ts:223-225` | — | offen | P2 (S) |
| F16 | **Verlauf ist auf 120 Monate begrenzt, die Historie nicht.** | `sim/wirtschaft.ts:14, 148` | Ab dem 11. Jahr laufen die Zeitachsen auseinander. | offen | P2 |
| F18 | **Kalender-Lücke unerklärt.** Daten vom 25.09.2026 starten am 05.06.2028. | Szenario-JSON | — | offen | P2 |
| F19 | **Indexwerte ohne Einheit in der Kennzahlenliste.** | `ui/wirtschaft/Lage.tsx:118` | „Reallöhne 44,2“ steht neben „31,5 %“. | offen | P2 (S) |

### 0.3 Regler und Systeme ohne oder mit unerwarteter Wirkung

- **Güterbilanz ohne Rückkopplung.** Die neue Güterbilanz (16 Warengruppen mit Partnern, `sim/gueter.ts`, `data/gueter.ts`) koppelt sich ausdrücklich nicht an das Makromodell („Das Makromodell bleibt unangetastet“, `sim/gueter.ts:4`). Einfuhr- und Ausfuhrmengen gehen nicht in Leistungsbilanz oder Reserven ein. Das ist eine parallele Welt neben F1 und F6.
- **Reifung der Haushaltsregler.** Ausgaben-Erhöhungen reifen langsam: Bildung erreicht nach 18 Monaten 0,38 von 1 Stufe, Investitionen 1,73 von 2. Kürzungen und Steuererhöhungen wirken sofort voll (`sim/haushalt.ts:396-404`). Das ist plausibel gewollt, wird aber im Regler nicht als „wirksam: x von y“ angezeigt. Ein Spieler sieht keine Wirkung und hält den Regler für tot.
- **Index-Deckel.** Nach F13 sind Reformmaßnahmen ab Jahr 3 wirkungslos.

---

## 1. Bestandsaufnahme des Wirtschaftsmodells (W4)

### 1.1 Architektur und Zeitauflösung

| Schicht | Datei | Größen | Takt |
|---|---|---|---|
| Makrokern Z1–Z9 | `sim/economy.ts` | Leitzins, Inflation, Erwartung, Ziel, Glaubwürdigkeit, Auslastung, Potenzial, Wachstum, Arbeitslosenquote, USD/EUR, CDS, Schuldenquote, Defizit, Impuls | Markt täglich, Realwirtschaft monatlich (`sim/world.ts`) |
| **Neu: Märkte und Kopplung** | `sim/maerkte.ts:216-260` | `sektorIndex` (6 Branchen), `konjunkturSaldo`, `arbeitsmarktShift`, `energieFaktor`, `institutionenRisiko`, `politikRisiko`, **Rating mit Ausblick** | monatlich |
| Zentralbank | `sim/zentralbank.ts` | Taylor-Regel, Haltungen, Druck, Stufen A/B/C | alle 45 Tage |
| Haushalt (neu: **17 Ressort-Posten**, Reifung, Demografie, Forschung bis Innovationsgrenze) | `sim/haushalt.ts:107-141, 393-425`; `data/haushaltsplan.ts` | Stufen in % des BIP, wirksame Stufe, Zinsdienst | monatlich |
| Devisen | `sim/devisen.ts` | Leistungsbilanz in % des BIP, Brutto-/Netto-Reserven, Intervention, IWF | monatlich |
| **Neu: Weltmodell** | `sim/welt-modell.ts` (1.204 Z.), `data/welt-daten.ts` | 41 Staaten mit Wachstum, Inflation, Schulden, Saldo, Rüstung, Stabilität, Wahlen; Handels- und Spannungswerte je Paar | monatlich |
| **Neu: Güterbilanz** | `sim/gueter.ts`, `data/gueter.ts` | 16 Warengruppen: Produktion, Verbrauch, Lager, Lieferanten, Kunden | monatlich, ohne Makro-Kopplung |
| Politiknetz | `sim/netz.ts`, `data/politiknetz.ts` (1.790 Z.) | Indizes 0–100 × 81 Provinzen, Rücklauf zur Ruhelage | monatlich |
| Statistik | `sim/world.ts` (`publish*`) | Inflation am 3., Arbeitslosigkeit am 10. (Lag 2 Monate), Wachstum quartalsweise | Veröffentlichungstakt |

### 1.2 Kalibriert vs. Platzhalter

| Bereich | Status | Beleg |
|---|---|---|
| Makrokern | Kalibriert an den Lernfällen 2019, 2021 und 2023 (Richtung und Größenordnung) | `kalibrierung/KALIBRIERUNG_LOG.md` §2/§6 (alter Stand) |
| Wachstum | Ausdrücklich keine Kerngröße der Kalibrierung, Kreditkanal fehlt | ebd. §6.7 |
| Neue W4-Parameter | Spielparameter ohne Lernfall-Prüfung: `sektorAufAuslastung` 0,012, `stabilisatoren` 0,3, `steuerbasisAufHaushalt` 0,03, `sektorAufLb` 0,02 | `sim/economy.ts:83-89`, `sim/devisen.ts:43-44` |
| `potentialGrowth = 4` | Platzhalter | Szenario-JSON |
| Weltmodell | Startwerte aus `vergleich.json` und den Dossiers; die Dynamik besteht aus Spielparametern | `data/welt-daten.ts:1-10` |
| Güterbilanz | Größenordnungen 2023–25, teils „zu prüfen“ markiert | `data/gueter.ts:1-6` |
| Daten ohne Mechanik | `coreInflation`, `enagInflation`, `energyImportsUsdBn2026`, `minimumWageNetTry`, `oilBrentUsd` | `sim/types.ts` |

### 1.3 Was strukturell fehlt (W4)

| Element | Stand in W4 |
|---|---|
| **BIP-Niveau, BIP/Kopf, nominales BIP** | Fehlt. Nur Rate und Auslastung; `bipTryTn` ist eingefroren (F1). |
| Bevölkerung und Erwerbspersonen als Größe | Fehlt. Es gibt einen Demografie-Faktor für Renten (`sim/haushalt.ts:416-420`), aber keine Erwerbsbevölkerung. |
| Sektoren | 6 Branchenindizes als Mittelwert `sektorIndex`. Ohne Wertschöpfung, Anteile oder Beschäftigung je Sektor. |
| Außenhandel nach Partnern und Gütern | **Teilweise neu**: Güterbilanz mit Lieferanten und Kunden in Mengen, Handelswerte je Länderpaar im Weltmodell. Ohne Dollarwerte und ohne Leistungsbilanz-Kopplung. |
| Energieimporte in USD | Nur Öl-Index × `energieFaktor`. Der belegte Wert von 71 Mrd. USD bleibt ungenutzt. |
| Investitionen und FDI | Indizes. `auslandskapital` wirkt auf die Reserven, nicht auf einen Kapitalstock. |
| Löhne und Verteilung | Kein Nominallohn (F11). Der Mindestlohn ist Index, der Datenwert in Lira bleibt ungenutzt. |
| Wohnungsmarkt | Indizes `mieten` und `wohnungsbau`, keine Preise |
| Unternehmen und Staatsunternehmen | Nur `m_privatisierung`, Subventionslast als Index |
| Banken und Kredit | Index `kredite`; Kreditkanal in Z1 fehlt |
| Steuerarten | 3 Steuer-Regler. **Neu:** Steuerbasis wirkt auf den Saldo. Elastizitäten je Steuerart fehlen. |
| Rentenkasse | **Neu:** Ressorts `rentenniveau`/`rentenalter` mit Demografie. Keine Beitragszahler-/Rentner-Rechnung. |
| Regionalwirtschaft | Statisch (F17) |
| Rating | **Neu in W4** (`sim/maerkte.ts:108-180`) |

---

## 2. Statistik im Spiel (W4)

### 2.1 Was der Spieler sieht

**Wirtschaftsakte, Reiter „Lage“** (`ui/wirtschaft/Lage.tsx`, im Kern unverändert): 22 Kennzahlen in 4 Gruppen (`sim/wirtschaft-kennzahlen.ts`).

| Funktion | Beschreibung |
|---|---|
| Liste | Sparkline je Kennzahl (24 Werte) |
| Detailansicht | Diagramm ab 12 Monate vor Amtsantritt, mit Zielen, Marken (Zins, Haushalt, Eingriff, Ereignis), Prognoseband und Was-wäre-wenn |
| Chips | „seit Amtsantritt“ und „zum Vorjahr“ |
| Treiber | „Was bewegt diese Zahl?“ als Momentaufnahme; in W4 teils unvollständig (N1, N2) |
| Vergleich | Weltbank-Balken (statisch, F2/F3) |

**Neu in W4:**

- Kernwert-Kacheln der Akte (`ui/wirtschaft/Akte.tsx:49-56`, N4)
- Kopfleiste mit Vergleichs-Tooltips (N6)
- Länderlage mit laufenden Werten und Verlauf (`ui/welt/WeltLage.tsx`)
- Rating-Sicht
- Güter-Inventar (`ui/gueter/Inventar.tsx`)

Die Oberfläche startet im Testbrowser auf Englisch. Einzelne Ereignistitel sind noch deutsch, etwa „Der erste Haushaltsentwurf“ oder „Die DEM Parti erwartet …“. Das liegt außerhalb dieses Themas, ist aber beobachtet.

### 2.2 Versteht man nach 4 Jahren, warum sich etwas entwickelt hat?

Nur teilweise, in W4 schlechter als vorher.

- **Treiberlisten unvollständig.** Die Zerlegung ist eine Momentaufnahme, und sie lässt in W4 gerade die neuen Kanäle weg: Branchen und Energiefaktor beim Wachstum, Konjunktursaldo beim Defizit (N1, N2). Die Zeilen ergeben nicht mehr die Summe.
- **Keine kumulierte Zerlegung.** Ein Satz wie „seit Amtsantritt −24 Pp Inflation, davon …“ ist nicht möglich.
- **Statistik-Meldungen ohne Begründung.** Die Meldungen im Protokoll haben kein `why`; im alten Stand waren es 110 in 48 Monaten.
- **Regler-Reifung und Fiskalkanäle unsichtbar.** Ein Spieler sieht den Unterschied zwischen beschlossener und wirksamer Stufe nicht, ebenso wenig den Konflikt zwischen Ereignis-Impuls und Regler (N7).
- **Kein BIP-Niveau.** Ob das Land reicher geworden ist, ist nirgends ablesbar. Es gibt weder BIP/Kopf in Dollar noch einen Weltrang der Türkei.

### 2.3 Lücken gegenüber TÜİK, Victoria 3 und Democracy 4

| Funktion | Spiel (W4) |
|---|---|
| BIP nach Verwendung und Entstehung | fehlt |
| Mehrere Reihen überlagert, Zoom, Zeitraum | fehlt (eine Reihe, fester Zeitraum) |
| Aufschlüsselung (TÜFE-Gruppen, Steuern und Ausgaben im Ist) | fehlt (Plan 2026 und Ressorts nur als Regler) |
| Provinzvergleich und Rangliste für Wirtschaftsgrößen | fehlt; die Karte zeigt statische Werte (F17) |
| Weltrangliste mit Verlauf | fehlt; der Rang ist statisch (F3), obwohl das Weltmodell laufende Werte hätte |
| Tabellen- oder CSV-Export | fehlt |
| Ereignisanker im Verlauf | vorhanden (Stärke) |
| Verlaufszerlegung über Zeit | fehlt |

---

## 3. Ländervergleich (W4)

- **`data/vergleich.json`:** unverändert. Weltbank WDI/WGI, abgerufen am 29.09.2026, 30 Länder, 40 Indikatoren, jeweils mit Rang und Median.
- **Verwendung:** Lage-Balken (`ui/wirtschaft/Lage.tsx`), Erklärungs-Popover, Kopfleisten-Tooltips (`kurzVergleich`), Länderüberblick (`ui/Welt.tsx:435, 493`). **Neu:** Startwerte des Weltmodells (`data/welt-daten.ts`).
- **Andere Länder bewegen sich jetzt.** Das ist neu in W4: 41 Staaten haben laufende Werte für Wachstum, Inflation, Schulden, Saldo und Rüstung, mit Verlauf (`sim/welt-modell.ts:73-103`). Gemessen über 48 Monate (`welt.txt`): Deutschland Wachstum 0,2 → 2,7 %, Indonesien 5,1 → 6,8 %, Russland 1,0 → −4,2 %. Einige Pfade sind unplausibel (N5).
- **Der Vergleich nutzt das nicht.** Rang, Balken und die Türkei-Spalte bleiben auf dem Weltbank-Foto von 2025 (F2, F3, N3). Mexiko fehlt im Weltmodell, obwohl es im Vergleich steht. Ein BIP-Niveau gibt es weder für die Türkei noch für andere Länder, also auch keinen G20-Rang.

### Was ein Vergleich enthalten müsste

| Kennzahl | Quelle (nur benannt) |
|---|---|
| BIP gesamt und BIP/Kopf in USD und KKP | IWF WEO |
| Inflation, Arbeitslosigkeit, Schuld (gesamter Staat), Defizit, Leistungsbilanz, Reserven in Importmonaten | IWF WEO, Weltbank |
| Leitzins | BIZ |
| HDI | UNDP |
| Korruptionsindex | Transparency International (CPI) oder WGI-CC |
| Militärausgaben | SIPRI |
| Rating/CDS | Ratingagenturen |
| Rang in der G20 | aus BIP |

### Wie man ihn zeigt

1. **Rangliste „Die Türkei in der Welt“:** Spielwert gegen die *laufenden* Weltmodell-Werte, mit Pfeil seit Amtsantritt.
2. **Verlauf „Türkei vs. Polen / Mexiko / Indonesien / Griechenland“:** vier Linien. Das Weltmodell liefert die Reihen schon (`verlauf`).
3. **Kleine Multiples:** 5–6 Kennzahlen nebeneinander.
4. **G20-Rangtreppe** über die Amtszeit.
5. **Satz in der Bilanz:** „Von Platz X auf Platz Y“.

Voraussetzung ist F1, also ein nominales BIP mit Wechselkurs.

---

## 4. Wirtschaftliche Entwicklung über eine Amtszeit (Messung W4, alter Stand in Klammern)

### Strategien

| Partie | Was der Bot tut |
|---|---|
| passiv | nichts |
| reform | Monat 1: Industriemodernisierung, Fachkräfte, Investitionsanreize, Exportförderung, Forschung, Breitband, Digitale Verwaltung, Ausbildung. Haushalt: Investitionen +2, Gesundheit +1, Bildung +1, Forschung +1, Subventionen −1, Verbrauchsteuern +1. Ereignisse mit Standardantwort. |
| populist | Mindestlohn 85, Renten 75, Energiesubventionen 80, Preiskontrollen 60, Baukredite 70. Haushalt: Rentenniveau +2, Sozialhilfe +1, Subventionen +2, Personal +1. Alle 2 Monate öffentlicher Zinsdruck. |

### Makrogrößen, Ende 05/2032

| Größe | passiv | reform | populist | passiv, Seed 99 |
|---|---|---|---|---|
| Inflation, % (Start 31,5) | **7,6** (7,5) | 9,9 (9,3) | **107** (103) | 9,5 |
| Wachstum, % | 4,5 | **9,4** | 6,6 | 4,8 |
| BIP-Realindex (Start 100) | 116,7 (116,5) | **121,3** (117,8) | 114,7 (115,5) | 118,4 |
| Potenzial, % | 4,15 | 6,0 (Deckel) | 3,7 | 4,1 |
| Arbeitslosenquote, % (Start 8,1) | 8,6 (9,0) | **7,4** (9,8) | 10,3 | 7,9 |
| USD/TRY | 74,4 | 73,2 | 683 | 72,9 |
| CDS, bp | 177 | 156 | 823 | 217 |
| Rating (Index: 4 = B, 0 = CCC+) | 5 | 5 | **0** | 5 |
| Schuldenquote, % (Start 23,8) | 22,5 | 22,3 | **19,2** (F10) | 20,4 |
| Defizit, % des BIP | 2,3 | 1,6 | 8,3 | 1,8 |
| Konjunktursaldo, % des BIP | −0,1 | +1,5 | −0,6 | +0,5 |
| Leistungsbilanz, % des BIP | −1,8 | −1,5 | **−0,9** (F5) | −2,5 |
| Netto-Reserven, Mrd. USD | 46,9 | 56,5 | −13,0 | 23,2 |
| BIP laut Spiel, Mrd. USD (F1) | 1.129 | 1.147 | **123** | 1.152 |
| BIP fortgeschrieben (eigene Rechnung) | 2.358 | 2.565 | 758 | 2.522 |

### Strukturindizes (Start → 24 → 48 Monate)

| Index | passiv | reform | populist |
|---|---|---|---|
| Produktivität | 50 → 50 → 54 | 50 → 61 → **100** | 50 → 50 → 43 |
| Industrie | 58 → 59 → 62 | → 66 → 87 | → 63 → 64 |
| Export | 58 → 58 → 50 | → 71 → 77 | → 69 → **84** |
| Investitionen | 45 → 49 → 58 | → 61 → 95 | → 38 → 6 |
| Mittelstand | 45 → 49 → 56 | → 47 → 45 | → 15 → **0** |
| Reallöhne | 44 → 53 → **65** | → 54 → 83 | → 60 → 35 |
| Steuereinnahmen | 50 → 52 → 56 | → 55 → 78 | → 44 → 37 |

### Befund

1. **Die Strategien unterscheiden sich in W4 stärker.** Reform +4,6 Indexpunkte BIP gegenüber passiv (alt +1,3), niedrigere Arbeitslosigkeit, Rating-Aufstieg, Konjunktursaldo +1,5 % des BIP. Die neuen Kopplungen (`sektorIndex`, Stabilisatoren) wirken.
2. **Das Spiel läuft aber weiter auf Gleichgewicht hinaus.** Nichtstun bringt Disinflation auf 7,6 %, Reallöhne +48 % und ein Rating-Upgrade (F11, F12).
3. **Die Hyperinflation bleibt realwirtschaftlich fast folgenlos.** Wachstum 6,6 %, Schuldenquote sinkend, beste Leistungsbilanz (F5, F9, F10). Die Strafe kommt nur über Kurs, CDS, Rating und Reserven.
4. **Modernisierung endet an Deckeln.** Produktivität 100 und Potenzial 6 % sind nach 3 Jahren erreicht (F13). Eine Sektorverschiebung, einen Kapitalstock oder eine Aufholbewegung beim BIP/Kopf gibt es nicht.
5. **Die Regionen bleiben eingefroren** (F17).

---

## 5. Katalog fehlender Elemente (W4)

Prio P0/P1/P2, Aufwand S (Tage), M (1–2 Wochen), L (größer). Datenquellen nur benannt.

| # | Element | Behebt | Prio | Aufwand | Quelle (nur benannt) |
|---|---|---|---|---|---|
| K0 | **Anzeige-Konsistenz:** Defizit-Treiber, Haushaltshinweis und `spielWert` mit `konjunkturSaldo` und `zinsMehrlast`; Wachstums- und Inflationstreiber mit Branchen und Energiefaktor; Kernwerte veröffentlicht statt wahr; Jahresformat | N1, N2, F2, N4, N6, F15, F19 | **P0** | S | — |
| K1 | **Nominales und reales BIP-Niveau** fortschreiben; `bipUsdMrd` darauf umstellen | F1 | **P0** | S | TÜİK Ulusal Hesaplar; IWF WEO |
| K3 | **Realer Wechselkurs** als Netz-Eingang statt nominaler Abwertung | F5 | **P0** | S | BIZ REER; TCMB TÜFE-bazlı REK |
| K2 | **Inflationskosten im Output** (Unsicherheit und Dollarisierung → Investitionen und Mittelstand → Auslastung und Potenzial) | F9 | **P0** | M | Lernfälle 2018/2021 (TÜİK, TCMB EVDS) |
| K4 | **Schuldendynamik** mit getrennten Beständen in TL und FX und realer Zinslast; gilt auch für das Weltmodell | F10, N5 | **P0** | M | Hazine Borç İstatistikleri; IWF Fiscal Monitor |
| K5 | **Disinflation nicht automatisch**: Glaubwürdigkeit an Handlungen koppeln, Ziel-Gleitpfad nur mit Programm, Lohn-Preis-Trägheit | F12 | **P0** | M | TCMB Inflationsberichte; OVP-Pfad (im Szenario) |
| K6 | **Dynamischer Vergleich auf Basis des Weltmodells**: Rang aus Spielwert und laufenden Länderwerten, Türkei-Spalte = Spielwert, statische Tabelle nur noch als „Stand 2025“ | F3, N3 | **P0** | M | IWF WEO; Weltbank WDI |
| K7 | **Statistikamt-Ansicht**: Tabelle aller Reihen, mehrere Linien, Zeitraum, CSV-Export, Peer-Diagramm | — | P1 | M | — |
| K8 | **Verlaufszerlegung** (kumulierte Treiberbeiträge seit Amtsantritt) | — | P1 | M | — |
| K9 | **Fiskalkanäle vereinen**: Ereignisse wirken über Regler-Stufen oder als benannte Zeile; Anzeige „wirksam x von y“ für die Reifung | N7 | P1 | S–M | — |
| K10 | **Branchen mit Wertschöpfung**: Anteile, Wachstum und Beschäftigung je Sektor, Summe = BIP; `sektorIndex` als Übergang | F13 | P1 | L | TÜİK GSYH nach Wirtschaftszweigen, SÜİ, Erwerbstätige nach Sektor |
| K11 | **Güterbilanz an Leistungsbilanz und Reserven koppeln** (Mengen × Preis in USD; Energie nach Lieferant) | 0.3 | P1 | M | TÜİK Dış Ticaret; UN Comtrade; EPDK; BOTAŞ |
| K12 | **Nominallohn und Mindestlohn in Lira**, Reallohn = Lohn/Preis | F11 | P1 | M | Resmî Gazete; TÜİK Kazanç İstatistikleri |
| K13 | **Regionalwirtschaft dynamisch** (BIP/Kopf je Provinz, Konvergenz, Rangliste) | F17 | P1 | M | TÜİK İl bazında GSYH |
| K14 | **Deckel entschärfen** (Sättigung statt harter 100 bzw. ±2) | F13 | P1 | S | — |
| K15 | **Weltmodell kalibrieren**: Trendpfade, Inflationsuntergrenzen, Schulden-Logik, Mexiko ergänzen | N5 | P1 | M | IWF WEO (Projektion 5 Jahre) |
| K16 | Banken und Kreditkanal in Z1 | — | P2 | L | BDDK; TCMB Finanzstabilitätsbericht |
| K17 | Staatsunternehmen und quasi-fiskalisches Defizit (BOTAŞ, TVF) | — | P2 | M | Hazine KİT-Berichte; Sayıştay |
| K18 | Rentenkasse mit Beitragszahlern und Rentnern | — | P2 | M | SGK İstatistik Yıllıkları |
| K19 | Wohnungsmarkt in Preisen | — | P2 | M | TCMB KFE; TÜİK Bauhaus-Statistik |
| K20 | Historie und Reihen-Kappung angleichen; Kalender-Hinweis | F16, F18 | P2 | S | — |

### Reihenfolge

1. K0 + K1 + K3 (Rechen- und Anzeigefehler, jeweils S)
2. K2 + K4 + K5 (Spielweise)
3. K6 + K7 + K8 + K9 (Statistik und Vergleich sichtbar)
4. K10 / K11 / K13 (Struktur)

---

## 6. Methode

- **Bots:** wie in Abschnitt 4. Das Parlament ist voll im Lager, damit Mehrheiten nicht stören.
- **Eigene BIP-Fortschreibung:** real ×(1 + g/100)^(1/12), nominal ×(1 + (g + π)/100)^(1/12) je Monat aus den Spielwerten. Das ist eine Analysegröße, kein Spielwert.
- **Haushaltsregler (`posten2.txt`):** 18 Monate mit Reformhaushalt. Die Reifung der wirksamen Stufen und der Abstand zwischen Regler und Impuls sind protokolliert.
- **Weltmodell (`welt.txt`):** 11 Staaten, Start und nach 48 Monaten, gegen `vergleich.json`.
- **Oberfläche:** Kopfleisten-Text und Tooltips aus dem W4-Server. Die Wirtschaftsakte ließ sich headless wegen der WebGL-Karte nur über den Quelltext prüfen. Die Lage-Komponente ist gegenüber dem alten Stand im Kern unverändert; dort waren Texte und Vergleichsbalken per Playwright geprüft.
