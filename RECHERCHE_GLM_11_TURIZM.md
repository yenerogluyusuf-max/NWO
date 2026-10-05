# GLM-Recherche 11: Tourismus (05.10.2026)

Ausweitungsrunde A1 (GLM_ABSCHLUSS_2026-10-05.md, Priorität A Punkt 1). Primärquellen: TÜİK (Turizm İstatistikleri), İletişim Başkanlığı, OECD. Stand: 05.10.2026. Tourismus ist die größte Devisenquelle nach Exporten und speist drei gebaute Systeme (Wirtschaft, Außenlage, Ägäis-Krisenleiter).

## 1. Kurzfassung

Türkiye ist mit 60,6 Millionen Besuchern 2024 das drittgrößte Reiseland der Welt (nach Frankreich und Spanien) und nahm 2025 mit 63,9 Millionen Besuchern und rund 65 Milliarden Dollar Einnahmen den nächsten Rekord. Die Herkunftsmischung ist gleichzeitig Stärke und Risiko: Russland (6,9 Mio.) und Deutschland (6,75 Mio.) tragen die Spitze, dahinter Großbritannien (~4,6 Mio.) — zwei der drei Säulen hängen an geopolitisch belasteten Beziehungen (Russland-Krieg, Währungskrise des Pound-/Rubel-Raums). Für das Spiel: Tourismus wird als fünfte Exportgröße mit Saisonalität und Herkunftsländern geführt; jede Außenkrise (Ägäis, Schwarzes Meer, Währung) schlägt sofort auf die Einnahmeline durch, und der Sommer ist ein eigener Entscheidungsraum (Visa, Werbung, Strandwahl, Krisenlage).

## 2. Befund: Zahlen mit Quellen

| Posten | Wert | Quelle |
|---|---|---|
| Besucher 2024 | **60,6 Mio. (+10 %); Weltrang 3** (Frankreich 102 Mio., Spanien 93,8 Mio.) | TÜİK/İletişim 1.2.2025 (Weltrangauswertung) |
| Tourismuseinnahmen 2024 | **61,1 Mrd. $ (Rekord, +8,3 %)** | TÜİK |
| Davon im Ausland lebende Türkischstämmige | 15,4 % (9,6 Mio. Besucher) | İletişim/TÜİK-Auswertung |
| Besucher 2025 | **63,94 Mio. (Rekord)** | TÜİK Q4-2025-Bulletin (veriportali) |
| Einnahmen 2025 | **~65,2 Mrd. $** | OECD-konforme Auswertung (Presse) |
| Herkunft 2025 | Russland **6,9 Mio.**, Deutschland **6,75 Mio.**, Großbritannien **~4,6 Mio.**; Jan–Aug: RU 4,55, DE 4,40, UK 3,0 | TÜİK-Monatsreihen (Presseauswertung) |
| Saison | Sommerlast im Antalya-/Ägäis-Gürtel; Stadt- und Winterformen wachsen (İstanbul, Kappadokien) — genaue Quartalsverteilung **Lücke** (TÜİK-Q-Bulletin auswerten) | — |
| Betten/Kapazität | **Lücke** (Kültür ve Turizm Bakanlığı-Bettendaten auswerten) | — |
| Konkurrenz | Griechenland, Spanien, Ägypten (Preiskampf, Qualitätswettlauf) — Zahlen **zu prüfen** | — |

## 3. Zusammenhänge (Richtung, Verzug)

| Kante | Richtung | Verzug | Beleg/Lücke |
|---|---|---|---|
| Währung (schwache Lira) → Besucherzahl und Einnahmen in $ | + | 1 Saison | Rekordjahre 2023–2025 fielen in die Abwertungsphase (TÜİK-Reihe) |
| Geopolitik (Russland-Krieg, Israel-Iran) → Herkunftsländer springen | ± | 1 Saison | Russland als Nr. 1 ist ein Beziehungsklotz (GLM_4/7) |
| Ägäis-/Meerengen-Krise → Stornowelle | − | sofort bis 1 Monat | GLM_10 Krisenleiter; Suez-Umleitung hebt Transitläden, senkt Badetourismus (zu prüfen) |
| Hitze/Waldbrand (GLM_15) → Sommerdestinationen | − | 1 Saison | Katastrophenkette; Fall 2021 Antalya (qualitativ) |
| Bettenkapazität → Einnahmendeckel | + | 2–4 Jahre | Lücke (Bettendaten) |
| Tourismus → Beschäftigung und Mieten der Küstenprovinz | + | sofort | qualitativ; TÜİK-Beschäftigungsreihen auswerten |
| Übertourismus (İstanbul, Kappadokien) → Milieugroll | − | 1–2 Jahre | qualitativ; Lücke |

## 4. Anschluss im Code

- `sim/wirtschaft*.ts` (Exportlinie): Tourismus als zweiter Devisenblock neben Gütern (GLM_3); Startwert 61,1 Mrd. $ (2024) bzw. 65,2 (2025).
- `sim/diplomatie.ts` (Außenlage): Herkunftsländer (Russland, Deutschland, UK) als Beziehungskanten mit Tourismus-Rückwirkung; Kriegsszenarien testen die Mischung.
- `sim/maerkte.ts`: Marktschocks „Stornowelle" (Geopolitik, Katastrophe) und „Sommerrekord".
- `data/linien.ts`/`sim/linie.ts`: Küsten-Milieus (Antalya, Muğla, İzmir) reagieren auf Visum- und Werbepolitik.
- `sim/katastrophe.ts`: Waldbrand-Ereignisse drücken die Saison der betroffenen Provinz.
- `ui/atlas` (Karte): Tourismus-Linse (Sommerlast je Provinz) — Ankern an die Vorkommen (GLM_3) und Netze (GLM_6).

## 5. Integrationsvorschläge

### 5.1 Tourismuslinie mit Herkunftsmischung (Kernbaustein)

- **Entscheidung:** Kein neuer Regler; die Einnahmeline reagiert auf Währung, Außenkrise und Werbung. Der Spieler steuert über drei Hebel: Visapolitik ( locker/streng), Werbeetate (m_tourismuswerbung existiert), Zielland-Diversifizierung (Kampagnen für neue Märkte: Asien, Golf).
- **Folgen:** Kurz: Saison- und Quartalszahlen; lang: Mischung (Russland-Abhängigkeit senken = Stornorisiko senken, aber Werbekosten). Verlierer bei Streng-Visum: Hotel-/Reisebüro-Milieus; Gewinner: kurz weniger Grenzdruck.
- **Gegenspieler:** Reiseverbände (TÜRSAB), Hotelierkammern, Herkunftsländer (Gegenvorschreiben), Umweltorganisationen (Übertourismus).
- **Anzeige:** Wirtschaftsakte: Tourismus-Einnahmeline mit Herkunftsbalken; Karte: Sommerlast je Provinz; Ereignis „Stornowelle".
- **Daten:** `game/src/data/entwurf_glm/turizm.ts`.
- **Aufwand:** klein bis mittel.
- **Spieltest:** Spaß, wenn eine Russland-Krise die Balken sichtbar verschiebt und der Spieler die Diversifizierungskampagne von zwei Jahren vorher erntet.

### 5.2 Saisonalität als Sommerfenster

- **Entscheidung:** Keine direkte; der Sommer (Juni–September) ist ein eigener Entscheidungsraum mit eigenem Ereignisset (Waldbrand, Wassernot, Gäste-Rekorde, Lohnstreiks in Hotels).
- **Folgen:** Entscheidungen haben Saisonpreise (Streik im Juli kostet doppelt); Winter baut Kapazität.
- **Gegenspieler:** Hotelgewerkschaften, Kommunen, Umweltverbände.
- **Anzeige:** Schreibtisch-Kalender-Eintrag „Saison"; Regionalkarte mit Last.
- **Daten:** Felder im Entwurfsfile (`saison`).
- **Aufwand:** klein.
- **Spieltest:** Erfolgreich, wenn der Spieler den Sommer plant wie eine Saison eines Fußballvereins — mit Verletzungsrisiko (Katastrophen).

## 6. Verworfen

- **Hotelfirmen als Akteure:** Realanker in Texten; keine Firmensimulation.
- **Flugrouten- und Slot-Simulation:** GLM_6-Luftnetz trägt die Kapazität.
- **Kreuzfahrt als eigener Markt:** Teil des Seegüterblocks (GLM_3/6), kein eigenes Fenster.

## 7. Vorbilder

- **Civ 6:** Tourismus als Siegweg (Kultur) — übernommen: Tourismus als sichtbare Erfolgsgröße mit Karte.
- **Victoria 3:** Migration/Tourismus als Marktflüsse — verworfen als Simulation, übernommen als Herkunftsmischung.
- **Democracy 4:** keine Tourismusmechanik; die Milieukante (Küstenbeschäftigte) ist die D4-artige Wirkung.

## 8. Unsicher oder unbelegt

1. Bettenkapazität und Quartalsverteilung: Kültür ve Turizm Bakanlığı/TÜİK-Q-Bulletin auswerten.
2. Konkurrenzlandzahlen (Griechenland, Spanien, Ägypten 2025): UNWTO/OECD beschaffen.
3. Übertourismus-Indikatoren (İstanbul, Kappadokien): Lücke.
4. Beschäftigungsanteil Tourismus: TÜİK-Arbeitsmarktreihen auswerten.
5. 2025-Einnahmen ~65,2 Mrd. $: OECD-konforme Presseauswertung — TÜİK-Q4-Bulletin als Endquelle.
