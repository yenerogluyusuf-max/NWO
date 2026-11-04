# Gesamtprüfung: Ergibt das Spiel Sinn? (4. November 2026)

Auftrag des Projektinhabers: prüfen, ob alles im richtigen Bereich steht, ob der Spieler findet, wo was ist, ob Krieg, Sanktionen sowie außen- und innenpolitische Konflikte funktionieren, wie man sie löst, ob das Sinn ergibt und ob es zeitgemäß ist.

Vorgehen: vier getrennte Prüfungen. Jede hat die Abläufe mit temporären Skripten **durchgespielt** (Seeds 3 und 6, Schnellprofil, Spielbeginn 05.06.2028), nicht nur Code gelesen. Belege stehen bei jedem Befund: „verifiziert“ heißt durchgespielt, „Code“ heißt nur gelesen. Die temporären Skripte sind gelöscht.

## 1. Kurzurteil

| Bereich | Urteil | Kern |
|---|---|---|
| Krieg | durchspielbar, aber nicht glaubwürdig | Türkei mit NATO verliert gegen Iran; jeder Krieg beginnt ohne Treibstoff; Waffenruhe endet nie; kein eigener Einstieg |
| Sanktionen | Mechanik da, Wirkung fast null | Lira, Risikoaufschlag und Reserven reagieren kaum; Sanktion gegen Russland *verbessert* die Reserven; CAATSA-Klausel hebt CAATSA nicht auf |
| Außenpolitische Konflikte | funktionieren | Druck, Entspannen, Gipfel, Verhandlungstisch, Vermittlung erreichbar; Vermittlung Ukraine–Russland gelingt, ohne wirtschaftliche Folge |
| Innenpolitische Konflikte | Gerüst trägt | Jeder Konflikt hat Auslöser, Antworten mit Preis und Folgen; aber Warnungen fehlen, Putsch unerreichbar, Preise zu billig |
| Auffindbarkeit | ordentlich, mit drei Fehlplatzierungen | Politik nach Bereichen versteckt im Schreibtisch; Krieg unter Außen statt Sicherheit; neunmal dieselbe Vorgangsliste unter vier Namen |
| Zeitgemäß | gut zum Stichtag 25.09.2026 | Iran-Krieg, Hormus, CAATSA-Wende, CHP-Spaltung, PKK-Gesetz, Fondskrise eingebaut; F-35-Gespräche und US-Bankensanktionen fehlen |

## 2. Krieg

Ablauf heute: Konfliktwert ≥ 73 erzeugt Spannung (krieg.ts:1143), ab 78 Drohkulisse, ab 95 greift der Gegner an. Der Spieler kann nur über „Druck“ eskalieren (laender.ts:518); Kriegsziel, Mobilmachung, Beschluss und Frieden liegen unter Außen → Land → Konflikt. Eine Frontzahl 0–100 bewegt sich wöchentlich, zwei Erschöpfungsuhren laufen; Friedenspakete gelten ab 50 % Annahme.

| Schwere | Befund | Beleg |
|---|---|---|
| hoch | **Kräfteverhältnis falsch:** Türkei allein etwa 40, Griechenland 52, Iran 58; mit USA und NATO verliert die Türkei gegen Iran in 14 Wochen (Front 35 → 0) | pakte.ts:67, krieg.ts:289, verifiziert |
| hoch | **Versorgungsloch:** Jede Front startet mit Treibstoff 0, Kampfkraft 25 %; 15–20 Punkte Rückstand ab Tag 1 | versorgung.ts:85, krieg.ts:785, verifiziert |
| hoch | **Waffenruhe ohne Ende:** keine Frist, kein Gegenangebot; man kann kostenlos „parken“ | krieg.ts:1083, verifiziert über 18 Monate |
| hoch | **Kein eigener Einstieg:** kein Ultimatum, keine Kriegserklärung; ohne Spieler bewegen sich Konflikte nicht | verifiziert (24 Monate ohne Konflikt) |
| mittel | Rahmung „Verteidigung“ auch für Angriffe nutzbar (+30 Stimmen) | krieg.ts:570, verifiziert |
| mittel | Wirtschaft kaum betroffen; im Iran-Krieg steigt das Wachstum, das Kapital wächst im Krieg | ereignis-hilfen.ts:123, verifiziert |
| mittel | Gegnerkoalition unplausibel (neutrales Österreich, „EU“ als Kriegspartei) | verifiziert |
| mittel | HOI4-Anspruch (Verbände, Generäle, Delegation) nicht erfüllt | krieg.ts:4, Code |

## 3. Sanktionen und Außenpolitik

Heute: Gegen die Türkei gibt es CAATSA (USA) und EU-Handelsmaßnahmen, ausgelöst durch hohen Konflikt oder Angriff auf Griechenland/Zypern; Aufhebung nach 6 Monaten Entspannung. Die Türkei hat ein Instrument „Sanktion“ (Handel −15, Konflikt +10).

| Schwere | Befund | Beleg |
|---|---|---|
| hoch | Sanktionen gegen die Türkei bewegen Lira (61,72 gegen 61,84), Risikoaufschlag und Reserven kaum | verifiziert, 12 Monate |
| hoch | Türkei sanktioniert Russland: Gas- und Ölmangel, aber Reserven 33,0 statt 16,1 Mrd. $ | verifiziert |
| hoch | Abkommensklausel „CAATSA aufheben“ hebt die Sanktion nicht auf und ist auch ohne Sanktion verhandelbar | data/abkommen.ts:309, verifiziert |
| mittel | Türkische Sanktionen ohne Forderung, Nachgeben oder Gegensanktion | verifiziert |
| mittel | EU-Maßnahmen laufen ohne Zutun nach 179 Tagen aus; Vertrauen steigt trotz Sanktion | verifiziert |
| niedrig | Israel-Sperre schneidet den Güterfluss nicht ab; Klausel Zahlungsweg nennt Sekundärsanktionen, löst keine aus | Code/teils verifiziert |

Unauffindbar: Sanktionen stecken unter Außen → Modus „Außenlage“ → Instrumente; nirgends steht, wie man eine Sanktion loswird (Bedingung, Zähler).

## 4. Innenpolitik

Elf Konflikte nachverfolgt, sieben durchgespielt. Proteste, Streiks, Koalition, Justiz, Medien, Korruption, Terror und Inflation funktionieren mit Antworten und Preisen.

| Schwere | Befund | Beleg |
|---|---|---|
| hoch | Schreibtisch warnt nicht vor Massenbewegungen, Putschrisiko, Opposition oder Groll der Milieus | ui/schreibtisch/briefing.ts:341, verifiziert |
| hoch | Hinweisfenster haben nur „Verstanden“, keinen Sprung zum Lösungsweg | Stage.tsx:1254, Code |
| mittel | Putsch praktisch unerreichbar (Schwelle 75, illoyale Generäle treten selbst zurück) | enden.ts:32, spiel.ts:454, verifiziert |
| mittel | Preise beißen nicht: Koalitionsrettung 1 PK bei 68 Bestand; Antwort auf Protest ändert die Zustimmung nicht | verifiziert |
| mittel | Abgeordnete laufen nie von selbst über | verhandeln.ts:277, Code |
| niedrig | „Zugeständnis“ an eine Bewegung ändert keine echte Maßnahme | bewegungen.ts:288, Code |

## 5. Auffindbarkeit

| Problem | Vorschlag |
|---|---|
| „Probleme im Land“ (Politik nach Bereichen, laut T2 der Hauptweg zu jeder Maßnahme) ist der dritte Reiter im Schreibtisch | eigene Gruppe „Politik“ (Bereiche, Vorschläge, Programme, Umsetzung) |
| Krieg liegt unter Außen → Land → Konflikt; Sicherheit zeigt Konflikte nur an | Zugang „Konflikte“ in Sicherheit |
| Dieselbe ungefilterte Vorgangsliste in allen neun Bereichen unter vier Namen; dazu vier weitere Dinge namens „Vorhaben“ | eine Liste am Schreibtisch, in den Bereichen gefiltert; Begriffe eindeutig |
| Streitkräfte und „Rüstung und Beschaffung“ doppeln sich, ebenso Netze und Infrastruktur | zusammenlegen |
| „Verwaltung“ unter Wirtschaft, Medienpolitik unter der Zeitung, Gespräch unter Exekutive | in Exekutive; eigener Zugang; dauerhaft in der Kopfleiste |
| Vier Namen für das politische Kapital; „Legislative/Exekutive Arbeit“, „Einordnung“, „Agenda“ uneinheitlich; „Dein“ neben „Sie“ | ein Name je Begriff (siehe Bericht) |
| 17 Zweckzeilen werden in Bereichsakten nie gezeigt | anzeigen |
| Handlungen ohne Zugang: Kurswechsel der Partei, Vorlage vertagen; freie Großprojekte nur über das Gespräch | Knöpfe ergänzen, Hinweis im Bau-Reiter |

## 6. Zeitgemäß

Zum Stichtag eingebaut: Iran-Krieg seit 02/2026 mit Waffenruhe (Islamabad-Memorandum), geschlossene Straße von Hormus, CAATSA-Wende 07/2026, CHP-Spaltung und YENİ Parti, PKK-Gesetz vom 10.8.2026, Fondskrise, Syrien nach 2024.

Fehlt oder widersprüchlich (Stand 04.11.2026, Websuche): F-35-Gespräche ohne Einigung, Forderung nach CAATSA-Aufhebung am 15.10.2026 ([Turkish Minute](https://www.turkishminute.com/2026/10/15/turkey-urges-us-to-lift-sanctions-as-f-35-talks-continue/)); US-Sanktionen gegen eine Istanbuler Bank wegen Iran-Geldern im September 2026 ([CRS](https://www.congress.gov/crs-product/R44000)); Startzustand CAATSA im Spiel widerspricht der eigenen Recherche (RECHERCHE_REALWELT_LAENDERDOSSIERS.md:31); Sekundärsanktionen wegen Russland-Umgehungshandel; Drohnen- und Raketenabwehr; nichtstaatliche Gegner.

## 7. Reihenfolge zum Beheben (Vorschlag)

1. **Krieg glaubwürdig machen:** Kräfte aus belegten Beständen kalibrieren (mit Test: Türkei + NATO hält gegen Iran), Versorgung ab Tag 1, Waffenruhe mit Frist und Gegenangebot, eigener Einstieg „Ultimatum/Krise eröffnen“.
2. **Sanktionen mit Wirkung:** Kopplung an Risikoaufschlag, Kapitalflucht, Lira und Preise; Energieausfall treibt Preise; CAATSA-Klausel wirkt; Sanktionen der Türkei mit Forderung und Gegenreaktion; Anzeige „wie werde ich sie los“.
3. **Warnen und hinführen:** Schreibtisch-Warnungen für Bewegungen, Putschstufe, Opposition, Groll; Hinweisfenster mit „Zur Akte“.
4. **Ordnung:** Gruppe „Politik“, Konflikte in Sicherheit, eine Vorgangsliste, eindeutige Namen, Zweckzeilen.
5. **Preise schärfen und Putsch erreichbar machen.**
6. Danach die großen Ziele ([GROSSE_ZIELE_2026-11-04.md](GROSSE_ZIELE_2026-11-04.md)).

## 8. Umsetzung (4. November, auf Auftrag „mache alles“)

Alle sechs Punkte aus Abschnitt 7 sind umgesetzt, jeweils mit eigenen Tests. Gemessen wurde mit denselben Verläufen wie in der Prüfung (Seed 6, Schnellprofil).

| Befund | Vorher | Nachher | Wo |
|---|---|---|---|
| Iran greift an, NATO hilft | Niederlage in 14 Wochen (Front 35 → 0) | Front 58 → 99 in 9 Wochen | `data/kraefte.ts` (SIPRI-Ausgaben und Personal, gemeinsame Skala), `krieg.ts` |
| Kampfkraft in den ersten Wochen | 25 % (Treibstoff 0) | Öldeckung des Landes | `versorgung.ts` |
| Frontwege unter Beschuss | nach rund 5 Monaten ohne Nachschub | netto 5 % Schaden je Monat (Pioniere) | `transport.ts` |
| Waffenruhe | endlos, kostenloses Parken | Gegenangebot nach 30 Tagen, nach 120 Tagen Wiederaufnahme oder eingefroren | `krieg.ts` |
| Eigener Einstieg | nur monatelanges „Druck“ | Ultimatum, „Krise eröffnen“, Zwischenfälle auch ohne Spieler | `krieg.ts`, `KriegDossier.tsx` |
| „Verteidigung“ bei eigenem Angriff | +30 Stimmen | zählt wie „Schutz“ (UN-Charta Art. 51) | `krieg.ts`, `befehle.ts` |
| Neutrale und EU als Kriegspartei | Österreich, „EU“ kämpften | nie | `pakte.ts` |
| Wachstum im Krieg gegen Griechenland | 2,30 → 3,40 % | 2,30 → 1,73 % | Kreditkanal des Risikoaufschlags (`economy.ts`), Sanktionslast |
| Sanktionen gegen die Türkei | Lira 61,72 gegen 61,84, Reserven unberührt | Reserven 11,5 → 3,0 Mrd. $, Aufschlag +60 bp, Wachstum −0,4 | `diplomatie.ts`, `devisen.ts`, `economy.ts` |
| Türkei sanktioniert Russland | Reserven steigen, keine Folgen | Gegensanktion, Wachstum 1,9 → −1,8 %, Inflation +2,8 Punkte | Gegensanktion, Energiemangel (`gueter.ts`, `economy.ts`) |
| CAATSA | fehlte im Start; Klausel wirkungslos | gilt seit 12/2020; Vertrag hebt sie auf | `diplomatie.ts`, `abkommen.ts` |
| Warnungen | keine zu Protest, Putsch, Opposition, Groll, Ausschuss, Nachschub | alle mit Sprung zur Lösung; Hinweisfenster mit „Zur Akte“ | `briefing.ts`, `hinweisziel.ts` |
| Navigation | Politik versteckt; Krieg nur unter Außen; neunmal Vorgänge | Gruppe „Politik“; Konfliktlage in Sicherheit; Vorgänge nur in Land; klare Namen | `Stage.tsx`, `Bereiche.tsx`, Kataloge |
| Preise | Koalition retten 1 PK; Protestantworten ohne Wirkung | nach Fraktionsgröße bzw. Bewegungsgröße; Zustimmung reagiert; echte Zugeständnisse | `gespraeche.ts`, `bewegungen.ts` |
| Putsch | unerreichbar | Putschzirkel zählt, Stufe 3 ab 68, Generalstabschef tritt nicht selbst zurück; Überläufer bei Zustimmung < 35 | `enden.ts`, `spiel.ts` |
| Große Ziele | fehlten | sechs Ziele mit Stufen bis zur Utopie (siehe GROSSE_ZIELE) | `grosseziele.ts`, `GrosseZiele.tsx` |

**Noch offen:**

- **Krieg:** Verbände, Generäle und Delegation an den Generalstab (HOI4-Anspruch aus Abschnitt N). Gewonnene Kurzkriege stützen das Wachstum über die Kriegsausgaben.
- **Kräfteskala:** Saudi-Arabien liegt wegen hoher Rüstungsimporte über der Türkei; ohne Quelle für einen Korrekturfaktor bleibt das so.
- **Energie:** Ersatzbeschaffung am Weltmarkt (Spot-LNG zum Aufpreis) gibt es nur über „Quelle wechseln“.
- **Navigation:** eigener Zugang „Medienpolitik“ und das Gespräch in der Kopfleiste.
- **Gestaltung:** eigene Kopfmotive für Gesellschaft, Medien, Regierung und Wissen.
- **Aktualität:** F-35-Gespräche und US-Bankensanktionen (Iran) als Daten.
- **Bestehende Fehlschläge:** 13 Tests (Spielbarkeit, unbegrenzte Amtszeiten, Programme, Vorschaumodell, Wahlnachtrag, Katastrophe, Transitabkommen, Vorgang-Sprung) scheitern bereits im Stand vor dieser Arbeit (geprüft in einer Kopie von `5512005`). Sie sind Balancefragen und eine eigene Aufgabe.
