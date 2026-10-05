# GLM-Abschlussbericht: gesammelte Abgabe und Ausweitungsvorschläge (05.10.2026, Abend)

Auftrag: GLM_AUFTRAG_RECHERCHE.md vollständig abgearbeitet (Themen 1–10). Dieser Bericht listet alle Dateien und beantwortet die Schlussfrage des Projektinhabers: **wo lohnt eine Ausweitung der Recherche, um das Spiel zu verbessern?**

## 1. Alle Abgabedateien

| Nr. | Recherche (Projektstamm) | Datenentwurf (game/src/data/entwurf_glm/) | Kernbefund |
|---|---|---|---|
| 1 | RECHERCHE_GLM_1_HAUSHALT_RENTEN.md | haushalt.ts | Budget 2026: 18,929 Bio. TL; Zinsen 2,7 Bio.; Bildung 2,896 Bio. (15,3 %); 17,12 Mio. Rentner; Schätze-Transfer 1,4 Bio.; EYT 12,5 Mio./250 Mrd. |
| 2 | RECHERCHE_GLM_2_BILDUNG_WISSEN_TECHNOLOGIE.md | bildung.ts | PISA 2025: Naturwissenschaften 434→494 (+60, Rang 34→19); AR-GE 651,8 Mrd. TL, 310.473 FTE; Patente 10.186→11.394; **Innovationsgrenze als Code** |
| 3 | RECHERCHE_GLM_3_GUETER_RESSOURCEN.md | gueter.ts | Gas 56,4 Mrd. m³ (Russland 35 %); Bor 72 % Reserven/25 % Markt; Weizen 20,8 Mio. t/~9 importiert; Pharma-Deckung 37 %; 22 Vorkommen mit Koordinaten |
| 4 | RECHERCHE_GLM_4_STREITKRAEFTE_RUESTUNG.md | streitkraefte.ts | Türkiye-Bestand (F-16 240+, Leopard 2A4 316–334, TCG Anadolu, 6 Reis-U-Boote, SİPER 2025–29); **24-Länder-SIPRI-Vergleich**; ASELSAN 120 Mrd. TL, Baykar 1,8 Mrd. $ |
| 5 | RECHERCHE_GLM_5_MIT_BEHOERDEN.md | behoerden.ts | MIT nach Gesetz 2937 als Wortgröße; Justiz: 11,66 Mio. Verfahren, 24.641 Richter, Gefängnisse 124 %; 7.296 Steuerprüfer vs. 28,7 % Schattenwirtschaft; AFAD 8.541 |
| 6 | RECHERCHE_GLM_6_INFRASTRUKTUR.md | infrastruktur.ts | Otoyol 3.796 km; Bahn 13.919 km (YHT 2.251); 214 Mio. Flugpassagiere; 13,5 Mio. TEU; ~42 Mio. Wohnungen; 270.829 Betten; PPP-Garantiefall Çanakkale |
| 7 | RECHERCHE_GLM_7_GEOSTRATEGIE.md | (Daten in schauplaetze.ts) | Meerengen 40.172 Durchfahrten + Art. 19-Präzedenz 2022; BTC/TANAP/TurkStream; Kirkuk–Ceyhan still seit 3/2023; **Zangezur: 8.8.2025 Washington-Friedensschluss, 99-Jahres-US-Pacht („Trump Road")** |
| 8 | RECHERCHE_GLM_8_GESETZGEBUNG.md | (baut auf data/gesetze/*.ts auf) | 20 Felder → 24 Ausschüsse zugeordnet; Konflikt- und Kompromissmuster; Art. 89-Kalkül als Vorschlag |
| 9 | RECHERCHE_GLM_9_MENSCHEN_STATT_INDIKATOREN.md | (baut auf data/haushalte.ts auf) | 7 Haushalte; TÜİK-Anker 64.104 Lira Konsum (2025); Haushaltsbrief im Wirkungsbericht |
| 10 | RECHERCHE_GLM_10_KRIEGSSCHAUPAETZE.md | schauplaetze.ts | 5 Theater mit Akteuren/Gelände/Ressourcen; SDF-Abkommen 10.3.2025 gescheitert (Frist 31.12.2025); Qandil-Bergkrieg; Zangezur-Dreh |
| Zusatz | RECHERCHE_KRIEGSSCHAUPAETZE_2026-10-05.md (Verwaltungsgliederung, belegt) + RECHERCHE_GESETZGEBUNG_TUERKEI + RECHERCHE_TARIFRUNDEN_MINDESTLOHN + KI_PROJEKTE_UND_KARTE (aus vorheriger Runde) | fokus/erweiterungen.ts, forschung/erweiterung.ts, data/gesetze/* (20 Bausteine), data/haushalte.ts | — |

**Qualitätssicherung:** Alle neun Datenentwürfe kompilieren unter `--strict` (0 Fehler). Nur neue Dateien; nichts in sim/, ui/ oder bestehenden Datendateien geändert. Jede belegte Zahl mit Quelle, jede Lücke markiert; pro Datei eine „Unsicher oder unbelegt"-Liste.

## 2. Drei Weltbefunde, die das Spiel verändern (Kalibrierpflicht zum Stichtag 25.09.2026)

1. **Zangezur-Korridor ist US-gepachtet** (8.8.2025, 99 Jahre). Die Foki fok_aus_zangezur und die Mittleren-Korridor-Vorhaben brauchen Neutexte; die Karten der geostrategischen Linse brauchen die US-Route.
2. **Syrien hat einen neuen Staat** (Şara seit Dezember 2024) und ein **gescheitertes SDF-Integrationsabkommen** (10.3.2025, Frist 31.12.2025, Damaskus rückt 1/2026 nach). Der Friedensprozess-Baustein (g_friedensprozess) und der Rückkehrbaustein (g_rueckkehr) sind genau an dieser Lage zu kalibrieren.
3. **PISA-Sprung 2025** (+60 Punkte Naturwissenschaften, Rang 34→19) ist als historischer Oberwert einzubauen — das Qualitätszeichen darf ihn nicht als Normtempo nehmen.

## 3. Nachbesserung: Wo die Recherche ausgebaut werden sollte (nach Spielnutzen geordnet)

### Priorität A — direkt spielverbessernd (Lücken in gebauten Systemen)

1. **Tourismus** — die größte Devisenquelle fehlt als Zahlenblock: Besucherzahlen, Einnahmen, Herkunftsländer, Saisonalität, Kapazität (Betten), Konkurrenz (Griechenland, Ägypten). Primärquellen: TÜİK, Kultur- und Tourismusministerium. Betroffene Systeme: Wirtschaft, Außenlage, Ägäis-Krisenleiter (GLM_10), Belastung (GLM_6 Luft). Aufwand: eine Recherche-Datei, klein.
2. **Diaspora und Auslandstürken** — Zahl (Schätzbänder 5,5–6+ Mio.), Verteilung (Deutschland, Niederlande, Frankreich …), Devisenüberweisungen, Wahlverhalten (Auslandsurnen). Primärquellen: TÜİK/YDİK, Deutsche Bundesbank (Überweisungen), YSK. Betroffen: Diaspora-Kanal (gebaut), Wahlmodul, g_rueckkehr. Aufwand: klein.
3. **PISA 2025 im Detail** — Punktwerte für Lesen und Mathematik (nur Rangsprünge belegt) plus methodische Prüfung des Sprungs. Quellen: OECD-Bericht, MEB. Betroffen: GLM_2 Qualitätszeichen, Lernmodul. Aufwand: klein.
4. **Gesundheitssystem tiefer** — Ärztezahl je 1.000, Ärztemigration (Koppelt an GLM_2-Abwanderung), Wartelisten, Krebs-/Impfraten. Quellen: Sağlık-Yıllığı, TTB, OECD. Betroffen: m_aerztegehalt, Kliniklücken-Karte (GLM_6 5.4). Aufwand: mittel.
5. **Wasser- und Klimalagereihen** — Stauseestände je Becken (DSİ), Dürreindex, Grundwasser, Prognose bis 2040. Betroffen: Katastrophenkette, Weizenkalkulation (GLM_3 5.4), Dammzustrom (GLM_7 5.3). Aufwand: mittel.

### Priorität B — verfeinernd (Genauigkeit statt neue Systeme)

6. **Verkehrs- und Modal-Split-Reihen** (Güterbahnteil, Fracht t-km, Unfallzahlen) — kalibriert die Belastungsbalken (GLM_6 5.1/5.5). Quellen: TÜİK Verkehr, KGM, TCDD.
7. **Kommunalfinanzen** — Schulden der Großstädte, Municipal-Einnahmen (der Kommunalwahlzyklus 2029 ist gebaut; Rathäuser wirtschaften noch nicht). Quellen: TBB/TÜİK kommunale Statistiken.
8. **Medieneigentümer- und TV-Landschaft** — Gruppen, Reichweiten,RTÜK-Sanktionshistorie (Medienbaustein g_medienaufsicht wird konkreter). Quellen: RTÜK, Branchenberichte.
9. **Erneuerbare-Projektliste (YEKA-Ausschreibungen)** und Netzanschluss-Stau — kalibriert m_solar_wind/m_yeka_serie mit realen Bandbreiten. Quellen: EPDK, TEİAŞ.
10. **Wahldaten je Provinz (2018/2023/2024)** — Provinzergebnisse für die Wahlnacht-Hochrechnung und Rückhalt-Ebene. Quellen: YSK.

### Priorität C — für spätere Wellen

11. **Justiz im Einzelnen** (Verfahrensdauer je Fallart, AYM-Kassationen je Jahr) — für das Vorgangssystem.
12. **Bildungspersonal und Schulnetz je Provinz** — für die Provinzblätter (Vision Abschnitt 8).
13. **Rüstungsexportkunden-Dossiers** (wer kauft was — für die Exportkundenkonflikte aus GLM_4 5.3). Quellen: SIPRI TIV-Datenbank.
14. **Landwirtschaftspreise je Ernte** (Weizen-/Zucker-/Obstpreisreihen) — für die Haushaltsbriefe (GLM_9).

**Empfehlung:** Paket A (1–5) als nächste GLM-Runde mit fünf Dateien; Punkt 1 (Tourismus) zuerst, weil drei gebaute Systeme (Wirtschaft, Außenlage, Ägäis) unmittelbar davon gespeist werden.

## 3a. Nachtrag (Abend, 05.10.2026): Paket A ist ausgeführt

Die fünf Priorität-A-Ausweitungen sind abgearbeitet:

| Ausweitung | Datei | Kernbefund |
|---|---|---|
| 1. Tourismus | RECHERCHE_GLM_11_TURIZM.md + entwurf_glm/turizm.ts | **60,6 Mio. Besucher 2024 (Weltrang 3), 61,1 Mrd. $; 2025: 63,94 Mio., ~65,2 Mrd. $; Russland 6,9 Mio., Deutschland 6,75 Mio., UK 4,6 Mio.** |
| 2. Diaspora | RECHERCHE_GLM_12_DIASPORA.md + entwurf_glm/diaspora.ts | **7,5 Mio. im Ausland (6,5 Mio. Westeuropa); 3,42 Mio. Auslands-Wähler 2023, 1,91 Mio. gewählt**; Überweisungen als TCMB-EVDS-Lücke markiert |
| 3. PISA 2025 Detail | Nachtrag in RECHERCHE_GLM_2 (Abschnitt 2.1 ersetzt) | **Fen 494 (Rang 19), Lesen 472 (Rang 18), Mathe 462 (Rang 28); OECD-Schnitt 482/461/463; einziger OECD-Staat mit 10-Jahres-Aufstieg in allen Feldern** |
| 4. Gesundheit | RECHERCHE_GLM_14_GESUNDHEIT.md | **2.692 Auslandsgutachten 2024 (TTB) vs. 412 Vollzüge (Minister 2025) — Doppelzählung als Designidee**; 239 Ärzte je 100.000 (EU 402); ~1 Mrd. Arztbesuche |
| 5. Wasser/Klima | RECHERCHE_GLM_15_WASSER_KLIMA.md | **1.301 m³ je Kopf (2025), Projektion 1.200/1.116/1.069 (2030/40/50); Dürre 2025: Niederschlag −76,4 %, Ankara-Staudämme 19 %, İstanbul 23,12 %, danach 81,4 %** |

Beide neuen Datenentwürfe kompilieren unter `--strict` (0 Fehler); alle elf Entwürfe sind importfrei. Die Priorität-B- und C-Ausweitungen (Abschnitt 3) bleiben offen und sind nach Nutzenvorlauf zu bestellen.

## 4. Übergabe an die Stränge

- Die neun Entwürfe in `game/src/data/entwurf_glm/` sind bewusst importfrei und `--strict`-grün: Der jeweilige Strang kann sie als Vorgabewerte einlesen oder Feldweise übernehmen (jede Quelle ist als Feld dabei).
- Die drei Weltbefunde (Abschnitt 2) betreffen **gebaute** Systeme (Foki, Friedensprozess, Weltmodell) — dort sind Text- und Kalibrieränderungen nötig, nicht neue Mechanik.
- Die Konzepte KI_PROJEKTE_UND_KARTE (Belastung/Berater) und VISION_IM_DETAIL bleiben die Architekturübersicht; die GLM-Dateien liefern deren Zahlenunterlage.
