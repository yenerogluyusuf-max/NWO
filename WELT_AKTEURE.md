# WELT_AKTEURE.md — Das Weltmodell: 41 Staaten, Blöcke, Wahlen, Dienst

Stand 04.10.2026. Code: `game/src/sim/welt-*.ts`, Daten: `game/src/data/welt-*.ts`, Anzeige: `game/src/ui/Welt.tsx`, `game/src/ui/welt/{WeltLage,Dienst,Block}.tsx`.
Tests: `game/test/welt-modell.test.ts` (34 Tests). Regel des Projekts: Quelle oder Lücke. Spielparameter sind im Code und hier ausdrücklich so genannt.

## 1. Was neu ist

Bisher kannte jedes der 18 Länder nur vier Beziehungswerte zur Türkei (`sim/laender.ts`). Die Welt stand still, bis der Spieler sie berührte. Jetzt
hat jeder der 41 Akteure einen **Eigenzustand** (Wachstum, Inflation, Schulden, Defizit, Rüstung, Stabilität, Rückhalt der Führung, Bedrohung,
Kriegsbelastung, Regierungsform, Wahltermin), zwischen je zwei Staaten steht ein **Paar** (Bündnis, Handel, Spannung), und die Staaten **handeln** nach
ihren Zielen. Zustand liegt in `spiel.weltmodell` (ein JSON-Objekt, rund 55 KB nach zehn Jahren; alte Spielstände legen es beim ersten Zugriff an).

- **18 Hauptakteure** (`sim/laender.ts`, unverändert): Verhandlungstisch, Verträge, Anliegen.
- **23 weitere Staaten** (`data/welt-weitere.ts`): Deutschland, Frankreich, Italien, Spanien, Polen, Niederlande, Bulgarien, Ungarn, Rumänien, Österreich, Schweden
  (mit Griechenland und Zypern die 13 EU-Staaten im Rat), Brasilien, Indien, Südafrika, Äthiopien, Emirate, Indonesien (BRICS), Katar, Vereinigtes Königreich, Pakistan,
  Usbekistan, Kirgisistan, Turkmenistan. Eigene Beziehung zur Türkei, Gesten, Lage, Wahlen, Platz in den Blöcken. Kein Verhandlungstisch.
- **Blöcke** (`data/welt-institutionen.ts`): EU, NATO, BRICS, SOZ, Turkstaaten, G20, Golfstaaten, Mekka-Pakt; Mitglieder, Beschlussregel, Stand der Türkei.
  BRICS: Partnerland werden (Kosten, Süden gewinnt, Westen verliert). Turkstaaten: Gipfel ausrichten.
- **EU-Rat** (`sim/welt-bloecke.ts`): Positionen der 13 Staaten je Thema; `sim/eu.ts` fragt über einen additiven Haken vor jeder Kapitel-Eröffnung nach (Einstimmigkeit).
- **Wahlen mit Lagern**: Herausforderer entsteht fünf Monate vor der Wahl (Haltung zur Türkei, Stärke); Ausgang aus Rückhalt, Stärke und Einfluss von außen.
- **Dienst (MİT)** (`sim/welt-dienst.ts`): fünf verdeckte Operationen, knappe Kapazität, Aufdeckung mit Folgen; Gegenoperationen anderer Staaten; Bericht.
- **Rückwirkung auf die Türkei**: Nachfrage der Abnehmer (Export), Unruhe in der Nachbarschaft (Terrorgefahr, Tourismus), große Ereignisse als Entscheidungen
  (`welt_machtwechsel`, `welt_krise`, `welt_einfluss` in `sim/welt-ereignisse.ts`).

## 2. Schnittstellen

- `weltNachrichten(world, seitTag, max)` (`sim/welt-modell.ts`): Meldungen mit Zahlen, wichtige zuerst, `{ id, land, titel, fakt, wertung, tag }`. Wertungen sind klein (±0,4).
  Aufgedeckte Operationen erscheinen als öffentliche Meldung („Spionagevorwürfe gegen die Türkei“); unentdeckte nie.
- `lage(world, id)`, `eigenVon`, `paarVon`, `beziehungZurTuerkei`, `wahlSicht` (`sim/welt-sicht.ts`) für die Oberfläche.
- Haken (kein Direktimport, wegen Ladezyklen): `setzeWeltHaken` (laender.ts → Monatsschritt), `setzeEreignisHaken`, `setzeDienstHaken`, `setzeRatPruefung` (eu.ts).
- Die Vermittlung bleibt die Wahrheit der Drittkonflikte: Die Spannung der Paare Ukraine–Russland, Israel–Iran, Armenien–Aserbaidschan folgt ihrem Konflikt-Index.

## 3. Herkunft der Zahlen

| Größe | Herkunft |
|---|---|
| Startwerte Wachstum, Inflation, Rüstung (15 Staaten) | Weltbank-Datensatz des Spiels (`data/vergleich.json`, abgerufen 29.09.2026), nur wenn der Wert jung genug ist (Ströme ab 2022/23) |
| Startwerte Libyen, Kasachstan, Zypern, Syrien (Wachstum) | Dossiers 15, 16, 17, 6 (`RECHERCHE_REALWELT_LAENDERDOSSIERS.md`) |
| Staatsschulden | Weltbank, wenn ab 2018; sonst **Spielparameter** (Größenordnung IWF, nicht neu geprüft): Griechenland, Iran, Saudi-Arabien, China, Israel, Ägypten, Aserbaidschan, Deutschland/EU, Frankreich, Italien, Polen, Bulgarien, Rumänien, Indonesien u. a. |
| Startwerte der weiteren Staaten ohne Weltbank-Wert | **Spielparameter** (Niederlande, Österreich, Schweden, Äthiopien, Emirate, Katar, Pakistan, Usbekistan, Kirgisistan, Turkmenistan) |
| Beziehung weiterer Staaten zur Türkei (Handel, Sicherheit, Vertrauen, Konflikt) | **Spielparameter**, qualitativ (hoch/mittel/niedrig) nach den Dossiers und breit bekannten Tatsachen |
| Trend der Wirtschaft | zur Hälfte der Startwert, zur Hälfte der Median des Datensatzes (Rückkehr zur Mitte der Welt) |
| Streuung (Wachstum 1,5 / 2,8 / 4,5 Punkte, Inflation 1,2 / 3,5 / 8 je Klasse) | **Spielparameter**: Der Datensatz enthält nur den letzten Wert je Land |
| Grundstabilität | Weltbank „Wirksamkeit der Regierung“ (WGI); fragile Staaten höchstens −0,5 (Datenbefund Syrien) |
| Wahltermine | Amtszeiten nach Verfassungslage (öffentlich bekannt), Tag auf Wochen genau = **Spielparameter**; nach dem letzten belegten Termin Zyklus der Regierungsform |
| Anfangslage der Paare | bekannte Paare aus Teil IV des Dossiers, sonst Lagerregel (**Spielparameter**) |
| Dynamik (Rückkehr, Mitnahme, Energiepreis, Chancen, Wechselraten) | **Spielparameter** (`WELT_REGELN`), kalibriert an der Größenordnung, nicht an Messreihen |
| Operationen (Chancen, Kosten, Dauer, Aufdeckung, Folgen) | **Spielparameter**; historische Fälle nur als Orientierung für „selten sauber, oft Spätfolgen“ |

## 4. Offen

- Neue Zwischenkriege zwischen Drittstaaten entstehen im Modell nur als Grenzkrise/Spannung; ein persistenter Krieg bleibt dem Kriegsmodul (`sim/krieg.ts`) vorbehalten.
- Die 14 übrigen EU-Mitglieder folgen den 13 Akteuren (Vereinfachung); die qualifizierte Mehrheit zählt Staaten, nicht Bevölkerung.
- Der Rat blockiert Kapitel nur bei extremer Haltung; ein Handelsmandat (Zollunion-Update) fragt `sim/eu.ts` noch nicht beim Rat ab.
- Die Zeitung hängt `weltNachrichten` in die Rubrik „Ausland“ noch nicht selbst ein.
- Kein Verhandlungstisch mit den 23 weiteren Staaten (nur Gesten); `PROFILE` in `data/abkommen.ts` kennt nur die 18 Hauptakteure.
